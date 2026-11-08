import {useMemo, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {item as itemTex, tex} from '../../../mc/assets';
import {TITLE_FONT, PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {PlayerFace, U} from '../../../mg/Ore';
import {Shockwave} from '../../../mc/Fx';
import {CreeperHead, Crop, PigHead} from '../../mob';
import {OreBg, Sky} from '../../../reel/kit';
import {FLAT, RAINBOW, SPRITES, Sticker, type Sprite} from '../../flat';

/**
 * Shared toolkit for the social area: baked pixel sprites (with ink outline), a deterministic particle system,
 * sunburst / bunting, a pixel tap flash, real-texture mob heads, an odometer, and the demo "footage" backdrop.
 * Everything is derived from useCurrentFrame(); randomness comes from mulberry32.
 */

export const W = 1920;
export const H = 1080;
export const INK = FLAT.ink;

// ------------------------------------------------------------------ small math

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rangeP = (f: number, at: number, dur: number, e: (t: number) => number = EASE.out) => e(clamp01((f - at) / dur));
/** Damped spring 0 -> 1 with a visible overshoot. `f` frames since start, `dur` is the settle time. */
export const spring = (f: number, at: number, dur = 20) => {
  const t = (f - at) / dur;
  if (t <= 0) return 0;
  if (t >= 1.6) return 1;
  return 1 - Math.exp(-5.5 * t) * Math.cos(t * 9);
};
/** Jelly wobble factor (-1..1) after `at`, decays. */
export const wobble = (f: number, at: number, dur = 18, k = 3) => {
  const t = (f - at) / dur;
  if (t < 0 || t > 1.5) return 0;
  return Math.sin(t * Math.PI * k * 2) * Math.exp(-t * 4.5);
};
/** Piecewise-linear track through [frame, value] points, eased between them. */
export const track = (f: number, pts: [number, number][], e: (t: number) => number = (t) => t) => {
  if (f <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [fa, va] = pts[i];
    const [fb, vb] = pts[i + 1];
    if (f < fb) return lerp(va, vb, e((f - fa) / (fb - fa)));
  }
  return pts[pts.length - 1][1];
};
export const bob = (f: number, period: number, amp: number, phase = 0) => Math.sin(((f + phase) / period) * Math.PI * 2) * amp;

// ------------------------------------------------------------------ sprites

const grid = (rows: string[]) => rows;

/** Chunky thumbs up (15 x 15). */
export const THUMB: Sprite = {
  rows: grid([
    '....YYY........',
    '...YWWYY.......',
    '...YWYYY.......',
    '...YYYYY.......',
    '...YYYYY.......',
    'BBKYYYYYYYYYY..',
    'BbKYWYYYYYYYYY.',
    'BbKYYYYYYYYYYy.',
    'BbKYyyyyyyyyyy.',
    'BbKYWYYYYYYYYY.',
    'BbKYYYYYYYYYYy.',
    'BbKYyyyyyyyyy..',
    'BbKYWYYYYYYYY..',
    'BbKYYYYYYYYYy..',
    'BBKyyyyyyyyy...',
  ]),
  palette: {Y: '#ffe27a', W: '#fffbe0', y: '#f0b92e', B: '#7fd0ff', b: '#4aa5e8', K: INK},
};

/** Big chunky heart (13 x 12). */
export const HEART_BIG: Sprite = {
  rows: grid([
    '..RRR...RRR..',
    '.RRRRR.RRRRR.',
    'RRWWRRRRRRRRr',
    'RRWRRRRRRRRRr',
    'RRRRRRRRRRRRr',
    'RRRRRRRRRRRRr',
    '.RRRRRRRRRRr.',
    '..RRRRRRRRr..',
    '...RRRRRRr...',
    '....RRRRr....',
    '.....RRr.....',
    '......r......',
  ]),
  palette: {R: FLAT.red, r: FLAT.redDeep, W: '#ffd0d6'},
};
export const HEART_PINK: Sprite = {rows: HEART_BIG.rows, palette: {R: FLAT.pink, r: FLAT.pinkDeep, W: '#ffe4ee'}};

/** Chunky five point star (13 x 12). */
export const STAR_BIG: Sprite = {
  rows: grid([
    '......Y......',
    '.....YWY.....',
    '.....YWYY....',
    'YYYYYYWYYYYYY',
    '.YYYWWYYYYYY.',
    '..YYWYYYYYy..',
    '...YYYYYYy...',
    '...YYYYYYy...',
    '..YYYYyYYYy..',
    '..YYYy.yYYy..',
    '.YYYy...yYYy.',
    '.YYy.....yYy.',
  ]),
  palette: {Y: FLAT.yellow, W: '#fff8c4', y: FLAT.yellowDeep},
};

const recolor = (s: Sprite, map: Record<string, string>): Sprite => ({rows: s.rows, palette: {...s.palette, ...map}});

/** Four point twinkle (7 x 7, single colour). */
export const twinkle = (color: string): Sprite => ({rows: SPRITES.sparkle.rows, palette: {W: color}});

/** Check mark (9 x 7). */
export const CHECK: Sprite = {
  rows: ['........W', '.......WW', '......WW.', 'W....WW..', 'WW..WW...', '.WWWW....', '..WW.....'],
  palette: {W: '#ffffff'},
};
/** Plus sign (7 x 7). */
export const PLUS: Sprite = {rows: ['..WWW..', '..WWW..', 'WWWWWWW', 'WWWWWWW', 'WWWWWWW', '..WWW..', '..WWW..'], palette: {W: '#ffffff'}};

/** Pointing hand cursor (12 x 14). */
export const HAND: Sprite = {
  rows: grid([
    '...WW.......',
    '..WWWW......',
    '..WWWW......',
    '..WWWW......',
    '..WWWWWWW...',
    '..WWWWWWWWW.',
    '.WWWWWWWWWWs',
    '.WWWWWWWWWWs',
    '.WWWWWWWWWWs',
    '..WWWWWWWWs.',
    '..WWWWWWWWs.',
    '...WWWWWWs..',
    '...WWWWWWs..',
    '...sssssss..',
  ]),
  palette: {W: '#ffffff', s: '#cfd8f0'},
};

/** Eighth note (8 x 9). */
export const NOTE: Sprite = {
  rows: ['....WWW.', '....WWWW', '....W..W', '....W...', '....W...', '.WW.W...', 'WWWWW...', 'WWWW....', '.WW.....'],
  palette: {W: '#ffffff'},
};

/** Round disc sprite of diameter n (odd or even), rim / face / highlight bands. */
export const disc = (n: number, face: string, rim: string, hi: string, emblem?: string[]): Sprite => {
  const rows: string[] = [];
  const c = (n - 1) / 2;
  for (let y = 0; y < n; y++) {
    let r = '';
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > n / 2) r += '.';
      else if (d > n / 2 - 1.1) r += 'r';
      else if (d > n / 2 - 2.2 && x + y < n - 1) r += 'h';
      else r += 'f';
    }
    rows.push(r);
  }
  if (emblem) {
    const ox = Math.round((n - emblem[0].length) / 2);
    const oy = Math.round((n - emblem.length) / 2);
    emblem.forEach((er, j) => {
      const line = [...rows[oy + j]];
      [...er].forEach((ch, i) => {
        if (ch !== '.') line[ox + i] = 'e';
      });
      rows[oy + j] = line.join('');
    });
  }
  return {rows, palette: {f: face, r: rim, h: hi, e: rim}};
};

