// Canvas special-effect primitives for the mcdscene engine. Everything is a pure function of (ctx, view, params):
// no Math.random, no timers. Loops are exact: every periodic motion completes an integer number of cycles per `view.loop`.
// Time scale: motions are written as "cycles per ~200 frames" and scaled up for long loops (see `cyc`), so a loop of
// 2400 frames (80 s) keeps the natural speed (ember life ~200 f, fireflies ~100-200 f, flicker 8-30 f ...) instead of
// slowing down 12x. Particle fields re-seed their position on every life (generation index), so nothing visibly repeats
// inside one loop, yet frame 0 and frame `loop` are identical (the generation index is taken modulo the cycle count).
import {clamp, h2, h3, hexRgb, type RGB} from './rng';

export type Ctx = CanvasRenderingContext2D;

export type View = {
  W: number;
  H: number;
  frame: number;
  /** Loop length in frames; periodic motions use integer cycle counts over it. */
  loop: number;
  /** Project grid coordinates to screen. s = screen px per buffer px at that point. */
  proj: (gx: number, gy: number, gz: number) => {x: number; y: number; s: number};
  /** Screen px of one block width at the screen centre (particle sizing). */
  tw: number;
  /** Tile diamond height/width ratio. */
  ratio: number;
};

export const frac = (v: number) => v - Math.floor(v);
const TAU = Math.PI * 2;
/** Reference life in frames: `cycles` below means "repeats per ~200 frames". */
const REF_LIFE = 200;
/** Multiplier that turns "cycles per ~200 frames" into whole cycles per loop (1 for the legacy short loops <= 450 frames). */
const unitOf = (loop: number) => (loop <= 450 ? 1 : Math.max(1, Math.round(loop / REF_LIFE)));
/** Phase of a periodic motion: `cycles` repeats per ~200 frames (whole cycles per loop, so frame 0 == frame `loop`). */
export const cyc = (v: View, cycles: number, phase = 0) => frac((v.frame * cycles * unitOf(v.loop)) / v.loop + phase);
/** Phase of a motion with a natural period of `period` frames (rounded to a whole number of cycles per loop). */
export const per = (v: View, period: number, phase = 0) => frac((v.frame * Math.max(1, Math.round(v.loop / period))) / v.loop + phase);
/** Like cyc, plus the life/generation index g (0..N-1, periodic over the loop) so a particle can re-seed on every life. */
export const clock = (v: View, cycles: number, phase = 0) => {
  const N = Math.max(1, Math.round(cycles * unitOf(v.loop)));
  const t = (v.frame * N) / v.loop + phase;
  const fl = Math.floor(t);
  return {a: t - fl, g: ((fl % N) + N) % N};
};
/** Hash channel for generation g (g = 0 reproduces the legacy single-life values). */
const gch = (ch: number, g: number) => ch + 32 * g;
/** Periodic flicker: sin with an integer number of cycles per loop, roughly `hz` cycles per second at 30 fps. */
export const pulse = (v: View, hz: number, phase = 0) => Math.sin(TAU * Math.max(1, Math.round((v.loop * hz) / 30)) * (v.frame / v.loop) + phase);
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const snap = (n: number, q: number) => Math.round(n / q) * q;
/** Fade in/out envelope of a particle with life fraction a in [0,1). */
const env = (a: number, i = 0.12, o = 0.35) => (a < i ? a / i : a > 1 - o ? (1 - a) / o : 1);

// ---------------------------------------------------------------------------------------------------------------------
// Pixel sprites

const SPR = {
  flameA: ['..e..', '.eoe.', '.eyo.', 'eoywo', 'eoyyo', '.oyyo', '..oe.'],
  flameB: ['.e...', '.eo..', '.oyoe', 'eoywo', 'eoyyo', '.oyyo', '..oe.'],
  flameC: ['...e.', '..oe.', 'eoyo.', 'oywoe', 'oyyoe', 'oyyo.', '.eo..'],
  ghost: ['.WWWWWW.', 'WWWWWWWW', 'WDDWWDDW', 'WDDWWDDW', 'WWWWWWWW', 'WWDDDDWW', 'WWDWWDWW', 'WWWWWWWW', '.WW.WW.W', '..W..W..'],
} as const;

const FLAME_COL: Record<string, string> = {w: '#ffffe5', y: '#ffe07a', o: '#f1ba5b', e: '#d88d57'};
const SOUL_FLAME_COL: Record<string, string> = {w: '#f5fefc', y: '#a8f4f0', o: '#50aea0', e: '#2d7f86'};

