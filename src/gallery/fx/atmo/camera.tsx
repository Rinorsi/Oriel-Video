import {useMemo} from 'react';
import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PIXEL_FONT} from '../../../mc/fonts';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {HeartRow, Stage, W, H, cornerEllipse, curveStops, hash, lerp, rgba, smooth, type RGB} from './common';

/**
 * Camera-style effects: shake (wraps footage), flash (white / gold / red), hurt (red edge + veins).
 * Flash and hurt are transparent layers. Shake needs to wrap the content it should shake (a layer cannot move footage below it).
 */

/* ------------------------------------------------------------------ shake */

export type ShakeLevel = 'light' | 'medium' | 'heavy';
export type ShakeHit = {at: number; level: ShakeLevel; scale?: number};

const LEVELS: Record<ShakeLevel, {amp: number; rot: number; decay: number; speed: number}> = {
  light: {amp: 9, rot: 0.25, decay: 9, speed: 1.15},
  medium: {amp: 24, rot: 0.7, decay: 15, speed: 1.0},
  heavy: {amp: 52, rot: 1.6, decay: 26, speed: 0.9},
};

const vnoise = (t: number, seed: number) => {
  const i = Math.floor(t);
  const k = t - i;
  const s = k * k * (3 - 2 * k);
  return (hash(i, seed) * (1 - s) + hash(i + 1, seed) * s) * 2 - 1;
};

/** Camera offset (px, deg) at frame f for a list of hits. env is the combined 0..1 strength. */
export const shakeAt = (f: number, hits: ShakeHit[]) => {
  let dx = 0;
  let dy = 0;
  let rot = 0;
  let env = 0;
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    const d = f - h.at;
    if (d < 0) continue;
    const L = LEVELS[h.level];
    const e = Math.exp(-d / L.decay) * (h.scale ?? 1);
    if (e < 0.004) continue;
    // First frame is a hard kick in a random direction, then correlated noise (smooth, not white).
    const a0 = hash(h.at, 7) * Math.PI * 2;
    const kick = d < 1 ? 1 : d < 2 ? 0.55 : 0;
    const t = d * L.speed;
    dx += (vnoise(t, h.at * 3 + 1) * 0.85 + Math.cos(a0) * kick) * L.amp * e;
    dy += (vnoise(t, h.at * 3 + 2) * 0.85 + Math.sin(a0) * kick) * L.amp * e * 0.8;
    rot += vnoise(t * 0.8, h.at * 3 + 3) * L.rot * e;
    env = Math.max(env, e);
  }
  return {dx, dy, rot, env};
};

/**
 * atm-shake: wrap footage in <Shake hits={[{at, level}]}>...</Shake>.
 * Props: hits [{at frame, level 'light'|'medium'|'heavy', scale?}], blur (0..1 directional motion blur), ghost (add a faded copy at the
 *        previous position; it renders the children twice, so turn it off if they contain <Audio>).
 * The content is zoomed slightly while shaking so the frame edges never show.
 */
