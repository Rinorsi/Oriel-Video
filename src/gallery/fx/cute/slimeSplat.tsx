import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {At, Confetti, Flash, Pix, W, H, INK, hash, lerp, outBack, outCubic, inQuad, seg, wobble} from './kit';
import {Chips, Flare} from './impact';
import {SlimeMob} from './mobs';

/**
 * cute-slime-splat: green slime pours down from the top in pixel-stepped drips (bubbles + glints inside, jelly wobble), a
 * big real Minecraft slime (vanilla entity texture) boings out of the middle, then the mass cracks apart into square
 * slime cubes that drop away from the centre outwards while the big slime squashes and splits into four small slimes.
 * No text, no round hole: the reveal is a pixel-block dissolve.
 * Cut-type: fully covered by t~21; the cubes start dropping at POP (t=30).
 * Tunables: COL (drip column width, px), POP (frame the mass cracks open), SLIME / SLIME_DEEP (colours), CUBE (dissolve cube size, px).
 */

const T = 60;
const POP = 30;
const COL = 24;
const N = W / COL;
const SLIME = '#4fcf63';
const SLIME_DEEP = '#2d9c48';
const SLIME_LIGHT = '#b6f5b4';
const STEP = 12;
const CUBE = 60;
const CCOLS = W / CUBE;
const CROWS = H / CUBE;
/** Dissolve time of each cube (frames after POP): rippling out from the centre with a little noise. */
const CUBE_T: number[] = Array.from({length: CCOLS * CROWS}, (_, i) => {
  const c = i % CCOLS;
  const r = Math.floor(i / CCOLS);
  const d = Math.hypot((c + 0.5) * CUBE - W / 2, (r + 0.5) * CUBE - H / 2) / 1100;
  return d * 12 + hash(c, r + 40) * 3;
});
const CX = W / 2;
const CY = H / 2;

/** Per-column drip delays + extra length, smooth so the front looks like drips. */
const COLS = Array.from({length: N}, (_, i) => {
  const wave = Math.sin(i * 0.55) * 0.5 + Math.sin(i * 1.3 + 2) * 0.3 + (hash(Math.floor(i / 3), 9) - 0.5) * 0.9;
  const delay = 3 + wave * 3;
  const drip = Math.max(0, hash(Math.floor(i / 4), 13) - 0.4) * 520 * (0.6 + 0.4 * Math.sin(i * 0.9));
  return {delay, drip};
});

const GLINTS = Array.from({length: 22}, (_, i) => ({x: 40 + hash(i, 1) * (W - 80), y: 60 + hash(i, 2) * (H - 200), h: 60 + hash(i, 3) * 150, w: i % 3 === 0 ? 24 : 12}));
const BUBBLES = Array.from({length: 22}, (_, i) => ({x: hash(i, 11) * W, y: hash(i, 12) * H, r: 18 + hash(i, 13) * 46, sp: 3 + hash(i, 14) * 6}));
/** Little slime faces floating inside the mass. */
const MINIS = Array.from({length: 26}, (_, i) => ({x: 80 + hash(i, 31) * (W - 160), y: 70 + hash(i, 32) * (H - 140), px: 5 + Math.floor(hash(i, 33) * 4), sp: 0.3 + hash(i, 34) * 0.3, drop: i % 4 === 3}))
  .filter((m) => Math.abs(m.x - CX) > 470 || Math.abs(m.y - CY) > 330);

const BLOBS = Array.from({length: 16}, (_, i) => ({x: hash(i, 21) * W, y: hash(i, 22) * H, r: 90 + hash(i, 23) * 160, dark: i % 3 === 0}));

/** Column heights of the pouring slime at time t (pixel-stepped). `lead` shifts the front forward in time. */
const heights = (t: number, lead: number, extra: number) =>
  COLS.map((c) => {
    const u = seg(t + lead, c.delay, c.delay + 17, (x) => 1 - (1 - x) * (1 - x));
    const raw = (H + 60) * u + c.drip * u * (1 - seg(t + lead, c.delay + 15, c.delay + 24)) + extra * u - 60 * (1 - u);
    return Math.round(raw / STEP) * STEP;
  });

const edgePath = (hs: number[]) => {
  let d = `M-40 -80 L-40 ${hs[0]}`;
  hs.forEach((h, i) => {
    d += ` L${i * COL} ${h} L${(i + 1) * COL} ${h}`;
  });
  d += ` L${W + 40} ${hs[hs.length - 1]} L${W + 40} -80 Z`;
  return d;
};

/** Full-screen rect with the dissolved cubes punched out (even-odd). `lag` delays each cube a little for the darker rim layer. */
const cubesPath = (t: number, lag: number) => {
  let d = `M-60 -60 H${W + 60} V${H + 60} H-60 Z`;
  CUBE_T.forEach((ct, i) => {
    if (t - POP < ct + lag) return;
    const x = (i % CCOLS) * CUBE;
    const y = Math.floor(i / CCOLS) * CUBE;
    d += ` M${x} ${y} h${CUBE} v${CUBE} h${-CUBE} Z`;
  });
  return d;
};