export const COIN: Sprite = disc(15, FLAT.yellow, FLAT.yellowDeep, '#fff2a8', ['...e...', '..eee..', '.eeeee.', 'eeeeeee', '.eeeee.', '..eee..', '...e...']);
export const ORB: Sprite = disc(9, '#9cf24a', '#3fae55', '#eaffb0');
export const BADGE: Sprite = disc(11, FLAT.sky, FLAT.skyDeep, '#d9f1ff', ['......e', '.....ee', 'e...ee.', 'ee.ee..', '.eee...', '..e....']);

/** All sprites used by particles, keyed by name. */
const PARTICLE_SPRITES: Record<string, Sprite> = {
  heart: HEART_BIG,
  heartP: HEART_PINK,
  star: STAR_BIG,
  coin: COIN,
  orb: ORB,
  note: recolor(NOTE, {W: FLAT.cream}),
  noteP: recolor(NOTE, {W: FLAT.pink}),
  noteS: recolor(NOTE, {W: FLAT.sky}),
  check: CHECK,
  bubble: SPRITES.bubble,
  plus: PLUS,
};

type Baked = {src: string; w: number; h: number; pad: number};
const bakedCache = new Map<string, Baked>();

/**
 * Bakes a sprite to a crisp SVG data URI at 1 cell = 1 unit. Adds a 1 cell ink outline (4-neighbour)
 * and an optional hard drop of `drop` cells straight down.
 */
