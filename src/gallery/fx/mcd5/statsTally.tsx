// mcd-v-stats-tally: end-of-episode results page (results-level-complete.jpg / results-screen-fade-in.png).
// Black fade-in, gold caption + white title, four dark stat cards (two each side) that count up in hard steps and flash gold when they land,
// an orange summary bar, a gilded rank diamond that slams down with a white flash and pixel debris, and the loot chest in a gold diamond.
// Props: title, subtitle, player, skin, stats {deaths, kills, seconds, explore}, rank ('S'|'A'|'B'|'C'), level, biome, bg.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {BlackCut, ChestIcon, DiamondFrame, Embers, EmeraldCounter, KeyCap, Laurel, LevelBadge, MCD, McdText, PlayerBust, PxText, SoulCounter, WhiteFlash, type DiamondTier} from '../mcdkit/kit';
import {Burst, CLOCK_PX, CrossFlash, MAP_PX, PxIcon, Rise, SKULL_PX, SWORD_ROWS, SceneBg, countUp, stepQ, win, type BiomeId} from './common';

type Rank = 'S' | 'A' | 'B' | 'C';
const RANK: Record<Rank, {tier: DiamondTier; bands: string[]; shadow: string; laurel: 'gold' | 'orange' | 'green' | 'silver'; glow: string}> = {
  S: {tier: 'gilded', bands: ['#FFF6D0', '#FFE680', '#FFD34E', '#E8901A'], shadow: '#4A2A00', laurel: 'gold', glow: 'rgba(255,205,80,0.55)'},
  A: {tier: 'unique', bands: ['#FFD9A0', '#FFB040', '#FF9400', '#C25C14'], shadow: '#3A1600', laurel: 'orange', glow: 'rgba(255,148,0,0.5)'},
  B: {tier: 'rare', bands: ['#C8F4E0', '#7CE8B8', '#3CA886', '#1E7A5C'], shadow: '#06201A', laurel: 'green', glow: 'rgba(60,168,134,0.5)'},
  C: {tier: 'common', bands: ['#FFFFFF', '#E8E8E8', '#C0C0C0', '#8C8C8C'], shadow: '#141414', laurel: 'silver', glow: 'rgba(200,200,200,0.35)'},
};

const mmss = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

