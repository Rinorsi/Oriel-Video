import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave, Shake} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {BannerCloth, Floor, Pillars} from './partb-kit';
import {Bars, C, Chest3D, DungeonWall, Dust, Embers, FantasyTitle, Gloom, Icon, Label, Mob, PxSkull, ShatterMob, center, lerp, prog} from './kit';

/**
 * rpg-boss-intro / rpg-boss-defeat: boss arena cinematics, soul-blue braziers + black bars.
 *   BossIntro  props: bg, name, epithet, level            (letterbox, silhouette approach, name plate swipe, health bar from both ends)
 *   BossDefeat props: bg, boss ('wither' | 'evoker' | 'golem' ...), banner ('胜利'), caption (line under banner)
 * Boss sprites are real entity textures (kit MOBS), shattered texel by texel.
 */

export const BOSS_INTRO_FRAMES = 150;
export const BOSS_DEFEAT_FRAMES = 180;

const SOUL = 'hue-rotate(172deg) saturate(1.35) brightness(1.05)';

/** Dark arena: blue-black deepslate wall, soul braziers on the pillars, floor, low fog. */
export const Arena: FC<{lit?: number; shiftX?: number; fog?: number}> = ({lit = 1, shiftX = 0, fog = 1}) => {
  const f = useCurrentFrame();
  return (
    <>
      <DungeonWall texture="deepslate_bricks" tint="5,8,18" dim={0.7} glow="90,170,255" glowMid="40,90,190" lit={lit} shiftX={shiftX} lights={[{x: 150, y: 330, r: 900}, {x: 1770, y: 330, r: 900}, {x: 960, y: 420, r: 1000}]} />
      <Floor y={800} dim={0.68} texture="polished_deepslate" />
      <div style={{filter: SOUL}}>
        <Pillars w={170} torchY={330} lit={lit} />
      </div>
      {[330, 1450].map((x) => (
        <div key={x} style={{position: 'absolute', left: x, top: 100, opacity: 0.85}}>
          <BannerCloth s={7} color="#1c2a5c" pattern="skull" patternColor="#8fb8ff" />
        </div>
      ))}
      {/* low fog: soft base + slow drifting bands */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 360, opacity: 0.55 * fog, background: 'linear-gradient(0deg, rgba(90,140,210,0.42), rgba(90,140,210,0))'}} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{position: 'absolute', left: ((i * 420 + f * (2.2 + (i % 3) * 0.8)) % 2400) - 480, top: 730 + (i % 4) * 54, width: 520 + (i % 3) * 120, height: 22 + (i % 2) * 12, opacity: 0.1 * fog, background: 'rgba(160,200,255,1)'}} />
      ))}
      <Dust box={[200, 0, 1520, 960]} count={26} seed={11} opacity={0.35} color="#bfe4ff" fall={40} />
    </>
  );
};

/** Boss health bar that grows from both ends to the centre. k 0..1. */
export const BossBar: FC<{k: number; fill?: number; w?: number; name?: string; level?: number}> = ({k, fill = 1, w = 1280, name = '', level = 40}) => {
  const half = w / 2;
  const seg = (side: 'l' | 'r') => (
    <div style={{position: 'absolute', top: 0, bottom: 0, [side === 'l' ? 'left' : 'right']: 0, width: half * k, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, bottom: 0, [side === 'l' ? 'left' : 'right']: 0, width: half * fill, background: `linear-gradient(180deg, #ff8a70 0%, #ff8a70 18%, ${C.blood} 18%, ${C.blood} 62%, #7a1313 62%)`}} />
      {Array.from({length: 12}, (_, i) => (
        <div key={i} style={{position: 'absolute', top: 0, bottom: 0, [side === 'l' ? 'left' : 'right']: (i + 1) * (half / 12), width: 4, background: 'rgba(0,0,0,0.35)'}} />
      ))}
    </div>
  );
  return (
    <div style={{position: 'relative', width: w, height: 44, opacity: k > 0 ? 1 : 0}}>
      <div style={{position: 'absolute', inset: -12, background: C.ink, boxShadow: `0 0 0 4px ${C.gold1}, 0 0 0 8px ${C.ink}, 0 10px 0 8px rgba(0,0,0,0.45)`, opacity: clamp01(k * 6)}} />
      <div style={{position: 'absolute', inset: 0, background: '#1a0a0a', boxShadow: `inset 0 0 0 4px #2a1010`}} />
      {seg('l')}
      {seg('r')}
      <div style={{position: 'absolute', left: '50%', top: -26, width: 68, height: 68, marginLeft: -34, transform: `scale(${EASE.back(clamp01((k - 0.7) / 0.3))})`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.ink, boxShadow: `0 0 0 4px ${C.gold2}, 0 0 0 8px ${C.ink}`}}>
        <PxSkull size={44} color={C.common} />
      </div>
      {name && (
        <div style={{position: 'absolute', left: 4, top: -56, opacity: clamp01((k - 0.5) * 3)}}>
          <Label size={36} color={C.parch2}>
            {`Lv.${level}  ${name}`}
          </Label>
        </div>
      )}
    </div>
  );
};

