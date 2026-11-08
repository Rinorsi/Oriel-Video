import type {FC} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Flash, LightRays, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {glow} from '../../../mg/Graphic';
import {LowRes} from '../../../mg/LowRes';
import {Letterbox, Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import type {FxEntry} from '../../types';
import {Cam, H, W, dissolve, hash, lerp, mod, motes, smooth, useWarp, vortex, blockUrl} from './kit';
import {EndCanvas, NetherCanvas, OverworldCanvas, sunPos} from './scenes';
import {DimTitle} from './titles';

/**
 * Dimension changes:
 *   dim-overworld-to-nether : portal suction (zoom + warp + pixel vortex) -> purple pixel-dissolve -> Nether landing, red vignette, ash, title "下界"
 *   dim-nether-to-end       : screen cracks (white/purple fracture), tears in two and falls away, End void pours out, title "末地"
 *   dim-to-overworld        : dark void -> eyelid of light opens -> sunrise, sky blue, grass and clouds, title "主世界"
 * Each is `<X bg />` for the full demo and `<X />` for the transparent layer (only the transition graphics, no world plates).
 */

const Px: FC<{draw: (ctx: CanvasRenderingContext2D) => void}> = ({draw}) => <LowRes ready draw={draw} />;
/** Optional texts of the dimension title card plus the two shots (used when `bg` is true; default = the demo world canvases). */
export type DimCrossProps = {
  /** true = also draw the footage (A before the switch, B after); false = transparent overlay only (portal graphics, vignette, title). */
  bg?: boolean;
  /** Outgoing footage (needs bg). Default: the demo canvas of the source dimension. */
  A?: FC;
  /** Incoming footage (needs bg). Default: the demo canvas of the target dimension. */
  B?: FC;
  /** Big title characters (one drops in per character). */
  title?: string;
  /** Spaced English line. */
  sub?: string;
  /** One-line description. */
  desc?: string;
  /** Chip above the title. */
  chip?: string;
};

const PURPLES = ['#4a1a9a', '#5a22b8', '#6a2cd0', '#3c1480', '#7a3ae8'];

// ================================================================ 1. overworld -> nether

export const T1 = 210;
export const SWAP1 = 84;
const FX1 = {x: 240, y: 120}; // portal centre in units

export const OverToNether: FC<DimCrossProps> = ({bg, A, B, title = '下界', sub = 'THE NETHER', desc = '岩浆与灰烬的炽热世界', chip = 'DIMENSION · 维度'}) => {
  const f = useCurrentFrame();
  const k = smooth(28, 76, f);
  const warp = useWarp(f, 26 * k * (1 - smooth(76, 84, f)), 0.006);
  const zoomA = f < 24 ? 1 + 0.12 * (f / 24) : 1.12 * Math.pow(11 / 1.12, EASE.in(clamp01((f - 24) / 58)));
  const tZ = EASE.out(clamp01((f - SWAP1) / 40));
  const zoomB = lerp(1.7, 1.0, tZ) + 0.03 * prog(f, 124, 86, (t) => t);
  const shakeK = f >= SWAP1 + 2 && f < SWAP1 + 28 ? 26 * (1 - (f - SWAP1 - 2) / 26) : 0;
  const rs = mulberry32(3000 + f);
  const sx = (rs() * 2 - 1) * shakeK;
  const sy = (rs() * 2 - 1) * shakeK;
  const heatFlash = 1 - smooth(SWAP1, SWAP1 + 24, f);
  const bars = prog(f, 110, 14, EASE.inOut) * (1 - prog(f, T1 - 14, 14, EASE.inOut));
  const redV = smooth(92, 116, f) * (0.82 + 0.18 * Math.sin(f / 8));

  return (
    <AbsoluteFill style={{background: bg ? '#000' : undefined, overflow: 'hidden'}}>
      {warp.node}
      {bg && f < SWAP1 && (
        <Cam zoom={zoomA} fx={960} fy={480} rot={Math.sin(f / 5) * 1.8 * k} style={{filter: `${warp.filter ?? ''} hue-rotate(${k * 36}deg) saturate(${1 + k * 0.6})`.trim()}}>
          {A ? <A /> : <OverworldCanvas tod={0.2} portal={{x: 240}} frame />}
        </Cam>
      )}
      {bg && f >= SWAP1 && (
        <Cam zoom={zoomB} fx={960} fy={760} dx={sx} dy={sy} style={{filter: `brightness(${1 + 0.9 * heatFlash}) saturate(${1 + 0.4 * heatFlash})`}}>
          {B ? <B /> : <NetherCanvas />}
        </Cam>
      )}
      {/* purple haze that builds while the portal inhales */}
      {f < SWAP1 && <AbsoluteFill style={{background: 'rgb(120,40,220)', opacity: 0.5 * k, mixBlendMode: 'screen'}} />}
      {/* vortex, streaks and the pixel cover / reveal */}
      <Px
        draw={(ctx) => {
          if (f < SWAP1 + 2) {
            // cover: pixel dissolve spreading from the portal, then the vortex arms spinning on top of it
            dissolve(ctx, smooth(52, 80, f), PURPLES, {cell: 6, radial: 0.85, cx: FX1.x, cy: FX1.y});
            if (f >= 36) {
              const t = clamp01((f - 36) / 48);
              const R = lerp(24, 380, EASE.in(t));
              const spin = f * 0.2 + Math.pow(Math.max(0, f - 36), 2) * 0.0045;
              const a = smooth(36, 46, f);
              vortex(ctx, FX1.x, FX1.y, R, spin, 5, ['#e9c4ff', '#b46bff', '#ffffff', '#d9a0ff', '#8a3cf0'], {alpha: a, twist: 0.045, dots: 260, thick: 2.3});
              vortex(ctx, FX1.x, FX1.y, R * 0.6, -spin * 1.4, 3, ['#ffffff', '#e9c4ff'], {alpha: a * 0.9, twist: 0.08, dots: 160, thick: 1.8});
            }
            if (f >= 30) {
              // streaks pulled towards the portal
              const r = mulberry32(88);
              for (let i = 0; i < 90; i++) {
                const ang = r() * Math.PI * 2;
                const ph = r();
                const u = mod((f - 30) / 40 + ph, 1);
                const d = Math.pow(1 - u, 1.8) * (60 + 360 * r());
                ctx.fillStyle = ['#e9a8ff', '#ffffff', '#b46bff', '#d9a0ff'][i % 4];
                ctx.globalAlpha = 0.9 * smooth(30, 44, f);
                for (let s2 = 0; s2 < 4; s2++) {
                  const dd = d + s2 * (3 + (1 - u) * 14);
                  ctx.fillRect(Math.round(FX1.x + Math.cos(ang) * dd), Math.round(FX1.y + Math.sin(ang) * dd * 0.9), 2, 2);
                }
              }
              ctx.globalAlpha = 1;
            }
          } else {
            dissolve(ctx, 1 - smooth(SWAP1 + 2, SWAP1 + 26, f), PURPLES, {cell: 6, radial: 0.8, cx: 240, cy: 140, invert: true});
          }
        }}
      />
      <Flash at={SWAP1 - 1} life={10} color="#d8b0ff" peak={0.85} />
      {f >= SWAP1 + 2 && <PixelBurst x={960} y={600} at={SWAP1 + 2} count={70} colors={['#e9c4ff', '#b46bff', '#ffffff', '#ff9a3a']} speed={34} life={42} size={16} gravity={0.5} seed={9} />}
      {f >= SWAP1 + 2 && <Shockwave x={960} y={600} at={SWAP1 + 2} color="#d9a0ff" maxR={900} life={26} width={30} />}
      {/* red vignette */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(120,0,0,0) 38%, rgba(150,10,0,${0.75 * redV}) 82%, rgba(60,0,0,${0.9 * redV}) 100%)`}} />
      <Vignette s={0.25 * smooth(100, 130, f)} color="40,0,0" />
      <Letterbox k={bars} size={96} />
      <Sequence from={118} durationInFrames={T1 - 118}>
        <DimTitle title={title} sub={sub} desc={desc} chip={chip} tone="nether" accent="#ff7a2a" iconA={blockUrl('netherrack')} iconB={blockUrl('glowstone')} total={T1 - 118} />
      </Sequence>
      <Sfx at={38} src={mcSound('ambient/weather/thunder1')} volume={0.22} rate={0.5} />
      <Sfx at={SWAP1} src={mcSound('random/explode3')} volume={0.3} rate={0.7} />
      <Sfx at={SWAP1 + 8} src={mcSound('block/furnace/fire_crackle1')} volume={0.4} />
      <Sfx at={SWAP1 + 14} src={mcSound('fire/ignite')} volume={0.3} rate={0.8} />
    </AbsoluteFill>
  );
};

// ================================================================ 2. nether -> end

export const T2 = 204;
export const TEAR = 64;

const CRACK = Array.from({length: 16}, (_, i) => ({x: 960 + (hash(5, i) - 0.5) * 230 * (i === 7 || i === 8 ? 0.3 : 1), y: i * 72}));
const polyPts = (pts: {x: number; y: number}[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const LEFT_CLIP = `polygon(0px 0px, ${CRACK.map((p) => `${p.x.toFixed(1)}px ${p.y}px`).join(', ')}, 0px 1080px)`;
const RIGHT_CLIP = `polygon(${CRACK.map((p) => `${p.x.toFixed(1)}px ${p.y}px`).join(', ')}, 1920px 1080px, 1920px 0px)`;
/** Partial crack: grows from the middle towards the top and bottom edges. */
const crackArms = (g: number) => {
  const mid = { x: (CRACK[7].x + CRACK[8].x) / 2, y: 540 };
  const arm = (list: {x: number; y: number}[]) => {
    const n = list.length;
    const reach = g * n;
    const out = [mid];
    for (let i = 0; i < n; i++) {
      if (reach >= i + 1) out.push(list[i]);
      else {
        const prev = out[out.length - 1];
        const t = clamp01(reach - i);
        out.push({x: lerp(prev.x, list[i].x, t), y: lerp(prev.y, list[i].y, t)});
        break;
      }
    }
    return out;
  };
  return [arm(CRACK.slice(0, 8).reverse()), arm(CRACK.slice(8))];
};
const BRANCHES = [
  [{x: 0, y: 0}, {x: -80, y: -30}, {x: -150, y: -10}, {x: -220, y: -60}],
  [{x: 0, y: 0}, {x: 90, y: 26}, {x: 140, y: 80}, {x: 230, y: 70}],
  [{x: 0, y: 0}, {x: -60, y: 40}, {x: -90, y: 110}],
  [{x: 0, y: 0}, {x: 70, y: -40}, {x: 160, y: -50}],
];

const Shards: FC<{at: number; x: number; y: number; colors: string[]; count?: number; seed?: number}> = ({at, x, y, colors, count = 34, seed = 5}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 60) return null;
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const ang = r() * Math.PI * 2;
        const v = 10 + r() * 34;
        const size = 14 + Math.floor(r() * 5) * 8;
        const rot0 = r() * 360;
        const spin = (r() - 0.5) * 30;
        const c = colors[i % colors.length];
        const drag = (1 - Math.pow(0.93, f)) / 0.07;
        const px = x + Math.cos(ang) * v * drag;
        const py = y + Math.sin(ang) * v * drag * 0.8 + 0.5 * 0.9 * f * f;
        const life = 38 + r() * 22;
        if (f > life) return null;
        return <div key={i} style={{position: 'absolute', left: px - size / 2, top: py - size / 2, width: size, height: size, background: c, border: '4px solid rgba(0,0,0,0.65)', transform: `rotate(${rot0 + spin * f}deg)`, opacity: 1 - Math.pow(f / life, 3), boxShadow: 'inset 0 6px 0 rgba(255,255,255,0.25)'}} />;
      })}
    </>
  );
};

export const NetherToEnd: FC<DimCrossProps> = ({bg, A, B, title = '末地', sub = 'THE END', desc = '龙与虚空的尽头', chip = 'DIMENSION · 维度'}) => {
  const f = useCurrentFrame();
  const g = EASE.inOut(smooth(16, 60, f));
  const o = f < TEAR ? 0 : EASE.inOut(clamp01((f - TEAR) / 46));
  const e = 1250 * o;
  const quake = f < TEAR ? 2 + 20 * smooth(14, TEAR, f) : 24 * (1 - smooth(TEAR, TEAR + 30, f));
  const rs = mulberry32(4000 + f);
  const sx = (rs() * 2 - 1) * quake;
  const sy = (rs() * 2 - 1) * quake;
  const flicker = f % 4 < 2 ? 1 : 0.7;
  const zEnd = lerp(1.45, 1.0, EASE.out(clamp01((f - TEAR) / 60)));
  const arms = crackArms(g);
  const bars = prog(f, 110, 14, EASE.inOut) * (1 - prog(f, T2 - 14, 14, EASE.inOut));
  const hot = (side: -1 | 1) => (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <polyline points={polyPts(CRACK)} fill="none" stroke="#150303" strokeWidth={16} strokeLinejoin="miter" transform={`translate(${side * 6},0)`} />
      <polyline points={polyPts(CRACK)} fill="none" stroke="#ff8a2a" strokeWidth={6} strokeLinejoin="miter" transform={`translate(${side * 2},0)`} />
      <polyline points={polyPts(CRACK)} fill="none" stroke="#ffe9a8" strokeWidth={2} strokeLinejoin="miter" />
    </svg>
  );
  const half = (side: -1 | 1) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        clipPath: side < 0 ? LEFT_CLIP : RIGHT_CLIP,
        transformOrigin: '960px 540px',
        transform: `translate(${side * e + sx}px, ${(side < 0 ? 1 : -0.35) * e * 0.28 + sy}px) rotate(${side * o * (side < 0 ? 16 : 10)}deg)`,
        filter: `brightness(${1 - 0.55 * o}) saturate(${1 - 0.3 * o})`,
      }}
    >
      {A ? <A /> : <NetherCanvas f={f} heat={1} />}
      {f >= TEAR - 1 && hot(side)}
    </div>
  );

  return (
    <AbsoluteFill style={{background: bg ? '#06020e' : undefined, overflow: 'hidden'}}>
      {bg && f >= TEAR - 2 && (
        <Cam zoom={zEnd} fx={960} fy={620} dx={sx * 0.5} dy={sy * 0.5}>
          {B ? <B /> : <EndCanvas f={f} dragon={clamp01((f - 80) / 110)} motes={1 + 1.5 * (1 - smooth(TEAR, TEAR + 50, f))} />}
        </Cam>
      )}
      {f >= TEAR - 2 && f < TEAR + 70 && (
        <AbsoluteFill style={{opacity: 0.9 * (1 - smooth(TEAR + 10, TEAR + 70, f))}}>
          <LightRays x={960} y={540} size={3000} color="200,120,255" opacity={0.6} rays={16} />
        </AbsoluteFill>
      )}
      {/* streaks of void light pouring out of the gap */}
      <Px
        draw={(ctx) => {
          if (f < TEAR - 1 || f > TEAR + 60) return;
          const t = (f - TEAR) / 50;
          const r = mulberry32(61);
          for (let i = 0; i < 40; i++) {
            const dir = r() < 0.5 ? -1 : 1;
            const y = r() * H;
            const len = (20 + r() * 120) * (0.4 + t);
            const x = 240 + dir * (10 + t * (60 + r() * 180) * (0.5 + r()));
            ctx.fillStyle = ['#e9c4ff', '#ffffff', '#b46bff', '#8a3cf0'][i % 4];
            ctx.globalAlpha = clamp01(1.0 - t) * 0.7;
            ctx.fillRect(Math.round(x - (dir > 0 ? 0 : len)), Math.round(y), Math.round(len), 1 + (i % 5 === 0 ? 1 : 0));
          }
          ctx.globalAlpha = 1;
        }}
      />
      {bg && f < TEAR && (
        <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
          {A ? <A /> : <NetherCanvas f={f} heat={1} />}
        </AbsoluteFill>
      )}
      {bg && f >= TEAR && f < TEAR + 60 && (
        <>
          {half(-1)}
          {half(1)}
        </>
      )}
      {[28, 40, 50].map((a, i) => (
        <PixelBurst key={a} x={CRACK[7].x + (i - 1) * 24} y={500 + i * 40} at={a} count={22} colors={['#6a1608', '#c4400f', '#ff8a2a', '#e9c4ff']} speed={12} life={26} size={10} gravity={0.7} seed={50 + i} />
      ))}
      {/* the fracture growing before the tear */}
      {f < TEAR && f >= 16 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, filter: `drop-shadow(0 0 ${12 + 16 * g}px #b06bff) drop-shadow(0 0 4px #ffffff)`, opacity: flicker, transform: `translate(${sx}px, ${sy}px)`}}>
          {arms.map((a, i) => (
            <g key={i}>
              <polyline points={polyPts(a)} fill="none" stroke="#2a0a50" strokeWidth={22} strokeLinejoin="miter" />
              <polyline points={polyPts(a)} fill="none" stroke="#e9c4ff" strokeWidth={12} strokeLinejoin="miter" />
              <polyline points={polyPts(a)} fill="none" stroke="#ffffff" strokeWidth={5} strokeLinejoin="miter" />
            </g>
          ))}
          {BRANCHES.map((b, i) => {
            const base = CRACK[3 + i * 3];
            const reach = smooth(34 + i * 4, 62, f);
            if (reach <= 0) return null;
            const pts = b.map((p) => ({x: base.x + p.x * reach, y: base.y + p.y * reach}));
            return <polyline key={i} points={polyPts(pts)} fill="none" stroke="#e9c4ff" strokeWidth={5} strokeLinejoin="miter" />;
          })}
        </svg>
      )}
      {/* tear flash and debris */}
      <Flash at={TEAR - 1} life={12} color="#f3e0ff" peak={1} />
      <Shockwave x={960} y={540} at={TEAR} color="#e9c4ff" maxR={1100} life={22} width={36} />
      <Shards at={TEAR} x={960} y={540} colors={['#6a1608', '#c4400f', '#ff8a2a', '#2e0804', '#8c2210']} />
      <PixelBurst x={960} y={540} at={TEAR} count={60} colors={['#e9c4ff', '#b46bff', '#ffffff', '#ff7ae8']} speed={36} life={44} size={16} gravity={0.2} seed={12} />
      <Vignette s={0.35 * smooth(TEAR, TEAR + 40, f)} color="20,0,40" />
      <Letterbox k={bars} size={96} />
      <Sequence from={114} durationInFrames={T2 - 114}>
        <DimTitle title={title} sub={sub} desc={desc} chip={chip} tone="end" accent="#b06bff" iconA={blockUrl('end_stone')} iconB={blockUrl('purpur_block')} total={T2 - 114} />
      </Sequence>
      <Sfx at={20} src={mcSound('ambient/weather/thunder1')} volume={0.2} rate={0.45} />
      {[28, 38, 47, 54].map((a, i) => (
        <Sfx key={a} at={a} src={mcSound(`dig/stone${i + 1}`)} volume={0.35 + i * 0.1} rate={0.5 + i * 0.12} />
      ))}
      <Sfx at={TEAR - 2} src={mcSound('random/explode2')} volume={0.45} rate={0.6} />
      <Sfx at={TEAR + 10} src={mcSound('random/orb')} volume={0.4} rate={0.6} />
    </AbsoluteFill>
  );
};

