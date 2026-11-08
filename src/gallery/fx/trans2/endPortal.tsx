import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE, HEIGHT, WIDTH, mulberry32} from '../../../mc/theme';
import {LH, LW, LowRes} from '../../../mg/LowRes';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {blit, hash2, hexToRgb, jitter, mix, smooth, vnoise, win, ewin} from './common';

/**
 * t2-end-portal : A dims, a ring of end-portal frames pops in, the eyes click in one by one, the portal
 * fills with a warping star field that swallows the frame and the whole screen, then opens a hole in the
 * middle that spreads outwards and reveals B.
 * Cut-type (B takes over at p = 0.5). Params: CENTER (cx, cy in low-res px), FRAME (block size), colours in STAR_COLORS.
 */

const T = 66;
const CX = LW / 2;
const CY = LH / 2;
const BLOCK = 192;
const R0 = 72; // half width of the 3x3 interior in low-res px
const RMAX = Math.hypot(LW / 2, LH / 2) + 14;

const STAR_COLORS = ['#53f0e0', '#1fb7c9', '#4d7cff', '#a67bff', '#e8fbff', '#7be8ff'].map(hexToRgb);
const NEB = ['#02040a', '#06101e', '#0a2230', '#0f3a48', '#2a1a58', '#3d2487'].map(hexToRgb);

/** The 12 frame slots around the 3x3 interior, as (col,row) in -2..2. */
const SLOTS: {i: number; j: number; rot: number}[] = [];
for (let j = -2; j <= 2; j++)
  for (let i = -2; i <= 2; i++) {
    const edge = Math.max(Math.abs(i), Math.abs(j)) === 2;
    const corner = Math.abs(i) === 2 && Math.abs(j) === 2;
    if (edge && !corner) SLOTS.push({i, j, rot: j === -2 ? 0 : j === 2 ? 180 : i === -2 ? 270 : 90});
  }
// Order the eyes clockwise from the top-left so they click in one by one.
SLOTS.sort((a, b) => Math.atan2(a.j, a.i) - Math.atan2(b.j, b.i));

const fieldRadius = (p: number) => {
  // interior fill, then the swallowing expansion
  const fill = ewin(p, 0.2, 0.28, EASE.out);
  const grow = Math.pow(win(p, 0.28, 0.5), 1.9);
  return fill * R0 + grow * (RMAX - R0);
};
const holeRadius = (p: number) => ewin(p, 0.5, 0.9, EASE.inOut) * (RMAX + 10);

