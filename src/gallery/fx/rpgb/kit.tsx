import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, item, tex} from '../../../mc/assets';
import {BLACK_FONT, PIXEL8_FONT, PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Crop, type Rect} from '../../mob';

/**
 * Shared kit for the "dungeon crawler" RPG effects (rpgb): dark stone walls, torch light, gold-framed panels,
 * parchment, fantasy titles, rarity colours, real mob textures cut into front-view sprites, and a 3D chest.
 * Palette is kept small on purpose: near-black stone, torch orange, gold, parchment, blood red.
 */

export const C = {
  ink: '#090705',
  stone0: '#0e0c0a',
  stone1: '#1b1612',
  stone2: '#2c241c',
  wood0: '#24150a',
  wood1: '#4a2e17',
  gold0: '#5c3a0c',
  gold1: '#a8741a',
  gold2: '#f2b840',
  gold3: '#ffe9a8',
  parch0: '#7d5c30',
  parch1: '#c9a86a',
  parch2: '#e8d4a2',
  torch: '#ff9a2e',
  torchHi: '#ffd27a',
  ember: '#ff5a1a',
  common: '#cfcfcf',
  rare: '#4aa8ff',
  unique: '#ffb531',
  blood: '#c62b2b',
  bloodDk: '#4d0d0d',
  soul: '#9fe8ff',
};

export const RARITY_COL = {common: C.common, rare: C.rare, unique: C.unique} as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, at: number, dur: number, e: (t: number) => number = EASE.out) => e(clamp01((f - at) / dur));
/** Pixel-snap helper. */
export const snap = (v: number, g = 4) => Math.round(v / g) * g;

