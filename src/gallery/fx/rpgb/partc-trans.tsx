import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {Shockwave} from '../../../mc/Fx';
import {EASE, HEIGHT, WIDTH, clamp01, mulberry32} from '../../../mc/theme';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import type {FxEntry} from '../../types';
import {C, Rune, Torch, lerp, snap} from './kit';

/**
 * Three RPG transitions (all cut-type: the overlay covers the frame completely around p = 0.5, B appears there).
 *   rpg-t-stone-door : two thick banded stone doors slam shut from both sides (dust, shake, glowing seam), then grind open.
 *   rpg-t-torch-wipe : a torch bearer sweeps across; a stepped square-pixel light pool drags a dark curtain over A, then a second pass reveals B.
 *   rpg-t-rune-wipe  : a grid of dungeon rune slabs lights up from the centre outwards, seals gold, then goes dark and drops away to reveal B.
 */

const W = WIDTH;
const H = HEIGHT;
const hidden: CSSProperties = {opacity: 0};
const shown: CSSProperties = {opacity: 1};
const cutAtHalf = (p: number): CSSProperties => (p < 0.5 ? hidden : shown);

// ================================================================== 1. stone door

const DOOR_BANDS = [0.1, 0.46, 0.82];

const StoneDoorHalf: FC<{side: 'l' | 'r'; glow: number}> = ({side, glow}) => {
  const l = side === 'l';
  const w = W / 2 + 40;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        height: H,
        width: w,
        [l ? 'left' : 'right']: 0,
        backgroundImage: `linear-gradient(${l ? 90 : 270}deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.35) 100%), url(${block('deepslate_bricks')})`,
        backgroundSize: '100% 100%, 128px 128px',
        imageRendering: 'pixelated',
        boxShadow: `${l ? 18 : -18}px 0 0 rgba(0,0,0,0.5)`,
        overflow: 'hidden',
      }}
    >
      {/* iron bands with rivets */}
      {DOOR_BANDS.map((k, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: k * H, height: 96, background: 'linear-gradient(180deg, #4a4f57 0 8px, #2b2f35 8px 80px, #14161a 80px 100%)', boxShadow: '0 8px 0 rgba(0,0,0,0.5), inset 0 0 0 4px #0b0c0e'}}>
          {Array.from({length: 7}, (_, j) => (
            <div key={j} style={{position: 'absolute', [l ? 'left' : 'right']: 40 + j * 130, top: 36, width: 24, height: 24, background: C.gold2, boxShadow: `inset -4px -4px 0 ${C.gold1}, inset 4px 4px 0 ${C.gold3}, 0 0 0 4px #0b0c0e`}} />
          ))}
        </div>
      ))}
      {/* carved centre panel with the glowing rune */}
      <div style={{position: 'absolute', [l ? 'right' : 'left']: 150, top: 230, width: 360, height: 620, background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))', boxShadow: `inset 0 0 0 8px #0b0908, inset 0 0 0 12px ${C.stone2}, inset 12px 12px 0 rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Rune ch={l ? 6 : 19} size={240} color={C.gold2} style={{opacity: 0.4 + 0.6 * glow, filter: `drop-shadow(0 0 ${6 + 18 * glow}px ${C.gold2})`}} />
      </div>
      {/* heavy inner pillar */}
      <div style={{position: 'absolute', top: 0, bottom: 0, [l ? 'right' : 'left']: 0, width: 72, backgroundImage: `linear-gradient(${l ? 90 : 270}deg, rgba(0,0,0,0.0), rgba(0,0,0,0.45)), url(${block('polished_deepslate')})`, backgroundSize: '100% 100%, 128px 128px', imageRendering: 'pixelated', boxShadow: `inset ${l ? -8 : 8}px 0 0 #0b0908, inset ${l ? 14 : -14}px 0 0 rgba(255,255,255,0.1)`}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 68%, rgba(0,0,0,0.55) 100%)'}} />
      {/* top/bottom lintels */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 28, background: 'rgba(0,0,0,0.55)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, background: 'rgba(0,0,0,0.55)'}} />
    </div>
  );
};