const drawSprite = (ctx: Ctx, rows: readonly string[], x: number, y: number, q: number, colors: Record<string, string>, alpha = 1) => {
  ctx.globalAlpha = alpha;
  for (let j = 0; j < rows.length; j++)
    for (let i = 0; i < rows[j].length; i++) {
      const c = rows[j][i];
      if (c === '.') continue;
      ctx.fillStyle = colors[c];
      ctx.fillRect(Math.round(x + i * q), Math.round(y + j * q), Math.ceil(q), Math.ceil(q));
    }
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------------------------------------------------------------
// Light pools & flames

/** Elliptical additive light pool on the ground plane. */
export const lightPool = (ctx: Ctx, v: View, o: {at: [number, number, number]; color: RGB; radius: number; alpha: number}) => {
  const p = v.proj(o.at[0], o.at[1], o.at[2]);
  const R = o.radius * v.tw * (p.s / 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(p.x, p.y);
  ctx.scale(1, Math.max(0.55, v.ratio));
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, rgba(o.color, o.alpha));
  g.addColorStop(0.3, rgba(o.color, o.alpha * 0.42));
  g.addColorStop(0.7, rgba(o.color, o.alpha * 0.1));
  g.addColorStop(1, rgba(o.color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
};

/** A pixel flame (torch/campfire) with a tight hot glow. */
export const flame = (ctx: Ctx, v: View, o: {at: [number, number, number]; soul?: boolean; scale?: number; seed?: number}) => {
  const p = v.proj(o.at[0], o.at[1], o.at[2]);
  const q = Math.max(3, Math.round(v.tw * p.s * 0.05 * (o.scale ?? 1)));
  const seed = o.seed ?? 0;
  // the sprite changes every ~3 frames; steps per loop is a multiple of 3 so the 3-sprite cycle closes exactly
  const steps = Math.max(3, Math.round(v.loop / 3 / 3) * 3);
  const f = Math.floor((v.frame * steps) / v.loop + h2(seed, 3) * 9) % 3;
  const rows = f === 0 ? SPR.flameA : f === 1 ? SPR.flameB : SPR.flameC;
  const flick = 0.85 + 0.15 * pulse(v, 4.3, seed * 3.1) * pulse(v, 1.8, seed);
  const col = o.soul ? SOUL_FLAME_COL : FLAME_COL;
  const gc: RGB = o.soul ? [110, 230, 235] : [255, 214, 120];
  const r = q * 7 * flick;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(p.x, p.y - q * 3, 0, p.x, p.y - q * 3, r);
  g.addColorStop(0, rgba(gc, 0.55));
  g.addColorStop(0.4, rgba(gc, 0.18));
  g.addColorStop(1, rgba(gc, 0));
  ctx.fillStyle = g;
  ctx.fillRect(p.x - r, p.y - q * 3 - r, r * 2, r * 2);
  ctx.restore();
  drawSprite(ctx, rows, p.x - q * 2.5, p.y - q * 7, q, col, 1);
};

// ---------------------------------------------------------------------------------------------------------------------
// Particle fields

export type FieldBase = {
  /** Number of particles. */
  n: number;
  seed: number;
  /** Grid-space box the particles live in: [x0,y0,z0,x1,y1,z1]. */
  box: [number, number, number, number, number, number];
};

/** Rising embers / ash: square sparks drifting up from a box, additive when hot. */
export const embers = (ctx: Ctx, v: View, o: FieldBase & {rise?: number; colors?: string[]; ash?: number; size?: number; cycles?: number; wind?: number}) => {
  const colors = o.colors ?? ['#ffd24a', '#f08229', '#ffb12e', '#fff2a0'];
  const rise = o.rise ?? 5;
  const size = o.size ?? 1;
  ctx.save();
  for (let i = 0; i < o.n; i++) {
    const cy = (o.cycles ?? 1) + (i % 3 === 0 ? 1 : 0);
    const {a, g} = clock(v, cy, h3(i, 4, o.seed, 14));
    const hx = h3(i, gch(1, g), o.seed, 11);
    const hy = h3(i, gch(2, g), o.seed, 12);
    const hz = h3(i, gch(3, g), o.seed, 13);
    const gx = o.box[0] + (o.box[3] - o.box[0]) * hx + Math.sin((a + hx) * TAU * 2) * 0.45 + (o.wind ?? 0.5) * a * 1.5;
    const gy = o.box[1] + (o.box[4] - o.box[1]) * hy + Math.cos((a + hy) * TAU) * 0.3;
    const gz = o.box[2] + (o.box[5] - o.box[2]) * hz + a * rise;
    const p = v.proj(gx, gy, gz);
    const e = env(a, 0.08, 0.45);
    const q = Math.max(2, Math.round(v.tw * 0.045 * size * (0.6 + 0.7 * h3(i, 5, o.seed, 15))));
    const ash = (o.ash ?? 0) > h3(i, 6, o.seed, 16);
    if (ash) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = e * 0.55;
      ctx.fillStyle = '#2a1c20';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), q, q);
      ctx.globalAlpha = e * 0.9;
      ctx.fillStyle = '#6b5a5e';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), q, Math.max(1, q >> 1));
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = e;
      ctx.fillStyle = colors[Math.floor(h3(i, 7, o.seed, 17) * colors.length) % colors.length];
      ctx.fillRect(Math.round(p.x), Math.round(p.y), q, q);
      ctx.globalAlpha = e * 0.1;
      ctx.fillRect(Math.round(p.x) - q, Math.round(p.y) - q, q * 3, q * 3);
    }
  }
  ctx.restore();
};

