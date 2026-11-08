import type {FC} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {ScenePlate} from '../../gallery/fx/mcdscene/scenes';
import {McdVictoryBanner, McdResults, McdChestReveal, McdLootRarity, McdBossIntro, McdBossDefeat, McdDeathScreen, McdLevelUp, McdSoulsCollect, McdEmeraldCollect, McdObjective, McdLocationLabel, McdLocationBig, McdItemShowcase, McdWorldMap, McdTitleScramble, McdVoxelLogo, McdEndCard, McdChapterCard, McdNewMission, McdNewMissionCenter, McdPresents, McdSeriesTitle, McdSubtitleBar, McdCredits, McdDayTitle} from '../mcdShow';

/** Runnable examples for the mcdShow group; each becomes composition `lib-<id>` (see src/lib-entry.tsx). */

/** Stand-in for the user's footage: a flat gradient with a faint grid and a label. */
const Footage: FC<{from: string; to: string}> = ({from, to}) => (
  <AbsoluteFill style={{background: `linear-gradient(160deg, ${from}, ${to})`}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.06) 2px, transparent 2px)', backgroundSize: '96px 96px'}} />
    <div style={{position: 'absolute', left: 48, bottom: 36, color: 'rgba(255,255,255,0.35)', fontSize: 30, letterSpacing: 4, fontFamily: 'sans-serif'}}>FOOTAGE</div>
  </AbsoluteFill>
);

