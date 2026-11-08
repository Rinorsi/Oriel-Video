import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE} from '../../../mg/Ore';
import {ItemImg, mcSound} from '../../../reel/kit';
import {Bolt, Confetti, Halftone, Icon, PX, Shine, Slab, Sparkles, Stage, W, H, back, bold, lerp, pr, spring, Sfx} from './ui';

/**
 * Attribute comparison (transparent overlay): two items, butterfly bars growing from the middle, numbers counting up,
 * winner of each row lights up gold (loser dims), a VS badge slams in, a verdict banner closes the clip.
 * Props:
 *   left / right : {id (item id), name, tag, color}
 *   rows         : [{label, l, r, max, dec?}]  (values are compared as numbers; equal = tie)
 *   title        : header text
 *   ratings      : [left, right] filled gold squares out of 5 (default [4, 5])
 *   vs           : badge text; winSuffix / tieText : verdict wording; dim : backdrop darkness multiplier; frames : total length
 *   leftColors / rightColors : bar fill [main, highlight, shade]
 */

export const COMPARE_FRAMES = 230;

export type CompareSide = {id: string; name: string; tag: string; color: string};
export type CompareRow = {label: string; l: number; r: number; max: number; dec?: number};

const LEFT: CompareSide = {id: 'diamond_sword', name: '钻石剑', tag: '锋利 V', color: '#55ffff'};
const RIGHT: CompareSide = {id: 'netherite_sword', name: '下界合金剑', tag: '锋利 V', color: '#d58bff'};
const ROWS: CompareRow[] = [
  {label: '攻击伤害', l: 7, r: 8, max: 10},
  {label: '耐久', l: 1561, r: 2031, max: 2400},
  {label: '攻击速度', l: 1.6, r: 1.6, max: 2, dec: 1},
  {label: '抗击退', l: 0, r: 0.1, max: 0.2, dec: 1},
];

const fmt = (v: number, dec = 0) => (dec ? v.toFixed(dec) : String(Math.round(v)));

const BarRow: FC<{row: CompareRow; at: number; f: number; sideColor: [string, string, string]; dir: 1 | -1; value: number; win: boolean; lose: boolean; w: number}> = ({row, at, f, sideColor, dir, value, win, lose, w}) => {
  const t = pr(f, at, 30, EASE.out);
  const len = Math.round((w * clamp01((value / row.max) * t)) / 4) * 4;
  const hi = pr(f, at + 34, 10);
  const pulse = win ? 0.5 + 0.5 * Math.sin(f / 3) : 0;
  const c0 = win ? lerp(0, 1, hi) : 0;
  return (
    <div style={{position: 'relative', width: w, height: 64, background: '#0c0c0e', boxShadow: '0 0 0 4px #000, 0 4px 0 4px rgba(255,255,255,0.12)', opacity: lose ? 1 - 0.45 * hi : 1}}>
      <div style={{position: 'absolute', [dir === 1 ? 'left' : 'right']: 0, top: 0, bottom: 0, width: len, background: win && c0 > 0.5 ? '#f8af2b' : sideColor[0], boxShadow: `inset 0 10px 0 ${win && c0 > 0.5 ? '#ffe08a' : sideColor[1]}, inset 0 -10px 0 ${win && c0 > 0.5 ? '#b07a14' : sideColor[2]}`, filter: lose && hi > 0.5 ? 'saturate(0.35)' : undefined}} />
      {win && c0 > 0 && len > 8 && (
        <div style={{position: 'absolute', [dir === 1 ? 'left' : 'right']: 0, top: 0, bottom: 0, width: len, overflow: 'hidden'}}>
          <Shine p={pr(f, at + 34, 18, (x) => x)} strength={1.4} />
          <div style={{position: 'absolute', inset: 0, background: `rgba(255,255,255,${pulse * 0.12})`}} />
        </div>
      )}
      {Array.from({length: 9}, (_, i) => (
        <div key={i} style={{position: 'absolute', top: 0, bottom: 0, [dir === 1 ? 'left' : 'right']: ((i + 1) / 10) * w - 2, width: 4, background: 'rgba(0,0,0,0.35)'}} />
      ))}
    </div>
  );
};

