import {createContext, useContext, useEffect, useId, useState, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {block, item, tex} from '../../../mc/assets';
import {PIXEL_FONT, fontsReady} from '../../../mc/fonts';
import {clamp01, mulberry32} from '../../../mc/theme';
import {hexA} from '../../../mg/Graphic';
import {LH, LW, loadImage, tint, useAssets} from '../../../mg/LowRes';
import {Sfx as BaseSfx} from '../../../reel/kit';

/**
 * Shared kit for the dim area (dimension changes, location cards, jumps).
 * Everything here is deterministic (seeded) and works on the 480x270 low-res grid (1 unit = 4 screen px).
 *   - assets: textures loaded once as canvases / images (useDim)
 *   - maths: smooth, mod, hash, colour mixing, banded gradients (pixel-banded, no smooth gradients)
 *   - drawing: tiled textures, motes (looping particles), pixel vortex, Steve from the skin atlas
 *   - DOM: BandTitle (Ore-style chunky title in three tone bands), Cam (zoom wrapper), Frame9 helpers
 */

export const W = LW;
export const H = LH;

// ---------------------------------------------------------------- maths

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mod = (a: number, n: number) => ((a % n) + n) % n;
export const hash = (seed: number, i: number) => mulberry32(Math.imul(seed + 17, 73856093) ^ Math.imul(i + 3, 19349663))();

const rgbOf = (h: string): [number, number, number] => {
  if (h.startsWith('rgb')) {
    const m = h.match(/[\d.]+/g)!.map(Number);
    return [m[0], m[1], m[2]];
  }
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  const k = clamp01(t);
  return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`;
};
export { hexA };

/** Colour at position t in a list of [offset, hex] stops. */
export const gradAt = (stops: [number, string][], t: number) => {
  if (t <= stops[0][0]) return mixHex(stops[0][1], stops[0][1], 0);
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (t <= b) return mixHex(ca, cb, (t - a) / (b - a));
  }
  const last = stops[stops.length - 1][1];
  return mixHex(last, last, 0);
};

/** Horizontal bands (pixel-stepped vertical gradient). */
export const bands = (ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][], step = 3, x0 = 0, x1 = W) => {
  for (let y = y0; y < y1; y += step) {
    ctx.fillStyle = gradAt(stops, (y - y0) / (y1 - y0));
    ctx.fillRect(x0, y, x1 - x0, Math.min(step, y1 - y));
  }
};

// ---------------------------------------------------------------- assets

export type DimAssets = {
  img: Record<string, HTMLImageElement>;
  grass: HTMLCanvasElement;
  leaves: HTMLCanvasElement;
  fern: HTMLCanvasElement;
};

const TEX: Record<string, string> = {
  netherrack: block('netherrack'),
  lava: block('lava_still'),
  portal: block('nether_portal'),
  obsidian: block('obsidian'),
  crying: block('crying_obsidian'),
  endstone: block('end_stone'),
  endsky: tex('environment/end_sky.png'),
  glowstone: block('glowstone'),
  netherbricks: block('nether_bricks'),
  redbricks: block('red_nether_bricks'),
  magma: block('magma'),
  soulsand: block('soul_sand'),
  blackstone: block('blackstone'),
  dirt: block('dirt'),
  stone: block('stone'),
  grasstop: block('grass_block_top'),
  oakleaves: block('oak_leaves'),
  cherryleaves: block('cherry_leaves'),
  oaklog: block('oak_log'),
  cherrylog: block('cherry_log'),
  purpur: block('purpur_block'),
  steve: tex('entity/player/wide/steve.png'),
  glint: tex('particle/glint.png'),
  flash: tex('particle/flash.png'),
  glow: tex('particle/glow.png'),
  fern: block('short_grass'),
  pearl: item('ender_pearl'),
  enderEye: item('ender_eye'),
  stonebricks: block('stone_bricks'),
  mossy: block('mossy_stone_bricks'),
  cracked: block('cracked_stone_bricks'),
  chiseled: block('chiseled_stone_bricks'),
  frameTop: block('end_portal_frame_top'),
  frameEye: block('end_portal_frame_eye'),
  frameSide: block('end_portal_frame_side'),
  torch: block('torch'),
};

let cache: Promise<DimAssets> | null = null;
const loadDim = (): Promise<DimAssets> => {
  if (!cache) {
    cache = (async () => {
      const keys = Object.keys(TEX);
      const imgs = await Promise.all(keys.map((k) => loadImage(TEX[k])));
      const img = Object.fromEntries(keys.map((k, i) => [k, imgs[i]]));
      // The grass top and leaves are grey in the files; the game tints them by biome.
      const mul = (src: HTMLImageElement, color: string) => {
        const c = document.createElement('canvas');
        c.width = src.width;
        c.height = src.height;
        const x = c.getContext('2d')!;
        x.drawImage(src, 0, 0);
        x.globalCompositeOperation = 'multiply';
        x.fillStyle = color;
        x.fillRect(0, 0, c.width, c.height);
        x.globalCompositeOperation = 'destination-in';
        x.drawImage(src, 0, 0);
        return c;
      };
      return {img, grass: mul(img.grasstop, '#8fd25e'), leaves: mul(img.oakleaves, '#5cb236'), fern: mul(img.fern, '#79c050')};
    })();
  }
  return cache;
};
export const useDim = () => useAssets<DimAssets>('dim-kit', loadDim);

const frameCache = new Map<string, HTMLCanvasElement>();
/** One 16x16 frame of a vertical animation strip (nether portal, lava). */
export const stripFrame = (img: HTMLImageElement, i: number): HTMLCanvasElement => {
  const n = Math.floor(img.height / img.width);
  const k = ((i % n) + n) % n;
  const key = `${img.src}#${k}`;
  let c = frameCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.width;
    c.getContext('2d')!.drawImage(img, 0, k * img.width, img.width, img.width, 0, 0, img.width, img.width);
    frameCache.set(key, c);
  }
  return c;
};

