// Library exports for the mcdLayers group (see src/lib/README.md for the contract).
//
//   McdL*  atmosphere / grading layers (from gallery/fx/mcd3). They are drawn on a TRANSPARENT canvas but are only correct in ONE blend
//          mode (grade maps = multiply, light/fog/particles = screen, hurt vignette = normal). Every McdL component therefore takes
//          `blend` + `opacity` (default = the recommended mode, see each doc) and applies them with CSS `mix-blend-mode` on its own layer.
//          Put the layer in the SAME stacking context as your footage, directly above it (a sibling, not inside a transformed wrapper):
//            <AbsoluteFill><Footage /><McdLGradeNether /><McdLGradeNetherGlow /></AbsoluteFill>
//          Pass blend="normal" if you export the layer yourself and blend it in an editor.
//   McdV*  adventure / modpack video widgets (from gallery/fx/mcd5). Fully prop-driven, transparent by default, `audio` switch.
//   McdKit the Minecraft-Dungeons style UI kit (gallery/fx/mcdkit/kit) as a namespace.
//
// Time: layers loop exactly every `loop` frames (their motion is built from integer cycles), so a <Sequence> longer than `loop` repeats
// seamlessly. Local frame 0 = first frame of the <Sequence>.
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {GradeMap, type GradeBiome} from '../gallery/fx/mcd3/grade';
import {BloomFog, type FogToneId} from '../gallery/fx/mcd3/glow';
import {DustMotes, GodRays, HurtVignette, TiltHaze, TiltShift} from '../gallery/fx/mcd3/light';
import {DEFAULT_BEAMS, DEFAULT_STRIKES, DEFAULT_TORCHES, Embers, LightningStorm, LootBeams, SoulsDrift, TorchGlow, type BeamSpec, type Strike, type TorchKind, type TorchSpec} from '../gallery/fx/mcd3/fx';
import {CompareCard, type Side} from '../gallery/fx/mcd5/compareCard';
import {DayCounter} from '../gallery/fx/mcd5/dayCounter';
import {EpisodeList, type EpisodeItem} from '../gallery/fx/mcd5/episodeList';
import {LikeChest} from '../gallery/fx/mcd5/likeChest';
import {MobCard, type MobId, type StatDef} from '../gallery/fx/mcd5/mobCard';
import {ModpackBrief} from '../gallery/fx/mcd5/modpackBrief';
import {Objectives, type Objective} from '../gallery/fx/mcd5/objectives';
import {PlayerJoin, type JoinEvent, type Present} from '../gallery/fx/mcd5/playerJoin';
import {StatsTally} from '../gallery/fx/mcd5/statsTally';
import {ToastStack} from '../gallery/fx/mcd5/toast';
import {WaypointMark, type BeamKind, type IconKey, type Waypoint} from '../gallery/fx/mcd5/waypoint';
import {GildedForge, type GildedEnchantSpec, type GildedStatSpec, type McdVGildedForgeProps} from '../gallery/fx/mcd5/gildedForge';
import type {BiomeId} from '../gallery/fx/mcd5/common';
import * as McdKitNs from '../gallery/fx/mcdkit/kit';

export {McdKitNs as McdKit};

// ====================================================================================================================
// McdL: shared pieces

/** CSS mix-blend-mode. 'multiply' for grade maps, 'screen' for light / fog / particles, 'normal' for the hurt vignette. */
export type McdLBlend = CSSProperties['mixBlendMode'];

/** Props every McdL layer shares. */
export type McdLBaseProps = {
  /** 循环周期（帧）：效果每 loop 帧精确循环一次，片段比它长就无缝重复。默认值见各组件 */
  loop?: number;
  /** CSS 混合模式；默认是该层的推荐模式。导出透明层到剪辑软件自己混合时传 'normal' */
  blend?: McdLBlend;
  /** 整层不透明度 0–1，默认是该层的推荐值 */
  opacity?: number;
};

const Layer: FC<{blend: McdLBlend; opacity: number; children: ReactNode}> = ({blend, opacity, children}) => (
  <AbsoluteFill style={{mixBlendMode: blend, opacity, pointerEvents: 'none'}}>{children}</AbsoluteFill>
);

/** One extra pool of light carved into a grade map (screen coordinates are 0–1 of the frame). */
export type McdLGradeLight = {
  /** 光源中心 x，0–1（占画面宽度） */
  x: number;
  /** 光源中心 y，0–1（占画面高度） */
  y: number;
  /** 半径，占画面宽度的比例（0.2 约为 384px） */
  r: number;
  /** 光色，默认 #fff0d0 */
  color?: string;
  /** 亮度 0–1，默认 0.9 */
  a?: number;
};

