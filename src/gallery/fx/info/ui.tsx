import {createContext, useContext, type ComponentProps, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import {PIXEL8_FONT, PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, U, nine} from '../../../mg/Ore';
import {Sfx as RawSfx} from '../../../reel/kit';
import {PlateA, PlateB} from '../../plates';
import {PixelSprite, type Sprite} from '../../flat';

/**
 * Shared bits for the "info" effects: demo stage, shine sweep, hazard stripes, hard-edged card, pixel icons,
 * seeded motes. Everything is driven by the frame number; nothing is random at render time.
 */

/** Library switch: the lib wrappers provide `false` to mute every Sfx of an info effect (default true = sounds on). */
export const AudioCtx = createContext(true);
/** Sfx that honours AudioCtx (drop-in for reel/kit's Sfx). */
export const Sfx: FC<ComponentProps<typeof RawSfx>> = (p) => (useContext(AudioCtx) ? <RawSfx {...p} /> : null);

export const W = 1920;
export const H = 1080;

/** Eased 0..1 progress between `at` and `at + dur`. */
export const pr = (f: number, at: number, dur: number, e: (t: number) => number = EASE.out) => e(clamp01((f - at) / dur));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Damped spring toward 1 with overshoot (jelly). t is 0..1 over `dur`. */
export const spring = (t: number, k = 9, damp = 5) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-damp * t) * Math.cos(k * t));
/** Smooth overshoot used for pop-ins. */
export const back = (t: number) => EASE.back(clamp01(t));
export const pick = <T,>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length];

/** Fusion Pixel sizes: multiples of 12 use the 12px face, multiples of 8 the 8px face. */
export const PX: FC<{size?: number; color?: string; shadow?: string | false; style?: CSSProperties; children: ReactNode}> = ({size = 48, color = '#fff', shadow = 'rgba(0,0,0,0.45)', style, children}) => {
  const small = size % 12 !== 0 && size % 8 === 0;
  const p = small ? size / 8 : size / 12;
  return (
    <span
      style={{
        fontFamily: small ? PIXEL8_FONT : PIXEL_FONT,
        fontSize: size,
        lineHeight: `${size}px`,
        color,
        whiteSpace: 'pre',
        WebkitFontSmoothing: 'none',
        textShadow: shadow ? `${p}px ${p}px 0 ${shadow}` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Text-shadow stack: a ring outline of `ring` px in `outline`, then a downward extrusion of `depth` px in `extrude`. */
export const bold = (ring: number, outline: string, depth = 0, extrude = outline, soft?: string): string => {
  const out: string[] = [];
  for (let d = 1; d <= depth; d += Math.max(1, ring / 2)) out.push(`0 ${d}px 0 ${extrude}`);
  const n = 16;
  for (let a = 0; a < n; a++) out.push(`${(Math.cos((a / n) * Math.PI * 2) * ring).toFixed(1)}px ${(Math.sin((a / n) * Math.PI * 2) * ring).toFixed(1)}px 0 ${outline}`);
  for (let a = 0; a < n; a++) out.push(`${(Math.cos((a / n) * Math.PI * 2) * ring).toFixed(1)}px ${(Math.sin((a / n) * Math.PI * 2) * ring + depth).toFixed(1)}px 0 ${outline}`);
  if (soft) out.push(`0 ${depth + ring * 3}px ${ring * 6}px ${soft}`);
  return out.join(',');
};

/** Demo stage: a stand-in footage plate when `bg`, nothing (transparent) otherwise. */
export const Stage: FC<{bg?: boolean; plate?: 'A' | 'B'; children?: ReactNode}> = ({bg, plate = 'A', children}) => (
  <AbsoluteFill>
    {bg && (plate === 'A' ? <PlateA /> : <PlateB />)}
    {children}
  </AbsoluteFill>
);

// ------------------------------------------------------------------ decoration

/** Diagonal light band sweeping across a clipped box. `p` 0..1. Put inside a position:relative + overflow:hidden parent. */
export const Shine: FC<{p: number; tilt?: number; strength?: number; style?: CSSProperties}> = ({p, tilt = -22, strength = 1, style}) => {
  if (p <= 0 || p >= 1) return null;
  const x = lerp(-35, 135, p);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style}}>
      <div style={{position: 'absolute', top: '-30%', bottom: '-30%', left: `${x}%`, width: 90, transform: `skewX(${tilt}deg)`, background: `rgba(255,255,255,${0.16 * strength})`}} />
      <div style={{position: 'absolute', top: '-30%', bottom: '-30%', left: `calc(${x}% + 22px)`, width: 28, transform: `skewX(${tilt}deg)`, background: `rgba(255,255,255,${0.5 * strength})`}} />
    </div>
  );
};

/** Moving hazard stripes (hard edges). */
export const Hazard: FC<{w: number | string; h: number; a?: string; b?: string; f?: number; speed?: number; size?: number; style?: CSSProperties}> = ({w, h, a = '#f8af2b', b = '#1e1e1f', f = 0, speed = 1, size = 24, style}) => (
  <div
    style={{
      width: w,
      height: h,
      backgroundImage: `repeating-linear-gradient(-45deg, ${a} 0 ${size}px, ${b} ${size}px ${size * 2}px)`,
      backgroundPosition: `${f * speed}px 0`,
      ...style,
    }}
  />
);

/** Halftone dot texture overlay. */
export const Halftone: FC<{color?: string; size?: number; dot?: number; opacity?: number; style?: CSSProperties}> = ({color = '#000', size = 16, dot = 3, opacity = 0.2, style}) => (
  <div style={{position: 'absolute', inset: 0, opacity, backgroundImage: `radial-gradient(circle, ${color} ${dot}px, transparent ${dot + 0.6}px)`, backgroundSize: `${size}px ${size}px`, pointerEvents: 'none', ...style}} />
);

/** L-shaped corner bracket; `corner` picks which corner of the parent it hugs. */
export const Bracket: FC<{corner: 'tl' | 'tr' | 'bl' | 'br'; size?: number; thick?: number; color?: string; inset?: number; style?: CSSProperties}> = ({corner, size = 40, thick = 8, color = '#fff', inset = 12, style}) => {
  const v = corner[0] === 't' ? {top: inset} : {bottom: inset};
  const h = corner[1] === 'l' ? {left: inset} : {right: inset};
  return (
    <div style={{position: 'absolute', width: size, height: size, ...v, ...h, ...style}}>
      <div style={{position: 'absolute', [corner[0] === 't' ? 'top' : 'bottom']: 0, left: 0, right: 0, height: thick, background: color}} />
      <div style={{position: 'absolute', [corner[1] === 'l' ? 'left' : 'right']: 0, top: 0, bottom: 0, width: thick, background: color}} />
    </div>
  );
};

/** Small riveted bolt. */
export const Bolt: FC<{x: number; y: number; s?: number}> = ({x, y, s = 16}) => (
  <div style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, background: '#8c8d90', boxShadow: `inset ${s / 4}px ${s / 4}px 0 #d9dadc, inset ${-s / 4}px ${-s / 4}px 0 #48494a, 0 0 0 ${s / 4}px #000`}} />
);

