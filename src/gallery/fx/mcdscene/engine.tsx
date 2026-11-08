/**
 * mcdscene engine: Minecraft-Dungeons-style lit voxel scenes drawn with Canvas 2D, driven only by useCurrentFrame().
 *
 * USAGE
 *   // 1. Drop a ready-made background plate under your UI / transition (scenes.tsx):
 *   //    <ScenePlate biome="forest-night" />      biomes: forest-day forest-night desert nether end snow world-map camp
 *   //    <ScenePlate biome="nether" loop={192} camera="push" seed={7} dof dim={0.2} />
 *   //      camera: 'drift' (looping pan, default) | 'push' | 'pull' | 'static' | Partial<CameraSpec>
 *   //      dof: shallow depth of field (loading screens / close-ups only); dim: extra vignette under UI
 *   // 2. Or build your own scene: write a SceneSpec ({build: seed => World, look, geom, camera, post, fx}) and render it with
 *   //    <SceneCanvas spec={spec} />. World building helpers: World, B (block ids), tree, spruce, cactus, boulder, portal.
 *   // 3. Reusable effects on any transparent layer: <FxLayer draw={(ctx, view) => beam(ctx, view, {...})} /> or the wrappers
 *   //    <LootBeam kind="magenta|white|green|orange"/>, <EmberField/>, <FireflyField/>, <SnowField/>, <SoulStream/>,
 *   //    <LightningBolts/>, <EmeraldSpin/>, <HitSparks/>. In FxLayer, grid coords are plain screen pixels.
 *
 * PIPELINE (bake once, composite per frame)
 *   world gen (seeded) -> bake.ts: isometric software raster, texel lighting (top 1.0 : left 0.78 : right 0.60), sun shadows
 *   (x0.58-0.7, texel-ragged edges), AO, BFS point-light volume (torches, lava, portal), fog, split-tone grade -> buffer canvas.
 *   per frame: animate liquids (lava/water/portal textures) -> keystone-warped camera blit -> dynamic fx (flames, light pools,
 *   particles, lightning, beams, rays, fog) -> double bloom (1% / 5% frame width) -> grade -> vignette -> optional shallow DoF.
 *   Every periodic motion (camera loop, particles, flicker, liquids) completes an integer number of cycles per `loop` frames.
 *   LONG LOOPS (ScenePlate default = 2400 frames = 80 s, for ambient video backgrounds): each motion keeps its own natural period
 *   (flame sprites ~3 f, flicker 8-30 f, liquids 48-96 f, ember/soul/snow lives ~100-200 f, light shafts 240-400 f, fog/cloud drift ~1200 f
 *   per tile, camera = one closed orbit per loop, PostSpec.breath = slow light swells), never "one cycle per loop". Particles re-seed on every
 *   life, and frame 0 == frame `loop` exactly. Legacy short loops (<= 450 f) keep their old behaviour.
 *
 * API (exports)
 *   SceneSpec, Look, Geom, CameraSpec, PostSpec, FxSpec        types
 *   SceneCanvas({spec, loop?, seed?, camera?, post?, frameOffset?})   renders one scene to a 1920x1080 canvas
 *   renderScene(ctx, baked, spec, frame, loop, camOverride?)   low-level one-frame renderer (used by SceneCanvas)
 *   bakeScene(spec, seed) -> Promise<Baked>                    cached bake (textures are fetched automatically)
 *   cameraAt(spec.camera, frame, loop) -> CameraState          camera path evaluation
 *   FX primitives (fx.ts): lightPool flame embers fireflies snowfall motes souls lightning beam hitSparks dustPuff spinItem
 *                          portalMotes godRays fogBand cloudShadows pulse cyc
 */
import {useLayoutEffect, useRef, useState, type FC} from 'react';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';
import {BLOCKS, B, BLOCK_NAMES, texturesOf} from './blocks';
import {bakeWorld, type Baked, type Geom, type Look} from './bake';
import {getTex, loadTextures, texCanvas, texesLoaded} from './tex';
import {World} from './world';
import * as FX from './fx';
import {clamp, rgbCss, type RGB} from './rng';

export type {Baked, Geom, Look} from './bake';
export {World, tree, spruce, cactus, boulder, portal, torchAt} from './world';
export {B, BLOCKS} from './blocks';
export * from './fx';

export type CameraKey = {
  /** Offset of the view centre from the scene anchor, in buffer pixels. */
  x: number;
  y: number;
  /** Buffer px -> screen px scale (tile width on screen = geom.tw * zoom). */
  zoom: number;
};

