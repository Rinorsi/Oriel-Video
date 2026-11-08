// Library exports for the classicOthers/info group (信息与字幕 overlays). See src/lib/README.md for the contract.
//
// All components are transparent overlays by default (`bg` false). Local frame 0 = first frame of the effect: place with
//   <Sequence from={120} durationInFrames={150}><InfoChapterOre title="..." frames={150} /></Sequence>
// Every effect animates IN, holds, and animates OUT inside its own `frames` window (the exit starts a fixed number of frames
// before `frames`), so give <Sequence durationInFrames> and the `frames` prop the same value.
// Sounds are on by default; pass `audio={false}` to mute. Several effects draw a translucent dark shade behind them
// (readability over footage); scale it with `dim` (0 = none).
import type {FC} from 'react';
import {ChapterOre, CHAPTER_ORE_FRAMES} from '../../gallery/fx/info/chapterOre';
import {ChapterStone, CHAPTER_STONE_FRAMES} from '../../gallery/fx/info/chapterStone';
import {ChapterFlat, CHAPTER_FLAT_FRAMES} from '../../gallery/fx/info/chapterFlat';
import {LowerThirdCute, LowerThirdOre, LOWER_CUTE_FRAMES, LOWER_ORE_FRAMES} from '../../gallery/fx/info/lowerThird';
import {AdvancementToasts, TOAST_FRAMES, type ToastSpec} from '../../gallery/fx/info/toasts';
import {StatBars, STAT_FRAMES, type StatEvent} from '../../gallery/fx/info/statBars';
import {CompareBars, COMPARE_FRAMES, type CompareRow, type CompareSide} from '../../gallery/fx/info/compareBars';
import {Leaderboard, BOARD_FRAMES, type BoardPlayer} from '../../gallery/fx/info/leaderboard';
import {CountdownBig, COUNTDOWN_FRAMES} from '../../gallery/fx/info/countdown';
import {CoordTags, COORD_FRAMES, type CoordSpec} from '../../gallery/fx/info/coordTag';
import {IngredientList, INGREDIENT_FRAMES, type IngredientRow} from '../../gallery/fx/info/ingredientList';
import {DialogSubtitle, DIALOG_FRAMES, type DialogLine, type DialogSpeaker} from '../../gallery/fx/info/dialogSubtitle';
import {CreditsRoll, CREDITS_FRAMES, type CreditSection} from '../../gallery/fx/info/credits';
import {AudioCtx} from '../../gallery/fx/info/ui';
import type {MascotKind} from '../../gallery/fx/info/mascot';

/** Default length (frames @30fps) of each info effect, equal to the gallery demo. */
export const infoFrames = {
  chapterOre: CHAPTER_ORE_FRAMES,
  chapterStone: CHAPTER_STONE_FRAMES,
  chapterFlat: CHAPTER_FLAT_FRAMES,
  lowerThirdOre: LOWER_ORE_FRAMES,
  lowerThirdCute: LOWER_CUTE_FRAMES,
  advancementToasts: TOAST_FRAMES,
  statBars: STAT_FRAMES,
  compareBars: COMPARE_FRAMES,
  leaderboard: BOARD_FRAMES,
  countdownBig: COUNTDOWN_FRAMES,
  coordTags: COORD_FRAMES,
  ingredientList: INGREDIENT_FRAMES,
  dialogSubtitle: DIALOG_FRAMES,
  creditsRoll: CREDITS_FRAMES,
} as const;

export type InfoToastSpec = ToastSpec;
export type InfoStatEvent = StatEvent;
export type InfoCompareSide = CompareSide;
export type InfoCompareRow = CompareRow;
export type InfoBoardPlayer = BoardPlayer;
export type InfoCoordSpec = CoordSpec;
export type InfoIngredientRow = IngredientRow;
export type InfoDialogSpeaker = DialogSpeaker;
export type InfoDialogLine = DialogLine;
export type InfoCreditSection = CreditSection;
export type InfoMascotKind = MascotKind;
/** 材料清单右侧成品卡。 */
export type InfoIngredientResult = {id: string; name: string; line: string};

/** Props shared by every Info* component. */
export type InfoBaseProps = {
  /** 是否画占位底板(PlateA/PlateB,仅用于预览),默认 false = 透明叠加层 */
  bg?: boolean;
  /** 是否带音效,默认 true;false 时整个效果不渲染任何 Sfx */
  audio?: boolean;
};

