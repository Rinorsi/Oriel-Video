// Library exports for the mcdShow group (see src/lib/README.md for the contract).
// 26 Minecraft-Dungeons-style effects: show-off animations (gallery/fx/mcd2, ids mcd-s-*) and title / chapter / end cards (gallery/fx/mcd4, ids mcd-c-*).
// Every component: local frame 0 = first frame of the effect, place it with <Sequence from durationInFrames>.
// `bg` defaults to false (transparent, no preset scene / black base); `audio` defaults to true (the effect's own sound cues).
import type {FC} from 'react';
import {Victory as McdVictoryBannerSrc} from '../gallery/fx/mcd2/victory';
import {Results as McdResultsSrc} from '../gallery/fx/mcd2/results';
import {ChestReveal as McdChestRevealSrc} from '../gallery/fx/mcd2/chest';
import {LootRarity as McdLootRaritySrc} from '../gallery/fx/mcd2/loot';
import {BossIntro as McdBossIntroSrc, BossDefeat as McdBossDefeatSrc} from '../gallery/fx/mcd2/boss';
import {Death as McdDeathScreenSrc} from '../gallery/fx/mcd2/death';
import {LevelUp as McdLevelUpSrc} from '../gallery/fx/mcd2/levelup';
import {Collect as McdSoulsCollectSrc, Collect as McdEmeraldCollectSrc} from '../gallery/fx/mcd2/souls';
import {Objective as McdObjectiveSrc} from '../gallery/fx/mcd2/objective';
import {Label as McdLocationLabelSrc, Big as McdLocationBigSrc} from '../gallery/fx/mcd2/location';
import {Showcase as McdItemShowcaseSrc} from '../gallery/fx/mcd2/itemshowcase';
import {WorldMap as McdWorldMapSrc} from '../gallery/fx/mcd2/worldmap';
import {TitleScramble as McdTitleScrambleSrc} from '../gallery/fx/mcd4/titleScramble';
import {VoxelLogo as McdVoxelLogoSrc} from '../gallery/fx/mcd4/voxelLogo';
import {EndCard as McdEndCardSrc} from '../gallery/fx/mcd4/endCard';
import {ChapterCard as McdChapterCardSrc} from '../gallery/fx/mcd4/chapterCard';
import {NewMission as McdNewMissionSrc, NewMission as McdNewMissionCenterSrc} from '../gallery/fx/mcd4/newMission';
import {Presents as McdPresentsSrc} from '../gallery/fx/mcd4/presents';
import {SeriesTitle as McdSeriesTitleSrc} from '../gallery/fx/mcd4/seriesTitle';
import {SubtitleBar as McdSubtitleBarSrc} from '../gallery/fx/mcd4/subtitleBar';
import {Credits as McdCreditsSrc} from '../gallery/fx/mcd4/credits';
import {DayTitle as McdDayTitleSrc} from '../gallery/fx/mcd4/dayTitle';

/** 胜利横幅 · 月桂倒计时 (mcd-s-victory-banner)。屏幕上方居中：金色“胜利！”从大到小砸入，银灰月桂向两侧展开，白色像素数字逐秒倒数，顶部压暗渐变托住字，结尾整体淡出。
 *  用途：打赢一关/完成一个阶段的收尾点；倒计时数字可换成章节编号、剩余秒数或“第 N 期”。bg=false 时只有顶部压暗渐变和文字，直接叠在素材上。
 *  默认时长 160 帧（30fps）。 */
export interface McdVictoryBannerProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 倒计时起始数字，每 tick 帧减 1，减到 1 停住。默认 5 */
  from?: number;
  /** 金色主标题。默认 '胜利！' */
  title?: string;
  /** 数字下方的白色小字。默认 '任务结束…' */
  sub?: string;
  /** 每个倒计时数字停留的帧数。默认 26 */
  tick?: number;
}
export const McdVictoryBanner: FC<McdVictoryBannerProps> = ({bg = false, audio = true, ...p}) => <McdVictoryBannerSrc bg={bg} audio={audio} {...p} />;

/** 结算页 · 压黑转场 (mcd-s-results)。关卡画面压黑 0.5s、黑场停 0.5s，整页淡入：金色菱形框头像+月桂+等级徽章，击败数滚动，四格深色统计卡逐个数字滚动，右下金框宝箱抖动并闪星，最后淡黑收尾。
 *  用途：视频结尾的数据总结（时长、素材数、版本号）或一个阶段完成后的“成绩单”。整屏卡：开头压黑、结尾淡黑都是不透明黑场，bg=false 时仍带半透明暗蓝蒙版；bg=true 额外画模糊的夜林场景。
 *  默认时长 180 帧（30fps）。 */
