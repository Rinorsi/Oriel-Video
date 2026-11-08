import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {C, Chest3D, DungeonWall, Dust, Embers, Gloom, GoldFrame, Icon, Label, RARITY_COL, Shaft, center, lerp, prog, snap} from './kit';
import {Chain, Floor, Pillars} from './partb-kit';

/**
 * rpg-chest-loot  (165f) - a vanilla chest (real 3D box from entity/chest/normal.png) drops in, rattles, bursts open with a
 * golden shaft of light; eight loot items arc out and land in rarity-framed slots; the last, unique item is lifted out,
 * enlarged and given a name plate.
 * Props: bg (full dungeon; false = chest, light, loot only), header (top label), unique (name of the unique item),
 *        uniqueStat (line under the name).
 */

const FRAMES = 165;

type Loot = {id: string; rarity: 'common' | 'rare' | 'unique'; count?: number};
const LOOT: Loot[] = [
  {id: 'arrow', rarity: 'common', count: 24},
  {id: 'iron_ingot', rarity: 'common', count: 6},
  {id: 'bread', rarity: 'common', count: 3},
  {id: 'emerald', rarity: 'rare', count: 9},
  {id: 'golden_apple', rarity: 'rare'},
  {id: 'enchanted_book', rarity: 'rare'},
  {id: 'diamond', rarity: 'rare', count: 2},
  {id: 'netherite_sword', rarity: 'unique'},
];
const SLOT = 160;
const GAP = 28;
const ROW_W = LOOT.length * SLOT + (LOOT.length - 1) * GAP;
const ROW_X = (1920 - ROW_W) / 2;
const ROW_Y = 880;
const MOUTH = {x: 960, y: 480};
const START = 34;
const STEP = 4.5;
const FLY = 24;

const slotCenter = (i: number) => ({x: ROW_X + i * (SLOT + GAP) + SLOT / 2, y: ROW_Y});
const landAt = (i: number) => START + i * STEP + (i === LOOT.length - 1 ? 6 : 0) + FLY;

const Slot: FC<{i: number; landed: number; t: number; dim: number}> = ({i, landed, t, dim}) => {
  const L = LOOT[i];
  const col = RARITY_COL[L.rarity];
  const c = slotCenter(i);
  const got = landed > 0;
  const flash = got ? Math.max(0, 1 - t / 14) : 0;
  return (
    <div style={{position: 'absolute', left: c.x - SLOT / 2, top: c.y - SLOT / 2, width: SLOT, height: SLOT, opacity: 1 - dim * 0.55}}>
      {got && L.rarity !== 'common' && <div style={{position: 'absolute', left: SLOT / 2 - 40, bottom: SLOT - 8, width: 80, height: 240 * (L.rarity === 'unique' ? 1.3 : 1), background: `linear-gradient(0deg, ${col}, rgba(0,0,0,0))`, opacity: 0.55 * (0.45 + 0.55 * flash), clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)', mixBlendMode: 'screen'}} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: got ? `linear-gradient(180deg, #1c140d, #0e0a06)` : '#0b0805',
          boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 6px ${got ? col : '#3a2d20'}, inset 0 0 0 10px ${C.ink}, inset 0 -12px 0 rgba(0,0,0,0.4)${got && L.rarity !== 'common' ? `, 0 0 ${28 + flash * 40}px ${col}88` : ''}`,
        }}
      />
      {got && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + (t < 5 ? (1 - t / 5) * -0.12 : 0)}, ${t < 5 ? 1 - (1 - t / 5) * 0.22 : 1})`}}>
          <Icon id={L.id} size={96} style={{filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.6))'}} />
        </div>
      )}
      {got && L.count && (
        <div style={{position: 'absolute', right: 14, bottom: 8}}>
          <Label size={36} color="#fff">{String(L.count)}</Label>
        </div>
      )}
      {flash > 0.5 && <div style={{position: 'absolute', inset: 6, background: col, opacity: (flash - 0.5) * 0.8, mixBlendMode: 'screen'}} />}
    </div>
  );
};

