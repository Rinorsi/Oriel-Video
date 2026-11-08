import {useLayoutEffect, useRef, type CSSProperties, type FC} from 'react';
import {fontsReady} from '../mc/fonts';
import {mulberry32} from '../mc/theme';
import {useAssets} from './LowRes';

/**
 * Chunky block-letter titles. A heavy font is rasterised on a coarse grid (one cell = one "pixel"),
 * then every cell is drawn like a small block: banded face colours, a light top/left bevel and a dark
 * bottom edge, a dark outline, and a stepped extrusion underneath, like the Minecraft logo.
 */

export type BlockStyle = {
  face: string[]; // top-to-bottom colour bands
  bevelLight: string;
  bevelDark: string;
  extrusion: string[]; // nearest the face first
  outline: string;
  shadow?: string;
  speckle?: string; // subtle texture dots on the face
};

/** Cell mask of a rasterised line; `starts` are each character's first column (for per-glyph animation). */
type Mask = {w: number; h: number; on: Uint8Array; starts: number[]};

/** Empty cells kept around every drawn glyph canvas (room for the outline and shadow). */
const PAD = 2;

const rasterise = (text: string, font: string, rows: number, spacing: number): Mask => {
  const size = Math.round(rows / 0.86);
  const c = document.createElement('canvas');
  c.width = Math.ceil(text.length * (size + spacing) + size);
  c.height = size * 2;
  const ctx = c.getContext('2d', {willReadFrequently: true})!;
  ctx.font = `${size}px ${font}`;
  ctx.letterSpacing = `${spacing}px`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, size / 2, c.height / 2);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width;
  let x1 = 0;
  let y0 = c.height;
  let y1 = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (d[(y * c.width + x) * 4 + 3] > 120) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const starts = [...text].map((_, i) => Math.max(0, Math.round(size / 2 + ctx.measureText(text.slice(0, i)).width - x0 - spacing / 2)));
  const on = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) on[y * w + x] = d[((y + y0) * c.width + x + x0) * 4 + 3] > 120 ? 1 : 0;
  return {w, h, on, starts};
};

const drawBlocks = (canvas: HTMLCanvasElement, m: Pick<Mask, 'w' | 'h' | 'on'>, cell: number, depth: number, st: BlockStyle) => {
  const pad = PAD;
  const W = (m.w + pad * 2) * cell;
  const H = (m.h + depth + pad * 2) * cell;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.on[y * m.w + x] === 1;
  const each = (fn: (x: number, y: number) => void) => {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.on[y * m.w + x]) fn(x, y);
  };
  const px = (x: number, y: number) => [(x + pad) * cell, (y + pad) * cell] as const;

  if (st.shadow) {
    ctx.fillStyle = st.shadow;
    each((x, y) => {
      const [a, b] = px(x + 1, y + depth + 1);
      ctx.fillRect(a - cell, b - cell, cell * 3, cell * 3);
    });
  }
  // Outline around the face and the whole extrusion.
  ctx.fillStyle = st.outline;
  for (let d = depth; d >= 0; d--)
    each((x, y) => {
      const [a, b] = px(x, y + d);
      ctx.fillRect(a - cell, b - cell, cell * 3, cell * 3);
    });
  // Extrusion, far to near.
  for (let d = depth; d >= 1; d--) {
    ctx.fillStyle = st.extrusion[Math.min(st.extrusion.length - 1, d - 1)];
    each((x, y) => {
      const [a, b] = px(x, y + d);
      ctx.fillRect(a, b, cell, cell);
    });
  }
  // Face in hard colour bands, with per-cell bevels where the glyph has an edge.
  const bev = Math.max(1, Math.round(cell / 4));
  const rnd = mulberry32(5);
  each((x, y) => {
    const [a, b] = px(x, y);
    ctx.fillStyle = st.face[Math.min(st.face.length - 1, Math.floor((y / m.h) * st.face.length))];
    ctx.fillRect(a, b, cell, cell);
    if (st.speckle && rnd() < 0.12) {
      ctx.fillStyle = st.speckle;
      ctx.fillRect(a + bev, b + bev, bev, bev);
    }
    ctx.fillStyle = st.bevelLight;
    if (!at(x, y - 1)) ctx.fillRect(a, b, cell, bev);
    if (!at(x - 1, y)) ctx.fillRect(a, b, bev, cell);
    ctx.fillStyle = st.bevelDark;
    if (!at(x, y + 1)) ctx.fillRect(a, b + cell - bev, cell, bev);
    if (!at(x + 1, y)) ctx.fillRect(a + cell - bev, b, bev, cell);
  });
};

