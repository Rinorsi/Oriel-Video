// mcd-s-victory-banner: top-centre victory banner. Target: mission-victory-banner-pop.png / mission-victory-laurel-countdown.png.
// Gold "VICTORY" slams in (big -> 100%), silver laurel unfurls, white pixel countdown ticks once a second, banner fades out.
// Props: bg (draw the scene + top shade), from (countdown start), title, sub, tick (frames per number).
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {Laurel, McdText, PxText, TITLE_VICTORY, WhiteFlash} from '../mcdkit/kit';
import {At, Backdrop, EASE, Particles, PxPlus, Row, Sfx, TopShade, genParts, inOut, mcSound, snap, stepped, win} from './common';

const TOTAL = 160;

export const Victory: FC<{bg?: boolean; from?: number; title?: string; sub?: string; tick?: number; audio?: boolean}> = ({bg, from = 5, title = '胜利！', sub = '任务结束…', tick = 26, audio = bg}) => {
  const f = useCurrentFrame();
  const t0 = 14;
  const idx = Math.min(from - 1, Math.max(0, Math.floor((f - t0) / tick)));
  const n = from - idx;
  const local = f - t0 - idx * tick;
  const out = 1 - win(f, TOTAL - 16, 14);
  const outS = stepped(out, 4);

  // title slam
  const ts = win(f, 0, 7);
  const tScale = 1 + 0.75 * (1 - EASE.out(ts)) + (ts >= 1 ? 0.04 * Math.max(0, 1 - win(f, 7, 8)) : 0);
  const tOp = stepped(win(f, 0, 3), 3);
  // laurel
  const grow = EASE.out(win(f, 5, 20));
  // number
  const nIn = stepped(win(local, 0, 5), 4);
  const nUp = (1 - EASE.out(win(local, 0, 6))) * 14;
  const nPop = local < 3 && idx > 0 ? 1.12 : 1;
  const numOp = f < t0 ? stepped(win(f, 6, 8), 4) * 0.35 : nIn;
  const burst = genParts({n: 26, seed: 3, x: 960, y: 196, sx: 150, sy: 24, a0: -Math.PI, a1: Math.PI, v0: 3, v1: 11, drag: 0.1, life0: 22, life1: 36, size0: 6, size1: 12, colors: ['#FCE386', '#FFF4C0', '#F8D868', '#FFFFFF'], kinds: ['sq', 'sq', 'plus']});
  const flare = genParts({n: 14, seed: 9, x: 960, y: 330, sx: 300, sy: 120, a0: -Math.PI * 0.95, a1: -Math.PI * 0.05, v0: 0.6, v1: 2.2, drag: 0.05, life0: 28, life1: 52, delay: 14, size0: 6, size1: 10, colors: ['#CFCFD6', '#FFFFFF', '#F5A24A'], kinds: ['sq', 'plus']});

  return (
    <AbsoluteFill>
      {bg && (
        <Backdrop biome="forest-day" loop={TOTAL} dim={0.1}>
          <TopShade h={600} alpha={0.92} opacity={win(f, 0, 10) * (1 - win(f, TOTAL - 14, 14))} />
        </Backdrop>
      )}
      {!bg && <TopShade h={640} alpha={0.7} opacity={win(f, 0, 10) * (1 - win(f, TOTAL - 14, 14))} />}
      <AbsoluteFill style={{opacity: outS, transform: `translateY(${(1 - out) * -16}px) scale(1.12)`, transformOrigin: "960px 40px"}}>
        {/* laurel, opening upward behind the number */}
        <div style={{position: 'absolute', left: 960 - 330, top: 128, opacity: grow > 0 ? 1 : 0}}>
          <Laurel w={660} grow={grow} />
        </div>
        <Row y={92} style={{transform: `scale(${tScale})`, opacity: tOp}}>
          <PxText text={title} px={7} {...TITLE_VICTORY} />
        </Row>
        <At cx={960} cy={352}>
          <div style={{opacity: numOp, transform: `translateY(${nUp}px) scale(${nPop})`}}>
            <PxText text={n} px={14} color={local < 3 ? '#FFF4C0' : '#FDFEFE'} />
          </div>
        </At>
        <Row y={444} style={{opacity: stepped(win(f, 16, 8), 4)}}>
          <McdText size={28} weight={700} color="#F4F4F4">{sub}</McdText>
        </Row>
        <Particles parts={burst} at={2} />
        <Particles parts={flare} at={0} />
        {/* small cross glints that keep ticking on the laurel tips */}
        {[0, 1].map((s) => {
          const t = ((f + s * 17) % 44) / 44;
          const sx = s ? 1190 : 730;
          return f > 24 ? <PxPlus key={s} x={snap(sx, 4)} y={snap(168 + s * 14, 4)} u={4} arm={Math.round(Math.sin(t * Math.PI) * 3)} c="#FFFFFF" core="#fff" o={Math.sin(t * Math.PI)} /> : null;
        })}
      </AbsoluteFill>
      {bg && <WhiteFlash at={0} dur={6} peak={0.22} steps={3} />}
      {audio && <Sfx at={0} src={mcSound('ui/toast/challenge_complete')} volume={0.45} />}
      {audio && [0, 1, 2, 3, 4].slice(0, from - 1).map((i) => <Sfx key={i} at={t0 + (i + 1) * tick} src={mcSound('random/click')} volume={0.25} />)}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-victory-banner',
      name: '胜利横幅 · 月桂倒计时',
      category: 'rpg',
      tags: ['地下城', '胜利', '横幅', '倒计时', '月桂'],
      frames: TOTAL,
      blurb: '屏幕上方居中：金色“胜利！”从大到小砸入，银灰月桂向两侧展开，白色像素数字逐秒倒数，顶部压暗渐变托住字，结尾整体淡出。',
      usage: '视频里打赢一关/完成一个阶段的收尾点；倒计时数字可换成任意章节编号、剩余秒数或“第 N 期”。Layer 版直接叠在素材上。',
      params: [
        {name: 'from', desc: '倒计时起始数字，默认 5'},
        {name: 'title / sub', desc: '主标题与下方小字，默认“胜利！”“任务结束…”'},
        {name: 'tick', desc: '每个数字停留的帧数，默认 26'},
        {name: 'bg', desc: '是否绘制 3D 场景背景（Demo 开，Layer 关）'},
      ],
    },
    Demo: () => <Victory bg />,
    Layer: () => <Victory />,
  },
];
