import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {ItemSprite} from '../../../mc/Gui';
import {PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreText, TYPE, U, nine} from '../../../mg/Ore';
import {lerp, prog} from '../../../reel/kit';
import {item as itemUrl} from '../../../mc/assets';
import {PixelSprite, type Sprite} from '../../flat';

/**
 * Shared pieces for the "item" area (crafting / workstation / loot effects).
 * Everything is deterministic (frame driven, seeded) and sized in multiples of U = 4.
 */

export {EASE, clamp01, mulberry32, lerp, prog, U, ORE, TYPE};
export const W = 1920;
export const H = 1080;
export const TAU = Math.PI * 2;
export const px: CSSProperties = {imageRendering: 'pixelated'};

/** Rarity colours, as the game shows them. */
export const RAR = {
  common: {name: '普通', color: '#ffffff', glow: '#cdd5e0'},
  uncommon: {name: '罕见', color: '#ffff55', glow: '#ffe45a'},
  rare: {name: '稀有', color: '#55ffff', glow: '#3fd7ff'},
  epic: {name: '史诗', color: '#ff55ff', glow: '#b45cff'},
} as const;
export type RarityKey = keyof typeof RAR;

/** '#rrggbb' -> 'r,g,b' (for rgba() strings). */
export const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

/** Round to the pixel grid. */
export const snap = (v: number, g = U) => Math.round(v / g) * g;

/** Position along an arc from a to b; `arc` lifts the midpoint (negative = up). */
export const arcPos = (t: number, a: [number, number], b: [number, number], arc = -120): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * arc];

/** Damped bounce 0..1 -> a value that is 0 at rest (for squash, jelly). */
export const jiggle = (t: number, k = 3, d = 4) => (t <= 0 ? 0 : Math.sin(t * Math.PI * k) * Math.exp(-t * d));

/** Interpolates a cursor path through [frame, x, y] waypoints. */
export const cursorAt = (f: number, pts: [number, number, number][]): [number, number] => {
  if (f <= pts[0][0]) return [pts[0][1], pts[0][2]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [fa, xa, ya] = pts[i];
    const [fb, xb, yb] = pts[i + 1];
    if (f < fb) {
      const t = EASE.inOut(clamp01((f - fa) / (fb - fa)));
      return [lerp(xa, xb, t), lerp(ya, yb, t)];
    }
  }
  const last = pts[pts.length - 1];
  return [last[1], last[2]];
};

/** Click ping: a small pixel cross flash with four squares flying out diagonally (no ring). */
export const Ripple: FC<{at: number; x: number; y: number; color?: string}> = ({at, x, y, color = '255,255,255'}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 14) return null;
  const t = f / 14;
  const u = 8;
  const arm = Math.round((8 + EASE.out(t) * 20) / 4) * 4;
  const op = 1 - t;
  const d = Math.round((14 + EASE.out(t) * 56) / 4) * 4;
  return (
    <>
      <div style={{position: 'absolute', left: x - arm, top: y - u / 2, width: arm * 2, height: u, background: `rgba(${color},${op})`}} />
      <div style={{position: 'absolute', left: x - u / 2, top: y - arm, width: u, height: arm * 2, background: `rgba(${color},${op})`}} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([qx, qy], i) => (
        <div key={i} style={{position: 'absolute', left: x + qx * d - 6, top: y + qy * d - 6, width: 12, height: 12, background: `rgba(${color},${op * 0.9})`}} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------- backgrounds

/** Tiled block texture, darkened, slowly drifting. */
export const TileBg: FC<{tex: string; tile?: number; dark?: number; drift?: number; tint?: string; style?: CSSProperties}> = ({tex: name, tile = 128, dark = 0.55, drift = 0.15, tint, style}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={style}>
      <AbsoluteFill style={{backgroundImage: `url(${block(name)})`, backgroundSize: `${tile}px ${tile}px`, backgroundPosition: `${f * drift}px ${f * drift * 0.4}px`, ...px}} />
      <AbsoluteFill style={{background: `rgba(6,6,10,${dark})`}} />
      {tint && <AbsoluteFill style={{background: tint, mixBlendMode: 'overlay'}} />}
    </AbsoluteFill>
  );
};

/** Radial vignette. */
export const Vig: FC<{s?: number; color?: string; inner?: number}> = ({s = 0.7, color = '0,0,0', inner = 38}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(${color},0) ${inner}%, rgba(${color},${s}) 100%)`}} />
);

/** Soft coloured light blob (blend: screen by default). */
export const Glow: FC<{x: number; y: number; r: number; color: string; op?: number; blend?: CSSProperties['mixBlendMode']; squash?: number}> = ({x, y, r, color, op = 1, blend = 'screen', squash = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r * squash,
      width: r * 2,
      height: r * 2 * squash,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${color} 0%, ${color}88 38%, ${color}00 100%)`,
      opacity: op,
      mixBlendMode: blend,
      pointerEvents: 'none',
    }}
  />
);

