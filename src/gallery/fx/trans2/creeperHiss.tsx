import type {FC} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {tex} from '../../../mc/assets';
import {EASE, HEIGHT, WIDTH, mulberry32} from '../../../mc/theme';
import type {TransitionDef} from '../../../reel/transitions';
import {Crop} from '../../mob';
import {transitionEntry} from '../../transition';
import {SquareBurst, ewin, jitter, mix, win} from './common';

/**
 * t2-creeper-hiss : no words, only the face. The shot swells and shakes, flashing white faster and faster like a primed
 * creeper, while the real vanilla creeper face (creeper.png, 8x8 texels) bulges up from the middle until it fills the frame.
 * The last frames squeeze everything inward, then it blows: the face bursts into its 64 real texels flying at the camera,
 * the vanilla explosion sprites and smoke take over, and B is revealed with a shaking, blurry kick.
 * Cut-type (B takes over at p = 0.5). Params: TS (texel size at full bulge), BOOM (when it blows), PIECES (burst speed).
 */

const T = 72;
const BOOM = 0.5;
const TS = 200; // px per creeper texel when the face is full size (face = 1600 px)
const SQUEEZE = 0.18;
const FACE = tex('entity/creeper/creeper.png');
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

/** Flash cycles grow faster and faster, like the creeper's swelling flicker. */
const beat = (p: number) => {
  const k = win(p, 0.04, BOOM);
  const cycles = 1.6 + 17 * Math.pow(k, 1.55);
  return p > BOOM - 0.035 && p < BOOM ? 1 : cycles % 1 < 0.5 ? 1 : 0;
};
const squeezeOf = (p: number) => EASE.inOut(win(p, BOOM - 0.07, BOOM));

type Shard = {x: number; y: number; vx: number; vy: number; spin: number; dz: number; delay: number};
const SHARDS: Shard[] = [];
for (let y = 0; y < 8; y++)
  for (let x = 0; x < 8; x++) {
    const r = mulberry32(x * 31 + y * 97 + 5);
    const ox = x - 3.5;
    const oy = y - 3.5;
    const ang = Math.atan2(oy, ox) + (r() - 0.5) * 0.6;
    const sp = 16 + r() * 18 + Math.hypot(ox, oy) * 4;
    SHARDS.push({x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 6, spin: (r() - 0.5) * 520, dz: 0.008 + r() * 0.022, delay: Math.floor(r() * 2)});
  }

const SPRITES = [
  {x: CX, y: CY, size: 1000, d: 0},
  {x: 520, y: 340, size: 560, d: 2},
  {x: 1400, y: 320, size: 600, d: 3},
  {x: 480, y: 780, size: 540, d: 4},
  {x: 1440, y: 770, size: 580, d: 5},
];
const SMOKE = [
  {x: 360, y: 640, size: 1000, d: 5, drift: -40},
  {x: 1560, y: 600, size: 1050, d: 6, drift: 40},
  {x: CX, y: 420, size: 1200, d: 8, drift: 0},
  {x: 760, y: 860, size: 900, d: 9, drift: -20},
  {x: 1200, y: 880, size: 900, d: 10, drift: 20},
];

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const pre = p < BOOM;
  const sw = EASE.in(win(p, 0.04, BOOM));
  const sq = pre ? squeezeOf(p) : 1;
  const on = pre ? beat(p) : 0;
  const bulge = Math.pow(win(p, 0.1, BOOM - 0.07), 1.7);
  const texel = mix(40, TS, bulge) * (1 + 0.035 * on) * (1 - SQUEEZE * sq);
  const faceA = Math.min(1, win(p, 0.1, 0.18) * 1.6);
  const [sx, sy] = jitter(f, pre ? 2 + 26 * sw * sw : 0, 3);
  const boomK = p >= BOOM ? (p - BOOM) * T : -1; // frames since the explosion
  const [kx, ky] = jitter(f, boomK >= 0 ? Math.max(0, 22 * (1 - boomK / 12)) : 0, 9);
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: boomK >= 0 ? `translate(${kx}px, ${ky}px)` : undefined}}>
      {pre && <AbsoluteFill style={{background: 'rgba(40,200,70,1)', opacity: 0.22 * sw, mixBlendMode: 'multiply'}} />}
      {/* the face: whole while it charges */}
      {pre && faceA > 0.01 && (
        <Crop src={FACE} sheet={[64, 32]} rect={[8, 8, 8, 8]} scale={TS} style={{position: 'absolute', left: CX - 4 * TS + sx, top: CY - 4 * TS + sy, opacity: faceA, transform: `scale(${texel / TS})`, transformOrigin: '50% 50%'}}>
          <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: on * 0.7}} />
        </Crop>
      )}
      {/* ...and in 64 real texels once it blows */}
      {boomK >= 0 &&
        SHARDS.map((s, i) => {
          const t = boomK - s.delay;
          const base = TS * (1 - SQUEEZE);
          const cx0 = CX + (s.x - 3.5) * base;
          const cy0 = CY + (s.y - 3.5) * base;
          if (t > 18) return null;
          if (t < 0) return <Crop key={i} src={FACE} sheet={[64, 32]} rect={[8 + s.x, 8 + s.y, 1, 1]} scale={TS} style={{position: 'absolute', left: cx0 - TS / 2, top: cy0 - TS / 2, transform: `scale(${1 - SQUEEZE})`}} />;
          const k = (1 - Math.pow(0.9, t)) / 0.1;
          const dx = s.vx * k;
          const dy = s.vy * k + 0.5 * 1.1 * t * t;
          const fade = 1 - win(t, 8, 18);
          return <Crop key={i} src={FACE} sheet={[64, 32]} rect={[8 + s.x, 8 + s.y, 1, 1]} scale={TS} style={{position: 'absolute', left: cx0 - TS / 2, top: cy0 - TS / 2, transform: `translate(${dx}px, ${dy}px) rotate(${(s.spin * t) / 24}deg) scale(${(1 - SQUEEZE) * (1 + t * s.dz)})`, opacity: fade}} />;
        })}
      {/* white flicker on the beat, dark green pressure at the edges */}
      {pre && <AbsoluteFill style={{background: '#fff', opacity: on * (0.1 + 0.3 * sw), mixBlendMode: 'screen'}} />}
      {pre && <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(10,60,20,0.65) 100%)', opacity: Math.min(1, sw + sq * 0.4)}} />}
      {/* explosion */}
      {boomK >= 0 && (
        <>
          <AbsoluteFill style={{background: '#fff', opacity: Math.max(0, 1 - boomK / 5)}} />
          {SPRITES.map((s, i) => {
            const t = boomK - s.d;
            if (t < 0 || t > 15) return null;
            return <Img key={i} src={tex(`particle/explosion_${Math.floor(t)}.png`)} style={{position: 'absolute', left: s.x - s.size / 2, top: s.y - s.size / 2, width: s.size, height: s.size, imageRendering: 'pixelated'}} />;
          })}
          {SMOKE.map((s, i) => {
            const t = boomK - s.d;
            if (t < 0 || t > 24) return null;
            return <Img key={i} src={tex(`particle/big_smoke_${Math.min(11, Math.floor(t / 2))}.png`)} style={{position: 'absolute', left: s.x - s.size / 2 + s.drift * (t / 24), top: s.y - s.size / 2 - t * 8, width: s.size, height: s.size, imageRendering: 'pixelated', opacity: 0.85 * (1 - win(t, 14, 24)), filter: 'brightness(0.55)'}} />;
          })}
        </>
      )}
      <SquareBurst p={p} T={T} p0={BOOM} x={CX} y={CY} count={150} colors={['#6fd05a', '#4f9a3e', '#16220f', '#c6c6c6', '#8a8a8a', '#ffd23f']} speed={46} life={34} size={26} gravity={0.7} seed={5} />
    </AbsoluteFill>
  );
};

