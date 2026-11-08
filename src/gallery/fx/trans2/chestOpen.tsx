import type {FC} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {item, tex} from '../../../mc/assets';
import {EASE, HEIGHT, WIDTH, mulberry32} from '../../../mc/theme';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {TexBox, boxUV} from './box3d';
import {SquareBurst, ewin, jitter, mix, win} from './common';

/**
 * t2-chest-open : the vanilla chest (normal.png, real lid / base / latch UV crops on CSS 3D boxes) rises from the bottom,
 * lands with dust, trembles with gold light leaking through the seam, then the lid swings open on its back hinge and a
 * column of light erupts with a few loot items. A is sucked into the opening, the light floods the screen and B unfolds out of it.
 * Dual-type with custom a/b styles. Params: S (screen px per texel), LID_OPEN (final lid angle), OPEN_X / OPEN_Y (opening on screen), LIGHT (colours).
 */

const T = 76;
const S = 36; // 14 x 14 texel chest -> 504 px wide
const W = 14 * S;
const D = 14 * S;
const BH = 10 * S;
const LH = 5 * S;
const LID_OPEN = 112;
const TILT = 26;
const YAW = -24;
const OPEN_X = 960;
const OPEN_Y = 700;
const LIGHT = ['#fff6c4', '#ffe27a', '#ffc13a', '#ffffff'];
const SRC = tex('entity/chest/normal.png');
const SHEET: [number, number] = [64, 64];

const LID = boxUV(0, 0, 14, 5, 14);
const BASE = boxUV(0, 19, 14, 10, 14);
const LATCH = boxUV(0, 0, 2, 4, 1);

