// mcd-v-compare: A-vs-B comparison card for two mods / pieces of gear (inventory-detail stat rows, rarity frames).
// Two chamfered panels flank a centre label strip with a VS hexagon. Stat bars grow from the centre outwards one row at a time with
// rolling numbers; the winner of each row gets a gold bar + diamond marker. At the end totals roll, the overall winner's frame
// turns gilded with a WINNER tag, flash and debris, and the loser dims.
// Props: a / b {name, item, rarity, stats[]}, labels (3 row labels), title, winner ('a'|'b', default = higher total), bg.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {CutPanel, DiamondFrame, Embers, HexBadge, ItemIcon3D, MCD, McdBackdrop, McdText, PxText, RarityTag, WhiteFlash, itemTex, type DiamondTier} from '../mcdkit/kit';
import {Burst, CrossFlash, Label, Pop, Rise, Shine, countUp, stepQ, win} from './common';

export type Side = {name: string; item: string; rarity: 'common' | 'rare' | 'unique'; stats: number[]; tag?: string};

const DEF_A: Side = {name: '下界合金剑', item: 'netherite_sword', rarity: 'unique', stats: [92, 64, 70]};
const DEF_B: Side = {name: '钻石剑', item: 'diamond_sword', rarity: 'rare', stats: [71, 78, 62]};

const TIER: Record<Side['rarity'], DiamondTier> = {common: 'common', rare: 'rare', unique: 'unique'};
const GLOW: Record<Side['rarity'], string> = {common: 'rgba(220,220,220,0.3)', rare: 'rgba(60,168,134,0.4)', unique: 'rgba(248,86,0,0.45)'};
const DARK = '#0E0E12';

const PW = 800;
const PH = 880;
const ROW0 = 468;
const ROWH = 104;
const rowStart = (i: number) => 40 + i * 26;

const Bars: FC<{side: Side; mine: 0 | 1; other: Side; labels: string[]; dim: number}> = ({side, mine, other, labels, dim}) => {
  const f = useCurrentFrame();
  void labels;
  return (
    <>
      {side.stats.map((v, i) => {
        const at = rowStart(i);
        const t = stepQ(EASE.out(win(f, at, 22)), 22);
        const shown = Math.round(v * t);
        const done = f >= at + 22;
        const wins = v > other.stats[i];
        const tie = v === other.stats[i];
        const gold = done && wins;
        const y = ROW0 + i * ROWH;
        const trackW = 520;
        const trackL = mine === 0 ? 190 : 90;
        const fillW = (trackW * shown) / 100;
        // bars grow from the centre side: left panel -> right edge, right panel -> left edge
        const fromRight = mine === 0;
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: y, width: PW, height: 64, opacity: f >= at - 4 ? 1 : 0}}>
            <div style={{position: 'absolute', left: trackL + (fromRight ? 0 : 0), top: 18, width: trackW, height: 30, background: DARK, boxShadow: '0 0 0 4px #000, inset 0 0 0 3px #2A2A30'}} />
            {/* tick marks */}
            {Array.from({length: 9}, (_, k) => (
              <div key={k} style={{position: 'absolute', left: trackL + ((k + 1) * trackW) / 10, top: 18, width: 3, height: 30, background: 'rgba(255,255,255,0.07)'}} />
            ))}
            <div
              style={{
                position: 'absolute',
                [fromRight ? 'right' : 'left']: fromRight ? PW - (trackL + trackW) : trackL,
                top: 18,
                width: fillW,
                height: 30,
                background: gold ? 'linear-gradient(180deg,#FFF2A8 0 28%,#FCD448 28% 100%)' : tie && done ? '#B4B8C0' : 'linear-gradient(180deg,#E8E8EC 0 28%,#9A9CA4 28% 100%)',
                filter: done && !wins && !tie ? 'brightness(0.62)' : undefined,
              }}
            />
            {/* diamond marker at the bar end for the winning stat */}
            {gold && (
              <div style={{position: 'absolute', [fromRight ? 'right' : 'left']: (fromRight ? PW - (trackL + trackW) : trackL) + fillW - 14, top: 20, width: 28, height: 28, background: '#FFE680', transform: `rotate(45deg) scale(${EASE.back(win(f, at + 22, 6))})`, boxShadow: '0 0 0 3px #000', zIndex: 2}} />
            )}
            <div style={{position: 'absolute', [fromRight ? 'left' : 'right']: 36, top: 0, width: 124, height: 64, display: 'flex', alignItems: 'center', justifyContent: fromRight ? 'flex-start' : 'flex-end'}}>
              <PxText text={shown} px={6} color={gold ? '#FFE680' : done && !wins && !tie ? '#9AA0AA' : '#fff'} shadowColor={gold ? '#2A1600' : undefined} />
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 0, filter: `brightness(${dim})`}} />
    </>
  );
};

