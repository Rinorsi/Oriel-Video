import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, Shockwave} from '../../../mc/Fx';
import {PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE} from '../../../mg/Ore';
import {mcSound} from '../../../reel/kit';
import {Bracket, Confetti, H, Hazard, PX, Stage, W, bold, lerp, pr, Sfx} from './ui';

/**
 * Big countdown (transparent overlay): 5-4-3-2-1 then "开始!".
 * Every number is a 7x9 block-pixel digit drawn from squares, so it is centred by construction (full-width flex container,
 * whole-cell sizes). It slams onto a chamfered square plate with a screen-compress pulse, a pixel shard Shockwave and a short shake;
 * a segmented pixel timer under the plate drains over the second. The last word "开始!" widens the plate and sprays confetti.
 * Props: from (first number, default 5), go (final word), colors (per-number fills), goColor (colour of the final word),
 *   topLabel / bottomLabel (small captions in the hazard bars), goTag (right caption of the bars on the final word),
 *   dim (backdrop darkness multiplier), frames (total length; default = 14 + 30 * from + 66).
 */

const LEAD = 14;
const STEP = 30;
export const COUNTDOWN_FRAMES = LEAD + STEP * 5 + 66;

const COLORS = ['#6cc349', '#e5c317', '#f8af2b', '#ff7a3c', '#ff4d5e'];
const DARK: Record<string, string> = {'#6cc349': '#2d6a1c', '#e5c317': '#8a7408', '#f8af2b': '#8a5a0a', '#ff7a3c': '#8f3a10', '#ff4d5e': '#7d1428', '#ffd35a': '#8a5a0a'};

/** Dark shade for custom colours that have no entry in DARK. */
const darken = (c: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  if (!m) return '#222';
  const n = parseInt(m[1], 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * 0.45).toString(16).padStart(2, '0');
  return '#' + ch(16) + ch(8) + ch(0);
};

const CELL = 40; // one digit pixel, screen px
const GAP = 1; // blank cells between digits

const GLYPHS: Record<string, string[]> = {
  '0': ['0111110', '1111111', '1100011', '1100011', '1100011', '1100011', '1100011', '1111111', '0111110'],
  '1': ['0001100', '0011100', '0111100', '0001100', '0001100', '0001100', '0001100', '0011110', '0111111'],
  '2': ['0111110', '1111111', '1100011', '0000011', '0001110', '0111100', '1110000', '1111111', '1111111'],
  '3': ['0111110', '1111111', '1100011', '0000111', '0001110', '0000111', '1100011', '1111111', '0111110'],
  '4': ['0000110', '0001110', '0011110', '0110110', '1100110', '1111111', '1111111', '0000110', '0000110'],
  '5': ['1111111', '1111111', '1100000', '1111110', '1111111', '0000011', '1100011', '1111111', '0111110'],
  '6': ['0011110', '0111100', '1110000', '1111110', '1111111', '1100011', '1100011', '1111111', '0111110'],
  '7': ['1111111', '1111111', '0000011', '0000110', '0001100', '0011000', '0011000', '0011000', '0011000'],
  '8': ['0111110', '1111111', '1100011', '0111110', '0111110', '1100011', '1100011', '1111111', '0111110'],
  '9': ['0111110', '1111111', '1100011', '1100011', '1111111', '0111111', '0000011', '0001111', '0111100'],
};

