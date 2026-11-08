import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {block, tex} from '../../../mc/assets';
import {Crop} from '../../mob';
import {OreChip, OreSection, OreText, TYPE} from '../../../mg/Ore';
import {Sfx, mcSound} from '../../../reel/kit';
import {Blob, Cell, EASE, Embers, FloatText, Glow, Head, ItemAt, Panel, Pile, Pix, Pt, Rays, Stars, TileBg, U, Vig, W, H, RAR, arcPos, clamp01, jiggle, lerp, mulberry32, prog, px, snap, type RarityKey} from './kit';

/**
 * item-chest-loot: a vault with torches; the chest rattles, the lid swings open with a burst of light, 21 items shoot out in
 * arcs and land in a loot grid, then the rare ones are enlarged and highlighted with name tags.
 * Props: see ChestProps (loot list, texts, timings, bg, audio). `bg` (default true) draws the torch-lit vault.
 */

export type ChestLootItem = {
  /** 物品 id */
  id: string;
  /** 战利品网格列(0-6) */
  c: number;
  /** 战利品网格行(0-2) */
  r: number;
  /** 堆叠数量(省略或 1 不显示数字) */
  count?: number;
  /** 稀有度:rare / epic 会在最后逐个放大高亮并挂名牌 */
  rar?: RarityKey;
  /** 名牌文字(有稀有度时显示) */
  name?: string;
};
type Loot = ChestLootItem;

export type ChestProps = {
  /** 是否绘制地牢背景(苔石墙、金色辉光、地板、四支火把、木桶与金块、材料堆、飘尘、暗角);false 时只剩宝箱/战利品面板/特效 */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 标题点缀色,#rrggbb */
  accent?: string;
  /** 战利品面板标题 */
  panelTitle?: string;
  /** 战利品列表(位置、数量、稀有度),喷出顺序见 order */
  loot?: ChestLootItem[];
  /** 喷出顺序:loot 下标的排列;默认 21 件用内置乱序,其他数量按列表顺序 */
  order?: number[];
  /** 稀有计数标签前缀 */
  rareLabel?: string;
  /** 全部稀有物品高亮后的飘字 */
  rareText?: string;
  /** 宝箱开始抖动的本地帧 */
  rattleAt?: number;
  /** 宝箱开盖的本地帧 */
  openAt?: number;
  /** 第一件物品喷出的本地帧 */
  spewAt?: number;
  /** 相邻物品喷出的间隔帧 */
  spewStep?: number;
  /** 第一件稀有物品开始高亮的本地帧 */
  highlightAt?: number;
  /** 相邻稀有物品高亮的间隔帧 */
  highlightStep?: number;
};
const DEFAULT_LOOT: Loot[] = [
  {id: 'bread', c: 0, r: 0, count: 3},
  {id: 'coal', c: 1, r: 0, count: 8},
  {id: 'iron_ingot', c: 2, r: 0, count: 5},
  {id: 'gold_ingot', c: 3, r: 0, count: 3},
  {id: 'enchanted_book', c: 4, r: 0, rar: 'rare', name: '附魔书'},
  {id: 'arrow', c: 5, r: 0, count: 12},
  {id: 'bone', c: 6, r: 0, count: 4},
  {id: 'string', c: 0, r: 1, count: 6},
  {id: 'diamond', c: 1, r: 1, rar: 'rare', name: '钻石', count: 2},
  {id: 'gunpowder', c: 2, r: 1, count: 7},
  {id: 'redstone', c: 3, r: 1, count: 9},
  {id: 'lapis_lazuli', c: 4, r: 1, count: 6},
  {id: 'golden_apple', c: 5, r: 1, rar: 'rare', name: '金苹果'},
  {id: 'saddle', c: 6, r: 1},
  {id: 'name_tag', c: 0, r: 2},
  {id: 'emerald', c: 1, r: 2, count: 4},
  {id: 'netherite_ingot', c: 2, r: 2, rar: 'epic', name: '下界合金锭'},
  {id: 'iron_horse_armor', c: 3, r: 2},
  {id: 'experience_bottle', c: 4, r: 2, count: 3},
  {id: 'totem_of_undying', c: 5, r: 2, rar: 'epic', name: '不死图腾'},
  {id: 'music_disc_13', c: 6, r: 2},
];
const S = 120;
const GAP = 12;
const PX0 = 410;
const PY0 = 166;
const PW = 1100;
const PH = 530;
const GX = PX0 + (PW - (7 * S + 6 * GAP)) / 2;
const GY = PY0 + 100;
const cellC = (c: number, r: number): [number, number] => [GX + c * (S + GAP) + S / 2, GY + r * (S + GAP) + S / 2];

