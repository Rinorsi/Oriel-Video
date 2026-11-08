import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {mulberry32} from '../../../mc/theme';
import {C, Torch, snap} from './kit';

/** Helpers private to rpgb part B (death, checkpoint, chest, door, wave). */

/**
 * Stone floor in stepped perspective: rows get taller and their tiles wider towards the viewer (no CSS 3D, so it layers
 * predictably). `y` = horizon line; `shift` slides the pattern sideways (camera pan).
 */
export const Floor: FC<{y: number; texture?: string; dim?: number; shift?: number; grow?: number}> = ({y, texture = 'polished_deepslate', dim = 0.5, shift = 0, grow = 1.3}) => {
  const rows: {top: number; h: number; w: number}[] = [];
  let top = 0;
  let h = 14;
  while (y + top < 1080) {
    rows.push({top, h: Math.ceil(h), w: Math.round(h * 2.6)});
    top += Math.ceil(h);
    h *= grow;
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, bottom: 0, overflow: 'hidden'}}>
      {rows.map((r, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: r.top, height: r.h, backgroundImage: `url(${block(texture)})`, backgroundSize: `${r.w}px ${r.h}px`, backgroundPosition: `${960 - r.w / 2 + shift * (r.h / 60)}px 0`, imageRendering: 'pixelated', filter: 'brightness(0.72)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.45)'}} />
      ))}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(5,4,3,0.96) 0%, rgba(8,6,4,${dim}) 55%, rgba(8,6,4,${dim * 0.5}) 100%)`}} />
    </div>
  );
};

/** Left/right chiseled stone columns with a torch each; frames the shot and fills the side edges. */
export const Pillars: FC<{w?: number; torchY?: number; lit?: number; shiftX?: number}> = ({w = 170, torchY = 330, lit = 1, shiftX = 0}) => {
  const col = (side: 'l' | 'r'): CSSProperties => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: w,
    [side === 'l' ? 'left' : 'right']: 0,
    backgroundImage: `url(${block('chiseled_stone_bricks')})`,
    backgroundSize: `${w / 2}px ${w / 2}px`,
    backgroundPosition: `${shiftX}px 0`,
    imageRendering: 'pixelated',
    filter: 'brightness(0.55)',
    boxShadow: side === 'l' ? `inset -10px 0 0 rgba(0,0,0,0.55), 14px 0 0 rgba(0,0,0,0.5)` : `inset 10px 0 0 rgba(0,0,0,0.55), -14px 0 0 rgba(0,0,0,0.5)`,
  });
  return (
    <>
      <div style={col('l')} />
      <div style={col('r')} />
      <Torch x={w / 2} y={torchY} scale={12} lit={lit} seed={1} />
      <Torch x={1920 - w / 2} y={torchY} scale={12} lit={lit} seed={2} />
    </>
  );
};

/** Colour-tinted banner cloth from the real banner texture (entity/banner/base.png front = 20x40 at (1,1)) plus optional pattern. */
export const BannerCloth: FC<{s?: number; color?: string; pattern?: string; patternColor?: string; hang?: number; style?: CSSProperties}> = ({s = 8, color = '#a82424', pattern = 'skull', patternColor = '#1a1210', hang = 1, style}) => {
  const src = tex('entity/banner/base.png');
  const pat = tex(`entity/banner/${pattern}.png`);
  const f = useCurrentFrame();
  const sway = Math.sin(f / 9) * 1.6 * hang;
  return (
    <div style={{position: 'relative', width: 20 * s, height: 40 * s * hang, overflow: 'hidden', transformOrigin: '50% 0', transform: `skewX(${sway}deg)`, ...style}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 20 * s, height: 40 * s, backgroundColor: color, backgroundImage: `url(${src})`, backgroundSize: `${64 * s}px ${64 * s}px`, backgroundPosition: `${-s}px ${-s}px`, backgroundBlendMode: 'multiply', imageRendering: 'pixelated'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 20 * s, height: 40 * s, backgroundColor: patternColor, WebkitMaskImage: `url(${pat})`, maskImage: `url(${pat})`, WebkitMaskSize: `${64 * s}px ${64 * s}px`, maskSize: `${64 * s}px ${64 * s}px`, WebkitMaskPosition: `${-s}px ${-s}px`, maskPosition: `${-s}px ${-s}px`, imageRendering: 'pixelated'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 20 * s, height: 40 * s, boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.25)'}} />
    </div>
  );
};

/** Falling stone grit from the ceiling (deterministic). `k` 0..1 amount. */
export const Grit: FC<{k: number; seed?: number; x0?: number; x1?: number; count?: number; speed?: number}> = ({k, seed = 8, x0 = 0, x1 = 1920, count = 46, speed = 22}) => {
  const f = useCurrentFrame();
  if (k <= 0) return null;
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const x = x0 + r() * (x1 - x0);
        const ph = r() * 40;
        const sz = 6 + Math.floor(r() * 3) * 4;
        const sp = speed * (0.6 + r() * 0.8);
        const gate = r();
        if (gate > k) return null;
        const t = (f + ph) % 40;
        const y = -40 + t * sp;
        if (y > 1100) return null;
        const g = 90 + Math.floor(r() * 70);
        return <div key={i} style={{position: 'absolute', left: snap(x, 2), top: snap(y, 2), width: sz, height: sz, background: `rgb(${g},${g - 6},${g - 14})`, opacity: 0.9}} />;
      })}
    </>
  );
};

/** Flat full-frame tint helper. */
export const Tint: FC<{color: string; opacity: number; blend?: CSSProperties['mixBlendMode']; children?: ReactNode}> = ({color, opacity, blend, children}) => (
  <AbsoluteFill style={{background: color, opacity, mixBlendMode: blend}}>{children}</AbsoluteFill>
);

export const GOLD_GLOW = C.gold2;

/** Iron chain hanging from the top edge (vanilla chain texture, tiled vertically). */
export const Chain: FC<{x: number; len: number; s?: number; sway?: number}> = ({x, len, s = 10, sway = 0}) => (
  <div style={{position: 'absolute', left: x - 8 * s, top: -20, width: 16 * s, height: len + 20, backgroundImage: `url(${block('iron_chain')})`, backgroundSize: `${16 * s}px ${16 * s}px`, backgroundRepeat: 'repeat-y', imageRendering: 'pixelated', filter: 'brightness(1.1) contrast(1.1)', transformOrigin: '50% 0', transform: `rotate(${sway}deg)`}} />
);
