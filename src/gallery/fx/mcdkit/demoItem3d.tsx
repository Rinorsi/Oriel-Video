// mcd-kit-item3d: ItemIcon3D (voxel-extruded real MC item textures) next to the flat sprite, the big detail render and rarity slots.
// Targets: inventory-gear.png / tooltip-webbed-bow.png (large item render with thick blocky edge, soft shadow), gilded-items.png
// (full gold slots), inventory-final-unique.jpg (rarity frames + level counters).
import type {FC} from 'react';
import {Img, useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {Cap, Pop, Rise, win} from './common';
import {
  BevelSlot,
  Embers,
  ItemIcon3D,
  McdBackdrop,
  McdText,
  PxText,
  RarityTag,
  WhiteFlash,
  itemTex,
  type Rarity,
} from './kit';

const COMPARE = ['diamond_pickaxe', 'bow', 'golden_helmet', 'trident', 'enchanted_book'];

const GRID: {src: string; r: Rarity; n: number; isNew?: boolean}[] = [
  {src: 'diamond_sword', r: 'unique', n: 35, isNew: true},
  {src: 'bow', r: 'rare', n: 29},
  {src: 'iron_pickaxe', r: 'common', n: 15},
  {src: 'netherite_axe', r: 'gilded', n: 41, isNew: true},
  {src: 'iron_chestplate', r: 'common', n: 22},
  {src: 'golden_sword', r: 'unique', n: 31},
  {src: 'crossbow_standby', r: 'rare', n: 26},
  {src: 'mace', r: 'gilded', n: 44},
  {src: 'totem_of_undying', r: 'unique', n: 30},
  {src: 'firework_rocket', r: 'common', n: 4},
  {src: 'golden_apple', r: 'rare', n: 12},
  {src: 'trident', r: 'unique', n: 38},
];

export const Item3dDemo: FC = () => {
  const f = useCurrentFrame();
  const sway = Math.sin(f * 0.07) * 5;
  const sel = Math.floor(Math.max(0, f - 70) / 14) % 12;
  const selOn = f >= 70;
  const heroIn = EASE.back(win(f, 4, 14));
  return (
    <McdBackdrop kind="inventory" drift={f * 0.5} cell={44}>
      {/* hero render */}
      <div style={{position: 'absolute', left: 80, top: 70}}>
        <Rise at={0}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <PxText text="35" px={5} />
            <RarityTag rarity="unique" size={28} />
          </div>
        </Rise>
        <Rise at={4}>
          <div style={{marginTop: 18}}>
            <PxText text="DIAMOND SWORD" px={6} />
          </div>
        </Rise>
      </div>
      <div style={{position: 'absolute', left: 130, top: 270, width: 640, height: 640, transform: `scale(${0.6 + 0.4 * heroIn}) rotate(${sway}deg)`, transformOrigin: '50% 60%', opacity: heroIn > 0.05 ? 1 : 0}}>
        <ItemIcon3D src={itemTex('diamond_sword')} size={640} depth={16} glow="rgba(255,150,40,0.35)" />
      </div>
      <Embers count={22} area={[80, 300, 760, 640]} size={8} seed={21} speed={0.7} style={{opacity: 0.8 * win(f, 20, 20)}} />

      {/* flat vs 3D */}
      <div style={{position: 'absolute', left: 940, top: 60, display: 'flex', gap: 28}}>
        {COMPARE.map((id, i) => (
          <Pop key={id} at={14 + i * 5} origin="50% 0%">
            <div style={{width: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
              <Img src={itemTex(id)} style={{width: 96, height: 96, imageRendering: 'pixelated', opacity: 0.55}} />
              <ItemIcon3D src={itemTex(id)} size={132} depth={6} rot={i % 2 ? 0 : 0} />
            </div>
          </Pop>
        ))}
      </div>
      <div style={{position: 'absolute', left: 940, top: 392, display: 'flex', gap: 40}}>
        <Rise at={36}>
          <Cap size={22}>Flat texture / extruded render</Cap>
        </Rise>
      </div>

      {/* slot grid */}
      <div style={{position: 'absolute', left: 940, top: 450, display: 'grid', gridTemplateColumns: 'repeat(4, 190px)', gap: 24}}>
        {GRID.map((g, i) => (
          <Pop key={g.src} at={30 + i * 3} origin="50% 50%">
            <BevelSlot size={190} rarity={g.r} isNew={g.isNew} count={g.n} selected={selOn && i === sel}>
              <ItemIcon3D src={itemTex(g.src)} size={128} depth={5} />
            </BevelSlot>
          </Pop>
        ))}
      </div>
      <WhiteFlash at={4} dur={5} peak={0.2} steps={2} />
      <div style={{position: 'absolute', left: 80, bottom: 56, display: 'flex', gap: 26}}>
        {['POWER', 'SPEED', 'AREA'].map((l, i) => (
          <Rise key={l} at={50 + i * 4}>
            <div style={{width: 230}}>
              <McdText size={20} weight={700} color="#E4E4E4" style={{letterSpacing: 1.5}}>{l}</McdText>
              <div style={{position: 'relative', height: 4, background: '#5A5658', marginTop: 8}}>
                <div style={{position: 'absolute', left: 0, top: -2, bottom: -2, width: `${[62, 38, 24][i] * EASE.out(win(f, 54 + i * 4, 16))}%`, background: '#fff'}} />
              </div>
            </div>
          </Rise>
        ))}
      </div>
    </McdBackdrop>
  );
};