export const BossIntro: FC<{bg?: boolean; name?: string; epithet?: string; level?: number}> = ({bg, name = '凋零领主', epithet = '亡骸王座的主宰', level = 40}) => {
  const f = useCurrentFrame();
  const bars = prog(f, 0, 16, EASE.inOut);
  const hit = 64;
  const approach = prog(f, 8, hit - 8, EASE.inOut);
  const lunge = prog(f, hit, 10, EASE.back);
  const scale = lerp(7, 16, approach) + lunge * 1.6;
  const reveal = lerp(0.04, 0.2, approach) + lunge * 0.85;
  const bob = Math.sin(f / 12) * 10;
  const plateK = prog(f, hit + 4, 18, EASE.out);
  const barK = prog(f, hit + 30, 34, EASE.inOut);
  const settle = f > hit ? 1 + 0.015 * Math.sin((f - hit) / 18) : 1;
  const bossLift = lerp(170, 66, approach) - lunge * 10;
  const mobW = 28 * scale;
  return (
    <AbsoluteFill style={{background: bg ? '#03050a' : undefined, overflow: 'hidden'}}>
      <Shake at={hit} life={14} strength={22}>
        {bg && <Arena lit={0.35 + 0.65 * prog(f, 0, 24)} fog={1} shiftX={f * 0.3} />}
        {/* boss silhouette: very dark at first, rim-lit by the soul fire as it nears */}
        <div style={{position: 'absolute', left: 960 - mobW / 2, top: 80 + bossLift + bob, transform: `scale(${settle})`, opacity: clamp01(approach * 6), transformOrigin: '50% 40%'}}>
          <Mob mob="wither" scale={scale} filter={`brightness(${reveal}) contrast(1.15) drop-shadow(0 0 ${6 + approach * 22}px rgba(110,190,255,${0.35 + approach * 0.5}))`} />
        </div>
        {f >= hit && f < hit + 7 && <div style={{position: 'absolute', inset: 0, background: 'rgba(200,230,255,0.55)', opacity: 1 - (f - hit) / 7, mixBlendMode: 'screen'}} />}
        {/* name plate: swipes in from the left behind a gold edge */}
        <div style={{...center(668), clipPath: `inset(-40px ${100 - plateK * 100}% -40px 0)`}}>
          <div style={{transform: `translateX(${(1 - plateK) * -120}px)`}}>
            <div style={{position: 'relative', width: 1180, height: 200, background: 'linear-gradient(180deg, rgba(20,10,8,0.94), rgba(10,5,5,0.94))', boxShadow: `0 0 0 6px ${C.ink}, 0 0 0 12px ${C.gold1}, 0 0 0 16px ${C.ink}, 0 18px 0 16px rgba(0,0,0,0.5)`}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
                <div style={{width: 120, height: 4, background: C.gold2}} />
                <Label size={36} color={C.parch2} style={{letterSpacing: 10}}>
                  {epithet}
                </Label>
                <div style={{width: 120, height: 4, background: C.gold2}} />
              </div>
              <div style={{position: 'absolute', left: 0, right: 0, top: 58, display: 'flex', justifyContent: 'center'}}>
                <FantasyTitle size={112} tone="blood" spacing={0.14}>
                  {name}
                </FantasyTitle>
              </div>
            </div>
          </div>
        </div>
        {/* the gold swipe edge */}
        {plateK > 0 && plateK < 1 && <div style={{position: 'absolute', top: 648, height: 232, width: 14, left: 370 + plateK * 1180 - 120 * (1 - plateK), background: C.gold3, boxShadow: `0 0 40px ${C.gold2}`}} />}
        <div style={{...center(906)}}>
          <BossBar k={barK} w={1280} />
        </div>
        {bg && <Embers box={[240, 900, 1440, 80]} count={22} seed={4} rise={380} colors={['#bfe4ff', '#6fb4ff', '#ffffff']} amount={prog(f, 20, 30)} />}
        <Shockwave x={960} y={520} at={hit} color="#bfe4ff" maxR={760} life={20} width={18} rays={16} seed={5} />
      </Shake>
      {bg && <Gloom s={0.55} color="2,4,10" />}
      <Bars k={bars} size={100} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(0, 1 - f / 10)}} />
      <Sfx at={4} src={mcSound('ambient/weather/thunder1')} volume={0.35} />
      <Sfx at={hit - 2} src={reelSfx('impact-cine.mp3')} volume={0.6} />
      <Sfx at={hit + 4} src={mcSound('item/armor/equip_netherite1')} volume={0.5} rate={0.7} />
      <Sfx at={hit + 30} src={mcSound('random/anvil_use')} volume={0.3} rate={0.8} />
      <Sfx at={hit + 62} src={mcSound('random/anvil_land')} volume={0.35} rate={0.6} />
    </AbsoluteFill>
  );
};