export const ChestLoot: FC<{bg?: boolean; header?: string; unique?: string; uniqueStat?: string}> = ({bg, header = '地牢宝箱', unique = '幽冥之刃', uniqueStat = '攻击力 38 · 暗影汲取 +12%'}) => {
  const f = useCurrentFrame();
  const drop = prog(f, 0, 12, EASE.in);
  const bounce = f >= 12 ? Math.exp(-(f - 12) / 4) * Math.sin((f - 12) * 1.1) * -14 : 0;
  const chestY = lerp(-560, 0, drop) + bounce;
  const rattle = f >= 14 && f < 24 ? Math.sin(f * 5) * (f - 12) * 0.35 : 0;
  const OPEN_AT = 24;
  const open = Math.min(1.1, EASE.back(clamp01((f - OPEN_AT) / 14)));
  const preGlow = prog(f, 12, 12, EASE.inOut);
  const glow = f < OPEN_AT ? 0 : 0.95 * (1 - prog(f, 90, 40, EASE.inOut) * 0.4);
  const beam = f < OPEN_AT ? 0 : 0.5 * (1 - prog(f, 80, 30) * 0.65);
  const cam = 1 + prog(f, 0, FRAMES, (t) => t) * 0.05;
  const lift = prog(f, 100, 22, EASE.back);
  const chestOut = prog(f, 98, 18, EASE.in);
  const dimRow = prog(f, 98, 12);
  const plate = prog(f, 122, 14, EASE.back);
  const uniqueI = LOOT.length - 1;
  const hdr = prog(f, 18, 14);

  // loot flight
  const flights = LOOT.map((L, i) => {
    const t0 = START + i * STEP + (i === uniqueI ? 6 : 0);
    const t = (f - t0) / FLY;
    return {L, i, t, t0};
  });
  const r = mulberry32(31);
  const seeds = LOOT.map(() => [r(), r(), r()]);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '50% 60%'}}>
        {bg && (
          <>
            <DungeonWall lights={[{x: 85, y: 330, r: 650}, {x: 1835, y: 330, r: 650}]} dim={0.74} />
            {/* the chest's own light */}
            <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(ellipse 760px 560px at 960px 580px, rgba(255,190,70,${0.1 * preGlow + 0.45 * Math.min(1, glow)}) 0%, rgba(0,0,0,0) 100%)`}} />
            <Floor y={690} />
            <Pillars />
            <Chain x={330} len={250} sway={Math.sin(f / 22) * 1.2} />
            <Chain x={1590} len={310} sway={Math.sin(f / 26 + 1) * 1.2} />
            <Chain x={520} len={140} sway={Math.sin(f / 20 + 2) * 1.5} />
            <Chain x={1400} len={170} sway={Math.sin(f / 24 + 3) * 1.5} />
          </>
        )}
        {/* shaft of light out of the chest */}
        <Shaft x={960} w={260} lean={0} opacity={beam} color="255,214,120" h={620} top={0} />
        <Shaft x={960} w={110} lean={0} opacity={beam * 0.9} color="255,244,200" h={620} top={0} />
        {bg && <div style={{position: 'absolute', left: 520, top: 760, width: 880, height: 48, background: `rgba(0,0,0,${0.5 * drop})`, clipPath: 'polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)'}} />}
        {/* chest */}
        <div style={{position: 'absolute', left: 960 - 182, top: 430 + chestY, opacity: 1 - chestOut, transform: `rotate(${rattle}deg) scale(${1 - chestOut * 0.25})`, transformOrigin: '50% 100%', zIndex: 2}}>
          <Chest3D s={26} open={open} glow={glow} yaw={-14} pitch={20} />
        </div>
        <Dust box={[400, 120, 1120, 700]} count={34} seed={4} opacity={0.5 * clamp01((f - OPEN_AT) / 10)} />
      </AbsoluteFill>
      {/* header */}
      <div style={{...center(56), flexDirection: 'column', gap: 12, opacity: hdr, transform: `translateY(${(1 - hdr) * -30}px)`}}>
        <Label size={60} color={C.gold3}>{header}</Label>
        <div style={{width: 320 * hdr, height: 6, background: `linear-gradient(90deg, rgba(168,116,26,0), ${C.gold1} 30%, ${C.gold2} 50%, ${C.gold1} 70%, rgba(168,116,26,0))`}} />
      </div>
      {/* slots */}
      {LOOT.map((L, i) => {
        const fl = flights[i];
        return <Slot key={i} i={i} landed={fl.t >= 1 ? 1 : 0} t={(f - fl.t0 - FLY)} dim={i === uniqueI ? 0 : dimRow} />;
      })}
      {/* flying loot */}
      {flights.map(({L, i, t}) => {
        if (t <= 0 || t >= 1) return null;
        if (i === uniqueI && f >= landAt(i)) return null;
        const e = EASE.out(Math.min(1, t * 1.15));
        const s = slotCenter(i);
        const apex = (i === uniqueI ? 420 : 260) + seeds[i][0] * 90;
        const x = lerp(MOUTH.x + (seeds[i][1] - 0.5) * 60, s.x, t < 1 ? EASE.inOut(t) * 0.35 + t * 0.65 : 1);
        const y = lerp(MOUTH.y, s.y, t * t * 0.55 + t * 0.45) - 4 * apex * e * (1 - e) * (1 - 0.0 * t);
        const size = lerp(72, 112, EASE.out(t));
        return (
          <div key={i} style={{position: 'absolute', left: snap(x, 2) - size / 2, top: snap(y, 2) - size / 2, width: size, height: size, transform: `rotate(${t * 540 * (seeds[i][2] > 0.5 ? 1 : -1)}deg)`, zIndex: 3}}>
            <Icon id={L.id} size={size} style={{filter: `drop-shadow(0 0 ${L.rarity === 'common' ? 0 : 14}px ${RARITY_COL[L.rarity]})`}} />
          </div>
        );
      })}
      {/* landing dust */}
      {flights.map(({i, t0}) => {
        const s = slotCenter(i);
        return <PixelBurst key={i} x={s.x} y={s.y + 50} at={t0 + FLY} count={10} colors={[RARITY_COL[LOOT[i].rarity], '#cfc7b8', '#8a8174']} speed={9} life={14} size={10} gravity={0.5} seed={i + 3} />;
      })}
      {/* opening burst */}
      <PixelBurst x={960} y={480} at={OPEN_AT + 4} count={46} colors={[C.gold3, C.gold2, '#fff']} speed={24} life={32} size={14} gravity={0.4} seed={17} />
      {f >= OPEN_AT + 2 && f < OPEN_AT + 8 && <AbsoluteFill style={{background: C.gold3, opacity: 0.35 * (1 - (f - OPEN_AT - 2) / 6), mixBlendMode: 'screen'}} />}
      <Embers box={[820, 500, 280, 80]} count={26} seed={7} rise={520} size={10} colors={[C.gold3, C.gold2, '#fff']} amount={clamp01((f - OPEN_AT) / 10) * (1 - prog(f, 100, 30) * 0.7)} life={60} />
      {/* the unique item, lifted and enlarged */}
      {f >= landAt(uniqueI) - 2 && (
        <>
          <AbsoluteFill style={{background: `rgba(0,0,0,${0.5 * lift})`}} />
          <div style={{position: 'absolute', inset: 0, opacity: lift}}>
            <Shaft x={960} w={420} lean={0} opacity={0.34} color="255,181,49" h={700} top={0} />
          </div>
          {(() => {
            const sc = slotCenter(uniqueI);
            const size = lerp(112, 384, EASE.out(lift));
            const cx = lerp(sc.x, 960, EASE.inOut(lift));
            const cy = lerp(sc.y, 330, EASE.inOut(lift)) + (lift >= 1 ? Math.sin(f / 10) * 8 : 0);
            return (
              <div style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size, transform: `rotate(${lerp(-20, -6, lift)}deg)`, zIndex: 4}}>
                <Icon id="netherite_sword" size={size} style={{filter: `drop-shadow(0 0 ${20 + 14 * Math.sin(f / 5)}px ${C.unique}) drop-shadow(8px 8px 0 rgba(0,0,0,0.6))`}} />
              </div>
            );
          })()}
          <Shockwave x={960} y={330} at={118} color={C.unique} maxR={420} life={22} width={24} seed={5} />
          <Embers box={[640, 360, 640, 120]} count={30} seed={11} rise={380} size={10} colors={[C.unique, C.gold3, '#fff']} amount={lift} life={56} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: clamp01(plate * 2), transform: `translateY(${(1 - plate) * 60}px) scale(${0.9 + 0.1 * plate})`}}>
            <GoldFrame w={820} h={230} rim={10} glow="rgba(255,181,49,0.3)" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
                <Label size={72} color={C.unique}>{unique}</Label>
                <div style={{padding: '6px 20px 10px', background: C.unique, boxShadow: `0 0 0 4px ${C.ink}, inset 0 -6px 0 #b37a10`}}>
                  <Label size={36} color="#2a1604" shadow={false}>独特</Label>
                </div>
              </div>
              <div style={{width: 640, height: 4, background: `linear-gradient(90deg, rgba(0,0,0,0), ${C.gold1}, rgba(0,0,0,0))`}} />
              <Label size={36} color="#e8e0d0">{uniqueStat}</Label>
            </GoldFrame>
          </div>
        </>
      )}
      {bg && <Gloom s={0.4} />}
      <Sfx at={8} src={mcSound('dig/stone1')} volume={0.4} rate={0.8} />
      <Sfx at={16} src={mcSound('dig/wood1')} volume={0.2} rate={0.7} />
      <Sfx at={OPEN_AT} src={mcSound('block/chest/open')} volume={0.6} />
      <Sfx at={OPEN_AT + 2} src={mcSound('random/orb')} volume={0.3} rate={0.7} />
      {LOOT.map((L, i) => (
        <Sfx key={i} at={landAt(i)} src={mcSound(L.rarity === 'common' ? 'random/pop' : 'random/orb')} volume={L.rarity === 'common' ? 0.25 : 0.3} rate={L.rarity === 'common' ? 0.9 + i * 0.08 : 0.9 + i * 0.05} />
      ))}
      <Sfx at={100} src={mcSound('ui/toast/challenge_complete')} volume={0.4} />
      <Sfx at={118} src={mcSound('random/levelup')} volume={0.3} />
    </AbsoluteFill>
  );
};
export const entryChest: FxEntry = {
  meta: {
    id: 'rpg-chest-loot',
    name: '地牢宝箱',
    category: 'rpg',
    tags: ['RPG', '地下城', '宝箱', '战利品', '稀有度', '开箱'],
    frames: FRAMES,
    blurb: '原版贴图的 3D 宝箱砸落、抖动、猛然弹开，金色光柱冲起；八件战利品飞出落进按稀有度描边的格子，最后一件“独特”武器被放大高亮并亮出铭牌。',
    usage: '开宝箱、领奖励、拿到传说装备的名场面；也可只用叠加层把战利品展示放到别的画面上。',
    params: [
      {name: 'bg', desc: 'true = 完整地牢场景；false = 只有宝箱、光柱与战利品（透明，可叠加）'},
      {name: 'header', desc: '顶部标签文字'},
      {name: 'unique', desc: '独特物品名称（默认“幽冥之刃”）'},
      {name: 'uniqueStat', desc: '铭牌下方的属性行'},
      {name: 'LOOT（源码常量）', desc: '八件战利品的物品 id、稀有度与数量，稀有度颜色 #cfcfcf / #4aa8ff / #ffb531'},
    ],
  },
  Demo: () => <ChestLoot bg />,
  Layer: () => <ChestLoot />,
};
