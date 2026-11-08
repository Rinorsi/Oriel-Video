// mcd-v-objectives: top-right mission objectives (hud-ingame-full.png / rqm-orig-gameplay-hud.png).
// Right-aligned bold pixel lines slide in one by one; a finished line gets a green tick and a strike-through sweep;
// a newly added objective flashes gold and is also announced in the upper centre ("NEW OBJECTIVE" gold caption + big white line).
// Props: chapter (gold sub-line), items [{text, appear, done?}] (frames), announceLabel, hud (draw the bottom HUD in the demo), bg, biome.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {HexBadge, HudBase, MCD, McdText, PxArt, PxText, SKULL_ROWS, useTextSize} from '../mcdkit/kit';
import {Burst, CHECK_ROWS, CrossFlash, GoldRule, PxIcon, SceneBg, stepQ, win, type BiomeId} from './common';

export type Objective = {text: string; /** frame it appears */ appear: number; /** frame it is ticked off */ done?: number};

const DEFAULT_ITEMS: Objective[] = [
  {text: '找到要塞入口', appear: 14, done: 76},
  {text: '收集 12 个末影之眼', appear: 24, done: 108},
  {text: '击败要塞守卫', appear: 34, done: 150},
  {text: '点燃末地传送门', appear: 118},
];

const RIGHT = 84;
const TOP = 84;
const ROW_H = 78;
const BOX = 44;

