import {type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT} from '../../flat';
import {At, Avatar, BADGE, Bunting, CHECK, Click, Hand, HEART_BIG, HEART_PINK, INK, Label, Mob, Odometer, Orn, PLUS, Particles, STAR_BIG, Sp, Stage, Sunburst, chunky, confettiRain, dots, makeBurst, rangeP, spring, track, useList, wobble, bob, type Face} from './common';

/**
 * soc-follow: a profile card (avatar, name, fan count) and a "+ 关注" button. A hand presses the button,
 * it jellies into a green "已关注" with a check mark, ribbons shoot from both bottom corners (pixel cross flashes, no rings), stars scatter
 * around the avatar, a badge pops onto the avatar and the fan counter rolls +1.
 * Props: bg, name, face (avatar), fans (start number), tapAt (press frame), followText / doneText (button labels), fansLabel, audio (play the sound effects).
 */

export const FollowFx: FC<{bg?: boolean; name?: string; face?: Face; fans?: number; tapAt?: number; followText?: string; doneText?: string; fansLabel?: string; audio?: boolean}> = ({
  bg,
  name = '方块君Steve',
  face = 'steve',
  fans = 1024,
  tapAt = 58,
  followText = '关注',
  doneText = '已关注',
  fansLabel = '粉丝',
  audio = true,
}) => {
  const f = useCurrentFrame();
  const hit = tapAt;
  const CX = 960;
  const on = f >= hit;

  const cannonL = useList(() => makeBurst({seed: 21, at: hit + 1, x: 60, y: 1040, n: 46, kinds: ['conf', 'conf', 'conf', 'sq:#ffd23f', 'star'], colors: [FLAT.red, FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink, FLAT.purple], speed: [26, 64], angle: [-85, -40], life: [60, 100], g: 0.75, drag: 0.93, size: [36, 70], spin: 18, stagger: 3}));
  const cannonR = useList(() => makeBurst({seed: 22, at: hit + 1, x: 1860, y: 1040, n: 46, kinds: ['conf', 'conf', 'conf', 'sq:#ff7aa8', 'star'], colors: [FLAT.red, FLAT.yellow, FLAT.green, FLAT.sky, FLAT.pink, FLAT.purple], speed: [26, 64], angle: [-140, -95], life: [60, 100], g: 0.75, drag: 0.93, size: [36, 70], spin: 18, stagger: 3}));
  const rain = useList(() => confettiRain(23, hit + 6, 50, 56, {size: [30, 56]}));
  const stars = useList(() => makeBurst({seed: 24, at: hit, x: CX, y: 406, n: 18, kinds: ['star', 'spark:#ffffff', 'spark:#ffd23f', 'heartP'], speed: [14, 34], life: [44, 76], g: 0.12, size: [40, 84], spin: 10}));
  const btnBits = useList(() => makeBurst({seed: 25, at: hit, x: CX, y: 864, n: 22, kinds: ['spark:#ffffff', 'sq:#a8f0c6', 'sq:#ffffff', 'spark:#5ed16a'], speed: [12, 30], life: [24, 44], g: 0.3, size: [30, 56], spin: 10}));

  // card drop-in
  const drop = spring(f, 0, 24);
  const cardY = (1 - drop) * -520;
  const idle = bob(f, 70, 6);

  // button
  const hover = rangeP(f, hit - 14, 8) * (on ? 0 : 1);
  const press = rangeP(f, hit - 4, 4, EASE.in) * (on ? 0 : 1);
  const jel = wobble(f, hit, 22, 3);
  const bscale = 1 + hover * 0.05 - press * 0.1;
  const bsx = bscale * (1 + (on ? -jel * 0.12 : 0));
  const bsy = bscale * (1 + (on ? jel * 0.22 : 0));

  // hand
  const hx = track(f, [[10, 1520], [hit - 16, 1070], [hit + 2, 1070], [hit + 16, 1300]], EASE.inOut);
  const hy = track(f, [[10, 1100], [hit - 16, 925], [hit + 2, 925], [hit + 16, 1060]], EASE.inOut);
  const hO = rangeP(f, 10, 6) * (1 - rangeP(f, hit + 12, 8));

  // badge on the avatar
  const badge = spring(f, hit + 6, 20);
  const avatarJelly = wobble(f, hit + 2, 20, 2.5);
  const fansV = fans + (on ? Math.max(0, Math.min(1, (f - hit - 4) / 6)) : 0);
  const chipBump = wobble(f, hit + 4, 16, 3);

  const nameIn = spring(f, 10, 18);
  const chipIn = spring(f, 16, 18);
  const btnIn = spring(f, 20, 20);

  return (
    <Stage bg={bg} time="dawn">
      {on && <Sunburst x={CX} y={540} alpha={0.3 * (1 - rangeP(f, hit + 40, 60, EASE.inOut) * 0.4)} color="255,255,255" rays={18} spin={0.4} scale={rangeP(f, hit, 16)} />}

      <Bunting x0={-40} y0={-20} x1={1960} y1={-20} sag={150} n={11} at={hit + 2} size={104} />

      {/* the card */}
      <At x={CX} y={580 + cardY + idle} sx={1 + (1 - drop) * -0.05} sy={1 + (1 - drop) * 0.08}>
        <div style={{position: 'relative', width: 780, height: 820}}>
          <div style={{...chunky('#fffaf0', '#f3e7cc', '#ffffff', {r: 70, b: 10, sh: 18, band: 14}), position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: FLAT.sky, borderBottom: `10px solid ${INK}`}}>
              <div style={{position: 'absolute', inset: 0, ...dots('rgba(255,255,255,0.4)', 40, 7), transform: `translateX(${(f * 0.6) % 40}px)`}} />
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, background: FLAT.skyDeep, opacity: 0.55}} />
            </div>
          </div>
          {/* avatar overlapping the banner */}
          <At x={390} y={236} sx={1 + avatarJelly * 0.06} sy={1 - avatarJelly * 0.08}>
            <div style={{...chunky('#ffffff', '#e8e2f5', '#ffffff', {r: 78, b: 8, sh: 12, band: 0}), padding: 12}}>
              <Avatar face={face} size={236} ring="#ffffff" style={{boxShadow: 'none'}} />
            </div>
          </At>
          <At x={390} y={450} s={nameIn}>
            <Label size={76} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{name}</Label>
          </At>
          <At x={390} y={560} s={chipIn} sx={1 + chipBump * 0.06} sy={1 - chipBump * 0.08}>
            <div style={{...chunky('#ffe9f1', '#ffd0e0', '#ffffff', {r: 40, b: 8, sh: 8, band: 8}), display: 'flex', alignItems: 'center', gap: 18, padding: '0 34px', height: 100}}>
              <Sp s={HEART_PINK} k="hp" px={6} drop={1} />
              <Label size={44} color={FLAT.pinkDeep} stroke="#ffffff" style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{fansLabel}</Label>
              <Odometer value={fansV} digits={4} size={64} color={FLAT.pink} />
            </div>
          </At>
          {/* follow button */}
          <At x={390} y={694} s={btnIn} sx={bsx} sy={bsy}>
            <div style={{...(on ? chunky(FLAT.green, FLAT.greenDeep, '#8ee79a', {r: 64, b: 10, sh: 14, band: 14}) : chunky(FLAT.pink, FLAT.pinkDeep, '#ffa6c4', {r: 64, b: 10, sh: 14, band: 14})), width: 520, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
              {on ? (
                <div style={{transform: `scale(${spring(f, hit + 1, 14)}) rotate(${(1 - spring(f, hit + 1, 14)) * -40}deg)`}}>
                  <Sp s={CHECK} k="check" px={10} drop={1} />
                </div>
              ) : (
                <Sp s={PLUS} k="plus" px={9} drop={1} />
              )}
              <Label size={70} color="#ffffff">{on ? doneText : followText}</Label>
            </div>
          </At>
        </div>
      </At>

      {/* badge popping on the avatar (card coordinates -> screen) */}
      <At x={CX + 138} y={580 + cardY + idle + 236 - 410 + 122} s={badge} rot={(1 - badge) * 80}>
        <Sp s={BADGE} k="badge" px={9} drop={1} />
      </At>

      {/* burst */}
      <Shockwave x={CX} y={406} at={hit + 1} color={FLAT.yellow} maxR={620} life={26} width={24} rays={16} seed={5} />
      <Shockwave x={CX} y={864} at={hit} color={FLAT.mint} maxR={380} life={20} width={18} rays={12} seed={6} />
      <Click x={1060} y={870} at={hit - 4} color="#ffffff" />
      <Particles list={cannonL} />
      <Particles list={cannonR} />
      <Particles list={rain} />
      <Particles list={stars} />
      <Particles list={btnBits} />

      <Hand x={hx} y={hy} press={press} o={hO} />

      {/* cheering mascots at the bottom corners (real vanilla textures) */}
      {[
        {x: 170, base: 990, at: hit + 6, k: 'creeper' as const, px: 17, rot: -6},
        {x: 1750, base: 990, at: hit + 10, k: 'pig' as const, px: 17, rot: 6},
        {x: 390, base: 1020, at: hit + 14, k: 'slime' as const, px: 11, rot: -4},
        {x: 1540, base: 1020, at: hit + 18, k: 'slime' as const, px: 10, rot: 4},
      ].map((m) => {
        const p = spring(f, m.at, 18);
        const hop = Math.abs(Math.sin(((f - m.at) / 18) * Math.PI)) * 26 * (f > m.at + 12 ? 1 : 0);
        return (
          <At key={m.k + m.x} x={m.x} y={m.base + (1 - p) * 220 - hop} rot={m.rot + Math.sin(f / 5 + m.x) * 4} s={0.001 + p}>
            <Mob k={m.k} scale={m.px} drop={8} />
          </At>
        );
      })}

      {/* corner ornaments */}
      <Orn x={110} y={330} at={hit + 12} rot={-14} bobAmp={12}><Sp s={STAR_BIG} k="star" px={11} drop={1} /></Orn>
      <Orn x={1810} y={340} at={hit + 16} rot={14} bobAmp={12} period={56}><Sp s={HEART_BIG} k="hb" px={11} drop={1} /></Orn>
      <Orn x={90} y={650} at={hit + 20} rot={10} bobAmp={14}><Sp s={HEART_PINK} k="hp" px={9} drop={1} /></Orn>
      <Orn x={1830} y={660} at={hit + 22} rot={-12} bobAmp={14} period={52}><Sp s={STAR_BIG} k="star" px={9} drop={1} /></Orn>
      <Orn x={560} y={110} at={hit + 24} rot={-8} bobAmp={8}><Sp s={STAR_BIG} k="star" px={6} drop={1} /></Orn>
      <Orn x={1370} y={120} at={hit + 26} rot={8} bobAmp={8}><Sp s={HEART_PINK} k="hp" px={6} drop={1} /></Orn>

      {audio && <Sfx at={hit - 14} src={mcSound('random/click')} volume={0.2} rate={1.8} />}
      {audio && <Sfx at={hit - 2} src={mcSound('random/click')} volume={0.5} rate={1.4} />}
      {audio && <Sfx at={hit} src={mcSound('random/pop')} volume={0.5} rate={1.3} />}
      {audio && <Sfx at={hit + 2} src={mcSound('random/orb')} volume={0.45} rate={1.5} />}
      {audio && <Sfx at={hit + 7} src={mcSound('random/orb')} volume={0.3} rate={1.9} />}
      {audio && <Sfx at={hit + 4} src={mcSound('ui/toast/challenge_complete')} volume={0.25} rate={1.1} />}
    </Stage>
  );
};

export const followEntry: FxEntry = {
  meta: {
    id: 'soc-follow',
    name: '关注 · 已关注彩带',
    category: 'social',
    tags: ['关注', '头像', '彩带', '互动', '可爱'],
    frames: 150,
    blurb: '资料卡弹入，小手按下“关注”按钮，果冻般变成绿色“已关注”并打勾，彩带从两个底角喷出，头像上冒出徽章，星星散开，粉丝数 +1。',
    usage: '提醒观众关注 UP 主、介绍嘉宾/频道时；Layer 可直接叠在口播画面上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景'},
      {name: 'name', desc: '昵称'},
      {name: 'face', desc: '头像：steve | alex | creeper | pig | slime | sunny | zuri | kai'},
      {name: 'fans', desc: '关注前的粉丝数'},
      {name: 'tapAt', desc: '按下按钮的帧，默认 58'},
    ],
  },
  Demo: () => <FollowFx bg />,
  Layer: () => <FollowFx />,
};