const drawField = (ctx: CanvasRenderingContext2D, p: number, f: number) => {
  const R = fieldRadius(p);
  const Rh = holeRadius(p);
  if (R <= 0) return;
  const img = ctx.createImageData(LW, LH);
  const d = img.data;
  const n = 14 - 11 * smooth(win(p, 0.2, 0.5)); // squircle exponent: square frame -> round swallow
  const warp = 1 + 2.4 * smooth(win(p, 0.25, 0.6));
  const tt = f * 0.016 * warp;
  const outside = p > 0.5;
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      const dx = x - CX;
      const dy = y - CY;
      const dn = Math.pow(Math.pow(Math.abs(dx), n) + Math.pow(Math.abs(dy), n), 1 / n);
      const grain = (hash2(x, y, 5) - 0.5) * 5 + (vnoise(x / 9, y / 9, 3) - 0.5) * 14;
      const e = dn + grain;
      if (e > R) {
        // faint cyan halo outside the growing field, dithered
        const gap = e - R;
        if (!outside && gap < 9 && (x + y) % 2 === 0 && hash2(x, y, 9) > gap / 9) {
          const o = (y * LW + x) * 4;
          d[o] = 40;
          d[o + 1] = 220;
          d[o + 2] = 210;
          d[o + 3] = 120;
        }
        continue;
      }
      if (outside && e < Rh) {
        // hole: let B through, with a bright rim
        const gap = Rh - e;
        if (gap < 4) {
          const o = (y * LW + x) * 4;
          const w = gap < 2 ? 255 : 160;
          d[o] = w * 0.7 + 60;
          d[o + 1] = 255;
          d[o + 2] = 255;
          d[o + 3] = gap < 2 ? 255 : 150;
        }
        continue;
      }
      // star field
      const base = 0.5 * vnoise(dx / 38 + f * 0.012, dy / 38, 1) + 0.5 * vnoise(dx / 15 - f * 0.02, dy / 15, 2);
      const lvl = Math.min(NEB.length - 1, Math.floor(smooth(base) * 4.2 + (hash2(x >> 1, y >> 1, 4) - 0.5) * 0.5));
      let rr = NEB[Math.max(0, lvl)][0];
      let gg = NEB[Math.max(0, lvl)][1];
      let bb = NEB[Math.max(0, lvl)][2];
      for (let k = 0; k < 4; k++) {
        const z = (tt + k / 4) % 1;
        const s = 0.55 + z * z * 3.4;
        const u = dx / s;
        const v = dy / s;
        const cx = Math.floor(u / 6);
        const cy = Math.floor(v / 6);
        const h = hash2(cx, cy, 40 + k * 17);
        if (h < 0.62) continue;
        const sx = 1 + Math.floor(hash2(cx, cy, 77 + k) * 4);
        const sy = 1 + Math.floor(hash2(cx, cy, 91 + k) * 4);
        const lu = Math.floor(u) - cx * 6 - sx;
        const lv = Math.floor(v) - cy * 6 - sy;
        const big = h > 0.93;
        const hit = lu === 0 && lv === 0 ? 1 : big && Math.abs(lu) + Math.abs(lv) === 1 ? 0.55 : 0;
        if (!hit) continue;
        const a = Math.sin(Math.PI * z) * hit;
        const c = STAR_COLORS[Math.floor(hash2(cx, cy, 55 + k) * STAR_COLORS.length)];
        rr = mix(rr, c[0], a);
        gg = mix(gg, c[1], a);
        bb = mix(bb, c[2], a);
      }
      // bright rim just inside the edge of the field
      const rim = R - e;
      if (rim < 3 && !outside) {
        const w = rim < 1.2 ? 1 : 0.55;
        rr = mix(rr, 190, w);
        gg = mix(gg, 255, w);
        bb = mix(bb, 255, w);
      }
      const o = (y * LW + x) * 4;
      d[o] = rr;
      d[o + 1] = gg;
      d[o + 2] = bb;
      d[o + 3] = 255;
    }
  }
  blit(ctx, img);
};

/** Sparse twinkling stars over the darkened shot, before the portal swallows them. */
const drawBgStars = (ctx: CanvasRenderingContext2D, p: number, f: number) => {
  const vis = win(p, 0.0, 0.1) * (1 - win(p, 0.4, 0.5));
  if (vis <= 0) return;
  const cols = ['#53f0e0', '#a67bff', '#e8fbff', '#7be8ff'];
  for (let i = 0; i < 260; i++) {
    const r = mulberry32(900 + i);
    const x = Math.floor(r() * LW);
    const y = Math.floor(r() * LH);
    const per = 14 + Math.floor(r() * 22);
    const t = ((f + Math.floor(r() * per)) % per) / per;
    const a = Math.sin(t * Math.PI) * vis * 0.9;
    ctx.globalAlpha = a;
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(x, y, 1, 1);
    if (r() > 0.8 && a > 0.5) {
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    }
  }
  ctx.globalAlpha = 1;
};