const Row: FC<{o: Objective; i: number; isNewcomer: boolean}> = ({o, i, isNewcomer}) => {
  const f = useCurrentFrame();
  const size = useTextSize(o.text, {px: 3});
  const tIn = win(f, o.appear, 8);
  if (f < o.appear) return null;
  const dx = Math.round(((1 - EASE.out(tIn)) * 120) / 8) * 8;
  const done = o.done !== undefined && f >= o.done;
  const strike = o.done !== undefined ? stepQ((f - o.done) / 9, 6) : 0;
  const goldFlash = isNewcomer ? clamp01(1 - (f - o.appear) / 26) : 0;
  const tickT = o.done !== undefined ? win(f, o.done, 7) : 0;
  const color = done ? '#9AA0AA' : goldFlash > 0.02 && f % 6 < 4 ? '#FFE680' : goldFlash > 0 ? '#FFD34E' : '#FFFFFF';
  const w = size?.w ?? 400;
  const y = TOP + 70 + i * ROW_H;
  return (
    <div style={{position: 'absolute', right: RIGHT, top: y, height: ROW_H, display: 'flex', alignItems: 'center', gap: 20, transform: `translateX(${dx}px)`, opacity: stepQ(tIn, 4)}}>
      {isNewcomer && goldFlash > 0 && <div style={{position: 'absolute', right: -16, top: 8, bottom: 8, width: w + BOX + 70, background: `linear-gradient(270deg, rgba(248,216,104,${0.5 * goldFlash}), rgba(248,216,104,0))`}} />}
      <div style={{position: 'relative'}}>
        <PxText text={o.text} px={3} color={color} shadowColor={isNewcomer && goldFlash > 0 ? '#2A1600' : undefined} />
        {strike > 0 && <div style={{position: 'absolute', right: 0, top: '50%', marginTop: -3, height: 6, width: w * strike, background: '#E8E8EC', boxShadow: '4px 4px 0 #050202'}} />}
      </div>
      {/* check box: chamfered bevel square */}
      <div style={{position: 'relative', width: BOX, height: BOX, flex: 'none'}}>
        <svg width={BOX} height={BOX} style={{position: 'absolute', inset: 0}}>
          <polygon points="0,8 8,0 44,0 44,36 36,44 0,44" fill="#000" />
          <polygon points="3,9 9,3 41,3 41,35 35,41 3,41" fill={done ? '#3F8E4F' : '#2A2A30'} />
          <polygon points="3,9 9,3 41,3 41,8 3,8" fill={done ? '#60CF73' : '#5A5A62'} />
          <polygon points="3,36 41,36 41,35 35,41 3,41" fill={done ? '#23582E' : '#18181C'} />
        </svg>
        {done && (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${EASE.back(tickT)})`}}>
            <PxIcon rows={CHECK_ROWS} px={4} color="#fff" />
          </div>
        )}
      </div>
      {o.done !== undefined && f >= o.done && f < o.done + 14 && <CrossFlash x={w + 20 + BOX / 2} y={ROW_H / 2} at={o.done} arm={44} thick={8} color="#B8FFA0" dur={12} />}
      {isNewcomer && <CrossFlash x={w + 20 + BOX / 2} y={ROW_H / 2} at={o.appear + 2} arm={64} thick={10} color="#FFE680" dur={14} />}
    </div>
  );
};

export const Objectives: FC<{
  bg?: boolean;
  hud?: boolean;
  chapter?: string;
  items?: Objective[];
  announceLabel?: string;
  biome?: BiomeId;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, hud, chapter = '第三章 · 末地要塞', items = DEFAULT_ITEMS, announceLabel = '新目标', biome = 'forest-night', audio = true}) => {
  const f = useCurrentFrame();
  const last = items.reduce((m, o) => (o.appear > m.appear ? o : m), items[0]);
  const newcomerAppear = last.appear;
  const aT = f - newcomerAppear;
  const announce = aT >= 0 && aT < 62;
  const aIn = EASE.back(win(f, newcomerAppear, 8));
  const aOut = aT > 46 ? 1 - stepQ((aT - 46) / 14, 4) : 1;
  return (
    <AbsoluteFill>
      {bg && (
        <SceneBg biome={biome} dim={0.12}>
          {hud && (
            <div style={{position: 'absolute', left: (1920 - 1314) / 2, bottom: -2}}>
              <HudBase scale={0.9} appear={1} hp={0.85} level={7} xp={0.4} />
            </div>
          )}
        </SceneBg>
      )}
      {/* legibility shade, top-right */}
      <div style={{position: 'absolute', right: 0, top: 0, width: 900, height: 520, background: 'radial-gradient(ellipse 100% 100% at 100% 0%, rgba(2,4,10,0.72), rgba(2,4,10,0) 72%)', opacity: win(f, 0, 8)}} />

      {/* header */}
      <div style={{position: 'absolute', right: RIGHT, top: TOP - 8, display: 'flex', alignItems: 'center', gap: 18, opacity: stepQ(win(f, 4, 8), 4)}}>
        <McdText size={30} weight={800} color={MCD.goldBright} style={{letterSpacing: 2}}>{chapter}</McdText>
        <HexBadge w={44} ring="#E8A81C" ringHi="#FCE693" fill="#E8A81C" ringW={4}>
          <PxArt rows={SKULL_ROWS} pal={{k: '#0A0806'}} px={2} />
        </HexBadge>
      </div>
      <div style={{position: 'absolute', right: RIGHT, top: TOP + 44, width: 420, height: 4, background: `linear-gradient(270deg, ${MCD.gold}, rgba(248,216,104,0))`, transformOrigin: '100% 50%', transform: `scaleX(${win(f, 6, 10)})`}} />

      {announce && <div style={{position: 'absolute', left: 0, width: 1280, top: 214, height: 230, background: 'linear-gradient(90deg, rgba(2,4,10,0), rgba(2,4,10,0.62) 22%, rgba(2,4,10,0.62) 78%, rgba(2,4,10,0))', opacity: aOut * stepQ(aIn, 4)}} />}
      {items.map((o, i) => (
        <Row key={i} o={o} i={i} isNewcomer={o === last && items.length > 1} />
      ))}

      {/* centre announcement for the newest objective */}
      {announce && (
        <div style={{position: 'absolute', left: 0, width: 1280, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: aOut, transform: `scale(${0.9 + 0.1 * aIn})`}}>
          <McdText size={34} weight={800} color={MCD.goldBright} style={{letterSpacing: 6}}>{announceLabel}</McdText>
          <GoldRule w={360} />
          <PxText text={last.text} px={6} />
        </div>
      )}
      <Burst x={1920 - RIGHT - BOX / 2} y={TOP + 70 + (items.length - 1) * ROW_H + ROW_H / 2} at={newcomerAppear + 2} count={14} size={12} life={22} speed={0.7} seed={9} />

      {audio &&
        items.map((o, i) => (
          <Sequence key={i} from={o.appear}>
            <Audio src={mcSound('ui/toast/in')} volume={i === items.length - 1 ? 0.35 : 0.2} />
          </Sequence>
        ))}
      {audio &&
        items.map(
          (o, i) =>
            o.done !== undefined && (
              <Sequence key={`d${i}`} from={o.done}>
                <Audio src={mcSound('random/orb')} volume={0.28} playbackRate={1 + i * 0.1} />
              </Sequence>
            ),
        )}
    </AbsoluteFill>
  );
};
