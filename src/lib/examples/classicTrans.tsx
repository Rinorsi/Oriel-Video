import type {FC} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {PlateA, PlateB} from '../../gallery/plates';
import {TransitionSeries} from '../transition';
import {DIM_END_PORTAL_ACTIVATE_FRAMES, DIM_PEARL_TELEPORT_FRAMES, DimEndPortalActivate, DimPearlTeleport, LOC_BIOME_BANNER_FRAMES, LOC_TITLE_CARD_FRAMES, LocBiomeBanner, LocTitleCard, cuteAnimalDash, cuteBlockRain, cuteBubblePop, cuteChestPop, cuteCloudPush, cuteCreeperRush, cuteDiceFlip, cuteFoodFrame, cuteHeartIris, cuteHeartWave, cuteItemWheel, cutePolaroid, cuteRainbowSweep, cuteRibbonCurtain, cuteSlimeSplat, cuteStarFlip, makeDimNetherToEnd, makeDimOverToNether, makeDimToOverworld, makeJumpChapter, makeJumpCountdown, makeJumpFlashback, makeJumpMeanwhile, makeJumpNextEpisode, makeJumpPipExpand, makeJumpRespawn, makeJumpTimeSkip, t2BookFlip, t2ChestOpen, t2CreeperHiss, t2EnchantVeil, t2EndPortal, t2EndermanStare, t2LavaRise, t2PickaxeBreak, t2TextFlood, t2VillagerHmm, tCurtain, tGlitch, tLoading, tMosaic, tPortal, tPush, tSweep, tTnt, tZoom} from '../classicTrans';

/**
 * Runnable examples for the classicTrans group; each becomes composition `lib-<id>` (see src/lib-entry.tsx).
 * Generated from the catalog's `example` field: two placeholder shots (ShotA / ShotB) around the effect, 20 frames of lead and tail.
 * GENERATED FILE - edit the generator (see the generator notes in docs) or keep catalog and examples in sync by hand.
 */

/** Placeholder footage; in a real video these are your own shot components. */
const ShotA: FC = PlateA;
const ShotB: FC = PlateB;

const ExMosaic: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tMosaic.frames, C: ShotA},
      {dur: tMosaic.frames - tMosaic.bStart + 20, C: ShotB},
    ]}
    transitions={[tMosaic]}
  />
);

const ExPush: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tPush.frames, C: ShotA},
      {dur: tPush.frames - tPush.bStart + 20, C: ShotB},
    ]}
    transitions={[tPush]}
  />
);

const ExZoom: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tZoom.frames, C: ShotA},
      {dur: tZoom.frames - tZoom.bStart + 20, C: ShotB},
    ]}
    transitions={[tZoom]}
  />
);

const ExCurtain: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tCurtain.frames, C: ShotA},
      {dur: tCurtain.frames - tCurtain.bStart + 20, C: ShotB},
    ]}
    transitions={[tCurtain]}
  />
);

const ExLoading: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tLoading.frames, C: ShotA},
      {dur: tLoading.frames - tLoading.bStart + 20, C: ShotB},
    ]}
    transitions={[tLoading]}
  />
);

const ExTnt: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tTnt.frames, C: ShotA},
      {dur: tTnt.frames - tTnt.bStart + 20, C: ShotB},
    ]}
    transitions={[tTnt]}
  />
);

const ExPortal: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tPortal.frames, C: ShotA},
      {dur: tPortal.frames - tPortal.bStart + 20, C: ShotB},
    ]}
    transitions={[tPortal]}
  />
);

const ExSweep: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tSweep.frames, C: ShotA},
      {dur: tSweep.frames - tSweep.bStart + 20, C: ShotB},
    ]}
    transitions={[tSweep]}
  />
);

const ExGlitch: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + tGlitch.frames, C: ShotA},
      {dur: tGlitch.frames - tGlitch.bStart + 20, C: ShotB},
    ]}
    transitions={[tGlitch]}
  />
);

const ExCuteCreeperRush: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteCreeperRush.frames, C: ShotA},
      {dur: cuteCreeperRush.frames - cuteCreeperRush.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteCreeperRush]}
  />
);

const ExCuteBlockRain: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteBlockRain.frames, C: ShotA},
      {dur: cuteBlockRain.frames - cuteBlockRain.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteBlockRain]}
  />
);

