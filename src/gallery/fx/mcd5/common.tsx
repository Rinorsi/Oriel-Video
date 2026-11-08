// mcd5 shared helpers: scene backdrop, pixel burst / cross flash, shine sweep, small pixel icons, tiny timeline utils.
// Everything is deterministic (mulberry32) and driven by useCurrentFrame().
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ScenePlate, type BiomeId} from '../mcdscene';
import {MCD, McdText, PxArt, type Pal} from '../mcdkit/kit';

export {Pop, Rise, countUp, win} from '../mcdkit/common';
export type {BiomeId};

/** Quantise t (0..1) into n hard steps. */
export const stepQ = (t: number, n: number) => Math.round(clamp01(t) * n) / n;

/** Hard-stepped ease-out: the Dungeons UI moves in steps, not smoothly. */
export const stepOut = (t: number, n = 6) => stepQ(EASE.out(clamp01(t)), n);

/** Scene backdrop for the demos: a lit voxel scene dimmed by a blue-black wash so UI reads on top. */
export const SceneBg: FC<{biome: BiomeId; dim?: number; tint?: string; seed?: number; camera?: 'drift' | 'push' | 'pull' | 'static'; children?: ReactNode}> = ({biome, dim = 0.45, tint = '8,10,20', seed, camera = 'drift', children}) => (
  <AbsoluteFill style={{background: '#06080C'}}>
    <ScenePlate biome={biome} seed={seed} camera={camera} />
    <AbsoluteFill style={{background: `rgba(${tint},${dim})`}} />
    {children}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------------------------------- pixel fx

/** Plus-shaped pixel flash (grows 5 frames, then thins out). Centred on (x, y). No rings. */
export const CrossFlash: FC<{x: number; y: number; at: number; arm?: number; thick?: number; color?: string; dur?: number}> = ({x, y, at, arm = 140, thick = 12, color = '#FFF6C0', dur = 14}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f >= dur) return null;
  const grow = EASE.out(clamp01(f / 4));
  const fade = f < 4 ? 1 : 1 - (f - 4) / (dur - 4);
  const L = Math.round((arm * grow) / 4) * 4;
  const T = Math.max(4, Math.round((thick * (0.4 + 0.6 * fade)) / 4) * 4);
  const op = Math.round(fade * 4) / 4;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: op, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x - L, top: y - T / 2, width: L * 2, height: T, background: color}} />
      <div style={{position: 'absolute', left: x - T / 2, top: y - L, width: T, height: L * 2, background: color}} />
      <div style={{position: 'absolute', left: x - T, top: y - T, width: T * 2, height: T * 2, background: '#fff'}} />
    </div>
  );
};

/** Square pixel debris flying out of (x, y) with gravity; stepped to the 4 px grid. */
export const Burst: FC<{x: number; y: number; at: number; count?: number; seed?: number; colors?: string[]; speed?: number; life?: number; size?: number; gravity?: number; up?: number}> = ({
  x,
  y,
  at,
  count = 18,
  seed = 3,
  colors = [MCD.title, '#FFF6C0', MCD.gold],
  speed = 1,
  life = 26,
  size = 12,
  gravity = 0.55,
  up = 0.35,
}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life + 12) return null;
  const rnd = mulberry32(seed * 131 + 7);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const a = rnd() * Math.PI * 2;
        const v = (6 + rnd() * 14) * speed;
        const lf = life * (0.6 + rnd() * 0.4);
        const sz = Math.max(4, Math.round((size * (0.5 + rnd() * 0.8)) / 4) * 4);
        const c = colors[Math.floor(rnd() * colors.length)];
        if (f > lf) return null;
        const t = f;
        const k = 1 - Math.pow(1 - clamp01(t / lf), 2);
        const px = x + Math.cos(a) * v * lf * 0.55 * k;
        const py = y + Math.sin(a) * v * lf * 0.55 * k * (1 - up) - v * lf * 0.12 * k * up + gravity * t * t * 0.5;
        const blink = t > lf * 0.7 && t % 3 === 0 ? 0 : 1;
        return <div key={i} style={{position: 'absolute', left: Math.round(px / 4) * 4, top: Math.round(py / 4) * 4, width: sz, height: sz, background: c, opacity: blink, boxShadow: sz >= 8 ? `inset ${sz / 4}px ${sz / 4}px 0 rgba(255,255,255,0.55)` : undefined}} />;
      })}
    </div>
  );
};

