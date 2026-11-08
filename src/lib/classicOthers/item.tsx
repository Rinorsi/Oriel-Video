import type {FC} from 'react';
import type {RarityKey} from '../../gallery/fx/item/kit';
import {CraftTable, type CraftIngredient, type CraftProps} from '../../gallery/fx/item/craft';
import {Furnace, type FurnaceProps} from '../../gallery/fx/item/furnace';
import {Smithing, type SmithingInput, type SmithingProps} from '../../gallery/fx/item/smithing';
import {Enchanting, type EnchantOption, type EnchantProps} from '../../gallery/fx/item/enchant';
import {Brewing, type BrewStage, type BrewProps} from '../../gallery/fx/item/brew';
import {DropBounce, type DropItem, type DropProps} from '../../gallery/fx/item/drop';
import {Pickup, type PickupItem, type PickupProps} from '../../gallery/fx/item/pickup';
import {UpgradeChain, type UpgradeTier, type UpgradeProps} from '../../gallery/fx/item/upgrade';
import {RarityShowcaseShake, type RarityCard, type RarityProps} from '../../gallery/fx/item/rarity';
import {ChestLoot, type ChestLootItem, type ChestProps} from '../../gallery/fx/item/chest';
import {InventorySort, type SortEntry, type SortCat, type SortCatDef, type SortProps} from '../../gallery/fx/item/sort';

/**
 * Library layer for the item group (classicOthers / item). Prefix `Item`.
 * Place with <Sequence from durationInFrames> (local frame 0 = first frame). Default frame counts are in the catalog.
 * Every component is transparent by default (`bg` is false): you only get the UI panels, items, particles and flashes
 * on top of your own footage. Pass `bg` to get the full showcase scene (room, vignette, side decorations) as in the gallery.
 * Every text / item id / colour / list / timing is a prop (defaults equal the gallery demo). `audio` (default true) toggles the built-in sound effects.
 * `showHead` toggles the top-left title block (title / subtitle / tag).
 * Sizes assume a 1920x1080 composition.
 */

export type {RarityKey as ItemRarityKey};

export type ItemCraftIngredient = CraftIngredient;
export type ItemSmithingInput = SmithingInput;
export type ItemEnchantOption = EnchantOption;
export type ItemBrewStage = BrewStage;
export type ItemDropItem = DropItem;
export type ItemPickupItem = PickupItem;
export type ItemUpgradeTier = UpgradeTier;
export type ItemRarityCard = RarityCard;
export type ItemChestLootItem = ChestLootItem;
export type ItemSortEntry = SortEntry;
export type ItemSortCat = SortCat;
export type ItemSortCatDef = SortCatDef;

/** 合成台:3×3 配方,材料从两侧飞入落格,箭头走满,材料汇聚后成品砸出(射线+冲击+提示框)。默认透明,仅保留面板/格子/物品/特效;bg 打开完整木工坊场景。约 150 帧。 */
export type ItemCraftProps = {
  /** 是否绘制木工坊背景(木板墙、地板、灯光、工具墙、方块架、材料堆、暗角、飘尘);false 时只剩面板/格子/物品/特效(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 成品物品 id */
  result?: string;
  /** 成品强调色(光晕、冲击、粒子), #rrggbb */
  accent?: string;
  /** 材料列表(位置、飞入时间、起点);下方材料清单由它自动统计 */
  ingredients?: ItemCraftIngredient[];
  /** 成品提示框行(rare 样式) */
  tooltip?: {text: string; color?: string}[];
  /** 配方类型标签(左) */
  recipeChip?: string;
  /** 材料数量标签(完成前),默认按材料数生成「材料 N 件」 */
  countChip?: string;
  /** 完成后的稀有度标签 */
  doneChip?: string;
  /** 箭头上方状态:未开始 */
  labelIdle?: string;
  /** 箭头上方状态:合成中 */
  labelWorking?: string;
  /** 箭头上方状态:完成 */
  labelDone?: string;
  /** 箭头开始填充的本地帧 */
  fillAt?: number;
  /** 材料汇聚进成品格的本地帧 */
  gatherAt?: number;
  /** 成品砸出(爆发)的本地帧 */
  slamAt?: number;
};
/** 合成台:3×3 配方,材料从两侧飞入落格,箭头走满,材料汇聚后成品砸出(射线+冲击+提示框)。默认透明,仅保留面板/格子/物品/特效;bg 打开完整木工坊场景。约 150 帧。 */
export const ItemCraft: FC<ItemCraftProps> = (p) => <CraftTable {...p} bg={p.bg ?? false} />;

