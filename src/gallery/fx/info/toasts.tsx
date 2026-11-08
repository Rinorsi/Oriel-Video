import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import {LightRays, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE} from '../../../mc/theme';
import {OreProgress} from '../../../mg/Ore';
import {ItemImg, mcSound} from '../../../reel/kit';
import {Confetti, EdgeGlow, PX, Shine, Slab, Sparkles, Stage, W, back, lerp, pr, spring, typed, Sfx} from './ui';

/**
 * Advancement toasts, upgraded (transparent overlay): three toasts stack down the right edge, one per frame type.
 *   task      steel frame, square          "进度已达成！"
 *   goal      green frame, notched corners "目标已达成！"
 *   challenge gold frame, spiked, purple glow, orbiting sparks, burst + confetti + golden edge glow, "挑战完成！"
 * Props: toasts (array of {kind, head?, title, desc, icon}), counter (chip under the stack, e.g. "已解锁 18 / 124"),
 *   progress ([from, to] fill of the counter bar), starts (start frame of each toast; default 8 + 56 per toast), frames (total length; exit begins 42 frames before it).
 */

export const TOAST_FRAMES = 240;

export type ToastKind = 'task' | 'goal' | 'challenge';
export type ToastSpec = {kind: ToastKind; title: string; desc: string; icon: string; head?: string};

const DEFAULTS: ToastSpec[] = [
  {kind: 'task', title: '石器时代', desc: '用镐子挖掘一块石头', icon: 'stone_pickaxe'},
  {kind: 'goal', title: '钻石！', desc: '用铁镐找到并挖出钻石', icon: 'diamond'},
  {kind: 'challenge', title: '天空之限', desc: '穿着鞘翅飞越 500 米高空', icon: 'elytra'},
];

const HEADS: Record<ToastKind, {head: string; color: string; border: string; fill: string; deep: string}> = {
  task: {head: '进度已达成！', color: '#ffff55', border: '#cfd3d8', fill: '#59606a', deep: '#3a4048'},
  goal: {head: '目标已达成！', color: '#ffff55', border: '#a6e68a', fill: '#3c8527', deep: '#25591a'},
  challenge: {head: '挑战完成！', color: '#ff55ff', border: '#f8af2b', fill: '#9a6bff', deep: '#5a32c8'},
};

/** Rectangle with stepped (pixel) corners as a clip-path polygon, in px. r = corner size, step = stair size. */
const stepped = (w: number, h: number, r: number, step = 8): string => {
  if (r <= 0) return `polygon(0 0, ${w}px 0, ${w}px ${h}px, 0 ${h}px)`;
  const stairs = Math.max(1, Math.round(r / step));
  const tl: [number, number][] = [];
  for (let i = 0; i <= stairs; i++) {
    tl.push([(stairs - i) * step, i * step]);
    if (i < stairs) tl.push([(stairs - i) * step, (i + 1) * step]);
  }
  const P: [number, number][] = [];
  tl.forEach(([x, y]) => P.push([x, y]));
  tl.slice().reverse().forEach(([x, y]) => P.push([w - x, y]));
  tl.forEach(([x, y]) => P.push([w - x, h - y]));
  tl.slice().reverse().forEach(([x, y]) => P.push([x, h - y]));
  return `polygon(${P.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
};

/** Spiked star-ish badge polygon (percent coordinates). */
const spiked = (n = 12, inner = 0.84): string => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 50 : 50 * inner;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)}% ${(50 + Math.sin(a) * r).toFixed(1)}%`);
  }
  return `polygon(${pts.join(',')})`;
};

const FRAME = 128;

