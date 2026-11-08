// mcd-t-souls-sweep: a swarm of souls (white little ghost faces + cyan-blue pixel trails) flies diagonally across the frame, carrying a cold wave with it.
//   The wave front is a stair-stepped pixel edge (B is revealed behind it); both shots are graded cold (teal multiply + deep-blue screen) while the swarm
//   passes, and the front is lined with a thin soul-cyan light.   Props: N_SOULS, ANGLE.   Layer = souls + trails + cold band, transparent.
import {useLayoutEffect, useRef, type FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, hash, lerp, mEntry, plate, ss, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 62;
const N_SOULS = 34;
const ANG = (-25 * Math.PI) / 180;
const NX = Math.cos(ANG);
const NY = Math.sin(ANG);
const PXd = -NY; // perpendicular axis
const PYd = NX;

const frontD = (t: number) => lerp(-720, 2000, 0.5 * clamp01(t / T) + 0.5 * EASE.inOut(clamp01(t / T)));
const STEP = 24;

/** Stair-stepped half-plane polygon (everything behind the front, d < F), clipped to the frame. */
const frontPolygon = (F: number, t: number) => {
  const pts: [number, number][] = [[-40, -40]];
  for (let y = -STEP; y <= 1080 + STEP; y += STEP) {
    const jitter = (hash(Math.floor(y / STEP), 5, 9) - 0.5) * 70;
    const xf = Math.round(((F - NY * y) / NX + jitter) / STEP) * STEP;
    const xc = Math.max(-40, Math.min(1960, xf));
    pts.push([xc, y], [xc, y + STEP]);
  }
  pts.push([-40, 1080 + STEP]);
  void t;
  return pts;
};

const GHOST_A = ['.WWWWWW.', 'WWWWWWWW', 'WDDWWDDW', 'WDDWWDDW', 'WWWWWWWW', 'WWDDDDWW', 'WWDWWDWW', 'WWWWWWWW', '.WW.WW.W', '..W..W..'];
const GHOST_B = ['.WWWWWW.', 'WWWWWWWW', 'WDDWWDDW', 'WDDWWDDW', 'WWWWWWWW', 'WWDDDDWW', 'WWDWWDWW', 'WWWWWWWW', 'W.WW.WW.', '.W..W..W'];

const drawSwarm = (ctx: CanvasRenderingContext2D, t: number) => {
  ctx.clearRect(0, 0, 1920, 1080);
  const F = frontD(t);
  // the stair-stepped light line along the front
  const poly = frontPolygon(F, t);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'miter';
  const env = Math.sin(Math.PI * clamp01(t / T));
  ctx.beginPath();
  poly.slice(1, -1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = `rgba(60,179,200,${0.35 * env})`;
  ctx.lineWidth = 46;
  ctx.stroke();
  ctx.strokeStyle = `rgba(160,236,244,${0.8 * env})`;
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.strokeStyle = `rgba(252,255,255,${0.95 * env})`;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  const souls = Array.from({length: N_SOULS}, (_, i) => i).sort((a, b) => hash(a, 9, 3) - hash(b, 9, 3));
  for (const i of souls) {
    const lane = 40 + hash(i, 1, 3) * 1760;
    const q = Math.round(5 + hash(i, 2, 3) * 8);
    const lead = lerp(-200, 330, hash(i, 3, 3)) + Math.sin(t * 0.13 + i * 1.9) * 40;
    const d = F + lead;
    const bob = Math.sin(t * 0.21 + i * 2.3) * 22;
    const x = d * NX + (lane + bob) * PXd;
    const y = d * NY + (lane + bob) * PYd;
    if (x < -240 || x > 2160 || y < -240 || y > 1320) continue;
    const a = clamp01(Math.min(t / 6, (T - t) / 8));
    // trail (additive pixel squares, brightest next to the soul)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 1; k <= 22; k++) {
      const back = k * (q * 2.4);
      const wob = Math.sin(t * 0.3 + i + k * 0.6) * q * 0.7;
      const tx = Math.round((x - back * NX + wob * PXd) / 4) * 4;
      const ty = Math.round((y - back * NY + wob * PYd + q * 4) / 4) * 4;
      const s = Math.max(4, Math.round(q * 1.5 * (1 - k / 26)));
      ctx.globalAlpha = (1 - k / 23) * 0.95 * a;
      ctx.fillStyle = k > 12 ? '#2F95AA' : k > 5 ? '#3CB3C8' : '#7FD0E4';
      ctx.fillRect(tx, ty, s, s);
    }
    ctx.restore();
    ctx.globalAlpha = a;
    // glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(x, y, 0, x, y, q * 9);
    gr.addColorStop(0, 'rgba(100,200,220,0.5)');
    gr.addColorStop(1, 'rgba(60,179,200,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - q * 9, y - q * 9, q * 18, q * 18);
    ctx.restore();
    // sprite
    const rows = Math.floor(t / 4 + i) % 2 ? GHOST_A : GHOST_B;
    const ox = Math.round(x - q * 4);
    const oy = Math.round(y - q * 5);
    for (let r = 0; r < rows.length; r++)
      for (let c = 0; c < 8; c++) {
        const ch = rows[r][c];
        if (ch === '.') continue;
        ctx.fillStyle = ch === 'W' ? '#FCFFFF' : '#67A9AB';
        ctx.fillRect(ox + c * q, oy + r * q, q, q);
      }
    ctx.globalAlpha = 1;
  }
};

const Swarm: FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) drawSwarm(ref.current.getContext('2d')!, t);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{...FULL, width: '100%', height: '100%'}} />;
};

