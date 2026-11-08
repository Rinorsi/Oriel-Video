// Shared helpers for the mcd-kit demos.
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {McdText} from './parts';

/** 0..1 progress of a window [at, at+dur] (frames). */
export const win = (f: number, at: number, dur: number) => clamp01((f - at) / Math.max(1, dur));

/** Pops a child in with a stepped-feeling overshoot; hidden before `at`. */
export const Pop: FC<{at: number; dur?: number; children: ReactNode; origin?: string; style?: CSSProperties; from?: number}> = ({at, dur = 10, children, origin = '50% 50%', style, from = 0.55}) => {
  const f = useCurrentFrame();
  const t = win(f, at, dur);
  if (f < at) return <div style={{opacity: 0, ...style}}>{children}</div>;
  const s = from + (1 - from) * EASE.back(t);
  return <div style={{transform: `scale(${s})`, transformOrigin: origin, opacity: t < 0.15 ? 0.5 : 1, ...style}}>{children}</div>;
};

/** Slides up a few pixels and fades in with 4 hard steps. */
export const Rise: FC<{at: number; dur?: number; dy?: number; children: ReactNode; style?: CSSProperties}> = ({at, dur = 10, dy = 24, children, style}) => {
  const f = useCurrentFrame();
  const t = Math.round(win(f, at, dur) * 4) / 4;
  return <div style={{opacity: t, transform: `translateY(${(1 - EASE.out(t)) * dy}px)`, ...style}}>{children}</div>;
};

/** Small grey caption (Noto Sans) under or beside a component. */
export const Cap: FC<{children: ReactNode; style?: CSSProperties; color?: string; size?: number}> = ({children, style, color = '#8A8F9A', size = 24}) => (
  <McdText size={size} weight={600} color={color} style={{letterSpacing: 2, textTransform: 'uppercase', ...style}}>{children}</McdText>
);

export const Fill: FC<{children: ReactNode; style?: CSSProperties}> = ({children, style}) => <AbsoluteFill style={style}>{children}</AbsoluteFill>;

/** Integer count-up from 0 to `to` between frames [at, at+dur], eased out, in `steps` hard steps. */
export const countUp = (f: number, at: number, dur: number, to: number, steps = 0) => {
  const t = EASE.out(win(f, at, dur));
  const v = to * (steps ? Math.round(t * steps) / steps : t);
  return Math.round(v);
};
