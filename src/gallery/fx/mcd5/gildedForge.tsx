// mcd-v-gilded-forge: Ancient Forge & Gilded Artifact Awakening showcase (180 frames, 6.0 s @ 30fps).
// Aligned to refs-mcd/ui/gilded-items.png, inventory-final-unique.jpg, enchant-inventory-reveal.jpg, and steam-lava-pit-forge.jpg.
// Act I (0-47): Real CSS-3D textured Minecraft anvil drops onto an isometric hexagon rune altar; three catalyst diamonds (netherite_ingot,
//   echo_shard, nether_star) pop in and stream stepped pixel energy into the jolting anvil while the right blueprint panel charges to 100%.
// Act II (48-96): Hammer impact triggers a pixel-cross Shockwave + stepped shards (no expanding rings), dual gold/magenta beam burst in 4 frames,
//   and a 16-slice 3D voxel weapon spins out of the core into a gilded diamond stage.
// Act III (48-180): The right chamfered inspection panel awakens into GILDED mode (rolling power 108->260, UNIQUE + GILDED tags, character-by-character
//   hard-shadow title, 3 trait lines, 3 stat bars, and 3 EnchantSlot diamonds igniting at 100/116/132 with purple pixel bursts), while the bottom-left
//   hero card (player "云诺羲Rinorsi", 3D PlayerFigure, Level/Power badges, 4 gear BevelSlots) updates on equip.
import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, item as itemTex} from '../../../mc/assets';
import {Shockwave} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Backdrop, Beam, Particles, Sfx, Twinkle, genParts, mcSound, snap, stepped} from '../mcd2/common';
import {SpinItem} from '../mcd2/itemshowcase';
import {
  BevelSlot,
  CutPanel,
  DiamondFrame,
  EMERALD_PAL,
  EMERALD_ROWS,
  ENCH_FLAME,
  ENCH_FLAME_PAL,
  ENCH_PIERCE,
  ENCH_PIERCE_PAL,
  ENCH_SKULL,
  ENCH_SKULL_PAL,
  Embers,
  EmeraldCounter,
  EnchantSlot,
  HexBadge,
  ItemIcon3D,
  LevelBadge,
  MCD,
  MainButton,
  McdText,
  PlayerFigure,
  PowerBadge,
  PxArt,
  PxChars,
  PxText,
  RarityTag,
  Runes,
  SOUL_ROWS,
  WhiteFlash,
  hexPts,
  insetPoly,
  ptsStr,
} from '../mcdkit/kit';
import {BulletDiamond, Burst, CrossFlash, Fountain, GoldRule, Label, PxIcon, Rise, SWORD_ROWS, Shine, countUp, stepQ, win, type BiomeId} from './common';

export const GILDED_FORGE_FRAMES = 180;
const IMPACT = 48;

export type GildedEnchantSpec = {
  /** 附魔名称 */
  name: string;
  /** 附魔副标签（如 POWERFUL 强力 / MAX TIER 满级） */
  tag: string;
  /** 罗马数字等级（I / II / III） */
  tier: string;
  /** 图标类型：flame | pierce | skull */
  icon: 'flame' | 'pierce' | 'skull';
};

export type GildedStatSpec = {
  /** 属性名称 */
  label: string;
  /** 填充比例 0..1 */
  ratio: number;
  /** 显示数值文案 */
  value: string;
};

const DEF_ENCHANTS: GildedEnchantSpec[] = [
  {name: '炽焰灼烧', tag: 'POWERFUL 强力', tier: 'III', icon: 'flame'},
  {name: '破甲穿刺', tag: 'POWERFUL 强力', tier: 'III', icon: 'pierce'},
  {name: '致命暴击', tag: 'MAX TIER 满级', tier: 'III', icon: 'skull'},
];

const DEF_STATS: GildedStatSpec[] = [
  {label: '威力 POWER', ratio: 0.96, value: '96'},
  {label: '攻速 SPEED', ratio: 0.82, value: '82'},
  {label: '范围 AREA', ratio: 0.9, value: '90'},
];

const ENCH_ICON_MAP = {
  flame: {rows: ENCH_FLAME, pal: ENCH_FLAME_PAL},
  pierce: {rows: ENCH_PIERCE, pal: ENCH_PIERCE_PAL},
  skull: {rows: ENCH_SKULL, pal: ENCH_SKULL_PAL},
} as const;

