import type {FxEntry} from '../../types';
import {CRAFT_FRAMES, CraftTable} from './craft';
import {FURNACE_FRAMES, Furnace} from './furnace';
import {SMITHING_FRAMES, Smithing} from './smithing';
import {ENCHANT_FRAMES, Enchanting} from './enchant';
import {BREW_FRAMES, Brewing} from './brew';
import {DROP_FRAMES, DropBounce} from './drop';
import {PICKUP_FRAMES, Pickup} from './pickup';
import {UPGRADE_FRAMES, UpgradeChain} from './upgrade';
import {RARITY_FRAMES, RarityShowcaseShake} from './rarity';
import {CHEST_FRAMES, ChestLoot} from './chest';
import {InventorySort, SORT_FRAMES} from './sort';

/** Entries for the item area. Add yours to this array. */
export const entries: FxEntry[] = [
  {
    meta: {
      id: 'item-craft-table',
      name: '合成台',
      category: 'item',
      tags: ['合成', '配方', '工坊', '成品'],
      frames: CRAFT_FRAMES,
      blurb: '木工坊里的 3×3 合成：材料从两侧材料堆飞入落进格子，箭头走满，材料汇聚后钻石镐砸出，带射线、冲击波和提示框。',
      usage: '讲合成配方、展示新物品的获得。',
    },
    Demo: CraftTable,
  },
  {
    meta: {
      id: 'item-furnace',
      name: '熔炉烧炼',
      category: 'item',
      tags: ['熔炉', '烧炼', '火焰', '铁锭'],
      frames: FURNACE_FRAMES,
      blurb: '石砖炉房里，生铁与煤炭落入熔炉，火焰点燃、进度箭头走满，铁锭带火星与经验球弹出，鼠标把它放进快捷栏。',
      usage: '讲烧炼、冶炼流程，或展示自动化前的手动步骤。',
    },
    Demo: Furnace,
  },
  {
    meta: {
      id: 'item-smithing',
      name: '锻造台升级',
      category: 'item',
      tags: ['锻造', '下界合金', '铁砧', '火花'],
      frames: SMITHING_FRAMES,
      blurb: '模板、钻石剑、下界合金锭落入锻造台，铁锤三次砸在铁砧上火花四溅、箭头分段走满，三格合并炸出带火焰与紫光的下界合金剑。',
      usage: '讲下界合金升级、装备进化、铁匠与工坊主题。',
    },
    Demo: Smithing,
  },
  {
    meta: {
      id: 'item-enchanting',
      name: '附魔台',
      category: 'item',
      tags: ['附魔', '符文', '紫色', '书架'],
      frames: ENCHANT_FRAMES,
      blurb: '书架满墙的魔法厅，符文从书架飘向附魔台；三个附魔选项悬停时符文翻转成文字，选中后符文旋入钻石剑，符文柱升起、紫光炸开。',
      usage: '讲附魔、神秘物品获得、魔法系内容。',
    },
    Demo: Enchanting,
  },
  {
    meta: {
      id: 'item-brewing',
      name: '酿造台',
      category: 'item',
      tags: ['酿造', '药水', '蒸汽', '气泡'],
      frames: BREW_FRAMES,
      blurb: '水瓶、烈焰粉、地狱疣依次放入，蒸汽与气泡升起，药水两轮由蓝变紫再变粉，成品三瓶合一，举起发光。',
      usage: '讲药水配方、炼药流程、魔法/生存教程。',
    },
    Demo: Brewing,
  },
  {
    meta: {
      id: 'item-drop-bounce',
      name: '物品掉落弹跳',
      category: 'item',
      tags: ['掉落', '弹跳', '战利品', '粒子', '透明层'],
      frames: DROP_FRAMES,
      blurb: '十六件物品分三排从天而降，旋转、三次弹跳、落地扬尘并压扁回弹，地面有随高度变化的阴影，稀有物品拉起光柱并挂上名牌。',
      usage: '展示掉落物、战利品、奖励；透明层可叠在任意地面画面上。',
      params: [
        {name: 'bg', desc: 'true 时带黄昏天空与透视地面（Demo）；省略则透明（Layer）'},
        {name: 'ITEMS', desc: '源码顶部数组：物品 id、x 位置、排（0 远 / 1 中 / 2 近）、掉落顺序、稀有度与名牌'},
        {name: 'ROWS', desc: '三排的地面 y 与缩放'},
        {name: 'BOUNCE / HEIGHT', desc: '三次弹跳的时长与高度'},
      ],
    },
    Demo: () => <DropBounce bg />,
    Layer: () => <DropBounce />,
  },
  {
    meta: {
      id: 'item-pickup',
      name: '拾取飞入',
      category: 'item',
      tags: ['拾取', '物品栏', '快捷栏', '数量', '透明层'],
      frames: PICKUP_FRAMES,
      blurb: '地面上六件物品先后被吸向画面下方的快捷栏，拖着残影、噗地飞进槽位，槽位闪白弹跳、数量 +1，右侧拾取日志滚动。',
      usage: '展示获得物品、采集、掉落物回收；透明层可叠在实机画面上。',
      params: [
        {name: 'bg', desc: 'true 时带白天天空与草地（Demo）；省略则透明（Layer）'},
        {name: 'PICKS', desc: '源码顶部数组：物品、名称、地面位置、目标槽位、拾取帧'},
        {name: 'BASE_SLOTS', desc: '快捷栏初始内容（数量会随拾取累加）'},
        {name: 'PULL', desc: '飞入时长（帧）'},
      ],
    },
    Demo: () => <Pickup bg />,
    Layer: () => <Pickup />,
  },
  {
    meta: {
      id: 'item-upgrade-chain',
      name: '升级进化链',
      category: 'item',
      tags: ['升级', '进化', '剑', '等级条', '炫光'],
      frames: UPGRADE_FRAMES,
      blurb: '木、石、铁、金、钻石、下界合金六把剑依次进化：材料飞入、像素十字闪光与碎片飞溅、背景换色、属性条与等级条推进，最后全屏炫光。',
      usage: '讲装备进阶、工具升级路线、版本/等级成长。',
      params: [{name: 'TIERS', desc: '源码顶部数组：每级的剑、材料、名称、主题色、伤害与耐久'}, {name: 'T', desc: '每级进化发生的帧'}],
    },
    Demo: UpgradeChain,
  },
  {
    meta: {
      id: 'item-rarity-showcase',
      name: '稀有度展示',
      category: 'item',
      tags: ['稀有度', '卡片', '翻牌', '史诗', '符文'],
      frames: RARITY_FRAMES,
      blurb: '普通、罕见、稀有、史诗四张物品卡依次翻出，光效逐级加码：边框脉冲、光晕光柱，到史诗卡的紫色射线、两侧升腾的符文柱与上升粒子。',
      usage: '介绍物品分级、战利品品质、抽奖/掉落结果。',
      params: [{name: 'CARDS', desc: '源码顶部数组：每张卡的稀有度、物品、名称、说明行、星级'}, {name: 'TF', desc: '每张卡开始翻转的帧'}],
    },
    Demo: RarityShowcaseShake,
  },
  {
    meta: {
      id: 'item-chest-loot',
      name: '开箱战利品',
      category: 'item',
      tags: ['开箱', '战利品', '宝箱', '稀有', '网格'],
      frames: CHEST_FRAMES,
      blurb: '火把照亮的地牢里宝箱抖动、掀盖、金光炸开，二十一件物品按弧线喷出落入战利品网格，稀有物品逐个放大高亮并挂名牌。',
      usage: '开箱、宝藏、副本奖励、抽奖结果展示。',
      params: [{name: 'LOOT', desc: '源码顶部数组：物品 id、网格位置、数量、稀有度与名牌'}, {name: 'T_OPEN / T_SPEW / T_HI', desc: '开盖、喷出、稀有高亮的起始帧'}],
    },
    Demo: ChestLoot,
  },
  {
    meta: {
      id: 'item-inventory-sort',
      name: '物品栏整理',
      category: 'item',
      tags: ['整理', '背包', '分类', '合并堆叠', '数字'],
      frames: SORT_FRAMES,
      blurb: '杂乱的 9×4 背包里，鼠标按下“整理”：所有堆叠升起并沿弧线飞向各自位置，同类合并、数量相加，工具/方块/食物/材料四行依次亮起归类。',
      usage: '讲背包管理、自动整理模组、物品栏优化。',
      params: [{name: 'ROWS', desc: '源码顶部数组：每行的分类、物品、列位置、数量或要合并的两堆数量'}, {name: 'T_CLICK / T_FLY', desc: '点击与开始飞行的帧'}],
    },
    Demo: InventorySort,
  },
];
