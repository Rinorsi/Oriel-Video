import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {OreChip, OreSection, OreText, PixelCursor, TYPE, nine} from '../../../mg/Ore';
import {LabelSmall, OreTooltip, Sfx, mcSound} from '../../../reel/kit';
import {Cell, EASE, Embers, FloatText, Glow, Glyph, Head, Hud, Item, ItemAt, OutlineT, Panel, Rays, Ripple, Sheen, Stars, TAU, TileBg, U, Vig, W, H, clamp01, cursorAt, lerp, mulberry32, prog, snap} from './kit';

/**
 * item-enchanting: enchanting table. Glyphs drift in from the bookshelves, a sword and lapis go in, three options show
 * runes that flip into text on hover, the third is chosen: runes swirl into the sword, rings rise around it, purple flash.
 * Props: see EnchantProps. `bg` (default true) draws the bookshelf hall, rune belts and floating book; without it the UI and effects remain.
 */

const PX = 380;
const PY = 176;
const PW = 1160;
const PH = 690;
const S = 36 * U; // 144
const ITEM_XY: [number, number] = [452, 290];
const LAPIS_XY: [number, number] = [452, 470];
const SWORD_C: [number, number] = [ITEM_XY[0] + S / 2, ITEM_XY[1] + S / 2];
const ROW_X = 660;
const ROW_W = 840;
const ROW_H = 128;
const ROW_Y = [270, 414, 558];
const ROW_C = (i: number): [number, number] => [ROW_X + ROW_W / 2, ROW_Y[i] + ROW_H / 2];

export type EnchantOption = {
  /** 悬停后符文翻成的文字(每个字一格,最多 8 个字) */
  text: string;
  /** 青金石消耗数量 */
  cost: number;
  /** 需要的经验等级(显示在左侧徽标) */
  level: number;
  /** 符文图案的随机种子 */
  seed: number;
  /** 悬停时提示框第一行 */
  tip: string;
};
type Opt = EnchantOption;
const DEFAULT_OPTS: Opt[] = [
  {text: '耐久 3', cost: 1, level: 8, seed: 3, tip: '耐久 III…?'},
  {text: '锋利 4', cost: 2, level: 17, seed: 11, tip: '锋利 IV…?'},
  {text: '火焰附加 2', cost: 3, level: 30, seed: 23, tip: '火焰附加 II…?'},
];
const DEFAULT_HOVER: [number, number][] = [
  [62, 78],
  [86, 102],
  [110, 200],
];
const LAND = 12;

export type EnchantProps = {
  /** 是否绘制魔法厅背景(书架墙、紫光、符文带、漂浮符文、悬浮附魔书、飘尘、暗角);false 时只剩面板/物品/特效/经验条 */
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
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 被附魔的物品 id */
  item?: string;
  /** 消耗品物品 id(青金石) */
  lapis?: string;
  /** 物品格上方小标签 */
  itemLabel?: string;
  /** 消耗品格下方小标签 */
  lapisLabel?: string;
  /** 放入的消耗品数量 */
  lapisCount?: number;
  /** 三个附魔选项(文字、青金石数、等级、符文种子、提示) */
  options?: EnchantOption[];
  /** 最终被选中的选项序号(0-2) */
  selected?: number;
  /** 三个选项各自的悬停起止帧 [起, 止] */
  hover?: [number, number][];
  /** 悬停提示框第二行模板,{cost} {level} 会被替换 */
  costLine?: string;
  /** 附魔完成后的成品提示框行(rare 样式) */
  resultTooltip?: {text: string; color?: string}[];
  /** 左下角书架标签 */
  shelfChip?: string;
  /** 左下角附魔力标签(附魔前) */
  powerChip?: string;
  /** 左下角附魔力标签(附魔后) */
  doneChip?: string;
  /** 附魔成功飘字 */
  successText?: string;
  /** 扣除等级飘字 */
  levelText?: string;
  /** 附魔前玩家等级 */
  levelBefore?: number;
  /** 附魔后玩家等级 */
  levelAfter?: number;
  /** 物品飞入的本地帧 */
  itemAt?: number;
  /** 消耗品飞入的本地帧 */
  lapisAt?: number;
  /** 点选选项的本地帧 */
  selectAt?: number;
  /** 附魔完成(爆发)的本地帧 */
  bangAt?: number;
};

