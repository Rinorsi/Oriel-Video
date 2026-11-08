/**
 * mcd4 shared pieces for title cards / chapter cards / credits (Minecraft Dungeons trailer + UI language).
 *
 *   TexText      art-pixel display text painted with a texture look: 'gold' (trailer title gold with orange speckle),
 *                'stone' (cracked grey logo), 'logo' (orange-to-red logo), 'white'. Built-in extrusion (depth), pixel
 *                scramble (tiles displaced by whole art pixels), and left-to-right reveal. The wrapper is the tight ink box.
 *   useFitPx     largest integer px so a string stays inside maxW.
 *   TrailerBg    #060307 mosaic backdrop with the warm bottom glow of the trailer cards.
 *   RiseSparks   ambient pixel sparks (+ grey debris cubes) drifting up.      BurstSparks   one-shot spray from a rect.
 *   CornerFrame  the four pixel brackets + hairline frame of the end card.    GoldDivider    diamond-centred gold rule.
 *   Brace        the zig-zag brace ornament left/right of a logo.             Dim            soft dark gradient/vignette helper.
 */
import {useLayoutEffect, useRef, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {McdBackdrop, useTextSize, type McdTextOpts} from '../mcdkit/kit';
import {useMask, type MaskOpts, type PxMask} from '../mcdkit/pxtext';

// ------------------------------------------------------------------ small helpers

export const VOID = '#060307';
export const GOLD = '#FEC304';
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / Math.max(1, b - a));
export const stepped = (t: number, n: number) => Math.round(clamp01(t) * n) / n;
/** ASCII digits -> full-width digits, so numbers in a CJK-grid string use the same glyph size as the hanzi. */
export const fw = (s: string) => !/[㐀-鿿]/.test(s) ? s : s.replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const hash2 = (x: number, y: number, s = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

type Rgb = [number, number, number];
const hexRgb = (h: string): Rgb => {
  const s = h.length === 4 ? `${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h.slice(1, 7);
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a: Rgb, k: number): Rgb => [a[0] * k, a[1] * k, a[2] * k];
const pack = (c: Rgb) => ((255 << 24) | (Math.max(0, Math.min(255, Math.round(c[2]))) << 16) | (Math.max(0, Math.min(255, Math.round(c[1]))) << 8) | Math.max(0, Math.min(255, Math.round(c[0])))) >>> 0;

// ------------------------------------------------------------------ TexText

type FaceCtx = {top: boolean; left: boolean; bottom: boolean; right: boolean; dim: boolean; x: number; y: number; w: number; h: number; crack: boolean};
export type TexLook = {
  face: (t: number, o: FaceCtx) => Rgb;
  /** Extrusion colours, nearest step first. */
  ext: Rgb[];
  /** Extrusion direction per step (art px). */
  dir: [number, number];
  cracks?: boolean;
};

const G0 = hexRgb('#FFD21E');
const G1 = hexRgb('#F19D07');
const GOLD_LOOK: TexLook = {
  face: (t, o) => {
    let c = mix(G0, G1, t * 0.9);
    const h = hash2(o.x >> 1, o.y >> 1, 3);
    if (h < 0.11) c = mul(c, 0.86);
    else if (h < 0.16) c = mix(c, hexRgb('#E5860A'), 0.7);
    else if (h > 0.94) c = mix(c, [255, 240, 160], 0.55);
    if (o.top) c = hexRgb('#FFEC8A');
    else if (o.left) c = mix(c, [255, 244, 190], 0.28);
    if (o.bottom) c = mul(c, 0.84);
    if (o.dim) c = mix(c, hexRgb('#7A6246'), 0.8);
    return c;
  },
  ext: [hexRgb('#C9780B'), hexRgb('#A25C08'), hexRgb('#7A4306')],
  dir: [1, 1],
};

const S0 = hexRgb('#D7D3CE');
const S1 = hexRgb('#8A8683');
const STONE_LOOK: TexLook = {
  face: (t, o) => {
    let c = mix(S0, S1, t);
    const h = hash2(o.x, o.y, 9);
    c = mul(c, 0.93 + h * 0.12);
    if (o.crack) c = hexRgb('#46413F');
    else if (o.top) c = hexRgb('#EDEAE6');
    else if (o.left) c = mix(c, [255, 255, 255], 0.14);
    if (o.bottom && !o.crack) c = mul(c, 0.88);
    if (o.dim) c = mix(c, hexRgb('#59544F'), 0.75);
    return c;
  },
  ext: [hexRgb('#4E4A48'), hexRgb('#3A3736'), hexRgb('#2A2827')],
  dir: [1, 1],
  cracks: true,
};

const L0 = hexRgb('#FFEEA8');
const L1 = hexRgb('#FFC53C');
const L2 = hexRgb('#EE8A24');
const L3 = hexRgb('#C4481A');
const LOGO_LOOK: TexLook = {
  face: (t, o) => {
    let c = t < 0.35 ? mix(L0, L1, t / 0.35) : t < 0.7 ? mix(L1, L2, (t - 0.35) / 0.35) : mix(L2, L3, (t - 0.7) / 0.3);
    const h = hash2(o.x >> 1, o.y >> 1, 5);
    if (h < 0.08) c = mul(c, 0.9);
    if (o.top) c = hexRgb('#FFF6C4');
    else if (o.left) c = mix(c, [255, 250, 220], 0.2);
    if (o.bottom) c = mul(c, 0.86);
    if (o.dim) c = mix(c, hexRgb('#6C4A38'), 0.8);
    return c;
  },
  ext: [hexRgb('#A4381A'), hexRgb('#7E2A16'), hexRgb('#5C1F10')],
  dir: [1, 1],
};

const WHITE_LOOK: TexLook = {
  face: (t, o) => {
    let c = mix([255, 255, 255], [214, 214, 220], t);
    if (o.dim) c = mix(c, [90, 90, 96], 0.7);
    return c;
  },
  ext: [hexRgb('#1A1418')],
  dir: [1, 1],
};

const SILVER_LOOK: TexLook = {
  face: (t, o) => {
    let c = mix(hexRgb('#F2F2F4'), hexRgb('#B4B4BC'), t);
    if (o.top) c = [255, 255, 255];
    if (o.dim) c = mix(c, [70, 70, 80], 0.7);
    return c;
  },
  ext: [hexRgb('#38383F'), hexRgb('#25252B')],
  dir: [1, 1],
};

export const LOOKS = {gold: GOLD_LOOK, stone: STONE_LOOK, logo: LOGO_LOOK, white: WHITE_LOOK, silver: SILVER_LOOK};
export type LookName = keyof typeof LOOKS;

export type Scramble = {seed: number; amt: number};

type PaintOpts = {look: TexLook; depth: number; scr?: Scramble; reveal?: number; seed: number; shadow: number; pad: {x: number; t: number; b: number}};

const padOf = (m: PxMask, look: TexLook, depth: number, scr: Scramble | undefined, shadow: number) => {
  const slack = scr ? Math.ceil(Math.max(4, m.capH * 0.9) * 2.6 * scr.amt) + 1 : 0;
  const slackY = scr ? Math.ceil(Math.max(2, m.capH / 3.2) * 1.4 * scr.amt) + 1 : 0;
  return {x: slack + depth * Math.abs(look.dir[0]) + shadow + 1, t: slackY + 1, b: slackY + depth * Math.abs(look.dir[1]) + shadow + 1};
};

const paintTex = (cv: HTMLCanvasElement, m: PxMask, o: PaintOpts) => {
  const {look, depth, scr, reveal, seed, shadow, pad} = o;
  const W = m.w + pad.x * 2;
  const H = m.h + pad.t + pad.b;
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const buf = new Uint32Array(img.data.buffer);
  // effective mask: 0 off, 1 on, 2 on (dim)
  const eff = new Uint8Array(W * H);
  const tw = Math.max(4, Math.round(m.capH * 0.8));
  const th = Math.max(2, Math.round(m.capH / 3.4));
  const colHide = reveal === undefined ? Infinity : Math.floor(reveal * (m.w + 2));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const mx = x - pad.x;
      const my = y - pad.t;
      let sx = mx;
      let sy = my;
      let dimv = 0;
      if (scr && scr.amt > 0) {
        const tx = Math.floor(mx / tw);
        const ty = Math.floor(my / th);
        const r1 = hash2(tx, ty, scr.seed * 7 + 1);
        const r2 = hash2(tx, ty, scr.seed * 7 + 2);
        const r3 = hash2(tx, ty, scr.seed * 7 + 3);
        const r4 = hash2(tx, ty, scr.seed * 7 + 4);
        if (r1 < scr.amt * 0.85) {
          sx += Math.round((r2 - 0.5) * 2 * tw * 2.4 * scr.amt);
          sy += Math.round((r3 - 0.5) * 2 * th * 1.3 * scr.amt);
        }
        if (r4 < scr.amt * 0.18) {
          sx = -999;
        }
        if (r3 < scr.amt * 0.3) dimv = 1;
      }
      if (sx < 0 || sy < 0 || sx >= m.w || sy >= m.h || sx > colHide) continue;
      if (m.on[sy * m.w + sx]) eff[y * W + x] = dimv ? 2 : 1;
    }
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && eff[y * W + x] > 0;
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c;
  };
  // cracks (stone)
  let crack: Uint8Array | null = null;
  if (look.cracks) {
    crack = new Uint8Array(W * H);
    const rnd = mulberry32(seed * 31 + 7);
    const n = Math.max(6, Math.round(m.w / 7));
    for (let k = 0; k < n; k++) {
      let x = Math.floor(pad.x + rnd() * m.w);
      let y = Math.floor(pad.t + rnd() * m.h);
      let dir = rnd() < 0.5 ? 1 : -1;
      const len = 3 + Math.floor(rnd() * 8);
      for (let s = 0; s < len; s++) {
        if (x >= 0 && y >= 0 && x < W && y < H) crack[y * W + x] = 1;
        const r = rnd();
        if (r < 0.5) x += dir;
        else if (r < 0.85) y += 1;
        else {
          y -= 1;
          dir = -dir;
        }
      }
    }
  }
  // extrusion (far to near)
  const sh = shadow > 0 ? pack([5, 2, 2]) : 0;
  for (let d = depth; d >= 1; d--) {
    const c = pack(look.ext[Math.min(look.ext.length - 1, d - 1)]);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (eff[y * W + x] > 0) put(x + look.dir[0] * d, y + look.dir[1] * d, eff[y * W + x] === 2 ? pack(mul(look.ext[Math.min(look.ext.length - 1, d - 1)], 0.5)) : c);
  }
  if (shadow > 0) {
    // hard shadow only where extrusion is absent (used by depth 0 looks)
    for (let y = H - 1; y >= 0; y--)
      for (let x = W - 1; x >= 0; x--) if (eff[y * W + x] > 0 && depth === 0) put(x + shadow, y + shadow, sh);
  }
  // faces
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = eff[y * W + x];
      if (!e) continue;
      const t = clamp01((y - pad.t) / Math.max(1, m.h - 1));
      const c = look.face(t, {top: !at(x, y - 1), left: !at(x - 1, y), bottom: !at(x, y + 1), right: !at(x + 1, y), dim: e === 2, x: x - pad.x, y: y - pad.t, w: m.w, h: m.h, crack: crack ? crack[y * W + x] === 1 : false});
      put(x, y, pack(c));
    }
  ctx.putImageData(img, 0, 0);
};

export type TexTextProps = {
  text: string;
  px: number;
  look?: LookName | TexLook;
  depth?: number;
  shadow?: number;
  scramble?: Scramble;
  /** 0..1 left to right reveal (hard edge). */
  reveal?: number;
  seed?: number;
  gap?: number;
  cjkRows?: number;
  bold?: 0 | 1 | 2;
  caps?: boolean;
  opacity?: number;
  style?: CSSProperties;
};

const maskOf = (o: {gap?: number; cjkRows?: number; bold?: 0 | 1 | 2; caps?: boolean}): MaskOpts => ({bold: o.bold ?? 2, gap: o.gap ?? 2, cjkRows: o.cjkRows ?? 16, caps: o.caps ?? true});

/** Texture-looked pixel display text. Wrapper = tight ink box (flex-centring is exact); extrusion overflows to the bottom-right. */
export const TexText: FC<TexTextProps> = ({text, px, look = 'gold', depth = 3, shadow = 0, scramble, reveal, seed = 1, opacity = 1, style, ...mo}) => {
  const m = useMask(text, maskOf(mo));
  const ref = useRef<HTMLCanvasElement>(null);
  const lk = typeof look === 'string' ? LOOKS[look] : look;
  const pad = m ? padOf(m, lk, depth, scramble, shadow) : {x: 0, t: 0, b: 0};
  useLayoutEffect(() => {
    if (ref.current && m) paintTex(ref.current, m, {look: lk, depth, scr: scramble, reveal, seed, shadow, pad});
  });
  if (!m) return <span style={{display: 'inline-block', width: 1, height: 1}} />;
  const W = m.w + pad.x * 2;
  const H = m.h + pad.t + pad.b;
  return (
    <span style={{position: 'relative', display: 'inline-block', width: m.w * px, height: m.capH * px, flex: 'none', verticalAlign: 'top', opacity, ...style}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: -pad.x * px, top: -pad.t * px, width: W * px, height: H * px, imageRendering: 'pixelated'}} />
    </span>
  );
};

/** Largest integer art-pixel size (<= maxPx) that keeps `text` within maxW screen px. */
export const useFitPx = (text: string, maxW: number, maxPx: number, o: McdTextOpts = {}, minPx = 2) => {
  const s = useTextSize(text, {...o, px: 1});
  if (!s) return maxPx;
  return Math.max(minPx, Math.min(maxPx, Math.floor(maxW / s.w)));
};

// ------------------------------------------------------------------ layout / backdrops

export const Center: FC<{children?: ReactNode; style?: CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', ...style}}>{children}</AbsoluteFill>
);

/** Near-black mosaic with a warm floor glow, the backdrop of the trailer title cards. */
export const TrailerBg: FC<{glow?: number; drift?: number; children?: ReactNode}> = ({glow = 1, drift = 0.15, children}) => {
  const f = useCurrentFrame();
  return (
    <McdBackdrop kind="trailer" drift={f * drift} cell={44}>
      <AbsoluteFill style={{background: `linear-gradient(to top, rgba(150,58,10,${0.34 * glow}) 0%, rgba(90,30,6,${0.16 * glow}) 22%, rgba(0,0,0,0) 48%)`}} />
      {children}
    </McdBackdrop>
  );
};

/** Dark gradient helper: 'top' | 'bottom' | 'left' | 'edges' (vignette). */
export const Dim: FC<{kind?: 'top' | 'bottom' | 'left' | 'edges'; a?: number; size?: number; color?: string; style?: CSSProperties}> = ({kind = 'edges', a = 0.5, size = 0.4, color = '6,3,7', style}) => {
  const bg = {
    top: `linear-gradient(to bottom, rgba(${color},${a}) 0%, rgba(${color},${a * 0.55}) ${size * 55}%, rgba(${color},0) ${size * 100}%)`,
    bottom: `linear-gradient(to top, rgba(${color},${a}) 0%, rgba(${color},${a * 0.55}) ${size * 55}%, rgba(${color},0) ${size * 100}%)`,
    left: `linear-gradient(to right, rgba(${color},${a}) 0%, rgba(${color},${a * 0.55}) ${size * 55}%, rgba(${color},0) ${size * 100}%)`,
    edges: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(${color},0) ${100 - size * 100}%, rgba(${color},${a}) 100%)`,
  }[kind];
  return <AbsoluteFill style={{background: bg, pointerEvents: 'none', ...style}} />;
};

