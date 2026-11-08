import {tex} from '../mc/assets';
import {EASE, clamp01, mulberry32} from '../mc/theme';
import {LH, LW, loadImage, tint} from './LowRes';

/**
 * Pixel-art scenery drawn on the low-res canvas: dusk and night skies with the vanilla square sun,
 * block clouds (from the game's own clouds.png), stepped block hills and pixel dust.
 * All coordinates are in low-res pixels (1 = 4 screen pixels).
 */

export const DUSK = {
  skyTop: '#1d0d3d',
  skyMid: '#4a1c6b',
  skyLow: '#b2386c',
  horizon: '#ff8a3d',
  hillFar: '#7a2f72',
  hillMid: '#3b1652',
  hillNear: '#170a27',
  nightTop: '#07040f',
  nightLow: '#2b0f3c',
  gold: '#FFAA00',
  yellow: '#FFFF55',
} as const;

export type SceneryAssets = {
  sun: HTMLImageElement;
  cloudsLit: HTMLCanvasElement;
  cloudsDark: HTMLCanvasElement;
};

export const loadScenery = async (): Promise<SceneryAssets> => {
  const [sun, clouds] = await Promise.all([loadImage(tex('environment/celestial/sun.png')), loadImage(tex('environment/clouds.png'))]);
  // clouds.png is a top-down map; a 256x20 strip of it reads as a row of flat block clouds.
  return {sun, cloudsLit: tint(clouds, '#f7a3c0', 0, 96, 256, 6), cloudsDark: tint(clouds, '#2a1240', 0, 40, 256, 6)};
};

type Hills = {cell: number; base: number; heights: number[]; trees: [number, number, number][]};

/** Stepped hill heights per column plus tree positions (column, trunk height, crown width). */
export const makeHills = (seed: number, base: number, amp: number, cell: number, trees = 0, width = LW + 200): Hills => {
  const rnd = mulberry32(seed);
  const cols = Math.ceil(width / cell);
  const heights: number[] = [];
  let h = amp * 0.5;
  for (let c = 0; c < cols; c++) {
    if (rnd() < 0.45) h += (rnd() - 0.5) * amp * 0.5;
    h = Math.max(amp * 0.15, Math.min(amp, h));
    heights.push(Math.round(h / cell) * cell);
  }
  const t: [number, number, number][] = [];
  for (let i = 0; i < trees; i++) t.push([4 + Math.floor(rnd() * (cols - 8)), 2 + Math.floor(rnd() * 2), rnd() < 0.5 ? 3 : 5]);
  return {cell, base, heights, trees: t};
};

export const drawHills = (ctx: CanvasRenderingContext2D, hills: Hills, color: string, scrollX: number, extra?: (x0: number) => void) => {
  const {cell, base, heights, trees} = hills;
  const x0 = -Math.round(scrollX) - 100;
  ctx.fillStyle = color;
  heights.forEach((h, c) => ctx.fillRect(x0 + c * cell, base - h, cell, LH - base + h + 40));
  for (const [c, trunk, w] of trees) {
    const top = base - heights[c];
    const x = x0 + c * cell;
    ctx.fillRect(x, top - trunk * cell, cell, trunk * cell);
    ctx.fillRect(x - ((w - 1) / 2) * cell, top - (trunk + 2) * cell, w * cell, 2 * cell);
    ctx.fillRect(x - cell, top - (trunk + 3) * cell, 3 * cell, cell);
  }
  extra?.(x0);
};

/** Creeper silhouette, feet at (x, y), one model pixel = `u` low-res pixels. */
export const drawCreeper = (ctx: CanvasRenderingContext2D, x: number, y: number, u: number) => {
  ctx.fillRect(x - 4 * u, y - 26 * u, 8 * u, 8 * u);
  ctx.fillRect(x - 2 * u, y - 18 * u, 4 * u, 12 * u);
  ctx.fillRect(x - 4 * u, y - 6 * u, 3 * u, 6 * u);
  ctx.fillRect(x + 1 * u, y - 6 * u, 3 * u, 6 * u);
};

/** Tiled scrolling cloud strip drawn at an integer scale. */
export const drawClouds = (ctx: CanvasRenderingContext2D, strip: HTMLCanvasElement, y: number, scale: number, scroll: number, alpha: number) => {
  const w = strip.width * scale;
  const off = -(((Math.round(scroll) % w) + w) % w);
  ctx.globalAlpha = alpha;
  for (let x = off; x < LW; x += w) ctx.drawImage(strip, x, y, w, strip.height * scale);
  ctx.globalAlpha = 1;
};

