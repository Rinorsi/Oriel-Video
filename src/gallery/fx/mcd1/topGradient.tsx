// mcd-t-top-gradient: the victory-banner treatment as a transition. A dark gradient falls from the top of the frame (it does not cover the subject),
//   a silver laurel unfurls and the gold title (prop) pops into it with a subtitle; gold embers drift up through the banner. After a hold the frame dips,
//   cuts to B behind the banner, and the banner folds away (title up + stepped fade, laurel un-grows, gradient lifts).
//   Props: title, sub.   Layer = gradient + banner only.
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Embers, Laurel, McdText, PxChars, PxText} from '../mcdkit/kit';
import {FULL, GOLD, lerp, mEntry, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 72;
const GRAD_IN = 0;
const BANNER_IN = 5;
const DIP = 40; // dip starts
const CUT = 44;
const OUT0 = 50; // banner folds away
const OUT1 = 64;

export type TopProps = {title?: string; sub?: string; count?: string};

const Banner: FC<{f: number; title: string; sub: string; count: string}> = ({f, title, sub, count}) => {
  const inK = clamp01((f - BANNER_IN) / 12);
  const outK = clamp01((f - OUT0) / (OUT1 - OUT0));
  const pop = EASE.back(inK);
  const alpha = stepQ(inK * 1.6, 4) * (1 - stepQ(outK * 1.3, 4));
  const grow = clamp01((f - BANNER_IN - 2) / 16) * (1 - EASE.in(outK));
  const lift = -EASE.in(outK) * 40;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: alpha, transform: `translateY(${lift}px)`}}>
      <div style={{position: 'relative', width: 900, height: 660}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center', transform: `scale(${lerp(0.62, 1, pop)})`, transformOrigin: '50% 50%'}}>
          <PxChars
            text={title}
            px={10}
            cjkRows={0}
            color={GOLD.title}
            hi="#FFF4C0"
            shadowColor={GOLD.shadow}
            glyph={(i) => {
              const d = clamp01((f - BANNER_IN - i * 2) / 7);
              return {transform: `translateY(${(1 - EASE.back(d)) * -40}px)`, opacity: stepQ(d * 2, 3)};
            }}
          />
        </div>
        <div style={{position: 'absolute', left: 130, top: 186}}>
          <Laurel w={640} tone="silver" grow={grow} />
        </div>
        {count && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 252, display: 'flex', justifyContent: 'center', transform: `scale(${lerp(0.5, 1, EASE.back(clamp01((f - BANNER_IN - 6) / 9)))})`, opacity: stepQ((f - BANNER_IN - 6) / 6, 3)}}>
            <PxText text={count} px={12} gap={2} />
          </div>
        )}
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: stepQ((f - BANNER_IN - 10) / 8, 3)}}>
          <McdText size={38} weight={700} color="#F4F1E6" style={{letterSpacing: 8}}>
            {sub}
          </McdText>
        </div>
      </div>
    </div>
  );
};

export const makeTopOverlay = (o: TopProps = {}): FC<OverlayProps> => {
  const title = o.title ?? '章节完成';
  const sub = o.sub ?? '准备前往下一站';
  const count = o.count ?? '3';
  return ({f}) => {
    const g = EASE.out(clamp01((f - GRAD_IN) / 11)) * (1 - EASE.inOut(clamp01((f - OUT0 - 2) / (OUT1 - OUT0 + 4))));
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 720 * g, opacity: Math.min(1, g * 1.4), background: 'linear-gradient(180deg, rgba(6,3,7,0.9) 0%, rgba(6,3,7,0.74) 40%, rgba(6,3,7,0.36) 74%, rgba(6,3,7,0) 100%)'}} />
        <div style={{...FULL, opacity: g, background: 'radial-gradient(ellipse 70% 60% at 0% 0%, rgba(6,3,7,0.55), rgba(6,3,7,0))'}} />
        {f >= BANNER_IN && f < OUT1 + 4 && <Embers count={26} seed={13} speed={0.8} size={9} area={[440, 40, 1040, 520]} />}
        <Banner f={f} title={title} sub={sub} count={count} />
      </AbsoluteFill>
    );
  };
};

export const makeTopDef = (o: TopProps = {}): MDef => {
  const Overlay = makeTopOverlay(o);
  const Scene: FC<SceneProps> = ({f, A, B, p}) => {
    const dip = f >= DIP && f < CUT ? 1 - 0.68 * ss(DIP, CUT, f) : 1;
    const q = clamp01((f - CUT) / 10);
    return (
      <AbsoluteFill>
        {f < CUT && (
          <div style={{...FULL, filter: `brightness(${dip * (1 - 0.2 * ss(0, 10, f))})`}}>
            <A />
          </div>
        )}
        {f >= CUT && (
          <div style={{...FULL, filter: `brightness(${lerp(0.32, 1, EASE.out(q))})`, transform: `scale(${lerp(1.03, 1, EASE.out(q))})`}}>
            <B />
          </div>
        )}
        {p > 0 && p < 1 && <Overlay p={p} f={f} />}
      </AbsoluteFill>
    );
  };
  return {
    frames: T,
    Scene,
    Overlay,
    cues: [
      {at: BANNER_IN + 3, src: 'mc:ui/toast/challenge_complete', volume: 0.3},
      {at: OUT0, src: 'mc:ui/toast/out', volume: 0.22},
    ],
  };
};

export const topGradientDef = makeTopDef();
export const topGradientPair = {A: plate('desert'), B: plate('camp')};

export const topGradientEntry = mEntry(
  topGradientDef,
  {
    id: 'mcd-t-top-gradient',
    name: '地下城·顶部压暗大字标题',
    tags: ['地下城', '转场', '胜利横幅', '标题', '月桂', '章节完成'],
    blurb: '画面顶部落下一层压暗渐变（不挡主体），银灰月桂展开、金色大字逐字弹入并带小字说明，金色火星在横幅里上飘；停留后画面压暗一下硬切到 B，横幅在 B 上方收起。',
    usage: '"任务/章节完成"的节点、章节标题卡、胜利结算前后的衔接；title / sub 都是可改文字。',
    params: [
      {name: 'title', desc: 'makeTopDef({title, sub}) 大字标题，默认"章节完成"'},
      {name: 'sub', desc: '月桂下的小字说明，默认"准备前往下一站"'},
      {name: 'count', desc: '月桂里的白色像素大字（章节序号），默认 "3"，传空字符串则不显示'},
      {name: 'DIP / CUT / OUT0', desc: '压暗开始帧、切换帧、横幅收起开始帧'},
    ],
  },
  topGradientPair.A,
  topGradientPair.B,
);