const StoneDoor: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const closeT = EASE.in(clamp01(p / 0.34));
  const openT = EASE.inOut(clamp01((p - 0.66) / 0.34));
  const off = 1 - closeT + openT; // 0 = closed
  // a small rebound right after the slam
  const rb = p > 0.34 && p < 0.46 ? Math.sin(((p - 0.34) / 0.12) * Math.PI) * 14 * (1 - (p - 0.34) / 0.12) : 0;
  const shT = p > 0.34 && p < 0.5 ? 1 - (p - 0.34) / 0.16 : 0;
  const sx = Math.sin(f * 9) * 12 * shT;
  const sy = Math.cos(f * 7) * 10 * shT;
  const glow = clamp01((p - 0.34) / 0.1) * (1 - clamp01((p - 0.62) / 0.1));
  const r = mulberry32(31);
  const shift = off * (W / 2 + 60) + rb;
  const grains = Array.from({length: 38}, () => ({x: W / 2 + (r() - 0.5) * 520, y0: r() * 160, s: 8 + Math.floor(r() * 3) * 4, v: 6 + r() * 12, d: (r() - 0.5) * 6, c: ['#6b6660', '#4a4540', '#8a847c', '#2e2a27'][Math.floor(r() * 4)]}));
  const dt = p - 0.34;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${-shift}px)`}}>
          <StoneDoorHalf side="l" glow={glow} />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${shift}px)`}}>
          <StoneDoorHalf side="r" glow={glow} />
        </div>
        {/* light through the seam */}
        {glow > 0 && <div style={{position: 'absolute', left: W / 2 - 6, top: 0, width: 12, height: H, background: C.gold3, opacity: glow * (0.55 + 0.25 * Math.sin(f * 1.3)), boxShadow: `0 0 36px 10px rgba(255,181,49,${0.6 * glow})`}} />}
      </AbsoluteFill>
      {/* darkness thrown ahead of the closing doors */}
      <AbsoluteFill style={{background: `rgba(0,0,0,${0.45 * (1 - off)})`, opacity: 0}} />
      {/* dust and chips shaken loose by the slam */}
      {dt > 0 &&
        dt < 0.4 &&
        grains.map((g, i) => (
          <div key={i} style={{position: 'absolute', left: snap(g.x + g.d * dt * 160, 2), top: snap(g.y0 + g.v * dt * 160 + 900 * dt * dt, 2), width: g.s, height: g.s, background: g.c, opacity: 1 - clamp01(dt / 0.4)}} />
        ))}
      <Shockwave x={W / 2} y={H / 2} at={22} color="#ffe9a8" maxR={620} life={16} width={18} rays={12} seed={5} />
    </AbsoluteFill>
  );
};

const stoneDoorDef: TransitionDef & {mode: 'cut'} = {
  id: 'rpg-t-stone-door',
  name: '石门转场',
  frames: 66,
  mode: 'cut',
  b: (p) => (p < 0.5 ? hidden : {opacity: 1, filter: `brightness(${0.45 + 0.55 * clamp01((p - 0.62) / 0.34)})`}),
  a: (p) => ({transform: `scale(${1 + 0.06 * clamp01(p / 0.34)})`, filter: `brightness(${1 - 0.4 * clamp01(p / 0.34)})`}),
  overlay: StoneDoor,
  cues: [
    {at: 2, src: 'mc:dig/stone2', volume: 0.5, rate: 0.6},
    {at: 6, src: 'sfx:whoosh-fast.mp3', volume: 0.3, rate: 0.7},
    {at: 22, src: 'mc:dig/stone1', volume: 0.7, rate: 0.6},
    {at: 22, src: 'sfx:impact-cine.mp3', volume: 0.45},
    {at: 23, src: 'mc:random/anvil_land', volume: 0.35, rate: 0.6},
    {at: 43, src: 'mc:dig/stone3', volume: 0.5, rate: 0.55},
    {at: 45, src: 'mc:ui/stonecutter/cut1', volume: 0.3, rate: 0.6},
  ],
};

// ================================================================== 2. torch wipe

const TW_FRAMES = 72;
/** Torch x for transition progress p: two passes, left to right, off-screen at both ends (and at p = 0.5). */
const torchX = (p: number) => {
  const u = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5;
  const e = u * 0.6 + EASE.inOut(u) * 0.4;
  return -440 + e * (W + 880);
};
const TORCH_Y = 520;

