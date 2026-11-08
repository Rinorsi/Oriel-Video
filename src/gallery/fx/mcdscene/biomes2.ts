// More biome generators: desert, nether, end, snow, camp. See biomes.ts for forest.
import {B} from './blocks';
import {boulder, cactus, portal, spruce, tree, World} from './world';
import {fbm, h2, h3, lerp, smoothstep} from './rng';

const heightMap = (W: number, D: number, f: (x: number, y: number) => number) => {
  const hm = new Int16Array(W * D);
  for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) hm[y * W + x] = Math.max(1, Math.round(f(x, y)));
  return hm;
};
const tidy = (hm: Int16Array, W: number, D: number, passes = 2) => {
  for (let p = 0; p < passes; p++)
    for (let y = 1; y < D - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        const c = hm[i];
        const n = [hm[i - 1], hm[i + 1], hm[i - W], hm[i + W]];
        if (n.filter((v) => v > c).length >= 3) hm[i] = Math.min(...n.filter((v) => v > c));
        else if (n.filter((v) => v < c).length >= 3) hm[i] = Math.max(...n.filter((v) => v < c));
      }
};
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
const topBlock = (w: World, x: number, y: number) => w.get(x, y, w.surface(x, y) - 1);

// =====================================================================================================================
// Desert canyon with a sandstone temple

const STRATA = [B.terracotta, B.orange_terracotta, B.red_terracotta, B.yellow_terracotta, B.brown_terracotta, B.white_terracotta, B.orange_terracotta, B.red_terracotta];

