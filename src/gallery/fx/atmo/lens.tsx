import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Noise, Stage, W, H, cornerEllipse, curveStops, ease, hash, lerp, rgba, smooth, type RGB} from './common';

/**
 * Lens and film layers: lens flare, retro film, speed lines. All overlays are transparent.
 */

/* ------------------------------------------------------------------ lens flare */

const GHOSTS: {k: number; size: number; col: RGB; a: number; rot: number; hollow: boolean}[] = [
  {k: 0.32, size: 120, col: [120, 225, 255], a: 0.55, rot: 0, hollow: false},
  {k: 0.58, size: 76, col: [255, 140, 230], a: 0.5, rot: 45, hollow: true},
  {k: 0.9, size: 190, col: [255, 226, 130], a: 0.34, rot: 0, hollow: true},
  {k: 1.2, size: 96, col: [140, 255, 200], a: 0.46, rot: 45, hollow: false},
  {k: 1.55, size: 250, col: [255, 170, 110], a: 0.26, rot: 0, hollow: true},
  {k: 1.9, size: 64, col: [190, 170, 255], a: 0.5, rot: 0, hollow: false},
  {k: 2.3, size: 140, col: [255, 255, 255], a: 0.22, rot: 45, hollow: true},
];

/**
 * atm-lens-flare: a sun glides across the lens and drags a flare: block-shaped ghosts (hollow and filled, stepped halos) along the optical
 * axis in cyan / magenta / gold, a pixel-stepped star with long cross spikes, an anamorphic streak, a diamond frame and a warm veil.
 * Props: from / to ({x,y} px start and end of the sun's path), start / dur (frames), strength (0..1), tint (core colour, 'r,g,b').
 */
