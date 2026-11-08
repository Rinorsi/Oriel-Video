// mcd-t-portal-whiteout: the camp portal lights up, a pixel vortex spills out of it, lights the surroundings and floods the frame white -> B fades in out of the white
//   (the ~0.7 s stepped white-out of the Boss portal, reference portal-whiteout-transition.png).
//   Props: px / py = screen position of the portal in the A shot (1920x1080).   Layer = glow + vortex + white only.
import {useLayoutEffect, useRef, type FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, hash, lerp, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps, mEntry} from './common';

const T = 78;
const FILL = 40; // vortex has filled the frame
const CUT = 44; // B takes over (frame is pure white)
const FADE0 = 47; // white starts to step away
const PX = 1272;
const PY = 206;

const PAL = ['#2c0a5e', '#6e04d8', '#aa3dec', '#e692ef', '#fad6fb'];
const PAL_RGB = PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const mixWhite = (k: number, w: number) => {
  const c = PAL_RGB[k];
  const m = Math.min(1, Math.max(0, w));
  return `rgb(${Math.round(c[0] + (255 - c[0]) * m)},${Math.round(c[1] + (255 - c[1]) * m)},${Math.round(c[2] + (255 - c[2]) * m)})`;
};
const CELL = 20;

const drawVortex = (ctx: CanvasRenderingContext2D, t: number) => {
  ctx.clearRect(0, 0, 1920, 1080);
  const g = clamp01((t - 2) / (FILL - 2));
  const E = ss(6, FILL - 4, t); // energy 0..1
  const R = lerp(70, 1650, g * g);
  const stretch = lerp(1.9, 1, ss(0, 0.5, g)); // starts as the tall portal rectangle, grows into a hexagon
  const spin = t * 0.38;
  const cols = 1920 / CELL;
  const rows = 1080 / CELL;
  const whiteAll = ss(0.5, 0.98, E);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * CELL + CELL / 2;
      const y = j * CELL + CELL / 2;
      const dx = x - PX;
      const dy = (y - PY) / stretch;
      // pointy-top hexagon metric (no round rings)
      const hexD = Math.max(Math.abs(dx) * 0.866 + Math.abs(dy) * 0.5, Math.abs(dy));
      const n = hash(i, j, 7);
      if (hexD > R + (n - 0.5) * 110) continue;
      const r = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const w = Math.sin(th * 2 + r * 0.0125 - spin) + (n - 0.5) * 0.5;
      let k = w > 0.55 ? 4 : w > 0.05 ? 3 : w > -0.5 ? 2 : w > -0.85 ? 1 : 0;
      if (hexD < R * 0.18 + 40) k = Math.min(4, k + 1);
      const wf = whiteAll * (0.55 + 0.45 * stepQ(n, 3)) + (1 - clamp01(hexD / (R + 1))) * 0.35 * E;
      const k2 = Math.min(4, k + Math.round(wf * 3));
      ctx.globalAlpha = 1;
      ctx.fillStyle = mixWhite(k2, (wf - 0.55) * 2.2);
      ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
    }
  }
  // sparks streaming into the portal
  ctx.globalAlpha = 1;
  for (let s = 0; s < 46; s++) {
    const a = hash(s, 1, 3) * Math.PI * 2;
    const r0 = 420 + hash(s, 2, 3) * 900;
    const start = 1 + hash(s, 3, 3) * 22;
    const dur = 14 + hash(s, 4, 3) * 8;
    const u = (t - start) / dur;
    if (u < 0 || u > 1) continue;
    const r = r0 * (1 - u * u);
    const q = hash(s, 5, 3) > 0.5 ? 16 : 12;
    const x = Math.round((PX + Math.cos(a) * r) / 4) * 4;
    const y = Math.round((PY + Math.sin(a) * r * 0.8) / 4) * 4;
    ctx.globalAlpha = Math.min(1, u * 3) * (1 - 0.3 * u);
    ctx.fillStyle = s % 3 === 0 ? '#ffffff' : s % 3 === 1 ? '#f6d4ff' : '#b44cf0';
    ctx.fillRect(x, y, q, q);
    ctx.fillStyle = 'rgba(180,76,240,0.55)';
    ctx.fillRect(x - Math.round((Math.cos(a) * q * 1.6) / 4) * 4, y - Math.round((Math.sin(a) * q * 1.6) / 4) * 4, q - 4, q - 4);
  }
  ctx.globalAlpha = 1;
};