export interface McdResultsProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 等级徽章数字，下一等级文案为 level+1。默认 6 */
  level?: number;
  /** 顶部金色小标题。默认 '恭喜过关' */
  stage?: string;
  /** 白色大标题。默认 '苦力怕森林' */
  mission?: string;
  /** 头像下方的玩家名。默认 'vrvylive' */
  name?: string;
  /** 主数字，会从 0 滚动到该值。默认 568 */
  kills?: number;
  /** 主数字下方的说明。默认 '击败敌人' */
  unit?: string;
  /** 四格统计卡 [标签, 数值, 后缀]，数值滚动显示。默认 [['已开启宝箱',100,'%'],['击败怪物',97,'%'],['受到伤害',1576,''],['倒下的玩家',0,'']] */
  stats?: [string, number, string][];
  /** 统计区上方的小标题。默认 '任务汇总' */
  summary?: string;
  /** 右侧“下一等级：N”的文字部分。默认 '下一等级' */
  nextLabel?: string;
}
export const McdResults: FC<McdResultsProps> = ({bg = false, audio = true, ...p}) => <McdResultsSrc bg={bg} audio={audio} {...p} />;

/** 开箱展示 · 品红光柱 (mcd-s-chest-reveal)。紫眼金属宝箱落地后抖动蓄力，箱盖翻开的 4 帧内品红光柱（白核）冲天、像素粒子上喷，约 1.2s 后深色面板里的稀有度菱形框物品卡弹出。
 *  用途：揭晓“新功能/新素材/成品”的悬念节点；item/name/rarity 换成要展示的东西。bg=false 时无场景，宝箱和物品卡直接叠在素材上（物品卡出现时会压暗素材）。
 *  默认时长 180 帧（30fps）。 */
export interface McdChestRevealProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 物品贴图 id（如 trident、bow、diamond_sword）。默认 'trident' */
  item?: string;
  /** 物品卡上的名称。默认 '雷鸣三叉戟' */
  name?: string;
  /** 稀有度，决定菱形框颜色与光效：common 白 / rare 绿 / unique 橙。默认 'unique' */
  rarity?: 'common' | 'rare' | 'unique';
  /** 物品描述。默认 '古老的海中神兵，被闪电祝福过的锋刃。' */
  desc?: string;
  /** 物品卡上的威力数字。默认 12 */
  power?: number;
  /** 物品卡底部按钮文字。默认 '回到营地' */
  button?: string;
  /** 箱盖翻开（光柱爆发）的帧；物品卡在其后 36 帧弹出。默认 66 */
  openAt?: number;
}
export const McdChestReveal: FC<McdChestRevealProps> = ({bg = false, audio = true, ...p}) => <McdChestRevealSrc bg={bg} audio={audio} {...p} />;

/** 稀有度光柱 · 白绿橙 (mcd-s-loot-rarity)。三件掉落物依次落地：同稀有度色光柱 4 帧冲起，地面光斑与像素尘土，物品悬浮摇摆，下方深色名称卡带 COMMON / RARE / UNIQUE 标签。
 *  用途：展示“获得了什么”：战利品盘点、素材分级、版本更新里的新物品列表。固定三个落点（左/中/右），items 需要给 3 项。
 *  默认时长 180 帧（30fps）。 */
export interface McdLootRarityProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 三件掉落物：物品贴图 id、名称、稀有度、威力数字；按顺序落在左/中/右。默认 [{item:'iron_sword',name:'铁剑',rarity:'common',power:8},{item:'bow',name:'猎手之弓',rarity:'rare',power:21},{item:'golden_sword',name:'炽炎裂刃',rarity:'unique',power:37}] */
  items?: {item: string; name: string; rarity: 'common' | 'rare' | 'unique'; power: number}[];
}
export const McdLootRarity: FC<McdLootRarityProps> = ({bg = false, audio = true, ...p}) => <McdLootRaritySrc bg={bg} audio={audio} {...p} />;

/** Boss 登场 · 血条拉满 (mcd-s-boss-intro)。紫色能量向中心聚拢，金色像素十字闪光 + 十字碎片炸开（无圆环），红石染色的铁傀儡现身；顶部居中细红条从左拉满、白尾缓冲，中上出现金色标题与白字目标，随后一次受击白尾追赶。
 *  用途：介绍“最终 Boss/核心难点”的登场；血条可当作进度条的出场动画；objective 换成视频里的任务点。Boss 外形固定为红石傀儡（铁傀儡贴图染色）。
 *  默认时长 180 帧（30fps）。 */
export interface McdBossIntroProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 血条左上方的 Boss 名字。默认 '红石傀儡' */
  name?: string;
  /** 中上方白色大字目标。默认 '击败红石傀儡' */
  objective?: string;
  /** 目标上方的金色小标题。默认 '新目标' */
  heading?: string;
}
export const McdBossIntro: FC<McdBossIntroProps> = ({bg = false, audio = true, ...p}) => <McdBossIntroSrc bg={bg} audio={audio} {...p} />;

