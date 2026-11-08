// mcd-s-level-up: XP bar fills -> purple spiral light rises around the hero -> gold LEVEL UP -> hexagon level badge flips to the next level.
// Target: scene/level-up-effect.png ("LEVEL UP!" gold type, small grey sub line, purple/orange swirl around the hero).
// Props: bg, level (old level, the badge flips to level+1), title, sub.
import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {Embers, LevelBadge, McdText, PlayerFigure, PxText, TITLE_GOLD, WhiteFlash, XpBar, MCD} from '../mcdkit/kit';
import {At, Backdrop, Beam, EASE, GroundShadow, IsoGlow, Particles, PxPlus, Row, Sfx, Sq, genParts, mcSound, snap, stepped, win} from './common';

const TOTAL = 150;

const Helix: FC<{f: number; cx: number; feet: number}> = ({f, cx, feet}) => {
  const out: ReactNode[] = [];
  const cols = ['#AB64FF', '#C89CFF', '#E8D4FF', '#FFFFFF'];
  for (let strand = 0; strand < 2; strand++) {
    for (let k = 0; k < 46; k++) {
      const born = 14 + k * 1.5;
      const age = f - born;
      const life = 92;
      if (age < 0 || age > life) continue;
      const u = age / life;
      const th = age * 0.27 + strand * Math.PI;
      const R = 200 * (1 - u * 0.32) * (0.45 + 0.55 * Math.min(1, age / 10));
      const depth = Math.sin(th); // >0 = in front
      const x = cx + Math.cos(th) * R;
      const y = feet - 20 - age * 7.4 + depth * 22;
      const fade = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      const s = depth > 0 ? 14 : 8;
      const c = cols[(k + strand) % cols.length];
      out.push(
        <div key={`${strand}-${k}`}>
          <Sq x={snap(x, 2)} y={snap(y, 2)} s={s} c={c} o={fade * (depth > 0 ? 1 : 0.55)} style={{boxShadow: depth > 0 ? `0 0 14px ${cols[0]}` : undefined, zIndex: depth > 0 ? 2 : 0}} />
          {/* trailing square below for the spiral streak look */}
          <Sq x={snap(x, 2)} y={snap(y + s * 1.6, 2)} s={Math.round(s * 0.6)} c={cols[0]} o={fade * 0.5 * (depth > 0 ? 1 : 0.5)} />
        </div>,
      );
    }
  }
  return <>{out}</>;
};

