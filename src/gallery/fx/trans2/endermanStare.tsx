import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {tex} from '../../../mc/assets';
import {EASE, HEIGHT, WIDTH, mulberry32} from '../../../mc/theme';
import {Crop} from '../../mob';
import {LH, LW, LowRes} from '../../../mg/LowRes';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {TexBox, boxUV} from './box3d';
import {blit, ewin, hash2, hexToRgb, mix, mixRgb, smooth, vnoise, win} from './common';

/**
 * t2-enderman-stare : the shot sinks into darkness, a real enderman head (enderman.png as a 3D box, enderman_eyes.png
 * glowing on top) fades in; it scans the room by turning left and right, then locks onto the viewer while purple
 * particles swirl in; the face rushes at the camera, floods the screen purple-white, and the purple fog teleports
 * away in a pixel dissolve to reveal B. Cut-type (B takes over at p = 0.5).
 * Params: S (screen px per texel of the head), PARTS (particle count), colours in PURPLES, EYE_Y (eye line, screen px).
 */

const T = 66;
const CX = LW / 2;
const CY = 128;
const S = 56; // head = 448 px wide
const EYE_Y = CY * 4;
const PARTS = 260;
const PURPLES = ['#b25cff', '#8a3cdc', '#e6a8ff', '#5a1f9a', '#d27bff', '#f6d8ff'];
const SRC = tex('entity/enderman/enderman.png');
const EYES = tex('entity/enderman/enderman_eyes.png');
const HEAD = boxUV(0, 0, 8, 8, 8);

const eyeState = (p: number) => {
  const open = p < 0.2 ? 0 : ewin(p, 0.2, 0.3, EASE.out) * (p < 0.23 ? (Math.floor(p * T) % 2 ? 0.4 : 1) : 1);
  // head scans left, right, then locks on to the middle
  const scan = win(p, 0.3, 0.4);
  let look = 0;
  if (p > 0.28 && p < 0.42) look = scan < 0.3 ? -1 * (scan / 0.3) : scan < 0.62 ? mix(-1, 1, (scan - 0.3) / 0.32) : mix(1, 0, EASE.back((scan - 0.62) / 0.38));
  const scale = 1 + 0.02 * Math.sin(p * T * 0.55) * win(p, 0.3, 0.4) + 5.5 * Math.pow(win(p, 0.42, 0.5), 2.2);
  // blink right after the flood
  const blink = p > 0.5 && p < 0.58 ? 1 - Math.sin(Math.PI * win(p, 0.5, 0.58)) : 1;
  return {open: open * (p > 0.5 ? blink : 1), look, scale};
};

/** The enderman head: real texture, 3D, lit only by its own eyes. */
const Head: FC<{open: number; yaw: number; pitch: number}> = ({open, yaw, pitch}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `perspective(1800px) rotateX(${pitch}deg) rotateY(${yaw}deg)`}}>
    <TexBox
      src={SRC}
      sheet={[64, 32]}
      w={8}
      h={8}
      d={8}
      s={S}
      style={{transform: `translateY(${-0.5 * S}px)`}}
      faces={{
        front: {
          rect: HEAD.front,
          children: (
            <>
              <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 56%, rgba(190,90,255,${0.42 * open}) 0%, rgba(120,40,200,${0.18 * open}) 55%, rgba(60,10,110,0) 100%)`}} />
              <Crop src={EYES} sheet={[64, 32]} rect={HEAD.front} scale={S} style={{position: 'absolute', left: 0, top: 0, opacity: open, filter: `drop-shadow(0 0 ${S * 0.6}px #c35bff) drop-shadow(0 0 ${S * 0.2}px #ffffff)`}} />
            </>
          ),
        },
        left: {rect: HEAD.left, shade: 0.1},
        right: {rect: HEAD.right, shade: 0.1},
        top: {rect: HEAD.top},
        back: {rect: HEAD.back},
      }}
    />
  </div>
);

const drawHaze = (ctx: CanvasRenderingContext2D, p: number, f: number) => {
  const a = win(p, 0.12, 0.34) * (1 - win(p, 0.46, 0.5));
  if (a <= 0) return;
  const img = ctx.createImageData(LW, LH);
  const d = img.data;
  for (let y = 0; y < LH; y += 1) {
    for (let x = 0; x < LW; x += 1) {
      const n = vnoise(x / 30 + f * 0.01, y / 30 - f * 0.012, 3) * 0.6 + vnoise(x / 11, y / 11 + f * 0.02, 4) * 0.4;
      const edge = Math.min(1, Math.hypot((x - CX) / 270, (y - CY) / 190));
      const v = n * edge * a;
      if (v > 0.18 && (hash2(x, y, 2) < v * 0.8)) {
        const o = (y * LW + x) * 4;
        d[o] = 70 + n * 70;
        d[o + 1] = 20 + n * 20;
        d[o + 2] = 120 + n * 90;
        d[o + 3] = 60 + v * 130;
      }
    }
  }
  blit(ctx, img);
};

