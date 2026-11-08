import {type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {FLAT} from '../../flat';
import {Shockwave} from '../../../mc/Fx';
import {At, Click, Hand, HEART_BIG, HEART_PINK, Odometer, Orn, Particles, Say, STAR_BIG, Sp, Stage, Sunburst, THUMB, chunky, makeBurst, rangeP, spring, track, useList, wobble} from './common';

/**
 * soc-like: a thumbs-up button gets pressed (wind-up, squash), springs back and bursts hearts / stars / pixel shards
 * in every direction (pixel cross flash + shard splash, no rings) while the counter rolls +1. Hearts also float up from the bottom edge and big hearts
 * pop in the four corners.
 * Props: bg (draw the demo backdrop), count (starting number, shows count+1 after the press), tapAt (press frame), plusText (floating text),
 * accent / accentDeep (button, counter and flash colour), audio (play the sound effects).
 */

const GRAY_THUMB = {rows: THUMB.rows, palette: {...THUMB.palette, Y: '#e4e0ee', W: '#ffffff', y: '#b9b3cc', B: '#cfc9de', b: '#aaa3c0'}};

export const LikeFx: FC<{bg?: boolean; count?: number; tapAt?: number; plusText?: string; accent?: string; accentDeep?: string; audio?: boolean}> = ({bg, count = 1284, tapAt = 26, plusText = '+1', accent = FLAT.pink, accentDeep = FLAT.pinkDeep, audio = true}) => {
  const f = useCurrentFrame();
  const BX = 720;
  const BY = 540;
  const PX = 1180;
  const hit = tapAt;

  const hearts = useList(() => makeBurst({seed: 11, at: hit, x: BX, y: BY, n: 44, kinds: ['heart', 'heartP', 'heart', 'heartP', 'star'], speed: [20, 54], life: [50, 84], g: 0.4, size: [50, 120], spin: 16}));
  const sparks = useList(() => makeBurst({seed: 12, at: hit, x: BX, y: BY, n: 34, kinds: ['spark:#ffffff', 'spark:#ffd23f', 'spark:#ff7aa8'], speed: [24, 60], life: [26, 50], g: 0.1, size: [34, 66], spin: 6}));
  const bits = useList(() => makeBurst({seed: 13, at: hit, x: BX, y: BY, n: 34, kinds: ['sq:#ff7aa8', 'sq:#ffd23f', 'sq:#8fd3ff', 'sq:#ffffff'], speed: [18, 46], life: [30, 56], g: 0.7, size: [30, 60], spin: 20}));
  // hearts floating up from the bottom edge, bigger = nearer = faster
  const rise = useList(() =>
    makeBurst({seed: 14, at: hit + 6, x: 960, y: 1150, n: 26, kinds: ['heart', 'heartP'], speed: [16, 32], angle: [-100, -80], life: [64, 100], g: 0.42, drag: 0.95, size: [40, 120], spin: 6, stagger: 44, spread: 1900}),
  );
  const second = useList(() => makeBurst({seed: 15, at: hit + 36, x: 960, y: 540, n: 18, kinds: ['heartP', 'spark:#ffffff', 'star'], speed: [8, 20], life: [30, 50], g: 0.2, size: [34, 64], stagger: 10, spread: 900}));

  // button animation
  const press = rangeP(f, hit - 5, 5, EASE.in) * (1 - rangeP(f, hit, 2));
  const jelly = wobble(f, hit, 22, 3);
  const grow = spring(f, 0, 18);
  const on = f >= hit;
  const bs = grow * (1 - press * 0.2) * (1 + (f >= hit ? jelly * 0.2 : 0));
  const sx = 1 + press * 0.1 - jelly * 0.12;
  const sy = 1 - press * 0.1 + jelly * 0.2;
  const thumbRot = f < hit - 5 ? track(f, [[0, 0], [hit - 6, -4]]) : track(f, [[hit - 5, -4], [hit - 1, -24], [hit + 6, 12], [hit + 14, -3], [hit + 24, 0]], EASE.out);
  const thumbLift = f >= hit ? -Math.max(0, 1 - (f - hit) / 10) * 22 : 0;

  // cursor path
  const hx = track(f, [[0, 1500], [hit - 10, 770], [hit + 3, 770], [hit + 14, 1060]], EASE.inOut);
  const hy = track(f, [[0, 960], [hit - 10, 640], [hit + 3, 640], [hit + 14, 860]], EASE.inOut);
  const handO = 1 - rangeP(f, hit + 12, 8);

  // counter
  const cv = count + clamp01((f - (hit + 4)) / 6);
  const pillBump = wobble(f, hit + 4, 16, 3);
  const pillIn = spring(f, 4, 18);

  return (
    <Stage bg={bg} time="noon">
      {/* back layer: sunburst */}
      {on && <Sunburst x={BX} y={BY} alpha={0.34 * (1 - rangeP(f, hit + 30, 60, EASE.inOut) * 0.5)} color="255,226,236" rays={14} spin={0.5} scale={rangeP(f, hit, 14)} />}

      {/* rising hearts behind the main UI */}
      <Particles list={rise} />

      {/* like button */}
      <At x={BX} y={BY} s={bs} sx={sx} sy={sy}>
        <div style={{width: 340, height: 340, ...(on ? chunky(accent, accentDeep, '#ffa6c4', {r: 108, b: 10, sh: 16, band: 18}) : chunky('#f4f0ff', '#cfc7e6', '#ffffff', {r: 108, b: 10, sh: 16, band: 18})), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: `translateY(${thumbLift - 6}px) rotate(${thumbRot}deg) scale(${on ? 1 + jelly * 0.08 : 1})`, transformOrigin: '40% 90%'}}>
            <Sp s={on ? THUMB : GRAY_THUMB} k={on ? 'thumb' : 'thumbg'} px={16} drop={1} />
          </div>
        </div>
      </At>

      {/* counter pill */}
      <At x={PX} y={BY + 8} s={pillIn} sx={1 + pillBump * 0.06} sy={1 - pillBump * 0.08}>
        <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 70, b: 10, sh: 14, band: 12}), width: 560, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28}}>
          <Sp s={on ? HEART_BIG : HEART_PINK} k={on ? 'hb' : 'hp'} px={10} drop={1} style={{opacity: on ? 1 : 0.55}} />
          <Odometer value={cv} digits={4} size={116} color={on ? accent : '#b8aed0'} />
        </div>
      </At>

      {/* +1 */}
      <Say at={hit + 5} x={PX + 170} y={BY - 170} text={plusText} size={108} color={accent} rot={6} life={40} />

      {/* burst */}
      <Click x={800} y={620} at={hit - 3} color={accent} />
      <Particles list={hearts} />
      <Particles list={bits} />
      <Particles list={sparks} />
      <Particles list={second} />
      <Shockwave x={BX} y={BY} at={hit} color={accent} maxR={560} life={26} width={24} rays={16} seed={3} />
      <Shockwave x={BX} y={BY} at={hit + 4} color={FLAT.yellow} maxR={820} life={30} width={18} rays={12} seed={9} />

      {/* cursor */}
      <Hand x={hx} y={hy} press={press} o={handO} />

      {/* edge ornaments */}
      <Orn x={110} y={120} at={hit + 8} rot={-18} bobAmp={12}><Sp s={HEART_BIG} k="hb" px={15} drop={2} /></Orn>
      <Orn x={1810} y={130} at={hit + 12} rot={16} bobAmp={12} period={56}><Sp s={HEART_PINK} k="hp" px={13} drop={2} /></Orn>
      <Orn x={120} y={960} at={hit + 16} rot={14} bobAmp={14} period={62}><Sp s={HEART_PINK} k="hp" px={12} drop={2} /></Orn>
      <Orn x={1800} y={950} at={hit + 20} rot={-14} bobAmp={14} period={58}><Sp s={HEART_BIG} k="hb" px={16} drop={2} /></Orn>
      <Orn x={960} y={86} at={hit + 24} rot={8} bobAmp={8}><Sp s={STAR_BIG} k="star" px={9} drop={1} /></Orn>
      <Orn x={400} y={968} at={hit + 28} rot={-10} bobAmp={8}><Sp s={STAR_BIG} k="star" px={8} drop={1} /></Orn>
      <Orn x={1540} y={90} at={hit + 30} rot={12} bobAmp={8} period={44}><Sp s={STAR_BIG} k="star" px={7} drop={1} /></Orn>
      <Orn x={60} y={540} at={hit + 26} rot={-8} bobAmp={16}><Sp s={HEART_BIG} k="hb" px={8} drop={1} /></Orn>
      <Orn x={1862} y={560} at={hit + 32} rot={8} bobAmp={16} period={48}><Sp s={HEART_PINK} k="hp" px={8} drop={1} /></Orn>
      <Orn x={1520} y={980} at={hit + 34} rot={10} bobAmp={8}><Sp s={STAR_BIG} k="star" px={7} drop={1} /></Orn>

      {/* sfx */}
      {audio && <Sfx at={hit - 2} src={mcSound('random/click')} volume={0.5} rate={1.5} />}
      {audio && <Sfx at={hit} src={mcSound('random/pop')} volume={0.55} rate={1.25} />}
      {audio && <Sfx at={hit + 4} src={mcSound('random/orb')} volume={0.35} rate={1.8} />}
      {audio && <Sfx at={hit + 26} src={mcSound('random/orb')} volume={0.25} rate={2.0} />}
    </Stage>
  );
};

export const likeEntry: FxEntry = {
  meta: {
    id: 'soc-like',
    name: '点赞 · 爱心爆开',
    category: 'social',
    tags: ['点赞', '爱心', '互动', '可爱', '像素'],
    frames: 120,
    blurb: '小手点下大拇指按钮，按钮压扁再弹起，像素十字闪光加碎片飞溅，爱心、星星、彩块向四周炸开，计数 +1 滚动，画面四角冒出大爱心。',
    usage: '视频里提醒观众点赞的那一刻；演示带虚化的视频底板，Layer 透明背景可直接叠在素材上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景（Layer 为 false）'},
      {name: 'count', desc: '点赞前的数字，点完显示 count+1'},
      {name: 'tapAt', desc: '按下的帧（爆发时刻），默认 26'},
    ],
  },
  Demo: () => <LikeFx bg />,
  Layer: () => <LikeFx />,
};
