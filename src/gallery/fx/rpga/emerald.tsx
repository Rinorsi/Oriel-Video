import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {ChestFront} from '../../mob';
import {block} from '../../../mc/assets';
import {MobFigure, Bold, Burst, C, DungeonBg, EASE, Fancy, Frame, Glint, Item, Label, W, clamp01, jiggle, lerp, mulberry32, prog, snap, px} from './common';
import {Barrel} from './widgets';

/**
 * rpg-emerald-counter: emeralds on the floor are picked up one after another, fly along an arc (with afterimages) into the
 * counter at the top right; the odometer digits roll, the emerald icon bounces, "+N" pops and a pickup log scrolls bottom-left.
 * A chest opens near the end and sprays eight emeralds, which stack onto the counter. Stacked pickups just keep adding.
 * Props: `bg` - dungeon (Demo); Layer = counter + flying emeralds + log only (floor items and chest hidden).
 * Edit GEMS: x, y (ground position), n (amount), at (frame it is picked up), block (true = emerald block).
 */

export const EMERALD_FRAMES = 190;
const START = 120;
const TARGET: [number, number] = [1262, 166]; // emerald icon centre in the counter
const FLY = 22;

type Gem = {x: number; y: number; n: number; at: number; block?: boolean; chest?: boolean};
const GEMS: Gem[] = [
  {x: 760, y: 860, n: 1, at: 18},
  {x: 1020, y: 900, n: 3, at: 32},
  {x: 1420, y: 860, n: 1, at: 44},
  {x: 820, y: 940, n: 5, at: 56},
  {x: 1250, y: 940, n: 10, at: 72, block: true},
  // chest burst (appear at 96, fly from 112)
  ...Array.from({length: 8}, (_, i) => ({x: 1650 + (i - 3.5) * 36, y: 900 + (i % 2) * 26, n: 3, at: 112 + i * 4, chest: true})),
];
const total = (f: number) => GEMS.reduce((s, g) => s + g.n * prog(f, g.at + FLY - 4, 12), 0);

export const Odometer: FC<{value: number; digits?: number; cw?: number; ch?: number; fs?: number; color?: string}> = ({value, digits = 4, cw = 92, ch = 132, fs = 104, color = '#bfffd0'}) => {
  return (
    <div style={{display: 'flex', gap: 8}}>
      {Array.from({length: digits}, (_, k) => {
        const i = digits - 1 - k; // 10^i
        const x = value / Math.pow(10, i);
        const base = Math.floor(x);
        const fr = x - base;
        const roll = i === 0 ? fr : clamp01((fr - 0.8) / 0.2);
        const p = (base % 10) + (i === 0 ? roll : roll);
        const dim = value < Math.pow(10, i) && i > 0 ? 0.22 : 1;
        return (
          <div key={k} style={{position: 'relative', width: cw, height: ch, overflow: 'hidden', background: 'linear-gradient(180deg,#0e0a07,#241811 50%,#0e0a07)', border: `4px solid #6a5538`, boxShadow: `inset 0 0 0 2px ${C.ink}, 0 0 0 3px ${C.ink}`, boxSizing: 'border-box', opacity: dim}}>
            <div style={{transform: `translateY(${-p * (ch - 8)}px)`}}>
              {Array.from({length: 20}, (_, j) => (
                <div key={j} style={{height: ch - 8, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  <Bold size={fs} color={color} style={{textShadow: '0 0 18px #17dd62'}}>
                    {String(j % 10)}
                  </Bold>
                </div>
              ))}
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: ch * 0.26, background: 'linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,0))'}} />
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: ch * 0.26, background: 'linear-gradient(0deg, rgba(0,0,0,.65), rgba(0,0,0,0))'}} />
          </div>
        );
      })}
    </div>
  );
};

