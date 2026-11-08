import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shake, Shockwave, Twinkles} from '../../../mc/Fx';
import {OreChip, OrePanel, OreSection, OreText, TYPE} from '../../../mg/Ore';
import {LabelSmall, OreTooltip, Sfx, mcSound} from '../../../reel/kit';
import {Arrow, Blob, Cell, EASE, Embers, Glow, Head, Hanging, Item, ItemAt, OutlineT, Panel, Pile, Rays, Sheen, Stars, TileBg, U, Vig, W, H, arcPos, clamp01, flightState, hexRgb, jiggle, lerp, prog, px, snap} from './kit';
import {nine} from '../../../mg/Ore';

/**
 * item-craft-table: workshop scene, 3x3 recipe (diamond pickaxe). Materials fly in from the piles, the arrow runs,
 * the materials collapse into the result slot and the pickaxe slams out with rays, shockwave and burst.
 * Props: see CraftProps. `bg` (default true) draws the workshop; without it only panel, slots, items and effects remain.
 */

const S = 40 * U; // grid slot
const ISZ = snap(S * 0.75);
const GAP = 2 * U;
const GX = 400;
const GY = 262;
const slotXY = (c: number, r: number): [number, number] => [GX + c * (S + GAP), GY + r * (S + GAP)];
const RES: [number, number] = [1150, 406]; // result slot top-left (size 52U)
const RS = 52 * U;
const ARROW: [number, number] = [936, 470];

export type CraftIngredient = {
  /** 材料物品 id */
  id: string;
  /** 放入的列(0-2) */
  c: number;
  /** 放入的行(0-2) */
  r: number;
  /** 飞入开始的本地帧 */
  at: number;
  /** 飞入起点 [x, y](像素) */
  from: [number, number];
};
type Ing = CraftIngredient;
const ING: Ing[] = [
  {id: 'diamond', c: 0, r: 0, at: 14, from: [1700, 940]},
  {id: 'diamond', c: 1, r: 0, at: 20, from: [1640, 960]},
  {id: 'diamond', c: 2, r: 0, at: 26, from: [1760, 930]},
  {id: 'stick', c: 1, r: 1, at: 34, from: [250, 950]},
  {id: 'stick', c: 1, r: 2, at: 40, from: [190, 970]},
];
const LAND = 13;
const FILL_DUR = 30;

export type CraftProps = {
  /** 是否绘制木工坊背景(木板墙、地板、灯光、工具墙、方块架、材料堆、暗角、飘尘);false 时只剩面板/格子/物品/特效 */
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
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 成品物品 id */
  result?: string;
  /** 成品强调色(光晕、冲击、粒子), #rrggbb */
  accent?: string;
  /** 材料列表(位置、飞入时间、起点);下方材料清单由它自动统计 */
  ingredients?: CraftIngredient[];
  /** 成品提示框行(rare 样式) */
  tooltip?: {text: string; color?: string}[];
  /** 配方类型标签(左) */
  recipeChip?: string;
  /** 材料数量标签(完成前),默认按材料数生成「材料 N 件」 */
  countChip?: string;
  /** 完成后的稀有度标签 */
  doneChip?: string;
  /** 箭头上方状态:未开始 */
  labelIdle?: string;
  /** 箭头上方状态:合成中 */
  labelWorking?: string;
  /** 箭头上方状态:完成 */
  labelDone?: string;
  /** 箭头开始填充的本地帧 */
  fillAt?: number;
  /** 材料汇聚进成品格的本地帧 */
  gatherAt?: number;
  /** 成品砸出(爆发)的本地帧 */
  slamAt?: number;
};

const DEFAULT_TIP = [
  {text: '钻石镐', color: '#55ffff'},
  {text: '效率 · 挖掘等级 4', color: '#a8a8a8'},
  {text: '耐久 1561 / 1561', color: '#7a7a7a'},
];

