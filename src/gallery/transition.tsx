import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp01} from '../mc/theme';
import {Sfx, mcSound, reelSfx} from '../reel/kit';
import {TRANSITIONS, type TransitionDef} from '../reel/transitions';
import {PlateA, PlateB} from './plates';
import type {Category, FxEntry, FxMeta} from './types';

/**
 * Turns a TransitionDef (see reel/transitions.tsx) into a gallery entry.
 *   Demo  : plate A -> transition -> plate B, with a short lead-in and tail.
 *   Layer : (cut-type only) the overlay alone on transparent, animated across the transition, for export.
 * New transitions: write a TransitionDef, then call `transitionEntry(def, {...meta})`.
 */

const LEAD = 20;
const TAIL = 20;
const CUT_IDS = new Set(['mosaic', 'curtain', 'loading', 'sweep', 'portal']);

/** Cut-type: an overlay covers the screen and B takes over at the midpoint. Dual-type: both shots move. */
export const isCut = (def: TransitionDef & {mode?: 'cut' | 'dual'}) => (def.mode ? def.mode === 'cut' : CUT_IDS.has(def.id));

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

export const transitionFrames = (def: TransitionDef) => LEAD + def.frames + TAIL;

export const TransitionDemo: FC<{def: TransitionDef & {mode?: 'cut' | 'dual'}; A?: FC; B?: FC}> = ({def, A = PlateA, B = PlateB}) => {
  const f = useCurrentFrame();
  const T = def.frames;
  const cut = isCut(def);
  const inWin = f >= LEAD && f < LEAD + T;
  const p = clamp01((f - LEAD) / T);
  const bStart = cut ? LEAD + Math.round(T / 2) - 6 : LEAD;
  const aGone = f >= LEAD + T;
  let aStyle: CSSProperties = {};
  let bStyle: CSSProperties = {};
  let aStrips: {count: number; shift: (i: number) => number} | undefined;
  let bStrips: typeof aStrips;
  if (inWin) {
    aStyle = def.a?.(p) ?? {};
    bStyle = def.b?.(p) ?? {};
    if (def.strips) {
      const st = def.strips;
      aStrips = {count: st.count, shift: (i) => st.a(p, i)};
      bStrips = {count: st.count, shift: (i) => st.b(p, i)};
    }
  }
  const O = def.overlay;
  const wrap = (C: FC, style: CSSProperties, strips: typeof aStrips) => (
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
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {!aGone && wrap(A, aStyle, aStrips)}
      {f >= bStart && wrap(B, bStyle, bStrips)}
      {inWin && O && <O p={p} />}
      {def.cues.map((c, i) => (
        <Sfx key={i} at={LEAD + c.at} src={srcOf(c.src)} volume={c.volume} rate={c.rate} />
      ))}
    </AbsoluteFill>
  );
};

export const TransitionLayer: FC<{def: TransitionDef}> = ({def}) => {
  const f = useCurrentFrame();
  const p = clamp01((f - LEAD) / def.frames);
  const O = def.overlay;
  return <AbsoluteFill>{f >= LEAD && f < LEAD + def.frames && O && <O p={p} />}</AbsoluteFill>;
};

export const transitionEntry = (def: TransitionDef & {mode?: 'cut' | 'dual'}, meta: Omit<FxMeta, 'id' | 'frames' | 'category'> & {id?: string; category?: Category}): FxEntry => ({
  meta: {id: meta.id ?? def.id, category: meta.category ?? 'transition', frames: transitionFrames(def), ...meta},
  Demo: () => <TransitionDemo def={def} />,
  Layer: isCut(def) && def.overlay ? () => <TransitionLayer def={def} /> : undefined,
});

export {TRANSITIONS};
