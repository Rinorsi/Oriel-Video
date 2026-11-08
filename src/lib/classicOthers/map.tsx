// Library exports for the classicOthers/map group (see src/lib/README.md for the contract).
// The journey maps are FULL-SCREEN scenes (parchment map + HUD frame + camera), not overlays: they cannot sit on footage
// (overlayReady:false). Use them as a shot, e.g. <Sequence from durationInFrames={frames}><MapRouteA2B nodes={...} /></Sequence>,
// or as the A/B of a transition. MapPinPop is the exception: a transparent pin/label overlay.
import type {FC, ReactNode} from 'react';
import {MapAudioCtx} from '../../gallery/fx/map/audio';
import type {MapNode} from '../../gallery/fx/map/engine';
import {MapJourney as CoreJourney, type JourneyCtx, type JourneyKind, type JourneyProps} from '../../gallery/fx/map/journey';
import {FlatMapJourney} from '../../gallery/fx/map/modern';
import {HomeScene, PinPop, RespawnScene, type PinSpec} from '../../gallery/fx/map/scenes';

/** A stop on the map: name 地名, xz 游戏坐标 [x,z], pos 地图上的位置 [u,v]（0..1）, icon 图标（精灵名 house/tent/tower/castle/anchor/bed/chest/flag/skull… 或任意物品 id）, sub 副标题, color 图钉边框色。 */
export type MapNodeSpec = MapNode;
/** 旅行方式：walk 步行 | chain 多站串联 | rail 矿车 | horse 骑马 | boat 乘船 | pearl 末影珍珠 | elytra 鞘翅 | home 回家。 */
export type MapJourneyKind = JourneyKind;
/** 一枚弹出的图钉：x,y 针尖的屏幕坐标（1920x1080）, name 名称, coord 坐标文字, at 落下帧, color 图钉颜色。 */
export type MapPinSpec = PinSpec;
/** MapJourney 的 extraBack/extraWorld/extraScreen 回调参数（高级用法）。 */
export type MapJourneyContext = JourneyCtx;

const Mute: FC<{audio: boolean; children: ReactNode}> = ({audio, children}) => <MapAudioCtx.Provider value={audio}>{children}</MapAudioCtx.Provider>;

// ---------------------------------------------------------------------------------------------- generic journey

export type MapJourneyProps = {
  /** 沿途站点，至少 2 个：首个是起点，末个是终点（地图上的位置用 pos，HUD 里的坐标用 xz） */
  nodes: MapNodeSpec[];
  /** 旅行方式，决定交通工具、路线画法、镜头与音效；默认 'walk' */
  kind?: MapJourneyKind;
  /** 总帧数（结尾镜头自动拉远，最后几帧留给收尾）；默认 300 */
  frames?: number;
  /** 左上角标题牌的大字，默认取 kind 的预设（如“旅程”“矿车线路”） */
  title?: string;
  /** 标题牌副标题，默认“起点名 → 终点名” */
  subtitle?: string;
  /** 地图与路径的随机种子，换一个数得到另一张地图；默认 5 */
  seed?: number;
  /** 出发帧，默认取 kind 预设（约 50–58） */
  startAt?: number;
  /** 每段路程用时（帧），数字或每段一个的数组；默认取 kind 预设 */
  legFrames?: number | number[];
  /** 多站旅程中途每站停留的帧数；默认取 kind 预设 */
  pauseFrames?: number;
  /** 跟随镜头的缩放，越大越近；默认取 kind 预设 */
  followZ?: number;
  /** 盖在地图上的色调（CSS 颜色，或 (帧)=>颜色 的函数），例如黄昏紫；默认无 */
  tint?: string | ((f: number) => string);
  /** 夜间配色的地图；默认 false */
  night?: boolean;
  /** 是否显示边框、图例、小地图、坐标、进度条等 HUD；false 则只剩地图与旅行者。默认 true */
  hud?: boolean;
  /** 替换终点标牌最后一行文字 */
  arriveText?: string;
  /** 不画通用的到站标牌（自带标牌的场景用）；默认 false */
  noSign?: boolean;
  /** 不画终点的通用旗帜/图钉（自带建筑的场景用）；默认 false */
  hideFinalMarker?: boolean;
  /** 到站后旅行者缩小走进终点建筑；默认 false */
  enterBuilding?: boolean;
  /** 高级：在地图背景层（路径之上、旅行者之下）渲染额外内容 */
  extraBack?: (c: MapJourneyContext) => ReactNode;
  /** 高级：在旅行者所在的世界层渲染额外内容（跟随镜头缩放） */
  extraWorld?: (c: MapJourneyContext) => ReactNode;
  /** 高级：在屏幕层渲染额外内容（不随镜头移动） */
  extraScreen?: (c: MapJourneyContext) => ReactNode;
  /** 是否播放音效（脚步、到站提示音等）；默认 true */
  audio?: boolean;
};

/** 地图旅程核心：整屏羊皮纸像素地图，头像沿路线走过一串站点，镜头先拉远再推近跟随，到站弹出标牌。其余 MapRoute* 都是它的预设。 */
export const MapJourney: FC<MapJourneyProps> = ({audio = true, ...p}) => (
  <Mute audio={audio}>
    <CoreJourney {...(p as JourneyProps)} />
  </Mute>
);