export const genDesert = (seed: number): World => {
  const W = 84;
  const D = 84;
  const w = new World(W, D, 30, seed);
  const cx = 42;
  const cy = 44;
  const tx = cx + 4;
  const ty = cy - 3;
  const ox = cx - 8;
  const oy = cy + 8;
  const hm = heightMap(W, D, (x, y) => {
    const n = fbm(x * 0.05, y * 0.05, seed, 4);
    const n2 = fbm(x * 0.09 + 13, y * 0.09, seed + 2, 3);
    let h = 3 + n * 3;
    // backdrop mesas: up-right (small y) and up-left (small x), stepped in 3-block terraces
    const back = smoothstep(cy - 9, cy - 21, y) * (5 + 8 * n2);
    const left = smoothstep(cx - 12, cx - 26, x) * (5 + 8 * n2);
    const wall = Math.max(back, left);
    h += Math.floor(wall / 3) * 3 + (wall > 0.5 ? 1 : 0);
    // flat basin around the temple
    const d = Math.hypot(x - tx, y - ty);
    h = lerp(h, 4, smoothstep(14, 7, d) * 0.9);
    // scattered mesa stumps in the basin for silhouette
    const m = fbm(x * 0.12 + 40, y * 0.12, seed + 7, 2);
    if (m > 0.66 && d > 12) h += 3;
    const rd = Math.hypot(x - cx, y - cy);
    h += smoothstep(30, 40, rd) * 8;
    return h;
  });
  tidy(hm, W, D, 3);
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const od = Math.hypot(x - ox, (y - oy) * 1.1);
      if (od < 3.6) hm[y * W + x] = 3;
    }
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const top = hm[y * W + x];
      const od = Math.hypot(x - ox, (y - oy) * 1.1);
      const grassy = od < 8 && top <= 4 && fbm(x * 0.3, y * 0.3, seed) > 0.3;
      const isMesa = top >= 7;
      const topId = od < 3.6 ? B.sand : grassy ? B.grass : isMesa ? (h2(x, y, seed) < 0.22 ? B.red_sand : B.mesa_sand) : h2(x, y, seed + 1) < 0.06 ? B.red_sand : B.sand;
      for (let z = 0; z < top; z++) {
        const dz = top - 1 - z;
        let id: number;
        if (dz === 0) id = topId;
        else if (top > 5) id = dz < 2 && !isMesa ? B.sandstone : STRATA[(z + (h2(x >> 2, y >> 2, seed) < 0.15 ? 1 : 0)) % STRATA.length];
        else id = dz < 3 ? B.sandstone : B.red_sandstone;
        w.set(x, y, z, id);
      }
      if (od < 3.6) for (let z = top; z < 4; z++) w.set(x, y, z, B.water);
    }
  // ---- temple (7x7 walls on a 2-step plinth)
  const base = 4;
  for (let y = -7; y <= 7; y++)
    for (let x = -7; x <= 7; x++) {
      const gx = tx + x;
      const gy = ty + y;
      for (let z = base; z < 30; z++) w.set(gx, gy, z, 0);
      for (let z = 0; z < base; z++) if (w.get(gx, gy, z) === 0) w.set(gx, gy, z, B.sandstone);
      if (Math.abs(x) <= 6 && Math.abs(y) <= 6) w.set(gx, gy, base - 1, B.cut_sandstone);
    }
  const sq = (r: number, z: number, id: number) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) w.set(tx + x, ty + y, z, id);
  };
  sq(5, base, B.cut_sandstone);
  sq(4, base + 1, B.cut_sandstone);
  for (let y = -3; y <= 3; y++)
    for (let x = -3; x <= 3; x++) {
      const e = Math.max(Math.abs(x), Math.abs(y));
      const gx = tx + x;
      const gy = ty + y;
      w.set(gx, gy, base + 1, e === 3 ? B.cut_sandstone : (x + y) % 2 === 0 ? B.chiseled_sandstone : B.sandstone);
      if (e === 3) {
        const door = y === 3 && Math.abs(x) <= 0;
        const hgt = door ? 0 : 3 + (h2(gx, gy, seed + 5) < 0.3 ? -1 : 0);
        for (let k = 0; k < hgt; k++) w.set(gx, gy, base + 2 + k, k === 1 ? B.chiseled_sandstone : B.cut_sandstone);
      }
    }
  w.set(tx, ty, base + 2, B.chest_gold);
  for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    for (let k = 0; k < 6; k++) w.set(tx + dx, ty + dy, base + 2 + k, k >= 4 ? B.chiseled_sandstone : B.cut_sandstone);
  }
  // ---- gray stone ruins (cacti.png style) on the left
  const rx = cx - 14;
  const ry = cy - 4;
  for (let y = -3; y <= 3; y++)
    for (let x = -4; x <= 4; x++) {
      const gx = rx + x;
      const gy = ry + y;
      const t = w.surface(gx, gy);
      if (Math.max(Math.abs(x) / 1.3, Math.abs(y)) > 3) continue;
      if (Math.abs(x) >= 3 || Math.abs(y) === 3) {
        const hh = 1 + Math.floor(h2(gx, gy, seed + 6) * 3);
        for (let k = 0; k < hh; k++) w.set(gx, gy, t + k, h2(gx, gy, seed + k) < 0.3 ? B.mossy_bricks : h2(gx, gy, seed + 9) < 0.3 ? B.cracked_bricks : B.stone_bricks);
      } else w.set(gx, gy, t - 1, (x + y) % 2 === 0 ? B.stone_bricks : B.cobble);
    }
  // ---- vegetation
  scatter(W, D, 30, 4, seed, (x, y) => topBlock(w, x, y) === B.sand && Math.hypot(x - tx, y - ty) > 9 && w.surface(x, y) <= 5 && w.get(x, y, w.surface(x, y)) === 0, (x, y, i) => cactus(w, x, y, w.surface(x, y), 1 + (i % 3)));
  scatter(W, D, 26, 3, seed + 3, (x, y) => (topBlock(w, x, y) === B.sand || topBlock(w, x, y) === B.mesa_sand) && w.get(x, y, w.surface(x, y)) === 0 && Math.hypot(x - tx, y - ty) > 7, (x, y) => w.set(x, y, w.surface(x, y), B.dead_bush));
  scatter(W, D, 6, 7, seed + 8, (x, y) => topBlock(w, x, y) === B.sand && w.get(x, y, w.surface(x, y)) === 0, (x, y, i) => boulder(w, x, y, w.surface(x, y), 1, i % 2 ? B.red_sandstone : B.sandstone, i));
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const t = w.surface(x, y);
      if (w.get(x, y, t) !== 0) continue;
      const u = w.get(x, y, t - 1);
      const r = h3(x, y, 9, seed + 31);
      if (u === B.grass && r < 0.55) w.set(x, y, t, r < 0.08 ? B.tuft_tall : r < 0.3 ? B.tuft : B.dry_grass);
      else if (u === B.grass && r > 0.97) w.set(x, y, t, B.dandelion);
      else if ((u === B.sand || u === B.mesa_sand) && r < 0.08) w.set(x, y, t, r < 0.025 ? B.tall_dry : B.dry_grass);
    }
  // sugar cane at the oasis edge
  for (let a = 0; a < 14; a++) {
    const x = Math.round(ox + Math.cos(a * 0.9) * 4.4);
    const y = Math.round(oy + Math.sin(a * 0.9) * 4.1);
    if (w.get(x, y, w.surface(x, y)) === 0 && w.get(x, y, w.surface(x, y) - 1) !== B.water) w.set(x, y, w.surface(x, y), B.sugar_cane);
  }
  return w;
};

