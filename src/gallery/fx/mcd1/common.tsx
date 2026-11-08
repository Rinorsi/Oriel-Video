// mcd1 shared harness: a transition is a <Scene p f A B> composition (full frame) plus an optional transparent <Overlay p f>.
//   p = 0..1 progress of the transition body, f = frames since the body started (can be < 0 or > frames).
//   Demo  : 20 frames of A, the body, 20 frames of B (same lead/tail as gallery/transition.tsx).
//   Layer : the Overlay alone on transparent, only during the body (cut-type transitions, for export over real footage).
import type {ComponentProps, CSSProperties, FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import type {FxEntry, FxMeta} from '../../types';

export const LEAD = 20;
export const TAIL = 20;

export type Cue = {at: number; src: string; volume?: number; rate?: number};
export type SceneProps = {p: number; f: number; A: FC; B: FC};
export type OverlayProps = {p: number; f: number};

export type MDef = {
  /** Frames of the transition body (the demo adds LEAD + TAIL). */
  frames: number;
  Scene: FC<SceneProps>;
  Overlay?: FC<OverlayProps>;
  cues: Cue[];
};

const srcOf = (s: string) => (s.startsWith('mc:') ? mcSound(s.slice(3)) : reelSfx(s.slice(s.indexOf(':') + 1)));

/** Plates used as the demo A / B shots. */
export const plate = (biome: BiomeId, extra: Partial<ComponentProps<typeof ScenePlate>> = {}): FC => () => <ScenePlate biome={biome} {...extra} />;

export const MDemo: FC<{def: MDef; A: FC; B: FC}> = ({def, A, B}) => {
  const frame = useCurrentFrame();
  const f = frame - LEAD;
  const p = clamp01(f / def.frames);
  const S = def.Scene;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <S p={p} f={f} A={A} B={B} />
      {def.cues.map((c, i) => (
        <Sfx key={i} at={LEAD + c.at} src={srcOf(c.src)} volume={c.volume} rate={c.rate} />
      ))}
    </AbsoluteFill>
  );
};

export const MLayer: FC<{def: MDef}> = ({def}) => {
  const frame = useCurrentFrame();
  const f = frame - LEAD;
  const p = clamp01(f / def.frames);
  const O = def.Overlay;
  return <AbsoluteFill>{O && f >= 0 && f < def.frames && <O p={p} f={f} />}</AbsoluteFill>;
};

export const mEntry = (def: MDef, meta: Omit<FxMeta, 'frames' | 'category'>, A: FC, B: FC): FxEntry => ({
  meta: {category: 'rpg', frames: LEAD + def.frames + TAIL, ...meta},
  Demo: () => <MDemo def={def} A={A} B={B} />,
  Layer: def.Overlay ? () => <MLayer def={def} /> : undefined,
});

// ---------------------------------------------------------------------------------------------------------------------
// tiny helpers

export const ss = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Quantise a 0..1 value to n hard steps (the game animates in steps). */
export const stepQ = (v: number, n: number) => Math.round(clamp01(v) * n) / n;
/** Integer hash -> 0..1 (deterministic). */
export const hash = (a: number, b = 0, c = 0) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

export const FULL: CSSProperties = {position: 'absolute', inset: 0};

export const GOLD = {title: '#FEC304', hi: '#FFE680', warm: '#F8D868', deep: '#F19D07', shadow: '#2A1600', place: '#FDD467', small: '#FDF7EA'};