/**
 * Hard-edged Ore slab: black outline, textured panel, light top edge, offset shadow.
 * `tone` swaps the nine-slice texture; `pad` is inner padding.
 */
export const Slab: FC<{w?: number | string; h?: number | string; tone?: 'panel' | 'panel_raised' | 'panel_glass' | 'panel_light'; shadow?: number; style?: CSSProperties; children?: ReactNode}> = ({w, h, tone = 'panel_raised', shadow = 12, style, children}) => (
  <div style={{position: 'relative', width: w, height: h, boxShadow: `0 0 0 ${U}px #000, 0 ${shadow}px 0 ${U}px rgba(0,0,0,0.55)`, ...style}}>
    <div style={{...nine(tone, [2, 2, 2, 2]), position: 'absolute', inset: 0}} />
    <div style={{position: 'absolute', left: 2 * U, right: 2 * U, top: 2 * U, height: U, background: 'rgba(255,255,255,0.28)'}} />
    {children}
  </div>
);

// ------------------------------------------------------------------ pixel icons

const mono = (rows: string[], palette: Record<string, string>): Sprite => ({rows, palette});

export const ICON = {
  crown: mono(['Y....Y....Y', 'YY..YYY..YY', 'YYYYYYYYYYY', 'YWYYYYYYYYY', 'YYYYRYYYBYY', 'YYYYYYYYYYY', 'OOOOOOOOOOO'], {Y: '#ffd23f', W: '#fff4b0', O: '#e5a812', R: '#ff4d5e', B: '#5bb4f0'}),
  check: mono(['......G', '.....GG', 'G...GG.', 'GG.GG..', '.GGG...', '..G....'], {G: '#6cc349'}),
  checkWhite: mono(['......G', '.....GG', 'G...GG.', 'GG.GG..', '.GGG...', '..G....'], {G: '#ffffff'}),
  up: mono(['...A...', '..AAA..', '.AAAAA.', 'AAAAAAA', '..AAA..', '..AAA..'], {A: '#6cc349'}),
  down: mono(['..AAA..', '..AAA..', 'AAAAAAA', '.AAAAA.', '..AAA..', '...A...'], {A: '#ff5555'}),
  right: mono(['A..', 'AA.', 'AAA', 'AAAA', 'AAA', 'AA.', 'A..'], {A: '#ffffff'}),
  pin: mono(['..RRRR..', '.RRRRRR.', 'RRWWRRRR', 'RRWRRRRR', 'RRRRRRRR', '.RRRRRR.', '..RRRR..', '...RR...', '...R....'], {R: '#ff4d5e', W: '#ffd0d6'}),
  trophy: mono(['YYYYYYYYY', 'YWYYYYYYY', 'YWYYYYYYY', '.YYYYYYY.', '..YYYYY..', '...YYY...', '...YOY...', '..YYYYY..', '..OOOOO..'], {Y: '#ffd23f', W: '#fff4b0', O: '#e5a812'}),
  bolt: mono(['..YY', '.YY.', 'YYYY', '..YY', '.YY.', 'Y...'], {Y: '#ffd23f'}),
  skull: mono(['.WWWWW.', 'WWWWWWW', 'WKKWKKW', 'WKKWKKW', 'WWWKWWW', '.WWWWW.', '.W.W.W.'], {W: '#e8e8e8', K: '#222222'}),
  dot: mono(['.AA.', 'AAAA', 'AAAA', '.AA.'], {A: '#ffffff'}),
  sword: mono(['......WW', '.....WWW', '....WWW.', '...WWW..', 'B.WWW...', '.BWW....', '..B.....', 'B.B.....'], {W: '#e8f4ff', B: '#9b6b43'}),
  heartRed: mono(['.RR.RR.', 'RRRRRRR', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], {R: '#ff4d5e', W: '#ffd0d6'}),
  drum: mono(['.YYYYY.', 'YYYYYYY', 'YYYYYYY', 'YYYYYYY', '.YYYYY.'], {Y: '#ffd23f'}),
  note: mono(['...AAA', '...A.A', '...A..', '...A..', 'AAAA..', 'AAAA..'], {A: '#ffffff'}),
  chat: mono(['AAAAAAAA', 'A......A', 'A.A.A..A', 'A......A', 'AAAAAAAA', '..AA....', '...A....'], {A: '#ffffff'}),
};
export type IconName = keyof typeof ICON;
/** Pixel icon with optional colour override (all non-transparent cells). */
export const Icon: FC<{name: IconName; px: number; color?: string; outline?: string; style?: CSSProperties}> = ({name, px, color, outline, style}) => {
  const s = ICON[name];
  const sprite: Sprite = color ? {rows: s.rows, palette: Object.fromEntries(Object.keys(s.palette).map((k) => [k, color]))} : s;
  return <PixelSprite sprite={sprite} px={px} outline={outline} style={style} />;
};

