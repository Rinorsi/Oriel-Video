/**
 * Pixel sprites for the cute transitions: character grids + palettes ('.' = transparent).
 * Rendered by `Pix` in kit.tsx, which bakes an ink outline (and optional hard shadow) into the grid.
 */
import {FLAT} from '../../flat';

export type Sprite = {rows: string[]; palette: Record<string, string>};

const INK = FLAT.ink;

export const creeper: Sprite = {
  rows: [
    '..HHHHHHHH..',
    '.HggggggggS.',
    'HgDWDggDWDgS',
    'HgDDDggDDDgS',
    'HgDDDggDDDgS',
    'HggggDDggggS',
    'HgPgDDDDgPgS',
    'HgggDDDDgggS',
    'HgggDggDgggS',
    'HgggDggDgggS',
    '.SSSSSSSSSS.',
  ],
  palette: {g: '#6fd05a', H: '#b4f59a', S: '#3f9a45', D: '#23422a', W: '#ffffff', P: '#ff9fb4'},
};

export const heart: Sprite = {
  rows: ['.RRRR.RRRR.', 'RWWRRRRRRRR', 'RWRRRRRRRRR', 'RRRRRRRRRRS', 'RRRRRRRRRRS', '.RRRRRRRRS.', '..RRRRRRS..', '...RRRRS...', '....RRS....', '.....R.....'],
  palette: {R: FLAT.red, W: '#ffe0e4', S: FLAT.redDeep},
};

export const star: Sprite = {
  rows: ['.....YY.....', '.....YY.....', '....YYYY....', '....YWYY....', 'YYYYYYYYYYYY', '.YYYWYYYYYS.', '..YYYYYYYS..', '...YYYYYS...', '..YYYYYYYS..', '..YYYS.SYYS.', '.YYS....SYY.'],
  palette: {Y: FLAT.yellow, W: '#fff6c0', S: FLAT.yellowDeep},
};

export const spark: Sprite = {
  rows: ['...W...', '...W...', '..WWW..', 'WWWWWWW', '..WWW..', '...W...', '...W...'],
  palette: {W: '#ffffff'},
};

export const puff: Sprite = {
  rows: ['..WWWW..', '.WWWWWW.', 'WWWWWWWW', 'WWWWWWWW', '.WWWWWWS', '..SSSS..'],
  palette: {W: '#ffffff', S: '#d6e6f7'},
};

export const cloud: Sprite = {
  rows: [
    '.....WWWWW........',
    '...WWWWWWWWW.WWW..',
    '..WWWWWWWWWWWWWWW.',
    '.WWWWWWWWWWWWWWWWW',
    'WWWWWDDWWWWDDWWWWW',
    'WWWWWDDWWWWDDWWWWW',
    'WWWPPWWDWWDWWPPWWW',
    'WWWWWWWWDDWWWWWWWW',
    'SWWWWWWWWWWWWWWWWS',
    '.SSSSSSSSSSSSSSSS.',
  ],
  palette: {W: '#ffffff', S: '#cde4fb', D: INK, P: '#ffb3c8'},
};

export const cloudPlain: Sprite = {rows: cloud.rows.map((r) => r.replace(/[DP]/g, 'W')), palette: cloud.palette};

export const sun: Sprite = {
  rows: ['...HHHHH...', '..HYYYYYY..', '.HYYYYYYYS.', 'HYYYYYYYYYS', 'HYYDYYYDYYS', 'HYYDYYYDYYS', 'HYPPYYYPPYS', 'YYYYDYDYYYS', '.YYYYDYYYS.', '..YYYYYYS..', '...SSSSS...'],
  palette: {Y: FLAT.yellow, H: '#fff1a0', S: FLAT.yellowDeep, D: INK, P: '#ff9a8a'},
};

export const slime: Sprite = {
  rows: [
    '....LLLLLLLL....',
    '..LLLLLLLLLLLL..',
    '.LHHLLLLLLLLLLS.',
    '.LHLLLLLLLLLLLS.',
    'LLLLLLLLLLLLLLLS',
    'LLLLWDLLLLWDLLLS',
    'LLLLDDLLLLDDLLLS',
    'LLPPLLLLLLLLPPLS',
    'LLPPLLLDLDLLPPLS',
    'LLLLLLLLDLLLLLLS',
    'LLLLLLLLLLLLLLLS',
    '.dddddddddddddd.',
  ],
  palette: {L: '#7be07a', H: '#d4ffc9', S: '#3fae55', d: '#2fa24a', D: '#23422a', W: '#ffffff', P: '#ff9fc0'},
};

