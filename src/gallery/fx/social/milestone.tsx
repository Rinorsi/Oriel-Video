import {useMemo, type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT, Sticker} from '../../flat';
import {At, Avatar, Bunting, HEART_BIG, HEART_PINK, INK, ItemSp, Label, Mob, Odometer, Orn, Particles, STAR_BIG, Sp, Stage, Sunburst, bob, chunky, confettiRain, lerp, makeBurst, rangeP, spring, useList, wobble, type P} from './common';

/**
 * soc-milestone: a follower counter rolls from 0 up to the milestone (fast, then slows, then ticks the last
 * digits), locks in with a slam, and the whole frame erupts: fireworks rise from the bottom and explode around all
 * four sides, ribbons and confetti, a "万粉达成" banner and "感谢大家!" sticker.
 * Props: bg, target (the number, default 10000), digits (odometer width, default 5), fireworks (override schedule [{x, y, at, colors, n}]), label (caption under the number),
 * banner (red banner text), thanks (sticker text), audio (play the sound effects).
 */

export type FW = {x: number; y: number; at: number; colors: string[]; n?: number};
const C = {r: FLAT.red, y: FLAT.yellow, s: FLAT.sky, w: '#ffffff', g: FLAT.green, m: FLAT.mint, p: FLAT.pink, l: FLAT.lilac, o: FLAT.orange, u: FLAT.purple, t: FLAT.teal};
export const DEFAULT_FIREWORKS: FW[] = [
  {x: 200, y: 330, at: 80, colors: [C.y, C.w], n: 30},
  {x: 1720, y: 300, at: 94, colors: [C.s, C.w], n: 30},
  {x: 960, y: 130, at: 106, colors: [C.p, C.y], n: 34},
  {x: 260, y: 250, at: 118, colors: [C.r, C.y]},
  {x: 1660, y: 240, at: 120, colors: [C.s, C.w]},
  {x: 150, y: 640, at: 126, colors: [C.g, C.m]},
  {x: 1770, y: 650, at: 129, colors: [C.p, C.l]},
  {x: 560, y: 120, at: 134, colors: [C.o, C.y]},
  {x: 1360, y: 130, at: 137, colors: [C.u, C.s]},
  {x: 300, y: 880, at: 144, colors: [C.t, C.w]},
  {x: 1630, y: 890, at: 148, colors: [C.r, C.p]},
  {x: 960, y: 100, at: 152, colors: [C.y, C.w, C.o]},
  {x: 1500, y: 150, at: 164, colors: [C.g, C.y]},
  {x: 420, y: 170, at: 168, colors: [C.p, C.s]},
  {x: 1770, y: 860, at: 174, colors: [C.y, C.r]},
  {x: 170, y: 880, at: 178, colors: [C.l, C.w]},
  {x: 960, y: 120, at: 186, colors: [C.r, C.y, C.s]},
  {x: 230, y: 450, at: 194, colors: [C.o, C.w]},
  {x: 1720, y: 430, at: 198, colors: [C.t, C.y]},
];

const Firework: FC<{fw: FW; idx: number; audio?: boolean}> = ({fw, idx, audio = true}) => {
  const f = useCurrentFrame();
  const RISE = 15;
  const launch = fw.at - RISE;
  const n = fw.n ?? 46;
  const parts = useMemo<P[]>(() => {
    const kinds = fw.colors.flatMap((c) => [`sq:${c}`, `spark:${c}`, `spark:${c}`]);
    return [
      ...makeBurst({seed: 400 + idx, at: fw.at, x: fw.x, y: fw.y, n, kinds, speed: [10, 30], life: [34, 56], g: 0.22, drag: 0.92, size: [30, 62], spin: 10}),
      ...makeBurst({seed: 500 + idx, at: fw.at + 4, x: fw.x, y: fw.y, n: Math.round(n * 0.55), kinds: [...fw.colors.map((c) => `spark:${c}`), 'star'], speed: [4, 14], life: [46, 70], g: 0.34, drag: 0.94, size: [26, 50], spin: 8}),
    ];
  }, []);
  const rise = clamp01((f - launch) / RISE);
  const rocketOn = f >= launch && f < fw.at;
  const rx = lerp(fw.x + (idx % 2 ? 60 : -60), fw.x, EASE.out(rise));
  const ry = lerp(1160, fw.y, EASE.out(rise));
  const trail = useMemo<P[]>(() => {
    const out: P[] = [];
    for (let t = launch; t < fw.at; t++) {
      const k = clamp01((t - launch) / RISE);
      out.push(...makeBurst({seed: 600 + idx * 40 + (t - launch), at: t, x: lerp(fw.x + (idx % 2 ? 60 : -60), fw.x, EASE.out(k)), y: lerp(1160, fw.y, EASE.out(k)), n: 2, kinds: ['spark:#ffffff', 'spark:#ffd23f', 'sq:#ff9a3c'], speed: [0.5, 3], angle: [60, 120], life: [10, 18], g: 0.1, size: [18, 34]}));
    }
    return out;
  }, []);
  return (
    <>
      <Particles list={trail} />
      {rocketOn && (
        <At x={rx} y={ry} rot={-45 + (idx % 2 ? -4 : 4)} s={1}>
          <ItemSp id="firework_rocket" size={92} />
        </At>
      )}
      <Shockwave x={fw.x} y={fw.y} at={fw.at} color={fw.colors[0]} maxR={n > 40 ? 300 : 220} life={16} width={14} rays={10} seed={idx + 70} />
      <Particles list={parts} />
      {audio && <Sfx at={launch} src={mcSound('random/fuse')} volume={0.14} rate={1.7 + (idx % 3) * 0.2} cut={RISE} />}
      {audio && <Sfx at={fw.at} src={mcSound('random/explode' + (1 + (idx % 3)))} volume={0.2} rate={1.6 + (idx % 4) * 0.12} />}
      {audio && <Sfx at={fw.at + 1} src={mcSound('random/orb')} volume={0.12} rate={1.8 + (idx % 3) * 0.2} />}
    </>
  );
};

