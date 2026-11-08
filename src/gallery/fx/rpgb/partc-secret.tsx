import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {Twinkles} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {C, Dust, Embers, FantasyTitle, GoldFrame, Gloom, Icon, Label, Rune, Torch, prog, snap} from './kit';

/**
 * rpg-secret-found: one brick in a dungeon wall glows, is pushed in, the stone door around it swings open on
 * gold light and a treasure pedestal, then a gold "secret area" plate drops in.
 * Props: bg (false = only the notification plate, for overlaying), title, sub, openAt (frame the door starts to open).
 */

const TILE = 160;
const SHIFT_Y = 140;
const DOOR = {x: 760, y: 260, w: 400, h: 520};
/** The secret brick inside the right door half (local coordinates). */
const BR = {x: 20, y: 180};
const wallBg = (left: number, top: number): CSSProperties => ({
  backgroundImage: `url(${block('stone_bricks')})`,
  backgroundSize: `${TILE}px ${TILE}px`,
  backgroundPosition: `${-left}px ${SHIFT_Y - top}px`,
  imageRendering: 'pixelated',
});

const hole = `polygon(evenodd, 0 0, 1920px 0, 1920px 1080px, 0 1080px, 0 0, ${DOOR.x}px ${DOOR.y}px, ${DOOR.x + DOOR.w}px ${DOOR.y}px, ${DOOR.x + DOOR.w}px ${DOOR.y + DOOR.h}px, ${DOOR.x}px ${DOOR.y + DOOR.h}px, ${DOOR.x}px ${DOOR.y}px)`;

/** Torch light pools painted over everything (screen). */
const Pools: FC<{pts: {x: number; y: number}[]}> = ({pts}) => {
  const f = useCurrentFrame();
  return (
    <>
      {pts.map((l, i) => {
        const fl = 0.86 + 0.14 * Math.sin(f * 0.9 + i * 2.3) * Math.sin(f * 0.37 + i);
        return <AbsoluteFill key={i} style={{mixBlendMode: 'screen', opacity: fl, background: `radial-gradient(circle at ${l.x}px ${l.y}px, rgba(255,150,50,0.5) 0px, rgba(190,90,25,0.22) 300px, rgba(0,0,0,0) 680px)`}} />;
      })}
    </>
  );
};

/** Hanging dungeon banner: dark red wool, gold trim, V-cut bottom and a gold rune. */
const Tapestry: FC<{x: number; ch?: number}> = ({x, ch = 11}) => (
  <div style={{position: 'absolute', left: x, top: 0, width: 140, height: 420, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 90%, 0 100%)', backgroundImage: `url(${block('red_wool')})`, backgroundSize: '70px 70px', imageRendering: 'pixelated', filter: 'brightness(0.5) saturate(0.9)', boxShadow: 'inset 0 0 0 8px rgba(0,0,0,0.4)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 20, background: C.gold1}} />
    <div style={{position: 'absolute', left: 14, right: 14, top: 40, bottom: 56, boxShadow: `inset 0 0 0 4px ${C.gold1}`}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center'}}>
      <Rune ch={ch} size={80} color={C.gold2} />
    </div>
  </div>
);

