// HUD base for the Dungeons kit: the bottom-centre plate with artifact slots, the big red heart, potion/map/dodge slots,
// the hexagon quiver and the emerald counter, modelled on hud-strip-controller.png / hud-ingame-full.png.
// Design box is 1460 x 230 units; `scale` resizes it (default 0.9 -> about 1310px on a 1920 frame).
//
//   <HudBase hp={0.7} hurt={0.4} level={3} xp={0.6} arrows={20} emeralds={109} souls={27}
//            cd={{potion: 0.5, x: 0.2}} press="x" appear={1} />
import type {CSSProperties, FC, ReactNode} from 'react';
import {Img} from 'remotion';
import {item as itemTex, tex} from '../../../mc/assets';
import {EASE, clamp01} from '../../../mc/theme';
import {ChestFront} from '../../mob';
import {BevelSlot, HexBadge, ItemIcon3D, KeyCap, MCD, XpBar} from './parts';
import {chamferPts, HEART_PTS, insetPoly, ptsStr, type Pt} from './geom';
import {PxArt, CHEVRON_PAL, CHEVRON_ROWS, EMERALD_PAL, EMERALD_ROWS, HEART_PAL, HEART_ROWS, SOUL_ROWS} from './sprites';
import {PxText} from './pxtext';

/** Potion bottle from the real texture with the liquid overlay tinted. */
export const PotionIcon: FC<{size?: number; color?: string; style?: CSSProperties}> = ({size = 64, color = '#E8301C', style}) => {
  const n = parseInt(color.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const id = `ptint${color.slice(1)}`;
  const img: CSSProperties = {position: 'absolute', inset: 0, width: size, height: size, imageRendering: 'pixelated'};
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', ...style}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`${r} 0 0 0 0  ${g} 0 0 0 0  ${b} 0 0 0 0  0 0 0 1 0`} />
        </filter>
      </svg>
      <Img src={itemTex('potion')} style={img} />
      <Img src={itemTex('potion_overlay')} style={{...img, filter: `url(#${id})`}} />
    </div>
  );
};

const DPad: FC<{size?: number}> = ({size = 30}) => {
  const a = size / 3;
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none'}}>
      <div style={{position: 'absolute', left: a - 3, top: -3, width: a + 6, height: size + 6, background: '#000'}} />
      <div style={{position: 'absolute', left: -3, top: a - 3, width: size + 6, height: a + 6, background: '#000'}} />
      <div style={{position: 'absolute', left: a, top: 0, width: a, height: size, background: '#4A4A4E'}} />
      <div style={{position: 'absolute', left: 0, top: a, width: size, height: a, background: '#4A4A4E'}} />
      <div style={{position: 'absolute', left: a, top: 0, width: a, height: a * 0.7, background: '#fff'}} />
    </div>
  );
};

const Cooldown: FC<{v: number; size: number}> = ({v, size}) =>
  v > 0 ? (
    <div style={{position: 'absolute', inset: size * 0.09, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: `${clamp01(v) * 100}%`, background: 'rgba(0,0,0,0.62)', borderBottom: '3px solid rgba(255,255,255,0.55)'}} />
    </div>
  ) : null;