// ------------------------------------------------------------------ particles

/** Slow drifting glow motes filling an area. Positions are seeded, motion is a function of the frame. */
export const Motes: FC<{x: number; y: number; w: number; h: number; count?: number; seed?: number; colors?: string[]; size?: number; rise?: number; opacity?: number}> = ({
  x,
  y,
  w,
  h,
  count = 16,
  seed = 1,
  colors = ['#fff', '#ffe27a'],
  size = 12,
  rise = 0.7,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const rnd = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const bx = rnd() * w;
        const by = rnd() * h;
        const sp = 0.5 + rnd() * 0.9;
        const ph = rnd() * 100;
        const s = Math.round((size * (0.5 + rnd() * 0.8)) / 4) * 4;
        const c = colors[Math.floor(rnd() * colors.length)];
        const tw = Math.abs(Math.sin((f + ph) / (10 + sp * 8)));
        const yy = (((by - f * rise * sp) % h) + h) % h;
        return <div key={i} style={{position: 'absolute', left: x + bx + Math.sin((f + ph) / 20) * 8, top: y + yy, width: s, height: s, background: c, opacity: opacity * (0.25 + 0.75 * tw)}} />;
      })}
    </>
  );
};

/** Sparkle sprites (white plus shapes) twinkling at seeded spots. */
export const Sparkles: FC<{x: number; y: number; w: number; h: number; count?: number; seed?: number; px?: number; color?: string; at?: number}> = ({x, y, w, h, count = 8, seed = 3, px = 4, color = '#fff', at = 0}) => {
  const f = useCurrentFrame() - at;
  const rnd = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const bx = rnd() * w;
        const by = rnd() * h;
        const period = 22 + Math.floor(rnd() * 20);
        const ph = Math.floor(rnd() * period);
        const t = (((f + ph) % period) + period) % period / period;
        const s = Math.sin(t * Math.PI);
        if (f < 0 || s < 0.05) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x + bx, top: y + by, transform: `translate(-50%,-50%) scale(${0.3 + s})`, opacity: s}}>
            <PixelSprite sprite={{rows: ['..W..', '..W..', 'WWWWW', '..W..', '..W..'], palette: {W: color}}} px={px} />
          </div>
        );
      })}
    </>
  );
};

