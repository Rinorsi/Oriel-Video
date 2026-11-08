import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, HEIGHT, WIDTH} from '../../../mc/theme';
import {tex} from '../../../mc/assets';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {TexBox, boxUV} from './box3d';
import {ewin, hash2, win} from './common';

/**
 * t2-villager-hmm : rows of real vanilla villager heads (villager.png, long nose included, real 3D boxes) slide in from
 * alternating sides and cram the whole screen, nod together twice, then every head turns to profile toward the
 * way out and the rows walk off one after another to reveal B. No text, the nod does the talking.
 * Cut-type (B takes over at p = 0.5, hidden behind the crowd).
 * Params: S (screen px per texel), ROW_H (row pitch), COLS (heads per even row), BEATS (nod times).
 */

const T = 66;
const S = 22; // px per texel: head = 176 x 220
const COLS = 9;
const ROWS = 4;
const ROW_H = HEIGHT / ROWS;
const PITCH = WIDTH / COLS;
const HEAD_TOP = 10; // head top inside the row
const BEATS = [0.3, 0.41];
const SRC = tex('entity/villager/villager.png');
const OUT = '#14100c';
const BAND = ['#33402f', '#3f3427', '#2c3a45', '#44352d'];

const HEAD = boxUV(0, 0, 8, 10, 8);
const NOSE = boxUV(24, 0, 2, 4, 1);
const BODY = boxUV(16, 20, 8, 12, 6);

type Cell = {cx: number; i: number; d: number; phase: number};
const cellsOf = (row: number): Cell[] => {
  const odd = row % 2 === 1;
  const n = odd ? COLS + 1 : COLS;
  return Array.from({length: n}, (_, i) => {
    const cx = odd ? i * PITCH : (i + 0.5) * PITCH;
    return {cx, i, d: Math.abs(cx - WIDTH / 2) / (WIDTH / 2), phase: hash2(row, i, 4)};
  });
};
const CELLS = Array.from({length: ROWS}, (_, r) => cellsOf(r));

/** The villager head as a real textured 3D box, hinged at the neck. `pitch` (deg, negative = nod) and `yaw` (deg). */
const Head: FC<{pitch: number; yaw: number; bodyYaw: number}> = ({pitch, yaw, bodyYaw}) => {
  const neck = 5 * S;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `perspective(1500px) rotateY(${bodyYaw}deg)`}}>
      {/* shoulders: top of the vanilla body, clipped by the row */}
      <TexBox
        src={SRC}
        sheet={[64, 64]}
        w={8}
        h={12}
        d={6}
        s={S}
        style={{transform: `translateY(${neck + 6 * S}px)`}}
        faces={{
          front: {rect: BODY.front, shade: 0.04},
          left: {rect: BODY.left, shade: 0.3},
          right: {rect: BODY.right, shade: 0.3},
          top: {rect: BODY.top, shade: 0.1},
        }}
      />
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transformOrigin: `0px ${neck}px`, transform: `rotateX(${pitch}deg) rotateY(${yaw - bodyYaw}deg)`}}>
        <TexBox
          src={SRC}
          sheet={[64, 64]}
          w={8}
          h={10}
          d={8}
          s={S}
          faces={{
            front: {rect: HEAD.front},
            back: {rect: HEAD.back, shade: 0.12},
            left: {rect: HEAD.left, shade: 0.16},
            right: {rect: HEAD.right, shade: 0.16},
            top: {rect: HEAD.top, shade: 0.05},
            bottom: {rect: HEAD.bottom, shade: 0.4},
          }}
        />
        {/* the nose: 2 x 4 x 1, rows 7..10 of the face */}
        <TexBox
          src={SRC}
          sheet={[64, 64]}
          w={2}
          h={4}
          d={1}
          s={S}
          style={{transform: `translate3d(0px, ${(7 + 2 - 5) * S}px, ${4.5 * S}px)`}}
          faces={{
            front: {rect: NOSE.front},
            left: {rect: NOSE.left, shade: 0.16},
            right: {rect: NOSE.right, shade: 0.16},
            top: {rect: NOSE.top, shade: 0.05},
            bottom: {rect: NOSE.bottom, shade: 0.4},
          }}
        />
      </div>
    </div>
  );
};

const nodAt = (p: number, t0: number) => {
  const k = win(p, t0, t0 + 0.075);
  return k <= 0 || k >= 1 ? 0 : Math.sin(Math.PI * k);
};