// =====================================================================================================================
// Nether: lava lake, crimson ground, fortress bridge, portal

export const genNether = (seed: number): World => {
  const W = 84;
  const D = 84;
  const w = new World(W, D, 34, seed);
  const cx = 42;
  const cy = 44;
  const lavaLevel = 4;
  const lx = cx - 8;
  const ly = cy + 6;
  const px = cx + 8;
  const py = cy - 10;
  const pTop = 11;
  const hm = heightMap(W, D, (x, y) => {
    const n = fbm(x * 0.06, y * 0.06, seed, 4);
    const r = fbm(x * 0.14 + 11, y * 0.14, seed + 5, 3);
    let h = 6 + n * 8 + r * 3;
    const d = Math.hypot(x - cx, y - cy);
    // big lava lake, screen-left of centre
    const ld = Math.hypot((x - lx) * 0.8, y - ly);
    h = lerp(h, 2, smoothstep(12, 7, ld));
    // raised portal plateau up-right
    const pd = Math.hypot(x - px, (y - py) * 1.1);
    h = lerp(h, pTop, smoothstep(9.5, 5.5, pd));
    // rim walls so the horizon is tall netherrack
    h += smoothstep(24, 38, d) * 13;
    return h;
  });
  tidy(hm, W, D, 3);
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const top = hm[y * W + x];
      const n = fbm(x * 0.13, y * 0.13, seed + 4, 3);
      const soul = n > 0.63 && top <= 7;
      const topId = top < lavaLevel + 1 ? B.netherrack : soul ? B.soul_sand : n < 0.5 ? B.crimson_nylium : n > 0.57 ? B.netherrack : B.crimson_nylium;
      for (let z = 0; z < top; z++) {
        const dz = top - 1 - z;
        let id = dz === 0 ? topId : B.netherrack;
        if (dz > 0 && h3(x, y, z, seed + 6) < 0.05) id = B.magma;
        if (dz > 1 && h3(x, y, z, seed + 7) < 0.03) id = B.shroomlight;
        if (dz > 2 && h3(x, y, z, seed + 8) < 0.14) id = B.blackstone;
        w.set(x, y, z, id);
      }
      if (top < lavaLevel) for (let z = top; z < lavaLevel; z++) w.set(x, y, z, B.lava);
    }
  // lava falls pouring off the high rim into the lake
  const falls: [number, number][] = [[lx - 10, ly - 9], [lx + 3, ly - 12], [lx - 12, ly + 1]];
  for (const [fx, fy] of falls) {
    const top = w.surface(fx, fy);
    for (let z = lavaLevel; z < top; z++) w.set(fx, fy, z, B.lava);
    w.set(fx, fy, top - 1, B.lava);
  }
  // ---- portal plateau
  for (let y = -6; y <= 6; y++)
    for (let x = -7; x <= 7; x++) {
      const gx = px + x;
      const gy = py + y;
      for (let z = pTop; z < 34; z++) w.set(gx, gy, z, 0);
      if (Math.hypot(x, y * 1.1) < 7) {
        for (let z = 0; z < pTop; z++) if (w.get(gx, gy, z) === 0) w.set(gx, gy, z, B.netherrack);
        w.set(gx, gy, pTop - 1, (x + y) % 2 === 0 ? B.blackstone_bricks : B.polished_bs);
      }
    }
  portal(w, px - 1, py - 1, pTop, 'x', B.obsidian);
  for (const [dx, dy] of [[-3, -1], [4, -1], [-3, 3], [4, 3]]) {
    for (let k = 0; k < (dy > 0 ? 3 : 6); k++) w.set(px + dx, py + dy, pTop + k, k === (dy > 0 ? 2 : 5) ? B.chiseled_dark : B.blackstone_bricks);
    w.set(px + dx, py + dy, pTop + (dy > 0 ? 3 : 6), B.soul_torch);
  }
  for (let i = 0; i < 4; i++) for (let x = -1; x <= 2; x++) w.set(px + x, py + 5 + i, pTop - 1 - i, B.blackstone_bricks);
  // ---- fortress bridge over the lava (along +x, down-right)
  const by = ly - 9;
  for (let x = lx - 11; x <= lx + 10; x++) {
    for (let k = -1; k <= 1; k++) {
      w.set(x, by + k, lavaLevel + 1, (x + k) % 3 === 0 ? B.red_nether_bricks : B.nether_bricks);
      w.set(x, by + k, lavaLevel, B.nether_bricks);
    }
    if (x % 2 === 0) {
      w.set(x, by - 1, lavaLevel + 2, B.nether_bricks);
      w.set(x, by + 1, lavaLevel + 2, B.nether_bricks);
    }
  }
  for (const x of [lx - 11, lx + 10]) {
    for (let k = 0; k < 6; k++) for (const yy of [by - 1, by + 1]) w.set(x, yy, lavaLevel + 2 + k, k === 5 ? B.red_nether_bricks : B.nether_bricks);
    w.set(x, by - 1, lavaLevel + 8, B.torch);
  }
  for (let x = lx - 8; x <= lx + 8; x += 4) for (let z = 0; z < lavaLevel; z++) w.set(x, by, z, B.nether_bricks);
  // ---- basalt columns along the far shore and scattered around
  scatter(
    W,
    D,
    20,
    4.5,
    seed,
    (x, y) => {
      const t = w.surface(x, y);
      return t > 5 && w.get(x, y, t - 1) !== B.lava && Math.hypot(x - px, y - py) > 9 && Math.hypot(x - lx, y - ly) > 7;
    },
    (x, y, i) => {
      const t = w.surface(x, y);
      const hh = 3 + Math.floor(h3(x, y, i, seed) * 7);
      for (let k = 0; k < hh; k++) w.set(x, y, t + k, k > hh - 2 && i % 3 === 0 ? B.blackstone : B.basalt);
    },
  );
  // ---- huge crimson fungi
  scatter(
    W,
    D,
    10,
    6.5,
    seed + 3,
    (x, y) => {
      const t = w.surface(x, y);
      const u = w.get(x, y, t - 1);
      return t > 5 && (u === B.crimson_nylium || u === B.netherrack) && Math.hypot(x - px, y - py) > 9 && Math.hypot(x - lx, y - ly) > 11;
    },
    (x, y, i) => {
      const t = w.surface(x, y);
      tree(w, x, y, t, {trunk: 4 + (i % 3), r: 2, seed: i, leaf: B.wart_block, log: B.crimson_stem});
      w.set(x, y, t + 4 + (i % 3), B.shroomlight);
      for (const [dx, dy] of [[1, 0], [-1, 1], [0, -1]]) if (h3(x + dx, y + dy, i, seed) < 0.7) w.set(x + dx, y + dy, t + 3 + (i % 3), B.shroomlight);
    },
  );
  scatter(W, D, 8, 5, seed + 2, (x, y) => w.surface(x, y) > 5, (x, y, i) => boulder(w, x, y, w.surface(x, y), 1, i % 2 ? B.blackstone : B.netherrack, i));
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const t = w.surface(x, y);
      if (w.get(x, y, t) !== 0) continue;
      const u = w.get(x, y, t - 1);
      const r = h3(x, y, 5, seed + 41);
      if (u === B.crimson_nylium && r < 0.42) w.set(x, y, t, r < 0.03 ? B.warped_roots : r < 0.3 ? B.crimson_roots : B.nether_sprouts);
      else if (u === B.netherrack && r < 0.06) w.set(x, y, t, B.crimson_roots);
    }
  return w;
};

