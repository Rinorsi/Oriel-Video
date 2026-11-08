import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {block} from '../../../mc/assets';
import {HpBar} from './bars';
import {Bold, Burst, C, DungeonBg, EASE, Face, Fancy, Flash, Frame, Glint, Item, Label, MobFigure, Shake, clamp01, jiggle, lerp, mulberry32, prog, px, snap} from './common';

/**
 * rpg-status-effects: a status list on the right. Effects arrive one by one with their cause on screen (strength potion, frost arrow,
 * zombie bite, thrown weakness potion): the row slides in with a pop, a countdown bar drains, the whole list shakes whenever the hero is hit,
 * and effects blink and slide out as they expire. HP bar flashes red on hits and ticks down green under poison.
 * Props: `bg` - dungeon + hero + attackers (Demo); Layer = the status panel only.
 * Edit FX (name / desc / color / icon / at / dur) and HITS (hero damage frames).
 */

export const STATUS_FRAMES = 190;

type Eff = {name: string; desc: string; color: string; icon: string; at: number; dur: number; buff?: boolean; web?: boolean};
const FX: Eff[] = [
  {name: '力量', desc: '攻击伤害 +30%', color: '#ff8a3a', icon: 'blaze_powder', at: 22, dur: 120, buff: true},
  {name: '减速', desc: '移动速度 −40%', color: '#8fd8ff', icon: 'cobweb', at: 42, dur: 96, web: true},
  {name: '中毒', desc: '持续损失生命', color: '#8be04a', icon: 'spider_eye', at: 66, dur: 100},
  {name: '虚弱', desc: '攻击伤害 −25%', color: '#b79ad8', icon: 'fermented_spider_eye', at: 90, dur: 86},
];
const HITS = [42, 66, 90];
const HERO_X = 400;
const FEET = 920;
const S = 14;
const PX = 1190;
const ROW_H = 124;
const ROW_Y = (i: number) => (i === 0 ? 304 : 480 + (i - 1) * 138);

const remain = (e: Eff, f: number) => clamp01(1 - (f - e.at) / e.dur);

const Row: FC<{e: Eff; i: number; f: number; shake: number}> = ({e, i, f, shake}) => {
  const inn = prog(f, e.at, 14, EASE.back);
  const out = prog(f, e.at + e.dur, 12, EASE.in);
  if (f < e.at || out >= 1) return null;
  const rem = remain(e, f);
  const blink = rem < 0.22 ? (Math.floor(f / 3) % 2 ? 0.35 : 1) : 1;
  const r = mulberry32(f * 3 + i);
  const jx = shake > 0 ? (r() * 2 - 1) * 12 * shake : 0;
  const jy = shake > 0 ? (r() * 2 - 1) * 8 * shake : 0;
  const secs = Math.ceil((rem * e.dur) / 30);
  const edge = e.buff ? '#e6c040' : '#c0392b';
  return (
    <div style={{position: 'absolute', left: PX + 40 + (1 - inn) * 700 + out * 700 + jx, top: ROW_Y(i) + jy, width: 530, height: ROW_H, opacity: blink}}>
      <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `6px solid ${edge}`, background: `linear-gradient(90deg, ${e.color}40 0%, #1c130d 38%, #120b07 100%)`, boxShadow: `0 0 0 4px ${C.ink}, 0 8px 0 4px rgba(0,0,0,.45), 0 0 ${18 * (1 - clamp01((f - e.at) / 18))}px ${e.color}`}} />
      <div style={{position: 'absolute', left: 14, top: 14, width: 96, height: 96, boxSizing: 'border-box', border: `5px solid ${e.color}`, background: 'linear-gradient(180deg,#2a1d14,#0f0a07)', boxShadow: `0 0 0 3px ${C.ink}, inset 0 0 22px ${e.color}55`, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + 0.22 * jiggle((f - e.at) / 14, 2, 3)})`}}>
        {e.web ? <Img src={block('cobweb')} style={{width: 72, height: 72, ...px, filter: 'brightness(1.5)'}} /> : <Item id={e.icon} size={72} style={{filter: `drop-shadow(0 0 8px ${e.color})`}} />}
      </div>
      <div style={{position: 'absolute', left: 130, top: 10, right: 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <Fancy size={48} fill={`linear-gradient(180deg,#ffffff,${e.color} 55%,#3a2a20)`}>
          {e.name}
        </Fancy>
        <Bold size={40} color={e.color}>{`${secs}s`}</Bold>
      </div>
      <div style={{position: 'absolute', left: 130, top: 66, right: 20}}>
        <Label size={24} color="#cbbd9e">
          {e.desc}
        </Label>
      </div>
      <div style={{position: 'absolute', left: 130, right: 20, bottom: 14, height: 16, background: C.ink, border: '3px solid #4a3b28', boxSizing: 'border-box'}}>
        <div style={{width: `${rem * 100}%`, height: '100%', background: `linear-gradient(180deg, ${e.color}, ${e.color}aa)`}} />
      </div>
    </div>
  );
};

