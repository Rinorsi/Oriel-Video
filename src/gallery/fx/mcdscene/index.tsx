import type {FxEntry} from '../../types';
import {ScenePlate, type BiomeId} from './scenes';

export {ScenePlate, SCENES} from './scenes';
export type {BiomeId} from './scenes';
export * from './engine';

const mk = (id: BiomeId, name: string, tags: string[], blurb: string, usage: string, frames = 2400): FxEntry => ({
  meta: {
    id: `mcd-scene-${id}`,
    name,
    category: 'rpg',
    tags: ['3D场景', '地下城', ...tags],
    frames,
    blurb,
    usage,
    params: [
      {name: 'biome', desc: `<ScenePlate biome="${id}" /> 取这个群系的场景底板`},
      {name: 'seed', desc: '地形种子，换一个就是另一块地形'},
      {name: 'loop', desc: '循环帧数，默认 2400（80 秒）。每种运动保持自己的自然周期（火焰/粒子/水波/光柱），镜头走一条闭合小轨道，首尾帧完全一致可无缝循环；push/pull 预设默认 192'},
      {name: 'camera', desc: '覆盖镜头：from/to/mode(loop|ease|linear)/persp/tilt/sway'},
    ],
  },
  Demo: () => <ScenePlate biome={id} />,
});

/** Entries for the mcdscene area. */
export const entries: FxEntry[] = [
  mk('forest-day', '场景·森林白天', ['森林', '白天'], '斜俯视体素森林：草叶交叉面片、纹素投影、云影、金色斜射光，80 秒无缝循环：镜头沿闭合小圆轨道缓慢漂移并微微推拉，云影与阳光随时间起伏。', '白天关卡/加载界面的背景板，或转场前后的实景底。'),
  mk('forest-night', '场景·夜丛林', ['森林', '夜晚', '闪电', '萤火'], '青蓝夜林配橘色篝火与萤火，阶梯折线闪电照亮地面，白色小鬼灵魂飘升。', '夜间关卡、灵魂收集、战斗前的氛围背景。'),
  mk('desert', '场景·沙漠神殿', ['沙漠', '神殿', '暖雾'], '红土层岩峡谷与砂岩神殿，暖黄雾、金色斜射光柱、尘埃与旋转绿宝石。', '沙漠关卡、宝藏/奖励类转场的背景。'),
  mk('nether', '场景·下界熔岩', ['下界', '熔岩', '灰烬'], '深红下界：熔岩湖照亮岩壁与要塞桥，紫色传送门，灰烬与金色火星上升。', '下界关卡、Boss 登场前的压迫感背景。'),
  mk('end', '场景·末地', ['末地', '紫色', '粉光'], '紫色虚空中的悬浮石砖平台，粉白发光立方与上升的方形粒子。', '末地关卡、魔法/附魔类转场背景。'),
  mk('snow', '场景·雪地村落', ['雪地', '冰蓝', '灯笼'], '冰蓝暮色中的雪地村庄，暖色灯笼与篝火对比，十字雪花飘落。', '冬季关卡、冰雪主题加载画面。'),
  mk('world-map', '场景·世界地图沙盘', ['世界地图', '悬浮岛', '沙盘'], '米色羊皮纸上的等距悬浮岛：剖面、瀑布、熔岩、红蘑菇、方块云与柔和偏移投影，80 秒无缝循环：镜头绕岛缓慢漂移并微微呼吸，云影掠过。', '选关/章节地图、旅程类转场（可叠加金色六边形节点）。'),
  mk('camp', '场景·营地与传送门', ['营地', '传送门', '光柱'], '靛紫夜营地：篝火、帐篷、石砖墙；黑曜石传送门照亮周围黑石，宝箱喷出品红光柱，绿宝石旋转。', '回营地/开箱/传送类转场的背景板。'),
];
