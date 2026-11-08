import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT, RAINBOW, Sticker, type Sprite} from '../../flat';
import {At, Bunting, COIN, Explosion, HEART_BIG, HEART_PINK, Hand, INK, ItemSp, Label, Mob, Orn, Particles, STAR_BIG, Sp, Stage, Sunburst, THUMB, bob, chunky, confettiRain, disc, lerp, makeBurst, rangeP, spring, suckIn, track, useList, wobble} from './common';

/**
 * soc-triple: the grand finale. Three icons (like / coin / favourite) sit unlit; a hand long-presses the first one
 * (a pixel-segment charge frame + shaking + particles sucked in), the three light up in turn, spiral into a pixel
 * energy orb, and burst into a full-screen celebration: explosion sprites, sunburst, pixel cross flashes with shard
 * splashes, hearts / coins / books / emeralds / confetti in every direction, cannons in all four corners, a rainbow
 * ribbon with the "三连成功!" sticker, cheering real-texture mobs and bunting.
 * Props: bg, fireAt (frame the first icon fires, default 62), boomAt (default 118), caption (hint above the first icon), labels (3 icon captions),
 * title (big sticker), thanks (line under the title), audio (play the sound effects).
 */

type IconDef = {key: 'like' | 'coin' | 'fav'; label: string; fill: string; deep: string; light: string; glow: string};
const ICONS: IconDef[] = [
  {key: 'like', label: '点赞', fill: FLAT.pink, deep: FLAT.pinkDeep, light: '#ffa6c4', glow: FLAT.pink},
  {key: 'coin', label: '投币', fill: FLAT.orange, deep: '#e0701c', light: '#ffc27a', glow: FLAT.yellow},
  {key: 'fav', label: '收藏', fill: FLAT.purple, deep: FLAT.purpleDeep, light: '#b49cff', glow: FLAT.lilac},
];

const Glyph: FC<{k: IconDef['key']; lit: boolean}> = ({k, lit}) => {
  const style = lit ? undefined : {filter: 'grayscale(1) brightness(1.55)', opacity: 0.6};
  if (k === 'like') return <Sp s={THUMB} k="thumb" px={13} drop={1} style={style} />;
  if (k === 'coin') return <Sp s={COIN} k="coin" px={13} drop={1} style={style} />;
  return <Sp s={STAR_BIG} k="star" px={14} drop={1} style={style} />;
};

/** Big pixel energy orb (21 x 21): warm yellow core, orange rim, pale highlight (kept off pure white so it never blows out). */
const ORB_BIG: Sprite = disc(21, '#ffe27a', FLAT.orange, '#fff6c8');

/**
 * Long-press charge indicator: a square frame of pixel cells around the icon that fills clockwise from the top
 * centre as `p` goes 0..1 (turns yellow near the end). Cells are ink-outlined squares, so it stays pixel art.
 */
const ChargeFrame: FC<{cx: number; cy: number; p: number; shake: [number, number]}> = ({cx, cy, p, shake}) => {
  const HALF = 162; // half side of the frame, a bit outside the 270px icon
  const CELL = 18;
  const n = Math.round((HALF * 2) / CELL); // cells per side (even)
  const side = n * CELL;
  const cell = (i: number, j: number): [number, number] => [-side / 2 + i * CELL, -side / 2 + j * CELL];
  const pts: [number, number][] = [];
  // clockwise from the top centre
  for (let i = n / 2; i < n; i++) pts.push(cell(i, 0));
  for (let j = 1; j < n; j++) pts.push(cell(n - 1, j));
  for (let i = n - 2; i >= 0; i--) pts.push(cell(i, n - 1));
  for (let j = n - 2; j >= 0; j--) pts.push(cell(0, j));
  for (let i = 1; i < n / 2; i++) pts.push(cell(i, 0));
  const filled = Math.floor(pts.length * p);
  return (
    <div style={{position: 'absolute', left: cx + shake[0], top: cy + shake[1]}}>
      {pts.map(([x, y], i) => (
        <div
          key={i}
          style={{position: 'absolute', left: x, top: y, width: CELL, height: CELL, boxSizing: 'border-box', border: `3px solid ${INK}`, background: i < filled ? (p > 0.7 ? FLAT.yellow : '#ffffff') : 'rgba(43,35,56,0.35)'}}
        />
      ))}
    </div>
  );
};

