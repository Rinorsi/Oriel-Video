import type {CSSProperties, FC, ReactNode} from 'react';
import {tex} from '../../../mc/assets';
import {Crop} from '../../mob';
import {INK} from './kit';

/**
 * Real Minecraft mobs from the vanilla entity textures (see ../../mob.tsx for the UV notes), built from `Crop` pieces.
 * `s` = screen pixels per texture pixel (use whole numbers). Each mob has a hard ink outline (4-way drop shadow) so it
 * sits in the flat cute style without redrawing anything by hand.
 * Layouts in texels: PigMob 10 x 14, SheepMob 8 x 13, ChickenMob 6 x 14, SlimeMob 8 x 8.
 */

const outline = (o: number) => `drop-shadow(${o}px 0 0 ${INK}) drop-shadow(${-o}px 0 0 ${INK}) drop-shadow(0 ${o}px 0 ${INK}) drop-shadow(0 ${-o}px 0 ${INK})`;

const PIG = 'entity/pig/pig_temperate.png';
const SHEEP = 'entity/sheep/sheep.png';
const WOOL = 'entity/sheep/sheep_wool.png';
const CHICK = 'entity/chicken/chicken_temperate.png';
const SLIME = 'entity/slime/slime.png';

const Box: FC<{w: number; h: number; s: number; style?: CSSProperties; children: ReactNode}> = ({w, h, s, style, children}) => (
  <div style={{position: 'relative', width: w * s, height: h * s, filter: outline(Math.max(3, Math.round(s / 3))), ...style}}>{children}</div>
);
const At2: FC<{x: number; y: number; s: number; children: ReactNode}> = ({x, y, s, children}) => <div style={{position: 'absolute', left: x * s, top: y * s}}>{children}</div>;

/** Pig seen from the front: head, chest and two front legs. `step` (-1..1) lifts one leg for a trotting feel. */
export const PigMob: FC<{s: number; step?: number; style?: CSSProperties}> = ({s, step = 0, style}) => (
  <Box w={10} h={14} s={s} style={style}>
    <At2 x={0} y={4} s={s}>
      <Crop src={tex(PIG)} sheet={[64, 64]} rect={[36, 8, 10, 8]} scale={s} />
    </At2>
    <At2 x={1} y={11 - Math.max(0, step) * 1} s={s}>
      <Crop src={tex(PIG)} sheet={[64, 64]} rect={[4, 20, 4, 3]} scale={s} />
    </At2>
    <At2 x={5} y={11 - Math.max(0, -step) * 1} s={s}>
      <Crop src={tex(PIG)} sheet={[64, 64]} rect={[4, 20, 4, 3]} scale={s} />
    </At2>
    <At2 x={1} y={0} s={s}>
      <Crop src={tex(PIG)} sheet={[64, 64]} rect={[8, 8, 8, 8]} scale={s}>
        <Crop src={tex(PIG)} sheet={[64, 64]} rect={[17, 17, 4, 3]} scale={s} style={{position: 'absolute', left: 2 * s, top: 4 * s}} />
      </Crop>
    </At2>
  </Box>
);

/** Sheep seen from the front: woolly body, face with its wool tuft, two legs. */
export const SheepMob: FC<{s: number; step?: number; style?: CSSProperties}> = ({s, step = 0, style}) => (
  <Box w={8} h={13} s={s} style={style}>
    <At2 x={0} y={3} s={s}>
      <Crop src={tex(WOOL)} sheet={[64, 32]} rect={[34, 8, 8, 6]} scale={s} />
    </At2>
    <At2 x={0} y={9 - Math.max(0, step)} s={s}>
      <Crop src={tex(SHEEP)} sheet={[64, 32]} rect={[4, 29, 4, 3]} scale={s} />
    </At2>
    <At2 x={4} y={9 - Math.max(0, -step)} s={s}>
      <Crop src={tex(SHEEP)} sheet={[64, 32]} rect={[4, 29, 4, 3]} scale={s} />
    </At2>
    <At2 x={1} y={0} s={s}>
      <Crop src={tex(SHEEP)} sheet={[64, 32]} rect={[8, 8, 6, 6]} scale={s} />
    </At2>
    <At2 x={1} y={0} s={s}>
      <Crop src={tex(WOOL)} sheet={[64, 32]} rect={[6, 6, 6, 2]} scale={s} />
    </At2>
  </Box>
);

/** Chicken seen from the front: head with beak, body, two orange feet. */
export const ChickenMob: FC<{s: number; step?: number; style?: CSSProperties}> = ({s, step = 0, style}) => (
  <Box w={6} h={14} s={s} style={style}>
    <At2 x={0} y={5} s={s}>
      <Crop src={tex(CHICK)} sheet={[64, 32]} rect={[6, 9, 6, 6]} scale={s} />
    </At2>
    <At2 x={1} y={11 - Math.max(0, step)} s={s}>
      <div style={{width: s, height: 3 * s, background: '#f0a028'}} />
    </At2>
    <At2 x={4} y={11 - Math.max(0, -step)} s={s}>
      <div style={{width: s, height: 3 * s, background: '#f0a028'}} />
    </At2>
    <At2 x={1} y={0} s={s}>
      <Crop src={tex(CHICK)} sheet={[64, 32]} rect={[3, 3, 4, 6]} scale={s}>
        <Crop src={tex(CHICK)} sheet={[64, 32]} rect={[16, 2, 4, 2]} scale={s} style={{position: 'absolute', left: 0, top: 2 * s}} />
      </Crop>
    </At2>
  </Box>
);

/** Slime: dark inner cube with eyes and mouth under the translucent outer shell. `squash` > 1 widens it. */
export const SlimeMob: FC<{s: number; style?: CSSProperties}> = ({s, style}) => (
  <Box w={8} h={8} s={s} style={style}>
    <At2 x={1} y={1} s={s}>
      <Crop src={tex(SLIME)} sheet={[64, 32]} rect={[6, 22, 6, 6]} scale={s} />
    </At2>
    <At2 x={1} y={2} s={s}>
      <Crop src={tex(SLIME)} sheet={[64, 32]} rect={[34, 2, 2, 2]} scale={s} />
    </At2>
    <At2 x={5} y={2} s={s}>
      <Crop src={tex(SLIME)} sheet={[64, 32]} rect={[34, 6, 2, 2]} scale={s} />
    </At2>
    <At2 x={4} y={5} s={s}>
      <Crop src={tex(SLIME)} sheet={[64, 32]} rect={[33, 9, 1, 1]} scale={s} />
    </At2>
    <At2 x={0} y={0} s={s}>
      <Crop src={tex(SLIME)} sheet={[64, 32]} rect={[8, 8, 8, 8]} scale={s} style={{opacity: 0.3}} />
    </At2>
  </Box>
);

/** Pixel size (w, h) in screen px of each mob at scale `s`. */
export const MOB_SIZE = {pig: [10, 14], sheep: [8, 13], chicken: [6, 14], slime: [8, 8]} as const;