/** Closed camera path around the midpoint of from/to (used when mode is 'loop'): one full path (x cycles) per loop. */
export type CameraOrbit = {
  /** circle: x=cos, y=sin | eight: x=sin(p), y=sin(2p) | pan: x=sin(p) back-and-forth with a tiny vertical wobble. */
  kind: 'circle' | 'eight' | 'pan';
  /** Amplitudes in buffer px. */
  x: number;
  y: number;
  /** Zoom breathing amplitude (+-) and how many breaths per loop (default 2) / phase (0..1). */
  zoom?: number;
  zoomCycles?: number;
  zoomPhase?: number;
  /** Path repeats per loop (default 1) and start phase (0..1); dir -1 runs it backwards. */
  cycles?: number;
  phase?: number;
  dir?: 1 | -1;
};

export type CameraSpec = {
  from: CameraKey;
  to: CameraKey;
  /** loop = from -> to -> from (cosine, seamless; or the closed `orbit` path if given); ease = smooth once; linear = constant speed once. */
  mode: 'loop' | 'ease' | 'linear';
  /** Closed slow drift for long ambient loops. Ignored unless mode is 'loop'. */
  orbit?: CameraOrbit;
  /** Keystone strength: >0 makes far rows narrower (perspective feel). 0 = pure isometric. */
  persp?: number;
  /** Extra vertical stretch of the picture (tilt): 0.1 = looking a bit more from above. */
  tilt?: number;
  /** Small periodic hand-held drift added on top (buffer px). */
  sway?: {x: number; y: number; zoom?: number};
};

export type CameraState = {cx: number; cy: number; z: number; kk: number; vs: number};

export type FxSpec =
  | {t: 'pool'; at: [number, number, number]; color: RGB; radius: number; alpha: number; flicker?: number}
  | ({t: 'embers'; rise?: number; colors?: string[]; ash?: number; size?: number; cycles?: number; wind?: number} & FX.FieldBase)
  | ({t: 'fireflies'; color?: string; halo?: RGB; size?: number} & FX.FieldBase)
  | ({t: 'motes'; color?: string; size?: number; alpha?: number} & FX.FieldBase)
  | {t: 'snow'; n: number; seed: number; wind?: number; size?: number; speed?: number}
  | {t: 'souls'; n: number; seed: number; from: [number, number, number]; to: [number, number, number]; spread?: number; cycles?: number; size?: number; arc?: number}
  | {t: 'lightning'; strikes: {frame: number; at: [number, number, number]; seed: number}[]; flash?: number}
  | {t: 'beam'; at: [number, number, number]; kind?: FX.BeamKind; width?: number; alpha?: number; sparkles?: number}
  | {t: 'rays'; spec: FX.RaysSpec}
  | {t: 'fog'; spec: FX.FogSpec}
  | {t: 'clouds'; strength: number; seed: number; scale?: number}
  | {t: 'portal'; at: [number, number, number]; n: number; seed: number}
  | {t: 'sparks'; at: [number, number, number]; start: number; seed: number; n?: number; scale?: number}
  | {t: 'dust'; at: [number, number, number]; start: number; seed: number; size?: number}
  | {t: 'emerald'; at: [number, number, number]; size?: number; phase?: number}
  | {t: 'sparkle'; n?: number};

export type PostSpec = {
  bloom: {tight: number; wide: number; threshold: number; tint?: RGB};
  vignette: number;
  vignetteColor?: RGB;
  /** Colour wash: blend mode + colour + alpha. */
  wash?: {mode: GlobalCompositeOperation; color: RGB; alpha: number}[];
  /** Raise the black level (lighten blend). */
  lift?: RGB;
  sat?: number;
  contrast?: number;
  dof?: {top: number; bottom: number; px: number};
  /** Optional top-to-bottom gradient overlay (haze at the top). */
  haze?: {color: RGB; alpha: number; height: number};
  /** Slow ambient light swells for long loops: each wash fades 0 -> alpha -> 0 once per `period` frames (rounded to whole cycles per loop). */
  breath?: {mode: GlobalCompositeOperation; color: RGB; alpha: number; period: number; phase?: number}[];
};

export type SceneSpec = {
  id: string;
  seed: number;
  build: (seed: number) => World;
  look: Look;
  geom: Geom;
  camera: CameraSpec;
  post: PostSpec;
  fx?: FxSpec[];
  loop: number;
  /** Extra textures the fx need. */
  textures?: string[];
  /** Draw pixel flames + light pools for torches/campfires automatically (default true). */
  autoFlames?: boolean;
};

// ---------------------------------------------------------------------------------------------------------------------
// camera