/** Hard elliptical ground shadow. */
export const Blob: FC<{x: number; y: number; w: number; h: number; op?: number; color?: string}> = ({x, y, w, h, op = 0.35, color = '0,0,0'}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: '50%', background: `rgba(${color},${op})`}} />
);

// ---------------------------------------------------------------- items

/** Item or block-item at `size` px with an optional hard drop shadow and enchant glint. */
export const Item: FC<{id: string; size?: number; glint?: boolean; shadow?: number; style?: CSSProperties}> = ({id, size = 16 * U, glint, shadow = 0, style}) => {
  const f = useCurrentFrame();
  return (
    <div style={{width: size, height: size, filter: shadow ? `drop-shadow(0 ${shadow}px 0 rgba(0,0,0,0.38))` : undefined, ...style}}>
      <ItemSprite id={id} size={size} glint={glint ? f / 30 : undefined} />
    </div>
  );
};

/** Item centred on (x, y), with transform. */
export const ItemAt: FC<{id: string; x: number; y: number; size?: number; scale?: number; rot?: number; sx?: number; op?: number; glint?: boolean; shadow?: number; z?: number; style?: CSSProperties}> = ({
  id,
  x,
  y,
  size = 16 * U,
  scale = 1,
  rot = 0,
  sx = 1,
  op = 1,
  glint,
  shadow = 0,
  z,
  style,
}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `rotate(${rot}deg) scale(${scale * sx}, ${scale})`, opacity: op, zIndex: z, ...style}}>
    <Item id={id} size={size} glint={glint} shadow={shadow} />
  </div>
);

/** Ore slot with optional item and count. `size` should be a multiple of U. */
export const Cell: FC<{id?: string; frame?: 'slot' | 'slot_hover' | 'slot_target'; size?: number; item?: number; itemScale?: number; count?: number; glint?: boolean; style?: CSSProperties; children?: ReactNode}> = ({
  id,
  frame = 'slot',
  size = 32 * U,
  item = 0.75,
  itemScale = 1,
  count,
  glint,
  style,
  children,
}) => {
  const s = snap(size * item);
  return (
    <div style={{...nine(frame, [2, 2, 2, 2]), width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>
      {id && itemScale > 0 && <Item id={id} size={s} glint={glint} style={{transform: `scale(${itemScale})`}} />}
      {count !== undefined && count > 1 && (
        <div style={{position: 'absolute', right: 2 * U, bottom: U}}>
          <OreText size={TYPE.body} shadow>
            {String(count)}
          </OreText>
        </div>
      )}
      {children}
    </div>
  );
};

/** Vanilla-style particle sprite centred on (x, y). */
export const Pt: FC<{name: string; x: number; y: number; size: number; rot?: number; op?: number; blend?: CSSProperties['mixBlendMode']; filter?: string; style?: CSSProperties}> = ({name, x, y, size, rot = 0, op = 1, blend, filter, style}) => (
  <Img src={tex(`particle/${name}.png`)} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: rot ? `rotate(${rot}deg)` : undefined, opacity: op, mixBlendMode: blend, filter, ...px, ...style}} />
);

/** A particle animation sequence name_0..name_{n-1}; `t` is 0..1 across the sequence. */
export const SeqPt: FC<{name: string; n: number; t: number; x: number; y: number; size: number; op?: number; blend?: CSSProperties['mixBlendMode']; filter?: string; rot?: number}> = ({name, n, t, x, y, size, op = 1, blend, filter, rot}) =>
  t < 0 || t > 1 ? null : <Pt name={`${name}_${Math.min(n - 1, Math.floor(t * n))}`} x={x} y={y} size={size} op={op} blend={blend} filter={filter} rot={rot} />;

