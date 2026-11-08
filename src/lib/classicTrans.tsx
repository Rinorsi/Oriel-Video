// Library exports for the classicTrans group (see src/lib/README.md for the contract).
// Old-style TransitionDefs (reel / cute / trans2) normalised to LibTransition via fromDef, plus the dim "jump" transitions.
import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TRANSITIONS} from '../reel/transitions';
import {animalDashDef} from '../gallery/fx/cute/animalDash';
import {blockRainDef} from '../gallery/fx/cute/blockRain';
import {bubblePopDef} from '../gallery/fx/cute/bubblePop';
import {chestPopDef} from '../gallery/fx/cute/chestPop';
import {cloudPushDef} from '../gallery/fx/cute/cloudPush';
import {creeperRushDef} from '../gallery/fx/cute/creeperRush';
import {diceFlipDef} from '../gallery/fx/cute/diceFlip';
import {foodFrameDef} from '../gallery/fx/cute/foodFrame';
import {heartIrisDef} from '../gallery/fx/cute/heartIris';
import {heartWaveDef} from '../gallery/fx/cute/heartWave';
import {itemWheelDef} from '../gallery/fx/cute/itemWheel';
import {polaroidDef} from '../gallery/fx/cute/polaroid';
import {rainbowSweepDef} from '../gallery/fx/cute/rainbowSweep';
import {ribbonCurtainDef} from '../gallery/fx/cute/ribbonCurtain';
import {slimeSplatDef} from '../gallery/fx/cute/slimeSplat';
import {starFlipDef} from '../gallery/fx/cute/starFlip';
import {BookFlip, CUES as BOOK_FLIP_CUES, T as BOOK_FLIP_FRAMES} from '../gallery/fx/trans2/bookFlip';
import {chestOpenDef} from '../gallery/fx/trans2/chestOpen';
import {creeperHissDef} from '../gallery/fx/trans2/creeperHiss';
import {enchantVeilDef} from '../gallery/fx/trans2/enchantVeil';
import {endPortalDef} from '../gallery/fx/trans2/endPortal';
import {endermanStareDef} from '../gallery/fx/trans2/endermanStare';
import {lavaRiseDef} from '../gallery/fx/trans2/lavaRise';
import {pickaxeBreakDef} from '../gallery/fx/trans2/pickaxeBreak';
import {textFloodDef} from '../gallery/fx/trans2/textFlood';
import {villagerHmmDef} from '../gallery/fx/trans2/villagerHmm';
import {ChapterOverlay, chapterDef, type ChapterOpts} from '../gallery/fx/dim/chapter';
import {Countdown, START as CD_START, BEAT as CD_BEAT, T11, type CountdownProps} from '../gallery/fx/dim/countdown';
import {NetherToEnd, OverToNether, SWAP1, T1, T2, T3, TEAR, ToOverworld, type DimCrossProps} from '../gallery/fx/dim/cross';
import {NextEpisode, PipExpand, T8, T9, type NextEpisodeProps, type PipExpandProps} from '../gallery/fx/dim/jumpsA';
import {SLAM, SkipCard, T10, type SkipCardProps} from '../gallery/fx/dim/jumpsB';
import {Flashback, IN as FB_IN, Meanwhile, OUT as FB_OUT, T13, T14, type MeanwhileProps} from '../gallery/fx/dim/jumpsC';
import {DimAudio} from '../gallery/fx/dim/kit';
import {BiomeBanner as RawBiomeBanner, LocTitleCard as RawLocTitleCard, T5, T6, type BiomeBannerProps, type LocTitleCardProps} from '../gallery/fx/dim/loc';
import {Pearl, T as PEARL_T, type PearlProps} from '../gallery/fx/dim/pearl';
import {EndPortalActivate, T as END_PORTAL_T, type EndPortalActivateProps} from '../gallery/fx/dim/portal';
import {RESPAWN_CLICK, Respawn, T15, type RespawnProps} from '../gallery/fx/dim/respawn';
import {fromDef} from './transition';
import type {Cue, LibTransition} from './types';

// ---------------------------------------------------------------- reel (src/reel/transitions.tsx)

