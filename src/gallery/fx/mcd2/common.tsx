// mcd2 shared helpers: scene backdrop with grading, pixel particles, beam wrapper, centred rows, dark diamond frame.
// Everything is a pure function of useCurrentFrame(); no Math.random.
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {FxLayer, beam, ScenePlate, type BeamKind, type BiomeId} from '../mcdscene';
import {diamondPts, insetPoly, ptsStr} from '../mcdkit/kit';

export {Sfx, mcSound, reelSfx};
export const W = 1920;
export const H = 1080;

/** 0..1 progress of the window [at, at+dur]. */
export const win = (f: number, at: number, dur: number) => clamp01((f - at) / Math.max(1, dur));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const snap = (v: number, q: number) => Math.round(v / q) * q;
/** Quantise a 0..1 value to n hard steps (the game fades in steps, not smoothly). */
export const stepped = (t: number, n = 4) => Math.round(clamp01(t) * n) / n;
/** Fade in at `a`, fade out at `b` (both windows `d` frames), hard-stepped. */
export const inOut = (f: number, a: number, b: number, d = 6, steps = 4) => stepped(Math.min(win(f, a, d), 1 - win(f, b, d)), steps);
export {EASE, clamp01};

// ------------------------------------------------------------------------------------------------ scene backdrop

/**
 * A ScenePlate graded for use under effects. `dark` 0..1 darkens, `blur` px, `sat` saturation, `tint` an rgba wash.
 * The plate camera 'push' runs over `loop` frames (pass the effect length) so the shot slowly dollies in.
 */
export const Backdrop: FC<{
  biome: BiomeId;
  loop: number;
  dark?: number;
  blur?: number;
  sat?: number;
  bright?: number;
  tint?: string;
  camera?: 'drift' | 'push' | 'pull' | 'static';
  dof?: boolean;
  dim?: number;
  seed?: number;
  frameOffset?: number;
  children?: ReactNode;
}> = ({biome, loop, dark = 0, blur = 0, sat = 1, bright = 1, tint, camera = 'push', dof, dim = 0.2, seed, frameOffset, children}) => (
  <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <AbsoluteFill style={{filter: `${blur ? `blur(${blur}px) ` : ''}saturate(${sat}) brightness(${bright})`, transform: blur ? 'scale(1.04)' : undefined}}>
      <ScenePlate biome={biome} loop={loop} camera={camera} dof={dof} dim={dim} seed={seed} frameOffset={frameOffset} />
    </AbsoluteFill>
    {tint && <AbsoluteFill style={{background: tint}} />}
    {dark > 0 && <AbsoluteFill style={{background: `rgba(4,3,8,${dark})`}} />}
    {children}
  </AbsoluteFill>
);