// ================================================================ 3. back to the overworld

export const T3 = 196;

export const ToOverworld: FC<DimCrossProps> = ({bg, A, B, title = '主世界', sub = 'THE OVERWORLD', desc = '万物生长的起点', chip = 'DIMENSION · 维度'}) => {
  const f = useCurrentFrame();
  // day cycle: pre-dawn at the start, sun clear of the horizon at the end
  const tod = lerp(0.9, 1.1, EASE.inOut(clamp01((f - 14) / 118)));
  const sun = sunPos(tod, 200);
  const open = EASE.inOut(clamp01((f - 14) / 34));
  const slit = 0.5 + 0.0 * open;
  const camY = lerp(-150, 60, EASE.inOut(clamp01((f - 14) / 120)));
  const zoom = lerp(1.3, 1.04, EASE.out(clamp01((f - 14) / 130)));
  const dark = 1 - smooth(20, 100, f);
  const rays = smooth(50, 90, f) * (1 - smooth(130, 170, f));
  const bars = prog(f, 112, 14, EASE.inOut) * (1 - prog(f, T3 - 14, 14, EASE.inOut));
  const wake = Math.max(0, 1 - Math.abs(f - 14) / 6);

  return (
    <AbsoluteFill style={{background: bg ? '#000' : undefined, overflow: 'hidden'}}>
      {/* the outgoing footage fades into the void (only when A is given) */}
      {bg && A && f < 34 && (
        <AbsoluteFill style={{opacity: 1 - smooth(8, 34, f)}}>
          <A />
        </AbsoluteFill>
      )}
      {/* the void we leave: drifting purple motes */}
      <Px
        draw={(ctx) => {
          const a = 1 - smooth(8, 34, f);
          if (a <= 0) return;
          ctx.globalAlpha = a;
          motes(ctx, {seed: 71, count: 80, f, area: [0, 0, W, H], vx: 0.05, vy: -0.5, colors: ['#b46bff', '#e9a8ff', '#6a3cff', '#ffffff'], size: [1, 3], wobble: 8});
          ctx.globalAlpha = 1;
        }}
      />
      {/* eyelid: the world opens as a growing band of light */}
      <AbsoluteFill style={{clipPath: `inset(${(slit - slit * open) * 100}% 0 ${(slit - slit * open) * 100}% 0)`}}>
        {bg && (
          <Cam zoom={zoom} fx={960} fy={540} dy={camY * 0.6}>
            {B ? <B /> : <OverworldCanvas tod={tod} frame ps={2} />}
          </Cam>
        )}
        {/* darkness lifting */}
        <AbsoluteFill style={{background: `rgba(4,2,16,${0.92 * dark})`}} />
        {/* warm bloom at the horizon */}
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${(sun.x / 480) * 100}% ${60 + (camY / 10) * 0.2}%, rgba(255,214,150,${0.55 * smooth(30, 100, f)}) 0%, rgba(255,160,90,${0.25 * smooth(30, 100, f)}) 30%, rgba(255,160,90,0) 62%)`, mixBlendMode: 'screen'}} />
        {rays > 0 && (
          <AbsoluteFill style={{opacity: rays * 0.8}}>
            <LightRays x={sun.x * 4} y={sun.y * 4 * 0.9 + 60 + camY * 0.4} size={2800} color="255,226,150" opacity={0.42} rays={18} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {/* the first slit of light */}
      <div style={{position: 'absolute', left: 960 - 960 * smooth(8, 20, f), width: 1920 * smooth(8, 20, f), top: 538 - 6 * (1 - open), height: 4 + 4 * (1 - open), background: '#fff6d8', opacity: (1 - open) * smooth(8, 12, f), boxShadow: '0 0 40px 14px rgba(255,220,150,0.9)'}} />
      <Flash at={14} life={10} color="#fff0c8" peak={0.55 + wake * 0} />
      <Vignette s={0.7 * dark + 0.12} color="2,0,12" />
      <Px
        draw={(ctx) => {
          // pollen / light motes rising once it is bright
          const a = smooth(60, 100, f);
          ctx.globalAlpha = a;
          motes(ctx, {seed: 77, count: 70, f, area: [0, 40, W, 220], vx: 0.12, vy: -0.25, colors: ['#fff6c4', '#ffffff', '#ffe27a', '#b8f08a'], size: [1, 3], wobble: 10});
          ctx.globalAlpha = 1;
          if (f > 30 && f < 120) {
            ctx.globalCompositeOperation = 'lighter';
            glow(ctx, sun.x, sun.y * 0.95 + 18 + camY * 0.1, 140, '#ffd98a', 0.35 * smooth(30, 80, f));
            ctx.globalCompositeOperation = 'source-over';
          }
        }}
      />
      <Letterbox k={bars} size={96} />
      <Sequence from={108} durationInFrames={T3 - 108}>
        <DimTitle title={title} sub={sub} desc={desc} chip={chip} tone="grass" accent="#7fd24e" iconA={blockUrl('grass_block_top')} tintA="sepia(1) saturate(3.2) hue-rotate(48deg) brightness(1.05)" iconB={blockUrl('oak_planks')} total={T3 - 108} />
      </Sequence>
      <Sfx at={14} src={mcSound('random/orb')} volume={0.4} rate={0.7} />
      <Sfx at={44} src={mcSound('random/levelup')} volume={0.28} rate={0.9} />
      <Sfx at={60} src={mcSound('step/grass1')} volume={0.4} />
    </AbsoluteFill>
  );
};


export const crossEntries: FxEntry[] = [
  {
    meta: {
      id: 'dim-overworld-to-nether',
      name: '主世界 → 下界',
      category: 'map',
      tags: ['维度', '下界', '传送门', '标题'],
      frames: T1,
      blurb: '镜头推进紫色传送门，画面扭曲、像素漩涡把一切吞没，紫色像素溶解后落在岩浆与灰烬的下界，边缘泛红，弹出“下界”大标题。',
      usage: '视频里玩家进入下界传送门的那一刻，或章节从主世界切到下界。',
      params: [
        {name: 'bg', desc: 'true 为完整演示（含两个世界底板）；省略则只输出传送门吞没+落地+标题图形，可叠到你自己的素材上'},
        {name: 'SWAP1 / FX1', desc: '切换帧与传送门中心（源码常量），换素材时对齐'},
      ],
    },
    Demo: () => <OverToNether bg />,
    Layer: () => <OverToNether />,
  },
  {
    meta: {
      id: 'dim-nether-to-end',
      name: '下界 → 末地',
      category: 'map',
      tags: ['维度', '末地', '撕裂', '标题'],
      frames: T2,
      blurb: '红色的下界画面出现白紫色裂纹并剧烈震动，随后被整个撕开、两半飞散，紫黑星空与末地岛屿涌出，弹出“末地”标题。',
      usage: '进入末地传送门/要塞，或剧情从下界跳到末地。',
      params: [{name: 'bg', desc: 'true 为完整演示；省略则只输出裂纹、光束、碎片与标题（撕开的两半依赖底板，Layer 里没有）'}, {name: 'TEAR', desc: '撕裂帧（源码常量）'}],
    },
    Demo: () => <NetherToEnd bg />,
    Layer: () => <NetherToEnd />,
  },
  {
    meta: {
      id: 'dim-to-overworld',
      name: '回到主世界',
      category: 'map',
      tags: ['维度', '主世界', '日出', '标题'],
      frames: T3,
      blurb: '从紫色虚空的黑暗里，一道光线像睁眼一样展开，日出，天空蓝回来，草地与云出现，弹出“主世界”标题。',
      usage: '从下界/末地返回主世界，或作为“回家”“醒来”的开场。',
      params: [{name: 'bg', desc: 'true 为完整演示；省略则只输出光线、光晕、粒子与标题'}, {name: 'tod', desc: '日出时间区间（源码内 lerp(0.9, 1.1)）'}],
    },
    Demo: () => <ToOverworld bg />,
    Layer: () => <ToOverworld />,
  },
];