/** Set true to log bake/frame timings to the browser console. */
const DEBUG = false;

const ease = (t: number) => t * t * (3 - 2 * t);
export const cameraAt = (c: CameraSpec, frame: number, loop: number): CameraState => {
  const t = frame / loop;
  if (c.mode === 'loop' && c.orbit) {
    const o = c.orbit;
    const ph = (t * (o.cycles ?? 1) + (o.phase ?? 0)) * Math.PI * 2 * (o.dir ?? 1);
    const dx = o.kind === 'circle' ? Math.cos(ph) : Math.sin(ph);
    const dy = o.kind === 'circle' ? Math.sin(ph) : o.kind === 'eight' ? Math.sin(2 * ph) : Math.sin(3 * ph + 0.6) * 0.35;
    const zb = (o.zoom ?? 0) * Math.sin((t * (o.zoomCycles ?? 2) + (o.zoomPhase ?? 0)) * Math.PI * 2);
    return {
      cx: (c.from.x + c.to.x) / 2 + dx * o.x,
      cy: (c.from.y + c.to.y) / 2 + dy * o.y,
      z: (c.from.zoom + c.to.zoom) / 2 + zb,
      kk: c.persp ?? 0,
      vs: 1 + (c.tilt ?? 0),
    };
  }
  const u = c.mode === 'loop' ? 0.5 - 0.5 * Math.cos(t * Math.PI * 2) : c.mode === 'ease' ? ease(clamp(t)) : clamp(t);
  const sw = c.sway;
  const ph = t * Math.PI * 2;
  const x = c.from.x + (c.to.x - c.from.x) * u + (sw ? Math.sin(ph) * sw.x : 0);
  const y = c.from.y + (c.to.y - c.from.y) * u + (sw ? Math.sin(ph * 2 + 1) * sw.y : 0);
  const z = c.from.zoom + (c.to.zoom - c.from.zoom) * u + (sw?.zoom ? Math.sin(ph + 2) * sw.zoom : 0);
  return {cx: x, cy: y, z, kk: c.persp ?? 0, vs: 1 + (c.tilt ?? 0)};
};

// ---------------------------------------------------------------------------------------------------------------------
// bake cache

type Entry = {baked: Baked | null; promise: Promise<Baked> | null; world: World | null};
const entries = new Map<string, Entry>();

const entryKey = (spec: SceneSpec, seed: number) => `${spec.id}#${seed}#${spec.geom.bufW}x${spec.geom.bufH}`;

/** Build + bake a scene (cached). Fetches every texture the world and fx need. */
export const bakeScene = (spec: SceneSpec, seed = spec.seed): Promise<Baked> => {
  const key = entryKey(spec, seed);
  let e = entries.get(key);
  if (e?.promise) return e.promise;
  e = {baked: null, promise: null, world: null};
  entries.set(key, e);
  const entry = e;
  entry.promise = (async () => {
    const world = spec.build(seed);
    entry.world = world;
    const used = new Set<number>();
    for (let i = 0; i < world.blocks.length; i++) used.add(world.blocks[i]);
    const names = [...texturesOf(used), ...(spec.textures ?? []), ...((spec.fx ?? []).some((q) => q.t === 'emerald') ? ['item/emerald'] : []), 'block/water_still', 'block/lava_still', 'block/nether_portal', 'block/grass_block_top', 'block/grass_block_side_overlay'];
    await loadTextures(names);
    // yield once so the browser can breathe between loading and the long synchronous bake
    await new Promise((r) => setTimeout(r, 0));
    const t0 = performance.now();
    const baked = bakeWorld({world, look: spec.look, geom: spec.geom, seed});
    // eslint-disable-next-line no-console
    if (DEBUG) console.log('MCD bake ms', Math.round(performance.now() - t0), spec.id);
    entry.baked = baked;
    return baked;
  })();
  return entry.promise;
};
export const bakedIfReady = (spec: SceneSpec, seed = spec.seed): Baked | null => entries.get(entryKey(spec, seed))?.baked ?? null;

// ---------------------------------------------------------------------------------------------------------------------
// liquids

const ANIM = {
  water: {tex: 'block/water_still', natural: 96, seq: null as number[] | null},
  lava: {tex: 'block/lava_still', natural: 96, seq: [...Array.from({length: 20}, (_, i) => i), ...Array.from({length: 18}, (_, i) => 18 - i)]},
  portal: {tex: 'block/nether_portal', natural: 48, seq: null as number[] | null},
};
const KIND_ANIM = [null, ANIM.water, ANIM.lava, ANIM.portal] as const;

