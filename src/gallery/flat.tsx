import type {CSSProperties, FC, ReactNode} from 'react';
import {PIXEL_FONT} from '../mc/fonts';

/**
 * Flat, cute pixel kit shared by the gallery's "cute" effects.
 * Look: flat colour blocks, a dark ink outline, a lighter top edge, a hard offset shadow underneath.
 * The depth comes from stacked colour layers, not gradients.
 */

export const FLAT = {
  ink: '#2b2338',
  inkSoft: '#4a3f5e',
  cream: '#fff4d6',
  white: '#ffffff',
  sky: '#8fd3ff',
  skyDeep: '#5bb4f0',
  pink: '#ff7aa8',
  pinkDeep: '#e5518a',
  red: '#ff4d5e',
  redDeep: '#c92a45',
  yellow: '#ffd23f',
  yellowDeep: '#e5a812',
  orange: '#ff9a3c',
  green: '#5ed16a',
  greenDeep: '#2fa24a',
  mint: '#a8f0c6',
  teal: '#3fd0c9',
  purple: '#8f6bff',
  purpleDeep: '#5d3fd1',
  lilac: '#d9c8ff',
  brown: '#9b6b43',
} as const;

/** Rainbow, top to bottom. */
export const RAINBOW = [FLAT.red, FLAT.orange, FLAT.yellow, FLAT.green, FLAT.teal, FLAT.purple] as const;

/** Pixel sprites as character grids. '.' is transparent; letters index the palette. */
export type Sprite = {rows: string[]; palette: Record<string, string>};

export const SPRITES = {
  creeper: {
    rows: ['gggggggg', 'gGggggGg', 'gDDggDDg', 'gDDggDDg', 'gggDDggg', 'ggDDDDgg', 'ggDDDDgg', 'ggDggDgg'],
    palette: {g: '#6fd05a', G: '#8de878', D: '#23422a'},
  },
  slime: {
    rows: ['..LLLLLL..', '.LLLLLLLL.', 'LLWWLLWWLL', 'LLWDLLWDLL', 'LLLLLLLLLL', 'LPLLDDLLPL', 'LLLLLLLLLL', '.dddddddd.'],
    palette: {L: '#7be07a', W: '#ffffff', D: '#23422a', P: '#ff9fc0', d: '#3fae55'},
  },
  pig: {
    rows: ['pppppppp', 'pppppppp', 'pWDppWDp', 'pppppppp', 'ppSSSSpp', 'ppSDSDpp', 'ppSSSSpp', 'pppppppp'],
    palette: {p: '#ffb3c8', W: '#ffffff', D: '#3b2433', S: '#ff8aa8'},
  },
  heart: {
    rows: ['.RR...RR.', 'RRRR.RRRR', 'RWRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.', '..RRRRR..', '...RRR...', '....R....'],
    palette: {R: '#ff4d5e', W: '#ffd0d6'},
  },
  star: {
    rows: ['....Y....', '....Y....', '...YYY...', 'YYYYWYYYY', '.YYYYYYY.', '..YYYYY..', '..YYYYY..', '.YYY.YYY.', '.YY...YY.'],
    palette: {Y: '#ffd23f', W: '#fff4b0'},
  },
  cloud: {
    rows: ['......WWW.......', '....WWWWWWW.WW..', '..WWWWWWWWWWWWW.', '.WWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWW', 'SWWWWWWWWWWWWWWS', '.SSSSSSSSSSSSSS.'],
    palette: {W: '#ffffff', S: '#cfe6ff'},
  },
  sparkle: {
    rows: ['...W...', '...W...', '..WWW..', 'WWWWWWW', '..WWW..', '...W...', '...W...'],
    palette: {W: '#ffffff'},
  },
  bubble: {
    rows: ['..BBBB..', '.B....B.', 'B.WW...B', 'B.W....B', 'B......B', 'B.....BB', '.B...B..', '..BBBB..'],
    palette: {B: '#9fe3ff', W: '#ffffff'},
  },
} satisfies Record<string, Sprite>;

export type SpriteName = keyof typeof SPRITES;

/** Renders a sprite as crisp rects. `px` is the screen size of one sprite pixel. */
export const PixelSprite: FC<{sprite: Sprite | SpriteName; px: number; outline?: string; style?: CSSProperties}> = ({sprite, px, outline, style}) => {
  const s: Sprite = typeof sprite === 'string' ? SPRITES[sprite] : sprite;
  const w = s.rows[0].length;
  const h = s.rows.length;
  const o = outline ? Math.max(2, Math.round(px / 2)) : 0;
  return (
    <svg
      width={w * px}
      height={h * px}
      viewBox={`0 0 ${w * px} ${h * px}`}
      shapeRendering="crispEdges"
      style={{overflow: 'visible', filter: outline ? `drop-shadow(${o}px 0 0 ${outline}) drop-shadow(${-o}px 0 0 ${outline}) drop-shadow(0 ${o}px 0 ${outline}) drop-shadow(0 ${-o}px 0 ${outline})` : undefined, ...style}}
    >
      {s.rows.flatMap((row, y) => [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px + 0.5} height={px + 0.5} fill={s.palette[c]} />)))}
    </svg>
  );
};

/** A flat "card": ink border, light top edge, hard drop shadow. Use for panels, buttons, tags. */
export const flatBox = (fill: string, opts: {radius?: number; border?: number; shadow?: number; edge?: string} = {}): CSSProperties => {
  const {radius = 12, border = 6, shadow = 10, edge} = opts;
  return {
    background: fill,
    border: `${border}px solid ${FLAT.ink}`,
    borderRadius: radius,
    boxShadow: `0 ${shadow}px 0 ${FLAT.ink}${edge ? `, inset 0 6px 0 ${edge}` : ''}`,
    boxSizing: 'border-box',
  };
};

/** Sticker lettering: a white halo around an ink outline around coloured fill. */
export const Sticker: FC<{size?: number; color?: string; halo?: boolean; style?: CSSProperties; children: ReactNode}> = ({size = 96, color = FLAT.yellow, halo = true, style, children}) => {
  const ring = (r: number, c: string) => {
    const pts: string[] = [];
    for (let a = 0; a < 16; a++) pts.push(`${(Math.cos((a / 16) * Math.PI * 2) * r).toFixed(1)}px ${(Math.sin((a / 16) * Math.PI * 2) * r).toFixed(1)}px 0 ${c}`);
    return pts;
  };
  const r1 = Math.max(3, size / 14);
  const shadows = [...(halo ? ring(r1 * 2.1, '#ffffff') : []), ...ring(r1, FLAT.ink), `0 ${r1 * 2.4}px 0 ${FLAT.ink}`];
  return (
    <span style={{fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, whiteSpace: 'pre', WebkitFontSmoothing: 'none', textShadow: shadows.join(','), ...style}}>{children}</span>
  );
};

/** Deterministic wobble 0..1 -> -1..1 for jelly / bounce motion. */
export const jelly = (t: number, k = 3) => Math.sin(t * Math.PI * k) * Math.exp(-t * 4);
