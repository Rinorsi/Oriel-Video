import type {FC, ReactNode} from 'react';
import {clamp01} from '../../../mc/theme';
import {At, Pix, W, H, INK, hash, lerp, outCubic, inQuad, rnd, seg} from './kit';

/**
 * Pixel impact toolkit for the cute transitions: everything that used to be a "bang!" sticker or an expanding ring is
 * expressed with these instead. No text, no rings. All helpers are pure functions of the transition time `t`.
 * - Chips:     flat square debris (ink edge, light top-left highlight) snapped to a pixel grid.
 * - Smoke:     pixel puffs scattered in a blob that swell, drift outward and shrink away.
 * - Flare:     a pixel cross plus stepped trails of squares (local copy of mc/Fx Shockwave that takes `t`).
 * - GridFlash: a grid of cells flashing white in a wave.
 * - Streaks:   white speed / wind lines with an ink edge.
 */

const snapTo = (v: number, g: number) => Math.round(v / g) * g;

/**
 * Flat square chips flying out of (x, y). `size` is in grid units of `g` px; chips shrink in whole steps near the end of
 * their life. `spread` scatters the spawn point; `angle` is in degrees (0 = right, -90 = up).
 */
export const Chips: FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  count: number;
  seed: number;
  colors: string[];
  life?: number;
  speed?: [number, number];
  angle?: [number, number];
  gravity?: number;
  drag?: number;
  size?: [number, number];
  g?: number;
  spread?: number;
  ink?: boolean;
  z?: number;
}> = ({t, at, x, y, count, seed, colors, life = 30, speed = [500, 1400], angle = [0, 360], gravity = 2000, drag = 1.6, size = [1, 3], g = 8, spread = 0, ink = true, z = 40}) => {
  if (t < at || t > at + life + 4) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const r = rnd(seed * 211 + i * 13 + 7);
        const ang = (lerp(angle[0], angle[1], r()) * Math.PI) / 180;
        const sp = lerp(speed[0], speed[1], r());
        const lf = life * (0.7 + 0.3 * r());
        const a = t - at - r() * 2;
        const ox = (r() - 0.5) * 2 * spread;
        const oy = (r() - 0.5) * 2 * spread;
        const units = Math.max(1, Math.round(lerp(size[0], size[1], r())));
        const c = colors[Math.floor(r() * colors.length)];
        if (a < 0 || a > lf) return null;
        const tau = a / 30;
        const k = (1 - Math.exp(-drag * tau)) / drag;
        const cx = x + ox + Math.cos(ang) * sp * k;
        const cy = y + oy + Math.sin(ang) * sp * k + 0.5 * gravity * tau * tau;
        const u = a > lf * 0.55 ? Math.max(1, units - Math.floor(((a - lf * 0.55) / (lf * 0.45)) * units)) : units;
        const sz = u * g;
        const e = Math.max(2, g / 2);
        return (
          <div
            key={i}
            style={{position: 'absolute', left: snapTo(cx - sz / 2, g / 2), top: snapTo(cy - sz / 2, g / 2), width: sz, height: sz, background: c, boxShadow: ink ? `0 0 0 ${e}px ${INK}, inset ${e}px ${e}px 0 rgba(255,255,255,0.4)` : undefined}}
          />
        );
      })}
    </div>
  );
};

/**
 * Cartoon smoke / dust: pixel puffs scattered in a blob around (x, y) that swell, drift outward and shrink away.
 * Not a ring: start points are random inside `spread`. `tone` is an optional CSS filter (e.g. darker smoke), `flatY` < 1 flattens
 * the cloud into a low dust bank, `rise` is the upward drift in px per second.
 */
export const Smoke: FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  count: number;
  seed: number;
  dur?: number;
  spread?: number;
  drift?: [number, number];
  rise?: number;
  px?: number;
  grow?: [number, number];
  flatY?: number;
  tone?: string;
  fine?: number;
  z?: number;
}> = ({t, at, x, y, count, seed, dur = 26, spread = 120, drift = [80, 420], rise = 60, px = 12, grow = [0.5, 1.7], flatY = 1, tone, fine = 2, z = 36}) => {
  const a0 = t - at;
  if (a0 < 0 || a0 > dur + 4) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const r = rnd(seed * 331 + i * 29 + 11);
        const ang = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * spread;
        const sp = lerp(drift[0], drift[1], r());
        const lf = dur * (0.75 + 0.25 * r());
        const flip = r() > 0.5;
        const jitter = 0.8 + 0.4 * r();
        const a = a0 - r() * 3;
        if (a < 0 || a > lf) return null;
        const u = a / lf;
        const k = outCubic(u);
        const sc = lerp(grow[0], grow[1], outCubic(Math.min(1, a / (lf * 0.7)))) * (u > 0.62 ? 1 - inQuad((u - 0.62) / 0.38) : 1) * jitter;
        const cx = x + Math.cos(ang) * rad + Math.cos(ang) * sp * (lf / 30) * k * 0.5;
        const cy = y + (Math.sin(ang) * rad + Math.sin(ang) * sp * (lf / 30) * k * 0.5) * flatY - rise * (lf / 30) * k;
        return (
          <At key={i} x={snapTo(cx, 4)} y={snapTo(cy, 4)} s={Math.max(0.01, sc)} z={i}>
            <div style={{filter: r() > 0.5 ? tone : "brightness(0.86)"}}>
              <Pix s="puff" px={px} fine={fine} flip={flip} />
            </div>
          </At>
        );
      })}
    </div>
  );
};

