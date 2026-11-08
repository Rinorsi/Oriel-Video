/**
 * mcd-c-series-title - series / episode title for the top-left of the picture (transparent Layer friendly).
 * A gold hexagon episode badge pops in, a gold divider grows out of it, the big title wipes in with a hard shadow and the
 * sub-title fades under it. A soft dark corner gradient keeps it readable on bright footage. Holds (with a slow glint on the divider,
 * period 60 frames, so it loops) or leaves to the left.
 * Props: ep (number, shown 2-digit), epLabel (small word in the badge), title, subtitle, kicker (small gold line above the title),
 *        exit (frame it leaves; -1 = stay forever), bg (Demo draws a scene behind), biome.
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE} from '../../../mc/theme';
import {HexBadge, MCD, McdText, PxText} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import {CrossFlash, Dim, ramp, stepped, useFitPx} from './lib';

export const SeriesTitle: FC<{
  ep?: number;
  epLabel?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  exit?: number;
  bg?: boolean;
  audio?: boolean;
  biome?: BiomeId;
  cjkRows?: number;
}> = ({ep = 5, epLabel = 'EP', kicker = '生存系列 · 第二季', title = '沉入地牢深处', subtitle = '我们在红石矿山找到了失落的神器', exit = 124, bg = true, audio = true, biome = 'forest-day', cjkRows = 28}) => {
  const f = useCurrentFrame();
  const badgeT = EASE.back(ramp(f, 0, 12));
  const out = exit < 0 ? 0 : EASE.in(ramp(f, exit, exit + 14));
  const tpx = useFitPx(title, 1000, 5, {cjkRows}, 2);
  const slideX = -out * 760;
  const divT = ramp(f, 8, 26);
  const titleT = ramp(f, 10, 24);
  const subT = stepped(ramp(f, 24, 32), 4);
  const kickT = stepped(ramp(f, 14, 22), 4);
  const glint = ((f - 34) % 60 + 60) % 60 / 60; // loops every 60 frames
  const show = f >= 0;
  const epText = String(ep).padStart(2, '0');
  const DIVW = 920;
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={4} src={mcSound('ui/toast/in')} volume={0.22} />
          <Sfx at={12} src={mcSound('random/click')} volume={0.2} rate={1.2} />
        </>
      )}
      {bg && <ScenePlate biome={biome} camera="drift" />}
      <div style={{opacity: 1 - out}}>
        <Dim kind="left" a={0.62} size={0.62} color="4,4,10" />
        <Dim kind="top" a={0.55} size={0.5} color="4,4,10" />
      </div>
      <div style={{position: 'absolute', left: 96, top: 84, display: 'flex', alignItems: 'flex-start', gap: 30, transform: `translateX(${slideX}px)`, opacity: show ? 1 - out * 0.4 : 0}}>
        <div style={{transform: `scale(${0.3 + 0.7 * badgeT})`, opacity: f < 1 ? 0 : 1, transformOrigin: '50% 50%'}}>
          <HexBadge w={156} ring="#C99A2E" ringHi="#FCD448" fill="#0C0C10" glow="rgba(252,212,72,0.3)">
            <McdText size={22} weight={800} color={MCD.gold} style={{letterSpacing: 4, lineHeight: 1, marginBottom: 8}}>
              {epLabel}
            </McdText>
            <PxText text={epText} px={6} gap={2} />
          </HexBadge>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: 2}}>
          <div style={{height: 36, opacity: kickT, transform: `translateX(${(1 - kickT) * -30}px)`}}>
            <PxText text={kicker} px={3} cjkRows={0} color={MCD.goldBright} shadowColor="#2A1600" />
          </div>
          <div style={{height: 14}} />
          <div style={{overflow: 'hidden', clipPath: `inset(-20px ${(1 - titleT) * 100}% -20px 0)`}}>
            <div style={{transform: `translateX(${(1 - EASE.out(titleT)) * -80}px)`, paddingRight: 24}}>
              <PxText text={title} px={tpx} cjkRows={cjkRows} color="#FFFFFF" shadow={1} shadowColor="#10101A" />
            </div>
          </div>
          <div style={{height: 22}} />
          {/* gold divider with chamfered end and a moving glint */}
          <div style={{position: 'relative', width: DIVW * EASE.out(divT), height: 12, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: 6, width: DIVW, height: 6, background: '#6A3F10'}} />
            <div style={{position: 'absolute', left: 0, top: 0, width: DIVW, height: 6, background: MCD.goldBright}} />
            <div style={{position: 'absolute', left: -140 + glint * (DIVW + 280), top: 0, width: 120, height: 6, background: 'linear-gradient(to right, rgba(255,255,255,0), #FFF6C0 60%, rgba(255,255,255,0))', opacity: f > 34 ? 1 : 0}} />
          </div>
          <div style={{height: 20}} />
          <div style={{opacity: subT, transform: `translateY(${(1 - subT) * 8}px)`}}>
            <McdText size={40} weight={600} color="#F0EEF4">
              {subtitle}
            </McdText>
          </div>
        </div>
      </div>
      <CrossFlash x={96 + 156 - 20} y={84 + 20} at={10} size={80} />
    </AbsoluteFill>
  );
};
