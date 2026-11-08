import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {ChestFront} from '../../mob';
import {Beam, Burst, C, DungeonBg, EASE, Fancy, Flash, Glint, Item, MobFigure, RARITY, Shake, W, clamp01, jiggle, lerp, prog, snap, type RarityKey} from './common';
import {Barrel, Plate} from './widgets';

/**
 * rpg-loot-drop: a zombie takes a hit, topples and dissolves; three drops arc out and land.
 * Each rarity gets its own light pillar (common = short white, rare = blue, unique = tall gold with particles),
 * then a name plate (name / rarity / power) pops over the item.
 * Props: `bg` - dungeon background (Demo); `mob` - show the monster (turn off for an overlay on your own footage).
 */

export const LOOT_FRAMES = 190;

type Drop = {id: string; name: string; rar: RarityKey; power: number; x: number; at: number; fly: number};
const DROPS: Drop[] = [
  {id: 'iron_sword', name: '铁质长剑', rar: 'common', power: 42, x: 410, at: 50, fly: 22},
  {id: 'bow', name: '猎魂之弓', rar: 'rare', power: 118, x: 1510, at: 58, fly: 22},
  {id: 'diamond_sword', name: '曙光之刃', rar: 'unique', power: 236, x: 960, at: 68, fly: 26},
];
const GROUND = 880;
const ORIGIN: [number, number] = [960, 700];

const BEAM = {common: {h: 460, w: 90}, rare: {h: 700, w: 130}, unique: {h: 960, w: 190}} as const;

const SlashMark: FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 9) return null;
  const t = clamp01(f / 4);
  const fade = 1 - clamp01((f - 3) / 6);
  // stepped diagonal slash made of pixel blocks
  const n = 14;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        if (i / n > t) return null;
        const k = i / (n - 1);
        const s = 30 - Math.abs(k - 0.5) * 36;
        return <div key={i} style={{position: 'absolute', left: snap(780 + k * 360, 4), top: snap(560 + k * 300, 4), width: snap(s, 4), height: snap(s, 4), background: i % 2 ? '#fff' : '#ffe9a8', opacity: fade, boxShadow: '0 0 18px #ffd36a'}} />;
      })}
    </>
  );
};

const Monster: FC<{show: boolean}> = ({show}) => {
  const f = useCurrentFrame();
  if (!show || f > 82) return null;
  const hit = 24;
  const fall = prog(f, hit + 6, 22, (t) => 1 - Math.pow(1 - t, 2.2));
  const idle = f < hit ? Math.sin(f / 5) * 3 : 0;
  const hurt = f >= hit && f < hit + 5 ? 1 - (f - hit) / 5 : 0;
  const vanish = prog(f, 56, 22, EASE.inOut);
  const knock = prog(f, hit, 10);
  const rot = fall * 88;
  return (
    <div style={{position: 'absolute', left: 960 + 70 * knock + 90 * fall - 8 * 12, top: GROUND - 32 * 12 + idle, opacity: 1 - vanish, transform: `rotate(${rot}deg)`, transformOrigin: '50% 100%'}}>
      <MobFigure kind="zombie" s={12} hurt={hurt} />
    </div>
  );
};

const DropItem: FC<{d: Drop}> = ({d}) => {
  const f = useCurrentFrame();
  const r = RARITY[d.rar];
  const t = clamp01((f - d.at) / d.fly);
  if (f < d.at) return null;
  const land = d.at + d.fly;
  let x = lerp(ORIGIN[0], d.x, EASE.out(t));
  let y = lerp(ORIGIN[1], GROUND - 56, t) - Math.sin(t * Math.PI) * 330;
  let sq = 1;
  if (f >= land) {
    const b = clamp01((f - land) / 14);
    y = GROUND - 56 - Math.sin(b * Math.PI) * 44 * (1 - b * 0.4) + (f - land > 14 ? Math.sin((f - land) / 14) * 5 : 0);
    x = d.x;
    sq = 1 + jiggle(b, 2, 3) * -0.14;
  }
  const spin = f < land ? f * 0.5 : f * 0.09;
  const sx = f < land ? Math.cos(spin) : Math.max(0.28, Math.abs(Math.cos(spin)));
  const size = d.rar === 'unique' ? 176 : 128;
  const lift = prog(f, land, 16, EASE.back) * (d.rar === 'unique' ? 70 : 40);
  return (
    <>
      <div style={{position: 'absolute', left: x - size * 0.6, top: GROUND - 8, width: size * 1.2, height: 20, background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)', opacity: f >= land ? 1 : 0.5}} />
      <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 - lift, width: size, height: size, transform: `scale(${sx}, ${sq})`, filter: `drop-shadow(0 0 ${f >= land ? 22 : 8}px ${r.glow})`}}>
        <Item id={d.id} size={size} />
      </div>
    </>
  );
};

