import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shake, Shockwave, Twinkles} from '../../../mc/Fx';
import {OreChip, OreText, TYPE, nine} from '../../../mg/Ore';
import {PixelSprite, SPRITES} from '../../flat';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE, Embers, FloatText, Glow, Glyph, Head, Item, OutlineT, Rays, Sheen, Stars, TAU, U, Vig, W, H, RAR, clamp01, jiggle, lerp, mulberry32, prog, snap, type RarityKey} from './kit';

/**
 * item-rarity-showcase: four item cards (common / uncommon / rare / epic) flip over one after another. Each rarity adds more:
 * none -> faint border pulse -> halo and light column -> purple blaze with rays, orbiting runes and rising particles.
 * Props: see RarityProps (cards, texts, flip timings, bg, audio). Four cards expected (the layout and finale are built for four).
 */

export type RarityCard = {
  /** 稀有度:common / uncommon / rare / epic(决定边框色与光效强度) */
  rar: RarityKey;
  /** 物品 id */
  id: string;
  /** 物品名称 */
  name: string;
  /** 说明行(最多两行为佳) */
  lines: string[];
  /** 星级 0-4 */
  stars: number;
  /** 是否带附魔光效 */
  glint?: boolean;
};
type CardDef = RarityCard;

export type RarityProps = {
  /** 是否绘制暗色渐变底、斜纹、史诗紫色背景光、飘尘与暗角;false 时只剩卡片/光柱/粒子/稀有度轨道 */
  bg?: boolean;
  /** 是否带音效 */
  audio?: boolean;
  /** 是否显示左上角标题块 */
  showHead?: boolean;
  /** 标题块主标题 */
  title?: string;
  /** 标题块副标题 */
  subtitle?: string;
  /** 标题块右上角英文标签 */
  tag?: string;
  /** 标题块图标物品 id */
  headIcon?: string;
  /** 四张卡:稀有度、物品、名称、说明、星级(按顺序从左到右翻出) */
  cards?: RarityCard[];
  /** 每张卡开始翻转的本地帧,长度 4 */
  flipAt?: number[];
  /** 稀有度显示名,缺省用默认「普通/罕见/稀有/史诗」 */
  rarityNames?: Partial<Record<RarityKey, string>>;
  /** 卡背上的符号 */
  backText?: string;
  /** 最后一张(史诗)翻出后的大字飘字 */
  finaleText?: string;
};
const DEFAULT_CARDS: CardDef[] = [
  {rar: 'common', id: 'iron_sword', name: '铁剑', lines: ['攻击伤害 6', '耐久 250'], stars: 1},
  {rar: 'uncommon', id: 'experience_bottle', name: '经验之瓶', lines: ['投掷后散出经验球', '经验 +3~11'], stars: 2, glint: true},
  {rar: 'rare', id: 'heart_of_the_sea', name: '海洋之心', lines: ['沉船宝藏中的遗物', '合成潮涌核心'], stars: 3},
  {rar: 'epic', id: 'golden_apple', name: '附魔金苹果', lines: ['抗性提升 V', '再生 II · 吸收 IV'], stars: 4, glint: true},
];
const CW = 390;
const CH = 700;
const GAP = 44;
const CX0 = (W - (4 * CW + 3 * GAP)) / 2;
const CY = 156;
const DEFAULT_TF = [18, 50, 82, 114];
const FLIP = 20;
const cardX = (i: number) => CX0 + i * (CW + GAP);
const cardC = (i: number): [number, number] => [cardX(i) + CW / 2, CY + 290];