/** Wrap a gallery component: transparent by default, `audio` mutes every Sfx under it. */
const wrap = <P extends object>(C: FC<P & {bg?: boolean}>): FC<P & InfoBaseProps> => {
  const W: FC<P & InfoBaseProps> = ({audio = true, bg = false, ...rest}) => (
    <AudioCtx.Provider value={audio}>
      <C {...(rest as unknown as P)} bg={bg} />
    </AudioCtx.Provider>
  );
  return W;
};

// ============================================================================ chapter cards

export type InfoChapterOreProps = {
  /** 当前章节号,默认 3 */
  no?: number;
  /** 总章节数(决定底部进度段数量),默认 8 */
  total?: number;
  /** 章节标题,建议 7 字以内,默认 '合成钻石装备' */
  title?: string;
  /** 标题下的提示行,默认 '先备好 3 颗钻石和 2 根木棍' */
  hint?: string;
  /** 左侧大图标的物品 id,默认 'diamond_sword' */
  icon?: string;
  /** 右侧材料格的物品 id 列表(建议 3 个),默认 ['diamond','stick','iron_ingot'] */
  items?: string[];
  /** 顶部左侧系列名,默认 'EP.12 · 钻石装备篇' */
  series?: string;
  /** 底部右侧"下一章"提示,默认 '下一章 · 附魔' */
  next?: string;
  /** 章节词,不传则按 no 生成 `第 NN 章` */
  label?: string;
  /** 章节词旁的小英文,默认 'CHAPTER' */
  kicker?: string;
  /** 材料列上方的小标题,默认 '本章材料' */
  itemsLabel?: string;
  /** 底部左侧说明,默认 '本章约 6 分钟 · 含合成演示' */
  footer?: string;
  /** 强调色(金色),默认 '#f8af2b' */
  accent?: string;
  /** 背景压暗强度倍数(0 = 不压暗),默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 26 帧开始;应与 Sequence 的 durationInFrames 一致,默认 150 */
  frames?: number;
} & InfoBaseProps;
/** Ore 风章节标题卡:上下条带 + 大面板展开 + 标题逐字砸落。 */
export const InfoChapterOre: FC<InfoChapterOreProps> = wrap(ChapterOre);

export type InfoChapterStoneProps = {
  /** 章节号,用于上方小牌 `第 NN 章`,默认 4 */
  no?: number;
  /** 石质大字,建议 6 字以内,默认 '深渊之门' */
  title?: string;
  /** 横幅下方副标题,默认 '地下三百米 · 一扇不该被打开的门' */
  sub?: string;
  /** 直接替换上方小牌文字(不传则用 `第 NN 章`) */
  tag?: string;
  /** 大字字号,12 的倍数,默认 240 */
  size?: number;
  /** 小牌强调色,默认 '#f8af2b' */
  accent?: string;
  /** 背景压暗强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 24 帧开始,默认 150 */
  frames?: number;
} & InfoBaseProps;
/** 石质厚重风章节标题卡:石砖横幅展开,大字砸落带震屏、裂纹、碎石。 */
export const InfoChapterStone: FC<InfoChapterStoneProps> = wrap(ChapterStone);

export type InfoChapterFlatProps = {
  /** 章节号(圆章里显示 `第N章`),默认 3 */
  no?: number;
  /** 贴纸大字,建议 6 字以内,默认 '红石小课堂' */
  title?: string;
  /** 红色丝带副标题,默认 '今天教你造全自动门' */
  sub?: string;
  /** 偶数位字母的颜色,默认 '#ffd23f' */
  accent?: string;
  /** 圆章文字,默认 `第{no}章` */
  badge?: string;
  /** 背景压暗强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 22 帧开始,默认 150 */
  frames?: number;
} & InfoBaseProps;
/** 可爱扁平风章节标题卡:糖果色斜带、纸片横幅、贴纸大字、圆章、苦力怕/史莱姆/小猪冒头。 */
export const InfoChapterFlat: FC<InfoChapterFlatProps> = wrap(ChapterFlat);

// ============================================================================ lower thirds