/** A 4-point pixel star. */
export const Star4: FC<{x: number; y: number; size: number; color?: string; rot?: number; op?: number}> = ({x, y, size, color = '#fff', rot = 0, op = 1}) => {
  const a = Math.max(U, snap(size / 5));
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `rotate(${rot}deg)`, opacity: op}}>
      <div style={{position: 'absolute', left: (size - a) / 2, top: 0, width: a, height: size, background: color}} />
      <div style={{position: 'absolute', left: 0, top: (size - a) / 2, width: size, height: a, background: color}} />
      <div style={{position: 'absolute', left: size / 2 - a, top: size / 2 - a, width: a * 2, height: a * 2, background: '#fff'}} />
    </div>
  );
};

/** Twinkling 4-point stars at seeded positions inside a rect. */
export const Stars: FC<{x: number; y: number; w: number; h: number; count?: number; size?: number; colors?: string[]; seed?: number; amount?: number}> = ({x, y, w, h, count = 10, size = 40, colors = ['#fff'], seed = 3, amount = 1}) => {
  const f = useCurrentFrame();
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const px0 = x + r() * w;
        const py0 = y + r() * h;
        const period = 22 + Math.floor(r() * 24);
        const phase = Math.floor(r() * period);
        const c = colors[Math.floor(r() * colors.length)];
        const s0 = (0.6 + r() * 0.7) * size;
        const t = ((f + phase) % period) / period;
        const s = Math.sin(t * Math.PI);
        if (s * amount < 0.05) return null;
        return <Star4 key={i} x={px0} y={py0} size={snap(s0 * (0.4 + s * 0.8))} color={c} op={Math.min(1, s * 1.4 * amount)} />;
      })}
    </>
  );
};

/** Rising (or falling) square embers / dust specks over a rect. `amount` 0..1 scales how many show. */
export const Embers: FC<{x: number; y: number; w: number; h: number; count?: number; colors?: string[]; seed?: number; size?: number; life?: number; dir?: 1 | -1; sway?: number; amount?: number; opacity?: number}> = ({
  x,
  y,
  w,
  h,
  count = 30,
  colors = ['#ffd23f', '#ff9a3c', '#ff6a2c'],
  seed = 5,
  size = 12,
  life = 90,
  dir = -1,
  sway = 40,
  amount = 1,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const bx = r();
        const phase = r() * life;
        const s0 = 0.5 + r() * 0.9;
        const lf = life * (0.7 + r() * 0.6);
        const c = colors[Math.floor(r() * colors.length)];
        const ph2 = r() * TAU;
        if (i >= count * amount) return null;
        const t = ((f + phase) % lf) / lf;
        const yy = dir === -1 ? y + h * (1 - t) : y + h * t;
        const xx = x + bx * w + Math.sin(t * TAU * 1.5 + ph2) * sway;
        const s = Math.max(U, snap(size * s0 * (1 - t * 0.5)));
        const flick = 0.75 + 0.25 * Math.sin(f * 0.7 + ph2);
        return <div key={i} style={{position: 'absolute', left: snap(xx), top: snap(yy), width: s, height: s, background: c, opacity: Math.sin(t * Math.PI) * flick * opacity}} />;
      })}
    </>
  );
};

/** Smoke / steam puffs rising from a spot, using the vanilla big_smoke frames. */
export const Puffs: FC<{x: number; y: number; w?: number; count?: number; seed?: number; size?: number; rise?: number; life?: number; op?: number; filter?: string; amount?: number; blend?: CSSProperties['mixBlendMode']}> = ({
  x,
  y,
  w = 80,
  count = 8,
  seed = 2,
  size = 140,
  rise = 320,
  life = 80,
  op = 0.7,
  filter = 'brightness(1.5)',
  amount = 1,
  blend,
}) => {
  const f = useCurrentFrame();
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const bx = (r() - 0.5) * w;
        const phase = r() * life;
        const s0 = 0.6 + r() * 0.8;
        const lf = life * (0.8 + r() * 0.5);
        const drift = (r() - 0.5) * 120;
        if (i >= count * amount) return null;
        const t = ((f + phase) % lf) / lf;
        const s = size * s0 * (0.5 + t * 1.1);
        return <Pt key={i} name={`big_smoke_${Math.min(11, Math.floor(t * 12))}`} x={x + bx + drift * t} y={y - rise * EASE.out(t)} size={snap(s, 8)} op={Math.sin(t * Math.PI) * op} filter={filter} blend={blend} />;
      })}
    </>
  );
};