// ------------------------------------------------------------------ sparks

const SPARK_COLORS = ['#FF9E1B', '#FFC83A', '#F25A12', '#FFE9A0', '#FF7A18'];

/** Ambient pixel sparks rising with a sway, plus a few grey debris cubes. Area is [x, y, w, h] (screen px). */
export const RiseSparks: FC<{count?: number; seed?: number; area?: [number, number, number, number]; speed?: number; unit?: number; colors?: string[]; debris?: number; alpha?: number}> = ({
  count = 40,
  seed = 3,
  area = [0, 0, 1920, 1080],
  speed = 1,
  unit = 4,
  colors = SPARK_COLORS,
  debris = 0,
  alpha = 1,
}) => {
  const f = useCurrentFrame();
  const rnd = mulberry32(seed);
  const [ax, ay, aw, ah] = area;
  const out: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x0 = ax + rnd() * aw;
    const sp = (0.8 + rnd() * 1.6) * speed;
    const ph = rnd();
    const sway = 6 + rnd() * 26;
    const sz = unit * (rnd() < 0.62 ? 1 : rnd() < 0.8 ? 2 : 3);
    const col = colors[Math.floor(rnd() * colors.length)];
    const life = ah / (sp * 1.6);
    const t = (f / life + ph) % 1;
    const y = ay + ah - t * ah;
    const x = x0 + Math.sin(f * 0.05 * sp + i * 1.7) * sway;
    const a = Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.abs(Math.sin(f * 0.3 + i * 2.3))) * alpha;
    out.push(<div key={i} style={{position: 'absolute', left: Math.round(x / unit) * unit, top: Math.round(y / unit) * unit, width: sz, height: sz, background: col, opacity: a}} />);
  }
  for (let i = 0; i < debris; i++) {
    const x0 = ax + rnd() * aw;
    const sp = (0.25 + rnd() * 0.4) * speed;
    const ph = rnd();
    const sz = 12 + Math.floor(rnd() * 3) * 4;
    const life = ah / (sp * 1.6);
    const t = (f / life + ph) % 1;
    const y = ay + ah - t * ah;
    const x = x0 + Math.sin(f * 0.03 + i * 3.1) * 40;
    const a = Math.sin(t * Math.PI) * 0.9 * alpha;
    out.push(
      <div key={`d${i}`} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, opacity: a, transform: `rotate(${f * (1 + (i % 3)) * 1.3 + i * 40}deg)`, background: '#6D5E58', boxShadow: `inset ${sz / 4}px ${sz / 4}px 0 #9A8A80, inset -${sz / 4}px -${sz / 4}px 0 #3C322E`}} />,
    );
  }
  return <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>{out}</AbsoluteFill>;
};

