import type {FC} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {YouyikuIntro} from './YouyikuIntro';

/** 视频封面（单帧）：片头定格 + 一排真实转场画面。渲染：npx remotion still src/index.ts Cover cover.png */

const SETTLED = 130; // 片头里标题、副标题、数量都已出现的帧
const TILES: {id: string; at: number}[] = [
  {id: 'cute-creeper-rush', at: 1.0},
  {id: 'cute-slime-splat', at: 1.5},
  {id: 't2-end-portal', at: 1.0},
  {id: 't2-enderman-stare', at: 1.5},
  {id: 't2-lava-rise', at: 1.25},
];
const W = 330;
const H = 186;
const GAP = 24;
const X0 = (1920 - (TILES.length * W + (TILES.length - 1) * GAP)) / 2;

export const Cover: FC = () => (
  <AbsoluteFill>
    <Sequence from={-SETTLED}>
      <YouyikuIntro time="noon" />
    </Sequence>
    {TILES.map((t, i) => (
      <div
        key={t.id}
        style={{
          position: 'absolute',
          left: X0 + i * (W + GAP) - 8,
          top: 864 - 8,
          width: W + 16,
          height: H + 16,
          background: '#2a2733',
          border: '4px solid #14121a',
          boxShadow: '8px 8px 0 rgba(0,0,0,0.45)',
          padding: 4,
          boxSizing: 'border-box',
        }}
      >
        <div style={{width: W + 0, height: H, overflow: 'hidden', outline: '4px solid #8b8b8b', outlineOffset: -4, position: 'relative'}}>
          <OffthreadVideo src={staticFile(`promo2/hero/${t.id}_n.mp4`)} startFrom={Math.round(t.at * 30)} muted style={{width: W, height: H, objectFit: 'cover'}} />
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
