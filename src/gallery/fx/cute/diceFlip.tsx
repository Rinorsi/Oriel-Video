import type {CSSProperties, FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {Checker, Polka, Sprinkle, W, H, INK, outBack, seg} from './kit';
import {Chips, Flare, Smoke} from './impact';

/**
 * cute-dice-flip: the whole picture becomes a rounded dice face (ink frame, white inner highlight, corner pips),
 * squats, hops and rolls forward 90 degrees onto the next face - shot B - with an overshoot and a squash on landing.
 * Dual-type: A and B are 3D-transformed (CSS perspective + rotateX); the overlay computes the projected outline of both
 * faces, paints a purple stage everywhere else (so the gaps beside the tilted faces are never black), draws the frame
 * and pips on each face and shades the face that is turning away.
 * Tunables: FLIP0 / FLIP1 (start / end frame of the roll), RADIUS (corner radius), PERSP (camera distance, px).
 */

const T = 44;
const FLIP0 = 7;
const FLIP1 = 25;
const RADIUS = 72;
const PERSP = 2400;
const D = H / 2;
const CX = W / 2;
const CY = H / 2;

/** 0..1 roll progress (with a small wind-up and an overshoot). */
const roll = (t: number) => (t < FLIP0 ? -0.07 * Math.sin(seg(t, 0, FLIP0) * Math.PI) : outBack(seg(t, FLIP0, FLIP1), 1.35));

type Pose = {deg: number; dy: number; sx: number; sy: number};
const poseOf = (t: number): {a: Pose; b: Pose} => {
  const m = roll(t);
  const hop = -Math.sin(seg(t, FLIP0 + 1, FLIP1) * Math.PI) * 70;
  const q = t > FLIP1 ? Math.exp(-(t - FLIP1) * 0.3) * Math.cos((t - FLIP1) * 0.95) : 0;
  const squat = t < FLIP0 ? Math.sin(seg(t, 0, FLIP0) * Math.PI) * 0.05 : 0;
  const sx = 1 + 0.035 * q + squat * 0.6;
  const sy = 1 - 0.06 * q - squat;
  return {a: {deg: -90 * m, dy: hop, sx, sy}, b: {deg: 90 * (1 - m), dy: hop, sx, sy}};
};

const css = (p: Pose): CSSProperties => ({
  transform: `translateY(${p.dy}px) scale(${p.sx},${p.sy}) perspective(${PERSP}px) translateZ(${-D}px) rotateX(${p.deg}deg) translateZ(${D}px)`,
  borderRadius: RADIUS,
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
});

const project = (x: number, y: number, p: Pose): [number, number] => {
  const a = (p.deg * Math.PI) / 180;
  const z = D;
  const y1 = y * Math.cos(a) - z * Math.sin(a);
  const z1 = y * Math.sin(a) + z * Math.cos(a);
  const k = PERSP / (PERSP - (z1 - D));
  return [CX + x * k * p.sx, CY + y1 * k * p.sy + p.dy];
};

const OUTLINE: [number, number][] = (() => {
  const pts: [number, number][] = [];
  const cs: [number, number, number][] = [
    [W / 2 - RADIUS, -H / 2 + RADIUS, -90],
    [W / 2 - RADIUS, H / 2 - RADIUS, 0],
    [-W / 2 + RADIUS, H / 2 - RADIUS, 90],
    [-W / 2 + RADIUS, -H / 2 + RADIUS, 180],
  ];
  for (const [cx, cy, a0] of cs)
    for (let k = 0; k <= 7; k++) {
      const a = ((a0 + (k / 7) * 90) * Math.PI) / 180;
      pts.push([cx + Math.cos(a) * RADIUS, cy + Math.sin(a) * RADIUS]);
    }
  return pts;
})();

/** Projected outline (CSS polygon points) if the face is front-facing, else null. */
const outline = (p: Pose): string[] | null => {
  const pts = OUTLINE.map(([x, y]) => project(x, y, p));
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  if (area <= 2000) return null;
  return pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`);
};

const Pip: FC<{x: number; y: number}> = ({x, y}) => (
  <div style={{position: 'absolute', left: W / 2 + x - 48, top: H / 2 + y - 48, width: 96, height: 96, borderRadius: '50%', background: '#ffffff', boxShadow: `0 0 0 9px ${INK}, 0 14px 0 9px rgba(43,35,56,0.4), inset -10px -12px 0 #d9c8ff, inset 12px 12px 0 #ffffff`}} />
);

const FaceFrame: FC<{p: Pose; kind: 4 | 5; shade: number; fade: number; frameO?: number}> = ({p, kind, shade, fade, frameO = 1}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, borderRadius: RADIUS, backfaceVisibility: 'hidden', transform: css(p).transform, boxShadow: `inset 0 0 0 16px ${INK}, inset 0 0 0 30px rgba(255,255,255,0.6)`, background: `rgba(30,20,52,${shade})`, zIndex: 20, opacity: frameO}}>
    <div style={{opacity: fade}}>
      <Pip x={-W / 2 + 190} y={-H / 2 + 170} />
      <Pip x={W / 2 - 190} y={-H / 2 + 170} />
      <Pip x={-W / 2 + 190} y={H / 2 - 170} />
      <Pip x={W / 2 - 190} y={H / 2 - 170} />
      {kind === 5 && <Pip x={0} y={0} />}
    </div>
  </div>
);

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const {a, b} = poseOf(t);
  const oa = outline(a);
  const ob = outline(b);
  const outer = `0px 0px,${W}px 0px,${W}px ${H}px,0px ${H}px,0px 0px`;
  const clip = `polygon(evenodd, ${outer}${oa ? `,${oa.join(',')},${oa[0]},0px 0px` : ''}${ob ? `,${ob.join(',')},${ob[0]},0px 0px` : ''})`;
  const fade = 1 - seg(t, 31, 40);
  const shadeA = Math.min(0.55, Math.abs(Math.sin((a.deg * Math.PI) / 180)) * 0.6);
  const shadeB = Math.min(0.55, Math.abs(Math.sin((b.deg * Math.PI) / 180)) * 0.6);
  return (
    <AbsoluteFill>
      {t < 36 && (
        <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden'}}>
          <Checker a="#3a2d5c" b="#46376c" size={72} x={t * 3} y={t * 2} />
          <Polka color="rgba(255,122,168,0.35)" size={144} r={16} x={-t * 2} y={t * 2} />
          <Sprinkle t={t} at={0} dur={40} seed={151} count={14} kinds={['star', 'spark']} px={[3, 5]} z={1} />
        </div>
      )}
      {oa && <FaceFrame p={a} kind={4} shade={shadeA} fade={fade} />}
      {ob && <FaceFrame p={b} kind={5} shade={shadeB} fade={fade} frameO={fade} />}
      {/* take-off: a puff of dust under the die as it hops */}
      <Smoke t={t} at={FLIP0} x={W * 0.3} y={H - 20} count={4} seed={153} dur={16} spread={120} drift={[200, 600]} rise={10} flatY={0.3} px={10} grow={[0.8, 1.6]} z={30} />
      <Smoke t={t} at={FLIP0} x={W * 0.7} y={H - 20} count={4} seed={154} dur={16} spread={120} drift={[200, 600]} rise={10} flatY={0.3} px={10} grow={[0.8, 1.6]} z={30} />
      {/* landing: dust banks kicked out along the bottom edge + chips off the corners, a small cross flare at the new face */}
      <Smoke t={t} at={FLIP1 - 1} x={W * 0.2} y={H - 10} count={5} seed={155} dur={20} spread={200} drift={[300, 900]} rise={20} flatY={0.35} px={13} grow={[0.9, 2]} z={30} />
      <Smoke t={t} at={FLIP1 - 1} x={W * 0.5} y={H - 10} count={5} seed={156} dur={20} spread={200} drift={[300, 900]} rise={20} flatY={0.35} px={13} grow={[0.9, 2]} z={30} />
      <Smoke t={t} at={FLIP1 - 1} x={W * 0.8} y={H - 10} count={5} seed={157} dur={20} spread={200} drift={[300, 900]} rise={20} flatY={0.35} px={13} grow={[0.9, 2]} z={30} />
      <Chips t={t} at={FLIP1 - 1} x={W * 0.08} y={H * 0.92} count={10} seed={158} colors={['#ffffff', FLAT.purple, FLAT.pink, FLAT.yellow]} life={24} speed={[700, 1500]} angle={[-80, -20]} gravity={2200} size={[1, 3]} z={31} />
      <Chips t={t} at={FLIP1 - 1} x={W * 0.92} y={H * 0.92} count={10} seed={159} colors={['#ffffff', FLAT.purple, FLAT.pink, FLAT.yellow]} life={24} speed={[700, 1500]} angle={[-160, -100]} gravity={2200} size={[1, 3]} z={31} />
      <Flare t={t} at={FLIP1} x={CX} y={CY} color="#ffffff" maxR={700} life={14} cell={8} rays={10} seed={6} z={32} />
    </AbsoluteFill>
  );
};