/** 熔炉烧炼:原料与燃料落入熔炉界面,火焰点燃、进度箭头走满,产物带火星与经验球弹出,鼠标把它放进快捷栏。默认透明;bg 打开完整炉房。约 160 帧。 */
export type ItemFurnaceProps = {
  /** 是否绘制炉房背景(石砖墙、炉火辉光、两侧炉子与材料堆、飘尘、暗角);false 时只剩面板/物品/特效/快捷栏(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 强调色(标题点缀),#rrggbb */
  accent?: string;
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 待烧炼物品 id */
  input?: string;
  /** 燃料物品 id */
  fuel?: string;
  /** 产物物品 id */
  output?: string;
  /** 放入的待烧炼物品数量(完成后少 1) */
  inputCount?: number;
  /** 放入的燃料数量(点火后少 1) */
  fuelCount?: number;
  /** 快捷栏 9 格内容(产物落入 targetSlot,数量 +1) */
  hotbar?: {id?: string; count?: number}[];
  /** 产物落入的快捷栏格序号(0-8) */
  targetSlot?: number;
  /** 产物落入时飘出的文字 */
  pickupText?: string;
  /** 右侧「可烧炼」列表标题 */
  listTitle?: string;
  /** 右侧列表 [原料 id, 产物 id],第一行为当前配方 */
  recipes?: [string, string][];
  /** 经验标签(烧炼前) */
  xpChip?: string;
  /** 经验标签(烧炼完成后) */
  xpDoneChip?: string;
  /** 烧炼时间标签 */
  timeChip?: string;
  /** 箭头上方状态:等待放入 */
  labelIdle?: string;
  /** 箭头上方状态:烧炼中 */
  labelWorking?: string;
  /** 箭头上方状态:完成 */
  labelDone?: string;
  /** 待烧炼物品飞入的本地帧 */
  oreAt?: number;
  /** 燃料飞入的本地帧 */
  coalAt?: number;
  /** 火焰点燃的本地帧 */
  flameAt?: number;
  /** 进度箭头开始填充的本地帧 */
  fillAt?: number;
  /** 进度箭头走满所需帧数(产物在 fillAt+fillDur 弹出) */
  fillDur?: number;
  /** 鼠标点起产物的本地帧 */
  clickAt?: number;
  /** 产物放进快捷栏的本地帧 */
  dropAt?: number;
};
/** 熔炉烧炼:原料与燃料落入熔炉界面,火焰点燃、进度箭头走满,产物带火星与经验球弹出,鼠标把它放进快捷栏。默认透明;bg 打开完整炉房。约 160 帧。 */
export const ItemFurnace: FC<ItemFurnaceProps> = (p) => <Furnace {...p} bg={p.bg ?? false} />;

