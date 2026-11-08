import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {item as itemUrl} from '../../../mc/assets';
import {OreButton, OreChip, OreSection, OreText, PixelCursor, TYPE, nine, ORE} from '../../../mg/Ore';
import {LabelSmall, Sfx, Tab, mcSound} from '../../../reel/kit';
import {Cell, EASE, Embers, FloatText, Glow, Head, Item, ItemAt, OutlineT, Panel, Ripple, SlotRow, Stars, U, Vig, W, H, arcPos, clamp01, cursorAt, jiggle, lerp, mulberry32, prog, snap} from './kit';
import {staticFile} from 'remotion';

/**
 * item-inventory-sort: a messy 9x4 inventory. The cursor presses "整理": every stack lifts, flies along an arc to its sorted slot,
 * duplicate stacks merge and their counts add up, rows light up as each category (tools / blocks / food / materials) completes.
 * Props: see SortProps (rows of stacks, category names, texts, timings, bg, audio). `bg` (default true) draws the dark backdrop and side storage.
 */

export type SortCat = 'tool' | 'block' | 'food' | 'mat';
type Cat = SortCat;
export type SortCatDef = {
  /** 分类名称(左侧图例与行标签) */
  name: string;
  /** 分类强调色,#rrggbb */
  color: string;
  /** 图例图标物品 id */
  icon: string;
};
export type SortEntry = {
  /** 物品 id */
  id: string;
  /** 物品名称(合并日志里不显示,保留作数据) */
  name: string;
  /** 所属分类 */
  cat: SortCat;
  /** 整理后所在列 */
  c: number;
  /** 堆叠数量(省略为 1) */
  count?: number;
  /** 需要合并的两堆数量 [堆 A, 堆 B],设置后 count 无效,整理后合为一堆 */
  merge?: [number, number];
};

export type SortProps = {
  /** 是否绘制深色渐变底、方格纹、两侧储物堆、飘尘与暗角;false 时只剩面板/物品/特效/快捷栏 */
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
  /** 四行整理结果,每行一个分类(行内第一项决定该行分类) */
  rows?: SortEntry[][];
  /** 四个分类的名称、颜色、图标 */
  cats?: Record<SortCat, SortCatDef>;
  /** 背包面板标题 */
  panelTitle?: string;
  /** 左侧分类面板标题 */
  legendTitle?: string;
  /** 右侧合并面板标题 */
  mergeTitle?: string;
  /** 面板上的 5 个标签页文字 */
  tabs?: string[];
  /** 整理按钮文字(点击前) */
  buttonText?: string;
  /** 整理按钮文字(完成后) */
  buttonDoneText?: string;
  /** 底部「堆叠」标签模板,{n} 为数量 */
  stackChip?: string;
  /** 底部「空位」标签模板,{n} 为数量 */
  emptyChip?: string;
  /** 底部状态标签:整理前 */
  messyText?: string;
  /** 底部状态标签:整理后 */
  tidyText?: string;
  /** 全部完成后的飘字 */
  doneText?: string;
  /** 底部快捷栏 9 格内容 */
  hotbar?: {id?: string; count?: number}[];
  /** 初始乱序的随机种子 */
  seed?: number;
  /** 鼠标点击「整理」的本地帧 */
  clickAt?: number;
  /** 堆叠升起的本地帧 */
  liftAt?: number;
  /** 堆叠开始飞行的本地帧 */
  flyAt?: number;
};
const DEFAULT_CATS: Record<Cat, SortCatDef> = {
  tool: {name: '工具', color: '#55ffff', icon: 'diamond_pickaxe'},
  block: {name: '方块', color: '#c4c6cc', icon: 'cobblestone'},
  food: {name: '食物', color: '#ff9a3c', icon: 'bread'},
  mat: {name: '材料', color: '#ffd23f', icon: 'iron_ingot'},
};
type Entry = SortEntry;
const DEFAULT_ROWS: Entry[][] = [
  [
    {id: 'diamond_sword', name: '钻石剑', cat: 'tool', c: 0},
    {id: 'iron_pickaxe', name: '铁镐', cat: 'tool', c: 1},
    {id: 'iron_axe', name: '铁斧', cat: 'tool', c: 2},
    {id: 'bow', name: '弓', cat: 'tool', c: 3},
    {id: 'shears', name: '剪刀', cat: 'tool', c: 4},
    {id: 'fishing_rod', name: '钓鱼竿', cat: 'tool', c: 5},
  ],
  [
    {id: 'cobblestone', name: '圆石', cat: 'block', c: 0, merge: [34, 30]},
    {id: 'oak_planks', name: '橡木板', cat: 'block', c: 1, merge: [20, 44]},
    {id: 'glass', name: '玻璃', cat: 'block', c: 2, count: 12},
    {id: 'dirt', name: '泥土', cat: 'block', c: 3, count: 48},
    {id: 'torch', name: '火把', cat: 'block', c: 4, count: 26},
    {id: 'tnt', name: 'TNT', cat: 'block', c: 5, count: 8},
  ],
  [
    {id: 'bread', name: '面包', cat: 'food', c: 0, merge: [3, 6]},
    {id: 'cooked_beef', name: '熟牛肉', cat: 'food', c: 1, count: 12},
    {id: 'apple', name: '苹果', cat: 'food', c: 2, count: 5},
    {id: 'golden_apple', name: '金苹果', cat: 'food', c: 3, count: 2},
    {id: 'carrot', name: '胡萝卜', cat: 'food', c: 4, count: 14},
  ],
  [
    {id: 'iron_ingot', name: '铁锭', cat: 'mat', c: 0, merge: [9, 14]},
    {id: 'gold_ingot', name: '金锭', cat: 'mat', c: 1, count: 11},
    {id: 'diamond', name: '钻石', cat: 'mat', c: 2, merge: [1, 2]},
    {id: 'coal', name: '煤炭', cat: 'mat', c: 3, merge: [12, 9]},
    {id: 'redstone', name: '红石', cat: 'mat', c: 4, merge: [15, 27]},
    {id: 'emerald', name: '绿宝石', cat: 'mat', c: 5, count: 4},
    {id: 'lapis_lazuli', name: '青金石', cat: 'mat', c: 6, count: 17},
    {id: 'string', name: '线', cat: 'mat', c: 7, count: 6},
  ],
];