// =====================================================================================================================
// End: floating islands in a purple void

export const genEnd = (seed: number): World => {
  const W = 84;
  const D = 84;
  const w = new World(W, D, 32, seed);
  const cx = 42;
  const cy = 44;
  const island = (ix: number, iy: number, rx: number, ry: number, top: number, thick: number, floor: number, rim: number, salt = 0) => {
    for (let y = 0; y < D; y++)
      for (let x = 0; x < W; x++) {
        const nn = (fbm(x * 0.22, y * 0.22, seed + ix + salt, 3) - 0.5) * 3.2;
        const d = Math.hypot((x - ix) / rx, (y - iy) / ry) * 10 + nn;
        if (d > 10) continue;
        const depth = Math.max(1, Math.round(thick * (1 - d / 10) + 1));
        for (let k = 0; k < depth; k++) {
          const z = top - 1 - k;
          const id = k === 0 ? (d > 8.4 ? rim : floor) : B.end_stone;
          if (z >= 0) w.set(x, y, z, id);
        }
      }
  };
  const TOP = 9;
  // main platform
  island(cx + 1, cy + 2, 9, 8, TOP, 6, B.mossy_bricks, B.deepslate_tiles);
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      if (w.get(x, y, TOP - 1) === B.mossy_bricks) w.set(x, y, TOP - 1, h3(x, y, 1, seed) < 0.24 ? B.cracked_bricks : h3(x, y, 2, seed) < 0.3 ? B.stone_bricks : B.mossy_bricks);
      if (w.get(x, y, TOP - 1) === B.deepslate_tiles && h2(x, y, seed) < 0.55) w.set(x, y, TOP, B.deepslate_tiles);
    }
  // left: a big stepped wall of dark bricks
  const wallBlock = (x: number, y: number, z: number) => (h3(x, y, z, seed + 5) < 0.28 ? B.mossy_bricks : h3(x, y, z, seed + 6) < 0.18 ? B.cracked_bricks : B.deepslate_bricks);
  for (let y = cy - 9; y <= cy + 2; y++)
    for (let x = cx - 14; x <= cx - 6; x++) {
      const stepX = (x - (cx - 14)) / 8; // 0 at far left .. 1 at the platform
      const hgt = Math.round(5 + 11 * (1 - stepX) * (0.75 + 0.5 * fbm(x * 0.3, y * 0.3, seed, 2)) - Math.max(0, y - (cy - 3)) * 0.6);
      for (let k = 0; k < hgt; k++) w.set(x, y, TOP - 4 + k, wallBlock(x, y, k));
      const under = 2 + Math.floor(hgt / 3) - Math.floor(Math.abs(y - (cy - 3)) / 3);
      for (let k = 1; k <= under; k++) if (h2(x, y + k, seed + 9) < 0.92 - k * 0.1) w.set(x, y, TOP - 4 - k, B.end_stone);
    }
  // right: a tall tower with a glowing doorway
  const tx = cx + 11;
  const ty = cy - 8;
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++) {
      for (let k = 0; k < 15; k++) {
        const edge = x === 0 || x === 4 || y === 0 || y === 4;
        if (!edge && k > 0) continue;
        w.set(tx + x, ty + y, TOP - 2 + k, k >= 13 ? B.deepslate_tiles : wallBlock(tx + x, ty + y, k));
      }
    }
  for (let k = 1; k < 4; k++) w.set(tx + 2, ty + 4, TOP - 2 + k, B.pink_cube);
  for (let y = -1; y <= 6; y++) for (let x = -1; x <= 6; x++) if (w.get(tx + x, ty + y, TOP - 3) === 0) w.set(tx + x, ty + y, TOP - 3, B.deepslate_tiles);
  // ruined low walls on the platform
  const wall = (x0: number, y0: number, x1: number, y1: number, hgt: number) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const hh = Math.max(1, hgt - Math.floor(h2(x, y, seed + 3) * 3));
        for (let k = 0; k < hh; k++) w.set(x, y, TOP + k, wallBlock(x, y, k));
      }
  };
  wall(cx + 3, cy - 5, cx + 7, cy - 5, 3);
  wall(cx - 5, cy - 4, cx - 5, cy, 2);
  // pillars with end rods
  for (const [dx, dy] of [[-3, 4], [6, 3]]) {
    for (let k = 0; k < 3; k++) w.set(cx + dx, cy + dy, TOP + k, B.purpur_pillar);
    w.set(cx + dx, cy + dy, TOP + 3, B.end_rod);
  }
  // glowing cube on a pillar at the front
  for (let k = 0; k < 3; k++) w.set(cx - 3, cy + 9, TOP - 1 + k, B.deepslate_tiles);
  for (let z = 0; z < 2; z++) for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) w.set(cx - 4 + x, cy + 9 + y, TOP + 2 + z, B.pink_cube);
  // satellite islands
  island(cx + 20, cy + 6, 5, 4.5, 8, 4, B.end_bricks, B.purpur, 1);
  island(cx - 12, cy + 17, 6, 5, 6, 5, B.end_stone, B.purpur, 2);
  island(cx + 12, cy + 19, 4.5, 4, 5, 4, B.end_stone, B.deepslate_tiles, 3);
  island(cx - 22, cy - 6, 5, 4.5, 11, 5, B.deepslate_bricks, B.deepslate_tiles, 4);
  island(cx + 2, cy - 22, 6, 5, 12, 5, B.end_bricks, B.purpur, 5);
  // floating fragments
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(h3(i, 1, seed, 900) * (W - 6)) + 3;
    const y = Math.floor(h3(i, 2, seed, 901) * (D - 6)) + 3;
    const z = 3 + Math.floor(h3(i, 3, seed, 902) * 16);
    if (w.get(x, y, z) !== 0 || Math.hypot(x - cx, y - cy) < 12) continue;
    const id = i % 3 === 0 ? B.purpur : i % 3 === 1 ? B.end_stone : B.deepslate_tiles;
    w.set(x, y, z, id);
    if (i % 2) w.set(x + 1, y, z, id);
    if (i % 4 === 0) w.set(x, y + 1, z, id);
  }
  // chorus + purpur pillar on satellite islands
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const t = w.surface(x, y);
      if (t <= 0 || w.get(x, y, t) !== 0) continue;
      const u = w.get(x, y, t - 1);
      if ((u === B.end_stone || u === B.end_bricks) && h3(x, y, 1, seed + 51) < 0.07) w.set(x, y, t, B.chorus);
    }
  for (let k = 0; k < 5; k++) w.set(cx - 12, cy + 16, 6 + k, B.purpur_pillar);
  w.set(cx - 12, cy + 16, 11, B.purpur);
  return w;
};

