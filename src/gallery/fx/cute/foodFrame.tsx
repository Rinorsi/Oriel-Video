import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {FLAT} from '../../flat';
import type {TransitionDef} from '../../../reel/transitions';
import {transitionEntry} from '../../transition';
import {Img} from 'remotion';
import {item} from '../../../mc/assets';
import {At, Checker, W, H, INK, hash, outBack, outCubic, inOutCubic, seg} from './kit';
import {Chips, Flare, GridFlash} from './impact';

/**
 * cute-food-frame: a red-and-cream picnic cloth closes in from the screen edges like a picture frame, and as its edge
 * passes each grid cell a round plate with a watermelon / pumpkin / carrot / apple pops onto it - so the plates form
 * rectangular rings that tighten toward the middle. When the screen is full it jiggles, then the hole opens again
 * from the centre and the plates pop away ring by ring.
 * Cut-type: closed by t=18, B swaps in at t=22, opens t=28..50.
 * Tunables: COLS / ROWS / S (plate grid), CLOTH_A / CLOTH_B (cloth colours), FOODS (sprites on the plates).
 */

const T = 56;
const COLS = 12;
const ROWS = 7;
const S = 160;
const Y0 = -20;
const CX = W / 2;
const CY = H / 2;
const CLOTH_A = '#ff6b6b';
const CLOTH_B = '#fff4d6';
const FOODS = ['apple', 'carrot', 'melon_slice', 'pumpkin_pie', 'golden_apple', 'bread', 'cookie', 'baked_potato'].map((n) => item(n));
const PLATES = [FLAT.pink, FLAT.yellow, FLAT.mint, FLAT.sky, FLAT.lilac, '#ffd9b0'];

/** Rounded-rectangle polygon points (CSS px strings). */
const rrect = (cx: number, cy: number, hw: number, hh: number, r: number) => {
  const rr = Math.min(r, hw, hh);
  const pts: string[] = [];
  const corners: [number, number, number][] = [
    [cx + hw - rr, cy - hh + rr, -90],
    [cx + hw - rr, cy + hh - rr, 0],
    [cx - hw + rr, cy + hh - rr, 90],
    [cx - hw + rr, cy - hh + rr, 180],
  ];
  for (const [x, y, a0] of corners) {
    for (let k = 0; k <= 6; k++) {
      const a = ((a0 + (k / 6) * 90) * Math.PI) / 180;
      pts.push(`${(x + Math.cos(a) * rr).toFixed(1)}px ${(y + Math.sin(a) * rr).toFixed(1)}px`);
    }
  }
  return pts.join(',') + ',' + pts[0];
};

const closure = (t: number) => {
  if (t < 28) return inOutCubic(seg(t, 0, 18));
  return 1 - inOutCubic(seg(t, 28, 50));
};