export const bake = (key: string, s: Sprite, outline: string | null = INK, drop = 0): Baked => {
  const ck = `${key}|${outline}|${drop}`;
  const hit = bakedCache.get(ck);
  if (hit) return hit;
  const w0 = s.rows[0].length;
  const h0 = s.rows.length;
  const pad = outline ? 1 : 0;
  const w = w0 + pad * 2;
  const h = h0 + pad * 2 + drop;
  const cells: (string | null)[][] = Array.from({length: h}, () => Array<string | null>(w).fill(null));
  s.rows.forEach((row, y) => [...row].forEach((c, x) => (c !== '.' ? (cells[y + pad][x + pad] = s.palette[c] ?? '#f0f') : null)));
  if (outline) {
    const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && cells[y][x] !== null;
    const add: [number, number][] = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) if (!cells[y][x] && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) add.push([x, y]);
    add.forEach(([x, y]) => (cells[y][x] = outline));
    for (let d = 1; d <= drop; d++)
      for (let y = h - 2; y >= 0; y--) for (let x = 0; x < w; x++) if (cells[y][x] && !cells[y + 1][x]) cells[y + 1][x] = outline;
  }
  let rects = '';
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = cells[y][x];
      if (!c) {
        x++;
        continue;
      }
      let e = x + 1;
      while (e < w && cells[y][e] === c) e++;
      rects += `<rect x="${x}" y="${y}" width="${e - x}" height="1.02" fill="${c}"/>`;
      x = e;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  const out = {src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, w, h, pad};
  bakedCache.set(ck, out);
  return out;
};

/** A baked pixel sprite as an image. `px` is the screen size of one cell. */
export const Sp: FC<{s: Sprite; k?: string; px: number; outline?: string | null; drop?: number; style?: CSSProperties}> = ({s, k, px, outline = INK, drop = 0, style}) => {
  const b = bake(k ?? JSON.stringify(s.palette) + s.rows.join(''), s, outline, drop);
  return <Img src={b.src} style={{width: b.w * px, height: b.h * px, imageRendering: 'pixelated', display: 'block', ...style}} />;
};

/** A vanilla item texture, with an optional ink outline. */
export const ItemSp: FC<{id: string; size: number; outline?: boolean; style?: CSSProperties}> = ({id, size, outline = true, style}) => {
  const o = Math.max(2, Math.round(size / 26));
  return (
    <Img
      src={itemTex(id)}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        display: 'block',
        filter: outline ? `drop-shadow(${o}px 0 0 ${INK}) drop-shadow(${-o}px 0 0 ${INK}) drop-shadow(0 ${o}px 0 ${INK}) drop-shadow(0 ${-o}px 0 ${INK})` : undefined,
        ...style,
      }}
    />
  );
};

// ------------------------------------------------------------------ placement

