import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BLACK_FONT, TITLE_FONT} from '../../../mc/fonts';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {mcSound, reelSfx} from '../../../reel/kit';
import {Sfx} from './audio';
import {PlayerFace} from '../../../mg/Ore';
import {Anchor, Pop, World, camAt, fitView, lerp, pointAt, ptsStr, resample, roundPoly, subPath, travelAt, type CamCfg, type MapNode, type P, type Route, type Timing} from './engine';
import {WH, WW} from './mapgen';

/**
 * map-flat-modern: a non-pixel, geometric "navigation app" map.
 * Flat colour blocks (buildings with hard offset shadows, parks, a river, arterial roads), an indigo route that is drawn as the
 * avatar travels along the street grid, a turn-by-turn card, a search card and a bottom sheet with ETA.
 *
 * Props (FlatMapProps)
 *   nodes   MapNode[]  first = start, last = destination; positions snap to the nearest street intersection.
 *   seed    changes the city layout
 *   frames  length (camera pulls back at the end)
 *   title   text on the top search card header chip
 */

const C = {
  bg: '#f4f0e6',
  block: '#ebe5d8',
  blockShadow: '#d6cebd',
  roof1: '#f7f3ea',
  roof2: '#e2dac9',
  roof3: '#d9d1c0',
  park: '#cfe9c6',
  tree: '#9ccf8f',
  treeD: '#7fb872',
  water: '#bfe3f5',
  waterD: '#a6d3ec',
  road: '#ffffff',
  roadEdge: '#d9d2c2',
  art: '#ffe08f',
  artEdge: '#f0b94f',
  hwy: '#ffb36b',
  hwyEdge: '#e8863a',
  route: '#5b6cff',
  routeSoft: '#c5caff',
  coral: '#ff6b6b',
  mint: '#4fd1a1',
  ink: '#23233a',
  grey: '#7c8099',
  pink: '#f6c9c0',
  sky: '#cfe2f6',
};

const XS = (i: number) => 200 + 340 * i;
const YS = (j: number) => 160 + 300 * j;
const NI = 11;
const NJ = 7;
const ROAD_V = ['友谊路', '星光大道', '钟楼街', '海湾路', '梧桐路', '滨河大道', '学府路', '集市街', '南湖路', '晨曦大道', '高新路'];
const ROAD_H = ['一号路', '中山路', '解放路', '人民路', '和平路', '建设路', '迎宾路'];

type Grid = {i: number; j: number};
const snap = (uv: [number, number]): Grid => ({i: Math.max(0, Math.min(NI - 1, Math.round((uv[0] * WW - 200) / 340))), j: Math.max(0, Math.min(NJ - 1, Math.round((uv[1] * WH - 160) / 300)))});
const gp = (g: Grid): P => ({x: XS(g.i), y: YS(g.j)});

const gridCorners = (a: Grid, b: Grid): Grid[] => {
  let jm = Math.round((a.j + b.j) / 2);
  if (jm === a.j) jm = a.j + (b.j >= a.j ? 1 : -1);
  jm = Math.max(0, Math.min(NJ - 1, jm));
  let im = Math.round((a.i + b.i) / 2);
  if (im === a.i) im = a.i + (b.i >= a.i ? 1 : -1);
  im = Math.max(0, Math.min(NI - 1, im));
  return [a, {i: a.i, j: jm}, {i: im, j: jm}, {i: im, j: b.j}, b];
};