// mcd-s-victory-banner
const Ex0: FC = () => (
  <AbsoluteFill>
    <Footage from="#7fb4e8" to="#3f7a52" />
    <Sequence from={10} durationInFrames={160}>
      <McdVictoryBanner from={5} title="胜利！" sub="任务结束…" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-results
const Ex1: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={180}>
      <McdResults level={6} stage="恭喜过关" mission="苦力怕森林" name="vrvylive" kills={568} unit="击败敌人" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-chest-reveal
const Ex2: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={180}>
      <McdChestReveal item="diamond_sword" name="寒焰之刃" rarity="rare" desc="霜与火交织的刃，斩过之处留下灼痕。" power={21} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-loot-rarity
const Ex3: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={180}>
      <McdLootRarity
        items={[
          {item: 'iron_sword', name: '铁剑', rarity: 'common', power: 8},
          {item: 'bow', name: '猎手之弓', rarity: 'rare', power: 21},
          {item: 'golden_sword', name: '炽炎裂刃', rarity: 'unique', power: 37},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-boss-intro
const Ex4: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={180}>
      <McdBossIntro name="红石傀儡" objective="击败红石傀儡" heading="新目标" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-boss-defeat
const Ex5: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={160}>
      <McdBossDefeat objective="跟随小路" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-death
const Ex6: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={150}>
      <McdDeathScreen text="你死了" cause="被苦力怕炸飞" lives={3} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-level-up
const Ex7: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={150}>
      <McdLevelUp level={7} title="升级！" sub="获得 1 点附魔点" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-souls-collect
const Ex8: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={150}>
      <McdSoulsCollect start={27} label="灵魂" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-emerald-collect
const Ex9: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={150}>
      <McdEmeraldCollect start={109} label="绿宝石" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-objective
const Ex10: FC = () => (
  <AbsoluteFill>
    <Footage from="#7fb4e8" to="#3f7a52" />
    <Sequence from={10} durationInFrames={140}>
      <McdObjective area="无名王国" oldText="击败守卫的骷髅" newText="抵达死灵法师之墓" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-location-card
const Ex11: FC = () => (
  <AbsoluteFill>
    <Footage from="#e9a45a" to="#6b3a2a" />
    <Sequence from={10} durationInFrames={150}>
      <McdLocationLabel place="苦力怕森林" sub="正在前往" blocks={['stone', 'cobblestone', 'magma']} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-location-card-big
const Ex12: FC = () => (
  <AbsoluteFill>
    <Footage from="#2a2a34" to="#121218" />
    <Sequence from={10} durationInFrames={150}>
      <McdLocationBig place="红石矿山" sub="正在前往" tag="第四章 · 难度 IV" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-item-showcase
const Ex13: FC = () => (
  <AbsoluteFill>
    <Footage from="#6b4a3a" to="#2e1f1a" />
    <Sequence from={10} durationInFrames={180}>
      <McdItemShowcase item="diamond_sword" name="寒焰之刃" rarity="unique" damage="24-40 近战伤害" level={7} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-s-world-map-select
const Ex14: FC = () => (
  <AbsoluteFill>
    <Footage from="#e4d3ba" to="#b9a07a" />
    <Sequence from={10} durationInFrames={180}>
      <McdWorldMap selected={3} places={['苦力怕森林', '沼泽湿地', '沙漠神殿', '红石矿山', '冰封之巅', '黑曜尖塔']} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-title-scramble
const Ex15: FC = () => (
  <AbsoluteFill>
    <Sequence from={10} durationInFrames={150}>
      <McdTitleScramble bg title="地底迷城" subtitle="整合包冒险 · 第 1 集" look="gold" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-title-voxel-assemble
const Ex16: FC = () => (
  <AbsoluteFill>
    <Footage from="#2a2a34" to="#121218" />
    <Sequence from={10} durationInFrames={180}>
      <McdVoxelLogo text="地底迷城" sub="方块拼合 · 第 1 季" tint="gold" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-end-card
const Ex17: FC = () => (
  <AbsoluteFill>
    <Sequence from={10} durationInFrames={210}>
      <McdEndCard bg kicker="我的世界 · 冒险日志" title="地底迷城" thanks="感谢观看" studios={['Oriel 工作室', '地下城风格素材库']} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-chapter-card
const Ex18: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={120}>
      <McdChapterCard n={3} name="苦力怕森林" sub="夜幕降临，林中传来熟悉的嘶嘶声" mode="cut" />
    </Sequence>
    <Sequence from={130} durationInFrames={120}>
      <McdChapterCard n={4} name="红石矿山" sub="深入地底，机关与熔岩在等你" mode="slide" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-new-mission
const Ex19: FC = () => (
  <AbsoluteFill>
    <Footage from="#e4d3ba" to="#b9a07a" />
    <Sequence from={10} durationInFrames={150}>
      <McdNewMission title="新任务解锁" icons={['diamond_sword', 'bow', 'iron_pickaxe']} countLabel="个新任务" button="查看下一个" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-new-mission-center
const Ex20: FC = () => (
  <AbsoluteFill>
    <Footage from="#e4d3ba" to="#b9a07a" />
    <Sequence from={10} durationInFrames={150}>
      <McdNewMissionCenter icons={['golden_apple', 'diamond', 'ender_pearl', 'experience_bottle']} />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-presents
const Ex21: FC = () => (
  <AbsoluteFill>
    <Sequence from={10} durationInFrames={150}>
      <McdPresents bg lead="Oriel 工作室 出品" logo="地底迷城" tagline="模组整合包冒险系列" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-series-title
const Ex22: FC = () => (
  <AbsoluteFill>
    <Footage from="#7fb4e8" to="#3f7a52" />
    <Sequence from={10} durationInFrames={150}>
      <McdSeriesTitle ep={5} kicker="生存系列 · 第二季" title="沉入地牢深处" subtitle="我们在红石矿山找到了失落的神器" />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-subtitle-bar
const Ex23: FC = () => (
  <AbsoluteFill>
    <Footage from="#1b2440" to="#0c1424" />
    <Sequence from={10} durationInFrames={180}>
      <McdSubtitleBar
        perLine={52}
        lines={[
          {who: '旁白', text: '夜幕降临，苦力怕森林里传来了熟悉的嘶嘶声。', tone: 'gold'},
          {who: '史蒂夫', skin: 'steve', text: '别慌，先把火把插到那面石墙上。', tone: 'cyan'},
          {who: '村民', skin: 'villager', text: '嗯……绿宝石？我可以拿东西跟你换。', tone: 'green'},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-credits
const Ex24: FC = () => (
  <AbsoluteFill>
    <ScenePlate biome="forest-night" camera="drift" />
    <Sequence from={10} durationInFrames={240}>
      <McdCredits
        speed={6}
        thanks="感谢观看"
        groups={[
          {head: '制作团队', rows: [['导演 · 剪辑', '小明'], ['视频后期', '阿花'], ['配乐', '墨竹']]},
          {head: '模组与资源', rows: [['整合包', 'Oriel 工作室'], ['材质包', '像素工坊']]},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

// mcd-c-day-title
const Ex25: FC = () => (
  <AbsoluteFill>
    <Footage from="#e9a45a" to="#6b3a2a" />
    <Sequence from={10} durationInFrames={150}>
      <McdDayTitle day={3} time="dusk" />
    </Sequence>
  </AbsoluteFill>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'mcd-s-victory-banner', Component: Ex0, frames: 170},
  {id: 'mcd-s-results', Component: Ex1, frames: 190},
  {id: 'mcd-s-chest-reveal', Component: Ex2, frames: 190},
  {id: 'mcd-s-loot-rarity', Component: Ex3, frames: 190},
  {id: 'mcd-s-boss-intro', Component: Ex4, frames: 190},
  {id: 'mcd-s-boss-defeat', Component: Ex5, frames: 170},
  {id: 'mcd-s-death', Component: Ex6, frames: 160},
  {id: 'mcd-s-level-up', Component: Ex7, frames: 160},
  {id: 'mcd-s-souls-collect', Component: Ex8, frames: 160},
  {id: 'mcd-s-emerald-collect', Component: Ex9, frames: 160},
  {id: 'mcd-s-objective', Component: Ex10, frames: 150},
  {id: 'mcd-s-location-card', Component: Ex11, frames: 160},
  {id: 'mcd-s-location-card-big', Component: Ex12, frames: 160},
  {id: 'mcd-s-item-showcase', Component: Ex13, frames: 190},
  {id: 'mcd-s-world-map-select', Component: Ex14, frames: 190},
  {id: 'mcd-c-title-scramble', Component: Ex15, frames: 160},
  {id: 'mcd-c-title-voxel-assemble', Component: Ex16, frames: 190},
  {id: 'mcd-c-end-card', Component: Ex17, frames: 220},
  {id: 'mcd-c-chapter-card', Component: Ex18, frames: 260},
  {id: 'mcd-c-new-mission', Component: Ex19, frames: 160},
  {id: 'mcd-c-new-mission-center', Component: Ex20, frames: 160},
  {id: 'mcd-c-presents', Component: Ex21, frames: 160},
  {id: 'mcd-c-series-title', Component: Ex22, frames: 160},
  {id: 'mcd-c-subtitle-bar', Component: Ex23, frames: 190},
  {id: 'mcd-c-credits', Component: Ex24, frames: 250},
  {id: 'mcd-c-day-title', Component: Ex25, frames: 160},
];
