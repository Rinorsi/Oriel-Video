import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {tex} from '../../../mc/assets';
import {EASE, HEIGHT, WIDTH, mulberry32} from '../../../mc/theme';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {ewin, hash2, mix, win} from './common';

/**
 * t2-enchant-veil : a slanted curtain of glowing enchantment-glint texture sweeps left to right.
 * B is revealed behind it (B is clipped to the left of the veil's centre line, which the veil hides).
 * The veil carries columns of standard-galactic runes; rune and glint particles spray off the leading edge
 * and glyphs drift through the whole frame. Dual-type.
 * Params: BW (veil width), TILT (slant), glint scroll speeds in <Veil>, rune colour in <Glyph>.
 */

const T = 50;
const W = WIDTH;
const H = HEIGHT;
const BW = 1100;
const TILT = 0.22; // px of x per px of y
const SKEW = (Math.atan(TILT) * 180) / Math.PI;
const STEP = 24;
const ROWS = Math.ceil(H / STEP) + 2;

const centerX = (p: number) => mix(-BW * 0.52, W + BW * 0.52, 0.45 * win(p, 0.03, 0.97) + 0.55 * ewin(p, 0.03, 0.97, EASE.inOut));
const quant = (v: number, q: number) => Math.round(v / q) * q;

/** Local (unskewed) edge offset of the veil at row y. side: -1 left, 0 centre, 1 right. */
const wob = (y: number, f: number, side: number) => {
  if (side === 0) return quant(Math.sin(y / 61 + f * 0.17) * 14, 8);
  return quant(Math.sin(y / 70 + f * 0.2 + side * 1.9) * 30 + Math.sin(y / 23 - f * 0.33 + side) * 9, 8);
};

/** Edge x in local band coordinates (0 = left of the band box). */
const localEdge = (y: number, f: number, side: number) => (side === -1 ? 0 : side === 1 ? BW : BW / 2) + wob(y, f, side);

const toGlobalX = (xl: number, y: number, p: number) => xl + centerX(p) - BW / 2 + (y - H / 2) * TILT;

const polyLocal = (f: number, inset: number) => {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < ROWS; i++) {
    const y0 = i * STEP - STEP;
    const y1 = y0 + STEP;
    const l = localEdge(y0 + STEP / 2, f, -1) + inset;
    const r = localEdge(y0 + STEP / 2, f, 1) - inset;
    left.push(`${l}px ${y0}px`, `${l}px ${y1}px`);
    right.unshift(`${r}px ${y1}px`, `${r}px ${y0}px`);
  }
  return `polygon(${[...left, ...right].join(',')})`;
};

/** B clip: everything left of the veil centre line (global coordinates). */
const clipB = (p: number, f: number) => {
  const pts: string[] = ['-200px -40px'];
  for (let i = 0; i < ROWS; i++) {
    const y0 = i * STEP - STEP;
    const x = toGlobalX(localEdge(y0 + STEP / 2, f, 0), y0 + STEP / 2, p);
    pts.push(`${x}px ${y0}px`, `${x}px ${y0 + STEP}px`);
  }
  pts.push(`-200px ${H + 40}px`);
  return `polygon(${pts.join(',')})`;
};

const glyph = (n: number) => String.fromCharCode(97 + (Math.abs(n) % 26));
const Glyph: FC<{g: string; size: number; style?: CSSProperties; glow?: string}> = ({g, size, style, glow = '#d9b8ff'}) => (
  <Img src={tex(`particle/sga_${g}.png`)} style={{width: size, height: size, imageRendering: 'pixelated', filter: `brightness(2.2) drop-shadow(0 0 ${Math.round(size / 8)}px ${glow})`, ...style}} />
);

const BANDS = ['rgba(150,90,255,0.35)', 'rgba(130,70,240,0.6)', 'rgba(110,50,225,0.82)', 'rgba(95,40,205,0.93)'];
const bandGradient = () => {
  const stops: string[] = [];
  const cuts = [0, 3, 7, 13, 22];
  for (let i = 0; i < 4; i++) stops.push(`${BANDS[i]} ${cuts[i]}%`, `${BANDS[i]} ${cuts[i + 1]}%`);
  stops.push('rgba(80,30,185,0.97) 22%', 'rgba(80,30,185,0.97) 78%');
  for (let i = 3; i >= 0; i--) stops.push(`${BANDS[i]} ${100 - cuts[i + 1]}%`, `${BANDS[i]} ${100 - cuts[i]}%`);
  return `linear-gradient(90deg, ${stops.join(',')})`;
};
const GRAD = bandGradient();

