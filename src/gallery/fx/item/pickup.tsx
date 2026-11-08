import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PixelBurst, Shockwave} from '../../../mc/Fx';
import {block} from '../../../mc/assets';
import {PixelSprite} from '../../flat';
import {OreChip, nine} from '../../../mg/Ore';
import {Sfx, mcSound} from '../../../reel/kit';
import {Blob, Cell, EASE, Embers, FloatText, Glow, Hud, ItemAt, OutlineT, Pt, Stars, Vig, W, H, RAR, clamp01, jiggle, lerp, prog, Item, px, snap, type RarityKey} from './kit';

/**
 * item-pickup: items hover on the ground, get pulled to the hotbar one after another along a curve with an afterimage trail,
 * slots flash and bump, stacks count up (+1), a pickup log scrolls on the right.
 * Props: see PickupProps. `bg` - sky, sun, clouds and grass floor (Demo). Without it (Layer): HUD, items and effects on transparent.
 */

export type PickupItem = {
  /** 物品 id */
  id: string;
  /** 显示名称(日志与飘字使用) */
  name: string;
  /** 地面位置横坐标(像素) */
  x: number;
  /** 地面位置纵坐标(物品脚下,像素) */
  gy: number;
  /** 物品缩放(1 = 200px) */
  s: number;
  /** 飞入的快捷栏格序号(0-8) */
  slot: number;
  /** 开始被吸走的本地帧 */
  at: number;
  /** 稀有度(rare / epic 会带光晕与彩色飘字) */
  rar?: RarityKey;
  /** 飞行拖尾与落入爆发的粒子颜色 */
  col: string[];
};
type PI = PickupItem;

export type PickupProps = {
  /** 是否绘制白天天空与草地;默认不画(透明) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示快捷栏上方的经验条、生命与饥饿 */
  status?: boolean;
  /** 是否显示右侧拾取日志 */
  showLog?: boolean;
  /** 被拾取的物品列表(位置、目标格、拾取时间) */
  picks?: PickupItem[];
  /** 快捷栏 9 格初始内容(拾取后数量逐个 +1) */
  baseSlots?: {id?: string; count?: number}[];
  /** 从被吸走到落入格子的飞行帧数 */
  pullFrames?: number;
  /** 右侧日志文字模板,{name} 会被替换 */
  logText?: string;
  /** 落入格子时的飘字模板,{name} 会被替换 */
  floatText?: string;
};
const HB_SIZE = 96;
const HB_X = 960 - (9 * HB_SIZE + 8 * 4) / 2; // 512
const HB_Y = 936;
const slotC = (i: number): [number, number] => [HB_X + i * (HB_SIZE + 4) + HB_SIZE / 2, HB_Y + HB_SIZE / 2];

const DEFAULT_PICKS: PI[] = [
  {id: 'iron_ingot', name: '铁锭', x: 250, gy: 740, s: 1, slot: 2, at: 26, col: ['#ffffff', '#d4d6da', '#9a9ca2']},
  {id: 'diamond', name: '钻石', x: 1590, gy: 600, s: 0.8, slot: 4, at: 42, rar: 'rare', col: ['#ffffff', '#55ffff', '#aaf6ff']},
  {id: 'arrow', name: '箭', x: 1710, gy: 840, s: 1.2, slot: 5, at: 58, col: ['#ffffff', '#c9a35a', '#9a9ca2']},
  {id: 'golden_apple', name: '金苹果', x: 960, gy: 610, s: 0.8, slot: 6, at: 72, rar: 'rare', col: ['#ffffff', '#ffd23f', '#ffaa00']},
  {id: 'bread', name: '面包', x: 420, gy: 850, s: 1.2, slot: 7, at: 86, col: ['#ffffff', '#d9a05a', '#a9742a']},
  {id: 'torch', name: '火把', x: 1310, gy: 745, s: 1, slot: 3, at: 100, col: ['#ffffff', '#ffd23f', '#ff9a3c']},
];
const DEFAULT_BASE_SLOTS: {id?: string; count?: number}[] = [
  {id: 'diamond_sword'},
  {id: 'bow'},
  {id: 'iron_ingot', count: 14},
  {id: 'torch', count: 32},
  {},
  {id: 'arrow', count: 27},
  {},
  {id: 'bread', count: 9},
  {id: 'water_bucket'},
];

