// A cheap isometric floor for HUD / UI context shots: real MC block textures on a tilted plane, graded dark with a
// teal (swamp), crypt (cold blue) or ember (red-gold) wash and soft light pools. Not part of the public kit API.
import type {FC, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {block} from '../../../mc/assets';

const TINT = {
  swamp: {grade: 'rgba(8,38,34,0.62)', light: 'rgba(140,255,200,0.16)', mid: '#0B1A18'},
  crypt: {grade: 'rgba(8,16,36,0.64)', light: 'rgba(120,170,255,0.16)', mid: '#0A1020'},
  ember: {grade: 'rgba(40,10,8,0.58)', light: 'rgba(255,170,60,0.22)', mid: '#1A0C08'},
} as const;

export const McdFloor: FC<{tint?: keyof typeof TINT; path?: string; base?: string; shift?: number; children?: ReactNode}> = ({tint = 'swamp', path = 'stone_bricks', base = 'moss_block', shift = 0, children}) => {
  const t = TINT[tint];
  const tile = 96;
  return (
    <AbsoluteFill style={{background: t.mid, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, perspective: 1600, perspectiveOrigin: '50% -20%'}}>
        <div
          style={{
            position: 'absolute',
            left: -700,
            top: -500,
            width: 3300,
            height: 3000,
            transform: `rotateX(56deg) rotateZ(-34deg) translate(${shift}px, ${shift * 0.4}px)`,
            transformOrigin: '50% 50%',
            backgroundColor: '#0c1612',
            backgroundImage: `url(${block(base)})`,
            backgroundSize: `${tile}px ${tile}px`,
            imageRendering: 'pixelated',
          }}
        >
          <div style={{position: 'absolute', left: 1050, top: 0, width: 5 * tile, height: 3000, backgroundImage: `url(${block(path)})`, backgroundSize: `${tile}px ${tile}px`, imageRendering: 'pixelated', boxShadow: '0 0 0 14px rgba(0,0,0,0.35)'}} />
          <div style={{position: 'absolute', left: 0, top: 1150, width: 3300, height: 4 * tile, backgroundImage: `url(${block(path)})`, backgroundSize: `${tile}px ${tile}px`, imageRendering: 'pixelated', boxShadow: '0 0 0 14px rgba(0,0,0,0.35)'}} />
        </div>
      </div>
      <AbsoluteFill style={{background: t.grade}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 36% 30% at 24% 20%, ${t.light}, rgba(0,0,0,0) 70%), radial-gradient(ellipse 34% 28% at 78% 30%, ${t.light}, rgba(0,0,0,0) 70%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 80% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)'}} />
      {children}
    </AbsoluteFill>
  );
};
