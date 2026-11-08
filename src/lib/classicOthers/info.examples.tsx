import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {PlateA, PlateB} from '../../gallery/plates';
import {
  InfoChapterOre,
  InfoChapterStone,
  InfoChapterFlat,
  InfoLowerThirdOre,
  InfoLowerThirdCute,
  InfoAdvancementToasts,
  InfoStatBars,
  InfoCompareBars,
  InfoLeaderboard,
  InfoCountdownBig,
  InfoCoordTags,
  InfoIngredientList,
  InfoDialogSubtitle,
  InfoCreditsRoll,
} from './info';

/**
 * Runnable examples for the classicOthers/info group; each becomes composition `lib-<id>` (see src/lib-entry.tsx).
 * The stand-in footage is a gallery plate; the effect sits in a <Sequence> with 15 frames of lead and tail, which is how
 * you would place it in a real video (local frame 0 = the effect's first frame).
 */

const Shot: FC<{plate: 'A' | 'B'; children: ReactNode}> = ({plate, children}) => (
  <AbsoluteFill>
    {plate === 'A' ? <PlateA /> : <PlateB />}
    {children}
  </AbsoluteFill>
);

const ChapterOreExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={150}>
      <InfoChapterOre no={3} total={8} title="合成钻石装备" hint="先备好 3 颗钻石和 2 根木棍" icon="diamond_sword" items={['diamond', 'stick', 'iron_ingot']} series="EP.12 · 钻石装备篇" next="下一章 · 附魔" frames={150} />
    </Sequence>
  </Shot>
);

const ChapterStoneExample: FC = () => (
  <Shot plate="B">
    <Sequence from={15} durationInFrames={150}>
      <InfoChapterStone no={4} title="深渊之门" sub="地下三百米 · 一扇不该被打开的门" frames={150} />
    </Sequence>
  </Shot>
);

const ChapterFlatExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={150}>
      <InfoChapterFlat no={3} title="红石小课堂" sub="今天教你造全自动门" accent="#ffd23f" frames={150} />
    </Sequence>
  </Shot>
);

const LowerThirdOreExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={135}>
      <InfoLowerThirdOre name="红石阿明" role="建筑师 · 红石工程" handle="@RedstoneAMing" skin="entity/player/wide/steve.png" tag="优易库" icon="diamond" badge="redstone" frames={135} />
    </Sequence>
  </Shot>
);

const LowerThirdCuteExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={135}>
      <InfoLowerThirdCute name="小蓝同学" role="今天的讲解员" mascot="slime" tag="关注我" frames={135} />
    </Sequence>
  </Shot>
);

const AdvancementToastsExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={240}>
      <InfoAdvancementToasts
          toasts={[
            {kind: 'task', title: '石器时代', desc: '用镐子挖掘一块石头', icon: 'stone_pickaxe'},
            {kind: 'goal', title: '钻石！', desc: '用铁镐找到并挖出钻石', icon: 'diamond'},
            {kind: 'challenge', title: '天空之限', desc: '穿着鞘翅飞越 500 米高空', icon: 'elytra'},
          ]}
          counter="已解锁 18 / 124 个进度"
          frames={240}
        />
    </Sequence>
  </Shot>
);

const StatBarsExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={240}>
      <InfoStatBars health={[{at: 58, to: 8}, {at: 118, to: 18}]} hunger={[{at: 84, to: 10}, {at: 150, to: 16}]} levelUpAt={112} level={30} frames={240} />
    </Sequence>
  </Shot>
);

const CompareBarsExample: FC = () => (
  <Shot plate="B">
    <Sequence from={15} durationInFrames={230}>
      <InfoCompareBars
          title="属性对比"
          left={{id: 'diamond_sword', name: '钻石剑', tag: '锋利 V', color: '#55ffff'}}
          right={{id: 'netherite_sword', name: '下界合金剑', tag: '锋利 V', color: '#d58bff'}}
          rows={[
            {label: '攻击伤害', l: 7, r: 8, max: 10},
            {label: '耐久', l: 1561, r: 2031, max: 2400},
            {label: '攻击速度', l: 1.6, r: 1.6, max: 2, dec: 1},
            {label: '抗击退', l: 0, r: 0.1, max: 0.2, dec: 1},
          ]}
          frames={230}
        />
    </Sequence>
  </Shot>
);

const LeaderboardExample: FC = () => (
  <Shot plate="B">
    <Sequence from={15} durationInFrames={280}>
      <InfoLeaderboard
          title="击杀排行榜"
          unit="本周"
          players={[
            {name: '艾利克斯', skin: 'entity/player/wide/alex.png', a: 2480, b: 2620},
            {name: '史蒂夫', skin: 'entity/player/wide/steve.png', a: 2310, b: 2990},
            {name: '凯', skin: 'entity/player/wide/kai.png', a: 2105, b: 2290},
            {name: '诺尔', skin: 'entity/player/wide/noor.png', a: 1890, b: 2010},
            {name: '祖里', skin: 'entity/player/wide/zuri.png', a: 1650, b: 2450},
          ]}
          frames={280}
        />
    </Sequence>
  </Shot>
);

const CountdownBigExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={230}>
      <InfoCountdownBig from={5} go="开始!" frames={230} />
    </Sequence>
  </Shot>
);

const CoordTagsExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={200}>
      <InfoCoordTags
          tags={[
            {x: 380, y: 840, name: '雪原村庄', xyz: [128, 64, -240], color: '#f8af2b', at: 10, dist: '328 m', icon: 'pin'},
            {x: 1000, y: 780, name: '地下钻石矿', xyz: [-512, -54, 96], color: '#55ffff', at: 34, dist: '1.2 km', icon: 'trophy'},
            {x: 1560, y: 520, name: '下界传送门', xyz: [20, 71, 4], color: '#d58bff', at: 58, dist: '64 m', icon: 'bolt'},
          ]}
          frames={200}
        />
    </Sequence>
  </Shot>
);

const IngredientListExample: FC = () => (
  <Shot plate="B">
    <Sequence from={15} durationInFrames={250}>
      <InfoIngredientList
          title="材料清单"
          rows={[
            {id: 'diamond', name: '钻石', count: 3, src: '深层矿洞 · Y -58'},
            {id: 'stick', name: '木棍', count: 2, src: '橡木 → 木板 → 木棍'},
            {id: 'iron_ingot', name: '铁锭', count: 4, src: '熔炼铁矿石'},
            {id: 'redstone', name: '红石粉', count: 8, src: '红石矿 · Y -59'},
            {id: 'book', name: '书', count: 1, src: '村庄图书馆'},
          ]}
          result={{id: 'diamond_pickaxe', name: '钻石镐', line: '挖掘速度 8 · 耐久 1561'}}
          frames={250}
        />
    </Sequence>
  </Shot>
);

const DialogSubtitleExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={300}>
      <InfoDialogSubtitle
          speakers={[
            {name: '史蒂夫', skin: 'entity/player/wide/steve.png', color: '#ffd35a'},
            {name: '艾利克斯', skin: 'entity/player/wide/alex.png', color: '#ff8fc0'},
          ]}
          lines={[
            {who: 0, text: '小心！前面有一只苦力怕！', tone: 'shout'},
            {who: 1, text: '放心，我早就准备好了……', tone: 'dots'},
            {who: 0, text: '你确定？它已经开始冒烟了？', tone: 'ask'},
            {who: 1, text: '哈哈，看我的！', tone: 'happy'},
          ]}
          frames={300}
        />
    </Sequence>
  </Shot>
);

const CreditsRollExample: FC = () => (
  <Shot plate="A">
    <Sequence from={15} durationInFrames={480}>
      <InfoCreditsRoll
          closing="谢谢观看"
          sections={[
            {title: '出品', rows: [['导演', '红石阿明'], ['制片', '小蓝同学'], ['监制', '优易库工作室']]},
            {title: '制作', rows: [['策划', '诺尔'], ['美术', '祖里'], ['动画', '凯'], ['剪辑', '艾利克斯'], ['配乐', '史蒂夫'], ['音效', '末影龙']]},
            {title: '特别鸣谢', names: ['苦力怕', '僵尸村民', '小白猫', '铁傀儡', '末影人', '所有弹幕的你']},
            {
              title: '赞助名单',
              tiers: [
                {label: '钻石赞助', icon: 'diamond', color: '#55ffff', names: ['星野', 'BlockMaster', '夜航船']},
                {label: '黄金赞助', icon: 'gold_ingot', color: '#ffd35a', names: ['小南瓜', 'Pixel_Fox', '三七', '雨后']},
              ],
            },
          ]}
          frames={480}
        />
    </Sequence>
  </Shot>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'info-chapter-ore', Component: ChapterOreExample, frames: 180},
  {id: 'info-chapter-stone', Component: ChapterStoneExample, frames: 180},
  {id: 'info-chapter-flat', Component: ChapterFlatExample, frames: 180},
  {id: 'info-lower-third-ore', Component: LowerThirdOreExample, frames: 165},
  {id: 'info-lower-third-cute', Component: LowerThirdCuteExample, frames: 165},
  {id: 'info-toast-advancement', Component: AdvancementToastsExample, frames: 270},
  {id: 'info-stat-bars', Component: StatBarsExample, frames: 270},
  {id: 'info-compare-bars', Component: CompareBarsExample, frames: 260},
  {id: 'info-leaderboard', Component: LeaderboardExample, frames: 310},
  {id: 'info-countdown-big', Component: CountdownBigExample, frames: 260},
  {id: 'info-coord-tag', Component: CoordTagsExample, frames: 230},
  {id: 'info-ingredient-list', Component: IngredientListExample, frames: 280},
  {id: 'info-subtitle-dialog', Component: DialogSubtitleExample, frames: 330},
  {id: 'info-sponsor-credit', Component: CreditsRollExample, frames: 510},
];
