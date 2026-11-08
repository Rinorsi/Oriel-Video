import {useMemo} from 'react';
import type {FC} from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {PIXEL_FONT} from '../../../mc/fonts';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Cv, Stage, W, H, curveStops, ease, hash, lerp, mixRgb, rgba, smooth, type RGB} from './common';

/**
 * Weather and sky layers: rain, snow, thunder (lightning + rain) and day/night tint. All transparent.
 */

const tex = (p: string) => staticFile(`mc/textures/${p}`);

/* ------------------------------------------------------------------ rain */

type RainLayer = {n: number; vy: number; len: [number, number]; w: number; a: number; land: [number, number]; R: number; ring: number; splash: number; seed: number};

const rainLayers = (g: number): RainLayer[] => [
  {n: 340, vy: 27, len: [38, 64], w: 1.3, a: 0.36, land: [g, g + 90], R: 13, ring: 22, splash: 0, seed: 11},
  {n: 200, vy: 42, len: [90, 140], w: 2.2, a: 0.48, land: [g + 90, g + 240], R: 18, ring: 42, splash: 4, seed: 23},
  {n: 84, vy: 64, len: [200, 300], w: 3.8, a: 0.6, land: [g + 240, H + 40], R: 24, ring: 74, splash: 6, seed: 37},
];

/**
 * atm-rain: three layers of slanted rain (far thin / mid / near thick motion streaks), ripples and splash crowns where drops hit the
 * ground band, a cool darkening and low drifting mist.
 * Props: intensity (0..1.4 drop density), wind (slant in degrees), groundY (top of the area where drops land, px), fog (0..1),
 *        dim (0..1 darkening), lit (0..1 extra brightness, used by thunder), fade (frames to ramp in).
 */
