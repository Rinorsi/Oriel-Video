/**
 * mcd-c-presents - "studio presents" opener (trailer-from-creators-title).
 * Black, then a small white line scrambles in letter-wise (pixel tiles jumping), the cracked-stone logo hard-cuts in under it with a
 * two-frame flash and debris, embers drift, slow push-in, everything dims out in steps.
 * Props: lead (small line), logo (big stone logo), tagline (small silver line under the logo), bg (false = Layer), maxW, cjkRows.
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {PxText} from '../mcdkit/kit';
import {BurstSparks, Center, Dim, RiseSparks, TexText, TrailerBg, ramp, stepped, useFitPx} from './lib';

export const Presents: FC<{lead?: string; logo?: string; tagline?: string; bg?: boolean; audio?: boolean; maxW?: number; cjkRows?: number; logoAt?: number; exit?: number}> = ({
  lead = 'Oriel 工作室 出品',
  logo = '地底迷城',
  tagline = '模组整合包冒险系列',
  bg = true,
  audio = true,
  maxW = 1420,
  cjkRows = 32,
  logoAt = 50,
  exit = 124,
}) => {
  const f = useCurrentFrame();
  const out = 1 - stepped(ramp(f, exit, exit + 18), 6);
  const px = useFitPx(logo, maxW, 20, {cjkRows});
  // lead: letters appear left to right while tiles jump; settles at f=36
  const leadOn = f >= 12;
  const k = ramp(f, 12, 38);
  const scr = f < 38 ? {seed: f, amt: Math.max(0.05, 1 - k * 1.05)} : undefined;
  const logoOn = f >= logoAt;
  const g = f - logoAt;
  const push = 1 + 0.045 * ramp(f, logoAt, exit + 18);
  const flash = g >= 0 && g < 2 ? 0.14 : 0;
  const tag = stepped(ramp(f, logoAt + 22, logoAt + 32), 4);
  return (
    <AbsoluteFill>
      {audio && (
        <>
          {Array.from({length: 9}, (_, i) => (
            <Sfx key={i} at={12 + i * 3} src={mcSound('random/click')} volume={0.1} rate={1.6 + (i % 3) * 0.08} cut={5} />
          ))}
          <Sfx at={logoAt} src={reelSfx('impact-cine.mp3')} volume={0.55} />
          <Sfx at={logoAt + 2} src={mcSound('dig/stone2')} volume={0.35} rate={0.75} />
        </>
      )}
      {bg && <TrailerBg glow={ramp(f, logoAt - 4, logoAt + 20) * 1.1} />}
      {bg && <Dim kind="edges" a={0.6} size={0.5} />}
      <div style={{position: 'absolute', inset: 0, opacity: out}}>
        <RiseSparks count={40} seed={17} area={[100, 200, 1720, 800]} debris={3} alpha={ramp(f, 20, 60)} />
      </div>
      <Center style={{opacity: out}}>
        <div style={{transform: `scale(${push})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
          <div style={{height: 70, display: 'flex', alignItems: 'center'}}>{leadOn && <TexText text={lead} px={4} look="white" depth={0} shadow={1} scramble={scr} reveal={k} cjkRows={0} seed={2} />}</div>
          <div style={{height: 54}} />
          <div style={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{logoOn && <TexText text={logo} px={px} look="stone" depth={3} seed={9} cjkRows={cjkRows} />}</div>
          <div style={{height: 56}} />
          <div style={{height: 60, opacity: tag, transform: `translateY(${(1 - tag) * 8}px)`}}>
            <PxText text={tagline} px={4} cjkRows={0} color="#C8C6CE" shadowColor="#0A080C" />
          </div>
        </div>
      </Center>
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
      {logoOn && <BurstSparks at={logoAt} rect={[420, 430, 1080, 240]} count={26} seed={44} power={0.9} debris={9} colors={['#FFC83A', '#FF9E1B', '#FFE9A0']} />}
    </AbsoluteFill>
  );
};
