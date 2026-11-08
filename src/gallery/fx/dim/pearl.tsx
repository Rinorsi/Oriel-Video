import type {FC} from 'react';
import {AbsoluteFill, Img, Sequence, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst} from '../../../mc/Fx';
import {item, tex} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {OreText, TYPE} from '../../../mg/Ore';
import {glow} from '../../../mg/Graphic';
import {LowRes, tint} from '../../../mg/LowRes';
import {OutlineText, Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import type {FxEntry} from '../../types';
import {Cam, lerp, mod, pixelCross, smooth, useDim, useWarp, type DimAssets} from './kit';
import {OverworldCanvas} from './scenes';

/**
 * Ender pearl teleport.
 *   f 6..30    Steve winds up and throws; the pearl flies in an arc across the screen with a purple trail
 *   f 30..50   pearl lands at B; Steve at A flickers/glitches while purple particles spiral up around him
 *   f 44..52   he is stretched into a tall thin streak and torn away (beam + pixel cross flare); the screen pinches and warps
 *   f 50..64   he squashes into place at B out of converging particles; 2.5 hearts of fall damage blink off
 *   f 64..     camera settles on B, dotted path fades
 * `bg` = full demo (world + HUD); without it only Steve, pearl and particles on transparent.
 * Tunables in source: AX/BX (world positions in units), S (units per skin pixel), the frame constants below.
 */

export const T = 112;
const S = 3;
const AX = 96;
const BX = 380;
const FY = 203;
const THROW = 8;
const LAND = 30;
const GONE = 48;
const ARRIVE = 52;

const PURPLE = ['#e9a8ff', '#b46bff', '#ffffff', '#8a3cf0', '#ff7ae8'];

const steveCache = new Map<string, HTMLCanvasElement>();
const steveSprite = (A: DimAssets, arm: number) => {
  const key = `${arm}`;
  let c = steveCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 16 * S;
    c.height = (32 + 8) * S;
    const x = c.getContext('2d')!;
    x.imageSmoothingEnabled = false;
    const sk = A.img.steve;
    const part = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number) => x.drawImage(sk, sx, sy, sw, sh, (dx + 8) * S, (dy + 40) * S, sw * S, sh * S);
    // origin: feet at (8, 40) in sprite space, room above for a raised arm
    part(4, 20, 4, 12, -4, -12);
    part(20, 52, 4, 12, 0, -12);
    part(4, 36, 4, 12, -4, -12);
    part(4, 52, 4, 12, 0, -12);
    part(44, 20, 4, 12, -8, -24 - arm);
    part(44, 36, 4, 12, -8, -24 - arm);
    part(36, 52, 4, 12, 4, -24);
    part(52, 52, 4, 12, 4, -24);
    part(20, 20, 8, 12, -4, -24);
    part(20, 36, 8, 12, -4, -24);
    part(8, 8, 8, 8, -4, -32);
    part(40, 8, 8, 8, -4, -32);
    steveCache.set(key, c);
  }
  return c;
};
const tintCache = new Map<string, HTMLCanvasElement>();
const steveTint = (src: HTMLCanvasElement, key: string, color: string) => {
  const k = `${key}|${color}`;
  let c = tintCache.get(k);
  if (!c) {
    c = tint(src as unknown as HTMLImageElement, color);
    tintCache.set(k, c);
  }
  return c;
};

