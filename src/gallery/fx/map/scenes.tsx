import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {PixelSprite} from '../../flat';
import {block, item} from '../../../mc/assets';
import {PIXEL_FONT} from '../../../mc/fonts';
import {LightRays} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {hudTex, mcSound, reelSfx} from '../../../reel/kit';
import {Sfx} from './audio';
import {GOLD, ICONS, INK, NameTag, PARCH, PixelLabel, Pushpin, RED, parchBox} from './art';
import {Anchor, MapImage, Particles, PixelBurst, Pop, World, clampCam, fitView, getMap, lerp, lineRoute, toWorld, type Cam, type MapNode} from './engine';
import {Compass, CoordsHud, Legend, MapFrame, MiniMap, TitlePlate, enter} from './hud';
import {MapJourney, type JourneyCtx} from './journey';
import {Avatar, DashedRoute, GuideRoute, PlaceMarker, Sign} from './parts';
import {WH, WW} from './mapgen';

/**
 * Scene-style map effects built on the shared engine:
 *   HomeScene     (map-home)     walk home at dusk, the cottage lights up, "欢迎回家" sign, warm glow
 *   RespawnScene  (map-respawn)  death at a skull marker, light pillar lifts the avatar to the bed, hearts refill
 *   PinPop        (map-pin-pop)  place pins dropping in with name + coordinate tags (has a transparent Layer)
 */

const lerpRgb = (a: [number, number, number], b: [number, number, number], t: number) => `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;

// ------------------------------------------------------------------ cottage
const Cottage: FC<{f: number; lit: number; door: number; k?: number}> = ({f, lit, door, k = 1}) => {
  const flick = lit > 0 ? 0.88 + 0.12 * Math.sin(f * 0.9) : 0;
  const wall = '#e6cf9c';
  const rows = Array.from({length: 6}, (_, i) => ({top: 40 + i * 26, w: 120 + i * 36}));
  const pane = (x: number) => (
    <div style={{position: 'absolute', left: x, top: 214, width: 56, height: 52, background: lit > 0 ? `rgb(${255},${Math.round(200 + 30 * flick)},${Math.round(110 + 30 * flick)})` : '#33466e', border: `6px solid ${INK}`, boxSizing: 'border-box', boxShadow: lit > 0 ? `0 0 ${40 * lit * flick}px ${12 * lit}px rgba(255,200,100,${0.8 * lit})` : undefined}}>
      <div style={{position: 'absolute', left: 17, top: 0, width: 6, height: '100%', background: INK}} />
      <div style={{position: 'absolute', left: 0, top: 15, width: '100%', height: 6, background: INK}} />
    </div>
  );
  return (
    <div style={{position: 'absolute', left: -150 * k, top: -300 * k, width: 300, height: 300, transform: `scale(${k})`, transformOrigin: '0 0'}}>
      {/* chimney */}
      <div style={{position: 'absolute', left: 204, top: 4, width: 38, height: 100, background: '#a8452f', border: `6px solid ${INK}`, boxSizing: 'border-box'}} />
      <div style={{position: 'absolute', left: 198, top: 0, width: 50, height: 16, background: '#7d3222', border: `6px solid ${INK}`, boxSizing: 'border-box'}} />
      {/* roof ink silhouette then colour */}
      {rows.map((r, i) => (
        <div key={`i${i}`} style={{position: 'absolute', left: 150 - r.w / 2 - 6, top: r.top - 6, width: r.w + 12, height: 38, background: INK}} />
      ))}
      <div style={{position: 'absolute', left: 30 - 6, top: 188, width: 252, height: 118, background: INK}} />
      {rows.map((r, i) => (
        <div key={`c${i}`} style={{position: 'absolute', left: 150 - r.w / 2, top: r.top, width: r.w, height: 26, background: i % 2 ? '#c9483f' : '#d9574a', boxShadow: 'inset 0 -6px 0 #8f2f2f'}} />
      ))}
      {/* walls */}
      <div style={{position: 'absolute', left: 30, top: 194, width: 240, height: 106, background: wall, boxShadow: 'inset 0 -10px 0 #cdb27a, inset 0 8px 0 rgba(255,255,255,0.25)'}} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 30, top: 222 + i * 26, width: 240, height: 4, background: 'rgba(120,80,30,0.22)'}} />
      ))}
      {pane(54)}
      {pane(190)}
      {/* door */}
      <div style={{position: 'absolute', left: 116, top: 210, width: 68, height: 90, background: door > 0.05 ? '#2a1a10' : '#8b5f38', border: `6px solid ${INK}`, boxSizing: 'border-box', overflow: 'hidden'}}>
        {door > 0.05 && lit > 0 && <div style={{position: 'absolute', inset: 0, background: 'rgba(255,200,100,0.55)'}} />}
        <div style={{position: 'absolute', left: 0, top: 0, width: `${(1 - door) * 100}%`, height: '100%', background: '#8b5f38', boxShadow: 'inset -6px 0 0 #6a4426'}}>
          <div style={{position: 'absolute', right: 8, top: 40, width: 10, height: 10, background: GOLD, border: `3px solid ${INK}`, boxSizing: 'border-box'}} />
        </div>
      </div>
      {/* step */}
      <div style={{position: 'absolute', left: 104, top: 298, width: 92, height: 14, background: '#9a9aa2', border: `5px solid ${INK}`, boxSizing: 'border-box'}} />
    </div>
  );
};

const Torch: FC<{f: number; lit: number; seed: number}> = ({f, lit, seed}) => (
  <div style={{position: 'absolute', width: 0, height: 0}}>
    <div style={{position: 'absolute', left: -6, top: -70, width: 12, height: 70, background: '#8b5f38', border: `4px solid ${INK}`, boxSizing: 'border-box'}} />
    {lit > 0 && (
      <>
        <div style={{position: 'absolute', left: -14, top: -102 + Math.sin(f * 0.7 + seed) * 3, width: 28, height: 30, background: '#ff9a3c', border: `4px solid ${INK}`, boxSizing: 'border-box', transform: `scale(${lit})`, boxShadow: '0 0 30px 10px rgba(255,170,60,0.6)'}} />
        <div style={{position: 'absolute', left: -7, top: -96 + Math.sin(f * 0.9 + seed) * 2, width: 14, height: 16, background: '#fff4b0', transform: `scale(${lit})`}} />
      </>
    )}
  </div>
);

const WelcomeSign: FC<{f: number; at: number; text?: string}> = ({f, at, text = '欢迎回家'}) => {
  const d = f - at;
  if (d < 0) return null;
  const sc = EASE.back(clamp01(d / 14));
  const swing = Math.sin(d * 0.28) * Math.exp(-d / 26) * 9;
  return (
    <div style={{position: 'absolute', left: -280, bottom: 0, width: 560, transform: `scale(${sc}) rotate(${swing}deg)`, transformOrigin: '50% 0'}}>
      <div style={{position: 'absolute', left: 110, top: -60, width: 8, height: 64, background: INK}} />
      <div style={{position: 'absolute', left: 442, top: -60, width: 8, height: 64, background: INK}} />
      <div style={{position: 'relative', height: 132, backgroundImage: `url(${block('oak_planks')})`, backgroundSize: '64px 64px', imageRendering: 'pixelated', border: `8px solid ${INK}`, boxShadow: `0 10px 0 ${INK}, inset 0 0 0 6px #b8844f, inset 0 -10px 0 rgba(0,0,0,0.25)`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
        <PixelSprite sprite={ICONS.bed} px={5} outline={INK} />
        <span style={{fontFamily: PIXEL_FONT, fontSize: 72, lineHeight: '72px', color: '#fff4d6', whiteSpace: 'pre', WebkitFontSmoothing: 'none', textShadow: `5px 5px 0 ${INK}, -3px -3px 0 ${INK}, 3px -3px 0 ${INK}, -3px 3px 0 ${INK}`}}>{text}</span>
        <PixelSprite sprite="heart" px={6} outline={INK} />
      </div>
    </div>
  );
};

