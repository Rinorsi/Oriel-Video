// mcd-v-waypoint: vertical light-beam waypoint markers to pin places on footage (base, village, portal ...).
// Each waypoint = coloured beam (white / green / orange / magenta, the loot-beam family), flat hexagon ground plate, a floating rarity
// diamond marker with a pixel icon, a name plate, a live distance readout and small coordinates. The whole set sways like a slow camera
// move and the markers bob in hard steps. Use it on top of footage with the transparent Layer.
// Props: waypoints [{x, ground, kind, name, dist, coords, icon, size, delay}], fadeOutAt (frames before the end), bg, biome.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {DiamondFrame, MCD, McdText, PxText, hexPts, ptsStr, type DiamondTier} from '../mcdkit/kit';
import {FxLayer, beam} from '../mcdscene';
import {CrossFlash, PxIcon, SKULL_PX, SceneBg, stepQ, win, type BiomeId} from './common';

export type BeamKind = 'white' | 'green' | 'orange' | 'magenta';
export type IconKey = 'base' | 'flag' | 'portal' | 'skull';

const HOUSE_PX = ['.....k.....', '....kkk....', '...kkkkk...', '..kkkkkkk..', '.kkkkkkkkk.', '..kkkkkkk..', '..kkk.kkk..', '..kkk.kkk..'];
const FLAG_PX = ['kk........', 'kkkkkkk...', 'kkkkkkkkk.', 'kkkkkkk...', 'kkkkk.....', 'kk........', 'kk........', 'kk........', 'kk........'];
const PORTAL_PX = ['kkkkkkkk', 'kk....kk', 'kk.kk.kk', 'kk.kk.kk', 'kk.kk.kk', 'kk....kk', 'kkkkkkkk'];
const ICONS: Record<IconKey, string[]> = {base: HOUSE_PX, flag: FLAG_PX, portal: PORTAL_PX, skull: SKULL_PX};

const KIND: Record<BeamKind, {tier: DiamondTier; col: string; hi: string; glow: string; plate: string}> = {
  white: {tier: 'common', col: '#E8E8EC', hi: '#FFFFFF', glow: 'rgba(235,238,245,0.55)', plate: '#8A8F9A'},
  green: {tier: 'rare', col: '#58D0A0', hi: '#B8FFE0', glow: 'rgba(60,200,140,0.55)', plate: '#2E9E7A'},
  orange: {tier: 'unique', col: '#FF9400', hi: '#FFD090', glow: 'rgba(255,120,0,0.6)', plate: '#F85600'},
  magenta: {tier: 'enchant', col: '#E56DE5', hi: '#FFC8FF', glow: 'rgba(205,46,205,0.6)', plate: '#CD2ECD'},
};

export type Waypoint = {
  x: number;
  /** y of the ground point (screen px) */
  ground: number;
  kind: BeamKind;
  name: string;
  /** starting distance in metres; counts down while the clip plays */
  dist: number;
  coords?: string;
  icon?: IconKey;
  /** 1 = big, 0.7 = small (swaps the type sizes) */
  size?: number;
  delay?: number;
};

const DEFAULT_WPS: Waypoint[] = [
  {x: 1020, ground: 900, kind: 'orange', name: '我们的基地', dist: 1284, coords: 'X 1204   Y 64   Z -382', icon: 'base', size: 1, delay: 0},
  {x: 360, ground: 760, kind: 'green', name: '村庄', dist: 3120, coords: 'X -820   Y 70   Z 140', icon: 'flag', size: 0.7, delay: 16},
  {x: 1580, ground: 800, kind: 'magenta', name: '末地传送门', dist: 2460, coords: 'X 2210   Y 38   Z 906', icon: 'portal', size: 0.7, delay: 28},
];

