import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {Pix, Sprinkle, W, H, INK, hash, lerp, outBack, outCubic, pixSize, seg} from './kit';
import {Chips, Flare} from './impact';
import {fishOf, type FishColor} from './sprites';

/**
 * cute-bubble-pop: a wavy sheet of aqua water rises from the bottom and the screen fills with big soap bubbles
 * floating up. Then they pop one after another: every pop bursts into square shards and leaves a square pixel hole that grows through
 * the water film until the whole film has burst, revealing B.
 * Cut-type: water fills by t~17, B swaps in at t=24, pops t=27..46.
 * Tunables: BUBBLES (count), WATER_A / WATER_B (water colours), POP0 (frame of the first pop).
 */

const T = 60;
const POP0 = 27;
const BUBBLES = 40;
const WATER_A = '#8ff0e8';
const WATER_B = '#52d6cc';
const RIM = [FLAT.pink, FLAT.yellow, FLAT.mint, FLAT.lilac, FLAT.sky];

type Bub = {x: number; ey: number; r: number; t0: number; life: number; sway: number; ph: number; pop: number; rim: string};
const BUBS: Bub[] = Array.from({length: BUBBLES}, (_, i) => {
  const r = 55 + hash(i, 1) * hash(i, 2) * 170 + hash(i, 3) * 60;
  return {x: 40 + hash(i, 4) * (W - 80), ey: 60 + hash(i, 10) * (H - 120), r, t0: hash(i, 5) * 5, life: 14 + hash(i, 6) * 12, sway: 20 + hash(i, 7) * 40, ph: hash(i, 8) * 6.28, pop: POP0 + hash(i, 9) * 17, rim: RIM[i % RIM.length]};
});
/** Extra hole centres (jittered 6x4 grid) so the film is guaranteed to burst everywhere. */
const HOLES = Array.from({length: 24}, (_, j) => ({x: ((j % 6) + 0.5 + (hash(j, 11) - 0.5) * 0.5) * (W / 6), y: (Math.floor(j / 6) + 0.5 + (hash(j, 12) - 0.5) * 0.5) * (H / 4), pop: POP0 + 2 + hash(j, 13) * 16}));

const FISH_COLORS: FishColor[] = ['orange', 'pink', 'sky', 'yellow'];
const FISH = Array.from({length: 8}, (_, i) => ({c: FISH_COLORS[i % 4], px: 9 + Math.floor(hash(i, 41) * 6), y: 120 + hash(i, 42) * (H - 240), x0: hash(i, 43) * (W + 400), dir: i % 2 ? 1 : -1, sp: 9 + hash(i, 44) * 9, ph: hash(i, 45) * 6}));

const bubbleY = (b: Bub, t: number) => {
  const u = Math.min(1, Math.max(0, (t - b.t0) / b.life));
  const e = 1 - Math.pow(1 - u, 1.6);
  return lerp(H + b.r + 20, b.ey, e) - Math.max(0, t - b.t0 - b.life) * 3;
};
const bubbleX = (b: Bub, t: number) => b.x + Math.sin(t * 0.18 + b.ph) * b.sway;

const wavePath = (top: number, t: number, ph: number, amp: number) => {
  let d = `M-20 ${H + 40} L-20 ${top}`;
  for (let x = -20; x <= W + 20; x += 40) d += ` L${x} ${top + Math.sin(x * 0.011 + t * 0.4 + ph) * amp + Math.sin(x * 0.027 - t * 0.3) * amp * 0.4}`;
  return d + ` L${W + 20} ${H + 40} Z`;
};

