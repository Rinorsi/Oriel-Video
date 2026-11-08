import {type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT} from '../../flat';
import {At, COIN, Glint, HEART_PINK, INK, ItemSp, Label, Mob, Odometer, Orn, Particles, Say, STAR_BIG, Sp, Stage, Sunburst, bob, chunky, confettiRain, lerp, makeBurst, rangeP, spring, useList, wobble} from './common';

/**
 * soc-coin: emeralds and gold coins are thrown in from the screen edges in parabolic arcs (with afterimages) and
 * drop into a big coin button. Each landing makes the button dip and jelly, flashes a pixel glint plus a small pixel
 * cross burst and bumps the counter; the last one fires a shine sweep, a coin shower from the top and an orbit of little coins.
 * Props: bg, count (coins before), throws (override the schedule: [{id, from:[x,y], land, h}]), label (counter caption), plusText (floating text per landing),
 * doneText (banner after the last coin), audio (play the sound effects).
 */

export type Throw = {id: 'emerald' | 'coin' | 'diamond'; from: [number, number]; land: number; h: number};

const DEFAULT_THROWS: Throw[] = [
  {id: 'emerald', from: [-140, 880], land: 24, h: 430},
  {id: 'coin', from: [2060, 260], land: 42, h: 300},
  {id: 'emerald', from: [-140, 200], land: 58, h: 240},
  {id: 'coin', from: [2060, 920], land: 72, h: 520},
];

const HIT_COLORS = [FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink];
// where the glint flashes on the button rim for each landing (offset from the button centre)
const GLINT_POS: [number, number][] = [
  [-110, -120],
  [120, -100],
  [-130, 40],
  [110, 90],
];

const Piece: FC<{id: Throw['id']; spin: number; s?: number}> = ({id, spin, s = 1}) => {
  const flip = Math.cos(spin);
  return (
    <div style={{transform: `scaleX(${0.18 + Math.abs(flip) * 0.82}) scale(${s})`}}>
      {id === 'coin' ? <Sp s={COIN} k="coin" px={8} drop={1} /> : <ItemSp id={id} size={120} />}
    </div>
  );
};

