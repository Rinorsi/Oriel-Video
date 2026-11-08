// mcd-v-toast: achievement / hint toasts and the "hold to skip" prompt (toast-achievement-unlocked-*.jpg, cutscene-skip.jpg).
// Stacked chamfered bars slide in from the right screen edge with a hard 1-step overshoot, hold, then slide out: a gold-diamond
// "achievement unlocked" bar (shine, pixel cross flash, debris) and a purple "hint" bar with a key cap. A bottom-right "hold to skip"
// prompt fills its key cap while held and flashes when the skip completes.
// Props: title/name/xp/item (achievement), tag/tip/keyLabel (hint), skipText/skipKey, bg, biome. Frames are fixed: ach 8-82, hint 40-118, skip 30-132.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {DiamondFrame, ItemIcon3D, MCD, McdText, PxText, WhiteFlash, itemTex} from '../mcdkit/kit';
import {Burst, CrossFlash, SceneBg, Shine, stepQ, win, type BiomeId} from './common';

const slideX = (f: number, at: number, hold: number, dist: number) => {
  const tIn = win(f, at, 9);
  const outAt = at + 9 + hold;
  const tOut = win(f, outAt, 7);
  const over = tIn >= 1 && f < at + 12 ? -14 : 0;
  return Math.round((dist * (1 - EASE.out(tIn)) + dist * EASE.in(tOut) + over) / 6) * 6;
};

const Bar: FC<{w: number; h: number; cut?: number; edge?: string; accent?: string; glowTint?: string; children: React.ReactNode}> = ({w, h, cut = 28, edge = '#4A4A52', accent = MCD.goldBright, glowTint = 'rgba(200,140,30,0.14)', children}) => (
  <div style={{position: 'relative', width: w, height: h}}>
    <svg width={w + 16} height={h + 16} style={{position: 'absolute', left: -8, top: -8, overflow: 'visible'}}>
      <polygon points={`${cut + 8},16 ${w + 8},16 ${w + 8},${h + 16} 8,${h + 16} 8,${cut + 16}`} fill="#000" opacity={0.55} />
    </svg>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <polygon points={`${cut},0 ${w},0 ${w},${h} 0,${h} 0,${cut}`} fill={edge} />
      <polygon points={`${cut + 2},4 ${w - 4},4 ${w - 4},${h - 4} 4,${h - 4} 4,${cut + 2}`} fill="#121216" />
      <polygon points={`${cut + 2},4 ${w - 4},4 ${w - 4},${h - 4} 4,${h - 4} 4,${cut + 2}`} fill={glowTint} />
      <rect x={4} y={cut + 2} width={8} height={h - cut - 6} fill={accent} />
    </svg>
    {children}
  </div>
);

const HoldKey: FC<{label: string; fill: number; pressed: boolean; done: boolean; size?: number}> = ({label, fill, pressed, done, size = 68}) => {
  const c = 14;
  const o = 5;
  const pts = (i: number) => `${c + i},${i} ${size - i},${i} ${size - i},${size - c - i} ${size - c - i},${size - i} ${i},${size - i} ${i},${c + i}`;
  const dy = pressed ? 6 : 0;
  return (
    <div style={{position: 'relative', width: size, height: size + 8, flex: 'none'}}>
      <svg width={size} height={size + 8} style={{position: 'absolute', left: 0, top: 0}}>
        <polygon points={pts(0)} fill="#000" transform={`translate(0 8)`} />
        <g transform={`translate(0 ${dy})`}>
          <polygon points={pts(0)} fill="#000" />
          <polygon points={pts(o)} fill="#3E3E42" />
          <clipPath id="holdfill">
            <polygon points={pts(o)} />
          </clipPath>
          <rect x={0} y={size - (size * fill)} width={size} height={size * fill} fill={done ? '#FFFFFF' : MCD.goldBright} clipPath="url(#holdfill)" />
          <rect x={o} y={o} width={size - 2 * o} height={5} fill="rgba(255,255,255,0.28)" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, top: dy, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <PxText text={label} px={4} color={fill > 0.55 ? '#3A2200' : '#fff'} shadow={fill > 0.55 ? 0 : 1} />
      </div>
    </div>
  );
};