/** Fill a rect with a texture repeated at an integer scale (1 texel = `scale` units). `ox/oy` shift the pattern. */
export const tile = (ctx: CanvasRenderingContext2D, src: CanvasImageSource, x: number, y: number, w: number, h: number, scale = 1, ox = 0, oy = 0) => {
  if (w <= 0 || h <= 0) return;
  const pat = ctx.createPattern(src, 'repeat');
  if (!pat) return;
  pat.setTransform(new DOMMatrix().translate(Math.round(x - ox), Math.round(y - oy)).scale(scale));
  ctx.fillStyle = pat;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

export const shade = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, a: number) => {
  ctx.fillStyle = hexA(color, a);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// ---------------------------------------------------------------- particles

export type MoteOpts = {
  seed: number;
  count: number;
  f: number;
  area: [number, number, number, number];
  vx?: number;
  vy?: number;
  colors: string[];
  size?: [number, number];
  wobble?: number;
  alpha?: number;
  /** Fade in/out along the y travel (default true). */
  fade?: boolean;
};

/** Looping pixel motes: wrap around `area` while drifting by (vx, vy) units per frame. Deterministic. */
export const motes = (ctx: CanvasRenderingContext2D, o: MoteOpts) => {
  const [ax, ay, aw, ah] = o.area;
  const rnd = mulberry32(o.seed);
  const [s0, s1] = o.size ?? [1, 2];
  for (let i = 0; i < o.count; i++) {
    const x0 = rnd() * aw;
    const y0 = rnd() * ah;
    const sp = 0.6 + rnd() * 0.8;
    const ph = rnd() * 6.28;
    const s = Math.round(lerp(s0, s1, rnd()));
    const col = o.colors[Math.floor(rnd() * o.colors.length)];
    const x = ax + mod(x0 + (o.vx ?? 0) * sp * o.f + Math.sin(o.f / 14 + ph) * (o.wobble ?? 0), aw);
    const yy = mod(y0 + (o.vy ?? 0) * sp * o.f, ah);
    const u = yy / ah;
    const env = o.fade === false ? 1 : Math.min(1, Math.min(u, 1 - u) * 6);
    ctx.globalAlpha = (o.alpha ?? 1) * env;
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(ay + yy), s, s);
  }
  ctx.globalAlpha = 1;
};