const DEFAULT_RESULT_TIP = [
  {text: '钻石剑', color: '#55ffff'},
  {text: '火焰附加 II', color: '#b57cff'},
  {text: '+ 7 攻击伤害', color: '#5555ff'},
];

/** Hover amount 0..1 for an option's [start, end] window (flips in/out over 12 frames). */
const hoverAmt = (f: number, hv: [number, number]) => {
  const [a, b] = hv;
  return clamp01((f - a) / 12) * (1 - clamp01((f - b) / 12));
};

const CELL = 64;

const Row: FC<{i: number; sel: boolean; selT: number; opt: Opt; hover: [number, number]; lapis: string}> = ({i, sel, selT, opt, hover, lapis}) => {
  const f = useCurrentFrame();
  const o = opt;
  const h = hoverAmt(f, hover);
  const [cx0, cy0] = [ROW_X, ROW_Y[i]];
  const p = prog(f, 40 + i * 4, 12, EASE.out);
  const chars = [...o.text];
  const affordable = true;
  const r = mulberry32(o.seed);
  const glyphs = Array.from({length: 8}, () => Math.floor(r() * 26));
  const frame = sel ? 'slot_target' : h > 0.2 ? 'slot_hover' : 'slot';
  return (
    <div style={{position: 'absolute', left: cx0, top: cy0, width: ROW_W, height: ROW_H, transform: `scale(${p})`, opacity: clamp01(p * 3), transformOrigin: '0% 50%'}}>
      <div style={{...nine(frame, [2, 2, 2, 2]), position: 'absolute', inset: 0}} />
      {/* level badge */}
      <div style={{position: 'absolute', left: 20, top: 24, width: 80, height: 80, ...nine('slot', [2, 2, 2, 2]), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <OutlineT size={48} color={affordable ? '#b8f040' : '#ff5555'}>
          {String(o.level)}
        </OutlineT>
      </div>
      {/* runes / text */}
      <div style={{position: 'absolute', left: 124, top: 0, width: 8 * CELL, height: ROW_H}}>
        {glyphs.map((g, c) => {
          const flip = clamp01((h - c * 0.06) / 0.45);
          const showText = flip > 0.5 && c < chars.length;
          const sx = c < chars.length ? Math.abs(1 - 2 * flip) : 1;
          const cx = c * CELL + CELL / 2;
          const wob = Math.sin(f * 0.1 + c) * 3;
          if (showText) {
            const ch = chars[c];
            return (
              <div key={c} style={{position: 'absolute', left: cx - CELL / 2, top: ROW_H / 2 - 24, width: CELL, textAlign: 'center', transform: `scaleX(${sx})`}}>
                <OutlineT size={48} color={sel ? '#e2b6ff' : '#ffff55'}>
                  {ch}
                </OutlineT>
              </div>
            );
          }
          return <Glyph key={c} ch={g} x={cx} y={ROW_H / 2 + wob} size={56} color={sel ? '#e2b6ff' : '#d9c8ff'} op={(0.55 + 0.35 * Math.sin(f * 0.15 + c * 0.8 + i)) * (c < chars.length ? 1 : 1 - h * 0.7)} />;
        }).map((el, c) => (
          <div key={c} style={{position: 'absolute', inset: 0, transform: c < chars.length ? undefined : undefined}}>
            {el}
          </div>
        ))}
      </div>
      {/* cost */}
      <div style={{position: 'absolute', right: 20, top: 20, display: 'flex', alignItems: 'center', gap: 8}}>
        <Item id={lapis} size={72} />
        <OreText size={TYPE.body} color="#fff" shadow>
          {`×${o.cost}`}
        </OreText>
      </div>
      {sel && <div style={{position: 'absolute', inset: 0, background: '#e2b6ff', opacity: clamp01(1 - selT / 10) * 0.7, mixBlendMode: 'screen'}} />}
    </div>
  );
};

/** Glyphs drifting from the bookshelves to the table. */
const Drift: FC<{amount: number}> = ({amount}) => {
  const f = useCurrentFrame();
  const r = mulberry32(77);
  return (
    <>
      {Array.from({length: 40}, (_, i) => {
        const side = r() < 0.5 ? -1 : 1;
        const sx = side < 0 ? 30 + r() * 300 : W - 330 + r() * 300;
        const sy = 160 + r() * 780;
        const period = 56 + r() * 50;
        const phase = r() * period;
        const g = Math.floor(r() * 26);
        const size = 40 + Math.floor(r() * 4) * 8;
        const col = r() < 0.4 ? '#9ff7ff' : '#d9c8ff';
        if (i >= 40 * amount) return null;
        const t = ((f + phase) % period) / period;
        const e = EASE.inOut(t);
        const x = lerp(sx, 960 + side * -80, e);
        const y = lerp(sy, 520, e) - Math.sin(t * Math.PI) * 190;
        return <Glyph key={i} ch={g} x={x} y={y} size={size} color={col} op={Math.sin(t * Math.PI) * 0.85} rot={t * 180 * side} />;
      })}
    </>
  );
};

/** Straight belt of runes sliding sideways (replaces the old rune circles). */
const RuneBelt: FC<{y: number; n: number; size: number; color: string; op: number; dir: number; seed?: number}> = ({y, n, size, color, op, dir, seed = 1}) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const span = W + 200;
        const x = (((i / n) * span + f * dir * 1.4) % span + span) % span - 100;
        const edge = Math.min(1, x / 200, (W - x) / 200);
        const flick = 0.6 + 0.4 * Math.sin(f * 0.2 + i * 1.3);
        return <Glyph key={i} ch={i * 5 + seed} x={x} y={y + (i % 2) * 6} size={size} color={color} op={op * flick * Math.max(0, edge)} />;
      })}
    </>
  );
};