/** Centre-anchored absolute box with a transform. */
export const At: FC<{
  x: number;
  y: number;
  rot?: number;
  s?: number;
  sx?: number;
  sy?: number;
  o?: number;
  origin?: string;
  z?: number;
  style?: CSSProperties;
  children?: ReactNode;
}> = ({x, y, rot = 0, s = 1, sx = 1, sy = 1, o = 1, origin = '50% 50%', z, style, children}) => {
  if (o <= 0 || s <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o, zIndex: z, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sx * s}, ${sy * s})`, transformOrigin: origin, ...style}}>
      {children}
    </div>
  );
};

/** Chunky flat block: ink border, lighter top band, darker bottom band, hard drop shadow. */
export const chunky = (fill: string, deep: string, light: string, o: {r?: number | string; b?: number; sh?: number; band?: number} = {}): CSSProperties => {
  const {r = 28, b = 8, sh = 12, band = 12} = o;
  return {
    background: fill,
    border: `${b}px solid ${INK}`,
    borderRadius: r,
    boxShadow: `inset 0 ${band}px 0 ${light}, inset 0 ${-band}px 0 ${deep}, 0 ${sh}px 0 ${INK}`,
    boxSizing: 'border-box',
  };
};

// ------------------------------------------------------------------ particles

export type P = {
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  at: number;
  life: number;
  rot: number;
  vr: number;
  size: number;
  color?: string;
  phase: number;
};

export type BurstOpts = {
  seed: number;
  at: number;
  x: number;
  y: number;
  n: number;
  kinds: string[];
  /** px per frame at launch */
  speed?: [number, number];
  /** degrees, 0 = right, -90 = up */
  angle?: [number, number];
  life?: [number, number];
  g?: number;
  drag?: number;
  size?: [number, number];
  spin?: number;
  colors?: string[];
  /** spawn spread (frames) */
  stagger?: number;
  /** scatter the spawn point (px) */
  spread?: number;
};

export const makeBurst = (o: BurstOpts): P[] => {
  const r = mulberry32(o.seed);
  const [s0, s1] = o.speed ?? [10, 26];
  const [a0, a1] = o.angle ?? [0, 360];
  const [l0, l1] = o.life ?? [40, 70];
  const [z0, z1] = o.size ?? [30, 60];
  return Array.from({length: o.n}, () => {
    const a = (lerp(a0, a1, r()) * Math.PI) / 180;
    const v = lerp(s0, s1, Math.pow(r(), 0.7));
    const sp = o.spread ?? 0;
    return {
      kind: o.kinds[Math.floor(r() * o.kinds.length)],
      x: o.x + (r() - 0.5) * sp,
      y: o.y + (r() - 0.5) * sp,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      g: o.g ?? 0.5,
      drag: o.drag ?? 0.92,
      at: o.at + Math.floor(r() * (o.stagger ?? 0)),
      life: lerp(l0, l1, r()),
      rot: (r() - 0.5) * 60,
      vr: (r() - 0.5) * (o.spin ?? 14),
      size: lerp(z0, z1, r()),
      color: o.colors ? o.colors[Math.floor(r() * o.colors.length)] : undefined,
      phase: r() * 6.28,
    };
  });
};

const dropShadow = `drop-shadow(0 3px 0 ${INK})`;

const renderP = (p: P, f: number, i: number): ReactNode => {
  const t = f - p.at;
  if (t < 0 || t > p.life) return null;
  const k = p.drag >= 0.999 ? t : (1 - Math.pow(p.drag, t)) / (1 - p.drag);
  const x = p.x + p.vx * k;
  const y = p.y + p.vy * k + 0.5 * p.g * t * t;
  const appear = EASE.back(clamp01(t / 5));
  const fadeStart = p.life * 0.72;
  const fade = t > fadeStart ? 1 - (t - fadeStart) / (p.life - fadeStart) : 1;
  const sc = appear * (0.5 + 0.5 * fade);
  const o = Math.min(1, fade * 1.6);
  if (sc <= 0.01) return null;
  const [type, arg] = p.kind.split(':');
  const rot = p.rot + p.vr * t;
  const base: CSSProperties = {position: 'absolute', left: x, top: y, opacity: o, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`};
  if (type === 'sq') {
    const s = Math.max(6, p.size * 0.45);
    return <div key={i} style={{...base, width: s, height: s, background: arg ?? p.color ?? '#fff', border: `${Math.max(2, s / 6)}px solid ${INK}`, boxSizing: 'border-box'}} />;
  }
  if (type === 'conf') {
    const flip = Math.cos(t * 0.38 + p.phase);
    const w = p.size * 0.5;
    const h = p.size * 0.28;
    return (
      <div key={i} style={{...base, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc}, ${sc * (0.2 + Math.abs(flip) * 0.8)})`, width: w, height: h, background: p.color ?? arg ?? '#fff', boxShadow: `0 ${Math.max(2, h * 0.25)}px 0 ${INK}`, borderRadius: 2}} />
    );
  }
  if (type === 'item') {
    return (
      <div key={i} style={base}>
        <ItemSp id={arg} size={p.size} />
      </div>
    );
  }
  if (type === 'spark') {
    const c = arg ?? p.color ?? '#ffffff';
    return (
      <div key={i} style={base}>
        <Sp s={twinkle(c)} k={`tw${c}`} px={p.size / 7} outline={null} />
      </div>
    );
  }
  const sprite = PARTICLE_SPRITES[type];
  if (!sprite) return null;
  const b = bake(type, sprite, INK);
  return (
    <div key={i} style={{...base, filter: dropShadow}}>
      <Sp s={sprite} k={type} px={p.size / b.w} />
    </div>
  );
};

export const Particles: FC<{list: P[]}> = ({list}) => {
  const f = useCurrentFrame();
  return <>{list.map((p, i) => renderP(p, f, i))}</>;
};

/** Confetti pieces falling from above the frame between `at` and `at + dur`. */
export const confettiRain = (seed: number, at: number, dur: number, n: number, opts: {colors?: string[]; kinds?: string[]; size?: [number, number]; x?: [number, number]; vy?: [number, number]} = {}): P[] => {
  const r = mulberry32(seed);
  const colors = opts.colors ?? [FLAT.red, FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink, FLAT.purple, FLAT.orange];
  const kinds = opts.kinds ?? ['conf'];
  const [x0, x1] = opts.x ?? [0, W];
  const [z0, z1] = opts.size ?? [34, 64];
  const [v0, v1] = opts.vy ?? [5, 11];
  return Array.from({length: n}, () => ({
    kind: kinds[Math.floor(r() * kinds.length)],
    x: lerp(x0, x1, r()),
    y: -60 - r() * 120,
    vx: (r() - 0.5) * 3,
    vy: lerp(v0, v1, r()),
    g: 0.02,
    drag: 0.999,
    at: at + Math.floor(r() * dur),
    life: 150,
    rot: r() * 360,
    vr: (r() - 0.5) * 12,
    size: lerp(z0, z1, r()),
    color: colors[Math.floor(r() * colors.length)],
    phase: r() * 6.28,
  }));
};

// ------------------------------------------------------------------ rings, rays, ornaments

/** Flat sunburst wedges behind a hero, slowly turning. */
export const Sunburst: FC<{x: number; y: number; size?: number; color?: string; alpha?: number; rays?: number; spin?: number; scale?: number}> = ({x, y, size = 2600, color = '255,244,214', alpha = 0.22, rays = 16, spin = 0.25, scale = 1}) => {
  const f = useCurrentFrame();
  const step = 360 / rays;
  const stops: string[] = [];
  for (let i = 0; i < rays; i++) stops.push(`rgba(${color},${alpha}) ${i * step}deg ${i * step + step / 2}deg`, `rgba(${color},0) ${i * step + step / 2}deg ${(i + 1) * step}deg`);
  const mask = 'radial-gradient(circle, transparent 0%, black 14%, black 55%, transparent 72%)';
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${scale})`, background: `conic-gradient(from ${f * spin}deg, ${stops.join(',')})`, WebkitMaskImage: mask, maskImage: mask}} />
  );
};

