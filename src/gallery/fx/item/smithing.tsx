import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shake, Shockwave, Twinkles} from '../../../mc/Fx';
import {OreChip, OreProgress, OreSection, OreText, TYPE, nine} from '../../../mg/Ore';
import {LabelSmall, OreTooltip, Sfx, mcSound} from '../../../reel/kit';
import type {Sprite} from '../../flat';
import {block} from '../../../mc/assets';
import {AnimTex, Arrow, Cell, EASE, Embers, Glow, Hanging, Head, Item, ItemAt, Panel, Pile, Pix, Pt, Rays, Sheen, Sparks, Stars, TileBg, U, Vig, W, H, arcPos, clamp01, flightState, jiggle, lerp, prog, px, snap} from './kit';

/**
 * item-smithing: forge scene. Template + diamond sword + netherite ingot land in the smithing UI, a hammer strikes the
 * anvil three times (sparks, shake, arrow segments), the three inputs collapse and the netherite sword blazes out.
 * Props: see SmithingProps. `bg` (default true) draws the forge room; without it the UI, anvil, hammer and effects remain.
 */

const PX = 260;
const PY = 156;
const PW = 1400;
const PH = 500;
const S = 36 * U; // 144
const SY = PY + 130;
const SLOT_X = [330, 490, 650];
const RS = 56 * U; // 224
const RES: [number, number] = [1070, SY + S / 2 - RS / 2];
const RC: [number, number] = [RES[0] + RS / 2, RES[1] + RS / 2];
const ARROW: [number, number] = [848, SY + S / 2 - 54];

const LAND = 12;

export type SmithingInput = {
  /** 放入该格的物品 id */
  id: string;
  /** 飞入起点 [x, y](像素) */
  from: [number, number];
  /** 飞入开始的本地帧 */
  at: number;
};

export type SmithingProps = {
  /** 是否绘制锻造房背景(深板岩墙、炉火与熔岩槽、工具架、材料堆、飘火、暗角);false 时只剩面板/铁砧/锤子/特效 */
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
  /** 三个输入格:[模板, 基础装备, 材料],含物品 id、飞入起点与时间;第三项同时是铁砧上被锤击的毛坯 */
  inputs?: [SmithingInput, SmithingInput, SmithingInput];
  /** 三个输入格下方的小标签 */
  slotLabels?: [string, string, string];
  /** 成品物品 id */
  result?: string;
  /** 成品提示框行(rare 样式) */
  tooltip?: {text: string; color?: string}[];
  /** 三次锤击的本地帧 */
  hits?: [number, number, number];
  /** 三个输入汇聚进成品格的本地帧 */
  mergeAt?: number;
  /** 成品砸出(爆发)的本地帧 */
  slamAt?: number;
  /** 锤击计数小标签前缀(「锤击 1」「锤击 2」…) */
  hitLabel?: string;
  /** 箭头上方状态前缀(「锻造 1/3」) */
  forgeLabel?: string;
  /** 箭头上方状态:未开始 */
  labelIdle?: string;
  /** 箭头上方状态:完成 */
  labelDone?: string;
  /** 配方说明小字 */
  hint?: string;
  /** 右侧属性栏标题 */
  statsTitle?: string;
  /** 第一条属性名 */
  atkLabel?: string;
  /** 第二条属性名 */
  durLabel?: string;
  /** 第一条属性:升级前数值 */
  atkFrom?: number;
  /** 第一条属性:升级后数值 */
  atkTo?: number;
  /** 第二条属性:升级前数值 */
  durFrom?: number;
  /** 第二条属性:升级后数值 */
  durTo?: number;
};

const DEFAULT_INPUTS: [SmithingInput, SmithingInput, SmithingInput] = [
  {id: 'netherite_upgrade_smithing_template', from: [140, 160], at: 14},
  {id: 'diamond_sword', from: [120, 520], at: 22},
  {id: 'netherite_ingot', from: [1780, 940], at: 30},
];
const DEFAULT_TIP = [
  {text: '下界合金剑', color: '#ffffff'},
  {text: '锋利 V', color: '#a8a8a8'},
  {text: '+ 8 攻击伤害', color: '#5555ff'},
];

