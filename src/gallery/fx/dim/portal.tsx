import type {FC} from 'react';
import {AbsoluteFill, Img, Sequence, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {item} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {glow, hexA} from '../../../mg/Graphic';
import {LowRes} from '../../../mg/LowRes';
import {ORE, OreChip} from '../../../mg/Ore';
import {Letterbox, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import type {FxEntry} from '../../types';
import {Cam, H, W, bands, hash, lerp, mod, motes, pixelCross, shade, smooth, tile, useDim, blockUrl, type DimAssets} from './kit';
import {DimTitle} from './titles';

/**
 * End portal activation (bonus). A dim stronghold room, a ring of 12 portal frames in floor perspective (scanline projection of a
 * top-down plane drawn on the low-res canvas). Eyes of Ender fly in one by one, each landing pulses the frame and shakes the room;
 * after the twelfth the centre fills with a starry void, a beam of light shoots up and the title "末地传送门" lands.
 * `bg` = full demo; without it only the eye fly-ins, glows, beam, counter and title (transparent).
 */

export const T = 232;
const HY = 100;
const K = 17920;
const HH = 56.4;
const ZC = 194;
const TILE = 32;
const CX = 512;
const CY = 512;
const FIRST = 20;
const GAP = 7;
const FULL_AT = FIRST + 11 * GAP + 12; // all eyes landed
// ring slots (col,row) on a 5x5 grid, clockwise from the top-left
const SLOTS: [number, number][] = [
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 1],
  [4, 2],
  [4, 3],
  [3, 4],
  [2, 4],
  [1, 4],
  [0, 3],
  [0, 2],
  [0, 1],
];
const slotXY = (c: number, r: number) => ({x: CX + (c - 2) * TILE, y: CY + (r - 2) * TILE});

/** Project a point of the floor plane (source units) to the screen (low-res units). */
const proj = (sx: number, sy: number) => {
  const Z = CY + ZC - sy;
  const yd = HY + K / Z;
  const s = K / (Z * HH);
  return {x: 240 + (sx - CX) * s, y: yd, s};
};

let src: HTMLCanvasElement | null = null;
let floor: HTMLCanvasElement | null = null;
const getFloor = (A: DimAssets) => {
  if (floor) return floor;
  floor = document.createElement('canvas');
  floor.width = 1024;
  floor.height = 1024;
  const c = floor.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  tile(c, A.img.stonebricks, 0, 0, 1024, 1024, 2);
  // moss and cracks sprinkled over the bricks
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash(401, i) * 32) * 32;
    const y = Math.floor(hash(402, i) * 32) * 32;
    const t = hash(403, i) < 0.5 ? A.img.mossy : A.img.cracked;
    c.drawImage(t, 0, 0, 16, 16, x, y, 32, 32);
  }
  shade(c, 0, 0, 1024, 1024, '#05060c', 0.42);
  // dais under the ring: dark obsidian-ish plates and a chiseled border
  const d0 = CX - 3.5 * TILE;
  const dw = 7 * TILE;
  tile(c, A.img.obsidian, d0, d0, dw, dw, 2);
  shade(c, d0, d0, dw, dw, '#000010', 0.25);
  for (let i = 0; i < 7; i++) {
    c.drawImage(A.img.chiseled, 0, 0, 16, 16, d0 + i * TILE, d0, 32, 32);
    c.drawImage(A.img.chiseled, 0, 0, 16, 16, d0 + i * TILE, d0 + 6 * TILE, 32, 32);
    c.drawImage(A.img.chiseled, 0, 0, 16, 16, d0, d0 + i * TILE, 32, 32);
    c.drawImage(A.img.chiseled, 0, 0, 16, 16, d0 + 6 * TILE, d0 + i * TILE, 32, 32);
  }
  shade(c, d0 + TILE, d0 + TILE, dw - 2 * TILE, dw - 2 * TILE, '#000000', 0.35);
  return floor;
};

const landFrame = (i: number) => FIRST + i * GAP + 12;