/** Ornament with pop-in and idle bob: a sprite, item or any node placed by its centre. */
export const Orn: FC<{x: number; y: number; at: number; rot?: number; bobAmp?: number; period?: number; end?: number; children: ReactNode; sway?: number}> = ({x, y, at, rot = 0, bobAmp = 10, period = 50, end, children, sway = 6}) => {
  const f = useCurrentFrame();
  const s = spring(f, at, 18);
  const out = end !== undefined ? 1 - rangeP(f, end, 10, EASE.in) : 1;
  return (
    <At x={x} y={y + bob(f, period, bobAmp, x)} rot={rot + bob(f, period * 1.3, sway, y)} s={s * out} o={out}>
      {children}
    </At>
  );
};

/** Row of bunting flags along a sagging line. `drop` slides it in from above. */
export const Bunting: FC<{x0: number; y0: number; x1: number; y1: number; sag?: number; n?: number; at: number; colors?: string[]; size?: number}> = ({x0, y0, x1, y1, sag = 60, n = 8, at, colors = [FLAT.red, FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink, FLAT.purple], size = 70}) => {
  const f = useCurrentFrame();
  const slide = 1 - spring(f, at, 22);
  const sway = bob(f, 60, 2.5);
  const pt = (t: number) => ({x: lerp(x0, x1, t), y: lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag});
  const flags = Array.from({length: n}, (_, i) => {
    const t = (i + 0.5) / n;
    const a = pt(t);
    const b = pt(t + 0.01);
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return {a, ang, c: colors[i % colors.length]};
  });
  const path = Array.from({length: 25}, (_, i) => pt(i / 24)).map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${-slide * 260}px)`}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={path} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      </svg>
      {flags.map((fl, i) => (
        <div key={i} style={{position: 'absolute', left: fl.a.x, top: fl.a.y, transform: `rotate(${fl.ang + sway * (i % 2 ? 1 : -1)}deg)`, transformOrigin: '50% 0'}}>
          <svg width={size} height={size * 1.1} viewBox="0 0 70 77" style={{position: 'absolute', left: -size / 2, top: 0, overflow: 'visible'}}>
            <path d="M3 3 L67 3 L35 72 Z" fill={fl.c} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M12 10 L58 10 L48 28 L22 28 Z" fill="#fff" opacity={0.28} />
          </svg>
        </div>
      ))}
    </div>
  );
};

/** Short status sticker (functional text such as "+1" or a state label): pops, wobbles, then shrinks away. Never use it for sound words. */
export const Say: FC<{at: number; x: number; y: number; text: string; size?: number; color?: string; rot?: number; life?: number}> = ({at, x, y, text, size = 96, color = FLAT.yellow, rot = -8, life = 42}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  const s = spring(f, 0, 14) * (1 - rangeP(f, life - 8, 8, EASE.in));
  const wob = Math.sin(f * 0.5) * 2.5 * Math.exp(-f / 14);
  return (
    <At x={x} y={y - f * 0.6} rot={rot + wob} s={s}>
      <Sticker size={size} color={color}>
        {text}
      </Sticker>
    </At>
  );
};

/** Pixel hand cursor. `press` 0..1 squashes the hand a little. */
export const Hand: FC<{x: number; y: number; press?: number; px?: number; o?: number}> = ({x, y, press = 0, px = 9, o = 1}) => (
  <At x={x} y={y} o={o} s={1 - press * 0.12} origin="25% 5%" rot={-8 + press * 6} z={50}>
    <Sp s={HAND} k="hand" px={px} drop={1} />
  </At>
);

/** Small pixel tap flash: a little cross of light with a few shards (no ring). */
export const Click: FC<{x: number; y: number; at: number; color?: string}> = ({x, y, at, color = '#fff'}) => <Shockwave x={x} y={y} at={at} color={color} maxR={110} life={12} width={12} rays={8} seed={at} />;

/** A big four point pixel glint that pops and fades (the "shine" when something lands / lights up). */
export const Glint: FC<{x: number; y: number; at: number; size?: number; color?: string; life?: number; rot?: number}> = ({x, y, at, size = 150, color = '#ffffff', life = 12, rot = 0}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  const pop = EASE.back(clamp01(f / 4)) * (1 - EASE.in(clamp01((f - 4) / (life - 4))));
  return (
    <At x={x} y={y} s={pop} rot={rot} z={30}>
      <Sp s={twinkle(color)} k={`gl${color}`} px={size / 7} outline={null} />
    </At>
  );
};

// ------------------------------------------------------------------ odometer

/** Rolling number. `value` can be fractional; the ones digit rolls continuously, higher digits turn as the lower digits wrap. */
export const Odometer: FC<{value: number; digits: number; size: number; color?: string; stroke?: string; font?: string; gap?: number; centerVisible?: boolean}> = ({value, digits, size, color = '#fff', stroke = INK, font = PIXEL_FONT, gap = 0, centerVisible = false}) => {
  const cols = Array.from({length: digits}, (_, k) => {
    const place = digits - 1 - k;
    const pow = Math.pow(10, place);
    const base = Math.floor(value / pow) % 10;
    // a digit only starts to turn during the last single unit before it wraps (e.g. the hundreds turn between 1299 and 1300)
    const roll = place === 0 ? value - Math.floor(value) : clamp01((value % pow) - (pow - 1));
    return {v: base + EASE.inOut(roll), place};
  });
  const lead = Math.max(0, String(Math.floor(Math.abs(value))).length);
  const ow = Math.max(3, size / 14);
  const pitch = size * 1.1 + ow * 3; // cell height: glyph box + room for the outline above and the drop below, so neighbours never leak in
  const cellW = size * 0.62 + ow * 2;
  const hiddenCount = cols.filter((c) => c.place >= lead && c.place > 0).length;
  // centerVisible: leading digits that do not exist yet are blank cells; shift so the visible digits stay centred
  const shiftX = centerVisible ? -((hiddenCount * (cellW + gap)) / 2) : 0;
  const shadows: string[] = [];
  for (let a = 0; a < 12; a++) shadows.push(`${(Math.cos((a / 12) * Math.PI * 2) * ow).toFixed(1)}px ${(Math.sin((a / 12) * Math.PI * 2) * ow).toFixed(1)}px 0 ${stroke}`);
  shadows.push(`0 ${ow * 2}px 0 ${stroke}`);
  return (
    <div style={{display: 'flex', gap, height: pitch, transform: shiftX ? `translateX(${shiftX}px)` : undefined}}>
      {cols.map((c, i) => {
        const hidden = c.place >= lead && c.place > 0;
        return (
          <div key={i} style={{width: size * 0.62 + ow * 2, height: pitch, overflow: 'hidden', position: 'relative', opacity: hidden ? 0 : 1}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-(c.v % 10) * pitch}px)`}}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1].map((d, j) => (
                <div key={j} style={{height: pitch, boxSizing: 'border-box', paddingTop: ow, lineHeight: `${size * 1.1}px`, textAlign: 'center', fontFamily: font, fontSize: size, color, textShadow: shadows.join(','), WebkitFontSmoothing: 'none'}}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ backdrop

export type Time = 'dawn' | 'noon' | 'dusk' | 'night';

/** Stand-in for the video frame under an overlay: blurred sky, big blocky faces, player chrome, a subtitle. */
const FakeFootage: FC<{variant: 'sky' | 'ore'; time: Time; tone: 'dark' | 'purple' | 'green'}> = ({variant, time, tone}) => {
  const f = useCurrentFrame();
  const inner =
    variant === 'sky' ? (
      <Sky time={time} vignette={0.25} />
    ) : (
      <OreBg tone={tone}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 70% 30%, rgba(143,107,255,0.18), transparent 60%)'}} />
      </OreBg>
    );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(7px) saturate(0.9)', transform: 'scale(1.04)'}}>{inner}</AbsoluteFill>
      {/* blurry "gameplay": two big heads drifting a little */}
      <div style={{position: 'absolute', left: 90, bottom: 120 + bob(f, 80, 6), opacity: 0.55, filter: 'blur(5px)'}}>
        <PlayerFace size={360} />
      </div>
      <div style={{position: 'absolute', right: 120, bottom: 150 + bob(f, 90, 7, 20), opacity: 0.5, filter: 'blur(5px)'}}>
        <PlayerFace size={300} skin="entity/player/wide/alex.png" />
      </div>
      <AbsoluteFill style={{background: 'rgba(10,8,24,0.16)'}} />
      {/* player chrome */}
      <div style={{position: 'absolute', left: 48, top: 40, padding: '8px 22px', borderRadius: 10, background: 'rgba(0,0,0,0.38)', color: 'rgba(255,255,255,0.75)', fontFamily: TITLE_FONT, fontSize: 34}}>
        【我的世界】生存第 100 天 · 终于建好了红石农场
      </div>
      <div style={{position: 'absolute', left: 48, right: 48, bottom: 36, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.28)'}}>
        <div style={{width: `${22 + (f / 6) % 40}%`, height: '100%', borderRadius: 4, background: 'rgba(255,255,255,0.65)'}} />
      </div>
      <div style={{position: 'absolute', left: 48, bottom: 56, color: 'rgba(255,255,255,0.65)', fontFamily: TITLE_FONT, fontSize: 28}}>03:24 / 12:08</div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 96, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontFamily: TITLE_FONT, fontSize: 44, textShadow: '0 4px 0 rgba(0,0,0,0.35)'}}>
        这里就是我们今天要搭的东西
      </div>
    </AbsoluteFill>
  );
};

