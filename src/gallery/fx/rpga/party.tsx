import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {HpBar, Plus} from './bars';
import {Bold, Burst, C, DungeonBg, EASE, Face, Fancy, Flash, Frame, Glint, Item, Label, MobFigure, Shake, clamp01, jiggle, lerp, mulberry32, prog, snap} from './common';

/**
 * rpg-party-hud: four-player party list on the left (skin face, name, colour tag, HP bar with a white "lag" trail) and the four
 * heroes standing in the dungeon with overhead bars. Hits flash the card red and shake it; at 0 HP a player goes down (card greys out,
 * bleed-out timer, hero falls); a teammate runs over and revives (green channel bar, green flash, plus signs, HP refills).
 * Props: `bg` - dungeon + heroes (Demo); Layer = the card list only.
 * Edit PLAYERS and EVENTS.
 */

export const PARTY_FRAMES = 190;

const PLAYERS = [
  {name: 'Steve', skin: 'steve', color: '#4aa8ff', max: 120, lv: 18},
  {name: 'Alex', skin: 'alex', color: '#ff8a3a', max: 110, lv: 17},
  {name: 'Kai', skin: 'kai', color: '#58d36a', max: 130, lv: 19},
  {name: 'Zuri', skin: 'zuri', color: '#e070d0', max: 100, lv: 16},
];
/** delta < 0 damage, > 0 heal */
const EVENTS: {t: number; p: number; d: number}[] = [
  {t: 16, p: 1, d: -38},
  {t: 30, p: 1, d: -20},
  {t: 40, p: 2, d: -60},
  {t: 52, p: 2, d: -70},
  {t: 70, p: 3, d: -30},
  {t: 80, p: 3, d: -25},
  {t: 132, p: 2, d: 65},
  {t: 154, p: 3, d: 40},
  {t: 160, p: 1, d: 30},
];
const DOWN = {p: 2, at: 52, revive: 132};
const HX = [920, 1160, 1400, 1640];
const FEET = 930;
const S = 13;
const CARD_Y = (i: number) => 100 + i * 196;

const hpOf = (p: number, f: number) => {
  let v = PLAYERS[p].max;
  let ghost = v;
  for (const e of EVENTS) {
    if (e.p !== p) continue;
    v += e.d * prog(f, e.t, 6);
    ghost += e.d * (e.d < 0 ? prog(f, e.t + 12, 16) : prog(f, e.t, 6));
  }
  return {v: Math.max(0, v), ghost: Math.max(0, ghost)};
};

