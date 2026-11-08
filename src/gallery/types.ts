import type {FC} from 'react';

/** What a gallery effect is, and what the gallery shows about it. */

export type Category = 'transition' | 'cute' | 'map' | 'social' | 'item' | 'info' | 'rpg' | 'uiref' | 'atmosphere' | 'scene';

export const CATEGORY_NAMES: Record<Category, string> = {
  transition: '转场',
  cute: '可爱转场',
  map: '地图与旅程',
  social: '互动与关注',
  item: '合成与物品',
  info: '信息与字幕',
  rpg: '地下城风格',
  uiref: '界面参考',
  atmosphere: '氛围层',
  scene: '完整镜头',
};

export type FxMeta = {
  /** Unique, kebab-case. The composition is `fx-<id>`; the transparent layer is `fx-<id>-alpha`. */
  id: string;
  /** Chinese display name, short. */
  name: string;
  category: Category;
  /** Free tags used by gallery search/filter, e.g. ['开场', '章节切换', '像素']. */
  tags: string[];
  /** Default duration in frames at 30 fps (the demo composition length). */
  frames: number;
  /** One sentence: what you see. */
  blurb: string;
  /** One sentence: when to use it in a video. */
  usage: string;
  /** Props/knobs a user can change when reusing the component. */
  params?: {name: string; desc: string}[];
};

export type FxEntry = {
  meta: FxMeta;
  /** Self-contained demo (full frame, with its own background). Rendered to mp4 for the gallery. */
  Demo: FC;
  /** Same effect on a transparent background, for exporting as an overlay (.mov with alpha). Optional. */
  Layer?: FC;
};
