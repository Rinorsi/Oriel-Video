import {createContext, useContext, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, item as itemUrl, tex} from '../../../mc/assets';
import {BLACK_FONT, PIXEL8_FONT, PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Crop} from '../../mob';

/**
 * Shared kit for the "rpg" (Minecraft Dungeons flavoured) effects: dungeon background with torches,
 * gold-framed panels, parchment, rarity colours, fancy gold text, pixel bursts, light beams, mob figures.
 * Everything is frame driven and deterministic.
 */

export {EASE, clamp01, mulberry32};
export const W = 1920;
export const H = 1080;
export const px: CSSProperties = {imageRendering: 'pixelated'};

/** Dungeon palette. */
export const C = {
  ink: '#0d0a08',
  stone0: '#120f0d',
  stone1: '#221d1a',
  stone2: '#352d27',
  wood0: '#1c120a',
  wood1: '#38241a',
  wood2: '#5a3a20',
  gold0: '#6b4310',
  gold1: '#b07a1c',
  gold2: '#ffb531',
  gold3: '#ffe08a',
  parch0: '#b8935a',
  parch1: '#e2c98c',
  parch2: '#f4e6b8',
  parchInk: '#4a2f14',
  torch: '#ff9a3c',
  ember: '#ff6a1f',
  red: '#e0432f',
  redDark: '#5a1510',
  green: '#58d36a',
  emerald: '#17dd62',
  poison: '#8be04a',
  fire: '#ff7a1a',
  heal: '#6bff8a',
  white: '#fff4dc',
  ice: '#8fd8ff',
} as const;

/** Item rarity colours used by the dungeon UI. */
export const RARITY = {
  common: {name: '普通', color: '#cfcfcf', glow: '#e8e8e8'},
  rare: {name: '稀有', color: '#4aa8ff', glow: '#7cc2ff'},
  unique: {name: '独特', color: '#ffb531', glow: '#ffd36a'},
} as const;
export type RarityKey = keyof typeof RARITY;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Eased 0..1 progress of frame `f` between `at` and `at + dur`. */
export const prog = (f: number, at: number, dur: number, e: (t: number) => number = EASE.out) => e(clamp01((f - at) / dur));
export const snap = (v: number, g = 4) => Math.round(v / g) * g;
/** Damped wobble: 0 at start and at rest. */
export const jiggle = (t: number, k = 3, d = 4) => (t <= 0 ? 0 : Math.sin(t * Math.PI * k) * Math.exp(-t * d));
export const bounceOut = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Mix two hex colours, t = 0..1 towards b. */
export const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hex2rgb(a);
  const [r2, g2, b2] = hex2rgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
};
export const rgba = (h: string, a: number) => {
  const [r, g, b] = hex2rgb(h);
  return `rgba(${r},${g},${b},${a})`;
};
/** Vertical metallic-ish gradient built from one colour (light top, dark bottom). */
export const grad = (c: string) => `linear-gradient(180deg, ${mix(c, '#ffffff', 0.62)} 0%, ${c} 46%, ${mix(c, '#000000', 0.18)} 54%, ${mix(c, '#000000', 0.55)} 100%)`;
export const GOLD_GRAD = `linear-gradient(180deg, #fff3c2 0%, #ffcb4a 44%, #e29a1c 54%, #8f5410 100%)`;
export const GOLD_EDGE = `linear-gradient(135deg, #ffe9a0 0%, #d9962a 22%, #8a5a14 50%, #e0a23a 78%, #7a4d10 100%)`;

/* ---------------------------------------------------------------- text */