const FLY = 22;
const MOUTH: [number, number] = [960, 800];

// order items fly out in (shuffled but fixed)
const DEFAULT_ORDER = [3, 9, 0, 14, 6, 17, 1, 11, 19, 5, 15, 8, 2, 12, 20, 7, 16, 4, 13, 10, 18];

const CP = 28; // one texel of entity/chest/normal.png on screen (real vanilla chest texture)
const CHEST_TEX = tex('entity/chest/normal.png');
const CHEST_W = 14 * CP;
const CHEST_X = 960 - CHEST_W / 2;
const BODY_TOP = 1030 - 10 * CP;
const LID_TOP = BODY_TOP - 5 * CP;

const Chest: FC<{open: number; rattle: number}> = ({open, rattle}) => {
  const f = useCurrentFrame();
  const ang = -64 * open;
  const dx = Math.sin(f * 2.3) * 5 * rattle;
  const dy = Math.abs(Math.sin(f * 1.7)) * -4 * rattle;
  return (
    <div style={{position: 'absolute', left: CHEST_X + dx, top: 0, width: CHEST_W, height: H, perspective: 1300, perspectiveOrigin: '50% 60%', transform: `translateY(${dy}px)`}}>
      <Blob x={CHEST_W / 2} y={1030} w={CHEST_W * 1.25} h={52} op={0.5} />
      <div style={{position: 'absolute', left: 0, top: BODY_TOP, filter: 'drop-shadow(0 10px 0 rgba(0,0,0,0.4))'}}>
        <Crop src={CHEST_TEX} sheet={[64, 64]} rect={[14, 33, 14, 10]} scale={CP} />
      </div>
      {/* opening interior */}
      <div style={{position: 'absolute', left: CP, top: BODY_TOP - 2, width: CHEST_W - 2 * CP, height: CP * 1.4, background: 'linear-gradient(180deg, #ffe9a0 0%, #f6b53a 50%, #7a4a14 100%)', opacity: clamp01(open * 2), boxShadow: `0 0 ${60 * open}px ${20 * open}px #ffd060`}} />
      {/* lid */}
      <div style={{position: 'absolute', left: 0, top: LID_TOP, width: CHEST_W, height: 5 * CP, transformOrigin: '50% 100%', transform: `rotateX(${ang}deg)`, transformStyle: 'preserve-3d', filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.3))'}}>
        <Crop src={CHEST_TEX} sheet={[64, 64]} rect={[14, 14, 14, 5]} scale={CP} />
        {/* latch from the same texture (lid front 2x4 at 1,1) */}
        <Crop src={CHEST_TEX} sheet={[64, 64]} rect={[1, 1, 2, 4]} scale={CP} style={{position: 'absolute', left: 6 * CP, top: 2 * CP}} />
      </div>
    </div>
  );
};

const Torch: FC<{x: number; y: number; seed: number}> = ({x, y, seed}) => {
  const f = useCurrentFrame();
  const fl = 0.8 + 0.2 * Math.sin(f * 0.6 + seed) * Math.sin(f * 0.37 + seed * 2);
  return (
    <>
      <Glow x={x} y={y - 20} r={420} color="#ff9a3c" op={0.6 * fl} />
      <div style={{position: 'absolute', left: x - 80, top: y - 50, width: 160, height: 160, backgroundImage: `url(${block('torch')})`, backgroundSize: '160px 160px', ...px, filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.4))'}} />
      <Pt name="flame" x={x} y={y - 38 - fl * 6} size={snap(88 + fl * 14, 4)} blend="screen" />
      <Pt name="flame" x={x + 4} y={y - 52 - fl * 10} size={snap(54, 4)} op={0.8} blend="screen" filter="brightness(1.4)" />
    </>
  );
};