const pullPos = (p: PI, f: number, PULL: number): {x: number; y: number; t: number; sc: number} => {
  const size = 200 * p.s;
  const sx = p.x;
  const sy = p.gy - size / 2 - 14;
  const [tx, ty] = slotC(p.slot);
  const t = clamp01((f - p.at) / PULL);
  const e = EASE.in(t);
  // curve: rises first then drops into the slot
  const cx = lerp(sx, tx, e);
  const cy = lerp(sy, ty, e) - Math.sin(t * Math.PI) * 220;
  return {x: cx, y: cy, t, sc: lerp(1, 0.42, e)};
};

const Tree: FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <div style={{position: 'absolute', left: x - 60 * k, top: y - 260 * k, width: 120 * k, height: 260 * k}}>
    <div style={{position: 'absolute', left: 40 * k, top: 130 * k, width: 40 * k, height: 130 * k, backgroundImage: `url(${block('oak_log')})`, backgroundSize: `${40 * k}px ${40 * k}px`, ...px, filter: 'brightness(0.75)'}} />
    {[
      [0, 70, 120, 70],
      [20, 20, 80, 60],
      [-10, 100, 140, 36],
    ].map(([lx, ly, lw, lh], i) => (
      <div key={i} style={{position: 'absolute', left: lx * k + 0, top: ly * k, width: lw * k, height: lh * k, backgroundImage: `url(${block('oak_leaves')})`, backgroundSize: `${40 * k}px ${40 * k}px`, ...px, filter: 'sepia(1) hue-rotate(58deg) saturate(3) brightness(0.62)'}} />
    ))}
  </div>
);

const Grass: FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, bottom: 0, perspective: 660, perspectiveOrigin: '50% 0%', overflow: 'hidden', background: '#2a5a24'}}>
      <div style={{position: 'absolute', left: '-60%', width: '220%', top: 0, height: 2600, transformOrigin: '50% 0%', transform: 'rotateX(66deg)', backgroundImage: `url(${block('grass_block_top')})`, backgroundSize: '128px 128px', backgroundPosition: `${f * 0.2}px 0`, ...px, filter: 'sepia(1) hue-rotate(58deg) saturate(2.6) brightness(0.85)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(190,235,160,0.7) 0%, rgba(40,90,30,0) 28%, rgba(8,24,8,0.35) 100%)'}} />
    </div>
  );
};