/** Fantasy heavy title: gradient fill over a dark stroke with a hard drop. `fill` is any CSS background. */
export const Fancy: FC<{size: number; fill?: string; edge?: string; stroke?: number; drop?: number; spacing?: number; style?: CSSProperties; children: ReactNode}> = ({
  size,
  fill = GOLD_GRAD,
  edge = C.ink,
  stroke,
  drop,
  spacing = 0,
  style,
  children,
}) => {
  const s = stroke ?? Math.max(3, Math.round(size / 12));
  const d = drop ?? Math.max(3, Math.round(size / 14));
  const base: CSSProperties = {fontFamily: BLACK_FONT, fontSize: size, lineHeight: `${Math.round(size * 1.15)}px`, letterSpacing: spacing, whiteSpace: 'pre', textAlign: 'center'};
  return (
    <span style={{position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', ...style}}>
      <span style={{...base, color: edge, WebkitTextStroke: `${s * 2}px ${edge}`, textShadow: `0 ${d}px 0 ${edge}, 0 ${d + 3}px 8px rgba(0,0,0,.6)`}}>{children}</span>
      <span style={{...base, position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: fill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent'}}>{children}</span>
    </span>
  );
};

/** Small pixel-font label with a hard shadow. size must be a multiple of 12 (PIXEL) or 8 (small). */
export const Label: FC<{size?: number; color?: string; small?: boolean; style?: CSSProperties; children: ReactNode}> = ({size = 36, color = C.white, small, style, children}) => (
  <span style={{fontFamily: small ? PIXEL8_FONT : PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, whiteSpace: 'pre', textAlign: 'center', textShadow: `${Math.max(2, size / 12)}px ${Math.max(2, size / 12)}px 0 rgba(0,0,0,.7)`, ...style}}>{children}</span>
);

/** Bold system-style number/label with a dark outline (BLACK_FONT), for stats where the pixel font is too thin. */
export const Bold: FC<{size: number; color?: string; style?: CSSProperties; children: ReactNode}> = ({size, color = C.white, style, children}) => (
  <span
    style={{
      fontFamily: BLACK_FONT,
      fontSize: size,
      lineHeight: `${Math.round(size * 1.15)}px`,
      color,
      whiteSpace: 'pre',
      textAlign: 'center',
      WebkitTextStroke: `${Math.max(2, size / 10)}px ${C.ink}`,
      paintOrder: 'stroke fill',
      textShadow: `0 ${Math.max(2, size / 14)}px 0 ${C.ink}`,
      ...style,
    }}
  >
    {children}
  </span>
);

/* ---------------------------------------------------------------- sprites */

export const Item: FC<{id: string; size?: number; style?: CSSProperties}> = ({id, size = 64, style}) => <Img src={itemUrl(id)} style={{width: size, height: size, ...px, ...style}} />;

/** Player face with hat layer from a vanilla skin. size should be a multiple of 8. */
export const Face: FC<{skin?: string; size: number; slim?: boolean; style?: CSSProperties}> = ({skin = 'steve', size, style}) => {
  const k = size / 8;
  const layer = (x: number): CSSProperties => ({position: 'absolute', inset: 0, backgroundImage: `url(${tex(`entity/player/wide/${skin}.png`)})`, backgroundSize: `${64 * k}px ${64 * k}px`, backgroundPosition: `${-x * k}px ${-8 * k}px`, ...px});
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', ...style}}>
      <div style={layer(8)} />
      <div style={layer(40)} />
    </div>
  );
};

/** Front-view body of a vanilla mob, built from the real entity texture. `s` = screen px per texel (integer). */
export const MobFigure: FC<{kind: 'zombie' | 'skeleton' | 'creeper' | 'player'; s: number; hurt?: number; skin?: string; style?: CSSProperties}> = ({kind, s, hurt = 0, skin = 'steve', style}) => {
  const filter = hurt > 0 ? `brightness(${1 + hurt * 1.6}) saturate(${1 - hurt * 0.4}) sepia(${hurt * 0.3})` : undefined;
  const wrap: CSSProperties = {position: 'relative', filter, flex: 'none', ...style};
  const at = (x: number, y: number): CSSProperties => ({position: 'absolute', left: x * s, top: y * s});
  if (kind === 'zombie') {
    const src = tex('entity/zombie/zombie.png');
    const sh: [number, number] = [64, 64];
    return (
      <div style={{...wrap, width: 16 * s, height: 32 * s}}>
        <Crop src={src} sheet={sh} rect={[4, 20, 4, 12]} scale={s} style={at(4, 20)} />
        <Crop src={src} sheet={sh} rect={[4, 20, 4, 12]} scale={s} style={{...at(8, 20), transform: 'scaleX(-1)'}} />
        <Crop src={src} sheet={sh} rect={[20, 20, 8, 12]} scale={s} style={at(4, 8)} />
        <Crop src={src} sheet={sh} rect={[44, 20, 4, 12]} scale={s} style={at(0, 8)} />
        <Crop src={src} sheet={sh} rect={[44, 20, 4, 12]} scale={s} style={{...at(12, 8), transform: 'scaleX(-1)'}} />
        <Crop src={src} sheet={sh} rect={[8, 8, 8, 8]} scale={s} style={at(4, 0)} />
      </div>
    );
  }
  if (kind === 'player') {
    const src = tex(`entity/player/wide/${skin}.png`);
    const sh: [number, number] = [64, 64];
    return (
      <div style={{...wrap, width: 16 * s, height: 32 * s}}>
        <Crop src={src} sheet={sh} rect={[4, 20, 4, 12]} scale={s} style={at(4, 20)} />
        <Crop src={src} sheet={sh} rect={[20, 52, 4, 12]} scale={s} style={at(8, 20)} />
        <Crop src={src} sheet={sh} rect={[20, 20, 8, 12]} scale={s} style={at(4, 8)} />
        <Crop src={src} sheet={sh} rect={[44, 20, 4, 12]} scale={s} style={at(0, 8)} />
        <Crop src={src} sheet={sh} rect={[36, 52, 4, 12]} scale={s} style={at(12, 8)} />
        <Crop src={src} sheet={sh} rect={[8, 8, 8, 8]} scale={s} style={at(4, 0)} />
        <Crop src={src} sheet={sh} rect={[40, 8, 8, 8]} scale={s} style={at(4, 0)} />
      </div>
    );
  }
  if (kind === 'skeleton') {
    const src = tex('entity/skeleton/skeleton.png');
    const sh: [number, number] = [64, 32];
    return (
      <div style={{...wrap, width: 16 * s, height: 32 * s}}>
        <Crop src={src} sheet={sh} rect={[2, 18, 2, 12]} scale={s} style={at(5, 20)} />
        <Crop src={src} sheet={sh} rect={[2, 18, 2, 12]} scale={s} style={{...at(9, 20), transform: 'scaleX(-1)'}} />
        <Crop src={src} sheet={sh} rect={[20, 20, 8, 12]} scale={s} style={at(4, 8)} />
        <Crop src={src} sheet={sh} rect={[42, 18, 2, 12]} scale={s} style={at(2, 8)} />
        <Crop src={src} sheet={sh} rect={[42, 18, 2, 12]} scale={s} style={{...at(12, 8), transform: 'scaleX(-1)'}} />
        <Crop src={src} sheet={sh} rect={[8, 8, 8, 8]} scale={s} style={at(4, 0)} />
      </div>
    );
  }
  const src = tex('entity/creeper/creeper.png');
  const sh: [number, number] = [64, 32];
  return (
    <div style={{...wrap, width: 8 * s, height: 26 * s}}>
      <Crop src={src} sheet={sh} rect={[4, 22, 4, 6]} scale={s} style={at(0, 20)} />
      <Crop src={src} sheet={sh} rect={[4, 22, 4, 6]} scale={s} style={at(4, 20)} />
      <Crop src={src} sheet={sh} rect={[20, 20, 8, 12]} scale={s} style={at(0, 8)} />
      <Crop src={src} sheet={sh} rect={[8, 8, 8, 8]} scale={s} style={at(0, 0)} />
    </div>
  );
};

/* ---------------------------------------------------------------- effects */

/** Square pixel particles with gravity; deterministic. `at` is relative to the current sequence. */
export const Burst: FC<{
  x: number;
  y: number;
  at: number;
  count?: number;
  colors?: string[];
  speed?: number;
  life?: number;
  size?: number;
  gravity?: number;
  seed?: number;
  /** direction cone: centre angle (rad, 0 = right, -PI/2 = up) and half-width; default full circle */
  dir?: number;
  spread?: number;
  glow?: boolean;
}> = ({x, y, at, count = 24, colors = [C.gold3, C.gold2, C.torch], speed = 18, life = 34, size = 12, gravity = 0.5, seed = 1, dir = 0, spread = Math.PI, glow = true}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  const rnd = mulberry32(seed * 977 + 13);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const a = dir + (rnd() * 2 - 1) * spread;
        const v = speed * (0.35 + rnd() * 0.65);
        const l = life * (0.55 + rnd() * 0.45);
        const c = colors[Math.floor(rnd() * colors.length)];
        const sz0 = size * (0.5 + rnd() * 0.8);
        if (f > l) return null;
        const k = (1 - Math.pow(0.9, f)) / 0.1;
        const X = x + Math.cos(a) * v * k;
        const Y = y + Math.sin(a) * v * k + 0.5 * gravity * f * f;
        const fade = 1 - f / l;
        const s = Math.max(4, snap(sz0 * (0.4 + 0.6 * fade), 2));
        return <div key={i} style={{position: 'absolute', left: snap(X - s / 2, 2), top: snap(Y - s / 2, 2), width: s, height: s, background: c, opacity: Math.min(1, fade * 1.8), boxShadow: glow ? `0 0 ${s}px ${c}` : undefined}} />;
      })}
    </>
  );
};

