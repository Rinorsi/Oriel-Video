// mcd-t-map-zoom: the world map as a transition. A pulls out of the frame: its picture is cut down to a hexagon (rect -> hex clip) and shrinks onto the
//   start node of the parchment world map (the ScenePlate sand table), the camera follows a dotted gold path to the destination node (gold hex skull
//   badge + name tag), pushes in, and the node opens: B grows out of the hexagon (hex -> rect clip) until it is the frame again.
//   Props: from / to (place names on the two nodes), N1 / N2 (node positions on the map plate, px at the base view).
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {McdText, SkullBadge} from '../mcdkit/kit';
import {ScenePlate} from '../mcdscene/scenes';
import {FULL, hash, lerp, mEntry, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps} from './common';

const T = 100;
const COLLAPSE = 26; // A has become the start node
const TRAVEL0 = 28; // camera starts to travel
const TRAVEL1 = 70;
const OPEN0 = 66; // B starts to grow
const OPEN1 = 92;
const HEXW = 135; // node width at the base view
const FINAL_M = 2.4; // map zoom at the destination

const N1: [number, number] = [610, 690];
const N2: [number, number] = [1330, 400];

const HEX_W = 1080 * 0.8660254; // regular pointy-top hexagon cut from the centre of a 16:9 frame
const hexClip = (k: number) => {
  // k = 0 -> full-frame rectangle (as a 6-point polygon), k = 1 -> regular hexagon
  const cx = 960;
  const hw = HEX_W / 2;
  const pts: [number, number][] = [
    [cx, 0],
    [lerp(1920, cx + hw, k), lerp(0, 270, k)],
    [lerp(1920, cx + hw, k), lerp(1080, 810, k)],
    [cx, 1080],
    [lerp(0, cx - hw, k), lerp(1080, 810, k)],
    [lerp(0, cx - hw, k), lerp(0, 270, k)],
  ];
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
};
const hexPoints = (inset: number) => {
  const cx = 960;
  const hw = HEX_W / 2 - inset;
  return [
    [cx, inset * 1.15],
    [cx + hw, 270 + inset * 0.58],
    [cx + hw, 810 - inset * 0.58],
    [cx, 1080 - inset * 1.15],
    [cx - hw, 810 - inset * 0.58],
    [cx - hw, 270 + inset * 0.58],
  ]
    .map((p) => p.join(','))
    .join(' ');
};

const HexRing: FC<{opacity: number}> = ({opacity}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
    <polygon points={hexPoints(-50)} fill="none" stroke="#000" strokeWidth={104} strokeLinejoin="miter" />
    <polygon points={hexPoints(-50)} fill="none" stroke="#F2B83A" strokeWidth={58} strokeLinejoin="miter" />
    <polygon points={hexPoints(-26)} fill="none" stroke="#FCE693" strokeWidth={10} strokeLinejoin="miter" opacity={0.95} />
  </svg>
);

const ease = EASE.inOut;
const sNode = HEXW / HEX_W;

const camAt = (t: number) => {
  const k = ease(clamp01((t - TRAVEL0) / (TRAVEL1 - TRAVEL0)));
  const m = lerp(1, FINAL_M, Math.pow(k, 1.15));
  const mid = ease(clamp01((t - TRAVEL0) / (TRAVEL1 - TRAVEL0)));
  // focus travels from the start node region to the destination (keeps both on screen early on)
  const focusK = Math.pow(mid, 0.9);
  return {m, cx: lerp(960, N2[0], focusK), cy: lerp(540, N2[1], focusK)};
};

const pathPoint = (u: number): [number, number] => {
  const mx = (N1[0] + N2[0]) / 2 + 40;
  const my = (N1[1] + N2[1]) / 2 + 150;
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return [a * N1[0] + b * mx + c * N2[0], a * N1[1] + b * my + c * N2[1]];
};

