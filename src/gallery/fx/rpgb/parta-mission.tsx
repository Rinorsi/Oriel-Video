import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import {C, Dust, Embers, FantasyTitle, GoldFrame, Gloom, Icon, Label, MOBS, Mob, Parchment, PxStar, RARITY_COL, Torch, center, lerp, prog, snap, type MobSprite} from './kit';

/**
 * rpg-mission-select (this file) and rpg-mission-complete (see parta-complete.tsx).
 *   MissionSelect props: bg, title (mission name), sub, stars, power, rewards (3 items with rarity).
 * A parchment world map on a dark oak table: islands drawn on a 24px cell grid from seeded value noise, mission nodes
 * (real mob heads in gold frames) light up one by one while a dashed route extends, the chosen node swells and a
 * mission card (difficulty, recommended power, rewards) opens from it.
 */

export const MISSION_SELECT_FRAMES = 190;

// ---------------------------------------------------------------- map generation

const GW = 74;
const GH = 41;
const CELL = 24;
const MX = 80; // map left on screen
const MY = 60;

const hash = (i: number, j: number, s: number) => mulberry32((Math.imul(i + 1000, 73856093) ^ Math.imul(j + 1000, 19349663) ^ Math.imul(s, 83492791)) >>> 0)();
const smooth = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, y: number, s: number) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = smooth(x - i);
  const fy = smooth(y - j);
  const a = hash(i, j, s);
  const b = hash(i + 1, j, s);
  const c = hash(i, j + 1, s);
  const d = hash(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

type Cell = 'sea' | 'shore' | 'land' | 'hill';
const buildMap = (seed: number) => {
  const grid: Cell[][] = [];
  const elev: number[][] = [];
  for (let y = 0; y < GH; y++) {
    const row: Cell[] = [];
    const er: number[] = [];
    for (let x = 0; x < GW; x++) {
      const nx = (x / (GW - 1) - 0.5) * 2;
      const ny = (y / (GH - 1) - 0.5) * 2;
      const edge = Math.max(Math.abs(nx) * 0.9, Math.abs(ny) * 1.05);
      const n = vnoise(x * 0.11, y * 0.13, seed) * 0.62 + vnoise(x * 0.3, y * 0.3, seed + 7) * 0.28 + 0.1 * vnoise(x * 0.7, y * 0.7, seed + 3);
      const e = n - Math.pow(edge, 3.2) * 0.55;
      er.push(e);
      row.push(e < 0.33 ? 'sea' : e > 0.6 ? 'hill' : 'land');
    }
    grid.push(row);
    elev.push(er);
  }
  // shore = land cell touching sea
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      if (grid[y][x] === 'sea') continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (grid[y + dy]?.[x + dx] ?? 'sea') === 'sea');
      if (nb) grid[y][x] = 'shore';
    }
  return {grid, elev};
};

const MAP = buildMap(11);

/** Row-run-length encoded rects of one cell type -> few divs. */
const runs = (type: Cell) => {
  const out: {x: number; y: number; w: number}[] = [];
  MAP.grid.forEach((row, y) => {
    let x = 0;
    while (x < GW) {
      if (row[x] === type) {
        let e = x;
        while (e < GW && row[e] === type) e++;
        out.push({x, y, w: e - x});
        x = e;
      } else x++;
    }
  });
  return out;
};
const SEA = runs('sea');
const SHORE = runs('shore');
const HILL = runs('hill');

const TREE = ['..GG..', '.GGGG.', 'GGgGGG', '.GGgG.', '..tt..', '..tt..'];
const MOUNT = ['....XX....', '...XXXX...', '..XXWXXX..', '.XXWWXXXX.', 'XXXXXXXXXX', 'XXdXXXXdXX'];
const Sprite: FC<{rows: string[]; pal: Record<string, string>; px: number; x: number; y: number; o?: number}> = ({rows, pal, px, x, y, o = 1}) => (
  <svg width={rows[0].length * px} height={rows.length * px} shapeRendering="crispEdges" style={{position: 'absolute', left: x, top: y, opacity: o}}>
    {rows.flatMap((r, j) => [...r].map((c, i) => (c === '.' ? null : <rect key={`${i}-${j}`} x={i * px} y={j * px} width={px} height={px} fill={pal[c]} />)))}
  </svg>
);