// ------------------------------------------------------------------ static city
const cityCache = new Map<number, ReactNode>();
const buildCity = (seed: number): ReactNode => {
  const hit = cityCache.get(seed);
  if (hit) return hit;
  const rnd = mulberry32(seed * 977 + 5);
  const out: ReactNode[] = [];
  let key = 0;
  const k = () => key++;
  out.push(<rect key={k()} x={0} y={0} width={WW} height={WH} fill={C.bg} />);
  const labels: {x: number; y: number; t: string; c: string}[] = [];
  const names = ['星光广场', '中央公园', '钟楼', '老城区', '滨河步道', '图书馆', '集市', '体育中心'];
  let ni = 0;
  for (let i = -1; i < NI; i++) {
    for (let j = -1; j < NJ; j++) {
      const x0 = (i < 0 ? -200 : XS(i)) + 40;
      const x1 = (i + 1 >= NI ? WW + 200 : XS(i + 1)) - 40;
      const y0 = (j < 0 ? -200 : YS(j)) + 40;
      const y1 = (j + 1 >= NJ ? WH + 200 : YS(j + 1)) - 40;
      const w = x1 - x0;
      const h = y1 - y0;
      const r = rnd();
      out.push(<rect key={k()} x={x0} y={y0} width={w} height={h} rx={26} fill={C.block} />);
      if (r < 0.17) {
        // park
        out.push(<rect key={k()} x={x0 + 10} y={y0 + 10} width={w - 20} height={h - 20} rx={24} fill={C.park} />);
        const nt = 7 + Math.floor(rnd() * 6);
        for (let t = 0; t < nt; t++) {
          const tx = x0 + 40 + rnd() * (w - 80);
          const ty = y0 + 40 + rnd() * (h - 80);
          const tr = 14 + rnd() * 12;
          out.push(<circle key={k()} cx={tx + 8} cy={ty + 10} r={tr} fill={C.treeD} />);
          out.push(<circle key={k()} cx={tx} cy={ty} r={tr} fill={C.tree} />);
        }
        if (rnd() < 0.5) out.push(<ellipse key={k()} cx={x0 + w / 2} cy={y0 + h / 2} rx={w * 0.2} ry={h * 0.16} fill={C.water} stroke="#ffffff" strokeWidth={8} />);
        if (ni < names.length && rnd() < 0.6) labels.push({x: x0 + w / 2, y: y0 + h / 2, t: names[ni++], c: '#4d8f55'});
      } else if (r < 0.25) {
        // plaza
        out.push(<rect key={k()} x={x0 + 10} y={y0 + 10} width={w - 20} height={h - 20} rx={24} fill="#fbeab6" />);
        out.push(<circle key={k()} cx={x0 + w / 2} cy={y0 + h / 2} r={Math.min(w, h) * 0.26} fill="#ffffff" />);
        out.push(<circle key={k()} cx={x0 + w / 2} cy={y0 + h / 2} r={Math.min(w, h) * 0.17} fill={C.water} />);
        if (ni < names.length && rnd() < 0.7) labels.push({x: x0 + w / 2, y: y0 + h * 0.88, t: names[ni++], c: '#b08a2e'});
      } else {
        // buildings: a 3x2 or 2x2 lot grid
        const cols = rnd() < 0.5 ? 3 : 2;
        const rows = 2;
        const pad = 14;
        const lw = (w - pad * (cols + 1)) / cols;
        const lh = (h - pad * (rows + 1)) / rows;
        for (let cx = 0; cx < cols; cx++) {
          for (let cy = 0; cy < rows; cy++) {
            if (rnd() < 0.1) continue;
            const bx = x0 + pad + cx * (lw + pad);
            const by = y0 + pad + cy * (lh + pad);
            const tall = rnd() < 0.22;
            const off = tall ? 20 : 10;
            const col = tall ? (rnd() < 0.5 ? C.pink : C.sky) : [C.roof1, C.roof2, C.roof3][Math.floor(rnd() * 3)];
            out.push(<rect key={k()} x={bx + off} y={by + off} width={lw} height={lh} rx={8} fill={C.blockShadow} />);
            out.push(<rect key={k()} x={bx} y={by} width={lw} height={lh} rx={8} fill={col} />);
            out.push(<rect key={k()} x={bx + 10} y={by + 10} width={lw * 0.38} height={lh * 0.3} rx={4} fill="rgba(255,255,255,0.55)" />);
          }
        }
      }
    }
  }
  // river
  const riverD = 'M -150 640 C 800 260, 1500 1180, 2300 820 S 3400 1560, 4000 1260';
  out.push(<path key={k()} d={riverD} fill="none" stroke={C.waterD} strokeWidth={270} strokeLinecap="round" />);
  out.push(<path key={k()} d={riverD} fill="none" stroke={C.water} strokeWidth={232} strokeLinecap="round" />);
  out.push(<path key={k()} d={riverD} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={6} strokeDasharray="36 70" transform="translate(0,34)" />);
  out.push(<path key={k()} d={riverD} fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={6} strokeDasharray="24 90" transform="translate(40,-40)" />);
  // roads
  const art = (n: number, arr: number[]) => arr.includes(n);
  for (let i = 0; i < NI; i++) {
    const a = art(i, [2, 5, 8]);
    out.push(<line key={k()} x1={XS(i)} y1={-100} x2={XS(i)} y2={WH + 100} stroke={a ? C.artEdge : C.roadEdge} strokeWidth={a ? 84 : 58} />);
  }
  for (let j = 0; j < NJ; j++) {
    const a = art(j, [1, 3, 5]);
    out.push(<line key={k()} x1={-100} y1={YS(j)} x2={WW + 100} y2={YS(j)} stroke={a ? C.artEdge : C.roadEdge} strokeWidth={a ? 84 : 58} />);
  }
  for (let i = 0; i < NI; i++) {
    const a = art(i, [2, 5, 8]);
    out.push(<line key={k()} x1={XS(i)} y1={-100} x2={XS(i)} y2={WH + 100} stroke={a ? C.art : C.road} strokeWidth={a ? 72 : 46} />);
    if (a) out.push(<line key={k()} x1={XS(i)} y1={-100} x2={XS(i)} y2={WH + 100} stroke="#fff7d6" strokeWidth={5} strokeDasharray="28 28" />);
  }
  for (let j = 0; j < NJ; j++) {
    const a = art(j, [1, 3, 5]);
    out.push(<line key={k()} x1={-100} y1={YS(j)} x2={WW + 100} y2={YS(j)} stroke={a ? C.art : C.road} strokeWidth={a ? 72 : 46} />);
    if (a) out.push(<line key={k()} x1={-100} y1={YS(j)} x2={WW + 100} y2={YS(j)} stroke="#fff7d6" strokeWidth={5} strokeDasharray="28 28" />);
  }
  // elevated highway
  const hwy = 'M -80 1900 C 1200 1700, 2300 760, 4000 560';
  out.push(<path key={k()} d={hwy} fill="none" stroke="rgba(35,35,58,0.14)" strokeWidth={86} transform="translate(0,14)" />);
  out.push(<path key={k()} d={hwy} fill="none" stroke={C.hwyEdge} strokeWidth={86} />);
  out.push(<path key={k()} d={hwy} fill="none" stroke={C.hwy} strokeWidth={70} />);
  out.push(<path key={k()} d={hwy} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="30 30" />);
  // POI dots and labels
  const pois = [
    [XS(1) + 170, YS(2) - 95, C.coral],
    [XS(3) + 170, YS(4) + 120, C.mint],
    [XS(6) + 170, YS(0) + 110, '#6ea8ff'],
    [XS(7) + 170, YS(5) - 100, C.coral],
    [XS(9) + 170, YS(3) + 100, C.mint],
    [XS(4) + 170, YS(1) - 100, '#6ea8ff'],
  ] as const;
  for (const [x, y, c] of pois) {
    out.push(<circle key={k()} cx={x + 4} cy={y + 8} r={26} fill="rgba(35,35,58,0.18)" />);
    out.push(<circle key={k()} cx={x} cy={y} r={26} fill={c} stroke="#fff" strokeWidth={7} />);
    out.push(<circle key={k()} cx={x} cy={y} r={9} fill="#fff" />);
  }
  for (const l of labels) {
    out.push(
      <text key={k()} x={l.x} y={l.y} textAnchor="middle" fontFamily={TITLE_FONT} fontSize={44} fill={l.c} stroke="#ffffff" strokeWidth={9} paintOrder="stroke" strokeLinejoin="round">
        {l.t}
      </text>,
    );
  }
  const node = <g>{out}</g>;
  cityCache.set(seed, node);
  return node;
};

