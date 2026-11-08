// Pixel sprites for the Dungeons kit: a tiny string-grid renderer plus the icons we need (emerald, soul spiral, skull ...).
// Original Minecraft items/mobs are NOT drawn here - those use the real textures.
import type {CSSProperties, FC} from 'react';

export type Pal = Record<string, string>;

/** Draws a string grid as crisp SVG rects. '.' and ' ' are transparent. `px` = screen px per grid cell. */
export const PxArt: FC<{rows: string[]; pal: Pal; px: number; style?: CSSProperties}> = ({rows, pal, px, style}) => {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const rects: {x: number; y: number; n: number; c: string}[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || !pal[ch]) {
        x++;
        continue;
      }
      let n = 1;
      while (x + n < row.length && row[x + n] === ch) n++;
      rects.push({x, y, n, c: pal[ch]});
      x += n;
    }
  });
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{display: 'block', flex: 'none', ...style}}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.n} height={1} fill={r.c} />
      ))}
    </svg>
  );
};

export const EMERALD_ROWS = [
  '..kkkkk..',
  '.kaaaaak.',
  'kawwbbbck',
  'kawbbbbck',
  'kabbbbcck',
  'kabbbccdk',
  'kbbbccddk',
  '.kbccddk.',
  '..kcddk..',
  '...kdk...',
  '....k....',
];
export const EMERALD_PAL: Pal = {k: '#0A1A08', a: '#8CF068', b: '#58D038', c: '#30A818', d: '#287018', w: '#E8FFE0'};

/** Archimedean spiral on an n x n grid (the "soul" / enchant-point glyph). */
export const spiralRows = (n = 13, turns = 2.4): string[] => {
  const g = Array.from({length: n}, () => Array.from({length: n}, () => '.'));
  const c = (n - 1) / 2;
  const steps = 900;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2;
    const r = (t / (turns * Math.PI * 2)) * (c + 0.35);
    const x = Math.round(c + Math.cos(t - Math.PI / 2) * r);
    const y = Math.round(c + Math.sin(t - Math.PI / 2) * r);
    if (x >= 0 && y >= 0 && x < n && y < n) g[y][x] = 'o';
  }
  return g.map((r) => r.join(''));
};

export const SOUL_ROWS = spiralRows(13, 2.3);

export const SKULL_ROWS = [
  '.kkkkkkkkk.',
  'kkkkkkkkkkk',
  'kkkkkkkkkkk',
  'kk..kkk..kk',
  'kk..kkk..kk',
  'kkkkk.kkkkk',
  '.kkkkkkkkk.',
  '..kk.k.kk..',
  '..kk.k.kk..',
];

export const LOCK_ROWS = ['..kkk..', '.k...k.', '.k...k.', 'kkkkkkk', 'kkkkkkk', 'kkk.kkk', 'kkk.kkk', 'kkkkkkk'];

export const HEART_ROWS = ['.kkk.kkk.', 'kRRRkRRRk', 'kRwRRRRRk', 'kRRRRRRRk', '.kRRRRRk.', '..kRRRk..', '...kRk...', '....k....'];
export const HEART_PAL: Pal = {k: '#2A0508', R: '#D8293E', w: '#FF9AA8'};

/** Blue dodge-roll chevrons. */
export const CHEVRON_ROWS = [
  'bb....bb....',
  'abb...abb...',
  '.abb...abb..',
  '..abb...abb.',
  '...abb...abb',
  '..abb...abb.',
  '.abb...abb..',
  'abb...abb...',
  'bb....bb....',
];
export const CHEVRON_PAL: Pal = {a: '#A8DCFF', b: '#58A0D4'};

// 12x12 enchant glyphs. They are shown rotated 45 degrees inside the diamond frames.
export const ENCH_FLAME = [
  '.....oo.....',
  '....ooo.....',
  '...ooyyo....',
  '...ooyyoo...',
  '..oooyyyoo..',
  '..ooyyyyoo..',
  '.ooyyywyyoo.',
  '.oyyywwwyyo.',
  '.oyywwwwyyo.',
  '.ooyywwwyoo.',
  '..ooyyyyoo..',
  '...oooooo...',
];
export const ENCH_FLAME_PAL: Pal = {o: '#E8501C', y: '#FFB020', w: '#FFF2A0'};

export const ENCH_PIERCE = [
  '..........gg',
  '.........ggG',
  '........ggGG',
  '.......ggGG.',
  '......ggGG..',
  '.....ggGG...',
  '....ggGG....',
  '...ggGG.....',
  '..ggGG......',
  '.ggGG.......',
  'wgGG........',
  'wGG.........',
];
export const ENCH_PIERCE_PAL: Pal = {g: '#7CFF6A', G: '#1FA83A', w: '#FFFFFF'};

export const ENCH_SKULL = [
  '..pppppppp..',
  '.pwwwwwwwwp.',
  'pwwwwwwwwwwp',
  'pww..ww..wwp',
  'pww..ww..wwp',
  'pwwwwppwwwwp',
  '.pwwwwwwwwp.',
  '..pwwwwwwp..',
  '...pw.w.wp..',
  '...pp.p.pp..',
  '............',
  '............',
];
export const ENCH_SKULL_PAL: Pal = {p: '#E040A8', w: '#FFE8F8'};

export const ENCH_HEART = [
  '..rrr..rrr..',
  '.rRRRrrRRRr.',
  'rRwwRRRRRRRr',
  'rRwRRRRRRRRr',
  'rRRRRRRRRRRr',
  '.rRRRRRRRRr.',
  '..rRRRRRRr..',
  '...rRRRRr...',
  '....rRRr....',
  '.....rr.....',
  '............',
  '............',
];
export const ENCH_HEART_PAL: Pal = {r: '#8A1030', R: '#E83050', w: '#FFC0C8'};

export const ENCH_CHEST = [
  '..kkkkkkkk..',
  '.kyyyyyyyyk.',
  'kyOOOOOOOOyk',
  'kyOOOOOOOOyk',
  'kkkkkkkkkkkk',
  'kOOOOwwOOOOk',
  'kOOOOwwOOOOk',
  'kOOOOOOOOOOk',
  'kOOOOOOOOOOk',
  '.kkkkkkkkkk.',
  '............',
  '............',
];
export const ENCH_CHEST_PAL: Pal = {k: '#401004', y: '#FFD060', O: '#E87818', w: '#FFF0A0'};

export const ENCH_SPIRAL_ROWS = spiralRows(11, 2.1);
