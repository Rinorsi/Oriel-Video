import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {FLAT, PixelSprite, RAINBOW, flatBox} from '../../flat';
import {Confetti, H, Halftone, PX, Sparkles, Stage, StickerText as Sticker, W, back, lerp, pr, spring, Sfx} from './ui';
import {MascotHead} from './mascot';

/**
 * Chapter title card, cute flat sticker style (transparent overlay).
 * Pastel colour bands wipe across, a tilted paper banner squashes in over two peeking cards, sticker letters bounce in one by one,
 * a round chapter badge wobbles, mascots pop up from the grass hills, clouds and stars drift.
 * Props: no (chapter number), title (<= 6 chars), sub (ribbon line), accent (title colour), badge (round badge text, default `第{no}章`),
 *   dim (wash darkness multiplier), frames (total length; the exit starts ~26 frames before it).
 */

export const CHAPTER_FLAT_FRAMES = 150;

const Cloud: FC<{x: number; y: number; px?: number; speed?: number; k?: number}> = ({x, y, px = 12, speed = 0.5, k = 1}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: x + Math.sin(f / 40 + x) * 16 + f * speed * 0, top: y + Math.sin(f / 26 + y) * 6, transform: `scale(${k})`, transformOrigin: '50% 100%'}}>
      <PixelSprite sprite="cloud" px={px} outline={FLAT.ink} />
    </div>
  );
};