const ExCuteCloudPush: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteCloudPush.frames, C: ShotA},
      {dur: cuteCloudPush.frames - cuteCloudPush.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteCloudPush]}
  />
);

const ExCuteSlimeSplat: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteSlimeSplat.frames, C: ShotA},
      {dur: cuteSlimeSplat.frames - cuteSlimeSplat.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteSlimeSplat]}
  />
);

const ExCuteHeartWave: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteHeartWave.frames, C: ShotA},
      {dur: cuteHeartWave.frames - cuteHeartWave.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteHeartWave]}
  />
);

const ExCutePolaroid: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cutePolaroid.frames, C: ShotA},
      {dur: cutePolaroid.frames - cutePolaroid.bStart + 20, C: ShotB},
    ]}
    transitions={[cutePolaroid]}
  />
);

const ExCuteStarFlip: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteStarFlip.frames, C: ShotA},
      {dur: cuteStarFlip.frames - cuteStarFlip.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteStarFlip]}
  />
);

const ExCuteChestPop: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteChestPop.frames, C: ShotA},
      {dur: cuteChestPop.frames - cuteChestPop.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteChestPop]}
  />
);

const ExCuteItemWheel: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteItemWheel.frames, C: ShotA},
      {dur: cuteItemWheel.frames - cuteItemWheel.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteItemWheel]}
  />
);

const ExCuteAnimalDash: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteAnimalDash.frames, C: ShotA},
      {dur: cuteAnimalDash.frames - cuteAnimalDash.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteAnimalDash]}
  />
);

const ExCuteFoodFrame: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteFoodFrame.frames, C: ShotA},
      {dur: cuteFoodFrame.frames - cuteFoodFrame.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteFoodFrame]}
  />
);

const ExCuteRainbowSweep: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteRainbowSweep.frames, C: ShotA},
      {dur: cuteRainbowSweep.frames - cuteRainbowSweep.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteRainbowSweep]}
  />
);

const ExCuteBubblePop: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteBubblePop.frames, C: ShotA},
      {dur: cuteBubblePop.frames - cuteBubblePop.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteBubblePop]}
  />
);

const ExCuteRibbonCurtain: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteRibbonCurtain.frames, C: ShotA},
      {dur: cuteRibbonCurtain.frames - cuteRibbonCurtain.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteRibbonCurtain]}
  />
);

const ExCuteDiceFlip: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteDiceFlip.frames, C: ShotA},
      {dur: cuteDiceFlip.frames - cuteDiceFlip.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteDiceFlip]}
  />
);

const ExCuteHeartIris: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + cuteHeartIris.frames, C: ShotA},
      {dur: cuteHeartIris.frames - cuteHeartIris.bStart + 20, C: ShotB},
    ]}
    transitions={[cuteHeartIris]}
  />
);

const ExT2EndPortal: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2EndPortal.frames, C: ShotA},
      {dur: t2EndPortal.frames - t2EndPortal.bStart + 20, C: ShotB},
    ]}
    transitions={[t2EndPortal]}
  />
);

const ExT2EnchantVeil: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2EnchantVeil.frames, C: ShotA},
      {dur: t2EnchantVeil.frames - t2EnchantVeil.bStart + 20, C: ShotB},
    ]}
    transitions={[t2EnchantVeil]}
  />
);

const ExT2LavaRise: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2LavaRise.frames, C: ShotA},
      {dur: t2LavaRise.frames - t2LavaRise.bStart + 20, C: ShotB},
    ]}
    transitions={[t2LavaRise]}
  />
);

const ExT2ChestOpen: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2ChestOpen.frames, C: ShotA},
      {dur: t2ChestOpen.frames - t2ChestOpen.bStart + 20, C: ShotB},
    ]}
    transitions={[t2ChestOpen]}
  />
);

const ExT2BookFlip: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2BookFlip.frames, C: ShotA},
      {dur: t2BookFlip.frames - t2BookFlip.bStart + 20, C: ShotB},
    ]}
    transitions={[t2BookFlip]}
  />
);

const ExT2VillagerHmm: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2VillagerHmm.frames, C: ShotA},
      {dur: t2VillagerHmm.frames - t2VillagerHmm.bStart + 20, C: ShotB},
    ]}
    transitions={[t2VillagerHmm]}
  />
);

