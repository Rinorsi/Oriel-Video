import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {glow, hexA, squareHalos} from '../../../mg/Graphic';
import {LowRes} from '../../../mg/LowRes';
import {mulberry32} from '../../../mc/theme';
import {H, W, bands, hash, lerp, mixHex, mod, motes, shade, smooth, stripFrame, tile, useDim, type DimAssets} from './kit';

/**
 * The three dimension backdrops, drawn on the 480x270 low-res canvas (pixel-crisp):
 *   OverworldCanvas : sky with a day/night cycle (`tod`), sun + moon, blocky clouds, stepped hills with trees, textured grass ground
 *   NetherCanvas    : red haze, fortress silhouettes, lava lake + falls, netherrack cave ceiling, glowstone, ash and embers
 *   EndCanvas       : starry void, nebula glow, floating end-stone island, obsidian pillars with crystals, endermen, a dragon
 * All motion derives from the frame number; nothing is random at render time.
 */

const offs: HTMLCanvasElement[] = [];
const getOff = (i: number) => {
  if (!offs[i]) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    offs[i] = c;
  }
  const x = offs[i].getContext('2d')!;
  x.imageSmoothingEnabled = false;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, W, H);
  return offs[i];
};

/** Value noise in 0..1, smooth between hashed lattice points. */
const vn = (seed: number, u: number) => {
  const i = Math.floor(u);
  const t = u - i;
  const s = t * t * (3 - 2 * t);
  return lerp(hash(seed, i), hash(seed, i + 1), s);
};
const hillH = (seed: number, x: number, cell: number, amp: number) => {
  const xx = Math.floor(x / cell) * cell;
  return Math.round(amp * (0.55 * vn(seed, xx / 70) + 0.3 * vn(seed + 1, xx / 27) + 0.15 * vn(seed + 2, xx / 10)));
};

// ================================================================ OVERWORLD

export type OverOpts = {
  f?: number;
  /** Day cycle 0..1: 0 sunrise (sun on the left horizon), .25 noon, .5 sunset, .75 midnight. */
  tod?: number;
  /** Camera scroll in units (parallax). */
  scroll?: number;
  groundY?: number;
  /** Skin-pixel scale of ground textures (units per texel). */
  ps?: number;
  cherry?: boolean;
  /** Draw big framing trees at the left/right edges. */
  frame?: boolean;
  /** 0..1 lights out (extra dark, for the "coming out of darkness" intro). */
  dark?: number;
  /** Grass-line flowers and tufts. */
  decor?: boolean;
  /** Hide the sun/moon halos (for plain backdrops). */
  noGlow?: boolean;
  /** A nether portal standing on the grass: x = centre in units. */
  portal?: {x: number; bs?: number};
};

const SK = {
  night: ['#050a1c', '#17285a'],
  dawn: ['#4a68c0', '#ff9c66'],
  noon: ['#2f7fe0', '#bfe6ff'],
} as const;

/** Sun centre in low-res units for a day-cycle value. */
export const sunPos = (tod: number, gy = 200) => {
  const a = tod * Math.PI * 2;
  const horizon = gy - 14;
  return {x: 240 - Math.cos(a) * 250, y: horizon - Math.sin(a) * (horizon - 24)};
};

export const skyColors = (e: number) => {
  const top = mixHex(mixHex(SK.night[0], SK.dawn[0], smooth(-0.25, 0, e)), SK.noon[0], smooth(0, 0.5, e));
  const bot = mixHex(mixHex(SK.night[1], SK.dawn[1], smooth(-0.25, 0, e)), SK.noon[1], smooth(0, 0.5, e));
  return {top, bot};
};

const tree = (ctx: CanvasRenderingContext2D, x: number, y: number, h: number, pal: [string, string, string], trunk: [string, string]) => {
  const tw = 4;
  ctx.fillStyle = trunk[0];
  ctx.fillRect(x - 2, y - h, tw, h);
  ctx.fillStyle = trunk[1];
  ctx.fillRect(x - 2, y - h, 1, h);
  const rows: [number, number][] = [
    [18, 7],
    [14, 6],
    [8, 5],
  ];
  let top = y - h + 4;
  for (const [w, hh] of rows) {
    top -= hh - 1;
    ctx.fillStyle = pal[1];
    ctx.fillRect(x - w / 2, top, w, hh);
    ctx.fillStyle = pal[0];
    ctx.fillRect(x - w / 2, top, w, 1);
    ctx.fillRect(x - w / 2, top, 2, hh);
    ctx.fillStyle = pal[2];
    ctx.fillRect(x - w / 2, top + hh - 2, w, 2);
    ctx.fillRect(x + w / 2 - 2, top, 2, hh);
  }
};

const cloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string, sh: string) => {
  const t = 8;
  ctx.fillStyle = sh;
  ctx.fillRect(x, y + 3, w, t);
  ctx.fillRect(x + 6, y - 2, w - 18, t);
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, t);
  ctx.fillRect(x + 6, y - 5, w - 18, t);
  ctx.fillRect(x + 14, y - 8, w * 0.35, 4);
};

/** Obsidian frame (4x5 blocks) with the animated portal texture, `bs` units per block, standing on `base`. */
export const drawPortal = (ctx: CanvasRenderingContext2D, A: DimAssets, cx: number, base: number, f: number, bs = 32) => {
  const ps = bs / 16;
  const x0 = cx - 2 * bs;
  const y0 = base - 5 * bs;
  const pulse = 0.8 + 0.2 * Math.sin(f / 7);
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, cx, y0 + 2.5 * bs, bs * 4.2, '#a050ff', 0.5 * pulse);
  ctx.globalCompositeOperation = 'source-over';
  tile(ctx, stripFrame(A.img.portal, Math.floor(f / 2)), x0 + bs, y0 + bs, 2 * bs, 3 * bs, ps, 0, 0);
  shade(ctx, x0 + bs, y0 + bs, 2 * bs, 3 * bs, '#ffffff', 0.08 * pulse);
  const blk = (x: number, y: number, k: number) => {
    tile(ctx, A.img.obsidian, x, y, bs, bs, ps, k * 5, k * 3);
    shade(ctx, x, y, bs, 1, '#c8a0ff', 0.28);
    shade(ctx, x, y, 1, bs, '#c8a0ff', 0.16);
    shade(ctx, x + bs - 1, y, 1, bs, '#000000', 0.5);
    shade(ctx, x, y + bs - 1, bs, 1, '#000000', 0.5);
  };
  for (let i = 0; i < 4; i++) {
    blk(x0 + i * bs, y0, i);
    blk(x0 + i * bs, y0 + 4 * bs, i + 4);
  }
  for (let j = 1; j < 4; j++) {
    blk(x0, y0 + j * bs, j + 8);
    blk(x0 + 3 * bs, y0 + j * bs, j + 12);
  }
  // inner edge shadow
  shade(ctx, x0 + bs, y0 + bs, 2 * bs, 3, '#1a0030', 0.5);
  shade(ctx, x0 + bs, y0 + bs, 3, 3 * bs, '#1a0030', 0.4);
  motes(ctx, {seed: 61, count: 26, f, area: [x0 + bs, y0 - 10, 2 * bs, 5 * bs], vx: 0, vy: -0.5, colors: ['#e9a8ff', '#b46bff', '#ffffff', '#8a3cf0'], size: [1, 2], wobble: 7});
};