export const TripleFx: FC<{bg?: boolean; fireAt?: number; boomAt?: number; caption?: string; labels?: [string, string, string]; title?: string; thanks?: string; audio?: boolean}> = ({
  bg,
  fireAt = 62,
  boomAt = 118,
  caption = '长按点赞 = 一键三连',
  labels = ['点赞', '投币', '收藏'],
  title = '三连成功!',
  thanks = '感谢支持，下期见！',
  audio = true,
}) => {
  const f = useCurrentFrame();
  const FIRE = [fireAt, fireAt + 8, fireAt + 16];
  const BOOM = boomAt;
  const SPIN0 = BOOM - 20;
  const CX = 960;
  const CY = 540;
  const BASE: [number, number][] = [[600, 560], [960, 560], [1320, 560]];
  const FINAL: [number, number][] = [[540, 850], [960, 880], [1380, 850]];

  // ----- particle lists
  const fireBursts = useList(() => [
    ...makeBurst({seed: 81, at: FIRE[0], x: BASE[0][0], y: BASE[0][1], n: 26, kinds: ['heart', 'heartP', 'spark:#ffffff', 'sq:#ff7aa8'], speed: [14, 36], life: [34, 56], g: 0.4, size: [40, 86], spin: 14}),
    ...makeBurst({seed: 82, at: FIRE[1], x: BASE[1][0], y: BASE[1][1], n: 26, kinds: ['coin', 'item:emerald', 'spark:#ffd23f', 'sq:#ffd23f'], speed: [14, 36], life: [34, 56], g: 0.5, size: [40, 86], spin: 14}),
    ...makeBurst({seed: 83, at: FIRE[2], x: BASE[2][0], y: BASE[2][1], n: 26, kinds: ['star', 'item:enchanted_book', 'spark:#d9c8ff', 'sq:#8f6bff'], speed: [14, 36], life: [34, 56], g: 0.4, size: [40, 86], spin: 14}),
  ]);
  const charge = useList(() => suckIn(84, fireAt - 36, 34, 50, BASE[0][0], BASE[0][1], ['spark:#ffffff', 'spark:#ff7aa8', 'heartP'], [24, 46]));
  const suck = useList(() => suckIn(85, SPIN0, 16, 90, CX, CY, ['spark:#ffffff', 'spark:#ffd23f', 'star', 'heartP', 'coin', 'sq:#8f6bff'], [26, 60]));
  const radialA = useList(() => makeBurst({seed: 71, at: BOOM, x: CX, y: CY, n: 100, kinds: ['heart', 'heartP', 'star', 'coin', 'item:emerald', 'item:enchanted_book', 'note', 'noteP', 'item:diamond', 'star'], speed: [28, 84], life: [52, 96], g: 0.5, size: [56, 140], spin: 18}));
  const radialB = useList(() => makeBurst({seed: 72, at: BOOM, x: CX, y: CY, n: 90, kinds: ['spark:#ffffff', 'spark:#ffd23f', 'spark:#ff7aa8', 'spark:#8fd3ff', 'sq:#ffd23f', 'sq:#ff7aa8', 'sq:#5ed16a'], speed: [30, 96], life: [32, 66], g: 0.15, size: [34, 74], spin: 12}));
  const cannons = useList(() => {
    const cols = [FLAT.red, FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink, FLAT.purple, FLAT.orange];
    const k = ['conf', 'conf', 'conf', 'sq:#ffd23f', 'star', 'heartP'];
    return [
      ...makeBurst({seed: 73, at: BOOM + 2, x: 30, y: 1070, n: 60, kinds: k, colors: cols, speed: [34, 86], angle: [-86, -30], life: [64, 110], g: 0.8, drag: 0.94, size: [40, 80], spin: 18, stagger: 6}),
      ...makeBurst({seed: 74, at: BOOM + 2, x: 1890, y: 1070, n: 60, kinds: k, colors: cols, speed: [34, 86], angle: [-150, -94], life: [64, 110], g: 0.8, drag: 0.94, size: [40, 80], spin: 18, stagger: 6}),
      ...makeBurst({seed: 75, at: BOOM + 4, x: 30, y: -20, n: 40, kinds: k, colors: cols, speed: [14, 42], angle: [20, 74], life: [64, 110], g: 0.5, drag: 0.94, size: [40, 80], spin: 18, stagger: 6}),
      ...makeBurst({seed: 76, at: BOOM + 4, x: 1890, y: -20, n: 40, kinds: k, colors: cols, speed: [14, 42], angle: [106, 160], life: [64, 110], g: 0.5, drag: 0.94, size: [40, 80], spin: 18, stagger: 6}),
    ];
  });
  const rain = useList(() => confettiRain(77, BOOM + 8, 80, 110, {size: [34, 70], kinds: ['conf', 'conf', 'conf', 'star', 'heartP', 'coin']}));
  const rise = useList(() => makeBurst({seed: 78, at: BOOM + 14, x: 960, y: 1150, n: 46, kinds: ['heart', 'heartP', 'star', 'spark:#ffffff', 'noteP'], speed: [14, 30], angle: [-100, -80], life: [70, 118], g: 0.3, drag: 0.96, size: [40, 110], spin: 8, stagger: 90, spread: 1900}));
  const late = useList(() => makeBurst({seed: 79, at: BOOM + 70, x: 960, y: 540, n: 40, kinds: ['spark:#ffffff', 'spark:#ffd23f', 'star', 'heartP'], speed: [6, 22], life: [34, 60], g: 0.12, size: [34, 70], stagger: 60, spread: 1500}));

  // ----- icon placement
  const iconPose = (i: number) => {
    const intro = spring(f, 2 + i * 4, 18);
    let x = BASE[i][0];
    let y = BASE[i][1];
    let s = intro;
    let rot = 0;
    const isChargeLike = i === 0 && f < FIRE[0];
    const lit = f >= FIRE[i];
    // charge shakes: grows until the press ends
    const chargeK = clamp01((f - (fireAt - 36)) / 36);
    if (f < FIRE[i]) {
      const amp = (i === 0 ? 9 : 3.5) * chargeK;
      x += Math.sin(f * 2.3 + i) * amp;
      y += Math.cos(f * 2.9 + i * 2) * amp;
      if (isChargeLike) s *= 1 - 0.06 * chargeK;
    } else {
      const w = wobble(f, FIRE[i], 20, 3);
      s *= 1 + w * 0.22;
      rot = w * 12;
      y -= Math.max(0, 1 - (f - FIRE[i]) / 8) * 30;
    }
    // all lit: sync bounce and gather
    if (f > FIRE[2] + 12 && f < SPIN0) {
      const k = (f - FIRE[2] - 12) / (SPIN0 - FIRE[2] - 12);
      y += Math.sin(k * Math.PI * 4) * -16 * (0.4 + k);
      s *= 1 + k * 0.1;
    }
    if (f >= SPIN0 && f < BOOM + 3) {
      const t = clamp01((f - SPIN0) / (BOOM - SPIN0));
      const a0 = [180, 300, 60][i];
      const ang = ((a0 + 640 * Math.pow(t, 1.5)) * Math.PI) / 180;
      const r = 330 * (1 - Math.pow(t, 1.25));
      const px = CX + Math.cos(ang) * r;
      const py = CY + Math.sin(ang) * r * 0.9;
      const blend = EASE.out(clamp01(t * 4));
      x = lerp(x, px, blend);
      y = lerp(y, py, blend);
      s *= 1 - 0.45 * EASE.in(t);
      rot += t * 540;
    }
    if (f >= BOOM + 3) {
      const sp = spring(f, BOOM + 4 + i * 3, 22);
      x = lerp(CX, FINAL[i][0], sp);
      y = lerp(CY, FINAL[i][1], sp) + bob(f, 46, 8, i * 15);
      s = 0.72 * sp * (1 + wobble(f, BOOM + 8 + i * 3, 18, 3) * 0.12);
      rot = (1 - sp) * 360 + Math.sin(f / 9 + i) * 6;
    }
    return {x, y, s, rot, lit: lit || f >= BOOM};
  };

  // ----- shake & flash
  const sk = f >= BOOM && f < BOOM + 16 ? 22 * (1 - (f - BOOM) / 16) : 0;
  const rj = mulberry32(5000 + f);
  const shx = sk ? (rj() * 2 - 1) * sk : 0;
  const shy = sk ? (rj() * 2 - 1) * sk : 0;

  const boomT = f - BOOM;
  const done = f >= BOOM;
  const titleS = spring(f, BOOM + 3, 24);
  const ribbon = spring(f, BOOM + 2, 22);
  const subS = spring(f, BOOM + 22, 20);
  const press = f >= fireAt - 38 && f < fireAt ? 1 : 0;
  const handX = track(f, [[10, 1500], [fireAt - 38, 690], [fireAt + 6, 690], [fireAt + 18, 900]], EASE.inOut);
  const handY = track(f, [[10, 960], [fireAt - 38, 700], [fireAt + 6, 700], [fireAt + 18, 900]], EASE.inOut);
  const handO = rangeP(f, 8, 8) * (1 - rangeP(f, fireAt + 8, 10));
  const capS = spring(f, 14, 18) * (1 - rangeP(f, fireAt + 2, 8, EASE.in));
  const ringP = clamp01((f - (fireAt - 36)) / 36);
  const ball = f >= SPIN0 + 6 && f <= BOOM ? EASE.in((f - SPIN0 - 6) / (BOOM - SPIN0 - 6)) : 0;

  return (
    <Stage bg={bg} time="night">
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px)`}}>
        {/* back layers */}
        {done && (
          <>
            <Sunburst x={CX} y={CY} size={3600} alpha={0.34} color="255,226,120" rays={20} spin={0.7} scale={EASE.out(clamp01(boomT / 12))} />
            <Sunburst x={CX} y={CY} size={3000} alpha={0.22} color="255,122,168" rays={14} spin={-0.5} scale={EASE.out(clamp01((boomT - 3) / 12))} />
          </>
        )}
        <Explosion x={CX} y={CY} at={BOOM} size={1200} opacity={0.6} />
        <Explosion x={380} y={300} at={BOOM + 3} size={620} opacity={0.7} />
        <Explosion x={1560} y={780} at={BOOM + 5} size={620} opacity={0.7} />
        <Explosion x={1540} y={260} at={BOOM + 7} size={480} />
        <Explosion x={420} y={820} at={BOOM + 9} size={480} />

        {/* caption + charge frame */}
        {capS > 0.01 && (
          <At x={CX} y={250} s={capS}>
            <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 60, b: 10, sh: 14, band: 12}), padding: '0 48px', height: 120, display: 'flex', alignItems: 'center', gap: 20}}>
              <Label size={60} color={FLAT.pinkDeep} stroke="#ffffff" style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{caption}</Label>
            </div>
          </At>
        )}
        {f >= fireAt - 38 && f < fireAt + 4 && <ChargeFrame cx={BASE[0][0]} cy={BASE[0][1]} p={ringP} shake={[Math.sin(f * 2.3) * 5 * ringP, Math.cos(f * 2.9) * 5 * ringP]} />}

        {/* icons */}
        {ICONS.map((ic, i) => {
          const p = iconPose(i);
          const halo = p.lit && f < SPIN0 ? 0.5 + 0.2 * Math.sin(f / 4 + i) : 0;
          return (
            <div key={ic.key}>
              {p.lit && p.s > 0 && (
                <At x={p.x} y={p.y} s={p.s * (1.16 + halo * 0.12)} rot={p.rot + 45 * 0} o={0.5 * (f >= BOOM ? 0.5 : 1)}>
                  <div style={{width: 270, height: 270, borderRadius: 84, background: ic.glow, border: `10px solid ${ic.glow}`, boxSizing: 'border-box'}} />
                </At>
              )}
              <At x={p.x} y={p.y} s={p.s} rot={p.rot}>
                <div style={{...(p.lit ? chunky(ic.fill, ic.deep, ic.light, {r: 84, b: 10, sh: 14, band: 18}) : chunky('#ebe6f8', '#c9c1e3', '#ffffff', {r: 84, b: 10, sh: 14, band: 18})), width: 270, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Glyph k={ic.key} lit={p.lit} />
                </div>
                {f < SPIN0 && (
                  <div style={{position: 'absolute', left: 0, right: 0, top: 292, display: 'flex', justifyContent: 'center'}}>
                    <Label size={52} color={p.lit ? '#ffffff' : '#c9c1e3'} stroke={p.lit ? INK : '#8d84ad'}>{labels[i]}</Label>
                  </div>
                )}
              </At>
            </div>
          );
        })}

        {/* energy ball */}
        {ball > 0 && (
          <>
            <At x={CX + Math.sin(f * 3) * 6 * ball} y={CY + Math.cos(f * 3.7) * 6 * ball} s={0.4 + ball * 0.95}>
              <Sp s={ORB_BIG} k="orbbig" px={14} drop={1} />
            </At>
          </>
        )}
        <Particles list={suck} />
        <Particles list={charge} />

        {/* fire effects */}
        <Particles list={fireBursts} />
        {FIRE.map((t, i) => (
          <div key={i}>
            <Shockwave x={BASE[i][0]} y={BASE[i][1]} at={t} color={ICONS[i].fill} maxR={460} life={24} width={20} rays={14} seed={i + 20} />
            {audio && <Sfx at={t} src={mcSound('random/orb')} volume={0.5} rate={1 + i * 0.25} />}
            {audio && <Sfx at={t} src={mcSound('random/pop')} volume={0.45} rate={1.1 + i * 0.1} />}
          </div>
        ))}
        {/* spark tracer between icons */}
        {[0, 1].map((i) => {
          const t = f - (FIRE[i] + 1);
          if (t < 0 || t > 7) return null;
          const k = t / 7;
          return (
            <At key={i} x={lerp(BASE[i][0], BASE[i + 1][0], EASE.in(k))} y={BASE[i][1]} s={1.2 - k * 0.4}>
              <Sp s={{rows: ['...W...', '...W...', '..WWW..', 'WWWWWWW', '..WWW..', '...W...', '...W...'], palette: {W: '#ffffff'}}} k="tracer" px={10} outline={null} />
            </At>
          );
        })}

        <Particles list={radialA} />
        <Particles list={radialB} />
        {/* BOOM: pixel cross flashes + shard splashes in rainbow order */}
        <Shockwave x={CX} y={CY} at={BOOM} color="#ffffff" maxR={760} life={26} width={24} rays={22} seed={31} />
        <Shockwave x={CX} y={CY} at={BOOM + 3} color={FLAT.yellow} maxR={1060} life={30} width={22} rays={18} seed={32} />
        <Shockwave x={CX} y={CY} at={BOOM + 6} color={FLAT.pink} maxR={1380} life={34} width={20} rays={16} seed={33} />
        <Shockwave x={CX} y={CY} at={BOOM + 9} color={FLAT.sky} maxR={1560} life={36} width={18} rays={14} seed={34} />
        <Particles list={cannons} />
        <Particles list={rain} />
        <Particles list={rise} />
        <Particles list={late} />

        {/* ribbon + title */}
        {done && (
          <>
            <At x={CX} y={356} rot={-3} sx={ribbon} sy={ribbon}>
              <div style={{width: 1760, height: 300, position: 'relative', border: `0px solid ${INK}`}}>
                {RAINBOW.map((c, i) => (
                  <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 18 + i * 44, height: 44, background: c, borderTop: i === 0 ? `8px solid ${INK}` : undefined, borderBottom: i === 5 ? `8px solid ${INK}` : undefined, borderLeft: `8px solid ${INK}`, borderRight: `8px solid ${INK}`, boxSizing: 'border-box'}} />
                ))}
              </div>
            </At>
            <At x={CX} y={356} rot={-3 + wobble(f, BOOM + 4, 24, 2) * 3} s={titleS * (1 + 0.025 * Math.sin(f / 5))}>
              <div style={{position: 'relative'}}>
                <Sticker size={192} color={FLAT.purple} halo={false} style={{position: 'absolute', left: 10, top: 16}}>
                  {title}
                </Sticker>
                <Sticker size={192} color={FLAT.yellow} style={{position: 'relative'}}>
                  {title}
                </Sticker>
              </div>
            </At>
            <At x={CX} y={606} s={subS} rot={2}>
              <div style={{...chunky('#ffffff', '#e8e2f5', '#ffffff', {r: 60, b: 10, sh: 14, band: 10}), padding: '0 54px', height: 112, display: 'flex', alignItems: 'center', gap: 22}}>
                <Sp s={HEART_BIG} k="hb" px={6} drop={1} />
                <Label size={60} color={FLAT.pinkDeep} stroke="#ffffff" style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{thanks}</Label>
                <Sp s={HEART_PINK} k="hp" px={6} drop={1} />
              </div>
            </At>
          </>
        )}

        {/* mascots (real vanilla textures) + bunting + edge decor */}
        {done && <Bunting x0={-40} y0={-30} x1={1960} y1={-30} sag={56} n={12} at={BOOM + 6} size={88} />}
        {[
          {x: 130, y: 980, at: BOOM + 12, k: 'creeper' as const, px: 18, rot: -6},
          {x: 1790, y: 980, at: BOOM + 16, k: 'pig' as const, px: 18, rot: 6},
          {x: 340, y: 1020, at: BOOM + 20, k: 'slime' as const, px: 11, rot: -4},
          {x: 1580, y: 1020, at: BOOM + 24, k: 'slime' as const, px: 11, rot: 4},
        ].map((m, i) => {
          const p = spring(f, m.at, 18);
          const hop = f > m.at + 12 ? Math.abs(Math.sin(((f - m.at) / 16) * Math.PI)) * 30 : 0;
          return (
            <At key={i} x={m.x} y={m.y + (1 - p) * 260 - hop} rot={m.rot + Math.sin(f / 5 + m.x) * 4} s={0.001 + p}>
              <Mob k={m.k} scale={m.px} drop={8} />
            </At>
          );
        })}
        <Orn x={110} y={330} at={BOOM + 14} rot={-14} bobAmp={12}><Sp s={STAR_BIG} k="star" px={11} drop={1} /></Orn>
        <Orn x={1810} y={350} at={BOOM + 18} rot={14} bobAmp={12} period={56}><Sp s={HEART_BIG} k="hb" px={11} drop={1} /></Orn>
        <Orn x={110} y={640} at={BOOM + 22} rot={10} bobAmp={14}><ItemSp id="enchanted_book" size={120} /></Orn>
        <Orn x={1810} y={650} at={BOOM + 26} rot={-12} bobAmp={14} period={52}><Sp s={COIN} k="coin" px={8} drop={1} /></Orn>
        <Orn x={640} y={100} at={BOOM + 30} rot={-8} bobAmp={8}><ItemSp id="emerald" size={90} /></Orn>
        <Orn x={1290} y={110} at={BOOM + 32} rot={8} bobAmp={8}><Sp s={STAR_BIG} k="star" px={7} drop={1} /></Orn>

        <Hand x={handX} y={handY} press={press} o={handO} />
      </AbsoluteFill>

      {/* flashes */}
      {/* flashes: kept light (peak 0.45 white, short yellow tail) so the burst never blows out */}
      {boomT >= 0 && boomT < 8 && <AbsoluteFill style={{background: '#ffffff', opacity: 0.45 * (1 - boomT / 8)}} />}
      {boomT >= 3 && boomT < 12 && <AbsoluteFill style={{background: FLAT.yellow, opacity: 0.16 * (1 - (boomT - 3) / 9)}} />}

      {/* sfx */}
      {audio && <Sfx at={fireAt - 40} src={mcSound('random/click')} volume={0.5} rate={1.3} />}
      {audio && <Sfx at={fireAt - 36} src={mcSound('random/fuse')} volume={0.2} rate={1.6} cut={36} />}
      {audio && <Sfx at={SPIN0 + 4} src={mcSound('random/fuse')} volume={0.22} rate={2.2} cut={14} />}
      {audio && <Sfx at={BOOM} src={mcSound('random/explode1')} volume={0.5} rate={1.05} />}
      {audio && <Sfx at={BOOM + 1} src={reelSfx('impact-cine.mp3')} volume={0.35} />}
      {audio && <Sfx at={BOOM + 2} src={mcSound('random/levelup')} volume={0.5} />}
      {audio && <Sfx at={BOOM + 6} src={mcSound('ui/toast/challenge_complete')} volume={0.35} />}
      {audio && <Sfx at={BOOM + 10} src={mcSound('random/orb')} volume={0.3} rate={1.6} />}
      {audio && <Sfx at={BOOM + 16} src={mcSound('random/orb')} volume={0.3} rate={1.9} />}
      {audio && <Sfx at={BOOM + 22} src={mcSound('random/pop')} volume={0.4} rate={1.3} />}
    </Stage>
  );
};

export const tripleEntry: FxEntry = {
  meta: {
    id: 'soc-triple',
    name: '一键三连 · 终极爆发',
    category: 'social',
    tags: ['三连', '点赞', '投币', '收藏', '爆发', '华丽', '全屏'],
    frames: 240,
    blurb: '小手长按点赞，蓄力环涌满，点赞→投币→收藏三枚图标依次亮起，盘旋聚成能量球，随即全屏爆发：爆炸帧、旋转光芒、彩虹彩带写着“三连成功!”，四角喷彩带，爱心金币附魔书满屏飞。',
    usage: '视频结尾或关键节点的“一键三连”召唤；演示版是完整夜空背景，Layer 透明背景可直接叠在片尾画面上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景（夜空虚化）'},
      {name: 'fireAt', desc: '第一个图标点亮的帧，默认 62（之后每 8 帧点亮下一个）'},
      {name: 'boomAt', desc: '全屏爆发的帧，默认 118'},
    ],
  },
  Demo: () => <TripleFx bg />,
  Layer: () => <TripleFx />,
};
