// mcd3 effect layers (all SCREEN blend, transparent canvas, additive colours):
//   <LootBeams loop beams=[{x,y,kind,at,end}] />    rarity light pillars with a burst-out, rising crosses and a base flare (engine beam())
//   <SoulsDrift loop />                              white ghost faces with cyan-blue trails drifting across
//   <Embers loop variant="nether"|"gold" />          rising embers / ash with three depth bands
//   <LightningStorm loop strikes />                  stepped bolts, double-flash, far horizon flashes
//   <TorchGlow loop torches=[{x,y,size,kind}] />     blocky stepped warm light pools (diamond footprint) + hot core + sparks
import type {FC} from 'react';
import {FxLayer} from '../mcdscene/engine';
import * as FX from '../mcdscene/fx';
import {h2, h3} from '../mcdscene/rng';
import type {RGB} from '../mcdscene/rng';
import {H, W, TAU, baked, clamp01, glow, hex, lerp, ph, rgba} from './lib';

const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// ---------------------------------------------------------------------------------------------------------------------
// loot beams

export type BeamSpec = {x: number; y: number; kind?: FX.BeamKind; /** frame it bursts out */ at?: number; /** frame it starts fading */ end?: number; width?: number};
const BEAM_BURST: Record<FX.BeamKind, string[]> = {
  white: ['#ffffff', '#dfe4ee', '#b8c0d0'],
  green: ['#e8ffd8', '#8ce070', '#3fa535'],
  orange: ['#fff0c0', '#ffaa3a', '#f85600'],
  magenta: ['#ffe8ff', '#e56dff', '#cd2ecd'],
};

export const DEFAULT_BEAMS: BeamSpec[] = [
  {x: 560, y: 760, kind: 'white', at: 14},
  {x: 1000, y: 640, kind: 'green', at: 30},
  {x: 1400, y: 820, kind: 'orange', at: 46},
  {x: 1740, y: 600, kind: 'magenta', at: 62},
];

