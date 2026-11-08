import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import {C, DungeonWall, Embers, FantasyTitle, GoldFrame, Gloom, Icon, Label, Mob, PxHeart, Torch, lerp, prog, snap, type MobSprite} from './kit';

/**
 * rpg-camp-rest: a cave camp. The campfire catches, the player rests beside it, the HP bar refills, a tip slides in.
 * Props: bg (false = HUD pieces only: title, HP plate, tip), from / to (HP numbers, bar goes from -> to of `max`), max, title, tip.
 */

const STEVE: MobSprite = {
  w: 16,
  h: 32,
  parts: (() => {
    const src = tex('entity/player/wide/steve.png');
    const sheet: [number, number] = [64, 64];
    return [
      {src, sheet, rect: [4, 20, 4, 12], x: 4, y: 20},
      {src, sheet, rect: [20, 52, 4, 12], x: 8, y: 20},
      {src, sheet, rect: [44, 20, 4, 12], x: 0, y: 8},
      {src, sheet, rect: [36, 52, 4, 12], x: 12, y: 8},
      {src, sheet, rect: [20, 20, 8, 12], x: 4, y: 8},
      {src, sheet, rect: [8, 8, 8, 8], x: 4, y: 0},
      {src, sheet, rect: [40, 8, 8, 8], x: 4, y: 0},
    ];
  })(),
};

const GROUND = 810;
const FLOOR = 730;

const px = (s: number): CSSProperties => ({imageRendering: 'pixelated', backgroundSize: `${s}px ${s}px`});

