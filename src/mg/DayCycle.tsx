import {useCallback, type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {block, tex} from '../mc/assets';
import {ORE} from './Ore';
import {glow, gradient, hexA, loadGfx, rays, sprite, squareHalos, type GfxAssets} from './Graphic';
import {LH, LW, LowRes, useAssets} from './LowRes';
import {mulberry32} from '../mc/theme';

/**
 * Animated Minecraft sky backdrops for four times of day, drawn on the low-res pixel canvas.
 * Every moving part completes a whole number of cycles in LOOP frames (clouds move exactly one tile,
 * rays turn exactly one ray, twinkles use periods that divide LOOP), so a LOOP-long render repeats
 * seamlessly. Intros reuse the same backdrop.
 */

export const LOOP = 2400; // 80 s at 30 fps: long enough for the clouds to drift slowly

export type TimeOfDay = 'dawn' | 'noon' | 'dusk' | 'night';

type Theme = {
  sky: [string, string, string, string];
  body: {kind: 'sun' | 'moon'; x: number; y: number; scale: number};
  glowColor: string;
  glowAlpha: number;
  rays: number; // alpha
  rayColor: string;
  cloud: string;
  cloudShade: string;
  cloudAlpha: number;
  hillFar: string;
  hillMid: string;
  hillMidTop: string;
  grass: string;
  grassTop: string;
  dirt: [string, string, string];
  stars: number;
  fireflies: number;
  sparkle: string;
};

export const THEMES: Record<TimeOfDay, Theme> = {
  dawn: {
    sky: ['#6f9fe0', '#a9c8f0', '#ffd9c4', '#fff1e0'],
    body: {kind: 'sun', x: 96, y: 170, scale: 3},
    glowColor: '#ffe4c4',
    glowAlpha: 0.6,
    rays: 0.16,
    rayColor: '#fff3e0',
    cloud: '#fff6f0',
    cloudShade: '#f4cfc4',
    cloudAlpha: 0.95,
    hillFar: '#bcd9cc',
    hillMid: '#9ccf7c',
    hillMidTop: '#c2e6a2',
    grass: '#4f9a35',
    grassTop: '#79c254',
    dirt: ['#7a5537', '#5f4029', '#93694a'],
    stars: 0,
    fireflies: 0,
    sparkle: '#ffffff',
  },
  noon: {
    sky: ['#3f8fe6', '#7cc0ff', '#c4e6ff', '#eaf8ff'],
    body: {kind: 'sun', x: 52, y: 40, scale: 3},
    glowColor: '#ffffff',
    glowAlpha: 0.55,
    rays: 0.18,
    rayColor: '#ffffff',
    cloud: '#ffffff',
    cloudShade: '#cfe3f5',
    cloudAlpha: 0.95,
    hillFar: '#a6dcc8',
    hillMid: '#8fd06a',
    hillMidTop: '#b5e88f',
    grass: ORE.green,
    grassTop: ORE.greenLight,
    dirt: ['#7a5537', '#5f4029', '#93694a'],
    stars: 0,
    fireflies: 0,
    sparkle: '#ffffff',
  },
  dusk: {
    sky: ['#2f5aa8', '#6f8fd4', '#ffb27a', '#ffd9a0'],
    body: {kind: 'sun', x: 300, y: 200, scale: 4},
    glowColor: '#ffb070',
    glowAlpha: 0.65,
    rays: 0.14,
    rayColor: '#ffd9b0',
    cloud: '#ffe0c8',
    cloudShade: '#e99a7c',
    cloudAlpha: 0.92,
    hillFar: '#7fa79c',
    hillMid: '#5f9a4a',
    hillMidTop: '#86bd5f',
    grass: '#3e7a2a',
    grassTop: '#5f9f3d',
    dirt: ['#5e4029', '#46301e', '#74513a'],
    stars: 20,
    fireflies: 0,
    sparkle: '#fff1d6',
  },
  night: {
    sky: ['#081330', '#10224d', '#1d3a72', '#2b5088'],
    body: {kind: 'moon', x: 380, y: 60, scale: 6},
    glowColor: '#9fc4ff',
    glowAlpha: 0.35,
    rays: 0.05,
    rayColor: '#cfe0ff',
    cloud: '#3d5c92',
    cloudShade: '#25406e',
    cloudAlpha: 0.6,
    hillFar: '#1d3b52',
    hillMid: '#1f4a36',
    hillMidTop: '#2c6146',
    grass: '#24542a',
    grassTop: '#33703a',
    dirt: ['#3a281b', '#2a1d13', '#4a3424'],
    stars: 140,
    fireflies: 26,
    sparkle: '#dfeaff',
  },
};

// ---------------------------------------------------------------- tileable pieces

/** Stepped hill heights that wrap around LW, so the ground could scroll seamlessly too. */
const hills = (seed: number, cell: number, amp: number) => {
  const rnd = mulberry32(seed);
  const cols = LW / cell;
  const out: number[] = [];
  let h = amp * 0.5;
  for (let c = 0; c < cols; c++) {
    if (rnd() < 0.45) h += (rnd() - 0.5) * amp * 0.5;
    h = Math.max(amp * 0.15, Math.min(amp, h));
    out.push(Math.round(h / cell) * cell);
  }
  return out;
};

const HILL_FAR = hills(14, 3, 26);
const HILL_MID = hills(5, 3, 22);
const HILL_NEAR = hills(22, 4, 14);

type Assets = GfxAssets & {clouds: Record<TimeOfDay, {near: HTMLCanvasElement; far: HTMLCanvasElement}>; bodies: Record<'sun' | 'moon', HTMLCanvasElement>};

/** Vanilla clouds.png rows, recoloured, with a shade row under each cloud. The texture tiles horizontally. */
const cloudRows = (img: HTMLImageElement, y: number, h: number, color: string, shade: string) => {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = h + 1;
  const ctx = c.getContext('2d')!;
  const src = document.createElement('canvas');
  src.width = img.width;
  src.height = h;
  const sx = src.getContext('2d')!;
  sx.drawImage(img, 0, y, img.width, h, 0, 0, img.width, h);
  const paint = (col: string) => {
    const t = document.createElement('canvas');
    t.width = img.width;
    t.height = h;
    const tx = t.getContext('2d')!;
    tx.drawImage(src, 0, 0);
    tx.globalCompositeOperation = 'source-in';
    tx.fillStyle = col;
    tx.fillRect(0, 0, t.width, t.height);
    return t;
  };
  ctx.drawImage(paint(shade), 0, 1);
  ctx.drawImage(paint(color), 0, 0);
  return c;
};

/** The sun and moon textures are light on black (drawn additively in game); turn black into transparency. */
const lumaAlpha = (img: HTMLImageElement) => {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const m = Math.max(d.data[i], d.data[i + 1], d.data[i + 2]);
    d.data[i + 3] = Math.round((m / 255) * d.data[i + 3]);
    if (m > 0) for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, (d.data[i + k] * 255) / m);
  }
  ctx.putImageData(d, 0, 0);
  return c;
};