/** Runes rising in a straight column: they stream up and fade in/out (replaces the rising rune rings). */
const RuneColumn: FC<{x: number; y0: number; y1: number; n: number; size: number; color: string; op: number; speed?: number; seed?: number}> = ({x, y0, y1, n, size, color, op, speed = 0.014, seed = 1}) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const s = (((i / n + f * speed) % 1) + 1) % 1;
        return <Glyph key={i} ch={i * 5 + seed} x={x + Math.sin(i * 2.1) * 8} y={lerp(y0, y1, s)} size={size} color={color} op={op * Math.sin(s * Math.PI)} />;
      })}
    </>
  );
};

export const Enchanting: FC<EnchantProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '附魔台',
  subtitle = '符文低语 · 为钻石剑附魔',
  tag = 'ENCHANT',
  headIcon = 'enchanting_table',
  accent = '#b57cff',
  panelTitle = '附魔台 · 钻石剑',
  item = 'diamond_sword',
  lapis = 'lapis_lazuli',
  itemLabel = '物品',
  lapisLabel = '青金石',
  lapisCount = 3,
  options: OPTS = DEFAULT_OPTS,
  selected: SELI = 2,
  hover: HOVER = DEFAULT_HOVER,
  costLine = '{cost} 青金石  ·  需要 {level} 级经验',
  resultTooltip = DEFAULT_RESULT_TIP,
  shelfChip = '书架 15/15',
  powerChip = '附魔力 30',
  doneChip = '已附魔',
  successText = '附魔成功',
  levelText = '-3 级',
  levelBefore = 34,
  levelAfter = 31,
  itemAt: T_SWORD = 14,
  lapisAt: T_LAPIS = 24,
  selectAt: T_SEL = 128,
  bangAt: T_BANG = 150,
}) => {
  const f = useCurrentFrame();
  const open = prog(f, 0, 14);
  const bang = f >= T_BANG;
  const energy = clamp01(0.35 + (f >= T_SEL ? 0.65 : 0) + prog(f, 60, 60, (t) => t) * 0.25);
  const pulse = 0.85 + 0.15 * Math.sin(f * 0.18);
  const selT = f - T_SEL;
  const enchanted = f >= T_BANG;
  const lapisLeft = f < T_SEL + 4 ? lapisCount : 0;
  const CUR0 = HOVER[0][0] - 10;

  const [cx, cy] = cursorAt(f, [
    [CUR0, 1620, 840],
    [HOVER[0][0], ROW_C(0)[0] + 140, ROW_C(0)[1] + 4],
    [HOVER[0][1], ROW_C(0)[0] + 150, ROW_C(0)[1]],
    [HOVER[1][0], ROW_C(1)[0] + 140, ROW_C(1)[1] + 4],
    [HOVER[1][1], ROW_C(1)[0] + 150, ROW_C(1)[1]],
    [HOVER[2][0], ROW_C(2)[0] + 140, ROW_C(2)[1] + 4],
    [T_SEL, ROW_C(SELI)[0] + 150, ROW_C(SELI)[1]],
    [T_SEL + 16, 1620, 900],
  ]);
  const hov = HOVER.map((h) => hoverAmt(f, h));
  const tipIdx = hov.findIndex((h, i) => h > 0.5 && !(i === SELI && f >= T_SEL));
  const swordLand = f - (T_SWORD + LAND);
  const lapisLand = f - (T_LAPIS + LAND);
  const bookY = 96 + Math.sin(f * 0.1) * 10;
  const lvl = f >= T_SEL ? Math.round(lerp(levelBefore, levelAfter, EASE.out(clamp01((f - T_SEL - 2) / 10)))) : levelBefore;

  return (
    <AbsoluteFill style={{background: bg ? '#0a0713' : 'transparent'}}>
      {bg && (
        <>
          <TileBg tex="bookshelf" tile={192} dark={0.6} tint="rgba(80,40,160,0.28)" drift={0} />
          <Glow x={960} y={540} r={1000} color="#5b34c8" op={0.55 * pulse} />
          <Glow x={960} y={560} r={720} color="#2fd0ff" op={0.12 + energy * 0.16} />
          <Rays x={960} y={540} size={2000} color="170,120,255" op={0.1 + energy * 0.12} n={12} speed={0.25} />

          {/* rune belts above and below the panel */}
          <RuneBelt y={44} n={26} size={48} color="#b57cff" op={0.5 * open} dir={1} seed={2} />
          <RuneBelt y={1000} n={26} size={48} color="#7df9ff" op={0.4 * open} dir={-1} seed={9} />
          <Drift amount={energy} />

          {/* floating book */}
          <div style={{position: 'absolute', left: 960 - 64, top: bookY - 64, width: 128, height: 128, opacity: open}}>
            <Glow x={64} y={64} r={150} color="#b57cff" op={0.7 * pulse} />
            <Item id="enchanted_book" size={128} glint shadow={10} />
          </div>
          <Stars x={800} y={20} w={320} h={180} count={8} size={36} colors={['#ffffff', '#d9c8ff', '#9ff7ff']} seed={12} />
        </>
      )}

      {/* panel */}
      <div style={{opacity: open, transform: `scale(${0.92 + 0.08 * EASE.back(clamp01(f / 14))})`, transformOrigin: '50% 50%'}}>
        <Panel x={PX} y={PY} w={PW} h={PH} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
          </div>
        </Panel>
      </div>
      <div style={{opacity: open}}>
        <div style={{position: 'absolute', left: ITEM_XY[0], top: ITEM_XY[1]}}>
          <Cell size={S} frame={f >= T_SWORD + LAND ? 'slot_target' : 'slot'} />
        </div>
        <div style={{position: 'absolute', left: LAPIS_XY[0], top: LAPIS_XY[1]}}>
          <Cell size={S} frame={f >= T_LAPIS + LAND && lapisLeft > 0 ? 'slot_target' : 'slot'} />
        </div>
        <div style={{position: 'absolute', left: ITEM_XY[0], width: S, top: ITEM_XY[1] - 44, textAlign: 'center'}}>
          <LabelSmall color="#b1b2b5">{itemLabel}</LabelSmall>
        </div>
        <div style={{position: 'absolute', left: LAPIS_XY[0], width: S, top: LAPIS_XY[1] + S + 14, textAlign: 'center'}}>
          <LabelSmall color="#b1b2b5">{lapisLabel}</LabelSmall>
        </div>
        {/* sword in slot */}
        {swordLand >= -LAND && (
          <ItemAt
            id={item}
            x={f < T_SWORD + LAND ? lerp(150, SWORD_C[0], EASE.out(clamp01((f - T_SWORD) / LAND))) : SWORD_C[0]}
            y={(f < T_SWORD + LAND ? lerp(900, SWORD_C[1], EASE.out(clamp01((f - T_SWORD) / LAND))) - Math.sin(clamp01((f - T_SWORD) / LAND) * Math.PI) * 200 : SWORD_C[1]) - (enchanted ? Math.sin((f - T_BANG) * 0.12) * 6 + 8 : 0)}
            size={108}
            scale={(f < T_SWORD + LAND ? lerp(1.5, 1, EASE.out(clamp01((f - T_SWORD) / LAND))) : 1) * (enchanted ? 1.2 + 0.04 * Math.sin((f - T_BANG) * 0.2) : 1)}
            rot={f < T_SWORD + LAND ? (1 - clamp01((f - T_SWORD) / LAND)) * -40 : 0}
            glint={enchanted}
            shadow={10}
            z={6}
          />
        )}
        {/* lapis stack */}
        {f >= T_LAPIS && lapisLeft > 0 && (
          <>
            <ItemAt
              id={lapis}
              x={f < T_LAPIS + LAND ? lerp(150, LAPIS_XY[0] + S / 2, EASE.out(clamp01((f - T_LAPIS) / LAND))) : LAPIS_XY[0] + S / 2}
              y={f < T_LAPIS + LAND ? lerp(900, LAPIS_XY[1] + S / 2, EASE.out(clamp01((f - T_LAPIS) / LAND))) - Math.sin(clamp01((f - T_LAPIS) / LAND) * Math.PI) * 160 : LAPIS_XY[1] + S / 2}
              size={108}
              scale={f < T_LAPIS + LAND ? lerp(1.5, 1, EASE.out(clamp01((f - T_LAPIS) / LAND))) : 1}
              rot={f < T_LAPIS + LAND ? (1 - clamp01((f - T_LAPIS) / LAND)) * 40 : 0}
              shadow={8}
              z={6}
            />
            {lapisLand >= 0 && (
              <div style={{position: 'absolute', left: LAPIS_XY[0] + S - 40, top: LAPIS_XY[1] + S - 52, zIndex: 7}}>
                <OreText size={TYPE.body} shadow>
                  {String(lapisLeft)}
                </OreText>
              </div>
            )}
          </>
        )}
        <PixelBurst x={SWORD_C[0]} y={SWORD_C[1]} at={T_SWORD + LAND} count={14} colors={['#ffffff', '#55ffff', '#9ff7ff']} speed={10} life={16} size={10} seed={5} gravity={0.2} />
        <PixelBurst x={LAPIS_XY[0] + S / 2} y={LAPIS_XY[1] + S / 2} at={T_LAPIS + LAND} count={14} colors={['#ffffff', '#3a5fe0', '#7aa0ff']} speed={10} life={16} size={10} seed={6} gravity={0.2} />

        <div style={{position: 'absolute', left: ITEM_XY[0] - 12, top: 724, display: 'flex', flexDirection: 'column', gap: 12, opacity: prog(f, 20, 14)}}>
          <OreChip dot="#6cc349" color="#fff">
            {shelfChip}
          </OreChip>
          <OreChip dot="#b57cff" color={enchanted ? '#e2b6ff' : '#d4d6da'}>
            {enchanted ? doneChip : powerChip}
          </OreChip>
        </div>
        {/* options */}
        {OPTS.map((_, i) => (
          <Row key={i} i={i} sel={f >= T_SEL && i === SELI} selT={selT} opt={OPTS[i]} hover={HOVER[i]} lapis={lapis} />
        ))}

        {/* tooltip for the hovered option */}
        {tipIdx >= 0 && (
          <div style={{position: 'absolute', left: ROW_X + 40, top: 716, opacity: clamp01(hov[tipIdx] * 1.5), zIndex: 9}}>
            <OreTooltip lines={[{text: OPTS[tipIdx].tip, color: '#ffffff'}, {text: costLine.replace('{cost}', String(OPTS[tipIdx].cost)).replace('{level}', String(OPTS[tipIdx].level)), color: '#a8f06a'}]} />
          </div>
        )}
        {f >= T_BANG + 6 && (
          <div style={{position: 'absolute', left: ROW_X + 40, top: 700, opacity: prog(f, T_BANG + 6, 10), transform: `translateY(${(1 - prog(f, T_BANG + 6, 12)) * 20}px)`, zIndex: 9}}>
            <OreTooltip rare lines={resultTooltip} />
          </div>
        )}
      </div>

      {/* selection: swirl of runes into the sword */}
      {f >= T_SEL && f < T_BANG + 4 && (
        <>
          {Array.from({length: 22}, (_, i) => {
            const t = clamp01((f - T_SEL - i * 0.9) / 20);
            if (t <= 0 || t >= 1) return null;
            const e = EASE.in(t);
            const a0 = (i / 22) * TAU;
            const sx = ROW_C(SELI)[0] + Math.cos(a0) * 220;
            const sy = ROW_C(SELI)[1] + Math.sin(a0) * 40;
            const swirl = (1 - e) * 1.4;
            const mx = lerp(sx, SWORD_C[0], e);
            const my = lerp(sy, SWORD_C[1], e);
            const x = mx + Math.cos(a0 + swirl * 5) * 70 * (1 - e) * Math.sin(t * Math.PI);
            const y = my + Math.sin(a0 + swirl * 5) * 70 * (1 - e) * Math.sin(t * Math.PI) - Math.sin(t * Math.PI) * 120;
            return <Glyph key={i} ch={i * 3} x={x} y={y} size={snap(56 - e * 24, 8)} color={i % 2 ? '#e2b6ff' : '#9ff7ff'} op={1 - e * 0.3} rot={t * 360} />;
          })}
          {[0, 1, 2].map((k) => {
            const t = clamp01((f - T_SEL - k * 3) / 22);
            if (t <= 0 || t >= 1) return null;
            const e = EASE.in(t);
            const x = lerp(LAPIS_XY[0] + S / 2, SWORD_C[0], e);
            const y = lerp(LAPIS_XY[1] + S / 2, SWORD_C[1], e);
            return <div key={k} style={{position: 'absolute', left: x - 12, top: y - 12, width: 24, height: 24, background: '#5e8bff', boxShadow: '0 0 16px #5e8bff', opacity: 1 - t * 0.4}} />;
          })}
        </>
      )}

      {/* bang */}
      {bang && (
        <>
          <Rays x={SWORD_C[0]} y={SWORD_C[1]} size={1500} color="190,120,255" op={0.4 * EASE.out(clamp01((f - T_BANG) / 14)) * (1 - clamp01((f - T_BANG - 20) / 40) * 0.5)} n={14} speed={1} />
          <Glow x={SWORD_C[0]} y={SWORD_C[1]} r={340} color="#b45cff" op={0.6 * (1 - clamp01((f - T_BANG) / 50) * 0.4)} />
          {[-130, 0, 130].map((dx, i) => (
            <RuneColumn key={i} x={SWORD_C[0] + dx} y0={SWORD_C[1] + 190} y1={SWORD_C[1] - 210} n={6} size={36} color={i === 1 ? '#9ff7ff' : '#e2b6ff'} op={clamp01(1 - (f - T_BANG) / 50) * 0.95} speed={0.02} seed={4 + i * 3} />
          ))}
          <Twinkles x={SWORD_C[0]} y={SWORD_C[1]} radius={180} count={12} size={44} seed={3} />
        </>
      )}
      <PixelBurst x={SWORD_C[0]} y={SWORD_C[1]} at={T_BANG} count={70} colors={['#ffffff', '#e2b6ff', '#b45cff', '#9ff7ff']} speed={26} life={38} size={14} seed={31} />
      <Shockwave x={SWORD_C[0]} y={SWORD_C[1]} at={T_BANG} color="#e2b6ff" maxR={440} life={22} width={16} />
      <Shockwave x={SWORD_C[0]} y={SWORD_C[1]} at={T_BANG + 5} color="#9ff7ff" maxR={300} life={18} width={8} />
      <Shockwave x={ROW_C(SELI)[0]} y={ROW_C(SELI)[1]} at={T_SEL} color="#e2b6ff" maxR={260} life={14} width={10} />
      <FloatText x={1080} y={236} at={T_BANG + 4} life={40} rise={70} color="#e2b6ff" size={60}>
        {successText}
      </FloatText>
      <FloatText x={SWORD_C[0] + 10} y={SWORD_C[1] + 120} at={T_SEL + 2} life={26} rise={40} color="#ff5555" size={48}>
        {levelText}
      </FloatText>

      {/* xp bar + level */}
      <div style={{opacity: prog(f, 8, 14)}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 888, textAlign: 'center'}}>
          <OutlineT size={60} color="#80ff20">
            {String(lvl)}
          </OutlineT>
        </div>
        <Hud p="experience_bar_background" w={182} h={5} scale={5} x={960 - 455} y={962} />
        <Hud p="experience_bar_progress" w={182} h={5} scale={5} x={960 - 455} y={962} style={{clipPath: `inset(0 ${(1 - lerp(0.72, 0.4, f >= T_SEL ? EASE.out(clamp01((f - T_SEL) / 14)) : 0)) * 100}% 0 0)`}} />
      </div>

      {bg && <Embers x={0} y={80} w={W} h={900} count={44} colors={['#d9c8ff', '#9ff7ff', '#ffffff', '#b57cff']} seed={42} size={8} life={150} sway={70} amount={0.5 + energy * 0.5} opacity={0.8} dir={-1} />}
      {bg && <Vig s={0.8} color="6,2,14" inner={40} />}
      <Flash at={T_BANG} life={8} peak={0.5} color="#e8d0ff" />

      <Ripple at={T_SEL} x={cx} y={cy} color="226,182,255" />
      {f >= CUR0 && f < T_SEL + 20 && <PixelCursor x={cx} y={cy} />}
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && (
        <>
      <Sfx at={T_SWORD + LAND - 2} src={mcSound('dig/stone1')} volume={0.4} rate={1.2} />
      <Sfx at={T_LAPIS + LAND - 2} src={mcSound('dig/gravel1')} volume={0.4} rate={1.4} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={HOVER[0][0] - 18 + i * 4} src={mcSound('random/click')} volume={0.25} rate={1.1 + i * 0.12} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={HOVER[i][0] + 2} src={mcSound('random/orb')} volume={0.3} rate={0.8 + i * 0.2} />
      ))}
      <Sfx at={T_SEL} src={mcSound('random/click')} volume={0.45} rate={0.9} />
      <Sfx at={T_SEL + 2} src={mcSound('block/smithing_table/smithing_table2')} volume={0.2} rate={0.7} />
      <Sfx at={T_BANG} src={mcSound('random/levelup')} volume={0.5} rate={1.05} />
      <Sfx at={T_BANG} src={mcSound('random/explode2')} volume={0.15} rate={1.7} />
      <Sfx at={T_BANG + 4} src={mcSound('ui/toast/in')} volume={0.3} rate={1.3} />
        </>
      )}
    </AbsoluteFill>
  );
};
export const ENCHANT_FRAMES = 200;