/** Ink outline of the dissolved area: only the cube edges that are not shared with another dissolved cube. */
const cubesOutline = (t: number, lag: number) => {
  const open = (c: number, r: number) => c >= 0 && r >= 0 && c < CCOLS && r < CROWS && t - POP >= CUBE_T[r * CCOLS + c] + lag;
  let d = '';
  for (let r = 0; r < CROWS; r++)
    for (let c = 0; c < CCOLS; c++) {
      if (!open(c, r)) continue;
      const x = c * CUBE;
      const y = r * CUBE;
      if (!open(c, r - 1)) d += `M${x} ${y} h${CUBE}`;
      if (!open(c, r + 1)) d += `M${x} ${y + CUBE} h${CUBE}`;
      if (!open(c - 1, r)) d += `M${x} ${y} v${CUBE}`;
      if (!open(c + 1, r)) d += `M${x + CUBE} ${y} v${CUBE}`;
    }
  return d;
};

/** True once the cube under (x, y) has dropped away. */
const gone = (t: number, x: number, y: number) => {
  const c = Math.min(CCOLS - 1, Math.max(0, Math.floor(x / CUBE)));
  const r = Math.min(CROWS - 1, Math.max(0, Math.floor(y / CUBE)));
  return t - POP >= CUBE_T[r * CCOLS + c];
};