const IconFrame: FC<{kind: ToastKind; icon: string; f: number; at: number}> = ({kind, icon, f, at}) => {
  const c = HEADS[kind];
  const pop = spring(pr(f, at, 18, (t) => t), 8, 4.5);
  const clip = kind === 'task' ? stepped(FRAME, FRAME, 0) : kind === 'goal' ? stepped(FRAME, FRAME, 24) : spiked();
  const radius = (i: number) => (i <= 0 ? 24 : i <= 4 ? 16 : 8);
  const layer = (i: number, bg: string): CSSProperties => ({position: 'absolute', inset: i, background: bg, clipPath: kind === 'challenge' ? spiked(12, 0.8 + i * 0.004) : kind === 'goal' ? stepped(FRAME - i * 2, FRAME - i * 2, radius(i), 8) : undefined});
  return (
    <div style={{position: 'relative', width: FRAME, height: FRAME, transform: `scale(${pop}) rotate(${(1 - Math.min(1, pop)) * -30}deg)`}}>
      {kind === 'challenge' && (
        <div style={{position: 'absolute', inset: -34, background: `radial-gradient(circle, rgba(255,85,255,${0.55 + 0.2 * Math.sin(f / 4)}) 0%, rgba(248,175,43,0.3) 45%, rgba(248,175,43,0) 70%)`}} />
      )}
      <div style={{position: 'absolute', inset: 0, clipPath: clip, background: '#000'}} />
      <div style={layer(4, c.border)} />
      <div style={layer(12, c.fill)} />
      <div style={{...layer(20, c.deep)}} />
      <div style={{...layer(20, 'transparent'), boxShadow: `inset 0 6px 0 rgba(255,255,255,0.28)`}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(f / 9) * 3}px)`}}>
        <ItemImg id={icon} size={64} style={{filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.5))'}} />
      </div>
      <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden'}}>
        <Shine p={pr(f, at + 12, 22, (t) => t)} />
      </div>
      {kind === 'challenge' &&
        Array.from({length: 6}, (_, i) => {
          const a = f / 14 + (i / 6) * Math.PI * 2;
          const r = 84 + Math.sin(f / 6 + i) * 6;
          const s = i % 2 ? 12 : 8;
          return <div key={i} style={{position: 'absolute', left: FRAME / 2 + Math.cos(a) * r - s / 2, top: FRAME / 2 + Math.sin(a) * r * 0.9 - s / 2, width: s, height: s, background: i % 2 ? '#ffe08a' : '#ff55ff', boxShadow: '0 0 12px #f8af2b'}} />;
        })}
    </div>
  );
};

export const ToastCard: FC<{spec: ToastSpec; f: number; at: number; out: number}> = ({spec, f, at, out}) => {
  const c = HEADS[spec.kind];
  const slide = (1 - spring(pr(f, at, 20, (t) => t), 7, 5)) * 980 + EASE.in(out) * 980;
  const nChars = (f - at - 8) / 1.8;
  const head = spec.head ?? c.head;
  const TW = 800;
  const TH = 176;
  const chal = spec.kind === 'challenge';
  return (
    <div style={{width: TW, height: TH, position: 'relative', transform: `translateX(${slide}px)`}}>
      {/* base: vanilla toast sprite, scaled 5x */}
      <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${tex('gui/sprites/toast/advancement.png')})`, backgroundSize: '100% 100%', imageRendering: 'pixelated', boxShadow: `0 12px 0 rgba(0,0,0,0.5)${chal ? ', 0 0 0 4px #f8af2b, 0 0 40px 4px rgba(248,175,43,0.55)' : ''}`}} />
      {/* tier stripe */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: c.border, boxShadow: 'inset -4px 0 0 rgba(0,0,0,0.35)'}} />
      <div style={{position: 'absolute', left: 12, right: 0, top: 0, height: 4, background: 'rgba(255,255,255,0.22)'}} />
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <Shine p={pr(f, at + 6, 24, (t) => t)} strength={chal ? 1.4 : 1} />
        {chal && <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(90deg, rgba(248,175,43,0.1) 0 8px, rgba(0,0,0,0) 8px 16px)`}} />}
      </div>
      <div style={{position: 'absolute', left: 36, top: (TH - FRAME) / 2}}>
        <IconFrame kind={spec.kind} icon={spec.icon} f={f} at={at + 5} />
      </div>
      <div style={{position: 'absolute', left: 196, top: 14, opacity: pr(f, at + 8, 6)}}>
        <PX size={36} color={c.color} shadow="rgba(0,0,0,0.6)">
          {head}
        </PX>
      </div>
      <div style={{position: 'absolute', left: 196, top: 60}}>
        <PX size={48} color="#fff" shadow="rgba(0,0,0,0.6)">
          {typed(spec.title, nChars)}
        </PX>
      </div>
      <div style={{position: 'absolute', left: 196, top: 118, opacity: pr(f, at + 20, 8)}}>
        <PX size={36} color="#aaaaaa" shadow="rgba(0,0,0,0.6)">
          {spec.desc}
        </PX>
      </div>
      {chal && (
        <div style={{position: 'absolute', right: 20, top: 16, opacity: 0.6 + 0.4 * Math.sin(f / 5)}}>
          <PX size={24} color="#ffe08a" shadow="rgba(0,0,0,0.6)">★ ★ ★</PX>
        </div>
      )}
    </div>
  );
};

export const AdvancementToasts: FC<{bg?: boolean; toasts?: ToastSpec[]; counter?: string; progress?: [number, number]; starts?: number[]; frames?: number}> = ({bg, toasts = DEFAULTS, counter = '已解锁 18 / 124 个进度', progress = [0.1, 0.145], starts: startsProp, frames = TOAST_FRAMES}) => {
  const f = useCurrentFrame();
  const N = frames;
  const starts = toasts.map((_, i) => startsProp?.[i] ?? 8 + i * 56);
  const exitAt = N - 42;
  const S = 1.25;
  const X = W - 48 - 800 * S;
  const Y0 = 40;
  const GAP = 200;
  const last = starts[starts.length - 1];
  const chIdx = toasts.findIndex((t) => t.kind === 'challenge');
  const chAt = chIdx >= 0 ? starts[chIdx] : -999;
  const glow = chIdx >= 0 ? Math.max(0, 1 - Math.abs(f - (chAt + 14)) / 26) * 0.8 + (f > chAt && f < exitAt ? 0.14 + 0.06 * Math.sin(f / 6) : 0) * pr(f, chAt, 10) * (1 - pr(f, exitAt, 14)) : 0;
  const counterIn = back(pr(f, last + 30, 14, (t) => t));
  const counterOut = pr(f, exitAt + 6, 16, EASE.in);
  return (
    <Stage bg={bg}>
      <EdgeGlow color="rgba(248,175,43,0.85)" k={glow} size={260} />
      {chIdx >= 0 && <LightRays x={X + 100 * S} y={Y0 + (chIdx * GAP + 88) * S} size={1500} opacity={0.3 * pr(f, chAt, 12) * (1 - pr(f, exitAt, 14))} color="255,190,80" rays={12} />}
      {toasts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: X, top: Y0 + i * GAP * S, transform: `scale(${S})`, transformOrigin: '0 0'}}>
          <ToastCard spec={t} f={f} at={starts[i]} out={pr(f, exitAt + i * 4, 14, (v) => v)} />
        </div>
      ))}
      {/* counter chip under the stack */}
      <div style={{position: 'absolute', left: X, top: Y0 + toasts.length * GAP * S - 4, width: 800, transformOrigin: '0 0', transform: `translateX(${((1 - counterIn) * 900 + counterOut * 900) * S}px) scale(${S})`}}>
        <Slab w={800} h={112} tone="panel_raised" shadow={8}>
          <div style={{position: 'absolute', left: 32, top: 16}}>
            <PX size={36} color="#fff">{counter}</PX>
          </div>
          <div style={{position: 'absolute', left: 32, top: 64}}>
            <OreProgress value={lerp(progress[0], progress[1], pr(f, last + 36, 30))} width={736} color="gold" />
          </div>
        </Slab>
      </div>
      {toasts.map((t, i) => {
        const s = starts[i];
        const cx = X + (36 + FRAME / 2) * S;
        const cy = Y0 + (i * GAP + 88) * S;
        return (
          <div key={i}>
            {t.kind === 'challenge' && (
              <>
                <PixelBurst x={cx} y={cy} at={s + 8} count={46} colors={['#f8af2b', '#ffe08a', '#ff55ff', '#fff']} speed={26} life={34} size={16} seed={21} />
                <PixelBurst x={cx} y={cy} at={s + 14} count={30} colors={['#f8af2b', '#fff']} speed={16} life={30} size={12} seed={22} />
                <Shockwave x={cx} y={cy} at={s + 8} color="#f8af2b" maxR={620} life={20} width={18} />
                <Confetti at={s + 6} life={110} count={90} colors={['#f8af2b', '#ffe08a', '#ff55ff', '#7345e5', '#fff', '#6cc349']} seed={14} size={16} />
                <Sfx at={s} src={mcSound('ui/toast/challenge_complete')} volume={0.55} />
              </>
            )}
            {t.kind === 'goal' && <PixelBurst x={cx} y={cy} at={s + 8} count={16} colors={['#a6e68a', '#6cc349', '#fff']} speed={14} life={24} size={10} seed={31} />}
            {t.kind === 'task' && <PixelBurst x={cx} y={cy} at={s + 8} count={10} colors={['#cfd3d8', '#fff']} speed={10} life={20} size={10} seed={41} />}
            {t.kind !== 'challenge' && <Sfx at={s} src={mcSound('ui/toast/in')} volume={0.5} rate={t.kind === 'goal' ? 1.15 : 1} />}
            <Sfx at={s + 8} src={mcSound(t.kind === 'task' ? 'random/click' : 'random/orb')} volume={0.3} rate={t.kind === 'challenge' ? 0.8 : 1.2} />
            <Sfx at={exitAt + i * 4} src={mcSound('ui/toast/out')} volume={0.25} />
          </div>
        );
      })}
      {chIdx >= 0 && <Sparkles x={X - 100} y={Y0} w={1100} h={800} count={12} seed={7} px={6} color="#ffe08a" at={chAt + 8} />}
      <AbsoluteFill style={{pointerEvents: 'none'}} />
    </Stage>
  );
};
