import {type FC, type ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE} from '../../../mc/theme';
import {ORE, OrePanel, OreProgress, OreSlot, OreText, TYPE, U} from '../../../mg/Ore';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT, SPRITES} from '../../flat';
import {At, HEART_PINK, INK, ItemSp, Label, Mob, Orn, Particles, STAR_BIG, Sp, Stage, Sunburst, bob, chunky, lerp, makeBurst, rangeP, spring, useList} from './common';

/**
 * soc-bell: the vanilla bell hangs from a plank beam and is kicked: it swings with a damped pendulum, pixel sound
 * dashes (three stepped bars per side, no rings) shoot out at each extreme, notes and sparkles fly, a red "1" badge
 * pops, and an Ore-style toast slides up saying "已开启小铃铛". A second, softer ding happens while the toast is up. Small bells swing in the corners.
 * Props: bg, kickAt (first ding frame), title / sub (toast text), badgeText (red badge), secondKickAfter (frames between the two dings), audio (play the sound effects).
 */

const OMEGA = 0.34; // rad per frame, a swing takes ~18 frames
const swing = (f: number, kick: number, amp: number, tau = 34, lag = 0) => {
  const t = f - kick - lag;
  return t < 0 ? 0 : amp * Math.exp(-t / tau) * Math.sin(t * OMEGA);
};

/** Pixel "sound" dashes: three stepped bars fan out to one side of the bell (replaces the old round wave arcs). */
const Dashes: FC<{x: number; y: number; at: number; dir: 1 | -1; power: number; color: string}> = ({x, y, at, dir, power, color}) => {
  const f = useCurrentFrame() - at;
  const LIFE = 20;
  if (f < 0 || f > LIFE) return null;
  const p = EASE.out(f / LIFE);
  const fade = 1 - Math.max(0, (f / LIFE - 0.5) / 0.5);
  const S = 28; // cell size
  const snap = (v: number) => Math.round(v / 10) * 10;
  const cells: ReactNode[] = [];
  [-30, 0, 30].forEach((deg, bi) => {
    const a = (deg * Math.PI) / 180;
    const front = lerp(150, 300 + 150 * power, p) + (bi === 1 ? 24 : 0);
    const n = Math.max(1, Math.round((bi === 1 ? 4 : 3) * fade));
    for (let k = 0; k < n; k++) {
      const r = front - k * (S + 6);
      cells.push(
        <div
          key={`${bi}-${k}`}
          style={{position: 'absolute', left: snap(x + dir * Math.cos(a) * r) - S / 2, top: snap(y + Math.sin(a) * r) - S / 2, width: S, height: S, boxSizing: 'border-box', border: `5px solid ${INK}`, background: k === 0 ? '#ffffff' : bi === 1 ? color : '#fff4d6', opacity: fade}}
        />,
      );
    }
  });
  return <>{cells}</>;
};