/** 方块马赛克(cut):方块纹理从中心弹出盖满再反向弹开。 */
export const tMosaic = fromDef(TRANSITIONS.mosaic);
/** 推拉(dual):A 向左推出,B 从右推入。 */
export const tPush = fromDef(TRANSITIONS.push);
/** 缩放穿越(dual):A 放大虚化穿过,B 从小变大落定。 */
export const tZoom = fromDef(TRANSITIONS.zoom);
/** 石砖幕布(cut):两扇石砖幕布合拢再拉开。 */
export const tCurtain = fromDef(TRANSITIONS.curtain);
/** 加载界面(cut):复刻游戏加载屏。 */
export const tLoading = fromDef(TRANSITIONS.loading);
/** TNT 爆破(dual):抖动升温、闪白爆炸后换成 B。 */
export const tTnt = fromDef(TRANSITIONS.tnt);
/** 下界传送门(cut):紫色像素漩涡吞没画面再收缩。 */
export const tPortal = fromDef(TRANSITIONS.portal);
/** 方块纹理扫落(cut):十二列方块纹理依次落满再扫出。 */
export const tSweep = fromDef(TRANSITIONS.sweep);
/** 末影错位(dual):横条错位 + 紫青故障条。 */
export const tGlitch = fromDef(TRANSITIONS.glitch);

// ---------------------------------------------------------------- cute (src/gallery/fx/cute)

export const cuteCreeperRush = fromDef(creeperRushDef);
export const cuteBlockRain = fromDef(blockRainDef);
export const cuteCloudPush = fromDef(cloudPushDef);
export const cuteSlimeSplat = fromDef(slimeSplatDef);
export const cuteHeartWave = fromDef(heartWaveDef);
export const cutePolaroid = fromDef(polaroidDef);
export const cuteStarFlip = fromDef(starFlipDef);
export const cuteChestPop = fromDef(chestPopDef);
export const cuteItemWheel = fromDef(itemWheelDef);
export const cuteAnimalDash = fromDef(animalDashDef);
export const cuteFoodFrame = fromDef(foodFrameDef);
export const cuteRainbowSweep = fromDef(rainbowSweepDef);
export const cuteBubblePop = fromDef(bubblePopDef);
export const cuteRibbonCurtain = fromDef(ribbonCurtainDef);
export const cuteDiceFlip = fromDef(diceFlipDef);
export const cuteHeartIris = fromDef(heartIrisDef);

// ---------------------------------------------------------------- trans2 (src/gallery/fx/trans2)

export const t2EndPortal = fromDef(endPortalDef);
export const t2EnchantVeil = fromDef(enchantVeilDef);
export const t2LavaRise = fromDef(lavaRiseDef);
export const t2ChestOpen = fromDef(chestOpenDef);
export const t2VillagerHmm = fromDef(villagerHmmDef);
export const t2EndermanStare = fromDef(endermanStareDef);
export const t2CreeperHiss = fromDef(creeperHissDef);
export const t2PickaxeBreak = fromDef(pickaxeBreakDef);
export const t2TextFlood = fromDef(textFloodDef);

/** 像素翻页(dual):书页被切成 40 条竖条做透视卷页,翻开 A 再翻过羊皮纸页露出 B。BookFlip 自带 A/B 副本,所以不走 fromDef。 */
export const t2BookFlip: LibTransition = {
  id: 't2-book-flip',
  name: '像素翻页',
  frames: BOOK_FLIP_FRAMES,
  bStart: 0,
  Scene: ({p, A, B}) => <BookFlip A={A} B={B} p={p} />,
  cues: BOOK_FLIP_CUES,
};


// ---------------------------------------------------------------- dim: jumps (src/gallery/fx/dim)
// The jump effects draw their own sounds inside the component (DimSfx). Inside a LibTransition we mute those
// (DimAudio=false) and list the same sounds in `cues`, so TransitionSeries' `audio` flag controls them like every other transition.

const Mute: FC<{children: ReactNode}> = ({children}) => <DimAudio.Provider value={false}>{children}</DimAudio.Provider>;

