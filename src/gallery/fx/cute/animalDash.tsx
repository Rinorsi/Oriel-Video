import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Pix, W, H, INK, hash, outCubic, inCubic, seg} from './kit';
import {Chips, Smoke} from './impact';
import {ChickenMob, PigMob, SheepMob} from './mobs';

/**
 * cute-animal-dash: six lanes of pigs, chickens and sheep stampede across the screen from alternating sides, each lane
 * dragging a coloured dust band behind it. The herd stops to bounce in the middle (screen packed), winds up, then
 * dashes out the other side taking the dust with it.
 * Cut-type: covered by t~18, B swaps in at t=24, the herd leaves t=31..58.
 * Tunables: LANES (count), DUST (lane colours), SPACING (animal spacing, px).
 */

const T = 60;
const LANES = 6;
const LANE_H = H / LANES;
const TRAIN = 2300;
const SPACING = 150;
const MS = 12; // texture pixel -> screen px for the mobs (pig 120x168)
const DUST = [FLAT.pink, FLAT.yellow, FLAT.mint, FLAT.sky, FLAT.lilac, FLAT.orange];
type Kind = 'pig' | 'chicken' | 'sheep';
const KINDS: Kind[] = ['pig', 'chicken', 'sheep', 'pig', 'sheep', 'chicken'];

/** 0..1 progress of a lane's train along its path (W + TRAIN long). */
const progress = (t: number, d: number) => {
  const wind = 0.012 * Math.sin(seg(t, d + 27, d + 31) * Math.PI);
  if (t < d + 20) return 0.5 * outCubic(seg(t, d, d + 20));
  if (t < d + 31) return 0.5 + 0.025 * seg(t, d + 20, d + 31) - wind;
  return 0.525 + 0.475 * inCubic(seg(t, d + 31, d + 53));
};

const Lane: FC<{t: number; i: number}> = ({t, i}) => {
  const d = i * 1.0;
  const u = progress(t, d);
  const xl = -TRAIN + u * (W + TRAIN);
  const cy = LANE_H / 2 + i * LANE_H;
  const color = DUST[i];
  const count = Math.ceil(TRAIN / SPACING);
  const dir = i % 2 === 0 ? 1 : -1;
  const speed = Math.abs(progress(t + 0.5, d) - progress(t - 0.5, d));
  return (
    <div style={{position: 'absolute', inset: 0, transform: dir === 1 ? undefined : 'scaleX(-1)', transformOrigin: `${W / 2}px 0`, zIndex: 3 + i}}>
      {/* dust band */}
      <div style={{position: 'absolute', left: xl - 120, top: cy - LANE_H / 2 - 6, width: TRAIN + 240, height: LANE_H + 12, background: color, boxShadow: `inset 0 12px 0 rgba(255,255,255,0.45), inset 0 -12px 0 rgba(43,35,56,0.12)`, borderTop: `7px solid ${INK}`, borderBottom: `7px solid ${INK}`, boxSizing: 'border-box'}} />
      {/* puffy edges */}
      {Array.from({length: Math.ceil(TRAIN / 170)}, (_, k) => (
        <div key={k}>
          <At x={xl + k * 170 + (hash(i, k) - 0.5) * 30} y={cy - LANE_H / 2 + 2}>
            <Pix s="puff" px={9} />
          </At>
          <At x={xl + k * 170 + 85 + (hash(i, k + 9) - 0.5) * 30} y={cy + LANE_H / 2 - 2}>
            <Pix s="puff" px={9} />
          </At>
        </div>
      ))}
      {/* tail dust cloud */}
      {[0, 1, 2, 3].map((k) => (
        <At key={k} x={xl - 60 + k * 70} y={cy + (k % 2 ? 40 : -40)} s={1 + 0.1 * Math.sin(t * 0.6 + k)}>
          <Pix s="puff" px={18} />
        </At>
      ))}
      {/* speed lines behind the head while moving fast */}
      {speed > 0.012 &&
        [0, 1, 2].map((k) => (
          <div key={k} style={{position: 'absolute', left: xl + TRAIN + 30 - 900 - k * 120, top: cy - 60 + k * 58, width: 420 + k * 90, height: 12, borderRadius: 6, background: '#fff', boxShadow: `0 0 0 4px ${INK}`, opacity: Math.min(1, speed * 40), zIndex: 30}} />
        ))}
      {/* animals */}
      {Array.from({length: count}, (_, k) => {
        const kind = KINDS[(k + i * 2) % KINDS.length];
        const ph = t * 0.62 + k * 0.9 + i * 1.7;
        const hop = Math.abs(Math.sin(ph)) * 36;
        const x = xl + TRAIN - 100 - k * SPACING;
        return (
          <div key={k} style={{position: 'absolute', left: x, top: cy + 6 - hop, transform: `translate(-50%,-50%) rotate(${Math.sin(ph) * 6}deg) scale(${1 + 0.05 * Math.cos(ph * 2)}, ${1 - 0.05 * Math.cos(ph * 2)})`, zIndex: 10 + count - k}}>
            {kind === 'pig' ? <PigMob s={MS} step={Math.sin(ph * 2)} /> : kind === 'sheep' ? <SheepMob s={MS} step={Math.sin(ph * 2)} /> : <ChickenMob s={MS} step={Math.sin(ph * 2)} />}
          </div>
        );
      })}
    </div>
  );
};

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  return (
    <AbsoluteFill>
      {Array.from({length: LANES}, (_, i) => (
        <Lane key={i} t={t} i={i} />
      ))}
      {/* the herd skids to a stop in the middle: a dust bank per lane; then the take-off kicks up chips of grass */}
      {Array.from({length: LANES}, (_, i) => (
        <Smoke key={i} t={t} at={19 + i * 0.6} x={W * (i % 2 ? 0.62 : 0.38)} y={LANE_H * (i + 0.9)} count={4} seed={101 + i} dur={14} spread={260} drift={[200, 600]} rise={10} flatY={0.25} px={8} grow={[0.7, 1.4]} z={65} />
      ))}
      <Chips t={t} at={30} x={W / 2} y={H * 0.9} count={30} seed={102} colors={['#5ed16a', '#2fa24a', '#9b6b43', '#a8f0c6']} life={26} speed={[700, 1700]} angle={[-170, -10]} gravity={2400} size={[1, 3]} spread={W * 0.4} z={66} />
    </AbsoluteFill>
  );
};

