import type {FC} from 'react';
import {EASE, clamp01} from '../../../mc/theme';
import {PixelSprite} from '../../flat';
import {OreTooltip} from '../../../reel/kit';
import {ORE} from '../../../mg/Ore';
import {FaceToken, Flag, GOLD, GroundShadow, HorseArt, IconBadge, INK, MinecartArt, BoatArt, NameTag, Pushpin, RED, RedCross, WingsArt, PearlArt} from './art';
import {Anchor, Particles, PixelBurst, lerp, offsetPts, pointAt, ptsStr, subPath, useCam, type MapNode, type Route, type P} from './engine';
import {WH, WW} from './mapgen';

/** Trails, markers, signs and the player avatar. */

export const psOf = (z: number) => Math.max(1, Math.min(1.8, 0.85 / z));

const Svg: FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/** Treasure-map dashed line, drawn from s0 to s1. */
export const DashedRoute: FC<{route: Route; s0?: number; s1: number; color?: string; dash?: [number, number]; width?: number}> = ({route, s0 = 0, s1, color = '#c43c33', dash = [22, 16], width = 9}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const pts = subPath(route, s0, s1);
  if (pts.length < 2) return null;
  const str = ptsStr(pts);
  return (
    <Svg>
      <polyline points={str} fill="none" stroke={INK} strokeWidth={(width + 8) * ps} strokeDasharray={`${(dash[0] + 8) * ps} ${(dash[1] - 8) * ps}`} strokeDashoffset={4 * ps} strokeLinejoin="round" />
      <polyline points={str} fill="none" stroke={color} strokeWidth={width * ps} strokeDasharray={`${dash[0] * ps} ${dash[1] * ps}`} strokeLinejoin="round" />
    </Svg>
  );
};

/** Faint full-length guide (very light dotted) so the viewer sees where it is going. */
export const GuideRoute: FC<{route: Route; opacity?: number; color?: string}> = ({route, opacity = 0.35, color = '#4a3623'}) => {
  const {z} = useCam();
  const ps = psOf(z);
  return (
    <Svg>
      <polyline points={ptsStr(route.pts)} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={5 * ps} strokeDasharray={`${6 * ps} ${18 * ps}`} />
    </Svg>
  );
};

/** Iron rails with wooden ties between s0 and s1. */
export const RailRoute: FC<{route: Route; s0?: number; s1: number}> = ({route, s0 = 0, s1}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const pts = subPath(route, s0, s1);
  if (pts.length < 2) return null;
  const str = ptsStr(pts);
  const l = ptsStr(offsetPts(pts, -14 * ps));
  const r = ptsStr(offsetPts(pts, 14 * ps));
  return (
    <Svg>
      <polyline points={str} fill="none" stroke={INK} strokeWidth={(42 + 6) * ps} strokeDasharray={`${(10 + 6) * ps} ${(16 - 6) * ps}`} strokeDashoffset={3 * ps} />
      <polyline points={str} fill="none" stroke="#8b5f38" strokeWidth={42 * ps} strokeDasharray={`${10 * ps} ${16 * ps}`} />
      <polyline points={l} fill="none" stroke={INK} strokeWidth={13 * ps} strokeLinejoin="round" />
      <polyline points={r} fill="none" stroke={INK} strokeWidth={13 * ps} strokeLinejoin="round" />
      <polyline points={l} fill="none" stroke="#c6cad6" strokeWidth={6 * ps} strokeLinejoin="round" />
      <polyline points={r} fill="none" stroke="#c6cad6" strokeWidth={6 * ps} strokeLinejoin="round" />
    </Svg>
  );
};

const BOOT = {rows: ['.XXX.', 'XXXXX', 'XXXXX', 'XXXXX', '.XXX.', '.....', '.XXX.', '.XXX.']};