/** One-shot spray of pixel sparks and a few debris cubes from a rect [x, y, w, h], starting at frame `at`. */
export const BurstSparks: FC<{at: number; rect: [number, number, number, number]; count?: number; seed?: number; power?: number; life?: number; unit?: number; colors?: string[]; debris?: number; gravity?: number}> = ({
  at,
  rect,
  count = 36,
  seed = 9,
  power = 1,
  life = 44,
  unit = 4,
  colors = SPARK_COLORS,
  debris = 6,
  gravity = 0.16,
}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life * 1.4) return null;
  const rnd = mulberry32(seed);
  const [rx, ry, rw, rh] = rect;
  const out: ReactNode[] = [];
  const mk = (i: number, isDebris: boolean) => {
    const px0 = rx + rnd() * rw;
    const py0 = ry + rnd() * rh;
    const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.6;
    const v = (3 + rnd() * 9) * power * (isDebris ? 0.7 : 1);
    const lf = life * (0.55 + rnd() * 0.75);
    const sz = isDebris ? 12 + Math.floor(rnd() * 3) * 4 : unit * (rnd() < 0.6 ? 1 : 2);
    const col = colors[Math.floor(rnd() * colors.length)];
    const rot = rnd() * 360;
    if (f > lf) return;
    const t = f / lf;
    const x = px0 + Math.cos(ang) * v * f * (1 - 0.35 * t);
    const y = py0 + Math.sin(ang) * v * f * (1 - 0.35 * t) + gravity * f * f * (isDebris ? 1.4 : 0.6);
    const a = 1 - Math.pow(t, 2.2);
    if (isDebris)
      out.push(<div key={`d${i}`} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, opacity: a, transform: `rotate(${rot + f * 11}deg)`, background: '#6D5E58', boxShadow: `inset ${sz / 4}px ${sz / 4}px 0 #9A8A80, inset -${sz / 4}px -${sz / 4}px 0 #3C322E`}} />);
    else out.push(<div key={i} style={{position: 'absolute', left: Math.round(x / unit) * unit, top: Math.round(y / unit) * unit, width: sz, height: sz, background: col, opacity: a * (0.6 + 0.4 * ((f + i) % 3 === 0 ? 0.4 : 1))}} />);
  };
  for (let i = 0; i < count; i++) mk(i, false);
  for (let i = 0; i < debris; i++) mk(i, true);
  return <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>{out}</AbsoluteFill>;
};

