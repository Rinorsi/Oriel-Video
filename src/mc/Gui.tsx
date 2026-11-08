import type {CSSProperties, FC, ReactNode} from 'react';
import {Img} from 'remotion';
import {block, item, tex} from './assets';
import {resolveItem} from './manifest';
import {McText} from './McText';

const pixelated: CSSProperties = {imageRendering: 'pixelated'};

/**
 * A block item drawn as the small isometric cube the game shows in slots.
 * Three faces with CSS transforms; side faces shaded like vanilla GUI lighting.
 */
export const BlockIcon: FC<{top: string; left: string; right: string; size: number; style?: CSSProperties}> = ({top, left, right, size, style}) => {
  // Real CSS 3D cube in the vanilla GUI orientation (pitch 30, yaw 45). Edge chosen so the
  // silhouette (~1.41 edge wide) fills about 90% of the slot, like the game.
  const e = size * 0.62;
  const face = (src: string, transform: string, shade: number): CSSProperties => ({
    position: 'absolute',
    left: -e / 2,
    top: -e / 2,
    width: e,
    height: e,
    backgroundImage: `url(${block(src)})`,
    backgroundSize: '100% 100%',
    transform,
    filter: shade < 1 ? `brightness(${shade})` : undefined,
    backfaceVisibility: 'hidden',
    ...pixelated,
  });
  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <div style={{position: 'absolute', left: size / 2, top: size / 2, transformStyle: 'preserve-3d', transform: 'rotateX(-30deg) rotateY(45deg)'}}>
        <div style={face(top, `rotateX(90deg) translateZ(${e / 2}px)`, 1)} />
        {/* After rotateY(45): the -X face points screen-left, the +Z face screen-right. */}
        <div style={face(left, `rotateY(-90deg) translateZ(${e / 2}px)`, 0.8)} />
        <div style={face(right, `translateZ(${e / 2}px)`, 0.6)} />
      </div>
    </div>
  );
};

/** A Minecraft item (16x16 sprite, or a cube for block items) drawn at `size` px, optionally glinting. */
export const ItemSprite: FC<{
  id: string;
  size: number;
  glint?: number; // animation phase in seconds; undefined = no glint
  style?: CSSProperties;
}> = ({id, size, glint, style}) => {
  const look = resolveItem(id);
  if (look.kind === 'block') return <BlockIcon top={look.top} left={look.front} right={look.side} size={size} style={style} />;
  const src = item(id);
  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <Img src={src} style={{width: size, height: size, display: 'block', ...pixelated}} />
      {glint !== undefined && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${tex('misc/enchanted_glint_item.png')})`,
            backgroundSize: `${size * 4}px ${size * 4}px`,
            backgroundPosition: `${(glint * size * 0.9) % (size * 4)}px ${(glint * size * 0.35) % (size * 4)}px`,
            mixBlendMode: 'plus-lighter',
            opacity: 0.4,
            WebkitMaskImage: `url(${src})`,
            WebkitMaskSize: '100% 100%',
            maskImage: `url(${src})`,
            maskSize: '100% 100%',
            ...pixelated,
          }}
        />
      )}
    </div>
  );
};

/** One block texture face (16x16), pixelated. */
export const BlockFace: FC<{src: string; size: number; style?: CSSProperties}> = ({src, size, style}) => (
  <Img src={src} style={{width: size, height: size, display: 'block', ...pixelated, ...style}} />
);

/**
 * A vanilla container screen drawn from its real texture (256x256 sheet, panel at 0,0).
 * Children are positioned in GUI pixels via <GuiAt>, which multiplies by `scale`.
 */
export const ContainerGui: FC<{
  texture: string; // e.g. 'gui/container/crafting_table.png'
  scale: number;
  width?: number;
  height?: number;
  title?: string;
  style?: CSSProperties;
  children?: ReactNode;
}> = ({texture, scale, width = 176, height = 166, title, style, children}) => (
  <div
    style={{
      position: 'relative',
      width: width * scale,
      height: height * scale,
      backgroundImage: `url(${tex(texture)})`,
      backgroundSize: `${256 * scale}px ${256 * scale}px`,
      backgroundRepeat: 'no-repeat',
      filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.55))',
      ...pixelated,
      ...style,
    }}
  >
    {title && (
      <div style={{position: 'absolute', left: 8 * scale, top: 4 * scale}}>
        <McText size={36} color="#404040" shadow={false}>
          {title}
        </McText>
      </div>
    )}
    <ScaleContext scale={scale}>{children}</ScaleContext>
  </div>
);

// Tiny scale passing without React context overhead: GuiAt reads it from a CSS variable.
const ScaleContext: FC<{scale: number; children?: ReactNode}> = ({scale, children}) => (
  <div style={{position: 'absolute', inset: 0, ['--s' as string]: scale}}>{children}</div>
);

/** Place children at GUI pixel coordinates inside a ContainerGui. */
export const GuiAt: FC<{x: number; y: number; scale: number; style?: CSSProperties; children?: ReactNode}> = ({
  x,
  y,
  scale,
  style,
  children,
}) => <div style={{position: 'absolute', left: x * scale, top: y * scale, ...style}}>{children}</div>;

/** An item sitting in a 16x16 slot, with the stack count in the corner like the game draws it. */
export const SlotItem: FC<{id: string; scale: number; count?: number; glint?: number; style?: CSSProperties}> = ({
  id,
  scale,
  count,
  glint,
  style,
}) => (
  <div style={{position: 'relative', width: 16 * scale, height: 16 * scale, ...style}}>
    <ItemSprite id={id} size={16 * scale} glint={glint} />
    {count !== undefined && count > 1 && (
      <div style={{position: 'absolute', right: -scale, bottom: -scale * 2.5}}>
        <McText size={Math.round((scale * 8) / 12) * 12 || 36}>{String(count)}</McText>
      </div>
    )}
  </div>
);

/** A vanilla GUI sprite (from gui/sprites/...) cropped to `w`x`h` GUI pixels, revealed by `progress`. */
export const ProgressSprite: FC<{
  sprite: string;
  w: number;
  h: number;
  scale: number;
  progress: number; // 0..1
  direction: 'right' | 'up';
}> = ({sprite, w, h, scale, progress, direction}) => {
  const p = Math.max(0, Math.min(1, progress));
  const clip = direction === 'right' ? `inset(0 ${(1 - p) * 100}% 0 0)` : `inset(${(1 - p) * 100}% 0 0 0)`;
  return (
    <Img
      src={tex(sprite)}
      style={{width: w * scale, height: h * scale, display: 'block', clipPath: clip, ...pixelated}}
    />
  );
};

/** The purple-bordered item tooltip box the game draws on hover. */
export const Tooltip: FC<{lines: {text: string; color: string}[]; size?: number; style?: CSSProperties}> = ({
  lines,
  size = 48,
  style,
}) => {
  const u = size / 12;
  return (
    <div
      style={{
        background: 'rgba(16,0,16,0.94)',
        padding: `${u * 3}px ${u * 4}px ${u * 4}px`,
        boxShadow: `inset 0 0 0 ${u}px #100010, inset 0 0 0 ${u * 2}px #5000FF66`,
        borderRadius: u,
        display: 'flex',
        flexDirection: 'column',
        gap: u * 1.5,
        ...style,
      }}
    >
      {lines.map((l, i) => (
        <McText key={i} size={i === 0 ? size : Math.round((size * 0.75) / 12) * 12} color={l.color}>
          {l.text}
        </McText>
      ))}
    </div>
  );
};