const LANES = [0.14, 0.3, 0.46, 0.62, 0.78, 0.9];

const Veil: FC<{p: number; f: number}> = ({p, f}) => {
  const gx = centerX(p) - BW / 2;
  const box: CSSProperties = {position: 'absolute', left: 0, top: 0, width: BW, height: H, transform: `translateX(${gx}px) skewX(${SKEW}deg)`, transformOrigin: `0 ${H / 2}px`};
  const glint = tex('misc/enchanted_glint_item.png');
  return (
    <>
      {/* soft halo on both sides of the veil */}
      <div style={{...box, background: 'transparent'}}>
        <div style={{position: 'absolute', left: BW - 20, top: 0, width: 360, height: H, background: 'linear-gradient(90deg, rgba(190,140,255,0.55), rgba(150,90,255,0.25) 40%, rgba(150,90,255,0))', mixBlendMode: 'screen'}} />
        <div style={{position: 'absolute', left: -280, top: 0, width: 300, height: H, background: 'linear-gradient(270deg, rgba(160,100,255,0.4), rgba(150,90,255,0))', mixBlendMode: 'screen'}} />
      </div>
      {/* layered ring: bright rim, mid rim, content */}
      <div style={{...box, clipPath: polyLocal(f, 0), background: '#f3e8ff'}}>
        <div style={{position: 'absolute', inset: 0, clipPath: polyLocal(f, 10), background: '#b98cff'}}>
          <div style={{position: 'absolute', inset: 0, clipPath: polyLocal(f, 24), background: '#1a0a40', overflow: 'hidden', isolation: 'isolate'}}>
            <div style={{position: 'absolute', inset: 0, background: GRAD}} />
            <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${glint})`, backgroundSize: '512px 512px', backgroundPosition: `${f * 5}px ${f * 3}px`, imageRendering: 'pixelated', mixBlendMode: 'screen', opacity: 0.95}} />
            <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${glint})`, backgroundSize: '768px 768px', backgroundPosition: `${-f * 3}px ${f * 6}px`, imageRendering: 'pixelated', mixBlendMode: 'screen', opacity: 0.7}} />
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,6,60,0.5), rgba(20,6,60,0) 22%, rgba(20,6,60,0) 78%, rgba(20,6,60,0.5))'}} />
            {/* huge ghost runes */}
            {[0, 1, 2].map((i) => (
              <Glyph key={i} g={glyph(i * 7 + 3)} size={320} glow="#9b6bff" style={{position: 'absolute', left: BW * (0.12 + i * 0.28), top: ((i * 420 - f * 4 + 2000) % (H + 400)) - 300, opacity: 0.22}} />
            ))}
            {/* rune lanes scrolling upwards */}
            {LANES.map((lx, li) =>
              Array.from({length: 7}, (_, j) => {
                const size = li % 2 ? 64 : 80;
                const gap = H / 6.4;
                const y = ((j * gap - f * (3 + li * 0.9) + 4000) % (gap * 7)) - gap * 0.5;
                const mid = 1 - Math.abs(lx - 0.5) * 1.1;
                return <Glyph key={`${li}-${j}`} g={glyph(Math.floor(hash2(li, j, 5) * 26))} size={size} style={{position: 'absolute', left: BW * lx - size / 2, top: y, opacity: 0.55 + 0.45 * mid * hash2(li, j, 8)}} />;
              }),
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/** Glyphs drifting through the whole frame, brighter close to the veil. */
const Ambient: FC<{p: number; f: number}> = ({p, f}) => {
  const cx = centerX(p);
  return (
    <>
      {Array.from({length: 44}, (_, i) => {
        const r = mulberry32(60 + i);
        const x = r() * W;
        const y0 = r() * (H + 200);
        const sp = 0.8 + r() * 1.8;
        const y = ((y0 - f * sp * 1.6 + 4 * H) % (H + 200)) - 100;
        const near = Math.max(0, 1 - Math.abs(x - (cx + (y - H / 2) * TILT)) / (BW * 0.85));
        const size = 32 + Math.floor(r() * 4) * 16;
        const tw = 0.6 + 0.4 * Math.sin(f * 0.3 + i);
        const vis = win(p, 0.0, 0.12) * (1 - win(p, 0.9, 1));
        return <Glyph key={i} g={glyph(i * 5)} size={size} style={{position: 'absolute', left: x, top: y, opacity: (0.22 + 0.78 * near) * tw * vis}} />;
      })}
    </>
  );
};

/** Particles thrown off the leading edge. */
const Spray: FC<{p: number}> = ({p}) => (
  <>
    {Array.from({length: 120}, (_, i) => {
      const r = mulberry32(500 + i);
      const p0 = 0.06 + r() * 0.84;
      const age = (p - p0) * T;
      if (age < 0 || age > 26) return null;
      const y = 40 + r() * (H - 80);
      const x0 = toGlobalX(BW + 10, y, p0);
      const v = 6 + r() * 14;
      const t = age;
      const x = x0 + v * (1 - Math.pow(0.9, t)) * 10;
      const yy = y - (2 + r() * 8) * t + 0.4 * t * t * (r() > 0.5 ? 1 : 0.2);
      const k = 1 - age / 26;
      const size = 36 + Math.floor(r() * 5) * 12;
      const useGlint = r() > 0.55;
      if (useGlint)
        return <Img key={i} src={tex('particle/glint.png')} style={{position: 'absolute', left: x, top: yy, width: size, height: size, imageRendering: 'pixelated', opacity: k, filter: 'brightness(0) invert(1) drop-shadow(0 0 8px #c9a0ff)', transform: `scale(${0.5 + k})`}} />;
      return <Glyph key={i} g={glyph(Math.floor(r() * 26))} size={size} style={{position: 'absolute', left: x, top: yy, opacity: k}} />;
    })}
  </>
);

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const vis = win(p, 0.0, 0.08) * (1 - win(p, 0.92, 1));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(40,10,100,0) 45%, rgba(40,10,110,0.55) 100%)', opacity: vis}} />
      <Ambient p={p} f={f} />
      <Veil p={p} f={f} />
      <Spray p={p} />
    </AbsoluteFill>
  );
};

