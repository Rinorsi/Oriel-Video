import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {tex} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreChip} from '../../../mg/Ore';
import {OreBg, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import type {FxEntry} from '../../types';
import {hexA, lerp, smooth} from './kit';

/**
 * jump-countdown: 3 - 2 - 1 - GO, built from our own block-pixel numerals (5x7 grid, drawn as SVG cells) so the ink is
 * centred exactly: every glyph is trimmed to its lit-cell bounding box and the plate + glyph are centred with flex.
 *   - each beat slams a chamfered (stepped-corner) number plate onto the screen centre, with a squash on landing,
 *     a whole-screen compression pulse, pixel cross/shard burst and a colour-edge pulse
 *   - a 12-segment pixel progress bar fills during each number; on GO it lights up in rainbow
 *   - GO: wider plate, vanilla explosion frames, square confetti
 * `bg` = full demo (dark background); without it only the graphics are drawn on transparent.
 * Tunables: START / BEAT (timing), BEATS (colours), GLYPHS (the pixel numerals).
 */

export const T11 = 168;
export const START = 8;
export const BEAT = 28;

type Tone = {light: string; mid: string; dark: string; extrude: string; extrude2: string};
const PAL: Record<string, Tone> = {
  red: {light: '#ffc4c8', mid: '#ff4d5e', dark: '#b02040', extrude: '#5a0c20', extrude2: '#2a0410'},
  orange: {light: '#ffe0b0', mid: '#ff9a3c', dark: '#c4561a', extrude: '#6a2a08', extrude2: '#2e1204'},
  yellow: {light: '#fff8c0', mid: '#ffd23f', dark: '#e5a812', extrude: '#7a4a08', extrude2: '#3a2204'},
  green: {light: '#d8ffc0', mid: '#5ed16a', dark: '#2fa24a', extrude: '#145a2a', extrude2: '#08301a'},
};
const BEATS = [
  {n: '3', pal: PAL.red, acc: '#ff4d5e'},
  {n: '2', pal: PAL.orange, acc: '#ff9a3c'},
  {n: '1', pal: PAL.yellow, acc: '#ffd23f'},
  {n: 'GO', pal: PAL.green, acc: '#5ed16a'},
];
const RAIN = ['#ff4d5e', '#ff9a3c', '#ffd23f', '#5ed16a', '#3fd0c9', '#8f6bff', '#ff7aa8'];

const GLYPHS: Record<string, string[]> = {
  '3': ['#####', '....#', '....#', '.####', '....#', '....#', '#####'],
  '2': ['#####', '....#', '....#', '#####', '#....', '#....', '#####'],
  '1': ['.##..', '###..', '.##..', '.##..', '.##..', '.##..', '#####'],
  G: ['#####', '#....', '#....', '#..##', '#...#', '#...#', '#####'],
  O: ['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'],
};

/** Rows of a word (one char = one glyph, 1 empty column between glyphs), trimmed to the lit-cell bounding box. */
const wordCells = (word: string) => {
  const rows = Array.from({length: 7}, (_, r) => [...word].map((ch) => GLYPHS[ch][r]).join('.'));
  let c0 = Infinity;
  let c1 = -1;
  rows.forEach((row) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') {
        c0 = Math.min(c0, c);
        c1 = Math.max(c1, c);
      }
    }
  });
  const cells: {c: number; r: number}[] = [];
  rows.forEach((row, r) => {
    for (let c = c0; c <= c1; c++) if (row[c] === '#') cells.push({c: c - c0, r});
  });
  return {cells, cols: c1 - c0 + 1, rows: rows.length};
};

/** The numerals: three-tone face, two extrusion steps, black outline, top/bottom edge strips. SVG box is symmetric around the ink. */
const PixelWord: FC<{word: string; cell: number; tone: Tone}> = ({word, cell, tone}) => {
  const {cells, cols, rows} = wordCells(word);
  const pad = Math.round(cell * 0.6);
  const o = Math.round(cell * 0.14);
  const e = Math.round(cell * 0.12);
  const has = new Set(cells.map((k) => `${k.c},${k.r}`));
  const faceOf = (r: number) => (r <= 1 ? tone.light : r <= 4 ? tone.mid : tone.dark);
  const W = cols * cell + pad * 2;
  const H = rows * cell + pad * 2;
  const rect = (k: {c: number; r: number}, dy: number, fill: string, extra?: Record<string, string | number>) => (
    <rect key={`${k.c}-${k.r}-${dy}-${fill}`} x={pad + k.c * cell} y={pad + k.r * cell + dy} width={cell} height={cell} fill={fill} {...extra} />
  );
  const strip = Math.max(4, Math.round(cell * 0.14));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" style={{display: 'block', overflow: 'visible'}}>
      <g stroke="#000" strokeWidth={o * 2} strokeLinejoin="miter">
        {[0, e, 2 * e].map((dy) => cells.map((k) => rect(k, dy, '#000')))}
      </g>
      {cells.map((k) => rect(k, 2 * e, tone.extrude2))}
      {cells.map((k) => rect(k, e, tone.extrude))}
      {cells.map((k) => rect(k, 0, faceOf(k.r)))}
      {cells.map((k) => (has.has(`${k.c},${k.r - 1}`) ? null : <rect key={`t${k.c}-${k.r}`} x={pad + k.c * cell} y={pad + k.r * cell} width={cell} height={strip} fill="#ffffff" opacity={0.55} />))}
      {cells.map((k) => (has.has(`${k.c},${k.r + 1}`) ? null : <rect key={`b${k.c}-${k.r}`} x={pad + k.c * cell} y={pad + (k.r + 1) * cell - strip} width={cell} height={strip} fill="#000" opacity={0.28} />))}
    </svg>
  );
};