const Back: FC<{col: string; i: number; text: string}> = ({col, i, text}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, ...nine('panel_raised', [2, 2, 2, 2]), backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 20, border: `8px dashed ${col}55`}} />
      <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(45deg, transparent 0 28px, ${col}18 28px 56px)`}} />
      <OutlineT size={144} color="#d4d6da" style={{transform: `translateY(${Math.sin(f * 0.12 + i) * 8}px)`}}>
        {text}
      </OutlineT>
    </div>
  );
};

type Cfg = {CARDS: CardDef[]; TF: number[]; names: Partial<Record<RarityKey, string>>; backText: string};

const Card: FC<{i: number; cfg: Cfg}> = ({i, cfg}) => {
  const {CARDS, TF, names, backText} = cfg;
  const f = useCurrentFrame();
  const d = CARDS[i];
  const r = {...RAR[d.rar], name: names[d.rar] ?? RAR[d.rar].name};
  const pop = prog(f, 4 + i * 3, 16, EASE.back);
  const flipT = clamp01((f - TF[i]) / FLIP);
  const angle = 180 * (1 - EASE.out(flipT));
  const lift = Math.sin(flipT * Math.PI) * -70;
  const revealed = f >= TF[i] + FLIP - 4;
  const since = f - (TF[i] + FLIP - 4);
  const allDone = f >= TF[3] + FLIP;
  const focus = allDone ? prog(f, TF[3] + FLIP, 14) : 0;
  const isEpic = d.rar === 'epic';
  const scale = (isEpic ? 1 + 0.07 * focus : 1 - 0.04 * focus) * pop;
  const idle = Math.sin(f * 0.08 + i * 1.4) * 5;
  const pulse = 0.6 + 0.4 * Math.sin(f * (isEpic ? 0.28 : 0.18) + i);
  const glowPx = d.rar === 'common' ? 0 : d.rar === 'uncommon' ? 18 : d.rar === 'rare' ? 34 : 56;
  const stripe = prog(f, TF[i] + 10, 24, (t) => t);
  const itemSize = 240;
  const bounce = revealed ? 1 + 0.12 * jiggle(clamp01(since / 18), 2.4, 3) : 1;

  return (
    <div style={{position: 'absolute', left: cardX(i), top: CY, width: CW, height: CH, perspective: 1800, opacity: clamp01(pop * 3), transform: `translateY(${lift + idle * (revealed ? 1 : 0)}px) scale(${scale})`, zIndex: isEpic ? 6 : 1}}>
      <div style={{position: 'relative', width: CW, height: CH, transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)`}}>
        <Back col={r.color} i={i} text={backText} />
        {/* front */}
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', boxShadow: revealed ? `0 0 ${glowPx * pulse}px ${r.glow}${isEpic ? 'dd' : '99'}, 0 ${6 * U}px 0 rgba(0,0,0,0.5)` : `0 ${6 * U}px 0 rgba(0,0,0,0.5)`}}>
          <div style={{position: 'absolute', inset: 0, ...nine('panel_raised', [2, 2, 2, 2])}} />
          <div style={{position: 'absolute', inset: 16, background: 'linear-gradient(180deg, #17181a 0%, #101112 100%)', boxShadow: `inset 0 0 0 6px ${r.color}${d.rar === 'common' ? '55' : 'cc'}`}} />
          {/* rarity strip */}
          <div style={{position: 'absolute', left: 16, top: 16, right: 16, height: 80, background: `linear-gradient(90deg, ${r.glow}55, ${r.glow}15)`, borderBottom: `6px solid ${r.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
            <div style={{width: 20, height: 20, background: r.color}} />
            <OutlineT size={48} color={r.color}>
              {r.name}
            </OutlineT>
            <div style={{width: 20, height: 20, background: r.color}} />
          </div>
          {/* item zone */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 110, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(closest-side, ${r.glow}${d.rar === 'common' ? '22' : '66'}, ${r.glow}00)`}} />
            <div style={{position: 'absolute', bottom: 22, width: 200, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.5)'}} />
            <div style={{transform: `translateY(${Math.sin(f * 0.1 + i) * 8 - 8}px) scale(${bounce})`}}>
              <Item id={d.id} size={itemSize} glint={d.glint} shadow={12} />
              {revealed && d.rar !== 'common' && <Sheen id={d.id} size={itemSize} hue={d.rar === 'epic' ? 'purple' : 'white'} speed={2.4} />}
            </div>
          </div>
          {/* name + lines */}
          <div style={{position: 'absolute', left: 16, right: 16, top: 452, textAlign: 'center'}}>
            <OutlineT size={48} color={r.color}>
              {d.name}
            </OutlineT>
            <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center'}}>
              {d.lines.map((l) => (
                <OreText key={l} size={TYPE.small} color="#a8a8a8">
                  {l}
                </OreText>
              ))}
            </div>
          </div>
          {/* stars */}
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 26, display: 'flex', justifyContent: 'center', gap: 12}}>
            {[0, 1, 2, 3].map((s) => (
              <div key={s} style={{opacity: s < d.stars ? 1 : 0.18, filter: s < d.stars ? `drop-shadow(0 0 8px ${r.glow})` : 'brightness(0.4)', transform: `scale(${s < d.stars && revealed ? 1 + 0.25 * jiggle(clamp01((since - s * 3) / 14), 2, 3) : 1})`}}>
                <PixelSprite
                  sprite={{rows: SPRITES.star.rows, palette: {Y: r.color, W: '#ffffff'}}}
                  px={4}
                />
              </div>
            ))}
          </div>
          {/* sweep */}
          {revealed && (
            <div style={{position: 'absolute', inset: 16, overflow: 'hidden', pointerEvents: 'none'}}>
              <div style={{position: 'absolute', top: -40, bottom: -40, width: 90, left: lerp(-120, CW + 60, clamp01(since / 30)), background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))', transform: 'skewX(-20deg)', opacity: since < 30 ? 1 : 0}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RarityShowcase: FC<RarityProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '物品稀有度',
  subtitle = '普通 · 罕见 · 稀有 · 史诗',
  tag = 'RARITY',
  headIcon = 'nether_star',
  cards: CARDS = DEFAULT_CARDS,
  flipAt: TF = DEFAULT_TF,
  rarityNames = {},
  backText = '?',
  finaleText = '史诗!',
}) => {
  const f = useCurrentFrame();
  const intro = prog(f, 0, 14);
  const epicDone = f >= TF[3] + FLIP;
  const tint = CARDS.map((c) => RAR[c.rar].glow);
  const nameOf = (k: RarityKey) => rarityNames[k] ?? RAR[k].name;
  const cfg: Cfg = {CARDS, TF, names: rarityNames, backText};
  return (
    <AbsoluteFill style={{background: bg ? '#0b0b10' : 'transparent'}}>
      {bg && (
        <>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #232329 0%, #101014 70%, #08080b 100%)'}} />
          <AbsoluteFill style={{background: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0 40px, rgba(0,0,0,0) 40px 80px)', opacity: intro}} />
          {/* epic backdrop grows with reveal */}
          <Glow x={960} y={500} r={1100} color="#5a2aa8" op={0.15 + (epicDone ? 0.4 : 0) * prog(f, TF[3] + FLIP, 20)} />
        </>
      )}
      {/* floor pools of rarity colour */}
      {CARDS.map((c, i) => {
        const p = prog(f, TF[i] + 8, 20);
        return <Glow key={i} x={cardC(i)[0]} y={880} r={360} color={tint[i]} op={0.55 * p * (i === 0 ? 0.5 : 1)} squash={0.28} />;
      })}
      {CARDS.map((c, i) => {
        const p = prog(f, TF[i] + 8, 24);
        if (i < 2) return null;
        return (
          <div key={`col${i}`} style={{position: 'absolute', left: cardC(i)[0] - 130, top: 0, width: 260, height: 940, background: `linear-gradient(0deg, ${tint[i]}66, ${tint[i]}00)`, opacity: p * (i === 3 ? 0.9 : 0.55), mixBlendMode: 'screen'}} />
        );
      })}
      {epicDone && <Rays x={cardC(3)[0]} y={cardC(3)[1]} size={2000} color="190,120,255" op={0.3 * prog(f, TF[3] + FLIP, 16)} n={12} speed={0.5} />}
      {f >= TF[3] + 8 && <Rays x={cardC(3)[0]} y={cardC(3)[1]} size={1500} color="255,120,255" op={0.2} n={9} speed={-0.4} />}
      {f >= TF[2] + 8 && <Rays x={cardC(2)[0]} y={cardC(2)[1]} size={1100} color="85,255,255" op={0.16 * prog(f, TF[2] + 8, 16)} n={10} speed={0.3} />}

      {CARDS.map((_, i) => (
        <Card key={i} i={i} cfg={cfg} />
      ))}

      {/* epic extras: runes, particles */}
      {f >= TF[3] + FLIP - 4 && (
        <>
          {[-1, 1].map((side) =>
            Array.from({length: 6}, (_, g) => {
              const sp = (((g / 6 + f * 0.012 * (side > 0 ? 1 : 1.2)) % 1) + 1) % 1;
              const flick = 0.55 + 0.45 * Math.sin(f * 0.2 + g * 1.3);
              return <Glyph key={side * 10 + g} ch={g * 3 + (side > 0 ? 7 : 0)} x={cardC(3)[0] + side * 250 + Math.sin(g * 2.3) * 10} y={lerp(CY + CH + 40, CY - 80, sp)} size={36} color={side > 0 ? '#ff9aff' : '#e2b6ff'} op={flick * Math.sin(sp * Math.PI) * prog(f, TF[3] + FLIP - 4, 12) * 0.95} />;
            }),
          )}
          <Embers x={cardX(3) - 40} y={CY - 100} w={CW + 80} h={760} count={34} colors={['#e2b6ff', '#ff9aff', '#ffffff', '#b45cff']} seed={9} size={10} life={90} sway={50} />
          <Twinkles x={cardC(3)[0]} y={cardC(3)[1]} radius={230} count={14} size={52} seed={5} />
          <Stars x={cardX(3) - 80} y={CY - 60} w={CW + 160} h={CH + 120} count={10} size={48} colors={['#ffffff', '#e2b6ff', '#ff9aff']} seed={2} />
        </>
      )}
      {f >= TF[2] + FLIP - 4 && (
        <>
          <Twinkles x={cardC(2)[0]} y={cardC(2)[1]} radius={200} count={8} size={44} seed={4} />
          <Embers x={cardX(2)} y={CY} w={CW} h={700} count={14} colors={['#9ff7ff', '#ffffff']} seed={7} size={8} life={90} sway={30} />
        </>
      )}
      {f >= TF[1] + FLIP - 4 && <Twinkles x={cardC(1)[0]} y={cardC(1)[1]} radius={170} count={4} size={36} seed={3} />}

      {/* bursts at the flip landing */}
      {CARDS.map((c, i) => (
        <div key={i}>
          <PixelBurst x={cardC(i)[0]} y={cardC(i)[1]} at={TF[i] + FLIP - 4} count={[8, 22, 40, 90][i]} colors={['#ffffff', RAR[c.rar].color, RAR[c.rar].glow]} speed={[10, 16, 22, 30][i]} life={[14, 22, 30, 44][i]} size={[8, 10, 12, 16][i]} seed={i + 40} />
          {i >= 1 && <Shockwave x={cardC(i)[0]} y={cardC(i)[1]} at={TF[i] + FLIP - 4} color={RAR[c.rar].color} maxR={[0, 280, 380, 560][i]} life={[0, 16, 20, 26][i]} width={[0, 8, 12, 20][i]} />}
          <Flash at={TF[i] + FLIP - 4} life={[0, 4, 6, 12][i]} peak={[0, 0.1, 0.2, 0.7][i]} color={['#fff', '#fff6c0', '#c8ffff', '#f3d8ff'][i]} />
        </div>
      ))}
      <FloatText x={960} y={96} at={TF[3] + FLIP} life={50} rise={40} color="#ff9aff" size={72}>
        {finaleText}
      </FloatText>

      {/* bottom rarity track */}
      <div style={{opacity: intro}}>
        <div style={{position: 'absolute', left: cardC(0)[0], top: 934, width: cardC(3)[0] - cardC(0)[0], height: 14, background: 'linear-gradient(90deg, #cdd5e0, #ffe45a, #3fd7ff, #b45cff)', opacity: 0.35}} />
        <div style={{position: 'absolute', left: cardC(0)[0], top: 934, height: 14, width: (cardC(3)[0] - cardC(0)[0]) * clamp01((f - TF[0] - 10) / (TF[3] - TF[0] + 14)), background: 'linear-gradient(90deg, #cdd5e0, #ffe45a, #3fd7ff, #b45cff)', backgroundSize: `${cardC(3)[0] - cardC(0)[0]}px 100%`, boxShadow: '0 0 20px rgba(200,150,255,0.6)'}} />
        {CARDS.map((c, i) => {
          const on = f >= TF[i] + FLIP - 4;
          return (
            <div key={i} style={{position: 'absolute', left: cardC(i)[0] - 80, top: 906, width: 160, display: 'flex', justifyContent: 'center', transform: `scale(${on ? 1 + 0.2 * jiggle(clamp01((f - TF[i] - FLIP + 4) / 16), 2.2, 3) : 0.9})`, opacity: on ? 1 : 0.4}}>
              <OreChip dot={RAR[c.rar].color} color={RAR[c.rar].color}>
                {nameOf(c.rar)}
              </OreChip>
            </div>
          );
        })}
      </div>

      {bg && <Embers x={0} y={0} w={W} h={H} count={26} colors={['#ffffff', '#b45cff', '#3fd7ff']} seed={91} size={8} life={160} sway={60} amount={0.3 + (f >= TF[3] ? 0.7 : 0)} opacity={0.6} />}
      {bg && <Vig s={0.7} color="0,0,6" inner={44} />}
      {showHead && <Head icon={headIcon} title={title} sub={subtitle} accent={RAR[CARDS[f >= TF[3] ? 3 : f >= TF[2] ? 2 : f >= TF[1] ? 1 : 0].rar].color} right={tag} at={2} />}

      {audio && (
        <>
      {TF.map((t, i) => (
        <Sfx key={`c${t}`} at={t + 2} src={mcSound('random/click')} volume={0.35} rate={0.9 + i * 0.12} />
      ))}
      {TF.map((t, i) => (
        <Sfx key={`l${t}`} at={t + FLIP - 4} src={mcSound(i === 3 ? 'random/anvil_land' : 'random/pop')} volume={0.4 + i * 0.05} rate={i === 3 ? 1.3 : 0.9 + i * 0.15} />
      ))}
      <Sfx at={TF[1] + FLIP - 4} src={mcSound('random/orb')} volume={0.25} rate={1} />
      <Sfx at={TF[2] + FLIP - 4} src={mcSound('random/orb')} volume={0.3} rate={1.3} />
      <Sfx at={TF[3] + FLIP - 4} src={mcSound('random/levelup')} volume={0.5} rate={0.9} />
      <Sfx at={TF[3] + FLIP - 4} src={mcSound('ui/toast/challenge_complete')} volume={0.4} />
      <Sfx at={TF[3] + FLIP - 4} src={mcSound('random/explode2')} volume={0.2} rate={1.4} />
        </>
      )}
    </AbsoluteFill>
  );
};
export const RARITY_FRAMES = 200;
export const RarityShowcaseShake: FC<RarityProps> = (props) => (
  <Shake at={(props.flipAt ?? DEFAULT_TF)[3] + FLIP - 4} life={16} strength={18}>
    <RarityShowcase {...props} />
  </Shake>
);