/** Pixel vortex: spiral arms of squares, bright at the centre. `grow` 0..1 widens it; `spin` is the frame-driven angle. */
export const vortex = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, spin: number, arms: number, colors: string[], o: {squash?: number; twist?: number; alpha?: number; dots?: number; thick?: number} = {}) => {
  const squash = o.squash ?? 1;
  const twist = o.twist ?? 0.055;
  const n = o.dots ?? 70;
  for (let a = 0; a < arms; a++) {
    for (let i = 0; i < n; i++) {
      const r = (i / n) * radius;
      const ang = spin + (a / arms) * Math.PI * 2 + r * twist;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r * squash;
      const s = Math.max(1, Math.round((o.thick ?? 1) * (1.5 + (1 - i / n) * 3 * Math.min(2, radius / 160)))) + (i % 7 === 0 ? 1 : 0);
      ctx.globalAlpha = (o.alpha ?? 1) * (0.35 + 0.65 * (1 - i / n));
      ctx.fillStyle = colors[(i + a) % colors.length];
      ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    }
  }
  ctx.globalAlpha = 1;
};

/** Steve (front view) from the vanilla skin atlas, `s` units per skin pixel, feet at (x, y). */
export const drawSteve = (ctx: CanvasRenderingContext2D, skin: HTMLImageElement, x: number, y: number, s: number, o: {armSwing?: number; flip?: boolean} = {}) => {
  const part = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number) => ctx.drawImage(skin, sx, sy, sw, sh, Math.round(x + dx * s), Math.round(y + dy * s), sw * s, sh * s);
  const sw = o.armSwing ?? 0;
  // Local coordinates: 16 px wide (-8..8), 32 tall (-32..0).
  part(4, 20, 4, 12, -4, -12); // right leg (viewer's left)
  part(20, 52, 4, 12, 0, -12); // left leg
  part(4, 36, 4, 12, -4, -12);
  part(4, 52, 4, 12, 0, -12);
  part(44, 20, 4, 12, -8, -24 + sw); // right arm
  part(36, 52, 4, 12, 4, -24 - sw); // left arm
  part(44, 36, 4, 12, -8, -24 + sw);
  part(52, 52, 4, 12, 4, -24 - sw);
  part(20, 20, 8, 12, -4, -24); // body
  part(20, 36, 8, 12, -4, -24);
  part(8, 8, 8, 8, -4, -32); // head
  part(40, 8, 8, 8, -4, -32); // hat layer
};

/** A solid-colour silhouette of an image (alpha kept). */
export const silhouette = (img: CanvasImageSource & {width: number; height: number}, color: string) => tint(img as HTMLImageElement, color);

// ---------------------------------------------------------------- DOM helpers