/** Fireflies: tiny warm squares that wander and blink, with a soft halo. */
export const fireflies = (ctx: Ctx, v: View, o: FieldBase & {color?: string; halo?: RGB; size?: number}) => {
  const col = o.color ?? '#fefedc';
  const halo = o.halo ?? [216, 141, 87];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < o.n; i++) {
    const hx = h3(i, 1, o.seed, 21);
    const hy = h3(i, 2, o.seed, 22);
    const hz = h3(i, 3, o.seed, 23);
    const k1 = 1 + (i % 2);
    const k2 = 1 + ((i >> 1) % 2);
    const a = cyc(v, 1, h3(i, 4, o.seed, 24));
    // a second, slow wander (~600-800 frames) so the short wiggle never reads as a repeat
    const b = per(v, 600 + (i % 3) * 100, hx);
    const gx = o.box[0] + (o.box[3] - o.box[0]) * hx + Math.sin(a * TAU * k1 + hx * 9) * 0.7 + Math.sin(b * TAU + hy * 13) * 1.5;
    const gy = o.box[1] + (o.box[4] - o.box[1]) * hy + Math.cos(a * TAU * k2 + hy * 9) * 0.7 + Math.cos(b * TAU + hz * 11) * 1.2;
    const gz = o.box[2] + (o.box[5] - o.box[2]) * hz + Math.sin(a * TAU * 2 + hz * 9) * 0.35 + Math.sin(b * TAU * 2 + hx * 7) * 0.3;
    const p = v.proj(gx, gy, gz);
    const blink = clamp(0.5 + 0.9 * Math.sin(a * TAU * (2 + (i % 3)) + hx * 20), 0, 1);
    if (blink < 0.05) continue;
    const q = Math.max(3, Math.round(v.tw * 0.04 * (o.size ?? 1)));
    const r = q * 5;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, rgba(halo, 0.55 * blink));
    g.addColorStop(1, rgba(halo, 0));
    ctx.fillStyle = g;
    ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    ctx.globalAlpha = blink;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(p.x - q / 2), Math.round(p.y - q / 2), q, q);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/** Screen-space snowfall of plus-shaped flakes (parallax layers). */
export const snowfall = (ctx: Ctx, v: View, o: {n: number; seed: number; wind?: number; size?: number; speed?: number}) => {
  ctx.save();
  ctx.fillStyle = '#fcfdfe';
  for (let i = 0; i < o.n; i++) {
    const layer = h3(i, 1, o.seed, 31);
    const depth = 0.5 + layer * 1.1;
    const {a, g} = clock(v, Math.max(1, Math.round((o.speed ?? 1) * (1 + Math.floor(layer * 2)))), h3(i, 3, o.seed, 33));
    const hx = h3(i, gch(2, g), o.seed, 32);
    const x = frac(hx + (o.wind ?? 0.12) * a * depth * 0.5) * (v.W + 80) - 40 + Math.sin((a + hx) * TAU * 2) * 18;
    const y = a * (v.H + 80) - 40;
    const q = Math.max(2, Math.round((v.W / 1920) * 4 * depth * (o.size ?? 1)));
    ctx.globalAlpha = 0.55 + 0.4 * layer;
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.fillRect(px, py - q, q, q * 3);
    ctx.fillRect(px - q, py, q * 3, q);
  }
  ctx.restore();
};

/** Dust motes: pale squares drifting slowly inside a grid box (used in light shafts). */
export const motes = (ctx: Ctx, v: View, o: FieldBase & {color?: string; size?: number; alpha?: number}) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = o.color ?? '#f5d98a';
  for (let i = 0; i < o.n; i++) {
    const a = cyc(v, 1, h3(i, 4, o.seed, 44));
    const hx = h3(i, 1, o.seed, 41);
    const hy = h3(i, 2, o.seed, 42);
    const hz = h3(i, 3, o.seed, 43);
    // slow second wander so dust migrates through the light instead of orbiting in place
    const b = per(v, 480 + (i % 4) * 120, hz);
    const gx = o.box[0] + (o.box[3] - o.box[0]) * hx + Math.sin(a * TAU + hx * 9) * 0.9 + Math.sin(b * TAU + hy * 5) * 1.6;
    const gy = o.box[1] + (o.box[4] - o.box[1]) * hy + Math.cos(a * TAU + hy * 9) * 0.6 + Math.cos(b * TAU + hx * 6) * 1.2;
    const gz = o.box[2] + (o.box[5] - o.box[2]) * hz + Math.sin(a * TAU * 2 + hz * 9) * 0.5 + Math.sin(b * TAU * 2 + hy * 4) * 0.5;
    const p = v.proj(gx, gy, gz);
    const q = Math.max(2, Math.round((v.W / 1920) * 4 * (o.size ?? 1) * (0.6 + hx)));
    ctx.globalAlpha = (o.alpha ?? 0.7) * (0.35 + 0.65 * Math.abs(Math.sin(a * TAU * 2 + hx * 30)));
    ctx.fillRect(Math.round(p.x), Math.round(p.y), q, q);
  }
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// Souls: white ghost faces with cyan-blue trails travelling along arcs.

