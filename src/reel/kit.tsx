import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {item, tex} from '../mc/assets';
import {PIXEL8_FONT, PIXEL_FONT} from '../mc/fonts';
import {EASE, clamp01} from '../mc/theme';
import {CycleBackdrop, type TimeOfDay} from '../mg/DayCycle';
import {ORE, OreText, TYPE, U, nine} from '../mg/Ore';

/** Shared pieces for the effects reel: Ore widgets that are not in mg/Ore, backdrops, timing helpers. */

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Eased 0..1 progress of `f` between `at` and `at + dur`. */
export const prog = (f: number, at: number, dur: number, e: (t: number) => number = EASE.out) => e(clamp01((f - at) / dur));

export const Sfx: FC<{at: number; src: string; volume?: number; rate?: number; cut?: number}> = ({at, src, volume = 1, rate = 1, cut}) => (
  <Sequence from={at} durationInFrames={cut}>
    <Audio src={src} volume={volume} playbackRate={rate} />
  </Sequence>
);
export const mcSound = (id: string) => staticFile(`mc/sounds/${id}.ogg`);
export const reelSfx = (file: string) => staticFile(`audio/sfx/${file}`);

/** Dynamic vignette: `s` 0..1 pulls the dark edge inwards and deepens it. */
export const Vignette: FC<{s: number; color?: string}> = ({s, color = '0,0,0'}) =>
  s <= 0 ? null : <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(${color},0) ${Math.round(72 - 42 * s)}%, rgba(${color},${(0.12 + 0.78 * s).toFixed(3)}) 100%)`}} />;

/** Day-cycle sky with a vignette whose strength is driven by the shot (0 = open, 1 = closed in). */
export const Sky: FC<{time: TimeOfDay; vignette?: number; zoom?: number; dim?: number; children?: ReactNode}> = ({time, vignette = 0, zoom = 1, dim = 0, children}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
    <AbsoluteFill style={{transform: `scale(${zoom})`}}>
      <CycleBackdrop time={time} options={{rays: false}} />
    </AbsoluteFill>
    {dim > 0 && <AbsoluteFill style={{background: `rgba(8,10,22,${dim})`}} />}
    <Vignette s={vignette} />
    {children}
  </AbsoluteFill>
);

/** Ore dark screen background with the faint checker the kit uses. */
export const OreBg: FC<{tone?: 'dark' | 'purple' | 'green'; children?: ReactNode}> = ({tone = 'dark', children}) => {
  const f = useCurrentFrame();
  const base = tone === 'purple' ? ['#1d1530', '#0f0a1c'] : tone === 'green' ? ['#1d2a1a', '#0e150d'] : ['#2b2c2d', '#171718'];
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, ${base[0]} 0%, ${base[1]} 100%)`}}>
      <AbsoluteFill style={{backgroundImage: `url(${staticFile('oriel/ore/checker.png')})`, backgroundSize: `${8 * U}px ${8 * U}px`, imageRendering: 'pixelated', opacity: 0.07, backgroundPosition: `${f * 0.25}px ${f * 0.25}px`}} />
      {children}
    </AbsoluteFill>
  );
};

export const ItemImg: FC<{id: string; size?: number; style?: CSSProperties}> = ({id, size = 16 * U, style}) => (
  <Img src={item(id)} style={{width: size, height: size, imageRendering: 'pixelated', ...style}} />
);

