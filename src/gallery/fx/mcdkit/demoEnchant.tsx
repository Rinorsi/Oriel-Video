// mcd-kit-enchant: enchantment diamonds lighting up, the 4-diamond enchant cluster and the parchment upgrade scroll.
// Targets: enchant-doubled.png (cluster of three icon diamonds around the spiral point slot, "Empty Slot" in purple),
// inventory-final-unique.jpg / enchant-scroll-burning.jpg (lit diamonds with roman tags, POWERFUL label, BURNING scroll with tiers).
import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {Pop, Rise, win} from './common';
import {
  DiamondFrame,
  EnchantSlot,
  Embers,
  ENCH_CHEST,
  ENCH_CHEST_PAL,
  ENCH_FLAME,
  ENCH_FLAME_PAL,
  ENCH_HEART,
  ENCH_HEART_PAL,
  ENCH_PIERCE,
  ENCH_PIERCE_PAL,
  ENCH_SKULL,
  ENCH_SKULL_PAL,
  MCD,
  McdBackdrop,
  McdText,
  MainButton,
  ParchmentScroll,
  PxArt,
  PxText,
  Runes,
  SOUL_ROWS,
  WhiteFlash,
  type Pal,
} from './kit';

type Icon = {rows: string[]; pal: Pal};
const ICONS: Icon[] = [
  {rows: ENCH_FLAME, pal: ENCH_FLAME_PAL},
  {rows: ENCH_PIERCE, pal: ENCH_PIERCE_PAL},
  {rows: ENCH_SKULL, pal: ENCH_SKULL_PAL},
  {rows: ENCH_HEART, pal: ENCH_HEART_PAL},
  {rows: ENCH_CHEST, pal: ENCH_CHEST_PAL},
];

