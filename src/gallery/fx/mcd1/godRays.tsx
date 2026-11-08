// mcd-t-god-rays: a wall of golden volumetric light (god-ray shafts + bloom + warm haze) sweeps across the frame from the left. The slanted
//   leading edge is the cut line: left of it is B (coming out of the glare, 1.25x exposure and 1.04x push settling), right of it is A.
//   Shafts lean 12 degrees like the desert-temple screenshots (gold #e2ae4b), gold dust motes ride the front. Layer = the light only.
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, hash, lerp, mEntry, plate, ss, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 56;
const LEAN = Math.tan((12 * Math.PI) / 180);
const GOLD = '226,174,75';
const HI = '255,240,176';

const edgeX = (t: number) => {
  const u = clamp01(t / T);
  return lerp(-760, 2520, 0.5 * u + 0.5 * EASE.inOut(u));
};

const Shafts: FC<{x: number; fade: number}> = ({x, fade}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 1250,
      top: -40,
      width: 1500,
      height: 1160,
      transform: `skewX(12deg)`,
      transformOrigin: '0 0',
      mixBlendMode: 'screen',
      opacity: fade,
      WebkitMaskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 52%, #000 90%, rgba(0,0,0,0) 100%)',
    }}
  >
    {Array.from({length: 17}, (_, i) => {
      const w = 22 + hash(i, 1, 5) * 96;
      const left = (i / 17) * 1450 + hash(i, 2, 5) * 50;
      const a = 0.28 + hash(i, 3, 5) * 0.55;
      return <div key={i} style={{position: 'absolute', left, top: 0, width: w, height: '100%', opacity: a, filter: 'blur(5px)', background: `linear-gradient(180deg, rgba(${HI},0.95) 0%, rgba(${GOLD},0.55) 55%, rgba(${GOLD},0) 100%)`}} />;
    })}
  </div>
);

export const GodRaysOverlay: FC<OverlayProps> = ({f}) => {
  const t = f;
  const x = edgeX(t);
  const bell = Math.sin(Math.PI * clamp01(t / T));
  const fadeOut = 1 - ss(T - 12, T, t);
  const bandW = 760;
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      {/* warm haze pushed in front of the edge (over A) and dragged behind it (over B) */}
      <div style={{position: 'absolute', left: x - 1300, top: 0, width: 2000, height: 1080, transform: 'skewX(12deg)', transformOrigin: '0 0', mixBlendMode: 'screen', background: `linear-gradient(90deg, rgba(${GOLD},0) 0%, rgba(${GOLD},0.34) 55%, rgba(${HI},0.55) 64.5%, rgba(${GOLD},0.28) 78%, rgba(${GOLD},0) 100%)`}} />
      <Shafts x={x} fade={0.95} />
      {/* the glare band itself */}
      <div style={{position: 'absolute', left: x - bandW / 2, top: -40, width: bandW, height: 1160, transform: 'skewX(12deg)', transformOrigin: '0 0', mixBlendMode: 'screen', background: `linear-gradient(90deg, rgba(${GOLD},0) 0%, rgba(${GOLD},0.5) 30%, rgba(255,250,224,0.98) 49%, rgba(255,250,224,0.98) 51%, rgba(${GOLD},0.5) 70%, rgba(${GOLD},0) 100%)`, filter: 'blur(10px)'}} />
      {/* screen-wide bloom lift while the band crosses */}
      <div style={{...FULL, background: `radial-gradient(ellipse 90% 80% at ${Math.round((x / 1920) * 100)}% 40%, rgba(${HI},${0.45 * bell}), rgba(${GOLD},${0.18 * bell}) 60%, rgba(${GOLD},0))`, mixBlendMode: 'screen'}} />
      {/* dust motes riding the front */}
      {Array.from({length: 38}, (_, i) => {
        const y = hash(i, 1, 8) * 1080;
        const dx = (hash(i, 2, 8) - 0.62) * 1000 + Math.sin(t * 0.12 + i) * 18 + t * (1.5 + hash(i, 3, 8) * 3);
        const q = hash(i, 4, 8) > 0.6 ? 12 : 8;
        const px = Math.round((x + y * LEAN + dx) / 4) * 4;
        const py = Math.round((y - t * (1 + hash(i, 5, 8) * 2)) / 4) * 4;
        const a = (0.4 + 0.6 * Math.abs(Math.sin(t * 0.3 + i * 2.1))) * (1 - Math.abs(dx) / 620);
        if (a <= 0) return null;
        return <div key={i} style={{position: 'absolute', left: px, top: py, width: q, height: q, background: i % 3 ? '#FFE9A0' : '#FFFFFF', opacity: Math.max(0, a)}} />;
      })}
    </AbsoluteFill>
  );
};

const GodRaysScene: FC<SceneProps> = ({f, A, B, p}) => {
  const x = edgeX(f);
  const clip = `polygon(0px 0px, ${x}px 0px, ${x + 1080 * LEAN}px 1080px, 0px 1080px)`;
  const k = clamp01(f / T);
  return (
    <AbsoluteFill>
      {p < 1 && (
        <div style={{...FULL, filter: `brightness(${1 + 0.18 * Math.sin(Math.PI * k)}) sepia(${0.22 * Math.sin(Math.PI * k)})`}}>
          <A />
        </div>
      )}
      {p > 0 && (
        <div style={{...FULL, clipPath: p >= 1 ? undefined : clip, transform: `scale(${lerp(1.045, 1, EASE.out(k))})`, filter: `brightness(${lerp(1.28, 1, EASE.out(k))})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <GodRaysOverlay p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const godRaysDef: MDef = {
  frames: T,
  Scene: GodRaysScene,
  Overlay: GodRaysOverlay,
  cues: [
    {at: 22, src: 'mc:random/orb', volume: 0.14, rate: 0.6},
  ],
};

export const godRaysPair = {A: plate('snow'), B: plate('desert')};

export const godRaysEntry = mEntry(
  godRaysDef,
  {
    id: 'mcd-t-god-rays',
    name: '地下城·金色体积光扫过',
    tags: ['地下城', '转场', '体积光', 'god rays', '泛光', '暖光'],
    blurb: '一道斜 12 度的金色光墙带着体积光束、泛光与暖雾从左向右扫过，光墙的前沿就是切换线，光里升起金色尘粒；B 从强光里带着推近落定。',
    usage: '进入神殿/日出/"光明降临"类场景、从冷色画面切到暖色画面；Layer 导出后可只叠光，在光最亮的那几帧手动剪切。',
    params: [
      {name: 'T / LEAN', desc: 'godRays.tsx 顶部：扫过帧数 56、光束倾角 12°'},
      {name: 'GOLD / HI', desc: '光束主色 #e2ae4b 与高光色'},
    ],
  },
  godRaysPair.A,
  godRaysPair.B,
);