const Half: FC<{side: 'l' | 'r'; ang: number; push: number; glow: number; pulse: number}> = ({side, ang, push, glow, pulse}) => {
  const left = side === 'l' ? DOOR.x : DOOR.x + DOOR.w / 2;
  const shade = 0.4 * clamp01(ang / 80);
  return (
    <div style={{position: 'absolute', left, top: DOOR.y, width: DOOR.w / 2, height: DOOR.h, transformOrigin: side === 'l' ? '0 50%' : '100% 50%', transform: `rotateY(${side === 'l' ? ang : -ang}deg)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, ...wallBg(left, DOOR.y), filter: 'brightness(0.62) saturate(0.8)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'rgba(12,8,5,0.7)'}} />
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${shade})`, boxShadow: side === 'l' ? 'inset -10px 0 0 rgba(0,0,0,0.55), inset -14px 0 0 rgba(255,255,255,0.07)' : 'inset 10px 0 0 rgba(0,0,0,0.55), inset 14px 0 0 rgba(255,255,255,0.07)'}} />
      {side === 'r' && (
        <>
          {/* the secret brick: sits in a dark socket and is pushed back */}
          <div style={{position: 'absolute', left: BR.x, top: BR.y, width: TILE, height: TILE, background: '#000', boxShadow: 'inset 0 0 0 6px #000'}} />
          <div
            style={{
              position: 'absolute',
              left: BR.x,
              top: BR.y,
              width: TILE,
              height: TILE,
              transform: `scale(${1 - 0.15 * push})`,
              filter: `brightness(${1 - 0.4 * push})`,
              overflow: 'hidden',
              boxShadow: `0 0 0 4px rgba(0,0,0,0.75), inset 0 0 0 6px rgba(255,196,70,${glow * (0.55 + 0.45 * pulse)}), inset 0 0 44px 6px rgba(255,170,50,${glow * 0.8 * pulse})`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, ...wallBg(left + BR.x, DOOR.y + BR.y), filter: `brightness(${0.62 + 0.7 * glow * pulse}) sepia(${glow}) saturate(${1 + 2.2 * glow})`}} />
            <div style={{position: 'absolute', inset: 0, background: `rgba(12,8,5,${0.7 * (1 - glow)})`}} />
            <div style={{position: 'absolute', inset: 0, background: `rgba(255,170,50,${0.3 * glow * pulse})`, mixBlendMode: 'screen'}} />
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: glow}}>
              <Rune ch={23} size={96} color={C.gold3} style={{filter: `drop-shadow(0 0 10px ${C.gold2})`}} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Chamber: FC<{open: number}> = ({open}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f * 0.16) * 10;
  const px = (DOOR.w - 120) / 2;
  return (
    <div style={{position: 'absolute', left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 62%, #fff7d0 0%, #ffd263 32%, #c58a22 68%, #3a2208 100%)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 96, backgroundImage: `linear-gradient(rgba(60,34,6,0.45), rgba(60,34,6,0.75)), url(${block('deepslate_tiles')})`, backgroundSize: '100% 100%, 64px 64px', imageRendering: 'pixelated'}} />
      <div style={{position: 'absolute', left: px, bottom: 80, width: 120, height: 96, backgroundImage: `url(${block('polished_deepslate')})`, backgroundSize: '64px 64px', imageRendering: 'pixelated', boxShadow: `inset 0 0 0 4px ${C.ink}, inset 6px 6px 0 rgba(255,255,255,0.15), inset -6px -6px 0 rgba(0,0,0,0.35)`}} />
      <div style={{position: 'absolute', left: px, top: DOOR.h - 80 - 96 - 192 + 12 + bob, width: 120, display: 'flex', justifyContent: 'center', opacity: open > 0.02 ? 1 : 0}}>
        <Icon id="totem_of_undying" size={192} style={{filter: `drop-shadow(0 8px 0 rgba(90,50,0,0.5)) drop-shadow(0 0 18px ${C.gold3})`}} />
      </div>
    </div>
  );
};

const Debris: FC<{x: number; y: number; at: number; count?: number; seed?: number; spread?: number}> = ({x, y, at, count = 18, seed = 2, spread = 6}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 40) return null;
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const vx = (r() - 0.5) * spread * 2;
        const vy = -r() * 9 - 2;
        const sz = 8 + Math.floor(r() * 3) * 4;
        const col = ['#6b6660', '#4a4540', '#8a847c', '#34302c'][Math.floor(r() * 4)];
        const px = x + vx * f;
        const py = y + vy * f + 0.9 * f * f;
        return <div key={i} style={{position: 'absolute', left: snap(px, 2), top: snap(py, 2), width: sz, height: sz, background: col, opacity: 1 - clamp01((f - 24) / 16), boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.35)'}} />;
      })}
    </>
  );
};