export const drop: Sprite = {
  rows: ['...LL...', '..LLLL..', '.LHLLLL.', '.LHLLLLS', 'LLLLLLLS', 'LLLLLLLS', '.LLLLLS.', '..SSSS..'].map((r) => r.padEnd(8, '.')),
  palette: {L: '#7be07a', H: '#d4ffc9', S: '#3fae55'},
};

export const pig: Sprite = {
  rows: ['EE........EE', 'EEppppppppEE', 'HppppppppppS', 'HpWDppppWDpS', 'HpDDppppDDpS', 'HppNNNNNNppS', 'HRpNDNNDNpRS', 'HppNNNNNNppS', 'pppppppppppS', '.SSSSSSSSSS.'],
  palette: {p: '#ffb3c8', H: '#ffd9e5', S: '#e8869f', E: '#ff8aa8', N: '#ff8aa8', D: '#3b2433', W: '#ffffff', R: '#ff6f95'},
};

export const chicken: Sprite = {
  rows: ['....RR....', '...RRRR...', '.WWWWWWWW.', 'WWWWWWWWWS', 'WWDWWWWDWS', 'WWDWWWWDWS', 'WWWWOOWWWS', 'WPWWOOWWPS', '.WWWWWWWS.', '..SSSSSS..'],
  palette: {R: FLAT.red, W: '#ffffff', S: '#d3e0ef', D: INK, O: FLAT.orange, P: '#ffb3c8'},
};

export const sheep: Sprite = {
  rows: ['..WWWWWWWW..', '.WWWWWWWWWWS', 'WWWFFFFFFWWS', 'WWFFDFFDFFWS', 'WWFFDFFDFFWS', 'WWFPFFFFPFWS', 'WWWFFDDFFWWS', '.WWWFFFFWWS.', '..WWWWWWWS..'],
  palette: {W: '#ffffff', S: '#d3e0ef', F: '#f4d6b0', D: INK, P: '#ff9fb4'},
};

export const melon: Sprite = {
  rows: ['GWRRKRRKRRWG', 'GWRRRRRRRRWG', '.GWDRRRRDWG.', '.GWRRDDRRWG.', '..GWRRRRWG..', '...GWRRWG...', '....GGGG....'],
  palette: {R: FLAT.red, W: '#c9f7b5', G: FLAT.greenDeep, K: INK, D: INK},
};

export const pumpkin: Sprite = {
  rows: ['.....BB.....', '..OOOBBOOO..', '.OHOOoOOOOS.', 'OHODOoOODOOS', 'OHDDOoOODDOS', 'OHOOOoOOOOOS', 'OHODDDDDDOOS', '.OOOoOOOOOS.', '..OOOoOOOS..', '...SSSSSS...'],
  palette: {O: FLAT.orange, H: '#ffc27a', o: '#e07a1c', S: '#c9601a', B: '#5d8a3a', D: INK},
};

export const carrot: Sprite = {
  rows: ['.G..GG..G.', '..GGGGGG..', '.OOOOOOOO.', '.OHDOoDOS.', '.OOOOOOOS.', '..OHOoOS..', '..OHOOOS..', '...OOoOS..', '...OHOOS..', '....OOS...', '....OS....', '.....S....'],
  palette: {G: FLAT.green, O: FLAT.orange, H: '#ffc27a', o: '#e07a1c', S: '#c9601a', D: INK},
};

export const apple: Sprite = {
  rows: ['.....B.GG.', '.....BGGG.', '..RRRBRRR.', '.RWWRRRRRR', 'RRWRRRRRRS', 'RRRRRRRRRS', 'RRRRRRRRRS', '.RRRRRRRS.', '..RRRRRS..', '...RRRRS..'],
  palette: {R: FLAT.red, W: '#ffd0d6', S: FLAT.redDeep, B: '#8a4f27', G: FLAT.green},
};

export const diamond: Sprite = {
  rows: ['..CCCCCCC..', '.CWWCCCCCS.', 'CWCCCCCCCCS', 'CCCCLCCLCCS', 'CCCCCCCCCCS', '.CCCCCCCCS.', '..CCCLCCS..', '...CCCCS...', '....CCS....', '.....C.....'],
  palette: {C: '#4be3e0', W: '#e8ffff', S: '#1ea7c4', L: '#7ff0ee'},
};

