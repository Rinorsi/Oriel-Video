import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Checker, Flash, Pix, Sprinkle, W, H, INK, hash, lerp, outCubic, inQuad, seg} from './kit';
import {Chips, Flare, GridFlash, Smoke} from './impact';
import type {SprName} from './sprites';

/**
 * cute-block-rain: flat ore blocks (grass / diamond / gold / redstone / lapis / emerald) rain down Tetris style and
 * stack until the whole 16x9 grid is full. The rows flash like a line clear, then the whole pile bounces apart.
 * Cut-type: grid complete by t~21, B swaps in under it at t=24.
 * Tunables: BLAST (frame the pile bursts), CELL (block size, 120 = 16x9 grid), TYPES (block sprites used).
 */

const T = 60;
const BLAST = 30;
const CELL = 120;
const COLS = W / CELL;
const ROWS = H / CELL;
const PX = CELL / 10;
const TYPES: SprName[] = ['b_grass', 'b_diamond', 'b_gold', 'b_redstone', 'b_lapis', 'b_emerald'];
const BG = '#3a2d5c';
const CHIPS = ['#5ed16a', '#9b6b43', '#4be3e0', '#ffd23f', '#ff4d5e', '#5b7bff', '#a8f0c6'];

type Blk = {c: number; r: number; x: number; y: number; type: SprName; s: number; vx: number; vy: number; spin: number; d: number};
const BLOCKS: Blk[] = [];
for (let c = 0; c < COLS; c++) {
  for (let rr = 0; rr < ROWS; rr++) {
    // rr = 0 is the bottom row
    const r = ROWS - 1 - rr;
    const x = c * CELL + CELL / 2;
    const y = r * CELL + CELL / 2;
    // Tetris-ish pieces: 2x2 squares or pairs of vertical dominoes per column pair and 2-row band; the top row is horizontal dominoes.
    const cp = Math.floor(c / 2);
    const band = Math.floor(rr / 2);
    const square = band === 4 || hash(cp, band + 60) > 0.42;
    const pieceKey = band === 4 ? hash(cp, 77) : square ? hash(cp, band + 3) : hash(c, band + 9);
    const type = TYPES[Math.floor(pieceKey * TYPES.length * 0.999)];
    const dist = Math.hypot(x - W / 2, y - H / 2);
    BLOCKS.push({
      c,
      r: rr,
      x,
      y,
      type,
      s: hash(cp, 99) * 3 + band * 2.4 + (square ? 0 : hash(c, 98) * 1.5),
      vx: (x - W / 2) * (0.9 + hash(c, rr) * 0.8),
      vy: -(850 + hash(rr, c + 3) * 900),
      spin: (hash(c + 5, rr) - 0.5) * 520,
      d: (dist / 1100) * 3,
    });
  }
}

