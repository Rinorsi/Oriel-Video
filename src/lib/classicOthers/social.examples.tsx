import type {FC} from 'react';
import {AbsoluteFill, Loop, Sequence} from 'remotion';
import {SocBell, SocCoin, SocDanmaku, SocFavorite, SocFollow, SocFollowCorner, SocLike, SocMilestone, SocShare, SocTriple} from './social';

/**
 * Runnable examples for classicOthers/social. Each lays the (transparent) effect over a placeholder gradient with
 * a 15-frame lead-in, as in a real video: <Sequence from={15} durationInFrames={effect frames}>. Same JSX as the catalog's `example`.
 */

const ExLike: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #3b6aa0, #8fd3ff)'}}>
    <Sequence from={15} durationInFrames={120}>
      <SocLike count={9527} tapAt={26} />
    </Sequence>
  </AbsoluteFill>
);

const ExFollow: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #7a4a2a, #e8b86a)'}}>
    <Sequence from={15} durationInFrames={150}>
      <SocFollow name="红石小能手" face="alex" fans={9999} tapAt={58} />
    </Sequence>
  </AbsoluteFill>
);

const ExCoin: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #141028, #3b2a7a)'}}>
    <Sequence from={15} durationInFrames={135}>
      <SocCoin count={64} label="硬币" doneText="投币成功" />
    </Sequence>
  </AbsoluteFill>
);

const ExFavorite: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #1f4d3a, #6cc08a)'}}>
    <Sequence from={15} durationInFrames={135}>
      <SocFavorite count={512} closeAt={86} />
    </Sequence>
  </AbsoluteFill>
);

const ExTriple: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #141028, #3b2a7a)'}}>
    <Sequence from={15} durationInFrames={240}>
      <SocTriple fireAt={62} boomAt={118} title="三连成功!" thanks="感谢支持，下期见！" />
    </Sequence>
  </AbsoluteFill>
);

const ExBell: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #7a4a2a, #e8b86a)'}}>
    <Sequence from={15} durationInFrames={120}>
      <SocBell kickAt={24} title="已开启小铃铛" sub="UP主一更新，第一时间通知你" />
    </Sequence>
  </AbsoluteFill>
);

const ExDanmaku: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #1f4d3a, #6cc08a)'}}>
    <Sequence from={15} durationInFrames={180}>
      <SocDanmaku gap={17} hotIndex={2} header="评论" />
    </Sequence>
  </AbsoluteFill>
);

const ExShare: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #3b6aa0, #8fd3ff)'}}>
    <Sequence from={15} durationInFrames={135}>
      <SocShare target={2} launchAt={32} flight={54} />
    </Sequence>
  </AbsoluteFill>
);

const ExFollowCorner: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #141028, #3b2a7a)'}}>
    <Sequence from={15} durationInFrames={240}>
      <Loop durationInFrames={120}>
        <SocFollowCorner corner="br" scale={1.25} name="红石小能手" fans="12.8万 粉丝" face="alex" />
      </Loop>
    </Sequence>
  </AbsoluteFill>
);

const ExMilestone: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #141028, #3b2a7a)'}}>
    <Sequence from={15} durationInFrames={210}>
      <SocMilestone target={10000} label="粉丝" banner="万粉达成！" thanks="感谢大家!" />
    </Sequence>
  </AbsoluteFill>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'soc-like', Component: ExLike, frames: 150},
  {id: 'soc-follow', Component: ExFollow, frames: 180},
  {id: 'soc-coin', Component: ExCoin, frames: 165},
  {id: 'soc-favorite', Component: ExFavorite, frames: 165},
  {id: 'soc-triple', Component: ExTriple, frames: 270},
  {id: 'soc-bell', Component: ExBell, frames: 150},
  {id: 'soc-danmaku', Component: ExDanmaku, frames: 210},
  {id: 'soc-share', Component: ExShare, frames: 165},
  {id: 'soc-follow-corner', Component: ExFollowCorner, frames: 270},
  {id: 'soc-milestone', Component: ExMilestone, frames: 240},
];
