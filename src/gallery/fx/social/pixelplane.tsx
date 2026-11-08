import {type FC} from 'react';
import {FLAT, RAINBOW, type Sprite} from '../../flat';
import {INK, Sp, lerp} from './common';

/**
 * Pixel paper plane + pixel-grid rainbow ribbon used by soc-share.
 * The plane is a 22 x 15 sprite pointing right (rasterised from three polygons, so it stays crisp pixel art).
 * The ribbon is emitted from the plane's tail every (sub)frame: each sample stamps six bands side by side across
 * the path normal, every grid cell keeps the band whose centre is nearest, so the bands are exactly parallel and
 * flush and follow the real flight path. Older cells dither away; an ink outline wraps the whole ribbon.
 */

/** Rasterise filled polygons (cell-centre test) into sprite rows. Later polygons paint over earlier ones. */
const rasterPlane = (w: number, h: number, polys: {ch: string; pts: [number, number][]}[], lines: {ch: string; a: [number, number]; b: [number, number]}[]): string[] => {
  const grid = Array.from({length: h}, () => Array<string>(w).fill('.'));
  const inside = (px: number, py: number, pts: [number, number][]) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  polys.forEach((p) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x + 0.5, y + 0.5, p.pts)) grid[y][x] = p.ch;
  });
  lines.forEach((l) => {
    const n = Math.ceil(Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]) * 2);
    for (let i = 0; i <= n; i++) {
      const x = Math.floor(lerp(l.a[0], l.b[0], i / n));
      const y = Math.floor(lerp(l.a[1], l.b[1], i / n));
      if (grid[y]?.[x] && grid[y][x] !== '.') grid[y][x] = l.ch;
    }
  });
  return grid.map((r) => r.join(''));
};

export const PLANE: Sprite = {
  rows: rasterPlane(
    22,
    15,
    [
      {ch: 'W', pts: [[1, 2], [21.5, 7.5], [7, 8.6]]},
      {ch: 'B', pts: [[21.5, 7.5], [7, 8.6], [4.6, 13.6]]},
      {ch: 'b', pts: [[7, 8.6], [4.6, 13.6], [9.8, 10.6]]},
    ],
    [{ch: 'c', a: [21, 7.6], b: [7, 8.7]}],
  ),
  palette: {W: '#ffffff', B: '#bfe0ff', b: '#8fc2f5', c: '#6fa8dc'},
};

/** Cells from the sprite centre back to the plane's tail (the ribbon starts there). */
export const PLANE_TAIL = 8;

export const PlaneSp: FC<{px: number; drop?: number}> = ({px, drop = 1}) => <Sp s={PLANE} k="plane" px={px} drop={drop} />;

export type TailFn = (tt: number) => {x: number; y: number; hd: number};

export const Ribbon: FC<{f: number; launchAt: number; land: number; tailAt: TailFn; cell?: number; life?: number}> = ({f, launchAt, land, tailAt, cell = 14, life = 24}) => {
  const P = cell;
  const tEnd = Math.min(f, land - 1);
  if (f < launchAt || tEnd < launchAt) return null;
  const cells = new Map<string, {x: number; y: number; band: number; d: number; age: number}>();
  const steps = life * 4;
  for (let s = 0; s <= steps; s++) {
    const tt = tEnd - s / 4;
    if (tt < launchAt) break;
    const age = (f - tt) / life;
    if (age >= 1) break;
    const c = tailAt(tt);
    const nx = -Math.sin(c.hd);
    const ny = Math.cos(c.hd);
    for (let i = 0; i < 6; i++) {
      const off = (i - 2.5) * P;
      const px = c.x + nx * off;
      const py = c.y + ny * off;
      const cx = Math.floor(px / P);
      const cy = Math.floor(py / P);
      const d = Math.hypot((cx + 0.5) * P - px, (cy + 0.5) * P - py);
      const key = `${cx},${cy}`;
      const old = cells.get(key);
      if (!old || d < old.d) cells.set(key, {x: cx, y: cy, band: i, d, age});
    }
  }
  // dither the old end away: a cell survives while its hash is above age^2.2
  const list = [...cells.values()].filter((c) => {
    const h = (((c.x * 73856093) ^ (c.y * 19349663)) >>> 0) % 1000;
    return h / 1000 >= Math.pow(c.age, 2.2);
  });
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      {list.map((c) => (
        <div key={`o${c.x},${c.y}`} style={{position: 'absolute', left: c.x * P - 4, top: c.y * P - 4, width: P + 8, height: P + 8, background: INK}} />
      ))}
      {list.map((c) => (
        <div key={`c${c.x},${c.y}`} style={{position: 'absolute', left: c.x * P, top: c.y * P, width: P + 0.5, height: P + 0.5, background: RAINBOW[c.band]}} />
      ))}
    </div>
  );
};

void FLAT;
