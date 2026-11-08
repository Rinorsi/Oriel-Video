import type {CSSProperties, FC} from 'react';
import {tex} from '../../../mc/assets';
import {Crop, CreeperHead, PigHead} from '../../mob';

/**
 * Real vanilla mob faces for the cute info styles (slime / pig / creeper), cut from entity textures.
 * `scale` = screen px per texture pixel (keep it a whole number). A dark outline is added with stacked drop-shadows.
 */

const INK = '#2b2338';
const outline = (o: number) => [[o, 0], [-o, 0], [0, o], [0, -o]].map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${INK})`).join(' ');

const SlimeHead: FC<{scale: number}> = ({scale}) => {
  const src = tex('entity/slime/slime.png');
  const sheet: [number, number] = [64, 32];
  return (
    <div style={{position: 'relative', width: 8 * scale, height: 8 * scale}}>
      {/* inner body 6x6 (0,16): front at (6,22) */}
      <Crop src={src} sheet={sheet} rect={[6, 22, 6, 6]} scale={scale} style={{position: 'absolute', left: scale, top: scale}} />
      <Crop src={src} sheet={sheet} rect={[34, 2, 2, 2]} scale={scale} style={{position: 'absolute', left: scale, top: 2 * scale}} />
      <Crop src={src} sheet={sheet} rect={[34, 6, 2, 2]} scale={scale} style={{position: 'absolute', left: 5 * scale, top: 2 * scale}} />
      <Crop src={src} sheet={sheet} rect={[33, 9, 1, 1]} scale={scale} style={{position: 'absolute', left: 4 * scale, top: 5 * scale}} />
      {/* outer translucent shell front (8,8,8,8) */}
      <Crop src={src} sheet={sheet} rect={[8, 8, 8, 8]} scale={scale} style={{position: 'absolute', left: 0, top: 0}} />
    </div>
  );
};

export type MascotKind = 'slime' | 'pig' | 'creeper';

export const MascotHead: FC<{kind: MascotKind; scale?: number; style?: CSSProperties}> = ({kind, scale = 16, style}) => (
  <div style={{filter: outline(Math.max(4, Math.round(scale / 4))), ...style}}>
    {kind === 'slime' ? <SlimeHead scale={scale} /> : kind === 'pig' ? <PigHead scale={scale} /> : <CreeperHead scale={scale} />}
  </div>
);