const Mark: FC<{w: Waypoint; dx: number; fade: number}> = ({w, dx, fade}) => {
  const f = useCurrentFrame();
  const s = w.size ?? 1;
  const big = s >= 0.9;
  const K = KIND[w.kind];
  const t0 = w.delay ?? 0;
  const px = big ? 4 : 3;
  const M = big ? 156 : 108;
  const plateH = big ? 92 : 70;
  const H = big ? 400 : 320; // beam top above ground at the marker centre
  const x = w.x + dx * (big ? 1 : 0.7);
  const bob = Math.round((Math.sin(f * 0.12 + t0) * 9) / 4) * 4;
  const colTop = w.ground - H - plateH - 16 - M / 2 + bob;
  const dist = Math.max(0, Math.round(w.dist - (f - t0) * 0.9));
  const pop = EASE.back(win(f, t0 + 8, 9));
  const plateT = win(f, t0 + 14, 8);
  const chipT = win(f, t0 + 20, 8);
  const coordT = win(f, t0 + 26, 8);
  const flash = f >= t0 + 8 && f < t0 + 12;
  // ground hex plate
  const gw = big ? 360 : 240;
  const gh = gw * 0.34;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.2 + t0);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade}}>
      <svg width={gw + 40} height={gh + 40} style={{position: 'absolute', left: x - gw / 2 - 20, top: w.ground - gh / 2 - 20, opacity: stepQ(win(f, t0, 8), 4), overflow: 'visible'}}>
        {[1, 0.66, 0.34].map((k, i) => (
          <polygon key={i} points={ptsStr(hexPts(gw * k, gh * k).map(([px_, py_]) => [px_ + 20 + (gw - gw * k) / 2, py_ + 20 + (gh - gh * k) / 2] as [number, number]))} fill={i === 2 ? K.col : 'none'} fillOpacity={0.18 + 0.2 * pulse} stroke={K.col} strokeWidth={i === 0 ? 4 : 3} strokeOpacity={i === 0 ? 0.9 : 0.55} />
        ))}
      </svg>
      <div style={{position: 'absolute', left: x - 320, width: 640, top: colTop, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{height: plateH, opacity: plateT > 0 ? 1 : 0, transform: `translateY(${Math.round(((1 - EASE.out(plateT)) * -24) / 4) * 4}px)`}}>
          <div style={{position: 'relative', background: 'rgba(10,10,14,0.88)', padding: `0 ${big ? 30 : 22}px`, height: plateH, display: 'flex', alignItems: 'center', boxShadow: `inset 0 0 0 3px #2E2E34, inset 0 -6px 0 ${K.plate}`}}>
            <PxText text={w.name} px={px} />
          </div>
        </div>
        <div style={{height: M + 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: `scale(${pop})`, transformOrigin: '50% 60%'}}>
          <DiamondFrame size={M} tier={K.tier} glow={K.glow}>
            <PxIcon rows={ICONS[w.icon ?? 'flag']} px={big ? 5 : 4} color={flash ? '#fff' : K.hi} />
          </DiamondFrame>
        </div>
        <div style={{opacity: chipT > 0 ? 1 : 0, transform: `translateY(${Math.round(((1 - EASE.out(chipT)) * 16) / 4) * 4}px)`, marginTop: 4}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(10,10,14,0.82)', padding: big ? '6px 22px' : '4px 16px', boxShadow: '0 0 0 3px #000'}}>
            <svg width={big ? 22 : 16} height={big ? 22 : 16} viewBox="0 0 10 10" shapeRendering="crispEdges">
              <polygon points="0,1 10,1 5,9" fill={K.col} />
            </svg>
            <PxText text={`${dist.toLocaleString('en-US')} m`} px={big ? 4 : 3} caps={false} color={K.hi} shadowColor="#050202" />
          </div>
        </div>
        {w.coords && (
          <div style={{opacity: coordT > 0 ? 1 : 0, marginTop: 10}}>
            <McdText size={big ? 26 : 22} weight={600} color="#D8DCE4" style={{letterSpacing: 2, background: 'rgba(0,0,0,0.5)', padding: '2px 12px'}}>{w.coords}</McdText>
          </div>
        )}
      </div>
    </div>
  );
};

export const WaypointMark: FC<{bg?: boolean; waypoints?: Waypoint[]; biome?: BiomeId; fadeOutFrames?: number; totalFrames?: number; audio?: boolean}> = ({bg, waypoints = DEFAULT_WPS, biome = 'snow', fadeOutFrames = 12, totalFrames = 150, audio = true}) => {
  const f = useCurrentFrame();
  const durationInFrames = totalFrames;
  const dx = Math.round(Math.sin(f * 0.035) * 22);
  const fade = fadeOutFrames > 0 ? stepQ(clamp01((durationInFrames - f) / fadeOutFrames), 4) : 1;
  return (
    <AbsoluteFill>
      {bg && <SceneBg biome={biome} dim={0.1} tint="30,12,4" camera="drift" />}
      <AbsoluteFill style={{opacity: fade}}>
        <FxLayer
          draw={(ctx, v) => {
            waypoints.forEach((w, i) => {
              const s = w.size ?? 1;
              const big = s >= 0.9;
              const t0 = w.delay ?? 0;
              const grow = EASE.out(clamp01((v.frame - t0) / 6));
              if (grow <= 0) return;
              beam(ctx, v, {x: w.x + dx * (big ? 1 : 0.7), y: w.ground, kind: w.kind, width: big ? 112 : 76, grow, alpha: 0.9, seed: i + 1});
            });
          }}
        />
      </AbsoluteFill>
      {/* rising motes along each beam */}
      <AbsoluteFill style={{opacity: fade, pointerEvents: 'none'}}>
        {waypoints.map((w, wi) => {
          const rnd = mulberry32(wi * 17 + 5);
          const t0 = w.delay ?? 0;
          const big = (w.size ?? 1) >= 0.9;
          const cx = w.x + dx * (big ? 1 : 0.7);
          return Array.from({length: 9}, (_, i) => {
            const ph = rnd();
            const sp = 0.012 + rnd() * 0.01;
            const off = (rnd() - 0.5) * (big ? 100 : 70);
            const life = (((f - t0) * sp + ph) % 1 + 1) % 1;
            const y = w.ground - life * (big ? 640 : 520);
            const a = Math.sin(life * Math.PI);
            if (f < t0 + 6) return null;
            return <div key={`${wi}-${i}`} style={{position: 'absolute', left: Math.round((cx + off) / 4) * 4, top: Math.round(y / 4) * 4, width: 8, height: 8, background: KIND[w.kind].hi, opacity: a * 0.9}} />;
          });
        })}
      </AbsoluteFill>
      {waypoints.map((w, i) => (
        <Mark key={i} w={w} dx={dx} fade={fade} />
      ))}
      {waypoints.map((w, i) => (
        <CrossFlash key={`c${i}`} x={w.x + dx * ((w.size ?? 1) >= 0.9 ? 1 : 0.7)} y={w.ground - ((w.size ?? 1) >= 0.9 ? 400 : 320) - 20} at={(w.delay ?? 0) + 8} arm={(w.size ?? 1) >= 0.9 ? 110 : 76} thick={10} color={KIND[w.kind].hi} dur={12} />
      ))}
      {audio &&
        waypoints.map((w, i) => (
          <Sequence key={`s${i}`} from={w.delay ?? 0}>
            <Audio src={mcSound('ui/toast/in')} volume={0.28} playbackRate={1 + i * 0.12} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
void MCD;
