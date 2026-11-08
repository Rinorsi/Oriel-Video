// mcd-s-chest-reveal: chest opening. Target: chest-reveal-idle.png -> chest-open-light-beam.png -> chest-open-sparkles.png -> chest-item-card.png.
// Real ender-chest texture built as a CSS-3D box (lid hinged at the back). Shakes, then the lid flips, a magenta beam with a white core bursts out
// in 4 frames, pixel sparks shoot up, and ~1.2 s later a gold-diamond item card (rarity coloured) pops in.
// Props: bg, item (item texture id), name, rarity ('common'|'rare'|'unique'), desc, power.
import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import type {FxEntry} from '../../types';
import {CutPanel, DiamondFrame, ItemIcon3D, MCD, MainButton, McdText, PxText, RarityTag, WhiteFlash, itemTex} from '../mcdkit/kit';
import {At, Beam, Backdrop, EASE, GroundShadow, IsoGlow, Particles, PxPlus, Sfx, Twinkle, genParts, mcSound, snap, stepped, win} from './common';

const TOTAL = 180;
const OPEN_AT_DEFAULT = 66;

type Rect = [number, number, number, number];
type UV = {top: Rect; bottom: Rect; right: Rect; front: Rect; left: Rect; back: Rect};

/** CSS-3D textured box centred on its own origin. Dimensions in texels, `s` = px per texel. */
const Box: FC<{src: string; w: number; h: number; d: number; uv: UV; s: number; shade?: Partial<Record<keyof UV, number>>; children?: ReactNode}> = ({src, w, h, d, uv, s, shade = {}, children}) => {
  const face = (k: keyof UV, fw: number, fh: number, transform: string, br: number, extra?: ReactNode) => {
    const r = uv[k];
    const st: CSSProperties = {
      position: 'absolute',
      left: (-fw * s) / 2,
      top: (-fh * s) / 2,
      width: fw * s,
      height: fh * s,
      backgroundImage: `url(${src})`,
      backgroundSize: `${64 * s}px ${64 * s}px`,
      backgroundPosition: `${-r[0] * s}px ${-r[1] * s}px`,
      imageRendering: 'pixelated',
      transform,
      backfaceVisibility: 'hidden',
      filter: `brightness(${shade[k] ?? br})`,
    };
    return <div style={st}>{extra}</div>;
  };
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d'}}>
      {face('front', w, h, `translateZ(${(d * s) / 2}px)`, 0.86)}
      {face('back', w, h, `rotateY(180deg) translateZ(${(d * s) / 2}px)`, 0.5)}
      {face('right', d, h, `rotateY(90deg) translateZ(${(w * s) / 2}px)`, 0.62)}
      {face('left', d, h, `rotateY(-90deg) translateZ(${(w * s) / 2}px)`, 0.74)}
      {face('top', w, d, `rotateX(90deg) translateZ(${(h * s) / 2}px)`, 1.05)}
      {face('bottom', w, d, `rotateX(-90deg) translateZ(${(h * s) / 2}px)`, 0.4)}
      {children}
    </div>
  );
};

const BASE_UV: UV = {top: [14, 19, 14, 14], bottom: [28, 19, 14, 14], right: [0, 33, 14, 10], front: [14, 33, 14, 10], left: [28, 33, 14, 10], back: [42, 33, 14, 10]};
const LID_UV: UV = {top: [14, 0, 14, 14], bottom: [28, 0, 14, 14], right: [0, 14, 14, 5], front: [14, 14, 14, 5], left: [28, 14, 14, 5], back: [42, 14, 14, 5]};