/** One light source for bloom + fog (screen coordinates 0–1). */
export type McdLBloomLight = {
  /** 光源 x，0–1 */
  x: number;
  /** 光源 y，0–1（可为负数 = 屏外） */
  y: number;
  /** 光色，默认取当前 tone 的主光色 */
  color?: string;
  /** 大小倍率，默认 1 */
  size?: number;
  /** 亮度，默认取 tone 的主光强度 */
  a?: number;
};

// ====================================================================================================================
// grade maps (multiply) + bloom/fog partners (screen)

export type McdLGradeProps = McdLBaseProps & {
  /** 整张光影图向中性白淡出的强度 0–1，1 = 完整调色（默认 1） */
  intensity?: number;
  /** 中心亮区（光照最集中处）位置 [x, y]，0–1；默认按群系预设，居中偏下 */
  coreAt?: [number, number];
  /** 额外亮区（灯笼/火把/熔岩照亮的地方），0–1 屏幕坐标；默认没有，对准你素材里的光源 */
  lights?: McdLGradeLight[];
};

const Grade: FC<McdLGradeProps & {biome: GradeBiome}> = ({biome, loop = 210, blend = 'multiply', opacity = 1, intensity = 1, coreAt, lights}) => (
  <Layer blend={blend} opacity={opacity}>
    <GradeMap biome={biome} loop={loop} intensity={intensity} coreAt={coreAt} lights={lights} />
  </Layer>
);

/** 森林夜调色光影图。推荐：multiply 100%（默认），再叠 McdLGradeForestGlow（screen 80%）。 */
export const McdLGradeForest: FC<McdLGradeProps> = (p) => <Grade biome="forest" {...p} />;
/** 下界调色光影图（深红压暗 + 金橙雾色）。推荐：multiply 100%，搭档 McdLGradeNetherGlow。 */
export const McdLGradeNether: FC<McdLGradeProps> = (p) => <Grade biome="nether" {...p} />;
/** 末地调色光影图（深紫暗部、粉白亮区）。推荐：multiply 100%，搭档 McdLGradeEndGlow。 */
export const McdLGradeEnd: FC<McdLGradeProps> = (p) => <Grade biome="end" {...p} />;
/** 雪地调色光影图（冰蓝夜雪）。推荐：multiply 100%，搭档 McdLGradeSnowGlow。 */
export const McdLGradeSnow: FC<McdLGradeProps> = (p) => <Grade biome="snow" {...p} />;
/** 沙漠调色光影图（暖黄尘雾）。推荐：multiply 100%，搭档 McdLGradeDesertGlow。 */
export const McdLGradeDesert: FC<McdLGradeProps> = (p) => <Grade biome="desert" {...p} />;

export type McdLBloomFogProps = McdLBaseProps & {
  /** 雾 / 黑位色调：cool | forest | nether | end | snow | desert。默认 'cool'（Glow 系列默认取各自群系） */
  tone?: FogToneId;
  /** 整体强度倍率，默认 1 */
  strength?: number;
  /** 光源列表（0–1 屏幕坐标），每个光源套紧(1%)和宽(5%)两层泛光；默认只有左上屏外一盏主光，请对准素材里的灯 */
  lights?: McdLBloomLight[];
  /** 不传 lights 时，唯一主光的位置 [x, y]（0–1），默认 [0, -0.14] */
  keyAt?: [number, number];
};

const Bloom: FC<McdLBloomFogProps & {defaultTone: FogToneId; defaultOpacity: number}> = ({defaultTone, defaultOpacity, loop = 210, blend = 'screen', opacity, tone, strength = 1, lights, keyAt}) => (
  <Layer blend={blend} opacity={opacity ?? defaultOpacity}>
    <BloomFog loop={loop} tone={tone ?? defaultTone} strength={strength} lights={lights} keyAt={keyAt} />
  </Layer>
);