/** Maps real frames to "game time": hit-stop at the killing blow, then a slow-motion crawl that eases back to normal. */
export const slowmo = (f: number, hitAt: number, holdLen: number, crawlLen: number, crawlRate: number) => {
  if (f <= hitAt) return f;
  if (f <= hitAt + holdLen) return hitAt; // frozen
  const g = f - hitAt - holdLen;
  if (g <= crawlLen) {
    // rate eases from crawlRate up to 1
    const t = g / crawlLen;
    return hitAt + g * (crawlRate + (1 - crawlRate) * t * 0.5);
  }
  const base = hitAt + crawlLen * (crawlRate + (1 - crawlRate) * 0.5);
  return base + (g - crawlLen);
};

/** Ribbon banner with swallow-tail ends. */
const Ribbon: FC<{w: number; h: number}> = ({w, h}) => (
  <div style={{position: 'relative', width: w, height: h}}>
    <div style={{position: 'absolute', inset: 0, clipPath: `polygon(0 0, 100% 0, calc(100% - 70px) 50%, 100% 100%, 0 100%, 70px 50%)`, background: C.ink, transform: 'translateY(12px)', opacity: 0.55}} />
    <div style={{position: 'absolute', inset: 0, clipPath: `polygon(0 0, 100% 0, calc(100% - 70px) 50%, 100% 100%, 0 100%, 70px 50%)`, background: C.gold1}} />
    <div style={{position: 'absolute', inset: 8, clipPath: `polygon(0 0, 100% 0, calc(100% - 70px) 50%, 100% 100%, 0 100%, 70px 50%)`, background: `linear-gradient(180deg, #8a1c1c 0%, #8a1c1c 12%, #6a1212 12%, #6a1212 80%, #4a0a0a 80%)`}} />
    <div style={{position: 'absolute', left: 96, right: 96, top: 22, height: 4, background: C.gold2}} />
    <div style={{position: 'absolute', left: 96, right: 96, bottom: 22, height: 4, background: C.gold2}} />
  </div>
);

