import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {Bold, Brackets, Burst, C, Cursor, DSlot, DungeonBg, EASE, Fancy, Flash, Frame, GOLD_GRAD, Glint, Item, Label, MobFigure, RARITY, clamp01, jiggle, lerp, mix, prog, rgba, type RarityKey} from './common';

/**
 * rpg-gear-panel: a dungeon-style inventory screen. Hero + equipment (melee / ranged / armour) + three artifact slots + bag grid.
 * A cursor picks the unique diamond sword in the bag; the comparison panel slides in from the right, power rolls 198 -> 236 with a green
 * arrow, the three enchantment slots light up one by one, then the sword is dragged onto the melee slot and swaps with the old one.
 * Props: `bg` - dungeon backdrop (Demo). Layer: the UI only.
 * Edit BAG / EQUIP / ARTIFACTS / ENCH below.
 */

export const GEAR_FRAMES = 190;

type It = {id?: string; rar?: RarityKey};
const BAG: It[] = [
  {id: 'stone_sword', rar: 'common'},
  {id: 'bow', rar: 'common'},
  {id: 'crossbow_standby', rar: 'rare'},
  {id: 'chainmail_chestplate', rar: 'rare'},
  {id: 'golden_apple', rar: 'common'},
  {id: 'golden_sword', rar: 'rare'},
  {id: 'iron_chestplate', rar: 'common'},
  {id: 'diamond_sword', rar: 'unique'},
  {id: 'experience_bottle', rar: 'common'},
  {},
  {id: 'iron_pickaxe', rar: 'common'},
  {id: 'iron_helmet', rar: 'common'},
  {},
  {id: 'enchanted_book', rar: 'rare'},
  {},
];
const SEL = 7;
const GX = 610;
const GY = 490;
const CELL = 112;
const GAP = 12;
const cellC = (i: number): [number, number] => [GX + (i % 5) * (CELL + GAP) + CELL / 2, GY + Math.floor(i / 5) * (CELL + GAP) + CELL / 2];
const EQX = 610;
const EQ_Y = 200;
const EQ_S = 140;
const eqC = (k: number): [number, number] => [EQX + k * (EQ_S + 24) + EQ_S / 2, EQ_Y + EQ_S / 2];
const ARTIFACTS = ['firework_rocket', 'blaze_rod', 'ender_pearl'];
const ENCH = [
  {id: 'diamond', name: '锋利', at: 86},
  {id: 'blaze_powder', name: '灼烧', at: 96},
  {id: 'ghast_tear', name: '吸血', at: 106},
];
const SWAP_AT = 132;

const waypoints: [number, number, number][] = [
  [0, 1500, 960],
  [34, 1300, 800],
  [56, cellC(SEL)[0] + 6, cellC(SEL)[1] + 6],
  [114, cellC(SEL)[0] + 6, cellC(SEL)[1] + 6],
  [SWAP_AT, eqC(0)[0] + 20, eqC(0)[1] + 20],
  [160, 1000, 960],
  [190, 1000, 960],
];
const cursorAt = (f: number): [number, number] => {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [f0, x0, y0] = waypoints[i];
    const [f1, x1, y1] = waypoints[i + 1];
    if (f >= f0 && f <= f1) {
      const t = EASE.inOut(clamp01((f - f0) / (f1 - f0)));
      return [lerp(x0, x1, t), lerp(y0, y1, t)];
    }
  }
  const l = waypoints[waypoints.length - 1];
  return [l[1], l[2]];
};

const SlotItem: FC<{it: It; size: number; pop?: number; sel?: boolean; hidden?: boolean; glow?: number}> = ({it, size, pop = 1, sel, hidden, glow = 0}) => {
  const col = it.rar ? RARITY[it.rar].color : '#5a4730';
  return (
    <DSlot size={size} edge={it.id ? col : '#4a3b28'} sel={sel} glow={sel ? 1 : glow} style={{transform: `scale(${pop})`, opacity: clamp01(pop * 2)}}>
      {it.id && !hidden && <Item id={it.id} size={size * 0.7} style={{filter: it.rar === 'unique' ? 'drop-shadow(0 0 10px #ffb531)' : undefined}} />}
      {it.rar === 'unique' && !hidden && <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,181,49,.2), rgba(255,181,49,0) 60%)'}} />}
    </DSlot>
  );
};