/** Polygon with two-step chamfered corners (pixel style). */
const stepPoly = (w: number, h: number, s: number) =>
  `polygon(${2 * s}px 0, ${w - 2 * s}px 0, ${w - 2 * s}px ${s}px, ${w - s}px ${s}px, ${w - s}px ${2 * s}px, ${w}px ${2 * s}px, ${w}px ${h - 2 * s}px, ${w - s}px ${h - 2 * s}px, ${w - s}px ${h - s}px, ${w - 2 * s}px ${h - s}px, ${w - 2 * s}px ${h}px, ${2 * s}px ${h}px, ${2 * s}px ${h - s}px, ${s}px ${h - s}px, ${s}px ${h - 2 * s}px, 0 ${h - 2 * s}px, 0 ${2 * s}px, ${s}px ${2 * s}px, ${s}px ${s}px, ${2 * s}px ${s}px)`;

const Plate: FC<{w: number; h: number; acc: string}> = ({w, h, acc}) => {
  const layer = (inset: number, bg: string, extra?: CSSProperties): CSSProperties => ({position: 'absolute', left: inset, top: inset, width: w - inset * 2, height: h - inset * 2, clipPath: stepPoly(w - inset * 2, h - inset * 2, 14), background: bg, ...extra});
  return (
    <>
      <div style={{...layer(0, 'rgba(0,0,0,0.5)'), top: 18}} />
      <div style={layer(0, '#0c0c12')} />
      <div style={layer(8, acc)} />
      <div style={layer(20, '#181824', {backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 4px, rgba(0,0,0,0) 4px), linear-gradient(90deg, rgba(255,255,255,0.045) 4px, rgba(0,0,0,0) 4px)', backgroundSize: '40px 40px'})} />
      <div style={layer(20, 'rgba(0,0,0,0)', {backgroundImage: `linear-gradient(180deg, ${hexA(acc, 0.22)} 0, rgba(0,0,0,0) 36%, rgba(0,0,0,0) 100%)`})} />
    </>
  );
};

const Hazard: FC<{top?: boolean; f: number; color: string; k: number}> = ({top, f, color, k}) => (
  <div style={{position: 'absolute', left: 0, right: 0, [top ? 'top' : 'bottom']: 0, height: 72, transform: `translateY(${(top ? -1 : 1) * (1 - k) * 72}px)`, overflow: 'hidden', background: '#14141c', borderBottom: top ? `6px solid ${color}` : undefined, borderTop: top ? undefined : `6px solid ${color}`, boxSizing: 'content-box'}}>
    <div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(${top ? 135 : 45}deg, ${color} 0 28px, #14141c 28px 56px)`, backgroundPosition: `${(top ? 1 : -1) * f * 3}px 0`, opacity: 0.95}} />
  </div>
);

const CONFETTI = Array.from({length: 64}, (_, i) => {
  const r = mulberry32(300 + i);
  return {x: 60 + r() * 1800, v: 6 + r() * 10, s: 16 + Math.floor(r() * 3) * 8, c: RAIN[i % RAIN.length], d: r() * 10, sw: r() * 6.28, y0: -r() * 300};
});

/** Props of Countdown. Without `bg` it is transparent and sits on top of your footage. */
export type CountdownProps = {
  /** true = dark Ore background behind (default off). */
  bg?: boolean;
  /** Top chip text for the numbers 3 / 2 / 1 (gets the digit). */
  ready?: (n: string) => string;
  /** Top chip text on GO. */
  go?: string;
};

export const Countdown: FC<CountdownProps> = ({bg, ready = (n) => `准备 · ${n}`, go = 'GO · 开始'}) => {
  const f = useCurrentFrame();
  const bi = f < START ? -1 : Math.min(3, Math.floor((f - START) / BEAT));
  const beat = BEATS[Math.max(0, bi)];
  const lb = bi < 0 ? 0 : f - (START + bi * BEAT);
  const isGo = bi === 3;
  const impact = 5;
  const sinceHit = lb - impact;
  const sc = lb < impact ? lerp(1.35, 1, EASE.in(clamp01(lb / impact))) : 1;
  const sq = sinceHit >= 0 ? Math.exp(-sinceHit / 4) * Math.cos(sinceHit * 0.95) : 0;
  const exitStart = isGo ? 58 : BEAT - 6;
  const ex = clamp01((lb - exitStart) / (isGo ? 16 : 6));
  const a = bi < 0 ? 0 : (lb < 2 ? lb / 2 : 1) * (1 - EASE.in(ex));
  const shake = sinceHit >= 0 && sinceHit < 12 ? (isGo ? 22 : 14) * (1 - sinceHit / 12) : 0;
  const rs = mulberry32(9000 + f);
  const sx = (rs() * 2 - 1) * shake;
  const sy = (rs() * 2 - 1) * shake;
  const pulse = sinceHit >= 0 ? Math.max(0, 1 - sinceHit / 14) : 0;
  const bandK = smooth(0, 8, f);
  const out = prog(f, T11 - 12, 12, EASE.in);
  const goT = isGo ? lb : -1;
  const impactFrame = (i: number) => START + i * BEAT + impact;
  const cell = isGo ? 64 : 80;
  const plateW = isGo ? 1120 : 700;
  const plateH = isGo ? 640 : 700;
  const lit = bi < 0 ? 0 : isGo ? 12 : Math.min(12, Math.floor(clamp01(lb / (BEAT - 4)) * 12 + 0.0001));
  // compression pulse: the whole picture squeezes toward the centre on every hit and springs back
  const squeeze = pulse * 0.035;
  return (
    <AbsoluteFill style={{background: bg ? '#0c0c12' : undefined, overflow: 'hidden'}}>
      {bg && <OreBg tone="dark" />}
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 - squeeze * 0.6}, ${1 - squeeze})`}}>
        {/* corner halftone */}
        {[0, 1, 2, 3].map((c) => (
          <div key={c} style={{position: 'absolute', [c % 2 ? 'right' : 'left']: 0, [c < 2 ? 'top' : 'bottom']: 0, width: 560, height: 400, backgroundImage: `radial-gradient(circle at 50% 50%, ${hexA(beat.acc, 0.5)} 0 6px, rgba(0,0,0,0) 7px)`, backgroundSize: '28px 28px', WebkitMaskImage: `radial-gradient(ellipse at ${c % 2 ? '100%' : '0%'} ${c < 2 ? '0%' : '100%'}, #000 0%, rgba(0,0,0,0) 70%)`, maskImage: `radial-gradient(ellipse at ${c % 2 ? '100%' : '0%'} ${c < 2 ? '0%' : '100%'}, #000 0%, rgba(0,0,0,0) 70%)`, opacity: 0.55}} />
        ))}
        {/* number plate + numerals, centred by flex */}
        {bi >= 0 && a > 0 && (
          <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: a, transform: `scale(${sc * (1 + 0.1 * sq) * (1 + ex * 0.15)}, ${sc * (1 - 0.13 * sq) * (1 + ex * 0.15)})`}}>
            <div style={{position: 'relative', width: plateW, height: plateH, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Plate w={plateW} h={plateH} acc={beat.acc} />
              <div style={{position: 'relative', filter: `drop-shadow(0 0 ${14 + 40 * pulse}px ${hexA(beat.acc, 0.25 + 0.5 * pulse)})`}}>
                <PixelWord word={beat.n} cell={cell} tone={beat.pal} />
              </div>
            </div>
          </AbsoluteFill>
        )}
        {/* segmented progress bar */}
        {bi >= 0 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 926, display: 'flex', justifyContent: 'center', opacity: bandK * (1 - out)}}>
            <div style={{display: 'flex', gap: 10, padding: 14, background: '#0c0c12', border: `6px solid ${beat.acc}`, boxShadow: '0 10px 0 rgba(0,0,0,0.45)'}}>
              {Array.from({length: 12}, (_, i) => {
                const on = i < lit;
                const fresh = on && i === lit - 1 && !isGo;
                const col = isGo ? RAIN[(i + Math.floor(goT / 3)) % RAIN.length] : beat.acc;
                return <div key={i} style={{width: 52, height: 36, background: on ? (fresh ? '#ffffff' : col) : 'rgba(255,255,255,0.1)', boxShadow: on ? `inset 0 6px 0 rgba(255,255,255,0.4), inset 0 -6px 0 rgba(0,0,0,0.3)` : undefined}} />;
              })}
            </div>
          </div>
        )}
        {/* impact bursts */}
        {BEATS.map((b, i) => (
          <div key={i}>
            <Shockwave x={960} y={540} at={impactFrame(i)} color={b.acc} maxR={i === 3 ? 1000 : 640} life={i === 3 ? 26 : 20} width={i === 3 ? 36 : 26} seed={i + 3} />
            <PixelBurst x={960} y={540} at={impactFrame(i)} count={i === 3 ? 100 : 48} colors={[b.acc, '#ffffff', b.pal.light, b.pal.mid]} speed={i === 3 ? 40 : 28} life={i === 3 ? 48 : 34} size={i === 3 ? 20 : 16} gravity={0.4} seed={50 + i} />
          </div>
        ))}
        {/* GO: explosion frames + confetti */}
        {isGo && goT >= 5 && (
          <>
            {goT < 5 + 24 && <Img src={tex(`particle/explosion_${Math.min(15, Math.floor(((goT - 5) / 24) * 16))}.png`)} style={{position: 'absolute', left: 960 - 500, top: 540 - 500, width: 1000, height: 1000, imageRendering: 'pixelated', opacity: 0.9, mixBlendMode: 'screen'}} />}
            {CONFETTI.map((c, i) => {
              const t = goT - 5 - c.d * 0.5;
              if (t < 0) return null;
              const y = c.y0 + t * c.v * 1.2 + 0.18 * t * t;
              const x = c.x + Math.sin(t / 9 + c.sw) * 60;
              return <div key={i} style={{position: 'absolute', left: x, top: y, width: c.s, height: c.s * 0.6, background: c.c, border: '3px solid rgba(0,0,0,0.5)', opacity: 1 - out}} />;
            })}
          </>
        )}
      </AbsoluteFill>
      {/* edge colour pulse on every beat */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, ${hexA(beat.acc, 0.6 * pulse)} 100%)`}} />
      <Hazard top f={f} color={beat.acc} k={bandK} />
      <Hazard f={f} color={beat.acc} k={bandK} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 102, display: 'flex', justifyContent: 'center', opacity: bandK * (1 - out)}}>
        <OreChip color={ORE.text} dot={beat.acc}>
          {isGo ? go : ready(beat.n)}
        </OreChip>
      </div>
      <Flash at={impactFrame(0)} life={5} color="#ffffff" peak={0.3} />
      <Flash at={impactFrame(1)} life={5} color="#ffffff" peak={0.3} />
      <Flash at={impactFrame(2)} life={5} color="#ffffff" peak={0.35} />
      <Flash at={impactFrame(3)} life={7} color="#ffffff" peak={0.5} />
      {BEATS.map((b, i) => (
        <span key={i}>
          <Sfx at={impactFrame(i)} src={mcSound('random/anvil_land')} volume={0.5} rate={1.1 + i * 0.12} />
          <Sfx at={impactFrame(i)} src={reelSfx('impact-cine.mp3')} volume={0.5 + (i === 3 ? 0.25 : 0)} />
          <Sfx at={impactFrame(i) + 1} src={mcSound('random/click')} volume={0.3} rate={0.8 + i * 0.2} />
        </span>
      ))}
      <Sfx at={impactFrame(3)} src={mcSound('random/explode1')} volume={0.45} rate={0.9} />
      <Sfx at={impactFrame(3) + 4} src={mcSound('random/levelup')} volume={0.5} />
      <Sfx at={impactFrame(3) + 8} src={mcSound('ui/toast/challenge_complete')} volume={0.3} />
    </AbsoluteFill>
  );
};

export const countdownEntry: FxEntry = {
  meta: {
    id: 'jump-countdown',
    name: '倒计时 3-2-1-GO',
    category: 'transition',
    tags: ['倒计时', '开始', '节奏', '像素数字'],
    frames: T11,
    blurb: '红、橙、黄三个方块像素数字依次砸在切角底板上：底板落地挤压、整屏压缩脉冲、像素十字与碎片飞溅、边缘色脉冲，底部十二格像素进度条随数字走满；最后绿色“GO”底板变宽，引爆原版爆炸帧与方块彩纸，进度条亮成彩虹。',
    usage: '比赛/挑战开始前、章节正式开始的倒计时；叠加层版本可直接盖在实拍上。数字与底板均按包围盒精确居中。',
    params: [
      {name: 'bg', desc: 'true 为带深色背景的完整演示；省略则只有底板、数字与特效'},
      {name: 'START / BEAT', desc: '起始帧与每个数字的帧数（源码常量，默认 28 帧≈0.93 秒）'},
      {name: 'GLYPHS / BEATS', desc: '5×7 像素字模与每一拍的配色（源码常量）'},
    ],
  },
  Demo: () => <Countdown bg />,
  Layer: () => <Countdown />,
};
