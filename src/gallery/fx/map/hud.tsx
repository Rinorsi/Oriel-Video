import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {PixelSprite, type Sprite} from '../../flat';
import {item, block} from '../../../mc/assets';
import {PIXEL_FONT} from '../../../mc/fonts';
import {EASE, clamp01} from '../../../mc/theme';
import {OreChip, OreProgress, OreText, TYPE} from '../../../mg/Ore';
import {GOLD, ICONS, INK, MAPINK, PARCH, PARCH_D, PARCH_L, PixelLabel, parchBox} from './art';
import {psOf} from './parts';
import {ptsStr, type MapNode, type P, type Route} from './engine';
import {WH, WW} from './mapgen';

/**
 * Screen-space map furniture: wooden frame with a cartographer's checker band, corner studs, title plate,
 * compass rose, legend, minimap, live coordinates and a trip progress bar.
 */

export const FRAME_T = 52;

export const enter = (f: number, at: number, dx: number, dy: number, dur = 16): CSSProperties => {
  const p = EASE.out(clamp01((f - at) / dur));
  return {transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px)`, opacity: clamp01(p * 2.2)};
};

const plank = (): CSSProperties => ({backgroundImage: `url(${block('dark_oak_planks')})`, backgroundSize: '64px 64px', imageRendering: 'pixelated'});

/** Wooden frame + checker band + studs. Draws over the map edges. */
export const MapFrame: FC<{f: number}> = ({f}) => {
  const T = FRAME_T;
  const W = 36; // wood
  const band = 16;
  const checkH = `repeating-linear-gradient(90deg, ${INK} 0 28px, ${PARCH_L} 28px 56px)`;
  const checkV = `repeating-linear-gradient(180deg, ${INK} 0 28px, ${PARCH_L} 28px 56px)`;
  const wood = (style: CSSProperties) => <div style={{position: 'absolute', ...plank(), boxShadow: 'inset 0 0 0 100px rgba(30,16,6,0.28)', ...style}} />;
  const stud = (x: number, y: number, s = 28) => (
    <div key={`${x}-${y}`} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, backgroundImage: `url(${block('gold_block')})`, backgroundSize: `${s}px ${s}px`, imageRendering: 'pixelated', border: `4px solid ${INK}`, boxSizing: 'border-box', boxShadow: `0 4px 0 rgba(0,0,0,0.4)`}} />
  );
  const studs: ReactNode[] = [];
  for (let x = 240; x < 1920; x += 240) studs.push(stud(x, W / 2), stud(x, 1080 - W / 2));
  for (let y = 270; y < 1080; y += 270) studs.push(stud(W / 2, y), stud(1920 - W / 2, y));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* inner shading so the map feels recessed */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${120}px rgba(60,30,8,0.55), inset 0 0 0 ${T}px rgba(0,0,0,0)`}} />
      {wood({left: 0, top: 0, width: 1920, height: W})}
      {wood({left: 0, top: 1080 - W, width: 1920, height: W})}
      {wood({left: 0, top: 0, width: W, height: 1080})}
      {wood({left: 1920 - W, top: 0, width: W, height: 1080})}
      {/* bevel lines on the wood */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, boxShadow: `inset 0 0 0 6px ${INK}, inset 0 0 0 10px #a77a46`, boxSizing: 'border-box'}} />
      {/* checker band */}
      <div style={{position: 'absolute', left: W, top: W, width: 1920 - 2 * W, height: band, background: checkH}} />
      <div style={{position: 'absolute', left: W, top: 1080 - W - band, width: 1920 - 2 * W, height: band, background: checkH}} />
      <div style={{position: 'absolute', left: W, top: W + band, width: band, height: 1080 - 2 * W - 2 * band, background: checkV}} />
      <div style={{position: 'absolute', left: 1920 - W - band, top: W + band, width: band, height: 1080 - 2 * W - 2 * band, background: checkV}} />
      <div style={{position: 'absolute', left: W - 4, top: W - 4, width: 1920 - 2 * W + 8, height: 1080 - 2 * W + 8, border: `4px solid ${INK}`, boxSizing: 'border-box'}} />
      <div style={{position: 'absolute', left: T - 2, top: T - 2, width: 1920 - 2 * T + 4, height: 1080 - 2 * T + 4, border: `4px solid ${INK}`, boxSizing: 'border-box'}} />
      {studs}
      {/* corner ornaments */}
      {[
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([cx, cy]) => {
        const x = cx ? 1920 - 78 : 0;
        const y = cy ? 1080 - 78 : 0;
        return (
          <div key={`${cx}${cy}`} style={{position: 'absolute', left: x, top: y, width: 78, height: 78, ...plank(), boxShadow: `inset 0 0 0 100px rgba(30,16,6,0.1), inset 0 0 0 5px ${INK}, inset 0 0 0 9px #c79a5a, 0 6px 0 rgba(0,0,0,0.35)`}}>
            <div style={{position: 'absolute', left: 17, top: 17, width: 44, height: 44, backgroundImage: `url(${block('gold_block')})`, backgroundSize: '44px 44px', imageRendering: 'pixelated', border: `5px solid ${INK}`, boxSizing: 'border-box', transform: 'rotate(45deg) scale(0.86)'}} />
            <div style={{position: 'absolute', left: 33, top: 33, width: 12, height: 12, background: '#ff4d5e', border: `3px solid ${INK}`, boxSizing: 'border-box', transform: 'rotate(45deg)'}} />
          </div>
        );
      })}
      <div style={{position: 'absolute', inset: 0, opacity: 0.0}}>{f}</div>
    </AbsoluteFill>
  );
};

