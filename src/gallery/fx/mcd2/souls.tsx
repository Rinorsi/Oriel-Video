// mcd-s-souls-collect / mcd-s-emerald-collect: mobs die and their drops fly to a counter in the corner.
// Souls = white ghost faces with cyan-blue pixel trails (soul-collect.png); emeralds = real emerald texture popping out, then streaming away with green trails.
// The counter bumps with every arrival. Props: bg, kind ('soul' | 'emerald'), start (initial counter value).
import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import type {FxEntry} from '../../types';
import {CutPanel, EmeraldCounter, MCD, McdText, PlayerFigure, PxArt, SoulCounter, CreeperFigure, SkeletonFigure, itemTex} from '../mcdkit/kit';
import {Backdrop, EASE, GroundShadow, Particles, PxPlus, Sfx, Sq, genParts, lerp, mcSound, snap, stepped, win} from './common';

const TOTAL = 150;

const SC = 11;
const GHOST = ['..WWWWW..', '.WWWWWWW.', 'WWWWWWWWW', 'WWeeWeeWW', 'WWeeWeeWW', 'WWWWWWWWW', 'WWWWeWWWW', 'DWWWWWWWD', 'DDWWDWWDD', 'D.DD.DD.D'];
const GHOST_PAL = {W: '#FCFFFF', D: '#7CC4CE', e: '#1B2A33'};

type Mob = {x: number; feet: number; at: number; kind: 'creeper' | 'skeleton' | 'zombie'; drops: number};
const MOBS: Mob[] = [
  {x: 520, feet: 800, at: 20, kind: 'creeper', drops: 4},
  {x: 940, feet: 900, at: 46, kind: 'skeleton', drops: 4},
  {x: 1340, feet: 830, at: 70, kind: 'zombie', drops: 4},
];

