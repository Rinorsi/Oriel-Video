import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT, flatBox} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {Checker, Pix, W, H, hash, outBack, outCubic, inCubic, inOutCubic, seg} from './kit';
import {Chips, Flare, GridFlash} from './impact';
import {starOf} from './sprites';

/**
 * cute-star-flip: a 12x7 grid of cards flips in from edge-on in a diagonal wave, each showing a star on a candy colour;
 * once the screen is full the cards flip again to a second colour (the other diagonal) and finally flip away edge-on in
 * random order, revealing B.
 * Cut-type: grid complete by t~23, B swaps in at t=24, second flip t=24..42, exit t=38..54.
 * Tunables: COLS / ROWS / S (grid + card pitch), FACE1 / FACE2 (card colours).
 */

const T = 60;
const COLS = 12;
const ROWS = 7;
const S = 160;
const Y0 = -20;
const FACE1 = [FLAT.pink, FLAT.sky, FLAT.mint, FLAT.yellow, FLAT.lilac, FLAT.orange];
const FACE2 = [FLAT.red, FLAT.purple, FLAT.teal, FLAT.green, '#ff6fb5', FLAT.skyDeep];

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const under = seg(t, 5, 14) * (1 - seg(t, 38, 48));
  return (
    <AbsoluteFill>
      {under > 0 && (
        <AbsoluteFill style={{opacity: under}}>
          <Checker a="#3a2d5c" b="#46376c" size={60} x={t * 2} y={t} />
        </AbsoluteFill>
      )}
      {Array.from({length: COLS * ROWS}, (_, i) => {
        const c = i % COLS;
        const r = Math.floor(i / COLS);
        const d1 = (c + r) * 0.9;
        const d2 = 24 + (COLS - 1 - c + r) * 0.55;
        const d3 = 38 + hash(c, r) * 8;
        const p1 = outBack(seg(t, d1, d1 + 8), 1.5);
        const p2 = outBack(seg(t, d2, d2 + 9, inOutCubic), 1.3);
        const p3 = inCubic(seg(t, d3, d3 + 8));
        const a = -90 + 90 * p1 + 180 * p2 + 90 * p3;
        if (a <= -89.5 || a >= 269.5) return null;
        const back = a >= 90;
        const rot = back ? a - 180 : a;
        const k = (c * 5 + r * 3) % 6;
        const fill = back ? FACE2[k] : FACE1[(c + r * 2) % 6];
        const hop = Math.sin(seg(t, d2, d2 + 9) * Math.PI) * 14;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: c * S + (S - 148) / 2,
              top: Y0 + r * S + (S - 148) / 2 - hop,
              width: 148,
              height: 148,
              transform: `perspective(760px) rotateY(${rot}deg)`,
              ...flatBox(fill, {radius: 26, border: 7, shadow: 9, edge: 'rgba(255,255,255,0.5)'}),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pix s={starOf(back ? 'yellow' : 'white')} px={9} fine={2} shadow style={{transform: `rotate(${back ? 14 : -10}deg)`}} />
          </div>
        );
      })}
      {/* grid full: a diagonal wave of white flicker runs corner to corner, then the second flip lands with a flare */}
      <GridFlash t={t} at={22} cell={160} dur={5} reach={8} peak={0.7} origin={[0, 0]} seed={4} z={20} />
      <GridFlash t={t} at={36} cell={160} dur={5} reach={8} peak={0.6} origin={[W, H]} seed={8} z={20} />
      <Flare t={t} at={24} x={W / 2} y={H / 2} color="#fff4b0" maxR={800} life={16} cell={12} rays={14} seed={72} z={30} />
      <Chips t={t} at={40} x={W / 2} y={H / 2} count={30} seed={73} colors={[FLAT.pink, FLAT.yellow, FLAT.sky, FLAT.mint, FLAT.lilac, '#ffffff']} life={30} speed={[800, 1900]} gravity={1500} size={[1, 3]} spread={200} z={30} />
    </AbsoluteFill>
  );
};

export const starFlipDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-star-flip',
  name: '星星卷帘',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${1 + 0.06 * (1 - seg(p * T, 30, 54, outCubic))})`}),
  overlay: Overlay,
  cues: [
    {at: 1, src: 'mc:random/click', volume: 0.3, rate: 1.1},
    {at: 4, src: 'mc:random/click', volume: 0.3, rate: 1.25},
    {at: 7, src: 'mc:random/click', volume: 0.3, rate: 1.4},
    {at: 10, src: 'mc:random/click', volume: 0.3, rate: 1.55},
    {at: 13, src: 'mc:random/click', volume: 0.3, rate: 1.7},
    {at: 16, src: 'mc:random/click', volume: 0.3, rate: 1.85},
    {at: 23, src: 'mc:random/orb', volume: 0.35, rate: 1.2},
    {at: 26, src: 'mc:random/levelup', volume: 0.2, rate: 1.7},
    {at: 41, src: 'mc:random/pop', volume: 0.4, rate: 1.3},
    {at: 45, src: 'mc:random/pop', volume: 0.35, rate: 1.5},
  ],
};

export const starFlipEntry = transitionEntry(starFlipDef, {
  id: 'cute-star-flip',
  name: '星星卷帘',
  category: 'cute',
  tags: ['可爱', '星星', '翻牌', '网格', '卡片', '转场', '糖果色'],
  blurb: '12×7 的糖果色星星卡片按对角线一排排翻出来铺满屏幕，铺满后格子沿对角线闪白并再换一轮颜色翻一遍，最后随机侧翻消失（带彩色碎屑），露出下一个画面。',
  usage: '章节切换、清单/收集类内容、抽卡或翻牌的玩法段落。',
  params: [
    {name: 'COLS / ROWS / S', desc: '网格列数、行数、卡片间距（默认 12×7、160 像素）'},
    {name: 'FACE1 / FACE2', desc: '两轮翻面的卡片配色'},
  ],
});