const PIVOT: [number, number] = [1400, 880];
const IMPACT: [number, number] = [896, 736];
const A_IMP = (Math.atan2(IMPACT[1] - PIVOT[1], IMPACT[0] - PIVOT[0]) * 180) / Math.PI + 360;
const HLEN = Math.hypot(IMPACT[0] - PIVOT[0], IMPACT[1] - PIVOT[1]) - 38;

const ANVIL: Sprite = {
  rows: [
    '..HHHHHHHHHHHHHHHHHHH.',
    '.HLLLLLLLLLLLLLLLLLLLM',
    'HLLLLLLLLLLLLLLLLLLLMM',
    '.MMMMMMMMMMMMMMMMMMMD.',
    '..DDMMMMMMMMMMMMMDDD..',
    '.....LMMMMMMMMMD......',
    '.....LMMMMMMMMMD......',
    '.....LMMMMMMMMMD......',
    '.....LMMMMMMMMMD......',
    '....LLMMMMMMMMMDD.....',
    '...LLMMMMMMMMMMMDD....',
    '..LLMMMMMMMMMMMMMDD...',
    '..MMMMMMMMMMMMMMMDD...',
    '..DDDDDDDDDDDDDDDDD...',
  ].map((r) => r.padEnd(22, '.')),
  palette: {H: '#d7d9e6', L: '#a2a5b8', M: '#767a8e', D: '#4a4d5e'},
};

/** Piecewise value over [frame, value, ease?] keyframes. */
const keyAt = (f: number, kfs: [number, number, ((t: number) => number)?][]) => {
  if (f <= kfs[0][0]) return kfs[0][1];
  for (let i = 0; i < kfs.length - 1; i++) {
    const [fa, va] = kfs[i];
    const [fb, vb, e] = kfs[i + 1];
    if (f < fb) return lerp(va, vb, (e ?? EASE.out)(clamp01((f - fa) / (fb - fa))));
  }
  return kfs[kfs.length - 1][1];
};

const Hammer: FC<{angle: number; visible: boolean; heat: number}> = ({angle, visible, heat}) => {
  if (!visible) return null;
  const wood = '#6b4524';
  return (
    <div style={{position: 'absolute', left: PIVOT[0], top: PIVOT[1], transform: `rotate(${angle}deg)`, transformOrigin: '0 0', zIndex: 20, filter: 'drop-shadow(0 10px 0 rgba(0,0,0,0.4))'}}>
      {/* handle */}
      <div style={{position: 'absolute', left: -420, top: -20, width: 420 + HLEN, height: 40, background: '#25170b'}} />
      <div style={{position: 'absolute', left: -420, top: -15, width: 420 + HLEN, height: 30, background: wood}} />
      <div style={{position: 'absolute', left: -420, top: -15, width: 420 + HLEN, height: 8, background: '#9c6a38'}} />
      <div style={{position: 'absolute', left: -420, top: 7, width: 420 + HLEN, height: 8, background: '#4a2e16'}} />
      {/* head */}
      <div style={{position: 'absolute', left: HLEN - 46, top: -80, width: 92, height: 160, background: '#14141c'}} />
      <div style={{position: 'absolute', left: HLEN - 38, top: -72, width: 76, height: 144, background: '#7d8196'}} />
      <div style={{position: 'absolute', left: HLEN - 38, top: -72, width: 76, height: 24, background: '#c8cbdb'}} />
      <div style={{position: 'absolute', left: HLEN - 38, top: 48, width: 76, height: 24, background: '#54586c'}} />
      <div style={{position: 'absolute', left: HLEN + 18, top: -72, width: 20, height: 144, background: '#a0a4b8'}} />
      {/* heat glow on the striking face */}
      <div style={{position: 'absolute', left: HLEN + 18, top: -72, width: 20, height: 144, background: '#ff9a3c', opacity: heat * 0.8, mixBlendMode: 'screen'}} />
      {/* leather grip bands */}
      {[HLEN - 140, HLEN - 110, HLEN - 80].map((x) => (
        <div key={x} style={{position: 'absolute', left: x, top: -12, width: 12, height: 24, background: '#2b1b0e'}} />
      ))}
    </div>
  );
};