const bez = (p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number] => [
  (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
  (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
];

const MobFig: FC<{m: Mob}> = ({m}) => {
  const S = SC;
  if (m.kind === 'creeper') return <CreeperFigure scale={S} />;
  if (m.kind === 'skeleton') return <SkeletonFigure scale={S} />;
  return <PlayerFigure texture="entity/zombie/zombie.png" scale={S} />;
};

const mobH = (m: Mob) => (m.kind === 'creeper' ? 26 * SC : 32 * SC);
const mobW = (m: Mob) => (m.kind === 'creeper' ? 8 * SC : m.kind === 'skeleton' ? 12 * SC : 16 * SC);

export const Collect: FC<{bg?: boolean; audio?: boolean; kind?: 'soul' | 'emerald'; start?: number; label?: string}> = ({bg, audio = bg, kind = 'soul', start, label}) => {
  const f = useCurrentFrame();
  const isSoul = kind === 'soul';
  const base = start ?? (isSoul ? 27 : 109);
  const TARGET: [number, number] = [1610, 125];
  const FLY = isSoul ? 40 : 30;
  const col = isSoul ? {main: '#48C8D8', hi: '#9FEFF7', dim: '#2E7F95'} : {main: '#58D038', hi: '#B4FF98', dim: '#2C8A1C'};
  // arrivals
  const arrivals: number[] = [];
  const souls: {m: Mob; k: number; born: number; arrive: number; i: number}[] = [];
  MOBS.forEach((m, mi) => {
    for (let k = 0; k < m.drops; k++) {
      const born = m.at + 4 + k * 3;
      const lay = isSoul ? 0 : 12;
      const arrive = born + lay + FLY + k * 2;
      souls.push({m, k, born: born + lay + k * 2, arrive, i: mi * 3 + k});
      arrivals.push(arrive);
    }
  });
  const got = arrivals.filter((a) => f >= a).length;
  const lastArrive = arrivals.filter((a) => f >= a).sort((a, b) => b - a)[0];
  const bump = lastArrive !== undefined && f - lastArrive < 8 ? 1 - (f - lastArrive) / 8 : 0;
  const exit = 1 - win(f, TOTAL - 20, 16);
  const counterIn = stepped(win(f, 6, 8), 4);

  return (
    <AbsoluteFill>
      {bg && <Backdrop biome="forest-night" seed={7} loop={TOTAL} dim={0.3} dark={0.12} sat={1} bright={1.15} />}
      {/* mobs */}
      {MOBS.map((m, mi) => {
        const dt = f - m.at;
        const alive = dt < 0;
        const hitFlash = dt >= 0 && dt < 4;
        const gone = dt >= 4;
        const appear = EASE.out(win(f, mi * 4, 10));
        const puff = genParts({n: 26, seed: 71 + mi, x: m.x, y: m.feet - mobH(m) * 0.5, sx: mobW(m) / 2, sy: mobH(m) / 3, a0: -Math.PI, a1: Math.PI, v0: 2, v1: 12, g: 0.3, drag: 0.1, life0: 16, life1: 30, size0: 8, size1: 16, colors: ['#FFFFFF', '#D8302C', isSoul ? '#9FEFF7' : '#B4FF98', '#C8C8D0'], kinds: ['sq', 'sq', 'plus']});
        return (
          <div key={mi}>
            {!gone && (
              <>
                <GroundShadow cx={m.x} y={m.feet - 4} w={mobW(m) * 1.2} o={0.5 * appear} u={7} />
                <div
                  style={{
                    position: 'absolute',
                    left: m.x - mobW(m) / 2 + (hitFlash ? (dt % 2 ? 8 : -8) : 0),
                    top: m.feet - mobH(m),
                    opacity: appear * exit,
                    transform: `translateY(${(1 - appear) * 30}px)`,
                    filter: hitFlash
                      ? 'brightness(5) saturate(0)'
                      : 'drop-shadow(3px 0 0 #D8302C) drop-shadow(-3px 0 0 #D8302C) drop-shadow(0 3px 0 #D8302C) drop-shadow(0 -3px 0 #D8302C)',
                  }}
                >
                  <MobFig m={m} />
                </div>
              </>
            )}
            {dt >= 0 && <Particles parts={puff} at={m.at + 3} />}
            {dt >= 2 && dt < 8 && <PxPlus x={m.x} y={m.feet - mobH(m) * 0.5} u={10} arm={6 - (dt - 2)} c="#FFFFFF" core="#fff" />}
            {alive && null}
          </div>
        );
      })}

      {/* drops in flight */}
      {souls.map((s) => {
        if (f < s.born) return null;
        const age = f - s.born;
        const t = Math.min(1, age / (s.arrive - s.born));
        if (f >= s.arrive + 1) return null;
        const p0: [number, number] = [s.m.x + (s.k - 1) * 46, s.m.feet - mobH(s.m) * 0.55];
        const ctrl: [number, number] = [lerp(p0[0], TARGET[0], 0.25) + (s.k - 1) * 90, Math.min(p0[1], TARGET[1]) - 240 - s.k * 40];
        const te = isSoul ? EASE.inOut(t) : EASE.in(t) * 0.9 + t * 0.1;
        const [x, y] = bez(p0, ctrl, TARGET, te);
        const hov = isSoul ? Math.round(Math.sin(age * 0.5 + s.i) * 6) : 0;
        const trail = [];
        for (let j = 18; j >= 1; j--) {
          const tj = Math.max(0, te - j * (isSoul ? 0.011 : 0.016));
          const [tx, ty] = bez(p0, ctrl, TARGET, tj);
          const a = (1 - j / 19) * 0.8;
          const sz = Math.max(4, Math.round((isSoul ? 22 : 16) * (1 - j / 22)));
          trail.push(<Sq key={j} x={snap(tx - sz / 2, 2)} y={snap(ty - sz / 2, 2)} s={sz} c={j > 9 ? col.dim : col.main} o={a * (t < 0.04 ? 0 : 1)} />);
        }
        const spin = Math.cos(age * 0.35 + s.i);
        // emeralds first bounce on the ground
        const lay = isSoul ? 0 : 12;
        const popT = win(f, s.born - lay, lay);
        return (
          <div key={s.i}>
            {!isSoul && popT < 1 && (
              <div style={{position: 'absolute', left: p0[0] - 36, top: p0[1] - 36 - Math.sin(popT * Math.PI) * 120 + popT * popT * 190, width: 72, height: 72, transform: `scaleX(${Math.cos(popT * 9)})`, opacity: exit}}>
                <Img src={itemTex('emerald')} style={{width: 72, height: 72, imageRendering: 'pixelated'}} />
              </div>
            )}
            {t > 0 && f >= s.born && (
              <>
                {trail}
                {isSoul ? (
                  <div style={{position: 'absolute', left: snap(x - 36, 2), top: snap(y - 40 + hov, 2), filter: `drop-shadow(0 0 20px ${col.main})`, opacity: 1 - win(f, s.arrive - 2, 3)}}>
                    <PxArt rows={GHOST} pal={GHOST_PAL} px={8} />
                  </div>
                ) : (
                  <div style={{position: 'absolute', left: snap(x - 36, 2), top: snap(y - 36, 2), width: 72, height: 72, transform: `scaleX(${spin})`, filter: `drop-shadow(0 0 12px ${col.main})`}}>
                    <Img src={itemTex('emerald')} style={{width: 72, height: 72, imageRendering: 'pixelated'}} />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* arrival flashes on the counter */}
      {arrivals.map((a, i) => (f >= a && f < a + 6 ? <PxPlus key={i} x={TARGET[0] - 90} y={TARGET[1]} u={6} arm={5 - (f - a)} c={col.hi} core="#fff" /> : null))}

      {/* counter */}
      <div style={{position: 'absolute', left: 1440, top: 50, opacity: counterIn * exit, transform: `translateY(${(1 - counterIn) * -20}px)`}}>
        <CutPanel w={380} h={150} cuts={[16, 0, 16, 0]} fill="#14141A" edge={bump > 0 ? col.main : '#3A3A3E'} edgeW={4}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + bump * 0.08})`}}>
            {isSoul ? <SoulCounter value={base + got} px={9} bump={bump} tone="cyan" /> : <EmeraldCounter value={base + got * 3} px={9} bump={bump} />}
          </div>
        </CutPanel>
        <div style={{position: 'absolute', left: 0, right: 0, top: 160, display: 'flex', justifyContent: 'center'}}>
          <McdText size={26} weight={600} color={isSoul ? '#9FD8E0' : '#B4E8A0'}>{label ?? (isSoul ? '灵魂' : '绿宝石')}</McdText>
        </div>
      </div>
      {audio && (
        <>
          {MOBS.map((m, i) => <Sfx key={i} at={m.at} src={mcSound('random/pop')} volume={0.35} rate={0.8} />)}
          {arrivals.map((a, i) => <Sfx key={`a${i}`} at={a} src={mcSound('random/orb')} volume={0.18} rate={0.9 + (i % 3) * 0.15} />)}
        </>
      )}
      <div style={{display: 'none'}}>
        <Img src={tex('item/emerald.png')} />
        <span style={{color: MCD.soul}} />
      </div>
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-souls-collect',
      name: '灵魂吸取 · 计数跳动',
      category: 'rpg',
      tags: ['地下城', '灵魂', '吸取', '计数', '击杀'],
      frames: TOTAL,
      blurb: '三只怪物（真实苦力怕/骷髅/僵尸贴图，红色描边）被击杀后迸出白色小鬼脸灵魂，拖着青蓝像素尾迹沿弧线飞向右上角，每抵达一只计数加一并弹跳闪光。',
      usage: '统计数字递增的叙事：订阅数、下载量、击杀数、收集进度；怪物位置对应画面里的“来源”，计数器放在“去处”。',
      params: [
        {name: 'kind', desc: "'soul' 灵魂（默认）"},
        {name: 'start', desc: '计数器起始值'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <Collect bg />,
    Layer: () => <Collect />,
  },
  {
    meta: {
      id: 'mcd-s-emerald-collect',
      name: '绿宝石吸取 · 计数跳动',
      category: 'rpg',
      tags: ['地下城', '绿宝石', '吸取', '计数', '奖励'],
      frames: TOTAL,
      blurb: '怪物倒下后真实绿宝石贴图弹出落地、旋转，再带着绿色像素尾迹成串飞向右上角的绿宝石计数器，每颗抵达计数跳动并闪光。',
      usage: '金币/积分/打赏/奖励到账的视觉；计数器的图标和数字可作为“收入/积分”展示。',
      params: [
        {name: 'start', desc: '计数器起始值'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <Collect bg kind="emerald" />,
    Layer: () => <Collect kind="emerald" />,
  },
];
