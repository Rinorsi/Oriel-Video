import type {FC} from 'react';
import type {FxEntry} from '../../types';
import {FlashCtx} from './common';
import {LOOT_FRAMES, LootDrop} from './loot';
import {DAMAGE_FRAMES, DamageNumbers} from './damage';
import {COMBO_FRAMES, ComboHit} from './combo';
import {LEVEL_FRAMES, LevelUp} from './levelup';
import {EMERALD_FRAMES, EmeraldCounter} from './emerald';
import {QUEST_ACCEPT_FRAMES, QUEST_DONE_FRAMES, QuestAccept, QuestComplete} from './quest';
import {GEAR_FRAMES, GearPanel} from './gear';
import {ARTIFACT_FRAMES, ArtifactCooldown} from './artifact';
import {STATUS_FRAMES, StatusEffects} from './status';
import {PARTY_FRAMES, PartyHud} from './party';
import {MERCHANT_FRAMES, MerchantBuy} from './merchant';
import {ENCHANT_FRAMES, EnchantChoose} from './enchant';
import {POWER_FRAMES, PowerUp} from './power';

/** Transparent layer wrapper: no full-frame flashes over the footage underneath. */
const asLayer = (C: FC): FC => () => (
  <FlashCtx.Provider value={false}>
    <C />
  </FlashCtx.Provider>
);