// pieces share a type and a start time, so they fall and land as units
const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const post = t >= BLAST;
  const bgO = post ? 1 - seg(t, BLAST, BLAST + 6) : seg(t, 0, 6);
  return (
    <AbsoluteFill>
      {bgO > 0 && (
        <AbsoluteFill style={{opacity: bgO}}>
          <Checker a={BG} b="#46376c" size={60} x={t * 3} y={t * 3} />
        </AbsoluteFill>
      )}
      {!post && <Sprinkle t={t} at={4} dur={BLAST - 4} seed={11} count={18} kinds={['star', 'spark', 'heart']} px={[3, 5]} z={1} />}
      {BLOCKS.map((b) => {
        let x = b.x;
        let y = b.y;
        let rot = 0;
        let sx = 1;
        let sy = 1;
        let flash = 0;
        if (!post) {
          const u = seg(t, b.s, b.s + 7);
          if (u <= 0) return null;
          y = lerp(-CELL * 1.6 - (ROWS - b.r) * 40, b.y, inQuad(u));
          const a2 = t - (b.s + 7);
          if (a2 > 0 && a2 < 9) {
            const q = Math.exp(-a2 * 0.5) * Math.cos(a2 * 1.1);
            sy = 1 - 0.17 * q;
            sx = 1 + 0.07 * q;
          }
          // line clear flash, bottom row first
          const f0 = 24 + b.r * 0.55;
          flash = t >= f0 && t < f0 + 3 ? 1 - Math.abs((t - f0 - 1) / 2) : 0;
          // pre-blast squat
          if (t > BLAST - 4) sy *= 1 - 0.06 * seg(t, BLAST - 4, BLAST);
        } else {
          const a = t - BLAST - b.d;
          if (a < 0) {
            sy = 0.94;
          } else {
            const tau = a / 30;
            x = b.x + b.vx * tau;
            y = b.y + b.vy * tau + 0.5 * 7000 * tau * tau;
            rot = b.spin * tau;
            sy = 1;
            if (y > H + CELL * 1.5) return null;
          }
        }
        return (
          <div key={`${b.c}-${b.r}`} style={{position: 'absolute', left: x - CELL / 2, top: y - CELL / 2, width: CELL, height: CELL, transform: `rotate(${rot}deg) scale(${sx},${sy})`, transformOrigin: '50% 100%', zIndex: post ? 10 : 5}}>
            <Pix s={b.type} px={PX} />
            {flash > 0 && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.85}} />}
          </div>
        );
      })}
      {!post && BLOCKS.filter((b) => b.r % 2 === 0).map((b) => (
        <Smoke key={`d${b.c}-${b.r}`} t={t} at={b.s + 7} x={b.x} y={b.y + CELL / 2 - 6} count={4} seed={b.c * 31 + b.r} dur={13} spread={CELL * 0.45} drift={[160, 420]} rise={10} flatY={0.3} px={4} grow={[0.7, 1.5]} z={36} />
      ))}
      {post && (
        <>
          <Chips t={t} at={BLAST} x={W / 2} y={H * 0.62} count={40} seed={21} colors={CHIPS} life={34} speed={[700, 1700]} angle={[-170, -10]} gravity={2600} size={[2, 4]} spread={300} z={30} />
          <Chips t={t} at={BLAST + 1} x={0} y={H} count={14} seed={22} colors={CHIPS} life={32} speed={[900, 1800]} angle={[-80, -30]} gravity={2400} size={[2, 4]} z={30} />
          <Chips t={t} at={BLAST + 1} x={W} y={H} count={14} seed={23} colors={CHIPS} life={32} speed={[900, 1800]} angle={[-150, -100]} gravity={2400} size={[2, 4]} z={30} />
          <Smoke t={t} at={BLAST} x={W / 2} y={H / 2 + 120} count={16} seed={24} dur={20} spread={560} drift={[200, 700]} rise={40} px={10} grow={[0.9, 1.9]} z={32} />
          <Flare t={t} at={BLAST} x={W / 2} y={H / 2} color="#ffffff" maxR={900} life={18} cell={12} rays={14} seed={5} z={44} />
          <GridFlash t={t} at={BLAST} cell={120} dur={6} reach={6} peak={0.7} z={45} />
        </>
      )}
      <div style={{position: 'absolute', inset: 0, zIndex: 60}}>
        <Flash o={post ? Math.max(0, 0.5 - (t - BLAST) / 6) : 0} color="#ffffff" />
      </div>
    </AbsoluteFill>
  );
};

export const blockRainDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-block-rain',
  name: '方块雨',
  frames: T,
  mode: 'cut',
  overlay: Overlay,
  cues: [
    {at: 4, src: 'mc:dig/stone1', volume: 0.45, rate: 1.1},
    {at: 7, src: 'mc:dig/stone3', volume: 0.45, rate: 1.0},
    {at: 10, src: 'mc:dig/stone2', volume: 0.45, rate: 1.2},
    {at: 13, src: 'mc:dig/gravel1', volume: 0.4, rate: 1.3},
    {at: 17, src: 'mc:random/anvil_land', volume: 0.4, rate: 1.1},
    {at: 24, src: 'mc:random/orb', volume: 0.3, rate: 1.0},
    {at: 26, src: 'mc:random/orb', volume: 0.3, rate: 1.25},
    {at: 28, src: 'mc:random/orb', volume: 0.3, rate: 1.5},
    {at: BLAST, src: 'mc:random/pop', volume: 0.6, rate: 0.8},
    {at: BLAST + 2, src: 'mc:dig/stone4', volume: 0.5, rate: 1.4},
    {at: BLAST + 8, src: 'mc:random/levelup', volume: 0.2, rate: 1.6},
  ],
};

export const blockRainEntry = transitionEntry(blockRainDef, {
  id: 'cute-block-rain',
  name: '方块雨',
  category: 'cute',
  tags: ['可爱', '方块', '俄罗斯方块', '堆叠', '转场', '像素'],
  blurb: '草方块、钻石块、金块、红石、青金石块像俄罗斯方块一样一列列落下，每块落地都挤压回弹、扬起一小撮灰尘；堆满全屏后整排闪白消行、整堆下蹲，随后由中心向外弹开，带着碎屑和烟尘露出下一个画面。',
  usage: '搜集/建造/合成类内容的转场，或者节奏明快的章节切换。',
  params: [
    {name: 'BLAST', desc: '方块堆弹开的帧（默认 30）'},
    {name: 'CELL', desc: '方块边长（默认 120 = 16x9 网格，需整除 1920/1080）'},
    {name: 'TYPES', desc: '使用的方块精灵列表，可增删'},
  ],
});
void INK;
void At;
