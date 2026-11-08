import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {tex, item as itemTex, block as blockTex} from '../../../mc/assets';
import {Crop} from '../../mob';
import {Checker, Polka, Rays, Sprinkle, W, H, INK, lerp, outBack, outCubic, inCubic, inOutCubic, seg, rnd} from './kit';
import {Chips, Flare, Smoke} from './impact';

/**
 * cute-chest-pop: a vanilla chest (real entity texture) hops up from the bottom and opens; shot A shrinks, spins and gets
 * sucked inside; the lid slams shut (squash + dust) and rattles; then it bursts open with a fountain of real item textures
 * (diamond, golden apple, book, sword...) and shot B pops out of it and grows to full frame.
 * No text: the lid, the rattle, the dust, the light and the items carry the story.
 * Dual-type: A and B are transformed; the overlay draws a sky-blue backdrop with holes cut out exactly where A / B are
 * (so the backdrop is never drawn over them), the chest, rays and the item fountain.
 * Tunables: POP (frame of the second opening), BY (top edge of the chest base, px), PXC (chest pixel size, 36 = 504px wide).
 */

const T = 66;
const POP = 38;
const CX = W / 2;
const BY = 690;
const PXC = 36;
const MOUTH_Y = BY - 30;
const CW = 14 * PXC; // chest width
const LID_H = 5 * PXC;
const BASE_H = 10 * PXC;
const IN_H = Math.round(CW * 0.28); // interior seen from above, foreshortened
const CHEST = 'entity/chest/normal.png';

type Pose = {x: number; y: number; rot: number; s: number};

const poseA = (t: number): Pose => {
  const wind = -4 * Math.sin(seg(t, 4, 12) * Math.PI);
  const p1 = inOutCubic(seg(t, 12, 21));
  const p2 = inCubic(seg(t, 21, 27));
  return {x: 0, y: lerp(0, -90, p1) + lerp(0, 390, p2), rot: lerp(wind, 300, p1) + 240 * p2, s: lerp(1, 0.34, p1) - 0.22 * p2};
};

const poseB = (t: number): Pose => {
  if (t < POP) return {x: 0, y: 90, rot: -540, s: 0.0001};
  const e = outBack(seg(t, POP, POP + 15), 1.7);
  return {x: 0, y: lerp(90, 0, e), rot: -360 * (1 - Math.min(1, e)) * (1 - Math.min(1, e)), s: Math.max(0.0001, lerp(0.1, 1, e))};
};