export const ChapterFlat: FC<{bg?: boolean; no?: number; title?: string; sub?: string; accent?: string; badge?: string; dim?: number; frames?: number}> = ({bg, no = 3, title = '红石小课堂', sub = '今天教你造全自动门', accent = FLAT.yellow, badge, dim = 1, frames = CHAPTER_FLAT_FRAMES}) => {
  const f = useCurrentFrame();
  const N = frames;
  const outP = pr(f, N - 22, 20, EASE.in);
  const stay = 1 - outP;
  const bannerIn = pr(f, 8, 22, (t) => t);
  const sp = spring(bannerIn, 8, 4.2);
  const bs = (0.25 + 0.75 * sp) * (1 - outP * 0.8);
  const tilt = lerp(-14, -3, sp) + Math.sin(f / 22) * 0.6 - outP * 10;
  const chars = [...title];
  const BW = 1500;
  const BH = 540;
  const bands = [FLAT.pink, FLAT.yellow, FLAT.sky, FLAT.mint, FLAT.lilac];
  return (
    <Stage bg={bg}>
      {/* soft wash so the card reads on any footage */}
      <div style={{position: 'absolute', inset: 0, background: `rgba(43,35,56,${0.4 * dim * pr(f, 0, 10) * stay})`}} />
      {/* sweeping colour bands */}
      {bands.map((c, i) => {
        const inP = pr(f, i * 2, 16);
        const outB = pr(f, N - 26 + i * 2, 16, EASE.in);
        const x = lerp(-2600, 0, inP) + lerp(0, 2600, outB);
        return (
          <div key={i} style={{position: 'absolute', left: -300 + x, top: 190 + i * 140, width: 2600, height: 150, background: c, transform: 'rotate(-6deg)', borderTop: `8px solid ${FLAT.ink}`, borderBottom: `8px solid ${FLAT.ink}`, boxSizing: 'border-box'}}>
            <Halftone color={FLAT.ink} opacity={0.1} size={20} dot={4} />
          </div>
        );
      })}

      {/* grass hills */}
      {[
        {x: -300, w: 1300, c: FLAT.green, d: FLAT.greenDeep, y: 880},
        {x: 900, w: 1400, c: FLAT.green, d: FLAT.greenDeep, y: 900},
        {x: 300, w: 1200, c: FLAT.mint, d: FLAT.green, y: 960},
      ].map((hl, i) => {
        const up = back(pr(f, 4 + i * 3, 18, (t) => t)) * stay;
        return (
          <div key={i} style={{position: 'absolute', left: hl.x, top: hl.y + (1 - up) * 300, width: hl.w, height: 520, borderRadius: '50%', background: hl.c, border: `8px solid ${FLAT.ink}`, boxShadow: `inset 0 14px 0 ${hl.d}`, boxSizing: 'border-box'}} />
        );
      })}

      {/* banner: two peeking cards, then the main card */}
      <div style={{position: 'absolute', left: (W - BW) / 2, top: 250, width: BW, height: BH, transform: `rotate(${tilt}deg) scale(${bs})`, opacity: stay > 0.05 ? 1 : 0}}>
        <div style={{position: 'absolute', inset: 0, transform: 'rotate(-5deg) translate(-26px, 20px)', ...flatBox(FLAT.pink, {radius: 36, border: 8, shadow: 0})}} />
        <div style={{position: 'absolute', inset: 0, transform: 'rotate(4deg) translate(30px, 26px)', ...flatBox(FLAT.sky, {radius: 36, border: 8, shadow: 0})}} />
        <div style={{position: 'absolute', inset: 0, ...flatBox(FLAT.cream, {radius: 36, border: 8, shadow: 18}), overflow: 'hidden'}}>
          <Halftone color={FLAT.pink} opacity={0.35} size={32} dot={6} style={{top: 90}} />
          {/* rainbow header */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 72}}>
            {RAINBOW.map((c, i) => (
              <div key={c} style={{height: 12, background: c}} />
            ))}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 20, background: FLAT.ink}} />
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <div style={{position: 'absolute', top: -40, bottom: -40, left: `${lerp(-30, 130, pr(f, 46, 26, (t) => t))}%`, width: 70, transform: 'skewX(-20deg)', background: 'rgba(255,255,255,0.6)'}} />
          </div>
        </div>
        {/* title letters */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', justifyContent: 'center', gap: 8}}>
          {chars.map((ch, i) => {
            const t = pr(f, 22 + i * 3.5, 14, (x) => x);
            const s = t <= 0 ? 0 : 0.4 + 0.6 * spring(t, 9, 4) + 0.0;
            const idle = f > 50 ? Math.sin((f - i * 4) / 7) * 8 : 0;
            return (
              <div key={i} style={{transform: `translateY(${(1 - Math.min(1, t * 1.4)) * -220 + idle}px) scale(${s}, ${s * (1 + (t > 0 && t < 0.5 ? 0.15 : 0))}) rotate(${(i % 2 ? 1 : -1) * (3 + (1 - t) * 14)}deg)`, opacity: t > 0 ? 1 : 0}}>
                <Sticker size={192} color={i % 2 ? accent : FLAT.pink}>{ch}</Sticker>
              </div>
            );
          })}
        </div>
        {/* sub ribbon */}
        <div style={{position: 'absolute', left: 210, right: 210, bottom: 66, height: 96, transform: `scaleX(${pr(f, 52, 14, back)})`, ...flatBox(FLAT.red, {radius: 16, border: 8, shadow: 8, edge: 'rgba(255,255,255,0.35)'}), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <PX size={60} color="#fff" shadow={FLAT.redDeep}>{sub}</PX>
        </div>
        {/* chapter badge */}
        <div style={{position: 'absolute', left: -70, top: -80, width: 220, height: 220, transform: `rotate(${-12 + Math.sin(f / 9) * 5}deg) scale(${spring(pr(f, 30, 16, (t) => t), 9, 4)})`}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: FLAT.red, border: `8px solid ${FLAT.ink}`, boxShadow: `0 12px 0 ${FLAT.ink}, inset 0 10px 0 rgba(255,255,255,0.35)`, boxSizing: 'border-box'}} />
          <div style={{position: 'absolute', inset: 22, borderRadius: '50%', border: `6px dashed ${FLAT.cream}`}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Sticker size={72} color={FLAT.cream} halo={false}>{badge ?? `第${no}章`}</Sticker>
          </div>
        </div>
      </div>

      {/* mascots popping up from the hills */}
      {([
        {s: 'slime', x: 180, y: 780, px: 24, at: 36},
        {s: 'pig', x: 1560, y: 770, px: 24, at: 42},
        {s: 'creeper', x: 1100, y: 905, px: 16, at: 48},
      ] as const).map((m) => {
        const t = pr(f, m.at, 16, (x) => x);
        const e = spring(t, 9, 4);
        const bob = f > m.at + 20 ? Math.abs(Math.sin((f - m.at) / 7)) * 14 : 0;
        return (
          <div key={m.s} style={{position: 'absolute', left: m.x, top: m.y - bob + (1 - Math.min(1, e)) * 260 + outP * 300, transform: `scale(${1 + (e - 1) * 0.4}, ${1 - (e - 1) * 0.3})`, transformOrigin: '50% 100%'}}>
            <MascotHead kind={m.s} scale={m.px} />
          </div>
        );
      })}

      {/* clouds and stars */}
      <div style={{opacity: stay}}>
        <Cloud x={90} y={90} px={14} />
        <Cloud x={1450} y={60} px={16} />
        <Cloud x={820} y={30} px={10} />
        {[
          {x: 380, y: 180, px: 8, at: 30},
          {x: 1500, y: 240, px: 10, at: 34},
          {x: 1750, y: 520, px: 8, at: 38},
          {x: 130, y: 600, px: 10, at: 40},
          {x: 1280, y: 140, px: 6, at: 44},
        ].map((s, i) => {
          const t = pr(f, s.at, 12, (x) => x);
          return (
            <div key={i} style={{position: 'absolute', left: s.x, top: s.y + Math.sin(f / 12 + i) * 8, transform: `scale(${spring(t, 8, 4)}) rotate(${Math.sin(f / 14 + i) * 12}deg)`, opacity: t > 0 ? 1 : 0}}>
              <PixelSprite sprite="star" px={s.px} outline={FLAT.ink} />
            </div>
          );
        })}
        {[{x: 330, y: 720, at: 50}, {x: 1700, y: 720, at: 54}].map((h, i) => (
          <div key={i} style={{position: 'absolute', left: h.x, top: h.y + Math.sin(f / 9 + i * 2) * 10, transform: `scale(${spring(pr(f, h.at, 12, (x) => x), 8, 4)})`}}>
            <PixelSprite sprite="heart" px={8} outline={FLAT.ink} />
          </div>
        ))}
        <Sparkles x={0} y={0} w={W} h={H} count={14} seed={31} px={5} color="#ffffff" at={20} />
      </div>
      <Confetti at={26} life={70} count={50} colors={[FLAT.pink, FLAT.yellow, FLAT.sky, FLAT.mint, FLAT.lilac, FLAT.orange]} seed={9} size={16} />

      <Sfx at={6} src={mcSound('ui/loom/take_result1')} volume={0.45} />
      <Sfx at={10} src={mcSound('random/pop')} volume={0.5} rate={1.1} />
      {chars.map((_, i) => (
        <Sfx key={i} at={26 + Math.round(i * 3.5)} src={mcSound('random/pop')} volume={0.28} rate={0.9 + i * 0.12} />
      ))}
      <Sfx at={34} src={mcSound('random/orb')} volume={0.3} rate={1.3} />
      <Sfx at={N - 24} src={mcSound('ui/toast/out')} volume={0.3} />
    </Stage>
  );
};
