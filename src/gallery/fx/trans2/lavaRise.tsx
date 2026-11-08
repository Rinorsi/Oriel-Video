import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE, mulberry32} from '../../../mc/theme';
import {LH, LW, LowRes, loadImage, useAssets} from '../../../mg/LowRes';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {ewin, hash2, jitter, mix, smooth, vnoise, win} from './common';

/**
 * t2-lava-rise : pixel lava (the real animated lava texture) surges up from the bottom with bubbling, popping
 * edge and flying sparks, covers the screen, then drains again. On the way down the surface cools into an
 * obsidian crust with glowing cracks. Cut-type (B takes over at p = 0.5).
 * Params: CRUST (crust thickness in low-res px), BUBBLES (count), colours in the shading code.
 */

const T = 60;
const CRUST = 34;
const NB = 22;
const FULL = -34;

type Tex = {lava: Uint8ClampedArray; obs: Uint8ClampedArray};

const grab = (img: HTMLImageElement) => {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d')!;
  x.drawImage(img, 0, 0);
  return x.getImageData(0, 0, img.width, img.height).data;
};
const loadTex = async (): Promise<Tex> => {
  const [l, o] = await Promise.all([loadImage(block('lava_still')), loadImage(block('obsidian'))]);
  return {lava: grab(l), obs: grab(o)};
};

const SEQ = [...Array.from({length: 20}, (_, i) => i), ...Array.from({length: 18}, (_, i) => 18 - i)];

const levelY = (p: number) => {
  if (p <= 0.5) {
    const t = win(p, 0.0, 0.4);
    return mix(LH + 26, FULL, 0.45 * t + 0.55 * EASE.inOut(t));
  }
  const t = win(p, 0.5, 0.97);
  return mix(FULL, LH + 80, 0.3 * t + 0.7 * EASE.inOut(t));
};

type Bub = {x: number; period: number; off: number; r: number};
const BUBS: Bub[] = Array.from({length: NB}, (_, i) => {
  const r = mulberry32(120 + i);
  return {x: 14 + r() * (LW - 28), period: 20 + Math.floor(r() * 20), off: Math.floor(r() * 40), r: 7 + r() * 10};
});

/** Height (low-res px) of the bubble bump at frame f. */
const bubbleH = (b: Bub, f: number) => {
  const u = ((f + b.off) % b.period) / b.period;
  if (u < 0.5 || u > 0.93) return 0;
  const k = (u - 0.5) / 0.43;
  return b.r * 1.0 * Math.sin(k * Math.PI * 0.5);
};

const surface = (x: number, base: number, f: number, hs: number[]) => {
  let bump = 0;
  for (let i = 0; i < NB; i++) {
    const b = BUBS[i];
    const dx = (x - b.x) / b.r;
    if (dx > -1 && dx < 1) bump = Math.max(bump, hs[i] * Math.sqrt(1 - dx * dx));
  }
  return base + Math.sin(x / 23 + f * 0.12) * 4 + Math.sin(x / 9 - f * 0.2) * 2 + (vnoise(x / 14 + f * 0.05, 0, 7) - 0.5) * 8 - bump;
};

const LAVA_RIM = [255, 241, 168];
const LAVA_MID = [255, 193, 58];