export const Shake: FC<{hits: ShakeHit[]; blur?: number; ghost?: boolean; children: ReactNode}> = ({hits, blur = 1, ghost = true, children}) => {
  const f = useCurrentFrame();
  const now = shakeAt(f, hits);
  const prev = shakeAt(f - 1, hits);
  const vx = now.dx - prev.dx;
  const vy = now.dy - prev.dy;
  const reach = Math.max(...hits.map((h) => LEVELS[h.level].amp * (h.scale ?? 1) * 1.1 + LEVELS[h.level].rot * 17), 0);
  const sc = (e: number) => 1 + (e * reach * 2.2) / W + 0.002;
  const tf = (s: typeof now) => `translate(${s.dx.toFixed(2)}px, ${s.dy.toFixed(2)}px) rotate(${s.rot.toFixed(3)}deg) scale(${sc(Math.max(s.env, now.env)).toFixed(4)})`;
  const bx = Math.min(9, Math.abs(vx) * 0.14 * blur);
  const by = Math.min(9, Math.abs(vy) * 0.14 * blur);
  const filterId = 'shake-blur';
  const active = now.env > 0.004 || prev.env > 0.004;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>
      {ghost && active && (
        <AbsoluteFill style={{transform: tf(prev), opacity: 0.38, filter: `url(#${filterId})`}}>{children}</AbsoluteFill>
      )}
      <AbsoluteFill style={{transform: tf(now), filter: active && blur > 0 ? `url(#${filterId})` : undefined, opacity: 1}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Dust and pebbles that rain off the top edge when a medium / heavy hit lands. Transparent companion layer. */
export const ShakeDust: FC<{hits: ShakeHit[]}> = ({hits}) => {
  const f = useCurrentFrame();
  const parts = useMemo(() => {
    const out: {at: number; x: number; v: number; s: number; life: number; dark: number; drift: number}[] = [];
    hits.forEach((h, hi) => {
      if (h.level === 'light') return;
      const n = h.level === 'heavy' ? 46 : 22;
      for (let i = 0; i < n; i++) {
        out.push({at: h.at + Math.floor(hash(hi, i, 1) * 6), x: hash(hi, i, 2) * W, v: 2 + hash(hi, i, 3) * 6, s: 6 + Math.floor(hash(hi, i, 4) * 4) * 6, life: 40 + hash(hi, i, 5) * 40, dark: hash(hi, i, 6), drift: (hash(hi, i, 7) - 0.5) * 1.4});
      }
    });
    return out;
  }, [hits]);
  return (
    <AbsoluteFill>
      {hits.map((h, i) => {
        if (h.level === 'light') return null;
        const d = f - h.at;
        if (d < 0 || d > 50) return null;
        const a = Math.exp(-d / 14) * (h.level === 'heavy' ? 0.55 : 0.32);
        return <AbsoluteFill key={i} style={{background: `linear-gradient(to bottom, rgba(150,138,120,${a.toFixed(3)}), rgba(150,138,120,0) 34%)`}} />;
      })}
      {parts.map((p, i) => {
        const d = f - p.at;
        if (d < 0 || d > p.life) return null;
        const y = -p.s + 0.5 * 0.55 * d * d + p.v * d * 0.6;
        const fade = Math.min(1, (p.life - d) / 12);
        const shade = Math.round(lerp(58, 130, p.dark));
        return <div key={i} style={{position: 'absolute', left: Math.round((p.x + p.drift * d) / 6) * 6, top: Math.round(y / 6) * 6, width: p.s, height: p.s, background: `rgb(${shade},${shade - 8},${shade - 20})`, boxShadow: `inset -${p.s / 3}px -${p.s / 3}px 0 rgba(0,0,0,0.3)`, opacity: fade}} />;
      })}
    </AbsoluteFill>
  );
};

const SHAKE_HITS: ShakeHit[] = [
  {at: 14, level: 'light'},
  {at: 58, level: 'medium'},
  {at: 102, level: 'heavy'},
  {at: 118, level: 'medium', scale: 0.7},
];
const LEVEL_NAME: Record<ShakeLevel, [string, string]> = {light: ['轻', '#a8f0c6'], medium: ['中', '#ffd23f'], heavy: ['重', '#ff4d5e']};

const ShakeDemo: FC = () => {
  const f = useCurrentFrame();
  // HUD stays steady while the world shakes: this is how the wrapper is meant to be used (world inside, UI outside).
  let cur: ShakeHit | undefined;
  for (const h of SHAKE_HITS) if (f >= h.at) cur = h;
  const meter = (lv: ShakeLevel) => (cur && cur.level === lv && f - cur.at < 40 ? 1 : 0.28);
  return (
    <>
      <Shake hits={SHAKE_HITS}>
        <Stage plate="A" />
      </Shake>
      <ShakeDust hits={SHAKE_HITS} />
      <div style={{position: 'absolute', left: 48, top: 40, display: 'flex', gap: 16, alignItems: 'center'}}>
        {(['light', 'medium', 'heavy'] as ShakeLevel[]).map((lv) => (
          <div key={lv} style={{width: 96, height: 96, background: `rgba(20,20,24,0.78)`, border: `6px solid ${LEVEL_NAME[lv][1]}`, opacity: meter(lv), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PIXEL_FONT, fontSize: 60, lineHeight: '60px', color: LEVEL_NAME[lv][1], boxShadow: '0 6px 0 rgba(0,0,0,0.5)'}}>
            {LEVEL_NAME[lv][0]}
          </div>
        ))}
      </div>
      <Sfx at={14} src={mcSound('dig/stone1')} volume={0.45} rate={1.2} />
      <Sfx at={58} src={mcSound('random/explode3')} volume={0.4} rate={1.4} cut={26} />
      <Sfx at={102} src={mcSound('random/explode1')} volume={0.6} rate={0.8} />
      <Sfx at={118} src={mcSound('dig/gravel1')} volume={0.5} rate={0.8} />
    </>
  );
};

/* ------------------------------------------------------------------ flash */

export type FlashKind = 'white' | 'gold' | 'red';
const FLASH: Record<FlashKind, {core: RGB; mid: RGB; edge: RGB; life: number; peak: number}> = {
  white: {core: [255, 255, 255], mid: [236, 246, 255], edge: [170, 205, 255], life: 18, peak: 0.96},
  gold: {core: [255, 250, 215], mid: [255, 210, 72], edge: [255, 140, 18], life: 30, peak: 0.92},
  red: {core: [255, 190, 180], mid: [255, 42, 52], edge: [120, 0, 10], life: 36, peak: 0.88},
};

/**
 * atm-flash: a flash that jumps to full strength in one frame and then decays; a hot core, a pixel cross flare and a tinted afterglow.
 * Props: kind 'white' | 'gold' | 'red', at (start frame), life (frames, defaults per kind), peak (0..1), x / y (origin 0..1 of the frame),
 *        sparks (pixel sparks flying out of the origin, gold/white).
 */
export const FlashFx: FC<{kind?: FlashKind; at?: number; life?: number; peak?: number; x?: number; y?: number; sparks?: boolean}> = ({kind = 'white', at = 0, life, peak, x = 0.5, y = 0.5, sparks = true}) => {
  const f = useCurrentFrame() - at;
  const K = FLASH[kind];
  const L = life ?? K.life;
  if (f < 0 || f > L * 2.6) return null;
  const P = peak ?? K.peak;
  const attack = Math.min(1, (f + 1) / 2);
  const fast = attack * Math.exp(-Math.max(0, f - 1) / (L * 0.16));
  const mid = attack * Math.exp(-Math.max(0, f - 1) / (L * 0.38));
  const slow = attack * Math.exp(-Math.max(0, f - 1) / (L * 0.8));
  const cx = x * W;
  const cy = y * H;
  const crossT = Math.max(6, Math.round(lerp(96, 12, 1 - Math.exp(-f / (L * 0.3))) / 6) * 6);
  const crossLen = 1 - Math.exp(-f / (L * 0.25));
  const sparksOn = sparks && kind !== 'red';
  return (
    <AbsoluteFill>
      {/* afterglow: tinted rim that lingers (edges heavier than the middle) */}
      <AbsoluteFill style={{background: `radial-gradient(${cornerEllipse(x, y)}, ${curveStops(K.edge, 0.7 * P * slow, 0.15, 1, 1.4)})`}} />
      {/* mid tint over the whole frame */}
      <AbsoluteFill style={{background: rgba(K.mid, 0.82 * P * mid)}} />
      {/* pixel cross flare through the origin (replaces the old expanding halo): bars thicken then collapse */}
      <div style={{position: 'absolute', left: 0, top: Math.round((cy - crossT / 2) / 6) * 6, width: W, height: crossT, background: `linear-gradient(90deg, ${rgba(K.mid, 0)} 0%, ${rgba(K.core, P * fast)} ${Math.max(10, 50 - crossLen * 40)}%, ${rgba(K.core, P * fast)} ${Math.min(90, 50 + crossLen * 40)}%, ${rgba(K.mid, 0)} 100%)`}} />
      <div style={{position: 'absolute', left: Math.round((cx - crossT / 2) / 6) * 6, top: 0, width: crossT, height: H, background: `linear-gradient(180deg, ${rgba(K.mid, 0)} 0%, ${rgba(K.core, P * fast)} ${Math.max(10, 50 - crossLen * 40)}%, ${rgba(K.core, P * fast)} ${Math.min(90, 50 + crossLen * 40)}%, ${rgba(K.mid, 0)} 100%)`}} />
      {/* hot core: white-hot, shrinks as it dies */}
      <AbsoluteFill style={{background: rgba(K.core, 0.75 * P * fast)}} />
      {sparksOn &&
        Array.from({length: 22}, (_, i) => {
          const a = hash(at, i, 1) * Math.PI * 2;
          const v = 30 + hash(at, i, 2) * 52;
          const d = Math.max(0, f);
          const r = v * (1 - Math.pow(0.88, d)) / 0.12;
          const life = 14 + hash(at, i, 3) * 16;
          if (d > life) return null;
          const s = (i % 3 === 0 ? 18 : 12) * (1 - d / life);
          const px = Math.round((cx + Math.cos(a) * r) / 6) * 6;
          const py = Math.round((cy + Math.sin(a) * r * 0.8 + d * d * 0.18) / 6) * 6;
          return <div key={i} style={{position: 'absolute', left: px, top: py, width: s, height: s, background: i % 2 ? rgba(K.core, 1) : rgba(K.mid, 1), boxShadow: `0 0 ${s}px ${rgba(K.mid, 0.8)}`}} />;
        })}
    </AbsoluteFill>
  );
};

const FlashDemo: FC = () => {
  const f = useCurrentFrame();
  const kinds: [FlashKind, number][] = [
    ['white', 14],
    ['gold', 62],
    ['red', 110],
  ];
  let cur = '';
  for (const [k, at] of kinds) if (f >= at - 2 && f < at + 40) cur = k;
  const label: Record<string, [string, string]> = {white: ['白闪', '#ffffff'], gold: ['金闪', '#ffd23f'], red: ['红闪', '#ff4d5e']};
  return (
    <>
      <Stage plate="A" />
      {kinds.map(([k, at]) => (
        <FlashFx key={k} kind={k} at={at} />
      ))}
      {cur && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 96, lineHeight: '96px', color: label[cur][1], textShadow: '0 6px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>{label[cur][0]}</div>
      )}
      <Sfx at={14} src={mcSound('random/explode3')} volume={0.28} rate={1.6} cut={20} />
      <Sfx at={62} src={mcSound('random/levelup')} volume={0.4} />
      <Sfx at={110} src={mcSound('random/anvil_land')} volume={0.45} rate={0.9} />
    </>
  );
};

/* ------------------------------------------------------------------ hurt */

type Vein = {d: string; w: number; delay: number};

const makeVeins = (count: number, seed: number): Vein[] => {
  const out: Vein[] = [];
  const grow = (x: number, y: number, ang: number, len: number, width: number, depth: number, delay: number, k: number) => {
    const pts: [number, number][] = [[x, y]];
    let cx = x;
    let cy = y;
    let a = ang;
    const steps = Math.max(3, Math.round(len / 34));
    for (let s = 0; s < steps; s++) {
      a += (hash(seed, k, s * 7 + depth) - 0.5) * 0.9;
      const seg = 22 + hash(seed, k, s * 11 + depth) * 26;
      cx += Math.cos(a) * seg;
      cy += Math.sin(a) * seg;
      pts.push([cx, cy]);
      if (depth < 3 && s > 0 && hash(seed, k, s * 13 + depth) < 0.42) {
        const side = hash(seed, k, s * 17 + depth) < 0.5 ? -1 : 1;
        grow(cx, cy, a + side * (0.5 + hash(seed, k, s * 19) * 0.7), len * 0.5, width * 0.62, depth + 1, delay + s * 0.04, k * 31 + s + depth * 7);
      }
    }
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    out.push({d, w: width, delay});
  };
  for (let i = 0; i < count; i++) {
    const side = Math.floor(hash(seed, i, 1) * 4);
    const t = hash(seed, i, 2);
    const jitter = 8 - hash(seed, i, 3) * 40; // start slightly outside
    let x = 0;
    let y = 0;
    let ang = 0;
    if (side === 0) {
      x = t * W;
      y = jitter;
      ang = Math.PI / 2;
    } else if (side === 1) {
      x = t * W;
      y = H - jitter;
      ang = -Math.PI / 2;
    } else if (side === 2) {
      x = jitter;
      y = t * H;
      ang = 0;
    } else {
      x = W - jitter;
      y = t * H;
      ang = Math.PI;
    }
    ang += (hash(seed, i, 4) - 0.5) * 0.8;
    const len = (side < 2 ? 190 : 230) + hash(seed, i, 5) * 180;
    grow(x, y, ang, len, 2.6 + hash(seed, i, 6) * 2.2, 0, hash(seed, i, 8) * 0.25, i);
  }
  return out;
};

/**
 * atm-hurt: red edge pulse + blood-vessel texture + a jitter when you take a hit; at low health it keeps breathing.
 * Props: hits [{at, power 0..1}] (frames), lowFrom (frame where the low-health breathing starts; omit for none), lowBpm (breathing rate),
 *        low (0..1 strength of the low-health glow), veins (count).
 */
export const Hurt: FC<{hits?: {at: number; power?: number}[]; lowFrom?: number; lowBpm?: number; low?: number; veins?: number}> = ({
  hits = [
    {at: 10, power: 1},
    {at: 56, power: 0.75},
  ],
  lowFrom = 92,
  lowBpm = 46,
  low = 0.8,
  veins = 34,
}) => {
  const f = useCurrentFrame();
  const vs = useMemo(() => makeVeins(veins, 12), [veins]);
  // hit envelope: 0..1, instant attack, long decay
  let hitEnv = 0;
  let jitter = 0;
  let flash = 0;
  for (let i = 0; i < hits.length; i++) {
    const d = f - hits[i].at;
    if (d < 0) continue;
    const p = hits[i].power ?? 1;
    hitEnv = Math.max(hitEnv, p * Math.min(1, (d + 1) / 2) * Math.exp(-d / 20));
    if (d < 10) jitter = Math.max(jitter, p * (1 - d / 10));
    flash = Math.max(flash, p * Math.exp(-d / 3.5));
  }
  let breathe = 0;
  if (lowFrom !== undefined && f >= lowFrom) {
    const ramp = smooth(lowFrom, lowFrom + 18, f);
    const ph = ((f - lowFrom) * lowBpm) / 1800;
    breathe = low * ramp * (0.5 + 0.5 * Math.sin(ph * Math.PI * 2 - Math.PI / 2)) * 0.8 + low * ramp * 0.2;
  }
  const e = Math.min(1, hitEnv + breathe);
  const jx = jitter * (hash(f, 1) - 0.5) * 26;
  const jy = jitter * (hash(f, 2) - 0.5) * 20;
  const jr = jitter * (hash(f, 3) - 0.5) * 0.5;
  const veinAmt = Math.min(1, hitEnv * 0.95 + breathe * 0.85);
  const ringStops = curveStops([190, 8, 22], 0.9 * e, 0.28, 1, 1.5);
  const darkStops = curveStops([40, 0, 6], 0.8 * e, 0.55, 1, 2);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: rgba([255, 20, 30], 0.26 * flash)}} />
      <AbsoluteFill style={{transform: `translate(${jx}px, ${jy}px) rotate(${jr}deg) scale(1.03)`}}>
        <AbsoluteFill style={{background: `radial-gradient(${cornerEllipse()}, ${ringStops})`}} />
        <AbsoluteFill style={{background: `radial-gradient(${cornerEllipse()}, ${darkStops})`}} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <filter id="vein-glow" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <g filter="url(#vein-glow)" opacity={0.75 * veinAmt}>
            {vs.map((v, i) => (
              <path key={i} d={v.d} fill="none" stroke="#ff2b3c" strokeWidth={v.w * 2.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - smooth(v.delay, v.delay + 0.7, veinAmt)} />
            ))}
          </g>
          <g opacity={veinAmt}>
            {vs.map((v, i) => (
              <path key={i} d={v.d} fill="none" stroke={i % 3 === 0 ? '#7a0715' : '#b00f24'} strokeWidth={v.w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - smooth(v.delay, v.delay + 0.7, veinAmt)} />
            ))}
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const HURT_HITS = [
  {at: 10, power: 1},
  {at: 56, power: 0.75},
];
const HURT_SHAKE: ShakeHit[] = [
  {at: 10, level: 'light', scale: 1.1},
  {at: 56, level: 'light', scale: 0.8},
];

