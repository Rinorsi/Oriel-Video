// Voxel world container + small construction helpers used by the biome generators.
import {B, BLOCKS, isSolidCube} from './blocks';
import {h2, h3} from './rng';

export class World {
  readonly w: number;
  readonly d: number;
  readonly h: number;
  readonly blocks: Uint8Array;
  /** Per-cell small data byte (e.g. orientation flags), default 0. */
  readonly seed: number;

  constructor(w: number, d: number, h: number, seed = 1) {
    this.w = w;
    this.d = d;
    this.h = h;
    this.seed = seed;
    this.blocks = new Uint8Array(w * d * h);
  }

  idx(x: number, y: number, z: number) {
    return (z * this.d + y) * this.w + x;
  }
  inside(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h;
  }
  get(x: number, y: number, z: number): number {
    return this.inside(x, y, z) ? this.blocks[(z * this.d + y) * this.w + x] : 0;
  }
  set(x: number, y: number, z: number, id: number) {
    if (this.inside(x, y, z)) this.blocks[(z * this.d + y) * this.w + x] = id;
  }
  /** Set only if the cell is empty. */
  put(x: number, y: number, z: number, id: number) {
    if (this.inside(x, y, z) && this.get(x, y, z) === 0) this.set(x, y, z, id);
  }
  fill(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) {
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, id);
  }
  /** Height of the first empty cell above the highest solid-cube/liquid/shape cell (ignores plants). */
  surface(x: number, y: number): number {
    for (let z = this.h - 1; z >= 0; z--) {
      const id = this.get(x, y, z);
      if (id !== 0 && BLOCKS[id].kind !== 'plant') return z + 1;
    }
    return 0;
  }
  /** Is the cell a full opaque cube? */
  solidAt(x: number, y: number, z: number) {
    return isSolidCube(this.get(x, y, z));
  }
  /** Fill a column from z0 up to (excluding) top with layered blocks: top block, then `sub` for subDepth, then `deep`. */
  column(x: number, y: number, top: number, topId: number, sub: number, subDepth: number, deep: number, from = 0) {
    for (let z = from; z < top; z++) {
      const dz = top - 1 - z;
      this.set(x, y, z, dz === 0 ? topId : dz <= subDepth ? sub : deep);
    }
  }
}

/** Oak-like round tree: log trunk + leaf blob. Returns nothing; writes into the world. */
export const tree = (w: World, x: number, y: number, z: number, o: {trunk?: number; leaf?: number; log?: number; r?: number; seed?: number; flat?: boolean} = {}) => {
  const log = o.log ?? B.oak_log;
  const leaf = o.leaf ?? B.oak_leaves;
  const th = o.trunk ?? 4;
  const r = o.r ?? 2;
  const s = o.seed ?? 0;
  for (let i = 0; i < th; i++) w.set(x, y, z + i, log);
  const cz = z + th - 1;
  for (let dz = -1; dz <= r; dz++) {
    const rad = dz === r ? Math.max(1, r - 1) : dz < 0 ? r - 0.5 : r + (dz === 0 ? 0.3 : -dz * 0.45 + 0.3);
    const rr = Math.max(0.7, rad);
    for (let dy = -r - 1; dy <= r + 1; dy++)
      for (let dx = -r - 1; dx <= r + 1; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy * (o.flat ? 1 : 1));
        const jitter = (h3(x + dx, y + dy, cz + dz, s) - 0.5) * 0.9;
        if (dist + jitter <= rr + 0.2) w.put(x + dx, y + dy, cz + dz, leaf);
      }
  }
  w.set(x, y, cz + r, w.get(x, y, cz + r) === 0 ? leaf : w.get(x, y, cz + r));
};

/** Conical spruce: stacked leaf rings narrowing upward over a log. */
export const spruce = (w: World, x: number, y: number, z: number, o: {h?: number; leaf?: number; log?: number; seed?: number} = {}) => {
  const hh = o.h ?? 7;
  const log = o.log ?? B.spruce_log;
  const leaf = o.leaf ?? B.spruce_leaves;
  for (let i = 0; i < hh; i++) w.set(x, y, z + i, log);
  for (let i = 2; i <= hh; i++) {
    const t = (i - 2) / Math.max(1, hh - 2);
    const rad = Math.max(0, Math.round((1 - t) * 2.6 - (i % 2) * 0.6));
    for (let dy = -rad; dy <= rad; dy++)
      for (let dx = -rad; dx <= rad; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > rad + 1) continue;
        if (h3(x + dx, y + dy, z + i, o.seed ?? 0) < 0.12 && rad > 1) continue;
        w.put(x + dx, y + dy, z + i, leaf);
      }
  }
  w.put(x, y, z + hh, leaf);
  w.put(x, y, z + hh + 1, leaf);
};

/** Cactus column (1..h). */
export const cactus = (w: World, x: number, y: number, z: number, hgt = 2) => {
  for (let i = 0; i < hgt; i++) w.set(x, y, z + i, B.cactus);
};

/** Rough boulder of one block type. */
export const boulder = (w: World, x: number, y: number, z: number, r: number, id: number, seed = 0) => {
  for (let dz = 0; dz <= r; dz++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const dd = Math.sqrt(dx * dx + dy * dy + dz * dz * 1.6) + (h3(x + dx, y + dy, z + dz, seed) - 0.5) * 0.9;
        if (dd <= r + 0.15) w.put(x + dx, y + dy, z + dz, id);
      }
};

/** Vertical torch on top of a solid cell. */
export const torchAt = (w: World, x: number, y: number, z: number, soul = false) => w.set(x, y, z, soul ? B.soul_torch : B.torch);

/** Nether portal frame (obsidian 4x5) with portal fill, facing along x or y. Origin = lowest corner. */
export const portal = (w: World, x: number, y: number, z: number, axis: 'x' | 'y', frame = B.obsidian) => {
  for (let i = 0; i < 4; i++)
    for (let k = 0; k < 5; k++) {
      const px = axis === 'x' ? x + i : x;
      const py = axis === 'y' ? y + i : y;
      const edge = i === 0 || i === 3 || k === 0 || k === 4;
      w.set(px, py, z + k, edge ? frame : axis === 'x' ? B.portal : B.portal_x);
    }
};

/** Small deterministic helper for weighted choice. */
export const pick = <T,>(arr: readonly T[], x: number, y: number, s = 0): T => arr[Math.floor(h2(x, y, s) * arr.length) % arr.length];
