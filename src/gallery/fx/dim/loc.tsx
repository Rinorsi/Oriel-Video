import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, Sequence, useCurrentFrame} from 'remotion';
import {Flash, LightRays, PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {item, tex} from '../../../mc/assets';
import {PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreChip, OreProgress, OreText, TYPE, U, nine} from '../../../mg/Ore';
import {Letterbox, Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import type {FxEntry} from '../../types';
import {BandTitle, Cam, TITLE_PALETTES, blockUrl, hexA, type TitleTone} from './kit';
import {NetherCanvas, OverworldCanvas} from './scenes';

/**
 * Location cards.
 *   loc-title-card   : dark rails with brick strips top/bottom, the title slams in from both sides and collides in the
 *                      middle (light flare, shock, shine sweep), subtitle, icon, compass and counting X/Y/Z chips.
 *   loc-biome-banner : ornate Ore banner unrolling from a centre line over a cherry grove, icon, title, climate chips,
 *                      discovery progress + XP, falling petals.
 * Both: `<X bg />` = demo with a world plate behind; `<X />` = overlay only (transparent).
 * Props worth changing (constants at the top of each component): title halves, sub, coordinates, tone.
 */

const gold = '#ffc93a';

const Corner: FC<{x: number; y: number; flipX?: boolean; flipY?: boolean; k: number; color?: string}> = ({x, y, flipX, flipY, k, color = gold}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 80, height: 80, transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1}) scale(${k})`, transformOrigin: flipX ? '100% 0' : '0 0', opacity: k}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 80, height: 12, background: color, boxShadow: '0 6px 0 rgba(0,0,0,0.5)'}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: 12, height: 80, background: color, boxShadow: '6px 0 0 rgba(0,0,0,0.5)'}} />
    <div style={{position: 'absolute', left: 24, top: 24, width: 16, height: 16, background: color, transform: 'rotate(45deg)'}} />
  </div>
);

// ================================================================ 5. location title card

export const T5 = 156;
const TITLE_L = '下界';
const TITLE_R = '要塞';

const Brick: FC<{top?: boolean; k: number}> = ({top, k}) => {
  const h = 76;
  const y = top ? -(1 - k) * h : 1080 - h + (1 - k) * h;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, height: h}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${blockUrl('nether_bricks')})`, backgroundSize: '64px 64px', imageRendering: 'pixelated', backgroundPosition: '0 0'}} />
      <div style={{position: 'absolute', inset: 0, background: 'rgba(10,0,0,0.5)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, [top ? 'bottom' : 'top']: 0, height: 8, background: gold, boxShadow: `0 ${top ? 8 : -8}px 0 rgba(0,0,0,0.6)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, [top ? 'bottom' : 'top']: -24, height: 6, backgroundImage: `repeating-linear-gradient(90deg, ${gold} 0 24px, rgba(0,0,0,0) 24px 40px)`, opacity: 0.8}} />
      <div style={{position: 'absolute', left: 960 - 40, [top ? 'bottom' : 'top']: -20, width: 80, height: 80, transform: 'rotate(45deg) scale(0.62)', background: '#2a0a0a', border: `8px solid ${gold}`, boxShadow: '0 8px 0 rgba(0,0,0,0.5)'}} />
    </div>
  );
};

const CoordBox: FC<{label: string; value: number; k: number; color: string}> = ({label, value, k, color}) => (
  <div style={{...nine('slot', [2, 2, 2, 2]), height: 18 * U, minWidth: 56 * U, padding: `0 ${5 * U}px`, display: 'inline-flex', alignItems: 'center', gap: 3 * U, transform: `scale(${k})`, opacity: k > 0 ? 1 : 0}}>
    <OreText size={TYPE.small} color={color}>
      {label}
    </OreText>
    <OreText size={TYPE.body} shadow>
      {String(value)}
    </OreText>
  </div>
);

