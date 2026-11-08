import {Fragment, useMemo} from 'react';
import type {FC, ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../reel/kit';
import {hash, lerp, smooth} from '../../gallery/fx/atmo/common';
import {Letterbox2, Spotlight, VignetteBreathe, VignetteClose, type SpotPoint, type VIG_TINTS} from '../../gallery/fx/atmo/vignettes';
import {FlashFx, Hurt, Shake, ShakeDust, type FlashKind, type ShakeHit, type ShakeLevel} from '../../gallery/fx/atmo/camera';
import {LensFlare, RetroFilm, RetroFilmWrap, SpeedLines} from '../../gallery/fx/atmo/lens';
import {BlockDebris, Fireflies, XpOrbs} from '../../gallery/fx/atmo/particles';
import {DayNight, RainFx, SnowFx, Thunder, type Strike} from '../../gallery/fx/atmo/weather';

/**
 * Library layer for the atmosphere group (classicOthers / atmo). Prefix `Atm`.
 * Every layer is transparent by default; place with <Sequence from durationInFrames> (local frame 0 = first frame of the effect).
 * Sound effects are included by default; pass `audio={false}` to drop them.
 * Wrapping components (AtmShake, AtmRetroFilm with children) take footage as children.
 */

export type AtmVignetteTint = keyof typeof VIG_TINTS;
export type AtmShakeLevel = ShakeLevel;
export type AtmShakeHit = ShakeHit;
export type AtmFlashKind = FlashKind;
export type AtmSpotPoint = SpotPoint;
export type AtmStrike = Strike;

/* ------------------------------------------------------------------ vignettes */

/** 暗角收紧：边缘由外向内慢慢收紧（可带色偏渐变），把视线拉向焦点。透明层，约 150 帧。 */
export const AtmVignetteClose: FC<{
  /** 暗角起始色偏：'neutral' | 'cold' | 'warm' | 'blood'，默认 'cold' */
  tint?: AtmVignetteTint;
  /** 收紧过程中渐变到的色偏，默认 'warm'；传 null 则不渐变 */
  tintTo?: AtmVignetteTint | null;
  /** 起始收紧程度 0..1，默认 0.12 */
  from?: number;
  /** 结束收紧程度 0..1，默认 0.9 */
  to?: number;
  /** 开始收紧的帧，默认 8 */
  start?: number;
  /** 收紧所用帧数，默认 90 */
  dur?: number;
  /** 焦点 x（0..1，画面宽度比例），默认 0.5 */
  cx?: number;
  /** 焦点 y（0..1，画面高度比例），默认 0.5 */
  cy?: number;
  /** 色环强度倍数，默认 1 */
  ringAmount?: number;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({tint = 'cold', tintTo = 'warm', from = 0.12, to = 0.9, start = 8, dur = 90, cx = 0.5, cy = 0.5, ringAmount = 1, audio = true}) => (
  <>
    <VignetteClose tint={tint} tintTo={tintTo ?? undefined} from={from} to={to} start={start} dur={dur} cx={cx} cy={cy} ringAmount={ringAmount} />
  </>
);

/** 暗角呼吸：暗红暗角随“咚-咚”心跳起伏，心率逐渐加快。透明层，默认 180 帧。 */
export const AtmVignetteBreathe: FC<{
  /** 起始心率（次/分钟），默认 66 */
  bpm0?: number;
  /** 结束心率（次/分钟），默认 128 */
  bpm1?: number;
  /** 静息时暗角程度 0..1，默认 0.5 */
  base?: number;
  /** 每次心跳额外收紧的幅度，默认 0.4 */
  depth?: number;
  /** 暗角色偏，默认 'blood' */
  tint?: AtmVignetteTint;
  /** 总帧数（决定心率渐变的速度和心跳声的范围），默认 180 */
  frames?: number;
  /** 是否带心跳低频音，默认 true */
  audio?: boolean;
}> = ({bpm0 = 66, bpm1 = 128, base = 0.5, depth = 0.4, tint = 'blood', frames = 180, audio = true}) => (
  <VignetteBreathe bpm0={bpm0} bpm1={bpm1} base={base} depth={depth} tint={tint} frames={frames} sound={audio} />
);

/** 聚光灯：画面压暗，只剩一个柔边聚光依次滑向各目标点（移动时被拉成椭圆）。透明层，默认约 150 帧。 */
export const AtmSpotlight: FC<{
  /** 聚光路径 [{x, y, r 半径 px, at 到达帧}]，第一个点是起点；默认三个点（标题 / 字幕 / 物品栏位置） */
  points?: AtmSpotPoint[];
  /** 每段移动所用帧数，默认 28 */
  travel?: number;
  /** 光圈外的暗度 0..1，默认 0.88 */
  dark?: number;
  /** 边缘柔和度 0..1，默认 0.55 */
  soft?: number;
  /** 边缘暖色光晕强度 0..1，默认 0.12 */
  warm?: number;
  /** 光束内是否有漂浮尘埃，默认 true */
  dust?: boolean;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({points, travel = 28, dark = 0.88, soft = 0.55, warm = 0.12, dust = true, audio = true}) => {
  const pts = points ?? [
    {x: 960, y: 420, r: 430, at: 0},
    {x: 960, y: 835, r: 300, at: 70},
    {x: 640, y: 985, r: 250, at: 118},
  ];
  return (
    <>
      <Spotlight points={pts} travel={travel} dark={dark} soft={soft} warm={warm} dust={dust} />
      {audio && <Sfx at={0} src={mcSound('random/click')} volume={0.4} />}
    </>
  );
};

/** 电影黑边：上下黑边滑入（可滑出），带柔影、暗角、胶片颗粒，下黑边内逐字打出字幕。透明层（黑边本身不透明）。 */
export const AtmLetterbox: FC<{
  /** 黑边高度 px，默认 140（约 2.4:1） */
  size?: number;
  /** 黑边开始滑入的帧，默认 4 */
  inAt?: number;
  /** 黑边开始滑出的帧，默认 142；传 null 则常驻不滑出 */
  outAt?: number | null;
  /** 黑边内字幕文字，逐字打出；传空字符串则无字幕。默认 '他终于站在了末地传送门前。' */
  subtitle?: string;
  /** 字幕开始出现的帧，默认 40 */
  subtitleAt?: number;
  /** 胶片颗粒强度 0..1，默认 0.5 */
  grain?: number;
  /** 画面暗角强度 0..1，默认 0.5 */
  vignette?: number;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({size = 140, inAt = 4, outAt = 142, subtitle = '他终于站在了末地传送门前。', subtitleAt = 40, grain = 0.5, vignette = 0.5, audio = true}) => (
  <>
    <Letterbox2 size={size} inAt={inAt} outAt={outAt ?? undefined} subtitle={subtitle || undefined} subtitleAt={subtitleAt} grain={grain} vignette={vignette} />
  </>
);

/* ------------------------------------------------------------------ camera */

const DEFAULT_SHAKE_HITS: ShakeHit[] = [
  {at: 14, level: 'light'},
  {at: 58, level: 'medium'},
  {at: 102, level: 'heavy'},
  {at: 118, level: 'medium', scale: 0.7},
];

const ShakeSounds: FC<{hits: ShakeHit[]}> = ({hits}) => (
  <>
    {hits.map((h, i) => {
      const v = Math.min(1, h.scale ?? 1);
      if (h.level === 'light') return <Sfx key={i} at={h.at} src={mcSound('dig/stone1')} volume={0.45 * v} rate={1.2} />;
      if (h.level === 'medium') return <Sfx key={i} at={h.at} src={mcSound('random/explode3')} volume={0.4 * v} rate={1.4} cut={26} />;
      return (
        <Fragment key={i}>
          <Sfx at={h.at} src={mcSound('random/explode1')} volume={0.6 * v} rate={0.8} />
        </Fragment>
      );
    })}
  </>
);

/** 震屏（包裹素材型，需要 children）：轻/中/重三档镜头抖动，首帧猛踢后衰减，带方向模糊和残影；中/重档可同时落尘土碎石。把世界画面包进去，血条/字幕放在外面。 */
export const AtmShake: FC<{
  /** 抖动列表 [{at 帧, level 'light'|'medium'|'heavy', scale 力度倍数}]，可多次叠加；默认四次（轻、中、重、中×0.7） */
  hits?: AtmShakeHit[];
  /** 方向模糊强度 0..1，0 关闭，默认 1 */
  blur?: number;
  /** 是否叠一份上一帧的残影（会把 children 渲染两次，children 含 Audio 时请设 false），默认 true */
  ghost?: boolean;
  /** 是否叠加顶部落下的尘土碎石（中/重档触发），默认 true */
  dust?: boolean;
  /** 是否带冲击音效，默认 true */
  audio?: boolean;
  /** 要抖动的素材（一个镜头、一个场景组件等） */
  children: ReactNode;
}> = ({hits = DEFAULT_SHAKE_HITS, blur = 1, ghost = true, dust = true, audio = true, children}) => (
  <>
    <Shake hits={hits} blur={blur} ghost={ghost}>
      {children}
    </Shake>
    {dust && <ShakeDust hits={hits} />}
    {audio && <ShakeSounds hits={hits} />}
  </>
);

/** 震屏配套的尘土碎石层（透明）：中/重档触发时从顶部落下，可单独叠在任何素材上。 */
export const AtmShakeDust: FC<{
  /** 与 AtmShake 相同的抖动列表；light 档不产生尘土，默认同 AtmShake 的默认值 */
  hits?: AtmShakeHit[];
}> = ({hits = DEFAULT_SHAKE_HITS}) => <ShakeDust hits={hits} />;

/** 闪白 / 闪色：一帧到峰值再衰减，白热核心 + 像素十字光芒 + 带色余辉，金/白闪带像素火星。透明层，本体约 18–36 帧。 */
export const AtmFlash: FC<{
  /** 闪光种类 'white' | 'gold' | 'red'，默认 'white' */
  kind?: AtmFlashKind;
  /** 触发帧（本地帧），默认 0 */
  at?: number;
  /** 衰减帧数；省略则按种类取默认（白 18 / 金 30 / 红 36） */
  life?: number;
  /** 峰值强度 0..1；省略则按种类取默认（约 0.9） */
  peak?: number;
  /** 光源 x（0..1），默认 0.5 */
  x?: number;
  /** 光源 y（0..1），默认 0.5 */
  y?: number;
  /** 是否有像素火星（红闪无火星），默认 true */
  sparks?: boolean;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({kind = 'white', at = 0, life, peak, x = 0.5, y = 0.5, sparks = true, audio = true}) => (
  <>
    <FlashFx kind={kind} at={at} life={life} peak={peak} x={x} y={y} sparks={sparks} />
    {audio && kind === 'white' && <Sfx at={at} src={mcSound('random/explode3')} volume={0.28} rate={1.6} cut={20} />}
    {audio && kind === 'gold' && <Sfx at={at} src={mcSound('random/levelup')} volume={0.4} />}
    {audio && kind === 'red' && <Sfx at={at} src={mcSound('random/anvil_land')} volume={0.45} rate={0.9} />}
  </>
);

/** 受伤红边：受击瞬间红边脉冲、血丝从边缘生长并抖动；血量见底后红边持续呼吸。透明层，默认 150 帧。 */
export const AtmHurt: FC<{
  /** 受击列表 [{at 帧, power 0..1}]，默认 [{at:10,power:1},{at:56,power:0.75}] */
  hits?: {at: number; power?: number}[];
  /** 低血量呼吸开始的帧，默认 92；传 null 则没有低血量呼吸 */
  lowFrom?: number | null;
  /** 低血量呼吸频率（次/分钟），默认 46 */
  lowBpm?: number;
  /** 低血量红边强度 0..1，默认 0.8 */
  low?: number;
  /** 血丝根数，默认 34 */
  veins?: number;
  /** 总帧数，只用来决定心跳声铺到哪里，默认 150 */
  frames?: number;
  /** 是否带受击音和心跳低频音，默认 true */
  audio?: boolean;
}> = ({hits = [{at: 10, power: 1}, {at: 56, power: 0.75}], lowFrom = 92, lowBpm = 46, low = 0.8, veins = 34, frames = 150, audio = true}) => {
  const beats: number[] = [];
  if (lowFrom !== null) for (let t = lowFrom; t < frames; t += Math.round(1800 / lowBpm)) beats.push(t);
  return (
    <>
      <Hurt hits={hits} lowFrom={lowFrom ?? 1e9} lowBpm={lowBpm} low={low} veins={veins} />
      {audio && hits.map((h, i) => <Sfx key={`h${i}`} at={h.at} src={mcSound('dig/stone3')} volume={0.6 * (h.power ?? 1)} rate={0.7 - i * 0.03} />)}
      {audio && beats.map((t) => <Sfx key={`b${t}`} at={t} src={mcSound('dig/stone1')} volume={0.35} rate={0.45} cut={12} />)}
    </>
  );
};

/* ------------------------------------------------------------------ lens / film */

/** 镜头光斑：太阳从画面一侧滑向另一侧，沿光轴拖出方块感光斑、十字星芒、横向拉丝与暖色眩光。透明层，默认 150 帧。 */
export const AtmLensFlare: FC<{
  /** 太阳路径起点 {x, y}（px），默认 {x:-140, y:70} */
  from?: {x: number; y: number};
  /** 太阳路径终点 {x, y}（px），默认 {x:2060, y:360} */
  to?: {x: number; y: number};
  /** 开始滑动的帧，默认 6 */
  start?: number;
  /** 滑动所用帧数，默认 136 */
  dur?: number;
  /** 整体强度 0..1，默认 1 */
  strength?: number;
  /** 总帧数（决定结尾淡出的位置），默认 150 */
  frames?: number;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({from, to, start = 6, dur = 136, strength = 1, frames = 150, audio = true}) => (
  <>
    <LensFlare from={from} to={to} start={start} dur={dur} strength={strength} frames={frames} />
  </>
);

/**
 * 复古胶片：颗粒、扫描线与滚动亮带、暖褐暗角、红青边缘色散、漏光、灰尘划痕、闪烁。默认是透明叠加层；
 * 若传入 children，则先用 AtmRetroFilmWrap 处理素材（真正的 RGB 色散、画面抖动、暖调），再叠加胶片层。
 */
export const AtmRetroFilm: FC<{
  /** 颗粒强度 0..1，默认 1 */
  grain?: number;
  /** 扫描线强度 0..1，默认 1 */
  scan?: number;
  /** 暖褐边缘暗角强度 0..1，默认 1 */
  vignette?: number;
  /** 漏光强度 0..1，默认 1 */
  leaks?: number;
  /** 灰尘 / 毛发 / 划痕强度 0..1，默认 1 */
  dirt?: number;
  /** 闪烁强度 0..1，默认 1 */
  flicker?: number;
  /** 两次漏光的中心帧 [a, b]，默认 [44, 112] */
  leakAt?: [number, number];
  /** 仅在传入 children 时有效：色散 + 抖动 + 暖调的强度，默认 1 */
  amount?: number;
  /** 可选：要加胶片效果的素材；不传则只是透明叠加层 */
  children?: ReactNode;
}> = ({grain, scan, vignette, leaks, dirt, flicker, leakAt, amount = 1, children}) => (
  <>
    {children !== undefined && children !== null && <RetroFilmWrap amount={amount}>{children}</RetroFilmWrap>}
    <RetroFilm grain={grain} scan={scan} vignette={vignette} leaks={leaks} dirt={dirt} flicker={flicker} leakAt={leakAt} />
  </>
);

/** 复古胶片的包裹部分（包裹素材型）：画面抖动（12fps 阶梯）、轻微 RGB 色散、柔化、暖调与闪烁。可与透明的 AtmRetroFilm 叠加层配合。 */
export const AtmRetroFilmWrap: FC<{
  /** 效果强度，0 = 无，默认 1 */
  amount?: number;
  /** 要处理的素材 */
  children: ReactNode;
}> = ({amount = 1, children}) => <RetroFilmWrap amount={amount}>{children}</RetroFilmWrap>;

/** 速度线：漫画式放射速度线，冲入→保持（轻微闪动）→冲出，每两帧重绘产生“沸腾”感，边缘带白色爆光。透明层，默认约 140 帧。 */
export const AtmSpeedLines: FC<{
  /** 冲入完成时的强度峰值 0..1.2，默认 1 */
  peak?: number;
  /** 开始冲入的帧，默认 6 */
  inAt?: number;
  /** 冲入所用帧数，默认 14 */
  inDur?: number;
  /** 开始冲出的帧，默认 106；传 null 则一直保持不冲出 */
  outAt?: number | null;
  /** 冲出所用帧数，默认 30 */
  outDur?: number;
  /** 放射中心 x（0..1），默认 0.5 */
  cx?: number;
  /** 放射中心 y（0..1），默认 0.5 */
  cy?: number;
  /** 中心空白半径 px，默认 360 */
  inner?: number;
  /** 线条颜色 [r,g,b]，默认 [255,255,255]；深色背景可用 [255,230,120] */
  color?: [number, number, number];
  /** 基础线条数量，默认 92 */
  lines?: number;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({peak = 1, inAt = 6, inDur = 14, outAt = 106, outDur = 30, cx = 0.5, cy = 0.5, inner = 360, color = [255, 255, 255], lines = 92, audio = true}) => {
  const f = useCurrentFrame();
  const inn = smooth(inAt, inAt + inDur, f);
  const out = outAt === null ? 1 : 1 - smooth(outAt, outAt + outDur, f);
  return (
    <>
      <SpeedLines intensity={peak * inn * out * (1 + 0.08 * Math.sin(f * 0.7) * inn)} cx={cx} cy={cy} inner={inner} color={color} lines={lines} />
    </>
  );
};

/* ------------------------------------------------------------------ particles */

/** 方块碎屑：4×4 材质碎块（石头/泥土/苔藓/木板/圆石/沙砾）从上方翻滚落下，三层景深，顶部与四角弥漫尘土。透明层，可持续循环。 */
export const AtmBlockDebris: FC<{
  /** 碎块密度 0..1.3，默认 1 */
  density?: number;
  /** 横向风速（px/帧），默认 1.2 */
  wind?: number;
  /** 尘土浓度 0..1，默认 1 */
  dust?: number;
  /** 方块贴图 id 数组（public/mc/textures/block/ 下的文件名，不含 .png），默认石/土/苔/橡木板/圆石/沙砾 */
  textures?: string[];
  /** 开始下落的帧，默认 0 */
  start?: number;
  /** 预热帧数，让第 0 帧就有碎块在空中，默认 30 */
  prewarm?: number;
  /** 是否带音效，默认 true */
  audio?: boolean;
}> = ({density, wind, dust, textures, start = 0, prewarm, audio = true}) => (
  <>
    <BlockDebris density={density} wind={wind} dust={dust} textures={textures} start={start} prewarm={prewarm} />
    {audio && (
      <>
        <Sfx at={start} src={mcSound('dig/gravel1')} volume={0.4} rate={0.8} />
        <Sfx at={start + 14} src={mcSound('dig/stone2')} volume={0.3} rate={0.9} />
        <Sfx at={start + 38} src={mcSound('dig/stone4')} volume={0.25} rate={1.1} />
        <Sfx at={start + 70} src={mcSound('dig/gravel1')} volume={0.25} rate={1.0} />
      </>
    )}
  </>
);

/** 经验球：满屏绿色经验球冒出、漂浮闪烁，随后沿弧线涌向目标点，每颗到达溅出火花，最后一颗触发升级星爆。透明层，约 120 帧（取决于 gather）。 */
export const AtmXpOrbs: FC<{
  /** 经验球数量，默认 44 */
  count?: number;
  /** 开始飞向目标的帧，默认 56 */
  gather?: number;
  /** 汇聚目标 x（px），默认 960（经验条中心） */
  tx?: number;
  /** 汇聚目标 y（px），默认 914（经验条位置） */
  ty?: number;
  /** 随机种子，换一种分布，默认 3 */
  seed?: number;
  /** 是否带音效（拾取音 + 升级音），默认 true */
  audio?: boolean;
}> = ({count = 44, gather = 56, tx = 960, ty = 914, seed = 3, audio = true}) => {
  const last = useMemo(() => {
    let m = 0;
    for (let i = 0; i < count; i++) {
      const hx = lerp(80, 1920 - 80, hash(i, seed, 1));
      const hy = lerp(120, 1080 - 220, hash(i, seed, 2));
      const depart = gather + Math.floor(hash(i, seed, 5) * 34 + (Math.hypot(hx - tx, hy - ty) / 2400) * 20);
      m = Math.max(m, depart + 22 + Math.floor(hash(i, seed, 6) * 14));
    }
    return m;
  }, [count, gather, tx, ty, seed]);
  return (
    <>
      <XpOrbs count={count} gather={gather} tx={tx} ty={ty} seed={seed} />
      {audio && Array.from({length: 7}, (_, i) => <Sfx key={i} at={gather + 18 + i * 5} src={mcSound('random/orb')} volume={0.28} rate={0.9 + i * 0.07} cut={14} />)}
      {audio && <Sfx at={last + 2} src={mcSound('random/levelup')} volume={0.5} />}
    </>
  );
};

/** 萤火虫 / 余烬：黄绿萤火虫三层景深漂浮闪烁；或橙红火星由白黄冷却到暗红向上飘（底部带暖光）。可设置某一帧从萤火虫交叉渐变成余烬。透明层，可持续循环。 */
export const AtmFireflies: FC<{
  /** 萤火虫数量 0..1，默认 1 */
  fireflies?: number;
  /** 火星余烬数量 0..1，默认 0 */
  embers?: number;
  /** 随机分布种子，默认 2 */
  seed?: number;
  /** 从这一帧起交叉渐变成余烬（萤火虫渐隐、余烬渐显）；省略则不切换。画廊演示用 78 */
  switchAt?: number;
  /** 交叉渐变所用帧数，默认 30 */
  switchDur?: number;
  /** 是否带音效（余烬出现时的篝火噼啪声），默认 true */
  audio?: boolean;
}> = ({fireflies = 1, embers = 0, seed = 2, switchAt, switchDur = 30, audio = true}) => {
  const f = useCurrentFrame();
  const m = switchAt === undefined ? 0 : smooth(switchAt, switchAt + switchDur, f);
  const crackleAt = switchAt !== undefined ? switchAt + 6 : embers > 0 ? 0 : undefined;
  return (
    <>
      <Fireflies fireflies={fireflies * (1 - m)} embers={lerp(embers, 1, m)} seed={seed} />
      {audio && crackleAt !== undefined && <Sfx at={crackleAt} src={mcSound('block/furnace/fire_crackle1')} volume={0.4} />}
    </>
  );
};

/* ------------------------------------------------------------------ weather */

/** 雨：三层斜雨 + 落地的水线与水花 + 冷色暗化 + 低雾。透明层，可持续循环（无音效）。 */
export const AtmRain: FC<{
  /** 雨量密度 0..1.4，默认 1 */
  intensity?: number;
  /** 斜度（度，正数向右下），默认 14 */
  wind?: number;
  /** 地面带起点 y（px），决定落地水花出现的范围，默认 720 */
  groundY?: number;
  /** 低雾浓度 0..1，默认 1 */
  fog?: number;
  /** 冷色暗化程度 0..1，默认 1 */
  dim?: number;
  /** 额外提亮 0..1（雷暴闪光时用），默认 0 */
  lit?: number;
  /** 淡入帧数，0 = 第 0 帧就下满，默认 22 */
  fade?: number;
  /** 随机种子，默认 0 */
  seed?: number;
}> = (p) => <RainFx {...p} />;

/** 雪：三层飘落（像素点 / 十字雪花 / 虚化大雪团）、阵风摆动、落地雪粒淡出，底边慢慢堆起像素雪层。透明层，可持续循环（无音效）。 */
export const AtmSnow: FC<{
  /** 雪量密度 0..1.4，默认 1 */
  intensity?: number;
  /** 风速（px/帧，负数向左），默认 1.6 */
  wind?: number;
  /** 落地雪粒出现的区域起点 y（px），默认 800 */
  groundY?: number;
  /** 底边积雪最终高度 0..1，0 关闭，默认 0.85 */
  pile?: number;
  /** 雾气浓度 0..1，默认 1 */
  fog?: number;
  /** 淡入帧数，默认 20 */
  fade?: number;
  /** 积雪长到最终高度所用的总帧数，默认 150 */
  frames?: number;
}> = (p) => <SnowFx {...p} />;

/** 雷暴：暴雨中天色先压暗，随后分叉像素闪电劈下，全屏闪白、云层与雨线被照亮、落点溅电火花，雷声稍后滚到。透明层，默认 150 帧。 */
export const AtmThunder: FC<{
  /** 落雷列表 [{at 帧, x0 顶端 x, x1/y1 落点, seed 闪电形状, power 0..1}]，默认两道 */
  strikes?: AtmStrike[];
  /** 背景雨量密度，默认 1.1 */
  intensity?: number;
  /** 是否带雷声，默认 true */
  audio?: boolean;
}> = ({strikes, intensity, audio = true}) => <Thunder strikes={strikes} intensity={intensity} sound={audio} />;

/** 昼夜切换：随时钟变化的调色层（全屏色调、天顶色偏、地平线霞光），太阳和月亮沿弧线划过，夜里星星闪烁并有流星；右上角有时钟读数。透明层，默认 180 帧。 */
export const AtmDayNight: FC<{
  /** 起始小时（0..24），默认 4.6 */
  from?: number;
  /** 结束小时（0..24），默认 21.8 */
  to?: number;
  /** 时钟开始走的帧，默认 4 */
  start?: number;
  /** 时钟走完所用帧数，默认 168 */
  dur?: number;
  /** 是否绘制太阳、月亮、星星，默认 true */
  showBodies?: boolean;
  /** 固定时刻（0..24），给了就忽略 from/to，用于静态调色 */
  hour?: number;
  /** 是否显示右上角的时钟读数，默认 true */
  clock?: boolean;
  /** 流星出现的帧，默认 118；传 null 则无流星（需要是夜晚才可见） */
  shootingStarAt?: number | null;
}> = (p) => <DayNight {...p} />;
