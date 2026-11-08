import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {item as itemUrl, tex} from '../../../mc/assets';
import {OreChip, OreSection, OreText, TYPE, nine} from '../../../mg/Ore';
import {LabelSmall, OreTooltip, Sfx, mcSound} from '../../../reel/kit';
import {Cell, EASE, Embers, FloatText, Glow, Hanging, Head, Item, ItemAt, OutlineT, Panel, Pile, Pt, Puffs, Rays, Stars, Tint, TileBg, U, Vig, W, H, clamp01, flightState, hexRgb, jiggle, lerp, mulberry32, prog, px, snap} from './kit';

/**
 * item-brewing: brewing stand. Water bottles, blaze fuel and nether wart go in, steam and bubbles rise, the liquid
 * changes colour (water -> awkward -> regeneration) over two brew cycles, then the three potions lift out, merge and glow.
 * Props: see BrewProps. `bg` (default true) draws the potion cellar; without it the UI, potions and effects remain.
 */

const PX = 420;
const PY = 170;
const PW = 1080;
const PH = 720;
const S = 36 * U; // 144
const ING: [number, number] = [888, 236];
const FUEL: [number, number] = [520, 236];
const BOT: [number, number][] = [
  [668, 560],
  [888, 604],
  [1108, 560],
];
const ICENTER = (p: [number, number]): [number, number] => [p[0] + S / 2, p[1] + S / 2];

const LAND = 12;

const C_WATER = '#4a86e8';
const C_AWK = '#9a6fdc';
const C_REGEN = '#ff5fa8';

export type BrewStage = {
  /** 这一轮加入的材料物品 id */
  ingredient: string;
  /** 这一轮酿出的药水名称(阶段卡片与标签使用) */
  name: string;
  /** 这一轮药水液体颜色,#rrggbb */
  color: string;
};

export type BrewProps = {
  /** 是否绘制酿造地窖背景(苔石墙、彩色辉光、药瓶架、灵魂灯笼、炼药锅、材料堆、蒸汽、飘尘、暗角);false 时只剩面板/药水/特效 */
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
  /** 燃料物品 id */
  fuel?: string;
  /** 起始水瓶液体颜色,#rrggbb */
  waterColor?: string;
  /** 两轮酿造:材料、阶段名称、液体颜色(最后一轮的颜色即成品颜色) */
  stages?: [BrewStage, BrewStage];
  /** 起始状态标签(第一轮之前) */
  baseName?: string;
  /** 第二轮酿造中的标签 */
  brewingText?: string;
  /** 轮次标签模板,{n} 会被替换为当前轮次 */
  roundText?: string;
  /** 燃料格上方小标签 */
  fuelLabel?: string;
  /** 材料格上方小标签 */
  ingredientLabel?: string;
  /** 状态:酿造中 */
  labelWorking?: string;
  /** 状态:完成 */
  labelDone?: string;
  /** 状态:待命 */
  labelIdle?: string;
  /** 成品提示框行(rare 样式) */
  tooltip?: {text: string; color?: string}[];
  /** 成品合体后的飘字 */
  doneText?: string;
  /** 三个水瓶飞入的本地帧 */
  bottlesAt?: [number, number, number];
  /** 燃料飞入的本地帧 */
  fuelAt?: number;
  /** 第一种材料飞入的本地帧 */
  ingredient1At?: number;
  /** 第一轮酿造的 [开始, 结束] 帧 */
  brew1?: [number, number];
  /** 第二种材料飞入的本地帧 */
  ingredient2At?: number;
  /** 第二轮酿造的 [开始, 结束] 帧 */
  brew2?: [number, number];
  /** 三瓶举起(完成)的本地帧 */
  doneAt?: number;
  /** 三瓶合一的本地帧 */
  mergeAt?: number;
};