let dirtyCache = new WeakMap<Baked, {x: number; y: number; w: number; h: number}>();
const updateLiquids = (b: Baked, frame: number, loop: number) => {
  const L = b.liquid;
  if (!L) return;
  const data = b.img.data;
  const frameOffsets = [0, 0, 0, 0];
  const texData: (Uint8ClampedArray | null)[] = [null, null, null, null];
  for (let k = 1; k <= 3; k++) {
    const a = KIND_ANIM[k]!;
    const t = getTex(a.tex);
    const cycles = Math.max(1, Math.round(loop / a.natural));
    const ph = (frame * cycles) / loop;
    const p = ph - Math.floor(ph);
    const n = a.seq ? a.seq.length : t.frames;
    const pos = Math.floor(p * n) % n;
    const f = a.seq ? a.seq[pos] : pos;
    frameOffsets[k] = f * 1024;
    texData[k] = t.data;
  }
  const { idx, texel, kind, scale, add, n } = L;
  for (let i = 0; i < n; i++) {
    const td = texData[kind[i]]!;
    const to = frameOffsets[kind[i]] + texel[i] * 4;
    const o = idx[i] * 4;
    const s3 = i * 3;
    data[o] = (td[to] * scale[s3]) / 64 + add[s3];
    data[o + 1] = (td[to + 1] * scale[s3 + 1]) / 64 + add[s3 + 1];
    data[o + 2] = (td[to + 2] * scale[s3 + 2]) / 64 + add[s3 + 2];
  }
  let d = dirtyCache.get(b);
  if (!d) {
    let x0 = b.w;
    let y0 = b.h;
    let x1 = 0;
    let y1 = 0;
    for (let i = 0; i < n; i++) {
      const x = idx[i] % b.w;
      const y = (idx[i] / b.w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    d = {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1};
    dirtyCache.set(b, d);
  }
  b.canvas.getContext('2d')!.putImageData(b.img, 0, 0, d.x, d.y, d.w, d.h);
};
void dirtyCache;
dirtyCache = new WeakMap();

// ---------------------------------------------------------------------------------------------------------------------
// view + warp

const toScreen = (c: CameraState, bx: number, by: number, W: number, H: number) => {
  const dy = (by - c.cy) * c.z * c.vs;
  const m = 1 + (c.kk * dy) / H;
  return {x: W / 2 + (bx - c.cx) * c.z * m, y: H / 2 + dy + (c.kk * dy * dy) / (2 * H), s: c.z * m};
};

/** Draw the baked buffer through the camera as thin horizontal strips (this is what makes the keystone perspective). */
const warpDraw = (ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, c: CameraState, W: number, H: number, strip = 3) => {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const kk = c.kk;
  for (let Y = 0; Y < H; Y += strip) {
    const S = Math.min(strip, H - Y);
    const t = Y + S / 2 - H / 2;
    const dy = Math.abs(kk) < 1e-5 ? t : ((Math.sqrt(Math.max(0.0001, 1 + (2 * kk * t) / H)) - 1) * H) / kk;
    const m = 1 + (kk * dy) / H;
    const zz = c.z * m;
    const sw = W / zz;
    const sx0 = c.cx - sw / 2;
    const by = c.cy + dy / (c.z * c.vs);
    const sh = S / (m * c.z * c.vs);
    ctx.drawImage(src, sx0, by - sh / 2, sw, sh, 0, Y, W, S);
  }
};

// ---------------------------------------------------------------------------------------------------------------------
// post

const scratch = new Map<string, HTMLCanvasElement>();
const getScratch = (key: string, w: number, h: number) => {
  let c = scratch.get(key);
  if (!c || c.width !== w || c.height !== h) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    scratch.set(key, c);
  }
  return c;
};

const bloomPass = (ctx: CanvasRenderingContext2D, W: number, H: number, o: PostSpec['bloom']) => {
  const w4 = Math.round(W / 4);
  const h4 = Math.round(H / 4);
  const small = getScratch('bloom-small', w4, h4);
  const sg = small.getContext('2d')!;
  const T = clamp(o.threshold, 0.2, 0.9);
  sg.clearRect(0, 0, w4, h4);
  sg.save();
  sg.filter = `brightness(${(0.375 / T).toFixed(3)}) contrast(4)`;
  sg.imageSmoothingEnabled = true;
  sg.drawImage(ctx.canvas, 0, 0, w4, h4);
  sg.restore();
  const tint = o.tint;
  // tight (1% of frame width) and wide (5%) blurs
  const tight = getScratch('bloom-tight', w4, h4);
  const tg = tight.getContext('2d')!;
  tg.clearRect(0, 0, w4, h4);
  tg.filter = `blur(${Math.max(1, (W * 0.01) / 4)}px)`;
  tg.drawImage(small, 0, 0);
  tg.filter = 'none';
  const w8 = Math.round(W / 8);
  const h8 = Math.round(H / 8);
  const tiny = getScratch('bloom-tiny', w8, h8);
  const yg = tiny.getContext('2d')!;
  yg.clearRect(0, 0, w8, h8);
  yg.drawImage(small, 0, 0, w8, h8);
  const wide = getScratch('bloom-wide', w8, h8);
  const wg = wide.getContext('2d')!;
  wg.clearRect(0, 0, w8, h8);
  wg.filter = `blur(${Math.max(1, (W * 0.05) / 8)}px)`;
  wg.drawImage(tiny, 0, 0);
  wg.filter = 'none';
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = clamp(o.wide, 0, 1);
  ctx.drawImage(wide, 0, 0, W, H);
  ctx.globalAlpha = clamp(o.tight, 0, 1);
  ctx.drawImage(tight, 0, 0, W, H);
  if (tint) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(o.wide, 0, 1) * 0.35;
    ctx.fillStyle = rgbCss(tint, 1);
    ctx.drawImage(wide, 0, 0, W, H);
  }
  ctx.restore();
};

