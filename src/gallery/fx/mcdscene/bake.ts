// Software isometric voxel baker: lights, shadows, AO, fog and grades a World into a pixel buffer.
// Heavy work happens once per (scene, size); per-frame code only composites the result.
import {BLOCKS, isCaster, isSolidCube, type BlockDef, type Tint} from './blocks';
import {getTex, type Tex} from './tex';
import {clamp, h2, h3, type RGB} from './rng';
import type {World} from './world';

export type Look = {
  /** 'paper' fills the buffer with a parchment tone instead of the sky gradient; stars add specks. */
  base?: 'sky' | 'paper';
  stars?: {density: number; color: RGB};
  /** Soft offset drop shadow of the whole voxel mass (world-map islands). */
  dropShadow?: {dx: number; dy: number; blur: number; color: RGB; alpha: number};
  skyTop: RGB;
  skyHorizon: RGB;
  /** Colour multiplier on lit surfaces (sun colour x brightness), 0..~1.2 */
  light: RGB;
  /** Vector pointing towards the sun (unnormalised). Shadows fall the opposite way. */
  sunDir: [number, number, number];
  /** Surface brightness inside a shadow (1 = no shadow). Brief: 0.6-0.7. */
  shadow: number;
  face: [number, number, number];
  tint: {grass: RGB; foliage: RGB; water: RGB; autumn?: RGB; dry?: RGB; pale?: RGB};
  fog: {color: RGB; base: number; slope: number; height: number; zRef: number; zRange: number};
  grade: {sat: number; contrast: number; lift: RGB; shadowTone: RGB; highTone: RGB};
  glowGain: number;
  pointGain: number;
  /** Per-cell tone variation amplitude (patchwork). */
  tone: number;
  waterDeep: RGB;
  waterAlpha: number;
  /** AO strength on tops. */
  ao: number;
};

export type Geom = {
  /** Diamond width / height of a block top and vertical edge height, in buffer pixels. */
  tw: number;
  th: number;
  hz: number;
  /** Buffer size and the grid point that maps to the buffer centre. */
  bufW: number;
  bufH: number;
  anchor: [number, number, number];
};

export type Baked = {
  w: number;
  h: number;
  img: ImageData;
  canvas: HTMLCanvasElement;
  geom: Geom;
  ox: number;
  oy: number;
  /** Project grid coordinates into buffer pixels. */
  proj: (gx: number, gy: number, gz: number) => {x: number; y: number};
  liquid: LiquidSet | null;
  /** Visible water texel positions in buffer pixels (for sparkles). */
  waterSpots: {x: number; y: number}[];
  /** Cells that carry flames etc. for the dynamic layer: grid positions + block name index. */
  emitters: {x: number; y: number; z: number; id: number; vis: boolean}[];
  lightVol: Float32Array | null;
};

export type LiquidSet = {
  n: number;
  idx: Int32Array;
  texel: Uint8Array;
  kind: Uint8Array;
  scale: Uint8Array; // 3 per entry, /64
  add: Uint8Array; // 3 per entry
};

// ---------------------------------------------------------------------------------------------------------------------

type Prepared = {look: Look; world: World; geom: Geom; seed: number};

const albedoCache = new Map<string, Uint8ClampedArray>();

const avgOf = (t: Tex): number => {
  let s = 0;
  let n = 0;
  const d = t.data;
  for (let i = 0; i < t.w * t.w; i++) {
    if (d[i * 4 + 3] < 128) continue;
    s += (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3;
    n++;
  }
  return n ? s / n : 128;
};

/** 16x16 RGBA albedo of a texture (first frame), tinted and optionally re-oriented. */
const albedoOf = (name: string, tint: Tint, look: Look, orient = 0, overlay?: string): Uint8ClampedArray => {
  const key = `${name}|${tint}|${orient}|${overlay ?? ''}|${JSON.stringify(look.tint)}`;
  const hit = albedoCache.get(key);
  if (hit) return hit;
  const t = getTex(name);
  const out = new Uint8ClampedArray(1024);
  const tc: RGB | null = tint === 'none' ? null : (look.tint as Record<string, RGB | undefined>)[tint] ?? null;
  const avg = tc ? avgOf(tint === 'grass' && overlay ? getTex(name) : t) : 1;
  const ov = overlay ? getTex(overlay) : null;
  const gAvg = overlay ? avgOf(getTex('block/grass_block_top')) : 1;
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      // orientation: bit0 flip x, bit1 flip y, bit2 swap
      let si = i;
      let sj = j;
      if (orient & 4) [si, sj] = [sj, si];
      if (orient & 1) si = 15 - si;
      if (orient & 2) sj = 15 - sj;
      const s = (sj * t.w + si) * 4;
      let r = t.data[s];
      let g = t.data[s + 1];
      let b = t.data[s + 2];
      let a = t.data[s + 3];
      if (tc && !overlay) {
        const k = (r + g + b) / 3 / avg;
        r = tc[0] * k;
        g = tc[1] * k;
        b = tc[2] * k;
      }
      if (ov && tc) {
        const o = (sj * ov.w + si) * 4;
        const oa = ov.data[o + 3] / 255;
        if (oa > 0) {
          const k = (ov.data[o] + ov.data[o + 1] + ov.data[o + 2]) / 3 / gAvg;
          r = r * (1 - oa) + tc[0] * k * oa;
          g = g * (1 - oa) + tc[1] * k * oa;
          b = b * (1 - oa) + tc[2] * k * oa;
        }
      }
      const d = (j * 16 + i) * 4;
      out[d] = r;
      out[d + 1] = g;
      out[d + 2] = b;
      out[d + 3] = a;
    }
  albedoCache.set(key, out);
  return out;
};

// ---------------------------------------------------------------------------------------------------------------------
// Decals (cracks, moss, stains, pebbles) applied on a per-cell copy of the albedo.

const decal = (a: Uint8ClampedArray, kind: NonNullable<BlockDef['decal']>, x: number, y: number, z: number, face: number, seed: number) => {
  const r = (n: number) => h3(x * 7 + n * 13, y * 5 + face, z * 3 + n, seed + 77);
  const dark = (i: number, j: number, k: number) => {
    if (i < 0 || j < 0 || i > 15 || j > 15) return;
    const d = (j * 16 + i) * 4;
    a[d] *= k;
    a[d + 1] *= k;
    a[d + 2] *= k;
  };
  const tintPx = (i: number, j: number, c: RGB, m: number) => {
    if (i < 0 || j < 0 || i > 15 || j > 15) return;
    const d = (j * 16 + i) * 4;
    a[d] = a[d] * (1 - m) + c[0] * m;
    a[d + 1] = a[d + 1] * (1 - m) + c[1] * m;
    a[d + 2] = a[d + 2] * (1 - m) + c[2] * m;
  };
  if (kind === 'stone' || kind === 'brick' || kind === 'nether') {
    if (r(1) < (kind === 'brick' ? 0.2 : 0.42)) {
      let i = Math.floor(r(2) * 14) + 1;
      let j = Math.floor(r(3) * 14) + 1;
      const n = 5 + Math.floor(r(4) * 6);
      for (let s = 0; s < n; s++) {
        dark(i, j, 0.62);
        const q = h3(i, j, s, x + y);
        if (q < 0.4) i++;
        else if (q < 0.7) j++;
        else if (q < 0.85) i--;
        else j--;
      }
    }
    if (r(5) < 0.3) {
      const i = Math.floor(r(6) * 13);
      const j = Math.floor(r(7) * 13);
      for (let q = 0; q < 4; q++) dark(i + (q & 1), j + (q >> 1), 0.84);
    }
    if (kind === 'nether' && r(8) < 0.1) {
      tintPx(Math.floor(r(9) * 16), Math.floor(r(10) * 16), [255, 120, 40], 0.85);
    }
    if (kind !== 'nether' && r(11) < 0.16) {
      const i = Math.floor(r(12) * 12);
      const j = Math.floor(r(13) * 12);
      for (let q = 0; q < 6; q++) tintPx(i + Math.floor(r(14 + q) * 4), j + Math.floor(r(20 + q) * 4), [70, 118, 44], 0.7);
    }
  } else if (kind === 'dirt') {
    for (let k = 0; k < 3; k++) {
      if (r(30 + k) < 0.5) {
        const i = Math.floor(r(33 + k) * 14);
        const j = Math.floor(r(36 + k) * 14);
        const lt = r(39 + k) < 0.5;
        for (let q = 0; q < 4; q++) dark(i + (q & 1), j + (q >> 1), lt ? 1.16 : 0.82);
      }
    }
    if (r(50) < 0.2) tintPx(Math.floor(r(51) * 16), Math.floor(r(52) * 16), [150, 148, 140], 0.7);
  } else if (kind === 'sand') {
    if (r(60) < 0.35) {
      const j = Math.floor(r(61) * 16);
      for (let i = 0; i < 16; i++) if (h3(i, j, x + y, seed) < 0.7) dark(i, j, 0.93);
    }
  }
};

