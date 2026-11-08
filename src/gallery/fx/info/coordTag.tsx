import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {PixelBurst} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE} from '../../../mg/Ore';
import {mcSound} from '../../../reel/kit';
import {Bolt, Icon, PX, Shine, Slab, Sparkles, Stage, W, back, pr, spring, Sfx} from './ui';

/**
 * Coordinate tags (transparent overlay): a pointer tag planted on a spot of the picture.
 * A stepped pixel ping flashes at the point, a stem grows, the tag pops with a jelly bounce, X/Y/Z count up, then it floats gently.
 * A compass strip at the top shows where the tags are. At the end every tag folds back into its pin.
 * Props: tags = [{x, y (screen point it points at), name, xyz: [X, Y, Z], color, at (start frame), dist?, icon?}],
 *   compass (show the top compass strip, default true), compassLabels ([west, north, east] letters), frames (total length; tags fold back during the last 22).
 */

export const COORD_FRAMES = 200;

export type CoordSpec = {x: number; y: number; name: string; xyz: [number, number, number]; color: string; at: number; dist?: string; icon?: 'pin' | 'skull' | 'bolt' | 'trophy'};

const TAGS: CoordSpec[] = [
  {x: 380, y: 840, name: '雪原村庄', xyz: [128, 64, -240], color: '#f8af2b', at: 10, dist: '328 m', icon: 'pin'},
  {x: 1000, y: 780, name: '地下钻石矿', xyz: [-512, -54, 96], color: '#55ffff', at: 34, dist: '1.2 km', icon: 'trophy'},
  {x: 1560, y: 520, name: '下界传送门', xyz: [20, 71, 4], color: '#d58bff', at: 58, dist: '64 m', icon: 'bolt'},
];

const AXIS = [
  {k: 'X', c: '#ff5555'},
  {k: 'Y', c: '#55ff55'},
  {k: 'Z', c: '#5588ff'},
];

const Compass: FC<{f: number; tags: CoordSpec[]; out: number; labels: [string, string, string]}> = ({f, tags, out, labels}) => {
  const inP = back(pr(f, 0, 14, (t) => t));
  const SW = 1240;
  return (
    <div style={{position: 'absolute', left: (W - SW) / 2, top: 36, width: SW, height: 84, transform: `translateY(${(1 - Math.min(1, inP)) * -160 - out * 160}px)`}}>
      <Slab w={SW} h={84} tone="panel_glass" shadow={8}>
        <div style={{position: 'absolute', left: 16, right: 16, top: 14, bottom: 14, overflow: 'hidden', background: '#0c0c0e', boxShadow: 'inset 0 4px 0 #000'}}>
          <div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0 4px, transparent 4px 40px)', backgroundPosition: `${-f * 0.6}px 0`, backgroundSize: '40px 100%'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 4px, transparent 4px 160px)', backgroundPosition: `${-f * 0.6}px 0`, backgroundSize: '160px 100%', opacity: 0.8}} />
        </div>
        {[[labels[0], 0.18], [labels[1], 0.5], [labels[2], 0.82]].map(([c, x]) => (
          <div key={String(c)} style={{position: 'absolute', left: Number(x) * SW - 20, top: 18}}>
            <PX size={48} color={ORE.dim} shadow="rgba(0,0,0,0.8)">{String(c)}</PX>
          </div>
        ))}
        {tags.map((t, i) => {
          const e = back(pr(f, t.at + 4, 10, (v) => v));
          return (
            <div key={i} style={{position: 'absolute', left: (t.x / W) * (SW - 100) + 30, top: 10, transform: `scale(${e})`}}>
              <div style={{width: 24, height: 24, background: t.color, boxShadow: '0 0 0 4px #000', transform: 'rotate(45deg)'}} />
            </div>
          );
        })}
        <div style={{position: 'absolute', left: SW / 2 - 12, top: -8, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '16px solid #f8af2b'}} />
      </Slab>
    </div>
  );
};