const Vortex: FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) drawVortex(ref.current.getContext('2d')!, t);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{...FULL, width: '100%', height: '100%'}} />;
};

const whiteAlpha = (f: number) => {
  if (f < FILL - 6) return 0;
  if (f < CUT) return ss(FILL - 6, CUT - 1, f);
  if (f < FADE0) return 1;
  return 1 - stepQ((f - FADE0) / (T - FADE0), 7);
};

export const PortalOverlay: FC<OverlayProps> = ({f}) => {
  const light = ss(0, 30, f);
  const wA = whiteAlpha(f);
  const flick = 0.92 + 0.08 * Math.sin(f * 1.7);
  return (
    <AbsoluteFill>
      {f < CUT && (
        <>
          {/* purple light spilling over the surroundings */}
          <div
            style={{
              ...FULL,
              mixBlendMode: 'screen',
              background: `radial-gradient(circle at ${PX}px ${PY}px, rgba(250,214,251,${0.55 * light * flick}) 0, rgba(170,61,236,${0.5 * light}) ${80 + 260 * light}px, rgba(110,4,216,${0.28 * light}) ${300 + 1100 * light}px, rgba(110,4,216,0) ${500 + 1500 * light}px)`,
            }}
          />
          <Vortex t={f} />
        </>
      )}
      <div style={{...FULL, background: '#fff', opacity: wA}} />
    </AbsoluteFill>
  );
};

const PortalScene: FC<SceneProps> = ({f, A, B, p}) => {
  const k = ss(0, FILL, f);
  const s = 1 + 0.9 * EASE.in(k);
  const shake = f > 26 && f < FILL ? (1 - (FILL - f) / 18) * 5 : 0;
  const sx = shake * (hash(f, 1) - 0.5) * 2;
  const sy = shake * (hash(f, 2) - 0.5) * 2;
  const q = clamp01((f - CUT) / (T - CUT));
  return (
    <AbsoluteFill>
      {f < CUT && (
        <div style={{...FULL, transformOrigin: `${PX}px ${PY}px`, transform: `translate(${sx}px,${sy}px) scale(${s})`, filter: `brightness(${1 + 0.5 * k}) saturate(${1 + 0.4 * k})`}}>
          <A />
        </div>
      )}
      {f >= CUT && (
        <div style={{...FULL, transform: `scale(${1.07 - 0.07 * EASE.out(q)})`, filter: `brightness(${1 + 0.35 * (1 - EASE.out(q))})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <PortalOverlay p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const portalWhiteoutDef: MDef = {
  frames: T,
  Scene: PortalScene,
  Overlay: PortalOverlay,
  cues: [
    {at: 0, src: 'mc:fire/ignite', volume: 0.3, rate: 0.8},
    {at: 8, src: 'mc:portal/travel', volume: 0.35},
  ],
};

export const portalWhiteoutPair = {A: plate('camp', {camera: 'static'}), B: plate('forest-day')};

export const portalWhiteoutEntry = mEntry(
    portalWhiteoutDef,
    {
      id: 'mcd-t-portal-whiteout',
      name: '地下城·传送门白闪',
      tags: ['地下城', '转场', '传送门', '白闪', '章节切换'],
      blurb: '营地的黑曜石传送门亮起，紫色像素涡旋从门里涌出、照亮周围黑石并越转越亮，镜头推进、轻微震动，最后整屏白闪，B 从白里分 7 级淡出。',
      usage: '进入下一章/下一关、片头到正片、"穿越"类梗；A 画面里最好有传送门或光源（可改 px/py 指定涡旋出发点）。',
      params: [
        {name: 'PX / PY', desc: 'portalWhiteout.tsx 顶部：涡旋出发点在 A 画面里的屏幕坐标'},
        {name: 'FILL / CUT / FADE0', desc: '涡旋铺满帧、切到 B 的帧、白色开始退去的帧'},
      ],
    },
    portalWhiteoutPair.A,
    portalWhiteoutPair.B,
  );