// ------------------------------------------------------------------ frame / ornaments

/**
 * The end-card frame: a hairline rectangle with a nested pixel bracket in each corner. `grow` 0..1 extends the hairlines out of the
 * corners in hard steps. `u` = pixel unit.
 */
export const CornerFrame: FC<{inset?: number; arm?: number; u?: number; color?: string; grow?: number; style?: CSSProperties}> = ({inset = 28, arm = 14, u = 6, color = '#8C8C96', grow = 1, style}) => {
  const g = stepped(grow, 8);
  const W = 1920;
  const H = 1080;
  const L = arm * u;
  const line = 'rgba(200,200,214,0.16)';
  const corner = (cx: number, cy: number, sx: number, sy: number, key: string) => {
    // cx,cy = outer corner; sx,sy = direction into the screen (+1/-1)
    const rect = (ox: number, oy: number, w: number, h: number, c: string, kk: string) => {
      const x0 = cx + sx * ox;
      const y0 = cy + sy * oy;
      const x1 = cx + sx * (ox + w);
      const y1 = cy + sy * (oy + h);
      return <div key={kk} style={{position: 'absolute', left: Math.min(x0, x1), top: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0), background: c}} />;
    };
    return (
      <div key={key}>
        {rect(0, 0, L, u, color, 'ot')}
        {rect(0, 0, u, L, color, 'ol')}
        {rect(u * 3, u * 3, L * 0.55, u, color, 'it')}
        {rect(u * 3, u * 3, u, L * 0.55, color, 'il')}
        {rect(u * 3, u * 3, u, u, '#C8C8D2', 'dot')}
      </div>
    );
  };
  const hl = (W - inset * 2 - L * 2) * g;
  const vl = (H - inset * 2 - L * 2) * g;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', ...style}}>
      {corner(inset, inset, 1, 1, 'tl')}
      {corner(W - inset, inset, -1, 1, 'tr')}
      {corner(inset, H - inset, 1, -1, 'bl')}
      {corner(W - inset, H - inset, -1, -1, 'br')}
      {/* hairlines creeping out of the corners */}
      <div style={{position: 'absolute', left: inset + L, top: inset + u / 2 - 1, width: hl / 2, height: 2, background: line}} />
      <div style={{position: 'absolute', right: inset + L, top: inset + u / 2 - 1, width: hl / 2, height: 2, background: line}} />
      <div style={{position: 'absolute', left: inset + L, bottom: inset + u / 2 - 1, width: hl / 2, height: 2, background: line}} />
      <div style={{position: 'absolute', right: inset + L, bottom: inset + u / 2 - 1, width: hl / 2, height: 2, background: line}} />
      <div style={{position: 'absolute', top: inset + L, left: inset + u / 2 - 1, height: vl / 2, width: 2, background: line}} />
      <div style={{position: 'absolute', bottom: inset + L, left: inset + u / 2 - 1, height: vl / 2, width: 2, background: line}} />
      <div style={{position: 'absolute', top: inset + L, right: inset + u / 2 - 1, height: vl / 2, width: 2, background: line}} />
      <div style={{position: 'absolute', bottom: inset + L, right: inset + u / 2 - 1, height: vl / 2, width: 2, background: line}} />
    </AbsoluteFill>
  );
};