/** Sounds of the DimTitle card (dim/titles.tsx) for a title starting at frame `at` with `n` characters. */
const titleCues = (at: number, n: number): Cue[] => {
  const landings = Array.from({length: Math.max(1, n)}, (_, i) => at + 6 + i * 5 + 7);
  const last = landings[landings.length - 1];
  return [
    ...landings.map((l, i) => ({at: l, src: `mc:dig/stone${(i % 4) + 1}`, volume: 0.55, rate: 0.8})),
    {at: last, src: 'mc:random/anvil_land', volume: 0.32, rate: 0.9},
    {at: last + 4, src: 'mc:random/pop', volume: 0.3},
    {at: last + 8, src: 'mc:ui/toast/challenge_complete', volume: 0.28},
  ];
};

const len = (s: string) => [...s].length;

// ---- jump-chapter (cut; ChapterOverlay is the whole effect and is transparent)

/** 章节跳转(cut):六条斜切色带铺满屏幕,章节卡砸下,色带跑出露出 B。可改章节号、标题、副标题、物品、进度点。 */
export const makeJumpChapter = (opts: ChapterOpts = {}): LibTransition => fromDef({...chapterDef, overlay: ({p}) => <ChapterOverlay p={p} {...opts} />});
export const jumpChapter = makeJumpChapter();

// ---- jump-next-episode (dual: A shrinks into a corner, B grows out of the preview board)

const NEXT_EPISODE_CUES: Cue[] = [
  {at: 36, src: 'mc:ui/toast/in', volume: 0.4},
  {at: 44, src: 'mc:random/pop', volume: 0.3, rate: 1.2},
  ...[0, 1, 2, 3, 4].map((i) => ({at: 96 + i * 12, src: 'mc:random/click', volume: 0.18, rate: 1 + i * 0.06})),
  {at: 160, src: 'mc:random/click', volume: 0.5, rate: 0.9},
];

/** 下集预告(dual):A 缩进右下角小窗,紫色舞台展开「下集预告」,光标点击后 B(预览图)撑满全屏。所有文字可改。 */
export const makeJumpNextEpisode = (props: Omit<NextEpisodeProps, 'A' | 'B'> = {}): LibTransition => ({
  id: 'jump-next-episode',
  name: '下集预告',
  frames: T8,
  bStart: 30,
  Scene: ({A, B}) => (
    <Mute>
      <NextEpisode {...props} A={A} B={B} />
    </Mute>
  ),
  cues: NEXT_EPISODE_CUES,
});
export const jumpNextEpisode = makeJumpNextEpisode();

// ---- jump-pip-expand (dual)

const PIP_EXPAND_CUES: Cue[] = [
  {at: 2, src: 'mc:ui/toast/in', volume: 0.4},
  {at: 50, src: 'mc:random/click', volume: 0.5, rate: 1.1},
  {at: 98, src: 'mc:random/pop', volume: 0.4, rate: 1.1},
];

/** 画中画展开(dual):B 以小窗升起,光标点击后放大到全屏,A 后退压暗,最后以小窗留在右下角。 */
export const makeJumpPipExpand = (props: Omit<PipExpandProps, 'A' | 'B'> = {}): LibTransition => ({
  id: 'jump-pip-expand',
  name: '画中画展开',
  frames: T9,
  bStart: 2,
  Scene: ({A, B}) => (
    <Mute>
      <PipExpand {...props} A={A} B={B} />
    </Mute>
  ),
  cues: PIP_EXPAND_CUES,
});
export const jumpPipExpand = makeJumpPipExpand();

// ---- jump-time-skip (cut at the slam: A plays under the racing clock, B takes over under the big card)

const skipCues = (days: number): Cue[] => [
  {at: 4, src: 'mc:random/pop', volume: 0.45, rate: 1.1},
  ...Array.from({length: days}, (_, i) => ({at: 22 + i * 20, src: 'mc:random/click', volume: 0.28, rate: 1.2 + i * 0.15})),
  {at: SLAM + 4, src: 'mc:random/anvil_land', volume: 0.6, rate: 0.8},
  {at: SLAM + 5, src: 'mc:random/explode2', volume: 0.25, rate: 1.1},
  {at: SLAM + 12, src: 'mc:ui/toast/challenge_complete', volume: 0.25},
];

