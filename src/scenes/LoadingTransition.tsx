import type {FC} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {sound, tex} from '../mc/assets';
import {BlockBackdrop, PixelBurst, Twinkles} from '../mc/Fx';
import {BlockTitle, McText} from '../mc/McText';
import {Player3D, type PoseName} from '../mc/Player3D';
import {EASE, MC, WIDTH, clamp01} from '../mc/theme';

/**
 * Template: the "brand" transition (~4.5 s).
 * A tiled block background, the channel name, the video title + subtitle,
 * and an XP-style loading bar with the creator's character running along it.
 *
 * Timeline (frames at 30 fps):
 *   0-12   wipe in (pixel blocks cover the previous shot)
 *   8-26   channel tag + title slam in
 *   20-110 bar fills, character runs on top of the fill edge
 *   110-125 bar full: burst + "levelup"
 *   125-end wipe out
 */
export type LoadingProps = {
  channel: string;
  title: string;
  subtitle: string;
  backdrop?: string;
  skin?: string;
  pose?: PoseName;
  heldItem?: string;
  accent?: string;
};

const BAR_W = 1100;
const BAR_H = 34;

export const LoadingTransition: FC<LoadingProps> = ({channel, title, subtitle, backdrop = 'deepslate', skin, pose = 'run', heldItem, accent = MC.green}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const outStart = durationInFrames - 14;

  const fillStart = 20;
  const fillEnd = 110;
  // Loading bars that are believable stall a little: ease with a small plateau.
  const raw = clamp01((frame - fillStart) / (fillEnd - fillStart));
  const fill = raw < 0.55 ? EASE.out(raw / 0.55) * 0.62 : 0.62 + EASE.inOut((raw - 0.55) / 0.45) * 0.38;
  const pct = Math.round(fill * 100);

  const barX = (WIDTH - BAR_W) / 2;
  const barY = 800;
  const runnerX = barX + fill * BAR_W;

  const t = clamp01((frame - 8) / 14);
  const titleScale = t === 0 ? 0 : interpolate(EASE.back(t), [0, 1], [1.8, 1]);
  const sub = clamp01((frame - 20) / 12);

  return (
    <AbsoluteFill>
      <BlockBackdrop texture={backdrop} darken={0.5} drift={0.8} tile={120} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(80,255,120,0.10), transparent 60%)'}} />

      {/* channel tag */}
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: clamp01((frame - 6) / 8), transform: `translateY(${(1 - EASE.out(clamp01((frame - 6) / 12))) * -30}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(0,0,0,0.55)', padding: '8px 24px 12px', boxShadow: `inset 0 -6px 0 ${accent}`}}>
          <Img src={tex('block/grass_block_side.png')} style={{width: 48, height: 48, imageRendering: 'pixelated'}} />
          <McText size={48} color={MC.yellow}>{channel}</McText>
        </div>
      </div>

      {/* title */}
      <div style={{position: 'absolute', top: 290, width: '100%', textAlign: 'center', transform: `scale(${titleScale})`}}>
        <BlockTitle size={170} color="#FFFFFF" edge="#1B3A1B" depth={9}>
          {title}
        </BlockTitle>
      </div>
      <div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center', opacity: sub, transform: `translateY(${(1 - EASE.out(sub)) * 24}px)`}}>
        <McText size={60} color={MC.gray}>{subtitle}</McText>
      </div>

      {/* bar: vanilla XP bar look, drawn at scale for crisp pixels */}
      <div style={{position: 'absolute', left: barX - 6, top: barY - 6, width: BAR_W + 12, height: BAR_H + 12, background: '#000', opacity: clamp01((frame - 14) / 6)}}>
        <div style={{position: 'absolute', left: 6, top: 6, width: BAR_W, height: BAR_H, background: '#2B2B2B', boxShadow: 'inset 0 6px 0 #1A1A1A'}} />
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 6,
            width: BAR_W * fill,
            height: BAR_H,
            background: `linear-gradient(${accent}, #2E9E2E)`,
            boxShadow: 'inset 0 6px 0 rgba(255,255,255,0.35), inset 0 -6px 0 rgba(0,0,0,0.25)',
          }}
        />
        {/* segment ticks like the XP bar */}
        {Array.from({length: 17}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: 6 + ((i + 1) * BAR_W) / 18 - 3, top: 6, width: 6, height: BAR_H, background: 'rgba(0,0,0,0.35)'}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: barX, top: barY + BAR_H + 22, width: BAR_W, display: 'flex', justifyContent: 'space-between', opacity: clamp01((frame - 14) / 6)}}>
        <McText size={36} color={MC.gray}>正在加载世界…</McText>
        <McText size={36} color={accent}>{`${pct}%`}</McText>
      </div>

      {/* runner: feet sit on the bar, centered on the fill edge */}
      {frame >= fillStart - 6 && (
        <div style={{position: 'absolute', left: runnerX - 100, top: barY - 232, opacity: clamp01((frame - fillStart + 6) / 6)}}>
          <Player3D width={200} height={240} pose={frame < fillEnd ? pose : 'cheer'} yaw={90} pitch={4} zoom={0.92} skin={skin} heldItem={heldItem} speed={1} />
        </div>
      )}
      {/* dust kicked up behind the runner */}
      {frame >= fillStart && frame < fillEnd && Array.from({length: 6}, (_, i) => {
        const age = (frame + i * 5) % 30;
        return <div key={i} style={{position: 'absolute', left: runnerX - 40 - age * 3, top: barY - 14 - age * 0.8, width: 12, height: 12, background: '#BFBFBF', opacity: (1 - age / 30) * 0.7}} />;
      })}
      <PixelBurst x={barX + BAR_W} y={barY + BAR_H / 2} at={fillEnd} seed={4} count={50} colors={[accent, MC.yellow, '#FFFFFF']} />
      {frame >= fillEnd && <Twinkles x={barX + BAR_W} y={barY - 80} radius={160} seed={5} />}

      <PixelWipe frame={frame} inEnd={12} outStart={outStart} outEnd={durationInFrames} />

      <Sequence from={fillEnd} durationInFrames={50}>
        <Audio src={sound('random/levelup')} volume={0.6} />
      </Sequence>
      <Sequence from={8} durationInFrames={30}>
        <Audio src={sound('ui/toast/in')} volume={0.7} />
      </Sequence>
      {Array.from({length: 9}, (_, i) => (
        <Sequence key={i} from={fillStart + i * 10} durationInFrames={10}>
          <Audio src={sound(`step/grass${(i % 4) + 1}`)} volume={0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/**
 * Blocky wipe: a grid of black squares that pop in/out in a diagonal wave.
 * Used at the start and end of transitions to hide cuts.
 */
export const PixelWipe: FC<{frame: number; inEnd?: number; outStart?: number; outEnd?: number; cell?: number}> = ({frame, inEnd, outStart, outEnd, cell = 120}) => {
  const {width, height} = useVideoConfig();
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = (x + y) / (cols + rows); // 0..1 diagonal order
      let s = 0;
      if (inEnd !== undefined && frame < inEnd) s = 1 - clamp01((frame - d * inEnd * 0.7) / (inEnd * 0.3));
      if (outStart !== undefined && outEnd !== undefined && frame >= outStart) {
        const len = outEnd - outStart;
        s = Math.max(s, clamp01((frame - outStart - d * len * 0.7) / (len * 0.3)));
      }
      if (s <= 0) continue;
      cells.push(<div key={`${x}-${y}`} style={{position: 'absolute', left: x * cell + (cell * (1 - s)) / 2, top: y * cell + (cell * (1 - s)) / 2, width: cell * s + 1, height: cell * s + 1, background: '#0B0B0B'}} />);
    }
  }
  return <AbsoluteFill>{cells}</AbsoluteFill>;
};