export type InfoLowerThirdOreProps = {
  /** 姓名,建议 6 字以内,默认 '红石阿明' */
  name?: string;
  /** 身份/头衔,默认 '建筑师 · 红石工程' */
  role?: string;
  /** 账号小牌,默认 '@RedstoneAMing' */
  handle?: string;
  /** 头像皮肤路径(public/mc/textures 下),默认 'entity/player/wide/steve.png' */
  skin?: string;
  /** 右上角频道角标文字,默认 '优易库' */
  tag?: string;
  /** 右上角频道角标的物品 id,默认 'diamond' */
  icon?: string;
  /** 名牌右端第一个物品格的物品 id,默认 'redstone' */
  badge?: string;
  /** 名牌右端另外两个物品格的物品 id,默认 ['diamond_pickaxe','golden_apple'] */
  badges?: string[];
  /** 头像右下角的绿色小标签,默认 'UP主' */
  avatarTag?: string;
  /** 底部压暗渐变强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,名牌从最后 34 帧开始卷回头像,默认 135 */
  frames?: number;
} & InfoBaseProps;
/** Ore 风下三分之一字幕条:头像框弹出,名牌展开,姓名逐字打出,账号小牌与右上角频道角标。 */
export const InfoLowerThirdOre: FC<InfoLowerThirdOreProps> = wrap(LowerThirdOre);

export type InfoLowerThirdCuteProps = {
  /** 姓名,默认 '小蓝同学' */
  name?: string;
  /** 身份丝带文字,默认 '今天的讲解员' */
  role?: string;
  /** 头像吉祥物,可选 slime(史莱姆) | pig(小猪) | creeper(苦力怕),默认 'slime' */
  mascot?: MascotKind;
  /** 右上角胶囊文字,默认 '关注我' */
  tag?: string;
  /** 总帧数,退场从最后 22 帧开始,默认 135 */
  frames?: number;
} & InfoBaseProps;
/** 可爱风下三分之一字幕条:圆形吉祥物头像、黄色贴纸名牌、粉色身份丝带、云朵与"关注我"胶囊。 */
export const InfoLowerThirdCute: FC<InfoLowerThirdCuteProps> = wrap(LowerThirdCute);

// ============================================================================ toasts / HUD / charts

export type InfoAdvancementToastsProps = {
  /** 成就数组(1~3 项):{kind: task|goal|challenge, title, desc, icon 物品 id, head? 覆盖顶部文案},默认 石器时代 / 钻石！ / 天空之限 三项 */
  toasts?: ToastSpec[];
  /** 底部计数条文字,默认 '已解锁 18 / 124 个进度' */
  counter?: string;
  /** 计数条填充的 [起始, 结束] 比例(0..1),默认 [0.1, 0.145] */
  progress?: [number, number];
  /** 每张成就的出现帧,默认 第 i 张 = 8 + 56 * i */
  starts?: number[];
  /** 总帧数,退场从最后 42 帧开始,默认 240 */
  frames?: number;
} & InfoBaseProps;
/** 成就弹窗:任务 / 目标 / 挑战三种边框依次从右侧弹入,挑战触发粒子与金光。 */
export const InfoAdvancementToasts: FC<InfoAdvancementToastsProps> = wrap(AdvancementToasts);

export type InfoStatBarsProps = {
  /** 整块 HUD 缩放,默认 1 */
  scale?: number;
  /** 生命值事件 [{at 帧, to 0..20 目标值}],降=受伤(红闪/震动/弹字),升=回复,默认 [{at:58,to:8},{at:118,to:18}] */
  health?: StatEvent[];
  /** 饥饿值事件,格式同 health,默认 [{at:84,to:10},{at:150,to:16}] */
  hunger?: StatEvent[];
  /** 经验条升级发生的帧,默认 112 */
  levelUpAt?: number;
  /** 升级前显示的等级,升级后 +1,默认 30 */
  level?: number;
  /** 面板左上标题,默认 '生存状态 · HUD' */
  title?: string;
  /** 三行名称 [生命, 饥饿, 经验],默认 ['生命','饥饿','经验'] */
  labels?: [string, string, string];
  /** 右上状态词 [第一个事件前, 之后, 第二个事件后],默认 ['正常','重伤','恢复中'] */
  statusLabels?: [string, string, string];
  /** 升级时弹出的文字,默认 '升级!' */
  levelUpText?: string;
  /** 总帧数,退场从最后 24 帧开始,默认 240 */
  frames?: number;
} & InfoBaseProps;
/** 血量 / 饥饿 / 经验条变化:受伤骤降带苍白残影、回血亮绿残影、升级金光。 */
export const InfoStatBars: FC<InfoStatBarsProps> = wrap(StatBars);