/** Camera wrapper: zoom/pan around a focus point (screen px). */
export const Cam: FC<{zoom?: number; fx?: number; fy?: number; dx?: number; dy?: number; rot?: number; style?: CSSProperties; children: ReactNode}> = ({zoom = 1, fx = 960, fy = 540, dx = 0, dy = 0, rot = 0, style, children}) => (
  <AbsoluteFill style={{transformOrigin: `${fx}px ${fy}px`, transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${zoom})`, ...style}}>{children}</AbsoluteFill>
);

export type TitlePalette = {light: string; mid: string; dark: string; extrude: string; extrude2: string; glow?: string; texture?: string};

export const TITLE_PALETTES = {
  stone: {light: '#ece6e2', mid: '#c4bcb8', dark: '#a29a96', extrude: '#6f6865', extrude2: '#4a4442', glow: '#ffffff', texture: block('stone')},
  nether: {light: '#ffd9a0', mid: '#ff8a2a', dark: '#c4400f', extrude: '#6a1608', extrude2: '#2e0804', glow: '#ff6a1a', texture: block('netherrack')},
  end: {light: '#f2e0ff', mid: '#c19bff', dark: '#7b4ad6', extrude: '#3b1d80', extrude2: '#150a38', glow: '#b06bff', texture: block('end_stone')},
  grass: {light: '#d4f6a0', mid: '#7fd24e', dark: '#3c8527', extrude: '#2a5a1e', extrude2: '#14300f', glow: '#a6ff6a', texture: block('grass_block_top')},
  gold: {light: '#fff3b0', mid: '#ffc93a', dark: '#d9861a', extrude: '#7a4310', extrude2: '#3a1f08', glow: '#ffd23f', texture: block('gold_block')},
  ice: {light: '#f2ffff', mid: '#9be8ff', dark: '#3f9ee0', extrude: '#1d4f94', extrude2: '#0c2650', glow: '#7fe4ff', texture: block('packed_ice')},
  pink: {light: '#ffe4ee', mid: '#ff9fc4', dark: '#e0568c', extrude: '#8c2656', extrude2: '#4a1030', glow: '#ff9fc4', texture: block('cherry_planks')},
} satisfies Record<string, TitlePalette>;
export type TitleTone = keyof typeof TITLE_PALETTES;

/**
 * Ink centring for pixel-font text. The font's advance box is not the visible ink (full-width punctuation leaves a big
 * blank on the right, CJK glyphs sit low in the em box), so we measure the real ink bounds once with canvas and return the
 * offset (dx, dy) that moves the ink centre onto the centre of the layout box.
 */
type Ink = {dx: number; dy: number};
const inkCache = new Map<string, Ink>();
const inkPending = new Map<string, number[]>();
const ZERO: Ink = {dx: 0, dy: 0};
const pendInk = (key: string, text: string) => {
  const list = inkPending.get(key) ?? [];
  list.push(delayRender(`ink ${text}`));
  inkPending.set(key, list);
};
const useInk = (text: string, size: number, spacing: number, enabled = true, font = PIXEL_FONT): Ink => {
  const key = `${font}|${size}|${spacing}|${text}`;
  const [, bump] = useState(0);
  // Hold the render from the very first frame until the measurement is in.
  useState(() => {
    if (enabled && !inkCache.has(key)) pendInk(key, text);
    return 0;
  });
  useEffect(() => {
    if (!enabled || inkCache.has(key)) return;
    if (!inkPending.get(key)?.length) pendInk(key, text);
    let alive = true;
    fontsReady().then(() => {
      const c = document.createElement('canvas').getContext('2d')!;
      c.font = `${size}px ${font}`;
      c.letterSpacing = `${spacing}px`;
      const m = c.measureText(text);
      const baseline = (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      const inkCx = (-m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 2;
      const inkCy = baseline + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
      inkCache.set(key, {dx: (m.width - spacing) / 2 - inkCx, dy: size / 2 - inkCy});
      (inkPending.get(key) ?? []).forEach((h) => continueRender(h));
      inkPending.delete(key);
      if (alive) bump((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [key, enabled, size, spacing, text, font]);
  return enabled ? inkCache.get(key) ?? ZERO : ZERO;
};

/**
 * Chunky Ore-style title: three hard tone bands, black pixel outline and a two-step extrusion
 * (like StoneTitle but with a colour palette). `size` must be a multiple of 12.
 */
export const BandTitle: FC<{size?: number; tone?: TitleTone | TitlePalette; style?: CSSProperties; inkY?: boolean; ink?: boolean; children: string}> = ({size = 144, tone = 'stone', style, inkY, ink: inkOn = true, children}) => {
  const pal: TitlePalette = typeof tone === 'string' ? TITLE_PALETTES[tone] : tone;
  const p = size / 12;
  const ink = useInk(children, size, p, inkOn);
  const outline = (dy: number) => [`${p}px ${dy}px 0 #000`, `${-p}px ${dy}px 0 #000`, `0 ${dy + p}px 0 #000`, `0 ${dy - p}px 0 #000`, `${p}px ${dy + p}px 0 #000`, `${-p}px ${dy + p}px 0 #000`, `${p}px ${dy - p}px 0 #000`, `${-p}px ${dy - p}px 0 #000`];
  const back = [`0 ${p}px 0 ${pal.extrude}`, `0 ${2 * p}px 0 ${pal.extrude2}`, ...outline(0), ...outline(p), ...outline(2 * p)].join(',');
  const text: CSSProperties = {fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, whiteSpace: 'pre', WebkitFontSmoothing: 'none', letterSpacing: p};
  return (
    <div style={{position: 'relative', display: 'inline-block', marginRight: -p, transform: `translate(${ink.dx}px, ${inkY ? ink.dy : 0}px)`, ...style}}>
      <span style={{...text, color: pal.mid, textShadow: back}}>{children}</span>
      <span
        style={{
          ...text,
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundImage: `${pal.texture ? `url(${pal.texture}), ` : ''}linear-gradient(180deg, ${pal.light} 0%, ${pal.light} 46%, ${pal.mid} 46%, ${pal.mid} 78%, ${pal.dark} 78%)`,
          backgroundSize: `${pal.texture ? `${16 * p}px ${16 * p}px, ` : ''}100% 100%`,
          backgroundBlendMode: pal.texture ? 'soft-light' : undefined,
          imageRendering: 'pixelated',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {children}
      </span>
    </div>
  );
};

/** Item sprite as a pixelated <img>. */
export const itemUrl = item;
export const blockUrl = block;
export const texUrl = tex;

/** Plain stroked text label in the pixel font (black pixel outline), for HUD-like numbers. */
export const outlineShadow = (p: number, color = '#000') =>
  [`${p}px 0 ${color}`, `${-p}px 0 ${color}`, `0 ${p}px ${color}`, `0 ${-p}px ${color}`, `${p}px ${p}px ${color}`, `${-p}px ${p}px ${color}`, `${p}px ${-p}px ${color}`, `${-p}px ${-p}px ${color}`].join(',');

export { LH, LW };

/**
 * Pixel dissolve: fills cells of a `cell`-unit grid with `colors` as p goes 0..1.
 * `radial` (0..1) makes cells nearest (cx, cy) go first (iris); 0 is pure noise.
 */
export const dissolve = (ctx: CanvasRenderingContext2D, p: number, colors: string[], o: {cell?: number; radial?: number; cx?: number; cy?: number; invert?: boolean} = {}) => {
  if (p <= 0) return;
  const cell = o.cell ?? 6;
  const cx = o.cx ?? W / 2;
  const cy = o.cy ?? H / 2;
  const rad = o.radial ?? 0.6;
  const maxD = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  for (let y = 0; y < H; y += cell) {
    for (let x = 0; x < W; x += cell) {
      const ci = (x / cell) | 0;
      const cj = (y / cell) | 0;
      const n = hash(900, ci * 977 + cj);
      const d = Math.hypot(x + cell / 2 - cx, y + cell / 2 - cy) / maxD;
      const th = d * rad + n * (1 - rad);
      const on = o.invert ? th > 1 - p : th < p;
      if (!on && p < 1) continue;
      ctx.fillStyle = colors[(ci + cj * 3 + Math.floor(n * 7)) % colors.length];
      ctx.fillRect(x, y, cell, cell);
    }
  }
};

/** SVG turbulence warp (wobbly "nausea" distortion). Put `node` in the tree and use `filter` on the element to warp. */
export const useWarp = (f: number, strength: number, freq = 0.012) => {
  const raw = useId();
  const id = `warp${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const node = (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feTurbulence type="turbulence" baseFrequency={`${freq} ${freq * 1.7}`} numOctaves={2} seed={3} result="t" />
        <feOffset in="t" dx={f * 3} dy={f * 2} result="t2" />
        <feDisplacementMap in="SourceGraphic" in2="t2" scale={strength} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
  return {id, node, filter: strength > 0.5 ? `url(#${id})` : undefined};
};

// ---------------------------------------------------------------- pixel impact accents (replace the old expanding rings)

/**
 * Canvas version (low-res units): a pixel cross flare plus eight stepped shards flying outward.
 * `u` is progress 0..1. No ring, everything snapped to whole units.
 */
export const pixelCross = (ctx: CanvasRenderingContext2D, cx: number, cy: number, u: number, o: {size?: number; color?: string; core?: string; seed?: number} = {}) => {
  const size = o.size ?? 26;
  const color = o.color ?? '#e9c4ff';
  const core = o.core ?? '#ffffff';
  const fl = clamp01(1 - u * 1.6);
  const x = Math.round(cx);
  const y = Math.round(cy);
  if (fl > 0) {
    const arm = Math.round(size * (0.35 + 0.65 * Math.min(1, u * 5)));
    const th = fl > 0.5 ? 3 : 1;
    ctx.globalAlpha = fl;
    ctx.fillStyle = color;
    ctx.fillRect(x - arm, y - Math.floor(th / 2), arm * 2, th);
    ctx.fillRect(x - Math.floor(th / 2), y - arm, th, arm * 2);
    ctx.fillStyle = core;
    ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.globalAlpha = 1;
  }
  const r = mulberry32(Math.floor((o.seed ?? 1) * 97));
  const fade = 1 - clamp01((u - 0.35) / 0.65);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (r() - 0.5) * 0.3;
    const reach = size * (0.9 + r() * 0.7) * (1 - Math.pow(1 - clamp01(u * 1.15), 2));
    for (let j = 0; j < 3; j++) {
      const rr = Math.max(0, reach - j * 3);
      const s = j === 0 ? 3 : 2;
      ctx.globalAlpha = fade * (1 - j * 0.28);
      ctx.fillStyle = j === 0 ? core : color;
      ctx.fillRect(Math.round(x + Math.cos(a) * rr) - 1, Math.round(y + Math.sin(a) * rr) - 1, s, s);
    }
  }
  ctx.globalAlpha = 1;
};

/** Small DOM click accent (screen px): four stepped diagonal shards and a tiny cross, 14 frames. */
export const ClickSpark: FC<{at: number; x: number; y: number; color?: string}> = ({at, x, y, color = '#ffe9a0'}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 14) return null;
  const t = f / 14;
  const P = 8;
  const snap = (v: number) => Math.round(v / P) * P;
  const out: ReactNode[] = [];
  const arm = snap(14 + 26 * (1 - Math.pow(1 - clamp01(t * 2.2), 2)));
  const fl = clamp01(1 - t * 2);
  if (fl > 0) {
    out.push(<div key="h" style={{position: 'absolute', left: snap(x - arm), top: snap(y) - P / 2, width: arm * 2, height: P, background: '#fff', opacity: fl}} />);
    out.push(<div key="v" style={{position: 'absolute', left: snap(x) - P / 2, top: snap(y - arm), width: P, height: arm * 2, background: '#fff', opacity: fl}} />);
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const d = snap(24 + 70 * (1 - Math.pow(1 - t, 2)));
    for (let j = 0; j < 2; j++) {
      const dd = Math.max(0, d - j * 16);
      out.push(<div key={`${i}-${j}`} style={{position: 'absolute', left: snap(x + Math.cos(a) * dd) - (P - j * 2) / 2, top: snap(y + Math.sin(a) * dd) - (P - j * 2) / 2, width: P - j * 2, height: P - j * 2, background: j ? color : '#fff', opacity: 1 - t}} />);
    }
  }
  return <>{out}</>;
};

/** Audio switch for everything in the dim area: the lib wraps effects in <DimAudio.Provider value={false}> to mute their built-in sounds. Default true = unchanged. */
export const DimAudio = createContext(true);
/** Drop-in for the reel Sfx that honours DimAudio. */
export const DimSfx: typeof BaseSfx = (props) => (useContext(DimAudio) ? <BaseSfx {...props} /> : null);