export const ChestLoot: FC<ChestProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '开箱战利品',
  subtitle = '掀盖 · 喷出 · 高亮',
  tag = 'LOOT',
  headIcon = 'chest_minecart',
  accent = '#ffd060',
  panelTitle = '战利品箱',
  loot: LOOT = DEFAULT_LOOT,
  order,
  rareLabel = '稀有',
  rareText = '稀有战利品!',
  rattleAt: T_RATTLE = 22,
  openAt: T_OPEN = 46,
  spewAt: T_SPEW = 56,
  spewStep: SPEW_STEP = 3,
  highlightAt: T_HI = 138,
  highlightStep: HI_STEP = 9,
}) => {
  const ORDER = order ?? (LOOT.length === DEFAULT_ORDER.length ? DEFAULT_ORDER : LOOT.map((_, i) => i));
  const launch = (idx: number) => T_SPEW + ORDER.indexOf(idx) * SPEW_STEP;
  const f = useCurrentFrame();
  const open = prog(f, T_OPEN, 16, EASE.back);
  const rattle = f >= T_RATTLE && f < T_OPEN ? Math.min(1, (f - T_RATTLE) / 6) * (1 + (f - T_RATTLE) / 10) * 0.6 : 0;
  const intro = prog(f, 0, 14);
  const landed = LOOT.filter((_, i) => f >= launch(i) + FLY).length;
  const nRare = LOOT.filter((l) => l.rar).length;
  const raresIdx = LOOT.map((l, i) => (l.rar ? i : -1)).filter((i) => i >= 0);
  const hiOf = (i: number) => {
    const j = raresIdx.indexOf(i);
    return j < 0 ? 0 : prog(f, T_HI + j * HI_STEP, 12, EASE.back);
  };
  const burst = f >= T_OPEN;
  const pulse = 0.85 + 0.15 * Math.sin(f * 0.2);

  return (
    <AbsoluteFill style={{background: bg ? '#0a0806' : 'transparent'}}>
      {bg && (
        <>
          <TileBg tex="mossy_stone_bricks" tile={128} dark={0.62} tint="rgba(255,150,60,0.12)" />
          <Glow x={960} y={900} r={900} color="#ffb040" op={(burst ? 0.55 : 0.12) * pulse} squash={0.6} />
          <div style={{position: 'absolute', left: 0, top: 1028, width: W, height: H - 1028, background: '#17110c', borderTop: '8px solid #070504'}} />

          <Torch x={150} y={440} seed={1} />
          <Torch x={1770} y={440} seed={2} />
          <Torch x={150} y={780} seed={3} />
          <Torch x={1770} y={780} seed={4} />

          {/* side stacks */}
          <ItemAt id="barrel" x={130} y={930} size={200} scale={prog(f, 4, 14, EASE.back)} shadow={12} />
          <ItemAt id="barrel" x={1790} y={930} size={200} scale={prog(f, 6, 14, EASE.back)} shadow={12} />
          <ItemAt id="hay_block" x={300} y={960} size={150} scale={prog(f, 8, 14, EASE.back)} shadow={10} />
          <ItemAt id="gold_block" x={1630} y={965} size={150} scale={prog(f, 10, 14, EASE.back)} shadow={10} />
          <Pile x={620} y={990} items={[['gold_nugget', -50, 4, -10], ['emerald', 10, -6, 12], ['gold_nugget', 60, 8, 6]]} size={72} at={6} />
          <Pile x={1300} y={990} items={[['diamond', -50, 4, -10], ['gold_nugget', 10, -6, 12], ['emerald', 60, 8, 6]]} size={72} at={6} />
        </>
      )}

      {/* light shaft from chest */}
      {burst && <Rays x={MOUTH[0]} y={MOUTH[1]} size={2200} color="255,215,110" op={0.34 * EASE.out(clamp01((f - T_OPEN) / 14)) * (0.75 + 0.25 * pulse)} n={16} speed={0.3} />}
      {burst && <div style={{position: 'absolute', left: 960 - 300, top: 0, width: 600, height: MOUTH[1] + 10, background: 'linear-gradient(0deg, rgba(255,220,120,0.55), rgba(255,220,120,0))', mixBlendMode: 'screen', opacity: EASE.out(clamp01((f - T_OPEN) / 16)) * 0.9, clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)'}} />}

      {/* loot panel */}
      <div style={{opacity: intro, transform: `translateY(${(1 - intro) * -50}px)`}}>
        <Panel x={PX0} y={PY0} w={PW} h={PH} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
          </div>
          <div style={{position: 'absolute', right: 28, top: 54}}>
            <OreChip dot={landed >= LOOT.length ? '#b8f040' : '#f8af2b'} color="#fff">
              {`${landed} / ${LOOT.length}`}
            </OreChip>
          </div>
          <div style={{position: 'absolute', left: 28, top: 54}}>
            <OreChip dot="#ff55ff" color="#ff9aff">
              {`${rareLabel} ${LOOT.filter((l, i) => l.rar && f >= launch(i) + FLY).length}`}
            </OreChip>
          </div>
        </Panel>
        {LOOT.map((l, i) => {
          const [cx, cy] = cellC(l.c, l.r);
          const here = f >= launch(i) + FLY;
          const hi = hiOf(i);
          const flash = here ? clamp01(1 - (f - launch(i) - FLY) / 8) : 0;
          const rc = l.rar ? RAR[l.rar] : undefined;
          return (
            <div key={i} style={{position: 'absolute', left: cx - S / 2, top: cy - S / 2, zIndex: hi > 0.05 ? 4 : 1}}>
              <Cell size={S} frame={hi > 0.5 ? 'slot_target' : here ? 'slot' : 'slot'} id={here ? l.id : undefined} count={here ? l.count : undefined} item={0.72} itemScale={1 + hi * 0.35 + (here ? 0.3 * jiggle(clamp01((f - launch(i) - FLY) / 14), 2.2, 3.2) : 0)} glint={l.rar === 'epic' && hi > 0.5}>
                {flash > 0 && <div style={{position: 'absolute', inset: 8, background: '#fff', opacity: flash * 0.8}} />}
              </Cell>
              {rc && hi > 0 && (
                <>
                  <div style={{position: 'absolute', left: -8, top: -8, right: -8, bottom: -8, boxShadow: `0 0 ${34 * hi}px ${rc.glow}, inset 0 0 ${20 * hi}px ${rc.glow}88`, outline: `6px solid ${rc.color}`, opacity: hi * (0.7 + 0.3 * pulse), transform: `scale(${1 + hi * 0.14})`, pointerEvents: 'none'}} />
                </>
              )}
            </div>
          );
        })}
        {/* rare name tags */}
        {LOOT.map((l, i) => {
          if (!l.rar) return null;
          const hi = hiOf(i);
          if (hi <= 0) return null;
          const [cx, cy] = cellC(l.c, l.r);
          return (
            <div key={`t${i}`} style={{position: 'absolute', left: cx, top: cy + S / 2 + 18, transform: `translate(-50%, 0) scale(${hi})`, opacity: clamp01(hi * 2), zIndex: 10}}>
              <OreChip dot={RAR[l.rar].color} color={RAR[l.rar].color}>
                {l.name ?? ''}
              </OreChip>
            </div>
          );
        })}
      </div>

      {/* chest */}
      <Chest open={f >= T_OPEN ? open : 0} rattle={rattle} />
      <Glow x={MOUTH[0]} y={MOUTH[1] + 10} r={260 * open} color="#ffd060" op={0.9 * open} />

      {/* flying loot */}
      {LOOT.map((l, i) => {
        const at = launch(i);
        const t = clamp01((f - at) / FLY);
        if (f < at || t >= 1) return null;
        const to = cellC(l.c, l.r);
        const r = mulberry32(i + 11);
        const spread = (r() - 0.5) * 120;
        const [x, y] = arcPos(EASE.out(t), [MOUTH[0] + spread, MOUTH[1]], to, -300 - r() * 120);
        return <ItemAt key={i} id={l.id} x={x} y={y} size={snap(96 + 30 * Math.sin(t * Math.PI), 4)} rot={(r() - 0.5) * 540 * t} scale={0.55 + 0.45 * EASE.out(t)} z={30} shadow={10} />;
      })}
      {LOOT.map((l, i) => {
        const at = launch(i);
        const to = cellC(l.c, l.r);
        const cols = l.rar ? ['#ffffff', RAR[l.rar].color, RAR[l.rar].glow] : ['#ffffff', '#ffe27a', '#d8c9a8'];
        return (
          <div key={`b${i}`}>
            <PixelBurst x={MOUTH[0]} y={MOUTH[1]} at={at} count={5} colors={['#ffffff', '#ffe27a', '#ffd060']} speed={12} life={14} size={10} seed={i + 60} gravity={0.2} />
            <PixelBurst x={to[0]} y={to[1]} at={at + FLY} count={l.rar ? 22 : 8} colors={cols} speed={l.rar ? 15 : 9} life={l.rar ? 22 : 14} size={l.rar ? 12 : 9} seed={i + 90} gravity={0.3} />
          </div>
        );
      })}
      {raresIdx.map((i, j) => {
        const [cx, cy] = cellC(LOOT[i].c, LOOT[i].r);
        const at = T_HI + j * HI_STEP;
        const rc = RAR[LOOT[i].rar!];
        return (
          <div key={i}>
            <Shockwave x={cx} y={cy} at={at} color={rc.color} maxR={220} life={16} width={12} />
            <PixelBurst x={cx} y={cy} at={at} count={26} colors={['#ffffff', rc.color, rc.glow]} speed={18} life={26} size={12} seed={i + 120} gravity={0.2} />
            {f >= at + 6 && <Twinkles x={cx} y={cy} radius={100} count={4} size={36} seed={i + 4} />}
          </div>
        );
      })}

      {/* open burst */}
      <PixelBurst x={MOUTH[0]} y={MOUTH[1]} at={T_OPEN + 2} count={90} colors={['#ffffff', '#ffe27a', '#ffd060', '#ff9a3c']} speed={34} life={42} size={14} seed={5} gravity={0.5} />
      <Shockwave x={MOUTH[0]} y={MOUTH[1]} at={T_OPEN + 2} color="#ffe27a" maxR={560} life={22} width={18} />
      <Shockwave x={MOUTH[0]} y={MOUTH[1]} at={T_OPEN + 6} color="#ffffff" maxR={340} life={16} width={8} />
      <Flash at={T_OPEN + 2} life={9} peak={0.55} color="#fff4c0" />
      {f >= T_OPEN + 10 && <Stars x={760} y={560} w={400} h={260} count={9} size={48} colors={['#ffffff', '#ffe27a']} seed={3} />}
      <Embers x={760} y={500} w={400} h={320} count={30} colors={['#ffe27a', '#ffffff', '#ffb040']} seed={17} size={9} life={80} sway={40} amount={burst ? 1 : 0.1} />
      {bg && <Embers x={0} y={100} w={W} h={900} count={30} colors={['#ffd98a', '#ffffff', '#ffb040']} seed={71} size={8} life={150} sway={60} amount={0.35} opacity={0.6} />}
      <FloatText x={960} y={104} at={T_HI + nRare * HI_STEP} life={40} rise={60} color="#ff9aff" size={72}>
        {rareText}
      </FloatText>
      {bg && <Vig s={0.78} color="8,4,2" inner={42} />}
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && (
        <>
      {[0, 1, 2].map((k) => (
        <Sfx key={k} at={T_RATTLE + k * 7} src={mcSound('dig/wood1')} volume={0.35} rate={1.3 - k * 0.1} />
      ))}
      <Sfx at={T_OPEN} src={mcSound('block/chest/open')} volume={0.7} />
      <Sfx at={T_OPEN + 2} src={mcSound('random/explode2')} volume={0.2} rate={1.8} />
      <Sfx at={T_OPEN + 4} src={mcSound('random/levelup')} volume={0.35} rate={1.2} />
      {ORDER.map((_, k) => k).filter((k) => k % 2 === 0).map((k) => (
        <Sfx key={k} at={T_SPEW + k * SPEW_STEP + FLY} src={mcSound('random/pop')} volume={0.28} rate={0.9 + k * 0.025} />
      ))}
      {raresIdx.map((_, j) => (
        <Sfx key={j} at={T_HI + j * HI_STEP} src={mcSound('random/orb')} volume={0.4} rate={0.9 + j * 0.12} />
      ))}
      <Sfx at={T_HI + nRare * HI_STEP} src={mcSound('ui/toast/challenge_complete')} volume={0.4} />
        </>
      )}
    </AbsoluteFill>
  );
};
export const CHEST_FRAMES = 200;
