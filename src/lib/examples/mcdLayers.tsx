import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {ScenePlate} from '../../gallery/fx/mcdscene';
import {
  McdLBloomFog,
  McdLDustMotes,
  McdLEmbers,
  McdLEmbersGold,
  McdLGodRays,
  McdLGradeDesert,
  McdLGradeDesertGlow,
  McdLGradeEnd,
  McdLGradeEndGlow,
  McdLGradeForest,
  McdLGradeForestGlow,
  McdLGradeNether,
  McdLGradeNetherGlow,
  McdLGradeSnow,
  McdLGradeSnowGlow,
  McdLHurtVignette,
  McdLLightningStorm,
  McdLLootBeams,
  McdLSoulsDrift,
  McdLTiltShift,
  McdLTorchGlow,
  McdVCompare,
  McdVDayCounter,
  McdVEpisodeList,
  McdVLikeChest,
  McdVMobCard,
  McdVModpackBrief,
  McdVObjectives,
  McdVPlayerJoin,
  McdVStatsTally,
  McdVToast,
  McdVWaypoint,
  McdKit,
} from '../mcdLayers';

/**
 * Runnable examples for the mcdLayers group; each becomes composition `lib-<id>` (see src/lib-entry.tsx).
 * GENERATED together with catalog/mcdLayers.json from one table: the JSX below is the catalog `example`.
 * <ScenePlate> is only a stand-in for your footage.
 */
// mcd-l-grade-forest
const Ex0: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-day" camera="static" />
    <McdLGradeForest />
    <McdLGradeForestGlow />
  </AbsoluteFill>
);

// mcd-l-grade-forest-glow
const Ex1: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-day" camera="static" />
    <McdLGradeForestGlow lights={[{x: 0.32, y: 0.36, size: 1.2}]} />
  </AbsoluteFill>
);

// mcd-l-grade-nether
const Ex2: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="nether" camera="static" />
    <McdLGradeNether />
    <McdLGradeNetherGlow />
  </AbsoluteFill>
);

// mcd-l-grade-nether-glow
const Ex3: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="nether" camera="static" />
    <McdLGradeNetherGlow lights={[{x: 0.32, y: 0.36, size: 1.2}]} />
  </AbsoluteFill>
);

// mcd-l-grade-end
const Ex4: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="end" camera="static" />
    <McdLGradeEnd />
    <McdLGradeEndGlow />
  </AbsoluteFill>
);

// mcd-l-grade-end-glow
const Ex5: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="end" camera="static" />
    <McdLGradeEndGlow lights={[{x: 0.32, y: 0.36, size: 1.2}]} />
  </AbsoluteFill>
);

// mcd-l-grade-snow
const Ex6: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="snow" camera="static" />
    <McdLGradeSnow />
    <McdLGradeSnowGlow />
  </AbsoluteFill>
);

// mcd-l-grade-snow-glow
const Ex7: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="snow" camera="static" />
    <McdLGradeSnowGlow lights={[{x: 0.32, y: 0.36, size: 1.2}]} />
  </AbsoluteFill>
);

// mcd-l-grade-desert
const Ex8: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="desert" camera="static" />
    <McdLGradeDesert />
    <McdLGradeDesertGlow />
  </AbsoluteFill>
);

// mcd-l-grade-desert-glow
const Ex9: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="desert" camera="static" />
    <McdLGradeDesertGlow lights={[{x: 0.32, y: 0.36, size: 1.2}]} />
  </AbsoluteFill>
);

// mcd-l-bloom-fog
const Ex10: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="camp" camera="static" />
    <McdLBloomFog tone="cool" lights={[{x: 0.31, y: 0.35, color: '#ffc870', a: 0.7}, {x: 0.66, y: 0.73, color: '#ffc870', a: 0.7}]} />
  </AbsoluteFill>
);

// mcd-l-god-rays
const Ex11: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="camp" camera="static" />
    <McdLGodRays angle={18} />
  </AbsoluteFill>
);

// mcd-l-tiltshift
const Ex12: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <McdLTiltShift blur={9}>
      <ScenePlate biome="forest-day" camera="static" />
    </McdLTiltShift>
  </AbsoluteFill>
);