const Tag: FC<{t: CoordSpec; f: number; out: number}> = ({t, f, out}) => {
  const a = f - t.at;
  if (a < 0) return null;
  const TW = 600;
  const TH = 200;
  const stemGrow = EASE.out(clamp01((a - 4) / 10));
  const pop = spring(clamp01((a - 10) / 22), 8, 4.5);
  const float = Math.sin(a / 10) * 8 * clamp01((a - 30) / 10);
  const SH = 130 * stemGrow + float;
  const retract = EASE.in(out);
  const tagS = pop * (1 - retract);
  const left = Math.max(20, Math.min(W - TW - 20, t.x - TW / 2));
  const ptrX = t.x - left;
  const panelBottom = t.y - SH * (1 - retract);
  const roll = pr(a, 14, 16);
  const Ico = t.icon ?? 'pin';
  return (
    <>
      {/* ground ping */}
      {[0, 1].map((k) => {
        // stepped pixel ping on the ground: four squares slide outwards along the diagonals (no ring)
        const rt = Math.floor((((a + k * 20) % 40) / 40) * 5) / 5;
        const o = 24 + 110 * rt;
        const sq = Math.max(8, Math.round((28 * (1 - rt)) / 4) * 4);
        return (
          <div key={k} style={{opacity: (1 - rt) * (1 - retract) * clamp01(a / 3)}}>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], q) => (
              <div key={q} style={{position: 'absolute', left: t.x + sx * o - sq / 2, top: t.y + sy * o * 0.45 - sq / 2, width: sq, height: sq, background: t.color, boxShadow: '0 0 0 4px #000'}} />
            ))}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: t.x - 40, top: t.y - 22, width: 80, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', transform: `scale(${(1 - retract) * clamp01(a / 4)})`}} />
      {/* stem */}
      <div style={{position: 'absolute', left: t.x - 6, top: panelBottom, width: 12, height: Math.max(0, t.y - panelBottom - 8), background: `repeating-linear-gradient(180deg, ${t.color} 0 16px, #000 16px 20px)`, boxShadow: '0 0 0 4px #000', opacity: 1 - retract * 0.5}} />
      <div style={{position: 'absolute', left: t.x - 20, top: t.y - 28 - 12 * (1 - retract), width: 40, height: 40, background: t.color, boxShadow: `0 0 0 4px #000, inset 0 -8px 0 rgba(0,0,0,0.3), inset 0 8px 0 rgba(255,255,255,0.4)`, transform: `rotate(45deg) scale(${(1 + 0.2 * Math.sin(a / 5)) * clamp01(a / 4) * (1 - retract)})`}} />
      {/* tag */}
      <div style={{position: 'absolute', left, top: panelBottom - TH - 26, width: TW, height: TH + 26, transform: `scale(${tagS})`, transformOrigin: `${ptrX}px ${TH + 26}px`, opacity: tagS > 0 ? 1 : 0}}>
        <Slab w={TW} h={TH} tone="panel_raised" shadow={10}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 76, background: 'rgba(0,0,0,0.35)'}} />
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: t.color, boxShadow: '0 0 0 4px #000'}} />
          <div style={{position: 'absolute', left: 36, top: 8, display: 'flex', alignItems: 'center', gap: 16}}>
            <Icon name={Ico} px={5} outline="#000" />
            <PX size={60} color={t.color} shadow="rgba(0,0,0,0.7)">{t.name}</PX>
          </div>
          <div style={{position: 'absolute', left: 36, right: 20, top: 92, display: 'flex', gap: 12}}>
            {AXIS.map((ax, i) => (
              <div key={ax.k} style={{display: 'flex', alignItems: 'center', height: 76, background: '#0c0c0e', boxShadow: '0 0 0 4px #000', flex: 1}}>
                <div style={{width: 48, height: '100%', background: ax.c, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 6px 0 rgba(255,255,255,0.4), inset 0 -6px 0 rgba(0,0,0,0.3)'}}>
                  <PX size={36} color="#fff" shadow="rgba(0,0,0,0.5)">{ax.k}</PX>
                </div>
                <div style={{flex: 1, textAlign: 'center'}}>
                  <PX size={48} color="#fff">{String(Math.round(t.xyz[i] * roll))}</PX>
                </div>
              </div>
            ))}
          </div>
          {t.dist && (
            <div style={{position: 'absolute', right: 20, top: 14, opacity: pr(a, 22, 8)}}>
              <PX size={36} color={ORE.dim}>{t.dist}</PX>
            </div>
          )}
          <Bolt x={TW - 14} y={TH - 14} s={12} />
          <Shine p={pr(a, 24, 22, (v) => v)} />
        </Slab>
        {/* pointer */}
        <div style={{position: 'absolute', left: ptrX - 36, top: TH - 4, width: 72, height: 38, background: '#000', clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}} />
        <div style={{position: 'absolute', left: ptrX - 28, top: TH - 4, width: 56, height: 28, background: '#313233', clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}} />
        <div style={{position: 'absolute', left: ptrX - 28, top: TH - 8, width: 56, height: 8, background: '#313233'}} />
      </div>
      <PixelBurst x={t.x} y={t.y} at={t.at + 4} count={18} colors={[t.color, '#fff']} speed={12} life={22} size={10} gravity={0.2} seed={t.at} />
      <Sparkles x={left} y={panelBottom - TH - 60} w={TW} h={TH + 60} count={3} seed={t.at + 2} px={4} color="#ffffff" at={t.at + 20} />
      <Sfx at={t.at + 2} src={mcSound('random/click')} volume={0.3} rate={0.8} />
      <Sfx at={t.at + 12} src={mcSound('random/pop')} volume={0.4} rate={1.1} />
      <Sfx at={t.at + 16} src={mcSound('random/orb')} volume={0.2} rate={1.4} />
    </>
  );
};

export const CoordTags: FC<{bg?: boolean; tags?: CoordSpec[]; compass?: boolean; compassLabels?: [string, string, string]; frames?: number}> = ({bg, tags = TAGS, compass = true, compassLabels = ['西', '北', '东'], frames = COORD_FRAMES}) => {
  const f = useCurrentFrame();
  const N = frames;
  const out = pr(f, N - 22, 18, (t) => t);
  return (
    <Stage bg={bg}>
      {compass && <Compass f={f} tags={tags} out={out} labels={compassLabels} />}
      {tags.map((t, i) => (
        <Tag key={i} t={t} f={f} out={clamp01(out * 1.4 - i * 0.12)} />
      ))}
      <Sfx at={N - 22} src={mcSound('ui/toast/out')} volume={0.25} />
    </Stage>
  );
};