/** Gold rule with a diamond in the middle and 45-degree chamfered ends; `grow` 0..1 draws it outward from the centre. */
export const GoldDivider: FC<{w?: number; grow?: number; color?: string; dark?: string; thick?: number; style?: CSSProperties}> = ({w = 640, grow = 1, color = '#F4B55A', dark = '#6A3F10', thick = 6, style}) => {
  const g = stepped(grow, 10);
  const half = (w / 2 - 28) * g;
  const d = thick * 3;
  const bar = (left: boolean) => (
    <div style={{position: 'relative', width: half, height: thick, flex: 'none'}}>
      <div style={{position: 'absolute', right: left ? 0 : undefined, left: left ? undefined : 0, top: 3, width: half, height: thick, background: dark}} />
      <div style={{position: 'absolute', right: left ? 0 : undefined, left: left ? undefined : 0, top: 0, width: half, height: thick, background: color}} />
    </div>
  );
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, width: w, height: d + 6, ...style}}>
      {bar(true)}
      <div style={{position: 'relative', width: d, height: d, flex: 'none', transform: `scale(${g > 0 ? 1 : 0})`}}>
        <div style={{position: 'absolute', inset: 0, background: dark, transform: 'translate(3px,3px) rotate(45deg) scale(0.72)'}} />
        <div style={{position: 'absolute', inset: 0, background: color, transform: 'rotate(45deg) scale(0.72)'}} />
        <div style={{position: 'absolute', left: d * 0.38, top: d * 0.3, width: d * 0.16, height: d * 0.16, background: '#FFF2C0'}} />
      </div>
      {bar(false)}
    </div>
  );
};

