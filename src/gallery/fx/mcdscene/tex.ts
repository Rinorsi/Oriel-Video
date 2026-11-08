// Texture loading for the mcdscene engine: real Minecraft PNGs decoded once into RGBA arrays.
import {staticFile} from 'remotion';

export type Tex = {name: string; w: number; h: number; frames: number; data: Uint8ClampedArray};

const cache = new Map<string, Tex>();
const pending = new Map<string, Promise<Tex>>();

/** Path relative to public/mc/textures, without extension, e.g. 'block/stone'. */
export const loadTexture = (name: string): Promise<Tex> => {
  const hit = cache.get(name);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(name);
  if (!p) {
    p = new Promise<Tex>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const g = c.getContext('2d', {willReadFrequently: true})!;
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height);
        const t: Tex = {name, w: c.width, h: c.height, frames: Math.max(1, Math.floor(c.height / c.width)), data: d.data};
        cache.set(name, t);
        resolve(t);
      };
      img.onerror = () => reject(new Error(`mcdscene: cannot load texture ${name}`));
      img.src = staticFile(`mc/textures/${name}.png`);
    });
    pending.set(name, p);
  }
  return p;
};

export const loadTextures = async (names: Iterable<string>): Promise<void> => {
  await Promise.all([...new Set(names)].map(loadTexture));
};
export const texesLoaded = (names: Iterable<string>) => [...names].every((n) => cache.has(n));
export const getTex = (name: string): Tex => {
  const t = cache.get(name);
  if (!t) throw new Error(`mcdscene: texture not loaded: ${name}`);
  return t;
};
export const hasTex = (name: string) => cache.has(name);

const canvasCache = new Map<string, HTMLCanvasElement>();
/** First frame of a loaded texture as a canvas (for ctx.drawImage with imageSmoothingEnabled=false). */
export const texCanvas = (name: string): HTMLCanvasElement => {
  let c = canvasCache.get(name);
  if (!c) {
    const t = getTex(name);
    c = document.createElement('canvas');
    c.width = t.w;
    c.height = t.w;
    const g = c.getContext('2d')!;
    const img = g.createImageData(t.w, t.w);
    img.data.set(t.data.subarray(0, t.w * t.w * 4));
    g.putImageData(img, 0, 0);
    canvasCache.set(name, c);
  }
  return c;
};