export type InfoCompareBarsProps = {
  /** 左侧物品 {id 物品 id, name, tag, color},默认 钻石剑(锋利 V,青色) */
  left?: CompareSide;
  /** 右侧物品 {id, name, tag, color},默认 下界合金剑(锋利 V,紫色) */
  right?: CompareSide;
  /** 属性行 [{label, l 左值, r 右值, max 满格值, dec? 小数位}],数值大者胜、相等平手,默认 攻击伤害/耐久/攻击速度/抗击退 四行 */
  rows?: CompareRow[];
  /** 面板标题,默认 '属性对比' */
  title?: string;
  /** 左右两侧物品卡的金色评级格数 [左, 右](满 5),默认 [4, 5] */
  ratings?: [number, number];
  /** 中间徽章文字,默认 'VS' */
  vs?: string;
  /** 胜出横幅后缀,最终文案 `${name}${winSuffix}`,默认 ' 胜出' */
  winSuffix?: string;
  /** 平局横幅文字,默认 '势均力敌' */
  tieText?: string;
  /** 左侧条形颜色 [主色, 高光, 阴影],默认 ['#2d9fcf','#8fe9ff','#14607f'] */
  leftColors?: [string, string, string];
  /** 右侧条形颜色 [主色, 高光, 阴影],默认 ['#9a58e0','#e2b8ff','#5a2a96'] */
  rightColors?: [string, string, string];
  /** 背景压暗强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 26 帧开始,默认 230 */
  frames?: number;
} & InfoBaseProps;
/** 属性对比条:两件物品卡 + VS 徽章 + 左右对生的数值条,胜出方变金,最后弹出胜负横幅。 */
export const InfoCompareBars: FC<InfoCompareBarsProps> = wrap(CompareBars);

export type InfoLeaderboardProps = {
  /** 玩家数组(建议 5 个) [{name, skin 皮肤路径, a 更新前分数, b 更新后分数}],名次由分数自动算出,默认 艾利克斯/史蒂夫/凯/诺尔/祖里 */
  players?: BoardPlayer[];
  /** 榜单标题,默认 '击杀排行榜' */
  title?: string;
  /** 右上周期标签前缀,默认 '本周' */
  unit?: string;
  /** 标题后的金色标签,默认 'TOP 5' */
  topLabel?: string;
  /** 更新前的周期文字,默认 '第 11 周' */
  periodBefore?: string;
  /** 更新后的周期文字,默认 '第 12 周 ▲' */
  periodAfter?: string;
  /** 两侧挂旗上的竖排文字(2 字),默认 '榜单' */
  bannerText?: string;
  /** 分数刷新、名次互换开始的帧,默认 120 */
  updateAt?: number;
  /** 背景压暗强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 26 帧开始,默认 280 */
  frames?: number;
} & InfoBaseProps;
/** 排行榜 Top5:挂旗垂下,五行滑入,分数刷新后互相超越,皇冠飞向新的第一名。 */
export const InfoLeaderboard: FC<InfoLeaderboardProps> = wrap(Leaderboard);

// ============================================================================ countdown / tags / lists

export type InfoCountdownBigProps = {
  /** 起始数字,倒数到 1 再出"开始",默认 5 */
  from?: number;
  /** 结尾文字,默认 '开始!' */
  go?: string;
  /** 每个数字的填充色数组(循环取用),默认 ['#6cc349','#e5c317','#f8af2b','#ff7a3c','#ff4d5e'] */
  colors?: string[];
  /** 结尾文字的颜色,默认 '#ffd35a' */
  goColor?: string;
  /** 上方条带左侧小字,默认 '倒计时' */
  topLabel?: string;
  /** 下方条带左侧小字,默认 '准备好了吗' */
  bottomLabel?: string;
  /** 结尾时条带右侧的小字,默认 'GO' */
  goTag?: string;
  /** 背景压暗强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,最后 14 帧淡出,默认 14 + 30 * from + 66(from=5 时 230) */
  frames?: number;
} & InfoBaseProps;
/** 大数字倒计时 5-4-3-2-1:方块像素大数字砸落,整屏压缩脉冲、碎片、计时条,最后"开始!"。 */
export const InfoCountdownBig: FC<InfoCountdownBigProps> = wrap(CountdownBig);