/** Diagonal highlight band sweeping across its parent (parent must be position:relative + overflow:hidden). */
export const Shine: FC<{at: number; dur?: number; w?: number; opacity?: number; color?: string; skew?: number; style?: CSSProperties}> = ({at, dur = 14, w = 90, opacity = 0.35, color = '#fff', skew = -20, style}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > dur) return null;
  const t = stepQ(f / dur, 8);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style}}>
      <div style={{position: 'absolute', top: -20, bottom: -20, left: `${-20 + t * 140}%`, width: w, background: color, opacity, transform: `skewX(${skew}deg)`}} />
      <div style={{position: 'absolute', top: -20, bottom: -20, left: `calc(${-20 + t * 140}% + ${w * 1.5}px)`, width: w * 0.3, background: color, opacity: opacity * 0.8, transform: `skewX(${skew}deg)`}} />
    </div>
  );
};

/** Thin gold rule with diamond ends (title-card flourish). */
export const GoldRule: FC<{w: number; color?: string; style?: CSSProperties}> = ({w, color = MCD.gold, style}) => (
  <div style={{position: 'relative', width: w, height: 16, flex: 'none', ...style}}>
    <div style={{position: 'absolute', left: 16, right: 16, top: 7, height: 2, background: color, opacity: 0.8}} />
    {[0, 1].map((i) => (
      <div key={i} style={{position: 'absolute', [i ? 'right' : 'left']: 0, top: 2, width: 12, height: 12, background: color, transform: 'rotate(45deg)', boxShadow: '0 0 0 2px #000'}} />
    ))}
  </div>
);

/** Small gray diamond bullet used by the mission panel rows. */
export const BulletDiamond: FC<{size?: number; color?: string; hole?: string}> = ({size = 28, color = '#8A8A92', hole = '#16161A'}) => (
  <svg width={size} height={size} viewBox="0 0 10 10" style={{flex: 'none'}}>
    <polygon points="5,0 10,5 5,10 0,5" fill={color} />
    <polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill={hole} />
  </svg>
);

// ---------------------------------------------------------------------------------------------------- pixel icons

