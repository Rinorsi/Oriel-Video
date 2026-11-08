import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import {PIXEL_FONT} from '../../../mc/fonts';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, StoneTitle, U} from '../../../mg/Ore';
import {mcSound} from '../../../reel/kit';
import {Bolt, Bracket, H, Halftone, Icon, Motes, PX, Shine, Slab, Stage, TexStrip, W, back, lerp, pr, Sfx} from './ui';

/**
 * Chapter title card, heavy stone style (transparent overlay).
 * A stone-brick band wipes open from the centre, the stone lettering slams down with a shake, cracks, chips and dust,
 * torches flicker at both ends and a light sweep crosses the letters.
 * Props: no (chapter number), title (<= 6 chars), sub (line under the band), tag (replaces the small plaque text),
 *        size (title font px, multiple of 12; default 240), accent (plaque colour), dim (backdrop darkness multiplier),
 *        frames (total length; the exit starts ~24 frames before it).
 */

export const CHAPTER_STONE_FRAMES = 150;

/** A sweep of white light clipped to the glyphs of `text` (same metrics as StoneTitle). */
const GlyphShine: FC<{text: string; size: number; p: number}> = ({text, size, p}) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <span
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        fontFamily: PIXEL_FONT,
        fontSize: size,
        lineHeight: `${size}px`,
        letterSpacing: size / 12,
        whiteSpace: 'pre',
        WebkitFontSmoothing: 'none',
        color: 'transparent',
        backgroundImage: 'linear-gradient(105deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.55) 44%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.55) 56%, rgba(255,255,255,0) 62%)',
        backgroundSize: '300% 100%',
        backgroundPosition: `${lerp(100, 0, p)}% 0`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
      }}
    >
      {text}
    </span>
  );
};

const CRACKS: [number, number][][] = [
  [[960, 300], [930, 340], [962, 380], [920, 440], [950, 480], [900, 560]],
  [[960, 300], [1010, 340], [980, 390], [1050, 450], [1020, 510], [1090, 560]],
  [[930, 340], [820, 360], [760, 420], [690, 410]],
  [[1010, 340], [1120, 370], [1180, 440], [1260, 430]],
  [[950, 480], [860, 510], [800, 580]],
  [[1020, 510], [1100, 540], [1150, 600]],
];

