import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Flash, LightRays} from '../../../mc/Fx';
import {item} from '../../../mc/assets';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE, OreButton, OreChip, OreProgress, OreText, PixelCursor, PlayIcon, TYPE, U, nine} from '../../../mg/Ore';
import {OreBg, Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import {transitionEntry} from '../../transition';
import type {FxEntry} from '../../types';
import {PlateA, PlateB} from '../../plates';
import {chapterDef} from './chapter';
import {BandTitle, ClickSpark, lerp, smooth} from './kit';

/**
 * Jumps A:
 *   jump-chapter       : see chapter.tsx (six slanted colour bands fill the screen, a centred chapter card slams on, bands run out).
 *   jump-next-episode  : the shot shrinks into a corner window, "下集预告" board unfolds (hero preview, text, buttons,
 *                        countdown bar), a cursor clicks "立即观看" and the preview expands to full screen.
 *   jump-pip-expand    : a rounded picture-in-picture window (frame, shadow, highlight edge; cursor hover + click) eases up to
 *                        full screen (corner radius -> square) while the old shot dims and blurs behind it; the old shot then
 *                        returns as a small PiP. No lines, no rings.
 * Tunables are constants/props at the top of each component (text, chapter numbers, rectangles).
 */

const gold = '#ffc93a';

// ================================================================ 8. next episode

export const T8 = 204;
const HERO = {x: 96, y: 216, w: 960, h: 540};
const WIN = {x: 1352, y: 776, w: 480, h: 270};
const FULL = {x: 0, y: 0, w: 1920, h: 1080};
type R = {x: number; y: number; w: number; h: number};
const mixR = (a: R, b: R, t: number): R => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});

