// mcd-kit-title-text: six ways the Dungeons title face appears. Targets: results-level-complete.jpg (white title with hard shadow,
// gold LEVEL COMPLETE), STYLE-MOTION trailer title card (hard cut to near-black, pixel-misaligned letters snapping into gold, embers),
// salvage.png / inventory (item names), enchant/numbers (rolling digits).
import type {FC, ReactNode} from 'react';
import {Loop, useCurrentFrame} from 'remotion';
import {EASE, mulberry32} from '../../../mc/theme';
import {Cap, win} from './common';
import {
  CutPanel,
  Embers,
  GlitchTitle,
  MCD,
  McdBackdrop,
  PxChars,
  PxText,
  TITLE_GOLD,
  TITLE_VICTORY,
  WhiteFlash,
} from './kit';

const PW = 560;
const PH = 460;

const Panel: FC<{i: number; label: string; note: string; children: ReactNode; bg?: string}> = ({i, label, note, children, bg = '#0A0A0E'}) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const f = useCurrentFrame();
  const t = EASE.out(win(f, i * 4, 10));
  return (
    <div style={{position: 'absolute', left: 80 + col * (PW + 40), top: 60 + row * (PH + 40), opacity: t, transform: `translateY(${(1 - t) * 24}px)`}}>
      <CutPanel w={PW} h={PH} cuts={[0, 28, 0, 0]} fill={bg} edge="#3A3A3E" corners>
        <div style={{position: 'absolute', left: 36, top: 30}}>
          <Cap size={22} color="#A8A8B0">{`0${i + 1}  ${label}`}</Cap>
        </div>
        <div style={{position: 'absolute', left: 36, bottom: 28}}>
          <Cap size={18} color="#6E7280">{note}</Cap>
        </div>
        <div style={{position: 'absolute', left: 0, top: 70, width: PW, height: PH - 130, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18}}>{children}</div>
      </CutPanel>
    </div>
  );
};

/** 01: darken, hold black, hard cut to the title (no tween). */
const HardCut: FC = () => {
  const f = useCurrentFrame();
  const black = f < 20 ? f / 20 : f < 26 ? 1 : 0;
  const show = f >= 26 && f < 66;
  return (
    <div style={{position: 'relative', width: PW, height: PH - 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16}}>
      <div style={{opacity: show ? 1 : f < 26 ? 1 : 0}}>
        <PxText text="LEVEL COMPLETE" px={3} {...TITLE_GOLD} />
      </div>
      <div style={{opacity: show ? 1 : f < 26 ? 1 : 0}}>
        <PxText text="CREEPER WOODS" px={4} />
      </div>
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: black}} />
    </div>
  );
};

/** 02: letters shifted by random whole pixels for 3 frames, then snapped together. */
const Misalign: FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'relative', width: PW - 40, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Embers count={16} area={[0, 20, PW - 40, 230]} size={8} seed={4} speed={0.7} />
      {f >= 6 && f < 64 ? <GlitchTitle text="DUNGEONS" at={6} glitch={4} amp={7} px={6} {...TITLE_GOLD} /> : null}
      <WhiteFlash at={10} dur={3} peak={0.18} steps={1} />
    </div>
  );
};

/** 03: per-letter drop with stepped easing. */
const LetterDrop: FC = () => {
  const f = useCurrentFrame();
  return (
    <PxChars
      text="UNIQUE"
      px={8}
      {...TITLE_VICTORY}
      glyph={(i) => {
        const t = Math.round(win(f, 6 + i * 3, 9) * 4) / 4;
        const y = (1 - t) * -90;
        return {transform: `translateY(${Math.round(y / 8) * 8}px)`, opacity: t > 0 ? 1 : 0};
      }}
    />
  );
};

/** 04: digits roll from random values and lock left to right. */
const RollNumber: FC = () => {
  const f = useCurrentFrame();
  const target = '1,576';
  const text = [...target]
    .map((ch, i) => {
      if (ch === ',') return ch;
      const lock = 18 + i * 6;
      if (f >= lock) return ch;
      return String(Math.floor(mulberry32(f * 13 + i * 7)() * 10));
    })
    .join('');
  const settle = f >= 42 && f < 48 ? 1 - (f - 42) / 6 : 0;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 38}}>
      <div style={{transform: `translateY(${-settle * 14}px)`}}>
        <PxText text={f >= 8 ? text : ''} px={9} />
      </div>
      <PxText text="DAMAGE TAKEN" px={3} color="#9AA3AE" shadow={0} />
    </div>
  );
};

/** 05: CJK title; the shadow starts far away (floating) and slams down to the 1px hard shadow. */
const Settle: FC = () => {
  const f = useCurrentFrame();
  const sh = f < 10 ? 0 : f < 14 ? 4 : f < 17 ? 3 : f < 20 ? 2 : 1;
  const hit = f >= 20 && f < 26 ? 1 - (f - 20) / 6 : 0;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${1 + hit * 0.06})`}}>
      <div style={{opacity: f >= 10 ? 1 : 0}}>
        <PxText text="任务完成" px={6} shadow={sh} />
      </div>
      <div style={{opacity: f >= 24 ? 1 : 0}}>
        <PxText text="胜利！战利品 +3" px={3} {...TITLE_VICTORY} />
      </div>
    </div>
  );
};

/** 06: centring check - guides show the ink box sits on the centre lines for Latin, CJK and mixed strings. */
const CenterCheck: FC = () => {
  const f = useCurrentFrame();
  const items = [
    {t: 'PERFECT', px: 7},
    {t: '战利品', px: 6},
    {t: 'LEVEL 战利品 99', px: 4},
  ];
  const k = Math.floor((f % 90) / 30);
  const it = items[k];
  return (
    <div style={{position: 'relative', width: PW - 60, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: '#2AB8D0', opacity: 0.7}} />
      <div style={{position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: '#2AB8D0', opacity: 0.7}} />
      <PxText text={it.t} px={it.px} />
    </div>
  );
};

export const TitleTextDemo: FC = () => {
  const f = useCurrentFrame();
  return (
    <McdBackdrop kind="void" drift={f * 0.3}>
      <Panel i={0} label="HARD CUT" note="Fade to black, hold, cut - no tween">
        <Loop durationInFrames={80} layout="none">
          <HardCut />
        </Loop>
      </Panel>
      <Panel i={1} label="PIXEL MISALIGN" note="Rows jump 4 frames, then snap + embers" bg={MCD.trailer}>
        <Loop durationInFrames={80} layout="none">
          <Misalign />
        </Loop>
      </Panel>
      <Panel i={2} label="LETTER DROP" note="Per-letter canvases, stepped easing">
        <Loop durationInFrames={80} layout="none">
          <LetterDrop />
        </Loop>
      </Panel>
      <Panel i={3} label="DIGIT ROLL" note="Digits lock left to right, then hop">
        <Loop durationInFrames={80} layout="none">
          <RollNumber />
        </Loop>
      </Panel>
      <Panel i={4} label="SHADOW SLAM" note="Chinese grid-pixel title, shadow 4 > 1 px">
        <Loop durationInFrames={80} layout="none">
          <Settle />
        </Loop>
      </Panel>
      <Panel i={5} label="EXACT CENTRE" note="Ink box centred on Latin, CJK, mixed">
        <CenterCheck />
      </Panel>
    </McdBackdrop>
  );
};
