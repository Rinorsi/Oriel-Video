import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {tex} from '../../../mc/assets';
import {HeartIcon, HpBar, Plus, Ribbon, gradOf} from './bars';
import {Bold, Burst, C, DungeonBg, EASE, Fancy, Flash, GOLD_GRAD, Glint, Item, Label, MobFigure, Shake, clamp01, jiggle, lerp, prog, snap} from './common';

/**
 * rpg-damage-numbers: floating combat text over a fight. Five kinds - normal (white), crit (big gold + hit glint + chip),
 * fire (orange + ember trail), poison (green ticks), heal (green + heart). Numbers pop, then drift along an arc and fade.
 * Props: `bg` - dungeon + fighters (Demo). Without it (Layer) only the numbers/hit sparks are drawn, at the same coordinates.
 * Edit HITS (at / foe / kind / v) and FOES to retarget.
 */

export const DAMAGE_FRAMES = 170;

type Kind = 'normal' | 'crit' | 'fire' | 'poison' | 'heal';
type Hit = {at: number; foe: number; kind: Kind; v: number; dx?: number};
const FEET = 950;
const S = 13;
const FOES = [
  {kind: 'skeleton' as const, x: 760, hp: 1200, h: 32},
  {kind: 'zombie' as const, x: 1120, hp: 1100, h: 32},
  {kind: 'creeper' as const, x: 1480, hp: 700, h: 26},
  {kind: 'player' as const, x: 330, hp: 0, h: 32},
];

const HITS: Hit[] = [
  {at: 14, foe: 0, kind: 'normal', v: 128, dx: -30},
  {at: 22, foe: 1, kind: 'normal', v: 96, dx: 24},
  {at: 30, foe: 2, kind: 'normal', v: 142},
  {at: 40, foe: 1, kind: 'crit', v: 486},
  {at: 54, foe: 0, kind: 'fire', v: 64, dx: 40},
  {at: 62, foe: 0, kind: 'fire', v: 58, dx: -36},
  {at: 58, foe: 2, kind: 'poison', v: 12, dx: -30},
  {at: 70, foe: 2, kind: 'poison', v: 12, dx: 30},
  {at: 82, foe: 2, kind: 'poison', v: 12, dx: -10},
  {at: 74, foe: 3, kind: 'heal', v: 85},
  {at: 88, foe: 0, kind: 'crit', v: 612},
  {at: 100, foe: 1, kind: 'fire', v: 72, dx: -20},
  {at: 106, foe: 2, kind: 'normal', v: 156},
  {at: 114, foe: 1, kind: 'normal', v: 118, dx: 30},
];

const KIND = {
  normal: {size: 100, life: 42, rise: 170, fill: 'linear-gradient(180deg,#ffffff 0%,#e4e0d6 50%,#a8a398 100%)', edge: C.ink},
  crit: {size: 176, life: 58, rise: 230, fill: GOLD_GRAD, edge: C.ink},
  fire: {size: 108, life: 46, rise: 180, fill: 'linear-gradient(180deg,#fff2a8 0%,#ffa23a 50%,#e0500e 100%)', edge: '#2a0c04'},
  poison: {size: 80, life: 48, rise: 150, fill: 'linear-gradient(180deg,#e2ffb0 0%,#8be04a 50%,#3f8f1c 100%)', edge: '#0d1a06'},
  heal: {size: 112, life: 54, rise: 190, fill: 'linear-gradient(180deg,#e4ffe8 0%,#6bff8a 50%,#1fa04a 100%)', edge: '#06180c'},
} as const;

const foeHead = (i: number): [number, number] => [FOES[i].x, FEET - FOES[i].h * S];

