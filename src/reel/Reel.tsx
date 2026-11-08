import {useMemo, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp01} from '../mc/theme';
import {Sfx, mcSound, reelSfx} from './kit';
import {S10_FRAMES, S6_FRAMES, S7_FRAMES, S8_FRAMES, S9_FRAMES, ShotDayCycle, ShotEnchant, ShotEnd, ShotHud, ShotMenu} from './shotsB';
import {S1_FRAMES, S2_FRAMES, S3_FRAMES, S4_FRAMES, S5_FRAMES, ShotCraft, ShotHotbar, ShotOpen, ShotSettings, ShotToast} from './shotsA';
import {TRANSITIONS, type TransitionDef} from './transitions';

/**
 * The effects reel: ten Ore-style shots joined by nine different transitions, one continuous take.
 * Cut-type transitions (overlay covers the screen, B takes over at the midpoint) start the next shot a
 * few frames before the cut; dual-type transitions (both shots move) overlap the full transition.
 */

const SHOTS: {id: string; dur: number; C: FC; tr?: keyof typeof TRANSITIONS}[] = [
  {id: 'open', dur: S1_FRAMES, C: ShotOpen, tr: 'mosaic'},
  {id: 'hotbar', dur: S2_FRAMES, C: ShotHotbar, tr: 'push'},
  {id: 'craft', dur: S3_FRAMES, C: ShotCraft, tr: 'zoom'},
  {id: 'toast', dur: S4_FRAMES, C: ShotToast, tr: 'curtain'},
  {id: 'settings', dur: S5_FRAMES, C: ShotSettings, tr: 'loading'},
  {id: 'menu', dur: S6_FRAMES, C: ShotMenu, tr: 'sweep'},
  {id: 'day', dur: S7_FRAMES, C: ShotDayCycle, tr: 'portal'},
  {id: 'enchant', dur: S8_FRAMES, C: ShotEnchant, tr: 'tnt'},
  {id: 'hud', dur: S9_FRAMES, C: ShotHud, tr: 'glitch'},
  {id: 'end', dur: S10_FRAMES, C: ShotEnd},
];

const CUT = new Set(['mosaic', 'curtain', 'loading', 'sweep', 'portal']);
const LEAD = 6; // frames of the next shot that run before a cut

type Placed = {id: string; C: FC; start: number; end: number; out?: {def: TransitionDef; ts: number}; inc?: {def: TransitionDef; ts: number}};

const layout = (): {placed: Placed[]; total: number} => {
  const placed: Placed[] = [];
  SHOTS.forEach((s, i) => {
    const prev = placed[i - 1];
    const prevTr = i > 0 ? SHOTS[i - 1].tr : undefined;
    let start = 0;
    let inc: Placed['inc'];
    if (prev && prevTr) {
      const def = TRANSITIONS[prevTr];
      const ts = prev.end - def.frames;
      start = CUT.has(prevTr) ? prev.end - Math.round(def.frames / 2) - LEAD : ts;
      inc = {def, ts};
      prev.out = {def, ts};
    }
    placed.push({id: s.id, C: s.C, start, end: start + s.dur, inc});
  });
  return {placed, total: placed[placed.length - 1].end};
};

const LAYOUT = layout();
export const REEL_FRAMES = LAYOUT.total;

const srcOf = (s: string) => (s.startsWith('mc:') ? mcSound(s.slice(3)) : reelSfx(s.slice(s.indexOf(':') + 1)));

const Strips: FC<{count: number; shift: (i: number) => number; children: ReactNode}> = ({count, shift, children}) => (
  <AbsoluteFill>
    {Array.from({length: count}, (_, i) => (
      <div key={i} style={{position: 'absolute', inset: 0, clipPath: `inset(${(i * 100) / count}% 0 ${100 - ((i + 1) * 100) / count}% 0)`, transform: `translateX(${shift(i)}px)`}}>
        {children}
      </div>
    ))}
  </AbsoluteFill>
);

export const Reel: FC = () => {
  const f = useCurrentFrame();
  const active = useMemo(() => LAYOUT.placed, []);
  const overlays: {def: TransitionDef; p: number}[] = [];
  active.forEach((s) => {
    if (s.out && f >= s.out.ts && f < s.out.ts + s.out.def.frames) overlays.push({def: s.out.def, p: (f - s.out.ts) / s.out.def.frames});
  });
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {active.map((s) => {
        let style: CSSProperties = {};
        let strips: {count: number; shift: (i: number) => number} | undefined;
        if (s.out && f >= s.out.ts && f < s.out.ts + s.out.def.frames) {
          const p = (f - s.out.ts) / s.out.def.frames;
          style = {...style, ...s.out.def.a?.(p)};
          const st = s.out.def.strips;
          if (st) strips = {count: st.count, shift: (i) => st.a(p, i)};
        }
        if (s.inc && f >= s.inc.ts && f < s.inc.ts + s.inc.def.frames) {
          const p = (f - s.inc.ts) / s.inc.def.frames;
          style = {...style, ...s.inc.def.b?.(p)};
          const st = s.inc.def.strips;
          if (st) strips = {count: st.count, shift: (i) => st.b(p, i)};
        }
        const C = s.C;
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.end - s.start} name={s.id}>
            <div style={{position: 'absolute', inset: 0, isolation: 'isolate', ...style}}>
              {strips ? (
                <Strips count={strips.count} shift={strips.shift}>
                  <C />
                </Strips>
              ) : (
                <C />
              )}
            </div>
          </Sequence>
        );
      })}
      {overlays.map(({def, p}) => {
        const O = def.overlay;
        return O ? <O key={def.id} p={p} /> : null;
      })}
      {active.flatMap((s) =>
        s.out
          ? s.out.def.cues.map((c, i) => <Sfx key={`${s.id}-${i}`} at={s.out!.ts + c.at} src={srcOf(c.src)} volume={c.volume} rate={c.rate} />)
          : [],
      )}
      <Audio src={staticFile('audio/bgm/bgm-tech-house.mp3')} volume={(fr) => 0.5 * clamp01(fr / 24) * (1 - clamp01((fr - (REEL_FRAMES - 40)) / 40))} />
    </AbsoluteFill>
  );
};