/** Ender chest (metal with purple glow eyes). lid: 0 closed .. 1 fully open (115 degrees). glow: interior light 0..1. */
const Chest3D: FC<{s?: number; lid?: number; glow?: number; eye?: number}> = ({s = 22, lid = 0, glow = 0, eye = 0.6}) => {
  const src = tex('entity/chest/ender.png');
  const ang = lid * 112;
  return (
    <div style={{position: 'relative', width: 0, height: 0, transformStyle: 'preserve-3d', transform: 'perspective(1700px) rotateX(-26deg) rotateY(-24deg)'}}>
      {/* woven rug lying under the chest (CSS-3D plane) */}
      <div style={{position: 'absolute', left: -17 * s, top: -17 * s, width: 34 * s, height: 34 * s, transform: `translateY(${10 * s + 1}px) rotateX(90deg)`, background: '#2A2530', boxShadow: `inset 0 0 0 ${s * 1.1}px #12101A, inset 0 0 0 ${s * 2.2}px #7A6238, inset 0 0 0 ${s * 3.3}px #1E1B26`}}>
        <div style={{position: 'absolute', inset: s * 3.3, backgroundImage: `repeating-linear-gradient(45deg, rgba(140,112,64,0.28) 0 ${s * 0.45}px, rgba(0,0,0,0) ${s * 0.45}px ${s * 4}px), repeating-linear-gradient(-45deg, rgba(140,112,64,0.28) 0 ${s * 0.45}px, rgba(0,0,0,0) ${s * 0.45}px ${s * 4}px)`}} />
      </div>
      {/* base: centre at y = +5 texels (spans 0..10 below the hinge line) */}
      <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateY(${5 * s}px)`}}>
        <Box src={src} w={14} h={10} d={14} uv={BASE_UV} s={s}>
          {/* inner glow lying on the base opening */}
          <div
            style={{
              position: 'absolute',
              left: -7 * s + s,
              top: -7 * s + s,
              width: 12 * s,
              height: 12 * s,
              transform: `rotateX(90deg) translateZ(${5 * s + 1}px)`,
              background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${0.95 * glow}) 0%, rgba(240,110,240,${0.9 * glow}) 38%, rgba(160,30,170,${0.6 * glow}) 70%, rgba(40,0,50,${0.7 * glow}) 100%)`,
            }}
          />
        </Box>
      </div>
      {/* lid hinged on the rear edge of the base opening */}
      <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-7 * s}px) rotateX(${ang}deg)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translate3d(0px, ${-2.5 * s}px, ${7 * s}px)`}}>
          <Box src={src} w={14} h={5} d={14} uv={LID_UV} s={s}>
            {/* latch + two glowing eyes on the lid front */}
            <div style={{position: 'absolute', left: -s, top: 0.5 * s, width: 2 * s, height: 4 * s, backgroundImage: `url(${src})`, backgroundSize: `${64 * s}px ${64 * s}px`, backgroundPosition: `${-1 * s}px ${-1 * s}px`, imageRendering: 'pixelated', transform: `translateZ(${7 * s + 1}px)`}} />
            {[-3.6, 3.6].map((x) => (
              <div key={x} style={{position: 'absolute', left: x * s - s * 0.6, top: -s * 0.3, width: s * 1.2, height: s * 0.9, background: '#F26BF2', opacity: 0.55 + 0.45 * eye, boxShadow: `0 0 ${s * 0.9}px #E040E0`, transform: `translateZ(${7 * s + 1.5}px)`}} />
            ))}
          </Box>
        </div>
      </div>
    </div>
  );
};

const RARITY_TIER = {common: 'common', rare: 'rare', unique: 'unique'} as const;
const RARITY_GLOW = {common: 'rgba(230,230,235,0.5)', rare: 'rgba(80,225,170,0.55)', unique: 'rgba(255,148,0,0.6)'} as const;
const RARITY_LABEL = {common: '普通', rare: '稀有', unique: '独特'} as const;

const ItemCard: FC<{f: number; item: string; name: string; rarity: keyof typeof RARITY_TIER; desc: string; power: number; button: string}> = ({f, item, name, rarity, desc, power, button}) => {
  const t = win(f, 0, 6);
  const sc = 0.9 + 0.1 * EASE.out(t);
  const flash = f >= 12 && f < 18 ? 1 - (f - 12) / 6 : 0;
  return (
    <div style={{position: 'absolute', left: 960 - 290, top: 120, opacity: stepped(t, 3), transform: `scale(${sc})`, transformOrigin: '50% 50%'}}>
      <CutPanel w={580} h={760} cuts={[0, 0, 0, 0]} fill="#24272D" edge="#3E444E" corners>
        <div style={{position: 'absolute', left: 140, top: 52, filter: flash ? `brightness(${1 + flash * 0.6})` : undefined}}>
          <DiamondFrame size={300} tier={RARITY_TIER[rarity]} glow={RARITY_GLOW[rarity]}>
            <ItemIcon3D src={itemTex(item)} size={176} depth={6} glow={RARITY_GLOW[rarity]} />
          </DiamondFrame>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
          <svg width={28} height={28} viewBox="0 0 10 10" shapeRendering="crispEdges">
            <polygon points="5,0 10,5 5,10 0,5" fill="#9AA0AA" />
            <polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill="#24272D" />
          </svg>
          <PxText text={power} px={4} />
          <RarityTag rarity={rarity} size={22} text={RARITY_LABEL[rarity]} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center'}}>
          <PxText text={name} px={5} />
        </div>
        <div style={{position: 'absolute', left: 60, right: 60, top: 548, textAlign: 'center'}}>
          <McdText size={26} color="#B8BEC8" style={{display: 'block'}}>{desc}</McdText>
        </div>
        <div style={{position: 'absolute', left: 90, top: 648}}>
          <MainButton label={button} w={400} h={76} />
        </div>
        <Twinkle x={150} y={110} t={((f + 3) % 26) / 26} u={4} c="#FFF2B0" />
        <Twinkle x={430} y={96} t={((f + 12) % 30) / 30} u={4} c="#FFFFFF" />
        <Twinkle x={440} y={300} t={((f + 20) % 28) / 28} u={4} c="#FFF2B0" />
      </CutPanel>
    </div>
  );
};

