// mcd3 bloom + volumetric fog (SCREEN blend). Transparent canvas, additive colours: an alpha .mov in Screen/Add or a black-background mp4 in Screen behave the same.
//   <BloomFog loop tone strength lights? />
// Contents: black-level lift in the biome hue, drifting height fog, distance haze, and a DOUBLE bloom (tight 1% + wide 5% of frame width)
// around each light. `lights` are screen-space 0..1; the default is one key light at the upper left (the game's sun / moon direction).
import type {FC} from 'react';
import {FxLayer} from '../mcdscene/engine';
import type {RGB} from '../mcdscene/rng';
import {H, W, drawScroll, glow, hex, noiseTile, ph, rgba, sstep} from './lib';

export type Light = {x: number; y: number; color?: string; size?: number; a?: number};
export type FogToneId = 'cool' | 'forest' | 'nether' | 'end' | 'snow' | 'desert';
type FogTone = {veil: RGB; veilA: number; fog: RGB; fogA: number; haze: RGB; hazeA: number; key: RGB; keyA: number};

// STYLE-SCENE 3.7: black level lifted to a hue (#05080f ... #0c0306), fog colours = biome haze colours
export const TONES: Record<FogToneId, FogTone> = {
  cool: {veil: hex('#08121e'), veilA: 1, fog: hex('#4a6a88'), fogA: 0.42, haze: hex('#56789a'), hazeA: 0.28, key: hex('#ffe2a8'), keyA: 0.55},
  forest: {veil: hex('#071a2c'), veilA: 1, fog: hex('#4d7898'), fogA: 0.46, haze: hex('#6989a5'), hazeA: 0.3, key: hex('#d8e8ff'), keyA: 0.5},
  nether: {veil: hex('#240608'), veilA: 1, fog: hex('#8a2a1c'), fogA: 0.5, haze: hex('#a83a20'), hazeA: 0.3, key: hex('#ffc060'), keyA: 0.6},
  end: {veil: hex('#12062c'), veilA: 1, fog: hex('#6a38b0'), fogA: 0.5, haze: hex('#8a50d0'), hazeA: 0.3, key: hex('#f4aafa'), keyA: 0.6},
  snow: {veil: hex('#0c1a3a'), veilA: 1, fog: hex('#7a9ccc'), fogA: 0.5, haze: hex('#8aa8d8'), hazeA: 0.3, key: hex('#e8f4ff'), keyA: 0.55},
  desert: {veil: hex('#2a1a06'), veilA: 1, fog: hex('#b09050'), fogA: 0.5, haze: hex('#c8a460'), hazeA: 0.3, key: hex('#ffd890'), keyA: 0.6},
};

export const BloomFog: FC<{loop: number; tone?: FogToneId; strength?: number; lights?: Light[]; keyAt?: [number, number]}> = ({loop, tone = 'cool', strength = 1, lights, keyAt = [0.0, -0.14]}) => {
  const T = TONES[tone];
  return (
    <FxLayer
      loop={loop}
      draw={(ctx, v) => {
        const t = ph(v.frame, loop);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // black-level veil: a faint hue in the blacks
        ctx.globalAlpha = 0.07 * strength;
        ctx.fillStyle = rgba(T.veil);
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        // distance haze at the top
        const hg = ctx.createLinearGradient(0, 0, 0, H * 0.55);
        hg.addColorStop(0, rgba(T.haze, T.hazeA * 0.38 * strength));
        hg.addColorStop(1, rgba(T.haze, 0));
        ctx.fillStyle = hg;
        ctx.fillRect(0, 0, W, H * 0.55);
        // height fog (bottom)
        const fg = ctx.createLinearGradient(0, H * 0.42, 0, H);
        fg.addColorStop(0, rgba(T.fog, 0));
        fg.addColorStop(0.55, rgba(T.fog, T.fogA * 0.2 * strength));
        fg.addColorStop(1, rgba(T.fog, T.fogA * 0.42 * strength));
        ctx.fillStyle = fg;
        ctx.fillRect(0, H * 0.42, W, H * 0.58);
        ctx.restore();
        // drifting fog banks (two parallax bands)
        const bank = noiseTile(`bf-bank|${tone}`, T.fog, 480, 120, 4, 2, 21, (n, _u, vv) => sstep(0.46, 0.7, n) * Math.pow(Math.sin(Math.PI * vv), 1.2));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        drawScroll(ctx, bank, t, 0, H * 0.44, W * 1.5, H * 0.5, 0.5 * strength);
        drawScroll(ctx, bank, 1 - t * 2 + 0.37, 0, H * 0.58, W * 1.1, H * 0.46, 0.36 * strength);
        ctx.restore();
        // double bloom around each light: tight (1% frame width) + wide (5%)
        const L: Light[] = lights ?? [{x: keyAt[0], y: keyAt[1]}];
        L.forEach((l, i) => {
          const c = hex(l.color ?? '#' + T.key.map((q) => q.toString(16).padStart(2, '0')).join(''));
          const a = (l.a ?? T.keyA) * strength * (0.94 + 0.06 * Math.sin((t + i * 0.37) * Math.PI * 2));
          const s = l.size ?? 1;
          glow(ctx, l.x * W, l.y * H, W * 0.012 * 4.2 * s, c, a * 0.62);
          glow(ctx, l.x * W, l.y * H, W * 0.05 * 4.4 * s, c, a * 0.36);
          glow(ctx, l.x * W, l.y * H, W * 0.16 * s, c, a * 0.1);
        });
      }}
    />
  );
};