export const drawOverworld = (ctx: CanvasRenderingContext2D, A: DimAssets, o: OverOpts) => {
  const f = o.f ?? 0;
  const tod = o.tod ?? 0.25;
  const scroll = o.scroll ?? 0;
  const gy = o.groundY ?? 200;
  const ps = o.ps ?? 2;
  const ang = tod * Math.PI * 2;
  const e = Math.sin(ang);
  const night = smooth(0.02, -0.28, e);
  const sky = skyColors(e);
  const horizon = gy - 14;

  // sky
  bands(ctx, 0, horizon + 10, [
    [0, sky.top],
    [1, sky.bot],
  ], 4);
  ctx.fillStyle = sky.bot;
  ctx.fillRect(0, horizon + 10, W, H - horizon);

  // stars
  if (night > 0.02) {
    const r = mulberry32(31);
    for (let i = 0; i < 130; i++) {
      const x = Math.floor(r() * W);
      const y = Math.floor(r() * (horizon - 30));
      const ph = Math.floor(r() * 24);
      const tw = (f + ph) % 24 > 20 ? 0.3 : 1;
      ctx.fillStyle = hexA('#ffffff', night * tw * (0.4 + r() * 0.6));
      ctx.fillRect(x, y, 1, 1);
      if (r() < 0.12) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  }

  // sun and moon
  const cel = (a: number, kind: 'sun' | 'moon') => {
    const x = 240 - Math.cos(a) * 250;
    const y = horizon - Math.sin(a) * (horizon - 24);
    if (y > horizon + 24) return;
    const s = kind === 'sun' ? 12 : 10;
    if (!o.noGlow) {
      glow(ctx, x, y, kind === 'sun' ? 90 : 60, kind === 'sun' ? '#ffe9a8' : '#a8c4ff', kind === 'sun' ? 0.5 : 0.28);
      squareHalos(ctx, x, y, 4, s + 6, 6, kind === 'sun' ? '#fff3c4' : '#cfe0ff', (i) => 0.34 - i * 0.07, 2);
    }
    ctx.fillStyle = kind === 'sun' ? '#ffd45a' : '#aab8e0';
    ctx.fillRect(Math.round(x - s / 2 - 1), Math.round(y - s / 2 - 1), s + 2, s + 2);
    ctx.fillStyle = kind === 'sun' ? '#fff8d8' : '#eef2ff';
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    if (kind === 'moon') {
      ctx.fillStyle = '#c4cde8';
      ctx.fillRect(Math.round(x - 3), Math.round(y - 2), 3, 3);
      ctx.fillRect(Math.round(x + 1), Math.round(y + 1), 2, 2);
    }
  };
  cel(ang, 'sun');
  cel(ang + Math.PI, 'moon');

  // clouds
  const cc = mixHex(mixHex('#33426e', '#ffd9c4', smooth(-0.25, 0.05, e)), '#ffffff', smooth(0.05, 0.5, e));
  const cs = mixHex(mixHex('#232e55', '#e9a898', smooth(-0.25, 0.05, e)), '#cfe3f5', smooth(0.05, 0.5, e));
  const rc = mulberry32(55);
  for (let i = 0; i < 8; i++) {
    const w = 46 + Math.floor(rc() * 60);
    const y = 26 + Math.floor(rc() * 110);
    const sp = 0.06 + rc() * 0.12;
    const x0 = rc() * (W + 200);
    const x = Math.round(mod(x0 + sp * f - scroll * 0.2, W + 160) - 120);
    cloud(ctx, x, y, w, cc, cs);
  }

  // landscape on its own canvas so the night/dawn grade only touches it
  const lc = getOff(0);
  const l = lc.getContext('2d')!;
  const hazeNear = (c: string, k: number) => mixHex(c, sky.bot, k);
  const hills = (seed: number, base: number, amp: number, cell: number, color: string, par: number, trees: boolean, pal?: [string, string, string]) => {
    const sx = scroll * par;
    for (let x = -cell; x < W + cell; x += cell) {
      const xw = Math.floor((x + sx) / cell) * cell;
      const h = hillH(seed, xw, cell, amp);
      const xs = xw - sx;
      l.fillStyle = color;
      l.fillRect(Math.round(xs), base - h, cell, H);
    }
    if (trees) {
      const sp = 30;
      for (let i = Math.floor((sx - 20) / sp); i < Math.floor((sx + W + 20) / sp) + 1; i++) {
        if (hash(seed + 9, i) > 0.72) continue;
        const xw = i * sp + Math.round(hash(seed + 10, i) * 14);
        const h = hillH(seed, xw, cell, amp);
        tree(l, Math.round(xw - sx), base - h + 2, 8 + Math.floor(hash(seed + 11, i) * 6), pal!, ['#6e4b2c', '#8c6238']);
      }
    }
  };
  const cherry = !!o.cherry;
  hills(3, horizon + 6, 40, 4, hazeNear('#5d9a63', 0.52), 0.15, false);
  hills(8, horizon + 22, 30, 3, hazeNear('#4a9a4a', 0.28), 0.35, true, cherry ? [hazeNear('#ffc2d8', 0.2), hazeNear('#f48ab4', 0.2), hazeNear('#c85a8e', 0.2)] : [hazeNear('#6cc04a', 0.2), hazeNear('#47983a', 0.2), hazeNear('#2d6b2a', 0.2)]);
  hills(14, gy + 4, 26, 4, '#4a9a34', 0.6, true, cherry ? ['#ffd6e4', '#f79bc2', '#d2689c'] : ['#8ad65a', '#58b038', '#368a2a']);

  // near ground
  l.fillStyle = '#5a3d26';
  l.fillRect(0, gy, W, H - gy);
  tile(l, A.img.dirt, 0, gy + 6, W, H - gy - 6, ps, scroll, 0);
  shade(l, 0, gy + 6, W, H - gy, '#000000', 0.12);
  // darker toward the bottom edge
  for (let y = gy + 20; y < H; y += 4) shade(l, 0, y, W, 4, '#000000', ((y - gy - 20) / (H - gy)) * 0.35);
  tile(l, A.grass, 0, gy, W, 7, ps, scroll, 0);
  shade(l, 0, gy, W, 7, '#d8ff9a', 0.22);
  shade(l, 0, gy, W, 1, '#ffffff', 0.35);
  // dirt fringe under the grass
  for (let x = 0; x < W; x += 2) {
    const k = 2 + Math.floor(hash(70, Math.floor((x + scroll) / 2)) * 4);
    l.fillStyle = '#5faa3c';
    l.fillRect(x, gy + 7, 2, k);
    l.fillStyle = '#3f7d2a';
    l.fillRect(x, gy + 7 + k - 1, 2, 1);
  }
  if (o.decor !== false) {
    for (let i = Math.floor(scroll / 9) - 1; i < Math.floor((scroll + W) / 9) + 2; i++) {
      const h = hash(81, i);
      if (h > 0.55) continue;
      const x = Math.round(i * 9 - scroll);
      const hh = 4 + Math.floor(hash(82, i) * 5);
      l.fillStyle = '#4fae38';
      l.fillRect(x, gy - hh, 1, hh);
      l.fillRect(x + 2, gy - hh + 2, 1, hh - 2);
      l.fillStyle = '#7fd24e';
      l.fillRect(x + 1, gy - hh + 1, 1, hh - 1);
    }
    for (let i = Math.floor(scroll / 53) - 1; i < Math.floor((scroll + W) / 53) + 2; i++) {
      if (hash(91, i) > 0.7) continue;
      const x = Math.round(i * 53 + hash(92, i) * 30 - scroll);
      const col = (cherry ? ['#ffffff', '#ffb3d1', '#f06aa0'] : ['#ff4d5e', '#ffd23f', '#6aa8ff', '#ffffff'])[Math.floor(hash(93, i) * (cherry ? 3 : 4))];
      l.fillStyle = '#3d9a2e';
      l.fillRect(x, gy - 7, 1, 7);
      l.fillStyle = col;
      l.fillRect(x - 1, gy - 9, 3, 3);
      l.fillStyle = '#ffe27a';
      l.fillRect(x, gy - 8, 1, 1);
    }
  }
  if (o.portal) drawPortal(l, A, o.portal.x, gy + 2, f, o.portal.bs ?? 32);
  if (o.frame) {
    const treeBlock = (x: number, base: number, trunkH: number, leaves: HTMLCanvasElement | HTMLImageElement, log: HTMLImageElement, rows: number[]) => {
      const B = 16 * ps;
      tile(l, log, x, base - trunkH * B, B, trunkH * B, ps, 0, 0);
      shade(l, x + B - 6, base - trunkH * B, 6, trunkH * B, '#000000', 0.25);
      rows.forEach((n, ri) => {
        const y = base - trunkH * B - (ri + 1) * B + 6;
        tile(l, leaves, x + B / 2 - (n * B) / 2, y, n * B, B, ps, 0, 0);
        shade(l, x + B / 2 - (n * B) / 2, y + B - 6, n * B, 6, '#000000', 0.22);
        shade(l, x + B / 2 - (n * B) / 2, y, n * B, 2, '#ffffff', 0.12);
      });
    };
    const L = cherry ? A.img.cherryleaves : A.leaves;
    const G = cherry ? A.img.cherrylog : A.img.oaklog;
    treeBlock(-8, gy + 6, 4, L, G, [3, 5, 5, 3]);
    treeBlock(W - 44, gy + 6, 3, L, G, [3, 4, 4, 2]);
  }

  // grade
  const dk = (o.dark ?? 0) + (1 - (o.dark ?? 0)) * 0; // extra dark is applied by callers as an overlay too
  l.globalCompositeOperation = 'source-atop';
  l.fillStyle = hexA('#0a1236', Math.min(0.85, night * 0.62 + dk * 0.5));
  l.fillRect(0, 0, W, H);
  const warm = Math.max(0, 1 - Math.abs(e - 0.06) / 0.2);
  l.fillStyle = hexA('#ff8a3c', warm * 0.2);
  l.fillRect(0, 0, W, H);
  l.globalCompositeOperation = 'source-over';
  ctx.drawImage(lc, 0, 0);
};

export const OverworldCanvas: FC<OverOpts> = (o) => {
  const cf = useCurrentFrame();
  const A = useDim();
  return <LowRes ready={!!A} draw={(ctx) => A && drawOverworld(ctx, A, {...o, f: o.f ?? cf})} />;
};

// ================================================================ NETHER

export type NetherOpts = {
  f?: number;
  scroll?: number;
  /** 0..1 how bright the lava glow is (flicker is added on top). */
  heat?: number;
  /** ash/ember density multiplier. */
  ash?: number;
  /** Fortress silhouettes. */
  fortress?: boolean;
};

export const drawNether = (ctx: CanvasRenderingContext2D, A: DimAssets, o: NetherOpts) => {
  const f = o.f ?? 0;
  const sc = o.scroll ?? 0;
  const heat = o.heat ?? 1;
  const flick = 0.85 + 0.15 * Math.sin(f / 5) * Math.sin(f / 11 + 1);
  const lakeY = 200;

  bands(ctx, 0, H, [
    [0, '#14030a'],
    [0.35, '#3c0a0a'],
    [0.62, '#8c2210'],
    [0.82, '#e0521a'],
    [1, '#ff8a2a'],
  ], 4);

  // far haze blobs
  glow(ctx, 240, lakeY - 20, 260, '#ff7a30', 0.55 * heat * flick);

  // fortress silhouettes (two depths)
  if (o.fortress !== false) {
    const fort = (seed: number, base: number, par: number, color: string, minH: number, maxH: number, win: boolean) => {
      const sx = sc * par;
      const cell = 30;
      for (let idx = Math.floor(sx / cell) - 1; idx < Math.floor((sx + W) / cell) + 2; idx++) {
        const w = 22 + Math.floor(hash(seed, idx) * 10);
        const x = Math.round(idx * cell - sx);
        const h = Math.round(lerp(minH, maxH, hash(seed + 1, idx)));
        ctx.fillStyle = color;
        ctx.fillRect(x, base - h, w, h + 40);
        for (let k = 0; k < w; k += 4) ctx.fillRect(x + k, base - h - 3, 2, 3);
        if (hash(seed + 2, idx) > 0.55) {
          const tw = 8;
          ctx.fillRect(x + w / 2 - tw / 2, base - h - 16, tw, 16);
          for (let k = 0; k < tw; k += 4) ctx.fillRect(x + w / 2 - tw / 2 + k, base - h - 19, 2, 3);
        }
        if (win) {
          const flickW = (f + idx * 7) % 40 > 3;
          for (let k = 0; k < 2; k++) {
            if (hash(seed + 5 + k, idx) > 0.5 && flickW) {
              ctx.fillStyle = '#ffb04a';
              const wx = x + 3 + Math.floor(hash(seed + 7 + k, idx) * (w - 7));
              ctx.fillRect(wx, base - h + 6 + k * 9, 2, 3);
              ctx.fillStyle = hexA('#ff9a3a', 0.25);
              ctx.fillRect(wx - 1, base - h + 5 + k * 9, 4, 5);
            }
          }
        }
      }
    };
    fort(11, 176, 0.12, mixHex('#5a1008', '#8c2210', 0.2), 14, 38, false);
    fort(23, 190, 0.28, '#2a0707', 12, 44, true);
  }
  ctx.globalCompositeOperation = 'source-over';

  // lava lake
  const lf = stripFrame(A.img.lava, Math.floor(f / 3));
  tile(ctx, lf, 0, lakeY, W, H - lakeY, 2, sc * 0.6 + f * 0.3, f * 0.15);
  ctx.globalCompositeOperation = 'lighter';
  shade(ctx, 0, lakeY, W, H - lakeY, '#ff5a10', 0.12 * flick);
  ctx.globalCompositeOperation = 'source-over';
  for (let y = lakeY; y < H; y += 4) shade(ctx, 0, y, W, 4, '#400000', 0.04 * ((y - lakeY) / 4));
  // shore line
  shade(ctx, 0, lakeY - 1, W, 1, '#ffd08a', 0.5);
  // lava sparkles on the surface
  motes(ctx, {seed: 5, count: 30, f, area: [0, lakeY + 2, W, H - lakeY - 4], vx: 0.05, vy: 0, colors: ['#ffe9a8', '#ffc04a'], size: [1, 2], fade: false, alpha: 0.5});

  // lava falls
  const falls = [78, 372];
  for (const fx of falls) {
    const x = Math.round(fx - sc * 0.5);
    const w = 14;
    tile(ctx, lf, x, 30, w, lakeY - 30, 1, 0, -f * 1.5);
    ctx.globalCompositeOperation = 'lighter';
    shade(ctx, x, 30, w, lakeY - 30, '#ff7a1a', 0.18);
    glow(ctx, x + w / 2, lakeY - 40, 70, '#ff7a30', 0.35 * flick);
    ctx.globalCompositeOperation = 'source-over';
    shade(ctx, x - 1, 30, 1, lakeY - 30, '#2a0404', 0.9);
    shade(ctx, x + w, 30, 1, lakeY - 30, '#2a0404', 0.9);
  }

  // near floor hills left/right
  const floor = (side: -1 | 1, w: number, top: number) => {
    for (let k = 0; k < w; k += 4) {
      const t = k / w;
      const hh = Math.round(top * Math.pow(1 - t, 1.5) + 6 * hash(41 + side, k));
      const x = side < 0 ? k : W - k - 4;
      tile(ctx, A.img.netherrack, x, H - hh, 4, hh, 2, 0, 0);
      shade(ctx, x, H - hh, 4, 2, '#ff6a20', 0.35);
      shade(ctx, x, H - hh, 4, hh, '#1a0000', 0.38 + 0.2 * t);
    }
  };
  floor(-1, 150, 78);
  floor(1, 130, 62);

  // ceiling
  const ceilH = (x: number) => 22 + Math.round(34 * vn(77, (x + sc * 0.5) / 55) + 16 * vn(78, (x + sc * 0.5) / 17)) + (hash(79, Math.floor((x + sc * 0.5) / 5)) > 0.8 ? 10 + Math.floor(hash(80, Math.floor((x + sc * 0.5) / 5)) * 18) : 0);
  for (let x = 0; x < W; x += 5) {
    const h = ceilH(x);
    tile(ctx, A.img.netherrack, x, 0, 5, h, 2, 0, 0);
    shade(ctx, x, 0, 5, h, '#120000', 0.42);
    shade(ctx, x, h - 2, 5, 2, '#ff5a20', 0.45);
    shade(ctx, x, h - 5, 5, 3, '#ff5a20', 0.1);
  }
  shade(ctx, 0, 0, W, 8, '#000000', 0.5);

  // glowstone clusters hanging from the ceiling
  const gs = [
    [212, 0.9],
    [296, 0.7],
  ] as const;
  for (const [gx, sz] of gs) {
    const x = Math.round(gx - sc * 0.5);
    const top = ceilH(x) - 4;
    const gh = Math.round(16 * sz);
    for (let k = 0; k < 4; k++) {
      const ww = Math.round(8 * sz) - k;
      const hh = gh - k * 3 + (k % 2) * 2;
      tile(ctx, A.img.glowstone, x + k * 6 - 8, top, ww, hh + 4, 1, 0, 0);
    }
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x + 6, top + gh * 0.7, 62, '#ffd070', 0.55 * flick);
    ctx.globalCompositeOperation = 'source-over';
  }

  // fog drifting
  for (let i = 0; i < 4; i++) {
    const y = 110 + i * 24;
    const px = mod(f * (0.15 + i * 0.07) + i * 130, W + 240) - 120;
    ctx.fillStyle = `rgba(255,90,40,${0.05 + 0.02 * i})`;
    ctx.fillRect(Math.round(px - 140), y, 280, 10 + i * 3);
    ctx.fillRect(Math.round(px - 90), y - 5, 180, 6);
  }

  // ash falls, embers rise
  const ash = o.ash ?? 1;
  motes(ctx, {seed: 21, count: Math.round(80 * ash), f, area: [0, 0, W, H], vx: -0.3, vy: 0.55, colors: ['#9a8a88', '#c8b8b0', '#6a5a58', '#e0d0c8'], size: [1, 2], wobble: 6, alpha: 0.85});
  motes(ctx, {seed: 22, count: Math.round(60 * ash), f, area: [0, 40, W, H - 40], vx: 0.18, vy: -0.5, colors: ['#ffb347', '#ff7a1a', '#ffe08a', '#ff5a10'], size: [1, 2], wobble: 8});
  motes(ctx, {seed: 23, count: Math.round(14 * ash), f, area: [0, 0, W, H], vx: -0.8, vy: 1.1, colors: ['#b0a09a', '#7a6a66'], size: [3, 4], wobble: 10, alpha: 0.7});
};