/** Title plate (top-left). */
export const TitlePlate: FC<{f: number; at?: number; title: string; sub?: string}> = ({f, at = 4, title, sub}) => (
  <div style={{position: 'absolute', left: 84, top: 78, ...enter(f, at, -200, 0), ...parchBox({fill: PARCH, border: 6, shadow: 8}), padding: '12px 26px 16px 18px', display: 'flex', alignItems: 'center', gap: 18}}>
    <Img src={item('filled_map')} style={{width: 64, height: 64, imageRendering: 'pixelated'}} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      <PixelLabel size={48} color={INK}>{title}</PixelLabel>
      {sub && <PixelLabel size={32} color="#8a6a3d">{sub}</PixelLabel>}
    </div>
  </div>
);

const ROSE = (() => {
  const n = 29;
  const c = 14;
  const rows: string[] = [];
  for (let y = 0; y < n; y++) {
    let r = '';
    for (let x = 0; x < n; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      let ch = '.';
      if (d <= 14.2) ch = d > 12.4 ? 'K' : d > 11.2 ? 'G' : d > 10.4 ? 'K' : 'P';
      if (d <= 10.4) {
        const spoke = (a: number, b: number, L: number) => {
          // a: along the spoke (positive towards the tip), b: across
          if (a <= 0 || a > L) return false;
          return Math.abs(b) <= (1 - a / L) * 2.6 + 0.2;
        };
        if (spoke(-dy, dx, 10)) ch = dx < 0 ? 'R' : 'r';
        else if (spoke(dy, dx, 10)) ch = dx < 0 ? 'L' : 'l';
        else if (spoke(dx, dy, 10)) ch = dy < 0 ? 'L' : 'l';
        else if (spoke(-dx, dy, 10)) ch = dy < 0 ? 'L' : 'l';
        else if (spoke((-dy + dx) / 1.414, (dx + dy) / 1.414, 7) || spoke((-dy - dx) / 1.414, (dx - dy) / 1.414, 7) || spoke((dy + dx) / 1.414, (dx - dy) / 1.414, 7) || spoke((dy - dx) / 1.414, (dx + dy) / 1.414, 7)) ch = 'g';
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) ch = 'W';
      }
      r += ch;
    }
    rows.push(r);
  }
  return {rows, palette: {K: INK, G: GOLD, P: PARCH_L, R: '#ff5a4d', r: '#b3282a', L: '#f0e4c4', l: '#8a7a5a', g: '#b8a470', W: '#ffd23f'}} as Sprite;
})();

