import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import {PixelBurst} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE} from '../../../mg/Ore';
import {ItemImg, mcSound} from '../../../reel/kit';
import {Bolt, EdgeGlow, Halftone, Motes, PX, Shine, Slab, Stage, W, back, bold, lerp, pr, Sfx} from './ui';

/**
 * Stat bars (transparent overlay): health / hunger / experience bars with eased changes.
 * Hurt: bar drops fast, a pale "ghost" bar lags behind and then drains, the row blinks red, the screen edge flashes red,
 * a "-12" pops. Heal: a bright ghost bar jumps ahead, the main bar catches up, green flash + rising sparks, "+10".
 * XP: fills to the top, level-up flash, level number jumps, bar restarts.
 * Props:
 *   scale: whole HUD scale (default 1)
 *   health / hunger: [{at (frame), to (0..20)}] target values; a drop is a hit (red flash, shake, pop-up), a rise is a heal (default = demo timeline)
 *   levelUpAt / level: frame of the XP level-up and the level shown before it (default 112 / 30)
 *   title, labels ([health, hunger, xp] row names), statusLabels ([before the 1st event, after it, after the next]), levelUpText, frames (total length)
 */

export const STAT_FRAMES = 240;

type Step = {at: number; to: number; dur: number};
const valueAt = (f: number, from: number, steps: Step[], ease: (t: number) => number = EASE.out): number => {
  let v = from;
  for (const s of steps) {
    if (f < s.at) break;
    const t = clamp01((f - s.at) / Math.max(1, s.dur));
    v = lerp(v, s.to, ease(t));
    if (t < 1) return v;
  }
  return v;
};

export type StatEvent = {at: number; to: number};
type Ev = StatEvent;
/** Main/ghost keyframes from a list of target values: drops are fast with a lagging ghost, gains lead with the ghost. */
const build = (start: number, evs: Ev[]) => {
  const main: Step[] = [];
  const ghost: Step[] = [];
  let prev = start;
  for (const e of evs) {
    if (e.to >= prev) {
      ghost.push({at: e.at, to: e.to, dur: 6});
      main.push({at: e.at + 8, to: e.to, dur: 26});
    } else {
      main.push({at: e.at, to: e.to, dur: 7});
      ghost.push({at: e.at + 16, to: e.to, dur: 22});
    }
    prev = e.to;
  }
  return {main, ghost};
};

const DEFAULT_HEALTH: Ev[] = [{at: 58, to: 8}, {at: 118, to: 18}];
const DEFAULT_HUNGER: Ev[] = [{at: 84, to: 10}, {at: 150, to: 16}];

/** Events split by direction: hits (value drops) and heals (value rises), starting from `start`. */
const split = (start: number, evs: Ev[]) => {
  let prev = start;
  const hits: number[] = [];
  const heals: number[] = [];
  evs.forEach((e) => {
    (e.to >= prev ? heals : hits).push(e.at);
    prev = e.to;
  });
  return {hits, heals};
};
/** Age in frames of the newest event at or before f, or -1 if none has happened yet. */
const youngest = (f: number, ats: number[]) => {
  const past = ats.filter((a) => f >= a);
  return past.length ? f - Math.max(...past) : -1;
};

/** Last event at or before f: its age in frames and whether it was a gain. */
const lastEv = (f: number, start: number, evs: Ev[]) => {
  let prev = start;
  let out: {age: number; gain: boolean; delta: number} | null = null;
  for (const e of evs) {
    if (f >= e.at) out = {age: f - e.at, gain: e.to > prev, delta: e.to - prev};
    prev = e.to;
  }
  return out;
};

const Bar: FC<{w: number; value: number; ghost: number; fill: [string, string, string]; ghostColor: string; flash: number; flashColor: string; segs?: number; h?: number}> = ({w, value, ghost, fill, ghostColor, flash, flashColor, segs = 20, h = 56}) => {
  const snap = (v: number) => Math.round((w - 16) * clamp01(v) / 4) * 4;
  const inner = w - 16;
  return (
    <div style={{position: 'relative', width: w, height: h, background: '#0c0c0e', boxShadow: `0 0 0 4px #000, inset 0 4px 0 #000, 0 4px 0 4px rgba(255,255,255,0.14)`}}>
      <div style={{position: 'absolute', left: 8, top: 8, width: inner, height: h - 16, background: '#242425'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: snap(ghost / 1), background: ghostColor}} />
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: snap(value / 1), background: fill[0], boxShadow: `inset 0 8px 0 ${fill[1]}, inset 0 -8px 0 ${fill[2]}`}} />
        {Array.from({length: segs - 1}, (_, i) => (
          <div key={i} style={{position: 'absolute', top: 0, bottom: 0, left: ((i + 1) / segs) * inner - 2, width: 4, background: 'rgba(0,0,0,0.38)'}} />
        ))}
        <div style={{position: 'absolute', inset: 0, background: flashColor, opacity: flash * 0.5, mixBlendMode: 'screen'}} />
      </div>
    </div>
  );
};