const PCOUNT = 220;
const drawParticles = (ctx: CanvasRenderingContext2D, p: number, f: number) => {
  const vis = win(p, 0.04, 0.12) * (1 - win(p, 0.86, 0.98));
  if (vis <= 0) return;
  const cols = ['#53f0e0', '#a67bff', '#e8fbff', '#7be8ff', '#c9a8ff', '#2fb8d8'];
  for (let i = 0; i < PCOUNT; i++) {
    const r = mulberry32(300 + i);
    const ang0 = r() * Math.PI * 2;
    const rb = 50 + r() * 250;
    const spin = (r() - 0.5) * 2.2;
    const delay = r() * 0.12;
    const size = r() > 0.7 ? 2 : 1;
    const col = cols[Math.floor(r() * cols.length)];
    let rad: number;
    let a: number;
    let alpha = 1;
    if (p < 0.5) {
      // inflow: drawn in towards the portal, spiralling
      const t = ewin(p, 0.04 + delay, 0.5, EASE.in);
      rad = rb * (1 - t * 0.92);
      a = ang0 + spin * t * 2.4;
      alpha = Math.min(1, win(p, 0.04 + delay, 0.14 + delay));
    } else {
      // outflow: bursts from the centre once the portal opens
      const t = ewin(p, 0.5 + delay * 0.6, 0.9, EASE.out);
      rad = 6 + (rb + 40) * t * 1.15;
      a = ang0 + spin * t * 1.2;
      alpha = 1 - win(p, 0.7, 0.92);
    }
    const flick = hash2(i, Math.floor(f / 2), 3) > 0.25 ? 1 : 0.35;
    const x = Math.round(CX + Math.cos(a) * rad);
    const y = Math.round(CY + Math.sin(a) * rad * 0.82);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * vis * flick));
    ctx.fillStyle = col;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * vis * flick * 0.45));
    const tx = Math.round(CX + Math.cos(a - spin * 0.05) * (rad + (p < 0.5 ? 4 : -4)));
    const ty = Math.round(CY + Math.sin(a - spin * 0.05) * (rad + (p < 0.5 ? 4 : -4)) * 0.82);
    ctx.fillRect(tx, ty, size, size);
  }
  ctx.globalAlpha = 1;
};

