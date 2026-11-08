import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {sound} from '../mc/assets';
import {BlockBackdrop, Flash, LightRays, PixelBurst, Shake, Shockwave, Twinkles, slideIn} from '../mc/Fx';
import {ContainerGui, GuiAt, ProgressSprite, SlotItem, Tooltip} from '../mc/Gui';
import {McText} from '../mc/McText';
import {EASE, HEIGHT, MC, RARITY, WIDTH, clamp01, type Rarity} from '../mc/theme';

/**
 * Template: one recipe in a real vanilla container screen.
 * Ingredients fly into their slots one by one, an optional progress sprite fills,
 * then the result slams in with flash + burst, and a tooltip names it.
 *
 * Coordinates are vanilla GUI pixels of the item's top-left corner (see GUIS below).
 */

export type GuiKind = 'crafting' | 'furnace' | 'smithing';

type GuiDef = {
  texture: string;
  height: number;
  title: string;
  result: [number, number];
  progress?: {sprite: string; x: number; y: number; w: number; h: number; dir: 'right' | 'up'}[];
};

export const GUIS: Record<GuiKind, GuiDef> = {
  crafting: {texture: 'gui/container/crafting_table.png', height: 166, title: '合成', result: [124, 35]},
  furnace: {
    texture: 'gui/container/furnace.png',
    height: 166,
    title: '熔炉',
    result: [116, 35],
    progress: [
      {sprite: 'gui/sprites/container/furnace/lit_progress.png', x: 56, y: 36, w: 14, h: 14, dir: 'up'},
      {sprite: 'gui/sprites/container/furnace/burn_progress.png', x: 79, y: 34, w: 24, h: 16, dir: 'right'},
    ],
  },
  smithing: {texture: 'gui/container/smithing.png', height: 166, title: '升级装备', result: [98, 48]},
};

/** Crafting grid slot (col,row 0..2) -> GUI coords. */
export const craftSlot = (col: number, row: number): [number, number] => [30 + col * 18, 17 + row * 18];
export const FURNACE_INPUT: [number, number] = [56, 17];
export const FURNACE_FUEL: [number, number] = [56, 53];
export const SMITH_TEMPLATE: [number, number] = [8, 48];
export const SMITH_BASE: [number, number] = [26, 48];
export const SMITH_ADDITION: [number, number] = [44, 48];

export type RecipeProps = {
  gui: GuiKind;
  inputs: {id: string; slot: [number, number]; count?: number}[];
  result: {id: string; count?: number; name: string; rarity?: Rarity; lore?: string[]; glint?: boolean};
  /** Background block texture name. */
  backdrop?: string;
  caption?: string;
  /** Frames between ingredient drops. */
  stagger?: number;
};

const SCALE = 5; // 176x166 -> 880x830, leaves room for the tooltip and the caption