// =====================================================================================================================
// Snow village at twilight

export const genSnow = (seed: number): World => {
  const W = 84;
  const D = 84;
  const w = new World(W, D, 28, seed);
  const cx = 42;
  const cy = 44;
  const lakeX = cx + 8;
  const lakeY = cy + 8;
  const hm = heightMap(W, D, (x, y) => {
    const n = fbm(x * 0.05, y * 0.05, seed, 4);
    const r = fbm(x * 0.12 + 8, y * 0.12, seed + 3, 3);
    let h = 4 + n * 8 + r * 2;
    const d = Math.hypot(x - cx, y - cy);
    h = lerp(h, 6, smoothstep(22, 7, d) * 0.7);
    const ld = Math.hypot(x - lakeX, (y - lakeY) * 1.15);
    h = lerp(h, 3, smoothstep(9, 5.5, ld));
    // snow peak backdrop at the far (up) side
    const bd = Math.hypot(x - (cx - 6), y - (cy - 22));
    h += smoothstep(16, 3, bd) * 9;
    h += smoothstep(30, 42, d) * 5;
    return h;
  });
  tidy(hm, W, D, 3);
  const lakeLevel = 3;
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const top = hm[y * W + x];
      const rocky = top > 11 && h2(x, y, seed) < 0.5;
      const topId = top <= lakeLevel ? B.ice : rocky ? B.stone : B.snow;
      for (let z = 0; z < top; z++) {
        const dz = top - 1 - z;
        let id: number;
        if (dz === 0) id = topId;
        else if (dz < 2 && top > lakeLevel) id = B.snow_grass;
        else if (dz < 3) id = B.dirt;
        else id = h3(x, y, z, seed) < 0.2 ? B.andesite : B.stone;
        if (top <= lakeLevel && dz > 0) id = B.packed_ice;
        w.set(x, y, z, id);
      }
    }
  // ---- village: flatten a terrace first so the cabin, path and fences sit level
  const hx0 = cx - 6;
  const hy0 = cy - 2;
  for (let y = hy0 - 7; y <= hy0 + 12; y++)
    for (let x = hx0 - 10; x <= lakeX - 3; x++) {
      const edge = Math.min(x - (hx0 - 10), lakeX - 3 - x, y - (hy0 - 7), hy0 + 12 - y);
      const target = 6;
      const t = w.surface(x, y);
      if (edge < 2 && Math.abs(t - target) > 3) continue;
      for (let z = target; z < 28; z++) w.set(x, y, z, 0);
      for (let z = 0; z < target; z++) w.set(x, y, z, z === target - 1 ? B.snow : z > target - 4 ? B.snow_grass : B.stone);
    }
  // ---- village: cabin + lamp posts + fence
  const hx = cx - 6;
  const hy = cy - 2;
  const hz = 6;
  for (let y = -3; y <= 3; y++)
    for (let x = -4; x <= 4; x++) {
      for (let z = hz; z < 28; z++) w.set(hx + x, hy + y, z, 0);
      for (let z = 0; z < hz; z++) if (w.get(hx + x, hy + y, z) === 0) w.set(hx + x, hy + y, z, B.dirt);
      w.set(hx + x, hy + y, hz - 1, B.spruce_planks);
    }
  for (let y = -3; y <= 3; y++)
    for (let x = -4; x <= 4; x++) {
      const e = x === -4 || x === 4 || y === -3 || y === 3;
      if (!e) continue;
      const door = y === 3 && x === 0;
      for (let k = 0; k < 3; k++) {
        if (door && k < 2) continue;
        const corner = Math.abs(x) === 4 && Math.abs(y) === 3;
        w.set(hx + x, hy + y, hz + k, corner ? B.dark_oak_log : k === 1 && (x + y) % 3 === 0 ? B.redstone_lamp : B.spruce_planks);
      }
    }
  // stepped roof (dark planks) running along x, dusted with thin snow layers
  for (let layer = 0; layer < 3; layer++)
    for (let y = -3 + layer; y <= 3 - layer; y++) for (let x = -5; x <= 5; x++) w.set(hx + x, hy + y, hz + 3 + layer, B.dark_planks);
  for (let layer = 0; layer < 3; layer++)
    for (let y = -3 + layer; y <= 3 - layer; y++)
      for (let x = -5; x <= 5; x++) {
        if (w.get(hx + x, hy + y, hz + 4 + layer) === 0 && (layer === 2 || Math.abs(y) === 3 - layer)) w.set(hx + x, hy + y, hz + 4 + layer, B.snow_layer);
      }
  w.set(hx + 4, hy - 4, hz, B.lantern);
  w.set(hx - 2, hy + 4, hz, B.lantern);
  // flush plank path with fence rails and lanterns, from the cabin towards the frozen lake
  const bwY = hy + 6;
  for (let x = hx - 3; x <= lakeX + 4; x++) {
    for (let yy = bwY - 1; yy <= bwY + 1; yy++) {
      const t = w.surface(x, yy);
      if (w.get(x, yy, t - 1) === B.ice) continue;
      w.set(x, yy, t - 1, (x + yy) % 4 === 0 ? B.dark_planks : B.spruce_planks);
    }
    for (const yy of [bwY - 2, bwY + 2]) {
      const t = w.surface(x, yy);
      if (w.get(x, yy, t) === 0 && w.get(x, yy, t - 1) !== B.ice && (x % 7 !== 3)) {
        w.set(x, yy, t, B.fence_x);
        if (x % 6 === 0) w.set(x, yy, t + 1, B.lantern);
      }
    }
  }
  w.set(hx + 3, hy + 4, w.surface(hx + 3, hy + 4), B.campfire);
  // hay bales and crates by the cabin
  for (const [dx, dy] of [[-6, 3], [-6, 4], [-7, 3]]) w.set(hx + dx, hy + dy, w.surface(hx + dx, hy + dy), B.hay);
  // trees: snowy spruce
  scatter(W, D, 60, 3.4, seed, (x, y) => {
    const t = w.surface(x, y);
    const u = w.get(x, y, t - 1);
    return t > lakeLevel + 1 && u !== B.ice && u !== B.packed_ice && Math.hypot(x - hx, y - hy) > 9 && Math.hypot(x - cx, y - cy) > 9 + h2(x, y, seed) * 5 && Math.abs(y - bwY) > 4 && w.get(x, y, t) === 0;
  }, (x, y, i) => spruce(w, x, y, w.surface(x, y), {h: 5 + Math.floor(h3(x, y, i, seed) * 5), leaf: B.snow_spruce, seed: i}));
  scatter(W, D, 12, 5, seed + 4, (x, y) => w.surface(x, y) > 5 && w.get(x, y, w.surface(x, y)) === 0, (x, y, i) => {
    boulder(w, x, y, w.surface(x, y), 1, i % 2 ? B.andesite : B.stone, i);
    w.set(x, y, w.surface(x, y), B.snow_layer);
  });
  return w;
};

