import type {FC} from 'react';
import type {FxEntry} from '../../types';
import {CompareCard} from './compareCard';
import {DayCounter} from './dayCounter';
import {EpisodeList} from './episodeList';
import {MobCard} from './mobCard';
import {LikeChest} from './likeChest';
import {ModpackBrief} from './modpackBrief';
import {Objectives} from './objectives';
import {PlayerJoin} from './playerJoin';
import {StatsTally} from './statsTally';
import {ToastStack} from './toast';
import {WaypointMark} from './waypoint';

/** Entries for the mcd5 area: dungeon-style showcase motion for adventure / modpack videos. */
export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-v-modpack-brief',
      name: '整合包简报卡',
      category: 'rpg',
      tags: ['地下城', '整合包', '简报', '难度', '片头'],
      frames: 150,
      blurb: '红棕晕光上的斜切暗面板：场景头图与标签、硬阴影包名逐字砸下，模组数滚动、推荐配置、I–VII 六边形难度条上选中节点逐级跳升并挂上书签尾，奖励物品槽依次弹出，最后绿色「出发」按钮点亮。',
      usage: '整合包/冒险地图视频开场介绍配置、难度和奖励；Layer 版只有面板（透明背景），可叠在任何画面上。',
      params: [
        {name: 'name / tagline / version', desc: '包名、一句话简介、版本号'},
        {name: 'mods / spec / gameVer', desc: '模组数量(会滚动)、推荐配置、游戏版本与加载器'},
        {name: 'difficulty', desc: '1..7，难度条选中的节点'},
        {name: 'rewards', desc: '奖励物品 id 数组(item 贴图名)，最多 5–6 个'},
        {name: 'biome / button / tag', desc: '头图场景群系、按钮文字、左上标签'},
      ],
    },
    Demo: (() => <ModpackBrief bg />) as FC,
    Layer: (() => <ModpackBrief />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-episode-list',
      name: '本期目录',
      category: 'rpg',
      tags: ['地下城', '章节', '目录', '片头', '六边形'],
      frames: 150,
      blurb: '左侧斜切暗面板里的章节列表：六边形序号沿竖向进度轨道逐项点亮，已完成的变绿打勾，当前章节金色高亮并扫光、标 NOW，其余变暗；右侧金框菱形显示当前章节的物品预览。',
      usage: '视频开头的章节预览，或中途「我们现在到第几章」的进度提示；Layer 版透明，可直接盖在素材上。',
      params: [
        {name: 'title / episode', desc: '标题「本期目录」与期数标签'},
        {name: 'items', desc: '章节数组 [{title, time}]，建议 4–6 项'},
        {name: 'current', desc: '当前章节序号(0 起)，之前的打勾，之后的变暗'},
        {name: 'preview / biome', desc: '右侧菱形里的物品 id、演示背景群系'},
      ],
    },
    Demo: (() => <EpisodeList bg />) as FC,
    Layer: (() => <EpisodeList />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-objectives',
      name: '目标清单',
      category: 'rpg',
      tags: ['地下城', '任务目标', 'HUD', '右上角', '叠加层'],
      frames: 180,
      blurb: '屏幕右上角的任务目标：金色章节行加骷髅六边形，目标条目逐条从右侧滑入，完成时方框变绿打勾并划线置灰；新增一条目标时整行金色闪烁、迸出火星，同时画面上方居中浮出「新目标」大字再淡出。',
      usage: '冒险/整合包视频里提示「现在要做什么」：叠在录屏右上角即可，Layer 透明；用 items 的 appear/done 帧号对齐剧情。',
      params: [
        {name: 'chapter', desc: '金色章节/地点行'},
        {name: 'items', desc: '目标数组 [{text, appear, done?}]，帧号决定出现与打勾时间，appear 最晚的一条视为新增并触发金闪与居中提示'},
        {name: 'announceLabel', desc: '居中提示的金色小标题，默认「新目标」'},
        {name: 'hud / biome', desc: 'Demo 是否画底部 HUD、背景群系'},
      ],
    },
    Demo: (() => <Objectives bg hud />) as FC,
    Layer: (() => <Objectives />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-stats-tally',
      name: '本期数据结算',
      category: 'rpg',
      tags: ['地下城', '结算', '数据', '评级', '片尾'],
      frames: 190,
      blurb: '黑场淡入后金色「本期完成」+白色标题，左右各两张深色统计卡（死亡次数、击杀数、用时、探索度）逐张滚动计数并金边闪一下；中间灰色菱形框里是玩家头像，计数结束后评级 S/A/B 带白闪、像素十字光与碎屑砸落，菱形变金、月桂展开；底部橙色总评条、绿宝石/灵魂计数与右下金框宝箱收尾。',
      usage: '一期视频/一次挑战的结尾结算：死亡、击杀、用时、探索度一目了然；做挑战类视频的片尾最合适。',
      params: [
        {name: 'title / subtitle / player / skin / level', desc: '金色小标题、白色大标题、玩家名、皮肤 id(steve/efe/zuri…)、等级徽章'},
        {name: 'stats', desc: '{deaths, kills, seconds, explore} 四个统计目标值，按顺序滚动'},
        {name: 'rank', desc: "'S' | 'A' | 'B' | 'C'：金/橙/绿/银 菱形与月桂"},
        {name: 'biome', desc: 'Demo 背景场景群系（压暗蒙蓝）'},
      ],
    },
    Demo: (() => <StatsTally bg />) as FC,
    Layer: (() => <StatsTally />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-mob-card',
      name: '生物/Boss介绍卡',
      category: 'rpg',
      tags: ['地下城', '怪物', 'Boss', '介绍', '属性', '弱点'],
      frames: 168,
      blurb: '左侧红描边黑色剪影被四角括号锁定、红光脉动，随后真实 Minecraft 贴图自脚底向上分格扫出（末影人眼睛亮紫光）；右侧斜切卡片滑入：红色类别标签、硬阴影名牌逐字落下、简介、生命/伤害/速度三个六边形自底向上填充并滚数，最后是橙框弱点物品槽。',
      usage: '视频里第一次出现某个怪物或 Boss 时的介绍：苦力怕、僵尸、骷髅、末影人、凋灵骷髅等；boss=true 会在顶部加 Boss 血条。',
      params: [
        {name: 'mob', desc: "'creeper' | 'zombie' | 'husk' | 'skeleton' | 'wither_skeleton' | 'enderman'，决定使用哪张真实贴图和默认文案"},
        {name: 'name / en / kind / desc', desc: '中文名、英文小标题、类别标签、一句简介'},
        {name: 'stats', desc: '[{label, value, ratio(0..1 填充高度), color, icon}] 三个六边形属性'},
        {name: 'weak', desc: '弱点物品 id 数组（item 贴图名）'},
        {name: 'boss / biome', desc: '是否画顶部 Boss 血条；演示背景群系'},
      ],
    },
    Demo: (() => <MobCard bg />) as FC,
    Layer: (() => <MobCard />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-compare',
      name: '对比卡 A 对 B',
      category: 'rpg',
      tags: ['地下城', '对比', '装备', '模组', '属性条', '评测'],
      frames: 180,
      blurb: '两块斜切面板夹着中间的 VS 六边形：两个装备/模组的菱形稀有度框与名字，攻击/速度/范围三条属性条从中线向外逐行增长并滚动数字，每行胜出的一方变金并挂菱形标记；最后综合分滚动，胜者菱形框变鎏金、弹出 WINNER 标签、十字光与碎屑，败者压暗。',
      usage: '评测、选择类视频：模组 A vs 模组 B、两把武器、两套护甲谁更强，一屏讲清楚。',
      params: [
        {name: 'a / b', desc: '{name, item(物品贴图 id), rarity: common|rare|unique, stats: number[](0..100), tag?}'},
        {name: 'labels', desc: '三行属性名，默认 攻击/速度/范围（行数跟 stats 长度走，建议 3 行）'},
        {name: 'title', desc: '顶部金色小标题'},
        {name: 'winner', desc: "'a' | 'b'，不传则按综合分自动判定"},
      ],
    },
    Demo: (() => <CompareCard bg />) as FC,
    Layer: (() => <CompareCard />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-day-counter',
      name: '生存第 N 天',
      category: 'rpg',
      tags: ['地下城', '生存', '天数', '日出', '六边形', '叠加层'],
      frames: 120,
      blurb: '夜色里的大六边形显示前一天的数字，日出的金色斜射光从右上角铺开；数字像翻牌一样分三格滚出、新天数滚入，六边形外圈由钢灰变金，像素十字闪光与金色碎屑爆开，下方升起一行字幕和三个小数据。Demo 里夜景渐变成白天并升起方块太阳。',
      usage: '生存/整合包系列视频换天时的标题：「生存第 42 天」；Layer 版只有光效、六边形和字，透明，可叠在任意日出镜头上。',
      params: [
        {name: 'day', desc: '新的天数（自动按位数缩放字号），旧数字为 day-1'},
        {name: 'label', desc: '六边形里数字上方的小字，默认 DAY'},
        {name: 'caption / facts', desc: '大字幕和下方三条小数据'},
        {name: 'flipAt', desc: '翻牌发生的帧（默认 44），其余动画跟随它'},
      ],
    },
    Demo: (() => <DayCounter bg />) as FC,
    Layer: (() => <DayCounter />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-player-join',
      name: '玩家加入/离开提示',
      category: 'rpg',
      tags: ['地下城', '联机', '加入', '离开', '提示条', '叠加层'],
      frames: 150,
      blurb: '屏幕左上角斜切暗条从边缘滑入：玩家色竖条、六边形里是真实皮肤头像、金色「加入了冒险」或红色「离开了冒险」加粗体像素名字、右端 +/- 菱形；加入时头像处迸出金色火花与十字光，条上扫过高光，停留后滑出；离开的条头像发灰并掉下灰红碎屑。三条依次错开叠放。',
      usage: '联机冒险/整合包合作视频里有人进出时的提示；Layer 透明，叠在录屏左上角即可，可配合真实时间点逐个添加事件。',
      params: [
        {name: 'events', desc: "[{kind:'join'|'leave', name, skin(steve/alex/kai/zuri/efe…), color(玩家色), at(出现帧), hold(停留帧)}]，按顺序占用上下槽位"},
        {name: 'joinText / leaveText', desc: '提示文案，默认「加入了冒险」「离开了冒险」'},
        {name: 'hud / biome', desc: 'Demo 是否画底部 HUD、背景群系'},
      ],
    },
    Demo: (() => <PlayerJoin bg hud />) as FC,
    Layer: (() => <PlayerJoin />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-waypoint',
      name: '路标/坐标标记',
      category: 'rpg',
      tags: ['地下城', '路标', '坐标', '光柱', '标注', '叠加层'],
      frames: 150,
      blurb: '地面上竖起一道光柱（白/绿/橙/品红），脚下是发光的扁平六边形底座，光柱中段浮着稀有度菱形标记和像素图标，上方是地名牌，下方是实时递减的距离数字和小号坐标；整套随镜头缓慢左右漂移，标记按步进上下浮动，光柱里有上升的光点。',
      usage: '在录屏上标注基地、村庄、传送门、Boss 巢穴等地点；Layer 透明，按画面里地点的位置设 x/ground 即可，可同时放多个不同颜色。',
      params: [
        {name: 'waypoints', desc: "[{x, ground(地面点 y), kind:'white'|'green'|'orange'|'magenta', name, dist(起始米数，会递减), coords, icon:'base'|'flag'|'portal'|'skull', size(1 大/0.7 小), delay}]"},
        {name: 'fadeOutFrames / totalFrames', desc: '结尾淡出的帧数（0 为不淡出）与总帧数，默认 12 / 150'},
        {name: 'biome', desc: 'Demo 背景场景群系'},
      ],
    },
    Demo: (() => <WaypointMark bg />) as FC,
    Layer: (() => <WaypointMark />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-like-chest',
      name: '点赞解锁宝箱',
      category: 'rpg',
      tags: ['地下城', '三连', '点赞', '投币', '收藏', '宝箱', '光柱', '互动'],
      frames: 190,
      blurb: '顶部三个六边形（点赞 / 投币 / 收藏）依次自下而上填满金色并带十字光；末影宝箱先轻跳、随进度发紫光，三连完成后剧烈抖动，然后品红光柱 4 帧内冲出、白闪加像素喷泉，约 1 秒后深色物品卡弹出：鎏金菱形框里的物品、「感谢支持」硬阴影大字、斜体说明和绿色按钮。',
      usage: '视频中途或结尾的「一键三连」互动：比普通的关注提示更有仪式感；也可只截开箱部分作为奖励展示。',
      params: [
        {name: 'labels / headline', desc: '三个节点文字与顶部标题'},
        {name: 'thanks / note / tag / button', desc: '物品卡的主标题「感谢支持」、斜体说明、金色标签、绿色按钮文字'},
        {name: 'item', desc: '金框里的物品 id（item 贴图名），默认 nether_star'},
      ],
    },
    Demo: (() => <LikeChest bg />) as FC,
    Layer: (() => <LikeChest />) as FC,
  },
  {
    meta: {
      id: 'mcd-v-toast',
      name: '成就/提示弹条',
      category: 'rpg',
      tags: ['地下城', '成就', '提示', '弹条', '跳过', '叠加层'],
      frames: 150,
      blurb: '右侧屏幕边缘滑入斜切暗条：金框菱形物品图标 + 金色「成就解锁!」+ 成就名 + 紫色 XP，带扫光与像素十字闪；下面再叠一条紫色「提示 按 M 打开地图」；右下角「按住 E 跳过」提示条，按键帽自下而上被金色填满，填满时白闪并收起。各自有入场过冲、停留、滑出。',
      usage: '剧情过场、解锁新内容、教学提示：成就和提示条叠在录屏右侧，「按住跳过」放在过场右下角；Layer 透明可直接叠加。',
      params: [
        {name: 'title / name / xp / item', desc: '成就条的金色标题、成就名、经验文字、菱形里的物品 id'},
        {name: 'tag / tip / keyLabel', desc: '提示条的紫色标签、前半句、按键帽字母（后半句固定「打开地图」，可在源码改）'},
        {name: 'skipHint / skipKey / skipText', desc: '跳过提示的「按住」「E」「跳过」'},
        {name: 'bg / biome', desc: 'Demo 是否带过场黑边与背景群系'},
      ],
    },
    Demo: (() => <ToastStack bg />) as FC,
    Layer: (() => <ToastStack />) as FC,
  },
];
