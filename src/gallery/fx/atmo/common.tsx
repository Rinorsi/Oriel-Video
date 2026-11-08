import {useLayoutEffect, useRef} from 'react';
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PIXEL_FONT} from '../../../mc/fonts';
import {clamp01} from '../../../mc/theme';
import {OutlineText, hudTex} from '../../../reel/kit';
import {PlateA, PlateB} from '../../plates';
import {Img} from 'remotion';

/** Shared helpers for the atmosphere layers: math, deterministic hashing, canvas layer, demo stage, HUD bits. */

export const W = 1920;
export const H = 1080;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  in: (t: number) => t * t * t,
  back: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/** Deterministic value in [0,1) from up to three integers. Never Math.random. */
export const hash = (a: number, b = 0, c = 0): number => {
  let h = (Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x165667b1, 0x85ebca6b) ^ Math.imul((c | 0) + 0x9e3779b9, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};

export type RGB = [number, number, number];
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgbStr = (c: RGB) => `${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])}`;
export const rgba = (c: RGB, a: number) => `rgba(${rgbStr(c)},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** Radial gradient stops following a smooth power curve (no visible linear "ring"). From r0 to r1 (fractions of the gradient radius). */
export const curveStops = (c: RGB, alpha: number, r0: number, r1: number, power = 2, n = 14): string => {
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = t * t * (3 - 2 * t);
    out.push(`${rgba(c, alpha * Math.pow(s, power / 2 + 0.2))} ${((r0 + (r1 - r0) * t) * 100).toFixed(2)}%`);
  }
  return out.join(',');
};

/** Radial gradient whose 100% is the far corner of the frame (so sides sit at ~71%). */
export const cornerEllipse = (cx = 0.5, cy = 0.5) => {
  const dx = Math.max(cx, 1 - cx) * W;
  const dy = Math.max(cy, 1 - cy) * H;
  // An ellipse with the frame's aspect that passes through the far corner.
  const k = Math.SQRT2;
  void dx;
  void dy;
  return `ellipse ${((W / 2) * k).toFixed(1)}px ${((H / 2) * k).toFixed(1)}px at ${(cx * W).toFixed(1)}px ${(cy * H).toFixed(1)}px`;
};

/** Canvas layer at frame size. `draw` is called on every render with the current frame. */
export const Cv: FC<{draw: (ctx: CanvasRenderingContext2D, f: number) => void; w?: number; h?: number; style?: CSSProperties}> = ({draw, w = W, h = H, style}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    draw(ctx, f);
  });
  return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, ...style}} />;
};

/** Per-frame random noise, drawn at (W/scale)x(H/scale) and scaled up. rgb is the noise colour; alpha is per-pixel random up to `amount`. */
export const Noise: FC<{amount?: number; scale?: number; seed?: number; rgb?: RGB; mono?: boolean; every?: number; style?: CSSProperties}> = ({amount = 0.1, scale = 2, seed = 1, rgb, mono = false, every = 1, style}) => {
  const f = useCurrentFrame();
  const w = Math.round(W / scale);
  const h = Math.round(H / scale);
  const ref = useRef<HTMLCanvasElement>(null);
  const step = Math.floor(f / every);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    let s = (Math.imul(step + 1, 0x9e3779b1) ^ Math.imul(seed, 0x85ebca6b)) >>> 0 || 1;
    for (let i = 0; i < d.length; i += 4) {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      const v = s & 255;
      const a = ((s >>> 8) & 255) / 255;
      if (rgb) {
        d[i] = rgb[0];
        d[i + 1] = rgb[1];
        d[i + 2] = rgb[2];
        d[i + 3] = Math.round(a * a * 255 * amount);
      } else {
        const g = mono ? v : v > 127 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = g;
        d[i + 3] = Math.round(a * 255 * amount);
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, imageRendering: 'pixelated', ...style}} />;
};

/** Demo stage: a stand-in "footage" plate (A = day, B = night) with the layer on top. */
export const Stage: FC<{plate?: 'A' | 'B'; children?: ReactNode}> = ({plate = 'A', children}) => (
  <AbsoluteFill>
    {plate === 'A' ? <PlateA /> : <PlateB />}
    {children}
  </AbsoluteFill>
);

/** A row of ten hearts like the survival HUD. hp in half-hearts (0..20). */
export const HeartRow: FC<{hp: number; blink?: boolean; style?: CSSProperties; size?: number}> = ({hp, blink = false, style, size = 36}) => (
  <div style={{display: 'flex', gap: 0, ...style}}>
    {Array.from({length: 10}, (_, i) => {
      const full = hp >= (i + 1) * 2;
      const half = !full && hp >= i * 2 + 1;
      const b = blink ? '_blinking' : '';
      return (
        <div key={i} style={{position: 'relative', width: size - 4, height: size}}>
          <Img src={hudTex(`heart/container${b}`)} style={{position: 'absolute', left: 0, top: 0, width: size, height: size, imageRendering: 'pixelated'}} />
          {(full || half) && <Img src={hudTex(`heart/${full ? 'full' : 'half'}${b}`)} style={{position: 'absolute', left: 0, top: 0, width: size, height: size, imageRendering: 'pixelated'}} />}
        </div>
      );
    })}
  </div>
);

/** Small caption chip for demos ("light / medium / heavy", "06:00"). */
export const Tag: FC<{children: string; color?: string; style?: CSSProperties}> = ({children, color = '#ffffff', style}) => (
  <div style={{position: 'absolute', ...style}}>
    <OutlineText size={48} color={color}>
      {children}
    </OutlineText>
  </div>
);

export const PIXEL = PIXEL_FONT;
