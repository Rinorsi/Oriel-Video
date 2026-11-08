import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, mulberry32} from '../../../mc/theme';
import {FLAT} from '../../flat';
import {SPR, heartOf, starOf, type HeartColor, type SprName, type Sprite, type StarColor} from './sprites';

/**
 * Shared kit for the cute transitions (area `cute`).
 * - Pix: sprite renderer with a baked ink outline / hard shadow, crisp at any integer `px`.
 * - easing helpers, At (centred absolute wrapper), Confetti (hearts / stars / squares), Sprinkle, Checker, Rays, Polka, Flash, Rainbow.
 * - (No sticker words and no expanding rings: impact.tsx has the pixel chips / smoke / cross flare used instead.)
 * Everything is a pure function of the time `t` (frames since the transition start) - no state, no Math.random.
 */

export const INK = FLAT.ink;
export const W = 1920;
export const H = 1080;

// ---------------------------------------------------------------- math

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (v: number, a: number, b: number, e: (t: number) => number = (t) => t) => e(clamp01((v - a) / (b - a)));
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const inCubic = (t: number) => t * t * t;
export const inQuad = (t: number) => t * t;
export const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outBack = (t: number, s = 1.9) => {
  const c = t - 1;
  return 1 + (s + 1) * c * c * c + s * c * c;
};
export const outElastic = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
export const outBounce = (t: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
/** Damped wobble 0..1 -> about -1..1. */
export const wobble = (t: number, k = 3, damp = 4) => Math.sin(t * Math.PI * 2 * k) * Math.exp(-t * damp);
export const rnd = (seed: number) => mulberry32(seed);
/** Cheap deterministic hash in 0..1. */
export const hash = (a: number, b = 0) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ---------------------------------------------------------------- sprites

type Baked = {w: number; h: number; layers: {fill: string; d: string}[]};
const bakeCache = new WeakMap<Sprite, Map<string, Baked>>();

const SHADOW = 'rgba(43,35,56,0.38)';

const bake = (s: Sprite, outline: string | false, shadow: boolean, fine = 1): Baked => {
  const key = `${outline}|${shadow}|${fine}`;
  let per = bakeCache.get(s);
  if (!per) bakeCache.set(s, (per = new Map()));
  const hit = per.get(key);
  if (hit) return hit;
  const sw = Math.max(...s.rows.map((r) => r.length)) * fine;
  const sh = s.rows.length * fine;
  const pad = outline ? 1 : 0;
  const w = sw + pad * 2;
  const h = sh + pad * 2 + (shadow ? 1 : 0);
  const cells: (string | null)[][] = Array.from({length: h}, () => Array<string | null>(w).fill(null));
  for (let y = 0; y < sh; y++) {
    const row = s.rows[Math.floor(y / fine)];
    for (let x = 0; x < row.length * fine; x++) {
      const c = row[Math.floor(x / fine)];
      if (c !== '.' && s.palette[c]) cells[y + pad][x + pad] = s.palette[c];
    }
  }
  if (outline) {
    const filled = cells.map((r) => r.map((c) => c !== null));
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (!filled[y][x] && ((y > 0 && filled[y - 1][x]) || (y < h - 1 && filled[y + 1][x]) || (x > 0 && filled[y][x - 1]) || (x < w - 1 && filled[y][x + 1]))) cells[y][x] = outline;
  }
  if (shadow) {
    const solid = cells.map((r) => r.map((c) => c !== null));
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) if (!solid[y][x] && solid[y - 1][x]) cells[y][x] = SHADOW;
  }
  const byColor = new Map<string, string>();
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = cells[y][x];
      if (c === null) {
        x++;
        continue;
      }
      let e = x;
      while (e < w && cells[y][e] === c) e++;
      byColor.set(c, (byColor.get(c) ?? '') + `M${x} ${y}h${e - x}v1h${x - e}z`);
      x = e;
    }
  }
  const out: Baked = {w, h, layers: [...byColor].map(([fill, d]) => ({fill, d}))};
  per.set(key, out);
  return out;
};

/** Size in screen px of a sprite incl. its baked outline. */
export const pixSize = (s: Sprite | SprName, px: number, outline = true, shadow = false, fine = 1) => {
  const b = bake(typeof s === 'string' ? SPR[s] : s, outline ? INK : false, shadow, fine);
  return {w: (b.w * px) / fine, h: (b.h * px) / fine};
};

