/**
 * mcd-c-subtitle-bar - dialogue / narration subtitle bar for the bottom of the picture.
 * A chamfered dark bar (hard bevel, no blur) rises in; each line types out in white body type with a hard shadow, with a hexagon
 * speaker portrait (real skins / villager / creeper heads) and a name tab in the speaker's colour. Narration lines have no portrait.
 * A gold arrow blinks when the line is complete; lines swap with a 4-step fade.
 * Props: lines [{who, text, skin, tone}], perLine (frames per line), first (frame the first line starts), bg (Demo scene), biome, size.
 */
import {type FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE} from '../../../mc/theme';
import {CreeperHead, EndermanHead, VillagerHead} from '../../mob';
import {HexBadge, McdText, PlayerBust, chamferPts, ptsStr} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import {ramp, stepped} from './lib';

export type SubLine = {who?: string; text: string; skin?: string; tone?: 'gold' | 'cyan' | 'green' | 'purple' | 'red' | 'white'};

const TONE = {
  gold: {c: '#FCD448', ring: '#C99A2E', ringHi: '#FCD448'},
  cyan: {c: '#58D8F0', ring: '#2A8AA0', ringHi: '#58D8F0'},
  green: {c: '#6EE04A', ring: '#3E9A2A', ringHi: '#6EE04A'},
  purple: {c: '#C894FF', ring: '#7E3FC8', ringHi: '#AB64FF'},
  red: {c: '#FF6A7A', ring: '#AF2232', ringHi: '#EE2F58'},
  white: {c: '#F0F0F6', ring: '#6A6A72', ringHi: '#B4B4BC'},
};

const DEMO_LINES: SubLine[] = [
  {who: '旁白', text: '夜幕降临，苦力怕森林里传来了熟悉的嘶嘶声。', tone: 'gold'},
  {who: '史蒂夫', skin: 'steve', text: '别慌，先把火把插到那面石墙上。', tone: 'cyan'},
  {who: '村民', skin: 'villager', text: '嗯……绿宝石？我可以拿东西跟你换。', tone: 'green'},
];

const Avatar: FC<{skin?: string}> = ({skin}) => {
  if (skin === 'villager') return <VillagerHead scale={8} />;
  if (skin === 'creeper') return <CreeperHead scale={9} />;
  if (skin === 'enderman') return <EndermanHead scale={9} />;
  return <PlayerBust skin={skin ?? 'steve'} scale={6} style={{marginTop: 8}} />;
};

const BAR_W = 1500;
const BAR_H = 176;