const S = 100;
const GAP = 8;
const COLS = 9;
const GX0 = 541;
const GY0 = 296;
const TAGX = 415;
const slotXY = (r: number, c: number): [number, number] => [GX0 + c * (S + GAP) + S / 2, GY0 + r * (S + GAP) + S / 2];

type Stack = {id: string; name: string; count: number; start: number; r: number; c: number; second: boolean; rank: number; key: string; cat: Cat; total: number};
const buildStacks = (ROWS: Entry[][], seed: number): Stack[] => {
  const list: Stack[] = [];
  let rank = 0;
  ROWS.forEach((row, r) =>
    row.forEach((e) => {
      const key = e.id;
      const total = e.merge ? e.merge[0] + e.merge[1] : e.count ?? 1;
      list.push({id: e.id, name: e.name, count: e.merge ? e.merge[0] : e.count ?? 1, start: 0, r, c: e.c, second: false, rank, key, cat: e.cat, total});
      if (e.merge) list.push({id: e.id, name: e.name, count: e.merge[1], start: 0, r, c: e.c, second: true, rank, key, cat: e.cat, total});
      rank++;
    }),
  );
  // scatter into the 36 slots, deterministic
  const rnd = mulberry32(seed);
  const slots = Array.from({length: 36}, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  list.forEach((s, i) => (s.start = slots[i]));
  return list;
};
const startXY = (s: Stack): [number, number] => slotXY(Math.floor(s.start / COLS), s.start % COLS);

const FLYDUR = 22;
const makeTimeline = (ROWS: Entry[][], seed: number, T_FLY: number) => {
  const STACKS = buildStacks(ROWS, seed);
  const flyStart = (s: Stack) => T_FLY + s.rank * 1.25 + (s.second ? 14 : 0);
  const arriveAt = (s: Stack) => flyStart(s) + FLYDUR;
  const rowDone = (r: number) => Math.max(...STACKS.filter((s) => s.r === r).map(arriveAt));
  const ALL_DONE = Math.max(...STACKS.map(arriveAt));
  return {STACKS, flyStart, arriveAt, rowDone, ALL_DONE};
};

const DEFAULT_HOTBAR = [{id: 'diamond_sword'}, {id: 'iron_pickaxe'}, {id: 'torch', count: 32}, {id: 'bread', count: 9}, {}, {id: 'water_bucket'}, {id: 'ender_pearl', count: 4}, {}, {id: 'totem_of_undying'}];

export const InventorySort: FC<SortProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '物品栏整理',
  subtitle = '归位 · 分类 · 合并堆叠',
  tag = 'SORT',
  headIcon = 'hopper',
  accent = '#b8f040',
  rows: ROWS = DEFAULT_ROWS,
  cats: CATS = DEFAULT_CATS,
  panelTitle = '背包 · 整理物品',
  legendTitle = '分类',
  mergeTitle = '合并',
  tabs = ['全部', '工具', '方块', '食物', '材料'],
  buttonText = '整理',
  buttonDoneText = '已整理',
  stackChip = '堆叠 {n}',
  emptyChip = '空位 {n}',
  messyText = '杂乱无章',
  tidyText = '井然有序',
  doneText = '整理完成',
  hotbar = DEFAULT_HOTBAR,
  seed = 2026,
  clickAt: T_CLICK = 54,
  liftAt: T_LIFT = 56,
  flyAt: T_FLY = 66,
}) => {
  const {STACKS, flyStart, arriveAt, rowDone, ALL_DONE} = makeTimeline(ROWS, seed, T_FLY);
  const nBefore = STACKS.length;
  const nAfter = STACKS.filter((s) => !s.second).length;
  const f = useCurrentFrame();
  const intro = prog(f, 0, 14);
  const [cx, cy] = cursorAt(f, [
    [T_CLICK - 30, 1700, 860],
    [T_CLICK - 6, 1392, 232],
    [T_CLICK + 8, 1392, 232],
    [T_CLICK + 26, 1700, 520],
  ]);
  const pressed = f >= T_CLICK && f < T_CLICK + 6;
  const lift = (s: Stack) => prog(f, T_LIFT + (s.start % 9) * 0.6, 8);
  const doneAll = f >= ALL_DONE;
  const sweepT = clamp01((f - ALL_DONE - 4) / 26);

  const countOf = (s: Stack) => {
    // a first stack's displayed count grows when its twin arrives
    if (s.second) return s.count;
    const twin = STACKS.find((q) => q.second && q.key === s.key);
    return twin && f >= arriveAt(twin) ? s.total : s.count;
  };

  const rowsOrder = ROWS.map((_, i) => i);
  const stacksDone = (cat: Cat) => ROWS.flat().filter((e) => e.cat === cat).length;
  const placed = (cat: Cat) => STACKS.filter((s) => !s.second && s.cat === cat && f >= arriveAt(s)).length;

  return (
    <AbsoluteFill style={{background: bg ? '#101012' : 'transparent'}}>
      {bg && (
        <>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2a2b2e 0%, #131315 75%)'}} />
          <AbsoluteFill style={{backgroundImage: `url(${staticFile('oriel/ore/checker.png')})`, backgroundSize: `${8 * U}px ${8 * U}px`, imageRendering: 'pixelated', opacity: 0.07, backgroundPosition: `${f * 0.3}px ${f * 0.3}px`}} />
        </>
      )}
      {/* category colour bands appear behind rows as they complete */}
      {rowsOrder.map((r) => {
        const cat = ROWS[r][0].cat;
        const p = prog(f, rowDone(r) - 4, 16);
        return <Glow key={r} x={960} y={GY0 + r * (S + GAP) + S / 2} r={700} color={CATS[cat].color} op={0.25 * p} squash={0.2} />;
      })}

      {/* side decor: storage stacks */}
      {bg && [
        ['barrel', 120, 960, 190],
        ['barrel', 300, 980, 160],
        ['crafting_table', 210, 880, 150],
        ['hopper', 1760, 970, 130],
        ['bookshelf', 1620, 960, 170],
        ['barrel', 1800, 880, 170],
      ].map(([id, x, y, s], i) => (
        <ItemAt key={i} id={id as string} x={x as number} y={y as number} size={s as number} scale={prog(f, 4 + i * 3, 14, EASE.back)} shadow={12} />
      ))}

      {/* left: category legend */}
      <div style={{opacity: intro, transform: `translateX(${(1 - intro) * -60}px)`}}>
        <Panel x={40} y={180} w={300} h={560} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={legendTitle} grow={prog(f, 4, 22)} />
          </div>
          <div style={{position: 'absolute', left: 20, top: 84, right: 20, display: 'flex', flexDirection: 'column', gap: 14}}>
            {ROWS.map((r) => r[0].cat).map((cat, i) => {
              const n = f < T_FLY ? 0 : placed(cat);
              const tot = stacksDone(cat);
              const act = f >= T_FLY && f < rowDone(i);
              const complete = f >= rowDone(i);
              return (
                <div key={cat} style={{...nine(act || complete ? 'slot_target' : 'slot', [2, 2, 2, 2]), height: 104, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', borderColor: 'transparent'}}>
                  <Item id={CATS[cat].icon} size={60} />
                  <div style={{flex: 1}}>
                    <OreText size={TYPE.body} color={complete ? CATS[cat].color : '#d4d6da'} shadow>
                      {CATS[cat].name}
                    </OreText>
                    <div style={{marginTop: 8, height: 12, background: '#0f0f10', width: '100%'}}>
                      <div style={{height: '100%', width: `${(n / tot) * 100}%`, background: CATS[cat].color}} />
                    </div>
                  </div>
                  <OreText size={TYPE.small} color={complete ? '#b8f040' : '#8c8d90'}>
                    {complete ? '✓' : `${n}/${tot}`}
                  </OreText>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* right: merge log */}
      <div style={{opacity: intro, transform: `translateX(${(1 - intro) * 60}px)`}}>
        <Panel x={1580} y={180} w={300} h={560} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={mergeTitle} grow={prog(f, 4, 22)} />
          </div>
          <div style={{position: 'absolute', left: 18, top: 80, right: 18, display: 'flex', flexDirection: 'column', gap: 10}}>
            {STACKS.filter((s) => s.second)
              .sort((a, b) => arriveAt(a) - arriveAt(b))
              .map((s) => {
                const p = prog(f, arriveAt(s), 10, EASE.back);
                const first = STACKS.find((q) => !q.second && q.key === s.key)!;
                return (
                  <div key={s.key} style={{...nine('slot', [2, 2, 2, 2]), height: 64, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', transform: `scale(${p})`, opacity: clamp01(p * 3), transformOrigin: '0% 50%'}}>
                    <Item id={s.id} size={40} />
                    <OreText size={TYPE.small} color="#d4d6da">{`${first.count}+${s.count}`}</OreText>
                    <OreText size={TYPE.small} color="#b8f040">{`=${s.total}`}</OreText>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>

      {/* main inventory panel */}
      <div style={{opacity: intro, transform: `scale(${0.94 + 0.06 * EASE.back(clamp01(f / 14))})`, transformOrigin: '50% 50%'}}>
        <Panel x={380} y={130} w={1160} h={740} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
          </div>
        </Panel>
        <div style={{position: 'absolute', left: 415, top: 196, display: 'flex', gap: 4}}>
          {tabs.map((t, i) => (
            <Tab key={t} selected={i === 0}>
              {t}
            </Tab>
          ))}
        </div>
        <div style={{position: 'absolute', left: 1346, top: 190}}>
          <OreButton variant="primary" state={pressed ? 'pressed' : f >= T_CLICK - 10 && f < T_CLICK ? 'hover' : 'normal'} width={170}>
            {doneAll ? buttonDoneText : buttonText}
          </OreButton>
        </div>
        {/* slot grid */}
        {Array.from({length: 36}, (_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const [x, y] = slotXY(r, c);
          const target = STACKS.some((q) => q.r === r && q.c === c && f >= flyStart(q) && f < arriveAt(q) + 6);
          return (
            <div key={i} style={{position: 'absolute', left: x - S / 2, top: y - S / 2}}>
              <Cell size={S} frame={target ? 'slot_target' : 'slot'} />
            </div>
          );
        })}
        {/* row tags */}
        {rowsOrder.map((r) => {
          const cat = ROWS[r][0].cat;
          const on = f >= rowDone(r);
          const p = prog(f, rowDone(r), 12, EASE.back);
          const y = GY0 + r * (S + GAP);
          return (
            <div key={r} style={{position: 'absolute', left: TAGX, top: y, width: 110, height: S, display: 'flex', alignItems: 'center', justifyContent: 'center', ...nine('slot', [2, 2, 2, 2]), boxShadow: on ? `0 0 ${26 * (1 - clamp01((f - rowDone(r)) / 30) * 0.5)}px ${CATS[cat].color}` : undefined}}>
              <OreText size={TYPE.body} color={on ? CATS[cat].color : '#55565a'} shadow style={{transform: `scale(${on ? 1 + 0.25 * jiggle(clamp01((f - rowDone(r)) / 16), 2.2, 3) : 1})`}}>
                {CATS[cat].name}
              </OreText>
              {on && <div style={{position: 'absolute', left: 0, right: 0, bottom: -4, height: 6, background: CATS[cat].color, opacity: p}} />}
            </div>
          );
        })}

        {/* summary chips */}
        <div style={{position: 'absolute', left: 415, top: 776, display: 'flex', gap: 3 * U, opacity: prog(f, 12, 12)}}>
          <OreChip dot={doneAll ? '#b8f040' : '#ff5555'} color="#fff">
            {stackChip.replace('{n}', String(doneAll ? nAfter : nBefore))}
          </OreChip>
          <OreChip dot={doneAll ? '#b8f040' : '#ff5555'} color="#fff">
            {emptyChip.replace('{n}', String(36 - (doneAll ? nAfter : nBefore)))}
          </OreChip>
          <OreChip dot={doneAll ? '#b8f040' : '#f8af2b'} color={doneAll ? '#b8f040' : '#d4d6da'}>
            {doneAll ? tidyText : messyText}
          </OreChip>
        </div>

        {/* stacks */}
        {[...STACKS]
          .sort((a, b) => Number(a.second) - Number(b.second))
          .map((s, i) => {
            const [sx, sy] = startXY(s);
            const [tx, ty] = slotXY(s.r, s.c);
            const t0 = flyStart(s);
            const t = clamp01((f - t0) / FLYDUR);
            const arrived = f >= t0 + FLYDUR;
            if (arrived && s.second) return null;
            const e = EASE.inOut(t);
            const dist = Math.hypot(tx - sx, ty - sy);
            const [px0, py0] = arcPos(e, [sx, sy], [tx, ty], -Math.min(220, 60 + dist * 0.18) * (((s.start + i) % 2) ? 1 : 0.7));
            const l = lift(s);
            const dtA = f - (t0 + FLYDUR);
            const settle = arrived && dtA < 14 ? jiggle(dtA / 14, 2.4, 3.2) * 0.28 : 0;
            const sc = 1 + l * 0.18 * (1 - t) + settle + (t > 0 && t < 1 ? Math.sin(t * Math.PI) * 0.16 : 0);
            const ly = -l * 12 * (1 - t);
            const x = t > 0 ? px0 : sx;
            const y = (t > 0 ? py0 : sy) + ly * (arrived ? 0 : 1);
            const cnt = countOf(s);
            const trailN = t > 0 && t < 1 ? 3 : 0;
            return (
              <div key={`${s.key}${s.second}`}>
                {Array.from({length: trailN}, (_, k) => {
                  const tk = clamp01((f - t0 - (k + 1) * 1.6) / FLYDUR);
                  if (tk <= 0) return null;
                  const ek = EASE.inOut(tk);
                  const [qx, qy] = arcPos(ek, [sx, sy], [tx, ty], -Math.min(220, 60 + dist * 0.18) * (((s.start + i) % 2) ? 1 : 0.7));
                  return <ItemAt key={k} id={s.id} x={qx} y={qy} size={72} scale={0.9} op={0.28 / (k + 1)} z={20} />;
                })}
                <ItemAt id={s.id} x={x} y={y} size={72} scale={sc} shadow={l > 0.5 && !arrived ? 12 : 0} z={t > 0 && !arrived ? 40 : 10} />
                {cnt > 1 && (
                  <div style={{position: 'absolute', left: x + 8, top: y + 6, zIndex: t > 0 && !arrived ? 41 : 11, transform: `scale(${arrived && !s.second && dtA < 12 ? 1 + jiggle(dtA / 12, 2.5, 3) * 0.3 : 1})`, transformOrigin: '100% 100%'}}>
                    <OreText size={TYPE.body} color={!s.second && cnt === s.total && s.total !== s.count ? '#b8f040' : '#ffffff'} shadow>
                      {String(cnt)}
                    </OreText>
                  </div>
                )}
              </div>
            );
          })}
        {/* arrival effects */}
        {STACKS.map((s, i) => {
          const [tx, ty] = slotXY(s.r, s.c);
          const at = arriveAt(s);
          const col = CATS[s.cat].color;
          return (
            <div key={`fx${i}`}>
              <PixelBurst x={tx} y={ty} at={at} count={s.second ? 16 : 7} colors={['#ffffff', col]} speed={s.second ? 12 : 7} life={s.second ? 18 : 12} size={s.second ? 10 : 8} seed={i + 5} gravity={0.25} />
              {s.second && <Shockwave x={tx} y={ty} at={at} color="#b8f040" maxR={90} life={12} width={8} />}
              {s.second && (
                <FloatText x={tx} y={ty - 50} at={at} life={28} rise={50} color="#b8f040" size={36}>
                  {`+${s.count}`}
                </FloatText>
              )}
            </div>
          );
        })}
        {rowsOrder.map((r) => (
          <Shockwave key={r} x={960} y={GY0 + r * (S + GAP) + S / 2} at={rowDone(r)} color={CATS[ROWS[r][0].cat].color} maxR={520} life={18} width={8} />
        ))}
        {/* final sweep across the grid */}
        {doneAll && sweepT < 1 && (
          <div style={{position: 'absolute', left: GX0 - 20 + sweepT * (9 * (S + GAP) + 40) - 70, top: GY0 - 10, width: 140, height: 4 * (S + GAP) + 10, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))', transform: 'skewX(-14deg)', mixBlendMode: 'screen', zIndex: 60}} />
        )}
      </div>

      {/* hotbar for context */}
      <div style={{opacity: intro}}>
        <SlotRow x={960 - (9 * 84 + 8 * 4) / 2} y={920} size={84} gap={4} item={0.72} slots={hotbar} />
      </div>

      {f >= T_LIFT && f < T_FLY + 10 && <Glow x={960} y={500} r={620} color="#ffe27a" op={0.25} />}
      <FloatText x={960} y={110} at={ALL_DONE + 2} life={46} rise={30} color="#b8f040" size={72}>
        {doneText}
      </FloatText>
      {doneAll && <Twinkles x={960} y={510} radius={380} count={14} size={44} seed={6} />}
      {doneAll && <Stars x={GX0} y={GY0} w={9 * (S + GAP)} h={4 * (S + GAP)} count={10} size={36} colors={['#ffffff', '#ffe27a', '#b8f040']} seed={3} />}
      {bg && <Embers x={0} y={80} w={W} h={900} count={24} colors={['#ffffff', '#b1b2b5', '#ffe27a']} seed={13} size={8} life={160} sway={50} opacity={0.4} />}
      <Ripple at={T_CLICK} x={cx} y={cy} />
      {f >= T_CLICK - 30 && f < T_CLICK + 28 && <PixelCursor x={cx} y={cy} />}
      {bg && <Vig s={0.55} color="0,0,0" inner={50} />}
      <Flash at={T_CLICK} life={5} peak={0.1} color="#fff6c0" />
      <Flash at={ALL_DONE} life={8} peak={0.25} color="#e8ffd0" />
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && (
        <>
      <Sfx at={T_CLICK} src={mcSound('random/click')} volume={0.5} />
      <Sfx at={T_LIFT} src={mcSound('random/pop')} volume={0.3} rate={0.8} />
      {STACKS.filter((_, i) => i % 3 === 0).map((s, i) => (
        <Sfx key={i} at={arriveAt(s)} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.22} rate={1.1 + i * 0.03} />
      ))}
      {STACKS.filter((s) => s.second).map((s, i) => (
        <Sfx key={`m${i}`} at={arriveAt(s)} src={mcSound('random/orb')} volume={0.3} rate={0.9 + i * 0.1} />
      ))}
      {rowsOrder.map((r) => (
        <Sfx key={`r${r}`} at={rowDone(r)} src={mcSound('random/pop')} volume={0.4} rate={0.9 + r * 0.15} />
      ))}
      <Sfx at={ALL_DONE} src={mcSound('random/levelup')} volume={0.45} rate={1.15} />
        </>
      )}
    </AbsoluteFill>
  );
};
export const SORT_FRAMES = 190;