const Flying: FC<{g: Gem; i: number}> = ({g, i}) => {
  const f = useCurrentFrame();
  const t = (f - g.at) / FLY;
  if (t < 0 || t > 1) return null;
  const pos = (tt: number) => {
    const e = EASE.in(tt);
    return [lerp(g.x, TARGET[0], e), lerp(g.y, TARGET[1], e) - Math.sin(tt * Math.PI) * 260 - (g.chest ? 120 : 0) * Math.sin(tt * Math.PI)] as const;
  };
  const size = g.block ? 144 : g.n >= 5 ? 112 : 96;
  return (
    <>
      {[3, 2, 1].map((k) => {
        const tt = Math.max(0, t - k * 0.045);
        const [x, y] = pos(tt);
        return <div key={k} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: 0.22 * (4 - k) / 3, transform: `scale(${0.7 - k * 0.05})`, filter: 'drop-shadow(0 0 14px #17dd62) brightness(1.2)'}}>{g.block ? <BlockImg size={size} /> : <Item id="emerald" size={size} />}</div>;
      })}
      {(() => {
        const [x, y] = pos(t);
        const sc = lerp(1.25, 0.8, EASE.in(t));
        return (
          <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${sc}) rotate(${t * 360 * (i % 2 ? 1 : -1)}deg)`, filter: 'drop-shadow(0 0 16px #17dd62)'}}>
            {g.block ? <BlockImg size={size} /> : <Item id="emerald" size={size} />}
          </div>
        );
      })()}
      <Burst x={g.x} y={g.y} at={g.at} count={8} colors={['#17dd62', '#9bffb8', '#fff']} speed={9} life={18} size={9} gravity={0.2} seed={i + 1} />
    </>
  );
};

const BlockImg: FC<{size: number}> = ({size}) => <div style={{width: size, height: size, backgroundImage: `url(${block('emerald_block')})`, backgroundSize: `${size}px ${size}px`, ...px, boxShadow: `0 0 0 3px ${C.ink}`}} />;

const GroundGem: FC<{g: Gem; i: number}> = ({g, i}) => {
  const f = useCurrentFrame();
  const appear = g.chest ? 96 + (i - 5) * 2 : 0;
  if (f > g.at || f < appear) return null;
  const size = g.block ? 144 : g.n >= 5 ? 112 : 96;
  const sprout = g.chest ? prog(f, appear, 14, EASE.out) : 1;
  const arcY = g.chest ? -Math.sin(sprout * Math.PI) * 200 : 0;
  const bob = Math.sin((f + i * 5) / 7) * 6;
  const glint = ((f + i * 11) % 40) / 40;
  const lift = prog(f, g.at - 4, 4, EASE.in) * -10;
  const x = g.chest ? lerp(1650, g.x, sprout) : g.x;
  const y = g.chest ? lerp(840, g.y, sprout) + arcY : g.y;
  return (
    <>
      <div style={{position: 'absolute', left: x - size * 0.5, top: g.y + size * 0.36, width: size, height: 16, background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)'}} />
      <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + (g.chest && sprout < 1 ? 0 : bob + lift), width: size, height: size, filter: 'drop-shadow(0 0 16px #17dd62)'}}>{g.block ? <BlockImg size={size} /> : <Item id="emerald" size={size} />}</div>
      {glint < 0.3 && <Glint x={x + size * 0.2} y={y - size * 0.3} t={glint / 0.3} size={30} color="#c9ffd9" />}
    </>
  );
};

const EmeraldScene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const value = START + total(f);
  // icon bounce: last arrival
  const arrivals = GEMS.map((g) => g.at + FLY);
  const sinceArr = Math.min(...arrivals.map((a) => (f >= a ? f - a : 99)));
  const bounce = sinceArr < 14 ? jiggle(sinceArr / 14, 2, 3) : 0;
  const glow = sinceArr < 10 ? 1 - sinceArr / 10 : 0;
  const slide = prog(f, 0, 14, EASE.out);
  const logs = GEMS.filter((g) => !g.chest || g.at % 8 === 0).map((g) => ({at: g.at + FLY, n: g.n}));
  // merge chest ones into a single stacked line
  const log: {at: number; text: string}[] = [
    {at: 40, text: '+1'},
    {at: 54, text: '+3'},
    {at: 66, text: '+1'},
    {at: 78, text: '+5'},
    {at: 94, text: '+10'},
    {at: 150, text: '+24'},
  ].map((l) => ({at: l.at, text: l.text}));
  void logs;
  const content = (
    <>
      {bg && GEMS.map((g, i) => <GroundGem key={i} g={g} i={i} />)}
      {GEMS.map((g, i) => (
        <Flying key={i} g={g} i={i} />
      ))}
      {/* counter */}
      <div style={{position: 'absolute', left: 1020, top: 50, transform: `translateY(${(1 - slide) * -160}px)`, opacity: slide}}>
        <Frame w={760} h={230} mat="dark" pad={24} border={10}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26, height: '100%'}}>
            <div style={{position: 'relative', width: 150, height: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + 0.4 * bounce}) translateY(${-14 * bounce}px)`, filter: `drop-shadow(0 0 ${14 + 26 * glow}px #17dd62)`}}>
              <Item id="emerald" size={150} />
            </div>
            <Odometer value={value} />
          </div>
        </Frame>
      </div>
      {/* +N pops */}
      {GEMS.map((g, i) => {
        const a = g.at + FLY - 2;
        const t = (f - a) / 26;
        if (t < 0 || t > 1) return null;
        return (
          <div key={i} style={{position: 'absolute', left: 1060 + (i % 3) * 60, top: 330 + t * -0 + (i % 2) * 40 - EASE.out(t) * 40, width: 160, display: 'flex', justifyContent: 'center', opacity: 1 - clamp01((t - 0.6) / 0.4), transform: `scale(${t < 0.15 ? lerp(0.4, 1.2, t / 0.15) : 1})`}}>
            <Fancy size={72} fill="linear-gradient(180deg,#eaffef,#4dff8a 50%,#10a04a)" edge="#06180c">{`+${g.n}`}</Fancy>
          </div>
        );
      })}
      {/* pickup log */}
      <div style={{position: 'absolute', left: 190, top: 150, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start'}}>
        {log
          .filter((l) => f >= l.at && f < l.at + 50)
          .map((l, i) => {
            const t = (f - l.at) / 50;
            const inn = prog(f, l.at, 8, EASE.back);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '6px 22px 6px 14px', background: 'linear-gradient(90deg, rgba(10,6,3,.85), rgba(10,6,3,0))', borderLeft: `6px solid ${C.emerald}`, opacity: (1 - clamp01((t - 0.7) / 0.3)) * clamp01(inn * 2), transform: `translateX(${(1 - inn) * -60}px)`}}>
                <Item id="emerald" size={44} />
                <Label size={36} color="#bfffd0">
                  {l.text}
                </Label>
              </div>
            );
          })}
      </div>
      {/* sfx */}
      {GEMS.filter((g, i) => !g.chest || i % 2 === 0).map((g, i) => (
        <Sfx key={i} at={g.at + FLY - 2} src={mcSound('random/orb')} volume={0.28} rate={1 + (i % 5) * 0.12} />
      ))}
      <Sfx at={94} src={mcSound('block/chest/open')} volume={0.5} />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <DungeonBg floor={740}>
      <Barrel x={1815} y={1030} s={8} />
      <div style={{position: 'absolute', left: 1650 - 7 * 10, top: 960 - 15 * 10}}>
        <ChestFront scale={10} open={prog(f, 92, 14, EASE.back)} />
      </div>
      <div style={{position: 'absolute', left: 440 - 8 * 13, top: 960 - 32 * 13 + Math.sin(f / 9) * 3}}>
        <MobFigure kind="player" s={13} />
      </div>
      {content}
    </DungeonBg>
  );
};

export const EmeraldCounter = EmeraldScene;
void mulberry32;
void snap;
void W;
