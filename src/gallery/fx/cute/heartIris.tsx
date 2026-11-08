import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Confetti, Pix, Rays, Sprinkle, W, H, outBack, outCubic, inCubic, inOutCubic, seg, hash, lerp} from './kit';
import {Flare, GridFlash} from './impact';
import {SPR, heartOf, starOf} from './sprites';

/**
 * cute-heart-iris: a pink polka-dot frame closes in on shot A through a pixel-heart shaped hole (white inner edge, ink
 * outline); at the centre a red heart beats and hearts burst out, then the heart-shaped hole opens again and
 * grows until it swallows the frame, revealing B.
 * Cut-type: the hole closes by t=19 and B swaps in at t=21; reopens t=28..48.
 * Tunables: CELL0 (heart cell size when fully open, px), FRAME (frame colour), IRIS_IN / IRIS_OUT (frames).
 */

const T = 54;
const CELL0 = 310;
const CX = W / 2;
const CY = H / 2;
const FRAME = FLAT.pink;
const ROWS = SPR.heart.rows;
const COLS_N = ROWS[0].length;
const ROWS_N = ROWS.length;

/** Filled runs of the heart sprite: [row, firstCol, length]. */
const RUNS: [number, number, number][] = [];
ROWS.forEach((row, y) => {
  let x = 0;
  while (x < row.length) {
    if (row[x] === '.') {
      x++;
      continue;
    }
    let e = x;
    while (e < row.length && row[e] !== '.') e++;
    RUNS.push([y, x, e - x]);
    x = e;
  }
});

/** Heart wallpaper for the frame, as SVG rects (two hearts per 192px tile). */
const HEART_RECTS: {x: number; y: number; w: number; h: number; c: string; o: number}[] = [];
for (const [ox, oy, c, o] of [[22, 20, '#ff9bbd', 1], [118, 116, '#ffe3ee', 0.7]] as [number, number, string, number][])
  ROWS.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === '.') {
        x++;
        continue;
      }
      let e = x;
      while (e < row.length && row[e] !== '.') e++;
      HEART_RECTS.push({x: ox + x * 6, y: oy + y * 6, w: (e - x) * 6 + 0.5, h: 6.5, c, o});
      x = e;
    }
  });

const GROUPS = [
  {r: 330, n: 8, px: 9},
  {r: 620, n: 14, px: 10},
  {r: 910, n: 20, px: 11},
  {r: 1200, n: 26, px: 12},
];

const cellAt = (t: number) => {
  if (t < 19) return CELL0 * (1 - inOutCubic(seg(t, 0, 19)));
  if (t < 28) return 0;
  return CELL0 * outCubic(seg(t, 28, 48)) * 1.1;
};

