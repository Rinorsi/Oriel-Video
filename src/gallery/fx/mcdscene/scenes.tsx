// Scene presets (looks, cameras, fx) for every biome + the reusable <ScenePlate/>.
import type {FC} from 'react';
import type {Geom, Look} from './bake';
import {SceneCanvas, type CameraOrbit, type CameraSpec, type FxSpec, type PostSpec, type SceneSpec} from './engine';
import {genForestDay, genForestNight} from './biomes';
import {genCamp, genDesert, genEnd, genNether, genSnow} from './biomes2';
import {genWorldMap} from './biomes3';
import type {RGB} from './rng';

export type BiomeId = 'forest-day' | 'forest-night' | 'desert' | 'nether' | 'end' | 'snow' | 'world-map' | 'camp';

const W = 1920;
const H = 1080;

/** Buffer geometry that is just large enough for the camera path. */
export const mkGeom = (o: {tw?: number; th?: number; hz?: number; anchor: [number, number, number]; zoomMin: number; panX: number; panY: number; persp?: number; tilt?: number}): Geom => {
  const tw = o.tw ?? 96;
  const th = o.th ?? 67;
  const hz = o.hz ?? 49;
  const kk = o.persp ?? 0;
  const vs = 1 + (o.tilt ?? 0);
  const bufW = Math.ceil(W / (o.zoomMin * (1 - kk * 0.52)) + 2 * o.panX + 48);
  const bufH = Math.ceil((H / (o.zoomMin * vs)) * (1.1 + kk * 0.2) + 2 * o.panY + 48);
  return {tw, th, hz, bufW, bufH, anchor: o.anchor};
};

export const defaultFace: [number, number, number] = [1, 0.78, 0.6];

const post = (p: Partial<PostSpec> = {}): PostSpec => ({bloom: {tight: 0.32, wide: 0.3, threshold: 0.7}, vignette: 0.2, ...p});

/**
 * Biome camera. from/to are the legacy short-loop swing endpoints (still used by mode 'linear'/'ease' overrides and by the
 * 'push' / 'pull' / 'static' presets, which work from their midpoint). With `orbit` the 'loop' mode instead follows a small closed
 * path around that midpoint, once per loop (80 s): positions, zoom and tilt at frame 0 and frame `loop` are identical.
 */
const drift = (dx = 130, dy = 30, z0 = 0.9, z1 = 0.96, persp = 0.2, orbit?: CameraOrbit): CameraSpec => ({from: {x: -dx, y: dy, zoom: z0}, to: {x: dx, y: -dy, zoom: z1}, mode: 'loop', persp, sway: {x: 6, y: 5}, orbit});

/** Default loop of every biome: 80 s at 30 fps. */
export const SCENE_LOOP = 2400;

/** Hit-spark / dust events at the given start frames, cycling through a few spots. */
const sparksAt = (spots: [number, number, number][], starts: number[], seed0: number, n = 12): FxSpec[] => starts.map((start, i) => ({t: 'sparks', at: spots[i % spots.length], start, seed: seed0 + i, n}));
const dustAt = (spots: [number, number, number][], starts: number[], seed0: number): FxSpec[] => starts.map((start, i) => ({t: 'dust', at: spots[i % spots.length], start, seed: seed0 + i, size: 1 + (i % 3) * 0.1}));

/** forest-night storm schedule (frame, grid position, seed): three storms per 80 s with double flashes. The first strikes keep their legacy frames. */
const STORM: {frame: number; at: [number, number, number]; seed: number}[] = [
  {frame: 40, at: [34, 40, 5], seed: 4},
  {frame: 52, at: [34, 40, 5], seed: 9},
  {frame: 140, at: [54, 52, 5], seed: 17},
  {frame: 620, at: [48, 38, 5], seed: 21},
  {frame: 634, at: [48, 38, 5], seed: 5},
  {frame: 1100, at: [38, 52, 5], seed: 8},
  {frame: 1112, at: [38, 52, 5], seed: 31},
  {frame: 1256, at: [56, 44, 5], seed: 12},
  {frame: 1720, at: [52, 40, 5], seed: 14},
  {frame: 1731, at: [52, 40, 5], seed: 27},
  {frame: 2100, at: [36, 46, 5], seed: 3},
  {frame: 2230, at: [50, 54, 5], seed: 19},
  {frame: 2243, at: [50, 54, 5], seed: 6},
];
const GEOM_STD = (anchor: [number, number, number], persp = 0.2) => mkGeom({anchor, zoomMin: 0.88, panX: 160, panY: 60, persp});

