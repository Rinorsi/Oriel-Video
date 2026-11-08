// mcd-s-item-showcase: item detail showcase. Target: inventory-gear.png detail area (item level + COMMON tag, big name, damage line, power/speed/area bars,
// enchantment diamonds) with the item as a big voxel slab (real item texture, stacked slices) that spins in, then floats.
// Props: bg, item (item texture id), name, rarity, desc, damage, enchants.
import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {Rise} from '../mcdkit/common';
import {
  DiamondFrame,
  ENCH_FLAME,
  ENCH_FLAME_PAL,
  ENCH_HEART,
  ENCH_HEART_PAL,
  ENCH_PIERCE,
  ENCH_PIERCE_PAL,
  EnchantSlot,
  Embers,
  McdBackdrop,
  McdText,
  PxArt,
  PxText,
  RarityTag,
  WhiteFlash,
  itemTex,
} from '../mcdkit/kit';
import {At, EASE, GroundShadow, Particles, PxPlus, Sfx, Twinkle, genParts, mcSound, snap, stepped, win} from './common';

const TOTAL = 180;

/** Item as a stack of slices turning around the vertical axis (theta radians). Front slice bright, middle slices dark = visible thickness. */
export const SpinItem: FC<{src: string; size: number; theta: number; glow?: string; slices?: number}> = ({src, size, theta, glow, slices = 14}) => {
  const T = size * 0.1;
  let c = Math.cos(theta);
  const s = Math.sin(theta);
  const sign = c < 0 ? -1 : 1;
  c = sign * Math.max(0.07, Math.abs(c));
  const order = Array.from({length: slices}, (_, j) => j);
  if (c < 0) order.reverse();
  return (
    <div style={{position: 'relative', width: size, height: size, filter: glow ? `drop-shadow(0 0 ${size * 0.08}px ${glow})` : undefined}}>
      {order.map((j, k) => {
        const z = (j / (slices - 1) - 0.5) * T;
        const top = k === slices - 1;
        const edge = j === 0 || j === slices - 1;
        return (
          <Img
            key={j}
            src={src}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: size,
              height: size,
              imageRendering: 'pixelated',
              transform: `translateX(${z * s}px) scaleX(${c})`,
              filter: `brightness(${top ? 1.04 : edge ? 0.7 : 0.4 + 0.12 * Math.abs(s)}) ${top ? '' : 'saturate(0.8)'}`,
            }}
          />
        );
      })}
    </div>
  );
};

const TONE = {
  common: {tier: 'common', glow: 'rgba(230,232,240,0.5)', light: 'rgba(200,205,220,0.35)', spark: '#FFFFFF', label: '普通'},
  rare: {tier: 'rare', glow: 'rgba(80,225,170,0.55)', light: 'rgba(60,200,150,0.35)', spark: '#7CFFC8', label: '稀有'},
  unique: {tier: 'unique', glow: 'rgba(255,148,0,0.6)', light: 'rgba(255,120,20,0.4)', spark: '#FFC45A', label: '独特'},
} as const;

