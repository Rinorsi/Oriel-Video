// mcd-t-chest-beam: a chest rattles on a dimmed, defocused shot, the lid flips and a magenta (#CD2ECD) beam with a white core bursts out in 6 hard frames,
//   widens to fill the frame, goes white -> hard cut to B, which comes out of the white in 7 stepped fades (chest-open-light-beam.png).
//   Props: the chest is the real ender-chest texture (hue shifted to the Dungeons purple); A / B are free.
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {EASE, clamp01} from '../../../mc/theme';
import {Crop} from '../../mob';
import {FULL, hash, lerp, mEntry, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 60;
const POP = 22; // lid flips, beam starts
const WHITE = 33; // frame is pure white -> cut
const FADE0 = 37;
const CX = 960;
const CHEST_S = 34; // screen px per texel
const CH_W = 14 * CHEST_S;
const CH_BOTTOM = 960;
const BODY_TOP = CH_BOTTOM - 10 * CHEST_S;
const BEAM_W = [64, 150, 300, 560, 1100, 2300];
const MAG = '#CD2ECD';

const CHEST_TINT = 'hue-rotate(80deg) saturate(1.9) brightness(1.55) contrast(1.05)';

const OpenChest: FC<{open: number; glow: number}> = ({open, glow}) => {
  const src = tex('entity/chest/ender.png');
  const s = CHEST_S;
  return (
    <div style={{position: 'relative', width: 14 * s, height: 15 * s}}>
      <Crop src={src} sheet={[64, 64]} rect={[14, 33, 14, 10]} scale={s} style={{position: 'absolute', left: 0, top: 5 * s, filter: CHEST_TINT}} />
      {/* interior seen from the front once the lid is back: a strip of hot light */}
      <div style={{position: 'absolute', left: 0.6 * s, width: 12.8 * s, top: 5 * s - 0.5 * s, height: open * 2.2 * s + glow * 0.6 * s, background: 'linear-gradient(180deg,#fff 0%,#ffd8ff 45%,#CD2ECD 100%)', filter: 'none'}} />
      <Crop src={src} sheet={[64, 64]} rect={[14, 14, 14, 5]} scale={s} style={{position: 'absolute', left: 0, top: 0, transformOrigin: '50% 100%', filter: CHEST_TINT, transform: `translateY(${-open * 2.6 * s}px) scaleY(${1 - 0.62 * open})`}} />
      {open < 0.5 && <div style={{position: 'absolute', left: 6 * s, top: 3.4 * s - open * 3 * s, width: 2 * s, height: 3 * s, background: '#F8D868', boxShadow: `inset ${s * 0.5}px ${s * 0.5}px 0 #FFF2A0, inset -${s * 0.5}px -${s * 0.5}px 0 #B8841C, 0 0 0 ${s * 0.4}px #2A1600`}} />}
    </div>
  );
};

/** Dark plank floor with a rug (CSS 3D plane) under the chest; the shot behind it stays blurred. */
const Floor: FC<{a: number}> = ({a}) => (
  <div style={{position: 'absolute', left: 0, top: 500, width: 1920, height: 580, perspective: 800, perspectiveOrigin: '50% 0%', overflow: 'hidden', opacity: a, WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0, rgba(0,0,0,0.9) 150px, #000 230px)'}}>
    <div
      style={{
        position: 'absolute',
        left: -900,
        top: 0,
        width: 3720,
        height: 1000,
        transformOrigin: '50% 0%',
        transform: 'rotateX(62deg)',
        backgroundImage: `url(${block('dark_oak_planks')})`,
        backgroundSize: '96px 96px',
        imageRendering: 'pixelated',
        filter: 'brightness(0.55) saturate(0.85)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 650,
        top: 30,
        width: 620,
        height: 520,
        transformOrigin: '50% 0%',
        transform: 'rotateX(62deg)',
        background: 'repeating-linear-gradient(45deg, rgba(196,150,66,0) 0 44px, rgba(196,150,66,0.34) 44px 50px), repeating-linear-gradient(-45deg, rgba(196,150,66,0) 0 44px, rgba(196,150,66,0.34) 44px 50px), #2A2034',
        boxShadow: 'inset 0 0 0 30px #1A1222, inset 0 0 0 38px #B08A3E, inset 0 0 0 46px #1A1222, 0 0 0 10px #0A0610',
        imageRendering: 'pixelated',
      }}
    />
  </div>
);

const beamWidth = (f: number) => (f < POP ? 0 : BEAM_W[Math.min(BEAM_W.length - 1, f - POP)]);

const Beam: FC<{f: number}> = ({f}) => {
  const w = beamWidth(f);
  if (w <= 0) return null;
  const fade = 1 - ss(WHITE, WHITE + 6, f);
  if (fade <= 0) return null;
  const topY = BODY_TOP + CHEST_S * 0.5;
  const base = 'linear-gradient(180deg, #000 0, #000 calc(100% - 150px), rgba(0,0,0,0.0) 100%)';
  const col = (ww: number, bg: string, extra = {}) => <div style={{position: 'absolute', left: CX - ww / 2, width: ww, top: -60, height: topY + 60 + 40, background: bg, WebkitMaskImage: base, ...extra}} />;
  const soft = 'linear-gradient(90deg, rgba(205,46,205,0) 0%, rgba(205,46,205,0.75) 16%, #E56DE5 33%, #FFD8FF 44%, #FFFFFF 50%, #FFD8FF 56%, #E56DE5 67%, rgba(205,46,205,0.75) 84%, rgba(205,46,205,0) 100%)';
  return (
    <div style={{...FULL, opacity: fade}}>
      {col(w * 1.8, soft, {opacity: 0.6, filter: 'blur(18px)'})}
      {col(w, soft)}
      {col(w * 0.34, 'linear-gradient(90deg, rgba(255,255,255,0) 0%, #fff 30%, #fff 70%, rgba(255,255,255,0) 100%)', {filter: 'blur(2px)'})}
      <div style={{position: 'absolute', left: CX - Math.min(w, 700) * 0.7, width: Math.min(w, 700) * 1.4, top: topY - 24, height: 70, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.95), rgba(229,109,229,0.55) 45%, rgba(205,46,205,0))'}} />
    </div>
  );
};

const Sparks: FC<{f: number}> = ({f}) => {
  if (f < POP) return null;
  const t = f - POP;
  return (
    <>
      {Array.from({length: 64}, (_, i) => {
        const start = hash(i, 1, 9) * 8;
        const u = t - start;
        if (u < 0) return null;
        const life = 26 + hash(i, 2, 9) * 22;
        if (u > life) return null;
        const vx = (hash(i, 3, 9) - 0.5) * 34;
        const vy = 22 + hash(i, 4, 9) * 38;
        const x = CX + (hash(i, 5, 9) - 0.5) * 220 + vx * u * (1 - u / (life * 2.2));
        const y = BODY_TOP + 10 - vy * u + 0.9 * u * u;
        const q = Math.round((10 + hash(i, 6, 9) * 18) / 4) * 4;
        const a = (1 - u / life) * 0.95;
        const c = i % 4 === 0 ? '#FFFFFF' : i % 4 === 1 ? '#F5B0F5' : '#E56DE5';
        const gx = Math.round(x / 4) * 4;
        const gy = Math.round(y / 4) * 4;
        return (
          <div key={i} style={{position: 'absolute', left: gx, top: gy, width: q, height: q, background: c, opacity: a, boxShadow: `0 0 ${q}px ${MAG}`}}>
            {i % 3 === 0 && <div style={{position: 'absolute', left: -q, top: q / 3, width: q * 3, height: q / 3, background: c}} />}
            {i % 3 === 0 && <div style={{position: 'absolute', top: -q, left: q / 3, height: q * 3, width: q / 3, background: c}} />}
          </div>
        );
      })}
    </>
  );
};

const whiteAlpha = (f: number) => {
  if (f < 27) return 0;
  if (f < WHITE) return ss(27, WHITE, f);
  if (f < FADE0) return 1;
  return 1 - stepQ((f - FADE0) / (T - FADE0), 7);
};

export const ChestBeamOverlay: FC<OverlayProps> = ({f}) => {
  const w = whiteAlpha(f);
  const pink = f < FADE0 ? w : 1 - stepQ((f - FADE0) / (T - FADE0 + 8), 7);
  return (
    <AbsoluteFill>
      <Beam f={f} />
      <Sparks f={f} />
      <div style={{...FULL, background: `radial-gradient(ellipse 70% 80% at 50% 70%, rgba(205,46,205,${0.5 * pink}), rgba(205,46,205,0))`, mixBlendMode: 'screen'}} />
      <div style={{...FULL, background: '#fff', opacity: w}} />
    </AbsoluteFill>
  );
};

const ChestScene: FC<SceneProps> = ({f, A, B, p}) => {
  const dim = ss(0, 10, f);
  const pop = EASE.back(clamp01((f - 2) / 9));
  const rattle = f >= 9 && f < POP ? 1 : 0;
  const jx = rattle ? Math.round((hash(Math.floor(f / 2), 4) - 0.5) * 2 * (3 + (f - 9) * 0.45)) : 0;
  const rot = rattle ? (hash(Math.floor(f / 2), 5) - 0.5) * 3 : 0;
  const open = f < POP ? 0 : EASE.out(clamp01((f - POP) / 3));
  const seam = f >= 16 && f < POP ? ss(16, POP, f) : 0;
  const q = clamp01((f - WHITE) / (T - WHITE));
  return (
    <AbsoluteFill>
      {f < WHITE && (
        <>
          <div style={{...FULL, filter: `brightness(${1 - 0.58 * dim}) blur(${10 * dim}px) saturate(${1 - 0.25 * dim})`, transform: `scale(${1 + 0.06 * dim})`}}>
            <A />
          </div>
          <div style={{...FULL, background: `radial-gradient(ellipse 70% 75% at 50% 62%, rgba(20,6,24,0), rgba(8,2,12,${0.75 * dim}))`}} />
          <Floor a={dim} />
          {open > 0 && (
            <div
              style={{
                ...FULL,
                background: `radial-gradient(ellipse 60% 36% at 50% 90%, rgba(240,140,240,${0.8 * open}), rgba(205,46,205,0) 72%), radial-gradient(ellipse 85% 95% at 50% 55%, rgba(205,46,205,${0.34 * open}), rgba(205,46,205,0) 75%)`,
                mixBlendMode: 'screen',
              }}
            />
          )}
          {/* floor shadow of the chest (3 hard steps) */}
          <div style={{position: 'absolute', left: CX - CH_W * 0.62, top: CH_BOTTOM - 30, width: CH_W * 1.24, height: 62, opacity: dim * 0.6}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 18, height: 26, background: '#000'}} />
            <div style={{position: 'absolute', left: 24, right: 24, top: 6, height: 50, background: '#000'}} />
            <div style={{position: 'absolute', left: 60, right: 60, top: 0, height: 62, background: '#000'}} />
          </div>
          <div style={{position: 'absolute', left: CX - CH_W / 2, top: CH_BOTTOM - 15 * CHEST_S, transformOrigin: '50% 100%', transform: `translate(${jx}px,0) rotate(${rot}deg) scale(${0.55 + 0.45 * pop})`, opacity: clamp01(pop * 3)}}>
            <OpenChest open={open} glow={seam} />
            {seam > 0 && <div style={{position: 'absolute', left: 0.4 * CHEST_S, width: 13.2 * CHEST_S, top: 4.8 * CHEST_S, height: 5 + seam * 10, background: '#FFE8FF', boxShadow: `0 0 ${12 + 30 * seam}px ${MAG}`, opacity: seam}} />}
          </div>
        </>
      )}
      {f >= WHITE && (
        <div style={{...FULL, transform: `scale(${lerp(1.07, 1, EASE.out(q))})`, filter: `brightness(${lerp(1.35, 1, EASE.out(q))})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <ChestBeamOverlay p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const chestBeamDef: MDef = {
  frames: T,
  Scene: ChestScene,
  Overlay: ChestBeamOverlay,
  cues: [
    {at: 4, src: 'mc:dig/wood1', volume: 0.3, rate: 0.9},
    {at: 12, src: 'mc:dig/wood1', volume: 0.22, rate: 1.1},
    {at: 17, src: 'mc:dig/wood1', volume: 0.24, rate: 1.25},
    {at: POP - 1, src: 'mc:block/chest/open', volume: 0.5},
    {at: POP + 1, src: 'mc:random/levelup', volume: 0.22, rate: 0.85},
  ],
};

export const chestBeamPair = {A: plate('snow'), B: plate('forest-day')};

export const chestBeamEntry = mEntry(
  chestBeamDef,
  {
    id: 'mcd-t-chest-beam',
    name: '地下城·品红光柱冲屏',
    tags: ['地下城', '转场', '宝箱', '光柱', '白闪', '开箱'],
    blurb: '背景虚化压暗，紫色宝箱抖动后掀盖，品红光柱(#CD2ECD、白核)在 6 帧内冲出并扩满屏幕，转白后硬切到 B，B 从白里分 7 级淡出。',
    usage: '"揭晓/开箱/获得新东西"之前的转场，把观众的视线引到下一镜；重磅内容公布、抽奖、成品展示。',
    params: [
      {name: 'CHEST_S / CX / CH_BOTTOM', desc: 'chestBeam.tsx 顶部：宝箱贴图缩放、水平位置、脚底 y'},
      {name: 'POP / WHITE / FADE0', desc: '掀盖冲光帧、全白切换帧、开始退白帧'},
    ],
  },
  chestBeamPair.A,
  chestBeamPair.B,
);
