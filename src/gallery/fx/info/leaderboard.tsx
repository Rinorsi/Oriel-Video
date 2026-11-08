import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {LightRays, PixelBurst} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE, PlayerFace} from '../../../mg/Ore';
import {mcSound} from '../../../reel/kit';
import {Bolt, Halftone, Icon, PX, Shine, Slab, Sparkles, Stage, W, H, back, lerp, pr, spring, Sfx} from './ui';

/**
 * Leaderboard Top 5 (transparent overlay): rows slide in one by one, then the scores update, rows overtake each other and swap
 * places (the climber flashes green), the crown arcs over to the new leader with a burst of light.
 * Props:
 *   players : [{name, skin, a, b}]  a = score before the update, b = score after; rank is derived from the scores
 *   title   : header text
 *   unit    : text after the header ("本周" chip)
 *   topLabel: gold tag after the title (default "TOP 5"); periodBefore / periodAfter: chip text before / after the update
 *   bannerText: vertical text on the hanging banners (2 chars); updateAt: frame the scores update (default 120); dim: backdrop darkness multiplier; frames: total length
 */

export const BOARD_FRAMES = 280;

export type BoardPlayer = {name: string; skin: string; a: number; b: number};
const skin = (n: string) => `entity/player/wide/${n}.png`;
const PLAYERS: BoardPlayer[] = [
  {name: '艾利克斯', skin: skin('alex'), a: 2480, b: 2620},
  {name: '史蒂夫', skin: skin('steve'), a: 2310, b: 2990},
  {name: '凯', skin: skin('kai'), a: 2105, b: 2290},
  {name: '诺尔', skin: skin('noor'), a: 1890, b: 2010},
  {name: '祖里', skin: skin('zuri'), a: 1650, b: 2450},
];

const RANKS = ['#f8af2b', '#c9d2dc', '#c9803a'];
const rankOf = (ps: BoardPlayer[], key: 'a' | 'b') => ps.map((p) => ps.filter((q) => q[key] > p[key] || (q[key] === p[key] && ps.indexOf(q) < ps.indexOf(p))).length);

