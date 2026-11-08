import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PixelBurst, Twinkles} from '../../../mc/Fx';
import {block} from '../../../mc/assets';
import {OreChip} from '../../../mg/Ore';
import {Sfx, mcSound} from '../../../reel/kit';
import {Blob, EASE, Embers, Glow, ItemAt, Rays, Stars, Vig, W, H, RAR, clamp01, lerp, prog, px, type RarityKey} from './kit';

/**
 * item-drop-bounce: a batch of items falls from above onto a floor in three depth rows, bounces three times while
 * spinning, lands with dust, squash and ground shadows; rare items throw a light column and get a name tag.
 * Props: see DropProps. `bg` - draw the dusk sky and perspective floor (Demo). Without it (Layer) only items, shadows and particles.
 */

export type DropItem = {
  /** 物品 id */
  id: string;
  /** 落点横坐标(像素,画面 1920 宽) */
  x: number;
  /** 落在第几排:0 远 / 1 中 / 2 近 */
  row: 0 | 1 | 2;
  /** 掉落顺序(从 0 起,越小越早) */
  order: number;
  /** 稀有度:uncommon / rare / epic 会带光柱;rare 与 epic 会挂名牌 */
  rar?: RarityKey;
  /** 名牌文字(仅 rare / epic 显示) */
  name?: string;
};
type DI = DropItem;

export type DropProps = {
  /** 是否绘制黄昏天空与透视地面;默认不画(透明) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 掉落物列表 */
  items?: DropItem[];
  /** 三排的地面 y 坐标与缩放 */
  rows?: {gy: number; s: number}[];
  /** 物品基础尺寸(像素,乘以排缩放) */
  baseSize?: number;
  /** 下落帧数 */
  fallFrames?: number;
  /** 每次弹跳的帧数 */
  bounceFrames?: number[];
  /** 每次弹跳的高度(像素) */
  bounceHeights?: number[];
  /** 第一件物品开始下落的本地帧 */
  startAt?: number;
  /** 相邻掉落顺序之间的间隔帧 */
  step?: number;
};

type Cfg = {ROWS: {gy: number; s: number}[]; BASE: number; FALL: number; BOUNCE: number[]; HEIGHT: number[]; T_REST: number; dropAt: (d: DI) => number};

const DEFAULT_ROWS = [
  {gy: 672, s: 0.78},
  {gy: 842, s: 1},
  {gy: 1016, s: 1.38},
];
const DEFAULT_ITEMS: DI[] = [
  {id: 'gold_ingot', x: 300, row: 0, order: 6},
  {id: 'apple', x: 560, row: 0, order: 1},
  {id: 'arrow', x: 820, row: 0, order: 11},
  {id: 'bone', x: 1080, row: 0, order: 3},
  {id: 'coal', x: 1340, row: 0, order: 9},
  {id: 'redstone', x: 1600, row: 0, order: 14},
  {id: 'bread', x: 190, row: 1, order: 4},
  {id: 'iron_ingot', x: 480, row: 1, order: 12},
  {id: 'emerald', x: 770, row: 1, order: 7, rar: 'uncommon', name: '绿宝石'},
  {id: 'diamond', x: 1060, row: 1, order: 13, rar: 'rare', name: '钻石'},
  {id: 'golden_apple', x: 1350, row: 1, order: 2, rar: 'rare', name: '金苹果'},
  {id: 'ender_pearl', x: 1650, row: 1, order: 10},
  {id: 'totem_of_undying', x: 360, row: 2, order: 8, rar: 'epic', name: '不死图腾'},
  {id: 'netherite_ingot', x: 740, row: 2, order: 15, rar: 'rare', name: '下界合金锭'},
  {id: 'nether_star', x: 1200, row: 2, order: 5, rar: 'epic', name: '下界之星'},
  {id: 'experience_bottle', x: 1580, row: 2, order: 0, rar: 'uncommon', name: '经验之瓶'},
];