const Card: FC<{p: number; f: number}> = ({p, f}) => {
  const P = PLAYERS[p];
  const {v, ghost} = hpOf(p, f);
  const isDown = p === DOWN.p && f >= DOWN.at && f < DOWN.revive;
  const justRevived = p === DOWN.p && f >= DOWN.revive;
  const hitT = EVENTS.filter((e) => e.p === p && e.d < 0 && f >= e.t && f < e.t + 10).map((e) => 1 - (f - e.t) / 10)[0] ?? 0;
  const healT = EVENTS.filter((e) => e.p === p && e.d > 0 && f >= e.t && f < e.t + 16).map((e) => 1 - (f - e.t) / 16)[0] ?? 0;
  const r = mulberry32(f * 5 + p);
  const jx = hitT > 0 ? (r() * 2 - 1) * 12 * hitT : 0;
  const jy = hitT > 0 ? (r() * 2 - 1) * 6 * hitT : 0;
  const inn = prog(f, p * 4, 14, EASE.back);
  const dead = isDown;
  const frac = v / P.max;
  const timer = isDown ? 1 - (f - DOWN.at) / (DOWN.revive - DOWN.at) : 0;
  return (
    <div style={{position: 'absolute', left: 190 + (1 - inn) * -520 + jx, top: CARD_Y(p) + jy, width: 580, height: 176, opacity: clamp01(inn * 2), transform: `scale(${1 + 0.05 * jiggle((f - DOWN.revive) / 14, 2, 3) * (justRevived && p === DOWN.p ? 1 : 0)})`}}>
      <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `6px solid ${dead ? '#5a5048' : '#a87a2a'}`, background: dead ? 'linear-gradient(180deg,#26211d,#14110f)' : 'linear-gradient(180deg,#34241a,#150e09)', boxShadow: `0 0 0 4px ${C.ink}, 0 10px 0 4px rgba(0,0,0,.45)`}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: dead ? '#4a4540' : P.color, boxShadow: `0 0 0 4px ${C.ink}`}} />
      <div style={{position: 'absolute', left: 36, top: 26, width: 124, height: 124, boxSizing: 'border-box', border: `5px solid ${dead ? '#5a5048' : P.color}`, boxShadow: `0 0 0 3px ${C.ink}`, filter: dead ? 'grayscale(1) brightness(0.7)' : undefined, overflow: 'hidden'}}>
        <Face skin={P.skin} size={114} />
        {dead && <div style={{position: 'absolute', inset: 0, background: 'rgba(60,0,0,.35)'}} />}
      </div>
      <div style={{position: 'absolute', left: 180, top: 22, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Fancy size={44} fill={dead ? 'linear-gradient(180deg,#bbb,#777)' : `linear-gradient(180deg,#ffffff,${P.color} 60%,#2a2a2a)`} stroke={4} drop={3}>
          {P.name}
        </Fancy>
        <Label size={24} color={dead ? '#6a6058' : '#cbbd9e'}>{`Lv.${P.lv}`}</Label>
      </div>
      <div style={{position: 'absolute', left: 180, top: 86}}>
        <HpBar w={376 - 12} h={32} value={frac} ghost={ghost / P.max} color={dead ? '#5a2a26' : healT > 0 ? '#58d36a' : '#d93a2b'} />
      </div>
      <div style={{position: 'absolute', left: 180, top: 130, width: 364, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {dead ? (
          <>
            <Label size={24} color="#e0584a">
              倒地
            </Label>
            <div style={{width: 230, height: 14, background: C.ink, border: '3px solid #5a3a30', boxSizing: 'border-box'}}>
              <div style={{width: `${timer * 100}%`, height: '100%', background: '#e0584a'}} />
            </div>
          </>
        ) : (
          <>
            <Label size={24} color="#a89878">
              生命
            </Label>
            <Label size={24} color={C.white}>{`${Math.round(v)} / ${P.max}`}</Label>
          </>
        )}
      </div>
      {dead && (
        <div style={{position: 'absolute', right: 20, top: 66, opacity: 0.9}}>
          <Item id="totem_of_undying" size={0} />
        </div>
      )}
      {/* hit / heal overlays */}
      <div style={{position: 'absolute', inset: 0, background: `rgba(255,50,30,${0.45 * hitT})`, mixBlendMode: 'screen'}} />
      {justRevived && f < DOWN.revive + 14 && <div style={{position: 'absolute', inset: 0, background: `rgba(90,255,140,${0.55 * (1 - (f - DOWN.revive) / 14)})`, mixBlendMode: 'screen'}} />}
      {healT > 0 && p !== DOWN.p && <div style={{position: 'absolute', inset: 0, background: `rgba(90,255,140,${0.35 * healT})`, mixBlendMode: 'screen'}} />}
    </div>
  );
};

const Hero: FC<{p: number; f: number}> = ({p, f}) => {
  const P = PLAYERS[p];
  const {v} = hpOf(p, f);
  const isDown = p === DOWN.p && f >= DOWN.at && f < DOWN.revive;
  const fall = p === DOWN.p ? prog(f, DOWN.at, 12, (t) => 1 - Math.pow(1 - t, 2.4)) * (1 - prog(f, DOWN.revive, 8, EASE.out)) : 0;
  const hitT = EVENTS.filter((e) => e.p === p && e.d < 0 && f >= e.t && f < e.t + 6).map((e) => 1 - (f - e.t) / 6)[0] ?? 0;
  // steve runs to the downed player and back
  let x = HX[p];
  if (p === 0) {
    const go = prog(f, 86, 18, EASE.inOut);
    const back = prog(f, 138, 18, EASE.inOut);
    x = lerp(HX[0], HX[2] - 190, go) - (HX[2] - 190 - HX[0]) * back * go;
  }
  const running = p === 0 && ((f >= 86 && f < 104) || (f >= 138 && f < 156));
  const bob = running ? Math.abs(Math.sin(f / 2)) * -10 : Math.sin(f / 8 + p) * 3;
  const healT = EVENTS.filter((e) => e.p === p && e.d > 0 && f >= e.t && f < e.t + 24).map((e) => 1 - (f - e.t) / 24)[0] ?? 0;
  const hpFrac = v / P.max;
  return (
    <>
      <div style={{position: 'absolute', left: x - 110, top: FEET - 14, width: 220, height: 28, background: 'radial-gradient(ellipse, rgba(0,0,0,.65), rgba(0,0,0,0) 70%)'}} />
      <div style={{position: 'absolute', left: x - 8 * S + (hitT > 0 ? 12 : 0), top: FEET - 32 * S + bob + fall * 6 * S, transform: `rotate(${fall * 86}deg)`, transformOrigin: '50% 90%', filter: isDown || (fall > 0.5) ? 'grayscale(0.9) brightness(0.7)' : healT > 0 ? `drop-shadow(0 0 20px #6bff8a)` : undefined}}>
        <MobFigure kind="player" s={S} skin={P.skin} hurt={hitT * 0.8} />
      </div>
      {!isDown && Math.abs(x - HX[p]) < 4 && (
        <div style={{position: 'absolute', left: x - 70, top: FEET - 32 * S - 52}}>
          <HpBar w={140} h={18} value={hpFrac} color={P.color === '#58d36a' ? '#d93a2b' : '#d93a2b'} rim={false} />
          <div style={{position: 'absolute', left: 0, right: 0, top: -34, display: 'flex', justifyContent: 'center'}}>
            <Label size={24} color={P.color}>
              {P.name}
            </Label>
          </div>
        </div>
      )}
    </>
  );
};

const Scene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const downedX = HX[DOWN.p];
  const channel = prog(f, 104, 26, EASE.inOut);
  const content = (
    <>
      {bg && PLAYERS.map((_, p) => <Hero key={p} p={p} f={f} />)}
      {/* damage / heal numbers over the heroes */}
      {EVENTS.map((e, i) => {
        const t = (f - e.t) / 34;
        if (t < 0 || t > 1) return null;
        const heal = e.d > 0;
        return (
          <div key={i} style={{position: 'absolute', left: HX[e.p] - 120, top: FEET - 32 * S - 100 - EASE.out(t) * 120, width: 240, display: 'flex', justifyContent: 'center', opacity: 1 - clamp01((t - 0.6) / 0.4), transform: `scale(${t < 0.15 ? lerp(0.4, 1.2, t / 0.15) : 1})`}}>
            <Fancy size={72} fill={heal ? 'linear-gradient(180deg,#e4ffe8,#6bff8a 50%,#1fa04a)' : 'linear-gradient(180deg,#fff,#ff8a7a 50%,#c9301c)'} edge={heal ? '#06180c' : '#2a0804'}>{`${heal ? '+' : ''}${e.d}`}</Fancy>
          </div>
        );
      })}
      {/* claw marks on hit */}
      {EVENTS.filter((e) => e.d < 0).map((e, i) => {
        const t = (f - e.t) / 8;
        if (t < 0 || t > 1) return null;
        return (
          <div key={i}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{position: 'absolute', left: HX[e.p] - 50 + k * 34, top: FEET - 22 * S - 40, width: 10, height: 120 * Math.min(1, t * 2.5), background: '#ff5a3a', opacity: 1 - t, transform: 'rotate(-28deg)', boxShadow: '0 0 12px #ff3a1a'}} />
            ))}
            <Burst x={HX[e.p]} y={FEET - 18 * S} at={e.t} count={10} colors={['#ff5a3a', '#ffb347', '#fff']} speed={12} life={18} size={10} seed={e.t} />
          </div>
        );
      })}
      {/* revive channel */}
      {f >= 104 && f < DOWN.revive && (
        <>
          <div style={{position: 'absolute', left: downedX - 110, top: FEET - 32 * S - 80, width: 220}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
              <Item id="totem_of_undying" size={64} style={{filter: 'drop-shadow(0 0 12px #6bff8a)'}} />
            </div>
            <div style={{height: 24, background: C.ink, border: '4px solid #2f7a44', boxSizing: 'border-box'}}>
              <div style={{width: `${channel * 100}%`, height: '100%', background: 'linear-gradient(180deg,#d6ffd8,#58d36a 55%,#1fa04a)'}} />
            </div>
          </div>
          {Array.from({length: 6}, (_, k) => {
            const t = clamp01(((f - 104 + k * 4) % 18) / 18);
            const x0 = HX[0] + 150 - 190 + 190;
            return <div key={k} style={{position: 'absolute', left: snap(lerp(downedX - 190 + 100, downedX, t), 2), top: snap(FEET - 16 * S - Math.sin(t * Math.PI) * 60, 2), width: 12, height: 12, background: '#6bff8a', boxShadow: '0 0 12px #6bff8a', opacity: Math.sin(t * Math.PI)}} />;
          })}
        </>
      )}
      <Burst x={downedX} y={FEET - 12 * S} at={DOWN.revive} count={30} colors={['#6bff8a', '#d6ffd8', '#fff']} speed={14} life={30} size={12} gravity={-0.2} seed={9} />
      <Glint x={downedX} y={FEET - 14 * S} t={(f - DOWN.revive) / 16} size={180} color="#d6ffd8" />
      {f >= DOWN.revive && f < DOWN.revive + 34 &&
        [-80, -30, 30, 80].map((o, i) => <Plus key={i} x={downedX + o} y={FEET - 22 * S - ((f - DOWN.revive) / 34) * 140 - (i % 2) * 40} s={9} opacity={1 - (f - DOWN.revive) / 34} />)}
      {/* cards */}
      {PLAYERS.map((_, p) => (
        <Card key={p} p={p} f={f} />
      ))}
      {/* down marker */}
      {f >= DOWN.at && f < DOWN.revive && f % 20 < 14 && f < 104 && (
        <div style={{position: 'absolute', left: downedX - 40, top: FEET - 140, width: 80, display: 'flex', justifyContent: 'center'}}>
          <Item id="bone" size={80} style={{filter: 'drop-shadow(0 0 10px #e0584a)'}} />
        </div>
      )}
      {EVENTS.filter((e) => e.d < 0).map((e, i) => (
        <Sfx key={i} at={e.t} src={mcSound('random/anvil_land')} volume={0.25} rate={1.8} />
      ))}
      <Sfx at={DOWN.at + 2} src={mcSound('dig/gravel1')} volume={0.5} rate={0.7} />
      <Sfx at={104} src={mcSound('block/furnace/fire_crackle1')} volume={0.3} />
      <Sfx at={DOWN.revive} src={mcSound('random/levelup')} volume={0.45} rate={1.2} />
      <Sfx at={154} src={mcSound('random/orb')} volume={0.35} />
      <Sfx at={160} src={mcSound('random/orb')} volume={0.35} rate={1.2} />
      <Flash at={DOWN.revive} life={6} peak={0.3} color="#b8ffc8" />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={EVENTS.filter((e) => e.d < 0).map((e) => e.t)} life={7} strength={8}>
      <DungeonBg dim={0.05}>{content}</DungeonBg>
    </Shake>
  );
};

export const PartyHud = Scene;