const ShineText: FC<{text: string; size: number; at: number; f: number}> = ({text, size, at, f}) => {
  const p = size / 12;
  const t = clamp01((f - at) / 18);
  return (
    <span
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        fontFamily: PIXEL_FONT,
        fontSize: size,
        lineHeight: `${size}px`,
        whiteSpace: 'pre',
        letterSpacing: p,
        backgroundImage: 'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 60%)',
        backgroundSize: '300% 100%',
        backgroundPosition: `${100 - t * 100}% 0`,
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        opacity: t > 0 && t < 1 ? 1 : 0,
      }}
    >
      {text}
    </span>
  );
};

/** Props of LocTitleCard. Without `bg` it is transparent and sits on top of your footage. */
export type LocTitleCardProps = {
  /** true = demo Nether world behind (default off). */
  bg?: boolean;
  /** Title palette: stone / nether / end / grass / gold / ice / pink. */
  tone?: TitleTone;
  /** Left half of the title (slides in from the left). */
  left?: string;
  /** Right half of the title (slides in from the right). */
  right?: string;
  /** Spaced English subtitle. */
  sub?: string;
  /** [x, y, z] the three coordinate boxes count up to. */
  coords?: [number, number, number];
  /** Tag chip above the title; empty string hides it. */
  tag?: string;
  /** Block id (vanilla block texture) in the first icon frame. */
  icon?: string;
};

