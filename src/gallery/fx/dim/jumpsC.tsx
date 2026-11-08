import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreChip, OreText, TYPE} from '../../../mg/Ore';
import {LowRes} from '../../../mg/LowRes';
import {Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import {PlateA, PlateB} from '../../plates';
import type {FxEntry} from '../../types';
import {BandTitle, hexA, lerp, mod, smooth, useWarp} from './kit';

/**
 * Jumps C (bonus):
 *   jump-meanwhile  : a white slash cuts the shot on a diagonal, both halves slide apart, a black ribbon "与此同时" slams across
 *                     the cut; later the second shot sweeps over the first to full screen.
 *   jump-flashback  : the shot ripples and whites out, then plays as an old film: sepia, sprocket borders, grain, scratches,
 *                     projector flicker and a heavy vignette, no text at all; ripples back to the present at the end.
 * Both are plate demos (PlateA / PlateB are replaceable). `Layer` of flashback = just the film overlay.
 */

const gold = '#ffc93a';

// ================================================================ 13. meanwhile

export const T13 = 144;
const SLOPE = 0.5; // horizontal run per vertical unit of the cut

/** Props of Meanwhile. */
export type MeanwhileProps = {
  /** First shot (left half). Default: PlateA placeholder. */
  A?: FC;
  /** Second shot (right half, finally sweeps over to full screen). Default: PlateB placeholder. */
  B?: FC;
  /** Ribbon title. */
  title?: string;
  /** Spaced English line under the ribbon title. */
  sub?: string;
  /** Chip for the first shot (empty string hides it). */
  labelA?: string;
  /** Chip for the second shot (empty string hides it). */
  labelB?: string;
};

export const Meanwhile: FC<MeanwhileProps> = ({A = PlateA, B = PlateB, title = '与此同时', sub = 'MEANWHILE', labelA = 'A · 白天 · 主角线', labelB = 'B · 夜晚 · 同伴线'}) => {
  const f = useCurrentFrame();
  const slash = EASE.out(clamp01((f - 14) / 8));
  const open = EASE.out(clamp01((f - 22) / 12)) * (1 - EASE.inOut(clamp01((f - 98) / 8)));
  const g = 46 * open;
  const sweep = EASE.inOut(clamp01((f - 100) / 26));
  const off = -sweep * 1700;
  const cx = 960 + off;
  const xTop = cx + SLOPE * 540;
  const xBot = cx - SLOPE * 540;
  const clipA = `polygon(0px 0px, ${xTop}px 0px, ${xBot}px 1080px, 0px 1080px)`;
  const clipB = `polygon(${xTop}px 0px, 1920px 0px, 1920px 1080px, ${xBot}px 1080px)`;
  const drift = (f - 30) * 0.5;
  const ribbonIn = f < 34 ? 0 : EASE.back(clamp01((f - 34) / 8));
  const ribbonOut = EASE.in(clamp01((f - 96) / 12));
  const hit = f - 38;
  const sq = hit >= 0 ? Math.exp(-hit / 4) * Math.cos(hit * 0.9) : 0;
  const shake = hit >= 0 && hit < 10 ? 18 * (1 - hit / 10) : 0;
  const rs = mulberry32(3300 + f);
  const sx = (rs() * 2 - 1) * shake;
  const sy = (rs() * 2 - 1) * shake;
  const chipA = prog(f, 46, 12, EASE.out) * (1 - ribbonOut);
  const chipB = prog(f, 50, 12, EASE.out) * (1 - ribbonOut);
  const ang = (Math.atan2(1080, -2 * SLOPE * 540) * 180) / Math.PI;
  void ang;
  const half = (clip: string, tx: number, ty: number, children: ReactNode, inner: number): ReactNode => (
    <div style={{position: 'absolute', inset: 0, clipPath: clip, transform: `translate(${tx}px, ${ty}px)`}}>
      <div style={{position: 'absolute', inset: -60, transform: `translateX(${inner}px) scale(1.06)`}}>{children}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: '#06060c', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* void in the gap: dark with a bright core */}
        <AbsoluteFill style={{background: 'linear-gradient(90deg, #0a0a14, #1e1a2e, #0a0a14)'}} />
        {/* before the cut: A full */}
        {f < 22 && (
          <AbsoluteFill>
            <A />
          </AbsoluteFill>
        )}
        {f >= 22 && (
          <>
            {half(clipA, -g, -g * 0.35, <A />, -drift * (1 - sweep))}
            {half(clipB, g, g * 0.35, <B />, drift * (1 - sweep))}
          </>
        )}
        {/* the slash */}
        {f >= 14 && f < 40 && (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 1 - smooth(30, 40, f), filter: `drop-shadow(0 0 16px #fff6d0) drop-shadow(0 0 6px ${gold})`}}>
            <line x1={xTop} y1={0} x2={xTop + (xBot - xTop) * slash} y2={1080 * slash} stroke="#fff" strokeWidth={14 + 14 * (1 - slash)} strokeLinecap="square" />
          </svg>
        )}
        {/* glowing seam while open */}
        {f >= 22 && open > 0.02 && (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: `drop-shadow(0 0 ${12 + 20 * open}px ${gold})`}}>
            <line x1={xTop} y1={0} x2={xBot} y2={1080} stroke="#fff6d8" strokeWidth={4 + 8 * open} />
          </svg>
        )}
        {/* spark particles along the slash */}
        {f >= 14 && f < 44 && (
          <LowRes
            ready
            draw={(ctx) => {
              const r = mulberry32(55);
              const t = clamp01((f - 14) / 8);
              for (let i = 0; i < 70; i++) {
                const u = r() * Math.min(1, t * 1.1);
                const px = (xTop + (xBot - xTop) * u) / 4;
                const py = u * 270;
                const a = r() * Math.PI * 2;
                const v = (4 + r() * 22) * clamp01((f - 14 - u * 8) / 10);
                ctx.fillStyle = ['#ffffff', gold, '#ffe9a0'][i % 3];
                ctx.globalAlpha = clamp01(1 - (f - 14 - u * 8) / 22);
                ctx.fillRect(Math.round(px + Math.cos(a) * v), Math.round(py + Math.sin(a) * v + v * 0.3), 2, 2);
              }
              ctx.globalAlpha = 1;
            }}
          />
        )}
        {/* ribbon */}
        {ribbonIn > 0 && (
          <div style={{position: 'absolute', left: 960 - 900, top: 540 - 180, width: 1800, height: 360, transform: `translate(${ribbonOut * 2200}px, 0) rotate(-9deg) scale(${ribbonIn * (1 + 0.1 * sq)}, ${ribbonIn * (1 - 0.18 * sq)})`, opacity: 1 - 0.0}}>
            <div style={{position: 'absolute', inset: 0, background: '#14141c', clipPath: 'polygon(0 0, 100% 0, calc(100% - 60px) 50%, 100% 100%, 0 100%, 60px 50%)', boxShadow: '0 20px 0 rgba(0,0,0,0.5)'}} />
            <div style={{position: 'absolute', left: 60, right: 60, top: 18, height: 8, background: gold}} />
            <div style={{position: 'absolute', left: 60, right: 60, bottom: 18, height: 8, background: gold}} />
            <div style={{position: 'absolute', left: 90, right: 90, top: 26, bottom: 26, backgroundImage: `radial-gradient(circle at 50% 50%, ${hexA(gold, 0.12)} 0 4px, rgba(0,0,0,0) 5px)`, backgroundSize: '24px 24px'}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center'}}>
              <BandTitle size={168} tone="gold">
                {title}
              </BandTitle>
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center', opacity: prog(f, 44, 10)}}>
              <OreText size={TYPE.body} color="#fff" style={{letterSpacing: 20, marginRight: -20, textShadow: `4px 4px 0 #000, 0 0 24px ${hexA(gold, 0.6)}`}}>
                {sub}
              </OreText>
            </div>
            {[120, 1800 - 120 - 60].map((x) => (
              <div key={x} style={{position: 'absolute', left: x, top: 150, width: 60, height: 60, background: gold, transform: 'rotate(45deg) scale(0.6)', border: '6px solid #2a1c00', boxSizing: 'border-box'}} />
            ))}
          </div>
        )}
        {labelA !== '' && (
          <div style={{position: 'absolute', left: 80, top: 70, opacity: chipA, transform: `translateX(${(1 - chipA) * -140}px)`}}>
            <OreChip color={ORE.text} dot="#8fd3ff">
              {labelA}
            </OreChip>
          </div>
        )}
        {labelB !== '' && (
          <div style={{position: 'absolute', right: 80, bottom: 70, opacity: chipB, transform: `translateX(${(1 - chipB) * 140}px)`}}>
            <OreChip color={ORE.text} dot="#b27cff">
              {labelB}
            </OreChip>
          </div>
        )}
      </AbsoluteFill>
      <Shockwave x={960} y={540} at={38} color="#fff1c0" maxR={1000} life={20} width={30} />
      <Sequence from={38} durationInFrames={36}>
        <PixelBurst x={960} y={540} at={0} count={60} colors={[gold, '#ffffff', '#ffe27a']} speed={34} life={36} size={14} gravity={0.5} seed={13} />
      </Sequence>
      <Flash at={14} life={5} color="#ffffff" peak={0.5} />
      <Flash at={38} life={6} color="#fff3c0" peak={0.5} />
      <Flash at={T13 - 12} life={8} color="#ffffff" peak={0.4} />
      <Vignette s={0.25} />
      <Sfx at={15} src={mcSound('random/explode1')} volume={0.15} rate={1.8} />
      <Sfx at={37} src={mcSound('random/anvil_land')} volume={0.55} rate={0.85} />
    </AbsoluteFill>
  );
};