const Mass: FC<{t: number}> = ({t}) => {
  const uid = useCurrentFrame();
  const post = t >= POP;
  const jig = t > 17 && !post ? wobble((t - 17) / 12, 2, 2.5) * 0.025 : 0;
  const body = post ? cubesPath(t, 0) : edgePath(heights(t, 0, 0));
  const deep = post ? cubesPath(t, 1.6) : edgePath(heights(t, 4, 30));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, transform: `scale(${1 - jig}, ${1 + jig * 2})`, transformOrigin: '50% 0%', overflow: 'visible'}}>
      <defs>
        <clipPath id={`slimeClip${uid}`}>
          <path d={body} clipRule="evenodd" />
        </clipPath>
      </defs>
      {post ? (
        <>
          <path d={deep} fill={SLIME_DEEP} fillRule="evenodd" />
          <path d={cubesOutline(t, 1.6)} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="square" />
        </>
      ) : (
        <path d={deep} fill={SLIME_DEEP} stroke={INK} strokeWidth={18} strokeLinejoin="miter" fillRule="evenodd" />
      )}
      <path d={body} fill={SLIME} fillRule="evenodd" />
      <g clipPath={`url(#slimeClip${uid})`}>
        <foreignObject x={0} y={0} width={W} height={H}>
          <div style={{width: W, height: H, backgroundImage: 'conic-gradient(rgba(255,255,255,0.07) 25%, transparent 0 50%, rgba(255,255,255,0.07) 0 75%, transparent 0)', backgroundSize: '120px 120px'}} />
        </foreignObject>
        {BLOBS.map((b, i) => (
          <circle key={i} cx={b.x + Math.sin(t * 0.12 + i) * 14} cy={b.y + Math.cos(t * 0.1 + i) * 10} r={b.r} fill={b.dark ? '#3cb552' : '#6fe07e'} opacity={b.dark ? 0.55 : 0.5} />
        ))}
        {[0, 1, 2].map((k) => (
          <polygon key={k} points={`${180 + k * 120},0 ${240 + k * 120 + (k === 0 ? 0 : -10)},0 ${-60 + k * 120},520 ${-120 + k * 120},520`} fill="#ffffff" opacity={0.2 - k * 0.04} transform="translate(0 0)" />
        ))}
        {GLINTS.map((g, i) => (
          <rect key={i} x={g.x} y={g.y} width={g.w} height={g.h} fill={SLIME_LIGHT} opacity={0.8} />
        ))}
        {BUBBLES.map((b, i) => {
          const y = (b.y - t * b.sp + 1400 * H) % (H + 100);
          return (
            <g key={i}>
              <circle cx={b.x} cy={y} r={b.r} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.9)" strokeWidth={8} />
              <circle cx={b.x - b.r * 0.35} cy={y - b.r * 0.35} r={Math.max(4, b.r * 0.16)} fill="#fff" />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const SPLIT = [
  {a: -135, v: 1500, spin: -240},
  {a: -45, v: 1650, spin: 220},
  {a: 150, v: 1350, spin: -200},
  {a: 28, v: 1450, spin: 260},
];
const GREENS = ['#4fcf63', '#2d9c48', '#b6f5b4', '#7be07a', '#23422a'];

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const post = t >= POP;
  const a = t - POP;
  // big slime: boings in, wobbles, squashes flat right before it splits
  const face = outBack(seg(t, 18, 25), 3);
  const wob = post ? 0 : 0.05 * wobble((t - 24) / 8, 2, 3);
  const squash = post ? seg(a, 0, 2.5) : seg(t, POP - 4, POP) * 0.5;
  const bigOut = !post || a < 2.5;
  return (
    <AbsoluteFill>
      <Mass t={t} />
      {MINIS.map((m, i) => {
        if (post && gone(t, m.x, m.y)) return null;
        const born = outBack(seg(t, 14 + (i % 7) * 1.5, 20 + (i % 7) * 1.5), 2.5);
        if (born <= 0) return null;
        return (
          <At key={i} x={m.x} y={m.y + Math.sin(t * m.sp + i) * 8} s={born * (1 + 0.06 * Math.sin(t * 0.5 + i))} rot={Math.sin(t * 0.2 + i) * 6} z={6}>
            {m.drop ? <Pix s="drop" px={8} fine={2} shadow /> : <SlimeMob s={m.px} />}
          </At>
        );
      })}
      {bigOut && (
        <At x={CX} y={CY + 10 + squash * 70} sx={face * (1 + wob + squash * 0.55)} sy={face * (1 - wob - squash * 0.5)} z={10}>
          <SlimeMob s={44} />
        </At>
      )}
      {post &&
        SPLIT.map((sp, i) => {
          const u = Math.max(0, a - 1.5) / 30;
          if (u <= 0) return null;
          const rad = (sp.a * Math.PI) / 180;
          const x = CX + Math.cos(rad) * sp.v * u;
          const y = CY + 60 + Math.sin(rad) * sp.v * u + 0.5 * 2800 * u * u;
          const s = lerp(1.1, 0.8, Math.min(1, u * 4));
          if (x < -300 || x > W + 300 || y > H + 300) return null;
          return (
            <At key={i} x={x} y={y} rot={sp.spin * u} s={s} z={12}>
              <SlimeMob s={20} />
            </At>
          );
        })}
      {post && (
        <>
          <Chips t={t} at={POP} x={CX} y={CY + 60} count={34} seed={43} colors={GREENS} life={34} speed={[800, 2100]} gravity={2800} size={[2, 4]} spread={120} z={20} />
          <Confetti t={t} at={POP} x={CX} y={CY + 40} count={22} seed={44} life={32} speed={[700, 1900]} gravity={2600} px={[6, 10]} kinds={['s:drop']} z={21} />
          <Flare t={t} at={POP} x={CX} y={CY + 20} color="#b6f5b4" maxR={760} life={16} cell={12} rays={12} seed={9} z={30} />
        </>
      )}
      <AbsoluteFill style={{zIndex: 60}}>
        <Flash o={post ? Math.max(0, 0.55 - a / 6) : 0} color="#e9ffe6" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const slimeSplatDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-slime-splat',
  name: '史莱姆糊脸',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${1 + 0.06 * (1 - seg(p * T, POP, POP + 16, outCubic))})`}),
  overlay: Overlay,
  cues: [
    {at: 2, src: 'mc:dig/gravel1', volume: 0.35, rate: 0.6},
    {at: 5, src: 'mc:random/pop', volume: 0.35, rate: 0.6},
    {at: 9, src: 'mc:random/pop', volume: 0.3, rate: 0.75},
    {at: 13, src: 'mc:random/pop', volume: 0.3, rate: 0.9},
    {at: 20, src: 'mc:random/orb', volume: 0.3, rate: 0.8},
    {at: 21, src: 'mc:random/pop', volume: 0.5, rate: 0.55},
    {at: POP, src: 'mc:random/pop', volume: 0.65, rate: 0.7},
    {at: POP + 1, src: 'mc:dig/gravel1', volume: 0.5, rate: 0.5},
    {at: POP + 6, src: 'mc:random/pop', volume: 0.4, rate: 1.1},
    {at: POP + 11, src: 'mc:random/pop', volume: 0.35, rate: 1.4},
  ],
};

export const slimeSplatEntry = transitionEntry(slimeSplatDef, {
  id: 'cute-slime-splat',
  name: '史莱姆糊脸',
  category: 'cute',
  tags: ['可爱', '史莱姆', '果冻', '气泡', '转场', '像素', '搞笑'],
  blurb: '绿色史莱姆从屏幕上方一块块流下来糊满全屏（里面有气泡和高光，果冻般抖动），中间弹出一只原版史莱姆；随后它被压扁、分裂成四只小史莱姆弹飞，整片黏液碎成方块从中心向外一格格掉落，露出下一个画面。',
  usage: '搞怪/沙雕转场、史莱姆或沼泽相关内容，或者需要“糊脸”式强冲击的切换。',
  params: [
    {name: 'COL', desc: '滴落列宽（默认 24 像素）'},
    {name: 'POP', desc: '碎裂、分裂帧（默认 30）'},
    {name: 'CUBE', desc: '碎裂方块的边长（默认 60，需整除 1920/1080）'},
    {name: 'SLIME / SLIME_DEEP', desc: '史莱姆主色与底边深色'},
  ],
});
