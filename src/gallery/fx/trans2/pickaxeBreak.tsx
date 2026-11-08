import type {FC} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {block, item, tex} from '../../../mc/assets';
import {EASE, HEIGHT, WIDTH, mulberry32} from '../../../mc/theme';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {LH, LW, LowRes} from '../../../mg/LowRes';
import {SquareBurst, ewin, jitter, mix, win} from './common';

/**
 * t2-pickaxe-break : a pickaxe hacks at the screen four times; the real block-breaking crack textures
 * (destroy_stage_0..9) spread over the shot, the first strikes knock out a few cells, and the last strike
 * shatters everything: the cells blow out as stone chips and B shows through the holes. Dual-type (B is
 * clipped to the broken cells). Params: TOOL (item id), HITS (impact times), CW/CH (cell size), CHIP (chip texture).
 */

const T = 60;
const TOOL = 'iron_pickaxe';
const CHIP = ['stone', 'cobblestone', 'andesite', 'stone'];
const HITS = [0.16, 0.3, 0.44, 0.56];
const CW = 120;
const CH = 120;
const COLS = WIDTH / CW;
const ROWS = HEIGHT / CH;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const S = 430; // pickaxe sprite size
const PIVOT = {x: 1290, y: 930};
const REST = 8;
const HIT = 88;

type Cell = {x: number; y: number; cx: number; cy: number; tb: number; r: number};
const cells: Cell[] = [];
for (let y = 0; y < ROWS; y++)
  for (let x = 0; x < COLS; x++) {
    const cx = x * CW + CW / 2;
    const cy = y * CH + CH / 2;
    const rg = mulberry32(x * 17 + y * 53 + 9);
    const dist = Math.hypot(cx - CX, cy - CY) / Math.hypot(CX, CY);
    let tb = HITS[3] + 0.005 + dist * 0.12 + rg() * 0.03;
    // the earlier strikes chip out the cells around the impact
    const dc = Math.hypot((cx - CX) / CW, (cy - CY) / CH);
    if (dc < 0.8) tb = HITS[1] + 0.004;
    else if (dc < 1.5) tb = HITS[2] + 0.004;
    cells.push({x, y, cx, cy, tb, r: rg()});
  }

const brokenPath = (p: number) => {
  let d = '';
  for (const c of cells) if (c.tb <= p) d += `M${c.x * CW} ${c.y * CH}h${CW}v${CH}h${-CW}z`;
  return d;
};

/** Pickaxe angle (deg, counter-clockwise) and extra offset for entry / follow-through. */
const pose = (p: number) => {
  const last = HITS[3];
  if (p > last + 0.012) {
    const k = win(p, last + 0.012, last + 0.1);
    return {th: mix(HIT - 16, HIT + 50, EASE.out(k)), dx: -1000 * EASE.in(k), dy: 800 * EASE.in(k)};
  }
  let k = 0;
  while (k < HITS.length - 1 && HITS[k] + 0.012 <= p) k++;
  const h = HITS[k];
  const strike = h - 0.022;
  const prevEnd = k === 0 ? -0.06 : HITS[k - 1] + 0.012;
  const big = k === 3 ? 6 : 0;
  if (p >= h) return {th: HIT + big - 16 * EASE.out(win(p, h, h + 0.012)), dx: 0, dy: 0};
  if (p >= strike) return {th: mix(REST - 4 * (k === 3 ? 3 : 1), HIT + big, EASE.in(win(p, strike, h))), dx: 0, dy: 0};
  const from = k === 0 ? REST - 30 : HIT - 16;
  const e = EASE.out(win(p, prevEnd, strike));
  return {th: mix(from, REST - 4 * (k === 3 ? 3 : 1), e), dx: k === 0 ? 700 * (1 - e) : 0, dy: k === 0 ? 500 * (1 - e) : 0};
};

const tipOf = (th: number, dx: number, dy: number) => {
  const a = (th * Math.PI) / 180;
  const vx = 0.8 * S;
  const vy = -0.82 * S;
  return {x: PIVOT.x + dx + vx * Math.cos(a) + vy * Math.sin(a), y: PIVOT.y + dy - vx * Math.sin(a) + vy * Math.cos(a)};
};

