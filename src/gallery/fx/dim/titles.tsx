import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {PixelBurst, Shockwave, Twinkles} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE, OreChip, OreText, TYPE, U} from '../../../mg/Ore';
import {mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import {BandTitle, TITLE_PALETTES, hexA, outlineShadow, type TitleTone} from './kit';

/**
 * Big dimension title card, driven by the local frame (wrap it in a <Sequence>).
 *   f 0..8    dark band + accent rails grow from the centre
 *   f 6..      title characters drop in one by one with squash, shockwave + pixel burst on each landing
 *   f 26..     english name, divider and one-line description
 *   last 14   everything folds away
 * Props: title / sub / desc text, tone (palette key), accent colour for rails + particles, two block textures for the side icons.
 */
export const DimTitle: FC<{title: string; sub: string; desc: string; chip: string; tone: TitleTone; accent: string; iconA: string; iconB: string; total: number; sfx?: boolean; tintA?: string; size?: number}> = ({title, sub, desc, chip, tone, accent, iconA, iconB, total, sfx = true, tintA, size = 240}) => {
  const f = useCurrentFrame();
  const pal = TITLE_PALETTES[tone];
  const out = prog(f, total - 14, 14, EASE.in);
  const band = prog(f, 0, 9, EASE.out) * (1 - out);
  const chars = [...title];
  const gap = 24;
  const rowW = chars.length * size + (chars.length - 1) * gap;
  const x0 = 960 - rowW / 2;
  const landings = chars.map((_, i) => 6 + i * 5 + 7);
  const lastLand = landings[landings.length - 1];
  const pulse = f < landings[0] ? 0 : Math.max(0, 1 - (f - landings[0]) / 22);
  const subIn = prog(f, lastLand + 4, 10, EASE.out);
  const divIn = prog(f, lastLand + 8, 14, EASE.out);
  const descIn = prog(f, lastLand + 14, 10, EASE.out);
  const iconIn = prog(f, 14, 14, EASE.back);
  return (
    <AbsoluteFill style={{opacity: 1 - out * 0.9}}>
      {/* band */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 270, height: 580, transform: `scaleY(${band})`, background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 14%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.62) 86%, rgba(0,0,0,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 270, height: 580, transform: `scaleY(${band})`, background: `radial-gradient(ellipse at 50% 46%, ${hexA(accent, 0.1 + 0.4 * pulse)} 0%, rgba(0,0,0,0) 62%)`}} />
      {[270, 844].map((y, i) => (
        <div key={y} style={{position: 'absolute', left: 960 - 760 * band, width: 1520 * band, top: y, height: 6, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 24px, rgba(0,0,0,0) 24px 32px)`, opacity: 0.9, boxShadow: `0 ${i ? 6 : -6}px 0 rgba(0,0,0,0.5)`}} />
      ))}
      <Twinkles x={960} y={540} radius={720} count={14} size={36} seed={4} />
      {/* chip */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 298, display: 'flex', justifyContent: 'center', opacity: prog(f, 6, 8), transform: `translateY(${(1 - prog(f, 6, 10)) * -20}px)`}}>
        <OreChip color={ORE.text} dot={accent}>
          {chip}
        </OreChip>
      </div>
      {/* title characters */}
      {chars.map((ch, i) => {
        const at = 6 + i * 5;
        const t = f - at;
        const drop = t < 0 ? -760 : -760 * Math.pow(1 - clamp01(t / 7), 2);
        const sq = t >= 7 ? Math.max(0, 1 - (t - 7) / 7) * Math.cos((t - 7) * 0.9) : 0;
        return (
          <div key={i} style={{position: 'absolute', left: x0 + i * (size + gap), top: 354 + (240 - size) / 2, transform: `translateY(${drop}px) scale(${1 + sq * 0.14}, ${1 - sq * 0.2})`, transformOrigin: '50% 100%', opacity: t < 0 ? 0 : 1, filter: `drop-shadow(0 0 ${14 + 40 * pulse}px ${hexA(pal.glow ?? accent, 0.35 + 0.5 * pulse)})`}}>
            <BandTitle size={size} tone={tone}>
              {ch}
            </BandTitle>
          </div>
        );
      })}
      {landings.map((l, i) => (
        <div key={i}>
          <Shockwave x={x0 + i * (size + gap) + size / 2} y={600} at={l} color={accent} maxR={260} life={16} width={10} />
          <PixelBurst x={x0 + i * (size + gap) + size / 2} y={600} at={l} count={26} colors={[pal.light, pal.mid, accent, '#ffffff']} speed={20} life={30} size={14} gravity={0.5} seed={30 + i} />
        </div>
      ))}
      {/* english name */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', opacity: subIn, transform: `translateY(${(1 - subIn) * 24}px) scale(${0.9 + 0.1 * subIn})`}}>
        <OreText size={TYPE.h1} color={pal.light} style={{letterSpacing: 12, marginRight: -12, textShadow: `${U}px ${U}px 0 ${pal.extrude2}, 0 0 24px ${hexA(accent, 0.6)}`}}>
          {sub}
        </OreText>
      </div>
      {/* divider with diamond */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 754, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: divIn}}>
        <div style={{width: 360 * divIn, height: 4, background: accent, boxShadow: `0 4px 0 rgba(0,0,0,0.5)`}} />
        <div style={{width: 20, height: 20, background: pal.light, transform: 'rotate(45deg)', boxShadow: `0 0 0 4px ${accent}, 0 8px 0 4px rgba(0,0,0,0.5)`}} />
        <div style={{width: 360 * divIn, height: 4, background: accent, boxShadow: `0 4px 0 rgba(0,0,0,0.5)`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 784, display: 'flex', justifyContent: 'center', opacity: descIn, transform: `translateY(${(1 - descIn) * 16}px)`}}>
        <OreText size={TYPE.body} color={ORE.text} shadow style={{textShadow: outlineShadow(3), letterSpacing: 6, marginRight: -6}}>
          {desc}
        </OreText>
      </div>
      {/* side icons */}
      {[
        {src: iconA, x: 270, d: 1, filter: tintA},
        {src: iconB, x: 1650, d: -1, filter: undefined as string | undefined},
      ].map(({src, x, d, filter}) => (
        <div key={x} style={{position: 'absolute', left: x - 90, top: 450 + Math.sin(f / 10 + x) * 8, width: 180, height: 180, transform: `scale(${iconIn}) rotate(${d * (1 - iconIn) * 120 + d * 4 * Math.sin(f / 14)}deg)`, background: 'rgba(0,0,0,0.5)', border: `8px solid ${accent}`, boxShadow: `0 12px 0 rgba(0,0,0,0.55), 0 0 40px ${hexA(accent, 0.55)}`, padding: 18, boxSizing: 'border-box'}}>
          <Img src={src} style={{width: '100%', height: '100%', imageRendering: 'pixelated', filter}} />
        </div>
      ))}
      {sfx && (
        <>
          {landings.map((l, i) => (
            <Sfx key={i} at={l} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.55} rate={0.8} />
          ))}
          <Sfx at={lastLand} src={mcSound('random/anvil_land')} volume={0.32} rate={0.9} />
          <Sfx at={lastLand + 2} src={reelSfx('impact-cine.mp3')} volume={0.4} />
          <Sfx at={lastLand + 8} src={mcSound('ui/toast/challenge_complete')} volume={0.28} />
          <Sfx at={lastLand + 4} src={mcSound('random/pop')} volume={0.3} />
        </>
      )}
    </AbsoluteFill>
  );
};
