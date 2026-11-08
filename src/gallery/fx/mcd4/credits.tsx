/**
 * mcd-c-credits - end credits roll: gold role (right-aligned) | white name (left-aligned) over a slow aerial scene,
 * then the scene darkens and the four-corner bracket end card closes the video.
 * Props: groups [{head, rows:[role,name][]}], speed (px per frame), startY, thanks, thanksSub, endAt (frame the roll gives way to the end card),
 *        bg (false = Layer), biome.
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {PxText, MCD} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import {BurstSparks, CornerFrame, Dim, GoldDivider, RiseSparks, TexText, ramp, stepped} from './lib';

export type CreditGroup = {head: string; rows: [string, string][]};

const DEMO: CreditGroup[] = [
  {
    head: '制作团队',
    rows: [
      ['导演 · 剪辑', '小明'],
      ['视频后期', '阿花'],
      ['配乐', '墨竹'],
    ],
  },
  {
    head: '模组与资源',
    rows: [
      ['整合包', 'Oriel 工作室'],
      ['材质包', '像素工坊'],
      ['地图建筑', '社区投稿者'],
    ],
  },
];

const HEAD_H = 170;
const ROW_H = 100;
const GROUP_GAP = 120;

export const Credits: FC<{
  groups?: CreditGroup[];
  speed?: number;
  startY?: number;
  thanks?: string;
  thanksSub?: string;
  endAt?: number;
  bg?: boolean;
  audio?: boolean;
  biome?: BiomeId;
}> = ({groups = DEMO, speed = 6, startY = 960, thanks = '感谢观看', thanksSub = '我们下一期再见', endAt = 186, bg = true, audio = true, biome = 'forest-night'}) => {
  const f = useCurrentFrame();
  const y0 = startY - f * speed;
  const rollA = 1 - stepped(ramp(f, endAt, endAt + 14), 5);
  const dark = stepped(ramp(f, endAt - 4, endAt + 16), 6);
  const e = f - endAt;
  let yy = 0;
  const blocks = groups.map((g, gi) => {
    const top = yy;
    yy += HEAD_H + g.rows.length * ROW_H + GROUP_GAP;
    return {g, gi, top};
  });
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={endAt} src={reelSfx('transition-soft.mp3')} volume={0.4} />
          <Sfx at={endAt + 18} src={reelSfx('impact-cine.mp3')} volume={0.35} />
          <Sfx at={endAt + 20} src={mcSound('ui/toast/challenge_complete')} volume={0.25} />
        </>
      )}
      {bg && <ScenePlate biome={biome} camera="push" dim={0.25} />}
      <AbsoluteFill style={{background: `linear-gradient(to right, rgba(4,4,10,${bg ? 0.55 : 0.3}) 0%, rgba(4,4,10,${bg ? 0.78 : 0.45}) 50%, rgba(4,4,10,${bg ? 0.55 : 0.3}) 100%)`, maskImage: 'linear-gradient(to right, transparent 12%, #000 36%, #000 64%, transparent 88%)', WebkitMaskImage: 'linear-gradient(to right, transparent 12%, #000 36%, #000 64%, transparent 88%)'}} />
      {bg && <Dim kind="edges" a={0.55} size={0.5} />}
      <div style={{position: 'absolute', inset: 0, opacity: rollA, maskImage: 'linear-gradient(to bottom, transparent 0, #000 15%, #000 84%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 15%, #000 84%, transparent 100%)'}}>
        {blocks.map(({g, gi, top}) => (
          <div key={gi} style={{position: 'absolute', left: 0, right: 0, top: y0 + top}}>
            <div style={{height: HEAD_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 22}}>
              <PxText text={g.head} px={6} cjkRows={0} color={MCD.goldBright} hi="#FFE680" shadowColor="#2A1600" />
              <GoldDivider w={560} />
            </div>
            {g.rows.map(([role, name], ri) => (
              <div key={ri} style={{height: ROW_H, position: 'relative'}}>
                <div style={{position: 'absolute', right: 1920 / 2 + 52, top: 0, height: ROW_H, display: 'flex', alignItems: 'center'}}>
                  <PxText text={role} px={4} cjkRows={0} color="#F4B55A" shadowColor="#2A1600" />
                </div>
                <div style={{position: 'absolute', left: 960 - 8, top: ROW_H / 2 - 8, width: 16, height: 16, background: '#6A3F10', transform: 'rotate(45deg) scale(0.7)'}} />
                <div style={{position: 'absolute', left: 960 + 52, top: 0, height: ROW_H, display: 'flex', alignItems: 'center'}}>
                  <PxText text={name} px={5} cjkRows={0} color="#FFFFFF" shadowColor="#050202" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <RiseSparks count={30} seed={23} area={[100, 100, 1720, 900]} alpha={0.55} />
      {/* end card */}
      <AbsoluteFill style={{background: `rgba(4,3,8,${0.86 * dark})`}} />
      {e >= 0 && (
        <>
          <CornerFrame grow={ramp(e, 6, 30)} />
          <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 54}}>
            <div style={{opacity: stepped(ramp(e, 18, 28), 4), transform: `translateY(${(1 - stepped(ramp(e, 18, 28), 4)) * 14}px)`}}>
              <TexText text={thanks} px={7} look="gold" depth={3} cjkRows={36} seed={4} />
            </div>
            <div style={{opacity: stepped(ramp(e, 32, 42), 4)}}>
              <PxText text={thanksSub} px={4} cjkRows={0} color="#E6D6A4" hi="#FFF2C8" shadowColor="#2A1600" />
            </div>
          </AbsoluteFill>
          <RiseSparks count={40} seed={31} area={[60, 300, 1800, 740]} alpha={ramp(e, 10, 40)} />
          <BurstSparks at={endAt + 20} rect={[600, 420, 720, 160]} count={20} seed={61} power={0.8} debris={3} />
        </>
      )}
    </AbsoluteFill>
  );
};