const Plate: FC<{title: string; sub: string; at: number}> = ({title, sub, at}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16, EASE.back);
  const y = -260 + (44 + 260) * p;
  const shine = prog(f, at + 12, 24, EASE.inOut);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: f < at ? 0 : 1}}>
      <GoldFrame w={940} h={164} glow="rgba(255,181,49,0.35)">
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4, textAlign: 'center'}}>
          <FantasyTitle size={64}>{title}</FantasyTitle>
          <Label small size={32} color={C.parch1}>
            {sub}
          </Label>
        </div>
        <div style={{position: 'absolute', left: 28, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
          <Icon id="trial_key" size={80} style={{filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.6))'}} />
        </div>
        <div style={{position: 'absolute', right: 28, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
          <Icon id="totem_of_undying" size={80} style={{filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.6))'}} />
        </div>
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: -200 + shine * 1200, width: 90, background: 'rgba(255,240,190,0.22)', transform: 'skewX(-20deg)'}} />
        </div>
      </GoldFrame>
    </div>
  );
};

export const SecretFound: FC<{bg?: boolean; title?: string; sub?: string; openAt?: number}> = ({bg = true, title = '发现秘密区域', sub = '隐藏的宝物间已解锁', openAt = 78}) => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 22, EASE.out);
  const glow = prog(f, 20, 34, EASE.inOut) * (1 - 0.45 * prog(f, openAt + 8, 20));
  const pulse = 0.7 + 0.3 * Math.sin(f * 0.5);
  const push = prog(f, openAt - 18, 14, EASE.out);
  const ang = prog(f, openAt, 46, EASE.inOut) * 86;
  const open = clamp01(ang / 86);
  const cam = 1 + 0.075 * prog(f, openAt - 6, 70, EASE.inOut);
  const rumble = (f >= openAt - 18 && f < openAt - 6) || (f >= openAt && f < openAt + 14) ? 1 : 0;
  const sh = rumble * (1 - clamp01((f - openAt) / 14)) * 7;
  const dx = Math.sin(f * 7.3) * sh;
  const dy = Math.cos(f * 6.1) * sh;
  const smokeT = (f - openAt) / 40;
  const bx = DOOR.x + DOOR.w / 2 + BR.x + TILE / 2;
  const by = DOOR.y + BR.y + TILE / 2;

  return (
    <AbsoluteFill style={{background: bg ? '#000' : undefined, overflow: 'hidden'}}>
      {bg && (
        <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${cam})`, transformOrigin: '960px 560px', opacity: intro}}>
          <Chamber open={open} />
          {/* wall with the door-shaped hole */}
          <AbsoluteFill style={{clipPath: hole}}>
            <div style={{position: 'absolute', inset: 0, ...wallBg(0, 0), filter: 'brightness(0.62) saturate(0.8)'}} />
            <div style={{position: 'absolute', inset: 0, background: 'rgba(12,8,5,0.7)'}} />
          </AbsoluteFill>
          {/* door frame stones */}
          <div style={{position: 'absolute', left: DOOR.x - 24, top: DOOR.y - 24, width: DOOR.w + 48, height: DOOR.h + 24, boxShadow: `0 0 0 8px ${C.stone1}, 0 0 0 12px ${C.ink}, inset 0 0 0 8px rgba(0,0,0,0.6)`}} />
          {/* floor */}
          <div style={{position: 'absolute', left: 0, right: 0, top: DOOR.y + DOOR.h, bottom: 0, backgroundImage: `linear-gradient(rgba(8,6,4,0.55), rgba(8,6,4,0.82)), url(${block('deepslate_tiles')})`, backgroundSize: '100% 100%, 128px 128px', imageRendering: 'pixelated', boxShadow: 'inset 0 8px 0 rgba(255,255,255,0.08), inset 0 16px 0 rgba(0,0,0,0.5)'}} />
          {/* gold light spilling over the floor */}
          <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: open, clipPath: `polygon(${DOOR.x}px ${DOOR.y + DOOR.h}px, ${DOOR.x + DOOR.w}px ${DOOR.y + DOOR.h}px, 1560px 1080px, 360px 1080px)`, background: 'linear-gradient(180deg, rgba(255,214,110,0.75) 0%, rgba(255,181,49,0.25) 100%)'}} />
          {/* props: barrels and tapestries, cobwebs in the top corners */}
          <div style={{position: 'absolute', left: 120, top: 800, width: 192, height: 240, backgroundImage: `url(${block('barrel_side')})`, backgroundSize: '192px 192px', imageRendering: 'pixelated', filter: 'brightness(0.55)', boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.55), 0 10px 0 rgba(0,0,0,0.5)'}} />
          <div style={{position: 'absolute', left: 290, top: 880, width: 144, height: 160, backgroundImage: `url(${block('barrel_side')})`, backgroundSize: '144px 144px', imageRendering: 'pixelated', filter: 'brightness(0.55)', boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.55), 0 10px 0 rgba(0,0,0,0.5)'}} />
          <div style={{position: 'absolute', left: 1560, top: 820, width: 208, height: 220, backgroundImage: `url(${block('barrel_side')})`, backgroundSize: '208px 208px', imageRendering: 'pixelated', filter: 'brightness(0.5)', boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.55), 0 10px 0 rgba(0,0,0,0.5)'}} />
          <Tapestry x={540} ch={11} />
          <Tapestry x={1240} ch={4} />
          <Img src={block('cobweb')} style={{position: 'absolute', left: 0, top: 0, width: 288, height: 288, imageRendering: 'pixelated', opacity: 0.55, filter: 'brightness(0.8)'}} />
          <Img src={block('cobweb')} style={{position: 'absolute', right: 0, top: 0, width: 288, height: 288, imageRendering: 'pixelated', opacity: 0.55, filter: 'brightness(0.8)', transform: 'scaleX(-1)'}} />
          {/* the door halves */}
          <div style={{position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: '50% 50%'}}>
            <Half side="l" ang={ang} push={push} glow={glow} pulse={pulse} />
            <Half side="r" ang={ang} push={push} glow={glow} pulse={pulse} />
          </div>
          {/* glow of the opening (one bloom) */}
          <div style={{position: 'absolute', left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h, mixBlendMode: 'screen', boxShadow: `0 0 140px 50px rgba(255,190,70,${0.75 * open})`, opacity: open > 0 ? 1 : 0}} />
          <Twinkles x={bx} y={by} radius={150} count={6} size={40} seed={8} />
          {/* torches */}
          <Torch x={340} y={400} scale={14} seed={1} />
          <Torch x={1580} y={400} scale={14} seed={2} />
          <Pools pts={[{x: 340, y: 410}, {x: 1580, y: 410}]} />
          <Embers box={[320, 390, 40, 20]} count={9} seed={3} rise={220} />
          <Embers box={[1560, 390, 40, 20]} count={9} seed={4} rise={220} />
          <Dust box={[300, 160, 1320, 640]} count={26} seed={5} opacity={0.4} />
          <Debris x={bx} y={by} at={openAt - 16} count={16} seed={2} spread={5} />
          <Debris x={960} y={270} at={openAt + 2} count={22} seed={7} spread={8} />
          {/* dust puffs at the door's foot */}
          {smokeT > 0 &&
            smokeT < 1 &&
            [0, 1, 2, 3].map((i) => {
              const d = i < 2 ? -1 : 1;
              const k = (smokeT - i * 0.08) * 1.2;
              if (k <= 0 || k >= 1) return null;
              return <Img key={i} src={tex(`particle/big_smoke_${Math.min(11, Math.floor(k * 12))}.png`)} style={{position: 'absolute', left: 960 + d * (140 + k * 260) - 110 + (i % 2) * 40, top: 700 + (i % 2) * 20, width: 220, height: 220, imageRendering: 'pixelated', opacity: 0.5 * (1 - k), filter: 'brightness(0.9) sepia(0.5)'}} />;
            })}
          <Gloom s={0.62} />
        </AbsoluteFill>
      )}
      <Plate title={title} sub={sub} at={openAt + 18} />
      <Sfx at={26} src={mcSound('random/orb')} volume={0.25} rate={1.6} />
      <Sfx at={openAt - 18} src={mcSound('dig/stone1')} volume={0.55} rate={0.8} />
      <Sfx at={openAt} src={mcSound('dig/stone3')} volume={0.5} rate={0.65} />
      <Sfx at={openAt + 4} src={reelSfx('impact-cine.mp3')} volume={0.3} />
      <Sfx at={openAt + 14} src={mcSound('random/levelup')} volume={0.3} rate={1.2} />
      <Sfx at={openAt + 18} src={mcSound('ui/toast/in')} volume={0.4} />
    </AbsoluteFill>
  );
};