const NumberFx: FC<{h: Hit}> = ({h}) => {
  const f = useCurrentFrame();
  const k = KIND[h.kind];
  const t = (f - h.at) / k.life;
  if (t < 0 || t > 1) return null;
  const [hx, hy] = foeHead(h.foe);
  const pop = t < 0.14 ? lerp(0.3, h.kind === 'crit' ? 1.45 : 1.3, EASE.out(t / 0.14)) : lerp(h.kind === 'crit' ? 1.45 : 1.3, 1, EASE.out(clamp01((t - 0.14) / 0.18)));
  const dx = (h.dx ?? 0) * 2.2 * EASE.out(t);
  const wob = h.kind === 'poison' ? Math.sin(t * 14) * 10 : 0;
  const x = hx + (h.dx ?? 0) + dx * 0.4 + wob;
  const y = hy - 40 - k.rise * EASE.out(clamp01(t * 1.15)) + (t > 0.5 ? (t - 0.5) * (t - 0.5) * 120 : 0);
  const op = 1 - clamp01((t - 0.62) / 0.38);
  const tilt = h.kind === 'crit' ? (h.dx ?? 0) * 0.02 + Math.sin(t * 20) * 2 * (1 - t) : 0;
  const text = (h.kind === 'heal' ? '+' : '') + h.v;
  return (
    <div style={{position: 'absolute', left: x - 400, top: y - 90, width: 800, height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: op, transform: `scale(${pop}) rotate(${tilt}deg)`}}>
      {h.kind === 'fire' && <Item id="fire_charge" size={64} style={{filter: 'drop-shadow(0 0 12px #ff7a1a)'}} />}
      {h.kind === 'poison' && <Item id="fermented_spider_eye" size={52} style={{filter: 'drop-shadow(0 0 10px #8be04a)'}} />}
      {h.kind === 'heal' && <HeartIcon src={tex('gui/sprites/hud/heart/full.png')} size={54} style={{filter: 'drop-shadow(0 0 12px #6bff8a)'}} />}
      <Fancy size={k.size} fill={k.fill} edge={k.edge}>
        {text}
      </Fancy>
      {h.kind === 'crit' && (
        <div style={{position: 'absolute', top: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{padding: '2px 18px', background: 'linear-gradient(180deg,#5a1510,#2a0a08)', border: `4px solid ${C.gold2}`, boxShadow: `0 0 0 3px ${C.ink}, 0 0 20px ${C.gold2}`, transform: 'translateY(-34px)'}}>
            <Label size={24} color={C.gold3}>
              暴击
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

const HitFx: FC<{h: Hit}> = ({h}) => {
  const [hx, hy] = foeHead(h.foe);
  const cy = hy + 120;
  const at = h.at;
  const f = useCurrentFrame();
  if (h.kind === 'normal')
    return (
      <>
        <Glint x={hx} y={cy} t={(f - at) / 8} size={70} />
        <Burst x={hx} y={cy} at={at} count={10} colors={['#fff', '#ffe9a8', '#ffc85a']} speed={11} life={16} size={10} gravity={0.5} seed={h.at} />
      </>
    );
  if (h.kind === 'crit')
    return (
      <>
        <Glint x={hx} y={cy} t={(f - at) / 12} size={190} color="#fff2c0" />
        <Burst x={hx} y={cy} at={at} count={34} colors={[C.gold3, C.gold2, '#fff', C.torch]} speed={21} life={30} size={14} gravity={0.5} seed={h.at} />
        <Flash at={at} life={6} peak={0.4} color="#ffe9a8" />
      </>
    );
  if (h.kind === 'fire')
    return <Burst x={hx} y={cy - 20} at={at} count={16} colors={['#ffd23f', '#ff9a3c', '#ff6a1f', '#fff2a8']} speed={7} life={30} size={12} gravity={-0.25} dir={-Math.PI / 2} spread={0.9} seed={h.at} />;
  if (h.kind === 'poison')
    return <Burst x={hx} y={cy} at={at} count={12} colors={['#8be04a', '#5fae2e', '#c6f58a']} speed={5} life={34} size={12} gravity={-0.18} dir={-Math.PI / 2} spread={1} seed={h.at} glow={false} />;
  const p = prog(f, at, 34, EASE.out);
  return (
    <>
      {f >= at && f < at + 36 &&
        [-90, -45, 0, 45, 90].map((o, i) => <Plus key={i} x={hx + o} y={cy - 40 - p * 150 - (i % 2) * 30} s={8} opacity={1 - p} />)}
    </>
  );
};

const Fighter: FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const F = FOES[i];
  const hits = HITS.filter((h) => h.foe === i && h.kind !== 'poison' && h.kind !== 'heal' && f >= h.at);
  const last = hits.length ? hits[hits.length - 1] : null;
  const since = last ? f - last.at : 99;
  const hurt = since < 5 ? 1 - since / 5 : 0;
  const knock = last && since < 14 ? jiggle(since / 14, 1.5, 3) * (last.kind === 'crit' ? 36 : 14) : 0;
  const poisoned = i === 2 && f >= 58 && f < 110;
  const bob = Math.sin(f / 6 + i) * 3;
  const hit = i === 3 ? HITS.find((h) => h.foe === 3) : null;
  void hit;
  // hero lunges forward a little on each outgoing hit
  const lunge = i === 3 ? HITS.filter((h) => h.foe !== 3 && h.kind !== 'poison' && h.kind !== 'fire' && f >= h.at && f < h.at + 8).reduce((m, h) => Math.max(m, jiggle((f - h.at) / 8, 1, 2) * 40), 0) : 0;
  const dmg = HITS.filter((h) => h.foe === i && h.kind !== 'heal').reduce((s, h) => s + h.v * prog(f, h.at, 8), 0);
  const ghostDmg = HITS.filter((h) => h.foe === i && h.kind !== 'heal').reduce((s, h) => s + h.v * prog(f, h.at + 14, 14), 0);
  const w = F.kind === 'creeper' ? 8 * S : 16 * S;
  return (
    <>
      <div style={{position: 'absolute', left: F.x - w * 0.6, top: FEET - 14, width: w * 1.2, height: 30, background: 'radial-gradient(ellipse, rgba(0,0,0,.65), rgba(0,0,0,0) 70%)'}} />
      <div style={{position: 'absolute', left: F.x - w / 2 + knock * (i === 3 ? 0 : 1) + lunge, top: FEET - F.h * S + bob, filter: poisoned ? 'drop-shadow(0 0 16px #8be04a) sepia(0.25) hue-rotate(40deg)' : undefined}}>
        <MobFigure kind={F.kind} s={S} hurt={hurt} skin="steve" />
      </div>
      {i < 3 && (
        <div style={{position: 'absolute', left: F.x - 100, top: FEET - F.h * S - 60 + bob}}>
          <HpBar w={200} h={24} value={1 - dmg / F.hp} ghost={1 - ghostDmg / F.hp} color={poisoned ? '#6fae2e' : '#d93a2b'} />
        </div>
      )}
    </>
  );
};

const Total: FC = () => {
  const f = useCurrentFrame();
  const sum = HITS.filter((h) => h.kind !== 'heal').reduce((s, h) => s + h.v * prog(f, h.at, 10), 0);
  const last = HITS.filter((h) => h.kind !== 'heal' && f >= h.at && f < h.at + 8).length;
  const pulse = last ? 1 + 0.06 * Math.sin(((f % 8) / 8) * Math.PI) : 1;
  const show = prog(f, 4, 12, EASE.back);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 56, display: 'flex', justifyContent: 'center', transform: `scale(${show * pulse})`, opacity: clamp01(show * 2)}}>
      <Ribbon w={720} h={128}>
        <Label size={48} color={C.gold3}>
          总伤害
        </Label>
        <Fancy size={92} fill={GOLD_GRAD}>
          {String(Math.round(sum))}
        </Fancy>
      </Ribbon>
    </div>
  );
};

const DamageScene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const content = (
    <>
      {bg && [0, 1, 2, 3].map((i) => <Fighter key={i} i={i} />)}
      {HITS.map((h, i) => (
        <HitFx key={'s' + i} h={h} />
      ))}
      {HITS.map((h, i) => (
        <NumberFx key={'n' + i} h={h} />
      ))}
      {bg && <Total />}
      {HITS.filter((h) => h.kind === 'crit').map((h, i) => (
        <Sfx key={'c' + i} at={h.at} src={mcSound('random/anvil_land')} volume={0.4} rate={1.4} />
      ))}
      {HITS.filter((h) => h.kind === 'normal').map((h, i) => (
        <Sfx key={'n' + i} at={h.at} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.35} rate={1.2} />
      ))}
      {HITS.filter((h) => h.kind === 'fire').map((h, i) => (
        <Sfx key={'f' + i} at={h.at} src={mcSound('fire/ignite')} volume={0.2} rate={1.5} />
      ))}
      {HITS.filter((h) => h.kind === 'poison').map((h, i) => (
        <Sfx key={'p' + i} at={h.at} src={mcSound('dig/gravel1')} volume={0.2} rate={1.8} />
      ))}
      {HITS.filter((h) => h.kind === 'heal').map((h, i) => (
        <Sfx key={'h' + i} at={h.at} src={mcSound('random/orb')} volume={0.4} />
      ))}
    </>
  );
  void f;
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={HITS.filter((h) => h.kind === 'crit').map((h) => h.at)} life={10} strength={18}>
      <DungeonBg>{content}</DungeonBg>
    </Shake>
  );
};

export const DamageNumbers = DamageScene;
void gradOf;
void snap;