const Overlay: FC<{p: number}> = ({p}) => {
  const t = p * T;
  const c = Math.min(1.03, closure(t));
  const hw = Math.max(0, (W / 2) * (1 - c));
  const hh = Math.max(0, (H / 2) * (1 - c));
  const hole = hw > 2 && hh > 2;
  const outer = `-10px -10px,${W + 10}px -10px,${W + 10}px ${H + 10}px,-10px ${H + 10}px,-10px -10px`;
  const beat = t >= 18 && t < 28 ? Math.abs(Math.sin((t - 18) * 0.62)) : 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, clipPath: hole ? `polygon(evenodd, ${outer},${rrect(CX, CY, hw, hh, 70)},-10px -10px)` : undefined}}>
        <Checker a={CLOTH_A} b={CLOTH_B} size={90} x={t * 1.5} y={t * 1.5} />
        <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 0 rgba(0,0,0,0)'}} />
      </div>
      {hole && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible', zIndex: 2}}>
          <rect x={CX - hw} y={CY - hh} width={hw * 2} height={hh * 2} rx={Math.min(70, hw, hh)} fill="none" stroke={INK} strokeWidth={26} />
          <rect x={CX - hw + 4} y={CY - hh + 4} width={Math.max(0, hw * 2 - 8)} height={Math.max(0, hh * 2 - 8)} rx={Math.min(66, hw, hh)} fill="none" stroke="#ffffff" strokeWidth={8} />
        </svg>
      )}
      {Array.from({length: COLS * ROWS}, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = col * S + S / 2;
        const y = Y0 + row * S + S / 2;
        const depth = Math.max(Math.abs(x - CX) - hw, Math.abs(y - CY) - hh);
        const s = outBack(Math.max(0, Math.min(1, depth / 140)), 2.2);
        if (s <= 0.01) return null;
        const food = FOODS[(col * 3 + row * 5) % FOODS.length];
        const jig = 1 + 0.05 * beat * Math.sin(i * 2.1 + t) ;
        const rot = (1 - Math.min(1, s)) * 50 * (i % 2 ? 1 : -1) + Math.sin(t * 0.25 + i) * 3;
        return (
          <At key={i} x={x} y={y} s={s * jig} rot={rot} z={3}>
            <div style={{width: 138, height: 138, borderRadius: '50%', background: PLATES[(col + row) % PLATES.length], boxShadow: `0 0 0 7px ${INK}, 0 11px 0 7px ${INK}, inset 0 10px 0 rgba(255,255,255,0.55), inset 0 -12px 0 rgba(43,35,56,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Img src={food} style={{width: 96, height: 96, imageRendering: 'pixelated', filter: `drop-shadow(4px 0 0 ${INK}) drop-shadow(-4px 0 0 ${INK}) drop-shadow(0 4px 0 ${INK}) drop-shadow(0 -4px 0 ${INK})`}} />
            </div>
          </At>
        );
      })}
      {/* table full: a diagonal flicker across the plates and a flare at the centre; then the plates scatter as chips when the hole opens */}
      <GridFlash t={t} at={18} cell={160} dur={5} reach={7} peak={0.55} origin={[0, 0]} seed={4} z={30} />
      <Flare t={t} at={19} x={CX} y={CY} color="#fff4d6" maxR={760} life={16} cell={12} rays={14} seed={112} z={31} />
      <Chips t={t} at={19} x={CX} y={CY} count={26} seed={113} colors={[FLAT.red, FLAT.yellow, FLAT.green, '#ffffff', FLAT.orange]} life={26} speed={[700, 1700]} gravity={1300} size={[1, 3]} z={32} />
      <Chips t={t} at={30} x={CX} y={CY} count={30} seed={114} colors={[FLAT.red, FLAT.yellow, FLAT.green, '#ffffff', FLAT.orange]} life={28} speed={[800, 1900]} gravity={1500} size={[1, 3]} z={32} />
    </AbsoluteFill>
  );
};

export const foodFrameDef: TransitionDef & {mode: 'cut'} = {
  id: 'cute-food-frame',
  name: '水果拼盘',
  frames: T,
  mode: 'cut',
  b: (p) => ({transform: `scale(${1 + 0.06 * (1 - seg(p * T, 28, 52, outCubic))})`}),
  overlay: Overlay,
  cues: [
    {at: 3, src: 'mc:random/pop', volume: 0.35, rate: 1.0},
    {at: 6, src: 'mc:random/pop', volume: 0.35, rate: 1.1},
    {at: 9, src: 'mc:random/pop', volume: 0.35, rate: 1.2},
    {at: 12, src: 'mc:random/pop', volume: 0.35, rate: 1.3},
    {at: 15, src: 'mc:random/pop', volume: 0.35, rate: 1.4},
    {at: 18, src: 'mc:random/orb', volume: 0.4, rate: 1.0},
    {at: 31, src: 'mc:random/levelup', volume: 0.25, rate: 1.4},
    {at: 34, src: 'mc:random/pop', volume: 0.4, rate: 1.3},
    {at: 38, src: 'mc:random/pop', volume: 0.4, rate: 1.5},
    {at: 42, src: 'mc:random/pop', volume: 0.35, rate: 1.7},
  ],
};

export const foodFrameEntry = transitionEntry(foodFrameDef, {
  id: 'cute-food-frame',
  name: '水果拼盘',
  category: 'cute',
  tags: ['可爱', '水果', '食物', '西瓜', '南瓜', '萝卜', '野餐', '转场', '像素'],
  blurb: '红白格野餐布像相框一样从四周向中间合拢，每个盘子随布边扫过依次蹦出原版贴图的苹果、胡萝卜、西瓜片、南瓜派、面包，一圈圈向中心收紧；画面铺满后抖一抖，再从中心打开，盘子一圈圈弹走。',
  usage: '美食/农场/生存做饭段落，或者想要“摆盘 → 开饭”式节奏的转场。',
  params: [
    {name: 'COLS / ROWS / S', desc: '盘子网格（默认 12×7、间距 160）'},
    {name: 'CLOTH_A / CLOTH_B', desc: '桌布两种颜色'},
    {name: 'FOODS', desc: '盘子里的食物物品贴图列表（item(id)）'},
  ],
});
void hash;