const ExT2EndermanStare: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2EndermanStare.frames, C: ShotA},
      {dur: t2EndermanStare.frames - t2EndermanStare.bStart + 20, C: ShotB},
    ]}
    transitions={[t2EndermanStare]}
  />
);

const ExT2CreeperHiss: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2CreeperHiss.frames, C: ShotA},
      {dur: t2CreeperHiss.frames - t2CreeperHiss.bStart + 20, C: ShotB},
    ]}
    transitions={[t2CreeperHiss]}
  />
);

const ExT2PickaxeBreak: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2PickaxeBreak.frames, C: ShotA},
      {dur: t2PickaxeBreak.frames - t2PickaxeBreak.bStart + 20, C: ShotB},
    ]}
    transitions={[t2PickaxeBreak]}
  />
);

const ExT2TextFlood: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + t2TextFlood.frames, C: ShotA},
      {dur: t2TextFlood.frames - t2TextFlood.bStart + 20, C: ShotB},
    ]}
    transitions={[t2TextFlood]}
  />
);

const chapter4 = makeJumpChapter({from: '03', to: '04', label: 'CHAPTER 04 / 07 · 第四章', plateBottom: '第 4 章', badge: '进度 · 4 / 7', title: '熔岩之下', subtitle: '下界的门已经打开', current: 3});

const ExJumpChapter: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + chapter4.frames, C: ShotA},
      {dur: chapter4.frames - chapter4.bStart + 20, C: ShotB},
    ]}
    transitions={[chapter4]}
  />
);

const nextEp = makeJumpNextEpisode({ep: 'EP.03', range: 'EP.02 → EP.03', title: '深入末地', desc: ['找到要塞，', '点亮末地传送门。']});

const ExJumpNextEpisode: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + nextEp.frames, C: ShotA},
      {dur: nextEp.frames - nextEp.bStart + 20, C: ShotB},
    ]}
    transitions={[nextEp]}
  />
);

const pip = makeJumpPipExpand({titleB: '玩家视角 · LIVE', labelA: '主镜头'});

const ExJumpPipExpand: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + pip.frames, C: ShotA},
      {dur: pip.frames - pip.bStart + 20, C: ShotB},
    ]}
    transitions={[pip]}
  />
);

const skip = makeJumpTimeSkip({big: '一周后', sub: 'ONE WEEK LATER', days: 4, footer: () => '第 8 天 · 正午'});

const ExJumpTimeSkip: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + skip.frames, C: ShotA},
      {dur: skip.frames - skip.bStart + 20, C: ShotB},
    ]}
    transitions={[skip]}
  />
);

const countdown = makeJumpCountdown({ready: (n) => `比赛开始 · ${n}`, go: 'GO · 冲！'});

const ExJumpCountdown: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + countdown.frames, C: ShotA},
      {dur: countdown.frames - countdown.bStart + 20, C: ShotB},
    ]}
    transitions={[countdown]}
  />
);

const meanwhile = makeJumpMeanwhile({title: '另一边', sub: 'ELSEWHERE', labelA: '', labelB: ''});

const ExJumpMeanwhile: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + meanwhile.frames, C: ShotA},
      {dur: meanwhile.frames - meanwhile.bStart + 20, C: ShotB},
    ]}
    transitions={[meanwhile]}
  />
);

const flashback = makeJumpFlashback({Memory: ShotB});

const ExJumpFlashback: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + flashback.frames, C: ShotA},
      {dur: flashback.frames - flashback.bStart + 20, C: ShotA},
    ]}
    transitions={[flashback]}
  />
);

const respawn = makeJumpRespawn({cause: '死因 · 被苦力怕炸死', score: 2048});

const ExJumpRespawn: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + respawn.frames, C: ShotA},
      {dur: respawn.frames - respawn.bStart + 20, C: ShotB},
    ]}
    transitions={[respawn]}
  />
);

const toNether = makeDimOverToNether({title: '下界', sub: 'THE NETHER', desc: '岩浆与灰烬的炽热世界'});

const ExDimOverworldToNether: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + toNether.frames, C: ShotA},
      {dur: toNether.frames - toNether.bStart + 20, C: ShotB},
    ]}
    transitions={[toNether]}
  />
);

