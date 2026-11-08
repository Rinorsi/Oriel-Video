import type {CSSProperties, FC, ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {item, tex} from '../mc/assets';
import {PIXEL8_FONT, PIXEL_FONT} from '../mc/fonts';

/**
 * Ore-style UI for videos, built on Oriel's own Ore theme textures (kit/, drawn by us).
 * One texture pixel is one GUI pixel, and the video runs at GUI scale 4: every size, gap and
 * offset here is a multiple of U, so bevels and text pixels line up on one grid.
 */

export const U = 4;
/** Type scale: every step is a whole number of screen pixels per font pixel. */
export const TYPE = {
  hero: 144, // Fusion 12 x 12
  h1: 96, // Fusion 12 x 8
  body: 48, // Fusion 12 x 4
  small: 32, // Fusion 8 x 4
} as const;

export const ORE = {
  surface1: '#313233',
  surface2: '#242425',
  surface3: '#1e1e1f',
  text: '#ffffff',
  dim: '#b1b2b5',
  faint: '#8c8d90',
  dark: '#1e1e1f',
  green: '#3c8527',
  greenLight: '#6cc349',
  gold: '#f8af2b',
  yellow: '#e5c317',
  purple: '#7345e5',
} as const;

const oreTex = (name: string) => staticFile(`oriel/ore/${name}.png`);

/** Nine-slice an Ore texture; `slice` is [top, right, bottom, left] in texture pixels. */
export const nine = (name: string, slice: [number, number, number, number]): CSSProperties => ({
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderWidth: `${slice[0] * U}px ${slice[1] * U}px ${slice[2] * U}px ${slice[3] * U}px`,
  borderImageSource: `url(${oreTex(name)})`,
  borderImageSlice: `${slice.join(' ')} fill`,
  borderImageRepeat: 'stretch',
  imageRendering: 'pixelated',
  boxSizing: 'border-box',
});

export const OreText: FC<{size?: number; color?: string; shadow?: boolean; style?: CSSProperties; children: ReactNode}> = ({size = TYPE.body, color = ORE.text, shadow, style, children}) => {
  const font = size === TYPE.small ? PIXEL8_FONT : PIXEL_FONT;
  const px = size === TYPE.small ? size / 8 : size / 12;
  return (
    <span
      style={{
        fontFamily: font,
        fontSize: size,
        lineHeight: `${size}px`,
        color,
        whiteSpace: 'pre',
        WebkitFontSmoothing: 'none',
        textShadow: shadow ? `${px}px ${px}px 0 rgba(0,0,0,0.45)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const OrePanel: FC<{variant?: 'panel' | 'panel_raised' | 'panel_glass'; style?: CSSProperties; children?: ReactNode}> = ({variant = 'panel', style, children}) => (
  <div style={{...nine(variant, [2, 2, 2, 2]), boxShadow: `0 ${3 * U}px 0 rgba(0,0,0,0.45)`, ...style}}>{children}</div>
);

export type ButtonVariant = 'hero' | 'primary' | 'neutral' | 'secondary';
export type ButtonState = 'normal' | 'hover' | 'pressed';

/** Ore button. The pressed texture sinks 2 GUI px, which moves the label down with it. */
export const OreButton: FC<{variant?: ButtonVariant; state?: ButtonState; width?: number; icon?: ReactNode; style?: CSSProperties; children: ReactNode}> = ({
  variant = 'neutral',
  state = 'normal',
  width,
  icon,
  style,
  children,
}) => {
  const name = `button_${variant}${state === 'normal' ? '' : `_${state}`}`;
  const slice: [number, number, number, number] = state === 'pressed' ? [4, 2, 2, 2] : [2, 2, 4, 2];
  return (
    <div
      style={{
        ...nine(name, slice),
        height: 26 * U,
        width,
        padding: `0 ${5 * U}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3 * U,
        ...style,
      }}
    >
      {icon}
      <OreText color={variant === 'secondary' ? ORE.dark : ORE.text}>{children}</OreText>
    </div>
  );
};

/** Small inset tag, e.g. "EP.01". */
export const OreChip: FC<{children: ReactNode; color?: string; dot?: string; style?: CSSProperties}> = ({children, color = ORE.dim, dot, style}) => (
  <div style={{...nine('slot', [2, 2, 2, 2]), height: 14 * U, padding: `0 ${3 * U}px`, display: 'inline-flex', alignItems: 'center', gap: 2 * U, ...style}}>
    {dot && <div style={{width: 2 * U, height: 2 * U, background: dot}} />}
    <OreText size={TYPE.small} color={color}>
      {children}
    </OreText>
  </div>
);

/** Item slot with a 16px item sprite drawn at an integer scale. */
export const OreSlot: FC<{id?: string; size?: number; children?: ReactNode; style?: CSSProperties}> = ({id, size = 24 * U, children, style}) => (
  <div style={{...nine('slot', [2, 2, 2, 2]), width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>
    {id && <Img src={item(id)} style={{width: 16 * U, height: 16 * U, imageRendering: 'pixelated'}} />}
    {children}
  </div>
);

/** Section label with a divider that runs to the right edge ("画面 ————"). `grow` animates the rule 0..1. */
export const OreSection: FC<{label: string; grow?: number; style?: CSSProperties}> = ({label, grow = 1, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 3 * U, ...style}}>
    <OreText size={TYPE.small} color={ORE.dim}>
      {label}
    </OreText>
    <div style={{flex: 1, height: U, display: 'flex'}}>
      <div style={{width: `${grow * 100}%`, height: U, background: ORE.surface3, boxShadow: `0 ${U}px 0 #48494a`}} />
    </div>
  </div>
);

export const OreProgress: FC<{value: number; width: number; color?: 'green' | 'gold' | 'red' | 'blue'}> = ({value, width, color = 'green'}) => {
  const inner = width - 4 * U;
  const fill = Math.round((inner * Math.max(0, Math.min(1, value))) / U) * U;
  return (
    <div style={{...nine('track', [2, 2, 2, 2]), width, height: 8 * U, position: 'relative'}}>
      {fill > 0 && <div style={{...nine(`fill_${color}`, [1, 0, 1, 0]), width: fill, height: '100%'}} />}
    </div>
  );
};

/** Steve's face (with hat layer) from the vanilla skin, as an avatar. */
export const PlayerFace: FC<{size: number; skin?: string}> = ({size, skin = 'entity/player/wide/steve.png'}) => {
  const k = size / 8;
  const layer = (x: number): CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${tex(skin)})`,
    backgroundSize: `${64 * k}px ${64 * k}px`,
    backgroundPosition: `${-x * k}px ${-8 * k}px`,
    imageRendering: 'pixelated',
  });
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div style={layer(8)} />
      <div style={layer(40)} />
    </div>
  );
};

/** Pixel arrow cursor (white with a black outline), tip at the top-left corner. */
const CURSOR = [
  'X',
  'XX',
  'XWX',
  'XWWX',
  'XWWWX',
  'XWWWWX',
  'XWWWWWX',
  'XWWWWWWX',
  'XWWWWWWWX',
  'XWWWWWXXXX',
  'XWWXWWX',
  'XWX XWWX',
  'XX  XWWX',
  '     XWWX',
  '     XXX',
];

export const PixelCursor: FC<{x: number; y: number; scale?: number}> = ({x, y, scale = U}) => (
  <svg width={10 * scale} height={15 * scale} style={{position: 'absolute', left: x, top: y, overflow: 'visible', filter: `drop-shadow(${scale}px ${scale}px 0 rgba(0,0,0,0.35))`}} shapeRendering="crispEdges">
    {CURSOR.flatMap((row, j) =>
      [...row].map((c, i) => (c === ' ' ? null : <rect key={`${i}-${j}`} x={i * scale} y={j * scale} width={scale} height={scale} fill={c === 'X' ? '#000' : '#fff'} />)),
    )}
  </svg>
);

/** Ore-like play triangle icon, drawn on the pixel grid. */
export const PlayIcon: FC<{size?: number; color?: string}> = ({size = 12 * U, color = '#fff'}) => {
  const n = size / U;
  const rects: ReactNode[] = [];
  for (let i = 0; i < n / 2 + 1; i++) {
    const h = n - i * 2;
    if (h <= 0) break;
    rects.push(<rect key={i} x={i * U} y={i * U} width={U} height={h * U} fill={color} />);
  }
  return (
    <svg width={size * 0.75} height={size} shapeRendering="crispEdges">
      {rects}
    </svg>
  );
};

/**
 * The Minecraft logo look in our pixel font: stone fill in two hard tone bands, a one-font-pixel
 * black outline and a two-step extrusion, like the "JAVA EDITION" plate under the title logo.
 */
export const StoneTitle: FC<{size?: number; style?: CSSProperties; children: string}> = ({size = TYPE.hero, style, children}) => {
  const p = size / 12;
  const outline = (dy: number) => [
    `${p}px ${dy}px 0 #000`,
    `${-p}px ${dy}px 0 #000`,
    `0 ${dy + p}px 0 #000`,
    `0 ${dy - p}px 0 #000`,
    `${p}px ${dy + p}px 0 #000`,
    `${-p}px ${dy + p}px 0 #000`,
    `${p}px ${dy - p}px 0 #000`,
    `${-p}px ${dy - p}px 0 #000`,
  ];
  const back = [`0 ${p}px 0 #6f6865`, `0 ${2 * p}px 0 #4a4442`, ...outline(0), ...outline(p), ...outline(2 * p)].join(',');
  const text: CSSProperties = {fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, whiteSpace: 'pre', WebkitFontSmoothing: 'none', letterSpacing: p};
  return (
    <div style={{position: 'relative', display: 'inline-block', ...style}}>
      <span style={{...text, color: '#8a8380', textShadow: back}}>{children}</span>
      <span
        style={{
          ...text,
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundImage: `url(${tex('block/stone.png')}), linear-gradient(180deg, #ece6e2 0%, #ece6e2 46%, #c4bcb8 46%, #c4bcb8 78%, #a29a96 78%)`,
          backgroundSize: `${16 * p}px ${16 * p}px, 100% 100%`,
          backgroundBlendMode: 'soft-light',
          imageRendering: 'pixelated',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {children}
      </span>
    </div>
  );
};

/** Title-screen splash text: yellow, tilted, pulsing. `f` drives the pulse. */
export const Splash: FC<{f: number; x: number; y: number; pop?: number; size?: number; children: string}> = ({f, x, y, pop = 1, size = TYPE.body, children}) => {
  const pulse = 1.0 - Math.abs(Math.sin((f / 30) * Math.PI)) * 0.06;
  const small = size === TYPE.small;
  const p = small ? size / 8 : size / 12;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(-20deg) scale(${pulse * pop})`, transformOrigin: '50% 50%'}}>
      <span style={{fontFamily: small ? PIXEL8_FONT : PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color: '#FFFF55', whiteSpace: 'pre', WebkitFontSmoothing: 'none', textShadow: `${p}px ${p}px 0 #3F3F15`}}>{children}</span>
    </div>
  );
};