const Overlay: FC<{p: number}> = ({p}) => {
  const dirOf = (row: number) => (row % 2 ? 1 : -1); // side the row comes in from
  const inP = (row: number) => ewin(p, 0.01 + row * 0.028, 0.2 + row * 0.028, EASE.out);
  const outP = (row: number) => EASE.in(win(p, 0.6 + row * 0.04, 0.8 + row * 0.04));
  const nod = Math.max(...BEATS.map((b) => nodAt(p, b)));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: ROWS}, (_, row) => {
        const tx = (1 - inP(row)) * dirOf(row) * (WIDTH + 200) + outP(row) * -dirOf(row) * (WIDTH + 260);
        const exitDir = -dirOf(row);
        const turn = ewin(p, 0.5 + row * 0.012, 0.6 + row * 0.012, EASE.back);
        const walk = win(p, 0.6 + row * 0.04, 0.9 + row * 0.04);
        return (
          <div key={row} style={{position: 'absolute', left: -120, top: row * ROW_H - (row === 0 ? 0 : 1), width: WIDTH + 240, height: ROW_H + 2, overflow: 'hidden', transform: `translateX(${tx}px)`, background: BAND[row], boxShadow: 'inset 0 6px 0 rgba(255,255,255,0.1), inset 0 -10px 0 rgba(0,0,0,0.35)'}}>
            <div style={{position: 'absolute', left: 120, top: 0, width: WIDTH, height: ROW_H}}>
              {CELLS[row].map((c) => {
                const pop = ewin(p, 0.05 + row * 0.028 + c.d * 0.08, 0.16 + row * 0.028 + c.d * 0.08, EASE.back);
                const wave = nod * (1 - c.d * 0.2);
                const bob = walk > 0 && walk < 1 ? Math.abs(Math.sin(walk * Math.PI * 7 + c.i * 0.9)) * 16 : 0;
                const look = Math.sin(c.phase * 6.28 + p * 9) * 3 * win(p, 0.14, 0.3) * (1 - win(p, 0.45, 0.5)); // small idle sway
                return (
                  <div key={c.i} style={{position: 'absolute', left: c.cx, top: HEAD_TOP + 5 * S - bob, width: 0, height: 0, transform: `scale(${Math.max(0.001, pop)})`, transformOrigin: `0px ${5 * S}px`}}>
                    <Head pitch={-20 * wave} yaw={look + exitDir * 68 * turn} bodyYaw={exitDir * 38 * turn} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,0.42) 100%)', opacity: win(p, 0.1, 0.3) * (1 - win(p, 0.6, 0.85))}} />
    </AbsoluteFill>
  );
};

export const villagerHmmDef: TransitionDef & {mode: 'cut'} = {
  id: 't2-villager-hmm',
  name: '村民点头',
  frames: T,
  mode: 'cut',
  b: (p) => (p < 0.5 ? {opacity: 0} : {}),
  a: (p) => ({filter: `brightness(${1 - 0.3 * win(p, 0, 0.2)})`}),
  overlay: Overlay,
  cues: [
    // real villager voices: the crowd nods "yes" twice (a few overlapping voices at slightly different pitch), then "no" as they turn away
    {at: 20, src: 'mc:mob/villager/yes1', volume: 0.55},
    {at: 21, src: 'mc:mob/villager/yes2', volume: 0.35, rate: 0.9},
    {at: 23, src: 'mc:mob/villager/yes3', volume: 0.3, rate: 1.1},
    {at: 27, src: 'mc:mob/villager/yes2', volume: 0.55, rate: 1.05},
    {at: 28, src: 'mc:mob/villager/yes1', volume: 0.35, rate: 0.88},
    {at: 30, src: 'mc:mob/villager/yes3', volume: 0.3, rate: 0.95},
    {at: 35, src: 'mc:mob/villager/no1', volume: 0.5},
    {at: 37, src: 'mc:mob/villager/idle2', volume: 0.3, rate: 0.9},
    {at: 46, src: 'mc:step/grass1', volume: 0.3, rate: 1.0},
    {at: 50, src: 'mc:step/grass3', volume: 0.3, rate: 1.0},
  ],
};

export const villagerHmm = transitionEntry(villagerHmmDef, {
  id: 't2-villager-hmm',
  name: '村民点头',
  category: 'transition',
  tags: ['村民', '玩梗', '点头', '像素', '搞笑', '章节切换'],
  blurb: '一排排真实贴图的大鼻子村民脑袋（3D 方块）从两侧挤进来铺满屏幕，齐刷刷点头两下，然后同时转向侧脸，一行一行走开，露出下一幕。',
  usage: '吐槽 / 疑惑 / 「懂了」「就这？」之类玩梗的转场，无文字，配音效使用。',
  params: [
    {name: 'S', desc: '每个贴图像素的屏幕大小，默认 22（头宽 176px）'},
    {name: 'COLS / ROWS', desc: '每行头数量（偶数行）与行数'},
    {name: 'BEATS', desc: '点头的时间点（占转场比例）'},
  ],
});

void HEIGHT;
