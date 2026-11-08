import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {block, tex} from './assets';
import {EASE, clamp01, mulberry32} from './theme';

const pixelated: CSSProperties = {imageRendering: 'pixelated'};

/**
 * Square pixel particles bursting from a point. Deterministic (seeded).
 * `at` is the frame the burst starts, relative to the enclosing Sequence.
 */
export const PixelBurst: FC<{
  x: number;
  y: number;
  at: number;
  count?: number;
  colors?: string[];
  speed?: number; // px per frame at start
  life?: number; // frames
  size?: number;
  gravity?: number;
  seed?: number;
}> = ({x, y, at, count = 40, colors = ['#FFFFFF', '#FFFF55', '#FFAA00'], speed = 22, life = 40, size = 14, gravity = 0.6, seed = 1}) => {
  const frame = useCurrentFrame() - at;
  if (frame < 0 || frame > life) return null;
  const rnd = mulberry32(seed);
  const parts = Array.from({length: count}, () => {
    const ang = rnd() * Math.PI * 2;
    const v = speed * (0.35 + rnd() * 0.65);
    return {vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - speed * 0.25, c: colors[Math.floor(rnd() * colors.length)], s: size * (0.5 + rnd() * 0.7), l: life * (0.6 + rnd() * 0.4)};
  });
  return (
    <>
      {parts.map((p, i) => {
        if (frame > p.l) return null;
        // Drag so the burst decelerates instead of flying off at constant speed.
        const k = (1 - Math.pow(0.9, frame)) / 0.1;
        const px = x + p.vx * k;
        const py = y + p.vy * k + 0.5 * gravity * frame * frame;
        const fade = 1 - frame / p.l;
        const s = Math.max(2, Math.round(p.s * (0.4 + 0.6 * fade)));
        return <div key={i} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, background: p.c, opacity: Math.min(1, fade * 1.6)}} />;
      })}
    </>
  );
};

/** Vanilla particle sprite (e.g. 'particle/glint.png') twinkling at fixed points around a target. */
export const Twinkles: FC<{x: number; y: number; radius: number; count?: number; size?: number; seed?: number; sprite?: string; white?: boolean}> = ({
  x,
  y,
  radius,
  count = 8,
  size = 40,
  seed = 7,
  sprite = 'particle/glint.png',
  // The vanilla glint sprite is green (villager "happy" style); white reads as sparkle on any rarity.
  white = true,
}) => {
  const frame = useCurrentFrame();
  const rnd = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const a = rnd() * Math.PI * 2;
        const r = radius * (0.5 + rnd() * 0.5);
        const period = 24 + Math.floor(rnd() * 20);
        const phase = Math.floor(rnd() * period);
        const t = ((frame + phase) % period) / period;
        const s = Math.sin(t * Math.PI);
        return (
          <Img
            key={i}
            src={tex(sprite)}
            style={{position: 'absolute', left: x + Math.cos(a) * r - size / 2, top: y + Math.sin(a) * r - size / 2, width: size, height: size, opacity: s, transform: `scale(${0.4 + s * 0.8})`, filter: white ? 'brightness(0) invert(1)' : undefined, ...pixelated}}
          />
        );
      })}
    </>
  );
};

/**
 * Impact burst for hits, landings and reveals: a pixel cross flare plus shards flying out in stepped trails.
 * (Replaces the old expanding ring, which read as unpackaged. Same props, so existing calls keep working:
 * `maxR` is how far the shards fly, `width` scales the shard size, `life` is in frames.)
 * Everything is snapped to a pixel grid, so it looks like game pixels, not vector shapes.
 */
export const Shockwave: FC<{x: number; y: number; at: number; color?: string; maxR?: number; life?: number; width?: number; rays?: number; seed?: number}> = ({
  x,
  y,
  at,
  color = '#FFFFFF',
  maxR = 520,
  life = 22,
  width = 24,
  rays = 14,
  seed = 1,
}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  const t = f / life;
  const P = Math.max(6, Math.round(Math.min(width, 24) / 4) * 2 + 2); // grid cell, px
  const snap = (v: number) => Math.round(v / P) * P;
  const rnd = mulberry32(Math.floor(x * 7 + y * 13 + at * 31 + seed));
  const out: ReactNode[] = [];
  // 1. cross flare: strong in the first third of the life, then gone
  const fl = clamp01(1 - t * 2.6);
  if (fl > 0) {
    const arm = snap(maxR * 0.16 * (0.5 + EASE.out(clamp01(t * 3)) * 0.9));
    const th = P * (fl > 0.5 ? 3 : 2);
    out.push(<div key="fh" style={{position: 'absolute', left: snap(x - arm), top: snap(y - th / 2), width: arm * 2, height: th, background: color, opacity: fl}} />);
    out.push(<div key="fv" style={{position: 'absolute', left: snap(x - th / 2), top: snap(y - arm), width: th, height: arm * 2, background: color, opacity: fl}} />);
    out.push(<div key="fc" style={{position: 'absolute', left: snap(x - P * 2), top: snap(y - P * 2), width: P * 4, height: P * 4, background: '#fff', opacity: fl}} />);
  }
  // 2. shards: stepped three-square trails flying outward
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    const reach = maxR * (0.55 + rnd() * 0.45);
    const lag = rnd() * 0.12;
    const p = EASE.out(clamp01((t - lag) / (1 - lag)));
    const fade = 1 - EASE.in(clamp01((t - 0.45) / 0.55));
    for (let j = 0; j < 3; j++) {
      const rr = reach * Math.max(0, p - j * 0.045) + P * 2;
      const sz = Math.max(P / 2, P * (1.6 - j * 0.5) * (0.55 + 0.45 * fade));
      out.push(
        <div
          key={`s${i}-${j}`}
          style={{position: 'absolute', left: snap(x + Math.cos(a) * rr - sz / 2), top: snap(y + Math.sin(a) * rr - sz / 2), width: sz, height: sz, background: j === 0 ? '#fff' : color, opacity: fade * (1 - j * 0.25)}}
        />,
      );
    }
  }
  // 3. debris squares with a little gravity
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2;
    const v = maxR * (0.25 + rnd() * 0.4);
    const p = EASE.out(t);
    const sz = P * (1 + Math.floor(rnd() * 2));
    out.push(<div key={`d${i}`} style={{position: 'absolute', left: snap(x + Math.cos(a) * v * p), top: snap(y + Math.sin(a) * v * p + t * t * maxR * 0.18), width: sz, height: sz, background: color, opacity: 1 - EASE.in(t)}} />);
  }
  return <>{out}</>;
};