export const RainFx: FC<{intensity?: number; wind?: number; groundY?: number; fog?: number; dim?: number; lit?: number; fade?: number; seed?: number}> = ({
  intensity = 1,
  wind = 14,
  groundY = 720,
  fog = 1,
  dim = 1,
  lit = 0,
  fade = 22,
  seed = 0,
}) => {
  const f0 = useCurrentFrame();
  const ramp = fade <= 0 ? 1 : smooth(0, fade, f0);
  const layers = useMemo(() => rainLayers(groundY), [groundY]);
  const draw = (ctx: CanvasRenderingContext2D, f: number) => {
    const gust = wind + Math.sin(f / 37) * 2.2;
    const th = (gust * Math.PI) / 180;
    const sx = Math.sin(th);
    const cy = Math.cos(th);
    const tn = Math.tan(th);
    const bright = 1 + lit * 1.1;
    const cr = Math.round(lerp(196, 240, lit));
    const cg = Math.round(lerp(214, 246, lit));
    for (const L of layers) {
      const maxLand = L.land[1];
      const Tc = Math.ceil((maxLand + L.len[1]) / L.vy) + L.R + 30;
      const count = Math.round(L.n * intensity * ramp);
      for (let i = 0; i < count; i++) {
        const ph = hash(i, L.seed, seed) * Tc;
        const tt = f + ph;
        const k = Math.floor(tt / Tc);
        const t = tt - k * Tc;
        const len = lerp(L.len[0], L.len[1], hash(i, k, L.seed + 1));
        const landY = lerp(L.land[0], L.land[1], hash(i, k, L.seed + 2));
        const xl = lerp(-260, W + 260, hash(i, k, L.seed + 3));
        const tlMin = (landY + len) / L.vy;
        const tl = lerp(tlMin, Tc - L.R - 2, hash(i, k, L.seed + 4) * 0.9);
        if (t < tl) {
          const hy = landY - L.vy * (tl - t);
          if (hy < -len * cy - 4) continue;
          const hx = xl - tn * (landY - hy);
          const tx = hx - sx * len;
          const ty = hy - cy * len;
          const a = Math.min(1, L.a * bright * (0.75 + 0.5 * hash(i, k, L.seed + 5)));
          const grad = ctx.createLinearGradient(tx, ty, hx, hy);
          grad.addColorStop(0, `rgba(${cr},${cg},255,0)`);
          grad.addColorStop(1, `rgba(${cr},${cg},255,${a.toFixed(3)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = L.w;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();
        } else {
          const age = t - tl;
          if (age > L.R) continue;
          const p = age / L.R;
          const al = (1 - p) * 0.55 * bright;
          // landing splash: two flat pixel dashes skating outwards on the ground (no ripple ring)
          const reach = Math.round((L.ring * 0.5 * ease.out(p)) / 2) * 2;
          const dw = Math.max(4, Math.round(L.w * 3));
          const dh = Math.max(2, Math.round(L.w * 0.9 / 2) * 2);
          ctx.fillStyle = `rgba(20,40,70,${(al * 0.35).toFixed(3)})`;
          ctx.fillRect(Math.round(xl - reach - dw), landY + 2, dw, dh);
          ctx.fillRect(Math.round(xl + reach), landY + 2, dw, dh);
          ctx.fillStyle = `rgba(${cr},${cg},255,${Math.min(1, al * 1.3).toFixed(3)})`;
          ctx.fillRect(Math.round(xl - reach - dw), landY, dw, dh);
          ctx.fillRect(Math.round(xl + reach), landY, dw, dh);
          // splash crown: a few droplets thrown up in an arc
          if (L.splash && age < 11) {
            const s = Math.max(2, L.w * 1.3);
            for (let j = 0; j < L.splash; j++) {
              const ang = (-70 + (140 * (j + hash(i, k, j + 9))) / L.splash) * (Math.PI / 180);
              const v = (2.4 + hash(i, k, j + 19) * 3.2) * (L.ring / 30 + 0.4);
              const px = xl + Math.sin(ang) * v * age * 1.2;
              const py = landY - Math.cos(ang) * v * age * 1.4 + 0.42 * age * age;
              ctx.fillStyle = `rgba(${cr},${cg},255,${((1 - age / 11) * 0.85).toFixed(3)})`;
              ctx.fillRect(Math.round(px), Math.round(py), s, s);
            }
          }
        }
      }
    }
  };
  const drift = (a: number, b: number) => ((f0 * a + b) % 3600) - 800;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(to bottom, rgba(8,16,34,${(0.44 * dim * ramp).toFixed(3)}) 0%, rgba(10,20,38,${(0.2 * dim * ramp).toFixed(3)}) 55%, rgba(12,22,40,${(0.26 * dim * ramp).toFixed(3)}) 100%)`}} />
      <AbsoluteFill style={{background: `rgba(78,92,112,${(0.2 * dim * ramp).toFixed(3)})`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 150% 110% at 50% 45%, rgba(0,0,0,0) 40%, rgba(2,8,20,${(0.38 * dim * ramp).toFixed(3)}) 100%)`}} />
      <Cv draw={draw} />
      {/* low mist, three slow banks */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: drift(0.35 + i * 0.12, i * 1100),
            top: groundY - 120 + i * 70,
            width: 1900,
            height: 360,
            background: `radial-gradient(ellipse closest-side, rgba(${Math.round(lerp(190, 235, lit))},${Math.round(lerp(204, 240, lit))},222,${((0.3 - i * 0.05) * fog * ramp).toFixed(3)}), rgba(190,204,222,0))`,
          }}
        />
      ))}
      <AbsoluteFill style={{background: `linear-gradient(to top, rgba(170,188,210,${(0.2 * fog * ramp).toFixed(3)}), rgba(170,188,210,0) 30%)`}} />
    </AbsoluteFill>
  );
};

const RainDemo: FC = () => (
  <>
    <Stage plate="A" />
    <RainFx />
  </>
);

/* ------------------------------------------------------------------ snow */

/**
 * atm-snow: three layers of falling snow (far pixels / mid flakes / near soft bokeh), a shared wind that gusts and swings,
 * granules that land and fade in the ground band, and a pixel snow pile that slowly grows along the bottom edge.
 * Props: intensity (density 0..1.4), wind (px/frame drift), groundY (landing band top), pile (0..1 final pile height), fog (0..1), fade (ramp frames).
 */
export const SnowFx: FC<{intensity?: number; wind?: number; groundY?: number; pile?: number; fog?: number; fade?: number; frames?: number}> = ({intensity = 1, wind = 1.6, groundY = 800, pile = 0.85, fog = 1, fade = 20, frames = 150}) => {
  const f0 = useCurrentFrame();
  const ramp = fade <= 0 ? 1 : smooth(0, fade, f0);
  const pileH = pile * 120 * smooth(10, frames, f0);
  const draw = (ctx: CanvasRenderingContext2D, f: number) => {
    // cumulative wind displacement (integral of a gusting speed)
    const drift = wind * (0.7 * f + 0.3 * 52 * (1 - Math.cos(f / 52)));
    const layers = [
      {n: 280, size: [4, 6], vy: 1.5, sway: 18, a: 0.55, k: 0.5, soft: false, seed: 3},
      {n: 160, size: [8, 14], vy: 3.1, sway: 34, a: 0.82, k: 1.0, soft: false, seed: 5},
      {n: 34, size: [34, 64], vy: 6.8, sway: 60, a: 0.5, k: 1.7, soft: true, seed: 7},
    ];
    for (const L of layers) {
      const count = Math.round(L.n * intensity * ramp);
      const span = H + 160;
      for (let i = 0; i < count; i++) {
        const ph = hash(i, L.seed) * span;
        const y = ((f * L.vy + ph) % span) - 80;
        const sz0 = lerp(L.size[0], L.size[1], hash(i, L.seed, 1));
        const x0 = hash(i, L.seed, 2) * (W + 400);
        const sw = Math.sin(f * (0.02 + hash(i, L.seed, 3) * 0.03) + hash(i, L.seed, 4) * 6.28) * L.sway;
        const x = (((x0 + drift * L.k + sw) % (W + 400)) + (W + 400)) % (W + 400) - 200;
        const tw = 0.7 + 0.3 * Math.sin(f * 0.15 + i);
        // flakes in the landing band shrink and fade as they touch down
        const fadeLand = L.soft ? 1 : 1 - smooth(groundY + 40, groundY + 200, y) * 0.9;
        if (L.soft) {
          const r = sz0 * 0.5;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(255,255,255,${(L.a * tw).toFixed(3)})`);
          g.addColorStop(0.55, `rgba(235,245,255,${(L.a * tw * 0.7).toFixed(3)})`);
          g.addColorStop(1, 'rgba(235,245,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        } else {
          const s = Math.max(2, Math.round(sz0 / 2) * 2);
          ctx.fillStyle = `rgba(255,255,255,${(L.a * tw * fadeLand).toFixed(3)})`;
          ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s);
          if (s >= 8) {
            // little cross arms, so mid flakes read as snowflakes and not squares
            ctx.fillStyle = `rgba(210,230,255,${(L.a * 0.8 * fadeLand).toFixed(3)})`;
            ctx.fillRect(Math.round(x / 2) * 2 - 2, Math.round(y / 2) * 2 + 2, 2, s - 4);
            ctx.fillRect(Math.round(x / 2) * 2 + s, Math.round(y / 2) * 2 + 2, 2, s - 4);
          }
        }
      }
    }
    // landed granules
    const gn = Math.round(150 * intensity * ramp);
    for (let i = 0; i < gn; i++) {
      const Tc = 120;
      const ph = hash(i, 91) * Tc;
      const tt = f + ph;
      const k = Math.floor(tt / Tc);
      const t = tt - k * Tc;
      const y = lerp(groundY + 30, H - 8, Math.pow(hash(i, k, 92), 0.75));
      const x = hash(i, k, 93) * W;
      const depth = (y - groundY) / (H - groundY);
      const s = Math.max(2, Math.round((2 + depth * 6) / 2) * 2);
      const a = smooth(0, 3, t) * (1 - smooth(Tc - 50, Tc, t)) * (0.55 + depth * 0.4);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s);
      ctx.fillStyle = `rgba(170,200,235,${(a * 0.7).toFixed(3)})`;
      ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2 + s, s, 2);
    }
    // pile: stepped silhouette in 12px columns, lit top edge + blue shadow
    if (pileH > 1) {
      const col = 12;
      for (let cx = 0; cx < W; cx += col) {
        const n = hash(Math.floor(cx / col), 55) * 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(cx / 140 + 1));
        const h = Math.round((pileH * (0.35 + 0.65 * n)) / 6) * 6;
        ctx.fillStyle = 'rgba(205,224,246,0.96)';
        ctx.fillRect(cx, H - h, col, h);
        ctx.fillStyle = 'rgba(250,253,255,0.98)';
        ctx.fillRect(cx, H - h, col, Math.min(h, 6));
        ctx.fillStyle = 'rgba(150,182,222,0.9)';
        ctx.fillRect(cx, H - Math.min(h, 12), col, Math.min(h, 12) > 6 ? 6 : 0);
      }
    }
  };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(to bottom, rgba(150,190,235,${(0.16 * ramp).toFixed(3)}), rgba(190,215,245,${(0.05 * ramp).toFixed(3)}) 60%, rgba(215,232,250,${(0.14 * ramp).toFixed(3)}))`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 150% 110% at 50% 45%, rgba(0,0,0,0) 45%, rgba(40,70,120,${(0.22 * ramp).toFixed(3)}) 100%)`}} />
      <Cv draw={draw} />
      {[0, 1].map((i) => (
        <div key={i} style={{position: 'absolute', left: ((f0 * (0.3 + i * 0.12) + i * 1200) % 3400) - 900, top: groundY - 160 + i * 120, width: 1900, height: 380, background: `radial-gradient(ellipse closest-side, rgba(225,238,252,${((0.2 - i * 0.04) * fog * ramp).toFixed(3)}), rgba(225,238,252,0))`}} />
      ))}
    </AbsoluteFill>
  );
};