const useCycleAssets = () =>
  useAssets<Assets>('daycycle', async () => {
    const g = await loadGfx({
      sun: tex('environment/celestial/sun.png'),
      moon: tex('environment/celestial/moon/first_quarter.png'),
      cloudTex: tex('environment/clouds.png'),
      glint: tex('particle/glint.png'),
      stone: block('stone'),
      cobble: block('cobblestone'),
      dirt: block('dirt'),
      grass: block('grass_block_side'),
    });
    const clouds = Object.fromEntries(
      (Object.keys(THEMES) as TimeOfDay[]).map((k) => {
        const t = THEMES[k];
        return [k, {near: cloudRows(g.sprites.cloudTex, 96, 7, t.cloud, t.cloudShade), far: cloudRows(g.sprites.cloudTex, 40, 6, t.cloud, t.cloudShade)}];
      }),
    ) as Assets['clouds'];
    return {...g, clouds, bodies: {sun: lumaAlpha(g.sprites.sun), moon: lumaAlpha(g.sprites.moon)}};
  });

const tileX = (ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, y: number, ts: number, shift: number, alpha: number) => {
  const w = img.width * ts;
  const off = -(((Math.round(shift) % w) + w) % w);
  ctx.globalAlpha = alpha;
  for (let x = off; x < LW; x += w) ctx.drawImage(img, x, y, w, img.height * ts);
  ctx.globalAlpha = 1;
};