/** 锻造台升级:模板+装备+材料落入界面,铁锤三次敲击铁砧(火花+震屏+箭头分段),三者汇聚后成品炸出。默认透明;bg 打开完整锻造房。约 190 帧。 */
export type ItemSmithingProps = {
  /** 是否绘制锻造房背景(深板岩墙、炉火与熔岩槽、工具架、材料堆、飘火、暗角);false 时只剩面板/铁砧/锤子/特效(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 标题点缀色,#rrggbb */
  accent?: string;
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 三个输入格:[模板, 基础装备, 材料],含物品 id、飞入起点与时间;第三项同时是铁砧上被锤击的毛坯 */
  inputs?: [ItemSmithingInput, ItemSmithingInput, ItemSmithingInput];
  /** 三个输入格下方的小标签 */
  slotLabels?: [string, string, string];
  /** 成品物品 id */
  result?: string;
  /** 成品提示框行(rare 样式) */
  tooltip?: {text: string; color?: string}[];
  /** 三次锤击的本地帧 */
  hits?: [number, number, number];
  /** 三个输入汇聚进成品格的本地帧 */
  mergeAt?: number;
  /** 成品砸出(爆发)的本地帧 */
  slamAt?: number;
  /** 锤击计数小标签前缀(「锤击 1」「锤击 2」…) */
  hitLabel?: string;
  /** 箭头上方状态前缀(「锻造 1/3」) */
  forgeLabel?: string;
  /** 箭头上方状态:未开始 */
  labelIdle?: string;
  /** 箭头上方状态:完成 */
  labelDone?: string;
  /** 配方说明小字 */
  hint?: string;
  /** 右侧属性栏标题 */
  statsTitle?: string;
  /** 第一条属性名 */
  atkLabel?: string;
  /** 第二条属性名 */
  durLabel?: string;
  /** 第一条属性:升级前数值 */
  atkFrom?: number;
  /** 第一条属性:升级后数值 */
  atkTo?: number;
  /** 第二条属性:升级前数值 */
  durFrom?: number;
  /** 第二条属性:升级后数值 */
  durTo?: number;
};
/** 锻造台升级:模板+装备+材料落入界面,铁锤三次敲击铁砧(火花+震屏+箭头分段),三者汇聚后成品炸出。默认透明;bg 打开完整锻造房。约 190 帧。 */
export const ItemSmithing: FC<ItemSmithingProps> = (p) => <Smithing {...p} bg={p.bg ?? false} />;

/** 附魔台:物品与青金石放入,三个附魔选项悬停时符文翻成文字,选中后符文旋入物品、符文柱升起、紫光炸开。默认透明;bg 打开书架魔法厅。约 200 帧。 */
export type ItemEnchantProps = {
  /** 是否绘制魔法厅背景(书架墙、紫光、符文带、漂浮符文、悬浮附魔书、飘尘、暗角);false 时只剩面板/物品/特效/经验条(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 标题点缀色,#rrggbb */
  accent?: string;
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 被附魔的物品 id */
  item?: string;
  /** 消耗品物品 id(青金石) */
  lapis?: string;
  /** 物品格上方小标签 */
  itemLabel?: string;
  /** 消耗品格下方小标签 */
  lapisLabel?: string;
  /** 放入的消耗品数量 */
  lapisCount?: number;
  /** 三个附魔选项(文字、青金石数、等级、符文种子、提示) */
  options?: ItemEnchantOption[];
  /** 最终被选中的选项序号(0-2) */
  selected?: number;
  /** 三个选项各自的悬停起止帧 [起, 止] */
  hover?: [number, number][];
  /** 悬停提示框第二行模板,{cost} {level} 会被替换 */
  costLine?: string;
  /** 附魔完成后的成品提示框行(rare 样式) */
  resultTooltip?: {text: string; color?: string}[];
  /** 左下角书架标签 */
  shelfChip?: string;
  /** 左下角附魔力标签(附魔前) */
  powerChip?: string;
  /** 左下角附魔力标签(附魔后) */
  doneChip?: string;
  /** 附魔成功飘字 */
  successText?: string;
  /** 扣除等级飘字 */
  levelText?: string;
  /** 附魔前玩家等级 */
  levelBefore?: number;
  /** 附魔后玩家等级 */
  levelAfter?: number;
  /** 物品飞入的本地帧 */
  itemAt?: number;
  /** 消耗品飞入的本地帧 */
  lapisAt?: number;
  /** 点选选项的本地帧 */
  selectAt?: number;
  /** 附魔完成(爆发)的本地帧 */
  bangAt?: number;
};
/** 附魔台:物品与青金石放入,三个附魔选项悬停时符文翻成文字,选中后符文旋入物品、符文柱升起、紫光炸开。默认透明;bg 打开书架魔法厅。约 200 帧。 */
export const ItemEnchant: FC<ItemEnchantProps> = (p) => <Enchanting {...p} bg={p.bg ?? false} />;