// mcd-l-loot-beams
const Ex13: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="camp" camera="static" />
    <McdLLootBeams beams={[{x: 700, y: 800, kind: 'orange', at: 10}, {x: 1300, y: 760, kind: 'magenta', at: 30}]} />
  </AbsoluteFill>
);

// mcd-l-souls-drift
const Ex14: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdLSoulsDrift />
  </AbsoluteFill>
);

// mcd-l-embers
const Ex15: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="nether" camera="static" />
    <McdLEmbers density={2.2} />
  </AbsoluteFill>
);

// mcd-l-embers-gold
const Ex16: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="camp" camera="static" />
    <McdLEmbersGold />
  </AbsoluteFill>
);

// mcd-l-lightning-storm
const Ex17: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdLLightningStorm strikes={[{frame: 30, x: 0.6, y: 0.62, seed: 3}, {frame: 120, x: 0.25, y: 0.4, seed: 5, kind: 'far'}]} />
  </AbsoluteFill>
);

// mcd-l-hurt-vignette
const Ex18: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-day" camera="static" />
    <McdLHurtVignette hp={0.9} hitAt={12} />
  </AbsoluteFill>
);

// mcd-l-dust-motes
const Ex19: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="camp" camera="static" />
    <McdLDustMotes />
  </AbsoluteFill>
);

// mcd-l-torch-glow
const Ex20: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="camp" camera="static" />
    <McdLTorchGlow torches={[{x: 600, y: 400, kind: 'torch'}, {x: 1290, y: 800, kind: 'camp'}]} />
  </AbsoluteFill>
);

// mcd-v-modpack-brief
const Ex21: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVModpackBrief name="星海远航" tagline="五十个模组，一座漂浮的星港。" version="v1.3.0" mods={58} difficulty={5} rewards={['diamond_sword','golden_apple','totem_of_undying']} />
  </AbsoluteFill>
);

// mcd-v-episode-list
const Ex22: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVEpisodeList episode="EPISODE 12" current={1} preview="diamond_sword" items={[{title: '开箱与出生点', time: '00:00'}, {title: '第一个据点', time: '03:20'}, {title: '洞穴探险', time: '08:05'}, {title: '终局之战', time: '14:40'}]} />
  </AbsoluteFill>
);

// mcd-v-objectives
const Ex23: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVObjectives chapter="第一章 · 出生点" announceLabel="新任务" items={[{text: '砍 10 块木头', appear: 10, done: 70}, {text: '合成工作台', appear: 30, done: 100}, {text: '在天黑前造好庇护所', appear: 110}]} />
  </AbsoluteFill>
);

// mcd-v-stats-tally
const Ex24: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVStatsTally title="挑战完成" subtitle="无伤通关挑战" player="小林" skin="steve" rank="A" level={20} stats={{deaths: 0, kills: 312, seconds: 905, explore: 64}} emeralds={120} souls={8} />
  </AbsoluteFill>
);

// mcd-v-mob-card
const Ex25: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVMobCard mob="wither_skeleton" boss name="凋灵骷髅队长" desc="要塞的守卫。带上牛奶，别站在原地不动。" />
  </AbsoluteFill>
);

// mcd-v-compare
const Ex26: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVCompare title="弓对弩" labels={['伤害', '射速', '精准']} a={{name: '长弓', item: 'bow', rarity: 'rare', stats: [70, 85, 60]}} b={{name: '弩', item: 'crossbow_standby', rarity: 'unique', stats: [88, 45, 80]}} />
  </AbsoluteFill>
);

// mcd-v-day-counter
const Ex27: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVDayCounter day={100} caption="第一百天，我们还活着" facts={['村民 12 个', '铁傀儡 3 只', '死亡 5 次']} />
  </AbsoluteFill>
);

// mcd-v-player-join
const Ex28: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVPlayerJoin joinText="进入了服务器" leaveText="离开了服务器" roster={false} events={[{kind: 'join', name: '小明', skin: 'steve', color: '#48D8A8', at: 8, hold: 60}, {kind: 'leave', name: '阿杰', skin: 'kai', color: '#E058B8', at: 50, hold: 60}]} />
  </AbsoluteFill>
);