const DEFAULT_STAGES: [BrewStage, BrewStage] = [
  {ingredient: 'nether_wart', name: '粗制药水', color: C_AWK},
  {ingredient: 'ghast_tear', name: '再生药水', color: C_REGEN},
];
const DEFAULT_TIP = [
  {text: '再生药水', color: '#ff7ac0'},
  {text: '再生 (0:45)', color: '#ff7ac0'},
  {text: '每 2.5 秒恢复 1 点生命', color: '#a8a8a8'},
];
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`;
};

/** Potion bottle with tinted liquid. */
const Potion: FC<{size: number; color: string; style?: React.CSSProperties}> = ({size, color, style}) => (
  <div style={{position: 'relative', width: size, height: size, ...style}}>
    <Img src={itemUrl('potion')} style={{position: 'absolute', inset: 0, width: size, height: size, ...px}} />
    <Tint src={itemUrl('potion_overlay')} color={color} size={size} style={{position: 'absolute', left: 0, top: 0}} />
  </div>
);

const PotionAt: FC<{x: number; y: number; size: number; color: string; scale?: number; rot?: number; op?: number; z?: number; shadow?: number}> = ({x, y, size, color, scale = 1, rot = 0, op = 1, z, shadow = 0}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `rotate(${rot}deg) scale(${scale})`, opacity: op, zIndex: z, filter: shadow ? `drop-shadow(0 ${shadow}px 0 rgba(0,0,0,0.38))` : undefined}}>
    <Potion size={size} color={color} />
  </div>
);

export const Brewing: FC<BrewProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '酿造台',
  subtitle = '水瓶 → 粗制 → 再生药水',
  tag = 'BREW',
  headIcon = 'brewing_stand',
  accent = '#4cff7a',
  panelTitle = '酿造台 · 再生药水',
  fuel = 'blaze_powder',
  waterColor = C_WATER,
  stages = DEFAULT_STAGES,
  baseName = '水瓶',
  brewingText = '酿造中…',
  roundText = '第 {n} / 2 轮',
  fuelLabel = '燃料',
  ingredientLabel = '材料',
  labelWorking = '酿造中',
  labelDone = '完成',
  labelIdle = '待命',
  tooltip = DEFAULT_TIP,
  doneText = '酿造完成',
  bottlesAt: T_BOT = [14, 20, 26],
  fuelAt: T_FUEL = 32,
  ingredient1At: T_WART = 38,
  brew1: B1 = [56, 108],
  ingredient2At: T_TEAR = 118,
  brew2: B2 = [134, 190],
  doneAt: T_DONE = 192,
  mergeAt: T_MERGE = 208,
}) => {
  const C_AWK = stages[0].color;
  const C_REGEN = stages[1].color;
  const f = useCurrentFrame();
  const open = prog(f, 0, 14);
  const pulse = 0.85 + 0.15 * Math.sin(f * 0.17);

  const p1 = prog(f, B1[0], B1[1] - B1[0], (t) => t);
  const p2 = prog(f, B2[0], B2[1] - B2[0], (t) => t);
  const brewing = (f >= B1[0] && f < B1[1]) || (f >= B2[0] && f < B2[1]);
  const progress = f < B1[1] ? p1 : f < B2[0] ? 0 : p2;
  const stage = f < B1[1] ? 0 : f < B2[1] ? 1 : 2;
  const liquid = f < B1[1] ? mix(waterColor, C_AWK, EASE.inOut(p1)) : f < B2[1] ? mix(C_AWK, C_REGEN, EASE.inOut(p2)) : C_REGEN;
  const steamAmt = clamp01(0.25 + (brewing ? 0.75 : 0) + (f >= T_DONE ? 0.5 : 0));
  const done = f >= T_DONE;
  const merge = prog(f, T_MERGE, 16, EASE.inOut);
  const BIG: [number, number] = [960, 470];
  const slam = f >= T_MERGE + 14;
  const bigP = prog(f, T_MERGE + 12, 12, EASE.back);

  const fuelLeft = f < T_FUEL + LAND ? 1 : f < B1[0] ? 1 : f < B2[1] ? 1 - (f < B1[1] ? p1 * 0.5 : 0.5 + p2 * 0.5) * 0.9 : 0.1;

  return (
    <AbsoluteFill style={{background: bg ? '#0a0f10' : 'transparent'}}>
      {bg && (
        <>
      <TileBg tex="mossy_stone_bricks" tile={128} dark={0.6} tint="rgba(30,160,150,0.2)" />
      <Glow x={960} y={560} r={900} color="#1f9a98" op={0.35 * pulse} />
      <Glow x={140} y={200} r={500} color="#7a4cff" op={0.25} />
      <Glow x={1800} y={140} r={460} color="#35d6ff" op={0.35} />
      <Glow x={1780} y={900} r={520} color="#4cff7a" op={0.35 * pulse} />

      {/* left shelves with bottles */}
      {[210, 392, 574].map((y, i) => (
        <div key={y} style={{position: 'absolute', left: 30, top: y + 96, width: 330, height: 18, background: '#4b3320', borderTop: '4px solid #6e4b2c', boxShadow: '0 8px 0 #130c06', opacity: open}} />
      ))}
      {(
        [
          ['glass_bottle', 90, 230],
          ['potion', 190, 230],
          ['splash_potion', 290, 230],
          ['honey_bottle', 90, 412],
          ['experience_bottle', 190, 412],
          ['ominous_bottle', 290, 412],
          ['lingering_potion', 90, 594],
          ['dragon_breath', 190, 594],
          ['ender_pearl', 290, 594],
        ] as [string, number, number][]
      ).map(([id, x, y], i) => {
        const p = prog(f, 4 + i * 3, 14, EASE.back);
        return <ItemAt key={i} id={id} x={x} y={y + 40} size={92} scale={p} op={clamp01(p * 3)} shadow={8} />;
      })}

      {/* right: hanging soul lanterns + shelf */}
      <Hanging
        items={[
          ['soul_lantern', 1640, 150, -4],
          ['soul_lantern', 1790, 190, 5],
        ]}
        size={104}
        at={6}
      />
      {[390, 572].map((y) => (
        <div key={y} style={{position: 'absolute', left: 1560, top: y + 96, width: 330, height: 18, background: '#4b3320', borderTop: '4px solid #6e4b2c', boxShadow: '0 8px 0 #130c06', opacity: open}} />
      ))}
      {(
        [
          ['spider_eye', 1620, 400],
          ['fermented_spider_eye', 1720, 400],
          ['magma_cream', 1820, 400],
          ['rabbit_foot', 1620, 582],
          ['glistering_melon_slice', 1720, 582],
          ['blaze_rod', 1820, 582],
        ] as [string, number, number][]
      ).map(([id, x, y], i) => {
        const p = prog(f, 8 + i * 3, 14, EASE.back);
        return <ItemAt key={id} id={id} x={x} y={y + 40} size={92} scale={p} op={clamp01(p * 3)} shadow={8} />;
      })}
      {/* cauldron */}
      <div style={{position: 'absolute', left: 1640, top: 770, opacity: open}}>
        <Glow x={130} y={80} r={240} color="#5cff8a" op={0.4 * pulse} />
        <ItemAt id="cauldron" x={130} y={130} size={260} shadow={14} />
      </div>
      {Array.from({length: 8}, (_, i) => {
        const r = mulberry32(i + 5);
        const per = 50 + r() * 30;
        const t = ((f + r() * per) % per) / per;
        return <Pt key={i} name="bubble" x={1700 + r() * 120 + Math.sin(t * 6 + i) * 10} y={800 - t * 120} size={snap(24 + r() * 20, 4)} op={Math.sin(t * Math.PI)} />;
      })}

      <Pile x={250} y={982} items={[['glass_bottle', -70, 4, -10], ['glass_bottle', 0, -6, 12], ['glass_bottle', 70, 6, -6], ['sugar', -20, 44, 8], ['glowstone_dust', 54, 46, -12]]} size={84} at={4} />
      <Pile x={1500} y={990} items={[['nether_wart', -70, 4, -12], ['blaze_powder', 0, -6, 8], ['ghast_tear', 66, 6, 14], ['redstone', -20, 44, 0], ['gunpowder', 50, 48, -8]]} size={84} at={4} />

      {/* steam behind the panel */}
      <Puffs x={960} y={900} w={900} count={14} seed={7} size={200} rise={700} life={110} op={0.38} filter="brightness(1.6)" amount={steamAmt} />
        </>
      )}

      {/* panel */}
      <div style={{opacity: open, transform: `scale(${0.92 + 0.08 * EASE.back(clamp01(f / 14))})`, transformOrigin: '50% 45%'}}>
        <Panel x={PX} y={PY} w={PW} h={PH} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={panelTitle} grow={prog(f, 4, 22)} />
          </div>
        </Panel>
        {/* slots */}
        <div style={{position: 'absolute', left: FUEL[0], top: FUEL[1]}}>
          <Cell size={S} frame={f >= T_FUEL + LAND && fuelLeft > 0.1 ? 'slot_target' : 'slot'} />
        </div>
        <div style={{position: 'absolute', left: ING[0], top: ING[1]}}>
          <Cell size={S} frame={brewing ? 'slot_target' : 'slot'} />
        </div>
        {BOT.map((b, i) => (
          <div key={i} style={{position: 'absolute', left: b[0], top: b[1]}}>
            <Cell size={S} frame={f >= T_BOT[i] + LAND && !done ? 'slot_target' : 'slot'} />
          </div>
        ))}
        {/* fuel bar */}
        <div style={{position: 'absolute', left: FUEL[0], top: FUEL[1] + S + 16, width: S, height: 16, ...nine('track', [2, 2, 2, 2]), opacity: prog(f, 20, 10)}}>
          <div style={{position: 'absolute', left: 4, top: 4, bottom: 4, width: (S - 8) * fuelLeft, background: '#f8af2b'}} />
        </div>
        <div style={{position: 'absolute', left: FUEL[0], width: S, top: FUEL[1] - 44, textAlign: 'center'}}>
          <LabelSmall color="#b1b2b5">{fuelLabel}</LabelSmall>
        </div>
        <div style={{position: 'absolute', left: ING[0], width: S, top: ING[1] - 44, textAlign: 'center'}}>
          <LabelSmall color="#b1b2b5">{ingredientLabel}</LabelSmall>
        </div>
        {/* progress arrow (vanilla sprite) + bubbles */}
        <div style={{position: 'absolute', left: ING[0] + S / 2 - 23, top: ING[1] + S + 14}}>
          <Img src={tex('gui/sprites/container/brewing_stand/brew_progress.png')} style={{width: 45, height: 140, opacity: 0.25, ...px}} />
          <Img src={tex('gui/sprites/container/brewing_stand/brew_progress.png')} style={{position: 'absolute', left: 0, top: 0, width: 45, height: 140, clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)`, filter: 'drop-shadow(0 0 8px #ffe27a)', ...px}} />
        </div>
        <div style={{position: 'absolute', left: ING[0] + S + 36, top: ING[1] + 30, opacity: brewing ? 1 : 0.2}}>
          <Img src={tex('gui/sprites/container/brewing_stand/bubbles.png')} style={{width: 60, height: 145, clipPath: `inset(${100 - (((f * 2) % 100) * 0.6 + 40)}% 0 0 0)`, ...px}} />
        </div>
        <div style={{position: 'absolute', left: ING[0] - 160, top: ING[1] + S + 20, width: 100, textAlign: 'right', opacity: prog(f, 30, 10)}}>
          <LabelSmall color={brewing ? '#f8af2b' : '#8c8d90'}>{brewing ? labelWorking : done ? labelDone : labelIdle}</LabelSmall>
        </div>
      </div>

      {/* stage cards on the right of the panel */}
      <div style={{position: 'absolute', left: 1130, top: 236, width: 330, display: 'flex', flexDirection: 'column', gap: 16, opacity: prog(f, 18, 14)}}>
        {stages.map(({ingredient: id, name, color: col}, i) => {
          const act = stage === i;
          const ok = stage > i;
          return (
            <div key={id} style={{...nine(act ? 'slot_target' : 'slot', [2, 2, 2, 2]), height: 132, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', opacity: act || ok ? 1 : 0.6}}>
              <Item id={id} size={72} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                <OreText size={TYPE.body} color={ok ? '#b8f040' : '#fff'} shadow>
                  {`${ok ? '✓ ' : ''}${name}`}
                </OreText>
                <div style={{width: 120, height: 12, background: col, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.3)'}} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 468, top: 760, display: 'flex', gap: 12, opacity: prog(f, 22, 14)}}>
        <OreChip dot={liquid} color="#fff">
          {stage === 0 ? baseName : stage === 1 ? (f < B2[0] ? stages[0].name : brewingText) : stages[1].name}
        </OreChip>
        <OreChip dot="#f8af2b" color="#d4d6da">
          {roundText.replace('{n}', String(Math.min(2, stage + 1)))}
        </OreChip>
      </div>

      {/* ingredients + bottles + fuel */}
      {(() => {
        const els: React.ReactNode[] = [];
        // fuel
        const fuelFl = flightState(f, T_FUEL, LAND, [250, 960], ICENTER(FUEL), -220);
        if (fuelFl.started) els.push(<ItemAt key="fuel" id={fuel} x={fuelFl.x} y={fuelFl.y} size={108} scale={fuelFl.t < 1 ? lerp(1.5, 1, EASE.out(fuelFl.t)) : 1} sx={1 + fuelFl.squash} rot={fuelFl.t < 1 ? (1 - fuelFl.t) * 40 : 0} op={clamp01(fuelFl.t * 5)} shadow={fuelFl.t < 1 ? 12 : 0} z={6} />);
        // ingredients: wart then tear
        const wartFl = flightState(f, T_WART, LAND, [1500, 960], ICENTER(ING), -240);
        const wartGone = f >= B1[1] - 2;
        if (wartFl.started && !wartGone)
          els.push(<ItemAt key="wart" id={stages[0].ingredient} x={wartFl.x} y={wartFl.y} size={108} scale={(wartFl.t < 1 ? lerp(1.5, 1, EASE.out(wartFl.t)) : 1) * (1 - clamp01((f - (B1[1] - 10)) / 8) * 0.6)} sx={1 + wartFl.squash} rot={wartFl.t < 1 ? (1 - wartFl.t) * -40 : 0} op={clamp01(wartFl.t * 5) * (1 - clamp01((f - (B1[1] - 10)) / 8))} shadow={wartFl.t < 1 ? 12 : 0} z={6} />);
        const tearFl = flightState(f, T_TEAR, LAND, [1500, 960], ICENTER(ING), -240);
        const tearGone = f >= B2[1] - 2;
        if (tearFl.started && !tearGone)
          els.push(<ItemAt key="tear" id={stages[1].ingredient} x={tearFl.x} y={tearFl.y} size={108} scale={(tearFl.t < 1 ? lerp(1.5, 1, EASE.out(tearFl.t)) : 1) * (1 - clamp01((f - (B2[1] - 10)) / 8) * 0.6)} sx={1 + tearFl.squash} rot={tearFl.t < 1 ? (1 - tearFl.t) * 40 : 0} op={clamp01(tearFl.t * 5) * (1 - clamp01((f - (B2[1] - 10)) / 8))} shadow={tearFl.t < 1 ? 12 : 0} z={6} />);
        // bottles
        BOT.forEach((b, i) => {
          const c = ICENTER(b);
          const fl = flightState(f, T_BOT[i], LAND, [250 + (i - 1) * 60, 960], c, -240);
          if (!fl.started) return;
          const shake = brewing ? Math.sin(f * 1.3 + i * 2) * 3 : 0;
          const lift = done ? EASE.out(clamp01((f - T_DONE) / 10)) * -30 : 0;
          const g = merge;
          const x = lerp(c[0], BIG[0], EASE.in(g)) + shake;
          const y = lerp(c[1] + lift, BIG[1], EASE.in(g));
          if (g >= 1) return;
          els.push(
            <PotionAt
              key={`b${i}`}
              x={fl.t < 1 ? fl.x : x}
              y={fl.t < 1 ? fl.y : y}
              size={108}
              color={liquid}
              scale={(fl.t < 1 ? lerp(1.5, 1, EASE.out(fl.t)) : 1) * (1 + (done ? 0.1 * jiggle(clamp01((f - T_DONE) / 20), 2.5, 3) : 0)) * (1 - g * 0.3)}
              rot={fl.t < 1 ? (1 - fl.t) * (i - 1) * 50 : brewing ? Math.sin(f * 0.8 + i) * 3 : 0}
              op={clamp01(fl.t * 5)}
              shadow={fl.t < 1 ? 12 : 6}
              z={6}
            />,
          );
        });
        return els;
      })()}
      {BOT.map((b, i) => (
        <PixelBurst key={i} x={ICENTER(b)[0]} y={ICENTER(b)[1]} at={T_BOT[i] + LAND} count={12} colors={['#ffffff', '#bfe6ff', waterColor]} speed={9} life={16} size={10} seed={50 + i} gravity={0.2} />
      ))}
      <PixelBurst x={ICENTER(ING)[0]} y={ICENTER(ING)[1]} at={T_WART + LAND} count={12} colors={['#ffffff', '#ff5555', '#aa2222']} speed={9} life={16} size={10} seed={5} gravity={0.2} />
      <PixelBurst x={ICENTER(ING)[0]} y={ICENTER(ING)[1]} at={T_TEAR + LAND} count={12} colors={['#ffffff', '#c8e8ff', '#9ff7ff']} speed={9} life={16} size={10} seed={6} gravity={0.2} />

      {/* bottle bubbles during brewing */}
      {brewing &&
        BOT.map((b, i) =>
          Array.from({length: 4}, (_, k) => {
            const r = mulberry32(i * 10 + k + 3);
            const per = 28 + r() * 16;
            const t = ((f + r() * per) % per) / per;
            return <Pt key={`${i}-${k}`} name="bubble" x={ICENTER(b)[0] + (r() - 0.5) * 70} y={ICENTER(b)[1] - 20 - t * 130} size={snap(16 + r() * 12, 4)} op={Math.sin(t * Math.PI) * 0.9} filter={`drop-shadow(0 0 4px ${liquid})`} />;
          }),
        )}
      <Puffs x={960} y={640} w={560} count={8} seed={11} size={120} rise={260} life={60} op={0.5} filter="brightness(1.7)" amount={brewing ? 1 : 0} />

      {/* stage switch bursts */}
      <PixelBurst x={960} y={640} at={B1[1]} count={40} colors={['#ffffff', C_AWK, '#d9c8ff']} speed={18} life={30} size={12} seed={21} gravity={-0.1} />
      <Shockwave x={960} y={640} at={B1[1]} color={C_AWK} maxR={380} life={20} width={12} />
      <PixelBurst x={960} y={640} at={B2[1]} count={50} colors={['#ffffff', C_REGEN, '#ffb0d8']} speed={20} life={32} size={12} seed={22} gravity={-0.1} />
      <Shockwave x={960} y={640} at={B2[1]} color={C_REGEN} maxR={440} life={22} width={14} />
      <Flash at={B1[1]} life={6} peak={0.18} color="#e8d8ff" />
      <Flash at={B2[1]} life={7} peak={0.25} color="#ffe0f0" />

      {/* final merged potion */}
      {f >= T_MERGE && merge >= 0.5 && (
        <>
          <Rays x={BIG[0]} y={BIG[1]} size={1800} color={hexRgb(C_REGEN)} op={0.36 * EASE.out(clamp01((f - T_MERGE - 8) / 16))} n={14} />
          <Glow x={BIG[0]} y={BIG[1]} r={460} color={C_REGEN} op={0.6} />
          <PotionAt x={BIG[0]} y={BIG[1] - Math.sin((f - T_MERGE) * 0.12) * 8} size={200} color={C_REGEN} scale={slam ? lerp(2.2, 1.3, bigP) : 0.7 + merge * 0.5} op={1} shadow={14} z={10} />
          {slam && <Twinkles x={BIG[0]} y={BIG[1]} radius={210} count={12} size={44} seed={8} />}
          {slam && <Stars x={BIG[0] - 320} y={BIG[1] - 260} w={640} h={520} count={10} size={44} colors={['#ffffff', '#ffb0d8']} seed={5} />}
        </>
      )}
      <PixelBurst x={BIG[0]} y={BIG[1]} at={T_MERGE + 14} count={80} colors={['#ffffff', C_REGEN, '#ffb0d8', '#9ff7ff']} speed={28} life={40} size={14} seed={33} />
      <Shockwave x={BIG[0]} y={BIG[1]} at={T_MERGE + 14} color={C_REGEN} maxR={500} life={22} width={16} />
      <Shockwave x={BIG[0]} y={BIG[1]} at={T_MERGE + 19} color="#ffffff" maxR={320} life={16} width={8} />
      {f >= T_MERGE + 26 && (
        <div style={{position: 'absolute', left: 1040, top: 560, opacity: prog(f, T_MERGE + 26, 8), transform: `translateX(${(1 - prog(f, T_MERGE + 26, 10)) * -24}px)`, zIndex: 12}}>
          <OreTooltip rare lines={tooltip} />
        </div>
      )}
      <FloatText x={960} y={230} at={T_MERGE + 16} life={40} rise={50} color="#ffb0d8" size={72}>
        {doneText}
      </FloatText>

      {/* foreground steam + embers */}
      {bg && (
        <>
          <Puffs x={500} y={1100} w={700} count={8} seed={3} size={260} rise={500} life={120} op={0.2} filter="brightness(1.8)" amount={steamAmt} />
          <Puffs x={1400} y={1100} w={700} count={8} seed={13} size={260} rise={500} life={120} op={0.2} filter="brightness(1.8)" amount={steamAmt} />
          <Embers x={0} y={100} w={W} h={900} count={36} colors={['#bff7ff', '#d9c8ff', '#ffffff', '#ffe27a']} seed={52} size={8} life={160} sway={60} amount={0.5 + steamAmt * 0.5} opacity={0.7} />
          <Vig s={0.8} color="2,10,12" inner={42} />
        </>
      )}
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={accent} right={tag} at={2} />}

      {audio && (
        <>
      {T_BOT.map((a, i) => (
        <Sfx key={a} at={a + LAND - 2} src={mcSound('dig/stone1')} volume={0.3} rate={1.6 + i * 0.1} />
      ))}
      <Sfx at={T_FUEL + LAND} src={mcSound('fire/ignite')} volume={0.35} rate={1.2} />
      <Sfx at={T_WART + LAND} src={mcSound('random/pop')} volume={0.4} rate={1.1} />
      <Sfx at={B1[0]} src={mcSound('random/fuse')} volume={0.2} rate={1.5} cut={30} />
      <Sfx at={B1[0] + 20} src={mcSound('random/click')} volume={0.25} rate={1.7} />
      <Sfx at={B1[1]} src={mcSound('random/orb')} volume={0.45} rate={0.9} />
      <Sfx at={T_TEAR + LAND} src={mcSound('random/pop')} volume={0.4} rate={1.4} />
      <Sfx at={B2[0]} src={mcSound('random/fuse')} volume={0.2} rate={1.7} cut={30} />
      <Sfx at={B2[1]} src={mcSound('random/orb')} volume={0.45} rate={1.2} />
      <Sfx at={T_DONE} src={mcSound('random/levelup')} volume={0.35} rate={1.3} />
      <Sfx at={T_MERGE + 14} src={mcSound('random/pop')} volume={0.5} rate={0.8} />
      <Sfx at={T_MERGE + 14} src={mcSound('ui/toast/challenge_complete')} volume={0.3} />
        </>
      )}
    </AbsoluteFill>
  );
};
export const BREW_FRAMES = 240;
