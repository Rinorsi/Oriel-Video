/**
 * Procedural pixel-art world map (pure, no imports, no DOM): produces an RGBA buffer of GW x GH cells.
 * Each cell is CELL world pixels wide. Deterministic from the seed.
 *
 *   buildMapPixels({seed, mode, pins, route})
 *     mode 'land' : a continent; the route corridor is flattened into walkable terrain.
 *     mode 'sea'  : the route is a sea lane (water carved), pins become coastal ports.
 *     mode 'free' : no corridor (flying / teleporting), only pins are flattened.
 *   pins / route are normalized [u, v] in 0..1 of the whole map.
 */

export const GW = 960;
export const GH = 540;
export const CELL = 4;
export const WW = GW * CELL;
export const WH = GH * CELL;

export type UV = [number, number];
export type MapMode = 'land' | 'sea' | 'free';
export type MapSpec = {seed: number; mode: MapMode; pins: UV[]; route?: UV[]; night?: boolean};
export type Region = {text: string; u: number; v: number; kind: 'mountain' | 'forest' | 'sea' | 'plain'};
export type MapPixels = {data: Uint8ClampedArray; regions: Region[]};

type RGB = [number, number, number];

const hex = (s: string): RGB => {
  const n = parseInt(s.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const hash2 = (x: number, y: number, s: number) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1013904223)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, y: number, s: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
const fbm = (x: number, y: number, s: number, oct = 5) => {
  let v = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    v += vnoise(x, y, s + i * 101) * amp;
    norm += amp;
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return v / norm;
};
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const mk = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const MAP_PAL = {
  seaDeep: '#3b7aa6',
  sea: '#4a8fbb',
  seaMid: '#5ea3c8',
  seaShallow: '#7dbcd3',
  foam: '#c4e6ea',
  foamHi: '#e8f6f0',
  sand: '#ecd79f',
  sandD: '#d8bb7c',
  grass: '#8dc26b',
  grassL: '#a6d67d',
  grassD: '#75a957',
  forest: '#4f8d4c',
  forestD: '#3a7340',
  forestL: '#6aa85a',
  dirt: '#b69a63',
  dirtD: '#9a7f4e',
  dirtL: '#cdb47a',
  rock: '#9a948f',
  rockL: '#bdb7b0',
  rockD: '#6f6965',
  snow: '#f4f6f8',
  snowD: '#cfd8e4',
  ink: '#4a3623',
  river: '#5fa8d0',
  riverL: '#8cc8e2',
  roof: '#c9483f',
  roofD: '#8f2f2f',
  wall: '#f0e2bd',
  wallD: '#cdb98a',
  wood: '#8b5f38',
  woodD: '#6a4426',
  field1: '#c9d36a',
  field2: '#a9bd4e',
} as const;

type Sprite = {rows: string[]; pal: Record<string, string>};

const S_TREE: Sprite = {
  rows: ['.GGG.', 'GLGGG', 'GGGGD', 'GGGDD', '.GDD.', '..T..', '..T..'],
  pal: {G: MAP_PAL.forest, L: MAP_PAL.forestL, D: MAP_PAL.forestD, T: MAP_PAL.wood},
};
const S_PINE: Sprite = {
  rows: ['..G..', '.GLG.', '.GGD.', 'GLGGD', 'GGGDD', '..T..'],
  pal: {G: MAP_PAL.forest, L: MAP_PAL.forestL, D: MAP_PAL.forestD, T: MAP_PAL.wood},
};
const S_BUSH: Sprite = {rows: ['.GG.', 'GLGD', 'GGDD'], pal: {G: MAP_PAL.grassD, L: MAP_PAL.grassL, D: MAP_PAL.forestD}};
const S_PEAK: Sprite = {
  rows: ['.....s.....', '....sWd....', '...sWWdd...', '..lWWrrdd..', '.llllrrrdd.', 'lllllrrrrdd', 'LllllrrrrDD'],
  pal: {s: MAP_PAL.snow, W: MAP_PAL.snow, l: MAP_PAL.rockL, r: MAP_PAL.rock, d: MAP_PAL.rockD, L: MAP_PAL.rockL, D: MAP_PAL.rockD},
};
const S_PEAK_BARE: Sprite = {
  rows: ['.....l.....', '....llr....', '...llrrd...', '..llrrrrd..', '.lllrrrrdd.', 'lllrrrrrddd'],
  pal: {l: MAP_PAL.rockL, r: MAP_PAL.rock, d: MAP_PAL.rockD},
};
const S_HILL: Sprite = {rows: ['..lll..', '.lllrr.', 'llllrrr', 'DDDDDDD'], pal: {l: MAP_PAL.dirtL, r: MAP_PAL.dirt, D: MAP_PAL.dirtD}};
const S_HOUSE: Sprite = {
  rows: ['..rRr..', '.rRRRr.', 'rRRRRRr', '.WWWWW.', '.WBWDW.', '.wWWDw.'],
  pal: {R: MAP_PAL.roof, r: MAP_PAL.roofD, W: MAP_PAL.wall, w: MAP_PAL.wallD, B: '#6fb2d8', D: MAP_PAL.wood},
};
const S_TENT: Sprite = {
  rows: ['...R...', '..RRR..', '.RRWRR.', 'RRRWWRR', 'RRRDDRR'],
  pal: {R: MAP_PAL.roof, W: '#f4dcc0', D: MAP_PAL.woodD},
};
const S_TOWER: Sprite = {
  rows: ['S.S.S', 'SSSSS', 'SsSsS', 'SSSSS', 'SSBSS', 'SSSSS', 'SSDSS', 'sSDSs'],
  pal: {S: MAP_PAL.rockL, s: MAP_PAL.rock, B: '#34312f', D: MAP_PAL.woodD},
};
const S_RUIN: Sprite = {
  rows: ['S.S...S', 'SSS.S.S', 'SsSSSSS', 'SSSsSSs'],
  pal: {S: MAP_PAL.rockL, s: MAP_PAL.rock},
};
const S_SHIP: Sprite = {
  rows: ['....m....', '...mWW...', '..mWWWW..', '.mWWWWWW.', '....m....', 'BBBBBBBBB', '.BbbbbbB.', '..BBBBB..'],
  pal: {m: MAP_PAL.woodD, W: '#f6efe0', B: MAP_PAL.wood, b: MAP_PAL.woodD},
};
const S_KRAKEN: Sprite = {
  rows: ['...RRRR...', '..RRRRRR..', '..RWRRWR..', '..RRRRRR..', 'R.RRRRRR.R', '.R.R.R.R.R', 'R..R..R..R', '.R.R..R.R.'],
  pal: {R: '#b3423b', W: '#fff4d6'},
};
const S_PALM: Sprite = {
  rows: ['G.GGG.G', '.GGLGG.', '..GTG..', '...T...', '...T...'],
  pal: {G: MAP_PAL.forest, L: MAP_PAL.forestL, T: MAP_PAL.wood},
};
const S_CAVE: Sprite = {
  rows: ['.rrrr.', 'rrrrrr', 'rKKKKr', 'rKKKKr'],
  pal: {r: MAP_PAL.rock, K: '#2e2926'},
};

export const buildMapPixels = (spec: MapSpec): MapPixels => {
  const {seed, mode, pins, route} = spec;
  const rnd = mk(seed * 7 + 3);
  const data = new Uint8ClampedArray(GW * GH * 4);
  const I = (x: number, y: number) => (y * GW + x) * 4;
  const put = (x: number, y: number, c: RGB, a = 255) => {
    if (x < 0 || y < 0 || x >= GW || y >= GH) return;
    const i = I(x, y);
    data[i] = c[0];
    data[i + 1] = c[1];
    data[i + 2] = c[2];
    data[i + 3] = a;
  };
  const P = Object.fromEntries(Object.entries(MAP_PAL).map(([k, v]) => [k, hex(v)])) as Record<keyof typeof MAP_PAL, RGB>;

  // ---------------------------------------------------------------- height + moisture
  const H = new Float32Array(GW * GH);
  const M = new Float32Array(GW * GH);
  const corr = new Float32Array(GW * GH); // route corridor strength 0..1
  const pinw = new Float32Array(GW * GH);

  const stampField = (arr: Float32Array, u: number, v: number, r0: number, r1: number) => {
    const cx = u * GW;
    const cy = v * GH;
    const R = Math.ceil(r1);
    for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(GH - 1, Math.ceil(cy + R)); y++) {
      for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(GW - 1, Math.ceil(cx + R)); x++) {
        const d = Math.hypot(x - cx, y - cy) + (vnoise(x / 9, y / 9, seed + 55) - 0.5) * 16;
        const w = 1 - ss(r0, r1, d);
        if (w > arr[y * GW + x]) arr[y * GW + x] = w;
      }
    }
  };
  if (route && mode !== 'free') {
    for (let i = 0; i < route.length - 1; i++) {
      const [u0, v0] = route[i];
      const [u1, v1] = route[i + 1];
      const len = Math.hypot((u1 - u0) * GW, (v1 - v0) * GH);
      const n = Math.max(1, Math.ceil(len / 3));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        if (mode === 'land') stampField(corr, lerp(u0, u1, t), lerp(v0, v1, t), 6, 22);
        else stampField(corr, lerp(u0, u1, t), lerp(v0, v1, t), 12, 34);
      }
    }
  }
  for (const [u, v] of pins) stampField(pinw, u, v, mode === 'sea' ? 20 : 16, mode === 'sea' ? 46 : 38);

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      const u = x / GW;
      const v = y / GH;
      let h = fbm(x / 150, y / 150, seed, 5) * 1.25 - 0.08;
      const d = Math.hypot((u - 0.5) * 1.12, (v - 0.5) * 1.42);
      h -= ss(0.5, 0.92, d) * 0.62;
      const m = fbm(x / 110 + 40, y / 110 + 17, seed + 77, 4);
      if (mode === 'land') {
        h = lerp(h, 0.54 + (m - 0.5) * 0.08, corr[i] * 0.94);
      } else if (mode === 'sea') {
        h = lerp(h, 0.2, corr[i] * 0.96);
      }
      if (pinw[i] > 0) {
        const target = 0.56 + (m - 0.5) * 0.05;
        h = lerp(h, target, pinw[i] * 0.95);
      }
      H[i] = h;
      M[i] = m;
    }
  }
  const SEA = 0.45;

  // ---------------------------------------------------------------- distance to land (for water bands) and to sea (for beaches)
  const dLand = new Uint8Array(GW * GH).fill(255);
  const dSea = new Uint8Array(GW * GH).fill(255);
  const bfs = (dist: Uint8Array, seedTest: (i: number) => boolean, maxD: number) => {
    let frontier: number[] = [];
    for (let i = 0; i < GW * GH; i++) {
      if (seedTest(i)) {
        dist[i] = 0;
        frontier.push(i);
      }
    }
    for (let d = 1; d <= maxD; d++) {
      const next: number[] = [];
      for (const i of frontier) {
        const x = i % GW;
        const y = (i / GW) | 0;
        const nb = [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1];
        for (const j of nb) {
          if (j >= 0 && dist[j] === 255) {
            dist[j] = d;
            next.push(j);
          }
        }
      }
      frontier = next;
    }
  };
  bfs(dLand, (i) => H[i] >= SEA, 9);
  bfs(dSea, (i) => H[i] < SEA, 6);

  // ---------------------------------------------------------------- rivers (steepest descent from highlands)
  const river = new Uint8Array(GW * GH);
  const sources: number[] = [];
  for (let tries = 0; tries < 4000 && sources.length < 5; tries++) {
    const x = 40 + Math.floor(rnd() * (GW - 80));
    const y = 40 + Math.floor(rnd() * (GH - 80));
    const i = y * GW + x;
    if (H[i] > 0.66 && H[i] < 0.9 && corr[i] < 0.3 && pinw[i] < 0.2) {
      if (sources.every((s) => Math.hypot((s % GW) - x, ((s / GW) | 0) - y) > 160)) sources.push(i);
    }
  }
  for (const s of sources) {
    let x = s % GW;
    let y = (s / GW) | 0;
    const seen = new Set<number>();
    let wander = rnd() * 6;
    for (let step = 0; step < 1400; step++) {
      const i = y * GW + x;
      if (H[i] < SEA - 0.01 || x < 2 || y < 2 || x > GW - 3 || y > GH - 3) break;
      river[i] = 1;
      seen.add(i);
      let best = -1;
      let bestH = 9;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const j = (y + dy) * GW + (x + dx);
          if (seen.has(j)) continue;
          const sc = H[j] + (hash2(x + dx, y + dy, seed + step) - 0.5) * 0.012 + Math.sin(wander + step * 0.05) * 0.002 * (dx * dy === 0 ? 0 : 1);
          if (sc < bestH) {
            bestH = sc;
            best = j;
          }
        }
      }
      if (best < 0) break;
      x = best % GW;
      y = (best / GW) | 0;
      wander += 0.1;
    }
  }

  // ---------------------------------------------------------------- base colours
  const slope = (x: number, y: number) => {
    const a = H[Math.max(0, y - 1) * GW + Math.max(0, x - 1)];
    const b = H[Math.min(GH - 1, y + 1) * GW + Math.min(GW - 1, x + 1)];
    return a - b;
  };
  const cls = new Uint8Array(GW * GH); // 0 sea 1 beach 2 grass 3 forest 4 hill 5 mountain 6 snow
  const clamp255 = (v: number) => Math.max(0, Math.min(255, v));
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      const h = H[i];
      const m = M[i];
      const r = hash2(x, y, seed + 5);
      const r2 = hash2(x >> 1, y >> 1, seed + 9);
      if (h < SEA) {
        const dl = dLand[i];
        let c = P.seaDeep;
        if (h > 0.4 || dl <= 5) c = P.sea;
        if (h > 0.425 || dl <= 3) c = P.seaMid;
        if (dl <= 2) c = P.seaShallow;
        if (((x + y) & 1) === 0 && ((h > 0.4 && h < 0.408) || (h > 0.425 && h < 0.433))) c = h > 0.42 ? P.seaMid : P.sea;
        if (dl === 3 && ((x + y) & 1) === 0) c = P.seaShallow;
        if (r > 0.992) c = P.seaMid;
        if (dl === 2 && ((x ^ y) & 3) === 0) c = P.foam;
        put(x, y, c);
        cls[i] = 0;
        continue;
      }
      let c: RGB;
      if (h < SEA + 0.035) {
        c = r2 > 0.8 ? P.sandD : P.sand;
        cls[i] = 1;
      } else if (h >= 0.82) {
        c = P.snow;
        cls[i] = 6;
      } else if (h >= 0.72) {
        c = r2 > 0.6 ? P.rockL : P.rock;
        cls[i] = 5;
      } else if (h >= 0.64) {
        c = r2 > 0.55 ? P.dirtL : P.dirt;
        cls[i] = 4;
      } else if (m > 0.56) {
        c = r > 0.82 ? P.forestL : P.forest;
        cls[i] = 3;
      } else {
        c = r > 0.9 ? P.grassL : r > 0.76 ? P.grassD : P.grass;
        cls[i] = 2;
      }
      if (cls[i] >= 2) {
        const sl = slope(x, y);
        const k = sl > 0.014 ? 1 : sl < -0.014 ? -1 : 0;
        if (k !== 0) c = [clamp255(c[0] + k * 14), clamp255(c[1] + k * 14), clamp255(c[2] + k * 12)];
      }
      put(x, y, c);
    }
  }

  // rivers
  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      const i = y * GW + x;
      if (river[i] && H[i] >= SEA - 0.01) {
        put(x, y, P.river);
        if (H[i] < SEA + 0.12 && river[i + 1] === 0) put(x + 1, y, P.river);
        if (((x + y) & 3) === 0) put(x, y, P.riverL);
        if (cls[i] >= 2) cls[i] = 1;
      }
    }
  }

  // coastline: ink outline on land cells touching water, plus pale surf on the water side
  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      const i = y * GW + x;
      if (H[i] >= SEA && dSea[i] === 1 && !river[i]) {
        put(x, y, P.ink);
      } else if (H[i] < SEA && dLand[i] === 1) {
        put(x, y, ((x + y) & 1) === 0 ? P.foamHi : P.foam);
      }
    }
  }

  // ---------------------------------------------------------------- sprites
  const spr = (s: Sprite, ox: number, oy: number, outline: RGB | null = P.ink) => {
    const w = s.rows[0].length;
    const h = s.rows.length;
    const px = Math.round(ox - w / 2);
    const py = Math.round(oy - h);
    if (outline) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (s.rows[y][x] === '.') continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || s.rows[ny][nx] === '.') put(px + nx, py + ny, outline);
          }
        }
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = s.rows[y][x];
        if (ch !== '.') put(px + x, py + y, hex(s.pal[ch]));
      }
    }
  };
  const nearPin = (x: number, y: number, r: number) => pins.some(([u, v]) => Math.hypot(u * GW - x, v * GH - y) < r);
  const nearRoute = (x: number, y: number, r: number) => {
    if (!route) return false;
    for (let i = 0; i < route.length - 1; i++) {
      const [u0, v0] = route[i];
      const [u1, v1] = route[i + 1];
      const ax = u0 * GW;
      const ay = v0 * GH;
      const bx = u1 * GW;
      const by = v1 * GH;
      const l2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / l2));
      if (Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))) < r) return true;
    }
    return false;
  };

  const placed: [number, number][] = [];
  const free = (x: number, y: number, gap: number) => placed.every(([px, py]) => Math.hypot(px - x, py - y) > gap);
  const spot = (test: (i: number) => boolean, gap: number, margin = 30, tries = 600): [number, number] | null => {
    for (let t = 0; t < tries; t++) {
      const x = margin + Math.floor(rnd() * (GW - margin * 2));
      const y = margin + Math.floor(rnd() * (GH - margin * 2));
      const i = y * GW + x;
      if (test(i) && free(x, y, gap) && !nearPin(x, y, 60) && !nearRoute(x, y, 18)) {
        placed.push([x, y]);
        return [x, y];
      }
    }
    return null;
  };
  const grassOk = (i: number) => cls[i] === 2 && dSea[i] > 5 && river[i] === 0;
  for (let n = 0; n < 7; n++) {
    const p = spot(grassOk, 90);
    if (!p) break;
    const [x, y] = p;
    for (let f = 0; f < 3; f++) {
      const fx = x - 14 + f * 9 + (f === 1 ? 2 : 0);
      const fy = y + 3 + (f % 2);
      for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 8; xx++) put(fx + xx, fy + yy, yy % 2 === 0 ? P.field1 : P.field2);
    }
    spr(S_HOUSE, x - 4, y);
    spr(S_HOUSE, x + 4, y + 3);
    if (n % 2 === 0) spr(S_HOUSE, x - 12, y + 2);
  }
  for (let n = 0; n < 3; n++) {
    const p = spot((i) => cls[i] === 2 || cls[i] === 3, 80);
    if (p) {
      spr(S_TENT, p[0] - 4, p[1]);
      spr(S_TENT, p[0] + 3, p[1] + 2);
    }
  }
  for (let n = 0; n < 2; n++) {
    const p = spot((i) => cls[i] === 2 || cls[i] === 4, 100);
    if (p) spr(S_TOWER, p[0], p[1]);
  }
  for (let n = 0; n < 2; n++) {
    const p = spot((i) => cls[i] === 4 || cls[i] === 2, 90);
    if (p) spr(S_RUIN, p[0], p[1]);
  }

  const spots: {x: number; y: number; s: Sprite}[] = [];
  for (let gy = 4; gy < GH - 4; gy += 5) {
    for (let gx = 4; gx < GW - 4; gx += 5) {
      const x = gx + Math.floor(hash2(gx, gy, seed + 31) * 4) - 1;
      const y = gy + Math.floor(hash2(gx, gy, seed + 32) * 4) - 1;
      const i = y * GW + x;
      const c = cls[i];
      const r = hash2(gx, gy, seed + 33);
      if (nearPin(x, y, 26) || nearRoute(x, y, 7)) continue;
      if (c === 3) {
        if (r < 0.9) spots.push({x, y, s: r < 0.45 ? S_PINE : S_TREE});
      } else if (c === 2 && r < 0.09) spots.push({x, y, s: r < 0.04 ? S_TREE : S_BUSH});
      else if (c === 1 && dSea[i] > 1 && H[i] > SEA + 0.015 && r < 0.12 && !river[i]) spots.push({x, y, s: S_PALM});
      else if (c === 4 && r < 0.4) spots.push({x, y, s: S_HILL});
    }
  }
  for (let gy = 5; gy < GH - 4; gy += 7) {
    for (let gx = 6; gx < GW - 6; gx += 8) {
      const x = gx + Math.floor(hash2(gx, gy, seed + 41) * 5) - 2;
      const y = gy + Math.floor(hash2(gx, gy, seed + 42) * 4) - 1;
      const i = y * GW + x;
      if ((cls[i] === 5 || cls[i] === 6) && !nearPin(x, y, 26) && !nearRoute(x, y, 10) && hash2(gx, gy, seed + 44) < 0.6) {
        const r = hash2(gx, gy, seed + 43);
        spots.push({x, y, s: H[i] > 0.76 && r > 0.25 ? S_PEAK : S_PEAK_BARE});
      }
    }
  }
  spots.sort((a, b) => a.y - b.y);
  for (const s of spots) spr(s.s, s.x, s.y, s.s === S_HILL ? null : s.s === S_PEAK || s.s === S_PEAK_BARE ? P.ink : P.forestD);
  for (let n = 0; n < 2; n++) {
    const p = spot((i) => cls[i] === 5, 120);
    if (p) spr(S_CAVE, p[0], p[1] + 2);
  }

  // sea decoration: waves, ships, kraken
  const lane = (x: number, y: number) => (mode === 'sea' ? nearRoute(x, y, 26) : false);
  for (let n = 0; n < 260; n++) {
    const x = 6 + Math.floor(rnd() * (GW - 12));
    const y = 6 + Math.floor(rnd() * (GH - 12));
    const i = y * GW + x;
    if (cls[i] === 0 && dLand[i] > 4) {
      const L = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < L; k++) put(x + k, y + (k % 2 === 0 ? 0 : 1), P.foam);
    }
  }
  for (let n = 0; n < 4; n++) {
    const p = spot((i) => cls[i] === 0 && dLand[i] > 8, 120, 30);
    if (p && !lane(p[0], p[1])) spr(S_SHIP, p[0], p[1], P.ink);
  }
  const kp = spot((i) => cls[i] === 0 && dLand[i] > 9, 150, 40);
  if (kp && !lane(kp[0], kp[1])) spr(S_KRAKEN, kp[0], kp[1], P.ink);

  // ---------------------------------------------------------------- region labels (positions only)
  const BX = 8;
  const BY = 6;
  const cnt = Array.from({length: BX * BY}, () => [0, 0, 0, 0]);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const b = Math.floor((y / GH) * BY) * BX + Math.floor((x / GW) * BX);
      const c = cls[y * GW + x];
      if (c >= 4) cnt[b][0]++;
      else if (c === 3) cnt[b][1]++;
      else if (c === 0 && dLand[y * GW + x] > 4) cnt[b][2]++;
      else cnt[b][3]++;
    }
  }
  const regions: Region[] = [];
  const takeBest = (k: number, kind: Region['kind'], names: string[], n: number) => {
    const order = cnt.map((c, i) => [c[k], i] as const).sort((a, b) => b[0] - a[0]);
    let got = 0;
    for (const [score, bi] of order) {
      if (got >= n || score < 1800) break;
      const bx = bi % BX;
      const by = Math.floor(bi / BX);
      const u = (bx + 0.5) / BX;
      const v = (by + 0.5) / BY;
      if (regions.some((r) => Math.hypot((r.u - u) * GW, (r.v - v) * GH) < 200)) continue;
      if (pins.some(([pu, pv]) => Math.hypot((pu - u) * GW, (pv - v) * GH) < 80)) continue;
      if (route && nearRoute(u * GW, v * GH, 55)) continue;
      regions.push({text: names[got % names.length], u, v, kind});
      got++;
    }
  };
  takeBest(0, 'mountain', ['龙脊山脉', '寒霜峰', '黑曜山'], 1);
  takeBest(1, 'forest', ['迷雾林海', '橡树林', '幽暗森林'], 1);
  takeBest(2, 'sea', ['无尽之海', '风暴洋', '翡翠湾'], 2);

  // ---------------------------------------------------------------- grid, paper, folds, aging
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const onGrid = (x % 60 === 0 && y % 4 < 2) || (y % 60 === 0 && x % 4 < 2);
      if (onGrid) {
        const i = I(x, y);
        data[i] = data[i] * 0.74 + 60 * 0.26;
        data[i + 1] = data[i + 1] * 0.74 + 40 * 0.26;
        data[i + 2] = data[i + 2] * 0.74 + 24 * 0.26;
      }
    }
  }
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = I(x, y);
      const g = hash2(x, y, seed + 900);
      const edge = Math.min(x, y, GW - 1 - x, GH - 1 - y);
      const burn = 1 - ss(0, 70, edge);
      const warm = 0.2;
      let r = data[i] * (1 - warm) + 246 * warm;
      let gg = data[i + 1] * (1 - warm) + 226 * warm;
      let b = data[i + 2] * (1 - warm) + 178 * warm;
      const k = 1 - burn * 0.34 + (g - 0.5) * 0.05;
      r *= k * (1 + burn * 0.05);
      gg *= k * (1 - burn * 0.02);
      b *= k * (1 - burn * 0.12);
      data[i] = r;
      data[i + 1] = gg;
      data[i + 2] = b;
    }
  }
  const cx = (GW / 2) | 0;
  for (let y = 0; y < GH; y++) {
    const i = I(cx, y);
    for (let c = 0; c < 3; c++) data[i + c] *= 0.88;
    const j = I(cx + 1, y);
    for (let c = 0; c < 3; c++) data[j + c] = Math.min(255, data[j + c] * 1.07);
  }
  const cy = (GH / 2) | 0;
  for (let x = 0; x < GW; x++) {
    const i = I(x, cy);
    for (let c = 0; c < 3; c++) data[i + c] *= 0.88;
    const j = I(x, cy + 1);
    for (let c = 0; c < 3; c++) data[j + c] = Math.min(255, data[j + c] * 1.07);
  }
  if (spec.night) {
    for (let i = 0; i < GW * GH; i++) {
      data[i * 4] *= 0.5;
      data[i * 4 + 1] *= 0.58;
      data[i * 4 + 2] *= 0.8;
    }
  }
  return {data, regions};
};