/** Slow rising embers/dust motes across an area. */
export const Embers: FC<{count?: number; color?: string[]; area?: [number, number, number, number]; seed?: number; speed?: number; size?: number; opacity?: number}> = ({
  count = 26,
  color = ['#ffb347', '#ff8a2a', '#ffd98a'],
  area = [0, 0, W, H],
  seed = 3,
  speed = 1,
  size = 8,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const rnd = mulberry32(seed);
  const [ax, ay, aw, ah] = area;
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const x0 = ax + rnd() * aw;
        const spd = (0.6 + rnd() * 1.4) * speed;
        const ph = rnd() * ah;
        const sway = 14 + rnd() * 30;
        const per = 60 + rnd() * 60;
        const y = ay + ah - ((ph + f * spd * 1.6) % ah);
        const x = x0 + Math.sin((f + i * 17) / per * Math.PI * 2) * sway;
        const edge = Math.min((y - ay) / 120, (ay + ah - y) / 120, 1);
        const s = size * (0.5 + rnd() * 0.6);
        const c = color[i % color.length];
        const tw = 0.55 + 0.45 * Math.sin((f + i * 9) / 5);
        return <div key={i} style={{position: 'absolute', left: snap(x, 2), top: snap(y, 2), width: snap(s, 2), height: snap(s, 2), background: c, opacity: clamp01(edge) * tw * opacity, boxShadow: `0 0 ${s * 1.6}px ${c}`}} />;
      })}
    </>
  );
};

/**
 * Vertical light pillar. `p` 0..1 = rise progress (and brightness), `h` = full height, `w` = width at the base.
 * Stepped, pixel-ish edges; no rings.
 */