export const ChapterStone: FC<{bg?: boolean; no?: number; title?: string; sub?: string; tag?: string; size?: number; accent?: string; dim?: number; frames?: number}> = ({
  bg,
  no = 4,
  title = '深渊之门',
  sub = '地下三百米 · 一扇不该被打开的门',
  tag,
  size = 240,
  accent = ORE.gold,
  dim = 1,
  frames = CHAPTER_STONE_FRAMES,
}) => {
  const f = useCurrentFrame();
  const N = frames;
  const outP = pr(f, N - 24, 20, EASE.in);
  const inP = pr(f, 0, 16, EASE.out);
  const wipe = inP * (1 - outP);
  const BT = 270;
  const BH = 540;
  const slamAt = 20;
  const sl = f - slamAt;
  // title drop: fall, squash on impact, settle
  const drop = sl < 0 ? 0 : clamp01(sl / 6);
  const sc = sl < 0 ? 3.2 : sl < 6 ? lerp(3.2, 1, drop * drop) : 1;
  const squash = sl >= 6 ? Math.max(0, 1 - (sl - 6) / 9) * Math.cos((sl - 6) * 1.1) : 0;
  const titleOp = sl < -2 ? 0 : Math.min(1, (sl + 2) / 3) * (1 - outP);
  const shakeK = sl >= 6 && sl < 22 ? (1 - (sl - 6) / 16) * 14 : 0;
  const rnd = mulberry32(f * 7 + 3);
  const sx = shakeK * (rnd() * 2 - 1);
  const sy = shakeK * (rnd() * 2 - 1);
  const crackP = pr(f, slamAt + 6, 14);
  const tagText = tag ?? `第 ${String(no).padStart(2, '0')} 章`;
  const flick = (k: number) => 0.8 + 0.2 * Math.sin(f * 0.9 + k) * Math.sin(f * 0.37 + k * 2);
  const gone = 1 - inP * (1 - outP);
  return (
    <Stage bg={bg} plate="B">
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(8,8,12,${0.25 * wipe * dim}) 0%, rgba(2,2,6,${0.8 * wipe * dim}) 100%)`}} />
      {/* side pillars and top/bottom gravel */}
      {[0, 1].map((side) => (
        <div key={side} style={{position: 'absolute', top: 0, bottom: 0, [side ? 'right' : 'left']: 0, width: 128, transform: `translateX(${(side ? 1 : -1) * gone * 150}px)`}}>
          <TexStrip src="block/deepslate_bricks.png" tile={64} style={{position: 'absolute', inset: 0, filter: 'brightness(0.7)'}} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5))'}} />
          <div style={{position: 'absolute', [side ? 'left' : 'right']: 0, top: 0, bottom: 0, width: 8, background: '#000'}} />
        </div>
      ))}
      {[0, 1].map((pos) => (
        <div key={pos} style={{position: 'absolute', left: 0, right: 0, [pos ? 'bottom' : 'top']: 0, height: 64, transform: `translateY(${(pos ? 1 : -1) * gone * 80}px)`}}>
          <TexStrip src="block/gravel.png" tile={64} style={{position: 'absolute', inset: 0, filter: 'brightness(0.55)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, [pos ? 'top' : 'bottom']: 0, height: 8, background: '#000'}} />
        </div>
      ))}

      {/* the slab band, wiping open from the middle */}
      <div style={{position: 'absolute', left: 0, right: 0, top: BT, height: BH, clipPath: `inset(0 ${(1 - wipe) * 50}% 0 ${(1 - wipe) * 50}%)`}}>
        <TexStrip src="block/stone_bricks.png" tile={96} style={{position: 'absolute', inset: 0, filter: 'brightness(0.62) contrast(1.1)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0) 0%, rgba(0,0,0,0.5) 100%)'}} />
        <TexStrip src="block/mossy_cobblestone.png" tile={96} style={{position: 'absolute', left: 0, top: 0, width: 480, height: 96, opacity: 0.8, filter: 'brightness(0.6)'}} />
        <TexStrip src="block/mossy_cobblestone.png" tile={96} style={{position: 'absolute', right: 0, bottom: 0, width: 576, height: 96, opacity: 0.8, filter: 'brightness(0.6)'}} />
        {[0, 1].map((pos) => (
          <div key={pos} style={{position: 'absolute', left: 0, right: 0, [pos ? 'bottom' : 'top']: 0, height: 72, boxShadow: `0 ${pos ? -8 : 8}px 0 rgba(0,0,0,0.6)`}}>
            <TexStrip src="block/chiseled_stone_bricks.png" tile={72} style={{position: 'absolute', inset: 0, filter: 'brightness(0.78)'}} />
            <div style={{position: 'absolute', left: 0, right: 0, [pos ? 'top' : 'bottom']: 0, height: 8, background: '#000'}} />
            <div style={{position: 'absolute', left: 0, right: 0, [pos ? 'bottom' : 'top']: 0, height: 8, background: pos ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)'}} />
          </div>
        ))}
        <Halftone color="#000" opacity={0.18} />
        <Shine p={pr(f, slamAt + 20, 30, (t) => t)} strength={0.6} />
      </div>
      {/* cracks radiating from the title */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - outP, overflow: 'visible'}}>
        {CRACKS.map((pts, i) => (
          <g key={i}>
            <polyline points={pts.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#000" strokeWidth={10} strokeLinejoin="miter" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(crackP * 1.6 - i * 0.1)} />
            <polyline points={pts.map(([x, y]) => `${x + 5},${y + 5}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(crackP * 1.6 - i * 0.1)} />
          </g>
        ))}
      </svg>

      {/* torches */}
      {[0, 1].map((side) => {
        const x = side ? W - 128 - 56 - 120 : 128 + 56;
        const y = BT + BH / 2 - 100;
        return (
          <div key={side} style={{position: 'absolute', left: x, top: y, width: 120, height: 200, opacity: wipe}}>
            <div style={{position: 'absolute', left: -120, top: -80, width: 360, height: 360, background: `radial-gradient(circle, rgba(255,170,60,${0.38 * flick(side)}) 0%, rgba(255,170,60,0) 65%)`}} />
            <Img src={tex('block/torch.png')} style={{position: 'absolute', left: -20, top: -10, width: 160, height: 160, imageRendering: 'pixelated'}} />
            <Img src={tex('particle/flame.png')} style={{position: 'absolute', left: 20, top: -24 - flick(side + 1) * 8, width: 80, height: 80, imageRendering: 'pixelated', transform: `scale(${flick(side)})`}} />
          </div>
        );
      })}

      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: BT + BH / 2 - size / 2 - 10, display: 'flex', justifyContent: 'center', opacity: titleOp, transform: `translate(${sx}px, ${sy}px)`}}>
        <div style={{position: 'relative', transform: `scale(${sc * (1 + squash * 0.12)}, ${sc * (1 - squash * 0.16)})`, transformOrigin: '50% 100%'}}>
          <StoneTitle size={size}>{title}</StoneTitle>
          <GlyphShine text={title} size={size} p={pr(f, slamAt + 22, 26, (t) => t)} />
        </div>
      </div>
      {/* plaques */}
      <div style={{position: 'absolute', left: 0, right: 0, top: BT - 62, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - back(pr(f, 6, 14, (t) => t))) * -120}px)`, opacity: 1 - outP}}>
        <Slab w={360} h={96} tone="panel" shadow={8}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
            <Icon name="dot" px={U} color={accent} />
            <PX size={48} color={accent}>{tagText}</PX>
            <Icon name="dot" px={U} color={accent} />
          </div>
        </Slab>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: BT + BH - 40, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - back(pr(f, slamAt + 8, 14, (t) => t))) * 120}px)`, opacity: (1 - outP) * (f > slamAt ? 1 : 0)}}>
        <Slab w={1040} h={88} tone="panel_glass" shadow={8}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <PX size={48} color={ORE.dim}>{sub}</PX>
          </div>
          <Bolt x={24} y={44} />
          <Bolt x={1016} y={44} />
        </Slab>
      </div>

      {/* debris and dust */}
      <Motes x={128} y={0} w={W - 256} h={H} count={30} seed={11} colors={['#a29a96', '#6f6865', '#fff']} size={8} rise={-0.6} opacity={wipe * 0.8} />
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <Bracket key={c} corner={c} inset={90} size={56} color="#a29a96" style={{opacity: wipe}} />
      ))}
      {[-1, 1].map((side) => (
        <PixelBurst key={side} x={W / 2 + side * 260} y={BT + BH / 2 + 80} at={slamAt + 6} count={22} colors={['#a29a96', '#6f6865', '#4a4442', '#ece6e2']} speed={24} life={36} size={16} gravity={1.1} seed={20 + side + 3} />
      ))}
      <PixelBurst x={W / 2} y={BT + BH / 2 + 110} at={slamAt + 6} count={30} colors={['#ece6e2', '#a29a96']} speed={30} life={26} size={24} gravity={0.2} seed={77} />
      <Shockwave x={W / 2} y={BT + BH / 2 + 100} at={slamAt + 6} color="#ece6e2" maxR={900} life={18} width={20} />
      <Flash at={slamAt + 6} life={7} peak={0.45} />

      <Sfx at={2} src={mcSound('dig/stone3')} volume={0.5} rate={0.6} />
      <Sfx at={slamAt + 5} src={mcSound('random/anvil_land')} volume={0.5} rate={0.7} />
      <Sfx at={slamAt + 6} src={mcSound('dig/stone1')} volume={0.7} rate={0.7} />
      <Sfx at={slamAt + 8} src={mcSound('random/explode1')} volume={0.2} rate={1.4} cut={20} />
      <Sfx at={slamAt + 22} src={mcSound('ui/stonecutter/cut1')} volume={0.4} />
      <Sfx at={N - 22} src={mcSound('dig/stone4')} volume={0.45} rate={0.7} />
    </Stage>
  );
};