/** Slot with a hover/target frame, and an item that can be scaled by the caller. */
export const Slot: FC<{id?: string; frame?: 'slot' | 'slot_hover' | 'slot_target'; size?: number; itemScale?: number; count?: number; style?: CSSProperties}> = ({
  id,
  frame = 'slot',
  size = 24 * U,
  itemScale = 1,
  count,
  style,
}) => (
  <div style={{...nine(frame, [2, 2, 2, 2]), width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>
    {id && itemScale > 0 && <ItemImg id={id} size={16 * U} style={{transform: `scale(${itemScale})`}} />}
    {count !== undefined && count > 1 && (
      <div style={{position: 'absolute', right: 2 * U, bottom: 0}}>
        <OreText size={TYPE.small} shadow>
          {String(count)}
        </OreText>
      </div>
    )}
  </div>
);

export type TipLine = {text: string; color?: string};
export const OreTooltip: FC<{lines: TipLine[]; rare?: boolean; reveal?: number; style?: CSSProperties}> = ({lines, rare, reveal = 1, style}) => {
  // `reveal` types the text out left to right across all lines.
  const total = lines.reduce((n, l) => n + l.text.length, 0);
  let left = Math.round(total * reveal);
  return (
    <div style={{...nine(rare ? 'tooltip_rare' : 'tooltip', [2, 2, 2, 2]), padding: `${3 * U}px ${5 * U}px ${4 * U}px`, display: 'flex', flexDirection: 'column', gap: 2 * U, minWidth: 40 * U, ...style}}>
      {lines.map((l, i) => {
        const shown = l.text.slice(0, Math.max(0, left));
        left -= l.text.length;
        return (
          <OreText key={i} size={TYPE.body} color={l.color ?? ORE.text} shadow style={{minHeight: TYPE.body}}>
            {shown || ' '}
          </OreText>
        );
      })}
    </div>
  );
};

/** Ore toggle; `on` is 0..1 so the thumb can travel. */
export const Toggle: FC<{on: number}> = ({on}) => (
  <div style={{...nine(on > 0.5 ? 'toggle_on' : 'toggle_off', [2, 2, 2, 2]), width: 28 * U, height: 14 * U, position: 'relative'}}>
    <div style={{...nine('button_secondary', [2, 2, 4, 2]), position: 'absolute', top: -U, left: -U, width: 10 * U, height: 12 * U, transform: `translateX(${on * 14 * U}px)`}} />
  </div>
);

export const Slider: FC<{value: number; width: number}> = ({value, width}) => {
  const x = Math.round((width * value) / U) * U;
  return (
    <div style={{position: 'relative', width, height: 14 * U}}>
      <div style={{...nine('track', [2, 2, 2, 2]), position: 'absolute', left: 0, right: 0, top: 4 * U, height: 6 * U}} />
      <div style={{...nine('fill_green', [1, 0, 1, 0]), position: 'absolute', left: 0, top: 4 * U, height: 6 * U, width: x}} />
      <div style={{...nine('button_secondary', [2, 2, 4, 2]), position: 'absolute', top: -U, width: 8 * U, height: 14 * U, left: x - 4 * U}} />
    </div>
  );
};

export const Tab: FC<{selected?: boolean; width?: number; children: ReactNode}> = ({selected, width, children}) => (
  <div
    style={{
      ...(selected ? nine('tab_selected', [2, 2, 0, 2]) : nine('tab', [3, 2, 2, 2])),
      padding: selected ? `${2 * U}px ${4 * U}px ${6 * U}px` : `${2 * U}px ${4 * U}px ${3 * U}px`,
      display: 'inline-flex',
      justifyContent: 'center',
      width,
    }}
  >
    <OreText color={selected ? ORE.text : ORE.dim} shadow>
      {children}
    </OreText>
  </div>
);

/** Outlined text like the game's level number / HUD labels. */
export const OutlineText: FC<{size?: number; color: string; children: string; style?: CSSProperties}> = ({size = TYPE.body, color, children, style}) => {
  const p = size / 12;
  const o = [`${p}px 0 #000`, `${-p}px 0 #000`, `0 ${p}px #000`, `0 ${-p}px #000`, `${p}px ${p}px #000`, `${-p}px ${p}px #000`, `${p}px ${-p}px #000`, `${-p}px ${-p}px #000`].join(',');
  return (
    <span style={{fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color, textShadow: o, whiteSpace: 'pre', WebkitFontSmoothing: 'none', ...style}}>{children}</span>
  );
};

export const LabelSmall: FC<{children: ReactNode; color?: string; style?: CSSProperties}> = ({children, color = ORE.dim, style}) => (
  <span style={{fontFamily: PIXEL8_FONT, fontSize: TYPE.small, lineHeight: `${TYPE.small}px`, color, whiteSpace: 'pre', ...style}}>{children}</span>
);

export const hudTex = (p: string) => tex(`gui/sprites/hud/${p}.png`);

/** Cinematic letterbox: bars slide in/out. `k` 0..1. */
export const Letterbox: FC<{k: number; size?: number}> = ({k, size = 120}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: size, transform: `translateY(${-(1 - k) * size}px)`, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: size, transform: `translateY(${(1 - k) * size}px)`, background: '#000'}} />
  </>
);