// ------------------------------------------------------------------ route
type FlatRoute = {route: Route; corners: Grid[]; cornerS: number[]};
const buildFlatRoute = (nodes: MapNode[]): FlatRoute => {
  const a = snap(nodes[0].pos);
  const b = snap(nodes[nodes.length - 1].pos);
  const corners = gridCorners(a, b);
  const poly = corners.map(gp);
  const route = resample(roundPoly(poly, 78, 8), 12);
  // arc length at each corner (nearest sample)
  let acc = 0;
  const cornerS = [0];
  for (let c = 1; c < poly.length; c++) {
    acc += Math.hypot(poly[c].x - poly[c - 1].x, poly[c].y - poly[c - 1].y);
    cornerS.push(acc);
  }
  const scale = route.len / acc;
  return {route, corners, cornerS: cornerS.map((s) => s * scale)};
};

const Chevrons: FC<{route: Route; s: number}> = ({route, s}) => {
  const items: ReactNode[] = [];
  for (let d = 90; d < s - 30; d += 110) {
    const p = pointAt(route, d);
    items.push(<path key={d} d="M -9 -13 L 9 0 L -9 13" fill="none" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${p.x},${p.y}) rotate(${(p.ang * 180) / Math.PI})`} />);
  }
  return <>{items}</>;
};

const ringBtn: CSSProperties = {width: 112, height: 112, borderRadius: 56, background: '#fff', boxShadow: '0 10px 0 rgba(35,35,58,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center'};

const Card: FC<{style?: CSSProperties; children?: ReactNode}> = ({style, children}) => (
  <div style={{background: '#ffffff', borderRadius: 40, boxShadow: '0 12px 0 rgba(35,35,58,0.14), 0 0 0 4px rgba(35,35,58,0.05)', boxSizing: 'border-box', ...style}}>{children}</div>
);

const txt = (size: number, color = C.ink, font = TITLE_FONT): CSSProperties => ({fontFamily: font, fontSize: size, lineHeight: `${size * 1.15}px`, color, whiteSpace: 'pre'});

const slide = (f: number, at: number, dx: number, dy: number): CSSProperties => {
  const p = EASE.out(clamp01((f - at) / 18));
  return {transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px)`, opacity: clamp01(p * 2)};
};