/** Top-down darkening gradient (the victory / objective banner shade). */
export const TopShade: FC<{h?: number; alpha?: number; opacity?: number; side?: 'full' | 'right'}> = ({h = 480, alpha = 0.55, opacity = 1, side = 'full'}) => (
  <div
    style={{
      position: 'absolute',
      left: side === 'right' ? 960 : 0,
      right: 0,
      top: 0,
      height: h,
      opacity,
      background: `linear-gradient(180deg, rgba(2,2,6,${alpha}) 0%, rgba(2,2,6,${alpha * 0.55}) 55%, rgba(2,2,6,0) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Edge vignette in any colour: transparent in the middle, `color` at the corners. `inner` is where it starts (0..1 of radius). */
export const EdgeGlow: FC<{color: string; alpha?: number; inner?: number; opacity?: number}> = ({color, alpha = 0.8, inner = 0.42, opacity = 1}) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `radial-gradient(ellipse 78% 82% at 50% 50%, rgba(0,0,0,0) ${Math.round(inner * 100)}%, ${color} 100%)`,
      mixBlendMode: 'normal',
      pointerEvents: 'none',
      ['--a' as string]: alpha,
    }}
  />
);

// ------------------------------------------------------------------------------------------------ pixels

export const Sq: FC<{x: number; y: number; s: number; c: string; o?: number; style?: CSSProperties}> = ({x, y, s, c, o = 1, style}) => (
  <div style={{position: 'absolute', left: x, top: y, width: s, height: s, background: c, opacity: o, ...style}} />
);

/** Plus-shaped pixel flare centred on (x, y). `u` = pixel unit, `arm` = arm length in units. */
export const PxPlus: FC<{x: number; y: number; u?: number; arm?: number; c?: string; core?: string; o?: number}> = ({x, y, u = 6, arm = 3, c = '#FFE680', core = '#fff', o = 1}) => {
  const L = (arm * 2 + 1) * u;
  return (
    <div style={{opacity: o}}>
      <div style={{position: 'absolute', left: x - L / 2, top: y - u / 2, width: L, height: u, background: c}} />
      <div style={{position: 'absolute', left: x - u / 2, top: y - L / 2, width: u, height: L, background: c}} />
      <div style={{position: 'absolute', left: x - u * 1.5, top: y - u * 1.5, width: u * 3, height: u * 3, background: core}} />
    </div>
  );
};

/** Four-point pixel star (plus with a 3x3 core) that twinkles: t in 0..1 over its life. */
export const Twinkle: FC<{x: number; y: number; t: number; u?: number; c?: string}> = ({x, y, t, u = 4, c = '#FFF2B0'}) => {
  if (t <= 0 || t >= 1) return null;
  const s = Math.sin(t * Math.PI);
  const arm = Math.max(1, Math.round(s * 3));
  return <PxPlus x={snap(x, u)} y={snap(y, u)} u={u} arm={arm} c={c} o={0.4 + 0.6 * s} />;
};

export type Part = {x: number; y: number; vx: number; vy: number; g: number; drag: number; life: number; delay: number; size: number; color: string; kind: 'sq' | 'plus' | 'bar'};

export type PartSpec = {
  n: number;
  seed: number;
  x: number;
  y: number;
  /** half-width of the spawn area (px) and half-height */
  sx?: number;
  sy?: number;
  /** velocity: angle range (rad, 0 = right, -PI/2 = up) and speed range (px/frame) */
  a0?: number;
  a1?: number;
  v0?: number;
  v1?: number;
  g?: number;
  drag?: number;
  life0?: number;
  life1?: number;
  delay?: number;
  size0?: number;
  size1?: number;
  colors?: string[];
  kinds?: Part['kind'][];
};

export const genParts = (o: PartSpec): Part[] => {
  const r = mulberry32(o.seed);
  return Array.from({length: o.n}, () => {
    const a = (o.a0 ?? -Math.PI) + r() * ((o.a1 ?? Math.PI) - (o.a0 ?? -Math.PI));
    const v = (o.v0 ?? 4) + r() * ((o.v1 ?? 14) - (o.v0 ?? 4));
    const colors = o.colors ?? ['#fff'];
    const kinds = o.kinds ?? ['sq'];
    return {
      x: o.x + (r() - 0.5) * 2 * (o.sx ?? 0),
      y: o.y + (r() - 0.5) * 2 * (o.sy ?? 0),
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      g: o.g ?? 0,
      drag: o.drag ?? 0.08,
      life: (o.life0 ?? 24) + r() * ((o.life1 ?? 40) - (o.life0 ?? 24)),
      delay: r() * (o.delay ?? 0),
      size: (o.size0 ?? 6) + r() * ((o.size1 ?? 14) - (o.size0 ?? 6)),
      color: colors[Math.floor(r() * colors.length)],
      kind: kinds[Math.floor(r() * kinds.length)],
    };
  });
};

/** Renders particles that started at frame `at`; pixel-snapped squares / plus crosses / thin bars (rising sparks). */
export const Particles: FC<{parts: Part[]; at: number; grid?: number; fadeFrom?: number; glow?: boolean}> = ({parts, at, grid = 2, fadeFrom = 0.45, glow}) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  return (
    <>
      {parts.map((p, i) => {
        const t = f - p.delay;
        if (t < 0 || t > p.life) return null;
        const d = Math.max(0.001, p.drag);
        const k = (1 - Math.pow(1 - d, t)) / d;
        const x = p.x + p.vx * k;
        const y = p.y + p.vy * k + 0.5 * p.g * t * t;
        const u = t / p.life;
        const fade = u < fadeFrom ? 1 : 1 - (u - fadeFrom) / (1 - fadeFrom);
        const s = Math.max(2, snap(p.size * (0.55 + 0.45 * fade), 2));
        const o = clamp01(fade * 1.4) * (u > 0.7 && Math.floor(t) % 2 ? 0.55 : 1);
        const sh = glow ? `0 0 ${s * 1.5}px ${p.color}` : undefined;
        if (p.kind === 'plus') return <PxPlus key={i} x={snap(x, grid)} y={snap(y, grid)} u={Math.max(2, Math.round(s / 3))} arm={1} c={p.color} core="#fff" o={o} />;
        if (p.kind === 'bar') return <div key={i} style={{position: 'absolute', left: snap(x, grid), top: snap(y, grid), width: Math.max(2, Math.round(s / 3)), height: s * 2.2, background: p.color, opacity: o, boxShadow: sh}} />;
        return <div key={i} style={{position: 'absolute', left: snap(x, grid), top: snap(y, grid), width: s, height: s, background: p.color, opacity: o, boxShadow: sh}} />;
      })}
    </>
  );
};

// ------------------------------------------------------------------------------------------------ beams

const BEAMS = {
  magenta: {outer: '205,46,205', mid: '229,109,229', core: '254,248,254'},
  white: {outer: '200,205,215', mid: '232,236,246', core: '255,255,255'},
  green: {outer: '63,165,53', mid: '140,224,112', core: '240,255,232'},
  violet: {outer: '120,60,220', mid: '171,100,255', core: '240,228,255'},
  orange: {outer: '248,86,0', mid: '255,140,20', core: '255,228,176'},
} as const;

/**
 * DOM light beam from the ground point (x, y) to the top of the frame: wide soft halo, bright shaft, hard white core, flare at the base.
 * grow 0..1 reveals it from the bottom (the game bursts it out in 4 frames); width = shaft width in px.
 */
export const Beam: FC<{x: number; y: number; kind: keyof typeof BEAMS; width?: number; grow?: number; alpha?: number; flick?: number}> = ({x, y, kind, width = 160, grow = 1, alpha = 1, flick = 1}) => {
  if (grow <= 0 || alpha <= 0) return null;
  const c = BEAMS[kind];
  const h = y * grow;
  const mask = 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.45) 100%)';
  const col = (w: number, bg: string, extra?: CSSProperties) => (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, background: bg, WebkitMaskImage: mask, maskImage: mask, ...extra}} />
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: alpha * flick, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {col(width * 2.6, `linear-gradient(90deg, rgba(${c.outer},0) 0%, rgba(${c.outer},0.45) 35%, rgba(${c.outer},0.66) 50%, rgba(${c.outer},0.45) 65%, rgba(${c.outer},0) 100%)`)}
      {col(width, `linear-gradient(90deg, rgba(${c.mid},0) 0%, rgba(${c.mid},0.85) 20%, rgba(${c.mid},0.95) 50%, rgba(${c.mid},0.85) 80%, rgba(${c.mid},0) 100%)`)}
      {col(width * 0.42, `rgb(${c.core})`)}
      <svg style={{position: 'absolute', left: x - width * 1.5, top: y - width * 0.45, overflow: 'visible'}} width={width * 3} height={width * 0.9}>
        <defs>
          <radialGradient id={`bf${kind}`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={`rgb(${c.core})`} stopOpacity="0.95" />
            <stop offset="0.28" stopColor={`rgb(${c.mid})`} stopOpacity="0.7" />
            <stop offset="1" stopColor={`rgb(${c.outer})`} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={width * 3} height={width * 0.9} fill={`url(#bf${kind})`} />
      </svg>
    </div>
  );
};

/** Vertical light beam via the scene engine's canvas renderer (kept for reference; prefer <Beam>). */
export const BeamFx: FC<{x: number; y: number; kind: BeamKind; width?: number; grow?: number; alpha?: number; sparkles?: number; seed?: number}> = ({x, y, kind, width = 120, grow = 1, alpha = 1, sparkles = 14, seed = 0}) =>
  grow <= 0 || alpha <= 0 ? null : <FxLayer loop={120} draw={(ctx, v) => beam(ctx, v, {x, y, kind, width, grow, alpha, sparkles, seed})} />;

// ------------------------------------------------------------------------------------------------ layout helpers

/** Full-width row, content centred exactly (children are tight ink boxes). */
export const Row: FC<{y: number; children: ReactNode; gap?: number; style?: CSSProperties}> = ({y, children, gap = 0, style}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', alignItems: 'center', gap, ...style}}>{children}</div>
);

/** Absolute box centred on (cx, cy). */
export const At: FC<{cx: number; cy: number; children: ReactNode; style?: CSSProperties}> = ({cx, cy, children, style}) => (
  <div style={{position: 'absolute', left: cx, top: cy, width: 0, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', ...style}}>
    <div style={{flex: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{children}</div>
  </div>
);

/** Hard stepped drop-shadow block under a standing object: three stacked bars, widest at the bottom. */
export const GroundShadow: FC<{cx: number; y: number; w: number; o?: number; u?: number}> = ({cx, y, w, o = 0.5, u = 8}) => (
  <>
    {[0.62, 0.86, 1].map((k, i) => (
      <div key={i} style={{position: 'absolute', left: cx - (w * k) / 2, top: y + i * u, width: w * k, height: u, background: '#000', opacity: o * (0.55 + i * 0.2)}} />
    ))}
  </>
);

/** Flat isometric glow plate (a diamond-shaped light pool on the ground). */
export const IsoGlow: FC<{cx: number; cy: number; w: number; color: string; o?: number}> = ({cx, cy, w, color, o = 0.6}) => (
  <svg style={{position: 'absolute', left: cx - w / 2, top: cy - w * 0.25, overflow: 'visible', opacity: o}} width={w} height={w * 0.5}>
    <defs>
      <radialGradient id={`ig${color.replace(/\W/g, '')}`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={color} stopOpacity="0.95" />
        <stop offset="0.6" stopColor={color} stopOpacity="0.35" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <polygon points={`${w / 2},0 ${w},${w / 4} ${w / 2},${w / 2} 0,${w / 4}`} fill={`url(#ig${color.replace(/\W/g, '')})`} />
  </svg>
);

/**
 * Dark diamond frame with a thin coloured edge and a drop block (death skull frame, location marks).
 * `size` = full diagonal.
 */
export const DarkDiamond: FC<{size: number; edge?: string; edgeHi?: string; fill?: string; glow?: string; children?: ReactNode; style?: CSSProperties}> = ({size, edge = '#7A2E34', edgeHi = '#E8A070', fill = '#2E2D30', glow, children, style}) => {
  const r = size / 2;
  const u = size / 60;
  const d = diamondPts(r);
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', filter: glow ? `drop-shadow(0 0 ${size * 0.12}px ${glow})` : undefined, ...style}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <polygon points={ptsStr(d)} fill="#000" />
        <polygon points={ptsStr(insetPoly(d, u * 1.2))} fill={edge} />
        <polygon points={ptsStr(insetPoly(d, u * 1.9))} fill={edgeHi} opacity={0.9} />
        <polygon points={ptsStr(insetPoly(d, u * 3))} fill="#141214" />
        <polygon points={ptsStr(insetPoly(d, u * 4.2))} fill={fill} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
    </div>
  );
};

/** Frame-count helper for effects that expose their own `bg` flag. */
export const useF = useCurrentFrame;
