import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Flash, Pix, W, H, hash, lerp, outBack, outCubic, inCubic, seg} from './kit';
import {Chips, Flare, GridFlash} from './impact';
import {heartOf, type HeartColor} from './sprites';

/**
 * cute-heart-wave: a 16x9 grid of pink tiles, each with a pixel heart, pops in as a diamond-shaped wave rippling out from
 * the middle (by taxicab distance, so the wavefront is a pixel diamond, not a circle). A big red heart sits in the centre;
 * once the screen is full everything beats twice (thump-thump), squeezes a touch, then the hearts fly outward from the
 * middle (centre first) while the tiles shrink away behind them, uncovering B.
 * No text, no rings.
 * Cut-type: covered by t~20, B under it at t=24, burst from BURST (t=33).
 * Tunables: CELL (tile size, 120 = 16x9 grid), PX (heart pixel size), BURST (frame the hearts fly off).
 */

const T = 60;
const BURST = 33;
const CELL = 120;
const COLS = W / CELL;
const ROWS = H / CELL;
const PX = 8;
const CX = W / 2;
const CY = H / 2;
const TILE_A = FLAT.pink;
const TILE_B = '#ff93b8';

type Tile = {c: number; r: number; x: number; y: number; d: number; dist: number; ang: number; col: HeartColor; spin: number};
const TILES: Tile[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = c * CELL + CELL / 2;
    const y = r * CELL + CELL / 2;
    const l1 = (Math.abs(x - CX) + Math.abs(y - CY)) / CELL; // taxicab distance in cells
    const col: HeartColor = (c * 3 + r * 5) % 7 === 0 ? 'lilac' : (c + r) % 2 ? 'red' : 'white';
    TILES.push({c, r, x, y, d: l1 * 0.62, dist: l1, ang: Math.atan2(y - CY, x - CX), col, spin: (hash(c, r) > 0.5 ? 1 : -1) * (120 + hash(r, c + 7) * 160)});
  }
}

const beat = (t: number) => Math.exp(-Math.pow((t - 21) / 1.7, 2)) + 0.85 * Math.exp(-Math.pow((t - 26) / 1.7, 2));

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const post = t >= BURST;
  const b = beat(t);
  const squeeze = post ? 0 : seg(t, 29, BURST);
  // big heart in the middle
  const bigIn = outBack(seg(t, 14, 22), 3);
  const bigS = post ? 1 + 1.4 * seg(t, BURST - 1, BURST + 7) : bigIn * (1 + 0.16 * b);
  const bigO = post ? 1 - seg(t, BURST, BURST + 8) : 1;
  return (
    <AbsoluteFill>
      {TILES.map((k) => {
        const inE = outBack(seg(t, k.d, k.d + 8), 1.7);
        if (inE <= 0.01) return null;
        const out = post ? seg(t, BURST + k.dist * 0.5, BURST + k.dist * 0.5 + 9) : 0;
        const tileS = inE * (1 - 0.03 * squeeze) * (1 - inCubic(out)) ;
        const heartOut = post ? outCubic(seg(t, BURST + k.dist * 0.5, BURST + k.dist * 0.5 + 16)) : 0;
        const hx = k.x + Math.cos(k.ang) * heartOut * 900;
        const hy = k.y + Math.sin(k.ang) * heartOut * 900;
        const hs = inE * (1 + 0.14 * b) * (1 - squeeze * 0.04) * (1 + heartOut * 0.5) * (1 - seg(heartOut, 0.8, 1));
        return (
          <div key={`${k.c}-${k.r}`}>
            {tileS > 0.01 && (
              <div style={{position: 'absolute', left: k.x - CELL / 2 - 1, top: k.y - CELL / 2 - 1, width: CELL + 2, height: CELL + 2, background: (k.c + k.r) % 2 ? TILE_B : TILE_A, transform: `scale(${tileS}) rotate(${out * 90}deg)`, boxShadow: 'inset 0 6px 0 rgba(255,255,255,0.28)', zIndex: 3}} />
            )}
            {hs > 0.01 && (
              <At x={hx} y={hy} s={hs} rot={post ? heartOut * k.spin : (hash(k.c, k.r + 3) - 0.5) * 10} z={5}>
                <Pix s={heartOf(k.col)} px={PX} fine={2} shadow />
              </At>
            )}
          </div>
        );
      })}
      {bigO > 0 && (
        <At x={CX} y={CY - 10} s={bigS} rot={Math.sin(t * 0.5) * 3} z={8} style={{opacity: bigO}}>
          <Pix s={heartOf('red')} px={44} fine={2} shadow />
        </At>
      )}
      {/* beats: grid flicker on each thump */}
      <GridFlash t={t} at={20.5} cell={120} dur={4} reach={4} peak={0.35} color="#fff0f6" seed={5} z={20} />
      <GridFlash t={t} at={25.5} cell={120} dur={4} reach={4} peak={0.3} color="#fff0f6" seed={9} z={20} />
      {post && (
        <>
          <Chips t={t} at={BURST} x={CX} y={CY} count={36} seed={53} colors={[FLAT.red, FLAT.pink, '#ffffff', '#b79bff', '#ffd0e0']} life={34} speed={[900, 2200]} gravity={1500} size={[2, 4]} spread={60} z={30} />
          <Flare t={t} at={BURST} x={CX} y={CY} color="#ffe3ee" maxR={820} life={18} cell={12} rays={14} seed={4} z={40} />
        </>
      )}
      <AbsoluteFill style={{zIndex: 60}}>
        <Flash o={post ? Math.max(0, 0.5 - (t - BURST) / 5) : 0} color="#fff0f6" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const heartWaveDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-heart-wave',
  name: '爱心像素波',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${1 + 0.05 * (1 - seg(p * T, BURST, BURST + 16, outCubic))})`}),
  overlay: Overlay,
  cues: [
    {at: 0, src: 'mc:random/orb', volume: 0.3, rate: 1.0},
    {at: 3, src: 'mc:random/orb', volume: 0.3, rate: 1.2},
    {at: 6, src: 'mc:random/orb', volume: 0.3, rate: 1.4},
    {at: 9, src: 'mc:random/orb', volume: 0.3, rate: 1.6},
    {at: 21, src: 'mc:random/pop', volume: 0.55, rate: 0.7},
    {at: 26, src: 'mc:random/pop', volume: 0.5, rate: 0.8},
    {at: BURST, src: 'mc:random/pop', volume: 0.6, rate: 1.1},
    {at: BURST + 4, src: 'mc:random/levelup', volume: 0.25, rate: 1.5},
  ],
};

export const heartWaveEntry = transitionEntry(heartWaveDef, {
  id: 'cute-heart-wave',
  name: '爱心像素波',
  category: 'cute',
  tags: ['可爱', '爱心', '粉色', '菱形波', '转场', '像素', '告白'],
  blurb: '16×9 的粉色方砖，每块一颗像素爱心，从画面中心按菱形波纹一层层弹出来铺满，正中一颗大红心；铺满后整屏“砰砰”跳两下（格子闪烁），然后爱心由中心向外飞散、方砖逐格缩没，露出下一个画面。',
  usage: '感谢/告白/治愈内容、点赞关注段落，或者想要甜甜的强节奏转场时。',
  params: [
    {name: 'CELL', desc: '方砖边长（默认 120 = 16×9 网格，需整除 1920/1080）'},
    {name: 'PX', desc: '爱心像素大小（默认 8）'},
    {name: 'BURST', desc: '爆散帧（默认 33）'},
  ],
});
void lerp;
