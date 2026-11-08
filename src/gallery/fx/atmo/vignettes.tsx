import {useMemo} from 'react';
import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PIXEL_FONT} from '../../../mc/fonts';
import {mulberry32} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {HeartRow, Noise, Stage, Tag, W, H, cornerEllipse, curveStops, ease, lerp, mixRgb, rgba, smooth, type RGB} from './common';

/**
 * Vignette family: close (focus), breathe (heartbeat tension), spotlight (moving circular light), letterbox.
 * All layers are transparent: only edges are painted, so the footage underneath stays untouched in the middle.
 */

/* ------------------------------------------------------------------ shared vignette painter */

export type VigTint = {ring: RGB; dark: RGB};
export const VIG_TINTS: Record<'neutral' | 'cold' | 'warm' | 'blood', VigTint> = {
  neutral: {ring: [20, 20, 24], dark: [0, 0, 0]},
  cold: {ring: [26, 78, 170], dark: [1, 7, 22]},
  warm: {ring: [210, 98, 24], dark: [28, 8, 0]},
  blood: {ring: [176, 10, 28], dark: [30, 0, 5]},
};
const mixTint = (a: VigTint, b: VigTint, t: number): VigTint => ({ring: mixRgb(a.ring, b.ring, t), dark: mixRgb(a.dark, b.dark, t)});

/** One frame of vignette. s: 0 = barely there, 1 = tight tunnel. Three stacked radial gradients (tint ring, wide dark, tight dark). */
export const VignetteShape: FC<{s: number; tint: VigTint; cx?: number; cy?: number; ringAmount?: number; dither?: boolean}> = ({s, tint, cx = 0.5, cy = 0.5, ringAmount = 1, dither = true}) => {
  const inner = lerp(0.98, 0.1, s);
  const wide = `radial-gradient(${cornerEllipse(cx, cy)}, ${curveStops(tint.dark, lerp(0.28, 0.6, s), inner * 0.5, 1, 1.8)})`;
  const ring = `radial-gradient(${cornerEllipse(cx, cy)}, ${curveStops(tint.ring, lerp(0.1, 0.62, s) * ringAmount, inner * 0.62, inner * 0.62 + (1 - inner * 0.62) * 0.9, 2.2)})`;
  const tight = `radial-gradient(${cornerEllipse(cx, cy)}, ${curveStops(tint.dark, lerp(0.35, 0.96, s), inner, 1.04, 1.6)})`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: ring}} />
      <AbsoluteFill style={{background: wide}} />
      <AbsoluteFill style={{background: tight}} />
      {dither && <Noise amount={0.05} scale={2} mono seed={5} style={{WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 35%, black 80%)', maskImage: 'radial-gradient(ellipse at center, transparent 35%, black 80%)'}} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 1. vignette close */

/**
 * atm-vignette-close: edges slowly close in (ease in-out with a tiny settle) as the content takes focus.
 * Props: tint / tintTo ('neutral'|'cold'|'warm'|'blood'): colour of the dark rim, cross-faded when tintTo is set;
 *        from / to (0..1 closing amount), start / dur (frames), cx / cy (0..1 focus point), ringAmount (strength of the colour ring).
 */
export const VignetteClose: FC<{
  tint?: keyof typeof VIG_TINTS;
  tintTo?: keyof typeof VIG_TINTS;
  from?: number;
  to?: number;
  start?: number;
  dur?: number;
  cx?: number;
  cy?: number;
  ringAmount?: number;
}> = ({tint = 'cold', tintTo, from = 0.12, to = 0.9, start = 8, dur = 90, cx = 0.5, cy = 0.5, ringAmount = 1}) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, (f - start) / dur));
  // Ease in-out, overshoot 4% and settle, so it feels like a camera pulling focus.
  const e = ease.inOut(t);
  const settle = t >= 1 ? Math.sin((f - start - dur) * 0.5) * Math.exp(-(f - start - dur) / 8) * 0.025 : 0;
  const s = lerp(from, to, e) + settle * (to - from);
  const mixT = tintTo ? smooth(start + dur * 0.15, start + dur * 1.5, f) : 0;
  const tt = tintTo ? mixTint(VIG_TINTS[tint], VIG_TINTS[tintTo], mixT) : VIG_TINTS[tint];
  return <VignetteShape s={s} tint={tt} cx={cx} cy={cy} ringAmount={ringAmount} />;
};