/** Rising pixel dust; one-pixel squares that blink rather than glow. */
export const drawDust = (ctx: CanvasRenderingContext2D, f: number, seed: number, count: number, speed = 1, colors: string[] = [DUSK.yellow, DUSK.gold]) => {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x0 = rnd() * LW;
    const y0 = rnd();
    const v = (0.15 + rnd() * 0.4) * speed;
    const ph = rnd() * 40;
    const c = colors[Math.floor(rnd() * colors.length)];
    const big = rnd() < 0.25;
    const travel = LH + 20;
    const y = Math.round(LH - ((y0 * travel + f * v) % travel));
    const x = Math.round(x0 + Math.sin((f + ph) / 25) * 4);
    if (Math.floor((f + ph) / 6) % 5 === 0) continue;
    ctx.fillStyle = c;
    ctx.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
  }
};

/** Square twinkling stars. */
export const drawStars = (ctx: CanvasRenderingContext2D, f: number, seed: number, count: number, maxY: number) => {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * LW);
    const y = Math.floor(rnd() * maxY);
    const period = 10 + Math.floor(rnd() * 30);
    const ph = Math.floor(rnd() * period);
    const on = (f + ph) % period;
    const bright = rnd() < 0.15;
    ctx.fillStyle = on < 2 ? '#ffffff' : bright ? '#fff3c4' : 'rgba(255,240,220,0.55)';
    if (on > period - 3) continue;
    ctx.fillRect(x, y, bright && on < 2 ? 2 : 1, bright && on < 2 ? 2 : 1);
  }
};

/** Dusk sky: gradient, vanilla sun (additive), lit clouds. `zoom` dives the camera into the sun. */
export const drawDuskSky = (ctx: CanvasRenderingContext2D, f: number, a: SceneryAssets, o: {sunX: number; sunY: number; horizon: number; zoom?: number}) => {
  const z = o.zoom ?? 1;
  ctx.save();
  ctx.setTransform(z, 0, 0, z, o.sunX * (1 - z), o.sunY * (1 - z));
  const g = ctx.createLinearGradient(0, 0, 0, o.horizon);
  g.addColorStop(0, DUSK.skyTop);
  g.addColorStop(0.45, DUSK.skyMid);
  g.addColorStop(0.8, DUSK.skyLow);
  g.addColorStop(1, DUSK.horizon);
  ctx.fillStyle = g;
  ctx.fillRect(-LW, -LH, LW * 3, o.horizon + LH);
  ctx.fillStyle = DUSK.horizon;
  ctx.fillRect(-LW, o.horizon, LW * 3, LH * 2);
  // The vanilla sun texture is a bright square on black: draw it additively, 4x.
  ctx.globalCompositeOperation = 'lighter';
  const s = 32 * 4;
  ctx.drawImage(a.sun, Math.round(o.sunX - s / 2), Math.round(o.sunY - s / 2), s, s);
  ctx.globalCompositeOperation = 'source-over';
  drawClouds(ctx, a.cloudsLit, 64, 5, f * 0.2 + 300, 0.22);
  drawClouds(ctx, a.cloudsLit, 4, 9, f * 0.45, 0.4);
  ctx.restore();
};

/** Night sky for the logo stage. `glow` lights the centre, `pull` dims it during the collapse. */
export const drawNightSky = (ctx: CanvasRenderingContext2D, f: number, a: SceneryAssets, o: {glow: number; pull: number; warm: number}) => {
  const g = ctx.createLinearGradient(0, 0, 0, LH);
  g.addColorStop(0, DUSK.nightTop);
  g.addColorStop(1, DUSK.nightLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LW, LH);
  const r = ctx.createRadialGradient(LW / 2, LH * 0.44, 4, LW / 2, LH * 0.44, LW * 0.55);
  r.addColorStop(0, `rgba(150,60,170,${0.45 * o.glow * (1 - o.pull * 0.7)})`);
  r.addColorStop(1, 'rgba(150,60,170,0)');
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, LW, LH);
  if (o.warm > 0) {
    const w = ctx.createRadialGradient(LW / 2, LH * 0.44, 4, LW / 2, LH * 0.44, LW * 0.45);
    w.addColorStop(0, `rgba(255,150,70,${0.35 * o.warm})`);
    w.addColorStop(1, 'rgba(255,150,70,0)');
    ctx.fillStyle = w;
    ctx.fillRect(0, 0, LW, LH);
  }
  drawStars(ctx, f, 99, 90, LH * 0.75);
  drawClouds(ctx, a.cloudsDark, 0, 9, f * 0.3, 0.75);
};

/** Pixel god rays: hard-edged wedges from a point (they pixelate when the canvas is scaled up). */
export const drawRays = (ctx: CanvasRenderingContext2D, cx: number, cy: number, f: number, alpha: number, rays = 14) => {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(255,190,110,${alpha})`;
  const R = LW;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2 + f * 0.006;
    const a1 = a0 + (Math.PI * 2) / rays / 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
    ctx.closePath();
    ctx.fill();
  }
};

export const stepEase = (f: number, a: number, b: number, ease = EASE.out) => ease(clamp01((f - a) / (b - a)));