const StatBox: FC<{label: string; value: string; icon: string[]; reveal: number; flashAt: number; w?: number; h?: number}> = ({label, value, icon, reveal, flashAt, w = 500, h = 208}) => {
  const f = useCurrentFrame();
  const ft = f - flashAt;
  const flash = ft >= 0 && ft < 12 ? 1 - ft / 12 : 0;
  const edge = flash > 0 ? (ft % 4 < 3 ? '#F8D868' : '#8A7438') : '#303038';
  return (
    <div style={{position: 'relative', width: w, height: h, boxSizing: 'border-box', border: `5px solid ${edge}`, background: 'rgba(24,32,44,0.78)', opacity: stepQ(reveal, 4), transform: `translateY(${Math.round(((1 - reveal) * 24) / 4) * 4}px)`, flex: 'none'}}>
      <div style={{position: 'absolute', left: 26, top: 22}}>
        <McdText size={30} color="#9AA3AE">{label}</McdText>
      </div>
      <div style={{position: 'absolute', right: 26, top: 24, opacity: 0.55}}>
        <PxIcon rows={icon} px={5} color="#8A93A0" />
      </div>
      <div style={{position: 'absolute', left: 26, bottom: 22, transform: `translateY(${-flash * 8}px)`}}>
        <PxText text={value} px={8} color={flash > 0 ? '#FFF2B0' : '#fff'} />
      </div>
      {flash > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(248,216,104,${0.16 * flash})`}} />}
    </div>
  );
};

export const StatsTally: FC<{
  bg?: boolean;
  title?: string;
  subtitle?: string;
  player?: string;
  skin?: string;
  level?: number;
  rank?: Rank;
  stats?: {deaths: number; kills: number; seconds: number; explore: number};
  biome?: BiomeId;
  /** 四张统计卡的标题，顺序：死亡 / 击杀 / 用时 / 探索度 */
  labels?: [string, string, string, string];
  /** 橙色总评条左侧标题，默认「本期总评」 */
  summaryLabel?: string;
  /** 总评条右侧小字；不传则为「下一等级 Next Rank: ${level + 1}」 */
  nextText?: string;
  /** 总评条填充比例 0..1，默认 0.78 */
  progress?: number;
  /** 绿宝石计数目标值 */
  emeralds?: number;
  /** 灵魂计数目标值 */
  souls?: number;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, title = '本期完成', subtitle = '深渊远征 · 第七期', player = '阿远', skin = 'efe', level = 12, rank = 'S', stats = {deaths: 3, kills: 1284, seconds: 1342, explore: 87}, biome = 'camp', labels = ['死亡次数', '击杀数', '用时', '探索度'], summaryLabel = '本期总评', nextText, progress = 0.78, emeralds = 842, souls = 36, audio = true}) => {
  const f = useCurrentFrame();
  const R = RANK[rank];
  const slam = 128;
  const shakeT = f - slam;
  const sx = shakeT >= 0 && shakeT < 6 ? Math.round(Math.sin(shakeT * 2.8) * 8 * (1 - shakeT / 6)) : 0;
  const sy = shakeT >= 0 && shakeT < 6 ? Math.round(Math.cos(shakeT * 3.1) * 6 * (1 - shakeT / 6)) : 0;
  const slamT = win(f, slam - 6, 6);
  const landed = f >= slam;
  const cardAt = [34, 54, 74, 94];
  const dur = 22;
  const vals = [
    countUp(f, cardAt[0], dur, stats.deaths, 3),
    countUp(f, cardAt[1], dur, stats.kills, 14),
    countUp(f, cardAt[2], dur, stats.seconds, 14),
    countUp(f, cardAt[3], dur, stats.explore, 10),
  ];
  const bar = stepQ(win(f, 60, 64), 20);
  const chestShake = f >= 168 ? Math.round(Math.sin((f - 168) * 1.9) * 4 * clamp01(1 - (f - 168) / 20)) : 0;
  const pulse = f >= 150 ? 0.5 + 0.5 * Math.sin((f - 150) * 0.28) : 0;
  return (
    <AbsoluteFill>
      {bg && (
        <SceneBg biome={biome} dim={0.78} tint="8,14,26">
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 55% at 50% 42%, rgba(20,40,70,0.5), rgba(0,0,0,0) 72%)'}} />
        </SceneBg>
      )}
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* title */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <Rise at={10} dur={6} dy={10}>
            <PxText text={title} px={3} color={MCD.goldBright} shadowColor="#2A1600" />
          </Rise>
          <Rise at={14} dur={6} dy={10}>
            <PxText text={subtitle} px={6} />
          </Rise>
        </div>

        {/* stat cards */}
        <div style={{position: 'absolute', left: 120, top: 264, display: 'flex', flexDirection: 'column', gap: 36}}>
          <StatBox label={labels[0]} value={String(vals[0])} icon={SKULL_PX} reveal={win(f, 26, 8)} flashAt={cardAt[0] + dur} />
          <StatBox label={labels[1]} value={vals[1].toLocaleString('en-US')} icon={SWORD_ROWS} reveal={win(f, 30, 8)} flashAt={cardAt[1] + dur} />
        </div>
        <div style={{position: 'absolute', right: 120, top: 264, display: 'flex', flexDirection: 'column', gap: 36}}>
          <StatBox label={labels[2]} value={mmss(vals[2])} icon={CLOCK_PX} reveal={win(f, 34, 8)} flashAt={cardAt[2] + dur} />
          <StatBox label={labels[3]} value={`${vals[3]}%`} icon={MAP_PX} reveal={win(f, 38, 8)} flashAt={cardAt[3] + dur} />
        </div>

        {/* rank diamond */}
        <div style={{position: 'absolute', left: 960 - 290, top: 486}}>
          <div style={{opacity: win(f, 24, 10) > 0 ? 1 : 0}}>
            <Laurel w={580} tone={landed ? R.laurel : 'silver'} grow={landed ? EASE.out(win(f, slam, 14)) : win(f, 28, 24) * 0.7} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 960 - 230, top: 232, transform: `scale(${landed ? 1 : 1 + (1 - EASE.in(slamT)) * (f >= slam - 6 ? 0.5 : 0)})`, opacity: f >= 18 ? 1 : 0}}>
          <DiamondFrame size={460} tier={landed ? R.tier : 'empty'} glow={landed ? R.glow : undefined} clip="bottom">
            <div style={{filter: landed ? 'brightness(0.3) saturate(0.6)' : 'brightness(0.8)', opacity: landed ? 0 : 1}}>
              <PlayerBust skin={skin} scale={19} style={{marginBottom: 94}} />
            </div>
          </DiamondFrame>
          {landed && (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.18 * clamp01(1 - (f - slam) / 6)})`}}>
              <PxText text={rank} px={16} bands={R.bands} shadowColor={R.shadow} />
            </div>
          )}
          <div style={{position: 'absolute', left: -78, top: 30, opacity: win(f, 24, 8) > 0 ? 1 : 0}}>
            <LevelBadge level={level} w={140} accent="purple" />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 706, display: 'flex', justifyContent: 'center', opacity: stepQ(win(f, 40, 8), 4)}}>
          <McdText size={38} weight={700}>{player}</McdText>
        </div>

        {/* summary bar + rewards */}
        <div style={{position: 'absolute', left: 120, top: 806, width: 1340, opacity: stepQ(win(f, 54, 8), 4)}}>
          <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
            <PxText text={summaryLabel} px={3} />
            <McdText size={26} weight={600} color="#9AA0AA">{nextText ?? `下一等级 Next Rank: ${level + 1}`}</McdText>
          </div>
          <div style={{position: 'relative', marginTop: 16, height: 18, background: '#39363A'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${bar * progress * 100}%`, background: MCD.ap}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 5, background: '#FF8A5C'}} />
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 70, marginTop: 40}}>
            <EmeraldCounter value={countUp(f, 96, 36, emeralds, 12)} px={5} />
            <SoulCounter value={countUp(f, 104, 36, souls, 9)} px={5} tone="purple" />
          </div>
        </div>
        <div style={{position: 'absolute', left: 1530, top: 770, opacity: f >= 150 ? 1 : 0, transform: `scale(${EASE.back(win(f, 150, 9))})`}}>
          <DiamondFrame size={260} tier="gilded" glow={`rgba(255,205,80,${0.35 + pulse * 0.3})`}>
            <div style={{transform: `translate(${chestShake}px, 4px)`}}>
              <ChestIcon variant="ender" scale={10} open={f >= 176 ? 0.14 * pulse : 0} style={{filter: 'brightness(1.9) contrast(1.1)'}} />
            </div>
          </DiamondFrame>
          <div style={{position: 'absolute', right: 22, top: 170}}>
            <KeyCap label="A" color={MCD.keyA} size={50} />
          </div>
        </div>
      </AbsoluteFill>

      <CrossFlash x={960} y={460} at={slam} arm={300} thick={20} color="#FFF6C0" dur={16} />
      <Burst x={960} y={460} at={slam} count={30} size={16} speed={1.1} life={30} seed={21} colors={rank === 'S' ? [MCD.title, '#FFF6C0', MCD.gold] : [R.bands[1], '#fff', R.bands[2]]} />
      <WhiteFlash at={slam} dur={12} peak={0.32} steps={4} />
      <Embers count={22} area={[0, 300, 1920, 780]} size={6} seed={9} speed={0.5} color="#FFE08A" style={{opacity: 0.5 * win(f, 40, 20)}} />
      {bg && <BlackCut at={-1} fade={1} hold={6} reveal={16} />}
      {audio && (
        <>
          {cardAt.map((c, i) => (
            <Sequence key={i} from={c}>
              <Audio src={mcSound('random/click')} volume={0.2} playbackRate={0.85 + i * 0.1} />
            </Sequence>
          ))}
          <Sequence from={slam}>
            <Audio src={mcSound('random/anvil_land')} volume={0.4} playbackRate={1.1} />
          </Sequence>
          <Sequence from={slam + 3}>
            <Audio src={mcSound('random/levelup')} volume={0.35} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
