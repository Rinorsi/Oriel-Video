import type {FC} from 'react';
import {BackdropLoop} from '../../../mg/DayCycle';
import {INTRO_FRAMES, Intro} from '../../../story/Intro';
import {S10_FRAMES, S6_FRAMES, S7_FRAMES, S8_FRAMES, S9_FRAMES, ShotDayCycle, ShotEnchant, ShotEnd, ShotHud, ShotMenu} from '../../../reel/shotsB';
import {S1_FRAMES, S2_FRAMES, S3_FRAMES, S4_FRAMES, S5_FRAMES, ShotCraft, ShotHotbar, ShotOpen, ShotSettings, ShotToast} from '../../../reel/shotsA';
import {TRANSITIONS} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import type {FxEntry} from '../../types';

/** The first batch: the nine reel transitions, the ten reel shots, the intro and the four sky loops. */

const T = TRANSITIONS;

const transitions: FxEntry[] = [
  transitionEntry(T.mosaic, {name: '方块马赛克', tags: ['像素', '章节切换', '方块'], blurb: '一格格方块纹理从中心向外弹出盖住画面，再反向弹开。', usage: '两个场景之间的标准转场，节奏明快。'}),
  transitionEntry(T.push, {name: '推拉', tags: ['平移', '快切'], blurb: 'A 画面向左推出，B 画面从右推入，带绿色边线。', usage: '同一话题下的连续镜头，快节奏切换。'}),
  transitionEntry(T.zoom, {name: '缩放穿越', tags: ['冲击', '进入'], blurb: 'A 画面放大虚化穿过，B 画面从小变大落定，中间一层光。', usage: '进入新地点、新话题，有"冲进去"的感觉。'}),
  transitionEntry(T.curtain, {name: '石砖幕布', tags: ['厚重', '章节切换'], blurb: '两扇石砖幕布从左右合拢，撞出火花，再向两边拉开。', usage: '章节切换、片头片尾，比较庄重。'}),
  transitionEntry(T.loading, {name: '加载界面', tags: ['游戏感', '等待'], blurb: '泥土背景加进度条和"正在加载地形…"，复刻游戏加载屏。', usage: '地点切换、读档、时间跳转的玩梗转场。'}),
  transitionEntry(T.tnt, {name: 'TNT 爆破', tags: ['爆炸', '高潮', '震屏'], blurb: '画面抖动升温，闪白后爆炸序列帧盖过，B 画面带余震落定。', usage: '高潮点、反转、开战。'}),
  transitionEntry(T.portal, {name: '下界传送门', tags: ['传送', '像素'], blurb: '紫色像素漩涡从中心扩散吞没画面，再向中心收缩露出 B。', usage: '换地点、换世界线、回忆与现实切换。'}),
  transitionEntry(T.sweep, {name: '方块纹理扫落', tags: ['方块', '落下'], blurb: '十二列方块纹理从上向下依次落满，再向下扫出。', usage: '换章节、换话题，有分栏的节奏感。'}),
  transitionEntry(T.glitch, {name: '末影错位', tags: ['故障', '紫青'], blurb: '画面切成横条左右错位，带紫青色故障条，换成 B。', usage: '末地、异常、反常事件。'}),
];

const scene = (id: string, name: string, frames: number, C: FC, blurb: string, usage: string, tags: string[]): FxEntry => ({
  meta: {id, name, category: 'scene', frames, blurb, usage, tags},
  Demo: C,
});

const scenes: FxEntry[] = [
  scene('scene-title-drop', '标题砸落与暗角', S1_FRAMES, ShotOpen, '黑边滑入，暗角收紧，标题逐字砸下，标签与快捷栏依次弹出。', '视频开场标题。', ['开场', '标题', '暗角']),
  scene('scene-hotbar-tooltip', '快捷栏与提示框', S2_FRAMES, ShotHotbar, '选中框扫过快捷栏，附魔流光，提示框逐字打出。', '介绍物品、装备。', ['物品', '提示框']),
  scene('scene-craft', '合成', S3_FRAMES, ShotCraft, '材料沿弧线飞入，进度条走满，成品砸出带粒子。', '讲合成配方。', ['合成', '配方']),
  scene('scene-toast-xp', '成就与经验', S4_FRAMES, ShotToast, '三张成就弹窗依次滑入，经验球飞向经验条。', '达成里程碑、升级。', ['成就', '经验']),
  scene('scene-settings', '设置界面交互', S5_FRAMES, ShotSettings, '鼠标移动点击、开关、滑块、标签切换、按钮按下。', '演示功能、教程。', ['界面', '鼠标', 'Ore']),
  scene('scene-menu', '主菜单', S6_FRAMES, ShotMenu, '按钮交替滑入，鼠标逐个悬停，点击开始。', '开场、选择页。', ['菜单', 'Ore']),
  scene('scene-day-cycle', '昼夜延时', S7_FRAMES, ShotDayCycle, '清晨到夜晚连续渐变，时钟与进度条同步走动。', '时间流逝、天数跳转。', ['昼夜', '延时']),
  scene('scene-enchant', '附魔', S8_FRAMES, ShotEnchant, '物品悬浮发光，符文环绕，提示框逐字显示。', '展示附魔与稀有物品。', ['附魔', '符文']),
  scene('scene-hud-hurt', '受伤与复活', S9_FRAMES, ShotHud, '红色暗角、震屏、血心碎裂，图腾复活金光回血。', '战斗、生死时刻。', ['血量', '图腾', '暗角']),
  scene('scene-end-card', '片尾感谢', S10_FRAMES, ShotEnd, '感谢观看面板，点击关注按钮，黑边合拢渐黑。', '视频结尾。', ['片尾', '关注']),
  scene('scene-intro-title', '标题炸裂片头', INTRO_FRAMES, Intro, 'MINECRAFT 石质 logo 砸下，TNT 炸碎，章节标题冲出。', '系列视频的固定片头。', ['片头', '爆炸', '标题']),
];

const loop = (time: 'dawn' | 'noon' | 'dusk' | 'night', name: string): FxEntry => ({
  meta: {id: `sky-${time}`, name, category: 'atmosphere', frames: 240, blurb: '像素天空、云、太阳月亮和草地，无光芒无方块，可无缝循环。', usage: '视频背景。预览为前 8 秒，完整循环 80 秒。', tags: ['背景', '循环', '天空']},
  Demo: () => <BackdropLoop time={time} />,
});

export const entries: FxEntry[] = [...transitions, ...scenes, loop('dawn', '清晨天空'), loop('noon', '正午天空'), loop('dusk', '黄昏天空'), loop('night', '夜晚天空')];