// ---------------------------------------------------------------- text & headings

/** Top-left heading: item chip + title + a thin sub line. */
export const Head: FC<{icon: string; title: string; sub: string; accent?: string; right?: string; at?: number}> = ({icon, title, sub, accent = '#f8af2b', right, at = 0}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16);
  return (
    <>
      <div style={{position: 'absolute', left: 56, top: 40, display: 'flex', alignItems: 'center', gap: 20, opacity: p, transform: `translateX(${(1 - p) * -60}px)`}}>
        <div style={{...nine('slot', [2, 2, 2, 2]), width: 24 * U, height: 24 * U, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Item id={icon} size={64} />
        </div>
        <div>
          <OutlineT size={72} color="#fff">
            {title}
          </OutlineT>
          <div style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{width: 6 * U, height: 6 * U, background: accent}} />
            <OreText size={TYPE.small} color="#d4d6da" shadow>
              {sub}
            </OreText>
          </div>
        </div>
      </div>
      {right && (
        <div style={{position: 'absolute', right: 56, top: 52, opacity: p, transform: `translateX(${(1 - p) * 60}px)`}}>
          <div style={{...nine('slot', [2, 2, 2, 2]), padding: `${3 * U}px ${6 * U}px`}}>
            <OreText size={TYPE.body} color={accent} shadow>
              {right}
            </OreText>
          </div>
        </div>
      )}
    </>
  );
};

/** Pixel text with a black outline (any multiple of 12 for size). */
export const OutlineT: FC<{size?: number; color: string; children: ReactNode; style?: CSSProperties}> = ({size = 48, color, children, style}) => {
  const p = size / 12;
  const o = [`${p}px 0 #000`, `${-p}px 0 #000`, `0 ${p}px #000`, `0 ${-p}px #000`, `${p}px ${p}px #000`, `${-p}px ${p}px #000`, `${p}px ${-p}px #000`, `${-p}px ${-p}px #000`, `0 ${p * 2}px 0 #000`, `${p}px ${p * 2}px 0 #000`, `${-p}px ${p * 2}px 0 #000`].join(',');
  return <span style={{fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, textShadow: o, whiteSpace: 'pre', WebkitFontSmoothing: 'none', ...style}}>{children}</span>;
};

/** Enchantment glint sheen masked to the item's own pixels. */
export const Sheen: FC<{id: string; size: number; speed?: number; hue?: 'purple' | 'white' | 'gold'}> = ({id, size, speed = 2.4, hue = 'purple'}) => {
  const f = useCurrentFrame();
  const mask = `url(${itemUrl(id)})`;
  const g =
    hue === 'purple'
      ? 'linear-gradient(115deg, rgba(120,40,230,0) 30%, rgba(150,70,255,0.85) 44%, rgba(255,210,255,0.95) 50%, rgba(150,70,255,0.85) 56%, rgba(120,40,230,0) 70%)'
      : hue === 'gold'
        ? 'linear-gradient(115deg, rgba(255,160,40,0) 30%, rgba(255,200,60,0.85) 44%, rgba(255,250,200,0.95) 50%, rgba(255,200,60,0.85) 56%, rgba(255,160,40,0) 70%)'
        : 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.7) 44%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.7) 56%, rgba(255,255,255,0) 70%)';
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        imageRendering: 'pixelated',
        backgroundImage: g,
        backgroundSize: '320% 100%',
        backgroundPosition: `${200 - ((f * speed) % 200) * 1.4}% 0`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

// ---------------------------------------------------------------- pixel art