/** Draw Steve with feet at (x, FY), non-uniform scale, optional glitch slices and a colour wash (0..1). */
const drawSteveFx = (ctx: CanvasRenderingContext2D, A: DimAssets, x: number, sx: number, sy: number, o: {arm?: number; glitch?: number; wash?: number; washColor?: string; seed?: number; alpha?: number}) => {
  const arm = Math.round(o.arm ?? 0);
  const spr = steveSprite(A, arm);
  const w = spr.width * sx;
  const h = spr.height * sy;
  const x0 = x - (8 * S) * sx;
  const y0 = FY - 40 * S * sy;
  const r = mulberry32(o.seed ?? 1);
  const slicesN = 12;
  const offs = Array.from({length: slicesN}, () => (r() < 0.55 ? Math.round((r() - 0.5) * 2 * (o.glitch ?? 0) * 10) : 0));
  const draw = (src: HTMLCanvasElement, a: number) => {
    ctx.globalAlpha = a;
    if (!o.glitch) {
      ctx.drawImage(src, Math.round(x0), Math.round(y0), Math.round(w), Math.round(h));
      return;
    }
    const slices = 12;
    const sh = spr.height / slices;
    for (let i = 0; i < slices; i++) {
      const off = offs[i];
      ctx.drawImage(src, 0, i * sh, spr.width, sh, Math.round(x0 + off), Math.round(y0 + i * sh * sy), Math.round(w), Math.ceil(sh * sy) + 1);
    }
  };
  draw(spr, o.alpha ?? 1);
  if (o.wash) draw(steveTint(spr, `a${arm}`, o.washColor ?? '#d9a0ff'), o.wash * (o.alpha ?? 1));
  ctx.globalAlpha = 1;
};

const arc = (p: number) => ({
  x: lerp(AX + 14, BX, p),
  y: lerp(FY - 62, FY - 4, p) - 120 * Math.sin(Math.PI * p),
});

