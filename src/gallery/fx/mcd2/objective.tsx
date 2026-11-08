// mcd-s-objective: objective update. Target: boss-objective-and-bar-appear.png (centre "new objective") + the top-right objective text of hud-ingame-full.png.
// A dark gradient drops from the top-right, the old objective is struck through and ticked off, then slides out as the new one rises into the slot;
// at the same time the big centre announcement (small gold "NEW OBJECTIVE" + white line) fades in and out.
// Props: bg, area (gold sub line), oldText, newText.
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {McdText, PxArt, PxText} from '../mcdkit/kit';
import {Backdrop, EASE, Particles, PxPlus, Row, Sfx, TopShade, genParts, mcSound, snap, stepped, win} from './common';

const TOTAL = 140;
const CHECK = ['......kk', '.....kkk', 'kk..kkk.', 'kkkkkk..', '.kkkk...', '..kk....'];

export const Objective: FC<{bg?: boolean; audio?: boolean; area?: string; oldText?: string; newText?: string; heading?: string}> = ({bg, audio = bg, area = '无名王国', oldText = '击败守卫的骷髅', newText = '抵达死灵法师之墓', heading = '新目标'}) => {
  const f = useCurrentFrame();
  const dropT = EASE.out(win(f, 0, 10));
  const exit = 1 - win(f, TOTAL - 18, 14);
  const oldIn = stepped(win(f, 8, 8), 4);
  const strike = EASE.out(win(f, 40, 7));
  const swap = EASE.out(win(f, 46, 12));
  const swapNew = EASE.out(win(f, 58, 12));
  const newIn = stepped(win(f, 58, 8), 4);
  const oldOut = 1 - stepped(win(f, 50, 8), 4);
  const centerT = win(f, 58, 8);
  const centerOut = 1 - win(f, 108, 10);
  const sparkles = genParts({n: 16, seed: 41, x: 1500, y: 138, sx: 280, sy: 20, a0: -Math.PI, a1: 0, v0: 1, v1: 7, drag: 0.08, life0: 14, life1: 26, size0: 6, size1: 12, colors: ['#FCD448', '#FFFFFF', '#F4B55A'], kinds: ['plus', 'sq']});
  const tickBurst = genParts({n: 12, seed: 43, x: 1300, y: 128, sx: 10, sy: 10, a0: -Math.PI, a1: Math.PI, v0: 2, v1: 8, drag: 0.1, life0: 12, life1: 22, size0: 6, size1: 10, colors: ['#7CFF6A', '#FFFFFF'], kinds: ['sq', 'plus']});
  const R = 84; // right padding
  return (
    <AbsoluteFill>
      {bg && (
        <Backdrop biome="forest-day" loop={TOTAL} dim={0.15}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 40% 26% at 50% 25%, rgba(0,0,0,0.5), rgba(0,0,0,0) 80%)', opacity: stepped(centerT, 3) * centerOut}} />
        </Backdrop>
      )}
      <AbsoluteFill style={{opacity: exit}}>
        <div style={{transform: `translateY(${(1 - dropT) * -420}px)`}}>
          <div style={{position: 'absolute', left: 560, top: 0, right: 0, height: 440, background: 'radial-gradient(ellipse 100% 100% at 100% 0%, rgba(2,2,6,0.88) 0%, rgba(2,2,6,0.6) 42%, rgba(2,2,6,0) 100%)'}} />
        </div>
        {/* right objective slot */}
        <div style={{position: 'absolute', right: R, top: 46, width: 900, height: 150}}>
          <div style={{position: 'absolute', right: 0, top: 0, opacity: stepped(win(f, 6, 6), 3)}}>
            <McdText size={30} weight={800} color="#FCD448" style={{letterSpacing: 3}}>{area}</McdText>
          </div>
          {/* old */}
          <div style={{position: 'absolute', right: 0, top: 44, opacity: oldIn * oldOut, transform: `translateY(${-swap * 46}px)`, display: 'flex', alignItems: 'center', gap: 18}}>
            {strike > 0.5 && <PxArt rows={CHECK} pal={{k: '#7CFF6A'}} px={6} />}
            <div style={{position: 'relative', opacity: strike > 0.3 ? 0.65 : 1}}>
              <PxText text={oldText} px={3} />
              <div style={{position: 'absolute', left: 0, top: '52%', height: 6, width: `${strike * 100}%`, background: '#FFFFFF', boxShadow: '3px 3px 0 #050202'}} />
            </div>
          </div>
          {/* new */}
          <div style={{position: 'absolute', right: 0, top: 44, opacity: newIn, transform: `translateY(${(1 - swapNew) * 46}px)`}}>
            <PxText text={newText} px={3} />
          </div>
        </div>
        <Particles parts={sparkles} at={60} />
        <Particles parts={tickBurst} at={42} />
        {f >= 58 && f < 66 && <PxPlus x={1840 - R + 40} y={118} u={8} arm={7 - (f - 58)} c="#FCD448" core="#fff" />}
        {/* centre announcement */}
        <Row y={236} style={{opacity: stepped(Math.min(centerT, centerOut), 4), flexDirection: 'column', transform: `translateY(${(1 - EASE.out(centerT)) * 12}px)`}}>
          <McdText size={34} weight={800} color="#F4B55A" style={{letterSpacing: 5}}>{heading}</McdText>
          <div style={{marginTop: 10}}>
            <PxText text={newText} px={5} />
          </div>
        </Row>
      </AbsoluteFill>
      {audio && (
        <>
          <Sfx at={40} src={mcSound('random/click')} volume={0.3} />
          <Sfx at={56} src={mcSound('ui/toast/in')} volume={0.35} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-objective',
      name: '目标更新 · 划掉旧目标',
      category: 'rpg',
      tags: ['地下城', '目标', '任务', '字幕', '提示'],
      frames: TOTAL,
      blurb: '右上角压暗渐变从顶部落下，金色区域名 + 白色旧目标；旧目标被白线划掉、打绿色对勾后上滑退出，新目标从下方升入原位，同时画面上方居中浮出金色“新目标”与白色大字。',
      usage: '视频里的“步骤/章节/任务点”更新字幕：教程步骤切换、挑战下一阶段提示。右上角槽位与居中公告可单独使用。',
      params: [
        {name: 'area', desc: '金色副标（区域/章节名）'},
        {name: 'oldText / newText', desc: '旧目标与新目标文字'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <Objective bg />,
    Layer: () => <Objective />,
  },
];
void snap;