const Chest: FC<{glow: number; seam: number; theta: number}> = ({glow, seam, theta}) => {
  const inside = (a: number) => `radial-gradient(ellipse at 50% 50%, rgba(255,252,222,${a}) 0%, rgba(255,214,90,${a * 0.9}) 45%, rgba(255,160,40,${a * 0.5}) 100%)`;
  return (
    <>
      <TexBox
        src={SRC}
        sheet={SHEET}
        w={14}
        h={10}
        d={14}
        s={S}
        style={{transform: `translate3d(0, ${BH / 2}px, 0)`}}
        faces={{
          front: {
            rect: BASE.front,
            shade: 0.02,
            children: <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: `rgba(255,236,150,${seam})`, boxShadow: `0 0 36px 14px rgba(255,214,90,${seam})`}} />,
          },
          left: {rect: BASE.left, shade: 0.34},
          right: {rect: BASE.right, shade: 0.18},
          back: {rect: BASE.back, shade: 0.5},
          top: {rect: BASE.top, children: <div style={{position: 'absolute', inset: 0, background: inside(0.85 * glow)}} />},
        }}
      />
      {/* lid, hinged along the back top edge of the base */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translate3d(0, 0, ${-D / 2}px) rotateX(${theta}deg)`}}>
        <TexBox
          src={SRC}
          sheet={SHEET}
          w={14}
          h={5}
          d={14}
          s={S}
          style={{transform: `translate3d(0, ${-LH / 2}px, ${D / 2}px)`}}
          faces={{
            front: {rect: LID.front, shade: 0.02},
            left: {rect: LID.left, shade: 0.34},
            right: {rect: LID.right, shade: 0.18},
            back: {rect: LID.back, shade: 0.5},
            top: {rect: LID.top},
            bottom: {rect: LID.bottom, shade: 0.12, children: <div style={{position: 'absolute', inset: 0, background: inside(0.4 * glow)}} />},
          }}
        />
        <TexBox
          src={SRC}
          sheet={SHEET}
          w={2}
          h={4}
          d={1}
          s={S}
          style={{transform: `translate3d(0, ${S}px, ${D + S / 2}px)`}}
          faces={{
            front: {rect: LATCH.front},
            left: {rect: LATCH.left, shade: 0.3},
            right: {rect: LATCH.right, shade: 0.2},
            top: {rect: LATCH.top},
            bottom: {rect: LATCH.bottom, shade: 0.3},
          }}
        />
      </div>
    </>
  );
};

const LOOT = [
  {id: 'diamond', dx: -230, rise: 430, delay: 0.0, rot: -16},
  {id: 'emerald', dx: 20, rise: 520, delay: 0.015, rot: 10},
  {id: 'gold_ingot', dx: 250, rise: 410, delay: 0.03, rot: 18},
];

const Overlay: FC<{p: number}> = ({p}) => {
  const f = Math.round(p * T);
  const rise = 1 - EASE.out(win(p, 0.02, 0.2));
  const land = win(p, 0.19, 0.3);
  const squash = land > 0 && land < 1 ? Math.sin(land * Math.PI) * Math.exp(-land * 2) : 0;
  const sink = EASE.in(win(p, 0.5, 0.6));
  const [sx, sy] = jitter(f, p > 0.19 && p < 0.26 ? 10 * (1 - win(p, 0.19, 0.26)) : p > 0.26 && p < 0.38 ? 3 * win(p, 0.26, 0.38) : 0, 6);
  const trembling = p > 0.26 && p < 0.38;
  const lidTrem = trembling ? 5 * win(p, 0.26, 0.38) + Math.sin(f * 2.1) * 1.2 : 0;
  const open = ewin(p, 0.38, 0.52, EASE.back);
  const theta = p < 0.38 ? lidTrem : mix(5, LID_OPEN, open);
  const glow = ewin(p, 0.3, 0.5, EASE.out);
  const seam = ewin(p, 0.26, 0.4, EASE.out) * (p < 0.38 ? 1 : 1 - win(p, 0.38, 0.46));
  const lightOn = ewin(p, 0.38, 0.46, EASE.out) * (1 - win(p, 0.6, 0.74));
  const flood = ewin(p, 0.44, 0.56, EASE.inOut) * (1 - ewin(p, 0.6, 0.82, EASE.out));
  const fade = 1 - win(p, 0.8, 0.9);
  const stageY = rise * 1300 + sink * 1300;
  return (
    <AbsoluteFill style={{opacity: fade, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, rgba(30,14,4,0.05) 15%, rgba(8,3,0,0.9) 100%)', opacity: win(p, 0.0, 0.14) * (1 - win(p, 0.56, 0.7))}} />
      {/* the chest, in real 3D */}
      {p < 0.62 && (
        <div style={{position: 'absolute', left: OPEN_X + sx, top: OPEN_Y + sy, width: 0, height: 0, perspective: 3000, perspectiveOrigin: `0px ${HEIGHT / 2 - OPEN_Y}px`}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translateY(${stageY}px) rotateX(${-TILT}deg) rotateY(${YAW}deg) scale(${1 + squash * 0.03}, ${1 - squash * 0.06})`}}>
            <Chest glow={glow} seam={seam} theta={theta} />
          </div>
        </div>
      )}
      {/* light column out of the opening: soft at the base, fading upward */}
      <div style={{position: 'absolute', left: OPEN_X - 760, top: OPEN_Y - 1000, width: 1520, height: 1000, opacity: lightOn * 0.85, WebkitMaskImage: 'linear-gradient(0deg, transparent 0%, #000 38%)'}}>
        <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(36% 100%, 64% 100%, 100% 0, 0 0)', background: 'linear-gradient(0deg, rgba(255,246,196,0.95), rgba(255,226,122,0.45) 50%, rgba(255,226,122,0) 100%)', mixBlendMode: 'screen', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 24%, #000 76%, transparent 100%)'}} />
      </div>
      {/* loot popping out */}
      {LOOT.map((l, i) => {
        const k = win(p, 0.43 + l.delay, 0.66 + l.delay);
        if (k <= 0 || k >= 1) return null;
        const up = EASE.out(k);
        const size = 128;
        return <Img key={i} src={item(l.id)} style={{position: 'absolute', left: OPEN_X + l.dx * up - size / 2, top: OPEN_Y - 60 - l.rise * up - size / 2 + 120 * k * k, width: size, height: size, imageRendering: 'pixelated', transform: `rotate(${l.rot * up}deg) scale(${0.5 + 0.7 * EASE.back(Math.min(1, k * 3))})`, opacity: 1 - win(k, 0.75, 1), filter: 'drop-shadow(8px 8px 0 rgba(60,30,0,0.45))'}} />;
      })}
      {/* flood: the whole frame fills with warm light (a plain gradient, no ring) */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${(OPEN_X / WIDTH) * 100}% ${(OPEN_Y / HEIGHT) * 100}%, #ffffff 0%, #fff6c4 45%, #ffe27a 85%, #ffd25a 100%)`, opacity: flood}} />
      {/* particles */}
      <SquareBurst p={p} T={T} p0={0.19} x={OPEN_X - 340} y={1040} count={20} colors={['#6b4a2a', '#8a6238', '#c9a56a', '#4a3320']} speed={18} life={26} size={28} gravity={0.5} seed={11} arc={[190, 300]} />
      <SquareBurst p={p} T={T} p0={0.19} x={OPEN_X + 340} y={1040} count={20} colors={['#6b4a2a', '#8a6238', '#c9a56a', '#4a3320']} speed={18} life={26} size={28} gravity={0.5} seed={12} arc={[240, 350]} />
      <SquareBurst p={p} T={T} p0={0.4} x={OPEN_X} y={OPEN_Y - 20} count={100} colors={LIGHT} speed={34} life={40} size={20} gravity={0.25} seed={21} arc={[205, 335]} />
      {Array.from({length: 14}, (_, i) => {
        const r = mulberry32(40 + i);
        const p0 = 0.4 + r() * 0.12;
        const age = (p - p0) * T;
        if (age < 0 || age > 30) return null;
        const x = OPEN_X + (r() - 0.5) * 700 + (r() - 0.5) * age * 8;
        const y = OPEN_Y - age * (14 + r() * 22);
        const size = 48 + Math.floor(r() * 3) * 16;
        const k = Math.sin((age / 30) * Math.PI);
        return <Img key={i} src={tex('particle/glint.png')} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, imageRendering: 'pixelated', opacity: k, filter: 'brightness(0) invert(1) drop-shadow(0 0 10px #ffd25a)', transform: `scale(${0.4 + k})`}} />;
      })}
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(0, 1 - Math.abs(p - 0.4) / 0.03) * 0.5}} />
    </AbsoluteFill>
  );
};

