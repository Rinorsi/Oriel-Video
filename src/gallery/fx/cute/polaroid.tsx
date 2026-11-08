import type {CSSProperties, FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Flash, Pix, Sprinkle, W, H, INK, lerp, outBack, outCubic, inCubic, inOutCubic, seg} from './kit';
import {Chips, Flare, GridFlash} from './impact';

/**
 * cute-polaroid: a viewfinder locks on, the shutter fires (white flash + pixel cross), shot A shrinks into a Polaroid and floats away up
 * to the right; shot B slides in as the next Polaroid from the lower left, develops, and grows to fill the frame.
 * Dual-type: A and B are both restyled (transform + a Polaroid frame drawn with box-shadows), the overlay adds the
 * viewfinder, flash, tape, stickers and sparkles.
 * Tunables: SHUTTER (frame of the flash), FR / BOT (white border and extra caption strip, px), BACKDROP (colour).
 */

const T = 66;
const SHUTTER = 12;
const FR = 62;
const BOT = 210;
const OL = 8;
const BACKDROP = '#d9c8ff';

type Pose = {x: number; y: number; rot: number; s: number};

/** Where card A is at time t. */
const poseA = (t: number): Pose => {
  if (t < SHUTTER) return {x: 0, y: 0, rot: 0, s: 1 + 0.045 * seg(t, 0, SHUTTER, inOutCubic)};
  const shrink = outBack(seg(t, SHUTTER + 1, SHUTTER + 13), 1.6);
  const s0 = lerp(1.045, 0.62, shrink);
  const bob = Math.sin(t * 0.35) * 10 * seg(t, SHUTTER + 12, SHUTTER + 16);
  const fly = inCubic(seg(t, 28, 44));
  return {x: lerp(0, 1500, fly) - 120 * shrink * (1 - fly), y: lerp(-30 * shrink + bob, -1250, fly), rot: lerp(-5 * shrink, 24, fly), s: lerp(s0, 0.5, fly)};
};

/** Where card B is at time t. */
const poseB = (t: number): Pose => {
  const arrive = outBack(seg(t, 28, 47), 1.5);
  const grow = outCubic(seg(t, 49, T - 1));
  const s0 = 0.62;
  return {
    x: lerp(-1750, 0, arrive) * (1 - grow),
    y: lerp(1250, -30, arrive) * (1 - grow),
    rot: lerp(-22, 3, arrive) * (1 - grow),
    s: lerp(s0, 1, grow),
  };
};

const RINGS = ['#e6d9ff', '#cfbaff', '#e6d9ff', '#cfbaff', '#e6d9ff', '#cfbaff', '#e6d9ff', '#cfbaff', '#e6d9ff', '#cfbaff'];

const frameShadows = (backdrop: boolean): string => {
  const parts = [
    `0 0 0 ${FR}px #fff`,
    `0 ${BOT}px 0 ${FR}px #fff`,
    `0 0 0 ${FR + OL}px ${INK}`,
    `0 ${BOT}px 0 ${FR + OL}px ${INK}`,
    `16px 22px 0 ${FR + OL}px rgba(43,35,56,0.28)`,
    `16px ${22 + BOT}px 0 ${FR + OL}px rgba(43,35,56,0.28)`,
  ];
  if (backdrop) {
    RINGS.forEach((c, k) => parts.push(`0 0 0 ${FR + OL + 180 * (k + 1)}px ${c}`));
    parts.push(`0 0 0 3400px ${BACKDROP}`);
  }
  return parts.join(',');
};

