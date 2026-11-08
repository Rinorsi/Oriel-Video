import type {FxEntry} from '../../types';
import {TitleScramble} from './titleScramble';
import {VoxelLogo} from './voxelLogo';

import {EndCard} from './endCard';

import {ChapterDemo} from './chapterCard';

import {NewMission} from './newMission';

import {Presents} from './presents';

import {SeriesTitle} from './seriesTitle';

import {SubtitleBar} from './subtitleBar';

import {Credits} from './credits';

import {DayTitle} from './dayTitle';

/** Entries for the mcd4 area: title cards, chapter cards, end cards, credits (video bookends). */
export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-c-title-scramble',
      name: '预告片标题卡·像素错位',
      category: 'rpg',
      tags: ['地下城', '标题卡', '预告片', '金字', '火星'],
      frames: 150,
      blurb: '硬切纯黑，金色大字先以像素错位乱码出现 3 帧，随即拼合，伴随火星与碎屑方块喷出，慢速推近，最后分级压暗收尾。',
      usage: '每期视频开头/章节开头的标题卡；Layer 版可叠在素材上。',
      params: [
        {name: 'title', desc: '标题文字（中英文均可，自动按宽度取整数像素字号）'},
        {name: 'subtitle', desc: '标题下的小字'},
        {name: 'look', desc: "字面材质：'gold'|'logo'|'stone'|'white'"},
        {name: 'maxW', desc: '标题最大宽度'},
        {name: 'at', desc: '标题出现的帧（默认 4）'},
        {name: 'hold', desc: '开始压暗的帧'},
      ],
    },
    Demo: () => <TitleScramble />,
    Layer: () => <TitleScramble bg={false} />,
  },
  {
    meta: {
      id: 'mcd-c-title-voxel-assemble',
      name: '方块拼合 Logo',
      category: 'rpg',
      tags: ['地下城', 'logo', '体素', '片头', '拼合'],
      frames: 180,
      blurb: '标题由一堆真实金块贴图的方块从四面翻滚飞来，逐个锁进字形并轻微挤压回弹，随后一道光扫掠过；Logo 带轻微 3D 摇摆，正面/底面/侧面明暗各异，最后方块散落。',
      usage: '频道/系列/整合包 Logo 的片头出场；换 tint 可变成石砖或熔岩质感。',
      params: [
        {name: 'text', desc: 'Logo 文字'},
        {name: 'sub', desc: 'Logo 下方的小字'},
        {name: 'cube', desc: '方块最大边长（自动按宽度缩小）'},
        {name: 'tint', desc: "'gold' | 'stone' | 'ember' 方块材质组"},
        {name: 'start / exit', desc: '开始飞入 / 开始散落的帧'},
        {name: 'cjkRows', desc: '中文字形网格行数（越小方块越大越像体素）'},
      ],
    },
    Demo: () => <VoxelLogo />,
    Layer: () => <VoxelLogo bg={false} />,
  },
  {
    meta: {
      id: 'mcd-c-end-card',
      name: '终卡·四角括号',
      category: 'rpg',
      tags: ['地下城', '终卡', '片尾', '感谢观看', '火星'],
      frames: 210,
      blurb: '暗底马赛克 + 底部暖光，四角像素括号与细框线从角落生长；灰石小标题、橙金 Logo 两侧带花括号、金字「感谢观看」、链接与制作组一行，火星持续上飘，最后分级压暗。',
      usage: '每期视频最后 5–7 秒的终卡，也可放在片尾滚动之后；Layer 版可直接叠在画面上。',
      params: [
        {name: 'kicker', desc: '灰石小标题（Logo 上方）'},
        {name: 'title', desc: 'Logo 文字'},
        {name: 'thanks', desc: '金字感谢语'},
        {name: 'link', desc: '感谢语下的链接/号召文案'},
        {name: 'studios', desc: '底部制作组名称数组'},
        {name: 'note', desc: '最底部免责/版权小字'},
        {name: 'exit', desc: '开始压暗的帧'},
      ],
    },
    Demo: () => <EndCard />,
    Layer: () => <EndCard bg={false} />,
  },

  {
    meta: {
      id: 'mcd-c-chapter-card',
      name: '章节卡·六边形翻牌',
      category: 'rpg',
      tags: ['地下城', '章节卡', '六边形', '翻牌', '标题'],
      frames: 240,
      blurb: '场景被压暗，中间一条黑色横幅（金色上下边线）：六边形背面翻过来露出「第 N 章」序号，章节名硬阴影大字、金色分割线、一行副标题依次出现。前半段硬切进出，后半段 45° 斜边横向划入再向右划出。',
      usage: '视频分章节时的章节标题；cut 适合紧凑快节奏，slide 适合更舒展的过渡。Layer 版只含压暗和横幅，可直接叠在素材上。',
      params: [
        {name: 'n', desc: '章节序号'},
        {name: 'name', desc: '章节名'},
        {name: 'sub', desc: '副标题一行'},
        {name: 'mode', desc: "'cut' 硬切 | 'slide' 横向划入"},
        {name: 'biome', desc: 'Demo 背景场景（ScenePlate 群系）'},
        {name: 'label', desc: '六边形内的小字（默认 CHAPTER）'},
        {name: 'exit', desc: '横幅离场的帧'},
      ],
    },
    Demo: () => <ChapterDemo />,
    Layer: () => <ChapterDemo bg={false} />,
  },

  {
    meta: {
      id: 'mcd-c-new-mission',
      name: '新任务解锁面板',
      category: 'rpg',
      tags: ['地下城', '任务', '解锁', '世界地图', '面板'],
      frames: 150,
      blurb: '地图右下角弹出斜切深色面板，金色「新任务解锁」；三个灰色上锁的六边形节点依次点亮成金色并带像素十字闪光，数字滚动到 3，绿色「查看下一个」按钮被按下后面板收走。Demo 里同时在地图上冒出一个金色任务节点。',
      usage: '展示整合包/地图的新内容、新关卡、新章节解锁；pos="center" 变成画面中间的大号版本。Layer 版为透明面板，叠在任意素材上。',
      params: [
        {name: 'title', desc: '面板标题（金字）'},
        {name: 'icons', desc: '解锁节点里的物品贴图 id 数组（节点数 = 任务数）'},
        {name: 'countLabel', desc: '数字后面的文字，如「个新任务」'},
        {name: 'button', desc: '绿色按钮文字'},
        {name: 'pos', desc: "'corner' 右下角 | 'center' 画面中间"},
        {name: 'exit', desc: '面板离场的帧'},
      ],
    },
    Demo: () => <NewMission />,
    Layer: () => <NewMission bg={false} />,
  },
  {
    meta: {
      id: 'mcd-c-new-mission-center',
      name: '新任务解锁面板·居中',
      category: 'rpg',
      tags: ['地下城', '任务', '解锁', '居中', '面板'],
      frames: 150,
      blurb: '画面压暗，中间弹出放大的新任务面板，节点依次解锁、数字滚动、按钮按下后收起。',
      usage: '需要强调「这是重点新内容」时用居中版；右下角版见 mcd-c-new-mission。',
      params: [{name: 'pos', desc: "'center'"}],
    },
    Demo: () => <NewMission pos="center" nodeName="沙漠神殿" icons={['golden_apple', 'diamond', 'ender_pearl', 'experience_bottle']} />,
    Layer: () => <NewMission pos="center" bg={false} icons={['golden_apple', 'diamond', 'ender_pearl', 'experience_bottle']} />,
  },

  {
    meta: {
      id: 'mcd-c-presents',
      name: '制作组呈现开场',
      category: 'rpg',
      tags: ['地下城', '出品', '开场', 'Logo', '预告片'],
      frames: 150,
      blurb: '黑场里一行白色小字以像素乱码逐字拼出「某某出品」，随后龟裂灰石大 Logo 硬切出现（两帧微闪、碎石火星迸出），慢速推近，分级压暗。',
      usage: '视频最开头的制作组署名 + 系列 Logo；节奏像官方预告片的 FROM THE CREATORS OF。',
      params: [
        {name: 'lead', desc: '上方小字，如「某某工作室 出品」'},
        {name: 'logo', desc: '灰石大 Logo 文字'},
        {name: 'tagline', desc: 'Logo 下的一行银灰小字'},
        {name: 'logoAt', desc: 'Logo 硬切出现的帧'},
        {name: 'exit', desc: '开始压暗的帧'},
      ],
    },
    Demo: () => <Presents />,
    Layer: () => <Presents bg={false} />,
  },

  {
    meta: {
      id: 'mcd-c-series-title',
      name: '系列标题·第 N 期',
      category: 'rpg',
      tags: ['地下城', '系列标题', '期数', '左上角', '字幕叠层'],
      frames: 150,
      blurb: '左上角压暗渐变上，金色六边形期数徽章弹出，金色分割线从徽章长出，大标题从左划入（硬阴影粗字），副标题淡入；停留时分割线上每 2 秒有一道光掠过，最后向左滑出。',
      usage: '每期视频开头在画面上方放系列名+期数，Layer 版直接叠在实机画面上；exit=-1 可一直停留（带循环光掠）。',
      params: [
        {name: 'ep', desc: '期数（自动补成两位）'},
        {name: 'epLabel', desc: '徽章里的小字，默认 EP'},
        {name: 'kicker', desc: '标题上方的金色小字（系列名/季）'},
        {name: 'title', desc: '大标题'},
        {name: 'subtitle', desc: '副标题'},
        {name: 'exit', desc: '离场帧；-1 = 一直停留'},
      ],
    },
    Demo: () => <SeriesTitle />,
    Layer: () => <SeriesTitle bg={false} />,
  },

  {
    meta: {
      id: 'mcd-c-subtitle-bar',
      name: '底部字幕条·说话人名牌',
      category: 'rpg',
      tags: ['地下城', '字幕', '对话', '旁白', '名牌'],
      frames: 180,
      blurb: '底部升起斜切黑色字幕条；每句逐字打出白色粗字+硬阴影，左侧六边形头像（真实皮肤/村民/苦力怕）和彩色名牌，旁白句无头像；句末金色三角闪烁，句间 4 级淡切。',
      usage: '做剧情向/解说向视频的对话和旁白字幕；Layer 版直接叠在素材上。',
      params: [
        {name: 'lines', desc: '字幕数组 [{who, text, skin, tone}]，skin 可为 steve/alex/villager/creeper/enderman，tone 决定名牌和头像框的颜色'},
        {name: 'perLine', desc: '每句占用的帧数（含打字、停留和淡切）'},
        {name: 'first', desc: '第一句开始的帧'},
        {name: 'size', desc: '字幕字号'},
      ],
    },
    Demo: () => <SubtitleBar />,
    Layer: () => <SubtitleBar bg={false} />,
  },

  {
    meta: {
      id: 'mcd-c-credits',
      name: '片尾滚动·金职位白名字',
      category: 'rpg',
      tags: ['地下城', '片尾', '制作名单', '滚动', '终卡'],
      frames: 240,
      blurb: '夜林航拍背景缓慢推进，中间一条暗带上自下而上滚动制作名单：金色分组标题 + 金色分割线，职位金色小字（右对齐）与名字白字（左对齐）分居中线两侧；名单淡出、场景压暗后四角括号终卡拼出金字「感谢观看」，火星上飘。',
      usage: '视频最后的制作人员名单；换 groups 即可用到自己的团队；Layer 版没有场景，可叠在任意画面。',
      params: [
        {name: 'groups', desc: '[{head, rows:[[职位, 名字], ...]}] 名单分组'},
        {name: 'speed', desc: '滚动速度（px/帧），默认 6'},
        {name: 'startY', desc: '第一组标题起始 y'},
        {name: 'thanks / thanksSub', desc: '终卡金字与小字'},
        {name: 'endAt', desc: '名单让位给终卡的帧'},
        {name: 'biome', desc: '背景 ScenePlate 群系'},
      ],
    },
    Demo: () => <Credits />,
    Layer: () => <Credits bg={false} />,
  },

  {
    meta: {
      id: 'mcd-c-day-title',
      name: '日期标题·第 N 天 · 黄昏',
      category: 'rpg',
      tags: ['地下城', '生存', '天数', '黄昏', '日出日落'],
      frames: 150,
      blurb: '场景被分级天空色罩住，方块太阳缓缓落向黑色地平线，金色斜射光束与一条横向光带扫开；六边形天数徽章像翻页日历一样从 2 翻到 3，「第 3 天」白色大字从左划入，右侧金线 + 太阳图标 + 橙色「黄昏」滑入。',
      usage: '生存/整合包系列每天开头的日期标题；time 可切 dawn/noon/dusk/night（月亮），Layer 版只有光带与文字，叠在实机画面上。',
      params: [
        {name: 'day', desc: '天数（徽章从 day-1 翻到 day）'},
        {name: 'dayWord', desc: '大字，默认「第 N 天」'},
        {name: 'time', desc: "'dawn' | 'noon' | 'dusk' | 'night' 决定天空色、太阳/月亮和时段词"},
        {name: 'timeWord', desc: '自定义时段词'},
        {name: 'dayLabel', desc: '徽章里的小字'},
        {name: 'exit', desc: '开始淡出的帧'},
      ],
    },
    Demo: () => <DayTitle />,
    Layer: () => <DayTitle bg={false} />,
  },

];