const ORIGIN = `${OPEN_X}px ${OPEN_Y}px`;

export const chestOpenDef: TransitionDef & {mode: 'dual'} = {
  id: 't2-chest-open',
  name: '箱子开盖',
  frames: T,
  mode: 'dual',
  a: (p) => {
    const dim = ewin(p, 0.0, 0.2);
    const suck = ewin(p, 0.4, 0.56, EASE.inOut);
    if (p > 0.56) return {opacity: 0};
    return {transformOrigin: ORIGIN, transform: `scale(${1 - 0.97 * suck}) rotate(${suck * 40}deg)`, filter: `brightness(${1 - 0.6 * dim + 1.3 * suck}) blur(${suck * 10}px) saturate(${1 - 0.3 * dim})`};
  },
  b: (p) => {
    if (p < 0.54) return {opacity: 0};
    const e = ewin(p, 0.54, 0.84, EASE.out);
    return {transformOrigin: ORIGIN, opacity: Math.min(1, e * 4), transform: `scale(${mix(0.02, 1, e)}) rotate(${(1 - e) * -14}deg)`, filter: `brightness(${1 + (1 - e) * 1.0})`, boxShadow: `0 0 ${200 * (1 - e)}px ${60 * (1 - e)}px rgba(255,226,140,0.9)`};
  },
  overlay: Overlay,
  cues: [
    {at: 15, src: 'mc:dig/wood1', volume: 0.7, rate: 0.55},
    {at: 15, src: 'mc:random/anvil_land', volume: 0.3, rate: 0.7},
    {at: 21, src: 'mc:dig/wood1', volume: 0.3, rate: 1.0},
    {at: 24, src: 'mc:dig/wood1', volume: 0.3, rate: 1.2},
    {at: 29, src: 'mc:block/chest/open', volume: 0.75, rate: 0.9},
    {at: 31, src: 'mc:random/levelup', volume: 0.4, rate: 1.1},
    {at: 42, src: 'mc:random/orb', volume: 0.35, rate: 1.0},
    {at: 50, src: 'mc:random/orb', volume: 0.3, rate: 1.4},
  ],
};

export const chestOpen = transitionEntry(chestOpenDef, {
  id: 't2-chest-open',
  name: '箱子开盖',
  category: 'transition',
  tags: ['箱子', '宝箱', '金光', '质感', '惊喜', '开箱'],
  blurb: '游戏原版箱子贴图拼成的 3D 木箱从画面下方升起落地，缝隙漏出金光，箱盖绕后铰链掀开，光柱冲天，宝物弹出；原画面被吸进箱口，金光铺满屏幕后下一幕从光里展开。',
  usage: '开箱 / 获得奖励 / 揭晓答案 / 战利品展示前的转场。',
  params: [
    {name: 'S', desc: '每个贴图像素的屏幕大小，默认 36（箱子宽 504px）'},
    {name: 'LID_OPEN / TILT / YAW', desc: '箱盖最大开角、俯视角、箱子偏转角'},
    {name: 'OPEN_X / OPEN_Y', desc: '箱口位置，A 被吸入、B 展开的中心点'},
    {name: 'LIGHT / LOOT', desc: '光的配色与弹出的物品'},
  ],
});