/** Entries for the rpga area (Minecraft Dungeons flavoured RPG gameplay UI/feedback). */
export const entries: FxEntry[] = [
  {
    meta: {
      id: 'rpg-loot-drop',
      name: '战利品掉落',
      category: 'rpg',
      tags: ['RPG', '地下城', '掉落', '稀有度', '光柱', '名牌'],
      frames: LOOT_FRAMES,
      blurb: '僵尸中刀倒下消散，三件装备弹出落地：普通短白光柱、稀有蓝色光柱、独特金橙高光柱带粒子，落地后弹出带稀有度与战力的名牌。',
      usage: '讲解击杀掉落、开箱、装备稀有度时；用 Layer 叠在自己的战斗画面上。',
      params: [
        {name: 'bg', desc: '是否绘制地牢背景（Demo 开，Layer 关）'},
        {name: 'mob', desc: '是否显示被击倒的怪物'},
        {name: 'DROPS', desc: '掉落物数组：id / name / rar(common|rare|unique) / power / x / at'},
      ],
    },
    Demo: () => <LootDrop bg />,
    Layer: asLayer(() => <LootDrop mob={false} />),
  },
  {
    meta: {
      id: 'rpg-damage-numbers',
      name: '伤害飘字',
      category: 'rpg',
      tags: ['RPG', '地下城', '伤害', '暴击', '治疗', '中毒', '火焰'],
      frames: DAMAGE_FRAMES,
      blurb: '三只怪物挨打：白色普通伤害、放大的金色暴击（命中闪光 + 火花 + 暴击标签）、橙色火焰灼烧、绿色中毒跳字、治疗加号；数字沿弧线飘起淡出，血条同步掉血，顶部总伤害累加。',
      usage: '展示战斗打击感、伤害类型区分、输出数据；Layer 可直接叠在真实战斗画面上（按 HITS 的坐标对齐）。',
      params: [
        {name: 'bg', desc: '是否绘制地牢与战斗人物（Demo 开，Layer 只出飘字与命中特效）'},
        {name: 'HITS', desc: '命中表：at 帧 / foe 目标 / kind(normal|crit|fire|poison|heal) / v 数值 / dx 横向偏移'},
        {name: 'FOES', desc: '目标位置与血量'},
      ],
    },
    Demo: () => <DamageNumbers bg />,
    Layer: asLayer(() => <DamageNumbers />),
  },
  {
    meta: {
      id: 'rpg-combo-hit',
      name: '连击与暴击',
      category: 'rpg',
      tags: ['RPG', '地下城', '连击', '暴击', '停顿帧', '震屏'],
      frames: COMBO_FRAMES,
      blurb: '八连击逐次命中：每一击世界冻结 2-6 帧（hitstop）、镜头震动与推近、像素刀光与火花，连击计数与计时条刷新，Buff 图标依次点亮；最后一击暴击白闪、X 形刀光、图标暴击条，僵尸被击飞。',
      usage: '战斗高潮、Boss 终结技、强调打击感的镜头；Layer 只出计数/条/刀光，可叠在实拍或游戏录屏上。',
      params: [
        {name: 'bg', desc: '是否绘制地牢、人物与 HUD（Demo 开）'},
        {name: 'HITS', desc: '命中表：g（游戏时间帧）/ kind(light|heavy|crit)；HOLD 控制每种命中的冻结帧数'},
      ],
    },
    Demo: () => <ComboHit bg />,
    Layer: asLayer(() => <ComboHit />),
  },
  {
    meta: {
      id: 'rpg-level-up',
      name: '升级',
      category: 'rpg',
      tags: ['RPG', '地下城', '升级', '经验', '属性点', '光柱'],
      frames: LEVEL_FRAMES,
      blurb: '经验球飞入经验条，条涨满迸发；等级数字翻牌 17→18，金色光柱从英雄身上升起，四角纹章依次点亮，三项属性点逐个落入卡片。',
      usage: '角色升级、解锁新阶段、成长类视频的节点；Layer 可叠在游戏录屏上。',
      params: [
        {name: 'bg', desc: '是否绘制地牢与英雄（Demo 开）'},
        {name: 'FROM / TO', desc: '升级前后的等级'},
        {name: 'ATTRS', desc: '属性点卡片：物品 id / 名称 / 出现帧'},
      ],
    },
    Demo: () => <LevelUp bg />,
    Layer: asLayer(() => <LevelUp />),
  },
  {
    meta: {
      id: 'rpg-emerald-counter',
      name: '绿宝石计数',
      category: 'rpg',
      tags: ['RPG', '地下城', '绿宝石', '货币', '计数器', '拾取'],
      frames: EMERALD_FRAMES,
      blurb: '地面绿宝石逐个被拾取，带残影飞向右上角计数器；里程表式数字滚动增加，绿宝石图标弹跳，+N 弹出，左下拾取日志滚动；宝箱打开喷出 8 颗叠加结算。',
      usage: '讲刷钱、商人购买前后的货币变化、任务奖励结算。',
      params: [
        {name: 'bg', desc: '是否绘制地牢背景、地面绿宝石与宝箱（Demo 开）'},
        {name: 'GEMS', desc: '拾取表：x/y 起点、n 数量、at 帧、block 是否绿宝石块'},
        {name: 'START', desc: '起始余额'},
      ],
    },
    Demo: () => <EmeraldCounter bg />,
    Layer: asLayer(() => <EmeraldCounter />),
  },
  {
    meta: {
      id: 'rpg-quest-accept',
      name: '任务接受',
      category: 'rpg',
      tags: ['RPG', '地下城', '任务', '羊皮纸', '卷轴', '蜡封'],
      frames: QUEST_ACCEPT_FRAMES,
      blurb: '羊皮纸卷轴从上方落下展开，标题墨迹扫入，三条目标逐行盖章（印章砸下、纸屑飞溅、文字扫出），奖励行淡入，最后红色蜡封砸在右下角。',
      usage: '接取任务、发布挑战目标、章节任务说明。',
      params: [
        {name: 'bg', desc: '是否绘制地牢背景（Demo 开）'},
        {name: 'OBJECTIVES', desc: '目标条目：mob(zombie|skeleton|creeper) / text / count'},
        {name: 'rowAt', desc: '各行盖章帧'},
      ],
    },
    Demo: () => <QuestAccept bg />,
    Layer: asLayer(() => <QuestAccept />),
  },
  {
    meta: {
      id: 'rpg-quest-complete',
      name: '任务完成',
      category: 'rpg',
      tags: ['RPG', '地下城', '任务', '完成', '奖励', '结算'],
      frames: QUEST_DONE_FRAMES,
      blurb: '写满目标的卷轴卷起合上，红色“完成”大印砸下；三件奖励（独特/稀有/普通）逐个弹出进入稀有度边框的格子；右侧结算板经验条涨满、绿宝石里程表滚动、战力上升。',
      usage: '任务交付、章节通关结算、奖励展示。',
      params: [
        {name: 'bg', desc: '是否绘制地牢背景（Demo 开）'},
        {name: 'REWARDS', desc: '奖励表：id / name / rar / extra / at / x'},
      ],
    },
    Demo: () => <QuestComplete bg />,
    Layer: asLayer(() => <QuestComplete />),
  },
  {
    meta: {
      id: 'rpg-gear-panel',
      name: '装备栏',
      category: 'rpg',
      tags: ['RPG', '地下城', '装备', '背包', '神器', '附魔', '对比'],
      frames: GEAR_FRAMES,
      blurb: '地牢石框装备界面：英雄立像、近战/远程/护甲、三格神器、稀有度边框的背包；光标选中独特武器，右侧对比面板滑入，战力 198→236 滚动并出绿色上升箭头，三个附魔槽逐个点亮，最后拖拽到近战槽换装。',
      usage: '讲装备搭配、武器对比、附魔与换装流程；Layer 只出界面。',
      params: [
        {name: 'bg', desc: '是否绘制暗化地牢背景（Demo 开）'},
        {name: 'BAG / SEL', desc: '背包物品与被选中格'},
        {name: 'ENCH', desc: '附魔槽：图标 / 名称 / 点亮帧'},
        {name: 'SWAP_AT', desc: '换装帧'},
      ],
    },
    Demo: () => <GearPanel bg />,
    Layer: asLayer(() => <GearPanel />),
  },
  {
    meta: {
      id: 'rpg-artifact-cooldown',
      name: '神器冷却',
      category: 'rpg',
      tags: ['RPG', '地下城', '神器', '冷却', '技能', 'HUD'],
      frames: ARTIFACT_FRAMES,
      blurb: '底部 HUD 三个神器：使用时格子按下并在场景里触发烟火箭 / 治疗图腾 / 闪电；冷却遮罩以像素块沿对角线扫开（非环形），中间显示剩余秒数，就绪时白闪、弹跳、斜向高光与十字闪光。',
      usage: '讲解技能循环、冷却管理、神器搭配；Layer 只出 HUD 条。',
      params: [
        {name: 'bg', desc: '是否绘制地牢与战斗人物（Demo 开）'},
        {name: 'ARTS', desc: '神器表：id / name / key / color / uses（使用帧）/ cd（冷却帧数）'},
      ],
    },
    Demo: () => <ArtifactCooldown bg />,
    Layer: asLayer(() => <ArtifactCooldown />),
  },
  {
    meta: {
      id: 'rpg-status-effects',
      name: '状态效果条',
      category: 'rpg',
      tags: ['RPG', '地下城', '状态', '增益', '减益', '中毒', '减速'],
      frames: STATUS_FRAMES,
      blurb: '右侧状态面板：力量药水、冰霜箭、僵尸撕咬、女巫投毒依次施加力量/减速/中毒/虚弱，图标行滑入弹出、倒计时条消耗、受击时整列抖动，到期闪烁滑出；英雄血条受击掉红、中毒绿色跳血。',
      usage: '讲解状态机制、Buff/Debuff 解析、Boss 战提示；Layer 只出状态面板。',
      params: [
        {name: 'bg', desc: '是否绘制地牢、英雄与攻击者（Demo 开）'},
        {name: 'FX', desc: '状态表：name / desc / color / icon / at / dur / buff'},
        {name: 'HITS', desc: '英雄受击帧（触发整列抖动）'},
      ],
    },
    Demo: () => <StatusEffects bg />,
    Layer: asLayer(() => <StatusEffects />),
  },
  {
    meta: {
      id: 'rpg-party-hud',
      name: '队伍血条',
      category: 'rpg',
      tags: ['RPG', '地下城', '联机', '队伍', '血条', '倒地', '复活'],
      frames: PARTY_FRAMES,
      blurb: '左侧四名玩家卡片（皮肤头像、颜色标签、带白色残影的血条），场景里四名英雄头顶同步血条；受击卡片红闪抖动，血量归零倒地（灰化 + 流血计时条），队友跑来读条复活，绿闪、加号上升、血条回升，随后治疗补血。',
      usage: '联机地下城、团队副本、多人协作类视频的队伍状态展示；Layer 只出卡片列表。',
      params: [
        {name: 'bg', desc: '是否绘制地牢与四名英雄（Demo 开）'},
        {name: 'PLAYERS', desc: '玩家表：name / skin / color / max / lv'},
        {name: 'EVENTS', desc: '血量事件：t 帧 / p 玩家 / d 变化量；DOWN 控制倒地与复活帧'},
      ],
    },
    Demo: () => <PartyHud bg />,
    Layer: asLayer(() => <PartyHud />),
  },
  {
    meta: {
      id: 'rpg-merchant-buy',
      name: '商人购买',
      category: 'rpg',
      tags: ['RPG', '地下城', '商人', '购买', '绿宝石', '背包'],
      frames: MERCHANT_FRAMES,
      blurb: '村民商人画像 + 3×3 商品卡（稀有度边框、绿宝石价格）。光标悬停卡片抬起并在左下展开详情，点击卡片压下，绿宝石从余额飞出、里程表减少、物品弧线飞入背包并弹跳闪光；连续三次购买后，第四件太贵：价格变红、卡片摇头。',
      usage: '讲商店购买流程、绿宝石经济、购物对话；Layer 只出界面。',
      params: [
        {name: 'bg', desc: '是否绘制暗化地牢背景（Demo 开）'},
        {name: 'GOODS', desc: '商品表：id / name / rar / price / sub / qty'},
        {name: 'START / BUYS', desc: '起始余额与购买序列（card 序号 + 点击帧）'},
      ],
    },
    Demo: () => <MerchantBuy bg />,
    Layer: asLayer(() => <MerchantBuy />),
  },
  {
    meta: {
      id: 'rpg-enchant-choose',
      name: '附魔三选一',
      category: 'rpg',
      tags: ['RPG', '地下城', '附魔', '卡片', '三选一', '碎裂'],
      frames: ENCHANT_FRAMES,
      blurb: '三张背面朝上的附魔卡落下并依次翻开，光标逐张悬停（卡片抬起放大并泛光），点击中间卡后另外两张碎成像素碎片淡出；被选卡缩小飞向剑，贴上剑身，紫色附魔流光扫过、战力上升。',
      usage: '附魔台、技能/词条三选一、Roguelike 奖励选择。',
      params: [
        {name: 'bg', desc: '是否绘制暗化地牢背景与祭坛（Demo 开）'},
        {name: 'CARDS', desc: '卡片：name / tier / desc / icon / color / cost'},
        {name: 'PICK', desc: '被选中的卡序号（0-2）'},
      ],
    },
    Demo: () => <EnchantChoose bg />,
    Layer: asLayer(() => <EnchantChoose />),
  },
  {
    meta: {
      id: 'rpg-power-up',
      name: '战力提升',
      category: 'rpg',
      tags: ['RPG', '地下城', '战力', '数值', '提升', '强化'],
      frames: POWER_FRAMES,
      blurb: '金边面板里旧战力被红色斜线划掉缩到一旁，新数值模糊滚动上升后以 1.7 倍砸入（震屏、金色火花、十字闪光、光柱），绿色 ▲25 弹出，三项属性差值落位，四角纹章点亮，金光沿边框持续流动。',
      usage: '强化/升级/换装后的数值爆点、版本更新展示角色成长。',
      params: [
        {name: 'bg', desc: '是否绘制暗化地牢背景（Demo 开）'},
        {name: 'OLD / NEW', desc: '旧/新战力'},
        {name: 'STATS', desc: '三项属性差值：name / a / b / icon'},
        {name: 'SLAM', desc: '新值砸入帧'},
      ],
    },
    Demo: () => <PowerUp bg />,
    Layer: asLayer(() => <PowerUp />),
  },
];