export const BlockText: FC<{text: string; font: string; rows: number; cell: number; depth: number; spacing?: number; style: BlockStyle; css?: CSSProperties}> = ({text, font, rows, cell, depth, spacing = 2, style, css}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const mask = useAssets<Mask>(`blocktext:${font}:${rows}:${spacing}:${text}`, async () => {
    await fontsReady();
    await document.fonts.load(`${rows}px ${font}`, text);
    return rasterise(text, font, rows, spacing);
  });
  useLayoutEffect(() => {
    if (ref.current && mask) drawBlocks(ref.current, mask, cell, depth, style);
  });
  return <canvas ref={ref} style={{display: 'block', imageRendering: 'pixelated', ...css}} />;
};

/** Columns [a, b) of a mask as its own mask. */
const slice = (m: Mask, a: number, b: number) => {
  const w = b - a;
  const on = new Uint8Array(w * m.h);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < w; x++) on[y * w + x] = m.on[y * m.w + x + a];
  return {w, h: m.h, on};
};


/**
 * The same block letters, one canvas per character, laid out exactly like BlockText.
 * `glyph(i)` returns the style (transform, opacity) for character i, so titles can animate per letter.
 */
export const BlockChars: FC<{text: string; font: string; rows: number; cell: number; depth: number; spacing?: number; style: BlockStyle; glyph: (i: number) => CSSProperties}> = ({text, font, rows, cell, depth, spacing = 2, style, glyph}) => {
  const mask = useAssets<Mask>(`blocktext:${font}:${rows}:${spacing}:${text}`, async () => {
    await fontsReady();
    await document.fonts.load(`${rows}px ${font}`, text);
    return rasterise(text, font, rows, spacing);
  });
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useLayoutEffect(() => {
    if (!mask) return;
    mask.starts.forEach((a, i) => {
      const b = i + 1 < mask.starts.length ? mask.starts[i + 1] : mask.w;
      const c = refs.current[i];
      if (c && b > a) drawBlocks(c, slice(mask, a, b), cell, depth, style);
    });
  });
  if (!mask) return null;
  const W = (mask.w + PAD * 2) * cell;
  const H = (mask.h + depth + PAD * 2) * cell;
  return (
    <div style={{position: 'relative', width: W, height: H}}>
      {[...text].map((ch, i) => (
        <canvas key={i} ref={(el) => {
            refs.current[i] = el;
          }} style={{position: 'absolute', left: mask.starts[i] * cell, top: 0, imageRendering: 'pixelated', transformOrigin: '50% 60%', ...glyph(i)}} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- presets

/** Gold-block letters with a deep amber extrusion: the warm complement to a blue sky. */
export const GOLD_BLOCK: BlockStyle = {
  face: ['#fff2a8', '#ffd84d', '#ffc531', '#f5a623'],
  bevelLight: '#fffbe3',
  bevelDark: '#d98a14',
  extrusion: ['#d07614', '#b25f0f', '#934b0b', '#773b08'],
  outline: '#3b1e06',
  shadow: 'rgba(25,60,120,0.22)',
  speckle: 'rgba(255,255,255,0.55)',
};

/** White letters with an orange extrusion. */
export const SNOW_BLOCK: BlockStyle = {
  face: ['#ffffff', '#f6f8fb', '#e9eef5', '#dbe3ee'],
  bevelLight: '#ffffff',
  bevelDark: '#c2cddb',
  extrusion: ['#f39a2b', '#d9761c', '#b85d12', '#954a0e'],
  outline: '#43200a',
  shadow: 'rgba(25,60,120,0.22)',
};

/** White letters with a deep cobalt extrusion and navy outline (blue-white). */
export const SKY_BLOCK: BlockStyle = {
  face: ['#ffffff', '#f7faff', '#ecf3ff', '#dde9fb'],
  bevelLight: '#ffffff',
  bevelDark: '#bcd0ee',
  extrusion: ['#3a7be6', '#2b63cc', '#204fac', '#173d8a'],
  outline: '#0c1f4d',
  shadow: 'rgba(12,40,100,0.22)',
};