export const souls = (ctx: Ctx, v: View, o: {n: number; seed: number; from: [number, number, number]; to: [number, number, number]; spread?: number; cycles?: number; size?: number; arc?: number}) => {
  const A = v.proj(o.from[0], o.from[1], o.from[2]);
  const Bp = v.proj(o.to[0], o.to[1], o.to[2]);
  const q = Math.max(3, Math.round(v.tw * 0.04 * (o.size ?? 1)));
  ctx.save();
  for (let i = 0; i < o.n; i++) {
    const {a: base, g} = clock(v, o.cycles ?? 1, i / o.n);
    const sx = (h3(i, gch(1, g), o.seed, 51) - 0.5) * (o.spread ?? 160);
    const sy = (h3(i, gch(2, g), o.seed, 52) - 0.5) * (o.spread ?? 160) * 0.5;
    const arc = (o.arc ?? 140) * (0.7 + 0.6 * h3(i, gch(3, g), o.seed, 53));
    const at = (t: number) => {
      const e = t * t * (3 - 2 * t);
      const x = A.x + sx * (1 - e) + (Bp.x - A.x) * e;
      const y = A.y + sy * (1 - e) + (Bp.y - A.y) * e - Math.sin(t * Math.PI) * arc;
      return {x, y};
    };
    // trail: older samples first
    const TR = 30;
    for (let k = TR; k >= 1; k--) {
      const t = base - k * 0.0055;
      if (t < 0) continue;
      const p = at(t);
      const a = (1 - k / TR) * 0.85 * env(base, 0.06, 0.12);
      ctx.fillStyle = k > TR * 0.5 ? `rgba(60,179,200,${a})` : `rgba(100,178,208,${a})`;
      const w = Math.max(2, Math.round(q * 0.95 * (1 - k / (TR * 1.15))));
      ctx.fillRect(Math.round(snap(p.x, 2)), Math.round(snap(p.y, 2)), w, w);
    }
    const p = at(base);
    const hov = Math.round(Math.sin(base * TAU * 4 + i) * q * 0.5);
    const ev = env(base, 0.06, 0.12);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(p.x, p.y + hov, 0, p.x, p.y + hov, q * 7);
    gr.addColorStop(0, `rgba(100,200,220,${0.45 * ev})`);
    gr.addColorStop(1, 'rgba(60,179,200,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(p.x - q * 7, p.y + hov - q * 7, q * 14, q * 14);
    ctx.restore();
    drawSprite(ctx, SPR.ghost, p.x - q * 4, p.y - q * 5 + hov, q, {W: '#fcffff', D: '#67a9ab'}, ev);
  }
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// Lightning: stepped polyline bolt with a cyan fringe and a white core.

export const lightning = (ctx: Ctx, v: View, o: {strikes: {frame: number; at: [number, number, number]; seed: number}[]; flash?: number; color?: RGB}) => {
  const col = o.color ?? [138, 203, 202];
  for (const s of o.strikes) {
    const age = (v.frame - s.frame + v.loop * 4) % v.loop;
    if (age > 9) continue;
    const p = v.proj(s.at[0], s.at[1], s.at[2]);
    // flash
    const fl = (age < 2 ? 1 : age < 4 ? 0.35 : age < 6 ? 0.6 : 0.18 * (9 - age) / 3) * (o.flash ?? 0.34);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(120,190,230,${fl * 0.8})`;
    ctx.fillRect(0, 0, v.W, v.H);
    const R = v.tw * 4.2;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    g.addColorStop(0, `rgba(190,235,255,${0.85 * clamp(1 - age / 9)})`);
    g.addColorStop(0.3, `rgba(66,161,224,${0.4 * clamp(1 - age / 9)})`);
    g.addColorStop(1, 'rgba(9,80,171,0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - R, p.y - R, R * 2, R * 2);
    ctx.restore();
    if (age > 6) continue;
    // build a stepped path from above the frame down to the impact point
    const pts: [number, number][] = [[p.x, p.y]];
    let x = p.x;
    let y = p.y;
    let i = 0;
    while (y > -60 && i < 40) {
      const dy = 26 + h3(i, 1, s.seed, 61) * 22;
      const dx = (h3(i, 2, s.seed, 62) - 0.5) * 2 * 34;
      y -= dy;
      x += dx + (i % 3 === 0 ? 0 : (p.x - x) * 0.0);
      pts.push([snap(x, 2), snap(y, 2)]);
      i++;
    }
    const draw = (width: number, style: string, blur: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
      ctx.shadowColor = style;
      ctx.shadowBlur = blur;
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      pts.forEach(([a, b], k) => (k ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.stroke();
      ctx.restore();
    };
    const vis = age < 3 ? 1 : age < 5 ? 0.6 : 0.3;
    ctx.save();
    ctx.globalAlpha = vis;
    draw(24, rgba(col, 0.35), 18);
    draw(12, rgba([66, 161, 224], 0.7), 8);
    draw(6, '#fafdf5', 0);
    // a short branch
    const bi = 3 + (s.seed % 4);
    if (pts[bi] && pts[bi + 3]) {
      ctx.globalAlpha = vis * 0.8;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = '#d6f3ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pts[bi][0], pts[bi][1]);
      ctx.lineTo(pts[bi][0] + 40, pts[bi][1] + 34);
      ctx.lineTo(pts[bi][0] + 40 + 28, pts[bi][1] + 34 + 40);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
};

// ---------------------------------------------------------------------------------------------------------------------
// Beams: magenta (#CD2ECD, white core) and rarity beams (white / green / orange).

export type BeamKind = 'magenta' | 'white' | 'green' | 'orange';
const BEAM: Record<BeamKind, {outer: RGB; mid: RGB}> = {
  magenta: {outer: hexRgb('#CD2ECD'), mid: hexRgb('#E56DE5')},
  white: {outer: [200, 205, 215], mid: [235, 238, 245]},
  green: {outer: hexRgb('#3FA535'), mid: hexRgb('#8CE070')},
  orange: {outer: hexRgb('#F85600'), mid: hexRgb('#FFAA3A')},
};
const beamCache = new Map<string, HTMLCanvasElement>();
/** Vertical beam, ground point (screen px) upward. `grow` 0..1 animates the burst-out (4 frames in the game). */
export const beam = (ctx: Ctx, v: View, o: {x: number; y: number; kind?: BeamKind; width?: number; height?: number; alpha?: number; grow?: number; seed?: number; sparkles?: number}) => {
  const kind = o.kind ?? 'magenta';
  const c = BEAM[kind];
  const w = Math.round(o.width ?? v.tw * 0.9);
  const hgt = Math.min(o.y + 40, o.height ?? o.y + 40);
  const grow = o.grow ?? 1;
  const key = `${kind}|${w}|${Math.round(hgt)}`;
  let cv = beamCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = w * 3;
    cv.height = Math.ceil(hgt);
    const g = cv.getContext('2d')!;
    const cx = cv.width / 2;
    // soft outer glow
    const gr = g.createLinearGradient(0, 0, cv.width, 0);
    gr.addColorStop(0, rgba(c.outer, 0));
    gr.addColorStop(0.5, rgba(c.outer, 0.5));
    gr.addColorStop(1, rgba(c.outer, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, cv.width, cv.height);
    // mid shaft
    const g2 = g.createLinearGradient(cx - w * 0.5, 0, cx + w * 0.5, 0);
    g2.addColorStop(0, rgba(c.mid, 0));
    g2.addColorStop(0.25, rgba(c.mid, 0.85));
    g2.addColorStop(0.75, rgba(c.mid, 0.85));
    g2.addColorStop(1, rgba(c.mid, 0));
    g.fillStyle = g2;
    g.fillRect(cx - w * 0.5, 0, w, cv.height);
    // white core, hard-edged like the game
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.fillRect(cx - w * 0.17, 0, w * 0.34, cv.height);
    // vertical fade towards the top
    g.globalCompositeOperation = 'destination-in';
    const vf = g.createLinearGradient(0, 0, 0, cv.height);
    vf.addColorStop(0, 'rgba(0,0,0,0)');
    vf.addColorStop(0.55, 'rgba(0,0,0,0.75)');
    vf.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = vf;
    g.fillRect(0, 0, cv.width, cv.height);
    beamCache.set(key, cv);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const flick = 0.92 + 0.08 * pulse(v, 8, o.seed ?? 0);
  ctx.globalAlpha = (o.alpha ?? 1) * flick;
  const hh = cv.height * grow;
  ctx.drawImage(cv, 0, cv.height - hh, cv.width, hh, Math.round(o.x - cv.width / 2), Math.round(o.y - hh), cv.width, hh);
  // base flare
  const R = w * 1.7;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(1, 0.4);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.25, rgba(c.mid, 0.6));
  g.addColorStop(1, rgba(c.outer, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
  // rising pixel crosses
  const n = o.sparkles ?? 16;
  const q = Math.max(3, Math.round(v.W / 1920 * 5));
  for (let i = 0; i < n; i++) {
    const {a, g} = clock(v, 1 + (i % 2), h3(i, 1, o.seed ?? 0, 71));
    const sx = (h3(i, gch(2, g), o.seed ?? 0, 72) - 0.5) * w * 1.8 + Math.sin((a + i) * TAU) * 8;
    const sy = a * Math.min(hgt * 0.7, 420);
    ctx.globalAlpha = env(a, 0.05, 0.5) * (o.alpha ?? 1);
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : rgba(c.mid, 1);
    const x = Math.round(o.x + sx);
    const y = Math.round(o.y - sy);
    ctx.fillRect(x, y - q, q, q * 3);
    ctx.fillRect(x - q, y, q * 3, q);
  }
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// Hit sparks: thin elongated rectangles bursting from a point (4:1 aspect), few squares.

export const hitSparks = (ctx: Ctx, v: View, o: {x: number; y: number; start: number; seed: number; n?: number; scale?: number; colors?: string[]}) => {
  const age = (v.frame - o.start + v.loop * 4) % v.loop;
  const life = 14;
  if (age >= life) return;
  const colors = o.colors ?? ['#fff9ae', '#ffff79', '#ffb12e'];
  const n = o.n ?? 14;
  const sc = o.scale ?? 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const ang = h3(i, 1, o.seed, 81) * TAU;
    const sp = (6 + h3(i, 2, o.seed, 82) * 12) * sc;
    const t = age / life;
    const d = sp * age * (1 - 0.35 * t);
    const x = o.x + Math.cos(ang) * d;
    const y = o.y + Math.sin(ang) * d * 0.8 + 0.6 * age * age * 0.25;
    const len = (20 + h3(i, 3, o.seed, 83) * 24) * sc * (1 - t * 0.6);
    const wd = (4 + h3(i, 4, o.seed, 84) * 3) * sc;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-len / 2, -wd / 2, len, wd);
    ctx.restore();
  }
  // core flash cross
  ctx.globalAlpha = (1 - age / life) * 0.9;
  ctx.fillStyle = '#fffbe0';
  const cr = (20 - age) * sc;
  ctx.fillRect(o.x - cr, o.y - 3 * sc, cr * 2, 6 * sc);
  ctx.fillRect(o.x - 3 * sc, o.y - cr, 6 * sc, cr * 2);
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// Dust puffs: grey-white pixel clusters that grow and fade.

export const dustPuff = (ctx: Ctx, v: View, o: {x: number; y: number; start: number; seed: number; size?: number; color?: string}) => {
  const age = (v.frame - o.start + v.loop * 4) % v.loop;
  const life = 26;
  if (age >= life) return;
  const t = age / life;
  const s = o.size ?? 1;
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const ang = h3(i, 1, o.seed, 91) * Math.PI + Math.PI;
    const d = (10 + h3(i, 2, o.seed, 92) * 34) * t * s * 2;
    const x = o.x + Math.cos(ang) * d;
    const y = o.y + Math.sin(ang) * d * 0.5 - t * 18 * s;
    const q = Math.round((14 + h3(i, 3, o.seed, 93) * 16) * s * (0.5 + t));
    ctx.globalAlpha = (1 - t) * 0.7;
    ctx.fillStyle = '#2b2630';
    ctx.fillRect(Math.round(x - q / 2) + 2, Math.round(y - q / 2) + 2, q, q);
    ctx.fillStyle = o.color ?? '#b8b2b0';
    ctx.fillRect(Math.round(x - q / 2), Math.round(y - q / 2), q, q);
  }
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// Items

/** Spinning, bobbing pixel item (real texture) with a glow: emerald by default. */
export const spinItem = (ctx: Ctx, v: View, o: {img: HTMLImageElement | HTMLCanvasElement; x: number; y: number; size: number; spinCycles?: number; phase?: number; glow?: RGB; sparkle?: boolean}) => {
  const a = cyc(v, o.spinCycles ?? 1, o.phase ?? 0);
  const bob = Math.sin(a * TAU * 2) * o.size * 0.08;
  const sx = Math.cos(a * TAU);
  const w = o.size;
  ctx.save();
  if (o.glow) {
    ctx.globalCompositeOperation = 'lighter';
    const R = o.size * 1.2;
    const g = ctx.createRadialGradient(o.x, o.y + bob, 0, o.x, o.y + bob, R);
    g.addColorStop(0, rgba(o.glow, 0.45));
    g.addColorStop(1, rgba(o.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(o.x - R, o.y + bob - R, R * 2, R * 2);
    ctx.globalCompositeOperation = 'source-over';
  }
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(Math.round(o.x - w * 0.3), Math.round(o.y + w * 0.62), Math.round(w * 0.6), Math.max(3, Math.round(w * 0.08)));
  ctx.imageSmoothingEnabled = false;
  ctx.translate(o.x, o.y + bob);
  ctx.scale(Math.max(0.12, Math.abs(sx)), 1);
  ctx.drawImage(o.img, -w / 2, -w / 2, w, w);
  ctx.restore();
  if (o.sparkle) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const q = Math.max(3, Math.round(o.size * 0.07));
    for (let i = 0; i < 3; i++) {
      const t = cyc(v, 2, i / 3);
      const x = o.x + Math.cos(i * 2.1 + 1) * o.size * 0.55;
      const y = o.y + Math.sin(i * 2.1 + 1) * o.size * 0.5 - t * o.size * 0.2;
      ctx.globalAlpha = Math.sin(t * Math.PI);
      ctx.fillStyle = '#f2fff0';
      ctx.fillRect(Math.round(x), Math.round(y - q), q, q * 3);
      ctx.fillRect(Math.round(x - q), Math.round(y), q * 3, q);
    }
    ctx.restore();
  }
};

// ---------------------------------------------------------------------------------------------------------------------
// Portal helpers: particles that stream towards the portal, and a purple wash on nearby stone (drawn as a pool).

export const portalMotes = (ctx: Ctx, v: View, o: {at: [number, number, number]; n: number; seed: number; color?: string}) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < o.n; i++) {
    const {a, g} = clock(v, 1 + (i % 2), h3(i, 1, o.seed, 101));
    const ang = h3(i, gch(2, g), o.seed, 102) * TAU;
    const rad = (1 - a) * (1.6 + h3(i, gch(3, g), o.seed, 103) * 1.8);
    const p = v.proj(o.at[0] + Math.cos(ang) * rad * 0.6, o.at[1] + Math.sin(ang) * rad, o.at[2] + (h3(i, gch(4, g), o.seed, 104) - 0.4) * 2.4 * (1 - a * 0.3));
    const q = Math.max(3, Math.round(v.tw * 0.04));
    ctx.globalAlpha = env(a, 0.1, 0.25) * 0.9;
    ctx.fillStyle = i % 4 === 0 ? '#f6d4ff' : o.color ?? '#b44cf0';
    ctx.fillRect(Math.round(p.x), Math.round(p.y), q, q);
  }
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------------
// Pre-rendered screen layers (god rays, ground fog, cloud shadows). Caches live per key.

const layerCache = new Map<string, HTMLCanvasElement>();

export type RaysSpec = {
  /** Number of shafts. */
  n: number;
  /** Colour (hex-ish rgb). Game value: gold #e2ae4b. */
  color: RGB;
  alpha: number;
  /** Lean in degrees from vertical (positive leans right-down). */
  angle: number;
  /** Shaft width as a fraction of the frame width. */
  width: number;
  seed: number;
  /** Sway amplitude in px: the shafts slide left/right by +-1.5x this over ~1200 frames (closed, no wrap seam). */
  drift?: number;
  /** Vertical extent of the shafts as a fraction of the frame height. */
  length?: number;
};

export const godRays = (ctx: Ctx, v: View, o: RaysSpec) => {
  const M = Math.round(v.W * 0.06); // side margin so the swaying layer never shows a gap or a seam
  const key = `rays2|${o.n}|${o.color.join()}|${o.angle}|${o.width}|${o.seed}|${v.W}|${v.H}|${o.length ?? 1}`;
  let cv = layerCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = v.W + 2 * M;
    cv.height = v.H;
    const g = cv.getContext('2d')!;
    g.translate(M, 0);
    g.filter = `blur(${Math.round(v.W * 0.006)}px)`;
    const lean = Math.tan((o.angle * Math.PI) / 180);
    for (let i = 0; i < o.n; i++) {
      const cx = ((i + 0.2 + h3(i, 1, o.seed, 111) * 0.6) / o.n) * v.W * 1.25 - v.W * 0.1;
      const w = v.W * o.width * (0.55 + h3(i, 2, o.seed, 112) * 0.9);
      const len = v.H * (o.length ?? 1) * (0.7 + h3(i, 3, o.seed, 113) * 0.5);
      const topY = -v.H * 0.1;
      const al = 0.45 + h3(i, 4, o.seed, 114) * 0.55;
      const x0 = cx;
      const x1 = cx + lean * len;
      const gr = g.createLinearGradient(x0, topY, x1, topY + len);
      gr.addColorStop(0, rgba(o.color, 0.95 * al));
      gr.addColorStop(0.55, rgba(o.color, 0.4 * al));
      gr.addColorStop(1, rgba(o.color, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(x0 - w * 0.5, topY);
      g.lineTo(x0 + w * 0.5, topY);
      g.lineTo(x1 + w * 0.9, topY + len);
      g.lineTo(x1 - w * 0.9, topY + len);
      g.closePath();
      g.fill();
    }
    layerCache.set(key, cv);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const shift = (o.drift ?? 0) * 1.5 * Math.sin(per(v, 1200, h2(o.seed, 5)) * TAU);
  // the light breathes on two slow periods (~240 and ~400 frames), so shafts swell and thin out
  ctx.globalAlpha = o.alpha * (0.8 + 0.12 * Math.sin(per(v, 240, h2(o.seed, 6)) * TAU) + 0.08 * Math.sin(per(v, 400, h2(o.seed, 7)) * TAU));
  ctx.drawImage(cv, Math.round(shift) - M, 0);
  ctx.restore();
};

export type FogSpec = {color: RGB; alpha: number; /** Vertical centre of the band (0..1 of frame height). */ y: number; thick: number; speed: number; seed: number};

/** Tileable drifting fog band drawn across the frame. */
export const fogBand = (ctx: Ctx, v: View, o: FogSpec) => {
  const key = `fog|${o.color.join()}|${o.seed}|${v.W}`;
  let cv = layerCache.get(key);
  if (!cv) {
    const w = 640;
    const h = 180;
    cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d')!;
    const img = g.createImageData(w, h);
    const cell = 40;
    const gw = w / cell;
    const noise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const fx = x - xi;
      const fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const m = (a: number) => ((a % gw) + gw) % gw;
      const a = h2(m(xi), yi, o.seed);
      const b = h2(m(xi + 1), yi, o.seed);
      const c = h2(m(xi), yi + 1, o.seed);
      const d = h2(m(xi + 1), yi + 1, o.seed);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const n = noise(x / cell, y / cell) * 0.6 + noise((x / cell) * 2, (y / cell) * 2) * 0.4;
        const vy = 1 - Math.abs(y / h - 0.5) * 2;
        const a = clamp((n - 0.28) * 2.2) * Math.pow(Math.max(0, vy), 1.3);
        const i = (y * w + x) * 4;
        img.data[i] = o.color[0];
        img.data[i + 1] = o.color[1];
        img.data[i + 2] = o.color[2];
        img.data[i + 3] = a * 255;
      }
    g.putImageData(img, 0, 0);
    layerCache.set(key, cv);
  }
  ctx.save();
  // the bank thickens and thins on a ~800 frame breath; the scroll is a whole number of tiles per loop (~1200 frames per tile)
  ctx.globalAlpha = o.alpha * (0.84 + 0.16 * Math.sin(per(v, 800, h2(o.seed, 9)) * TAU));
  const hh = v.H * o.thick;
  const ww = hh * (640 / 180) * 1.6;
  const tiles = Math.max(1, Math.round((o.speed * v.loop) / 1200));
  const off = frac(v.frame / v.loop) * ww * tiles;
  const y = v.H * o.y - hh / 2;
  const startX = -((off % ww) + ww) % ww;
  ctx.imageSmoothingEnabled = true;
  for (let x = startX - ww; x < v.W + ww; x += ww) ctx.drawImage(cv, Math.round(x), Math.round(y), Math.ceil(ww) + 1, Math.round(hh));
  ctx.restore();
};

/** Drifting cloud shadows over the ground (chunky, soft-edged, multiply). */
export const cloudShadows = (ctx: Ctx, v: View, o: {strength: number; seed: number; scale?: number; tint?: RGB}) => {
  const key = `cloud|${o.seed}|${o.scale ?? 1}`;
  let cv = layerCache.get(key);
  if (!cv) {
    const gw = 32;
    const gh = 20;
    cv = document.createElement('canvas');
    cv.width = gw;
    cv.height = gh;
    const g = cv.getContext('2d')!;
    const img = g.createImageData(gw, gh);
    const cellsX = Math.max(3, Math.round(5 * (o.scale ?? 1)));
    const sc = cellsX / gw;
    const noise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const fx = x - xi;
      const fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const m = (a: number) => ((a % cellsX) + cellsX) % cellsX;
      const a = h2(m(xi), yi, o.seed);
      const b = h2(m(xi + 1), yi, o.seed);
      const c = h2(m(xi), yi + 1, o.seed);
      const d = h2(m(xi + 1), yi + 1, o.seed);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) {
        const n = noise(x * sc, y * sc);
        const a = clamp((n - 0.55) * 3.2);
        const i = (y * gw + x) * 4;
        img.data[i] = 20;
        img.data[i + 1] = 28;
        img.data[i + 2] = 40;
        img.data[i + 3] = a * 255;
      }
    g.putImageData(img, 0, 0);
    // tileable hi-res tile: 3 repeats side by side, middle third scaled up with smoothing
    const trip = document.createElement('canvas');
    trip.width = gw * 3;
    trip.height = gh;
    const tg = trip.getContext('2d')!;
    for (let k = 0; k < 3; k++) tg.drawImage(cv, k * gw, 0);
    const Wt = Math.round(v.W * 1.5);
    const Ht = Math.round(v.H * 1.1);
    const tile = document.createElement('canvas');
    tile.width = Wt;
    tile.height = Ht;
    const tl = tile.getContext('2d')!;
    tl.imageSmoothingEnabled = true;
    tl.imageSmoothingQuality = 'high';
    tl.drawImage(trip, gw, 0, gw, gh, 0, 0, Wt, Ht);
    cv = tile;
    layerCache.set(key, cv);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = o.strength * (0.78 + 0.22 * Math.sin(per(v, 600, h2(o.seed, 8)) * TAU));
  const ww = cv.width;
  const tiles = Math.max(1, Math.round(v.loop / 1200));
  const off = Math.round(frac(v.frame / v.loop) * tiles * ww);
  for (let x = -off - ww; x < v.W + ww; x += ww) ctx.drawImage(cv, x, Math.round(-cv.height * 0.05));
  ctx.restore();
};
