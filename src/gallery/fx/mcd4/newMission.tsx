/**
 * mcd-c-new-mission - "new mission unlocked" pop-up (world-map-mission-select, bottom-right panel).
 * A chamfered dark panel with a gold flag corner pops up (corner or centre); locked hexagon nodes light up one after another with a
 * pixel cross glint, the count rolls up, the green "next" button gets pressed and the panel leaves.
 * Props: title, countLabel (e.g. "个新任务"), icons (item ids for the unlocking nodes), button, pos ('corner'|'center'), bg (Demo shows the
 *        world-map scene + a node popping on the map; false = Layer), nodeName (the map node label in the Demo).
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE, clamp01} from '../../../mc/theme';
import {item} from '../../../mc/assets';
import {CutPanel, HexBadge, ItemIcon3D, LOCK_ROWS, MCD, MainButton, McdText, PxArt, PxText} from '../mcdkit/kit';
import {ScenePlate} from '../mcdscene/scenes';
import {BurstSparks, CrossFlash, ramp, stepped} from './lib';

const PW = 640;
const PH = 470;

export const NewMission: FC<{
  title?: string;
  countLabel?: string;
  icons?: string[];
  button?: string;
  pos?: 'corner' | 'center';
  bg?: boolean;
  audio?: boolean;
  nodeName?: string;
  nodeAt?: [number, number];
  exit?: number;
}> = ({title = '新任务解锁', countLabel = '个新任务', icons = ['diamond_sword', 'bow', 'iron_pickaxe'], button = '查看下一个', pos = 'corner', bg = true, audio = true, nodeName = '红石矿山', nodeAt, exit = 118}) => {
  const f = useCurrentFrame();
  const corner = pos === 'corner';
  const nAt = nodeAt ?? (corner ? [560, 300] : [250, 520]);
  const sc = corner ? 0.9 : 1.2;
  const inT = ramp(f, 6, 20);
  const outT = ramp(f, exit, exit + 10);
  const press = f < 104 ? 0 : f < 110 ? ramp(f, 104, 110) : 1 - ramp(f, 110, 118);
  const n = icons.length;
  const unlockAt = (i: number) => 28 + i * 13;
  const unlocked = icons.filter((_, i) => f >= unlockAt(i)).length;
  const alpha = stepped(inT, 4) * (1 - stepped(outT, 4));
  // position
  const slideY = corner ? (1 - EASE.back(inT)) * 150 + outT * 120 : 0;
  const popS = corner ? 1 : 0.88 + 0.12 * EASE.back(inT) - outT * 0.06;
  const left = corner ? 1920 - 80 - PW * sc : (1920 - PW * sc) / 2;
  const top = corner ? 1080 - 72 - PH * sc : (1080 - PH * sc) / 2;
 
  const hexX = (i: number) => PW / 2 + (i - (n - 1) / 2) * 150;
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={8} src={mcSound('ui/toast/in')} volume={0.35} />
          {icons.map((_, i) => (
            <Sfx key={i} at={unlockAt(i)} src={mcSound('random/orb')} volume={0.3} rate={0.95 + i * 0.12} />
          ))}
          <Sfx at={104} src={mcSound('random/click')} volume={0.4} />
          <Sfx at={exit} src={mcSound('ui/toast/out')} volume={0.3} />
        </>
      )}
      {bg && <ScenePlate biome="world-map" camera="drift" />}
      {bg && (
        <div style={{position: 'absolute', left: nAt[0], top: nAt[1], opacity: stepped(ramp(f, 34, 42), 4) * (1 - outT), transform: `scale(${0.7 + 0.3 * EASE.back(ramp(f, 34, 46))})`, transformOrigin: '50% 40%'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <HexBadge w={96} ring="#C99A2E" ringHi="#FCD448" fill="#1A140A" glow="rgba(252,212,72,0.45)">
              <ItemIcon3D src={item(icons[0] ?? 'diamond_sword')} size={46} depth={3} />
            </HexBadge>
            <div style={{background: 'rgba(28,28,32,0.88)', padding: '4px 18px', border: '3px solid #3A3A3E'}}>
              <McdText size={30} weight={700} color="#F4F0E6">
                {nodeName}
              </McdText>
            </div>
          </div>
        </div>
      )}
      {!corner && <AbsoluteFill style={{background: `rgba(4,3,8,${0.5 * alpha})`}} />}
      <div style={{position: 'absolute', left, top, width: PW * sc, height: PH * sc, opacity: alpha, transform: `translateY(${slideY}px) scale(${popS})`, transformOrigin: '50% 60%'}}>
        <div style={{width: PW, height: PH, transform: `scale(${sc})`, transformOrigin: '0 0', position: 'relative'}}>
          <div style={{position: 'absolute', left: 10, top: 12, width: PW, height: PH, background: 'rgba(0,0,0,0.35)', clipPath: 'polygon(0 0, 604px 0, 100% 36px, 100% 100%, 0 100%)'}} />
          <CutPanel w={PW} h={PH} cuts={[0, 36, 0, 0]} fill="#1C1C20" edge="#3A3A3E" edgeW={4} corners>
            {/* gold flag in the chamfered corner */}
            <svg width={PW} height={PH} style={{position: 'absolute', left: 0, top: 0}}>
              <polygon points={`${PW - 36},4 ${PW - 4},36 ${PW - 4},4`} fill={MCD.gold} />
            </svg>
            <div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center'}}>
              <PxText text={title} px={5} cjkRows={0} color={MCD.goldBright} hi="#FFE680" shadowColor="#2A1600" />
            </div>
            {/* unlocking nodes */}
            <div style={{position: 'absolute', left: 0, top: 128, width: PW, height: 130}}>
              <div style={{position: 'absolute', left: hexX(0), top: 55, width: hexX(n - 1) - hexX(0), height: 6, backgroundImage: 'repeating-linear-gradient(to right, #4A4A52 0 12px, rgba(0,0,0,0) 12px 24px)'}} />
              {icons.map((ic, i) => {
                const lit = f >= unlockAt(i);
                const k = ramp(f, unlockAt(i), unlockAt(i) + 8);
                const pop = lit ? 1 + 0.28 * (1 - EASE.out(k)) : 1;
                return (
                  <div key={ic} style={{position: 'absolute', left: hexX(i) - 48, top: 0, transform: `scale(${pop})`}}>
                    {lit ? (
                      <HexBadge w={96} ring="#C99A2E" ringHi="#FCD448" fill="#1A140A" glow="rgba(252,212,72,0.35)">
                        <ItemIcon3D src={item(ic)} size={46} depth={3} />
                      </HexBadge>
                    ) : (
                      <HexBadge w={96} ring="#46464C" fill="#121216">
                        <PxArt rows={LOCK_ROWS} pal={{k: '#6A6A72'}} px={5} />
                      </HexBadge>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 282, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 10}}>
              <PxText text={unlocked} px={5} color={MCD.goldBright} shadowColor="#2A1600" />
              <McdText size={40} weight={700} color="#FFFFFF">
                {countLabel}
              </McdText>
            </div>
            <div style={{position: 'absolute', left: (PW - 440) / 2, top: 350}}>
              <MainButton label={button} w={440} h={88} tone="green" press={press} hover={f > 84 && f < 120 ? 0.6 : 0} textPx={4} />
            </div>
          </CutPanel>
        </div>
      </div>
      {/* glints */}
      {icons.map((_, i) => (
        <CrossFlash key={i} x={left + (hexX(i) + 20) * sc} y={top + (128 + 20) * sc + slideY * 0} at={unlockAt(i)} size={72} />
      ))}
      {icons.map((_, i) => (
        <BurstSparks key={`b${i}`} at={unlockAt(i)} rect={[left + (hexX(i) - 30) * sc, top + 150 * sc, 60 * sc, 60 * sc]} count={10} seed={30 + i} power={0.55} life={26} debris={0} />
      ))}
      {bg && <CrossFlash x={nAt[0] + 80} y={nAt[1] + 40} at={38} size={70} />}
    </AbsoluteFill>
  );
};

void clamp01;
