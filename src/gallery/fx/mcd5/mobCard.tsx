// mcd-v-mob-card: creature / boss intro card. A red-outlined black silhouette is "locked on" by corner brackets, then the real
// Minecraft texture is revealed bottom-up in hard steps; a chamfered card slides in with tag, hard-shadow name, hexagon stat gauges
// (health / damage / speed fill from the bottom) and weakness item slots. Optional boss health bar across the top.
// Props: mob ('creeper'|'zombie'|'husk'|'skeleton'|'wither_skeleton'|'enderman'), name, en, kind, desc, stats [{label, value, ratio, icon}],
//        weak (item ids), boss (draw the top health bar), biome, bg.
import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {item as itemTex, tex} from '../../../mc/assets';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {Crop} from '../../mob';
import {BevelSlot, CutPanel, Embers, HexBadge, ItemIcon3D, MCD, McdText, PxArt, PxChars, PxText, SKULL_ROWS, WhiteFlash, hexPts, insetPoly, ptsStr} from '../mcdkit/kit';
import {BOLT_ROWS, Burst, CrossFlash, GlowWash, GoldRule, HEART_PX, Label, Pop, PxIcon, Rise, SWORD_ROWS, SceneBg, stepQ, win, type BiomeId} from './common';

export type MobId = 'creeper' | 'zombie' | 'husk' | 'skeleton' | 'wither_skeleton' | 'enderman';

type Rect = [number, number, number, number];

/**
 * Real vanilla models built from the entity texture: every body part is a real box (w x h x d texels) whose faces are cropped by the
 * standard Java UV layout (front (u+d,v+d,w,h), side (u,v+d,d,h) / (u+d+w,v+d,d,h), top (u+d,v,w,d)) and assembled in CSS 3D with the
 * true part sizes and offsets, seen from a slight 3/4 angle like the game does. Textures are always whole-number nearest-neighbour.
 * fig: w/h = on-screen bounding box in texels (3/4 view), th = true model height in texels.
 */
const FIG: Record<MobId, {w: number; h: number; th: number}> = {
  creeper: {w: 13, h: 28, th: 26}, // head 8x8x8, body 8x12x4, 4 legs 4x6x4 (front pair z+4, rear pair z-4)
  zombie: {w: 20, h: 33, th: 32}, // head 8, body 8x12x4, arms 4x12x4 (raised), legs 4x12x4
  husk: {w: 20, h: 33, th: 32},
  skeleton: {w: 12, h: 33, th: 32}, // arms/legs 2x12x2
  wither_skeleton: {w: 12, h: 33, th: 32},
  enderman: {w: 12, h: 47, th: 46}, // body 8x12x4, arms/legs 2x30x2
};

type Part = {size: [number, number, number]; uv: [number, number]; x: number; y: number; z?: number; raise?: number; head?: boolean};

const YAW = 30;
const PITCH = -11;

const Box3D: FC<{src: string; sheet: [number, number]; part: Part; s: number; eyesSrc?: string; eyes?: number}> = ({src, sheet, part, s, eyesSrc, eyes = 1}) => {
  const [w, h, d] = part.size;
  const [u, v] = part.uv;
  const W = w * s;
  const H = h * s;
  const D = d * s;
  const face = (key: string, rect: Rect, css: CSSProperties, shade: number, withEyes = false) => (
    <Crop key={key} src={src} sheet={sheet} rect={rect} scale={s} style={{position: 'absolute', backfaceVisibility: 'hidden', filter: shade === 1 ? undefined : `brightness(${shade})`, ...css}}>
      {withEyes && eyesSrc && (
        <Crop src={eyesSrc} sheet={sheet} rect={rect} scale={s} style={{position: 'absolute', left: 0, top: 0, opacity: eyes, filter: `drop-shadow(0 0 ${s * 1.2}px #d27bff) brightness(1.4)`}} />
      )}
    </Crop>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformStyle: 'preserve-3d'}}>
      {face('f', [u + d, v + d, w, h], {left: 0, top: 0, transform: `translateZ(${D / 2}px)`}, 1, part.head)}
      {face('b', [u + 2 * d + w, v + d, w, h], {left: 0, top: 0, transform: `translateZ(${-D / 2}px) rotateY(180deg)`}, 0.6)}
      {face('l', [u, v + d, d, h], {left: (W - D) / 2, top: 0, transform: `translateX(${-W / 2}px) rotateY(-90deg)`}, 0.76)}
      {face('r', [u + d + w, v + d, d, h], {left: (W - D) / 2, top: 0, transform: `translateX(${W / 2}px) rotateY(90deg)`}, 0.62)}
      {face('t', [u + d, v, w, d], {left: 0, top: (H - D) / 2, transform: `translateY(${-H / 2}px) rotateX(90deg)`}, 1.08)}
    </div>
  );
};