/** 时间跳转(cut):A 在飞转的时钟/天数计数器下快放,黑边砸下、白闪时切到 B,「三天后」大字落下。文字、天数(≤5)可改。 */
export const makeJumpTimeSkip = (props: Omit<SkipCardProps, 'bg'> = {}): LibTransition => ({
  id: 'jump-time-skip',
  name: '时间跳转（三天后）',
  frames: T10,
  bStart: SLAM + 5,
  Scene: ({f, A, B}) => (
    <AbsoluteFill>
      {f < SLAM + 5 ? <A /> : <B />}
      <Mute>
        <SkipCard {...props} />
      </Mute>
    </AbsoluteFill>
  ),
  Overlay: () => (
    <Mute>
      <SkipCard {...props} />
    </Mute>
  ),
  cues: skipCues(props.days ?? 3),
});
export const jumpTimeSkip = makeJumpTimeSkip();

// ---- jump-countdown (cut at GO: A under the 3-2-1, B starts exactly when GO lands)

const GO_FRAME = CD_START + 3 * CD_BEAT + 5;
const countdownCues = (): Cue[] => [
  ...[0, 1, 2, 3].flatMap((i): Cue[] => {
    const hit = CD_START + i * CD_BEAT + 5;
    return [
      {at: hit, src: 'mc:random/anvil_land', volume: 0.5, rate: 1.1 + i * 0.12},
      {at: hit + 1, src: 'mc:random/click', volume: 0.3, rate: 0.8 + i * 0.2},
    ];
  }),
  {at: GO_FRAME, src: 'mc:random/explode1', volume: 0.45, rate: 0.9},
  {at: GO_FRAME + 4, src: 'mc:random/levelup', volume: 0.5},
  {at: GO_FRAME + 8, src: 'mc:ui/toast/challenge_complete', volume: 0.3},
];

/** 倒计时 3-2-1-GO(cut):A 在倒计时下等待,GO 砸下的瞬间切到 B(从 B 的第 0 帧开始)。提示文字可改。 */
export const makeJumpCountdown = (props: Omit<CountdownProps, 'bg'> = {}): LibTransition => ({
  id: 'jump-countdown',
  name: '倒计时 3-2-1-GO',
  frames: T11,
  bStart: GO_FRAME,
  Scene: ({f, A, B}) => (
    <AbsoluteFill>
      {f < GO_FRAME ? <A /> : <B />}
      <Mute>
        <Countdown {...props} />
      </Mute>
    </AbsoluteFill>
  ),
  Overlay: () => (
    <Mute>
      <Countdown {...props} />
    </Mute>
  ),
  cues: countdownCues(),
});
export const jumpCountdown = makeJumpCountdown();

// ---- jump-meanwhile (A is cut by a slash, B appears in the right half at frame 22 and finally sweeps over)

const MEANWHILE_CUES: Cue[] = [
  {at: 15, src: 'mc:random/explode1', volume: 0.15, rate: 1.8},
  {at: 37, src: 'mc:random/anvil_land', volume: 0.55, rate: 0.85},
];

/** 与此同时(斜切分屏):白色斩线斜劈 A,两半滑开,缎带「与此同时」砸在切口上,B 沿斜线扫过整屏。文字可改。 */
export const makeJumpMeanwhile = (props: Omit<MeanwhileProps, 'A' | 'B'> = {}): LibTransition => ({
  id: 'jump-meanwhile',
  name: '与此同时（斜切分屏）',
  frames: T13,
  bStart: 22,
  Scene: ({A, B}) => (
    <Mute>
      <Meanwhile {...props} A={A} B={B} />
    </Mute>
  ),
  cues: MEANWHILE_CUES,
});
export const jumpMeanwhile = makeJumpMeanwhile();

// ---- jump-flashback (A = present, memory in the middle, B = present again)

const FLASHBACK_CUES: Cue[] = [
  {at: FB_IN, src: 'mc:random/orb', volume: 0.4, rate: 0.6},
  {at: FB_IN + 4, src: 'mc:block/furnace/fire_crackle1', volume: 0.12},
];

/**
 * 回忆闪回(老胶片):A(现在)水波闪白后进入褐色老胶片回忆,再水波闪白回到现实,换成 B(闪回结束后的镜头,从第 0 帧开始)。
 * 回忆画面默认就是 A 自己(给当前镜头套老胶片);传 Memory 可换成另一段素材(它在回忆开始时从第 0 帧播放)。
 * Overlay 是只含胶片罩/暗角/齿孔/颗粒/闪白的透明层,可直接盖在回忆素材上。
 */
