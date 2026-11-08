import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {tex, block} from '../../../mc/assets';
import {PixelCursor, OreChip, OreProgress, OreSection, OreText, TYPE, nine} from '../../../mg/Ore';
import {LabelSmall, Sfx, mcSound} from '../../../reel/kit';
import {Puffs, Blob, Cell, EASE, Embers, FloatText, Flame, Glow, Head, Hud, Item, ItemAt, Pile, Panel, Rays, Ripple, SlotRow, Star4, Stars, TileBg, U, Vig, W, H, Arrow, arcPos, clamp01, cursorAt, flightState, jiggle, lerp, prog, px, snap, mulberry32, type SlotSpec} from './kit';

/**
 * item-furnace: smelting scene. Raw iron + coal drop into the furnace UI, the flame lights, the arrow runs, the ingot
 * pops out with sparks and XP orbs, the cursor carries it into the hotbar.
 * Props: see FurnaceProps. `bg` (default true) draws the stone-brick furnace room; without it only the UI, items and effects remain.
 */

const S = 40 * U; // 160
const IN: [number, number] = [500, 236];
const FUEL: [number, number] = [500, 560];
const OUT: [number, number] = [962, 342]; // size 52U = 208
const OS = 52 * U;
const ARROW: [number, number] = [738, 404];
const HB_SIZE = 24 * U;
const HB_X = 960 - (9 * HB_SIZE + 8 * U) / 2;
const HB_Y = 930;
const hbCenter = (i: number): [number, number] => [HB_X + i * (HB_SIZE + U) + HB_SIZE / 2, HB_Y + HB_SIZE / 2];
const TARGET = 4;

const LAND = 12;

export type FurnaceProps = {
  /** 是否绘制炉房背景(石砖墙、炉火辉光、两侧炉子与材料堆、飘尘、暗角);false 时只剩面板/物品/特效/快捷栏 */
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
  /** 强调色(标题点缀),#rrggbb */
  accent?: string;
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 待烧炼物品 id */
  input?: string;
  /** 燃料物品 id */
  fuel?: string;
  /** 产物物品 id */
  output?: string;
  /** 放入的待烧炼物品数量(完成后少 1) */
  inputCount?: number;
  /** 放入的燃料数量(点火后少 1) */
  fuelCount?: number;
  /** 快捷栏 9 格内容(产物落入 targetSlot,数量 +1) */
  hotbar?: {id?: string; count?: number}[];
  /** 产物落入的快捷栏格序号(0-8) */
  targetSlot?: number;
  /** 产物落入时飘出的文字 */
  pickupText?: string;
  /** 右侧「可烧炼」列表标题 */
  listTitle?: string;
  /** 右侧列表 [原料 id, 产物 id],第一行为当前配方 */
  recipes?: [string, string][];
  /** 经验标签(烧炼前) */
  xpChip?: string;
  /** 经验标签(烧炼完成后) */
  xpDoneChip?: string;
  /** 烧炼时间标签 */
  timeChip?: string;
  /** 箭头上方状态:等待放入 */
  labelIdle?: string;
  /** 箭头上方状态:烧炼中 */
  labelWorking?: string;
  /** 箭头上方状态:完成 */
  labelDone?: string;
  /** 待烧炼物品飞入的本地帧 */
  oreAt?: number;
  /** 燃料飞入的本地帧 */
  coalAt?: number;
  /** 火焰点燃的本地帧 */
  flameAt?: number;
  /** 进度箭头开始填充的本地帧 */
  fillAt?: number;
  /** 进度箭头走满所需帧数(产物在 fillAt+fillDur 弹出) */
  fillDur?: number;
  /** 鼠标点起产物的本地帧 */
  clickAt?: number;
  /** 产物放进快捷栏的本地帧 */
  dropAt?: number;
};