export const Pickup: FC<PickupProps> = ({
  bg,
  audio = true,
  status = true,
  showLog = true,
  picks: PICKS = DEFAULT_PICKS,
  baseSlots: BASE_SLOTS = DEFAULT_BASE_SLOTS,
  pullFrames: PULL = 18,
  logText = '拾取 {name} ×1',
  floatText = '+1 {name}',
}) => {
  const f = useCurrentFrame();
  const hud = prog(f, 0, 14);

  // hotbar state
  const slots = BASE_SLOTS.map((s, i) => {
    const picks = PICKS.filter((p) => p.slot === i);
    let count = s.count ?? 0;
    let id = s.id;
    let lastAt = -99;
    picks.forEach((p) => {
      if (f >= p.at + PULL) {
        count += 1;
        id = p.id;
        lastAt = p.at + PULL;
      }
    });
    const dt = f - lastAt;
    const bump = dt >= 0 && dt < 14 ? 1 + jiggle(dt / 14, 2.5, 3.2) * 0.45 : 1;
    const flash = dt >= 0 && dt < 8 ? 1 - dt / 8 : 0;
    return {id, count, bump, flash, hover: dt >= 0 && dt < 14};
  });

  return (
    <AbsoluteFill style={{background: bg ? '#6fb7ff' : 'transparent'}}>
      {bg && (
        <>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, #4f9be8 0%, #8ecbff 34%, #d8f0ff 46%)'}} />
          <div style={{position: 'absolute', left: 1480, top: 90, width: 150, height: 150, background: '#fff6b8', boxShadow: '0 0 140px 50px #fff2a0, inset -16px -16px 0 #ffe27a'}} />
          {[
            [140, 90, 20],
            [620, 200, 16],
            [1000, 70, 22],
            [1380, 260, 14],
            [1700, 150, 18],
          ].map(([x, y, p], i) => (
            <div key={i} style={{position: 'absolute', left: x + Math.sin(f * 0.01 + i) * 24, top: y, opacity: 0.95}}>
              <PixelSprite sprite="cloud" px={p} />
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, top: 380, width: W, height: 100, background: '#5f9ccf', clipPath: 'polygon(0% 100%, 0% 50%, 10% 50%, 10% 30%, 20% 30%, 20% 55%, 32% 55%, 32% 22%, 44% 22%, 44% 48%, 56% 48%, 56% 62%, 70% 62%, 70% 30%, 82% 30%, 82% 52%, 100% 52%, 100% 100%)'}} />
          {[[120, 520, 1.05], [560, 500, 0.8], [1240, 505, 0.85], [1580, 525, 1.1], [1840, 500, 0.8]].map(([x, y, k], i) => (
            <Tree key={i} x={x} y={y} k={k} />
          ))}
          <Grass />
          <Vig s={0.35} color="0,20,40" inner={55} />
        </>
      )}

      {/* ground items: shadow + hover; pulled ones fly */}
      {[...PICKS].sort((a, b) => a.gy - b.gy).map((p, idx) => {
        const size = 200 * p.s;
        const appear = prog(f, 2 + idx * 3, 14, EASE.back);
        const pull = pullPos(p, f, PULL);
        const pulled = f >= p.at;
        const done = f >= p.at + PULL;
        if (done) return null;
        const bob = Math.sin(f * 0.1 + p.x) * 7 * p.s;
        const spin = (f * (pulled ? 0.55 : 0.1) + p.x * 0.02) % (Math.PI * 2);
        const cosA = Math.cos(spin);
        const sx = Math.sign(cosA || 1) * Math.max(0.16, Math.abs(cosA));
        const baseY = p.gy - size / 2 - 14 - bob;
        const x = pulled ? pull.x : p.x;
        const y = pulled ? pull.y : baseY;
        const sc = (pulled ? pull.sc : 1) * appear;
        const rarCol = p.rar ? RAR[p.rar].glow : '#ffffff';
        const ringT = clamp01((f - p.at + 10) / 10);
        return (
          <div key={p.id}>
            <Blob x={p.x} y={p.gy + 4} w={size * 0.9} h={size * 0.24} op={0.4 * (pulled ? 1 - pull.t : 1) * appear} />
            {/* magnet pull ticks: four pixel squares slide in towards the item (no ring) */}
            {f >= p.at - 10 && f < p.at + 6 && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([qx, qy], q) => {
              const k = Math.floor((1 - ringT) * 4) / 4;
              const sq = 12 * p.s;
              return <div key={q} style={{position: 'absolute', left: Math.round((p.x + qx * size * (0.35 + 0.5 * k) - sq / 2) / 4) * 4, top: Math.round((p.gy + qy * size * (0.35 + 0.5 * k) * 0.28 - sq / 2) / 4) * 4, width: sq, height: sq, background: rarCol, opacity: (1 - ringT) * 0.9}} />;
            })}
            {p.rar && <Glow x={p.x} y={p.gy - 20} r={size * 0.9} color={rarCol} op={0.45 * appear * (pulled ? 1 - pull.t : 1)} squash={0.5} />}
            {pulled &&
              [1, 2, 3, 4].map((k) => {
                const q = pullPos(p, f - k * 1.6, PULL);
                if (q.t <= 0) return null;
                return <ItemAt key={k} id={p.id} x={q.x} y={q.y} size={size} scale={q.sc * 0.95} sx={sx} op={0.34 / k} z={40 - k} />;
              })}
            <ItemAt id={p.id} x={x} y={y} size={size} scale={sc} sx={sx} shadow={pulled ? 0 : 10} z={50} />
            {pulled && pull.t < 1 && <PixelBurst x={x} y={y} at={Math.max(p.at, f)} count={2} colors={p.col} speed={4} life={10} size={10} seed={p.at + f} gravity={0.2} />}
          </div>
        );
      })}

      {/* HUD */}
      <div style={{opacity: hud, transform: `translateY(${(1 - hud) * 80}px)`}}>
        <div style={{position: 'absolute', left: HB_X - 16, top: HB_Y - 16, width: 9 * HB_SIZE + 8 * 4 + 32, height: HB_SIZE + 32, ...nine('panel_glass', [2, 2, 2, 2]), opacity: 0.95}} />
        <div style={{position: 'absolute', left: HB_X, top: HB_Y, display: 'flex', gap: 4}}>
          {slots.map((s, i) => (
            <Cell key={i} id={s.id} count={s.count > 0 ? s.count : undefined} frame={s.hover ? 'slot_hover' : 'slot'} size={HB_SIZE} item={0.7} itemScale={s.bump}>
              {s.flash > 0 && <div style={{position: 'absolute', inset: 8, background: '#fff', opacity: s.flash * 0.9}} />}
            </Cell>
          ))}
        </div>
        {status && (
          <>
        {/* xp + hearts + food */}
        <Hud p="experience_bar_background" w={182} h={5} scale={5} x={HB_X - 7} y={HB_Y - 54} />
        <Hud p="experience_bar_progress" w={182} h={5} scale={5} x={HB_X - 7} y={HB_Y - 54} style={{clipPath: `inset(0 ${(1 - lerp(0.35, 0.5, clamp01(f / 100))) * 100}% 0 0)`}} />
        {Array.from({length: 10}, (_, i) => (
          <div key={i}>
            <Hud p="heart/container" w={9} h={9} scale={5} x={HB_X + i * 40} y={HB_Y - 112} />
            <Hud p="heart/full" w={9} h={9} scale={5} x={HB_X + i * 40} y={HB_Y - 112} />
          </div>
        ))}
        {Array.from({length: 10}, (_, i) => (
          <div key={i}>
            <Hud p="food_empty" w={9} h={9} scale={5} x={HB_X + 9 * HB_SIZE + 8 * 4 - 45 - i * 40} y={HB_Y - 112} />
            <Hud p="food_full" w={9} h={9} scale={5} x={HB_X + 9 * HB_SIZE + 8 * 4 - 45 - i * 40} y={HB_Y - 112} />
          </div>
        ))}
          </>
        )}
      </div>

      {/* arrival effects */}
      {PICKS.map((p) => {
        const [tx, ty] = slotC(p.slot);
        const at = p.at + PULL;
        return (
          <div key={p.id}>
            <PixelBurst x={tx} y={ty} at={at} count={26} colors={p.col} speed={16} life={22} size={12} seed={p.at} gravity={0.35} />
            <Shockwave x={tx} y={ty} at={at} color={p.rar ? RAR[p.rar].color : '#ffffff'} maxR={150} life={14} width={10} />
            <FloatText x={tx} y={HB_Y - 190} at={at} life={34} rise={80} color={p.rar ? RAR[p.rar].color : '#ffff55'} size={48}>
              {floatText.replace('{name}', p.name)}
            </FloatText>
            {f >= at && f < at + 8 && <Pt name="flash" x={tx} y={ty} size={snap(260)} op={1 - (f - at) / 8} blend="screen" />}
          </div>
        );
      })}

      {/* pickup log */}
      {showLog && <div style={{position: 'absolute', right: 56, top: 120, width: 380, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end'}}>
        {PICKS.map((p) => {
          const at = p.at + PULL;
          const t = f - at;
          if (t < 0 || t > 90) return null;
          const pin = prog(f, at, 10, EASE.back);
          const out = clamp01((t - 70) / 20);
          return (
            <div key={p.id} style={{transform: `translateX(${(1 - pin) * 200 + out * 120}px)`, opacity: clamp01(pin * 2) * (1 - out)}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <OreChip dot={p.rar ? RAR[p.rar].color : '#6cc349'} color="#fff">
                  {logText.replace('{name}', p.name)}
                </OreChip>
                <Item id={p.id} size={56} />
              </div>
            </div>
          );
        })}
      </div>}

      {bg && <Embers x={0} y={420} w={W} h={560} count={26} colors={['#ffffff', '#fff6b8', '#c8f08a']} seed={21} size={8} life={140} sway={50} opacity={0.7} />}

      {audio && PICKS.map((p, i) => (
        <Sfx key={p.id} at={p.at} src={mcSound('random/fuse')} volume={0.12} rate={2 + i * 0.1} cut={8} />
      ))}
      {audio && PICKS.map((p, i) => (
        <Sfx key={`p${p.id}`} at={p.at + PULL} src={mcSound('random/pop')} volume={0.5} rate={0.95 + i * 0.07} />
      ))}
      {audio && PICKS[1] && <Sfx at={PICKS[1].at + PULL} src={mcSound('random/orb')} volume={0.3} rate={1.3} />}
      {audio && PICKS[3] && <Sfx at={PICKS[3].at + PULL} src={mcSound('random/orb')} volume={0.3} rate={1.5} />}
    </AbsoluteFill>
  );
};
export const PICKUP_FRAMES = 140;