const Scene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const panelIn = prog(f, 0, 16, EASE.out);
  const hitNow = HITS.filter((h) => f >= h && f < h + 9);
  const shake = hitNow.length ? 1 - (f - hitNow[0]) / 9 : 0;
  const active = FX.map((e) => f >= e.at && f < e.at + e.dur);
  const slowed = active[1];
  // hp: red hit chunks + poison ticks
  const hits = HITS.reduce((s, h) => s + (f >= h ? 0.06 * prog(f, h, 6) : 0), 0);
  const poison = f >= 66 && f < 166 ? ((f - 66) / 100) * 0.16 : f >= 166 ? 0.16 : 0;
  const hp = 0.96 - hits - poison;
  const hitFlash = HITS.some((h) => f >= h && f < h + 5) ? 1 : 0;
  const content = (
    <>
      {bg && (
        <>
          {/* hero */}
          <div style={{position: 'absolute', left: HERO_X - 100, top: FEET - 14, width: 200, height: 26, background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)'}} />
          <div style={{position: 'absolute', left: HERO_X - 8 * S + (hitFlash ? -14 : 0), top: FEET - 32 * S + Math.sin(f / (slowed ? 14 : 8)) * 3, filter: [active[0] ? 'drop-shadow(0 0 22px #ff8a3a)' : '', slowed ? 'drop-shadow(0 0 16px #8fd8ff)' : '', active[2] ? 'drop-shadow(0 0 18px #8be04a)' : '', active[3] ? 'drop-shadow(0 0 18px #b79ad8) saturate(0.7)' : ''].join(' ')}}>
            <MobFigure kind="player" s={S} hurt={hitFlash * 0.6} />
          </div>
          {/* attackers */}
          <div style={{position: 'absolute', left: 740 - 100, top: FEET - 14, width: 200, height: 26, background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)'}} />
          <div style={{position: 'absolute', left: 740 - 8 * S, top: FEET - 32 * S + Math.sin(f / 7) * 3}}>
            <MobFigure kind="skeleton" s={S} />
          </div>
          {(() => {
            const lunge = f >= 60 && f < 72 ? Math.sin(((f - 60) / 12) * Math.PI) * 150 : 0;
            return (
              <>
                <div style={{position: 'absolute', left: 960 - 100, top: FEET - 14, width: 200, height: 26, background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)'}} />
                <div style={{position: 'absolute', left: 960 - 8 * S - lunge, top: FEET - 32 * S + Math.sin(f / 9) * 3}}>
                  <MobFigure kind="zombie" s={S} />
                </div>
              </>
            );
          })()}
          {/* strength potion */}
          {f >= 8 && f < 30 && (
            <div style={{position: 'absolute', left: HERO_X + 40, top: FEET - 32 * S - 20 - Math.sin(((f - 8) / 22) * Math.PI) * 60, transform: `rotate(${-20 + (f - 8) * 4}deg) scale(1.2)`, opacity: 1 - clamp01((f - 24) / 6)}}>
              <Item id="potion" size={96} style={{filter: 'hue-rotate(-40deg) saturate(2) drop-shadow(0 0 12px #ff8a3a)'}} />
            </div>
          )}
        </>
      )}
      {/* projectiles + cause effects (also in Layer; positions are fixed) */}
      {f >= 30 && f < 42 && (
        <div style={{position: 'absolute', left: lerp(700, 480, EASE.in(clamp01((f - 30) / 12))) - 48, top: FEET - 20 * S - 48, transform: 'rotate(225deg)', filter: 'drop-shadow(0 0 10px #8fd8ff)'}}>
          <Item id="arrow" size={96} style={{filter: 'hue-rotate(160deg) brightness(1.4)'}} />
        </div>
      )}
      {f >= 76 && f < 90 && (
        <div style={{position: 'absolute', left: lerp(1250, HERO_X + 40, EASE.in(clamp01((f - 76) / 14))) - 48, top: lerp(250, FEET - 22 * S, EASE.in(clamp01((f - 76) / 14))) - Math.sin(clamp01((f - 76) / 14) * Math.PI) * 120 - 48, transform: `rotate(${(f - 76) * 30}deg)`, filter: 'drop-shadow(0 0 12px #b79ad8)'}}>
          <Item id="splash_potion" size={96} style={{filter: 'hue-rotate(90deg) saturate(1.3)'}} />
        </div>
      )}
      {/* effect particles */}
      <Burst x={HERO_X} y={FEET - 16 * S} at={22} count={26} colors={['#ffd23f', '#ff8a3a', '#ff5a2a']} speed={9} life={36} size={12} gravity={-0.3} dir={-Math.PI / 2} spread={1.1} seed={3} />
      <Burst x={HERO_X} y={FEET - 20 * S} at={42} count={22} colors={['#e8f8ff', '#8fd8ff', '#fff']} speed={14} life={26} size={12} gravity={0.4} seed={4} />
      <Burst x={HERO_X} y={FEET - 4 * S} at={44} count={16} colors={['#e8f8ff', '#8fd8ff']} speed={7} life={30} size={14} gravity={0.2} dir={-Math.PI / 2} spread={1.4} seed={5} glow={false} />
      <Burst x={HERO_X} y={FEET - 16 * S} at={66} count={26} colors={['#8be04a', '#5fae2e', '#c6f58a']} speed={10} life={34} size={12} gravity={-0.2} dir={-Math.PI / 2} spread={1.4} seed={6} />
      <Burst x={HERO_X} y={FEET - 22 * S} at={90} count={30} colors={['#b79ad8', '#e0c8ff', '#7a5aa8']} speed={13} life={30} size={12} gravity={0.2} seed={7} />
      {HITS.map((h, i) => (
        <div key={i}>
          <Glint x={HERO_X} y={FEET - 18 * S} t={(f - h) / 9} size={110} />
          <Flash at={h} life={4} peak={0.25} color="#ffd9c0" />
        </div>
      ))}
      {/* hero card */}
      {bg && (
        <div style={{position: 'absolute', left: 190, top: 96, opacity: panelIn}}>
          <Frame w={560} h={150} mat="dark" pad={20} border={8} studs={false}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, height: '100%'}}>
              <Face skin="steve" size={88} style={{boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px #a87a2a`}} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <Label size={24} color={C.gold3}>
                  勇者 · Lv.18
                </Label>
                <HpBar w={340} h={30} value={hp} ghost={hp + 0.05} color={active[2] ? '#6fae2e' : '#d93a2b'} />
              </div>
            </div>
          </Frame>
        </div>
      )}
      {/* status panel */}
      <div style={{position: 'absolute', left: PX + (1 - panelIn) * 600, top: 130, opacity: panelIn}}>
        <Frame w={610} h={800} mat="dark" pad={0} border={10} studs />
        <div style={{position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center'}}>
          <Fancy size={64} spacing={10}>
            状态效果
          </Fancy>
        </div>
        <div style={{position: 'absolute', left: 40, right: 40, top: 128, height: 4, background: 'linear-gradient(90deg, rgba(255,181,49,0), #ffb531 30%, #ffb531 70%, rgba(255,181,49,0))'}} />
        <div style={{position: 'absolute', left: 40, top: 142, width: 530, display: 'flex', alignItems: 'center', gap: 12}}>
          <Label size={24} color="#e6c040">
            增益
          </Label>
          <div style={{flex: 1, height: 3, background: '#4a3b28'}} />
        </div>
        <div style={{position: 'absolute', left: 40, top: 314, width: 530, display: 'flex', alignItems: 'center', gap: 12}}>
          <Label size={24} color="#e0584a">
            减益
          </Label>
          <div style={{flex: 1, height: 3, background: '#4a3b28'}} />
        </div>
      </div>
      {FX.map((e, i) => (
        <Row key={i} e={e} i={i} f={f} shake={shake} />
      ))}
      {/* sfx */}
      <Sfx at={22} src={mcSound('random/levelup')} volume={0.25} rate={1.5} />
      {HITS.map((h, i) => (
        <Sfx key={i} at={h} src={mcSound('random/anvil_land')} volume={0.3} rate={1.8 + i * 0.1} />
      ))}
      {FX.map((e, i) => (
        <Sfx key={i} at={e.at + 2} src={mcSound('ui/toast/in')} volume={0.2} rate={1 + i * 0.12} />
      ))}
      {FX.map((e, i) => (
        <Sfx key={'o' + i} at={e.at + e.dur} src={mcSound('ui/toast/out')} volume={0.15} rate={1.3} />
      ))}
    </>
  );
  void snap;
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={HITS} life={8} strength={12}>
      <DungeonBg dim={0.1}>{content}</DungeonBg>
    </Shake>
  );
};

export const StatusEffects = Scene;
