import type {FC} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {
  ItemBrew,
  ItemChestLoot,
  ItemCraft,
  ItemDropBounce,
  ItemEnchant,
  ItemFurnace,
  ItemInventorySort,
  ItemPickup,
  ItemRarityShowcase,
  ItemSmithing,
  ItemUpgradeChain,
} from './item';

/**
 * Runnable examples for the item group (classicOthers / item). Each example is the runnable version of the catalog `example`
 * (generated from the same snippet). `Footage` stands in for real gameplay footage; the item effects are transparent overlays placed with <Sequence>.
 */

/** Stand-in footage: a muted gradient scene so white UI text and bright particles stay readable. */
const Footage: FC<{tone?: 'day' | 'dusk' | 'cave'}> = ({tone = 'cave'}) => {
  const sky = tone === 'day' ? 'linear-gradient(180deg, #4f9be8 0%, #9fd2ff 46%, #d8f0ff 58%)' : tone === 'dusk' ? 'linear-gradient(180deg, #1c2050 0%, #6a4a7a 40%, #e29a60 58%)' : 'linear-gradient(180deg, #1d2a33 0%, #28404a 55%, #1a2a30 100%)';
  const ground = tone === 'day' ? '#3f7d34' : tone === 'dusk' ? '#2c2a3e' : '#1e1f22';
  return (
    <AbsoluteFill style={{background: sky}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: tone === 'cave' ? 760 : 560, bottom: 0, background: ground}} />
      {tone !== 'cave' && <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 16, background: 'rgba(255,255,255,0.18)'}} />}
    </AbsoluteFill>
  );
};