const BRACE_ROWS = [
  '....oooo',
  '...ooooo',
  '..ooo...',
  '..ooo...',
  '..ooo...',
  '.ooo....',
  'ooo.....',
  'ooo.....',
  '.ooo....',
  '..ooo...',
  '..ooo...',
  '..ooo...',
  '...ooooo',
  '....oooo',
];
/** Pixel brace ornament (the `{ }` flanking a logo). `flip` mirrors it for the right side. */
export const Brace: FC<{px?: number; color?: string; hi?: string; lo?: string; flip?: boolean; style?: CSSProperties}> = ({px = 6, color = '#F9A22A', hi = '#FFE08A', lo = '#A8381A', flip, style}) => {
  const rows = BRACE_ROWS;
  const w = rows[0].length;
  const h = rows.length;
  const cells: {x: number; y: number; c: string}[] = [];
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch !== 'o') return;
      const up = y > 0 && rows[y - 1][x] === 'o';
      cells.push({x, y, c: !up ? hi : y > h * 0.62 ? lo : color});
    }),
  );
  return (
    <svg width={(w + 1) * px} height={(h + 1) * px} viewBox={`0 0 ${w + 1} ${h + 1}`} shapeRendering="crispEdges" style={{display: 'block', flex: 'none', transform: flip ? 'scaleX(-1)' : undefined, ...style}}>
      {cells.map((c) => (
        <rect key={`s${c.x}-${c.y}`} x={c.x + 1} y={c.y + 1} width={1} height={1} fill="#2A0E08" />
      ))}
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill={c.c} />
      ))}
    </svg>
  );
};

/** Pixel cross flash (the sanctioned replacement for expanding rings): a plus-shaped glint that pops and shrinks. */
export const CrossFlash: FC<{x: number; y: number; at: number; dur?: number; size?: number; color?: string; core?: string}> = ({x, y, at, dur = 14, size = 120, color = '#FFC83A', core = '#FFF6C0'}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f >= dur) return null;
  const t = f / dur;
  const k = f < 3 ? f / 3 : 1 - (f - 3) / (dur - 3);
  const L = Math.round((size * (0.4 + 0.6 * EASE.out(Math.min(1, t * 2)))) / 6) * 6;
  const th = 12;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(k)}}>
      <div style={{position: 'absolute', left: -L, top: -th / 2, width: L * 2, height: th, background: color}} />
      <div style={{position: 'absolute', left: -th / 2, top: -L, width: th, height: L * 2, background: color}} />
      <div style={{position: 'absolute', left: -L / 2, top: -th / 4, width: L, height: th / 2, background: core}} />
      <div style={{position: 'absolute', left: -th / 4, top: -L / 2, width: th / 2, height: L, background: core}} />
    </div>
  );
};