export const LocTitleCard: FC<LocTitleCardProps> = ({bg, tone = 'gold', left = TITLE_L, right = TITLE_R, sub = 'NETHER FORTRESS', coords = [-312, 64, 1048], tag = '新地点 · NEW LOCATION', icon = 'nether_bricks'}) => {
  const f = useCurrentFrame();
  const pal = TITLE_PALETTES[tone];
  const size = 252;
  const rail = prog(f, 0, 14, EASE.out) * (1 - prog(f, T5 - 26, 18, EASE.in));
  const slideT = clamp01((f - 8) / 22);
  const hit = 30;
  const u = f - hit;
  const settle = u >= 0 ? 26 * Math.exp(-u / 4) * Math.cos(u * 0.95) : 0;
  const exitT = EASE.in(clamp01((f - (T5 - 30)) / 20));
  // exit: the halves part a little and fade, so nothing is ever cut by the frame edge
  const xl = f < hit ? -1300 * (1 - EASE.out(slideT)) + settle * 0 : settle - 240 * exitT;
  const xr = f < hit ? 1300 * (1 - EASE.out(slideT)) : -settle + 240 * exitT;
  const leave = f < hit ? 0 : 1;
  const shake = u >= 0 && u < 10 ? 14 * (1 - u / 10) : 0;
  const rs = mulberry32(5000 + f);
  const sx = (rs() * 2 - 1) * shake;
  const sy = (rs() * 2 - 1) * shake;
  const flare = u >= 0 ? Math.max(0, 1 - u / 16) : 0;
  const subIn = prog(f, 36, 14, EASE.out) * (1 - exitT);
  const row = (i: number) => prog(f, 46 + i * 4, 10, EASE.back) * (1 - exitT);
  const count = EASE.out(clamp01((f - 48) / 26));
  const compassFrame = f < 70 ? (f * 2) % 32 : Math.min(31, 0);
  const leftW = [...left].length;
  const rowW = (leftW + [...right].length) * (size + size / 12);
  void rowW;
  const textGlow = `drop-shadow(0 0 ${12 + 50 * flare}px ${hexA(pal.glow ?? gold, 0.4 + 0.5 * flare)})`;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: bg ? '#000' : undefined}}>
      <Cam dx={sx} dy={sy}>
        {bg && (
          <Cam zoom={1.04 + 0.04 * prog(f, 0, T5, (t) => t)} fx={960} fy={600}>
            <NetherCanvas heat={0.9} />
          </Cam>
        )}
        {/* dark vignette + gradient rails */}
        <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(8,0,0,${0.86 * rail}) 0%, rgba(8,0,0,${0.35 * rail}) 24%, rgba(8,0,0,0) 40%, rgba(8,0,0,0) 62%, rgba(8,0,0,${0.4 * rail}) 80%, rgba(8,0,0,${0.9 * rail}) 100%)`}} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,${0.2 * rail}) 30%, rgba(30,0,0,${0.62 * rail}) 100%)`}} />
        {/* soft light behind the title */}
        <AbsoluteFill style={{opacity: 0.35 + 0.5 * flare}}>
          <LightRays x={960} y={470} size={1700} color="255,200,120" opacity={0.28} rays={14} />
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, height: 340, background: `radial-gradient(ellipse at 50% 50%, ${hexA(gold, 0.18 + 0.4 * flare)} 0%, rgba(0,0,0,0) 65%)`, opacity: rail}} />
        <Brick top k={rail} />
        <Brick k={rail} />
        <Corner x={110} y={130} k={rail} />
        <Corner x={1810} y={130} flipX k={rail} />
        <Corner x={110} y={950} flipY k={rail} />
        <Corner x={1810} y={950} flipX flipY k={rail} />
        <Twinkles x={960} y={470} radius={720} count={16} size={36} seed={12} />
        {/* title, two halves colliding */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', filter: textGlow, opacity: 1 - exitT}}>
          <div style={{display: 'flex', gap: size / 12}}>
            <div style={{position: 'relative', transform: `translateX(${xl}px)`}}>
              <BandTitle size={size} tone={tone}>
                {left}
              </BandTitle>
              <ShineText text={left} size={size} at={34} f={f} />
            </div>
            <div style={{position: 'relative', transform: `translateX(${xr}px)`}}>
              <BandTitle size={size} tone={tone}>
                {right}
              </BandTitle>
              <ShineText text={right} size={size} at={38} f={f} />
            </div>
          </div>
        </div>
        {/* collision flare: horizontal streak + cross star */}
        {u >= 0 && u < 18 && (
          <>
            <div style={{position: 'absolute', left: 960 - 960 * Math.min(1, u / 4), width: 1920 * Math.min(1, u / 4), top: 430 - 10 * (1 - u / 18), height: 20 * (1 - u / 18), background: '#fff6d8', boxShadow: `0 0 50px 16px ${hexA(gold, 0.9)}`, opacity: 1 - u / 18}} />
            <div style={{position: 'absolute', left: 960 - 8, top: 430 - 340 * flare, width: 16, height: 680 * flare, background: 'linear-gradient(180deg, rgba(255,246,216,0), #fff6d8, rgba(255,246,216,0))', opacity: flare}} />
          </>
        )}
        {leave > 0 && <Shockwave x={960} y={430} at={hit} color="#fff1c0" maxR={900} life={20} width={24} />}
        <PixelBurst x={960} y={430} at={hit} count={60} colors={[gold, '#fff6d8', '#ff9a3a', '#ffffff']} speed={34} life={40} size={14} gravity={0.4} seed={21} />
        {/* subtitle */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, opacity: subIn, transform: `translateY(${(1 - subIn) * 28}px)`}}>
          <div style={{width: 200 * subIn, height: 6, background: `linear-gradient(90deg, rgba(0,0,0,0), ${gold})`}} />
          <OreText size={TYPE.h1 * 0.5} color={pal.light} style={{letterSpacing: 16, marginRight: -16, textShadow: `${U}px ${U}px 0 ${pal.extrude2}, 0 0 28px ${hexA(gold, 0.6)}`}}>
            {sub}
          </OreText>
          <div style={{width: 200 * subIn, height: 6, background: `linear-gradient(270deg, rgba(0,0,0,0), ${gold})`}} />
        </div>
        {/* info row: icon, compass, coordinates */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 724, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28}}>
          <div style={{width: 112, height: 112, transform: `scale(${row(0)}) rotate(${(1 - row(0)) * -90}deg)`, border: `8px solid ${gold}`, background: 'rgba(0,0,0,0.55)', boxShadow: '0 10px 0 rgba(0,0,0,0.55)', padding: 12, boxSizing: 'border-box'}}>
            <Img src={blockUrl(icon)} style={{width: '100%', height: '100%', imageRendering: 'pixelated'}} />
          </div>
          <div style={{width: 112, height: 112, transform: `scale(${row(1)})`, ...nine('slot', [2, 2, 2, 2]), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={item(`compass_${String(compassFrame).padStart(2, '0')}`)} style={{width: 80, height: 80, imageRendering: 'pixelated'}} />
          </div>
          <CoordBox label="X" value={Math.round(coords[0] * count)} k={row(2)} color="#ff7a7a" />
          <CoordBox label="Y" value={Math.round(coords[1] * count)} k={row(3)} color="#8cf08c" />
          <CoordBox label="Z" value={Math.round(coords[2] * count)} k={row(4)} color="#7ab8ff" />
        </div>
        {tag !== '' && <OreSmallTag f={f} out={exitT} text={tag} />}
        <Flash at={hit} life={8} color="#fff1c0" peak={0.7} />
      </Cam>
      <Vignette s={0.2 * rail} color="30,0,0" />
      <Sfx at={hit} src={mcSound('random/anvil_land')} volume={0.5} rate={0.85} />
      <Sfx at={hit + 4} src={mcSound('random/explode1')} volume={0.2} rate={1.2} />
      <Sfx at={36} src={mcSound('ui/toast/in')} volume={0.4} />
      {[46, 50, 54, 58, 62].map((a, i) => (
        <Sfx key={a} at={a} src={mcSound('random/click')} volume={0.25} rate={1 + i * 0.12} />
      ))}
    </AbsoluteFill>
  );
};

