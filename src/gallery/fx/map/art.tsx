import type {CSSProperties, FC, ReactNode} from 'react';
import {Img} from 'remotion';
import {PixelSprite, type Sprite} from '../../flat';
import {item, tex} from '../../../mc/assets';
import {PIXEL8_FONT, PIXEL_FONT} from '../../../mc/fonts';
import {PlayerFace} from '../../../mg/Ore';
import {MAP_PAL} from './mapgen';

/**
 * Art kit for the map area: pixel icons, the player token, vehicles, flag, pushpin.
 * All sizes are screen pixels (the engine counter-scales them against the camera).
 */

export const INK = '#2b2338';
export const MAPINK = '#4a3623';
export const PARCH = '#f3e2b6';
export const PARCH_D = '#d9c08a';
export const PARCH_L = '#fff4d6';
export const GOLD = '#ffd23f';
export const RED = '#e5483f';

const pal = (extra: Record<string, string> = {}) => ({
  R: MAP_PAL.roof,
  r: MAP_PAL.roofD,
  W: MAP_PAL.wall,
  w: MAP_PAL.wallD,
  B: '#6fb2d8',
  D: MAP_PAL.wood,
  S: MAP_PAL.rockL,
  s: MAP_PAL.rock,
  K: '#34312f',
  ...extra,
});

export const ICONS: Record<string, Sprite> = {
  house: {rows: ['..rRr..', '.rRRRr.', 'rRRRRRr', '.WWWWW.', '.WBWDW.', '.wWWDw.'], palette: pal()},
  tent: {rows: ['...R...', '..RRR..', '.RRWRR.', 'RRRWWRR', 'RRRDDRR'], palette: pal({W: '#f4dcc0', D: MAP_PAL.woodD})},
  tower: {rows: ['S.S.S', 'SSSSS', 'SsSsS', 'SSSSS', 'SSKSS', 'SSSSS', 'SSDSS', 'sSDSs'], palette: pal()},
  castle: {
    rows: ['S.S.SS.S.S', 'SSSSSSSSSS', 'SsKSSSSKsS', 'SSSSSSSSSS', 'SSSSKKSSSS', 'SsSSKKSSsS', 'SSSSDDSSSS', 'sSSSDDSSSs'],
    palette: pal(),
  },
  anchor: {
    rows: ['....A....', '...AAA...', '....A....', '.AAAAAAA.', '....A....', 'A...A...A', 'AA..A..AA', '.AAAAAAA.', '...AAA...'],
    palette: {A: '#3d5a80'},
  },
  bed: {
    rows: ['DDDDDDDDDDDDDD', 'DWWWRRRRRRRRRD', 'DWWWRRRRRRRRRD', 'DWwWRrRRrRRRRD', 'DWWWRRRRRRRRRD', 'DDDDDDDDDDDDDD', 'D............D'],
    palette: {D: MAP_PAL.wood, W: '#ffffff', w: '#d8d8e0', R: '#d63c3c', r: '#a82727'},
  },
  chest: {
    rows: ['DDDDDDDDDD', 'DccccccccD', 'DccccccccD', 'DDDDGGDDDD', 'DccccGGccD', 'DccccGGccD', 'DDDDDDDDDD'],
    palette: {D: MAP_PAL.woodD, c: MAP_PAL.wood, G: '#ffd23f'},
  },
  flag: {rows: ['DRRRR', 'DRRRR', 'DRRR.', 'D....', 'D....', 'D....'], palette: {D: MAP_PAL.woodD, R: '#e5483f'}},
  pine: {rows: ['..G..', '.GLG.', '.GGD.', 'GLGGD', 'GGGDD', '..T..'], palette: {G: MAP_PAL.forest, L: MAP_PAL.forestL, D: MAP_PAL.forestD, T: MAP_PAL.wood}},
  peak: {
    rows: ['.....s.....', '....sWd....', '...sWWdd...', '..lWWrrdd..', '.llllrrrdd.', 'lllllrrrrdd'],
    palette: {s: MAP_PAL.snow, W: MAP_PAL.snow, l: MAP_PAL.rockL, r: MAP_PAL.rock, d: MAP_PAL.rockD},
  },
  skull: {
    rows: ['.WWWWW.', 'WWWWWWW', 'WKKWKKW', 'WKKWKKW', 'WWWKWWW', '.WWWWW.', '.WKWKW.'],
    palette: {W: '#f3f3ee', K: '#2b2338'},
  },
  horse: {
    rows: [
      '...............kk...',
      '..............kbbb..',
      '.............kbbbbb.',
      '............kbbbwbbb',
      '...........kbbbbbbbb',
      '..........kbbbbbbddb',
      '.........kbbbbbb.ddd',
      '..kbbbbbkbbbbbb.....',
      '.kkbbbbbbbbbbbbb....',
      'kk.bbbbbbbbbbdbb....',
      'k..bbbbbbbbbbddb....',
      '...dbb.....bbd.b....',
      '...bb......bb..b....',
      '...bb......bb..b....',
      '...dd......dd..dd...',
    ],
    palette: {b: '#9a6238', d: '#6e4222', k: '#2b2338', w: '#ffffff'},
  },
  boat: {
    rows: ['hH......................Hh', 'hhHHHHHHHHHHHHHHHHHHHHhh', '.hhhhhhhhhhhhhhhhhhhhhh.', '..hdhhhdhhhhdhhhhdhhdh..', '...hdddddddddddddddh....', '.....hhhhhhhhhhhhh......'],
    palette: {h: '#9b6b43', H: '#c18a55', d: '#6a4426'},
  },
  wings: {
    rows: [
      'WW..............................WW',
      'wWWW..........................WWWw',
      'wwWWWW......................WWWWww',
      '.wwwWWWW..................WWWWwww.',
      '..wwwwWWWWW............WWWWWwwww..',
      '...wwwwwwWWWW........WWWWwwwwww...',
      '....wwwwwwwwWWW....WWWWwwwwwww....',
      '......wwwwwwwwww..wwwwwwwwww......',
      '........wwwwwwwwwwwwwwwwww........',
      '..........wwwwwwwwwwwwww..........',
    ],
    palette: {W: '#c9ccd6', w: '#8d92a3'},
  },
};

