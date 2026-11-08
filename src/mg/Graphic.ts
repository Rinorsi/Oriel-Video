import {item, block, tex} from '../mc/assets';
import {mulberry32} from '../mc/theme';
import {LH, LW, loadImage, tint} from './LowRes';

/**
 * 2D motion-graphics vocabulary on the low-res pixel canvas (1 unit = 4 screen px): pixel halftone,
 * square halos (after the vanilla square sun), stepped rays, starbursts, speed lines, plus-shaped
 * stars, enchanting-table glyphs and outlined sprites. Everything lands on the pixel grid.
 */

export const PAL = {
  ink: '#0c0a24',
  night: '#19124a',
  violet: '#3d2580',
  plum: '#6a2c8c',
  magenta: '#c63f86',
  coral: '#ff7468',
  amber: '#ffc04a',
  cream: '#fff1dc',
  mint: '#5ff0c8',
} as const;

export type GfxAssets = {
  sga: HTMLCanvasElement[];
  sprites: Record<string, HTMLImageElement>;
  outlines: Map<string, HTMLCanvasElement>;
};

const SGA = 'abcdefghijklmnopqrstuvwxyz';

export const loadGfx = async (spriteIds: Record<string, string>): Promise<GfxAssets> => {
  const sgaImgs = await Promise.all([...SGA].map((c) => loadImage(tex(`particle/sga_${c}.png`))));
  const entries = await Promise.all(Object.entries(spriteIds).map(async ([k, src]) => [k, await loadImage(src)] as const));
  return {sga: sgaImgs.map((i) => tint(i, PAL.cream)), sprites: Object.fromEntries(entries), outlines: new Map()};
};

export const spriteSrc = {item, block, tex};

export const gradient = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LW, LH);
};

export const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

export const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Square-dot halftone: `size(x, y)` returns 0..3 (pixels) for each cell of a `step` grid. */
export const halftone = (ctx: CanvasRenderingContext2D, color: string, step: number, size: (x: number, y: number) => number) => {
  ctx.fillStyle = color;
  for (let y = 0; y < LH; y += step)
    for (let x = 0; x < LW; x += step) {
      const s = Math.round(Math.max(0, Math.min(step - 1, size(x, y))));
      if (s > 0) ctx.fillRect(x + Math.floor((step - s) / 2), y + Math.floor((step - s) / 2), s, s);
    }
};

/** Concentric square outlines, like the halo around the vanilla sun. `dash` skips segments on some rings. */
export const squareHalos = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rings: number, first: number, gap: number, color: string, alpha: (i: number) => number, dashEvery = 0) => {
  for (let i = 0; i < rings; i++) {
    const h = Math.round(first / 2 + i * gap);
    ctx.fillStyle = hexA(color, alpha(i));
    const x0 = Math.round(cx - h);
    const y0 = Math.round(cy - h);
    const s = h * 2;
    if (dashEvery && i % dashEvery === dashEvery - 1) {
      for (let k = 0; k < s; k += 6) {
        ctx.fillRect(x0 + k, y0, 3, 1);
        ctx.fillRect(x0 + k, y0 + s, 3, 1);
        ctx.fillRect(x0, y0 + k, 1, 3);
        ctx.fillRect(x0 + s, y0 + k, 1, 3);
      }
    } else {
      ctx.fillRect(x0, y0, s, 1);
      ctx.fillRect(x0, y0 + s, s + 1, 1);
      ctx.fillRect(x0, y0, 1, s);
      ctx.fillRect(x0 + s, y0, 1, s);
    }
  }
};

export const rays = (ctx: CanvasRenderingContext2D, cx: number, cy: number, n: number, rot: number, width: number, color: string) => {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2;
    const a1 = a0 + ((Math.PI * 2) / n) * width;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * LW * 1.2, cy + Math.sin(a0) * LW * 1.2);
    ctx.lineTo(cx + Math.cos(a1) * LW * 1.2, cy + Math.sin(a1) * LW * 1.2);
    ctx.closePath();
    ctx.fill();
  }
};

/** Jagged comic-style starburst. */
export const starburst = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r0: number, r1: number, points: number, seed: number, color: string, squash = 1) => {
  const rnd = mulberry32(seed);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? r1 * (0.75 + rnd() * 0.25) : r0 * (0.8 + rnd() * 0.3);
    const x = Math.round(cx + Math.cos(a) * r);
    const y = Math.round(cy + Math.sin(a) * r * squash);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
};