/** Boss 被击败 · 光柱白闪 (mcd-s-boss-defeat)。Boss 闪白爆散，品红光柱在原地升起并带虚线菱形符文；金色火星沿弧线铺出小路，主角沿小路走进光柱，约 0.7s 画面泛白至全白后淡出。
 *  用途：章节结束、通关、解锁下一部分的转场：白闪全白那一刻（约第 124–130 帧）可以直接切到下一镜头。bg=false 时无场景，全白闪仍会盖住下层素材。
 *  默认时长 160 帧（30fps）。 */
export interface McdBossDefeatProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 左上区域白字目标。默认 '跟随小路' */
  objective?: string;
  /** 目标上方的金色小标题。默认 '新目标' */
  heading?: string;
}
export const McdBossDefeat: FC<McdBossDefeatProps> = ({bg = false, audio = true, ...p}) => <McdBossDefeatSrc bg={bg} audio={audio} {...p} />;

/** 死亡画面 · 猩红晕影 (mcd-s-death)。先是边缘红晕随心跳脉动，一击后猩红径向晕影合拢，暗色菱形框的白色像素骷髅砸下，白字“你死了”，右上“剩余生命 ×3→×2”跳减，结尾复活淡回。
 *  用途：搞笑翻车/失败/Bug 的反转镜头；cause 一行可改成吐槽文案。bg=false 时只有红晕和文字（没有把素材褪成蓝灰的调色），bg=true 才会画夜林场景并压暗去色。
 *  默认时长 150 帧（30fps）。 */
export interface McdDeathScreenProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 主文字。默认 '你死了' */
  text?: string;
  /** 主文字下方的小字（死因/吐槽）。默认 '被红石傀儡击败' */
  cause?: string;
  /** 起始剩余生命，约第 46 帧减 1。默认 3 */
  lives?: number;
  /** 右上角计数上方的文字。默认 '剩余生命' */
  livesLabel?: string;
}
export const McdDeathScreen: FC<McdDeathScreenProps> = ({bg = false, audio = true, ...p}) => <McdDeathScreenSrc bg={bg} audio={audio} {...p} />;

/** 升级特效 · 紫色螺旋光 (mcd-s-level-up)。经验条满格闪白，英雄脚下十字闪光，紫白方块粒子沿双螺旋缠绕上升、紫色光柱托起，金色“升级！”砸下，右侧紫边六边形等级徽章翻牌 6→7 并迸出金紫火花。
 *  用途：版本号/等级/订阅数里程碑、技能解锁；level 改成要展示的数字，title/sub 改文案。画面中央固定有一个英雄立绘（zuri 皮肤），没有素材主角时建议把它当作站位参考。
 *  默认时长 150 帧（30fps）。 */
export interface McdLevelUpProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 翻牌前的等级，翻牌后显示 level+1。默认 7 */
  level?: number;
  /** 金色大标题。默认 '升级！' */
  title?: string;
  /** 标题下的灰色小字。默认 '获得 1 点附魔点' */
  sub?: string;
  /** 经验条上方的文字。默认 '经验' */
  xpLabel?: string;
}
export const McdLevelUp: FC<McdLevelUpProps> = ({bg = false, audio = true, ...p}) => <McdLevelUpSrc bg={bg} audio={audio} {...p} />;

/** 灵魂吸取 · 计数跳动 (mcd-s-souls-collect)。三只怪物（真实苦力怕/骷髅/僵尸贴图，红色描边）被击杀后迸出白色小鬼脸灵魂，拖着青蓝像素尾迹沿弧线飞向右上角，每抵达一只计数加一并弹跳闪光。
 *  用途：统计数字递增的叙事：订阅数、下载量、击杀数、收集进度。三只怪物位置固定在画面中下部，计数面板固定在右上角。
 *  默认时长 150 帧（30fps）。 */
export interface McdSoulsCollectProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 计数器起始值，每抵达一个灵魂 +1。默认 27 */
  start?: number;
  /** 计数面板下方的文字。默认 '灵魂' */
  label?: string;
}
export const McdSoulsCollect: FC<McdSoulsCollectProps> = ({bg = false, audio = true, ...p}) => <McdSoulsCollectSrc kind="soul" bg={bg} audio={audio} {...p} />;

/** 绿宝石吸取 · 计数跳动 (mcd-s-emerald-collect)。怪物倒下后真实绿宝石贴图弹出落地、旋转，再带着绿色像素尾迹成串飞向右上角的绿宝石计数器，每颗抵达计数跳动并闪光。
 *  用途：金币/积分/打赏/奖励到账的视觉；计数器的图标和数字可作为“收入/积分”展示。每颗绿宝石让计数 +3。
 *  默认时长 150 帧（30fps）。 */
export interface McdEmeraldCollectProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 计数器起始值，每抵达一颗绿宝石 +3。默认 109 */
  start?: number;
  /** 计数面板下方的文字。默认 '绿宝石' */
  label?: string;
}
export const McdEmeraldCollect: FC<McdEmeraldCollectProps> = ({bg = false, audio = true, ...p}) => <McdEmeraldCollectSrc kind="emerald" bg={bg} audio={audio} {...p} />;