const SnowDemo: FC = () => (
  <>
    <Stage plate="B" />
    <SnowFx />
  </>
);

/* ------------------------------------------------------------------ thunder */

type Seg = {x1: number; y1: number; x2: number; y2: number; main: boolean};

const makeBolt = (seed: number, x0: number, y0: number, x1: number, y1: number, branchy = 1): Seg[] => {
  const segs: Seg[] = [];
  let c = 0;
  const r = () => hash(seed, c++);
  const rec = (ax: number, ay: number, bx: number, by: number, depth: number, main: boolean, off: number) => {
    if (depth === 0) {
      segs.push({x1: ax, y1: ay, x2: bx, y2: by, main});
      return;
    }
    const mx = (ax + bx) / 2 + (r() - 0.5) * off;
    const my = (ay + by) / 2 + (r() - 0.5) * off * 0.35;
    rec(ax, ay, mx, my, depth - 1, main, off * 0.52);
    rec(mx, my, bx, by, depth - 1, main, off * 0.52);
    if (depth >= 3 && depth <= 6 && r() < 0.34 * branchy) {
      const dx = bx - ax;
      const dy = by - ay;
      const ang = Math.atan2(dy, dx) + (r() < 0.5 ? -1 : 1) * (0.35 + r() * 0.55);
      const len = Math.hypot(dx, dy) * (0.9 + r() * 0.8);
      rec(mx, my, mx + Math.cos(ang) * len, my + Math.abs(Math.sin(ang)) * len * 0.9, depth - 2, false, off * 0.6);
    }
  };
  rec(x0, y0, x1, y1, 7, true, Math.hypot(x1 - x0, y1 - y0) * 0.34);
  return segs;
};