export const Compass: FC<{f: number; at?: number; size?: number}> = ({f, at = 10, size = 8}) => {
  const rot = Math.sin(f * 0.05) * 5;
  const total = 29 * size;
  return (
    <div style={{position: 'absolute', right: 84, top: 74, width: total, height: total, ...enter(f, at, 160, 0), filter: 'drop-shadow(0 8px 0 rgba(40,24,10,0.5))'}}>
      <div style={{transform: `rotate(${rot}deg)`}}>
        <PixelSprite sprite={ROSE} px={size} />
      </div>
      <PixelLabel size={36} color="#fff" style={{position: 'absolute', left: total / 2 - 14, top: -4, textShadow: `3px 3px 0 ${INK}, -3px -3px 0 ${INK}, 3px -3px 0 ${INK}, -3px 3px 0 ${INK}`}}>N</PixelLabel>
    </div>
  );
};

const LegendRow: FC<{sprite?: Sprite; px?: number; swatch?: ReactNode; label: string}> = ({sprite, px = 5, swatch, label}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, height: 46}}>
    <div style={{width: 62, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{sprite ? <PixelSprite sprite={sprite} px={px} outline={INK} /> : swatch}</div>
    <PixelLabel size={32} color={INK}>{label}</PixelLabel>
  </div>
);

export const Legend: FC<{f: number; at?: number; km?: number}> = ({f, at = 14}) => (
  <div style={{position: 'absolute', left: 84, bottom: 84, ...enter(f, at, -220, 0), ...parchBox({fill: PARCH, border: 6, shadow: 8}), padding: '12px 22px 14px 14px', width: 292}}>
    <PixelLabel size={32} color="#8a6a3d" style={{display: 'block', marginBottom: 4}}>── 图 例 ──</PixelLabel>
    <LegendRow sprite={ICONS.house} px={6} label="村庄" />
    <LegendRow sprite={ICONS.pine} px={7} label="森林" />
    <LegendRow sprite={ICONS.peak} px={5} label="山脉" />
    <LegendRow
      swatch={
        <svg width={56} height={20}>
          <polyline points="0,10 12,4 24,10 36,16 48,10 56,6" fill="none" stroke={INK} strokeWidth={13} />
          <polyline points="0,10 12,4 24,10 36,16 48,10 56,6" fill="none" stroke="#5fa8d0" strokeWidth={7} />
        </svg>
      }
      label="河流"
    />
    <LegendRow
      swatch={
        <svg width={56} height={20}>
          <line x1={0} y1={10} x2={56} y2={10} stroke={INK} strokeWidth={14} strokeDasharray="14 10" />
          <line x1={0} y1={10} x2={56} y2={10} stroke="#c43c33" strokeWidth={8} strokeDasharray="12 12" strokeDashoffset={-1} />
        </svg>
      }
      label="路线"
    />
    <div style={{marginTop: 6, display: 'flex', alignItems: 'center', gap: 8}}>
      <div style={{width: 120, height: 14, border: `4px solid ${INK}`, boxSizing: 'border-box', background: `repeating-linear-gradient(90deg, ${INK} 0 30px, ${PARCH_L} 30px 60px)`}} />
      <PixelLabel size={32} color={INK}>500 格</PixelLabel>
    </div>
  </div>
);

export const MiniMap: FC<{f: number; at?: number; mapUrl: string; route: Route; start: P; end: P; avatar: P; view: {cx: number; cy: number; z: number}; reveal?: number}> = ({f, at = 18, mapUrl, route, start, end, avatar, view, reveal = 1}) => {
  const w = 336;
  const h = 189;
  const k = w / WW;
  const vw = 1920 / view.z;
  const vh = 1080 / view.z;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{position: 'absolute', right: 84, bottom: 84, ...enter(f, at, 220, 0), width: w + 24, height: h + 24, ...parchBox({fill: PARCH_D, border: 6, shadow: 8}), padding: 6}}>
      <div style={{position: 'relative', width: w + 0, height: h, border: `4px solid ${INK}`, boxSizing: 'content-box', overflow: 'hidden', marginLeft: 2, marginTop: 2}}>
        <Img src={mapUrl} style={{width: w, height: h, imageRendering: 'pixelated'}} />
        <svg width={w} height={h} viewBox={`0 0 ${WW} ${WH}`} style={{position: 'absolute', left: 0, top: 0}}>
          <polyline points={ptsStr(route.pts)} fill="none" stroke={INK} strokeWidth={34} strokeDasharray="60 50" strokeOpacity={0.9 * reveal} />
          <polyline points={ptsStr(route.pts)} fill="none" stroke="#ff5a4d" strokeWidth={22} strokeDasharray="60 50" strokeOpacity={reveal} />
          <rect x={start.x - 26} y={start.y - 26} width={52} height={52} fill="#fff" stroke={INK} strokeWidth={12} />
          <rect x={end.x - 26} y={end.y - 26} width={52} height={52} fill={GOLD} stroke={INK} strokeWidth={12} />
          <rect x={view.cx - vw / 2} y={view.cy - vh / 2} width={vw} height={vh} fill="rgba(255,255,255,0.14)" stroke="#fff" strokeWidth={12} />
          <circle cx={avatar.x} cy={avatar.y} r={blink ? 46 : 34} fill="#ff3b3b" stroke="#fff" strokeWidth={14} />
        </svg>
      </div>
      <div style={{position: 'absolute', left: 14, top: -34}}>
        <PixelLabel size={32} color="#fff" style={{textShadow: `3px 3px 0 ${INK}, -3px -3px 0 ${INK}, 3px -3px 0 ${INK}, -3px 3px 0 ${INK}`}}>总览</PixelLabel>
      </div>
    </div>
  );
};

