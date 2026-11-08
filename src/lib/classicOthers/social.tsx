// Library exports for the classicOthers/social group (see src/lib/README.md for the contract).
// All ten are transparent full-frame overlay layers (bg is false by default): place with <Sequence from durationInFrames>,
// local frame 0 = first frame of the effect. Each is a thin typed wrapper over the gallery component; defaults live there.
import type {FC} from 'react';
import {BellFx} from '../../gallery/fx/social/bell';
import {CoinFx, type Throw} from '../../gallery/fx/social/coin';
import {FollowCornerFx} from '../../gallery/fx/social/corner';
import {DanmakuFx, type Comment} from '../../gallery/fx/social/danmaku';
import {FavoriteFx, type Gift} from '../../gallery/fx/social/favorite';
import {FollowFx} from '../../gallery/fx/social/follow';
import {LikeFx} from '../../gallery/fx/social/like';
import {MilestoneFx, type FW} from '../../gallery/fx/social/milestone';
import {ShareFx} from '../../gallery/fx/social/share';
import {TripleFx} from '../../gallery/fx/social/triple';
import type {Face} from '../../gallery/fx/social/common';

/** Avatar choices: steve | alex | creeper | pig | slime | sunny | zuri | kai. */
export type SocFace = Face;
/** One coin/emerald throw: id (what flies), from [x,y] (start in px, off-screen), land (landing frame), h (arc height px). */
export type SocThrow = Throw;
/** One danmaku comment bubble: nick, text, face (avatar), color / deep (bubble fill / shade). */
export type SocComment = Comment;
/** One favourite gift: kind (book | star | diamond | xp), from [x,y], land (frame it drops in), h (arc height px). */
export type SocGift = Gift;
/** One firework: x, y (burst centre px), at (burst frame), colors (hex list), n (particle count, optional). */
export type SocFirework = FW;

// ---------------------------------------------------------------------------------------------- like