export const ToastStack: FC<{
  bg?: boolean;
  title?: string;
  name?: string;
  xp?: string;
  item?: string;
  tag?: string;
  tip?: string;
  keyLabel?: string;
  skipText?: string;
  skipHint?: string;
  skipKey?: string;
  biome?: BiomeId;
  /** 提示条按键后的后半句，默认「打开地图」 */
  tipSuffix?: string;
  /** 要显示哪几块：achievement 成就条 / hint 提示条 / skip 右下「按住跳过」，默认全部 */
  parts?: ('achievement' | 'hint' | 'skip')[];
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, title = '成就解锁!', name = '深渊的第一步', xp = '+50 XP', item = 'diamond_pickaxe', tag = '提示', tip = '按下', keyLabel = 'M', skipText = '跳过', skipHint = '按住', skipKey = 'E', biome = 'nether', tipSuffix = '打开地图', parts = ['achievement', 'hint', 'skip'], audio = true}) => {
  const showAch = parts.includes('achievement');
  const showTip = parts.includes('hint');
  const showSkip = parts.includes('skip');
  const f = useCurrentFrame();
  const ACH = 8;
  const ACH_HOLD = 64;
  const TIP = 40;
  const TIP_HOLD = 70;
  const SKIP = 30;
  const HOLD_FROM = 56;
  const HOLD_TO = 118;
  const fill = f < HOLD_FROM ? 0 : stepQ((f - HOLD_FROM) / (HOLD_TO - HOLD_FROM), 16);
  const pressed = f >= HOLD_FROM && f < HOLD_TO + 2;
  const done = f >= HOLD_TO;
  const skipIn = EASE.out(win(f, SKIP, 8));
  const skipOut = f >= HOLD_TO + 6 ? win(f, HOLD_TO + 6, 8) : 0;
  const achX = slideX(f, ACH, ACH_HOLD, 900);
  const tipX = slideX(f, TIP, TIP_HOLD, 800);
  const achLand = ACH + 9;
  return (
    <AbsoluteFill>
      {bg && (
        <SceneBg biome={biome} dim={0.22} tint="12,4,6">
          {/* cutscene letterbox */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 96 * stepQ(win(f, 0, 10), 5), background: '#000'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 * stepQ(win(f, 0, 10), 5), background: '#000'}} />
        </SceneBg>
      )}
      <div style={{position: 'absolute', right: 0, top: 0, width: 1000, height: 720, background: 'radial-gradient(ellipse 100% 100% at 100% 30%, rgba(2,4,10,0.55), rgba(2,4,10,0) 70%)'}} />

      {/* achievement */}
      {showAch && f >= ACH && f < ACH + 9 + ACH_HOLD + 9 && (
        <div style={{position: 'absolute', right: 80, top: 236, transform: `translateX(${achX}px)`}}>
          <Bar w={820} h={180} cut={32}>
            <div style={{position: 'absolute', left: 36, top: 16}}>
              <DiamondFrame size={148} tier="gilded" glow="rgba(255,205,80,0.55)">
                <ItemIcon3D src={itemTex(item)} size={72} depth={5} />
              </DiamondFrame>
            </div>
            <div style={{position: 'absolute', left: 214, top: 28, display: 'flex', flexDirection: 'column', gap: 14}}>
              <PxText text={title} px={4} color={MCD.goldBright} shadowColor="#2A1600" />
              <McdText size={40} weight={700} color="#F4F4F6">{name}</McdText>
            </div>
            <div style={{position: 'absolute', right: 30, bottom: 20}}>
              <McdText size={30} weight={800} color={MCD.purple} style={{letterSpacing: 2}}>{xp}</McdText>
            </div>
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: 'polygon(32px 0,100% 0,100% 100%,0 100%,0 32px)'}}>
              <Shine at={achLand + 2} dur={16} w={80} opacity={0.3} color="#FFF6C0" />
              <Shine at={achLand + 34} dur={16} w={60} opacity={0.18} color="#FFF6C0" />
            </div>
          </Bar>
        </div>
      )}
      {showAch && (
        <>
          <CrossFlash x={1920 - 80 - 820 + 36 + 74} y={236 + 90} at={achLand} arm={92} thick={10} color="#FFF0B0" dur={12} />
          <Burst x={1920 - 80 - 820 + 36 + 74} y={236 + 90} at={achLand} count={16} size={10} speed={0.8} life={24} seed={5} />
        </>
      )}

      {/* hint */}
      {showTip && f >= TIP && f < TIP + 9 + TIP_HOLD + 9 && (
        <div style={{position: 'absolute', right: 80, top: 448, transform: `translateX(${tipX}px)`}}>
          <Bar w={740} h={136} cut={26} edge="#5A4A78" accent={MCD.purple} glowTint="rgba(150,90,230,0.16)">
            <div style={{position: 'absolute', left: 44, top: 0, height: 136, display: 'flex', alignItems: 'center', gap: 24}}>
              <div style={{background: MCD.purple, padding: '4px 16px', boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.3), inset -3px -3px 0 rgba(0,0,0,0.3)'}}>
                <McdText size={30} weight={800} color="#fff" style={{letterSpacing: 4, textShadow: '2px 2px 0 rgba(0,0,0,0.5)'}}>{tag}</McdText>
              </div>
              <McdText size={40} weight={600} color="#F0F0F4">{tip}</McdText>
              <HoldKey label={keyLabel} fill={0} pressed={f >= TIP + 22 && f < TIP + 28} done={false} size={72} />
              <McdText size={40} weight={600} color="#F0F0F4">{tipSuffix}</McdText>
            </div>
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: 'polygon(26px 0,100% 0,100% 100%,0 100%,0 26px)'}}>
              <Shine at={TIP + 11} dur={14} w={60} opacity={0.2} color="#E8D0FF" />
            </div>
          </Bar>
        </div>
      )}

      {/* hold to skip */}
      {showSkip && f >= SKIP && f < HOLD_TO + 6 + 8 && (
        <div style={{position: 'absolute', right: 80, bottom: 150 - (1 - skipIn) * -60 + skipOut * -40, opacity: stepQ(skipIn * (1 - skipOut), 4)}}>
          <Bar w={500} h={120} cut={24} edge="#4A4A52" accent={done ? '#FFFFFF' : MCD.goldBright} glowTint="rgba(0,0,0,0)">
            <div style={{position: 'absolute', left: 42, top: 0, height: 120, display: 'flex', alignItems: 'center', gap: 24}}>
              <McdText size={34} weight={700} color="#C8CCD4">{skipHint}</McdText>
              <HoldKey label={skipKey} fill={fill} pressed={pressed} done={done} size={76} />
              <PxText text={skipText} px={4} color={done ? MCD.goldBright : '#fff'} shadowColor={done ? '#2A1600' : undefined} />
            </div>
            <div style={{position: 'absolute', left: 14, right: 4, bottom: 4, height: 8, background: '#202026'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: done ? '#fff' : MCD.goldBright}} />
            </div>
          </Bar>
        </div>
      )}
      {showSkip && f >= HOLD_TO && f < HOLD_TO + 10 && <CrossFlash x={1920 - 80 - 500 + 42 + 120 + 38} y={1080 - 150 - 60 + 38} at={HOLD_TO} arm={80} thick={10} color="#FFFFFF" dur={10} />}
      <WhiteFlash at={HOLD_TO} dur={6} peak={bg ? 0.22 : 0.0} steps={3} />
      {audio && showAch && (
        <>
          <Sequence from={ACH}>
            <Audio src={mcSound('ui/toast/in')} volume={0.4} />
          </Sequence>
          <Sequence from={ACH + 4}>
            <Audio src={mcSound('ui/toast/challenge_complete')} volume={0.3} />
          </Sequence>
          <Sequence from={ACH + 9 + ACH_HOLD}>
            <Audio src={mcSound('ui/toast/out')} volume={0.3} />
          </Sequence>
        </>
      )}
      {audio && showTip && (
        <Sequence from={TIP}>
          <Audio src={mcSound('ui/toast/in')} volume={0.3} playbackRate={1.2} />
        </Sequence>
      )}
      {audio && showSkip && (
        <>
          <Sequence from={SKIP}>
            <Audio src={mcSound('random/click')} volume={0.25} />
          </Sequence>
          <Sequence from={HOLD_TO}>
            <Audio src={mcSound('random/orb')} volume={0.35} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
void clamp01;
