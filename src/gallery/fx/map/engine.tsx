import type {CSSProperties, FC, ReactNode} from 'react';
import {createContext, useContext} from 'react';
import {Img} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {GH, GW, WH, WW, buildMapPixels, type MapSpec, type Region, type UV} from './mapgen';

/**
 * Map engine: world/camera, routes, timeline, particles, trails.
 * World space is WW x WH pixels (3840 x 2160); the screen is 1920 x 1080.
 * Everything that must stay readable (pins, avatar, signs) is drawn with <Anchor>, which counter-scales against the camera zoom.
 */

export type P = {x: number; y: number};
export type MapNode = {
  /** Display name, e.g. "白桦村". */
  name: string;
  /** Game coordinates [x, z] shown in signs and the live HUD. */
  xz: [number, number];
  /** Position on the map, normalized [u, v] in 0..1. */
  pos: UV;
  /** Sprite key (house, tent, tower, castle, anchor, bed, chest, flag) or any item id (diamond, emerald...). */
  icon?: string;
  /** Extra line in the sign (e.g. "主城"). */
  sub?: string;
  /** Rim colour of the marker badge. */
  color?: string;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const toWorld = (uv: UV): P => ({x: uv[0] * WW, y: uv[1] * WH});
export const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
export const ease = EASE;

// ------------------------------------------------------------------ map image cache
const mapCache = new Map<string, {url: string; regions: Region[]}>();
export const getMap = (spec: MapSpec) => {
  const key = JSON.stringify(spec);
  let m = mapCache.get(key);
  if (!m) {
    const {data, regions} = buildMapPixels(spec);
    const c = document.createElement('canvas');
    c.width = GW;
    c.height = GH;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(GW, GH);
    img.data.set(data);
    ctx.putImageData(img, 0, 0);
    m = {url: c.toDataURL('image/png'), regions};
    mapCache.set(key, m);
  }
  return m;
};

// ------------------------------------------------------------------ routes
export type Route = {pts: P[]; cum: number[]; len: number; step: number};

export const resample = (poly: P[], step = 14): Route => {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + dist(poly[i], poly[i - 1]));
  const total = cum[cum.length - 1];
  const n = Math.max(2, Math.ceil(total / step));
  const pts: P[] = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const s = (k / n) * total;
    while (j < poly.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const t = (s - cum[j]) / seg;
    pts.push({x: lerp(poly[j].x, poly[j + 1].x, t), y: lerp(poly[j].y, poly[j + 1].y, t)});
  }
  const c2 = pts.map((_, k) => (k / n) * total);
  return {pts, cum: c2, len: total, step: total / n};
};

const arcLenAt = (poly: P[], idx: number) => {
  let s = 0;
  for (let i = 1; i <= idx; i++) s += dist(poly[i], poly[i - 1]);
  return s;
};

const catmull = (c: P[], per = 22): {poly: P[]; at: number[]} => {
  const poly: P[] = [];
  const at: number[] = [];
  const g = (i: number) => c[Math.max(0, Math.min(c.length - 1, i))];
  for (let i = 0; i < c.length - 1; i++) {
    at.push(poly.length);
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      poly.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  at.push(poly.length);
  poly.push(c[c.length - 1]);
  return {poly, at};
};

export type Built = {route: Route; nodeS: number[]};

/** Meandering path through the nodes (walking, horse, boat). `wiggle` is the sideways swing as a fraction of leg length. */
export const curveRoute = (nodes: P[], seed: number, wiggle = 0.16, spacing = 620): Built => {
  const rnd = mulberry32(seed + 11);
  const ctrl: P[] = [];
  const nodeIdx: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    nodeIdx.push(ctrl.length);
    ctrl.push(nodes[i]);
    if (i < nodes.length - 1) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const d = dist(a, b);
      const k = Math.max(2, Math.round(d / spacing));
      const nx = -(b.y - a.y) / d;
      const ny = (b.x - a.x) / d;
      let sign = rnd() < 0.5 ? -1 : 1;
      for (let j = 1; j <= k; j++) {
        const t = j / (k + 1);
        const off = sign * (0.5 + rnd() * 0.7) * d * wiggle;
        ctrl.push({x: lerp(a.x, b.x, t) + nx * off, y: lerp(a.y, b.y, t) + ny * off});
        sign = -sign;
      }
    }
  }
  const {poly, at} = catmull(ctrl);
  const route = resample(poly);
  return {route, nodeS: nodeIdx.map((ci) => arcLenAt(poly, at[ci]))};
};

