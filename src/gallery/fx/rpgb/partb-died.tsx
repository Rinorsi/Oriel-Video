import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {PIXEL_FONT} from '../../../mc/fonts';
import type {FxEntry} from '../../types';
import {C, DungeonWall, FantasyTitle, Gloom, GoldFrame, Icon, Label, Mob, type MobSprite, center, prog, snap} from './kit';
import {Floor, Pillars} from './partb-kit';

/**
 * rpg-you-died  (150f) - the hero is struck down: red hit flash, world drains to grey, a red vignette closes in,
 * the torches gutter, "你倒下了" slams in, souls (vanilla soul particles) rise, then the revive / return buttons appear.
 * Props: bg (draw dungeon + hero + attackers; false = overlay only), title, sub, revive, retreat (button labels),
 *        cost (text on the revive button, e.g. "图腾 x1").
 */

const steve = tex('entity/player/wide/steve.png');
const HERO: MobSprite = {
  w: 16,
  h: 32,
  parts: [
    {src: steve, sheet: [64, 64], rect: [4, 20, 4, 12], x: 4, y: 20},
    {src: steve, sheet: [64, 64], rect: [20, 52, 4, 12], x: 8, y: 20},
    {src: steve, sheet: [64, 64], rect: [44, 20, 4, 12], x: 0, y: 8},
    {src: steve, sheet: [64, 64], rect: [36, 52, 4, 12], x: 12, y: 8},
    {src: steve, sheet: [64, 64], rect: [20, 20, 8, 12], x: 4, y: 8},
    {src: steve, sheet: [64, 64], rect: [8, 8, 8, 8], x: 4, y: 0},
  ],
};

const FRAMES = 150;

const Arrow: FC<{dir: 1 | -1; size?: number; color?: string}> = ({dir, size = 28, color = C.gold3}) => (
  <div style={{width: size, height: size * 1.4, background: color, clipPath: dir === 1 ? 'polygon(0 0, 100% 50%, 0 100%)' : 'polygon(100% 0, 0 50%, 100% 100%)', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.6))'}} />
);