export const RecipeScene: FC<RecipeProps> = ({gui, inputs, result, backdrop = 'oak_planks', caption, stagger = 7}) => {
  const frame = useCurrentFrame();
  const def = GUIS[gui];
  const guiW = 176 * SCALE;
  const guiH = def.height * SCALE;
  const left = (WIDTH - guiW) / 2 - 220;
  const top = (HEIGHT - guiH) / 2 - 50;

  const enter = 14; // GUI pops in
  const firstDrop = enter + 6;
  const lastDrop = firstDrop + (inputs.length - 1) * stagger + 10;
  const progStart = lastDrop + 4;
  const progLen = def.progress ? 36 : 0;
  const resultAt = progStart + progLen + (def.progress ? 2 : 8);

  // GUI entrance: drop from above with overshoot, slight tilt settling to 0.
  const g = clamp01(frame / enter);
  const guiY = interpolate(EASE.back(g), [0, 1], [-140, 0]);
  const guiScale = interpolate(EASE.back(g), [0, 1], [0.82, 1]);
  const guiRot = interpolate(g, [0, 1], [-4, 0]);

  const [rx, ry] = def.result;
  const resX = left + (rx + 8) * SCALE;
  const resY = top + (ry + 8) * SCALE + guiY;
  const r = clamp01((frame - resultAt) / 10);
  const resScale = r === 0 ? 0 : interpolate(EASE.back(r), [0, 1], [2.6, 1]);

  return (
    <AbsoluteFill>
      <BlockBackdrop texture={backdrop} darken={0.62} />
      <Shake at={resultAt} strength={14}>
        {frame >= resultAt && <LightRays x={resX} y={resY} size={900} opacity={0.22 * clamp01((frame - resultAt) / 12)} />}
        <div style={{position: 'absolute', left, top, transform: `translateY(${guiY}px) scale(${guiScale}) rotate(${guiRot}deg)`, opacity: g > 0 ? 1 : 0}}>
          <ContainerGui texture={def.texture} scale={SCALE} height={def.height} title={def.title}>
            {inputs.map((inp, i) => {
              const at = firstDrop + i * stagger;
              const p = clamp01((frame - at) / 10);
              if (p === 0) return null;
              const e = EASE.out(p);
              // Fly in from the player inventory area below, arcing up.
              const fromY = 70 + (i % 3) * 8;
              const y = interpolate(e, [0, 1], [inp.slot[1] + fromY, inp.slot[1]]) - Math.sin(e * Math.PI) * 18;
              const x = interpolate(e, [0, 1], [inp.slot[0] + (i % 2 ? 20 : -20), inp.slot[0]]);
              const land = clamp01((frame - at - 10) / 6);
              const squash = land > 0 && land < 1 ? 1 + Math.sin(land * Math.PI) * 0.18 : 1;
              return (
                <GuiAt key={i} x={x} y={y} scale={SCALE}>
                  <SlotItem id={inp.id} scale={SCALE} count={inp.count} style={{transform: `scale(${squash})`}} />
                </GuiAt>
              );
            })}
            {def.progress?.map((pr, i) => (
              <GuiAt key={`p${i}`} x={pr.x} y={pr.y} scale={SCALE}>
                <ProgressSprite sprite={pr.sprite} w={pr.w} h={pr.h} scale={SCALE} progress={i === 0 ? clamp01((frame - progStart) / 10) : (frame - progStart - 4) / (progLen - 4)} direction={pr.dir} />
              </GuiAt>
            ))}
            {r > 0 && (
              <GuiAt x={rx} y={ry} scale={SCALE}>
                <SlotItem id={result.id} scale={SCALE} count={result.count} glint={result.glint ? frame / 30 : undefined} style={{transform: `scale(${resScale})`}} />
              </GuiAt>
            )}
          </ContainerGui>
        </div>
        <Shockwave x={resX} y={resY} at={resultAt} color={RARITY[result.rarity ?? 'common']} maxR={360} />
        <PixelBurst x={resX} y={resY} at={resultAt} seed={11} count={46} colors={['#FFFFFF', RARITY[result.rarity ?? 'common'], MC.gold]} />
        {frame >= resultAt + 8 && <Twinkles x={resX} y={resY} radius={110} size={36} />}
        {frame >= resultAt + 10 && (
          <div style={{position: 'absolute', left: left + guiW + 50, top: resY - 90, ...slideIn(frame, resultAt + 10, 14, {x: 60})}}>
            <Tooltip
              size={48}
              lines={[{text: result.name, color: RARITY[result.rarity ?? 'common']}, ...(result.lore ?? []).map((t) => ({text: t, color: MC.gray}))]}
            />
          </div>
        )}
      </Shake>
      <Flash at={resultAt} peak={0.55} life={8} />
      {caption && <Caption text={caption} />}
      {inputs.map((_, i) => (
        <Sequence key={`s${i}`} from={firstDrop + i * stagger + 9} durationInFrames={20}>
          <Audio src={sound('random/click')} volume={0.35} playbackRate={1 + i * 0.04} />
        </Sequence>
      ))}
      {def.progress && (
        <Sequence from={progStart} durationInFrames={progLen + 10}>
          <Audio src={sound('block/furnace/fire_crackle1')} volume={0.6} />
        </Sequence>
      )}
      <Sequence from={resultAt} durationInFrames={60}>
        <Audio src={sound(gui === 'smithing' ? 'block/smithing_table/smithing_table1' : 'random/pop')} volume={0.9} />
      </Sequence>
      <Sequence from={resultAt + 2} durationInFrames={60}>
        <Audio src={sound('random/orb')} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Frames a RecipeScene needs for its animation plus `hold` frames of rest. */
export const recipeDuration = (p: Pick<RecipeProps, 'gui' | 'inputs' | 'stagger'>, hold = 45) => {
  const stagger = p.stagger ?? 7;
  const prog = GUIS[p.gui].progress ? 38 : 8;
  return 20 + (p.inputs.length - 1) * stagger + 14 + prog + 24 + hold;
};

/** Bottom subtitle bar, sized above the 5%-of-frame minimum. */
export const Caption: FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 28, display: 'flex', justifyContent: 'center', opacity: clamp01(frame / 8)}}>
      <div style={{background: 'rgba(0,0,0,0.6)', padding: '10px 28px 14px'}}>
        <McText size={60}>{text}</McText>
      </div>
    </div>
  );
};