const Scene: FC<SmithingProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '锻造台',
  subtitle = '钻石剑 → 下界合金剑',
  tag = 'SMITH',
  headIcon = 'smithing_table',
  accent = '#ff9a3c',
  panelTitle = '锻造台 · 下界合金升级',
  inputs = DEFAULT_INPUTS,
  slotLabels = ['模板', '基础', '材料'],
  result = 'netherite_sword',
  tooltip = DEFAULT_TIP,
  hits: HITS = [58, 74, 90],
  mergeAt: T_MERGE = 106,
  slamAt: T_SLAM = 118,
  hitLabel = '锤击',
  forgeLabel = '锻造',
  labelIdle = '准备中',
  labelDone = '完成',
  hint = '钻石剑 + 下界合金锭 + 升级模板',
  statsTitle = '属性',
  atkLabel = '攻击伤害',
  durLabel = '耐久',
  atkFrom = 7,
  atkTo = 8,
  durFrom = 1561,
  durTo = 2031,
}) => {
  const IN_AT = inputs.map((q) => q.at);
  const f = useCurrentFrame();
  const open = prog(f, 0, 14);
  const hitIdx = HITS.filter((h) => f >= h).length; // 0..3
  const lastHit = hitIdx > 0 ? HITS[hitIdx - 1] : -99;
  const sinceHit = f - lastHit;
  const bump = sinceHit >= 0 && sinceHit < 12 ? jiggle(sinceHit / 12, 2.2, 3.5) : 0;
  const hitFlash = sinceHit >= 0 && sinceHit < 6 ? 1 - sinceHit / 6 : 0;
  const segs = HITS.map((h) => prog(f, h, 8, (t) => t));
  const fill = (segs[0] + segs[1] + segs[2]) / 3;
  const merged = f >= T_MERGE;
  const slammed = f >= T_SLAM;
  const slamP = prog(f, T_SLAM, 10, EASE.back);
  const heat = clamp01((hitIdx + hitFlash * 0.6) / 3);
  const flick = 0.85 + 0.15 * Math.sin(f * 0.7) * Math.sin(f * 0.31);

  // hammer
  const A_W = A_IMP + 30;
  const kfs: [number, number, ((t: number) => number)?][] = [
    [30, A_IMP - 75],
    [HITS[0] - 8, A_W, EASE.out],
    [HITS[0], A_IMP, EASE.in],
    [HITS[0] + 5, A_IMP + 12, EASE.out],
    [HITS[1] - 8, A_W, EASE.out],
    [HITS[1], A_IMP, EASE.in],
    [HITS[1] + 5, A_IMP + 12, EASE.out],
    [HITS[2] - 8, A_W, EASE.out],
    [HITS[2], A_IMP, EASE.in],
    [HITS[2] + 5, A_IMP + 12, EASE.out],
    [HITS[2] + 18, A_IMP - 80, EASE.inOut],
  ];
  const hAngle = keyAt(f, kfs);
  const hammerOn = f >= 30 && f < HITS[2] + 22;

  const ISZ = snap(S * 0.75);
  const stats = {atk: lerp(atkFrom, atkTo, slammed ? EASE.out(clamp01((f - T_SLAM - 10) / 14)) : 0), dur: lerp(durFrom, durTo, slammed ? EASE.out(clamp01((f - T_SLAM - 10) / 20)) : 0)};
  const panelDy = bump * -10;

  return (
    <AbsoluteFill style={{background: bg ? '#0d0a0f' : 'transparent'}}>
      {bg && (
        <>
      <TileBg tex="deepslate_bricks" tile={128} dark={0.5} tint="rgba(150,60,40,0.18)" />
      <Glow x={140} y={820} r={780} color="#ff6a1c" op={0.5 * flick} />
      <Glow x={1800} y={200} r={620} color="#7345e5" op={0.25} />
      <Glow x={960} y={760} r={700} color="#ff8a2c" op={0.12 + heat * 0.35} squash={0.55} />

      {/* floor */}
      <div style={{position: 'absolute', left: 0, top: 1016, width: W, height: H - 1016, background: '#1a1319', borderTop: '8px solid #0a070b'}} />

      {/* left forge: two furnaces + lava trough */}
      {[196, 400].map((y, i) => (
        <div key={y} style={{position: 'absolute', left: 36, top: y, width: 176, height: 176, opacity: open, transform: `scale(${prog(f, 2 + i * 4, 14, EASE.back)})`}}>
          <div style={{position: 'absolute', inset: -8, background: '#0c0a09'}} />
          <div style={{position: 'relative', width: 176, height: 176, backgroundImage: `url(${block('furnace_front_on')})`, backgroundSize: '176px 176px', ...px}} />
          <Glow x={88} y={100} r={200} color="#ff7a1c" op={0.45 * flick} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 20, top: 900, width: 260, height: 110, background: '#0c0a09', padding: 8, opacity: open}}>
        <div style={{width: '100%', height: '100%', overflow: 'hidden', display: 'flex'}}>
          <AnimTex name="lava_still" size={110} n={20} speed={0.2} />
          <AnimTex name="lava_still" size={110} n={20} speed={0.2} style={{marginLeft: -2}} />
          <AnimTex name="lava_still" size={110} n={20} speed={0.2} style={{marginLeft: -2}} />
        </div>
      </div>

      {/* right tool rack */}
      <div style={{position: 'absolute', left: 1688, top: 176, width: 216, height: 600, ...nine('panel_glass', [2, 2, 2, 2]), opacity: 0.55 * open}} />
      <Hanging
        items={[
          ['netherite_pickaxe', 1750, 206, -8],
          ['netherite_axe', 1850, 214, 8],
          ['netherite_shovel', 1750, 370, 6],
          ['netherite_hoe', 1850, 378, -6],
          ['netherite_helmet', 1750, 540, 4],
          ['netherite_chestplate', 1850, 548, -4],
        ]}
        size={96}
        at={6}
      />
      <Pile x={1760} y={960} items={[['netherite_ingot', -60, 4, -12], ['netherite_ingot', 10, -6, 8], ['netherite_scrap', 70, 8, 14], ['gold_ingot', -20, 40, -4], ['diamond', 50, 46, 8]]} size={88} at={4} />
      <Pile x={400} y={970} items={[['coal', -60, 6, -10], ['coal', 10, -6, 14], ['blaze_powder', 66, 6, -6], ['lava_bucket', -10, 44, 0]]} size={88} at={4} />
        </>
      )}

      <div style={{position: 'absolute', inset: 0, transform: `translateY(${panelDy}px)`}}>
        {/* smithing panel */}
        <div style={{opacity: open, transform: `scale(${0.92 + 0.08 * EASE.back(clamp01(f / 14))})`, transformOrigin: '50% 45%'}}>
          <Panel x={PX} y={PY} w={PW} h={PH} variant="panel_raised">
            <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
              <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
            </div>
          </Panel>
          {SLOT_X.map((x, i) => (
            <div key={i} style={{position: 'absolute', left: x, top: SY}}>
              <Cell size={S} frame={f >= IN_AT[i] + LAND && !merged ? 'slot_target' : 'slot'} />
            </div>
          ))}
          {slotLabels.map((t, i) => (
            <div key={t} style={{position: 'absolute', left: SLOT_X[i], width: S, top: SY + S + 12, textAlign: 'center'}}>
              <LabelSmall color={f >= IN_AT[i] + LAND ? '#f8af2b' : '#8c8d90'}>{t}</LabelSmall>
            </div>
          ))}
          <div style={{position: 'absolute', left: RES[0], top: RES[1]}}>
            <Cell size={RS} frame={slammed ? 'slot_hover' : 'slot'} item={0.66} />
          </div>
        </div>
        <div style={{position: 'absolute', left: ARROW[0], top: ARROW[1], opacity: open}}>
          <Arrow value={fill} u={2 * U + 4} fill="#ff9a3c" fillHi="#ffe27a" />
        </div>
        <div style={{position: 'absolute', left: ARROW[0], top: ARROW[1] - 56, opacity: prog(f, 36, 10)}}>
          <LabelSmall color={hitIdx > 0 && !slammed ? '#ff9a3c' : '#b1b2b5'}>{slammed ? labelDone : hitIdx > 0 ? `${forgeLabel} ${hitIdx}/3` : labelIdle}</LabelSmall>
        </div>

        {/* hit pips */}
        <div style={{position: 'absolute', left: 330, top: SY + S + 80, display: 'flex', gap: 3 * U, opacity: prog(f, 20, 12)}}>
          {[0, 1, 2].map((i) => (
            <OreChip key={i} dot={f >= HITS[i] ? '#ff9a3c' : '#55565a'} color={f >= HITS[i] ? '#ffe27a' : '#8c8d90'}>
              {`${hitLabel} ${i + 1}`}
            </OreChip>
          ))}
        </div>
        <div style={{position: 'absolute', left: 330, top: SY + S + 156, opacity: prog(f, 24, 12)}}>
          <OreText size={TYPE.small} color="#8c8d90">
            {hint}
          </OreText>
        </div>

        {/* stats column */}
        <div style={{position: 'absolute', left: 1344, top: SY - 30, width: 276, opacity: prog(f, 14, 14)}}>
          <OreSection label={statsTitle} />
          <div style={{marginTop: 22}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
              <LabelSmall color="#d4d6da">{atkLabel}</LabelSmall>
              <LabelSmall color={slammed ? '#b8f040' : '#d4d6da'}>{Math.round(stats.atk)}</LabelSmall>
            </div>
            <OreProgress value={stats.atk / Math.max(10, atkTo)} width={276} color={slammed ? 'green' : 'gold'} />
          </div>
          <div style={{marginTop: 26}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
              <LabelSmall color="#d4d6da">{durLabel}</LabelSmall>
              <LabelSmall color={slammed ? '#b8f040' : '#d4d6da'}>{Math.round(stats.dur)}</LabelSmall>
            </div>
            <OreProgress value={stats.dur / Math.max(2100, durTo)} width={276} color={slammed ? 'green' : 'gold'} />
          </div>
        </div>

        {/* flying inputs / in-slot items */}
        {inputs.map((it, i) => {
          const to: [number, number] = [SLOT_X[i] + S / 2, SY + S / 2];
          const fl = flightState(f, IN_AT[i], LAND, it.from, to, -220);
          if (!fl.started) return null;
          const g = prog(f, T_MERGE + i * 1.5, 10, EASE.in);
          const [gx, gy] = arcPos(g, to, RC, i === 1 ? -20 : i === 0 ? -90 : 90);
          if (g >= 1) return null;
          const x = g > 0 ? gx : fl.x;
          const y = g > 0 ? gy : fl.y;
          const heatPulse = hitIdx > 0 && !merged ? 1 + bump * 0.12 : 1;
          return (
            <ItemAt
              key={i}
              id={it.id}
              x={x}
              y={y + (g > 0 ? 0 : 0)}
              size={ISZ}
              scale={(fl.t < 1 ? lerp(1.5, 1, EASE.out(fl.t)) : 1) * heatPulse * (1 - g * 0.5)}
              sx={1 + fl.squash}
              rot={fl.t < 1 ? (1 - fl.t) * (i - 1) * 60 : g * 360 * (i - 1)}
              op={clamp01(fl.t * 5)}
              shadow={fl.t < 1 ? 14 : 6}
              z={5}
            />
          );
        })}
        {inputs.map((it, i) => (
          <PixelBurst key={i} x={SLOT_X[i] + S / 2} y={SY + S / 2} at={IN_AT[i] + LAND} count={14} colors={['#ffffff', '#b8b8c8', '#ff9a3c']} speed={9} life={16} size={10} seed={50 + i} gravity={0.3} />
        ))}
        {/* heat glow on inputs while striking */}
        {hitIdx > 0 && !merged && SLOT_X.map((x, i) => <Glow key={i} x={x + S / 2} y={SY + S / 2} r={150} color="#ff7a2c" op={heat * 0.55 + hitFlash * 0.4} />)}
        {f >= T_MERGE - 4 && f < T_MERGE + 14 && <Glow x={RC[0]} y={RC[1]} r={280 * EASE.out(clamp01((f - T_MERGE + 4) / 14))} color="#ffe27a" op={0.8} />}

        {/* result */}
        {slammed && (
          <>
            <Rays x={RC[0]} y={RC[1]} size={1800} color="255,140,60" op={0.4 * EASE.out(clamp01((f - T_SLAM) / 16))} n={16} />
            <Rays x={RC[0]} y={RC[1]} size={1300} color="180,100,255" op={0.25 * EASE.out(clamp01((f - T_SLAM) / 20))} n={9} speed={-0.6} />
            <Glow x={RC[0]} y={RC[1]} r={440} color="#ff6a2c" op={0.55} />
            <Glow x={RC[0]} y={RC[1]} r={300} color="#b45cff" op={0.4} />
            <div style={{position: 'absolute', left: RC[0] - 96, top: RC[1] - 96, width: 192, height: 192, transform: `scale(${lerp(3.4, 1.15, slamP)}) rotate(${lerp(-25, 0, slamP)}deg)`, opacity: clamp01((f - T_SLAM + 1) * 0.6), zIndex: 8}}>
              <Item id={result} size={192} glint shadow={10} />
              <Sheen id={result} size={192} hue="gold" speed={3} />
            </div>
            <Twinkles x={RC[0]} y={RC[1]} radius={200} count={12} size={48} seed={9} />
            <Stars x={RES[0] - 80} y={RES[1] - 80} w={RS + 160} h={RS + 160} count={8} size={44} colors={['#ffe27a', '#ffffff', '#e2b6ff']} seed={4} />
            <div style={{position: 'absolute', left: RES[0] - 70, top: RES[1] + RS + 26, opacity: prog(f, T_SLAM + 10, 8), transform: `translateY(${(1 - prog(f, T_SLAM + 10, 10)) * 20}px)`, zIndex: 9}}>
              <OreTooltip rare lines={tooltip} />
            </div>
          </>
        )}
        <PixelBurst x={RC[0]} y={RC[1]} at={T_SLAM} count={80} colors={['#ffffff', '#ffd23f', '#ff9a3c', '#e2b6ff']} speed={30} life={40} size={14} seed={19} />
        <Shockwave x={RC[0]} y={RC[1]} at={T_SLAM} color="#ff9a3c" maxR={460} life={22} width={18} />
        <Shockwave x={RC[0]} y={RC[1]} at={T_SLAM + 4} color="#e2b6ff" maxR={300} life={18} width={10} />
        <Sparks x={RC[0]} y={RC[1]} at={T_SLAM} count={40} speed={30} life={34} gravity={0.9} seed={7} spread={360} />
      </div>

      {/* anvil scene */}
      <div style={{position: 'absolute', left: 960 - 242, top: IMPACT[1] - 6, opacity: open, transform: `translateY(${bump * 6}px)`, filter: `drop-shadow(0 14px 0 rgba(0,0,0,0.5)) brightness(${1 + hitFlash * 0.5})`}}>
        <Pix sprite={ANVIL} px={22} />
      </div>
      {/* hot piece on the anvil */}
      <div style={{position: 'absolute', left: IMPACT[0] - 70, top: IMPACT[1] - 84, opacity: !merged ? open : 0, transform: `scale(${1 + hitFlash * 0.12})`}}>
        <Glow x={70} y={64} r={110 + heat * 70} color="#ff7a1c" op={0.35 + heat * 0.5} />
        <ItemAt id={inputs[2].id} x={70} y={70} size={112} rot={-8} shadow={8} />
        <div style={{position: 'absolute', left: 14, top: 14, width: 112, height: 112, background: '#ff6a1c', opacity: heat * 0.35, mixBlendMode: 'screen'}} />
      </div>
      <Blob x={960} y={1036} w={600} h={40} />
      <Hammer angle={hAngle} visible={hammerOn} heat={heat} />

      {/* strike effects */}
      {HITS.map((h, i) => (
        <div key={h}>
          <Sparks x={IMPACT[0] + 10} y={IMPACT[1] - 6} at={h} count={34} speed={26} life={28} gravity={1.1} seed={100 + i} spread={170} />
          <Sparks x={IMPACT[0] + 10} y={IMPACT[1] - 6} at={h} count={10} speed={14} life={22} gravity={0.7} seed={200 + i} spread={360} colors={['#ffffff', '#ffd23f']} thick={8} />
          <PixelBurst x={IMPACT[0]} y={IMPACT[1] - 10} at={h} count={16} colors={['#ffffff', '#ffd23f', '#ff9a3c']} speed={18} life={18} size={10} seed={300 + i} gravity={0.5} />
          <Shockwave x={IMPACT[0]} y={IMPACT[1]} at={h} color="#ffcf70" maxR={200} life={12} width={10} />
          <Pt name="flash" x={IMPACT[0]} y={IMPACT[1] - 10} size={snap(200 + i * 40)} op={sinceHit >= 0 && lastHit === h && f - h < 5 ? 1 - (f - h) / 5 : 0} blend="screen" />
        </div>
      ))}

      {bg && <Embers x={0} y={300} w={W} h={780} count={42} colors={['#ffd23f', '#ff9a3c', '#ff6a2c', '#e2b6ff']} seed={63} size={10} life={120} sway={60} amount={0.45 + heat * 0.55} opacity={0.85} />}
      {bg && <Vig s={0.75} color="10,4,8" inner={40} />}
      <Flash at={T_SLAM} life={9} peak={0.6} color="#ffe2b8" />
      {HITS.map((h) => (
        <Flash key={h} at={h} life={4} peak={0.12} color="#ffcf70" />
      ))}
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && (
        <>
      {IN_AT.map((a, i) => (
        <Sfx key={a} at={a + LAND - 2} src={mcSound(i === 2 ? 'dig/stone3' : 'dig/stone1')} volume={0.4} rate={1 + i * 0.15} />
      ))}
      <Sfx at={IN_AT[2] + LAND} src={mcSound('block/smithing_table/smithing_table1')} volume={0.4} />
      {HITS.map((h, i) => (
        <Sfx key={h} at={h} src={mcSound('random/anvil_land')} volume={0.45} rate={1.5 - i * 0.12} />
      ))}
      {HITS.map((h) => (
        <Sfx key={`b${h}`} at={h} src={mcSound('block/smithing_table/smithing_table2')} volume={0.3} rate={1.3} />
      ))}
      <Sfx at={T_MERGE} src={mcSound('random/fuse')} volume={0.3} rate={1.6} cut={14} />
      <Sfx at={T_SLAM} src={mcSound('item/armor/equip_netherite1')} volume={0.55} />
      <Sfx at={T_SLAM} src={mcSound('random/explode1')} volume={0.22} rate={1.5} />
      <Sfx at={T_SLAM + 2} src={mcSound('random/levelup')} volume={0.4} rate={1.1} />
        </>
      )}
    </AbsoluteFill>
  );
};

const Blob: FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: '50%', background: 'rgba(0,0,0,0.4)'}} />;

export const Smithing: FC<SmithingProps> = (props) => {
  const HITS = props.hits ?? [58, 74, 90];
  const T_SLAM = props.slamAt ?? 118;
  return (
    <Shake at={HITS[0]} life={8} strength={7}>
      <Shake at={HITS[1]} life={8} strength={9}>
        <Shake at={HITS[2]} life={10} strength={12}>
          <Shake at={T_SLAM} life={14} strength={18}>
            <Scene {...props} />
          </Shake>
        </Shake>
      </Shake>
    </Shake>
  );
};
export const SMITHING_FRAMES = 190;