export const makeMapZoomDef = (o: {from?: string; to?: string} = {}): MDef => {
  const fromName = o.from ?? '营地';
  const toName = o.to ?? '苦力怕森林';
  const Tag: FC<{x: number; y: number; text: string; a: number}> = ({x, y, text, a}) => (
    <div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', opacity: a}}>
      <div style={{background: 'rgba(24,24,30,0.92)', boxShadow: '0 0 0 3px #000, 6px 6px 0 rgba(0,0,0,0.35)', padding: '8px 22px', clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)'}}>
        <McdText size={30} weight={700} color="#fff" style={{whiteSpace: 'nowrap', letterSpacing: 2}}>
          {text}
        </McdText>
      </div>
    </div>
  );

  const MapLayer: FC<{f: number; A: FC; B: FC}> = ({f, A, B}) => {
    const cam = camAt(f);
    const pullOut = EASE.out(clamp01(f / COLLAPSE));
    const mapScale = lerp(1.7, 1, pullOut);
    // A: full frame -> hexagon on N1
    const kA = ease(clamp01(f / COLLAPSE));
    const aPos: [number, number] = [lerp(960, N1[0], kA), lerp(540, N1[1], kA)];
    const aScale = lerp(1, sNode, EASE.inOut(clamp01(f / COLLAPSE)));
    // B: node -> frame
    const kB = ease(clamp01((f - OPEN0) / (OPEN1 - OPEN0)));
    const bScale = lerp(sNode, 1 / FINAL_M, kB);
    const pathDraw = ss(TRAVEL0 + 2, TRAVEL0 + 26, f);
    const n2In = EASE.back(clamp01((f - (TRAVEL0 + 6)) / 8));
    const showA = f < OPEN0 + 6;
    return (
      <div style={{...FULL, transformOrigin: '0 0', transform: `translate(960px,540px) scale(${cam.m}) translate(${-cam.cx}px,${-cam.cy}px)`}}>
        {/* the map (own pull-out zoom about the start node) */}
        <div style={{...FULL, transformOrigin: `${N1[0]}px ${N1[1]}px`, transform: `scale(${mapScale})`, opacity: ss(0, 10, f)}}>
          <ScenePlate biome="world-map" camera={{from: {x: 0, y: -20, zoom: 0.85}, to: {x: 0, y: -20, zoom: 0.85}, mode: 'linear'}} />
        </div>
        {/* dotted gold path */}
        {f > TRAVEL0 &&
          Array.from({length: 26}, (_, i) => {
            const u = i / 25;
            if (u > pathDraw) return null;
            const [px, py] = pathPoint(u);
            const pop = clamp01((pathDraw - u) * 9);
            const q = 14 * (0.5 + 0.5 * pop);
            return <div key={i} style={{position: 'absolute', left: Math.round((px - q / 2) / 2) * 2, top: Math.round((py - q / 2) / 2) * 2, width: q, height: q, background: i % 2 ? '#F8D868' : '#FCE693', boxShadow: '0 0 0 3px #3A2810, 4px 4px 0 3px rgba(58,40,16,0.4)'}} />;
          })}
        {/* start node: A lives inside it */}
        {f >= 0 && showA && (
          <div style={{position: 'absolute', left: aPos[0] - 960, top: aPos[1] - 540, width: 1920, height: 1080, transform: `scale(${aScale})`, transformOrigin: '50% 50%', opacity: 1 - ss(OPEN0, OPEN0 + 6, f)}}>
            <div style={{...FULL, clipPath: hexClip(ss(0, COLLAPSE - 4, f))}}>
              <A />
            </div>
            <HexRing opacity={ss(COLLAPSE - 10, COLLAPSE - 2, f)} />
          </div>
        )}
        {f >= COLLAPSE - 2 && <Tag x={N1[0]} y={N1[1] + 86} text={fromName} a={ss(COLLAPSE - 2, COLLAPSE + 4, f) * (1 - ss(OPEN0 - 4, OPEN0 + 2, f))} />}
        {/* destination node */}
        {f >= TRAVEL0 + 6 && f < OPEN0 && (
          <div style={{position: 'absolute', left: N2[0] - HEXW / 2, top: N2[1] - (HEXW * 1.1547) / 2, transform: `scale(${n2In})`, transformOrigin: '50% 50%', filter: 'drop-shadow(6px 8px 0 rgba(0,0,0,0.3))'}}>
            <SkullBadge size={HEXW} />
          </div>
        )}
        {f >= TRAVEL0 + 10 && <Tag x={N2[0]} y={N2[1] + 86} text={toName} a={ss(TRAVEL0 + 10, TRAVEL0 + 16, f) * (1 - ss(OPEN0 - 2, OPEN0 + 4, f))} />}
        {/* B grows out of the destination node */}
        {f >= OPEN0 && (
          <>
            <div style={{position: 'absolute', left: N2[0] - 960, top: N2[1] - 540, width: 1920, height: 1080, transform: `scale(${bScale})`, transformOrigin: '50% 50%', opacity: 1 - ss(0.55, 0.9, kB) * 0}}>
              <div style={{...FULL, clipPath: hexClip(1 - ss(0.12, 0.92, kB))}}>
                <B />
              </div>
              <HexRing opacity={1 - ss(0.35, 0.75, kB)} />
            </div>
          </>
        )}
      </div>
    );
  };

  const Overlay: FC<OverlayProps> = ({f}) => {
    // transparent layer: gold sparks around the node when it opens
    const t = f - OPEN0;
    if (t < 0 || t > 22) return null;
    return (
      <AbsoluteFill>
        {Array.from({length: 22}, (_, i) => {
          const ang = hash(i, 1, 51) * Math.PI * 2;
          const d = (60 + hash(i, 2, 51) * 520) * EASE.out(t / 22);
          const q = hash(i, 3, 51) > 0.5 ? 16 : 10;
          return <div key={i} style={{position: 'absolute', left: Math.round((960 + Math.cos(ang) * d) / 4) * 4, top: Math.round((540 + Math.sin(ang) * d * 0.7) / 4) * 4, width: q, height: q, background: i % 3 ? '#FCE693' : '#fff', opacity: 1 - t / 22}} />;
        })}
      </AbsoluteFill>
    );
  };

  const Scene: FC<SceneProps> = ({f, A, B, p}) => (
    <AbsoluteFill style={{background: '#E8D8C0'}}>
      {p <= 0 && <A />}
      {p >= 1 && <B />}
      {p > 0 && p < 1 && (
        <>
          <MapLayer f={f} A={A} B={B} />
          {f >= OPEN0 && <Overlay p={p} f={f} />}
        </>
      )}
    </AbsoluteFill>
  );

  return {
    frames: T,
    Scene,
    cues: [
      {at: COLLAPSE - 2, src: 'mc:random/click', volume: 0.3, rate: 0.8},
      {at: TRAVEL0 + 4, src: 'mc:ui/toast/in', volume: 0.2},
      {at: TRAVEL0 + 10, src: 'mc:random/click', volume: 0.26, rate: 1.1},
      {at: OPEN1, src: 'mc:random/levelup', volume: 0.16, rate: 1.1},
    ],
  };
};

void stepQ;
export const mapZoomDef = makeMapZoomDef();
export const mapZoomPair = {A: plate('forest-day'), B: plate('desert')};

export const mapZoomEntry = mEntry(
  mapZoomDef,
  {
    id: 'mcd-t-map-zoom',
    name: '地下城·世界地图推近',
    tags: ['地下城', '转场', '世界地图', '六边形节点', '旅程'],
    blurb: 'A 画面被切成六边形缩进米色羊皮纸世界地图（体素沙盘）上的起点节点，镜头沿金色虚线飞向目的地的金色六边形骷髅节点，推近后节点放大，B 从六边形里长成整个画面。',
    usage: '"前往下一站/下一个地点"的旅程转场、功能路线图、章节总览；换 from / to 即可标注地名。',
    params: [
      {name: 'from / to', desc: 'makeMapZoomDef({from, to}) 两个节点的地名，默认"营地"→"苦力怕森林"'},
      {name: 'N1 / N2', desc: '两个节点在地图底板上的位置（mapZoom.tsx 顶部），要与沙盘上的岛屿对齐'},
      {name: 'FINAL_M / HEXW', desc: '终点放大倍数 2.4、节点宽度 135px'},
    ],
  },
  mapZoomPair.A,
  mapZoomPair.B,
);