export const Beam: FC<{x: number; y: number; h?: number; w?: number; color: string; p: number; fadeOut?: number; seed?: number}> = ({x, y, h = 760, w = 160, color, p, fadeOut = 0, seed = 5}) => {
  const f = useCurrentFrame();
  if (p <= 0) return null;
  const hh = h * EASE.out(clamp01(p));
  const o = clamp01(p * 1.4) * (1 - fadeOut);
  const flick = 0.85 + 0.15 * Math.sin(f * 0.7 + seed);
  const lay = (ww: number, a: number, c: string): CSSProperties => ({
    position: 'absolute',
    left: snap(x - ww / 2, 4),
    top: snap(y - hh, 4),
    width: snap(ww, 4),
    height: hh,
    background: `linear-gradient(0deg, ${rgba(c, a)} 0%, ${rgba(c, a * 0.75)} 45%, ${rgba(c, 0)} 100%)`,
    mixBlendMode: 'screen',
    opacity: o * flick,
    WebkitMaskImage: ww > w * 0.7 ? 'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)' : undefined,
  });
  const rnd = mulberry32(seed);
  return (
    <>
      <div style={lay(w * 1.9, 0.28, color)} />
      <div style={lay(w * 1.25, 0.45, color)} />
      <div style={lay(w * 0.62, 0.85, mix(color, '#ffffff', 0.55))} />
      <div style={lay(w * 0.22, 1, '#ffffff')} />
      {/* rising pixel motes */}
      {Array.from({length: 16}, (_, i) => {
        const bx = (rnd() - 0.5) * w * 1.4;
        const spd = 3 + rnd() * 4;
        const yy = ((rnd() * hh + f * spd) % Math.max(1, hh)) ;
        const s = 6 + Math.floor(rnd() * 3) * 2;
        return <div key={i} style={{position: 'absolute', left: snap(x + bx, 2), top: snap(y - yy, 2), width: s, height: s, background: i % 3 ? mix(color, '#fff', 0.6) : '#fff', opacity: o * (1 - yy / hh) * 0.95, boxShadow: `0 0 10px ${color}`}} />;
      })}
      {/* flat base glow on the floor */}
      <div style={{position: 'absolute', left: x - w * 1.5, top: y - 22, width: w * 3, height: 44, background: `radial-gradient(ellipse, ${rgba(mix(color, '#fff', 0.4), 0.9 * o)} 0%, ${rgba(color, 0)} 70%)`, mixBlendMode: 'screen'}} />
    </>
  );
};

/** Camera-shake wrapper: offset decays from `at` for `life` frames. */
export const Shake: FC<{at: number | number[]; life?: number; strength?: number; children: ReactNode}> = ({at, life = 12, strength = 16, children}) => {
  const f = useCurrentFrame();
  const ats = Array.isArray(at) ? at : [at];
  let dx = 0;
  let dy = 0;
  for (const a of ats) {
    const k = f - a;
    if (k >= 0 && k <= life) {
      const m = strength * (1 - k / life);
      const rnd = mulberry32(900 + k * 7 + a);
      dx += (rnd() * 2 - 1) * m;
      dy += (rnd() * 2 - 1) * m;
    }
  }
  return <AbsoluteFill style={{transform: `translate(${snap(dx, 2)}px, ${snap(dy, 2)}px)`}}>{children}</AbsoluteFill>;
};

/** Set to false by the transparent Layer wrappers: full-frame flashes would tint the footage underneath. */
export const FlashCtx = createContext(true);

/** White-hot full-frame flash (screen blended). */
export const Flash: FC<{at: number; life?: number; color?: string; peak?: number}> = ({at, life = 8, color = '#fff0c8', peak = 0.7}) => {
  const f = useCurrentFrame() - at;
  const on = useContext(FlashCtx);
  if (!on || f < 0 || f > life) return null;
  return <AbsoluteFill style={{background: color, opacity: peak * (1 - f / life), mixBlendMode: 'screen'}} />;
};

/** Pixel cross-shaped spark (4 rays) for hits and glints. `t` 0..1 life, centred on x,y. */
export const Glint: FC<{x: number; y: number; t: number; size?: number; color?: string}> = ({x, y, t, size = 80, color = '#fff6d0'}) => {
  if (t <= 0 || t >= 1) return null;
  const k = Math.sin(t * Math.PI);
  const arm = snap(size * k, 4);
  const th = Math.max(4, snap(size * 0.12 * k, 4));
  return (
    <>
      <div style={{position: 'absolute', left: snap(x - arm, 4), top: snap(y - th / 2, 4), width: arm * 2, height: th, background: color, boxShadow: `0 0 16px ${color}`}} />
      <div style={{position: 'absolute', left: snap(x - th / 2, 4), top: snap(y - arm, 4), width: th, height: arm * 2, background: color, boxShadow: `0 0 16px ${color}`}} />
      <div style={{position: 'absolute', left: snap(x - th * 1.5, 4), top: snap(y - th * 1.5, 4), width: th * 3, height: th * 3, background: '#fff'}} />
    </>
  );
};