type Seg = {x0: number; y0: number; x1: number; y1: number; t: number};
const SEGS: Seg[] = (() => {
  const r = mulberry32(2024);
  const out: Seg[] = [];
  const grow = (x: number, y: number, a: number, len: number, depth: number) => {
    let cx = x;
    let cy = y;
    let ang = a;
    const n = Math.max(1, Math.floor(len / 7));
    for (let i = 0; i < n; i++) {
      ang += (r() - 0.5) * 0.42;
      const st = 7 + r() * 6;
      const nx = cx + Math.cos(ang) * st;
      const ny = cy + Math.sin(ang) * st * 0.9;
      out.push({x0: cx, y0: cy, x1: nx, y1: ny, t: Math.hypot(nx - LW / 2, ny - LH / 2) / 285});
      cx = nx;
      cy = ny;
      if (depth < 2 && r() < (depth ? 0.08 : 0.13)) grow(cx, cy, ang + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.6), len * 0.45, depth + 1);
    }
  };
  for (let i = 0; i < 10; i++) grow(LW / 2, LH / 2, (i / 10) * Math.PI * 2 + (r() - 0.5) * 0.5, 210 + r() * 80, 0);
  return out;
})();

/** How far the cracks have travelled (0..1): jumps up a step with each strike. */
const crackProgress = (p: number) => {
  const steps = [0.2, 0.42, 0.68, 1.1];
  let c = 0;
  HITS.forEach((h, i) => {
    if (p < h) return;
    const k = EASE.out(win(p, h, h + 0.03));
    c = Math.max(c, mix(i ? steps[i - 1] : 0, steps[i], k));
  });
  return c;
};

const line = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) => {
  let a = Math.round(x0);
  let b = Math.round(y0);
  const c = Math.round(x1);
  const d = Math.round(y1);
  const sx = a < c ? 1 : -1;
  const sy = b < d ? 1 : -1;
  const ex = Math.abs(c - a);
  const ey = -Math.abs(d - b);
  let err = ex + ey;
  for (let n = 0; n < 60; n++) {
    ctx.fillRect(a + dx, b + dy, 1, 1);
    if (a === c && b === d) break;
    const e2 = 2 * err;
    if (e2 >= ey) {
      err += ey;
      a += sx;
    }
    if (e2 <= ex) {
      err += ex;
      b += sy;
    }
  }
};