/** 酿造台:水瓶、烈焰粉、材料依次放入,蒸汽气泡升起,药水两轮变色,三瓶合一举起发光。默认透明;bg 打开酿造地窖。约 240 帧。 */
export type ItemBrewProps = {
  /** 是否绘制酿造地窖背景(苔石墙、彩色辉光、药瓶架、灵魂灯笼、炼药锅、材料堆、蒸汽、飘尘、暗角);false 时只剩面板/药水/特效(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 标题点缀色,#rrggbb */
  accent?: string;
  /** 面板顶部分节标题 */
  panelTitle?: string;
  /** 燃料物品 id */
  fuel?: string;
  /** 起始水瓶液体颜色,#rrggbb */
  waterColor?: string;
  /** 两轮酿造:材料、阶段名称、液体颜色(最后一轮的颜色即成品颜色) */
  stages?: [ItemBrewStage, ItemBrewStage];
  /** 起始状态标签(第一轮之前) */
  baseName?: string;
  /** 第二轮酿造中的标签 */
  brewingText?: string;
  /** 轮次标签模板,{n} 会被替换为当前轮次 */
  roundText?: string;
  /** 燃料格上方小标签 */
  fuelLabel?: string;
  /** 材料格上方小标签 */
  ingredientLabel?: string;
  /** 状态:酿造中 */
  labelWorking?: string;
  /** 状态:完成 */
  labelDone?: string;
  /** 状态:待命 */
  labelIdle?: string;
  /** 成品提示框行(rare 样式) */
  tooltip?: {text: string; color?: string}[];
  /** 成品合体后的飘字 */
  doneText?: string;
  /** 三个水瓶飞入的本地帧 */
  bottlesAt?: [number, number, number];
  /** 燃料飞入的本地帧 */
  fuelAt?: number;
  /** 第一种材料飞入的本地帧 */
  ingredient1At?: number;
  /** 第一轮酿造的 [开始, 结束] 帧 */
  brew1?: [number, number];
  /** 第二种材料飞入的本地帧 */
  ingredient2At?: number;
  /** 第二轮酿造的 [开始, 结束] 帧 */
  brew2?: [number, number];
  /** 三瓶举起(完成)的本地帧 */
  doneAt?: number;
  /** 三瓶合一的本地帧 */
  mergeAt?: number;
};
/** 酿造台:水瓶、烈焰粉、材料依次放入,蒸汽气泡升起,药水两轮变色,三瓶合一举起发光。默认透明;bg 打开酿造地窖。约 240 帧。 */
export const ItemBrew: FC<ItemBrewProps> = (p) => <Brewing {...p} bg={p.bg ?? false} />;

/** 物品掉落弹跳:一批物品分三排从天而降,旋转、三次弹跳、落地扬尘,稀有物品拉起光柱并挂名牌。默认透明,可直接叠在地面画面上;bg 加黄昏天空与透视地面。约 150 帧。 */
export type ItemDropBounceProps = {
  /** 是否绘制黄昏天空与透视地面;默认不画(透明) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 掉落物列表 */
  items?: ItemDropItem[];
  /** 三排的地面 y 坐标与缩放 */
  rows?: {gy: number; s: number}[];
  /** 物品基础尺寸(像素,乘以排缩放) */
  baseSize?: number;
  /** 下落帧数 */
  fallFrames?: number;
  /** 每次弹跳的帧数 */
  bounceFrames?: number[];
  /** 每次弹跳的高度(像素) */
  bounceHeights?: number[];
  /** 第一件物品开始下落的本地帧 */
  startAt?: number;
  /** 相邻掉落顺序之间的间隔帧 */
  step?: number;
};
/** 物品掉落弹跳:一批物品分三排从天而降,旋转、三次弹跳、落地扬尘,稀有物品拉起光柱并挂名牌。默认透明,可直接叠在地面画面上;bg 加黄昏天空与透视地面。约 150 帧。 */
export const ItemDropBounce: FC<ItemDropBounceProps> = (p) => <DropBounce {...p} bg={p.bg ?? false} />;