/* ---------------------------------------------------------------- dungeon background */

const FlameCluster: FC<{x: number; y: number; f: number; seed: number; s?: number}> = ({x, y, f, seed, s = 10}) => {
  const t = Math.floor(f / 2) + seed * 7;
  const r = mulberry32(t);
  const hh = 3 + Math.floor(r() * 3);
  const sway = Math.floor(r() * 3) - 1;
  return (
    <>
      <div style={{position: 'absolute', left: x - 2 * s, top: y - 3 * s, width: 4 * s, height: 3 * s, background: C.ember, boxShadow: `0 0 ${3 * s}px ${C.ember}`}} />
      <div style={{position: 'absolute', left: x - 1.5 * s + sway * s * 0.5, top: y - (hh + 1) * s, width: 3 * s, height: (hh + 1) * s, background: C.torch}} />
      <div style={{position: 'absolute', left: x - s + sway * s * 0.5, top: y - (hh + 0) * s + s, width: 2 * s, height: hh * s, background: '#ffd23f'}} />
      <div style={{position: 'absolute', left: x - s / 2, top: y - (hh - 1) * s, width: s, height: (hh - 1) * s, background: '#fff6c8'}} />
    </>
  );
};

/** A wall torch whose flame tip is at (x, y). */
export const WallTorch: FC<{x: number; y: number; seed?: number; s?: number; tilt?: number}> = ({x, y, seed = 1, s = 14, tilt = 0}) => {
  const f = useCurrentFrame();
  const size = 16 * s;
  return (
    <>
      <div style={{position: 'absolute', left: x - size / 2, top: y - 6 * s + s, width: size, height: size, transform: `rotate(${tilt}deg)`, transformOrigin: '50% 90%'}}>
        <Img src={block('torch')} style={{width: size, height: size, ...px}} />
      </div>
      {/* iron bracket */}
      <div style={{position: 'absolute', left: x - 2.5 * s, top: y + 5 * s, width: 5 * s, height: 2 * s, background: '#2b2724', boxShadow: `inset 0 ${s / 2}px 0 #4a443f, 0 0 0 ${s / 3}px ${C.ink}`}} />
      <div style={{position: 'absolute', left: x - 1.5 * s, top: y + 7 * s, width: 3 * s, height: 4 * s, background: '#2b2724', boxShadow: `0 0 0 ${s / 3}px ${C.ink}`}} />
      <FlameCluster x={x} y={y + s} f={f} seed={seed} s={s * 0.8} />
    </>
  );
};

export const TORCH_L: [number, number] = [214, 336];
export const TORCH_R: [number, number] = [1706, 336];

const Vines: FC<{x: number; w: number; flip?: boolean; seed: number; len?: number}> = ({x, w, flip, seed, len = 3}) => {
  const f = useCurrentFrame();
  const rnd = mulberry32(seed);
  const cols = Math.round(w / 72);
  return (
    <>
      {Array.from({length: cols}, (_, i) => {
        const n = 1 + Math.floor(rnd() * len);
        const sway = Math.sin(f / 26 + i * 1.7 + seed) * 2.5;
        return (
          <div key={i} style={{position: 'absolute', left: x + (flip ? -(i + 1) * 72 : i * 72), top: -4, width: 72, transform: `skewX(${sway}deg)`, transformOrigin: '50% 0'}}>
            {Array.from({length: n}, (_, j) => (
              <div key={j} style={{width: 72, height: 72, backgroundImage: `url(${block('vine')})`, backgroundSize: '72px 72px', ...px, filter: 'sepia(1) hue-rotate(62deg) saturate(2.4) brightness(0.52)'}} />
            ))}
          </div>
        );
      })}
    </>
  );
};

/**
 * Dungeon set: stone-brick wall, two torches, pillars at the edges, cobwebs and vines in the top corners, floor with perspective tiles.
 * `dim` darkens everything but the torch pools (0..1), `warm` scales torch light, `floor` is the y of the floor line.
 * `pillars` adds the edge columns (they give the frame its weight, keep on for full-screen demos).
 */