/** Puts a full-size (1920x1080) shot into a rectangle by scaling it. */
const Fit: FC<{rect: R; children: ReactNode; style?: CSSProperties}> = ({rect, children, style}) => (
  <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: 'hidden', ...style}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${rect.w / 1920})`, transformOrigin: '0 0'}}>{children}</div>
  </div>
);

const Frame: FC<{rect: R; k: number; color?: string}> = ({rect, k, color = '#2b2338'}) => (
  <div style={{position: 'absolute', left: rect.x - 12 * k, top: rect.y - 12 * k, width: rect.w + 24 * k, height: rect.h + 24 * k, border: `${12 * k}px solid ${color}`, boxSizing: 'border-box', boxShadow: k > 0.05 ? `inset 0 0 0 ${4 * k}px rgba(255,255,255,0.35), 0 ${14 * k}px 0 rgba(0,0,0,0.5)` : undefined, pointerEvents: 'none'}} />
);

/** Props of NextEpisode: the two shots (A = the episode that just ended, B = the next-episode preview) and all on-screen text. */
export type NextEpisodeProps = {
  /** Outgoing shot (shrinks into the corner window). Default: PlateA placeholder. */
  A?: FC;
  /** Incoming shot (the preview that finally fills the screen). Default: PlateB placeholder. */
  B?: FC;
  /** Channel line in the top strip. */
  channel?: string;
  /** Red chip at the top left. */
  live?: string;
  /** Right text in the top strip. */
  range?: string;
  /** Big heading. */
  heading?: string;
  /** First chip under the heading. */
  tag?: string;
  /** Second chip (episode number). */
  ep?: string;
  /** Next episode title. */
  title?: string;
  /** Description lines (two). */
  desc?: string[];
  /** Label of the main button. */
  watch?: string;
  /** Label of the second button. */
  subscribe?: string;
  /** Chip over the preview image. */
  newChip?: string;
  /** Duration chip on the preview image. */
  duration?: string;
  /** Label before the "more episodes" slots. */
  moreLabel?: string;
  /** Item ids shown in the three "more episodes" slots. */
  moreItems?: string[];
  /** Chip above the small window (the finished episode). */
  replayChip?: string;
  /** Countdown text from the remaining seconds. */
  autoplay?: (sec: number) => string;
  /** Small text next to the countdown. */
  cancel?: string;
};

export const NextEpisode: FC<NextEpisodeProps> = ({
  A = PlateA,
  B = PlateB,
  channel = 'Oriel 频道 · 第一季',
  live = 'LIVE',
  range = 'EP.01 → EP.02',
  heading = '下集预告',
  tag = 'NEXT EPISODE',
  ep = 'EP.02',
  title = '深入下界',
  desc = ['穿过传送门，', '在岩浆湖畔建立第一座据点。'],
  watch = '立即观看',
  subscribe = '订阅',
  newChip = 'NEW · 下集',
  duration = '12:34',
  moreLabel = '更多剧集',
  moreItems = ['netherite_ingot', 'ender_pearl', 'diamond'],
  replayChip = '本集 · 回看',
  autoplay = (sec) => `${sec} 秒后自动播放`,
  cancel = '点击取消',
}) => {
  const f = useCurrentFrame();
  const shrink = EASE.inOut(clamp01((f - 18) / 32));
  const winRect = mixR(FULL, WIN, shrink);
  const stage = (at: number, d = 14) => prog(f, at, d, EASE.out);
  const bar = clamp01((f - 96) / 62);
  const sec = 5 - Math.min(4, Math.floor(bar * 5));
  const click = 160;
  const expand = EASE.inOut(clamp01((f - 166) / 30));
  const heroRect = mixR(HERO, FULL, expand);
  const pressed = f >= click && f < click + 6;
  const btnHover = f >= click - 14;
  // cursor path
  const cx = f < 120 ? 1600 : lerp(1600, 1330, EASE.inOut(clamp01((f - 120) / 36)));
  const cy = f < 120 ? 940 : lerp(940, 664, EASE.inOut(clamp01((f - 120) / 36)));
  const curA = smooth(116, 126, f) * (1 - smooth(click + 10, click + 18, f));
  const fade = 1 - expand;
  const slide = (at: number, from: number) => ({opacity: stage(at) * fade, transform: `translateX(${(1 - stage(at)) * from}px)`});
  const pulse = 1 + 0.04 * Math.sin(f / 4) * (btnHover ? 1 : 0);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {/* stage background */}
      <div style={{opacity: smooth(14, 30, f)}}>
        <OreBg tone="purple" />
        <AbsoluteFill style={{opacity: 0.35}}>
          <LightRays x={400} y={420} size={2600} color="190,140,255" opacity={0.3} rays={16} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(10,0,30,0.7) 100%)'}} />
      </div>
      {/* tab strip top */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 88, background: 'rgba(0,0,0,0.5)', borderBottom: `6px solid ${gold}`, opacity: stage(30) * fade, transform: `translateY(${(stage(30) - 1) * 88}px)`}}>
        <div style={{position: 'absolute', left: 96, top: 22, display: 'flex', gap: 16, alignItems: 'center'}}>
          <OreChip color={ORE.text} dot="#ff4d5e">
            {live}
          </OreChip>
          <OreText size={TYPE.small} color={ORE.dim}>
            {channel}
          </OreText>
        </div>
        <div style={{position: 'absolute', right: 96, top: 22}}>
          <OreText size={TYPE.small} color={ORE.dim}>
            {range}
          </OreText>
        </div>
      </div>
      {/* hero preview (the next episode) */}
      {f >= 30 && (
        <>
          <Fit rect={heroRect} style={{opacity: stage(34, 16)}}>
            <B />
          </Fit>
          <Frame rect={heroRect} k={1 - expand} color={gold} />
          <div style={{position: 'absolute', left: heroRect.x, top: heroRect.y, width: heroRect.w, height: heroRect.h, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: stage(44) * fade}}>
            <div style={{width: 160, height: 160, background: 'rgba(0,0,0,0.55)', border: '8px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.08 * Math.sin(f / 5)})`, boxShadow: `0 0 ${30 + 20 * Math.sin(f / 5)}px rgba(255,255,255,0.5)`}}>
              <PlayIcon size={72} />
            </div>
          </div>
          <div style={{position: 'absolute', left: heroRect.x + 20, top: heroRect.y + 20, opacity: stage(50) * fade}}>
            <OreChip color="#2a1c00" dot="#2a1c00" style={{background: gold}}>
              {newChip}
            </OreChip>
          </div>
          <div style={{position: 'absolute', left: heroRect.x + heroRect.w - 200, top: heroRect.y + heroRect.h - 70, opacity: stage(50) * fade}}>
            <OreChip color={ORE.text}>{duration}</OreChip>
          </div>
        </>
      )}
      {/* left-bottom: countdown */}
      <div style={{position: 'absolute', left: HERO.x, top: 800, width: HERO.w, ...slide(58, -120)}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
          <OreText size={TYPE.body} shadow>
            {autoplay(sec)}
          </OreText>
          <OreText size={TYPE.small} color={ORE.dim}>
            {cancel}
          </OreText>
        </div>
        <OreProgress value={bar} width={HERO.w} color="gold" />
      </div>
      <div style={{position: 'absolute', left: HERO.x, top: 928, display: 'flex', gap: 20, alignItems: 'center', ...slide(70, -120)}}>
        <OreText size={TYPE.small} color={ORE.dim}>
          {moreLabel}
        </OreText>
        {moreItems.map((id, i) => (
          <div key={id} style={{...nine('slot', [2, 2, 2, 2]), width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - prog(f, 72 + i * 4, 10, EASE.back)) * 40}px)`}}>
            <Img src={item(id)} style={{width: 64, height: 64, imageRendering: 'pixelated'}} />
          </div>
        ))}
      </div>
      {/* right column */}
      <div style={{position: 'absolute', left: 1140, top: 132, ...slide(36, 160)}}>
        <BandTitle size={156} tone="gold" ink={false}>
          {heading}
        </BandTitle>
      </div>
      <div style={{position: 'absolute', left: 1140, top: 308, display: 'flex', gap: 14, ...slide(46, 120)}}>
        <OreChip color={ORE.text} dot={gold}>
          {tag}
        </OreChip>
        <OreChip color={ORE.text} dot="#ff4d5e">
          {ep}
        </OreChip>
      </div>
      <div style={{position: 'absolute', left: 1140, top: 372, ...slide(52, 120)}}>
        <OreText size={TYPE.h1} shadow>
          {title}
        </OreText>
      </div>
      <div style={{position: 'absolute', left: 1140, top: 484, display: 'flex', flexDirection: 'column', gap: 8, ...slide(58, 120)}}>
        {desc.map((line, i) => (
          <OreText key={i} size={TYPE.body} color={ORE.dim} shadow>
            {line}
          </OreText>
        ))}
      </div>
      <div style={{position: 'absolute', left: 1140, top: 612, display: 'flex', gap: 24, alignItems: 'center', ...slide(64, 120)}}>
        <div style={{transform: `scale(${pulse * (pressed ? 0.94 : 1)})`}}>
          <OreButton variant="hero" state={pressed ? 'pressed' : btnHover ? 'hover' : 'normal'} width={380} icon={<PlayIcon size={12 * U} />}>
            {watch}
          </OreButton>
        </div>
        <OreButton variant="neutral" width={240}>
          {subscribe}
        </OreButton>
      </div>
      {/* the shot that just ended, shrunken into the corner */}
      <Fit rect={winRect} style={{opacity: 1 - expand}}>
        <A />
      </Fit>
      <Frame rect={winRect} k={shrink * (1 - expand)} />
      {f >= 50 && (
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y - 64, opacity: stage(52) * fade}}>
          <OreChip color={ORE.text} dot="#8c8d90">
            {replayChip}
          </OreChip>
        </div>
      )}
      <ClickSpark at={click} x={cx} y={cy} />
      <div style={{opacity: curA}}>
        <PixelCursor x={cx} y={cy} />
      </div>
      <Flash at={click} life={6} color="#fff3c0" peak={0.5} />
      <Flash at={198} life={5} color="#ffffff" peak={0.4} />
      <Vignette s={0.2} color="10,0,30" />
      <Sfx at={36} src={mcSound('ui/toast/in')} volume={0.4} />
      <Sfx at={44} src={mcSound('random/pop')} volume={0.3} rate={1.2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={96 + i * 12} src={mcSound('random/click')} volume={0.18} rate={1 + i * 0.06} />
      ))}
      <Sfx at={click} src={mcSound('random/click')} volume={0.5} rate={0.9} />
    </AbsoluteFill>
  );
};

// ================================================================ 9. pip expand

export const T9 = 132;
const PIP = {x: 1304, y: 690, w: 540, h: 304};
const MINI = {x: PIP.x + 120, y: PIP.y + 70, w: 420, h: 236};

/** A rounded window with a dark frame, hard + soft drop shadow, inner highlight edge and a travelling gloss. k = frame strength 0..1. */
const Win: FC<{rect: R; radius: number; k: number; edge?: string; gloss?: number; children: ReactNode}> = ({rect, radius, k, edge = '#14141c', gloss = -1, children}) => (
  <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: radius, overflow: 'hidden', boxShadow: `0 0 0 ${8 * k}px ${edge}, 0 ${16 * k}px 0 ${8 * k}px rgba(0,0,0,0.35), 0 ${36 * k}px ${70 * k}px rgba(0,0,0,0.5)`}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${rect.w / 1920})`, transformOrigin: '0 0'}}>{children}</div>
    {gloss >= 0 && gloss <= 1 && (
      <div style={{position: 'absolute', top: -20, bottom: -20, width: rect.w * 0.18, left: lerp(-rect.w * 0.3, rect.w * 1.1, gloss), background: 'rgba(255,255,255,0.16)', transform: 'skewX(-18deg)'}} />
    )}
    <div style={{position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 ${Math.max(2, 3 * k)}px rgba(255,255,255,${0.55 * k}), inset 0 ${6 * k}px 0 0 rgba(255,255,255,${0.22 * k})`, pointerEvents: 'none'}} />
  </div>
);

/** Props of PipExpand. */
export type PipExpandProps = {
  /** Old shot: sits behind, then comes back as a small window. Default: PlateA placeholder. */
  A?: FC;
  /** Shot that lives in the PiP window and grows to full screen. Default: PlateB placeholder. */
  B?: FC;
  /** Title in the PiP window's top bar. */
  titleB?: string;
  /** Chip at the top left after expanding. */
  expanded?: string;
  /** Label over the small window that A turns into. */
  labelA?: string;
};

export const PipExpand: FC<PipExpandProps> = ({A = PlateA, B = PlateB, titleB = '画面 B · LIVE', expanded = '已展开 · 全屏', labelA = '画面 A'}) => {
  const f = useCurrentFrame();
  const pop = EASE.out(clamp01((f - 2) / 16));
  const press = f >= 50 && f < 58 ? Math.sin(((f - 50) / 8) * Math.PI) : 0;
  const e = EASE.inOut(clamp01((f - 56) / 38));
  const small = lerp(1, 0.96, press);
  const base: R = {x: PIP.x + (PIP.w * (1 - small)) / 2, y: PIP.y + (PIP.h * (1 - small)) / 2, w: PIP.w * small, h: PIP.h * small};
  const rect = mixR(base, FULL, e);
  const radius = 22 * (1 - smooth(0.35, 0.95, e));
  const k = 1 - smooth(0.55, 1, e);
  const hover = f >= 40;
  const click = 50;
  const curA = smooth(18, 24, f) * (1 - smooth(click + 14, click + 22, f));
  const cursorX = lerp(900, PIP.x + PIP.w - 52, EASE.inOut(clamp01((f - 18) / 26)));
  const cursorY = lerp(380, PIP.y + 40, EASE.inOut(clamp01((f - 18) / 26)));
  const aScale = lerp(1, 0.94, e);
  const miniIn = EASE.back(clamp01((f - 98) / 14));
  const chip = prog(f, 94, 12, EASE.out);
  const titleK = 1 - smooth(0, 0.3, e);
  const gloss = f >= 70 ? clamp01((f - 70) / 26) : -1;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${aScale})`, filter: `brightness(${1 - 0.5 * e}) blur(${10 * e}px)`}}>
        <A />
      </AbsoluteFill>
      {(
        <div style={{position: 'absolute', inset: 0, opacity: pop, transform: f < 56 ? `translateY(${(1 - pop) * 70}px)` : undefined}}>
          <Win rect={rect} radius={radius} k={k} edge={hover && f < 60 ? gold : '#14141c'} gloss={gloss}>
            <B />
          </Win>
          {/* title bar of the pip */}
          <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: 64, background: 'linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0))', borderRadius: `${radius}px ${radius}px 0 0`, opacity: titleK}}>
            <div style={{position: 'absolute', left: 20, top: 16, display: 'flex', gap: 10, alignItems: 'center'}}>
              <div style={{width: 18, height: 18, background: '#ff4d5e', opacity: Math.floor(f / 8) % 2 ? 0.4 : 1}} />
              <OreText size={TYPE.small} shadow>
                {titleB}
              </OreText>
            </div>
            <div style={{position: 'absolute', right: 18, top: 10, width: 48, height: 48, background: hover ? gold : 'rgba(0,0,0,0.55)', border: '6px solid #fff', boxSizing: 'border-box', transform: `scale(${press > 0 ? 0.9 : hover ? 1.12 : 1})`}}>
              <div style={{position: 'absolute', left: 8, top: 8, width: 18, height: 18, borderLeft: '6px solid', borderTop: '6px solid', borderColor: hover ? '#2a1c00' : '#fff', boxSizing: 'border-box'}} />
              <div style={{position: 'absolute', right: 8, bottom: 8, width: 18, height: 18, borderRight: '6px solid', borderBottom: '6px solid', borderColor: hover ? '#2a1c00' : '#fff', boxSizing: 'border-box'}} />
            </div>
          </div>
        </div>
      )}
      {/* A comes back as a small window */}
      {f >= 98 && (
        <div style={{position: 'absolute', inset: 0, transformOrigin: `${MINI.x + MINI.w}px ${MINI.y + MINI.h}px`, transform: `scale(${miniIn})`}}>
          <Win rect={MINI} radius={16} k={1}>
            <A />
          </Win>
          <div style={{position: 'absolute', left: MINI.x, top: MINI.y - 76}}>
            <OreChip color={ORE.text} dot="#8c8d90">
              {labelA}
            </OreChip>
          </div>
        </div>
      )}
      <div style={{position: 'absolute', left: 80, top: 70, opacity: chip, transform: `translateX(${(1 - chip) * -120}px)`}}>
        <OreChip color={ORE.text} dot={gold}>
          {expanded}
        </OreChip>
      </div>
      <ClickSpark at={click} x={cursorX} y={cursorY} />
      <div style={{opacity: curA}}>
        <PixelCursor x={cursorX} y={cursorY} />
      </div>
      <Vignette s={0.28 * smooth(60, 94, f)} />
      <Sfx at={2} src={mcSound('ui/toast/in')} volume={0.4} />
      <Sfx at={click} src={mcSound('random/click')} volume={0.5} rate={1.1} />
      <Sfx at={98} src={mcSound('random/pop')} volume={0.4} rate={1.1} />
    </AbsoluteFill>
  );
};