export const LootBeams: FC<{loop: number; beams?: BeamSpec[]; fadeOut?: number}> = ({loop, beams = DEFAULT_BEAMS, fadeOut = 14}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      beams.forEach((b, i) => {
        const at = b.at ?? 0;
        const end = b.end ?? loop - fadeOut - 4;
        const age = v.frame - at;
        if (age < 0) return;
        const kind = b.kind ?? 'white';
        const grow = easeOut(age / 5); // the game bursts out in ~4 frames
        const out = clamp01(1 - (v.frame - end) / fadeOut);
        if (out <= 0) return;
        const w = b.width ?? 92;
        ctx.save();
        ctx.globalAlpha = out;
        FX.beam(ctx, v, {x: b.x, y: b.y, kind, width: w, grow, seed: i + 1, sparkles: 14, alpha: 1});
        ctx.restore();
        // opening burst: thin rectangles + pixel specks from the base
        if (age < 16) {
          ctx.save();
          ctx.globalAlpha = out;
          FX.hitSparks(ctx, {...v, loop: 4000, frame: age + 1000}, {x: b.x, y: b.y - 10, start: 1000, seed: i + 7, n: 12, scale: 1.1, colors: BEAM_BURST[kind]});
          ctx.restore();
        }
      });
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// souls

const GHOST = ['.WWWWWW.', 'WWWWWWWW', 'WDDWWDDW', 'WDDWWDDW', 'WWWWWWWW', 'WWDDDDWW', 'WWDWWDWW', 'WWWWWWWW', '.WW.WW.W', '..W..W..'];

type Lane = {x0: number; y0: number; x1: number; y1: number; arc: number; n: number; q: number; seed: number; spread: number};
const LANES: Lane[] = [
  {x0: -170, y0: 840, x1: 2090, y1: 330, arc: 190, n: 6, q: 7, seed: 3, spread: 150},
  {x0: 2090, y0: 600, x1: -170, y1: 250, arc: 120, n: 4, q: 5, seed: 9, spread: 110},
];

/** Souls: white pixel ghost faces (soul-collect.png) towing a tapering cyan-blue ribbon, drifting across along a lazy arc. */
export const SoulsDrift: FC<{loop: number; strength?: number}> = ({loop, strength = 1}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const t = ph(v.frame, loop);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      LANES.forEach((L, li) => {
        for (let i = 0; i < L.n; i++) {
          const off = (h2(i, L.seed, 5) - 0.5) * L.spread;
          const pos = (s: number) => {
            const e = s;
            return {
              x: lerp(L.x0, L.x1, e) + Math.sin((s * 2 + i * 0.37) * TAU) * 22,
              y: lerp(L.y0, L.y1, e) - Math.sin(Math.PI * e) * L.arc + off + Math.sin((s * 3 + i * 0.21) * TAU) * 16,
            };
          };
          const s0 = (((t + i / L.n) % 1) + 1) % 1;
          const env = Math.min(1, s0 / 0.06, (1 - s0) / 0.06) * strength;
          // ribbon, oldest first so the head sits on top
          const TR = 46;
          for (let k = TR; k >= 1; k--) {
            const sa = s0 - k * 0.0042;
            const sb = s0 - (k - 1) * 0.0042;
            if (sa < 0) continue;
            const a = pos(sa);
            const b = pos(sb);
            const f = 1 - k / TR;
            ctx.strokeStyle = k > TR * 0.5 ? `rgba(60,179,200,${0.62 * f * env})` : `rgba(110,196,226,${0.9 * f * env})`;
            ctx.lineWidth = Math.max(2, L.q * 3.4 * Math.pow(f, 0.8));
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(Math.round(a.x / 2) * 2, Math.round(a.y / 2) * 2);
            ctx.lineTo(Math.round(b.x / 2) * 2, Math.round(b.y / 2) * 2);
            ctx.stroke();
            if (k % 7 === 0) {
              // drifting specks
              ctx.fillStyle = `rgba(170,235,245,${0.8 * f * env})`;
              const sp = L.q * 0.6;
              ctx.fillRect(Math.round(a.x / 2) * 2 + (h3(i, k, li, 55) - 0.5) * 36, Math.round(a.y / 2) * 2 + (h3(i, k, li, 56) - 0.5) * 36, sp, sp);
            }
          }
          const p = pos(s0);
          const hov = Math.round(Math.sin((t * 4 + i * 0.7) * TAU) * L.q * 0.6);
          glow(ctx, p.x, p.y + hov, L.q * 11, [90, 200, 225], 0.5 * env);
          const x0 = Math.round(p.x - L.q * 4);
          const y0 = Math.round(p.y - L.q * 5 + hov);
          ctx.globalAlpha = env;
          for (let r = 0; r < GHOST.length; r++)
            for (let c = 0; c < 8; c++) {
              const ch = GHOST[r][c];
              if (ch === '.') continue;
              ctx.fillStyle = ch === 'W' ? '#fcffff' : '#67a9ab';
              ctx.fillRect(x0 + c * L.q, y0 + r * L.q, L.q, L.q);
            }
          ctx.globalAlpha = 1;
        }
      });
      ctx.restore();
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// embers

type EmberVariant = 'nether' | 'gold';
const EMBER_RAMP: Record<EmberVariant, string[]> = {
  // hot at birth, dying orange-red
  nether: ['#fff2a0', '#ffd86a', '#ffb43c', '#ff8a2a', '#ff5a1f', '#c0301a'],
  gold: ['#ffffe0', '#fff2a0', '#fce386', '#f8d868', '#ffcc3a', '#d8941c'],
};
const EMBER_HALO: Record<EmberVariant, RGB> = {nether: [255, 110, 40], gold: [255, 200, 70]};

export const Embers: FC<{loop: number; variant?: EmberVariant; density?: number; wind?: number}> = ({loop, variant = 'nether', density = 1.8, wind = 0.22}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const t = ph(v.frame, loop);
      const ramp = EMBER_RAMP[variant];
      const halo = EMBER_HALO[variant];
      const bands = [
        {n: Math.round(70 * density), q: 6, span: 0.85, cyc: 1, amp: 16, halo: false},
        {n: Math.round(44 * density), q: 10, span: 1.0, cyc: 1, amp: 26, halo: true},
        {n: Math.round(22 * density), q: 18, span: 1.15, cyc: 1, amp: 44, halo: true},
      ];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      bands.forEach((b, bi) => {
        for (let i = 0; i < b.n; i++) {
          const a = (((t * b.cyc + h3(i, 1, bi, 91)) % 1) + 1) % 1;
          const bx = h3(i, 2, bi, 92) * (W + 200) - 100;
          const by = H + 60 - (0.1 + h3(i, 3, bi, 93) * 0.35) * H * 0.25; // start low
          const spanPx = (H + 260) * b.span * (0.7 + 0.5 * h3(i, 4, bi, 94));
          const x = bx + wind * a * spanPx + Math.sin((a * (1 + (i % 2)) + h3(i, 5, bi, 95)) * TAU) * b.amp;
          const y = by - a * spanPx;
          const env = Math.min(1, a / 0.08) * Math.pow(Math.max(0, 1 - a), 0.55);
          const tw = 0.62 + 0.38 * Math.sin((t * (2 + (i % 3)) + h3(i, 6, bi, 96)) * TAU);
          const col = ramp[Math.min(ramp.length - 1, Math.floor(a * ramp.length * 0.95))];
          const px = Math.round(x / 2) * 2;
          const py = Math.round(y / 2) * 2;
          const streak = h3(i, 7, bi, 97) < 0.07;
          if (variant === 'nether' && !streak && h3(i, 8, bi, 98) < 0.22) {
            // grey-red ash fleck
            ctx.globalAlpha = env * 0.5 * tw;
            ctx.fillStyle = '#8a625a';
            ctx.fillRect(px, py, b.q - 2, b.q - 2);
            continue;
          }
          if (b.halo) glow(ctx, px + b.q / 2, py + b.q / 2, b.q * 5.5, halo, 0.34 * env * tw);
          ctx.globalAlpha = env * tw;
          ctx.fillStyle = col;
          if (streak) ctx.fillRect(px, py, Math.max(2, b.q / 2), b.q * 2.6);
          else ctx.fillRect(px, py, b.q, b.q);
          if (b.q >= 10 && i % 2 === 0) {
            // tiny hot centre
            ctx.globalAlpha = env * tw * 0.9;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + b.q / 2 - 1, py + b.q / 2 - 1, 2, 2);
          }
        }
      });
      ctx.restore();
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// lightning

export type Strike = {frame: number; x: number; y: number; seed: number; kind?: 'bolt' | 'far'};
export const DEFAULT_STRIKES: Strike[] = [
  {frame: 34, x: 0.64, y: 0.64, seed: 3},
  {frame: 49, x: 0.64, y: 0.64, seed: 3},
  {frame: 112, x: 0.2, y: 0.36, seed: 5, kind: 'far'},
  {frame: 150, x: 0.3, y: 0.7, seed: 8},
  {frame: 160, x: 0.84, y: 0.4, seed: 2, kind: 'far'},
  {frame: 208, x: 0.5, y: 0.8, seed: 12},
];

const FLASH_ENV = [1, 0.8, 0.28, 0.12, 0.62, 0.4, 0.22, 0.14, 0.09, 0.06, 0.04, 0.02];
const q2 = (n: number, q = 4) => Math.round(n / q) * q;

/** Stair-step bolt path: vertical runs joined by horizontal jogs, converging on the target. Returns rects as [x,y,w,h] centre-lines. */
const boltPath = (px: number, py: number, seed: number) => {
  const pts: [number, number][] = [];
  let x = px + (h2(seed, 1, 21) - 0.5) * 520;
  let y = -30;
  pts.push([q2(x), y]);
  let i = 0;
  while (y < py - 8 && i < 40) {
    const run = 34 + h2(seed, i + 2, 22) * 40;
    const ny = Math.min(py, y + run);
    pts.push([q2(x), ny]);
    y = ny;
    if (y >= py) break;
    const remain = (py - y) / (py + 30);
    const toward = (px - x) * (0.22 + 0.2 * (1 - remain));
    const jog = (h2(seed, i + 3, 23) - 0.5) * 70 + toward;
    x += jog;
    pts.push([q2(x), y]);
    i++;
  }
  pts.push([q2(px), py]);
  return pts;
};

const strokeRuns = (ctx: CanvasRenderingContext2D, pts: [number, number][], w: number) => {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    ctx.fillRect(Math.min(x0, x1) - w / 2, Math.min(y0, y1) - w / 2, Math.abs(x1 - x0) + w, Math.abs(y1 - y0) + w);
  }
};

export const LightningStorm: FC<{loop: number; strikes?: Strike[]; flash?: number}> = ({loop, strikes = DEFAULT_STRIKES, flash = 1}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of strikes) {
        const age = (v.frame - s.frame + loop * 4) % loop;
        if (age > 14) continue;
        const far = s.kind === 'far';
        const env = FLASH_ENV[Math.min(FLASH_ENV.length - 1, age)] * flash;
        const px = s.x * W;
        const py = s.y * H;
        // whole-frame flash, brighter towards the sky
        const sk = ctx.createLinearGradient(0, 0, 0, H);
        sk.addColorStop(0, `rgba(150,205,255,${(far ? 0.34 : 0.62) * env})`);
        sk.addColorStop(1, `rgba(80,140,210,${(far ? 0.16 : 0.36) * env})`);
        ctx.fillStyle = sk;
        ctx.fillRect(0, 0, W, H);
        // wide glow around the strike (far = a big soft patch on the horizon)
        glow(ctx, px, py - (far ? 0 : 60), far ? W * 0.5 : W * 0.38, [150, 205, 255], (far ? 0.8 : 0.8) * env, far ? 0.55 : 0.7);
        if (far) continue;
        if (age <= 5 && age !== 3) {
          const pts = boltPath(px, py, s.seed);
          ctx.save();
          ctx.shadowColor = 'rgba(66,161,224,0.9)';
          ctx.shadowBlur = 24;
          ctx.fillStyle = 'rgba(66,161,224,0.55)';
          strokeRuns(ctx, pts, 22);
          ctx.restore();
          ctx.fillStyle = 'rgba(138,203,202,0.9)';
          strokeRuns(ctx, pts, 12);
          ctx.fillStyle = '#fafdf5';
          strokeRuns(ctx, pts, 6);
          // two short forks
          for (let k = 0; k < 2; k++) {
            const bi = 2 + Math.floor(h2(s.seed, k, 31) * Math.max(1, pts.length - 6));
            const [bx, by] = pts[Math.min(pts.length - 3, bi)];
            const dir = k === 0 ? 1 : -1;
            const fork: [number, number][] = [[bx, by]];
            let fx = bx;
            let fy = by;
            for (let j = 0; j < 4; j++) {
              fy += 26 + h2(s.seed, j + k * 5, 32) * 22;
              fork.push([q2(fx), fy]);
              fx += dir * (14 + h2(s.seed, j + k * 5, 33) * 30);
              fork.push([q2(fx), fy]);
            }
            ctx.fillStyle = 'rgba(138,203,202,0.85)';
            strokeRuns(ctx, fork, 8);
            ctx.fillStyle = '#e8fbff';
            strokeRuns(ctx, fork, 4);
          }
          // impact
          glow(ctx, px, py, 240, [200, 240, 255], 1.0 * env, 0.5);
          FX.hitSparks(ctx, {...v, loop: 4000, frame: 1000 + age}, {x: px, y: py, start: 1000, seed: s.seed, n: 14, scale: 1.2, colors: ['#e8f8ff', '#8acbca', '#42a1e0']});
        }
      }
      ctx.restore();
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// torch glow

export type TorchKind = 'torch' | 'camp' | 'soul' | 'lava';
export type TorchSpec = {x: number; y: number; size?: number; kind?: TorchKind};
const TORCH: Record<TorchKind, {ramp: string[]; core: RGB; mid: RGB; r: number}> = {
  // warm ramp from STYLE-SCENE 6.4: #ffffe5 -> #ffe07a -> #f1ba5b -> #d88d57
  torch: {ramp: ['#9a3a14', '#c4561c', '#e8892e', '#f6b04a', '#ffd070', '#ffe8a0'], core: [255, 232, 160], mid: [255, 160, 60], r: 300},
  camp: {ramp: ['#8a2c10', '#bc4818', '#e8742a', '#f89a3c', '#ffc060', '#ffe090'], core: [255, 222, 140], mid: [255, 130, 40], r: 420},
  soul: {ramp: ['#14505a', '#1f7a86', '#34a8b0', '#6ad0d0', '#a8f0f0', '#e0ffff'], core: [210, 255, 255], mid: [60, 190, 200], r: 280},
  lava: {ramp: ['#7a1408', '#a82210', '#d8441a', '#f87428', '#fba838', '#fed25a'], core: [255, 210, 90], mid: [250, 90, 30], r: 460},
};
const CELL = 12;

/** One stepped pool: blocky light levels on a diamond footprint (iso ground plane), dithered edge, 3 flicker variants. */
const pool = (kind: TorchKind, variant: number) => {
  const P = TORCH[kind];
  const R = P.r;
  const ratio = 0.56;
  const w = Math.ceil((R * 2) / CELL) * CELL;
  const h = Math.ceil((R * 2 * ratio) / CELL) * CELL;
  return baked(`torchpool|${kind}|${variant}`, w, h, (g) => {
    const cols = w / CELL;
    const rows = h / CELL;
    const ramp = P.ramp.map(hex);
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const dx = (cx + 0.5) * CELL - w / 2;
        const dy = ((cy + 0.5) * CELL - h / 2) / ratio;
        // diamond-leaning metric (L1 blended with L2), the shape of a voxel light flood on an iso ground
        const d = (0.62 * (Math.abs(dx) + Math.abs(dy)) * 0.8 + 0.38 * Math.hypot(dx, dy)) / R;
        let I = clamp01(1 - d);
        I = Math.pow(I, 1.5) + (h3(cx, cy, variant, 41) - 0.5) * 0.1 * Math.min(1, I * 4);
        const lv = Math.floor(clamp01(I) * 6.2);
        if (lv <= 0) continue;
        const c = ramp[Math.min(5, lv - 1)];
        g.fillStyle = rgba(c, 0.03 + 0.085 * (lv - 1));
        g.fillRect(cx * CELL, cy * CELL, CELL, CELL);
      }
  });
};