const FocusFrame: FC<{k: number; children: ReactNode}> = ({k, children}) => <AbsoluteFill style={{transform: `scale(${lerp(1, 1.045, k)})`}}>{children}</AbsoluteFill>;

const VignetteCloseDemo: FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <FocusFrame k={ease.inOut(Math.min(1, Math.max(0, (f - 8) / 90)))}>
        <Stage plate="A" />
      </FocusFrame>
      <VignetteClose tint="cold" tintTo="warm" />
    </>
  );
};

/* ------------------------------------------------------------------ 2. vignette breathe */

/** Lub-dub heartbeat envelope for a phase measured in beats (1 beat = one lub + one dub). Returns 0..1. */
export const heartbeat = (phase: number) => {
  const p = phase - Math.floor(phase);
  const pulse = (c: number, tau: number, atk: number) => {
    const d = p - c;
    return d < 0 ? 0 : Math.min(1, d / atk) * Math.exp(-d / tau);
  };
  return Math.min(1, pulse(0, 0.085, 0.04) + 0.62 * pulse(0.3, 0.075, 0.04));
};

/**
 * atm-vignette-breathe: the vignette pulses with a lub-dub heartbeat; edges are blood red. The rhythm can speed up.
 * Props: bpm0 / bpm1 (beats per minute at start / end of the clip), base (0..1 resting closing), depth (extra closing on each beat),
 *        tint (default 'blood'), sound (thump on every lub).
 */
export const beatCount = (f: number, bpm0: number, bpm1: number, n: number) => (f * bpm0) / 1800 + ((bpm1 - bpm0) * f * f) / (2 * Math.max(1, n) * 1800);

export const VignetteBreathe: FC<{bpm0?: number; bpm1?: number; base?: number; depth?: number; tint?: keyof typeof VIG_TINTS; frames?: number; sound?: boolean}> = ({
  bpm0 = 66,
  bpm1 = 128,
  base = 0.5,
  depth = 0.4,
  tint = 'blood',
  frames = 180,
  sound = true,
}) => {
  const f = useCurrentFrame();
  const phase = beatCount(f, bpm0, bpm1, frames);
  const b = heartbeat(phase);
  // Rest level creeps up as the pulse speeds up (tension builds).
  const creep = (f / frames) * 0.12;
  const s = base + creep + depth * b;
  // Thumps: every whole beat, and a softer one at +0.3.
  const thumps = useMemo(() => {
    const out: {at: number; v: number}[] = [];
    let last = -1;
    for (let fr = 0; fr < frames; fr++) {
      const k = Math.floor(beatCount(fr, bpm0, bpm1, frames));
      if (k !== last) {
        out.push({at: fr, v: 0.55});
        last = k;
      }
    }
    return out;
  }, [bpm0, bpm1, frames]);
  return (
    <>
      <VignetteShape s={Math.min(1, s)} tint={VIG_TINTS[tint]} ringAmount={1 + b * 0.6} />
      {/* a faint red wash on each beat, strongest at the rim */}
      <AbsoluteFill style={{background: `radial-gradient(${cornerEllipse()}, ${curveStops([200, 20, 30], 0.2 * b, 0.45, 1, 2)})`}} />
      {sound && thumps.map((t) => <Sfx key={t.at} at={t.at} src={mcSound('dig/stone1')} volume={t.v * 0.55} rate={0.45} cut={12} />)}
    </>
  );
};