export const SubtitleBar: FC<{lines?: SubLine[]; perLine?: number; first?: number; bg?: boolean; audio?: boolean; biome?: BiomeId; size?: number}> = ({lines = DEMO_LINES, perLine = 52, first = 10, bg = true, audio = true, biome = 'forest-night', size = 50}) => {
  const f = useCurrentFrame();
  const n = lines.length;
  const end = first + n * perLine;
  const barIn = ramp(f, first - 8, first);
  const barOut = ramp(f, end - 6, end + 6);
  const barA = stepped(barIn, 5) * (1 - stepped(barOut, 5));
  const idx = Math.min(n - 1, Math.max(0, Math.floor((f - first) / perLine)));
  const ln = lines[idx];
  const lf = f - first - idx * perLine; // local frame in the line
  const tone = TONE[ln.tone ?? 'gold'];
  const hasAvatar = !!ln.skin;
  const chars = [...ln.text];
  const typeDur = Math.min(26, Math.max(10, Math.round(chars.length * 1.1)));
  const shown = Math.floor(chars.length * ramp(lf, 3, 3 + typeDur));
  const lineIn = stepped(ramp(lf, 0, 4), 4);
  const lineOut = idx < n - 1 ? stepped(ramp(lf, perLine - 5, perLine), 4) : 0;
  const lineA = lineIn * (1 - lineOut);
  const done = lf >= 3 + typeDur;
  const left = (1920 - BAR_W) / 2;
  const top = 1080 - 64 - BAR_H + (1 - EASE.out(barIn)) * 30;
  const outer = chamferPts(BAR_W, BAR_H, [30, 30, 30, 30]);
  const textLeft = hasAvatar ? 150 : 70;
  return (
    <AbsoluteFill>
      {audio && lines.flatMap((l, li) => {
        const cs = [...l.text];
        const td = Math.min(26, Math.max(10, Math.round(cs.length * 1.1)));
        return [
          <Sfx key={`p${li}`} at={first + li * perLine} src={mcSound('random/pop')} volume={0.14} rate={1.2} />,
          ...cs.map((_, ci) => (ci % 2 === 0 ? <Sfx key={`${li}-${ci}`} at={first + li * perLine + 3 + Math.round((ci * td) / cs.length)} src={mcSound('random/click')} volume={0.08} rate={1.5 + (ci % 3) * 0.06} cut={4} /> : null)),
        ];
      })}
      {bg && <ScenePlate biome={biome} camera="drift" />}
      {bg && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: 'linear-gradient(to top, rgba(4,4,10,0.55), rgba(4,4,10,0))'}} />}
      <div style={{position: 'absolute', left, top, width: BAR_W, height: BAR_H, opacity: barA}}>
        <svg width={BAR_W} height={BAR_H + 10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <polygon points={ptsStr(outer.map(([x, y]) => [x + 8, y + 8] as [number, number]))} fill="rgba(0,0,0,0.35)" />
          <polygon points={ptsStr(outer)} fill="rgba(8,9,14,0.8)" />
          <polygon points={ptsStr(outer)} fill="none" stroke="rgba(120,120,136,0.55)" strokeWidth={3} />
        </svg>
        <div style={{position: 'absolute', left: 34, top: 3, width: BAR_W - 68, height: 3, background: 'rgba(255,255,255,0.14)'}} />
        <div style={{position: 'absolute', left: 34, bottom: 3, width: BAR_W - 68, height: 4, background: 'rgba(0,0,0,0.4)'}} />
        {ln.who && (
          <div style={{position: 'absolute', left: hasAvatar ? 150 : 40, top: -24, opacity: lineA, transform: `translateX(${(1 - lineA) * -20}px)`}}>
            <div style={{position: 'relative', height: 48, padding: '0 28px 0 22px', display: 'flex', alignItems: 'center', gap: 14, background: '#14141A', borderTop: `4px solid ${tone.c}`, boxShadow: '4px 4px 0 rgba(0,0,0,0.4)', clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)'}}>
              <div style={{width: 14, height: 14, background: tone.c, transform: 'rotate(45deg)'}} />
              <McdText size={32} weight={800} color={tone.c} style={{lineHeight: 1}}>
                {ln.who}
              </McdText>
            </div>
          </div>
        )}
        {hasAvatar && (
          <div style={{position: 'absolute', left: -40, top: BAR_H / 2 - 87, opacity: lineA, transform: `scale(${0.6 + 0.4 * EASE.back(ramp(lf, 0, 8))})`}}>
            <HexBadge w={150} ring={tone.ring} ringHi={tone.ringHi} fill="#101820" glow={`${tone.c}55`}>
              <Avatar skin={ln.skin} />
            </HexBadge>
          </div>
        )}
        <div style={{position: 'absolute', left: textLeft, right: 90, top: 0, bottom: 0, display: 'flex', alignItems: 'center', opacity: lineA, justifyContent: hasAvatar ? 'flex-start' : 'center'}}>
          <div style={{lineHeight: 1.36}}>
            <McdText size={size} weight={700} color="#FFFFFF" style={{textShadow: '3px 3px 0 rgba(5,2,2,0.9)'}}>
              {chars.map((c, i) => (
                <span key={i} style={{opacity: i < shown ? 1 : 0}}>
                  {c}
                </span>
              ))}
            </McdText>
          </div>
        </div>
        {done && lf % 20 < 12 && <div style={{position: 'absolute', right: 40, bottom: 26, width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: `18px solid ${tone.c}`}} />}
      </div>
    </AbsoluteFill>
  );
};
