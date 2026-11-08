import {useMemo} from 'react';
import type {FC} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {OutlineText} from '../../../reel/kit';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Cv, Stage, W, H, ease, hash, lerp, smooth} from './common';

/**
 * Particle layers: block debris + dust, experience orbs, fireflies / embers. All transparent and deterministic.
 */

const blockTex = (id: string) => staticFile(`mc/textures/block/${id}.png`);
const hudTex = (id: string) => staticFile(`mc/textures/gui/sprites/hud/${id}.png`);

/* ------------------------------------------------------------------ block debris */

const DEBRIS = ['stone', 'dirt', 'moss_block', 'oak_planks', 'cobblestone', 'gravel', 'oak_planks', 'stone'];

/**
 * atm-particles-blocks: 4x4 texel chunks of stone / dirt / moss / oak planks / cobblestone / gravel tumble down from above in three depth
 * layers (far small and hazy, near big and soft), over drifting dust clouds, a dust haze at the top and puffs in the corners.
 * Props: density (0..1.3), wind (px/frame, sideways), dust (0..1), textures (block texture ids), start (frame the fall begins).
 */
export const BlockDebris: FC<{density?: number; wind?: number; dust?: number; textures?: string[]; start?: number; prewarm?: number}> = ({density = 1, wind = 1.2, dust = 1, textures = DEBRIS, start = 0, prewarm = 30}) => {
  const realF = useCurrentFrame() - start;
  const f = realF + prewarm;
  const layers = useMemo(
    () => [
      {n: 80, px: 4, vy: 3.6, blur: 0.9, op: 0.8, spin: 3, seed: 1},
      {n: 56, px: 7, vy: 7, blur: 0, op: 1, spin: 5, seed: 2},
      {n: 22, px: 13, vy: 13.5, blur: 2.6, op: 0.96, spin: 7, seed: 3},
    ],
    [],
  );
  const env = smooth(0, 14, realF) * density;
  return (
    <AbsoluteFill>
      {/* top dust haze + corner puffs */}
      <AbsoluteFill style={{background: `linear-gradient(to bottom, rgba(140,124,104,${(0.62 * dust * env).toFixed(3)}), rgba(140,124,104,${(0.12 * dust * env).toFixed(3)}) 28%, rgba(140,124,104,0) 55%)`}} />
      {[0, 1].map((i) => (
        <div key={i} style={{position: 'absolute', [i ? 'right' : 'left']: -260, top: -200, width: 900, height: 900, background: `radial-gradient(circle closest-side, rgba(150,132,110,${((0.46 + 0.06 * Math.sin(f / 14 + i)) * dust * env).toFixed(3)}), rgba(150,132,110,0))`}} />
      ))}
      {/* dust clouds */}
      {Array.from({length: 9}, (_, i) => {
        const s = 160 + hash(i, 5) * 260;
        const x = ((hash(i, 6) * (W + 400) + f * (0.4 + hash(i, 7) * 0.8) * (i % 2 ? 1 : -1) + wind * f * 0.6) % (W + 400)) - 200;
        const y = ((hash(i, 8) * (H + 300) + f * (1.1 + hash(i, 9) * 1.6)) % (H + 300)) - 150;
        return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, background: `radial-gradient(circle closest-side, rgba(168,148,120,${((0.2 + hash(i, 10) * 0.1) * dust * env).toFixed(3)}), rgba(168,148,120,0))`}} />;
      })}
      {layers.map((L, li) => {
        const count = Math.round(L.n * density);
        const span = H + 260;
        return Array.from({length: count}, (_, i) => {
          const s0 = hash(i, L.seed, 21) * 46;
          if (f < s0) return null;
          const y = ((f - s0) * L.vy * (0.8 + hash(i, L.seed, 22) * 0.4) + hash(i, L.seed, 23) * span * 0) % span - 130;
          // pieces enter from the top only after their start: the first pass covers the screen as they fall
          const x = hash(i, L.seed, 24) * (W + 200) - 100 + Math.sin(f * 0.04 + hash(i, L.seed, 25) * 6.28) * 22 * L.px * 0.3 + wind * (f - s0) * 0.6 * (L.px / 5);
          const px = L.px;
          const size = 4 * px;
          const cx = Math.floor(hash(i, L.seed, 26) * 12);
          const cy = Math.floor(hash(i, L.seed, 27) * 12);
          const tex = textures[Math.floor(hash(i, L.seed, 28) * textures.length)];
          const rot = hash(i, L.seed, 29) * 360 + (f - s0) * L.spin * (hash(i, L.seed, 30) < 0.5 ? -1 : 1) * (0.5 + hash(i, L.seed, 31));
          const wrapX = (((x % (W + 200)) + (W + 200)) % (W + 200)) - 100;
          return (
            <div key={`${li}-${i}`} style={{position: 'absolute', left: wrapX, top: y, width: size, height: size, opacity: L.op, transform: `rotate(${rot.toFixed(1)}deg)`, filter: `${L.blur ? `blur(${L.blur}px) ` : ''}drop-shadow(0 ${px}px ${px}px rgba(0,0,0,0.35))`}}>
              <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${blockTex(tex)})`, backgroundSize: `${16 * px}px ${16 * px}px`, backgroundPosition: `${-cx * px}px ${-cy * px}px`, imageRendering: 'pixelated'}} />
              <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(0,0,0,0) 45%, rgba(0,0,0,0.32))'}} />
            </div>
          );
        });
      })}
      {/* fine dust motes */}
      <Cv
        draw={(ctx, fr) => {
          const t = fr - start + prewarm;
          for (let i = 0; i < 90 * dust; i++) {
            const x = (hash(i, 41) * W + Math.sin(t * 0.03 + i) * 40 + wind * t * 0.4 * (1 + hash(i, 42))) % W;
            const y = ((hash(i, 43) * H + t * (0.8 + hash(i, 44) * 2.4)) % (H + 20)) - 10;
            const a = (0.2 + hash(i, 45) * 0.35) * env;
            ctx.fillStyle = `rgba(214,194,160,${a.toFixed(3)})`;
            const s = 2 + Math.floor(hash(i, 46) * 3) * 2;
            ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s);
          }
        }}
      />
    </AbsoluteFill>
  );
};

const BlocksDemo: FC = () => (
  <>
    <Stage plate="A" />
    <BlockDebris />
    <Sfx at={0} src={mcSound('dig/gravel1')} volume={0.4} rate={0.8} />
    <Sfx at={14} src={mcSound('dig/stone2')} volume={0.3} rate={0.9} />
    <Sfx at={38} src={mcSound('dig/stone4')} volume={0.25} rate={1.1} />
    <Sfx at={70} src={mcSound('dig/gravel1')} volume={0.25} rate={1.0} />
  </>
);

/* ------------------------------------------------------------------ experience orbs */

const ORB = ['..aaa..', '.abbbaa', 'abbaaaA', 'abaaaaA', 'aaaaaAA', '.aAAAA.', '..AAA..'];

/** Vanilla-like orb colour: pulses between yellow-green and green-teal. */
const orbColor = (t: number): [string, string, string] => {
  const k = (Math.sin(t) + 1) / 2;
  const r = Math.round(lerp(120, 230, k));
  const g = 255;
  const b = Math.round(lerp(20, 40, k));
  return [`rgb(${r},${g},${b})`, `rgb(${Math.round(r * 0.55)},${Math.round(g * 0.78)},${Math.round(b * 0.8)})`, `rgb(${Math.round(lerp(210, 255, k))},255,${Math.round(lerp(160, 200, k))})`];
};

/**
 * atm-particles-xp: experience orbs pop in all over the frame, drift and twinkle, then (from `gather`) are sucked along curved paths into a
 * target point; every arrival pops, and the last ones fire a level-up starburst. In the demo the bar and level number react.
 * Props: count, gather (frame when they start flying to the target), tx / ty (target px), seed, burst (frame of the level-up burst, auto by default).
 */
export const XpOrbs: FC<{count?: number; gather?: number; tx?: number; ty?: number; seed?: number}> = ({count = 44, gather = 56, tx = 960, ty = 914, seed = 3}) => {
  const orbs = useMemo(
    () =>
      Array.from({length: count}, (_, i) => {
        // homes spread over the whole frame, with a bias to fill corners and edges
        const hx = lerp(80, W - 80, hash(i, seed, 1));
        const hy = lerp(120, H - 220, hash(i, seed, 2));
        return {
          hx,
          hy,
          size: [4, 5, 6, 8][Math.floor(hash(i, seed, 3) * 4)],
          born: Math.floor(hash(i, seed, 4) * 30),
          depart: gather + Math.floor(hash(i, seed, 5) * 34 + (Math.hypot(hx - tx, hy - ty) / 2400) * 20),
          dur: 22 + Math.floor(hash(i, seed, 6) * 14),
          swirl: (hash(i, seed, 7) < 0.5 ? -1 : 1) * (60 + hash(i, seed, 8) * 150),
          ph: hash(i, seed, 9) * 6.28,
        };
      }),
    [count, gather, tx, ty, seed],
  );
  const bob = (o: (typeof orbs)[number], t: number) => ({x: o.hx + Math.sin(t * 0.07 + o.ph) * 18, y: o.hy - Math.max(0, t - o.born) * 0.35 + Math.sin(t * 0.09 + o.ph * 2) * 14});
  const pos = (o: (typeof orbs)[number], t: number) => {
    if (t < o.depart) return bob(o, t);
    const u = Math.min(1, (t - o.depart) / o.dur);
    const a = bob(o, o.depart);
    const e = ease.in(u) * 0.85 + u * 0.15;
    const dx = tx - a.x;
    const dy = ty - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const sw = Math.sin(Math.PI * e) * o.swirl;
    return {x: lerp(a.x, tx, e) + nx * sw, y: lerp(a.y, ty, e) + ny * sw, u};
  };
  const draw = (ctx: CanvasRenderingContext2D, f: number) => {
    const sparkles: {x: number; y: number; a: number; s: number}[] = [];
    for (const o of orbs) {
      const arrive = o.depart + o.dur;
      if (f < o.born) continue;
      const since = f - arrive;
      if (since > 12) continue;
      if (since >= 0) {
        // arrival pop: pixel cross flash + sparks at the target (no expanding outline)
        const p = since / 12;
        ctx.fillStyle = `rgba(230,255,150,${((1 - p) * 0.85).toFixed(3)})`;
        const arm = Math.round((10 + 26 * p) / 2) * 2;
        const th = p < 0.5 ? 8 : 4;
        ctx.fillRect(tx - arm, ty - th / 2, arm * 2, th);
        ctx.fillRect(tx - th / 2, ty - arm, th, arm * 2);
        for (let j = 0; j < 4; j++) {
          const ang = hash(Math.floor(o.hx), j, 3) * Math.PI * 2;
          const r = 14 + 46 * p;
          ctx.fillStyle = `rgba(230,255,150,${(1 - p).toFixed(3)})`;
          ctx.fillRect(Math.round((tx + Math.cos(ang) * r) / 2) * 2, Math.round((ty + Math.sin(ang) * r * 0.7) / 2) * 2, 6, 6);
        }
        continue;
      }
      const popIn = Math.min(1, (f - o.born) / 10);
      const sc = ease.back(popIn) * (f < o.depart ? 1 : 1 - 0.35 * Math.min(1, (f - o.depart) / o.dur));
      const p = pos(o, f);
      const col = orbColor(f * 0.14 + o.ph);
      const px = o.size * sc;
      const half = (7 * px) / 2;
      // trail while flying
      if (f >= o.depart) {
        for (let k = 1; k <= 7; k++) {
          const q = pos(o, f - k * 1.2);
          ctx.fillStyle = `rgba(170,255,70,${(0.42 * (1 - k / 8)).toFixed(3)})`;
          const s = Math.max(4, Math.round((px * 4 * (1 - k / 9)) / 2) * 2);
          ctx.fillRect(Math.round(q.x / 2) * 2 - s / 2, Math.round(q.y / 2) * 2 - s / 2, s, s);
        }
      }
      // halo
      const gr = half * 4.2;
      const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr);
      hg.addColorStop(0, 'rgba(190,255,90,0.42)');
      hg.addColorStop(0.4, 'rgba(120,255,60,0.14)');
      hg.addColorStop(1, 'rgba(120,255,60,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(p.x - gr, p.y - gr, gr * 2, gr * 2);
      // sprite
      const x0 = Math.round((p.x - half) / 2) * 2;
      const y0 = Math.round((p.y - half) / 2) * 2;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const ch = ORB[r][c];
          if (ch === '.') continue;
          ctx.fillStyle = ch === 'a' ? col[0] : ch === 'A' ? col[1] : col[2];
          ctx.fillRect(x0 + c * px, y0 + r * px, Math.ceil(px), Math.ceil(px));
        }
      }
      if (f < o.depart && Math.sin(f * 0.12 + o.ph * 3) > 0.92) sparkles.push({x: p.x + half, y: p.y - half, a: 1, s: px * 2});
    }
    for (const s of sparkles) {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(Math.round(s.x) - s.s / 2, Math.round(s.y) - 2, s.s, 4);
      ctx.fillRect(Math.round(s.x) - 2, Math.round(s.y) - s.s / 2, 4, s.s);
    }
    // level-up burst once the last orb has landed
    const last = Math.max(...orbs.map((o) => o.depart + o.dur));
    const d = f - (last + 2);
    if (d >= 0 && d < 34) {
      const p = d / 34;
      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 420 * ease.out(p) + 40);
      g.addColorStop(0, `rgba(230,255,150,${(0.7 * (1 - p)).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(120,255,60,${(0.25 * (1 - p)).toFixed(3)})`);
      g.addColorStop(1, 'rgba(120,255,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(tx - 480, ty - 480, 960, 960);
      for (let j = 0; j < 40; j++) {
        const ang = (j / 40) * Math.PI * 2 + hash(j, 8) * 0.2;
        const v = 14 + hash(j, 9) * 22;
        const r = v * (1 - Math.pow(0.9, d)) / 0.1;
        const s = (j % 3 === 0 ? 14 : 8) * (1 - p);
        ctx.fillStyle = j % 2 ? `rgba(240,255,170,${(1 - p).toFixed(3)})` : `rgba(130,255,60,${(1 - p).toFixed(3)})`;
        ctx.fillRect(Math.round((tx + Math.cos(ang) * r) / 2) * 2, Math.round((ty + Math.sin(ang) * r * 0.75 - d * 0.5) / 2) * 2, s, s);
      }
    }
  };
  return <Cv draw={draw} />;
};

const XP_GATHER = 56;
const XP_LAST = (() => {
  // mirrors the orb set in XpOrbs to find the level-up frame for the demo HUD
  let m = 0;
  for (let i = 0; i < 44; i++) {
    const hx = lerp(80, W - 80, hash(i, 3, 1));
    const hy = lerp(120, H - 220, hash(i, 3, 2));
    const depart = XP_GATHER + Math.floor(hash(i, 3, 5) * 34 + (Math.hypot(hx - 960, hy - 914) / 2400) * 20);
    m = Math.max(m, depart + 22 + Math.floor(hash(i, 3, 6) * 14));
  }
  return m;
})();

const XpDemo: FC = () => {
  const f = useCurrentFrame();
  const total = 44;
  // fraction of the bar: fills as orbs arrive, wraps to the next level at the last arrival
  let arrived = 0;
  for (let i = 0; i < total; i++) {
    const hx = lerp(80, W - 80, hash(i, 3, 1));
    const hy = lerp(120, H - 220, hash(i, 3, 2));
    const depart = XP_GATHER + Math.floor(hash(i, 3, 5) * 34 + (Math.hypot(hx - 960, hy - 914) / 2400) * 20);
    if (f >= depart + 22 + Math.floor(hash(i, 3, 6) * 14)) arrived++;
  }
  const leveled = f >= XP_LAST + 2;
  const frac = leveled ? Math.min(0.2, (f - XP_LAST) * 0.01) : lerp(0.08, 0.98, arrived / total);
  const pop = leveled ? 1 + Math.max(0, 0.4 * Math.exp(-(f - XP_LAST) / 6)) : 1;
  return (
    <>
      <Stage plate="A" />
      <div style={{position: 'absolute', left: 596, top: 904, width: 728, height: 20}}>
        <img src={hudTex('experience_bar_background')} style={{position: 'absolute', inset: 0, width: 728, height: 20, imageRendering: 'pixelated'}} />
        <img src={hudTex('experience_bar_progress')} style={{position: 'absolute', inset: 0, width: 728, height: 20, imageRendering: 'pixelated', clipPath: `inset(0 ${(1 - frac) * 100}% 0 0)`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 846, display: 'flex', justifyContent: 'center', transform: `scale(${pop})`}}>
        <OutlineText size={48} color="#80ff20">{leveled ? '30' : '29'}</OutlineText>
      </div>
      <XpOrbs />
      {Array.from({length: 7}, (_, i) => (
        <Sfx key={i} at={XP_GATHER + 18 + i * 5} src={mcSound('random/orb')} volume={0.28} rate={0.9 + i * 0.07} cut={14} />
      ))}
      <Sfx at={XP_LAST + 2} src={mcSound('random/levelup')} volume={0.5} />
    </>
  );
};

/* ------------------------------------------------------------------ fireflies / embers */

/**
 * atm-fireflies: yellow-green fireflies that wander and blink in three depth layers (far tiny, near big and blurry), and rising embers
 * that cool from white-yellow to orange to dark red while they drift upward over a warm glow at the bottom.
 * Props: fireflies (0..1 amount), embers (0..1 amount); both can be animated for a cross-fade.
 */
export const Fireflies: FC<{fireflies?: number; embers?: number; seed?: number}> = ({fireflies = 1, embers = 0, seed = 2}) => {
  const draw = (ctx: CanvasRenderingContext2D, f: number) => {
    // fireflies
    if (fireflies > 0.01) {
      const layers = [
        {n: 34, r: 48, core: 8, a: 0.62, wob: 80, sp: 0.7, seed: 1},
        {n: 20, r: 86, core: 12, a: 0.85, wob: 120, sp: 1, seed: 2},
        {n: 9, r: 170, core: 20, a: 1, wob: 170, sp: 1.4, seed: 3},
      ];
      for (const L of layers) {
        const n = Math.round(L.n * fireflies);
        for (let i = 0; i < n; i++) {
          const x0 = hash(i, L.seed, seed) * W;
          const y0 = lerp(300, 1010, Math.pow(hash(i, L.seed, seed + 1), 0.8));
          const x = x0 + Math.sin(f * 0.021 * L.sp + hash(i, L.seed, 5) * 6.28) * L.wob + Math.sin(f * 0.057 * L.sp + hash(i, L.seed, 6) * 6.28) * L.wob * 0.3;
          const y = y0 + Math.sin(f * 0.017 * L.sp + hash(i, L.seed, 7) * 6.28) * L.wob * 0.6 + Math.sin(f * 0.049 * L.sp + hash(i, L.seed, 8) * 6.28) * L.wob * 0.2;
          const bl = Math.pow(Math.max(0, Math.sin(f * (0.05 + hash(i, L.seed, 9) * 0.06) + hash(i, L.seed, 10) * 6.28)), 2.5);
          const b = (0.1 + 0.9 * bl) * L.a * Math.min(1, fireflies * 1.5);
          const g = ctx.createRadialGradient(x, y, 0, x, y, L.r);
          g.addColorStop(0, `rgba(210,255,110,${(b * 0.9).toFixed(3)})`);
          g.addColorStop(0.35, `rgba(170,255,70,${(b * 0.32).toFixed(3)})`);
          g.addColorStop(1, 'rgba(120,230,40,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
          ctx.fillStyle = `rgba(250,255,190,${Math.min(1, b * 1.2).toFixed(3)})`;
          const s = L.core;
          ctx.fillRect(Math.round(x / 2) * 2 - s / 2, Math.round(y / 2) * 2 - s / 2, s, s);
        }
      }
    }
    // embers
    if (embers > 0.01) {
      const g = ctx.createLinearGradient(0, H, 0, H - 460);
      const pulse = 0.8 + 0.2 * Math.sin(f * 0.17) * Math.sin(f * 0.07);
      g.addColorStop(0, `rgba(255,120,30,${(0.5 * embers * pulse).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(255,80,20,${(0.14 * embers * pulse).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, H - 460, W, 460);
      const n = Math.round(110 * embers);
      for (let i = 0; i < n; i++) {
        const Tc = 70 + Math.floor(hash(i, 51) * 80);
        const tt = f + hash(i, 52) * Tc;
        const k = Math.floor(tt / Tc);
        const t = (tt - k * Tc) / Tc; // 0..1 life
        const x0 = hash(i, k, 53) * W;
        const rise = (160 + hash(i, k, 54) * 740) * ease.out(t) * 0.9 + t * 120;
        const x = x0 + Math.sin(t * 9 + hash(i, k, 55) * 6.28) * (24 + hash(i, k, 56) * 40) + t * (hash(i, k, 57) - 0.3) * 160;
        const y = H + 20 - rise;
        const size = (hash(i, k, 58) < 0.15 ? 12 : hash(i, k, 58) < 0.5 ? 8 : 6) * (1 - t * 0.7);
        if (size < 2) continue;
        // colour ramp: white-yellow -> orange -> deep red
        const r = 255;
        const gC = Math.round(lerp(240, 40, Math.pow(t, 0.7)));
        const bC = Math.round(lerp(150, 10, Math.min(1, t * 2.2)));
        const a = (1 - smooth(0.65, 1, t)) * Math.min(1, t * 14) * embers;
        const flick = 0.75 + 0.25 * Math.sin(f * 0.6 + i);
        const gr = size * 4.5;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, gr);
        rg.addColorStop(0, `rgba(${r},${gC},${bC},${(0.5 * a * flick).toFixed(3)})`);
        rg.addColorStop(1, `rgba(${r},${gC},${bC},0)`);
        ctx.fillStyle = rg;
        ctx.fillRect(x - gr, y - gr, gr * 2, gr * 2);
        ctx.fillStyle = `rgba(${r},${gC},${bC},${(a * flick).toFixed(3)})`;
        const s = Math.max(2, Math.round(size / 2) * 2);
        ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s);
      }
    }
  };
  return <Cv draw={draw} />;
};

const FirefliesDemo: FC = () => {
  const f = useCurrentFrame();
  const m = smooth(78, 108, f);
  return (
    <>
      <Stage plate="B" />
      <Fireflies fireflies={1 - m} embers={m} />
      <Sfx at={84} src={mcSound('block/furnace/fire_crackle1')} volume={0.4} />
    </>
  );
};

/* ------------------------------------------------------------------ entries */

export const particleEntries: FxEntry[] = [
  {
    meta: {
      id: 'atm-particles-blocks',
      name: '方块碎屑',
      category: 'atmosphere',
      tags: ['方块', '碎屑', '尘土', '粒子', '坍塌', '透明层'],
      frames: 150,
      blurb: '石头、泥土、苔藓、橡木板、圆石、沙砾的 4×4 材质碎块从上方翻滚落下，近大远小、近处虚化带投影；顶部与四角弥漫尘土，漂浮的尘埃云与细小灰尘。',
      usage: '挖掘、坍塌、地震、矿洞与废墟镜头、破坏建筑的片段。',
      params: [
        {name: 'density', desc: '碎块密度 0..1.3'},
        {name: 'wind', desc: '横向风速（px/帧）'},
        {name: 'dust', desc: '尘土浓度 0..1'},
        {name: 'textures', desc: "方块贴图 id 数组，默认石/土/苔/木/圆石/沙砾，例如 ['netherrack','obsidian']"},
        {name: 'start / prewarm', desc: '开始下落的帧 / 预热帧数（让第 0 帧就已有碎块在空中）'},
      ],
    },
    Demo: BlocksDemo,
    Layer: () => <BlockDebris />,
  },
  {
    meta: {
      id: 'atm-particles-xp',
      name: '经验球',
      category: 'atmosphere',
      tags: ['经验', '升级', '粒子', '收集', '透明层'],
      frames: 150,
      blurb: '满屏绿色经验球冒出、漂浮闪烁，随后沿弧线加速涌向经验条，每颗到达溅出火花，最后一颗落下触发升级星爆，经验条与等级数字同步变化。',
      usage: '升级前后、击杀怪物、刷经验、获得成就的收尾。',
      params: [
        {name: 'count', desc: '经验球数量'},
        {name: 'gather', desc: '开始飞向目标的帧'},
        {name: 'tx / ty', desc: '汇聚目标位置 px（默认经验条中心）'},
        {name: 'seed', desc: '随机种子，换分布'},
      ],
    },
    Demo: XpDemo,
    Layer: () => <XpOrbs />,
  },
  {
    meta: {
      id: 'atm-fireflies',
      name: '萤火虫 / 余烬',
      category: 'atmosphere',
      tags: ['萤火虫', '余烬', '火星', '夜景', '粒子', '透明层'],
      frames: 180,
      blurb: '夜晚黄绿萤火虫三层景深漂浮闪烁；中途切换成橙红火星余烬，由白黄冷却到暗红向上飘，底部带暖色火光。',
      usage: '夜景、森林营地、篝火余烬、战后废墟、下界氛围。',
      params: [
        {name: 'fireflies', desc: '萤火虫数量 0..1'},
        {name: 'embers', desc: '火星余烬数量 0..1（两者可同时动画实现交叉渐变）'},
        {name: 'seed', desc: '随机分布种子'},
      ],
    },
    Demo: FirefliesDemo,
    Layer: () => <Fireflies fireflies={1} embers={0} />,
  },
];