const Fire: FC<{x: number; y: number; lit: number; size?: number}> = ({x, y, lit, size = 20}) => {
  const f = useCurrentFrame();
  const fr = Math.floor(f / 2) % 8;
  const S = 16 * size;
  const k = 0.35 + 0.65 * EASE.out(lit);
  return (
    <>
      {/* logs */}
      {[-16, 16].map((rot, i) => (
        <div key={i} style={{position: 'absolute', left: x - 170, top: y - 62 + (i ? 4 : 0), width: 340, height: 68, transform: `rotate(${rot}deg)`, backgroundImage: `url(${block('campfire_log_lit')})`, backgroundSize: '340px 1360px', backgroundPosition: `0 ${-Math.floor(f / 5) % 4 * 340}px`, imageRendering: 'pixelated', boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.35), inset 0 0 0 4px rgba(0,0,0,0.5)', filter: 'brightness(0.95)'}} />
      ))}
      {/* flame */}
      <div style={{position: 'absolute', left: x - (S * k) / 2, top: y - S * k + 24, width: S * k, height: S * k, backgroundImage: `url(${block('campfire_fire')})`, backgroundSize: `${S * k}px ${S * k * 8}px`, backgroundPosition: `0 ${-fr * S * k}px`, imageRendering: 'pixelated', filter: 'brightness(1.15)'}} />
      {/* stones */}
      {[-210, -150, -90, 90, 150, 210].map((dx, i) => (
        <div key={i} style={{position: 'absolute', left: x + dx - 30, top: y + 10 + (Math.abs(dx) > 100 ? -8 : 6) + (i % 2) * 6, width: 60, height: 44, backgroundImage: `url(${block('cobblestone')})`, ...px(48), boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.5), inset 4px 4px 0 rgba(255,255,255,0.12), 0 8px 0 rgba(0,0,0,0.45)', filter: 'brightness(0.8)'}} />
      ))}
    </>
  );
};

const Tent: FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 560, h = 420}) => (
  <div style={{position: 'absolute', left: x, top: y - h, width: w, height: h}}>
    {/* ridge pole */}
    <div style={{position: 'absolute', left: w / 2 - 8, top: -48, width: 16, height: 70, backgroundImage: `url(${block('oak_log')})`, ...px(32), filter: 'brightness(0.6)'}} />
    <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', backgroundImage: `url(${block('brown_wool')})`, ...px(64), filter: 'brightness(1.3) saturate(1.1)'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,5,3,0.7) 0%, rgba(8,5,3,0.32) 48%, rgba(255,140,40,0.1) 100%)'}} />
      {/* seams */}
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 6, background: 'rgba(0,0,0,0.55)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: 'rgba(0,0,0,0.5)'}} />
    </div>
    {/* doorway with a faint warm interior */}
    <div style={{position: 'absolute', left: '50%', bottom: 0, width: 150, height: 210, transform: 'translateX(-50%)', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', background: 'linear-gradient(180deg, #0a0605 0%, #2a1408 100%)'}} />
    <div style={{position: 'absolute', left: '50%', bottom: 0, width: 94, height: 40, transform: 'translateX(-50%)', background: 'rgba(255,150,50,0.16)'}} />
    {/* rope-pegs */}
    {[[-6, 0], [w - 6, 0]].map(([l], i) => (
      <div key={i} style={{position: 'absolute', left: l, bottom: -8, width: 12, height: 28, background: C.wood1, boxShadow: 'inset -3px 0 0 rgba(0,0,0,0.4)'}} />
    ))}
  </div>
);

const Stump: FC<{x: number; y: number; w?: number}> = ({x, y, w = 150}) => (
  <div style={{position: 'absolute', left: x, top: y - 100, width: w, height: 100}}>
    <div style={{position: 'absolute', left: 0, top: 24, width: w, height: 80, backgroundImage: `url(${block('oak_log')})`, ...px(64), filter: 'brightness(0.62)', boxShadow: 'inset -14px 0 0 rgba(0,0,0,0.35), 0 8px 0 rgba(0,0,0,0.4)'}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: 48, backgroundImage: `url(${block('oak_log_top')})`, ...px(w / 2), filter: 'brightness(0.75)', boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.4)'}} />
  </div>
);

const Stalactite: FC<{x: number; len: number; flip?: boolean}> = ({x, len, flip}) => {
  const pieces = ['pointed_dripstone_down_base', ...Array.from({length: Math.max(0, len - 3)}, () => 'pointed_dripstone_down_middle'), 'pointed_dripstone_down_frustum', 'pointed_dripstone_down_tip'];
  return (
    <div style={{position: 'absolute', left: x, top: -16, width: 112, transform: flip ? 'scaleX(-1)' : undefined, filter: 'brightness(0.42) sepia(0.3)'}}>
      {pieces.map((p, i) => (
        <Img key={i} src={block(p)} style={{display: 'block', width: 112, height: 112, imageRendering: 'pixelated', marginTop: i ? -1 : 0}} />
      ))}
    </div>
  );
};

const Rock: FC<{l?: number; r?: number; b: number; w: number; h: number}> = ({l, r, b, w, h}) => (
  <div style={{position: 'absolute', left: l, right: r, bottom: b, width: w, height: h, backgroundImage: `url(${block('cobbled_deepslate')})`, ...px(96), filter: 'brightness(0.22)', boxShadow: 'inset 0 6px 0 rgba(255,255,255,0.2)'}} />
);

const HealHearts: FC<{x: number; y: number; from: number; to: number}> = ({x, y, from, to}) => {
  const f = useCurrentFrame();
  const r = mulberry32(21);
  return (
    <>
      {Array.from({length: 9}, (_, i) => {
        const t0 = from + ((to - from) * i) / 9 + r() * 6;
        const k = (f - t0) / 34;
        const dx = (r() - 0.5) * 140;
        const dir = r() - 0.5;
        if (k < 0 || k > 1) return null;
        return <Img key={i} src={tex('particle/heart.png')} style={{position: 'absolute', left: snap(x + dx + dir * 50 * k, 4) - 20, top: snap(y - k * 260, 4), width: 40, height: 40, imageRendering: 'pixelated', opacity: Math.sin(k * Math.PI), transform: `scale(${0.7 + 0.5 * Math.sin(k * Math.PI)})`}} />;
      })}
    </>
  );
};

const HpPlate: FC<{value: number; max: number; flash: number}> = ({value, max, flash}) => {
  const BAR = 640;
  const k = clamp01(value / max);
  return (
    <GoldFrame w={820} h={148} glow={flash > 0 ? `rgba(255,214,110,${0.6 * flash})` : undefined}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: '0 36px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Label size={36} color={C.parch2}>
            生命值
          </Label>
          <Label size={36} color={k >= 0.999 ? C.gold2 : '#fff'}>
            {`${Math.round(value)} / ${max}`}
          </Label>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <PxHeart size={63} />
          <div style={{position: 'relative', width: BAR, height: 40, background: '#0d0706', boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px ${C.gold1}, inset 0 6px 0 rgba(0,0,0,0.6)`}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: snap(BAR * k, 4), background: `linear-gradient(180deg, #ff7a66 0 8px, ${C.blood} 8px 28px, #7a1414 28px 100%)`}} />
            <div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 28px, rgba(0,0,0,0.28) 28px 32px)'}} />
            <div style={{position: 'absolute', inset: 0, background: `rgba(255,236,170,${0.7 * flash})`, mixBlendMode: 'screen'}} />
          </div>
        </div>
      </div>
    </GoldFrame>
  );
};

export const CampRest: FC<{bg?: boolean; from?: number; to?: number; max?: number; title?: string; tip?: string}> = ({bg = true, from = 32, to = 180, max = 180, title = '营地休整', tip = '提示：在营地休整可恢复全部生命'}) => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 16, EASE.out);
  const lit = prog(f, 4, 34, EASE.out);
  const fill = prog(f, 30, 84, EASE.inOut);
  const hp = lerp(from, to, fill);
  const done = prog(f, 114, 6, EASE.out) * (1 - prog(f, 120, 18));
  const hpIn = prog(f, 18, 18, EASE.back);
  const tipIn = prog(f, 44, 16, EASE.out);
  const titleIn = prog(f, 12, 18, EASE.back);
  const breathe = Math.sin(f * 0.12) * 4;
  const FX = 960;

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: bg ? '#000' : undefined}}>
      {bg && (
        <AbsoluteFill style={{opacity: intro}}>
          <DungeonWall texture="cobbled_deepslate" tile={160} dim={0.74} lights={[{x: FX, y: 760, r: 1250}]} lit={0.35 + 0.65 * lit} />
          {/* stalactites */}
          <Stalactite x={30} len={5} />
          <Stalactite x={190} len={3} />
          <Stalactite x={1600} len={4} flip />
          <Stalactite x={1770} len={6} flip />
          {/* floor */}
          <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR, bottom: 0, backgroundImage: `linear-gradient(rgba(6,4,3,0.45), rgba(6,4,3,0.8)), url(${block('dirt')})`, backgroundSize: '100% 100%, 128px 128px', imageRendering: 'pixelated', boxShadow: 'inset 0 8px 0 rgba(255,255,255,0.07)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR, bottom: 0, mixBlendMode: 'screen', opacity: 0.4 + 0.6 * lit, background: `radial-gradient(ellipse 760px 190px at ${FX}px ${GROUND - 30 - FLOOR}px, rgba(255,150,50,0.5), rgba(255,120,30,0.15) 60%, rgba(0,0,0,0))`}} />
          <Tent x={150} y={GROUND} />
          <Stump x={500} y={GROUND + 70} />
          <Stump x={1230} y={GROUND + 62} w={140} />
          <Fire x={FX} y={GROUND - 10} lit={lit} />
          {/* the player resting by the fire */}
          <div style={{position: 'absolute', left: 1450, top: GROUND - 32 * 12 + 40 + breathe}}>
            <Mob mob={STEVE} scale={12} filter="brightness(0.82) sepia(0.12) drop-shadow(-8px 0 0 rgba(255,140,40,0.18))" />
          </div>
          <div style={{position: 'absolute', left: 1442, top: GROUND + 30, width: 210, height: 30, background: 'rgba(0,0,0,0.5)', clipPath: 'polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)'}} />
          <HealHearts x={1540} y={GROUND - 340} from={34} to={110} />
          <Torch x={1740} y={470} scale={14} seed={5} />
          <Embers box={[FX - 90, GROUND - 160, 180, 80]} count={26} seed={2} rise={460} size={10} life={80} amount={lit} />
          {/* foreground rocks */}
          <Rock r={0} b={0} w={360} h={130} />
          <Rock r={0} b={100} w={190} h={110} />
          <Rock l={0} b={0} w={300} h={90} />
          <Rock l={0} b={70} w={150} h={90} />
          <Gloom s={0.55} />
        </AbsoluteFill>
      )}
      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transform: `scale(${titleIn})`, opacity: titleIn > 0 ? 1 : 0}}>
        <FantasyTitle size={104}>{title}</FantasyTitle>
      </div>
      {/* tip slides in from the left edge */}
      <div style={{position: 'absolute', left: 80, top: 250, transform: `translateX(${-(1 - tipIn) * 900}px)`, opacity: tipIn > 0 ? 1 : 0}}>
        <GoldFrame w={780} h={100} rim={8} studs={false}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px'}}>
            <Icon id="golden_apple" size={56} />
            <Label size={36} color={C.parch2}>
              {tip}
            </Label>
          </div>
        </GoldFrame>
      </div>
      {/* HP plate */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - hpIn) * 260}px)`}}>
        <HpPlate value={hp} max={max} flash={done} />
      </div>
      <Sfx at={3} src={mcSound('fire/ignite')} volume={0.45} />
      <Sfx at={10} src={mcSound('block/furnace/fire_crackle1')} volume={0.3} />
      <Sfx at={74} src={mcSound('block/furnace/fire_crackle1')} volume={0.25} rate={1.1} />
      <Sfx at={20} src={mcSound('ui/toast/in')} volume={0.3} rate={0.9} />
      <Sfx at={32} src={mcSound('random/orb')} volume={0.28} rate={0.8} />
      <Sfx at={112} src={mcSound('random/levelup')} volume={0.35} rate={1.1} />
    </AbsoluteFill>
  );
};