export const book: Sprite = {
  rows: ['.PPPPPPPP.', 'ppPPPPPPPS', 'ppPPYYYPPS', 'ppPYYPYYPS', 'ppPPYYYPPS', 'ppPPPPPPPS', 'ppPPPPPPPS', '.WWWWWWWW.'],
  palette: {P: FLAT.purple, p: '#b9a2ff', S: FLAT.purpleDeep, Y: FLAT.yellow, W: '#fff4d6'},
};

/** Diamond sword drawn on a diagonal, tip at the top right. */
const swordRows = (() => {
  const n = 12;
  const g = Array.from({length: n}, () => Array<string>(n).fill('.'));
  for (let i = 0; i < 8; i++) {
    g[7 - i][2 + i] = 'C';
    g[7 - i][3 + i] = i === 7 ? '.' : 'c';
    if (i > 0) g[8 - i][2 + i] = 'W';
  }
  g[0][10] = 'W';
  // guard and hilt
  for (let k = -2; k <= 2; k++) g[8 + k][2 - k + 0] = g[8 + k][2 - k] === '.' ? 'Y' : g[8 + k][2 - k];
  g[9][1] = 'B';
  g[10][0] = 'B';
  g[10][1] = 'b';
  return g.map((r) => r.join(''));
})();
export const sword: Sprite = {rows: swordRows, palette: {C: '#4be3e0', c: '#1ea7c4', W: '#e8ffff', Y: FLAT.yellow, B: '#9b6b43', b: '#7a4f2e'}};

/** A flat block: bevel light/dark with a motif. */
const block = (rows: string[], palette: Record<string, string>): Sprite => ({rows, palette});

export const blocks = {
  b_grass: block(['LLLLLLLL', 'GGGgGGGG', 'GgGGGGgG', 'GDGDDGDD', 'DDDdDDDD', 'DdDDDDdD', 'DDDDdDDD', 'dddddddd'], {L: '#a6f27f', G: FLAT.green, g: FLAT.greenDeep, D: '#a8744a', d: '#7a4f2e'}),
  b_diamond: block(['HHHHHHHH', 'HMMMMMMl', 'HMsMMMMl', 'HMMMMsMl', 'HMMsMMMl', 'HMMMMMsl', 'HMsMMMMl', 'llllllll'], {H: '#d4fdff', M: '#4be3e0', l: '#1ea7c4', s: '#ffffff'}),
  b_gold: block(['HHHHHHHH', 'HMMMMMMl', 'HMsMMMMl', 'HMMMMsMl', 'HMMsMMMl', 'HMMMMMsl', 'HMsMMMMl', 'llllllll'], {H: '#fff5b8', M: FLAT.yellow, l: FLAT.yellowDeep, s: '#ffffff'}),
  b_redstone: block(['HHHHHHHH', 'HMrrMMMl', 'HMrrMMrl', 'HMMMMMrl', 'HMMrrMMl', 'HrMrrMMl', 'HrMMMMMl', 'llllllll'], {H: '#e4e7ee', M: '#aab0bf', l: '#6e7488', r: FLAT.red}),
  b_lapis: block(['HHHHHHHH', 'HMbbMMMl', 'HMbbMMbl', 'HMMMMMbl', 'HMMbbMMl', 'HbMbbMMl', 'HbMMMMMl', 'llllllll'], {H: '#e4e7ee', M: '#aab0bf', l: '#6e7488', b: '#4f6dff'}),
  b_emerald: block(['HHHHHHHH', 'HMMMMMMl', 'HMsMMMMl', 'HMMMMsMl', 'HMMsMMMl', 'HMMMMMsl', 'HMsMMMMl', 'llllllll'], {H: '#c6ffd9', M: '#3ddc84', l: '#1f9d5a', s: '#ffffff'}),
} satisfies Record<string, Sprite>;

