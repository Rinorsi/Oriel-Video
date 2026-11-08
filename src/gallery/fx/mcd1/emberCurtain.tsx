// mcd-t-ember-curtain: the Nether ash curtain. A wall of rising embers and ash (24px voxel cells, dark ash on top, crimson, orange, white-gold at the hot
//   trailing edge) climbs the frame from the bottom, covers it completely (cut to B inside the wall), and carries on up and out, leaving B behind.
//   Sparks stream ahead of and behind the wall; both shots take a heat tint while the wall is on them.
//   Layer = the wall + sparks (opaque while covering).   Props: CELL (24), TH (wall thickness, 1500px).
import {useLayoutEffect, useRef, type FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {FULL, hash, lerp, mEntry, plate, ss, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 66;
const CELL = 24;
const TH = 1560; // wall thickness
const COLS = 1920 / CELL;
const ROWS = 1080 / CELL;

const centreY = (t: number) => lerp(1080 + TH / 2 + 40, -TH / 2 - 120, 0.35 * clamp01(t / T) + 0.65 * EASE.inOut(clamp01(t / T)));

const ASH = ['#241A1E', '#33242A', '#46323A'];
const RED = ['#6E1216', '#8F1E1E', '#B02A1E'];
const ORANGE = ['#C4361E', '#E04927', '#F74F22', '#FF7A2A'];
const GOLD = ['#FF9A2E', '#FDB52F', '#FDD334', '#FFE98A'];

const drawWall = (ctx: CanvasRenderingContext2D, t: number) => {
  ctx.clearRect(0, 0, 1920, 1080);
  const c = centreY(t);
  const lead = c - TH / 2;
  const trail = c + TH / 2;
  for (let j = 0; j < ROWS; j++) {
    const y = j * CELL + CELL / 2;
    for (let i = 0; i < COLS; i++) {
      const jr = j + Math.floor(t * 0.7); // the pattern climbs
      const n = hash(i, jr, 33);
      const n2 = hash(i + Math.floor(t / 2), jr, 34);
      const wob = Math.sin(i * 0.55 + t * 0.12) * 40 + (n - 0.5) * 220;
      const yl = y - wob;
      if (yl < lead || yl > trail) continue;
      const u = (yl - lead) / TH; // 0 at the leading (top) edge, 1 at the trailing (bottom) edge
      // dither near both edges: thin out into loose embers
      const edge = Math.min(u, 1 - u);
      if (edge < 0.1 && n2 > edge / 0.1 + 0.1) continue;
      const k = u + (n2 - 0.5) * 0.28;
      let col: string;
      if (k < 0.17) col = ASH[Math.floor(n * ASH.length)];
      else if (k < 0.38) col = RED[Math.floor(n2 * RED.length)];
      else if (k < 0.66) col = ORANGE[Math.floor(n * ORANGE.length)];
      else col = GOLD[Math.min(GOLD.length - 1, Math.floor(((k - 0.66) / 0.34) * GOLD.length * (0.6 + n2 * 0.6)))];
      ctx.fillStyle = col;
      ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
      // top-lit row + dark bottom row: voxel feel
      if (n > 0.45) {
        ctx.fillStyle = 'rgba(255,230,160,0.22)';
        ctx.fillRect(i * CELL, j * CELL, CELL, 4);
        ctx.fillStyle = 'rgba(30,0,0,0.25)';
        ctx.fillRect(i * CELL, j * CELL + CELL - 4, CELL, 4);
      }
    }
  }
  // glow around the hot trailing edge
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gy = trail - 140;
  const gr = ctx.createLinearGradient(0, gy - 360, 0, gy + 60);
  gr.addColorStop(0, 'rgba(247,79,34,0)');
  gr.addColorStop(0.7, 'rgba(253,181,47,0.28)');
  gr.addColorStop(1, 'rgba(255,233,138,0.4)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, gy - 360, 1920, 420);
  ctx.restore();
  // sparks: they rise much faster than the wall; long streaks ahead of it, short ones in it
  for (let s = 0; s < 150; s++) {
    const layer = hash(s, 1, 35);
    const x = Math.round((hash(s, 2, 35) * 1960 - 20) / 4) * 4 + Math.round(Math.sin(t * 0.15 + s) * 3) * 4;
    const sp = 14 + layer * 30;
    const off = hash(s, 3, 35) * 2400;
    const yy = 1200 - ((off + t * sp) % 2400) + (c - 540) * 0.35;
    if (yy < -40 || yy > 1120) continue;
    const q = layer > 0.8 ? 12 : layer > 0.4 ? 8 : 6;
    const len = Math.round(q * (1 + layer * 3) / 2) * 2;
    const hot = hash(s, 4, 35);
    ctx.globalAlpha = 0.45 + 0.55 * layer;
    ctx.fillStyle = hot > 0.7 ? '#FFF2A0' : hot > 0.35 ? '#FDB52F' : '#F74F22';
    ctx.fillRect(x, Math.round(yy / 2) * 2, q, len);
  }
  ctx.globalAlpha = 1;
};

const Wall: FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) drawWall(ref.current.getContext('2d')!, t);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{...FULL, width: '100%', height: '100%'}} />;
};