export const CHECK_ROWS = ['.......kk', '......kkk', '.....kkk.', 'kk..kkk..', 'kkkkkk...', '.kkkk....', '..kk.....'];
export const THUMB_ROWS = [
  '......kk....',
  '.....kkk....',
  '.....kk.....',
  '....kkk.....',
  'kkk.kkkkkkk.',
  'kkk.kkkkkkkk',
  'kkk.kkkkkkkk',
  'kkk.kkkkkkk.',
  'kkk.kkkkkkk.',
  'kkk..kkkkk..',
];
export const COIN_ROWS = [
  '..kkkkkk..',
  '.kkkkkkkk.',
  'kkkk..kkkk',
  'kkk.kk.kkk',
  'kkk.kk.kkk',
  'kkk.kk.kkk',
  'kkk.kk.kkk',
  'kkkk..kkkk',
  '.kkkkkkkk.',
  '..kkkkkk..',
];
export const STAR_ROWS = [
  '.....kk.....',
  '.....kk.....',
  '....kkkk....',
  'kkkkkkkkkkkk',
  '.kkkkkkkkkk.',
  '..kkkkkkkk..',
  '...kkkkkk...',
  '..kkkk.kkk..',
  '..kkk...kkk.',
  '.kk.......kk',
];
export const SWORD_ROWS = ['.......kk', '......kkk', '.....kkk.', '....kkk..', 'k..kkk...', 'kkkkk....', '.kkk.....', '.kkkk....', 'kk..kk...'];
export const BOLT_ROWS = ['....kkk', '...kkk.', '..kkk..', '.kkkkkk', '...kkk.', '..kkk..', '.kk....', 'kk.....'];
export const HEART_PX = ['.kk..kk.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '...kk...'];
export const SKULL_PX = ['.kkkkkkk.', 'kkkkkkkkk', 'kk..k..kk', 'kk..k..kk', 'kkkkkkkkk', '.kkkkkkk.', '..k.k.k..'];
export const CLOCK_PX = ['..kkkkk..', '.kk...kk.', 'kk..k..kk', 'k...k...k', 'k...kkk.k', 'kk.....kk', '.kk...kk.', '..kkkkk..'];
export const MAP_PX = ['kkkkkkkkk', 'k..k..k.k', 'k.kkk.k.k', 'k..k..kkk', 'kkk.k...k', 'k...kk..k', 'kkkkkkkkk'];

/** One-colour pixel icon (palette letter `k`). */
export const PxIcon: FC<{rows: string[]; px?: number; color?: string; extra?: Pal; style?: CSSProperties}> = ({rows, px = 4, color = '#fff', extra, style}) => (
  <PxArt rows={rows} pal={{k: color, ...extra}} px={px} style={style} />
);

/** Caption in small bold caps (Noto Sans), gold by default. */
export const Label: FC<{children: ReactNode; color?: string; size?: number; style?: CSSProperties}> = ({children, color = MCD.goldBright, size = 24, style}) => (
  <McdText size={size} weight={700} color={color} style={{letterSpacing: Math.round(size / 8), textTransform: 'uppercase', ...style}}>
    {children}
  </McdText>
);

/** Red-brown (or any) soft glow wash used behind panels. */
export const GlowWash: FC<{color?: string; at?: string; size?: string; opacity?: number}> = ({color = 'rgba(150,40,30,0.5)', at = '50% 0%', size = '90% 60%', opacity = 1}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse ${size} at ${at}, ${color}, rgba(0,0,0,0) 72%)`, opacity, pointerEvents: 'none'}} />
);

/** Hard-edged left-to-right dark gradient laid under text columns so they read on any footage. */
export const SideShade: FC<{side?: 'left' | 'right'; w?: number; opacity?: number}> = ({side = 'left', w = 900, opacity = 0.85}) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      [side]: 0,
      width: w,
      background: `linear-gradient(${side === 'left' ? 90 : 270}deg, rgba(4,6,12,${opacity}), rgba(4,6,12,${opacity * 0.6}) 55%, rgba(4,6,12,0))`,
      pointerEvents: 'none',
    }}
  />
);

/** Square debris shot upwards out of (x, y) (chest / beam burst), then pulled down by gravity. */
export const Fountain: FC<{x: number; y: number; at: number; count?: number; seed?: number; colors?: string[]; spread?: number; speed?: number; life?: number; size?: number}> = ({
  x,
  y,
  at,
  count = 36,
  seed = 5,
  colors = ['#CD2ECD', '#E56DE5', '#FFFFFF', '#FFF6C0'],
  spread = 0.7,
  speed = 1,
  life = 44,
  size = 12,
}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life + 4) return null;
  const rnd = mulberry32(seed * 977 + 11);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 2 * spread;
        const v = (14 + rnd() * 20) * speed;
        const lf = life * (0.6 + rnd() * 0.4);
        const sz = Math.max(4, Math.round((size * (0.5 + rnd() * 0.9)) / 4) * 4);
        const col = colors[Math.floor(rnd() * colors.length)];
        if (f > lf) return null;
        const px = x + Math.cos(a) * v * f;
        const py = y + Math.sin(a) * v * f + 0.55 * f * f * 0.5;
        const blink = f > lf * 0.7 && f % 3 === 0 ? 0 : 1;
        return <div key={i} style={{position: 'absolute', left: Math.round(px / 4) * 4, top: Math.round(py / 4) * 4, width: sz, height: sz, background: col, opacity: blink}} />;
      })}
    </div>
  );
};