// ---------------------------------------------------------------------------------------------------------------------

class Buf {
  readonly w: number;
  readonly h: number;
  readonly u32: Uint32Array;
  readonly u8: Uint8ClampedArray;
  ids: Uint8Array | null = null;
  /** Painter id (cell index + 1) of the last writer of each pixel; used for emitter occlusion tests. */
  owner: Int32Array | null = null;
  cur = 0;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    const ab = new ArrayBuffer(w * h * 4);
    this.u32 = new Uint32Array(ab);
    this.u8 = new Uint8ClampedArray(ab);
  }
}

type Rec = (idx: number, texel: number, bed: number) => number;

const pack = (r: number, g: number, b: number, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;

/** Fill a top-face parallelogram. (Tx,Ty): screen position of the (x0,y0,zTop) vertex. lx/ly in blocks. */
const rasterTop = (buf: Buf, Wh: number, Hh: number, Tx: number, Ty: number, lx: number, ly: number, tu0: number, tv0: number, tu1: number, tv1: number, lit: Uint32Array, cut: boolean, kind: number, rec: Rec | null) => {
  const w = buf.w;
  const h = buf.h;
  const r = Wh / Hh;
  const y0 = Math.max(0, Math.ceil(Ty - 0.5));
  const y1 = Math.min(h - 1, Math.floor(Ty + (lx + ly) * Hh - 0.5));
  const su = (tu1 - tu0) / lx;
  const sv = (tv1 - tv0) / ly;
  const u32 = buf.u32;
  const ids = buf.ids;
  const own = buf.owner;
  const cur = buf.cur;
  for (let py = y0; py <= y1; py++) {
    const dy = py + 0.5 - Ty;
    const xmin = Math.max(-dy * r, (dy / Hh - 2 * ly) * Wh);
    const xmax = Math.min(dy * r, (2 * lx - dy / Hh) * Wh);
    let xs = Math.ceil(Tx + xmin - 0.5);
    let xe = Math.floor(Tx + xmax - 0.5);
    if (xs < 0) xs = 0;
    if (xe > w - 1) xe = w - 1;
    const dyh = dy / Hh;
    for (let px = xs; px <= xe; px++) {
      const dxw = (px + 0.5 - Tx) / Wh;
      const u = (dxw + dyh) * 0.5;
      const v = (dyh - dxw) * 0.5;
      let ti = (tu0 + u * su) | 0;
      let tj = (tv0 + v * sv) | 0;
      if (ti < 0) ti = 0;
      else if (ti > 15) ti = 15;
      if (tj < 0) tj = 0;
      else if (tj > 15) tj = 15;
      const c = lit[tj * 16 + ti];
      if (cut && c >>> 24 < 128) continue;
      const i = py * w + px;
      if (rec) {
        u32[i] = rec(i, tj * 16 + ti, u32[i]);
        if (ids) ids[i] = kind;
        if (own) own[i] = cur;
        continue;
      }
      if (ids) ids[i] = 0;
      if (own) own[i] = cur;
      u32[i] = c;
    }
  }
};

/** Left face (normal +y): vertical parallelogram. (Lx,Ly) = screen of (x0, Y, zTop). */
const rasterLeft = (buf: Buf, Wh: number, Hh: number, Hz: number, Lx: number, Ly: number, lx: number, lz: number, tu0: number, tv0: number, tu1: number, tv1: number, lit: Uint32Array, cut: boolean, kind: number, rec: Rec | null) => {
  const w = buf.w;
  const h = buf.h;
  const u32 = buf.u32;
  const ids = buf.ids;
  const own = buf.owner;
  const cur = buf.cur;
  const xs = Math.max(0, Math.ceil(Lx - 0.5));
  const xe = Math.min(w - 1, Math.floor(Lx + Wh * lx - 0.5));
  const su = (tu1 - tu0) / lx;
  const sv = (tv1 - tv0) / lz;
  for (let px = xs; px <= xe; px++) {
    const u = (px + 0.5 - Lx) / Wh;
    const topY = Ly + u * Hh;
    const ys = Math.max(0, Math.ceil(topY - 0.5));
    const ye = Math.min(h - 1, Math.floor(topY + Hz * lz - 0.5));
    let ti = (tu0 + u * su) | 0;
    if (ti < 0) ti = 0;
    else if (ti > 15) ti = 15;
    for (let py = ys; py <= ye; py++) {
      const v = (py + 0.5 - topY) / Hz;
      let tj = (tv0 + v * sv) | 0;
      if (tj < 0) tj = 0;
      else if (tj > 15) tj = 15;
      const c = lit[tj * 16 + ti];
      if (cut && c >>> 24 < 128) continue;
      const i = py * w + px;
      if (rec) {
        u32[i] = rec(i, tj * 16 + ti, u32[i]);
        if (ids) ids[i] = kind;
        if (own) own[i] = cur;
        continue;
      }
      if (ids) ids[i] = 0;
      if (own) own[i] = cur;
      u32[i] = c;
    }
  }
};

/** Right face (normal +x): (Rx,Ry) = screen of (X, y1, zTop); u runs towards y0 (screen right). */
const rasterRight = (buf: Buf, Wh: number, Hh: number, Hz: number, Rx: number, Ry: number, ly: number, lz: number, tu0: number, tv0: number, tu1: number, tv1: number, lit: Uint32Array, cut: boolean, kind: number, rec: Rec | null) => {
  const w = buf.w;
  const h = buf.h;
  const u32 = buf.u32;
  const ids = buf.ids;
  const own = buf.owner;
  const cur = buf.cur;
  const xs = Math.max(0, Math.ceil(Rx - 0.5));
  const xe = Math.min(w - 1, Math.floor(Rx + Wh * ly - 0.5));
  const su = (tu1 - tu0) / ly;
  const sv = (tv1 - tv0) / lz;
  for (let px = xs; px <= xe; px++) {
    const u = (px + 0.5 - Rx) / Wh;
    const topY = Ry - u * Hh;
    const ys = Math.max(0, Math.ceil(topY - 0.5));
    const ye = Math.min(h - 1, Math.floor(topY + Hz * lz - 0.5));
    let ti = (tu0 + u * su) | 0;
    if (ti < 0) ti = 0;
    else if (ti > 15) ti = 15;
    for (let py = ys; py <= ye; py++) {
      const v = (py + 0.5 - topY) / Hz;
      let tj = (tv0 + v * sv) | 0;
      if (tj < 0) tj = 0;
      else if (tj > 15) tj = 15;
      const c = lit[tj * 16 + ti];
      if (cut && c >>> 24 < 128) continue;
      const i = py * w + px;
      if (rec) {
        u32[i] = rec(i, tj * 16 + ti, u32[i]);
        if (ids) ids[i] = kind;
        if (own) own[i] = cur;
        continue;
      }
      if (ids) ids[i] = 0;
      if (own) own[i] = cur;
      u32[i] = c;
    }
  }
};

// ---------------------------------------------------------------------------------------------------------------------

export type BakeInput = {
  world: World;
  look: Look;
  geom: Geom;
  seed?: number;
};

/** Bake a voxel world into an isometric lit pixel buffer. */
export const bakeWorld = ({world, look, geom, seed = 1}: BakeInput): Baked => {
  const P: Prepared = {look, world, geom, seed};
  const Wh = geom.tw / 2;
  const Hh = geom.th / 2;
  const Hz = geom.hz;
  const bw = geom.bufW;
  const bh = geom.bufH;
  const [ax, ay, az] = geom.anchor;
  const ox = bw / 2 - (ax - ay) * Wh;
  const oy = bh / 2 - (ax + ay) * Hh + az * Hz;
  const sx = (gx: number, gy: number) => ox + (gx - gy) * Wh;
  const sy = (gx: number, gy: number, gz: number) => oy + (gx + gy) * Hh - gz * Hz;

  const buf = new Buf(bw, bh);
  // --- background fill: sky gradient, parchment, or starry void
  {
    const top = look.skyTop;
    const hor = look.skyHorizon;
    for (let y = 0; y < bh; y++) {
      const t = clamp(y / bh);
      const r = top[0] + (hor[0] - top[0]) * t;
      const g = top[1] + (hor[1] - top[1]) * t;
      const b = top[2] + (hor[2] - top[2]) * t;
      const c = pack(r, g, b);
      buf.u32.fill(c, y * bw, (y + 1) * bw);
    }
    if (look.base === 'paper') {
      // low-frequency stains + fine grain, like the world-map parchment
      for (let y = 0; y < bh; y++)
        for (let x = 0; x < bw; x++) {
          const n = fbmLite(x / 260, y / 260, seed + 71) - 0.5;
          const g = h2(x, y, seed + 72) - 0.5;
          const k = 1 + n * 0.09 + g * 0.018;
          const i = y * bw + x;
          const c = buf.u32[i];
          buf.u32[i] = pack(Math.min(255, (c & 255) * k) | 0, Math.min(255, ((c >>> 8) & 255) * k) | 0, Math.min(255, ((c >>> 16) & 255) * (k * 0.99)) | 0);
        }
    }
    if (look.stars) {
      const n = Math.floor(look.stars.density * bw * bh);
      const sc = look.stars.color;
      for (let i = 0; i < n; i++) {
        const x = Math.floor(h3(i, 1, seed, 301) * bw);
        const y = Math.floor(h3(i, 2, seed, 302) * bh);
        const k = h3(i, 3, seed, 303);
        const sz = k > 0.97 ? 3 : k > 0.8 ? 2 : 1;
        const br = 0.35 + 0.65 * h3(i, 4, seed, 304);
        const c = pack(sc[0] * br, sc[1] * br, sc[2] * br);
        for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) if (x + dx < bw && y + dy < bh) buf.u32[(y + dy) * bw + x + dx] = c;
      }
    }
  }

  const W = world.w;
  const D = world.d;
  const H = world.h;
  const blocks = world.blocks;
  const nBlocks = BLOCKS.length;
  const solidTab = new Uint8Array(nBlocks);
  const casterTab = new Uint8Array(nBlocks);
  const leafTab = new Uint8Array(nBlocks);
  const emitTab = new Uint8Array(nBlocks);
  for (let i = 1; i < nBlocks; i++) {
    solidTab[i] = isSolidCube(i) ? 1 : 0;
    casterTab[i] = isCaster(i) ? 1 : 0;
    leafTab[i] = BLOCKS[i].kind === 'leaf' ? 1 : 0;
    emitTab[i] = BLOCKS[i].emit ? 1 : 0;
  }

  // --- max caster height for fast ray exit
  let zmax = 0;
  for (let z = H - 1; z >= 0 && !zmax; z--)
    for (let y = 0; y < D && !zmax; y++)
      for (let x = 0; x < W; x++) {
        const id = blocks[(z * D + y) * W + x];
        if (id && casterTab[id]) {
          zmax = z + 1;
          break;
        }
      }

  // --- sun rays (3 jittered directions)
  const sd = look.sunDir;
  const sl = Math.hypot(sd[0], sd[1], sd[2]);
  const sun0: [number, number, number] = [sd[0] / sl, sd[1] / sl, sd[2] / sl];
  const jit: [number, number][] = [
    [0, 0],
    [0.05, -0.04],
    [-0.04, 0.05],
  ];
  const sunRays = jit.map(([a, b]) => {
    const v: [number, number, number] = [sun0[0] + a * 0.9, sun0[1] + b * 0.9, sun0[2] + (a - b) * 0.2];
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l] as [number, number, number];
  });

  /** Fraction of sun blocked at a point (0 = lit, 1 = in shadow). */
  const shadowAt = (px: number, py: number, pz: number): number => {
    let sum = 0;
    for (let k = 0; k < 3; k++) {
      const [dx, dy, dz] = sunRays[k];
      let t = 0.2;
      let trans = 1;
      let lastCell = -1;
      for (let n = 0; n < 80; n++) {
        const x = px + dx * t;
        const y = py + dy * t;
        const z = pz + dz * t;
        if (z > zmax) break;
        if (x < 0 || y < 0 || x >= W || y >= D) {
          if (x < -2 || y < -2 || x > W + 2 || y > D + 2) break;
          t += 0.3;
          continue;
        }
        const xi = x | 0;
        const yi = y | 0;
        const zi = z | 0;
        if (z >= 0 && zi < H) {
          const ci = (zi * D + yi) * W + xi;
          const id = blocks[ci];
          if (id && casterTab[id]) {
            if (leafTab[id]) {
              if (ci !== lastCell) {
                lastCell = ci;
                trans *= 0.5 + 0.35 * h3((x * 6) | 0, (y * 6) | 0, (z * 6) | 0, seed);
              }
            } else {
              trans = 0;
              break;
            }
          }
        }
        t += 0.3;
      }
      sum += 1 - trans;
    }
    return sum / 3;
  };

  // --- voxel light volume (BFS flood from emitters)
  const emitters: Baked['emitters'] = [];
  buf.owner = new Int32Array(bw * bh);
  for (let z = 0; z < H; z++)
    for (let y = 0; y < D; y++)
      for (let x = 0; x < W; x++) {
        const id = blocks[(z * D + y) * W + x];
        if (id && emitTab[id]) emitters.push({x, y, z, id, vis: true});
      }
  let lightVol: Float32Array | null = null;
  if (emitters.length) {
    lightVol = new Float32Array(W * D * H * 3);
    const passable = (x: number, y: number, z: number) => {
      if (x < 0 || y < 0 || z < 0 || x >= W || y >= D || z >= H) return false;
      const id = blocks[(z * D + y) * W + x];
      return id === 0 || !solidTab[id];
    };
    const best = new Int8Array(W * D * H);
    const qx: number[] = [];
    const qy: number[] = [];
    const qz: number[] = [];
    const qv: number[] = [];
    // cluster identical emitters: lava surface cells flood once per cell, but skip buried ones
    for (const e of emitters) {
      const def = BLOCKS[e.id];
      const em = def.emit!;
      // skip buried emitters
      let open = false;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (passable(e.x + dx, e.y + dy, e.z + dz)) open = true;
      if (!open) continue;
      best.fill(0);
      qx.length = 0;
      qy.length = 0;
      qz.length = 0;
      qv.length = 0;
      qx.push(e.x);
      qy.push(e.y);
      qz.push(e.z);
      qv.push(em.level);
      best[(e.z * D + e.y) * W + e.x] = em.level;
      for (let qi = 0; qi < qx.length; qi++) {
        const cx = qx[qi];
        const cy = qy[qi];
        const cz = qz[qi];
        const lv = qv[qi];
        const vi = ((cz * D + cy) * W + cx) * 3;
        const f = Math.pow(lv / 15, 1.9);
        lightVol[vi] += (em.color[0] / 255) * f;
        lightVol[vi + 1] += (em.color[1] / 255) * f;
        lightVol[vi + 2] += (em.color[2] / 255) * f;
        if (lv <= 1) continue;
        for (let n = 0; n < 6; n++) {
          const nx = cx + (n === 0 ? 1 : n === 1 ? -1 : 0);
          const ny = cy + (n === 2 ? 1 : n === 3 ? -1 : 0);
          const nz = cz + (n === 4 ? 1 : n === 5 ? -1 : 0);
          if (!passable(nx, ny, nz)) continue;
          const ni = (nz * D + ny) * W + nx;
          const nl = lv - (leafTab[blocks[ni]] ? 3 : 1);
          if (nl <= best[ni]) continue;
          best[ni] = nl;
          qx.push(nx);
          qy.push(ny);
          qz.push(nz);
          qv.push(nl);
        }
      }
    }
    // solid cells inherit the strongest neighbouring air value (so bilinear taps stay smooth at faces)
    const tmp = new Float32Array(lightVol);
    for (let z = 0; z < H; z++)
      for (let y = 0; y < D; y++)
        for (let x = 0; x < W; x++) {
          const id = blocks[(z * D + y) * W + x];
          if (!id || !solidTab[id]) continue;
          let r = 0;
          let g = 0;
          let b = 0;
          for (let n = 0; n < 6; n++) {
            const nx = x + (n === 0 ? 1 : n === 1 ? -1 : 0);
            const ny = y + (n === 2 ? 1 : n === 3 ? -1 : 0);
            const nz = z + (n === 4 ? 1 : n === 5 ? -1 : 0);
            if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= D || nz >= H) continue;
            const vi = ((nz * D + ny) * W + nx) * 3;
            r = Math.max(r, tmp[vi]);
            g = Math.max(g, tmp[vi + 1]);
            b = Math.max(b, tmp[vi + 2]);
          }
          const vi = ((z * D + y) * W + x) * 3;
          lightVol[vi] = r * 0.9;
          lightVol[vi + 1] = g * 0.9;
          lightVol[vi + 2] = b * 0.9;
        }
  }

  if (lightVol) {
    // soft-compress the summed light so crowded emitters (lava lakes, glow clusters) cannot blow out
    for (let i = 0; i < lightVol.length; i++) lightVol[i] = 0.8 * (1 - Math.exp(-1.4 * lightVol[i]));
  }
  const lv = lightVol;
  const ptTmp = [0, 0, 0];
  /** Trilinear sample of the light volume at a world position. */
  const sampleLight = (px: number, py: number, pz: number, out: number[]) => {
    if (!lv) {
      out[0] = out[1] = out[2] = 0;
      return;
    }
    const fx = px - 0.5;
    const fy = py - 0.5;
    const fz = pz - 0.5;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const z0 = Math.floor(fz);
    const tx = fx - x0;
    const ty = fy - y0;
    const tz = fz - z0;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let dz = 0; dz < 2; dz++)
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const x = Math.min(W - 1, Math.max(0, x0 + dx));
          const y = Math.min(D - 1, Math.max(0, y0 + dy));
          const z = Math.min(H - 1, Math.max(0, z0 + dz));
          const wgt = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz);
          const vi = ((z * D + y) * W + x) * 3;
          r += lv[vi] * wgt;
          g += lv[vi + 1] * wgt;
          b += lv[vi + 2] * wgt;
        }
    out[0] = r;
    out[1] = g;
    out[2] = b;
  };

  // --- per-cell tone (patchwork variation)
  const toneAt = (x: number, y: number, out: number[]) => {
    const n1 = fbmLite(x * 0.17, y * 0.17, seed + 3);
    const n2 = fbmLite(x * 0.11 + 40, y * 0.11 + 7, seed + 9);
    const t = 1 + (n1 - 0.5) * 2 * look.tone;
    const hue = (n2 - 0.5) * look.tone * 0.9;
    out[0] = t * (1 + hue);
    out[1] = t;
    out[2] = t * (1 - hue);
  };

  const fogC = look.fog.color;
  const gradeFn = (r: number, g: number, b: number, out: number[]) => {
    const gr = look.grade;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const l255 = lum * 255;
    r = l255 + (r - l255) * gr.sat;
    g = l255 + (g - l255) * gr.sat;
    b = l255 + (b - l255) * gr.sat;
    const m = lum < 0.12 ? 0 : lum > 0.75 ? 1 : (lum - 0.12) / 0.63;
    const sm = m * m * (3 - 2 * m);
    r *= gr.shadowTone[0] + (gr.highTone[0] - gr.shadowTone[0]) * sm;
    g *= gr.shadowTone[1] + (gr.highTone[1] - gr.shadowTone[1]) * sm;
    b *= gr.shadowTone[2] + (gr.highTone[2] - gr.shadowTone[2]) * sm;
    if (gr.contrast !== 1) {
      r = (r - 118) * gr.contrast + 118;
      g = (g - 118) * gr.contrast + 118;
      b = (b - 118) * gr.contrast + 118;
    }
    r = gr.lift[0] + r * (1 - gr.lift[0] / 255);
    g = gr.lift[1] + g * (1 - gr.lift[1] / 255);
    b = gr.lift[2] + b * (1 - gr.lift[2] / 255);
    out[0] = r;
    out[1] = g;
    out[2] = b;
  };

  const fogAmount = (screenY: number, z: number) => {
    const f = look.fog;
    const a = f.base + f.slope * ((oy + (ax + ay) * Hh - az * Hz - screenY) / 1000);
    const hh = f.height * clamp((f.zRef - z) / f.zRange);
    return clamp(a + hh, 0, 0.96);
  };

  // --- buffers for lit faces
  const lit = new Uint32Array(256);
  const rgb = [0, 0, 0];
  const gr = [0, 0, 0];
  const tone = [1, 1, 1];
  const pt = [0, 0, 0];

  // liquid recording
  const track = emitters.length >= 0;
  void track;
  let hasLiquid = false;
  for (let i = 1; i < nBlocks && !hasLiquid; i++) if (BLOCKS[i].anim) hasLiquid = true;
  let liquidUsed = false;
  const cap0 = 1 << 18;
  let L_idx = new Int32Array(cap0);
  let L_texel = new Uint8Array(cap0);
  let L_kind = new Uint8Array(cap0);
  let L_scale = new Uint8Array(cap0 * 3);
  let L_add = new Uint8Array(cap0 * 3);
  let L_n = 0;
  const grow = () => {
    const n = L_idx.length * 2;
    const a = new Int32Array(n);
    a.set(L_idx);
    L_idx = a;
    const b = new Uint8Array(n);
    b.set(L_texel);
    L_texel = b;
    const c = new Uint8Array(n);
    c.set(L_kind);
    L_kind = c;
    const d = new Uint8Array(n * 3);
    d.set(L_scale);
    L_scale = d;
    const e = new Uint8Array(n * 3);
    e.set(L_add);
    L_add = e;
  };
  if (hasLiquid) buf.ids = new Uint8Array(bw * bh);

  const faceScale = new Float32Array(256 * 3);
  const faceAdd = new Float32Array(256 * 3);
  let faceAlpha = 0.8;
  let faceKind = 0;
  let faceTex: Uint8ClampedArray = new Uint8ClampedArray(1024);
  /** Records an animatable pixel and returns its static colour (frame 0 texture over the bed). */
  const recFn: Rec = (idx, texel, bed) => {
    if (L_n >= L_idx.length) grow();
    const n = L_n++;
    L_idx[n] = idx;
    L_texel[n] = texel;
    L_kind[n] = faceKind;
    const a = faceAlpha;
    const br = (bed & 255) * (1 - a);
    const bg = ((bed >>> 8) & 255) * (1 - a);
    const bb = ((bed >>> 16) & 255) * (1 - a);
    const o = texel * 3;
    L_scale[n * 3] = Math.min(255, faceScale[o] * 64);
    L_scale[n * 3 + 1] = Math.min(255, faceScale[o + 1] * 64);
    L_scale[n * 3 + 2] = Math.min(255, faceScale[o + 2] * 64);
    const ar = Math.min(255, faceAdd[o] + br);
    const ag = Math.min(255, faceAdd[o + 1] + bg);
    const ab = Math.min(255, faceAdd[o + 2] + bb);
    L_add[n * 3] = ar;
    L_add[n * 3 + 1] = ag;
    L_add[n * 3 + 2] = ab;
    liquidUsed = true;
    const t = texel * 4;
    const r = Math.min(255, faceTex[t] * faceScale[o] + ar);
    const g = Math.min(255, faceTex[t + 1] * faceScale[o + 1] + ag);
    const bl = Math.min(255, faceTex[t + 2] * faceScale[o + 2] + ab);
    return pack(r | 0, g | 0, bl | 0, 255);
  };

  const Fface = look.face;
  const AO = look.ao;
  const R_AO = 0.34;

  /** Ambient occlusion for a face given the 3x3 neighbourhood of solidity in the layer in front of it. */
  const occ = new Float32Array(9);
  const aoAt = (s: number, t: number): number => {
    // occ index = (b+1)*3 + (a+1); s,t in [0,1]
    let k = 0;
    const l = occ[3 + 0] * Math.max(0, 1 - s / R_AO);
    const r = occ[3 + 2] * Math.max(0, 1 - (1 - s) / R_AO);
    const d = occ[0 * 3 + 1] * Math.max(0, 1 - t / R_AO);
    const u = occ[2 * 3 + 1] * Math.max(0, 1 - (1 - t) / R_AO);
    k = l + r + d + u;
    if (occ[0] && !occ[1] && !occ[3]) k += Math.max(0, 1 - Math.hypot(s, t) / R_AO) * 0.8;
    if (occ[2] && !occ[1] && !occ[5]) k += Math.max(0, 1 - Math.hypot(1 - s, t) / R_AO) * 0.8;
    if (occ[6] && !occ[7] && !occ[3]) k += Math.max(0, 1 - Math.hypot(s, 1 - t) / R_AO) * 0.8;
    if (occ[8] && !occ[7] && !occ[5]) k += Math.max(0, 1 - Math.hypot(1 - s, 1 - t) / R_AO) * 0.8;
    return 1 - AO * Math.min(1, k) * 0.9;
  };
  const occAtCell = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= D || z >= H) return 0;
    const id = blocks[(z * D + y) * W + x];
    if (!id) return 0;
    if (solidTab[id]) return 1;
    if (leafTab[id]) return 0.6;
    return 0;
  };

  /** Shade a 16x16 albedo into `lit`. face: 0 top, 1 left(+y), 2 right(+x). */
  const cSh = new Float32Array(256);
  const shadeFace = (alb: Uint8ClampedArray, x: number, y: number, z: number, face: 0 | 1 | 2, def: BlockDef, opts: {noShadow?: boolean; edgeAmt?: number; edgeMask?: number; glow?: number; ambientOnly?: number; inner?: boolean}) => {
    // occupancy in the layer in front of the face
    if (face === 0) {
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) occ[(b + 1) * 3 + (a + 1)] = a === 0 && b === 0 ? 0 : occAtCell(x + a, y + b, z + 1);
    } else if (face === 1) {
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) occ[(b + 1) * 3 + (a + 1)] = a === 0 && b === 0 ? 0 : occAtCell(x + a, y + 1, z + b);
    } else {
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) occ[(b + 1) * 3 + (a + 1)] = a === 0 && b === 0 ? 0 : occAtCell(x + 1, y + a, z + b);
    }
    toneAt(x, y, tone);
    const glow = opts.glow ?? def.glow ?? 0;
    const ff = Fface[face];
    const noSh = opts.noShadow;
    const coarse = geom.tw <= 48;
    const edge = opts.edgeAmt ?? 0;
    const em = opts.edgeMask ?? 0;
    for (let j = 0; j < 16; j++) {
      for (let i = 0; i < 16; i++) {
        const d = (j * 16 + i) * 4;
        const al = alb[d + 3];
        if (al < 128) {
          lit[j * 16 + i] = 0;
          continue;
        }
        // position
        let px: number;
        let py: number;
        let pz: number;
        let s: number;
        let t: number;
        if (face === 0) {
          px = x + (i + 0.5) / 16;
          py = y + (j + 0.5) / 16;
          pz = z + 1.002;
          s = (i + 0.5) / 16;
          t = (j + 0.5) / 16;
        } else if (face === 1) {
          px = x + (i + 0.5) / 16;
          py = y + 1.002;
          pz = z + 1 - (j + 0.5) / 16;
          s = (i + 0.5) / 16;
          t = 1 - (j + 0.5) / 16;
        } else {
          px = x + 1.002;
          py = y + 1 - (i + 0.5) / 16;
          pz = z + 1 - (j + 0.5) / 16;
          s = 1 - (i + 0.5) / 16;
          t = 1 - (j + 0.5) / 16;
        }
        let sh: number;
        if (coarse && ((i | j) & 1) !== 0) sh = cSh[(j & ~1) * 16 + (i & ~1)];
        else {
          sh = noSh ? 0 : shadowAt(px, py, pz);
          if (coarse) cSh[j * 16 + i] = sh;
        }
        const sunMul = ff * (1 - sh * (1 - look.shadow));
        let ao = aoAt(s, t);
        if (opts.inner) ao *= 0.42;
        let r = alb[d] * tone[0];
        let g = alb[d + 1] * tone[1];
        let b = alb[d + 2] * tone[2];
        // rim highlight on exposed top edges
        if (edge > 0) {
          let e = 0;
          if (face === 0) {
            if (j === 0) e = em & 1 ? edge : edge * 0.4;
            if (i === 0) e = Math.max(e, em & 2 ? edge : edge * 0.4);
          } else if (j === 0) e = edge * 0.6;
          if (e > 0) {
            r += (255 - r) * e * 0.55;
            g += (255 - g) * e * 0.55;
            b += (255 - b) * e * 0.55;
          }
        }
        const lr = look.light[0] * sunMul * ao;
        const lg = look.light[1] * sunMul * ao;
        const lb = look.light[2] * sunMul * ao;
        let or = r * lr;
        let og = g * lg;
        let ob = b * lb;
        if (lv) {
          sampleLight(px, py, pz, pt);
          const pg = look.pointGain * (0.55 + 0.45 * ao);
          or += r * pt[0] * pg;
          og += g * pt[1] * pg;
          ob += b * pt[2] * pg;
        }
        if (glow > 0) {
          or = or * (1 - glow) + r * look.glowGain * glow * 1.0;
          og = og * (1 - glow) + g * look.glowGain * glow * 1.0;
          ob = ob * (1 - glow) + b * look.glowGain * glow * 1.0;
        }
        // fog
        const scrY = sy(px, py, pz);
        const fa = fogAmount(scrY, pz);
        or = or * (1 - fa) + fogC[0] * fa;
        og = og * (1 - fa) + fogC[1] * fa;
        ob = ob * (1 - fa) + fogC[2] * fa;
        gradeFn(or, og, ob, gr);
        const rr = gr[0] < 0 ? 0 : gr[0] > 255 ? 255 : gr[0];
        const gg = gr[1] < 0 ? 0 : gr[1] > 255 ? 255 : gr[1];
        const bb2 = gr[2] < 0 ? 0 : gr[2] > 255 ? 255 : gr[2];
        lit[j * 16 + i] = pack(rr | 0, gg | 0, bb2 | 0, al);
      }
    }
    void rgb;
  };

  // --- ground-transition dithering (grass<->dirt etc.): mixes the neighbour's texels near shared edges
  const topIdOf = (x: number, y: number, z: number) => (x < 0 || y < 0 || x >= W || y >= D ? 0 : blocks[(z * D + y) * W + x]);

  const topAlbedo = (id: number, x: number, y: number, z: number): Uint8ClampedArray => {
    const def = BLOCKS[id];
    const orient = def.rot ? Math.floor(h3(x, y, z, seed) * 8) : 0;
    const a = albedoOf(def.top, def.tintTop ?? 'none', look, orient);
    if (def.decal) {
      const c = new Uint8ClampedArray(a);
      decal(c, def.decal, x, y, z, 0, seed);
      return c;
    }
    return a;
  };

  const tmpA = new Uint8ClampedArray(1024);
  const ditherTop = (a: Uint8ClampedArray, id: number, x: number, y: number, z: number): Uint8ClampedArray => {
    const def = BLOCKS[id];
    if (!def.ground) return a;
    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let copied = false;
    for (let k = 0; k < 4; k++) {
      const nx = x + dirs[k][0];
      const ny = y + dirs[k][1];
      // neighbour surface at same height
      const nid = topIdOf(nx, ny, z);
      if (!nid || nid === id) continue;
      const nd = BLOCKS[nid];
      if (nd.kind !== 'cube' || !nd.ground || nd.ground === def.ground) continue;
      if (solidTab[topIdOf(nx, ny, z + 1)]) continue;
      const na = topAlbedo(nid, nx, ny, z);
      if (!copied) {
        tmpA.set(a);
        copied = true;
      }
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 16; i++) {
          const dist = k === 0 ? i : k === 1 ? 15 - i : k === 2 ? j : 15 - j;
          if (dist > 5) continue;
          const p = Math.pow(1 - dist / 6, 1.2) * 0.62;
          const hv = h3(x * 16 + i, y * 16 + j, k, seed + 5);
          if (hv < p) {
            // mirror position inside neighbour
            const mi = k < 2 ? 15 - i : i;
            const mj = k >= 2 ? 15 - j : j;
            const d = (j * 16 + i) * 4;
            const s = (mj * 16 + mi) * 4;
            tmpA[d] = na[s];
            tmpA[d + 1] = na[s + 1];
            tmpA[d + 2] = na[s + 2];
          }
        }
    }
    return copied ? tmpA : a;
  };

  // --- soft offset drop shadow of the voxel mass (world-map islands) -------------------------------------------------
  if (look.dropShadow) {
    const ds = look.dropShadow;
    const mc = document.createElement('canvas');
    mc.width = bw;
    mc.height = bh;
    const g2 = mc.getContext('2d')!;
    g2.fillStyle = '#000';
    for (let y = 0; y < D; y++)
      for (let x = 0; x < W; x++) {
        let zt = -1;
        let zb = -1;
        for (let z = 0; z < H; z++) {
          const id = blocks[(z * D + y) * W + x];
          if (id && BLOCKS[id].kind !== 'plant') {
            if (zb < 0) zb = z;
            zt = z;
          }
        }
        if (zt < 0) continue;
        const Tx = sx(x, y);
        const Ty = sy(x, y, zt + 1);
        if (Tx < -200 || Tx > bw + 200 || Ty < -400 || Ty > bh + 400) continue;
        g2.beginPath();
        g2.moveTo(Tx, Ty);
        g2.lineTo(Tx + Wh, Ty + Hh);
        g2.lineTo(Tx + Wh, Ty + Hh + (zt + 1 - zb) * Hz);
        g2.lineTo(Tx, Ty + 2 * Hh + (zt + 1 - zb) * Hz);
        g2.lineTo(Tx - Wh, Ty + Hh + (zt + 1 - zb) * Hz);
        g2.lineTo(Tx - Wh, Ty + Hh);
        g2.closePath();
        g2.fill();
      }
    const sc = document.createElement('canvas');
    sc.width = bw;
    sc.height = bh;
    const g3 = sc.getContext('2d')!;
    g3.filter = `blur(${ds.blur}px)`;
    g3.drawImage(mc, ds.dx, ds.dy);
    const sd2 = g3.getImageData(0, 0, bw, bh).data;
    const mul = [ds.color[0] / 255, ds.color[1] / 255, ds.color[2] / 255];
    for (let i = 0, p = 3; i < bw * bh; i++, p += 4) {
      const a = (sd2[p] / 255) * ds.alpha;
      if (a < 0.004) continue;
      const c = buf.u32[i];
      const r = (c & 255) * (1 - a * (1 - mul[0]));
      const gg = ((c >>> 8) & 255) * (1 - a * (1 - mul[1]));
      const bb = ((c >>> 16) & 255) * (1 - a * (1 - mul[2]));
      buf.u32[i] = pack(r | 0, gg | 0, bb | 0);
    }
  }

  // --- main painter loop ---------------------------------------------------------------------------------------------
  const margin = 4;
  const sideScratch = new Uint8ClampedArray(1024);
  void sideScratch;
  const isEdgeLower = (x: number, y: number, z: number) => {
    // true if the cell at (x,y,z) top-layer is open (air/non-solid) i.e. neighbour column is lower
    return !(x >= 0 && y >= 0 && x < W && y < D && solidTab[blocks[((z) * D + y) * W + x]]);
  };

  const waterSpots: Baked['waterSpots'] = [];

  for (let s = 0; s <= W + D - 2; s++) {
    const xa = Math.max(0, s - D + 1);
    const xb = Math.min(W - 1, s);
    for (let x = xa; x <= xb; x++) {
      const y = s - x;
      // column screen x-range quick reject
      const cx = sx(x, y);
      if (cx + Wh < -margin || cx - Wh > bw + margin) continue;
      const base = sy(x, y, 0);
      // column spans from sy(z=H) - ... to base + Hh*2
      if (base - Hz * H > bh + margin || base + 2 * Hh + 2 * Hh < -margin) continue;
      for (let z = 0; z < H; z++) {
        const id = blocks[(z * D + y) * W + x];
        if (!id) continue;
        const topY = sy(x, y, z + 1);
        if (topY > bh + margin) continue; // lower cells are even lower on screen? (higher z -> smaller y) so continue upward
        if (topY + Hz + 2 * Hh < -margin) continue;
        buf.cur = (z * D + y) * W + x + 1;
        const def = BLOCKS[id];
        const above = z + 1 < H ? blocks[((z + 1) * D + y) * W + x] : 0;
        const right = x + 1 < W ? blocks[(z * D + y) * W + x + 1] : 0;
        const left = y + 1 < D ? blocks[(z * D + y + 1) * W + x] : 0;
        const Tx = sx(x, y);
        const Ty = sy(x, y, z + 1);

        if (def.kind === 'cube' || def.kind === 'leaf') {
          const isLeaf = def.kind === 'leaf';
          const aboveOpen = !solidTab[above];
          const rightOpen = !solidTab[right];
          const leftOpen = !solidTab[left];
          let shell = !isLeaf;
          if (isLeaf) {
            // only the outer shell of a canopy is drawn; faces towards other leaves are darkened (hole interiors)
            for (let n = 0; n < 6 && !shell; n++) {
              const nx = x + (n === 0 ? 1 : n === 1 ? -1 : 0);
              const ny = y + (n === 2 ? 1 : n === 3 ? -1 : 0);
              const nz = z + (n === 4 ? 1 : n === 5 ? -1 : 0);
              if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= D || nz >= H) {
                shell = true;
                break;
              }
              const nid = blocks[(nz * D + ny) * W + nx];
              if (nid === 0 || (!solidTab[nid] && !leafTab[nid])) shell = true;
            }
          }
          if (!shell) continue;
          if (aboveOpen) {
            const orient = def.rot ? Math.floor(h3(x, y, z, seed) * 8) : 0;
            let alb = albedoOf(def.top, def.tintTop ?? 'none', look, orient);
            if (def.decal) {
              const c = new Uint8ClampedArray(alb);
              decal(c, def.decal, x, y, z, 0, seed);
              alb = c;
            }
            if (!isLeaf) alb = ditherTop(alb, id, x, y, z);
            // exposed edges: neighbours behind (x-1, y-1) lower than us
            let em = 0;
            if (def.edge) {
              if (isEdgeLower(x, y - 1, z)) em |= 1;
              if (isEdgeLower(x - 1, y, z)) em |= 2;
            }
            shadeFace(alb, x, y, z, 0, def, {edgeAmt: def.edge ?? 0.05, edgeMask: em, noShadow: false, inner: isLeaf && leafTab[above] === 1});
            rasterTop(buf, Wh, Hh, Tx, Ty, 1, 1, 0, 0, 16, 16, lit, isLeaf, 0, null);
          }
          if (leftOpen) {
            const alb = sideAlbedo(def, id, x, y, z, 1);
            shadeFace(alb, x, y, z, 1, def, {edgeAmt: def.edge ?? 0, inner: isLeaf && leafTab[left] === 1});
            rasterLeft(buf, Wh, Hh, Hz, sx(x, y + 1), sy(x, y + 1, z + 1), 1, 1, 0, 0, 16, 16, lit, isLeaf, 0, null);
          }
          if (rightOpen) {
            const alb = sideAlbedo(def, id, x, y, z, 2);
            shadeFace(alb, x, y, z, 2, def, {edgeAmt: def.edge ?? 0, inner: isLeaf && leafTab[right] === 1});
            rasterRight(buf, Wh, Hh, Hz, sx(x + 1, y + 1), sy(x + 1, y + 1, z + 1), 1, 1, 0, 0, 16, 16, lit, isLeaf, 0, null);
          }
        } else if (def.kind === 'shape') {
          drawShape(id, def, x, y, z);
        } else if (def.kind === 'liquid') {
          drawLiquid(id, def, x, y, z, above, left, right);
        } else if (def.kind === 'portal') {
          drawShape(id, def, x, y, z);
        } else if (def.kind === 'plant') {
          drawPlant(id, def, x, y, z);
        }
      }
    }
  }

  function sideAlbedo(def: BlockDef, id: number, x: number, y: number, z: number, face: number): Uint8ClampedArray {
    const orient = def.rot && def.kind === 'cube' && def.side === def.top ? Math.floor(h3(x, y, z, seed + face) * 8) & 1 : 0;
    let alb = albedoOf(def.side, def.tintSide ?? 'none', look, orient, def.overlay);
    if (def.decal && (def.decal === 'stone' || def.decal === 'brick' || def.decal === 'dirt')) {
      const c = new Uint8ClampedArray(alb);
      decal(c, def.decal, x, y, z, face, seed);
      alb = c;
    }
    void id;
    return alb;
  }

  function drawShape(id: number, def: BlockDef, x: number, y: number, z: number) {
    if (def.boxes) {
      const sorted = [...def.boxes].sort((p, q) => p[2] - q[2]);
      for (const bx of sorted) drawBoxShape(id, def, bx, x, y, z);
    } else drawBoxShape(id, def, def.box!, x, y, z);
  }

  function drawBoxShape(id: number, def: BlockDef, box: [number, number, number, number, number, number], x: number, y: number, z: number) {
    const [x0, y0, z0, x1, y1, z1] = box;
    const fx0 = x + x0 / 16;
    const fx1 = x + x1 / 16;
    const fy0 = y + y0 / 16;
    const fy1 = y + y1 / 16;
    const fz0 = z + z0 / 16;
    const fz1 = z + z1 / 16;
    const cxp = (fx0 + fx1) / 2;
    const cyp = (fy0 + fy1) / 2;
    const czp = (fz0 + fz1) / 2;
    const fa = fogAmount(sy(cxp, cyp, czp), czp);

    if (def.kind === 'portal') {
      // Animated panel: record pixels so the portal swirl can be re-textured every frame.
      const alpha = 0.9;
      const gl = look.glowGain * 1.9 * (1 - fa) * alpha;
      for (let i = 0; i < 256; i++) {
        faceScale[i * 3] = gl;
        faceScale[i * 3 + 1] = gl;
        faceScale[i * 3 + 2] = gl;
        faceAdd[i * 3] = fogC[0] * fa * alpha;
        faceAdd[i * 3 + 1] = fogC[1] * fa * alpha;
        faceAdd[i * 3 + 2] = fogC[2] * fa * alpha;
      }
      faceKind = 3;
      faceAlpha = alpha;
      faceTex = getTex(def.side).data;
      if (y1 - y0 > x1 - x0) rasterRight(buf, Wh, Hh, Hz, sx(fx1, fy1), sy(fx1, fy1, fz1), fy1 - fy0, fz1 - fz0, 0, 0, 16, 16, lit, false, 3, recFn);
      else rasterLeft(buf, Wh, Hh, Hz, sx(fx0, fy1), sy(fx0, fy1, fz1), fx1 - fx0, fz1 - fz0, 0, 0, 16, 16, lit, false, 3, recFn);
      return;
    }

    const topAlb = albedoOf(def.top, def.tintTop ?? 'none', look, 0);
    const sideAlb = albedoOf(def.side, def.tintSide ?? 'none', look, 0);
    toneAt(x, y, tone);
    const glow = def.glow ?? 0;
    sampleLight(cxp, cyp, czp + 0.3, pt);
    const shapeFace = (face: 0 | 1 | 2, alb: Uint8ClampedArray) => {
      const shd = def.noShadow ? 0 : shadowAt(face === 2 ? fx1 + 0.02 : cxp, face === 1 ? fy1 + 0.02 : cyp, face === 0 ? fz1 + 0.02 : czp);
      const sunMul = Fface[face] * (1 - shd * (1 - look.shadow));
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 16; i++) {
          const d = (j * 16 + i) * 4;
          const al = alb[d + 3];
          if (al < 128) {
            lit[j * 16 + i] = 0;
            continue;
          }
          let ao = 1;
          if (face !== 0) ao = 1 - 0.22 * Math.max(0, j / 15 - 0.55) / 0.45;
          const r = alb[d] * tone[0];
          const g = alb[d + 1] * tone[1];
          const b = alb[d + 2] * tone[2];
          let or = r * look.light[0] * sunMul * ao + r * pt[0] * look.pointGain;
          let og = g * look.light[1] * sunMul * ao + g * pt[1] * look.pointGain;
          let ob = b * look.light[2] * sunMul * ao + b * pt[2] * look.pointGain;
          if (glow > 0) {
            or = or * (1 - glow) + r * look.glowGain * glow * 1.15;
            og = og * (1 - glow) + g * look.glowGain * glow * 1.15;
            ob = ob * (1 - glow) + b * look.glowGain * glow * 1.15;
          }
          or = or * (1 - fa) + fogC[0] * fa;
          og = og * (1 - fa) + fogC[1] * fa;
          ob = ob * (1 - fa) + fogC[2] * fa;
          gradeFn(or, og, ob, gr);
          lit[j * 16 + i] = pack(clamp(gr[0], 0, 255) | 0, clamp(gr[1], 0, 255) | 0, clamp(gr[2], 0, 255) | 0, al);
        }
    };
    shapeFace(0, topAlb);
    rasterTop(buf, Wh, Hh, sx(fx0, fy0), sy(fx0, fy0, fz1), fx1 - fx0, fy1 - fy0, x0, y0, x1, y1, lit, true, 0, null);
    shapeFace(1, sideAlb);
    rasterLeft(buf, Wh, Hh, Hz, sx(fx0, fy1), sy(fx0, fy1, fz1), fx1 - fx0, fz1 - fz0, x0, 16 - z1, x1, 16 - z0, lit, true, 0, null);
    shapeFace(2, sideAlb);
    rasterRight(buf, Wh, Hh, Hz, sx(fx1, fy1), sy(fx1, fy1, fz1), fy1 - fy0, fz1 - fz0, 16 - y1, 16 - z1, 16 - y0, 16 - z0, lit, true, 0, null);
    void id;
  }

  /** Is the neighbour column at (nx,ny) solid land at the water's level (i.e. a shore)? */
  function shoreAt(nx: number, ny: number, z: number) {
    if (nx < 0 || ny < 0 || nx >= W || ny >= D) return false;
    return solidTab[blocks[(z * D + ny) * W + nx]] === 1;
  }

  function drawLiquid(id: number, def: BlockDef, x: number, y: number, z: number, above: number, left: number, right: number) {
    const isLava = def.anim === 'lava';
    const kind = isLava ? 2 : 1;
    const topZ = z + (isLava ? 0.88 : 0.92);
    let depth = 0;
    for (let k = z - 1; k >= 0 && blocks[(k * D + y) * W + x] === id; k--) depth++;
    const visTop = !solidTab[above] && above !== id;
    faceTex = getTex(def.top).data;
    faceKind = kind;
    const shade = (face: 0 | 1 | 2) => {
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 16; i++) {
          let px: number;
          let py: number;
          let pz: number;
          if (face === 0) {
            px = x + (i + 0.5) / 16;
            py = y + (j + 0.5) / 16;
            pz = topZ;
          } else if (face === 1) {
            px = x + (i + 0.5) / 16;
            py = y + 1;
            pz = topZ - ((j + 0.5) / 16) * 0.92;
          } else {
            px = x + 1;
            py = y + 1 - (i + 0.5) / 16;
            pz = topZ - ((j + 0.5) / 16) * 0.92;
          }
          const o = (j * 16 + i) * 3;
          const fa = fogAmount(sy(px, py, pz), pz);
          if (isLava) {
            const gain = look.glowGain * (face === 0 ? 1.4 : 1.05) * (1 - fa);
            faceScale[o] = gain * 1.04;
            faceScale[o + 1] = gain * 0.97;
            faceScale[o + 2] = gain * 0.9;
            faceAdd[o] = fogC[0] * fa + 48 * (1 - fa);
            faceAdd[o + 1] = fogC[1] * fa + 36 * (1 - fa);
            faceAdd[o + 2] = fogC[2] * fa;
            faceAlpha = 1;
          } else {
            const a = clamp(look.waterAlpha + depth * 0.05, 0.4, 0.94);
            faceAlpha = a;
            const sh = shadowAt(px, py, z + 1.02);
            const sunMul = Fface[face] * (1 - sh * (1 - look.shadow));
            let lr = look.light[0] * sunMul;
            let lg = look.light[1] * sunMul;
            let lb = look.light[2] * sunMul;
            if (lv) {
              sampleLight(px, py, pz + 0.3, pt);
              lr += pt[0] * look.pointGain * 0.8;
              lg += pt[1] * look.pointGain * 0.8;
              lb += pt[2] * look.pointGain * 0.8;
            }
            const wt = look.tint.water;
            const deep = clamp(depth / 4);
            faceScale[o] = ((lr * wt[0]) / 120) * (1 - deep * 0.3) * (1 - fa) * a;
            faceScale[o + 1] = ((lg * wt[1]) / 120) * (1 - deep * 0.3) * (1 - fa) * a;
            faceScale[o + 2] = ((lb * wt[2]) / 120) * (1 - deep * 0.25) * (1 - fa) * a;
            faceAdd[o] = (fogC[0] * fa + look.waterDeep[0] * deep * 0.45) * a;
            faceAdd[o + 1] = (fogC[1] * fa + look.waterDeep[1] * deep * 0.45) * a;
            faceAdd[o + 2] = (fogC[2] * fa + look.waterDeep[2] * deep * 0.45) * a;
            if (face === 0) {
              // shoreline foam: pale line hugging the banks (texel-ragged)
              let fm = 0;
              const ee = 2.4;
              if (i < ee && shoreAt(x - 1, y, z)) fm = Math.max(fm, 1 - i / ee);
              if (i > 15 - ee && shoreAt(x + 1, y, z)) fm = Math.max(fm, 1 - (15 - i) / ee);
              if (j < ee && shoreAt(x, y - 1, z)) fm = Math.max(fm, 1 - j / ee);
              if (j > 15 - ee && shoreAt(x, y + 1, z)) fm = Math.max(fm, 1 - (15 - j) / ee);
              if (fm > 0 && h3(x * 16 + i, y * 16 + j, 7, seed) < fm * 0.9) {
                faceScale[o] *= 0.35;
                faceScale[o + 1] *= 0.35;
                faceScale[o + 2] *= 0.35;
                const fl = (1 - fa) * (0.5 + 0.5 * look.light[1]);
                faceAdd[o] += 215 * fl * a * 0.75;
                faceAdd[o + 1] += 232 * fl * a * 0.75;
                faceAdd[o + 2] += 240 * fl * a * 0.75;
              }
            }
          }
        }
    };
    const open = (n: number) => n === 0 || (!solidTab[n] && n !== id && BLOCKS[n].kind !== 'leaf');
    if (visTop) {
      shade(0);
      rasterTop(buf, Wh, Hh, sx(x, y), sy(x, y, topZ), 1, 1, 0, 0, 16, 16, lit, false, kind, recFn);
    }
    if (open(left)) {
      shade(1);
      rasterLeft(buf, Wh, Hh, Hz, sx(x, y + 1), sy(x, y + 1, topZ), 1, 0.92, 0, 0, 16, 16, lit, false, kind, recFn);
    }
    if (open(right)) {
      shade(2);
      rasterRight(buf, Wh, Hh, Hz, sx(x + 1, y + 1), sy(x + 1, y + 1, topZ), 1, 0.92, 0, 0, 16, 16, lit, false, kind, recFn);
    }
  }

  function drawPlant(id: number, def: BlockDef, x: number, y: number, z: number) {
    const p = def.plant!;
    const below = z > 0 ? blocks[((z - 1) * D + y) * W + x] : 0;
    void below;
    const alb = albedoOf(p.tex, p.tint ?? 'none', look, 0);
    toneAt(x, y, tone);
    // ground lighting sample: shadow + point light at the cell centre
    const shd = shadowAt(x + 0.5, y + 0.5, z + 0.05);
    const sunMul = Fface[0] * (1 - shd * (1 - look.shadow));
    sampleLight(x + 0.5, y + 0.5, z + 0.5, pt);
    const glow = p.glow ?? 0;
    const fa = fogAmount(sy(x + 0.5, y + 0.5, z + 0.5), z + 0.5);
    for (let k = 0; k < p.count; k++) {
      const hx = h3(x, y, z * 11 + k, seed + 21);
      const hy = h3(x, y, z * 11 + k, seed + 22);
      const hr = h3(x, y, z * 11 + k, seed + 23);
      const hs = h3(x, y, z * 11 + k, seed + 24);
      const ccx = x + 0.15 + hx * 0.7;
      const ccy = y + 0.15 + hy * 0.7;
      const size = 0.85 + hs * 0.45;
      const hgt = p.h * size;
      const wid = p.w * size;
      const ang = hr * Math.PI * 0.5;
      // two planes at angle ang and ang+90deg
      for (let pl = 0; pl < 2; pl++) {
        const a2 = ang + pl * Math.PI * 0.5;
        const dx = Math.cos(a2) * wid * 0.5;
        const dy = Math.sin(a2) * wid * 0.5;
        // endpoints (grid) -> screen x ordering
        let ax0 = ccx - dx;
        let ay0 = ccy - dy;
        let ax1 = ccx + dx;
        let ay1 = ccy + dy;
        const sx0 = sx(ax0, ay0);
        const sx1 = sx(ax1, ay1);
        let mirror = false;
        if (sx1 < sx0) {
          [ax0, ax1] = [ax1, ax0];
          [ay0, ay1] = [ay1, ay0];
          mirror = true;
        }
        // shading
        for (let j = 0; j < 16; j++)
          for (let i = 0; i < 16; i++) {
            const d = (j * 16 + i) * 4;
            const al = alb[d + 3];
            if (al < 128) {
              lit[j * 16 + i] = 0;
              continue;
            }
            const vv = 1 - j / 15; // 0 at base
            const ao = 0.62 + 0.5 * Math.min(1, vv * 1.4);
            const r = alb[d] * tone[0] * 1.08;
            const g = alb[d + 1] * tone[1] * 1.08;
            const b = alb[d + 2] * tone[2] * 1.08;
            let or = r * look.light[0] * sunMul * ao + r * pt[0] * look.pointGain;
            let og = g * look.light[1] * sunMul * ao + g * pt[1] * look.pointGain;
            let ob = b * look.light[2] * sunMul * ao + b * pt[2] * look.pointGain;
            if (glow > 0) {
              or = or * (1 - glow) + r * look.glowGain * glow;
              og = og * (1 - glow) + g * look.glowGain * glow;
              ob = ob * (1 - glow) + b * look.glowGain * glow;
            }
            or = or * (1 - fa) + fogC[0] * fa;
            og = og * (1 - fa) + fogC[1] * fa;
            ob = ob * (1 - fa) + fogC[2] * fa;
            gradeFn(or, og, ob, gr);
            const ii = mirror ? 15 - i : i;
            lit[j * 16 + ii] = pack(clamp(gr[0], 0, 255) | 0, clamp(gr[1], 0, 255) | 0, clamp(gr[2], 0, 255) | 0, al);
          }
        // screen parallelogram: left top vertex at (ax0,ay0,z+hgt)
        const Lx = sx(ax0, ay0);
        const Ly = sy(ax0, ay0, z + hgt);
        const wpx = sx(ax1, ay1) - Lx;
        const slope = sy(ax1, ay1, z + hgt) - Ly;
        rasterPlane(buf, Lx, Ly, wpx, slope, Hz * hgt, lit);
      }
    }
    void id;
  }

  // ------- emitter visibility (is the emitter's top face still the last thing drawn at its pixel?) -------
  for (const e of emitters) {
    const def = BLOCKS[e.id];
    const zt = e.z + (def.box ? def.box[5] / 16 : 1) - 0.03;
    const px = Math.round(sx(e.x + 0.5, e.y + 0.5));
    const py = Math.round(sy(e.x + 0.5, e.y + 0.5, zt));
    let seen = false;
    for (let dy = -1; dy <= 1 && !seen; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const qx = px + dx * 2;
        const qy = py + dy * 2;
        if (qx < 0 || qy < 0 || qx >= bw || qy >= bh) {
          seen = true;
          break;
        }
        if (buf.owner![qy * bw + qx] === (e.z * D + e.y) * W + e.x + 1) {
          seen = true;
          break;
        }
      }
    e.vis = seen;
  }

  // ------- finish ------
  const img = new ImageData(buf.u8 as unknown as Uint8ClampedArray<ArrayBuffer>, bw, bh);
  const canvas = document.createElement('canvas');
  canvas.width = bw;
  canvas.height = bh;
  const cx = canvas.getContext('2d')!;
  cx.putImageData(img, 0, 0);

  // collect liquid set (drop pixels that later got overdrawn)
  let liquid: LiquidSet | null = null;
  if (liquidUsed && buf.ids) {
    const ids = buf.ids;
  const own = buf.owner;
  const cur = buf.cur;
    const keep: number[] = [];
    for (let i = 0; i < L_n; i++) if (ids[L_idx[i]] === L_kind[i]) keep.push(i);
    const n = keep.length;
    liquid = {n, idx: new Int32Array(n), texel: new Uint8Array(n), kind: new Uint8Array(n), scale: new Uint8Array(n * 3), add: new Uint8Array(n * 3)};
    for (let k = 0; k < n; k++) {
      const i = keep[k];
      liquid.idx[k] = L_idx[i];
      liquid.texel[k] = L_texel[i];
      liquid.kind[k] = L_kind[i];
      liquid.scale[k * 3] = L_scale[i * 3];
      liquid.scale[k * 3 + 1] = L_scale[i * 3 + 1];
      liquid.scale[k * 3 + 2] = L_scale[i * 3 + 2];
      liquid.add[k * 3] = L_add[i * 3];
      liquid.add[k * 3 + 1] = L_add[i * 3 + 1];
      liquid.add[k * 3 + 2] = L_add[i * 3 + 2];
    }
    // sparkle candidates: water pixels on texel centres
    for (let k = 0; k < n; k += 1) {
      if (liquid.kind[k] !== 1) continue;
      const hsh = h2(liquid.idx[k] % 7919, (liquid.idx[k] / 7919) | 0, seed + 4);
      if (hsh < 0.0014) waterSpots.push({x: liquid.idx[k] % bw, y: Math.floor(liquid.idx[k] / bw)});
    }
  }

  return {
    w: bw,
    h: bh,
    img,
    canvas,
    geom,
    ox,
    oy,
    proj: (gx, gy, gz) => ({x: sx(gx, gy), y: sy(gx, gy, gz)}),
    liquid,
    waterSpots,
    emitters,
    lightVol,
  };
  void P;
};