/** Slowly rotating god rays behind a hero object. */
export const LightRays: FC<{x: number; y: number; size?: number; color?: string; opacity?: number; rays?: number}> = ({
  x,
  y,
  size = 1400,
  color = '255,220,120',
  opacity = 0.35,
  rays = 14,
}) => {
  const frame = useCurrentFrame();
  const stops: string[] = [];
  const step = 360 / rays;
  for (let i = 0; i < rays; i++) {
    stops.push(`rgba(${color},${opacity}) ${i * step}deg ${i * step + step * 0.35}deg`, `rgba(${color},0) ${i * step + step * 0.35}deg ${(i + 1) * step}deg`);
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        background: `conic-gradient(from ${frame * 0.4}deg, ${stops.join(',')})`,
        WebkitMaskImage: 'radial-gradient(circle, black 0%, black 18%, transparent 68%)',
        maskImage: 'radial-gradient(circle, black 0%, black 18%, transparent 68%)',
      }}
    />
  );
};

/** Full-frame white flash that decays. */
export const Flash: FC<{at: number; life?: number; color?: string; peak?: number}> = ({at, life = 10, color = '#FFFFFF', peak = 0.9}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  return <AbsoluteFill style={{background: color, opacity: peak * (1 - f / life), mixBlendMode: 'screen'}} />;
};

/** Camera shake wrapper. Strength decays over `life` frames from `at`. */
export const Shake: FC<{at: number; life?: number; strength?: number; children: ReactNode}> = ({at, life = 14, strength = 18, children}) => {
  const f = useCurrentFrame() - at;
  let dx = 0;
  let dy = 0;
  if (f >= 0 && f <= life) {
    const k = strength * (1 - f / life);
    const rnd = mulberry32(1000 + f);
    dx = (rnd() * 2 - 1) * k;
    dy = (rnd() * 2 - 1) * k;
  }
  return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px)`}}>{children}</AbsoluteFill>;
};

/** Tiled block texture background, the classic dirt/stone/netherrack screen, darkened. */
export const BlockBackdrop: FC<{texture: string; tile?: number; darken?: number; drift?: number; tint?: string}> = ({
  texture,
  tile = 128,
  darken = 0.55,
  drift = 0.4,
  tint,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${block(texture)})`,
          backgroundSize: `${tile}px ${tile}px`,
          backgroundPosition: `${frame * drift}px ${frame * drift * 0.5}px`,
          ...pixelated,
        }}
      />
      <AbsoluteFill style={{background: `rgba(0,0,0,${darken})`}} />
      {tint && <AbsoluteFill style={{background: tint, mixBlendMode: 'overlay'}} />}
      <Vignette />
    </AbsoluteFill>
  );
};

// Note: 26.x jars ship the title panorama as 1x1 placeholders, so there is no panorama backdrop.
// For a real world background, take an in-game screenshot (F2) and drop it into public/shots/.

export const Vignette: FC<{strength?: number}> = ({strength = 0.7}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`}} />
);

/** Pop-in with overshoot: scale 0 -> 1.15 -> 1. Returns a style. */
export const popIn = (frame: number, at: number, dur = 12): CSSProperties => {
  const p = clamp01((frame - at) / dur);
  const s = p === 0 ? 0 : EASE.back(p);
  return {transform: `scale(${s})`, opacity: p > 0 ? 1 : 0};
};

/** Slide in from a side with ease-out. */
export const slideIn = (frame: number, at: number, dur: number, from: {x?: number; y?: number}): CSSProperties => {
  const p = EASE.out(clamp01((frame - at) / dur));
  return {transform: `translate(${(from.x ?? 0) * (1 - p)}px, ${(from.y ?? 0) * (1 - p)}px)`, opacity: clamp01(p * 2)};
};

/** Fade helper with in/out ramps (frames, relative to sequence). */
export const fadeInOut = (frame: number, start: number, end: number, ramp = 8) =>
  interpolate(frame, [start, start + ramp, end - ramp, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
