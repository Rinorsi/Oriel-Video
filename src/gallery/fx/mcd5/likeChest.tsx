// mcd-v-like-chest: "like / coin / favourite" triple-support unlock (chest-open-light-beam.png / chest-item-card.png).
// Three hexagon nodes (thumb / coin / star) fill from the bottom one after another, each with a pixel cross flash; the ender chest
// bobs, then shakes, then opens: a magenta light beam bursts out in 4 frames with a white flash and a fountain of pixels, and about
// a second later a dark item card appears with a gilded diamond, the thank-you line and a green button.
// Props: labels (3 node names), headline ('三连进度'), thanks ('感谢支持'), note, item (item id inside the gold diamond), button, bg.
import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {Crop} from '../../mob';
import {tex} from '../../../mc/assets';
import {CutPanel, Embers, DiamondFrame, HexBadge, ItemIcon3D, MCD, MainButton, McdText, PxText, RarityTag, WhiteFlash, hexPts, insetPoly, itemTex, clipOf} from '../mcdkit/kit';
import {FxLayer, beam} from '../mcdscene';
import {COIN_ROWS, CrossFlash, Fountain, Label, Pop, PxIcon, Rise, STAR_ROWS, SceneBg, Shine, THUMB_ROWS, stepQ, win} from './common';

const ICONS = [THUMB_ROWS, COIN_ROWS, STAR_ROWS];
const NODE_AT = [20, 46, 72];
const OPEN = 108;
const CARD = 140;
const CX = 960;
const FOOT = 936;
const NW = 190;
const NGAP = 120;

/** Real ender chest texture, front view; opening foreshortens and lifts the lid and exposes the glowing inside. */
const Chest: FC<{scale: number; open: number; glow: number}> = ({scale: s, open, glow}) => {
  const src = tex('entity/chest/ender.png');
  return (
    <div style={{position: 'relative', width: 14 * s, height: 15 * s}}>
      <Crop src={src} sheet={[64, 64]} rect={[14, 33, 14, 10]} scale={s} style={{position: 'absolute', left: 0, top: 5 * s}} />
      {open > 0 && <div style={{position: 'absolute', left: s, top: 4.2 * s, width: 12 * s, height: 1.8 * s, background: 'linear-gradient(180deg,#2A0A38,#CD2ECD)', boxShadow: `0 0 ${30 * open}px ${10 * open}px rgba(205,46,205,0.9)`}} />}
      <div style={{position: 'absolute', left: 0, top: -open * 3.2 * s, width: 14 * s, height: 5 * s, transformOrigin: '50% 100%', transform: `scaleY(${1 - open * 0.62})`}}>
        <Crop src={src} sheet={[64, 64]} rect={[14, 14, 14, 5]} scale={s} style={{position: 'absolute', left: 0, top: 0}} />
        <Crop src={src} sheet={[64, 64]} rect={[1, 1, 2, 4]} scale={s} style={{position: 'absolute', left: 6 * s, top: 2 * s}} />
      </div>
      <div style={{position: 'absolute', left: 5.5 * s, top: 6.3 * s, width: 3 * s, height: 1.6 * s, background: MCD.beam, opacity: glow, boxShadow: `0 0 ${20 + 40 * glow}px ${MCD.beam}`, display: open > 0.2 ? 'none' : 'block'}} />
    </div>
  );
};

const Node: FC<{i: number; label: string}> = ({i, label}) => {
  const f = useCurrentFrame();
  const W = NW;
  const H = (W * 2) / Math.sqrt(3);
  const t = stepQ(EASE.out(win(f, NODE_AT[i], 12)), 12);
  const done = f >= NODE_AT[i] + 12;
  const pop = EASE.back(win(f, 4 + i * 3, 9));
  const clip = clipOf(insetPoly(hexPts(W, H), 14));
  const bump = f >= NODE_AT[i] + 10 && f < NODE_AT[i] + 18 ? 1 + 0.12 * (1 - (f - NODE_AT[i] - 10) / 8) : 1;
  return (
    <div style={{width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${pop * bump})`, transformOrigin: '50% 40%'}}>
      <div style={{position: 'relative', width: W, height: H}}>
        <HexBadge w={W} ring={done ? '#E8A81C' : '#5A5A62'} ringHi={done ? '#FCE693' : '#8A8A92'} fill="#0C0C10" ringW={12} outlineW={6} glow={done ? 'rgba(255,200,80,0.5)' : undefined}>
          <div style={{opacity: 0.95}}>
            <PxIcon rows={ICONS[i]} px={7} color={done ? '#3A2200' : '#6C6C74'} />
          </div>
        </HexBadge>
        {/* fill rising from the bottom */}
        <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${t * 100}%`, background: 'linear-gradient(180deg,#FFE680,#F2B83A)'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: '#FFF6C0'}} />
          </div>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <PxIcon rows={ICONS[i]} px={7} color="#3A2200" />
          </div>
          <div style={{position: 'absolute', inset: 0, background: '#0C0C10', clipPath: `inset(0 0 ${t * 100}% 0)`, opacity: 0.0}} />
        </div>
      </div>
      <div style={{marginTop: 14}}>
        <PxText text={label} px={3} color={done ? MCD.goldBright : '#9AA0AA'} shadowColor={done ? '#2A1600' : undefined} />
      </div>
    </div>
  );
};