/** 预设版本的 props：与 MapJourneyProps 相同，但 nodes 可省略（默认演示站点），kind 固定。 */
export type MapRouteProps = Omit<MapJourneyProps, 'nodes' | 'kind'> & {
  /** 站点列表；省略则用画廊演示站点 */
  nodes?: MapNodeSpec[];
};

const N = (name: string, xz: [number, number], pos: [number, number], icon: string, sub?: string): MapNodeSpec => ({name, xz, pos, icon, sub});

const preset = (kind: MapJourneyKind, defaults: {nodes: MapNodeSpec[]; frames: number; seed: number; title: string}): FC<MapRouteProps> => {
  const C: FC<MapRouteProps> = ({nodes = defaults.nodes, frames = defaults.frames, seed = defaults.seed, title = defaults.title, ...rest}) => (
    <MapJourney {...rest} nodes={nodes} kind={kind} frames={frames} seed={seed} title={title} />
  );
  return C;
};

// ---------------------------------------------------------------------------------------------- route presets

/** 经典 A→B：羊皮纸地图，头像踩着脚印沿虚线从起点图钉走到终点，旗帜升起、标牌弹出。默认 300 帧。 */
export const MapRouteA2B = preset('walk', {
  nodes: [N('白桦村', [-312, 148], [0.27, 0.64], 'house', '出发地'), N('钻石城', [1204, -388], [0.72, 0.38], 'castle', '主城 · 传送枢纽')],
  frames: 300,
  seed: 3,
  title: '前往钻石城',
});

/** 多站串联：四个节点依次到站，路径累计延伸，进度条逐站点亮。默认 480 帧。 */
export const MapRouteChain = preset('chain', {
  nodes: [
    N('篝火营地', [-640, 420], [0.25, 0.66], 'tent', '第 1 站'),
    N('铁匠村', [-120, -180], [0.4, 0.38], 'house', '第 2 站 · 补给'),
    N('古老哨塔', [560, 310], [0.6, 0.64], 'tower', '第 3 站 · 眺望'),
    N('宝藏洞窟', [1204, -388], [0.74, 0.4], 'chest', '终点 · 钻石矿脉'),
  ],
  frames: 480,
  seed: 3,
  title: '四站探险',
});

/** 矿车铁轨：铁轨一段段铺开，头像坐矿车沿直角弯道飞驰，溅出火花。默认 300 帧。 */
export const MapRouteMinecart = preset('rail', {
  nodes: [N('废弃矿井', [-860, 90], [0.26, 0.34], 'iron_pickaxe', '入口'), N('铁轨枢纽站', [980, 420], [0.72, 0.6], 'diamond', '终点 · 红石工坊')],
  frames: 300,
  seed: 6,
  title: '矿车专线',
});

/** 骑马：头像策马飞奔，身后蹄印与尘土，到站勒马。默认 270 帧。 */
export const MapRouteHorse = preset('horse', {
  nodes: [N('草原牧场', [1320, 260], [0.74, 0.6], 'house', '出发'), N('迷雾哨站', [-540, -330], [0.27, 0.34], 'tower', '终点 · 瞭望塔')],
  frames: 270,
  seed: 3,
  title: '策马前行',
});

/** 末影珍珠：紫色抛物线飞越整张地图，拖粒子尾迹，落点传送波纹，头像在远端闪现。默认 240 帧。 */
export const MapRoutePearl = preset('pearl', {
  nodes: [N('要塞前哨', [-420, -260], [0.27, 0.34], 'house', '投掷点'), N('末地传送门', [820, 540], [0.74, 0.62], 'ender_eye', '落点')],
  frames: 240,
  seed: 5,
  title: '末影珍珠',
});

/** 鞘翅飞行：俯视地图，头像展翅滑翔穿过金色方框门，云层掠过。默认 320 帧。 */
export const MapRouteElytra = preset('elytra', {
  nodes: [N('悬崖村', [-980, 360], [0.26, 0.62], 'house', '起飞'), N('天空之城', [1480, -520], [0.68, 0.4], 'elytra', '终点 · 浮空岛')],
  frames: 320,
  seed: 5,
  title: '鞘翅飞行',
});

/** 乘船：海图上白色虚线航线，头像坐船破浪，船尾浪花与水波，靠港抛锚。默认 300 帧。 */
export const MapRouteBoat = preset('boat', {
  nodes: [N('蓝湾港', [-700, 220], [0.27, 0.58], 'anchor', '出港'), N('海盗湾', [1100, -300], [0.74, 0.4], 'chest', '终点 · 宝藏岛')],
  frames: 300,
  seed: 8,
  title: '扬帆出海',
});

// ---------------------------------------------------------------------------------------------- scenes

