// mcd-v-day-counter: "Survival day N" title. A big hexagon holds the day number; the old number scrolls out and the new one rolls in
// in hard steps, the ring turns from steel to gold with a pixel cross flash and debris, golden sun rays slant in from the upper right,
// and (in the demo) the night scene cross-fades into daylight. Caption and small facts rise underneath.
// Props: day, label ('DAY'), caption, facts (small chips), bg (night->day scenes + pixel sun), flipAt (frame the number changes).
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {Embers, HexBadge, MCD, McdText, PxText, WhiteFlash, useTextSize} from '../mcdkit/kit';
import {ScenePlate} from '../mcdscene';
import {Burst, BulletDiamond, CrossFlash, GoldRule, Label, Rise, stepQ, win} from './common';

const pxFor = (n: number) => {
  const len = String(n).length;
  return len <= 2 ? 14 : len === 3 ? 10 : 8;
};

const Num: FC<{n: number; px: number; color: string}> = ({n, px, color}) => {
  const s = useTextSize(String(n), {px});
  return (
    <div style={{width: s?.w ?? 100, height: s?.h ?? 100, display: 'flex'}}>
      <PxText text={n} px={px} color={color} hi="#FFFFFF" />
    </div>
  );
};

export const DayCounter: FC<{
  bg?: boolean;
  day?: number;
  label?: string;
  caption?: string;
  facts?: string[];
  flipAt?: number;
  /** 六边形左侧小牌文字，默认「生存模式」 */
  leftTag?: string;
  /** 六边形右侧小牌文字，默认「困难难度」 */
  rightTag?: string;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, day = 42, label = 'DAY', caption = '太阳又升起来了，继续活下去', facts = ['据点 3 个', '钻石 28 颗', '死亡 0 次'], flipAt = 44, leftTag = '生存模式', rightTag = '困难难度', audio = true}) => {
  const f = useCurrentFrame();
  const px = pxFor(day);
  const sz = useTextSize(String(day), {px});
  const winH = (sz?.h ?? 130) + 24;
  const flipT = win(f, flipAt, 9);
  const flipStep = stepQ(EASE.out(flipT), 3);
  const flipped = f >= flipAt;
  const hexW = 400;
  const hexH = (hexW * 2) / Math.sqrt(3);
  const cx = 960;
  const cy = 450;
  // sunrise progression 0..1
  const sun = EASE.inOut(win(f, 18, 64));
  const rayA = 0.7 * sun * (0.82 + 0.18 * Math.sin(f * 0.16)) * stepQ(1, 1);
  const rays = [
    {a: 22, w: 150, k: 1.0},
    {a: 34, w: 90, k: 0.7},
    {a: 46, w: 210, k: 0.85},
    {a: 58, w: 110, k: 0.6},
    {a: 70, w: 160, k: 0.75},
  ];
  const sunX = 1560;
  const sunY = 150;
  const ringHi = flipped ? '#FCE693' : '#8E98A6';
  const ring = flipped ? '#E8A81C' : '#4A5260';
  return (
    <AbsoluteFill>
      {bg && (
        <AbsoluteFill style={{background: '#06080C'}}>
          <ScenePlate biome="forest-night" camera="static" />
          <AbsoluteFill style={{background: 'rgba(8,12,26,0.3)'}} />
          <div style={{position: 'absolute', inset: 0, opacity: stepQ(sun, 12)}}>
            <ScenePlate biome="forest-day" camera="static" />
            <AbsoluteFill style={{background: 'rgba(255,150,60,0.16)'}} />
          </div>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,0,0,${0.5 - 0.22 * sun}), rgba(0,0,0,0) 70%)`}} />
        </AbsoluteFill>
      )}
      {/* warm light from the upper right */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 70% at 88% 0%, rgba(255,176,70,${0.55 * sun}), rgba(255,120,40,${0.18 * sun}) 40%, rgba(0,0,0,0) 72%)`}} />
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {rays.map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sunX - r.w / 2,
              top: sunY,
              width: r.w,
              height: 1600,
              transformOrigin: '50% 0%',
              transform: `rotate(${r.a}deg)`,
              background: 'linear-gradient(180deg, rgba(255,214,120,0.9), rgba(255,180,80,0.4) 35%, rgba(255,160,60,0))',
              opacity: stepQ(rayA * r.k * (0.8 + 0.2 * Math.sin(f * 0.1 + i * 1.7)), 10),
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </AbsoluteFill>
      {/* pixel sun (Minecraft texture) */}
      {bg && (
        <div style={{position: 'absolute', left: sunX - 150, top: sunY - 150 + (1 - sun) * 260, width: 300, height: 300, opacity: stepQ(win(f, 10, 20), 5)}}>
          <div style={{position: 'absolute', inset: 56, background: '#FFE9A0', boxShadow: '0 0 110px 40px rgba(255,190,80,0.8)'}} />
          <div style={{position: 'absolute', inset: 84, background: '#FFFBE8'}} />
        </div>
      )}

      {/* wings */}
      <div style={{position: 'absolute', left: 190, top: cy - 8, opacity: win(f, 10, 12)}}>
        <GoldRule w={Math.round(360 * win(f, 10, 14))} />
      </div>
      <div style={{position: 'absolute', right: 190, top: cy - 8, opacity: win(f, 10, 12)}}>
        <GoldRule w={Math.round(360 * win(f, 10, 14))} />
      </div>
      <div style={{position: 'absolute', left: 190, top: cy + 30, opacity: win(f, 24, 10), background: 'rgba(8,8,14,0.78)', padding: '8px 22px', boxShadow: 'inset 0 0 0 3px #3A3A40'}}>
        <Label color="#E4E6EA" size={28}>{leftTag}</Label>
      </div>
      <div style={{position: 'absolute', right: 190, top: cy + 30, opacity: win(f, 24, 10), background: 'rgba(8,8,14,0.78)', padding: '8px 22px', boxShadow: 'inset 0 0 0 3px #3A3A40'}}>
        <Label color="#E4E6EA" size={28}>{rightTag}</Label>
      </div>

      {/* hexagon */}
      <div style={{position: 'absolute', left: cx - hexW / 2, top: cy - hexH / 2, transform: `scale(${EASE.back(win(f, 2, 10)) * (1 + (flipped ? 0.1 * clamp01(1 - (f - flipAt) / 8) : 0))})`, transformOrigin: '50% 50%'}}>
        <HexBadge w={hexW} ring={ring} ringHi={ringHi} fill="#0C0E14" ringW={22} outlineW={8} glow={flipped ? 'rgba(255,190,70,0.55)' : 'rgba(120,140,170,0.3)'}>
          <PxText text={label} px={5} color={flipped ? MCD.goldBright : '#9AA4B2'} shadowColor="#050202" />
          <div style={{height: winH, overflow: 'hidden', marginTop: 8, position: 'relative', width: 300, display: 'flex', justifyContent: 'center'}}>
            {/* outgoing number */}
            <div style={{position: 'absolute', top: 12 + Math.round(flipStep * -winH), left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: flipStep < 1 ? 1 : 0}}>
              <Num n={day - 1} px={px} color="#9AA4B2" />
            </div>
            {/* incoming number */}
            <div style={{position: 'absolute', top: 12 + Math.round((1 - flipStep) * winH), left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              <Num n={day} px={px} color={flipStep >= 1 ? MCD.goldBright : '#fff'} />
            </div>
          </div>
        </HexBadge>
      </div>

      {/* caption + facts */}
      <div style={{position: 'absolute', left: 340, width: 1240, top: cy + hexH / 2 + 20, height: 206, opacity: stepQ(win(f, flipAt + 6, 8), 4), background: 'linear-gradient(90deg, rgba(6,8,14,0), rgba(6,8,14,0.74) 14%, rgba(6,8,14,0.74) 86%, rgba(6,8,14,0))'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: cy + hexH / 2 + 42, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <Rise at={flipAt + 10} dur={9} dy={16}>
          <PxText text={caption} px={3} />
        </Rise>
        <div style={{display: 'flex', gap: 38}}>
          {facts.map((t, i) => (
            <Rise key={i} at={flipAt + 20 + i * 5} dur={8} dy={12}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <BulletDiamond size={22} color={MCD.gold} hole="#1A1208" />
                <McdText size={30} weight={600} color="#E4E6EA">{t}</McdText>
              </div>
            </Rise>
          ))}
        </div>
      </div>

      <CrossFlash x={cx} y={cy} at={flipAt + 9} arm={360} thick={22} color="#FFF0B0" dur={16} />
      <Burst x={cx} y={cy} at={flipAt + 9} count={30} size={16} speed={1.1} life={30} seed={41} />
      <WhiteFlash at={flipAt + 9} dur={9} peak={0.24} steps={4} />
      <Embers count={bg ? 30 : 22} size={8} seed={3} speed={0.6} color="#FFD27A" style={{opacity: sun * 0.9}} />
      {audio && (
        <>
          <Sequence from={flipAt - 2}>
            <Audio src={mcSound('random/click')} volume={0.3} playbackRate={0.8} />
          </Sequence>
          <Sequence from={flipAt + 9}>
            <Audio src={mcSound('random/levelup')} volume={0.35} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
