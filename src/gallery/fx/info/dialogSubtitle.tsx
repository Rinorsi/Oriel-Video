import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, PlayerFace} from '../../../mg/Ore';
import {mcSound} from '../../../reel/kit';
import {Halftone, Motes, PX, Shine, Slab, Stage, W, back, bold, pr, spring, Sfx} from './ui';

/**
 * Dialogue subtitle (transparent overlay): two speakers, a bubble that points at whoever talks, text typed out character by
 * character with a tiny speaking shake, a tone mark (! ? … ♪) popping above the bubble, a talking bounce on the portrait,
 * a "continue" arrow when the line is done.
 * Props:
 *   speakers : [{name, skin, color}] (index 0 = left, 1 = right)
 *   lines    : [{who: 0|1, text, tone: 'shout' | 'ask' | 'dots' | 'happy'}]
 *   dim      : bottom shade darkness multiplier; frames : total length (default 18 + 62 per line + ~58 tail, i.e. 300 for 4 lines)
 */

export const DIALOG_FRAMES = 300;

export type DialogSpeaker = {name: string; skin: string; color: string};
export type DialogLine = {who: 0 | 1; text: string; tone: 'shout' | 'ask' | 'dots' | 'happy'};

const SPEAKERS: DialogSpeaker[] = [
  {name: '史蒂夫', skin: 'entity/player/wide/steve.png', color: '#ffd35a'},
  {name: '艾利克斯', skin: 'entity/player/wide/alex.png', color: '#ff8fc0'},
];
const LINES: DialogLine[] = [
  {who: 0, text: '小心！前面有一只苦力怕！', tone: 'shout'},
  {who: 1, text: '放心，我早就准备好了……', tone: 'dots'},
  {who: 0, text: '你确定？它已经开始冒烟了？', tone: 'ask'},
  {who: 1, text: '哈哈，看我的！', tone: 'happy'},
];

const LEAD = 18;
const PER = 62;
const CPS = 1.5; // frames per character

const Tone: FC<{tone: DialogLine['tone']; age: number; color: string; f: number}> = ({tone, age, color, f}) => {
  const pop = spring(clamp01(age / 14), 9, 4.5);
  const r = mulberry32(f);
  const big = (txt: string, col: string, dx = 0, dy = 0) => (
    <PX size={192} color={col} shadow={false} style={{textShadow: bold(8, '#000', 10, '#000'), transform: `translate(${dx}px, ${dy}px)`, display: 'inline-block'}}>
      {txt}
    </PX>
  );
  let node: ReactNode;
  if (tone === 'shout') node = big('!', '#ff5555', (r() - 0.5) * 8, (r() - 0.5) * 8);
  else if (tone === 'ask') node = big('?', '#55ffff', 0, Math.sin(f / 5) * 8);
  else if (tone === 'happy') node = big('♪', '#ff8fc0', 0, Math.sin(f / 4) * 10);
  else
    node = (
      <div style={{display: 'flex', gap: 20}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 36, height: 36, background: '#e8e8e8', boxShadow: '0 0 0 6px #000', opacity: clamp01((age - 6 - i * 6) / 4), transform: `translateY(${Math.sin(f / 5 + i) * 6}px)`}} />
        ))}
      </div>
    );
  return (
    <div style={{transform: `scale(${pop}) rotate(${tone === 'shout' ? -8 : tone === 'happy' ? 8 : 0}deg)`, transformOrigin: '50% 100%'}}>{node}</div>
  );
};

