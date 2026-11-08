// mcd-t-iso-blocks: the frame is built over by isometric voxel columns (real block textures, faces shaded top 1.0 / left 0.78 / right 0.60, bright top
//   edge, dark seams, directional light). They rise out of the ground in a diagonal wave from the bottom-left, land with a white glint and a small
//   shake, hold for a beat, then are taken apart (lift + shrink) in a wave from the top-left, uncovering B.
//   Layer = the blocks only (transparent where there is no block).   Props: W (block width, 192), PALETTE (texture list).
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FxLayer} from '../mcdscene/engine';
import {texCanvas} from '../mcdscene/tex';
import {FULL, hash, mEntry, plate, type MDef, type OverlayProps, type SceneProps} from './common';

const W = 192;
const HZ = W / 2;
const RISE_SPREAD = 20;
const RISE_LEN = 11;
const CUT = 34; // everything is covered
const OUT_SPREAD = 14;
const OUT_LEN = 11;
const T = CUT + 2 + OUT_SPREAD + OUT_LEN;

const PALETTE = [
  ...Array(6).fill('block/deepslate_bricks'),
  ...Array(5).fill('block/stone_bricks'),
  ...Array(4).fill('block/cobblestone'),
  ...Array(3).fill('block/mossy_stone_bricks'),
  ...Array(2).fill('block/mossy_cobblestone'),
  ...Array(3).fill('block/polished_blackstone_bricks'),
  ...Array(2).fill('block/cracked_stone_bricks'),
  ...Array(2).fill('block/coarse_dirt'),
  'block/obsidian',
  'block/gold_block',
  'block/deepslate_tiles',
];
const TEXS = [...new Set(PALETTE)];

type Col = {cx: number; gy: number; h: number; texs: string[]; keyIn: number; keyOut: number; tone: number};

const smooth = (x: number, y: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a0 = hash(xi, yi, seed);
  const b0 = hash(xi + 1, yi, seed);
  const c0 = hash(xi, yi + 1, seed);
  const d0 = hash(xi + 1, yi + 1, seed);
  return a0 + (b0 - a0) * sx + (c0 - a0) * sy + (a0 - b0 - c0 + d0) * sx * sy;
};

const COLS: Col[] = (() => {
  const out: Col[] = [];
  const y0 = -(W / 2) - 2 * HZ;
  for (let s = 0; s <= 35; s++) {
    for (let d = -12; d <= 12; d++) {
      if (((s + d) & 1) !== 0) continue;
      const i = (s + d) / 2;
      const j = (s - d) / 2;
      const cx = 960 + d * (W / 2);
      const gy = y0 + s * (W / 4);
      const h = 1 + Math.min(2, Math.floor(smooth(i / 2.6, j / 2.6, 5) * 3.2));
      const texs = Array.from({length: h}, (_, z) => PALETTE[Math.floor(hash(s, d, 79 + z) * PALETTE.length)]);
      const keyIn = clamp01(0.55 * (cx / 1920) + 0.45 * (1 - gy / 1080) + 0.1 * (hash(s, d, 77) - 0.5));
      const keyOut = clamp01(0.5 * (1 - cx / 1920) + 0.5 * (1 - gy / 1080) + 0.1 * (hash(s, d, 78) - 0.5));
      out.push({cx, gy, h, texs, keyIn, keyOut, tone: (hash(s, d, 80) - 0.5) * 0.16});
    }
  }
  return out;
})();

const poly = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};