export const enchantVeilDef: TransitionDef & {mode: 'dual'} = {
  id: 't2-enchant-veil',
  name: '附魔光幕',
  frames: T,
  mode: 'dual',
  a: (p) => ({filter: `brightness(${1 - 0.15 * win(p, 0, 0.5)}) saturate(${1 + 0.2 * win(p, 0, 0.4)})`}),
  b: (p) => (p < 0.05 ? {opacity: 0} : {clipPath: p > 0.95 ? undefined : clipB(p, Math.round(p * T)), filter: `brightness(${1 + 0.18 * (1 - win(p, 0.5, 1))})`}),
  overlay: Overlay,
  cues: [
    {at: 4, src: 'mc:random/orb', volume: 0.35, rate: 0.7},
    {at: 12, src: 'mc:random/orb', volume: 0.3, rate: 0.9},
    {at: 22, src: 'mc:random/levelup', volume: 0.28, rate: 1.3},
    {at: 30, src: 'mc:random/orb', volume: 0.3, rate: 1.2},
  ],
};

export const enchantVeil = transitionEntry(enchantVeilDef, {
  id: 't2-enchant-veil',
  name: '附魔光幕',
  category: 'transition',
  tags: ['附魔', '符文', '光幕', '紫色', '质感', '扫过'],
  blurb: '一道带附魔光斑纹理的紫色斜光幕从左扫到右，幕上有标准银河字母符文滚动，前缘迸出符文和星光粒子，光幕过后是下一幕。',
  usage: '附魔 / 魔法 / 神秘道具出场，或需要华丽感的章节切换。',
  params: [
    {name: 'BW', desc: '光幕宽度，默认 960px'},
    {name: 'TILT', desc: '光幕倾斜度，默认 0.22'},
    {name: 'frames', desc: '转场长度，默认 50 帧'},
  ],
});
