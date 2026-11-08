import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Confetti, Pix, Rainbow, Sprinkle, W, H, INK, hash, lerp, outBack, outCubic, inCubic, seg} from './kit';

/**
 * cute-cloud-push: four trains of pixel clouds slide in from alternating sides and squeeze the frame shut over
 * bands of blue sky; a smiling sun and a rainbow pop out of the middle, then a gust ("") blows the whole sky
 * off to the right.
 * Cut-type: covered by t~22, B swaps in at t=24 under it, the gust starts at t=30.
 * Tunables: ROWS (cloud rows), GUST (frame the wind starts), SKY (band colours).
 */

const T = 60;
const GUST = 30;
const ROWS = 5;
const SKY = ['#8fd3ff', '#a6ddff'];

type Cl = {x: number; y: number; px: number; flip: boolean; rot: number; face: boolean};
const TRAINS: Cl[][] = Array.from({length: ROWS}, (_, i) => {
  const out: Cl[] = [];
  for (let k = 0; k < 8; k++) {
    out.push({
      x: (i % 2 ? -600 : -400) + k * 400 + (hash(i, k) - 0.5) * 50,
      y: (hash(i, k + 20) - 0.5) * 50,
      px: [22, 24, 26][Math.floor(hash(i, k + 30) * 3)],
      flip: hash(i, k + 50) > 0.5,
      rot: (hash(i, k + 70) - 0.5) * 4,
      face: (i + k) % 2 === 0,
    });
  }
  return out;
});
const rowY = (i: number) => 108 + i * 216;

const Wind: FC<{t: number}> = ({t}) => {
  const a = t - (GUST - 2);
  if (a < 0 || a > 28) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 20}}>
      {Array.from({length: 16}, (_, i) => {
        const y = 40 + hash(i, 5) * (H - 80);
        const len = 360 + hash(i, 6) * 620;
        const d = hash(i, 7) * 8;
        const u = seg(a, d, d + 16);
        if (u <= 0 || u >= 1) return null;
        const x = lerp(-len, W + 200, outCubic(u));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: len, height: 14, borderRadius: 7, background: '#ffffff', boxShadow: `0 0 0 5px ${INK}, 0 10px 0 5px rgba(43,35,56,0.35)`, opacity: 1 - seg(u, 0.75, 1)}} />;
      })}
    </div>
  );
};

/** Ring of short rays behind the sun. */
const SunRays: FC<{t: number}> = ({t}) => (
  <svg width={760} height={760} viewBox="-380 -380 760 760" style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) rotate(${t * 2.5}deg)`, overflow: 'visible'}}>
    {Array.from({length: 12}, (_, i) => (
      <rect key={i} x={-17} y={-368} width={34} height={70} rx={10} transform={`rotate(${i * 30})`} fill={FLAT.yellow} stroke={INK} strokeWidth={9} />
    ))}
  </svg>
);

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const blow = (delay: number) => inCubic(seg(t, GUST + delay, GUST + delay + 20)) * (W + 2900);

  const sunIn = outBack(seg(t, 17, 25), 2.6);
  const rainbowGrow = outCubic(seg(t, 15, 26));

  return (
    <AbsoluteFill>
      {/* sky bands + cloud trains */}
      {TRAINS.map((train, i) => {
        const fromLeft = i % 2 === 0;
        const e = outBack(seg(t, i * 2, i * 2 + 14), 1.4);
        const enter = (1 - e) * (W + 1700) * (fromLeft ? -1 : 1);
        const off = enter + blow(i * 1.5);
        const y = rowY(i);
        return (
          <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${off}px)`, zIndex: 3 + i}}>
            <div style={{position: 'absolute', left: -560, width: 3240, top: y - 130, height: 260, background: SKY[i % 2]}} />
            {train.map((c, k) => (
              <At key={k} x={c.x} y={y + c.y + 20} rot={c.rot}>
                <Pix s={c.face ? 'cloud' : 'cloudPlain'} px={c.px} flip={c.flip} shadow fine={2} />
              </At>
            ))}
          </div>
        );
      })}
      {/* rainbow, feet clouds, sun */}
      <div style={{position: 'absolute', inset: 0, zIndex: 12, transform: `translateX(${blow(1)}px)`}}>
        <Rainbow cx={W / 2} cy={H * 0.86} R={780} bw={50} grow={rainbowGrow} />
        <At x={250} y={H * 0.86 + 10} s={sunIn}>
          <Pix s="cloudPlain" px={40} shadow fine={2} />
        </At>
        <At x={W - 250} y={H * 0.86 + 10} s={sunIn}>
          <Pix s="cloud" px={40} flip shadow fine={2} />
        </At>
      </div>
      <div style={{position: 'absolute', inset: 0, zIndex: 13, transform: `translateX(${blow(0.5) * 1.1}px)`}}>
        <At x={W / 2} y={H * 0.5} s={sunIn * (1 + 0.04 * Math.sin(t * 0.6))} rot={Math.sin(t * 0.3) * 4}>
          <SunRays t={t} />
          <Pix s="sun" px={34} shadow fine={2} />
        </At>
      </div>
      <Sprinkle t={t} at={16} dur={GUST - 16 + 12} seed={31} count={22} kinds={['star', 'heart', 'spark', 's:puff']} px={[3, 6]} z={14} />
      <Confetti t={t} at={22} x={W / 2} y={H * 0.5} count={18} seed={32} life={24} speed={[500, 1100]} gravity={600} px={[4, 7]} kinds={['star', 'heart', 'spark']} z={11} />
      <Wind t={t} />
      <Confetti t={t} at={GUST + 2} x={W * 0.2} y={H * 0.5} count={26} seed={33} life={34} speed={[900, 1900]} angle={[-40, 40]} gravity={200} px={[4, 8]} kinds={['s:puff', 's:puff', 'sq', 'spark']} z={35} />
    </AbsoluteFill>
  );
};

export const cloudPushDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-cloud-push',
  name: '云朵推开',
  frames: T,
  mode: 'cut',
  overlay: Overlay,
  cues: [
    {at: 2, src: 'mc:step/grass1', volume: 0.3, rate: 1.4},
    {at: 6, src: 'mc:step/grass2', volume: 0.3, rate: 1.5},
    {at: 18, src: 'mc:random/levelup', volume: 0.25, rate: 1.2},
    {at: 21, src: 'mc:random/pop', volume: 0.4, rate: 1.3},
    {at: GUST + 3, src: 'mc:random/orb', volume: 0.25, rate: 1.6},
  ],
};

export const cloudPushEntry = transitionEntry(cloudPushDef, {
  id: 'cute-cloud-push',
  name: '云朵推开',
  category: 'cute',
  tags: ['可爱', '云', '彩虹', '太阳', '天空', '转场', '像素'],
  blurb: '一排排扁平像素云（有的带笑脸）压着蓝天条带从左右两侧挤进来盖满画面，太阳和彩虹探出头，然后一阵风（白色风线）把整片天空吹向右边，露出下一个画面。',
  usage: '日出/天气/轻松治愈段落的转场，或者从一天切到另一天、从地面飞向天空。',
  params: [
    {name: 'ROWS', desc: '云朵行数（默认 4）'},
    {name: 'GUST', desc: '起风帧（默认 30）'},
    {name: 'SKY', desc: '天空条带两种蓝色'},
  ],
});
