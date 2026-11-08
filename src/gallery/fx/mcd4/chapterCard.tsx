/**
 * mcd-c-chapter-card - chapter title card over a darkened scene.
 * A dark banner (gold hairlines) holds a hexagon badge that flips like a card to show the chapter number, the chapter name in
 * hard-shadow display type, a gold divider and one line of sub-title. Two entrances: 'cut' (banner hard-cuts in/out, the game
 * way) and 'slide' (banner wipes in from the left with a 45-degree edge and leaves to the right).
 * Props: n, label (small word in the badge), chapterWord (gold line, default "第 n 章"), name, sub, mode ('cut'|'slide'),
 *        biome (Demo background), bg (false = Layer: dim + banner only), exit (frame the banner leaves).
 */
import {type FC} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE, clamp01} from '../../../mc/theme';
import {HexBadge, McdText, PxText, MCD} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import {BurstSparks, CrossFlash, Dim, GoldDivider, RiseSparks, fw, ramp, stepped, useFitPx} from './lib';

const BAND_Y = 290;
const BAND_H = 500;

export const ChapterCard: FC<{
  n?: number;
  label?: string;
  chapterWord?: string;
  name?: string;
  sub?: string;
  mode?: 'cut' | 'slide';
  biome?: BiomeId;
  bg?: boolean;
  audio?: boolean;
  exit?: number;
}> = ({n = 3, label = 'CHAPTER', chapterWord, name = '苦力怕森林', sub = '夜幕降临，林中传来熟悉的嘶嘶声', mode = 'cut', biome = 'forest-night', bg = true, audio = true, exit = 122}) => {
  const f = useCurrentFrame();
  const slide = mode === 'slide';
  const skew = BAND_H;
  const W = 1920;
  // band visibility
  const enter = slide ? EASE.out(ramp(f, 4, 20)) : f >= 6 ? 1 : 0;
  const leave = slide ? EASE.in(ramp(f, exit, exit + 16)) : f >= exit ? 1 : 0;
  const xr = enter * (W + skew);
  const xl = leave * (W + skew);
  const clip = `polygon(${xl}px 0, ${xr}px 0, ${xr - skew}px 100%, ${xl - skew}px 100%)`;
  const bandOn = slide ? enter > 0 && leave < 1 : f >= 6 && f < exit;
  // scene dim: 0 -> 1 on the way in, back on the way out (hard steps)
  const dimIn = slide ? ramp(f, 2, 14) : ramp(f, 0, 6);
  const dimOut = slide ? ramp(f, exit + 6, exit + 18) : f >= exit ? 1 : 0;
  const dim = stepped(dimIn, 6) * (1 - stepped(dimOut, 6));
  const t0 = slide ? 12 : 8; // flip start
  const nameFit = useFitPx(name, 1000, 9, {cjkRows: 36});
  const word = chapterWord ?? `第 ${fw(String(n))} 章`;
  // hex flip: back face turns away, then front turns in with a small overshoot
  const flip1 = EASE.in(ramp(f, t0, t0 + 6));
  const flip2 = ramp(f, t0 + 6, t0 + 16);
  const back = f < t0 + 6;
  const ang = back ? flip1 * 90 : (1 - EASE.back(flip2)) * -90;
  const shift = slide ? (1 - enter) * -520 + leave * 620 : 0;
  const item = (at: number) => {
    const t = stepped(ramp(f, at, at + 8), 4);
    return {opacity: t * (1 - leave), transform: `translateX(${slide ? (1 - t) * -80 : 0}px) translateY(${slide ? 0 : (1 - t) * 10}px)`};
  };
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={t0 + 6} src={mcSound('random/click')} volume={0.3} rate={0.9} />
          <Sfx at={t0 + 14} src={mcSound('random/orb')} volume={0.22} rate={1.3} />
        </>
      )}
      {bg && <ScenePlate biome={biome} camera="push" />}
      <AbsoluteFill style={{background: `rgba(4,3,8,${0.42 * dim})`}} />
      <Dim kind="edges" a={0.5 * dim} size={0.5} />
      <Dim kind="top" a={0.4 * dim} size={0.28} />
      <Dim kind="bottom" a={0.4 * dim} size={0.28} />
      {bandOn && (
        <AbsoluteFill style={{clipPath: clip}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: BAND_Y, height: BAND_H, background: 'linear-gradient(to bottom, rgba(6,8,12,0.9), rgba(10,10,16,0.82) 60%, rgba(6,8,12,0.9))'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: BAND_Y - 8, height: 8, background: MCD.goldBright}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: BAND_Y - 8 + 8, height: 6, background: '#6A3F10'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: BAND_Y + BAND_H, height: 8, background: MCD.goldBright}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: BAND_Y + BAND_H + 8, height: 6, background: '#6A3F10'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: BAND_Y, height: BAND_H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 70, transform: `translateX(${shift}px)`}}>
            {/* hexagon flip card */}
            <div style={{width: 236, height: 272, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 900, flex: 'none'}}>
              <div style={{transform: `rotateY(${ang}deg)`}}>
                {back ? (
                  <HexBadge w={220} ring="#C99A2E" ringHi="#FCD448" fill="#14100A">
                    <div style={{width: 44, height: 44, background: MCD.goldBright, transform: 'rotate(45deg)', boxShadow: '4px 4px 0 #6A3F10'}} />
                  </HexBadge>
                ) : (
                  <HexBadge w={220} ring="#C99A2E" ringHi="#FCD448" fill="#0C0C10" glow="rgba(252,212,72,0.28)">
                    <McdText size={22} weight={800} color={MCD.gold} style={{letterSpacing: 4, lineHeight: 1, marginBottom: 6}}>
                      {label}
                    </McdText>
                    <PxText text={n} px={12} color="#FFFFFF" shadowColor="#050202" gap={2} />
                  </HexBadge>
                )}
              </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0}}>
              <div style={item(t0 + 8)}>
                <PxText text={word} px={4} cjkRows={20} color={MCD.goldBright} hi="#FFE680" shadowColor="#2A1600" />
              </div>
              <div style={{height: 30}} />
              <div style={item(t0 + 12)}>
                <PxText text={name} px={nameFit} cjkRows={36} color="#FFFFFF" shadow={1} shadowColor="#4A2C10" />
              </div>
              <div style={{height: 34}} />
              <div style={{...item(t0 + 18), marginLeft: -24}}>
                <GoldDivider w={760} grow={ramp(f, t0 + 16, t0 + 30)} />
              </div>
              <div style={{height: 22}} />
              <div style={item(t0 + 26)}>
                <McdText size={38} weight={500} color="#D8D8E0">
                  {sub}
                </McdText>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}
      <RiseSparks count={26} seed={14} area={[100, 160, 1720, 800]} alpha={0.7 * dim} />
      <CrossFlash x={760} y={470} at={t0 + 16} size={90} />
      <BurstSparks at={t0 + 16} rect={[620, 400, 300, 280]} count={20} seed={4} power={0.8} debris={0} />
    </AbsoluteFill>
  );
};
export type {BiomeId};
void clamp01;

/** Demo: first card hard-cuts in/out, second one wipes in/out. */
export const ChapterDemo: FC<{bg?: boolean}> = ({bg = true}) => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={120}>
      <ChapterCard n={3} name="苦力怕森林" sub="夜幕降临，林中传来熟悉的嘶嘶声" mode="cut" biome="forest-night" exit={96} bg={bg} />
    </Sequence>
    <Sequence from={120} durationInFrames={120}>
      <ChapterCard n={4} name="红石矿山" sub="深入地底，机关与熔岩在等你" mode="slide" biome="nether" exit={94} bg={bg} />
    </Sequence>
  </AbsoluteFill>
);