// ---------------------------------------------------------------------------------------------------------------------

const fbmLite = (x: number, y: number, s: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = h2(xi, yi, s);
  const b = h2(xi + 1, yi, s);
  const c = h2(xi, yi + 1, s);
  const d = h2(xi + 1, yi + 1, s);
  const v1 = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  // second octave
  const x2 = x * 2.1;
  const y2 = y * 2.1;
  const xj = Math.floor(x2);
  const yj = Math.floor(y2);
  const gx = x2 - xj;
  const gy = y2 - yj;
  const ux = gx * gx * (3 - 2 * gx);
  const uy = gy * gy * (3 - 2 * gy);
  const a2 = h2(xj, yj, s + 5);
  const b2 = h2(xj + 1, yj, s + 5);
  const c2 = h2(xj, yj + 1, s + 5);
  const d2 = h2(xj + 1, yj + 1, s + 5);
  const v2 = a2 + (b2 - a2) * ux + (c2 - a2) * uy + (a2 - b2 - c2 + d2) * ux * uy;
  return v1 * 0.67 + v2 * 0.33;
};

/** Axis-free vertical plane: top edge from (Lx,Ly) with horizontal extent wpx and vertical slope `slope`, height hpx. */
const rasterPlane = (buf: Buf, Lx: number, Ly: number, wpx: number, slope: number, hpx: number, lit: Uint32Array) => {
  const w = buf.w;
  const h = buf.h;
  const u32 = buf.u32;
  const ids = buf.ids;
  const own = buf.owner;
  const cur = buf.cur;
  const xs = Math.max(0, Math.ceil(Lx - 0.5));
  const xe = Math.min(w - 1, Math.floor(Lx + wpx - 0.5));
  if (wpx < 0.5) return;
  for (let px = xs; px <= xe; px++) {
    const u = (px + 0.5 - Lx) / wpx;
    const topY = Ly + u * slope;
    const ys = Math.max(0, Math.ceil(topY - 0.5));
    const ye = Math.min(h - 1, Math.floor(topY + hpx - 0.5));
    let ti = (u * 16) | 0;
    if (ti > 15) ti = 15;
    for (let py = ys; py <= ye; py++) {
      const v = (py + 0.5 - topY) / hpx;
      let tj = (v * 16) | 0;
      if (tj > 15) tj = 15;
      const c = lit[tj * 16 + ti];
      if (c >>> 24 < 128) continue;
      const i = py * w + px;
      if (ids) ids[i] = 0;
      if (own) own[i] = cur;
      u32[i] = c;
    }
  }
};