const LAYOUT: Record<MobId, Part[]> = {
  creeper: [
    {size: [4, 6, 4], uv: [0, 16], x: -2, y: 20, z: -4},
    {size: [4, 6, 4], uv: [0, 16], x: 2, y: 20, z: -4},
    {size: [4, 6, 4], uv: [0, 16], x: -2, y: 20, z: 4},
    {size: [4, 6, 4], uv: [0, 16], x: 2, y: 20, z: 4},
    {size: [8, 12, 4], uv: [16, 16], x: 0, y: 8},
    {size: [8, 8, 8], uv: [0, 0], x: 0, y: 0, head: true},
  ],
  zombie: [
    {size: [4, 12, 4], uv: [0, 16], x: -2, y: 20},
    {size: [4, 12, 4], uv: [16, 48], x: 2, y: 20},
    {size: [8, 12, 4], uv: [16, 16], x: 0, y: 8},
    {size: [4, 12, 4], uv: [40, 16], x: -6, y: 8, raise: 86},
    {size: [4, 12, 4], uv: [32, 48], x: 6, y: 8, raise: 86},
    {size: [8, 8, 8], uv: [0, 0], x: 0, y: 0, head: true},
  ],
  husk: [],
  skeleton: [
    {size: [2, 12, 2], uv: [0, 16], x: -2, y: 20},
    {size: [2, 12, 2], uv: [0, 16], x: 2, y: 20},
    {size: [8, 12, 4], uv: [16, 16], x: 0, y: 8},
    {size: [2, 12, 2], uv: [40, 16], x: -5, y: 8},
    {size: [2, 12, 2], uv: [40, 16], x: 5, y: 8},
    {size: [8, 8, 8], uv: [0, 0], x: 0, y: 0, head: true},
  ],
  wither_skeleton: [],
  enderman: [
    {size: [2, 30, 2], uv: [56, 0], x: -2, y: 16},
    {size: [2, 30, 2], uv: [56, 0], x: 2, y: 16},
    {size: [8, 12, 4], uv: [32, 16], x: 0, y: 7},
    {size: [2, 30, 2], uv: [56, 0], x: -5, y: 7},
    {size: [2, 30, 2], uv: [56, 0], x: 5, y: 7},
    {size: [8, 8, 8], uv: [0, 0], x: 0, y: 0, head: true},
  ],
};
LAYOUT.husk = LAYOUT.zombie;
LAYOUT.wither_skeleton = LAYOUT.skeleton;

const SHEET: Record<MobId, {src: string; sheet: [number, number]}> = {
  creeper: {src: 'entity/creeper/creeper.png', sheet: [64, 32]},
  zombie: {src: 'entity/zombie/zombie.png', sheet: [64, 64]},
  husk: {src: 'entity/zombie/husk.png', sheet: [64, 64]},
  skeleton: {src: 'entity/skeleton/skeleton.png', sheet: [64, 32]},
  wither_skeleton: {src: 'entity/skeleton/wither_skeleton.png', sheet: [64, 32]},
  enderman: {src: 'entity/enderman/enderman.png', sheet: [64, 32]},
};