// ---------------------------------------------------------------------------------------------------------------------
// looks

const forestDayLook: Look = {
  skyTop: [118, 170, 226],
  skyHorizon: [208, 226, 242],
  light: [1.04, 1.0, 0.93],
  sunDir: [-1, -0.14, 1.05],
  shadow: 0.58,
  face: defaultFace,
  tint: {grass: [92, 152, 46], foliage: [78, 142, 42], water: [58, 120, 190], autumn: [196, 96, 40]},
  fog: {color: [200, 220, 238], base: 0.02, slope: 0.42, height: 0.1, zRef: 9, zRange: 7},
  grade: {sat: 1.1, contrast: 1.06, lift: [3, 5, 8], shadowTone: [0.97, 0.99, 1.04], highTone: [1.04, 1.02, 0.97]},
  glowGain: 1,
  pointGain: 1,
  tone: 0.17,
  waterDeep: [20, 60, 110],
  waterAlpha: 0.62,
  ao: 0.46,
};

const forestNightLook: Look = {
  skyTop: [34, 58, 84],
  skyHorizon: [88, 120, 150],
  light: [0.36, 0.55, 0.8],
  sunDir: [-1, -0.2, 1.1],
  shadow: 0.72,
  face: defaultFace,
  tint: {grass: [52, 98, 104], foliage: [34, 92, 90], water: [26, 66, 98], autumn: [120, 90, 70]},
  fog: {color: [92, 128, 156], base: 0.02, slope: 0.72, height: 0.22, zRef: 9, zRange: 7},
  grade: {sat: 1.06, contrast: 1.1, lift: [5, 11, 17], shadowTone: [0.92, 1.0, 1.1], highTone: [1.22, 1.08, 0.86]},
  glowGain: 1.1,
  pointGain: 1.25,
  tone: 0.2,
  waterDeep: [10, 30, 60],
  waterAlpha: 0.7,
  ao: 0.5,
};

const desertLook: Look = {
  skyTop: [214, 190, 130],
  skyHorizon: [236, 208, 150],
  light: [0.9, 0.8, 0.66],
  sunDir: [-1, -0.2, 0.9],
  shadow: 0.6,
  face: defaultFace,
  tint: {grass: [104, 156, 44], foliage: [90, 140, 40], water: [60, 150, 150], dry: [140, 130, 60]},
  fog: {color: [222, 190, 122], base: 0.06, slope: 0.5, height: 0.1, zRef: 8, zRange: 6},
  grade: {sat: 1.12, contrast: 1.07, lift: [8, 6, 2], shadowTone: [1.02, 0.97, 0.94], highTone: [1.06, 1.02, 0.9]},
  glowGain: 0.9,
  pointGain: 0.9,
  tone: 0.1,
  waterDeep: [20, 90, 90],
  waterAlpha: 0.7,
  ao: 0.46,
};

const netherLook: Look = {
  skyTop: [70, 12, 18],
  skyHorizon: [176, 60, 32],
  light: [0.5, 0.3, 0.3],
  sunDir: [-1, -0.2, 1.0],
  shadow: 0.78,
  face: defaultFace,
  tint: {grass: [120, 40, 30], foliage: [120, 40, 30], water: [90, 30, 30]},
  fog: {color: [130, 34, 26], base: 0.1, slope: 0.4, height: 0.28, zRef: 10, zRange: 8},
  grade: {sat: 1.2, contrast: 1.1, lift: [20, 2, 6], shadowTone: [1.12, 0.84, 0.9], highTone: [1.1, 1.0, 0.8]},
  glowGain: 1.1,
  pointGain: 1.5,
  tone: 0.14,
  waterDeep: [60, 10, 10],
  waterAlpha: 0.7,
  ao: 0.5,
};