/** Run-length SVG pixel art from a character grid (re-export of the flat kit's renderer). */
export const Pix: FC<{sprite: Sprite; px: number; style?: CSSProperties}> = ({sprite, px: p, style}) => <PixelSprite sprite={sprite} px={p} style={style} />;

/** Chunky progress arrow in Ore colours. `value` 0..1, `u` = pixel size. */
export const Arrow: FC<{value: number; u?: number; fill?: string; fillHi?: string; track?: string; trackHi?: string}> = ({value, u = 2 * U, fill = '#f8af2b', fillHi = '#ffe27a', track = '#1e1e1f', trackHi = '#48494a'}) => {
  // 15 columns x 9 rows. Body rows 3-5 up to column 9, then the head.
  const cols: [number, number][] = [
    [3, 5],
    [3, 5],
    [3, 5],
    [3, 5],
    [3, 5],
    [3, 5],
    [3, 5],
    [3, 5],
    [3, 5],
    [0, 8],
    [1, 7],
    [2, 6],
    [3, 5],
    [4, 4],
  ];
  const wPx = cols.length * u;
  const shown = Math.round(clamp01(value) * cols.length);
  return (
    <svg width={wPx + u} height={9 * u + u} shapeRendering="crispEdges" style={{overflow: 'visible'}}>
      {cols.map(([a, b], i) => (
        <g key={i}>
          <rect x={i * u} y={a * u + u} width={u} height={(b - a + 1) * u} fill={trackHi} />
          <rect x={i * u} y={a * u} width={u} height={(b - a + 1) * u} fill={track} />
          {i < shown && <rect x={i * u} y={a * u} width={u} height={(b - a + 1) * u} fill={fill} />}
          {i < shown && <rect x={i * u} y={a * u} width={u} height={Math.min(u, (b - a + 1) * u)} fill={fillHi} />}
        </g>
      ))}
    </svg>
  );
};

/** Vanilla flame sprite (container/furnace/lit_progress): `lit` 0..1 burns down from the top as fuel is used. */
export const Flame: FC<{size: number; lit?: number; flicker?: number}> = ({size, lit = 1, flicker = 0}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    <Img src={tex('gui/sprites/container/furnace/lit_progress.png')} style={{position: 'absolute', inset: 0, width: size, height: size, clipPath: `inset(${(1 - lit) * 100}% 0 0 0)`, transform: `scale(${1 + flicker * 0.06}, ${1 + flicker * 0.1})`, transformOrigin: '50% 100%', ...px}} />
  </div>
);

/** Panel with a title strip (Ore raised panel). */
export const Panel: FC<{x: number; y: number; w: number; h: number; variant?: 'panel' | 'panel_raised' | 'panel_glass'; style?: CSSProperties; children?: ReactNode}> = ({x, y, w, h, variant = 'panel_raised', style, children}) => (
  <div style={{...nine(variant, [2, 2, 2, 2]), position: 'absolute', left: x, top: y, width: w, height: h, boxShadow: `0 ${6 * U}px 0 rgba(0,0,0,0.45), 0 ${20 * U}px ${30 * U}px rgba(0,0,0,0.5)`, ...style}}>{children}</div>
);

/** Row of hanging items on a wall (tool wall). Each item: [id, x, y, rot]. */
export const Hanging: FC<{items: [string, number, number, number][]; size?: number; at?: number}> = ({items, size = 112, at = 0}) => {
  const f = useCurrentFrame();
  return (
    <>
      {items.map(([id, x, y, rot], i) => {
        const p = prog(f, at + i * 3, 16, EASE.back);
        const sway = Math.sin(f * 0.05 + i * 1.7) * 2.2;
        return (
          <div key={i} style={{position: 'absolute', left: x - size / 2, top: y, opacity: clamp01(p * 3), transform: `translateY(${(1 - p) * -80}px) rotate(${rot + sway}deg)`, transformOrigin: '50% 0%'}}>
            <div style={{position: 'absolute', left: size / 2 - 3, top: -28, width: 6, height: 28, background: '#2a1d12'}} />
            <div style={{position: 'absolute', left: size / 2 - 8, top: -34, width: 16, height: 16, background: '#8a8a8f', boxShadow: 'inset -4px -4px 0 #55555a'}} />
            <Item id={id} size={size} shadow={10} />
          </div>
        );
      })}
    </>
  );
};

