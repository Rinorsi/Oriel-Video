// World-map sandbox: floating voxel islands with cutaway undersides, waterfalls, lava, red mushrooms and block clouds.
import {B} from './blocks';
import {World} from './world';
import {fbm, h2, h3, lerp, smoothstep} from './rng';

type Zone = 'forest' | 'mountain' | 'mesa' | 'desert' | 'snowlava' | 'autumn';

export const genWorldMap = (seed: number): World => {
  const W = 176;
  const D = 176;
  const H = 54;
  const w = new World(W, D, H, seed);
  const c = 88;
  const SEA = 20;
  const zoneAt = (a: number, b: number): Zone => {
    if (a > 28 && b < -8) return 'snowlava';
    if (a > 4 && b > -14) return 'desert';
    if (a > -26 && a <= 4 && b < 4) return 'mesa';
    if (a <= -26 && a > -70 && b < -2) return 'mountain';
    if (b > 26 && a > -34 && a < 22) return 'autumn';
    return 'forest';
  };
  // landmass mask in "screen" coordinates a = x-y (horizontal), b = x+y-2c (vertical)
  const mask = (x: number, y: number) => {
    const a = x - y;
    const b = x + y - 2 * c;
    const e = Math.sqrt((a / 112) ** 2 + (b / 74) ** 2);
    const n = fbm(x * 0.07, y * 0.07, seed, 4) - 0.5;
    return 1 - e + n * 0.55;
  };
  const tops = new Int16Array(W * D);
  const bots = new Int16Array(W * D);
  const zoneMap: Zone[] = new Array(W * D);
  const islets: {x: number; y: number; r: number; top: number}[] = [];
  for (let i = 0; i < 12; i++) {
    const ang = h3(i, 1, seed, 700) * Math.PI * 2;
    const rad = 66 + h3(i, 2, seed, 701) * 20;
    islets.push({x: c + Math.cos(ang) * rad * 0.9, y: c + Math.sin(ang) * rad * 0.9, r: 5 + h3(i, 3, seed, 702) * 7, top: 20 + Math.floor(h3(i, 4, seed, 703) * 9)});
  }
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const a0 = x - y;
      const b0 = x + y - 2 * c;
      // domain-warp the zone boundaries so biomes interlock instead of meeting along straight lines
      const a = a0 + (fbm(x * 0.035, y * 0.035, seed + 90, 3) - 0.5) * 52;
      const b = b0 + (fbm(x * 0.035 + 40, y * 0.035, seed + 91, 3) - 0.5) * 52;
      let m = mask(x, y);
      let top = 0;
      let zone = zoneAt(a, b);
      let isl = -1;
      for (let k = 0; k < islets.length; k++) {
        const it = islets[k];
        const d = Math.hypot(x - it.x, y - it.y) / it.r + (fbm(x * 0.2, y * 0.2, seed + k, 2) - 0.5) * 0.6;
        const mi = 1 - d;
        if (mi > m) {
          m = mi * 0.55;
          isl = k;
        }
      }
      if (m <= 0) continue;
      if (isl >= 0) zone = islets[isl].top > 25 ? 'forest' : 'mountain';
      const n = fbm(x * 0.09, y * 0.09, seed + 1, 4);
      const n2 = fbm(x * 0.18 + 5, y * 0.18, seed + 2, 3);
      switch (zone) {
        case 'forest':
          top = SEA + 3 + Math.floor(n * 5);
          break;
        case 'autumn':
          top = SEA + 2 + Math.floor(n * 4);
          break;
        case 'desert':
          top = SEA + 2 + Math.floor(n * 3);
          break;
        case 'mesa': {
          const t = Math.floor(smoothstep(0.35, 0.75, n) * 3);
          top = SEA + 8 + t * 4 + Math.floor(n2 * 2);
          break;
        }
        case 'mountain': {
          const spire = smoothstep(0.4, 0.78, fbm(x * 0.11 + 3, y * 0.11, seed + 13, 3));
          top = SEA + 5 + Math.floor(spire * 30 * smoothstep(0.05, 0.4, m) + n2 * 4);
          break;
        }
        case 'snowlava':
          top = SEA + 9 + Math.floor(smoothstep(0.35, 0.72, n) * 17) + Math.floor(n2 * 4);
          break;
      }
      if (isl >= 0) top = islets[isl].top + Math.floor(n * 3);
      // gentle fall-off at the coast so shores step down
      top -= Math.floor((1 - smoothstep(0, 0.12, m)) * 3);
      top = Math.max(SEA - 6, Math.min(H - 4, top));
      const thick = 5 + Math.floor(20 * Math.pow(smoothstep(0, 0.8, m), 0.9) * (0.65 + 0.7 * n2));
      tops[y * W + x] = top;
      bots[y * W + x] = Math.max(1, top - thick);
      zoneMap[y * W + x] = zone;
    }
  // fill columns
  for (let y = 0; y < D; y++)
    for (let x = 0; x < W; x++) {
      const top = tops[y * W + x];
      if (!top) continue;
      const bot = bots[y * W + x];
      const zone = zoneMap[y * W + x];
      const n = fbm(x * 0.15, y * 0.15, seed + 3, 3);
      for (let z = bot; z < top; z++) {
        const dz = top - 1 - z;
        const dw = z - bot; // distance from underside
        let id: number;
        if (zone === 'mesa') {
          id = dz === 0 ? (n > 0.55 ? B.mesa_sand : B.red_sand) : [B.orange_terracotta, B.terracotta, B.red_terracotta, B.yellow_terracotta, B.brown_terracotta][(z + (x >> 3)) % 5];
          if (dw < 2) id = B.stone;
        } else if (zone === 'desert') {
          id = dz === 0 ? (n > 0.62 ? B.grass : B.sand) : dz < 3 ? B.sandstone : B.stone;
        } else if (zone === 'snowlava') {
          id = dz === 0 ? (n > 0.6 ? B.stone : B.snow) : dz < 2 ? B.snow : h3(x, y, z, seed) < 0.3 ? B.deepslate : B.stone;
        } else if (zone === 'mountain') {
          id = dz === 0 ? (n > 0.42 && z < SEA + 16 ? B.grass : B.stone) : dz < 2 && z < SEA + 14 ? B.dirt : h3(x, y, z, seed + 2) < 0.28 ? B.andesite : B.stone;
        } else {
          id = dz === 0 ? B.grass : dz < 3 ? B.dirt : h3(x, y, z, seed + 5) < 0.2 ? B.andesite : B.stone;
        }
        // underside: darker rock
        if (dw < 3 && zone !== 'mesa') id = h3(x, y, z, seed + 8) < 0.5 ? B.deepslate : B.stone;
        w.set(x, y, z, id);
      }
      // lava seams in the snow volcano
      if (zone === 'snowlava' && fbm(x * 0.22, y * 0.22, seed + 9, 3) > 0.66) {
        w.set(x, y, top - 1, B.lava);
        if (top >= 2) w.set(x, y, top - 2, B.lava);
      }
    }
  // waterfalls on cliff faces
  for (let y = 1; y < D - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const top = tops[y * W + x];
      if (!top || h3(x, y, 1, seed + 11) > 0.09) continue;
      const zone = zoneMap[y * W + x];
      if (zone !== 'mountain' && zone !== 'mesa') continue;
      const nx = tops[y * W + x + 1] || 0;
      const ny = tops[(y + 1) * W + x] || 0;
      const low = Math.min(nx, ny);
      if (top - low < 5) continue;
      const stop = nx < ny ? nx : ny;
      for (let z = Math.max(stop, bots[y * W + x]); z < top; z++) w.set(x, y, z, B.waterfall);
    }
  // vegetation
  for (let y = 1; y < D - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const top = tops[y * W + x];
      if (!top) continue;
      const zone = zoneMap[y * W + x];
      const u = w.get(x, y, top - 1);
      const r = h3(x, y, 3, seed + 21);
      const hasFree = w.get(x, y, top) === 0;
      if (!hasFree) continue;
      if ((zone === 'forest' || zone === 'autumn') && u === B.grass) {
        const dens = (zone === 'forest' ? 0.3 : 0.22) * (0.25 + 1.4 * smoothstep(0.35, 0.65, fbm(x * 0.12 + 9, y * 0.12, seed + 14, 3)));
        if (r < dens) miniTree(w, x, y, top, zone === 'autumn' && r > dens * 0.35 ? B.maple_leaves : B.oak_leaves, 2 + Math.floor(h2(x, y, seed) * 2), seed);
        else if (r > 0.97) w.set(x, y, top, B.map_flower);
      } else if (zone === 'mountain' && u === B.grass && r < 0.2) miniTree(w, x, y, top, B.oak_leaves, 2, seed);
      else if (zone === 'mesa' && u === B.mesa_sand && r < 0.05) w.set(x, y, top, B.map_shroom);
      else if (zone === 'mesa' && u === B.red_sand && r < 0.04) w.set(x, y, top, B.map_shroom);
      else if (zone === 'desert' && u === B.sand && r < 0.03) w.set(x, y, top, B.cactus);
      else if (zone === 'desert' && u === B.grass && r < 0.2) miniTree(w, x, y, top, B.oak_leaves, 2, seed);
    }
  // ruins: a sandstone temple in the desert and a stone keep on the right peaks
  const ruin = (rx: number, ry: number, id: number, hgt: number) => {
    const t = tops[ry * W + rx] || SEA + 4;
    for (let y2 = -3; y2 <= 3; y2++)
      for (let x2 = -4; x2 <= 4; x2++) {
        const e = Math.max(Math.abs(x2), Math.abs(y2 * 1.2));
        for (let z = t - 1; z < t; z++) w.set(rx + x2, ry + y2, z, id);
        if (e > 2.8 && e < 4.2) for (let k = 0; k < hgt - Math.floor(h2(rx + x2, ry + y2, seed) * 3); k++) w.set(rx + x2, ry + y2, t + k, id);
      }
  };
  ruin(c + 40, c + 28, B.cut_sandstone, 4);
  ruin(c + 18, c + 40, B.sandstone, 3);
  // block clouds
  for (let i = 0; i < 64; i++) {
    const cxn = Math.floor(h3(i, 1, seed, 800) * (W - 20)) + 8;
    const cyn = Math.floor(h3(i, 2, seed, 801) * (D - 20)) + 8;
    const mk = mask(cxn, cyn);
    // most clouds float around the island; a few drift low over its rim
    if (mk > 0.0 && !(mk < 0.14 && i % 5 === 0)) continue;
    const z = mk > 0 ? 40 + Math.floor(h3(i, 3, seed, 802) * 8) : 18 + Math.floor(h3(i, 3, seed, 802) * 30);
    const n = 2 + Math.floor(h3(i, 4, seed, 803) * 3);
    for (let k = 0; k < n; k++) {
      const rw = 3 + Math.floor(h3(i, 10 + k, seed, 804) * 7);
      const rd = 2 + Math.floor(h3(i, 20 + k, seed, 805) * 4);
      const ox = cxn + Math.floor((h3(i, 30 + k, seed, 806) - 0.5) * 8);
      const oy = cyn + Math.floor((h3(i, 40 + k, seed, 807) - 0.5) * 6);
      const th = 1 + (h3(i, 50 + k, seed, 808) > 0.55 ? 1 : 0);
      for (let t = 0; t < th; t++) w.fill(ox, oy, z + t, ox + rw, oy + rd, z + t, B.cloud);
    }
  }
  // loose rock chunks drifting off the rim
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(h3(i, 1, seed, 950) * (W - 6)) + 3;
    const y = Math.floor(h3(i, 2, seed, 951) * (D - 6)) + 3;
    const mk = mask(x, y);
    if (mk > -0.02 || mk < -0.3) continue;
    const z = 14 + Math.floor(h3(i, 3, seed, 952) * 18);
    const id = i % 3 === 0 ? B.stone : i % 3 === 1 ? B.dirt : B.andesite;
    w.set(x, y, z, id);
    if (i % 2) w.set(x + 1, y, z, id);
    if (i % 5 === 0) w.set(x, y, z + 1, B.grass);
  }
  void lerp;
  return w;
};

const miniTree = (w: World, x: number, y: number, top: number, leaf: number, trunk: number, seed: number) => {
  for (let k = 0; k < trunk; k++) w.set(x, y, top + k, B.oak_log);
  const r = 1;
  for (let dz = 0; dz <= 2; dz++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (dz === 2 && (dx || dy)) continue;
        if (dz === 0 && !(dx === 0 || dy === 0)) continue;
        if (h3(x + dx, y + dy, top + dz, seed) < 0.12) continue;
        w.put(x + dx, y + dy, top + trunk - 1 + dz, leaf);
      }
};