/** "NEW LOCATION" tag above the title. */
const OreSmallTag: FC<{f: number; out: number; text: string}> = ({f, out, text}) => {
  const p = prog(f, 22, 10, EASE.back) * (1 - out);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 218, display: 'flex', justifyContent: 'center', transform: `scale(${p})`, opacity: p > 0 ? 1 : 0}}>
      <OreChip color={ORE.text} dot={gold}>
        {text}
      </OreChip>
    </div>
  );
};

// ================================================================ 6. biome banner

export const T6 = 164;
const PETALS = Array.from({length: 54}, (_, i) => {
  const r = mulberry32(900 + i);
  return {x: r() * 2100 - 100, y: r() * 1300 - 200, sp: 2 + r() * 3.2, dr: 1 + r() * 2.2, sz: 20 + Math.floor(r() * 3) * 12, ph: r() * 6.28, fr: Math.floor(r() * 12), rot: r() * 360, rs: (r() - 0.5) * 8};
});

const Petals: FC<{f: number; alpha?: number}> = ({f, alpha = 1}) => (
  <AbsoluteFill style={{opacity: alpha}}>
    {PETALS.map((p, i) => {
      const x = ((p.x + f * p.dr * 2 + Math.sin(f / 16 + p.ph) * 60) % 2100) - 100;
      const y = ((p.y + f * p.sp * 1.6) % 1300) - 200;
      return <Img key={i} src={tex(`particle/cherry_${(p.fr + Math.floor(f / 5)) % 12}.png`)} style={{position: 'absolute', left: x, top: y, width: p.sz, height: p.sz, imageRendering: 'pixelated', transform: `rotate(${p.rot + f * p.rs}deg)`, filter: 'drop-shadow(0 4px 0 rgba(120,30,70,0.35))'}} />;
    })}
  </AbsoluteFill>
);

const Wing: FC<{side: -1 | 1; k: number}> = ({side, k}) => (
  <div style={{position: 'absolute', top: 80, [side < 0 ? 'left' : 'right']: -88, width: 96, height: 200, transform: `scaleX(${k})`, transformOrigin: side < 0 ? '100% 50%' : '0 50%'}}>
    {[0, 1, 2, 3, 4].map((i) => {
      const w = 96 - i * 16;
      const h = 200 - i * 36;
      return <div key={i} style={{position: 'absolute', [side < 0 ? 'right' : 'left']: 0, top: (200 - h) / 2, width: w, height: h, background: i % 2 ? '#7a2a52' : gold, border: '4px solid #2a0a1c', boxSizing: 'border-box', boxShadow: i === 0 ? '0 8px 0 rgba(0,0,0,0.45)' : undefined, opacity: 1 - i * 0.12}} />;
    })}
    <div style={{position: 'absolute', [side < 0 ? 'left' : 'right']: 8, top: 84, width: 32, height: 32, background: '#ffe9f2', transform: 'rotate(45deg)', border: '4px solid #2a0a1c'}} />
  </div>
);

