import {type FC, type ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT} from '../../flat';
import {At, Glint, HEART_PINK, INK, ItemSp, Label, Mob, Odometer, Orn, Particles, STAR_BIG, Sp, Stage, Sunburst, bob, chunky, lerp, makeBurst, rangeP, spring, useList, wobble} from './common';

/**
 * soc-favorite: a toy "collection box". Enchanted books, stars, diamonds and XP bottles fly in on arcs and drop into
 * the open box (it dips on each catch and a pixel glint flashes at the opening); then the lid slams shut, the star on
 * the front lights up gold, glitter and a pixel cross flash burst out and a "已收藏" tag pops. Corners hold floating enchanted books.
 * Props: bg, count (收藏数 before), closeAt (frame the lid slams shut), gifts (override the schedule: [{kind: book|star|diamond|xp, from:[x,y], land, h}]),
 * label (counter caption), tagText (tag after closing), audio (play the sound effects).
 */

export type Gift = {kind: 'book' | 'star' | 'diamond' | 'xp'; from: [number, number]; land: number; h: number};
export const DEFAULT_GIFTS: Gift[] = [
  {kind: 'book', from: [-160, 300], land: 30, h: 360},
  {kind: 'star', from: [2080, 220], land: 46, h: 300},
  {kind: 'diamond', from: [-160, 900], land: 60, h: 460},
  {kind: 'xp', from: [2080, 860], land: 72, h: 380},
];

const GiftImg: FC<{kind: Gift['kind']; spin: number}> = ({kind, spin}) => {
  if (kind === 'star') return <Sp s={STAR_BIG} k="star" px={9} drop={1} />;
  const id = kind === 'book' ? 'enchanted_book' : kind === 'diamond' ? 'diamond' : 'experience_bottle';
  void spin;
  return <ItemSp id={id} size={124} />;
};

const BoxPart: FC<{children?: ReactNode; style: React.CSSProperties}> = ({children, style}) => <div style={{position: 'absolute', ...style}}>{children}</div>;