const DEFAULT_HOTBAR: {id?: string; count?: number}[] = [
  {id: 'iron_pickaxe'},
  {id: 'iron_sword'},
  {id: 'torch', count: 26},
  {id: 'bread', count: 12},
  {id: 'iron_ingot', count: 3},
  {id: 'coal', count: 41},
  {id: 'cooked_beef', count: 8},
  {id: 'water_bucket'},
  {id: 'oak_planks', count: 64},
];
const DEFAULT_RECIPES: [string, string][] = [
  ['raw_iron', 'iron_ingot'],
  ['raw_gold', 'gold_ingot'],
  ['raw_copper', 'copper_ingot'],
  ['porkchop', 'cooked_porkchop'],
  ['cod', 'cooked_cod'],
];

const FRONT = 176;

/** First frame of an animated block texture strip. */
const Front: FC<{name: string; size: number}> = ({name, size}) => (
  <div style={{position: 'relative', width: size, height: size, backgroundImage: `url(${block(name)})`, backgroundSize: `${size}px auto`, backgroundRepeat: 'no-repeat', ...px}} />
);

const SideFurnace: FC<{x: number; y: number; name: string; lit: number; i: number}> = ({x, y, name, lit, i}) => {
  const f = useCurrentFrame();
  const p = prog(f, 2 + i * 3, 16, EASE.back);
  const flick = 0.8 + 0.2 * Math.sin(f * 0.6 + i * 2) * Math.sin(f * 0.37 + i);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: FRONT, height: FRONT, transform: `scale(${p})`, opacity: clamp01(p * 3)}}>
      <Glow x={FRONT / 2} y={FRONT * 0.62} r={FRONT * 1.2} color="#ff7a1c" op={(0.35 + 0.35 * lit) * flick} />
      <div style={{position: 'absolute', inset: -8, background: '#0c0a09'}} />
      <Front name={name} size={FRONT} />
      <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.5), inset 0 -12px 0 rgba(0,0,0,0.25)'}} />
    </div>
  );
};

const Orbs: FC<{from: [number, number]; to: [number, number]; at: number}> = ({from, to, at}) => {
  const f = useCurrentFrame() - at;
  const r = mulberry32(31);
  if (f < 0 || f > 46) return null;
  return (
    <>
      {Array.from({length: 12}, (_, i) => {
        const a = r() * Math.PI * 2;
        const d = 60 + r() * 120;
        const delay = 6 + Math.floor(r() * 12);
        const t = clamp01((f - delay) / 24);
        const burstT = clamp01(f / delay);
        const cx = from[0] + Math.cos(a) * d * EASE.out(burstT);
        const cy = from[1] + Math.sin(a) * d * EASE.out(burstT) - 30 * Math.sin(burstT * Math.PI);
        const e = EASE.in(t);
        const x = lerp(cx, to[0], e);
        const y = lerp(cy, to[1], e);
        const s = snap(16 - 6 * e, 4);
        const c = (f + i * 3) % 8 < 4 ? '#b8f040' : '#ffe94a';
        return (
          <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, background: c, boxShadow: `0 0 12px ${c}`, opacity: t >= 1 ? 0 : 1}} />
        );
      })}
    </>
  );
};