const tf = (p: Pose): CSSProperties => ({transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${p.s})`});

const quad = (p: Pose): string => {
  const cx = W / 2 + p.x;
  const cy = H / 2 + p.y;
  const hw = (W / 2) * p.s;
  const hh = (H / 2) * p.s;
  const a = (p.rot * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const pts = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ].map(([x, y]) => `${(cx + x * c - y * s).toFixed(1)}px ${(cy + x * s + y * c).toFixed(1)}px`);
  return `${pts.join(',')},${pts[0]}`;
};

/** 0 closed .. 1 open. */
const lidOpen = (t: number) => {
  if (t < 25) return outBack(seg(t, 10, 17), 2.2);
  if (t < POP) return 1 - inCubic(seg(t, 25, 29));
  return outBack(seg(t, POP, POP + 6), 2.6);
};

const outline = (o: number) => `drop-shadow(${o}px 0 0 ${INK}) drop-shadow(${-o}px 0 0 ${INK}) drop-shadow(0 ${o}px 0 ${INK}) drop-shadow(0 ${-o}px 0 ${INK})`;

const Chest: FC<{t: number}> = ({t}) => {
  const open = Math.max(0, lidOpen(t));
  const rise = outBack(seg(t, 0, 9), 1.6);
  const sink = inCubic(seg(t, 55, 63));
  const rattleAmp = t >= 29 && t < POP ? seg(t, 29, POP) * 14 : 0;
  const jump = t >= POP - 3 && t < POP + 5 ? Math.sin(seg(t, POP - 3, POP + 5) * Math.PI) * -46 : 0;
  const off = (1 - rise) * 760 + sink * 760 + jump;
  const dx = Math.sin(t * 3.3) * rattleAmp;
  const rot = Math.sin(t * 2.7) * rattleAmp * 0.18;
  const sq = t >= 25 && t < 33 ? Math.exp(-(t - 25) * 0.5) * Math.cos((t - 25) * 1.2) : 0;
  const raise = 108 * open;
  const lidScale = 1 - 0.6 * open;
  const src = tex(CHEST);
  const underside = Math.min(1, Math.max(0, (open - 0.35) / 0.4));
  return (
    <div style={{position: 'absolute', left: CX + dx, top: BY + off, width: 0, height: 0, transform: `rotate(${rot}deg) scale(${1 + 0.05 * sq}, ${1 - 0.07 * sq})`, transformOrigin: `0 ${BASE_H}px`, zIndex: 10}}>
      <div style={{position: 'absolute', left: -350, top: BASE_H + 10, width: 700, height: 60, background: 'rgba(43,35,56,0.28)', clipPath: 'polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)'}} />
      {/* glow behind the opening */}
      {open > 0.02 && <div style={{position: 'absolute', left: -470, top: -470, width: 940, height: 560, background: 'radial-gradient(ellipse at 50% 100%, rgba(255,246,170,0.95), rgba(255,246,170,0) 68%)', opacity: open}} />}
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, filter: outline(7)}}>
        <Crop src={src} sheet={[64, 64]} rect={[14, 33, 14, 10]} scale={PXC} style={{position: 'absolute', left: -CW / 2, top: 0}} />
        {open > 0.02 && (
          <div style={{position: 'absolute', left: -CW / 2, top: -IN_H, width: CW, height: IN_H, overflow: 'hidden'}}>
            <Crop src={src} sheet={[64, 64]} rect={[14, 19, 14, 14]} scale={PXC} style={{transform: 'scaleY(0.28)', transformOrigin: '0 0'}} />
            <div style={{position: 'absolute', left: PXC, right: PXC, top: Math.round(IN_H * 0.2), bottom: 0, background: '#1d0e05', boxShadow: `inset 0 ${PXC / 2}px 0 #3a1d0b, inset 0 -${PXC / 2}px 0 #6b3f1d`}} />
          </div>
        )}
        {underside > 0 && (
          <div style={{position: 'absolute', left: -CW / 2, top: -IN_H - IN_H * 0.9 * underside, width: CW, height: IN_H, overflow: 'hidden', filter: 'brightness(0.55) saturate(1.2)'}}>
            <Crop src={src} sheet={[64, 64]} rect={[28, 0, 14, 14]} scale={PXC} style={{transform: 'scaleY(0.28)', transformOrigin: '0 0'}} />
          </div>
        )}
        {underside < 1 && (
          <div style={{position: 'absolute', left: -CW / 2, top: -LID_H, transformOrigin: '50% 100%', transform: `translateY(${-raise}px) scaleY(${lidScale})`, opacity: 1 - underside}}>
            <Crop src={src} sheet={[64, 64]} rect={[14, 14, 14, 5]} scale={PXC} />
          </div>
        )}
        {open < 0.08 && <Crop src={src} sheet={[64, 64]} rect={[1, 1, 2, 4]} scale={PXC} style={{position: 'absolute', left: -PXC, top: -3 * PXC}} />}
      </div>
    </div>
  );
};

const ITEMS = [
  itemTex('diamond'),
  itemTex('golden_apple'),
  itemTex('enchanted_book'),
  itemTex('diamond_sword'),
  itemTex('emerald'),
  itemTex('totem_of_undying'),
  itemTex('experience_bottle'),
  itemTex('bread'),
  itemTex('iron_pickaxe'),
  itemTex('gold_ingot'),
  blockTex('gold_block'),
  blockTex('diamond_block'),
];