// =====================================================================================================================
// Night camp with a nether portal

export const genCamp = (seed: number): World => {
  const W = 84;
  const D = 84;
  const w = new World(W, D, 28, seed);
  const cx = 42;
  const cy = 44;
  const hm = heightMap(W, D, (x, y) => {
    const n = fbm(x * 0.05, y * 0.05, seed, 4);
    let h = 5 + n * 6;
    const d = Math.hypot(x - cx, y - cy);
    h = lerp(h, 6, smoothstep(20, 9, d) * 0.9);
    // raised stone dais for the portal (up)
    const pd = Math.hypot((x - cx) * 0.9, y - (cy - 11));
    h = lerp(h, 9, smoothstep(7.5, 4, pd));
    h += smoothstep(28, 40, d) * 6;
    return h;
  });
  tidy(hm, W, D, 3);
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const top = hm[y * W + x];
      const d = Math.hypot(x - cx, y - cy);
      const plaza = d < 9;
      const topId = plaza ? (h2(x, y, seed) < 0.3 ? B.cobble : B.stone_bricks) : d < 12 && h2(x, y, seed + 1) < 0.5 ? B.path : B.grass;
      w.column(x, y, top, topId === B.stone_bricks && top > 7 ? B.stone_bricks : topId, B.dirt, 3, B.stone);
    }
  // flatten plaza to a single level so props sit nicely
  const pz = 6;
  for (let y = cy - 9; y <= cy + 9; y++)
    for (let x = cx - 9; x <= cx + 9; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= 9) continue;
      for (let z = pz; z < 28; z++) w.set(x, y, z, 0);
      for (let z = 0; z < pz; z++) if (w.get(x, y, z) === 0) w.set(x, y, z, B.stone);
      w.set(x, y, pz - 1, h2(x, y, seed) < 0.28 ? B.cobble : h2(x, y, seed + 2) < 0.2 ? B.mossy_bricks : B.stone_bricks);
    }
  // dais + portal
  const ptx = cx - 2;
  const pty = cy - 11;
  for (let y = -3; y <= 3; y++)
    for (let x = -4; x <= 5; x++) {
      for (let z = 0; z < 8; z++) if (w.get(ptx + x, pty + y, z) === 0) w.set(ptx + x, pty + y, z, B.stone);
      for (let z = 8; z < 28; z++) w.set(ptx + x, pty + y, z, 0);
      w.set(ptx + x, pty + y, 7, (x + y) % 2 === 0 ? B.blackstone_bricks : B.polished_bs);
    }
  portal(w, ptx, pty, 8, 'x', B.obsidian);
  for (const [dx, dy] of [[-2, 0], [5, 0]]) {
    for (let k = 0; k < 4; k++) w.set(ptx + dx, pty + dy, 8 + k, k === 3 ? B.chiseled_dark : B.blackstone_bricks);
    w.set(ptx + dx, pty + dy, 12, B.soul_torch);
  }
  // steps down
  for (let i = 0; i < 2; i++) for (let x = -1; x <= 4; x++) w.set(ptx + x, pty + 4 + i, 7 - i, B.stone_bricks);
  // campfire + logs (benches) + tents
  w.set(cx, cy + 2, pz, B.campfire);
  for (const [dx, dy, id] of [[-2, 2, B.slab_planks], [2, 2, B.slab_planks], [0, 4, B.slab_planks], [0, 0, B.slab_planks]] as [number, number, number][]) w.set(cx + dx, cy + dy, pz, id);
  const tent = (tx: number, ty: number, a: number, b: number) => {
    for (let layer = 0; layer < 3; layer++)
      for (let y = -2 + layer; y <= 2 - layer; y++)
        for (let x = -3; x <= 3; x++) {
          const edge = y === -2 + layer || y === 2 - layer;
          if (!edge && layer < 2) continue;
          w.set(tx + x, ty + y, pz + layer, (x + layer) % 2 === 0 ? a : b);
        }
  };
  tent(cx - 12, cy + 5, B.red_wool, B.white_wool);
  tent(cx + 11, cy + 8, B.light_blue_wool, B.white_wool);
  w.set(cx - 5, cy + 7, pz, B.chest_gold);
  // stone brick wall arc behind
  for (let a = -2.6; a < -0.55; a += 0.05) {
    const x = Math.round(cx + Math.cos(a) * 15);
    const y = Math.round(cy + Math.sin(a) * 13);
    const hh = 2 + Math.floor(h2(x, y, seed + 9) * 2);
    for (let k = 0; k < hh; k++) w.set(x, y, Math.max(w.surface(x, y), pz) + k, k === hh - 1 && h2(x, y, seed) < 0.3 ? B.mossy_bricks : B.stone_bricks);
  }
  // lanterns on posts around the plaza
  for (const [dx, dy] of [[-7, -2], [7, -3], [-6, 6], [6, 5]]) {
    const x = cx + dx;
    const y = cy + dy;
    w.set(x, y, pz, B.post_dark);
    w.set(x, y, pz + 1, B.post_dark);
    w.set(x, y, pz + 2, B.lantern);
  }
  // trees
  scatter(W, D, 54, 3.3, seed, (x, y) => {
    const t = w.surface(x, y);
    return Math.hypot(x - cx, y - cy) > 15 && w.get(x, y, t - 1) === B.grass && w.get(x, y, t) === 0;
  }, (x, y, i) => {
    const big = h2(x, y, seed + 22);
    tree(w, x, y, w.surface(x, y), {trunk: 4 + Math.floor(big * 3), r: big > 0.7 ? 3 : 2, seed: i, leaf: i % 4 === 0 ? B.maple_leaves : B.oak_leaves, log: B.dark_oak_log});
  });
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const t = w.surface(x, y);
      if (w.get(x, y, t) !== 0) continue;
      const u = w.get(x, y, t - 1);
      const r = h3(x, y, 7, seed + 31);
      if (u === B.grass && r < 0.06 + 0.4 * smoothstep(0.5, 0.7, fbm(x * 0.2, y * 0.2, seed + 6, 2))) w.set(x, y, t, r < 0.04 ? B.tuft_tall : B.tuft);
      else if (u === B.grass && r > 0.97) w.set(x, y, t, [B.poppy, B.cornflower, B.allium, B.oxeye][Math.floor(h2(x, y, seed) * 4)]);
    }
  return w;
};