const Overlay: FC<{p: number}> = ({p}) => {
  const uid = useCurrentFrame();
  const t = p * T;
  const cell = cellAt(t);
  const open = cell > 3;
  const rect = (m: number, k: string) =>
    RUNS.map(([y, x0, n], i) => <rect key={`${k}${i}`} x={CX + (x0 - COLS_N / 2) * cell - m} y={CY + (y - ROWS_N / 2) * cell - m} width={n * cell + 2 * m + 1} height={cell + 2 * m + 1} fill="#000" />);
  const mask = (id: string, m: number) => (
    <mask id={`${id}${uid}`}>
      <rect x={-50} y={-50} width={W + 100} height={H + 100} fill="#fff" />
      {open && rect(m, id)}
    </mask>
  );
  const beat = t >= 19 && t < 28 ? 1 + 0.22 * Math.abs(Math.sin((t - 19) * 0.7)) : 1;
  const token = t >= 17 && t < 29;
  const tokenS = (t < 19 ? outBack(seg(t, 17, 20), 2.5) * 0.4 : t < 28 ? 1 : 1 - seg(t, 28, 30)) * beat;
  const rot = t * 1.2;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          {mask('m0', 0)}
          {mask('m10', 12)}
          {mask('m24', 28)}
          <pattern id={`dots${uid}`} width={192} height={192} patternUnits="userSpaceOnUse" patternTransform={`translate(${t * 2} ${t * 2})`}>
            <rect width={192} height={192} fill={FRAME} />
            {HEART_RECTS.map((r, i) => (
              <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} opacity={r.o} />
            ))}
          </pattern>
        </defs>
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill="#ffffff" mask={`url(#m0${uid})`} />
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill="#2b2338" mask={`url(#m10${uid})`} />
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={`url(#dots${uid})`} mask={`url(#m24${uid})`} />
      </svg>
      {/* orbiting hearts around the hole */}
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + (rot * Math.PI) / 180;
        const rad = Math.max(60, cell * 6.4) + 80 * Math.sin(t * 0.2 + i);
        const x = CX + Math.cos(a) * rad * 1.05;
        const y = CY + Math.sin(a) * rad * 0.9;
        const o = seg(t, 2 + (i % 6) * 0.6, 8 + (i % 6) * 0.6);
        return (
          <At key={i} x={x} y={y} s={o * (0.8 + 0.2 * Math.sin(t * 0.5 + i))} rot={(a * 180) / Math.PI + 90} z={5}>
            <Pix s={i % 3 === 0 ? heartOf('white') : i % 3 === 1 ? heartOf('red') : heartOf('lilac')} px={6} fine={2} />
          </At>
        );
      })}
      {Array.from({length: 22}, (_, i) => {
        const x = hash(i, 71) * W;
        const y = hash(i, 72) * H;
        return (
          <At key={`s${i}`} x={x} y={y} s={seg(t, 4 + hash(i, 73) * 8, 10 + hash(i, 73) * 8) * (1 - seg(t, 40, 48))} rot={hash(i, 74) * 40 - 20} z={4}>
            <Pix s={i % 2 ? 'spark' : 'star'} px={i % 2 ? 6 : 4} outline={i % 2 ? false : undefined} />
          </At>
        );
      })}
      {/* the heart beats: a pixel cross flare and a flicker of the frame grid, no ring */}
      <Flare t={t} at={19} x={CX} y={CY} color="#ffffff" maxR={760} life={16} cell={12} rays={12} seed={21} z={7} />
      <Flare t={t} at={22} x={CX} y={CY} color="#ffd0e0" maxR={520} life={14} cell={8} rays={10} seed={22} z={7} />
      <GridFlash t={t} at={19} cell={120} dur={4} reach={5} peak={0.3} color="#fff0f6" seed={2} z={9} />
      {t >= 17 && t < 33 && (
        <div style={{position: 'absolute', inset: 0, opacity: seg(t, 17, 21) * (1 - seg(t, 28, 32)), zIndex: 2}}>
          <Rays a="rgba(255,255,255,0.24)" b="rgba(255,255,255,0)" rot={t * 2} n={18} />
        </div>
      )}
      {GROUPS.map((rg, k) =>
        Array.from({length: rg.n}, (_, i) => {
          const born = 17 + k * 1.2 + i * 0.12;
          const leave = inCubic(seg(t, 28 + k * 1.2, 38 + k * 1.2));
          const sc = outBack(seg(t, born, born + 6), 2.2) * (1 - leave);
          if (sc <= 0.01) return null;
          const ang = (i / rg.n) * Math.PI * 2 + (k % 2 ? -1 : 1) * t * 0.05 + k;
          const rr = rg.r + leave * 900;
          const kind = (i + k) % 3;
          return (
            <At key={`g${k}-${i}`} x={CX + Math.cos(ang) * rr} y={CY + Math.sin(ang) * rr * 0.86} s={sc * (1 + 0.08 * Math.sin(t * 0.6 + i))} rot={(ang * 180) / Math.PI + 90 + leave * 300} z={6}>
              <Pix s={kind === 0 ? heartOf('red') : kind === 1 ? heartOf('white') : starOf('yellow')} px={rg.px} fine={2} shadow />
            </At>
          );
        }),
      )}
      {token && (
        <At x={CX} y={CY} s={tokenS} rot={Math.sin(t * 0.6) * 6} z={8}>
          <Pix s={heartOf('red')} px={22} fine={2} shadow />
        </At>
      )}
      <Sprinkle t={t} at={19} dur={26} seed={161} count={20} kinds={['heart', 'star', 'spark']} px={[3, 6]} z={9} />
      <Confetti t={t} at={19} x={CX} y={CY} count={26} seed={162} life={24} speed={[500, 1400]} gravity={700} px={[4, 8]} kinds={['heart', 'heart', 'star', 'spark']} z={30} />
      <Confetti t={t} at={30} x={CX} y={CY} count={32} seed={163} life={28} speed={[800, 2000]} gravity={800} px={[4, 8]} kinds={['heart', 'heart', 'star', 'spark', 'sq']} z={30} />
    </AbsoluteFill>
  );
};

export const heartIrisDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-heart-iris',
  name: '像素爱心框',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${lerp(1.08, 1, seg(p * T, 28, 50, outCubic))})`}),
  overlay: Overlay,
  cues: [
    {at: 6, src: 'mc:random/orb', volume: 0.3, rate: 1.2},
    {at: 12, src: 'mc:random/orb', volume: 0.3, rate: 1.5},
    {at: 18, src: 'mc:random/pop', volume: 0.55, rate: 0.7},
    {at: 22, src: 'mc:random/pop', volume: 0.45, rate: 0.85},
    {at: 26, src: 'mc:random/pop', volume: 0.45, rate: 1.0},
    {at: 30, src: 'mc:random/levelup', volume: 0.3, rate: 1.5},
    {at: 36, src: 'mc:random/orb', volume: 0.25, rate: 1.7},
  ],
};

export const heartIrisEntry = transitionEntry(heartIrisDef, {
  id: 'cute-heart-iris',
  name: '像素爱心框',
  category: 'cute',
  tags: ['可爱', '爱心', '遮罩', '收缩', '粉色', '转场', '像素', '告白'],
  blurb: '粉色波点画框带着白边和描边，从四周向中心收成一个像素爱心形的洞，洞在中心变成一颗砰砰跳的红心（十字光芒 + 格子闪烁）并炸出爱心，然后爱心形的洞再张开、变大，把画框整个吃掉，露出下一个画面。',
  usage: '感谢/告白/恋爱氛围，或者聚焦主体（收缩）再展开新场景的“虹膜”式转场。',
  params: [
    {name: 'CELL0', desc: '全开时爱心网格单元大小（默认 400 像素）'},
    {name: 'FRAME', desc: '画框主色（默认粉色）'},
  ],
});