/** 森林夜「雾光层」：黑位染青蓝、地面缓雾、屏外主光泛光。推荐：screen 80%（默认），与 McdLGradeForest 叠用。 */
export const McdLGradeForestGlow: FC<McdLBloomFogProps> = (p) => <Bloom defaultTone="forest" defaultOpacity={0.8} {...p} />;
/** 下界「雾光层」。推荐：screen 80%，与 McdLGradeNether 叠用。 */
export const McdLGradeNetherGlow: FC<McdLBloomFogProps> = (p) => <Bloom defaultTone="nether" defaultOpacity={0.8} {...p} />;
/** 末地「雾光层」。推荐：screen 80%，与 McdLGradeEnd 叠用。 */
export const McdLGradeEndGlow: FC<McdLBloomFogProps> = (p) => <Bloom defaultTone="end" defaultOpacity={0.8} {...p} />;
/** 雪地「雾光层」。推荐：screen 80%，与 McdLGradeSnow 叠用。 */
export const McdLGradeSnowGlow: FC<McdLBloomFogProps> = (p) => <Bloom defaultTone="snow" defaultOpacity={0.8} {...p} />;
/** 沙漠「雾光层」。推荐：screen 80%，与 McdLGradeDesert 叠用。 */
export const McdLGradeDesertGlow: FC<McdLBloomFogProps> = (p) => <Bloom defaultTone="desert" defaultOpacity={0.8} {...p} />;
/** 通用泛光 + 体积雾（任意 tone，光源自己指定）。推荐：screen 60–100%（默认 100%）。 */
export const McdLBloomFog: FC<McdLBloomFogProps> = ({loop = 180, ...p}) => <Bloom defaultTone="cool" defaultOpacity={1} loop={loop} {...p} />;

// ====================================================================================================================
// light layers

export type McdLGodRaysProps = McdLBaseProps & {
  /** 强度倍率，默认 1 */
  strength?: number;
  /** 光柱数量，默认 6 */
  n?: number;
  /** 倾斜角度（度），默认 15；负数向另一侧倾斜 */
  angle?: number;
  /** 光柱主色，默认 #e2ae4b */
  color?: string;
  /** 光柱里是否飘方形尘埃，默认 true */
  dust?: boolean;
  /** 水平镜像：true 时光从右上角射入（默认光源在左上角） */
  flip?: boolean;
};

/** 金色斜射光柱缓慢摆动，光柱里浮着方形尘埃。推荐：screen 100%（默认），素材有树荫/窗洞/洞口时最合适。 */
export const McdLGodRays: FC<McdLGodRaysProps> = ({loop = 210, blend = 'screen', opacity = 1, strength, n, angle, color, dust, flip}) => (
  <Layer blend={blend} opacity={opacity}>
    <AbsoluteFill style={flip ? {transform: 'scaleX(-1)'} : undefined}>
      <GodRays loop={loop} strength={strength} n={n} angle={angle} color={color} dust={dust} />
    </AbsoluteFill>
  </Layer>
);

export type McdLDustMotesProps = McdLBaseProps & {
  /** 尘埃主色，默认 #f6d98a */
  color?: string;
  /** 强度倍率，默认 1 */
  strength?: number;
};

/** 空气尘埃光斑：三层景深的方形尘埃 + 前景六边形光斑。推荐：screen 60–100%（默认 100%）。 */
export const McdLDustMotes: FC<McdLDustMotesProps> = ({loop = 210, blend = 'screen', opacity = 1, color, strength}) => (
  <Layer blend={blend} opacity={opacity}>
    <DustMotes loop={loop} color={color} strength={strength} />
  </Layer>
);

export type McdLHurtVignetteProps = McdLBaseProps & {
  /** 危险度 0–1，越大晕影越深，默认 0.85 */
  hp?: number;
  /** 一个循环内的心跳次数，默认 3 */
  beats?: number;
  /** 受击重闪发生的帧；传 null 则没有受击闪。默认 14 */
  hitAt?: number | null;
  /** 晕影主色，默认 #b02636 */
  color?: string;
};

/** 四周猩红径向晕影随心跳（双搏）脉动，开头一次受击重闪。推荐：normal 100%（默认），低血量/受击段落。 */
export const McdLHurtVignette: FC<McdLHurtVignetteProps> = ({loop = 180, blend = 'normal', opacity = 1, hp, beats, hitAt = 14, color}) => (
  <Layer blend={blend} opacity={opacity}>
    <HurtVignette loop={loop} hp={hp} beats={beats} hitAt={hitAt ?? undefined} color={color} />
  </Layer>
);

export type McdLTiltShiftProps = {
  /** 要做移轴的素材（会被包在里面，上下边缘变模糊） */
  children: ReactNode;
  /** 雾化/暗角层的循环周期（帧），默认 180 */
  loop?: number;
  /** 最大模糊像素，默认 7 */
  blur?: number;
  /** 上方模糊带占画面高度比例，默认 0.26 */
  top?: number;
  /** 下方模糊带占画面高度比例，默认 0.24 */
  bottom?: number;
  /** 冷色雾化与暗角强度倍率，默认 1 */
  strength?: number;
};