const toEnd = makeDimNetherToEnd({desc: '龙与虚空的尽头'});

const ExDimNetherToEnd: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + toEnd.frames, C: ShotA},
      {dur: toEnd.frames - toEnd.bStart + 20, C: ShotB},
    ]}
    transitions={[toEnd]}
  />
);

const toOverworld = makeDimToOverworld({title: '主世界'});

const ExDimToOverworld: FC = () => (
  <TransitionSeries
    shots={[
      {dur: 20 + toOverworld.frames, C: ShotA},
      {dur: toOverworld.frames - toOverworld.bStart + 20, C: ShotB},
    ]}
    transitions={[toOverworld]}
  />
);

const ExDimPearlTeleport: FC = () => (
  <AbsoluteFill>
    <ShotA />
    <Sequence from={20} durationInFrames={DIM_PEARL_TELEPORT_FRAMES}>
      <DimPearlTeleport damage="-2 ♥" />
    </Sequence>
  </AbsoluteFill>
);

const ExDimEndPortalActivate: FC = () => (
  <AbsoluteFill>
    <ShotA />
    <Sequence from={20} durationInFrames={DIM_END_PORTAL_ACTIVATE_FRAMES}>
      <DimEndPortalActivate title="末地之门" />
    </Sequence>
  </AbsoluteFill>
);

const ExLocTitleCard: FC = () => (
  <AbsoluteFill>
    <ShotA />
    <Sequence from={20} durationInFrames={LOC_TITLE_CARD_FRAMES}>
      <LocTitleCard tone="grass" left="翡翠" right="森林" sub="EMERALD FOREST" coords={[128, 72, -640]} tag="新地点 · NEW LOCATION" icon="grass_block_side" />
    </Sequence>
  </AbsoluteFill>
);