export const DEFAULT_TORCHES: TorchSpec[] = [
  {x: 606, y: 396, kind: 'torch'},
  {x: 266, y: 668, kind: 'torch'},
  {x: 724, y: 810, kind: 'camp', size: 1},
  {x: 1290, y: 800, kind: 'torch'},
  {x: 860, y: 1026, kind: 'torch'},
];

export const TorchGlow: FC<{loop: number; torches?: TorchSpec[]; strength?: number}> = ({loop, torches = DEFAULT_TORCHES, strength = 1}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const t = ph(v.frame, loop);
      torches.forEach((tc, i) => {
        const kind = tc.kind ?? 'torch';
        const P = TORCH[kind];
        const sz = tc.size ?? 1;
        // flicker: layered integer-cycle sines (fast jitter x slow sway)
        const fl = 0.84 + 0.1 * Math.sin((t * 11 + i * 0.37) * TAU) * Math.sin((t * 3 + i * 0.21) * TAU) + 0.06 * Math.sin((t * 17 + i * 0.5) * TAU);
        const variant = Math.floor(v.frame / 3 + i) % 3;
        const sp = pool(kind, variant);
        const scale = sz * (0.97 + 0.04 * fl);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = clamp01(fl) * strength;
        const gx = tc.x;
        const gy = tc.y + 40 * sz; // the pool sits on the ground below the flame
        ctx.drawImage(sp, gx - (sp.width * scale) / 2, gy - (sp.height * scale) / 2, sp.width * scale, sp.height * scale);
        ctx.restore();
        // soft base under the blocks (the "gradient" half), wide + tight bloom, hot core
        const fa = clamp01(fl) * strength;
        glow(ctx, gx, gy, P.r * 1.05 * scale, P.mid, 0.2 * fa, 0.56);
        glow(ctx, tc.x, tc.y, W * 0.05 * 4.4 * sz, P.mid, 0.34 * fa);
        glow(ctx, tc.x, tc.y, W * 0.012 * 4.2 * sz, P.core, 0.85 * fa);
        // rising sparks
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 7; k++) {
          const a = (((t * (1 + (k % 2)) + h3(i, k, 1, 51)) % 1) + 1) % 1;
          const sx = tc.x + (h3(i, k, 2, 52) - 0.5) * 30 * sz + Math.sin((a + k) * TAU) * 14 * sz;
          const sy = tc.y - a * (150 + 90 * h3(i, k, 3, 53)) * sz;
          ctx.globalAlpha = Math.sin(a * Math.PI) * 0.95 * fa;
          ctx.fillStyle = k % 3 === 0 ? '#fffbe0' : P.ramp[4];
          const qq = k % 3 === 0 ? 6 : 4;
          ctx.fillRect(Math.round(sx / 2) * 2, Math.round(sy / 2) * 2, qq, qq);
        }
        ctx.restore();
      });
    }}
  />
);

void lerp;