export const animalDashDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-animal-dash',
  name: '猪猪冲刺',
  frames: T,
  mode: 'cut',
  overlay: Overlay,
  cues: [
    {at: 2, src: 'mc:step/grass1', volume: 0.35, rate: 1.1},
    {at: 4, src: 'mc:step/grass2', volume: 0.35, rate: 1.2},
    {at: 6, src: 'mc:step/grass3', volume: 0.35, rate: 1.1},
    {at: 8, src: 'mc:step/grass4', volume: 0.35, rate: 1.25},
    {at: 10, src: 'mc:step/grass1', volume: 0.35, rate: 1.1},
    {at: 12, src: 'mc:step/grass2', volume: 0.35, rate: 1.2},
    {at: 15, src: 'mc:random/pop', volume: 0.35, rate: 0.6},
    {at: 22, src: 'mc:random/pop', volume: 0.4, rate: 0.5},
    {at: 25, src: 'mc:random/pop', volume: 0.35, rate: 0.7},
    {at: 33, src: 'mc:step/grass3', volume: 0.4, rate: 1.3},
    {at: 36, src: 'mc:step/grass1', volume: 0.4, rate: 1.4},
    {at: 39, src: 'mc:step/grass2', volume: 0.4, rate: 1.5},
    {at: 42, src: 'mc:step/grass4', volume: 0.35, rate: 1.5},
  ],
};

export const animalDashEntry = transitionEntry(animalDashDef, {
  id: 'cute-animal-dash',
  name: '猪猪冲刺',
  category: 'cute',
  tags: ['可爱', '小猪', '小鸡', '绵羊', '动物', '冲刺', '尘土', '转场', '像素'],
  blurb: '六条跑道上的原版贴图的小猪、小鸡、绵羊从左右交替冲进来，身后拖着彩色尘土条带，挤满画面原地蹦几下，然后一起冲向另一侧，把画面带走。',
  usage: '农场/生存/动物主题，或者节奏轻快的“冲过去”式转场、冲刺/赶路的段落。',
  params: [
    {name: 'LANES', desc: '跑道数（默认 6，需整除 1080）'},
    {name: 'DUST', desc: '每条跑道的尘土颜色'},
    {name: 'SPACING', desc: '动物间距（像素，默认 205）'},
  ],
});