export const DungeonBg: FC<{dim?: number; warm?: number; floor?: number; torches?: boolean; vignette?: number; embers?: boolean; focus?: [number, number, number]; children?: ReactNode}> = ({
  dim = 0,
  warm = 1,
  floor = 760,
  torches = true,
  vignette = 0.85,
  embers = true,
  focus,
  children,
}) => {
  const f = useCurrentFrame();
  const fl = (seed: number) => 0.82 + 0.1 * Math.sin(f * 0.53 + seed) + 0.08 * Math.sin(f * 1.31 + seed * 2.3);
  const lights: [number, number, number][] = [
    [TORCH_L[0], TORCH_L[1], fl(1)],
    [TORCH_R[0], TORCH_R[1], fl(4)],
  ];
  return (
    <AbsoluteFill style={{background: C.stone0, overflow: 'hidden'}}>
      {/* wall */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: floor, backgroundImage: `url(${block('stone_bricks')})`, backgroundSize: '128px 128px', ...px, filter: 'brightness(0.44) saturate(0.7) contrast(1.1)'}} />
      {/* big inset arch-ish wall panel, slightly darker, gives depth */}
      <div style={{position: 'absolute', left: 360, top: 0, width: 1200, height: floor, background: 'linear-gradient(90deg, rgba(0,0,0,.5), rgba(0,0,0,.18) 18%, rgba(0,0,0,.18) 82%, rgba(0,0,0,.5))'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: floor, background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,.35) 100%)'}} />
      {/* baseboard */}
      <div style={{position: 'absolute', left: 0, top: floor - 36, width: W, height: 36, backgroundImage: `url(${block('polished_blackstone_bricks')})`, backgroundSize: '72px 36px', ...px, filter: 'brightness(0.5)', borderTop: `4px solid #4a3f38`, boxShadow: '0 -6px 0 rgba(0,0,0,.4)'}} />
      {/* floor */}
      <div style={{position: 'absolute', left: 0, right: 0, top: floor, bottom: 0, perspective: 720, perspectiveOrigin: '50% 0%', overflow: 'hidden', background: C.stone0}}>
        <div style={{position: 'absolute', left: '-60%', width: '220%', top: 0, height: 2600, transformOrigin: '50% 0%', transform: 'rotateX(66deg)', backgroundImage: `url(${block('deepslate_tiles')})`, backgroundSize: '128px 128px', ...px, filter: 'brightness(0.55) saturate(0.7)'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,6,4,.75) 0%, rgba(10,6,4,0) 35%, rgba(5,3,2,.55) 100%)'}} />
      </div>
      {/* pillars */}
      {[0, 1].map((side) => (
        <div key={side} style={{position: 'absolute', left: side ? W - 150 : 0, top: 0, width: 150, height: floor + 40}}>
          <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${block('deepslate_bricks')})`, backgroundSize: '96px 96px', ...px, filter: 'brightness(0.62) saturate(0.8)'}} />
          <div style={{position: 'absolute', inset: 0, background: side ? 'linear-gradient(270deg, rgba(0,0,0,.65), rgba(0,0,0,0) 55%, rgba(0,0,0,.5))' : 'linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,0) 55%, rgba(0,0,0,.5))'}} />
          <div style={{position: 'absolute', [side ? 'left' : 'right']: -6, top: 0, width: 12, height: '100%', background: 'linear-gradient(180deg, #3a322c, #1a1512)', boxShadow: '0 0 0 4px #0d0a08'}} />
          {/* capital / base */}
          <div style={{position: 'absolute', left: -10, right: -10, top: 0, height: 56, backgroundImage: `url(${block('chiseled_stone_bricks')})`, backgroundSize: '56px 56px', ...px, filter: 'brightness(0.55)', borderBottom: '6px solid #0d0a08'}} />
          <div style={{position: 'absolute', left: -10, right: -10, top: floor - 60, height: 100, backgroundImage: `url(${block('chiseled_stone_bricks')})`, backgroundSize: '56px 56px', ...px, filter: 'brightness(0.5)', borderTop: '6px solid #0d0a08'}} />
        </div>
      ))}
      {/* torches */}
      {torches && (
        <>
          <WallTorch x={TORCH_L[0]} y={TORCH_L[1]} seed={1} />
          <WallTorch x={TORCH_R[0]} y={TORCH_R[1]} seed={4} />
        </>
      )}
      {/* torch light pools */}
      {torches &&
        lights.map(([lx, ly, k], i) => (
          <div key={i}>
            <div style={{position: 'absolute', left: lx - 560, top: ly - 460, width: 1120, height: 920, background: `radial-gradient(ellipse at 50% 50%, ${rgba('#ff8a2a', 0.34 * k * warm)} 0%, ${rgba('#ff7a1a', 0.16 * k * warm)} 38%, rgba(255,120,20,0) 72%)`, mixBlendMode: 'screen'}} />
            <div style={{position: 'absolute', left: lx - 150, top: ly - 130, width: 300, height: 260, background: `radial-gradient(ellipse, ${rgba('#ffd98a', 0.4 * k * warm)} 0%, rgba(255,200,100,0) 70%)`, mixBlendMode: 'screen'}} />
            {/* reflection on the floor */}
            <div style={{position: 'absolute', left: lx - 340, top: floor + 20, width: 680, height: 200, background: `radial-gradient(ellipse, ${rgba('#ff8a2a', 0.26 * k * warm)} 0%, rgba(255,120,20,0) 70%)`, mixBlendMode: 'screen'}} />
          </div>
        ))}
      {focus && <div style={{position: 'absolute', left: focus[0] - focus[2], top: focus[1] - focus[2] * 0.75, width: focus[2] * 2, height: focus[2] * 1.5, background: 'radial-gradient(ellipse, rgba(255,170,70,.22) 0%, rgba(255,140,40,0) 70%)', mixBlendMode: 'screen'}} />}
      {/* top corner dressing */}
      <Vines x={150} w={360} seed={11} len={3} />
      <Vines x={W - 150} w={360} flip seed={29} len={3} />
      <div style={{position: 'absolute', left: 150, top: 0, width: 192, height: 192, backgroundImage: `url(${block('cobweb')})`, backgroundSize: '192px 192px', ...px, opacity: 0.55, filter: 'brightness(1.1)'}} />
      <div style={{position: 'absolute', left: W - 342, top: 0, width: 192, height: 192, backgroundImage: `url(${block('cobweb')})`, backgroundSize: '192px 192px', ...px, opacity: 0.55, transform: 'scaleX(-1)', filter: 'brightness(1.1)'}} />
      {embers && <Embers count={22} area={[120, 120, W - 240, floor + 120]} seed={5} size={8} opacity={0.8} />}
      {dim > 0 && <AbsoluteFill style={{background: `rgba(6,3,2,${dim})`}} />}
      {children}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 44%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- panels */

/** Gold-bordered panel: ink outline, gold bevel, dark wood or stone interior with real block texture, corner studs. */
export const Frame: FC<{w: number | string; h: number | string; mat?: 'wood' | 'stone' | 'dark'; pad?: number; studs?: boolean; border?: number; style?: CSSProperties; inner?: CSSProperties; children?: ReactNode}> = ({
  w,
  h,
  mat = 'wood',
  pad = 24,
  studs = true,
  border = 10,
  style,
  inner,
  children,
}) => {
  const tile = mat === 'wood' ? 'dark_oak_planks' : mat === 'stone' ? 'deepslate_bricks' : 'polished_blackstone';
  const bri = mat === 'wood' ? 0.42 : mat === 'stone' ? 0.4 : 0.35;
  return (
    <div style={{position: 'relative', width: w, height: h, boxSizing: 'border-box', background: GOLD_EDGE, padding: border, boxShadow: `0 0 0 4px ${C.ink}, 0 14px 0 4px rgba(0,0,0,.55), 0 30px 60px rgba(0,0,0,.6)`, flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: border, background: C.ink}} />
      <div style={{position: 'absolute', inset: border + 4, backgroundImage: `url(${block(tile)})`, backgroundSize: '64px 64px', ...px, filter: `brightness(${bri}) saturate(0.9)`}} />
      <div style={{position: 'absolute', inset: border + 4, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,160,60,.10) 0%, rgba(0,0,0,.0) 50%, rgba(0,0,0,.45) 100%)', boxShadow: 'inset 0 0 0 2px rgba(255,200,110,.22), inset 0 -24px 48px rgba(0,0,0,.45)'}} />
      <div style={{position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', padding: pad, ...inner}}>{children}</div>
      {studs &&
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([a, b], i) => (
          <div key={i} style={{position: 'absolute', [a ? 'right' : 'left']: -12, [b ? 'bottom' : 'top']: -12, width: 28, height: 28, background: 'linear-gradient(135deg,#fff0b0,#e0a02c 50%,#7a4d10)', boxShadow: `0 0 0 4px ${C.ink}, inset -4px -4px 0 rgba(0,0,0,.25)`}} />
        ))}
    </div>
  );
};

/** Parchment sheet with burnt edges and ragged border. `rag` seeds the torn outline. */
export const Parchment: FC<{w: number; h: number; rag?: number; style?: CSSProperties; children?: ReactNode}> = ({w, h, rag = 3, style, children}) => {
  const r = mulberry32(rag * 31 + 7);
  const pts: string[] = [];
  const step = 40;
  const jit = () => Math.round(r() * 9);
  for (let x = 0; x <= w; x += step) pts.push(`${x}px ${jit()}px`);
  for (let y = step; y <= h; y += step) pts.push(`${w - jit()}px ${y}px`);
  for (let x = w - step; x >= 0; x -= step) pts.push(`${x}px ${h - jit()}px`);
  for (let y = h - step; y > 0; y -= step) pts.push(`${jit()}px ${y}px`);
  return (
    <div style={{position: 'relative', width: w, height: h, filter: 'drop-shadow(0 14px 0 rgba(0,0,0,.45)) drop-shadow(0 0 0 #000)', flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: 0, clipPath: `polygon(${pts.join(',')})`, background: `radial-gradient(ellipse at 50% 45%, ${C.parch2} 0%, ${C.parch1} 55%, ${C.parch0} 88%, #7a5a2a 100%)`}}>
        <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 70px rgba(80,40,10,.75), inset 0 0 0 6px rgba(70,40,10,.45)'}} />
        {/* fibre lines */}
        {Array.from({length: Math.floor(h / 36)}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: 24 + (i % 3) * 30, top: 30 + i * 36, width: w - 90 - (i % 4) * 40, height: 2, background: 'rgba(110,70,20,.10)'}} />
        ))}
      </div>
      {children}
    </div>
  );
};