/** Demo wrapper: with `bg` it draws a blurred fake video frame first; without it everything is transparent. */
export const Stage: FC<{bg?: boolean; variant?: 'sky' | 'ore'; time?: Time; tone?: 'dark' | 'purple' | 'green'; children?: ReactNode}> = ({bg, variant = 'sky', time = 'noon', tone = 'purple', children}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    {bg && <FakeFootage variant={variant} time={time} tone={tone} />}
    {children}
  </AbsoluteFill>
);

/** Slime head from the real texture: inner cube, translucent outer shell, then eyes and mouth. */
export const SlimeHead: FC<{scale?: number; style?: CSSProperties}> = ({scale = 16, style}) => {
  const src = tex('entity/slime/slime.png');
  const part = (rect: [number, number, number, number], x: number, y: number) => <Crop src={src} sheet={[64, 32]} rect={rect} scale={scale} style={{position: 'absolute', left: x * scale, top: y * scale}} />;
  return (
    <div style={{position: 'relative', width: 8 * scale, height: 8 * scale, flex: 'none', ...style}}>
      {part([6, 22, 6, 6], 1, 1)}
      {part([8, 8, 8, 8], 0, 0)}
      {/* eyes and mouth go on top of the translucent shell so they stay readable at small sizes */}
      {part([34, 2, 2, 2], 1, 2)}
      {part([34, 6, 2, 2], 5, 2)}
      {part([33, 9, 1, 1], 4, 5)}
    </div>
  );
};

