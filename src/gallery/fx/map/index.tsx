import type {FC} from 'react';
import type {FxEntry} from '../../types';
import {MapJourney, type JourneyProps} from './journey';
import type {MapNode} from './engine';
import {FlatMapJourney} from './modern';
import {HomeScene, PinPop, RespawnScene} from './scenes';

/**
 * Map area entries. Every journey entry is <MapJourney nodes kind ... /> (see journey.tsx for the full prop list):
 *   nodes   MapNode[]  { name, xz:[x,z], pos:[u,v] on the map (0..1), icon (sprite key or item id), sub }
 *   kind    walk | chain | rail | horse | boat | pearl | elytra | home
 *   frames  length in frames; seed changes the map and the path wiggle
 */

const N = (name: string, xz: [number, number], pos: [number, number], icon: string, sub?: string): MapNode => ({name, xz, pos, icon, sub});

const mk = (p: JourneyProps): FC => () => <MapJourney {...p} />;

const PARAM_NODES = {name: 'nodes', desc: 'MapNode[]：name 地名 / xz 游戏坐标 [x,z] / pos 地图位置 [0..1, 0..1] / icon 图标（pixel 精灵名或物品 id）/ sub 副标题'};
const PARAM_COMMON = [
  {name: 'frames', desc: '总帧数（默认随演示），结尾镜头自动拉远'},
  {name: 'seed', desc: '地图与路径随机种子，换一个数得到另一张地图'},
  {name: 'startAt / legFrames / pauseFrames', desc: '出发帧 / 每段用时（可传数组）/ 中途停站帧数'},
  {name: 'followZ', desc: '跟随镜头的缩放，越大越近'},
  {name: 'title / subtitle', desc: '左上角标题牌文字'},
];

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'map-route-a2b',
      name: '地图旅程 · 经典 A→B',
      category: 'map',
      tags: ['地图', '旅程', '步行', '路线', '像素', '藏宝图'],
      frames: 300,
      blurb: '羊皮纸像素地图铺满全屏，镜头先拉远再推近，头像踩着脚印沿虚线从起点图钉走到终点，旗帜升起、标牌弹出。',
      usage: '介绍“从某地前往某地”、探险路线、跑图开场、下期预告地点。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [N('白桦村', [-312, 148], [0.27, 0.64], 'house', '出发地'), N('钻石城', [1204, -388], [0.72, 0.38], 'castle', '主城 · 传送枢纽')],
      kind: 'walk',
      frames: 300,
      seed: 3,
      title: '前往钻石城',
    }),
  },
  {
    meta: {
      id: 'map-route-chain',
      name: '地图旅程 · 多站串联',
      category: 'map',
      tags: ['地图', '旅程', '多节点', '串联', '路线', '像素'],
      frames: 480,
      blurb: '四个节点依次到站：每站图标不同、路径累计延伸、进度条逐站点亮，每到一站弹出标牌和冲击波。',
      usage: '多地点探险路线、攻略“一路经过哪些点”、系列视频目录。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [
        N('篝火营地', [-640, 420], [0.25, 0.66], 'tent', '第 1 站'),
        N('铁匠村', [-120, -180], [0.4, 0.38], 'house', '第 2 站 · 补给'),
        N('古老哨塔', [560, 310], [0.6, 0.64], 'tower', '第 3 站 · 眺望'),
        N('宝藏洞窟', [1204, -388], [0.74, 0.4], 'chest', '终点 · 钻石矿脉'),
      ],
      kind: 'chain',
      frames: 480,
      seed: 3,
      title: '四站探险',
    }),
  },
  {
    meta: {
      id: 'map-route-minecart',
      name: '地图旅程 · 矿车铁轨',
      category: 'map',
      tags: ['地图', '旅程', '矿车', '铁轨', '火花', '像素'],
      frames: 300,
      blurb: '铁轨在前方一段段铺开，头像坐在矿车里沿直角弯道飞驰，车轮溅出火花，车身抖动，到站冲击波。',
      usage: '矿洞/地铁/红石线路、矿车运输介绍、快速抵达某地。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [N('废弃矿井', [-860, 90], [0.26, 0.34], 'iron_pickaxe', '入口'), N('铁轨枢纽站', [980, 420], [0.72, 0.6], 'diamond', '终点 · 红石工坊')],
      kind: 'rail',
      frames: 300,
      seed: 6,
      title: '矿车专线',
    }),
  },
  {
    meta: {
      id: 'map-route-horse',
      name: '地图旅程 · 骑马',
      category: 'map',
      tags: ['地图', '旅程', '骑马', '蹄印', '尘土', '像素'],
      frames: 270,
      blurb: '头像骑着马飞奔，身后留下一串蹄印和滚滚尘土，镜头微微拉远营造速度感，到站勒马。',
      usage: '赶路、追逐、牧场到哨站的快速移动。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [N('草原牧场', [1320, 260], [0.74, 0.6], 'house', '出发'), N('迷雾哨站', [-540, -330], [0.27, 0.34], 'tower', '终点 · 瞭望塔')],
      kind: 'horse',
      frames: 270,
      seed: 3,
      title: '策马前行',
    }),
  },
  {
    meta: {
      id: 'map-route-pearl',
      name: '地图旅程 · 末影珍珠',
      category: 'map',
      tags: ['地图', '旅程', '末影珍珠', '传送', '抛物线', '紫色'],
      frames: 240,
      blurb: '珍珠划出紫色抛物线飞越整张地图，拖着粒子尾迹，落点荡开传送波纹，头像在远端闪现。',
      usage: '传送、瞬移、“一秒到达”的转场式地点跳转。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [N('要塞前哨', [-420, -260], [0.27, 0.34], 'house', '投掷点'), N('末地传送门', [820, 540], [0.74, 0.62], 'ender_eye', '落点')],
      kind: 'pearl',
      frames: 240,
      seed: 5,
      title: '末影珍珠',
    }),
  },
  {
    meta: {
      id: 'map-route-elytra',
      name: '地图旅程 · 鞘翅飞行',
      category: 'map',
      tags: ['地图', '旅程', '鞘翅', '飞行', '云层', '穿环'],
      frames: 320,
      blurb: '俯视地图，镜头拉得更高，头像展翅滑翔、尾迹拖曳，穿过金色切角方框门，大朵云层从画面前方掠过。',
      usage: '远距离飞行、鞘翅竞速、跨地图探索、空中俯瞰。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [N('悬崖村', [-980, 360], [0.26, 0.62], 'house', '起飞'), N('天空之城', [1480, -520], [0.68, 0.4], 'elytra', '终点 · 浮空岛')],
      kind: 'elytra',
      frames: 320,
      seed: 5,
      title: '鞘翅飞行',
    }),
  },
  {
    meta: {
      id: 'map-route-boat',
      name: '地图旅程 · 乘船',
      category: 'map',
      tags: ['地图', '旅程', '乘船', '海上', '波纹', '航线'],
      frames: 300,
      blurb: '海图上一条白色虚线航线，头像坐船破浪前行，船尾拖出 V 形浪花与扩散的水波纹，靠港抛锚。',
      usage: '跨海旅行、海洋神殿/海盗岛探险、群岛之间的航行。',
      params: [PARAM_NODES, ...PARAM_COMMON],
    },
    Demo: mk({
      nodes: [N('蓝湾港', [-700, 220], [0.27, 0.58], 'anchor', '出港'), N('海盗湾', [1100, -300], [0.74, 0.4], 'chest', '终点 · 宝藏岛')],
      kind: 'boat',
      frames: 300,
      seed: 8,
      title: '扬帆出海',
    }),
  },
  {
    meta: {
      id: 'map-home',
      name: '地图旅程 · 回家',
      category: 'map',
      tags: ['地图', '旅程', '回家', '黄昏', '温馨', '小屋'],
      frames: 340,
      blurb: '黄昏的地图上头像从远方走回小屋，推门进屋，窗户亮灯，暖光扩散、爱心与萤火升起，挂牌弹出“欢迎回家”。',
      usage: '回到基地、新家展示、一集的温馨收尾、返回出生点。',
      params: [{name: 'houseName', desc: '小屋名称'}, {name: 'frames / seed', desc: '总帧数 / 地图种子'}, {name: 'nodes（MapJourney）', desc: '换用 MapJourney kind="home" 可自定义出发地与家的坐标'}],
    },
    Demo: () => <HomeScene frames={340} seed={3} />,
  },
  {
    meta: {
      id: 'map-respawn',
      name: '地图旅程 · 重生回床',
      category: 'map',
      tags: ['地图', '重生', '死亡', '光柱', '床', '出生点'],
      frames: 300,
      blurb: '头像在骷髅标记处倒下（红叉、掉落物、血量清零），一道光柱把它托起，金色拖尾飞越地图落回出生点的床，血量重新填满。',
      usage: '死亡回放、重生/复活梗、回到出生点、生存挑战的“再来一次”。',
      params: [{name: 'seed', desc: '地图种子'}, {name: '节点', desc: '死亡点与出生点在 scenes.tsx 的 Duv / Buv（0..1）中修改'}],
    },
    Demo: () => <RespawnScene />,
  },
  {
    meta: {
      id: 'map-pin-pop',
      name: '地点图钉弹出',
      category: 'map',
      tags: ['地图', '图钉', '地点', '标记', '小组件', '叠加层'],
      frames: 150,
      blurb: '图钉从天而降扎进地图，像素十字闪光与碎片迸开，名称牌与坐标牌先后弹出，图钉之间用虚线依次连起来。',
      usage: '叠在任意画面上标注地点、坐标、基地位置；也可单独导出透明层。',
      params: [{name: 'pins', desc: 'PinSpec[]：x,y 针尖屏幕坐标 / name 名称 / coord 坐标文字 / at 落下帧 / color 颜色'}, {name: 'connect', desc: '是否用虚线依次连接各图钉'}, {name: 'bg', desc: 'Demo 带地图底板，Layer 为透明叠加层'}],
    },
    Demo: () => <PinPop bg />,
    Layer: () => <PinPop />,
  },
  {
    meta: {
      id: 'map-flat-modern',
      name: '地图旅程 · 极简现代地图',
      category: 'map',
      tags: ['地图', '旅程', '极简', '现代', '导航', '扁平'],
      frames: 270,
      blurb: '非像素风的几何色块城市地图：街区、公园、河流、干道，靛蓝路线沿街道生长，头像带脉冲光圈前进，顶部转向卡、底部 ETA 面板，到站珊瑚色图钉弹起。',
      usage: '想要干净现代的导航风格、与像素风格区分的路线展示，或“手机导航”式的地点说明。',
      params: [{name: 'nodes', desc: 'MapNode[]：首尾两项为起终点，位置自动吸附到最近的路口'}, {name: 'seed', desc: '城市布局随机种子'}, {name: 'title / frames / startAt / legFrames', desc: '标题标签 / 总帧数 / 出发帧 / 行程帧数'}],
    },
    Demo: () => (
      <FlatMapJourney
        nodes={[
          {name: '白桦村', xz: [-312, 148], pos: [0.24, 0.66], icon: 'house'},
          {name: '钻石城', xz: [1204, -388], pos: [0.78, 0.3], icon: 'castle'},
        ]}
        seed={4}
      />
    ),
  },
];