/** Airtight CSS-3D box using real Minecraft block textures (nearest-neighbour). */
const AnvilBox: FC<{
  w: number;
  h: number;
  d: number;
  s: number;
  yOff: number;
  sideSrc: string;
  topSrc: string;
  heat?: number;
}> = ({w, h, d, s, yOff, sideSrc, topSrc, heat = 0}) => {
  const W = w * s;
  const H = h * s;
  const D = d * s;
  const filter = (br: number) =>
    `brightness(${br + heat * 0.85}) ${heat > 0.05 ? `sepia(${heat * 0.6}) saturate(${1 + heat * 2})` : ''}`;
  const glow = heat > 0.1 ? `inset 0 0 ${Math.round(s * 1.4)}px rgba(255,210,110,${heat * 0.7})` : 'inset 0 0 0 2px rgba(0,0,0,0.45)';
  const baseStyle = (src: string, fw: number, fh: number, br: number) => ({
    position: 'absolute' as const,
    width: fw,
    height: fh,
    backgroundColor: '#3A3A40',
    backgroundImage: `url(${src}), url(${sideSrc})`,
    backgroundSize: `${16 * s}px ${16 * s}px`,
    backgroundPosition: 'center',
    imageRendering: 'pixelated' as const,
    backfaceVisibility: 'hidden' as const,
    filter: filter(br),
    boxShadow: glow,
  });
  return (
    <div style={{position: 'absolute', left: -W / 2, top: yOff * s - H / 2, width: W, height: H, transformStyle: 'preserve-3d'}}>
      {/* Front */}
      <div style={{...baseStyle(sideSrc, W, H, 0.9), left: 0, top: 0, transform: `translateZ(${D / 2}px)`}} />
      {/* Back */}
      <div style={{...baseStyle(sideSrc, W, H, 0.52), left: 0, top: 0, transform: `translateZ(${-D / 2}px) rotateY(180deg)`}} />
      {/* Left */}
      <div style={{...baseStyle(sideSrc, D, H, 0.78), left: (W - D) / 2, top: 0, transform: `translateX(${-W / 2}px) rotateY(-90deg)`}} />
      {/* Right */}
      <div style={{...baseStyle(sideSrc, D, H, 0.64), left: (W - D) / 2, top: 0, transform: `translateX(${W / 2}px) rotateY(90deg)`}} />
      {/* Top */}
      <div style={{...baseStyle(topSrc, W, D, 1.08), left: 0, top: (H - D) / 2, transform: `translateY(${-H / 2}px) rotateX(90deg)`}} />
    </div>
  );
};

/** Real 3-part Minecraft Anvil assembled in CSS 3D from block/anvil.png and block/anvil_top.png.
 *   seamlessly stacked: base y=[3..7] (center +5, h=4), waist y=[-2..3] (center +0.5, h=5), top y=[-8..-2] (center -5, h=6). */
const Anvil3D: FC<{s?: number; heat?: number; yaw?: number}> = ({s = 10, heat = 0, yaw = -28}) => {
  const side = block('anvil');
  const top = block('anvil_top');
  return (
    <div style={{position: 'relative', width: 0, height: 0, transformStyle: 'preserve-3d', transform: `perspective(1500px) rotateX(-24deg) rotateY(${yaw}deg)`}}>
      <AnvilBox w={12} h={4} d={12} s={s} yOff={5} sideSrc={side} topSrc={side} heat={heat * 0.5} />
      <AnvilBox w={8} h={5} d={8} s={s} yOff={0.5} sideSrc={side} topSrc={side} heat={heat * 0.75} />
      <AnvilBox w={16} h={6} d={10} s={s} yOff={-5} sideSrc={side} topSrc={top} heat={heat} />
    </div>
  );
};

/** Isometric hexagonal forge altar platform (pure polygon geometry, zero rounded rings). */
const HexAltar: FC<{cx: number; cy: number; w: number; glow: number; pulse: number}> = ({cx, cy, w, glow, pulse}) => {
  const h = Math.round(w * 0.42);
  const outer = hexPts(w, h);
  const mid = insetPoly(outer, 10);
  const inner = insetPoly(outer, 24);
  const core = insetPoly(outer, 46);
  return (
    <div style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h + 18, pointerEvents: 'none'}}>
      <svg width={w} height={h + 18} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} shapeRendering="crispEdges">
        <g transform="translate(0, 14)">
          <polygon points={ptsStr(outer)} fill="#050408" opacity={0.85} />
        </g>
        <polygon points={ptsStr(outer)} fill="#000000" />
        <polygon points={ptsStr(mid)} fill="#28222E" stroke="#4E445A" strokeWidth={3} />
        <polygon points={ptsStr(inner)} fill="#16121C" stroke={glow > 0.4 ? '#FCD448' : '#8A5A20'} strokeWidth={3} opacity={0.85 + 0.15 * pulse} />
        <polygon points={ptsStr(core)} fill={glow > 0.5 ? '#3A1E14' : '#1E1418'} stroke={glow > 0.5 ? '#FF9400' : '#5A2A8C'} strokeWidth={2} />
      </svg>
    </div>
  );
};

/** Stepped pixel stream from (x0,y0) to (x1,y1) over progress p (0..1), snapped to 4px grid. */
const EnergyStream: FC<{x0: number; y0: number; x1: number; y1: number; f: number; start: number; end: number; color: string; core: string; seed: number}> = ({
  x0,
  y0,
  x1,
  y1,
  f,
  start,
  end,
  color,
  core,
  seed,
}) => {
  if (f < start || f > end) return null;
  const rnd = mulberry32(seed);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const ph = rnd() * 0.35;
    const raw = (f - start) / Math.max(1, end - start) - ph;
    const t = clamp01(raw / (1 - ph));
    if (t <= 0 || t >= 1) continue;
    const e = EASE.in(t);
    const arc = Math.sin(t * Math.PI) * (rnd() - 0.5) * 90;
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const nl = Math.hypot(nx, ny) || 1;
    const px = snap(x0 + (x1 - x0) * e + (nx / nl) * arc, 4);
    const py = snap(y0 + (y1 - y0) * e + (ny / nl) * arc, 4);
    const sz = i % 3 === 0 ? 12 : 8;
    nodes.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: px - sz / 2,
          top: py - sz / 2,
          width: sz,
          height: sz,
          background: i % 2 === 0 ? core : color,
          boxShadow: sz >= 12 ? `0 0 0 2px ${color}` : undefined,
        }}
      />,
    );
  }
  return <>{nodes}</>;
};

