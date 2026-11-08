import type {FxEntry} from '../../types';
import {CampRest} from './partc-camp';
import {SecretFound} from './partc-secret';
import {rpgTransitions} from './partc-trans';

/** rpgb part c: secret found, camp rest, and the three RPG transitions. */
export const entriesc: FxEntry[] = [
  {
    meta: {
      id: 'rpg-secret-found',
      name: '发现秘密',
      category: 'rpg',
      tags: ['RPG', '地牢', '发现', '宝物', '提示'],
      frames: 170,
      blurb: '墙上一块砖亮起金纹,被推入墙内,石门向两侧推开透出金光,宝物台上图腾漂浮,金边提示牌落下"发现秘密区域"。',
      usage: '探索类视频发现隐藏房间、彩蛋、隐藏宝物时。',
      params: [
        {name: 'bg', desc: '是否带完整墙面背景;false 只输出提示牌(可叠加)'},
        {name: 'title / sub', desc: '提示牌标题与副标题'},
        {name: 'openAt', desc: '石门开始推开的帧(默认 78)'},
      ],
    },
    Demo: () => <SecretFound bg />,
    Layer: () => <SecretFound bg={false} />,
  },
  {
    meta: {
      id: 'rpg-camp-rest',
      name: '营地休整',
      category: 'rpg',
      tags: ['RPG', '地牢', '营地', '回血', '篝火'],
      frames: 150,
      blurb: '洞穴营地:篝火点燃、帐篷与树桩围坐,玩家在火边休息,金框血条缓缓回满,左侧滑入小提示条。',
      usage: '角色休整、存档回血、剧情间隙的安静段落。',
      params: [
        {name: 'bg', desc: 'false 只输出标题、提示条与血条(可叠加)'},
        {name: 'from / to / max', desc: '血量起点、终点、上限(默认 32 → 180 / 180)'},
        {name: 'title / tip', desc: '顶部标题与提示文案'},
      ],
    },
    Demo: () => <CampRest bg />,
    Layer: () => <CampRest bg={false} />,
  },
  ...rpgTransitions,
];