export const makeJumpFlashback = (opts: {Memory?: FC} = {}): LibTransition => {
  const M = opts.Memory;
  const MemoryAt: FC | undefined = M
    ? () => (
        <Sequence from={FB_IN + 2} layout="none">
          <M />
        </Sequence>
      )
    : undefined;
  return {
    id: 'jump-flashback',
    name: '回忆闪回（老胶片）',
    frames: T14,
    bStart: FB_OUT + 1,
    Scene: ({A, B}) => (
      <Mute>
        <Flashback bg Present={A} Memory={MemoryAt ?? A} After={B} />
      </Mute>
    ),
    Overlay: () => (
      <Mute>
        <Flashback />
      </Mute>
    ),
    cues: FLASHBACK_CUES,
  };
};
export const jumpFlashback = makeJumpFlashback();

// ---- jump-respawn (A = death, B = spawn point)

const RESPAWN_CUES: Cue[] = [
  {at: 14, src: 'mc:random/explode3', volume: 0.35, rate: 1.2},
  {at: 16, src: 'mc:random/anvil_land', volume: 0.3, rate: 0.7},
  {at: 44, src: 'mc:ui/toast/in', volume: 0.35, rate: 0.6},
  {at: 60, src: 'mc:random/orb', volume: 0.3, rate: 0.7},
  {at: RESPAWN_CLICK - 14, src: 'mc:random/click', volume: 0.2, rate: 1.1},
  {at: RESPAWN_CLICK, src: 'mc:random/click', volume: 0.5, rate: 0.9},
  {at: RESPAWN_CLICK + 8, src: 'mc:random/levelup', volume: 0.4},
];

/** 死亡 → 重生:A 受击变灰倾倒、弹出「你死了！」界面,光标点重生后白光爆开,换成 B(出生点,从第 0 帧开始)。文字、得分可改。 */
export const makeJumpRespawn = (props: Omit<RespawnProps, 'A' | 'B'> = {}): LibTransition => ({
  id: 'jump-respawn',
  name: '死亡 → 重生',
  frames: T15,
  bStart: RESPAWN_CLICK + 8,
  Scene: ({A, B}) => (
    <Mute>
      <Respawn {...props} A={A} B={B} />
    </Mute>
  ),
  cues: RESPAWN_CUES,
});
export const jumpRespawn = makeJumpRespawn();

// ---------------------------------------------------------------- dim: dimension changes

type DimTexts = Pick<DimCrossProps, 'title' | 'sub' | 'desc' | 'chip'>;

/** 主世界 → 下界(cut):镜头推进传送门,紫色像素漩涡吞没,溶解后落在下界(第 84 帧切到 B),红色暗角与「下界」大标题。 */
export const makeDimOverToNether = (texts: DimTexts = {}): LibTransition => ({
  id: 'dim-overworld-to-nether',
  name: '主世界 → 下界',
  frames: T1,
  bStart: SWAP1,
  Scene: ({A, B}) => (
    <Mute>
      <OverToNether {...texts} bg A={A} B={B} />
    </Mute>
  ),
  Overlay: () => (
    <Mute>
      <OverToNether {...texts} />
    </Mute>
  ),
  cues: [
    {at: 38, src: 'mc:ambient/weather/thunder1', volume: 0.22, rate: 0.5},
    {at: SWAP1, src: 'mc:random/explode3', volume: 0.3, rate: 0.7},
    {at: SWAP1 + 8, src: 'mc:block/furnace/fire_crackle1', volume: 0.4},
    {at: SWAP1 + 14, src: 'mc:fire/ignite', volume: 0.3, rate: 0.8},
    ...titleCues(118, len(texts.title ?? '下界')),
  ],
});
export const dimOverToNether = makeDimOverToNether();