/** The painted world map (static): parchment, sea wash, shore ink line, hills, trees, mountains. */
const WorldMap: FC<{avoid: [number, number][]}> = ({avoid}) => {
  const r = mulberry32(5);
  const feats: {kind: 'tree' | 'mount'; x: number; y: number}[] = [];
  for (let i = 0; i < 260 && feats.length < 70; i++) {
    const gx = 2 + Math.floor(r() * (GW - 4));
    const gy = 2 + Math.floor(r() * (GH - 5));
    const c = MAP.grid[gy][gx];
    if (c === 'sea' || c === 'shore') continue;
    const sx = MX + gx * CELL;
    const sy = MY + gy * CELL;
    if (avoid.some(([ax, ay]) => Math.hypot(ax - sx, ay - sy) < 110)) continue;
    if (feats.some((f) => Math.hypot(f.x - sx, f.y - sy) < 56)) continue;
    feats.push({kind: c === 'hill' ? 'mount' : 'tree', x: sx, y: sy});
  }
  return (
    <div style={{position: 'absolute', left: MX, top: MY, width: GW * CELL, height: GH * CELL}}>
      <Parchment w={GW * CELL} h={GH * CELL} seed={8} style={{boxShadow: 'none'}}>
        <div style={{position: 'absolute', inset: 0}}>
          {SEA.map((s, i) => (
            <div key={i} style={{position: 'absolute', left: s.x * CELL, top: s.y * CELL, width: s.w * CELL, height: CELL, background: (s.x + s.y) % 2 ? 'rgba(36,66,86,0.78)' : 'rgba(42,74,92,0.74)'}} />
          ))}
          {SHORE.map((s, i) => (
            <div key={i} style={{position: 'absolute', left: s.x * CELL, top: s.y * CELL, width: s.w * CELL, height: CELL, background: 'rgba(120,84,40,0.35)', boxShadow: 'inset 0 0 0 4px rgba(70,42,14,0.55)'}} />
          ))}
          {HILL.map((s, i) => (
            <div key={i} style={{position: 'absolute', left: s.x * CELL, top: s.y * CELL, width: s.w * CELL, height: CELL, background: 'rgba(110,80,44,0.3)'}} />
          ))}
        </div>
        {feats.map((f, i) =>
          f.kind === 'tree' ? (
            <Sprite key={i} rows={TREE} pal={{G: '#3f6a30', g: '#2c4d22', t: '#5a3a1c'}} px={6} x={f.x - MX} y={f.y - MY} o={0.85} />
          ) : (
            <Sprite key={i} rows={MOUNT} pal={{X: '#7c6648', W: '#e6dcc4', d: '#4d3b24'}} px={6} x={f.x - MX - 12} y={f.y - MY - 6} o={0.9} />
          ),
        )}
      </Parchment>
    </div>
  );
};

// ---------------------------------------------------------------- nodes

const headOf = (name: string): MobSprite => {
  const m = MOBS[name];
  const h = [...m.parts].reverse().find((p) => p.y === 0 && p.rect[2] >= 6 && p.rect[3] >= 6)!;
  const extra = m.parts.filter((p) => p !== h && p.y > 0 && p.y < 8 && p.rect[3] <= 4 && p.x >= h.x - 1 && p.x <= h.x + 4);
  return {w: h.rect[2], h: h.rect[3], parts: [{...h, x: 0, y: 0}, ...extra.map((p) => ({...p, x: p.x - h.x, y: p.y - h.y}))]};
};

type NodeDef = {x: number; y: number; mob: string; name: string; state: 'cleared' | 'open' | 'locked'};
const NODES: NodeDef[] = [
  {x: 250, y: 830, mob: 'zombie', name: '荒村', state: 'cleared'},
  {x: 450, y: 700, mob: 'skeleton', name: '枯骨矿道', state: 'cleared'},
  {x: 300, y: 470, mob: 'creeper', name: '炸裂峡谷', state: 'cleared'},
  {x: 560, y: 330, mob: 'pillager', name: '前哨据点', state: 'cleared'},
  {x: 740, y: 580, mob: 'witherSkeleton', name: '亡者沼泽', state: 'open'},
  {x: 960, y: 760, mob: 'piglin', name: '猪灵要塞', state: 'locked'},
  {x: 1180, y: 360, mob: 'husk', name: '沙海遗迹', state: 'locked'},
  {x: 1440, y: 700, mob: 'enderman', name: '终界裂隙', state: 'locked'},
  {x: 1680, y: 400, mob: 'wither', name: '王座', state: 'locked'},
];
const SEL = 4;

