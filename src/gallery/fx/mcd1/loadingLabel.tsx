// mcd-t-loading-label: A crushes to black -> a short live "loading cinematic" (3D scene, shallow DoF, slow push) with the destination label
//   -> crushes to black -> hard cut to B.  Left-bottom: block icon that changes texture every 18 frames, small "heading to" line, gold place name;
//   top-right: gold skull difficulty badge.   Props: place (string), caption (string), difficulty (numeral), plate (BiomeId), plateSeed.
import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE, clamp01} from '../../../mc/theme';
import {McdText, PxText, SkullBadge} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene/scenes';
import {FULL, GOLD, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps, mEntry} from './common';

const A_DARK = 12; // A -> black
const PLATE_IN = 14; // hard cut to the loading cinematic
const LABEL_IN = 18;
const PLATE_DARK = 74; // plate starts to crush
const PLATE_OUT = 85; // hard cut to B
const SETTLE = 14;
const T = PLATE_OUT + SETTLE;
const SWAP = 18; // block icon swaps every 0.6 s

const ICONS = ['stone', 'cobblestone', 'lava_still', 'redstone_block', 'gold_block', 'netherrack'];

export type LoadingProps = {place?: string; caption?: string; difficulty?: string; biome?: BiomeId; plateSeed?: number};

const blackAlpha = (f: number) => {
  if (f < A_DARK) return ss(0.2, 1, f / A_DARK);
  if (f < PLATE_IN) return 1;
  if (f < PLATE_DARK) return 0;
  if (f < PLATE_OUT - 3) return ss(0, 1, (f - PLATE_DARK) / (PLATE_OUT - 3 - PLATE_DARK));
  if (f < PLATE_OUT) return 1;
  return 0.8 * (1 - EASE.out(clamp01((f - PLATE_OUT) / SETTLE)));
};