export const creeperHissDef: TransitionDef & {mode: 'cut'} = {
  id: 't2-creeper-hiss',
  name: '苦力怕引爆',
  frames: T,
  mode: 'cut',
  a: (p) => {
    const sw = EASE.in(win(p, 0.04, BOOM));
    const sq = squeezeOf(p);
    const on = beat(p);
    const [jx, jy] = jitter(Math.round(p * T), 2 + 22 * sw * sw, 2);
    return {transform: `translate(${jx}px, ${jy}px) scale(${1 + 0.24 * sw - 0.3 * sq})`, filter: `brightness(${1 + on * (0.2 + 0.5 * sw)}) saturate(${1 + 0.4 * sw}) hue-rotate(${sw * 25}deg)`};
  },
  b: (p) => {
    if (p < BOOM) return {opacity: 0};
    const k = win(p, BOOM, 0.78);
    const [jx, jy] = jitter(Math.round(p * T), 34 * (1 - k), 12);
    return {transform: `translate(${jx}px, ${jy}px) scale(${mix(1.12, 1, EASE.out(k))})`, filter: `brightness(${1 + 1.4 * (1 - k)}) blur(${12 * (1 - k)}px)`};
  },
  overlay: Overlay,
  cues: [
    {at: 0, src: 'mc:random/fuse', volume: 0.75},
    {at: 18, src: 'mc:random/fuse', volume: 0.6, rate: 1.15},
    {at: 30, src: 'mc:random/click', volume: 0.35, rate: 1.8},
    {at: 33, src: 'mc:random/click', volume: 0.35, rate: 2.0},
    {at: 35, src: 'mc:random/click', volume: 0.35, rate: 2.2},
    {at: 36, src: 'mc:random/explode1', volume: 0.9},
    {at: 37, src: 'mc:random/explode3', volume: 0.5, rate: 0.8},
    {at: 39, src: 'mc:dig/gravel1', volume: 0.5, rate: 0.8},
    {at: 42, src: 'mc:dig/stone2', volume: 0.35, rate: 0.9},
  ],
};

export const creeperHiss = transitionEntry(creeperHissDef, {
  id: 't2-creeper-hiss',
  name: '苦力怕引爆',
  category: 'transition',
  tags: ['苦力怕', '爆炸', '玩梗', '蓄力', '章节切换'],
  blurb: '画面像引爆前的苦力怕一样逐渐膨胀、越抖越凶、白光越闪越快，真实贴图的苦力怕脸从中间越鼓越大压满屏幕；最后画面向内一压，轰地炸开，脸碎成 64 个原版像素块飞向镜头，原版爆炸与烟雾接管，下一幕带着冲击闪现。',
  usage: '危险降临 / 反转前的蓄力 / 「完了」「要炸了」的玩梗转场。无任何文字，靠音效 + 画面。',
  params: [
    {name: 'TS', desc: '脸完全鼓满时每个贴图像素的大小，默认 200（脸宽 1600px）'},
    {name: 'BOOM', desc: '爆炸发生在转场的比例位置，默认 0.5'},
    {name: 'beat()', desc: '闪白节奏曲线（越来越快）'},
  ],
});
