import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {item} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreChip, OreText, TYPE, nine} from '../../../mg/Ore';
import {prog} from '../../../reel/kit';
import type {TransitionDef} from '../../../reel/transitions';
import {BandTitle, blockUrl, lerp} from './kit';

/**
 * jump-chapter (cut transition, full-bleed).
 *   lb  0..36   six slanted colour bands run in from the left one after another and park edge to edge, so the whole
 *               screen is a solid striped field (no empty areas at any frame)
 *   lb 38       the chapter card slams onto the striped field: centred panel (number plate 02 -> 03 roll, title block,
 *               subtitle, three item slots) between a label bar on top and a progress bar below
 *   lb 94..120  the card shrinks away, the bands run out to the right in the same order and uncover shot B
 * Tunables: texts in ChapterOverlay, BANDS colours, CH_T (length).
 */

export const CH_T = 120;
const gold = '#ffc93a';
const N = 6; // bands
const SLANT = 160; // horizontal run of the slanted edge
const WB = 402; // band width measured along the horizontal
const BANDS: {fill: string; edge: string; tex: 'dots' | 'bricks' | 'plain'}[] = [
  {fill: gold, edge: '#b3720a', tex: 'dots'},
  {fill: '#16171a', edge: gold, tex: 'bricks'},
  {fill: '#ff9a3c', edge: '#8c3a08', tex: 'dots'},
  {fill: gold, edge: '#b3720a', tex: 'dots'},
  {fill: '#16171a', edge: gold, tex: 'bricks'},
  {fill: '#ff9a3c', edge: '#8c3a08', tex: 'dots'},
];

const Halftone: FC<{color: string; opacity?: number; size?: number}> = ({color, opacity = 0.22, size = 24}) => (
  <div style={{position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 50% 50%, ${color} 0 ${size * 0.22}px, rgba(0,0,0,0) ${size * 0.24}px)`, backgroundSize: `${size}px ${size}px`, opacity}} />
);

const bandPoly = `polygon(${SLANT}px 0, ${SLANT + WB}px 0, ${WB}px 100%, 0 100%)`;
const edgePoly = `polygon(${SLANT}px 0, ${SLANT + 16}px 0, 16px 100%, 0 100%)`;
const lightPoly = `polygon(${SLANT + WB - 8}px 0, ${SLANT + WB}px 0, ${WB}px 100%, ${WB - 8}px 100%)`;

const Band: FC<{i: number; tx: number}> = ({i, tx}) => {
  const b = BANDS[i];
  return (
    <div style={{position: 'absolute', left: -SLANT + i * WB + tx, top: 0, width: WB + SLANT + 2, height: 1080, clipPath: bandPoly, background: b.fill}}>
      {b.tex === 'dots' && <Halftone color={b.edge} opacity={0.5} size={32} />}
      {b.tex === 'bricks' && (
        <>
          <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${blockUrl('deepslate_bricks')})`, backgroundSize: '128px 128px', imageRendering: 'pixelated', opacity: 0.55}} />
          <div style={{position: 'absolute', inset: 0, background: 'rgba(8,8,12,0.55)'}} />
        </>
      )}
      <div style={{position: 'absolute', inset: 0, clipPath: edgePoly, background: 'rgba(0,0,0,0.3)'}} />
      <div style={{position: 'absolute', inset: 0, clipPath: lightPoly, background: 'rgba(255,255,255,0.35)'}} />
    </div>
  );
};

/** Text / content of the chapter card (all optional; defaults = the gallery demo). */
export type ChapterOpts = {
  /** Label bar at the top. */
  label?: string;
  /** Small caption on the number plate. */
  plateTop?: string;
  /** Number that rolls out. */
  from?: string;
  /** Number that rolls in. */
  to?: string;
  /** Caption at the bottom of the number plate. */
  plateBottom?: string;
  /** Progress chip above the title. */
  badge?: string;
  /** Chapter title. */
  title?: string;
  /** Line under the divider. */
  subtitle?: string;
  /** Item ids (vanilla item textures) shown in the three slots. */
  items?: string[];
  /** Number of dots in the progress bar. */
  dots?: number;
  /** 0-based index of the dot that lights up (default 2 = third dot). */
  current?: number;
};