const drawCracks = (ctx: CanvasRenderingContext2D, c: number, alpha: number) => {
  if (c <= 0 || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  for (const pass of [0, 1]) {
    ctx.fillStyle = pass === 0 ? 'rgba(255,255,255,0.55)' : '#0d0a08';
    for (const s of SEGS) {
      if (s.t > c) continue;
      line(ctx, s.x0, s.y0, s.x1, s.y1, pass === 0 ? 1 : 0, pass === 0 ? 1 : 0);
      if (pass === 1 && s.t < 0.55) line(ctx, s.x0, s.y0, s.x1, s.y1, 1, 0);
    }
  }
  ctx.globalAlpha = 1;
};

const stageAt = (p: number) => {
  const n = HITS.filter((h) => p >= h).length;
  return [-1, 1, 4, 7, 9][Math.min(4, n)];
};

const hitShake = (p: number) => {
  let amp = 0;
  HITS.forEach((h, i) => {
    const t = (p - h) * T;
    if (t >= 0 && t < 7) amp = Math.max(amp, (i === 3 ? 42 : 12 + i * 4) * (1 - t / 7));
  });
  return amp;
};

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const stage = stageAt(p);
  const po = pose(p);
  const crackA = p < HITS[3] + 0.02 ? 1 : 1 - win(p, HITS[3] + 0.02, HITS[3] + 0.06);
  const amp = hitShake(p);
  const [sx, sy] = jitter(f, amp * 0.5, 4);
  const lastHit = (p - HITS[3]) * T;
  const tipHit = tipOf(HIT, 0, 0);
  const toolOn = p < HITS[3] + 0.1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `translate(${sx}px, ${sy}px)`}}>
      {/* block-selection outline, like the one the game draws around the block you mine */}
      <div style={{position: 'absolute', inset: 22, border: '6px solid rgba(0,0,0,0.75)', opacity: win(p, 0, 0.06) * (1 - win(p, HITS[3], HITS[3] + 0.03))}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', opacity: win(p, 0, 0.12) * (1 - win(p, HITS[3], HITS[3] + 0.1))}} />
      {/* cracks, drawn big enough to cover the shot */}
      {/* hairline cracks racing out to the screen edges, then the vanilla destroy-stage decal at the impact */}
      <LowRes ready draw={(ctx) => drawCracks(ctx, crackProgress(p), crackA)} />
      {stage >= 0 && (
        <div style={{position: 'absolute', left: CX - 288, top: CY - 288, width: 576, height: 576, opacity: crackA, backgroundImage: `url(${block(`destroy_stage_${stage}`)})`, backgroundSize: '576px 576px', imageRendering: 'pixelated', filter: 'brightness(0.3) drop-shadow(4px 4px 0 rgba(255,255,255,0.45))'}} />
      )}
      {/* dark rim around cells that have been knocked out */}
      {cells.map((c, i) => {
        if (c.tb > p) return null;
        const age = (p - c.tb) * T;
        if (age > 8) return null;
        return <div key={i} style={{position: 'absolute', left: c.x * CW, top: c.y * CH, width: CW, height: CH, boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.65), inset 10px 10px 30px rgba(0,0,0,0.5)', opacity: 1 - age / 8}} />;
      })}
      {/* flying stone chips */}
      {cells.map((c, i) => {
        if (c.tb > p) return null;
        const t = (p - c.tb) * T;
        if (t > 26) return null;
        const rg = mulberry32(i * 3 + 1);
        const ang = Math.atan2(c.cy - CY, c.cx - CX) + (rg() - 0.5) * 0.9;
        const sp = 9 + rg() * 20 + Math.hypot(c.cx - CX, c.cy - CY) * 0.012;
        const k = (1 - Math.pow(0.9, t)) / 0.1;
        const x = c.cx + Math.cos(ang) * sp * k;
        const y = c.cy + Math.sin(ang) * sp * k - 40 * Math.sin(Math.min(1, t / 8) * Math.PI * 0.5) + 0.5 * 1.0 * t * t;
        const size = 56 + Math.floor(rg() * 3) * 16;
        const fade = 1 - win(t, 16, 26);
        return (
          <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, backgroundImage: `url(${block(CHIP[i % CHIP.length])})`, backgroundSize: `${size}px ${size}px`, imageRendering: 'pixelated', transform: `rotate(${(rg() - 0.5) * 720 * (t / 26)}deg) scale(${1 - 0.35 * (t / 26)})`, opacity: fade, boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.45), inset -6px -6px 0 rgba(0,0,0,0.3), inset 6px 6px 0 rgba(255,255,255,0.15)'}} />
        );
      })}
      {/* impact chips at the tip of the pickaxe */}
      {HITS.map((h, i) => (
        <SquareBurst key={i} p={p} T={T} p0={h} x={tipHit.x} y={tipHit.y} count={i === 3 ? 60 : 22} colors={['#9a9a9a', '#7f7f7f', '#5e5e5e', '#c6c6c6']} speed={i === 3 ? 34 : 20} life={22} size={i === 3 ? 22 : 16} gravity={0.8} seed={31 + i} arc={[180, 360]} />
      ))}
      {/* the pickaxe */}
      {toolOn && (
        <div style={{position: 'absolute', left: PIVOT.x + po.dx - 0.08 * S, top: PIVOT.y + po.dy - 0.92 * S, width: S, height: S, transformOrigin: '8% 92%', transform: `rotate(${-po.th}deg)`, filter: 'drop-shadow(14px 14px 0 rgba(0,0,0,0.4))'}}>
          <Img src={item(TOOL)} style={{width: S, height: S, imageRendering: 'pixelated'}} />
        </div>
      )}
      {/* final blow */}
      {lastHit >= 0 && (
        <>
          <AbsoluteFill style={{background: '#fff', opacity: Math.max(0, 1 - lastHit / 4) * 0.6}} />
          {lastHit < 20 && (
            <div style={{position: 'absolute', left: CX - EASE.out(lastHit / 20) * 1600, top: CY - EASE.out(lastHit / 20) * 1600, width: EASE.out(lastHit / 20) * 3200, height: EASE.out(lastHit / 20) * 3200, borderRadius: '50%', border: `${Math.max(2, 40 * (1 - lastHit / 20))}px solid rgba(255,255,255,${1 - lastHit / 20})`}} />
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

export const pickaxeBreakDef: TransitionDef & {mode: 'dual'} = {
  id: 't2-pickaxe-break',
  name: '挖掘后退',
  frames: T,
  mode: 'dual',
  a: (p) => {
    const amp = hitShake(p);
    const [jx, jy] = jitter(Math.round(p * T), amp, 7);
    const prog = win(p, 0, HITS[3]);
    return {transform: `translate(${jx}px, ${jy}px) scale(${1 + 0.015 * prog})`, filter: `brightness(${1 - 0.25 * prog}) contrast(${1 + 0.12 * prog})`};
  },
  b: (p) => {
    const d = brokenPath(p);
    if (!d) return {opacity: 0};
    const amp = hitShake(p);
    const [jx, jy] = jitter(Math.round(p * T), amp, 8);
    if (p > HITS[3] + 0.16) return {};
    return {clipPath: `path('${d}')`, transform: `translate(${jx}px, ${jy}px)`, filter: `brightness(${1 + 0.5 * (1 - win(p, HITS[3], HITS[3] + 0.14))})`};
  },
  overlay: Overlay,
  cues: [
    {at: 10, src: 'mc:dig/stone1', volume: 0.6, rate: 0.9},
    {at: 10, src: 'mc:random/anvil_use', volume: 0.12, rate: 1.8},
    {at: 18, src: 'mc:dig/stone2', volume: 0.65, rate: 0.8},
    {at: 18, src: 'mc:random/anvil_use', volume: 0.12, rate: 1.6},
    {at: 26, src: 'mc:dig/stone3', volume: 0.7, rate: 0.7},
    {at: 26, src: 'mc:random/anvil_use', volume: 0.14, rate: 1.4},
    {at: 34, src: 'mc:dig/stone4', volume: 0.85, rate: 0.5},
    {at: 34, src: 'mc:random/explode2', volume: 0.35, rate: 1.3},
    {at: 36, src: 'mc:dig/gravel1', volume: 0.6, rate: 0.8},
    {at: 40, src: 'mc:dig/stone1', volume: 0.4, rate: 0.6},
  ],
};

export const pickaxeBreak = transitionEntry(pickaxeBreakDef, {
  id: 't2-pickaxe-break',
  name: '挖掘后退',
  category: 'transition',
  tags: ['镐子', '挖掘', '裂纹', '碎裂', '方块', '玩梗'],
  blurb: '一把铁镐连续凿击画面四下，原版挖掘裂纹贴图一阶一阶爬满屏幕，前几下先崩出几格缺口，最后一击整个画面碎成石块碎片四散飞溅，下一幕从缺口里露出来。',
  usage: '挖掘 / 破局 / 「打破僵局」「开凿」类转场，或表现一块一块拆开的内容。',
  params: [
    {name: 'TOOL', desc: '镐子的物品 id，默认 iron_pickaxe（可换 diamond_pickaxe 等）'},
    {name: 'HITS', desc: '四次凿击发生的位置（0~1），最后一次为破碎'},
    {name: 'CW / CH', desc: '碎裂格子大小，默认 120'},
    {name: 'CHIP', desc: '飞散碎片的方块贴图'},
  ],
});

void tex;
