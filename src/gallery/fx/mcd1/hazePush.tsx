// mcd-t-haze-push: a bank of volumetric haze is pushed across the frame from the right. Two parallax layers of billowy fog (soft value-noise textures,
//   denser near the ground), a thick core that fully hides the cut, drifting motes inside it. Both shots lose colour and pick up a little blur
//   while the haze sits on them.   Props: color (fog RGB, default pale blue-grey).   Layer = the fog alone.
import {useLayoutEffect, useRef, type FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, hash, lerp, mEntry, plate, ss, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 64;
const CUT = 33;
type RGB = [number, number, number];

// ---------------------------------------------------------------- fog textures (cached)
const TW = 480;
const TH = 270;
const texCache = new Map<string, HTMLCanvasElement>();

const vnoise = (x: number, y: number, period: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const m = (a: number) => ((a % period) + period) % period;
  const a = hash(m(xi), yi, seed);
  const b = hash(m(xi + 1), yi, seed);
  const c = hash(m(xi), yi + 1, seed);
  const d = hash(m(xi + 1), yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

const fogTex = (key: string, seed: number, scale: number, color: RGB) => {
  const k = `${key}|${seed}|${scale}|${color.join()}`;
  let cv = texCache.get(k);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = TW;
  cv.height = TH;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(TW, TH);
  const base = 6 * scale; // cells across the (wrapping) width
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      const u = (x / TW) * base;
      const v = (y / TH) * base * 0.56;
      const n = vnoise(u, v, Math.round(base), seed) * 0.55 + vnoise(u * 2, v * 2, Math.round(base * 2), seed + 1) * 0.3 + vnoise(u * 4, v * 4, Math.round(base * 4), seed + 2) * 0.15;
      const vy = y / TH;
      const ground = 0.42 + 0.58 * Math.pow(vy, 0.9); // denser near the bottom
      const a = Math.min(1, Math.max(0, (n - 0.3) * 2.4)) * ground;
      const lit = 0.82 + 0.35 * (n - 0.45) - 0.12 * vy;
      const i = (y * TW + x) * 4;
      img.data[i] = Math.min(255, color[0] * lit + 14);
      img.data[i + 1] = Math.min(255, color[1] * lit + 14);
      img.data[i + 2] = Math.min(255, color[2] * lit + 16);
      img.data[i + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  texCache.set(k, cv);
  return cv;
};

/** Centre of the haze bank (px) over time: right -> left. */
const bankX = (t: number) => lerp(2750, -820, 0.45 * clamp01(t / T) + 0.55 * EASE.inOut(clamp01(t / T)));
const cover = (t: number) => Math.exp(-Math.pow((t - CUT) / 17, 2)); // 0..1, peak at the cut

const drawFog = (ctx: CanvasRenderingContext2D, t: number, color: RGB) => {
  ctx.clearRect(0, 0, 1920, 1080);
  const xc = bankX(t);
  const cov = cover(t);
  const t1 = fogTex('a', 3, 1, color);
  const t2 = fogTex('b', 11, 1.6, [color[0] * 0.93, color[1] * 0.95, color[2] * 1.02]);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const draw = (cv: HTMLCanvasElement, scroll: number, alpha: number, yOff: number, k: number) => {
    const w = 1920 * k;
    const h = 1080 * k;
    const off = ((scroll % w) + w) % w;
    ctx.globalAlpha = alpha;
    for (let x = -off - w; x < 1920; x += w) ctx.drawImage(cv, Math.round(x), yOff, w + 1, h);
  };
  draw(t1, t * 14, 1, 0, 1.15);
  draw(t2, t * 34, 0.9, -40, 1.35);
  // a thick uniform core so the cut is fully hidden
  ctx.globalAlpha = Math.pow(cov, 1.6) * 0.92;
  const core = ctx.createLinearGradient(0, 0, 0, 1080);
  core.addColorStop(0, `rgba(${color[0] + 10},${color[1] + 12},${color[2] + 14},0.85)`);
  core.addColorStop(1, `rgba(${color[0] - 14},${color[1] - 10},${color[2] - 4},1)`);
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalAlpha = 1;
  // shape of the bank: horizontal density profile
  const wBank = 650 + 1000 * cov;
  ctx.globalCompositeOperation = 'destination-in';
  const gr = ctx.createLinearGradient(0, 0, 1920, 0);
  const stops = 24;
  for (let i = 0; i <= stops; i++) {
    const x = (i / stops) * 1920;
    const d = Math.exp(-Math.pow((x - xc) / wBank, 2));
    gr.addColorStop(i / stops, `rgba(0,0,0,${Math.min(1, d * (1.05 + 0.5 * cov)).toFixed(3)})`);
  }
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalCompositeOperation = 'source-over';
};

const FogCanvas: FC<{t: number; color: RGB}> = ({t, color}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) drawFog(ref.current.getContext('2d')!, t, color);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{...FULL, width: '100%', height: '100%'}} />;
};

export const makeHazeOverlay = (color: RGB): FC<OverlayProps> => ({f}) => {
  const xc = bankX(f);
  return (
    <AbsoluteFill>
      <FogCanvas t={f} color={color} />
      {/* motes drifting inside the bank */}
      {Array.from({length: 34}, (_, i) => {
        const y = 120 + hash(i, 1, 21) * 860;
        const x = xc + (hash(i, 2, 21) - 0.5) * 1500 + Math.sin(f * 0.1 + i) * 14 - f * (2 + hash(i, 3, 21) * 4);
        const d = Math.abs(x - xc) / 760;
        const a = (1 - d) * (0.35 + 0.65 * Math.abs(Math.sin(f * 0.25 + i * 3)));
        if (a <= 0 || x < -20 || x > 1940) return null;
        const q = hash(i, 4, 21) > 0.7 ? 12 : 8;
        return <div key={i} style={{position: 'absolute', left: Math.round(x / 4) * 4, top: Math.round(y / 4) * 4, width: q, height: q, background: '#EAF2FA', opacity: Math.min(0.85, a)}} />;
      })}
    </AbsoluteFill>
  );
};

export const makeHazeDef = (color: RGB = [176, 196, 218]): MDef => {
  const Overlay = makeHazeOverlay(color);
  const Scene: FC<SceneProps> = ({f, A, B, p}) => {
    const cov = cover(f);
    const k = clamp01((f - CUT) / (T - CUT));
    const grade = `blur(${(2.6 * cov).toFixed(2)}px) saturate(${1 - 0.5 * cov}) brightness(${1 + 0.1 * cov})`;
    return (
      <AbsoluteFill>
        {f < CUT && (
          <div style={{...FULL, filter: grade, transform: `scale(${1 + 0.03 * ss(0, CUT, f)})`}}>
            <A />
          </div>
        )}
        {f >= CUT && (
          <div style={{...FULL, filter: grade, transform: `scale(${lerp(1.03, 1, EASE.out(k))})`}}>
            <B />
          </div>
        )}
        {p > 0 && p < 1 && <Overlay p={p} f={f} />}
      </AbsoluteFill>
    );
  };
  return {
    frames: T,
    Scene,
    Overlay,
    cues: [
      {at: CUT - 6, src: 'mc:item/armor/equip_leather1', volume: 0.3, rate: 0.8},
    ],
  };
};

export const hazePushDef = makeHazeDef();
export const hazePushPair = {A: plate('forest-night', {frameOffset: 70}), B: plate('forest-day')};

export const hazePushEntry = mEntry(
  hazePushDef,
  {
    id: 'mcd-t-haze-push',
    name: '地下城·薄雾推过',
    tags: ['地下城', '转场', '体积雾', '薄雾', '氛围'],
    blurb: '一团两层视差的体积雾带从右侧推过画面，越近地面越浓，雾最厚处把切换完全藏住；雾中飘着细小光尘，A/B 在雾里褪色并带一点虚化，雾散后 B 缓缓落定。',
    usage: '时间流逝、天亮/入夜、潜入/穿越山谷等"悄悄换景"的衔接；比黑场更柔和，适合氛围向镜头。',
    params: [
      {name: 'color', desc: 'makeHazeDef([r,g,b]) 雾色，默认冷灰蓝 [176,196,218]；下界可用暖红灰，末地可用紫粉'},
      {name: 'T / CUT', desc: '总帧数 64、雾最厚的切换帧 33'},
    ],
  },
  hazePushPair.A,
  hazePushPair.B,
);