const draw = (ctx: CanvasRenderingContext2D, tex: Tex, p: number, f: number) => {
  const base = levelY(p);
  const hs = BUBS.map((b) => bubbleH(b, f));
  const tops = new Float32Array(LW);
  for (let x = 0; x < LW; x++) tops[x] = surface(x, base, f, hs);
  const img = ctx.createImageData(LW, LH);
  const d = img.data;
  const fi = SEQ[Math.floor(f / 1.5) % SEQ.length];
  const crustK = ewin(p, 0.4, 0.58, EASE.out);
  const hot = Math.max(0, 1 - Math.abs(p - 0.47) / 0.1);
  for (let x = 0; x < LW; x++) {
    const t = tops[x];
    const ct = crustK > 0 ? CRUST * crustK * (0.72 + 0.55 * vnoise(x / 15, 3, 2)) : 0;
    const y0 = Math.max(0, Math.floor(t - 22));
    for (let y = y0; y < LH; y++) {
      const dep = y - t;
      const o = (y * LW + x) * 4;
      if (dep < 0) {
        // heat shimmer above the surface (dithered orange)
        const g = 1 - -dep / 22;
        if (g > 0 && (x + y) % 2 === 0 && hash2(x, y, 6) < g * 0.55) {
          d[o] = 255;
          d[o + 1] = 120 + hash2(x, y, 3) * 70;
          d[o + 2] = 30;
          d[o + 3] = 150 * g + 40;
        }
        continue;
      }
      const u = (((x + Math.round(Math.sin(y / 6 + f * 0.17) * 2) - Math.floor(f * 0.4)) % 16) + 16) % 16;
      const v = (((y + Math.floor(f * 0.25)) % 16) + 16) % 16;
      const li = ((fi * 16 + v) * 16 + u) * 4;
      let r = tex.lava[li];
      let g = tex.lava[li + 1];
      let b = tex.lava[li + 2];
      const blot = 0.95 + 0.4 * vnoise(x / 20 + f * 0.02, y / 20, 2);
      const depth = 1 - 0.22 * smooth(Math.min(1, dep / 150));
      const vein = Math.max(0, vnoise(x / 19 - f * 0.04, y / 19 + f * 0.03, 5) * 0.6 + vnoise(x / 7, y / 7 + f * 0.05, 6) * 0.4 - 0.56) * 2.2;
      const near = 1 - smooth(Math.min(1, dep / 46));
      r = Math.min(255, r * blot * depth * 1.2 + 50 * vein + 36 * near);
      g = Math.min(255, g * blot * depth * 1.15 + 85 * vein + 50 * near);
      b = Math.min(255, b * blot * depth + 20 * vein + 12 * near);
      const dd = dep + (vnoise(x / 8, y / 8, 11) - 0.5) * 6;
      if (dd < ct) {
        // obsidian crust
        const oi = ((y % 16) * 16 + (x % 16)) * 4;
        const shade = 0.7 + 0.6 * vnoise(x / 6, y / 6, 21);
        let orr = tex.obs[oi] * shade;
        let ogg = tex.obs[oi + 1] * shade;
        let obb = tex.obs[oi + 2] * shade;
        if (dep < 2.2) {
          orr = 120;
          ogg = 84;
          obb = 190;
        }
        const crack = Math.abs(vnoise(x / 11, y / 11, 31) - 0.5);
        const crack2 = Math.abs(vnoise(x / 5 + 40, y / 5, 33) - 0.5);
        const under = ct - dd; // distance to the hot underside
        if (crack < 0.022 || (crack2 < 0.011 && dep > 4) || under < 3) {
          const k = under < 3 ? 1 - under / 4 : 0.9;
          orr = mix(orr, r, k);
          ogg = mix(ogg, g, k);
          obb = mix(obb, b, k);
        }
        d[o] = orr;
        d[o + 1] = ogg;
        d[o + 2] = obb;
        d[o + 3] = 255;
        continue;
      }
      if (dep < 3.5) {
        const k = dep < 1.6 ? 1 : 0.55;
        r = mix(r, dep < 1.6 ? LAVA_RIM[0] : LAVA_MID[0], k);
        g = mix(g, dep < 1.6 ? LAVA_RIM[1] : LAVA_MID[1], k);
        b = mix(b, dep < 1.6 ? LAVA_RIM[2] : LAVA_MID[2], k);
      }
      if (hash2(x, y, 90 + (f >> 1)) > 0.9965) {
        r = 255;
        g = 245;
        b = 190;
      }
      if (hot > 0) {
        r = mix(r, 255, hot * 0.25);
        g = mix(g, 190, hot * 0.2);
      }
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = b;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // rising bubbles inside the lava
  for (let i = 0; i < 30; i++) {
    const rg = mulberry32(700 + i);
    const x = Math.floor(rg() * LW);
    const sp = 0.012 + rg() * 0.02;
    const k = (f * sp + rg()) % 1;
    const rad = 2 + Math.floor(rg() * 3);
    const t = tops[Math.min(LW - 1, x)];
    const y = Math.floor(t + 4 + (1 - k) * 120);
    if (y > LH + 6 || y < 0 || y - t < rad + 3) continue;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ffe27a';
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      ctx.fillRect(Math.round(x + Math.cos(ang) * rad), Math.round(y + Math.sin(ang) * rad), 1, 1);
    }
    ctx.fillStyle = '#fff6c4';
    ctx.fillRect(x - Math.floor(rad / 2), y - Math.floor(rad / 2), 1, 1);
  }
  ctx.globalAlpha = 1;

  // sparks and bubble-pop splashes
  const cols = ['#fff1a8', '#ffc13a', '#ff8a1a', '#ff5a10'];
  for (let i = 0; i < 130; i++) {
    const rg = mulberry32(2000 + i);
    const rising = i < 80;
    const pb = rising ? 0.04 + rg() * 0.44 : 0.52 + rg() * 0.42;
    const life = 18 + rg() * 20;
    const age = (p - pb) * T;
    if (age < 0 || age > life) continue;
    const x0 = rg() * LW;
    const y0 = levelY(pb) + (rising ? 0 : -2);
    const vx = (rg() - 0.5) * 2.4;
    const vy = -(1.8 + rg() * 3.6);
    const x = x0 + vx * age;
    const y = y0 + vy * age + 0.1 * age * age;
    const k = 1 - age / life;
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.fillStyle = cols[Math.floor(rg() * cols.length)];
    const s = rg() > 0.75 ? 3 : rg() > 0.4 ? 2 : 1;
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
    ctx.globalAlpha *= 0.4;
    ctx.fillRect(Math.round(x - vx * 1.5), Math.round(y - vy * 1.5), 1, 1);
  }
  for (let i = 0; i < NB; i++) {
    const b = BUBS[i];
    const tp = ((f + b.off) % b.period) - b.period * 0.93;
    if (tp < 0 || tp > 12) continue;
    const sy = tops[Math.min(LW - 1, Math.max(0, Math.round(b.x)))];
    for (let s = 0; s < 7; s++) {
      const rg = mulberry32(i * 31 + s);
      const ang = -Math.PI * (0.15 + 0.7 * rg());
      const sp = 1.2 + rg() * 2.2;
      ctx.globalAlpha = 1 - tp / 12;
      ctx.fillStyle = cols[s % cols.length];
      ctx.fillRect(Math.round(b.x + Math.cos(ang) * sp * tp), Math.round(sy + Math.sin(ang) * sp * tp + 0.12 * tp * tp), 2, 2);
    }
  }
  ctx.globalAlpha = 1;
};

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const gf = useCurrentFrame();
  const tex = useAssets('trans2-lava', loadTex);
  const base = levelY(p);
  const surge = Math.sin(Math.PI * win(p, 0.02, 0.46));
  const [jx, jy] = jitter(gf, 2 + 5 * surge * win(p, 0.3, 0.46), 9);
  const glowTop = base * 4;
  return (
    <AbsoluteFill style={{transform: `translate(${p < 0.5 ? jx : 0}px, ${p < 0.5 ? jy : 0}px)`}}>
      {/* heat glow above the surface and orange rim light on the screen edges */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 100%, rgba(255,110,20,0.5) 0%, rgba(255,80,10,0.18) 45%, rgba(255,60,0,0) 75%)', opacity: win(p, 0.0, 0.2) * (1 - win(p, 0.4, 0.5)), mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: glowTop - 520, height: 520, background: 'linear-gradient(180deg, rgba(255,110,20,0), rgba(255,130,30,0.5))', mixBlendMode: 'screen', opacity: base < 270 && base > -40 ? 1 : 0}} />
      <LowRes ready={!!tex} draw={(ctx) => tex && draw(ctx, tex, p, f)} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(120,20,0,0) 50%, rgba(90,10,0,0.55) 100%)', opacity: win(p, 0.3, 0.46) * (1 - win(p, 0.56, 0.8))}} />
      <AbsoluteFill style={{background: '#ffd27a', opacity: Math.max(0, 1 - Math.abs(p - 0.455) / 0.04) * 0.35, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

export const lavaRiseDef: TransitionDef & {mode: 'cut'} = {
  id: 't2-lava-rise',
  name: '熔岩涌上',
  frames: T,
  mode: 'cut',
  a: (p) => {
    const heat = win(p, 0, 0.44);
    const [jx, jy] = jitter(Math.round(p * T), 4 * heat, 5);
    return {transform: `translate(${jx}px, ${jy}px) scale(${1 + 0.03 * heat})`, filter: `sepia(${0.5 * heat}) saturate(${1 + 0.8 * heat}) brightness(${1 + 0.18 * heat}) contrast(${1 + 0.1 * heat})`};
  },
  b: (p) => (p < 0.5 ? {opacity: 0} : {filter: `sepia(${0.45 * (1 - win(p, 0.5, 0.95))}) saturate(${1 + 0.6 * (1 - win(p, 0.5, 0.95))}) brightness(${1 + 0.25 * (1 - win(p, 0.5, 0.9))})`}),
  overlay: Overlay,
  cues: [
    {at: 0, src: 'mc:fire/ignite', volume: 0.5, rate: 0.7},
    {at: 3, src: 'mc:block/furnace/fire_crackle1', volume: 0.45, rate: 0.8},
    {at: 8, src: 'mc:random/pop', volume: 0.3, rate: 0.6},
    {at: 13, src: 'mc:random/pop', volume: 0.3, rate: 0.75},
    {at: 18, src: 'mc:ambient/weather/thunder1', volume: 0.2, rate: 0.5},
    {at: 27, src: 'mc:block/furnace/fire_crackle1', volume: 0.5, rate: 1.0},
    {at: 34, src: 'mc:dig/stone3', volume: 0.5, rate: 0.55},
    {at: 38, src: 'mc:random/pop', volume: 0.3, rate: 0.9},
  ],
};

export const lavaRise = transitionEntry(lavaRiseDef, {
  id: 't2-lava-rise',
  name: '熔岩涌上',
  category: 'transition',
  tags: ['熔岩', '下界', '火焰', '质感', '像素', '章节切换'],
  blurb: '真贴图的像素熔岩从底部翻涌而上，顶部气泡鼓起破裂、火星飞溅，淹没画面；退去时表面冷却成带发光裂纹的黑曜石硬壳。',
  usage: '进入下界 / 熔岩洞穴 / 高温、危险、爆发类场景的转场。',
  params: [
    {name: 'CRUST', desc: '黑曜石硬壳厚度（低分辨率像素），默认 34'},
    {name: 'NB', desc: '气泡数量，默认 18'},
    {name: 'frames', desc: '转场长度，默认 60 帧'},
  ],
});
