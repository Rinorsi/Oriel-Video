// Pixel text engine for the Dungeons-style kit.
// Text is rasterised on a coarse "art pixel" grid (Latin: Fusion Pixel 12 emboldened; CJK: Noto Sans SC Black thresholded),
// then painted into a small canvas that is scaled up with image-rendering: pixelated by an integer `px`.
// The hard drop shadow, outline and face colours are all painted on the art grid, so edges are always crisp and
// the shadow offset is always a whole number of art pixels. The wrapper box is the tight INK box (shadow overflows),
// so putting it in a flex-centred parent centres the visible letters exactly.
import {useEffect, useLayoutEffect, useReducer, useRef, type CSSProperties, type FC} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {BLACK_FONT, PIXEL_FONT, fontsReady} from '../../../mc/fonts';

export type PxMask = {
  w: number;
  h: number;
  on: Uint8Array;
  /** First column of each character (art px). */
  starts: number[];
  /** Exclusive end column of each character. */
  ends: number[];
  /** Height of the cap box (rows from top of ink to baseline). The wrapper uses this so descenders overflow. */
  capH: number;
  /** True when any CJK glyph is present (the cap box is then the full ink box). */
  cjk: boolean;
};

const CACHE = new Map<string, PxMask>();
let fontsOk = false;

const isCjk = (ch: string) => /[⺀-鿿＀-￯　-〿]/.test(ch);

const cvs = () => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  return c;
};

type Bmp = {w: number; h: number; on: Uint8Array; top: number};