const HurtDemo: FC = () => {
  const f = useCurrentFrame();
  const hp = f < 10 ? 20 : f < 56 ? 12 : 3;
  const blink = (f >= 10 && f < 22) || (f >= 56 && f < 68);
  const breathe = f >= 92 ? 0.5 + 0.5 * Math.sin(((f - 92) * 46 * Math.PI * 2) / 1800 - Math.PI / 2) : 0;
  return (
    <>
      <Shake hits={HURT_SHAKE} ghost={false}>
        <Stage plate="A" />
      </Shake>
      <div style={{position: 'absolute', left: 612, top: 880, transform: `translateY(${-breathe * 4}px)`}}>
        <HeartRow hp={hp} blink={blink} />
      </div>
      <Hurt hits={HURT_HITS} lowFrom={92} />
      <Sfx at={10} src={mcSound('dig/stone3')} volume={0.6} rate={0.7} />
      <Sfx at={56} src={mcSound('dig/stone3')} volume={0.5} rate={0.65} />
      <Sfx at={92} src={mcSound('dig/stone1')} volume={0.35} rate={0.45} cut={12} />
      <Sfx at={134} src={mcSound('dig/stone1')} volume={0.35} rate={0.45} cut={12} />
    </>
  );
};

/* ------------------------------------------------------------------ entries */