/** 移轴浅景深：包裹素材（children），上下边缘渐隐模糊 + 冷色雾化 + 轻微暗角。用 backdrop-filter 做真模糊，所以必须包住素材，不是独立叠加层。 */
export const McdLTiltShift: FC<McdLTiltShiftProps> = ({children, loop = 180, blur, top, bottom, strength}) => (
  <TiltShift loop={loop} blur={blur} top={top} bottom={bottom} strength={strength}>
    {children}
  </TiltShift>
);

export type McdLTiltHazeProps = McdLBaseProps & {
  /** 雾化与暗角强度倍率，默认 1 */
  strength?: number;
  /** 雾色，默认 #9fb6c8 */
  color?: string;
};

/** 移轴的「仅叠加层」半边：上下边缘冷色雾化 + 暗角（不含模糊）。推荐：normal 100%。要真模糊请用 McdLTiltShift 包裹素材。 */
export const McdLTiltHaze: FC<McdLTiltHazeProps> = ({loop = 180, blend = 'normal', opacity = 1, strength, color}) => (
  <Layer blend={blend} opacity={opacity}>
    <TiltHaze loop={loop} strength={strength} color={color} />
  </Layer>
);

// ====================================================================================================================
// effect layers

/** One rarity light pillar. Coordinates are PIXELS of a 1920×1080 frame. */
export type McdLBeam = BeamSpec;
export type McdLBeamsProps = McdLBaseProps & {
  /** 光柱列表 [{x, y, kind, at, end, width}]：x/y 为光柱落地点像素坐标(1920×1080)，kind 白/绿/橙/品红，at 冲出帧，end 开始渐隐的帧，width 宽度(默认 92)。默认 4 根只是示例位置，请换成你素材里的点 */
  beams?: McdLBeam[];
  /** 消失渐隐帧数，默认 14 */
  fadeOut?: number;
};

/** 稀有度光柱：白/绿/橙/品红光柱 4 帧冲出，白核硬边，底部光斑，细十字粒子上喷。推荐：screen 100%（默认）。默认 4 根光柱的位置只是示例。 */
export const McdLLootBeams: FC<McdLBeamsProps> = ({loop = 180, blend = 'screen', opacity = 1, beams = DEFAULT_BEAMS, fadeOut}) => (
  <Layer blend={blend} opacity={opacity}>
    <LootBeams loop={loop} beams={beams} fadeOut={fadeOut} />
  </Layer>
);

export type McdLSoulsProps = McdLBaseProps & {
  /** 强度（透明度倍率），默认 1 */
  strength?: number;
};

/** 灵魂飘浮：白色小鬼脸带青蓝拖尾，沿弧线缓慢飘过画面，远近两条通道。推荐：screen 100%（默认），夜景/击败敌人/墓地。 */
export const McdLSoulsDrift: FC<McdLSoulsProps> = ({loop = 240, blend = 'screen', opacity = 1, strength}) => (
  <Layer blend={blend} opacity={opacity}>
    <SoulsDrift loop={loop} strength={strength} />
  </Layer>
);

export type McdLEmbersProps = McdLBaseProps & {
  /** 粒子密度倍率，默认 1.8（Embers 原默认） */
  density?: number;
  /** 横向风，默认 0.22 */
  wind?: number;
};

/** 下界灰烬火星：红橙火星 + 灰红碎屑三层景深上飘。推荐：screen 100%（默认），下界/熔炉/Boss 战。 */
export const McdLEmbers: FC<McdLEmbersProps> = ({loop = 180, blend = 'screen', opacity = 1, density, wind}) => (
  <Layer blend={blend} opacity={opacity}>
    <Embers loop={loop} variant="nether" density={density} wind={wind} />
  </Layer>
);

/** 金色火星（同一套粒子，金色色带，无灰烬）。推荐：screen 100%（默认），标题卡/胜利结算/营地篝火。 */
export const McdLEmbersGold: FC<McdLEmbersProps> = ({loop = 180, blend = 'screen', opacity = 1, density, wind}) => (
  <Layer blend={blend} opacity={opacity}>
    <Embers loop={loop} variant="gold" density={density} wind={wind} />
  </Layer>
);