const Film: FC<{t: number}> = ({t}) => {
  const uid = useCurrentFrame();
  const topA = lerp(H + 60, -80, outCubic(seg(t, 0, 17)));
  const topB = lerp(H + 60, -80, outCubic(seg(t, 0, 15)));
  const holes = [
    ...BUBS.map((b) => ({x: bubbleX(b, Math.min(t, b.pop)), y: bubbleY(b, Math.min(t, b.pop)), r0: b.r, pop: b.pop, big: 330 + b.r * 0.6})),
    ...HOLES.map((h) => ({x: h.x, y: h.y, r0: 0, pop: h.pop, big: 420})),
  ];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <mask id={`film${uid}`}>
          <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#fff" />
          {holes.map((h, i) => {
            const g = seg(t, h.pop, h.pop + 14, outCubic);
            if (g <= 0) return null;
            const hr = Math.round((h.r0 + g * h.big) / 24) * 24;
            return <rect key={i} x={Math.round((h.x - hr) / 24) * 24} y={Math.round((h.y - hr) / 24) * 24} width={hr * 2} height={hr * 2} fill="#000" />;
          })}
        </mask>
        <clipPath id={`water${uid}`}>
          <path d={wavePath(topA, t, 0, 24)} />
        </clipPath>
      </defs>
      <g mask={`url(#film${uid})`}>
        <path d={wavePath(topB - 46, t, 1.7, 20)} fill={WATER_B} stroke={INK} strokeWidth={14} strokeLinejoin="round" />
        <path d={wavePath(topA, t, 0, 24)} fill={WATER_A} stroke={INK} strokeWidth={14} strokeLinejoin="round" />
        <g clipPath={`url(#water${uid})`}>
        {Array.from({length: 8}, (_, i) => (
          <polygon key={i} points={`${i * 260},0 ${i * 260 + 90},0 ${i * 260 - 160},${H} ${i * 260 - 250},${H}`} fill="#ffffff" opacity={0.13} />
        ))}
        {Array.from({length: 46}, (_, i) => (
          <rect key={i} x={hash(i, 21) * W} y={((hash(i, 22) * H - t * (2 + hash(i, 23) * 4)) % H + H) % H} width={10} height={10} fill="#ffffff" opacity={0.7} />
        ))}
          {FISH.map((f, i) => {
            const sz = pixSize('fish', f.px, true, false, 2);
            const x = ((f.x0 + f.dir * (t + 8) * f.sp) % (W + 400) + (W + 400)) % (W + 400) - 200;
            const y = f.y + Math.sin(t * 0.3 + f.ph) * 18;
            return (
              <g key={i} transform={`translate(${x - sz.w / 2} ${y - sz.h / 2})`}>
                <Pix s={fishOf(f.c)} px={f.px} fine={2} flip={f.dir > 0} shadow />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
};

const Bubble: FC<{x: number; y: number; r: number; rim: string; s?: number}> = ({x, y, r, rim, s = 1}) => (
  <svg width={r * 2 + 40} height={r * 2 + 40} viewBox={`${-r - 20} ${-r - 20} ${r * 2 + 40} ${r * 2 + 40}`} style={{position: 'absolute', left: x - r - 20, top: y - r - 20, overflow: 'visible', transform: `scale(${s})`}}>
    <circle r={r} fill="rgba(255,255,255,0.2)" stroke={INK} strokeWidth={16} />
    <circle r={r} fill="rgba(255,255,255,0.16)" stroke="#ffffff" strokeWidth={8} />
    <path d={`M ${-r * 0.62} ${-r * 0.25} A ${r * 0.68} ${r * 0.68} 0 0 1 ${-r * 0.22} ${-r * 0.64}`} fill="none" stroke="#fff" strokeWidth={Math.max(8, r * 0.12)} strokeLinecap="round" />
    <path d={`M ${r * 0.5} ${r * 0.42} A ${r * 0.66} ${r * 0.66} 0 0 1 ${r * 0.1} ${r * 0.66}`} fill="none" stroke={rim} strokeWidth={Math.max(7, r * 0.09)} strokeLinecap="round" />
    <circle cx={-r * 0.3} cy={-r * 0.74} r={Math.max(5, r * 0.06)} fill="#fff" />
  </svg>
);

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  return (
    <AbsoluteFill>
      <Film t={t} />
      {BUBS.map((b, i) => {
        if (t < b.t0 || t > b.pop + 0.01) return null;
        const born = outBack(seg(t, b.t0, b.t0 + 5), 2);
        const squish = 1 + 0.05 * Math.sin(t * 0.5 + b.ph);
        const pre = t > b.pop - 3 ? 1 + 0.1 * (t - (b.pop - 3)) / 3 : 1;
        return (
          <div key={i} style={{position: 'absolute', inset: 0, zIndex: 5 + Math.floor(b.r / 40)}}>
            <Bubble x={bubbleX(b, t)} y={bubbleY(b, t)} r={b.r * squish} rim={b.rim} s={born * pre} />
          </div>
        );
      })}
      {/* every pop: the bubble bursts into square shards (white / aqua / its rim colour) and a tiny cross flash */}
      {BUBS.map((b, i) => {
        const x = bubbleX(b, b.pop);
        const y = bubbleY(b, b.pop);
        return (
          <div key={i}>
            <Chips t={t} at={b.pop} x={x} y={y} count={Math.round(5 + b.r / 28)} seed={131 + i} colors={["#ffffff", "#ffffff", "#bff6f2", b.rim]} life={16} speed={[250 + b.r * 2, 700 + b.r * 4]} gravity={1100} size={[1, 3]} spread={b.r * 0.6} z={32} />
            <Flare t={t} at={b.pop} x={x} y={y} color="#ffffff" maxR={b.r * 1.5} life={9} cell={8} rays={6} seed={i + 5} z={33} />
          </div>
        );
      })}
      <Sprinkle t={t} at={10} dur={36} seed={132} count={12} kinds={['spark']} px={[3, 5]} z={20} />
    </AbsoluteFill>
  );
};

export const bubblePopDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-bubble-pop',
  name: '气泡爆开',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${1 + 0.05 * (1 - seg(p * T, POP0, 52, outCubic))})`}),
  overlay: Overlay,
  cues: [
    {at: 3, src: 'mc:random/pop', volume: 0.25, rate: 1.4},
    {at: 7, src: 'mc:random/pop', volume: 0.25, rate: 1.6},
    {at: 11, src: 'mc:random/pop', volume: 0.25, rate: 1.5},
    {at: 15, src: 'mc:random/orb', volume: 0.25, rate: 1.2},
    {at: POP0, src: 'mc:random/pop', volume: 0.55, rate: 1.0},
    {at: POP0 + 2, src: 'mc:random/pop', volume: 0.5, rate: 1.3},
    {at: POP0 + 4, src: 'mc:random/pop', volume: 0.5, rate: 0.9},
    {at: POP0 + 6, src: 'mc:random/pop', volume: 0.5, rate: 1.5},
    {at: POP0 + 8, src: 'mc:random/pop', volume: 0.45, rate: 1.1},
    {at: POP0 + 10, src: 'mc:random/pop', volume: 0.45, rate: 1.7},
    {at: POP0 + 13, src: 'mc:random/pop', volume: 0.4, rate: 1.2},
    {at: POP0 + 16, src: 'mc:random/pop', volume: 0.4, rate: 1.6},
  ],
};

export const bubblePopEntry = transitionEntry(bubblePopDef, {
  id: 'cute-bubble-pop',
  name: '气泡爆开',
  category: 'cute',
  tags: ['可爱', '气泡', '泡泡', '水', '清新', '转场', '像素'],
  blurb: '一层波浪水面从底部涨起，大大小小描边的肥皂泡漂满屏幕；随后泡泡一个接一个破开成方块碎片，每次破裂都在水膜上撕开一个越来越大的像素方洞，直到整片水膜裂光，露出下一个画面。',
  usage: '水下/海洋/清洁/轻松治愈的段落，或者想要清新、爽快的连续破裂节奏转场。',
  params: [
    {name: 'BUBBLES', desc: '泡泡数量（默认 34）'},
    {name: 'WATER_A / WATER_B', desc: '水面前后两层颜色'},
    {name: 'POP0', desc: '第一个泡泡破开的帧（默认 27）'},
  ],
});
