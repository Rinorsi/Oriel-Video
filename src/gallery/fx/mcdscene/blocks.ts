// Block palette for the mcdscene voxel engine. Every texture is a real vanilla PNG.
import type {RGB} from './rng';

export type Tint = 'none' | 'grass' | 'foliage' | 'water' | 'autumn' | 'dry' | 'pale';
export type BoxSpec = [number, number, number, number, number, number]; // x0,y0,z0,x1,y1,z1 in 1/16 block

export type BlockDef = {
  kind: 'cube' | 'leaf' | 'shape' | 'liquid' | 'plant' | 'portal';
  top: string;
  side: string;
  bottom?: string;
  tintTop?: Tint;
  tintSide?: Tint;
  /** Grass-style side: dirt `side` plus a tinted `overlay` on top. */
  overlay?: string;
  box?: BoxSpec;
  /** Several boxes in one cell (fences, benches). Overrides `box`. */
  boxes?: BoxSpec[];
  /** Self-illumination 0..1 (lava, glowstone...). */
  glow?: number;
  /** Light source for the voxel light volume. */
  emit?: {color: RGB; level: number};
  /** Random rotation/flip of the top texture per cell. */
  rot?: boolean;
  /** Does not cast shadows (liquids, plants, thin stuff). */
  noShadow?: boolean;
  anim?: 'water' | 'lava' | 'portal';
  /** Crossed-quad vegetation. */
  plant?: {tex: string; h: number; w: number; count: number; tint?: Tint; glow?: number};
  /** Edge highlight strength on exposed top edges (stone bricks etc.). */
  edge?: number;
  /** Ground material class used for dithered transitions between neighbouring tops. */
  ground?: 'grass' | 'dirt' | 'sand' | 'snow' | 'stone' | 'nether';
  /** Surface decals. */
  decal?: 'stone' | 'brick' | 'dirt' | 'sand' | 'nether';
};

const b = (n: string) => `block/${n}`;
const cube = (top: string, side = top, extra: Partial<BlockDef> = {}): BlockDef => ({kind: 'cube', top, side, ...extra});
const log = (n: string): BlockDef => ({kind: 'cube', top: b(n + '_log_top'), side: b(n + '_log'), edge: 0.1});
const leaves = (n: string, extra: Partial<BlockDef> = {}): BlockDef => ({kind: 'leaf', top: b(n + '_leaves'), side: b(n + '_leaves'), tintTop: 'foliage', tintSide: 'foliage', ...extra});
const plant = (tex: string, h: number, w: number, count: number, tint: Tint = 'none', glow = 0): BlockDef => ({kind: 'plant', top: b(tex), side: b(tex), noShadow: true, plant: {tex: b(tex), h, w, count, tint, glow}});
const shape = (tex: string, box: BoxSpec, extra: Partial<BlockDef> = {}): BlockDef => ({kind: 'shape', top: b(tex), side: b(tex), box, ...extra});