export const cameraEntries: FxEntry[] = [
  {
    meta: {
      id: 'atm-shake',
      name: '震屏',
      category: 'atmosphere',
      tags: ['震屏', '相机抖动', '爆炸', '冲击', '包裹组件'],
      frames: 150,
      blurb: '轻/中/重三档镜头抖动：首帧猛踢、随后衰减，带方向模糊和残影；中/重档从顶部落下尘土碎石。界面（左上档位）保持稳定，只有画面在抖。',
      usage: '爆炸、重击、落地、Boss 出场。用 <Shake hits={[{at, level}]}> 包住镜头画面（世界层），字幕/血条放在外面。',
      params: [
        {name: 'hits', desc: "[{at 帧, level 'light'|'medium'|'heavy', scale 0..1+}]，可多次触发、叠加"},
        {name: 'blur', desc: '方向模糊强度 0..1，0 关闭'},
        {name: 'ghost', desc: '是否叠一份上一帧的残影（会重复渲染 children，含 Audio 时请关掉）'},
        {name: 'ShakeDust hits', desc: '配套透明层：尘土/碎石，可单独叠在任何素材上'},
      ],
    },
    Demo: ShakeDemo,
    Layer: () => <ShakeDust hits={SHAKE_HITS} />,
  },
  {
    meta: {
      id: 'atm-flash',
      name: '闪白 / 闪色',
      category: 'atmosphere',
      tags: ['闪白', '闪光', '金闪', '红闪', '透明层'],
      frames: 150,
      blurb: '白闪、金闪、红闪三种：一帧到峰值，白热核心 + 外扩光晕 + 带色余辉依次衰减，金/白闪伴随像素火星。',
      usage: '爆炸、升级、获得稀有物品（金）、受击/危险（红）、镜头硬切前的转场闪光。',
      params: [
        {name: 'kind', desc: "'white' | 'gold' | 'red'"},
        {name: 'at / life', desc: '触发帧 / 衰减帧数（每种有默认值）'},
        {name: 'peak', desc: '峰值强度 0..1'},
        {name: 'x / y', desc: '光源位置 0..1'},
        {name: 'sparks', desc: '是否有像素火星'},
      ],
    },
    Demo: FlashDemo,
    Layer: () => (
      <>
        <FlashFx kind="white" at={14} />
        <FlashFx kind="gold" at={62} />
        <FlashFx kind="red" at={110} />
      </>
    ),
  },
  {
    meta: {
      id: 'atm-hurt',
      name: '受伤红边',
      category: 'atmosphere',
      tags: ['受伤', '血量', '红边', '血丝', '透明层'],
      frames: 150,
      blurb: '受击瞬间红色边缘脉冲，血丝由边缘向内生长并带轻微抖动；血量见底后红边持续缓慢呼吸。',
      usage: '玩家受伤、低血量警示、剧情中的危险时刻。',
      params: [
        {name: 'hits', desc: '[{at 帧, power 0..1}] 受击时刻与力度'},
        {name: 'lowFrom / lowBpm / low', desc: '低血量呼吸开始帧 / 呼吸频率 / 强度；不想要就设 lowFrom={undefined}'},
        {name: 'veins', desc: '血丝根数'},
      ],
    },
    Demo: HurtDemo,
    Layer: () => <Hurt />,
  },
];