/** 拾取飞入:地面物品依次被吸向快捷栏,拖残影飞入槽位,槽位闪白弹跳、数量 +1,右侧拾取日志滚动。默认透明,叠在实机画面上;bg 加白天天空与草地。约 140 帧。 */
export type ItemPickupProps = {
  /** 是否绘制白天天空与草地;默认不画(透明) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示快捷栏上方的经验条、生命与饥饿 */
  status?: boolean;
  /** 是否显示右侧拾取日志 */
  showLog?: boolean;
  /** 被拾取的物品列表(位置、目标格、拾取时间) */
  picks?: ItemPickupItem[];
  /** 快捷栏 9 格初始内容(拾取后数量逐个 +1) */
  baseSlots?: {id?: string; count?: number}[];
  /** 从被吸走到落入格子的飞行帧数 */
  pullFrames?: number;
  /** 右侧日志文字模板,{name} 会被替换 */
  logText?: string;
  /** 落入格子时的飘字模板,{name} 会被替换 */
  floatText?: string;
};
/** 拾取飞入:地面物品依次被吸向快捷栏,拖残影飞入槽位,槽位闪白弹跳、数量 +1,右侧拾取日志滚动。默认透明,叠在实机画面上;bg 加白天天空与草地。约 140 帧。 */
export const ItemPickup: FC<ItemPickupProps> = (p) => <Pickup {...p} bg={p.bg ?? false} />;

/** 升级进化链:六把剑依次进化,材料飞入、十字闪光与碎片、属性条与等级条推进,最后全屏炫光。默认透明(无随级换色背景);bg 打开完整背景。约 215 帧。 */
export type ItemUpgradeChainProps = {
  /** 是否绘制随等级换色的背景(底色、物品图案、辉光、射线、飘尘、暗角);false 时只剩面板/主体物品/特效(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 进化各级(建议 6 级:左侧路线列表容纳 6 行) */
  tiers?: ItemUpgradeTier[];
  /** 各级出现的本地帧,长度与 tiers 相同,第一项通常为 0 */
  times?: number[];
  /** 左侧属性面板标题 */
  statsTitle?: string;
  /** 右侧路线面板标题 */
  routeTitle?: string;
  /** 第一条属性名 */
  atkLabel?: string;
  /** 第二条属性名 */
  durLabel?: string;
  /** 第三条属性名(固定值,不随等级变化) */
  speedLabel?: string;
  /** 第三条属性值文字 */
  speedValue?: string;
  /** 第三条属性条的填充比例 0-1 */
  speedFill?: number;
  /** 等级标签模板,{n} 当前级、{total} 总级数 */
  levelText?: string;
  /** 每次升级的飘字 */
  upText?: string;
  /** 最终级的飘字 */
  finalText?: string;
};
/** 升级进化链:六把剑依次进化,材料飞入、十字闪光与碎片、属性条与等级条推进,最后全屏炫光。默认透明(无随级换色背景);bg 打开完整背景。约 215 帧。 */
export const ItemUpgradeChain: FC<ItemUpgradeChainProps> = (p) => <UpgradeChain {...p} bg={p.bg ?? false} />;

/** 稀有度展示:四张物品卡依次翻出,光效逐级加码到史诗卡的紫色射线与符文柱。默认透明;bg 打开暗色底与暗角。约 200 帧。 */
export type ItemRarityShowcaseProps = {
  /** 是否绘制暗色渐变底、斜纹、史诗紫色背景光、飘尘与暗角;false 时只剩卡片/光柱/粒子/稀有度轨道(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 四张卡:稀有度、物品、名称、说明、星级(按顺序从左到右翻出) */
  cards?: ItemRarityCard[];
  /** 每张卡开始翻转的本地帧,长度 4 */
  flipAt?: number[];
  /** 稀有度显示名,缺省用默认「普通/罕见/稀有/史诗」 */
  rarityNames?: Partial<Record<RarityKey, string>>;
  /** 卡背上的符号 */
  backText?: string;
  /** 最后一张(史诗)翻出后的大字飘字 */
  finaleText?: string;
};
/** 稀有度展示:四张物品卡依次翻出,光效逐级加码到史诗卡的紫色射线与符文柱。默认透明;bg 打开暗色底与暗角。约 200 帧。 */
export const ItemRarityShowcase: FC<ItemRarityShowcaseProps> = (p) => <RarityShowcaseShake {...p} bg={p.bg ?? false} />;