export const NetherCanvas: FC<NetherOpts> = (o) => {
  const cf = useCurrentFrame();
  const A = useDim();
  return <LowRes ready={!!A} draw={(ctx) => A && drawNether(ctx, A, {...o, f: o.f ?? cf})} />;
};

// ================================================================ END

export type EndOpts = {
  f?: number;
  scroll?: number;
  /** Top of the main island. */
  islandY?: number;
  /** Dragon flight progress 0..1 (hidden outside). */
  dragon?: number;
  /** Extra purple mote density. */
  motes?: number;
};

export const drawEnd = (ctx: CanvasRenderingContext2D, A: DimAssets, o: EndOpts) => {
  const f = o.f ?? 0;
  const sc = o.scroll ?? 0;
  const top = o.islandY ?? 178;

  ctx.fillStyle = '#06020e';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.34;
  tile(ctx, A.img.endsky, 0, 0, W, H, 1, sc * 0.1, 0);
  ctx.globalAlpha = 1;
  bands(ctx, 0, H, [
    [0, '#04010a'],
    [0.55, '#14072c'],
    [1, '#3a1470'],
  ], 4);
  // overlay again with alpha so the noisy texture still shows through
  ctx.globalAlpha = 0.5;
  tile(ctx, A.img.endsky, 0, 0, W, H, 1, sc * 0.1 + 32, 17);
  ctx.globalAlpha = 1;
  bands(ctx, 0, H, [
    [0, '#04010a'],
    [0.6, '#12062a'],
    [1, '#341268'],
  ], 4);
  ctx.globalAlpha = 0.18;
  tile(ctx, A.img.endsky, 0, 0, W, H, 1, sc * 0.1, 0);
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 330, 110, 150, '#b43cff', 0.3 + 0.04 * Math.sin(f / 18));
  glow(ctx, 100, 150, 120, '#6a3cff', 0.28);
  glow(ctx, 250, 40, 110, '#ff4fd8', 0.14);
  glow(ctx, 240, top + 6, 200, '#7a3cff', 0.35);
  ctx.globalCompositeOperation = 'source-over';

  // stars
  const r = mulberry32(404);
  for (let i = 0; i < 170; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * (top + 10));
    const ph = Math.floor(r() * 30);
    const tw = (f + ph) % 30;
    const a = tw > 26 ? 0.25 : 0.4 + r() * 0.6;
    const c = r() < 0.2 ? '#e9c4ff' : r() < 0.4 ? '#c9d4ff' : '#ffffff';
    ctx.fillStyle = hexA(c, a);
    const px = Math.round(x - sc * 0.05 * (1 + (i % 3)));
    ctx.fillRect(px, y, 1, 1);
    if (r() < 0.1) {
      ctx.fillRect(px - 1, y, 3, 1);
      ctx.fillRect(px, y - 1, 1, 3);
    }
  }

  // distant islets
  const islet = (cx: number, cy: number, w: number, hh: number, shadeK: number) => {
    const x0 = Math.round(cx - sc * 0.1);
    for (let k = 0; k < hh; k += 2) {
      const t = k / hh;
      const ww = Math.round(w * (1 - Math.pow(t, 0.8)) * 0.5 * (0.85 + 0.3 * hash(61, k + cx)));
      tile(ctx, A.img.endstone, x0 - ww, cy + k, ww * 2, 2, 1, 0, 0);
    }
    shade(ctx, x0 - w / 2, cy, w, hh, '#14052e', shadeK);
    shade(ctx, x0 - w / 2, cy, w, 1, '#d9c8ff', 0.35);
  };
  islet(60, 90, 50, 22, 0.55);
  islet(420, 60, 40, 18, 0.6);
  islet(380, 150, 30, 12, 0.5);
  islet(150, 40, 24, 10, 0.62);

  // dragon silhouette flying across
  if (o.dragon !== undefined && o.dragon >= 0 && o.dragon <= 1) {
    const t = o.dragon;
    const dx = lerp(-60, W + 60, t);
    const dy = 70 + Math.sin(t * 6) * 14;
    const flap = Math.sin(f / 4) * 0.5;
    ctx.fillStyle = '#0a0414';
    const wing = (dir: number) => {
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + dir * 26, dy - 20 - flap * 16);
      ctx.lineTo(dx + dir * 46, dy - 8 - flap * 24);
      ctx.lineTo(dx + dir * 34, dy + 2 - flap * 10);
      ctx.lineTo(dx + dir * 22, dy + 6);
      ctx.closePath();
      ctx.fill();
    };
    wing(1);
    wing(-1);
    ctx.fillRect(Math.round(dx - 5), Math.round(dy - 3), 10, 8);
    ctx.fillRect(Math.round(dx - 18), Math.round(dy), 16, 3);
    ctx.fillRect(Math.round(dx + 4), Math.round(dy - 1), 12, 4);
    ctx.fillStyle = '#ff4fd8';
    ctx.fillRect(Math.round(dx + 13), Math.round(dy), 2, 2);
  }

  // main island: stepped taper, end stone, rim light
  const iw = 520;
  const depth = 84;
  for (let k = 0; k < depth; k += 2) {
    const t = k / depth;
    const half = Math.round((iw / 2) * (1 - Math.pow(t, 1.15)) * (0.92 + 0.16 * vn(62, k / 7)));
    const x = Math.round(240 - sc * 0.4 - half);
    tile(ctx, A.img.endstone, x, top + k, half * 2, 2, 2, sc * 0.4, 0);
    shade(ctx, x, top + k, half * 2, 2, '#1a0638', Math.min(0.85, 0.12 + t * 0.7));
    shade(ctx, x, top + k, 2, 2, '#e8dcff', 0.12 * (1 - t));
  }
  shade(ctx, 240 - sc * 0.4 - iw / 2, top, iw, 2, '#fff6c4', 0.7);
  shade(ctx, 240 - sc * 0.4 - iw / 2, top + 2, iw, 2, '#fff6c4', 0.25);

  // obsidian pillars with crystals
  const pillar = (px: number, h: number, w: number, caged: boolean) => {
    const x = Math.round(px - sc * 0.4 - w / 2);
    tile(ctx, A.img.obsidian, x, top - h, w, h + 2, 1, 0, 0);
    shade(ctx, x, top - h, w, h, '#0a0016', 0.18);
    shade(ctx, x + w - 3, top - h, 3, h, '#000000', 0.45);
    shade(ctx, x, top - h, 1, h, '#c8a0ff', 0.28);
    // crystal
    const cx = x + w / 2;
    const cy = top - h - 9 + Math.round(Math.sin(f / 12 + px) * 2);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, 34, '#ff4fd8', 0.65);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff7ae8';
    ctx.fillRect(Math.round(cx - 3), Math.round(cy - 3), 7, 7);
    ctx.fillStyle = '#ffd6f6';
    ctx.fillRect(Math.round(cx - 3), Math.round(cy - 3), 7, 2);
    ctx.fillStyle = '#c42bb0';
    ctx.fillRect(Math.round(cx + 2), Math.round(cy - 1), 2, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(cx - 1), Math.round(cy - 1), 2, 2);
    if (caged) {
      ctx.fillStyle = '#2a2a2e';
      ctx.fillRect(Math.round(cx - 6), Math.round(cy - 6), 1, 13);
      ctx.fillRect(Math.round(cx + 6), Math.round(cy - 6), 1, 13);
      ctx.fillRect(Math.round(cx - 6), Math.round(cy - 6), 13, 1);
    }
  };
  pillar(70, 82, 14, true);
  pillar(150, 58, 16, false);
  pillar(330, 66, 14, true);
  pillar(410, 94, 16, false);

  // endermen
  const enderman = (px: number, s = 1, look = 0) => {
    const x = Math.round(px - sc * 0.4);
    const y = top;
    const c = '#0b0612';
    ctx.fillStyle = c;
    ctx.fillRect(x - 2, y - 20 * s, 2, 20 * s);
    ctx.fillRect(x + 1, y - 20 * s, 2, 20 * s);
    ctx.fillRect(x - 3, y - 36 * s, 7, 16 * s);
    ctx.fillRect(x - 6, y - 34 * s, 2, 22 * s);
    ctx.fillRect(x + 5, y - 34 * s, 2, 22 * s);
    ctx.fillRect(x - 4, y - 43 * s, 9, 8 * s);
    ctx.fillStyle = '#2f1660';
    ctx.fillRect(x - 4, y - 43 * s, 9, 1);
    ctx.fillRect(x + 4, y - 43 * s, 1, 8 * s);
    ctx.fillStyle = '#ff4fff';
    ctx.fillRect(x - 3 + look, y - 40 * s, 2, 1);
    ctx.fillRect(x + 1 + look, y - 40 * s, 2, 1);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 40 * s, 10, '#ff4fff', 0.5);
    ctx.globalCompositeOperation = 'source-over';
  };
  enderman(205, 1, 0);
  enderman(262, 1.15, 1);
  enderman(118, 0.8, 0);

  // dragon-breath ground fog
  for (let i = 0; i < 3; i++) {
    const px = mod(f * (0.1 + i * 0.05) + i * 160, W + 200) - 100;
    ctx.fillStyle = `rgba(190,80,255,${0.07 + i * 0.02})`;
    ctx.fillRect(Math.round(px - 120), top - 6 - i * 4, 240, 7 + i * 3);
  }

  // motes
  const m = o.motes ?? 1;
  motes(ctx, {seed: 51, count: Math.round(70 * m), f, area: [0, 20, W, top + 60], vx: 0.12, vy: -0.28, colors: ['#e9a8ff', '#b46bff', '#ff7ae8', '#ffffff'], size: [1, 2], wobble: 6});
  motes(ctx, {seed: 52, count: Math.round(14 * m), f, area: [0, 0, W, H], vx: -0.4, vy: -0.7, colors: ['#e9a8ff', '#ff7ae8'], size: [3, 3], wobble: 9, alpha: 0.7});
};

export const EndCanvas: FC<EndOpts> = (o) => {
  const cf = useCurrentFrame();
  const A = useDim();
  return <LowRes ready={!!A} draw={(ctx) => A && drawEnd(ctx, A, {...o, f: o.f ?? cf})} />;
};