export type MapHomeProps = {
  /** 总帧数；默认 340 */
  frames?: number;
  /** 地图种子；默认 3 */
  seed?: number;
  /** 小屋名称（会覆盖 nodes[1].name）；默认 '温馨小屋' */
  houseName?: string;
  /** [出发地, 家] 两个站点；默认演示的远征营地 → 小屋（家的 pos 即小屋在地图上的位置） */
  nodes?: [MapNodeSpec, MapNodeSpec];
  /** 灯亮后挂牌上的文字；默认 '欢迎回家' */
  welcomeText?: string;
  /** 标题牌大字；默认 '回家的路' */
  title?: string;
  /** 是否播放音效；默认 true */
  audio?: boolean;
};
/** 回家：黄昏的地图上头像走回小屋，推门进屋、窗户亮灯、暖光与爱心升起、挂牌弹出。整屏场景，默认 340 帧。 */
export const MapHome: FC<MapHomeProps> = ({audio = true, ...p}) => (
  <Mute audio={audio}>
    <HomeScene {...p} />
  </Mute>
);

export type MapRespawnProps = {
  /** 保留参数（时长固定为约 300 帧，由场景自身节奏决定） */
  frames?: number;
  /** 地图种子；默认 5 */
  seed?: number;
  /** 死亡地点节点：name/xz/pos/icon/color；默认 {name:'死亡地点', xz:[1180,-340], pos:[0.72,0.38], icon:'skull'} */
  death?: MapNodeSpec;
  /** 出生点（床）节点：name/sub/xz/pos；默认 {name:'出生点', sub:'重生完成 · 生命值 20 / 20', xz:[12,64], pos:[0.3,0.62]} */
  spawn?: MapNodeSpec;
  /** 标题牌大字；默认 '重生' */
  title?: string;
  /** 倒下时的红色大字；默认 '你死了!' */
  deadText?: string;
  /** 大字下方的得分行；默认 '得分: 0' */
  scoreText?: string;
  /** 底部血量面板的标签；默认 '生命值' */
  hpLabel?: string;
  /** 是否播放音效；默认 true */
  audio?: boolean;
};
/** 重生回床：头像在骷髅标记处倒下，光柱托起，金色拖尾飞越地图落回床边，血量填满。整屏场景，约 300 帧。 */
export const MapRespawn: FC<MapRespawnProps> = ({audio = true, ...p}) => (
  <Mute audio={audio}>
    <RespawnScene {...p} />
  </Mute>
);

export type MapPinPopProps = {
  /** 是否绘制演示用的地图底板（默认 false，透明叠加在你的素材上） */
  bg?: boolean;
  /** 图钉列表：x,y 针尖屏幕坐标 / name 名称 / coord 坐标文字 / at 落下帧 / color 颜色；默认演示 4 个图钉 */
  pins?: MapPinSpec[];
  /** 是否用虚线依次连接各图钉；默认 true */
  connect?: boolean;
  /** 是否播放音效；默认 true */
  audio?: boolean;
};
/** 地点图钉弹出：图钉落下扎进画面，十字闪光与碎片迸开，名称牌与坐标牌弹出，图钉间虚线连起。透明叠加层，默认 150 帧。 */
export const MapPinPop: FC<MapPinPopProps> = ({audio = true, ...p}) => (
  <Mute audio={audio}>
    <PinPop {...p} />
  </Mute>
);

export type MapFlatModernProps = {
  /** 站点列表：首尾两项为起终点（位置自动吸附到最近的路口）；默认 白桦村 → 钻石城 */
  nodes?: MapNodeSpec[];
  /** 城市布局随机种子；默认 4 */
  seed?: number;
  /** 总帧数（结尾拉远）；默认 270 */
  frames?: number;
  /** 左上角标题标签；默认 '步行导航' */
  title?: string;
  /** 出发帧；默认 50 */
  startAt?: number;
  /** 行程帧数；默认 150 */
  legFrames?: number;
  /** 目的地卡片下方的三个路线标签；默认 ['最快路线','无拥堵','少红绿灯'] */
  tags?: [string, string, string];
  /** 到站后底部面板文字；默认 '已到达' */
  arrivedText?: string;
  /** 剩余时间单位；默认 '分钟' */
  minuteUnit?: string;
  /** 剩余距离单位；默认 '公里' */
  kmUnit?: string;
  /** 行进中状态胶囊文字；默认 '导航中' */
  navText?: string;
  /** 到站后状态胶囊文字；默认 '完成' */
  doneText?: string;
  /** 是否播放音效；默认 true */
  audio?: boolean;
};
const FLAT_NODES: MapNodeSpec[] = [
  {name: '白桦村', xz: [-312, 148], pos: [0.24, 0.66], icon: 'house'},
  {name: '钻石城', xz: [1204, -388], pos: [0.78, 0.3], icon: 'castle'},
];
/** 极简现代地图：几何色块城市，靛蓝路线沿街道生长，头像带脉冲光圈前进，顶部转向卡、底部 ETA 面板。整屏场景，默认 270 帧。 */
export const MapFlatModern: FC<MapFlatModernProps> = ({audio = true, nodes = FLAT_NODES, ...p}) => (
  <Mute audio={audio}>
    <FlatMapJourney nodes={nodes} {...p} />
  </Mute>
);