/** 开箱战利品:宝箱抖动掀盖金光炸开,物品按弧线喷出落入战利品网格,稀有物品逐个放大高亮挂名牌。默认透明;bg 打开火把地牢。约 200 帧。 */
export type ItemChestLootProps = {
  /** 是否绘制地牢背景(苔石墙、金色辉光、地板、四支火把、木桶与金块、材料堆、飘尘、暗角);false 时只剩宝箱/战利品面板/特效(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 标题点缀色,#rrggbb */
  accent?: string;
  /** 战利品面板标题 */
  panelTitle?: string;
  /** 战利品列表(位置、数量、稀有度),喷出顺序见 order */
  loot?: ItemChestLootItem[];
  /** 喷出顺序:loot 下标的排列;默认 21 件用内置乱序,其他数量按列表顺序 */
  order?: number[];
  /** 稀有计数标签前缀 */
  rareLabel?: string;
  /** 全部稀有物品高亮后的飘字 */
  rareText?: string;
  /** 宝箱开始抖动的本地帧 */
  rattleAt?: number;
  /** 宝箱开盖的本地帧 */
  openAt?: number;
  /** 第一件物品喷出的本地帧 */
  spewAt?: number;
  /** 相邻物品喷出的间隔帧 */
  spewStep?: number;
  /** 第一件稀有物品开始高亮的本地帧 */
  highlightAt?: number;
  /** 相邻稀有物品高亮的间隔帧 */
  highlightStep?: number;
};
/** 开箱战利品:宝箱抖动掀盖金光炸开,物品按弧线喷出落入战利品网格,稀有物品逐个放大高亮挂名牌。默认透明;bg 打开火把地牢。约 200 帧。 */
export const ItemChestLoot: FC<ItemChestLootProps> = (p) => <ChestLoot {...p} bg={p.bg ?? false} />;

/** 物品栏整理:杂乱的 9×4 背包里鼠标按下「整理」,所有堆叠飞向各自位置,同类合并、数量相加,四行依次亮起归类。默认透明;bg 打开深色底与储物堆。约 190 帧。 */
export type ItemInventorySortProps = {
  /** 是否绘制深色渐变底、方格纹、两侧储物堆、飘尘与暗角;false 时只剩面板/物品/特效/快捷栏(库默认 false,即透明;画廊 Demo 为 true) */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 标题点缀色,#rrggbb */
  accent?: string;
  /** 四行整理结果,每行一个分类(行内第一项决定该行分类) */
  rows?: ItemSortEntry[][];
  /** 四个分类的名称、颜色、图标 */
  cats?: Record<ItemSortCat, ItemSortCatDef>;
  /** 背包面板标题 */
  panelTitle?: string;
  /** 左侧分类面板标题 */
  legendTitle?: string;
  /** 右侧合并面板标题 */
  mergeTitle?: string;
  /** 面板上的 5 个标签页文字 */
  tabs?: string[];
  /** 整理按钮文字(点击前) */
  buttonText?: string;
  /** 整理按钮文字(完成后) */
  buttonDoneText?: string;
  /** 底部「堆叠」标签模板,{n} 为数量 */
  stackChip?: string;
  /** 底部「空位」标签模板,{n} 为数量 */
  emptyChip?: string;
  /** 底部状态标签:整理前 */
  messyText?: string;
  /** 底部状态标签:整理后 */
  tidyText?: string;
  /** 全部完成后的飘字 */
  doneText?: string;
  /** 底部快捷栏 9 格内容 */
  hotbar?: {id?: string; count?: number}[];
  /** 初始乱序的随机种子 */
  seed?: number;
  /** 鼠标点击「整理」的本地帧 */
  clickAt?: number;
  /** 堆叠升起的本地帧 */
  liftAt?: number;
  /** 堆叠开始飞行的本地帧 */
  flyAt?: number;
};
/** 物品栏整理:杂乱的 9×4 背包里鼠标按下「整理」,所有堆叠飞向各自位置,同类合并、数量相加,四行依次亮起归类。默认透明;bg 打开深色底与储物堆。约 190 帧。 */
export const ItemInventorySort: FC<ItemInventorySortProps> = (p) => <InventorySort {...p} bg={p.bg ?? false} />;
