import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PixelSprite} from '../../flat';
import {PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {mcSound, reelSfx} from '../../../reel/kit';
import {Sfx} from './audio';
import {INK} from './art';
import {
  Anchor,
  MapImage,
  Particles,
  Pop,
  World,
  camAt,
  curveRoute,
  fitView,
  flyRoute,
  getMap,
  lerp,
  lineRoute,
  pointAt,
  railRoute,
  toWorld,
  travelAt,
  type Built,
  type CamCfg,
  type MapNode,
  type P,
  type Timing,
} from './engine';
import {Compass, CoordsHud, Legend, MapFrame, MiniMap, TitlePlate, TripBar} from './hud';
import {Avatar, Contrail, DashedRoute, Footprints, GuideRoute, Hoofprints, PearlArc, PearlSprite, PlaceMarker, RailRoute, Sign, StartPin, TrailDust, Wake, arcLift} from './parts';
import type {AvatarKind} from './parts';
import {WH, WW, type MapMode} from './mapgen';

/**
 * MapJourney: the reusable core of every "A -> B" map effect.
 *
 * Props (JourneyProps)
 *   nodes      MapNode[]  stops in order. name, xz (game coords), pos (map position 0..1), icon (sprite key or item id), sub.
 *   kind       'walk' | 'chain' | 'rail' | 'horse' | 'boat' | 'pearl' | 'elytra' | 'home'  (travel style, see PRESETS)
 *   frames     total length in frames (the camera pulls back at the end)
 *   title / subtitle  text on the title plate
 *   seed       map + path variation
 *   startAt / legFrames / pauseFrames  override timing (frames)
 *   followZ    camera zoom while following (bigger = closer)
 *   tint       optional colour wash over the map (e.g. dusk for "going home")
 *   night      darker map palette
 *   hud        false hides the frame/legend/minimap (just the map and the traveller)
 *   arriveText replaces the last line of the destination sign
 *   extraWorld / extraScreen  render props for scene-specific decoration (home glow, etc.)
 */

export type JourneyKind = 'walk' | 'chain' | 'rail' | 'horse' | 'boat' | 'pearl' | 'elytra' | 'home';

type Preset = {
  mode: MapMode;
  avatar: AvatarKind;
  startAt: number;
  leg: number;
  pause: number;
  followZ: number;
  lag: number;
  /** How far the destination badge rises above the traveller on arrival (screen px). */
  up: number;
  ease: (t: number) => number;
  build: (pts: P[], seed: number) => Built;
  title: string;
  subtitle: string;
};

const sineEase = (t: number) => 0.3 * t + 0.7 * (0.5 - Math.cos(Math.PI * t) / 2);
const cubicInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const PRESETS: Record<JourneyKind, Preset> = {
  walk: {mode: 'land', avatar: 'walk', startAt: 56, leg: 150, pause: 0, followZ: 1.18, lag: 8, up: 180, ease: sineEase, build: (p, s) => curveRoute(p, s, 0.15), title: '旅程', subtitle: '步行前往'},
  chain: {mode: 'land', avatar: 'walk', startAt: 54, leg: 88, pause: 34, followZ: 1.08, lag: 8, up: 180, ease: sineEase, build: (p, s) => curveRoute(p, s, 0.17, 520), title: '多站旅程', subtitle: '依次抵达'},
  rail: {mode: 'land', avatar: 'cart', startAt: 54, leg: 150, pause: 0, followZ: 1.1, lag: 6, up: 230, ease: cubicInOut, build: (p) => railRoute(p[0], p[p.length - 1]), title: '矿车线路', subtitle: '铁轨直达'},
  horse: {mode: 'land', avatar: 'horse', startAt: 50, leg: 116, pause: 0, followZ: 0.98, lag: 8, up: 290, ease: (t) => 0.2 * t + 0.8 * (0.5 - Math.cos(Math.PI * t) / 2), build: (p, s) => curveRoute(p, s, 0.18), title: '策马前行', subtitle: '骑马赶路'},
  boat: {mode: 'sea', avatar: 'boat', startAt: 54, leg: 150, pause: 0, followZ: 1.02, lag: 8, up: 240, ease: sineEase, build: (p, s) => curveRoute(p, s, 0.12, 900), title: '海上航线', subtitle: '乘船出海'},
  pearl: {mode: 'free', avatar: 'pearl', startAt: 58, leg: 62, pause: 0, followZ: 0.9, lag: 4, up: 180, ease: (t) => t, build: (p) => lineRoute(p[0], p[p.length - 1]), title: '末影珍珠', subtitle: '一瞬之间'},
  elytra: {mode: 'free', avatar: 'wings', startAt: 44, leg: 176, pause: 0, followZ: 0.78, lag: 10, up: 240, ease: (t) => 0.15 * t + 0.85 * (0.5 - Math.cos(Math.PI * t) / 2), build: (p) => flyRoute(p[0], p[p.length - 1]), title: '鞘翅滑翔', subtitle: '飞越群山'},
  home: {mode: 'land', avatar: 'walk', startAt: 58, leg: 170, pause: 0, followZ: 1.12, lag: 8, up: 180, ease: sineEase, build: (p, s) => curveRoute(p, s, 0.17), title: '回家的路', subtitle: '夕阳西下'},
};

export type JourneyProps = {
  nodes: MapNode[];
  kind?: JourneyKind;
  frames?: number;
  title?: string;
  subtitle?: string;
  seed?: number;
  startAt?: number;
  legFrames?: number | number[];
  pauseFrames?: number;
  followZ?: number;
  tint?: string | ((f: number) => string);
  night?: boolean;
  hud?: boolean;
  arriveText?: string;
  /** Hide the generic destination sign (scenes draw their own). */
  noSign?: boolean;
  /** Skip the generic destination badge/flag (scenes draw their own building). */
  hideFinalMarker?: boolean;
  /** The traveller walks into the destination (shrinks away) after arriving. */
  enterBuilding?: boolean;
  /** Rendered in the back world, above the map and trails, below the traveller. */
  extraBack?: (c: JourneyCtx) => ReactNode;
  extraWorld?: (c: JourneyCtx) => ReactNode;
  extraScreen?: (c: JourneyCtx) => ReactNode;
};

export type JourneyCtx = {
  f: number;
  nodes: MapNode[];
  wp: P[];
  built: Built;
  travel: ReturnType<typeof travelAt>;
  avatar: P & {ang: number};
  cam: ReturnType<typeof camAt>;
  endF: number;
};

// ------------------------------------------------------------------ clouds
export const Clouds: FC<{f: number; count?: number; opacity?: number; speed?: number; seed?: number; scale?: number; shadows?: boolean}> = ({f, count = 4, opacity = 0.5, speed = 1.2, seed = 4, scale = 1, shadows = false}) => {
  const rnd = mulberry32(seed * 41);
  const items = Array.from({length: count}, (_, i) => {
    const depth = 0.5 + rnd() * 0.9;
    const px = Math.round((14 + rnd() * 14) * depth * scale);
    const y = 60 + rnd() * 900;
    const x0 = rnd() * 2600;
    const sp = speed * (0.6 + depth * 0.7);
    const w = 16 * px;
    const span = 1920 + w * 1.6;
    const x = (((x0 - f * sp) % span) + span) % span;
    return {x: x - w * 0.8, y, px, depth, i, w};
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {items.map((c) => (
        <div key={c.i}>
          {shadows && <div style={{position: 'absolute', left: c.x + 70, top: c.y + 200, width: c.w, height: 5 * c.px, borderRadius: '50%', background: 'rgba(20,30,50,0.22)'}} />}
          <div style={{position: 'absolute', left: c.x, top: c.y, opacity: opacity * (0.5 + c.depth * 0.5)}}>
            <PixelSprite sprite="cloud" px={c.px} />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const fmtLegs = (leg: number | number[] | undefined, def: number, n: number) => Array.from({length: n}, (_, i) => (Array.isArray(leg) ? leg[Math.min(i, leg.length - 1)] : (leg ?? def)));

export const useJourney = (p: JourneyProps) => {
  const f = useCurrentFrame();
  const kind = p.kind ?? 'walk';
  const pre = PRESETS[kind];
  const seed = p.seed ?? 5;
  const frames = p.frames ?? 300;
  const wp = p.nodes.map((n) => toWorld(n.pos));
  const built = pre.build(wp, seed);
  const timing: Timing = {start: p.startAt ?? pre.startAt, seg: fmtLegs(p.legFrames, pre.leg, p.nodes.length - 1), pause: p.pauseFrames ?? pre.pause};
  const travelF = (fr: number) => travelAt(fr, built.nodeS, timing, pre.ease);
  const travel = travelF(f);
  const posAt = (fr: number): P & {ang: number} => pointAt(built.route, travelF(fr).s);
  const endF = travel.endF;
  const arcH = Math.min(620, built.route.len * 0.45);
  const signRoom = wp.slice(1).flatMap((q, i) => {
    const sd = p.nodes[i + 1].pos[0] > 0.5 ? -1 : 1;
    return [{x: q.x, y: q.y - (pre.up * 0.5 + 300) / 0.55}, {x: q.x + sd * 930, y: q.y - 100}, {x: q.x - sd * 520, y: q.y}, {x: q.x, y: q.y + 340}];
  });
  const fit = fitView([...wp, ...signRoom, ...built.route.pts.filter((_, i) => i % 8 === 0)], 340, 0.7, 0);
  const camPos = (fr: number) => {
    const q = posAt(fr);
    if (kind === 'pearl') {
      const tt = clamp01(travelF(fr).s / built.route.len);
      return {x: q.x, y: q.y - arcLift(tt, arcH) * 0.7};
    }
    return q;
  };
  const camCfg: CamCfg = {
    overview: fit,
    followZ: p.followZ ?? pre.followZ,
    introStart: Math.max(0, timing.start - 40),
    introEnd: timing.start + 18,
    outroStart: endF + (kind === 'pearl' ? 52 : 50),
    outroEnd: Math.min(frames - 6, endF + 104),
    lag: pre.lag,
    focusDy: kind === 'horse' ? 110 : kind === 'rail' || kind === 'boat' ? 90 : kind === 'elytra' ? 120 : kind === 'pearl' ? 0 : 60,
    endShift: {at: endF + 4, dy: pre.up * 0.42},
    punches: [[endF, kind === 'pearl' ? 0.04 : 0.14], ...travel.arriveF.slice(1, -1).map((a) => [a, 0.08] as [number, number])],
    zMod:
      kind === 'elytra'
        ? (fr) => -0.05 * Math.sin(fr * 0.035)
        : kind === 'horse'
          ? (fr) => (travelF(fr).moving ? -0.05 : 0)
          : kind === 'pearl'
            ? (fr) => -0.3 * Math.sin(Math.PI * clamp01((fr - timing.start + 6) / (timing.seg[0] + 18)))
            : undefined,
  };
  const cam = camAt(f, camCfg, camPos);
  const av = posAt(f);
  return {f, kind, pre, seed, frames, wp, built, timing, travel, travelF, posAt, cam, av, endF, fit, arcH};
};

const cumDist = (nodes: MapNode[]) => {
  const c = [0];
  for (let i = 1; i < nodes.length; i++) c.push(c[i - 1] + Math.hypot(nodes[i].xz[0] - nodes[i - 1].xz[0], nodes[i].xz[1] - nodes[i - 1].xz[1]));
  return c;
};

type J = ReturnType<typeof useJourney>;
const travelPos = (J: J, fr: number): P => {
  const q = J.posAt(fr);
  return {x: q.x, y: q.y};
};
const travelAng = (J: J, fr: number) => J.posAt(fr).ang;
const pearlPos = (J: J, fr: number): P => {
  const q = J.posAt(fr);
  const t = clamp01(J.travelF(fr).s / J.built.route.len);
  return {x: q.x, y: q.y - arcLift(t, J.arcH)};
};

export const MapJourney: FC<JourneyProps> = (props) => {
  const J = useJourney(props);
  const {f, kind, pre, built, travel, cam, av, endF, wp, timing, travelF, arcH} = J;
  const {nodes} = props;
  const n = nodes.length;
  const route = built.route;
  const mode: MapMode = pre.mode;
  const map = getMap({seed: J.seed, mode, pins: nodes.map((x) => x.pos), route: route.pts.filter((_, i) => i % 3 === 0).map((q) => [q.x / WW, q.y / WH] as [number, number]), night: props.night});
  const dists = cumDist(nodes);
  const legFrac = clamp01((travel.s - built.nodeS[travel.leg]) / Math.max(1, built.nodeS[travel.leg + 1] - built.nodeS[travel.leg]));
  const cur = {x: lerp(nodes[travel.leg].xz[0], nodes[travel.leg + 1].xz[0], legFrac), z: lerp(nodes[travel.leg].xz[1], nodes[travel.leg + 1].xz[1], legFrac)};
  const driven = dists[travel.leg] + (dists[travel.leg + 1] - dists[travel.leg]) * legFrac;
  const last = nodes[n - 1];
  const lastP = wp[n - 1];
  const isPearl = kind === 'pearl';
  const side = (nd: MapNode): 1 | -1 => (nd.pos[0] > 0.5 ? -1 : 1);

  const shakeK = f >= endF && f < endF + 12 && !isPearl ? (1 - (f - endF) / 12) * 14 : 0;
  const shake = shakeK ? mulberry32(900 + f) : null;
  const camS = shake ? {...cam, cx: cam.cx + ((shake() - 0.5) * shakeK) / cam.z, cy: cam.cy + ((shake() - 0.5) * shakeK) / cam.z} : cam;

  const lead = Math.min(route.len, travel.s + (kind === 'elytra' ? 520 : kind === 'rail' ? 320 : 240) * clamp01((f - (timing.start - 30)) / 30));
  const moving = travel.moving && f < endF;
  const stepSfx: ReactNode[] = [];
  const stepEvery = kind === 'horse' ? 7 : 11;
  if (kind === 'walk' || kind === 'chain' || kind === 'home' || kind === 'horse') {
    for (let t = timing.start + 4; t < endF - 2; t += stepEvery) {
      if (travel.departF.some((d, i) => i > 0 && t > travel.arriveF[i] && t < d)) continue;
      stepSfx.push(<Sfx key={t} at={t} src={mcSound(`step/grass${1 + (t % 4)}`)} volume={kind === 'horse' ? 0.22 : 0.16} rate={kind === 'horse' ? 1.15 : 1} cut={10} />);
    }
  }
  if (kind === 'rail') for (let t = timing.start + 4; t < endF - 2; t += 7) stepSfx.push(<Sfx key={t} at={t} src={mcSound(`dig/stone${1 + (t % 4)}`)} volume={0.1} rate={1.6} cut={6} />);

  const tripFrac = built.nodeS.map((s) => s / route.len);
  const pearlT = clamp01(travel.s / route.len);
  // Pearl: the avatar waits at A until the pearl lands, then appears at B.
  const avatarPos = isPearl ? (f >= endF ? wp[n - 1] : wp[0]) : av;
  const avatarAng = isPearl ? 0 : av.ang;
  const avIn = EASE.back(clamp01((f - (timing.start - 38)) / 12));
  const avatarScale = isPearl && f >= endF ? EASE.back(clamp01((f - endF) / 12)) : props.enterBuilding && f >= endF + 4 ? Math.max(0, 1 - EASE.in(clamp01((f - endF - 4) / 10))) : avIn;

  const bank =
    kind === 'elytra'
      ? (() => {
          const a0 = pointAt(route, Math.max(0, travel.s - 40)).ang;
          const a1 = pointAt(route, Math.min(route.len, travel.s + 40)).ang;
          let d = a1 - a0;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          return Math.max(-28, Math.min(28, d * 150));
        })()
      : 0;

  const gates =
    kind === 'elytra'
      ? [0.3, 0.52, 0.74].map((t) => {
          const sT = route.len * t;
          let passF = Infinity;
          for (let fr = timing.start; fr <= endF; fr++) {
            if (travelF(fr).s >= sT) {
              passF = fr;
              break;
            }
          }
          return {p: pointAt(route, sT), passF};
        })
      : [];

  const ctx: JourneyCtx = {f, nodes, wp, built, travel, avatar: av, cam, endF};
  const fade = 1 - clamp01(f / 12);

  return (
    <AbsoluteFill style={{background: '#1b2a3a', overflow: 'hidden'}}>
      {/* ---- back world: map, trails, markers */}
      <World cam={camS}>
        <MapImage url={map.url} />
        {props.tint && <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH, background: typeof props.tint === 'function' ? props.tint(f) : props.tint, mixBlendMode: 'multiply'}} />}
        {map.regions.map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: r.u * WW,
              top: r.v * WH,
              transform: `translate(-50%,-50%) rotate(${i % 2 ? 4 : -4}deg)`,
              fontFamily: PIXEL_FONT,
              fontSize: r.kind === 'sea' ? 80 : 88,
              letterSpacing: r.kind === 'sea' ? 26 : 18,
              color: r.kind === 'sea' ? '#d6f0f6' : '#4a3623',
              opacity: r.kind === 'sea' ? 0.7 : 0.55,
              whiteSpace: 'pre',
              WebkitFontSmoothing: 'none',
              textShadow: r.kind === 'sea' ? '4px 4px 0 rgba(30,70,100,0.6)' : '4px 4px 0 rgba(255,244,214,0.55)',
            }}
          >
            {r.text}
          </div>
        ))}
        <GuideRoute route={route} opacity={kind === 'elytra' || isPearl ? 0.18 : 0.3} color={kind === 'boat' ? '#ffffff' : '#4a3623'} />
        {(kind === 'walk' || kind === 'chain' || kind === 'home') && (
          <>
            <DashedRoute route={route} s1={lead} />
            <Footprints route={route} s={travel.s} />
          </>
        )}
        {kind === 'rail' && <RailRoute route={route} s1={lead} />}
        {kind === 'horse' && (
          <>
            <DashedRoute route={route} s1={lead} color="#9b5a2a" dash={[18, 22]} width={7} />
            <Hoofprints route={route} s={travel.s} />
          </>
        )}
        {kind === 'boat' && (
          <>
            <DashedRoute route={route} s1={lead} color="#ffffff" dash={[20, 18]} width={8} />
            <Wake route={route} s={travel.s} />
          </>
        )}
        {kind === 'elytra' && <DashedRoute route={route} s0={travel.s} s1={lead} color="#ffffff" dash={[16, 22]} width={6} />}
        {isPearl && f >= timing.start - 8 && <PearlArc route={route} t={pearlT} h={arcH} />}
        {nodes.map((nd, i) => {
          if (i === 0) return <StartPin key={i} node={nd} f={f} at={Math.max(2, timing.start - 40)} />;
          if (i === n - 1 && props.hideFinalMarker) return null;
          return (
            <PlaceMarker
              key={i}
              node={nd}
              f={f}
              showAt={Math.max(8, timing.start - 34 + i * 3)}
              reachedAt={travel.arriveF[i]}
              departAt={i === n - 1 ? undefined : travel.departF[i]}
              final={i === n - 1}
              up={pre.up}
              side={side(nd)}
            />
          );
        })}
        {kind === 'elytra' && <Contrail route={route} s={travel.s} dy={110} />}
        {props.extraBack?.(ctx)}
      </World>

      {/* ---- clouds drift between map and traveller */}
      {kind !== 'elytra' && props.hud !== false && <Clouds f={f} count={3} opacity={0.3} speed={0.9} seed={8} scale={1.1} />}
      {kind === 'elytra' && <Clouds f={f} count={5} opacity={0.62} speed={6} seed={3} shadows scale={1.1} />}

      {/* ---- front world: particles, traveller, gates, effects, signs */}
      <World cam={camS}>
        {(kind === 'walk' || kind === 'chain' || kind === 'home') && moving && <TrailDust f={f} from={timing.start} to={endF} pos={(fr) => travelPos(J, fr)} colors={['#f5ecd0', '#d9c79a', '#ffffff']} step={5} life={20} size={[6, 12]} seed={14} up={0.3} />}
        {kind === 'horse' && <TrailDust f={f} from={timing.start} to={endF} pos={(fr) => travelPos(J, fr)} colors={['#d9b987', '#c49a62', '#f0dcb0', '#a8824c', '#fff2cf']} step={1} life={34} size={[16, 40]} seed={9} up={0.6} />}
        {kind === 'rail' && (
          <>
            <Particles f={f} cfg={{from: timing.start, to: endF, step: 1, burst: 3, life: 16, pos: (fr) => travelPos(J, fr), colors: ['#ffd23f', '#ff9a3c', '#fff4b0', '#ffffff'], speed: [6, 14], dir: (fr, r) => travelAng(J, fr) + Math.PI + (r() - 0.5) * 1.8, size: [9, 18], gravity: 0.6, drag: 0.9, seed: 12, lift: 2.5, spread: 40}} />
            <TrailDust f={f} from={timing.start} to={endF} pos={(fr) => travelPos(J, fr)} colors={['#c9ccd6', '#9a9aa2', '#e8e8f0']} step={3} life={22} size={[10, 20]} seed={4} up={0.8} />
          </>
        )}
        {kind === 'boat' && <Particles f={f} cfg={{from: timing.start, to: endF, step: 4, life: 36, pos: (fr) => travelPos(J, fr), colors: ['#ffffff', '#c4e6ea'], shape: 'square', size: [14, 26], speed: [0, 0.2], seed: 5}} />}
        {kind === 'elytra' && <Particles f={f} cfg={{from: timing.start, to: endF, step: 1, life: 30, pos: (fr) => ({x: travelPos(J, fr).x, y: travelPos(J, fr).y - 110}), colors: ['#ffffff', '#e8f6ff', '#bfe3ff'], speed: [0.5, 2], size: [10, 22], drag: 0.9, seed: 21, spread: 36}} />}
        {isPearl && f >= timing.start && f <= endF + 12 && (
          <>
            <Particles f={f} cfg={{from: timing.start, to: endF, step: 1, burst: 3, life: 42, pos: (fr) => pearlPos(J, fr), colors: ['#b46bff', '#7a33d6', '#e6c7ff', '#ff8cf2'], speed: [0.5, 4], size: [12, 30], drag: 0.93, seed: 33, spread: 34}} />
            <Particles f={f} cfg={{from: timing.start, to: endF, step: 2, life: 20, pos: (fr) => pearlPos(J, fr), colors: ['#e6c7ff'], shape: 'streak', size: [26, 40], speed: [0, 1], seed: 8, dir: (fr) => travelAng(J, fr) + Math.PI}} />
          </>
        )}

        {f >= timing.start - 38 && (
          <Avatar
            x={avatarPos.x}
            y={avatarPos.y}
            f={f}
            kind={pre.avatar}
            moving={isPearl ? false : moving}
            ang={avatarAng}
            k={lerp(0.78, 1.0, clamp01((cam.z - 0.5) / 0.7))}
            bank={bank}
            scale={avatarScale}
            lift={kind === 'elytra' ? 110 * (1 - EASE.out(clamp01((f - endF) / 14))) : 0}
          />
        )}
        {isPearl &&
          f >= timing.start &&
          f < endF &&
          (() => {
            const q = pointAt(route, travel.s);
            return <PearlSprite x={q.x} y={q.y} f={f} lift={arcLift(pearlT, arcH)} />;
          })()}

        {gates.map((g, i) => {
          const d = f - g.passF;
          return (
            <Anchor key={i} x={g.p.x} y={g.p.y - 60}>
              <svg width={120} height={260} viewBox="-60 -130 120 260" shapeRendering="crispEdges" style={{position: 'absolute', left: -60, top: -130, overflow: 'visible', transform: `rotate(${(g.p.ang * 180) / Math.PI + 90}deg) scale(${d >= 0 && d < 10 ? 1 + d * 0.08 : 1})`, opacity: d > 16 ? 0.35 : 1}}>
                {/* square-cut pixel gate (chamfered rectangle), ink outline + colour core */}
                <polygon points="-18,-100 18,-100 36,-70 36,70 18,100 -18,100 -36,70 -36,-70" fill="none" stroke={INK} strokeWidth={28} strokeLinejoin="miter" />
                <polygon points="-18,-100 18,-100 36,-70 36,70 18,100 -18,100 -36,70 -36,-70" fill="none" stroke={d >= 0 ? '#7fff9a' : '#ffd23f'} strokeWidth={14} strokeLinejoin="miter" />
              </svg>
              {d >= 0 && d < 22 && <div style={{position: 'absolute', left: -30, top: -150 - d * 3, fontFamily: PIXEL_FONT, fontSize: 48, color: '#7fff9a', textShadow: `4px 4px 0 ${INK}`, opacity: 1 - d / 22}}>+1</div>}
              <Pop f={f} at={g.passF} x={0} y={0} colors={['#ffd23f', '#fff4b0', '#7fff9a']} count={14} speed={9} life={22} ring={0} seed={i + 3} />
            </Anchor>
          );
        })}

        {/* arrival effects */}
        {isPearl ? (
          <>
            <Pop f={f} at={endF} x={lastP.x} y={lastP.y} colors={['#b46bff', '#e6c7ff', '#7a33d6', '#ff8cf2']} count={46} speed={20} life={46} ring={0} seed={2} gravity={-0.06} />
            {[0, 8].map((o, i) => (
              <Pop key={i} f={f} at={endF + o} x={lastP.x} y={lastP.y} colors={['#b46bff']} count={0} ring={460 + i * 140} ringColor={['#e6c7ff', '#ff8cf2'][i]} seed={i} />
            ))}
            <Pop f={f} at={endF} x={wp[0].x} y={wp[0].y} colors={['#b46bff', '#7a33d6', '#e6c7ff']} count={30} speed={13} life={34} ring={320} ringColor="#b46bff" seed={19} gravity={-0.1} />
            <Pop f={f} at={timing.start} x={wp[0].x} y={wp[0].y} colors={['#e6c7ff', '#b46bff', '#ffffff']} count={16} speed={10} life={26} ring={220} ringColor="#e6c7ff" seed={27} gravity={0} />
            {f >= endF && f < endF + 40 && (
              <Anchor x={lastP.x} y={lastP.y}>
                <div style={{position: 'absolute', left: -90, top: -1000, width: 180, height: 1000, background: 'linear-gradient(90deg, rgba(180,107,255,0) 0%, rgba(214,170,255,0.9) 35%, rgba(255,255,255,0.95) 50%, rgba(214,170,255,0.9) 65%, rgba(180,107,255,0) 100%)', WebkitMaskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0) 100%)', opacity: 1 - (f - endF) / 40, transform: `scaleX(${1 - (f - endF) / 60})`, transformOrigin: '50% 100%'}} />
              </Anchor>
            )}
          </>
        ) : (
          <>
            <Pop f={f} at={endF} x={lastP.x} y={lastP.y} colors={['#ffd23f', '#ff9a3c', '#fff4b0', '#ff7aa8']} count={34} speed={17} life={40} ring={460} ringColor="#ffffff" seed={2} />
            <Pop f={f} at={endF + 5} x={lastP.x} y={lastP.y} colors={['#ffffff', '#8fd3ff']} count={14} speed={9} life={30} ring={560} ringColor="#ffd23f" seed={7} gravity={0.2} />
          </>
        )}
        {nodes.slice(1, -1).map((_, i) => (
          <Pop key={i} f={f} at={travel.arriveF[i + 1]} x={wp[i + 1].x} y={wp[i + 1].y} colors={['#7fff9a', '#ffd23f', '#ffffff']} count={22} speed={12} life={32} ring={340} ringColor="#7fff9a" seed={30 + i} />
        ))}

        {!props.noSign &&
          nodes.slice(1).map((nd, i) => {
            const idx = i + 1;
            const isLast = idx === n - 1;
            return <Sign key={idx} node={nd} f={f} at={travel.arriveF[idx] + 7} hold={isLast ? undefined : 62} side={side(nd)} lift={pre.up * 0.5} k={lerp(0.78, 1, clamp01((cam.z - 0.5) / 0.5))} extra={isLast ? props.arriveText : undefined} />;
          })}
        {props.extraWorld?.(ctx)}
      </World>

      {/* ---- screen layer */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,14,2,0.38) 100%)', pointerEvents: 'none'}} />
      {props.extraScreen?.(ctx)}
      {props.hud !== false && (
        <>
          <MapFrame f={f} />
          <TitlePlate f={f} title={props.title ?? pre.title} sub={props.subtitle ?? `${nodes[0].name} → ${last.name}`} />
          <Compass f={f} />
          <Legend f={f} />
          <MiniMap f={f} mapUrl={map.url} route={route} start={wp[0]} end={lastP} avatar={avatarPos} view={cam} reveal={clamp01((f - 20) / 20)} />
          <CoordsHud f={f} x={cur.x} z={cur.z} dist={driven} />
          <TripBar f={f} trip={travel.trip} nodes={nodes} nodeFrac={tripFrac} reached={travel.reached} label={n > 2 ? '旅程进度' : '前往 ' + last.name} />
        </>
      )}
      {f >= endF && f < endF + 9 && <AbsoluteFill style={{background: isPearl ? '#d9b8ff' : '#fff6cf', opacity: 0.55 * (1 - (f - endF) / 9), mixBlendMode: 'screen'}} />}
      {fade > 0 && <AbsoluteFill style={{background: '#1a0f06', opacity: fade}} />}

      {/* ---- sound */}
      {stepSfx}
      <Sfx at={Math.max(2, timing.start - 40)} src={mcSound('random/pop')} volume={0.45} />
      {nodes.slice(1, -1).map((_, i) => (
        <Sfx key={i} at={travel.arriveF[i + 1]} src={mcSound('random/orb')} volume={0.4} />
      ))}
      <Sfx at={endF} src={mcSound('random/levelup')} volume={0.4} />
      <Sfx at={endF + 7} src={mcSound('ui/toast/in')} volume={0.4} />
      {isPearl && <Sfx at={timing.start} src={mcSound('random/pop')} volume={0.5} rate={0.7} />}
    </AbsoluteFill>
  );
};