export const roundPoly = (poly: P[], r: number, steps = 10): P[] => {
  const out: P[] = [poly[0]];
  for (let i = 1; i < poly.length - 1; i++) {
    const a = poly[i - 1];
    const v = poly[i];
    const b = poly[i + 1];
    const d = Math.min(r, dist(a, v) / 2, dist(b, v) / 2);
    const da = dist(a, v) || 1;
    const db = dist(b, v) || 1;
    const p1 = {x: v.x + ((a.x - v.x) / da) * d, y: v.y + ((a.y - v.y) / da) * d};
    const p2 = {x: v.x + ((b.x - v.x) / db) * d, y: v.y + ((b.y - v.y) / db) * d};
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      out.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * v.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * v.y + t * t * p2.y});
    }
  }
  out.push(poly[poly.length - 1]);
  return out;
};

/** Minecart rails: right-angle staircase with rounded corners. */
export const railRoute = (a: P, b: P, jog = [0.38, 0.55, 0.72], radius = 130): Built => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ctrl: P[] = [a, {x: a.x + dx * jog[0], y: a.y}, {x: a.x + dx * jog[0], y: a.y + dy * jog[1]}, {x: a.x + dx * jog[2], y: a.y + dy * jog[1]}, {x: a.x + dx * jog[2], y: b.y}, b];
  const route = resample(roundPoly(ctrl, radius));
  return {route, nodeS: [0, route.len]};
};

/** Straight ground track (the pearl's visible lift is added at render time). */
export const lineRoute = (a: P, b: P): Built => {
  const route = resample([a, b]);
  return {route, nodeS: [0, route.len]};
};

/** Long swooping flight line: a base line with a lazy sine swing. */
export const flyRoute = (a: P, b: P, amp = 0.14, waves = 1.5): Built => {
  const d = dist(a, b);
  const nx = -(b.y - a.y) / d;
  const ny = (b.x - a.x) / d;
  const poly: P[] = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const off = Math.sin(t * Math.PI * 2 * waves + 0.4) * amp * d * Math.sin(Math.PI * t) ** 0.6;
    poly.push({x: lerp(a.x, b.x, t) + nx * off, y: lerp(a.y, b.y, t) + ny * off});
  }
  const route = resample(poly);
  return {route, nodeS: [0, route.len]};
};

export const pointAt = (r: Route, s: number): P & {ang: number} => {
  const sc = Math.max(0, Math.min(r.len, s));
  const f = sc / r.step;
  const i = Math.min(r.pts.length - 2, Math.floor(f));
  const t = f - i;
  const a = r.pts[i];
  const b = r.pts[i + 1];
  const p0 = r.pts[Math.max(0, i - 1)];
  const p1 = r.pts[Math.min(r.pts.length - 1, i + 2)];
  return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), ang: Math.atan2(p1.y - p0.y, p1.x - p0.x)};
};

/** Points of the route between arc lengths s0 and s1 (ends interpolated). */
export const subPath = (r: Route, s0: number, s1: number): P[] => {
  const a = Math.max(0, s0);
  const b = Math.min(r.len, s1);
  if (b <= a) return [];
  const out: P[] = [pointAt(r, a)];
  const i0 = Math.floor(a / r.step) + 1;
  const i1 = Math.floor(b / r.step);
  for (let i = i0; i <= i1; i++) out.push(r.pts[i]);
  out.push(pointAt(r, b));
  return out;
};

