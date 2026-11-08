import {type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {FLAT} from '../../flat';
import {At, Avatar, BADGE, Click, Glint, Hand, HEART_BIG, HEART_PINK, INK, Label, PLUS, Particles, STAR_BIG, Sp, Stage, bob, chunky, lerp, makeBurst, rangeP, spring, track, useList, wobble, type Face} from './common';

/**
 * soc-follow-corner: a loopable "关注" card that lives in a screen corner. 120 frames loop seamlessly
 * (hidden at frame 0 and 120): slide in with overshoot, breathe, glint the button twice, a hand taps it
 * (button jellies, hearts and stars pop), a diagonal shine sweeps the card, then it slides back out.
 * Props: bg, corner ('bl' | 'br' | 'tl' | 'tr'), name, fans (text), face (avatar), scale (card scale), margin (px from the edges), buttonText, audio (play the sound effects).
 */

const CARD_W = 720;
const CARD_H = 200;

export const FollowCornerFx: FC<{bg?: boolean; corner?: 'bl' | 'br' | 'tl' | 'tr'; name?: string; fans?: string; face?: Face; scale?: number; margin?: number; buttonText?: string; audio?: boolean}> = ({
  bg,
  corner = 'bl',
  name = '红石小能手',
  fans = '12.8万 粉丝',
  face = 'alex',
  scale = 1,
  margin = 56,
  buttonText = '关注',
  audio = true,
}) => {
  const f = useCurrentFrame();
  const right = corner === 'br' || corner === 'tr';
  const bottom = corner === 'bl' || corner === 'br';
  const left0 = right ? 1920 - margin - CARD_W * scale : margin;
  const top0 = bottom ? 1080 - margin - CARD_H * scale : margin;
  const cx = left0 + (CARD_W * scale) / 2;
  const cy = top0 + (CARD_H * scale) / 2;
  const dirX = right ? 1 : -1;
  const dirY = bottom ? 1 : -1;

  // loop timeline
  const IN = 0;
  const TAP = 62;
  const OUT = 98;
  const inP = spring(f, IN, 20);
  const outP = rangeP(f, OUT, 18, EASE.in);
  const presence = f < OUT ? inP : 1 - outP;
  const ox = (1 - presence) * dirX * (CARD_W * scale + margin + 140);
  const oy = (1 - presence) * dirY * 120;
  const breathe = 1 + 0.025 * Math.sin((f / 40) * Math.PI * 2);
  const squash = f < 26 ? wobble(f, 12, 18, 2.5) * 0.06 : 0;

  // button location in screen px
  const btnLocal = {x: CARD_W - 56 - 100, y: CARD_H / 2};
  const bx = left0 + btnLocal.x * scale;
  const by = top0 + btnLocal.y * scale;

  const press = rangeP(f, TAP - 5, 4, EASE.in) * (1 - rangeP(f, TAP, 3));
  const jel = wobble(f, TAP, 20, 3);
  const sweep = rangeP(f, 78, 18, (t) => t);
  const plusSpin = f >= TAP ? rangeP(f, TAP, 16, EASE.out) * 360 : 0;

  const pops = useList(() => makeBurst({seed: 301, at: TAP, x: bx, y: by, n: 12, kinds: ['heartP', 'heart', 'spark:#ffffff', 'star', 'sq:#ffd23f'], speed: [10, 26], angle: dirY === 1 ? [-170, -10] : [10, 170], life: [24, 38], g: 0.3, size: [30, 60], spin: 12}));
  const around = useList(() => makeBurst({seed: 302, at: 22, x: cx, y: cy, n: 10, kinds: ['spark:#ffffff', 'spark:#ffd23f', 'heartP'], speed: [3, 9], life: [26, 40], g: 0.04, drag: 0.95, size: [26, 46], stagger: 8, spread: CARD_W * scale}));
  const around2 = useList(() => makeBurst({seed: 303, at: 84, x: cx, y: cy, n: 8, kinds: ['spark:#ffffff', 'spark:#ffd23f', 'star'], speed: [3, 9], life: [20, 30], g: 0.04, drag: 0.95, size: [26, 46], stagger: 8, spread: CARD_W * scale}));

  // hand path (screen px)
  const hx = track(f, [[36, bx + dirX * 380], [TAP - 8, bx + 40], [TAP + 6, bx + 40], [TAP + 20, bx + dirX * 380]], EASE.inOut);
  const hy = track(f, [[36, by + dirY * 420], [TAP - 8, by + 90], [TAP + 6, by + 90], [TAP + 20, by + dirY * 420]], EASE.inOut);
  const hO = rangeP(f, 36, 6) * (1 - rangeP(f, TAP + 12, 8));

  return (
    <Stage bg={bg} time="dusk">
      {/* pixel glints on the button corners (replaces the old round pulse rings) */}
      <Glint x={bx - 90} y={by - 40} at={18} size={64} color="#ffffff" life={14} />
      <Glint x={bx + 96} y={by + 38} at={26} size={48} color={FLAT.pink} life={14} />
      <Glint x={bx - 70} y={by + 44} at={44} size={48} color="#ffffff" life={14} />

      <div style={{position: 'absolute', left: left0, top: top0, width: CARD_W * scale, height: CARD_H * scale, transform: `translate(${ox}px, ${oy}px) scale(${breathe * (1 + squash)}, ${breathe * (1 - squash)})`, transformOrigin: `${right ? '100%' : '0%'} ${bottom ? '100%' : '0%'}`, opacity: Math.min(1, presence * 4)}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
          <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 64, b: 10, sh: 14, band: 12}), position: 'absolute', inset: 0, overflow: 'hidden'}}>
            {/* shine sweep */}
            {sweep > 0 && sweep < 1 && <div style={{position: 'absolute', top: -40, bottom: -40, width: 90, left: -140 + sweep * (CARD_W + 280), transform: 'rotate(20deg)', background: 'rgba(255,255,255,0.85)'}} />}
          </div>
          <div style={{position: 'absolute', left: 36, top: 32}}>
            <Avatar face={face} size={136} />
          </div>
          <div style={{position: 'absolute', left: 36 + 98, top: 32 + 96, transform: `scale(${1 + 0.06 * Math.sin((f / 40) * Math.PI * 2)})`}}>
            <Sp s={BADGE} k="badge" px={4} drop={1} />
          </div>
          <div style={{position: 'absolute', left: 202, top: 34}}>
            <Label size={46} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{name}</Label>
          </div>
          <div style={{position: 'absolute', left: 202, top: 108, display: 'flex', alignItems: 'center', gap: 10}}>
            <Sp s={HEART_PINK} k="hp" px={3} drop={1} />
            <Label size={32} color={FLAT.pinkDeep} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{fans}</Label>
          </div>
          {/* the button, centred on btnLocal */}
          <div style={{position: 'absolute', left: btnLocal.x, top: btnLocal.y, transform: `translate(-50%, -50%) scale(${1 + 0.04 * Math.sin((f / 40) * Math.PI * 2 + 1) - press * 0.12 + jel * 0.1}, ${1 - 0.02 - press * 0.1 - jel * 0.14 + 0.02})`}}>
            <div style={{...chunky(FLAT.pink, FLAT.pinkDeep, '#ffa6c4', {r: 48, b: 8, sh: 10, band: 10}), width: 200, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', position: 'relative'}}>
              <div style={{transform: `rotate(${plusSpin}deg)`}}>
                <Sp s={PLUS} k="plus" px={5} drop={1} />
              </div>
              <Label size={44} color="#ffffff">{buttonText}</Label>
              {f >= TAP && f < TAP + 14 && <div style={{position: 'absolute', top: -20, bottom: -20, width: 40, left: -60 + ((f - TAP) / 14) * 340, transform: 'rotate(20deg)', background: 'rgba(255,255,255,0.8)'}} />}
            </div>
          </div>
        </div>
      </div>

      <Click x={bx + 20} y={by + 30} at={TAP - 2} color={FLAT.pink} />
      <Particles list={pops} />
      <Particles list={around} />
      <Particles list={around2} />
      <Hand x={hx} y={hy} press={press} o={hO} px={8} />

      {/* little satellites near the card */}
      <At x={cx - dirX * (CARD_W * scale) / 2 + dirX * -20} y={cy - dirY * 150 + bob(f, 60, 8)} s={presence * 0.9} rot={-10 + bob(f, 40, 6)}>
        <Sp s={STAR_BIG} k="star" px={6} drop={1} />
      </At>
      <At x={cx + dirX * 150} y={cy - dirY * 170 + bob(f, 40, 7, 10)} s={presence * 0.9} rot={10 + bob(f, 60, 6)}>
        <Sp s={HEART_BIG} k="hb" px={5} drop={1} />
      </At>

      {audio && <Sfx at={TAP - 2} src={mcSound('random/click')} volume={0.35} rate={1.5} />}
      {audio && <Sfx at={TAP} src={mcSound('random/pop')} volume={0.4} rate={1.3} />}
      {audio && <Sfx at={TAP + 3} src={mcSound('random/orb')} volume={0.25} rate={1.8} />}
    </Stage>
  );
};

void lerp;

export const followCornerEntry: FxEntry = {
  meta: {
    id: 'soc-follow-corner',
    name: '常驻关注角标 · 循环',
    category: 'social',
    tags: ['关注', '角标', '常驻', '循环', 'Layer'],
    frames: 120,
    blurb: '画面角落滑出一张“关注”小卡片，轻轻呼吸、按钮角上闪几下像素星光，小手点一下按钮（果冻 + 爱心星星 + 扫光），再滑回角落；4 秒首尾相接可无缝循环。',
    usage: '整条视频里反复出现的关注提示，把 Layer 循环铺在时间线上即可；可换角落、昵称、头像、粉丝数。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景（Layer 为 false）'},
      {name: 'corner', desc: "角落：'bl' 左下 | 'br' 右下 | 'tl' 左上 | 'tr' 右上"},
      {name: 'name / fans / face', desc: '昵称 / 粉丝文案 / 头像（steve|alex|creeper|pig|slime|sunny|zuri|kai）'},
      {name: 'scale / margin', desc: '卡片缩放 / 距边距离(px)'},
    ],
  },
  Demo: () => <FollowCornerFx bg corner="br" scale={1.25} />,
  Layer: () => <FollowCornerFx corner="br" scale={1.25} />,
};