/** 目标更新 · 划掉旧目标 (mcd-s-objective)。右上角压暗渐变从顶部落下，金色区域名 + 白色旧目标；旧目标被白线划掉、打绿色对勾后上滑退出，新目标从下方升入原位，同时画面上方居中浮出金色小标题与白色大字新目标。
 *  用途：教程步骤切换、挑战下一阶段提示、章节任务更新字幕。右上角槽位与居中公告同时出现。
 *  默认时长 140 帧（30fps）。 */
export interface McdObjectiveProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 右上角金色副标（区域/章节名）。默认 '无名王国' */
  area?: string;
  /** 被划掉的旧目标。默认 '击败守卫的骷髅' */
  oldText?: string;
  /** 新目标（右上角和居中公告都用它）。默认 '抵达死灵法师之墓' */
  newText?: string;
  /** 居中公告上方的金色小标题。默认 '新目标' */
  heading?: string;
}
export const McdObjective: FC<McdObjectiveProps> = ({bg = false, audio = true, ...p}) => <McdObjectiveSrc bg={bg} audio={audio} {...p} />;

/** 地名标签 · 正在前往 (mcd-s-location-card)。左下角方块图标框（循环换贴图）+ “正在前往”小字 + 金橙色地名，右上角金色骷髅难度徽章；自下而上淡入，结尾淡出。
 *  用途：每个新场景/章节/地图开头的“我们现在在哪”小标签，叠在转场后的第一个镜头上。blocks 换成该地点的代表方块。bg=true 才画带景深的沙漠场景。
 *  默认时长 150 帧（30fps）。 */
export interface McdLocationLabelProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 金橙色地名。默认 '苦力怕森林' */
  place?: string;
  /** 地名上方的小字。默认 '正在前往' */
  sub?: string;
  /** 图标框里循环的方块贴图 id 列表。默认 ['stone','cobblestone','magma','redstone_block','netherrack'] */
  blocks?: string[];
  /** 换一次图标的间隔帧数。默认 18 */
  swap?: number;
}
export const McdLocationLabel: FC<McdLocationLabelProps> = ({bg = false, audio = true, ...p}) => <McdLocationLabelSrc bg={bg} audio={audio} {...p} />;

/** 大字地名卡 (mcd-s-location-card-big)。黑色横带从中线展开，两侧金线，金字地名先像素错位 3 帧再拼成清晰金字（四角像素括号，金色火星上飘），下方骷髅徽章与章节难度，结尾横带收拢。
 *  用途：章节标题卡、地图/维度切换、“第 N 期”片头；比小标签更强调仪式感。横带是半透明黑底（82%），叠在素材上仍能看到画面。
 *  默认时长 150 帧（30fps）。 */
export interface McdLocationBigProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 金字大地名。默认 '苦力怕森林' */
  place?: string;
  /** 上方金线中间的小字。默认 '正在前往' */
  sub?: string;
  /** 下方骷髅徽章旁的章节/难度文字。默认 '第三章 · 难度 III' */
  tag?: string;
}
export const McdLocationBig: FC<McdLocationBigProps> = ({bg = false, audio = true, ...p}) => <McdLocationBigSrc bg={bg} audio={audio} {...p} />;

/** 物品展示 · 旋转体素大图 (mcd-s-item-showcase)。真实物品贴图叠成体素厚片，在稀有度色菱形舞台上快速自转后减速停住并轻摆悬浮；右侧等级+稀有度标签、大字名称、伤害行、三条属性条依次升起，三个附魔菱形槽逐个点亮。
 *  用途：展示武器/新物品/礼物/周边的详情页：左侧大图 + 右侧参数。bg=true 才画红棕界面底；bg=false 时菱形舞台和文字直接叠在素材上。
 *  默认时长 180 帧（30fps）。 */
export interface McdItemShowcaseProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 物品贴图 id（diamond_sword、bow、netherite_axe…）。默认 'diamond_sword' */
  item?: string;
  /** 大字名称。默认 '寒焰之刃' */
  name?: string;
  /** 稀有度，决定菱形舞台、光效和标签颜色。默认 'unique' */
  rarity?: 'common' | 'rare' | 'unique';
  /** 描述文字。默认 '霜与火交织的刃，斩过之处留下灼痕。' */
  desc?: string;
  /** 伤害行文字。默认 '24-40 近战伤害' */
  damage?: string;
  /** 物品等级数字。默认 7 */
  level?: number;
  /** 三条属性条 [标签, 0..1 的填充比例]。默认 [['威力',0.74],['速度',0.38],['范围',0.52]] */
  stats?: [string, number][];
  /** 附魔区标题。默认 '附魔' */
  enchantLabel?: string;
}
export const McdItemShowcase: FC<McdItemShowcaseProps> = ({bg = false, audio = true, ...p}) => <McdItemShowcaseSrc bg={bg} audio={audio} {...p} />;

