import type {FxEntry} from '../../types';
import {BadgesDemo} from './demoBadges';
import {ButtonsDemo} from './demoButtons';
import {EnchantDemo} from './demoEnchant';
import {HudDemo, HudLayer} from './demoHud';
import {InventoryDemo} from './demoInventory';
import {Item3dDemo} from './demoItem3d';
import {MissionPanelDemo} from './demoMission';
import {ResultsDemo} from './demoResults';
import {TitleTextDemo} from './demoTitles';

/**
 * Dungeons UI kit. The reusable pieces live in ./kit (import everything from there); every demo below shows one family of
 * components in the real game's style. Other areas should import from '../mcdkit/kit' instead of redrawing UI.
 */
export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-kit-hud',
      name: '地下城套件·底部 HUD',
      category: 'uiref',
      tags: ['地下城', 'HUD', '血量', '药水冷却', '界面套件'],
      frames: 210,
      blurb: '底部居中的斜切底座从下方升起，神器槽、大红心、药水/地图槽、六边形箭袋与绿宝石依次弹出；随后灵魂与绿宝石拾取跳字、神器冷却遮罩、受伤闪白与屏幕猩红晕影、喝药回血、射箭减数、经验条满格升级。',
      usage: '做地下城/动作游戏实录的"游戏内画面"、讲解 HUD 元素或给实景素材叠一层界面时用；Layer 版是透明 HUD，可直接盖在录屏上。',
      params: [
        {name: 'hp', desc: '血量 0..1，红心从下往上填充（受伤时配合 hurt 闪白）'},
        {name: 'hurt', desc: '受伤闪白强度 0..1，带小幅抖动'},
        {name: 'cd', desc: '各槽冷却 {x,y,b,potion,dodge}，1=刚使用，自上而下的遮罩'},
        {name: 'appear', desc: '出现进度 0..1（底座升起 + 槽位错开弹出）'},
        {name: 'scale', desc: '整体缩放，默认 0.9 约 1300px 宽'},
      ],
    },
    Demo: HudDemo,
    Layer: HudLayer,
  },
  {
    meta: {
      id: 'mcd-kit-inventory',
      name: '地下城套件·物品栏页',
      category: 'uiref',
      tags: ['地下城', '物品栏', '装备', '附魔', '界面套件'],
      frames: 210,
      blurb: '红棕晕光 + 马赛克噪声背景上的三栏物品页：左侧角色与三件装备槽、LEVEL/POWER 六边形、药水槽；中间分类标签与带对角线的空格网格；右侧详情（稀有度标签、粗像素物品名、菱形属性行、3D 物品大图、属性条、附魔菱形）。选中框移到弓后详情整体换成 UNIQUE，附魔菱形依次点亮。',
      usage: '讲装备/战利品/附魔系统、展示一件新武器或做"打开背包"的转场画面。',
      params: [
        {name: 'GRID', desc: '格子内容数组（物品贴图、稀有度、等级、新物品角标）'},
        {name: 'swapAt', desc: '选中框跳到第三格、详情切换的帧'},
      ],
    },
    Demo: InventoryDemo,
  },
  {
    meta: {
      id: 'mcd-kit-results-cards',
      name: '地下城套件·结算页与统计卡',
      category: 'uiref',
      tags: ['地下城', '结算', '月桂', '统计卡', '界面套件'],
      frames: 240,
      blurb: '先黑场再整页淡入：金色小标题 + 白色任务名，镀金菱形框头像配银灰月桂和紫边 LEVEL 六边形，击杀数滚动计数，橙红 AP 进度条，四张深色统计卡依次升起，右下角金框菱形里的宝箱抖动并带出金色火星。',
      usage: '关卡/任务/Boss 战结束后的数据总结、章节通关画面。',
      params: [
        {name: 'kills', desc: 'countUp 的目标数字与时长'},
        {name: 'StatCard', desc: 'label/value/reveal，可自行摆 2–6 张'},
        {name: 'Laurel tone', desc: 'silver/gold/orange/green 对应名次配色'},
      ],
    },
    Demo: ResultsDemo,
  },
  {
    meta: {
      id: 'mcd-kit-badges',
      name: '地下城套件·六边形与菱形徽章',
      category: 'uiref',
      tags: ['地下城', '徽章', '六边形', '菱形', '难度', '界面套件'],
      frames: 150,
      blurb: '菱形金框五档（镀金/独特/稀有/普通/附魔/空槽）、LEVEL 与 POWER 六边形、金色骷髅地图节点（普通/锁定/空/选中带书签尾）、COMMON/RARE/UNIQUE/GILDED 标签、绿宝石与灵魂计数器，以及 I–VII 难度条（绿到橙轨道、选中节点逐级跳升）和三色月桂。',
      usage: '需要地下城风徽章、难度/等级/稀有度指示时，作为素材一览或直接截取。',
      params: [
        {name: 'DiamondFrame tier', desc: 'gilded | unique | rare | common | enchant | empty'},
        {name: 'DifficultyBar level/locked', desc: '选中级别与被锁的节点数'},
        {name: 'HexBadge ring/fill', desc: '自定义环色/填充，做新的六边形徽章'},
      ],
    },
    Demo: BadgesDemo,
  },
  {
    meta: {
      id: 'mcd-kit-buttons',
      name: '地下城套件·按钮与键帽',
      category: 'uiref',
      tags: ['地下城', '按钮', '键帽', '界面套件'],
      frames: 180,
      blurb: '三段式斜面绿按钮的待机/悬停/按下/长按填充/禁用/金色六态，SALVAGE 弹窗里的白框 CANCEL + 绿按钮按下，RANDOM 卡片的 VIEW [F]，粉红 UNDO 与绿 ACCEPT，以及 A/B/X/Y、LB/RB/RT、键盘键帽。',
      usage: '做"点击确认/购买/开始任务"的交互演示，或在任何地下城风界面里放按钮与按键提示。',
      params: [
        {name: 'tone', desc: 'green | red | ghost | disabled | gold'},
        {name: 'press', desc: '0..1 按下深度（顶亮边收缩、文字下沉）'},
        {name: 'hold', desc: '0..1 长按填充'},
        {name: 'keycap', desc: '右侧键帽文字'},
      ],
    },
    Demo: ButtonsDemo,
  },
  {
    meta: {
      id: 'mcd-kit-enchant',
      name: '地下城套件·附魔槽与卷轴',
      category: 'uiref',
      tags: ['地下城', '附魔', '菱形', '卷轴', '界面套件'],
      frames: 180,
      blurb: '紫色标题 + 三组"灵魂点菱形 + 三个图标菱形"的附魔簇逐个点亮（紫光、罗马数字角标），下方三枚大菱形从 Empty Slot 点亮为 Burning / Fire Focus，右侧羊皮纸卷轴展开出 BURNING 升级页：大菱形、三档伤害勾选、MAX TIER 灰框，紫色火星上飘。',
      usage: '讲附魔、技能升级或装备词条时使用。',
      params: [
        {name: 'EnchantSlot lit/tier/icon', desc: '点亮状态、罗马数字、像素图标'},
        {name: 'ParchmentScroll reveal', desc: '卷轴展开进度 0..1'},
      ],
    },
    Demo: EnchantDemo,
  },
  {
    meta: {
      id: 'mcd-kit-title-text',
      name: '地下城套件·标题字出现方式',
      category: 'uiref',
      tags: ['地下城', '标题字', '像素字', '界面套件'],
      frames: 240,
      blurb: '六格示范粗像素标题字：压黑后硬切出现、像素错位 4 帧再拼合成金字（带火星）、逐字下落、数字滚动逐位锁定、中文标题阴影由远及近砸实、以及带中线参考的精确居中（拉丁/中文/混排）。',
      usage: '章节标题、任务名、数字与中文字幕的出现动画参考；也是 PxText/PxChars/GlitchTitle 的用法示例。',
      params: [
        {name: 'px', desc: '每个像素的屏幕尺寸（整数），大写字母高约 9×px'},
        {name: 'shadow/shadowColor', desc: '右下硬阴影像素数与颜色'},
        {name: 'rowShift', desc: '逐行偏移函数，做错位拼字'},
      ],
    },
    Demo: TitleTextDemo,
  },
  {
    meta: {
      id: 'mcd-kit-item3d',
      name: '地下城套件·物品 3D 渲染图标',
      category: 'uiref',
      tags: ['地下城', '物品', '3D', '稀有度', '界面套件'],
      frames: 180,
      blurb: '用 MC 真实物品贴图做体素挤出的伪 3D 图标：叠层厚度 + 左上边缘亮光 + 柔和投影；左侧巨大的钻石剑详情渲染轻微摇摆，右上平面贴图与 3D 对比，下方 4×3 稀有度槽位（普通灰/稀有绿/独特橙/镀金满填）里选中框逐格跳动。',
      usage: '展示武器/装备/道具时代替平面贴图；做战利品掉落、背包、商店画面。',
      params: [
        {name: 'src', desc: 'MC 物品贴图路径，如 itemTex("bow")'},
        {name: 'depth', desc: '挤出层数（厚度）'},
        {name: 'rot/glow', desc: '旋转角度 / 外发光颜色'},
      ],
    },
    Demo: Item3dDemo,
  },
  {
    meta: {
      id: 'mcd-kit-mission-panel',
      name: '地下城套件·任务面板与世界地图',
      category: 'uiref',
      tags: ['地下城', '任务', '难度', '地图', '界面套件'],
      frames: 180,
      blurb: '左侧竖向任务详情（场景头图 + 红描边敌人、ADVENTURE 标签、粗像素任务名、I–VII 难度条逐级选中、推荐战力/你的战力、掉落格、BELOW MINIMUM 灰框随难度达标变成绿色 START MISSION）；右侧米色羊皮纸体素沙盘地图与金色骷髅节点、传送菜单与英雄选择卡。',
      usage: '做"选择关卡/选难度/进入下一章"的画面，或世界地图旅程开场。',
      params: [
        {name: 'DifficultyBar level/locked', desc: '选中级别和锁定数'},
        {name: 'ISLANDS/NODES', desc: '沙盘地块与节点坐标（demoMission.tsx）'},
      ],
    },
    Demo: MissionPanelDemo,
  },
];