export interface McdVGildedForgeProps {
  /** 是否绘制 3D 下界熔岩锻台背景（真实视频传 false 作为透明层叠加）。默认 false */
  bg?: boolean;
  /** 是否带上原版音效。默认 true */
  audio?: boolean;
  /** 锻造出的武器贴图 id（item 贴图名）。默认 'netherite_sword' */
  item?: string;
  /** 武器主名称（逐字硬阴影砸落）。默认 '风暴 · 破界重剑' */
  name?: string;
  /** 武器一句话描述。默认 '深渊黑石与下界之星重铸的远古神兵，斩裂维度壁垒。' */
  desc?: string;
  /** 顶部左上祭坛标题。默认 'ANCIENT FORGE · 远古锻台' */
  header?: string;
  /** 玩家名称（左下角色卡）。默认 '云诺羲Rinorsi' */
  player?: string;
  /** 玩家皮肤 id（steve/alex/efe/zuri/kai…）。默认 'efe' */
  skin?: string;
  /** 玩家等级徽章数字。默认 35 */
  level?: number;
  /** 锻造前起始战力。默认 108 */
  basePower?: number;
  /** 锻造觉醒后目标战力。默认 260 */
  power?: number;
  /** 三件催化圣物贴图 id（左/右/上）。默认 ['netherite_ingot', 'echo_shard', 'nether_star'] */
  catalysts?: [string, string, string];
  /** 三条核心词条文案：[白字基础伤害, 橙字独特词条, 金字镀金内置词条] */
  traits?: [string, string, string];
  /** 三项属性条数据 [{label, ratio, value}] */
  stats?: GildedStatSpec[];
  /** 三枚附魔菱形槽配置 */
  enchants?: GildedEnchantSpec[];
  /** 底部主按钮文字。默认 '装备神兵 · EQUIP' */
  button?: string;
  /** 预览场景群系。默认 'nether' */
  biome?: BiomeId;
}

