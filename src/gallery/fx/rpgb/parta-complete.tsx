import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {Floor, Pillars} from './partb-kit';
import {C, DungeonWall, Dust, Embers, FantasyTitle, Gloom, GoldFrame, Icon, Label, MOBS, Mob, PxSkull, PxStar, RARITY_COL, Rune, Shaft, Torch, center, lerp, prog} from './kit';
import {Rule} from './parta-title';

/**
 * rpg-mission-complete: end-of-mission results screen.
 * Props: bg, mission (name under the title), kills / seconds / deaths / treasure (stat targets that roll up),
 *        stars (0-5 score stars), rewards (4 items {id, rarity}), xp (number shown on the bar).
 * Beats: title slams -> stat rows slide in and roll their numbers -> score stars light one by one ->
 * reward cards flip face-up (the unique one glows) while the experience bar fills.
 */

export const MISSION_COMPLETE_FRAMES = 190;

type Reward = {id: string; rarity: 'common' | 'rare' | 'unique'};

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const Row: FC<{icon: import("react").ReactNode; label: string; value: string; k: number; flash: number; accent?: string}> = ({icon, label, value, k, flash, accent = C.parch2}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 24, height: 96, padding: '0 28px', transform: `translateX(${(1 - k) * -140}px)`, opacity: k, background: flash > 0 ? `linear-gradient(90deg, rgba(242,184,64,${0.28 * flash}), rgba(242,184,64,0))` : 'rgba(255,255,255,0.03)', boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.35)`}}>
    <div style={{width: 72, display: 'flex', justifyContent: 'center'}}>{icon}</div>
    <Label size={48} color={accent}>
      {label}
    </Label>
    <div style={{flex: 1, height: 4, marginTop: 28, backgroundImage: 'repeating-linear-gradient(90deg, rgba(232,212,162,0.5) 0px, rgba(232,212,162,0.5) 8px, rgba(0,0,0,0) 8px, rgba(0,0,0,0) 20px)'}} />
    <Label size={72} color={flash > 0.01 ? '#fff6cf' : '#fff'} style={{minWidth: 200, textAlign: 'right', display: 'inline-block'}}>
      {value}
    </Label>
  </div>
);

const FlipCard: FC<{r: Reward; at: number}> = ({r, at}) => {
  const f = useCurrentFrame();
  const k = prog(f, at, 20, EASE.inOut);
  const lift = Math.sin(k * Math.PI) * 40;
  const ang = k * 180;
  const col = RARITY_COL[r.rarity];
  const pop = prog(f, at + 18, 10, EASE.back);
  const w = 156;
  const h = 196;
  return (
    <div style={{width: w, height: h, perspective: 900, transform: `translateY(${-lift}px)`}}>
      <div style={{position: 'relative', width: w, height: h, transformStyle: 'preserve-3d', transform: `rotateY(${ang}deg)`}}>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: `repeating-linear-gradient(45deg, #1b1209 0px, #1b1209 12px, #261a0d 12px, #261a0d 24px)`, boxShadow: `0 0 0 6px ${C.gold1}, 0 0 0 10px ${C.ink}, 0 12px 0 10px rgba(0,0,0,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Rune ch={2} size={88} color={C.gold2} />
        </div>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: `radial-gradient(circle at 50% 42%, ${col}44 0%, #150f09 72%)`, boxShadow: `0 0 0 8px ${col}, 0 0 0 12px ${C.ink}, 0 12px 0 12px rgba(0,0,0,0.4)${r.rarity === 'unique' ? `, 0 0 48px ${col}aa` : ''}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
          <Icon id={r.id} size={96} style={{transform: `scale(${0.8 + 0.2 * pop})`}} />
          <div style={{width: 80, height: 6, background: col}} />
        </div>
      </div>
    </div>
  );
};

export const MissionComplete: FC<{bg?: boolean; mission?: string; kills?: number; seconds?: number; deaths?: number; treasure?: number; stars?: number; rewards?: Reward[]; xp?: number}> = ({
  bg,
  mission = '亡者沼泽 · 肃清祭坛',
  kills = 247,
  seconds = 522,
  deaths = 1,
  treasure = 6,
  stars = 4,
  rewards = [
    {id: 'emerald', rarity: 'common'},
    {id: 'iron_chestplate', rarity: 'common'},
    {id: 'enchanted_book', rarity: 'rare'},
    {id: 'netherite_ingot', rarity: 'unique'},
  ],
  xp = 1250,
}) => {
  const f = useCurrentFrame();
  const hit = 12;
  const titleK = prog(f, hit - 6, 14, EASE.out);
  const tIn = f - hit;
  const settle = tIn < 0 ? 1.4 : 1 + 0.4 * Math.pow(1 - clamp01(tIn / 14), 2);
  const panelK = prog(f, 30, 16, EASE.out);
  const rowAt = (i: number) => 36 + i * 16;
  const roll = (i: number, target: number) => Math.round(target * prog(f, rowAt(i) + 8, 24, EASE.out));
  const flash = (i: number) => 1 - clamp01((f - (rowAt(i) + 32)) / 14);
  const flashOn = (i: number) => (f >= rowAt(i) + 32 ? flash(i) : 0);
  const starAt = (i: number) => 112 + i * 9;
  const xpK = prog(f, 130, 40, EASE.inOut);
  return (
    <AbsoluteFill style={{background: bg ? '#050403' : undefined, overflow: 'hidden'}}>
      {bg && (
        <>
          <DungeonWall lights={[{x: 150, y: 380, r: 900}, {x: 1770, y: 380, r: 900}]} lit={1} dim={0.78} />
          <Floor y={900} dim={0.7} />
          <Pillars w={150} torchY={380} lit={1} />
          <Shaft x={960} w={420} lean={0} opacity={0.12} />
          <Dust box={[200, 0, 1520, 960]} count={28} seed={17} opacity={0.4} />
        </>
      )}
      {/* title */}
      <div style={{...center(46), transform: `scale(${settle})`, opacity: titleK, transformOrigin: '50% 60%'}}>
        <FantasyTitle size={156} spacing={0.16}>
          任务完成
        </FantasyTitle>
      </div>
      <div style={{...center(232), opacity: prog(f, hit + 6, 12)}}>
        <Rule k={prog(f, hit + 4, 20)} w={900} />
      </div>
      <div style={{...center(268), opacity: prog(f, hit + 12, 12)}}>
        <Label size={48} color={C.parch2} style={{letterSpacing: 6}}>
          {mission}
        </Label>
      </div>
      {/* stats */}
      <div style={{position: 'absolute', left: 190, top: 360, transform: `translateX(${(1 - panelK) * -300}px)`, opacity: panelK}}>
        <GoldFrame w={840} h={470} rim={12}>
          <div style={{position: 'absolute', left: 12, right: 12, top: 18, bottom: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <Row k={prog(f, rowAt(0), 12)} flash={flashOn(0)} label="击杀数" value={String(roll(0, kills))} icon={<Mob mob={{...MOBS.zombie, w: 8, h: 8, parts: [MOBS.zombie.parts[5]].map((p) => ({...p, x: 0, y: 0}))}} scale={7} />} />
            <Row k={prog(f, rowAt(1), 12)} flash={flashOn(1)} label="用时" value={fmtTime(roll(1, seconds))} icon={<Icon id="clock_00" size={64} />} />
            <Row k={prog(f, rowAt(2), 12)} flash={flashOn(2)} label="死亡次数" accent="#ff9a8a" value={String(roll(2, deaths))} icon={<PxSkull size={56} color={C.blood} />} />
            <Row k={prog(f, rowAt(3), 12)} flash={flashOn(3)} label="开启宝箱" value={`${roll(3, treasure)} / 8`} icon={<Icon id="gold_ingot" size={64} />} />
          </div>
        </GoldFrame>
      </div>
      {/* score */}
      <div style={{position: 'absolute', left: 1070, top: 360, width: 660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <div style={{opacity: prog(f, 100, 10)}}>
          <Label size={48} color={C.parch2} style={{letterSpacing: 10}}>
            评 分
          </Label>
        </div>
        <div style={{display: 'flex', gap: 16}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const on = i < stars;
            const k = on ? prog(f, starAt(i), 10, EASE.back) : 1;
            return (
              <div key={i} style={{transform: `scale(${on ? 0.3 + 0.7 * k : 1}) rotate(${on ? (1 - k) * -30 : 0}deg)`, filter: on && k > 0.15 && k < 0.8 ? 'brightness(1.9)' : undefined, opacity: prog(f, 100, 10)}}>
                <PxStar size={116} on={on && f >= starAt(i)} />
              </div>
            );
          })}
        </div>
      </div>
      {/* rewards */}
      <div style={{position: 'absolute', left: 1070, top: 604, width: 660, opacity: prog(f, 108, 10)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 4px'}}>
          {rewards.map((r, i) => (
            <FlipCard key={i} r={r} at={124 + i * 10} />
          ))}
        </div>
      </div>
      {/* xp bar */}
      <div style={{position: 'absolute', left: 200, right: 200, top: 924, display: 'flex', alignItems: 'center', gap: 28, opacity: prog(f, 120, 10)}}>
        <Label size={48} color={C.parch2}>
          经验
        </Label>
        <div style={{flex: 1, height: 40, background: '#120c07', boxShadow: `0 0 0 4px ${C.gold1}, 0 0 0 8px ${C.ink}`, position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${xpK * 72}%`, background: `linear-gradient(180deg, #fff1b0 0%, #fff1b0 22%, ${C.gold2} 22%, ${C.gold2} 66%, ${C.gold1} 66%)`}} />
        </div>
        <Label size={60} color={C.unique}>{`+${Math.round(xp * xpK).toLocaleString('en-US')}`}</Label>
      </div>
      {bg && <Embers box={[150, 840, 360, 120]} count={14} seed={31} rise={300} />}
      {bg && <Embers box={[1400, 840, 360, 120]} count={14} seed={32} rise={300} />}
      {bg && <Torch x={75} y={380} scale={12} lit={1} seed={1} />}
      {bg && <Torch x={1845} y={380} scale={12} lit={1} seed={2} />}
      {/* bursts on star lights and title */}
      <Shockwave x={960} y={140} at={hit} color={C.gold3} maxR={620} life={20} width={16} rays={16} seed={2} />
      {Array.from({length: stars}, (_, i) => (
        <PixelBurst key={i} x={1070 + 330 + (i - 2) * 132} y={470} at={starAt(i) + 4} count={16} colors={[C.gold3, C.gold2, '#fff']} speed={14} life={22} size={12} gravity={0.5} seed={50 + i} />
      ))}
      {bg && <Gloom s={0.62} />}
      <Sfx at={hit - 2} src={reelSfx('impact-cine.mp3')} volume={0.5} />
      <Sfx at={hit} src={mcSound('ui/toast/challenge_complete')} volume={0.4} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={rowAt(i) + 8} src={mcSound('random/click')} volume={0.3} rate={1 + i * 0.08} />
      ))}
      {Array.from({length: stars}, (_, i) => (
        <Sfx key={i} at={starAt(i)} src={mcSound('random/orb')} volume={0.32} rate={0.9 + i * 0.12} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={124 + i * 10 + 6} src={mcSound('ui/loom/take_result1')} volume={0.3} rate={1 + i * 0.05} />
      ))}
      <Sfx at={158} src={mcSound('random/levelup')} volume={0.3} />
      {void lerp}
    </AbsoluteFill>
  );
};
