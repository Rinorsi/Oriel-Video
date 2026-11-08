import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Shockwave} from '../mc/Fx';
import {block, tex} from '../mc/assets';
import {EASE, HEIGHT, WIDTH, clamp01, mulberry32} from '../mc/theme';
import {LowRes} from '../mg/LowRes';
import {ORE, OreProgress, OreText, TYPE, U, nine} from '../mg/Ore';
import {lerp} from './kit';

/**
 * Transitions for the reel. A transition spans the overlap of two shots (A going out, B coming in) and is
 * driven by p = 0..1. It can restyle either shot (`a`, `b`) and draw an `overlay` on top of both.
 * Overlay-only transitions cover the screen around p = 0.5, where B takes over (see `b` default).
 */

export type TransitionDef = {
  id: string;
  name: string;
  frames: number;
  a?: (p: number) => CSSProperties;
  b?: (p: number) => CSSProperties;
  /** Horizontal slice shifts (px) for A / B; when present each shot is drawn as `strips` clipped copies. */
  strips?: {count: number; a: (p: number, i: number) => number; b: (p: number, i: number) => number};
  overlay?: FC<{p: number}>;
  /** Sound cues, frames relative to the transition start. */
  cues: {at: number; src: string; volume?: number; rate?: number}[];
};

const hidden: CSSProperties = {opacity: 0};
const shown: CSSProperties = {opacity: 1};
/** Default B: invisible until the cover is complete, then there. */
const cutAtHalf = (p: number): CSSProperties => (p < 0.5 ? hidden : shown);

const ease = EASE.inOut;
const easeOut = EASE.out;

// ---------------------------------------------------------------- 1. block mosaic

const CELL = 128;
const COLS = Math.ceil(WIDTH / CELL);
const ROWS = Math.ceil(HEIGHT / CELL);
const MOSAIC_TEX = ['stone', 'cobblestone', 'deepslate', 'dirt', 'oak_planks', 'andesite', 'gravel', 'mossy_cobblestone'];