export const EmberOverlay: FC<OverlayProps> = ({f}) => {
  return (
    <AbsoluteFill>
      <Wall t={f} />
    </AbsoluteFill>
  );
};

const EmberScene: FC<SceneProps> = ({f, A, B, p}) => {
  const c = centreY(f);
  const cover = 1 - clamp01(Math.abs(c - 540) / 1100);
  const heat = `sepia(${0.5 * cover}) saturate(${1 + 0.6 * cover}) hue-rotate(${-14 * cover}deg) brightness(${1 - 0.2 * cover})`;
  const cutF = T / 2;
  return (
    <AbsoluteFill>
      {f < cutF && p < 1 && (
        <div style={{...FULL, filter: heat, transform: `translateY(${-20 * ss(0, cutF, f)}px) scale(${1 + 0.03 * ss(0, cutF, f)})`}}>
          <A />
        </div>
      )}
      {f >= cutF && (
        <div style={{...FULL, filter: heat, transform: `translateY(${lerp(30, 0, EASE.out(clamp01((f - cutF) / (T - cutF))))}px) scale(${lerp(1.03, 1, EASE.out(clamp01((f - cutF) / (T - cutF))))})`}}>
          <B />
        </div>
      )}
      {p > 0 && p < 1 && <EmberOverlay p={p} f={f} />}
    </AbsoluteFill>
  );
};

export const emberCurtainDef: MDef = {
  frames: T,
  Scene: EmberScene,
  Overlay: EmberOverlay,
  cues: [
    {at: 0, src: 'mc:fire/ignite', volume: 0.3, rate: 0.9},
    {at: 12, src: 'mc:block/furnace/fire_crackle1', volume: 0.3},
    {at: 34, src: 'mc:block/furnace/fire_crackle1', volume: 0.22, rate: 0.9},
  ],
};

export const emberCurtainPair = {A: plate('forest-day'), B: plate('nether')};

export const emberCurtainEntry = mEntry(
  emberCurtainDef,
  {
    id: 'mcd-t-ember-curtain',
    name: '地下城·下界灰烬幕',
    tags: ['地下城', '转场', '下界', '灰烬', '火星', '红橙'],
    blurb: '灰烬与火星从画面底部密集升起，形成一整面由暗灰、绯红、橙、金白逐层过渡的体素色块幕，幕完全盖住画面时切到 B，再带着火星继续向上升走，留下 B；两个镜头在幕里都被染上热浪色。',
    usage: '进入下界/熔岩/火焰类场景、爆炸后的清场、"炼狱"主题的章节切换。',
    params: [
      {name: 'CELL / TH', desc: '色块大小 24px、幕的厚度 1560px'},
      {name: '调色', desc: 'emberCurtain.tsx 顶部 ASH / RED / ORANGE / GOLD 四组色'},
    ],
  },
  emberCurtainPair.A,
  emberCurtainPair.B,
);