const Stat: FC<{label: string; from: number; to: number; t: number}> = ({label, from, to, t}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: clamp01(t * 3), transform: `translateX(${(1 - t) * 30}px)`}}>
    <Label size={24} color="#d9c9a0" style={{width: 110, textAlign: 'left'}}>
      {label}
    </Label>
    <Bold size={36} color="#bdb29a">
      {String(from)}
    </Bold>
    <Bold size={32} color="#6a5a44">
      →
    </Bold>
    <Bold size={40} color={C.heal}>
      {String(Math.round(lerp(from, to, t)))}
    </Bold>
  </div>
);

const Gear: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const frameIn = prog(f, 0, 14, EASE.out);
  const [cx, cy] = cursorAt(f);
  const selOn = f >= 58 && f < SWAP_AT;
  const comp = prog(f, 62, 18, EASE.out);
  const swapped = f >= SWAP_AT + 4;
  const dragging = f >= 114 && f < SWAP_AT + 2;
  const press = (f >= 54 && f < 60) || (f >= SWAP_AT - 2 && f < SWAP_AT + 3) ? 1 : 0;
  const power = Math.round(lerp(198, 236, prog(f, 70, 20, EASE.inOut)));
  const total = Math.round(412 + 38 * prog(f, SWAP_AT + 2, 20, EASE.inOut));
  const content = (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, opacity: frameIn, transform: `translateY(${(1 - frameIn) * -40}px)`}}>
        <div style={{position: 'absolute', left: 130, top: 70}}>
          <Frame w={1660} h={940} mat="stone" pad={30} />
        </div>
        {/* title strip */}
        <div style={{position: 'absolute', left: 130, top: 70, width: 1660, display: 'flex', justifyContent: 'center', transform: 'translateY(-34px)'}}>
          <div style={{padding: '4px 70px', background: 'linear-gradient(180deg,#3a2616,#150e09)', border: `6px solid ${C.gold1}`, boxShadow: `0 0 0 4px ${C.ink}, 0 8px 0 4px rgba(0,0,0,.5)`}}>
            <Fancy size={60} spacing={14}>
              装备
            </Fancy>
          </div>
        </div>
        {/* hero niche */}
        <div style={{position: 'absolute', left: 200, top: 180, width: 360, height: 520, boxSizing: 'border-box', border: `6px solid #6a5538`, boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 60px rgba(0,0,0,.7)`, background: 'radial-gradient(ellipse at 50% 70%, rgba(255,160,60,.28), rgba(30,18,10,.95) 70%)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 74, top: 76, filter: swapped ? 'brightness(1.12)' : undefined}}>
            <MobFigure kind="player" s={13} />
          </div>
          <div style={{position: 'absolute', left: 70, bottom: 14, width: 220, height: 24, background: 'radial-gradient(ellipse, rgba(0,0,0,.7), rgba(0,0,0,0) 70%)'}} />
          {swapped && <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(255,200,90,${0.35 * (1 - prog(f, SWAP_AT + 4, 24))}), rgba(0,0,0,0) 70%)`}} />}
        </div>
        <div style={{position: 'absolute', left: 200, top: 130, width: 360, display: 'flex', justifyContent: 'center'}}>
          <Label size={36} color={C.gold3}>
            勇者 · Lv.18
          </Label>
        </div>
        {/* artifacts */}
        <div style={{position: 'absolute', left: 200, top: 740, width: 360, display: 'flex', justifyContent: 'space-between'}}>
          {ARTIFACTS.map((id, i) => (
            <SlotItem key={i} it={{id, rar: 'rare'}} size={108} pop={prog(f, 18 + i * 4, 10, EASE.back)} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 200, top: 862, width: 360, display: 'flex', justifyContent: 'center'}}>
          <Label size={36} color="#a89878">
            神器
          </Label>
        </div>
        {/* equipment */}
        {[
          {it: swapped ? ({id: 'diamond_sword', rar: 'unique'} as It) : ({id: 'iron_sword', rar: 'rare'} as It), name: '近战'},
          {it: {id: 'bow', rar: 'common'} as It, name: '远程'},
          {it: {id: 'iron_chestplate', rar: 'rare'} as It, name: '护甲'},
        ].map((e, k) => {
          const flash = k === 0 && swapped ? 1 - prog(f, SWAP_AT + 4, 20) : 0;
          return (
            <div key={k} style={{position: 'absolute', left: EQX + k * (EQ_S + 24), top: EQ_Y - 50, width: EQ_S, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
              <Label size={24} color="#a89878">
                {e.name}
              </Label>
              <SlotItem it={e.it} size={EQ_S} pop={prog(f, 14 + k * 4, 10, EASE.back)} glow={flash} hidden={k === 0 && dragging && false} sel={k === 0 && swapped && f < SWAP_AT + 30} />
            </div>
          );
        })}
        {swapped && f < SWAP_AT + 24 && <Glint x={eqC(0)[0]} y={eqC(0)[1]} t={(f - SWAP_AT - 4) / 18} size={110} />}
        {/* bag */}
        <div style={{position: 'absolute', left: GX, top: GY - 54, width: 5 * CELL + 4 * GAP, display: 'flex', alignItems: 'center', gap: 16}}>
          <Label size={36} color="#a89878">
            背包
          </Label>
          <div style={{flex: 1, height: 4, background: 'linear-gradient(90deg, #6a5538, rgba(106,85,56,0))'}} />
        </div>
        {BAG.map((it, i) => {
          const [x, y] = cellC(i);
          const isSel = i === SEL;
          const shown: It = isSel && swapped ? {id: 'iron_sword', rar: 'rare'} : it;
          return (
            <div key={i} style={{position: 'absolute', left: x - CELL / 2, top: y - CELL / 2}}>
              <SlotItem it={shown} size={CELL} pop={prog(f, 22 + (i % 5) * 2 + Math.floor(i / 5) * 3, 10, EASE.back)} sel={isSel && selOn && !dragging} hidden={isSel && dragging} />
            </div>
          );
        })}
        {selOn && !dragging && (
          <div style={{position: 'absolute', left: cellC(SEL)[0] - CELL / 2 - 10, top: cellC(SEL)[1] - CELL / 2 - 10}}>
            <Brackets w={CELL + 20} h={CELL + 20} color={C.gold3} len={26} th={6} />
          </div>
        )}
        {/* total power */}
        <div style={{position: 'absolute', left: 200, top: 905, width: 1000, display: 'flex', alignItems: 'center', gap: 20}}>
          <Label size={36} color="#d9c9a0">
            总战力
          </Label>
          <Fancy size={64}>{String(total)}</Fancy>
          {swapped && (
            <Fancy size={44} fill="linear-gradient(180deg,#e4ffe8,#6bff8a 50%,#1fa04a)" edge="#06180c" style={{opacity: prog(f, SWAP_AT + 2, 8)}}>
              ▲ +38
            </Fancy>
          )}
        </div>
      </div>
      {/* comparison panel */}
      <div style={{position: 'absolute', left: 1290 + (1 - comp) * 640, top: 140, opacity: clamp01(comp * 2)}}>
        <Frame w={470} h={810} mat="dark" pad={26} border={10}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, height: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <DSlot size={104} edge={RARITY.unique.color} sel glow={0.6}>
                <Item id="diamond_sword" size={78} style={{filter: 'drop-shadow(0 0 10px #ffb531)'}} />
              </DSlot>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start'}}>
                <Fancy size={44} fill="linear-gradient(180deg,#fff3c2,#ffb531 55%,#9a5a0a)">
                  曙光之刃
                </Fancy>
                <div style={{padding: '0 12px', background: rgba(RARITY.unique.color, 0.22), border: `3px solid ${RARITY.unique.color}`}}>
                  <Label size={24} color={RARITY.unique.color}>
                    独特
                  </Label>
                </div>
              </div>
            </div>
            <div style={{width: '100%', height: 4, background: 'linear-gradient(90deg, rgba(255,181,49,0), #ffb531 30%, #ffb531 70%, rgba(255,181,49,0))'}} />
            {/* power */}
            <div style={{display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${1 + 0.08 * jiggle((f - 90) / 18, 2, 3)})`}}>
              <Label size={36} color={C.gold3}>
                战力
              </Label>
              <Bold size={44} color="#9a8c76">
                198
              </Bold>
              <Bold size={36} color="#6a5a44">
                →
              </Bold>
              <Fancy size={76}>{String(power)}</Fancy>
              <Fancy size={44} fill="linear-gradient(180deg,#e4ffe8,#6bff8a 50%,#1fa04a)" edge="#06180c" style={{opacity: prog(f, 84, 8)}}>
                ▲
              </Fancy>
            </div>
            <Stat label="攻击" from={18} to={24} t={prog(f, 76, 14)} />
            <Stat label="暴击" from={6} to={11} t={prog(f, 82, 14)} />
            <div style={{width: '100%', height: 4, background: 'linear-gradient(90deg, rgba(168,152,120,0), #6a5538 30%, #6a5538 70%, rgba(168,152,120,0))'}} />
            <Label size={24} color="#a89878">
              附魔槽
            </Label>
            <div style={{display: 'flex', gap: 18}}>
              {ENCH.map((e, i) => {
                const lit = prog(f, e.at, 10, EASE.back);
                const on = f >= e.at;
                return (
                  <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                    <div style={{position: 'relative', width: 116, height: 116, boxSizing: 'border-box', border: `6px solid ${on ? '#c88bff' : '#4a3b28'}`, background: on ? 'linear-gradient(180deg,#3a1d5a,#160a26)' : 'linear-gradient(180deg,#1a120c,#0f0a07)', boxShadow: `0 0 0 3px ${C.ink}, ${on ? `0 0 ${30 * lit}px #b86bff, inset 0 0 24px rgba(200,140,255,.5)` : 'inset 0 6px 14px rgba(0,0,0,.7)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${on ? 1 + 0.25 * (1 - lit) : 1})`}}>
                      {on ? <Item id={e.id} size={68} style={{transform: `scale(${lit})`, filter: 'drop-shadow(0 0 10px #c88bff)'}} /> : <div style={{width: 36, height: 8, background: '#3a2c1c'}} />}
                    </div>
                    <Label size={24} color={on ? '#e0c8ff' : '#5a4a36'}>
                      {on ? e.name : '空槽'}
                    </Label>
                    {on && f < e.at + 14 && <Burst x={0} y={0} at={e.at} count={0} />}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop: 'auto', opacity: prog(f, 108, 10), display: 'flex', alignItems: 'center', gap: 12}}>
              <Label size={24} color="#a89878">
                点击装备
              </Label>
              <Item id="iron_sword" size={40} style={{opacity: 0.7}} />
              <Label size={24} color="#a89878">
                →
              </Label>
              <Item id="diamond_sword" size={40} />
            </div>
          </div>
        </Frame>
      </div>
      {/* sparks for enchant slots (positions inside the panel) */}
      {ENCH.map((e, i) => (
        <Burst key={i} x={1290 + 26 + 10 + 4 + 58 + i * 134 + 24} y={140 + 26 + 10 + 4 + 530} at={e.at} count={14} colors={['#e0c8ff', '#b86bff', '#fff']} speed={9} life={22} size={9} gravity={-0.1} seed={i + 5} />
      ))}
      {/* dragged item + cursor */}
      {dragging && (
        <div style={{position: 'absolute', left: cx - 40, top: cy - 40, width: 80, height: 80, filter: 'drop-shadow(0 0 14px #ffb531) drop-shadow(8px 10px 0 rgba(0,0,0,.35))', transform: 'rotate(-8deg) scale(1.15)'}}>
          <Item id="diamond_sword" size={80} />
        </div>
      )}
      <Cursor x={cx} y={cy} press={press} />
      {/* sfx */}
      <Sfx at={4} src={mcSound('block/chest/open')} volume={0.25} rate={1.4} />
      <Sfx at={56} src={mcSound('random/click')} volume={0.5} />
      <Sfx at={62} src={mcSound('ui/toast/in')} volume={0.2} rate={1.4} />
      {ENCH.map((e, i) => (
        <Sfx key={i} at={e.at} src={mcSound('random/orb')} volume={0.3} rate={1.1 + i * 0.2} />
      ))}
      <Sfx at={114} src={mcSound('random/click')} volume={0.35} rate={0.9} />
      <Sfx at={SWAP_AT} src={mcSound('item/armor/equip_netherite1')} volume={0.5} />
      <Sfx at={SWAP_AT + 2} src={mcSound('random/levelup')} volume={0.25} rate={1.4} />
      <Flash at={SWAP_AT} life={6} peak={0.25} />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <DungeonBg dim={0.35} warm={0.9} vignette={0.9}>
      {content}
    </DungeonBg>
  );
};

export const GearPanel = Gear;
void mix;
void GOLD_GRAD;