const Frames: FC<{p: number}> = ({p}) => {
  if (p > 0.5) return null;
  const pop = (k: number) => ewin(p, 0.01 + k * 0.006, 0.09 + k * 0.006, EASE.back);
  const vanish = 1 - win(p, 0.4, 0.5);
  return (
    <AbsoluteFill style={{opacity: vanish}}>
      {/* black void inside the frame, so the empty portal reads as a hole */}
      <div style={{position: 'absolute', left: WIDTH / 2 - BLOCK * 1.5, top: HEIGHT / 2 - BLOCK * 1.5, width: BLOCK * 3, height: BLOCK * 3, background: 'radial-gradient(circle, #04101a 0%, #010208 80%)', opacity: pop(6), boxShadow: 'inset 0 0 80px rgba(40,220,210,0.35)'}} />
      {/* dark glow pool under the frame */}
      <div style={{position: 'absolute', left: WIDTH / 2 - 700, top: HEIGHT / 2 - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,183,201,0.35) 0%, rgba(40,20,90,0.25) 38%, rgba(0,0,0,0) 66%)', opacity: pop(6)}} />
      {SLOTS.map((s, k) => {
        const sc = pop(k);
        const eyeT = ewin(p, 0.08 + k * 0.0085, 0.12 + k * 0.0085, EASE.back);
        const flash = Math.max(0, 1 - win(p, 0.09 + k * 0.0085, 0.16 + k * 0.0085));
        const st: CSSProperties = {position: 'absolute', left: WIDTH / 2 + s.i * BLOCK - BLOCK / 2, top: HEIGHT / 2 + s.j * BLOCK - BLOCK / 2, width: BLOCK, height: BLOCK, transform: `scale(${sc})`, opacity: Math.min(1, sc * 2)};
        return (
          <div key={k} style={st}>
            <div style={{position: 'absolute', inset: 0, boxShadow: '0 18px 0 #07140f, 0 0 60px rgba(40,230,200,0.25)'}} />
            <Img src={block('end_portal_frame_top')} style={{position: 'absolute', inset: 0, width: BLOCK, height: BLOCK, imageRendering: 'pixelated', transform: `rotate(${s.rot}deg)`}} />
            <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.35), inset 0 -16px 0 rgba(0,0,0,0.25)'}} />
            {eyeT > 0 && (
              <>
                <div style={{position: 'absolute', left: -60, top: -60, width: BLOCK + 120, height: BLOCK + 120, background: `radial-gradient(circle, rgba(120,255,230,${0.85 * flash}) 0%, rgba(60,200,255,${0.35 * flash}) 40%, rgba(0,0,0,0) 70%)`}} />
                <Img src={block('end_portal_frame_eye')} style={{position: 'absolute', inset: 0, width: BLOCK, height: BLOCK, imageRendering: 'pixelated', transform: `scale(${0.4 + eyeT * 0.6}) rotate(${s.rot}deg)`, filter: `brightness(${1 + flash * 1.4})`}} />
              </>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const gf = useCurrentFrame();
  const vign = win(p, 0.0, 0.12) * (1 - win(p, 0.5, 0.66));
  const flash = Math.max(0, 1 - Math.abs(p - 0.52) / 0.05) * 0.4;
  const [jx, jy] = jitter(gf, p > 0.28 && p < 0.52 ? 6 * win(p, 0.28, 0.5) : 0, 4);
  return (
    <AbsoluteFill style={{transform: `translate(${jx}px, ${jy}px)`}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(2,6,16,0.55) 0%, rgba(0,2,10,0.92) 85%)', opacity: vign}} />
      <Frames p={p} />
      <LowRes
        ready
        draw={(ctx) => {
          drawBgStars(ctx, p, f);
          drawField(ctx, p, f);
          drawParticles(ctx, p, f);
        }}
      />
      {/* teal/violet bloom over the field */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(120,255,240,0.22) 0%, rgba(120,90,255,0.14) 40%, rgba(0,0,0,0) 70%)', mixBlendMode: 'screen', opacity: Math.min(1, win(p, 0.2, 0.32)) * (1 - win(p, 0.6, 0.9))}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,12,0.6) 100%)', opacity: win(p, 0.3, 0.5) * (1 - win(p, 0.52, 0.8))}} />
      <AbsoluteFill style={{background: '#bffcff', opacity: flash, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

export const endPortalDef: TransitionDef & {mode: 'cut'} = {
  id: 't2-end-portal',
  name: '末地传送门',
  frames: T,
  mode: 'cut',
  a: (p) => ({filter: `brightness(${1 - 0.8 * win(p, 0, 0.08)}) saturate(${1 - 0.5 * win(p, 0, 0.08)})`, transform: `scale(${1 + 0.07 * ewin(p, 0.1, 0.5, EASE.in)})`}),
  b: (p) => (p < 0.5 ? {opacity: 0} : {filter: `brightness(${1 + 0.45 * (1 - win(p, 0.5, 0.78))})`, transform: `scale(${mix(0.88, 1, ewin(p, 0.5, 0.9, EASE.out))})`}),
  overlay: Overlay,
  cues: [
    {at: 0, src: 'mc:ambient/weather/thunder1', volume: 0.18, rate: 0.55},
    {at: 3, src: 'mc:dig/stone2', volume: 0.45, rate: 0.6},
    {at: 6, src: 'mc:random/click', volume: 0.4, rate: 1.5},
    {at: 8, src: 'mc:random/click', volume: 0.4, rate: 1.7},
    {at: 10, src: 'mc:random/click', volume: 0.4, rate: 1.9},
    {at: 13, src: 'mc:random/orb', volume: 0.4, rate: 0.6},
    {at: 30, src: 'mc:random/levelup', volume: 0.35, rate: 0.5},
  ],
};

export const endPortal = transitionEntry(endPortalDef, {
  id: 't2-end-portal',
  name: '末地传送门',
  category: 'transition',
  tags: ['末地', '传送门', '星空', '质感', '章节切换', '神秘'],
  blurb: '画面变暗，末地传送门框的 12 只眼睛逐个亮起，紫青星点涌出吞没整个画面，再从中心裂开散去，露出下一幕。',
  usage: '进入末地 / 异世界 / 神秘章节、穿越类剧情的转场。',
  params: [
    {name: 'BLOCK', desc: '传送门框方块边长（像素），默认 192'},
    {name: 'STAR_COLORS', desc: '星点色板（青、蓝、紫、白）'},
    {name: 'frames', desc: '转场长度，默认 66 帧；中点 p=0.5 为完全覆盖'},
  ],
});
