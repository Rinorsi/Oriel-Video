// Kit components. Import everything through ./kit (see the usage notes at the top of that file).
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {item as itemTex, tex} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Crop} from '../../mob';
import {PxArt, EMERALD_PAL, EMERALD_ROWS, LOCK_ROWS, SKULL_ROWS, SOUL_ROWS} from './sprites';
import {chamferPts, diamondPts, hexPts, insetPoly, ptsStr, type Pt} from './geom';
import {PxText, SHADOW, useTextSize, type McdTextOpts} from './pxtext';

export * from './pxtext';
export * from './sprites';
export * from './geom';

// ------------------------------------------------------------------ palette

export const MCD = {
  // surfaces
  void: '#06080C', // pop-ups / title cards
  panel: '#1C1C20',
  panelDeep: '#181820',
  slot: '#131316',
  slotLine: '#1F2022',
  bevelHi: '#B9B6B1',
  bevelMid: '#535653',
  plate: '#282828',
  plateHi: '#303030',
  plateEdge: '#181818',
  teleport: '#1C2028',
  hero: '#18242C',
  invBg: '#201010', // inventory background glow
  invBg2: '#281818',
  invDeep: '#100808',
  resultsBg: '#0C1420',
  trailer: '#060307',
  statCard: '#212B37', // results stat card
  statEdge: '#303038',
  parchment: '#E8D8C0',
  parchmentShade: '#D8C8B4',
  scroll: '#F0DDC0',
  // accents
  gold: '#F8D868',
  goldBright: '#FCD448',
  goldSel: '#FECC06',
  goldDark: '#886830',
  title: '#FEC304', // trailer title gold
  victory: '#FCE386',
  red: '#AF2232', // health
  redDark: '#991C2B',
  vignette: '#A8424C', // death vignette
  apoc: '#F80000',
  purple: '#AB64FF', // xp / enchant / magic
  purpleHi: '#B469FF',
  enchText: '#A040D8',
  enchDark: '#502068',
  enchMid: '#682888',
  powerful: '#E8409C',
  soul: '#48C8D8',
  soulDark: '#307078',
  emerald: '#58D038',
  emeraldMid: '#30A818',
  emeraldDark: '#287018',
  dodge: '#58A0D4',
  ap: '#F05A28',
  beam: '#CD2ECD', // chest beam
  // buttons
  btn: '#3F8E4F',
  btnHi: '#60CF73',
  btnLo: '#23582E',
  danger: '#EE2F58',
  // text
  white: '#FFFFFF',
  gray: '#ACACAC',
  grayDim: '#7B797B',
  shadow: SHADOW,
  // rarity
  common: '#D8D8D8',
  commonTag: '#606060',
  rare: '#3CA886',
  unique: '#F85600',
  uniqueDiamond: '#FF9400',
  gilded: '#F0C858',
  // keycaps
  keyA: '#43EC60',
  keyB: '#FF2A43',
  keyX: '#0099DC',
  keyY: '#FFD91E',
} as const;

export const BODY_FONT = '"Noto Sans","Noto Sans SC","Microsoft YaHei UI","Segoe UI",system-ui,sans-serif';

/** Presets for <McdTitle>. */
export const TITLE_WHITE: McdTextOpts = {color: '#FFFFFF'};
export const TITLE_GOLD: McdTextOpts = {color: MCD.title, hi: '#FFE680', shadowColor: '#2A1600'};
export const TITLE_VICTORY: McdTextOpts = {color: MCD.victory, hi: '#FFF4C0', shadowColor: '#2A1600'};
export const TITLE_SMALL_GOLD: McdTextOpts = {color: MCD.goldBright, shadowColor: '#2A1600'};

/** Display title: PxText with the Dungeons defaults (caps, 2px strokes, hard shadow, exact centring). */
export const McdTitle: FC<{text: string | number} & McdTextOpts> = (p) => <PxText {...p} />;

/** Body copy: Noto Sans with a 1px hard shadow (no blur). */
export const McdText: FC<{children: ReactNode; size?: number; weight?: number; color?: string; style?: CSSProperties}> = ({children, size = 28, weight = 400, color = '#fff', style}) => (
  <span style={{fontFamily: BODY_FONT, fontSize: size, fontWeight: weight, color, lineHeight: 1.3, textShadow: `${Math.max(1, Math.round(size / 24))}px ${Math.max(1, Math.round(size / 24))}px 0 rgba(5,2,2,0.85)`, ...style}}>{children}</span>
);

// ------------------------------------------------------------------ small helpers

/** Stepped easing: p in 0..1 quantised to `steps` levels (the game animates in hard steps, not smooth). */
export const stepFade = (frame: number, from: number, to: number, steps = 4) => {
  const t = clamp01((frame - from) / Math.max(1, to - from));
  return Math.round(t * steps) / steps;
};

// ------------------------------------------------------------------ key caps