export const MobFigure: FC<{mob: MobId; scale: number; eyes?: number; style?: CSSProperties}> = ({mob, scale: s, eyes = 1, style}) => {
  const dims = FIG[mob];
  const {src, sheet} = SHEET[mob];
  const tx = tex(src);
  const eyesSrc = mob === 'enderman' ? tex('entity/enderman/enderman_eyes.png') : undefined;
  return (
    <div style={{position: 'relative', width: dims.w * s, height: dims.h * s, flex: 'none', perspective: 2600 * (s / 24), ...style}}>
      {/* rig origin = centre of the true model; yaw / pitch give the in-game 3/4 view */}
      <div style={{position: 'absolute', left: (dims.w * s) / 2, top: (dims.h * s) / 2, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(${PITCH}deg) rotateY(${YAW}deg)`}}>
        {LAYOUT[mob].map((p, i) => {
          const [w, h] = p.size;
          const pivot = p.raise ? 2 * s : 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: (p.x - w / 2) * s,
                top: (p.y - dims.th / 2) * s,
                width: w * s,
                height: h * s,
                transformStyle: 'preserve-3d',
                transformOrigin: `50% ${pivot}px`,
                transform: `translateZ(${(p.z ?? 0) * s}px)${p.raise ? ` rotateX(${p.raise}deg)` : ''}`,
              }}
            >
              <Box3D src={tx} sheet={sheet} part={p} s={s} eyesSrc={eyesSrc} eyes={eyes} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const outline = (c: string, w: number) => `drop-shadow(${w}px 0 0 ${c}) drop-shadow(-${w}px 0 0 ${c}) drop-shadow(0 ${w}px 0 ${c}) drop-shadow(0 -${w}px 0 ${c})`;

export type StatDef = {label: string; value: string; ratio: number; color: string; icon: string[]};

const StatHex: FC<{s: StatDef; at: number; w?: number}> = ({s, at, w = 160}) => {
  const f = useCurrentFrame();
  const h = (w * 2) / Math.sqrt(3);
  const t = win(f, at, 14);
  const fill = stepQ(EASE.out(t), 12) * s.ratio;
  const out = hexPts(w, h);
  const ring = insetPoly(out, 3);
  const inner = insetPoly(out, 3 + 9);
  const cid = `sh${s.label}${w}`;
  const pop = EASE.back(win(f, at - 6, 8));
  if (f < at - 6) return <div style={{width: w, height: h + 70}} />;
  return (
    <div style={{width: w, flex: 'none', transform: `scale(${pop})`, transformOrigin: '50% 40%'}}>
      <div style={{position: 'relative', width: w, height: h}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <defs>
            <clipPath id={cid}>
              <rect x={0} y={h * (1 - fill)} width={w} height={h} />
            </clipPath>
          </defs>
          <polygon points={ptsStr(out)} fill="#000" />
          <polygon points={ptsStr(ring)} fill="#5A5A62" />
          <polygon points={ptsStr(ring)} fill={s.color} opacity={0.9} clipPath={`url(#${cid})`} />
          <polygon points={ptsStr(inner)} fill="#101014" />
          <polygon points={ptsStr(inner)} fill={s.color} opacity={0.42} clipPath={`url(#${cid})`} />
          <polygon points={ptsStr(inner)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
          <PxIcon rows={s.icon} px={4} color="#fff" />
          <PxText text={s.value} px={5} />
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 12}}>
        <McdText size={30} weight={700} color="#C8CCD4">{s.label}</McdText>
      </div>
    </div>
  );
};

const DEFAULTS: Record<MobId, {name: string; en: string; kind: string; desc: string; stats: StatDef[]; weak: string[]; biome: BiomeId}> = {
  enderman: {
    name: '末影人',
    en: 'ENDERMAN',
    kind: '中立生物',
    desc: '直视它的眼睛会激怒它。会瞬移，会搬方块，身上带着末影珍珠。',
    stats: [
      {label: '生命', value: '40', ratio: 1, color: '#D8293E', icon: HEART_PX},
      {label: '伤害', value: '7', ratio: 0.55, color: '#F85600', icon: SWORD_ROWS},
      {label: '速度', value: '快', ratio: 0.8, color: '#48C8D8', icon: BOLT_ROWS},
    ],
    weak: ['water_bucket', 'diamond_sword'],
    biome: 'end',
  },
  creeper: {
    name: '苦力怕',
    en: 'CREEPER',
    kind: '敌对生物',
    desc: '悄无声息地靠近，然后爆炸。保持距离，用弓解决它。',
    stats: [
      {label: '生命', value: '20', ratio: 0.5, color: '#D8293E', icon: HEART_PX},
      {label: '伤害', value: '49', ratio: 0.95, color: '#F85600', icon: SWORD_ROWS},
      {label: '速度', value: '中', ratio: 0.55, color: '#48C8D8', icon: BOLT_ROWS},
    ],
    weak: ['bow', 'crossbow_standby'],
    biome: 'forest-night',
  },
  zombie: {
    name: '僵尸',
    en: 'ZOMBIE',
    kind: '敌对生物',
    desc: '夜晚成群出没，会敲门。白天会在阳光下燃烧。',
    stats: [
      {label: '生命', value: '20', ratio: 0.5, color: '#D8293E', icon: HEART_PX},
      {label: '伤害', value: '9', ratio: 0.45, color: '#F85600', icon: SWORD_ROWS},
      {label: '速度', value: '慢', ratio: 0.35, color: '#48C8D8', icon: BOLT_ROWS},
    ],
    weak: ['enchanted_book', 'iron_sword'],
    biome: 'forest-night',
  },
  husk: {
    name: '尸壳',
    en: 'HUSK',
    kind: '敌对生物',
    desc: '沙漠里的僵尸变种，不怕阳光，攻击会让你饥饿。',
    stats: [
      {label: '生命', value: '20', ratio: 0.5, color: '#D8293E', icon: HEART_PX},
      {label: '伤害', value: '9', ratio: 0.45, color: '#F85600', icon: SWORD_ROWS},
      {label: '速度', value: '慢', ratio: 0.35, color: '#48C8D8', icon: BOLT_ROWS},
    ],
    weak: ['enchanted_book', 'iron_sword'],
    biome: 'desert',
  },
  skeleton: {
    name: '骷髅',
    en: 'SKELETON',
    kind: '敌对生物',
    desc: '远程射手，会走位。贴近它，或者躲在方块后面。',
    stats: [
      {label: '生命', value: '20', ratio: 0.5, color: '#D8293E', icon: HEART_PX},
      {label: '伤害', value: '8', ratio: 0.4, color: '#F85600', icon: SWORD_ROWS},
      {label: '速度', value: '中', ratio: 0.55, color: '#48C8D8', icon: BOLT_ROWS},
    ],
    weak: ['iron_sword', 'enchanted_book'],
    biome: 'forest-night',
  },
  wither_skeleton: {
    name: '凋灵骷髅',
    en: 'WITHER SKELETON',
    kind: 'BOSS 近卫',
    desc: '下界要塞的守卫，命中会让你凋零。带上牛奶和好装备。',
    stats: [
      {label: '生命', value: '20', ratio: 0.5, color: '#D8293E', icon: HEART_PX},
      {label: '伤害', value: '24', ratio: 0.8, color: '#F85600', icon: SWORD_ROWS},
      {label: '速度', value: '中', ratio: 0.55, color: '#48C8D8', icon: BOLT_ROWS},
    ],
    weak: ['diamond_sword', 'golden_apple'],
    biome: 'nether',
  },
};

export const MobCard: FC<{
  bg?: boolean;
  mob?: MobId;
  name?: string;
  en?: string;
  kind?: string;
  desc?: string;
  stats?: StatDef[];
  weak?: string[];
  boss?: boolean;
  biome?: BiomeId;
  /** 弱点栏小标题，默认「弱点 WEAKNESS」 */
  weakLabel?: string;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, mob = 'creeper', name, en, kind, desc, stats, weak, boss = false, biome, weakLabel = '弱点 WEAKNESS', audio = true}) => {
  const f = useCurrentFrame();
  const d = DEFAULTS[mob];
  const nm = name ?? d.name;
  const nn = [...nm].length;
  const namePx = nn <= 4 ? 6 : 5;
  const nameRows = nn <= 4 ? 20 : 24;
  const st = stats ?? d.stats;
  const wk = weak ?? d.weak;
  const targetH = 740;
  const dims = FIG[mob];
  const scale = Math.max(6, Math.floor(targetH / dims.h));
  const figW = dims.w * scale;
  const figH = dims.h * scale;
  const FX = 520; // figure centre x
  const FOOT = 946; // feet y
  const revealStart = 40;
  const reveal = stepQ(win(f, revealStart, 22), 11); // 0..1 bottom-up
  const revealed = f >= revealStart + 22;
  const blink = f < revealStart ? (Math.floor(f / 5) % 2 === 0 ? 3 : 2) : 2;
  const lock = EASE.out(win(f, 8, 12));
  const brk = 1 + (1 - lock) * 0.45;
  const cardIn = EASE.out(win(f, 54, 12));
  const bracketW = figW + 90;
  const bracketH = figH + 70;
  const rowW = 688;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.25);
  return (
    <AbsoluteFill>
      {bg && <SceneBg biome={biome ?? d.biome} dim={0.5} tint="10,6,14" />}
      {/* spot glow under the figure */}
      <div style={{opacity: stepQ(win(f, 2, 14), 4)}}>
        <GlowWash color={mob === 'enderman' ? 'rgba(150,60,220,0.45)' : 'rgba(190,40,40,0.42)'} at="27% 62%" size="38% 56%" />
      </div>

      {/* pedestal: flat hexagon plate */}
      <svg width={760} height={200} style={{position: 'absolute', left: FX - 380, top: FOOT - 110, opacity: stepQ(win(f, 4, 10), 4)}}>
        {[0, 1, 2].map((k) => {
          const hw = 700 - k * 170;
          const hh = 150 - k * 36;
          const pts = hexPts(hw, hh).map(([x, y]) => [x + (760 - hw) / 2, y + 30 + k * 18] as [number, number]);
          return <polygon key={k} points={ptsStr(pts)} fill={k === 0 ? '#0A0608' : k === 1 ? '#1A1216' : '#2A1A20'} stroke={k === 2 ? 'rgba(255,90,70,0.55)' : 'rgba(255,255,255,0.1)'} strokeWidth={3} />;
        })}
      </svg>

      {/* big hexagon target frame behind the figure */}
      {(() => {
        const hw = 700;
        const hh = 800;
        const pts = hexPts(hw, hh);
        const t = EASE.out(win(f, 6, 14));
        return (
          <svg width={hw} height={hh} style={{position: 'absolute', left: FX - hw / 2, top: FOOT - figH / 2 - hh / 2 - 8, opacity: stepQ(t, 4) * 0.9, transform: `scale(${1.12 - 0.12 * t})`, overflow: 'visible'}}>
            <polygon points={ptsStr(pts)} fill="rgba(120,20,26,0.16)" stroke="rgba(255,90,74,0.5)" strokeWidth={4} />
            <polygon points={ptsStr(insetPoly(pts, 22))} fill="none" stroke="rgba(255,90,74,0.22)" strokeWidth={2} strokeDasharray="14 10" />
            {pts.map(([x, y], i) => (
              <rect key={i} x={x - 8} y={y - 8} width={16} height={16} fill="#FF5A4A" transform={`rotate(45 ${x} ${y})`} />
            ))}
          </svg>
        );
      })()}
      {/* figure */}
      <div style={{position: 'absolute', left: FX - figW / 2, top: FOOT - figH - 8, width: figW, height: figH, opacity: stepQ(win(f, 4, 8), 4)}}>
        {/* silhouette with red outline */}
        {!revealed && (
        <div style={{position: 'absolute', inset: 0, filter: `${outline('#E02A3A', blink * 1.5)} drop-shadow(0 0 ${14 + 8 * pulse}px rgba(224,42,58,0.7))`}}>
          <div style={{filter: 'brightness(0)'}}>
            <MobFigure mob={mob} scale={scale} eyes={0} />
          </div>
        </div>
        )}
        {/* textured, revealed from the feet up */}
        <div style={{position: 'absolute', inset: 0, clipPath: `inset(${(1 - reveal) * 100}% -20px 0 -20px)`, filter: revealed ? `${outline('rgba(224,42,58,0.9)', 2)}` : undefined}}>
          <MobFigure mob={mob} scale={scale} eyes={revealed ? 1 : 0} />
        </div>
        {/* scan line on the reveal front */}
        {f >= revealStart && f < revealStart + 22 && <div style={{position: 'absolute', left: -30, right: -30, top: (1 - reveal) * figH - 6, height: 12, background: '#fff', opacity: 0.85, boxShadow: '0 0 24px rgba(255,255,255,0.7)'}} />}
      </div>

      <Embers count={16} color={mob === 'enderman' ? '#C35BFF' : '#FF5A4A'} core="#FFE0D8" size={8} seed={13} speed={0.6} area={[180, 420, 680, 520]} style={{opacity: stepQ(win(f, 20, 20), 4) * 0.9}} />
      {/* lock-on brackets */}
      <div style={{position: 'absolute', left: FX - (bracketW * brk) / 2, top: FOOT - figH / 2 - (bracketH * brk) / 2 - 8, width: bracketW * brk, height: bracketH * brk, opacity: stepQ(win(f, 6, 6), 3)}}>
        {[
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([cx, cy], i) => (
          <div key={i} style={{position: 'absolute', [cx ? 'right' : 'left']: 0, [cy ? 'bottom' : 'top']: 0, width: 56, height: 56}}>
            <div style={{position: 'absolute', [cx ? 'right' : 'left']: 0, [cy ? 'bottom' : 'top']: 0, width: 56, height: 8, background: revealed ? '#FF5A4A' : '#E02A3A'}} />
            <div style={{position: 'absolute', [cx ? 'right' : 'left']: 0, [cy ? 'bottom' : 'top']: 0, width: 8, height: 56, background: revealed ? '#FF5A4A' : '#E02A3A'}} />
          </div>
        ))}
      </div>
      <CrossFlash x={FX} y={FOOT - figH / 2} at={revealStart + 22} arm={260} thick={16} color={mob === 'enderman' ? '#E9B8FF' : '#FFB0A8'} dur={14} />
      <Burst x={FX} y={FOOT - figH / 2} at={revealStart + 22} count={20} size={12} life={24} speed={0.9} colors={mob === 'enderman' ? ['#C35BFF', '#E9B8FF', '#fff'] : ['#E02A3A', '#FF8A7A', '#fff']} seed={4} />

      {/* boss bar */}
      {boss && (
        <div style={{position: 'absolute', left: 560, top: 44, width: 800, opacity: stepQ(win(f, 20, 10), 4)}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10}}>
            <PxArt rows={SKULL_ROWS} pal={{k: '#fff'}} px={3} />
            <PxText text={nm} px={3} />
          </div>
          <div style={{height: 20, background: '#1A1010', boxShadow: '0 0 0 4px #000, 0 0 0 6px #4A4A52'}}>
            <div style={{height: '100%', width: `${stepQ(win(f, 24, 30), 20) * 100}%`, background: 'linear-gradient(180deg,#FF5A4A,#C01E2E)'}} />
          </div>
        </div>
      )}

      {/* card */}
      <div style={{position: 'absolute', left: 1000 + Math.round(((1 - cardIn) * 220) / 10) * 10, top: 112, opacity: cardIn > 0 ? 1 : 0}}>
        <CutPanel w={800} h={860} cuts={[44, 44, 44, 44]} fill="#16161A" edge="#3A3A40" glow="rgba(150,44,36,0.45)" corners>
          <div style={{position: 'absolute', left: 56, top: 50}}>
            <Pop at={62} dur={7} origin="0% 50%">
              <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: boss || mob === 'wither_skeleton' ? '#F85600' : '#AF2232', padding: '8px 20px 8px 16px', boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.28), inset -3px -3px 0 rgba(0,0,0,0.3)'}}>
                <PxArt rows={SKULL_ROWS} pal={{k: '#fff'}} px={3} />
                <McdText size={26} weight={800} color="#fff" style={{letterSpacing: 3}}>{kind ?? d.kind}</McdText>
              </div>
            </Pop>
          </div>
          <div style={{position: 'absolute', left: 52, top: 112, height: 128, display: 'flex', alignItems: 'center'}}>
            <PxChars
              text={nm}
              px={namePx}
              cjkRows={nameRows}
              gap={2}
              glyph={(i) => {
                const t = win(f, 68 + i * 3, 6);
                return {opacity: t > 0 ? 1 : 0, transform: `translateY(${Math.round(((1 - EASE.out(t)) * -64) / 4) * 4}px)`};
              }}
            />
          </div>
          <div style={{position: 'absolute', left: 58, top: 262}}>
            <Rise at={82} dur={8} dy={10}>
              <Label color={MCD.goldBright} size={28}>{en ?? d.en}</Label>
            </Rise>
          </div>
          <div style={{position: 'absolute', left: 58, top: 312, width: rowW}}>
            <Rise at={86} dur={8} dy={10}>
              <McdText size={30} color="#C8CCD4">{desc ?? d.desc}</McdText>
            </Rise>
          </div>
          <div style={{position: 'absolute', left: 56, top: 424, opacity: win(f, 90, 8)}}>
            <GoldRule w={rowW + 8} />
          </div>
          <div style={{position: 'absolute', left: 56, top: 466, width: rowW + 8, display: 'flex', justifyContent: 'space-between', padding: '0 10px'}}>
            {st.map((s, i) => (
              <StatHex key={i} s={s} at={96 + i * 8} />
            ))}
          </div>
          <div style={{position: 'absolute', left: 58, top: 724}}>
            <Rise at={122} dur={8} dy={10}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <Label color="#FF7A6A" size={28}>{weakLabel}</Label>
              </div>
            </Rise>
            <div style={{display: 'flex', gap: 16, marginTop: 14}}>
              {wk.map((w, i) => (
                <Pop key={w} at={128 + i * 5} dur={8}>
                  <BevelSlot size={104} rarity="unique" selected={i === 0 && f > 140 && Math.floor(f / 6) % 2 === 0}>
                    <ItemIcon3D src={itemTex(w)} size={62} depth={4} />
                  </BevelSlot>
                </Pop>
              ))}
            </div>
          </div>
        </CutPanel>
      </div>
      <WhiteFlash at={revealStart + 22} dur={8} peak={0.18} steps={4} />
      {audio && (
        <>
          <Sequence from={6}>
            <Audio src={mcSound('ui/toast/in')} volume={0.3} />
          </Sequence>
          <Sequence from={revealStart + 22}>
            <Audio src={mcSound('random/anvil_land')} volume={0.28} playbackRate={1.3} />
          </Sequence>
          <Sequence from={54}>
            <Audio src={mcSound('random/pop')} volume={0.3} />
          </Sequence>
          {[0, 1, 2].map((i) => (
            <Sequence key={i} from={96 + i * 8}>
              <Audio src={mcSound('random/click')} volume={0.2} playbackRate={0.9 + i * 0.12} />
            </Sequence>
          ))}
        </>
      )}
    </AbsoluteFill>
  );
};
void HexBadge;
void clamp01;