const cardStyle = (pose: Pose, backdrop: boolean): CSSProperties => ({
  transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg) scale(${pose.s})`,
  boxShadow: frameShadows(backdrop),
});

const Viewfinder: FC<{t: number}> = ({t}) => {
  if (t > SHUTTER + 1) return null;
  const lock = t >= 9;
  const box = lerp(900, 560, outCubic(seg(t, 1, 9)));
  const col = lock ? FLAT.green : '#ffffff';
  const m = 70;
  const L = 120;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path d={`M0 ${L} V0 H${L}`} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="square" />
      <path d={`M0 ${L} V0 H${L}`} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="square" />
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, zIndex: 40}}>
      {corner(m, m, 1, 1)}
      {corner(W - m, m, -1, 1)}
      {corner(m, H - m, 1, -1)}
      {corner(W - m, H - m, -1, -1)}
      <g transform={`translate(${W / 2} ${H / 2})`}>
        <rect x={-box / 2} y={-box * 0.36} width={box} height={box * 0.72} fill="none" stroke={INK} strokeWidth={22} />
        <rect x={-box / 2} y={-box * 0.36} width={box} height={box * 0.72} fill="none" stroke={col} strokeWidth={10} />
        <path d="M-30 0 H30 M0 -30 V30" stroke={INK} strokeWidth={18} />
        <path d="M-30 0 H30 M0 -30 V30" stroke={col} strokeWidth={8} />
      </g>
      <circle cx={140} cy={H - 140} r={22} fill={FLAT.red} stroke={INK} strokeWidth={8} opacity={Math.floor(t / 3) % 2 ? 1 : 0.35} />
    </svg>
  );
};

/** Tape + caption doodles that ride on a card (same transform). Hidden while the card is still full screen. */
const Decor: FC<{pose: Pose; kind: 'a' | 'b'; t: number}> = ({pose, kind, t}) => {
  const o = seg(1 - pose.s, 0.04, 0.2);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: W / 2, top: H / 2, width: 0, height: 0, zIndex: kind === 'a' ? 20 : 22, opacity: o, transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg) scale(${pose.s})`}}>
      <div style={{position: 'absolute', left: -190, top: -H / 2 - FR - 52, width: 380, height: 104, background: kind === 'a' ? FLAT.yellow : FLAT.pink, boxShadow: `0 0 0 8px ${INK}, inset 0 12px 0 rgba(255,255,255,0.45), 8px 14px 0 8px rgba(43,35,56,0.3)`, transform: 'rotate(-3deg)', opacity: 0.96}} />
      <div style={{position: 'absolute', left: -W / 2 + 70, top: H / 2 + 64, display: 'flex', gap: 24, alignItems: 'center'}}>
        <Pix s={kind === 'a' ? 'heart' : 'star'} px={14} />
        <div style={{width: 520, height: 20, background: INK, borderRadius: 10, opacity: 0.85}} />
      </div>
      <div style={{position: 'absolute', right: -W / 2 + 90, top: H / 2 + 62}}>
        <Pix s={kind === 'a' ? 'star' : 'heart'} px={12} style={{transform: `rotate(${Math.sin(t * 0.3) * 8}deg)`}} />
      </div>
    </div>
  );
};

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const pa = poseA(t);
  const pb = poseB(t);
  const develop = seg(t, 38, 62);
  const shutterO = t < SHUTTER ? 0 : Math.max(0, 1 - (t - SHUTTER) / 6);
  return (
    <AbsoluteFill>
      <Viewfinder t={t} />
      {t < 44 && <Decor pose={pa} kind="a" t={t} />}
      <Decor pose={pb} kind="b" t={t} />
      {develop < 1 && <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, zIndex: 21, transform: `translate(${pb.x}px, ${pb.y}px) rotate(${pb.rot}deg) scale(${pb.s})`, backdropFilter: `grayscale(${(1 - develop) * 0.95}) sepia(${(1 - develop) * 0.6}) brightness(${1 + (1 - develop) * 0.6})`}} />}
      {/* sparkles around the cards */}
      <Sprinkle t={t} at={SHUTTER + 2} dur={34} seed={61} count={12} kinds={['star', 'spark']} px={[3, 5]} z={30} />
      {/* shutter: white cross flare + flicker over the grid, then pastel chips pop out of the frame */}
      <Flare t={t} at={SHUTTER} x={W / 2} y={H / 2} color="#ffffff" maxR={900} life={16} cell={12} rays={12} seed={3} z={55} />
      <GridFlash t={t} at={SHUTTER} cell={120} dur={6} reach={5} peak={0.55} z={52} />
      <Chips t={t} at={SHUTTER + 1} x={W / 2} y={H / 2} count={24} seed={62} colors={['#ffffff', FLAT.yellow, FLAT.pink, FLAT.sky, FLAT.lilac]} life={26} speed={[900, 2000]} gravity={1100} size={[1, 3]} z={31} />
      {/* the second photo has finished developing: a small flare at its centre and chips from its corners */}
      <Flare t={t} at={49} x={W / 2} y={H / 2 - 30} color="#fff4d6" maxR={520} life={14} cell={8} rays={10} seed={5} z={32} />
      <Chips t={t} at={49} x={W / 2} y={H / 2} count={22} seed={63} colors={['#ffffff', FLAT.pink, FLAT.yellow, FLAT.mint]} life={24} speed={[800, 1800]} gravity={900} size={[1, 3]} z={31} />
      <AbsoluteFill style={{zIndex: 60}}>
        <Flash o={shutterO} color="#ffffff" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const polaroidDef: TransitionDef & {mode: 'dual'} = {
  id: 'cute-polaroid',
  name: '拍立得翻页',
  frames: T,
  mode: 'dual',
  a: (p) => {
    const t = p * T;
    return cardStyle(poseA(t), true);
  },
  b: (p) => {
    const t = p * T;
    return cardStyle(poseB(t), t >= 45);
  },
  overlay: Overlay,
  cues: [
    {at: 4, src: 'mc:random/click', volume: 0.25, rate: 1.8},
    {at: 8, src: 'mc:random/click', volume: 0.25, rate: 2.0},
    {at: SHUTTER - 1, src: 'mc:random/click', volume: 0.6, rate: 1.3},
    {at: SHUTTER + 4, src: 'mc:random/pop', volume: 0.4, rate: 1.2},
    {at: 47, src: 'mc:random/levelup', volume: 0.3, rate: 1.5},
    {at: 50, src: 'mc:random/orb', volume: 0.3, rate: 1.3},
  ],
};

export const polaroidEntry = transitionEntry(polaroidDef, {
  id: 'cute-polaroid',
  name: '拍立得翻页',
  category: 'cute',
  tags: ['可爱', '拍立得', '相机', '照片', '转场', '回忆', '相册'],
  blurb: '取景框对焦，快门闪白（像素十字光芒 + 格子闪烁），画面缩成一张贴着胶带的拍立得飘向右上角；下一张拍立得从左下角滑入、显影，再放大铺满全屏。',
  usage: '回忆、相册、旅行/建筑展示、截图集，或者一个场景定格后切到下一个场景。',
  params: [
    {name: 'SHUTTER', desc: '快门闪光帧（默认 12）'},
    {name: 'FR / BOT', desc: '拍立得白边宽度 / 底部加宽（像素）'},
    {name: 'BACKDROP', desc: '背景底色（默认淡紫）'},
  ],
});
void outBack;
void At;