/** Snap segments to a P-pixel grid (Bresenham) and return unique cells. */
const boltCells = (segs: Seg[], P: number) => {
  const main = new Map<number, [number, number]>();
  const side = new Map<number, [number, number]>();
  for (const s of segs) {
    let x = Math.floor(s.x1 / P);
    let y = Math.floor(s.y1 / P);
    const ex = Math.floor(s.x2 / P);
    const ey = Math.floor(s.y2 / P);
    const dx = Math.abs(ex - x);
    const dy = -Math.abs(ey - y);
    const sx = x < ex ? 1 : -1;
    const sy = y < ey ? 1 : -1;
    let err = dx + dy;
    const target = s.main ? main : side;
    for (let guard = 0; guard < 400; guard++) {
      target.set((y + 100) * 4096 + (x + 100), [x, y]);
      if (x === ex && y === ey) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  return {main: [...main.values()], side: [...side.values()]};
};

const strikeEnv = (d: number) => {
  if (d < 0) return 0;
  const tbl = [0.95, 0.85, 0.72, 0.24, 0.62, 0.56, 0.4, 0.28, 0.2, 0.14];
  if (d < tbl.length) return tbl[Math.floor(d)];
  return 0.14 * Math.exp(-(d - 9) / 6);
};
const boltVis = (d: number) => (d < 0 || d >= 10 ? 0 : d === 3 ? 0.15 : d < 8 ? 1 : 0.6);

export type Strike = {at: number; x0: number; x1: number; y1: number; seed: number; power?: number};

/**
 * atm-thunder: a storm. Rain, then forked pixel lightning: flickering bolt, full-frame flash, lit clouds and rain, ground impact sparks,
 * thunder arriving a moment after the light.
 * Props: strikes [{at frame, x0 top x, x1/y1 ground point, seed, power 0..1}], intensity (rain density), sound (thunder rumble).
 */
export const Thunder: FC<{strikes?: Strike[]; intensity?: number; sound?: boolean}> = ({
  strikes = [
    {at: 36, x0: 1340, x1: 1040, y1: 790, seed: 4, power: 1},
    {at: 100, x0: 470, x1: 610, y1: 700, seed: 9, power: 0.7},
  ],
  intensity = 1.1,
  sound = true,
}) => {
  const f = useCurrentFrame();
  const bolts = useMemo(() => strikes.map((s) => ({s, cells: boltCells(makeBolt(s.seed, s.x0, -30, s.x1, s.y1), 8)})), [strikes]);
  let env = 0;
  for (const b of bolts) env = Math.max(env, strikeEnv(f - b.s.at) * (b.s.power ?? 1));
  // pre-strike gloom: the sky darkens before the first strike
  const first = Math.min(...strikes.map((s) => s.at));
  const gloom = smooth(0, first, f);
  const draw = (ctx: CanvasRenderingContext2D, fr: number) => {
    for (const b of bolts) {
      const d = fr - b.s.at;
      const vis = boltVis(d) * ((b.s.power ?? 1) > 0.5 ? 1 : 0.8);
      if (vis <= 0) continue;
      const P = 8;
      const glow = new Path2D();
      const core = new Path2D();
      const trunk = new Path2D();
      for (const [x, y] of b.cells.main) {
        trunk.rect(x * P - P / 2, y * P, P * 2, P);
        glow.rect(x * P - P * 2, y * P - P, P * 5, P * 3);
      }
      for (const [x, y] of b.cells.side) {
        core.rect(x * P, y * P, P, P);
        glow.rect(x * P - P, y * P - P, P * 3, P * 3);
      }
      ctx.save();
      ctx.globalAlpha = vis * 0.16;
      ctx.fillStyle = '#9ec2ff';
      ctx.fill(glow);
      ctx.globalAlpha = vis;
      ctx.shadowColor = 'rgba(150,190,255,1)';
      ctx.shadowBlur = 36;
      ctx.fillStyle = '#cfe0ff';
      ctx.fill(trunk);
      ctx.fillStyle = '#b8d0ff';
      ctx.fill(core);
      ctx.shadowBlur = 0;
      // white core line down the middle of the trunk
      const inner = new Path2D();
      for (const [x, y] of b.cells.main) inner.rect(x * P + P / 2, y * P, P, P);
      ctx.fillStyle = '#ffffff';
      ctx.fill(inner);
      ctx.restore();
      // ground impact: hot blob + sparks
      if (d >= 0 && d < 14) {
        const a = Math.exp(-d / 5);
        const g = ctx.createRadialGradient(b.s.x1, b.s.y1, 0, b.s.x1, b.s.y1, 170);
        g.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
        g.addColorStop(0.35, `rgba(170,205,255,${(a * 0.5).toFixed(3)})`);
        g.addColorStop(1, 'rgba(170,205,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(b.s.x1 - 170, b.s.y1 - 170, 340, 340);
        for (let i = 0; i < 16; i++) {
          const ang = hash(b.s.seed, i, 1) * Math.PI * 2;
          const v = 6 + hash(b.s.seed, i, 2) * 14;
          const px = b.s.x1 + Math.cos(ang) * v * d * 0.9;
          const py = b.s.y1 - Math.abs(Math.sin(ang)) * v * d * 0.9 + 0.5 * d * d * 0.5;
          const sz = 4 + (i % 3) * 2;
          ctx.fillStyle = `rgba(${i % 2 ? '255,255,255' : '190,215,255'},${(1 - d / 14).toFixed(3)})`;
          ctx.fillRect(Math.round(px / 2) * 2, Math.round(py / 2) * 2, sz, sz);
        }
      }
    }
  };
  return (
    <AbsoluteFill>
      <RainFx intensity={intensity} dim={0.9 + gloom * 0.7} lit={Math.min(1, env * 1.2)} wind={16} fade={18} />
      {/* lit cloud deck: the top of the frame brightens in a cold white */}
      <AbsoluteFill style={{background: `linear-gradient(to bottom, rgba(225,235,255,${(env * 0.62).toFixed(3)}), rgba(190,210,255,${(env * 0.2).toFixed(3)}) 55%, rgba(190,210,255,0))`}} />
      <Cv draw={draw} />
      <AbsoluteFill style={{background: `rgba(222,234,255,${(env * 0.5).toFixed(3)})`}} />
      {sound && strikes.map((s, i) => <Sfx key={i} at={s.at + 8 + i * 6} src={mcSound('ambient/weather/thunder1')} volume={0.9 * (s.power ?? 1)} rate={i ? 0.85 : 1} />)}
    </AbsoluteFill>
  );
};

const ThunderDemo: FC = () => (
  <>
    <Stage plate="B" />
    <Thunder />
  </>
);

/* ------------------------------------------------------------------ day / night */

type SkyKey = {h: number; tint: RGB; a: number; top: RGB; topA: number; hor: RGB; horA: number; stars: number};
const SKY: SkyKey[] = [
  {h: 0, tint: [10, 16, 50], a: 0.46, top: [8, 14, 60], topA: 0.5, hor: [30, 40, 110], horA: 0.1, stars: 1},
  {h: 4.5, tint: [16, 22, 64], a: 0.42, top: [14, 22, 80], topA: 0.5, hor: [60, 50, 130], horA: 0.18, stars: 0.9},
  {h: 5.8, tint: [120, 90, 140], a: 0.26, top: [90, 70, 150], topA: 0.45, hor: [255, 140, 100], horA: 0.5, stars: 0.35},
  {h: 7.2, tint: [255, 190, 140], a: 0.14, top: [255, 170, 130], topA: 0.2, hor: [255, 180, 110], horA: 0.32, stars: 0},
  {h: 10, tint: [255, 245, 230], a: 0, top: [255, 255, 255], topA: 0, hor: [255, 255, 255], horA: 0, stars: 0},
  {h: 15, tint: [255, 245, 230], a: 0, top: [255, 255, 255], topA: 0, hor: [255, 255, 255], horA: 0, stars: 0},
  {h: 16.8, tint: [255, 210, 150], a: 0.1, top: [255, 190, 130], topA: 0.18, hor: [255, 170, 90], horA: 0.3, stars: 0},
  {h: 18.2, tint: [255, 110, 60], a: 0.3, top: [210, 90, 90], topA: 0.42, hor: [255, 90, 50], horA: 0.62, stars: 0.1},
  {h: 19.4, tint: [80, 50, 120], a: 0.38, top: [60, 40, 120], topA: 0.5, hor: [190, 70, 100], horA: 0.34, stars: 0.5},
  {h: 21, tint: [12, 20, 62], a: 0.46, top: [8, 14, 64], topA: 0.5, hor: [30, 40, 110], horA: 0.1, stars: 1},
  {h: 24, tint: [10, 16, 50], a: 0.46, top: [8, 14, 60], topA: 0.5, hor: [30, 40, 110], horA: 0.1, stars: 1},
];
const skyAt = (hr: number): SkyKey => {
  const h = ((hr % 24) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && h >= SKY[i + 1].h) i++;
  const a = SKY[i];
  const b = SKY[i + 1];
  const t = smooth(a.h, b.h, h);
  return {h, tint: mixRgb(a.tint, b.tint, t), a: lerp(a.a, b.a, t), top: mixRgb(a.top, b.top, t), topA: lerp(a.topA, b.topA, t), hor: mixRgb(a.hor, b.hor, t), horA: lerp(a.horA, b.horA, t), stars: lerp(a.stars, b.stars, t)};
};

/**
 * atm-day-night: a colour-grade layer that follows the clock, plus a sun and a moon on their arcs and a field of twinkling stars.
 * Only tint gradients (whole-frame wash, sky-top cast, horizon glow) are drawn, the footage underneath stays visible.
 * Props: from / to (hours 0..24), start / dur (frames the clock runs), hour (fixed time, ignores from/to), showBodies (sun, moon, stars),
 *        clock (corner clock readout, default true), shootingStarAt (frame of the shooting star, null = none).
 */
export const DayNight: FC<{from?: number; to?: number; start?: number; dur?: number; showBodies?: boolean; hour?: number; clock?: boolean; shootingStarAt?: number | null}> = ({from = 4.6, to = 21.8, start = 4, dur = 168, showBodies = true, hour, clock: showClock = true, shootingStarAt = 118}) => {
  const f = useCurrentFrame();
  const hr = hour ?? lerp(from, to, ease.inOut(Math.min(1, Math.max(0, (f - start) / dur))));
  const k = skyAt(hr);
  const day = (hr % 24 + 24) % 24;
  // sun arc 5.5 -> 18.5, moon arc 17.5 -> 6.5
  const sunT = (day - 5.5) / 13;
  const moonT = day >= 17.5 ? (day - 17.5) / 13 : (day + 6.5) / 13;
  const arc = (t: number) => ({x: lerp(-140, W + 140, t), y: 560 - Math.sin(Math.PI * t) * 470});
  const sun = arc(sunT);
  const moon = arc(moonT);
  const sunVis = sunT >= -0.08 && sunT <= 1.08;
  const moonVis = moonT >= -0.08 && moonT <= 1.08;
  // sun reddens near the horizon
  const low = 1 - Math.sin(Math.PI * Math.min(1, Math.max(0, sunT)));
  const sunCol: RGB = mixRgb([255, 252, 225], [255, 110, 50], Math.pow(low, 1.6));
  const stars = useMemo(() => Array.from({length: 150}, (_, i) => ({x: hash(i, 1) * W, y: Math.pow(hash(i, 2), 1.5) * 620, s: hash(i, 3) < 0.12 ? 8 : hash(i, 3) < 0.45 ? 6 : 4, ph: hash(i, 4) * 6.28, sp: 0.05 + hash(i, 5) * 0.14})), []);
  const drawStars = (ctx: CanvasRenderingContext2D, fr: number) => {
    if (k.stars <= 0.01 || !showBodies) return;
    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(fr * s.sp + s.ph);
      const edge = 1 - smooth(300, 660, s.y);
      const a = k.stars * tw * edge;
      if (a < 0.03) continue;
      ctx.fillStyle = `rgba(${s.s >= 8 ? '255,246,210' : '235,240,255'},${a.toFixed(3)})`;
      const x = Math.round(s.x / 2) * 2;
      const y = Math.round(s.y / 2) * 2;
      ctx.fillRect(x, y, s.s, s.s);
      if (s.s >= 8) {
        ctx.fillStyle = `rgba(255,246,210,${(a * 0.6).toFixed(3)})`;
        ctx.fillRect(x - 4, y + 2, 4, 4);
        ctx.fillRect(x + s.s, y + 2, 4, 4);
        ctx.fillRect(x + 2, y - 4, 4, 4);
        ctx.fillRect(x + 2, y + s.s, 4, 4);
      }
    }
    // a shooting star late in the night
    const ss = shootingStarAt === null ? -1 : fr - shootingStarAt;
    if (ss >= 0 && ss < 16) {
      for (let j = 0; j < 9; j++) {
        const x = 1450 - ss * 36 + j * 22;
        const y = 130 + ss * 14 - j * 9;
        ctx.fillStyle = `rgba(255,255,255,${(k.stars * (1 - j / 9) * (1 - ss / 16)).toFixed(3)})`;
        ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 6 - Math.floor(j / 3) * 2, 6 - Math.floor(j / 3) * 2);
      }
    }
  };
  const hh = Math.floor(day);
  const mm = Math.floor((day - hh) * 60);
  const clockText = `${String(hh).padStart(2, '0')}:${String(mm - (mm % 5)).padStart(2, '0')}`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: rgba(k.tint, k.a * 0.8)}} />
      <AbsoluteFill style={{background: `linear-gradient(to bottom, ${rgba(k.top, k.topA)} 0%, ${rgba(k.top, k.topA * 0.35)} 45%, ${rgba(k.top, 0)} 70%)`}} />
      <AbsoluteFill style={{background: `linear-gradient(to top, ${rgba(k.hor, k.horA)} 0%, ${rgba(k.hor, k.horA * 0.8)} 18%, ${rgba(k.hor, 0)} 55%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 140% 110% at 50% 50%, rgba(0,0,0,0) 50%, ${rgba(mixRgb(k.tint, [0, 0, 0], 0.7), k.a * 0.8)} 100%)`}} />
      {showBodies && <Cv draw={drawStars} />}
      {showBodies && sunVis && (
        <>
          <div style={{position: 'absolute', left: sun.x - 520, top: sun.y - 520, width: 1040, height: 1040, background: `radial-gradient(circle closest-side, ${rgba(sunCol, 0.55 * (1 - 0.3 * low))} 0%, ${rgba(sunCol, 0.2)} 40%, ${rgba(sunCol, 0)} 100%)`}} />
          {/* pixel sun: stepped square rings */}
          <div style={{position: 'absolute', left: sun.x - 72, top: sun.y - 72, width: 144, height: 144, background: rgba(mixRgb([255, 250, 214], [255, 170, 80], low), 1), boxShadow: `0 0 0 12px ${rgba(mixRgb([255, 232, 130], [255, 120, 50], low), 1)}, 0 0 0 24px ${rgba(mixRgb([255, 206, 80], [235, 80, 40], low), 0.7)}, 0 0 0 36px ${rgba(mixRgb([255, 206, 80], [235, 80, 40], low), 0.32)}, inset -12px -12px 0 ${rgba(mixRgb([255, 226, 140], [255, 130, 60], low), 1)}`}} />
        </>
      )}
      {showBodies && moonVis && (
        <>
          <div style={{position: 'absolute', left: moon.x - 420, top: moon.y - 420, width: 840, height: 840, background: 'radial-gradient(circle closest-side, rgba(170,195,255,0.32) 0%, rgba(170,195,255,0.1) 45%, rgba(170,195,255,0) 100%)'}} />
          <div style={{position: 'absolute', left: moon.x - 66, top: moon.y - 66, width: 132, height: 132, background: '#eef2ff', boxShadow: '0 0 0 12px rgba(190,205,245,0.8), 0 0 0 24px rgba(170,195,255,0.28), inset -12px -12px 0 #c3cdee'}}>
            {[[24, 24, 24, 24], [72, 48, 12, 12], [36, 84, 24, 12], [84, 84, 12, 12]].map((c, i) => (
              <div key={i} style={{position: 'absolute', left: c[0], top: c[1], width: c[2], height: c[3], background: '#b4c0e4'}} />
            ))}
          </div>
        </>
      )}
      {showClock && <div style={{position: 'absolute', right: 56, top: 44, display: 'flex', alignItems: 'center', gap: 16, padding: '10px 22px', background: 'rgba(14,16,28,0.72)', border: '6px solid rgba(255,255,255,0.85)', boxShadow: '0 6px 0 rgba(0,0,0,0.5)'}}>
        <Img src={tex(`item/clock_${String(Math.floor((day / 24) * 64) % 64).padStart(2, '0')}.png`)} style={{width: 56, height: 56, imageRendering: 'pixelated'}} />
        <span style={{fontFamily: PIXEL_FONT, fontSize: 60, lineHeight: '60px', color: '#fff'}}>{clockText}</span>
      </div>}
    </AbsoluteFill>
  );
};