const Popup: FC<{at: number; x: number; y: number; text: string; color: string; f: number}> = ({at, x, y, text, color, f}) => {
  const a = f - at;
  if (a < 0 || a > 44) return null;
  const rise = EASE.out(a / 44) * 90;
  const sc = a < 8 ? back(a / 8) : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y - rise, transform: `translate(-50%, -50%) scale(${sc})`, opacity: clamp01((44 - a) / 12)}}>
      <PX size={96} color={color} shadow={false} style={{textShadow: bold(6, '#000', 8, '#000')}}>
        {text}
      </PX>
    </div>
  );
};

export const StatBars: FC<{bg?: boolean; scale?: number; health?: StatEvent[]; hunger?: StatEvent[]; levelUpAt?: number; level?: number; title?: string; labels?: [string, string, string]; statusLabels?: [string, string, string]; levelUpText?: string; frames?: number}> = ({
  bg,
  scale = 1,
  health: HEALTH = DEFAULT_HEALTH,
  hunger: HUNGER = DEFAULT_HUNGER,
  levelUpAt: LV = 112,
  level: level0 = 30,
  title = '生存状态 · HUD',
  labels = ['生命', '饥饿', '经验'],
  statusLabels = ['正常', '重伤', '恢复中'],
  levelUpText = '升级!',
  frames = STAT_FRAMES,
}) => {
  const f = useCurrentFrame();
  const N = frames;
  const inP = back(pr(f, 0, 16, (t) => t));
  const outP = pr(f, N - 24, 20, EASE.in);
  const PW = 1440;
  const PH = 500;
  const PX0 = (W - PW) / 2;
  const PY0 = 470;
  const BW = 760;

  // health
  const hb = build(0, [{at: 6, to: 20}, ...HEALTH]);
  const hv = valueAt(f, 0, hb.main, EASE.out);
  const hg = valueAt(f, 0, hb.ghost, EASE.out);
  const hEv = lastEv(f, 20, HEALTH);
  // hunger
  const gb = build(0, [{at: 10, to: 18}, ...HUNGER]);
  const gv = valueAt(f, 0, gb.main);
  const gg = valueAt(f, 0, gb.ghost);
  const gEv = lastEv(f, 18, HUNGER);
  // xp bar (0..1) and level
  const xp = valueAt(f, 0, [{at: 14, to: 0.7, dur: 24}, {at: LV - 22, to: 1, dur: 20}, {at: LV, to: 0, dur: 1}, {at: LV + 2, to: 0.25, dur: 22}], EASE.out);
  const xpGhost = valueAt(f, 0, [{at: 14, to: 0.7, dur: 24}, {at: LV - 24, to: 1, dur: 10}, {at: LV, to: 0, dur: 1}, {at: LV + 2, to: 0.25, dur: 10}], EASE.out);
  const level = f >= LV ? level0 + 1 : level0;
  const lvAge = f - LV;
  const lvBump = lvAge >= 0 && lvAge < 16 ? Math.sin((lvAge / 16) * Math.PI) : 0;

  // hit shake on the whole panel
  const hs = split(20, HEALTH);
  const hs2 = split(18, HUNGER);
  const hitAge = youngest(f, hs.hits);
  const shake = hitAge >= 0 && hitAge < 14 ? (1 - hitAge / 14) * 14 : 0;
  const shx = Math.sin(f * 3.1) * shake;
  const shy = Math.cos(f * 2.3) * shake * 0.6;

  const hurtGlow = hitAge >= 0 ? Math.max(0, 1 - hitAge / 26) : 0;
  const healAge = youngest(f, hs.heals);
  const healGlow = healAge >= 0 ? Math.max(0, 1 - healAge / 36) * 0.8 : 0;
  const lvGlow = lvAge >= 0 ? Math.max(0, 1 - lvAge / 26) * 0.8 : 0;

  const hFlash = hEv ? (hEv.gain ? Math.max(0, 1 - hEv.age / 24) : Math.max(0, 1 - hEv.age / 10) * (Math.floor(hEv.age / 2) % 2 === 0 ? 1 : 0.4)) : 0;
  const gFlash = gEv ? Math.max(0, 1 - gEv.age / 20) : 0;
  const xFlash = lvAge >= 0 ? Math.max(0, 1 - lvAge / 14) : f >= LV - 22 && f < LV ? 0.4 + 0.4 * Math.sin(f) : 0;

  const hNum = Math.round(hv);
  const gNum = Math.round(gv);
  const numBump = (age: number | undefined) => (age !== undefined && age >= 0 && age < 30 ? 1 + 0.18 * Math.sin((age / 30) * Math.PI) : 1);
  const rows = [
    {key: 'h', label: labels[0], icon: 'gui/sprites/hud/heart/full.png', bar: <Bar w={BW} value={hv / 20} ghost={hg / 20} fill={['#e03c3c', '#ff8a8a', '#8f1b1b']} ghostColor={hEv?.gain ? '#a6ff9a' : '#ffd6d6'} flash={hFlash} flashColor={hEv?.gain ? '#3dff7a' : '#ffffff'} />, val: `${hNum}`, sub: '/20', col: hEv?.gain && hEv.age < 30 ? '#8cff8c' : hEv && hEv.age < 30 ? '#ff7070' : '#fff', bump: numBump(hEv?.age)},
    {key: 'g', label: labels[1], icon: 'gui/sprites/hud/food_full.png', bar: <Bar w={BW} value={gv / 20} ghost={gg / 20} fill={['#d98a2b', '#ffc56b', '#8a4f12']} ghostColor="#ffe9c4" flash={gFlash} flashColor={gEv?.gain ? '#ffe08a' : '#ffffff'} />, val: `${gNum}`, sub: '/20', col: gEv && gEv.age < 30 ? (gEv.gain ? '#ffd27a' : '#ffb06a') : '#fff', bump: numBump(gEv?.age)},
    {key: 'x', label: labels[2], icon: '', bar: <Bar w={BW} value={xp} ghost={xpGhost} fill={['#6cc349', '#c8ff8a', '#3c8527']} ghostColor="#e8ffd0" flash={xFlash} flashColor="#fff6a0" segs={10} />, val: `Lv.${level}`, sub: '', col: '#8dff5a', bump: 1 + 0.35 * lvBump},
  ];
  const popX = PX0 + 120 + 140 + BW * 0.5;
  return (
    <Stage bg={bg}>
      <EdgeGlow color="rgba(255,40,40,0.9)" k={hurtGlow} size={300} />
      <EdgeGlow color="rgba(60,255,120,0.8)" k={healGlow} size={260} />
      <EdgeGlow color="rgba(248,200,60,0.9)" k={lvGlow} size={240} />
      <div style={{position: 'absolute', left: PX0, top: PY0, width: PW, height: PH, transform: `translate(${shx}px, ${shy + (1 - Math.min(1, inP)) * 400 + outP * 400}px) scale(${scale * (0.9 + 0.1 * Math.min(1, inP))})`, transformOrigin: '50% 100%', opacity: 1 - outP}}>
        <Slab w={PW} h={PH} tone="panel_raised" shadow={16}>
          <Halftone color="#000" opacity={0.12} />
          <Bolt x={28} y={28} />
          <Bolt x={PW - 28} y={28} />
          <Bolt x={28} y={PH - 28} />
          <Bolt x={PW - 28} y={PH - 28} />
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <Shine p={pr(f, 20, 24, (t) => t)} />
            <div style={{position: 'absolute', inset: 0, background: `rgba(255,40,40,${hurtGlow * 0.28})`}} />
            <div style={{position: 'absolute', inset: 0, background: `rgba(60,255,120,${healGlow * 0.14})`}} />
          </div>
          <div style={{position: 'absolute', left: 48, top: 22}}>
            <PX size={32} color={ORE.dim}>{title}</PX>
          </div>
          <div style={{position: 'absolute', right: 48, top: 22}}>
            <PX size={32} color={ORE.faint}>{statusLabels[Math.min(2, HEALTH.filter((e) => f >= e.at).length)]}</PX>
          </div>
        </Slab>
        {rows.map((r, i) => {
          const rowIn = back(pr(f, 6 + i * 4, 14, (t) => t));
          const y = 78 + i * 134;
          const isHeart = r.key === 'h';
          const iconShake = isHeart && hitAge >= 0 && hitAge < 14 ? Math.sin(f * 4) * 8 : 0;
          const iconPulse = isHeart && healAge >= 0 && healAge < 20 ? 1 + 0.3 * Math.sin((healAge / 20) * Math.PI) : 1;
          return (
            <div key={r.key} style={{position: 'absolute', left: 48, top: y, width: PW - 96, height: 112, transform: `translateX(${(1 - rowIn) * -300}px)`, opacity: rowIn > 0 ? 1 : 0}}>
              <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', boxShadow: '0 0 0 4px rgba(0,0,0,0.5)'}} />
              <div style={{position: 'absolute', left: 24, top: 20, width: 72, height: 72, transform: `translateX(${iconShake}px) scale(${iconPulse})`}}>
                {r.icon ? (
                  <>
                    <Img src={tex(isHeart ? 'gui/sprites/hud/heart/container.png' : 'gui/sprites/hud/food_empty.png')} style={{position: 'absolute', inset: 0, width: 72, height: 72, imageRendering: 'pixelated'}} />
                    <Img src={tex(r.icon)} style={{position: 'absolute', inset: 0, width: 72, height: 72, imageRendering: 'pixelated'}} />
                  </>
                ) : (
                  <ItemImg id="experience_bottle" size={72} />
                )}
              </div>
              <div style={{position: 'absolute', left: 120, top: 28}}>
                <PX size={48} color="#fff">{r.label}</PX>
              </div>
              <div style={{position: 'absolute', left: 280, top: 28}}>{r.bar}</div>
              <div style={{position: 'absolute', right: 40, top: 16, width: 280, textAlign: 'right', transform: `scale(${r.bump})`, transformOrigin: '100% 50%'}}>
                <PX size={72} color={r.col} shadow="rgba(0,0,0,0.6)">{r.val}</PX>
                <PX size={36} color={ORE.faint} shadow={false}>{r.sub}</PX>
              </div>
            </div>
          );
        })}
      </div>
      {/* floating numbers and particles */}
      {HEALTH.map((e, i) => {
        const prev = i ? HEALTH[i - 1].to : 20;
        const d = e.to - prev;
        return <Popup key={'hp' + i} at={e.at} x={popX} y={PY0 + 70} text={(d > 0 ? '+' : '') + d} color={d > 0 ? '#55ff55' : '#ff5555'} f={f} />;
      })}
      {HUNGER.map((e, i) => {
        if (!hs2.heals.includes(e.at)) return null;
        const prev = i ? HUNGER[i - 1].to : 18;
        return <Popup key={'gp' + i} at={e.at} x={popX} y={PY0 + 200} text={'+' + (e.to - prev)} color="#ffcc66" f={f} />;
      })}
      <Popup at={LV} x={PX0 + PW - 260} y={PY0 + 10} text={levelUpText} color="#fff6a0" f={f} />
      {hs.hits.map((at, i) => (
        <PixelBurst key={'hb' + i} x={PX0 + 280 + 8 + (BW - 16) * 0.4} y={PY0 + 78 + 56} at={at} count={36} colors={['#e03c3c', '#ff8a8a', '#fff', '#8f1b1b']} speed={22} life={30} size={14} seed={5 + i} />
      ))}
      {hs.heals.map((at, i) => (
        <PixelBurst key={'hh' + i} x={PX0 + 280 + BW * 0.7} y={PY0 + 78 + 56} at={at + 8} count={22} colors={['#3dff7a', '#a6ff9a', '#fff']} speed={14} life={30} size={12} gravity={-0.2} seed={6 + i} />
      ))}
      <PixelBurst x={PX0 + 280 + BW} y={PY0 + 78 + 134 * 2 + 56} at={LV} count={44} colors={['#fff6a0', '#6cc349', '#c8ff8a', '#fff']} speed={24} life={34} size={14} seed={7} />
      {hs.heals.map((at, i) => f >= at && f < at + 50 && <Motes key={'hm' + i} x={PX0 + 280} y={PY0 + 20} w={BW} h={150} count={14} seed={9} colors={['#a6ff9a', '#fff', '#3dff7a']} size={12} rise={2.2} opacity={0.9} />)}
      <Sfx at={4} src={mcSound('ui/toast/in')} volume={0.3} rate={1.4} />
      {hs.hits.map((at, i) => (
        <div key={'hs' + i}>
          <Sfx at={at} src={mcSound('random/explode2')} volume={0.28} rate={1.7} cut={14} />
          <Sfx at={at} src={mcSound('dig/stone1')} volume={0.55} rate={0.7} />
        </div>
      ))}
      {hs.heals.map((at, i) => (
        <div key={'hl' + i}>
          <Sfx at={at} src={mcSound('random/orb')} volume={0.45} rate={0.9} />
          <Sfx at={at + 6} src={mcSound('random/pop')} volume={0.3} rate={1.3} />
        </div>
      ))}
      {HUNGER.map((e, i) => (
        <Sfx key={'gs' + i} at={e.at} src={mcSound(hs2.heals.includes(e.at) ? 'random/pop' : 'random/click')} volume={hs2.heals.includes(e.at) ? 0.3 : 0.25} rate={hs2.heals.includes(e.at) ? 1.0 : 0.8} />
      ))}
      <Sfx at={LV - 2} src={mcSound('random/levelup')} volume={0.45} />
      <AbsoluteFill style={{pointerEvents: 'none'}} />
    </Stage>
  );
};