/** Controller/keyboard key cap: dark chamfered square with a coloured letter. `wide` gives the LB/RB/RT shape with a notched corner. */
export const KeyCap: FC<{label: string; size?: number; color?: string; wide?: boolean; style?: CSSProperties}> = ({label, size = 36, color = '#fff', wide, style}) => {
  const p = Math.max(2, Math.round(size / 18));
  const ts = useTextSize(label, {px: p, gap: 1, bold: 1});
  const w = Math.max(wide ? Math.round(size * 1.35) : size, ts ? ts.w + p * 8 : 0);
  const h = size;
  const c = Math.round(size * 0.2);
  const o = Math.max(2, Math.round(size / 14));
  const outer = chamferPts(w, h, wide ? [c * 2, c, c, c] : [c, c, c, c]);
  const inner = insetPoly(outer, o);
  return (
    <div style={{position: 'relative', width: w, height: h, flex: 'none', ...style}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <polygon points={ptsStr(outer)} fill="#000" />
        <polygon points={ptsStr(inner)} fill="#3E3E42" />
        <rect x={o} y={o} width={w - o * 2} height={Math.max(2, o)} fill="#5A5A60" clipPath="none" />
        <rect x={o} y={h - o - Math.max(2, o)} width={w - o * 2} height={Math.max(2, o)} fill="#2A2A2E" />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <PxText text={label} px={p} color={color} shadow={0} bold={1} gap={1} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ bevel slot

export type Rarity = 'plain' | 'common' | 'rare' | 'unique' | 'gilded';

const RING: Record<Rarity, {hi: string; mid: string; line: string}> = {
  plain: {hi: MCD.bevelHi, mid: MCD.bevelMid, line: MCD.slotLine},
  common: {hi: '#C9C6C0', mid: '#6B6D6A', line: MCD.slotLine},
  rare: {hi: '#5AD2A4', mid: '#2A7E62', line: '#0E2A22'},
  unique: {hi: '#F8C468', mid: '#B8681C', line: '#2A1608'},
  gilded: {hi: '#FFF2A8', mid: '#C8861C', line: '#4A3008'},
};

/** Item slot: black outline, light-top/left + mid-bottom/right hard bevel, dark inner line, #131316 well, faint inner frame. */
export const BevelSlot: FC<{
  size?: number;
  rarity?: Rarity;
  selected?: boolean;
  isNew?: boolean;
  /** Empty inventory cell: darker well with diagonal cross lines instead of a bevel. */
  empty?: boolean;
  /** White "+" for an empty equip slot. */
  plus?: boolean;
  keycap?: ReactNode;
  /** Bottom-right number (item level / count). */
  count?: ReactNode;
  /** Draw the hard drop block under the slot (HUD style). */
  drop?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({size = 96, rarity = 'plain', selected, isNew, empty, plus, keycap, count, drop = false, children, style}) => {
  const u = Math.max(2, Math.round(size / 32));
  const r = RING[rarity];
  const gilded = rarity === 'gilded';
  const well = gilded ? '#F0C858' : empty ? '#0D090C' : MCD.slot;
  const frame = gilded ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.13)';
  const corner = u * 4;
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', boxShadow: [drop ? `0 ${u * 2}px 0 0 #0A0A0B` : '', selected ? `0 0 0 ${u}px #000, 0 0 0 ${u * 4}px #fff` : ''].filter(Boolean).join(',') || undefined, ...style}}>
      <div style={{position: 'absolute', inset: 0, background: empty ? '#241A1D' : '#000', padding: empty ? u : u}}>
        <div style={{width: '100%', height: '100%', boxSizing: 'border-box', borderStyle: 'solid', borderWidth: empty ? 0 : u * 2, borderColor: `${r.hi} ${r.mid} ${r.mid} ${r.hi}`, background: r.line}}>
          <div style={{position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', border: `${empty ? 0 : u}px solid ${r.line}`, background: well, overflow: 'hidden'}}>
            {!empty && (
              <>
                <div style={{position: 'absolute', inset: u * 2, border: `${Math.max(1, Math.round(u / 2))}px solid ${frame}`}} />
                {[
                  [0, 0],
                  [1, 0],
                  [0, 1],
                  [1, 1],
                ].map(([cx, cy], i) => (
                  <div key={i} style={{position: 'absolute', [cx ? 'right' : 'left']: u * 2 - 1, [cy ? 'bottom' : 'top']: u * 2 - 1, width: corner, height: corner, background: well}}>
                    <div style={{position: 'absolute', [cx ? 'right' : 'left']: 1, [cy ? 'bottom' : 'top']: 1, width: u * 2.4, height: u * 2.4, boxSizing: 'border-box', border: `${Math.max(1, Math.round(u / 2))}px solid ${frame}`}} />
                  </div>
                ))}
              </>
            )}
            {empty && (
              <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}} preserveAspectRatio="none" viewBox="0 0 100 100" shapeRendering="crispEdges">
                <line x1="2" y1="2" x2="98" y2="98" stroke="#33262A" strokeWidth="1.1" strokeDasharray="2 1.2" vectorEffect="non-scaling-stroke" />
                <line x1="98" y1="2" x2="2" y2="98" stroke="#33262A" strokeWidth="1.1" strokeDasharray="2 1.2" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            {plus && (
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{position: 'relative', width: size * 0.3, height: size * 0.3}}>
                  <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: u * 1.5, marginTop: -u * 0.75, background: '#fff'}} />
                  <div style={{position: 'absolute', top: 0, bottom: 0, left: '50%', width: u * 1.5, marginLeft: -u * 0.75, background: '#fff'}} />
                </div>
              </div>
            )}
            {children && <div style={{position: 'absolute', inset: '12%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>}
          </div>
        </div>
      </div>
      {isNew && (
        <div style={{position: 'absolute', right: u, top: u, width: u * 6, height: u * 6, clipPath: 'polygon(0 0,100% 0,100% 100%)', background: '#FFE000'}}>
          <div style={{position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', clipPath: 'polygon(100% 0,100% 100%,62% 100%,100% 38%)', background: '#FFAA00'}} />
        </div>
      )}
      {count !== undefined && (
        <div style={{position: 'absolute', right: u * 3, bottom: u * 2.5, display: 'flex', alignItems: 'center', gap: u}}>
          <PxText text={String(count)} px={Math.max(2, Math.round(size / 40))} gap={1} bold={1} />
        </div>
      )}
      {keycap && <div style={{position: 'absolute', right: -u * 3, bottom: -u * 3}}>{keycap}</div>}
    </div>
  );
};

// ------------------------------------------------------------------ hex badges

/** Layered pointy-top hexagon: black outline, ring (lighter top half), dark inner. Children are centred. */
export const HexBadge: FC<{
  w: number;
  h?: number;
  ring?: string;
  ringHi?: string;
  fill?: string;
  outline?: string;
  ringW?: number;
  outlineW?: number;
  glow?: string;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({w, h = (w * 2) / Math.sqrt(3), ring = '#4A4A50', ringHi, fill = '#101014', outline = '#000', ringW = Math.max(3, w * 0.07), outlineW = Math.max(2, w * 0.035), glow, children, style}) => {
  const out = hexPts(w, h);
  const rg = insetPoly(out, outlineW);
  const inn = insetPoly(out, outlineW + ringW);
  const id = `hb${Math.round(w)}${ring.replace('#', '')}`;
  return (
    <div style={{position: 'relative', width: w, height: h, flex: 'none', filter: glow ? `drop-shadow(0 0 ${w * 0.1}px ${glow})` : undefined, ...style}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id={id}>
            <rect x={-2} y={-2} width={w + 4} height={h * 0.5 + 2} />
          </clipPath>
        </defs>
        <polygon points={ptsStr(out)} fill={outline} />
        <polygon points={ptsStr(rg)} fill={ring} />
        {ringHi && <polygon points={ptsStr(rg)} fill={ringHi} clipPath={`url(#${id})`} />}
        <polygon points={ptsStr(inn)} fill={fill} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
    </div>
  );
};

/** LEVEL n hexagon: spiral glyph, small LEVEL caption, big number. `accent` purple outlines the ring like the results page. */
export const LevelBadge: FC<{level: number | string; w?: number; accent?: 'gray' | 'purple'; style?: CSSProperties}> = ({level, w = 112, accent = 'gray', style}) => {
  const p = Math.max(2, Math.round(w / 28));
  return (
    <HexBadge w={w} ring={accent === 'purple' ? '#7E3FC8' : '#3A3A42'} ringHi={accent === 'purple' ? MCD.purple : '#55555E'} fill="#0C0C10" style={style}>
      <PxArt rows={SOUL_ROWS} pal={{o: MCD.enchText}} px={Math.max(1, Math.round(w / 56))} style={{marginBottom: p}} />
      <McdText size={Math.round(w * 0.12)} weight={700} color="#fff" style={{lineHeight: 1, letterSpacing: 1}}>LEVEL</McdText>
      <div style={{marginTop: p}}>
        <PxText text={level} px={Math.max(2, Math.round(w / 24))} gap={1} />
      </div>
    </HexBadge>
  );
};

/** Metal hexagon with the white diamond-chevron power glyph; label + number to its right. */
export const PowerBadge: FC<{power: number | string; w?: number; label?: boolean; style?: CSSProperties}> = ({power, w = 80, label = true, style}) => {
  const p = Math.max(2, Math.round(w / 26));
  const g = w * 0.42;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: w * 0.16, ...style}}>
      <HexBadge w={w} ring="#7D7A76" ringHi="#B9B6B1" fill="#18181C" ringW={Math.max(3, w * 0.06)}>
        <svg width={g} height={g} viewBox="0 0 20 20" shapeRendering="crispEdges">
          <polygon points="10,1 19,10 10,19 1,10" fill="#CFCCC8" />
          <polygon points="10,5 15,10 10,15 5,10" fill="#18181C" />
          <polygon points="10,8 12,10 10,12 8,10" fill="#CFCCC8" />
        </svg>
      </HexBadge>
      {label && (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: p}}>
          <McdText size={Math.round(w * 0.2)} weight={700} color="#E4E4E4" style={{lineHeight: 1, letterSpacing: 1}}>POWER</McdText>
          <PxText text={power} px={p} gap={1} />
        </div>
      )}
    </div>
  );
};

/** Gold hexagon map/mission node with the black pixel skull. `selected` = big white-ringed node with the bookmark tail and numeral. */
export const SkullBadge: FC<{size?: number; selected?: boolean; numeral?: string; locked?: boolean; empty?: boolean; style?: CSSProperties}> = ({size = 80, selected, numeral, locked, empty, style}) => {
  const w = size;
  const h = (w * 2) / Math.sqrt(3);
  const o = Math.max(3, w * 0.06);
  const out = hexPts(w, h);
  const gold = insetPoly(out, o);
  const rim = insetPoly(out, o * 2.2);
  const tailH = h * 0.5;
  const tail: Pt[] = [
    [w * 0.16, h * 0.78],
    [w * 0.84, h * 0.78],
    [w * 0.84, h * 1.38],
    [w * 0.5, h * 1.24],
    [w * 0.16, h * 1.38],
  ];
  const tailIn = insetPoly(tail, o * 0.9);
  const ring = selected ? insetPoly(out, -o * 1.1) : null;
  const sp = Math.max(2, Math.round(w / 22));
  return (
    <div style={{position: 'relative', width: w, height: selected ? h * 1.38 : h, flex: 'none', ...style}}>
      <svg width={w} height={h + tailH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`sk${Math.round(w)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCE693" />
            <stop offset="1" stopColor="#E89A22" />
          </linearGradient>
        </defs>
        {selected && (
          <>
            <polygon points={ptsStr(tail)} fill="#000" />
            <polygon points={ptsStr(tailIn)} fill="#F2B83A" />
          </>
        )}
        {ring && <polygon points={ptsStr(ring)} fill="#fff" />}
        <polygon points={ptsStr(out)} fill="#000" />
        <polygon points={ptsStr(gold)} fill={empty ? '#101014' : `url(#sk${Math.round(w)})`} stroke={empty ? MCD.gold : 'none'} strokeWidth={o * 0.8} />
        {!empty && <polygon points={ptsStr(rim)} fill="none" stroke="#C07A1C" strokeWidth={Math.max(1, o * 0.35)} opacity={0.7} />}
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {locked ? <PxArt rows={LOCK_ROWS} pal={{k: '#fff'}} px={sp} /> : !empty ? <PxArt rows={SKULL_ROWS} pal={{k: '#0A0806'}} px={sp} /> : <HexGlyph w={w * 0.34} />}
      </div>
      {selected && numeral && (
        <div style={{position: 'absolute', left: 0, width: w, top: h * 1.05, height: h * 0.22, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <PxText text={numeral} px={Math.max(2, Math.round(w / 34))} gap={1} bold={1} color="#3A2200" shadow={0} />
        </div>
      )}
    </div>
  );
};

const HexGlyph: FC<{w: number}> = ({w}) => {
  const h = (w * 2) / Math.sqrt(3);
  const o = hexPts(w, h);
  return (
    <svg width={w} height={h}>
      <polygon points={ptsStr(insetPoly(o, 1))} fill="none" stroke={MCD.gold} strokeWidth={Math.max(2, w * 0.14)} />
    </svg>
  );
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Seven-node difficulty ladder (I..VII) with the green-to-orange track, EASY/HARD ends and the big selected node. */
export const DifficultyBar: FC<{level?: number; locked?: number; w?: number; nodeW?: number; reveal?: number; style?: CSSProperties}> = ({level = 4, locked = 0, w = 900, nodeW = 52, reveal = 1, style}) => {
  const M = 150;
  const inner = w - M * 2;
  const nodes = Array.from({length: 7}, (_, i) => ({i, x: M + (inner / 6) * i}));
  const trackH = Math.max(8, nodeW * 0.26);
  const nh = (nodeW * 2) / Math.sqrt(3);
  const totalH = nh * 2.1 + 40;
  const cy = nh * 0.5 + 12;
  return (
    <div style={{position: 'relative', width: w, height: totalH, ...style}}>
      <div style={{position: 'absolute', left: M, width: inner * reveal, top: cy - trackH / 2, height: trackH, background: 'linear-gradient(90deg,#90E49C,#6CCB78 35%,#C9A850 70%,#F08A30)', boxShadow: '0 0 0 2px #000', overflow: 'hidden'}} />
      <div style={{position: 'absolute', left: M, width: Math.max(0, (nodes[Math.max(0, locked) - 1]?.x ?? M) - M) || 0, top: cy - trackH / 2, height: trackH, background: '#000', display: locked > 0 ? 'block' : 'none'}} />
      <div style={{position: 'absolute', left: 0, top: cy - 12, width: M - nodeW, display: 'flex', justifyContent: 'flex-end', opacity: reveal > 0.05 ? 1 : 0}}>
        <McdText size={22} weight={700} color="#DADADA">EASY</McdText>
      </div>
      <div style={{position: 'absolute', right: 0, top: cy - 12, width: M - nodeW, display: 'flex', justifyContent: 'flex-start', opacity: reveal > 0.9 ? 1 : 0}}>
        <McdText size={22} weight={700} color="#DADADA">HARD</McdText>
      </div>
      {nodes.map(({i, x}) => {
        const sel = i + 1 === level;
        const lock = i + 1 <= locked;
        const vis = clamp01(reveal * 7 - i);
        return (
          <div key={i} style={{position: 'absolute', left: x - (sel ? nodeW * 0.75 : nodeW / 2), top: sel ? cy - nh * 0.75 : cy - nh / 2, opacity: vis > 0 ? 1 : 0, transform: `scale(${EASE.back(vis)})`, transformOrigin: '50% 50%'}}>
            {sel ? (
              <SkullBadge size={nodeW * 1.5} selected numeral={ROMAN[i]} />
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                <HexBadge w={nodeW} ring={lock ? '#fff' : MCD.gold} fill="#08080A" ringW={Math.max(3, nodeW * 0.09)} outlineW={Math.max(2, nodeW * 0.05)}>
                  {lock ? <PxArt rows={LOCK_ROWS} pal={{k: '#fff'}} px={Math.max(2, Math.round(nodeW / 16))} /> : <HexGlyph w={nodeW * 0.36} />}
                </HexBadge>
                <PxText text={ROMAN[i]} px={2} gap={1} bold={1} color="#9A9AA2" shadow={0} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ diamond frames

export type DiamondTier = 'gilded' | 'unique' | 'rare' | 'common' | 'enchant' | 'empty';

const BANDS: Record<DiamondTier, {bands: [string, string, number][]; fill: string}> = {
  gilded: {
    bands: [
      ['#000000', '#000000', 0.5],
      ['#FFF6D0', '#FFFFFF', 0.8],
      ['#FFD34E', '#FFE98A', 1.7],
      ['#E8901A', '#F8B83A', 1.2],
      ['#FFF0B0', '#FFF8D8', 0.6],
      ['#4A2E08', '#4A2E08', 0.6],
    ],
    fill: '#17130F',
  },
  unique: {
    bands: [
      ['#000000', '#000000', 0.5],
      ['#E87E10', '#FFB040', 1.9],
      ['#8A3A08', '#C25C14', 1.1],
      ['#1A0E06', '#1A0E06', 0.5],
    ],
    fill: '#15100C',
  },
  rare: {
    bands: [
      ['#000000', '#000000', 0.5],
      ['#2FB08A', '#5EE0B4', 1.9],
      ['#14604A', '#228468', 1.1],
      ['#06201A', '#06201A', 0.5],
    ],
    fill: '#0C1412',
  },
  common: {
    bands: [
      ['#000000', '#000000', 0.5],
      ['#A8A5A0', '#DAD6D0', 1.9],
      ['#4A4D4A', '#656865', 1.1],
      ['#101010', '#101010', 0.5],
    ],
    fill: '#131316',
  },
  enchant: {
    bands: [
      ['#000000', '#000000', 0.5],
      ['#A872E8', '#E2C0FF', 1.9],
      ['#5A2A8C', '#7C3CB4', 1.2],
      ['#1A0A28', '#1A0A28', 0.5],
    ],
    fill: '#1C0E2A',
  },
  empty: {
    bands: [
      ['#000000', '#000000', 0.5],
      ['#7C7C82', '#B2B2B8', 1.9],
      ['#3E3E44', '#58585E', 1.2],
      ['#101012', '#101012', 0.5],
    ],
    fill: '#24242A',
  },
};

/** Small diamond tag (roman numeral) hung on the top-right of a diamond frame. */
export const DiamondTag: FC<{text: string; size?: number; color?: string; style?: CSSProperties}> = ({text, size = 48, color = MCD.purple, style}) => {
  const r = size / 2;
  const d = diamondPts(r);
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', ...style}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0}}>
        <polygon points={ptsStr(d)} fill="#000" />
        <polygon points={ptsStr(insetPoly(d, size * 0.06))} fill={color} />
        <polygon points={ptsStr(insetPoly(d, size * 0.14))} fill="#5A2A8C" />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <PxText text={text} px={Math.max(2, Math.round(size / 22))} gap={1} bold={1} shadow={0} />
      </div>
    </div>
  );
};

/** Diamond (45-degree square) frame in five rarity/enchant tiers. `size` is the full diagonal. */
export const DiamondFrame: FC<{
  size?: number;
  tier?: DiamondTier;
  glow?: string;
  selected?: boolean;
  badge?: string;
  /** Rotate the content 45 degrees (enchant pixel icons are diamonds themselves). */
  rotateContent?: boolean;
  /** Clip the children to the inner diamond and bottom-align them (portraits that run off the frame). */
  clip?: boolean | 'bottom';
  children?: ReactNode;
  style?: CSSProperties;
}> = ({size = 200, tier = 'gilded', glow, selected, badge, rotateContent, clip, children, style}) => {
  const r = size / 2;
  const u = size / 44;
  const spec = BANDS[tier];
  const base = diamondPts(r);
  let off = 0;
  const layers = spec.bands.map(([c, hi, t]) => {
    const poly = insetPoly(base, off);
    off += t * u;
    return {poly, c, hi};
  });
  const innerPoly = insetPoly(base, off);
  const clipId = `dm${Math.round(size)}${tier}`;
  const sel = selected ? insetPoly(base, -u * 1.6) : null;
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', filter: glow ? `drop-shadow(0 0 ${size * 0.09}px ${glow})` : undefined, ...style}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id={clipId}>
            <rect x={-2} y={-2} width={size + 4} height={r + 2} />
          </clipPath>
        </defs>
        {sel && <polygon points={ptsStr(sel)} fill="#fff" />}
        {layers.map((l, i) => (
          <g key={i}>
            <polygon points={ptsStr(l.poly)} fill={l.c} />
            {l.hi !== l.c && <polygon points={ptsStr(l.poly)} fill={l.hi} clipPath={`url(#${clipId})`} />}
          </g>
        ))}
        <polygon points={ptsStr(innerPoly)} fill={spec.fill} />
        {tier === 'empty' && <polygon points={ptsStr(insetPoly(innerPoly, u * 4))} fill="none" stroke="#55555C" strokeWidth={u * 0.8} />}
        {tier === 'empty' && <polygon points={ptsStr(insetPoly(innerPoly, u * 8))} fill="#2E2E34" />}
      </svg>
      {children && clip && (
        <div style={{position: 'absolute', inset: 0, clipPath: `polygon(${(clip === 'bottom' ? (() => {
          const q = insetPoly(base, off);
          return [[-size, -size] as Pt, [size * 2, -size] as Pt, [size * 2, q[1][1]] as Pt, q[1], q[2], q[3], [-size, q[3][1]] as Pt];
        })() : insetPoly(base, off)).map(([x, y]) => `${x}px ${y}px`).join(',')})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>{children}</div>
      )}
      {children && !clip && (
        <div style={{position: 'absolute', left: r - r * 0.62, top: r - r * 0.62, width: r * 1.24, height: r * 1.24, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: rotateContent ? 'rotate(45deg)' : undefined}}>{children}</div>
      )}
      {badge && <DiamondTag text={badge} size={size * 0.28} style={{position: 'absolute', right: -size * 0.02, top: -size * 0.02}} />}
    </div>
  );
};

/** Enchant slot: gray metal diamond when empty, purple lit diamond with a rotated pixel icon when `lit`. */
export const EnchantSlot: FC<{size?: number; lit?: boolean; icon?: ReactNode; tier?: string; selected?: boolean; glow?: boolean; style?: CSSProperties}> = ({size = 200, lit, icon, tier, selected, glow = true, style}) => (
  <DiamondFrame size={size} tier={lit ? 'enchant' : 'empty'} glow={lit && glow ? 'rgba(171,100,255,0.85)' : undefined} badge={lit ? tier : undefined} rotateContent selected={selected} style={style}>
    {lit && icon}
  </DiamondFrame>
);

// ------------------------------------------------------------------ buttons

type Tone = 'green' | 'red' | 'ghost' | 'disabled' | 'gold';
const TONES: Record<Tone, {hi: string; body: string; lo: string; text: string}> = {
  green: {hi: '#60CF73', body: '#3F8E4F', lo: '#23582E', text: '#fff'},
  red: {hi: '#FF6A8A', body: '#EE2F58', lo: '#A31837', text: '#fff'},
  gold: {hi: '#FFE680', body: '#E8A81C', lo: '#8A5A08', text: '#fff'},
  ghost: {hi: '#000', body: '#08080A', lo: '#000', text: '#fff'},
  disabled: {hi: '#2A2A2E', body: '#1C1C20', lo: '#141416', text: '#6E6E74'},
};

/** Three-band bevel button. `press` 0..1 sinks the face (top band shrinks, label drops); `hold` 0..1 fills a lighter bar left to right. */
export const MainButton: FC<{
  label: string;
  w?: number;
  h?: number;
  tone?: Tone;
  press?: number;
  hold?: number;
  hover?: number;
  keycap?: string;
  textPx?: number;
  style?: CSSProperties;
}> = ({label, w = 420, h = 96, tone = 'green', press = 0, hold = 0, hover = 0, keycap, textPx, style}) => {
  const t = TONES[tone];
  const band = Math.max(4, Math.round(h / 20));
  const top = Math.round(band * (1 - 0.75 * press));
  const bot = Math.round(band * (1 - 0.5 * press));
  const px = textPx ?? Math.max(2, Math.round(h / 24));
  const ghost = tone === 'ghost';
  const dis = tone === 'disabled';
  const border = ghost ? Math.max(3, Math.round(h / 28)) : 0;
  return (
    <div style={{position: 'relative', width: w, height: h, flex: 'none', ...style}}>
      {!ghost && !dis && <div style={{position: 'absolute', left: 0, right: 0, top: band, bottom: -band, background: 'rgba(0,0,0,0.42)'}} />}
      <div style={{position: 'absolute', inset: 0, background: t.lo, boxSizing: 'border-box', border: ghost ? `${border}px solid #fff` : dis ? `${Math.max(3, h / 28)}px solid #4A4A50` : 'none'}}>
        {!ghost && !dis && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: top, background: t.hi}} />}
        {!ghost && !dis && <div style={{position: 'absolute', left: 0, right: 0, top: top, bottom: bot, background: t.body}} />}
        {(ghost || dis) && <div style={{position: 'absolute', inset: 0, background: t.body}} />}
        {hold > 0 && <div style={{position: 'absolute', left: 0, top, bottom: bot, width: `${hold * 100}%`, background: 'rgba(255,255,255,0.26)', borderRight: hold < 1 ? `${band / 2}px solid rgba(255,255,255,0.6)` : 'none'}} />}
        {hover > 0 && <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 ${Math.max(2, band / 2)}px rgba(255,255,255,${0.55 * hover})`}} />}
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: h * 0.18, transform: `translateY(${press * band * 0.7}px)`}}>
          <PxText text={label} px={px} color={t.text} gap={2} shadow={dis ? 0 : 1} />
          {keycap && <KeyCap label={keycap} size={Math.round(h * 0.42)} wide={keycap.length > 1} />}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ panels

/** Results-page stat card: gray 3px frame, dark navy well, grey caption and a big pixel value. */
export const StatCard: FC<{label: string; value: string | number; w?: number; h?: number; reveal?: number; style?: CSSProperties}> = ({label, value, w = 380, h = 150, reveal = 1, style}) => {
  const b = 4;
  return (
    <div style={{position: 'relative', width: w, height: h, boxSizing: 'border-box', border: `${b}px solid ${MCD.statEdge}`, background: 'rgba(33,43,55,0.5)', padding: `${h * 0.12}px ${w * 0.06}px`, opacity: reveal, transform: `translateY(${(1 - reveal) * 18}px)`, flex: 'none', ...style}}>
      <McdText size={26} color="#9AA3AE" style={{display: 'block'}}>{label}</McdText>
      <div style={{position: 'absolute', left: w * 0.06, bottom: h * 0.14}}>
        <PxText text={value} px={6} gap={1} />
      </div>
    </div>
  );
};

/**
 * 45-degree chamfered dark panel. `cuts` = [tl, tr, br, bl] in px. `glow` adds the red-brown radial wash.
 * `corners` draws the 1px frame with small square corner ornaments (teleport/map/merchant style).
 */
export const CutPanel: FC<{
  w: number;
  h: number;
  cuts?: [number, number, number, number];
  fill?: string;
  edge?: string;
  edgeW?: number;
  glow?: string;
  corners?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({w, h, cuts = [24, 24, 24, 24], fill = MCD.panel, edge = '#3A3A3E', edgeW = 3, glow, corners, children, style}) => {
  const outer = chamferPts(w, h, cuts);
  const inner = insetPoly(outer, edgeW);
  const frame = insetPoly(outer, edgeW + 8);
  return (
    <div style={{position: 'relative', width: w, height: h, flex: 'none', ...style}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <polygon points={ptsStr(outer)} fill={edge} />
        <polygon points={ptsStr(inner)} fill={fill} />
        {glow && (
          <>
            <defs>
              <radialGradient id={`cp${w}${h}`} cx="50%" cy="0%" r="90%">
                <stop offset="0" stopColor={glow} stopOpacity="0.9" />
                <stop offset="1" stopColor={glow} stopOpacity="0" />
              </radialGradient>
              <clipPath id={`cpc${w}${h}`}>
                <polygon points={ptsStr(inner)} />
              </clipPath>
            </defs>
            <rect width={w} height={h} fill={`url(#cp${w}${h})`} clipPath={`url(#cpc${w}${h})`} />
          </>
        )}
        {corners && <polygon points={ptsStr(frame)} fill="none" stroke="#4A4A50" strokeWidth={2} />}
        {corners &&
          frame.map(([x, y], i) => <rect key={i} x={x - 5} y={y - 5} width={10} height={10} fill="#5A5A60" />)}
      </svg>
      {children}
    </div>
  );
};

/** Rarity label (COMMON / RARE / UNIQUE / GILDED): small bevelled tag with bold caps. */
export const RarityTag: FC<{rarity: Exclude<Rarity, 'plain'>; size?: number; text?: string; style?: CSSProperties}> = ({rarity, size = 22, text, style}) => {
  const c = {
    common: {bg: '#606060', hi: '#8C8C8C', lo: '#3A3A3A', fg: '#ECECEC'},
    rare: {bg: '#2E9E7A', hi: '#58C8A0', lo: '#1A5C48', fg: '#fff'},
    unique: {bg: '#F85600', hi: '#FF8A3C', lo: '#A33200', fg: '#fff'},
    gilded: {bg: '#E8B428', hi: '#FFE680', lo: '#8A5A08', fg: '#3A2200'},
  }[rarity];
  const b = Math.max(2, Math.round(size / 10));
  return (
    <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: size * 1.35, padding: `0 ${size * 0.45}px`, background: c.bg, boxShadow: `inset ${b}px ${b}px 0 ${c.hi}, inset -${b}px -${b}px 0 ${c.lo}`, flex: 'none', ...style}}>
      <span style={{fontFamily: BODY_FONT, fontWeight: 700, fontSize: size, color: c.fg, letterSpacing: size * 0.04, lineHeight: 1}}>{text ?? rarity.toUpperCase()}</span>
    </span>
  );
};

// ------------------------------------------------------------------ parchment

/** Parchment scroll (enchant upgrade pop-up): ragged-edged #F0DDC0 sheet with a rolled end on each side. `reveal` 0..1 unrolls from the centre. */
export const ParchmentScroll: FC<{w?: number; h?: number; reveal?: number; seed?: number; children?: ReactNode; style?: CSSProperties}> = ({w = 800, h = 700, reveal = 1, seed = 4, children, style}) => {
  const roll = 64;
  const rnd = mulberry32(seed);
  const jag = (x0: number, x1: number, y: number, dir: number) => {
    const pts: Pt[] = [];
    for (let x = x0; x <= x1; x += 28) pts.push([x, y + dir * Math.round(rnd() * 3) * 4]);
    return pts;
  };
  const top = jag(roll, w - roll, 16, 1);
  const bot = jag(roll, w - roll, h - 16, -1).reverse();
  const body: Pt[] = [...top, ...bot];
  const leftRoll: Pt[] = [[0, 24], [roll, 0], [roll + 6, 18], [roll + 6, h - 18], [roll, h], [0, h - 24], [10, h / 2]];
  const rightRoll: Pt[] = leftRoll.map(([x, y]) => [w - x, y] as Pt);
  const half = (w / 2) * clamp01(reveal);
  return (
    <div style={{position: 'relative', width: w, height: h, flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${w / 2 - half}px 0 ${w / 2 - half}px)`}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}} shapeRendering="crispEdges">
          <polygon points={ptsStr(body)} fill={MCD.scroll} />
          <polygon points={ptsStr(body)} fill="none" stroke="#D2B88C" strokeWidth={4} />
          <rect x={roll} y={h - 90} width={w - roll * 2} height={74} fill="#E6CFA6" opacity={0.55} />
          {[leftRoll, rightRoll].map((r, i) => (
            <g key={i}>
              <polygon points={ptsStr(r)} fill="#E8CFA6" stroke="#C4A672" strokeWidth={4} />
              <rect x={i ? w - roll + 14 : 14} y={36} width={10} height={h - 72} fill="#F8ECD6" opacity={0.8} />
              <rect x={i ? w - 26 : roll - 24} y={30} width={14} height={h - 60} fill="#C9AB7C" opacity={0.7} />
            </g>
          ))}
        </svg>
        <div style={{position: 'absolute', left: roll + 40, right: roll + 40, top: 60, bottom: 50}}>{children}</div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ laurel

const LAUREL_TONE = {
  silver: {a: '#E6E6E8', b: '#9A9AA2', edge: '#E8803A'},
  gold: {a: '#FFF0B0', b: '#D8A030', edge: '#FF9A28'},
  orange: {a: '#FFD9A0', b: '#D8802C', edge: '#FF6A1C'},
  green: {a: '#C8F4E0', b: '#3CA886', edge: '#1E7A5C'},
} as const;

/** Silver (or gold/orange/green) laurel wreath that opens upward. `w` is the full width; height is ~0.56w. `grow` 0..1 unfurls the leaves. */
export const Laurel: FC<{w?: number; tone?: keyof typeof LAUREL_TONE; grow?: number; style?: CSSProperties}> = ({w = 480, tone = 'silver', grow = 1, style}) => {
  const t = LAUREL_TONE[tone];
  const h = w * 0.56;
  const cx = w / 2;
  const cy = h * 0.34;
  const rx = w * 0.44;
  const ry = h * 0.62;
  const leaves: ReactNode[] = [];
  const N = 6;
  const leaf = (key: string, bx: number, by: number, dir: number, L: number, back: boolean) => {
    const W = L * 0.36;
    const ux = Math.cos(dir);
    const uy = Math.sin(dir);
    const nx = -uy;
    const ny = ux;
    const tx = bx + ux * L;
    const ty = by + uy * L;
    const mx = bx + ux * L * 0.42;
    const my = by + uy * L * 0.42;
    const pa: Pt[] = [[bx, by], [mx + nx * W, my + ny * W], [tx, ty]];
    const pb: Pt[] = [[bx, by], [mx - nx * W, my - ny * W], [tx, ty]];
    leaves.push(
      <g key={key}>
        <polygon points={ptsStr(pa)} fill={back ? t.b : t.a} stroke="rgba(30,30,40,0.55)" strokeWidth={Math.max(1, w * 0.003)} strokeLinejoin="miter" />
        <polygon points={ptsStr(pb)} fill={back ? '#6E6E76' : t.b} stroke="rgba(30,30,40,0.55)" strokeWidth={Math.max(1, w * 0.003)} strokeLinejoin="miter" />
        <line x1={mx - nx * W} y1={my - ny * W} x2={tx} y2={ty} stroke={t.edge} strokeWidth={Math.max(2, w * 0.012)} />
      </g>,
    );
  };
  for (let side = 0; side < 2; side++) {
    const sg = side ? 1 : -1;
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1);
        const vis = clamp01(grow * (N + 3) - i);
        if (vis <= 0) continue;
        const phi = (3 + k * 112 + (layer ? 5 : 0)) * (Math.PI / 180);
        const sc = layer ? 0.9 : 1;
        const bx = cx + sg * rx * Math.sin(phi) * sc;
        const by = cy + ry * Math.cos(phi) * sc;
        // Tangent up the arc, nudged outward.
        let vx = sg * rx * Math.cos(phi);
        let vy = -ry * Math.sin(phi);
        const vl = Math.hypot(vx, vy) || 1;
        vx = vx / vl + sg * 0.3;
        vy = vy / vl - 0.1;
        const dir = Math.atan2(vy, vx);
        const L = w * (0.36 - k * 0.19) * (layer ? 0.78 : 1) * vis;
        leaf(`${side}-${layer}-${i}`, bx, by, dir, L, layer === 0);
      }
    }
  }
  return (
    <svg width={w} height={h} style={{display: 'block', overflow: 'visible', flex: 'none', ...style}}>
      {leaves}
    </svg>
  );
};

// ------------------------------------------------------------------ items

/**
 * Pseudo-3D item render from a real MC item texture: stacked darker copies give the voxel thickness toward the bottom-right,
 * a brighter copy offset up-left forms the rim light, and a blurred dark copy is the soft contact shadow.
 */
export const ItemIcon3D: FC<{
  src: string;
  size?: number;
  depth?: number;
  rot?: number;
  glow?: string;
  shadow?: boolean;
  style?: CSSProperties;
}> = ({src, size = 96, depth = 5, rot = 0, glow, shadow = true, style}) => {
  const s = size / 16;
  const step = (s * 0.9) / depth;
  const img: CSSProperties = {position: 'absolute', left: 0, top: 0, width: size, height: size, imageRendering: 'pixelated'};
  return (
    <div style={{position: 'relative', width: size, height: size, flex: 'none', transform: rot ? `rotate(${rot}deg)` : undefined, filter: glow ? `drop-shadow(0 0 ${size * 0.12}px ${glow})` : undefined, ...style}}>
      {shadow && <Img src={src} style={{...img, transform: `translate(${s * 1.6}px,${s * 2}px)`, filter: `brightness(0) blur(${Math.max(1, s * 0.9)}px)`, opacity: 0.5}} />}
      {Array.from({length: depth}, (_, i) => {
        const k = depth - i;
        return <Img key={i} src={src} style={{...img, transform: `translate(${step * k}px,${step * k}px)`, filter: `brightness(${0.28 + 0.07 * (depth - k)}) saturate(0.85)`}} />;
      })}
      <Img src={src} style={{...img, transform: `translate(${-s * 0.16}px,${-s * 0.16}px)`, filter: 'brightness(1.9) saturate(0.7)'}} />
      <Img src={src} style={img} />
    </div>
  );
};

/** Real skin, front view (head, body, arms, legs + hat layer), `scale` screen px per skin texel. */
export const PlayerFigure: FC<{skin?: string; scale?: number; style?: CSSProperties; texture?: string}> = ({skin = 'steve', scale = 8, style, texture}) => {
  const src = tex(texture ?? `entity/player/wide/${skin}.png`);
  const c = (rect: [number, number, number, number], x: number, y: number, extra?: CSSProperties) => (
    <Crop src={src} sheet={[64, 64]} rect={rect} scale={scale} style={{position: 'absolute', left: x * scale, top: y * scale, ...extra}} />
  );
  return (
    <div style={{position: 'relative', width: 16 * scale, height: 32 * scale, flex: 'none', ...style}}>
      {c([4, 20, 4, 12], 4, 20)}
      {c([20, 52, 4, 12], 8, 20)}
      {c([20, 20, 8, 12], 4, 8)}
      {c([44, 20, 4, 12], 0, 8)}
      {c([36, 52, 4, 12], 12, 8)}
      {c([8, 8, 8, 8], 4, 0)}
      {c([40, 8, 8, 8], 4, 0)}
    </div>
  );
};

/** Real creeper texture, front view (head, body, two legs). Use with a red drop-shadow outline for enemies. */
export const CreeperFigure: FC<{scale?: number; style?: CSSProperties}> = ({scale = 8, style}) => {
  const src = tex('entity/creeper/creeper.png');
  const c = (rect: [number, number, number, number], x: number, y: number) => <Crop src={src} sheet={[64, 32]} rect={rect} scale={scale} style={{position: 'absolute', left: x * scale, top: y * scale}} />;
  return (
    <div style={{position: 'relative', width: 8 * scale, height: 26 * scale, flex: 'none', ...style}}>
      {c([4, 20, 4, 6], 0, 20)}
      {c([4, 20, 4, 6], 4, 20)}
      {c([20, 20, 8, 12], 0, 8)}
      {c([8, 8, 8, 8], 0, 0)}
    </div>
  );
};

/** Real skeleton texture, front view. */
export const SkeletonFigure: FC<{scale?: number; style?: CSSProperties}> = ({scale = 8, style}) => {
  const src = tex('entity/skeleton/skeleton.png');
  const c = (rect: [number, number, number, number], x: number, y: number) => <Crop src={src} sheet={[64, 32]} rect={rect} scale={scale} style={{position: 'absolute', left: x * scale, top: y * scale}} />;
  return (
    <div style={{position: 'relative', width: 12 * scale, height: 32 * scale, flex: 'none', ...style}}>
      {c([2, 18, 2, 12], 4, 20)}
      {c([2, 18, 2, 12], 6, 20)}
      {c([20, 20, 8, 12], 2, 8)}
      {c([42, 18, 2, 12], 0, 8)}
      {c([42, 18, 2, 12], 10, 8)}
      {c([8, 8, 8, 8], 2, 0)}
    </div>
  );
};

/** Head-and-shoulders crop of a real skin (the avatar inside the results diamond). `scale` = screen px per skin texel. */
export const PlayerBust: FC<{skin?: string; scale?: number; style?: CSSProperties}> = ({skin = 'steve', scale = 10, style}) => {
  const src = tex(`entity/player/wide/${skin}.png`);
  const c = (rect: [number, number, number, number], x: number, y: number) => <Crop src={src} sheet={[64, 64]} rect={rect} scale={scale} style={{position: 'absolute', left: x * scale, top: y * scale}} />;
  return (
    <div style={{position: 'relative', width: 16 * scale, height: 14 * scale, flex: 'none', ...style}}>
      {c([44, 20, 4, 6], 0, 8)}
      {c([36, 52, 4, 6], 12, 8)}
      {c([20, 20, 8, 6], 4, 8)}
      {c([8, 8, 8, 8], 4, 0)}
      {c([40, 8, 8, 8], 4, 0)}
    </div>
  );
};

/** Real chest texture (normal / ender / trapped / copper) front view; `open` 0..1 lifts the lid. */
export const ChestIcon: FC<{variant?: 'normal' | 'ender' | 'trapped' | 'copper'; scale?: number; open?: number; style?: CSSProperties}> = ({variant = 'ender', scale = 8, open = 0, style}) => {
  const src = tex(`entity/chest/${variant}.png`);
  return (
    <div style={{position: 'relative', width: 14 * scale, height: 15 * scale, flex: 'none', ...style}}>
      <Crop src={src} sheet={[64, 64]} rect={[14, 33, 14, 10]} scale={scale} style={{position: 'absolute', left: 0, top: 5 * scale}} />
      <Crop src={src} sheet={[64, 64]} rect={[14, 14, 14, 5]} scale={scale} style={{position: 'absolute', left: 0, top: -open * 6 * scale, transform: `rotate(${-open * 8}deg)`, transformOrigin: '50% 100%'}} />
      <Crop src={src} sheet={[64, 64]} rect={[1, 1, 2, 4]} scale={scale} style={{position: 'absolute', left: 6 * scale, top: (2 - open * 6) * scale}} />
    </div>
  );
};

// ------------------------------------------------------------------ counters

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Emerald icon + pixel number. `bump` 0..1 pops the number up (value just increased). */
export const EmeraldCounter: FC<{value: number; px?: number; bump?: number; style?: CSSProperties}> = ({value, px: p = 3, bump = 0, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: p * 3, ...style}}>
    <PxArt rows={EMERALD_ROWS} pal={EMERALD_PAL} px={p * 1.5 > 0 ? Math.max(2, Math.round(p * 1.5)) : 3} style={{transform: `scale(${1 + bump * 0.18})`}} />
    <div style={{transform: `translateY(${-bump * p * 3}px)`}}>
      <PxText text={fmt(value)} px={p} gap={1} color={bump > 0.2 ? '#E8FFD8' : '#fff'} />
    </div>
  </div>
);

/** Soul (spiral) icon + pixel number. `tone` purple for enchant points, cyan for the soul gauge. */
export const SoulCounter: FC<{value: number; px?: number; bump?: number; tone?: 'purple' | 'cyan' | 'gray'; style?: CSSProperties}> = ({value, px: p = 3, bump = 0, tone = 'purple', style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: p * 3, ...style}}>
    <PxArt rows={SOUL_ROWS} pal={{o: tone === 'purple' ? '#B060F0' : tone === 'cyan' ? MCD.soul : '#8A8A90'}} px={Math.max(2, Math.round(p * 1.3))} style={{transform: `scale(${1 + bump * 0.2}) rotate(${bump * 45}deg)`}} />
    <div style={{transform: `translateY(${-bump * p * 3}px)`}}>
      <PxText text={fmt(value)} px={p} gap={1} />
    </div>
  </div>
);

/** Thin purple XP bar (6-8px at 1x): dark well with a hard shadow line, bright fill. */
export const XpBar: FC<{value: number; w?: number; h?: number; color?: string; style?: CSSProperties}> = ({value, w = 300, h = 10, color = MCD.purple, style}) => (
  <div style={{position: 'relative', width: w, height: h, background: '#202020', boxShadow: `0 ${Math.max(2, h / 3)}px 0 #0A0A0A`, flex: 'none', ...style}}>
    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp01(value) * 100}%`, background: color}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(2, h / 4), background: MCD.purpleHi, filter: 'brightness(1.25)'}} />
    </div>
  </div>
);

// ------------------------------------------------------------------ backdrop

/** Dark backdrop with the big blocky mosaic noise of the real UI and the red-brown (or navy / crimson) glow. */
export const McdBackdrop: FC<{kind?: 'inventory' | 'void' | 'results' | 'defeat' | 'trailer'; drift?: number; cell?: number; style?: CSSProperties; children?: ReactNode}> = ({kind = 'inventory', drift = 0, cell = 40, style, children}) => {
  const cols = Math.ceil(1920 / cell) + 1;
  const rows = Math.ceil(1080 / cell) + 1;
  const cfg = {
    inventory: {base: [26, 14, 16], glow: 'rgba(120,28,28,0.55)', at: '50% -10%', size: '110% 70%'},
    void: {base: [8, 10, 14], glow: 'rgba(40,12,16,0.5)', at: '50% 110%', size: '120% 60%'},
    results: {base: [12, 20, 32], glow: 'rgba(20,40,70,0.55)', at: '50% 20%', size: '110% 80%'},
    defeat: {base: [24, 8, 10], glow: 'rgba(168,66,76,0.7)', at: '50% 50%', size: '120% 120%'},
    trailer: {base: [6, 3, 7], glow: 'rgba(0,0,0,0)', at: '50% 50%', size: '100% 100%'},
  }[kind];
  const rnd = mulberry32(7 + kind.length);
  const cells: ReactNode[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const v = 0.6 + rnd() * 0.8;
      const a = 0.2 + rnd() * 0.5;
      if (a < 0.3) continue;
      cells.push(<div key={`${x}-${y}`} style={{position: 'absolute', left: x * cell, top: y * cell, width: cell, height: cell, background: `rgb(${cfg.base[0] * v * 1.6},${cfg.base[1] * v * 1.6},${cfg.base[2] * v * 1.6})`, opacity: a * 0.55}} />);
    }
  return (
    <AbsoluteFill style={{background: `rgb(${cfg.base[0]},${cfg.base[1]},${cfg.base[2]})`, overflow: 'hidden', ...style}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-drift % cell}px)`, width: 1920 + cell, height: 1080 + cell}}>{cells}</div>
      <AbsoluteFill style={{background: `radial-gradient(ellipse ${cfg.size} at ${cfg.at}, ${cfg.glow}, rgba(0,0,0,0) 70%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 85% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
      {children}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ animation helpers

/** Gold sparks drifting upward with a sway; hard square pixels with a bright core. Fills the parent. */
export const Embers: FC<{count?: number; color?: string; core?: string; seed?: number; speed?: number; area?: [number, number, number, number]; size?: number; style?: CSSProperties}> = ({count = 36, color = MCD.title, core = '#FFF6C0', seed = 11, speed = 1, area = [0, 0, 1920, 1080], size = 8, style}) => {
  const f = useCurrentFrame();
  const rnd = mulberry32(seed);
  const [ax, ay, aw, ah] = area;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', ...style}}>
      {Array.from({length: count}, (_, i) => {
        const x0 = ax + rnd() * aw;
        const sp = (1.2 + rnd() * 2.2) * speed;
        const ph = rnd();
        const sway = 10 + rnd() * 30;
        const sz = Math.round(size * (0.6 + rnd() * 0.9) / 2) * 2;
        const life = ah / (sp * 1.4);
        const t = (f / life + ph) % 1;
        const y = ay + ah - t * ah * 1.1;
        const x = x0 + Math.sin(f * 0.07 * sp + i) * sway;
        const a = Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.abs(Math.sin(f * 0.4 + i * 2.1)));
        const gx = Math.round(x / 4) * 4;
        const gy = Math.round(y / 4) * 4;
        return (
          <div key={i} style={{position: 'absolute', left: gx, top: gy, width: sz, height: sz, background: color, opacity: a, boxShadow: sz >= 8 ? `inset ${sz / 4}px ${sz / 4}px 0 ${core}` : undefined}} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Full-frame white flash that fades out in hard steps (the ~0.7 s boss/victory flash). */
export const WhiteFlash: FC<{at?: number; dur?: number; peak?: number; steps?: number; color?: string}> = ({at = 0, dur = 21, peak = 1, steps = 7, color = '#fff'}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f >= dur) return null;
  const a = (1 - Math.floor((f / dur) * steps) / steps) * peak;
  return <AbsoluteFill style={{background: color, opacity: a, pointerEvents: 'none'}} />;
};

/**
 * Game-style transition: darken to black over `fade` frames, hold, then hard cut (alpha 0). Overlay it above a scene
 * that swaps content at `at + fade + hold`. `reveal` frames of fade-in afterwards when > 0 (results page fades in).
 */
export const BlackCut: FC<{at?: number; fade?: number; hold?: number; reveal?: number; color?: string}> = ({at = 0, fade = 15, hold = 4, reveal = 0, color = '#000'}) => {
  const f = useCurrentFrame() - at;
  let a = 0;
  if (f >= 0 && f < fade) a = f / fade;
  else if (f >= fade && f < fade + hold) a = 1;
  else if (f >= fade + hold) a = reveal > 0 ? 1 - clamp01((f - fade - hold) / reveal) : 0;
  if (a <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: a, pointerEvents: 'none'}} />;
};

/**
 * Trailer-style title: for the first `glitch` frames the rows are shifted by random whole-pixel amounts
 * (a different pattern every frame), then it snaps together on the next frame. `at` is the start frame.
 */
export const GlitchTitle: FC<{text: string; at?: number; glitch?: number; amp?: number} & McdTextOpts> = ({text, at = 0, glitch = 3, amp = 8, ...o}) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const on = f < glitch;
  const rows = Math.max(1, Math.round(amp));
  const shift = (y: number) => {
    if (!on) return 0;
    const r = mulberry32(f * 977 + Math.floor(y / 2) * 31 + 5)();
    return Math.round((r - 0.5) * 2 * amp) * (r > 0.35 ? 1 : 0);
  };
  void rows;
  return <PxText text={text} rowShift={shift} slack={amp + 1} {...o} />;
};

// ------------------------------------------------------------------ runes (decorative, Illageralt-like)

/** Large semi-transparent purple rune glyphs (random strokes on a 5x9 grid) used behind the enchantment row. */
export const Runes: FC<{count?: number; px?: number; color?: string; seed?: number; opacity?: number; style?: CSSProperties}> = ({count = 5, px: p = 10, color = '#5A2A8C', seed = 3, opacity = 0.35, style}) => {
  const rnd = mulberry32(seed);
  const glyphs = Array.from({length: count}, () => {
    const g = Array.from({length: 9}, () => Array.from({length: 5}, () => '.'));
    const kind = Math.floor(rnd() * 3);
    const stem = 1 + Math.floor(rnd() * 3);
    for (let y = 0; y < 9; y++) g[y][stem] = 'o';
    if (kind === 0) for (let x = 0; x < 5; x++) g[Math.floor(rnd() * 3) + 1][x] = 'o';
    if (kind === 1) {
      for (let i = 0; i < 4; i++) g[i + 1][Math.min(4, stem + 1 + (i % 2))] = 'o';
      g[8][4] = 'o';
    }
    if (kind === 2) {
      for (let x = 0; x < 5; x++) g[8][x] = 'o';
      g[0][4] = 'o';
      g[1][3] = 'o';
    }
    g[Math.floor(rnd() * 9)][Math.floor(rnd() * 5)] = 'o';
    return g.map((r) => r.join(''));
  });
  return (
    <div style={{display: 'flex', gap: p * 3, opacity, ...style}}>
      {glyphs.map((rows, i) => (
        <PxArt key={i} rows={rows} pal={{o: color}} px={p} />
      ))}
    </div>
  );
};

export {itemTex};