export const ptsStr = (pts: P[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export const offsetPts = (pts: P[], d: number): P[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {x: p.x - ((b.y - a.y) / L) * d, y: p.y + ((b.x - a.x) / L) * d};
  });

// ------------------------------------------------------------------ timeline
export type Timing = {start: number; seg: number[]; pause: number};
export type Travel = {
  s: number;
  /** Eased 0..1 inside the current leg. */
  t: number;
  moving: boolean;
  leg: number;
  /** Index of the last node reached (0 = start), -1 before departure. */
  reached: number;
  /** Frame at which each node is reached (node 0 = departure). */
  arriveF: number[];
  departF: number[];
  endF: number;
  /** 0..1 over the whole trip (by distance). */
  trip: number;
};

export const travelAt = (f: number, nodeS: number[], tm: Timing, ez: (t: number) => number): Travel => {
  const n = nodeS.length;
  const arriveF = [tm.start];
  const departF = [tm.start];
  let at = tm.start;
  for (let i = 0; i < n - 1; i++) {
    at += tm.seg[Math.min(i, tm.seg.length - 1)];
    arriveF.push(at);
    at += tm.pause;
    departF.push(at);
  }
  let s = 0;
  let t = 0;
  let moving = false;
  let leg = 0;
  if (f >= tm.start) {
    s = nodeS[n - 1];
    leg = n - 2;
    t = 1;
    for (let i = 0; i < n - 1; i++) {
      if (f < arriveF[i + 1]) {
        const raw = clamp01((f - departF[i]) / (arriveF[i + 1] - departF[i]));
        t = ez(raw);
        s = lerp(nodeS[i], nodeS[i + 1], t);
        moving = f >= departF[i];
        if (!moving) s = nodeS[i];
        leg = i;
        break;
      }
      if (f < departF[i + 1]) {
        s = nodeS[i + 1];
        leg = i + 1;
        t = 0;
        break;
      }
    }
  }
  let reached = -1;
  for (let i = 0; i < n; i++) if (f >= arriveF[i]) reached = i;
  return {s, t, moving, leg: Math.min(leg, n - 2), reached, arriveF, departF, endF: arriveF[n - 1], trip: nodeS[n - 1] ? s / nodeS[n - 1] : 0};
};

// ------------------------------------------------------------------ camera
export type Cam = {z: number; cx: number; cy: number; f: number};
const CamCtx = createContext<Cam>({z: 1, cx: WW / 2, cy: WH / 2, f: 0});
export const useCam = () => useContext(CamCtx);

export const clampCam = (c: {z: number; cx: number; cy: number}) => {
  const z = Math.max(0.5, c.z);
  const hw = 960 / z;
  const hh = 540 / z;
  return {z, cx: Math.max(hw, Math.min(WW - hw, c.cx)), cy: Math.max(hh, Math.min(WH - hh, c.cy))};
};

/** Overview camera that fits a set of world points. */
export const fitView = (pts: P[], pad = 360, maxZ = 0.8, topRoom = 120): {z: number; cx: number; cy: number} => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const z = Math.min(maxZ, Math.max(0.5, Math.min((1920 - pad * 1.2) / Math.max(1, x1 - x0 + 200), (1080 - pad) / Math.max(1, y1 - y0 + 200))));
  return clampCam({z, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 - topRoom / z});
};

export type CamCfg = {
  overview: {z: number; cx: number; cy: number};
  followZ: number;
  introStart: number;
  introEnd: number;
  outroStart: number;
  outroEnd: number;
  /** Frames of trailing average for the follow point (bigger = lazier camera). */
  lag?: number;
  /** Extra zoom punches: [frame, strength]. */
  punches?: [number, number][];
  /** Zoom modulation while following (e.g. speed dependent). */
  zMod?: (f: number) => number;
  /** After frame `at` the follow point moves so the subject sits `dy` screen px below centre (room for the sign). */
  endShift?: {at: number; dy: number};
  /** Constant offset: the subject sits this many screen px below centre (tall subjects look centred). */
  focusDy?: number;
};

export const camAt = (f: number, cfg: CamCfg, pos: (frame: number) => P): Cam => {
  const inK = EASE.inOut(clamp01((f - cfg.introStart) / (cfg.introEnd - cfg.introStart)));
  const outK = EASE.inOut(clamp01((f - cfg.outroStart) / (cfg.outroEnd - cfg.outroStart)));
  const k = inK * (1 - outK);
  const lag = cfg.lag ?? 12;
  let ax = 0;
  let ay = 0;
  const N = 6;
  for (let i = 0; i < N; i++) {
    const p = pos(Math.max(0, f - (lag * i) / (N - 1)));
    ax += p.x;
    ay += p.y;
  }
  ax /= N;
  ay /= N;
  let fz = cfg.followZ + (cfg.zMod ? cfg.zMod(f) : 0);
  for (const [pf, st] of cfg.punches ?? []) {
    const d = f - pf;
    if (d >= 0 && d < 30) fz += st * Math.exp(-d / 7) * Math.sin(Math.min(1, d / 4) * Math.PI * 0.5);
  }
  const z = lerp(cfg.overview.z, fz, k);
  const shift = (cfg.endShift ? EASE.out(clamp01((f - cfg.endShift.at) / 18)) * cfg.endShift.dy : 0) + (cfg.focusDy ?? 0);
  const c = clampCam({z, cx: lerp(cfg.overview.cx, ax, k), cy: lerp(cfg.overview.cy, ay - shift / z, k)});
  return {...c, f};
};

// ------------------------------------------------------------------ world + anchors
export const World: FC<{cam: Cam; children: ReactNode}> = ({cam, children}) => (
  <CamCtx.Provider value={cam}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: WW,
        height: WH,
        transformOrigin: '0 0',
        transform: `translate(${Math.round(960 - cam.cx * cam.z)}px, ${Math.round(540 - cam.cy * cam.z)}px) scale(${cam.z})`,
      }}
    >
      {children}
    </div>
  </CamCtx.Provider>
);