const drawRoom = (ctx: CanvasRenderingContext2D, A: DimAssets, f: number, show: boolean) => {
  // --- back wall
  tile(ctx, A.img.stonebricks, 0, 0, W, 132, 2, 0, 0);
  shade(ctx, 0, 0, W, 132, '#02030a', 0.62);
  for (let x = 0; x < W; x += 96) {
    // pillars
    tile(ctx, A.img.chiseled, x - 8, 0, 18, 132, 2, 0, 0);
    shade(ctx, x - 8, 0, 18, 132, '#000008', 0.55);
    shade(ctx, x - 8, 0, 2, 132, '#8c8fb0', 0.18);
  }
  ctx.globalAlpha = 0.7;
  bands(ctx, 0, 70, [
    [0, '#000000'],
    [1, '#02030a'],
  ], 4);
  ctx.globalAlpha = 1;
  // torches
  for (const tx of [60, 150, 330, 420]) {
    const fl = 0.8 + 0.2 * Math.sin(f / 3 + tx);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, tx, 66, 80, '#ff9a3a', 0.4 * fl);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(A.img.torch, 0, 0, 16, 16, tx - 8, 56, 16, 16);
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(tx - 1, 54 + (f % 6 < 3 ? 0 : 1), 2, 3);
  }
  // --- floor: scanline projection of the top-down plane
  const w = (src ??= document.createElement('canvas'));
  w.width = 1024;
  w.height = 1024;
  const sc = w.getContext('2d')!;
  sc.imageSmoothingEnabled = false;
  sc.drawImage(getFloor(A), 0, 0);
  // ring
  SLOTS.forEach(([c, r], i) => {
    const p = slotXY(c, r);
    const filled = f >= landFrame(i);
    sc.drawImage(A.img.frameTop, 0, 0, 16, 16, p.x - TILE / 2, p.y - TILE / 2, TILE, TILE);
    shade(sc, p.x - TILE / 2, p.y - TILE / 2, TILE, 2, '#ffffff', 0.18);
    if (filled) {
      sc.drawImage(A.img.frameEye, 0, 0, 16, 16, p.x - TILE / 2, p.y - TILE / 2, TILE, TILE);
      const u = f - landFrame(i);
      if (u < 14) {
        sc.globalCompositeOperation = 'lighter';
        glow(sc, p.x, p.y, 26 + u * 2, '#6dff9a', 0.7 * (1 - u / 14));
        sc.globalCompositeOperation = 'source-over';
      }
    }
  });
  // portal surface
  if (show) {
    const g = EASE.out(clamp01((f - FULL_AT) / 26));
    const half = 1.5 * TILE * g;
    if (half > 1) {
      sc.save();
      sc.beginPath();
      sc.rect(CX - half, CY - half, half * 2, half * 2);
      sc.clip();
      sc.fillStyle = '#01020a';
      sc.fillRect(CX - 60, CY - 60, 120, 120);
      sc.globalCompositeOperation = 'lighter';
      const layers: [string, number, number, number][] = [
        ['#1fb8a8', 0.22, 0.35, 0.2],
        ['#4a3cff', 0.22, -0.28, 0.33],
        ['#9a3cd8', 0.18, 0.22, -0.4],
      ];
      layers.forEach(([col, a, vx, vy]) => {
        sc.globalAlpha = a;
        const t = document.createElement('canvas');
        t.width = 128;
        t.height = 128;
        const tc = t.getContext('2d')!;
        tc.drawImage(A.img.endsky, 0, 0);
        tc.globalCompositeOperation = 'multiply';
        tc.fillStyle = col;
        tc.fillRect(0, 0, 128, 128);
        const ox = mod(f * vx * 2, 128);
        const oy = mod(f * vy * 2, 128);
        sc.drawImage(t, CX - 64 - ox, CY - 64 - oy);
        sc.drawImage(t, CX - 64 - ox + 128, CY - 64 - oy);
        sc.drawImage(t, CX - 64 - ox, CY - 64 - oy + 128);
        sc.drawImage(t, CX - 64 - ox + 128, CY - 64 - oy + 128);
      });
      // stars in three depths
      for (let L = 0; L < 3; L++) {
        const r = mulberry32(60 + L);
        for (let i = 0; i < 46; i++) {
          const x = mod(r() * 112 + f * (0.25 + L * 0.35) * (L % 2 ? -1 : 1), 112);
          const y = mod(r() * 112 + f * (0.18 + L * 0.3), 112);
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / 7 + i));
          sc.globalAlpha = tw * (0.5 + L * 0.25);
          sc.fillStyle = ['#aef6ff', '#d9c8ff', '#ffffff'][L];
          const sz = 1 + L;
          sc.fillRect(Math.round(CX - 56 + x), Math.round(CY - 56 + y), sz, sz);
        }
      }
      sc.globalAlpha = 1;
      sc.globalCompositeOperation = 'source-over';
      sc.restore();
      sc.globalCompositeOperation = 'lighter';
      glow(sc, CX, CY, 90, '#6a5cff', 0.4 * g);
      sc.globalCompositeOperation = 'source-over';
    }
  }
  ctx.imageSmoothingEnabled = false;
  for (let y = 126; y < H; y++) {
    const d = y - HY;
    const half = (240 * HH) / d;
    const sy = CY + ZC - K / d;
    ctx.drawImage(w, CX - half, sy, half * 2, 1, 0, y, W, 1);
  }
  // fog on the far floor + darkness at the top edge of the floor
  for (let y = 126; y < 190; y++) shade(ctx, 0, y, W, 1, '#02030a', 0.9 * (1 - (y - 126) / 64));
  // near shadow
  for (let y = 236; y < H; y++) shade(ctx, 0, y, W, 1, '#000000', 0.5 * ((y - 236) / (H - 236)));
};

