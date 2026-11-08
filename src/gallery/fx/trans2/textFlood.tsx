import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {BLACK_FONT} from '../../../mc/fonts';
import {EASE, HEIGHT, WIDTH} from '../../../mc/theme';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {ewin, mix, win} from './common';

/**
 * t2-text-flood : a clean "caption band sweep". Eight even bands (135 px each) in just three colours
 * (black with yellow type, yellow with black type, off-white with black type) slide across the screen in alternating
 * directions, carrying one line of type that scrolls the other way round at a steady speed. They cover the frame, B takes
 * over behind them, then the bands carry on in their own direction and leave one after another.
 * Cut-type (B takes over at p = 0.5). Params: WORDS (the two tokens), FONT_SIZE, CELL (token pitch), SPEED (px per frame), ROW_COLORS.
 */

const T = 54;
const ROWS = 8;
const ROW_H = HEIGHT / ROWS;
const FONT_SIZE = 64;
const CELL = 600;
const SPEED = 22;
const WORDS = ['下一幕', 'NEXT SCENE'];
const BAND_W = WIDTH + 600;
const DIST = WIDTH + 400;

const INK = '#16161a';
const YELLOW = '#ffd23f';
const PAPER = '#f4f0e6';
const ROW_COLORS: {bg: string; fg: string}[] = [
  {bg: INK, fg: YELLOW},
  {bg: YELLOW, fg: INK},
  {bg: INK, fg: YELLOW},
  {bg: PAPER, fg: INK},
  {bg: INK, fg: YELLOW},
  {bg: YELLOW, fg: INK},
  {bg: INK, fg: YELLOW},
  {bg: PAPER, fg: INK},
];

const Band: FC<{row: number; f: number; x: number}> = ({row, f, x}) => {
  const c = ROW_COLORS[row];
  const dir = row % 2 ? 1 : -1; // type scrolls this way
  const unit = CELL * 2;
  const off = ((((f * SPEED * dir + row * 130) % unit) + unit) % unit) - unit;
  const n = Math.ceil(BAND_W / CELL) + 3;
  const light = c.bg !== INK;
  return (
    <div style={{position: 'absolute', left: x, top: row * ROW_H, width: BAND_W, height: ROW_H, overflow: 'hidden', transform: 'translateZ(0)', background: c.bg, boxShadow: light ? 'inset 0 -4px 0 rgba(22,22,26,0.18)' : 'inset 0 -4px 0 #000'}}>
      {Array.from({length: n}, (_, k) => {
        const word = WORDS[k % 2];
        const cx = off + k * CELL;
        return (
          <div key={k} style={{position: 'absolute', left: cx, top: 0, width: CELL, height: ROW_H, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <span style={{fontFamily: BLACK_FONT, fontSize: FONT_SIZE, lineHeight: `${ROW_H}px`, letterSpacing: k % 2 ? '0.14em' : '0.3em', paddingLeft: k % 2 ? '0.14em' : '0.3em', color: c.fg, whiteSpace: 'pre', textAlign: 'center'}}>{word}</span>
            <div style={{position: 'absolute', left: CELL - 8, top: ROW_H / 2 - 8, width: 16, height: 16, background: c.fg, opacity: 0.9}} />
          </div>
        );
      })}
    </div>
  );
};

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: ROWS}, (_, i) => {
        const dir = i % 2 ? 1 : -1; // direction of travel: odd rows move right, even rows move left
        const s = i * 0.012;
        const inK = ewin(p, 0.0 + s, 0.34 + s, EASE.out);
        const outK = ewin(p, 0.58 + s, 0.9 + s, EASE.in);
        const off = -dir * DIST * (1 - inK) + dir * DIST * outK;
        if (inK <= 0 || outK >= 1) return null;
        return <Band key={i} row={i} f={f} x={-300 + off} />;
      })}
    </AbsoluteFill>
  );
};

export const textFloodDef: TransitionDef & {mode: 'cut'} = {
  id: 't2-text-flood',
  name: '文字刷屏',
  frames: T,
  mode: 'cut',
  a: (p) => ({filter: `brightness(${1 - 0.25 * win(p, 0.1, 0.4)})`, transform: `scale(${1 + 0.03 * win(p, 0, 0.4)})`}),
  b: (p) => (p < 0.5 ? {opacity: 0} : {transform: `scale(${mix(1.05, 1, ewin(p, 0.55, 0.92, EASE.out))})`}),
  overlay: Overlay,
  cues: [
    {at: 6, src: 'mc:ui/toast/in', volume: 0.25, rate: 1.4},
  ],
};

export const textFlood = transitionEntry(textFloodDef, {
  id: 't2-text-flood',
  name: '文字刷屏',
  category: 'transition',
  tags: ['文字', '字幕', '跑马灯', '章节切换', '字幕带', '干净'],
  blurb: '八条等高的字幕带（黑底黄字 / 黄底黑字 / 米白底黑字三色）从左右交替扫入铺满屏幕，带内文字「下一幕 / NEXT SCENE」整齐滚动；盖满后下一幕在后面接管，字幕带顺着各自方向依次扫出。',
  usage: '章节切换、快节奏段落过渡、「下一幕 / 敬请期待」类转场。',
  params: [
    {name: 'WORDS', desc: '两个交替出现的字幕词，默认「下一幕 / NEXT SCENE」'},
    {name: 'ROW_COLORS', desc: '每条字幕带的底色和字色（保持 2~3 个主色）'},
    {name: 'FONT_SIZE / CELL / SPEED', desc: '字号、词间距、滚动速度（像素/帧）'},
  ],
});