const endLook: Look = {
  stars: {density: 0.00028, color: [230, 190, 255]},
  skyTop: [34, 8, 72],
  skyHorizon: [176, 78, 232],
  light: [1.0, 0.95, 0.9],
  sunDir: [-1, -0.2, 1.1],
  shadow: 0.68,
  face: defaultFace,
  tint: {grass: [150, 130, 200], foliage: [150, 130, 200], water: [120, 70, 200]},
  fog: {color: [150, 70, 214], base: 0.02, slope: 0.3, height: 0.3, zRef: 9, zRange: 10},
  grade: {sat: 1.14, contrast: 1.1, lift: [10, 2, 22], shadowTone: [1.08, 0.82, 1.22], highTone: [1.04, 1.0, 0.98]},
  glowGain: 1.1,
  pointGain: 1.0,
  tone: 0.1,
  waterDeep: [40, 10, 90],
  waterAlpha: 0.7,
  ao: 0.5,
};

const snowLook: Look = {
  skyTop: [38, 60, 112],
  skyHorizon: [118, 148, 190],
  light: [0.34, 0.45, 0.74],
  sunDir: [-1, -0.16, 0.95],
  shadow: 0.5,
  face: defaultFace,
  tint: {grass: [150, 190, 150], foliage: [30, 76, 70], water: [60, 110, 170]},
  fog: {color: [112, 142, 188], base: 0.1, slope: 0.46, height: 0.15, zRef: 9, zRange: 8},
  grade: {sat: 1.18, contrast: 1.14, lift: [4, 9, 20], shadowTone: [0.86, 0.96, 1.2], highTone: [1.1, 1.02, 0.92]},
  glowGain: 1.0,
  pointGain: 0.7,
  tone: 0.09,
  waterDeep: [10, 30, 70],
  waterAlpha: 0.7,
  ao: 0.48,
};

const campLook: Look = {
  skyTop: [34, 26, 92],
  skyHorizon: [74, 62, 150],
  light: [0.4, 0.4, 0.78],
  sunDir: [-1, -0.18, 1.1],
  shadow: 0.7,
  face: defaultFace,
  tint: {grass: [60, 108, 62], foliage: [44, 96, 70], water: [60, 90, 160], autumn: [150, 80, 50]},
  fog: {color: [54, 46, 122], base: 0.14, slope: 0.5, height: 0.22, zRef: 10, zRange: 8},
  grade: {sat: 1.15, contrast: 1.08, lift: [10, 7, 28], shadowTone: [0.94, 0.94, 1.14], highTone: [1.12, 1.03, 0.92]},
  glowGain: 1.0,
  pointGain: 1.1,
  tone: 0.12,
  waterDeep: [10, 20, 60],
  waterAlpha: 0.7,
  ao: 0.5,
};

const mapLook: Look = {
  base: 'paper',
  skyTop: [232, 216, 192],
  skyHorizon: [232, 216, 192],
  light: [1.1, 1.07, 1.02],
  sunDir: [-1, -0.3, 1.2],
  shadow: 0.78,
  face: [1, 0.8, 0.64],
  tint: {grass: [82, 120, 58], foliage: [86, 128, 62], water: [120, 170, 190], autumn: [196, 100, 44], pale: [170, 210, 232]},
  fog: {color: [232, 216, 192], base: 0, slope: 0, height: 0, zRef: 0, zRange: 1},
  grade: {sat: 0.94, contrast: 1.04, lift: [0, 0, 0], shadowTone: [1, 0.99, 0.98], highTone: [1.02, 1.0, 0.97]},
  glowGain: 1,
  pointGain: 1,
  tone: 0.12,
  waterDeep: [60, 120, 140],
  waterAlpha: 0.6,
  ao: 0.5,
  dropShadow: {dx: 46, dy: 84, blur: 16, color: [128, 106, 84], alpha: 0.3},
};