export type SocLikeProps = {
  /** 是否绘制演示用的虚化背景（默认 false，透明叠加） */
  bg?: boolean;
  /** 点赞前的数字，点完显示 count+1 */
  count?: number;
  /** 按下按钮的帧（爆发时刻） */
  tapAt?: number;
  /** 按钮旁飘出的文字 */
  plusText?: string;
  /** 主色（按钮、数字、闪光），十六进制 */
  accent?: string;
  /** 主色的深色（按钮下沿/描边阴影） */
  accentDeep?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 点赞：小手点按大拇指按钮，爱心/星星/彩块爆开，计数 +1。 */
export const SocLike: FC<SocLikeProps> = (p) => <LikeFx {...p} />;

// ---------------------------------------------------------------------------------------------- follow

export type SocFollowProps = {
  /** 是否绘制演示背景 */
  bg?: boolean;
  /** 昵称 */
  name?: string;
  /** 头像 */
  face?: SocFace;
  /** 关注前的粉丝数，点完 +1 */
  fans?: number;
  /** 按下“关注”按钮的帧 */
  tapAt?: number;
  /** 按钮文字（未关注） */
  followText?: string;
  /** 按钮文字（已关注） */
  doneText?: string;
  /** 粉丝数前的文字 */
  fansLabel?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 关注：资料卡弹入，按下关注变成绿色“已关注”，彩带喷出，粉丝 +1。 */
export const SocFollow: FC<SocFollowProps> = (p) => <FollowFx {...p} />;

// ---------------------------------------------------------------------------------------------- coin

export type SocCoinProps = {
  /** 是否绘制演示背景 */
  bg?: boolean;
  /** 投币前的硬币数，每落一枚 +1 */
  count?: number;
  /** 抛物线日程（落点帧最大的那个触发收尾） */
  throws?: SocThrow[];
  /** 计数牌上的文字 */
  label?: string;
  /** 每枚落下时弹出的文字 */
  plusText?: string;
  /** 最后一枚落下后的大字 */
  doneText?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 投币：绿宝石和金币抛着弧线砸进大硬币按钮，计数滚动，最后金币雨。 */
export const SocCoin: FC<SocCoinProps> = (p) => <CoinFx {...p} />;

// ---------------------------------------------------------------------------------------------- favorite

export type SocFavoriteProps = {
  /** 是否绘制演示背景（Ore 紫色虚化底） */
  bg?: boolean;
  /** 收藏数，合上盖子后 +1 */
  count?: number;
  /** 盖子合上的帧 */
  closeAt?: number;
  /** 飞进箱子的物品日程 */
  gifts?: SocGift[];
  /** 收藏数前的文字 */
  label?: string;
  /** 合上后弹出的标签文字 */
  tagText?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 收藏：附魔书/星星/钻石/经验瓶飞进收藏箱，盖子合上，弹出“已收藏”。 */
export const SocFavorite: FC<SocFavoriteProps> = (p) => <FavoriteFx {...p} />;

// ---------------------------------------------------------------------------------------------- triple

export type SocTripleProps = {
  /** 是否绘制演示背景（夜空虚化） */
  bg?: boolean;
  /** 第一个图标点亮的帧（之后每 8 帧点亮下一个） */
  fireAt?: number;
  /** 全屏爆发的帧 */
  boomAt?: number;
  /** 长按阶段顶部的提示文字 */
  caption?: string;
  /** 三个图标下方的文字（点赞/投币/收藏） */
  labels?: [string, string, string];
  /** 爆发后的大字贴纸 */
  title?: string;
  /** 大字下方的感谢语 */
  thanks?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 一键三连：长按蓄力，三枚图标依次点亮聚成能量球，全屏爆发。 */
export const SocTriple: FC<SocTripleProps> = (p) => <TripleFx {...p} />;

// ---------------------------------------------------------------------------------------------- bell

export type SocBellProps = {
  /** 是否绘制演示背景 */
  bg?: boolean;
  /** 第一下敲响的帧 */
  kickAt?: number;
  /** 提示条标题 */
  title?: string;
  /** 提示条副标题 */
  sub?: string;
  /** 红色角标上的文字 */
  badgeText?: string;
  /** 第二下敲响距第一下的帧数 */
  secondKickAfter?: number;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 订阅铃铛：MC 铃铛被敲响阻尼摆动，像素声波，底部滑出 Ore 风提示条。 */
export const SocBell: FC<SocBellProps> = (p) => <BellFx {...p} />;

// ---------------------------------------------------------------------------------------------- danmaku

export type SocDanmakuProps = {
  /** 是否绘制演示背景 */
  bg?: boolean;
  /** 评论气泡列表 */
  comments?: SocComment[];
  /** 相邻气泡出现的间隔帧数 */
  gap?: number;
  /** 顶部三条滚动弹幕的文字库（随机抽取，固定种子） */
  laneTexts?: string[];
  /** 打“热评”红标的气泡序号，-1 表示都不打 */
  hotIndex?: number;
  /** 红标上的文字 */
  hotText?: string;
  /** 评论计数的起始值 */
  baseCount?: number;
  /** 计数牌上的标题 */
  header?: string;
  /** 计数牌下方粉色小标签的文字 */
  badgeText?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 弹幕评论：带头像昵称的气泡从右飞入往上堆叠，顶部三条弹幕车道，评论数滚动。 */
export const SocDanmaku: FC<SocDanmakuProps> = (p) => <DanmakuFx {...p} />;

// ---------------------------------------------------------------------------------------------- share

export type SocShareProps = {
  /** 是否绘制演示背景 */
  bg?: boolean;
  /** 纸飞机落在第几个图标（0 到 4） */
  target?: number;
  /** 纸飞机离开按钮的帧 */
  launchAt?: number;
  /** 飞行帧数 */
  flight?: number;
  /** 五个图标下方的文字 */
  labels?: string[];
  /** 紫色圆按钮下方的文字 */
  buttonText?: string;
  /** 转发计数前的文字 */
  forwardLabel?: string;
  /** 转发计数起始值，落地后 +1 */
  forwardCount?: number;
  /** 落地后弹出的大字 */
  successText?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 分享：点按分享按钮，像素纸飞机划过大弧线，彩虹拖尾，落进社交图标。 */
export const SocShare: FC<SocShareProps> = (p) => <ShareFx {...p} />;

// ---------------------------------------------------------------------------------------------- corner

export type SocFollowCornerProps = {
  /** 是否绘制演示背景 */
  bg?: boolean;
  /** 所在角落：bl 左下 | br 右下 | tl 左上 | tr 右上 */
  corner?: 'bl' | 'br' | 'tl' | 'tr';
  /** 昵称 */
  name?: string;
  /** 粉丝文案（整串文字） */
  fans?: string;
  /** 头像 */
  face?: SocFace;
  /** 卡片缩放 */
  scale?: number;
  /** 距画面边缘的像素 */
  margin?: number;
  /** 按钮文字 */
  buttonText?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 常驻关注角标：角落滑出“关注”小卡片，小手点按，再滑回；固定 120 帧，首尾相接可循环。 */
export const SocFollowCorner: FC<SocFollowCornerProps> = (p) => <FollowCornerFx {...p} />;

// ---------------------------------------------------------------------------------------------- milestone

export type SocMilestoneProps = {
  /** 是否绘制演示背景（夜空虚化） */
  bg?: boolean;
  /** 目标数字 */
  target?: number;
  /** 数字牌位数，需不小于 target 的位数 */
  digits?: number;
  /** 烟花日程（at 为炸开的帧） */
  fireworks?: SocFirework[];
  /** 数字下方的文字 */
  label?: string;
  /** 红色横幅文字 */
  banner?: string;
  /** 底部大字贴纸文字 */
  thanks?: string;
  /** 是否播放音效 */
  audio?: boolean;
};
/** 粉丝里程碑：数字飞快滚动到目标并定住，烟花、彩带、横幅和感谢贴纸。 */
export const SocMilestone: FC<SocMilestoneProps> = (p) => <MilestoneFx {...p} />;