const DEFAULT_FLAME_BLOCKS = new Set(['torch', 'soul_torch', 'campfire', 'soul_campfire']);
const GLOW_BLOCKS = new Set(['lantern', 'soul_lantern', 'redstone_lamp', 'shroom_glow', 'pink_cube', 'end_rod']);

// ---------------------------------------------------------------------------------------------------------------------
// the frame renderer

export const renderScene = (ctx: CanvasRenderingContext2D, baked: Baked, spec: SceneSpec, frame: number, loop: number, camOverride?: Partial<CameraSpec>) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const camSpec: CameraSpec = {...spec.camera, ...camOverride};
  // a caller that supplies its own from/to means its own path: drop the biome's closed orbit unless it passes one too
  if (camOverride && (camOverride.from || camOverride.to) && !camOverride.orbit) camSpec.orbit = undefined;
  const cam = cameraAt(camSpec, frame, loop);
  const g = baked.geom;
  // camera offsets are relative to the buffer centre
  const c: CameraState = {...cam, cx: baked.w / 2 + cam.cx, cy: baked.h / 2 + cam.cy};
  updateLiquids(baked, frame, loop);

  ctx.save();
  ctx.fillStyle = rgbCss(spec.look.skyHorizon);
  ctx.fillRect(0, 0, W, H);
  warpDraw(ctx, baked.canvas, c, W, H);
  ctx.restore();

  const view: FX.View = {
    W,
    H,
    frame,
    loop,
    tw: g.tw * c.z,
    ratio: g.th / g.tw,
    proj: (gx, gy, gz) => {
      const p = baked.proj(gx, gy, gz);
      return toScreen(c, p.x, p.y, W, H);
    },
  };

  // --- clouds first (they live on the ground)
  const fxs = spec.fx ?? [];
  for (const f of fxs) if (f.t === 'clouds') FX.cloudShadows(ctx, view, f);

  // --- automatic flames and light pools from emitter blocks
  if (spec.autoFlames !== false) {
    let k = 0;
    for (const e of baked.emitters) {
      const name = BLOCK_NAMES[e.id];
      if (!DEFAULT_FLAME_BLOCKS.has(name) || !e.vis) continue;
      const camp = name.includes('campfire');
      const soul = name.startsWith('soul');
      const at: [number, number, number] = [e.x + 0.5, e.y + 0.5, e.z + (camp ? 0.4 : 0.66)];
      const fl = 0.78 + 0.22 * FX.pulse(view, 3.8, k * 2.3) * FX.pulse(view, 1.6, k);
      const col: RGB = soul ? [80, 210, 225] : [255, 170, 80];
      FX.lightPool(ctx, view, {at: [e.x + 0.5, e.y + 0.5, e.z + 0.05], color: col, radius: camp ? 6.5 : 4.8, alpha: (camp ? 0.34 : 0.26) * fl});
      FX.flame(ctx, view, {at, soul, scale: camp ? 2.1 : 1, seed: k});
      k++;
    }
  }

  // --- glow-only emitters (lanterns, lamps, glowing mushrooms): a pool and a tight hot core
  if (spec.autoFlames !== false) {
    const seen = new Set<string>();
    for (const e of baked.emitters) {
      const name = BLOCK_NAMES[e.id];
      if (!GLOW_BLOCKS.has(name) || !e.vis) continue;
      const key = `${e.x >> 1},${e.y >> 1},${e.z >> 1},${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const em = BLOCKS[e.id].emit!;
      const p = view.proj(e.x + 0.5, e.y + 0.5, e.z + 0.5);
      if (p.x < -200 || p.x > W + 200 || p.y < -200 || p.y > H + 200) continue;
      const fl = 0.85 + 0.15 * FX.pulse(view, 2.4, e.x * 1.7 + e.y);
      FX.lightPool(ctx, view, {at: [e.x + 0.5, e.y + 0.5, e.z + 0.02], color: em.color, radius: name === 'pink_cube' ? 5.5 : name === 'shroom_glow' ? 2.4 : 3.2, alpha: (spec.look.pointGain < 0.9 ? 0.13 : 0.2) * fl});
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const r = view.tw * p.s * 0.55;
      const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      gg.addColorStop(0, rgbCss(em.color, 0.55 * fl));
      gg.addColorStop(1, rgbCss(em.color, 0));
      ctx.fillStyle = gg;
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      ctx.restore();
    }
  }

  // --- spec fx in order
  for (const f of fxs) {
    switch (f.t) {
      case 'pool': {
        const fl = f.flicker ? 1 - f.flicker + f.flicker * (0.5 + 0.5 * FX.pulse(view, 3.3, f.at[0]) * FX.pulse(view, 1.4, f.at[1])) : 1;
        FX.lightPool(ctx, view, {at: f.at, color: f.color, radius: f.radius, alpha: f.alpha * fl});
        break;
      }
      case 'embers':
        FX.embers(ctx, view, f);
        break;
      case 'fireflies':
        FX.fireflies(ctx, view, f);
        break;
      case 'motes':
        FX.motes(ctx, view, f);
        break;
      case 'snow':
        FX.snowfall(ctx, view, f);
        break;
      case 'souls':
        FX.souls(ctx, view, f);
        break;
      case 'lightning':
        FX.lightning(ctx, view, f);
        break;
      case 'beam': {
        const p = view.proj(f.at[0], f.at[1], f.at[2]);
        FX.beam(ctx, view, {x: p.x, y: p.y, kind: f.kind, width: f.width ?? view.tw * 0.8, alpha: f.alpha, sparkles: f.sparkles});
        break;
      }
      case 'rays':
        FX.godRays(ctx, view, f.spec);
        break;
      case 'fog':
        FX.fogBand(ctx, view, f.spec);
        break;
      case 'portal':
        FX.portalMotes(ctx, view, f);
        break;
      case 'sparks': {
        const p = view.proj(f.at[0], f.at[1], f.at[2]);
        FX.hitSparks(ctx, view, {x: p.x, y: p.y, start: f.start, seed: f.seed, n: f.n, scale: (f.scale ?? 1) * (W / 1920)});
        break;
      }
      case 'dust': {
        const p = view.proj(f.at[0], f.at[1], f.at[2]);
        FX.dustPuff(ctx, view, {x: p.x, y: p.y, start: f.start, seed: f.seed, size: f.size});
        break;
      }
      case 'emerald': {
        const p = view.proj(f.at[0], f.at[1], f.at[2]);
        FX.spinItem(ctx, view, {img: texCanvas('item/emerald'), x: p.x, y: p.y, size: f.size ?? view.tw * 0.62, phase: f.phase ?? 0, glow: [88, 208, 56], sparkle: true});
        break;
      }
      case 'sparkle': {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        const spots = baked.waterSpots;
        const q = Math.max(2, Math.round((W / 1920) * 4));
        const n = Math.min(spots.length, f.n ?? 220);
        for (let i = 0; i < n; i++) {
          // each glint lives ~100-200 frames and hops to another water texel on its next life (invisible: it is dark between lives)
          const {a, g} = FX.clock(view, 1 + (i % 2), i * 0.173);
          const sp = spots[(i * 37 + g * 101) % spots.length];
          const al = Math.max(0, Math.sin(a * Math.PI * 2));
          if (al < 0.55) continue;
          const p = toScreen(c, sp.x, sp.y, W, H);
          if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) continue;
          ctx.globalAlpha = (al - 0.5) * 1.6;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), q, q);
        }
        ctx.restore();
        break;
      }
      default:
        break;
    }
  }

  // --- post
  const P = spec.post;
  if (P.haze) {
    const gr = ctx.createLinearGradient(0, 0, 0, H * P.haze.height);
    gr.addColorStop(0, rgbCss(P.haze.color, P.haze.alpha));
    gr.addColorStop(1, rgbCss(P.haze.color, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H * P.haze.height);
  }
  bloomPass(ctx, W, H, P.bloom);
  if (P.wash) {
    for (const w of P.wash) {
      ctx.save();
      ctx.globalCompositeOperation = w.mode;
      ctx.fillStyle = rgbCss(w.color, w.alpha);
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
  if (P.breath) {
    for (const b of P.breath) {
      const cycles = Math.max(1, Math.round(loop / b.period));
      const u = 0.5 - 0.5 * Math.cos(Math.PI * 2 * ((frame * cycles) / loop + (b.phase ?? 0)));
      if (b.alpha * u < 0.002) continue;
      ctx.save();
      ctx.globalCompositeOperation = b.mode;
      ctx.fillStyle = rgbCss(b.color, b.alpha * u);
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
  if (P.lift) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillStyle = rgbCss(P.lift, 1);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if ((P.sat && P.sat !== 1) || (P.contrast && P.contrast !== 1)) {
    const tmp = getScratch('grade', W, H);
    const tg = tmp.getContext('2d')!;
    tg.clearRect(0, 0, W, H);
    tg.drawImage(ctx.canvas, 0, 0);
    ctx.save();
    ctx.filter = `saturate(${P.sat ?? 1}) contrast(${P.contrast ?? 1})`;
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }
  if (P.dof) {
    const tmp = getScratch('dof', W, H);
    const tg = tmp.getContext('2d')!;
    tg.clearRect(0, 0, W, H);
    tg.filter = `blur(${P.dof.px}px)`;
    tg.drawImage(ctx.canvas, 0, 0);
    tg.filter = 'none';
    tg.globalCompositeOperation = 'destination-in';
    const mk = tg.createLinearGradient(0, 0, 0, H);
    mk.addColorStop(0, 'rgba(0,0,0,1)');
    mk.addColorStop(P.dof.top, 'rgba(0,0,0,0)');
    mk.addColorStop(1 - P.dof.bottom, 'rgba(0,0,0,0)');
    mk.addColorStop(1, 'rgba(0,0,0,1)');
    tg.fillStyle = mk;
    tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'source-over';
    ctx.drawImage(tmp, 0, 0);
  }
  if (P.vignette > 0) {
    const vg = ctx.createRadialGradient(W / 2, H * 0.47, H * 0.32, W / 2, H * 0.5, H * 1.05);
    const vc = P.vignetteColor ?? [0, 0, 0];
    vg.addColorStop(0, rgbCss(vc, 0));
    vg.addColorStop(0.55, rgbCss(vc, P.vignette * 0.22));
    vg.addColorStop(1, rgbCss(vc, P.vignette));
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
};

// ---------------------------------------------------------------------------------------------------------------------
// React components

export type SceneCanvasProps = {
  spec: SceneSpec;
  /** Loop length in frames (defaults to spec.loop). Particles and camera loops are periodic over this. */
  loop?: number;
  seed?: number;
  camera?: Partial<CameraSpec>;
  /** Override parts of the post chain (e.g. {dof: {...}, vignette: 0.6}). */
  post?: Partial<PostSpec>;
  /** Added to the current frame (to start the loop at another phase). */
  frameOffset?: number;
  style?: React.CSSProperties;
};

/** Renders one scene to a 1920x1080 canvas that scales to its container. */
export const SceneCanvas: FC<SceneCanvasProps> = ({spec: baseSpec, loop, seed, camera, post, frameOffset = 0, style}) => {
  const spec = post ? {...baseSpec, post: {...baseSpec.post, ...post}} : baseSpec;
  const frame = useCurrentFrame() + frameOffset;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sd = seed ?? spec.seed;
  const [, bump] = useState(0);
  const [handle] = useState<number | null>(() => (bakedIfReady(spec, sd) ? null : delayRender(`mcdscene bake ${spec.id}`, {timeoutInMilliseconds: 180000})));
  const released = useRef(false);

  useLayoutEffect(() => {
    let alive = true;
    const baked = bakedIfReady(spec, sd);
    if (!baked) {
      bakeScene(spec, sd).then(
        () => alive && bump((n) => n + 1),
        (err) => {
          // eslint-disable-next-line no-console
          console.error('mcdscene bake failed', err);
          if (handle !== null && !released.current) {
            released.current = true;
            continueRender(handle);
          }
        },
      );
      return () => {
        alive = false;
      };
    }
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    const t0 = performance.now();
    renderScene(ctx, baked, spec, frame, loop ?? spec.loop, camera);
    // eslint-disable-next-line no-console
    if (DEBUG) console.log('MCD frame ms', Math.round(performance.now() - t0), spec.id, frame);
    if (handle !== null && !released.current) {
      released.current = true;
      continueRender(handle);
    }
    return () => {
      alive = false;
    };
  });

  void texesLoaded;
  return <canvas ref={canvasRef} width={1920} height={1080} style={{width: '100%', height: '100%', display: 'block', background: rgbCss(spec.look.skyHorizon), ...style}} />;
};

// ---- reusable transparent fx layers -----------------------------------------------------------------------------------

/** Generic transparent 1920x1080 canvas that calls `draw` every frame with a View whose projection is screen = grid * tile. */
export const FxLayer: FC<{draw: (ctx: CanvasRenderingContext2D, v: FX.View) => void; loop?: number; width?: number; height?: number; textures?: string[]}> = ({draw, loop = 192, width = 1920, height = 1080, textures}) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(!textures || texesLoaded(textures));
  const [handle] = useState<number | null>(() => (textures && !texesLoaded(textures) ? delayRender('mcdscene fx textures') : null));
  useLayoutEffect(() => {
    if (!ready) {
      loadTextures(textures!).then(() => setReady(true));
      return;
    }
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    const view: FX.View = {W: width, H: height, frame, loop, tw: 96, ratio: 0.7, proj: (gx, gy, gz) => ({x: gx, y: gy - gz, s: 1})};
    draw(ctx, view);
    if (handle !== null) continueRender(handle);
  });
  return <canvas ref={ref} width={width} height={height} style={{width: '100%', height: '100%', display: 'block', position: 'absolute', left: 0, top: 0}} />;
};

/** Pixel position helper: for FxLayer, grid coords are plain screen pixels. */
export const LootBeam: FC<{x: number; y: number; kind?: FX.BeamKind; width?: number; grow?: number; loop?: number}> = ({x, y, kind = 'magenta', width = 96, grow = 1, loop}) => (
  <FxLayer loop={loop} draw={(ctx, v) => FX.beam(ctx, v, {x, y, kind, width, grow})} />
);
export const EmberField: FC<{n?: number; seed?: number; loop?: number; ash?: number}> = ({n = 60, seed = 3, loop, ash = 0}) => (
  <FxLayer loop={loop} draw={(ctx, v) => FX.embers(ctx, v, {n, seed, box: [0, 0, 0, 1920, 1080, 0], rise: 900, ash, size: 1.6, cycles: 1, wind: 120})} />
);
export const FireflyField: FC<{n?: number; seed?: number; loop?: number}> = ({n = 24, seed = 5, loop}) => (
  <FxLayer loop={loop} draw={(ctx, v) => FX.fireflies(ctx, v, {n, seed, box: [100, 200, 0, 1820, 1000, 0], size: 1.2})} />
);
export const SnowField: FC<{n?: number; seed?: number; loop?: number}> = ({n = 70, seed = 9, loop}) => <FxLayer loop={loop} draw={(ctx, v) => FX.snowfall(ctx, v, {n, seed})} />;
export const SoulStream: FC<{from: [number, number]; to: [number, number]; n?: number; loop?: number}> = ({from, to, n = 7, loop}) => (
  <FxLayer loop={loop} draw={(ctx, v) => FX.souls(ctx, v, {n, seed: 4, from: [from[0], from[1], 0], to: [to[0], to[1], 0], size: 1.5})} />
);
export const LightningBolts: FC<{x: number; y: number; frames: number[]; loop?: number}> = ({x, y, frames, loop = 192}) => (
  <FxLayer loop={loop} draw={(ctx, v) => FX.lightning(ctx, v, {strikes: frames.map((f, i) => ({frame: f, at: [x, y, 0], seed: i + 1}))})} />
);
export const EmeraldSpin: FC<{x: number; y: number; size?: number; loop?: number}> = ({x, y, size = 120, loop}) => (
  <FxLayer loop={loop} textures={['item/emerald']} draw={(ctx, v) => FX.spinItem(ctx, v, {img: texCanvas('item/emerald'), x, y, size, glow: [88, 208, 56], sparkle: true})} />
);
export const HitSparks: FC<{x: number; y: number; start?: number; loop?: number}> = ({x, y, start = 0, loop}) => <FxLayer loop={loop} draw={(ctx, v) => FX.hitSparks(ctx, v, {x, y, start, seed: 2})} />;

void B;
void BLOCKS;
