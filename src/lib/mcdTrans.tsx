// Library exports for the mcdTrans group: the 13 "Minecraft Dungeons" video transitions (gallery ids mcd-t-*) as LibTransition objects,
// plus the mcdscene 3D scene engine (ScenePlate + transparent fx layers). See src/lib/README.md for the contract.
//
//   import {TransitionSeries, mcdBlackCut, makeMcdTitleScramble, ScenePlate} from './lib';
//   <TransitionSeries shots={[{dur: 150, C: ShotA}, {dur: 150, C: ShotB}]} transitions={[mcdBlackCut]} />
//
// Two kinds of transition:
//   cut  = an overlay covers the picture, A is swapped for B behind it (bStart = frame in the body where B first shows, B's local frame 0).
//   dual = A and B are both on screen and move against each other (bStart = 0).
// `Overlay` (when present) is the same effect without any footage, for putting on top of your own shots (see TransitionOverlay in ./transition).
import type {LibTransition} from './types';
import * as mcdFxNs from '../gallery/fx/mcdscene/fx';
import type {MDef} from '../gallery/fx/mcd1/common';
import {blackCutDef} from '../gallery/fx/mcd1/blackCut';
import {makeLoadingDef, type LoadingProps} from '../gallery/fx/mcd1/loadingLabel';
import {portalWhiteoutDef} from '../gallery/fx/mcd1/portalWhiteout';
import {chestBeamDef} from '../gallery/fx/mcd1/chestBeam';
import {makeTitleDef, type TitleProps} from '../gallery/fx/mcd1/titleScramble';
import {godRaysDef} from '../gallery/fx/mcd1/godRays';
import {makeHazeDef} from '../gallery/fx/mcd1/hazePush';
import {isoBlocksDef} from '../gallery/fx/mcd1/isoBlocks';
import {makeMapZoomDef} from '../gallery/fx/mcd1/mapZoom';
import {soulsSweepDef} from '../gallery/fx/mcd1/soulsSweep';
import {lightningFlashDef} from '../gallery/fx/mcd1/lightningFlash';
import {emberCurtainDef} from '../gallery/fx/mcd1/emberCurtain';
import {makeTopDef, type TopProps} from '../gallery/fx/mcd1/topGradient';

/** MDef (mcd1 harness) -> LibTransition. `bStart` = frame of the body at which B appears (cut) or 0 (dual). */
const lib = (id: string, name: string, def: MDef, bStart: number): LibTransition => ({
  id,
  name,
  frames: def.frames,
  bStart,
  Scene: def.Scene,
  Overlay: def.Overlay,
  cues: def.cues,
});

// ------------------------------------------------------------------------------------------------------------ cut-type

/** 地下城·压黑硬切 (cut, 45 帧, bStart 21)：A 推近褪色压成纯黑，硬切到 B，B 从黑里带曝光回升。 */
export const mcdBlackCut: LibTransition = lib('mcd-t-black-cut', '地下城·压黑硬切', blackCutDef, 21);

export type McdLoadingLabelOptions = LoadingProps;
/**
 * 地下城·目的地加载转场工厂 (cut, 99 帧, bStart 85)。
 * 选项：place 地名、caption 小字、difficulty 难度罗马数字、biome 加载实景的 ScenePlate 群系、plateSeed 地形种子。
 * 请在模块顶层调用一次，不要在组件 render 里调用（每次调用都会产生新的组件类型）。
 */
export const makeMcdLoadingLabel = (o: McdLoadingLabelOptions = {}): LibTransition => lib('mcd-t-loading-label', '地下城·目的地加载转场', makeLoadingDef(o), 85);
/** 默认实例：place "苦力怕森林"、caption "正在前往"、difficulty "I"、biome forest-day。 */
export const mcdLoadingLabel: LibTransition = makeMcdLoadingLabel();

/** 地下城·传送门白闪 (cut, 78 帧, bStart 44)：紫色像素涡旋从传送门位置(固定在屏幕 1272,206)涌出，镜头推进，整屏白闪后 B 分 7 级淡出。 */
export const mcdPortalWhiteout: LibTransition = lib('mcd-t-portal-whiteout', '地下城·传送门白闪', portalWhiteoutDef, 44);

/** 地下城·品红光柱冲屏 (cut, 60 帧, bStart 33)：A 虚化压暗，紫宝箱抖动掀盖，品红光柱冲屏转白，B 分 7 级从白里出现。 */
export const mcdChestBeam: LibTransition = lib('mcd-t-chest-beam', '地下城·品红光柱冲屏', chestBeamDef, 33);

export type McdTitleScrambleOptions = TitleProps;
/**
 * 地下城·像素错位拼字标题工厂 (cut, 74 帧, bStart 60)。
 * 选项：title 金色大标题（默认"下一章"），sub 标题下的小字（默认不显示）。请在模块顶层调用。
 */
export const makeMcdTitleScramble = (o: McdTitleScrambleOptions = {}): LibTransition => lib('mcd-t-title-scramble', '地下城·像素错位拼字标题', makeTitleDef(o), 60);
/** 默认实例：title "下一章"，无 sub。 */
export const mcdTitleScramble: LibTransition = makeMcdTitleScramble();