const fill: CSSProperties = {position: 'absolute', inset: 0};
export const center = (top: number | string, extra: CSSProperties = {}): CSSProperties => ({position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', ...extra});

// ------------------------------------------------------------------ backgrounds

/**
 * Dark dungeon wall: tiled stone bricks, dimmed. `lights` are torch positions; each paints one warm pool that flickers.
 * `lit` (0..1) scales how much of the wall is lit; `shift` slides the bricks (camera move).
 */
export const DungeonWall: FC<{lights?: {x: number; y: number; r?: number}[]; lit?: number; dim?: number; tile?: number; shiftX?: number; shiftY?: number; texture?: string; tint?: string; glow?: string; glowMid?: string}> = ({
  lights = [],
  lit = 1,
  dim = 0.7,
  tile = 128,
  shiftX = 0,
  shiftY = 0,
  texture = 'stone_bricks',
  tint = '12,8,5',
  glow = '255,150,50',
  glowMid = '190,90,25',
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#050403', overflow: 'hidden'}}>
      <div
        style={{
          ...fill,
          backgroundImage: `url(${block(texture)})`,
          backgroundSize: `${tile}px ${tile}px`,
          backgroundPosition: `${shiftX}px ${shiftY}px`,
          imageRendering: 'pixelated',
          filter: 'brightness(0.62) saturate(0.8)',
        }}
      />
      <div style={{...fill, background: `rgba(${tint},${dim})`}} />
      {lights.map((l, i) => {
        const fl = 0.86 + 0.14 * Math.sin(f * 0.9 + i * 2.3) * Math.sin(f * 0.37 + i);
        const r = (l.r ?? 640) * (0.96 + 0.04 * fl);
        return <div key={i} style={{...fill, mixBlendMode: 'screen', opacity: lit * fl, background: `radial-gradient(circle at ${l.x}px ${l.y}px, rgba(${glow},0.5) 0px, rgba(${glowMid},0.22) ${r * 0.45}px, rgba(0,0,0,0) ${r}px)`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Heavy vignette, the dungeon "tunnel": `s` 0..1 closes the dark in. */
export const Gloom: FC<{s?: number; color?: string}> = ({s = 0.7, color = '4,3,2'}) => (
  <div style={{...fill, background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(${color},0) ${Math.round(70 - 36 * s)}%, rgba(${color},${(0.25 + 0.7 * s).toFixed(3)}) 100%)`}} />
);

/** Black cinematic bars; `k` 0..1. */
export const Bars: FC<{k: number; size?: number}> = ({k, size = 120}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: size, transform: `translateY(${-(1 - k) * size}px)`, background: '#000', boxShadow: `0 4px 0 ${C.gold0}`}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: size, transform: `translateY(${(1 - k) * size}px)`, background: '#000', boxShadow: `0 -4px 0 ${C.gold0}`}} />
  </>
);

// ------------------------------------------------------------------ light and particles

/** Wall torch: vanilla torch texture + vanilla flame sprite, flickering. `lit` 0..1 (0 = unlit stick). Position = torch top-centre. */
export const Torch: FC<{x: number; y: number; scale?: number; lit?: number; seed?: number; glow?: boolean}> = ({x, y, scale = 12, lit = 1, seed = 0, glow = true}) => {
  const f = useCurrentFrame();
  const fl = 0.85 + 0.15 * Math.sin(f * 0.8 + seed * 3.1) * Math.sin(f * 0.31 + seed);
  const flame = 7 * scale * (0.7 + 0.3 * clamp01(lit)) * (0.92 + 0.12 * fl);
  return (
    <div style={{position: 'absolute', left: x - 8 * scale, top: y - 5 * scale, width: 16 * scale, height: 16 * scale}}>
      {glow && lit > 0 && <div style={{position: 'absolute', left: -6 * scale, top: -8 * scale, width: 28 * scale, height: 28 * scale, opacity: lit * fl * 0.55, background: 'radial-gradient(circle, rgba(255,160,60,0.55) 0%, rgba(255,120,30,0.18) 42%, rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'}} />}
      <Img src={block('torch')} style={{position: 'absolute', inset: 0, width: 16 * scale, height: 16 * scale, imageRendering: 'pixelated', filter: lit > 0 ? undefined : 'brightness(0.55)'}} />
      {lit > 0.02 && (
        <Img
          src={tex('particle/flame.png')}
          style={{position: 'absolute', left: 8 * scale - flame / 2, top: 2 * scale - flame * 0.62, width: flame, height: flame, imageRendering: 'pixelated', opacity: clamp01(lit * 1.4), transform: `scaleX(${f % 6 < 3 ? 1 : -1})`, filter: 'brightness(1.25) saturate(1.2)'}}
        />
      )}
    </div>
  );
};

/** Rising embers (square sparks). Deterministic; `rate` = particles alive, `box` = spawn box. */
export const Embers: FC<{box: [number, number, number, number]; count?: number; seed?: number; rise?: number; size?: number; colors?: string[]; life?: number; amount?: number}> = ({
  box,
  count = 24,
  seed = 1,
  rise = 220,
  size = 8,
  colors = [C.torchHi, C.torch, C.ember],
  life = 70,
  amount = 1,
}) => {
  const f = useCurrentFrame();
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const x0 = box[0] + r() * box[2];
        const y0 = box[1] + r() * box[3];
        const ph = r() * life;
        const sway = (r() - 0.5) * 120;
        const sz = size * (0.6 + r() * 0.9);
        const col = colors[Math.floor(r() * colors.length)];
        const gate = r();
        if (gate > amount) return null;
        const t = ((f + ph) % life) / life;
        const x = x0 + Math.sin(t * 6 + i) * 18 + sway * t;
        const y = y0 - t * rise * (0.6 + 0.8 * r());
        const o = Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.sin(f * 0.7 + i));
        const s = Math.max(4, snap(sz * (1 - t * 0.5), 2));
        return <div key={i} style={{position: 'absolute', left: snap(x, 2), top: snap(y, 2), width: s, height: s, background: col, opacity: clamp01(o)}} />;
      })}
    </>
  );
};

/** Pale dust motes drifting in a lit area. */
export const Dust: FC<{box: [number, number, number, number]; count?: number; seed?: number; opacity?: number; color?: string; fall?: number}> = ({box, count = 30, seed = 3, opacity = 0.55, color = '#ffe9c0', fall = 90}) => {
  const f = useCurrentFrame();
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const x0 = box[0] + r() * box[2];
        const y0 = r() * box[3];
        const sp = 0.5 + r();
        const sz = 4 + Math.floor(r() * 3) * 2;
        const ph = r() * 200;
        const y = box[1] + ((y0 + (f + ph) * sp * (fall / 60)) % box[3]);
        const x = x0 + Math.sin((f + ph) / 30 + i) * 14;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin((f + ph) / 22));
        return <div key={i} style={{position: 'absolute', left: snap(x, 2), top: snap(y, 2), width: sz, height: sz, background: color, opacity: opacity * tw}} />;
      })}
    </>
  );
};

/** Plain light shaft: a skewed parallelogram (simple and predictable). */
export const Shaft: FC<{x: number; w?: number; lean?: number; opacity?: number; color?: string; top?: number; h?: number}> = ({x, w = 220, lean = 200, opacity = 0.28, color = '255,214,150', top = -40, h = 1160}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2 - lean / 2,
      top,
      width: w + lean,
      height: h,
      opacity,
      mixBlendMode: 'screen',
      clipPath: `polygon(${(lean / (w + lean)) * 100}% 0, 100% 0, ${100 - (lean / (w + lean)) * 100}% 100%, 0 100%)`,
      background: `linear-gradient(180deg, rgba(${color},0.95) 0%, rgba(${color},0.4) 50%, rgba(${color},0) 100%)`,
    }}
  />
);

// ------------------------------------------------------------------ panels and text

/**
 * Heavy gold-framed dark-wood panel: dark outline, bevelled gold rim (light top-left, shadow bottom-right),
 * inner dark rim, riveted corners. Size is the outer size.
 */
export const GoldFrame: FC<{w: number; h?: number; rim?: number; style?: CSSProperties; fillTex?: string; children?: ReactNode; studs?: boolean; glow?: string}> = ({w, h, rim = 12, style, fillTex = 'dark_oak_planks', children, studs = true, glow}) => (
  <div
    style={{
      position: 'relative',
      width: w,
      height: h,
      boxSizing: 'border-box',
      border: `${rim}px solid`,
      borderColor: `${C.gold2} ${C.gold1} ${C.gold0} ${C.gold1}`,
      backgroundImage: `linear-gradient(rgba(12,7,3,0.55), rgba(12,7,3,0.72)), url(${block(fillTex)})`,
      backgroundSize: `100% 100%, 64px 64px`,
      imageRendering: 'pixelated',
      boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 4px ${C.ink}, inset 0 0 0 6px ${C.gold0}, 0 14px 0 rgba(0,0,0,0.5)${glow ? `, 0 0 60px ${glow}` : ''}`,
      ...style,
    }}
  >
    {studs &&
      [
        [-rim - 4, -rim - 4],
        [null, -rim - 4],
        [-rim - 4, null],
        [null, null],
      ].map(([l, t], i) => (
        <div key={i} style={{position: 'absolute', left: l ?? undefined, right: l === null ? -rim - 4 : undefined, top: t ?? undefined, bottom: t === null ? -rim - 4 : undefined, width: rim + 8, height: rim + 8, background: C.gold2, boxShadow: `inset -4px -4px 0 ${C.gold1}, inset 4px 4px 0 ${C.gold3}, 0 0 0 4px ${C.ink}`}} />
      ))}
    {children}
  </div>
);

/** Aged parchment sheet with burnt edges, fibre lines and seeded stains. */
export const Parchment: FC<{w: number; h: number; seed?: number; style?: CSSProperties; children?: ReactNode}> = ({w, h, seed = 5, style, children}) => {
  const r = mulberry32(seed);
  const stains = Array.from({length: 46}, () => ({x: r() * w, y: r() * h, s: 8 + Math.floor(r() * 5) * 4, a: 0.05 + r() * 0.12}));
  return (
    <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', background: `radial-gradient(ellipse at 50% 45%, ${C.parch2} 0%, ${C.parch1} 62%, ${C.parch0} 100%)`, boxShadow: `inset 0 0 0 6px ${C.parch0}, inset 0 0 0 10px #2a1a08, 0 18px 0 rgba(0,0,0,0.45)`, ...style}}>
      <div style={{...fill, backgroundImage: 'repeating-linear-gradient(90deg, rgba(90,60,20,0.05) 0px, rgba(90,60,20,0.05) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 20px)'}} />
      {stains.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: snap(s.x), top: snap(s.y), width: s.s, height: s.s, background: `rgba(96,60,20,${s.a})`}} />
      ))}
      <div style={{...fill, boxShadow: 'inset 0 0 90px 10px rgba(70,38,8,0.55)'}} />
      {children}
    </div>
  );
};

/** Fantasy title: heavy Noto Black glyphs, gold gradient fill, dark outline and a stepped bronze extrusion. */
export const FantasyTitle: FC<{children: string; size?: number; tone?: 'gold' | 'blood' | 'steel' | 'jade'; style?: CSSProperties; spacing?: number}> = ({children, size = 160, tone = 'gold', style, spacing = 0.08}) => {
  const tones = {
    gold: {fill: `linear-gradient(180deg, #fff6cf 0%, ${C.gold3} 28%, ${C.gold2} 52%, ${C.gold1} 78%, #7a4e10 100%)`, ext: '#6b4310', edge: '#2a1604'},
    blood: {fill: 'linear-gradient(180deg, #ffd6c8 0%, #ff7a5a 30%, #d6332b 56%, #8a1515 100%)', ext: '#4a0c0c', edge: '#160404'},
    steel: {fill: 'linear-gradient(180deg, #ffffff 0%, #d9e0e6 30%, #9aa6b0 58%, #5d6670 100%)', ext: '#2f353b', edge: '#0b0d0f'},
    jade: {fill: 'linear-gradient(180deg, #e8ffd8 0%, #9fe08a 34%, #4fa84a 62%, #24602a 100%)', ext: '#143a18', edge: '#06140a'},
  }[tone];
  const stroke = Math.max(6, Math.round(size / 11));
  const ext = Array.from({length: Math.max(3, Math.round(size / 28))}, (_, i) => `0 ${(i + 1) * 3}px 0 ${tone === 'gold' ? ext0(i) : tones.ext}`).join(',');
  const base: CSSProperties = {fontFamily: BLACK_FONT, fontSize: size, lineHeight: 1.1, letterSpacing: size * spacing, whiteSpace: 'pre', fontWeight: 900};
  return (
    <div style={{position: 'relative', display: 'inline-block', paddingLeft: size * spacing, ...style}}>
      <span style={{...base, color: tones.edge, WebkitTextStroke: `${stroke * 2}px ${tones.edge}`, textShadow: `${ext}, 0 ${Math.round(size * 0.16)}px 0 rgba(0,0,0,0.5)`}}>{children}</span>
      <span style={{...base, position: 'absolute', left: size * spacing, top: 0, backgroundImage: tones.fill, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 ${Math.max(2, size / 40)}px 0 rgba(255,255,255,0.0))`}}>{children}</span>
    </div>
  );
};
const ext0 = (i: number) => (i % 2 === 0 ? '#6b4310' : '#8a5a14');

/** Pixel-font label (Fusion Pixel); size should be a multiple of 12 (or of 8 with `small`). */
export const Label: FC<{children: ReactNode; size?: number; color?: string; small?: boolean; shadow?: boolean; style?: CSSProperties}> = ({children, size = 36, color = '#fff', small, shadow = true, style}) => {
  const px = small ? size / 8 : size / 12;
  return (
    <span style={{fontFamily: small ? PIXEL8_FONT : PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, whiteSpace: 'pre', WebkitFontSmoothing: 'none', textAlign: 'center', textShadow: shadow ? `${px}px ${px}px 0 rgba(0,0,0,0.7)` : undefined, ...style}}>{children}</span>
  );
};

/** Pixel star (gold) as a char grid, for ratings and difficulty. `on` 0..1 = fill amount of brightness. */
const STAR = ['....X....', '...XXX...', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '..XXXXX..', '.XXX.XXX.', '.XX...XX.'];
export const PxStar: FC<{size?: number; on?: boolean; color?: string; style?: CSSProperties}> = ({size = 48, on = true, color = C.gold2, style}) => {
  const p = size / 9;
  const full = on ? color : '#2a231c';
  const hi = on ? C.gold3 : '#3a3128';
  const lo = on ? C.gold1 : '#171210';
  return (
    <svg width={size} height={size} shapeRendering="crispEdges" style={{overflow: 'visible', ...style}}>
      <g transform={`translate(${p},${p})`} fill="#000" opacity={0.55}>
        {STAR.flatMap((row, j) => [...row].map((c, i) => (c === 'X' ? <rect key={`${i}-${j}`} x={i * p} y={j * p} width={p} height={p} /> : null)))}
      </g>
      {STAR.flatMap((row, j) =>
        [...row].map((c, i) => {
          if (c !== 'X') return null;
          const col = j <= 1 || (j === 3 && i < 4) ? hi : j >= 6 ? lo : full;
          return <rect key={`${i}-${j}`} x={i * p} y={j * p} width={p} height={p} fill={col} />;
        }),
      )}
    </svg>
  );
};

/** Pixel skull (death counter) char grid. */
const SKULL = ['.XXXXXXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XDDXXXDDX', 'XDDXXXDDX', 'XXXXDXXXX', '.XXXXXXX.', '..XDXDX..', '..XXXXX..'];
export const PxSkull: FC<{size?: number; color?: string; style?: CSSProperties}> = ({size = 48, color = C.common, style}) => {
  const p = size / 9;
  return (
    <svg width={size} height={size} shapeRendering="crispEdges" style={style}>
      {SKULL.flatMap((row, j) => [...row].map((c, i) => (c === '.' ? null : <rect key={`${i}-${j}`} x={i * p} y={j * p} width={p} height={p} fill={c === 'D' ? '#16120f' : color} />)))}
    </svg>
  );
};

/** Pixel heart (health), `fillC` colour. */
const HEART = ['.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
export const PxHeart: FC<{size?: number; color?: string; style?: CSSProperties}> = ({size = 48, color = C.blood, style}) => {
  const p = size / 9;
  return (
    <svg width={size} height={(size * 8) / 9} shapeRendering="crispEdges" style={style}>
      {HEART.flatMap((row, j) => [...row].map((c, i) => (c === '.' ? null : <rect key={`${i}-${j}`} x={i * p} y={j * p} width={p} height={p} fill={j === 1 && i > 0 && i < 4 ? '#ff9a8a' : j >= 5 ? '#8a1a1a' : color} />)))}
    </svg>
  );
};

/** Enchanting-table rune glyph (vanilla SGA particle sprite a..z), tinted. */
export const Rune: FC<{ch: number; size?: number; color?: string; style?: CSSProperties}> = ({ch, size = 64, color = '#fff', style}) => {
  const name = String.fromCharCode(97 + (((ch % 26) + 26) % 26));
  const m = `url(${tex(`particle/sga_${name}.png`)})`;
  return <div style={{width: size, height: size, backgroundColor: color, WebkitMaskImage: m, maskImage: m, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', imageRendering: 'pixelated', ...style}} />;
};

/** Item icon, pixelated. */
export const Icon: FC<{id: string; size?: number; style?: CSSProperties}> = ({id, size = 64, style}) => <Img src={item(id)} style={{width: size, height: size, imageRendering: 'pixelated', ...style}} />;

// ------------------------------------------------------------------ real mob textures as front-view sprites

type Part = {src: string; sheet: [number, number]; rect: Rect; x: number; y: number; flip?: boolean};
export type MobSprite = {w: number; h: number; parts: Part[]; eyes?: Part[]};

const T = (p: string) => tex(`entity/${p}`);

const humanoid64 = (file: string, extra: Part[] = []): MobSprite => {
  const src = T(file);
  const sheet: [number, number] = [64, 64];
  return {
    w: 16,
    h: 32,
    parts: [
      {src, sheet, rect: [4, 20, 4, 12], x: 4, y: 20},
      {src, sheet, rect: [20, 52, 4, 12], x: 8, y: 20},
      {src, sheet, rect: [44, 20, 4, 12], x: 0, y: 8},
      {src, sheet, rect: [36, 52, 4, 12], x: 12, y: 8},
      {src, sheet, rect: [20, 20, 8, 12], x: 4, y: 8},
      {src, sheet, rect: [8, 8, 8, 8], x: 4, y: 0},
      ...extra,
    ],
  };
};
const humanoid32 = (file: string): MobSprite => {
  const src = T(file);
  const sheet: [number, number] = [64, 32];
  return {
    w: 16,
    h: 32,
    parts: [
      {src, sheet, rect: [2, 18, 2, 12], x: 5, y: 20},
      {src, sheet, rect: [2, 18, 2, 12], x: 9, y: 20, flip: true},
      {src, sheet, rect: [42, 18, 2, 12], x: 2, y: 8},
      {src, sheet, rect: [42, 18, 2, 12], x: 12, y: 8, flip: true},
      {src, sheet, rect: [20, 20, 8, 12], x: 4, y: 8},
      {src, sheet, rect: [8, 8, 8, 8], x: 4, y: 0},
    ],
  };
};
const illager = (file: string): MobSprite => {
  const src = T(`illager/${file}`);
  const sheet: [number, number] = [64, 64];
  return {
    w: 16,
    h: 34,
    parts: [
      {src, sheet, rect: [4, 26, 4, 12], x: 4, y: 22},
      {src, sheet, rect: [4, 26, 4, 12], x: 8, y: 22, flip: true},
      {src, sheet, rect: [44, 50, 4, 12], x: 0, y: 10},
      {src, sheet, rect: [44, 50, 4, 12], x: 12, y: 10, flip: true},
      {src, sheet, rect: [22, 26, 8, 12], x: 4, y: 10},
      {src, sheet, rect: [8, 8, 8, 10], x: 4, y: 0},
      {src, sheet, rect: [25, 1, 2, 4], x: 7, y: 5},
    ],
  };
};

const creeperSrc = T('creeper/creeper.png');
const endSrc = T('enderman/enderman.png');
const golemSrc = T('iron_golem/iron_golem.png');
const piglinSrc = T('piglin/piglin_brute.png');
const witherSrc = T('wither/wither.png');

export const MOBS: Record<string, MobSprite> = {
  zombie: humanoid64('zombie/zombie.png'),
  husk: humanoid64('zombie/husk.png'),
  skeleton: humanoid32('skeleton/skeleton.png'),
  stray: humanoid32('skeleton/stray.png'),
  witherSkeleton: humanoid32('skeleton/wither_skeleton.png'),
  pillager: illager('pillager.png'),
  vindicator: illager('vindicator.png'),
  evoker: illager('evoker.png'),
  creeper: {
    w: 8,
    h: 24,
    parts: [
      {src: creeperSrc, sheet: [64, 32], rect: [4, 22, 4, 6], x: 0, y: 18},
      {src: creeperSrc, sheet: [64, 32], rect: [4, 22, 4, 6], x: 4, y: 18},
      {src: creeperSrc, sheet: [64, 32], rect: [20, 20, 8, 12], x: 0, y: 8},
      {src: creeperSrc, sheet: [64, 32], rect: [8, 8, 8, 8], x: 0, y: 0},
    ],
  },
  enderman: {
    w: 16,
    h: 46,
    parts: [
      {src: endSrc, sheet: [64, 32], rect: [58, 2, 2, 30], x: 5, y: 16},
      {src: endSrc, sheet: [64, 32], rect: [58, 2, 2, 30], x: 9, y: 16},
      {src: endSrc, sheet: [64, 32], rect: [58, 2, 2, 30], x: 1, y: 8},
      {src: endSrc, sheet: [64, 32], rect: [58, 2, 2, 30], x: 13, y: 8},
      {src: endSrc, sheet: [64, 32], rect: [36, 20, 8, 12], x: 4, y: 8},
      {src: endSrc, sheet: [64, 32], rect: [8, 8, 8, 8], x: 4, y: 0},
    ],
    eyes: [{src: T('enderman/enderman_eyes.png'), sheet: [64, 32], rect: [8, 8, 8, 8], x: 4, y: 0}],
  },
  piglin: {
    w: 16,
    h: 32,
    parts: [
      {src: piglinSrc, sheet: [64, 64], rect: [4, 20, 4, 12], x: 4, y: 20},
      {src: piglinSrc, sheet: [64, 64], rect: [20, 52, 4, 12], x: 8, y: 20},
      {src: piglinSrc, sheet: [64, 64], rect: [44, 20, 4, 12], x: 0, y: 8},
      {src: piglinSrc, sheet: [64, 64], rect: [36, 52, 4, 12], x: 12, y: 8},
      {src: piglinSrc, sheet: [64, 64], rect: [20, 20, 8, 12], x: 4, y: 8},
      {src: piglinSrc, sheet: [64, 64], rect: [8, 8, 10, 8], x: 3, y: 0},
      {src: piglinSrc, sheet: [64, 64], rect: [32, 2, 8, 4], x: 4, y: 4},
    ],
  },
  golem: {
    w: 26,
    h: 44,
    parts: [
      {src: golemSrc, sheet: [128, 128], rect: [42, 5, 6, 16], x: 7, y: 28},
      {src: golemSrc, sheet: [128, 128], rect: [65, 5, 6, 16], x: 13, y: 28},
      {src: golemSrc, sheet: [128, 128], rect: [66, 27, 4, 30], x: 0, y: 10},
      {src: golemSrc, sheet: [128, 128], rect: [66, 64, 4, 30], x: 22, y: 10},
      {src: golemSrc, sheet: [128, 128], rect: [6, 76, 9, 5], x: 8.5, y: 22},
      {src: golemSrc, sheet: [128, 128], rect: [11, 51, 18, 12], x: 4, y: 10},
      {src: golemSrc, sheet: [128, 128], rect: [8, 8, 8, 10], x: 9, y: 0},
      {src: golemSrc, sheet: [128, 128], rect: [26, 2, 2, 4], x: 12, y: 5},
    ],
  },
  /** Wither: three skulls, shoulder bar, spine, ribs. */
  wither: {
    w: 28,
    h: 34,
    parts: [
      {src: witherSrc, sheet: [64, 64], rect: [15, 25, 3, 6], x: 12.5, y: 27},
      {src: witherSrc, sheet: [64, 64], rect: [3, 25, 3, 10], x: 12.5, y: 12},
      {src: witherSrc, sheet: [64, 64], rect: [26, 24, 11, 2], x: 8.5, y: 15},
      {src: witherSrc, sheet: [64, 64], rect: [26, 24, 11, 2], x: 8.5, y: 18},
      {src: witherSrc, sheet: [64, 64], rect: [26, 24, 11, 2], x: 8.5, y: 21},
      {src: witherSrc, sheet: [64, 64], rect: [3, 19, 20, 3], x: 4, y: 10},
      {src: witherSrc, sheet: [64, 64], rect: [38, 6, 6, 6], x: 0, y: 5},
      {src: witherSrc, sheet: [64, 64], rect: [38, 6, 6, 6], x: 22, y: 5},
      {src: witherSrc, sheet: [64, 64], rect: [8, 8, 8, 8], x: 10, y: 0},
    ],
  },
};

/** Draws a mob sprite at integer `scale`. `filter` for silhouettes, `eyesGlow` for enderman eyes. */
export const Mob: FC<{mob: string | MobSprite; scale?: number; style?: CSSProperties; eyes?: number; filter?: string}> = ({mob, scale = 8, style, eyes = 1, filter}) => {
  const m = typeof mob === 'string' ? MOBS[mob] : mob;
  return (
    <div style={{position: 'relative', width: m.w * scale, height: m.h * scale, flex: 'none', filter, ...style}}>
      {m.parts.map((p, i) => (
        <Crop key={i} src={p.src} sheet={p.sheet} rect={p.rect} scale={scale} style={{position: 'absolute', left: p.x * scale, top: p.y * scale, transform: p.flip ? 'scaleX(-1)' : undefined}} />
      ))}
      {m.eyes?.map((p, i) => (
        <Crop key={`e${i}`} src={p.src} sheet={p.sheet} rect={p.rect} scale={scale} style={{position: 'absolute', left: p.x * scale, top: p.y * scale, opacity: eyes, filter: `drop-shadow(0 0 ${scale}px #c35bff)`}} />
      ))}
    </div>
  );
};

/** Mob head only (front of the head box), for icons. */
export const mobHead = (name: string): MobSprite => {
  const m = MOBS[name];
  const heads = m.parts.filter((p) => p.y <= 1 && (p.rect[2] >= 6) && p.x >= 3 && p.x <= 10);
  const h0 = heads[heads.length - 1];
  return {w: h0.rect[2], h: h0.rect[3], parts: [{...h0, x: 0, y: 0}]};
};

/**
 * Breaks a mob into its texture pixels ("pixel particles") and flies them out.
 * t: 0 = intact .. 1 = fully gone. Each texel keeps its true colour. `origin` = point texels are thrown from.
 */
export const ShatterMob: FC<{mob: string | MobSprite; scale?: number; t: number; seed?: number; power?: number; gravity?: number; stepsOf?: number}> = ({mob, scale = 10, t, seed = 4, power = 700, gravity = 900, stepsOf = 2}) => {
  const m = typeof mob === 'string' ? MOBS[mob] : mob;
  const cells: ReactNode[] = [];
  const r = mulberry32(seed);
  const cx = (m.w * scale) / 2;
  const cy = (m.h * scale) / 2;
  let k = 0;
  m.parts.forEach((p, pi) => {
    for (let j = 0; j < p.rect[3]; j += stepsOf) {
      for (let i = 0; i < p.rect[2]; i += stepsOf) {
        const px = (p.x + i) * scale + (p.flip ? 0 : 0);
        const py = (p.y + j) * scale;
        const rr = r();
        const r2 = r();
        const r3 = r();
        const dx = px + (stepsOf * scale) / 2 - cx;
        const dy = py + (stepsOf * scale) / 2 - cy;
        const dist = Math.hypot(dx, dy) / Math.max(cx, cy);
        const delay = clamp01(dist * 0.3 + rr * 0.18);
        const tt = clamp01((t - delay) / (1 - delay));
        const ease = 1 - Math.pow(1 - tt, 2);
        const ang = Math.atan2(dy, dx) + (r2 - 0.5) * 1.0;
        const v = power * (0.4 + r3 * 0.8);
        const x = px + Math.cos(ang) * v * ease;
        const y = py + Math.sin(ang) * v * ease * 0.8 - 160 * ease + gravity * tt * tt * (0.5 + rr);
        const o = tt <= 0 ? 1 : 1 - clamp01((tt - 0.55) / 0.45);
        if (o <= 0) {
          k++;
          continue;
        }
        const s = stepsOf * scale;
        cells.push(
          <Crop
            key={`${pi}-${i}-${j}`}
            src={p.src}
            sheet={p.sheet}
            rect={[p.rect[0] + (p.flip ? p.rect[2] - i - stepsOf : i), p.rect[1] + j, Math.min(stepsOf, p.rect[2] - i), Math.min(stepsOf, p.rect[3] - j)]}
            scale={scale}
            style={{position: 'absolute', left: x, top: y, opacity: o, transform: `rotate(${tt * (r2 - 0.5) * 540}deg) scale(${1 - tt * 0.3})`, width: s, height: s}}
          />,
        );
        k++;
      }
    }
  });
  return <div style={{position: 'relative', width: m.w * scale, height: m.h * scale}}>{cells}</div>;
};

/** The vanilla spider seen from the front (head, eyes, body, eight legs). */
export const SpiderFront: FC<{scale?: number; style?: CSSProperties; filter?: string}> = ({scale = 8, style, filter}) => {
  const src = T('spider/spider.png');
  const sheet: [number, number] = [64, 32];
  const leg = (side: 1 | -1, i: number) => {
    const ang = [-38, -14, 12, 34][i] * side;
    return (
      <Crop key={`${side}${i}`} src={src} sheet={sheet} rect={[20, 0, 16, 2]} scale={scale} style={{position: 'absolute', left: side === 1 ? 14 * scale : -2 * scale, top: (11 + i * 1.6) * scale, transformOrigin: side === 1 ? '0 50%' : '100% 50%', transform: `rotate(${ang}deg)${side === -1 ? ' scaleX(-1)' : ''}`}} />
    );
  };
  return (
    <div style={{position: 'relative', width: 28 * scale, height: 22 * scale, flex: 'none', filter, ...style}}>
      {[0, 1, 2, 3].map((i) => leg(1, i))}
      {[0, 1, 2, 3].map((i) => leg(-1, i))}
      <Crop src={src} sheet={sheet} rect={[12, 12, 10, 8]} scale={scale} style={{position: 'absolute', left: 9 * scale, top: 9 * scale}} />
      <Crop src={src} sheet={sheet} rect={[6, 18, 6, 6]} scale={scale} style={{position: 'absolute', left: 11 * scale, top: 5 * scale}} />
      <Crop src={src} sheet={sheet} rect={[40, 12, 8, 8]} scale={scale} style={{position: 'absolute', left: 10 * scale, top: 0}}>
        <Crop src={T('spider/spider_eyes.png')} sheet={sheet} rect={[40, 12, 8, 8]} scale={scale} style={{filter: `drop-shadow(0 0 ${scale}px #ff2030)`}} />
      </Crop>
    </div>
  );
};

// ------------------------------------------------------------------ 3D chest from the real chest texture

const CHEST = tex('entity/chest/normal.png');
const Face: FC<{rect: Rect; s: number; style: CSSProperties}> = ({rect, s, style}) => (
  <div style={{position: 'absolute', backfaceVisibility: 'hidden', overflow: 'hidden', ...style}}>
    <Crop src={CHEST} sheet={[64, 64]} rect={rect} scale={s} />
  </div>
);

/**
 * Vanilla chest as a real 3D box (CSS 3D) built from entity/chest/normal.png. `open` 0..1 lifts the lid (hinge at the back),
 * `yaw`/`pitch` orient it. The base is 14x10x14 texels, lid 14x5x14. `s` = screen pixels per texel.
 */
export const Chest3D: FC<{s?: number; open?: number; yaw?: number; pitch?: number; glow?: number; style?: CSSProperties}> = ({s = 14, open = 0, yaw = -18, pitch = 22, glow = 0, style}) => {
  const W = 14 * s;
  const BH = 10 * s;
  const LH = 5 * s;
  const D = 14 * s;
  const box = (h: number, f: Rect, r: Rect, l: Rect, b: Rect, t: Rect, bot?: Rect) => (
    <>
      <Face rect={f} s={s} style={{left: 0, top: 0, width: W, height: h, transform: `translateZ(${D / 2}px)`}} />
      <Face rect={b} s={s} style={{left: 0, top: 0, width: W, height: h, transform: `rotateY(180deg) translateZ(${D / 2}px)`}} />
      <Face rect={r} s={s} style={{left: (W - D) / 2, top: 0, width: D, height: h, transform: `rotateY(90deg) translateZ(${W / 2}px)`}} />
      <Face rect={l} s={s} style={{left: (W - D) / 2, top: 0, width: D, height: h, transform: `rotateY(-90deg) translateZ(${W / 2}px)`}} />
      <Face rect={t} s={s} style={{left: 0, top: (h - D) / 2, width: W, height: D, transform: `rotateX(90deg) translateZ(${h / 2}px)`}} />
      {bot && <Face rect={bot} s={s} style={{left: 0, top: (h - D) / 2, width: W, height: D, transform: `rotateX(-90deg) translateZ(${h / 2}px)`}} />}
    </>
  );
  const lidAng = open * 112;
  return (
    <div style={{position: 'relative', width: W, height: BH + LH, perspective: 1800, flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${-pitch}deg) rotateY(${yaw}deg)`}}>
        {/* base */}
        <div style={{position: 'absolute', left: 0, top: LH, width: W, height: BH, transformStyle: 'preserve-3d'}}>
          {box(BH, [14, 33, 14, 10], [0, 33, 14, 10], [28, 33, 14, 10], [42, 33, 14, 10], [14, 19, 14, 14])}
          {glow > 0 && (
            <div style={{position: 'absolute', left: 1 * s, top: (BH - D) / 2 + 0.2 * s, width: W - 2 * s, height: D - 2 * s, transform: `rotateX(90deg) translateZ(${BH / 2 - 0.3 * s}px)`, background: `radial-gradient(circle, rgba(255,236,160,${glow}) 0%, rgba(255,190,70,${glow * 0.7}) 55%, rgba(255,150,40,0) 100%)`}} />
          )}
        </div>
        {/* lid, hinged on its back-bottom edge */}
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: LH, transformStyle: 'preserve-3d', transformOrigin: `50% 100% ${-D / 2}px`, transform: `rotateX(${lidAng}deg)`}}>
          {box(LH, [14, 14, 14, 5], [0, 14, 14, 5], [28, 14, 14, 5], [42, 14, 14, 5], [14, 0, 14, 14], [28, 0, 14, 14])}
          <Face rect={[1, 1, 2, 4]} s={s} style={{left: 6 * s, top: 2 * s, width: 2 * s, height: 4 * s, transform: `translateZ(${D / 2 + 0.6 * s}px)`}} />
        </div>
      </div>
    </div>
  );
};

/** A hard shadow ellipse-less "floor shadow": dark rectangle with feathered pixel edge. */
export const FloorShadow: FC<{x: number; y: number; w: number; h?: number; opacity?: number}> = ({x, y, w, h = 36, opacity = 0.55}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, background: `rgba(0,0,0,${opacity})`, clipPath: `polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)`}} />
);

/** Seeded random helper for components. */
export const rng = mulberry32;