export const GildedForge: FC<McdVGildedForgeProps> = ({
  bg = false,
  audio = true,
  item = 'netherite_sword',
  name = '风暴 · 破界重剑',
  desc = '深渊黑石与下界之星重铸的远古神兵，斩裂维度壁垒。',
  header = 'ANCIENT FORGE · 远古锻台',
  player = '云诺羲Rinorsi',
  skin = 'efe',
  level = 35,
  basePower = 108,
  power = 260,
  catalysts = ['netherite_ingot', 'echo_shard', 'nether_star'],
  traits = [
    '480 - 720 近战神圣伤害',
    '独特词条：破界十字斩（暴击触发像素十字爆裂）',
    '内置镀金：风暴重击 III（全属性伤害 +45%）',
  ],
  stats = DEF_STATS,
  enchants = DEF_ENCHANTS,
  button = '装备神兵 · EQUIP',
  biome = 'nether',
}) => {
  const f = useCurrentFrame();
  const exitOp = stepped(1 - win(f, GILDED_FORGE_FRAMES - 14, 12), 4);

  // Stage coordinates (strictly within [84..1836, 80..996] safe box)
  const STAGE_X = 484;
  const STAGE_Y = 420;
  const ALTAR_Y = 564;

  // Act I: Anvil drop + jolt + catalyst convergence
  const anvilDrop = win(f, 2, 12);
  const anvilDy = (1 - EASE.out(anvilDrop)) * -300;
  const anvilSq = f >= 14 && f < 22 ? 1 - 0.14 * Math.sin(((f - 14) / 8) * Math.PI) : 1;
  const preImpact = f >= 18 && f < IMPACT;
  const preProg = win(f, 18, IMPACT - 18);
  const joltPhase = preImpact ? ((f - 18) % 6) / 6 : 0;
  const shx = preImpact && joltPhase < 0.5 ? snap(Math.sin(joltPhase * Math.PI * 4) * 10 * (0.4 + preProg * 1.2), 4) : 0;
  const hop = preImpact && joltPhase < 0.4 ? snap(-Math.sin((joltPhase / 0.4) * Math.PI) * 14 * preProg, 4) : 0;
  const heat = f < IMPACT ? preProg : Math.max(0.25, 1 - win(f, IMPACT, 36) * 0.75);

  // Catalyst positions around the anvil
  const catSpots: {x: number; y: number; tier: 'rare' | 'unique' | 'gilded'; color: string; core: string; at: number}[] = [
    {x: 248, y: 320, tier: 'rare', color: '#3CA886', core: '#9FFFE0', at: 8},
    {x: 720, y: 320, tier: 'unique', color: '#F85600', core: '#FFD290', at: 14},
    {x: 484, y: 214, tier: 'gilded', color: '#FCD448', core: '#FFFFFF', at: 20},
  ];
  const catPull = EASE.in(win(f, 34, IMPACT - 34));

  // Act II: Impact at f=48, dual beam, 3D spinning weapon reveal
  const forged = f >= IMPACT;
  const dt = f - IMPACT;
  const camShake = forged && dt < 12 ? snap(Math.sin(dt * 2.8) * 12 * (1 - dt / 12), 4) : 0;
  const beamGrow = dt < 0 ? 0 : Math.min(1, (dt + 1) / 4);
  const beamWidthK = dt < 0 ? 0 : dt < 16 ? 1 : Math.max(0.28, 1 - 0.72 * win(dt, 16, 44));
  const beamAlpha = dt < 0 ? 0 : Math.max(0.22, 1 - win(dt, 24, 90) * 0.75);

  // Spinning 3D weapon
  const spinIn = win(f, IMPACT, 44);
  const theta = (1 - EASE.out(spinIn)) * Math.PI * 5 + (f > IMPACT + 44 ? Math.sin((f - IMPACT - 44) * 0.07) * 0.42 : 0);
  const weaponBob = forged ? snap(Math.sin(dt * 0.1) * 10, 2) : 0;
  const weaponScale = forged ? 0.65 + 0.35 * EASE.back(win(f, IMPACT, 14)) : 0;

  // Sparks erupting on impact
  const forgeSparks = genParts({
    n: 84,
    seed: 19,
    x: STAGE_X,
    y: ALTAR_Y - 60,
    sx: 64,
    sy: 16,
    a0: -Math.PI * 0.82,
    a1: -Math.PI * 0.18,
    v0: 8,
    v1: 28,
    g: 0.18,
    drag: 0.06,
    life0: 32,
    life1: 68,
    size0: 8,
    size1: 16,
    colors: ['#FFE680', '#FCD448', '#FF9400', '#CD2ECD', '#FFFFFF'],
    kinds: ['sq', 'plus', 'bar'],
  });

  // Right panel enters at f=4 so all 4 quadrants are full throughout the entire animation!
  const panelT = stepQ(EASE.out(win(f, 4, 12)), 8);
  const panelDx = snap((1 - panelT) * 120, 4);
  const shownPower = f < IMPACT ? basePower : basePower + countUp(f, IMPACT, 28, power - basePower, 14);
  const forgeCharge = stepQ(win(f, 8, IMPACT - 8), 16);
  const enchAt = [100, 116, 132];
  const holdProg = clamp01((f - 142) / 14);
  const equipped = f >= 156;
  const pressProg = equipped ? Math.max(0, 1 - win(f, 162, 8)) : 0;

  // Resource counters in top-left header
  const emeraldVal = 4164 - countUp(f, 22, 26, 964, 12);
  const emeraldBump = f >= 22 && f < 52 ? Math.abs(Math.sin((f - 22) * 0.45)) : 0;
  const spentEnch = (f >= enchAt[0] ? 3 : 0) + (f >= enchAt[1] ? 3 : 0) + (f >= enchAt[2] ? 3 : 0);
  const enchBump = enchAt.some((a) => f >= a && f < a + 8) ? 1 : 0;

  return (
    <AbsoluteFill style={{opacity: exitOp}}>
      {/* Layer 0: 3D Isometric Voxel Forge Scene (when bg=true) */}
      {bg && (
        <Backdrop biome={biome} loop={GILDED_FORGE_FRAMES} camera="push" dim={0.38} dark={0.34} sat={1.08} seed={7}>
          <AbsoluteFill
            style={{
              background: 'radial-gradient(ellipse 46% 48% at 26% 52%, rgba(255,148,20,0.34), rgba(160,30,170,0.18) 48%, rgba(0,0,0,0) 74%)',
              opacity: 0.45 + (forged ? 0.55 : preProg * 0.35),
            }}
          />
          <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(6,4,10,0.58) 0%, rgba(6,4,10,0.22) 45%, rgba(6,4,10,0.72) 100%)'}} />
        </Backdrop>
      )}

      {/* Main Shake Wrapper */}
      <AbsoluteFill style={{transform: `translate(${camShake}px, ${-camShake * 0.5}px)`}}>
        {/* ================================================= TOP-LEFT: FORGE HEADER BAR (x=84, y=80) ================================================= */}
        <div style={{position: 'absolute', left: 84, top: 80, opacity: stepped(win(f, 0, 8), 4)}}>
          <CutPanel w={800} h={76} cuts={[16, 16, 16, 16]} fill="#14121A" edge="#4A3E54" edgeW={3}>
            <div style={{position: 'absolute', inset: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <HexBadge w={48} ring="#FCD448" ringHi="#FFF2A8" fill="#1E160C">
                  <PxIcon rows={SWORD_ROWS} px={2} color="#FFE680" />
                </HexBadge>
                <Label size={22} color="#FCD448">
                  {header}
                </Label>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
                <EmeraldCounter value={emeraldVal} px={3} bump={emeraldBump} />
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <PxArt rows={SOUL_ROWS} pal={{o: '#B060F0'}} px={4} style={{transform: `scale(${1 + enchBump * 0.22})`}} />
                  <PxText text={12 - spentEnch} px={3} color={enchBump ? '#F4E0FF' : '#E2C0FF'} />
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <PxArt rows={SOUL_ROWS} pal={{o: MCD.soul}} px={4} />
                  <PxText text={240} px={3} color="#A8F0FF" />
                </div>
              </div>
            </div>
          </CutPanel>
        </div>

        {/* ================================================= CENTER-LEFT: 3D FORGE STAGE (cx=484, cy=420) ================================================= */}
        <HexAltar cx={STAGE_X} cy={ALTAR_Y} w={540} glow={heat} pulse={0.5 + 0.5 * Math.sin(f * 0.2)} />
        {f >= 14 && f < 26 && <Burst x={STAGE_X} y={ALTAR_Y - 10} at={14} count={20} seed={2} colors={['#9A9AA4', '#FCD448', '#FFFFFF']} speed={0.9} life={18} size={10} />}

        {/* Gilded Diamond Stage Backdrop (pops in on impact f=48) */}
        {forged && (
          <div
            style={{
              position: 'absolute',
              left: STAGE_X - 230,
              top: STAGE_Y - 230,
              transform: `scale(${0.78 + 0.22 * EASE.back(win(f, IMPACT, 12))})`,
              opacity: stepped(win(f, IMPACT, 6), 3),
            }}
          >
            <DiamondFrame size={460} tier="gilded" glow="rgba(255,196,64,0.65)" selected={equipped} />
          </div>
        )}

        {/* Dual Light Beams (Gold + Magenta core, 4-frame burst at f=48) */}
        {forged && (
          <>
            <Beam x={STAGE_X} y={ALTAR_Y - 12} kind="orange" width={Math.round(320 * beamWidthK)} grow={beamGrow} alpha={beamAlpha} flick={0.94 + 0.06 * Math.sin(f * 2.1)} />
            <Beam x={STAGE_X} y={ALTAR_Y - 12} kind="magenta" width={Math.round(170 * beamWidthK)} grow={beamGrow} alpha={beamAlpha * 0.85} flick={0.92 + 0.08 * Math.cos(f * 2.7)} />
          </>
        )}

        {/* 3D Minecraft Anvil on the Altar */}
        {f >= 2 && (
          <div
            style={{
              position: 'absolute',
              left: STAGE_X + shx,
              top: (forged ? ALTAR_Y - 18 : ALTAR_Y - 46) + anvilDy + hop,
              transform: `scale(${1 / anvilSq}, ${anvilSq}) scale(${forged ? 0.82 : 1})`,
              opacity: stepped(win(f, 2, 5), 3),
            }}
          >
            <Anvil3D s={10} heat={heat} yaw={-28 + (forged ? Math.sin(dt * 0.04) * 6 : 0)} />
          </div>
        )}

        {/* Act I: Three Catalyst Diamonds + Energy Streams into the Anvil */}
        {!forged &&
          catSpots.map((c, idx) => {
            const popT = win(f, c.at, 10);
            if (popT <= 0) return null;
            const cx = STAGE_X + (c.x - STAGE_X) * (1 - catPull * 0.82);
            const cy = ALTAR_Y - 72 + (c.y - (ALTAR_Y - 72)) * (1 - catPull * 0.82);
            const sc = EASE.back(popT) * (1 - catPull * 0.35);
            return (
              <div key={idx}>
                <EnergyStream x0={cx} y0={cy} x1={STAGE_X} y1={ALTAR_Y - 76} f={f} start={c.at + 8} end={IMPACT} color={c.color} core={c.core} seed={31 + idx * 17} />
                <div style={{position: 'absolute', left: cx - 72, top: cy - 72, transform: `scale(${sc})`}}>
                  <DiamondFrame size={144} tier={c.tier} glow={c.color}>
                    <ItemIcon3D src={itemTex(catalysts[idx])} size={78} depth={5} glow={c.core} />
                  </DiamondFrame>
                </div>
                {f >= c.at && f < c.at + 10 && <CrossFlash x={c.x} y={c.y} at={c.at} arm={96} thick={10} color={c.core} dur={10} />}
              </div>
            );
          })}

        {/* Act II: Forged 3D Voxel Weapon Floating Above Altar */}
        {forged && (
          <div
            style={{
              position: 'absolute',
              left: STAGE_X - 150,
              top: STAGE_Y - 165 + weaponBob,
              width: 300,
              height: 300,
              transform: `scale(${weaponScale}) rotate(-6deg)`,
            }}
          >
            <SpinItem src={itemTex(item)} size={300} theta={theta} glow={equipped ? 'rgba(255,230,120,0.95)' : 'rgba(255,165,40,0.8)'} slices={16} />
          </div>
        )}

        {/* Impact Shockwave (pixel cross + stepped shards, NO expanding rings) & Sparks */}
        <Shockwave x={STAGE_X} y={STAGE_Y} at={IMPACT} color="#FFE680" maxR={420} life={22} width={22} rays={16} seed={7} />
        <CrossFlash x={STAGE_X} y={STAGE_Y} at={IMPACT} arm={240} thick={16} color="#FFFFFF" dur={12} />
        <Fountain x={STAGE_X} y={ALTAR_Y - 50} at={IMPACT} count={44} seed={11} colors={['#FFE680', '#FCD448', '#CD2ECD', '#FFFFFF']} spread={0.85} speed={1.15} life={46} size={12} />
        <Particles parts={forgeSparks} at={IMPACT} glow />

        {/* Twinkling pixel stars around the forged weapon */}
        {forged &&
          [
            [-180, -160],
            [185, -140],
            [-195, 90],
            [175, 110],
          ].map(([dx, dy], i) => <Twinkle key={i} x={STAGE_X + dx} y={STAGE_Y + dy} t={((f + i * 9) % 32) / 32} u={6} c={i % 2 === 0 ? '#FFF2B0' : '#F7C8F7'} />)}

        {/* ================================================= BOTTOM-LEFT: HERO & LOADOUT CARD (x=84, y=696) ================================================= */}
        <div style={{position: 'absolute', left: 84, top: 696, opacity: stepped(win(f, 6, 10), 4)}}>
          <CutPanel w={800} h={300} cuts={[22, 22, 22, 22]} fill="#14121A" edge={equipped ? '#FCD448' : '#3E3A48'} edgeW={equipped ? 4 : 3} glow="rgba(140,36,28,0.45)" corners={!equipped}>
            <Shine at={156} dur={16} w={110} opacity={0.32} color="#FFF2A8" />
            <div style={{position: 'absolute', left: 32, top: 28, width: 220, height: 244}}>
              <div style={{position: 'absolute', left: 54, top: 12}}>
                <PlayerFigure skin={skin} scale={7} />
              </div>
              <div style={{position: 'absolute', left: 0, top: 4}}>
                <LevelBadge level={level} w={84} accent="purple" />
              </div>
            </div>

            <div style={{position: 'absolute', left: 256, right: 28, top: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <BulletDiamond size={24} color="#FCD448" hole="#14121A" />
                <McdText size={28} weight={800} color="#FFFFFF">
                  {player}
                </McdText>
                <RarityTag rarity="gilded" size={18} text="GILDED 宗师" />
              </div>
              <div style={{transform: `scale(${equipped ? 1 + 0.14 * Math.sin(win(f, 156, 10) * Math.PI) : 1})`}}>
                <PowerBadge power={shownPower} w={58} />
              </div>
            </div>

            <div style={{position: 'absolute', left: 256, top: 146, display: 'flex', gap: 20}}>
              {[
                {id: item, rarity: (forged ? 'gilded' : 'unique') as 'gilded' | 'unique', pwr: shownPower, sel: forged, isNew: forged},
                {id: 'totem_of_undying', rarity: 'unique' as const, pwr: 252, sel: false, isNew: false},
                {id: 'golden_apple', rarity: 'rare' as const, pwr: 248, sel: false, isNew: false},
                {id: 'ender_pearl', rarity: 'unique' as const, pwr: 255, sel: false, isNew: false},
              ].map((g, i) => (
                <div
                  key={i}
                  style={{
                    transform: i === 0 && forged ? `scale(${0.86 + 0.14 * EASE.back(win(f, IMPACT + 4, 10))})` : undefined,
                  }}
                >
                  <BevelSlot size={114} rarity={g.rarity} selected={g.sel} isNew={g.isNew} count={g.pwr} drop>
                    <ItemIcon3D src={itemTex(g.id)} size={72} depth={5} />
                  </BevelSlot>
                </div>
              ))}
            </div>
          </CutPanel>
        </div>

        {/* ================================================= RIGHT HALF: GILDED WEAPON & ENCHANTMENT PANEL (x=936, y=80) ================================================= */}
        {f >= 4 && (
          <div style={{position: 'absolute', left: 936, top: 80, opacity: panelT, transform: `translateX(${panelDx}px)`}}>
            <CutPanel
              w={900}
              h={916}
              cuts={[28, 28, 28, 28]}
              fill="#16141C"
              edge={equipped ? '#FFE680' : forged ? '#E8B428' : '#4A3E54'}
              edgeW={equipped ? 5 : forged ? 4 : 3}
              glow={forged ? 'rgba(248,180,48,0.28)' : 'rgba(140,40,160,0.22)'}
              corners
            >
              <Shine at={IMPACT} dur={16} w={130} opacity={0.32} color="#FFE680" />
              <Shine at={156} dur={16} w={140} opacity={0.38} color="#FFFFFF" />

              {/* Row 1 (y=28..82): Power Number + Sword Icon + UNIQUE + GILDED Rarity Tags */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 28, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <PxText text={shownPower} px={6} color={forged ? '#FFFFFF' : '#B8B4C4'} />
                  <PxIcon rows={SWORD_ROWS} px={4} color={forged ? '#FCD448' : '#9A96A8'} />
                  <RarityTag rarity="unique" size={20} text="UNIQUE 独特" />
                  {forged ? (
                    <div style={{transform: `scale(${0.8 + 0.2 * EASE.back(win(f, IMPACT, 10))})`}}>
                      <RarityTag rarity="gilded" size={20} text="GILDED 镀金" />
                    </div>
                  ) : (
                    <RarityTag rarity="common" size={20} text="FORGING 重铸中" />
                  )}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <PxArt rows={EMERALD_ROWS} pal={EMERALD_PAL} px={3} />
                  <McdText size={20} weight={700} color={forged ? '#FCD448' : '#B0A8C0'}>
                    {forged ? 'TIER III · 神话锻造' : `圣物共鸣 ${Math.round(forgeCharge * 100)}%`}
                  </McdText>
                </div>
              </div>

              {/* Row 2 (y=92..182): Character-by-character Hard-Shadow Weapon Title (cjkRows=18, px=5 -> 90px tall, crisp strokes) */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 92, height: 90, display: 'flex', alignItems: 'center'}}>
                <PxChars
                  text={name}
                  px={5}
                  cjkRows={18}
                  gap={2}
                  color={forged ? '#FFE680' : '#D8D4E4'}
                  hi={forged ? '#FFF8D0' : '#FFFFFF'}
                  shadowColor={forged ? '#2A1600' : '#0E0A16'}
                  glyph={(i) => {
                    const t = win(f, 10 + i * 2, 8);
                    const s = EASE.back(t);
                    const bump = forged && f < IMPACT + 12 ? Math.sin(win(f, IMPACT + i, 8) * Math.PI) * -8 : 0;
                    return {
                      opacity: t > 0 ? 1 : 0,
                      transform: `translateY(${snap((1 - t) * -20 + bump, 2)}px) scale(${0.75 + 0.25 * s})`,
                    };
                  }}
                />
              </div>

              {/* Row 3 (y=190..220): Subtitle Description (strictly above GoldRule at y=228) */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 190, height: 28, display: 'flex', alignItems: 'center'}}>
                <McdText size={22} color="#C8C2CE">
                  {forged ? desc : '三枚远古圣物正在注入铁砧核心，重击后解锁内置镀金词条与三连附魔槽。'}
                </McdText>
              </div>

              {/* Divider Rule (y=228..244) */}
              <div style={{position: 'absolute', left: 48, top: 228}}>
                <GoldRule w={804} color={forged ? '#E8B428' : '#5A4E68'} />
              </div>

              {/* Row 4 (y=252..380): 3 Trait Lines (or Catalyst Resonance Progress before IMPACT) */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 252, display: 'flex', flexDirection: 'column', gap: 10}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14, height: 34}}>
                  <BulletDiamond size={24} color="#B8BEC8" hole="#16141C" />
                  <McdText size={24} weight={700} color="#FFFFFF">
                    {traits[0]}
                  </McdText>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 14, height: 34}}>
                  <DiamondFrame size={30} tier="unique" />
                  <McdText size={23} weight={700} color="#FFB060">
                    {traits[1]}
                  </McdText>
                </div>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 40,
                    padding: '0 14px',
                    background: forged ? 'rgba(240,200,88,0.14)' : 'rgba(90,42,140,0.18)',
                    boxShadow: `inset 4px 0 0 ${forged ? '#FCD448' : '#AB64FF'}`,
                  }}
                >
                  <Shine at={IMPACT + 4} dur={14} w={90} opacity={0.35} color="#FFF2A8" />
                  <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                    <DiamondFrame size={30} tier={forged ? 'gilded' : 'enchant'} />
                    <McdText size={23} weight={700} color={forged ? '#FFE680' : '#D8B8FF'}>
                      {forged ? traits[2] : '正在熔铸镀金词条：下界合金锭 + 回响碎片 + 下界之星'}
                    </McdText>
                  </div>
                  <RarityTag rarity={forged ? 'gilded' : 'rare'} size={16} text={forged ? 'TIER III' : `${Math.round(forgeCharge * 100)}%`} />
                </div>
              </div>

              {/* Row 5 (y=396..454): Three Stat Bars (POWER / SPEED / AREA) */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 396, display: 'flex', justifyContent: 'space-between'}}>
                {stats.map((st, i) => {
                  const barT = forged ? stepQ(EASE.out(win(f, IMPACT + 8 + i * 5, 22)), 16) : stepQ(forgeCharge * 0.45, 8);
                  const fillPct = st.ratio * 100 * barT;
                  const done = f >= IMPACT + 30 + i * 5;
                  return (
                    <div key={st.label} style={{width: 252}}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <McdText size={20} weight={800} color="#D8D4E0" style={{letterSpacing: 1.5}}>
                          {st.label}
                        </McdText>
                        <PxText text={Math.round(Number(st.value) * barT)} px={3} color={done ? '#FFE680' : '#FFFFFF'} />
                      </div>
                      <div style={{position: 'relative', marginTop: 8, height: 18, background: '#0C0A10', boxShadow: '0 0 0 3px #000, inset 0 0 0 2px #2E2A36'}}>
                        {[0.25, 0.5, 0.75].map((k) => (
                          <div key={k} style={{position: 'absolute', left: `${k * 100}%`, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.12)'}} />
                        ))}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${fillPct}%`,
                            background: done ? 'linear-gradient(180deg,#FFF2A8 0 35%,#FCD448 35% 100%)' : 'linear-gradient(180deg,#FFFFFF 0 35%,#B8B4C4 35% 100%)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 6 (y=470..500): Enchantments Header (cleanly separated from diamonds at y=514) */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 470, height: 28, display: 'flex', alignItems: 'center', gap: 18}}>
                <div style={{flex: 1, height: 3, background: '#5A2A8C'}} />
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <PxText text="ENCHANTMENTS" px={3} color="#D28CFF" shadowColor="#1A0828" />
                  <McdText size={22} weight={800} color="#E2C0FF" style={{letterSpacing: 2}}>
                    附魔觉醒
                  </McdText>
                </div>
                <div style={{flex: 1, height: 3, background: '#5A2A8C'}} />
              </div>

              {/* Galactic Runes behind the 3 Enchantment Diamonds */}
              <Runes count={6} px={8} color="#6A34A8" opacity={0.3} style={{position: 'absolute', left: 120, top: 536}} />

              {/* Row 7 (y=514..756): Three EnchantSlot Diamonds (size=168 -> bottom at 682, labels 690..748) */}
              <div style={{position: 'absolute', left: 48, right: 48, top: 514, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start'}}>
                {enchants.slice(0, 3).map((en, i) => {
                  const at = enchAt[i];
                  const lit = f >= at;
                  const pop = lit ? 0.84 + 0.16 * EASE.back(win(f, at, 9)) : 1;
                  const ic = ENCH_ICON_MAP[en.icon];
                  return (
                    <div key={en.name} style={{position: 'relative', width: 230, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <div style={{transform: `scale(${pop})`}}>
                        <EnchantSlot size={168} lit={lit} tier={en.tier} selected={lit && f < at + 14} icon={<PxArt rows={ic.rows} pal={ic.pal} px={8} />} />
                      </div>
                      <div style={{marginTop: 8, textAlign: 'center'}}>
                        <McdText size={24} weight={700} color={lit ? '#FFFFFF' : '#7E768A'} style={{display: 'block'}}>
                          {lit ? en.name : '待觉醒槽位'}
                        </McdText>
                        <McdText
                          size={17}
                          weight={800}
                          color={i === 2 ? '#FCD448' : MCD.powerful}
                          style={{letterSpacing: 1.5, visibility: lit ? 'visible' : 'hidden', display: 'block', marginTop: 2}}
                        >
                          {en.tag}
                        </McdText>
                      </div>
                      {f >= at && f < at + 12 && (
                        <>
                          <CrossFlash x={115} y={84} at={at} arm={96} thick={10} color={i === 2 ? '#FFE680' : '#E2C0FF'} dur={10} />
                          <Burst x={115} y={84} at={at} count={18} seed={41 + i * 7} colors={['#E2C0FF', '#AB64FF', '#FFE680', '#FFFFFF']} speed={0.95} life={20} size={10} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row 8 (y=796..876): Bottom MainButton Equip Action */}
              <div style={{position: 'absolute', left: 0, right: 0, top: 796, display: 'flex', justifyContent: 'center'}}>
                <MainButton label={equipped ? '已装备 · EQUIPPED' : button} tone={equipped ? 'gold' : 'green'} w={560} h={80} keycap="E" hold={holdProg} press={pressProg} textPx={3} />
              </div>
              {equipped && <Burst x={450} y={836} at={156} count={24} seed={99} colors={['#FFE680', '#FCD448', '#FFFFFF']} speed={1.1} life={18} size={10} />}
            </CutPanel>
          </div>
        )}

        {/* Foreground Drifting Golden Embers */}
        <Embers count={32} color="#FCD448" core="#FFF8D0" area={[80, 80, 1760, 920]} size={8} seed={29} speed={0.85} style={{opacity: 0.75}} />
      </AbsoluteFill>

      {/* Stepped Flash Cues (peak <= 0.40 so it never washes out footage) */}
      <WhiteFlash at={IMPACT} dur={6} peak={0.4} steps={3} color="#FFF2C8" />
      <WhiteFlash at={156} dur={5} peak={0.22} steps={2} color="#FFF6D8" />

      {/* Authentic Minecraft Sound Cues */}
      {audio && (
        <>
          <Sfx at={12} src={mcSound('random/anvil_land')} volume={0.38} rate={0.95} />
          {catSpots.map((c, i) => (
            <Sfx key={i} at={c.at} src={mcSound('block/end_portal/eyeplace1')} volume={0.35} rate={0.95 + i * 0.12} />
          ))}
          <Sfx at={IMPACT} src={mcSound('random/anvil_use')} volume={0.55} rate={0.92} />
          <Sfx at={IMPACT} src={mcSound('block/smithing_table/smithing_table1')} volume={0.5} rate={1.0} />
          <Sfx at={IMPACT + 2} src={mcSound('block/beacon/activate')} volume={0.4} rate={1.1} />
          {enchAt.map((a, i) => (
            <Sfx key={a} at={a} src={mcSound('random/orb')} volume={0.4} rate={1.0 + i * 0.18} />
          ))}
          <Sfx at={enchAt[2]} src={mcSound('block/enchantment_table/enchant1')} volume={0.45} rate={1.05} />
          <Sfx at={156} src={mcSound('item/armor/equip_netherite1')} volume={0.5} rate={1.0} />
          <Sfx at={156} src={mcSound('ui/toast/challenge_complete')} volume={0.38} rate={1.05} />
        </>
      )}
    </AbsoluteFill>
  );
};
void Img;
