/**
 * mcd-c-day-title - "Day 3 - Dusk" title for survival series: sun/moon block crossing the sky with stepped sky wash and gold light
 * shafts, a hexagon day counter that flips like a clock page (2 -> 3), and the big hard-shadow title with a time-of-day word + pixel icon.
 * Props: day, dayWord (default "第 n 天"), time ('dawn'|'noon'|'dusk'|'night'), timeWord (default per time), dayLabel (small word in the hexagon),
 *        bg (Demo: scene + sky wash + sun + skyline; false = Layer: light streak, shafts and text only), exit.
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE, mulberry32} from '../../../mc/theme';
import {HexBadge, MCD, McdText, PxArt, PxText} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import {CrossFlash, Dim, RiseSparks, fw, ramp, stepped, useFitPx} from './lib';

type TimeKey = 'dawn' | 'noon' | 'dusk' | 'night';

const PRESET: Record<TimeKey, {word: string; color: string; biome: BiomeId; sky: [string, string, string]; alpha: number; sun: [number, number]; ray: string; icon: 'sun' | 'moon'; spark: string[]; rim: string}> = {
  dusk: {word: '黄昏', color: '#FF9A3C', biome: 'desert', sky: ['64,26,104', '188,66,56', '255,160,58'], alpha: 0.85, sun: [1160, 1000], ray: '255,170,60', icon: 'sun', spark: ['#FFB347', '#FF8A2A', '#FFE0A0'], rim: 'rgba(255,150,50,0.7)'},
  dawn: {word: '黎明', color: '#FFD36B', biome: 'forest-day', sky: ['92,120,206', '236,164,150', '255,214,130'], alpha: 0.6, sun: [800, 640], ray: '255,214,120', icon: 'sun', spark: ['#FFE9A0', '#FFC83A', '#FFFFFF'], rim: 'rgba(255,214,130,0.7)'},
  noon: {word: '正午', color: '#FFF0A0', biome: 'forest-day', sky: ['70,150,232', '140,200,250', '236,246,255'], alpha: 0.35, sun: [330, 330], ray: '255,240,160', icon: 'sun', spark: ['#FFF6C0', '#FFE680', '#FFFFFF'], rim: 'rgba(255,240,170,0.5)'},
  night: {word: '深夜', color: '#9CC8FF', biome: 'forest-night', sky: ['6,10,34', '20,30,80', '48,70,140'], alpha: 0.8, sun: [380, 520], ray: '150,190,255', icon: 'moon', spark: ['#CFE4FF', '#9CC8FF', '#FFFFFF'], rim: 'rgba(150,190,255,0.55)'},
};

const SUN_ROWS = ['....y....', '.y..y..y.', '..yyyyy..', '..yyyyy..', 'yyyyyyyyy', '..yyyyy..', '..yyyyy..', '.y..y..y.', '....y....'];
const MOON_ROWS = ['..mmmm...', '.mmmm....', 'mmmm.....', 'mmmm.....', 'mmmm.....', 'mmmm.....', '.mmmm...m', '..mmmmmm.'];

const lerpC = (a: string, b: string, t: number) => {
  const A = a.split(',').map(Number);
  const B = b.split(',').map(Number);
  return A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',');
};

const Skyline: FC<{rim: string}> = ({rim}) => {
  const rnd = mulberry32(5);
  const cols: {x: number; h: number}[] = [];
  let h = 70;
  for (let x = 0; x < 1920; x += 48) {
    h = Math.max(30, Math.min(120, h + Math.round((rnd() - 0.5) * 3) * 24));
    cols.push({x, h});
  }
  return (
    <AbsoluteFill>
      {cols.map((c) => (
        <div key={c.x} style={{position: 'absolute', left: c.x, bottom: 0, width: 48, height: c.h + 50, background: '#0A0710'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 48, height: 4, background: rim}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, background: '#06040A'}} />
    </AbsoluteFill>
  );
};

export const DayTitle: FC<{day?: number; dayWord?: string; time?: TimeKey; timeWord?: string; dayLabel?: string; bg?: boolean; audio?: boolean; exit?: number; cjkRows?: number}> = ({
  day = 3,
  dayWord,
  time = 'dusk',
  timeWord,
  dayLabel = 'DAY',
  bg = true,
  audio = true,
  exit = 122,
  cjkRows = 32,
}) => {
  const f = useCurrentFrame();
  const P = PRESET[time];
  const word = dayWord ?? `第 ${fw(String(day))} 天`;
  const tw = timeWord ?? P.word;
  const out = stepped(ramp(f, exit, exit + 16), 6);
  const wash = stepped(ramp(f, 0, 12), 6) * (1 - out);
  const pxMain = useFitPx(word, 620, 5, {cjkRows}, 2);
  const pxTime = useFitPx(tw, 420, 5, {cjkRows}, 2);
  // hex: pops, then the number flips from day-1 to day
  const pop = EASE.back(ramp(f, 4, 14));
  const fl1 = ramp(f, 16, 22);
  const fl2 = ramp(f, 22, 32);
  const scaleY = f < 22 ? 1 - EASE.in(fl1) : EASE.back(fl2);
  const num = f < 22 ? day - 1 : day;
  const wordT = ramp(f, 20, 34);
  const timeT = ramp(f, 28, 40);
  // sun / moon path
  const sunT = ramp(f, 0, exit + 10);
  const sx = P.sun[0] + (time === 'night' ? sunT * 160 : time === 'noon' ? sunT * 120 : -sunT * 120);
  const sy = time === 'dusk' ? P.sun[1] - 520 + sunT * 520 : time === 'dawn' ? P.sun[1] + 40 - sunT * 340 : time === 'night' ? P.sun[1] - sunT * 60 : P.sun[1] + sunT * 30;
  const sunSize = time === 'night' ? 130 : 150;
  const pulse = 0.85 + 0.15 * Math.sin((f / 60) * Math.PI * 2);
  const skyBands = Array.from({length: 8}, (_, i) => {
    const t = i / 7;
    const c = t < 0.55 ? lerpC(P.sky[0], P.sky[1], t / 0.55) : lerpC(P.sky[1], P.sky[2], (t - 0.55) / 0.45);
    return `rgb(${c}) ${(i / 8) * 100}%, rgb(${c}) ${((i + 1) / 8) * 100}%`;
  }).join(', ');
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={4} src={mcSound('ui/toast/in')} volume={0.3} />
          <Sfx at={22} src={mcSound('random/click')} volume={0.35} rate={0.9} />
          <Sfx at={30} src={mcSound('random/orb')} volume={0.22} rate={0.9} />
        </>
      )}
      {bg && <ScenePlate biome={P.biome} camera="drift" />}
      {bg && <AbsoluteFill style={{background: `linear-gradient(to bottom, ${skyBands})`, opacity: P.alpha * wash, mixBlendMode: 'multiply'}} />}
      {bg && <AbsoluteFill style={{background: `radial-gradient(circle at ${sx}px ${sy}px, rgba(${P.ray},0.62) 0, rgba(${P.ray},0.3) 200px, rgba(${P.ray},0.08) 520px, rgba(${P.ray},0) 800px)`, mixBlendMode: 'screen', opacity: wash * (0.85 + 0.15 * Math.sin((f / 60) * Math.PI * 2))}} />}
      {/* sun / moon block */}
      {bg && (
        <div style={{position: 'absolute', left: sx - sunSize / 2, top: sy - sunSize / 2, width: sunSize, height: sunSize, opacity: wash}}>
          <div style={{position: 'absolute', inset: -sunSize * 0.2, background: `rgba(${P.ray},${0.3 * pulse})`}} />
          <div style={{position: 'absolute', inset: 0, background: time === 'night' ? '#E8F0FF' : '#FFF3B0', boxShadow: time === 'night' ? 'inset -16px -16px 0 #AFC4EE, inset 16px 16px 0 #FFFFFF' : 'inset -16px -16px 0 #FFD060, inset 16px 16px 0 #FFFFE0'}} />
        </div>
      )}
      {/* light shafts: wedges fanning away from the sun */}
      {bg && (
        <AbsoluteFill style={{opacity: wash, overflow: 'hidden', mixBlendMode: 'screen'}}>
          {[-52, -30, -11, 9, 28, 49].map((ang, i) => {
            const up = sy > 560;
            const len = 1500;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: sx - 150 - (i % 2 ? 40 : 0),
                  top: up ? sy - len : sy,
                  width: 300 + (i % 2) * 80,
                  height: len,
                  transformOrigin: up ? '50% 100%' : '50% 0',
                  transform: `rotate(${ang + 2.5 * Math.sin((f / 90) * Math.PI * 2 + i)}deg)`,
                  clipPath: up ? 'polygon(46% 100%, 54% 100%, 100% 0, 0 0)' : 'polygon(0 100%, 100% 100%, 54% 0, 46% 0)',
                  background: `linear-gradient(to ${up ? 'top' : 'bottom'}, rgba(${P.ray},${0.27 + 0.08 * Math.sin((f / 60) * Math.PI * 2 + i * 1.7)}), rgba(${P.ray},0) 85%)`,
                }}
              />
            );
          })}
        </AbsoluteFill>
      )}
      {bg && <Skyline rim={P.rim} />}
      {/* horizon light streak, also used by the Layer */}
      <div style={{position: 'absolute', left: 960 - 900 * stepped(ramp(f, 2, 20), 8), width: 1800 * stepped(ramp(f, 2, 20), 8), top: bg ? 984 : 540, height: bg ? 6 : 6, background: `linear-gradient(to right, rgba(${P.ray},0), rgba(${P.ray},0.95) 35%, #FFF6D0 50%, rgba(${P.ray},0.95) 65%, rgba(${P.ray},0))`, opacity: (1 - out) * 0.9}} />
      {bg && <Dim kind="edges" a={0.5} size={0.5} color="4,3,10" style={{opacity: wash}} />}
      <RiseSparks count={34} seed={37} area={[100, 220, 1720, 760]} colors={P.spark} alpha={0.9 * (1 - out)} />
      {!bg && <AbsoluteFill style={{top: 340, height: 400, bottom: undefined, background: 'linear-gradient(to bottom, rgba(4,3,10,0), rgba(4,3,10,0.42) 30%, rgba(4,3,10,0.42) 70%, rgba(4,3,10,0))', opacity: 1 - out}} />}
      {/* title */}
      <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: bg ? 280 : 60, opacity: 1 - out, transform: `translateY(${out * -30}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 56}}>
          <div style={{transform: `scale(${0.4 + 0.6 * pop})`, opacity: f < 4 ? 0 : 1}}>
            <HexBadge w={200} ring="#C99A2E" ringHi="#FCD448" fill="#0C0C10" glow="rgba(252,212,72,0.3)">
              <McdText size={26} weight={800} color={MCD.gold} style={{letterSpacing: 5, lineHeight: 1, marginBottom: 10}}>
                {dayLabel}
              </McdText>
              <div style={{transform: `scaleY(${Math.max(0.02, scaleY)})`, transformOrigin: '50% 50%'}}>
                <PxText text={num} px={10} gap={2} />
              </div>
            </HexBadge>
          </div>
          <div style={{overflow: 'hidden', clipPath: `inset(-20px ${(1 - wordT) * 100}% -20px 0)`}}>
            <div style={{transform: `translateX(${(1 - EASE.out(wordT)) * -90}px)`, paddingRight: 12}}>
              <PxText text={word} px={pxMain} cjkRows={cjkRows} color="#FFFFFF" shadow={1} shadowColor="#10101A" />
            </div>
          </div>
          <div style={{opacity: stepped(timeT, 4), transform: `translateX(${(1 - EASE.out(timeT)) * 70}px)`, display: 'flex', alignItems: 'center', gap: 36}}>
            <div style={{width: 10, height: 120, background: MCD.goldBright, boxShadow: '5px 5px 0 #6A3F10'}} />
            <PxArt rows={P.icon === 'sun' ? SUN_ROWS : MOON_ROWS} pal={P.icon === 'sun' ? {y: '#FFD84A'} : {m: '#DCE8FF'}} px={9} style={{filter: 'drop-shadow(5px 5px 0 #2A1600)'}} />
            <PxText text={tw} px={pxTime} cjkRows={cjkRows} color={P.color} shadow={1} shadowColor="#2A1600" />
          </div>
        </div>
      </AbsoluteFill>
      <CrossFlash x={560} y={bg ? 330 : 440} at={26} size={90} />
    </AbsoluteFill>
  );
};