export const BossDefeat: FC<{bg?: boolean; boss?: string; banner?: string; caption?: string}> = ({bg, boss = 'wither', banner = '胜 利', caption = '凋零领主 已被击败'}) => {
  const f = useCurrentFrame();
  const hit = 22;
  const g = slowmo(f, hit, 12, 40, 0.18);
  const shatter = clamp01((g - hit) / 44);
  const frozen = f > hit && f <= hit + 12;
  const bannerK = prog(f, 84, 16, EASE.back);
  const lootK = prog(f, 112, 14, EASE.back);
  const beamK = prog(f, 116, 22, EASE.out);
  const mobScale = 15;
  const sprite = boss;
  const spriteW = sprite === 'wither' ? 28 : 16;
  const spriteH = sprite === 'wither' ? 34 : 34;
  const sw = spriteW * mobScale;
  const hurtFlash = f < hit ? (f % 6 < 2 ? 1 : 0) * clamp01((f - 6) / 6) : 0;
  const desat = f > hit ? clamp01(1 - (f - hit - 12) / 24) : 0;
  const bossShake = f < hit ? Math.sin(f * 3) * clamp01(f / 14) * 8 : 0;
  return (
    <AbsoluteFill style={{background: bg ? '#03050a' : undefined, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, filter: `grayscale(${desat * 0.8}) contrast(${1 + desat * 0.15})`, transform: `scale(${f > hit ? 1 + 0.05 * clamp01((f - hit) / 14) - 0.05 * clamp01((f - hit - 40) / 40) : 1})`, transformOrigin: '50% 45%'}}>
        {bg && <Arena lit={1} fog={1} />}
        <div style={{position: 'absolute', left: 960 - sw / 2 + bossShake, top: 150}}>
          {shatter <= 0 ? (
            <Mob mob={sprite} scale={mobScale} filter={`brightness(${0.55 + hurtFlash * 0.9}) drop-shadow(0 0 22px rgba(110,190,255,0.6))${hurtFlash ? ' sepia(1) saturate(6) hue-rotate(-30deg)' : ''}`} />
          ) : (
            <div style={{filter: 'brightness(1.9) drop-shadow(0 0 8px rgba(130,210,255,0.9))'}}>
              <ShatterMob mob={sprite} scale={mobScale} t={shatter} seed={9} power={900} gravity={1100} stepsOf={2} />
            </div>
          )}
        </div>
        {f < hit + 14 && (
          <div style={{...center(884), opacity: 1 - prog(f, hit + 4, 10)}}>
            <BossBar k={1} w={1280} fill={Math.max(0, 0.22 * (1 - clamp01(f / hit)))} name="凋零领主" level={40} />
          </div>
        )}
        {/* pixel dust cloud where the boss was */}
        {shatter > 0 && <PixelBurst x={960} y={420} at={hit + 12} count={70} colors={['#bfe4ff', '#6fb4ff', '#ffffff', '#3a4a66']} speed={26} life={50} size={18} gravity={0.5} seed={3} />}
        {/* victory ribbon drops from above */}
        <div style={{...center(0), zIndex: 5, transform: `translateY(${-560 + bannerK * 700}px)`, opacity: bannerK > 0 ? 1 : 0}}>
          <div style={{position: 'relative'}}>
            <Ribbon w={1320} h={290} />
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 6}}>
              <FantasyTitle size={168} spacing={0.2}>
                {banner}
              </FantasyTitle>
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: -84, display: 'flex', justifyContent: 'center', opacity: prog(f, 100, 10)}}>
              <Label size={48} color={C.parch2}>
                {caption}
              </Label>
            </div>
          </div>
        </div>
        {/* loot: light pillar + chest + rising gems */}
        {beamK > 0 && (
          <>
            <div style={{position: 'absolute', left: 960 - 130 * beamK, width: 260 * beamK, top: 0, bottom: 150, WebkitMaskImage: 'linear-gradient(0deg, transparent, #000 30%)', background: 'linear-gradient(0deg, rgba(255,214,120,0.85), rgba(255,214,120,0.18) 80%, rgba(255,214,120,0.05))', mixBlendMode: 'screen', opacity: 0.9}} />
            <div style={{position: 'absolute', left: 960 - 56 * beamK, width: 112 * beamK, top: 0, bottom: 200, background: 'linear-gradient(0deg, rgba(255,255,255,0.9), rgba(255,240,190,0.2))', mixBlendMode: 'screen'}} />
            <Embers box={[840, 760, 240, 120]} count={26} seed={12} rise={700} colors={['#fff0b0', C.gold2, '#ffffff']} size={10} />
          </>
        )}
        <div style={{position: 'absolute', left: 960 - 77, top: 770 + (1 - lootK) * -480, opacity: lootK > 0 ? 1 : 0, transform: `scale(${1 + (lootK > 0.95 ? 0 : 0.0)})`}}>
          <Chest3D s={11} yaw={-12} pitch={20} open={prog(f, 130, 16)} glow={prog(f, 130, 16)} />
        </div>
        {lootK > 0 && ['diamond', 'enchanted_book', 'emerald', 'golden_apple'].map((id, i) => {
          const t = prog(f, 134 + i * 5, 24, EASE.out);
          const ang = (i - 1.5) * 0.55;
          return (
            <div key={id} style={{position: 'absolute', left: 960 - 32 + Math.sin(ang) * 300 * t, top: 760 - t * 150 - Math.abs(Math.cos(ang)) * 40 * t + Math.sin(f / 9 + i) * 6, opacity: t > 0 ? 1 : 0, transform: `scale(${0.5 + t * 0.7})`}}>
              <Icon id={id} size={64} style={{filter: `drop-shadow(0 0 10px ${C.gold2})`}} />
            </div>
          );
        })}
        <Embers box={[240, 940, 1440, 100]} count={16} seed={14} rise={420} colors={['#bfe4ff', '#6fb4ff']} />
      </div>
      {frozen && <AbsoluteFill style={{background: '#fff', opacity: 0.85 * (1 - (f - hit) / 12), mixBlendMode: 'screen'}} />}
      <Flash at={hit + 12} life={8} color="#cfeaff" peak={0.5} />
      {bg && <Gloom s={0.6} color="2,4,10" />}
      <Bars k={1} size={100} />
      <Sfx at={hit} src={mcSound('random/explode2')} volume={0.5} rate={0.8} />
      <Sfx at={hit + 12} src={mcSound('random/explode1')} volume={0.45} rate={0.7} />
      <Sfx at={84} src={mcSound('ui/toast/challenge_complete')} volume={0.45} />
      <Sfx at={84} src={reelSfx('impact-cine.mp3')} volume={0.45} />
      <Sfx at={112} src={mcSound('random/anvil_land')} volume={0.4} rate={0.9} />
      <Sfx at={130} src={mcSound('block/chest/open')} volume={0.5} />
    </AbsoluteFill>
  );
};