/** Square-pixel confetti falling from the top, over the whole frame. */
export const Confetti: FC<{at: number; life?: number; count?: number; colors: string[]; seed?: number; fromY?: number; spread?: number; size?: number}> = ({at, life = 90, count = 60, colors, seed = 5, fromY = -40, spread = W, size = 16}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  const rnd = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const x0 = rnd() * spread + (W - spread) / 2;
        const vy = 6 + rnd() * 10;
        const sway = 20 + rnd() * 60;
        const ph = rnd() * 6.28;
        const s = Math.round((size * (0.6 + rnd())) / 4) * 4;
        const delay = rnd() * 20;
        const t = f - delay;
        if (t < 0) return null;
        const y = fromY + vy * t + 0.15 * t * t;
        if (y > H + 40) return null;
        const c = colors[Math.floor(rnd() * colors.length)];
        return <div key={i} style={{position: 'absolute', left: x0 + Math.sin(t / 8 + ph) * sway, top: y, width: s, height: s * (i % 3 === 0 ? 2 : 1), background: c, boxShadow: `inset -${s / 4}px -${s / 4}px 0 rgba(0,0,0,0.25)`, opacity: clamp01((life - f) / 14)}} />;
      })}
    </>
  );
};

/** Soft screen-edge tint (box-shadow inset) for impact / heal / hurt moments. */
export const EdgeGlow: FC<{color: string; k: number; size?: number}> = ({color, k, size = 220}) =>
  k <= 0.01 ? null : <AbsoluteFill style={{boxShadow: `inset 0 0 ${size}px ${size * 0.35}px ${color}`, opacity: clamp01(k), pointerEvents: 'none'}} />;

/** MC texture as a tiled strip with pixelated rendering. */
export const TexStrip: FC<{src: string; tile?: number; style?: CSSProperties}> = ({src, tile = 64, style}) => (
  <div style={{backgroundImage: `url(${tex(src)})`, backgroundSize: `${tile}px ${tile}px`, imageRendering: 'pixelated', ...style}} />
);

/** Item/block texture icon. */
export const Tex: FC<{src: string; size: number; style?: CSSProperties}> = ({src, size, style}) => <Img src={tex(src)} style={{width: size, height: size, imageRendering: 'pixelated', ...style}} />;

/** Typewriter: the first `n` characters of `text`. */
export const typed = (text: string, n: number) => text.slice(0, Math.max(0, Math.floor(n)));

export const ORE_C = ORE;

/** Sticker lettering with a dense ring (no dotted outline): white halo, ink outline, offset shadow. */
export const StickerText: FC<{size?: number; color?: string; halo?: boolean; ink?: string; style?: CSSProperties; children: ReactNode}> = ({size = 96, color = '#ffd23f', halo = true, ink = '#2b2338', style, children}) => {
  const ring = (r: number, c: string, n = 40) => Array.from({length: n}, (_, a) => `${(Math.cos((a / n) * Math.PI * 2) * r).toFixed(1)}px ${(Math.sin((a / n) * Math.PI * 2) * r).toFixed(1)}px 0 ${c}`);
  const r1 = Math.max(3, size / 14);
  const sh = [...(halo ? [...ring(r1 * 2.2, '#fff', 56), ...ring(r1 * 1.6, '#fff', 40)] : []), ...ring(r1, ink), ...ring(r1 * 0.5, ink, 24), `0 ${r1 * 2.4}px 0 ${ink}`, `0 ${r1 * 1.5}px 0 ${ink}`];
  const small = size % 12 !== 0 && size % 8 === 0;
  return (
    <span style={{fontFamily: small ? PIXEL8_FONT : PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, whiteSpace: 'pre', WebkitFontSmoothing: 'none', textShadow: sh.join(','), ...style}}>{children}</span>
  );
};

/** Ore inset chip with the 12px pixel face (CJK-safe at 48px). */
export const Chip: FC<{color?: string; dot?: string; size?: number; style?: CSSProperties; children: ReactNode}> = ({color = '#fff', dot, size = 48, style, children}) => (
  <div style={{...nine('slot', [2, 2, 2, 2]), height: size + 16, padding: `0 ${size / 3}px`, display: 'inline-flex', alignItems: 'center', gap: size / 4, ...style}}>
    {dot && <div style={{width: size / 4, height: size / 4, background: dot}} />}
    <PX size={size} color={color}>{children}</PX>
  </div>
);
