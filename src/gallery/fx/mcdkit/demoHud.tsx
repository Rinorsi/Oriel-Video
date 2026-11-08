// mcd-kit-hud: the bottom HUD plate building in, pickups, a damage hit, potion + artifact cooldowns, an arrow shot and a level-up.
// Targets: hud-strip-controller.png (plate, slots, heart), hud-ingame-full.png (layout over the 3D scene), rqm-orig-gameplay-hud.png (objective text top-right).
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Rise, win} from './common';
import {McdFloor} from './floor';
import {ChestFront} from '../../mob';
import {BevelSlot, CreeperFigure, HexBadge, HudBase, ItemIcon3D, MCD, PlayerFigure, PxArt, PxText, SKULL_ROWS, WhiteFlash, itemTex} from './kit';

const buffs = [
  {src: 'golden_apple', n: 2},
  {src: 'sugar', n: 3},
  {src: 'blaze_powder', n: 1},
];

/** Scripted HUD timeline shared by the demo and the transparent layer. */
const useHud = (f: number) => {
  const appear = win(f, 12, 30);
  const soulBump = f >= 50 && f < 66 ? 1 - (f - 50) / 16 : 0;
  const souls = 27 + (f >= 50 ? 1 : 0) + (f >= 55 ? 1 : 0);
  const emeraldBump = f >= 62 && f < 80 ? 1 - (f - 62) / 18 : f >= 74 && f < 84 ? 1 - (f - 74) / 10 : 0;
  const emeralds = 109 + (f >= 62 ? 15 : 0) + (f >= 74 ? 5 : 0);
  const pressX = win(f, 82, 12);
  const cdX = f >= 82 ? Math.max(0, 1 - (f - 82) / 70) : 0;
  const hurtSeq = f >= 104 && f < 114 ? [1, 0.8, 0.5, 0.5, 0.25, 0.25, 0.1, 0.1, 0, 0][f - 104] : 0;
  let hp = 1;
  if (f >= 104) hp = 1 - 0.38 * Math.round(win(f, 104, 8) * 4) / 4;
  if (f >= 134) hp = 0.62 + 0.3 * Math.round(win(f, 134, 18) * 6) / 6;
  const cdPotion = f >= 134 ? Math.max(0, 1 - (f - 134) / 80) : 0;
  const arrows = f >= 164 ? (f >= 176 ? 18 : 19) : 20;
  const xp = f < 184 ? 0.6 + 0.4 * Math.round(win(f, 176, 14) * 7) / 7 : 0.06;
  const level = f >= 196 ? 4 : 3;
  return {appear, soulBump, souls, emeraldBump, emeralds, cdX, hurtSeq, hp, cdPotion, arrows, xp, level, press: (f >= 134 && f < 148 ? 'lb' : f >= 82 && f < 96 ? 'x' : null) as 'lb' | 'x' | null, pressT: f >= 134 ? win(f, 134, 12) : pressX};
};

export const HudDemo: FC = () => {
  const f = useCurrentFrame();
  const h = useHud(f);
  const bob = Math.round(Math.sin(f * 0.18) * 3);
  return (
    <McdFloor tint="swamp" shift={f * 0.2}>
      {/* scene: hero, ally, chest and three enemies with the red outline */}
      <div style={{position: 'absolute', left: 960 - 88, top: 440 + bob}}>
        <div style={{position: 'absolute', left: -60, top: 330, width: 320, height: 70, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.6), rgba(0,0,0,0) 70%)'}} />
        <PlayerFigure skin="steve" scale={11} />
      </div>
      <div style={{position: 'absolute', left: 520, top: 500 - bob}}>
        <PlayerFigure skin="alex" scale={9} />
      </div>
      <div style={{position: 'absolute', left: 740, top: 650}}>
        <ChestFront scale={9} open={win(f, 40, 12)} />
      </div>
      {[
        {x: 1260, y: 330, k: 'z', s: 9},
        {x: 1430, y: 470, k: 'z', s: 10},
        {x: 1640, y: 580, k: 'c', s: 10},
      ].map((m, i) => (
        <div key={i} style={{position: 'absolute', left: m.x, top: m.y + (i % 2 ? bob : -bob), filter: 'drop-shadow(3px 0 0 #D8302C) drop-shadow(-3px 0 0 #D8302C) drop-shadow(0 3px 0 #D8302C) drop-shadow(0 -3px 0 #D8302C)'}}>
          {m.k === 'z' ? <PlayerFigure texture="entity/zombie/zombie.png" scale={m.s} /> : <CreeperFigure scale={m.s} />}
        </div>
      ))}

      {/* top-left marker and buffs */}
      <div style={{position: 'absolute', left: 60, top: 54}}>
        <Rise at={4}>
          <HexBadge w={68} ring="#C07A1C" ringHi="#F8D868" fill="#1A1008">
            <PxArt rows={SKULL_ROWS} pal={{k: MCD.gold}} px={3} />
          </HexBadge>
        </Rise>
      </div>
      <div style={{position: 'absolute', left: 60, top: 230, display: 'flex', flexDirection: 'column', gap: 16}}>
        {buffs.map((b, i) => (
          <Rise key={b.src} at={20 + i * 5}>
            <BevelSlot size={76} count={b.n}>
              <ItemIcon3D src={itemTex(b.src)} size={48} depth={3} />
            </BevelSlot>
          </Rise>
        ))}
      </div>

      {/* objective text */}
      <div style={{position: 'absolute', right: 80, top: 56, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12}}>
        <Rise at={16}>
          <PxText text="FREE THE VILLAGER" px={4} />
        </Rise>
        <Rise at={22}>
          <PxText text="THE CARAVAN" px={3} color={MCD.goldBright} shadowColor="#2A1600" />
        </Rise>
      </div>

      {/* hit vignette */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 75% at 50% 50%, rgba(168,66,76,0) 45%, rgba(168,24,40,${h.hurtSeq * 0.75}) 100%)`, pointerEvents: 'none'}} />

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center'}}>
        <HudBase
          scale={0.95}
          appear={h.appear}
          hp={h.hp}
          hurt={h.hurtSeq}
          level={h.level}
          xp={h.xp}
          arrows={h.arrows}
          emeralds={h.emeralds}
          souls={h.souls}
          soulBump={h.soulBump}
          emeraldBump={h.emeraldBump}
          cd={{x: h.cdX, potion: h.cdPotion}}
          press={h.press}
          pressT={h.pressT}
        />
      </div>
      <WhiteFlash at={196} dur={9} peak={0.3} steps={3} />
      <AbsoluteFill style={{background: '#000', opacity: 1 - EASE.out(clamp01(f / 12)), pointerEvents: 'none'}} />
    </McdFloor>
  );
};

/** Transparent layer: just the HUD plate running the same timeline, bottom-centre, ready to drop over footage. */
export const HudLayer: FC = () => {
  const f = useCurrentFrame();
  const h = useHud(f);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center'}}>
        <HudBase scale={0.95} appear={h.appear} hp={h.hp} hurt={h.hurtSeq} level={h.level} xp={h.xp} arrows={h.arrows} emeralds={h.emeralds} souls={h.souls} soulBump={h.soulBump} emeraldBump={h.emeraldBump} cd={{x: h.cdX, potion: h.cdPotion}} press={h.press} pressT={h.pressT} />
      </div>
    </AbsoluteFill>
  );
};