export const Furnace: FC<FurnaceProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '熔炉',
  subtitle = '铁矿 → 铁锭 · 烧炼',
  tag = 'SMELT',
  headIcon = 'furnace',
  accent = '#ff9a3c',
  panelTitle = '熔炉 · 烧炼铁锭',
  input = 'raw_iron',
  fuel = 'coal',
  output = 'iron_ingot',
  inputCount = 3,
  fuelCount = 5,
  hotbar = DEFAULT_HOTBAR,
  targetSlot: TARGET = 4,
  pickupText = '+1 铁锭',
  listTitle = '可烧炼',
  recipes = DEFAULT_RECIPES,
  xpChip = '经验 0.7',
  xpDoneChip = '经验 +0.7',
  timeChip = '烧炼 200 刻',
  labelIdle = '等待放入',
  labelWorking = '烧炼中…',
  labelDone = '完成',
  oreAt: T_ORE = 14,
  coalAt: T_COAL = 24,
  flameAt: T_FLAME = 42,
  fillAt: T_FILL = 50,
  fillDur: FILL_DUR = 52,
  clickAt: T_CLICK = 122,
  dropAt: T_DROP = 138,
}) => {
  const T_DONE = T_FILL + FILL_DUR;
  const f = useCurrentFrame();
  const open = prog(f, 0, 14);
  const cam = 1 + prog(f, 0, 110, (t) => t) * 0.02;
  const burning = f >= T_FLAME && f < T_DONE + 6;
  const fill = prog(f, T_FILL, FILL_DUR, (t) => t);
  const done = f >= T_DONE;
  const heat = f < T_FLAME ? 0.25 : f < T_DONE + 6 ? 0.55 + 0.45 * prog(f, T_FLAME, 20) : 0.5;
  const flick = 0.85 + 0.15 * Math.sin(f * 0.7) * Math.sin(f * 0.31);
  const pop = prog(f, T_DONE, 10, EASE.back);
  const outC: [number, number] = [OUT[0] + OS / 2, OUT[1] + OS / 2];
  const ISZ = snap(S * 0.75);

  // cursor + ingot carry
  const curPts: [number, number, number][] = [
    [T_DONE + 4, 1640, 700],
    [T_DONE + 16, outC[0] + 8, outC[1] + 8],
    [T_CLICK, outC[0] + 8, outC[1] + 8],
    [T_DROP, hbCenter(TARGET)[0] + 8, hbCenter(TARGET)[1] + 4],
    [T_DROP + 12, hbCenter(TARGET)[0] + 160, hbCenter(TARGET)[1] - 140],
  ];
  const [cx, cy] = cursorAt(f, curPts);
  const carrying = f >= T_CLICK && f < T_DROP;
  const landedT = f - T_DROP;
  const landed = landedT >= 0;
  const slots: SlotSpec[] = hotbar.map((s) => ({id: s.id, count: s.count}));
  const tgt = hotbar[TARGET] ?? {};
  slots[TARGET] = {id: landed || tgt.id ? output : undefined, count: (tgt.count ?? 0) + (landed ? 1 : 0), flash: landed ? clamp01(1 - landedT / 8) : 0, bump: landed ? 1 + jiggle(clamp01(landedT / 14), 2.5, 3.5) * 0.3 : 1};
  slots[TARGET].frame = landed ? 'slot_hover' : 'slot';
  const xp = lerp(0.42, 0.62, landed ? EASE.out(clamp01(landedT / 14)) : done ? EASE.out(clamp01((f - T_DONE - 24) / 20)) : 0);

  const furnaces: [number, number, string][] = [
    [44, 196, 'furnace_front_on'],
    [44, 400, 'furnace_front_on'],
    [44, 604, 'furnace_front_on'],
    [W - 44 - FRONT, 196, 'furnace_front_on'],
    [W - 44 - FRONT, 400, 'furnace_front_on'],
    [W - 44 - FRONT, 604, 'furnace_front_on'],
  ];

  return (
    <AbsoluteFill style={{background: bg ? '#100c0a' : 'transparent'}}>
      {bg && (
        <>
          <TileBg tex="stone_bricks" tile={128} dark={0.58} tint="rgba(255,120,40,0.12)" />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(0deg, rgba(255,100,24,${0.5 * heat * flick}) 0%, rgba(255,100,24,0) 55%)`}} />
          <Glow x={960} y={1120} r={1100} color="#ff6a1c" op={0.35 * heat * flick} squash={0.6} />
          <Rays x={960} y={520} size={1800} color="255,150,60" op={0.12 * heat} n={10} speed={0.2} />
        </>
      )}

      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '50% 50%'}}>
        {bg && (
          <>
            {furnaces.map(([x, y, n], i) => (
              <SideFurnace key={i} x={x} y={y} name={n} lit={heat} i={i} />
            ))}
            {/* mantel shelves between furnace columns and the panel */}
            {[0, 1].map((k) => (
              <div key={k} style={{position: 'absolute', left: k ? W - 270 : 0, top: 168, width: 270, height: 18, background: '#3b3430', borderTop: '4px solid #5d544e', boxShadow: '0 8px 0 #0e0b0a', opacity: open}} />
            ))}
            <Pile x={150} y={930} items={[['coal', -60, 6, -10], ['coal', 10, -4, 14], ['charcoal', 70, 8, -6], ['raw_iron', -20, 44, 8], ['raw_gold', 54, 46, -12], ['raw_copper', -90, 48, 6]]} size={88} at={4} />
            <Pile x={W - 150} y={930} items={[['iron_ingot', -64, 6, -10], ['gold_ingot', 6, -6, 10], ['copper_ingot', 70, 8, -6], ['iron_ingot', -20, 44, 6], ['gold_ingot', 50, 48, -12]]} size={88} at={4} />
          </>
        )}

        {/* panel */}
        <div style={{opacity: open, transform: `scale(${0.92 + 0.08 * EASE.back(clamp01(f / 14))})`, transformOrigin: '50% 45%'}}>
          <Panel x={420} y={176} w={1080} h={700} variant="panel_raised">
            <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
              <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
            </div>
          </Panel>
          <div style={{position: 'absolute', left: IN[0], top: IN[1]}}>
            <Cell size={S} frame={f >= T_ORE + LAND && f < T_DONE ? 'slot_target' : 'slot'} />
          </div>
          <div style={{position: 'absolute', left: FUEL[0], top: FUEL[1]}}>
            <Cell size={S} frame={f >= T_COAL + LAND && f < T_DONE ? 'slot_target' : 'slot'} />
          </div>
          <div style={{position: 'absolute', left: OUT[0], top: OUT[1]}}>
            <Cell size={OS} frame={done && f < T_CLICK ? 'slot_hover' : 'slot'} item={0.66} />
          </div>
        </div>

        {/* flame between slots */}
        <div style={{position: 'absolute', left: IN[0] + S / 2 - 40, top: IN[1] + S + 32, width: 80, height: 80, opacity: open}}>
          <div style={{position: 'absolute', inset: 0, opacity: 0.22, filter: 'brightness(0.2)'}}>
            <Flame size={80} />
          </div>
          {f >= T_FLAME && (
            <div style={{position: 'absolute', inset: 0, transform: `scale(${EASE.back(clamp01((f - T_FLAME) / 8))})`}}>
              <Glow x={40} y={50} r={90} color="#ff8a1c" op={0.6 * flick} />
              <Flame size={80} lit={f < T_DONE ? 1 - fill * 0.85 : 0.1} flicker={flick} />
            </div>
          )}
        </div>
        {/* arrow + labels */}
        <div style={{position: 'absolute', left: ARROW[0], top: ARROW[1], opacity: open}}>
          <Arrow value={fill} u={2 * U + 4} />
        </div>
        <div style={{position: 'absolute', left: ARROW[0], top: ARROW[1] - 64, opacity: prog(f, 20, 10)}}>
          <LabelSmall color={burning ? '#f8af2b' : '#b1b2b5'}>{burning ? labelWorking : done ? labelDone : labelIdle}</LabelSmall>
        </div>
        <div style={{position: 'absolute', left: ARROW[0] - 4, top: ARROW[1] + 112, opacity: prog(f, 24, 10)}}>
          <OreProgress value={f < T_DONE ? fill : 1} width={200} color="gold" />
        </div>
        <div style={{position: 'absolute', left: 962, top: 262, opacity: prog(f, 12, 12)}}>
          <OreChip dot={done ? '#b8f040' : '#8c8d90'} color="#fff">
            {done ? xpDoneChip : xpChip}
          </OreChip>
        </div>
        <div style={{position: 'absolute', left: 962, top: 580, opacity: prog(f, 12, 12), display: 'flex', gap: 3 * U}}>
          <OreChip dot="#f8af2b" color="#d4d6da">
            {timeChip}
          </OreChip>
        </div>

        {/* smelting list */}
        <div style={{position: 'absolute', left: 1214, top: 262, width: 252, opacity: prog(f, 14, 14)}}>
          <OreSection label={listTitle} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14}}>
            {recipes.map(([a, b], i) => {
              const act = i === 0;
              return (
                <div key={a} style={{...nine(act ? 'slot_target' : 'slot', [2, 2, 2, 2]), height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: act ? 1 : 0.7}}>
                  <Item id={a} size={44} />
                  <OreText size={TYPE.small} color={act && done ? '#b8f040' : '#b1b2b5'}>
                    {act && done ? '✓' : '→'}
                  </OreText>
                  <Item id={b} size={44} />
                </div>
              );
            })}
          </div>
        </div>

        {/* in-slot ore + coal (with counts) */}
        {(() => {
          const aFl = flightState(f, T_ORE, LAND, [150, 930], [IN[0] + S / 2, IN[1] + S / 2], -260);
          const bFl = flightState(f, T_COAL, LAND, [150, 930], [FUEL[0] + S / 2, FUEL[1] + S / 2], -200);
          const oreCount = f < T_DONE ? inputCount : inputCount - 1;
          const coalCount = f < T_FLAME ? fuelCount : fuelCount - 1;
          const shrink = done ? 1 : 1 - prog(f, T_DONE - 14, 14, (t) => t) * 0.0;
          return (
            <>
              {aFl.started && (
                <ItemAt id={input} x={aFl.x} y={aFl.y} size={ISZ} scale={aFl.t < 1 ? lerp(1.5, 1, EASE.out(aFl.t)) : 1} sx={1 + aFl.squash} rot={aFl.t < 1 ? (1 - aFl.t) * -40 : 0} op={clamp01(aFl.t * 5)} shadow={aFl.t < 1 ? 14 : 0} z={4} />
              )}
              {aFl.started && aFl.t >= 1 && (
                <div style={{position: 'absolute', left: IN[0] + S - 36, top: IN[1] + S - 52, zIndex: 5}}>
                  <OreText size={TYPE.body} shadow>
                    {String(oreCount)}
                  </OreText>
                </div>
              )}
              {bFl.started && <ItemAt id={fuel} x={bFl.x} y={bFl.y} size={ISZ} scale={bFl.t < 1 ? lerp(1.5, 1, EASE.out(bFl.t)) : 1} sx={1 + bFl.squash} rot={bFl.t < 1 ? (1 - bFl.t) * 50 : 0} op={clamp01(bFl.t * 5)} shadow={bFl.t < 1 ? 14 : 0} z={4} />}
              {bFl.started && bFl.t >= 1 && (
                <div style={{position: 'absolute', left: FUEL[0] + S - 36, top: FUEL[1] + S - 52, zIndex: 5}}>
                  <OreText size={TYPE.body} shadow>
                    {String(coalCount)}
                  </OreText>
                </div>
              )}
            </>
          );
        })()}
        <PixelBurst x={IN[0] + S / 2} y={IN[1] + S / 2} at={T_ORE + LAND} count={16} colors={['#ffffff', '#d9a07a', '#c97a4a']} speed={10} life={16} size={10} seed={5} gravity={0.3} />
        <PixelBurst x={FUEL[0] + S / 2} y={FUEL[1] + S / 2} at={T_COAL + LAND} count={16} colors={['#555555', '#888888', '#ffd23f']} speed={10} life={16} size={10} seed={6} gravity={0.3} />
        <Shockwave x={IN[0] + S / 2 + 20} y={IN[1] + S + 72} at={T_FLAME} color="#ff9a3c" maxR={160} life={14} width={10} />

        {/* output ingot */}
        {done && !carrying && !landed && (
          <ItemAt id={output} x={outC[0]} y={outC[1]} size={snap(OS * 0.66)} scale={lerp(2.6, 1.15, pop)} op={clamp01((f - T_DONE + 1) * 0.6)} shadow={8} z={6} />
        )}
        {done && !carrying && !landed && <Twinkles x={outC[0]} y={outC[1]} radius={150} count={8} size={40} seed={4} />}
        {carrying && <ItemAt id={output} x={cx + 28} y={cy + 28} size={ISZ} scale={1.1} shadow={14} z={30} />}
        {done && f < T_DONE + 40 && <Rays x={outC[0]} y={outC[1]} size={1000} color="255,190,90" op={0.35 * (1 - clamp01((f - T_DONE) / 40))} />}
        <PixelBurst x={outC[0]} y={outC[1]} at={T_DONE} count={60} colors={['#ffffff', '#ffd23f', '#ff9a3c', '#ff5a1c']} speed={26} life={34} size={12} seed={12} />
        <Shockwave x={outC[0]} y={outC[1]} at={T_DONE} color="#ffb040" maxR={340} life={20} width={14} />
        <Orbs from={outC} to={[960, 888]} at={T_DONE + 2} />

        {/* hotbar + xp + hud */}
        <div style={{opacity: prog(f, 6, 14)}}>
          <Hud p="experience_bar_background" w={182} h={5} scale={5} x={960 - 455} y={886} />
          <Hud p="experience_bar_progress" w={182} h={5} scale={5} x={960 - 455} y={886} style={{clipPath: `inset(0 ${(1 - xp) * 100}% 0 0)`}} />
          <SlotRow x={HB_X} y={HB_Y} size={HB_SIZE} gap={U} slots={slots} item={0.7} />
        </div>
        <FloatText x={hbCenter(TARGET)[0]} y={HB_Y - 10} at={T_DROP} life={26} rise={70} color="#b8f040" size={48}>
          {pickupText}
        </FloatText>
        <Shockwave x={hbCenter(TARGET)[0]} y={hbCenter(TARGET)[1]} at={T_DROP} color="#ffffff" maxR={120} life={12} width={8} />

        <Ripple at={T_CLICK} x={cx} y={cy} />
        {f >= T_DONE + 4 && <PixelCursor x={cx} y={cy} />}
      </div>

      {/* foreground embers + heat */}
      {bg && (
        <>
          <Puffs x={132} y={210} w={80} count={6} seed={4} size={120} rise={200} life={90} op={0.45} filter="brightness(0.55)" amount={heat} />
          <Puffs x={W - 132} y={210} w={80} count={6} seed={9} size={120} rise={200} life={90} op={0.45} filter="brightness(0.55)" amount={heat} />
          <Embers x={0} y={0} w={W} h={H} count={46} colors={['#ffd23f', '#ff9a3c', '#ff6a2c', '#ffffff']} seed={91} size={12} life={110} sway={70} amount={heat} opacity={0.9} />
          <Embers x={60} y={300} w={300} h={700} count={14} colors={['#ffd23f', '#ff6a2c']} seed={14} size={8} life={70} sway={20} amount={heat} />
          <Embers x={W - 360} y={300} w={300} h={700} count={14} colors={['#ffd23f', '#ff6a2c']} seed={15} size={8} life={70} sway={20} amount={heat} />
          <Vig s={0.75} color="14,5,2" inner={40} />
        </>
      )}
      <Flash at={T_DONE} life={7} peak={0.4} color="#ffe2a8" />
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && (
        <>
      <Sfx at={T_ORE + LAND - 2} src={mcSound('dig/stone2')} volume={0.4} rate={1.1} />
      <Sfx at={T_COAL + LAND - 2} src={mcSound('dig/gravel1')} volume={0.4} rate={1.2} />
      <Sfx at={T_FLAME} src={mcSound('fire/ignite')} volume={0.5} />
      <Sfx at={T_FLAME + 2} src={mcSound('block/furnace/fire_crackle1')} volume={0.45} />
      <Sfx at={T_FLAME + 40} src={mcSound('block/furnace/fire_crackle1')} volume={0.4} rate={1.1} />
      <Sfx at={T_DONE} src={mcSound('random/pop')} volume={0.5} rate={1.1} />
      <Sfx at={T_DONE + 1} src={mcSound('random/anvil_land')} volume={0.25} rate={1.6} />
      <Sfx at={T_DONE + 14} src={mcSound('random/orb')} volume={0.4} />
      <Sfx at={T_DONE + 24} src={mcSound('random/orb')} volume={0.35} rate={1.2} />
      <Sfx at={T_CLICK} src={mcSound('random/click')} volume={0.4} />
      <Sfx at={T_DROP} src={mcSound('random/pop')} volume={0.45} rate={1.3} />
        </>
      )}
    </AbsoluteFill>
  );
};
export const FURNACE_FRAMES = 160;
