import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Pix, Rays, W, H, INK, hash, lerp, outBack, outCubic, inOutCubic, seg} from './kit';
import {Chips, Flare} from './impact';
import type {SprName} from './sprites';

/**
 * cute-item-wheel: five rings of apples, diamonds, books, swords, hearts, pumpkins... spawn one after another around a
 * big apple and spin in opposite directions while zooming in until the screen is packed. Then a clock hand sweeps
 * round (clockwise from 12 o'clock) and wipes the whole wheel away, item by item, revealing B.
 * Cut-type: packed by t~22, B swaps in at t=24, sweep t=32..54.
 * Tunables: RINGS (radius / count per ring), ITEMS (sprites used), SWEEP (frame the clock hand starts).
 */

const T = 60;
const SWEEP = 32;
const SWEEP_LEN = 22;
const CX = W / 2;
const CY = H / 2;
const ITEMS: SprName[] = ['apple', 'diamond', 'book', 'sword', 'heart', 'star', 'pumpkin', 'b_gold', 'carrot', 'b_emerald', 'melon', 'b_lapis'];
const RINGS = [
  {r: 250, n: 8},
  {r: 500, n: 12},
  {r: 750, n: 17},
  {r: 1000, n: 21},
  {r: 1250, n: 26},
];

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const zoom = lerp(0.72, 1, outBack(seg(t, 0, 20), 1.2)) * (1 + 0.1 * seg(t, 20, SWEEP));
  const a = 360 * inOutCubic(seg(t, SWEEP, SWEEP + SWEEP_LEN));
  const sweeping = t >= SWEEP;
  const maskImg = sweeping ? `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent ${a}deg, #000 ${a}deg, #000 360deg)` : undefined;
  const centerS = outBack(seg(t, 3, 11), 2.4) * (1 + 0.06 * Math.sin(t * 0.7));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: maskImg, maskImage: maskImg}}>
        {/* backdrop: 120px mint tiles flick on in a scattered order (no growing disc), then the rays fade in over them */}
        {Array.from({length: 16 * 9}, (_, i) => {
          const c = i % 16;
          const r = Math.floor(i / 16);
          const on = (hash(c, r + 11) * 0.7 + (Math.abs(c - 7.5) + Math.abs(r - 4)) / 12 * 0.3) * 9;
          const k = outBack(seg(t, on, on + 4), 1.4);
          if (k <= 0.01) return null;
          return <div key={i} style={{position: 'absolute', left: c * 120 - 1, top: r * 120 - 1, width: 122, height: 122, background: (c + r) % 2 ? FLAT.mint : '#97eab8', transform: `scale(${k})`}} />;
        })}
        <div style={{position: 'absolute', inset: 0, opacity: seg(t, 9, 15) * 0.9}}>
          <Rays a="#8fe6b6" b={FLAT.mint} rot={t * 2.5} n={20} style={{opacity: 0.8}} />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${CX}px ${CY}px`}}>
          {RINGS.map((rg, k) =>
            Array.from({length: rg.n}, (_, i) => {
              const dir = k % 2 ? -1 : 1;
              const spin = dir * (t * 4 + 0.13 * t * t) * (1 + 0.14 * k);
              const ang = ((i / rg.n) * 360 + spin + k * 17 - 90) * (Math.PI / 180);
              const born = k * 3 + i * 0.45;
              const s = outBack(seg(t, born, born + 8), 2.2);
              if (s <= 0) return null;
              const rr = rg.r * lerp(0.4, 1, outCubic(seg(t, born, born + 12)));
              const type = ITEMS[(i * 3 + k * 5) % ITEMS.length];
              return (
                <At key={`${k}-${i}`} x={CX + Math.cos(ang) * rr} y={CY + Math.sin(ang) * rr} s={s} rot={Math.sin(t * 0.35 + i + k) * 10} z={k + 2}>
                  <Pix s={type} px={18} fine={2} shadow />
                </At>
              );
            }),
          )}
          <At x={CX} y={CY} s={centerS} rot={Math.sin(t * 0.4) * 8} z={20}>
            <Pix s="apple" px={34} fine={2} shadow />
          </At>
        </div>
      </AbsoluteFill>
      {/* clock hand */}
      {sweeping && a < 359 && (
        <div style={{position: 'absolute', left: CX, top: CY, width: 0, height: 0, transform: `rotate(${a}deg)`, zIndex: 40}}>
          <div style={{position: 'absolute', left: -9, top: -1500, width: 18, height: 1500, background: '#ffffff', boxShadow: `0 0 0 6px ${INK}, 8px 0 0 6px rgba(43,35,56,0.3)`}} />
          <div style={{position: 'absolute', left: -9, top: -1500, width: 18, height: 1500, background: 'repeating-linear-gradient(180deg, transparent 0 60px, rgba(255,210,63,0.9) 60px 120px)'}} />
          <At x={0} y={-720} s={1}>
            <Pix s="star" px={8} fine={2} />
          </At>
          <At x={0} y={-1180} s={1}>
            <Pix s="star" px={9} fine={2} />
          </At>
        </div>
      )}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => {
        const f = SWEEP + 2 + j * 2.6;
        const ang = 360 * inOutCubic(seg(f, SWEEP, SWEEP + SWEEP_LEN));
        const rad = ((ang - 90) * Math.PI) / 180;
        const rr = 480 + (j % 3) * 260;
        return <Chips key={j} t={t} at={f} x={CX + Math.cos(rad) * rr} y={CY + Math.sin(rad) * rr} count={7} seed={92 + j} colors={[FLAT.mint, '#ffffff', FLAT.yellow, FLAT.pink, FLAT.red]} life={16} speed={[300, 800]} gravity={1200} size={[1, 3]} z={42} />;
      })}
      <Flare t={t} at={SWEEP} x={CX} y={CY} color="#ffffff" maxR={620} life={14} cell={8} rays={10} seed={92} z={43} />
    </AbsoluteFill>
  );
};

export const itemWheelDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-item-wheel',
  name: '苹果转盘',
  frames: T,
  mode: 'cut',
  overlay: Overlay,
  cues: [
    {at: 3, src: 'mc:random/pop', volume: 0.4, rate: 1.0},
    {at: 6, src: 'mc:random/pop', volume: 0.4, rate: 1.15},
    {at: 9, src: 'mc:random/pop', volume: 0.4, rate: 1.3},
    {at: 12, src: 'mc:random/pop', volume: 0.4, rate: 1.45},
    {at: 15, src: 'mc:random/orb', volume: 0.3, rate: 1.1},
    {at: 20, src: 'mc:random/levelup', volume: 0.25, rate: 1.3},
    {at: SWEEP, src: 'mc:random/click', volume: 0.5, rate: 0.9},
    {at: SWEEP + 6, src: 'mc:random/orb', volume: 0.3, rate: 1.4},
    {at: SWEEP + 11, src: 'mc:random/orb', volume: 0.3, rate: 1.6},
    {at: SWEEP + 16, src: 'mc:random/orb', volume: 0.3, rate: 1.8},
  ],
};

export const itemWheelEntry = transitionEntry(itemWheelDef, {
  id: 'cute-item-wheel',
  name: '苹果转盘',
  category: 'cute',
  tags: ['可爱', '苹果', '转盘', '物品', '旋转', '转场', '像素'],
  blurb: '以一个大苹果为中心，四圈苹果、钻石、书、剑、爱心、南瓜依次冒出来，反向旋转着放大，直到把屏幕撑满；然后一根时钟指针（起点一个十字光芒）顺时针扫过，把整个转盘一格格擦掉，露出下一个画面。',
  usage: '物品盘点、合成配方、抽奖/转盘玩法，或者想要“一个接一个”撑满画面的节奏感转场。',
  params: [
    {name: 'RINGS', desc: '每圈的半径与物品数量'},
    {name: 'ITEMS', desc: '转盘上出现的精灵列表，可增删'},
    {name: 'SWEEP', desc: '指针开始扫的帧（默认 32）'},
  ],
});
