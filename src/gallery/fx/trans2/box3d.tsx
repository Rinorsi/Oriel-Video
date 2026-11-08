import type {CSSProperties, FC, ReactNode} from 'react';
import {Crop, type Rect} from '../../mob';

/**
 * Textured 3D box built from real Minecraft model textures (CSS 3D, no WebGL).
 * Sizes `w x h x d` are in texels and `s` is screen px per texel, so a face is exactly rect-sized and stays
 * crisp. The box is centred on the origin of a zero-size preserve-3d container; place and rotate it with `style`.
 * Face naming follows the model: `left` is the mob's left (+x on screen when it faces the viewer), `right` is -x.
 * Rects follow the Java box UV net (see mob.tsx): front (u+d, v+d), right (u, v+d), left (u+d+w, v+d), back (u+2d+w, v+d),
 * top (u+d, v), bottom (u+d+w, v).
 */

export type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
export type FaceDef = {rect: Rect; shade?: number; children?: ReactNode; style?: CSSProperties};

export const boxUV = (u: number, v: number, w: number, h: number, d: number): Record<FaceName, Rect> => ({
  front: [u + d, v + d, w, h],
  right: [u, v + d, d, h],
  left: [u + d + w, v + d, d, h],
  back: [u + 2 * d + w, v + d, w, h],
  top: [u + d, v, w, d],
  bottom: [u + d + w, v, w, d],
});

export const TexBox: FC<{
  src: string;
  sheet: [number, number];
  w: number;
  h: number;
  d: number;
  s: number;
  faces: Partial<Record<FaceName, FaceDef>>;
  style?: CSSProperties;
}> = ({src, sheet, w, h, d, s, faces, style}) => {
  const W = w * s;
  const H = h * s;
  const D = d * s;
  const dims: Record<FaceName, [number, number, string]> = {
    front: [W, H, `translateZ(${D / 2}px)`],
    back: [W, H, `rotateY(180deg) translateZ(${D / 2}px)`],
    left: [D, H, `rotateY(90deg) translateZ(${W / 2}px)`],
    right: [D, H, `rotateY(-90deg) translateZ(${W / 2}px)`],
    top: [W, D, `rotateX(90deg) translateZ(${H / 2}px)`],
    bottom: [W, D, `rotateX(-90deg) translateZ(${H / 2}px)`],
  };
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', ...style}}>
      {(Object.keys(faces) as FaceName[]).map((name) => {
        const f = faces[name]!;
        const [fw, fh, t] = dims[name];
        return (
          <Crop key={name} src={src} sheet={sheet} rect={f.rect} scale={s} style={{position: 'absolute', left: -fw / 2, top: -fh / 2, transform: t, backfaceVisibility: 'hidden', ...f.style}}>
            {f.shade ? <div style={{position: 'absolute', inset: 0, background: `rgba(10,4,0,${f.shade})`}} /> : null}
            {f.children}
          </Crop>
        );
      })}
    </div>
  );
};