const VignetteBreatheDemo: FC = () => {
  const f = useCurrentFrame();
  const b = heartbeat(beatCount(f, 66, 128, 180));
  return (
    <>
      <Stage plate="A" />
      <div style={{position: 'absolute', left: 612, top: 880, transform: `translateY(${-b * 6}px) scale(${1 + b * 0.04})`, transformOrigin: 'left bottom'}}>
        <HeartRow hp={3} blink={b > 0.55} />
      </div>
      <VignetteBreathe frames={180} />
    </>
  );
};

/* ------------------------------------------------------------------ 3. spotlight */

export type SpotPoint = {x: number; y: number; r?: number; at: number};

/**
 * atm-vignette-spotlight: the screen falls dark except one soft round spotlight that glides between points.
 * Props: points [{x, y, r (radius px), at (frame it arrives)}] (first point is where it starts), travel (frames per move),
 *        dark (0..1 outside darkness), soft (0..1 edge softness), warm (rim light amount), dust (floating motes inside the beam).
 */
export const Spotlight: FC<{points?: SpotPoint[]; travel?: number; dark?: number; soft?: number; warm?: number; dust?: boolean}> = ({
  points = [
    {x: 960, y: 420, r: 430, at: 0},
    {x: 960, y: 835, r: 300, at: 70},
    {x: 640, y: 985, r: 250, at: 118},
  ],
  travel = 28,
  dark = 0.88,
  soft = 0.55,
  warm = 0.12,
  dust = true,
}) => {
  const f = useCurrentFrame();
  const pos = (fr: number) => {
    let x = points[0].x;
    let y = points[0].y;
    let r = points[0].r ?? 360;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const t = Math.min(1, Math.max(0, (fr - (p.at - travel)) / travel));
      if (t > 0) {
        // Ease in-out with a little overshoot on the radius when it lands ("lock on").
        const e = ease.inOut(t);
        const pr = points[i - 1];
        x = lerp(pr.x, p.x, e);
        y = lerp(pr.y, p.y, e);
        const land = t >= 1 ? Math.sin((fr - p.at) * 0.55) * Math.exp(-(fr - p.at) / 7) * 0.07 : 0;
        r = lerp(pr.r ?? 360, p.r ?? 360, e) * (1 + land + Math.sin(t * Math.PI) * 0.12);
      }
    }
    return {x, y, r};
  };
  const now = pos(f);
  const prev = pos(f - 1);
  const dx = now.x - prev.x;
  const dy = now.y - prev.y;
  const v = Math.hypot(dx, dy);
  const stretch = 1 + Math.min(0.5, v / 55);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const intro = smooth(0, 14, f);
  const BOX = 5600;
  const stops = curveStops([0, 0, 4], dark * intro, 1 - soft, 1.0, 2.4, 16);
  const rimStops = `rgba(255,214,150,0) ${(((1 - soft) * 0.7 * 100) / 1.2).toFixed(1)}%, rgba(255,214,150,${(warm * intro).toFixed(3)}) ${(((1 - soft * 0.4) * 100) / 1.2).toFixed(1)}%, rgba(255,214,150,0) ${(100 / 1.2).toFixed(1)}%`;
  const motes = useMemo(() => Array.from({length: 26}, (_, i) => ({a: hashA(i, 1) * 6.283, d: Math.sqrt(hashA(i, 2)), sp: 0.004 + hashA(i, 3) * 0.01, s: 3 + hashA(i, 4) * 5, ph: hashA(i, 5) * 6.283})), []);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: now.x - BOX / 2,
          top: now.y - BOX / 2,
          width: BOX,
          height: BOX,
          transform: `rotate(${angle}deg)`,
          background: `radial-gradient(ellipse ${(now.r * stretch).toFixed(1)}px ${(now.r / Math.sqrt(stretch)).toFixed(1)}px at 50% 50%, ${stops})`,
        }}
      />
      {/* The gradient above is transparent at the centre and ends at "dark"; beyond its radius the second layer is the same dark. */}
      <div
        style={{
          position: 'absolute',
          left: now.x - now.r * 1.2,
          top: now.y - now.r * 1.2,
          width: now.r * 2.4,
          height: now.r * 2.4,
          borderRadius: '50%',
          background: `radial-gradient(circle closest-side, ${rimStops})`,
          transform: `rotate(${angle}deg) scale(${stretch}, ${1 / Math.sqrt(stretch)})`,
        }}
      />
      {dust &&
        motes.map((m, i) => {
          const a = m.a + f * m.sp;
          const rr = m.d * now.r * 0.82;
          const x = now.x + Math.cos(a) * rr;
          const y = now.y + Math.sin(a * 1.3 + m.ph) * rr * 0.8 - ((f * (0.3 + m.sp * 40)) % 40);
          const tw = 0.5 + 0.5 * Math.sin(f * 0.12 + m.ph * 3);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: m.s, height: m.s, background: '#fff3d0', opacity: 0.35 * tw * intro, borderRadius: 1, boxShadow: '0 0 8px rgba(255,230,170,0.7)'}} />;
        })}
    </AbsoluteFill>
  );
};
const hashA = (i: number, k: number) => mulberry32(i * 977 + k * 131)();