const drawParticles = (ctx: CanvasRenderingContext2D, p: number, f: number) => {
  for (let i = 0; i < PARTS; i++) {
    const r = mulberry32(400 + i);
    const ang0 = r() * Math.PI * 2;
    const r0 = 40 + r() * 270;
    const spin = (r() > 0.5 ? 1 : -1) * (0.6 + r() * 1.6);
    const delay = r() * 0.16;
    const size = r() > 0.8 ? 3 : r() > 0.45 ? 2 : 1;
    const col = PURPLES[Math.floor(r() * PURPLES.length)];
    let rad: number;
    let ang: number;
    let alpha: number;
    if (p < 0.5) {
      const t = ewin(p, 0.06 + delay, 0.48, EASE.in);
      rad = r0 * (1 - 0.94 * t);
      ang = ang0 + spin * t * 2.6;
      alpha = win(p, 0.06 + delay, 0.16 + delay);
    } else {
      const t = ewin(p, 0.56 + delay * 0.8, 0.92, EASE.out);
      rad = 4 + (r0 + 60) * t * 1.1;
      ang = ang0 + spin * t * 1.4;
      alpha = (1 - win(p, 0.74, 0.94)) * win(p, 0.56 + delay * 0.8, 0.6 + delay * 0.8);
    }
    if (alpha <= 0) continue;
    const flick = hash2(i, f >> 1, 8) > 0.2 ? 1 : 0.3;
    const x = Math.round(CX + Math.cos(ang) * rad * 1.15);
    const y = Math.round(CY + Math.sin(ang) * rad * 0.8);
    ctx.globalAlpha = Math.min(1, alpha * flick);
    ctx.fillStyle = col;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = Math.min(1, alpha * flick) * 0.4;
    ctx.fillRect(x + (p < 0.5 ? 2 : -2), y + 1, size, size);
  }
  ctx.globalAlpha = 1;
};

const drawFog = (ctx: CanvasRenderingContext2D, p: number, f: number) => {
  if (p < 0.49) return;
  const dark = hexToRgb('#240a46');
  const bright = hexToRgb('#f0d2ff');
  const mid = hexToRgb('#8a3cdc');
  const warm = win(p, 0.5, 0.64);
  const q = 1 - ewin(p, 0.6, 0.92, EASE.inOut);
  const img = ctx.createImageData(LW, LH);
  const d = img.data;
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      const h = hash2(x >> 1, y >> 1, 12) * 0.7 + vnoise(x / 16, y / 16, 6) * 0.3;
      if (h > q) continue;
      const n = vnoise(x / 26 + f * 0.03, y / 26 - f * 0.01, 9) * 0.6 + vnoise(x / 9, y / 9 - f * 0.05, 10) * 0.4;
      const band = Math.floor(n * 4.4) / 4;
      let c = mixRgb(mixRgb(bright, mid, smooth(Math.min(1, warm * 1.6))), dark, smooth(Math.max(0, warm - 0.3) / 0.7));
      c = mixRgb(c, [118, 52, 214], band * band * 0.95 * warm);
      c = mixRgb(c, [12, 3, 28], Math.pow(1 - band, 2) * 0.75 * warm);
      if (q - h < 0.05) c = mixRgb(c, [250, 215, 255], 0.8);
      else if (q - h < 0.1) c = mixRgb(c, [190, 100, 255], 0.5);
      const o = (y * LW + x) * 4;
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
    }
  }
  blit(ctx, img);
};

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const dark = ewin(p, 0.04, 0.3, EASE.inOut) * (1 - win(p, 0.48, 0.5));
  const st = eyeState(p);
  const pulse = 0.75 + 0.25 * Math.sin(f * 0.5);
  const eyeA = st.open * (p < 0.5 ? 1 : 1 - win(p, 0.5, 0.58));
  const flood = ewin(p, 0.4, 0.5, EASE.in);
  const lock = win(p, 0.4, 0.46);
  const yaw = st.look * 30 * (1 - lock);
  const pitch = -3 * win(p, 0.3, 0.42) * (1 - lock) + Math.sin(f * 0.3) * 0.6 * win(p, 0.22, 0.3);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{background: '#07030c', opacity: dark}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(60,10,110,0) 20%, rgba(25,4,50,0.8) 100%)', opacity: win(p, 0.04, 0.25) * (1 - win(p, 0.46, 0.5))}} />
      {/* soft purple bloom behind the head, centred on the eyes */}
      <div style={{position: 'absolute', left: WIDTH / 2 - 700 * st.scale, top: EYE_Y - 420 * st.scale, width: 1400 * st.scale, height: 840 * st.scale, background: 'radial-gradient(ellipse, rgba(170,70,240,0.5) 0%, rgba(120,40,210,0.2) 40%, rgba(80,10,170,0) 70%)', opacity: eyeA * pulse * (p < 0.46 ? 1 : 0.7), mixBlendMode: 'screen'}} />
      <LowRes
        ready
        draw={(ctx) => {
          drawHaze(ctx, p, f);
          drawParticles(ctx, p, f);
          drawFog(ctx, p, f);
        }}
      />
      {/* the head sits above the haze but below the fog dissolve */}
      {p < 0.5 && st.open > 0.02 && (
        <div style={{position: 'absolute', left: WIDTH / 2, top: EYE_Y, width: 0, height: 0, transform: `scale(${st.scale})`}}>
          <Head open={st.open * pulse} yaw={yaw} pitch={pitch} />
        </div>
      )}
      {/* the purple-white flood as the eyes reach the camera */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f0d2ff 34%, #b25cff 66%, rgba(90,20,170,0.85) 100%)', opacity: flood * (p < 0.5 ? 1 : 0)}} />
    </AbsoluteFill>
  );
};

