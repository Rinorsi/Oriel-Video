import type {FxEntry} from '../../types';
import {BOSS_DEFEAT_FRAMES, BOSS_INTRO_FRAMES, BossDefeat, BossIntro} from './parta-boss';
import {MISSION_COMPLETE_FRAMES, MissionComplete} from './parta-complete';
import {MISSION_SELECT_FRAMES, MissionSelect} from './parta-mission';
import {DungeonTitle, TITLE_FRAMES} from './parta-title';

/** rpgb part a: title, boss intro/defeat, mission select/complete. */
export const entriesa: FxEntry[] = [
  {
    meta: {
      id: 'rpg-dungeon-title',
      name: '进入地下城标题',
      category: 'rpg',
      tags: ['RPG', '地下城', '章节标题', '开场', '火把'],
      frames: TITLE_FRAMES,
      blurb: '昏暗石墙前两侧火把依次点燃，金色大标题从黑暗中浮现，下方副标题、难度星级与推荐战力逐项亮起。',
      usage: '进入新副本、新章节或新地图的开场标题。',
      params: [
        {name: 'title', desc: '大标题'},
        {name: 'sub', desc: '副标题（章节说明）'},
        {name: 'stars', desc: '难度星级 0-5'},
        {name: 'power', desc: '推荐战力数字'},
        {name: 'bg', desc: 'false 时只输出标题和铭牌（透明层）'},
      ],
    },
    Demo: () => <DungeonTitle bg />,
    Layer: () => <DungeonTitle />,
  },
  {
    meta: {
      id: 'rpg-boss-intro',
      name: 'Boss 登场',
      category: 'rpg',
      tags: ['RPG', 'Boss', '登场', '名牌', '血条'],
      frames: BOSS_INTRO_FRAMES,
      blurb: '上下压黑边，凋灵剪影从幽蓝雾气里逼近，金边名牌划入，血条从两端向中间展开。',
      usage: 'Boss 战开始前的登场镜头，或介绍强敌。',
      params: [
        {name: 'name', desc: 'Boss 名'},
        {name: 'epithet', desc: '称号（名牌上方小字）'},
        {name: 'level', desc: '血条上的等级'},
        {name: 'bg', desc: 'false 时只保留 Boss、黑边、名牌、血条'},
      ],
    },
    Demo: () => <BossIntro bg />,
    Layer: () => <BossIntro />,
  },
  {
    meta: {
      id: 'rpg-boss-defeat',
      name: '击败 Boss',
      category: 'rpg',
      tags: ['RPG', 'Boss', '胜利', '战利品', '慢动作'],
      frames: BOSS_DEFEAT_FRAMES,
      blurb: '最后一击定格，凋灵碎成真实贴图像素向外飞散，「胜利」缎带压下，战利品箱与光柱出现。',
      usage: 'Boss 战结束、结算前的收尾镜头。',
      params: [
        {name: 'boss', desc: '碎裂的生物：wither / evoker / vindicator / golem / piglin …（见 kit MOBS）'},
        {name: 'banner', desc: '横幅大字'},
        {name: 'caption', desc: '横幅下说明'},
        {name: 'bg', desc: 'false 时透明'},
      ],
    },
    Demo: () => <BossDefeat bg />,
    Layer: () => <BossDefeat />,
  },
  {
    meta: {
      id: 'rpg-mission-select',
      name: '任务地图选择',
      category: 'rpg',
      tags: ['RPG', '地图', '任务', '羊皮纸', '选择'],
      frames: MISSION_SELECT_FRAMES,
      blurb: '羊皮纸世界地图展开，任务节点（真实生物头像）依次点亮，虚线路径延伸，选中节点放大并弹出任务卡。',
      usage: '选关、选副本、展示任务进度或战役路线。',
      params: [
        {name: 'title / sub', desc: '任务卡标题与副标题'},
        {name: 'stars', desc: '难度星级 0-5'},
        {name: 'power', desc: '推荐战力'},
        {name: 'rewards', desc: '3 个奖励 {id, rarity: common|rare|unique, label}'},
        {name: 'bg', desc: 'false 时只输出节点、路径与任务卡'},
      ],
    },
    Demo: () => <MissionSelect bg />,
    Layer: () => <MissionSelect />,
  },
  {
    meta: {
      id: 'rpg-mission-complete',
      name: '任务完成结算',
      category: 'rpg',
      tags: ['RPG', '结算', '评分', '奖励', '统计'],
      frames: MISSION_COMPLETE_FRAMES,
      blurb: '「任务完成」金字落下，击杀数、用时、死亡次数、宝箱逐行滚动，评分星星逐颗点亮，奖励卡牌翻开，经验条填满。',
      usage: '一关、一个副本或一段挑战结束后的结算画面。',
      params: [
        {name: 'mission', desc: '标题下的任务名'},
        {name: 'kills / seconds / deaths / treasure', desc: '四项统计的目标值'},
        {name: 'stars', desc: '评分星数 0-5'},
        {name: 'rewards', desc: '4 个奖励 {id, rarity: common|rare|unique}'},
        {name: 'xp', desc: '经验条上的数值'},
        {name: 'bg', desc: 'false 时透明'},
      ],
    },
    Demo: () => <MissionComplete bg />,
    Layer: () => <MissionComplete />,
  },
];