const Scene: FC<CraftProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '合成台',
  subtitle = '钻石镐 · 3×3 配方',
  tag = 'CRAFT',
  headIcon = 'crafting_table',
  panelTitle = '合成 · 钻石镐',
  result = 'diamond_pickaxe',
  accent = '#55ffff',
  ingredients = ING,
  tooltip = DEFAULT_TIP,
  recipeChip = '有序配方',
  countChip,
  doneChip = '稀有 · 钻石',
  labelIdle = '摆放材料',
  labelWorking = '合成中…',
  labelDone = '完成',
  fillAt: FILL_AT = 58,
  gatherAt: GATHER = 90,
  slamAt: SLAM = 100,
}) => {
  const ING = ingredients;
  const f = useCurrentFrame();
  const open = prog(f, 0, 14);
  const fill = prog(f, FILL_AT, FILL_DUR, EASE.inOut);
  const landedAll = ING.every((g) => f >= g.at + LAND);
  const crafting = f >= FILL_AT && f < GATHER;
  const slammed = f >= SLAM;
  const cam = 1 + prog(f, 0, 100, (t) => t) * 0.025;
  const slamP = prog(f, SLAM, 10, EASE.back);
  const resCx = RES[0] + RS / 2;
  const resCy = RES[1] + RS / 2;
  const lamp = 0.85 + 0.15 * Math.sin(f * 0.21) * Math.sin(f * 0.13);

  return (
    <AbsoluteFill style={{background: bg ? '#1b1209' : 'transparent'}}>
      {bg && (
        <>
          <TileBg tex="oak_planks" tile={128} dark={0.62} tint="rgba(255,150,40,0.10)" />
          {/* back wall beam + floor */}
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 28, background: '#2a1b0e', boxShadow: '0 8px 0 #160e07'}} />
          <div style={{position: 'absolute', left: 0, top: 892, width: W, height: H - 892, background: 'linear-gradient(180deg,#2c1d10 0%, #1a1109 100%)', borderTop: '8px solid #0f0904'}} />
          <Glow x={140} y={90} r={460} color="#ffb040" op={0.45 * lamp} />
          <Glow x={1780} y={90} r={460} color="#ffb040" op={0.45 * lamp} />
          <Glow x={960} y={500} r={760} color="#ff9a3c" op={0.2 + (crafting ? fill * 0.18 : 0)} />
        </>
      )}

      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '50% 50%'}}>
        {bg && (
          <>
        {/* left pegboard with tools */}
        <div style={{position: 'absolute', left: 36, top: 232, width: 300, height: 620, ...nine('panel_glass', [2, 2, 2, 2]), opacity: 0.55 * open}} />
        <Hanging
          items={[
            ['iron_pickaxe', 110, 262, -10],
            ['iron_axe', 250, 272, 8],
            ['shears', 110, 430, -6],
            ['iron_shovel', 250, 440, 10],
            ['bucket', 110, 600, -4],
            ['fishing_rod', 250, 610, 7],
            ['iron_hoe', 110, 745, 8],
            ['flint_and_steel', 250, 755, -8],
          ]}
          size={104}
          at={6}
        />
        {/* right shelves with blocks */}
        {[250, 456, 662].map((y, i) => (
          <div key={y} style={{position: 'absolute', left: 1596, top: y + 150, width: 300, opacity: open}}>
            <div style={{height: 16, background: '#5a3b1e', borderTop: '4px solid #7d5428', boxShadow: '0 8px 0 #1c1209'}} />
          </div>
        ))}
        {(
          [
            ['oak_planks', 1650, 296],
            ['cobblestone', 1760, 306],
            ['iron_block', 1850, 300],
            ['gold_block', 1650, 502],
            ['lapis_block', 1760, 512],
            ['diamond_block', 1850, 506],
            ['bookshelf', 1660, 708],
            ['coal_block', 1770, 716],
            ['redstone_block', 1858, 712],
          ] as [string, number, number][]
        ).map(([id, x, y], i) => {
          const p = prog(f, 8 + i * 3, 14, EASE.back);
          return <ItemAt key={id} id={id} x={x} y={y} size={104} scale={p} op={clamp01(p * 3)} shadow={8} />;
        })}
          </>
        )}

        {/* main panel */}
        <div style={{opacity: open, transform: `scale(${0.92 + 0.08 * EASE.back(clamp01(f / 14))})`, transformOrigin: '50% 45%'}}>
          <Panel x={330} y={176} w={1260} h={716} variant="panel_raised">
            <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
              <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
            </div>
          </Panel>
          {/* grid backing */}
          {Array.from({length: 9}, (_, i) => {
            const c = i % 3;
            const r = Math.floor(i / 3);
            const [x, y] = slotXY(c, r);
            const filled = ING.some((g) => g.c === c && g.r === r);
            const g = ING.find((q) => q.c === c && q.r === r);
            const flash = g ? clamp01(1 - (f - (g.at + LAND)) / 8) * (f >= g.at + LAND ? 1 : 0) : 0;
            return (
              <div key={i} style={{position: 'absolute', left: x, top: y}}>
                <Cell frame={filled && crafting ? 'slot_target' : 'slot'} size={S} />
                {flash > 0 && <div style={{position: 'absolute', inset: 8, background: '#fff', opacity: flash * 0.8}} />}
              </div>
            );
          })}
        </div>

        {/* arrow */}
        <div style={{position: 'absolute', left: ARROW[0], top: ARROW[1], opacity: open}}>
          <Arrow value={fill} u={2 * U + 2} />
        </div>
        <div style={{position: 'absolute', left: ARROW[0] - 10, top: ARROW[1] - 56, opacity: prog(f, 30, 10)}}>
          <LabelSmall color={crafting ? '#f8af2b' : '#b1b2b5'}>{crafting ? labelWorking : slammed ? labelDone : labelIdle}</LabelSmall>
        </div>

        {/* result slot */}
        <div style={{position: 'absolute', left: RES[0], top: RES[1], opacity: open}}>
          <Cell frame={slammed ? 'slot_hover' : 'slot'} size={RS} item={0.66} />
          {!slammed && f >= FILL_AT - 2 && (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.25 + fill * 0.2}}>
              <Item id={result} size={snap(RS * 0.66)} style={{filter: 'brightness(0) invert(1)'}} />
            </div>
          )}
        </div>

        {/* ingredients checklist */}
        <div style={{position: 'absolute', left: 400, top: 786, display: 'flex', gap: 3 * U, opacity: prog(f, 24, 14)}}>
          {Array.from(new Set(ING.map((g) => g.id))).map((id) => {
            const n = ING.filter((g) => g.id === id).length;
            const at = Math.max(...ING.filter((g) => g.id === id).map((g) => g.at));
            const ok = f >= at + LAND;
            return (
              <div key={id} style={{display: 'flex', alignItems: 'center', gap: 10, ...nine('slot', [2, 2, 2, 2]), padding: '6px 20px 6px 10px'}}>
                <Item id={id} size={56} />
                <OreText size={TYPE.body} color={ok ? '#6cc349' : '#d4d6da'} shadow>
                  {`×${n}${ok ? ' ✓' : ''}`}
                </OreText>
              </div>
            );
          })}
        </div>
        {/* recipe info chips */}
        <div style={{position: 'absolute', left: 1150, top: 252, display: 'flex', gap: 12, opacity: prog(f, 10, 14)}}>
          <OreChip dot="#6cc349" color="#fff">
            {recipeChip}
          </OreChip>
          <OreChip dot={slammed ? accent : '#f8af2b'} color={slammed ? accent : '#fff'}>
            {slammed ? doneChip : (countChip ?? `材料 ${ING.length} 件`)}
          </OreChip>
        </div>

        {/* materials piles on the floor */}
        {bg && (
          <>
        <Pile x={1700} y={972} items={[['diamond', -70, 4, -12], ['diamond', 0, -8, 8], ['iron_ingot', 66, 6, 14], ['emerald', -20, 40, 0], ['gold_ingot', 40, 44, -8]]} size={88} at={4} />
        <Pile x={230} y={976} items={[['stick', -60, 0, -20], ['stick', 0, -10, 10], ['oak_planks', 60, 6, 0], ['stick', 14, 40, 30], ['coal', -50, 44, 0]]} size={88} at={4} />
        <Pile x={960} y={990} items={[['crafting_table', 0, 0, 0]]} size={96} at={4} />
          </>
        )}

        {/* fly-in ingredients + in-slot items */}
        {ING.map((g, i) => {
          const [sx, sy] = slotXY(g.c, g.r);
          const to: [number, number] = [sx + S / 2, sy + S / 2];
          const fl = flightState(f, g.at, LAND, g.from, to, -220);
          if (!fl.started) return null;
          const gather = prog(f, GATHER + i * 1.2, 10, EASE.in);
          const toRes: [number, number] = [resCx, resCy];
          const [gx, gy] = arcPos(gather, to, toRes, -60);
          const x = gather > 0 ? gx : fl.x;
          const y = gather > 0 ? gy : fl.y;
          const pulse = crafting ? 1 + 0.06 * Math.sin((f - FILL_AT) * 0.7 + i) + fill * 0.08 : 1;
          const sc = (fl.t < 1 ? lerp(1.5, 1, EASE.out(fl.t)) : 1) * pulse * (1 - gather * 0.8);
          if (gather >= 1) return null;
          return (
            <ItemAt
              key={i}
              id={g.id}
              x={x}
              y={y}
              size={ISZ}
              scale={sc}
              sx={1 + fl.squash}
              rot={fl.t < 1 ? (1 - fl.t) * (i % 2 ? -50 : 50) : 0}
              op={clamp01(fl.t * 5)}
              shadow={fl.t < 1 ? 14 : 6}
              z={5}
            />
          );
        })}
        {/* landing puffs */}
        {ING.map((g, i) => {
          const [sx, sy] = slotXY(g.c, g.r);
          return <PixelBurst key={i} x={sx + S / 2} y={sy + S / 2} at={g.at + LAND} count={14} colors={['#ffffff', '#d9b36a', g.id === ING[0].id ? accent : '#c9a35a']} speed={9} life={16} size={10} seed={20 + i} gravity={0.3} />;
        })}
        {/* crafting sparkles */}
        {crafting && <Twinkles x={GX + (3 * S + 2 * GAP) / 2} y={GY + (3 * S + 2 * GAP) / 2} radius={240} count={12} size={44} seed={3} />}
        {crafting && <Embers x={GX - 20} y={GY + 40} w={3 * S + 40} h={3 * S} count={16} colors={['#aaf6ff', '#ffffff', '#ffe27a']} seed={8} size={8} life={34} amount={fill} sway={14} />}

        {/* slam result */}
        {slammed && (
          <>
            <Rays x={resCx} y={resCy} size={1700} color={hexRgb(accent)} op={0.34 * EASE.out(clamp01((f - SLAM) / 18))} />
            <Glow x={resCx} y={resCy} r={420} color={accent} op={0.55} />
          </>
        )}
        {slammed && (
          <div style={{position: 'absolute', left: resCx - 80, top: resCy - 80, width: 160, height: 160, transform: `scale(${lerp(3.2, 1.25, slamP)})`, opacity: clamp01((f - SLAM + 1) * 0.6), zIndex: 8}}>
            <Item id={result} size={160} glint shadow={10} />
            <Sheen id={result} size={160} hue="white" speed={3} />
          </div>
        )}
        {slammed && <Twinkles x={resCx} y={resCy} radius={190} count={10} size={44} seed={9} />}
        <PixelBurst x={resCx} y={resCy} at={SLAM} count={70} colors={['#ffffff', accent, '#aaf6ff', '#ffff55']} speed={28} life={38} size={14} seed={9} />
        <Shockwave x={resCx} y={resCy} at={SLAM} color={accent} maxR={420} life={20} width={16} />
        <Shockwave x={resCx} y={resCy} at={SLAM + 4} color="#ffffff" maxR={260} life={16} width={8} />
        <Shockwave x={(GX + GX + 3 * S) / 2} y={GY + 1.5 * S} at={GATHER} color="#ffe27a" maxR={200} life={14} width={8} />

        {slammed && (
          <div style={{position: 'absolute', left: RES[0] - 30, top: RES[1] + RS + 26, opacity: prog(f, SLAM + 10, 8), transform: `translateX(${(1 - prog(f, SLAM + 10, 10)) * -30}px)`, zIndex: 9}}>
            <OreTooltip rare lines={tooltip} />
          </div>
        )}
      </div>

      {bg && <Embers x={0} y={0} w={W} h={H} count={34} colors={['#ffd98a', '#ffffff', '#ffb040']} seed={77} size={8} life={140} sway={60} opacity={0.5} />}
      {bg && <Vig s={0.72} color="12,6,2" inner={42} />}
      <Flash at={SLAM} life={8} peak={0.55} color="#e8ffff" />
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && ING.map((g, i) => (
        <Sfx key={i} at={g.at + LAND - 1} src={mcSound(i < 3 ? `dig/stone${(i % 4) + 1}` : 'dig/wood1')} volume={0.4} rate={0.95 + i * 0.07} />
      ))}
      {audio && (
        <>
      <Sfx at={FILL_AT} src={mcSound('block/smithing_table/smithing_table1')} volume={0.4} rate={1.1} />
      <Sfx at={FILL_AT + 14} src={mcSound('random/click')} volume={0.3} rate={1.4} />
      <Sfx at={GATHER} src={mcSound('random/pop')} volume={0.4} rate={0.8} />
      <Sfx at={SLAM} src={mcSound('random/anvil_use')} volume={0.45} rate={1.15} />
      <Sfx at={SLAM} src={mcSound('random/explode1')} volume={0.2} rate={1.6} />
      <Sfx at={SLAM + 3} src={mcSound('random/levelup')} volume={0.4} rate={1.1} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const CraftTable: FC<CraftProps> = (props) => (
  <Shake at={props.slamAt ?? 100} life={14} strength={16}>
    <Scene {...props} />
  </Shake>
);
export const CRAFT_FRAMES = 150;
