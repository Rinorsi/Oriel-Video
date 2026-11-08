// mcd-s-loot-rarity: three loot drops land one after another, each with its rarity beam and a name card.
// Rarity colours follow the game: COMMON white, RARE green, UNIQUE orange (beam, ground glow, card edge and tag all match).
// Props: bg, items = [{item, name, rarity, power}].
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {CutPanel, ItemIcon3D, MCD, McdText, PxText, RarityTag, itemTex} from '../mcdkit/kit';
import {Backdrop, Beam, EASE, GroundShadow, IsoGlow, Particles, PxPlus, Sfx, Twinkle, genParts, mcSound, snap, stepped, win} from './common';

const TOTAL = 180;

export type Loot = {item: string; name: string; rarity: 'common' | 'rare' | 'unique'; power: number};
const DEFAULT_LOOT: Loot[] = [
  {item: 'iron_sword', name: '铁剑', rarity: 'common', power: 8},
  {item: 'bow', name: '猎手之弓', rarity: 'rare', power: 21},
  {item: 'golden_sword', name: '炽炎裂刃', rarity: 'unique', power: 37},
];

const TONE = {
  common: {beam: 'white', glow: '#DCE0EA', edge: '#8C8F98', label: 'COMMON', icon: 'rgba(240,244,255,0.7)'},
  rare: {beam: 'green', glow: '#58E08A', edge: '#2E9E7A', label: 'RARE', icon: 'rgba(80,235,150,0.75)'},
  unique: {beam: 'orange', glow: '#FF8A1C', edge: '#F85600', label: 'UNIQUE', icon: 'rgba(255,150,30,0.85)'},
} as const;

const Drop: FC<{loot: Loot; cx: number; at: number; end: number; k: number}> = ({loot, cx, at, end, k}) => {
  const f = useCurrentFrame();
  const t = TONE[loot.rarity];
  const GROUND = 760;
  const land = at + 9;
  const fall = win(f, at, 9);
  const bounce = f >= land ? Math.max(0, Math.sin(win(f, land, 9) * Math.PI)) * 26 * (1 - win(f, land, 9)) : 0;
  const hover = f >= land + 9 ? Math.sin((f - land) * 0.12 + k) * 9 : 0;
  const baseY = GROUND - 96;
  const itemY = f < land ? baseY - (1 - EASE.in(fall)) * 520 : baseY - bounce - 126 * EASE.out(win(f, land + 2, 16)) + hover;
  const out = 1 - win(f, end, 18);
  const vis = f >= at;
  const beamGrow = f < land ? 0 : Math.min(1, (f - land + 1) / 4);
  const beamW = loot.rarity === 'unique' ? 150 : loot.rarity === 'rare' ? 124 : 104;
  const dust = genParts({n: 22, seed: 5 + k, x: cx, y: GROUND, sx: 70, sy: 8, a0: -Math.PI * 0.95, a1: -Math.PI * 0.05, v0: 3, v1: 11, g: 0.4, drag: 0.1, life0: 16, life1: 30, size0: 6, size1: 12, colors: [t.glow, '#FFFFFF', t.edge], kinds: ['sq']});
  const rise = genParts({n: 16, seed: 21 + k, x: cx, y: GROUND - 20, sx: 60, sy: 10, a0: -Math.PI * 0.6, a1: -Math.PI * 0.4, v0: 1.5, v1: 4, drag: 0.02, life0: 60, life1: 110, delay: 40, size0: 6, size1: 10, colors: [t.glow, '#FFFFFF'], kinds: ['sq', 'bar']});
  const cardT = win(f, land + 8, 8);
  const flashK = f >= land && f < land + 6 ? 1 - (f - land) / 6 : 0;
  if (!vis) return null;
  return (
    <AbsoluteFill style={{opacity: stepped(out, 4)}}>
      <IsoGlow cx={cx} cy={GROUND + 4} w={460} color={t.glow} o={0.8 * EASE.out(win(f, land, 10))} />
      <GroundShadow cx={cx} y={GROUND - 2} w={120 - (f >= land ? hover * 0.8 : 0)} o={0.5} u={6} />
      <Beam x={cx} y={GROUND - 4} kind={t.beam} width={beamW} grow={beamGrow} alpha={0.95} flick={0.94 + 0.06 * Math.sin(f * 2.1 + k)} />
      <div style={{position: 'absolute', left: cx - 100, top: itemY - 100, width: 200, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `rotate(${f >= land ? Math.sin((f - land) * 0.1 + k) * 6 : 0}deg) scale(${1 + flashK * 0.12})`}}>
        <ItemIcon3D src={itemTex(loot.item)} size={176} depth={6} glow={t.icon} />
      </div>
      <Particles parts={dust} at={land} />
      <Particles parts={rise} at={land} />
      {f >= land && f < land + 6 && <PxPlus x={cx} y={GROUND - 6} u={8} arm={Math.round(6 - (f - land))} c={t.glow} core="#fff" />}
      {f > land + 12 && [0, 1, 2].map((i) => <Twinkle key={i} x={cx - 110 + i * 110 + (i === 1 ? 10 : 0)} y={itemY - 70 + (i === 1 ? -40 : 20)} t={((f + i * 9 + k * 5) % 30) / 30} u={4} c={loot.rarity === 'common' ? '#FFFFFF' : t.glow} />)}
      {/* name card */}
      <div style={{position: 'absolute', left: cx - 230, top: 832, opacity: stepped(cardT, 3), transform: `translateY(${(1 - EASE.out(cardT)) * 26}px)`}}>
        <CutPanel w={460} h={180} cuts={[0, 0, 0, 0]} fill="#14141A" edge={t.edge} edgeW={4} glow={undefined}>
          <div style={{position: 'absolute', left: 4, right: 4, top: 4, height: 8, background: t.glow}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center'}}>
            <RarityTag rarity={loot.rarity} size={24} text={t.label} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 78, display: 'flex', justifyContent: 'center'}}>
            <PxText text={loot.name} px={4} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 148, display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center'}}>
            <svg width={22} height={22} viewBox="0 0 10 10" shapeRendering="crispEdges">
              <polygon points="5,0 10,5 5,10 0,5" fill="#9AA0AA" />
              <polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill="#14141A" />
            </svg>
            <McdText size={24} weight={700} color="#D8DCE4">{`威力 ${loot.power}`}</McdText>
          </div>
        </CutPanel>
      </div>
    </AbsoluteFill>
  );
};

