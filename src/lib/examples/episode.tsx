import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {
  McdEndCard,
  McdLEmbers,
  McdLGodRays,
  McdLGradeForest,
  McdLGradeForestGlow,
  McdLocationLabel,
  McdSeriesTitle,
  McdVObjectives,
  McdVToast,
  ScenePlate,
  TransitionSeries,
  makeMcdLoadingLabel,
  mcdBlackCut,
  mcdPortalWhiteout,
  seriesFrames,
} from '..';

/**
 * ONE COMPLETE EPISODE built only from the library — copy this file as the starting point of a real video.
 *
 *   - Every "footage" below is a <ScenePlate/> placeholder. In a real video replace the placeholder with your recording:
 *       <OffthreadVideo src={staticFile('footage/part1.mp4')} />            (import from 'remotion')
 *     keep everything else exactly the same.
 *   - Overlays (titles, objectives, grading layers) live INSIDE the shot, in <Sequence from=... durationInFrames=...>,
 *     so their local frame 0 is where you place them. Give every overlay the catalog's `frames` as its duration.
 *   - Transitions go between shots through <TransitionSeries>. `dur` of a shot INCLUDES the overlap with its neighbours.
 *   - Total length = seriesFrames(shots, transitions).
 */

const Shot: FC<{biome: 'forest-day' | 'camp' | 'nether' | 'end'; children?: ReactNode}> = ({biome, children}) => (
  <AbsoluteFill>
    {/* REPLACE with your footage */}
    <ScenePlate biome={biome} camera="static" />
    {children}
  </AbsoluteFill>
);

/** Shot 1: opening. Forest grade + god rays on the footage, series title card on top. */
const Opening: FC = () => (
  <Shot biome="forest-day">
    <McdLGradeForest />
    <McdLGradeForestGlow />
    <McdLGodRays angle={18} />
    <Sequence from={20} durationInFrames={150}>
      <McdSeriesTitle ep={5} kicker="生存系列 · 第二季" title="沉入地牢深处" subtitle="我们在红石矿山找到了失落的神器" />
    </Sequence>
  </Shot>
);

/** Shot 2: camp. Destination label and the objective list. */
const Camp: FC = () => (
  <Shot biome="camp">
    <Sequence from={20} durationInFrames={150}>
      <McdLocationLabel place="营地" sub="正在前往" />
    </Sequence>
    <Sequence from={60} durationInFrames={180}>
      <McdVObjectives
        chapter="第一章 · 出发"
        announceLabel="新目标"
        items={[
          {text: '收集 10 块红石', appear: 10, done: 90},
          {text: '找到矿山入口', appear: 40, done: 140},
          {text: '活着回来', appear: 110},
        ]}
      />
    </Sequence>
  </Shot>
);

/** Shot 3: the nether. Embers layer plus an achievement toast. */
const Nether: FC = () => (
  <Shot biome="nether">
    <McdLEmbers />
    <Sequence from={90} durationInFrames={150}>
      <McdVToast parts={['achievement']} title="成就达成" name="第一滴血" xp="+20 XP" item="iron_sword" />
    </Sequence>
  </Shot>
);

/** Shot 4: end card on its own background. */
const Ending: FC = () => (
  <AbsoluteFill>
    <McdEndCard bg kicker="我的世界 · 冒险日志" title="地底迷城" thanks="感谢观看" studios={['Oriel 工作室']} />
  </AbsoluteFill>
);

// Transitions: black cut -> loading label (custom text) -> portal whiteout.
const loadMine = makeMcdLoadingLabel({place: '红石矿山', caption: '正在前往', difficulty: 'III', biome: 'nether'});
const transitions = [mcdBlackCut, loadMine, mcdPortalWhiteout];

// Each shot's `dur` includes the overlap with its neighbours (see seriesFrames).
const shots = [
  {dur: 240 + mcdBlackCut.frames - mcdBlackCut.bStart, C: Opening},
  {dur: 240 + loadMine.frames - loadMine.bStart, C: Camp},
  {dur: 240 + mcdPortalWhiteout.frames - mcdPortalWhiteout.bStart, C: Nether},
  {dur: 210, C: Ending},
];

export const EPISODE_FRAMES = seriesFrames(shots, transitions);

export const EpisodeExample: FC = () => <TransitionSeries shots={shots} transitions={transitions} />;

export const examples: {id: string; Component: FC; frames: number}[] = [{id: 'example-episode', Component: EpisodeExample, frames: EPISODE_FRAMES}];