export const ICON_IMG = (id: string) => item(id);

/** An icon by sprite key, or any Minecraft item id (diamond, emerald, ender_eye...). */
export const IconArt: FC<{icon: string; size: number}> = ({icon, size}) => {
  const sp = ICONS[icon];
  if (sp) {
    const w = sp.rows[0].length;
    const px = Math.max(2, Math.floor(size / Math.max(w, sp.rows.length)));
    return <PixelSprite sprite={sp} px={px} outline={INK} />;
  }
  return <Img src={item(icon)} style={{width: size, height: size, imageRendering: 'pixelated'}} />;
};

/** Hard-edged panel in map style (parchment, ink border, offset shadow). */
export const parchBox = (opts: {fill?: string; border?: number; shadow?: number; radius?: number} = {}): CSSProperties => {
  const {fill = PARCH, border = 6, shadow = 8, radius = 0} = opts;
  return {
    background: fill,
    border: `${border}px solid ${MAPINK}`,
    borderRadius: radius,
    boxShadow: `0 ${shadow}px 0 rgba(40,24,10,0.55), inset 0 0 0 3px ${PARCH_L}, inset 0 -6px 0 ${PARCH_D}`,
    boxSizing: 'border-box',
  };
};

/** Round-ish badge holding a node icon. `ring` colours the rim. */
export const IconBadge: FC<{icon: string; size?: number; ring?: string; ghost?: boolean; style?: CSSProperties}> = ({icon, size = 104, ring = RED, ghost, style}) => (
  <div style={{position: 'relative', width: size, height: size + 22, opacity: ghost ? 0.8 : 1, ...style}}>
    <div style={{position: 'absolute', left: size / 2 - 12, top: size - 10, width: 24, height: 24, background: INK, transform: 'rotate(45deg)'}} />
    <div style={{position: 'absolute', left: size / 2 - 7, top: size - 12, width: 14, height: 14, background: ring, transform: 'rotate(45deg)'}} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: ghost ? '#e8d7aa' : PARCH_L,
        border: `7px solid ${INK}`,
        borderRadius: 18,
        boxShadow: `0 8px 0 ${INK}, inset 0 0 0 6px ${ring}, inset 0 -8px 0 rgba(0,0,0,0.14)`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconArt icon={icon} size={size - 40} />
    </div>
  </div>
);