const Drop: FC<{d: DI; z: number; cfg: Cfg}> = ({d, z, cfg}) => {
  const {ROWS, BASE, FALL, BOUNCE, HEIGHT, T_REST, dropAt} = cfg;
  const f = useCurrentFrame();
  const {gy, s} = ROWS[d.row];
  const size = BASE * s;
  const at = dropAt(d);
  const t = f - at;
  if (t < 0) return null;
  let lift: number;
  let landT = -1; // frames since latest landing
  if (t < FALL) {
    const u = t / FALL;
    lift = (gy + size) * (1 - u * u);
  } else {
    let tt = t - FALL;
    let k = 0;
    landT = tt;
    lift = 0;
    while (k < BOUNCE.length && tt >= BOUNCE[k]) {
      tt -= BOUNCE[k];
      landT = tt;
      k++;
    }
    if (k < BOUNCE.length) {
      const u = tt / BOUNCE[k];
      lift = HEIGHT[k] * s * 4 * u * (1 - u);
    } else {
      lift = 5 * s * (1 + Math.sin(t * 0.11 + d.x)) ; // gentle bob at rest
    }
  }
  const rate = 0.42;
  const ang = rate * Math.min(t, T_REST) + 0.1 * Math.max(0, t - T_REST) + d.x * 0.01;
  const cosA = Math.cos(ang);
  const sx = Math.sign(cosA || 1) * Math.max(0.14, Math.abs(cosA));
  const sq = t >= FALL && landT >= 0 && landT < 5 ? (1 - landT / 5) * (t < FALL + BOUNCE[0] + 1 ? 0.2 : 0.1) : 0;
  const cy = gy - size / 2 - lift;
  const shW = size * (0.95 - 0.5 * clamp01(lift / 420));
  const rarCol = d.rar ? RAR[d.rar].glow : undefined;
  const settle = clamp01((t - T_REST) / 12);
  return (
    <>
      <Blob x={d.x} y={gy + 6 * s} w={shW} h={shW * 0.26} op={0.4 * (1 - clamp01(lift / 520) * 0.7)} />
      {rarCol && t >= FALL && (
        <>
          <Glow x={d.x} y={gy - 6} r={size * (1.1 + settle * 0.5)} color={rarCol} op={0.55 * (0.7 + 0.3 * Math.sin(f * 0.15 + d.x))} squash={0.45} />
          <div style={{position: 'absolute', left: d.x - size * 0.4, top: gy - 520, width: size * 0.8, height: 520, background: `linear-gradient(0deg, ${rarCol}cc, ${rarCol}00)`, opacity: Math.max(0, 1 - (t - FALL) / 40) * 0.75 + settle * 0.18, mixBlendMode: 'screen', zIndex: z}} />
        </>
      )}
      <ItemAt id={d.id} x={d.x} y={cy} size={size} sx={sx * (1 + sq)} scale={1 - sq} shadow={0} z={z + 1} glint={d.rar === 'epic'} />
    </>
  );
};

const Tags: FC<{cfg: Cfg; items: DI[]}> = ({cfg, items: ITEMS}) => {
  const {ROWS, BASE, FALL, T_REST, dropAt} = cfg;
  const f = useCurrentFrame();
  return (
    <>
      {ITEMS.filter((d) => d.rar === 'rare' || d.rar === 'epic').map((d) => {
        const {gy, s} = ROWS[d.row];
        const at = dropAt(d) + T_REST + 2;
        const p = prog(f, at, 12, EASE.back);
        if (p <= 0) return null;
        const col = RAR[d.rar!].color;
        return (
          <div key={d.id} style={{position: 'absolute', left: d.x, top: gy - BASE * s - 64 - Math.sin(f * 0.1 + d.x) * 4, transform: `translate(-50%, 0) scale(${p})`, opacity: clamp01(p * 2), zIndex: 60}}>
            <OreChip dot={col} color={col}>
              {d.name ?? ''}
            </OreChip>
          </div>
        );
      })}
    </>
  );
};