export const MilestoneFx: FC<{bg?: boolean; target?: number; digits?: number; fireworks?: FW[]; label?: string; banner?: string; thanks?: string; audio?: boolean}> = ({
  bg,
  target = 10000,
  digits = 5,
  fireworks = DEFAULT_FIREWORKS,
  label = '粉丝',
  banner: bannerText = '万粉达成！',
  thanks: thanksText = '感谢大家!',
  audio = true,
}) => {
  const f = useCurrentFrame();
  const LOCK = 112;
  const CX = 960;
  const CY = 520;

  const v =
    f < 14 ? 0 : f < 70 ? target * 0.9 * EASE.out((f - 14) / 56) : f < 104 ? lerp(target * 0.9, target * 0.999, (f - 70) / 34) : f < LOCK ? lerp(target * 0.999, target, EASE.inOut((f - 104) / (LOCK - 104))) : target;
  const locked = f >= LOCK;
  const panelIn = spring(f, 2, 22);
  const slam = wobble(f, LOCK, 22, 3);
  const bump = locked ? Math.max(0, 1 - (f - LOCK) / 6) : 0;
  const banner = spring(f, LOCK + 4, 22);
  const thanks = spring(f, LOCK + 16, 24);

  const cannons = useList(() => {
    const cols = [FLAT.red, FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink, FLAT.purple, FLAT.orange];
    const k = ['conf', 'conf', 'conf', 'sq:#ffd23f', 'star', 'heartP'];
    return [
      ...makeBurst({seed: 701, at: LOCK + 2, x: 30, y: 1070, n: 56, kinds: k, colors: cols, speed: [34, 82], angle: [-86, -32], life: [64, 108], g: 0.8, drag: 0.94, size: [40, 76], spin: 18, stagger: 6}),
      ...makeBurst({seed: 702, at: LOCK + 2, x: 1890, y: 1070, n: 56, kinds: k, colors: cols, speed: [34, 82], angle: [-148, -94], life: [64, 108], g: 0.8, drag: 0.94, size: [40, 76], spin: 18, stagger: 6}),
    ];
  });
  const rain = useList(() => confettiRain(703, LOCK + 6, 90, 110, {size: [34, 66], kinds: ['conf', 'conf', 'conf', 'star', 'heartP']}));
  const slamBurst = useList(() => makeBurst({seed: 704, at: LOCK, x: CX, y: CY, n: 46, kinds: ['star', 'spark:#ffffff', 'spark:#ffd23f', 'heartP', 'coin', 'sq:#ffd23f'], speed: [22, 60], life: [40, 70], g: 0.4, size: [44, 100], spin: 16}));
  const early = useList(() => makeBurst({seed: 706, at: 16, x: 960, y: 1150, n: 16, kinds: ['heartP', 'spark:#ffffff', 'star'], speed: [10, 20], angle: [-100, -80], life: [70, 110], g: 0.2, drag: 0.96, size: [30, 70], stagger: 90, spread: 1900}));
  const rise = useList(() => makeBurst({seed: 705, at: LOCK + 12, x: 960, y: 1150, n: 30, kinds: ['heartP', 'heart', 'star', 'spark:#ffffff'], speed: [12, 28], angle: [-100, -80], life: [70, 110], g: 0.25, drag: 0.96, size: [36, 96], stagger: 80, spread: 1900}));

  // tick sounds while rolling
  const ticks = Array.from({length: 26}, (_, i) => 16 + Math.round(i * 3.7));

  return (
    <Stage bg={bg} time="night">
      {locked && <Sunburst x={CX} y={CY} size={3200} alpha={0.26} color="255,226,120" rays={20} spin={0.6} scale={EASE.out(clamp01((f - LOCK) / 14))} />}
      {/* speed lines while counting */}
      {f > 14 && f < LOCK &&
        Array.from({length: 16}, (_, i) => {
          const a = (i / 16) * 360;
          const k = (f * 0.07 + i * 0.13) % 1;
          return <div key={i} style={{position: 'absolute', left: CX, top: CY, width: 140, height: 8, borderRadius: 4, background: '#fff', opacity: 0.35 * (1 - k) * rangeP(f, 14, 20), transform: `rotate(${a}deg) translateX(${480 + k * 700}px)`, transformOrigin: '0 50%'}} />;
        })}

      <Particles list={early} />
      <Orn x={110} y={130} at={8} rot={-14} bobAmp={12}><Sp s={STAR_BIG} k="star" px={9} drop={1} /></Orn>
      <Orn x={1810} y={140} at={12} rot={14} bobAmp={12} period={56}><Sp s={HEART_PINK} k="hp" px={9} drop={1} /></Orn>
      <Orn x={110} y={560} at={16} rot={-8} bobAmp={14}><Sp s={HEART_PINK} k="hp" px={7} drop={1} /></Orn>
      <Orn x={1820} y={560} at={20} rot={8} bobAmp={14} period={50}><Sp s={STAR_BIG} k="star" px={7} drop={1} /></Orn>
      {fireworks.map((fw, i) => (
        <Firework key={i} fw={fw} idx={i} audio={audio} />
      ))}

      {/* counter panel */}
      <At x={CX} y={CY} s={panelIn * (1 + bump * 0.08)} sx={1 + slam * 0.05} sy={1 - slam * 0.07}>
        <div style={{...chunky('#3b2a7a', '#2a1d5c', '#5a45a8', {r: 70, b: 12, sh: 20, band: 18}), width: 1060, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative'}}>
          {[[26, 26], [1034 - 26, 26], [26, 374], [1034 - 26, 374]].map(([x, y], i) => (
            <div key={i} style={{position: 'absolute', left: x - 14, top: y - 14, width: 28, height: 28, borderRadius: 14, background: FLAT.yellow, border: `5px solid ${INK}`, boxSizing: 'border-box'}} />
          ))}
          <Odometer value={v} digits={digits} size={220} color={locked ? FLAT.yellow : '#ffffff'} gap={6} centerVisible />
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <Sp s={HEART_BIG} k="hb" px={5} drop={1} />
            <Label size={64} color="#ffffff">{label}</Label>
            <Sp s={HEART_PINK} k="hp" px={5} drop={1} />
          </div>
        </div>
      </At>

      {/* lock-in effects */}
      <Shockwave x={CX} y={CY} at={LOCK} color={FLAT.yellow} maxR={900} life={28} width={24} rays={20} seed={81} />
      <Shockwave x={CX} y={CY} at={LOCK + 4} color="#ffffff" maxR={700} life={24} width={18} rays={14} seed={82} />
      <Shockwave x={CX} y={CY} at={LOCK + 8} color={FLAT.pink} maxR={1150} life={32} width={20} rays={16} seed={83} />
      <Particles list={slamBurst} />
      <Particles list={cannons} />
      <Particles list={rain} />
      <Particles list={rise} />

      {/* banner + thanks */}
      {locked && (
        <>
          <At x={CX} y={226 + (1 - banner) * -80} s={banner} rot={-2}>
            <div style={{...chunky(FLAT.red, FLAT.redDeep, '#ff8f9a', {r: 40, b: 10, sh: 16, band: 14}), padding: '0 64px', height: 136, display: 'flex', alignItems: 'center', gap: 28}}>
              <Sp s={STAR_BIG} k="star" px={7} drop={1} />
              <Label size={86} color="#ffffff">{bannerText}</Label>
              <Sp s={STAR_BIG} k="star" px={7} drop={1} />
            </div>
          </At>
          <At x={CX} y={820} s={thanks * (1 + 0.02 * Math.sin(f / 5))} rot={2 + wobble(f, LOCK + 18, 24, 2) * 3}>
            <div style={{position: 'relative'}}>
              <Sticker size={156} color={FLAT.purple} halo={false} style={{position: 'absolute', left: 8, top: 14}}>
                {thanksText}
              </Sticker>
              <Sticker size={156} color={FLAT.yellow} style={{position: 'relative'}}>
                {thanksText}
              </Sticker>
            </div>
          </At>
          <Bunting x0={-40} y0={-30} x1={1960} y1={-30} sag={50} n={12} at={LOCK + 10} size={84} />
        </>
      )}
      {/* the crowd: one fan joins per step of the count, then they all cheer */}
      {(['steve', 'alex', 'sunny', 'zuri', 'kai', 'creeper', 'pig', 'slime', 'alex'] as const).map((face, i) => {
        const at = 18 + i * 10;
        const p = spring(f, at, 16);
        const cheer = f > LOCK + 4 ? Math.abs(Math.sin(((f - LOCK - i * 3) / 14) * Math.PI)) * 34 : 0;
        const x = 330 + i * 157;
        return (
          <At key={face + i} x={x} y={1010 + (1 - p) * 200 - cheer} rot={Math.sin(f / 6 + i) * (f > LOCK ? 7 : 2)} s={0.001 + p}>
            <Avatar face={face} size={118} />
          </At>
        );
      })}
      {/* mascots */}
      {[
        {x: 130, y: 980, at: LOCK + 14, k: 'creeper' as const, px: 17, rot: -6},
        {x: 1790, y: 980, at: LOCK + 18, k: 'pig' as const, px: 17, rot: 6},
      ].map((m, i) => {
        const p = spring(f, m.at, 18);
        const hop = f > m.at + 12 ? Math.abs(Math.sin(((f - m.at) / 16) * Math.PI)) * 30 : 0;
        return (
          <At key={i} x={m.x} y={m.y + (1 - p) * 260 - hop} rot={m.rot + Math.sin(f / 5 + m.x) * 4} s={0.001 + p}>
            <Mob k={m.k} scale={m.px} drop={8} />
          </At>
        );
      })}
      <Orn x={90} y={450} at={LOCK + 20} rot={-12} bobAmp={12}><Sp s={STAR_BIG} k="star" px={9} drop={1} /></Orn>
      <Orn x={1830} y={460} at={LOCK + 24} rot={12} bobAmp={12} period={54}><Sp s={HEART_BIG} k="hb" px={9} drop={1} /></Orn>
      <Orn x={620} y={1000 + bob(f, 30, 0)} at={LOCK + 28} rot={-6} bobAmp={8}><ItemSp id="firework_star" size={96} /></Orn>
      <Orn x={1300} y={1000} at={LOCK + 30} rot={6} bobAmp={8}><ItemSp id="firework_rocket" size={96} /></Orn>

      {/* sfx */}
      {audio && ticks.map((t, i) => <Sfx key={i} at={t} src={mcSound('random/click')} volume={0.11 + i * 0.004} rate={1.0 + i * 0.035} />)}
      {audio && <Sfx at={LOCK} src={mcSound('random/explode1')} volume={0.4} rate={1.1} />}
      {audio && <Sfx at={LOCK + 1} src={reelSfx('impact-cine.mp3')} volume={0.3} />}
      {audio && <Sfx at={LOCK + 2} src={mcSound('random/levelup')} volume={0.5} />}
      {audio && <Sfx at={LOCK + 6} src={mcSound('ui/toast/challenge_complete')} volume={0.35} />}
      {audio && <Sfx at={LOCK + 16} src={mcSound('random/pop')} volume={0.4} rate={1.3} />}
    </Stage>
  );
};

export const milestoneEntry: FxEntry = {
  meta: {
    id: 'soc-milestone',
    name: '粉丝里程碑 · 破万烟花',
    category: 'social',
    tags: ['粉丝', '里程碑', '数字滚动', '烟花', '彩带', '感谢'],
    frames: 210,
    blurb: '紫色计数牌里数字飞快滚动，越接近一万越慢、逐位跳动，到 10000 猛地定住并爆出光芒与像素十字闪光、碎片飞溅；火箭从底部升起，在画面四周接连炸开烟花，彩带从两个底角喷出，“万粉达成！”横幅和“感谢大家!”贴纸弹出。',
    usage: '粉丝/订阅数破万、破十万等里程碑的庆祝与感谢；Layer 透明背景可叠在片头片尾画面上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景（夜空虚化）'},
      {name: 'target', desc: '目标数字，默认 10000（5 位数）'},
      {name: 'fireworks', desc: '烟花日程 [{x, y, at(炸开帧), colors, n}]，默认 19 发'},
    ],
  },
  Demo: () => <MilestoneFx bg />,
  Layer: () => <MilestoneFx />,
};