export const LensFlare: FC<{from?: {x: number; y: number}; to?: {x: number; y: number}; start?: number; dur?: number; strength?: number; frames?: number}> = ({
  from = {x: -140, y: 70},
  to = {x: 2060, y: 360},
  start = 6,
  dur = 136,
  strength = 1,
  frames = 150,
}) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, (f - start) / dur));
  const e = ease.inOut(t) * 0.85 + t * 0.15;
  const sx = lerp(from.x, to.x, e);
  const sy = lerp(from.y, to.y, e) + Math.sin(e * Math.PI) * 34;
  const cx = W / 2;
  const cy = H / 2;
  const vx = cx - sx;
  const vy = cy - sy;
  const dist = Math.hypot(vx, vy);
  // intensity: in at the start, out at the end, and strongest when the sun is inside the frame
  const inside = smooth(-200, 260, sx) * (1 - smooth(W - 260, W + 200, sx));
  const I = Math.min(1.25, strength * 1.35) * smooth(0, 14, f) * (1 - smooth(frames - 20, frames, f)) * (0.25 + 0.75 * inside);
  const pulse = 0.92 + 0.08 * Math.sin(f * 0.4);
  const stepGlow = (x: number, y: number, size: number, col: RGB, a: number) =>
    [0, 1, 2, 3].map((i) => (
      <div key={i} style={{position: 'absolute', left: x - (size * (1 + i * 0.55)) / 2, top: y - (size * (1 + i * 0.55)) / 2, width: size * (1 + i * 0.55), height: size * (1 + i * 0.55), background: rgba(col, (a * (i === 0 ? 1 : 0.34 / i)) as number)}} />
    ));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* veiling glare */}
      <AbsoluteFill style={{background: `radial-gradient(circle 1500px at ${sx}px ${sy}px, ${rgba([255, 236, 200], 0.5 * I * pulse)} 0%, ${rgba([255, 214, 150], 0.2 * I)} 45%, ${rgba([255, 200, 120], 0)} 100%)`}} />
      {/* square-cut frame (a diamond) centred on the lens axis, instead of a round halo */}
      <div style={{position: 'absolute', left: cx - dist * 0.65, top: cy - dist * 0.65, width: dist * 1.3, height: dist * 1.3, transform: 'rotate(45deg)', border: `${16 + Math.round(I * 2) * 4}px solid ${rgba([255, 205, 130], 0.2 * I)}`}} />
      {/* anamorphic streak */}
      <div style={{position: 'absolute', left: sx - 1500, top: sy - 6, width: 3000, height: 12, background: `linear-gradient(to right, ${rgba([120, 190, 255], 0)}, ${rgba([160, 215, 255], 0.55 * I)} 40%, ${rgba([255, 255, 255], 0.9 * I)} 50%, ${rgba([160, 215, 255], 0.55 * I)} 60%, ${rgba([120, 190, 255], 0)})`, filter: 'blur(1.2px)'}} />
      <div style={{position: 'absolute', left: sx - 900, top: sy - 22, width: 1800, height: 44, background: `linear-gradient(to right, ${rgba([90, 150, 255], 0)}, ${rgba([120, 180, 255], 0.16 * I)} 50%, ${rgba([90, 150, 255], 0)})`, filter: 'blur(10px)'}} />
      {/* ghosts */}
      {GHOSTS.map((g, i) => {
        const gx = sx + vx * g.k;
        const gy = sy + vy * g.k;
        const near = 1 - Math.min(1, Math.abs(g.k - 1) * 0.35);
        const a = Math.min(1, g.a * 1.6 * I * (0.6 + 0.4 * near)) * (0.85 + 0.15 * Math.sin(f * 0.2 + i));
        const sz = g.size * (0.9 + 0.2 * (dist / 1100));
        return g.hollow ? (
          <div key={i} style={{position: 'absolute', left: gx - sz / 2, top: gy - sz / 2, width: sz, height: sz, transform: `rotate(${g.rot}deg)`, border: `${Math.max(6, sz / 14)}px solid ${rgba(g.col, a)}`, background: `radial-gradient(circle, ${rgba(g.col, 0)} 40%, ${rgba(g.col, a * 0.32)} 100%)`, boxShadow: `0 0 0 ${Math.round(sz / 10 / 6) * 6}px ${rgba(g.col, a * 0.18)}`, boxSizing: 'border-box'}} />
        ) : (
          <div key={i} style={{position: 'absolute', left: gx - sz / 2, top: gy - sz / 2, width: sz, height: sz, transform: `rotate(${g.rot}deg)`, background: `radial-gradient(circle, ${rgba(g.col, a * 0.9)} 0%, ${rgba(g.col, a * 0.5)} 60%, ${rgba(g.col, a * 0.12)} 100%)`, boxShadow: `0 0 0 12px ${rgba(g.col, a * 0.22)}, 0 0 0 24px ${rgba(g.col, a * 0.1)}`}} />
        );
      })}
      {/* star: stepped glow + cross spikes */}
      {stepGlow(sx, sy, 120, [255, 245, 215], 0.5 * I)}
      <div style={{position: 'absolute', left: sx - 36, top: sy - 36, width: 72, height: 72, background: rgba([255, 255, 255], Math.min(1, I))}} />
      <div style={{position: 'absolute', left: sx - 900, top: sy - 6, width: 1800, height: 12, background: `linear-gradient(to right, rgba(255,255,255,0), ${rgba([255, 250, 230], 0.95 * I)} 50%, rgba(255,255,255,0))`}} />
      <div style={{position: 'absolute', left: sx - 6, top: sy - 700, width: 12, height: 1400, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${rgba([255, 250, 230], 0.9 * I)} 50%, rgba(255,255,255,0))`}} />
      {[45, -45].map((r) => (
        <div key={r} style={{position: 'absolute', left: sx - 480, top: sy - 4, width: 960, height: 8, transform: `rotate(${r + Math.sin(f * 0.05) * 3}deg)`, background: `linear-gradient(to right, rgba(255,230,180,0), ${rgba([255, 226, 170], 0.6 * I)} 50%, rgba(255,230,180,0))`}} />
      ))}
      {/* pixel sparkles around the core */}
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + f * 0.01;
        const r = 70 + hash(i, 4) * 150;
        const tw = Math.max(0, Math.sin(f * 0.25 + i * 1.7));
        return <div key={i} style={{position: 'absolute', left: Math.round((sx + Math.cos(a) * r) / 4) * 4, top: Math.round((sy + Math.sin(a) * r) / 4) * 4, width: 8, height: 8, background: rgba([255, 244, 200], I * tw)}} />;
      })}
    </AbsoluteFill>
  );
};

const LensFlareDemo: FC = () => (
  <>
    <Stage plate="A" />
    <LensFlare />
  </>
);

/* ------------------------------------------------------------------ retro film */

/**
 * RetroFilmWrap: wraps footage with the parts only the picture itself can have: gate weave (stepped 12 fps jitter), a slight RGB split,
 * softening, warm tone and flicker. Put the RetroFilm overlay on top. children are rendered once.
 */
export const RetroFilmWrap: FC<{amount?: number; children: ReactNode}> = ({amount = 1, children}) => {
  const f = useCurrentFrame();
  const step = Math.floor(f / 2);
  const jx = (hash(step, 1) - 0.5) * 5 * amount;
  const jy = (hash(step, 2) - 0.5) * 4 * amount;
  const flick = 1 + (hash(f, 3) - 0.5) * 0.09 * amount + (hash(Math.floor(f / 7), 4) - 0.5) * 0.06 * amount;
  const split = 3.2 * amount;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="film-ca" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={-split} dy="0" result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={split} dy="0" result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
          <feGaussianBlur in="rgb" stdDeviation="0.55" />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `translate(${jx}px, ${jy}px) scale(1.012)`, filter: `url(#film-ca) sepia(${0.28 * amount}) saturate(${1 - 0.18 * amount}) contrast(${1 + 0.08 * amount}) brightness(${flick})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * atm-retro-film: old film look as an overlay: grain, scanlines with a slow rolling band, warm dark rim vignette, red/cyan edge fringes
 * (a stand-in for chromatic aberration), light leaks, dust, hairs and vertical scratches, and a flicker. Pair it with <RetroFilmWrap> around
 * the footage for the real RGB split and gate weave.
 * Props: grain (0..1), scan (0..1 scanlines), vignette (0..1), leaks (0..1), dirt (0..1 dust and scratches), flicker (0..1),
 *        leakAt ([frame, frame] centres of the two light leaks, default [44, 112]).
 */
export const RetroFilm: FC<{grain?: number; scan?: number; vignette?: number; leaks?: number; dirt?: number; flicker?: number; leakAt?: [number, number]}> = ({grain = 1, scan = 1, vignette = 1, leaks = 1, dirt = 1, flicker = 1, leakAt = [44, 112]}) => {
  const f = useCurrentFrame();
  const flick = (hash(f, 21) - 0.5) * 0.1 * flicker + (hash(Math.floor(f / 6), 22) - 0.5) * 0.06 * flicker;
  const leak = (c: number, w: number) => Math.max(0, 1 - Math.abs(f - c) / w);
  const L1 = leak(leakAt[0], 30) * leaks;
  const L2 = leak(leakAt[1], 26) * leaks;
  const bandY = ((f * 7) % (H + 500)) - 300;
  return (
    <AbsoluteFill>
      {/* warm cast */}
      <AbsoluteFill style={{background: 'rgba(130,86,34,0.09)'}} />
      {/* flicker */}
      <AbsoluteFill style={{background: flick > 0 ? `rgba(255,244,220,${flick.toFixed(3)})` : `rgba(0,0,0,${(-flick * 1.4).toFixed(3)})`}} />
      {/* rim vignette, sepia-dark */}
      <AbsoluteFill style={{background: `radial-gradient(${cornerEllipse()}, ${curveStops([22, 10, 2], 0.82 * vignette, 0.4, 1, 1.6)})`}} />
      {/* edge fringes */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 90, background: `linear-gradient(to right, rgba(255,40,60,${0.16 * scan + 0.04}), rgba(255,40,60,0))`}} />
      <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 90, background: `linear-gradient(to left, rgba(40,220,255,${0.16 * scan + 0.04}), rgba(40,220,255,0))`}} />
      {/* scanlines + rolling band */}
      <AbsoluteFill style={{opacity: scan, background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: bandY, height: 260, background: `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,244,230,${0.07 * scan}) 50%, rgba(255,255,255,0))`}} />
      {/* light leaks */}
      <div style={{position: 'absolute', left: -300, top: -200, width: 1100, height: 1500, background: `radial-gradient(ellipse closest-side, rgba(255,120,30,${(0.55 * L1).toFixed(3)}), rgba(255,170,60,${(0.22 * L1).toFixed(3)}) 55%, rgba(255,170,60,0))`}} />
      <div style={{position: 'absolute', right: -380, top: 200, width: 1000, height: 1300, background: `radial-gradient(ellipse closest-side, rgba(255,70,50,${(0.5 * L2).toFixed(3)}), rgba(255,150,60,${(0.2 * L2).toFixed(3)}) 55%, rgba(255,150,60,0))`}} />
      {/* grain */}
      <Noise amount={0.3 * grain} scale={2} mono seed={31} />
      {/* dust, hairs, scratches: each lives 1-3 frames */}
      {dirt > 0 &&
        Array.from({length: 14}, (_, i) => {
          const per = 3 + Math.floor(hash(i, 40) * 2);
          const slot = Math.floor(f / per);
          if (hash(slot, i, 41) > 0.5 * dirt) return null;
          const x = hash(slot, i, 42) * W;
          const y = hash(slot, i, 43) * H;
          const kind = i % 3;
          if (kind === 0) {
            const hgt = 300 + hash(slot, i, 44) * 700;
            return <div key={i} style={{position: 'absolute', left: Math.round(x), top: hash(slot, i, 45) * (H - hgt), width: hash(slot, i, 46) < 0.5 ? 2 : 3, height: hgt, background: 'rgba(255,248,230,0.34)'}} />;
          }
          if (kind === 1) {
            const s = 6 + Math.floor(hash(slot, i, 47) * 14);
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s * 0.7, borderRadius: '50%', background: hash(slot, i, 48) < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,250,235,0.55)'}} />;
          }
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 70 + hash(slot, i, 49) * 90, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.38)', transform: `rotate(${hash(slot, i, 50) * 180}deg)`}} />;
        })}
    </AbsoluteFill>
  );
};