const IconBox: FC<{tex: string; size: number}> = ({tex, size}) => {
  const lava = tex === 'lava_still';
  const inner: CSSProperties = {position: 'absolute', inset: 6, imageRendering: 'pixelated', backgroundImage: `url(${block(tex)})`, backgroundSize: lava ? `${size - 12}px auto` : '100% 100%', backgroundRepeat: 'no-repeat'};
  return (
    <div style={{position: 'relative', width: size, height: size, background: '#9A9AA0', boxShadow: `inset 0 0 0 3px #D8D8DE, inset 0 0 0 6px #2A2A30, 6px 6px 0 rgba(5,2,2,0.55)`}}>
      <div style={inner} />
      <div style={{position: 'absolute', inset: 6, boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.28), inset 0 -10px 0 rgba(0,0,0,0.12)'}} />
    </div>
  );
};

export const makeLoadingOverlay = (o: LoadingProps = {}): FC<OverlayProps> => {
  const place = o.place ?? '苦力怕森林';
  const caption = o.caption ?? '正在前往';
  const diff = o.difficulty ?? 'I';
  return ({f}) => {
    const bA = blackAlpha(f);
    const inLabel = f >= LABEL_IN && f < PLATE_DARK + 6;
    const lab = f < PLATE_DARK ? stepQ((f - LABEL_IN) / 6, 4) : 1 - stepQ((f - PLATE_DARK) / 6, 4);
    const k = Math.floor(Math.max(0, f - PLATE_IN) / SWAP) % ICONS.length;
    const slide = (1 - EASE.out(clamp01((f - LABEL_IN) / 10))) * 18;
    return (
      <AbsoluteFill>
        {f >= PLATE_IN && f < PLATE_OUT && (
          <>
            {/* legibility: soft darkening at the bottom-left and the top-right corners */}
            <div style={{...FULL, background: 'radial-gradient(ellipse 60% 55% at 0% 100%, rgba(8,6,10,0.62), rgba(8,6,10,0) 70%), radial-gradient(ellipse 34% 40% at 100% 0%, rgba(8,6,10,0.42), rgba(8,6,10,0) 70%)', opacity: lab}} />
            {inLabel && (
              <>
                <div style={{position: 'absolute', left: 88, bottom: 84, display: 'flex', alignItems: 'flex-end', gap: 28, opacity: lab, transform: `translateX(${-slide}px)`}}>
                  <IconBox tex={ICONS[k]} size={132} />
                  <div style={{display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 2}}>
                    <McdText size={28} weight={500} color={GOLD.small}>
                      {caption}
                    </McdText>
                    <PxText text={place} px={4} color={GOLD.place} hi="#FFEBA8" shadowColor={GOLD.shadow} />
                  </div>
                </div>
                <div style={{position: 'absolute', right: 96, top: 56, opacity: lab, transform: `translateY(${slide * 0.5}px)`}}>
                  <SkullBadge size={84} selected numeral={diff} />
                </div>
              </>
            )}
          </>
        )}
        <div style={{...FULL, background: '#000', opacity: bA}} />
      </AbsoluteFill>
    );
  };
};

export const makeLoadingDef = (o: LoadingProps = {}): MDef => {
  const Overlay = makeLoadingOverlay(o);
  const biome = o.biome ?? 'forest-day';
  const Scene: FC<SceneProps> = ({f, A, B, p}) => {
    // frames the surrounding timeline ran before this body started (LEAD in the gallery demo, 0 inside a lib TransitionSeries)
    const lead = useCurrentFrame() - f;
    const dA = clamp01(f / A_DARK);
    const k = clamp01((f - PLATE_DARK) / (PLATE_OUT - PLATE_DARK));
    const q = clamp01((f - PLATE_OUT) / SETTLE);
    return (
      <AbsoluteFill>
        {f < PLATE_IN && (
          <div style={{...FULL, filter: `brightness(${1 - 0.8 * dA})`, transform: `scale(${1 + 0.04 * dA})`}}>
            <A />
          </div>
        )}
        {f >= PLATE_IN && f < PLATE_OUT && (
          <Sequence from={lead + PLATE_IN} layout="none">
            <div style={{...FULL, filter: `brightness(${1 - 0.7 * k})`}}>
              <ScenePlate biome={biome} seed={o.plateSeed ?? 31} loop={96} camera="push" dof dim={0.1} />
            </div>
          </Sequence>
        )}
        {f >= PLATE_OUT && (
          <div style={{...FULL, transform: `scale(${1.04 - 0.04 * EASE.out(q)})`}}>
            <B />
          </div>
        )}
        {p > 0 && p < 1 && <Overlay p={p} f={f} />}
      </AbsoluteFill>
    );
  };
  return {
    frames: T,
    Scene,
    Overlay,
    cues: [
      ...[1, 2, 3].map((i) => ({at: PLATE_IN + i * SWAP, src: 'mc:random/click', volume: 0.14, rate: 1.4})),
    ],
  };
};

export const loadingLabelPair = {A: plate('camp'), B: plate('forest-night')};
export const loadingLabelDef = makeLoadingDef();

export const loadingLabelEntry = mEntry(
    loadingLabelDef,
    {
      id: 'mcd-t-loading-label',
      name: '地下城·目的地加载转场',
      tags: ['地下城', '转场', '加载画面', '地名', '难度徽章'],
      blurb: 'A 压黑后切入一段实景加载画面（浅景深+缓推），左下角方块图标每 0.6 秒换贴图，配"正在前往"小字与金橙地名，右上金色骷髅难度徽章，再压黑硬切到 B。',
      usage: '前往新地图/新章节/新关卡的衔接，把地名与难度交代给观众；换 place 即可复用。',
      params: [
        {name: 'place', desc: '地名（金橙大字），默认"苦力怕森林"'},
        {name: 'caption', desc: '小字，默认"正在前往"'},
        {name: 'difficulty', desc: '难度徽章罗马数字，默认 I'},
        {name: 'biome / plateSeed', desc: '加载实景用哪个 ScenePlate 群系与地形种子'},
      ],
    },
    loadingLabelPair.A,
    loadingLabelPair.B,
  );