/** Plus-shaped pixel stars; `twinkle` (frame) makes some blink. */
export const plusStars = (ctx: CanvasRenderingContext2D, seed: number, count: number, area: [number, number, number, number], color: string, twinkle = 0) => {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.round(area[0] + rnd() * area[2]);
    const y = Math.round(area[1] + rnd() * area[3]);
    const big = rnd() < 0.3;
    const ph = Math.floor(rnd() * 20);
    if ((twinkle + ph) % 20 > 17) continue;
    ctx.fillStyle = hexA(color, 0.35 + rnd() * 0.65);
    ctx.fillRect(x, y, 1, 1);
    if (big) {
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    }
  }
};

/** Enchanting-table glyphs scattered along an arc. */
export const glyphArc = (ctx: CanvasRenderingContext2D, a: GfxAssets, cx: number, cy: number, r: number, from: number, to: number, count: number, seed: number, alpha: number) => {
  const rnd = mulberry32(seed);
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const t = from + (to - from) * (i / Math.max(1, count - 1));
    const g = a.sga[Math.floor(rnd() * a.sga.length)];
    ctx.drawImage(g, Math.round(cx + Math.cos(t) * r - 4), Math.round(cy + Math.sin(t) * r - 4));
  }
  ctx.globalAlpha = 1;
};

/** Draw a sprite at an integer scale with a 1-pixel outline and an optional hard drop shadow. */
export const sprite = (ctx: CanvasRenderingContext2D, a: GfxAssets, key: string, cx: number, cy: number, scale: number, o: {outline?: string; shadow?: string; rot?: number; flash?: number; color?: string; alpha?: number} = {}) => {
  const img = a.sprites[key];
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (o.rot) ctx.rotate(o.rot);
  const draw = (src: CanvasImageSource, dx: number, dy: number) => ctx.drawImage(src, Math.round(-w / 2 + dx), Math.round(-h / 2 + dy), w, h);
  const solid = (color: string) => {
    const k = `${key}|${color}`;
    if (!a.outlines.has(k)) a.outlines.set(k, tint(img, color));
    return a.outlines.get(k)!;
  };
  if (o.shadow) draw(solid(o.shadow), scale, scale);
  if (o.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) draw(solid(o.outline), dx, dy);
  ctx.globalAlpha = o.alpha ?? 1;
  draw(o.color ? solid(o.color) : img, 0, 0);
  ctx.globalAlpha = 1;
  if (o.flash) {
    ctx.globalAlpha = o.flash;
    draw(solid('#ffffff'), 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/** Stone-coloured debris chunks with dark outlines around a point. */
export const debris = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, count: number, seed: number) => {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const x = Math.round(cx + Math.cos(a) * rx * r);
    const y = Math.round(cy + Math.sin(a) * ry * r);
    const s = 1 + Math.floor(rnd() * 4);
    const v = 120 + Math.floor(rnd() * 110);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 1, y - 1, s + 2, s + 2);
    ctx.fillStyle = `rgb(${v},${v - 6},${v - 10})`;
    ctx.fillRect(x, y, s, s);
    if (s > 2) {
      ctx.fillStyle = `rgba(255,255,255,0.35)`;
      ctx.fillRect(x, y, s, 1);
    }
  }
};

/** Diagonal hazard stripes inside a rotated band. */
export const hazardBand = (ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, rot: number, c1: string, c2: string) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = c1;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();
  ctx.fillStyle = c2;
  for (let x = -w / 2 - h; x < w / 2 + h; x += h * 1.2) {
    ctx.beginPath();
    ctx.moveTo(x, h / 2);
    ctx.lineTo(x + h * 0.6, h / 2);
    ctx.lineTo(x + h * 0.6 + h, -h / 2);
    ctx.lineTo(x + h, -h / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

export const speedLines = (ctx: CanvasRenderingContext2D, x0: number, x1: number, yTop: number, yBottom: number, count: number, seed: number, color: string) => {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.round(x0 + rnd() * (x1 - x0));
    const len = Math.round((yBottom - yTop) * (0.3 + rnd() * 0.7));
    const y = Math.round(yBottom - len - rnd() * 10);
    ctx.fillStyle = hexA(color, 0.25 + rnd() * 0.6);
    ctx.fillRect(x, y, rnd() < 0.2 ? 2 : 1, len);
  }
};