const outBack = (u: number) => {
  const c1 = 1.1;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

/** One cube whose top-face apex is (cx, cy). Faces: top 1.0, left 0.78, right 0.60. */
const drawCube = (ctx: CanvasRenderingContext2D, texName: string, cx: number, cy: number, tone: number, topFace: boolean, glint: number) => {
  const img = texCanvas(texName);
  const S = 16;
  const k = 0.5;
  ctx.save();
  ctx.save();
  ctx.transform(W / 2 / S, W / 4 / S, -W / 2 / S, W / 4 / S, cx, cy);
  ctx.drawImage(img, 0, 0, S, S, -k / S, -k / S, S + (2 * k) / S, S + (2 * k) / S);
  ctx.restore();
  ctx.save();
  ctx.transform(W / 2 / S, W / 4 / S, 0, HZ / S, cx - W / 2, cy + W / 4);
  ctx.drawImage(img, 0, 0, S, S, 0, -k / S, S + k / S, S + (2 * k) / S);
  ctx.restore();
  ctx.save();
  ctx.transform(W / 2 / S, -W / 4 / S, 0, HZ / S, cx, cy + W / 2);
  ctx.drawImage(img, 0, 0, S, S, 0, -k / S, S + k / S, S + (2 * k) / S);
  ctx.restore();

  const T0: [number, number] = [cx, cy];
  const R0: [number, number] = [cx + W / 2, cy + W / 4];
  const B0: [number, number] = [cx, cy + W / 2];
  const L0: [number, number] = [cx - W / 2, cy + W / 4];
  const down = (p: [number, number]): [number, number] => [p[0], p[1] + HZ];
  ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.22 - tone * 1.4).toFixed(3)})`;
  poly(ctx, [L0, B0, down(B0), down(L0)]);
  ctx.fill();
  ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.4 - tone * 1.4).toFixed(3)})`;
  poly(ctx, [B0, R0, down(R0), down(B0)]);
  ctx.fill();
  if (topFace) {
    ctx.fillStyle = tone > 0 ? `rgba(255,255,255,${(tone * 0.5).toFixed(3)})` : `rgba(0,0,0,${(-tone * 0.6).toFixed(3)})`;
    poly(ctx, [T0, R0, B0, L0]);
    ctx.fill();
  }
  const ao = ctx.createLinearGradient(0, cy + W / 4, 0, cy + W / 2 + HZ);
  ao.addColorStop(0, 'rgba(0,0,0,0)');
  ao.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = ao;
  poly(ctx, [L0, B0, R0, down(R0), down(B0), down(L0)]);
  ctx.fill();
  ctx.lineJoin = 'miter';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.beginPath();
  ctx.moveTo(L0[0], L0[1]);
  ctx.lineTo(T0[0], T0[1]);
  ctx.lineTo(R0[0], R0[1]);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(L0[0], L0[1]);
  ctx.lineTo(B0[0], B0[1]);
  ctx.lineTo(R0[0], R0[1]);
  ctx.moveTo(B0[0], B0[1]);
  ctx.lineTo(B0[0], B0[1] + HZ);
  ctx.stroke();
  if (glint > 0 && topFace) {
    ctx.fillStyle = `rgba(255,248,214,${(0.45 * glint).toFixed(3)})`;
    poly(ctx, [T0, R0, B0, L0]);
    ctx.fill();
  }
  ctx.restore();
};

const drawColumn = (ctx: CanvasRenderingContext2D, c: Col, dy: number, glint: number) => {
  for (let z = 0; z < c.h; z++) drawCube(ctx, c.texs[z], c.cx, c.gy + dy - (z + 1) * HZ, c.tone, z === c.h - 1, glint);
};