/** Stepped square light: nested filled squares at low alpha. Used for the warm glow and (as a mask) to reveal bricks in the dark. */
const SIZES = Array.from({length: 11}, (_, i) => 200 + i * 120);
const StepLight: FC<{x: number; y: number; amount?: number}> = ({x, y, amount = 1}) => {
  const f = useCurrentFrame();
  const fl = 0.9 + 0.1 * Math.sin(f * 0.9);
  return (
    <>
      {SIZES.map((s, i) => {
        const sz = snap(s * (0.97 + 0.03 * fl), 16);
        return <div key={i} style={{position: 'absolute', left: snap(x - sz / 2, 16), top: snap(y - sz / 2, 16), width: sz, height: sz, background: `rgba(255,150,50,${0.075 * amount})`, mixBlendMode: 'screen'}} />;
      })}
    </>
  );
};
const maskStack = (x: number, y: number): CSSProperties => {
  const grad = 'linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16))';
  const img = SIZES.map(() => grad).join(',');
  const size = SIZES.map((s) => `${snap(s, 16)}px ${snap(s, 16)}px`).join(',');
  const pos = SIZES.map((s) => `${snap(x - snap(s, 16) / 2, 16)}px ${snap(y - snap(s, 16) / 2, 16)}px`).join(',');
  return {WebkitMaskImage: img, maskImage: img, WebkitMaskSize: size, maskSize: size, WebkitMaskPosition: pos, maskPosition: pos, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat'};
};

/** Stair-stepped edge polygon of the dark curtain. `dir` -1 = dark on the left of the edge, +1 = dark on the right. */
const curtainPoly = (edge: number, dir: -1 | 1, seed: number) => {
  const step = 60;
  const n = Math.ceil(H / step) + 2;
  const pts: string[] = [];
  const far = dir === -1 ? -200 : W + 200;
  pts.push(`${far}px -60px`);
  for (let j = 0; j < n; j++) {
    const r = mulberry32(seed + j * 17);
    const off = snap((r() * 90 - 20) * (dir === -1 ? 1 : -1), 12);
    const x = edge + off;
    pts.push(`${x}px ${j * step - 60}px`, `${x}px ${(j + 1) * step - 60}px`);
  }
  pts.push(`${far}px ${H + 120}px`);
  return `polygon(${pts.join(',')})`;
};

const TorchWipe: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const phase1 = p < 0.5;
  const tx = torchX(p);
  const bob = Math.sin(f * 0.5) * 10;
  const ty = TORCH_Y + bob;
  const edge = phase1 ? tx - 120 : tx + 120;
  const dir: -1 | 1 = phase1 ? -1 : 1;
  const poly = curtainPoly(edge, dir, 100 + Math.floor(f / 3));
  // sparks left behind by the torch (each spark keeps the position where it was born)
  const sparks: { x: number; y: number; s: number; c: string; o: number }[] = [];
  for (let age = 0; age < 26; age++) {
    const pp = p - age / TW_FRAMES;
    if (pp < 0 || (pp < 0.5 && p >= 0.5)) continue;
    for (let k = 0; k < 2; k++) {
      const r = mulberry32(900 + Math.floor((f - age) * 4 + k));
      const t = age / 26;
      sparks.push({
        x: torchX(pp) - 60 * t * (r() * 2 - 0.5) - 20 + (r() - 0.5) * 80,
        y: ty - 40 + (r() - 0.3) * 120 - t * (90 + r() * 180) + 260 * t * t * 0.4,
        s: Math.max(6, snap(16 * (1 - t) * (0.6 + r() * 0.8), 2)),
        c: [C.torchHi, C.torch, C.ember][Math.floor(r() * 3)],
        o: 1 - t,
      });
    }
  }
  return (
    <AbsoluteFill>
      {/* dark curtain; bricks show only where the pixel-light reaches */}
      <AbsoluteFill style={{clipPath: poly}}>
        <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${block('deepslate_bricks')})`, backgroundSize: '128px 128px', imageRendering: 'pixelated', filter: 'brightness(0.16)', backgroundColor: '#050403'}} />
        <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${block('deepslate_bricks')})`, backgroundSize: '128px 128px', imageRendering: 'pixelated', filter: 'brightness(0.9) sepia(0.5) saturate(1.3) contrast(1.1)', ...maskStack(tx, TORCH_Y)}} />
      </AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <StepLight x={tx} y={TORCH_Y} />
      </AbsoluteFill>
      {[1, 2, 3].map((k) => (
        <AbsoluteFill key={k} style={{clipPath: curtainPoly(edge - dir * k * 54, dir, 300 + k * 41 + Math.floor(f / 3)), background: '#050403', opacity: [0, 0.5, 0.3, 0.14][k]}} />
      ))}
      {sparks.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: snap(s.x, 2), top: snap(s.y, 2), width: s.s, height: s.s, background: s.c, opacity: s.o}} />
      ))}
      {tx > -400 && tx < W + 400 && <Torch x={tx} y={ty - 110} scale={28} seed={3} glow={false} />}
    </AbsoluteFill>
  );
};