const DEFS = {
  stone: cube(b('stone'), b('stone'), {rot: true, decal: 'stone', ground: 'stone'}),
  cobble: cube(b('cobblestone'), b('cobblestone'), {rot: true, decal: 'stone', ground: 'stone'}),
  mossy_cobble: cube(b('mossy_cobblestone'), b('mossy_cobblestone'), {rot: true, ground: 'stone'}),
  andesite: cube(b('andesite'), b('andesite'), {rot: true, decal: 'stone', ground: 'stone'}),
  granite: cube(b('granite'), b('granite'), {rot: true, decal: 'stone', ground: 'stone'}),
  gravel: cube(b('gravel'), b('gravel'), {rot: true, ground: 'stone'}),
  stone_bricks: cube(b('stone_bricks'), b('stone_bricks'), {edge: 0.28, decal: 'brick', ground: 'stone'}),
  mossy_bricks: cube(b('mossy_stone_bricks'), b('mossy_stone_bricks'), {edge: 0.28, ground: 'stone'}),
  cracked_bricks: cube(b('cracked_stone_bricks'), b('cracked_stone_bricks'), {edge: 0.28, ground: 'stone'}),
  chiseled_bricks: cube(b('chiseled_stone_bricks'), b('chiseled_stone_bricks'), {edge: 0.28}),
  deepslate: cube(b('deepslate_top'), b('deepslate'), {rot: true, decal: 'stone', ground: 'stone'}),
  deepslate_bricks: cube(b('deepslate_bricks'), b('deepslate_bricks'), {edge: 0.28, decal: 'brick', ground: 'stone'}),
  deepslate_tiles: cube(b('deepslate_tiles'), b('deepslate_tiles'), {edge: 0.28, ground: 'stone'}),
  dirt: cube(b('dirt'), b('dirt'), {rot: true, decal: 'dirt', ground: 'dirt'}),
  coarse_dirt: cube(b('coarse_dirt'), b('coarse_dirt'), {rot: true, decal: 'dirt', ground: 'dirt'}),
  podzol: cube(b('podzol_top'), b('podzol_side'), {rot: true, ground: 'dirt'}),
  path: cube(b('dirt_path_top'), b('dirt_path_side'), {rot: true, decal: 'dirt', ground: 'dirt'}),
  grass: cube(b('grass_block_top'), b('dirt'), {tintTop: 'grass', tintSide: 'grass', overlay: b('grass_block_side_overlay'), rot: true, ground: 'grass'}),
  mycelium: cube(b('mycelium_top'), b('mycelium_side'), {rot: true, ground: 'grass'}),
  sand: cube(b('sand'), b('sand'), {rot: true, decal: 'sand', ground: 'sand'}),
  red_sand: cube(b('red_sand'), b('red_sand'), {rot: true, decal: 'sand', ground: 'sand'}),
  sandstone: cube(b('sandstone_top'), b('sandstone'), {ground: 'sand'}),
  cut_sandstone: cube(b('sandstone_top'), b('cut_sandstone'), {edge: 0.28}),
  chiseled_sandstone: cube(b('sandstone_top'), b('chiseled_sandstone'), {edge: 0.28}),
  red_sandstone: cube(b('red_sandstone_top'), b('red_sandstone'), {ground: 'sand'}),
  cut_red_sandstone: cube(b('red_sandstone_top'), b('cut_red_sandstone'), {edge: 0.28}),
  terracotta: cube(b('terracotta'), b('terracotta'), {rot: true}),
  orange_terracotta: cube(b('orange_terracotta'), b('orange_terracotta'), {rot: true}),
  red_terracotta: cube(b('red_terracotta'), b('red_terracotta'), {rot: true}),
  yellow_terracotta: cube(b('yellow_terracotta'), b('yellow_terracotta'), {rot: true}),
  white_terracotta: cube(b('white_terracotta'), b('white_terracotta'), {rot: true}),
  brown_terracotta: cube(b('brown_terracotta'), b('brown_terracotta'), {rot: true}),
  gold: cube(b('gold_block'), b('gold_block'), {edge: 0.3}),
  snow: cube(b('snow'), b('snow'), {ground: 'snow'}),
  snow_grass: cube(b('snow'), b('grass_block_snow'), {ground: 'snow'}),
  ice: cube(b('ice'), b('ice'), {glow: 0.1, ground: 'snow'}),
  packed_ice: cube(b('packed_ice'), b('packed_ice'), {ground: 'snow'}),
  blue_ice: cube(b('blue_ice'), b('blue_ice'), {glow: 0.15, ground: 'snow'}),
  oak_log: log('oak'),
  spruce_log: log('spruce'),
  birch_log: log('birch'),
  dark_oak_log: log('dark_oak'),
  jungle_log: log('jungle'),
  oak_planks: cube(b('oak_planks'), b('oak_planks'), {edge: 0.18}),
  spruce_planks: cube(b('spruce_planks'), b('spruce_planks'), {edge: 0.18}),
  dark_planks: cube(b('dark_oak_planks'), b('dark_oak_planks'), {edge: 0.18}),
  bricks: cube(b('bricks'), b('bricks'), {edge: 0.28}),
  hay: cube(b('hay_block_top'), b('hay_block_side'), {edge: 0.2}),
  oak_leaves: leaves('oak'),
  spruce_leaves: leaves('spruce'),
  dark_leaves: leaves('dark_oak'),
  birch_leaves: leaves('birch'),
  jungle_leaves: leaves('jungle'),
  azalea_leaves: leaves('azalea', {tintTop: 'none', tintSide: 'none'}),
  maple_leaves: leaves('oak', {tintTop: 'autumn', tintSide: 'autumn'}),
  dry_leaves: leaves('acacia', {tintTop: 'dry', tintSide: 'dry'}),
  snow_spruce: {kind: 'leaf', top: b('snow'), side: b('spruce_leaves'), tintSide: 'foliage'},
  cloud: cube(b('snow'), b('snow'), {edge: 0.18}),
  waterfall: cube(b('water_flow'), b('water_flow'), {tintTop: 'pale', tintSide: 'pale', glow: 0.25}),
  mesa_sand: cube(b('red_sand'), b('red_sandstone'), {rot: true}),
  orange_wool: cube(b('orange_wool'), b('orange_wool')),
  magenta_wool: cube(b('magenta_wool'), b('magenta_wool')),
  purple_wool: cube(b('purple_wool'), b('purple_wool')),
  light_blue_wool: cube(b('light_blue_wool'), b('light_blue_wool')),
  lime_wool: cube(b('lime_wool'), b('lime_wool')),
  yellow_wool: cube(b('yellow_wool'), b('yellow_wool')),
  black_wool: cube(b('black_wool'), b('black_wool')),
  lantern: shape('shroomlight', [5, 5, 0, 11, 11, 8], {glow: 0.95, emit: {color: [255, 190, 100], level: 13}, noShadow: true}),
  soul_lantern: shape('sea_lantern', [5, 5, 0, 11, 11, 8], {glow: 0.95, emit: {color: [100, 225, 235], level: 12}, noShadow: true}),
  chiseled_dark: cube(b('chiseled_polished_blackstone'), b('chiseled_polished_blackstone'), {edge: 0.3}),
  polished_bs: cube(b('polished_blackstone'), b('polished_blackstone'), {edge: 0.3}),
  bone: cube(b('bone_block_top'), b('bone_block_side'), {edge: 0.2}),
  quartz: cube(b('quartz_block_top'), b('quartz_block_side'), {edge: 0.3}),
  pink_cube: cube(b('sea_lantern'), b('sea_lantern'), {glow: 1, emit: {color: [250, 150, 250], level: 14}, edge: 0.3}),
  map_shroom: plant('red_mushroom', 0.55, 0.5, 1),
  map_flower: plant('poppy', 0.5, 0.45, 1),
  prismarine: cube(b('prismarine_bricks'), b('prismarine_bricks'), {edge: 0.3}),
  cactus: shape('cactus_side', [1, 1, 0, 15, 15, 16], {top: b('cactus_top')}),
  // nether
  netherrack: cube(b('netherrack'), b('netherrack'), {rot: true, decal: 'nether', ground: 'nether'}),
  crimson_nylium: cube(b('crimson_nylium'), b('crimson_nylium_side'), {rot: true, ground: 'nether'}),
  warped_nylium: cube(b('warped_nylium'), b('warped_nylium_side'), {rot: true, ground: 'nether'}),
  nether_bricks: cube(b('nether_bricks'), b('nether_bricks'), {edge: 0.3, decal: 'brick', ground: 'nether'}),
  red_nether_bricks: cube(b('red_nether_bricks'), b('red_nether_bricks'), {edge: 0.3, decal: 'brick', ground: 'nether'}),
  blackstone: cube(b('blackstone_top'), b('blackstone'), {rot: true, decal: 'stone', ground: 'nether'}),
  blackstone_bricks: cube(b('polished_blackstone_bricks'), b('polished_blackstone_bricks'), {edge: 0.3, decal: 'brick', ground: 'nether'}),
  gilded: cube(b('gilded_blackstone'), b('gilded_blackstone'), {rot: true}),
  basalt: cube(b('basalt_top'), b('basalt_side'), {ground: 'nether'}),
  polished_basalt: cube(b('polished_basalt_top'), b('polished_basalt_side'), {edge: 0.2}),
  smooth_basalt: cube(b('smooth_basalt'), b('smooth_basalt'), {rot: true}),
  soul_sand: cube(b('soul_sand'), b('soul_sand'), {rot: true, ground: 'nether'}),
  soul_soil: cube(b('soul_soil'), b('soul_soil'), {rot: true, ground: 'nether'}),
  magma: cube(b('magma'), b('magma'), {glow: 0.55, emit: {color: [255, 120, 40], level: 5}}),
  shroomlight: cube(b('shroomlight'), b('shroomlight'), {glow: 0.85, emit: {color: [255, 170, 80], level: 8}}),
  glowstone: cube(b('glowstone'), b('glowstone'), {glow: 0.85, emit: {color: [255, 200, 110], level: 9}}),
  wart_block: cube(b('nether_wart_block'), b('nether_wart_block'), {rot: true}),
  crimson_stem: {kind: 'cube', top: b('crimson_stem_top'), side: b('crimson_stem'), edge: 0.1},
  warped_stem: {kind: 'cube', top: b('warped_stem_top'), side: b('warped_stem'), edge: 0.1},
  obsidian: cube(b('obsidian'), b('obsidian'), {rot: true, edge: 0.18}),
  crying_obsidian: cube(b('crying_obsidian'), b('crying_obsidian'), {rot: true, glow: 0.35, emit: {color: [190, 80, 255], level: 4}}),
  // end
  end_stone: cube(b('end_stone'), b('end_stone'), {rot: true, decal: 'stone', ground: 'stone'}),
  end_bricks: cube(b('end_stone_bricks'), b('end_stone_bricks'), {edge: 0.3, decal: 'brick'}),
  purpur: cube(b('purpur_block'), b('purpur_block'), {edge: 0.3}),
  purpur_pillar: {kind: 'cube', top: b('purpur_pillar_top'), side: b('purpur_pillar_side'), edge: 0.2},
  // liquids / animated
  lava: {kind: 'liquid', top: b('lava_still'), side: b('lava_still'), glow: 1, emit: {color: [255, 130, 40], level: 14}, anim: 'lava', noShadow: true},
  water: {kind: 'liquid', top: b('water_still'), side: b('water_still'), tintTop: 'water', anim: 'water', noShadow: true},
  portal: {kind: 'portal', top: b('nether_portal'), side: b('nether_portal'), box: [0, 6, 0, 16, 10, 16], glow: 1, emit: {color: [190, 70, 255], level: 9}, anim: 'portal', noShadow: true},
  portal_x: {kind: 'portal', top: b('nether_portal'), side: b('nether_portal'), box: [6, 0, 0, 10, 16, 16], glow: 1, emit: {color: [190, 70, 255], level: 9}, anim: 'portal', noShadow: true},
  // light sources and small shapes
  torch: shape('torch', [7, 7, 0, 9, 9, 10], {glow: 0.9, emit: {color: [255, 190, 100], level: 12}, noShadow: true}),
  soul_torch: shape('soul_torch', [7, 7, 0, 9, 9, 10], {glow: 0.9, emit: {color: [90, 220, 235], level: 11}, noShadow: true}),
  redstone_lamp: cube(b('redstone_lamp_on'), b('redstone_lamp_on'), {glow: 0.9, emit: {color: [255, 190, 90], level: 13}, edge: 0.2}),
  sea_lantern: cube(b('sea_lantern'), b('sea_lantern'), {glow: 0.85, emit: {color: [190, 240, 255], level: 12}}),
  campfire: shape('campfire_log_lit', [1, 1, 0, 15, 15, 5], {glow: 0.6, emit: {color: [255, 150, 70], level: 14}, noShadow: true}),
  soul_campfire: shape('soul_campfire_log_lit', [1, 1, 0, 15, 15, 5], {glow: 0.6, emit: {color: [80, 210, 230], level: 13}, noShadow: true}),
  end_rod: shape('end_rod', [6, 6, 0, 10, 10, 16], {glow: 0.9, emit: {color: [250, 220, 255], level: 11}, noShadow: true}),
  slab_stone: shape('stone_bricks', [0, 0, 0, 16, 16, 8], {edge: 0.28}),
  slab_planks: shape('oak_planks', [0, 0, 0, 16, 16, 8], {edge: 0.18}),
  slab_dark: shape('dark_oak_planks', [0, 0, 0, 16, 16, 8], {edge: 0.18}),
  snow_layer: shape('snow', [0, 0, 0, 16, 16, 3], {ground: 'snow'}),
  post_oak: shape('oak_log', [5, 5, 0, 11, 11, 16], {top: b('oak_log_top')}),
  post_dark: shape('dark_oak_log', [5, 5, 0, 11, 11, 16], {top: b('dark_oak_log_top')}),
  post_spruce: shape('spruce_log', [5, 5, 0, 11, 11, 16], {top: b('spruce_log_top')}),
  rail_x: shape('spruce_planks', [0, 5, 0, 16, 11, 3]),
  rail_y: shape('spruce_planks', [5, 0, 0, 11, 16, 3]),
  fence_x: shape('spruce_planks', [6, 6, 0, 10, 10, 15], {boxes: [[6, 6, 0, 10, 10, 15], [0, 7, 4, 16, 9, 7], [0, 7, 9, 16, 9, 12]]}),
  fence_y: shape('spruce_planks', [6, 6, 0, 10, 10, 15], {boxes: [[6, 6, 0, 10, 10, 15], [7, 0, 4, 9, 16, 7], [7, 0, 9, 9, 16, 12]]}),
  fence_post: shape('spruce_planks', [6, 6, 0, 10, 10, 15]),
  mushroom_stem: shape('mushroom_stem', [6, 6, 0, 10, 10, 9]),
  shroom_glow: shape('shroomlight', [4, 4, 0, 12, 12, 6], {glow: 0.55, emit: {color: [255, 190, 90], level: 7}, noShadow: true}),
  chest_gold: shape('gold_block', [2, 2, 0, 14, 14, 10], {edge: 0.3}),
  emerald_blk: cube(b('emerald_block'), b('emerald_block'), {edge: 0.3, glow: 0.2, emit: {color: [90, 220, 110], level: 3}}),
  white_wool: cube(b('white_wool'), b('white_wool')),
  red_wool: cube(b('red_wool'), b('red_wool')),
  magenta_glass: cube(b('magenta_stained_glass'), b('magenta_stained_glass'), {glow: 0.8, emit: {color: [230, 80, 230], level: 10}}),
  // plants
  tuft: plant('short_grass', 0.95, 1.0, 3, 'grass'),
  tuft_tall: plant('tall_grass_top', 1.45, 1.1, 3, 'grass'),
  fern: plant('fern', 0.9, 1.0, 3, 'grass'),
  dead_bush: plant('dead_bush', 0.8, 0.9, 2),
  dry_grass: plant('short_dry_grass', 0.9, 1.0, 4),
  tall_dry: plant('tall_dry_grass', 1.4, 1.05, 3),
  poppy: plant('poppy', 0.8, 0.7, 2),
  dandelion: plant('dandelion', 0.8, 0.7, 2),
  cornflower: plant('cornflower', 0.85, 0.7, 2),
  allium: plant('allium', 1.0, 0.7, 1),
  oxeye: plant('oxeye_daisy', 0.8, 0.7, 2),
  azure: plant('azure_bluet', 0.7, 0.7, 2),
  crimson_roots: plant('crimson_roots', 0.9, 1.0, 4, 'none', 0.1),
  warped_roots: plant('warped_roots', 0.9, 1.0, 4, 'none', 0.2),
  nether_sprouts: plant('nether_sprouts', 0.6, 0.9, 3, 'none', 0.1),
  red_mushroom: plant('red_mushroom', 0.6, 0.55, 1),
  brown_mushroom: plant('brown_mushroom', 0.6, 0.55, 1, 'none', 0.15),
  sapling: plant('oak_sapling', 0.9, 0.9, 1, 'foliage'),
  sugar_cane: plant('sugar_cane', 1.6, 0.9, 2, 'grass'),
  lily: plant('lily_of_the_valley', 0.8, 0.7, 2),
  vine_plant: plant('weeping_vines_plant', 1.0, 0.8, 2),
  chorus: plant('chorus_flower', 0.9, 0.8, 1, 'none', 0.2),
} satisfies Record<string, BlockDef>;

export type BlockName = keyof typeof DEFS;
const names = Object.keys(DEFS) as BlockName[];
export const B = Object.fromEntries(names.map((k, i) => [k, i + 1])) as Record<BlockName, number>;
const AIR_DEF: BlockDef = {kind: 'cube', top: '', side: ''};
export const BLOCKS: BlockDef[] = [AIR_DEF, ...names.map((k) => DEFS[k] as BlockDef)];

export const isSolidCube = (id: number) => id !== 0 && BLOCKS[id].kind === 'cube';
export const isCaster = (id: number) => {
  const d = BLOCKS[id];
  return id !== 0 && !d.noShadow && d.kind !== 'plant' && d.kind !== 'liquid' && d.kind !== 'portal';
};

/** Texture names a set of block ids needs. */
export const texturesOf = (ids: Iterable<number>): string[] => {
  const out = new Set<string>();
  for (const id of ids) {
    const d = BLOCKS[id];
    if (!d || id === 0) continue;
    for (const t of [d.top, d.side, d.bottom, d.overlay, d.plant?.tex]) if (t) out.add(t);
  }
  return [...out];
};

/** Reverse lookup: block id -> palette name. */
export const BLOCK_NAMES: string[] = ['air', ...names];
