// mcd-kit-inventory: the three-column gear screen. Targets: inventory-gear.png (empty grid with cross lines, LEVEL / POWER hexes, tab row,
// SWORD detail with bars) and inventory-final-unique.jpg (UNIQUE bow, rarity frames, enchantment diamonds with POWERFUL label).
import type {FC} from 'react';
import {Img, useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {Pop, Rise, win} from './common';
import {
  BevelSlot,
  BlackCut,
  EmeraldCounter,
  EnchantSlot,
  ENCH_PIERCE,
  ENCH_PIERCE_PAL,
  ENCH_SKULL,
  ENCH_SKULL_PAL,
  ItemIcon3D,
  LevelBadge,
  MCD,
  McdBackdrop,
  McdText,
  MainButton,
  PlayerFigure,
  PowerBadge,
  PotionIcon,
  PxArt,
  PxText,
  RarityTag,
  Runes,
  SOUL_ROWS,
  SoulCounter,
  WhiteFlash,
  itemTex,
  type Rarity,
} from './kit';

type Cell = {src?: string; rarity?: Rarity; n?: number; isNew?: boolean; kind?: 'sword' | 'bow' | 'armor'};

const GRID: Cell[] = [
  {src: 'iron_sword', rarity: 'common', n: 31, isNew: true},
  {src: 'stone_sword', rarity: 'common', n: 24},
  {src: 'bow', rarity: 'rare', n: 29, isNew: true},
  {src: 'iron_helmet', rarity: 'unique', n: 31},
  {src: 'crossbow_standby', rarity: 'common', n: 15},
  {src: 'iron_chestplate', rarity: 'rare', n: 22},
  {},
  {src: 'trident', rarity: 'unique', n: 35},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
];

const TAB_ICONS = ['grid', 'iron_sword', 'bow', 'iron_helmet', 'potion', 'soul', 'totem_of_undying'];

const Tab: FC<{icon: string; on?: boolean; dot?: boolean; size?: number}> = ({icon, on, dot, size = 54}) => {
  const c = on ? '#fff' : '#8E8A8C';
  return (
    <div style={{position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {icon === 'grid' ? (
        <svg width={34} height={34} viewBox="0 0 9 9" shapeRendering="crispEdges">
          {[0, 3, 6].flatMap((x) => [0, 3, 6].map((y) => <rect key={`${x}${y}`} x={x} y={y} width={2} height={2} fill={c} />))}
        </svg>
      ) : icon === 'soul' ? (
        <PxArt rows={SOUL_ROWS} pal={{o: c}} px={3} />
      ) : (
        <Img src={itemTex(icon)} style={{width: 38, height: 38, imageRendering: 'pixelated', filter: `grayscale(1) brightness(${on ? 1.8 : 0.85})`}} />
      )}
      {dot && <div style={{position: 'absolute', right: 6, top: 6, width: 10, height: 10, background: '#FFD21E'}} />}
    </div>
  );
};

const Diamond: FC<{c?: string}> = ({c = '#8A8A92'}) => (
  <svg width={26} height={26} viewBox="0 0 10 10" style={{flex: 'none'}}>
    <polygon points="5,0 10,5 5,10 0,5" fill={c} />
    <polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill="#1C1C20" />
  </svg>
);

const StatRow: FC<{text: string; at: number; c?: string}> = ({text, at, c}) => (
  <Rise at={at} dur={8} dy={12}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, height: 46}}>
      <Diamond c={c} />
      <McdText size={29}>{text}</McdText>
    </div>
  </Rise>
);

const Bar: FC<{label: string; v: number; w: number}> = ({label, v, w}) => (
  <div style={{width: w}}>
    <McdText size={19} weight={700} color="#E4E4E4" style={{letterSpacing: 1.5}}>
      {label}
    </McdText>
    <div style={{position: 'relative', height: 4, background: '#5A5658', marginTop: 8}}>
      <div style={{position: 'absolute', left: 0, top: -2, bottom: -2, width: `${v * 100}%`, background: '#fff'}} />
      <div style={{position: 'absolute', left: `calc(${v * 100}% - 3px)`, top: -6, width: 6, height: 16, background: '#fff'}} />
    </div>
  </div>
);

export const InventoryDemo: FC = () => {
  const f = useCurrentFrame();
  // 0 = sword (common), 1 = bow (unique); the selection jumps at frame 78.
  const swapAt = 78;
  const sel = f >= swapAt ? 2 : 0;
  const second = f >= swapAt;
  const since = Math.max(0, f - swapAt);
  const detailPop = EASE.back(win(f, swapAt, 10));
  const gridPop = (i: number) => win(f, 24 + i * 2, 8);
  const cellSize = 150;
  const gx = 700;
  const gy = 215;
  const pitch = 170;
  const drift = f * 0.5;

  const detail = second
    ? {lvl: 35, tag: 'unique' as const, name: "HUNTER'S PROMISE", src: 'bow', rarity: 'unique' as Rarity, stats: ['67-163 ranged damage', 'Pets Attack Targeted Mobs', 'Chance to Regain Arrows'], desc: ['This enchanted bow deepens the bond between the', 'hunter and their trusted animal companion.'], bars: [0.34, 0.2, 0.52]}
    : {lvl: 1, tag: 'common' as const, name: 'SWORD', src: 'iron_sword', rarity: 'common' as Rarity, stats: ['10-16 melee damage'], desc: ['A sturdy and reliable blade.'], bars: [0.28, 0.32, 0.12]};

  return (
    <McdBackdrop kind="inventory" drift={drift} cell={44}>
      {/* counters */}
      <div style={{position: 'absolute', left: 80, top: 56, display: 'flex', gap: 56}}>
        <Rise at={4}>
          <EmeraldCounter value={4164} px={3} />
        </Rise>
        <Rise at={8}>
          <SoulCounter value={f >= 150 ? 1 : 3} px={3} bump={f >= 150 ? 1 - win(f, 150, 8) : 0} />
        </Rise>
      </div>
      {/* close key */}
      <div style={{position: 'absolute', right: 80, top: 48, width: 76, height: 76, border: '4px solid #6A6668', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: win(f, 6, 6)}}>
        <PxText text="X" px={4} color="#B9B6B1" shadow={0} />
      </div>

      {/* ---------- left column ---------- */}
      <div style={{position: 'absolute', left: 96, top: 250}}>
        <Pop at={6} origin="50% 100%">
          <BevelSlot size={124} rarity="unique" count={1}>
            <ItemIcon3D src={itemTex('golden_sword')} size={84} depth={4} />
          </BevelSlot>
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 316, top: 196}}>
        <Pop at={10} origin="50% 100%">
          <BevelSlot size={118} rarity="rare" count={30}>
            <ItemIcon3D src={itemTex('diamond_helmet')} size={80} depth={4} />
          </BevelSlot>
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 520, top: 244}}>
        <Pop at={14} origin="50% 100%">
          <BevelSlot size={132} rarity="unique" isNew selected={sel === 2 && false} count={35}>
            <ItemIcon3D src={itemTex('bow')} size={90} depth={4} />
          </BevelSlot>
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 84, top: 470}}>
        <Pop at={18}>
          <LevelBadge level={21} w={130} />
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 482, top: 500}}>
        <Pop at={22}>
          <PowerBadge power={second ? 35 : 29} w={92} />
        </Pop>
      </div>
      {/* character with ground shadow */}
      <div style={{position: 'absolute', left: 345 - 100, top: 505, opacity: win(f, 8, 14)}}>
        <div style={{position: 'absolute', left: -60, top: 316, width: 330, height: 70, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.65), rgba(0,0,0,0) 70%)'}} />
        <PlayerFigure skin="ari" scale={11} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 122 + i * 170, top: 875}}>
          <Pop at={26 + i * 4} origin="50% 100%">
            <BevelSlot size={124} rarity={i === 1 ? 'rare' : 'common'} count={[4, 30, 33][i]}>
              {i === 0 ? <ItemIcon3D src={itemTex('firework_rocket')} size={82} depth={4} /> : i === 1 ? <PotionIcon size={78} color="#38C8E8" /> : <ItemIcon3D src={itemTex('experience_bottle')} size={82} depth={4} />}
            </BevelSlot>
          </Pop>
        </div>
      ))}

      {/* ---------- middle column ---------- */}
      <div style={{position: 'absolute', left: 692, top: 80, display: 'flex', gap: 14}}>
        {TAB_ICONS.map((ic, i) => (
          <Rise key={ic} at={10 + i * 3} dur={8} dy={-14}>
            <div style={{position: 'relative'}}>
              {i === 0 && (
                <div style={{position: 'absolute', left: -20, right: -20, top: -30, display: 'flex', justifyContent: 'center'}}>
                  <McdText size={20} weight={700}>All</McdText>
                </div>
              )}
              <Tab icon={ic} on={i === 0} dot={i === 1 || i === 2 || i === 3} size={72} />
            </div>
          </Rise>
        ))}
      </div>
      {GRID.map((c, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const t = gridPop(i);
        return (
          <div key={i} style={{position: 'absolute', left: gx + col * pitch, top: gy + row * pitch, opacity: t > 0 ? 1 : 0, transform: `scale(${0.7 + 0.3 * EASE.back(t)})`}}>
            {c.src ? (
              <BevelSlot size={cellSize} rarity={c.rarity} isNew={c.isNew} count={c.n} selected={i === sel}>
                <ItemIcon3D src={itemTex(c.src)} size={104} depth={4} rot={0} />
              </BevelSlot>
            ) : (
              <BevelSlot size={cellSize} empty />
            )}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 1230 + 40, top: 215, width: 8, height: 640, background: '#2A2224'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 8, height: 260, background: '#7A7476'}} />
      </div>

      {/* ---------- right column ---------- */}
      <div style={{position: 'absolute', left: 1300, top: 0, width: 600, height: 1080}}>
        <div style={{position: 'absolute', left: 0, top: 196, display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${0.9 + 0.1 * detailPop})`, transformOrigin: '0 50%'}}>
          <PxText text={detail.lvl} px={4} />
          <Img src={itemTex(second ? 'bow' : 'iron_sword')} style={{width: 30, height: 30, imageRendering: 'pixelated', filter: 'grayscale(1) brightness(1.4)'}} />
          <RarityTag rarity={detail.tag} size={24} />
        </div>
        <div style={{position: 'absolute', left: 0, top: 248, transform: `scale(${0.94 + 0.06 * detailPop})`, transformOrigin: '0 50%'}}>
          <PxText text={detail.name} px={second ? 3 : 5} />
        </div>
        <div style={{position: 'absolute', left: 0, top: 322}}>
          {detail.stats.map((s, i) => (
            <StatRow key={s + second} text={s} at={second ? swapAt + 8 + i * 5 : 30 + i * 5} c={i === 2 ? MCD.purple : undefined} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, top: 480}}>
          {detail.desc.map((l, i) => (
            <Rise key={l + second} at={second ? swapAt + 22 + i * 3 : 38 + i * 3} dur={8} dy={8}>
              <McdText size={24} color="#E8E4E4" style={{display: 'block', whiteSpace: 'nowrap'}}>{l}</McdText>
            </Rise>
          ))}
        </div>
        {/* big item render */}
        <div style={{position: 'absolute', left: 372, top: 136, width: 220, height: 220, transform: `scale(${0.8 + 0.2 * detailPop}) rotate(${Math.sin(f * 0.06) * 2}deg)`, opacity: second ? 1 : win(f, 14, 12)}}>
          <ItemIcon3D src={itemTex(detail.src)} size={220} depth={9} glow={second ? 'rgba(255,150,40,0.35)' : undefined} />
        </div>
        <div style={{position: 'absolute', left: 324, top: 590}}>
          <Pop at={44}>
            <MainButton label="SALVAGE" tone="ghost" w={216} h={72} textPx={3} />
          </Pop>
        </div>
        <div style={{position: 'absolute', left: 0, top: 724, display: 'flex', gap: 30}}>
          {['POWER', 'SPEED', second ? 'AMMO' : 'AREA'].map((l, i) => (
            <Rise key={l} at={48 + i * 4} dur={8} dy={10}>
              <Bar label={l} v={detail.bars[i] * (second ? EASE.out(win(f, swapAt + 10, 14)) + (1 - EASE.out(win(f, swapAt + 10, 14))) * 0.0 : 1)} w={178} />
            </Rise>
          ))}
        </div>
        {/* enchantments */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center'}}>
          <Rise at={56} dur={8} dy={8}>
            <McdText size={28} weight={700} color="#fff">Enchantments</McdText>
          </Rise>
        </div>
        <div style={{position: 'absolute', left: 150, top: 830, opacity: 0.9}}>
          <Runes count={5} px={9} color="#4A2468" opacity={0.55} />
        </div>
        <div style={{position: 'absolute', left: 6, top: 826, display: 'flex', gap: 36}}>
          {[0, 1, 2].map((i) => {
            const lit = second && (i === 0 ? since > 40 : i === 1 ? since > 54 : false);
            const t = lit ? EASE.back(win(f, swapAt + (i === 0 ? 40 : 54), 10)) : 0;
            return (
              <Pop key={i} at={58 + i * 5} origin="50% 100%">
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                  <EnchantSlot size={150} lit={lit} tier={i === 0 ? 'I' : 'III'} icon={i === 0 ? <PxArt rows={ENCH_PIERCE} pal={ENCH_PIERCE_PAL} px={8} /> : <PxArt rows={ENCH_SKULL} pal={ENCH_SKULL_PAL} px={8} />} style={{transform: `scale(${lit ? 0.9 + 0.1 * t : 1})`}} />
                  <McdText size={22} weight={600} color={lit ? '#fff' : MCD.enchText}>{lit ? (i === 0 ? 'Piercing' : 'Critical Hit') : 'Empty Slot'}</McdText>
                  <McdText size={16} weight={700} color={i === 0 ? '#9A9AA0' : MCD.powerful} style={{letterSpacing: 1.5, marginTop: -8, visibility: lit ? 'visible' : 'hidden'}}>
                    {i === 0 ? 'COMMON' : 'POWERFUL'}
                  </McdText>
                </div>
              </Pop>
            );
          })}
        </div>
      </div>
      <WhiteFlash at={swapAt} dur={4} peak={0.18} steps={2} />
      <BlackCut at={-1} fade={1} hold={0} reveal={14} />
    </McdBackdrop>
  );
};