const SpotlightDemo: FC = () => (
  <>
    <Stage plate="A" />
    <Spotlight />
    <Sfx at={0} src={mcSound('random/click')} volume={0.4} />
  </>
);

/* ------------------------------------------------------------------ 4. letterbox */

/**
 * atm-letterbox: cinema bars slide in (and out), with a soft shadow edge, light vignette and film grain; optional subtitle in the lower bar.
 * Props: size (bar height px, 140 ~ 2.4:1), inAt / outAt (frames; outAt omitted = stays), subtitle (string, types out), grain (0..1), vignette (0..1).
 */
export const Letterbox2: FC<{size?: number; inAt?: number; outAt?: number; subtitle?: string; subtitleAt?: number; grain?: number; vignette?: number}> = ({
  size = 140,
  inAt = 4,
  outAt,
  subtitle,
  subtitleAt = 40,
  grain = 0.5,
  vignette = 0.5,
}) => {
  const f = useCurrentFrame();
  const kin = ease.outQuint(Math.min(1, Math.max(0, (f - inAt) / 26)));
  const kout = outAt === undefined ? 0 : ease.in(Math.min(1, Math.max(0, (f - outAt) / 20)));
  const k = kin * (1 - kout);
  const shown = subtitle ? Math.floor(Math.min(1, Math.max(0, (f - subtitleAt) / (subtitle.length * 2.2))) * subtitle.length) : 0;
  const subA = subtitle ? smooth(subtitleAt, subtitleAt + 6, f) * (outAt === undefined ? 1 : 1 - smooth(outAt - 10, outAt, f)) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: k * vignette}}>
        <AbsoluteFill style={{background: `radial-gradient(${cornerEllipse()}, ${curveStops([4, 4, 10], 0.55, 0.5, 1, 2)})`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: k * grain}}>
        <Noise amount={0.22} scale={3} mono seed={11} />
      </AbsoluteFill>
      {/* bars */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: size, transform: `translateY(${-(1 - k) * size}px)`, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: size, height: 44, transform: `translateY(${-(1 - k) * (size + 44)}px)`, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: size, transform: `translateY(${(1 - k) * size}px)`, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: size, height: 44, transform: `translateY(${(1 - k) * (size + 44)}px)`, background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))'}} />
      {subtitle && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: subA * k}}>
          <span style={{fontFamily: PIXEL_FONT, fontSize: 48, lineHeight: '48px', color: '#f4efe2', letterSpacing: 4, textShadow: '0 0 12px rgba(255,240,200,0.25)', whiteSpace: 'pre'}}>{subtitle.slice(0, shown)}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

const LetterboxDemo: FC = () => (
  <>
    <Stage plate="A" />
    <Letterbox2 outAt={142} subtitle="他终于站在了末地传送门前。" />
  </>
);

/* ------------------------------------------------------------------ entries */

void W;
void H;
void rgba;
void Tag;

