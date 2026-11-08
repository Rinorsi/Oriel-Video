import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT, RAINBOW} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Pix, W, H, INK, hash, lerp, outBack, outCubic, inCubic, seg} from './kit';
import {Chips, Flare} from './impact';
import {starOf} from './sprites';

/**
 * cute-rainbow-sweep: seven fat pill-shaped rainbow bands, each led by a star, sweep diagonally across the frame one
 * after another until the screen is striped; a white gloss streak glides over them; then the bands race off to the
 * right in the same order and B appears behind them.
 * Cut-type: striped by t~17, B swaps in at t=18, bands leave t=26..45.
 * Tunables: ANGLE (slope of the sweep), COLORS (band colours, top to bottom), BH (band thickness).
 */

const T = 48;
const ANGLE = -22;
const BH = 270;
const PITCH = 258;
const COLORS = [...RAINBOW, FLAT.pink];
const LEN = 4600;
const SKEW = 110; // px each band trails the one above it while sweeping in / out
const CX = W / 2;
const CY = H / 2;

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const gloss = seg(t, 15, 34, outCubic);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `rotate(${ANGLE}deg)`, transformOrigin: `${CX}px ${CY}px`}}>
        {COLORS.map((color, k) => {
          // every band follows the SAME motion curve; band k is simply pushed back by k * SKEW px, so the leading ends always
          // sit on one straight diagonal front (no per-band timing jitter) and the stack stays aligned while it moves.
          const inT = outBack(seg(t, 0, 13), 1.12);
          const outT = inCubic(seg(t, 26, 41));
          const off = (inT - 1) * (LEN + 800 + 7 * SKEW) - k * SKEW + outT * (LEN + 1000 + 7 * SKEW);
          const y = CY + (k - 3) * PITCH;
          const lead = CX + LEN / 2 + off;
          return (
            <div key={k}>
              <div
                style={{
                  position: 'absolute',
                  left: CX - LEN / 2 + off,
                  top: y - BH / 2,
                  width: LEN,
                  height: BH,
                  borderRadius: BH / 2,
                  background: color,
                  boxShadow: `0 0 0 9px ${INK}, 0 20px 0 9px rgba(43,35,56,0.32), inset 0 24px 0 rgba(255,255,255,0.4), inset 0 -22px 0 rgba(43,35,56,0.14)`,
                  zIndex: k,
                  overflow: 'hidden',
                }}
              >
                {Array.from({length: 16}, (_, i) => (
                  <div key={i} style={{position: 'absolute', left: 120 + i * 280 + (k % 2) * 140, top: BH * 0.42, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.5)'}} />
                ))}
              </div>
              <At x={lead - 80} y={y + 8} rot={ANGLE * -1 + Math.sin(t * 0.5 + k) * 8} s={1 + 0.08 * Math.sin(t * 0.7 + k)} z={20 + k}>
                <Pix s={starOf(k % 2 ? 'yellow' : 'white')} px={13} fine={2} shadow />
              </At>
            </div>
          );
        })}
      </div>
      {/* gloss streaks */}
      {gloss > 0 && gloss < 1 && (
        <div style={{position: 'absolute', inset: 0, zIndex: 30, overflow: 'hidden'}}>
          {[
            {w: 150, o: 0.55, d: 0},
            {w: 46, o: 0.5, d: 190},
          ].map((g, i) => (
            <div key={i} style={{position: 'absolute', top: -200, height: H + 400, width: g.w, left: lerp(-600, W + 500, gloss) - g.d, background: '#fff', opacity: g.o * Math.sin(gloss * Math.PI), transform: 'skewX(-24deg)'}} />
          ))}
        </div>
      )}
      {/* bands lock in: a cross flare and colour chips; bands leave: chips fly off the leading edge */}
      <Flare t={t} at={17} x={CX} y={CY} color="#ffffff" maxR={760} life={14} cell={12} rays={12} seed={122} z={45} />
      <Chips t={t} at={17} x={CX} y={CY} count={26} seed={122} colors={COLORS} life={22} speed={[800, 1800]} gravity={1000} size={[1, 3]} z={46} />
      <Chips t={t} at={28} x={W * 0.92} y={H * 0.55} count={22} seed={123} colors={COLORS} life={22} speed={[600, 1500]} angle={[-70, 70]} gravity={800} size={[1, 3]} z={46} />
    </AbsoluteFill>
  );
};

export const rainbowSweepDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-rainbow-sweep',
  name: '彩虹条带',
  frames: T,
  mode: 'cut',
  overlay: Overlay,
  cues: [
    {at: 3, src: 'mc:random/orb', volume: 0.25, rate: 0.9},
    {at: 5, src: 'mc:random/orb', volume: 0.25, rate: 1.05},
    {at: 7, src: 'mc:random/orb', volume: 0.25, rate: 1.2},
    {at: 9, src: 'mc:random/orb', volume: 0.25, rate: 1.35},
    {at: 11, src: 'mc:random/orb', volume: 0.25, rate: 1.5},
    {at: 13, src: 'mc:random/orb', volume: 0.25, rate: 1.65},
    {at: 16, src: 'mc:random/levelup', volume: 0.3, rate: 1.3},
  ],
};

export const rainbowSweepEntry = transitionEntry(rainbowSweepDef, {
  id: 'cute-rainbow-sweep',
  name: '彩虹条带',
  category: 'cute',
  tags: ['可爱', '彩虹', '条带', '扫光', '斜切', '转场', '糖果色'],
  blurb: '七条描边加高光的胖胶囊彩虹条带，每条带着一颗星星，依次斜着扫进画面铺满，一道白色高光划过，然后条带按顺序冲出画面，露出下一个画面。',
  usage: '最通用的可爱风转场，适合章节切换、片头片尾、节奏点，几乎不挑内容。',
  params: [
    {name: 'ANGLE', desc: '扫过的倾斜角度（默认 -22 度）'},
    {name: 'COLORS', desc: '条带配色，从上到下'},
    {name: 'BH / PITCH', desc: '条带厚度 / 间距'},
  ],
});
void hash;