export type InfoCoordTagsProps = {
  /** 坐标标签数组 [{x,y 指向的屏幕点, name, xyz:[X,Y,Z], color, at 起始帧, dist? 距离文字, icon? pin|skull|bolt|trophy}],默认 雪原村庄/地下钻石矿/下界传送门 三个 */
  tags?: CoordSpec[];
  /** 是否显示顶部罗盘条,默认 true */
  compass?: boolean;
  /** 罗盘三个方位字 [西, 北, 东],默认 ['西','北','东'] */
  compassLabels?: [string, string, string];
  /** 总帧数,标签从最后 22 帧开始收回,默认 200 */
  frames?: number;
} & InfoBaseProps;
/** 坐标标签:地面像素闪光 + 细杆 + 带指针的 Ore 标签弹出,XYZ 数字滚动,顶部罗盘同步标出方位。 */
export const InfoCoordTags: FC<InfoCoordTagsProps> = wrap(CoordTags);

export type InfoIngredientListProps = {
  /** 面板标题,默认 '材料清单' */
  title?: string;
  /** 材料行 [{id 物品 id, name, count, src 出处}],建议 4~5 行,默认 钻石/木棍/铁锭/红石粉/书 五行 */
  rows?: IngredientRow[];
  /** 右侧成品卡 {id 物品 id, name, line 说明},默认 钻石镐(挖掘速度 8 · 耐久 1561) */
  result?: InfoIngredientResult;
  /** 顶部计数文字,`{done}` `{total}` 会被替换,默认 '已备齐 {done} / {total}' */
  counterLabel?: string;
  /** 材料齐全时的印章文字,默认 '材料齐全！' */
  stampText?: string;
  /** 成品卡顶部小字,默认 '合成目标' */
  resultLabel?: string;
  /** 背景压暗强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 24 帧开始,默认 250 + 16 * (行数 - 5) */
  frames?: number;
} & InfoBaseProps;
/** 材料清单卡:清单面板滑入,逐行弹入、逐行打钩,齐全时盖章并点亮右侧成品卡。 */
export const InfoIngredientList: FC<InfoIngredientListProps> = wrap(IngredientList);

// ============================================================================ dialog / credits

export type InfoDialogSubtitleProps = {
  /** 两位说话者 [{name, skin 皮肤路径, color}],下标 0 在左、1 在右,默认 史蒂夫(左)/艾利克斯(右) */
  speakers?: DialogSpeaker[];
  /** 台词 [{who: 0|1, text, tone: shout|ask|dots|happy}],第 18 帧开始、每句占 62 帧,默认 苦力怕对话四句 */
  lines?: DialogLine[];
  /** 底部压暗渐变强度倍数,默认 1 */
  dim?: number;
  /** 总帧数,退场从最后 22 帧开始,默认 18 + 62 * 台词数 + 34(4 句时 300) */
  frames?: number;
} & InfoBaseProps;
/** 对话字幕:左右两位角色头像,说话者发亮跳动,气泡指向说话者,文字逐字打出。 */
export const InfoDialogSubtitle: FC<InfoDialogSubtitleProps> = wrap(DialogSubtitle);

export type InfoCreditsRollProps = {
  /** 名单分区 [{title, rows?: [[职位,名字]], names?: 名字数组, tiers?: [{label, icon, color, names}]}],默认 出品/制作/特别鸣谢/赞助名单 四段 */
  sections?: CreditSection[];
  /** 收尾大字,默认 '谢谢观看' */
  closing?: string;
  /** 开场大字,默认 '制作名单' */
  heading?: string;
  /** 开场大字下的小字,默认 'C R E D I T S' */
  headingSub?: string;
  /** 收尾大字下的小字,默认 '下期再见 · 记得三连' */
  farewell?: string;
  /** 两侧滚动栏的物品 id 列表,默认 diamond/emerald/gold_ingot 等 12 种矿物 */
  laneItems?: string[];
  /** 深色星空暗化底的浓度倍数(0 = 无暗化),默认 1 */
  dim?: number;
  /** 总帧数,滚动在 frames - 40 处减速停住,默认 480 */
  frames?: number;
} & InfoBaseProps;
/** 片尾鸣谢滚动:暗化星空底 + 两侧物品栏视差 + 职位/名字两栏上滚,最后停在"谢谢观看"。 */
export const InfoCreditsRoll: FC<InfoCreditsRollProps> = wrap(CreditsRoll);
