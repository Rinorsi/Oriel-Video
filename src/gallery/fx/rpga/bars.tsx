import type {CSSProperties, FC, ReactNode} from 'react';
import {C, GOLD_EDGE, grad, mix, px, snap} from './common';

/** Dungeon health bar: ink outline, thin gold rim, red fill with highlight and an optional pale "ghost" trail. value/ghost 0..1. */
export const HpBar: FC<{w: number; h?: number; value: number; ghost?: number; color?: string; rim?: boolean; style?: CSSProperties; children?: ReactNode}> = ({w, h = 24, value, ghost, color = '#d93a2b', rim = true, style, children}) => (
  <div style={{position: 'relative', width: w, height: h, boxSizing: 'border-box', background: C.ink, border: `4px solid ${rim ? '#a87a2a' : C.ink}`, boxShadow: `0 0 0 3px ${C.ink}, 0 5px 0 3px rgba(0,0,0,.45)`, flex: 'none', ...style}}>
    <div style={{position: 'absolute', inset: 0, background: '#2a0e0b'}} />
    {ghost !== undefined && ghost > value && <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, ghost) * 100}%`, background: '#fff1d0', opacity: 0.85}} />}
    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, value) * 100}%`, background: grad(color)}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: `${Math.max(0, value) * 100}%`, height: 4, background: 'rgba(255,255,255,.35)'}} />
    {children}
  </div>
);

/** Tiny pixel "+" (heal) made of two rectangles, centred on x,y. */
export const Plus: FC<{x: number; y: number; s?: number; color?: string; opacity?: number}> = ({x, y, s = 8, color = C.heal, opacity = 1}) => (
  <>
    <div style={{position: 'absolute', left: snap(x - s * 1.5, 2), top: snap(y - s / 2, 2), width: s * 3, height: s, background: color, opacity, boxShadow: `0 0 10px ${color}`}} />
    <div style={{position: 'absolute', left: snap(x - s / 2, 2), top: snap(y - s * 1.5, 2), width: s, height: s * 3, background: color, opacity, boxShadow: `0 0 10px ${color}`}} />
  </>
);

/** Gold-edged title strip (ribbon) with centred children. */
export const Ribbon: FC<{w: number; h?: number; style?: CSSProperties; children: ReactNode}> = ({w, h = 84, style, children}) => (
  <div style={{position: 'relative', width: w, height: h, boxSizing: 'border-box', padding: 6, background: GOLD_EDGE, boxShadow: `0 0 0 4px ${C.ink}, 0 10px 0 4px rgba(0,0,0,.5)`, flex: 'none', ...style}}>
    <div style={{position: 'absolute', inset: 6, background: 'linear-gradient(180deg,#2f2016,#150e09)', boxShadow: 'inset 0 0 0 2px rgba(255,220,150,.2)'}} />
    <div style={{position: 'relative', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>{children}</div>
  </div>
);

export const HeartIcon: FC<{size?: number; src: string; style?: CSSProperties}> = ({size = 45, src, style}) => <img src={src} style={{width: size, height: size, ...px, ...style}} />;
export const gradOf = (c: string) => `linear-gradient(180deg, ${mix(c, '#ffffff', 0.6)} 0%, ${c} 50%, ${mix(c, '#000000', 0.35)} 100%)`;