// ================================================================ 14. flashback

export const T14 = 156;
export const IN = 24; // whiteout frame going into the memory
export const OUT = 124; // whiteout frame coming back

const Film: FC<{f: number; k: number}> = ({f, k}) => (
  <>
    {/* grain + scratches + dust */}
    <LowRes
      ready
      draw={(ctx) => {
        if (k <= 0.01) return;
        const r = mulberry32(8800 + f * 13);
        for (let i = 0; i < 520; i++) {
          const v = r() < 0.5 ? 255 : 0;
          ctx.fillStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.1})`;
          ctx.fillRect(Math.floor(r() * 480), Math.floor(r() * 270), 1 + (r() < 0.1 ? 1 : 0), 1);
        }
        // vertical scratches
        for (let i = 0; i < 3; i++) {
          if (r() < 0.45) {
            ctx.fillStyle = `rgba(255,240,210,${0.1 + r() * 0.25})`;
            ctx.fillRect(Math.floor(r() * 480), 0, 1, 270);
          }
        }
        // dust specks
        for (let i = 0; i < 6; i++) {
          if (r() < 0.5) {
            ctx.fillStyle = 'rgba(20,12,4,0.55)';
            const x = Math.floor(r() * 480);
            const y = Math.floor(r() * 270);
            ctx.fillRect(x, y, 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
          }
        }
      }}
    />
    {/* sprocket strips */}
    {[0, 1].map((side) => (
      <div key={side} style={{position: 'absolute', top: 0, bottom: 0, [side ? 'right' : 'left']: 0, width: 80 * k, background: '#0c0805', overflow: 'hidden', boxShadow: side ? '-6px 0 0 rgba(0,0,0,0.4)' : '6px 0 0 rgba(0,0,0,0.4)'}}>
        {Array.from({length: 14}, (_, i) => {
          const y = mod(i * 88 - f * 7, 14 * 88) - 88;
          return <div key={i} style={{position: 'absolute', left: 22, top: y, width: 36, height: 52, background: '#e8d8b0', opacity: 0.85, boxShadow: 'inset 0 0 0 4px #b8a070'}} />;
        })}
      </div>
    ))}
    {/* frame lines */}
    <div style={{position: 'absolute', left: 0, right: 0, top: (mod(f * 22, 1200) - 60) * 1, height: 6, background: 'rgba(0,0,0,0.35)', opacity: k * (f % 40 < 3 ? 1 : 0)}} />
  </>
);

/** Props of Flashback. Without `bg` only the film look is drawn (amber wash, vignette, grain, sprocket borders, white-out) on transparent. */
export type FlashbackProps = {
  /** true = also draw the footage below with ripple / sepia / flicker applied (needs Present and Memory). */
  bg?: boolean;
  /** Footage before the flashback. Default: PlateB placeholder. */
  Present?: FC;
  /** Footage inside the flashback (old-film look). Default: PlateA placeholder. */
  Memory?: FC;
  /** Footage after coming back to the present. Default: same as Present. */
  After?: FC;
};

export const Flashback: FC<FlashbackProps> = ({bg, Present = PlateB, Memory = PlateA, After}) => {
  const f = useCurrentFrame();
  const inRipple = smooth(8, IN, f) * (f < IN + 2 ? 1 : 0);
  const outRipple = smooth(OUT - 16, OUT, f) * (f >= OUT - 18 && f < OUT + 2 ? 1 : 0);
  const rip = Math.max(inRipple, outRipple);
  const warp = useWarp(f, 70 * rip, 0.007);
  const memory = f >= IN + 2 && f < OUT + 1;
  const k = memory ? smooth(IN + 2, IN + 10, f) * (1 - smooth(OUT - 12, OUT, f)) : 0;
  const flicker = memory ? 0.92 + 0.08 * Math.sin(f * 2.3) + (f % 17 === 0 ? 0.12 : 0) : 1;
  const zoom = memory ? lerp(1.0, 1.1, (f - IN) / (OUT - IN)) : 1 + 0.08 * rip;
  const wl = Math.max(0, 1 - Math.abs(f - IN) / 5);
  const wo = Math.max(0, 1 - Math.abs(f - OUT) / 5);
  const filt = k > 0 ? `sepia(${0.95 * k}) saturate(${1 - 0.4 * k}) contrast(${1 + 0.15 * k}) brightness(${1 + 0.05 * k})` : '';
  const jr = mulberry32(4100 + Math.floor(f / 2));
  const jx = memory ? Math.round((jr() * 2 - 1) * 4) * k : 0;
  const jy = memory ? Math.round((jr() * 2 - 1) * 3) * k : 0;
  const style: CSSProperties = {filter: `${filt} ${warp.filter ?? ''}`.trim() || undefined, transform: `translate(${jx}px, ${jy}px) scale(${zoom}) rotate(${rip * Math.sin(f / 3) * 1.2}deg)`, opacity: flicker};
  return (
    <AbsoluteFill style={{background: bg ? '#000' : undefined, overflow: 'hidden'}}>
      {warp.node}
      {bg && <AbsoluteFill style={style}>{memory ? <Memory /> : f > OUT && After ? <After /> : <Present />}</AbsoluteFill>}
      {/* amber wash + vignette */}
      <AbsoluteFill style={{background: `rgba(120,70,20,${0.28 * k})`, mixBlendMode: bg ? 'multiply' : 'normal'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 38%, rgba(30,14,4,${0.82 * k}) 100%)`}} />
      <Film f={f} k={k} />
      <AbsoluteFill style={{background: '#fff3d8', opacity: Math.max(wl, wo) * 0.95}} />
      <Vignette s={0.2 * rip} color="40,20,0" />
      <Sfx at={IN} src={mcSound('random/orb')} volume={0.4} rate={0.6} />
      <Sfx at={IN + 4} src={mcSound('block/furnace/fire_crackle1')} volume={0.12} />
    </AbsoluteFill>
  );
};