/** Spiral point slot + three icon diamonds (the cluster in enchant-doubled.png). */
const Cluster: FC<{icons: number[]; litAt: number[]; at: number}> = ({icons, litAt, at}) => {
  const f = useCurrentFrame();
  const spots = [
    {x: 62, y: 190, s: 150},
    {x: 232, y: 190, s: 150},
    {x: 147, y: 262, s: 150},
  ];
  return (
    <Pop at={at} origin="50% 100%">
      <div style={{position: 'relative', width: 370, height: 440}}>
        <Runes count={3} px={7} opacity={0.45} color="#5A2A8C" style={{position: 'absolute', left: 70, top: 100}} />
        <div style={{position: 'absolute', left: 90, top: 0}}>
          <DiamondFrame size={190} tier="empty" style={{filter: 'brightness(1.0)'}}>
            <PxArt rows={SOUL_ROWS} pal={{o: '#B060F0'}} px={5} />
          </DiamondFrame>
        </div>
        {spots.map((s, k) => {
          const lit = f >= litAt[k];
          const t = lit ? EASE.back(win(f, litAt[k], 10)) : 0;
          const ic = ICONS[icons[k]];
          return (
            <div key={k} style={{position: 'absolute', left: s.x - s.s / 2 + 18, top: s.y - s.s / 2 + 22, transform: `scale(${lit ? 0.85 + 0.15 * t : 1})`}}>
              <EnchantSlot size={s.s} lit={lit} tier={k === 0 ? 'I' : k === 1 ? 'III' : 'II'} icon={<PxArt rows={ic.rows} pal={ic.pal} px={7} />} />
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: 392, display: 'flex', justifyContent: 'center'}}>
          <McdText size={28} weight={700} color={MCD.enchText}>Empty Slot</McdText>
        </div>
      </div>
    </Pop>
  );
};

const HexCheck: FC<{on: boolean; size?: number}> = ({on, size = 54}) => (
  <svg width={size} height={(size * 2) / Math.sqrt(3)} viewBox="0 0 10 11.55" shapeRendering="crispEdges">
    <polygon points="5,0 10,2.9 10,8.65 5,11.55 0,8.65 0,2.9" fill={on ? '#2A2A30' : 'none'} stroke={on ? '#1A1A1E' : '#9A8A70'} strokeWidth={0.7} />
    <polyline points="2.8,6 4.4,7.6 7.4,4" fill="none" stroke={on ? '#fff' : '#A89878'} strokeWidth={0.9} />
  </svg>
);

export const EnchantDemo: FC = () => {
  const f = useCurrentFrame();
  const scrollT = EASE.out(win(f, 36, 22));
  const tier = f >= 138 ? 3 : f >= 120 ? 2 : f >= 102 ? 1 : 0;
  const lit = (i: number) => f >= [64, 78, 999][i];
  return (
    <McdBackdrop kind="inventory" drift={f * 0.4} cell={44}>
      {/* heading with side lines */}
      <div style={{position: 'absolute', left: 80, top: 52, width: 900, display: 'flex', alignItems: 'center', gap: 28}}>
        <Rise at={0}>
          <PxText text="ENCHANTMENTS" px={5} color={MCD.enchText} shadowColor="#1A0828" />
        </Rise>
        <div style={{flex: 1, height: 4, background: '#5A2A8C', opacity: win(f, 6, 10)}} />
      </div>

      {/* clusters */}
      <div style={{position: 'absolute', left: 60, top: 150, display: 'flex', gap: 0, zoom: 0.84}}>
        <Cluster icons={[0, 3, 2]} litAt={[22, 30, 38]} at={6} />
        <Cluster icons={[1, 4, 0]} litAt={[46, 999, 54]} at={12} />
        <Cluster icons={[2, 1, 3]} litAt={[999, 999, 999]} at={18} />
      </div>

      {/* final row */}
      <div style={{position: 'absolute', left: 120, top: 640, display: 'flex', gap: 80}}>
        {[0, 1, 2].map((i) => {
          const on = lit(i);
          const t = on ? EASE.back(win(f, [64, 78, 999][i], 10)) : 0;
          return (
            <Pop key={i} at={58 + i * 4} origin="50% 100%">
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                <EnchantSlot size={230} lit={on} selected={i === 0 && on && f < 78} tier={['III', 'III', 'II'][i]} icon={<PxArt rows={ICONS[[0, 2, 3][i]].rows} pal={ICONS[[0, 2, 3][i]].pal} px={11} />} style={{transform: `scale(${on ? 0.88 + 0.12 * t : 1})`}} />
                <McdText size={30} weight={600} color={on ? '#fff' : MCD.enchText}>{on ? ['Burning', 'Fire Focus', ''][i] : 'Empty Slot'}</McdText>
                <McdText size={20} weight={700} color={i === 1 ? MCD.powerful : '#9A9AA0'} style={{letterSpacing: 2, visibility: on ? 'visible' : 'hidden', marginTop: -6}}>
                  {i === 1 ? 'POWERFUL' : 'COMMON'}
                </McdText>
              </div>
            </Pop>
          );
        })}
      </div>

      {/* scroll */}
      <div style={{position: 'absolute', left: 1050, top: 120, transform: `translateX(${(1 - scrollT) * 60}px)`, opacity: scrollT > 0 ? 1 : 0}}>
        <ParchmentScroll w={800} h={820} reveal={scrollT}>
          <PxText text="BURNING" px={6} color="#2A2420" shadow={0} />
          <div style={{marginTop: 22}}>
            <McdText size={28} color="#2A2420" style={{display: 'block', textShadow: 'none', whiteSpace: 'nowrap'}}>Every 0.5 seconds damages all</McdText>
            <McdText size={28} color="#2A2420" style={{display: 'block', textShadow: 'none', whiteSpace: 'nowrap'}}>nearby enemies.</McdText>
          </div>
          <div style={{position: 'absolute', right: -12, top: 70}}>
            <Pop at={56} origin="50% 50%">
              <DiamondFrame size={250} tier="enchant" badge={['', 'I', 'II', 'III'][tier] || undefined} rotateContent glow="rgba(171,100,255,0.5)">
                <PxArt rows={ENCH_FLAME} pal={ENCH_FLAME_PAL} px={11} />
              </DiamondFrame>
            </Pop>
          </div>
          <div style={{position: 'absolute', left: 0, top: 340}}>
            <McdText size={26} weight={700} color="#2A2420" style={{textShadow: 'none', letterSpacing: 2}}>UPGRADE TIERS</McdText>
          </div>
          {['55 damage', '110 damage', '166 damage'].map((t, i) => {
            const on = tier > i;
            return (
              <div key={t} style={{position: 'absolute', left: 0, top: 392 + i * 76, display: 'flex', alignItems: 'center', gap: 22, opacity: win(f, 80 + i * 6, 8)}}>
                <HexCheck on={on} />
                <McdText size={32} color={on ? '#241E1A' : '#A89878'} style={{textShadow: 'none'}}>{t}</McdText>
              </div>
            );
          })}
          <div style={{position: 'absolute', right: 0, bottom: 10, opacity: win(f, 140, 8)}}>
            <MainButton label="MAX TIER REACHED" tone="ghost" w={330} h={72} textPx={2} style={{filter: 'invert(0.9) opacity(0.5)'}} />
          </div>
        </ParchmentScroll>
      </div>
      <Embers count={30} area={[1040, 200, 820, 800]} size={8} seed={13} speed={0.6} color="#C890FF" core="#F4E0FF" style={{opacity: win(f, 50, 20) * 0.8}} />
      <WhiteFlash at={64} dur={4} peak={0.14} steps={2} />
      <WhiteFlash at={78} dur={4} peak={0.14} steps={2} />
    </McdBackdrop>
  );
};