/** The player token: Steve's face in an ink frame. `size` is the face size (multiple of 8). */
export const FaceToken: FC<{size?: number; dead?: boolean; ring?: string; style?: CSSProperties; children?: ReactNode}> = ({size = 80, dead, ring = GOLD, style, children}) => (
  <div
    style={{
      position: 'relative',
      width: size + 24,
      height: size + 24,
      background: ring,
      border: `6px solid ${INK}`,
      borderRadius: 12,
      boxShadow: `0 8px 0 ${INK}, inset 0 5px 0 rgba(255,255,255,0.45)`,
      boxSizing: 'border-box',
      padding: 6,
      filter: dead ? 'grayscale(0.85) brightness(0.8)' : undefined,
      ...style,
    }}
  >
    <PlayerFace size={size} />
    {children}
  </div>
);

/** Red pixel X over the token (death). */
export const RedCross: FC<{size: number; k?: number}> = ({size, k = 1}) => {
  const t = size * 0.2;
  const bar = (rot: number): CSSProperties => ({position: 'absolute', left: size / 2 - (size * 1.1) / 2, top: size / 2 - t / 2, width: size * 1.1, height: t, background: '#ff3b3b', border: `5px solid ${INK}`, boxSizing: 'border-box', transform: `rotate(${rot}deg)`});
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: size, height: size, transform: `scale(${k})`, opacity: k > 0 ? 1 : 0}}>
      <div style={bar(45)} />
      <div style={bar(-45)} />
    </div>
  );
};

/** Pixel pushpin: red head, silver needle. Anchor is the needle tip at the bottom centre. */
export const Pushpin: FC<{size?: number; color?: string}> = ({size = 96, color = RED}) => {
  const u = size / 12;
  const rows = ['..XXXX..', '.XrrrrX.', 'XrWrrrrX', 'XrWrrrrX', 'XrrrrrrX', '.XrrrrX.', '..XXXX..', '...XX...', '...nn...', '...nn...', '...nn...', '....n...'];
  const colors: Record<string, string> = {X: INK, r: color, W: '#ffd0d0', n: '#c9ccd6'};
  return (
    <svg width={8 * u} height={12 * u} shapeRendering="crispEdges" style={{overflow: 'visible', filter: 'drop-shadow(6px 8px 0 rgba(30,20,10,0.35))'}}>
      {rows.flatMap((r, y) => [...r].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x * u} y={y * u} width={u + 0.5} height={u + 0.5} fill={colors[c]} />)))}
    </svg>
  );
};