export const CoordsHud: FC<{f: number; at?: number; x: number; z: number; dist: number; bottom?: number; top?: number; left?: number; column?: boolean}> = ({f, at = 12, x, z, dist, bottom = 206, top, left = 560, column}) => (
  <div style={{position: 'absolute', left, ...(top !== undefined ? {top} : {bottom}), display: 'flex', flexDirection: column ? 'column' : 'row', gap: 16, alignItems: 'flex-start', ...enter(f, at, column ? -200 : 0, column ? 0 : 160)}}>
    <OreChip color="#fff" dot="#55ffff" style={{height: 60, padding: '0 20px'}}>
      <OreText size={TYPE.small} color="#fff" shadow>{`X: ${Math.round(x)}   Z: ${Math.round(z)}`}</OreText>
    </OreChip>
    <OreChip color="#fff" dot="#f8af2b" style={{height: 60, padding: '0 20px'}}>
      <OreText size={TYPE.small} color="#fff" shadow>{`里程: ${Math.round(dist)} 格`}</OreText>
    </OreChip>
  </div>
);

export const TripBar: FC<{f: number; at?: number; trip: number; nodes: MapNode[]; nodeFrac: number[]; reached: number; label?: string}> = ({f, at = 20, trip, nodes, nodeFrac, reached, label = '旅程进度'}) => {
  const width = 780;
  const inner = width - 16;
  return (
    <div style={{position: 'absolute', left: 960 - width / 2 - 10, bottom: 84, ...enter(f, at, 0, 160), width: width + 20, ...parchBox({fill: PARCH, border: 6, shadow: 8}), padding: '8px 14px 14px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 40}}>
        <PixelLabel size={32} color={INK}>{label}</PixelLabel>
        <PixelLabel size={32} color="#b3282a">{`${Math.round(trip * 100)}%`}</PixelLabel>
      </div>
      <div style={{position: 'relative', marginTop: 4}}>
        <OreProgress value={trip} width={width - 20} color="green" />
        {nodes.map((n, i) => {
          const x = 8 + nodeFrac[i] * (inner - 20);
          const on = i <= reached;
          return (
            <div key={i} style={{position: 'absolute', left: x, top: -10, width: 28, height: 28, background: on ? GOLD : '#8c8d90', border: `5px solid ${INK}`, boxSizing: 'border-box', transform: `rotate(45deg) scale(${on ? 1 : 0.85})`, boxShadow: on ? '0 0 0 3px rgba(255,255,255,0.7)' : undefined}} />
          );
        })}
      </div>
    </div>
  );
};

export const MAP_SCALE_PS = psOf;
void MAPINK;