/** One lightning strike. x / y are 0–1 of the frame. */
export type McdLStrike = Strike;
export type McdLLightningProps = McdLBaseProps & {
  /** 雷击列表 [{frame, x, y, seed, kind}]：frame 为落雷帧(按 loop 循环)，x/y 为 0–1 落点，seed 决定闪电形状，kind 'bolt' 完整闪电 | 'far' 远处地平线泛光。默认 6 次只是示例 */
  strikes?: McdLStrike[];
  /** 全屏泛闪强度倍率，默认 1 */
  flash?: number;
};

/** 夜丛林闪电：阶梯折线闪电、双次泛闪、远处地平线泛光。推荐：screen 100%（默认），夜丛林/暴风雨/Boss 登场。 */
export const McdLLightningStorm: FC<McdLLightningProps> = ({loop = 240, blend = 'screen', opacity = 1, strikes = DEFAULT_STRIKES, flash}) => (
  <Layer blend={blend} opacity={opacity}>
    <LightningStorm loop={loop} strikes={strikes} flash={flash} />
  </Layer>
);

/** One torch / campfire. x / y are PIXELS of a 1920×1080 frame (the flame). */
export type McdLTorch = TorchSpec;
export type McdLTorchKind = TorchKind;
export type McdLTorchGlowProps = McdLBaseProps & {
  /** 火源列表 [{x, y, size, kind}]：x/y 为火焰像素位置(1920×1080)，size 大小倍率，kind torch | camp | soul | lava。默认 5 个只是示例位置，请对准素材里的火把/篝火 */
  torches?: McdLTorch[];
  /** 强度倍率，默认 1 */
  strength?: number;
};

/** 火把/篝火暖光：台阶状方块光斑（菱形光域）+ 柔和暖光 + 白热核心 + 上飘火星，摇曳闪烁。推荐：screen 100%（默认）。默认火把位置只是示例。 */
export const McdLTorchGlow: FC<McdLTorchGlowProps> = ({loop = 180, blend = 'screen', opacity = 1, torches = DEFAULT_TORCHES, strength}) => (
  <Layer blend={blend} opacity={opacity}>
    <TorchGlow loop={loop} torches={torches} strength={strength} />
  </Layer>
);

// ====================================================================================================================
// McdV: adventure / modpack widgets (gallery/fx/mcd5)

/** Biome of the optional preview backdrop. */
export type McdVBiome = BiomeId;

type VBase = {
  /** 画一层预览用的场景底板（仅预览用；真实视频保持 false 以便叠在素材上） */
  bg?: boolean;
  /** 是否带上音效，默认 true */
  audio?: boolean;
};

export type McdVModpackBriefProps = VBase & {
  /** 整合包名（逐字砸下），默认「深渊远征」 */
  name?: string;
  /** 一句话简介 */
  tagline?: string;
  /** 版本号徽章，默认 v2.4.1 */
  version?: string;
  /** 模组数量（会滚动计数），默认 247 */
  mods?: number;
  /** 推荐配置文字 */
  spec?: string;
  /** 游戏版本与加载器 */
  gameVer?: string;
  /** 难度 1–7，难度条选中的节点（I–VII），默认 4 */
  difficulty?: number;
  /** 奖励物品 id 数组（item 贴图名），建议 5–6 个 */
  rewards?: string[];
  /** 头图左上标签，默认「整合包简报」 */
  tag?: string;
  /** 绿色按钮文字，默认「出发」 */
  button?: string;
  /** 头图场景群系，默认 'nether' */
  biome?: McdVBiome;
  /** 小标题「MODS 模组数量」 */
  modsLabel?: string;
  /** 小标题「RECOMMENDED 推荐配置」 */
  specLabel?: string;
  /** 小标题「VERSION 游戏版本」 */
  versionLabel?: string;
  /** 难度条上方小标题，默认「难度 DIFFICULTY」 */
  difficultyLabel?: string;
  /** 难度名称前缀，后接罗马数字，默认「冒险」 */
  levelPrefix?: string;
  /** 难度条下方三行说明（第一行大字）；不传则按 difficulty 自动算出「推荐战力 / 难度倍率 / 预计时长」 */
  facts?: string[];
  /** 奖励栏小标题，默认「奖励 REWARDS」 */
  rewardsLabel?: string;
  /** 头图里红描边的几个怪物，默认 ['creeper','zombie','skeleton'] */
  threatMobs?: MobId[];
};
/** 整合包简报卡：红棕晕光上的斜切暗面板——头图与标签、逐字包名、模组数滚动、I–VII 难度条、奖励槽、「出发」按钮。透明背景，帧数默认 150。 */
export const McdVModpackBrief: FC<McdVModpackBriefProps> = (p) => <ModpackBrief {...p} />;

