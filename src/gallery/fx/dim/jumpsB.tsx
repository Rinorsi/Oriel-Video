import type {FC} from 'react';
import {AbsoluteFill, Img, Sequence, useCurrentFrame} from 'remotion';
import {Flash, LightRays, PixelBurst, Shockwave} from '../../../mc/Fx';
import {item, tex} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreChip, OreText, TYPE, U, nine} from '../../../mg/Ore';
import {LowRes} from '../../../mg/LowRes';
import {OreBg, Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import type {FxEntry} from '../../types';
import {BandTitle, Cam, blockUrl, hexA, lerp, mod, smooth, type TitlePalette} from './kit';
import {countdownEntry} from './countdown';
import {OverworldCanvas} from './scenes';

/**
 * Jumps B:
 *   jump-time-skip : fast day/night time-lapse (three days in two seconds) with a spinning vanilla clock, a day counter and
 *                    streaking clouds, then bars slam in and the big "三天后" card lands with a bang.
 *   jump-countdown : moved to countdown.tsx.
 * `bg` = full demo; without it only the graphics are drawn on transparent. Tunables: text and beat frames at the top of each component.
 */

const gold = '#ffc93a';

// ================================================================ 10. time skip

export const T10 = 160;
export const SLAM = 90;

/** Props of SkipCard (time-skip card). Without `bg` it is transparent and sits on top of your footage. */
export type SkipCardProps = {
  /** true = draw the demo overworld day/night time-lapse behind (default off). */
  bg?: boolean;
  /** The big text that slams in. */
  big?: string;
  /** English / small subtitle under the big text. */
  sub?: string;
  /** How many days the clock races through. */
  days?: number;
  /** Text before the day counter number. */
  dayPrefix?: string;
  /** Text after the day counter number. */
  daySuffix?: string;
  /** Four labels under the sun/moon bar. */
  marks?: [string, string, string, string];
  /** Final chip text from the day number. */
  footer?: (day: number) => string;
};

export const SkipCard: FC<SkipCardProps> = ({bg, big = '三天后', sub = 'THREE DAYS LATER', days = 3, dayPrefix = '第', daySuffix = '天', marks = ['日出', '正午', '日落', '午夜'], footer = (d) => `第 ${d} 天 · 正午`}) => {
  const f = useCurrentFrame();
  const span = clamp01((f - 14) / 62);
  const u = EASE.inOut(span);
  const tod = 0.25 + days * u;
  const speed = 6 * span * (1 - span) * 4; // 0..~6, how fast time runs now
  const dayNo = 1 + Math.floor(tod);
  const dayPos = Math.floor(tod) - 1 + (Math.floor(tod) >= 1 ? EASE.out(clamp01((tod % 1) / 0.1)) : 1);
  const clockIdx = Math.floor(mod(tod, 1) * 64);
  const slam = f - SLAM;
  const out = prog(f, T10 - 16, 16, EASE.in);
  const bars = f >= SLAM - 2 ? EASE.in(clamp01((f - (SLAM - 2)) / 4)) * (1 - out) : 0;
  const dim = smooth(SLAM - 4, SLAM + 2, f) * (1 - out) * 0.58;
  const clockIn = EASE.back(clamp01((f - 4) / 12));
  const toTop = EASE.out(clamp01((slam - 2) / 12));
  const clockY = lerp(470, 244, toTop);
  const clockS = lerp(1, 0.4, toTop);
  const shake = slam >= 3 && slam < 16 ? 26 * (1 - (slam - 3) / 13) : 0;
  const rs = mulberry32(8000 + f);
  const sx = (rs() * 2 - 1) * shake;
  const sy = (rs() * 2 - 1) * shake;
  const tIn = slam < 0 ? 0 : slam < 5 ? EASE.in(slam / 5) : 1;
  const ts = slam < 0 ? 1.45 : lerp(1.45, 1, tIn);
  const land = slam >= 5 ? slam - 5 : -1;
  const sq = land >= 0 ? Math.exp(-land / 5) * Math.cos(land * 0.9) : 0;
  const dayTick = Math.sin(Math.min(1, ((tod % 1) / 0.08)) * Math.PI) * (f > 14 && f < 80 ? 1 : 0);
  const panelOut = 1 - smooth(SLAM - 4, SLAM + 4, f);
  const stripOff = f * (4 + speed * 30);
  const night = Math.max(0, -Math.sin(tod * Math.PI * 2));
  return (
    <AbsoluteFill style={{background: bg ? '#000' : undefined, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {bg && (
          <Cam zoom={1 + 0.02 * speed / 6 + 0.04 * smooth(SLAM, SLAM + 30, f)} fx={960} fy={540}>
            <OverworldCanvas tod={tod} f={f * (1 + speed * 3)} frame ps={2} />
          </Cam>
        )}
        <AbsoluteFill style={{background: `rgba(6,10,30,${dim})`}} />
        {/* speed streaks and film columns */}
        <LowRes
          ready
          draw={(ctx) => {
            const a = clamp01(speed / 3) * (1 - smooth(76, 86, f));
            if (a <= 0) return;
            const r = mulberry32(12);
            for (let i = 0; i < 44; i++) {
              const y = Math.floor(r() * 150) + 12;
              const len = 40 + r() * 200 * (speed / 4);
              const x = mod(r() * 700 + f * (8 + speed * 10) * (0.5 + r()), 700) - 120;
              ctx.fillStyle = `rgba(255,255,255,${a * (0.15 + r() * 0.3)})`;
              ctx.fillRect(Math.round(x), y, Math.round(len), 1);
            }
          }}
        />
        {[44, 1920 - 44 - 56].map((x, ci) => (
          <div key={x} style={{position: 'absolute', left: x, top: 0, width: 56, height: 1080, overflow: 'hidden', opacity: clockIn * panelOut * 0.9}}>
            {Array.from({length: 16}, (_, i) => {
              const y = mod(i * 76 + (ci ? 1 : -1) * stripOff, 16 * 76) - 76;
              const sun = i % 2 === 0;
              return <div key={i} style={{position: 'absolute', left: 0, top: y, width: 56, height: 56, background: sun ? '#ffd45a' : '#5a6fb8', border: '6px solid #14141c', boxSizing: 'border-box', boxShadow: `inset 0 6px 0 ${sun ? '#fff3b0' : '#9fb0ea'}, 0 6px 0 rgba(0,0,0,0.35)`}} />;
            })}
          </div>
        ))}
        {/* day counter */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', opacity: clockIn * panelOut, transform: `translateY(${(1 - clockIn) * -80}px) scale(${1 + 0.1 * dayTick})`}}>
          <div style={{...nine('panel_raised', [2, 2, 2, 2]), padding: `${3 * U}px ${8 * U}px`, display: 'flex', alignItems: 'center', gap: 5 * U, boxShadow: '0 12px 0 rgba(0,0,0,0.45)'}}>
            <OreText size={TYPE.body} color={ORE.dim}>
              {dayPrefix}
            </OreText>
            <div style={{height: 96, width: 96, overflow: 'hidden', display: 'flex', justifyContent: 'center'}}>
              <div style={{transform: `translateY(${-Math.max(0, dayPos) * 96}px)`}}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} style={{height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <OreText size={TYPE.h1} color={gold} shadow>
                      {String(n)}
                    </OreText>
                  </div>
                ))}
              </div>
            </div>
            <OreText size={TYPE.body} color={ORE.dim}>
              {daySuffix}
            </OreText>
          </div>
        </div>
        {/* clock */}
        <div style={{position: 'absolute', left: 960 - 220, top: clockY - 220, width: 440, height: 440, transform: `scale(${clockIn * clockS}) rotate(${(1 - clockIn) * -120}deg)`}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(8,10,24,0.72)', border: `12px solid ${gold}`, boxSizing: 'border-box', boxShadow: `0 16px 0 rgba(0,0,0,0.5), 0 0 ${40 + 80 * dayTick}px ${hexA(gold, 0.55)}, inset 0 0 0 6px #14141c`}} />
          {Array.from({length: 12}, (_, i) => (
            <div key={i} style={{position: 'absolute', left: 220 - 6, top: 220 - 6, width: 12, height: i % 3 === 0 ? 34 : 20, background: i % 3 === 0 ? '#fff' : '#c4a64a', transformOrigin: `6px ${i % 3 === 0 ? 6 : 6}px`, transform: `rotate(${i * 30}deg) translateY(-190px)`}} />
          ))}
          <Img src={item(`clock_${String(clockIdx).padStart(2, '0')}`)} style={{position: 'absolute', left: 60, top: 60, width: 320, height: 320, imageRendering: 'pixelated', filter: `drop-shadow(0 8px 0 rgba(0,0,0,0.5)) brightness(${1 + night * 0.1})`}} />
        </div>
        {/* sun / moon indicator under the clock */}
        <div style={{position: 'absolute', left: 960 - 300, top: 730, width: 600, padding: '16px 40px 12px', boxSizing: 'border-box', background: 'rgba(8,10,24,0.72)', border: '6px solid #14141c', boxShadow: '0 8px 0 rgba(0,0,0,0.4)', opacity: clockIn * panelOut}}>
          <div style={{position: 'relative', height: 40}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 16, height: 8, background: 'rgba(0,0,0,0.5)', border: '2px solid #14141c'}} />
            <div style={{position: 'absolute', left: 0, width: `${mod(tod, 1) * 100}%`, top: 16, height: 8, background: `linear-gradient(90deg, #5a6fb8, ${gold}, #ff8a3c, #5a6fb8)`}} />
            <div style={{position: 'absolute', left: `${mod(tod, 1) * 100}%`, top: 4, width: 32, height: 32, marginLeft: -16, background: Math.sin(tod * Math.PI * 2) > 0 ? '#ffd45a' : '#cfe0ff', border: '4px solid #14141c', boxSizing: 'border-box'}} />
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8}}>
            {marks.map((m, i) => (
              <OreText key={i} size={TYPE.small} color={ORE.dim}>
                {m}
              </OreText>
            ))}
          </div>
        </div>
        {/* title slam */}
        {slam >= 0 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', opacity: (slam < 1 ? 0 : 1) * (1 - out), transform: `scale(${ts * (1 + 0.16 * sq)}, ${ts * (1 - 0.22 * sq)})`, transformOrigin: '50% 70%', filter: `drop-shadow(0 0 ${20 + 50 * Math.max(0, 1 - land / 20)}px ${hexA(gold, 0.6)})`}}>
            <BandTitle size={336} tone="gold">
              {big}
            </BandTitle>
          </div>
        )}
        {slam >= 8 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, opacity: prog(slam, 8, 10, EASE.out) * (1 - out), transform: `translateY(${(1 - prog(slam, 8, 12, EASE.out)) * 30}px)`}}>
            <div style={{width: 220 * prog(slam, 10, 14), height: 6, background: `linear-gradient(90deg, rgba(0,0,0,0), ${gold})`}} />
            <OreText size={TYPE.h1 * 0.5} color="#fff" style={{letterSpacing: 18, marginRight: -18, textShadow: `4px 4px 0 #000, 0 0 24px ${hexA(gold, 0.6)}`}}>
              {sub}
            </OreText>
            <div style={{width: 220 * prog(slam, 10, 14), height: 6, background: `linear-gradient(270deg, rgba(0,0,0,0), ${gold})`}} />
          </div>
        )}
        {slam >= 14 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 872, display: 'flex', justifyContent: 'center', opacity: prog(slam, 14, 10, EASE.out) * (1 - out)}}>
            <OreChip color={ORE.text} dot={gold}>
              {footer(dayNo)}
            </OreChip>
          </div>
        )}
      </AbsoluteFill>
      {/* cinema bars slam in */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: '#000', transform: `translateY(${-(1 - bars) * 120}px)`, borderBottom: `${6 * bars}px solid ${gold}`, boxSizing: 'content-box'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: '#000', transform: `translateY(${(1 - bars) * 120}px)`, borderTop: `${6 * bars}px solid ${gold}`, boxSizing: 'content-box'}} />
      {slam >= 3 && slam < 40 && <Shockwave x={960} y={560} at={SLAM + 5} color="#fff1c0" maxR={1100} life={22} width={32} />}
      <Sequence from={SLAM + 5} durationInFrames={45}>
        <PixelBurst x={960} y={560} at={0} count={70} colors={[gold, '#ffffff', '#ffe27a', '#ff9a3a']} speed={36} life={40} size={16} gravity={0.5} seed={91} />
      </Sequence>
      <Flash at={SLAM + 5} life={8} color="#fff3c0" peak={0.75} />
      <Vignette s={0.25 + 0.3 * smooth(SLAM, SLAM + 10, f)} color="0,0,10" />
      <Sfx at={4} src={mcSound('random/pop')} volume={0.45} rate={1.1} />
      {Array.from({length: days}, (_, i) => (
        <Sfx key={i} at={22 + i * 20} src={mcSound('random/click')} volume={0.28} rate={1.2 + i * 0.15} />
      ))}
      <Sfx at={SLAM + 4} src={mcSound('random/anvil_land')} volume={0.6} rate={0.8} />
      <Sfx at={SLAM + 5} src={mcSound('random/explode2')} volume={0.25} rate={1.1} />
      <Sfx at={SLAM + 12} src={mcSound('ui/toast/challenge_complete')} volume={0.25} />
    </AbsoluteFill>
  );
};

export const jumpBEntries: FxEntry[] = [
  {
    meta: {
      id: 'jump-time-skip',
      name: '时间跳转（三天后）',
      category: 'transition',
      tags: ['时间跳转', '三天后', '昼夜', '时钟'],
      frames: T10,
      blurb: '原版时钟飞速转动，日月交替、云层飞掠，“第 N 天”计数器翻页，两侧日夜色块滚动；快转三天后黑边猛地合上，“三天后”大字砸落并带冲击波，副标题与“第 4 天 · 正午”收尾。',
      usage: '“三天后 / 一个月后 / 第二天清晨”这类时间跳转，叠在任意镜头上也能用。',
      params: [
        {name: 'bg', desc: 'true 为带昼夜世界的完整演示；省略则只有时钟、计数器、大字与黑边'},
        {name: 'big / sub / days', desc: '大字（如“一个月后”）、英文副标题、快转的天数'},
      ],
    },
    Demo: () => <SkipCard bg />,
    Layer: () => <SkipCard />,
  },
  countdownEntry,
];

