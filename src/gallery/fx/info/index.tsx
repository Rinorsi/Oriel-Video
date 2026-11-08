import type {FxEntry} from '../../types';
import {CHAPTER_ORE_FRAMES, ChapterOre} from './chapterOre';
import {CHAPTER_FLAT_FRAMES, ChapterFlat} from './chapterFlat';
import {CHAPTER_STONE_FRAMES, ChapterStone} from './chapterStone';
import {LOWER_CUTE_FRAMES, LOWER_ORE_FRAMES, LowerThirdCute, LowerThirdOre} from './lowerThird';
import {AdvancementToasts, TOAST_FRAMES} from './toasts';
import {STAT_FRAMES, StatBars} from './statBars';
import {COMPARE_FRAMES, CompareBars} from './compareBars';
import {BOARD_FRAMES, Leaderboard} from './leaderboard';
import {COUNTDOWN_FRAMES, CountdownBig} from './countdown';
import {COORD_FRAMES, CoordTags} from './coordTag';
import {INGREDIENT_FRAMES, IngredientList} from './ingredientList';
import {DIALOG_FRAMES, DialogSubtitle} from './dialogSubtitle';
import {CREDITS_FRAMES, CreditsRoll} from './credits';

/** Info & subtitle overlays: chapter cards, lower thirds, toasts, HUD bars, charts, countdown, tags, lists, dialog, credits. */
export const entries: FxEntry[] = [
  {
    meta: {
      id: 'info-chapter-ore',
      name: '章节标题卡 · Ore 风',
      category: 'info',
      tags: ['章节', '标题', 'Ore', '分段'],
      frames: CHAPTER_ORE_FRAMES,
      blurb: '上下黑条滑入，Ore 大面板竖向展开，图标框发光，标题逐字砸落，进度段依次点亮，黄黑警示带铺满左右。',
      usage: '每期视频的章节切换，叠在素材上；章节号、标题、提示、图标均可换。',
      params: [
        {name: 'no / total', desc: '当前章节号 / 总章节数（进度段）'},
        {name: 'title', desc: '章节标题，建议 ≤ 7 字'},
        {name: 'hint', desc: '提示一行'},
        {name: 'icon / items', desc: '主图标物品 id；右侧 3 个材料格的物品 id'},
        {name: 'series / next', desc: '顶部系列名、底部下一章'},
      ],
    },
    Demo: () => <ChapterOre bg />,
    Layer: () => <ChapterOre />,
  },
  {
    meta: {
      id: 'info-chapter-stone',
      name: '章节标题卡 · 石质厚重风',
      category: 'info',
      tags: ['章节', '标题', '石质', '厚重', '粒子'],
      frames: CHAPTER_STONE_FRAMES,
      blurb: '石砖横幅从中央展开，石质大字砸落带震屏、裂纹、碎石粉尘，火把摇曳，随后一道光扫过字面。',
      usage: '重头章节、关键转折、Boss 与副本入口；字多时调小 size。',
      params: [
        {name: 'no / tag', desc: '章节号，或直接替换上方小牌文字'},
        {name: 'title', desc: '石质大字，建议 ≤ 6 字'},
        {name: 'sub', desc: '下方副标题'},
        {name: 'size', desc: '大字字号（12 的倍数，默认 240）'},
      ],
    },
    Demo: () => <ChapterStone bg />,
    Layer: () => <ChapterStone />,
  },
  {
    meta: {
      id: 'info-chapter-flat',
      name: '章节标题卡 · 可爱扁平风',
      category: 'info',
      tags: ['章节', '标题', '可爱', '贴纸', '扁平'],
      frames: CHAPTER_FLAT_FRAMES,
      blurb: '五条糖果色斜带扫过，纸片横幅挤压弹入，贴纸大字逐个弹跳，圆章徽标摇摆，史莱姆、小猪、苦力怕从草丘冒出，云朵星星点缀。',
      usage: '轻松向、儿童向、生存日常视频的章节切换。',
      params: [
        {name: 'no', desc: '章节号（圆章）'},
        {name: 'title', desc: '贴纸大字，建议 ≤ 6 字'},
        {name: 'sub', desc: '红色丝带副标题'},
        {name: 'accent', desc: '偶数位字母的颜色'},
      ],
    },
    Demo: () => <ChapterFlat bg />,
    Layer: () => <ChapterFlat />,
  },
  {
    meta: {
      id: 'info-lower-third-ore',
      name: '下三分之一字幕条 · Ore 风',
      category: 'info',
      tags: ['字幕条', '人名条', 'Ore', '头像'],
      frames: LOWER_ORE_FRAMES,
      blurb: '头像框弹出，Ore 名牌从头像后展开，姓名逐字打出，身份标签滑入，光扫掠过，账号小牌掉落，右上角频道角标下滑；结束时名牌卷回头像再离场。',
      usage: '嘉宾、角色、主播出场介绍；叠在人物镜头的左下方。',
      params: [
        {name: 'name', desc: '姓名，建议 ≤ 6 字'},
        {name: 'role', desc: '身份/头衔'},
        {name: 'handle', desc: '账号小牌'},
        {name: 'skin', desc: '头像皮肤路径，如 entity/player/wide/alex.png'},
        {name: 'tag / icon', desc: '右上角频道角标文字与物品 id'},
      ],
    },
    Demo: () => <LowerThirdOre bg />,
    Layer: () => <LowerThirdOre />,
  },
  {
    meta: {
      id: 'info-lower-third-cute',
      name: '下三分之一字幕条 · 可爱风',
      category: 'info',
      tags: ['字幕条', '人名条', '可爱', '贴纸'],
      frames: LOWER_CUTE_FRAMES,
      blurb: '圆形吉祥物头像带虚线转圈弹出，黄色贴纸名牌叠在蓝色底卡上展开，粉色身份丝带翻出，爱心星星漂浮，底部一排云朵，右上角“关注我”胶囊。',
      usage: '轻松向视频的人物/角色介绍，也可作字幕署名条。',
      params: [
        {name: 'name / role', desc: '姓名、身份丝带'},
        {name: 'mascot', desc: '头像精灵：slime | pig | creeper'},
        {name: 'tag', desc: '右上角胶囊文字'},
      ],
    },
    Demo: () => <LowerThirdCute bg />,
    Layer: () => <LowerThirdCute />,
  },
  {
    meta: {
      id: 'info-toast-advancement',
      name: '成就弹窗（任务 / 目标 / 挑战）',
      category: 'info',
      tags: ['成就', '进度', '弹窗', '挑战', '金色'],
      frames: TOAST_FRAMES,
      blurb: '三张成就依次从右侧弹入：钢色方框的任务、绿色切角的目标、金边尖刺紫光的挑战；挑战触发粒子爆发、金色彩屑漫天、屏幕边缘金光和光线。',
      usage: '达成里程碑、拿到关键物品、通关节点；可只传一张。',
      params: [
        {name: 'toasts', desc: '数组：{kind: task|goal|challenge, title, desc, icon, head?}，可传 1~3 项'},
        {name: 'counter', desc: '底部计数条文字'},
      ],
    },
    Demo: () => <AdvancementToasts bg />,
    Layer: () => <AdvancementToasts />,
  },
  {
    meta: {
      id: 'info-stat-bars',
      name: '血量 / 饥饿 / 经验条变化',
      category: 'info',
      tags: ['HUD', '血量', '饥饿', '经验', '受伤', '回复', '数字'],
      frames: STAT_FRAMES,
      blurb: '三条 HUD 条滑入：受伤时血条骤降、苍白残影缓缓追上、整行闪红、屏幕边缘泛红并弹出“-12”；回血时亮绿残影先冲上去、主条追赶、绿光与火花；经验条满格后升级金光、等级数字跳变。',
      usage: '讲生存、战斗、食物机制时展示数值变化；可叠在第一人称画面上。',
      params: [{name: 'scale', desc: '整块 HUD 的缩放（默认 1）'}, {name: '时间轴', desc: '事件时间写在 statBars.tsx 顶部的 HEALTH / HUNGER 数组中'}],
    },
    Demo: () => <StatBars bg />,
    Layer: () => <StatBars />,
  },
  {
    meta: {
      id: 'info-compare-bars',
      name: '属性对比条',
      category: 'info',
      tags: ['对比', '属性', '条形图', '胜出', '数字滚动'],
      frames: COMPARE_FRAMES,
      blurb: '两件物品卡从上方落下，VS 徽章砸中，四行属性条从中线向两侧生长、数字滚动，胜出方变金并闪光、落败方变灰，最后弹出胜负横幅与彩屑。',
      usage: '装备、武器、方块、生物的属性对比；评测类视频的核心图表。',
      params: [
        {name: 'left / right', desc: '{id 物品 id, name, tag, color}'},
        {name: 'rows', desc: '[{label, l, r, max, dec?}] 数值与满格值，相等视为平手'},
        {name: 'title', desc: '面板标题'},
      ],
    },
    Demo: () => <CompareBars bg />,
    Layer: () => <CompareBars />,
  },
  {
    meta: {
      id: 'info-leaderboard',
      name: '排行榜 Top5',
      category: 'info',
      tags: ['排行榜', '排名', '榜单', '皇冠', '名次变动'],
      frames: BOARD_FRAMES,
      blurb: '两侧挂旗垂下，五行按名次依次从右滑入；分数刷新后行与行互相超越、交换位置，上升者闪绿并标出名次变化，皇冠沿弧线飞向新的第一名，伴随光芒与粒子。',
      usage: '击杀榜、建造榜、竞速榜、投票结果等；一次展示榜单变动。',
      params: [
        {name: 'players', desc: '[{name, skin 路径, a 更新前分数, b 更新后分数}]，名次由分数自动计算'},
        {name: 'title / unit', desc: '标题；右上角周期标签前缀'},
      ],
    },
    Demo: () => <Leaderboard bg />,
    Layer: () => <Leaderboard />,
  },
  {
    meta: {
      id: 'info-countdown-big',
      name: '大数字倒计时 5-4-3-2-1',
      category: 'info',
      tags: ['倒计时', '数字', '开始', '冲击', '粒子'],
      frames: COUNTDOWN_FRAMES,
      blurb: '五个方块像素大数字依次砸在切角方块底板上：整屏压缩脉冲、像素碎片飞溅、短震屏，底板下的分段计时条逐格耗尽，两侧色块计数；最后“开始!”底板展宽、金色闪光与彩屑。',
      usage: '比赛开始、挑战开局、发布会/抽奖倒数、视频开场卡点。',
      params: [
        {name: 'from', desc: '起始数字（默认 5）'},
        {name: 'go', desc: '结尾文字（默认“开始!”）'},
        {name: 'colors', desc: '每个数字的填充色数组（取自 Ore 色板）'},
      ],
    },
    Demo: () => <CountdownBig bg />,
    Layer: () => <CountdownBig />,
  },
  {
    meta: {
      id: 'info-coord-tag',
      name: '坐标标签',
      category: 'info',
      tags: ['坐标', '标签', '指针', '地名', '定位'],
      frames: COORD_FRAMES,
      blurb: '地面像素碎片闪光标出位置，细杆升起，带指针的 Ore 标签果冻般弹出，X/Y/Z 数字滚动、微微浮动；顶部罗盘条同步标出方位，结束时标签收回成小钉。',
      usage: '标注基地、矿洞、村庄、传送门等位置；可叠多个。把 x、y 对准画面里的目标点即可。',
      params: [{name: 'tags', desc: '[{x, y 目标点屏幕坐标, name, xyz:[X,Y,Z], color, at 起始帧, dist?, icon?}]'}],
    },
    Demo: () => <CoordTags bg />,
    Layer: () => <CoordTags />,
  },
  {
    meta: {
      id: 'info-ingredient-list',
      name: '材料清单卡',
      category: 'info',
      tags: ['材料', '清单', '合成', '勾选', '出处'],
      frames: INGREDIENT_FRAMES,
      blurb: '清单面板从左滑入，五行（图标 + 名称 + 出处 + 数量）逐行弹入，随后逐行打钩、行底泛绿；齐全时盖“材料齐全！”章，右侧成品卡从剪影点亮并爆出光芒与彩屑。',
      usage: '合成/建造/红石教程开头交代需要准备什么；也可只用清单部分。',
      params: [
        {name: 'title', desc: '面板标题'},
        {name: 'rows', desc: '[{id 物品 id, name, count, src 出处}]（建议 4~5 行）'},
        {name: 'result', desc: '{id, name, line} 右侧成品卡'},
      ],
    },
    Demo: () => <IngredientList bg />,
    Layer: () => <IngredientList />,
  },
  {
    meta: {
      id: 'info-subtitle-dialog',
      name: '对话字幕',
      category: 'info',
      tags: ['对话', '字幕', '头像', '气泡', '逐字'],
      frames: DIALOG_FRAMES,
      blurb: '左右两位角色头像，说话者发亮并上下弹跳，气泡带指针指向说话者；文字逐字打出并轻微抖动，感叹号 / 问号 / 省略号 / 音符弹出，打完出现继续箭头。',
      usage: '角色对话、剧情小短剧、双人解说的字幕；换人说话自动切换气泡方向。',
      params: [
        {name: 'speakers', desc: '[{name, skin 路径, color}]，0 在左、1 在右'},
        {name: 'lines', desc: '[{who: 0|1, text, tone: shout|ask|dots|happy}]，每句约 62 帧'},
      ],
    },
    Demo: () => <DialogSubtitle bg />,
    Layer: () => <DialogSubtitle />,
  },
  {
    meta: {
      id: 'info-sponsor-credit',
      name: '片尾鸣谢滚动',
      category: 'info',
      tags: ['片尾', '鸣谢', '字幕滚动', '制作名单', '赞助'],
      frames: CREDITS_FRAMES,
      blurb: '深色星空底，三层星点与流星视差漂移，两侧像素物品列反向滚动；职位与名字两栏向上滚，经过中线的一行被聚光放大，赞助分档着色，最后减速停在“谢谢观看”。',
      usage: '视频片尾；叠在最后一个镜头上，自带暗化底，也可去掉 bg 单独导出。',
      params: [
        {name: 'sections', desc: '[{title, rows: [[职位, 名字]] | names: string[] | tiers: [{label, icon, color, names}]}]'},
        {name: 'closing', desc: '收尾大字（默认“谢谢观看”）'},
      ],
    },
    Demo: () => <CreditsRoll bg />,
    Layer: () => <CreditsRoll />,
  },
];