/** Screen-space bits: flying eyes, pulses, beam, motes. */
const drawFx = (ctx: CanvasRenderingContext2D, A: DimAssets, f: number) => {
  // flying eyes
  SLOTS.forEach(([c, r], i) => {
    const t0 = FIRST + i * GAP;
    const u = (f - t0) / 12;
    if (u < 0 || u > 1) return;
    const p = slotXY(c, r);
    const target = proj(p.x, p.y);
    const sx = 240 + (i % 2 ? 60 : -60);
    const sy = 292;
    const e = EASE.inOut(u);
    const x = lerp(sx, target.x, e);
    const y = lerp(sy, target.y, e) - 70 * Math.sin(Math.PI * u);
    const sz = Math.round(lerp(26, 16 * target.s * 1.2, e));
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, 26, '#6dff9a', 0.7);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(A.img.enderEye, 0, 0, 16, 16, Math.round(x - sz / 2), Math.round(y - sz / 2), sz, sz);
    // trail
    for (let k = 1; k < 9; k++) {
      const uu = Math.max(0, u - k * 0.03);
      const ee = EASE.inOut(uu);
      const xx = lerp(sx, target.x, ee);
      const yy = lerp(sy, target.y, ee) - 70 * Math.sin(Math.PI * uu);
      ctx.fillStyle = hexA('#9dffb8', 1 - k / 9);
      ctx.fillRect(Math.round(xx), Math.round(yy), 2, 2);
    }
  });
  // landing pulses in screen space
  SLOTS.forEach(([c, r], i) => {
    const u = f - landFrame(i);
    if (u < 0 || u > 16) return;
    const p = slotXY(c, r);
    const t = proj(p.x, p.y);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, t.x, t.y - 4, 30, '#6dff9a', 0.5 * (1 - u / 16));
    ctx.globalCompositeOperation = 'source-over';
    pixelCross(ctx, t.x, t.y - 6, u / 16, {size: 16, color: '#9dffb8', seed: i + 1});
    const m = mulberry32(900 + i);
    for (let k = 0; k < 14; k++) {
      const a = m() * Math.PI * 2;
      const v = 8 + m() * 22;
      ctx.fillStyle = k % 3 ? '#9dffb8' : '#ffffff';
      ctx.globalAlpha = 1 - u / 16;
      ctx.fillRect(Math.round(t.x + Math.cos(a) * v * (u / 16)), Math.round(t.y - 6 - Math.abs(Math.sin(a)) * v * (u / 16) * 1.4), 2, 2);
    }
    ctx.globalAlpha = 1;
  });
  // beam of light + ring on activation
  if (f >= FULL_AT) {
    const u = f - FULL_AT;
    const c = proj(CX, CY);
    const a = smooth(0, 14, u) * (0.6 + 0.4 * Math.sin(u / 4));
    const bw = 44 + 10 * Math.sin(u / 5);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      const ww = bw * (1 - k * 0.22);
      ctx.fillStyle = hexA(['#3a2cff', '#6a5cff', '#b0a8ff', '#ffffff'][k], a * (0.3 + k * 0.17));
      ctx.fillRect(Math.round(c.x - ww / 2), 0, Math.round(ww), Math.round(c.y));
    }
    glow(ctx, c.x, c.y, 130, '#6a5cff', 0.6 * a);
    ctx.globalCompositeOperation = 'source-over';
    motes(ctx, {seed: 71, count: 70, f, area: [c.x - 50, 0, 100, c.y], vx: 0, vy: -0.9, colors: ['#ffffff', '#b0a8ff', '#6dff9a', '#c34cff'], size: [1, 2], wobble: 6});
  }
};

