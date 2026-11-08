// mcd3 shared helpers: baked canvas cache, periodic noise, "vanilla" stand-in footage plates and the before/after Compare wrapper.
//
// Every atmosphere layer in this area is designed for ONE blend mode so it survives export:
//   screen   -> glows, rays, beams, particles (drawn on a transparent canvas; black background in an mp4 behaves the same)
//   overlay  -> colour grades (opaque canvas, mid-grey = neutral)
//   multiply -> shading maps (opaque canvas, white = neutral)
// Compare shows the layer on a flat "vanilla" voxel plate (the scene engine with lighting/fog/grade/bloom switched off), with a slanted
// wipe: vanilla on the left, +layer on the right. The blend is real CSS mix-blend-mode, so what you see is what the editor gives you.
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {CSSProperties, FC, ReactNode} from 'react';
import {SceneCanvas, type PostSpec, type SceneSpec} from '../mcdscene/engine';
import {SCENES, type BiomeId} from '../mcdscene/scenes';
import {h2, type RGB} from '../mcdscene/rng';
import {PxText, TITLE_GOLD} from '../mcdkit/kit';

export const W = 1920;
export const H = 1080;
export const TAU = Math.PI * 2;
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const rgba = (c: RGB | readonly number[], a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
export const hex = (s: string): RGB => {
  const n = parseInt(s.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Integer-cycle phase: `cycles` repeats per `loop` frames. */
export const ph = (f: number, loop: number, cycles = 1, off = 0) => (((f * cycles) / loop + off) % 1 + 1) % 1;

// ---------------------------------------------------------------------------------------------------------------------
// baked canvases

const CACHE = new Map<string, HTMLCanvasElement>();
/** Draw once, reuse forever (module cache). */
export const baked = (key: string, w: number, h: number, fn: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
  let c = CACHE.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    fn(c.getContext('2d')!);
    CACHE.set(key, c);
  }
  return c;
};

/** Value noise on a lattice that wraps in x (so the tile scrolls seamlessly) and y (so it also wraps vertically). */
const pnoise = (x: number, y: number, gw: number, gh: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const mx = (a: number) => ((a % gw) + gw) % gw;
  const my = (a: number) => ((a % gh) + gh) % gh;
  const a = h2(mx(xi), my(yi), seed);
  const b = h2(mx(xi + 1), my(yi), seed);
  const c = h2(mx(xi), my(yi + 1), seed);
  const d = h2(mx(xi + 1), my(yi + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

/** Wrapping fractal noise value in 0..1. `cx`,`cy` = lattice cells across the tile for the first octave. */
export const tnoise = (u: number, v: number, cx: number, cy: number, seed: number, oct = 4) => {
  let s = 0;
  let amp = 0.5;
  let n = 0;
  for (let i = 0; i < oct; i++) {
    const gw = cx * (1 << i);
    const gh = cy * (1 << i);
    s += amp * pnoise(u * gw, v * gh, gw, gh, seed + i * 77);
    n += amp;
    amp *= 0.5;
  }
  return s / n;
};

/**
 * Baked, horizontally tileable noise sprite. `shade(n, u, v)` -> alpha 0..1 for the given colour.
 * Resolution is low (it is stretched up smoothly), which is what makes soft fog cheap.
 */
export const noiseTile = (key: string, color: RGB, w: number, h: number, cx: number, cy: number, seed: number, shade: (n: number, u: number, v: number) => number, oct = 4) =>
  baked(key, w, h, (g) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = tnoise(x / w, y / h, cx, cy, seed, oct);
        const i = (y * w + x) * 4;
        img.data[i] = color[0];
        img.data[i + 1] = color[1];
        img.data[i + 2] = color[2];
        img.data[i + 3] = clamp01(shade(n, x / w, y / h)) * 255;
      }
    g.putImageData(img, 0, 0);
  });

/** Draw a horizontally scrolling tile `tiles` times across the frame width. */
export const drawScroll = (ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement, scroll01: number, x: number, y: number, w: number, h: number, alpha = 1) => {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = alpha;
  const off = (((scroll01 % 1) + 1) % 1) * w;
  for (let k = -1; k <= Math.ceil(W / w) + 1; k++) ctx.drawImage(tile, Math.round(x + k * w - off), Math.round(y), w + 1, h);
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// vanilla stand-in footage

type Sky = {top: RGB; hor: RGB; light: RGB};
const VAN_SKY: Partial<Record<BiomeId, Sky>> = {
  'forest-day': {top: [124, 176, 232], hor: [182, 214, 240], light: [1.0, 1.0, 0.97]},
  desert: {top: [128, 186, 238], hor: [190, 220, 240], light: [1.02, 1.0, 0.94]},
  nether: {top: [44, 14, 14], hor: [70, 22, 20], light: [1.0, 0.9, 0.84]},
  end: {top: [12, 8, 18], hor: [20, 14, 28], light: [1.0, 0.98, 0.92]},
  snow: {top: [140, 184, 236], hor: [200, 224, 244], light: [1.0, 1.0, 1.03]},
  camp: {top: [24, 26, 48], hor: [44, 46, 74], light: [0.58, 0.6, 0.72]},
  'forest-night': {top: [18, 24, 44], hor: [34, 44, 68], light: [0.55, 0.6, 0.7]},
};

export type VanillaOpts = {camera?: 'static' | 'drift'};

/** The scene engine with lighting, fog, grade, bloom, vignette and effects all switched off: a flat "stock Minecraft" look. */
export const vanillaSpec = (biome: BiomeId, o: VanillaOpts = {}): SceneSpec => {
  const base = SCENES[biome];
  const s = VAN_SKY[biome]!;
  const cam = base.camera;
  const mid = {x: (cam.from.x + cam.to.x) / 2, y: (cam.from.y + cam.to.y) / 2, zoom: (cam.from.zoom + cam.to.zoom) / 2};
  const drift = o.camera === 'drift';
  return {
    ...base,
    id: `mcd3-van-${biome}-${drift ? 'd' : 's'}`,
    fx: [],
    autoFlames: false,
    camera: drift ? {...cam, from: {...cam.from, x: cam.from.x * 0.45, y: cam.from.y * 0.5}, to: {...cam.to, x: cam.to.x * 0.45, y: cam.to.y * 0.5}} : {from: mid, to: mid, mode: 'linear', persp: cam.persp, sway: undefined},
    look: {
      ...base.look,
      skyTop: s.top,
      skyHorizon: s.hor,
      light: s.light,
      shadow: 0.8,
      fog: {...base.look.fog, base: 0, slope: 0, height: 0.01},
      grade: {sat: 1, contrast: 1, lift: [0, 0, 0], shadowTone: [1, 1, 1], highTone: [1, 1, 1]},
      glowGain: 0.5,
      pointGain: 0.5,
      ao: 0.22,
      tone: base.look.tone * 0.75,
    },
    post: {bloom: {tight: 0, wide: 0, threshold: 0.9}, vignette: 0, sat: 1},
  };
};

/** Editor-side adjustments we pretend the user did on the footage (saturation, contrast, glow): used by the "after" half of Compare. */
export const GRADED: Partial<PostSpec> = {bloom: {tight: 0.34, wide: 0.32, threshold: 0.62}, sat: 1.28, contrast: 1.12};
export const GRADED_NOTE = '素材: 饱和+28 对比+12 辉光';

/** `dim` darkens the plate with a cool multiply wash (0..1) so bright footage does not swallow additive layers; apply it to BOTH halves of a Compare. */
export const VanillaPlate: FC<{biome: BiomeId; loop: number; camera?: 'static' | 'drift'; seed?: number; post?: Partial<PostSpec>; dim?: number}> = ({biome, loop, camera = 'drift', seed, post, dim}) => (
  <SceneCanvas
    spec={vanillaSpec(biome, {camera})}
    loop={loop}
    seed={seed}
    post={dim ? {...post, wash: [{mode: 'multiply', color: [70, 84, 120], alpha: dim}, ...(post?.wash ?? [])]} : post}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// before / after

export type Blend = 'normal' | 'screen' | 'overlay' | 'multiply' | 'soft-light';
export type Stack = {node: ReactNode; mode: Blend; opacity?: number};

/** wipe timeline over one loop: [0..hold0] vanilla, sweep to +layer, hold, sweep back, short vanilla hold. Returns divider position 1.1 (all vanilla) .. -0.1 (all layered). */
export const wipeAt = (p: number, o: {hold0?: number; sweep?: number; holdAfter?: number} = {}) => {
  const a = o.hold0 ?? 0.14;
  const s = o.sweep ?? 0.17;
  const hAfter = o.holdAfter ?? 0.34;
  const e = (t: number) => t * t * (3 - 2 * t);
  if (p < a) return 1.1;
  if (p < a + s) return lerp(1.1, -0.1, e((p - a) / s));
  if (p < a + s + hAfter) return -0.1;
  if (p < a + 2 * s + hAfter) return lerp(-0.1, 1.1, e((p - a - s - hAfter) / s));
  return 1.1;
};

const SLANT = 96;

export const CompareLabel: FC<{text: string; gold?: boolean; opacity: number; right?: boolean}> = ({text, gold, opacity, right}) => (
  <div style={{position: 'absolute', top: 70, [right ? 'right' : 'left']: 80, opacity, transform: `translateY(${(1 - opacity) * -10}px)`}}>
    <PxText text={text} px={3} {...(gold ? TITLE_GOLD : {})} />
  </div>
);

/**
 * Slanted before/after wipe. `plate` is rendered once; each stack entry is clipped to the right-hand side and blended with its real CSS mode.
 * `chip` (e.g. "叠加 85%") is shown bottom-left while the layered side is visible.
 */
export const Compare: FC<{frames: number; plate: ReactNode; after?: ReactNode; stack: Stack[]; chip?: string | string[]; labelA?: string; labelB?: string; timing?: Parameters<typeof wipeAt>[1]}> = ({
  frames,
  plate,
  after,
  stack,
  chip,
  labelA = '原版',
  labelB = '地下城光影',
  timing,
}) => {
  const f = useCurrentFrame();
  const p = f / frames;
  const u = wipeAt(p, timing);
  const x = u * W;
  const clip = `polygon(${x + SLANT}px 0px, ${W + 400}px 0px, ${W + 400}px ${H}px, ${x - SLANT}px ${H}px)`;
  const visA = clamp01((u - 0.12) / 0.2);
  const visB = clamp01((0.88 - u) / 0.2);
  const lineOn = u > -0.06 && u < 1.06;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {plate}
      {after ? <div style={{position: 'absolute', inset: 0, clipPath: clip}}>{after}</div> : null}
      {stack.map((s, i) => {
        const st: CSSProperties = {position: 'absolute', inset: 0, clipPath: clip, mixBlendMode: s.mode, opacity: s.opacity ?? 1};
        return (
          <div key={i} style={st}>
            {s.node}
          </div>
        );
      })}
      {lineOn ? (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={x + SLANT + 7} y1={0} x2={x - SLANT + 7} y2={H} stroke="#050202" strokeWidth={8} opacity={0.75} />
          <line x1={x + SLANT} y1={0} x2={x - SLANT} y2={H} stroke="#F8D868" strokeWidth={6} />
          <polygon points={`${x},${H / 2 - 34} ${x + 26},${H / 2} ${x},${H / 2 + 34} ${x - 26},${H / 2}`} fill="#FECC06" stroke="#050202" strokeWidth={5} />
        </svg>
      ) : null}
      <CompareLabel text={labelA} opacity={visA} />
      <CompareLabel text={labelB} gold opacity={visB} right />
      {chip ? (
        <div style={{position: 'absolute', left: 80, bottom: 64, opacity: visB, display: 'flex', flexDirection: 'column', gap: 10}}>
          {(Array.isArray(chip) ? chip : [chip]).map((c, i) => (
            <PxText key={i} text={c} px={2} color={i === 0 ? '#F8D868' : '#C8CCD4'} />
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// glow helper

/** Gaussian-ish soft glow (additive 'lighter'): bright core, long smooth tail. r = radius where it reaches ~0. */
export const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: RGB | readonly number[], a: number, sy = 1) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.18, rgba(color, a * 0.62));
  g.addColorStop(0.38, rgba(color, a * 0.3));
  g.addColorStop(0.62, rgba(color, a * 0.1));
  g.addColorStop(0.82, rgba(color, a * 0.025));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
};