export const CompareBars: FC<{bg?: boolean; left?: CompareSide; right?: CompareSide; rows?: CompareRow[]; title?: string; ratings?: [number, number]; vs?: string; winSuffix?: string; tieText?: string; dim?: number; frames?: number; leftColors?: [string, string, string]; rightColors?: [string, string, string]}> = ({
  bg,
  left = LEFT,
  right = RIGHT,
  rows = ROWS,
  title = '属性对比',
  ratings = [4, 5],
  vs: vsText = 'VS',
  winSuffix = ' 胜出',
  tieText = '势均力敌',
  dim = 1,
  frames = COMPARE_FRAMES,
  leftColors = ['#2d9fcf', '#8fe9ff', '#14607f'],
  rightColors = ['#9a58e0', '#e2b8ff', '#5a2a96'],
}) => {
  const f = useCurrentFrame();
  const N = frames;
  const outP = pr(f, N - 26, 22, EASE.in);
  const inP = back(pr(f, 0, 16, (t) => t));
  const PW = 1780;
  const PH = 900;
  const PX0 = (W - PW) / 2;
  const PY0 = (H - PH) / 2 + 10;
  const BW = 480;
  const rowStart = (i: number) => 52 + i * 20;
  const rowY = (i: number) => 372 + i * 106;
  const wins = rows.map((r) => (r.l > r.r ? 'l' : r.r > r.l ? 'r' : 't'));
  const lw = wins.filter((x) => x === 'l').length;
  const rw = wins.filter((x) => x === 'r').length;
  const winner = lw > rw ? left : rw > lw ? right : null;
  const verdictAt = rowStart(rows.length - 1) + 50;
  const vs = pr(f, 24, 8, (t) => t * t);
  const vsScale = f < 24 ? 0 : f < 32 ? lerp(4, 1, vs) : 1 + Math.max(0, 0.12 * Math.sin((f - 32) / 3) * Math.exp(-(f - 32) / 18));
  const colL = leftColors;
  const colR = rightColors;
  const card = (side: CompareSide, which: 0 | 1) => {
    const at = 10 + which * 4;
    const e = spring(pr(f, at, 22, (t) => t), 8, 4.5);
    const win = winner === side;
    const bob = Math.sin(f / 10 + which * 2) * 6;
    return (
      <div style={{position: 'absolute', left: which ? PW - 60 - 460 : 60, top: 70, width: 460, height: 250, transform: `translateY(${(1 - e) * -400}px) rotate(${(1 - e) * (which ? 14 : -14)}deg)`}}>
        <Slab w={460} h={250} tone="panel_glass" shadow={10} style={{boxShadow: win && f > verdictAt ? '0 0 0 4px #000, 0 0 60px 12px rgba(248,175,43,0.7)' : undefined}}>
          <Halftone color={side.color} opacity={0.12} />
          <div style={{position: 'absolute', left: 32, top: 40, width: 170, height: 170}}>
            <Slab w={170} h={170} tone="panel" shadow={4}>
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${bob}px) rotate(${Math.sin(f / 16 + which) * 6}deg)`}}>
                <ItemImg id={side.id} size={128} />
              </div>
              <Shine p={pr(f, at + 20, 20, (t) => t)} />
            </Slab>
          </div>
          <div style={{position: 'absolute', left: 224, top: 52}}>
            <PX size={48} color={side.color} shadow="rgba(0,0,0,0.6)">
              {side.name}
            </PX>
          </div>
          <div style={{position: 'absolute', left: 224, top: 118}}>
            <PX size={36} color={ORE.dim}>
              {side.tag}
            </PX>
          </div>
          <div style={{position: 'absolute', left: 224, top: 170, display: 'flex', gap: 8}}>
            {Array.from({length: 5}, (_, i) => (
              <div key={i} style={{width: 24, height: 24, background: i < ratings[which] ? '#f8af2b' : '#1e1e1f', boxShadow: '0 0 0 4px #000, inset 0 -4px 0 rgba(0,0,0,0.35)'}} />
            ))}
          </div>
        </Slab>
      </div>
    );
  };
  return (
    <Stage bg={bg}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(6,8,18,${0.55 * dim * pr(f, 0, 12) * (1 - outP)})`}} />
      <div style={{position: 'absolute', left: PX0, top: PY0, width: PW, height: PH, transform: `translateY(${(1 - Math.min(1, inP)) * 500 + outP * 600}px) scale(${0.92 + 0.08 * Math.min(1, inP)})`, opacity: 1 - outP}}>
        <Slab w={PW} h={PH} tone="panel_raised" shadow={16}>
          <Halftone color="#000" opacity={0.12} />
          <Bolt x={28} y={28} />
          <Bolt x={PW - 28} y={28} />
          <Bolt x={28} y={PH - 28} />
          <Bolt x={PW - 28} y={PH - 28} />
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <Shine p={pr(f, 14, 26, (t) => t)} />
          </div>
          {/* centre title */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center', opacity: pr(f, 8, 10)}}>
            <PX size={60} color="#fff">{title}</PX>
          </div>
          <div style={{position: 'absolute', left: PW / 2 - 160, top: 110, width: 320, height: 8, background: ORE.gold, boxShadow: '0 0 0 4px #000', transform: `scaleX(${pr(f, 12, 16)})`}} />
        </Slab>
        {card(left, 0)}
        {card(right, 1)}
        {/* VS badge */}
        <div style={{position: 'absolute', left: PW / 2 - 100, top: 156, width: 200, height: 200, transform: `scale(${vsScale}) rotate(${f < 32 ? (1 - vs) * 20 : 0}deg)`, opacity: f < 24 ? 0 : 1}}>
          <div style={{position: 'absolute', inset: 10, background: '#c92a45', boxShadow: '0 0 0 8px #000, inset 0 12px 0 rgba(255,255,255,0.3), inset 0 -12px 0 rgba(0,0,0,0.3)', transform: 'rotate(45deg)'}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <PX size={96} color="#fff" shadow={false} style={{textShadow: bold(6, '#000', 6, '#000')}}>{vsText}</PX>
          </div>
        </div>
        {/* centre divider */}
        <div style={{position: 'absolute', left: PW / 2 - 2, top: 360, width: 4, height: 460 * pr(f, 40, 30), background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0 16px, transparent 16px 32px)'}} />
        {/* rows */}
        {rows.map((r, i) => {
          const at = rowStart(i);
          const win = wins[i];
          const rowIn = back(pr(f, at - 6, 10, (t) => t));
          const t = pr(f, at, 30, EASE.out);
          const hi = pr(f, at + 34, 10);
          const numBump = (w: boolean) => (w ? 1 + 0.25 * hi * Math.exp(-(f - at - 34) / 14) * (f > at + 34 ? 1 : 0) : 1);
          return (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: rowY(i), height: 64, opacity: rowIn > 0 ? 1 : 0, transform: `scale(${0.9 + 0.1 * Math.min(1, rowIn)})`}}>
              {/* left bar grows leftwards from the label */}
              <div style={{position: 'absolute', left: PW / 2 - 130 - BW, top: 0}}>
                <BarRow row={r} at={at} f={f} sideColor={colL} dir={-1} value={r.l} win={win === 'l'} lose={win === 'r'} w={BW} />
              </div>
              <div style={{position: 'absolute', left: PW / 2 + 130, top: 0}}>
                <BarRow row={r} at={at} f={f} sideColor={colR} dir={1} value={r.r} win={win === 'r'} lose={win === 'l'} w={BW} />
              </div>
              {/* label */}
              <div style={{position: 'absolute', left: PW / 2 - 110, width: 220, top: -4, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1f', boxShadow: '0 0 0 4px #000, inset 0 4px 0 #48494a'}}>
                <PX size={36} color={win === 't' ? ORE.dim : '#fff'}>{r.label}</PX>
              </div>
              {/* numbers */}
              <div style={{position: 'absolute', left: 60, width: PW / 2 - 130 - BW - 60 - 20, top: -6, textAlign: 'right', transform: `scale(${numBump(win === 'l')})`, transformOrigin: '100% 50%'}}>
                <PX size={72} color={win === 'l' && hi > 0.5 ? '#ffd35a' : win === 'r' && hi > 0.5 ? '#8c8d90' : '#fff'}>{fmt(r.l * t, r.dec)}</PX>
              </div>
              <div style={{position: 'absolute', left: PW / 2 + 130 + BW + 20, top: -6, transform: `scale(${numBump(win === 'r')})`, transformOrigin: '0% 50%'}}>
                <PX size={72} color={win === 'r' && hi > 0.5 ? '#ffd35a' : win === 'l' && hi > 0.5 ? '#8c8d90' : '#fff'}>{fmt(r.r * t, r.dec)}</PX>
              </div>
              {/* winner marker */}
              {win !== 't' && hi > 0 && (
                <div style={{position: 'absolute', top: 10, [win === 'l' ? 'left' : 'right']: PW / 2 - 110 - 70 - (win === 'l' ? 0 : 0), transform: `scale(${back(hi)})`}}>
                  <Icon name="up" px={6} color="#f8af2b" outline="#000" />
                </div>
              )}
            </div>
          );
        })}
        {/* verdict */}
        <div style={{position: 'absolute', left: 140, right: 140, bottom: 36, height: 96, transform: `translateY(${(1 - back(pr(f, verdictAt, 14, (t) => t))) * 160}px) scale(${spring(pr(f, verdictAt, 16, (t) => t), 8, 4)})`, opacity: f >= verdictAt ? 1 : 0}}>
          <Slab w={PW - 280} h={96} tone="panel_glass" shadow={8} style={{boxShadow: '0 0 0 4px #f8af2b, 0 8px 0 4px rgba(0,0,0,0.55)'}}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28}}>
              <Icon name="crown" px={6} outline="#000" />
              <PX size={60} color={winner?.color ?? '#fff'} shadow="rgba(0,0,0,0.6)">
                {winner ? `${winner.name}${winSuffix}` : tieText}
              </PX>
              <PX size={60} color="#ffd35a" shadow="rgba(0,0,0,0.6)">{`${Math.max(lw, rw)} : ${Math.min(lw, rw)}`}</PX>
              <Icon name="crown" px={6} outline="#000" />
            </div>
            <Shine p={pr(f, verdictAt + 6, 22, (t) => t)} />
          </Slab>
        </div>
      </div>
      <Shockwave x={W / 2} y={PY0 + 256} at={32} color="#ff4d5e" maxR={700} life={16} width={18} />
      <Flash at={32} life={5} peak={0.25} />
      {rows.map((_, i) => (
        <div key={i}>
          <Sfx at={rowStart(i)} src={mcSound('random/click')} volume={0.25} rate={1 + i * 0.1} />
          <Sfx at={rowStart(i) + 34} src={mcSound('random/orb')} volume={0.28} rate={0.9 + i * 0.1} />
          {wins[i] !== 't' && (
            <PixelBurst x={wins[i] === 'l' ? PX0 + PW / 2 - 130 - BW * 0.1 : PX0 + PW / 2 + 130 + BW * 0.1} y={PY0 + rowY(i) + 32} at={rowStart(i) + 34} count={14} colors={['#f8af2b', '#ffe08a', '#fff']} speed={12} life={22} size={10} seed={i + 40} />
          )}
        </div>
      ))}
      <Sfx at={10} src={mcSound('ui/toast/in')} volume={0.35} />
      <Sfx at={32} src={mcSound('random/anvil_land')} volume={0.45} rate={1.2} />
      <Sfx at={verdictAt} src={mcSound('random/levelup')} volume={0.4} />
      <Confetti at={verdictAt + 2} life={70} count={50} colors={['#f8af2b', '#ffe08a', '#fff', '#d58bff', '#55ffff']} seed={77} size={14} />
      <Sparkles x={PX0} y={PY0} w={PW} h={PH} count={8} seed={19} px={5} color="#ffe08a" at={verdictAt} />
    </Stage>
  );
};
