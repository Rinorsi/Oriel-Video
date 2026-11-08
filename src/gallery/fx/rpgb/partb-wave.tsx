import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Shake, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {C, DungeonWall, Embers, FantasyTitle, Gloom, GoldFrame, Label, Mob, PxSkull, SpiderFront, center, lerp, prog, snap} from './kit';
import {Chain, Floor, Pillars} from './partb-kit';

/**
 * rpg-wave-start  (135f) - red hazard bars and edge glow pulse, "第 N 波" slams in, enemy silhouettes (real mob textures)
 * march in from both sides and are half-revealed by torch light, a segmented counter fills with the incoming enemy count.
 * Props: bg (dungeon wall/floor/torches; false = overlay + enemies only), wave (number), total (waves), enemies (counter max),
 *        note (line under the title).
 */

const FRAMES = 135;

type Foe = {mob: string; x: number; feet: number; s: number; side: 'l' | 'r'; at: number; spider?: boolean};
const FOES: Foe[] = [
  {mob: 'skeleton', x: 330, feet: 1010, s: 12, side: 'l', at: 20},
  {mob: 'creeper', x: 500, feet: 1040, s: 12, side: 'l', at: 24},
  {mob: 'zombie', x: 110, feet: 1100, s: 15, side: 'l', at: 28},
  {mob: 'spider', x: 290, feet: 1060, s: 10, side: 'l', at: 32, spider: true},
  {mob: 'enderman', x: 1330, feet: 1020, s: 8, side: 'r', at: 22},
  {mob: 'pillager', x: 1500, feet: 960, s: 10, side: 'r', at: 26},
  {mob: 'witherSkeleton', x: 1420, feet: 1040, s: 12, side: 'r', at: 30},
  {mob: 'husk', x: 1590, feet: 1100, s: 15, side: 'r', at: 34},
];

const Pip: FC<{on: boolean; flash: number}> = ({on, flash}) => (
  <div style={{width: 26, height: 26, background: on ? `linear-gradient(180deg, #ff9a8a, ${C.blood} 50%, #7a1515)` : '#1a120c', boxShadow: `0 0 0 4px ${C.ink}${on && flash > 0 ? `, 0 0 ${20 * flash}px ${C.blood}` : ''}`}} />
);