export const ChapterOverlay: FC<{p: number} & ChapterOpts> = ({p, label = 'CHAPTER 03 / 07 · 第三章', plateTop = 'CHAPTER', from = '02', to = '03', plateBottom = '第 3 章', badge = '进度 · 3 / 7', title = '深入矿洞', subtitle = '在黑暗里点亮第一支火把', items = ['stick', 'iron_pickaxe', 'coal'], dots = 7, current = 2}) => {
  const f = useCurrentFrame();
  const lb = p * CH_T;
  const base = f - lb;
  const HIT = 38;
  // band i runs in (rightmost first) and later runs out in the same order
  const bx = (i: number) => {
    const k = N - 1 - i;
    const inP = EASE.out(clamp01((lb - k * 3) / 20));
    const outP = EASE.in(clamp01((lb - (98 + k * 2)) / 14));
    return -2500 * (1 - inP) + 2500 * outP;
  };
  const hit = lb - HIT;
  const cardIn = clamp01(hit / 8);
  const cardS = hit < 0 ? 1.3 : lerp(1.3, 1, EASE.back(cardIn));
  const cardOut = EASE.in(clamp01((lb - 92) / 8));
  const alpha = hit < 0 ? 0 : clamp01(hit / 3) * (1 - cardOut);
  const roll = EASE.back(clamp01((lb - 52) / 9));
  const textIn = (at: number) => prog(lb, at, 10, EASE.out) * (1 - cardOut);
  const shake = hit >= 0 && hit < 10 ? 10 * (1 - hit / 10) : 0;
  const rs = mulberry32(6000 + Math.floor(lb));
  const sx = (rs() * 2 - 1) * shake;
  const sy = (rs() * 2 - 1) * shake;
  const dotsN = dots;
  const cur = current;
  const dotT = EASE.inOut(clamp01((lb - 58) / 14));
  const barW = 1000;
  const PW = 1440;
  const PH = 600;
  const col: CSSProperties = {position: 'absolute', left: 500, width: 880, display: 'flex', justifyContent: 'center', alignItems: 'center'};
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: N}, (_, i) => (
        <Band key={i} i={i} tx={bx(i)} />
      ))}
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`, opacity: alpha}}>
        {/* label bar (top) */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 84, display: 'flex', justifyContent: 'center', opacity: textIn(42), transform: `translateY(${(1 - textIn(42)) * -30}px)`}}>
          <div style={{background: '#14141c', border: `6px solid ${gold}`, boxShadow: '0 10px 0 rgba(0,0,0,0.45)', padding: '12px 48px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <OreText size={TYPE.small} color={gold} style={{letterSpacing: 12, marginRight: -12}}>
              {label}
            </OreText>
          </div>
        </div>
        {/* the card */}
        <div style={{position: 'absolute', left: (1920 - PW) / 2, top: (1080 - PH) / 2, width: PW, height: PH, transform: `scale(${cardS * (1 - 0.08 * cardOut)})`, transformOrigin: '50% 50%'}}>
          <div style={{...nine('panel', [2, 2, 2, 2]), position: 'absolute', inset: 0, boxShadow: '0 24px 0 rgba(0,0,0,0.55)'}} />
          <div style={{position: 'absolute', left: 24, right: 24, top: 24, height: 6, background: gold}} />
          <div style={{position: 'absolute', left: 24, right: 24, bottom: 24, height: 6, background: gold}} />
          {[24, PW - 48].flatMap((x) => [24, PH - 48].map((y) => <div key={`${x}${y}`} style={{position: 'absolute', left: x, top: y, width: 24, height: 24, background: gold, transform: 'rotate(45deg) scale(0.7)', border: '4px solid #2a1c00', boxSizing: 'border-box'}} />))}
          {/* number plate */}
          <div style={{position: 'absolute', left: 64, top: 110, width: 380, height: 380}}>
            <div style={{...nine('panel_raised', [2, 2, 2, 2]), position: 'absolute', inset: 0}} />
            <div style={{position: 'absolute', inset: 28, border: `6px dashed ${gold}`, opacity: 0.6}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center'}}>
              <OreText size={TYPE.small} color={ORE.dim} style={{letterSpacing: 8, marginRight: -8}}>
                {plateTop}
              </OreText>
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 110, height: 168, overflow: 'hidden', display: 'flex', justifyContent: 'center'}}>
              <div style={{transform: `translateY(${-roll * 168}px)`}}>
                {[from, to].map((n) => (
                  <div key={n} style={{height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <BandTitle size={168} tone="gold" inkY>
                      {n}
                    </BandTitle>
                  </div>
                ))}
              </div>
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 44, display: 'flex', justifyContent: 'center'}}>
              <OreText size={TYPE.small} color={gold}>
                {plateBottom}
              </OreText>
            </div>
          </div>
          {/* title block: one centred column */}
          <div style={{...col, top: 90, height: 56, opacity: textIn(44), transform: `translateX(${(1 - textIn(44)) * 80}px)`}}>
            <OreChip color={ORE.text} dot={gold}>
              {badge}
            </OreChip>
          </div>
          <div style={{...col, top: 162, height: 168, opacity: textIn(46), transform: `translateX(${(1 - textIn(46)) * 120}px)`}}>
            <BandTitle size={168} tone="stone">
              {title}
            </BandTitle>
          </div>
          <div style={{...col, top: 372, height: 24, gap: 20, opacity: textIn(52)}}>
            <div style={{width: 160 * textIn(52), height: 6, background: gold}} />
            <div style={{width: 18, height: 18, background: gold, transform: 'rotate(45deg)'}} />
            <div style={{width: 160 * textIn(52), height: 6, background: gold}} />
          </div>
          <div style={{...col, top: 418, height: 48, opacity: textIn(54), transform: `translateY(${(1 - textIn(54)) * 20}px)`}}>
            <OreText size={TYPE.body} color={ORE.dim} shadow style={{letterSpacing: 4, marginRight: -4}}>
              {subtitle}
            </OreText>
          </div>
          <div style={{...col, top: 484, height: 72, gap: 16}}>
            {items.map((id, i) => (
              <div key={id} style={{...nine('slot', [2, 2, 2, 2]), width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: textIn(56), transform: `translateY(${(1 - prog(lb, 56 + i * 3, 8, EASE.back)) * 30}px)`}}>
                <Img src={item(id)} style={{width: 48, height: 48, imageRendering: 'pixelated'}} />
              </div>
            ))}
          </div>
        </div>
        {/* progress bar (bottom) */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 904, display: 'flex', justifyContent: 'center', opacity: textIn(58)}}>
          <div style={{width: barW + 120, height: 88, background: '#14141c', border: `6px solid ${gold}`, boxShadow: '0 10px 0 rgba(0,0,0,0.45)', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{position: 'relative', width: barW, height: 48}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 20, height: 8, background: 'rgba(255,255,255,0.15)'}} />
              <div style={{position: 'absolute', left: 0, width: (cur + dotT) * (barW / (dotsN - 1)), top: 20, height: 8, background: gold}} />
              {Array.from({length: dotsN}, (_, i) => {
                const done = i < cur || (i === cur && dotT > 0.95);
                const isCur = i === cur;
                const s = isCur ? 1 + 0.5 * EASE.back(dotT) : 1;
                return (
                  <div key={i} style={{position: 'absolute', left: i * (barW / (dotsN - 1)) - 20, top: 4, width: 40, height: 40, background: done ? gold : '#2b2c2d', border: `6px solid ${done ? '#2a1c00' : '#555'}`, boxSizing: 'border-box', transform: `scale(${s}) rotate(${isCur ? dotT * 90 : 0}deg)`}} />
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      {lb >= HIT && lb < 76 && <PixelBurst x={960} y={540} at={base + HIT} count={50} colors={[gold, '#ffffff', '#ffe27a', '#b3720a']} speed={32} life={36} size={14} gravity={0.5} seed={77} />}
      {lb >= HIT && lb < 64 && <Shockwave x={960} y={540} at={base + HIT} color="#ffe27a" maxR={900} life={20} width={24} />}
      {lb >= HIT && lb < 48 && <Flash at={base + HIT} life={7} color="#fff3c0" peak={0.5} />}
    </AbsoluteFill>
  );
};

export const chapterDef: TransitionDef & {mode: 'cut'} = {
  id: 'jump-chapter',
  name: '章节跳转',
  mode: 'cut',
  frames: CH_T,
  overlay: ChapterOverlay,
  cues: [
    {at: 38, src: 'mc:random/anvil_land', volume: 0.5, rate: 0.9},
    {at: 52, src: 'mc:random/click', volume: 0.35, rate: 1.3},
    {at: 58, src: 'mc:random/orb', volume: 0.3, rate: 1.2},
  ],
};
