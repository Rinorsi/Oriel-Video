// mcd-v-player-join: "player joined / left the adventure" toast stack, top-left.
// A chamfered dark bar slides in from the left edge with a hexagon avatar (real skin face via PlayerBust), a coloured player stripe,
// gold "joined" or red "left" caption and the hard-shadow name; pixel sparks pop at the avatar on joining, a shine crosses the bar,
// then it slides back out. Leaving bars desaturate and shed grey debris.
// Props: events [{kind:'join'|'leave', name, skin, color, at, hold}], joinText, leaveText, hud (demo only), bg, biome.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {HexBadge, HudBase, MCD, McdText, PlayerBust, PxText} from '../mcdkit/kit';
import {Burst, CrossFlash, SceneBg, Shine, stepQ, win, type BiomeId} from './common';

export type JoinEvent = {kind: 'join' | 'leave'; name: string; skin: string; color: string; at: number; hold: number};

const DEFAULT_EVENTS: JoinEvent[] = [
  {kind: 'join', name: 'Alex_MC', skin: 'alex', color: '#48D8A8', at: 6, hold: 62},
  {kind: 'leave', name: '凯文', skin: 'kai', color: '#E058B8', at: 36, hold: 62},
  {kind: 'join', name: '小雨', skin: 'zuri', color: '#D8A038', at: 68, hold: 66},
];

const BW = 820;
const BH = 144;
const GAP = 20;
const LEFT = 80;
const TOP = 90;