const periodic = (f: number, period: number) => (((f % period) + period) % period) / period;
const PERIODS = [40, 48, 50, 60, 75, 80, 100, 120, 150];

// ---------------------------------------------------------------- draw

export type BackdropOptions = {
  /** Centre of the light burst, in low-res pixels. */
  burst?: [number, number];
  /** Square halos around the burst (title emphasis; off for plain backgrounds). */
  halos?: boolean;
  /** Sunburst rays from the burst centre (default on; off for plain video backgrounds). */
  rays?: boolean;
  /** Floating blocks [texture, x, y, rotation] in low-res pixels. */
  blocks?: [string, number, number, number][];
};

export const drawBackdrop = (ctx: CanvasRenderingContext2D, f: number, a: Assets, time: TimeOfDay, o: BackdropOptions = {}) => {
  const t = THEMES[time];
  const [bx, by] = o.burst ?? [LW / 2, 112];
  gradient(ctx, 0, 0, 0, LH, [
    [0, t.sky[0]],
    [0.45, t.sky[1]],
    [0.78, t.sky[2]],
    [1, t.sky[3]],
  ]);
  // Stars (night, and the first few at dusk).
  if (t.stars) {
    const rnd = mulberry32(77);
    for (let i = 0; i < t.stars; i++) {
      const x = Math.floor(rnd() * LW);
      const y = Math.floor(rnd() * LH * (time === 'dusk' ? 0.3 : 0.7));
      const p = PERIODS[Math.floor(rnd() * PERIODS.length)];
      const ph = rnd();
      const on = periodic(f + ph * p, p);
      const big = rnd() < 0.18;
      ctx.fillStyle = hexA('#ffffff', 0.35 + 0.65 * Math.abs(Math.sin(on * Math.PI)));
      ctx.fillRect(x, y, 1, 1);
      if (big && on < 0.25) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  }
  glow(ctx, bx, by, 220, t.glowColor, t.glowAlpha);
  // Sun or moon (black made transparent, optionally warmed for dawn/dusk).
  {
    const img = a.bodies[t.body.kind];
    const s = img.width * t.body.scale;
    ctx.drawImage(img, Math.round(t.body.x - s / 2), Math.round(t.body.y - s / 2), s, s);
    // The moon texture is dim; a second additive pass makes it read like the in-game moon.
    if (t.body.kind === 'moon') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(img, Math.round(t.body.x - s / 2), Math.round(t.body.y - s / 2), s, s);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  if (time === 'dusk' || time === 'dawn') glow(ctx, t.body.x, t.body.y, 90, t.glowColor, 0.5);
  // Rays turn exactly one ray spacing per loop.
  const n = 20;
  if (o.rays !== false) rays(ctx, bx, by, n, (f / LOOP) * ((Math.PI * 2) / n), 0.36, hexA(t.rayColor, t.rays));
  if (o.halos) squareHalos(ctx, bx, by, 6, 240, 22, t.rayColor, (i) => (0.45 - i * 0.07) * (t.rays / 0.18), 2);
  // Clouds: each layer moves exactly one tile per loop (the near tile is wider, so it moves faster).
  const cl = a.clouds[time];
  tileX(ctx, cl.far, 64, 4, (f / LOOP) * cl.far.width * 4, t.cloudAlpha * 0.75);
  tileX(ctx, cl.near, 4, 6, (f / LOOP) * cl.near.width * 6, t.cloudAlpha);
  // Hills.
  const drawRow = (heights: number[], cell: number, base: number, color: string, top?: string) => {
    heights.forEach((h, c) => {
      ctx.fillStyle = color;
      ctx.fillRect(c * cell, base - h, cell, LH - base + h);
      if (top) {
        ctx.fillStyle = top;
        ctx.fillRect(c * cell, base - h, cell, 1);
      }
    });
  };
  drawRow(HILL_FAR, 3, 232, t.hillFar);
  drawRow(HILL_MID, 3, 246, t.hillMid, t.hillMidTop);
  const rnd = mulberry32(8);
  HILL_NEAR.forEach((h, c) => {
    const x = c * 4;
    const top = 260 - h;
    ctx.fillStyle = t.dirt[0];
    ctx.fillRect(x, top, 4, LH - top);
    for (let y = top + 4; y < LH; y += 2)
      for (let k = 0; k < 4; k += 2)
        if (rnd() < 0.22) {
          ctx.fillStyle = rnd() < 0.5 ? t.dirt[1] : t.dirt[2];
          ctx.fillRect(x + k, y, 2, 2);
        }
    ctx.fillStyle = t.grass;
    ctx.fillRect(x, top, 4, 4);
    ctx.fillStyle = t.grassTop;
    ctx.fillRect(x, top, 4, 1);
  });
  // Fireflies drifting over the meadow at night (periodic paths).
  if (t.fireflies) {
    const fr = mulberry32(41);
    for (let i = 0; i < t.fireflies; i++) {
      const x0 = fr() * LW;
      const y0 = 190 + fr() * 60;
      const p = PERIODS[Math.floor(fr() * PERIODS.length)] * 2;
      const ph = fr() * Math.PI * 2;
      const u = (f / p) * Math.PI * 2 + ph;
      const blink = 0.4 + 0.6 * Math.max(0, Math.sin(u * 2));
      ctx.fillStyle = hexA('#d9ff7a', blink);
      ctx.fillRect(Math.round(x0 + Math.sin(u) * 10), Math.round(y0 + Math.cos(u * 1.3) * 6), 1, 1);
    }
  }
  // Twinkling four-point sparkles.
  const sr = mulberry32(19);
  for (let i = 0; i < 8; i++) {
    const x = 30 + sr() * (LW - 60);
    const y = 30 + sr() * 150;
    const p = PERIODS[Math.floor(sr() * PERIODS.length)];
    const s = Math.sin(periodic(f + sr() * p, p) * Math.PI);
    if (s > 0.35) sprite(ctx, a, 'glint', x, y, s > 0.8 ? 2 : 1, {color: t.sparkle, alpha: s});
  }
  // Floating blocks bob and sway with loop-safe periods.
  (o.blocks ?? []).forEach(([k, x, y, r], i) => {
    const p = LOOP / (2 + (i % 3));
    const u = (f / p) * Math.PI * 2 + i;
    sprite(ctx, a, k, x, y + Math.sin(u) * 3, 1, {outline: 'rgba(20,20,30,0.5)', rot: r + Math.sin(u) * 0.12});
  });
};

export const DEFAULT_BLOCKS: [string, number, number, number][] = [
  ['stone', 96, 40, 0.3],
  ['cobble', 150, 196, -0.5],
  ['dirt', 330, 34, 0.7],
  ['grass', 392, 196, -0.2],
  ['cobble', 40, 196, 0.9],
  ['stone', 448, 44, -0.8],
];

/** The backdrop as a component. `frameOffset` lets an intro start mid-loop. */
export const CycleBackdrop: FC<{time: TimeOfDay; options?: BackdropOptions; frameOffset?: number}> = ({time, options, frameOffset = 0}) => {
  const f = useCurrentFrame() + frameOffset;
  const a = useCycleAssets();
  const draw = useCallback((ctx: CanvasRenderingContext2D) => a && drawBackdrop(ctx, f, a, time, options), [a, f, time, options]);
  return <LowRes ready={!!a} draw={draw} />;
};

/** Seamless loop composition body. */
export const BackdropLoop: FC<{time: TimeOfDay}> = ({time}) => <CycleBackdrop time={time} options={{rays: false}} />;