/** A zero-size point in the world whose children are laid out in screen pixels (counter-scaled by 1/zoom). */
export const Anchor: FC<{x: number; y: number; k?: number; children?: ReactNode; style?: CSSProperties}> = ({x, y, k = 1, children, style}) => {
  const {z} = useCam();
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${k / z})`, transformOrigin: '0 0', ...style}}>{children}</div>
  );
};

export const MapImage: FC<{url: string}> = ({url}) => <Img src={url} style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH, imageRendering: 'pixelated'}} />;

// ------------------------------------------------------------------ particles
export type PartCfg = {
  /** First and last frame to emit. */
  from: number;
  to: number;
  /** One particle every `step` frames. */
  step: number;
  life: number;
  /** Where the emitter is at a given frame (world px). */
  pos: (frame: number) => P;
  colors: string[];
  /** Initial speed range in screen px / frame (counter-scaled), direction random unless `dir` is given (radians). */
  speed?: [number, number];
  dir?: (frame: number, r: () => number) => number;
  size?: [number, number];
  gravity?: number;
  drag?: number;
  seed?: number;
  shape?: 'square' | 'ring' | 'streak';
  /** Multiple particles per emission. */
  burst?: number;
  /** Jitter of the spawn point in screen px. */
  spread?: number;
  /** 'up' lifts the particles (negative y screen velocity) */
  lift?: number;
};

export const Particles: FC<{f: number; cfg: PartCfg}> = ({f, cfg}) => {
  const {z} = useCam();
  const out: ReactNode[] = [];
  const i0 = Math.max(Math.ceil(cfg.from / cfg.step), Math.ceil((f - cfg.life) / cfg.step));
  const i1 = Math.floor(Math.min(cfg.to, f) / cfg.step);
  const burst = cfg.burst ?? 1;
  for (let i = i0; i <= i1; i++) {
    const f0 = i * cfg.step;
    const age = f - f0;
    if (age < 0 || age >= cfg.life) continue;
    const base = cfg.pos(f0);
    for (let b = 0; b < burst; b++) {
      const r = mulberry32((cfg.seed ?? 1) * 7919 + i * 131 + b * 17);
      const ang = cfg.dir ? cfg.dir(f0, r) : r() * Math.PI * 2;
      const sp = lerp((cfg.speed ?? [1, 4])[0], (cfg.speed ?? [1, 4])[1], r());
      const drag = cfg.drag ?? 0.92;
      const k = (1 - Math.pow(drag, age)) / (1 - drag);
      const g = cfg.gravity ?? 0;
      const sx = (r() - 0.5) * (cfg.spread ?? 0);
      const sy = (r() - 0.5) * (cfg.spread ?? 0);
      const px = (sx + Math.cos(ang) * sp * k) / z;
      const py = (sy + Math.sin(ang) * sp * k + 0.5 * g * age * age - (cfg.lift ?? 0) * age) / z;
      const t = age / cfg.life;
      const size = lerp((cfg.size ?? [8, 16])[0], (cfg.size ?? [8, 16])[1], r());
      const col = cfg.colors[Math.floor(r() * cfg.colors.length)];
      const shape = cfg.shape ?? 'square';
      if (shape === 'ring') {
        // pixel plus-shaped sparkle (formerly an expanding ring)
        const u = Math.max(4, Math.round((size * (0.25 + t * 0.5)) / 4) * 4) / z;
        const cx = base.x + px;
        const cy = base.y + py;
        const op = (1 - t) * 0.95;
        out.push(
          <div key={`${i}-${b}`}>
            <div style={{position: 'absolute', left: cx - u * 1.5, top: cy - u / 2, width: u * 3, height: u, background: col, opacity: op}} />
            <div style={{position: 'absolute', left: cx - u / 2, top: cy - u * 1.5, width: u, height: u * 3, background: col, opacity: op}} />
            <div style={{position: 'absolute', left: cx - u / 2, top: cy - u / 2, width: u, height: u, background: '#fff', opacity: op}} />
          </div>,
        );
      } else if (shape === 'streak') {
        const s = (size * (1 - t * 0.6)) / z;
        out.push(<div key={`${i}-${b}`} style={{position: 'absolute', left: base.x + px - s * 2, top: base.y + py - s / 3, width: s * 4, height: s * 0.7, background: col, opacity: 1 - t, transform: `rotate(${(ang * 180) / Math.PI}deg)`}} />);
      } else {
        const s = Math.max(2, Math.round(size * (1 - t * 0.55))) / z;
        out.push(<div key={`${i}-${b}`} style={{position: 'absolute', left: base.x + px - s / 2, top: base.y + py - s / 2, width: s, height: s, background: col, opacity: Math.min(1, (1 - t) * 1.8), outline: `${2 / z}px solid rgba(43,35,56,0.55)`}} />);
      }
    }
  }
  return <>{out}</>;
};

/**
 * Pixel-art impact: cross flare + stepped shard trails, snapped to a pixel grid (replaces the old expanding ellipse ring).
 * `d` = frames since the hit; drawn around (0,0) in screen px, so put it inside an <Anchor>.
 */
export const PixelBurst: FC<{d: number; reach: number; color: string; accent?: string; seed?: number; life?: number}> = ({d, reach, color, accent = color, seed = 1, life = 24}) => {
  if (d < 0 || d > life) return null;
  const t = d / life;
  const P = 12;
  const snap = (v: number) => Math.round(v / P) * P;
  const rnd = mulberry32(seed * 977 + 11);
  const out: ReactNode[] = [];
  const fl = clamp01(1 - t * 2.6);
  if (fl > 0) {
    const arm = snap(reach * 0.2 * (0.5 + EASE.out(clamp01(t * 3)) * 0.9));
    const th = P * (fl > 0.5 ? 3 : 2);
    out.push(<div key="fh" style={{position: 'absolute', left: -arm, top: snap(-th / 2), width: arm * 2, height: th, background: color, opacity: fl}} />);
    out.push(<div key="fv" style={{position: 'absolute', left: snap(-th / 2), top: -arm, width: th, height: arm * 2, background: color, opacity: fl}} />);
    out.push(<div key="fc" style={{position: 'absolute', left: -P * 2, top: -P * 2, width: P * 4, height: P * 4, background: '#fff', opacity: fl}} />);
  }
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    const rr0 = reach * (0.55 + rnd() * 0.45);
    const lag = rnd() * 0.12;
    const p = EASE.out(clamp01((t - lag) / (1 - lag)));
    const fade = 1 - EASE.in(clamp01((t - 0.45) / 0.55));
    for (let j = 0; j < 3; j++) {
      const rr = rr0 * Math.max(0, p - j * 0.045) + P * 2;
      const sz = Math.max(P / 2, P * (1.6 - j * 0.5) * (0.55 + 0.45 * fade));
      out.push(<div key={`s${i}-${j}`} style={{position: 'absolute', left: snap(Math.cos(a) * rr - sz / 2), top: snap(Math.sin(a) * rr * 0.8 - sz / 2), width: sz, height: sz, background: j === 0 ? '#fff' : i % 3 === 0 ? accent : color, opacity: fade * (1 - j * 0.25)}} />);
    }
  }
  return <>{out}</>;
};

/** One-shot burst at a world point (pixel burst + flying pixels), screen-sized. */
export const Pop: FC<{f: number; at: number; x: number; y: number; colors: string[]; count?: number; speed?: number; life?: number; ring?: number; ringColor?: string; seed?: number; gravity?: number}> = ({
  f,
  at,
  x,
  y,
  colors,
  count = 22,
  speed = 14,
  life = 34,
  ring = 260,
  ringColor = '#fff',
  seed = 1,
  gravity = 0.5,
}) => {
  const d = f - at;
  if (d < 0 || d > life + 4) return null;
  const rnd = mulberry32(seed * 313);
  return (
    <Anchor x={x} y={y}>
      {ring > 0 && d < 24 && <PixelBurst d={d} reach={Math.min(460, ring * 0.7)} color={ringColor} accent={colors[0]} seed={seed} />}
      {Array.from({length: count}, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rnd() * 0.5;
        const v = speed * (0.4 + rnd() * 0.8);
        const k = (1 - Math.pow(0.9, d)) / 0.1;
        const px = Math.cos(a) * v * k;
        const py = Math.sin(a) * v * k * 0.8 + 0.5 * gravity * d * d - v * 0.6;
        const t = d / life;
        const sz = Math.max(4, Math.round((8 + rnd() * 12) * (1 - t * 0.6)));
        if (t >= 1) return null;
        return <div key={i} style={{position: 'absolute', left: px - sz / 2, top: py - sz / 2, width: sz, height: sz, background: colors[i % colors.length], opacity: 1 - t * t, outline: '3px solid rgba(43,35,56,0.5)'}} />;
      })}
    </Anchor>
  );
};
