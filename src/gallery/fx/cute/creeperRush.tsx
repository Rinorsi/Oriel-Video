import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Flash, Pix, Rays, W, H, INK, lerp, outBack, outCubic, inQuad, seg, rnd} from './kit';
import {Chips, Flare, Smoke} from './impact';

/**
 * cute-creeper-rush: rows of round creeper faces bounce up from the bottom until the screen is packed. Then they light the
 * fuse one after another (a wave from the lower left to the upper right): each swells, shakes and blinks white faster and
 * faster, and at the boom they burst from the centre outward into green pixel chips and smoke puffs, uncovering B.
 * No text: the swelling, the white flicker and the debris tell the story.
 * Cut-type: the overlay is fully opaque from ~t=22 to the boom at t=30 (p = 0.5).
 * Tunables: ROWS (rows of creepers), PX (sprite pixel size), BOOM (frame of the explosion).
 */

const T = 60;
const BOOM = 30;
const ROWS = 5;
const PX = 24;
const CX = W / 2;
const CY = H / 2;
const CHIP = ['#6fd05a', '#b4f59a', '#3f9a45', '#23422a', '#8de878'];

type Cr = {r: number; x: number; y: number; rot: number; sc: number; ph: number; dir: [number, number]; fuse: number; burst: number};
const GRID: Cr[] = [];
for (let r = 0; r < ROWS; r++) {
  const odd = r % 2 === 1;
  const n = odd ? 7 : 6;
  for (let c = 0; c < n; c++) {
    const g = rnd(900 + r * 10 + c);
    const x = (odd ? 0 : 160) + c * 320 + (g() - 0.5) * 16;
    const y = 984 - r * 240 + (g() - 0.5) * 12;
    const dx = x - CX;
    const dy = y - CY;
    const d = Math.hypot(dx, dy) || 1;
    // fuse wave: lower left lights first, upper right last
    const wave = (x / W) * 0.55 + (1 - y / H) * 0.45;
    GRID.push({r, x, y, rot: (g() - 0.5) * 10, sc: 0.97 + g() * 0.1, ph: g() * 6.28, dir: [dx / d, dy / d], fuse: 11 + wave * 9, burst: BOOM + Math.min(1, d / 1100) * 3.5});
  }
}

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const post = t >= BOOM;

  // Backdrop slab rising from the bottom, sunburst inside.
  const slab = outCubic(seg(t, 0, 11));
  const slabTop = lerp(H + 30, -30, slab);

  const flashO = post ? Math.max(0, 1 - (t - BOOM) / 7) : 0;

  return (
    <AbsoluteFill>
      {!post && (
        <div style={{position: 'absolute', left: 0, right: 0, top: slabTop, bottom: -40, background: FLAT.yellow, borderTop: `14px solid ${INK}`, overflow: 'hidden', boxShadow: `inset 0 14px 0 #fff2a8`}}>
          <div style={{position: 'absolute', left: 0, top: -slabTop - 14, width: W, height: H}}>
            <Rays a="#ffe36b" b={FLAT.yellow} rot={t * 2.2} n={18} />
          </div>
        </div>
      )}
      {Array.from({length: ROWS}, (_, k) => ROWS - 1 - k).map((r) => {
        const start = r * 2.5;
        const u = (t - start) / 11;
        const e = outBack(Math.max(0, Math.min(1, u)), 2.6);
        const a2 = Math.max(0, (t - start - 11) / 12);
        const air = Math.sin(Math.max(0, Math.min(1, u)) * Math.PI);
        const jx = 1 + 0.09 * Math.cos(a2 * Math.PI * 3) * Math.exp(-a2 * 3.5) - 0.07 * air;
        const jy = 1 - 0.12 * Math.cos(a2 * Math.PI * 3) * Math.exp(-a2 * 3.5) + 0.1 * air;
        return (
          <div key={r} style={{position: 'absolute', inset: 0}}>
            {GRID.filter((c) => c.r === r).map((c, i) => {
              if (t >= c.burst) return null; // already burst into chips
              const y = lerp(H + 360, c.y, e);
              // fuse: swell 0..1, accelerating; blinks white faster and faster; final frames are solid white
              const swell = inQuad(seg(t, c.fuse, BOOM + 2));
              const lit = t >= c.fuse;
              const phase = Math.pow(Math.max(0, t - c.fuse), 1.45) * 0.55;
              const blink = lit && (Math.floor(phase) % 2 === 0 || t >= BOOM - 2);
              const shakeAmp = swell * 11;
              const sh = Math.sin(t * 3.7 + c.ph) * shakeAmp;
              const sv = Math.cos(t * 4.3 + c.ph * 2) * shakeAmp * 0.5;
              const rot = c.rot + Math.sin(t * 2.3 + c.ph) * swell * 5;
              const s = c.sc * (1 + 0.4 * swell);
              return (
                <At key={i} x={c.x + sh} y={y + sv} rot={rot} sx={s * jx * (1 + 0.06 * swell)} sy={s * jy * (1 - 0.04 * swell)} z={Math.round(c.y)}>
                  <div style={{filter: blink ? 'brightness(3) saturate(0.1)' : undefined}}>
                    <Pix s="creeper" px={PX} shadow />
                  </div>
                </At>
              );
            })}
          </div>
        );
      })}
      {post && (
        <>
          {GRID.map((c, i) => (
            <div key={i}>
              <Chips t={t} at={c.burst} x={c.x} y={c.y} count={8} seed={300 + i} colors={CHIP} life={26} speed={[600, 1700]} angle={[(Math.atan2(c.dir[1], c.dir[0]) * 180) / Math.PI - 70, (Math.atan2(c.dir[1], c.dir[0]) * 180) / Math.PI + 70]} gravity={2600} size={[3, 5]} spread={70} g={8} z={40} />
              <Smoke t={t} at={c.burst} x={c.x} y={c.y} count={3} seed={500 + i} dur={18} spread={75} drift={[100, 320]} rise={50} px={11} grow={[0.9, 1.9]} z={30} />
            </div>
          ))}
          <Flare t={t} at={BOOM} x={CX} y={CY} color="#ffffff" maxR={900} life={18} cell={12} rays={14} seed={2} />
          <Flare t={t} at={BOOM + 1} x={CX} y={CY} color={FLAT.yellow} maxR={620} life={16} cell={8} rays={12} seed={3} />
          <Chips t={t} at={BOOM + 1} x={CX} y={CY} count={26} seed={7} colors={['#ffffff', FLAT.yellow, FLAT.orange]} life={22} speed={[900, 2100]} gravity={1200} size={[1, 2]} g={8} z={44} />
        </>
      )}
      <div style={{position: 'absolute', inset: 0, zIndex: 100}}>
        <Flash o={flashO} color="#ffffff" />
      </div>
    </AbsoluteFill>
  );
};