/** Staircase-cornered polygon (two steps of `s` px), the "chamfered block" silhouette. */
const stepClip = (w: number, h: number, s: number): string => {
  const p = [
    [0, 2 * s], [s, 2 * s], [s, s], [2 * s, s], [2 * s, 0],
    [w - 2 * s, 0], [w - 2 * s, s], [w - s, s], [w - s, 2 * s], [w, 2 * s],
    [w, h - 2 * s], [w - s, h - 2 * s], [w - s, h - s], [w - 2 * s, h - s], [w - 2 * s, h],
    [2 * s, h], [2 * s, h - s], [s, h - s], [s, h - 2 * s], [0, h - 2 * s],
  ];
  return `polygon(${p.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
};

/** Plate: black rim, dark body, tinted inner band, bright top edge. Centred in its parent by the caller. */
const Plate: FC<{w: number; h: number; color: string; style?: CSSProperties}> = ({w, h, color, style}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <div style={{position: 'absolute', left: 16, top: 20, width: w, height: h, background: 'rgba(0,0,0,0.5)', clipPath: stepClip(w, h, 16)}} />
    <div style={{position: 'absolute', inset: 0, background: '#000', clipPath: stepClip(w, h, 16)}} />
    <div style={{position: 'absolute', left: 8, top: 8, width: w - 16, height: h - 16, background: '#242426', clipPath: stepClip(w - 16, h - 16, 12)}} />
    <div style={{position: 'absolute', left: 16, top: 16, width: w - 32, height: h - 32, background: color, opacity: 0.16, clipPath: stepClip(w - 32, h - 32, 8)}} />
    <div style={{position: 'absolute', left: 40, top: 8, width: w - 80, height: 8, background: color}} />
    <div style={{position: 'absolute', left: 40, bottom: 8, width: w - 80, height: 8, background: 'rgba(0,0,0,0.6)'}} />
  </div>
);

/** A number made of square cells: outline pass, drop-shadow pass, colour pass with highlight / shade rows. */
const BlockDigits: FC<{text: string; color: string}> = ({text, color}) => {
  const chars = text.split('');
  const cols = chars.length * 7 + (chars.length - 1) * GAP;
  const cells: {x: number; y: number; top: boolean; bottom: boolean}[] = [];
  chars.forEach((ch, ci) => {
    const g = GLYPHS[ch] ?? GLYPHS['0'];
    g.forEach((row, y) =>
      row.split('').forEach((v, x) => {
        if (v !== '1') return;
        cells.push({x: ci * (7 + GAP) + x, y, top: !(g[y - 1] && g[y - 1][x] === '1'), bottom: !(g[y + 1] && g[y + 1][x] === '1')});
      }),
    );
  });
  const dark = DARK[color] ?? darken(color);
  const o = 6;
  return (
    <div style={{position: 'relative', width: cols * CELL, height: 9 * CELL, flex: 'none'}}>
      {cells.map((c, i) => (
        <div key={`s${i}`} style={{position: 'absolute', left: c.x * CELL + 12, top: c.y * CELL + 12, width: CELL, height: CELL, background: 'rgba(0,0,0,0.45)'}} />
      ))}
      {cells.map((c, i) => (
        <div key={`o${i}`} style={{position: 'absolute', left: c.x * CELL - o, top: c.y * CELL - o, width: CELL + o * 2, height: CELL + o * 2, background: '#000'}} />
      ))}
      {cells.map((c, i) => (
        <div key={`f${i}`} style={{position: 'absolute', left: c.x * CELL, top: c.y * CELL, width: CELL, height: CELL, background: color}}>
          {c.top && <div style={{position: 'absolute', left: 0, top: 0, width: CELL, height: 8, background: 'rgba(255,255,255,0.55)'}} />}
          {c.bottom && <div style={{position: 'absolute', left: 0, bottom: 0, width: CELL, height: 8, background: dark}} />}
        </div>
      ))}
    </div>
  );
};

/** Final word in the pixel font. Full-width flex row + textAlign centre; size is a multiple of 12. */
const GoWord: FC<{text: string; size: number; color: string}> = ({text, size, color}) => (
  <div style={{width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
    <span style={{fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, whiteSpace: 'pre', color, WebkitFontSmoothing: 'none', textShadow: bold(size / 24, '#000', size / 12, DARK[color] ?? darken(color), 'rgba(0,0,0,0.45)'), transform: 'translate(16px, -18px)'}}>{text}</span>
  </div>
);

const centred: CSSProperties = {position: 'absolute', left: 0, top: 0, width: W, height: H, display: 'flex', justifyContent: 'center', alignItems: 'center'};

export const CountdownBig: FC<{bg?: boolean; from?: number; go?: string; colors?: string[]; goColor?: string; topLabel?: string; bottomLabel?: string; goTag?: string; dim?: number; frames?: number}> = ({
  bg,
  from = 5,
  go = '开始!',
  colors = COLORS,
  goColor = '#ffd35a',
  topLabel = '倒计时',
  bottomLabel = '准备好了吗',
  goTag = 'GO',
  dim = 1,
  frames,
}) => {
  const f = useCurrentFrame();
  const N = frames ?? LEAD + STEP * from + 66;
  const total = from;
  const goAt = LEAD + STEP * total;
  const k = Math.floor((f - LEAD) / STEP);
  const inGo = f >= goAt;
  const local = inGo ? f - goAt : f - LEAD - k * STEP;
  const active = f >= LEAD;
  const idx = Math.max(0, Math.min(k, total - 1));
  const num = String(from - idx);
  const col = inGo ? goColor : colors[idx % colors.length];
  const outAll = pr(f, N - 14, 12, EASE.in);
  const fadeIn = pr(f, 0, LEAD);
  const vis = fadeIn * (1 - outAll);

  // slam: starts big, lands at local 5, small damped rebound, then rests at exactly 1
  const slamT = clamp01(local / 5);
  const rebound = local >= 5 ? Math.exp(-(local - 5) / 4) * Math.cos((local - 5) * 0.9) * 0.1 : 0;
  const slam = !active ? 0 : lerp(inGo ? 2.4 : 1.9, 1, slamT * slamT);
  const leave = inGo ? outAll : pr(local, STEP - 6, 6, EASE.in);
  const digitScale = (slam + rebound) * (1 - leave * 0.25);
  const plateScale = (lerp(1.18, 1, EASE.out(slamT)) + rebound * 0.5) * (1 - leave * 0.06);
  const op = (active ? clamp01(local / 2) : 0) * (1 - leave);

  // screen-compress pulse: the whole frame squeezes in on impact, bars thicken, then springs back
  const age = local - 5;
  const bump = active && age >= 0 && age < 14 ? Math.exp(-age / 3.5) : 0;
  const squeeze = 1 - bump * (inGo ? 0.05 : 0.03);
  const shakeK = active && age >= 0 && age < 12 ? (1 - age / 12) * (inGo ? 18 : 10) : 0;
  const r = mulberry32(f * 13 + 5);
  const shx = Math.round((shakeK * (r() * 2 - 1)) / 2) * 2;
  const shy = Math.round((shakeK * (r() * 2 - 1)) / 2) * 2;

  const remain = total - (inGo ? total : Math.max(0, k));
  const impactAt = (n: number) => LEAD + n * STEP + 5;

  // segmented timer under the plate
  const SEG = 20;
  const lit = inGo ? SEG : active ? Math.ceil(SEG * (1 - clamp01((local - 4) / (STEP - 6)))) : 0;
  const plateW = inGo ? 1160 : 600;
  const plateH = inGo ? 480 : 600;
  const barY = H / 2 + plateH / 2 + 44;

  return (
    <Stage bg={bg}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(6,8,16,${0.3 * vis * dim}) 0%, rgba(2,3,8,${0.78 * vis * dim}) 100%)`}} />
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px) scale(${squeeze})`, transformOrigin: '50% 50%'}}>
        {/* top / bottom hazard bars (thicken on impact) */}
        {[0, 1].map((p) => (
          <div key={p} style={{position: 'absolute', left: 0, right: 0, [p ? 'bottom' : 'top']: 0, height: 72 + Math.round(bump * 12) , transform: `translateY(${(p ? 1 : -1) * (1 - vis) * 100}px)`, background: ORE.surface3, boxShadow: `0 ${p ? -4 : 4}px 0 #000`}}>
            <Hazard w={W} h={16} f={f * (p ? -3 : 3)} size={16} style={{position: 'absolute', left: 0, [p ? 'top' : 'bottom']: 0}} />
            <div style={{position: 'absolute', left: 96, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
              <PX size={36} color={ORE.dim}>{p ? bottomLabel : topLabel}</PX>
            </div>
            <div style={{position: 'absolute', right: 96, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
              <PX size={36} color={col}>{inGo ? goTag : `T-${String(remain).padStart(2, '0')}`}</PX>
            </div>
          </div>
        ))}
        {/* pips left and right */}
        {[0, 1].map((side) => (
          <div key={side} style={{position: 'absolute', [side ? 'right' : 'left']: 96, top: 200, bottom: 200, width: 56, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', opacity: vis}}>
            {Array.from({length: total}, (_, i) => {
              const alive = inGo ? true : i >= total - remain;
              const cur = !inGo && i === total - remain;
              return <div key={i} style={{height: 96, background: alive ? colors[(total - 1 - i) % colors.length] : '#1e1e1f', boxShadow: `0 0 0 4px #000, inset 0 8px 0 ${alive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)'}, inset 0 -8px 0 rgba(0,0,0,0.3)`, opacity: alive ? (cur && Math.floor(f / 4) % 2 ? 0.75 : 1) : 0.5}} />;
            })}
          </div>
        ))}
        {/* plate */}
        {active && (
          <div style={{...centred, opacity: op}}>
            <Plate w={plateW} h={plateH} color={col} style={{transform: `scale(${plateScale})`}} />
          </div>
        )}
        {/* the number / final word */}
        {active && (
          <div style={{...centred, opacity: op}}>
            <div style={{transform: `scale(${digitScale})`}}>{inGo ? <GoWord text={go} size={240} color={col} /> : <BlockDigits text={num} color={col} />}</div>
          </div>
        )}
        {/* segmented timer */}
        {active && (
          <div style={{position: 'absolute', left: 0, top: barY, width: W, display: 'flex', justifyContent: 'center', gap: 6, opacity: op}}>
            {Array.from({length: SEG}, (_, i) => (
              <div key={i} style={{width: 30, height: 24, background: i < lit ? col : '#1e1e1f', boxShadow: `0 0 0 4px #000, inset 0 6px 0 ${i < lit ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)'}`}} />
            ))}
          </div>
        )}
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <Bracket key={c} corner={c} inset={108} size={64} color={col} thick={10} style={{opacity: vis}} />
        ))}
      </AbsoluteFill>
      {Array.from({length: total + 1}, (_, n) => {
        const goN = n === total;
        const c = goN ? goColor : colors[n % colors.length];
        const at = impactAt(n);
        return (
          <div key={n}>
            <Shockwave x={W / 2} y={H / 2} at={at} color={c} maxR={goN ? 900 : 560} life={goN ? 24 : 18} width={goN ? 30 : 20} rays={goN ? 20 : 14} seed={n + 1} />
            <Flash at={at} life={goN ? 10 : 5} peak={goN ? 0.45 : 0.16} />
            <Sfx at={at - 2} src={mcSound('random/click')} volume={0.4} rate={goN ? 1.6 : 0.7 + n * 0.12} />
            <Sfx at={at} src={mcSound('dig/stone1')} volume={0.55} rate={goN ? 0.6 : 0.7 + n * 0.08} />
            <Sfx at={at} src={mcSound(goN ? 'random/levelup' : 'random/anvil_land')} volume={goN ? 0.5 : 0.28} rate={goN ? 1 : 1.3 + n * 0.1} />
          </div>
        );
      })}
      <Confetti at={goAt + 4} life={64} count={80} colors={['#ffd35a', '#ff4d5e', '#6cc349', '#55ffff', '#ff55ff', '#fff']} seed={31} size={16} />
      <Sfx at={goAt + 6} src={mcSound('random/explode3')} volume={0.28} rate={1.5} cut={20} />
    </Stage>
  );
};
