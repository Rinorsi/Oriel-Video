import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Pix, W, H, INK, hash, lerp, outBack, inCubic, inOutCubic, seg} from './kit';
import {Chips, Streaks} from './impact';
import {heartOf, starOf} from './sprites';

/**
 * cute-ribbon-curtain: sixteen candy-coloured ribbons (swallowtail ends, printed with hearts and stars) drop from a gold
 * curtain rod and swing; then a gust (wind streaks) bunches them up toward both sides, centre first, and slides them off.
 * Cut-type: curtain closed by t~20, B swaps in at t=21, opens t=27..53.
 * Tunables: N (ribbons), COLORS, OPEN (frame the gust starts).
 */

const T = 54;
const OPEN = 27;
const N = 16;
const SW = W / N;
const RW = SW + 14;
const LEN = H + 140;
const COLORS = [FLAT.pink, FLAT.yellow, FLAT.mint, FLAT.sky, FLAT.lilac, FLAT.orange, FLAT.red, FLAT.teal];
const DARK = [FLAT.pinkDeep, FLAT.yellowDeep, '#6fd69b', FLAT.skyDeep, '#b79bff', '#e07a1c', FLAT.redDeep, '#2aa9a2'];

const Ribbon: FC<{t: number; i: number}> = ({t, i}) => {
  const d = hash(i, 3) * 5;
  const fall = outBack(seg(t, d, d + 11), 1.5);
  const land = Math.max(0, t - d - 11);
  const r = Math.abs(i - (N - 1) / 2);
  const g = inOutCubic(seg(t, OPEN + r * 0.4, OPEN + r * 0.4 + 15));
  const out = inCubic(seg(t, OPEN + 12 + r * 0.4, OPEN + 24 + r * 0.4));
  const left = i < N / 2;
  const x0 = i * SW + SW / 2;
  const edge = left ? 24 + i * 6 : W - 24 - (N - 1 - i) * 6;
  const x = lerp(x0, edge, g) + (left ? -1 : 1) * out * 260;
  const sx = lerp(1, 0.22, g);
  const sway = Math.sin(t * 0.42 + i * 0.55) * (0.8 + 3 * Math.exp(-land * 0.12)) + Math.sin(g * Math.PI) * (left ? -1 : 1) * 12;
  const y = -(LEN + 60) * (1 - fall);
  const col = COLORS[i % COLORS.length];
  const dark = DARK[i % DARK.length];
  const notch = 70;
  return (
    <div style={{position: 'absolute', left: x - RW / 2, top: y, width: RW, height: LEN, transform: `rotate(${sway}deg) scaleX(${sx})`, transformOrigin: '50% 0', zIndex: i % 2 ? 2 : 3, filter: g > 0.05 ? `brightness(${1 - 0.1 * g})` : undefined}}>
      <svg width={RW} height={LEN} viewBox={`0 0 ${RW} ${LEN}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={`M2 0 H${RW - 2} V${LEN - notch} L${RW / 2} ${LEN} L2 ${LEN - notch} Z`} fill={col} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d={`M${RW - 22} 4 H${RW - 6} V${LEN - notch - 2} L${RW / 2 + 8} ${LEN - 8} L${RW - 22} ${LEN - notch - 18} Z`} fill={dark} opacity={0.55} />
        <rect x={12} y={6} width={18} height={LEN - notch - 20} fill="#ffffff" opacity={0.5} />
        {Array.from({length: 10}, (_, k) => (
          <rect key={k} x={RW / 2 - 4} y={150 + k * 110} width={8} height={46} fill="#ffffff" opacity={0.55} />
        ))}
      </svg>
      {Array.from({length: 4}, (_, k) => (
        <div key={k} style={{position: 'absolute', left: RW / 2, top: 120 + k * 300 + (i % 2) * 90, transform: 'translate(-50%,-50%)'}}>
          <Pix s={(k + i) % 2 ? heartOf('white') : starOf('white')} px={6} fine={2} />
        </div>
      ))}
    </div>
  );
};

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const rodUp = seg(t, OPEN + 18, OPEN + 26);
  return (
    <AbsoluteFill>
      {Array.from({length: N}, (_, i) => (
        <Ribbon key={i} t={t} i={i} />
      ))}
      {/* rod */}
      <div style={{position: 'absolute', left: -20, top: -12 - rodUp * 120, width: W + 40, height: 62, borderRadius: 31, background: FLAT.yellow, boxShadow: `0 0 0 8px ${INK}, 0 14px 0 8px rgba(43,35,56,0.3), inset 0 14px 0 #fff2a8, inset 0 -12px 0 ${FLAT.yellowDeep}`, zIndex: 10}} />
      {Array.from({length: N}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: i * SW + SW / 2 - 22, top: -rodUp * 120 + 6, width: 44, height: 44, borderRadius: '50%', border: `8px solid ${INK}`, background: FLAT.cream, zIndex: 11, display: t < 22 ? undefined : 'none'}} />
      ))}
      {/* the ribbons thump onto the rod: a few chips knock loose from it */}
      <Chips t={t} at={9} x={W / 2} y={30} count={18} seed={142} colors={COLORS} life={22} speed={[300, 900]} angle={[20, 160]} gravity={1800} size={[1, 2]} spread={W / 2 - 100} z={21} />
      {/* the gust: white wind streaks rush out to both sides while the ribbons bunch up */}
      <Streaks t={t} at={OPEN - 2} dur={24} count={9} seed={3} dir={1} z={22} />
      <Streaks t={t} at={OPEN - 2} dur={24} count={9} seed={5} dir={-1} z={22} />
      <Chips t={t} at={OPEN + 2} x={W / 2} y={H / 2} count={30} seed={144} colors={COLORS} life={28} speed={[900, 2200]} gravity={900} size={[1, 3]} spread={160} z={23} />
    </AbsoluteFill>
  );
};