export type FlatMapProps = {
  nodes: MapNode[];
  seed?: number;
  frames?: number;
  title?: string;
  startAt?: number;
  legFrames?: number;
  /** Three small route tags under the destination card (text only; colours are fixed). */
  tags?: [string, string, string];
  /** Bottom panel text once arrived / unit labels / status pill. */
  arrivedText?: string;
  minuteUnit?: string;
  kmUnit?: string;
  navText?: string;
  doneText?: string;
};

export const FlatMapJourney: FC<FlatMapProps> = ({nodes, seed = 4, frames = 270, title = '步行导航', startAt = 50, legFrames = 150, tags = ['最快路线', '无拥堵', '少红绿灯'], arrivedText = '已到达', minuteUnit = '分钟', kmUnit = '公里', navText = '导航中', doneText = '完成'}) => {
  const f = useCurrentFrame();
  const fr = buildFlatRoute(nodes);
  const {route, corners, cornerS} = fr;
  const a = gp(corners[0]);
  const b = gp(corners[corners.length - 1]);
  const timing: Timing = {start: startAt, seg: [legFrames], pause: 0};
  const ez = (t: number) => 0.35 * t + 0.65 * (0.5 - Math.cos(Math.PI * t) / 2);
  const travelF = (x: number) => travelAt(x, [0, route.len], timing, ez);
  const tr = travelF(f);
  const endF = tr.endF;
  const posAt = (x: number) => pointAt(route, travelF(x).s);
  const av = posAt(f);
  const fit = fitView([a, b, {x: b.x, y: b.y - 480}, {x: a.x, y: a.y + 120}], 380, 0.8, 40);
  const cfg: CamCfg = {overview: fit, followZ: 1.1, introStart: startAt - 34, introEnd: startAt + 20, outroStart: endF + 52, outroEnd: Math.min(frames - 6, endF + 100), lag: 12, punches: [[endF, 0.1]], endShift: {at: endF + 4, dy: 120}};
  const cam = camAt(f, cfg, (x) => posAt(x));
  const zk = lerp(0.8, 1.05, clamp01((cam.z - 0.5) / 0.7));
  const head = Math.min(route.len, tr.s);
  const done = subPath(route, 0, head);
  const ahead = ptsStr(route.pts);
  // instruction state
  let leg = 0;
  for (let c = 1; c < cornerS.length - 1; c++) if (tr.s >= cornerS[c] - 1) leg = c;
  const nextCorner = cornerS[Math.min(cornerS.length - 1, leg + 1)];
  const toNext = Math.max(0, nextCorner - tr.s);
  const turn = (() => {
    if (leg + 1 >= corners.length - 1) return {dir: 0, text: '即将到达目的地', road: nodes[nodes.length - 1].name};
    const p0 = gp(corners[leg]);
    const p1 = gp(corners[leg + 1]);
    const p2 = gp(corners[leg + 2]);
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
    const vertical = p2.x === p1.x;
    const road = vertical ? ROAD_V[corners[leg + 1].i] : ROAD_H[corners[leg + 1].j];
    return {dir: cross > 0 ? 1 : -1, text: cross > 0 ? '右转进入' : '左转进入', road};
  })();
  const remainM = Math.round(((route.len - tr.s) * 1.15) / 10) * 10;
  const etaMin = Math.max(0, Math.ceil((route.len - tr.s) / 260));
  const arrived = f >= endF;
  const dEnd = f - endF;
  const hop = tr.moving && !arrived ? Math.abs(Math.sin(f * 0.45)) * 12 : Math.abs(Math.sin(f * 0.15)) * 3;
  const pinPop = arrived ? EASE.back(clamp01(dEnd / 14)) : 1;
  const pinVis = clamp01((f - (startAt - 30)) / 10);
  const shake = f >= endF && f < endF + 10;
  void shake;
  const city = buildCity(seed);

  const pin = (x: number, y: number, scale: number, color: string) => (
    <Anchor x={x} y={y} k={zk}>
      <div style={{position: 'absolute', left: -50, top: -14, width: 100, height: 28, borderRadius: '50%', background: 'rgba(35,35,58,0.22)'}} />
      <svg width={120} height={150} viewBox="-60 -140 120 150" style={{position: 'absolute', left: -60, top: -140, overflow: 'visible', transformOrigin: '60px 140px', transform: `scale(${scale})`}}>
        <path d="M0,0 C-24,-36 -44,-56 -44,-84 a44,44 0 1 1 88,0 C44,-56 24,-36 0,0Z" fill="rgba(35,35,58,0.2)" transform="translate(8,8)" />
        <path d="M0,0 C-24,-36 -44,-56 -44,-84 a44,44 0 1 1 88,0 C44,-56 24,-36 0,0Z" fill={color} stroke="#ffffff" strokeWidth={8} strokeLinejoin="round" />
        <circle cx={0} cy={-84} r={17} fill="#ffffff" />
      </svg>
    </Anchor>
  );

  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <World cam={cam}>
        <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0}}>
          {city}
          <polyline points={ahead} fill="none" stroke="#ffffff" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01((f - 10) / 14)} />
          <polyline points={ahead} fill="none" stroke={C.routeSoft} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01((f - 10) / 14)} />
          {done.length > 1 && (
            <>
              <polyline points={ptsStr(done)} fill="none" stroke="#ffffff" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={ptsStr(done)} fill="none" stroke={C.route} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
              <Chevrons route={route} s={head} />
            </>
          )}
        </svg>
        {/* start ring */}
        <Anchor x={a.x} y={a.y} k={zk}>
          <div style={{position: 'absolute', left: -30, top: -30, width: 60, height: 60, borderRadius: 12, background: '#fff', border: `14px solid ${C.route}`, boxSizing: 'border-box', boxShadow: '0 8px 0 rgba(35,35,58,0.2)', transform: `scale(${EASE.back(pinVis)})`}} />
          <div style={{position: 'absolute', left: 44, top: -76, transform: `scale(${EASE.back(clamp01((f - (startAt - 26)) / 12))})`, transformOrigin: '0 100%'}}>
            <Card style={{padding: '10px 26px 14px', borderRadius: 28}}>
              <div style={txt(40, C.ink)}>{nodes[0].name}</div>
            </Card>
          </div>
        </Anchor>
        {pinVis > 0 && pin(b.x, b.y - (arrived ? 130 * EASE.out(clamp01(dEnd / 10)) / cam.z : 0), EASE.back(pinVis) * (arrived ? pinPop : 1), C.coral)}
        <Anchor x={b.x} y={b.y} k={zk}>
          <div style={{position: 'absolute', left: -230, top: -250 - (arrived ? 170 : 0), transform: `scale(${EASE.back(clamp01((f - (startAt - 20)) / 12))})`, transformOrigin: '50% 100%', width: 460, display: 'flex', justifyContent: 'center'}}>
            <Card style={{padding: '12px 30px 16px', borderRadius: 30, textAlign: 'center', border: arrived ? `6px solid ${C.mint}` : undefined}}>
              <div style={txt(44, C.ink)}>{nodes[nodes.length - 1].name}</div>
              {arrived && dEnd > 6 && <div style={{...txt(32, C.grey), opacity: clamp01((dEnd - 6) / 10)}}>{`X: ${nodes[nodes.length - 1].xz[0]}   Z: ${nodes[nodes.length - 1].xz[1]}`}</div>}
            </Card>
          </div>
        </Anchor>
        {/* avatar */}
        {f >= startAt - 34 && (
          <Anchor x={av.x} y={av.y} k={zk * EASE.back(clamp01((f - (startAt - 34)) / 12))}>
            {[0, 1].map((i) => {
              // stepped pixel pulse under the avatar: four squares drifting outward on the diagonals (no ring)
              const t = Math.floor((((f * 1.4 + i * 36) % 72) / 72) * 6) / 6;
              const d = 20 + 90 * t;
              const s = Math.max(8, Math.round((26 * (1 - t)) / 4) * 4);
              return (
                <div key={i}>
                  {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], q) => (
                    <div key={q} style={{position: 'absolute', left: sx * d - s / 2, top: -16 + sy * d * 0.5 - s / 2, width: s, height: s, background: `rgba(91,108,255,${0.7 * (1 - t)})`}} />
                  ))}
                </div>
              );
            })}
            <div style={{position: 'absolute', left: -44, top: -16, width: 88, height: 22, borderRadius: '50%', background: 'rgba(35,35,58,0.25)'}} />
            <div style={{position: 'absolute', left: -52, top: -104 - hop, width: 104, height: 104, borderRadius: 26, background: '#fff', boxShadow: '0 10px 0 rgba(35,35,58,0.22)', padding: 8, boxSizing: 'border-box'}}>
              <div style={{borderRadius: 16, overflow: 'hidden', width: 88, height: 88}}>
                <PlayerFace size={88} />
              </div>
            </div>
            <div style={{position: 'absolute', left: -9, top: -2 - hop * 0.3, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: `18px solid #fff`, transform: 'translateX(-3px)'}} />
          </Anchor>
        )}
        <Pop f={f} at={endF} x={b.x} y={b.y} colors={[C.coral, C.route, C.mint, '#ffd479', '#ffffff']} count={36} speed={18} life={42} ring={420} ringColor={C.route} seed={3} />
        <Pop f={f} at={endF + 5} x={b.x} y={b.y} colors={[C.mint]} count={0} ring={420} ringColor={C.mint} seed={5} />
      </World>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(35,35,58,0.22) 100%)', pointerEvents: 'none'}} />

      {/* search card */}
      <div style={{position: 'absolute', left: 56, top: 52, width: 780, ...slide(f, 4, 0, -200)}}>
        <Card style={{padding: '22px 30px 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div style={{width: 30, height: 30, borderRadius: 15, border: `8px solid ${C.route}`, boxSizing: 'border-box'}} />
            <div style={txt(44)}>{nodes[0].name}</div>
            <div style={{marginLeft: 'auto', padding: '4px 18px 8px', borderRadius: 20, background: '#eef0ff'}}>
              <span style={txt(32, C.route)}>{title}</span>
            </div>
          </div>
          <div style={{marginLeft: 11, height: 26, borderLeft: `6px dotted ${C.routeSoft}`}} />
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div style={{width: 30, height: 30, borderRadius: 15, background: C.coral}} />
            <div style={txt(44)}>{nodes[nodes.length - 1].name}</div>
          </div>
        </Card>
        <div style={{display: 'flex', gap: 14, marginTop: 22, ...slide(f, 10, -160, 0)}}>
          {[
            [tags[0], C.mint],
            [tags[1], C.route],
            [tags[2], '#ffb347'],
          ].map(([t, c]) => (
            <div key={t} style={{background: '#fff', borderRadius: 30, padding: '8px 24px 12px', boxShadow: '0 8px 0 rgba(35,35,58,0.14)', display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: c}} />
              <span style={txt(34)}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* turn card */}
      <div style={{position: 'absolute', left: 56, top: 330, width: 620, ...slide(f, startAt - 20, -300, 0), opacity: arrived ? 0 : undefined}}>
        <Card style={{padding: '18px 26px 22px', display: 'flex', alignItems: 'center', gap: 26, background: C.route}}>
          <div style={{width: 112, height: 112, borderRadius: 28, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={72} height={72} viewBox="-36 -36 72 72" style={{transform: `rotate(${turn.dir * 90}deg)`}}>
              <path d="M0 26 L0 -14 M-18 4 L0 -16 L18 4" fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" transform={turn.dir === 0 ? undefined : `translate(0,2)`} />
            </svg>
          </div>
          <div>
            <div style={txt(56, '#ffffff', BLACK_FONT)}>{`${Math.max(10, Math.round(((toNext * 1.15) / 10)) * 10)} 米`}</div>
            <div style={txt(36, '#dfe3ff')}>{turn.text}</div>
            <div style={txt(40, '#ffffff')}>{turn.road}</div>
          </div>
        </Card>
      </div>

      {/* compass + locate */}
      <div style={{position: 'absolute', right: 56, top: 52, display: 'flex', flexDirection: 'column', gap: 24, ...slide(f, 8, 200, 0)}}>
        <div style={ringBtn}>
          <svg width={64} height={64} viewBox="-32 -32 64 64">
            <path d="M0 -26 L12 4 L0 -2 L-12 4Z" fill={C.coral} />
            <path d="M0 26 L12 -4 L0 2 L-12 -4Z" fill="#c9cde0" />
          </svg>
        </div>
        <div style={ringBtn}>
          <div style={{width: 40, height: 40, borderRadius: 20, border: `8px solid ${C.route}`, boxSizing: 'border-box', position: 'relative'}}>
            <div style={{position: 'absolute', left: 8, top: 8, width: 8, height: 8, borderRadius: 4, background: C.route}} />
          </div>
        </div>
        <div style={{...ringBtn, flexDirection: 'column', gap: 18}}>
          <div style={{width: 36, height: 8, background: C.ink, borderRadius: 4, position: 'relative'}}>
            <div style={{position: 'absolute', left: 14, top: -14, width: 8, height: 36, background: C.ink, borderRadius: 4}} />
          </div>
        </div>
      </div>

      {/* bottom sheet */}
      <div style={{position: 'absolute', left: 400, right: 400, bottom: 52, ...slide(f, 14, 0, 260)}}>
        <Card style={{padding: '26px 40px 30px', borderRadius: 52, border: arrived ? `6px solid ${C.mint}` : undefined}}>
          <div style={{position: 'relative', height: 16, borderRadius: 8, background: '#e9ebf5', marginBottom: 22}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${tr.trip * 100}%`, borderRadius: 8, background: arrived ? C.mint : C.route}} />
            <div style={{position: 'absolute', left: `${tr.trip * 100}%`, top: -10, width: 36, height: 36, marginLeft: -18, borderRadius: 18, background: '#fff', border: `8px solid ${arrived ? C.mint : C.route}`, boxSizing: 'border-box'}} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              {arrived ? (
                <>
                  <div style={txt(64, '#1f9d75', BLACK_FONT)}>{arrivedText}</div>
                  <div style={txt(36, C.grey)}>{nodes[nodes.length - 1].name}</div>
                </>
              ) : (
                <>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 12}}>
                    <span style={txt(76, C.ink, BLACK_FONT)}>{etaMin}</span>
                    <span style={txt(40, C.ink)}>{minuteUnit}</span>
                    <span style={{...txt(40, C.grey), marginLeft: 20}}>{`${(remainM / 1000).toFixed(1)} ${kmUnit}`}</span>
                  </div>
                </>
              )}
            </div>
            <div style={{padding: '12px 44px 18px', borderRadius: 44, background: arrived ? C.mint : C.route, boxShadow: `0 10px 0 ${arrived ? '#2fa882' : '#3b49cf'}`, transform: arrived ? `scale(${1 + 0.1 * Math.max(0, Math.sin(Math.min(1, dEnd / 14) * Math.PI))})` : undefined}}>
              <span style={txt(46, '#fff')}>{arrived ? doneText : navText}</span>
            </div>
          </div>
        </Card>
      </div>

      {f >= endF && f < endF + 8 && <AbsoluteFill style={{background: '#ffffff', opacity: 0.5 * (1 - (f - endF) / 8)}} />}
      <Sfx at={startAt - 34} src={mcSound('random/pop')} volume={0.4} />
      <Sfx at={endF} src={mcSound('random/levelup')} volume={0.4} />
      <Sfx at={endF + 4} src={mcSound('ui/toast/in')} volume={0.35} />
    </AbsoluteFill>
  );
};
