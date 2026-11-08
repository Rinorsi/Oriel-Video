import {useMemo, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp01} from '../mc/theme';
import {Sfx, mcSound, reelSfx} from '../reel/kit';
import type {TransitionDef} from '../reel/transitions';
import type {LibTransition, SeriesShot} from './types';

/**
 * Transitions as a library: normalise the two internal definition styles into `LibTransition`, then chain shots with
 * <TransitionSeries>. Use this in a real video; the gallery demos are built the same way.
 *
 *   const shots = [{dur: 150, C: IntroShot}, {dur: 240, C: DungeonShot}, {dur: 180, C: EndShot}];
 *   <TransitionSeries shots={shots} transitions={[mcdBlackCut, mcdPortalWhiteout]} />
 *
 * Total length = sum(dur) - sum(overlaps); use `seriesFrames(shots, transitions)` for the composition's durationInFrames.
 */

const CUT_IDS = new Set(['mosaic', 'curtain', 'loading', 'sweep', 'portal']);

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

/** Turn an old-style `TransitionDef` (reel/transitions.tsx, cute/*, trans2/*) into a `LibTransition`. */
export const fromDef = (def: TransitionDef & {mode?: 'cut' | 'dual'}): LibTransition => {
  const cut = def.mode ? def.mode === 'cut' : CUT_IDS.has(def.id);
  const T = def.frames;
  const O = def.overlay;
  const Scene: LibTransition['Scene'] = ({p, A, B}) => {
    const wrap = (C: FC, style: CSSProperties, strips: {count: number; shift: (i: number) => number} | undefined) => (
      <div style={{position: 'absolute', inset: 0, isolation: 'isolate', ...style}}>
        {strips ? (
          <Strips count={strips.count} shift={strips.shift}>
            <C />
          </Strips>
        ) : (
          <C />
        )}
      </div>
    );
    const st = def.strips;
    const aStrips = st ? {count: st.count, shift: (i: number) => st.a(p, i)} : undefined;
    const bStrips = st ? {count: st.count, shift: (i: number) => st.b(p, i)} : undefined;
    const showB = cut ? p >= 0.5 - 6 / T : true;
    return (
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        {wrap(A, def.a?.(p) ?? {}, aStrips)}
        {showB && wrap(B, def.b?.(p) ?? {}, bStrips)}
        {O && <O p={p} />}
      </AbsoluteFill>
    );
  };
  return {
    id: def.id,
    name: def.name,
    frames: T,
    bStart: cut ? Math.round(T / 2) - 6 : 0,
    Scene,
    Overlay: cut && O ? ({p}) => <O p={p} /> : undefined,
    cues: def.cues,
  };
};

/** The overlap length contributed by a transition when chained (A and B both alive for `frames`, B starts at `bStart`). */
const overlapOf = (t: LibTransition) => t.frames - t.bStart;

/** Frames for a composition holding these shots. `dur` of each shot includes its transition overlaps. */
export const seriesFrames = (shots: SeriesShot[], transitions: LibTransition[]) =>
  shots.reduce((n, s) => n + s.dur, 0) - transitions.reduce((n, t) => n + overlapOf(t), 0);

type Placed = {start: number; end: number; C: FC};

/**
 * Chain shots with a transition between each pair (transitions[i] sits between shots[i] and shots[i+1]).
 * Pass fewer transitions than gaps to leave hard cuts (a missing transition is a straight cut).
 * Set `audio` false to mute transition cues.
 */
export const TransitionSeries: FC<{shots: SeriesShot[]; transitions: (LibTransition | null | undefined)[]; audio?: boolean}> = ({shots, transitions, audio = true}) => {
  const f = useCurrentFrame();
  const plan = useMemo(() => {
    const placed: Placed[] = [];
    const windows: {start: number; t: LibTransition; ai: number; bi: number; A: FC; B: FC}[] = [];
    shots.forEach((s, i) => {
      let start = 0;
      if (i > 0) {
        const prev = placed[i - 1];
        const t = transitions[i - 1];
        if (t) {
          const ws = prev.end - t.frames;
          start = ws + t.bStart;
          windows.push({start: ws, t, ai: i - 1, bi: i, A: () => null, B: () => null});
        } else start = prev.end;
      }
      placed.push({start, end: start + s.dur, C: s.C});
    });
    // wrapper components are created ONCE per window (stable identity => no remount every frame)
    for (const w of windows) {
      const a = placed[w.ai];
      const b = placed[w.bi];
      const AC = a.C;
      const BC = b.C;
      w.A = () => (
        <Sequence from={a.start - w.start} durationInFrames={a.end - a.start} layout="none">
          <AC />
        </Sequence>
      );
      w.B = () => (
        <Sequence from={b.start - w.start} durationInFrames={b.end - b.start} layout="none">
          <BC />
        </Sequence>
      );
    }
    return {placed, windows};
  }, [shots, transitions]);
  const inWindow = plan.windows.find((w) => f >= w.start && f < w.start + w.t.frames);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {plan.placed.map((s, i) => {
        // a shot taking part in the active transition is drawn by the transition itself
        if (inWindow && (inWindow.ai === i || inWindow.bi === i)) return null;
        // B mounts at its own start; before that it must not draw
        if (f < s.start || f >= s.end) return null;
        const C = s.C;
        return (
          <Sequence key={i} from={s.start} durationInFrames={s.end - s.start}>
            <AbsoluteFill>
              <C />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {inWindow && (
        <Sequence from={inWindow.start} durationInFrames={inWindow.t.frames} layout="none">
          <TransitionBody t={inWindow.t} A={inWindow.A} B={inWindow.B} />
        </Sequence>
      )}
      {audio &&
        plan.windows.flatMap((w) => w.t.cues.map((c, i) => <Sfx key={`${w.start}-${i}`} at={w.start + c.at} src={srcOf(c.src)} volume={c.volume} rate={c.rate} />))}
    </AbsoluteFill>
  );
};

const TransitionBody: FC<{t: LibTransition; A: FC; B: FC}> = ({t, A, B}) => {
  const f = useCurrentFrame();
  const p = clamp01(f / t.frames);
  const S = t.Scene;
  return <S p={p} f={f} A={A} B={B} />;
};

/**
 * Overlay-only use: draw a cut-type transition's transparent layer over your own footage (inside a <Sequence>).
 * `Overlay` exists only for cut-type transitions. For the editor workflow export it with `npm run fx -- export <id> --alpha`.
 */
export const TransitionOverlay: FC<{t: LibTransition}> = ({t}) => {
  const f = useCurrentFrame();
  const p = clamp01(f / t.frames);
  const O = t.Overlay;
  return <AbsoluteFill>{O && f < t.frames && <O p={p} f={f} />}</AbsoluteFill>;
};

void Audio;
void staticFile;