/** Real item / block textures shot out of the chest mouth: ballistic arcs with a little spin. */
const Fountain: FC<{t: number; at: number; count: number; seed: number}> = ({t, at, count, seed}) => {
  if (t < at || t > at + 56) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const r = rnd(seed * 97 + i * 19 + 3);
        const ang = ((-132 + r() * 84) * Math.PI) / 180;
        const sp = 1500 + r() * 1700;
        const a = t - at - r() * 3;
        const life = 44 + r() * 8;
        if (a < 0 || a > life) return null;
        const tau = a / 30;
        const k = (1 - Math.exp(-0.9 * tau)) / 0.9;
        const x = CX + Math.cos(ang) * sp * k;
        const y = MOUTH_Y + Math.sin(ang) * sp * k + 0.5 * 2700 * tau * tau;
        const px = [5, 6, 7, 8][Math.floor(r() * 4)];
        const sc = Math.min(1, a / 3) * (a > life - 6 ? (life - a) / 6 : 1);
        const spin = (r() - 0.5) * 540 * tau;
        const tex0 = ITEMS[Math.floor(r() * ITEMS.length)];
        return (
          <div key={i} style={{position: 'absolute', left: Math.round(x - (16 * px) / 2), top: Math.round(y - (16 * px) / 2), width: 16 * px, height: 16 * px, transform: `rotate(${spin}deg) scale(${sc})`, filter: outline(5)}}>
            <Img src={tex0} style={{width: '100%', height: '100%', imageRendering: 'pixelated'}} />
          </div>
        );
      })}
    </div>
  );
};

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const holes = t < POP - 8 ? quad(poseA(t)) : quad(poseB(t));
  const outer = `0px 0px,${W}px 0px,${W}px ${H}px,0px ${H}px,0px 0px`;
  const showBackdrop = t < POP + 20;
  const rays = Math.max(0, seg(t, 10, 17) * (1 - seg(t, 25, 29))) * 0.5 + seg(t, POP, POP + 4) * (1 - seg(t, 46, 54)) * 0.45;
  return (
    <AbsoluteFill>
      {showBackdrop && (
        <div style={{position: 'absolute', inset: 0, clipPath: `polygon(evenodd, ${outer},${holes},${outer.split(',')[0]})`, overflow: 'hidden'}}>
          <Checker a="#8fd3ff" b="#a6dcff" size={80} x={t * 2.5} y={t * 1.5} />
          <Polka color="rgba(255,255,255,0.35)" size={160} r={16} x={-t * 2} y={t * 2} />
          <Sprinkle t={t} at={8} dur={52} seed={81} count={14} kinds={['star', 'spark']} px={[3, 5]} z={1} />
        </div>
      )}
      {rays > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: rays, zIndex: 8, mixBlendMode: 'screen'}}>
          <Rays a="rgba(255,244,160,0.85)" b="rgba(255,244,160,0)" rot={t * 3} n={14} cx={CX} cy={MOUTH_Y} />
        </div>
      )}
      <Chest t={t} />
      {/* A is sucked in: pixel streaks converge on the open mouth */}
      <Chips t={t} at={13} x={CX} y={MOUTH_Y - 60} count={14} seed={84} colors={['#ffffff', FLAT.sky, FLAT.yellow]} life={14} speed={[500, 1100]} angle={[-150, -30]} gravity={-300} size={[1, 2]} spread={260} z={21} />
      {/* lid slams shut: dust off both sides of the base and wood chips */}
      <Smoke t={t} at={26} x={CX - 280} y={BY + BASE_H - 20} count={4} seed={85} dur={16} spread={60} drift={[300, 700]} rise={10} flatY={0.4} px={10} grow={[0.8, 1.6]} z={22} />
      <Smoke t={t} at={26} x={CX + 280} y={BY + BASE_H - 20} count={4} seed={86} dur={16} spread={60} drift={[300, 700]} rise={10} flatY={0.4} px={10} grow={[0.8, 1.6]} z={22} />
      <Chips t={t} at={26} x={CX} y={BY - 20} count={12} seed={87} colors={['#a4733b', '#7b4f2a', '#4a2c14', '#e0a84a']} life={18} speed={[500, 1100]} angle={[-170, -10]} gravity={2400} size={[1, 2]} spread={220} z={22} />
      {/* bursts open */}
      <Flare t={t} at={POP} x={CX} y={MOUTH_Y} color="#fff4a0" maxR={900} life={16} cell={12} rays={14} seed={88} z={24} />
      <Fountain t={t} at={POP} count={34} seed={82} />
      <Chips t={t} at={POP + 2} x={CX} y={MOUTH_Y} count={30} seed={83} colors={[FLAT.yellow, '#ffffff', FLAT.orange, '#fff4a0']} life={36} speed={[900, 2300]} angle={[-150, -30]} gravity={2300} size={[1, 3]} z={21} />
    </AbsoluteFill>
  );
};