/** A vanilla mob head drawn from the real texture with an ink outline and hard drop shadow. `scale` = screen px per texel. */
export const Mob: FC<{k: 'creeper' | 'pig' | 'slime'; scale: number; drop?: number; style?: CSSProperties}> = ({k, scale, drop = 0, style}) => {
  const o = Math.max(3, Math.round(scale / 3));
  const filter = [`drop-shadow(${o}px 0 0 ${INK})`, `drop-shadow(${-o}px 0 0 ${INK})`, `drop-shadow(0 ${o}px 0 ${INK})`, `drop-shadow(0 ${-o}px 0 ${INK})`, drop ? `drop-shadow(0 ${drop}px 0 ${INK})` : ''].join(' ');
  return <div style={{filter, ...style}}>{k === 'creeper' ? <CreeperHead scale={scale} /> : k === 'pig' ? <PigHead scale={scale} /> : <SlimeHead scale={scale} />}</div>;
};

/** Avatars for the cute characters (vanilla mobs use their real head textures). */
export type Face = 'steve' | 'alex' | 'creeper' | 'pig' | 'slime' | 'sunny' | 'zuri' | 'kai';
const MOB_BG: Record<string, string> = {creeper: '#c9efb8', pig: '#ffdbe6', slime: '#e4f7d6'};
export const Avatar: FC<{face: Face; size: number; ring?: string; style?: CSSProperties}> = ({face, size, ring = INK, style}) => {
  const inner = size - 12;
  let body: ReactNode;
  if (face === 'creeper' || face === 'pig' || face === 'slime') {
    const sc = Math.max(1, Math.floor(inner / 8));
    body = (
      <div style={{width: inner, height: inner, display: 'flex', alignItems: 'center', justifyContent: 'center', background: MOB_BG[face]}}>
        {face === 'creeper' ? <CreeperHead scale={sc} /> : face === 'pig' ? <PigHead scale={sc} /> : <SlimeHead scale={sc} />}
      </div>
    );
  } else {
    body = <PlayerFace size={inner} skin={`entity/player/wide/${face}.png`} />;
  }
  return (
    <div style={{width: size, height: size, borderRadius: size * 0.26, border: `6px solid ${ring}`, overflow: 'hidden', background: '#fff', boxSizing: 'border-box', boxShadow: `0 8px 0 ${INK}`, ...style}}>{body}</div>
  );
};