export const WaveStart: FC<{bg?: boolean; wave?: number; total?: number; enemies?: number; note?: string}> = ({bg, wave = 3, total = 5, enemies = 16, note = '清除全部敌人以继续'}) => {
  const f = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(Math.max(0, f - 4) * 0.45);
  const barIn = prog(f, 0, 8, EASE.out);
  const flash = f < 8 ? 0.55 * (1 - f / 8) : 0;
  const tIn = prog(f, 12, 8, EASE.out);
  const settle = f > 20 ? Math.exp(-(f - 20) / 5) * Math.sin((f - 20) * 1.2) * 0.03 : 0;
  const shakeOn = f >= 12 && f < 24;
  const pipsOn = Math.round(prog(f, 36, 38, (t) => t) * enemies);
  const countIn = prog(f, 30, 12, EASE.back);
  const reveal = prog(f, 54, 20, EASE.out);
  const noteIn = prog(f, 26, 12);
  const sx = (v: number) => ({transform: `translateX(${v}px)`});
  void sx;
  const stripeShift = f * 3;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Shake at={12} life={12} strength={10}>
        {bg && (
          <>
            <DungeonWall lights={[{x: 85, y: 330, r: 650}, {x: 1835, y: 330, r: 650}]} dim={0.72} />
            <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(ellipse 80% 60% at 50% 60%, rgba(160,24,24,${0.1 + 0.18 * pulse}) 0%, rgba(0,0,0,0) 100%)`}} />
            <Floor y={740} />
            <Pillars />
            <Chain x={420} len={200} sway={Math.sin(f / 20) * 1.4} />
            <Chain x={1500} len={240} sway={Math.sin(f / 24 + 1) * 1.4} />
          </>
        )}
        {/* enemy silhouettes */}
        {FOES.map((e, i) => {
          const t = clamp01((f - e.at) / 34);
          const walking = t > 0 && t < 1;
          const away = (1 - EASE.out(t)) * (e.side === 'l' ? -1 : 1) * 820;
          const bob = walking ? Math.abs(Math.sin(f * 0.8 + i)) * 14 : 0;
          const bright = lerp(0.1, 0.5, reveal);
          const rim = `drop-shadow(0 0 ${6 + 10 * pulse}px rgba(255,64,40,${0.55 + 0.35 * pulse}))`;
          const filter = `brightness(${bright}) ${rim}`;
          const mobEl = e.spider ? <SpiderFront scale={e.s} filter={filter} /> : <Mob mob={e.mob} scale={e.s} filter={filter} />;
          const w = e.spider ? 28 * e.s : e.mob === 'enderman' ? 16 * e.s : 16 * e.s;
          const h = e.spider ? 22 * e.s : (e.mob === 'enderman' ? 46 : e.mob === 'pillager' ? 34 : 32) * e.s;
          return (
            <div key={i} style={{position: 'absolute', left: e.x, top: e.feet - h - bob, transform: `translateX(${away}px) scaleX(${e.side === 'r' && !e.spider ? -1 : 1})`, opacity: t > 0 ? 1 : 0, zIndex: e.feet}}>
              <div style={{position: 'absolute', left: -6, top: h - 8, width: w + 12, height: 22, background: 'rgba(0,0,0,0.55)', clipPath: 'polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)'}} />
              {mobEl}
            </div>
          );
        })}
        <Embers box={[300, 700, 1320, 300]} count={14} seed={19} rise={300} size={8} colors={[C.ember, C.blood, C.torch]} life={80} amount={prog(f, 20, 20)} />
      </Shake>
      {/* edge glow */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 220px 40px rgba(198,43,43,${0.18 + 0.4 * pulse})`, opacity: barIn}} />
      {bg && <Gloom s={0.45} color="20,2,2" />}
      {/* hazard bars */}
      {[0, 1].map((k) => (
        <div key={k} style={{position: 'absolute', left: 0, right: 0, [k === 0 ? 'top' : 'bottom']: 0, height: 64, transform: `translateY(${(1 - barIn) * (k === 0 ? -80 : 80)}px)`, backgroundImage: `repeating-linear-gradient(${k === 0 ? -45 : 45}deg, ${C.blood} 0 28px, #14090a 28px 56px)`, backgroundPosition: `${k === 0 ? stripeShift : -stripeShift}px 0`, boxShadow: `0 ${k === 0 ? 8 : -8}px 0 ${C.ink}, 0 ${k === 0 ? 24 : -24}px 60px rgba(198,43,43,${0.4 + 0.3 * pulse})`, opacity: 0.55 + 0.45 * (f < 8 ? 1 : 0.7 + 0.3 * pulse)}} />
      ))}
      {/* corner alarm plates */}
      {[100, 1820].map((x, i) => (
        <div key={i} style={{position: 'absolute', left: x - 56, top: 84, width: 112, height: 112, transform: `scale(${prog(f, 4, 8, EASE.back)})`, background: '#140a0a', boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 6px ${C.blood}, 0 0 ${24 * pulse}px ${C.blood}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <PxSkull size={64} color={pulse > 0.5 ? '#ff9a8a' : C.common} />
        </div>
      ))}
      {/* wave pips */}
      <div style={{...center(98), gap: 20, opacity: prog(f, 6, 8)}}>
        {Array.from({length: total}, (_, i) => {
          const cur = i + 1 === wave;
          const done = i + 1 < wave;
          return <div key={i} style={{width: cur ? 44 : 28, height: cur ? 44 : 28, transform: 'rotate(45deg)', background: cur ? C.torch : done ? C.gold1 : '#2a1a14', boxShadow: `0 0 0 4px ${C.ink}${cur ? `, 0 0 ${18 + 14 * pulse}px ${C.ember}` : ''}`}} />;
        })}
      </div>
      {/* title */}
      <div style={{...center(150), gap: 36, opacity: clamp01((f - 12) / 3), transform: `scale(${lerp(2.6, 1, tIn) + settle})`, transformOrigin: '50% 50%'}}>
        <FantasyTitle size={190} tone="blood" spacing={0.04}>第</FantasyTitle>
        <FantasyTitle size={300} tone="gold" spacing={0.02}>{String(wave)}</FantasyTitle>
        <FantasyTitle size={190} tone="blood" spacing={0.04}>波</FantasyTitle>
      </div>
      <Shockwave x={960} y={350} at={13} color="#ff6a50" maxR={560} life={22} width={22} seed={wave} />
      <div style={{...center(520), opacity: noteIn, transform: `translateY(${(1 - noteIn) * 20}px)`}}>
        <Label size={48} color="#e6d6c8">{note}</Label>
      </div>
      {/* counter */}
      <div style={{...center(620), opacity: clamp01(countIn * 2), transform: `translateY(${(1 - countIn) * 50}px)`}}>
        <GoldFrame w={700} h={150} rim={10} glow="rgba(198,43,43,0.25)" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
            <Label size={48} color={C.common}>敌人</Label>
            <Label size={60} color="#ff8a78">{`${String(pipsOn).padStart(2, ' ')} / ${enemies}`}</Label>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            {Array.from({length: enemies}, (_, i) => (
              <Pip key={i} on={i < pipsOn} flash={i === pipsOn - 1 ? 1 : 0} />
            ))}
          </div>
        </GoldFrame>
      </div>
      {flash > 0 && <AbsoluteFill style={{background: C.blood, opacity: flash, mixBlendMode: 'screen'}} />}
      <Sfx at={2} src={mcSound('ambient/weather/thunder1')} volume={0.35} rate={0.75} cut={40} />
      <Sfx at={12} src={reelSfx('impact-cine.mp3')} volume={0.55} />
      <Sfx at={12} src={mcSound('random/explode2')} volume={0.25} rate={0.6} />
      {FOES.map((e, i) => (
        <Sfx key={i} at={e.at + 28} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.2} rate={0.7 + (i % 3) * 0.1} />
      ))}
      <Sfx at={30} src={mcSound('ui/toast/in')} volume={0.3} rate={0.8} />
      <Sfx at={36} src={mcSound('random/click')} volume={0.12} />
      <Sfx at={58} src={mcSound('item/armor/equip_netherite1')} volume={0.25} rate={0.7} />
    </AbsoluteFill>
  );
};
void snap;

export const entryWave: FxEntry = {
  meta: {
    id: 'rpg-wave-start',
    name: '战斗波次',
    category: 'rpg',
    tags: ['RPG', '地下城', '波次', '战斗', '警报', '敌人'],
    frames: FRAMES,
    blurb: '上下红黑警示条与边缘红光脉冲，“第 3 波”大字砸下，八个敌人剪影（真实生物贴图）从两侧列队入场并被火光半照亮，下方计数条随敌人数量逐格点亮。',
    usage: '塔防/刷怪/竞技场类玩法里每一波开始；视频里“下一轮攻势”“敌袭”的预警镜头。',
    params: [
      {name: 'bg', desc: 'true = 带地牢背景；false = 仅警示条、标题、敌人与计数（可叠加）'},
      {name: 'wave / total', desc: '当前波次 / 总波次（顶部菱形指示灯与大字数字）'},
      {name: 'enemies', desc: '计数条上限（格数与数字）'},
      {name: 'note', desc: '标题下方的提示语'},
    ],
  },
  Demo: () => <WaveStart bg />,
  Layer: () => <WaveStart />,
};