export type HomeProps = {
  frames?: number;
  seed?: number;
  /** Name of the destination house (overrides nodes[1].name). */
  houseName?: string;
  /** [from, home] map nodes; defaults to the demo camp -> cottage. */
  nodes?: [MapNode, MapNode];
  /** Text on the hanging sign after the lights come on. */
  welcomeText?: string;
  /** Title plate text. */
  title?: string;
};

const HOME_NODES: MapNode[] = [
  {name: '远征营地', xz: [1480, -420], pos: [0.74, 0.34], icon: 'tent', sub: '出发'},
  {name: '温馨小屋', xz: [12, 64], pos: [0.34, 0.6], icon: 'bed', sub: '出生点 · 已回到家'},
];

export const HomeScene: FC<HomeProps> = ({frames = 340, seed = 3, houseName = '温馨小屋', nodes: nodesIn = HOME_NODES as [MapNode, MapNode], welcomeText = '欢迎回家', title = '回家的路'}) => {
  const nodes: MapNode[] = [nodesIn[0], {...nodesIn[1], name: houseName}];
  const dusk = (f: number) => lerpRgb([255, 238, 214], [150, 138, 205], clamp01(f / 232) ** 1.2);
  const tint = (f: number) => {
    const base = dusk(f);
    return f > 232 ? lerpRgb([150, 138, 205], [110, 104, 172], clamp01((f - 232) / 24)) : base;
  };
  const lightAt = (c: JourneyCtx) => c.endF + 14;
  const back = (c: JourneyCtx) => {
    const home = c.wp[1];
    const lit = EASE.out(clamp01((c.f - lightAt(c)) / 10));
    const zk = lerp(0.7, 1.25, clamp01((c.cam.z - 0.5) / 0.6));
    return (
      <>
        {/* warm pool of light on the ground */}
        <div style={{position: 'absolute', left: home.x - 520, top: home.y - 260, width: 1040, height: 520, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,214,120,0.85) 0%, rgba(255,170,80,0.38) 38%, rgba(255,140,60,0) 70%)', mixBlendMode: 'screen', opacity: lit * (0.85 + 0.15 * Math.sin(c.f * 0.4)), transform: `scale(${0.4 + 0.6 * lit})`}} />
        <Anchor x={home.x} y={home.y - 6} k={zk}>
          <Cottage f={c.f} lit={lit} door={c.f >= c.endF - 6 && c.f < c.endF + 16 ? EASE.out(clamp01((c.f - c.endF + 6) / 6)) * (1 - clamp01((c.f - c.endF - 10) / 6)) : 0} />
          <div style={{position: 'absolute', left: -190, top: 0}}>
            <Torch f={c.f} lit={lit} seed={1} />
          </div>
          <div style={{position: 'absolute', left: 190, top: 0}}>
            <Torch f={c.f} lit={lit} seed={4} />
          </div>
        </Anchor>
      </>
    );
  };
  const front = (c: JourneyCtx) => {
    const home = c.wp[1];
    const zk = lerp(0.7, 1.25, clamp01((c.cam.z - 0.5) / 0.6));
    const L = lightAt(c);
    const rnd = mulberry32(77);
    return (
      <>
        <Particles f={c.f} cfg={{from: L, to: 9999, step: 3, life: 46, pos: () => ({x: home.x + 82 * zk / c.cam.z, y: home.y - 300 * zk / c.cam.z}), colors: ['#f4f0e8', '#d8d4cc', '#ffffff'], speed: [0.2, 0.6], dir: () => -Math.PI / 2 + 0.2, size: [14, 30], drag: 0.97, seed: 5, lift: 0.5, spread: 6}} />
        <Pop f={c.f} at={L} x={home.x} y={home.y - 150 * zk} colors={['#ffd23f', '#ffe9a0', '#ff9a3c', '#ffffff']} count={30} speed={16} life={40} ring={560} ringColor="#ffe9a0" seed={9} gravity={0.15} />
        <Pop f={c.f} at={L + 5} x={home.x} y={home.y - 40} colors={['#ffd23f']} count={0} ring={820} ringColor="#ffb347" seed={3} />
        {/* hearts rising */}
        <Particles f={c.f} cfg={{from: L + 8, to: 9999, step: 7, life: 54, pos: () => ({x: home.x, y: home.y - 120 * zk / c.cam.z}), colors: ['#ff7aa8'], speed: [1.4, 2.4], dir: (fr, r) => -Math.PI / 2 + (r() - 0.5) * 1.6, size: [26, 36], drag: 0.97, seed: 12, spread: 220, lift: 0.4, shape: 'square'}} />
        {Array.from({length: 18}, (_, i) => {
          const a = rnd() * Math.PI * 2;
          const rr = 200 + rnd() * 260;
          const ph = rnd() * 6;
          const t = (c.f - L) / 30;
          if (t < 0) return null;
          const x = home.x + (Math.cos(a + c.f * 0.012 * (i % 2 ? 1 : -1) + ph) * rr * zk) / c.cam.z;
          const y = home.y - 140 + (Math.sin(a * 1.3 + c.f * 0.015 + ph) * rr * 0.5 * zk) / c.cam.z;
          const blink = 0.4 + 0.6 * Math.abs(Math.sin(c.f * 0.1 + ph * 3));
          const s = 12 / c.cam.z;
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, background: i % 3 ? '#fff4b0' : '#ffd23f', opacity: blink * clamp01(t), boxShadow: `0 0 ${14 / c.cam.z}px ${6 / c.cam.z}px rgba(255,220,120,0.8)`}} />;
        })}
        <Anchor x={home.x} y={home.y} k={zk * 0.82}>
          <div style={{position: 'absolute', left: 0, top: -400}}>
            <WelcomeSign f={c.f} at={L + 4} text={welcomeText} />
          </div>
        </Anchor>
      </>
    );
  };
  const screen = (c: JourneyCtx) => {
    const home = c.wp[1];
    const a = EASE.out(clamp01((c.f - lightAt(c)) / 16));
    const sx = 960 + (home.x - c.cam.cx) * c.cam.z;
    const sy = 540 + (home.y - c.cam.cy) * c.cam.z - 150;
    return (
      <>
        <AbsoluteFill style={{background: `radial-gradient(circle at ${sx}px ${sy}px, rgba(255,226,140,${0.5 * a}) 0px, rgba(255,170,80,${0.2 * a}) 330px, rgba(40,20,70,${0.25 * a}) 900px)`, mixBlendMode: 'screen', pointerEvents: 'none'}} />
        <div style={{position: 'absolute', inset: 0, opacity: a * 0.55, mixBlendMode: 'screen', pointerEvents: 'none'}}>
          <LightRays x={sx} y={sy} size={1500} color="255,220,140" opacity={0.28} rays={12} />
        </div>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(20,8,40,${0.4 * a}) 100%)`, pointerEvents: 'none'}} />
      </>
    );
  };
  return (
    <MapJourney
      nodes={nodes}
      kind="home"
      frames={frames}
      seed={seed}
      title={title}
      subtitle={`${nodes[0].name} → ${houseName}`}
      tint={tint}
      hideFinalMarker
      noSign
      enterBuilding
      extraBack={back}
      extraWorld={front}
      extraScreen={screen}
    />
  );
};

// ------------------------------------------------------------------ respawn
type Key = {f: number; z: number; cx: number; cy: number};
const keyCam = (f: number, keys: Key[]): Cam => {
  let a = keys[0];
  let b = keys[0];
  let t = 0;
  if (f <= keys[0].f) {
    a = b = keys[0];
  } else if (f >= keys[keys.length - 1].f) {
    a = b = keys[keys.length - 1];
  } else {
    for (let i = 0; i < keys.length - 1; i++) {
      if (f < keys[i + 1].f) {
        a = keys[i];
        b = keys[i + 1];
        t = EASE.inOut(clamp01((f - a.f) / (b.f - a.f)));
        break;
      }
    }
  }
  const c = clampCam({z: lerp(a.z, b.z, t), cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t)});
  return {...c, f};
};

const Pillar: FC<{f: number; at: number; x: number; y: number; life?: number; width?: number; color?: string}> = ({f, at, x, y, life = 40, width = 200, color = '255,226,140'}) => {
  const d = f - at;
  if (d < 0 || d > life) return null;
  const grow = EASE.out(clamp01(d / 7));
  const fade = 1 - clamp01((d - life * 0.5) / (life * 0.5));
  return (
    <Anchor x={x} y={y}>
      <div style={{position: 'absolute', left: -width / 2, top: -1500 * grow, width, height: 1500 * grow, background: `linear-gradient(90deg, rgba(${color},0) 0%, rgba(${color},0.85) 30%, rgba(255,255,255,0.98) 50%, rgba(${color},0.85) 70%, rgba(${color},0) 100%)`, WebkitMaskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)', opacity: fade, transform: `scaleX(${0.7 + 0.3 * Math.sin(d * 0.6)})`}} />
      <div style={{position: 'absolute', left: -width * 0.8, top: -width * 0.25, width: width * 1.6, height: width * 0.5, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(255,255,255,0.95), rgba(${color},0.5) 55%, rgba(${color},0) 75%)`, opacity: fade}} />
    </Anchor>
  );
};