export type McdVEpisodeItem = EpisodeItem;
export type McdVEpisodeListProps = VBase & {
  /** 标题，默认「本期目录」 */
  title?: string;
  /** 期数标签，默认 EPISODE 07 */
  episode?: string;
  /** 章节数组 [{title, time}]，建议 4–6 项 */
  items?: McdVEpisodeItem[];
  /** 当前章节序号（0 起）：之前的打勾，之后的变暗，默认 2 */
  current?: number;
  /** 右侧菱形里的预览物品 id，默认 netherite_pickaxe */
  preview?: string;
  /** 预览底板群系，默认 'forest-night' */
  biome?: McdVBiome;
  /** 副标题；不传则为「共 N 章」 */
  countText?: string;
  /** 当前章节高亮上的小标签，默认 NOW */
  nowTag?: string;
  /** 右侧预览下方小标题，默认「正在进行」 */
  progressLabel?: string;
};
/** 本期目录：左侧斜切面板里的章节列表，六边形序号沿进度轨道逐项点亮，已完成打勾、当前金色扫光；右侧金框菱形显示当前章节预览。帧数默认 150。 */
export const McdVEpisodeList: FC<McdVEpisodeListProps> = (p) => <EpisodeList {...p} />;

export type McdVObjective = Objective;
export type McdVObjectivesProps = VBase & {
  /** 金色章节/地点行，默认「第三章 · 末地要塞」 */
  chapter?: string;
  /** 目标数组 [{text, appear, done?}]：appear 出现帧、done 打勾帧；appear 最晚的一条视为新增，触发金闪与居中提示 */
  items?: McdVObjective[];
  /** 居中提示的金色小标题，默认「新目标」 */
  announceLabel?: string;
  /** 预览底板群系，默认 'forest-night' */
  biome?: McdVBiome;
};
/** 目标清单：屏幕右上角的任务目标，逐条滑入，完成时打勾划线置灰，新增目标金闪并在上方居中浮出大字。帧数默认 180。 */
export const McdVObjectives: FC<McdVObjectivesProps> = (p) => <Objectives {...p} />;

export type McdVStatsTallyProps = VBase & {
  /** 金色小标题，默认「本期完成」 */
  title?: string;
  /** 白色大标题，默认「深渊远征 · 第七期」 */
  subtitle?: string;
  /** 玩家名，默认「阿远」 */
  player?: string;
  /** 玩家皮肤 id（steve/alex/efe/zuri/kai…），默认 'efe' */
  skin?: string;
  /** 等级徽章，默认 12 */
  level?: number;
  /** 评级 'S' | 'A' | 'B' | 'C'：金/橙/绿/银 菱形与月桂，默认 'S' */
  rank?: 'S' | 'A' | 'B' | 'C';
  /** 四个统计目标值 {deaths, kills, seconds, explore(0–100)}，按顺序滚动 */
  stats?: {deaths: number; kills: number; seconds: number; explore: number};
  /** 预览底板群系，默认 'camp' */
  biome?: McdVBiome;
  /** 四张统计卡标题，顺序：死亡 / 击杀 / 用时 / 探索度 */
  labels?: [string, string, string, string];
  /** 橙色总评条左侧标题，默认「本期总评」 */
  summaryLabel?: string;
  /** 总评条右侧小字；不传为「下一等级 Next Rank: ${level+1}」 */
  nextText?: string;
  /** 总评条填充比例 0–1，默认 0.78 */
  progress?: number;
  /** 绿宝石计数目标值，默认 842 */
  emeralds?: number;
  /** 灵魂计数目标值，默认 36 */
  souls?: number;
};
/** 本期数据结算：金色「本期完成」+标题，四张统计卡滚动计数，评级菱形带白闪砸落，底部总评条与宝箱收尾。默认带黑场淡入，不是纯叠加层；适合片尾（overlayReady:false，建议自己垫底）。帧数默认 190。 */
export const McdVStatsTally: FC<McdVStatsTallyProps> = (p) => <StatsTally {...p} />;