export const DropBounce: FC<DropProps> = ({
  bg,
  audio = true,
  items: ITEMS = DEFAULT_ITEMS,
  rows: ROWS = DEFAULT_ROWS,
  baseSize: BASE = 232,
  fallFrames: FALL = 16,
  bounceFrames: BOUNCE = [13, 9, 6],
  bounceHeights: HEIGHT = [230, 100, 38],
  startAt = 4,
  step = 3,
}) => {
  const T_REST = FALL + BOUNCE.reduce((a, b) => a + b, 0);
  const dropAt = (d: DI) => startAt + d.order * step;
  const cfg: Cfg = {ROWS, BASE, FALL, BOUNCE, HEIGHT, T_REST, dropAt};
  const f = useCurrentFrame();
  const order = [...ITEMS].sort((a, b) => ROWS[a.row].gy - ROWS[b.row].gy || a.x - b.x);
  return (
    <AbsoluteFill style={{background: bg ? '#0c1024' : 'transparent'}}>
      {bg && (
        <>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, #0b1030 0%, #2a2358 24%, #8a4f6a 36%, #f0a060 41%)'}} />
          <Stars x={0} y={0} w={W} h={300} count={22} size={32} colors={['#ffffff', '#ffe9b0', '#bfe6ff']} seed={9} />
          <Glow x={960} y={420} r={800} color="#ffb060" op={0.7} squash={0.55} />
          <div style={{position: 'absolute', left: 960 - 90, top: 270, width: 180, height: 180, background: '#ffe2a0', boxShadow: '0 0 120px 40px #ffb060, inset -20px -20px 0 #ffbf6a'}} />
          <div style={{position: 'absolute', left: 0, top: 300, width: W, height: 140, background: '#251b4a', clipPath: 'polygon(0% 100%, 0% 62%, 6% 62%, 6% 48%, 12% 48%, 12% 30%, 18% 30%, 18% 44%, 26% 44%, 26% 58%, 34% 58%, 34% 70%, 42% 70%, 42% 56%, 50% 56%, 50% 66%, 58% 66%, 58% 50%, 66% 50%, 66% 34%, 74% 34%, 74% 46%, 82% 46%, 82% 28%, 90% 28%, 90% 52%, 100% 52%, 100% 100%)'}} />
          <div style={{position: 'absolute', left: 0, top: 360, width: W, height: 90, background: '#150f33', clipPath: 'polygon(0% 100%, 0% 70%, 8% 70%, 8% 54%, 16% 54%, 16% 66%, 24% 66%, 24% 40%, 32% 40%, 32% 60%, 44% 60%, 44% 74%, 52% 74%, 52% 50%, 60% 50%, 60% 38%, 70% 38%, 70% 62%, 80% 62%, 80% 48%, 92% 48%, 92% 64%, 100% 64%, 100% 100%)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 436, bottom: 0, perspective: 640, perspectiveOrigin: '50% 0%', overflow: 'hidden', background: '#10131f'}}>
            <div style={{position: 'absolute', left: '-60%', width: '220%', top: 0, height: 2600, transformOrigin: '50% 0%', transform: 'rotateX(66deg)', backgroundImage: `url(${block('polished_deepslate')})`, backgroundSize: '128px 128px', backgroundPosition: `${f * 0.3}px 0`, ...px, filter: 'brightness(0.85)'}} />
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(240,160,96,0.75) 0%, rgba(40,30,60,0.25) 26%, rgba(6,8,16,0.4) 100%)'}} />
          </div>
          <Rays x={960} y={420} size={2300} color="255,190,120" op={0.1} n={12} speed={0.15} />
        </>
      )}
      {order.map((d, i) => (
        <Drop key={d.id} d={d} z={ROWS[d.row].gy / 10 + i} cfg={cfg} />
      ))}
      <Tags cfg={cfg} items={ITEMS} />
      {ITEMS.map((d) => {
        const {gy, s} = ROWS[d.row];
        const land = dropAt(d) + FALL;
        const dust = d.rar ? ['#ffffff', RAR[d.rar].glow, '#ffe9b0'] : ['#d8c9a8', '#a89574', '#ffffff'];
        return (
          <div key={`fx${d.id}`}>
            <PixelBurst x={d.x} y={gy - 4} at={land} count={d.rar ? 28 : 16} colors={dust} speed={14 * s} life={20} size={14 * s} seed={d.order + 3} gravity={0.5} />
            <PixelBurst x={d.x} y={gy - 4} at={land + BOUNCE[0]} count={7} colors={dust} speed={7 * s} life={12} size={9 * s} seed={d.order + 40} gravity={0.4} />
            {d.rar && f >= land + 8 && <Twinkles x={d.x} y={gy - 70 * s} radius={80 * s + 30} count={d.rar === 'epic' ? 7 : 4} size={36} seed={d.order + 5} />}
          </div>
        );
      })}
      <Embers x={0} y={500} w={W} h={560} count={28} colors={['#ffe9b0', '#ffffff', '#ffb060']} seed={5} size={8} life={120} sway={40} amount={prog(f, 40, 40, (t) => t)} opacity={0.7} />
      {bg && <Vig s={0.6} color="6,4,18" inner={46} />}
      {audio && ITEMS.map((d, i) => (
        <Sfx key={d.id} at={dropAt(d) + FALL} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.2 + (d.row === 2 ? 0.08 : 0)} rate={0.9 + (i % 5) * 0.08} />
      ))}
      {audio && ITEMS.filter((d) => d.rar).map((d) => (
        <Sfx key={`o${d.id}`} at={dropAt(d) + FALL + 1} src={mcSound('random/orb')} volume={0.3} rate={d.rar === 'epic' ? 1.3 : 1.05} />
      ))}
    </AbsoluteFill>
  );
};
export const DROP_FRAMES = 150;