export const FavoriteFx: FC<{bg?: boolean; count?: number; closeAt?: number; gifts?: Gift[]; label?: string; tagText?: string; audio?: boolean}> = ({bg, count = 2048, closeAt = 86, gifts = DEFAULT_GIFTS, label = '收藏', tagText = '已收藏', audio = true}) => {
  const f = useCurrentFrame();
  const BX = 960;
  const TOP = 540; // screen y of the body's top edge
  const FLIGHT = 22;

  const catches = useList(() => gifts.flatMap((g, i) => makeBurst({seed: 51 + i, at: g.land, x: BX, y: TOP - 40, n: 14, kinds: ['spark:#ffffff', 'spark:#d9c8ff', 'spark:#ffd23f', 'sq:#8f6bff'], speed: [8, 22], angle: [-170, -10], life: [24, 40], g: 0.6, size: [28, 54], spin: 12})));
  const glitter = useList(() => makeBurst({seed: 60, at: closeAt, x: BX, y: TOP, n: 56, kinds: ['star', 'spark:#ffffff', 'spark:#d9c8ff', 'spark:#ffd23f', 'heartP', 'sq:#8f6bff', 'item:enchanted_book'], speed: [18, 52], life: [46, 82], g: 0.38, size: [40, 92], spin: 16}));
  const floaty = useList(() => makeBurst({seed: 61, at: closeAt + 8, x: 960, y: 1130, n: 22, kinds: ['spark:#d9c8ff', 'star', 'spark:#ffffff', 'heartP'], speed: [12, 26], angle: [-100, -80], life: [60, 100], g: 0.2, drag: 0.96, size: [34, 80], stagger: 40, spread: 1900}));

  const ambient = useList(() => makeBurst({seed: 62, at: 4, x: 960, y: 1150, n: 22, kinds: ['spark:#d9c8ff', 'spark:#ffffff', 'star', 'heartP'], speed: [10, 22], angle: [-100, -80], life: [80, 130], g: 0.12, drag: 0.97, size: [30, 70], stagger: 110, spread: 1900}));

  // box dynamics
  let dip = 0;
  let jel = 0;
  let caught = 0;
  gifts.forEach((g) => {
    const d = f - g.land;
    if (d >= 0) {
      dip += Math.exp(-d / 4) * 0.08;
      jel += wobble(f, g.land, 14, 2.5) * 0.08;
      caught += 1;
    }
  });
  const closed = f >= closeAt;
  const slam = wobble(f, closeAt, 22, 3);
  const grow = spring(f, 0, 22);
  const open = rangeP(f, 8, 16, EASE.back);
  // lid angle: opens early, hangs open, slams shut at closeAt
  const lidOpen = 112;
  const ang = f < closeAt - 8 ? -lidOpen * open : f < closeAt ? -lidOpen * (1 - EASE.in((f - (closeAt - 8)) / 8)) : Math.max(0, -slam * 10);
  const lit = spring(f, closeAt + 2, 18);
  const tag = spring(f, closeAt + 12, 20);
  const idle = bob(f, 60, 6);
  const sx = 1 + dip * 0.4 - jel + slam * 0.1;
  const sy = 1 - dip * 0.45 + jel * 1.2 - slam * 0.14;

  return (
    <Stage bg={bg} variant="ore" tone="purple">
      <Sunburst x={BX} y={TOP} alpha={0.1 + (closed ? 0.18 : 0.04 * caught)} color="217,200,255" rays={16} spin={0.35} scale={closed ? 1 : 0.6} />

      <At x={BX} y={TOP + 252 + idle + dip * 40} s={grow * 1.4} sx={sx} sy={sy} origin="50% 100%">
        <div style={{position: 'relative', width: 520, height: 280, perspective: 1100, perspectiveOrigin: '50% 0%'}}>
          {/* inside wall */}
          <BoxPart style={{left: 20, top: -150, width: 480, height: 190, ...chunky('#3a2a78', '#2b1d5e', '#4b3a95', {r: 26, b: 8, sh: 0, band: 10})}} />
          {/* gifts that already dropped in are hidden behind the front; flights are drawn below */}
          {/* body */}
          <BoxPart style={{left: 0, top: 0, width: 520, height: 280, zIndex: 3, ...chunky(FLAT.teal, '#22a39d', '#8ff0ea', {r: 34, b: 10, sh: 16, band: 18})}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 70, height: 14, background: 'rgba(43,35,56,0.28)'}} />
            <div style={{position: 'absolute', left: 150, right: 150, top: 106, bottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{transform: `scale(${closed ? 1 + lit * 0.0 : 1})`, filter: closed ? undefined : 'grayscale(1) brightness(1.5)', opacity: closed ? 1 : 0.55}}>
                <Sp s={STAR_BIG} k="star" px={closed ? 10 + (lit - 1) * 0 : 10} drop={1} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 36, top: 26, width: 18, height: 18, borderRadius: 9, background: '#fff', opacity: 0.5}} />
          </BoxPart>
          {/* lid */}
          <BoxPart style={{left: -14, top: -150, width: 548, height: 150, zIndex: 4, transformOrigin: '50% 0%', transform: `rotateX(${ang}deg)`, ...chunky(FLAT.purple, FLAT.purpleDeep, '#b49cff', {r: 30, b: 10, sh: 0, band: 16})}}>
            <div style={{position: 'absolute', left: '50%', bottom: 16, width: 76, height: 38, marginLeft: -38, borderRadius: 12, background: FLAT.yellow, border: `6px solid ${INK}`, boxSizing: 'border-box'}} />
          </BoxPart>
        </div>
      </At>

      {/* flights: drawn before the body for the final segment would need a clip; we fade + shrink into the opening instead */}
      {gifts.map((g, i) => {
        const t0 = g.land - FLIGHT;
        if (f < t0 || f > g.land + 3) return null;
        const u = clamp01((f - t0) / FLIGHT);
        const tx = BX;
        const ty = TOP - 120;
        const x = lerp(g.from[0], tx, EASE.inOut(u) * 0.45 + u * 0.55);
        const y = lerp(g.from[1], ty, u) - 4 * g.h * u * (1 - u);
        const sc = 1 - 0.45 * EASE.in(u);
        const out = 1 - rangeP(f, g.land - 1, 4, EASE.in);
        return (
          <div key={i}>
            {[4, 3, 2, 1].map((k) => {
              const uu = u - k * 0.05;
              if (uu < 0) return null;
              const gx = lerp(g.from[0], tx, EASE.inOut(uu) * 0.45 + uu * 0.55);
              const gy = lerp(g.from[1], ty, uu) - 4 * g.h * uu * (1 - uu);
              return (
                <At key={k} x={gx} y={gy} o={0.13 * (5 - k)} s={sc * 0.9} rot={uu * 540}>
                  <GiftImg kind={g.kind} spin={uu} />
                </At>
              );
            })}
            <At x={x} y={y} rot={u * 540} s={sc * out} z={2}>
              <GiftImg kind={g.kind} spin={u} />
            </At>
          </div>
        );
      })}

      <Particles list={ambient} />
      {/* catch effects */}
      <Particles list={catches} />
      {gifts.map((g, i) => (
        <div key={i}>
          <Shockwave x={BX} y={TOP - 40} at={g.land} color={[FLAT.lilac, FLAT.yellow, FLAT.sky, FLAT.mint][i % 4]} maxR={300} life={16} width={16} rays={10} seed={i + 4} />
          <Glint x={BX + [-90, 90, -60, 70][i % 4]} y={TOP - 120 + [-20, 10, 30, -10][i % 4]} at={g.land} size={150} color={i % 2 ? '#ffffff' : '#fff2a8'} life={12} rot={i * 8} />
          {audio && <Sfx at={g.land} src={mcSound('random/orb')} volume={0.45} rate={1.1 + i * 0.2} />}
          {audio && <Sfx at={g.land - FLIGHT + 2} src={mcSound('random/pop')} volume={0.16} rate={1.4} />}
        </div>
      ))}
      {audio && <Sfx at={8} src={mcSound('block/chest/open')} volume={0.3} rate={1.4} />}

      {/* slam */}
      <Shockwave x={BX} y={TOP + 30} at={closeAt} color="#ffffff" maxR={560} life={24} width={24} rays={16} seed={11} />
      <Shockwave x={BX} y={TOP + 30} at={closeAt + 3} color={FLAT.yellow} maxR={780} life={28} width={18} rays={12} seed={12} />
      <Particles list={glitter} />
      <Particles list={floaty} />
      {audio && <Sfx at={closeAt - 1} src={mcSound('dig/wood1')} volume={0.7} rate={0.8} />}
      {audio && <Sfx at={closeAt} src={mcSound('random/anvil_land')} volume={0.18} rate={1.6} />}
      {audio && <Sfx at={closeAt + 3} src={mcSound('random/levelup')} volume={0.3} rate={1.3} />}
      {audio && <Sfx at={closeAt + 12} src={mcSound('ui/toast/in')} volume={0.3} rate={1.2} />}

      {/* "已收藏" tag + counter */}
      <At x={BX} y={TOP - 345 + (1 - tag) * 40} s={tag * 1.3} rot={-2}>
        <div style={{...chunky(FLAT.purple, FLAT.purpleDeep, '#b49cff', {r: 60, b: 10, sh: 14, band: 14}), padding: '0 46px', height: 124, display: 'flex', alignItems: 'center', gap: 20}}>
          <Sp s={STAR_BIG} k="star" px={6} drop={1} />
          <Label size={68} color="#ffffff">{tagText}</Label>
        </div>
      </At>
      <At x={1590} y={TOP + 300} s={spring(f, 14, 20)} sx={1 + slam * 0.06}>
        <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 56, b: 8, sh: 12, band: 10}), height: 120, padding: '0 34px', display: 'flex', alignItems: 'center', gap: 16}}>
          <Label size={44} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{label}</Label>
          <Odometer value={count + (closed ? clamp01((f - closeAt - 4) / 6) : 0)} digits={4} size={72} color={FLAT.purple} />
        </div>
      </At>

      {/* border decor */}
      <Orn x={330} y={985} at={10} rot={-6} bobAmp={8}><Mob k="slime" scale={14} drop={8} /></Orn>
      <Orn x={1590} y={985} at={14} rot={6} bobAmp={8} period={46}><Mob k="pig" scale={14} drop={8} /></Orn>
      <Orn x={120} y={130} at={12} rot={-16} bobAmp={12}><ItemSp id="enchanted_book" size={150} /></Orn>
      <Orn x={1800} y={140} at={18} rot={14} bobAmp={12} period={56}><Sp s={STAR_BIG} k="star" px={12} drop={2} /></Orn>
      <Orn x={120} y={940} at={24} rot={12} bobAmp={14} period={60}><Sp s={STAR_BIG} k="star" px={10} drop={2} /></Orn>
      <Orn x={1800} y={940} at={30} rot={-14} bobAmp={14} period={52}><ItemSp id="enchanted_book" size={140} /></Orn>
      <Orn x={90} y={540} at={36} rot={-8} bobAmp={16}><Sp s={HEART_PINK} k="hp" px={8} drop={1} /></Orn>
      <Orn x={1830} y={560} at={40} rot={8} bobAmp={16} period={48}><ItemSp id="diamond" size={92} /></Orn>
      <Orn x={560} y={90} at={44} rot={6} bobAmp={8}><ItemSp id="experience_bottle" size={84} /></Orn>
      <Orn x={1380} y={980} at={48} rot={-6} bobAmp={8}><Sp s={STAR_BIG} k="star" px={7} drop={1} /></Orn>
    </Stage>
  );
};

export const favoriteEntry: FxEntry = {
  meta: {
    id: 'soc-favorite',
    name: '收藏 · 附魔书入箱',
    category: 'social',
    tags: ['收藏', '附魔书', '星星', '互动', '合上'],
    frames: 135,
    blurb: '附魔书、星星、钻石、经验瓶从四边飞进一只张着盖子的收藏箱，每接住一个就闪一下星光；盖子猛地合上，前面的星星亮成金色，闪光四溅，弹出“已收藏”。',
    usage: '提醒收藏、稍后再看、存档合集时；Layer 透明背景可直接叠在素材上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景（Ore 紫色虚化底）'},
      {name: 'count', desc: '收藏数，合上后 +1'},
      {name: 'closeAt', desc: '盖子合上的帧，默认 86'},
    ],
  },
  Demo: () => <FavoriteFx bg />,
  Layer: () => <FavoriteFx />,
};