const NodeIcon: FC<{n: NodeDef; k: number; sel: number; dim: number}> = ({n, k, sel, dim}) => {
  const f = useCurrentFrame();
  const s = (k <= 0 ? 0 : EASE.back(clamp01(k))) * (1 + sel * 0.32);
  const pulse = sel > 0 ? 0.5 + 0.5 * Math.sin(f / 5) : 0;
  const rarity = n.state === 'open' ? C.unique : n.state === 'cleared' ? C.gold2 : '#7a7a7a';
  return (
    <div style={{position: 'absolute', left: n.x - 60, top: n.y - 60, width: 120, height: 120, transform: `scale(${s})`, opacity: dim, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: n.state === 'locked' ? 'grayscale(0.9) brightness(0.7)' : undefined}}>
      {sel > 0 && <div style={{position: 'absolute', inset: -18 - pulse * 6, boxShadow: `0 0 0 6px ${C.unique}`, opacity: 0.9}} />}
      <div style={{width: 112, height: 112, boxSizing: 'border-box', background: '#17110c', border: `8px solid ${rarity}`, boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 4px ${C.ink}, 0 10px 0 4px rgba(0,0,0,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Mob mob={headOf(n.mob)} scale={n.mob === 'wither' ? 9 : 8} />
      </div>
      {n.state === 'cleared' && (
        <div style={{position: 'absolute', right: -14, top: -14, width: 40, height: 40, background: '#3c8527', boxShadow: `0 0 0 4px ${C.ink}, inset 4px 4px 0 #6cc349`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={24} height={20} shapeRendering="crispEdges">
            {[[0, 8], [4, 12], [8, 16], [12, 12], [16, 8], [20, 4]].map(([x, y]) => (
              <rect key={x} x={x} y={y - 4} width={4} height={8} fill="#fff" />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

const NodeLabel: FC<{n: NodeDef; k: number; dim: number}> = ({n, k, dim}) => (
  <div style={{position: 'absolute', left: n.x - 140, width: 280, top: n.y + 70, display: 'flex', justifyContent: 'center', opacity: clamp01(k * 2) * dim}}>
    <div style={{padding: '4px 14px', background: 'rgba(24,14,6,0.88)', boxShadow: `0 0 0 4px ${C.gold0}`}}>
      <Label size={36} color={n.state === 'locked' ? '#9a948a' : C.parch2}>
        {n.name}
      </Label>
    </div>
  </div>
);

/** Dashed route as square dots along a polyline, revealed up to arc length `len`. */
const Route: FC<{pts: [number, number][]; reveal: number; color: string; dot?: number; gap?: number}> = ({pts, reveal, color, dot = 16, gap = 40}) => {
  const out: ReactNode[] = [];
  let acc = 0;
  let k = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, y1 - y0);
    // slight bend: route wiggles so it reads as a trail, not a ruler
    const nx = -(y1 - y0) / L;
    const ny = (x1 - x0) / L;
    for (let d = 0; d < L; d += gap) {
      if (acc + d > reveal) return <>{out}</>;
      const t = d / L;
      const bend = Math.sin(t * Math.PI) * 26 * (i % 2 ? -1 : 1);
      out.push(<div key={k++} style={{position: 'absolute', left: snap(x0 + (x1 - x0) * t + nx * bend - dot / 2, 2), top: snap(y0 + (y1 - y0) * t + ny * bend - dot / 2, 2), width: dot, height: dot, background: color, boxShadow: `0 0 0 3px rgba(20,10,4,0.75)`}} />);
    }
    acc += L;
  }
  return <>{out}</>;
};

const segLen = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export type Reward = {id: string; rarity: 'common' | 'rare' | 'unique'; label: string};

const Button: FC<{children: string; w?: number; k?: number}> = ({children, w = 380, k = 1}) => (
  <div style={{width: w, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(180deg, #ffe08a 0%, ${C.gold2} 50%, ${C.gold1} 100%)`, boxShadow: `0 0 0 6px ${C.ink}, inset 0 6px 0 #fff3c4, inset 0 -8px 0 ${C.gold0}, 0 12px 0 6px rgba(0,0,0,0.45)`, transform: `scale(${1 + 0.04 * Math.sin(k * 20)})`}}>
    <Label size={48} color="#2a1604" shadow={false}>
      {children}
    </Label>
  </div>
);

export const MissionSelect: FC<{bg?: boolean; title?: string; sub?: string; stars?: number; power?: number; rewards?: Reward[]}> = ({
  bg,
  title = '亡者沼泽',
  sub = '任务 5 · 肃清祭坛',
  stars = 4,
  power = 180,
  rewards = [
    {id: 'emerald', rarity: 'common', label: '翡翠'},
    {id: 'enchanted_book', rarity: 'rare', label: '稀有'},
    {id: 'diamond_sword', rarity: 'unique', label: '独特'},
  ],
}) => {
  const f = useCurrentFrame();
  const open = prog(f, 0, 22, EASE.out);
  const zoom = lerp(0.94, 1.02, prog(f, 0, 190, (t) => t));
  // node timeline: appears at 24 + i*13; the route to it extends before
  const nodeAt = (i: number) => 24 + i * 9;
  const route = NODES.map((n) => [n.x, n.y] as [number, number]);
  const lens = route.slice(1).map((p, i) => segLen(route[i], p));
  const total = lens.reduce((a, b) => a + b, 0);
  const routeK = prog(f, 28, nodeAt(8) - 24, (t) => t);
  const selK = prog(f, 116, 14, EASE.back);
  const dimOthers = 1 - 0.55 * prog(f, 116, 12);
  const cardK = prog(f, 130, 20, EASE.back);
  const cardIn = cardK;
  const cardX = 1040;
  const cardY = 80;
  const sel = NODES[SEL];
  const originX = sel.x - cardX;
  const originY = sel.y - cardY;
  return (
    <AbsoluteFill style={{background: bg ? '#0a0604' : undefined, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '38% 52%'}}>
        {bg && (
          <>
            {/* oak table + brass corners */}
            <AbsoluteFill style={{backgroundImage: `linear-gradient(rgba(20,10,4,0.55), rgba(20,10,4,0.55)), url(${block('dark_oak_planks')})`, backgroundSize: '100% 100%, 128px 128px', imageRendering: 'pixelated'}} />
            <div style={{position: 'absolute', left: MX - 14, top: MY - 14, width: GW * CELL + 28, height: GH * CELL + 28, background: C.ink, boxShadow: `0 20px 0 rgba(0,0,0,0.5), 0 0 0 6px ${C.gold1}`, clipPath: `inset(${(1 - open) * 50}% ${(1 - open) * 50}% ${(1 - open) * 50}% ${(1 - open) * 50}%)`}} />
          </>
        )}
        <div style={{clipPath: `inset(${(1 - open) * 50}% ${(1 - open) * 50}% ${(1 - open) * 50}% ${(1 - open) * 50}%)`, position: 'absolute', inset: 0}}>
          {bg && (
            <div style={{position: 'absolute', inset: 0, filter: 'brightness(0.84) sepia(0.12)'}}>
              <WorldMap avoid={NODES.map((n) => [n.x, n.y])} />
            </div>
          )}
          {/* compass + legend fill the lower left / title cartouche fills the upper left */}
          {bg && (
            <>
              <div style={{position: 'absolute', left: 130, top: 110, opacity: prog(f, 16, 12)}}>
                <div style={{padding: '8px 22px', background: 'rgba(24,14,6,0.92)', boxShadow: `0 0 0 4px ${C.gold1}, 0 0 0 8px ${C.ink}`}}>
                  <Label size={48} color={C.parch2} style={{letterSpacing: 8}}>
                    暮 光 群 岛
                  </Label>
                </div>
              </div>
              <div style={{position: 'absolute', left: 1130, top: 840, width: 0}} />
              <div style={{position: 'absolute', left: 120, top: 880, opacity: 0.9}}>
                <Icon id="compass_16" size={128} style={{filter: 'drop-shadow(5px 6px 0 rgba(0,0,0,0.35))'}} />
              </div>
            </>
          )}
          {/* route: cleared part in gold, upcoming in faded ink */}
          <Route pts={route.slice(0, 5)} reveal={routeK * total} color={C.gold2} />
          <Route pts={route.slice(4)} reveal={Math.max(0, routeK * total - lens.slice(0, 4).reduce((a, b) => a + b, 0))} color="rgba(52,28,10,0.8)" />
          {NODES.map((n, i) => {
            const k = prog(f, nodeAt(i), 12, (t) => t);
            const isSel = i === SEL;
            return <NodeIcon key={i} n={n} k={k} sel={isSel ? selK : 0} dim={isSel ? 1 : dimOthers} />;
          })}
          {NODES.map((n, i) => (
            <NodeLabel key={i} n={n} k={prog(f, nodeAt(i) + 4, 10, (t) => t)} dim={i === SEL ? 1 : dimOthers} />
          ))}
        </div>
        {/* mission card opens from the selected node */}
        {cardK > 0 && (
          <div style={{position: 'absolute', left: cardX, top: cardY, transformOrigin: `${originX}px ${originY}px`, transform: `scale(${cardIn})`, opacity: clamp01(cardK * 3)}}>
            <GoldFrame w={720} h={920} rim={14} glow="rgba(255,181,49,0.35)">
              <div style={{position: 'absolute', inset: 0, padding: '28px 54px 40px', display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                  <FantasyTitle size={104}>{title}</FantasyTitle>
                  <Label size={36} color={C.parch2} style={{letterSpacing: 6}}>
                    {sub}
                  </Label>
                </div>
                <div style={{height: 6, marginTop: 24, background: C.gold1, boxShadow: `0 6px 0 ${C.ink}`}} />
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 34, opacity: prog(f, 136, 8)}}>
                  <Label size={48} color={C.parch2}>
                    难度
                  </Label>
                  <div style={{display: 'flex', gap: 12}}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <PxStar key={i} size={58} on={i < stars && f >= 138 + i * 4} />
                    ))}
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, opacity: prog(f, 142, 8)}}>
                  <Label size={48} color={C.parch2}>
                    推荐战力
                  </Label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                    <Icon id="iron_sword" size={64} />
                    <Label size={72} color={C.unique}>
                      {String(Math.round(power * prog(f, 144, 18)))}
                    </Label>
                  </div>
                </div>
                <div style={{height: 4, marginTop: 30, background: 'rgba(242,184,64,0.4)'}} />
                <div style={{marginTop: 22, opacity: prog(f, 150, 8)}}>
                  <Label size={48} color={C.parch2}>
                    任务奖励
                  </Label>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 22, padding: '0 16px'}}>
                  {rewards.map((r, i) => {
                    const k = prog(f, 154 + i * 7, 10, EASE.back);
                    const col = RARITY_COL[r.rarity];
                    return (
                      <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transform: `scale(${k})`, opacity: k > 0 ? 1 : 0}}>
                        <div style={{width: 128, height: 128, boxSizing: 'border-box', background: `radial-gradient(circle, ${col}33 0%, #120d08 75%)`, border: `8px solid ${col}`, boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 4px ${C.ink}${r.rarity === 'unique' ? `, 0 0 36px ${col}88` : ''}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <Icon id={r.id} size={80} />
                        </div>
                        <Label size={36} color={col}>
                          {r.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                <div style={{flex: 1}} />
                <div style={{display: 'flex', justifyContent: 'center', opacity: prog(f, 170, 8)}}>
                  <Button k={f}>出 发</Button>
                </div>
              </div>
            </GoldFrame>
          </div>
        )}
        {bg && (
          <>
            <Embers box={[60, 940, 900, 100]} count={10} seed={21} rise={200} size={6} />
            <Dust box={[80, 60, 1760, 960]} count={14} seed={22} opacity={0.3} fall={25} />
          </>
        )}
      </div>
      {bg && (
        <>
          {/* table-edge torches: left and right of the map, light the corners */}
          <Torch x={40} y={170} scale={9} lit={1} seed={4} />
          <Torch x={1880} y={170} scale={9} lit={1} seed={5} />
          <Torch x={40} y={760} scale={9} lit={1} seed={6} />
          <Torch x={1880} y={760} scale={9} lit={1} seed={7} />
          {[[60, 160], [1860, 160], [60, 780], [1860, 780]].map(([x, y], i) => (
            <AbsoluteFill key={i} style={{mixBlendMode: 'screen', opacity: 0.55 + 0.15 * Math.sin(f * 0.7 + i * 2), background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,150,50,0.5) 0px, rgba(190,90,25,0.18) 260px, rgba(0,0,0,0) 620px)`}} />
          ))}
          <Gloom s={0.75} />
        </>
      )}
      <Sfx at={4} src={mcSound('item/armor/equip_netherite1')} volume={0.25} rate={1.3} />
      {NODES.map((_, i) => (
        <Sfx key={i} at={nodeAt(i)} src={mcSound('random/click')} volume={0.4} rate={0.9 + i * 0.1} />
      ))}
      <Sfx at={112} src={mcSound('random/anvil_land')} volume={0.28} rate={1.2} />
      <Sfx at={126} src={mcSound('ui/toast/in')} volume={0.5} />
      <Sfx at={154} src={mcSound('random/orb')} volume={0.3} />
      <Sfx at={161} src={mcSound('random/orb')} volume={0.3} rate={1.15} />
      <Sfx at={168} src={mcSound('random/levelup')} volume={0.3} />
    </AbsoluteFill>
  );
};