export const LikeChest: FC<{
  bg?: boolean;
  labels?: string[];
  headline?: string;
  thanks?: string;
  note?: string;
  item?: string;
  button?: string;
  tag?: string;
  /** 是否带上音效，默认 true */
  audio?: boolean;
}> = ({bg, labels = ['点赞', '投币', '收藏'], headline = '三连解锁', thanks = '感谢支持', note = '每一个三连，都是我继续冒险的动力', item = 'nether_star', button = '继续观看', tag = '特别奖励', audio = true}) => {
  const f = useCurrentFrame();
  const filled = NODE_AT.filter((a) => f >= a + 12).length;
  // chest motion
  const idle = f < 84 ? (f % 24 < 6 ? -Math.round(Math.sin(((f % 24) / 6) * Math.PI) * 10) : 0) : 0;
  const react = NODE_AT.reduce((m, a) => (f >= a + 10 && f < a + 20 ? Math.max(m, 1 - (f - a - 10) / 10) : m), 0);
  const shake = f >= 84 && f < OPEN ? Math.round(Math.sin(f * 2.4) * (4 + (f - 84) * 0.45)) : 0;
  const lid = f < OPEN ? 0 : Math.min(1, EASE.out(win(f, OPEN, 5))) * 0.85;
  const eye = 0.35 + 0.65 * Math.max(react, filled / 3, f >= 84 ? 1 : 0);
  const chestIn = EASE.out(win(f, 2, 12));
  const trackerOut = f >= OPEN - 4 ? stepQ(win(f, OPEN - 4, 8), 4) : 0;
  const cardIn = EASE.back(win(f, CARD, 9));
  const chestDim = f >= CARD ? 0.3 : 1;
  const beamAlpha = f < CARD - 8 ? 1 : 1 - clamp01((f - CARD + 8) / 14);
  const gx = 4 * 0;
  void gx;
  return (
    <AbsoluteFill>
      {bg && (
        <SceneBg biome="forest-night" dim={f >= OPEN ? 0.55 : 0.4} tint="10,4,16">
          <AbsoluteFill style={{background: `radial-gradient(ellipse 36% 60% at 50% 70%, rgba(205,46,205,${0.22 * Math.max(react, f >= OPEN ? 1 : 0) + 0.06 * (filled / 3)}), rgba(0,0,0,0) 72%)`}} />
        </SceneBg>
      )}

      {/* tracker */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 56, opacity: 1 - trackerOut, transform: `translateY(${-trackerOut * 40}px)`}}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: stepQ(win(f, 0, 8), 4)}}>
          <Label color={MCD.goldBright} size={30}>{headline}</Label>
          <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{width: 24, height: 24, transform: 'rotate(45deg)', background: k < filled ? MCD.goldBright : '#2A2A30', boxShadow: '0 0 0 4px #000', margin: 6}} />
            ))}
          </div>
        </div>
        <div style={{position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginTop: 30}}>
          {labels.map((l, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'flex-start'}}>
              {i > 0 && (
                <div style={{width: NGAP, height: 14, marginTop: ((NW * 2) / Math.sqrt(3)) / 2 - 7, background: '#2A2A30', boxShadow: '0 0 0 3px #000', position: 'relative'}}>
                  <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${stepQ(win(f, NODE_AT[i - 1] + 12, 12), 6) * 100}%`, background: 'linear-gradient(90deg,#FFE680,#F2B83A)'}} />
                </div>
              )}
              <Node i={i} label={l} />
            </div>
          ))}
        </div>
      </div>

      {/* beam */}
      <AbsoluteFill style={{opacity: beamAlpha}}>
        <FxLayer
          draw={(ctx, v) => {
            if (v.frame < OPEN) return;
            const grow = clamp01((v.frame - OPEN + 1) / 4);
            const wob = v.frame < OPEN + 10 ? 1 : 0.86;
            beam(ctx, v, {x: CX, y: FOOT - 255, kind: 'magenta', width: 190 * wob, grow, alpha: 1, seed: 3});
          }}
        />
      </AbsoluteFill>

      {/* chest */}
      <div style={{position: 'absolute', left: CX - 14 * 11, top: FOOT - 15 * 22 + (1 - chestIn) * 160, filter: `brightness(${chestDim})`, opacity: chestIn > 0 ? 1 : 0}}>
        {/* ground plate */}
        <svg width={460} height={140} style={{position: 'absolute', left: -76, top: 258}}>
          <polygon points="230,6 454,40 454,100 230,134 6,100 6,40" fill="#0A060C" stroke="rgba(205,46,205,0.55)" strokeWidth={4} />
          <polygon points="230,26 380,48 380,92 230,114 80,92 80,48" fill="rgba(205,46,205,0.18)" stroke="rgba(255,160,255,0.4)" strokeWidth={3} />
        </svg>
        <div style={{position: 'relative', transform: `translate(${shake}px, ${idle}px)`}}>
          <div style={{filter: `brightness(${1.4 + 0.5 * react}) contrast(1.08)`}}>
            <Chest scale={22} open={lid} glow={eye} />
          </div>
        </div>
      </div>

      <Fountain x={CX} y={FOOT - 262} at={OPEN} count={46} size={16} spread={0.8} speed={1.1} life={46} seed={7} />
      <Fountain x={CX} y={FOOT - 262} at={OPEN + 3} count={22} size={10} spread={1.1} speed={0.7} life={34} seed={8} colors={['#FFF6C0', '#FCD448', '#FFFFFF']} />
      {NODE_AT.map((a, i) => (
        <CrossFlash key={i} x={960 + (i - 1) * (NW + NGAP)} y={56 + 30 + 46 + 110} at={a + 12} arm={110} thick={12} color="#FFF0B0" dur={12} />
      ))}
      <CrossFlash x={CX} y={FOOT - 262} at={OPEN} arm={240} thick={16} color="#FFD0FF" dur={12} />
      <WhiteFlash at={OPEN} dur={9} peak={0.5} steps={5} color="#FFF0FF" />

      {f >= OPEN && <Embers count={34} color="#E56DE5" core="#FFF0FF" size={8} seed={21} speed={0.9} style={{opacity: win(f, OPEN, 10)}} />}
      {f >= CARD && <Embers count={30} size={8} seed={5} speed={0.7} style={{opacity: win(f, CARD, 10)}} />}
      {/* item card */}
      {f >= CARD && (
        <div style={{position: 'absolute', left: CX - 330, top: 150, transform: `scale(${cardIn})`, transformOrigin: '50% 50%'}}>
          <CutPanel w={660} h={780} cuts={[0, 0, 0, 0]} fill="#222830" edge="#4A5260" corners>
            <div style={{position: 'absolute', left: 0, right: 0, top: 54, display: 'flex', justifyContent: 'center'}}>
              <DiamondFrame size={330} tier="gilded" glow="rgba(255,205,80,0.55)">
                <ItemIcon3D src={itemTex(item)} size={150} depth={8} glow="rgba(255,240,150,0.5)" />
              </DiamondFrame>
              <Shine at={CARD + 6} dur={16} w={60} opacity={0.3} style={{left: 165, right: 165, top: 54, bottom: 'auto', height: 330, clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)'}} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 410, display: 'flex', justifyContent: 'center'}}>
              <Rise at={CARD + 6} dur={7} dy={10}>
                <RarityTag rarity="gilded" size={24} text={tag} />
              </Rise>
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 468, display: 'flex', justifyContent: 'center'}}>
              <Pop at={CARD + 8} dur={8}>
                <PxText text={thanks} px={6} />
              </Pop>
            </div>
            <div style={{position: 'absolute', left: 60, right: 60, top: 588, display: 'flex', justifyContent: 'center', textAlign: 'center'}}>
              <Rise at={CARD + 14} dur={8} dy={10}>
                <McdText size={30} color="#C8CCD4" style={{fontStyle: 'italic'}}>{note}</McdText>
              </Rise>
            </div>
            <div style={{position: 'absolute', left: 130, top: 664}}>
              <Rise at={CARD + 20} dur={8} dy={10}>
                <MainButton label={button} w={400} h={80} textPx={4} />
              </Rise>
            </div>
          </CutPanel>
        </div>
      )}
      <Fountain x={CX} y={540} at={CARD} count={20} size={12} spread={3} speed={0.5} life={30} seed={12} colors={['#FCD448', '#FFF6C0', '#FFFFFF']} />

      {audio && (
        <>
          {NODE_AT.map((a, i) => (
            <Sequence key={i} from={a + 6}>
              <Audio src={mcSound('random/orb')} volume={0.3} playbackRate={0.9 + i * 0.18} />
            </Sequence>
          ))}
          <Sequence from={84} durationInFrames={24}>
            <Audio src={mcSound('random/fuse')} volume={0.12} playbackRate={1.5} />
          </Sequence>
          <Sequence from={OPEN}>
            <Audio src={mcSound('block/chest/open')} volume={0.5} />
          </Sequence>
          <Sequence from={OPEN}>
            <Audio src={mcSound('random/levelup')} volume={0.3} playbackRate={0.9} />
          </Sequence>
          <Sequence from={CARD}>
            <Audio src={mcSound('ui/toast/challenge_complete')} volume={0.35} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