// ---------------------------------------------------------------------------------------------------------------------
// fx helpers

const EMB_GOLD = ['#ffd24a', '#f08229', '#ffb12e', '#fff2a0'];

export const SCENES: Record<BiomeId, SceneSpec> = {
  'forest-day': {
    id: 'forest-day',
    seed: 11,
    build: genForestDay,
    look: forestDayLook,
    geom: GEOM_STD([42, 44, 4]),
    camera: drift(130, 30, 0.9, 0.96, 0.2, {kind: 'circle', x: 100, y: 26, zoom: 0.025, zoomCycles: 2}),
    post: post({
      vignette: 0.16,
      sat: 1.04,
      // sun swell (once per 40 s) and a passing cloud that cools the light (every 26 s)
      breath: [
        {mode: 'screen', color: [255, 222, 150], alpha: 0.07, period: 1200},
        {mode: 'multiply', color: [176, 194, 228], alpha: 0.1, period: 800, phase: 0.35},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'clouds', strength: 0.32, seed: 4},
      {t: 'rays', spec: {n: 5, color: [255, 224, 150], alpha: 0.42, angle: 12, width: 0.075, seed: 3, drift: 40}},
      {t: 'motes', n: 44, seed: 2, box: [26, 28, 3, 58, 60, 9], color: '#fff0b0', alpha: 0.6},
      {t: 'sparkle', n: 260},
    ],
  },
  'forest-night': {
    id: 'forest-night',
    seed: 11,
    build: genForestNight,
    look: forestNightLook,
    geom: GEOM_STD([42, 44, 4]),
    camera: drift(130, 30, 0.9, 0.97, 0.2, {kind: 'pan', x: 120, y: 22, zoom: 0.025, zoomCycles: 1, zoomPhase: 0.25}),
    post: post({
      bloom: {tight: 0.34, wide: 0.28, threshold: 0.62},
      vignette: 0.5,
      sat: 1.06,
      contrast: 1.06,
      // moon behind drifting cloud: the cold light dims and returns
      breath: [
        {mode: 'multiply', color: [60, 90, 150], alpha: 0.16, period: 1200, phase: 0.1},
        {mode: 'screen', color: [90, 140, 205], alpha: 0.05, period: 800, phase: 0.6},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'fog', spec: {color: [92, 124, 156], alpha: 0.32, y: 0.3, thick: 0.34, speed: 1, seed: 1}},
      {t: 'embers', n: 16, seed: 5, box: [44.6, 43.2, 5.4, 46.6, 45.2, 5.6], rise: 4.5, colors: EMB_GOLD, size: 1, cycles: 1},
      {t: 'fireflies', n: 30, seed: 7, box: [22, 24, 4, 62, 62, 9]},
      {t: 'souls', n: 5, seed: 3, from: [45.5, 43.5, 5.5], to: [60, 30, 13], spread: 100, arc: 130, size: 1.1},
      {t: 'lightning', strikes: STORM},
      // ground sparks where the first bolt of every cluster lands
      ...STORM.filter((q, i) => i === 0 || STORM[i - 1].frame + 40 < q.frame).map((q, i): FxSpec => ({t: 'sparks', at: q.at, start: q.frame, seed: i * 3 + 1, n: 16})),
      {t: 'sparkle', n: 200},
    ],
  },
  desert: {
    id: 'desert',
    seed: 5,
    build: genDesert,
    look: desertLook,
    geom: GEOM_STD([42, 43, 5]),
    camera: drift(120, 26, 0.9, 0.96, 0.2, {kind: 'eight', x: 105, y: 24, zoom: 0.02, zoomCycles: 2}),
    post: post({
      bloom: {tight: 0.28, wide: 0.22, threshold: 0.78},
      vignette: 0.26,
      sat: 1.06,
      haze: {color: [228, 204, 156], alpha: 0.12, height: 0.4},
      // the sun glare swells and sinks
      breath: [
        {mode: 'screen', color: [255, 214, 140], alpha: 0.07, period: 1200},
        {mode: 'multiply', color: [220, 180, 140], alpha: 0.08, period: 800, phase: 0.5},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'rays', spec: {n: 5, color: [226, 174, 75], alpha: 0.34, angle: 14, width: 0.08, seed: 6, drift: 60}},
      {t: 'fog', spec: {color: [236, 208, 148], alpha: 0.3, y: 0.34, thick: 0.34, speed: 1, seed: 2}},
      {t: 'motes', n: 70, seed: 3, box: [26, 28, 4, 56, 58, 12], color: '#f5d98a', alpha: 0.8},
      {t: 'beam', at: [46.5, 41.5, 6.1], kind: 'orange', width: 70, alpha: 0.8, sparkles: 10},
      {t: 'emerald', at: [46.5, 41.5, 8.4]},
      {t: 'dust', at: [40, 50, 4.2], start: 36, seed: 3, size: 1.2},
      {t: 'dust', at: [52, 47, 4.2], start: 120, seed: 8, size: 1.0},
      // dust kicked up around the temple every ~6-10 s
      ...dustAt([[44, 53, 4.2], [37, 46, 4.2], [55, 51, 4.2], [48, 45, 4.2], [41, 55, 4.2]], [330, 560, 790, 1010, 1260, 1490, 1720, 1960, 2170, 2330], 20),
    ],
  },
  nether: {
    id: 'nether',
    seed: 3,
    build: genNether,
    look: netherLook,
    geom: GEOM_STD([45, 41, 7]),
    camera: drift(120, 30, 0.9, 0.96, 0.2, {kind: 'circle', dir: -1, phase: 0.25, x: 95, y: 26, zoom: 0.025, zoomCycles: 3}),
    post: post({
      bloom: {tight: 0.4, wide: 0.34, threshold: 0.62},
      vignette: 0.42,
      sat: 1.04,
      // the lava lake brightens and sulks on a ~20 s breath
      breath: [
        {mode: 'screen', color: [255, 96, 30], alpha: 0.09, period: 800},
        {mode: 'multiply', color: [200, 120, 130], alpha: 0.1, period: 1200, phase: 0.5},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'pool', at: [34, 50, 4], color: [255, 130, 40], radius: 10, alpha: 0.16, flicker: 0.4},
      {t: 'pool', at: [51, 35, 12], color: [190, 70, 255], radius: 6, alpha: 0.3, flicker: 0.3},
      {t: 'fog', spec: {color: [170, 48, 30], alpha: 0.3, y: 0.4, thick: 0.36, speed: 1, seed: 8}},
      {t: 'embers', n: 90, seed: 2, box: [26, 36, 4, 56, 58, 5], rise: 13, colors: EMB_GOLD, ash: 0.3, size: 1.15, cycles: 1, wind: 1},
      {t: 'portal', at: [51, 34, 13], n: 22, seed: 6},
      {t: 'sparks', at: [47, 44, 6], start: 70, seed: 5, n: 12},
      {t: 'sparks', at: [41, 44, 6], start: 150, seed: 9, n: 12},
      // lava pops / fortress embers
      ...sparksAt([[44, 48, 6], [38, 46, 6], [50, 42, 6], [46, 40, 6], [40, 50, 5]], [380, 610, 830, 1060, 1290, 1520, 1760, 1990, 2210], 30),
    ],
  },
  end: {
    id: 'end',
    seed: 9,
    build: genEnd,
    look: endLook,
    geom: GEOM_STD([42, 44, 10]),
    camera: drift(120, 30, 0.9, 0.97, 0.2, {kind: 'eight', phase: 0.25, x: 110, y: 28, zoom: 0.025, zoomCycles: 2}),
    post: post({
      bloom: {tight: 0.36, wide: 0.34, threshold: 0.66},
      vignette: 0.46,
      // the void light slides between violet and cyan-white
      breath: [
        {mode: 'screen', color: [200, 90, 255], alpha: 0.08, period: 1200},
        {mode: 'screen', color: [110, 190, 255], alpha: 0.05, period: 800, phase: 0.5},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'pool', at: [39, 53, 12], color: [250, 150, 250], radius: 8, alpha: 0.24, flicker: 0.2},
      {t: 'embers', n: 80, seed: 4, box: [30, 38, 9, 52, 56, 10], rise: 7, colors: ['#f4aafa', '#fa8ff4', '#dc93fc', '#ffffff'], size: 1, cycles: 1, wind: 0.2},
      {t: 'motes', n: 90, seed: 9, box: [18, 24, 8, 66, 68, 16], color: '#e8b8ff', alpha: 0.7},
    ],
  },
  snow: {
    id: 'snow',
    seed: 4,
    build: genSnow,
    look: snowLook,
    geom: GEOM_STD([40, 45, 7]),
    camera: drift(120, 26, 0.9, 0.96, 0.2, {kind: 'pan', phase: 0.5, x: 115, y: 20, zoom: 0.02, zoomCycles: 1}),
    post: post({
      bloom: {tight: 0.34, wide: 0.28, threshold: 0.7},
      vignette: 0.4,
      // pale light from behind the clouds comes and goes
      breath: [
        {mode: 'screen', color: [170, 205, 255], alpha: 0.07, period: 1200},
        {mode: 'multiply', color: [150, 170, 220], alpha: 0.1, period: 800, phase: 0.4},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'fog', spec: {color: [150, 178, 220], alpha: 0.3, y: 0.3, thick: 0.34, speed: 1, seed: 5}},
      {t: 'snow', n: 120, seed: 3, wind: 0.25},
    ],
  },
  camp: {
    id: 'camp',
    seed: 6,
    build: genCamp,
    look: campLook,
    geom: GEOM_STD([42, 41, 8]),
    camera: drift(130, 30, 0.9, 0.97, 0.2, {kind: 'circle', dir: -1, phase: 0.5, x: 105, y: 28, zoom: 0.025, zoomCycles: 2}),
    post: post({
      bloom: {tight: 0.36, wide: 0.3, threshold: 0.62},
      vignette: 0.5,
      // firelight and portal glow trade places over the night
      breath: [
        {mode: 'screen', color: [255, 150, 70], alpha: 0.06, period: 800},
        {mode: 'screen', color: [160, 90, 255], alpha: 0.06, period: 1200, phase: 0.5},
      ],
    }),
    loop: SCENE_LOOP,
    fx: [
      {t: 'fog', spec: {color: [70, 60, 150], alpha: 0.28, y: 0.32, thick: 0.34, speed: 1, seed: 11}},
      {t: 'pool', at: [42.5, 34.5, 8], color: [190, 70, 255], radius: 5, alpha: 0.22, flicker: 0.3},
      {t: 'portal', at: [42.5, 34, 10], n: 18, seed: 4},
      {t: 'beam', at: [37.5, 51.5, 7.1], kind: 'magenta', width: 80},
      {t: 'emerald', at: [45.5, 49.5, 8.6], phase: 0},
      {t: 'embers', n: 14, seed: 7, box: [41, 45, 7, 44, 47, 7], rise: 4, colors: EMB_GOLD, size: 1, cycles: 1},
      {t: 'fireflies', n: 22, seed: 12, box: [24, 26, 5, 62, 62, 10]},
    ],
  },
  'world-map': {
    id: 'world-map',
    seed: 2,
    build: genWorldMap,
    look: mapLook,
    geom: mkGeom({tw: 22, th: 11, hz: 12, anchor: [88, 88, 30], zoomMin: 0.56, panX: 560, panY: 90}),
    // from/to = the legacy one-shot fly-over (still available with camera={{mode:'ease'}}); the default is a slow closed orbit around their midpoint
    camera: {from: {x: 520, y: -50, zoom: 0.58}, to: {x: -520, y: 30, zoom: 0.72}, mode: 'loop', orbit: {kind: 'circle', x: 230, y: 36, zoom: 0.035, zoomCycles: 2}},
    post: post({
      bloom: {tight: 0.12, wide: 0.1, threshold: 0.86},
      vignette: 0.16,
      vignetteColor: [150, 120, 90],
      // parchment light: a warm glow and a faint cool shade pass over the table
      breath: [
        {mode: 'screen', color: [255, 236, 200], alpha: 0.06, period: 1200},
        {mode: 'multiply', color: [225, 215, 205], alpha: 0.07, period: 800, phase: 0.5},
      ],
    }),
    loop: SCENE_LOOP,
    autoFlames: false,
    // soft cloud shadows slide over the island (the only motion besides the camera, so keep them gentle)
    fx: [{t: 'clouds', strength: 0.2, seed: 6, scale: 1.3}],
  },
};

export type CameraPreset = 'drift' | 'push' | 'pull' | 'static';

export type ScenePlateProps = {
  biome: BiomeId;
  /** Terrain seed (default: the biome's own). */
  seed?: number;
  /** Loop length in frames (default 2400 = 80 s; 192 for the 'push'/'pull' presets, which are one-shot dollies). Particles, light and the 'drift' camera repeat exactly over it. */
  loop?: number;
  /** 'drift' = the biome's own slow closed orbit (default, seamless over the loop); 'push' = slow ease-in dolly; 'pull' = ease-out; 'static' = locked; or a CameraSpec override. */
  camera?: CameraPreset | Partial<CameraSpec>;
  /** Shallow depth of field (blurred top/bottom bands) - for loading screens and close-ups only. */
  dof?: boolean;
  /** 0..1 extra darkening vignette on top of the biome's own (handy under UI). */
  dim?: number;
  /** Start the loop at another phase. */
  frameOffset?: number;
};

const presetCamera = (spec: SceneSpec, p: CameraPreset): Partial<CameraSpec> | undefined => {
  const c = spec.camera;
  const mid = {x: (c.from.x + c.to.x) / 2, y: (c.from.y + c.to.y) / 2, zoom: (c.from.zoom + c.to.zoom) / 2};
  if (p === 'drift') return undefined;
  if (p === 'static') return {from: mid, to: mid, mode: 'linear', sway: undefined};
  if (p === 'push') return {from: {x: mid.x - 40, y: mid.y + 30, zoom: mid.zoom * 0.94}, to: {x: mid.x + 40, y: mid.y - 20, zoom: mid.zoom * 1.1}, mode: 'ease', sway: undefined};
  return {from: {x: mid.x + 40, y: mid.y - 20, zoom: mid.zoom * 1.1}, to: {x: mid.x - 40, y: mid.y + 30, zoom: mid.zoom * 0.94}, mode: 'ease', sway: undefined};
};

/** Reusable full-frame scene background. See engine.tsx for the pipeline. */
export const ScenePlate: FC<ScenePlateProps> = ({biome, seed, loop, camera, dof, dim, frameOffset}) => {
  const spec = SCENES[biome];
  const cam = typeof camera === 'string' ? presetCamera(spec, camera) : camera;
  const post: Partial<PostSpec> = {};
  if (dof) post.dof = {top: 0.22, bottom: 0.2, px: 6};
  if (dim) post.vignette = Math.min(1, spec.post.vignette + dim);
  // push / pull are one-shot dollies: they keep the legacy 192-frame run unless the caller says otherwise
  const lp = loop ?? (camera === 'push' || camera === 'pull' ? 192 : undefined);
  return <SceneCanvas spec={spec} seed={seed} loop={lp} camera={cam} post={Object.keys(post).length ? post : undefined} frameOffset={frameOffset} />;
};

export type {FxSpec, RGB};