export const endermanStareDef: TransitionDef & {mode: 'cut'} = {
  id: 't2-enderman-stare',
  name: '末影人盯着我看',
  frames: T,
  mode: 'cut',
  a: (p) => ({transform: `scale(${1 + 0.12 * win(p, 0, 0.3)})`, filter: `brightness(${1 - 0.8 * win(p, 0, 0.2)}) saturate(${1 - 0.7 * win(p, 0, 0.2)})`}),
  b: (p) => (p < 0.5 ? {opacity: 0} : {transform: `scale(${mix(1.08, 1, ewin(p, 0.56, 0.9, EASE.out))})`, filter: `brightness(${1 + 0.6 * (1 - win(p, 0.6, 0.9))}) hue-rotate(${(1 - win(p, 0.6, 0.9)) * -30}deg)`}),
  overlay: Overlay,
  cues: [
    {at: 0, src: 'mc:ambient/weather/thunder1', volume: 0.3, rate: 0.4},
    {at: 12, src: 'mc:random/orb', volume: 0.4, rate: 0.35},
    {at: 17, src: 'mc:random/click', volume: 0.5, rate: 0.5},
    {at: 21, src: 'mc:random/orb', volume: 0.3, rate: 0.5},
    {at: 26, src: 'mc:ambient/weather/thunder1', volume: 0.3, rate: 0.55},
    {at: 34, src: 'mc:random/levelup', volume: 0.3, rate: 0.4},
    {at: 38, src: 'mc:random/click', volume: 0.5, rate: 0.7},
    {at: 45, src: 'mc:random/pop', volume: 0.3, rate: 1.7},
    {at: 49, src: 'mc:random/pop', volume: 0.3, rate: 1.9},
    {at: 53, src: 'mc:random/pop', volume: 0.3, rate: 1.5},
  ],
};

export const endermanStare = transitionEntry(endermanStareDef, {
  id: 't2-enderman-stare',
  name: '末影人盯着我看',
  category: 'transition',
  tags: ['末影人', '玩梗', '紫色', '恐怖', '凝视', '惊吓'],
  blurb: '画面沉入黑暗，真实贴图的末影人脑袋（3D 方块）在黑暗中亮起两只发光的紫色眼睛，缓缓左右转头扫视后正对镜头死死盯住你，紫色粒子涌来；脑袋猛扑镜头吞没画面，一眨眼后紫雾像瞬移一样碎成像素散去。',
  usage: '悬疑 / 惊吓 / 「别看它」「它在看着你」类的玩梗转场，也适合末地、夜晚场景。',
  params: [
    {name: 'S', desc: '头部每个贴图像素的屏幕大小，默认 56（头宽 448px）'},
    {name: 'PARTS', desc: '紫色粒子数量，默认 260'},
    {name: 'PURPLES', desc: '粒子配色'},
  ],
});

void HEIGHT;
