// mcd-kit-badges: the hexagon / diamond family. Targets: mission-difficulty-levels.png, marker-mission.png,
// inventory-gear.png (LEVEL / POWER hexes), results-level-complete.jpg (gold diamond + laurel), inventory-final-unique.jpg (enchant diamonds).
import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {Cap, Pop, Rise, win} from './common';
import {
  DifficultyBar,
  DiamondFrame,
  EmeraldCounter,
  EnchantSlot,
  Laurel,
  LevelBadge,
  McdBackdrop,
  PowerBadge,
  PxArt,
  RarityTag,
  SkullBadge,
  SoulCounter,
  ENCH_FLAME,
  ENCH_FLAME_PAL,
  ENCH_SKULL,
  ENCH_SKULL_PAL,
  ENCH_PIERCE,
  ENCH_PIERCE_PAL,
  PlayerBust,
  ItemIcon3D,
  itemTex,
  MCD,
  PxText,
  McdTitle,
  TITLE_GOLD,
} from './kit';

export const BadgesDemo: FC = () => {
  const f = useCurrentFrame();
  const level = f < 78 ? 3 : f < 96 ? 4 : f < 114 ? 5 : f < 132 ? 6 : 7;
  const bump = (at: number) => 1 - win(f, at, 8);
  return (
    <McdBackdrop kind="void" drift={f * 0.4}>
      <div style={{position: 'absolute', left: 100, top: 50}}>
        <Rise at={0}>
          <McdTitle text="DIAMOND FRAMES" px={5} {...TITLE_GOLD} />
        </Rise>
      </div>
      {(
        [
          ['gilded', 'GILDED'],
          ['unique', 'UNIQUE'],
          ['rare', 'RARE'],
          ['common', 'COMMON'],
          ['enchant', 'ENCHANT'],
          ['empty', 'EMPTY'],
        ] as const
      ).map(([tier, name], i) => (
        <div key={tier} style={{position: 'absolute', left: 250 + i * 284 - 125, top: 140, width: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <Pop at={6 + i * 4}>
            {tier === 'enchant' ? (
              <EnchantSlot size={250} lit tier="III" icon={<PxArt rows={ENCH_FLAME} pal={ENCH_FLAME_PAL} px={11} />} />
            ) : (
              <DiamondFrame size={250} tier={tier} glow={tier === 'gilded' ? 'rgba(255,214,90,0.5)' : undefined} badge={tier === 'unique' ? 'II' : undefined} clip={tier === 'gilded' ? 'bottom' : undefined}>
                {tier === 'gilded' && <PlayerBust skin="steve" scale={13} style={{marginBottom: 40}} />}
                {tier === 'unique' && <PxArt rows={ENCH_SKULL} pal={ENCH_SKULL_PAL} px={10} style={{transform: 'rotate(45deg)'}} />}
                {tier === 'rare' && <PxArt rows={ENCH_PIERCE} pal={ENCH_PIERCE_PAL} px={10} style={{transform: 'rotate(45deg)'}} />}
                {tier === 'common' && <ItemIcon3D src={itemTex('iron_sword')} size={110} />}
              </DiamondFrame>
            )}
          </Pop>
          <Rise at={12 + i * 4}>
            <Cap>{name}</Cap>
          </Rise>
        </div>
      ))}

      <div style={{position: 'absolute', left: 100, top: 478}}>
        <Rise at={30}>
          <McdTitle text="HEX BADGES" px={5} color={MCD.gold} shadowColor="#2A1600" />
        </Rise>
      </div>
      <div style={{position: 'absolute', left: 1000, top: 484, display: 'flex', gap: 70}}>
        <Pop at={60} origin="0% 50%">
          <EmeraldCounter value={2637 + (f > 100 ? 120 : 0)} px={5} bump={bump(100)} />
        </Pop>
        <Pop at={64} origin="0% 50%">
          <SoulCounter value={27 + (f > 108 ? 5 : 0)} px={5} bump={bump(108)} />
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 100, top: 560, display: 'flex', alignItems: 'center', gap: 70}}>
        <Pop at={34}>
          <LevelBadge level={1} w={170} />
        </Pop>
        <Pop at={38}>
          <LevelBadge level={21} w={170} accent="purple" />
        </Pop>
        <Pop at={42}>
          <PowerBadge power={29} w={116} />
        </Pop>
        <Pop at={46}>
          <SkullBadge size={120} />
        </Pop>
        <Pop at={50}>
          <SkullBadge size={120} locked />
        </Pop>
        <Pop at={54}>
          <SkullBadge size={120} empty />
        </Pop>
        <Pop at={58}>
          <SkullBadge size={150} selected numeral="IV" />
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 1640, top: 560, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
        {(['common', 'rare', 'unique', 'gilded'] as const).map((r, i) => (
          <Pop key={r} at={40 + i * 4} origin="0% 50%">
            <RarityTag rarity={r} size={30} />
          </Pop>
        ))}
      </div>

      <div style={{position: 'absolute', left: 100, top: 810}}>
        <Rise at={66}>
          <McdTitle text="DIFFICULTY" px={5} color={MCD.gold} shadowColor="#2A1600" />
        </Rise>
      </div>
      <div style={{position: 'absolute', left: 60, top: 880}}>
        <DifficultyBar level={level} locked={f < 78 ? 2 : 0} w={1160} nodeW={64} reveal={win(f, 70, 26)} />
      </div>
      <div style={{position: 'absolute', left: 1240, top: 840, display: 'flex', gap: 40}}>
        {(['gold', 'orange', 'green'] as const).map((t, i) => (
          <Pop key={t} at={80 + i * 6} origin="50% 100%">
            <Laurel w={150} tone={t} grow={win(f, 84 + i * 6, 14)} />
          </Pop>
        ))}
      </div>
    </McdBackdrop>
  );
};