export const vignetteEntries: FxEntry[] = [
  {
    meta: {
      id: 'atm-vignette-close',
      name: '暗角收紧',
      category: 'atmosphere',
      tags: ['暗角', '聚焦', '氛围', '透明层', '色偏'],
      frames: 150,
      blurb: '画面四周由外向内慢慢收紧，边缘带冷色渐变到暖色的色偏，画面随之微推，视线被拉向中心。',
      usage: '镜头聚焦主体、进入紧张/回忆段落、强调中心信息时叠加。',
      params: [
        {name: 'tint / tintTo', desc: "暗角色偏：'neutral' | 'cold' | 'warm' | 'blood'；给 tintTo 则在收紧过程中渐变"},
        {name: 'from / to', desc: '起始 / 结束的收紧程度（0..1）'},
        {name: 'start / dur', desc: '开始帧与收紧时长（帧）'},
        {name: 'cx / cy', desc: '焦点位置（0..1，默认画面中心）'},
        {name: 'ringAmount', desc: '色环强度'},
      ],
    },
    Demo: VignetteCloseDemo,
    Layer: () => <VignetteClose />,
  },
  {
    meta: {
      id: 'atm-vignette-breathe',
      name: '暗角呼吸',
      category: 'atmosphere',
      tags: ['暗角', '心跳', '紧张', '低血量', '透明层'],
      frames: 180,
      blurb: '暗红色暗角随“咚-咚”心跳明暗起伏，心跳逐渐加快，同步心形血条抖动。',
      usage: '低血量、被追杀、Boss 战前的紧张氛围；也可去掉红色换成冷色做心理压迫。',
      params: [
        {name: 'bpm0 / bpm1', desc: '起始 / 结束心率（次/分钟）'},
        {name: 'base / depth', desc: '静息暗角程度 / 每次心跳增加的幅度'},
        {name: 'tint', desc: "暗角色偏，默认 'blood'"},
        {name: 'frames', desc: '总帧数（决定心率渐变速度）'},
        {name: 'sound', desc: '是否带心跳低频音'},
      ],
    },
    Demo: VignetteBreatheDemo,
    Layer: () => <VignetteBreathe frames={180} />,
  },
  {
    meta: {
      id: 'atm-vignette-spotlight',
      name: '聚光灯',
      category: 'atmosphere',
      tags: ['聚光灯', '暗角', '引导视线', '透明层'],
      frames: 150,
      blurb: '画面压暗，只剩一个边缘柔和的圆形聚光，依次滑向标题、字幕条、物品栏；移动时被拉成椭圆，落点轻微回弹。',
      usage: '讲解画面时依次指出重点位置、悬疑/舞台式介绍。',
      params: [
        {name: 'points', desc: '[{x, y, r 半径, at 到达帧}]，第一个点是起点'},
        {name: 'travel', desc: '每段移动所用帧数'},
        {name: 'dark / soft', desc: '外部暗度 / 边缘柔和度'},
        {name: 'warm', desc: '边缘暖色光晕强度'},
        {name: 'dust', desc: '光束内是否有漂浮尘埃'},
      ],
    },
    Demo: SpotlightDemo,
    Layer: () => <Spotlight />,
  },
  {
    meta: {
      id: 'atm-letterbox',
      name: '电影黑边',
      category: 'atmosphere',
      tags: ['黑边', '电影感', '字幕', '胶片', '透明层'],
      frames: 150,
      blurb: '上下黑边滑入，带内侧柔影、轻微暗角和胶片颗粒，黑边内逐字打出字幕，结尾滑出。',
      usage: '剧情/预告片段、过场电影感；黑边内可直接放字幕。',
      params: [
        {name: 'size', desc: '黑边高度 px（140 约等于 2.4:1）'},
        {name: 'inAt / outAt', desc: '滑入 / 滑出的开始帧（不填 outAt 则常驻）'},
        {name: 'subtitle / subtitleAt', desc: '字幕文字与出现帧'},
        {name: 'grain / vignette', desc: '颗粒与暗角强度 0..1'},
      ],
    },
    Demo: LetterboxDemo,
    Layer: () => <Letterbox2 outAt={142} subtitle="他终于站在了末地传送门前。" />,
  },
];