const LootScene: FC<{bg?: boolean; mob?: boolean}> = ({bg, mob = true}) => {
  const f = useCurrentFrame();
  const content = (
    <>
      <Monster show={mob} />
      {mob && <SlashMark at={24} />}
      {mob && <Burst x={1040} y={GROUND - 20} at={50} count={14} colors={['#6b6258', '#8a7f72', '#4d453d']} speed={9} life={30} size={18} gravity={-0.05} dir={-Math.PI / 2} spread={1.3} glow={false} seed={2} />}
      {mob && <Burst x={960} y={GROUND - 120} at={60} count={26} colors={['#5b8a3a', '#7ab648', '#3d5e28', '#b9e08a']} speed={12} life={34} size={14} gravity={-0.12} dir={-Math.PI / 2} spread={1.6} glow={false} seed={7} />}
      {DROPS.map((d, i) => {
        const land = d.at + d.fly;
        const bp = prog(f, land, d.rar === 'unique' ? 22 : 16, EASE.out);
        const bw = BEAM[d.rar];
        return (
          <div key={i}>
            <Beam x={d.x} y={GROUND + 6} h={bw.h} w={bw.w} color={RARITY[d.rar].color} p={bp} seed={i * 3 + 1} />
            {d.rar !== 'common' && <Burst x={d.x} y={GROUND} at={land} count={d.rar === 'unique' ? 34 : 18} colors={d.rar === 'unique' ? [C.gold3, C.gold2, C.torch, '#fff'] : ['#bfe2ff', '#4aa8ff', '#fff']} speed={d.rar === 'unique' ? 17 : 12} life={34} size={d.rar === 'unique' ? 14 : 10} gravity={0.5} dir={-Math.PI / 2} spread={1.25} seed={i + 4} />}
            {d.rar === 'common' && <Burst x={d.x} y={GROUND} at={land} count={9} colors={['#e8e8e8', '#bdbdbd']} speed={8} life={24} size={9} gravity={0.5} dir={-Math.PI / 2} spread={1.2} seed={i + 9} glow={false} />}
            {d.rar === 'unique' && <Glint x={d.x} y={GROUND - 100} t={(f - land) / 16} size={150} color="#fff0b8" />}
            <DropItem d={d} />
          </div>
        );
      })}
      {/* name plates */}
      {DROPS.map((d, i) => {
        const at = d.at + d.fly + 8;
        const t = prog(f, at, 14, EASE.back);
        if (f < at) return null;
        const big = d.rar === 'unique';
        const bob = Math.sin((f - at) / 18 + i) * 4;
        return (
          <div key={i} style={{position: 'absolute', left: d.x - 230, top: (big ? 440 : 570) + bob, width: 460, display: 'flex', justifyContent: 'center', transform: `scale(${t * (big ? 1.14 : 1)})`, opacity: clamp01(t * 3)}}>
            <Plate name={d.name} rar={d.rar} power={d.power} w={big ? 440 : 400} shine={prog(f, at + 10, 22, EASE.inOut)} />
          </div>
        );
      })}
      {/* header */}
      {(() => {
        const t = prog(f, 104, 16, EASE.out);
        return (
          <div style={{position: 'absolute', left: 0, right: 0, top: 96 + (1 - t) * -24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36, opacity: t}}>
            <div style={{width: 220, height: 6, background: `linear-gradient(90deg, rgba(255,181,49,0), ${C.gold2})`, boxShadow: `0 0 12px ${C.gold2}`}} />
            <Fancy size={84} spacing={14}>
              战利品
            </Fancy>
            <div style={{width: 220, height: 6, background: `linear-gradient(270deg, rgba(255,181,49,0), ${C.gold2})`, boxShadow: `0 0 12px ${C.gold2}`}} />
          </div>
        );
      })()}
      <Flash at={24} life={6} peak={0.5} />
      <Flash at={94} life={10} peak={0.35} color="#ffd36a" />
      <Sfx at={24} src={mcSound('random/anvil_land')} volume={0.3} rate={1.6} />
      <Sfx at={36} src={mcSound('dig/gravel1')} volume={0.4} />
      <Sfx at={50} src={mcSound('random/pop')} volume={0.4} rate={0.9} />
      <Sfx at={58} src={mcSound('random/pop')} volume={0.4} rate={1.05} />
      <Sfx at={68} src={mcSound('random/pop')} volume={0.45} rate={1.2} />
      <Sfx at={94} src={mcSound('random/levelup')} volume={0.35} rate={1.3} />
      <Sfx at={72} src={mcSound('dig/stone1')} volume={0.3} />
      <Sfx at={80} src={mcSound('dig/stone2')} volume={0.3} />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={[24, 94]} life={10} strength={14}>
      <DungeonBg>
        <Barrel x={230} y={1020} s={9} />
        <div style={{position: 'absolute', left: W - 330, top: 1020 - 15 * 9}}>
          <ChestFront scale={9} open={prog(f, 90, 16)} />
        </div>
        {content}
      </DungeonBg>
    </Shake>
  );
};

export const LootDrop = LootScene;
