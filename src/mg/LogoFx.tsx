import {block, tex} from '../mc/assets';
import {fontsReady} from '../mc/fonts';
import {EASE, HEIGHT, WIDTH, clamp01, mulberry32} from '../mc/theme';
import {LH, LW, PX, loadImage, pixelRing} from './LowRes';

/**
 * Logo effects on the low-res canvas, built from vanilla particles and behaviours:
 *   land    stone poof (generic_7..0) and debris, pixel shock rings
 *   shatter the logo breaks like a mined block: 2x2 chunks fly out under gravity
 *   prime   chunks and portal dust spiral into a TNT block that blinks white and swells
 *   boom    vanilla explosion sprites (explosion_0..15) and the flash particle
 *   form    chunks fly out of the blast and settle on the title glyphs
 * Every position is a pure function of the frame.
 */

export type LogoFxTimes = {impact: number; shatter: number; collapse: number; burst: number; land: number; fadeOut: number};
export type LogoBox = {x: number; y: number; w: number; h: number};

type Chunk = {ox: number; oy: number; c: string; tc: string; tx: number; ty: number; vx: number; vy: number; k1: number; k2: number; k3: number; k4: number};

export type LogoFxAssets = {
  chunks: Chunk[];
  explosion: HTMLImageElement[];
  generic: HTMLImageElement[];
  flash: HTMLImageElement;
  tnt: HTMLImageElement;
};

const hex = (r: number, g: number, b: number) => `rgb(${r},${g},${b})`;

export const loadLogoFx = async (o: {logo: string; crop: {w: number; h: number}; box: LogoBox; title: string; titleFont: string; titleSize: number; titleY: number}): Promise<LogoFxAssets> => {
  const [logo, flash, tnt, ...rest] = await Promise.all([
    loadImage(o.logo),
    loadImage(tex('particle/flash.png')),
    loadImage(block('tnt_side')),
    ...Array.from({length: 16}, (_, i) => loadImage(tex(`particle/explosion_${i}.png`))),
    ...Array.from({length: 8}, (_, i) => loadImage(tex(`particle/generic_${i}.png`))),
  ]);
  const explosion = rest.slice(0, 16);
  const generic = rest.slice(16);
  await fontsReady();
  await document.fonts.load(`${o.titleSize}px ${o.titleFont}`);

  // Logo sampled on the low-res grid (smoothing on, so each cell averages its texels).
  const bw = o.box.w / PX;
  const bh = o.box.h / PX;
  const lc = document.createElement('canvas');
  lc.width = bw;
  lc.height = bh;
  const lx = lc.getContext('2d', {willReadFrequently: true})!;
  lx.drawImage(logo, 0, 0, o.crop.w, o.crop.h, 0, 0, bw, bh);
  const ld = lx.getImageData(0, 0, bw, bh).data;

  // Title glyph cells, sampled at full resolution and mapped to the low-res grid.
  const tc = document.createElement('canvas');
  tc.width = WIDTH;
  tc.height = HEIGHT;
  const tx = tc.getContext('2d', {willReadFrequently: true})!;
  tx.font = `${o.titleSize}px ${o.titleFont}`;
  tx.textAlign = 'center';
  tx.textBaseline = 'middle';
  tx.fillStyle = '#fff';
  tx.letterSpacing = `${o.titleSize / 12}px`;
  tx.fillText(o.title, WIDTH / 2, o.titleY);
  const td = tx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const targets: [number, number][] = [];
  const step = 2 * PX;
  for (let y = 0; y < HEIGHT; y += step) for (let x = 0; x < WIDTH; x += step) if (td[(y * WIDTH + x + step / 2) * 4 + 3] > 128) targets.push([x / PX, y / PX]);
  targets.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const rnd = mulberry32(42);
  const cx = (o.box.x + o.box.w / 2) / PX;
  const cy = (o.box.y + o.box.h / 2) / PX;
  const chunks: Chunk[] = [];
  for (let y = 0; y < bh; y += 2) {
    for (let x = 0; x < bw; x += 2) {
      const i = (y * bw + x) * 4;
      if (ld[i + 3] < 120) continue;
      let r = ld[i];
      let g = ld[i + 1];
      let b = ld[i + 2];
      // The logo's black outline would vanish against the night sky; lift it to dark stone.
      if (r + g + b < 120) [r, g, b] = [52, 48, 47];
      const ox = o.box.x / PX + x;
      const oy = o.box.y / PX + y;
      const dx = ox - cx;
      const dy = oy - cy;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 1.6 + rnd() * 3.4;
      chunks.push({ox, oy, c: hex(r, g, b), tc: '', tx: 0, ty: 0, vx: (dx / d) * sp + (rnd() - 0.5), vy: (dy / d) * sp - (1.1 + rnd() * 1.6), k1: rnd(), k2: rnd(), k3: rnd(), k4: rnd()});
    }
  }
  const byX = [...chunks].sort((a, b) => a.ox - b.ox || a.oy - b.oy);
  byX.forEach((p, rank) => {
    const t = targets[Math.floor((rank / byX.length) * targets.length)] ?? [LW / 2, o.titleY / PX];
    p.tx = t[0];
    p.ty = t[1];
    // Chunks end up stone-coloured, matching the title's top band.
    const v = 200 + Math.floor(p.k3 * 40);
    p.tc = hex(v, v - 6, v - 10);
  });
  return {chunks, explosion, generic, flash, tnt};
};