// mcd-v-waypoint
const Ex29: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVWaypoint totalFrames={150} waypoints={[{x: 700, ground: 880, kind: 'green', name: '村庄', dist: 620, coords: 'X 120  Y 70  Z -40', icon: 'flag', size: 1}, {x: 1400, ground: 820, kind: 'orange', name: 'Boss 巢穴', dist: 2050, icon: 'skull', size: 0.7, delay: 14}]} />
  </AbsoluteFill>
);

// mcd-v-like-chest
const Ex30: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVLikeChest labels={['点赞', '关注', '转发']} headline="三连有礼" item="diamond" thanks="谢谢你们" note="下期见" />
  </AbsoluteFill>
);

// mcd-v-toast
const Ex31: FC = () => (
  <AbsoluteFill>
    {/* ScenePlate 是占位素材，换成你自己的视频 */}
    <ScenePlate biome="forest-night" camera="static" />
    <McdVToast parts={['achievement']} title="成就达成" name="第一滴血" xp="+20 XP" item="iron_sword" />
  </AbsoluteFill>
);

// mcd-kit
const Ex32: FC = () => (
  <AbsoluteFill>
    <McdKit.McdBackdrop kind="inventory" />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 40}}>
      <McdKit.BevelSlot size={140} rarity="unique">
        <McdKit.ItemIcon3D src={McdKit.itemTex('diamond_sword')} size={90} depth={6} />
      </McdKit.BevelSlot>
      <McdKit.PxText text="MCD KIT" px={8} />
      <McdKit.MainButton label="出发" w={360} h={96} tone="green" textPx={5} />
    </AbsoluteFill>
  </AbsoluteFill>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'mcd-l-grade-forest', Component: Ex0, frames: 210},
  {id: 'mcd-l-grade-forest-glow', Component: Ex1, frames: 210},
  {id: 'mcd-l-grade-nether', Component: Ex2, frames: 210},
  {id: 'mcd-l-grade-nether-glow', Component: Ex3, frames: 210},
  {id: 'mcd-l-grade-end', Component: Ex4, frames: 210},
  {id: 'mcd-l-grade-end-glow', Component: Ex5, frames: 210},
  {id: 'mcd-l-grade-snow', Component: Ex6, frames: 210},
  {id: 'mcd-l-grade-snow-glow', Component: Ex7, frames: 210},
  {id: 'mcd-l-grade-desert', Component: Ex8, frames: 210},
  {id: 'mcd-l-grade-desert-glow', Component: Ex9, frames: 210},
  {id: 'mcd-l-bloom-fog', Component: Ex10, frames: 180},
  {id: 'mcd-l-god-rays', Component: Ex11, frames: 210},
  {id: 'mcd-l-tiltshift', Component: Ex12, frames: 180},
  {id: 'mcd-l-loot-beams', Component: Ex13, frames: 180},
  {id: 'mcd-l-souls-drift', Component: Ex14, frames: 240},
  {id: 'mcd-l-embers', Component: Ex15, frames: 180},
  {id: 'mcd-l-embers-gold', Component: Ex16, frames: 180},
  {id: 'mcd-l-lightning-storm', Component: Ex17, frames: 240},
  {id: 'mcd-l-hurt-vignette', Component: Ex18, frames: 180},
  {id: 'mcd-l-dust-motes', Component: Ex19, frames: 210},
  {id: 'mcd-l-torch-glow', Component: Ex20, frames: 180},
  {id: 'mcd-v-modpack-brief', Component: Ex21, frames: 150},
  {id: 'mcd-v-episode-list', Component: Ex22, frames: 150},
  {id: 'mcd-v-objectives', Component: Ex23, frames: 180},
  {id: 'mcd-v-stats-tally', Component: Ex24, frames: 190},
  {id: 'mcd-v-mob-card', Component: Ex25, frames: 168},
  {id: 'mcd-v-compare', Component: Ex26, frames: 180},
  {id: 'mcd-v-day-counter', Component: Ex27, frames: 120},
  {id: 'mcd-v-player-join', Component: Ex28, frames: 150},
  {id: 'mcd-v-waypoint', Component: Ex29, frames: 150},
  {id: 'mcd-v-like-chest', Component: Ex30, frames: 190},
  {id: 'mcd-v-toast', Component: Ex31, frames: 150},
  {id: 'mcd-kit', Component: Ex32, frames: 90},
];