/** Alternating boot prints behind the walker. */
export const Footprints: FC<{route: Route; s: number; s0?: number; stride?: number; color?: string}> = ({route, s, s0 = 0, stride = 40, color = '#5b3a22'}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const out: React.ReactNode[] = [];
  const n = Math.floor((s - s0) / stride);
  for (let k = 0; k <= n; k++) {
    const sk = s0 + k * stride + 18;
    if (sk > s) break;
    const p = pointAt(route, sk);
    const side = k % 2 === 0 ? 1 : -1;
    const nx = -Math.sin(p.ang);
    const ny = Math.cos(p.ang);
    const x = p.x + nx * 26 * ps * side;
    const y = p.y + ny * 26 * ps * side;
    out.push(
      <div key={k} style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `rotate(${(p.ang * 180) / Math.PI + 90}deg)`}}>
        <div style={{position: 'absolute', left: -BOOT.rows[0].length * 2 * ps - 3 * ps, top: -BOOT.rows.length * 2 * ps - 3 * ps, padding: 3 * ps, background: 'rgba(255,244,214,0.5)', borderRadius: 4 * ps, opacity: 0.9}}>
          <PixelSprite sprite={{rows: BOOT.rows, palette: {X: color}}} px={4 * ps} />
        </div>
      </div>,
    );
  }
  return <>{out}</>;
};

/** Pairs of hoof marks. */
export const Hoofprints: FC<{route: Route; s: number; stride?: number}> = ({route, s, stride = 54}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const out: React.ReactNode[] = [];
  const n = Math.floor(s / stride);
  for (let k = 0; k <= n; k++) {
    const sk = k * stride + 20;
    if (sk > s) break;
    const p = pointAt(route, sk);
    const rot = (p.ang * 180) / Math.PI;
    const U = (dx: number, dy: number, key: string) => (
      <div key={key} style={{position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, transform: `rotate(${rot}deg)`}}>
        <div style={{position: 'absolute', left: dx * ps - 5 * ps, top: dy * ps - 7 * ps, width: 10 * ps, height: 14 * ps, background: '#4a3020', opacity: 0.85, clipPath: 'polygon(0 0, 35% 0, 35% 55%, 65% 55%, 65% 0, 100% 0, 100% 100%, 0 100%)'}} />
      </div>
    );
    out.push(U(0, -11, `a${k}`), U(14, 11, `b${k}`));
  }
  return <>{out}</>;
};

/** V-shaped foam wake behind a boat. */
export const Wake: FC<{route: Route; s: number}> = ({route, s}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const N = 16;
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const b0 = i * 20;
    const b1 = (i + 1) * 20;
    if (s - b1 < 0) break;
    const mk = (b: number, side: number): P => {
      const p = pointAt(route, s - b);
      const off = (16 + b * 0.3) * ps * side;
      return {x: p.x - Math.sin(p.ang) * off, y: p.y + Math.cos(p.ang) * off};
    };
    for (const side of [1, -1]) {
      const a = mk(b0, side);
      const c = mk(b1, side);
      lines.push(<line key={`${i}-${side}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#ffffff" strokeOpacity={1 - i / N} strokeWidth={Math.max(4, 12 - i * 0.5) * ps} strokeLinecap="square" />);
    }
  }
  return <Svg>{lines}</Svg>;
};

/** Twin wing-tip streaks behind an elytra glider. */
export const Contrail: FC<{route: Route; s: number; len?: number; color?: string; dy?: number}> = ({route, s, len = 520, color = '#ffffff', dy = 0}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const N = 30;
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const b0 = (i / N) * len;
    const b1 = ((i + 1) / N) * len;
    if (s - b1 < 0) break;
    for (const side of [1, -1]) {
      const sp = (b: number) => {
        const p = pointAt(route, s - b);
        const off = (46 + b * 0.05) * ps * side;
        return {x: p.x - Math.sin(p.ang) * off, y: p.y + Math.cos(p.ang) * off - dy};
      };
      const a = sp(b0);
      const c = sp(b1);
      const k = 1 - i / N;
      lines.push(<line key={`${i}-${side}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={color} strokeOpacity={k * 0.95} strokeWidth={(4 + 12 * k) * ps} strokeLinecap="round" />);
    }
  }
  return <Svg>{lines}</Svg>;
};

/** Ender pearl arc: ground track is the route, the lift is purely visual. */
export const arcLift = (t: number, h: number) => h * 4 * t * (1 - t);

export const PearlArc: FC<{route: Route; t: number; h: number}> = ({route, t, h}) => {
  const {z} = useCam();
  const ps = psOf(z);
  const N = 60;
  const pts: P[] = [];
  for (let i = 0; i <= N; i++) {
    const tt = (i / N) * t;
    const p = pointAt(route, tt * route.len);
    pts.push({x: p.x, y: p.y - arcLift(tt, h)});
  }
  if (pts.length < 2) return null;
  const str = ptsStr(pts);
  return (
    <Svg>
      <polyline points={str} fill="none" stroke="#3a1a6e" strokeOpacity={0.55} strokeWidth={14 * ps} strokeDasharray={`${12 * ps} ${16 * ps}`} />
      <polyline points={str} fill="none" stroke="#c79bff" strokeWidth={8 * ps} strokeDasharray={`${12 * ps} ${16 * ps}`} />
    </Svg>
  );
};