/**
 * Pixel impact flare: a cross of bars plus stepped trails of squares flying out. `maxR` = how far the shards fly.
 */
export const Flare: FC<{t: number; at: number; x: number; y: number; color?: string; maxR?: number; life?: number; cell?: number; rays?: number; seed?: number; z?: number}> = ({
  t,
  at,
  x,
  y,
  color = '#ffffff',
  maxR = 520,
  life = 20,
  cell = 8,
  rays = 12,
  seed = 1,
  z = 45,
}) => {
  const f = t - at;
  if (f < 0 || f > life) return null;
  const u = f / life;
  const P = cell;
  const sn = (v: number) => snapTo(v, P);
  const q = rnd(seed * 17 + 5);
  const out: ReactNode[] = [];
  const fl = clamp01(1 - u * 2.4);
  if (fl > 0) {
    const arm = sn(maxR * 0.34 * (0.5 + outCubic(clamp01(u * 3)) * 0.9));
    const th = P * (fl > 0.5 ? 3 : 2);
    out.push(<div key="h" style={{position: 'absolute', left: sn(x - arm), top: sn(y - th / 2), width: arm * 2, height: th, background: color, opacity: fl}} />);
    out.push(<div key="v" style={{position: 'absolute', left: sn(x - th / 2), top: sn(y - arm), width: th, height: arm * 2, background: color, opacity: fl}} />);
    out.push(<div key="c" style={{position: 'absolute', left: sn(x - P * 2), top: sn(y - P * 2), width: P * 4, height: P * 4, background: '#fff', opacity: fl}} />);
  }
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + (q() - 0.5) * 0.3;
    const reach = maxR * (0.55 + q() * 0.45);
    const lag = q() * 0.1;
    const p = outCubic(clamp01((u - lag) / (1 - lag)));
    const fade = 1 - inQuad(clamp01((u - 0.4) / 0.6));
    for (let j = 0; j < 3; j++) {
      const rr = reach * Math.max(0, p - j * 0.05) + P * 2;
      const sz = Math.max(P, P * (2.4 - j * 0.8) * (0.5 + 0.5 * fade));
      out.push(
        <div key={`s${i}-${j}`} style={{position: 'absolute', left: sn(x + Math.cos(a) * rr - sz / 2), top: sn(y + Math.sin(a) * rr - sz / 2), width: sz, height: sz, background: j === 0 ? '#fff' : color, opacity: fade * (1 - j * 0.25)}} />,
      );
    }
  }
  return <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>{out}</div>;
};

/**
 * A grid of cells flashing white in a wave: each cell lights at `at + distance(origin) * reach` and decays within `dur` frames.
 * A "screen grid flickers" impact without any ring. `origin` defaults to the screen centre.
 */
export const GridFlash: FC<{t: number; at: number; cell?: number; dur?: number; reach?: number; color?: string; peak?: number; origin?: [number, number]; seed?: number; z?: number}> = ({
  t,
  at,
  cell = 120,
  dur = 7,
  reach = 8,
  color = '#ffffff',
  peak = 0.8,
  origin = [W / 2, H / 2],
  seed = 3,
  z = 50,
}) => {
  const a0 = t - at;
  if (a0 < 0 || a0 > dur + reach + 3) return null;
  const cols = Math.ceil(W / cell);
  const rows = Math.ceil(H / cell);
  const maxD = Math.hypot(W / 2, H / 2);
  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cx = c * cell + cell / 2;
      const cy = r * cell + cell / 2;
      const d = Math.hypot(cx - origin[0], cy - origin[1]) / maxD;
      const a = a0 - d * reach - hash(c + seed, r) * 1.5;
      if (a < 0 || a > dur) continue;
      if (hash(c * 7 + seed, r * 3) < 0.28 * (a / dur)) continue; // cells drop out one by one near the end
      cells.push(<div key={`${c}-${r}`} style={{position: 'absolute', left: c * cell, top: r * cell, width: cell, height: cell, background: color, opacity: peak * (1 - a / dur)}} />);
    }
  return <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>{cells}</div>;
};

/** White speed / wind streaks with an ink edge. `dir` 1 = rushing to the right, -1 = to the left. */
export const Streaks: FC<{t: number; at: number; dur?: number; count?: number; seed?: number; dir?: 1 | -1; thick?: number; z?: number; color?: string}> = ({t, at, dur = 22, count = 14, seed = 1, dir = 1, thick = 14, z = 48, color = '#ffffff'}) => {
  const a = t - at;
  if (a < 0 || a > dur + 8) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: z, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const y = 60 + hash(i, seed * 7) * (H - 120);
        const len = 360 + hash(i, seed * 7 + 1) * 640;
        const d = hash(i, seed * 7 + 2) * 8;
        const u = seg(a, d, d + dur - 8);
        if (u <= 0 || u >= 1) return null;
        const px = lerp(-len, W + 200, outCubic(u));
        const x = dir === 1 ? px : W - px - len;
        return <div key={i} style={{position: 'absolute', left: x, top: snapTo(y, 6), width: len, height: thick, background: color, boxShadow: `0 0 0 5px ${INK}`, opacity: 1 - seg(u, 0.75, 1)}} />;
      })}
    </div>
  );
};