export const BellFx: FC<{bg?: boolean; kickAt?: number; title?: string; sub?: string; badgeText?: string; secondKickAfter?: number; audio?: boolean}> = ({
  bg,
  kickAt = 24,
  title = '已开启小铃铛',
  sub = 'UP主一更新，第一时间通知你',
  badgeText = '1',
  secondKickAfter = 62,
  audio = true,
}) => {
  const f = useCurrentFrame();
  const BX = 960;
  const BY = 450;
  const KICK2 = kickAt + secondKickAfter;
  const ang = swing(f, kickAt, 30) + swing(f, KICK2, 16, 26);
  const intro = spring(f, 0, 20);
  const toast = spring(f, kickAt + 24, 22);
  const prog = rangeP(f, kickAt + 30, 70, (t) => t);
  const badge = spring(f, kickAt + 6, 18);

  // wave emission frames: extremes of the damped swing
  const emits: {at: number; dir: 1 | -1; power: number; color: string}[] = [];
  [kickAt, KICK2].forEach((k, ki) => {
    const amp = ki === 0 ? 1 : 0.55;
    for (let n = 0; n < 6; n++) {
      const t = (Math.PI / 2 + n * Math.PI) / OMEGA;
      const a = amp * Math.exp(-t / (ki === 0 ? 34 : 26));
      if (a < 0.2) break;
      emits.push({at: Math.round(k + t), dir: n % 2 === 0 ? 1 : -1, power: a, color: [FLAT.yellow, FLAT.sky, FLAT.pink][n % 3]});
      emits.push({at: Math.round(k + t) + 1, dir: n % 2 === 0 ? -1 : 1, power: a * 0.7, color: [FLAT.yellow, FLAT.sky, FLAT.pink][(n + 1) % 3]});
    }
  });

  const notes = useList(() => [
    ...makeBurst({seed: 91, at: kickAt, x: BX, y: BY - 20, n: 26, kinds: ['note', 'noteP', 'noteS', 'spark:#ffd23f', 'star'], speed: [12, 34], angle: [-165, -15], life: [50, 86], g: 0.18, drag: 0.94, size: [44, 96], spin: 10, stagger: 10}),
    ...makeBurst({seed: 92, at: KICK2, x: BX, y: BY - 20, n: 18, kinds: ['note', 'noteP', 'noteS', 'spark:#ffffff', 'heartP'], speed: [10, 28], angle: [-165, -15], life: [46, 80], g: 0.18, drag: 0.94, size: [44, 90], spin: 10, stagger: 8}),
  ]);
  const rise = useList(() => makeBurst({seed: 93, at: kickAt + 10, x: 960, y: 1150, n: 22, kinds: ['noteP', 'note', 'spark:#ffffff', 'star'], speed: [12, 26], angle: [-100, -80], life: [66, 108], g: 0.2, drag: 0.96, size: [36, 84], stagger: 50, spread: 1900}));
  const pop = useList(() => makeBurst({seed: 94, at: kickAt + 6, x: BX + 150, y: BY - 140, n: 14, kinds: ['sq:#ff4d5e', 'spark:#ffffff', 'sq:#ffffff'], speed: [8, 20], life: [20, 34], g: 0.4, size: [26, 50]}));

  const mini = [
    {x: 190, y: 270, lag: 3, s: 170},
    {x: 1730, y: 270, lag: 6, s: 170},
    {x: 190, y: 780, lag: 9, s: 150},
    {x: 1730, y: 780, lag: 12, s: 150},
  ];

  return (
    <Stage bg={bg} time="dusk">
      <Sunburst x={BX} y={BY} alpha={f >= kickAt ? 0.2 : 0} color="255,226,140" rays={14} spin={0.4} scale={rangeP(f, kickAt, 16)} />

      {/* sound dashes */}
      {emits.map((e, i) => (
        <Dashes key={i} x={BX + e.dir * 110} y={BY + 40} at={e.at} dir={e.dir} power={e.power} color={e.color} />
      ))}

      {/* beam */}
      <At x={BX} y={150} s={intro}>
        <div style={{width: 920, height: 80, backgroundImage: `url(${block('oak_planks')})`, backgroundSize: '76px 76px', imageRendering: 'pixelated', border: `8px solid ${INK}`, boxSizing: 'border-box', boxShadow: `0 12px 0 ${INK}`, position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 14, background: 'rgba(255,255,255,0.25)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, background: 'rgba(43,35,56,0.28)'}} />
        </div>
      </At>
      {[-1, 1].map((d) => (
        <At key={d} x={BX + d * 400} y={300} s={intro}>
          <div style={{width: 44, height: 250, backgroundImage: `url(${block('oak_planks')})`, backgroundSize: '44px 44px', imageRendering: 'pixelated', border: `8px solid ${INK}`, boxSizing: 'border-box', boxShadow: `0 12px 0 ${INK}`}} />
        </At>
      ))}

      {/* big bell */}
      <At x={BX} y={BY + 20} s={intro * (1 + 0.04 * Math.sin(f / 6) * (f > kickAt ? 1 : 0))} rot={ang} origin="50% 8%">
        <ItemSp id="bell" size={420} />
      </At>
      <At x={BX} y={BY - 185} s={intro}>
        <div style={{width: 20, height: 56, background: FLAT.brown, border: `6px solid ${INK}`, boxSizing: 'border-box'}} />
      </At>
      {/* badge */}
      <At x={BX + 190} y={BY - 170 + Math.sin(f / 7) * 3} s={badge} rot={(1 - badge) * 90}>
        <div style={{...chunky(FLAT.red, FLAT.redDeep, '#ff8f9a', {r: 9999, b: 8, sh: 10, band: 10}), width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Label size={56} color="#ffffff" style={{WebkitTextStroke: '0px', textShadow: 'none', lineHeight: '56px'}}>{badgeText}</Label>
        </div>
      </At>

      <Shockwave x={BX} y={BY + 40} at={kickAt} color={FLAT.yellow} maxR={520} life={22} width={22} rays={14} seed={41} />
      <Shockwave x={BX} y={BY + 40} at={KICK2} color={FLAT.pink} maxR={400} life={20} width={18} rays={10} seed={42} />
      <Particles list={notes} />
      <Particles list={rise} />
      <Particles list={pop} />

      {/* corner mini bells */}
      {mini.map((m, i) => (
        <At key={i} x={m.x} y={m.y} s={spring(f, 8 + i * 4, 18)} rot={swing(f, kickAt, 36, 36, m.lag) + swing(f, KICK2, 20, 28, m.lag)} origin="50% 8%">
          <ItemSp id="bell" size={m.s} />
        </At>
      ))}

      {/* Ore toast */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none'}}>
        <At x={BX} y={858 + (1 - toast) * 380} s={1} o={Math.min(1, toast * 3)}>
          <OrePanel variant="panel_raised" style={{width: 1160, height: 248, display: 'flex', alignItems: 'center', gap: 8 * U, padding: `0 ${8 * U}px`, boxSizing: 'border-box'}}>
            <OreSlot size={40 * U}><ItemSp id="bell" size={124} outline={false} /></OreSlot>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 * U, flex: 1, minWidth: 0}}>
              <OreText size={TYPE.h1} shadow style={{lineHeight: `${TYPE.h1 + 8}px`}}>{title}</OreText>
              <OreText size={TYPE.small} color={ORE.dim}>{sub}</OreText>
              <OreProgress value={prog} width={720} color="gold" />
            </div>
            <div style={{width: 96, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.1 * Math.sin(f / 5)})`}}>
              <Sp s={SPRITES.heart} k="heart" px={8} drop={1} />
            </div>
          </OrePanel>
        </At>
      </div>

      {/* border decor */}
      <Orn x={400} y={600} at={14} rot={-8} bobAmp={8}><Sp s={STAR_BIG} k="star" px={8} drop={1} /></Orn>
      <Orn x={1380} y={96} at={18} rot={8} bobAmp={8} period={44}><Sp s={HEART_PINK} k="hp" px={7} drop={1} /></Orn>
      <Orn x={70} y={540} at={22} rot={-8} bobAmp={16}><Sp s={STAR_BIG} k="star" px={9} drop={1} /></Orn>
      <Orn x={1850} y={540} at={26} rot={8} bobAmp={16} period={48}><Sp s={HEART_PINK} k="hp" px={9} drop={1} /></Orn>
      <Orn x={120} y={1000 + bob(f, 30, 0)} at={30} rot={-6} bobAmp={8}><Mob k="slime" scale={8} drop={6} /></Orn>
      <Orn x={1800} y={1000} at={34} rot={6} bobAmp={8}><Mob k="creeper" scale={8} drop={6} /></Orn>

      {audio && <Sfx at={kickAt} src={mcSound('random/orb')} volume={0.55} rate={2.0} />}
      {audio && <Sfx at={kickAt + 1} src={mcSound('random/click')} volume={0.4} rate={0.9} />}
      {audio && <Sfx at={kickAt + 5} src={mcSound('random/orb')} volume={0.35} rate={1.7} />}
      {audio && <Sfx at={kickAt + 14} src={mcSound('random/orb')} volume={0.3} rate={2.0} />}
      {audio && <Sfx at={kickAt + 24} src={mcSound('ui/toast/in')} volume={0.4} />}
      {audio && <Sfx at={KICK2} src={mcSound('random/orb')} volume={0.45} rate={1.5} />}
      {audio && <Sfx at={KICK2 + 12} src={mcSound('random/orb')} volume={0.25} rate={1.9} />}
    </Stage>
  );
};

export const bellEntry: FxEntry = {
  meta: {
    id: 'soc-bell',
    name: '订阅铃铛 · 已开启小铃铛',
    category: 'social',
    tags: ['订阅', '铃铛', '提示条', '声波', 'Ore'],
    frames: 120,
    blurb: 'MC 铃铛挂在木梁下被敲响，阻尼摆动，左右打出三道像素声波短条，音符和星星飞出，红色“1”角标弹出，底部滑上 Ore 风“已开启小铃铛”提示条，四角小铃铛跟着摇。',
    usage: '提示观众点小铃铛 / 开启动态通知；Layer 透明背景可直接叠加（提示条在画面下方）。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景'},
      {name: 'kickAt', desc: '第一下敲响的帧，默认 24（第二下在 +62 帧）'},
      {name: 'title', desc: '提示条标题'},
      {name: 'sub', desc: '提示条副标题'},
    ],
  },
  Demo: () => <BellFx bg />,
  Layer: () => <BellFx />,
};