// ------------------------------------------------------------------ markers
const popScale = (f: number, at: number, dur = 14) => {
  const p = clamp01((f - at) / dur);
  return p === 0 ? 0 : EASE.back(p);
};

export const Sign: FC<{node: MapNode; f: number; at: number; hold?: number; lift?: number; side?: 1 | -1; k?: number; accent?: string; extra?: string}> = ({node, f, at, hold, lift = 70, side = 1, k = 1, accent = ORE.gold, extra}) => {
  const d = f - at;
  if (d < 0) return null;
  let sc = popScale(f, at, 12);
  if (hold !== undefined && d > hold) sc *= 1 - EASE.in(clamp01((d - hold) / 10));
  if (sc <= 0.01) return null;
  const reveal = clamp01((d - 4) / 14);
  const lines = [
    {text: node.name, color: accent},
    {text: `X: ${node.xz[0]}   Z: ${node.xz[1]}`, color: '#c8c8d0'},
    ...(node.sub || extra ? [{text: extra ?? node.sub ?? '', color: '#55ffff'}] : []),
  ];
  return (
    <Anchor x={node.pos[0] * WW} y={node.pos[1] * WH} k={k}>
      <div style={{position: 'absolute', ...(side === 1 ? {left: 110} : {right: 110}), bottom: lift, transform: `scale(${sc})`, transformOrigin: side === 1 ? '0 100%' : '100% 100%'}}>
        <OreTooltip lines={lines} rare reveal={reveal} style={{boxShadow: '0 10px 0 rgba(30,20,10,0.45)'}} />
        <div style={{position: 'absolute', bottom: -4, ...(side === 1 ? {left: -30} : {right: -30}), width: 30, height: 8, background: '#2a0f3f', border: `0 solid ${INK}`}} />
      </div>
    </Anchor>
  );
};

/** Pushpin for the start of a route. */
export const StartPin: FC<{node: MapNode; f: number; at: number; label?: boolean}> = ({node, f, at, label = true}) => {
  const d = f - at;
  if (d < 0) return null;
  const drop = d < 10 ? -240 * Math.pow(1 - d / 10, 2) : 0;
  const sq = d >= 10 ? Math.max(0, 1 - (d - 10) / 8) * Math.sin((d - 10) * 1.2) : 0;
  return (
    <Anchor x={node.pos[0] * WW} y={node.pos[1] * WH}>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <GroundShadow w={70} k={1} />
        {d >= 10 && d < 34 && <PixelBurst d={d - 10} reach={130} color={RED} accent="#ffd0d0" seed={7} life={24} />}
        <div style={{position: 'absolute', left: -48, top: -144 + drop, transformOrigin: '50% 100%', transform: `scale(${1 + sq * 0.12}, ${1 - sq * 0.16})`}}>
          <Pushpin size={96} />
        </div>
        {label && (
          <div style={{position: 'absolute', left: 44, top: -30, transform: `scale(${popScale(f, at + 6)})`, transformOrigin: '0 50%'}}>
            <NameTag size={36}>{node.name}</NameTag>
          </div>
        )}
      </div>
    </Anchor>
  );
};