const DeathButton: FC<{label: string; icon: string; note?: string; selected?: boolean; k: number; pulse?: number; sheen?: number}> = ({label, icon, note, selected, k, pulse = 0, sheen = -1}) => (
  <div style={{opacity: clamp01(k * 1.6), transform: `translateY(${(1 - k) * 56}px) scale(${0.9 + 0.1 * k})`, position: 'relative'}}>
    <GoldFrame w={560} h={124} rim={10} glow={selected ? `rgba(255,181,49,${0.35 + 0.25 * pulse})` : undefined} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, filter: selected ? undefined : 'brightness(0.78) saturate(0.85)'}}>
      <Icon id={icon} size={64} style={{filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.6))'}} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
        <Label size={48} color={selected ? C.gold3 : C.common}>{label}</Label>
        {note && <Label size={32} small color={selected ? C.unique : '#9a948a'}>{note}</Label>}
      </div>
      {sheen >= 0 && sheen <= 1 && <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-20 + sheen * 130}%`, width: 70, background: 'rgba(255,240,190,0.28)', transform: 'skewX(-18deg)'}} />}
    </GoldFrame>
    {selected && (
      <>
        <div style={{position: 'absolute', left: -62 - pulse * 10, top: '50%', marginTop: -20}}>
          <Arrow dir={1} />
        </div>
        <div style={{position: 'absolute', right: -62 - pulse * 10, top: '50%', marginTop: -20}}>
          <Arrow dir={-1} />
        </div>
      </>
    )}
  </div>
);

/** Rising soul sprites; `from` = origin point, spawn after `t0`. */
const Souls: FC<{fx: number; fy: number; t0?: number; count?: number; seed?: number}> = ({fx, fy, t0 = 40, count = 22, seed = 21}) => {
  const f = useCurrentFrame();
  const r = mulberry32(seed);
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const born = t0 + r() * 70;
        const life = 70 + r() * 40;
        const dx = (r() - 0.5) * 700;
        const dy = 380 + r() * 520;
        const sz = snap(48 + r() * 64, 16);
        const sw = r() * 6;
        const t = (f - born) / life;
        if (t < 0 || t > 1) return null;
        const x = fx + dx * EASE.out(t) * 0.7 + Math.sin(t * 9 + sw) * 28;
        const y = fy - dy * EASE.inOut(t) - 20 * t;
        const o = Math.sin(Math.min(1, t * 1.1) * Math.PI) * 0.95;
        const fr = Math.floor((f + i * 2) / 2) % 11;
        return <Img key={i} src={tex(`particle/soul_${fr}.png`)} style={{position: 'absolute', left: snap(x, 4) - sz / 2, top: snap(y, 4) - sz / 2, width: sz, height: sz, opacity: o, imageRendering: 'pixelated', filter: 'brightness(1.5) drop-shadow(0 0 10px #66d8ff)'}} />;
      })}
    </>
  );
};

export const YouDied: FC<{bg?: boolean; title?: string; sub?: string; revive?: string; retreat?: string; cost?: string}> = ({bg, title = '你倒下了', sub = '被僵尸击倒 · 幽暗密林 第 3 层', revive = '原地复活', retreat = '返回营地', cost = '图腾 x1'}) => {
  const f = useCurrentFrame();
  const grey = prog(f, 14, 26, EASE.inOut);
  const gloom = prog(f, 8, 46, EASE.inOut);
  const torchLit = 1 - prog(f, 16, 40, EASE.inOut) * 0.9;
  // hero: hit -> stagger -> fall -> small bounce
  const hit = f >= 4 && f < 10;
  const knock = prog(f, 4, 6) * (1 - prog(f, 10, 24, EASE.inOut) * 0.6);
  const lean = -10 * knock;
  const fp = clamp01((f - 30) / 15);
  const bounce = f > 45 ? Math.exp(-(f - 45) / 5) * Math.sin((f - 45) * 0.9) * 7 : 0;
  const ang = lean * (1 - fp) + EASE.in(fp) * 90 - bounce;
  const dropY = -96 * EASE.in(fp);
  const shake = f >= 45 && f < 53 ? (53 - f) * 1.4 : 0;
  const sx = f >= 4 && f < 12 ? Math.sin(f * 7) * (12 - f) : 0;
  // title
  const tIn = prog(f, 36, 9, EASE.back);
  const tOpacity = clamp01((f - 36) / 5);
  const bIn = [prog(f, 92, 14, EASE.back), prog(f, 102, 14, EASE.back)];
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  const sheen = f > 120 ? ((f - 120) % 36) / 20 : -1;
  const out = prog(f, FRAMES - 10, 10, EASE.in);
  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: 1 - out * 0.0}}>
      <AbsoluteFill style={{transform: `translate(${shake * Math.sin(f * 5) + sx}px, ${shake * Math.cos(f * 7)}px)`}}>
        {bg && (
          <AbsoluteFill style={{filter: `grayscale(${grey}) contrast(${1 + grey * 0.1}) brightness(${1 - grey * 0.18})`}}>
            <DungeonWall lights={[{x: 85, y: 330, r: 700}, {x: 1835, y: 330, r: 700}]} lit={torchLit} />
            <Floor y={700} />
            <Pillars lit={torchLit} />
            {/* attackers close in from both bottom corners */}
            <div style={{zIndex: 2, position: 'absolute', left: 250, top: 600, transform: `translateX(${prog(f, 0, 30) * 40}px)`}}>
              <Mob mob="zombie" scale={16} filter="brightness(0.62)" />
            </div>
            <div style={{zIndex: 2, position: 'absolute', right: 250, top: 600, transform: `translateX(${-prog(f, 0, 30) * 40}px) scaleX(-1)`}}>
              <Mob mob="husk" scale={16} filter="brightness(0.62)" />
            </div>
            {/* hero */}
            <div style={{zIndex: 2, position: 'absolute', left: 860 - 96 - knock * 20, top: 1000 - 384, transformOrigin: '50% 100%', transform: `translateY(${dropY}px) rotate(${ang}deg)`}}>
              <Mob mob={HERO} scale={12} filter={hit ? 'brightness(2.4) sepia(1) saturate(6) hue-rotate(-50deg)' : fp > 0.9 ? "brightness(0.8)" : undefined} />
            </div>
            <div style={{zIndex: 1, position: 'absolute', left: 560, top: 900, transform: 'rotate(-28deg)', opacity: fp}}>
              <Icon id="iron_sword" size={128} />
            </div>
            <div style={{position: 'absolute', left: 560, top: 984, width: 640, height: 24, background: 'rgba(0,0,0,0.55)', clipPath: 'polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)', opacity: fp}} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {/* hit flash */}
      {f < 9 && <AbsoluteFill style={{background: C.blood, opacity: 0.6 * (1 - f / 9), mixBlendMode: 'screen'}} />}
      {/* red vignette closing in, then black corners */}
      <Gloom s={gloom} color="96,8,8" />
      <Gloom s={gloom * 0.6} color="0,0,0" />
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,${0.5 * grey}) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,${0.5 * grey}) 100%)`}} />
      <Souls fx={1060} fy={860} />
      {/* title block */}
      <div style={{...center(210), flexDirection: 'column', gap: 6, opacity: tOpacity, transform: `scale(${1.5 - 0.5 * tIn})`}}>
        <FantasyTitle size={200} tone="blood" spacing={0.14}>{title}</FantasyTitle>
      </div>
      {/* rule + subtitle */}
      <div style={{...center(452), opacity: prog(f, 48, 12), gap: 18}}>
        <div style={{width: 360 * prog(f, 48, 16), height: 6, background: `linear-gradient(90deg, rgba(168,116,26,0), ${C.gold1})`}} />
        <div style={{width: 20, height: 20, background: C.gold2, transform: 'rotate(45deg)', boxShadow: `0 0 0 4px ${C.ink}`}} />
        <div style={{width: 360 * prog(f, 48, 16), height: 6, background: `linear-gradient(270deg, rgba(168,116,26,0), ${C.gold1})`}} />
      </div>
      <div style={{...center(500), opacity: prog(f, 56, 14)}}>
        <Label size={48} color="#d8cfc0">{sub}</Label>
      </div>
      {/* buttons */}
      <div style={{...center(620), gap: 100}}>
        <DeathButton label={revive} icon="totem_of_undying" note={cost} selected k={bIn[0]} pulse={f > 110 ? pulse : 0} sheen={sheen} />
        <DeathButton label={retreat} icon="compass_00" note="保留已得战利品" k={bIn[1]} />
      </div>
      <Sfx at={4} src={mcSound('random/anvil_land')} volume={0.35} rate={0.8} />
      <Sfx at={30} src={mcSound('ambient/weather/thunder1')} volume={0.25} rate={0.7} cut={50} />
      <Sfx at={36} src={reelSfx('impact-cine.mp3')} volume={0.5} />
      <Sfx at={52} src={mcSound('random/orb')} volume={0.3} rate={0.6} />
      <Sfx at={92} src={mcSound('ui/toast/in')} volume={0.3} />
      <Sfx at={102} src={mcSound('ui/toast/in')} volume={0.25} rate={0.9} />
    </AbsoluteFill>
  );
};
void PIXEL_FONT;

export const entryDied: FxEntry = {
  meta: {
    id: 'rpg-you-died',
    name: '阵亡',
    category: 'rpg',
    tags: ['RPG', '地下城', '阵亡', '死亡', '复活', '结算'],
    frames: FRAMES,
    blurb: '红色闪击后画面去色、红黑暗角压缩，火把熄灭，血红大字“你倒下了”砸下，灵魂粒子上升，复活与回营按钮浮现。',
    usage: '主角被击杀的瞬间；游戏视频里的“翻车”“团灭”名场面；复活/重来前的停顿。',
    params: [
      {name: 'bg', desc: 'true = 完整演示（地牢、主角、围攻者）；false = 仅叠加层（暗角、标题、灵魂、按钮）'},
      {name: 'title', desc: '大标题，默认“你倒下了”'},
      {name: 'sub', desc: '副标题（死因/地点）'},
      {name: 'revive / retreat', desc: '两个按钮的文字'},
      {name: 'cost', desc: '复活按钮上的消耗说明'},
    ],
  },
  Demo: () => <YouDied bg />,
  Layer: () => <YouDied />,
};