export const useList = <T,>(fn: () => T): T => useMemo(fn, []);

export { FLAT, RAINBOW, U };

/** Rounded cute label text: TITLE_FONT with a thick ink stroke painted behind the fill. */
export const Label: FC<{size?: number; color?: string; stroke?: string; style?: CSSProperties; children: ReactNode}> = ({size = 64, color = '#fff', stroke = INK, style, children}) => (
  <span
    style={{
      fontFamily: TITLE_FONT,
      fontSize: size,
      lineHeight: `${size * 1.15}px`,
      color,
      WebkitTextStroke: `${Math.max(4, size / 7)}px ${stroke}`,
      paintOrder: 'stroke fill',
      whiteSpace: 'pre',
      letterSpacing: size * 0.02,
      textShadow: `0 ${Math.max(3, size / 14)}px 0 ${stroke}`,
      ...style,
    }}
  >
    {children}
  </span>
);

/** Dotted halftone fill, for banners and corners. */
export const dots = (color: string, size = 36, r = 6): CSSProperties => ({
  backgroundImage: `radial-gradient(circle, ${color} ${r}px, transparent ${r + 1}px)`,
  backgroundSize: `${size}px ${size}px`,
});

/** Vanilla explosion particle (32x32, 16 frames) played at a point, warm tinted. `size` is the on-screen width. */
export const Explosion: FC<{x: number; y: number; at: number; size?: number; rate?: number; tint?: boolean; opacity?: number}> = ({x, y, at, size = 900, rate = 1.2, tint = true, opacity = 0.92}) => {
  const f = useCurrentFrame() - at;
  const n = Math.floor(f / rate);
  if (f < 0 || n > 15) return null;
  return (
    <Img
      src={staticFile(`mc/textures/particle/explosion_${n}.png`)}
      style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, imageRendering: 'pixelated', filter: tint ? 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.15)' : undefined, opacity}}
    />
  );
};

/** Particles rushing inward to a point (sucked in), spread along the screen edge. */
export const suckIn = (seed: number, at: number, dur: number, n: number, cx: number, cy: number, kinds: string[], size: [number, number] = [26, 56]): P[] => {
  const r = mulberry32(seed);
  return Array.from({length: n}, () => {
    const side = r();
    const x = side < 0.5 ? (r() < 0.5 ? -40 : W + 40) : r() * W;
    const y = side < 0.5 ? r() * H : r() < 0.5 ? -40 : H + 40;
    const life = 12 + Math.floor(r() * 12);
    return {kind: kinds[Math.floor(r() * kinds.length)], x, y, vx: (cx - x) / life, vy: (cy - y) / life, g: 0, drag: 1, at: at + Math.floor(r() * dur), life, rot: r() * 360, vr: (r() - 0.5) * 20, size: lerp(size[0], size[1], r()), phase: r() * 6.28};
  });
};