export const LevelUp: FC<{bg?: boolean; audio?: boolean; level?: number; title?: string; sub?: string; xpLabel?: string}> = ({bg, audio = bg, level = 7, title = '升级！', sub = '获得 1 点附魔点', xpLabel = '经验'}) => {
  const f = useCurrentFrame();
  const CX = 960;
  const FEET = 890;
  const BURST = 14;
  const out = 1 - win(f, TOTAL - 22, 18);
  const o = stepped(out, 4);
  // XP bar fills then empties
  const xp = f < 8 ? 0 : f < BURST ? win(f, 8, 6) : f < BURST + 14 ? 1 : Math.max(0.14, 1 - win(f, BURST + 14, 14) * 0.86);
  const barFlash = f >= BURST && f < BURST + 8;
  // badge flip
  const flipA = win(f, 44, 8);
  const flipB = win(f, 52, 8);
  const angle = f < 44 ? 0 : f < 52 ? flipA * 90 : f < 60 ? -90 + flipB * 90 : 0;
  const shownLevel = f < 52 ? level : level + 1;
  const badgeScale = f >= 52 && f < 70 ? 1 + 0.22 * Math.sin(win(f, 52, 18) * Math.PI) : 1;
  const titleT = win(f, 20, 7);
  const feetBurst = genParts({n: 46, seed: 51, x: CX, y: FEET - 10, sx: 50, sy: 8, a0: -Math.PI * 0.95, a1: -Math.PI * 0.05, v0: 4, v1: 20, g: 0.3, drag: 0.08, life0: 24, life1: 44, size0: 8, size1: 16, colors: ['#AB64FF', '#E8D4FF', '#FFFFFF', '#F8D868'], kinds: ['sq', 'plus', 'sq']});
  const badgeBurst = genParts({n: 24, seed: 52, x: 1440, y: 560, sx: 10, sy: 10, a0: -Math.PI, a1: Math.PI, v0: 4, v1: 16, drag: 0.1, life0: 18, life1: 32, size0: 6, size1: 12, colors: ['#AB64FF', '#F8D868', '#FFFFFF'], kinds: ['plus', 'sq']});
  const colH = Math.min(1, win(f, BURST, 5));

  return (
    <AbsoluteFill>
      {bg && (
        <Backdrop biome="desert" loop={TOTAL} dim={0.3} dark={0.28} sat={0.85}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 70% at 50% 62%, rgba(110,50,200,0.42), rgba(0,0,0,0) 72%)', opacity: win(f, BURST, 8) * out}} />
        </Backdrop>
      )}
      <AbsoluteFill style={{opacity: o}}>
        <IsoGlow cx={CX} cy={FEET + 6} w={720} color="#8A42E8" o={0.9 * win(f, BURST, 8)} />
        <GroundShadow cx={CX} y={FEET - 8} w={210} o={0.5} u={8} />
        <Beam x={CX} y={FEET - 10} kind="violet" width={260} grow={colH} alpha={0.9 * (1 - win(f, 70, 40) * 0.55)} flick={0.94 + 0.06 * Math.sin(f * 1.7)} />
        <div style={{position: 'absolute', left: CX - 88, top: FEET - 352 + (f >= BURST && f < BURST + 14 ? -Math.sin(win(f, BURST, 14) * Math.PI) * 26 : 0)}}>
          <PlayerFigure skin="zuri" scale={11} />
        </div>
        <Helix f={f} cx={CX} feet={FEET} />
        <Particles parts={feetBurst} at={BURST} />
        {f >= BURST && f < BURST + 9 && <PxPlus x={CX} y={FEET - 20} u={12} arm={Math.round(14 * (1 - (f - BURST) / 9)) + 1} c="#E8D4FF" core="#fff" />}
        {/* title */}
        <Row y={150} style={{opacity: stepped(titleT, 3), transform: `scale(${1 + 0.6 * (1 - EASE.out(titleT))})`}}>
          <PxText text={title} px={11} {...TITLE_GOLD} />
        </Row>
        <Row y={340} style={{opacity: stepped(win(f, 32, 10), 4)}}>
          <McdText size={36} weight={600} color="#E0DCE8">{sub}</McdText>
        </Row>
        {/* xp bar, left */}
        <div style={{position: 'absolute', left: 150, top: 540, width: 520, opacity: stepped(win(f, 2, 6), 3)}}>
          <McdText size={28} weight={700} color="#C9B0F5" style={{display: 'block', marginBottom: 14, letterSpacing: 2}}>{xpLabel}</McdText>
          <XpBar value={xp} w={520} h={22} color={barFlash ? '#F4E8FF' : MCD.purple} style={{filter: barFlash ? 'brightness(1.5)' : undefined}} />
        </div>
        {/* level badge flip, right */}
        <At cx={1440} cy={560}>
          <div style={{perspective: 900}}>
            <div style={{transform: `rotateY(${angle}deg) scale(${badgeScale})`, filter: f >= 52 && f < 66 ? 'drop-shadow(0 0 28px rgba(171,100,255,0.9))' : undefined}}>
              <LevelBadge level={shownLevel} w={230} accent="purple" />
            </div>
          </div>
        </At>
        <Particles parts={badgeBurst} at={52} />
        <Embers count={34} color="#AB64FF" core="#F4E8FF" area={[60, 200, 1800, 820]} size={8} seed={14} speed={0.7} style={{opacity: win(f, BURST, 14) * 0.9}} />
      </AbsoluteFill>
      <WhiteFlash at={BURST} dur={6} peak={0.5} steps={3} color="#F0E0FF" />
      <WhiteFlash at={52} dur={4} peak={0.18} steps={2} color="#F0E0FF" />
      {audio && (
        <>
          <Sfx at={BURST} src={mcSound('random/levelup')} volume={0.55} />
          <Sfx at={52} src={mcSound('random/orb')} volume={0.4} rate={1.3} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-level-up',
      name: '升级特效 · 紫色螺旋光',
      category: 'rpg',
      tags: ['地下城', '升级', '螺旋', '紫色', '等级徽章'],
      frames: TOTAL,
      blurb: '经验条满格闪白，英雄脚下十字闪光，紫白方块粒子沿双螺旋缠绕上升、紫色光柱托起，金色“升级！”砸下，右侧紫边六边形等级徽章翻牌 6→7 并迸出金紫火花。',
      usage: '版本号/等级/订阅数里程碑、技能解锁、“成长了一级”的节点；level 改成要展示的数字，title/sub 改文案。',
      params: [
        {name: 'level', desc: '翻牌前的等级，翻牌后显示 level+1'},
        {name: 'title / sub', desc: '金色主标题与灰色小字'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <LevelUp bg />,
    Layer: () => <LevelUp />,
  },
];