export const jumpCEntries: FxEntry[] = [
  {
    meta: {
      id: 'jump-meanwhile',
      name: '与此同时（斜切分屏）',
      category: 'transition',
      tags: ['分屏', '与此同时', '双线叙事', '斜切'],
      frames: T13,
      blurb: '一道白色斩线斜劈画面，两半向两侧滑开，黑色缎带“与此同时”砸在切口上并带冲击波，两个画面各带标签缓慢反向漂移；最后第二个画面沿斜线扫过整屏。',
      usage: '切换到另一条故事线 / 另一位玩家的视角（加送）。',
      params: [{name: 'SLOPE', desc: '斜切的倾斜度（源码常量）'}, {name: '画面', desc: 'PlateA / PlateB 换成实拍素材即可'}],
    },
    Demo: () => <Meanwhile />,
  },
  {
    meta: {
      id: 'jump-flashback',
      name: '回忆闪回（老胶片）',
      category: 'transition',
      tags: ['闪回', '回忆', '胶片', '褐色', '颗粒'],
      frames: T14,
      blurb: '画面水波扭曲、闪白后变成褐色老胶片：齿孔边、颗粒、划痕、灰尘、放映机闪烁、边缘暗角与轻微抖动，不带任何文字；结束时再次水波闪白回到现实。',
      usage: '插入回忆片段、“很久以前”、历史回顾（加送）。',
      params: [
        {name: 'bg', desc: 'Demo 内含两个底板；Layer 只输出暖色罩、暗角、胶片边、颗粒与划痕，可叠在你自己的回忆素材上'},
        {name: 'IN / OUT', desc: '进入/退出回忆的帧（源码常量）'},
      ],
    },
    Demo: () => <Flashback bg />,
    Layer: () => <Flashback />,
  },
];