/** 世界地图选关 (mcd-s-world-map-select)。金色六边形骷髅节点逐个弹出、虚线小路在节点间生长，选中节点放大并推近镜头，右侧弹出任务威胁面板（I–VII 难度条逐级点亮、战力、战利品槽、开始按钮）。
 *  用途：路线图/章节目录/功能规划：用节点表示阶段，选中节点展开详情。bg=true 才画米色羊皮纸等距沙盘；bg=false 只有节点、小路和面板，可叠在你自己的地图图片上。节点位置固定为 6 个。
 *  默认时长 180 帧（30fps）。 */
export interface McdWorldMapProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 六个节点的名称，按从左到右的顺序。默认 ['苦力怕森林','沼泽湿地','沙漠神殿','红石矿山','冰封之巅','黑曜尖塔'] */
  places?: string[];
  /** 被选中的节点序号（0 起）。默认 3 */
  selected?: number;
  /** 右侧面板标题。默认 选中节点的名称 */
  panelTitle?: string;
  /** 面板底部按钮文字。默认 '开始任务' */
  button?: string;
  /** “你的战力”数字。默认 143 */
  power?: number;
}
export const McdWorldMap: FC<McdWorldMapProps> = ({bg = false, audio = true, ...p}) => <McdWorldMapSrc bg={bg} audio={audio} {...p} />;

/** 预告片标题卡 · 像素错位 (mcd-c-title-scramble)。硬切纯黑，金色大字先以像素错位乱码出现 3 帧，随即拼合，伴随火星与碎屑方块喷出，慢速推近，最后分级压暗收尾。
 *  用途：每期视频开头/章节开头的标题卡。整屏卡：bg=true 画纯黑马赛克底（本示例）；bg=false 只留字和火星，可叠在素材上（但结尾的压暗是内容淡出，不是黑场）。
 *  默认时长 150 帧（30fps）。 */
export interface McdTitleScrambleProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 标题文字（中英文均可，自动按宽度取整数像素字号）。默认 '地底迷城' */
  title?: string;
  /** 标题下的小字。默认 '整合包冒险 · 第 1 集' */
  subtitle?: string;
  /** 字面材质：金 / 橙红 Logo / 灰石 / 白 / 银。默认 'gold' */
  look?: 'gold' | 'logo' | 'stone' | 'white' | 'silver';
  /** 标题最大宽度（px）。默认 1500 */
  maxW?: number;
  /** 标题出现（错位乱码开始）的帧。默认 4 */
  at?: number;
  /** 开始压暗淡出的帧。默认 112 */
  hold?: number;
  /** 中文字形网格行数，越小越像体素。默认 24 */
  cjkRows?: number;
  /** 字的立体挤出厚度（艺术像素）。默认 2 */
  depth?: number;
}
export const McdTitleScramble: FC<McdTitleScrambleProps> = ({bg = false, audio = true, ...p}) => <McdTitleScrambleSrc bg={bg} audio={audio} {...p} />;

/** 方块拼合 Logo (mcd-c-title-voxel-assemble)。标题由一堆真实金块贴图的方块从四面翻滚飞来，逐个锁进字形并轻微挤压回弹，随后一道光扫掠过；Logo 带轻微 3D 摇摆，最后方块散落。
 *  用途：频道/系列/整合包 Logo 的片头出场；tint 换成 stone/ember 得到石砖或熔岩质感。整屏卡：bg=true 画纯黑底；bg=false 方块和火星直接叠在素材上。
 *  默认时长 180 帧（30fps）。 */
export interface McdVoxelLogoProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** Logo 文字。默认 '地底迷城' */
  text?: string;
  /** Logo 下方的小字。默认 '方块拼合 · 第 1 季' */
  sub?: string;
  /** 方块最大边长（px，自动按宽度缩小）。默认 26 */
  cube?: number;
  /** Logo 最大宽度（px）。默认 1560 */
  maxW?: number;
  /** 中文字形网格行数，越小方块越大。默认 16 */
  cjkRows?: number;
  /** 方块开始飞入的帧。默认 6 */
  start?: number;
  /** 方块开始散落的帧。默认 150 */
  exit?: number;
  /** 随机种子（飞入轨迹）。默认 7 */
  seed?: number;
  /** 方块材质组：金块 / 石砖 / 熔岩。默认 'gold' */
  tint?: 'gold' | 'stone' | 'ember';
  /** 额外散落的碎块数量。默认 14 */
  debris?: number;
}
export const McdVoxelLogo: FC<McdVoxelLogoProps> = ({bg = false, audio = true, ...p}) => <McdVoxelLogoSrc bg={bg} audio={audio} {...p} />;

