import type {FC} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {YouyikuIntro} from './YouyikuIntro';

/** 视频封面（单帧）：片头定格 + 一排真实转场画面。渲染：npx remotion still src/index.ts Cover cover.png */

const COUNT_TEXT = '200+ 个 Minecraft 风格效果';
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

const Tiles: FC = () => (
  <>
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
  </>
);

export const Cover: FC = () => (
  <AbsoluteFill>
    <Sequence from={-SETTLED}>
      <YouyikuIntro time="noon" channel={COUNT_TEXT} />
    </Sequence>
    <Tiles />
  </AbsoluteFill>
);

/**
 * 4:3 封面，1920×1440。正中 1920×1080 就是上面的 16:9 封面，所以 4:3 图按中心裁成 16:9 时标题和转场画面完整保留（上下各 180 像素只有天空和地面）。
 * 上下两条用放大的同一个片头做底，与中间区域在 70 像素内渐变衔接。渲染：npx remotion still src/index.ts Cover43 cover43.png
 */
const BAND = 180;
const FEATHER = 70;
export const Cover43: FC = () => (
  <AbsoluteFill style={{background: '#7fbcf0'}}>
    <div style={{position: 'absolute', left: -320, top: 0, width: 1920, height: 1080, transform: 'scale(1.3333)', transformOrigin: '0 0'}}>
      <Sequence from={-SETTLED}>
        <YouyikuIntro time="noon" channel={COUNT_TEXT} />
      </Sequence>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: BAND,
        width: 1920,
        height: 1080,
        WebkitMaskImage: `linear-gradient(to bottom, transparent 0, #000 ${FEATHER}px, #000 ${1080 - FEATHER}px, transparent 100%)`,
        maskImage: `linear-gradient(to bottom, transparent 0, #000 ${FEATHER}px, #000 ${1080 - FEATHER}px, transparent 100%)`,
      }}
    >
      <Sequence from={-SETTLED}>
        <YouyikuIntro time="noon" channel={COUNT_TEXT} />
      </Sequence>
    </div>
    <div style={{position: 'absolute', left: 0, top: BAND, width: 1920, height: 1080}}>
      <Tiles />
    </div>
  </AbsoluteFill>
);
