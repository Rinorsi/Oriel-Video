// Small geometry helpers shared by the kit (polygons for hexagons, diamonds, chamfers, hearts).
export type Pt = [number, number];

/** Offsets a simple polygon inward by `d` (negative = outward) with mitered corners. Works for concave shapes. */
export const insetPoly = (pts: Pt[], d: number): Pt[] => {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  const sgn = area > 0 ? 1 : -1;
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * sgn;
    const ny = (dx / len) * sgn;
    return {px: p[0] + nx * d, py: p[1] + ny * d, dx, dy};
  });
  return pts.map((_, i) => {
    const a = lines[(i - 1 + n) % n];
    const b = lines[i];
    const den = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(den) < 1e-9) return [b.px, b.py] as Pt;
    const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / den;
    return [a.px + a.dx * t, a.py + a.dy * t] as Pt;
  });
};

export const ptsStr = (pts: Pt[]) => pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

/** CSS clip-path polygon() from points in px. */
export const clipOf = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(',')})`;

/** Pointy-top regular hexagon inside a w x h box (h defaults to the regular height). */
export const hexPts = (w: number, h = (w * 2) / Math.sqrt(3)): Pt[] => [
  [w / 2, 0],
  [w, h * 0.25],
  [w, h * 0.75],
  [w / 2, h],
  [0, h * 0.75],
  [0, h * 0.25],
];

/** Diamond (square rotated 45 degrees) with half-diagonal r centred at (r, r). */
export const diamondPts = (r: number): Pt[] => [
  [r, 0],
  [2 * r, r],
  [r, 2 * r],
  [0, r],
];

/** Rectangle with independent 45 degree chamfers [tl, tr, br, bl]. */
export const chamferPts = (w: number, h: number, c: [number, number, number, number]): Pt[] => {
  const [tl, tr, br, bl] = c;
  const out: Pt[] = [];
  out.push(tl ? [tl, 0] : [0, 0]);
  if (tr) out.push([w - tr, 0], [w, tr]);
  else out.push([w, 0]);
  if (br) out.push([w, h - br], [w - br, h]);
  else out.push([w, h]);
  if (bl) out.push([bl, h], [0, h - bl]);
  else out.push([0, h]);
  if (tl) out.push([0, tl]);
  return out;
};

/** The big HUD heart (measured from hud-strip-controller.png): flat-topped lobes, short vertical flanks, V bottom. 203 x 157 design box. */
export const HEART_PTS: Pt[] = [
  [0, 38],
  [36, 0],
  [66, 0],
  [101, 34],
  [137, 0],
  [167, 0],
  [203, 38],
  [203, 88],
  [101, 157],
  [0, 88],
];