const torchWipeDef: TransitionDef & {mode: 'cut'} = {
  id: 'rpg-t-torch-wipe',
  name: '火把光扫',
  frames: TW_FRAMES,
  mode: 'cut',
  a: (p) => ({transform: `translateX(${-p * 60}px) scale(${1 + p * 0.04})`}),
  b: (p) => (p < 0.5 ? hidden : {opacity: 1, transform: `scale(${1.04 - (p - 0.5) * 0.08})`}),
  overlay: TorchWipe,
  cues: [
    {at: 0, src: 'mc:fire/ignite', volume: 0.4},
    {at: 4, src: 'sfx:whoosh-fast.mp3', volume: 0.55, rate: 0.9},
    {at: 8, src: 'mc:block/furnace/fire_crackle1', volume: 0.3},
    {at: 37, src: 'sfx:whoosh-fast.mp3', volume: 0.5, rate: 1.05},
    {at: 40, src: 'mc:block/furnace/fire_crackle1', volume: 0.25, rate: 1.1},
  ],
};

// ================================================================== 3. rune wipe

const TS = 128;
const COLS = 15;
const ROWS = 9;
const OX = (W - COLS * TS) / 2;
const OY = (H - ROWS * TS) / 2;

type RuneTile = {c: number; r: number; d: number; inS: number; outS: number; ch: number; ph: number};
const RUNE_TILES: RuneTile[] = (() => {
  const rnd = mulberry32(77);
  const out: RuneTile[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = c - (COLS - 1) / 2;
      const cy = r - (ROWS - 1) / 2;
      const d = (Math.abs(cx) + Math.abs(cy) * 1.35) / ((COLS - 1) / 2 + ((ROWS - 1) / 2) * 1.35);
      const n = rnd() * 0.05;
      out.push({c, r, d, inS: 0.02 + d * 0.2 + n, outS: 0.56 + d * 0.2 + n, ch: Math.floor(rnd() * 26), ph: rnd() * 6.28});
    }
  }
  return out;
})();
const IN_D = 0.13;
const OUT_D = 0.14;