export const DialogSubtitle: FC<{bg?: boolean; speakers?: DialogSpeaker[]; lines?: DialogLine[]; dim?: number; frames?: number}> = ({bg, speakers = SPEAKERS, lines = LINES, dim = 1, frames}) => {
  const f = useCurrentFrame();
  const N = frames ?? LEAD + lines.length * PER + (DIALOG_FRAMES - LEAD - 4 * PER);
  const outP = pr(f, N - 22, 18, EASE.in);
  const inP = pr(f, 0, 14);
  const startOf = (i: number) => LEAD + i * PER;
  const li = Math.max(0, Math.min(lines.length - 1, Math.floor((f - LEAD) / PER)));
  const line = lines[li];
  const age = f - startOf(li);
  const typedN = Math.max(0, Math.floor(age / CPS) - 4);
  const full = line.text.length;
  const shown = Math.min(full, typedN);
  const speaking = f >= LEAD && shown < full && age > 4;
  const sp = speakers[line.who];
  const BX = 400;
  const BW = W - 800;
  const BY = 610;
  const BH = 270;
  const sw = line.who === 0 ? -1 : 1;
  const bubbleIn = spring(clamp01(age / 14), 8, 4.5);
  const jx = speaking ? (Math.sin(f * 2.7) * 2 + (mulberry32(f)() - 0.5) * 3) : 0;
  const jy = speaking ? Math.cos(f * 3.1) * 2 : 0;
  return (
    <Stage bg={bg}>
      <AbsoluteFill style={{background: `linear-gradient(0deg, rgba(6,8,18,${0.82 * dim * inP * (1 - outP)}) 0%, rgba(6,8,18,${0.55 * dim * inP * (1 - outP)}) 30%, rgba(6,8,18,0) 62%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${line.who === 0 ? '12%' : '88%'} 80%, ${sp.color}33 0%, rgba(0,0,0,0) 45%)`, opacity: inP * (1 - outP)}} />
      <Motes x={0} y={500} w={W} h={560} count={22} seed={7} colors={[sp.color, '#fff']} size={8} rise={0.8} opacity={inP * (1 - outP)} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - inP) * 160 + outP * 200}px)`}}>
        {/* portraits */}
        {speakers.map((s, i) => {
          const active = line.who === i;
          const bob = active && speaking ? -Math.abs(Math.sin(f * 0.55)) * 14 : 0;
          const sc = active ? 1.06 : 0.92;
          const enterX = (i ? 1 : -1) * (1 - back(pr(f, 2 + i * 4, 14, (t) => t))) * 400;
          return (
            <div key={i} style={{position: 'absolute', left: i ? W - 130 - 240 : 130, top: 600, width: 240, height: 300, transform: `translate(${enterX}px, ${bob}px) scale(${sc})`, transformOrigin: '50% 100%', filter: active ? undefined : 'brightness(0.55) saturate(0.7)'}}>
              <Slab w={240} h={240} tone="panel_glass" shadow={10} style={{boxShadow: active ? `0 0 0 4px ${s.color}, 0 0 40px 6px ${s.color}66, 0 10px 0 4px rgba(0,0,0,0.5)` : undefined}}>
                <Halftone color={s.color} opacity={0.2} />
                <div style={{position: 'absolute', left: 24, top: 24}}>
                  <PlayerFace size={192} skin={s.skin} />
                </div>
                <Shine p={active ? pr(age, 2, 20, (t) => t) : 0} />
              </Slab>
              <div style={{position: 'absolute', left: 0, right: 0, top: 244, display: 'flex', justifyContent: 'center'}}>
                <div style={{height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', background: '#1e1e1f', boxShadow: `0 0 0 4px #000, inset 0 -6px 0 ${s.color}`}}>
                  <PX size={36} color={s.color}>{s.name}</PX>
                </div>
              </div>
              {/* talking ticks */}
              {active && speaking &&
                [-1, 0, 1].map((k) => (
                  <div key={k} style={{position: 'absolute', top: 40 + k * 44, [i ? 'left' : 'right']: -48 - (Math.floor(f / 3) % 2) * 8, width: 28, height: 8, background: s.color, boxShadow: '0 0 0 3px #000', transform: `rotate(${(i ? 1 : -1) * k * 24}deg)`}} />
                ))}
            </div>
          );
        })}
        {/* bubble */}
        <div key={li} style={{position: 'absolute', left: BX, top: BY, width: BW, height: BH, transform: `translate(${jx}px, ${jy}px) scale(${bubbleIn})`, transformOrigin: `${line.who === 0 ? '0%' : '100%'} 70%`}}>
          <Slab w={BW} h={BH} tone="panel_raised" shadow={14}>
            <Halftone color="#000" opacity={0.1} />
            <div style={{position: 'absolute', [line.who === 0 ? 'left' : 'right']: 0, top: 0, bottom: 0, width: 16, background: sp.color, boxShadow: '0 0 0 4px #000'}} />
            <div style={{position: 'absolute', left: 52, right: 52, top: 40}}>
              <span style={{fontFamily: PIXEL_FONT, fontSize: 72, lineHeight: '96px', color: '#fff', whiteSpace: 'pre-wrap', textShadow: '6px 6px 0 rgba(0,0,0,0.55)'}}>
                <span>{line.text.slice(0, shown)}</span>
                <span style={{opacity: 0}}>{line.text.slice(shown)}</span>
              </span>
            </div>
            <div style={{position: 'absolute', left: 52, bottom: 26, display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{width: 20, height: 20, background: sp.color, boxShadow: '0 0 0 4px #000'}} />
              <PX size={32} color={ORE.dim}>{sp.name}</PX>
            </div>
            {shown >= full && (
              <div style={{position: 'absolute', right: 44, bottom: 22 + Math.abs(Math.sin(f / 5)) * 10, width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: `28px solid ${sp.color}`}} />
            )}
            <Shine p={pr(age, 8, 22, (t) => t)} strength={0.8} />
          </Slab>
          {/* pointer toward the speaker */}
          <div style={{position: 'absolute', [line.who === 0 ? 'left' : 'right']: -52, top: 100, width: 64, height: 72, background: '#000', clipPath: line.who === 0 ? 'polygon(100% 0, 0 50%, 100% 100%)' : 'polygon(0 0, 100% 50%, 0 100%)'}} />
          <div style={{position: 'absolute', [line.who === 0 ? 'left' : 'right']: -36, top: 112, width: 48, height: 48, background: '#313233', clipPath: line.who === 0 ? 'polygon(100% 0, 0 50%, 100% 100%)' : 'polygon(0 0, 100% 50%, 0 100%)'}} />
          {/* tone mark */}
          <div style={{position: 'absolute', [line.who === 0 ? 'left' : 'right']: 30, top: -150}}>
            <Tone tone={line.tone} age={age - 2} color={sp.color} f={f} />
          </div>
        </div>
      </div>
      {/* typing blips */}
      {lines.map((ln, i) =>
        Array.from({length: Math.ceil(ln.text.length / 2)}, (_, k) => (
          <Sfx key={`${i}-${k}`} at={startOf(i) + Math.round((k * 2 + 4) * CPS)} src={mcSound('random/click')} volume={0.12} rate={ln.who === 0 ? 0.85 : 1.35} cut={4} />
        )),
      )}
      {lines.map((ln, i) => (
        <Sfx key={i} at={startOf(i)} src={mcSound(ln.tone === 'shout' ? 'random/pop' : ln.tone === 'ask' ? 'random/orb' : 'random/pop')} volume={0.3} rate={ln.tone === 'shout' ? 0.7 : ln.tone === 'ask' ? 1.4 : 1.1} />
      ))}
    </Stage>
  );
};