/** Rarity-coloured corner brackets around a box (inset by `m`). */
export const Brackets: FC<{w: number; h: number; color: string; len?: number; th?: number; m?: number; opacity?: number}> = ({w, h, color, len = 36, th = 6, m = 0, opacity = 1}) => (
  <>
    {[
      [0, 0, 1, 1],
      [1, 0, -1, 1],
      [0, 1, 1, -1],
      [1, 1, -1, -1],
    ].map(([a, b], i) => (
      <div key={i} style={{position: 'absolute', left: a ? w - len - m : m, top: b ? h - len - m : m, width: len, height: len, opacity}}>
        <div style={{position: 'absolute', [a ? 'right' : 'left']: 0, [b ? 'bottom' : 'top']: 0, width: len, height: th, background: color}} />
        <div style={{position: 'absolute', [a ? 'right' : 'left']: 0, [b ? 'bottom' : 'top']: 0, width: th, height: len, background: color}} />
      </div>
    ))}
  </>
);

/** Heraldic shield (clip-path) with a gold rim and an item or glyph inside. size = width. */
export const Crest: FC<{size: number; color?: string; lit?: number; icon?: string; style?: CSSProperties}> = ({size, color = C.gold2, lit = 1, icon, style}) => {
  const hgt = size * 1.2;
  const shield = 'polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)';
  const inset = size * 0.1;
  return (
    <div style={{position: 'relative', width: size, height: hgt, filter: `drop-shadow(0 6px 0 rgba(0,0,0,.5)) ${lit > 0.5 ? `drop-shadow(0 0 ${size * 0.25 * lit}px ${color})` : ''}`, flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: 0, clipPath: shield, background: C.ink}} />
      <div style={{position: 'absolute', inset: 4, clipPath: shield, background: GOLD_EDGE}} />
      <div style={{position: 'absolute', left: inset, top: inset, right: inset, bottom: inset * 1.4, clipPath: shield, background: lit > 0 ? `linear-gradient(180deg, ${mix('#2a1a10', color, lit * 0.85)} 0%, ${mix('#1a0f08', color, lit * 0.5)} 100%)` : '#1c140e'}} />
      {icon && (
        <div style={{position: 'absolute', left: 0, right: 0, top: size * 0.12, display: 'flex', justifyContent: 'center', opacity: 0.35 + 0.65 * lit}}>
          <Item id={icon} size={size * 0.56} />
        </div>
      )}
    </div>
  );
};

