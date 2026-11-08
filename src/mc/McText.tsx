import type {CSSProperties, FC, ReactNode} from 'react';
import {PIXEL_FONT, TITLE_FONT} from './fonts';
import {textShadowColor} from './theme';

/**
 * Text drawn like Minecraft: pixel font plus a hard drop shadow one font-pixel down-right,
 * at 25% of the text colour. Keep `size` a multiple of 12 so the pixel font stays crisp.
 */
export const McText: FC<{
  size?: number;
  color?: string;
  shadow?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}> = ({size = 48, color = '#FFFFFF', shadow = true, style, children}) => {
  const px = size / 12;
  return (
    <span
      style={{
        fontFamily: PIXEL_FONT,
        fontSize: size,
        lineHeight: 1.25,
        color,
        whiteSpace: 'pre',
        textShadow: shadow ? `${px}px ${px}px 0 ${textShadowColor(color)}` : undefined,
        WebkitFontSmoothing: 'none',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Big display title: slanted bold face with a stacked "block" extrusion, the way MC thumbnails
 * and title cards fake depth. `depth` is the number of extrusion steps.
 */
export const BlockTitle: FC<{
  size?: number;
  color?: string;
  edge?: string;
  depth?: number;
  style?: CSSProperties;
  children: ReactNode;
}> = ({size = 150, color = '#FFFFFF', edge = '#3A2A12', depth = 8, style, children}) => {
  const step = Math.max(1, Math.round(size / 60));
  const shadows: string[] = [];
  for (let i = 1; i <= depth; i++) shadows.push(`${i * step}px ${i * step}px 0 ${edge}`);
  shadows.push(`${(depth + 3) * step}px ${(depth + 4) * step}px ${size / 8}px rgba(0,0,0,0.55)`);
  return (
    <span
      style={{
        fontFamily: TITLE_FONT,
        fontSize: size,
        lineHeight: 1.05,
        color,
        whiteSpace: 'pre',
        WebkitTextStroke: `${Math.max(2, size / 40)}px ${edge}`,
        paintOrder: 'stroke fill',
        textShadow: shadows.join(','),
        ...style,
      }}
    >
      {children}
    </span>
  );
};