/** Waving banner on a pole. `raise` 0..1 lifts the cloth up the pole. Anchor is the pole foot (bottom centre). */
export const Flag: FC<{f: number; raise?: number; height?: number; color?: string; accent?: string}> = ({f, raise = 1, height = 190, color = RED, accent = GOLD}) => {
  const cols = 9;
  const cw = 13;
  const rowsN = 6;
  const ch = 13;
  const clothH = rowsN * ch;
  const clothY = (height - 20 - clothH) * (1 - raise) * 0 + (1 - raise) * (height - clothH - 24);
  const poleW = 9;
  return (
    <svg width={cols * cw + 40} height={height + 10} style={{position: 'absolute', left: -poleW / 2, bottom: 0, overflow: 'visible'}} shapeRendering="crispEdges">
      <rect x={-4} y={4} width={poleW + 8} height={height + 4} fill={INK} />
      <rect x={0} y={8} width={poleW} height={height - 4} fill="#d9c08a" />
      <rect x={2} y={8} width={3} height={height - 4} fill="#fff4d6" />
      <rect x={-6} y={-6} width={poleW + 12} height={16} fill={INK} />
      <rect x={-2} y={-2} width={poleW + 4} height={9} fill={accent} />
      {Array.from({length: cols}, (_, c) => {
        const wave = Math.sin(f * 0.34 + c * 0.75) * (1 + c * 0.35) * (raise > 0.98 ? 1 : 0.4);
        const x = poleW + 2 + c * cw;
        const y = 14 + clothY + wave;
        return (
          <g key={c}>
            <rect x={x - 2} y={y - 5} width={cw + 4} height={clothH + 10} fill={INK} />
          </g>
        );
      })}
      {Array.from({length: cols}, (_, c) => {
        const wave = Math.sin(f * 0.34 + c * 0.75) * (1 + c * 0.35) * (raise > 0.98 ? 1 : 0.4);
        const x = poleW + 2 + c * cw;
        const y = 14 + clothY + wave;
        const shade = c % 3 === 2;
        return (
          <g key={c}>
            <rect x={x} y={y} width={cw} height={clothH} fill={shade ? '#c9342d' : color} />
            <rect x={x} y={y + ch * 2} width={cw} height={ch} fill={accent} />
            <rect x={x} y={y + 2} width={cw} height={4} fill="rgba(255,255,255,0.35)" />
          </g>
        );
      })}
    </svg>
  );
};

/** Ground shadow ellipse under things that hop. */
export const GroundShadow: FC<{w: number; k?: number}> = ({w, k = 1}) => (
  <div style={{position: 'absolute', left: -w / 2 * k, top: -w * 0.13 * k, width: w * k, height: w * 0.26 * k, borderRadius: '50%', background: 'rgba(40,24,10,0.38)'}} />
);

/** Small text label in the pixel font with an ink halo (for names on the map). */
export const NameTag: FC<{children: string; size?: number; color?: string; bg?: string}> = ({children, size = 36, color = INK, bg = PARCH_L}) => (
  <div style={{...parchBox({fill: bg, border: 5, shadow: 6}), padding: '8px 16px 10px', fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, whiteSpace: 'pre', WebkitFontSmoothing: 'none'}}>{children}</div>
);

export const PixelLabel: FC<{children: ReactNode; size?: number; color?: string; style?: CSSProperties}> = ({children, size = 32, color = INK, style}) => (
  <span style={{fontFamily: size % 12 === 0 ? PIXEL_FONT : PIXEL8_FONT, fontSize: size, lineHeight: `${size}px`, color, whiteSpace: 'pre', WebkitFontSmoothing: 'none', ...style}}>{children}</span>
);

/** The vehicle art under the token. All anchored bottom-centre. */
export const MinecartArt: FC<{size?: number}> = ({size = 176}) => <Img src={item('minecart')} style={{width: size, height: size, imageRendering: 'pixelated', filter: 'brightness(1.5) contrast(1.1) drop-shadow(0 6px 0 rgba(30,20,10,0.4))'}} />;
export const BoatArt: FC<{px?: number}> = ({px = 9}) => <PixelSprite sprite={ICONS.boat} px={px} outline={INK} style={{filter: 'drop-shadow(0 6px 0 rgba(30,20,10,0.35))'}} />;
export const PearlArt: FC<{size?: number; spin?: number}> = ({size = 96, spin = 0}) => (
  <Img src={item('ender_pearl')} style={{width: size, height: size, imageRendering: 'pixelated', transform: `rotate(${spin}deg)`, filter: 'drop-shadow(0 0 14px #b46bff)'}} />
);
export const HorseArt: FC<{px?: number}> = ({px = 10}) => <PixelSprite sprite={ICONS.horse} px={px} outline={INK} />;
export const WingsArt: FC<{px?: number}> = ({px = 7}) => <PixelSprite sprite={ICONS.wings} px={px} outline={INK} />;

void tex;