/** Rasterise one glyph at the canvas pixel grid. `top` is the row of the glyph's top relative to the baseline. */
const rasterGlyph = (ctx: CanvasRenderingContext2D, ch: string, font: string, size: number, thr: number): Bmp => {
  const BL = 40;
  const X0 = 8;
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = `${size}px ${font}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.fillText(ch, X0, BL);
  const d = ctx.getImageData(0, 0, 64, 64).data;
  let x0 = 64;
  let x1 = -1;
  let y0 = 64;
  let y1 = -1;
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++)
      if (d[(y * 64 + x) * 4 + 3] >= thr) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return {w: 0, h: 0, on: new Uint8Array(0), top: 0};
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const on = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) on[y * w + x] = d[((y + y0) * 64 + x + x0) * 4 + 3] >= thr ? 1 : 0;
  return {w, h, on, top: y0 - BL};
};

const embolden = (b: Bmp, mode: number): Bmp => {
  if (mode <= 0 || b.w === 0) return b;
  const w = b.w + 1;
  const h = b.h + (mode >= 2 ? 1 : 0);
  const on = new Uint8Array(w * h);
  for (let y = 0; y < b.h; y++)
    for (let x = 0; x < b.w; x++)
      if (b.on[y * b.w + x]) {
        on[y * w + x] = 1;
        on[y * w + x + 1] = 1;
        if (mode >= 2) {
          on[(y + 1) * w + x] = 1;
          on[(y + 1) * w + x + 1] = 1;
        }
      }
  return {w, h, on, top: b.top};
};

export type MaskOpts = {bold: number; gap: number; cjkRows: number; caps: boolean};

export const buildMask = (text: string, o: MaskOpts): PxMask => {
  const c = cvs();
  const ctx = c.getContext('2d', {willReadFrequently: true})!;
  const chars = [...(o.caps ? text.toUpperCase() : text)];
  const hRef = embolden(rasterGlyph(ctx, 'H', PIXEL_FONT, 12, 128), o.bold);
  const capTop = hRef.top; // negative: rows above the baseline
  const capH = -capTop;
  let anyCjk = false;
  const glyphs: (Bmp | null)[] = chars.map((ch) => {
    if (ch === ' ') return null;
    if (isCjk(ch)) {
      anyCjk = true;
      if (o.cjkRows > 0) return rasterGlyph(ctx, ch, BLACK_FONT, o.cjkRows, 150);
      return embolden(rasterGlyph(ctx, ch, PIXEL_FONT, 12, 128), Math.min(o.bold, 1));
    }
    return embolden(rasterGlyph(ctx, ch, PIXEL_FONT, 12, 128), o.bold);
  });
  // Shared vertical frame: baseline row = -min(top). CJK glyphs are centred on the cap box instead of the baseline.
  const placed = glyphs.map((g, i) => {
    if (!g || g.w === 0) return {g, y: 0};
    if (isCjk(chars[i])) return {g, y: Math.round(capTop + capH / 2 - g.h / 2)};
    return {g, y: g.top};
  });
  let minY = 0;
  let maxY = 0;
  placed.forEach(({g, y}) => {
    if (!g || g.w === 0) return;
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + g.h);
  });
  if (!anyCjk) minY = Math.min(minY, capTop); // cap box top
  const spaceW = 4;
  let x = 0;
  const starts: number[] = [];
  const ends: number[] = [];
  const xs: number[] = [];
  chars.forEach((ch, i) => {
    const g = glyphs[i];
    starts.push(x);
    if (!g || g.w === 0) {
      xs.push(x);
      x += spaceW;
      ends.push(x);
      return;
    }
    xs.push(x);
    x += g.w + (i < chars.length - 1 ? o.gap : 0);
    ends.push(x);
  });
  const W = Math.max(1, x);
  const H = Math.max(1, maxY - minY);
  const on = new Uint8Array(W * H);
  placed.forEach(({g, y}, i) => {
    if (!g || g.w === 0) return;
    for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < g.w; xx++) if (g.on[yy * g.w + xx]) on[(y + yy - minY) * W + xs[i] + xx] = 1;
  });
  // The cap box starts at the top of the tallest cap glyph; the wrapper uses it for vertical centring.
  return {w: W, h: H, on, starts, ends, capH: anyCjk ? H : Math.min(H, capH), cjk: anyCjk};
};

const hexRgb = (h: string): number => {
  const hx = h.length === 4 ? `${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h.slice(1, 7);
  const n = parseInt(hx, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
};

export type PxPaint = {
  color: string;
  /** Colour of the top-lit edge row of each stroke. */
  hi?: string;
  /** Hard colour bands, top to bottom (e.g. gold titles). */
  bands?: string[];
  shadow: number;
  shadowColor: string;
  outline?: string | null;
  /** Per-row horizontal offset in art px (pixel misalignment effect). */
  rowShift?: (y: number) => number;
  /** Extra transparent margin on both sides for rowShift. */
  slack?: number;
  x0?: number;
  x1?: number;
};

/** Canvas size (art px) and ink origin for a given paint. */
export const paintGeometry = (m: PxMask, p: PxPaint) => {
  const x0 = p.x0 ?? 0;
  const x1 = p.x1 ?? m.w;
  const ol = p.outline ? 1 : 0;
  const slack = p.slack ?? 0;
  return {W: x1 - x0 + ol * 2 + p.shadow + slack * 2, H: m.h + ol * 2 + p.shadow, ox: ol + slack, oy: ol};
};

export const paintMask = (cv: HTMLCanvasElement, m: PxMask, p: PxPaint) => {
  const {W, H, ox, oy} = paintGeometry(m, p);
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
  const x0 = p.x0 ?? 0;
  const x1 = p.x1 ?? m.w;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const buf = new Uint32Array(img.data.buffer);
  const ol = p.outline ? 1 : 0;
  const sc = hexRgb(p.shadowColor);
  const oc = p.outline ? hexRgb(p.outline) : 0;
  const fc = hexRgb(p.color);
  const hi = p.hi ? hexRgb(p.hi) : 0;
  const bands = p.bands?.map(hexRgb);
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.on[y * m.w + x] === 1;
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c;
  };
  for (let y = 0; y < m.h; y++) {
    const dx = p.rowShift ? p.rowShift(y) : 0;
    for (let x = x0; x < x1; x++) {
      if (!at(x, y)) continue;
      const bx = x - x0 + ox + dx;
      const by = y + oy;
      if (p.shadow > 0) for (let j = -ol; j <= ol; j++) for (let i = -ol; i <= ol; i++) put(bx + i + p.shadow, by + j + p.shadow, sc);
    }
  }
  if (p.outline)
    for (let y = 0; y < m.h; y++) {
      const dx = p.rowShift ? p.rowShift(y) : 0;
      for (let x = x0; x < x1; x++) {
        if (!at(x, y)) continue;
        for (let j = -ol; j <= ol; j++) for (let i = -ol; i <= ol; i++) put(x - x0 + ox + dx + i, y + oy + j, oc);
      }
    }
  for (let y = 0; y < m.h; y++) {
    const dx = p.rowShift ? p.rowShift(y) : 0;
    for (let x = x0; x < x1; x++) {
      if (!at(x, y)) continue;
      let c = fc;
      if (bands) c = bands[Math.min(bands.length - 1, Math.floor((y / m.h) * bands.length))];
      if (hi && !at(x, y - 1)) c = hi;
      put(x - x0 + ox + dx, y + oy, c);
    }
  }
  ctx.putImageData(img, 0, 0);
};

/** Returns the mask once fonts are ready (synchronously on every later call). Holds the render until then. */
export const useMask = (text: string, o: MaskOpts): PxMask | null => {
  const key = `${text}|${o.bold}|${o.gap}|${o.cjkRows}|${o.caps ? 1 : 0}`;
  const [, force] = useReducer((n: number) => n + 1, 0);
  let hit = CACHE.get(key) ?? null;
  if (!hit && fontsOk && typeof document !== 'undefined') {
    hit = buildMask(text, o);
    CACHE.set(key, hit);
  }
  useEffect(() => {
    if (hit || fontsOk) return;
    const h = delayRender(`mcd text ${key}`);
    fontsReady()
      .then(() => Promise.all([document.fonts.load(`12px ${PIXEL_FONT}`), document.fonts.load(`16px ${BLACK_FONT}`, text)]))
      .then(() => {
        fontsOk = true;
        force();
        continueRender(h);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return hit;
};

export type McdTextOpts = {
  /** Screen pixels per art pixel (integer). Latin caps are ~9 art px tall: px 4 -> 36px caps. Default 4. */
  px?: number;
  color?: string;
  /** Top-lit edge row colour. */
  hi?: string;
  /** Hard colour bands top to bottom. */
  bands?: string[];
  /** Hard shadow offset in art px toward the bottom-right. Default 1, 0 = none. */
  shadow?: number;
  shadowColor?: string;
  /** Outline colour (1 art px) or false. */
  outline?: string | false;
  /** 0 none, 1 horizontal embolden, 2 both directions (default, closest to the game's 2px strokes). */
  bold?: 0 | 1 | 2;
  /** Art px between glyphs. Default 2. */
  gap?: number;
  /** CJK glyph grid rows (Noto Sans SC Black thresholded). Default 16; 0 = Fusion Pixel 12 instead. */
  cjkRows?: number;
  /** Upper-case Latin (default true). */
  caps?: boolean;
  rowShift?: (y: number) => number;
  slack?: number;
  opacity?: number;
  style?: CSSProperties;
};

export const SHADOW = '#050202';

const DEFAULTS = {px: 4, color: '#FFFFFF', shadow: 1, shadowColor: SHADOW, bold: 2, gap: 2, cjkRows: 16, caps: true} as const;

const maskOpts = (o: McdTextOpts): MaskOpts => ({bold: o.bold ?? DEFAULTS.bold, gap: o.gap ?? DEFAULTS.gap, cjkRows: o.cjkRows ?? DEFAULTS.cjkRows, caps: o.caps ?? DEFAULTS.caps});

const paintOf = (o: McdTextOpts, extra: Partial<PxPaint> = {}): PxPaint => ({
  color: o.color ?? DEFAULTS.color,
  hi: o.hi,
  bands: o.bands,
  shadow: o.shadow ?? DEFAULTS.shadow,
  shadowColor: o.shadowColor ?? DEFAULTS.shadowColor,
  outline: o.outline || null,
  rowShift: o.rowShift,
  slack: o.slack,
  ...extra,
});

/** Measured size (screen px) of a string, for layout code that needs it before painting. Null until fonts are ready. */
export const useTextSize = (text: string, o: McdTextOpts = {}): {w: number; h: number} | null => {
  const m = useMask(text, maskOpts(o));
  if (!m) return null;
  const px = o.px ?? DEFAULTS.px;
  return {w: m.w * px, h: m.capH * px};
};

/**
 * Heavy pixel display text with a hard bottom-right shadow (the Dungeons title/number face).
 * The box is the tight ink box, so `display:flex; justify-content:center` centres it exactly.
 */
export const PxText: FC<{text: string | number} & McdTextOpts> = ({text, ...o}) => {
  const m = useMask(String(text), maskOpts(o));
  const ref = useRef<HTMLCanvasElement>(null);
  const px = o.px ?? DEFAULTS.px;
  const p = paintOf(o);
  useLayoutEffect(() => {
    if (ref.current && m) paintMask(ref.current, m, p);
  });
  if (!m) return <span style={{display: 'inline-block', width: 1, height: 1}} />;
  const g = paintGeometry(m, p);
  return (
    <span style={{position: 'relative', display: 'inline-block', width: m.w * px, height: m.capH * px, flex: 'none', verticalAlign: 'top', opacity: o.opacity ?? 1, ...o.style}}>
      <canvas ref={ref} width={g.W} height={g.H} style={{position: 'absolute', left: -g.ox * px, top: -g.oy * px, width: g.W * px, height: g.H * px, imageRendering: 'pixelated'}} />
    </span>
  );
};

/** Same text, one canvas per character, so each letter can move on its own (`glyph(i, n)` returns its CSS). */
export const PxChars: FC<{text: string; glyph: (i: number, n: number) => CSSProperties} & McdTextOpts> = ({text, glyph, ...o}) => {
  const m = useMask(text, maskOpts(o));
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  const px = o.px ?? DEFAULTS.px;
  useLayoutEffect(() => {
    if (!m) return;
    m.starts.forEach((s, i) => {
      const cv = refs.current[i];
      if (cv && m.ends[i] > s) paintMask(cv, m, paintOf(o, {x0: s, x1: m.ends[i]}));
    });
  });
  if (!m) return <span style={{display: 'inline-block', width: 1, height: 1}} />;
  const n = m.starts.length;
  return (
    <span style={{position: 'relative', display: 'inline-block', width: m.w * px, height: m.capH * px, flex: 'none', verticalAlign: 'top', ...o.style}}>
      {m.starts.map((s, i) => {
        const p = paintOf(o, {x0: s, x1: m.ends[i]});
        const g = paintGeometry(m, p);
        return (
          <canvas
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            width={g.W}
            height={g.H}
            style={{position: 'absolute', left: (s - g.ox) * px, top: -g.oy * px, width: g.W * px, height: g.H * px, imageRendering: 'pixelated', transformOrigin: `${((m.ends[i] - s) / 2 + g.ox) * px}px 60%`, ...glyph(i, n)}}
          />
        );
      })}
    </span>
  );
};