/** Props of BiomeBanner. Without `bg` it is transparent and sits on top of your footage. */
export type BiomeBannerProps = {
  /** true = demo cherry-grove world behind (default off). */
  bg?: boolean;
  /** Biome name, typed out character by character. */
  title?: string;
  /** Spaced English name under the title. */
  sub?: string;
  /** Small caption above the title. */
  tag?: string;
  /** Three climate chips: [text, dot colour]. */
  chips?: [string, string][];
  /** Reward text next to the XP bottle. */
  xp?: string;
  /** Discovery progress text from the percentage (25..75). */
  explored?: (percent: number) => string;
  /** Text on the ribbon below the banner. */
  ribbon?: string;
  /** Block id (vanilla block texture) shown in the icon slot. */
  icon?: string;
};

export const BiomeBanner: FC<BiomeBannerProps> = ({
  bg,
  title: biomeName = '樱花树林',
  sub = 'CHERRY GROVE',
  tag = '新群系 · NEW BIOME',
  chips = [
    ['温和 · 18°C', '#ffd23f'],
    ['降雨 · 0.8', '#7ab8ff'],
    ['粉红花瓣', '#ff9fc4'],
  ],
  xp: xpText = '+25 XP',
  explored = (p) => `探索度 ${p}%`,
  ribbon = '已发现 · 3 / 12 群系',
  icon = 'cherry_leaves',
}) => {
  const f = useCurrentFrame();
  const rollOut = prog(f, T6 - 26, 22, EASE.in);
  const line = prog(f, 4, 8, EASE.out);
  const open = prog(f, 12, 16, EASE.out) * (1 - rollOut);
  const bannerW = 1280;
  const x0 = 960 - bannerW / 2;
  const y0 = 130;
  const BH = 420;
  const content = (at: number) => prog(f, at, 12, EASE.out) * (1 - rollOut);
  const typed = Math.round([...biomeName].length * clamp01((f - 34) / 10));
  const title = [...biomeName].slice(0, typed).join('');
  const shine = clamp01((f - 48) / 26);
  const camZ = 1.03 + 0.05 * prog(f, 0, T6, (t) => t);
  const xp = EASE.out(clamp01((f - 56) / 30));
  const panel: CSSProperties = {...nine('panel_raised', [2, 2, 2, 2]), position: 'absolute', inset: 0, boxShadow: `0 ${3 * U}px 0 rgba(0,0,0,0.5)`};
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: bg ? '#000' : undefined}}>
      {bg && (
        <Cam zoom={camZ} fx={960} fy={800}>
          <OverworldCanvas tod={0.2} cherry frame ps={2} />
        </Cam>
      )}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(60,10,40,${0.5 * open}) 0%, rgba(60,10,40,0) 46%)`}} />
      <Vignette s={0.28 * open} color="40,0,30" />
      <Petals f={f} alpha={0.95} />
      <Twinkles x={960} y={290} radius={640} count={14} size={34} seed={19} />
      {/* opening line */}
      <div style={{position: 'absolute', left: 960 - 6, top: y0 + BH / 2 - (BH / 2) * line, width: 12, height: BH * line, background: '#fff', boxShadow: `0 0 40px 14px ${hexA('#ff9fc4', 0.9)}`, opacity: open > 0.7 ? 0 : 1}} />
      {/* banner */}
      <div style={{position: 'absolute', left: x0, top: y0, width: bannerW, height: BH, transform: `scaleX(${open})`, transformOrigin: '50% 50%', opacity: open > 0.02 ? 1 : 0}}>
        <Wing side={-1} k={content(18)} />
        <Wing side={1} k={content(18)} />
        <div style={panel} />
        <div style={{position: 'absolute', inset: 8, background: 'linear-gradient(180deg, rgba(255,159,196,0.30) 0%, rgba(120,30,70,0.30) 100%)'}} />
        {/* gold trim */}
        <div style={{position: 'absolute', left: 28, right: 28, top: 20, height: 6, background: gold}} />
        <div style={{position: 'absolute', left: 28, right: 28, bottom: 20, height: 6, background: gold}} />
        {[
          [20, 14],
          [bannerW - 44, 14],
          [20, BH - 36],
          [bannerW - 44, BH - 36],
        ].map(([cx, cy], i) => (
          <div key={i} style={{position: 'absolute', left: cx, top: cy, width: 24, height: 24, background: '#ff9fc4', border: `4px solid ${gold}`, transform: 'rotate(45deg)', boxSizing: 'border-box'}} />
        ))}
        {/* shine */}
        <div style={{position: 'absolute', inset: 8, overflow: 'hidden', pointerEvents: 'none'}}>
          <div style={{position: 'absolute', top: -20, bottom: -20, left: -300 + shine * (bannerW + 600), width: 140, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0))', transform: 'skewX(-20deg)'}} />
        </div>
        {/* icon */}
        <div style={{position: 'absolute', left: 60, top: 126, width: 168, height: 168, opacity: content(20), transform: `scale(${0.6 + 0.4 * content(20)}) rotate(${(1 - content(20)) * -40}deg)`}}>
          <div style={{...nine('slot', [2, 2, 2, 2]), width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={blockUrl(icon)} style={{width: 112, height: 112, imageRendering: 'pixelated', filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.4))'}} />
          </div>
        </div>
        {/* title block */}
        <div style={{position: 'absolute', left: 268, top: 42}}>
          <OreText size={TYPE.small} color="#ffd0e2" style={{opacity: content(26), letterSpacing: 8}}>
            {tag}
          </OreText>
        </div>
        <div style={{position: 'absolute', left: 264, top: 84, transform: `scale(${1 + 0.06 * Math.max(0, 1 - (f - 34) / 10)})`, transformOrigin: '0 50%'}}>
          <BandTitle size={144} tone="pink" ink={false}>
            {title || ' '}
          </BandTitle>
        </div>
        <div style={{position: 'absolute', left: 270, top: 262, opacity: content(40)}}>
          <OreText size={TYPE.body * 0.75} color="#ffe4ee" style={{letterSpacing: 8, textShadow: '3px 3px 0 #4a1030'}}>
            {sub}
          </OreText>
        </div>
        {/* climate chips */}
        <div style={{position: 'absolute', left: 268, top: 320, display: 'flex', gap: 12}}>
          {chips.map(([t, c], i) => {
            const k = content(34 + i * 4);
            return (
              <div key={t} style={{transform: `translateY(${(1 - k) * 24}px)`, opacity: k}}>
                <OreChip color={ORE.text} dot={c}>
                  {t}
                </OreChip>
              </div>
            );
          })}
        </div>
        {/* discovery panel on the right */}
        <div style={{position: 'absolute', right: 56, top: 124, width: 296, height: 172, opacity: content(44), transform: `translateX(${(1 - content(44)) * 50}px)`}}>
          <div style={{...nine('panel_glass', [2, 2, 2, 2]), position: 'absolute', inset: 0}} />
          <div style={{position: 'absolute', left: 28, top: 16, display: 'flex', alignItems: 'center', gap: 14}}>
            <Img src={item('experience_bottle')} style={{width: 56, height: 56, imageRendering: 'pixelated'}} />
            <OreText size={TYPE.body} color="#ffe27a" shadow>
              {xpText}
            </OreText>
          </div>
          <div style={{position: 'absolute', left: 28, top: 88}}>
            <OreProgress value={0.25 + 0.5 * xp} width={240} color="gold" />
          </div>
          <div style={{position: 'absolute', left: 28, top: 124}}>
            <OreText size={TYPE.small} color={ORE.dim}>
              {explored(Math.round(25 + 50 * xp))}
            </OreText>
          </div>
        </div>
      </div>
      {/* ribbon below */}
      <div style={{position: 'absolute', left: 960 - 260, top: y0 + BH + 8, width: 520, height: 72, transform: `translateY(${(1 - content(54)) * -60}px) scaleY(${content(54)})`, transformOrigin: '50% 0', opacity: content(54)}}>
        <div style={{position: 'absolute', inset: 0, background: '#c42b66', border: '6px solid #2a0a1c', boxShadow: `inset 0 6px 0 #ff7aa8, 0 8px 0 rgba(0,0,0,0.45)`}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
          <Img src={item('name_tag')} style={{width: 40, height: 40, imageRendering: 'pixelated'}} />
          <OreText size={TYPE.small} color="#fff" style={{letterSpacing: 6, marginRight: -6}}>
            {ribbon}
          </OreText>
        </div>
      </div>
      <Sequence from={30} durationInFrames={40}>
        <PixelBurst x={960} y={y0 + 180} at={0} count={44} colors={['#ffb3d1', '#ffffff', '#ffd23f', '#ff7aa8']} speed={30} life={34} size={12} gravity={0.2} seed={44} />
      </Sequence>
      <Flash at={13} life={8} color="#ffe4ee" peak={0.5} />
      <Sfx at={12} src={mcSound('ui/toast/in')} volume={0.45} />
      <Sfx at={20} src={mcSound('ui/loom/take_result1')} volume={0.3} />
      {[34, 36, 38, 40].map((a, i) => (
        <Sfx key={a} at={a} src={mcSound('random/click')} volume={0.22} rate={1.2 + i * 0.1} />
      ))}
      <Sfx at={56} src={mcSound('random/orb')} volume={0.35} rate={1.2} />
      <Sfx at={T6 - 26} src={mcSound('ui/toast/out')} volume={0.4} />
      <Letterbox k={0} size={0} />
    </AbsoluteFill>
  );
};