export const CompareCard: FC<{
  bg?: boolean;
  a?: Side;
  b?: Side;
  labels?: string[];
  title?: string;
  winner?: 'a' | 'b';
  /** 综合分前的小标题，默认「综合」 */
  totalLabel?: string;
  /** 胜者金色标签文字，默认「WINNER 胜出」 */
  winnerText?: string;
  /** 中间六边形里的字，默认 VS */
  vsText?: string;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, a = DEF_A, b = DEF_B, labels = ['攻击', '速度', '范围'], title = '装备对比', winner, totalLabel = '综合', winnerText = 'WINNER 胜出', vsText = 'VS', audio = true}) => {
  const f = useCurrentFrame();
  const total = (s: Side) => Math.round(s.stats.reduce((x, y) => x + y, 0) / s.stats.length);
  const ta = total(a);
  const tb = total(b);
  const win_ = winner ?? (ta >= tb ? 'a' : 'b');
  const resolve = 146;
  const resolved = f >= resolve;
  const enter = (k: number) => EASE.out(win(f, 4 + k * 3, 10));
  const sideNode = (s: Side, mine: 0 | 1, other: Side, t: number, isWinner: boolean) => {
    const dim = resolved && !isWinner ? 0.55 : 1;
    const tier: DiamondTier = resolved && isWinner ? 'gilded' : TIER[s.rarity];
    const edge = resolved && isWinner ? (f % 16 < 8 ? '#F8D868' : '#E8B428') : '#3A3A42';
    const dx = Math.round(((1 - t) * (mine === 0 ? -260 : 260)) / 10) * 10;
    return (
      <div style={{position: 'absolute', left: mine === 0 ? 90 : 1030, top: 100, opacity: t > 0 ? 1 : 0, transform: `translateX(${dx}px)`, filter: `brightness(${dim})`}}>
        <CutPanel w={PW} h={PH} cuts={mine === 0 ? [44, 0, 44, 0] : [0, 44, 0, 44]} fill="#16161A" edge={edge} edgeW={resolved && isWinner ? 6 : 3} glow={resolved && isWinner ? 'rgba(248,200,80,0.35)' : 'rgba(150,44,30,0.4)'} corners={!(resolved && isWinner)}>
          <div style={{position: 'absolute', left: (PW - 280) / 2, top: 24}}>
            <Pop at={14 + mine * 3} dur={9}>
              <DiamondFrame size={280} tier={tier} glow={resolved && isWinner ? 'rgba(255,205,80,0.6)' : GLOW[s.rarity]}>
                <ItemIcon3D src={itemTex(s.item)} size={130} depth={7} glow={resolved && isWinner ? 'rgba(255,226,120,0.45)' : undefined} />
              </DiamondFrame>
            </Pop>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 322, display: 'flex', justifyContent: 'center'}}>
            <Rise at={20 + mine * 3} dur={8} dy={12}>
              <PxText text={s.name} px={4} />
            </Rise>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 396, display: 'flex', justifyContent: 'center'}}>
            <Rise at={24 + mine * 3} dur={8} dy={10}>
              <RarityTag rarity={s.rarity} size={22} text={s.tag} />
            </Rise>
          </div>
          <Bars side={s} mine={mine} other={other} labels={labels} dim={dim} />
          {/* total */}
          <div style={{position: 'absolute', left: 0, right: 0, top: ROW0 + 3 * ROWH + 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, opacity: f >= 124 ? 1 : 0}}>
            <Label color="#9AA0AA" size={26}>{totalLabel}</Label>
            <PxText text={countUp(f, 124, 18, total(s), 9)} px={9} bands={resolved && isWinner ? ['#FFF6D0', '#FFE680', '#FFD34E', '#E8901A'] : undefined} color="#fff" shadowColor={resolved && isWinner ? '#4A2A00' : undefined} />
          </div>
          {resolved && isWinner && (
            <div style={{position: 'absolute', left: 0, right: 0, top: -26, display: 'flex', justifyContent: 'center'}}>
              <div style={{position: 'relative', overflow: 'hidden', transform: `scale(${EASE.back(win(f, resolve, 8))})`}}>
                <RarityTag rarity="gilded" size={30} text={winnerText} />
                <Shine at={resolve + 6} dur={14} w={50} opacity={0.5} />
              </div>
            </div>
          )}
        </CutPanel>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      {bg && <McdBackdrop kind="inventory" drift={f * 0.4} cell={44} />}
      {bg && <Embers count={24} size={8} seed={7} speed={0.6} style={{opacity: 0.7}} />}
      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 26, display: 'flex', justifyContent: 'center', opacity: stepQ(win(f, 0, 8), 4)}}>
        <Label size={30} color={MCD.goldBright}>{title}</Label>
      </div>
      {sideNode(a, 0, b, enter(0), win_ === 'a')}
      {sideNode(b, 1, a, enter(1), win_ === 'b')}

      {/* centre strip: VS + row labels */}
      <div style={{position: 'absolute', left: 890, top: 100, width: 140, height: PH, pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 0, top: 150, transform: `scale(${EASE.back(win(f, 14, 8))})`}}>
          <HexBadge w={140} ring="#E8A81C" ringHi="#FCE693" fill="#1A1208" glow="rgba(248,200,80,0.4)">
            <PxText text={vsText} px={5} color={MCD.goldBright} shadowColor="#2A1600" />
          </HexBadge>
        </div>
        {labels.map((l, i) => (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: ROW0 + i * ROWH + 4, height: 56, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: f >= rowStart(i) - 6 ? 1 : 0}}>
            <PxText text={l} px={3} color="#E0E2E8" />
          </div>
        ))}
      </div>

      {resolved && <CrossFlash x={win_ === 'a' ? 490 : 1430} y={100 + 24 + 140} at={resolve} arm={220} thick={16} color="#FFF6C0" dur={16} />}
      {resolved && <Burst x={win_ === 'a' ? 490 : 1430} y={100 + 24 + 140} at={resolve} count={26} size={14} speed={1} life={28} seed={31} />}
      <WhiteFlash at={resolve} dur={10} peak={0.22} steps={5} />
      {audio && (
        <>
          {[0, 1, 2].map((i) => (
            <Sequence key={i} from={rowStart(i) + 8}>
              <Audio src={mcSound('random/click')} volume={0.2} playbackRate={0.9 + i * 0.12} />
            </Sequence>
          ))}
          <Sequence from={4}>
            <Audio src={mcSound('ui/toast/in')} volume={0.3} />
          </Sequence>
          <Sequence from={resolve}>
            <Audio src={mcSound('random/levelup')} volume={0.35} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
void clamp01;