export type McdVMobStat = StatDef;
export type McdVMobCardProps = VBase & {
  /** 生物：'creeper' | 'zombie' | 'husk' | 'skeleton' | 'wither_skeleton' | 'enderman'，决定真实贴图和默认文案，默认 'creeper' */
  mob?: MobId;
  /** 中文名；不传用该生物默认名 */
  name?: string;
  /** 英文小标题 */
  en?: string;
  /** 红色类别标签（如「敌对生物」） */
  kind?: string;
  /** 一句简介 */
  desc?: string;
  /** 三个六边形属性 [{label, value, ratio(0–1 填充高度), color, icon(像素点阵行)}]；不传用该生物默认 */
  stats?: McdVMobStat[];
  /** 弱点物品 id 数组（item 贴图名） */
  weak?: string[];
  /** 是否画顶部 Boss 血条，默认 false */
  boss?: boolean;
  /** 预览底板群系；不传用该生物默认 */
  biome?: McdVBiome;
  /** 弱点栏小标题，默认「弱点 WEAKNESS」 */
  weakLabel?: string;
};
/** 生物/Boss 介绍卡：红描边黑剪影被角括号锁定，真实贴图自脚底向上扫出；右侧卡片有名牌、简介、三个属性六边形与弱点槽。帧数默认 168。 */
export const McdVMobCard: FC<McdVMobCardProps> = (p) => <MobCard {...p} />;

export type McdVCompareSide = Side;
export type McdVCompareProps = VBase & {
  /** A 方 {name, item(物品贴图 id), rarity: 'common'|'rare'|'unique', stats: number[](0–100), tag?} */
  a?: McdVCompareSide;
  /** B 方，结构同 a。stats 长度需与 a、labels 一致（建议 3 行） */
  b?: McdVCompareSide;
  /** 每行属性名，默认 ['攻击','速度','范围'] */
  labels?: string[];
  /** 顶部金色小标题，默认「装备对比」 */
  title?: string;
  /** 'a' | 'b'；不传则按综合分自动判定 */
  winner?: 'a' | 'b';
  /** 综合分前的小标题，默认「综合」 */
  totalLabel?: string;
  /** 胜者金色标签文字，默认「WINNER 胜出」 */
  winnerText?: string;
  /** 中间六边形里的字，默认 VS */
  vsText?: string;
};
/** 对比卡 A 对 B：两块斜切面板夹 VS 六边形，属性条从中线向外逐行增长，胜出行变金，最后综合分滚动、胜者鎏金。帧数默认 180。 */
export const McdVCompare: FC<McdVCompareProps> = (p) => <CompareCard {...p} />;

export type McdVDayCounterProps = VBase & {
  /** 新的天数（自动按位数缩放字号），旧数字为 day-1，默认 42 */
  day?: number;
  /** 六边形里数字上方的小字，默认 DAY */
  label?: string;
  /** 大字幕，默认「太阳又升起来了，继续活下去」 */
  caption?: string;
  /** 下方小数据，默认 3 条 */
  facts?: string[];
  /** 翻牌发生的帧，其余动画跟随它，默认 44 */
  flipAt?: number;
  /** 六边形左侧小牌文字，默认「生存模式」 */
  leftTag?: string;
  /** 六边形右侧小牌文字，默认「困难难度」 */
  rightTag?: string;
};
/** 生存第 N 天：大六边形数字像翻牌一样滚入，外圈由钢灰变金，日出金色斜射光从右上铺开。透明，可叠在日出镜头上。帧数默认 120。 */
export const McdVDayCounter: FC<McdVDayCounterProps> = (p) => <DayCounter {...p} />;

export type McdVJoinEvent = JoinEvent;
export type McdVPresent = Present;
export type McdVPlayerJoinProps = VBase & {
  /** 事件 [{kind:'join'|'leave', name, skin, color(玩家色), at(出现帧), hold(停留帧)}]，按顺序占用上下槽位 */
  events?: McdVJoinEvent[];
  /** 开场已在线的玩家 [{skin, color}]（右上角在线名单用） */
  present?: McdVPresent[];
  /** 在线名单标题，默认「在线」 */
  rosterLabel?: string;
  /** 是否显示右上角在线名单，默认 true */
  roster?: boolean;
  /** 加入提示文案，默认「加入了冒险」 */
  joinText?: string;
  /** 离开提示文案，默认「离开了冒险」 */
  leaveText?: string;
  /** 预览底板群系，默认 'camp' */
  biome?: McdVBiome;
};
/** 玩家加入/离开提示：左上角斜切暗条滑入，皮肤头像六边形、金色「加入了冒险」/红色「离开了冒险」，右上角在线名单同步变化。透明。帧数默认 150。 */
export const McdVPlayerJoin: FC<McdVPlayerJoinProps> = (p) => <PlayerJoin {...p} />;