/** A loose pile of items sitting on the floor: [id, dx, dy, rot]. */
export const Pile: FC<{x: number; y: number; items: [string, number, number, number][]; size?: number; scale?: number; at?: number}> = ({x, y, items, size = 96, scale = 1, at = 0}) => {
  const f = useCurrentFrame();
  return (
    <>
      <Blob x={x} y={y + size * 0.42 * scale} w={size * 2.4 * scale} h={size * 0.5 * scale} op={0.4} />
      {items.map(([id, dx, dy, rot], i) => {
        const p = prog(f, at + i * 3, 14, EASE.back);
        return (
          <div key={i} style={{position: 'absolute', left: x + dx * scale - size / 2, top: y + dy * scale - size / 2, width: size, height: size, transform: `rotate(${rot}deg) scale(${scale * p})`, opacity: clamp01(p * 4)}}>
            <Item id={id} size={size} shadow={8} />
          </div>
        );
      })}
    </>
  );
};

/** Item flying along an arc, landing with a squash. Returns style pieces for the caller. */
export const flightState = (f: number, at: number, dur: number, from: [number, number], to: [number, number], arc = -160) => {
  const t = clamp01((f - at) / dur);
  const e = EASE.out(t);
  const [x, y] = arcPos(e, from, to, arc);
  const landed = f - at - dur;
  const squash = landed >= 0 && landed < 12 ? jiggle(landed / 12, 2.5, 3.5) * 0.22 : 0;
  return {t, x, y, started: f >= at, landed: landed >= 0, squash, since: landed};
};

/** Light rays (conic) around a point, coloured. */
export const Rays: FC<{x: number; y: number; size?: number; color?: string; op?: number; n?: number; speed?: number}> = ({x, y, size = 1500, color = '255,220,120', op = 0.35, n = 14, speed = 0.4}) => {
  const f = useCurrentFrame();
  const stops: string[] = [];
  const step = 360 / n;
  for (let i = 0; i < n; i++) stops.push(`rgba(${color},${op}) ${i * step}deg ${i * step + step * 0.32}deg`, `rgba(${color},0) ${i * step + step * 0.32}deg ${(i + 1) * step}deg`);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        background: `conic-gradient(from ${f * speed}deg, ${stops.join(',')})`,
        WebkitMaskImage: 'radial-gradient(circle, black 0%, black 20%, transparent 68%)',
        maskImage: 'radial-gradient(circle, black 0%, black 20%, transparent 68%)',
        mixBlendMode: 'screen',
      }}
    />
  );
};

/** A texture used as a mask and filled with a flat colour (for tinting white sprites). */
export const Tint: FC<{src: string; color: string; size: number; style?: CSSProperties}> = ({src, color, size, style}) => (
  <div style={{width: size, height: size, background: color, WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', imageRendering: 'pixelated', ...style}} />
);

/** Enchantment-table glyph (sga_a..sga_z) centred on (x, y), tinted. */
export const Glyph: FC<{ch: number; x: number; y: number; size: number; color?: string; op?: number; rot?: number; blend?: CSSProperties['mixBlendMode']}> = ({ch, x, y, size, color = '#ffffff', op = 1, rot = 0, blend}) => {
  const name = `sga_${String.fromCharCode(97 + (((ch % 26) + 26) % 26))}`;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: op, transform: rot ? `rotate(${rot}deg)` : undefined, mixBlendMode: blend}}>
      <Tint src={tex(`particle/${name}.png`)} color={color} size={size} />
    </div>
  );
};

/** Deterministic "+N" style floating number. */
export const FloatText: FC<{x: number; y: number; at: number; life?: number; rise?: number; color?: string; size?: number; children: string}> = ({x, y, at, life = 30, rise = 80, color = '#ffff55', size = 48, children}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life) return null;
  const t = f / life;
  const pop = EASE.back(clamp01(f / 8));
  return (
    <div style={{position: 'absolute', left: x, top: y - rise * EASE.out(t), transform: `translate(-50%, -50%) scale(${0.6 + pop * 0.4})`, opacity: t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3}}>
      <OutlineT size={size} color={color}>
        {children}
      </OutlineT>
    </div>
  );
};

