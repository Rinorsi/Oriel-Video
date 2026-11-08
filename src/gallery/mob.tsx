import type {CSSProperties, FC, ReactNode} from 'react';
import {tex} from '../mc/assets';

/**
 * Real Minecraft mob textures, cropped. Use these instead of hand-drawn lookalikes.
 * Textures come from the game jar (npm run setup): public/mc/textures/entity/...
 * `scale` is how many screen pixels one texture pixel gets (use whole numbers so it stays crisp).
 *
 * UV cheat sheet (Java models, texture pixels):
 *   a box of w x h x d at texOffs (u, v) has its FRONT face at (u + d, v + d) sized w x h,
 *   RIGHT at (u, v + d) d x h, LEFT at (u + d + w, v + d), BACK at (u + 2d + w, v + d), TOP at (u + d, v) w x d,
 *   BOTTOM at (u + d + w, v) w x d.
 *   Creeper head 8x8x8 @ (0,0)  -> front (8,8,8,8).      Enderman head: same, plus enderman_eyes.png overlay.
 *   Villager head 8x10x8 @ (0,0) -> front (8,8,8,10); nose 2x4x1 @ (24,0) -> front (25,1,2,4).
 *   Chest (64x64): lid 14x5x14 @ (0,0), base 14x10x14 @ (0,19), latch 2x4x1 @ (0,0).
 *     lid front (14,14,14,5), lid top (14,0,14,14), base front (14,33,14,10), base top (14,19,14,14), latch front (1,1,2,4).
 */

export type Rect = [number, number, number, number];

/** One cropped rectangle of a texture sheet, drawn at an integer scale. */
export const Crop: FC<{src: string; sheet: [number, number]; rect: Rect; scale: number; style?: CSSProperties; children?: ReactNode}> = ({src, sheet, rect, scale, style, children}) => (
  <div
    style={{
      width: rect[2] * scale,
      height: rect[3] * scale,
      backgroundImage: `url(${src})`,
      backgroundSize: `${sheet[0] * scale}px ${sheet[1] * scale}px`,
      backgroundPosition: `${-rect[0] * scale}px ${-rect[1] * scale}px`,
      imageRendering: 'pixelated',
      flex: 'none',
      ...style,
    }}
  >
    {children}
  </div>
);

export const CreeperHead: FC<{scale?: number; style?: CSSProperties}> = ({scale = 16, style}) => <Crop src={tex('entity/creeper/creeper.png')} sheet={[64, 32]} rect={[8, 8, 8, 8]} scale={scale} style={style} />;

/** Enderman head; `eyes` (0..1) fades in the glowing purple eyes. */
export const EndermanHead: FC<{scale?: number; eyes?: number; style?: CSSProperties}> = ({scale = 16, eyes = 1, style}) => (
  <Crop src={tex('entity/enderman/enderman.png')} sheet={[64, 32]} rect={[8, 8, 8, 8]} scale={scale} style={{position: 'relative', ...style}}>
    <Crop src={tex('entity/enderman/enderman_eyes.png')} sheet={[64, 32]} rect={[8, 8, 8, 8]} scale={scale} style={{position: 'absolute', left: 0, top: 0, opacity: eyes, filter: `drop-shadow(0 0 ${scale}px #c35bff)`}} />
  </Crop>
);

/** Villager face with the long nose. `noseY` is the nose top in head texels. */
export const VillagerHead: FC<{scale?: number; noseY?: number; style?: CSSProperties}> = ({scale = 16, noseY = 5, style}) => (
  <Crop src={tex('entity/villager/villager.png')} sheet={[64, 64]} rect={[8, 8, 8, 10]} scale={scale} style={{position: 'relative', ...style}}>
    <Crop src={tex('entity/villager/villager.png')} sheet={[64, 64]} rect={[25, 1, 2, 4]} scale={scale} style={{position: 'absolute', left: 3 * scale, top: noseY * scale}} />
  </Crop>
);

export const PigHead: FC<{scale?: number; style?: CSSProperties}> = ({scale = 16, style}) => (
  <Crop src={tex('entity/pig/pig_temperate.png')} sheet={[64, 64]} rect={[8, 8, 8, 8]} scale={scale} style={{position: 'relative', ...style}}>
    <Crop src={tex('entity/pig/pig_temperate.png')} sheet={[64, 64]} rect={[17, 17, 4, 3]} scale={scale} style={{position: 'absolute', left: 2 * scale, top: 4 * scale}} />
  </Crop>
);

/** Front view of the vanilla chest (lid + base + latch); `open` 0..1 lifts the lid. */
export const ChestFront: FC<{scale?: number; open?: number; style?: CSSProperties}> = ({scale = 16, open = 0, style}) => {
  const src = tex('entity/chest/normal.png');
  return (
    <div style={{position: 'relative', width: 14 * scale, height: 15 * scale, ...style}}>
      <Crop src={src} sheet={[64, 64]} rect={[14, 33, 14, 10]} scale={scale} style={{position: 'absolute', left: 0, top: 5 * scale}} />
      <Crop src={src} sheet={[64, 64]} rect={[14, 14, 14, 5]} scale={scale} style={{position: 'absolute', left: 0, top: -open * 6 * scale, transform: `rotate(${-open * 8}deg)`, transformOrigin: '50% 100%'}} />
      <Crop src={src} sheet={[64, 64]} rect={[1, 1, 2, 4]} scale={scale} style={{position: 'absolute', left: 6 * scale, top: (2 - open * 6) * scale}} />
    </div>
  );
};