const Counter: FC<{f: number; label: (n: number) => string}> = ({f, label}) => {
  const n = SLOTS.filter((_, i) => f >= landFrame(i)).length;
  const k = prog(f, 4, 10, EASE.out);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: k * (1 - smooth(FULL_AT + 20, FULL_AT + 34, f)), transform: `translateY(${(1 - k) * -40}px)`}}>
      <OreChip color={ORE.text} dot="#6dff9a">
        {label(n)}
      </OreChip>
      <div style={{display: 'flex', gap: 10}}>
        {SLOTS.map((_, i) => {
          const on = f >= landFrame(i);
          const pop = on ? 1 + 0.5 * Math.max(0, 1 - (f - landFrame(i)) / 8) : 1;
          return <Img key={i} src={item('ender_eye')} style={{width: 56, height: 56, imageRendering: 'pixelated', opacity: on ? 1 : 0.25, filter: on ? 'none' : 'grayscale(1)', transform: `scale(${pop})`}} />;
        })}
      </div>
    </div>
  );
};

/** Props of EndPortalActivate. Without `bg` only the eyes, light, pillar, counter and title are drawn on transparent. */
export type EndPortalActivateProps = {
  /** true = dark stronghold room behind (default off). */
  bg?: boolean;
  /** Title characters (one drops in per character). */
  title?: string;
  /** Spaced English line. */
  sub?: string;
  /** One-line description. */
  desc?: string;
  /** Chip above the title. */
  chip?: string;
  /** Counter chip text from the number of eyes placed (0..12). */
  counter?: (n: number) => string;
};

