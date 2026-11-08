// mcd-t-black-cut: the Dungeons "start mission" transition, made cinematic.
//   A: the frame pushes in 5%, loses colour, the vignette closes and it crushes to black (16 frames, ease-out) -> 6 frames of pure black
//   -> hard cut to B, which comes up from black: exposure rises (with a small overshoot), the camera settles from 0.95 to 1.0, vignette opens.
//   Layer (transparent) = the black / vignette envelope only.   Scene props: A, B.
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, lerp, plate, ss, type MDef, type OverlayProps, type SceneProps, mEntry} from './common';

const DARK = 16; // A crushes to black
const CUT = 21; // hard cut frame (relative to the body start)
const SETTLE = 24; // B settle length
const T = CUT + SETTLE;

const vig = (open: number, strength: number) =>
  `radial-gradient(ellipse 78% 82% at 50% 47%, rgba(0,0,0,0) ${Math.round(open)}%, rgba(0,0,0,${strength.toFixed(3)}) 100%)`;

const BAR = 70; // cinema bars close in with the crush and open again as B settles
const Bars: FC<{h: number}> = ({h}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000'}} />
  </>
);

export const BlackCutOverlay: FC<OverlayProps> = ({f}) => {
  if (f < CUT) {
    const t = clamp01(f / DARK);
    const d = 1 - Math.pow(1 - t, 1.35);
    const solid = f >= DARK ? 1 : ss(0.35, 1, t);
    return (
      <AbsoluteFill>
        <div style={{...FULL, background: vig(62 - 62 * d, 0.3 + 0.7 * d)}} />
        <Bars h={BAR * d} />
        <div style={{...FULL, background: '#000', opacity: solid}} />
      </AbsoluteFill>
    );
  }
  const q = clamp01((f - CUT) / SETTLE);
  const e = EASE.out(q);
  return (
    <AbsoluteFill>
      <div style={{...FULL, background: vig(10 + 52 * e, 0.92 * (1 - e) + 0.08)}} />
      <Bars h={BAR * (1 - EASE.out(clamp01(q * 1.25)))} />
    </AbsoluteFill>
  );
};

const BlackCutScene: FC<SceneProps> = ({f, A, B, p}) => {
  const Ov = BlackCutOverlay;
  const d = 1 - Math.pow(1 - clamp01(f / DARK), 1.35);
  const q = clamp01((f - CUT) / SETTLE);
  const e = EASE.out(q);
  const exposure = lerp(0.2, 1, e) + 0.09 * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (1 - q);
  return (
    <AbsoluteFill>
      {f < CUT && (
        <div style={{...FULL, filter: `brightness(${1 - 0.86 * d}) saturate(${1 - 0.45 * d}) contrast(${1 + 0.18 * d})`, transform: `scale(${1 + 0.05 * d})`}}>
          <A />
        </div>
      )}
      {f >= CUT && (
        <div style={{...FULL, filter: `brightness(${exposure}) saturate(${lerp(0.7, 1, e)})`, transform: `scale(${lerp(0.95, 1, e)})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <Ov p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const blackCutDef: MDef = {
  frames: T,
  Scene: BlackCutScene,
  Overlay: BlackCutOverlay,
  cues: [
    {at: CUT, src: 'mc:block/chest/close1', volume: 0.3, rate: 0.75},
  ],
};

export const blackCutPair = {A: plate('forest-day'), B: plate('camp')};

export const blackCutEntry = mEntry(
    blackCutDef,
    {
      id: 'mcd-t-black-cut',
      name: '地下城·压黑硬切',
      tags: ['地下城', '转场', '压黑', '硬切', '电影感'],
      blurb: '画面推近 5% 并褪色，暗角收紧压成纯黑，停顿 6 帧后硬切到下一镜；新画面从黑里带着曝光回升与推近落定。',
      usage: '章节切换、进入关卡、"开始任务"式的镜头衔接；最克制也最像地下城的转场，几乎任何画面之间都能用。',
      params: [
        {name: 'A / B', desc: '转场前后两个画面（任意 FC）；Layer 导出时只有黑场与暗角包络，叠在真实素材上使用'},
        {name: 'DARK / CUT / SETTLE', desc: 'blackCut.tsx 顶部常量：压黑帧数 16、硬切帧 21、落定帧数 24'},
      ],
    },
    blackCutPair.A,
    blackCutPair.B,
  );