const DayNightDemo: FC = () => (
  <>
    <Stage plate="A" />
    <DayNight />
  </>
);

/* ------------------------------------------------------------------ entries */

export const weatherEntries: FxEntry[] = [
  {
    meta: {
      id: 'atm-day-night',
      name: '昼夜切换',
      category: 'atmosphere',
      tags: ['昼夜', '天色', '日落', '星空', '时间流逝', '透明层'],
      frames: 180,
      blurb: '时钟从深夜走到黎明、正午、黄昏、再入夜：画面叠加随时间变化的色调、天顶色偏与地平线霞光，太阳与月亮沿弧线划过，夜里星星闪烁并有流星。',
      usage: '时间流逝、“第N天”转场、从白天跳到夜晚的叙事；只叠色调，不替换背景。',
      params: [
        {name: 'from / to', desc: '起止小时（0..24），例如 from=17 to=22 只做日落到夜晚'},
        {name: 'start / dur', desc: '时钟开始帧与时长（帧）'},
        {name: 'hour', desc: '直接指定固定时刻（静态调色用，忽略 from/to）'},
        {name: 'showBodies', desc: '是否绘制太阳、月亮、星星'},
      ],
    },
    Demo: DayNightDemo,
    Layer: () => <DayNight />,
  },
  {
    meta: {
      id: 'atm-rain',
      name: '雨',
      category: 'atmosphere',
      tags: ['雨', '天气', '氛围', '水花', '雾', '透明层'],
      frames: 150,
      blurb: '三层斜雨（远细/中/近粗长拖尾），雨滴落在地面带贴地飞散的像素水线和飞溅水花，整体偏冷暗化，底部漂着低雾。',
      usage: '阴雨天、悲伤/压抑段落、雷暴前奏、赶路镜头。',
      params: [
        {name: 'intensity', desc: '雨量密度 0..1.4'},
        {name: 'wind', desc: '斜度（度）'},
        {name: 'groundY', desc: '地面带起点 y(px)，决定落地水花出现的范围'},
        {name: 'fog / dim', desc: '雾气 / 暗化程度 0..1'},
        {name: 'lit / fade', desc: '额外提亮（雷暴用）/ 淡入帧数'},
      ],
    },
    Demo: RainDemo,
    Layer: () => <RainFx />,
  },
  {
    meta: {
      id: 'atm-snow',
      name: '雪',
      category: 'atmosphere',
      tags: ['雪', '天气', '冬天', '氛围', '透明层'],
      frames: 150,
      blurb: '远处像素雪点、中景十字雪花、近景虚化大雪团三层飘落，风向忽强忽弱地摆动；落地的小雪粒淡出，画面底边慢慢堆起像素雪层。',
      usage: '冬季/雪山/圣诞主题、冷清安静的氛围段落。',
      params: [
        {name: 'intensity', desc: '雪量密度 0..1.4'},
        {name: 'wind', desc: '风速（px/帧，负数向左）'},
        {name: 'groundY', desc: '落地雪粒出现的区域起点 y'},
        {name: 'pile', desc: '底边积雪最终高度 0..1，0 关闭'},
        {name: 'fog / fade / frames', desc: '雾气 / 淡入帧数 / 积雪生长总帧数'},
      ],
    },
    Demo: SnowDemo,
    Layer: () => <SnowFx />,
  },
  {
    meta: {
      id: 'atm-thunder',
      name: '雷暴',
      category: 'atmosphere',
      tags: ['雷', '闪电', '暴雨', '天气', '音效', '透明层'],
      frames: 150,
      blurb: '暴雨中天色先压暗，随后分叉的像素闪电劈下：多段闪烁、全屏闪白、云层和雨线被照亮、落点溅出电火花，雷声稍后滚到。',
      usage: '恶劣天气、Boss 出场、恐怖/惊吓节点、剧情转折。',
      params: [
        {name: 'strikes', desc: '[{at 帧, x0 顶端x, x1/y1 落点, seed 闪电形状, power 0..1}]'},
        {name: 'intensity', desc: '雨量密度'},
        {name: 'sound', desc: '是否带雷声'},
      ],
    },
    Demo: ThunderDemo,
    Layer: () => <Thunder />,
  },
];
