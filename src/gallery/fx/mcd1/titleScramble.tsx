// mcd-t-title-scramble: trailer title card transition (CO-OP / ENCHANT cards).
//   A is cut to #060307 in 2 frames, the gold title appears with its pixel rows scrambled and chunks missing for 2 frames, snaps together with
//   an extruded voxel edge, embers drift up while it slowly pushes in, then it breaks apart in 8 frames and B comes up from black.
//   Props: title (default "下一章"), sub (optional small caption under the title).   Layer = the black title card only (cut-type).
import type {CSSProperties, FC, ReactElement} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Embers, McdBackdrop, McdText, PxText, useTextSize} from '../mcdkit/kit';
import {FULL, GOLD, hash, lerp, mEntry, plate, ss, stepQ, type MDef, type OverlayProps, type SceneProps} from './common';

const CARD_IN = 3; // A is cut to black
const GLITCH0 = 5; // first scrambled frame
const SNAP = 7; // clean
const EXIT0 = 52; // break-up starts
const CUT = 60; // B takes over
const SETTLE = 14;
const T = CUT + SETTLE;
const BLACK = '#060307';

export type TitleProps = {title?: string; sub?: string};

const TOPT = {cjkRows: 0, bold: 2 as const, gap: 2};
const BANDS = ['#FFE27A', '#FEC304', '#FEC304', '#F19D07'];

/** Scrambled / clean title with an extruded edge. `amp` = max row shift in art px; `holes` = share of 3x3-art-px chunks that are missing. */
const TitleArt: FC<{text: string; px: number; amp: number; seed: number; holes: number; opacity?: number}> = ({text, px, amp, seed, holes, opacity = 1}) => {
  const size = useTextSize(text, {px, ...TOPT});
  const shift = (y: number) => {
    if (!amp) return 0;
    const r = hash(Math.floor(y / 2), seed, 17);
    return r > 0.34 ? Math.round((hash(Math.floor(y / 2), seed, 29) - 0.5) * 2 * amp) : 0;
  };
  const common = {px, rowShift: shift, slack: amp + 1, opacity, ...TOPT};
  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const cell = px * 3;
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const holesEl: ReactElement[] = [];
  if (holes > 0)
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) if (hash(i, j, seed * 7 + 3) < holes) holesEl.push(<div key={`${i}-${j}`} style={{position: 'absolute', left: i * cell - 8, top: j * cell - 8, width: cell + 16, height: cell + 16, background: BLACK}} />);
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      {[4, 3, 2, 1].map((k) => (
        <div key={k} style={{position: 'absolute', left: 0, top: k * Math.max(4, Math.round(px * 0.22))}}>
          <PxText text={text} {...common} color={['', '#B9740F', '#A06208', '#7E4D0C', '#5C3A0E'][k]} shadow={0} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <PxText text={text} {...common} color="#FEC304" bands={BANDS} shadow={0} />
      </div>
      {holesEl}
    </div>
  );
};

const Brackets: FC<{a: number}> = ({a}) => {
  const L = 72;
  const t = 12;
  const c = '#F8D868';
  const corner = (style: CSSProperties, bx: string, by: string) => (
    <div style={{position: 'absolute', width: L, height: L, ...style}}>
      <div style={{position: 'absolute', width: L, height: t, background: c, [by]: 0}} />
      <div style={{position: 'absolute', width: t, height: L, background: c, [bx]: 0}} />
    </div>
  );
  return (
    <div style={{...FULL, opacity: a}}>
      {corner({left: 96, top: 84}, 'left', 'top')}
      {corner({right: 96, top: 84}, 'right', 'top')}
      {corner({left: 96, bottom: 84}, 'left', 'bottom')}
      {corner({right: 96, bottom: 84}, 'right', 'bottom')}
    </div>
  );
};

export const makeTitleCard = (o: TitleProps = {}): FC<OverlayProps> => {
  const title = o.title ?? '下一章';
  const sub = o.sub ?? '';
  return ({f}) => {
    const probe = useTextSize(title, {px: 1, ...TOPT});
    if (f < CARD_IN || f >= CUT) return null;
    const px = probe ? Math.max(6, Math.min(26, Math.floor(1240 / probe.w), Math.floor(430 / probe.h))) : 12;
    const age = f - GLITCH0;
    const glitch = f >= GLITCH0 && f < SNAP;
    const showTitle = f >= GLITCH0;
    const exit = f >= EXIT0 ? (f - EXIT0 + 1) / (CUT - EXIT0) : 0; // 0..1
    const push = lerp(0.97, 1.035, EASE.out(clamp01((f - SNAP) / 44)));
    const amp = glitch ? (age === 0 ? 5 : 3) : exit > 0 ? Math.round(1 + 7 * exit) : 0;
    const holes = glitch ? (age === 0 ? 0.32 : 0.14) : exit > 0 ? 0.55 * exit : 0;
    const op = exit > 0 ? 1 - stepQ(Math.max(0, exit - 0.25) / 0.75, 4) : 1;
    const flashSnap = f === SNAP ? 1 : f === SNAP + 1 ? 0.5 : 0;
    const glow = ss(SNAP, SNAP + 10, f) * (1 - exit);
    return (
      <AbsoluteFill style={{background: BLACK}}>
        <McdBackdrop kind="trailer" cell={64} style={{opacity: 0.9}} />
        <div style={{...FULL, background: `radial-gradient(ellipse 52% 40% at 50% 50%, rgba(241,157,7,${0.2 * glow}), rgba(241,157,7,0) 75%)`}} />
        {f >= SNAP - 1 && <Embers count={70} seed={5} speed={0.9} size={12} />}
        {f >= SNAP + 6 && <Brackets a={stepQ((f - SNAP - 6) / 8, 3) * (1 - stepQ(exit * 2, 2))} />}
        {showTitle && (
          <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 36}}>
            <div style={{transform: `scale(${push}) translateY(${exit > 0 ? -exit * 18 : 0}px)`, filter: flashSnap ? `brightness(${1 + 0.5 * flashSnap})` : undefined}}>
              <TitleArt text={title} px={px} amp={amp} seed={f} holes={holes} opacity={op} />
            </div>
            {sub && (
              <div style={{opacity: stepQ((f - SNAP - 4) / 8, 3) * (1 - stepQ(exit * 2, 2))}}>
                <McdText size={36} weight={600} color="#E8D8B0" style={{letterSpacing: 14, textTransform: 'uppercase'}}>
                  {sub}
                </McdText>
              </div>
            )}
          </AbsoluteFill>
        )}
        {/* debris of the break-up */}
        {exit > 0 &&
          Array.from({length: 36}, (_, i) => {
            const ang = hash(i, 1, 41) * Math.PI * 2;
            const d = exit * (160 + hash(i, 2, 41) * 520);
            const q = 24 + Math.round(hash(i, 3, 41) * 3) * 12;
            const x = 960 + (hash(i, 4, 41) - 0.5) * 900 + Math.cos(ang) * d;
            const y = 540 + (hash(i, 5, 41) - 0.5) * 220 + Math.sin(ang) * d * 0.6 - exit * 80;
            return <div key={i} style={{position: 'absolute', left: Math.round(x / 12) * 12, top: Math.round(y / 12) * 12, width: q, height: q, background: i % 3 === 0 ? '#FFE680' : i % 3 === 1 ? '#FEC304' : '#A8680F', opacity: 1 - exit * exit}} />;
          })}
        <div style={{...FULL, boxShadow: 'inset 0 0 220px 40px rgba(0,0,0,0.65)'}} />
      </AbsoluteFill>
    );
  };
};