/** Four crests in the screen corners. `lit` is a per-corner 0..1 array (TL, TR, BL, BR). */
export const CornerCrests: FC<{lit: number[]; size?: number; margin?: number; icons?: string[]; color?: string}> = ({lit, size = 96, margin = 60, icons = ['iron_sword', 'bow', 'shield', 'totem_of_undying'], color}) => (
  <>
    {[
      [margin, margin],
      [W - margin - size, margin],
      [margin, H - margin - size * 1.2],
      [W - margin - size, H - margin - size * 1.2],
    ].map(([x, y], i) => (
      <div key={i} style={{position: 'absolute', left: x, top: y}}>
        <Crest size={size} lit={lit[i] ?? 0} icon={icons[i] === 'shield' ? 'iron_chestplate' : icons[i]} color={color} />
      </div>
    ))}
  </>
);

/** Cursor arrow in the pixel style. */
export const Cursor: FC<{x: number; y: number; press?: number}> = ({x, y, press = 0}) => {
  const rows = ['X', 'XX', 'XWX', 'XWWX', 'XWWWX', 'XWWWWX', 'XWWWWWX', 'XWWWWWWX', 'XWWWWWWWX', 'XWWWWWXXXX', 'XWWXWWX', 'XWX XWWX', 'XX  XWWX', '     XWWX', '     XXX'];
  const s = 5 - press;
  return (
    <svg width={10 * s} height={15 * s} style={{position: 'absolute', left: x, top: y, overflow: 'visible', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,.45))'}} shapeRendering="crispEdges">
      {rows.flatMap((row, j) => [...row].map((c, i) => (c === ' ' ? null : <rect key={`${i}-${j}`} x={i * s} y={j * s} width={s} height={s} fill={c === 'X' ? '#000' : '#fff'} />)))}
    </svg>
  );
};

/** Plain item slot: dark inset square with a coloured edge. */
export const DSlot: FC<{size?: number; edge?: string; glow?: number; sel?: boolean; style?: CSSProperties; children?: ReactNode}> = ({size = 96, edge = '#6a5538', glow = 0, sel, style, children}) => (
  <div
    style={{
      position: 'relative',
      width: size,
      height: size,
      boxSizing: 'border-box',
      background: 'linear-gradient(180deg, #1a120c 0%, #0f0a07 100%)',
      border: `4px solid ${sel ? C.gold2 : edge}`,
      boxShadow: `inset 0 0 0 3px ${C.ink}, inset 0 6px 14px rgba(0,0,0,.7), 0 0 0 3px ${C.ink}${glow > 0 ? `, 0 0 ${24 * glow}px ${sel ? C.gold2 : edge}` : ''}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      ...style,
    }}
  >
    {children}
  </div>
);
