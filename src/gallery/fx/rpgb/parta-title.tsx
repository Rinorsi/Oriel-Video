import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Shockwave} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {BannerCloth, Floor, Chain, Pillars} from './partb-kit';
import {Torch} from './kit';
import {block} from '../../../mc/assets';
import {C, Dust, Embers, FantasyTitle, Gloom, Label, PxStar, Shaft, DungeonWall, GoldFrame, Icon, center, lerp, prog} from './kit';

/**
 * rpg-dungeon-title: "entering the dungeon" title card.
 * Props: bg (wall + floor + torches; false = transparent layer with only title/plaques),
 *        title (big gold name), sub (chapter line), stars (0-5 difficulty stars lit), power (recommended power number).
 * Beats: dark + torches ignite (anticipation) -> title surfaces out of the dark with a hard pixel flash and settle
 * (burst) -> subtitle, stars and power plaque light up one by one (recovery) while the camera keeps pushing in.
 */

export const TITLE_FRAMES = 150;

/** Ornamental rule: a gold line that grows from the centre with a diamond in the middle. */
export const Rule: FC<{k: number; w?: number}> = ({k, w = 760}) => (
  <div style={{position: 'relative', width: w, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{position: 'absolute', left: '50%', top: 10, height: 4, width: (w / 2 - 28) * k, transform: 'translateX(-100%) translateX(-20px)', background: `linear-gradient(90deg, rgba(242,184,64,0), ${C.gold2})`, boxShadow: `0 4px 0 ${C.gold0}`}} />
    <div style={{position: 'absolute', left: '50%', top: 10, height: 4, width: (w / 2 - 28) * k, transform: 'translateX(20px)', background: `linear-gradient(270deg, rgba(242,184,64,0), ${C.gold2})`, boxShadow: `0 4px 0 ${C.gold0}`}} />
    <div style={{width: 20, height: 20, background: C.gold2, transform: `rotate(45deg) scale(${k})`, boxShadow: `inset -4px -4px 0 ${C.gold1}, inset 4px 4px 0 ${C.gold3}, 0 0 0 4px ${C.ink}`}} />
  </div>
);

export const DungeonTitle: FC<{bg?: boolean; title?: string; sub?: string; stars?: number; power?: number}> = ({bg, title = '幽暗密林', sub = '第二章 · 迷雾笼罩的古老林地', stars = 3, power = 120}) => {
  const f = useCurrentFrame();
  const hit = 46;
  const torchL = prog(f, 14, 12);
  const torchR = prog(f, 26, 12);
  const rise = prog(f, hit - 10, 26, EASE.out);
  const tIn = f - hit;
  const settle = tIn < 0 ? 1.18 : 1 + 0.18 * Math.pow(1 - clamp01(tIn / 14), 2) * (1 + 0.1 * Math.sin(tIn * 1.2));
  const shake = tIn >= 0 && tIn < 10 ? Math.sin(tIn * 5) * (10 - tIn) * 0.9 : 0;
  const push = lerp(1.0, 1.08, prog(f, 0, TITLE_FRAMES, (t) => t));
  const sweep = prog(f, hit + 22, 26, EASE.inOut);
  const blur = (1 - rise) * 16;
  const track = lerp(0.35, 0.06, EASE.out(clamp01((f - hit + 12) / 30)));
  const uiK = (at: number) => prog(f, at, 10, EASE.back);
  return (
    <AbsoluteFill style={{background: bg ? '#050403' : undefined, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${push}) translate(${shake}px, ${-shake * 0.5}px)`, transformOrigin: '50% 46%'}}>
        {bg && (
          <>
            <DungeonWall lights={[{x: 170, y: 340, r: 760}, {x: 1750, y: 340, r: 760}]} lit={0.15 + 0.85 * Math.max(torchL, torchR * 0.9)} dim={0.74} />
            <Floor y={800} dim={0.62} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 800, bottom: 0, opacity: 0.2 + 0.8 * Math.max(torchL, torchR)}}>
              <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(41% 0, 59% 0, 76% 100%, 24% 100%)', backgroundImage: `linear-gradient(180deg, rgba(10,4,3,0.75), rgba(10,4,3,0.15)), url(${block('red_wool')})`, backgroundSize: '100% 100%, 96px 48px', imageRendering: 'pixelated'}} />
              <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(41% 0, 41.6% 0, 25% 100%, 24% 100%)', background: C.gold1, opacity: 0.8}} />
              <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(58.4% 0, 59% 0, 76% 100%, 75% 100%)', background: C.gold1, opacity: 0.8}} />
            </div>
            <Chain x={600} len={210} s={8} sway={Math.sin(f / 26) * 1.4} />
            <Chain x={1320} len={170} s={8} sway={Math.sin(f / 22 + 1) * 1.6} />
            <div style={{position: 'absolute', left: 300, top: -10}}>
              <BannerCloth s={7} color="#7a1c1c" pattern="skull" patternColor="#e8b84a" />
            </div>
            <div style={{position: 'absolute', left: 1480, top: -10}}>
              <BannerCloth s={7} color="#7a1c1c" pattern="skull" patternColor="#e8b84a" />
            </div>
            <Pillars w={170} torchY={330} lit={0} />
            <Torch x={85} y={330} scale={12} lit={torchL} seed={1} />
            <Torch x={1835} y={330} scale={12} lit={torchR} seed={2} />
            <Shaft x={760} w={170} lean={240} opacity={0.22 * prog(f, 36, 30)} />
            <Shaft x={1230} w={120} lean={-220} opacity={0.16 * prog(f, 44, 30)} />
            <Dust box={[260, 0, 1400, 900]} count={36} seed={7} opacity={0.5 * prog(f, 30, 24)} />
          </>
        )}
        {/* title block */}
        <div style={{...center(236), transform: `translate(0px, ${(1 - rise) * 24}px) scale(${settle})`, opacity: clamp01(rise * 1.6), filter: `blur(${blur}px) brightness(${1 + (1 - rise) * 0.8})`}}>
          <div style={{position: 'relative'}}>
            <FantasyTitle size={230} spacing={track}>
              {title}
            </FantasyTitle>
            {/* one glint sweep across the letters */}
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden', mixBlendMode: 'screen', pointerEvents: 'none'}}>
              <div style={{position: 'absolute', top: -20, bottom: -20, width: 90, left: `${-12 + sweep * 124}%`, transform: 'skewX(-24deg)', background: 'linear-gradient(90deg, rgba(255,240,190,0), rgba(255,240,190,0.55), rgba(255,240,190,0))', opacity: sweep > 0 && sweep < 1 ? 1 : 0}} />
            </div>
          </div>
        </div>
        <div style={{...center(516), opacity: prog(f, hit + 12, 10)}}>
          <Rule k={prog(f, hit + 10, 20)} />
        </div>
        <div style={{...center(572), opacity: prog(f, hit + 20, 14), transform: `translateY(${(1 - prog(f, hit + 20, 14)) * 18}px)`}}>
          <Label size={48} color={C.parch2} style={{letterSpacing: 6}}>
            {sub}
          </Label>
        </div>
        {/* difficulty + power plaques */}
        <div style={{...center(676), gap: 56}}>
          <div style={{transform: `scale(${uiK(hit + 40)})`, opacity: uiK(hit + 40) > 0 ? 1 : 0}}>
            <GoldFrame w={560} h={132} rim={8} studs>
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24}}>
                <Label size={36} color={C.parch2}>
                  难度
                </Label>
                <div style={{display: 'flex', gap: 14}}>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const lit = i < stars;
                    const k = lit ? prog(f, hit + 52 + i * 8, 8, EASE.back) : 1;
                    return (
                      <div key={i} style={{transform: `scale(${lit ? 0.4 + 0.6 * k : 1})`, filter: lit && k > 0.2 && k < 0.9 ? 'brightness(1.8)' : undefined}}>
                        <PxStar size={54} on={lit && f >= hit + 52 + i * 8} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </GoldFrame>
          </div>
          <div style={{transform: `scale(${uiK(hit + 50)})`, opacity: uiK(hit + 50) > 0 ? 1 : 0}}>
            <GoldFrame w={560} h={132} rim={8} studs>
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
                <Icon id="iron_sword" size={64} />
                <Label size={36} color={C.parch2}>
                  推荐战力
                </Label>
                <Label size={60} color={C.unique}>
                  {String(Math.round(power * prog(f, hit + 60, 24)))}
                </Label>
              </div>
            </GoldFrame>
          </div>
        </div>
        {/* floor-level embers fill the lower corners */}
        {bg && <Embers box={[220, 880, 520, 120]} count={14} seed={2} rise={260} amount={torchL} />}
        {bg && <Embers box={[1180, 880, 520, 120]} count={14} seed={9} rise={260} amount={torchR} />}
        {bg && <Embers box={[110, 360, 120, 60]} count={8} seed={5} rise={160} size={8} amount={torchL} />}
        {bg && <Embers box={[1690, 360, 120, 60]} count={8} seed={6} rise={160} size={8} amount={torchR} />}
        <Shockwave x={960} y={380} at={hit} color={C.gold3} maxR={640} life={22} width={18} rays={18} seed={3} />
      </div>
      {bg && <Gloom s={0.62 + 0.18 * (1 - rise)} />}
      <AbsoluteFill style={{background: C.gold3, opacity: tIn >= 0 && tIn < 5 ? 0.5 * (1 - tIn / 5) : 0, mixBlendMode: 'screen'}} />
      {bg && <AbsoluteFill style={{background: '#000', opacity: Math.max(0, 1 - f / 12)}} />}
      <Sfx at={14} src={mcSound('fire/ignite')} volume={0.45} />
      <Sfx at={26} src={mcSound('fire/ignite')} volume={0.4} rate={1.1} />
      <Sfx at={hit - 2} src={reelSfx('impact-cine.mp3')} volume={0.55} />
      <Sfx at={hit + 52} src={mcSound('random/orb')} volume={0.3} />
      <Sfx at={hit + 60} src={mcSound('random/orb')} volume={0.3} rate={1.2} />
      <Sfx at={hit + 68} src={mcSound('random/orb')} volume={0.3} rate={1.4} />
    </AbsoluteFill>
  );
};