const drawBlocks = (ctx: CanvasRenderingContext2D, t: number) => {
  ctx.imageSmoothingEnabled = false;
  const landing = RISE_SPREAD + RISE_LEN;
  const shake = t > landing - 5 && t < CUT + 2 ? (hash(t, 3) - 0.5) * 7 * Math.max(0, 1 - Math.abs(t - landing) / 6) : 0;
  ctx.save();
  ctx.translate(0, shake);
  for (const c of COLS) {
    const a = c.keyIn * RISE_SPREAD;
    const uIn = (t - a) / RISE_LEN;
    const out0 = CUT + 2 + (1 - c.keyOut) * OUT_SPREAD;
    const uOut = (t - out0) / OUT_LEN;
    if (uIn <= 0 || uOut >= 1) continue;
    if (uOut > 0) {
      // taken apart: a small hop, then the column drops back into the ground
      const u = clamp01(uOut);
      const D = c.h * HZ + W / 2 + 16;
      const hop = -16 * Math.sin(Math.min(1, u * 3.2) * Math.PI);
      const sink = D * (u * u * (3 - 2 * u));
      const Lx = c.cx - W / 2;
      const Rx = c.cx + W / 2;
      ctx.save();
      poly(ctx, [
        [Lx - 2, -900],
        [Rx + 2, -900],
        [Rx + 2, c.gy + W / 4],
        [c.cx, c.gy + W / 2],
        [Lx - 2, c.gy + W / 4],
      ]);
      ctx.clip();
      drawColumn(ctx, c, sink + hop, 0);
      ctx.restore();
      continue;
    }
    const e = outBack(clamp01(uIn));
    const D = c.h * HZ + W / 2 + 16;
    const sink = D * (1 - e);
    const glint = uIn >= 1 ? Math.max(0, 1 - ((uIn - 1) * RISE_LEN) / 5) : 0;
    if (sink > 0.5) {
      // the part still below the ground is hidden: clip to everything above the front edges of the column's ground diamond
      const Lx = c.cx - W / 2;
      const Rx = c.cx + W / 2;
      ctx.save();
      poly(ctx, [
        [Lx - 2, -900],
        [Rx + 2, -900],
        [Rx + 2, c.gy + W / 4],
        [c.cx, c.gy + W / 2],
        [Lx - 2, c.gy + W / 4],
      ]);
      ctx.clip();
      drawColumn(ctx, c, sink, 0);
      ctx.restore();
    } else {
      drawColumn(ctx, c, sink, glint);
    }
  }
  ctx.restore();
  // light from the top-left, falling off to the bottom-right (only where there are blocks)
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, 'rgba(255,214,150,0.16)');
  g.addColorStop(0.55, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,6,20,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalCompositeOperation = 'source-over';
};

export const IsoOverlay: FC<OverlayProps> = ({f}) => <FxLayer textures={TEXS} loop={200} draw={(ctx) => drawBlocks(ctx, f)} />;

const IsoScene: FC<SceneProps> = ({f, A, B, p}) => (
  <AbsoluteFill>
    {f < CUT && p < 1 && (
      <div style={FULL}>
        <A />
      </div>
    )}
    {f >= CUT && (
      <div style={FULL}>
        <B />
      </div>
    )}
    {p > 0 && p < 1 && <IsoOverlay p={p} f={f} />}
  </AbsoluteFill>
);

export const isoBlocksDef: MDef = {
  frames: T,
  Scene: IsoScene,
  Overlay: IsoOverlay,
  cues: [
    {at: 2, src: 'mc:dig/stone1', volume: 0.2, rate: 0.9},
    {at: 8, src: 'mc:dig/stone3', volume: 0.22, rate: 0.8},
    {at: 14, src: 'mc:dig/stone2', volume: 0.24, rate: 0.7},
    {at: 22, src: 'mc:dig/stone4', volume: 0.26, rate: 0.7},
    {at: CUT + 8, src: 'mc:dig/gravel1', volume: 0.2, rate: 0.9},
    {at: CUT + 16, src: 'mc:dig/stone2', volume: 0.18, rate: 1.1},
  ],
};

export const isoBlocksPair = {A: plate('end'), B: plate('forest-day')};

export const isoBlocksEntry = mEntry(
  isoBlocksDef,
  {
    id: 'mcd-t-iso-blocks',
    name: '地下城·等距方块升起',
    tags: ['地下城', '转场', '体素', '等距方块', '方块贴图'],
    blurb: '一根根等距体素方块柱（深板岩砖/石砖/圆石/黑曜石，带顶 1.0·左 0.78·右 0.60 的面明暗与顶边亮线）从地面升起，沿对角线铺满画面，落地时闪一下并轻震；停顿后再从另一个对角被拆去，露出 B。',
    usage: '章节/场景切换、"搭建/建造"主题的衔接、模组方块类视频；Layer 导出后可叠在任何素材上。',
    params: [
      {name: 'W', desc: '方块宽度（默认 192px；越小方块越密、绘制越多）'},
      {name: 'PALETTE', desc: '方块贴图名单，可换成自己想要的方块'},
      {name: 'RISE_SPREAD / CUT / OUT_SPREAD', desc: '升起波次长度、全覆盖切换帧、拆除波次长度'},
    ],
  },
  isoBlocksPair.A,
  isoBlocksPair.B,
);
