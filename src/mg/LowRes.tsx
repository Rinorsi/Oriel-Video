import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FC} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {HEIGHT, WIDTH} from '../mc/theme';

/**
 * Low-resolution pixel canvas. Everything drawn here lives on a 480x270 grid and is blown up 4x
 * with nearest-neighbour scaling, so rings, rays, glows and particles all come out as hard
 * Minecraft-sized pixels instead of smooth vector shapes.
 */

export const PX = 4;
export const LW = WIDTH / PX;
export const LH = HEIGHT / PX;

const images = new Map<string, Promise<HTMLImageElement>>();

/** Cached image load (one request per URL per tab). */
export const loadImage = (src: string) => {
  let p = images.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`image failed to load: ${src}`));
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
};

/** Run an async loader once and hold the render until it resolves. */
export const useAssets = <T,>(key: string, load: () => Promise<T>): T | null => {
  const [value, setValue] = useState<T | null>(null);
  const [handle] = useState(() => delayRender(`Preparing ${key}`));
  useEffect(() => {
    let alive = true;
    load()
      .then((v) => {
        if (alive) setValue(v);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
    // The loader is keyed by `key`; it must not change between renders of the same key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handle]);
  return value;
};

export const LowRes: FC<{draw: (ctx: CanvasRenderingContext2D) => void; ready: boolean; style?: CSSProperties}> = ({draw, ready, style}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c || !ready) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, LW, LH);
    draw(ctx);
  });
  return <canvas ref={ref} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT, imageRendering: 'pixelated', ...style}} />;
};

/** A copy of (part of) an image filled with one colour, keeping its alpha. */
export const tint = (img: HTMLImageElement, color: string, sx = 0, sy = 0, sw = img.width, sh = img.height) => {
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, sw, sh);
  return c;
};

/** One-pixel-wide ring built from grid cells (no anti-aliasing). */
export const pixelRing = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, thick: number, color: string) => {
  ctx.fillStyle = color;
  const seen = new Set<number>();
  for (let t = 0; t < thick; t++) {
    const rr = r - t;
    if (rr <= 0) break;
    const n = Math.ceil(rr * 7);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * rr);
      const y = Math.round(cy + Math.sin(a) * rr);
      const key = x * 4096 + y;
      if (seen.has(key)) continue;
      seen.add(key);
      ctx.fillRect(x, y, 1, 1);
    }
  }
};

/** Snap a screen-space offset to the pixel grid, so shakes don't break the pixel look. */
export const snap = (v: number) => Math.round(v / PX) * PX;