const drawPearl = (ctx: CanvasRenderingContext2D, A: DimAssets, f: number) => {
  // --- throw
  const p = clamp01((f - THROW) / (LAND - THROW));
  const ease = (t: number) => t;
  if (f >= THROW && f < LAND + 1) {
    const pos = arc(ease(p));
    // trail
    for (let k = 1; k <= 28; k++) {
      const tp = p - k * 0.018;
      if (tp < 0) break;
      const q = arc(tp);
      const a = 1 - k / 28;
      ctx.fillStyle = PURPLE[k % PURPLE.length];
      ctx.globalAlpha = a * 0.9;
      const s = k < 6 ? 3 : 2;
      ctx.fillRect(Math.round(q.x + Math.sin(k * 1.7 + f) * 3 - s / 2), Math.round(q.y + Math.cos(k * 1.3) * 3 - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, pos.x, pos.y, 34, '#b46bff', 0.7);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(Math.round(pos.x), Math.round(pos.y));
    ctx.rotate(f * 0.5);
    ctx.drawImage(A.img.pearl, -14, -14, 28, 28);
    ctx.restore();
  }
  // dotted path after landing
  if (f >= LAND) {
    const a = smooth(LAND, LAND + 6, f) * (1 - smooth(ARRIVE + 14, ARRIVE + 40, f));
    ctx.fillStyle = '#d9a0ff';
    for (let i = 0; i <= 40; i++) {
      if (i % 2) continue;
      const q = arc(i / 40);
      ctx.globalAlpha = a * 0.8;
      ctx.fillRect(Math.round(q.x - 1), Math.round(q.y - 1), 3, 3);
    }
    ctx.globalAlpha = 1;
  }
};

const spiral = (ctx: CanvasRenderingContext2D, cx: number, cy: number, f: number, o: {up: boolean; count: number; radius: number; height: number; t: number}) => {
  // helix of squares around a vertical axis; t = 0..1 progress of the phase
  for (let i = 0; i < o.count; i++) {
    const u = i / o.count;
    const ang = f * 0.45 + u * Math.PI * 6;
    const hgt = (o.up ? u : 1 - u) * o.height;
    const rad = o.radius * (o.up ? 1 - u * 0.5 : 0.3 + u * 0.7) * (o.up ? 1 : 1 - o.t * 0.85);
    const x = cx + Math.cos(ang) * rad;
    const y = cy - hgt + Math.sin(ang) * rad * 0.3;
    const depth = Math.sin(ang) > 0 ? 1 : 0.55;
    ctx.globalAlpha = (0.5 + 0.5 * (1 - u)) * depth * Math.min(1, o.t * 4 + 0.2);
    ctx.fillStyle = PURPLE[i % PURPLE.length];
    const s = i % 5 === 0 ? 3 : 2;
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
  }
  ctx.globalAlpha = 1;
};

const drawActors = (ctx: CanvasRenderingContext2D, A: DimAssets, f: number) => {
  const bob = Math.sin(f / 9) * 0.6;
  // ---- Steve at A
  let draw = false;
  let sx = 1;
  let sy = 1;
  let glitch = 0;
  let wash = 0;
  let alpha = 1;
  const arm = f < THROW - 3 ? 0 : f < THROW + 3 ? 7 : f < THROW + 10 ? 7 * (1 - (f - THROW - 3) / 7) : 0;
  if (f < LAND) draw = true;
  else if (f < GONE - 4) {
    draw = f % 3 !== 0;
    glitch = (f - LAND) / (GONE - 4 - LAND) * 1.6 + 0.4;
    wash = f % 2 ? 0.4 : 0.1;
    alpha = 0.55 + 0.45 * ((f % 4) / 4);
  } else if (f < GONE) {
    const u = (f - (GONE - 4)) / 4;
    draw = true;
    sy = 1 + 1.4 * u * u;
    sx = 1 - 0.78 * u * u;
    wash = 0.35 + 0.4 * u;
    glitch = 0.5;
  }
  if (draw) drawSteveFx(ctx, A, AX, sx, sy + bob * 0.01, {arm, glitch, wash, seed: f, alpha});
  if (f >= LAND && f < GONE) spiral(ctx, AX, FY, f, {up: true, count: 70, radius: 34, height: 130, t: (f - LAND) / (GONE - LAND)});
  // disappearance: beam, ring, puff
  if (f >= GONE - 1 && f < GONE + 12) {
    const u = (f - GONE + 1) / 12;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(233,196,255,${0.9 * (1 - u)})`;
    ctx.fillRect(AX - Math.round(5 * (1 - u)), 0, Math.max(1, Math.round(10 * (1 - u))), FY + 4);
    ctx.fillStyle = `rgba(255,255,255,${1 - u})`;
    ctx.fillRect(AX - 1, 0, 2, FY + 4);
    glow(ctx, AX, FY - 40, 90 * (1 - u * 0.3), '#c07bff', 0.8 * (1 - u));
    ctx.globalCompositeOperation = 'source-over';
    pixelCross(ctx, AX, FY - 30, u, {size: 44, seed: 3});
  }
  // ---- B side: landing of the pearl, converging spiral, arrival
  if (f >= LAND && f < LAND + 12) {
    const u = (f - LAND) / 12;
    pixelCross(ctx, BX, FY - 6, u, {size: 28, seed: 5});
    glow(ctx, BX, FY - 8, 50 * (1 - u * 0.4), '#b46bff', 0.7 * (1 - u));
    const r = mulberry32(14);
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2;
      const v = (0.6 + r()) * 26;
      ctx.fillStyle = PURPLE[i % PURPLE.length];
      ctx.globalAlpha = 1 - u;
      ctx.fillRect(Math.round(BX + Math.cos(a) * v * u * 1.2), Math.round(FY - 4 - Math.abs(Math.sin(a)) * v * u * 1.6 + 14 * u * u), 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  if (f >= LAND + 6 && f < ARRIVE) spiral(ctx, BX, FY, f, {up: false, count: 80, radius: 46, height: 150, t: (f - LAND - 6) / (ARRIVE - LAND - 6)});
  if (f >= ARRIVE - 8 && f < ARRIVE + 16) {
    ctx.globalCompositeOperation = 'lighter';
    const a = f < ARRIVE ? (f - ARRIVE + 8) / 8 : 1 - (f - ARRIVE) / 16;
    glow(ctx, BX, FY - 40, 110, '#b46bff', 0.7 * a);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (f >= ARRIVE) {
    const t = f - ARRIVE;
    let ssx = 1;
    let ssy = 1;
    let w = 0;
    if (t < 6) {
      const u = t / 6;
      ssy = lerp(2.4, 0.78, EASE.out(u));
      ssx = lerp(0.2, 1.28, EASE.out(u));
      w = 1 - u * 0.6;
    } else {
      const u = t - 6;
      const d = Math.exp(-u / 5);
      ssy = 1 + (-0.22) * d * Math.cos(u * 0.9);
      ssx = 1 + 0.28 * d * Math.cos(u * 0.9);
      w = Math.max(0, 0.4 - u / 12);
    }
    const hurt = f >= ARRIVE + 4 && f < ARRIVE + 18 ? (f % 4 < 2 ? 0.55 : 0) : 0;
    drawSteveFx(ctx, A, BX, ssx, ssy, {arm: 0, wash: Math.max(w, hurt), washColor: hurt > w ? '#ff3b3b' : '#e9c4ff'});
    if (t >= 0 && t < 14) {
      const u = t / 14;
      pixelCross(ctx, BX, FY - 22, u, {size: 60, seed: 8});
    }
    if (t >= 0 && t < 40) {
      const u = t / 40;
      const r = mulberry32(81);
      for (let i = 0; i < 40; i++) {
        const a = r() * Math.PI;
        const v = (0.4 + r()) * 48;
        ctx.fillStyle = PURPLE[i % PURPLE.length];
        ctx.globalAlpha = (1 - u) * 0.9;
        ctx.fillRect(Math.round(BX + Math.cos(a * 2) * v * Math.sqrt(u)), Math.round(FY - 20 - Math.sin(a) * v * 1.8 * Math.sqrt(u) + u * u * 20), 2 + (i % 4 === 0 ? 1 : 0), 2);
      }
      ctx.globalAlpha = 1;
    }
    // lingering motes
    if (t > 10) {
      const m = mulberry32(5);
      for (let i = 0; i < 24; i++) {
        const x = BX + (m() - 0.5) * 60;
        const y = FY - mod(m() * 90 + t * (0.5 + m() * 0.5), 90);
        ctx.fillStyle = PURPLE[i % PURPLE.length];
        ctx.globalAlpha = clamp01(1 - (t - 10) / 70) * 0.8;
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }
  // purple residue where he stood
  if (f >= GONE && f < GONE + 36) {
    const u = (f - GONE) / 36;
    const m = mulberry32(33);
    for (let i = 0; i < 24; i++) {
      const x = AX + (m() - 0.5) * 50;
      const y = FY - 4 - u * (30 + m() * 50) - m() * 20;
      ctx.fillStyle = PURPLE[i % PURPLE.length];
      ctx.globalAlpha = (1 - u) * 0.9;
      ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    ctx.globalAlpha = 1;
  }
};

// ---------------------------------------------------------------- HUD

const hud = (p: string) => tex(`gui/sprites/hud/${p}.png`);
const HOTBAR: string[] = ['diamond_sword', 'iron_pickaxe', 'bow', 'golden_apple', 'ender_pearl', 'bread', 'water_bucket', 'enchanted_book', 'totem_of_undying'];

const Hud: FC<{f: number}> = ({f}) => {
  const x0 = 596;
  const top = 984;
  const dmg = f >= ARRIVE + 4;
  const blink = dmg && f < ARRIVE + 24 && Math.floor((f - ARRIVE) / 3) % 2 === 0;
  const shake = dmg && f < ARRIVE + 16 ? (f % 2 ? 4 : -4) : 0;
  const hearts = Array.from({length: 10}, (_, i) => {
    const full = !dmg ? 2 : i < 7 ? 2 : i === 7 ? 1 : 0;
    const was = i < 8 ? 2 : 0;
    return {full, lost: dmg && full < was};
  });
  const pearls = f >= THROW + 3 ? 15 : 16;
  const pop = f >= THROW + 3 && f < THROW + 14 ? 1 + 0.22 * Math.sin(((f - THROW - 3) / 11) * Math.PI) : 1;
  return (
    <AbsoluteFill>
      <Img src={hud('hotbar')} style={{position: 'absolute', left: x0, top, width: 728, height: 88, imageRendering: 'pixelated'}} />
      <Img src={hud('hotbar_selection')} style={{position: 'absolute', left: x0 - 4 + 4 * 80, top: top - 4, width: 96, height: 92, imageRendering: 'pixelated'}} />
      {HOTBAR.map((id, i) => (
        <div key={id} style={{position: 'absolute', left: x0 + 12 + i * 80, top: top + 12, width: 64, height: 64, transform: i === 4 ? `scale(${pop})` : undefined}}>
          <Img src={item(id)} style={{width: 64, height: 64, imageRendering: 'pixelated'}} />
          {i === 4 && (
            <div style={{position: 'absolute', right: -4, bottom: -8}}>
              <OreText size={TYPE.small} shadow>
                {String(pearls)}
              </OreText>
            </div>
          )}
        </div>
      ))}
      {/* xp bar */}
      <Img src={hud('experience_bar_background')} style={{position: 'absolute', left: x0, top: top - 28, width: 728, height: 20, imageRendering: 'pixelated'}} />
      <div style={{position: 'absolute', left: x0, top: top - 28, width: 728 * 0.62, height: 20, overflow: 'hidden'}}>
        <Img src={hud('experience_bar_progress')} style={{width: 728, height: 20, imageRendering: 'pixelated'}} />
      </div>
      {/* hearts + food */}
      {hearts.map((h, i) => (
        <div key={i} style={{position: 'absolute', left: x0 + i * 32, top: top - 72 + shake * (i % 2 ? 1 : -1) * 0.5}}>
          <Img src={hud('heart/container')} style={{position: 'absolute', width: 36, height: 36, imageRendering: 'pixelated'}} />
          {h.full > 0 && <Img src={hud(`heart/${h.full === 2 ? 'full' : 'half'}${blink && h.lost ? '_blinking' : ''}`)} style={{position: 'absolute', width: 36, height: 36, imageRendering: 'pixelated'}} />}
          {h.lost && blink && <Img src={hud('heart/full_blinking')} style={{position: 'absolute', width: 36, height: 36, imageRendering: 'pixelated', opacity: 0.6}} />}
        </div>
      ))}
      {Array.from({length: 10}, (_, i) => (
        <Img key={i} src={hud('food_full')} style={{position: 'absolute', left: x0 + 728 - 36 - i * 32, top: top - 72, width: 36, height: 36, imageRendering: 'pixelated'}} />
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- composition

const DamagePop: FC<{x: number; y: number; text: string}> = ({x, y, text}) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, 8, EASE.back);
  const up = EASE.out(clamp01(f / 36)) * 90;
  return (
    <div style={{position: 'absolute', left: x - 200, width: 400, top: y - up, display: 'flex', justifyContent: 'center', transform: `scale(${p})`, opacity: 1 - prog(f, 26, 14, EASE.in)}}>
      <OutlineText size={96} color="#ff5555">
        {text}
      </OutlineText>
    </div>
  );
};

/** Props of Pearl. Without `bg` only Steve, the pearl and particles are drawn on transparent. */
export type PearlProps = {
  /** true = demo overworld + HUD behind (default off). */
  bg?: boolean;
  /** Fall-damage pop-up text; empty string hides it. */
  damage?: string;
};

export const Pearl: FC<PearlProps> = ({bg, damage = '-2.5 ♥'}) => {
  const f = useCurrentFrame();
  const A = useDim();
  const k = Math.sin(clamp01((f - 40) / 14) * Math.PI) * (f < 62 ? 1 : 0);
  const warp = useWarp(f, 34 * k, 0.008);
  const settle = EASE.out(clamp01((f - 54) / 56));
  const zoom = 1 + 0.3 * settle;
  const pan = -120 * settle;
  const redHit = f >= ARRIVE + 3 && f < ARRIVE + 14 ? 1 - (f - ARRIVE - 3) / 11 : 0;
  return (
    <AbsoluteFill style={{background: bg ? '#000' : undefined, overflow: 'hidden'}}>
      {warp.node}
      <AbsoluteFill style={{transform: `scale(${1 - 0.05 * k}, ${1 + 0.03 * k})`, filter: `${warp.filter ?? ''} hue-rotate(${k * 18}deg) saturate(${1 + k * 0.3})`.trim()}}>
        <Cam zoom={zoom} fx={BX * 4} fy={820} dx={pan}>
          {bg && <OverworldCanvas tod={0.22} frame ps={2} />}
          <LowRes ready={!!A} draw={(ctx) => A && (drawPearl(ctx, A, f), drawActors(ctx, A, f))} />
          <Sequence from={ARRIVE + 5} durationInFrames={40}>
            {damage !== '' && <DamagePop x={BX * 4} y={FY * 4 - 96 * 4 - 130} text={damage} />}
          </Sequence>
        </Cam>
      </AbsoluteFill>
      {bg && <Hud f={f} />}
      {/* hurt flash + vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(200,0,0,0) 40%, rgba(220,20,20,0.7) 100%)', opacity: redHit * 0.7}} />
      <Vignette s={0.18 + 0.3 * k} color="40,0,80" />
      <Flash at={GONE - 1} life={8} color="#f3e0ff" peak={0.4} />
      <Flash at={ARRIVE} life={7} color="#e9c4ff" peak={0.35} />
      <Sequence from={ARRIVE} durationInFrames={50}>
        <PixelBurst x={BX * 4} y={FY * 4 - 160} at={0} count={44} colors={['#e9a8ff', '#b46bff', '#ffffff', '#ff7ae8']} speed={26} life={34} size={14} gravity={0.3} seed={7} />
      </Sequence>
      <Sfx at={THROW} src={mcSound('random/pop')} volume={0.45} rate={1.3} />
      <Sfx at={LAND} src={mcSound('random/orb')} volume={0.5} rate={0.7} />
      <Sfx at={LAND + 2} src={mcSound('dig/stone1')} volume={0.25} rate={1.6} />
      <Sfx at={GONE} src={mcSound('random/orb')} volume={0.55} rate={1.4} />
      <Sfx at={ARRIVE} src={mcSound('random/orb')} volume={0.5} rate={0.5} />
      <Sfx at={ARRIVE + 4} src={mcSound('random/anvil_land')} volume={0.2} rate={1.8} />
    </AbsoluteFill>
  );
};

export const pearlEntries: FxEntry[] = [
  {
    meta: {
      id: 'dim-pearl-teleport',
      name: '末影珍珠传送',
      category: 'map',
      tags: ['传送', '末影珍珠', '粒子', '扭曲'],
      frames: T,
      blurb: '史蒂夫甩出末影珍珠，原地故障闪烁、紫色粒子螺旋升起，被拉成细长光柱抽走，画面短暂挤压扭曲，随后在珍珠落点被粒子聚拢、挤压弹出，并受到摔落伤害。',
      usage: '展示末影珍珠、传送点、瞬移位置变化，或“一眨眼就到了”的剧情跳转。',
      params: [
        {name: 'bg', desc: 'true 为完整演示（世界+HUD）；省略则只有史蒂夫、珍珠与粒子的透明层'},
        {name: 'AX / BX / S', desc: '起点、终点的横向位置（低分辨率单位）与人物缩放（源码常量）'},
      ],
    },
    Demo: () => <Pearl bg />,
    Layer: () => <Pearl />,
  },
];

