// mcd-t-lightning-flash: a night storm. Rain (blue pixel streaks) falls over the dimmed A shot, a first stepped-polyline bolt lights the world with a
//   short double flash and a shake, then a second, bigger bolt strikes with a full white-out: B takes over inside the white and the flash flickers away in
//   hard steps while the thunder rolls.   Bolts follow the game look: stair-stepped path, white core #FAFDF5, blue fringe #42A1E0, a branch, ground sparks.
//   Props: BOLT1_X / BOLT2_X (strike x positions).   Layer = rain + bolts + flashes (transparent).
import {useLayoutEffect, useRef, type FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, hash, lerp, mEntry, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 52;
const S1 = 9; // first strike
const S2 = 24; // second strike (the cut)
const CUT = 25;
const BOLT1 = {x: 1330, y: 700, seed: 3};
const BOLT2 = {x: 640, y: 760, seed: 8};

const snap = (n: number, q = 4) => Math.round(n / q) * q;

const boltPath = (b: {x: number; y: number; seed: number}) => {
  const pts: [number, number][] = [];
  let x = b.x + (hash(b.seed, 1) - 0.5) * 360;
  let y = -40;
  let i = 0;
  pts.push([snap(x), y]);
  while (y < b.y && i < 60) {
    const dy = 24 + hash(i, b.seed, 61) * 26;
    const toward = (b.x - x) * 0.18;
    const dx = (hash(i, b.seed, 62) - 0.5) * 2 * 40 + toward;
    // stair step: go sideways first, then down
    x += dx;
    pts.push([snap(x), snap(y)]);
    y = Math.min(b.y, y + dy);
    pts.push([snap(x), snap(y)]);
    i++;
  }
  return pts;
};

const strokePath = (ctx: CanvasRenderingContext2D, pts: [number, number][], upto: number) => {
  const n = Math.max(2, Math.floor(pts.length * upto));
  ctx.beginPath();
  for (let k = 0; k < n; k++) (k ? ctx.lineTo(pts[k][0], pts[k][1]) : ctx.moveTo(pts[k][0], pts[k][1]));
  ctx.stroke();
};

const drawBolt = (ctx: CanvasRenderingContext2D, b: {x: number; y: number; seed: number}, age: number, big: number) => {
  if (age < 0 || age > 9) return;
  const pts = boltPath(b);
  const grow = age === 0 ? 0.55 : 1;
  const vis = age < 3 ? 1 : age < 5 ? 0.65 : age < 7 ? 0.9 : 0.3;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.globalAlpha = vis;
  ctx.strokeStyle = 'rgba(138,203,202,0.38)';
  ctx.lineWidth = 64 * big;
  strokePath(ctx, pts, grow);
  ctx.strokeStyle = 'rgba(66,161,224,0.8)';
  ctx.lineWidth = 30 * big;
  strokePath(ctx, pts, grow);
  ctx.strokeStyle = '#FAFDF5';
  ctx.lineWidth = 15 * big;
  strokePath(ctx, pts, grow);
  // two branches
  for (const [bi, dir] of [[Math.floor(pts.length * 0.3), 1], [Math.floor(pts.length * 0.55), -1]] as [number, number][]) {
    const [bx, by] = pts[bi];
    const br: [number, number][] = [[bx, by]];
    let x = bx;
    let y = by;
    for (let k = 0; k < 5; k++) {
      x += dir * (22 + hash(k, b.seed + bi, 63) * 22);
      br.push([snap(x), snap(y)]);
      y += 20 + hash(k, b.seed + bi, 64) * 22;
      br.push([snap(x), snap(y)]);
    }
    ctx.strokeStyle = 'rgba(66,161,224,0.75)';
    ctx.lineWidth = 17 * big;
    strokePath(ctx, br, grow);
    ctx.strokeStyle = '#E6F6FF';
    ctx.lineWidth = 8 * big;
    strokePath(ctx, br, grow);
  }
  ctx.restore();
  // ground impact: blue light, hit sparks (thin rectangles), a cross flash
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const R = 340 * big * (1 - age / 14);
  const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, R);
  gr.addColorStop(0, `rgba(190,235,255,${0.85 * vis})`);
  gr.addColorStop(0.3, `rgba(66,161,224,${0.4 * vis})`);
  gr.addColorStop(1, 'rgba(9,80,171,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(b.x - R, b.y - R, R * 2, R * 2);
  for (let k = 0; k < 14; k++) {
    const ang = hash(k, b.seed, 71) * Math.PI * 2;
    const d = (10 + hash(k, b.seed, 72) * 22) * age * big;
    const len = (18 + hash(k, b.seed, 73) * 24) * (1 - age / 10);
    ctx.save();
    ctx.translate(b.x + Math.cos(ang) * d, b.y + Math.sin(ang) * d * 0.55 - 0.5 * age * age);
    ctx.rotate(ang);
    ctx.globalAlpha = Math.max(0, 1 - age / 9);
    ctx.fillStyle = k % 3 ? '#E6F6FF' : '#FFFFFF';
    ctx.fillRect(-len / 2, -3, len, 6);
    ctx.restore();
  }
  ctx.restore();
};

const drawStorm = (ctx: CanvasRenderingContext2D, t: number) => {
  ctx.clearRect(0, 0, 1920, 1080);
  // rain
  ctx.save();
  const rainA = 0.8 * (1 - ss(CUT + 4, CUT + 16, t)) * ss(0, 4, t);
  if (rainA > 0.02) {
    for (let i = 0; i < 120; i++) {
      const layer = hash(i, 1, 90);
      const sp = 52 + layer * 36;
      const len = Math.round((22 + layer * 26) / 2) * 2;
      const x0 = hash(i, 2, 90) * 2300 - 200;
      const y = ((hash(i, 3, 90) * 1400 + t * sp) % 1300) - 140;
      const x = x0 - y * 0.16;
      ctx.globalAlpha = rainA * (0.35 + 0.5 * layer);
      ctx.fillStyle = layer > 0.5 ? '#9CCBF0' : '#6FA3D8';
      ctx.fillRect(snap(x, 2), snap(y, 2), layer > 0.6 ? 4 : 2, len);
    }
  }
  ctx.restore();
  drawBolt(ctx, BOLT1, t - S1, 0.8);
  drawBolt(ctx, BOLT2, t - S2, 1.25);
};

const Storm: FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) drawStorm(ref.current.getContext('2d')!, t);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{...FULL, width: '100%', height: '100%'}} />;
};

