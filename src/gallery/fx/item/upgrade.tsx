import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shake, Shockwave, Twinkles} from '../../../mc/Fx';
import {item as itemUrl} from '../../../mc/assets';
import {OreChip, OreProgress, OreSection, OreText, TYPE, nine} from '../../../mg/Ore';
import {LabelSmall, Sfx, mcSound} from '../../../reel/kit';
import {Cell, EASE, Embers, FloatText, Glow, Head, Item, ItemAt, OutlineT, Panel, Rays, Sheen, Stars, U, Vig, W, H, arcPos, clamp01, jiggle, lerp, prog, px, snap} from './kit';

/**
 * item-upgrade-chain: wooden -> stone -> iron -> golden -> diamond -> netherite sword. Each tier: the material flies in,
 * flash + ring + burst in the tier colour, the sword pops and the stat bars, tier list and level bar advance.
 * The last step ends in a full-screen blaze. Props: see UpgradeProps (tiers, texts, timings, bg, audio).
 */

export type UpgradeTier = {
  /** 该级装备物品 id(主体大图、路线列表、等级条) */
  sword: string;
  /** 升到该级时飞入的材料物品 id */
  mat: string;
  /** 中文名称(大字与路线列表) */
  name: string;
  /** 英文短名(左下角小标签) */
  en: string;
  /** 该级主题色,#rrggbb(光效、描边、粒子) */
  accent: string;
  /** 该级背景底色,#rrggbb(仅 bg 时可见) */
  bg: string;
  /** 攻击伤害 */
  dmg: number;
  /** 耐久 */
  dur: number;
};
type Tier = UpgradeTier;

export type UpgradeProps = {
  /** 是否绘制随等级换色的背景(底色、物品图案、辉光、射线、飘尘、暗角);false 时只剩面板/主体物品/特效 */
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
  /** 进化各级(建议 6 级:左侧路线列表容纳 6 行) */
  tiers?: UpgradeTier[];
  /** 各级出现的本地帧,长度与 tiers 相同,第一项通常为 0 */
  times?: number[];
  /** 左侧属性面板标题 */
  statsTitle?: string;
  /** 右侧路线面板标题 */
  routeTitle?: string;
  /** 第一条属性名 */
  atkLabel?: string;
  /** 第二条属性名 */
  durLabel?: string;
  /** 第三条属性名(固定值,不随等级变化) */
  speedLabel?: string;
  /** 第三条属性值文字 */
  speedValue?: string;
  /** 第三条属性条的填充比例 0-1 */
  speedFill?: number;
  /** 等级标签模板,{n} 当前级、{total} 总级数 */
  levelText?: string;
  /** 每次升级的飘字 */
  upText?: string;
  /** 最终级的飘字 */
  finalText?: string;
};
const DEFAULT_TIERS: Tier[] = [
  {sword: 'wooden_sword', mat: 'oak_planks', name: '木剑', en: 'WOOD', accent: '#d9a05a', bg: '#2a1a0d', dmg: 4, dur: 59},
  {sword: 'stone_sword', mat: 'cobblestone', name: '石剑', en: 'STONE', accent: '#c4c6cc', bg: '#1c1d21', dmg: 5, dur: 131},
  {sword: 'iron_sword', mat: 'iron_ingot', name: '铁剑', en: 'IRON', accent: '#f1f1f1', bg: '#232830', dmg: 6, dur: 250},
  {sword: 'golden_sword', mat: 'gold_ingot', name: '金剑', en: 'GOLD', accent: '#ffd23f', bg: '#2e2208', dmg: 4, dur: 32},
  {sword: 'diamond_sword', mat: 'diamond', name: '钻石剑', en: 'DIAMOND', accent: '#55ffff', bg: '#06282c', dmg: 7, dur: 1561},
  {sword: 'netherite_sword', mat: 'netherite_ingot', name: '下界合金剑', en: 'NETHERITE', accent: '#c58bff', bg: '#2c1944', dmg: 8, dur: 2031},
];
const DEFAULT_TIMES = [0, 36, 64, 92, 120, 148];
const FLY = 14;

const tierAt = (f: number, T: number[]) => T.filter((t) => f >= t).length - 1;