export const Showcase: FC<{bg?: boolean; audio?: boolean; item?: string; name?: string; rarity?: keyof typeof TONE; desc?: string; damage?: string; level?: number; stats?: [string, number][]; enchantLabel?: string}> = ({
  bg,
  audio = bg,
  item = 'diamond_sword',
  name = '寒焰之刃',
  rarity = 'unique',
  desc = '霜与火交织的刃，斩过之处留下灼痕。',
  damage = '24-40 近战伤害',
  level = 7,
  stats = [
    ['威力', 0.74],
    ['速度', 0.38],
    ['范围', 0.52],
  ],
  enchantLabel = '附魔',
}) => {
  const f = useCurrentFrame();
  const t = TONE[rarity];
  const out = 1 - win(f, TOTAL - 18, 14);
  const o = stepped(out, 4);
  const CX = 520;
  const CY = 548;
  const stageT = EASE.back(win(f, 0, 12));
  const inT = win(f, 8, 70);
  const theta = (1 - EASE.out(inT)) * Math.PI * 6 + (f > 70 ? 0.55 * Math.sin((f - 70) * 0.065) * Math.min(1, win(f, 70, 24)) : 0);
  const bob = f > 24 ? Math.sin((f - 24) * 0.09) * 14 : 0;
  const itemScale = 0.7 + 0.3 * EASE.out(win(f, 8, 14)) + (f >= 8 && f < 16 ? 0.12 : 0);
  const itemOp = stepped(win(f, 8, 5), 3);
  const embers = genParts({n: 30, seed: 61, x: CX, y: 700, sx: 300, sy: 40, a0: -Math.PI * 0.62, a1: -Math.PI * 0.38, v0: 0.8, v1: 3.2, drag: 0.02, life0: 60, life1: 110, delay: 120, size0: 6, size1: 12, colors: [t.spark, '#FFFFFF'], kinds: ['sq', 'bar']});
  const enchAt = [100, 118, 136];
  const icons = [
    {rows: ENCH_FLAME, pal: ENCH_FLAME_PAL},
    {rows: ENCH_PIERCE, pal: ENCH_PIERCE_PAL},
    {rows: ENCH_HEART, pal: ENCH_HEART_PAL},
  ];
  const bars = stats;
  const X0 = 1030;
  return (
    <AbsoluteFill>
      {bg ? <McdBackdrop kind="inventory" drift={f * 0.35} cell={44} /> : null}
      {bg && <AbsoluteFill style={{background: `radial-gradient(ellipse 36% 52% at 27% 52%, ${t.light}, rgba(0,0,0,0) 72%)`, opacity: stepped(win(f, 4, 14), 4)}} />}
      <AbsoluteFill style={{opacity: o}}>
        {/* stage diamond */}
        <At cx={CX} cy={CY + 10}>
          <div style={{transform: `scale(${0.8 + 0.2 * stageT})`, opacity: stepped(win(f, 0, 6), 3)}}>
            <DiamondFrame size={840} tier={t.tier} glow={t.glow} />
          </div>
        </At>
        <GroundShadow cx={CX} y={CY + 280 - bob * 0.3} w={300 - bob * 4} o={0.5 * itemOp} u={8} />
        {/* the item */}
        <At cx={CX} cy={CY + bob}>
          <div style={{opacity: itemOp, transform: `scale(${itemScale}) rotate(${-4}deg)`}}>
            <SpinItem src={itemTex(item)} size={520} theta={theta} glow={t.glow} />
          </div>
        </At>
        <Particles parts={embers} at={0} />
        {f >= 18 && f < 26 && <PxPlus x={CX + 170} y={CY - 170} u={10} arm={8 - (f - 18)} c={t.spark} core="#fff" />}
        {[0, 1, 2, 3].map((i) => {
          const pos = [[-200, -230], [230, -120], [-250, 120], [190, 230]][i];
          return f > 30 ? <Twinkle key={i} x={CX + pos[0]} y={CY + pos[1]} t={((f + i * 13) % 40) / 40} u={6} c={t.spark} /> : null;
        })}

        {/* detail column */}
        <div style={{position: 'absolute', left: X0, top: 150}}>
          <Rise at={24} dur={8} dy={16}>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <PxText text={level} px={5} />
              <svg width={38} height={38} viewBox="0 0 10 10" shapeRendering="crispEdges">
                <polygon points="5,0 10,5 5,10 0,5" fill="#9AA0AA" />
                <polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill="#16100C" />
              </svg>
              <RarityTag rarity={rarity} size={26} text={t.label} />
            </div>
          </Rise>
          <div style={{marginTop: 26}}>
            <Rise at={30} dur={8} dy={20}>
              <PxText text={name} px={8} />
            </Rise>
          </div>
          <div style={{marginTop: 30}}>
            <Rise at={40} dur={8} dy={14}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <div style={{width: 52, height: 52, background: '#2A2A2E', boxShadow: '0 0 0 3px #000, inset 0 0 0 3px #4A4A50', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Img src={itemTex(item)} style={{width: 36, height: 36, imageRendering: 'pixelated'}} />
                </div>
                <McdText size={38} weight={600}>{damage}</McdText>
              </div>
            </Rise>
          </div>
          <div style={{marginTop: 20, width: 700}}>
            <Rise at={46} dur={8} dy={14}>
              <McdText size={30} color="#C4BEBE">{desc}</McdText>
            </Rise>
          </div>
          {/* stat bars */}
          <div style={{marginTop: 54, display: 'flex', gap: 34}}>
            {bars.map(([label, v], i) => (
              <Rise key={label} at={56 + i * 5} dur={8} dy={10}>
                <div style={{width: 224}}>
                  <McdText size={24} weight={800} color="#D4D0D0" style={{letterSpacing: 2}}>{label}</McdText>
                  <div style={{position: 'relative', marginTop: 10, height: 12, background: '#2E2A2C', boxShadow: '0 0 0 3px #000'}}>
                    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${v * 100 * EASE.out(win(f, 62 + i * 6, 26))}%`, background: '#FFFFFF'}} />
                  </div>
                </div>
              </Rise>
            ))}
          </div>
          {/* enchantments */}
          <div style={{marginTop: 64, width: 700}}>
            <Rise at={86} dur={8} dy={10}>
              <div style={{textAlign: 'center'}}>
                <McdText size={34} weight={700}>{enchantLabel}</McdText>
              </div>
            </Rise>
            <div style={{display: 'flex', justifyContent: 'center', gap: 56, marginTop: 14}}>
              {enchAt.map((a, i) => {
                const lit = f >= a;
                const pop = lit ? 0.86 + 0.14 * EASE.back(win(f, a, 8)) : 1;
                return (
                  <div key={i} style={{position: 'relative', opacity: stepped(win(f, 90 + i * 3, 6), 3)}}>
                    <EnchantSlot size={190} lit={lit} tier={['III', 'II', 'I'][i]} icon={<PxArt rows={icons[i].rows} pal={icons[i].pal} px={10} />} style={{transform: `scale(${pop})`}} />
                    {f >= a && f < a + 7 && <PxPlus x={95} y={95} u={9} arm={6 - (f - a)} c="#E2C0FF" core="#fff" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Embers count={22} color={t.spark} area={[0, 300, 1920, 780]} size={8} seed={23} speed={0.6} style={{opacity: win(f, 30, 20) * 0.7}} />
      </AbsoluteFill>
      <WhiteFlash at={8} dur={5} peak={0.22} steps={2} />
      {audio && (
        <>
          <Sfx at={8} src={mcSound('random/anvil_use')} volume={0.2} rate={1.2} />
          {enchAt.map((a) => <Sfx key={a} at={a} src={mcSound('random/orb')} volume={0.3} rate={1 + (a - 100) / 100} />)}
        </>
      )}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-item-showcase',
      name: '物品展示 · 旋转体素大图',
      category: 'rpg',
      tags: ['地下城', '物品', '3D', '附魔', '稀有度', '详情'],
      frames: TOTAL,
      blurb: '真实物品贴图叠成体素厚片，在稀有度色菱形舞台上快速自转后减速停住并轻摆悬浮；右侧等级+稀有度标签、大字名称、伤害行、三条属性条依次升起，三个附魔菱形槽逐个点亮。',
      usage: '展示武器/新物品/打赏礼物/周边的详情页：左侧大图 + 右侧参数。item、name、rarity 可换，附魔图标可换成别的像素图标。',
      params: [
        {name: 'item', desc: '物品贴图 id（diamond_sword、bow、netherite_axe…）'},
        {name: 'name / desc / damage / level', desc: '名称、描述、伤害行、等级数字'},
        {name: 'rarity', desc: 'common | rare | unique，决定菱形舞台、光效和标签颜色'},
        {name: 'bg', desc: '是否绘制红棕界面底（Demo 开，Layer 关）'},
      ],
    },
    Demo: () => <Showcase bg />,
    Layer: () => <Showcase />,
  },
];
void snap;