export const Leaderboard: FC<{bg?: boolean; players?: BoardPlayer[]; title?: string; unit?: string; topLabel?: string; periodBefore?: string; periodAfter?: string; bannerText?: string; updateAt?: number; dim?: number; frames?: number}> = ({
  bg,
  players = PLAYERS,
  title = '击杀排行榜',
  unit = '本周',
  topLabel = 'TOP 5',
  periodBefore = '第 11 周',
  periodAfter = '第 12 周 ▲',
  bannerText = '榜单',
  updateAt: T_UPD = 120,
  dim = 1,
  frames = BOARD_FRAMES,
}) => {
  const f = useCurrentFrame();
  const N = frames;
  const outP = pr(f, N - 26, 22, EASE.in);
  const inP = back(pr(f, 0, 16, (t) => t));
  const PW = 1360;
  const PH = 940;
  const PX0 = (W - PW) / 2;
  const PY0 = (H - PH) / 2 + 6;
  const ROW = 148;
  const upd = spring(pr(f, T_UPD, 36, (t) => t), 7, 4.2);
  const updLin = pr(f, T_UPD, 36, (t) => t);
  const ra = rankOf(players, 'a');
  const rb = rankOf(players, 'b');
  const maxScore = Math.max(...players.map((p) => Math.max(p.a, p.b)));
  const leadA = ra.indexOf(0);
  const leadB = rb.indexOf(0);
  const rowEnter = (i: number) => 24 + ra[i] * 9;
  const posOf = (i: number) => lerp(ra[i], rb[i], Math.min(1.08, upd));
  const crownT = EASE.inOut(clamp01((f - (T_UPD + 12)) / 20));
  const crownIn = back(pr(f, 70, 14, (t) => t));
  const cp = lerp(posOf(leadA), posOf(leadB), crownT);
  const crownY = PY0 + 168 + cp * ROW - 56 - Math.sin(crownT * Math.PI) * 140 + Math.sin(f / 7) * 4;
  const crownDrop = (1 - crownIn) * -300;
  const leaderNow = f > T_UPD + 20 ? leadB : leadA;
  const leaderPosNow = posOf(leaderNow);

  const banner = (side: 0 | 1) => {
    const at = 6 + side * 4;
    const hang = spring(pr(f, at, 24, (t) => t), 7, 4.5);
    const sway = Math.sin(f / 16 + side * 2) * 2.5 * hang;
    return (
      <div key={side} style={{position: 'absolute', top: 0, [side ? 'right' : 'left']: 60, width: 190, height: 760, transform: `translateY(${(hang - 1) * 780 - outP * 800}px) rotate(${sway}deg)`, transformOrigin: '50% 0%'}}>
        <div style={{position: 'absolute', left: 20, right: 20, top: 0, height: 36, background: '#5b3d1e', boxShadow: '0 0 0 4px #000, inset 0 6px 0 #8a5a2b'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 24, bottom: 0, background: side ? '#3b5fcf' : '#c92a45', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 90%, 0 100%)', boxShadow: 'inset 0 0 0 8px rgba(0,0,0,0.35)'}}>
          <Halftone color="#000" opacity={0.15} />
          <div style={{position: 'absolute', left: 14, right: 14, top: 14, bottom: 66, border: '6px solid #f8af2b'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center'}}>
            <Icon name={side ? 'sword' : 'trophy'} px={12} outline="#000" />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 240, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 8}}>
            {[...bannerText].map((c) => (
              <PX key={c} size={60} color="#ffe08a" shadow="rgba(0,0,0,0.6)">{c}</PX>
            ))}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', gap: 16}}>
            {[0, 1, 2].map((s) => (
              <Icon key={s} name="dot" px={4} color="#f8af2b" />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Stage bg={bg}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(6,8,18,${0.58 * dim * pr(f, 0, 12) * (1 - outP)})`}} />
      {banner(0)}
      {banner(1)}
      <LightRays x={PX0 + 100} y={PY0 + 168 + leaderPosNow * ROW + 70} size={1500} opacity={0.2 * pr(f, 70, 20) * (1 - outP)} color="255,205,90" rays={14} />
      <div style={{position: 'absolute', left: PX0, top: PY0, width: PW, height: PH, transform: `translateY(${(1 - Math.min(1, inP)) * 600 + outP * 700}px) scale(${0.94 + 0.06 * Math.min(1, inP)})`, opacity: 1 - outP}}>
        <Slab w={PW} h={PH} tone="panel_raised" shadow={16}>
          <Halftone color="#000" opacity={0.12} />
          <Bolt x={28} y={28} />
          <Bolt x={PW - 28} y={28} />
          <Bolt x={28} y={PH - 28} />
          <Bolt x={PW - 28} y={PH - 28} />
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <Shine p={pr(f, 10, 28, (t) => t)} />
          </div>
          {/* header */}
          <div style={{position: 'absolute', left: 60, top: 36, display: 'flex', alignItems: 'center', gap: 28}}>
            <Icon name="trophy" px={8} outline="#000" />
            <PX size={84} color="#fff">{title}</PX>
            <PX size={84} color={ORE.gold}>{topLabel}</PX>
          </div>
          <div style={{position: 'absolute', right: 60, top: 52}}>
            <div style={{height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', background: '#1e1e1f', boxShadow: '0 0 0 4px #000, inset 0 4px 0 #48494a'}}>
              <PX size={36} color={f < T_UPD ? '#fff' : ORE.greenLight}>{f < T_UPD ? `${unit} · ${periodBefore}` : `${unit} · ${periodAfter}`}</PX>
            </div>
          </div>
          <div style={{position: 'absolute', left: 60, right: 60, top: 140, height: 8, background: ORE.gold, boxShadow: '0 0 0 4px #000', transform: `scaleX(${pr(f, 6, 18)})`, transformOrigin: '0 50%'}} />
        </Slab>
        {/* rows */}
        {players.map((p, i) => {
          const enter = pr(f, rowEnter(i), 18, (t) => t);
          const slideX = (1 - spring(enter, 7, 4.8)) * 1500;
          const pos = posOf(i);
          const y = 168 + pos * ROW;
          const climbed = rb[i] < ra[i];
          const moving = f >= T_UPD && f < T_UPD + 40;
          const lift = moving && climbed ? Math.sin(clamp01((f - T_UPD) / 36) * Math.PI) : 0;
          const shown = Math.round(lerp(p.a, p.b, EASE.out(updLin)));
          const rankNow = Math.round(pos);
          const isLead = rankNow === 0 && f > 60;
          const bar = (shown / maxScore) * 300;
          const flash = climbed ? Math.max(0, 1 - Math.abs(f - (T_UPD + 20)) / 22) : 0;
          const delta = ra[i] - rb[i];
          const col = RANKS[rankNow] ?? '#6d6f73';
          const arrowAt = T_UPD + 34;
          return (
            <div key={p.name} style={{position: 'absolute', left: 40, top: y, width: PW - 80, height: ROW - 16, transform: `translateX(${slideX}px) scale(${1 + lift * 0.035 + (isLead ? 0.012 : 0)})`, zIndex: Math.round(10 - pos * 2 + lift * 20), opacity: enter > 0 ? 1 : 0}}>
              <div style={{position: 'absolute', inset: 0, background: isLead ? '#3b3320' : '#1e1e1f', boxShadow: `0 0 0 4px ${isLead ? '#f8af2b' : '#000'}, inset 0 6px 0 rgba(255,255,255,0.08), 0 8px 0 4px rgba(0,0,0,0.45)${isLead ? ', 0 0 40px rgba(248,175,43,0.45)' : ''}`}} />
              {flash > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(90,255,120,${flash * 0.35})`}} />}
              {isLead && <Halftone color="#f8af2b" opacity={0.14} size={20} dot={4} />}
              {/* rank badge */}
              <div style={{position: 'absolute', left: 24, top: 16, width: 100, height: 100, background: col, boxShadow: '0 0 0 4px #000, inset 0 8px 0 rgba(255,255,255,0.4), inset 0 -8px 0 rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <PX size={72} color={rankNow < 3 ? '#2b1d05' : '#fff'} shadow={false}>{String(rankNow + 1)}</PX>
              </div>
              {/* avatar */}
              <div style={{position: 'absolute', left: 148, top: 16, width: 100, height: 100}}>
                <Slab w={100} h={100} tone="panel_glass" shadow={0} style={{boxShadow: '0 0 0 4px #000'}}>
                  <div style={{position: 'absolute', left: 10, top: 10}}>
                    <PlayerFace size={80} skin={p.skin} />
                  </div>
                </Slab>
              </div>
              <div style={{position: 'absolute', left: 276, top: 32}}>
                <PX size={60} color={isLead ? '#ffe08a' : '#fff'} shadow="rgba(0,0,0,0.6)">{p.name}</PX>
              </div>
              {/* score bar */}
              <div style={{position: 'absolute', left: 620, top: 44, width: 316, height: 44, background: '#0c0c0e', boxShadow: '0 0 0 4px #000'}}>
                <div style={{position: 'absolute', left: 8, top: 8, width: Math.round(bar / 4) * 4, height: 28, background: col, boxShadow: `inset 0 8px 0 rgba(255,255,255,0.4), inset 0 -8px 0 rgba(0,0,0,0.3)`}} />
              </div>
              {/* delta */}
              {f >= arrowAt && (
                <div style={{position: 'absolute', left: 960, top: 34, display: 'flex', alignItems: 'center', gap: 10, transform: `scale(${back(pr(f, arrowAt, 10, (t) => t))})`, transformOrigin: '0 50%'}}>
                  {delta !== 0 ? <Icon name={climbed ? 'up' : 'down'} px={6} outline="#000" /> : <PX size={48} color={ORE.faint}>—</PX>}
                  {delta !== 0 && <PX size={48} color={climbed ? '#6cff8a' : '#ff6a6a'}>{String(Math.abs(delta))}</PX>}
                </div>
              )}
              <div style={{position: 'absolute', right: 32, top: 24, width: 200, textAlign: 'right', transform: `scale(${1 + (moving ? 0.1 : 0)})`, transformOrigin: '100% 50%'}}>
                <PX size={72} color={isLead ? '#ffd35a' : '#fff'} shadow="rgba(0,0,0,0.6)">{String(shown)}</PX>
              </div>
              <Sparkles x={0} y={0} w={400} h={130} count={isLead ? 4 : 0} seed={i + 5} px={4} color="#ffe08a" at={90} />
            </div>
          );
        })}
      </div>
      {/* crown flies to the leader */}
      <div style={{position: 'absolute', left: PX0 + 40 - 14, top: crownY + crownDrop, opacity: (1 - outP) * (crownIn > 0 ? 1 : 0), transform: `rotate(${-14 + Math.sin(crownT * Math.PI * 2) * 20}deg) scale(${1 + Math.sin(crownT * Math.PI) * 0.3})`, zIndex: 50}}>
        <Icon name="crown" px={10} outline="#000" />
      </div>
      <PixelBurst x={PX0 + 114} y={PY0 + 168 + posOf(leadA) * ROW + 66} at={78} count={22} colors={['#f8af2b', '#ffe08a', '#fff']} speed={16} life={26} size={12} seed={9} />
      <PixelBurst x={PX0 + 114} y={PY0 + 168 + 66} at={T_UPD + 28} count={34} colors={['#f8af2b', '#ffe08a', '#fff']} speed={20} life={30} size={14} seed={10} />
      {rb.map((r, i) => (
        <PixelBurst key={i} x={PX0 + 114} y={PY0 + 168 + r * ROW + 66} at={T_UPD + 26} count={r < ra[i] ? 14 : 0} colors={['#6cff8a', '#a6ff9a', '#fff']} speed={12} life={22} size={10} seed={i + 60} />
      ))}
      {players.map((_, i) => (
        <Sfx key={i} at={rowEnter(i)} src={mcSound('random/click')} volume={0.28} rate={0.9 + i * 0.1} />
      ))}
      <Sfx at={rowEnter(0) + 4} src={mcSound('ui/toast/in')} volume={0.3} />
      <Sfx at={78} src={mcSound('random/levelup')} volume={0.28} rate={1.3} />
      <Sfx at={T_UPD} src={mcSound('random/click')} volume={0.3} rate={0.7} />
      <Sfx at={T_UPD + 12} src={mcSound('random/pop')} volume={0.35} rate={1.2} />
      <Sfx at={T_UPD + 28} src={mcSound('random/orb')} volume={0.45} rate={1.1} />
      <Sfx at={T_UPD + 30} src={mcSound('ui/toast/challenge_complete')} volume={0.25} />
      <Sfx at={N - 26} src={mcSound('ui/toast/out')} volume={0.28} />
    </Stage>
  );
};
