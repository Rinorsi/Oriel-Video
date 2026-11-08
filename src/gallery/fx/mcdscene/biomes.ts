// World generators (one per biome). All deterministic from `seed`.
import {B} from './blocks';
import {boulder, cactus, portal, spruce, tree, World} from './world';
import {fbm, h2, h3, lerp, smoothstep} from './rng';

const clampI = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Terraced noise height map -> Int16Array. */
const heightMap = (W: number, D: number, f: (x: number, y: number) => number) => {
  const hm = new Int16Array(W * D);
  for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) hm[y * W + x] = Math.max(1, Math.round(f(x, y)));
  return hm;
};

/** Smooth away single-cell spikes and pits so terraces stay readable. */
const tidy = (hm: Int16Array, W: number, D: number, passes = 2) => {
  for (let p = 0; p < passes; p++)
    for (let y = 1; y < D - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        const c = hm[i];
        const n = [hm[i - 1], hm[i + 1], hm[i - W], hm[i + W]];
        const hi = n.filter((v) => v > c).length;
        const lo = n.filter((v) => v < c).length;
        if (hi >= 3) hm[i] = Math.min(...n.filter((v) => v > c));
        else if (lo >= 3) hm[i] = Math.max(...n.filter((v) => v < c));
      }
};

/** Poisson-ish scatter: calls place(x,y) for accepted points with min spacing. */
const scatter = (W: number, D: number, count: number, spacing: number, seed: number, ok: (x: number, y: number) => boolean, place: (x: number, y: number, i: number) => void) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < count * 14 && pts.length < count; i++) {
    const x = 2 + Math.floor(h3(i, 1, seed, 201) * (W - 4));
    const y = 2 + Math.floor(h3(i, 2, seed, 202) * (D - 4));
    if (!ok(x, y)) continue;
    if (pts.some(([a, b]) => (a - x) * (a - x) + (b - y) * (b - y) < spacing * spacing)) continue;
    pts.push([x, y]);
    place(x, y, pts.length);
  }
  return pts;
};

// =====================================================================================================================
// Forest (day / night share the terrain; the look decides the mood)