/** Animated block texture strip (e.g. lava_still): shows frame `floor(f * speed) % n`. */
export const AnimTex: FC<{name: string; size: number; n: number; speed?: number; style?: CSSProperties}> = ({name, size, n, speed = 0.25, style}) => {
  const f = useCurrentFrame();
  const idx = Math.floor(f * speed) % n;
  return <div style={{width: size, height: size, backgroundImage: `url(${block(name)})`, backgroundSize: `${size}px ${size * n}px`, backgroundPosition: `0 ${-idx * size}px`, ...px, ...style}} />;
};

/** One slot in a hotbar / inventory row. `flash` 0..1 is a white overlay, `bump` scales the item. */
export type SlotSpec = {id?: string; count?: number; frame?: 'slot' | 'slot_hover' | 'slot_target'; flash?: number; bump?: number; glint?: boolean};

/** Row of Ore slots, centred horizontally on `cx`, top at `y`. Returns slot centres through `centers`. */
export const slotRowX = (cx: number, n: number, size: number, gap: number) => cx - (n * size + (n - 1) * gap) / 2;

export const SlotRow: FC<{x: number; y: number; size?: number; gap?: number; slots: SlotSpec[]; item?: number}> = ({x, y, size = 24 * U, gap = U, slots, item = 0.75}) => (
  <div style={{position: 'absolute', left: x, top: y, display: 'flex', gap}}>
    {slots.map((s, i) => (
      <Cell key={i} id={s.id} count={s.count} frame={s.frame ?? 'slot'} size={size} item={item} itemScale={s.bump ?? 1} glint={s.glint}>
        {s.flash && s.flash > 0 ? <div style={{position: 'absolute', inset: 2 * U, background: '#fff', opacity: s.flash}} /> : null}
      </Cell>
    ))}
  </div>
);

/** Vanilla HUD sprite (gui/sprites/hud/<p>.png) at an integer scale. */
export const Hud: FC<{p: string; w: number; h: number; scale: number; x?: number; y?: number; style?: CSSProperties}> = ({p, w, h, scale, x, y, style}) => (
  <Img src={tex(`gui/sprites/hud/${p}.png`)} style={{position: x !== undefined ? 'absolute' : undefined, left: x, top: y, width: w * scale, height: h * scale, ...px, ...style}} />
);

/** Streak sparks thrown from a point (forge sparks). Gravity pulls them down, they cool from yellow to red. */
export const Sparks: FC<{x: number; y: number; at: number; count?: number; speed?: number; life?: number; gravity?: number; seed?: number; spread?: number; angle?: number; thick?: number; colors?: string[]}> = ({
  x,
  y,
  at,
  count = 28,
  speed = 26,
  life = 26,
  gravity = 1.1,
  seed = 1,
  spread = 150,
  angle = -90,
  thick = 6,
  colors = ['#fff6c0', '#ffd23f', '#ff9a3c', '#ff5a1c'],
}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > life * 1.3) return null;
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const a = ((angle + (r() - 0.5) * spread) * Math.PI) / 180;
        const v = speed * (0.4 + r() * 0.8);
        const l = life * (0.55 + r() * 0.45);
        if (f > l) return null;
        const drag = 0.94;
        const k = (1 - Math.pow(drag, f)) / (1 - drag);
        const vx = Math.cos(a) * v;
        const vy = Math.sin(a) * v;
        const sx = x + vx * k;
        const sy = y + vy * k + 0.5 * gravity * f * f;
        const ex = vx * Math.pow(drag, f);
        const ey = vy * Math.pow(drag, f) + gravity * f;
        const ang = (Math.atan2(ey, ex) * 180) / Math.PI;
        const len = Math.max(U * 2, Math.min(60, Math.hypot(ex, ey) * 1.8));
        const t = f / l;
        const c = colors[Math.min(colors.length - 1, Math.floor(t * colors.length))];
        return <div key={i} style={{position: 'absolute', left: sx - len / 2, top: sy - thick / 2, width: len, height: thick * (1 - t * 0.5), background: c, transform: `rotate(${ang}deg)`, opacity: 1 - t * t, boxShadow: `0 0 10px ${c}`}} />;
      })}
    </>
  );
};