const Hearts: FC<{hp: number; f: number; at?: number; label?: string}> = ({hp, f, at = 18, label = '生命值'}) => {
  const hearts = Array.from({length: 10}, (_, i) => clamp01(hp / 2 - i) * 2);
  return (
    <div style={{position: 'absolute', left: 960 - 330, bottom: 84, ...enter(f, at, 0, 160), width: 660, ...parchBox({fill: PARCH, border: 6, shadow: 8}), padding: '8px 14px 14px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', height: 40, alignItems: 'center'}}>
        <PixelLabel size={32} color={INK}>{label}</PixelLabel>
        <PixelLabel size={32} color={hp <= 0 ? '#b3282a' : '#2fa24a'}>{`${Math.round(hp)} / 20`}</PixelLabel>
      </div>
      <div style={{display: 'flex', gap: 4, marginTop: 6, justifyContent: 'center', background: '#2a2a30', border: `4px solid ${INK}`, padding: '6px 6px', boxSizing: 'border-box'}}>
        {hearts.map((v, i) => {
          const pulse = hp > 0 && hp < 20 && Math.floor(hp / 2) === i ? 1.2 : 1;
          return (
            <div key={i} style={{position: 'relative', width: 54, height: 54, transform: `scale(${pulse})`}}>
              <Img src={hudTex('heart/container')} style={{position: 'absolute', inset: 0, width: 54, height: 54, imageRendering: 'pixelated'}} />
              {v >= 2 && <Img src={hudTex('heart/full')} style={{position: 'absolute', inset: 0, width: 54, height: 54, imageRendering: 'pixelated'}} />}
              {v > 0 && v < 2 && <Img src={hudTex('heart/half')} style={{position: 'absolute', inset: 0, width: 54, height: 54, imageRendering: 'pixelated'}} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DROPS = [
  {id: 'diamond_sword', vx: -7, vy: -17},
  {id: 'golden_apple', vx: 5, vy: -19},
  {id: 'bread', vx: -2, vy: -21},
  {id: 'iron_pickaxe', vx: 9, vy: -15},
  {id: 'experience_bottle', vx: -10, vy: -14},
];

export type RespawnProps = {
  frames?: number;
  seed?: number;
  /** Death marker on the map: name, game coords, map position (0..1). */
  death?: MapNode;
  /** Respawn point (bed): name, sub line, game coords, map position (0..1). */
  spawn?: MapNode;
  /** Title plate text. */
  title?: string;
  /** Big red text while dead. */
  deadText?: string;
  /** Score line under the dead text. */
  scoreText?: string;
  /** Label on the health panel. */
  hpLabel?: string;
};

const DEFAULT_DEATH: MapNode = {name: '死亡地点', xz: [1180, -340], pos: [0.72, 0.38], icon: 'skull', color: '#e5483f'};
const DEFAULT_SPAWN: MapNode = {name: '出生点', xz: [12, 64], pos: [0.3, 0.62], icon: 'bed', sub: '重生完成 · 生命值 20 / 20'};

export const RespawnScene: FC<RespawnProps> = ({seed = 5, death = DEFAULT_DEATH, spawn = DEFAULT_SPAWN, title = '重生', deadText = '你死了!', scoreText = '得分: 0', hpLabel = '生命值'}) => {
  const f = useCurrentFrame();
  const Duv = death.pos;
  const Buv = spawn.pos;
  const D = toWorld(Duv);
  const B = toWorld(Buv);
  const built = lineRoute(D, B);
  const route = built.route;
  const DEATH = 46;
  const REVIVE = 112;
  const FLY0 = 128;
  const FLY1 = 176;
  const nodeD: MapNode = death;
  const nodeB: MapNode = spawn;
  const map = getMap({seed, mode: 'free', pins: [Duv, Buv]});
  const mid = {x: (D.x + B.x) / 2, y: (D.y + B.y) / 2};
  const fit = fitView([D, B, {x: B.x + 800, y: B.y - 560}, {x: D.x, y: D.y - 540}], 340, 0.8, 0);
  const cam = keyCam(f, [
    {f: 0, z: fit.z, cx: fit.cx, cy: fit.cy},
    {f: 36, z: 1.12, cx: D.x, cy: D.y - 150},
    {f: REVIVE + 6, z: 1.22, cx: D.x, cy: D.y - 170},
    {f: 146, z: 0.64, cx: mid.x, cy: mid.y - 120},
    {f: FLY1 - 4, z: 0.9, cx: B.x + 100, cy: B.y - 150},
    {f: 202, z: 1.12, cx: B.x, cy: B.y - 150},
    {f: 252, z: 1.14, cx: B.x, cy: B.y - 150},
    {f: 298, z: fit.z, cx: fit.cx, cy: fit.cy},
  ]);
  const shake = f >= DEATH && f < DEATH + 12 ? mulberry32(300 + f) : null;
  const sk = shake ? (1 - (f - DEATH) / 12) * 16 : 0;
  const camS = shake ? {...cam, cx: cam.cx + ((shake() - 0.5) * sk) / cam.z, cy: cam.cy + ((shake() - 0.5) * sk) / cam.z} : cam;

  const tF = EASE.inOut(clamp01((f - FLY0) / (FLY1 - FLY0)));
  const flying = f >= FLY0 && f < FLY1;
  const landed = f >= FLY1;
  const base = landed ? B : f >= FLY0 ? {x: lerp(D.x, B.x, tF), y: lerp(D.y, B.y, tF)} : D;
  const lift = f < REVIVE ? 0 : f < FLY0 ? 110 * EASE.out(clamp01((f - REVIVE - 2) / 14)) : flying ? 110 + 260 * 4 * tF * (1 - tF) : 110 * (1 - EASE.out(clamp01((f - FLY1) / 8)));
  const dead = f >= DEATH && f < REVIVE + 8;
  const crossK = f >= DEATH ? (f < REVIVE + 4 ? EASE.back(clamp01((f - DEATH) / 8)) * 1.0 + (f < DEATH + 8 ? (1 - clamp01((f - DEATH) / 8)) * 1.6 : 0) : 1 - clamp01((f - REVIVE - 4) / 6)) : 0;
  const hp = f < 38 ? 20 : f < 50 ? lerp(20, 0, (f - 38) / 12) : f < 190 ? 0 : lerp(0, 20, clamp01((f - 190) / 30));
  const tripX = lerp(nodeD.xz[0], nodeB.xz[0], landed ? 1 : tF);
  const tripZ = lerp(nodeD.xz[1], nodeB.xz[1], landed ? 1 : tF);
  const dropT = f - DEATH;
  const sc = f < 18 ? EASE.back(clamp01((f - 6) / 12)) : 1;
  const revived = f >= REVIVE + 4;
  const zk = lerp(0.78, 1.0, clamp01((cam.z - 0.5) / 0.7));

  return (
    <AbsoluteFill style={{background: '#1b2a3a', overflow: 'hidden'}}>
      <World cam={camS}>
        <MapImage url={map.url} />
        <GuideRoute route={route} opacity={0.25} />
        {f >= FLY0 - 6 && <DashedRoute route={route} s1={Math.min(route.len, (landed ? 1 : tF) * route.len + 160)} color="#ffcf40" dash={[18, 20]} width={8} />}
        <PlaceMarker node={nodeD} f={f} showAt={10} reachedAt={DEATH} departAt={REVIVE + 4} ring="#e5483f" check={false} up={190} />
        <PlaceMarker node={nodeB} f={f} showAt={14} reachedAt={FLY1 + 2} final ring="#ff7aa8" up={190} side={1} />
      </World>
      <World cam={camS}>
        {/* dropped items */}
        {f >= DEATH &&
          DROPS.map((d, i) => {
            const t = dropT;
            const g = 1.15;
            const t1 = (-2 * d.vy) / g;
            let py: number;
            if (t < t1) py = d.vy * t + 0.5 * g * t * t;
            else {
              const tt = t - t1;
              const v2 = d.vy * 0.38;
              const t2 = (-2 * v2) / g;
              py = tt < t2 ? v2 * tt + 0.5 * g * tt * tt : 0;
            }
            const px = (d.vx * (1 - Math.pow(0.93, t))) / 0.07;
            return (
              <Anchor key={i} x={D.x} y={D.y} k={zk}>
                <div style={{position: 'absolute', left: px + (i - 2) * 30 - 32, top: py + 14 - 64 + (i % 2) * 18, transform: `rotate(${Math.sin(t * 0.2 + i) * 10}deg)`}}>
                  <div style={{position: 'absolute', left: 12, top: 60, width: 40, height: 12, borderRadius: '50%', background: 'rgba(30,20,10,0.35)'}} />
                  <Img src={item(d.id)} style={{width: 64, height: 64, imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 0 rgba(30,20,10,0.4))'}} />
                </div>
              </Anchor>
            );
          })}
        <Particles f={f} cfg={{from: DEATH, to: DEATH + 3, step: 1, burst: 12, life: 30, pos: () => D, colors: ['#ff3b3b', '#b3282a', '#ff8a8a'], speed: [3, 12], size: [10, 22], gravity: 0.4, drag: 0.9, seed: 4}} />
        <Pop f={f} at={DEATH} x={D.x} y={D.y} colors={['#ff3b3b', '#ffffff', '#b3282a']} count={26} speed={16} life={36} ring={400} ringColor="#ff3b3b" seed={11} />
        <Pillar f={f} at={REVIVE} x={D.x} y={D.y} life={34} />
        <Pop f={f} at={REVIVE} x={D.x} y={D.y} colors={['#ffe9a0', '#ffffff', '#ffd23f']} count={30} speed={12} life={40} ring={560} ringColor="#ffe9a0" seed={5} gravity={-0.2} />
        {/* the avatar */}
        {f >= 6 && !(landed && f > FLY1 + 12 && false) && (
          <Avatar x={base.x} y={base.y} f={f} kind="still" moving={false} ang={0} k={zk} scale={sc} dead={dead} crossK={crossK} lift={lift} glow={f >= REVIVE ? 'rgba(255,230,140,0.9)' : undefined} />
        )}
        {flying && (
          <Particles f={f} cfg={{from: FLY0, to: FLY1, step: 1, burst: 3, life: 30, pos: (fr) => { const t = EASE.inOut(clamp01((fr - FLY0) / (FLY1 - FLY0))); return {x: lerp(D.x, B.x, t), y: lerp(D.y, B.y, t) - (110 + 260 * 4 * t * (1 - t)) / cam.z}; }, colors: ['#ffe9a0', '#ffffff', '#ffd23f', '#ff9a3c'], speed: [0.5, 4], size: [10, 24], drag: 0.92, seed: 17, spread: 30}} />
        )}
        <Pillar f={f} at={FLY1 - 2} x={B.x} y={B.y} life={40} width={240} />
        <Pop f={f} at={FLY1} x={B.x} y={B.y} colors={['#ffe9a0', '#ff7aa8', '#ffffff', '#ffd23f']} count={36} speed={17} life={44} ring={620} ringColor="#ffffff" seed={21} />
        <Pop f={f} at={FLY1 + 6} x={B.x} y={B.y} colors={['#ff7aa8']} count={0} ring={620} ringColor="#ffd23f" seed={2} />
        {/* Zzz and hearts at the bed */}
        {landed && (
          <Particles f={f} cfg={{from: FLY1 + 10, to: 9999, step: 9, life: 50, pos: () => ({x: B.x, y: B.y - 150 / cam.z}), colors: ['#ff7aa8', '#ffffff'], speed: [1.2, 2.2], dir: (fr, r) => -Math.PI / 2 + (r() - 0.5) * 1.2, size: [24, 34], drag: 0.97, seed: 40, spread: 160, lift: 0.4}} />
        )}
        {landed && <Sign node={nodeB} f={f} at={FLY1 + 12} side={1} lift={90} />}
      </World>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,14,2,0.38) 100%)', pointerEvents: 'none'}} />
      {/* death vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(120,0,0,0) 35%, rgba(150,0,0,0.75) 100%)', opacity: f >= DEATH - 8 ? clamp01((f - DEATH + 8) / 8) * (1 - clamp01((f - REVIVE) / 10)) : 0, pointerEvents: 'none'}} />
      {f >= DEATH - 2 && f < DEATH + 10 && <AbsoluteFill style={{background: '#ff2d2d', opacity: 0.55 * (1 - (f - DEATH + 2) / 12), mixBlendMode: 'screen'}} />}
      {f >= REVIVE && f < REVIVE + 10 && <AbsoluteFill style={{background: '#fff6cf', opacity: 0.6 * (1 - (f - REVIVE) / 10), mixBlendMode: 'screen'}} />}
      {f >= FLY1 && f < FLY1 + 9 && <AbsoluteFill style={{background: '#fff6cf', opacity: 0.55 * (1 - (f - FLY1) / 9), mixBlendMode: 'screen'}} />}
      {/* "you died" */}
      {f >= DEATH + 4 && f < REVIVE + 4 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', opacity: 1 - clamp01((f - REVIVE + 10) / 14), transform: `scale(${EASE.back(clamp01((f - DEATH - 4) / 12))})`}}>
          <span style={{fontFamily: PIXEL_FONT, fontSize: 132, lineHeight: '132px', color: '#ff5555', textShadow: `8px 8px 0 #3b0a0a, -6px 0 0 ${INK}, 6px 0 0 ${INK}, 0 -6px 0 ${INK}, 0 6px 0 ${INK}`, WebkitFontSmoothing: 'none'}}>{deadText}</span>
          <div style={{marginTop: 10}}>
            <span style={{fontFamily: PIXEL_FONT, fontSize: 48, lineHeight: '48px', color: '#fff', textShadow: `4px 4px 0 ${INK}`}}>{scoreText}</span>
          </div>
        </div>
      )}
      <MapFrame f={f} />
      <TitlePlate f={f} title={title} sub={`${nodeD.name} → ${nodeB.name}`} />
      <Compass f={f} />
      <Legend f={f} />
      <MiniMap f={f} mapUrl={map.url} route={route} start={D} end={B} avatar={base} view={cam} reveal={clamp01((f - 20) / 20)} />
      {/* HP panel sits at the bottom centre; the coordinate chips live in the free left column under the title plate, so no HUD panel overlaps another or hides the map labels */}
      <CoordsHud f={f} x={tripX} z={tripZ} dist={Math.hypot(tripX - nodeD.xz[0], tripZ - nodeD.xz[1])} left={84} top={236} column />
      <Hearts hp={hp} f={f} label={hpLabel} />
      <Sfx at={8} src={mcSound('random/pop')} volume={0.4} />
      <Sfx at={DEATH} src={mcSound('random/anvil_land')} volume={0.4} />
      <Sfx at={DEATH + 6} src={mcSound('random/pop')} volume={0.4} rate={0.8} />
      <Sfx at={REVIVE} src={mcSound('random/levelup')} volume={0.45} rate={0.9} />
      <Sfx at={FLY1} src={mcSound('random/levelup')} volume={0.45} />
      <Sfx at={FLY1 + 12} src={mcSound('ui/toast/in')} volume={0.4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={190 + i * 6} src={mcSound('random/orb')} volume={0.2} rate={1 + i * 0.1} />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ pin pop
export type PinSpec = {
  /** Screen position of the needle tip (px, 1920 x 1080). */
  x: number;
  y: number;
  name: string;
  /** Second line, e.g. "X: 120  Z: -88". */
  coord?: string;
  /** Frame the pin lands. */
  at: number;
  color?: string;
};

const DEMO_PINS: PinSpec[] = [
  {x: 440, y: 740, name: '出生点', coord: 'X: 12   Z: 64', at: 14, color: RED},
  {x: 880, y: 470, name: '村庄集市', coord: 'X: 480   Z: -120', at: 42, color: '#3fb0e8'},
  {x: 1330, y: 790, name: '钻石矿脉', coord: 'X: 1204   Z: -388', at: 70, color: '#5ed16a'},
  {x: 1600, y: 420, name: '末地要塞', coord: 'X: 1800   Z: 960', at: 98, color: '#8f6bff'},
];

const OreCoord: FC<{children: string}> = ({children}) => (
  <div style={{display: 'inline-block', padding: '8px 20px 10px', background: '#17101f', border: '6px solid #3c2a63', boxShadow: '0 8px 0 rgba(0,0,0,0.5), inset 0 0 0 4px #0c0812', fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: '36px', color: '#d8ccf0', whiteSpace: 'pre', WebkitFontSmoothing: 'none'}}>{children}</div>
);

const MapPin: FC<{p: PinSpec; f: number; flip: boolean}> = ({p, f, flip}) => {
  const d = f - p.at;
  const color = p.color ?? RED;
  if (d < -12) return null;
  const fall = d < 0 ? -600 * Math.pow(1 - (d + 12) / 12, 1.6) : 0;
  const land = d >= 0 ? d : -1;
  const sq = land >= 0 ? Math.sin(land * 1.3) * Math.exp(-land / 6) : 0;
  const bob = d > 18 ? Math.sin((f - p.at) * 0.12) * 4 : 0;
  const tag = EASE.back(clamp01((d - 6) / 12));
  const coord = EASE.back(clamp01((d - 12) / 12));
  const vis = d >= -12 ? 1 : 0;
  return (
    <div style={{position: 'absolute', left: p.x, top: p.y, opacity: vis, width: 0, height: 0}}>
        {/* ground shadow + ripple */}
        <div style={{position: 'absolute', left: -50, top: -14, width: 100, height: 28, borderRadius: '50%', background: 'rgba(30,20,10,0.38)', transform: `scale(${d < 0 ? 0.4 + (d + 12) / 20 : 1})`}} />
        {d >= 0 && d < 24 && <PixelBurst d={d} reach={190} color={color} accent="#ffffff" seed={p.at + 3} />}
        {/* needle + head */}
        <div style={{position: 'absolute', left: -66, top: -192 + fall + bob, transformOrigin: '50% 100%', transform: `scale(${1 + sq * 0.14}, ${1 - sq * 0.2})`}}>
          <Pushpin size={132} color={color} />
        </div>
        {/* name tag */}
        <div style={{position: 'absolute', ...(flip ? {right: 60} : {left: 60}), top: -170 + bob, transform: `scale(${tag})`, transformOrigin: flip ? '100% 50%' : '0 50%'}}>
          <NameTag size={48}>{p.name}</NameTag>
        </div>
        {p.coord && (
          <div style={{position: 'absolute', ...(flip ? {right: 60} : {left: 60}), top: -90 + bob, transform: `scale(${coord})`, transformOrigin: flip ? '100% 0' : '0 0'}}>
            <OreCoord>{p.coord}</OreCoord>
          </div>
        )}
        {d >= 0 && d < 24 &&
          Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const k = EASE.out(d / 24);
            return <div key={i} style={{position: 'absolute', left: Math.cos(a) * 120 * k - 7, top: Math.sin(a) * 50 * k - 7 - 20 * k, width: 14, height: 14, background: i % 2 ? '#fff' : color, opacity: 1 - d / 24, outline: `3px solid ${INK}`}} />;
          })}
    </div>
  );
};

export const PinPop: FC<{bg?: boolean; pins?: PinSpec[]; connect?: boolean}> = ({bg, pins = DEMO_PINS, connect = true}) => {
  const f = useCurrentFrame();
  const map = bg ? getMap({seed: 3, mode: 'free', pins: []}) : null;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {map && (
        <>
          <div style={{position: 'absolute', left: -960 * 0.0, top: 0, width: 1920, height: 1080, overflow: 'hidden'}}>
            <Img src={map.url} style={{position: 'absolute', left: -420, top: -300, width: WW * 0.7, height: WH * 0.7, imageRendering: 'pixelated'}} />
          </div>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(30,14,2,0.5) 100%)'}} />
          <MapFrame f={f} />
        </>
      )}
      {connect && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          {pins.slice(1).map((p, i) => {
            const a = pins[i];
            const t = EASE.out(clamp01((f - p.at + 4) / 22));
            if (t <= 0) return null;
            const x2 = lerp(a.x, p.x, t);
            const y2 = lerp(a.y, p.y, t);
            return (
              <g key={i}>
                <line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke={INK} strokeWidth={14} strokeDasharray="22 18" strokeDashoffset={-3} />
                <line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke="#fff4d6" strokeWidth={8} strokeDasharray="16 24" />
              </g>
            );
          })}
        </svg>
      )}
      {pins.map((p, i) => (
        <MapPin key={i} p={p} f={f} flip={p.x > 1250} />
      ))}
      {pins.map((p, i) => (
        <Sfx key={i} at={p.at} src={mcSound('random/click')} volume={0.4} rate={1 + i * 0.08} />
      ))}
      {pins.map((p, i) => (
        <Sfx key={`p${i}`} at={p.at + 3} src={mcSound('random/pop')} volume={0.3} rate={1.1 + i * 0.05} />
      ))}
    </AbsoluteFill>
  );
};