const CHEST_PAL = {L: '#eab677', M: '#c4803f', S: '#8a4f27', D: '#9a5a2e', G: FLAT.yellow, g: FLAT.yellowDeep};
export const chestLid: Sprite = {
  rows: ['..LLLLLLLLLLLL..', '.LMMGGMMMMGGMMS.', 'LMMMGGMMMMGGMMMS', 'LMMMGGMMMMGGMMMS', 'LMMMGGMMMMGGMMMS', 'LDDDggDDDDggDDDS'],
  palette: CHEST_PAL,
};
export const chestBase: Sprite = {
  rows: ['LMMMGGMMMMGGMMMS', 'LMMMGGMMMMGGMMMS', 'LMMMGGMMMMGGMMMS', 'LMMMGGMMMMGGMMMS', 'LMMMGGMMMMGGMMMS', 'LMMMggMMMMggMMMS', '.SSSSSSSSSSSSSS.'],
  palette: CHEST_PAL,
};
/** The lid seen from the inside (dark wood) for the open state. */
export const chestLidOpen: Sprite = {
  rows: ['..SSSSSSSSSSSS..', '.SDDGGDDDDGGDDS.', 'SDDDGGDDDDGGDDDS', 'SDDDGGDDDDGGDDDS', 'SDDDGGDDDDGGDDDS', 'SLLLggLLLLggLLLS'],
  palette: {...CHEST_PAL, S: '#6b3a1c', D: '#7c4624', L: '#9a5a2e'},
};
export const lock: Sprite = {rows: ['YYYY', 'YKKY', 'YYYY', 'sYYs'], palette: {Y: FLAT.yellow, K: INK, s: FLAT.yellowDeep}};

export const fish: Sprite = {
  rows: ['...HHHH.....', '.HHOOOOOO..F', 'HOOOOOOOOOFF', 'OWDOOPPOOOFF', 'ODDOOOOOOOFF', 'OOOOOOOOOOFF', '.SSOOOOOO..F', '...SSSS.....'],
  palette: {O: FLAT.orange, H: '#ffc27a', S: '#e07a1c', F: FLAT.yellow, W: '#ffffff', D: INK, P: '#ff9a8a'},
};

export const SPR = {creeper, fish, heart, star, spark, puff, cloud, cloudPlain, sun, slime, drop, pig, chicken, sheep, melon, pumpkin, carrot, apple, diamond, book, sword, ...blocks, chestLid, chestLidOpen, chestBase, lock} satisfies Record<string, Sprite>;
export type SprName = keyof typeof SPR;

const recolored = new Map<string, Sprite>();
/** Same grid with some palette letters swapped (cached so the bake cache keeps working). */
export const recolor = (base: Sprite, key: string, map: Record<string, string>): Sprite => {
  const k = `${key}:${JSON.stringify(map)}`;
  let s = recolored.get(k);
  if (!s) {
    s = {rows: base.rows, palette: {...base.palette, ...map}};
    recolored.set(k, s);
  }
  return s;
};

const heartColors = {
  red: heart,
  pink: recolor(heart, 'heart', {R: FLAT.pink, W: '#ffe3ee', S: FLAT.pinkDeep}),
  lilac: recolor(heart, 'heart', {R: '#b79bff', W: '#ece4ff', S: FLAT.purple}),
  white: recolor(heart, 'heart', {R: '#ffffff', W: '#ffffff', S: '#ffd0dc'}),
  sky: recolor(heart, 'heart', {R: FLAT.sky, W: '#e0f5ff', S: FLAT.skyDeep}),
  yellow: recolor(heart, 'heart', {R: FLAT.yellow, W: '#fff6c0', S: FLAT.yellowDeep}),
};
export type HeartColor = keyof typeof heartColors;
export const heartOf = (c: HeartColor) => heartColors[c];

const starColors = {
  yellow: star,
  pink: recolor(star, 'star', {Y: FLAT.pink, W: '#ffd9e8', S: FLAT.pinkDeep}),
  sky: recolor(star, 'star', {Y: FLAT.sky, W: '#e0f5ff', S: FLAT.skyDeep}),
  mint: recolor(star, 'star', {Y: FLAT.mint, W: '#e8fff2', S: FLAT.teal}),
  lilac: recolor(star, 'star', {Y: '#b79bff', W: '#ece4ff', S: FLAT.purple}),
  white: recolor(star, 'star', {Y: '#ffffff', W: '#ffffff', S: '#dfe8f5'}),
};
export type StarColor = keyof typeof starColors;
export const starOf = (c: StarColor) => starColors[c];

const fishColors = {
  orange: fish,
  pink: recolor(fish, 'fish', {O: FLAT.pink, H: '#ffb3cf', S: FLAT.pinkDeep, F: '#ffd0e0', P: '#ffffff'}),
  sky: recolor(fish, 'fish', {O: FLAT.sky, H: '#c7ebff', S: FLAT.skyDeep, F: FLAT.lilac, P: '#ffb3c8'}),
  yellow: recolor(fish, 'fish', {O: FLAT.yellow, H: '#fff1a0', S: FLAT.yellowDeep, F: FLAT.orange, P: '#ff9a8a'}),
};
export type FishColor = keyof typeof fishColors;
export const fishOf = (c: FishColor) => fishColors[c];