const ExCraftTable: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={150}>
      <ItemCraft
        result="iron_pickaxe"
        accent="#d4d6da"
        subtitle="铁镐 · 3×3 配方"
        panelTitle="合成 · 铁镐"
        doneChip="普通 · 铁镐"
        tooltip={[{text: '铁镐', color: '#ffffff'}, {text: '效率 · 挖掘等级 2', color: '#a8a8a8'}]}
        ingredients={[
          {id: 'iron_ingot', c: 0, r: 0, at: 14, from: [1700, 940]},
          {id: 'iron_ingot', c: 1, r: 0, at: 20, from: [1640, 960]},
          {id: 'iron_ingot', c: 2, r: 0, at: 26, from: [1760, 930]},
          {id: 'stick', c: 1, r: 1, at: 34, from: [250, 950]},
          {id: 'stick', c: 1, r: 2, at: 40, from: [190, 970]},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExFurnace: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={160}>
      <ItemFurnace
        input="raw_gold"
        output="gold_ingot"
        subtitle="金矿 → 金锭 · 烧炼"
        panelTitle="熔炉 · 烧炼金锭"
        pickupText="+1 金锭"
        hotbar={[{id: 'iron_pickaxe'}, {id: 'iron_sword'}, {id: 'torch', count: 26}, {id: 'bread', count: 12}, {id: 'gold_ingot', count: 3}, {id: 'coal', count: 41}, {id: 'cooked_beef', count: 8}, {id: 'water_bucket'}, {id: 'oak_planks', count: 64}]}
        recipes={[['raw_gold', 'gold_ingot'], ['raw_iron', 'iron_ingot'], ['raw_copper', 'copper_ingot']]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExSmithing: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={190}>
      <ItemSmithing showHead={false} hits={[58, 74, 90]} hint="钻石剑 + 下界合金锭 + 升级模板" />
    </Sequence>
  </AbsoluteFill>
);

const ExEnchanting: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={200}>
      <ItemEnchant
        item="diamond_pickaxe"
        subtitle="符文低语 · 为钻石镐附魔"
        panelTitle="附魔台 · 钻石镐"
        options={[
          {text: '效率 2', cost: 1, level: 8, seed: 3, tip: '效率 II…?'},
          {text: '耐久 3', cost: 2, level: 17, seed: 11, tip: '耐久 III…?'},
          {text: '时运 3', cost: 3, level: 30, seed: 23, tip: '时运 III…?'},
        ]}
        resultTooltip={[{text: '钻石镐', color: '#55ffff'}, {text: '时运 III', color: '#b57cff'}, {text: '效率 · 挖掘等级 4', color: '#a8a8a8'}]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExBrewing: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={240}>
      <ItemBrew
        subtitle="水瓶 → 粗制 → 治疗药水"
        panelTitle="酿造台 · 治疗药水"
        stages={[
          {ingredient: 'nether_wart', name: '粗制药水', color: '#9a6fdc'},
          {ingredient: 'glistering_melon_slice', name: '治疗药水', color: '#ff4d4d'},
        ]}
        tooltip={[{text: '治疗药水', color: '#ff6a6a'}, {text: '瞬间治疗', color: '#ff6a6a'}, {text: '立即恢复 4 点生命', color: '#a8a8a8'}]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExDropBounce: FC = () => (
  <AbsoluteFill>
    <Footage tone="dusk" />
    <Sequence from={20} durationInFrames={150}>
      <ItemDropBounce
        items={[
          {id: 'iron_ingot', x: 480, row: 1, order: 1},
          {id: 'diamond', x: 960, row: 1, order: 0, rar: 'rare', name: '钻石'},
          {id: 'emerald', x: 1440, row: 1, order: 2, rar: 'uncommon', name: '绿宝石'},
          {id: 'nether_star', x: 720, row: 2, order: 3, rar: 'epic', name: '下界之星'},
          {id: 'golden_apple', x: 1200, row: 2, order: 4, rar: 'rare', name: '金苹果'},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExPickup: FC = () => (
  <AbsoluteFill>
    <Footage tone="day" />
    <Sequence from={20} durationInFrames={140}>
      <ItemPickup
        picks={[
          {id: 'diamond', name: '钻石', x: 480, gy: 700, s: 1, slot: 4, at: 26, rar: 'rare', col: ['#ffffff', '#55ffff', '#aaf6ff']},
          {id: 'iron_ingot', name: '铁锭', x: 960, gy: 640, s: 0.9, slot: 2, at: 52, col: ['#ffffff', '#d4d6da', '#9a9ca2']},
          {id: 'golden_apple', name: '金苹果', x: 1440, gy: 740, s: 1.1, slot: 6, at: 78, rar: 'rare', col: ['#ffffff', '#ffd23f', '#ffaa00']},
        ]}
        showLog={false}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExUpgradeChain: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={215}>
      <ItemUpgradeChain title="装备进化" subtitle="木 → 石 → 铁 → 金 → 钻石 → 下界合金" levelText="等级 {n} / {total}" />
    </Sequence>
  </AbsoluteFill>
);

const ExRarityShowcase: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={200}>
      <ItemRarityShowcase
        title="战利品品质"
        subtitle="普通 · 罕见 · 稀有 · 史诗"
        finaleText="史诗掉落!"
        cards={[
          {rar: 'common', id: 'stone_sword', name: '石剑', lines: ['攻击伤害 5', '耐久 131'], stars: 1},
          {rar: 'uncommon', id: 'golden_carrot', name: '金胡萝卜', lines: ['饱和度极高', '酿造夜视药水'], stars: 2, glint: true},
          {rar: 'rare', id: 'diamond_chestplate', name: '钻石胸甲', lines: ['防御 8', '耐久 528'], stars: 3},
          {rar: 'epic', id: 'totem_of_undying', name: '不死图腾', lines: ['免于一次死亡', '再生 II · 吸收 II'], stars: 4, glint: true},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExChestLoot: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={200}>
      <ItemChestLoot
        panelTitle="地牢宝箱"
        loot={[
          {id: 'bread', c: 1, r: 0, count: 3},
          {id: 'iron_ingot', c: 2, r: 0, count: 5},
          {id: 'diamond', c: 3, r: 0, count: 2, rar: 'rare', name: '钻石'},
          {id: 'arrow', c: 4, r: 0, count: 12},
          {id: 'emerald', c: 5, r: 0, count: 4},
          {id: 'enchanted_book', c: 1, r: 1, rar: 'rare', name: '附魔书'},
          {id: 'experience_bottle', c: 2, r: 1, count: 3},
          {id: 'totem_of_undying', c: 3, r: 1, rar: 'epic', name: '不死图腾'},
          {id: 'golden_apple', c: 4, r: 1, rar: 'rare', name: '金苹果'},
          {id: 'name_tag', c: 5, r: 1},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExInventorySort: FC = () => (
  <AbsoluteFill>
    <Footage tone="cave" />
    <Sequence from={20} durationInFrames={190}>
      <ItemInventorySort title="背包整理" subtitle="一键归位 · 合并堆叠" buttonText="整理" doneText="整理完成" seed={2026} />
    </Sequence>
  </AbsoluteFill>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'item-craft-table', Component: ExCraftTable, frames: 190},
  {id: 'item-furnace', Component: ExFurnace, frames: 200},
  {id: 'item-smithing', Component: ExSmithing, frames: 230},
  {id: 'item-enchanting', Component: ExEnchanting, frames: 240},
  {id: 'item-brewing', Component: ExBrewing, frames: 280},
  {id: 'item-drop-bounce', Component: ExDropBounce, frames: 190},
  {id: 'item-pickup', Component: ExPickup, frames: 180},
  {id: 'item-upgrade-chain', Component: ExUpgradeChain, frames: 255},
  {id: 'item-rarity-showcase', Component: ExRarityShowcase, frames: 240},
  {id: 'item-chest-loot', Component: ExChestLoot, frames: 240},
  {id: 'item-inventory-sort', Component: ExInventorySort, frames: 230},
];