const SignDiamond: FC<{sign: '+' | '-'; color: string; size?: number}> = ({sign, color, size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges" style={{flex: 'none'}}>
    <polygon points="10,0 20,10 10,20 0,10" fill="#000" />
    <polygon points="10,1.6 18.4,10 10,18.4 1.6,10" fill={color} />
    <polygon points="10,1.6 18.4,10 10,10 1.6,10" fill="rgba(255,255,255,0.28)" />
    <rect x={5.5} y={9} width={9} height={2} fill="#fff" />
    {sign === '+' && <rect x={9} y={5.5} width={2} height={9} fill="#fff" />}
  </svg>
);

const Bar: FC<{e: JoinEvent; slot: number; joinText: string; leaveText: string}> = ({e, slot, joinText, leaveText}) => {
  const f = useCurrentFrame();
  const join = e.kind === 'join';
  const tIn = win(f, e.at, 10);
  const outAt = e.at + 10 + e.hold;
  const tOut = win(f, outAt, 8);
  if (f < e.at || f > outAt + 9) return null;
  // slide: in with a one-step overshoot, out accelerating
  const inX = -(BW + LEFT + 40) * (1 - EASE.out(tIn));
  const over = tIn >= 1 && f < e.at + 13 ? 16 : 0;
  const outX = -(BW + LEFT + 40) * EASE.in(tOut);
  const x = Math.round((inX + over + outX) / 8) * 8;
  const y = TOP + slot * (BH + GAP);
  const accent = join ? MCD.goldBright : '#FF7A6A';
  const edge = join ? '#4A4A52' : '#5A3036';
  const landed = e.at + 10;
  const cx = LEFT + 78;
  const cy = y + BH / 2;
  return (
    <>
      <div style={{position: 'absolute', left: LEFT, top: y, width: BW, height: BH, transform: `translateX(${x}px)`}}>
        <svg width={BW} height={BH} style={{position: 'absolute', inset: 0}}>
          <polygon points={`0,0 ${BW - 30},0 ${BW},30 ${BW},${BH} 30,${BH} 0,${BH - 30}`} fill="#000" opacity={0.6} transform="translate(0 8)" />
          <polygon points={`0,0 ${BW - 30},0 ${BW},30 ${BW},${BH} 30,${BH} 0,${BH - 30}`} fill={edge} />
          <polygon points={`4,4 ${BW - 31},4 ${BW - 4},31 ${BW - 4},${BH - 4} 31,${BH - 4} 4,${BH - 31}`} fill="#16161A" />
          <polygon points={`4,4 ${BW - 31},4 ${BW - 4},31 ${BW - 4},${BH - 4} 31,${BH - 4} 4,${BH - 31}`} fill={join ? 'rgba(180,120,30,0.14)' : 'rgba(160,30,40,0.18)'} />
          <rect x={4} y={4} width={10} height={BH - 8 - 27} fill={e.color} />
        </svg>
        <div style={{position: 'absolute', left: 34, top: 0, height: BH, display: 'flex', alignItems: 'center'}}>
          <HexBadge w={104} ring={e.color} ringHi="#ffffff" fill="#0A0A0E" ringW={7} glow={join ? `${e.color}88` : undefined}>
            <div style={{width: 72, height: 62, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', filter: join ? undefined : 'grayscale(0.7) brightness(0.8)'}}>
              <PlayerBust skin={e.skin} scale={5} style={{transform: 'translateY(8px)'}} />
            </div>
          </HexBadge>
        </div>
        <div style={{position: 'absolute', left: 168, top: 0, height: BH, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10}}>
          <McdText size={30} weight={800} color={accent} style={{letterSpacing: 3}}>{join ? joinText : leaveText}</McdText>
          <PxText text={e.name} px={4} color={join ? '#fff' : '#C8C8CE'} />
        </div>
        <div style={{position: 'absolute', right: 34, top: 0, height: BH, display: 'flex', alignItems: 'center'}}>
          <SignDiamond sign={join ? '+' : '-'} color={join ? '#3F8E4F' : '#B02A3A'} />
        </div>
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `polygon(0 0,${BW - 30}px 0,${BW}px 30px,${BW}px ${BH}px,30px ${BH}px,0 ${BH - 30}px)`}}>
          <Shine at={landed + 2} dur={14} w={70} opacity={join ? 0.28 : 0.14} />
        </div>
      </div>
      {join ? (
        <>
          <CrossFlash x={cx} y={cy} at={landed} arm={70} thick={10} color="#FFF0B0" dur={12} />
          <Burst x={cx} y={cy} at={landed} count={14} size={10} speed={0.7} life={22} seed={e.at} colors={[MCD.title, '#FFF6C0', e.color]} />
        </>
      ) : (
        <Burst x={cx} y={cy} at={landed} count={12} size={10} speed={0.5} life={24} seed={e.at + 3} gravity={0.9} up={-0.2} colors={['#8A8A92', '#C8C8CE', '#B02A3A']} />
      )}
    </>
  );
};

export type Present = {skin: string; color: string};
const PRESENT: Present[] = [
  {skin: 'steve', color: '#8060E8'},
  {skin: 'kai', color: '#E058B8'},
  {skin: 'efe', color: '#D8A038'},
];

/** Top-right online roster: hexagon avatars that pop in on join and grey out / drop off on leave. */
const Roster: FC<{events: JoinEvent[]; present: Present[]; label: string}> = ({events, present, label}) => {
  const f = useCurrentFrame();
  const entries = [
    ...present.map((p) => {
      const lv = events.find((e) => e.kind === 'leave' && e.skin === p.skin);
      return {...p, from: -100, to: lv ? lv.at + 10 : Infinity};
    }),
    ...events.filter((e) => e.kind === 'join').map((e) => ({skin: e.skin, color: e.color, from: e.at + 10, to: Infinity})),
  ];
  const live = entries.filter((e) => f >= e.from - 6 && f < e.to + 10);
  const count = entries.filter((e) => f >= e.from && f < e.to).length;
  const W = 72;
  return (
    <div style={{position: 'absolute', right: 80, top: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, opacity: stepQ(win(f, 0, 8), 4)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <McdText size={28} weight={800} color="#E4E6EA" style={{letterSpacing: 3}}>{label}</McdText>
        <PxText text={count} px={4} color={MCD.goldBright} shadowColor="#2A1600" />
      </div>
      <div style={{display: 'flex', gap: 10}}>
        {live.map((e, i) => {
          const popT = EASE.back(win(f, e.from - 6, 8));
          const leaving = f >= e.to;
          return (
            <div key={`${e.skin}${i}`} style={{transform: `scale(${leaving ? 1 - win(f, e.to, 10) : popT}) translateY(${leaving ? win(f, e.to, 10) * 16 : 0}px)`, filter: leaving ? 'grayscale(1) brightness(0.8)' : undefined, opacity: leaving ? 1 - win(f, e.to, 10) : 1}}>
              <HexBadge w={W} ring={e.color} ringHi="#fff" fill="#0A0A0E" ringW={5} outlineW={3}>
                <div style={{width: 50, height: 44, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
                  <PlayerBust skin={e.skin} scale={3} style={{transform: 'translateY(5px)'}} />
                </div>
              </HexBadge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PlayerJoin: FC<{
  bg?: boolean;
  hud?: boolean;
  events?: JoinEvent[];
  present?: Present[];
  rosterLabel?: string;
  roster?: boolean;
  joinText?: string;
  leaveText?: string;
  biome?: BiomeId;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, hud, events = DEFAULT_EVENTS, present = PRESENT, rosterLabel = '在线', roster = true, joinText = '加入了冒险', leaveText = '离开了冒险', biome = 'camp', audio = true}) => {
  const f = useCurrentFrame();
  void f;
  return (
    <AbsoluteFill>
      {bg && (
        <SceneBg biome={biome} dim={0.14}>
          {hud && (
            <div style={{position: 'absolute', left: (1920 - 1314) / 2, bottom: -2}}>
              <HudBase scale={0.9} appear={1} hp={1} level={9} xp={0.7} />
            </div>
          )}
        </SceneBg>
      )}
      {/* soft shade so the bars read on bright footage */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1100, height: 640, background: 'radial-gradient(ellipse 100% 100% at 0% 0%, rgba(2,4,10,0.62), rgba(2,4,10,0) 72%)'}} />
      {roster && <Roster events={events} present={present} label={rosterLabel} />}
      {events.map((e, i) => (
        <Bar key={i} e={e} slot={i} joinText={joinText} leaveText={leaveText} />
      ))}
      {audio &&
        events.map((e, i) => (
          <Sequence key={i} from={e.at}>
            <Audio src={mcSound(e.kind === 'join' ? 'ui/toast/in' : 'ui/toast/out')} volume={0.35} />
          </Sequence>
        ))}
      {audio &&
        events.map((e, i) => (
          <Sequence key={`o${i}`} from={e.at + 10 + e.hold}>
            <Audio src={mcSound('ui/toast/out')} volume={0.18} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
void clamp01;
void stepQ;