export const jumpAEntries: FxEntry[] = [
  transitionEntry(chapterDef, {
    id: 'jump-chapter',
    name: '章节跳转',
    category: 'transition',
    tags: ['章节', '转场', '大卡片', '进度点'],
    blurb: '六条斜切色带（金、墨、橙交替）从左侧依次跑入，边靠边铺满整个画面；随后居中的章节卡砸在色带上：数字牌 02→03 翻滚、“深入矿洞”标题、副标题、三个物品格，上方章节条、下方七点进度条（光点从第 2 点滑到第 3 点）；最后色带按原顺序向右跑出并露出下一镜头，全程画面都是满的。',
    usage: '视频分章节时的转场卡；cut 类，覆盖在中间帧，自动带透明 Layer 可叠在任意素材上。',
    params: [{name: '文字', desc: '章节号、标题、副标题、进度点数量在 chapter.tsx 的 ChapterOverlay 里直接修改（CH_T 为时长）'}, {name: 'BANDS', desc: '六条色带的颜色与纹理（源码常量）'}],
  }),
  {
    meta: {
      id: 'jump-next-episode',
      name: '下集预告',
      category: 'transition',
      tags: ['下集预告', '片尾', '小窗', '倒计时', '按钮'],
      frames: T8,
      blurb: '本集画面缩进右下角变成小窗，紫色舞台上展开“下集预告”：下集预览大图、集数标签、简介、倒计时进度条和“立即观看”按钮；光标点击后预览图撑满全屏进入下一集。',
      usage: '每集结尾的“下集预告 / 自动连播”画面，也可只用来演示“切到下一集”。',
      params: [{name: 'HERO / WIN', desc: '预览图与小窗的矩形（源码常量）'}, {name: '文字', desc: '集数、标题、简介、倒计时秒数在组件内直接改'}],
    },
    Demo: () => <NextEpisode />,
  },
  {
    meta: {
      id: 'jump-pip-expand',
      name: '画中画展开',
      category: 'transition',
      tags: ['画中画', '放大', '全屏', '光标'],
      frames: T9,
      blurb: '右下角带深色边框、投影和高光边的圆角小窗升起，光标移上展开键并点击，小窗轻按一下后缓动放大到全屏：位置、缩放同步变化，圆角收成直角，窗面掠过一道斜向反光；旧画面同时后退、压暗并模糊，最后旧画面以小窗留在右下角。',
      usage: '从小窗口画面切到主画面，或演示“点开放大”的交互。',
      params: [{name: 'PIP', desc: '小窗矩形（源码常量）'}, {name: '画面', desc: 'PlateA / PlateB 换成你自己的两段素材即可'}],
    },
    Demo: () => <PipExpand />,
  },
];
