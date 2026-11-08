import type {CSSProperties, FC} from 'react';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';

/**
 * Shared helpers for the trans2 area: hashing / noise, easing windows and a pixel sprite renderer
 * with an automatic outline (outline is baked into the grid, so no CSS filters are needed).
 */

/** Integer hash -> 0..1. */
export const hash2 = (x: number, y: number, s = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Smooth value noise, roughly -> 0..1. */
export const vnoise = (x: number, y: number, s = 0) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

/** 0..1 progress of p between a and b. */
export const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** Eased window. */
export const ewin = (p: number, a: number, b: number, e: (t: number) => number = EASE.out) => e(win(p, a, b));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// ------------------------------------------------------------------ pixel sprites

export type Spr = {rows: string[]; palette: Record<string, string>};

const cache = new Map<string, {w: number; h: number; runs: {x: number; y: number; w: number; c: string}[]}>();

/** Pads the grid by 1, turns every empty cell touching a filled cell (4-neighbour) into the outline colour, merges runs. */
const build = (spr: Spr, outline: string | undefined) => {
  const key = spr.rows.join('|') + JSON.stringify(spr.palette) + (outline ?? '');
  const hit = cache.get(key);
  if (hit) return hit;
  const pad = outline ? 1 : 0;
  const w0 = spr.rows[0].length;
  const h0 = spr.rows.length;
  const w = w0 + pad * 2;
  const h = h0 + pad * 2;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w0 || y >= h0 ? '.' : spr.rows[y][x] ?? '.');
  const runs: {x: number; y: number; w: number; c: string}[] = [];
  for (let y = 0; y < h; y++) {
    let run: {x: number; y: number; w: number; c: string} | null = null;
    for (let x = 0; x < w; x++) {
      const sx = x - pad;
      const sy = y - pad;
      const ch = at(sx, sy);
      let c: string | null = null;
      if (ch !== '.' && ch !== ' ') c = spr.palette[ch] ?? null;
      else if (outline && (at(sx - 1, sy) !== '.' || at(sx + 1, sy) !== '.' || at(sx, sy - 1) !== '.' || at(sx, sy + 1) !== '.')) c = outline;
      if (c && run && run.c === c) run.w++;
      else {
        if (run) runs.push(run);
        run = c ? {x, y, w: 1, c} : null;
      }
    }
    if (run) runs.push(run);
  }
  const out = {w, h, runs};
  cache.set(key, out);
  return out;
};

/** Crisp pixel sprite with optional baked outline. `px` = screen size of one sprite pixel. The outline adds `px` on every side. */
export const Px: FC<{sprite: Spr; px: number; outline?: string; style?: CSSProperties}> = ({sprite, px, outline, style}) => {
  const b = build(sprite, outline);
  return (
    <svg width={b.w * px} height={b.h * px} viewBox={`0 0 ${b.w * px} ${b.h * px}`} shapeRendering="crispEdges" style={{overflow: 'visible', display: 'block', ...style}}>
      {b.runs.map((r, i) => (
        <rect key={i} x={r.x * px} y={r.y * px} width={r.w * px + 0.5} height={px + 0.5} fill={r.c} />
      ))}
    </svg>
  );
};

/** Hard drop shadow + soft glow string helpers. */
export const hardShadow = (dx: number, dy: number, c: string) => `${dx}px ${dy}px 0 ${c}`;

/** Little deterministic shake offset for a frame number. */
export const jitter = (frame: number, amp: number, seed = 1): [number, number] => {
  const a = hash2(frame, seed, 11) - 0.5;
  const b = hash2(frame, seed, 23) - 0.5;
  return [a * 2 * amp, b * 2 * amp];
};

// ------------------------------------------------------------------ particles


/**
 * Square pixel burst driven by transition progress. `p0` = start (0..1 of the transition), `T` = transition frames.
 * Particles fly out from (x, y), slow down with drag, then fall with gravity and fade.
 */
export const SquareBurst: FC<{
  p: number;
  T: number;
  p0: number;
  x: number;
  y: number;
  count?: number;
  colors: string[];
  speed?: number;
  life?: number;
  size?: number;
  gravity?: number;
  seed?: number;
  /** Angle range in degrees (0 = right, 90 = down). Default full circle. */
  arc?: [number, number];
  snap?: number;
}> = ({p, T, p0, x, y, count = 40, colors, speed = 22, life = 30, size = 14, gravity = 0.6, seed = 1, arc = [0, 360], snap = 4}) => {
  const age = (p - p0) * T;
  if (age < 0 || age > life) return null;
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const ang = ((arc[0] + r() * (arc[1] - arc[0])) * Math.PI) / 180;
        const v = speed * (0.3 + r() * 0.7);
        const l = life * (0.55 + r() * 0.45);
        const c = colors[Math.floor(r() * colors.length)];
        const s0 = size * (0.5 + r() * 0.9);
        if (age > l) return null;
        const k = (1 - Math.pow(0.9, age)) / 0.1;
        const px = x + Math.cos(ang) * v * k;
        const py = y + Math.sin(ang) * v * k + 0.5 * gravity * age * age;
        const fade = 1 - age / l;
        const s = Math.max(snap, Math.round((s0 * (0.4 + 0.6 * fade)) / snap) * snap);
        return <div key={i} style={{position: 'absolute', left: Math.round(px / snap) * snap, top: Math.round(py / snap) * snap, width: s, height: s, background: c, opacity: Math.min(1, fade * 1.8)}} />;
      })}
    </>
  );
};

// ------------------------------------------------------------------ canvas

let scratch: HTMLCanvasElement | null = null;
/** Composites an ImageData over what is already on the canvas (putImageData would overwrite it). */
export const blit = (ctx: CanvasRenderingContext2D, img: ImageData) => {
  if (!scratch || scratch.width !== img.width || scratch.height !== img.height) {
    scratch = document.createElement('canvas');
    scratch.width = img.width;
    scratch.height = img.height;
  }
  scratch.getContext('2d')!.putImageData(img, 0, 0);
  ctx.drawImage(scratch, 0, 0);
};
