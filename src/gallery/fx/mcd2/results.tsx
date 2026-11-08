// mcd-s-results: from gameplay to the mission-complete page. Target: results-level-complete.jpg + results-screen-fade-in.png.
// 0.2s gameplay -> darken to black (0.5s) -> hold black (0.5s) -> the whole page fades in at once over 1s
// (blurred dark scene, gold diamond avatar + laurel, number roll-up, four stat cards, gilded chest), then fade to black.
// Props: bg, level, stage (header line), mission (title), name, kills, stats[4] ([label, value, suffix]).
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {countUp} from '../mcdkit/common';
import {ChestIcon, DiamondFrame, KeyCap, Laurel, LevelBadge, MCD, McdText, PlayerBust, PxText, StatCard, TITLE_SMALL_GOLD} from '../mcdkit/kit';
import {Backdrop, EASE, Sfx, Twinkle, mcSound, snap, stepped, win} from './common';

const TOTAL = 180;

const fmt = (n: number) => n.toLocaleString('en-US');

export const Results: FC<{
  bg?: boolean;
  audio?: boolean;
  summary?: string;
  nextLabel?: string;
  level?: number;
  stage?: string;
  mission?: string;
  name?: string;
  kills?: number;
  unit?: string;
  stats?: [string, number, string][];
}> = ({
  bg,
  audio = bg,
  summary = '任务汇总',
  nextLabel = '下一等级',
  level = 6,
  stage = '恭喜过关',
  mission = '苦力怕森林',
  name = 'vrvylive',
  kills = 568,
  unit = '击败敌人',
  stats = [
    ['已开启宝箱', 100, '%'],
    ['击败怪物', 97, '%'],
    ['受到伤害', 1576, ''],
    ['倒下的玩家', 0, ''],
  ],
}) => {
  const f = useCurrentFrame();
  // black overlay: gameplay -> black (f4..21), hold (..36), fade page in (36..66), fade out at the end
  let black = 0;
  if (f < 36) black = EASE.out(win(f, 8, 16));
  else if (f < TOTAL - 18) black = 1 - win(f, 36, 30);
  else black = win(f, TOTAL - 18, 16);
  const page = f >= 30; // page is mounted underneath the black overlay
  const grow = EASE.out(win(f, 50, 20));
  const roll = (at: number, dur: number, to: number) => countUp(f, at, dur, to, 14);
  const k = roll(62, 38, kills);
  const ap = Math.round(win(f, 66, 36) * 16) / 16;
  const cardAt = [62, 68, 74, 80];
  const chestPulse = f >= 84 ? 0.5 + 0.5 * Math.sin((f - 84) * 0.26) : 0;
  const chestShake = f >= 96 && f < 118 ? Math.round(Math.sin((f - 96) * 1.9) * 5 * (1 - (f - 96) / 22)) : 0;
  const popA = (at: number) => EASE.back(win(f, at, 9));
  const dimA = stepped(win(f, 28, 8), 4);

  return (
    <AbsoluteFill>
      {bg ? (
        <Backdrop biome="forest-night" loop={TOTAL} dim={0.1} blur={f < 30 ? 0 : 14} bright={f < 30 ? 1 : 0.85} />
      ) : null}
      {/* dark navy scrim behind the page (the game's blurred/dimmed mission scene) */}
      <AbsoluteFill style={{background: bg ? 'rgba(8,14,26,0.7)' : 'rgba(8,14,26,0.82)', opacity: dimA}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(20,40,70,0.5), rgba(0,0,0,0) 70%)', opacity: dimA}} />
      {page && (
        <AbsoluteFill>
          {/* title block */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <PxText text={stage} px={3} {...TITLE_SMALL_GOLD} />
            <PxText text={mission} px={5} />
          </div>
          {/* avatar */}
          <div style={{position: 'absolute', left: 960 - 200, top: 204, width: 400, height: 520}}>
            <div style={{position: 'absolute', left: -40, top: 130, transform: `scale(${0.9 + 0.1 * grow})`, transformOrigin: '50% 80%'}}>
              <Laurel w={480} grow={grow} />
            </div>
            <div style={{position: 'absolute', left: 20, top: 0, transform: `scale(${0.9 + 0.1 * popA(40)})`}}>
              <DiamondFrame size={360} tier="gilded" glow="rgba(255,205,80,0.42)" clip="bottom">
                <PlayerBust skin="efe" scale={15} style={{marginBottom: 74}} />
              </DiamondFrame>
            </div>
            <div style={{position: 'absolute', left: -150, top: 40, transform: `scale(${popA(46)})`}}>
              <LevelBadge level={level} w={150} accent="purple" />
            </div>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 572, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <McdText size={30} weight={600}>{name}</McdText>
            <PxText text={fmt(k)} px={8} />
            <McdText size={26} color="#8E96A2" style={{marginTop: 8}}>{unit}</McdText>
          </div>

          {/* mission summary */}
          <div style={{position: 'absolute', left: 96, top: 700}}>
            <PxText text={summary} px={2} />
          </div>
          <div style={{position: 'absolute', left: 96, top: 738, width: 1384, height: 56}}>
            <div style={{position: 'absolute', right: 0, top: 0}}>
              <McdText size={22} weight={600} color="#9AA0AA">{`${nextLabel}：${level + 1}`}</McdText>
            </div>
            <div style={{position: 'absolute', left: 0, top: 22, display: 'flex', alignItems: 'center', gap: 14}}>
              <svg width={32} height={32} viewBox="0 0 8 8" shapeRendering="crispEdges">
                <rect x={0} y={0} width={8} height={8} fill="none" stroke={MCD.ap} strokeWidth={1} />
                <rect x={3} y={1} width={2} height={6} fill={MCD.ap} />
                <rect x={1} y={3} width={6} height={2} fill={MCD.ap} />
                <rect x={3} y={3} width={2} height={2} fill="#fff" />
              </svg>
              <McdText size={26} weight={700}>AP</McdText>
            </div>
            <div style={{position: 'absolute', left: 104, right: 0, top: 30, height: 16, background: '#39363A'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ap * 36}%`, background: MCD.ap}} />
            </div>
          </div>
          <div style={{position: 'absolute', left: 96, top: 822, display: 'flex', gap: 30}}>
            {stats.map(([label, v, suf], i) => (
              <StatCard key={label} label={label} value={`${fmt(roll(cardAt[i] + 4, 26, v))}${suf}`} w={319} h={172} reveal={1} />
            ))}
          </div>

          {/* chest in a gilded diamond */}
          <div style={{position: 'absolute', left: 1560, top: 730}}>
            <div style={{position: 'relative', width: 270, height: 270, transform: `scale(${0.92 + 0.08 * popA(52)})`}}>
              <DiamondFrame size={270} tier="gilded" glow={`rgba(255,205,80,${0.32 + chestPulse * 0.3})`}>
                <div style={{transform: `translate(${chestShake}px, 6px)`}}>
                  <div style={{position: 'relative'}}>
                    <ChestIcon variant="ender" scale={11} open={f >= 120 ? 0.2 * chestPulse : 0} style={{filter: 'brightness(1.9) contrast(1.1)'}} />
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
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const pos = [
                [-6, 62], [262, 40], [20, 232], [248, 214], [128, -14], [286, 130],
              ][(i + Math.floor((f + 6) / 36) * 2) % 6];
              const t = ((f + i * 7) % 24) / 24;
              return f > 80 ? <Twinkle key={i} x={pos[0] + (i % 2 ? 6 : -6)} y={pos[1]} t={t} u={4} c="#FFF2B0" /> : null;
            })}
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#000', opacity: black, pointerEvents: 'none'}} />
      {audio && <Sfx at={36} src={mcSound('random/orb')} volume={0.3} />}
      {audio && <Sfx at={62} src={mcSound('random/click')} volume={0.2} />}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-results',
      name: '结算页 · 压黑转场',
      category: 'rpg',
      tags: ['地下城', '结算', '黑场', '统计', '宝箱'],
      frames: TOTAL,
      blurb: '关卡画面压黑 0.5s、黑场停 0.5s，整页淡入：金色菱形框头像+月桂+等级徽章，击败数滚动，四格深色统计卡逐个数字滚动，右下金框宝箱抖动并闪星，最后淡黑收尾。',
      usage: '视频结尾的数据总结（时长、素材数、版本号）；或一个关卡/阶段完成后的“成绩单”。Layer 版自带压黑与暗色蒙版，叠在素材上即可。',
      params: [
        {name: 'level / name / kills / unit', desc: '等级、玩家名、主数字及其说明'},
        {name: 'stage / mission', desc: '顶部小标题与大标题'},
        {name: 'stats', desc: '四格统计 [标签, 数值, 后缀]'},
        {name: 'bg', desc: '是否绘制模糊的 3D 场景背景'},
      ],
    },
    Demo: () => <Results bg />,
    Layer: () => <Results />,
  },
];
void snap;
