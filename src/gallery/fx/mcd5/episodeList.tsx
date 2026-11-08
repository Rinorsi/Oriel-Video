// mcd-v-episode-list: chapter list for the start of a video. Hexagon numbers light up one by one along a progress track;
// finished chapters get a green check, the current chapter is a gold highlighted slab, the rest stay dim.
// Props: title, episode, items [{title, time}], current (0-based), preview (item id shown in the diamond), biome, bg.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {DiamondFrame, Embers, HexBadge, ItemIcon3D, MCD, McdText, PxText, itemTex} from '../mcdkit/kit';
import {CrossFlash, GoldRule, Label, Pop, PxIcon, CHECK_ROWS, Rise, SceneBg, Shine, SideShade, stepQ, win, type BiomeId} from './common';

export type EpisodeItem = {title: string; time: string};

const DEFAULT_ITEMS: EpisodeItem[] = [
  {title: '开局与出生点', time: '00:00'},
  {title: '第一夜 苦力怕来访', time: '02:35'},
  {title: '矿洞深处的秘密', time: '06:10'},
  {title: '下界要塞突围', time: '11:48'},
  {title: '终局 末影龙', time: '16:20'},
];

export const EpisodeList: FC<{
  bg?: boolean;
  title?: string;
  episode?: string;
  items?: EpisodeItem[];
  current?: number;
  preview?: string;
  biome?: BiomeId;
  /** 副标题「共 N 章」；不传则自动用「共 ${items.length} 章」 */
  countText?: string;
  /** 当前章节高亮上的小标签，默认 NOW */
  nowTag?: string;
  /** 右侧预览下方的小标题，默认「正在进行」 */
  progressLabel?: string;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, title = '本期目录', episode = 'EPISODE 07', items = DEFAULT_ITEMS, current = 2, preview = 'netherite_pickaxe', biome = 'forest-night', countText, nowTag = 'NOW', progressLabel = '正在进行', audio = true}) => {
  const f = useCurrentFrame();
  const top0 = 322;
  const rowH = 128;
  const hexW = 84;
  const hexH = (hexW * 2) / Math.sqrt(3);
  const lightAt = (i: number) => 50 + i * 9;
  const cy = (i: number) => top0 + i * rowH + rowH / 2;
  const trackX = 182;
  // progress of the lit track along the list
  const reached = items.reduce((n, _, i) => (f >= lightAt(i) ? i + 1 : n), 0);
  const trackFill = reached === 0 ? 0 : cy(Math.min(reached - 1, current)) - cy(0);
  const curT = win(f, lightAt(current), 8);
  const body = (
    <>
      {/* list panel */}
      <div style={{position: 'absolute', left: 84, top: 56, width: 1010, height: 944, opacity: win(f, 0, 6) > 0 ? 1 : 0}}>
        <svg width={1010} height={944} style={{position: 'absolute', inset: 0}}>
          <polygon points="40,0 1010,0 1010,904 970,944 0,944 0,40" fill="#34343A" />
          <polygon points="43,3 1007,3 1007,903 969,941 3,941 3,43" fill="rgba(10,10,16,0.82)" />
          <polygon points="43,3 1007,3 1007,903 969,941 3,941 3,43" fill="rgba(110,30,26,0.16)" />
        </svg>
      </div>
      {/* title block */}
      <div style={{position: 'absolute', left: 140, top: 96}}>
        <Rise at={2} dur={8} dy={14}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <Label color={MCD.goldBright} size={26}>{episode}</Label>
            <Label color="#8A8F9A" size={22}>{countText ?? `共 ${items.length} 章`}</Label>
          </div>
        </Rise>
        <Pop at={4} dur={8} origin="0% 50%" style={{marginTop: 10}}>
          <PxText text={title} px={7} hi="#fff" />
        </Pop>
        <div style={{marginTop: 22, opacity: win(f, 12, 8)}}>
          <GoldRule w={760} />
        </div>
      </div>

      {/* track */}
      <div style={{position: 'absolute', left: trackX - 3, top: cy(0), width: 6, height: cy(items.length - 1) - cy(0), background: '#2C2C32', boxShadow: '0 0 0 2px #000'}} />
      <div style={{position: 'absolute', left: trackX - 3, top: cy(0), width: 6, height: stepQ(trackFill / Math.max(1, cy(items.length - 1) - cy(0)), 24) * (cy(items.length - 1) - cy(0)), background: 'linear-gradient(180deg,#90E49C,#6CCB78 50%,#F8D868)'}} />

      {/* rows */}
      {items.map((it, i) => {
        const done = i < current;
        const isCur = i === current;
        const enter = win(f, 14 + i * 5, 7);
        const lit = f >= lightAt(i);
        const lt = win(f, lightAt(i), 6);
        const flash = lit && f < lightAt(i) + 3;
        const accent = done ? MCD.emerald : isCur ? MCD.goldSel : '#6A6A72';
        const y = top0 + i * rowH;
        const dx = Math.round(((1 - EASE.out(enter)) * -90) / 6) * 6;
        const state = !lit ? 'idle' : done ? 'done' : isCur ? 'cur' : 'dim';
        const hexRing = state === 'idle' ? '#8A8A92' : state === 'done' ? '#58D038' : state === 'cur' ? '#FECC06' : '#55555E';
        const hexFill = flash ? '#FFFFFF' : state === 'cur' ? '#E8A81C' : state === 'done' ? '#0E2A12' : '#0C0C10';
        const titleColor = state === 'cur' ? '#FFF2B0' : state === 'done' ? '#E8E8EC' : state === 'dim' ? '#8C8C94' : '#fff';
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: y, width: 1100, height: rowH, opacity: enter > 0 ? 1 : 0, transform: `translateX(${dx}px)`}}>
            {/* current highlight slab */}
            {isCur && lit && (
              <div style={{position: 'absolute', left: 118, top: 8, width: 936, height: rowH - 16, overflow: 'hidden', clipPath: 'polygon(0 0,calc(100% - 24px) 0,100% 24px,100% 100%,24px 100%,0 calc(100% - 24px))', transform: `scaleY(${EASE.back(curT)})`, background: 'linear-gradient(90deg, rgba(248,216,104,0.34), rgba(248,216,104,0.10))', boxShadow: 'inset 0 0 0 3px #F8D868'}}>
                <Shine at={lightAt(current) + 4} dur={16} w={90} opacity={0.32} color="#FFF2B0" />
                <Shine at={lightAt(current) + 40} dur={16} w={90} opacity={0.22} color="#FFF2B0" />
              </div>
            )}
            <div style={{position: 'absolute', left: trackX - hexW / 2, top: (rowH - hexH) / 2, transform: `scale(${state === 'idle' ? 1 : 1 + 0.16 * (1 - lt) * (isCur ? 1.4 : 1)})`}}>
              <HexBadge w={hexW} ring={hexRing} ringHi={state === 'idle' ? undefined : flash ? '#fff' : undefined} fill={hexFill} glow={state === 'cur' ? 'rgba(254,204,6,0.55)' : state === 'done' && lt < 1 ? 'rgba(88,208,56,0.45)' : undefined}>
                {state === 'done' ? (
                  <PxIcon rows={CHECK_ROWS} px={5} color={MCD.emerald} />
                ) : (
                  <PxText text={i + 1} px={3} color={state === 'cur' ? '#3A2200' : flash ? '#222' : state === 'dim' ? '#7A7A82' : '#fff'} shadow={state === 'cur' ? 0 : 1} />
                )}
              </HexBadge>
            </div>
            <div style={{position: 'absolute', left: 262, top: 0, height: rowH, display: 'flex', alignItems: 'center'}}>
              <PxText text={it.title} px={isCur ? 4 : 3} color={titleColor} shadowColor={isCur ? '#2A1600' : undefined} />
            </div>
            <div style={{position: 'absolute', right: 112, top: 0, height: rowH, display: 'flex', alignItems: 'center', gap: 16}}>
              {isCur && lit && (
                <div style={{background: MCD.goldSel, padding: '4px 14px', transform: `scale(${EASE.back(win(f, lightAt(current) + 4, 6))})`}}>
                  <McdText size={22} weight={800} color="#2A1600" style={{textShadow: 'none', letterSpacing: 2}}>{nowTag}</McdText>
                </div>
              )}
              <McdText size={30} weight={700} color={state === 'cur' ? MCD.goldBright : '#8A8F9A'} style={{letterSpacing: 1}}>{it.time}</McdText>
            </div>
            {lit && (isCur || done) && <CrossFlash x={trackX} y={y + rowH / 2} at={lightAt(i)} arm={isCur ? 110 : 56} thick={isCur ? 12 : 8} color={isCur ? '#FFE680' : '#B8FFA0'} dur={12} />}
          </div>
        );
      })}

      {/* current chapter preview on the right */}
      <div style={{position: 'absolute', left: 1190, top: 170, width: 620, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Pop at={lightAt(current) + 2} dur={9} origin="50% 60%">
          <DiamondFrame size={540} tier="gilded" glow="rgba(255,205,80,0.5)">
            <ItemIcon3D src={itemTex(preview)} size={220} depth={8} glow="rgba(255,226,120,0.4)" />
          </DiamondFrame>
        </Pop>
        <Rise at={lightAt(current) + 8} dur={8} dy={12} style={{marginTop: 26}}>
          <div style={{background: 'rgba(8,8,12,0.78)', padding: '10px 28px', boxShadow: 'inset 0 0 0 3px #3A3A40', display: 'flex', alignItems: 'center', gap: 18}}>
            <Label size={24} color="#8A8F9A">{progressLabel}</Label>
            <PxText text={`${current + 1} / ${items.length}`} px={4} color={MCD.goldBright} shadowColor="#2A1600" />
          </div>
        </Rise>
      </div>
    </>
  );
  return (
    <AbsoluteFill>
      {bg && (
        <SceneBg biome={biome} dim={0.35}>
          <SideShade w={1200} opacity={0.5} />
        </SceneBg>
      )}
      {bg && <Embers count={20} size={8} seed={4} speed={0.6} area={[1100, 0, 800, 1080]} style={{opacity: 0.8}} />}
      {body}
      {audio && (
        <>
          {Array.from({length: items.length}, (_, i) => (
            <Sequence key={i} from={lightAt(i)}>
              <Audio src={mcSound('random/click')} volume={0.22} playbackRate={0.9 + i * 0.08} />
            </Sequence>
          ))}
          <Sequence from={lightAt(current)}>
            <Audio src={mcSound('random/orb')} volume={0.3} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
void clamp01;