export type McdVWaypointItem = Waypoint;
export type McdVBeamKind = BeamKind;
export type McdVWaypointIcon = IconKey;
export type McdVWaypointProps = VBase & {
  /** 路标 [{x, ground(地面点 y，像素), kind: 'white'|'green'|'orange'|'magenta', name, dist(起始米数，会递减), coords?, icon?: 'base'|'flag'|'portal'|'skull', size?(1 大/0.7 小), delay?}]。x/ground 是 1920×1080 像素坐标，默认 3 个只是示例位置 */
  waypoints?: McdVWaypointItem[];
  /** 预览底板群系，默认 'snow' */
  biome?: McdVBiome;
  /** 结尾淡出帧数（0 为不淡出），默认 12 */
  fadeOutFrames?: number;
  /** 片段总帧数，用来算结尾淡出的起点；请设成 <Sequence> 的 durationInFrames，默认 150 */
  totalFrames?: number;
};
/** 路标/坐标标记：地面竖起光柱 + 六边形底座，光柱中段浮着稀有度菱形图标，上方名牌、下方实时递减的距离与坐标。透明，默认 3 个路标只是示例位置。帧数默认 150。 */
export const McdVWaypoint: FC<McdVWaypointProps> = (p) => <WaypointMark {...p} />;

export type McdVLikeChestProps = VBase & {
  /** 三个节点名，默认 ['点赞','投币','收藏'] */
  labels?: string[];
  /** 顶部标题，默认「三连解锁」 */
  headline?: string;
  /** 物品卡主标题，默认「感谢支持」 */
  thanks?: string;
  /** 物品卡斜体说明 */
  note?: string;
  /** 金框里的物品 id（item 贴图名），默认 nether_star */
  item?: string;
  /** 绿色按钮文字，默认「继续观看」 */
  button?: string;
  /** 物品卡金色标签，默认「特别奖励」 */
  tag?: string;
};
/** 点赞解锁宝箱：三个六边形（点赞/投币/收藏）依次填满，末影宝箱抖动开启，品红光柱 4 帧冲出，随后弹出物品卡。默认不画背景（宝箱与光柱透明）。帧数默认 190。 */
export const McdVLikeChest: FC<McdVLikeChestProps> = (p) => <LikeChest {...p} />;

export type McdVToastProps = VBase & {
  /** 成就条金色标题，默认「成就解锁!」 */
  title?: string;
  /** 成就名，默认「深渊的第一步」 */
  name?: string;
  /** 紫色经验文字，默认「+50 XP」 */
  xp?: string;
  /** 成就条菱形里的物品 id，默认 diamond_pickaxe */
  item?: string;
  /** 提示条紫色标签，默认「提示」 */
  tag?: string;
  /** 提示条前半句，默认「按下」 */
  tip?: string;
  /** 提示条按键帽字母，默认 M */
  keyLabel?: string;
  /** 提示条后半句，默认「打开地图」 */
  tipSuffix?: string;
  /** 跳过提示：前缀「按住」 */
  skipHint?: string;
  /** 跳过提示：按键帽字母，默认 E */
  skipKey?: string;
  /** 跳过提示：文字「跳过」 */
  skipText?: string;
  /** 要显示哪几块：'achievement' 成就条 | 'hint' 提示条 | 'skip' 右下「按住跳过」，默认全部 */
  parts?: ('achievement' | 'hint' | 'skip')[];
  /** 预览底板群系（带过场黑边），默认 'nether' */
  biome?: McdVBiome;
};
/** 成就/提示弹条：右侧斜切暗条滑入（成就、提示），右下角「按住 E 跳过」按键帽被填满后白闪收起。透明。帧数默认 150（固定时间点：成就 8–82、提示 40–118、跳过 30–132）。 */
export const McdVToast: FC<McdVToastProps> = (p) => <ToastStack {...p} />;

export type {GildedEnchantSpec as McdVGildedEnchantSpec, GildedStatSpec as McdVGildedStatSpec, McdVGildedForgeProps};
/** 远古锻台 · 镀金神兵觉醒：三枚催化圣物共鸣注入真实 3D 铁砧，第 48 帧重击触发像素十字冲击波与双色光柱，16 层 3D 体素武器旋转升起；右侧斜切面板展开 UNIQUE + GILDED 双标签、逐字标题、内置镀金词条、三属性条与三枚附魔菱形连环觉醒，左下角色卡（云诺羲Rinorsi）同步换装。默认不画场景底板（透明叠加），帧数默认 180。 */
export const McdVGildedForge: FC<McdVGildedForgeProps> = (p) => <GildedForge {...p} />;
