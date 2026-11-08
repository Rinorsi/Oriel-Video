// Deterministic noise helpers for the mcdscene engine (no Math.random anywhere).
export {mulberry32} from '../../../mc/theme';

/** Integer hash of 3 ints + seed -> [0,1). */
export const h3 = (x: number, y: number, z: number, s = 0): number => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 2147483647) + Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
export const h2 = (x: number, y: number, s = 0) => h3(x, y, 0, s);

const sm = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in [0,1). */
export const vnoise = (x: number, y: number, s = 0): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = sm(x - xi);
  const fy = sm(y - yi);
  const a = h2(xi, yi, s);
  const b = h2(xi + 1, yi, s);
  const c = h2(xi, yi + 1, s);
  const d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

/** Fractal noise in ~[0,1). */
export const fbm = (x: number, y: number, s = 0, oct = 4): number => {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x * f, y * f, s + i * 101);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
};

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export type RGB = [number, number, number];
export const hexRgb = (hex: string): RGB => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgbCss = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