export const creeperRushDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-creeper-rush',
  name: '苦力怕冲脸',
  frames: T,
  mode: 'cut',
  b: (p) => {
    const k = 1 - seg(p * T, BOOM, BOOM + 14, outCubic);
    return {transform: `scale(${1 + 0.1 * k})`};
  },
  overlay: Overlay,
  cues: [
    {at: 2, src: 'mc:random/pop', volume: 0.4, rate: 0.9},
    {at: 5, src: 'mc:random/pop', volume: 0.4, rate: 1.0},
    {at: 8, src: 'mc:random/pop', volume: 0.4, rate: 1.1},
    {at: 11, src: 'mc:random/pop', volume: 0.4, rate: 1.2},
    {at: 14, src: 'mc:random/fuse', volume: 0.5},
    {at: BOOM, src: 'mc:random/explode1', volume: 0.55, rate: 1.15},
    {at: BOOM + 1, src: 'mc:random/pop', volume: 0.5, rate: 0.7},
    {at: BOOM + 6, src: 'mc:random/orb', volume: 0.3, rate: 1.4},
    {at: BOOM + 10, src: 'mc:random/orb', volume: 0.25, rate: 1.7},
  ],
};

export const creeperRushEntry = transitionEntry(creeperRushDef, {
  id: 'cute-creeper-rush',
  name: '苦力怕冲脸',
  category: 'cute',
  tags: ['可爱', '苦力怕', '爆炸', '转场', '像素', '搞笑'],
  blurb: '一排排圆滚滚的苦力怕脸从底部蹦上来挤满整个画面，然后从左下到右上依次点燃：一个个鼓胀、抖动、越来越快地闪白，最后从中心向外炸成绿色像素碎屑和烟团，露出下一个画面。',
  usage: '搞笑或节奏点转场、章节切换、梗点；与爆炸/惊吓相关的内容前后都很合适。',
  params: [
    {name: 'ROWS', desc: '苦力怕行数（默认 5）'},
    {name: 'PX', desc: '精灵像素尺寸（默认 24，越大脸越大）'},
    {name: 'BOOM', desc: '爆炸帧（默认 30，即转场中点，B 在此换入）'},
  ],
});