/** Screen flash alpha over time (hard, flickering). */
const flashAlpha = (t: number) => {
  const a1 = t - S1;
  if (a1 >= 0 && a1 < 9) return [0.62, 0.2, 0.44, 0.12, 0.28, 0.1, 0.06, 0.03, 0.02][a1];
  const a2 = t - S2;
  if (a2 >= 0 && a2 < 3) return 1;
  if (a2 >= 3 && a2 < 16) {
    const steps = [0.78, 0.9, 0.55, 0.7, 0.4, 0.5, 0.3, 0.22, 0.14, 0.09, 0.05, 0.03, 0.01];
    return steps[a2 - 3];
  }
  return 0;
};

export const LightningOverlay: FC<OverlayProps> = ({f}) => {
  const fa = flashAlpha(f);
  return (
    <AbsoluteFill>
      <Storm t={f} />
      <div style={{...FULL, background: f - S2 >= 0 && f - S2 < 3 ? '#fff' : 'rgb(222,238,255)', opacity: fa}} />
    </AbsoluteFill>
  );
};

const LightningScene: FC<SceneProps> = ({f, A, B, p}) => {
  const shake1 = f >= S1 && f < S1 + 3 ? (hash(f, 1) - 0.5) * 14 : 0;
  const shake2 = f >= S2 && f < S2 + 5 ? (hash(f, 2) - 0.5) * 26 * (1 - (f - S2) / 5) : 0;
  const dim = 0.72 + 0.28 * (1 - ss(0, S1 - 1, f));
  const q = clamp01((f - CUT) / (T - CUT));
  return (
    <AbsoluteFill>
      {f < CUT && (
        <div style={{...FULL, transform: `translate(${shake1 + shake2}px,${(shake1 + shake2) * 0.5}px)`, filter: `brightness(${dim + (f >= S1 && f < S1 + 3 ? 0.55 : 0)})`}}>
          <A />
        </div>
      )}
      {f >= CUT && (
        <div style={{...FULL, transform: `translate(${shake2}px,${shake2 * 0.5}px) scale(${lerp(1.03, 1, EASE.out(q))})`, filter: `brightness(${lerp(1.5, 1, EASE.out(clamp01((f - CUT) / 14)))})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <LightningOverlay p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const lightningFlashDef: MDef = {
  frames: T,
  Scene: LightningScene,
  Overlay: LightningOverlay,
  cues: [
    {at: S1, src: 'mc:ambient/weather/thunder1', volume: 0.3, rate: 1.25},
    {at: S2, src: 'mc:ambient/weather/thunder1', volume: 0.5},
    {at: S2, src: 'mc:random/explode1', volume: 0.12, rate: 1.4},
  ],
};

export const lightningFlashPair = {A: plate('snow'), B: plate('forest-night', {frameOffset: 20})};
void stepQ;

export const lightningFlashEntry = mEntry(
  lightningFlashDef,
  {
    id: 'mcd-t-lightning-flash',
    name: '地下城·闪电白闪',
    tags: ['地下城', '转场', '闪电', '白闪', '雷鸣', '夜景'],
    blurb: '夜雨里先落下一道小闪电（双闪+震屏），紧接着第二道更粗的阶梯折线闪电劈下，整屏白闪，B 在白光里接手并按台阶状闪烁退去；雷鸣音效跟随。',
    usage: '夜战/风暴/恐怖氛围的镜头切换、Boss 登场、惊吓点；也可只导出 Layer 叠在素材上。',
    params: [
      {name: 'BOLT1 / BOLT2', desc: '两道闪电的落点 x、y 与种子（lightningFlash.tsx 顶部）'},
      {name: 'S1 / S2 / CUT', desc: '第一道、第二道闪电与切换帧'},
    ],
  },
  lightningFlashPair.A,
  lightningFlashPair.B,
);