/** Waypoint / destination marker. States: ghost until `reachedAt`, then solid with a pop; the final node raises a flag. */
export const PlaceMarker: FC<{node: MapNode; f: number; showAt: number; reachedAt: number; departAt?: number; final?: boolean; label?: boolean; ring?: string; up?: number; side?: 1 | -1; check?: boolean}> = ({node, f, showAt, reachedAt, departAt, final, label = true, ring, up: upBy = 170, side = 1, check = true}) => {
  if (f < showAt) return null;
  const reached = f >= reachedAt;
  const appear = popScale(f, showAt, 12);
  const pop = reached ? popScale(f, reachedAt, 14) : 1;
  const bob = reached ? 0 : Math.sin(f * 0.14) * 6;
  const col = ring ?? node.color ?? (final ? GOLD : '#4fb4e8');
  const sc = appear * (reached ? 0.9 + 0.1 * pop + (pop > 1 ? (pop - 1) * 0.6 : 0) : 1);
  const pulse = ((f - showAt) % 54) / 54;
  const upT = reached ? EASE.back(clamp01((f - reachedAt - 2) / 12)) : 0;
  const downT = departAt !== undefined ? EASE.out(clamp01((f - departAt) / 12)) : 0;
  const up = upBy * upT * (1 - downT);
  return (
    <Anchor x={node.pos[0] * WW} y={node.pos[1] * WH}>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <GroundShadow w={100} />
        {!reached && (
          // four stepped corner brackets on the ground that breathe outward (no ring)
          <div style={{position: 'absolute', left: 0, top: 0, opacity: 1 - Math.floor(pulse * 4) * 0.2}}>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], q) => {
              const o = 44 + Math.floor(pulse * 4) * 8;
              const cx = sx * o;
              const cy = sy * o * 0.5;
              return (
                <div key={q}>
                  <div style={{position: 'absolute', left: sx > 0 ? cx - 20 : cx, top: sy > 0 ? cy - 8 : cy, width: 20, height: 8, background: INK}} />
                  <div style={{position: 'absolute', left: sx > 0 ? cx - 8 : cx, top: sy > 0 ? cy - 16 : cy, width: 8, height: 16, background: INK}} />
                </div>
              );
            })}
          </div>
        )}
        <div style={{position: 'absolute', left: -52, top: -126 - 20 + bob - up, transformOrigin: '50% 100%', transform: `scale(${sc})`}}>
          <IconBadge icon={node.icon ?? 'flag'} ghost={!reached} ring={col} />
        </div>
        {reached && !final && check && (
          <div style={{position: 'absolute', left: 22, top: -178 - up, transform: `scale(${popScale(f, reachedAt + 4, 10)})`, width: 54, height: 54, background: '#5ed16a', border: `6px solid ${INK}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 0 ${INK}`}}>
            <div style={{width: 12, height: 26, borderRight: '8px solid #fff', borderBottom: '8px solid #fff', transform: 'rotate(40deg) translate(-2px,-3px)'}} />
          </div>
        )}
        {final && reached && (
          <div style={{position: 'absolute', left: -side * 90, top: -8, width: 0, height: 0, transform: `scaleX(${-side})`, opacity: popScale(f, reachedAt + 4, 4) > 0 ? 1 : 0}}>
            <Flag f={f} raise={EASE.out(clamp01((f - reachedAt - 4) / 22))} height={200} color={RED} />
          </div>
        )}
        {label && (
          <div style={{position: 'absolute', left: 0, top: 44, transform: `translateX(-50%) scale(${appear})`, transformOrigin: '50% 0'}}>
            <NameTag size={36}>{node.name}</NameTag>
          </div>
        )}
      </div>
    </Anchor>
  );
};

// ------------------------------------------------------------------ avatar
export type AvatarKind = 'walk' | 'cart' | 'horse' | 'boat' | 'wings' | 'pearl' | 'still';