const DRAG = 0.92;

export const drawLogoFx = (ctx: CanvasRenderingContext2D, f: number, a: LogoFxAssets, box: LogoBox, t: LogoFxTimes) => {
  const cx = Math.round((box.x + box.w / 2) / PX);
  const cy = Math.round((box.y + box.h / 2) / PX);
  const baseY = Math.round((box.y + box.h) / PX) - 2;
  const left = box.x / PX;
  const right = (box.x + box.w) / PX;

  // ---- landing: shock rings, stone poof along the base, debris
  const ti = f - t.impact;
  if (ti >= 0 && ti < 22) {
    const p = EASE.out(ti / 22);
    pixelRing(ctx, cx, cy, 10 + p * 220, ti < 8 ? 2 : 1, `rgba(248,175,43,${1 - p})`);
    if (ti >= 2) pixelRing(ctx, cx, cy, 6 + EASE.out((ti - 2) / 20) * 150, 1, `rgba(255,255,255,${1 - (ti - 2) / 20})`);
  }
  if (ti >= 0 && ti < 18) {
    const rnd = mulberry32(5);
    for (let i = 0; i < 18; i++) {
      const x0 = left + rnd() * (right - left);
      const dir = x0 < cx ? -1 : 1;
      const frame = 7 - Math.min(7, Math.floor((ti + rnd() * 3) / 2.2));
      const x = Math.round(x0 + dir * ti * (0.3 + rnd() * 0.5));
      const y = Math.round(baseY - 4 - ti * (0.15 + rnd() * 0.2));
      ctx.globalAlpha = 0.9;
      ctx.drawImage(a.generic[frame], x - 8, y - 8, 16, 16);
    }
    ctx.globalAlpha = 1;
  }
  if (ti >= 0 && ti < 30) {
    const rnd = mulberry32(9);
    for (let i = 0; i < 46; i++) {
      const x0 = left + 10 + rnd() * (right - left - 20);
      const vx = (rnd() - 0.5) * 3;
      const vy = -(1 + rnd() * 2.6);
      const k = (1 - Math.pow(DRAG, ti)) / (1 - DRAG);
      const x = Math.round(x0 + vx * k);
      const y = Math.round(baseY + vy * k + 0.5 * 0.2 * ti * ti);
      if (y > LH) continue;
      const v = 110 + Math.floor(rnd() * 90);
      ctx.fillStyle = hex(v, v - 5, v - 8);
      ctx.fillRect(x, y, rnd() < 0.4 ? 2 : 1, rnd() < 0.4 ? 2 : 1);
    }
  }

  // ---- chunks: shatter -> spiral -> blast -> title
  if (f >= t.shatter && f <= t.fadeOut) {
    const fade = f > t.land ? 1 - clamp01((f - t.land) / (t.fadeOut - t.land)) : 1;
    ctx.globalAlpha = fade;
    for (const p of a.chunks) {
      let x: number;
      let y: number;
      let s = 2;
      let col = p.c;
      const ts = Math.max(0, Math.min(f, t.collapse) - t.shatter - p.k1 * 3);
      const k = (1 - Math.pow(DRAG, ts)) / (1 - DRAG);
      const sx = p.ox + p.vx * k;
      const sy = p.oy + p.vy * k + 0.5 * 0.1 * ts * ts;
      if (f < t.collapse) {
        x = sx;
        y = sy;
      } else if (f < t.burst) {
        const v = EASE.in(clamp01((f - t.collapse - p.k4 * 3) / (t.burst - t.collapse - 3)));
        const r1 = Math.hypot(sx - cx, sy - cy);
        const a1 = Math.atan2(sy - cy, sx - cx) + v * (1.6 + p.k1 * 1.6);
        x = cx + Math.cos(a1) * r1 * (1 - v);
        y = cy + Math.sin(a1) * r1 * (1 - v);
        if (v > 0.75) s = 1;
        if (v > 0.98) continue;
      } else {
        const w = clamp01((f - t.burst - p.k2 * 4) / (t.land - t.burst - 4));
        if (w <= 0) continue;
        const e = EASE.out(w);
        const kick = (1 - e) * e * 4 * (20 + p.k3 * 50);
        const ka = p.k1 * Math.PI * 2;
        x = cx + (p.tx - cx) * e + Math.cos(ka) * kick;
        y = cy + (p.ty - cy) * e + Math.sin(ka) * kick;
        col = e > 0.6 ? p.tc : '#fff1d6';
      }
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
    ctx.globalAlpha = 1;
  }

  // ---- portal dust spiralling in during the collapse
  if (f >= t.collapse - 4 && f < t.burst) {
    const rnd = mulberry32(31);
    for (let i = 0; i < 140; i++) {
      const a0 = rnd() * Math.PI * 2;
      const r0 = 70 + rnd() * 120;
      const born = t.collapse - 4 + rnd() * (t.burst - t.collapse - 6);
      const u = clamp01((f - born) / 12);
      if (u <= 0 || u >= 1) continue;
      const e = EASE.in(u);
      const ang = a0 + e * 2.2;
      const r = r0 * (1 - e);
      const pv = 0.55 + rnd() * 0.45;
      ctx.fillStyle = hex(Math.round(200 * pv), Math.round(80 * pv), Math.round(255 * pv));
      ctx.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r * 0.8), 1, 1);
    }
  }

  // ---- TNT: grows as the chunks arrive, blinks faster and swells right before the blast
  if (f >= t.collapse + 4 && f < t.burst) {
    const g = EASE.out(clamp01((f - t.collapse - 4) / 8));
    const swell = EASE.in(clamp01((f - (t.burst - 5)) / 5));
    const size = Math.round((8 + g * 8) * (1 + swell * 0.35) / 2) * 2;
    const x = cx - size / 2;
    const y = cy - size / 2;
    ctx.drawImage(a.tnt, x, y, size, size);
    const remain = t.burst - f;
    const period = remain < 5 ? 1 : remain < 10 ? 2 : 4;
    if (Math.floor((f - t.collapse) / period) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(x, y, size, size);
    }
  }

  // ---- blast: vanilla explosion sprites, flash particle, rings
  const tb = f - t.burst;
  if (tb >= 0 && tb < 24) {
    const rnd = mulberry32(77);
    for (let i = 0; i < 16; i++) {
      const ang = rnd() * Math.PI * 2;
      const rr = rnd() * 46;
      const start = Math.floor(rnd() * 6);
      const fi = tb - start;
      if (fi < 0 || fi > 15) continue;
      const size = rnd() < 0.5 ? 48 : 32;
      const gray = 0.65 + rnd() * 0.35;
      ctx.globalAlpha = gray;
      ctx.drawImage(a.explosion[fi], Math.round(cx + Math.cos(ang) * rr - size / 2), Math.round(cy + Math.sin(ang) * rr * 0.7 - size / 2), size, size);
    }
    ctx.globalAlpha = 1;
    if (tb < 8) {
      ctx.globalAlpha = 1 - tb / 8;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(a.flash, cx - 64, cy - 64, 128, 128);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    if (tb < 20) pixelRing(ctx, cx, cy, 14 + EASE.out(tb / 20) * 260, tb < 6 ? 2 : 1, `rgba(255,255,255,${1 - tb / 20})`);
    if (tb >= 2 && tb < 22) pixelRing(ctx, cx, cy, 8 + EASE.out((tb - 2) / 20) * 180, 1, `rgba(248,175,43,${1 - (tb - 2) / 20})`);
  }
};