const RetroFilmDemo: FC = () => (
  <>
    <RetroFilmWrap>
      <Stage plate="A" />
    </RetroFilmWrap>
    <RetroFilm />
  </>
);

/* ------------------------------------------------------------------ speed lines */

/**
 * atm-speed-lines: manga-style radial speed lines. Tapered wedges that start at a clear ring and run off the screen, redrawn every 2 frames
 * so they boil, in a long set and a hairline set, with a soft white burst at the rim.
 * Props: intensity (0..1, number of lines and how deep they reach), cx / cy (centre 0..1), inner (clear radius px), color ('r,g,b'), lines (base count).
 *        Animate `intensity` over time for dash-in / dash-out.
 */
export const SpeedLines: FC<{intensity?: number; cx?: number; cy?: number; inner?: number; color?: RGB; lines?: number}> = ({intensity = 1, cx = 0.5, cy = 0.5, inner = 360, color = [255, 255, 255], lines = 92}) => {
  const f = useCurrentFrame();
  const step = Math.floor(f / 2);
  const x0 = cx * W;
  const y0 = cy * H;
  const R = 3000;
  const I = Math.max(0, Math.min(1.2, intensity));
  const n = Math.round(lines * Math.min(1, 0.35 + I * 0.7));
  const wedge = (i: number, seed: number, inn: number, wMul: number, a: string) => {
    const ang = (i / n) * Math.PI * 2 + (hash(i, step, seed) - 0.5) * (Math.PI * 2) / n * 0.8;
    const r0 = inn * (0.85 + hash(i, step, seed + 1) * 0.7) * (1 - 0.35 * Math.min(1, I));
    const w = (0.004 + Math.pow(hash(i, step, seed + 2), 2) * 0.03) * wMul * (0.5 + I * 0.7);
    const tip = [x0 + Math.cos(ang) * r0, y0 + Math.sin(ang) * r0];
    const b1 = [x0 + Math.cos(ang - w) * R, y0 + Math.sin(ang - w) * R];
    const b2 = [x0 + Math.cos(ang + w) * R, y0 + Math.sin(ang + w) * R];
    return <polygon key={`${seed}-${i}`} points={`${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${b1[0].toFixed(1)},${b1[1].toFixed(1)} ${b2[0].toFixed(1)},${b2[1].toFixed(1)}`} fill={`rgba(${color.join(',')},${a})`} />;
  };
  return (
    <AbsoluteFill>
      {/* soft white burst at the rim */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 120% 110% at ${cx * 100}% ${cy * 100}%, rgba(${color.join(',')},0) ${inner / 14}%, rgba(${color.join(',')},${(0.3 * I).toFixed(3)}) 100%)`}} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id="sl-fade" gradientUnits="userSpaceOnUse" cx={x0} cy={y0} r={1500}>
            <stop offset="0.2" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="1" />
          </radialGradient>
          <mask id="sl-mask">
            <rect width={W} height={H} fill="url(#sl-fade)" />
          </mask>
        </defs>
        <g mask="url(#sl-mask)" opacity={Math.min(1, I * 1.3)}>
          {Array.from({length: n}, (_, i) => wedge(i, 3, inner, 1, (0.78 + hash(i, step, 9) * 0.22).toFixed(2)))}
          {Array.from({length: Math.round(n * 0.9)}, (_, i) => wedge(i, 17, inner * 0.78, 0.22, (0.5 + hash(i, step, 19) * 0.3).toFixed(2)))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Dash in, hold with a little shimmer, dash out. */
export const SpeedLinesDash: FC = () => {
  const f = useCurrentFrame();
  const inn = smooth(6, 20, f);
  const out = 1 - smooth(106, 136, f);
  return <SpeedLines intensity={inn * out * (1 + 0.08 * Math.sin(f * 0.7) * inn)} />;
};

const SpeedDemo: FC = () => {
  const f = useCurrentFrame();
  const inn = smooth(6, 20, f);
  const out = 1 - smooth(106, 136, f);
  const zoom = 1 + 0.07 * ease.out(Math.min(1, Math.max(0, (f - 8) / 30))) * out;
  return (
    <>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <Stage plate="A" />
      </AbsoluteFill>
      <SpeedLinesDash />
    </>
  );
};

/* ------------------------------------------------------------------ entries */

export const lensEntries: FxEntry[] = [
  {
    meta: {
      id: 'atm-lens-flare',
      name: '镜头光斑',
      category: 'atmosphere',
      tags: ['光斑', '镜头', '太阳', '星芒', '电影感', '透明层'],
      frames: 150,
      blurb: '太阳从画面左上滑向右侧，沿镜头光轴拖出方块感光斑（青/洋红/金的空心与实心块、阶梯光晕）、十字星芒、横向变形拉丝、环形光晕和暖色眩光。',
      usage: '日出日落、仰拍太阳、英雄镜头、片头片尾的电影感点缀。',
      params: [
        {name: 'from / to', desc: '太阳路径的起点与终点 {x, y} px'},
        {name: 'start / dur / frames', desc: '开始帧 / 滑动帧数 / 总帧数（决定淡入淡出）'},
        {name: 'strength', desc: '整体强度 0..1'},
      ],
    },
    Demo: LensFlareDemo,
    Layer: () => <LensFlare />,
  },
  {
    meta: {
      id: 'atm-retro-film',
      name: '复古胶片',
      category: 'atmosphere',
      tags: ['胶片', '复古', '颗粒', '扫描线', '色散', '怀旧', '透明层'],
      frames: 150,
      blurb: '老胶片质感：颗粒、扫描线与缓慢滚动的亮带、暖褐边缘暗角、红青边缘色散、漏光、灰尘划痕与闪烁；包裹画面时再加画面抖动和 RGB 色散。',
      usage: '回忆、老录像、历史片段、怀旧风格；也可低强度全程使用增加质感。',
      params: [
        {name: 'grain / scan / vignette', desc: '颗粒 / 扫描线 / 暗角强度 0..1'},
        {name: 'leaks / dirt / flicker', desc: '漏光 / 灰尘划痕 / 闪烁强度 0..1'},
        {name: 'RetroFilmWrap amount', desc: '包住画面的色散 + 抖动 + 暖调强度（Layer 本身无法位移画面）'},
      ],
    },
    Demo: RetroFilmDemo,
    Layer: () => <RetroFilm />,
  },
  {
    meta: {
      id: 'atm-speed-lines',
      name: '速度线',
      category: 'atmosphere',
      tags: ['速度线', '漫画', '冲刺', '高潮', '放射线', '透明层'],
      frames: 150,
      blurb: '漫画式放射速度线：从中心空环向外扩散的锐利楔形长线加发丝细线，每两帧重绘产生“沸腾”感，边缘带白色爆光；Demo 里画面同时推近。',
      usage: '冲刺、高速移动、爆发瞬间、搞笑夸张的高潮点。',
      params: [
        {name: 'intensity', desc: '强度 0..1，随时间动画即可做冲入/冲出'},
        {name: 'cx / cy', desc: '放射中心（0..1）'},
        {name: 'inner', desc: '中心空白半径 px'},
        {name: 'color', desc: "线条颜色 [r,g,b]，默认白；深色背景可用 [255,230,120]"},
        {name: 'lines', desc: '基础线条数量'},
      ],
    },
    Demo: SpeedDemo,
    Layer: () => <SpeedLinesDash />,
  },
];