const ExLocBiomeBanner: FC = () => (
  <AbsoluteFill>
    <ShotA />
    <Sequence from={20} durationInFrames={LOC_BIOME_BANNER_FRAMES}>
      <LocBiomeBanner title="蘑菇岛" sub="MUSHROOM FIELDS" tag="新群系 · NEW BIOME" ribbon="已发现 · 4 / 12 群系" icon="red_mushroom_block" />
    </Sequence>
  </AbsoluteFill>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'mosaic', Component: ExMosaic, frames: 20 + tMosaic.frames + 20},
  {id: 'push', Component: ExPush, frames: 20 + tPush.frames + 20},
  {id: 'zoom', Component: ExZoom, frames: 20 + tZoom.frames + 20},
  {id: 'curtain', Component: ExCurtain, frames: 20 + tCurtain.frames + 20},
  {id: 'loading', Component: ExLoading, frames: 20 + tLoading.frames + 20},
  {id: 'tnt', Component: ExTnt, frames: 20 + tTnt.frames + 20},
  {id: 'portal', Component: ExPortal, frames: 20 + tPortal.frames + 20},
  {id: 'sweep', Component: ExSweep, frames: 20 + tSweep.frames + 20},
  {id: 'glitch', Component: ExGlitch, frames: 20 + tGlitch.frames + 20},
  {id: 'cute-creeper-rush', Component: ExCuteCreeperRush, frames: 20 + cuteCreeperRush.frames + 20},
  {id: 'cute-block-rain', Component: ExCuteBlockRain, frames: 20 + cuteBlockRain.frames + 20},
  {id: 'cute-cloud-push', Component: ExCuteCloudPush, frames: 20 + cuteCloudPush.frames + 20},
  {id: 'cute-slime-splat', Component: ExCuteSlimeSplat, frames: 20 + cuteSlimeSplat.frames + 20},
  {id: 'cute-heart-wave', Component: ExCuteHeartWave, frames: 20 + cuteHeartWave.frames + 20},
  {id: 'cute-polaroid', Component: ExCutePolaroid, frames: 20 + cutePolaroid.frames + 20},
  {id: 'cute-star-flip', Component: ExCuteStarFlip, frames: 20 + cuteStarFlip.frames + 20},
  {id: 'cute-chest-pop', Component: ExCuteChestPop, frames: 20 + cuteChestPop.frames + 20},
  {id: 'cute-item-wheel', Component: ExCuteItemWheel, frames: 20 + cuteItemWheel.frames + 20},
  {id: 'cute-animal-dash', Component: ExCuteAnimalDash, frames: 20 + cuteAnimalDash.frames + 20},
  {id: 'cute-food-frame', Component: ExCuteFoodFrame, frames: 20 + cuteFoodFrame.frames + 20},
  {id: 'cute-rainbow-sweep', Component: ExCuteRainbowSweep, frames: 20 + cuteRainbowSweep.frames + 20},
  {id: 'cute-bubble-pop', Component: ExCuteBubblePop, frames: 20 + cuteBubblePop.frames + 20},
  {id: 'cute-ribbon-curtain', Component: ExCuteRibbonCurtain, frames: 20 + cuteRibbonCurtain.frames + 20},
  {id: 'cute-dice-flip', Component: ExCuteDiceFlip, frames: 20 + cuteDiceFlip.frames + 20},
  {id: 'cute-heart-iris', Component: ExCuteHeartIris, frames: 20 + cuteHeartIris.frames + 20},
  {id: 't2-end-portal', Component: ExT2EndPortal, frames: 20 + t2EndPortal.frames + 20},
  {id: 't2-enchant-veil', Component: ExT2EnchantVeil, frames: 20 + t2EnchantVeil.frames + 20},
  {id: 't2-lava-rise', Component: ExT2LavaRise, frames: 20 + t2LavaRise.frames + 20},
  {id: 't2-chest-open', Component: ExT2ChestOpen, frames: 20 + t2ChestOpen.frames + 20},
  {id: 't2-book-flip', Component: ExT2BookFlip, frames: 20 + t2BookFlip.frames + 20},
  {id: 't2-villager-hmm', Component: ExT2VillagerHmm, frames: 20 + t2VillagerHmm.frames + 20},
  {id: 't2-enderman-stare', Component: ExT2EndermanStare, frames: 20 + t2EndermanStare.frames + 20},
  {id: 't2-creeper-hiss', Component: ExT2CreeperHiss, frames: 20 + t2CreeperHiss.frames + 20},
  {id: 't2-pickaxe-break', Component: ExT2PickaxeBreak, frames: 20 + t2PickaxeBreak.frames + 20},
  {id: 't2-text-flood', Component: ExT2TextFlood, frames: 20 + t2TextFlood.frames + 20},
  {id: 'jump-chapter', Component: ExJumpChapter, frames: 20 + chapter4.frames + 20},
  {id: 'jump-next-episode', Component: ExJumpNextEpisode, frames: 20 + nextEp.frames + 20},
  {id: 'jump-pip-expand', Component: ExJumpPipExpand, frames: 20 + pip.frames + 20},
  {id: 'jump-time-skip', Component: ExJumpTimeSkip, frames: 20 + skip.frames + 20},
  {id: 'jump-countdown', Component: ExJumpCountdown, frames: 20 + countdown.frames + 20},
  {id: 'jump-meanwhile', Component: ExJumpMeanwhile, frames: 20 + meanwhile.frames + 20},
  {id: 'jump-flashback', Component: ExJumpFlashback, frames: 20 + flashback.frames + 20},
  {id: 'jump-respawn', Component: ExJumpRespawn, frames: 20 + respawn.frames + 20},
  {id: 'dim-overworld-to-nether', Component: ExDimOverworldToNether, frames: 20 + toNether.frames + 20},
  {id: 'dim-nether-to-end', Component: ExDimNetherToEnd, frames: 20 + toEnd.frames + 20},
  {id: 'dim-to-overworld', Component: ExDimToOverworld, frames: 20 + toOverworld.frames + 20},
  {id: 'dim-pearl-teleport', Component: ExDimPearlTeleport, frames: 20 + DIM_PEARL_TELEPORT_FRAMES + 20},
  {id: 'dim-end-portal-activate', Component: ExDimEndPortalActivate, frames: 20 + DIM_END_PORTAL_ACTIVATE_FRAMES + 20},
  {id: 'loc-title-card', Component: ExLocTitleCard, frames: 20 + LOC_TITLE_CARD_FRAMES + 20},
  {id: 'loc-biome-banner', Component: ExLocBiomeBanner, frames: 20 + LOC_BIOME_BANNER_FRAMES + 20},
];