/**
 * 地下城·薄雾推过工厂 (cut, 64 帧, bStart 33)。选项 color：雾色 [r,g,b]，默认冷灰蓝 [176,196,218]。请在模块顶层调用。
 */
export const makeMcdHazePush = (color: [number, number, number] = [176, 196, 218]): LibTransition => lib('mcd-t-haze-push', '地下城·薄雾推过', makeHazeDef(color), 33);
/** 默认实例：冷灰蓝雾。 */
export const mcdHazePush: LibTransition = makeMcdHazePush();

/** 地下城·等距方块升起 (cut, 61 帧, bStart 34)：等距体素方块柱沿对角线升起铺满画面，再从另一对角拆除露出 B。 */
export const mcdIsoBlocks: LibTransition = lib('mcd-t-iso-blocks', '地下城·等距方块升起', isoBlocksDef, 34);

/** 地下城·闪电白闪 (cut, 52 帧, bStart 25)：夜雨里两道阶梯折线闪电，第二道整屏白闪并切到 B，雷鸣跟随。 */
export const mcdLightningFlash: LibTransition = lib('mcd-t-lightning-flash', '地下城·闪电白闪', lightningFlashDef, 25);

/** 地下城·下界灰烬幕 (cut, 66 帧, bStart 33)：灰烬火星体素色块幕从底部升起盖满画面，幕内切到 B，幕继续上升离开。 */
export const mcdEmberCurtain: LibTransition = lib('mcd-t-ember-curtain', '地下城·下界灰烬幕', emberCurtainDef, 33);

export type McdTopGradientOptions = TopProps;
/**
 * 地下城·顶部压暗大字标题工厂 (cut, 72 帧, bStart 44)。
 * 选项：title 金色大标题（默认"章节完成"）、sub 月桂下小字（默认"准备前往下一站"）、count 月桂里的白色像素大字（默认"3"，空串则不显示）。请在模块顶层调用。
 */
export const makeMcdTopGradient = (o: McdTopGradientOptions = {}): LibTransition => lib('mcd-t-top-gradient', '地下城·顶部压暗大字标题', makeTopDef(o), 44);
/** 默认实例：title "章节完成"、sub "准备前往下一站"、count "3"。 */
export const mcdTopGradient: LibTransition = makeMcdTopGradient();

/**
 * 地下城·世界地图推近工厂 (B 从第 66 帧才出现，bStart 66, 100 帧；无透明 Overlay)。
 * 选项：from / to 两个地图节点上的地名（默认"营地"→"苦力怕森林"）。两个节点在沙盘上的位置是固定的。请在模块顶层调用。
 */
export const makeMcdMapZoom = (o: {from?: string; to?: string} = {}): LibTransition => lib('mcd-t-map-zoom', '地下城·世界地图推近', makeMapZoomDef(o), 66);
/** 默认实例："营地" → "苦力怕森林"。 */
export const mcdMapZoom: LibTransition = makeMcdMapZoom();

// ------------------------------------------------------------------------------------------------------------ dual-type

/** 地下城·金色体积光扫过 (dual, 56 帧, bStart 0)：斜 12 度金色光墙从左扫到右，光墙前沿就是 A/B 的分界线。 */
export const mcdGodRays: LibTransition = lib('mcd-t-god-rays', '地下城·金色体积光扫过', godRaysDef, 0);

/** 地下城·灵魂群扫过 (dual, 62 帧, bStart 0)：灵魂群拖着青蓝拖尾沿对角线飞过，台阶状像素波前把 A 换成 B。 */
export const mcdSoulsSweep: LibTransition = lib('mcd-t-souls-sweep', '地下城·灵魂群扫过', soulsSweepDef, 0);

// ------------------------------------------------------------------------------------------------------------ 3D scene engine
// ScenePlate = ready-made full-frame voxel background (use it as a background clip, or as shot A / B of a transition).
// FxLayer + the *Field / LootBeam / ... wrappers = transparent canvas layers you can put over any footage.
export {ScenePlate, SCENES} from '../gallery/fx/mcdscene/scenes';
export {
  SceneCanvas,
  FxLayer,
  LootBeam,
  EmberField,
  FireflyField,
  SnowField,
  SoulStream,
  LightningBolts,
  EmeraldSpin,
  HitSparks,
} from '../gallery/fx/mcdscene/engine';
export type {BiomeId} from '../gallery/fx/mcdscene/scenes';
export type {ScenePlateProps, CameraPreset} from '../gallery/fx/mcdscene/scenes';
export type {SceneSpec, CameraSpec, CameraKey, PostSpec, FxSpec, SceneCanvasProps} from '../gallery/fx/mcdscene/engine';
/** 底层特效图元（beam / embers / fireflies / snowfall / souls / lightning / hitSparks / spinItem / godRays / fogBand ...），配合 <FxLayer draw={(ctx, v) => mcdFx.beam(ctx, v, {...})} /> 自定义叠加层。 */
export const mcdFx = mcdFxNs;