export const genForest = (seed: number, opts: {night?: boolean} = {}): World => {
  const W = 84;
  const D = 84;
  const Hh = 26;
  const w = new World(W, D, Hh, seed);
  const night = !!opts.night;
  const cx = 42;
  const cy = 44;
  const hm = heightMap(W, D, (x, y) => {
    const n = fbm(x * 0.05, y * 0.05, seed, 4);
    const r = fbm(x * 0.11 + 30, y * 0.11, seed + 5, 3);
    let h = 3.5 + n * 9 + r * 2.2;
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    // central meadow
    h = lerp(h, 5, smoothstep(24, 6, d) * 0.65);
    // raised ruin plateau up-right of centre (screen up-right = -y)
    const px = x - (cx + 6);
    const py = y - (cy - 12);
    h = lerp(h, 9, smoothstep(9, 4.5, Math.hypot(px, py * 1.15)));
    // cliff mound at left
    const mx = x - (cx - 15);
    const my = y - (cy - 3);
    h = lerp(h, 11, smoothstep(8, 3, Math.hypot(mx, my)) * 0.9);
    // stream running along +x (down-right on screen)
    const sy = cy + 8 + Math.sin(x * 0.17 + seed) * 3 + (x - cx) * 0.12;
    const sd = Math.abs(y - sy);
    h = lerp(h, 2.4, smoothstep(4.2, 1.2, sd));
    // world rim rises a little so the horizon is wooded
    h += smoothstep(34, 42, d) * 3;
    return h;
  });
  tidy(hm, W, D, 3);
  const waterLevel = 4;
  const pathAt = (x: number, y: number) => {
    // winding dirt path along the meadow
    const py = cy + 1 + Math.sin(x * 0.2 + 1) * 2.4 - (x - cx) * 0.35;
    return Math.abs(y - py) < 1.25 && Math.hypot(x - cx, y - cy) < 26;
  };
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      let top = hm[y * W + x];
      const shore = top <= waterLevel + 1 && top >= waterLevel - 2;
      let topId = B.grass;
      if (top < waterLevel) topId = h2(x, y, seed) < 0.5 ? B.dirt : B.gravel;
      else if (shore && top <= waterLevel) topId = B.coarse_dirt;
      else if (pathAt(x, y) && top <= 8) topId = h2(x, y, seed + 3) < 0.25 ? B.coarse_dirt : B.path;
      else if (top >= 11 && h2(x, y, seed + 9) < 0.55) topId = B.podzol;
      const stoneDepth = top > 9 ? 2 : 3;
      w.column(x, y, top, topId, B.dirt, stoneDepth, B.stone);
      // sprinkle stone/andesite inside cliffs
      for (let z = 0; z < top - 2; z++) if (h3(x, y, z, seed + 4) < 0.12) w.set(x, y, z, B.andesite);
      if (top < waterLevel) for (let z = top; z < waterLevel; z++) w.set(x, y, z, B.water);
    }
  // ruin on the plateau
  const rx = cx + 6;
  const ry = cy - 12;
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const x = rx + dx;
      const y = ry + dy;
      const top = w.surface(x, y);
      const edge = Math.max(Math.abs(dx), Math.abs(dy));
      if (edge <= 3) w.set(x, y, top - 1, h2(x, y, seed + 7) < 0.3 ? B.mossy_bricks : h2(x, y, seed + 8) < 0.2 ? B.cracked_bricks : B.stone_bricks);
      if (edge === 3 && h2(x, y, seed + 11) < 0.78) {
        const hgt = 1 + Math.floor(h2(x, y, seed + 12) * 3);
        for (let k = 0; k < hgt; k++) w.set(x, y, top + k, k === hgt - 1 && h2(x, y, seed + 13) < 0.3 ? B.mossy_bricks : B.stone_bricks);
      }
    }
  for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    const x = rx + dx;
    const y = ry + dy;
    const top = w.surface(x, y);
    for (let k = 0; k < 4; k++) w.set(x, y, top + k - (k === 0 ? 0 : 0), k === 3 ? B.chiseled_bricks : B.stone_bricks);
  }
  if (!night) w.set(rx, ry, w.surface(rx, ry), B.campfire);
  else w.set(rx, ry, w.surface(rx, ry), B.torch);
  if (night) {
    // villager-style camp in the meadow: campfire, fence ring, log seats and lanterns
    const fx = cx + 3;
    const fy = cy - 1;
    const fz = w.surface(fx, fy);
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
      if (Math.hypot(x, y) > 4.6) continue;
      const gx = fx + x;
      const gy = fy + y;
      const t = w.surface(gx, gy);
      for (let z = fz; z < t + 4; z++) w.set(gx, gy, z, 0);
      for (let z = t; z < fz; z++) w.set(gx, gy, z, B.dirt);
      w.set(gx, gy, fz - 1, Math.hypot(x, y) < 1.8 ? B.coarse_dirt : B.grass);
    }
    w.set(fx, fy, fz, B.campfire);
    for (let i = -3; i <= 3; i++) {
      if (Math.abs(i) < 1) continue;
      w.set(fx + i, fy - 3, fz, B.fence_x);
      w.set(fx + i, fy + 3, fz, B.fence_x);
      w.set(fx - 3, fy + i, fz, B.fence_y);
      w.set(fx + 3, fy + i, fz, B.fence_y);
    }
    w.set(fx - 2, fy + 1, fz, B.slab_dark);
    w.set(fx + 1, fy + 2, fz, B.slab_dark);
    w.set(fx + 2, fy - 1, fz, B.slab_dark);
  }
  // trees: dense at the rim, sparse in the meadow
  scatter(
    W,
    D,
    night ? 70 : 62,
    3.3,
    seed,
    (x, y) => {
      const top = w.surface(x, y);
      const d = Math.hypot(x - cx, y - cy);
      if (top <= waterLevel + 1 || w.get(x, y, top - 1) !== B.grass && w.get(x, y, top - 1) !== B.podzol) return false;
      if (pathAt(x, y)) return false;
      if (Math.abs(x - rx) < 6 && Math.abs(y - ry) < 6) return false;
      return d > 15 || h2(x, y, seed + 21) < 0.14;
    },
    (x, y, i) => {
      const top = w.surface(x, y);
      const big = h2(x, y, seed + 22);
      if (night && big < 0.4) spruce(w, x, y, top, {h: 7 + Math.floor(h2(x, y, 3) * 4), seed: i});
      else tree(w, x, y, top, {trunk: 4 + Math.floor(big * 3), r: big > 0.7 ? 3 : 2, seed: i, leaf: night ? B.dark_leaves : i % 6 === 0 ? B.maple_leaves : B.oak_leaves, log: night ? B.dark_oak_log : B.oak_log});
    },
  );
  // boulders
  scatter(W, D, 9, 6, seed + 5, (x, y) => w.get(x, y, w.surface(x, y) - 1) === B.grass, (x, y, i) => boulder(w, x, y, w.surface(x, y), 1, i % 3 === 0 ? B.mossy_cobble : B.cobble, i));
  // ground cover
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const top = w.surface(x, y);
      const under = w.get(x, y, top - 1);
      if (w.get(x, y, top) !== 0) continue;
      const r = h3(x, y, 7, seed + 31);
      const clump = fbm(x * 0.2, y * 0.2, seed + 6, 2);
      if (under === B.grass) {
        if (r < 0.06 + 0.58 * smoothstep(0.44, 0.7, clump)) w.set(x, y, top, r < 0.05 ? B.tuft_tall : r < 0.09 ? B.fern : B.tuft);
        else if (r > 0.965) w.set(x, y, top, [B.poppy, B.dandelion, B.cornflower, B.oxeye, B.azure, B.allium][Math.floor(h2(x, y, seed + 32) * 6)]);
        else if (r > 0.95 && night) w.set(x, y, top, B.brown_mushroom);
      } else if (under === B.podzol && r < 0.4) w.set(x, y, top, B.fern);
      else if ((under === B.coarse_dirt || under === B.dirt) && r < 0.12) w.set(x, y, top, B.sugar_cane);
    }
  // night: glowing mushrooms by the campfire and lanterns on path
  if (night) {
    scatter(W, D, 12, 7, seed + 9, (x, y) => Math.hypot(x - cx, y - cy) < 18 && w.get(x, y, w.surface(x, y)) === 0 && w.get(x, y, w.surface(x, y) - 1) === B.grass, (x, y) => {
      const t = w.surface(x, y);
      w.set(x, y, t, B.shroom_glow);
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 1]]) if (h3(x + dx, y + dy, 3, seed) < 0.7 && w.get(x + dx, y + dy, w.surface(x + dx, y + dy) - 1) === B.grass) w.set(x + dx, y + dy, w.surface(x + dx, y + dy), B.shroom_glow);
    });
  }
  return w;
};

export const genForestDay = (seed: number) => genForest(seed, {night: false});
export const genForestNight = (seed: number) => genForest(seed, {night: true});

void clampI;
void cactus;
void portal;