export const EndPortalActivate: FC<EndPortalActivateProps> = ({bg, title = '末地传送门', sub = 'END PORTAL ACTIVATED', desc = '十二只末影之眼，唤醒了虚空', chip = 'STRONGHOLD · 要塞', counter = (n) => `末影之眼 · ${n} / 12`}) => {
  const f = useCurrentFrame();
  const A = useDim();
  const lastShake = SLOTS.reduce((m, _, i) => (f >= landFrame(i) && f < landFrame(i) + 5 ? Math.max(m, 7 * (1 - (f - landFrame(i)) / 5)) : m), 0);
  const act = f >= FULL_AT && f < FULL_AT + 14 ? 22 * (1 - (f - FULL_AT) / 14) : 0;
  const shk = lastShake + act;
  const rs = mulberry32(2222 + f);
  const sx = (rs() * 2 - 1) * shk;
  const sy = (rs() * 2 - 1) * shk;
  const zoom = 1 + 0.02 * prog(f, 0, FULL_AT, (t) => t) + 0.1 * EASE.out(clamp01((f - FULL_AT) / 60));
  const bars = prog(f, 120, 14, EASE.inOut) * (1 - prog(f, T - 14, 14, EASE.inOut));
  const green = SLOTS.reduce((m, _, i) => Math.max(m, f >= landFrame(i) && f < landFrame(i) + 10 ? 1 - (f - landFrame(i)) / 10 : 0), 0);
  const c = proj(CX, CY);
  return (
    <AbsoluteFill style={{background: bg ? '#02030a' : undefined, overflow: 'hidden'}}>
      <Cam zoom={zoom} fx={960} fy={820} dx={sx} dy={sy}>
        <LowRes
          ready={!!A}
          draw={(ctx) => {
            if (!A) return;
            if (bg) drawRoom(ctx, A, f, true);
            drawFx(ctx, A, f);
          }}
        />
      </Cam>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 70%, rgba(109,255,154,${0.18 * green}) 0%, rgba(0,0,0,0) 60%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,6,0.8) 100%)'}} />
      <Counter f={f} label={counter} />
      <Letterbox k={bars} size={96} />
      <Flash at={FULL_AT} life={12} color="#c8c0ff" peak={0.8} />
      <Sequence from={FULL_AT} durationInFrames={50}>
        <Shockwave x={960} y={c.y * 4} at={0} color="#b0a8ff" maxR={1200} life={26} width={34} />
        <PixelBurst x={960} y={c.y * 4} at={0} count={80} colors={['#ffffff', '#b0a8ff', '#6dff9a', '#c34cff']} speed={34} life={44} size={14} gravity={-0.1} seed={5} />
      </Sequence>
      <Sequence from={134} durationInFrames={T - 134}>
        <DimTitle title={title} sub={sub} desc={desc} chip={chip} tone="end" accent="#b0a8ff" iconA={blockUrl('end_portal_frame_top')} iconB={blockUrl('purpur_block')} total={T - 134} size={192} />
      </Sequence>
      {SLOTS.map((_, i) => (
        <span key={i}>
          <Sfx at={landFrame(i)} src={mcSound('random/click')} volume={0.4} rate={0.7 + i * 0.05} />
          <Sfx at={landFrame(i)} src={mcSound('random/orb')} volume={0.22} rate={0.8 + i * 0.06} />
          <Sfx at={landFrame(i)} src={mcSound('dig/stone1')} volume={0.25} rate={0.6} />
        </span>
      ))}
      <Sfx at={FULL_AT} src={mcSound('random/explode2')} volume={0.3} rate={0.6} />
      <Sfx at={FULL_AT + 3} src={mcSound('ambient/weather/thunder1')} volume={0.25} rate={0.7} />
      <Sfx at={FULL_AT + 12} src={mcSound('random/levelup')} volume={0.35} rate={0.8} />
    </AbsoluteFill>
  );
};

export const portalEntries: FxEntry[] = [
  {
    meta: {
      id: 'dim-end-portal-activate',
      name: '末地传送门激活（加送）',
      category: 'map',
      tags: ['末地', '传送门', '末影之眼', '要塞'],
      frames: T,
      blurb: '昏暗要塞里，十二只末影之眼依次飞入地面的传送门框架，每次落下都绿光闪动、房间轻震；集齐后中心展开星空虚空，光柱冲天，“末地传送门”大标题砸下。',
      usage: '讲解/演示激活末地传送门、进入末地前的铺垫。',
      params: [{name: 'bg', desc: 'true 为完整演示（含要塞房间）；省略则只输出眼睛飞入、光效、光柱、计数条与标题'}, {name: 'FIRST / GAP', desc: '第一只眼睛出发的帧与间隔（源码常量）'}],
    },
    Demo: () => <EndPortalActivate bg />,
    Layer: () => <EndPortalActivate />,
  },
];