/** Cold band: a wide soft gradient perpendicular to the motion, centred on the front. */
const ColdBand: FC<{F: number}> = ({F}) => {
  const ang = (ANG * 180) / Math.PI;
  const cxp = F * NX;
  const cyp = F * NY;
  return (
    <>
      <div style={{position: 'absolute', left: cxp - 1800, top: cyp - 1800, width: 3600, height: 3600, transform: `rotate(${ang}deg)`, transformOrigin: '50% 50%', mixBlendMode: 'multiply', background: 'linear-gradient(90deg, rgba(150,205,230,0) 0%, rgba(150,205,230,0) 33%, rgba(150,205,230,0.9) 46%, rgba(120,190,225,0.95) 50%, rgba(150,205,230,0.6) 58%, rgba(150,205,230,0) 70%)'}} />
      <div style={{position: 'absolute', left: cxp - 1800, top: cyp - 1800, width: 3600, height: 3600, transform: `rotate(${ang}deg)`, transformOrigin: '50% 50%', mixBlendMode: 'screen', background: 'linear-gradient(90deg, rgba(20,70,110,0) 0%, rgba(20,70,110,0) 36%, rgba(40,130,170,0.55) 49%, rgba(90,200,220,0.7) 51%, rgba(20,70,110,0.28) 60%, rgba(20,70,110,0) 72%)'}} />
    </>
  );
};

export const SoulsOverlay: FC<OverlayProps> = ({f}) => (
  <AbsoluteFill>
    <div style={{...FULL, overflow: 'hidden'}}>
      <ColdBand F={frontD(f)} />
    </div>
    <Swarm t={f} />
  </AbsoluteFill>
);

const SoulsScene: FC<SceneProps> = ({f, A, B, p}) => {
  const F = frontD(f);
  const poly = frontPolygon(F, f);
  const clip = `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
  const bell = Math.sin(Math.PI * clamp01(f / T));
  const grade = `saturate(${1 - 0.3 * bell}) brightness(${1 - 0.12 * bell})`;
  return (
    <AbsoluteFill>
      {p < 1 && (
        <div style={{...FULL, filter: grade}}>
          <A />
        </div>
      )}
      {p > 0 && (
        <div style={{...FULL, clipPath: p >= 1 ? undefined : clip, filter: grade, transform: `scale(${lerp(1.04, 1, EASE.out(clamp01(f / T)))})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <SoulsOverlay p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const soulsSweepDef: MDef = {
  frames: T,
  Scene: SoulsScene,
  Overlay: SoulsOverlay,
  cues: [
    {at: 6, src: 'mc:random/orb', volume: 0.1, rate: 0.6},
    {at: 18, src: 'mc:random/orb', volume: 0.1, rate: 0.75},
    {at: 30, src: 'mc:random/orb', volume: 0.1, rate: 0.9},
  ],
};

export const soulsSweepPair = {A: plate('nether'), B: plate('snow')};

export const soulsSweepEntry = mEntry(
  soulsSweepDef,
  {
    id: 'mcd-t-souls-sweep',
    name: '地下城·灵魂群扫过',
    tags: ['地下城', '转场', '灵魂', '冷色调', '像素拖尾'],
    blurb: '一群白色小鬼脸灵魂拖着青蓝像素拖尾沿对角线飞过画面，台阶状的像素波前把 A 换成 B，波带里两边画面都被冷青色调染过，前沿有一条灵魂青的细光。',
    usage: '灵魂/亡灵/幽冥主题的衔接、从暖色场景切到冷色场景、"回忆/往生"类段落。',
    params: [
      {name: 'N_SOULS', desc: '灵魂数量，默认 34'},
      {name: 'ANG', desc: '飞行方向角度，默认 -25°（向右上）'},
    ],
  },
  soulsSweepPair.A,
  soulsSweepPair.B,
);