/** 终卡 · 四角括号 (mcd-c-end-card)。暗底马赛克 + 底部暖光，四角像素括号与细框线从角落生长；灰石小标题、橙金 Logo 两侧带花括号、金字“感谢观看”、链接与制作组一行，火星持续上飘，最后分级压暗。
 *  用途：每期视频最后 5–7 秒的终卡，也可放在片尾滚动之后。整屏卡：bg=true 画暗底和暖光（本示例）；bg=false 只留括号、文字和火星，叠在画面上。
 *  默认时长 210 帧（30fps）。 */
export interface McdEndCardProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 灰石小标题（Logo 上方）。默认 '我的世界 · 冒险日志' */
  kicker?: string;
  /** 橙金 Logo 文字。默认 '地底迷城' */
  title?: string;
  /** 金字感谢语。默认 '感谢观看' */
  thanks?: string;
  /** 感谢语下的链接/号召文案。默认 '订阅频道，不错过下一期更新' */
  link?: string;
  /** 底部制作组名称，用竖线隔开。默认 ['Oriel 工作室','地下城风格素材库'] */
  studios?: string[];
  /** 最底部免责/版权小字。默认 '© 2026 Oriel Studio · 部分画面为后期合成' */
  note?: string;
  /** 开始压暗淡出的帧。默认 186 */
  exit?: number;
  /** 中文字形网格行数。默认 28 */
  cjkRows?: number;
}
export const McdEndCard: FC<McdEndCardProps> = ({bg = false, audio = true, ...p}) => <McdEndCardSrc bg={bg} audio={audio} {...p} />;

/** 章节卡 · 六边形翻牌 (mcd-c-chapter-card)。场景被压暗，中间一条黑色横幅（金色上下边线）：六边形背面翻过来露出章节序号，章节名硬阴影大字、金色分割线、一行副标题依次出现。cut 硬切进出，slide 为 45° 斜边横向划入再向右划出。
 *  用途：视频分章节时的章节标题。cut 适合紧凑快节奏，slide 更舒展。bg=false 只含压暗和横幅，直接叠在素材上；bg=true 额外画一个群系场景（biome）。
 *  默认时长 120 帧（30fps）。 */
export interface McdChapterCardProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 章节序号（六边形里的数字）。默认 3 */
  n?: number;
  /** 六边形里序号上方的小字。默认 'CHAPTER' */
  label?: string;
  /** 金色章节词；不传时自动用“第 n 章”。默认 `第 ${n} 章` */
  chapterWord?: string;
  /** 章节名大字。默认 '苦力怕森林' */
  name?: string;
  /** 分割线下的副标题。默认 '夜幕降临，林中传来熟悉的嘶嘶声' */
  sub?: string;
  /** 进出方式：'cut' 硬切 / 'slide' 横向划入划出。默认 'cut' */
  mode?: 'cut' | 'slide';
  /** 仅 bg=true 时使用的场景群系。默认 'forest-night' */
  biome?: 'forest-day' | 'forest-night' | 'desert' | 'nether' | 'end' | 'snow' | 'world-map' | 'camp';
  /** 横幅离场的帧。默认 96（mode='slide' 时 94） */
  exit?: number;
}
export const McdChapterCard: FC<McdChapterCardProps> = ({bg = false, audio = true, mode = 'cut', exit, ...p}) => <McdChapterCardSrc bg={bg} audio={audio} mode={mode} exit={exit ?? (mode === 'slide' ? 94 : 96)} {...p} />;

/** 新任务解锁面板 (mcd-c-new-mission)。右下角弹出斜切深色面板，金色“新任务解锁”；三个灰色上锁的六边形节点依次点亮成金色并带像素十字闪光，数字滚动到 3，绿色按钮被按下后面板收走。bg=true 时同时在世界地图上冒出一个金色任务节点。
 *  用途：展示整合包/地图的新内容、新关卡、新章节解锁；pos="center" 变成画面中间的大号版本（见 McdNewMissionCenter）。bg=false 是透明面板，叠在任意素材上。
 *  默认时长 150 帧（30fps）。 */
export interface McdNewMissionProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 面板标题（金字）。默认 '新任务解锁' */
  title?: string;
  /** 滚动数字后面的文字。默认 '个新任务' */
  countLabel?: string;
  /** 每个解锁节点里的物品贴图 id，节点数 = 数组长度。默认 ['diamond_sword','bow','iron_pickaxe'] */
  icons?: string[];
  /** 绿色按钮文字。默认 '查看下一个' */
  button?: string;
  /** 面板位置：'corner' 右下角 / 'center' 画面中间（放大）。默认 'corner' */
  pos?: 'corner' | 'center';
  /** 仅 bg=true：地图上冒出的节点名称。默认 '红石矿山' */
  nodeName?: string;
  /** 仅 bg=true：地图节点位置 [x, y]（px）。默认 [560, 300]（center 时 [250, 520]） */
  nodeAt?: [number, number];
  /** 面板离场的帧。默认 118 */
  exit?: number;
}
export const McdNewMission: FC<McdNewMissionProps> = ({bg = false, audio = true, ...p}) => <McdNewMissionSrc bg={bg} audio={audio} {...p} />;