export const LootRarity: FC<{bg?: boolean; audio?: boolean; items?: Loot[]}> = ({bg, audio = bg, items = DEFAULT_LOOT}) => {
  const f = useCurrentFrame();
  const xs = [430, 960, 1490];
  return (
    <AbsoluteFill>
      {bg && <Backdrop biome="snow" loop={TOTAL} dim={0.35} dark={0.38} sat={0.85} />}
      {items.map((l, i) => (
        <Drop key={i} loot={l} cx={xs[i]} at={12 + i * 40} end={TOTAL - 22 + i * 3} k={i} />
      ))}
      {audio && items.map((l, i) => <Sfx key={i} at={12 + i * 40 + 9} src={mcSound(i === 2 ? 'random/levelup' : 'random/orb')} volume={0.3} rate={i === 2 ? 1.2 : 1} />)}
      <div style={{display: 'none'}}>{f}</div>
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-loot-rarity',
      name: '稀有度光柱 · 白绿橙',
      category: 'rpg',
      tags: ['地下城', '掉落', '稀有度', '光柱', '名称卡'],
      frames: TOTAL,
      blurb: '白、绿、橙三件掉落物依次落地：同色光柱 4 帧冲起，地面光斑与像素尘土，物品悬浮摇摆，下方深色名称卡带 COMMON / RARE / UNIQUE 标签。',
      usage: '展示“获得了什么”：战利品盘点、素材分级（普通/精选/珍藏）、版本更新里的新物品列表。可换 items 里的物品、名称、稀有度。',
      params: [
        {name: 'items', desc: '[{item 贴图 id, name 名称, rarity common|rare|unique, power 数值}] 共三件'},
        {name: 'bg', desc: '是否绘制 3D 场景背景（Demo 开，Layer 关）'},
      ],
    },
    Demo: () => <LootRarity bg />,
    Layer: () => <LootRarity />,
  },
];
void MCD;
void snap;