export const Avatar: FC<{x: number; y: number; f: number; kind: AvatarKind; moving: boolean; ang: number; k?: number; bank?: number; dead?: boolean; crossK?: number; lift?: number; scale?: number; glow?: string}> = ({
  x,
  y,
  f,
  kind,
  moving,
  ang,
  k = 1,
  bank = 0,
  dead,
  crossK = 1,
  lift = 0,
  scale = 1,
  glow,
}) => {
  const face = 96;
  const heading = Math.cos(ang) < 0 ? -1 : 1;
  let hop = 0;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let base = 0;
  if (kind === 'walk' || kind === 'still') {
    const ph = f * 0.52;
    const a = moving ? Math.abs(Math.sin(ph)) : Math.abs(Math.sin(f * 0.16)) * 0.2;
    hop = a * (moving ? 26 : 7);
    const land = moving ? 1 - a : 0.2;
    sx = 1 + land * 0.1;
    sy = 1 - land * 0.12;
    rot = moving ? Math.sin(ph) * 5 : 0;
  } else if (kind === 'cart') {
    hop = moving ? (Math.round(f * 1.7) % 2) * 3 : 0;
    rot = moving ? Math.sin(f * 0.8) * 1.6 : 0;
  } else if (kind === 'horse') {
    const ph = f * 0.68;
    hop = moving ? Math.abs(Math.sin(ph)) * 24 : Math.abs(Math.sin(f * 0.14)) * 4;
    rot = moving ? Math.sin(ph) * 4 : 0;
    sy = moving ? 1 - (1 - Math.abs(Math.sin(ph))) * 0.05 : 1;
  } else if (kind === 'boat') {
    hop = Math.sin(f * 0.17) * 7;
    rot = Math.sin(f * 0.12) * 5;
  } else if (kind === 'wings') {
    hop = Math.sin(f * 0.14) * 9;
    rot = bank;
    base = 10;
  } else if (kind === 'pearl') {
    hop = Math.abs(Math.sin(f * 0.16)) * 6;
  }
  const fs = kind === 'horse' ? 72 : face;
  const tw = fs + 24;
  const faceTok = (
    <FaceToken size={fs} dead={dead} ring={dead ? '#7a7a8a' : GOLD}>
      {dead && <RedCross size={fs} k={crossK} />}
    </FaceToken>
  );
  return (
    <Anchor x={x} y={y} k={k * scale}>
      <GroundShadow w={104 - Math.min(40, lift * 0.1)} k={1 - hop / 160 + (lift > 0 ? 0.2 : 0)} />
      <div style={{position: 'absolute', left: 0, top: -lift - base, transform: `translateY(${-hop}px) rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
        {glow && <div style={{position: 'absolute', left: -130, top: -230, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 70%)`}} />}
        {kind === 'cart' && (
          <>
            <div style={{position: 'absolute', left: -tw / 2, top: -238}}>{faceTok}</div>
            <div style={{position: 'absolute', left: -88, top: -172}}>
              <MinecartArt size={176} />
            </div>
          </>
        )}
        {kind === 'boat' && (
          <>
            <div style={{position: 'absolute', left: -tw / 2, top: -150}}>{faceTok}</div>
            <div style={{position: 'absolute', left: -108, top: -60}}>
              <BoatArt px={9} />
            </div>
          </>
        )}
        {kind === 'horse' && (
          <>
            <div style={{position: 'absolute', left: -100, top: -150, transform: `scaleX(${heading})`, transformOrigin: '100px 0'}}>
              <HorseArt px={10} />
            </div>
            <div style={{position: 'absolute', left: -tw / 2 + heading * -6, top: -192}}>{faceTok}</div>
          </>
        )}
        {kind === 'wings' && (
          <>
            <div style={{position: 'absolute', left: -170, top: -150, transform: `scaleY(${1 + Math.sin(f * 0.2) * 0.06})`, transformOrigin: '170px 70px'}}>
              <WingsArt px={10} />
            </div>
            <div style={{position: 'absolute', left: -tw / 2, top: -190}}>{faceTok}</div>
          </>
        )}
        {(kind === 'walk' || kind === 'still' || kind === 'pearl') && (
          <>
            <div style={{position: 'absolute', left: -19, top: -45, width: 38, height: 38, background: dead ? '#7a7a8a' : GOLD, border: `6px solid ${INK}`, boxSizing: 'border-box', transform: 'rotate(45deg)'}} />
            <div style={{position: 'absolute', left: -tw / 2, top: -tw - 28}}>{faceTok}</div>
          </>
        )}
      </div>
    </Anchor>
  );
};

export const PearlSprite: FC<{x: number; y: number; f: number; lift: number}> = ({x, y, f, lift}) => (
  <Anchor x={x} y={y - lift}>
    <div style={{position: 'absolute', left: -150, top: -150, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,140,255,0.85) 0%, rgba(150,80,230,0.35) 38%, rgba(120,50,200,0) 70%)'}} />
    <div style={{position: 'absolute', left: -60, top: -60}}>
      <PearlArt size={120} spin={f * 14} />
    </div>
  </Anchor>
);

/** Live trail of squares behind a moving point. */
export const TrailDust: FC<{f: number; from: number; to: number; pos: (frame: number) => P; colors: string[]; step?: number; life?: number; size?: [number, number]; seed?: number; up?: number}> = ({f, from, to, pos, colors, step = 2, life = 26, size = [8, 18], seed = 3, up = 0.4}) => (
  <Particles f={f} cfg={{from, to, step, life, pos, colors, speed: [0.5, 2.6], size, gravity: -0.02, drag: 0.93, seed, spread: 12, lift: up}} />
);

void lerp;