const Mosaic: FC<{p: number}> = ({p}) => {
  const cells = Array.from({length: COLS * ROWS}, (_, i) => {
    const r = mulberry32(700 + i);
    const cx = (i % COLS) - COLS / 2;
    const cy = Math.floor(i / COLS) - ROWS / 2;
    // Centre-out ripple with a bit of noise: cells near the middle land first.
    const d = Math.hypot(cx, cy) / Math.hypot(COLS / 2, ROWS / 2);
    return {i, x: (i % COLS) * CELL, y: Math.floor(i / COLS) * CELL, t: d * 0.55 + r() * 0.3, tex: MOSAIC_TEX[Math.floor(r() * MOSAIC_TEX.length)], tilt: (r() - 0.5) * 40};
  });
  return (
    <AbsoluteFill>
      {cells.map((c) => {
        // In: cells pop in between t and t+0.25 of the first half; out: reverse order in the second half.
        const inP = clamp01((p * 2 - c.t) / 0.25);
        const outP = clamp01((p * 2 - 1 - (0.85 - c.t)) / 0.25);
        const s = EASE.back(inP) * (1 - EASE.in(outP));
        if (s <= 0.01) return null;
        return (
          <div
            key={c.i}
            style={{
              position: 'absolute',
              left: c.x,
              top: c.y,
              width: CELL,
              height: CELL,
              transform: `scale(${s}) rotate(${(1 - s) * c.tilt}deg)`,
              backgroundImage: `url(${block(c.tex)})`,
              backgroundSize: `${CELL}px ${CELL}px`,
              imageRendering: 'pixelated',
              boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.35), inset 0 -8px 0 rgba(0,0,0,0.25)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. curtain

const Curtain: FC<{p: number}> = ({p}) => {
  const close = ease(clamp01(p / 0.45));
  const open = ease(clamp01((p - 0.55) / 0.45));
  const k = close * (1 - open);
  const w = WIDTH / 2;
  const slam = p > 0.42 && p < 0.55 ? (0.55 - p) / 0.13 : 0;
  const shake = slam * 14 * Math.sin(p * 400);
  const door = (side: 'l' | 'r'): CSSProperties => ({
    position: 'absolute',
    top: 0,
    height: HEIGHT,
    width: w + 8,
    [side === 'l' ? 'left' : 'right']: 0,
    transform: `translateX(${(side === 'l' ? -1 : 1) * (1 - k) * (w + 40) + shake}px)`,
    backgroundImage: `url(${block('deepslate_bricks')}), linear-gradient(180deg, #2a2b2d, #1a1b1c)`,
    backgroundSize: `${CELL}px ${CELL}px, 100% 100%`,
    imageRendering: 'pixelated',
    boxShadow: side === 'l' ? '12px 0 0 rgba(0,0,0,0.5), inset -16px 0 0 #101011, inset -20px 0 0 #3a3b3d' : '-12px 0 0 rgba(0,0,0,0.5), inset 16px 0 0 #101011, inset 20px 0 0 #3a3b3d',
  });
  return (
    <AbsoluteFill>
      <div style={door('l')} />
      <div style={door('r')} />
      {k > 0.97 && (
        <div style={{position: 'absolute', left: WIDTH / 2 - 8, top: 0, width: 16, height: HEIGHT, background: '#f8af2b', opacity: 0.0 + slam * 0.9, filter: 'blur(6px)'}} />
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. loading screen

const Loading: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const a = clamp01(p / 0.22) * (1 - clamp01((p - 0.82) / 0.18));
  const bar = clamp01((p - 0.14) / 0.62);
  const dots = '.'.repeat(1 + (Math.floor(f / 6) % 3));
  return (
    <AbsoluteFill style={{opacity: a}}>
      <AbsoluteFill style={{backgroundImage: `url(${block('dirt')})`, backgroundSize: `${16 * U * 2}px ${16 * U * 2}px`, imageRendering: 'pixelated', backgroundPosition: `${f * 1.2}px ${f * 0.6}px`}} />
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.62)'}} />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 * U}}>
        <OreText size={TYPE.h1} shadow>{`正在加载地形${dots}`}</OreText>
        <OreProgress value={bar} width={150 * U} color="green" />
        <OreText size={TYPE.body} color={ORE.dim}>{`${Math.round(bar * 100)}%`}</OreText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. TNT blast

const Blast: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const hit = 0.42;
  const flash = p < hit ? 0 : Math.pow(1 - clamp01((p - hit) / 0.3), 1.6);
  const frame = Math.min(15, Math.floor(clamp01((p - hit) / 0.5) * 16));
  const big = p >= hit && p < hit + 0.55;
  return (
    <AbsoluteFill>
      {big && (
        <Img
          src={tex(`particle/explosion_${frame}.png`)}
          style={{position: 'absolute', left: WIDTH / 2 - 560, top: HEIGHT / 2 - 560, width: 1120, height: 1120, imageRendering: 'pixelated', opacity: 0.95, transform: `scale(${1 + (p - hit) * 1.4})`}}
        />
      )}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
      {p >= hit && <Shockwave x={WIDTH / 2} y={HEIGHT / 2} at={f - Math.round((p - hit) * 30)} color="#ffd27a" maxR={1100} life={18} width={24} rays={20} />}
    </AbsoluteFill>
  );
};
const shake = (amp: number, seed: number): CSSProperties => {
  const r = mulberry32(seed);
  return {transform: `translate(${(r() - 0.5) * 2 * amp}px, ${(r() - 0.5) * 2 * amp}px)`};
};

// ---------------------------------------------------------------- 6. nether portal

const PORTAL = ['#2a0a4d', '#4b1a8c', '#6a2bbf', '#8a45e6', '#b27cff', '#d9b8ff'];
const hash2 = (x: number, y: number, t: number) => {
  let h = (x * 374761393 + y * 668265263 + t * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const Portal: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const cx = 240;
  const cy = 135;
  const maxR = Math.hypot(240, 135) + 8;
  // Grow to cover by p=.5, then shrink: the hole opens where it started.
  const g = p < 0.5 ? easeOut(p / 0.5) : 1 - EASE.in((p - 0.5) / 0.5);
  const R = g * maxR;
  const draw = (ctx: CanvasRenderingContext2D) => {
    const t = Math.floor(f / 2);
    const spin = f * 0.05;
    for (let y = 0; y < 270; y += 3) {
      for (let x = 0; x < 480; x += 3) {
        const dx = x - cx;
        const dy = (y - cy) * 1.0;
        const d = Math.hypot(dx, dy);
        // The edge wobbles with a rotating angular wave so it looks swirled, not a plain circle.
        const ang = Math.atan2(dy, dx) + spin;
        const edge = R + Math.sin(ang * 5 + f * 0.25) * 6 * Math.min(1, g * 2) + (hash2(x, y, t) - 0.5) * 6;
        if (d > edge) continue;
        const swirl = Math.sin(d * 0.12 - f * 0.22 + ang * 3) * 0.5 + 0.5;
        const n = hash2(x >> 1, y >> 1, t + Math.floor(d / 6));
        let idx = Math.floor((swirl * 0.6 + n * 0.4) * PORTAL.length);
        if (d > edge - 7) idx = Math.min(PORTAL.length - 1, idx + 2);
        ctx.fillStyle = PORTAL[Math.min(PORTAL.length - 1, idx)];
        ctx.fillRect(x, y, 3, 3);
      }
    }
  };
  return <LowRes ready draw={draw} />;
};

// ---------------------------------------------------------------- 7. block sweep

const SWEEP_COLS = 12;
const SW = WIDTH / SWEEP_COLS;
const SWEEP_TEX = ['deepslate', 'cobblestone', 'stone', 'netherrack', 'dirt', 'obsidian'];
const Sweep: FC<{p: number}> = ({p}) => (
  <AbsoluteFill>
    {Array.from({length: SWEEP_COLS}, (_, i) => {
      const delay = (i / SWEEP_COLS) * 0.22;
      const inP = easeOut(clamp01((p - delay) / 0.3));
      const outP = EASE.in(clamp01((p - 0.52 - delay) / 0.3));
      const y = -HEIGHT * (1 - inP) + HEIGHT * outP;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i * SW,
            top: y,
            width: SW + 1,
            height: HEIGHT,
            backgroundImage: `url(${block(SWEEP_TEX[i % SWEEP_TEX.length])})`,
            backgroundSize: `${SW / 2}px ${SW / 2}px`,
            imageRendering: 'pixelated',
            boxShadow: 'inset -6px 0 0 rgba(0,0,0,0.4), inset 6px 0 0 rgba(255,255,255,0.07), 0 20px 0 rgba(0,0,0,0.5)',
          }}
        >
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.55))'}} />
        </div>
      );
    })}
  </AbsoluteFill>
);

// ---------------------------------------------------------------- 8. glitch slice (end)

const GlitchBars: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const r = mulberry32(900 + f);
  const k = Math.sin(p * Math.PI);
  return (
    <AbsoluteFill>
      {Array.from({length: 7}, (_, i) => {
        const y = r() * HEIGHT;
        const h = 6 + r() * 40;
        const x = r() * WIDTH * 0.6;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: 200 + r() * 700, height: h, background: i % 2 ? '#b27cff' : '#55ffff', opacity: 0.55 * k * (r() > 0.3 ? 1 : 0), mixBlendMode: 'screen'}} />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- defs

export const TRANSITIONS: Record<string, TransitionDef> = {
  mosaic: {
    id: 'mosaic',
    name: '方块马赛克',
    frames: 36,
    b: cutAtHalf,
    overlay: Mosaic,
    cues: [
      {at: 4, src: 'mc:dig/stone1', volume: 0.5, rate: 0.9},
      {at: 8, src: 'mc:dig/stone3', volume: 0.5, rate: 1.0},
      {at: 12, src: 'mc:dig/stone2', volume: 0.5, rate: 1.1},
      {at: 20, src: 'mc:random/pop', volume: 0.4, rate: 1.2},
    ],
  },
  push: {
    id: 'push',
    name: '推拉',
    frames: 24,
    a: (p) => {
      const e = ease(p);
      return {transform: `translateX(${-e * WIDTH}px) scale(${1 - e * 0.12})`, filter: `blur(${Math.sin(p * Math.PI) * 5}px)`};
    },
    b: (p) => {
      const e = ease(p);
      return {transform: `translateX(${(1 - e) * WIDTH}px) scale(${0.88 + e * 0.12})`, filter: `blur(${Math.sin(p * Math.PI) * 5}px)`};
    },
    overlay: ({p}) => <div style={{position: 'absolute', top: 0, bottom: 0, left: lerp(WIDTH, 0, ease(p)) - 16, width: 16, background: ORE.green, opacity: Math.sin(p * Math.PI)}} />,
    cues: [{at: 2, src: 'mc:item/armor/equip_leather1', volume: 0.45, rate: 0.9}],
  },
  zoom: {
    id: 'zoom',
    name: '缩放穿越',
    frames: 28,
    a: (p) => {
      const e = EASE.in(p);
      return {transform: `scale(${1 + e * 3})`, filter: `blur(${e * 22}px)`, opacity: 1 - clamp01((p - 0.5) / 0.5)};
    },
    b: (p) => {
      const e = easeOut(p);
      return {transform: `scale(${lerp(0.45, 1, e)})`, filter: `blur(${(1 - e) * 22}px)`, opacity: clamp01(p / 0.5)};
    },
    cues: [
      {at: 12, src: 'mc:ui/toast/in', volume: 0.3, rate: 1.3},
    ],
  },
  curtain: {
    id: 'curtain',
    name: '石砖幕布',
    frames: 40,
    b: cutAtHalf,
    overlay: Curtain,
    cues: [
      {at: 4, src: 'mc:dig/stone2', volume: 0.5, rate: 0.6},
      {at: 17, src: 'mc:random/anvil_land', volume: 0.55, rate: 0.9},
      {at: 28, src: 'mc:dig/stone4', volume: 0.45, rate: 0.7},
    ],
  },
  loading: {
    id: 'loading',
    name: '加载界面',
    frames: 48,
    b: cutAtHalf,
    overlay: Loading,
    cues: [
      {at: 4, src: 'mc:random/click', volume: 0.4},
      {at: 36, src: 'mc:random/orb', volume: 0.35, rate: 1.4},
    ],
  },
  tnt: {
    id: 'tnt',
    name: 'TNT 爆破',
    frames: 30,
    a: (p) => ({...shake(p * 22, 40 + Math.floor(p * 30)), filter: `brightness(${1 + p * 0.6})`, opacity: p > 0.42 ? 0 : 1}),
    b: (p) => ({...(p < 0.42 ? {opacity: 0} : shake((1 - p) * 40, 80 + Math.floor(p * 30))), filter: `brightness(${1 + (1 - p) * 1.4}) blur(${Math.max(0, 0.7 - p) * 16}px)`}),
    overlay: Blast,
    cues: [
      {at: 0, src: 'mc:random/fuse', volume: 0.6},
      {at: 12, src: 'mc:random/explode1', volume: 0.75},
      {at: 13, src: 'mc:random/explode3', volume: 0.4, rate: 0.8},
    ],
  },
  portal: {
    id: 'portal',
    name: '下界传送门',
    frames: 42,
    b: cutAtHalf,
    overlay: Portal,
    cues: [
      {at: 8, src: 'mc:ambient/weather/thunder1', volume: 0.12, rate: 0.7},
      {at: 22, src: 'mc:random/levelup', volume: 0.3, rate: 0.7},
    ],
  },
  sweep: {
    id: 'sweep',
    name: '方块纹理扫落',
    frames: 34,
    b: cutAtHalf,
    overlay: Sweep,
    cues: [
      {at: 10, src: 'mc:dig/gravel1', volume: 0.6, rate: 0.8},
      {at: 20, src: 'mc:dig/stone3', volume: 0.5, rate: 0.7},
    ],
  },
  glitch: {
    id: 'glitch',
    name: '末影错位',
    frames: 26,
    strips: {
      count: 12,
      a: (p, i) => (p < 0.5 ? Math.sin(i * 12.9898) * 260 * Math.pow(p * 2, 2) : 0),
      b: (p, i) => (p > 0.5 ? Math.sin(i * 78.233) * 260 * Math.pow(1 - (p - 0.5) * 2, 2) : 0),
    },
    a: (p) => ({opacity: p < 0.5 ? 1 : 0, filter: `saturate(${1 + p * 2}) hue-rotate(${p * 90}deg)`}),
    b: (p) => ({opacity: p < 0.5 ? 0 : 1, filter: `saturate(${1 + (1 - p) * 2}) hue-rotate(${(1 - p) * -90}deg)`}),
    overlay: GlitchBars,
    cues: [
      {at: 5, src: 'mc:random/click', volume: 0.4, rate: 0.6},
      {at: 14, src: 'mc:random/click', volume: 0.4, rate: 1.6},
    ],
  },
};