export const CoinFx: FC<{bg?: boolean; count?: number; throws?: Throw[]; label?: string; plusText?: string; doneText?: string; audio?: boolean}> = ({bg, count = 128, throws = DEFAULT_THROWS, label = '硬币', plusText = '+1', doneText = '投币成功', audio = true}) => {
  const f = useCurrentFrame();
  const BX = 960;
  const BY = 520;
  const last = throws[throws.length - 1].land;
  const FLIGHT = 20;

  const landBursts = useList(() => throws.flatMap((t, i) => makeBurst({seed: 31 + i, at: t.land, x: BX, y: BY - 20, n: 14, kinds: ['coin', 'spark:#ffffff', 'spark:#ffd23f', 'sq:#ffd23f', 'item:emerald'], speed: [10, 26], angle: [-160, -20], life: [26, 44], g: 0.8, size: [30, 60], spin: 16})));
  const finale = useList(() => makeBurst({seed: 41, at: last, x: BX, y: BY, n: 44, kinds: ['coin', 'star', 'spark:#ffffff', 'spark:#ffd23f', 'sq:#ffd23f', 'item:emerald', 'heartP'], speed: [20, 54], life: [44, 76], g: 0.5, size: [44, 96], spin: 18}));
  const shower = useList(() => confettiRain(42, last + 2, 46, 44, {kinds: ['coin', 'coin', 'item:emerald', 'star', 'spark:#ffd23f'], size: [48, 92], vy: [9, 17]}));
  const sideShower = useList(() => makeBurst({seed: 43, at: last + 4, x: 960, y: -60, n: 20, kinds: ['spark:#ffffff', 'spark:#ffd23f'], speed: [8, 16], angle: [80, 100], life: [60, 90], g: 0.15, size: [30, 60], spread: 1900, stagger: 30}));

  const ambient = useList(() => makeBurst({seed: 44, at: 4, x: 960, y: 1150, n: 22, kinds: ['spark:#ffd23f', 'spark:#ffffff', 'coin', 'star'], speed: [10, 22], angle: [-100, -80], life: [80, 130], g: 0.12, drag: 0.97, size: [30, 70], stagger: 110, spread: 1900}));

  // button dynamics: dip + jelly from each landing, stronger on the last
  let dip = 0;
  let jel = 0;
  let landed = 0;
  throws.forEach((t, i) => {
    const w = i === throws.length - 1 ? 1.7 : 1;
    const d = f - t.land;
    if (d >= 0) {
      dip += Math.exp(-d / 4) * 0.12 * w;
      jel += wobble(f, t.land, 16, 2.5) * 0.16 * w;
      landed += clamp01(d / 5);
    }
  });
  const grow = spring(f, 0, 20);
  const done = f >= last;
  const shine = rangeP(f, last + 2, 16, (t) => t);
  const spin = (f - last) * 0.28;

  return (
    <Stage bg={bg} time="dusk">
      <Sunburst x={BX} y={BY} alpha={0.12 + 0.05 * landed + (done ? 0.1 : 0)} color="255,230,140" rays={16} spin={0.5} scale={0.4 + 0.15 * landed} />

      {/* button */}
      <At x={BX} y={BY + dip * 60} s={grow} sx={1 + dip * 0.5 - jel * 0.7} sy={1 - dip * 0.55 + jel}>
        <div style={{position: 'relative', width: 360, height: 360}}>
          <div style={{...chunky(FLAT.orange, '#e0701c', '#ffc27a', {r: 9999, b: 12, sh: 18, band: 22}), position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            <div style={{transform: `scaleX(${done ? 0.25 + Math.abs(Math.cos(Math.min(1, (f - last) / 26) * Math.PI * 2 + 0.0)) * 0.75 : 1})`}}>
              <Sp s={COIN} k="coin" px={14} drop={1} />
            </div>
            {done && <div style={{position: 'absolute', top: -40, bottom: -40, width: 90, left: -120 + shine * 560, transform: 'rotate(22deg)', background: 'rgba(255,255,255,0.8)'}} />}
          </div>
        </div>
      </At>

      {/* counter */}
      <At x={BX} y={BY + 330} s={spring(f, 6, 20)} sx={1 + wobble(f, last, 16, 3) * 0.07} sy={1 - wobble(f, last, 16, 3) * 0.1}>
        <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 64, b: 10, sh: 14, band: 12}), width: 540, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
          <Label size={52} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{label}</Label>
          <Odometer value={count + landed} digits={3} size={96} color={FLAT.orange} />
          <Sp s={COIN} k="coin" px={4} drop={1} />
        </div>
      </At>

      {/* flights */}
      {throws.map((t, i) => {
        const t0 = t.land - FLIGHT;
        if (f < t0 || f > t.land) return null;
        const pos = (u: number) => {
          const k = clamp01(u);
          return {x: lerp(t.from[0], BX, EASE.inOut(k) * 0.4 + k * 0.6), y: lerp(t.from[1], BY, k) - 4 * t.h * k * (1 - k)};
        };
        const u = (f - t0) / FLIGHT;
        return (
          <div key={i}>
            {[5, 4, 3, 2, 1].map((g) => {
              const uu = u - g * 0.045;
              if (uu < 0) return null;
              const p = pos(uu);
              return (
                <At key={g} x={p.x} y={p.y} o={0.14 * (6 - g)} s={0.9 - g * 0.05} rot={uu * 720}>
                  <Piece id={t.id} spin={uu * 14} />
                </At>
              );
            })}
            <At x={pos(u).x} y={pos(u).y} rot={u * 720} s={1 - Math.max(0, u - 0.85) * 4}>
              <Piece id={t.id} spin={u * 14} />
            </At>
          </div>
        );
      })}

      <Particles list={ambient} />
      {/* per landing effects */}
      <Particles list={landBursts} />
      {throws.map((t, i) => (
        <div key={i}>
          <Shockwave x={BX} y={BY} at={t.land} color={HIT_COLORS[i % 4]} maxR={i === throws.length - 1 ? 640 : 380} life={i === throws.length - 1 ? 26 : 18} width={i === throws.length - 1 ? 22 : 16} rays={i === throws.length - 1 ? 16 : 10} seed={i + 2} />
          <Glint x={BX + GLINT_POS[i % 4][0]} y={BY + GLINT_POS[i % 4][1]} at={t.land} size={i === throws.length - 1 ? 190 : 140} color={i % 2 ? '#ffffff' : '#fff2a8'} life={12} rot={i * 9} />
          <Say at={t.land + 3} x={BX + 330} y={BY + 250} text={plusText} size={64} color={FLAT.orange} rot={4} life={26} />
          {audio && <Sfx at={t.land} src={mcSound('random/orb')} volume={0.5} rate={1 + i * 0.22} />}
          {audio && <Sfx at={t.land} src={mcSound('random/anvil_land')} volume={0.12} rate={2.2 + i * 0.1} />}
          {audio && <Sfx at={t.land - 16} src={mcSound('random/pop')} volume={0.18} rate={1.2 + i * 0.1} />}
        </div>
      ))}
      <Particles list={finale} />
      <Particles list={shower} />
      <Particles list={sideShower} />
      {audio && <Sfx at={last + 2} src={mcSound('random/levelup')} volume={0.3} rate={1.15} />}

      {/* orbiting little coins once complete */}
      {done &&
        Array.from({length: 7}, (_, i) => {
          const a = ((f - last) * 0.05 + (i / 7) * Math.PI * 2) * 1;
          const p = spring(f, last + 6 + i * 2, 16);
          return (
            <At key={i} x={BX + Math.cos(a) * 330} y={BY + Math.sin(a) * 110 - 20} s={p * (0.8 + 0.25 * Math.sin(a))} z={Math.sin(a) > 0 ? 5 : 0}>
              <Piece id="coin" spin={(f - last) * 0.3 + i} s={0.55} />
            </At>
          );
        })}
      {done && <Say at={last + 18} x={BX} y={170} text={doneText} size={108} color={FLAT.orange} rot={-3} life={80} />}

      {/* border decor */}
      <Orn x={330} y={985} at={10} rot={-6} bobAmp={8}><Mob k="creeper" scale={14} drop={8} /></Orn>
      <Orn x={1590} y={985} at={14} rot={6} bobAmp={8} period={46}><Mob k="pig" scale={14} drop={8} /></Orn>
      <Orn x={110} y={120} at={8} rot={-14} bobAmp={12}><Sp s={COIN} k="coin" px={11} drop={2} /></Orn>
      <Orn x={1810} y={130} at={14} rot={12} bobAmp={12} period={56}><Sp s={STAR_BIG} k="star" px={11} drop={2} /></Orn>
      <Orn x={110} y={950} at={20} rot={10} bobAmp={14} period={60}><Sp s={STAR_BIG} k="star" px={10} drop={2} /></Orn>
      <Orn x={1810} y={950} at={26} rot={-10} bobAmp={14} period={52}><Sp s={COIN} k="coin" px={11} drop={2} /></Orn>
      <Orn x={90} y={530} at={32} rot={-8} bobAmp={16}><ItemSp id="emerald" size={96} /></Orn>
      <Orn x={1830} y={540} at={36} rot={8} bobAmp={16} period={48}><ItemSp id="emerald" size={96} /></Orn>
      <Orn x={520} y={90} at={40} rot={6} bobAmp={8}><Sp s={HEART_PINK} k="hp" px={6} drop={1} /></Orn>
      <Orn x={1400} y={980} at={44} rot={-6} bobAmp={8}><Sp s={STAR_BIG} k="star" px={7} drop={1} /></Orn>
      <Orn x={440} y={990 + bob(f, 30, 0)} at={46} rot={-6} bobAmp={8}><ItemSp id="diamond" size={84} /></Orn>
      <Orn x={1520} y={110} at={50} rot={6} bobAmp={8}><ItemSp id="diamond" size={84} /></Orn>
    </Stage>
  );
};

export const coinEntry: FxEntry = {
  meta: {
    id: 'soc-coin',
    name: '投币 · 连投入箱',
    category: 'social',
    tags: ['投币', '绿宝石', '金币', '互动', '抛物线'],
    frames: 135,
    blurb: '绿宝石和金币从画面四边抛着弧线飞来，带残影砸进大硬币按钮，每次落下按钮下沉果冻、边缘闪一下像素星光、计数 +1，最后一枚触发扫光、金币雨与环绕小金币。',
    usage: '提醒投币、打赏、感谢支持的时候；Layer 透明背景可叠在任意素材上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景'},
      {name: 'count', desc: '投币前的硬币数'},
      {name: 'throws', desc: '抛物线日程：[{id: emerald|coin|diamond, from:[x,y], land: 落点帧, h: 抛高}]'},
    ],
  },
  Demo: () => <CoinFx bg />,
  Layer: () => <CoinFx />,
};