export const locEntries: FxEntry[] = [
  {
    meta: {
      id: 'loc-title-card',
      name: '进入新地点标题卡',
      category: 'map',
      tags: ['地点', '标题', '坐标', '暗角'],
      frames: T5,
      blurb: '画面上下降下砖纹装饰条与暗角，“下界要塞”大标题从两侧高速挤入、在中间撞出光效和冲击波，之后依次出现副标题、小图标、指南针和数字滚动的 X/Y/Z 坐标。',
      usage: '到达新地点、要塞、村庄、地标时的大字标题；可叠在任何实拍上。',
      params: [
        {name: 'bg', desc: 'true 为带下界背景的完整演示；省略则输出透明叠加层'},
        {name: 'left / right', desc: '标题左右两半的文字，默认“下界”“要塞”'},
        {name: 'sub', desc: '副标题，默认 NETHER FORTRESS'},
        {name: 'coords', desc: '[x, y, z] 坐标，数字会滚动到该值'},
        {name: 'tone', desc: '标题配色：stone / nether / end / grass / gold / ice / pink'},
      ],
    },
    Demo: () => <LocTitleCard bg />,
    Layer: () => <LocTitleCard />,
  },
  {
    meta: {
      id: 'loc-biome-banner',
      name: '群系横幅（华丽版）',
      category: 'map',
      tags: ['群系', '横幅', 'Ore', '樱花'],
      frames: T6,
      blurb: '一道亮线从中心展开成带金边、两翼和菱形铆钉的 Ore 横幅，逐字打出“樱花树林”，附气候标签、经验条和已发现群系数，花瓣不断飘落。',
      usage: '进入新群系、新区域时的提示条，比游戏原版的小字更华丽。',
      params: [
        {name: 'bg', desc: 'true 为带樱花林背景的完整演示；省略则输出透明叠加层'},
        {name: '文字', desc: '标题、英文名、标签、XP 都在组件内直接改'},
      ],
    },
    Demo: () => <BiomeBanner bg />,
    Layer: () => <BiomeBanner />,
  },
];