/** 下界 → 末地(cut):A 出现白紫裂纹、剧烈震动,被撕成两半飞散,B(末地)从裂口涌出,弹出「末地」标题。Overlay 没有被撕开的两半,只有裂纹/光束/碎片/标题。 */
export const makeDimNetherToEnd = (texts: DimTexts = {}): LibTransition => ({
  id: 'dim-nether-to-end',
  name: '下界 → 末地',
  frames: T2,
  bStart: TEAR - 2,
  Scene: ({A, B}) => (
    <Mute>
      <NetherToEnd {...texts} bg A={A} B={B} />
    </Mute>
  ),
  Overlay: () => (
    <Mute>
      <NetherToEnd {...texts} />
    </Mute>
  ),
  cues: [
    {at: 20, src: 'mc:ambient/weather/thunder1', volume: 0.2, rate: 0.45},
    ...[28, 38, 47, 54].map((a, i) => ({at: a, src: `mc:dig/stone${i + 1}`, volume: 0.35 + i * 0.1, rate: 0.5 + i * 0.12})),
    {at: TEAR - 2, src: 'mc:random/explode2', volume: 0.45, rate: 0.6},
    {at: TEAR + 10, src: 'mc:random/orb', volume: 0.4, rate: 0.6},
    ...titleCues(114, len(texts.title ?? '末地')),
  ],
});
export const dimNetherToEnd = makeDimNetherToEnd();

/** 回到主世界(cut):A 淡成紫色虚空,一道光线像睁眼一样展开(第 14 帧起显示 B),日出,弹出「主世界」标题。 */
export const makeDimToOverworld = (texts: DimTexts = {}): LibTransition => ({
  id: 'dim-to-overworld',
  name: '回到主世界',
  frames: T3,
  bStart: 14,
  Scene: ({A, B}) => (
    <Mute>
      <ToOverworld {...texts} bg A={A} B={B} />
    </Mute>
  ),
  Overlay: () => (
    <Mute>
      <ToOverworld {...texts} />
    </Mute>
  ),
  cues: [
    {at: 14, src: 'mc:random/orb', volume: 0.4, rate: 0.7},
    {at: 44, src: 'mc:random/levelup', volume: 0.28, rate: 0.9},
    {at: 60, src: 'mc:step/grass1', volume: 0.4},
    ...titleCues(108, len(texts.title ?? '主世界')),
  ],
});
export const dimToOverworld = makeDimToOverworld();

// ---------------------------------------------------------------- dim / loc: components (not transitions)

/** 末影珍珠传送:史蒂夫甩出珍珠、被拉成光柱抽走、在落点挤压弹出并受到摔落伤害。默认透明(只有史蒂夫、珍珠与粒子)。 */
export const DimPearlTeleport: FC<PearlProps & {audio?: boolean}> = ({audio = true, ...props}) => (
  <DimAudio.Provider value={audio}>
    <Pearl {...props} />
  </DimAudio.Provider>
);
/** DimPearlTeleport 的默认时长(帧)。 */
export const DIM_PEARL_TELEPORT_FRAMES = PEARL_T;

/** 末地传送门激活:十二只末影之眼依次飞入框架,集齐后光柱冲天、「末地传送门」大标题砸下。默认透明。 */
export const DimEndPortalActivate: FC<EndPortalActivateProps & {audio?: boolean}> = ({audio = true, ...props}) => (
  <DimAudio.Provider value={audio}>
    <EndPortalActivate {...props} />
  </DimAudio.Provider>
);
/** DimEndPortalActivate 的默认时长(帧)。 */
export const DIM_END_PORTAL_ACTIVATE_FRAMES = END_PORTAL_T;

/** 进入新地点标题卡:砖纹装饰条与暗角,标题两半从两侧撞在一起,副标题、图标、指南针和滚动的 X/Y/Z 坐标。默认透明,可叠在任何实拍上。 */
export const LocTitleCard: FC<LocTitleCardProps & {audio?: boolean}> = ({audio = true, ...props}) => (
  <DimAudio.Provider value={audio}>
    <RawLocTitleCard {...props} />
  </DimAudio.Provider>
);
/** LocTitleCard 的默认时长(帧)。 */
export const LOC_TITLE_CARD_FRAMES = T5;

/** 群系横幅(华丽版):亮线展开成带金边和两翼的 Ore 横幅,逐字打出群系名,附气候标签、经验和发现进度,花瓣飘落。默认透明。 */
export const LocBiomeBanner: FC<BiomeBannerProps & {audio?: boolean}> = ({audio = true, ...props}) => (
  <DimAudio.Provider value={audio}>
    <RawBiomeBanner {...props} />
  </DimAudio.Provider>
);
/** LocBiomeBanner 的默认时长(帧)。 */
export const LOC_BIOME_BANNER_FRAMES = T6;