/** 新任务解锁面板 · 居中 (mcd-c-new-mission-center)。画面压暗，中间弹出放大的新任务面板，节点依次解锁、数字滚动、按钮按下后收起。
 *  用途：需要强调“这是重点新内容”时用居中版；右下角版见 McdNewMission。默认带 4 个物品节点。
 *  默认时长 150 帧（30fps）。 */
export interface McdNewMissionCenterProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 面板标题（金字）。默认 '新任务解锁' */
  title?: string;
  /** 滚动数字后面的文字。默认 '个新任务' */
  countLabel?: string;
  /** 每个解锁节点里的物品贴图 id，节点数 = 数组长度。默认 ['golden_apple','diamond','ender_pearl','experience_bottle'] */
  icons?: string[];
  /** 绿色按钮文字。默认 '查看下一个' */
  button?: string;
  /** 仅 bg=true：地图上冒出的节点名称。默认 '沙漠神殿' */
  nodeName?: string;
  /** 仅 bg=true：地图节点位置 [x, y]（px）。默认 [250, 520] */
  nodeAt?: [number, number];
  /** 面板离场的帧。默认 118 */
  exit?: number;
}
export const McdNewMissionCenter: FC<McdNewMissionCenterProps> = ({bg = false, audio = true, icons = ['golden_apple', 'diamond', 'ender_pearl', 'experience_bottle'], nodeName = '沙漠神殿', ...p}) => (
  <McdNewMissionCenterSrc pos="center" bg={bg} audio={audio} icons={icons} nodeName={nodeName} {...p} />
);

/** 制作组呈现开场 (mcd-c-presents)。黑场里一行白色小字以像素乱码逐字拼出“某某出品”，随后龟裂灰石大 Logo 硬切出现（两帧微闪、碎石火星迸出），慢速推近，分级压暗。
 *  用途：视频最开头的制作组署名 + 系列 Logo，节奏像官方预告片的 FROM THE CREATORS OF。整屏卡：bg=true 画纯黑底（本示例）；bg=false 文字和火星可叠在素材上，但 Logo 出现的两帧白闪仍会盖住整屏。
 *  默认时长 150 帧（30fps）。 */
export interface McdPresentsProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 上方白色小字。默认 'Oriel 工作室 出品' */
  lead?: string;
  /** 灰石大 Logo 文字。默认 '地底迷城' */
  logo?: string;
  /** Logo 下的银灰小字。默认 '模组整合包冒险系列' */
  tagline?: string;
  /** Logo 最大宽度（px）。默认 1420 */
  maxW?: number;
  /** 中文字形网格行数。默认 32 */
  cjkRows?: number;
  /** Logo 硬切出现的帧。默认 50 */
  logoAt?: number;
  /** 开始压暗淡出的帧。默认 124 */
  exit?: number;
}
export const McdPresents: FC<McdPresentsProps> = ({bg = false, audio = true, ...p}) => <McdPresentsSrc bg={bg} audio={audio} {...p} />;

/** 系列标题 · 第 N 期 (mcd-c-series-title)。左上角压暗渐变上，金色六边形期数徽章弹出，金色分割线从徽章长出，大标题从左划入（硬阴影粗字），副标题淡入；停留时分割线上每 2 秒有一道光掠过，最后向左滑出。
 *  用途：每期视频开头在画面左上放系列名+期数，直接叠在实机画面上；exit=-1 可一直停留（光掠每 60 帧循环）。bg=true 额外画一个群系场景。
 *  默认时长 150 帧（30fps）。 */
export interface McdSeriesTitleProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 期数（自动补成两位）。默认 5 */
  ep?: number;
  /** 徽章里期数上方的小字。默认 'EP' */
  epLabel?: string;
  /** 大标题上方的金色小字（系列名/季）。默认 '生存系列 · 第二季' */
  kicker?: string;
  /** 大标题。默认 '沉入地牢深处' */
  title?: string;
  /** 副标题。默认 '我们在红石矿山找到了失落的神器' */
  subtitle?: string;
  /** 向左滑出的帧；-1 = 一直停留。默认 124 */
  exit?: number;
  /** 仅 bg=true 时使用的场景群系。默认 'forest-day' */
  biome?: 'forest-day' | 'forest-night' | 'desert' | 'nether' | 'end' | 'snow' | 'world-map' | 'camp';
  /** 中文字形网格行数。默认 28 */
  cjkRows?: number;
}
export const McdSeriesTitle: FC<McdSeriesTitleProps> = ({bg = false, audio = true, ...p}) => <McdSeriesTitleSrc bg={bg} audio={audio} {...p} />;

/** 底部字幕条 · 说话人名牌 (mcd-c-subtitle-bar)。底部升起斜切黑色字幕条；每句逐字打出白色粗字+硬阴影，左侧六边形头像（真实皮肤/村民/苦力怕）和彩色名牌，旁白句无头像；句末金色三角闪烁，句间 4 级淡切。
 *  用途：剧情向/解说向视频的对话和旁白字幕。总时长 ≈ first + 句数 × perLine + 12，按句数自行设置 Sequence 长度。bg=true 额外画群系场景和底部渐变。
 *  默认时长 180 帧（30fps）。 */