const Pattern: FC<{id: string; op: number}> = ({id, op}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${itemUrl(id)})`,
        backgroundSize: '128px 128px',
        backgroundPosition: `${f * 0.8}px ${f * 0.5}px`,
        imageRendering: 'pixelated',
        opacity: op,
        filter: 'brightness(1.6)',
      }}
    />
  );
};

const Scene: FC<UpgradeProps> = ({
  bg = true,
  audio = true,
  showHead = true,
  title = '装备进化',
  subtitle = '木 → 石 → 铁 → 金 → 钻石 → 下界合金',
  tag = 'UPGRADE',
  tiers: TIERS = DEFAULT_TIERS,
  times: T = DEFAULT_TIMES,
  statsTitle = '属性',
  routeTitle = '进化路线',
  atkLabel = '攻击伤害',
  durLabel = '耐久',
  speedLabel = '攻击速度',
  speedValue = '1.6',
  speedFill = 0.8,
  levelText = '等级 {n} / {total}',
  upText = '升级!',
  finalText = '进化完成!',
}) => {
  const LAST = TIERS.length - 1;
  const dmgMax = Math.max(...TIERS.map((t) => t.dmg));
  const durMax = Math.max(...TIERS.map((t) => t.dur));
  const f = useCurrentFrame();
  const k = tierAt(f, T);
  const tt = f - T[k];
  const cur = TIERS[k];
  const prev = TIERS[Math.max(0, k - 1)];
  const mix = k === 0 ? 1 : EASE.out(clamp01(tt / 12));
  const pop = k === 0 ? prog(f, 6, 16, EASE.back) : prog(f, T[k], 14, EASE.back);
  const intro = prog(f, 0, 16);
  const nextK = Math.min(LAST, k + 1);
  const charge = k < LAST ? clamp01((f - (T[nextK] - 14)) / 14) : 0;
  const finale = f >= T[LAST];
  const finT = f - T[LAST];
  const bob = Math.sin(f * 0.09) * 10;
  const swordSize = 460;
  const stat = (key: 'dmg' | 'dur') => {
    const a = k === 0 ? 0 : prev[key];
    const b = cur[key];
    return k === 0 ? lerp(0, b, EASE.out(clamp01((f - 8) / 18))) : lerp(a, b, EASE.out(clamp01(tt / 16)));
  };
  const dmg = stat('dmg');
  const dur = stat('dur');
  const barsAccent = cur.accent;
  const levelFill = k === 0 ? 0 : (k - 1 + EASE.out(clamp01(tt / 14))) / LAST + 0;
  // sword with squash on pop
  const sc = 0.2 + 0.8 * Math.min(1.14, pop + (pop >= 1 ? 0 : 0)) + (charge > 0 ? -charge * 0.12 : 0);
  const shake = charge > 0 ? Math.sin(f * 2.2) * 6 * charge : 0;

  return (
    <AbsoluteFill style={{background: bg ? cur.bg : 'transparent'}}>
      {bg && (
        <>
          {/* tier background crossfade */}
          <AbsoluteFill style={{background: prev.bg}} />
          <AbsoluteFill style={{background: cur.bg, opacity: mix}} />
          <Pattern id={prev.sword} op={0.06 * (1 - mix)} />
          <Pattern id={cur.sword} op={0.06 * mix} />
          <Glow x={960} y={480} r={950} color={cur.accent} op={0.28 + (finale ? 0.25 : 0)} />
          <Glow x={960} y={480} r={520} color={cur.accent} op={0.28} />
          {k === LAST && <Glow x={960} y={470} r={420} color="#f1d8ff" op={0.45} />}
          {k >= 3 && <Rays x={960} y={470} size={2200} color={k === LAST ? '200,140,255' : k === 4 ? '85,255,255' : '255,220,100'} op={0.16 + (finale ? 0.18 : 0)} n={14} speed={0.3} />}
          {finale && <Rays x={960} y={470} size={2400} color="255,130,60" op={0.16} n={9} speed={-0.5} />}
        </>
      )}

      {/* left: stat panel */}
      <div style={{opacity: intro, transform: `translateX(${(1 - intro) * -100}px)`}}>
        <Panel x={70} y={230} w={520} h={560} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={statsTitle} grow={prog(f, 4, 20)} />
          </div>
          <div style={{position: 'absolute', left: 36, top: 100, right: 36}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
              <OreText size={TYPE.body} color="#d4d6da" shadow>
                {atkLabel}
              </OreText>
              <OutlineT size={48} color={barsAccent}>
                {String(Math.round(dmg))}
              </OutlineT>
            </div>
            <OreProgress value={dmg / dmgMax} width={448} color="gold" />
            <div style={{display: 'flex', justifyContent: 'space-between', margin: '38px 0 10px'}}>
              <OreText size={TYPE.body} color="#d4d6da" shadow>
                {durLabel}
              </OreText>
              <OutlineT size={48} color={barsAccent}>
                {String(Math.round(dur))}
              </OutlineT>
            </div>
            <OreProgress value={Math.min(1, dur / durMax)} width={448} color="green" />
            <div style={{display: 'flex', justifyContent: 'space-between', margin: '38px 0 10px'}}>
              <OreText size={TYPE.body} color="#d4d6da" shadow>
                {speedLabel}
              </OreText>
              <OutlineT size={48} color="#ffffff">
                {speedValue}
              </OutlineT>
            </div>
            <OreProgress value={speedFill} width={448} color="blue" />
          </div>
        </Panel>
        <div style={{position: 'absolute', left: 70, top: 830, display: 'flex', gap: 12}}>
          <OreChip dot={cur.accent} color="#fff">
            {levelText.replace('{n}', String(k + 1)).replace('{total}', String(TIERS.length))}
          </OreChip>
          <OreChip dot="#6cc349" color="#d4d6da">
            {cur.en}
          </OreChip>
        </div>
      </div>

      {/* right: tier list */}
      <div style={{opacity: intro, transform: `translateX(${(1 - intro) * 100}px)`}}>
        <Panel x={1330} y={230} w={520} h={640} variant="panel_raised">
          <div style={{position: 'absolute', left: 6 * U, top: 4 * U, right: 6 * U}}>
            <OreSection label={routeTitle} grow={prog(f, 4, 20)} />
          </div>
          <div style={{position: 'absolute', left: 24, top: 90, right: 24, display: 'flex', flexDirection: 'column', gap: 8}}>
            {TIERS.map((t, i) => {
              const act = i === k;
              const past = i < k;
              const hit = act ? 1 + 0.06 * jiggle(clamp01(tt / 14), 2, 3) : 1;
              return (
                <div key={t.sword} style={{...nine(act ? 'slot_target' : 'slot', [2, 2, 2, 2]), height: 80, display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px', opacity: act ? 1 : past ? 0.85 : 0.5, transform: `scale(${hit})`}}>
                  <Item id={t.sword} size={56} />
                  <OreText size={TYPE.body} color={act ? t.accent : past ? '#b8f040' : '#8c8d90'} shadow style={{flex: 1}}>
                    {t.name}
                  </OreText>
                  <OreText size={TYPE.small} color={past ? '#b8f040' : '#8c8d90'}>
                    {past ? '✓' : `${t.dmg}`}
                  </OreText>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* sword stage */}
      <div style={{position: 'absolute', left: 960 - swordSize / 2 + shake, top: 480 - swordSize / 2 + bob, width: swordSize, height: swordSize, transform: `scale(${sc}) rotate(${(1 - Math.min(1, pop)) * -20}deg)`, transformOrigin: '50% 60%', opacity: clamp01(pop * 4), filter: `drop-shadow(0 0 28px ${cur.accent}cc)`}}>
        <Item id={cur.sword} size={swordSize} glint={k >= 5} shadow={20} />
        {k >= 3 && <Sheen id={cur.sword} size={swordSize} hue={k === 3 ? 'gold' : 'white'} speed={2.2} />}
      </div>
      {/* old sword fades away on upgrade */}
      {k > 0 && tt < 10 && <ItemAt id={prev.sword} x={960} y={480 + bob} size={swordSize} scale={1 + tt * 0.07} rot={tt * 4} op={1 - tt / 10} z={3} />}
      {/* orbiting sparkles */}
      <Stars x={620} y={150} w={680} h={680} count={k >= 4 ? 14 : 8} size={44} colors={[cur.accent, '#ffffff']} seed={k + 3} />

      {/* material flying in */}
      {(() => {
        if (k === LAST && finT > 0) return null;
        const n = nextK;
        if (n === k) return null;
        const start = T[n] - FLY;
        const t = clamp01((f - start) / FLY);
        if (f < start || f >= T[n]) return null;
        const rowY = 230 + 90 + n * 88 + 40;
        const [x, y] = arcPos(EASE.in(t), [1560, rowY], [960, 500], -180);
        return <ItemAt id={TIERS[n].mat} x={x} y={y} size={snap(150 - t * 50, 8)} rot={t * 540} op={1} shadow={12} z={20} />;
      })()}

      {/* tier name under the sword */}
      <div style={{position: 'absolute', left: 0, width: W, top: 760, textAlign: 'center', transform: `scale(${0.8 + 0.2 * Math.min(1.1, pop)})`, opacity: clamp01(pop * 3)}}>
        <OutlineT size={120} color={cur.accent}>
          {cur.name}
        </OutlineT>
      </div>

      {/* level bar */}
      <div style={{opacity: intro}}>
        <div style={{position: 'absolute', left: 396, top: 944, width: 1128, height: 16, ...nine('track', [2, 2, 2, 2])}}>
          <div style={{position: 'absolute', left: 4, top: 4, bottom: 4, width: (1128 - 8) * Math.max(0, levelFill), background: `linear-gradient(90deg, #f8af2b, ${cur.accent})`}} />
        </div>
        {TIERS.map((t, i) => {
          const x = 396 + (i / LAST) * 1128;
          const reached = i <= k;
          const hit = i === k ? 1 + 0.35 * jiggle(clamp01(tt / 18), 2.2, 3) : 1;
          return (
            <div key={t.sword} style={{position: 'absolute', left: x - 44, top: 912, transform: `scale(${hit})`}}>
              <Cell size={88} frame={i === k ? 'slot_target' : 'slot'} item={0.7} id={reached ? t.sword : undefined}>
                {!reached && <div style={{position: 'absolute', inset: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Item id={t.sword} size={52} style={{filter: 'brightness(0) opacity(0.45)'}} />
                </div>}
              </Cell>
              {i === k && <Glow x={44} y={44} r={100} color={t.accent} op={0.6} />}
            </div>
          );
        })}
      </div>

      {/* upgrade effects */}
      {T.slice(1).map((t, i) => {
        const tr = TIERS[i + 1];
        const last = i + 1 === LAST;
        return (
          <div key={t}>
            <PixelBurst x={960} y={480} at={t} count={last ? 130 : 56} colors={['#ffffff', tr.accent, last ? '#ff9a3c' : '#ffffff', tr.accent]} speed={last ? 38 : 28} life={last ? 54 : 38} size={last ? 18 : 14} seed={t} />
            <Shockwave x={960} y={480} at={t} color={tr.accent} maxR={last ? 720 : 480} life={last ? 28 : 22} width={last ? 24 : 16} />
            <Shockwave x={960} y={480} at={t + 4} color="#ffffff" maxR={last ? 460 : 300} life={18} width={8} />
            <FloatText x={960} y={256} at={t + 2} life={34} rise={50} color={tr.accent} size={72}>
              {last ? finalText : upText}
            </FloatText>
            <Flash at={t} life={last ? 14 : 8} peak={last ? 0.95 : 0.5} color={last ? '#fff1ff' : '#ffffff'} />
          </div>
        );
      })}
      {finale && <Twinkles x={960} y={480} radius={360} count={16} size={56} seed={4} />}
      {bg && <Embers x={0} y={0} w={W} h={H} count={46} colors={finale ? ['#c58bff', '#ff9a3c', '#ffffff', '#ffd23f'] : [cur.accent, '#ffffff']} seed={k + 80} size={10} life={130} sway={70} amount={0.4 + (finale ? 0.6 : 0)} opacity={0.8} />}
      {bg && <Vig s={0.7} color="0,0,0" inner={42} />}
      {showHead && <Head icon={cur.sword} title={title} sub={subtitle} accent={cur.accent} right={tag} at={2} />}

      {audio && (
        <>
      <Sfx at={T[0] + 6} src={mcSound('random/pop')} volume={0.4} />
      {T.slice(1).map((t, i) => (
        <Sfx key={t} at={t - 14} src={mcSound('random/fuse')} volume={0.12} rate={2 + i * 0.1} cut={12} />
      ))}
      {T.slice(1).map((t, i) => (
        <Sfx key={`a${t}`} at={t} src={mcSound('random/anvil_use')} volume={0.4 + i * 0.03} rate={0.9 + i * 0.1} />
      ))}
      {T.slice(1).map((t, i) => (
        <Sfx key={`p${t}`} at={t} src={mcSound('random/orb')} volume={0.3} rate={0.9 + i * 0.12} />
      ))}
      <Sfx at={T[LAST]} src={mcSound('random/levelup')} volume={0.6} rate={1} />
      <Sfx at={T[LAST]} src={mcSound('ui/toast/challenge_complete')} volume={0.45} />
      <Sfx at={T[LAST]} src={mcSound('random/explode1')} volume={0.3} rate={1.3} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const UpgradeChain: FC<UpgradeProps> = (props) => {
  const T = props.times ?? DEFAULT_TIMES;
  const LAST = (props.tiers ?? DEFAULT_TIERS).length - 1;
  const at = (i: number) => T[Math.min(i, LAST)] ?? 0;
  return (
    <Shake at={T[LAST]} life={22} strength={26}>
      <Shake at={at(1)} life={8} strength={6}>
        <Shake at={at(2)} life={8} strength={8}>
          <Shake at={at(3)} life={8} strength={9}>
            <Shake at={at(4)} life={10} strength={12}>
              <Scene {...props} />
            </Shake>
          </Shake>
        </Shake>
      </Shake>
    </Shake>
  );
};
export const UPGRADE_FRAMES = 215;