export const chestPopDef: TransitionDef & {mode: 'dual'} = {
  id: 'cute-chest-pop',
  name: '箱子弹出',
  frames: T,
  mode: 'dual',
  a: (p) => tf(poseA(p * T)),
  b: (p) => ({...tf(poseB(p * T)), opacity: p * T < POP ? 0 : 1}),
  overlay: Overlay,
  cues: [
    {at: 8, src: 'mc:random/pop', volume: 0.4, rate: 0.9},
    {at: 11, src: 'mc:block/chest/open', volume: 0.5},
    {at: 14, src: 'mc:random/pop', volume: 0.35, rate: 1.3},
    {at: 20, src: 'mc:random/orb', volume: 0.3, rate: 0.9},
    {at: 27, src: 'mc:dig/wood1', volume: 0.6, rate: 0.7},
    {at: 31, src: 'mc:dig/wood1', volume: 0.4, rate: 1.0},
    {at: 34, src: 'mc:dig/wood1', volume: 0.45, rate: 1.2},
    {at: 36, src: 'mc:dig/wood1', volume: 0.5, rate: 1.4},
    {at: POP, src: 'mc:block/chest/open', volume: 0.6, rate: 0.8},
    {at: POP, src: 'mc:random/pop', volume: 0.6, rate: 0.8},
    {at: POP + 2, src: 'mc:random/levelup', volume: 0.3, rate: 1.4},
    {at: POP + 8, src: 'mc:random/orb', volume: 0.3, rate: 1.5},
    {at: POP + 12, src: 'mc:random/orb', volume: 0.3, rate: 1.8},
  ],
};

export const chestPopEntry = transitionEntry(chestPopDef, {
  id: 'cute-chest-pop',
  name: '箱子弹出',
  category: 'cute',
  tags: ['可爱', '箱子', '宝箱', '物品', '收纳', '转场', '像素', '原版贴图'],
  blurb: '一个原版贴图的箱子从画面底部蹦上来掀开盖子，旧画面缩小旋转着被吸进箱子里；盖子合上并扬起灰尘、剧烈抖动，然后猛地弹开，钻石、金苹果、附魔书、剑等原版物品贴图喷泉般冲出，新画面从箱子里弹出来放大到全屏。',
  usage: '开箱/掉落/收藏/背包类内容的转场，或者“装起来再拿出来”的整理、盘点、整合包切换。',
  params: [
    {name: 'POP', desc: '二次弹开的帧（默认 38）'},
    {name: 'BY', desc: '箱子底座上沿的 y 坐标（默认 690）'},
    {name: 'PXC', desc: '箱子一个贴图像素的屏幕尺寸（默认 36，箱子宽 504）'},
  ],
});
void outCubic;
void INK;
