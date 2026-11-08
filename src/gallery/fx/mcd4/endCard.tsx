/**
 * mcd-c-end-card - end title card (trailer-end-title-logo): four pixel brackets + hairline frame, stone kicker, orange logo with
 * braces, gold "thanks" line, link, studio row and a small note, embers over a warm floor glow.
 * Props: kicker, title, thanks, link, studios (string[]), note, bg (false = transparent Layer), exit (frame the card dims out), cjkRows.
 */
import {type FC, type ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {PxText} from '../mcdkit/kit';
import {Brace, CornerFrame, CrossFlash, Dim, RiseSparks, TexText, TrailerBg, ramp, stepped, useFitPx} from './lib';

const Rise: FC<{f: number; at: number; dur?: number; dy?: number; children: ReactNode}> = ({f, at, dur = 10, dy = 14, children}) => {
  const t = stepped(ramp(f, at, at + dur), 4);
  return <div style={{opacity: t, transform: `translateY(${(1 - t) * dy}px)`}}>{children}</div>;
};

export const EndCard: FC<{
  kicker?: string;
  title?: string;
  thanks?: string;
  link?: string;
  studios?: string[];
  note?: string;
  bg?: boolean;
  audio?: boolean;
  exit?: number;
  cjkRows?: number;
}> = ({kicker = '我的世界 · 冒险日志', title = '地底迷城', thanks = '感谢观看', link = '订阅频道，不错过下一期更新', studios = ['Oriel 工作室', '地下城风格素材库'], note = '© 2026 Oriel Studio · 部分画面为后期合成', bg = true, audio = true, exit = 186, cjkRows = 28}) => {
  const f = useCurrentFrame();
  const out = 1 - stepped(ramp(f, exit, exit + 18), 6);
  const tpx = useFitPx(title, 1060, 10, {cjkRows});
  const braceIn = ramp(f, 12, 26);
  return (
    <AbsoluteFill>
      {audio && (
        <>
          <Sfx at={8} src={reelSfx('transition-soft.mp3')} volume={0.35} />
          <Sfx at={34} src={mcSound('ui/toast/in')} volume={0.3} />
          <Sfx at={48} src={mcSound('random/click')} volume={0.15} rate={1.3} />
        </>
      )}
      {bg && <TrailerBg glow={1.5} />}
      {bg && <Dim kind="edges" a={0.6} size={0.5} />}
      <div style={{position: 'absolute', inset: 0, opacity: out}}>
        <RiseSparks count={46} seed={8} area={[60, 300, 1800, 740]} debris={3} alpha={ramp(f, 8, 30)} />
        <CornerFrame grow={ramp(f, 2, 26)} />
        <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 150}}>
          <Rise f={f} at={8}>
            <TexText text={kicker} px={3} look="stone" depth={2} seed={3} cjkRows={cjkRows} />
          </Rise>
          <div style={{height: 38}} />
          <Rise f={f} at={10} dy={16}>
            <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
              <div style={{transform: `translateX(${(1 - braceIn) * -60}px)`, opacity: braceIn}}>
                <Brace px={10} />
              </div>
              <TexText text={title} px={tpx} look="logo" depth={3} seed={5} cjkRows={cjkRows} />
              <div style={{transform: `translateX(${(1 - braceIn) * 60}px)`, opacity: braceIn}}>
                <Brace px={10} flip />
              </div>
            </div>
          </Rise>
          <div style={{height: 96}} />
          <Rise f={f} at={34}>
            <TexText text={thanks} px={6} look="gold" depth={2} seed={2} cjkRows={cjkRows} />
          </Rise>
          <div style={{height: 46}} />
          <Rise f={f} at={48}>
            <PxText text={link} px={3} color="#F2EEE6" shadowColor="#1A1418" />
          </Rise>
          <div style={{flex: 1}} />
          <Rise f={f} at={62}>
            <div style={{display: 'flex', alignItems: 'center', gap: 44}}>
              {studios.map((s, i) => (
                <div key={s} style={{display: 'flex', alignItems: 'center', gap: 44}}>
                  {i > 0 && <div style={{width: 4, height: 44, background: '#4A4A54'}} />}
                  <PxText text={s} px={3} color="#C8C6CE" shadowColor="#0A080C" />
                </div>
              ))}
            </div>
          </Rise>
          <div style={{height: 30}} />
          <Rise f={f} at={70}>
            <PxText text={note} px={2} color="#7C7A86" shadow={0} cjkRows={16} />
          </Rise>
          <div style={{height: 82}} />
        </AbsoluteFill>
        <CrossFlash x={1400} y={430} at={34} size={110} />
      </div>
    </AbsoluteFill>
  );
};