export const ChestReveal: FC<{bg?: boolean; audio?: boolean; item?: string; name?: string; rarity?: keyof typeof RARITY_TIER; desc?: string; power?: number; button?: string; openAt?: number}> = ({
  bg,
  audio = bg,
  item = 'trident',
  name = '雷鸣三叉戟',
  rarity = 'unique',
  desc = '古老的海中神兵，被闪电祝福过的锋刃。',
  power = 12,
  button = '回到营地',
  openAt = OPEN_AT_DEFAULT,
}) => {
  const f = useCurrentFrame();
  const OPEN_AT = openAt;
  const CARD_AT = OPEN_AT + 36;
  const CX = 960;
  const GROUND = 780;
  const S = 34;
  // chest entrance: drop + squash
  const drop = win(f, 0, 14);
  const dy = (1 - EASE.out(drop)) * -520 + (f > 14 && f < 20 ? Math.sin(((f - 14) / 6) * Math.PI) * -18 : 0);
  const sq = f >= 14 && f < 22 ? 1 - 0.12 * Math.sin(((f - 14) / 8) * Math.PI) : 1;
  // idle shake: a jolt every 12 frames, stronger near the open
  const pre = f >= 18 && f < OPEN_AT;
  const jolt = pre ? ((f - 18) % 12) / 12 : 1;
  const amp = pre ? 1 + 2 * win(f, 40, 26) : 0;
  const shx = pre && jolt < 0.4 ? Math.round(Math.sin(jolt * 40) * 6 * amp) : 0;
  const shr = pre && jolt < 0.4 ? Math.sin(jolt * 40) * 2.4 * amp : 0;
  const hop = pre && jolt < 0.25 ? -Math.sin((jolt / 0.25) * Math.PI) * 14 * Math.min(2, amp) : 0;
  const eye = pre ? 0.5 + 0.5 * Math.sin(f * 0.9) : 1;
  // lid: 4-frame flip
  const lidT = win(f, OPEN_AT, 4);
  const lid = Math.round(EASE.out(lidT) * 4) / 4;
  const open = f >= OPEN_AT;
  const glow = open ? Math.max(0.55, 1 - win(f, OPEN_AT + 30, 60) * 0.45) : 0.12 + 0.2 * (pre ? Math.max(0, Math.sin(f * 0.9)) : 0);
  // beam: 4 frame burst, thick for ~14 frames, then thins and fades
  const bg0 = f - OPEN_AT - 1;
  const grow = bg0 < 0 ? 0 : Math.min(1, (bg0 + 1) / 4);
  const widthK = bg0 < 0 ? 0 : bg0 < 14 ? 1 : 1 - 0.55 * win(bg0, 14, 26);
  const beamA = bg0 < 0 ? 0 : 1 - win(bg0, 18, 60) * 0.55;
  const mouthY = GROUND - 10 * S - 20;
  const sparks = genParts({n: 90, seed: 4, x: CX, y: mouthY, sx: 70, sy: 10, a0: -Math.PI * 0.5 - 0.55, a1: -Math.PI * 0.5 + 0.55, v0: 7, v1: 28, g: 0.02, drag: 0.07, life0: 34, life1: 70, size0: 8, size1: 18, colors: ['#CD2ECD', '#E56DE5', '#FFFFFF', '#AC19B3', '#F7C8F7'], kinds: ['sq', 'bar', 'plus', 'sq']});
  const floaters = genParts({n: 34, seed: 8, x: CX, y: mouthY - 80, sx: 120, sy: 160, a0: -Math.PI * 0.8, a1: -Math.PI * 0.2, v0: 0.5, v1: 2.2, drag: 0.03, life0: 50, life1: 90, delay: 14, size0: 6, size1: 12, colors: ['#CD2ECD', '#E56DE5', '#FFFFFF'], kinds: ['sq', 'plus']});
  const cardF = f - CARD_AT;
  const cardOut = 1 - win(f, TOTAL - 16, 12);
  const dimCard = win(f, CARD_AT - 6, 10) * 0.55 * (1 - win(f, TOTAL - 16, 12));
  const camShake = open && f < OPEN_AT + 9 ? Math.round(Math.sin((f - OPEN_AT) * 3.1) * 8 * (1 - (f - OPEN_AT) / 9)) : 0;

  return (
    <AbsoluteFill>
      {bg && (
        <Backdrop biome="forest-night" loop={TOTAL} dim={0.3} dark={0.3} sat={0.9}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 50% at 50% 70%, rgba(130,30,150,0.28), rgba(0,0,0,0) 70%)', opacity: 0.4 + (open ? 0.6 : 0)}} />
        </Backdrop>
      )}
      <AbsoluteFill style={{transform: `translate(${camShake}px, ${-camShake * 0.5}px)`}}>
        <IsoGlow cx={CX} cy={GROUND + 6} w={1100} color="#B02CC8" o={(open ? 0.85 : 0.32) * win(f, 4, 10)} />
        
        <div style={{position: 'absolute', left: CX + shx, top: GROUND - 10 + dy + hop, width: 0, height: 0, transform: `rotate(${shr}deg) scale(${1 / sq}, ${sq})`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', left: 0, top: -10 * S}}>
            <Chest3D s={S} lid={lid} glow={glow} eye={eye} />
          </div>
        </div>
        <Beam x={CX} y={mouthY + 24} kind="magenta" width={Math.round(300 * widthK)} grow={grow} alpha={beamA * (1 - dimCard * 0.8)} flick={0.94 + 0.06 * Math.sin(f * 2.3)} />
        <Particles parts={sparks} at={OPEN_AT + 1} glow />
        <Particles parts={floaters} at={OPEN_AT + 1} />
        {open && f < OPEN_AT + 6 && <PxPlus x={CX} y={mouthY + 18} u={10} arm={Math.round(8 - (f - OPEN_AT))} c="#F7C8F7" core="#fff" o={1} />}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#06020C', opacity: dimCard}} />
      {cardF >= 0 && (
        <div style={{opacity: cardOut}}>
          <ItemCard f={cardF} item={item} name={name} rarity={rarity} desc={desc} power={power} button={button} />
        </div>
      )}
      <WhiteFlash at={OPEN_AT + 1} dur={6} peak={0.6} steps={3} color="#FFE8FF" />
      {audio && (
        <>
          <Sfx at={OPEN_AT} src={mcSound('block/chest/open')} volume={0.6} />
          <Sfx at={OPEN_AT} src={mcSound('random/levelup')} volume={0.35} rate={0.8} />
          <Sfx at={CARD_AT} src={mcSound('ui/toast/in')} volume={0.4} />
          {[18, 30, 42, 54].map((a) => (
            <Sfx key={a} at={a} src={mcSound('dig/stone1')} volume={0.2} rate={1.4} />
          ))}
        </>
      )}
      <At cx={0} cy={0}>{null}</At>
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-chest-reveal',
      name: '开箱展示 · 品红光柱',
      category: 'rpg',
      tags: ['地下城', '开箱', '宝箱', '光柱', '物品卡'],
      frames: TOTAL,
      blurb: '紫眼金属宝箱落地后抖动蓄力，箱盖翻开的 4 帧内品红光柱（白核）冲天、像素粒子上喷，约 1.2s 后深色面板里的稀有度菱形框物品卡弹出。',
      usage: '揭晓“新功能/新素材/成品图”的悬念节点；把物品换成视频里要展示的东西，名称与稀有度可改。Layer 版去掉背景直接叠在录屏上。',
      params: [
        {name: 'item', desc: '物品贴图 id（如 trident、bow、diamond_sword）'},
        {name: 'name / desc / power', desc: '物品名、描述、数值'},
        {name: 'rarity', desc: 'common 白 / rare 绿 / unique 橙，决定菱形框与光效颜色'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <ChestReveal bg />,
    Layer: () => <ChestReveal />,
  },
];
void Img;
void snap;