export const ribbonCurtainDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-ribbon-curtain',
  name: '门帘扯开',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${1 + 0.05 * (1 - seg(p * T, OPEN, 50, (x) => 1 - Math.pow(1 - x, 3)))})`}),
  overlay: Overlay,
  cues: [
    {at: 2, src: 'mc:step/grass1', volume: 0.3, rate: 1.6},
    {at: 4, src: 'mc:step/grass2', volume: 0.3, rate: 1.7},
    {at: 6, src: 'mc:step/grass3', volume: 0.3, rate: 1.5},
    {at: 8, src: 'mc:step/grass4', volume: 0.3, rate: 1.8},
    {at: 12, src: 'mc:random/pop', volume: 0.35, rate: 1.2},
    {at: OPEN + 3, src: 'mc:random/orb', volume: 0.25, rate: 1.4},
    {at: OPEN + 8, src: 'mc:random/orb', volume: 0.25, rate: 1.7},
  ],
};

export const ribbonCurtainEntry = transitionEntry(ribbonCurtainDef, {
  id: 'cute-ribbon-curtain',
  name: '门帘扯开',
  category: 'cute',
  tags: ['可爱', '门帘', '彩带', '布条', '幕布', '转场', '糖果色'],
  blurb: '十六条糖果色燕尾彩带从金色挂杆上一条条砸下来挂满整个画面，轻轻摇晃；一阵风（白色风线 + 彩色碎屑）把它们从中间向左右两边卷拢、推出画面，露出下一个画面。',
  usage: '开场、揭晓、舞台感的“拉开帘子”转场，适合新内容登场、公布结果、片头。',
  params: [
    {name: 'N', desc: '彩带数量（默认 16）'},
    {name: 'COLORS', desc: '彩带颜色循环'},
    {name: 'OPEN', desc: '被风吹开的帧（默认 27）'},
  ],
});
void At;
