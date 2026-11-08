import type {CSSProperties, FC} from 'react';
import {block} from '../../../mc/assets';
import {Bold, C, Fancy, GOLD_EDGE, Label, RARITY, grad, mix, px, rgba, type RarityKey} from './common';

/** Item name plate: rarity-coloured name, rarity chip and power value. `shine` 0..1 sweeps a highlight across it. */
export const Plate: FC<{name: string; rar: RarityKey; power: number | string; w?: number; style?: CSSProperties; shine?: number}> = ({name, rar, power, w = 420, style, shine = 0}) => {
  const r = RARITY[rar];
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: 156,
        boxSizing: 'border-box',
        padding: 8,
        background: rar === 'unique' ? GOLD_EDGE : `linear-gradient(135deg, ${mix(r.color, '#ffffff', 0.35)}, ${r.color} 40%, ${mix(r.color, '#000000', 0.5)})`,
        boxShadow: `0 0 0 4px ${C.ink}, 0 10px 0 4px rgba(0,0,0,.5), 0 0 ${rar === 'common' ? 0 : 36}px ${rgba(r.color, 0.55)}`,
        flex: 'none',
        ...style,
      }}
    >
      <div style={{position: 'absolute', inset: 8, background: 'linear-gradient(180deg, #2a1d14 0%, #150e09 100%)', boxShadow: 'inset 0 0 0 2px rgba(255,220,150,.18), inset 0 -16px 30px rgba(0,0,0,.5)'}} />
      {shine > 0 && shine < 1 && (
        <div style={{position: 'absolute', left: 8, right: 8, top: 8, bottom: 8, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -120 + shine * (w + 120), top: -10, width: 60, height: 200, transform: 'skewX(-20deg)', background: 'rgba(255,240,200,.38)'}} />
        </div>
      )}
      <div style={{position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8}}>
        <Fancy size={44} fill={grad(r.color)} stroke={4} drop={4}>
          {name}
        </Fancy>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
          <div style={{padding: '2px 12px', background: rgba(r.color, 0.22), border: `3px solid ${r.color}`}}>
            <Label size={24} color={r.color}>
              {r.name}
            </Label>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <Label size={24} color={C.gold3}>
              战力
            </Label>
            <Bold size={36} color={C.gold3}>
              {String(power)}
            </Bold>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Barrel prop (real barrel textures) standing on the floor at (x, y = bottom). */
export const Barrel: FC<{x: number; y: number; s?: number}> = ({x, y, s = 8}) => (
  <div style={{position: 'absolute', left: x - 8 * s, top: y - 16 * s}}>
    <div style={{position: 'absolute', left: 0, top: 14 * s, width: 16 * s, height: 2 * s, background: 'rgba(0,0,0,.55)', filter: 'blur(6px)'}} />
    <div style={{width: 16 * s, height: 16 * s, backgroundImage: `url(${block('barrel_side')})`, backgroundSize: `${16 * s}px ${16 * s}px`, ...px, filter: 'brightness(0.5) saturate(0.9)', boxShadow: `0 0 0 ${s / 2}px ${C.ink}`}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: 16 * s, height: 3 * s, backgroundImage: `url(${block('barrel_top')})`, backgroundSize: `${16 * s}px ${16 * s}px`, ...px, filter: 'brightness(0.62)', borderBottom: `${s / 2}px solid ${C.ink}`}} />
  </div>
);