/** `px` = screen size of one sprite pixel. `fine` = 2 draws outline/shadow at half a sprite pixel (thinner ink on big sprites). */
export const Pix: FC<{s: Sprite | SprName; px: number; outline?: string | false; shadow?: boolean; fine?: number; flip?: boolean; style?: CSSProperties}> = ({s, px, outline = INK, shadow = false, fine = 1, flip, style}) => {
  const b = bake(typeof s === 'string' ? SPR[s] : s, outline, shadow, fine);
  return (
    <svg width={(b.w * px) / fine} height={(b.h * px) / fine} viewBox={`0 0 ${b.w} ${b.h}`} shapeRendering="crispEdges" style={{display: 'block', overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined, ...style}}>
      {b.layers.map((l, i) => (
        <path key={i} d={l.d} fill={l.fill} />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------- layout

/** Absolutely positioned, centred on (x, y), with rotation and scale. */
export const At: FC<{x: number; y: number; rot?: number; s?: number; sx?: number; sy?: number; z?: number; origin?: string; style?: CSSProperties; children?: ReactNode}> = ({x, y, rot = 0, s = 1, sx, sy, z, origin, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, zIndex: z, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${(sx ?? 1) * s},${(sy ?? 1) * s})`, transformOrigin: origin, ...style}}>{children}</div>
);

export const Flash: FC<{o: number; color?: string}> = ({o, color = FLAT.cream}) => (o <= 0.003 ? null : <AbsoluteFill style={{background: color, opacity: Math.min(1, o)}} />);

export const Checker: FC<{a: string; b: string; size: number; x?: number; y?: number; style?: CSSProperties}> = ({a, b, size, x = 0, y = 0, style}) => (
  <div style={{position: 'absolute', inset: 0, backgroundImage: `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0)`, backgroundSize: `${size * 2}px ${size * 2}px`, backgroundPosition: `${x}px ${y}px`, ...style}} />
);

/** Sunburst rays around (cx, cy). */
export const Rays: FC<{a: string; b: string; rot: number; n?: number; cx?: number; cy?: number; style?: CSSProperties}> = ({a, b, rot, n = 12, cx = W / 2, cy = H / 2, style}) => {
  const w = 360 / n / 2;
  return <div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-conic-gradient(from ${rot}deg at ${cx}px ${cy}px, ${a} 0deg ${w}deg, ${b} ${w}deg ${w * 2}deg)`, ...style}} />;
};

/** Flat polka dots (dot colour over transparent). */
export const Polka: FC<{color: string; size?: number; r?: number; x?: number; y?: number; style?: CSSProperties}> = ({color, size = 72, r = 9, x = 0, y = 0, style}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(circle at ${size / 2}px ${size / 2}px, ${color} 0 ${r}px, transparent ${r + 0.5}px)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${x}px ${y}px`,
      ...style,
    }}
  />
);

// ---------------------------------------------------------------- particles

export type Kind = 'heart' | 'star' | 'sq' | 'spark' | 'dot' | 'puff' | `s:${SprName}`;
const SQ_COLORS = [FLAT.pink, FLAT.yellow, FLAT.sky, FLAT.mint, FLAT.orange, FLAT.lilac, FLAT.red, FLAT.green];
const HEART_COLORS: HeartColor[] = ['pink', 'red', 'white', 'lilac'];
const STAR_COLORS: StarColor[] = ['yellow', 'pink', 'sky', 'mint', 'white'];

/** One particle sprite/shape at a given size. */
export const Bit: FC<{kind: Kind; px: number; variant: number; color?: string}> = ({kind, px, variant, color}) => {
  if (kind === 'heart') return <Pix s={heartOf(HEART_COLORS[variant % HEART_COLORS.length])} px={px} />;
  if (kind === 'star') return <Pix s={starOf(STAR_COLORS[variant % STAR_COLORS.length])} px={px} />;
  if (kind === 'spark') return <Pix s={SPR.spark} px={px} outline={false} />;
  if (kind === 'puff') return <Pix s={SPR.puff} px={px} />;
  if (kind.startsWith('s:')) return <Pix s={kind.slice(2) as SprName} px={px} />;
  const c = color ?? SQ_COLORS[variant % SQ_COLORS.length];
  const sz = px * 4;
  if (kind === 'dot') return <div style={{width: sz, height: sz, borderRadius: '50%', background: c, boxShadow: `0 0 0 ${Math.max(3, px)}px ${INK}`}} />;
  return <div style={{width: sz, height: sz, background: c, boxShadow: `0 0 0 ${Math.max(3, px)}px ${INK}, inset 0 ${Math.max(3, px)}px 0 rgba(255,255,255,0.55)`}} />;
};

/**
 * Burst of particles from (x, y) starting at frame `at`.
 * angle = [min, max] degrees (0 = right, -90 = up); speed in px/s; gravity in px/s^2; `px` = sprite pixel size range.
 */
export const Confetti: FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  count: number;
  seed: number;
  life?: number;
  speed?: [number, number];
  angle?: [number, number];
  gravity?: number;
  drag?: number;
  kinds?: Kind[];
  px?: [number, number];
  spin?: number;
  z?: number;
}> = ({t, at, x, y, count, seed, life = 36, speed = [500, 1300], angle = [0, 360], gravity = 1400, drag = 2.2, kinds = ['heart', 'star', 'sq', 'spark'], px = [4, 8], spin = 360, z = 40}) => {
  if (t < at || t > at + life + 6) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const r = rnd(seed * 131 + i * 17 + 3);
        const ang = (lerp(angle[0], angle[1], r()) * Math.PI) / 180;
        const sp = lerp(speed[0], speed[1], r());
        const delay = r() * 3;
        const lf = life * (0.7 + 0.3 * r());
        const a = t - at - delay;
        if (a < 0 || a > lf) return null;
        const tau = a / 30;
        const k = (1 - Math.exp(-drag * tau)) / drag;
        const px0 = Math.round(lerp(px[0], px[1], r()));
        const rot0 = r() * 360;
        const sgn = r() < 0.5 ? -1 : 1;
        const kind = kinds[Math.floor(r() * kinds.length)];
        const variant = Math.floor(r() * 8);
        const sc = Math.min(1, a / 3) * (a > lf * 0.7 ? 1 - inQuad((a - lf * 0.7) / (lf * 0.3)) : 1);
        const cx = x + Math.cos(ang) * sp * k;
        const cy = y + Math.sin(ang) * sp * k + 0.5 * gravity * tau * tau;
        return (
          <At key={i} x={cx} y={cy} rot={rot0 + sgn * spin * tau} s={sc}>
            <Bit kind={kind} px={px0} variant={variant} />
          </At>
        );
      })}
    </div>
  );
};

/**
 * Static twinkling decorations scattered over the whole frame (deterministic), visible between `at` and `at + dur`.
 * Use to fill empty corners: they pulse with `t`.
 */
export const Sprinkle: FC<{t: number; at: number; dur: number; seed: number; count: number; kinds?: Kind[]; px?: [number, number]; z?: number; drift?: number}> = ({t, at, dur, seed, count, kinds = ['star', 'heart', 'spark'], px = [3, 6], z = 30, drift = 40}) => {
  const a = t - at;
  if (a < 0 || a > dur) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const r = rnd(seed * 977 + i * 31 + 5);
        const x0 = r() * W;
        const y0 = r() * H;
        const d = r() * 14;
        const aa = a - d;
        if (aa < 0 || aa > dur - d) return null;
        const life = dur - d;
        const sc = outBack(clamp01(aa / 6), 3) * (aa > life - 6 ? clamp01((life - aa) / 6) : 1) * (0.85 + 0.15 * Math.sin(aa * 0.5 + i));
        const kind = kinds[Math.floor(r() * kinds.length)];
        return (
          <At key={i} x={x0 + Math.sin(aa * 0.1 + i) * drift * 0.2} y={y0 - aa * (drift / 30)} rot={(r() - 0.5) * 40} s={sc}>
            <Bit kind={kind} px={Math.round(lerp(px[0], px[1], r()))} variant={Math.floor(r() * 8)} />
          </At>
        );
      })}
    </div>
  );
};

/** Cover helper: clamp a value to 0..1 and ease. */
export const cov = (v: number) => clamp01(v);

/** Flat rainbow arch (half ring) centred on (cx, cy); `R` = outer radius, `bw` = band width, `grow` 0..1 draws it left to right. */
export const Rainbow: FC<{cx: number; cy: number; R: number; bw?: number; grow?: number}> = ({cx, cy, R, bw = 34, grow = 1}) => {
  const n = RAINBOW_COLORS.length;
  const total = n * bw;
  const arc = (r: number) => `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`;
  const dash = `${grow} 2`;
  const pad = 40;
  return (
    <div style={{position: 'absolute', left: cx - R - pad, top: cy - R - pad, width: (R + pad) * 2, height: R + pad * 2}}>
      <svg width={(R + pad) * 2} height={R + pad * 2} viewBox={`${-R - pad} ${-R - pad} ${(R + pad) * 2} ${R + pad * 2}`} style={{overflow: 'visible', display: 'block'}}>
        <path d={arc(R - total / 2)} pathLength={1} fill="none" stroke={INK} strokeWidth={total + 22} strokeDasharray={dash} />
        {RAINBOW_COLORS.map((c, k) => (
          <path key={k} d={arc(R - k * bw - bw / 2)} pathLength={1} fill="none" stroke={c} strokeWidth={bw + 0.6} strokeDasharray={dash} />
        ))}
        <path d={arc(R - 7)} pathLength={1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={8} strokeDasharray={dash} />
      </svg>
    </div>
  );
};
// the blue band is a deeper blue than the sky strips behind it, otherwise it melts into the background and the arch looks broken
const RAINBOW_COLORS = [FLAT.red, FLAT.orange, FLAT.yellow, FLAT.green, '#3f8cff', FLAT.purple];