export interface McdSubtitleBarProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 字幕数组；skin 可为 steve/alex/村民 villager/creeper/enderman 等（不填则无头像），tone 决定名牌与头像框颜色，who 不填则无名牌。默认 3 句示例对话（旁白 / 史蒂夫 / 村民） */
  lines?: {who?: string; text: string; skin?: string; tone?: 'gold' | 'cyan' | 'green' | 'purple' | 'red' | 'white'}[];
  /** 每句占用的帧数（含打字、停留和淡切）。默认 52 */
  perLine?: number;
  /** 第一句开始的帧。默认 10 */
  first?: number;
  /** 字幕字号（px）。默认 50 */
  size?: number;
  /** 仅 bg=true 时使用的场景群系。默认 'forest-night' */
  biome?: 'forest-day' | 'forest-night' | 'desert' | 'nether' | 'end' | 'snow' | 'world-map' | 'camp';
}
export const McdSubtitleBar: FC<McdSubtitleBarProps> = ({bg = false, audio = true, ...p}) => <McdSubtitleBarSrc bg={bg} audio={audio} {...p} />;

/** 片尾滚动 · 金职位白名字 (mcd-c-credits)。中间一条暗带上自下而上滚动制作名单：金色分组标题 + 金色分割线，职位金色小字（右对齐）与名字白字（左对齐）分居中线两侧；名单淡出、画面压暗后四角括号终卡拼出金字“感谢观看”，火星上飘。
 *  用途：视频最后的制作人员名单；换 groups 即可用到自己的团队。整屏卡：bg=true 画夜林航拍场景；bg=false 叠在任意画面上，但终卡阶段会压一层 86% 的暗色。
 *  默认时长 240 帧（30fps）。 */
export interface McdCreditsProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 名单分组：分组标题 + [职位, 名字] 行。默认 [{head:'制作团队',rows:[['导演 · 剪辑','小明'],…]},{head:'模组与资源',rows:[…]}] */
  groups?: {head: string; rows: [string, string][]}[];
  /** 滚动速度（px/帧）。默认 6 */
  speed?: number;
  /** 第一组标题的起始 y（px）。默认 960 */
  startY?: number;
  /** 终卡金字。默认 '感谢观看' */
  thanks?: string;
  /** 终卡小字。默认 '我们下一期再见' */
  thanksSub?: string;
  /** 名单让位给终卡的帧。默认 186 */
  endAt?: number;
  /** 仅 bg=true 时使用的场景群系。默认 'forest-night' */
  biome?: 'forest-day' | 'forest-night' | 'desert' | 'nether' | 'end' | 'snow' | 'world-map' | 'camp';
}
export const McdCredits: FC<McdCreditsProps> = ({bg = false, audio = true, ...p}) => <McdCreditsSrc bg={bg} audio={audio} {...p} />;

/** 日期标题 · 第 N 天 · 黄昏 (mcd-c-day-title)。六边形天数徽章像翻页日历一样从 day-1 翻到 day，“第 N 天”白色大字从左划入，右侧金线 + 太阳/月亮图标 + 彩色时段词滑入；bg=true 时还有分级天空色罩、方块太阳落向地平线、金色斜射光束。
 *  用途：生存/整合包系列每天开头的日期标题；time 可切 dawn/noon/dusk/night。bg=false 只有一条横向光带、火星和文字（带半透明暗带），叠在实机画面上。
 *  默认时长 150 帧（30fps）。 */
export interface McdDayTitleProps {
  /** 是否绘制效果自带的背景（场景/黑底）；false 时透明，可叠在素材上。默认 false */
  bg?: boolean;
  /** 是否带上效果自带的音效；传 false 静音。默认 true */
  audio?: boolean;
  /** 天数（徽章从 day-1 翻到 day）。默认 3 */
  day?: number;
  /** 大字；不传时自动用“第 N 天”。默认 `第 ${day} 天` */
  dayWord?: string;
  /** 时段：决定天空色、太阳/月亮和默认时段词（黎明/正午/黄昏/深夜）。默认 'dusk' */
  time?: 'dawn' | 'noon' | 'dusk' | 'night';
  /** 自定义时段词。默认 随 time（黄昏等） */
  timeWord?: string;
  /** 徽章里数字上方的小字。默认 'DAY' */
  dayLabel?: string;
  /** 开始淡出的帧。默认 122 */
  exit?: number;
  /** 中文字形网格行数。默认 32 */
  cjkRows?: number;
}
export const McdDayTitle: FC<McdDayTitleProps> = ({bg = false, audio = true, ...p}) => <McdDayTitleSrc bg={bg} audio={audio} {...p} />;

