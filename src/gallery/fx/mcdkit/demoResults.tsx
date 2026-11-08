// mcd-kit-results-cards: the mission-complete page. Targets: results-level-complete.jpg (gold diamond + laurel + LEVEL badge,
// AP bar, four dark stat cards, chest in a gold diamond bottom-right) and results-multiplayer.jpg (rank colours, name + number captions).
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {Pop, Rise, countUp, win} from './common';
import {McdFloor} from './floor';
import {
  BlackCut,
  ChestIcon,
  DiamondFrame,
  Embers,
  KeyCap,
  Laurel,
  LevelBadge,
  MCD,
  McdText,
  PlayerBust,
  PxText,
  StatCard,
  TITLE_SMALL_GOLD,
  WhiteFlash,
} from './kit';

const ApIcon: FC = () => (
  <svg width={32} height={32} viewBox="0 0 8 8" shapeRendering="crispEdges">
    <rect x={0} y={0} width={8} height={8} fill="none" stroke={MCD.ap} strokeWidth={1} />
    <rect x={3} y={1} width={2} height={6} fill={MCD.ap} />
    <rect x={1} y={3} width={6} height={2} fill={MCD.ap} />
    <rect x={3} y={3} width={2} height={2} fill="#fff" />
  </svg>
);

export const ResultsDemo: FC = () => {
  const f = useCurrentFrame();
  const kills = countUp(f, 76, 26, 568, 12);
  const ap = Math.round(win(f, 104, 30) * 12) / 12;
  const chestShake = f >= 176 && f < 200 ? Math.round(Math.sin((f - 176) * 1.7) * 4 * (1 - (f - 176) / 24)) : 0;
  const chestPulse = f >= 200 ? 0.5 + 0.5 * Math.sin((f - 200) * 0.28) : 0;
  return (
    <McdFloor tint="crypt" shift={f * 0.1}>
      <AbsoluteFill style={{background: 'rgba(8,14,26,0.72)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(20,40,70,0.55), rgba(0,0,0,0) 70%)'}} />

      {/* title block */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
        <div style={{opacity: f >= 30 ? 1 : 0}}>
          <PxText text="LEVEL COMPLETE" px={3} {...TITLE_SMALL_GOLD} />
        </div>
        <div style={{opacity: f >= 36 ? 1 : 0}}>
          <PxText text="CREEPER WOODS" px={6} />
        </div>
      </div>

      {/* avatar */}
      <div style={{position: 'absolute', left: 960 - 200, top: 170, width: 400, height: 520}}>
        <div style={{position: 'absolute', left: -40, top: 130, opacity: 1}}>
          <Pop at={50} origin="50% 80%">
            <Laurel w={480} grow={win(f, 56, 22)} />
          </Pop>
        </div>
        <div style={{position: 'absolute', left: 20, top: 0}}>
          <Pop at={42} origin="50% 50%">
            <DiamondFrame size={360} tier="gilded" glow="rgba(255,205,80,0.45)" clip="bottom">
              <PlayerBust skin="efe" scale={15} style={{marginBottom: 74}} />
            </DiamondFrame>
          </Pop>
        </div>
        <div style={{position: 'absolute', left: -150, top: 40}}>
          <Pop at={60}>
            <LevelBadge level={6} w={150} accent="purple" />
          </Pop>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 530, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
        <Rise at={70} dur={6} dy={8}>
          <McdText size={30} weight={600}>vrvylive</McdText>
        </Rise>
        <div style={{opacity: f >= 74 ? 1 : 0}}>
          <PxText text={kills} px={8} />
        </div>
        <Rise at={80} dur={8} dy={8}>
          <McdText size={26} color="#8E96A2">Enemies Defeated</McdText>
        </Rise>
      </div>

      {/* mission summary */}
      <div style={{position: 'absolute', left: 96, top: 676}}>
        <Rise at={98} dur={8}>
          <PxText text="MISSION SUMMARY" px={2} />
        </Rise>
      </div>
      <div style={{position: 'absolute', left: 96, top: 716, width: 1384, height: 56, opacity: win(f, 98, 8)}}>
        <div style={{position: 'absolute', right: 0, top: 0}}>
          <McdText size={22} weight={600} color="#9AA0AA">Next Rank: 6</McdText>
        </div>
        <div style={{position: 'absolute', left: 0, top: 22, display: 'flex', alignItems: 'center', gap: 14}}>
          <ApIcon />
          <McdText size={26} weight={700}>AP</McdText>
        </div>
        <div style={{position: 'absolute', left: 104, right: 0, top: 30, height: 16, background: '#39363A'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ap * 36}%`, background: MCD.ap}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 96, top: 806, display: 'flex', gap: 30}}>
        {[
          ['Chests Opened', '100%', 112],
          ['Mobs Defeated', '97%', 122],
          ['Damage Taken', '1,576', 132],
          ['Players Downed', '0', 142],
        ].map(([l, v, at], i) => (
          <StatCard key={l as string} label={l as string} value={v as string} w={319} h={172} reveal={EASE.out(win(f, at as number, 12))} />
        ))}
      </div>

      {/* chest */}
      <div style={{position: 'absolute', left: 1560, top: 726}}>
        <Pop at={168} origin="50% 50%">
          <div style={{position: 'relative', width: 270, height: 270}}>
            <DiamondFrame size={270} tier="gilded" glow={`rgba(255,205,80,${0.35 + chestPulse * 0.3})`}>
              <div style={{transform: `translate(${chestShake}px, 6px)`}}>
                <div style={{position: 'relative'}}>
                  <ChestIcon variant="ender" scale={11} open={f >= 206 ? 0.18 * chestPulse : 0} style={{filter: 'brightness(1.9) contrast(1.1)'}} />
                  {[34, 86].map((x) => (
                    <div key={x} style={{position: 'absolute', left: x + 10, top: 62, width: 11, height: 11, background: MCD.beam, boxShadow: `0 0 12px ${MCD.beam}`, opacity: 0.6 + chestPulse * 0.4}} />
                  ))}
                </div>
              </div>
            </DiamondFrame>
            <div style={{position: 'absolute', right: 20, top: 150}}>
              <KeyCap label="A" color={MCD.keyA} size={48} />
            </div>
          </div>
        </Pop>
      </div>
      <Embers count={22} area={[1500, 640, 340, 360]} size={8} seed={5} speed={0.8} style={{opacity: win(f, 176, 10)}} />
      <Embers count={26} area={[0, 0, 1920, 1080]} size={6} seed={9} speed={0.5} color="#FFE08A" style={{opacity: 0.55 * win(f, 40, 20)}} />
      <WhiteFlash at={42} dur={5} peak={0.16} steps={2} />
      <BlackCut at={-1} fade={1} hold={14} reveal={16} />
    </McdFloor>
  );
};