export const makeTitleDef = (o: TitleProps = {}): MDef => {
  const Card = makeTitleCard(o);
  const Scene: FC<SceneProps> = ({f, A, B, p}) => {
    const q = clamp01((f - CUT) / SETTLE);
    return (
      <AbsoluteFill>
        {f < CARD_IN && (
          <div style={{...FULL, filter: `brightness(${f <= 0 ? 1 : f === 1 ? 0.5 : 0.18})`}}>
            <A />
          </div>
        )}
        {f >= CUT && (
          <div style={{...FULL, filter: `brightness(${lerp(0.3, 1, EASE.out(q))})`, transform: `scale(${lerp(1.04, 1, EASE.out(q))})`}}>
            <B />
          </div>
        )}
        {f >= CARD_IN && f < CUT && <Card p={p} f={f} />}
        {f >= CUT && f < CUT + 8 && <div style={{...FULL, background: BLACK, opacity: 0.8 * (1 - stepQ((f - CUT) / 8, 4))}} />}
      </AbsoluteFill>
    );
  };
  return {
    frames: T,
    Scene,
    Overlay: Card,
    cues: [
      {at: 1, src: 'reel:impact-cine.mp3', volume: 0.42},
      {at: SNAP, src: 'mc:block/smithing_table/smithing_table1', volume: 0.3, rate: 0.8},
      {at: SNAP + 2, src: 'mc:fire/ignite', volume: 0.14, rate: 1.2},
      {at: CUT, src: 'mc:dig/stone2', volume: 0.3, rate: 0.7},
    ],
  };
};

export const titleScrambleDef = makeTitleDef();
export const titleScramblePair = {A: plate('forest-night'), B: plate('nether')};

export const titleScrambleEntry = mEntry(
  titleScrambleDef,
  {
    id: 'mcd-t-title-scramble',
    name: '地下城·像素错位拼字标题',
    tags: ['地下城', '转场', '标题卡', '预告片', '章节标题', '火星'],
    blurb: '画面 2 帧硬切成纯黑 #060307，金色大字先以像素错位、缺块的状态闪 2 帧再拼合，带挤出的立体边；火星上飘、缓慢推近，最后碎散并硬切到 B。',
    usage: '章节标题、"第 N 期"、新版本名；预告片式的黑场标题卡，也可只导出透明层压在素材上。',
    params: [
      {name: 'title', desc: '标题文字，默认"下一章"（makeTitleDef({title, sub})）'},
      {name: 'sub', desc: '标题下方的小号字母/说明，默认不显示'},
      {name: 'GLITCH0 / SNAP / EXIT0 / CUT', desc: '错位开始、拼合、碎散开始、切到 B 的帧'},
    ],
  },
  titleScramblePair.A,
  titleScramblePair.B,
);