const RuneWipe: FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const seal = Math.sin(clamp01((p - 0.4) / 0.2) * Math.PI);
  const sh = seal > 0.2 ? (seal - 0.2) * 8 : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${Math.sin(f * 8) * sh}px, ${Math.cos(f * 6) * sh}px)`}}>
      {RUNE_TILES.map((t) => {
        const a = clamp01((p - t.inS) / IN_D);
        const b = clamp01((p - t.outS) / OUT_D);
        if (a <= 0 || b >= 1) return null;
        const pop = a < 1 ? EASE.back(a) : 1;
        const flash = a < 1 ? Math.sin(a * Math.PI) : 0;
        const glowOff = 1 - clamp01(b / 0.45);
        const lit = (0.5 + 0.18 * Math.sin(f * 0.3 + t.ph)) * glowOff + flash;
        const sink = b > 0.3 ? EASE.in(clamp01((b - 0.3) / 0.7)) : 0;
        const gold = seal * glowOff;
        return (
          <div
            key={`${t.c}-${t.r}`}
            style={{
              position: 'absolute',
              left: OX + t.c * TS,
              top: OY + t.r * TS,
              width: TS,
              height: TS,
              transform: `scale(${(0.5 + 0.5 * pop) * (1 - 0.35 * sink)}) translateY(${sink * 40}px)`,
              opacity: Math.min(1, a * 4) * (1 - sink),
              backgroundImage: `linear-gradient(rgba(10,8,12,0.35), rgba(10,8,12,0.55)), url(${block('polished_deepslate')})`,
              backgroundSize: '100% 100%, 128px 128px',
              imageRendering: 'pixelated',
              boxShadow: `inset 0 0 0 4px rgba(0,0,0,0.75), inset 8px 8px 0 rgba(255,255,255,0.08), inset -8px -8px 0 rgba(0,0,0,0.4), inset 0 0 0 8px rgba(${gold > 0.5 ? '255,181,49' : '74,168,255'},${0.55 * lit})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{position: 'relative', width: 80, height: 80, filter: lit > 0.3 ? `drop-shadow(0 0 ${6 + 10 * lit}px ${gold > 0.5 ? C.unique : C.rare})` : undefined}}>
              <Rune ch={t.ch} size={80} color={C.rare} style={{position: 'absolute', inset: 0, opacity: Math.min(1, lit) * (1 - gold)}} />
              <Rune ch={t.ch} size={80} color={C.gold3} style={{position: 'absolute', inset: 0, opacity: Math.min(1, lit + 0.2) * gold}} />
            </div>
            {flash > 0.05 && <div style={{position: 'absolute', inset: 0, background: `rgba(190,225,255,${0.35 * flash})`}} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const runeWipeDef: TransitionDef & {mode: 'cut'} = {
  id: 'rpg-t-rune-wipe',
  name: '符文幕',
  frames: 64,
  mode: 'cut',
  b: (p) => (p < 0.5 ? hidden : shown),
  overlay: RuneWipe,
  cues: [
    {at: 3, src: 'mc:ui/stonecutter/cut1', volume: 0.35, rate: 1.2},
    {at: 10, src: 'mc:dig/stone2', volume: 0.35, rate: 0.9},
    {at: 18, src: 'mc:dig/stone4', volume: 0.35, rate: 0.8},
    {at: 28, src: 'mc:random/anvil_land', volume: 0.3, rate: 1.4},
    {at: 29, src: 'sfx:impact-cine.mp3', volume: 0.3},
    {at: 38, src: 'mc:random/orb', volume: 0.3, rate: 0.7},
    {at: 42, src: 'sfx:transition-soft.mp3', volume: 0.5},
  ],
};

void lerp;
void cutAtHalf;

export const rpgTransitions: FxEntry[] = [
  transitionEntry(stoneDoorDef, {
    id: 'rpg-t-stone-door',
    name: '石门转场',
    category: 'rpg',
    tags: ['RPG', '地牢', '转场', '石门', '厚重'],
    blurb: '两扇铁箍深板岩厚石门从左右砸拢,尘土震落、门缝漏出金光,停顿后缓缓向两侧推开露出下一场景。',
    usage: '进入地牢/Boss 房、章节硬切、需要“重量感”的场景切换。',
    params: [
      {name: 'frames', desc: '转场长度(默认 66 帧)'},
      {name: '门体', desc: 'StoneDoorHalf:深板岩砖 + 三道铁箍 + 铆钉 + 发光符文板'},
      {name: '时序', desc: '合拢 0–0.34,停顿到 0.66,开门 0.66–1'},
    ],
  }),
  transitionEntry(torchWipeDef, {
    id: 'rpg-t-torch-wipe',
    name: '火把光扫',
    category: 'rpg',
    tags: ['RPG', '地牢', '转场', '火把', '横扫'],
    blurb: '持火把者横扫画面,方块像素光斑拖着黑暗帷幕盖住 A(光圈内才看得见砖墙),第二趟火把回扫露出 B。',
    usage: '探索地牢的段落切换、夜晚/洞穴场景过渡。',
    params: [
      {name: 'frames', desc: '转场长度(默认 72 帧)'},
      {name: 'TORCH_Y / SIZES', desc: '火把高度与光斑层数(11 层方块,每层 120px)'},
    ],
  }),
  transitionEntry(runeWipeDef, {
    id: 'rpg-t-rune-wipe',
    name: '符文幕',
    category: 'rpg',
    tags: ['RPG', '地牢', '转场', '符文', '网格'],
    blurb: '15×9 块地牢符文石板从中心向外逐块点亮盖满全屏,整体转金色封印,再逐块熄灭下沉露出下一场景。',
    usage: '魔法/附魔/遗迹/传送门类场景的切换。',
    params: [
      {name: 'frames', desc: '转场长度(默认 64 帧)'},
      {name: 'TS / COLS / ROWS', desc: '石板尺寸与网格(128px, 15×9)'},
      {name: 'IN_D / OUT_D', desc: '单块点亮 / 熄灭所占进度'},
    ],
  }),
];