/** The Dungeons HUD base. All animation is driven by props so a demo can script it. */
export const HudBase: FC<{
  scale?: number;
  /** 0..1 build-in: plate rises, slots pop in staggered. */
  appear?: number;
  /** Health 0..1 (red fills the heart from the bottom). */
  hp?: number;
  /** 0..1 damage flash (white-red overlay, small shake). */
  hurt?: number;
  level?: number;
  xp?: number;
  lives?: number;
  arrows?: number;
  emeralds?: number;
  souls?: number;
  /** Cooldown 0..1 (1 = just used) per slot. */
  cd?: {x?: number; y?: number; b?: number; potion?: number; dodge?: number};
  /** Slot that was just activated (white flash on its frame). */
  press?: 'x' | 'y' | 'b' | 'lb' | 'map' | null;
  pressT?: number;
  emeraldBump?: number;
  soulBump?: number;
  newItem?: boolean;
  style?: CSSProperties;
}> = ({scale = 0.9, appear = 1, hp = 1, hurt = 0, level = 3, xp = 0.6, lives = 3, arrows = 20, emeralds = 109, souls = 27, cd = {}, press = null, pressT = 0, emeraldBump = 0, soulBump = 0, newItem = true, style}) => {
  const W = 1460;
  const H = 230;
  const pop = (i: number) => EASE.back(clamp01(appear * 9 - i * 0.8));
  const rise = (1 - EASE.out(clamp01(appear * 1.6))) * 120;
  const plate = chamferPts(1338, 100, [14, 14, 30, 30]);
  const plateIn = insetPoly(plate, 3);
  const hw = 203;
  const hh = 157;
  const heart = HEART_PTS.map(([x, y]) => [(x / 203) * hw, (y / 157) * hh] as Pt);
  const hOut = heart;
  const hHi = insetPoly(hOut, 2.5);
  const hMid = insetPoly(hOut, 8);
  const hDark = insetPoly(hOut, 19);
  const hRed = insetPoly(hOut, 22);
  const hid = 'hudheart';
  const shake = hurt > 0.15 ? Math.round(Math.sin(hurt * 40) * 4 * hurt) : 0;
  const flash = (k: string) => (press === k ? 1 - clamp01(pressT) : 0);
  const slotWrap = (i: number, x: number, y: number, node: ReactNode) => (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${pop(i)})`, transformOrigin: '50% 100%', opacity: pop(i) > 0.02 ? 1 : 0}}>{node}</div>
  );
  const flashFrame = (k: string, _size: number) =>
    flash(k) > 0 ? <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash(k) * 0.75, pointerEvents: 'none'}} /> : null;
  return (
    <div style={{position: 'relative', width: W * scale, height: H * scale, flex: 'none', ...style}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${scale}) translate(${shake}px, ${rise}px)`, transformOrigin: '0 0'}}>
        {/* plate */}
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <g transform="translate(3 94)">
            <polygon points={ptsStr(plate.map(([x, y]) => [x + 0, y + 16] as Pt))} fill="#000" opacity={0.85} />
            <polygon points={ptsStr(plate)} fill="#101012" />
            <polygon points={ptsStr(plateIn)} fill="#2C2C2F" />
            <rect x={3} y={3} width={1332} height={5} fill="#454549" />
            <rect x={3} y={70} width={1332} height={27} fill="#202022" />
            <rect x={3} y={70} width={1332} height={3} fill="#151517" />
          </g>
          {/* emerald block */}
          <g transform="translate(1333 94)">
            <polygon points={ptsStr(chamferPts(64, 100, [0, 10, 0, 0]))} fill="#000" opacity={0.85} transform="translate(2 16)" />
            <polygon points={ptsStr(chamferPts(64, 100, [0, 10, 0, 0]))} fill="#101012" />
            <polygon points={ptsStr(insetPoly(chamferPts(64, 100, [0, 10, 0, 0]), 3))} fill="#2C2C2F" />
            <rect x={14} y={78} width={14} height={14} fill="#0D0D0F" />
            <rect x={16} y={80} width={10} height={10} fill={MCD.emeraldMid} />
          </g>
        </svg>
        {/* soul counter + gauge */}
        <div style={{position: 'absolute', left: 16, top: 124, display: 'flex', alignItems: 'center', gap: 8, transform: `scale(${1 + soulBump * 0.2})`, transformOrigin: '0 50%'}}>
          <PxArt rows={SOUL_ROWS} pal={{o: soulBump > 0 ? MCD.soul : '#8E8E94'}} px={2} style={{transform: `rotate(${soulBump * 90}deg)`}} />
          <PxText text={souls} px={2} gap={1} />
        </div>
        <div style={{position: 'absolute', left: 236, top: 168, width: 372, height: 8, background: '#161618'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${soulBump > 0 ? 60 : 8}%`, background: MCD.soul}} />
        </div>

        {/* slots */}
        {slotWrap(
          0,
          96,
          52,
          <BevelSlot size={100} drop isNew={newItem} keycap={<DPad />}>
            <ChestFront scale={4} />
          </BevelSlot>,
        )}
        {slotWrap(
          1,
          231,
          32,
          <BevelSlot size={120} drop keycap={<KeyCap label="X" color={MCD.keyX} size={40} />}>
            <ItemIcon3D src={itemTex('firework_rocket')} size={76} depth={4} />
            <Cooldown v={cd.x ?? 0} size={120} />
            {flashFrame('x', 120)}
          </BevelSlot>,
        )}
        {slotWrap(
          2,
          360,
          32,
          <BevelSlot size={120} drop keycap={<KeyCap label="Y" color={MCD.keyY} size={40} />}>
            <ItemIcon3D src={itemTex('totem_of_undying')} size={76} depth={4} />
            <Cooldown v={cd.y ?? 0} size={120} />
            {flashFrame('y', 120)}
          </BevelSlot>,
        )}
        {slotWrap(
          3,
          488,
          32,
          <BevelSlot size={120} drop keycap={<KeyCap label="B" color={MCD.keyB} size={40} />}>
            <ItemIcon3D src={itemTex('fishing_rod')} size={76} depth={4} />
            <Cooldown v={cd.b ?? 0} size={120} />
            {flashFrame('b', 120)}
          </BevelSlot>,
        )}
        {slotWrap(
          5,
          798,
          34,
          <BevelSlot size={120} drop keycap={<KeyCap label="LB" size={38} wide />}>
            <PotionIcon size={76} />
            <Cooldown v={cd.potion ?? 0} size={120} />
            {flashFrame('lb', 120)}
          </BevelSlot>,
        )}
        {slotWrap(
          6,
          931,
          52,
          <BevelSlot size={100} drop keycap={<DPad />}>
            <ItemIcon3D src={itemTex('filled_map')} size={64} depth={3} />
            {flashFrame('map', 100)}
          </BevelSlot>,
        )}

        {/* dodge */}
        {slotWrap(
          7,
          1053,
          94,
          <div style={{position: 'relative', width: 94, height: 70, background: '#0E0E10', boxShadow: 'inset 3px 3px 0 #1C1C1E'}}>
            <PxArt rows={CHEVRON_ROWS} pal={CHEVRON_PAL} px={5} style={{position: 'absolute', left: 14, top: 8, opacity: 1 - (cd.dodge ?? 0) * 0.65}} />
            <div style={{position: 'absolute', right: -6, bottom: -10}}>
              <KeyCap label="RB" size={32} wide />
            </div>
            <Cooldown v={cd.dodge ?? 0} size={70} />
          </div>,
        )}

        {/* quiver */}
        {slotWrap(
          8,
          1186,
          46,
          <div style={{position: 'relative'}}>
            <HexBadge w={108} ring="#3C3C40" ringHi="#5A5A60" fill="#0F0F11" ringW={9}>
              <div style={{position: 'relative', width: 70, height: 80}}>
                {[
                  [10, 30, -10],
                  [26, 6, 0],
                  [42, 26, 10],
                  [54, 44, 18],
                ].map(([x, y, r], i) => (
                  <Img key={i} src={itemTex('arrow')} style={{position: 'absolute', left: x - 12, top: y, width: 32, height: 32, imageRendering: 'pixelated', transform: `rotate(${-45 + r}deg) scale(1.15)`, transformOrigin: '50% 100%'}} />
                ))}
                {[
                  [18, 30],
                  [34, 22],
                  [50, 38],
                ].map(([x, y], i) => (
                  <div key={i} style={{position: 'absolute', left: x, top: y + 20, width: 3, height: 34, background: '#8A5E22'}} />
                ))}
              </div>
            </HexBadge>
            <div style={{position: 'absolute', left: -2, top: -14}}>
              <PxText text={arrows} px={3} gap={1} outline="#000" shadow={0} />
            </div>
            <div style={{position: 'absolute', right: -8, bottom: 6}}>
              <KeyCap label="RT" size={32} wide />
            </div>
          </div>,
        )}

        {/* emeralds */}
        <div style={{position: 'absolute', left: 1345, top: 114, transform: `scale(${1 + emeraldBump * 0.2})`, transformOrigin: '50% 50%'}}>
          <PxArt rows={EMERALD_ROWS} pal={EMERALD_PAL} px={4} />
        </div>
        <div style={{position: 'absolute', left: 1406, top: 118, transform: `translateY(${-emeraldBump * 8}px)`}}>
          <PxText text={emeralds} px={3} gap={1} outline="#000" shadow={0} />
        </div>

        {/* heart */}
        <div style={{position: 'absolute', left: 600, top: 2, width: hw, height: hh, transform: `scale(${pop(4)})`, transformOrigin: '50% 80%'}}>
          <svg width={hw} height={hh} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <defs>
              <clipPath id={`${hid}-fill`}>
                <rect x={0} y={(1 - clamp01(hp)) * hh} width={hw} height={hh} />
              </clipPath>
              <clipPath id={`${hid}-top`}>
                <rect x={0} y={0} width={hw} height={hh * 0.3} />
              </clipPath>
            </defs>
            <polygon points={ptsStr(hOut.map(([x, y]) => [x, y + 10] as Pt))} fill="#000" opacity={0.85} />
            <polygon points={ptsStr(hOut)} fill="#050505" />
            <polygon points={ptsStr(hHi)} fill="#68686D" />
            <polygon points={ptsStr(hMid)} fill="#3A3A3E" />
            <polygon points={ptsStr(hDark)} fill="#141416" />
            <polygon points={ptsStr(hRed)} fill="#5E1822" />
            <polygon points={ptsStr(hRed)} fill={MCD.red} clipPath={`url(#${hid}-fill)`} />
            <polygon points={ptsStr(hRed)} fill="#C23A3E" clipPath={`url(#${hid}-top)`} opacity={hp > 0.75 ? 0.85 : 0} />
            {hurt > 0 && <polygon points={ptsStr(hRed)} fill="#FFFFFF" opacity={hurt * 0.85} />}
          </svg>
        </div>
        {/* lives, level, xp */}
        <div style={{position: 'absolute', left: 586, top: 140, display: 'flex', alignItems: 'center', gap: 10}}>
          <PxText text={lives} px={4} gap={1} />
          <PxArt rows={HEART_ROWS} pal={HEART_PAL} px={3} />
        </div>
        <div style={{position: 'absolute', left: 752, top: 138, display: 'flex', alignItems: 'flex-end', gap: 8}}>
          <PxText text="LV" px={3} gap={1} bold={1} color="#ACACAC" shadow={0} style={{marginBottom: 2}} />
          <PxText text={level} px={4} gap={1} />
        </div>
        <XpBar value={xp} w={331} h={12} style={{position: 'absolute', left: 812, top: 178}} />
      </div>
    </div>
  );
};

void tex;