export const diceFlipDef: TransitionDef & {mode: 'dual'} = {
  id: 'cute-dice-flip',
  name: '骰子翻面',
  frames: T,
  mode: 'dual',
  a: (p) => css(poseOf(p * T).a),
  b: (p) => css(poseOf(p * T).b),
  overlay: Overlay,
  cues: [
    {at: 0, src: 'mc:random/click', volume: 0.35, rate: 0.7},
    {at: FLIP0 + 2, src: 'mc:random/pop', volume: 0.35, rate: 1.4},
    {at: FLIP0 + 5, src: 'mc:random/click', volume: 0.3, rate: 1.2},
    {at: FLIP0 + 9, src: 'mc:random/click', volume: 0.3, rate: 1.5},
    {at: FLIP1 - 1, src: 'mc:dig/stone1', volume: 0.6, rate: 0.9},
    {at: FLIP1, src: 'mc:random/pop', volume: 0.5, rate: 0.8},
    {at: FLIP1 + 2, src: 'mc:random/levelup', volume: 0.25, rate: 1.5},
  ],
};

export const diceFlipEntry = transitionEntry(diceFlipDef, {
  id: 'cute-dice-flip',
  name: '骰子翻面',
  category: 'cute',
  tags: ['可爱', '骰子', '立方体', '翻转', '3D', '转场', '像素'],
  blurb: '整个画面变成一块圆角骰子面（深色描边、白色高光边、四角骰子点），先蹲一下再跳起来向前翻 90 度落到下一面，落地带过冲和挤压，落地时底边扬起灰尘、四角崩出碎屑。',
  usage: '章节切换、“下一个/下一期”的翻页，抽卡、随机、游戏类内容尤其合适。',
  params: [
    {name: 'FLIP0 / FLIP1', desc: '翻转开始 / 结束的帧（默认 7 / 25）'},
    {name: 'RADIUS', desc: '圆角半径（默认 72）'},
    {name: 'PERSP', desc: '透视距离（默认 2400，越小越夸张）'},
  ],
});
