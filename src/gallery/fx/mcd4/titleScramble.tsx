/**
 * mcd-c-title-scramble - trailer title card (CO-OP / ENCHANT style).
 * Hard cut to #060307, the gold title shows up for two frames as scrambled pixel tiles, snaps together on frame 7 with a
 * spark spray and debris cubes, then holds with a slow push-in while embers rise. Dims out in hard steps.
 * Props: title, subtitle (small line under it), look ('gold'|'logo'|'stone'|'white'), maxW (title width cap), bg (false = transparent Layer),
 *        at (frame the title is revealed; default 4).
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {PxText} from '../mcdkit/kit';
import {BurstSparks, Center, Dim, RiseSparks, TexText, TrailerBg, fw, stepped, ramp, useFitPx, type LookName} from './lib';

export const TitleScramble: FC<{title?: string; subtitle?: string; look?: LookName; maxW?: number; bg?: boolean; audio?: boolean; at?: number; hold?: number; cjkRows?: number; depth?: number}> = ({
  title = '地底迷城',
  subtitle = '整合包冒险 · 第 1 集',
  look = 'gold',
  maxW = 1500,
  bg = true,
  audio = true,
  at = 4,
  hold = 112,
  cjkRows = 24,
  depth = 2,
}) => {
  const f = useCurrentFrame();
  const px = useFitPx(title, maxW, 18, {cjkRows});
  const g = f - at;
  const scr = g < 0 ? null : g === 0 ? {seed: 1, amt: 1} : g === 1 ? {seed: 2, amt: 0.8} : g === 2 ? {seed: 3, amt: 0.4} : null;
  const shown = g >= 0;
  const out = 1 - stepped(ramp(f, hold, hold + 18), 6);
  const slam = g >= 3 && g < 9 ? 1 + 0.04 * (1 - (g - 3) / 6) : 1;
  const push = 1 + 0.035 * ramp(f, at + 3, hold + 18);
  const glow = g < 3 ? 0 : g < 8 ? 0.8 : 0.34;
  const sub = stepped(ramp(f, at + 18, at + 28), 4) * out;
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={at} src={mcSound('random/click')} volume={0.3} rate={0.5} cut={4} />
          <Sfx at={at + 3} src={reelSfx('impact-cine.mp3')} volume={0.5} />
          <Sfx at={at + 3} src={mcSound('block/furnace/fire_crackle1')} volume={0.22} cut={70} />
          <Sfx at={at + 6} src={mcSound('dig/stone3')} volume={0.35} rate={0.8} />
        </>
      )}
      {bg && <TrailerBg />}
      <div style={{position: 'absolute', inset: 0, opacity: out}}>
        {g >= 3 && <RiseSparks count={54} seed={5} area={[160, 100, 1600, 860]} debris={4} alpha={ramp(g, 3, 20)} />}
        {bg && <Dim kind="edges" a={0.55} size={0.45} />}
      </div>
      <Center style={{opacity: out}}>
        <div style={{transform: `scale(${slam * push}) translateY(-24px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 70, filter: glow ? `drop-shadow(0 0 ${26 * glow}px rgba(255,166,0,${0.55 * glow}))` : undefined}}>
          {shown && <TexText text={title} px={px} cjkRows={cjkRows} look={look} depth={depth} scramble={scr ?? undefined} seed={4} />}
          <div style={{opacity: sub, transform: `translateY(${(1 - sub) * 10}px)`}}>
            <PxText text={fw(subtitle)} px={3} color="#E6D6A4" hi="#FFF2C8" shadowColor="#2A1600" />
          </div>
        </div>
      </Center>
      {g >= 3 && <BurstSparks at={at + 3} rect={[460, 400, 1000, 220]} count={72} seed={21} power={1.2} debris={8} />}
    </AbsoluteFill>
  );
};
