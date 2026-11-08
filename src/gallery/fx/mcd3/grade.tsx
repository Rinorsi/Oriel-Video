// mcd3 colour grades: biome LIGHTING MAPS built for MULTIPLY blend (white = no change, so the canvas is opaque).
//   <GradeMap biome="forest|nether|end|snow|desert" loop intensity lights? />
// Multiply is the physically right operator for "the sun went down / the room is lit by lava": it dims and tints but keeps the footage's
// own contrast. The map is a biome tint, brighter in the middle (pooled light), dark biome-coloured vignette at the edges, with optional
// extra pools (`lights`, screen-space, 0..1) carved brighter. Pair it with a screen layer (mcd-l-bloom-fog) for fog and black-level lift.
import type {FC} from 'react';
import {FxLayer} from '../mcdscene/engine';
import {H, W, ph, rgba, hex} from './lib';
import type {RGB} from '../mcdscene/rng';

export type GradeBiome = 'forest' | 'nether' | 'end' | 'snow' | 'desert';

export type GradeP = {
  /** multiply tint of the mid areas */
  tint: RGB;
  /** brighter tint at the centre of interest */
  core: RGB;
  coreAt: [number, number];
  /** vignette colour (at the corners) and strength 0..1 */
  vig: RGB;
  vigA: number;
  /** top of the frame gets this extra dimming (0..1) so the sky / distance sinks */
  topDim: number;
  /** breathing amplitude of the centre pool (0..1) */
  breathe: number;
};

// palette targets: STYLE-SCENE 3.7 / 6.6
export const GRADES: Record<GradeBiome, GradeP> = {
  // forest night: far #6989a5, ground #2c4459 / #18334a, shadow #0d1929, vignette 0.5
      forest: {tint: hex('#2f68a0'), core: hex('#8cbcee'), coreAt: [0.5, 0.58], vig: hex('#020a16'), vigA: 0.96, topDim: 0.3, breathe: 0.05},
  // nether: #290209 / #43050c / #670812 with gold #f4c429
    nether: {tint: hex('#ff6a48'), core: hex('#ffbe84'), coreAt: [0.5, 0.62], vig: hex('#180106'), vigA: 0.96, topDim: 0.26, breathe: 0.07},
  // end: #10001e / #2d0b5f, platform #a05cc0, pink-white #f4aafa
    end: {tint: hex('#8a54e0'), core: hex('#e0a8ff'), coreAt: [0.5, 0.55], vig: hex('#08011c'), vigA: 0.96, topDim: 0.28, breathe: 0.05},
  // snow: #112753 / #204479 / #606c91
    snow: {tint: hex('#7eb0f4'), core: hex('#e0f0ff'), coreAt: [0.5, 0.56], vig: hex('#08143a'), vigA: 0.86, topDim: 0.16, breathe: 0.04},
  // desert: haze #b29d6c, sand #a28852, shadow #211f0f, vignette 0.2
    desert: {tint: hex('#ffcc7a'), core: hex('#fff0be'), coreAt: [0.5, 0.52], vig: hex('#36200a'), vigA: 0.72, topDim: 0.12, breathe: 0.03},
};

export const GradeMap: FC<{biome: GradeBiome; loop: number; intensity?: number; coreAt?: [number, number]; lights?: {x: number; y: number; r: number; color?: string; a?: number}[]}> = ({biome, loop, intensity = 1, coreAt, lights}) => {
  const P = {...GRADES[biome], ...(coreAt ? {coreAt} : {})};
  return (
    <FxLayer
      loop={loop}
      draw={(ctx, v) => {
        const t = ph(v.frame, loop);
        const br = 1 + P.breathe * Math.sin(t * Math.PI * 2);
        ctx.fillStyle = rgba(P.tint);
        ctx.fillRect(0, 0, W, H);
        // pooled light in the middle
        ctx.save();
        ctx.translate(W * P.coreAt[0], H * P.coreAt[1]);
        ctx.scale(1.7, 1);
        const R = H * 0.52 * br;
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
        rg.addColorStop(0, rgba(P.core, 1));
        rg.addColorStop(0.45, rgba(P.core, 0.55));
        rg.addColorStop(1, rgba(P.core, 0));
        ctx.fillStyle = rg;
        ctx.fillRect(-R, -R, R * 2, R * 2);
        ctx.restore();
        // extra light pools (lantern / torch / lava)
        for (const L of lights ?? []) {
          const c = hex(L.color ?? '#fff0d0');
          const px = L.x * W;
          const py = L.y * H;
          const r = L.r * W;
          const g = ctx.createRadialGradient(px, py, 0, px, py, r);
          g.addColorStop(0, rgba(c, L.a ?? 0.9));
          g.addColorStop(0.5, rgba(c, (L.a ?? 0.9) * 0.4));
          g.addColorStop(1, rgba(c, 0));
          ctx.fillStyle = g;
          ctx.fillRect(px - r, py - r, r * 2, r * 2);
        }
        // sky / far distance sinks
        const tg = ctx.createLinearGradient(0, 0, 0, H * 0.5);
        tg.addColorStop(0, rgba(P.vig, P.topDim));
        tg.addColorStop(1, rgba(P.vig, 0));
        ctx.fillStyle = tg;
        ctx.fillRect(0, 0, W, H * 0.5);
        // vignette
        ctx.save();
        ctx.translate(W / 2, H * 0.5);
        ctx.scale(W / H, 1);
        const VR = H * 0.74;
        const vg = ctx.createRadialGradient(0, 0, VR * 0.3, 0, 0, VR);
        vg.addColorStop(0, rgba(P.vig, 0));
        vg.addColorStop(0.5, rgba(P.vig, P.vigA * 0.2));
        vg.addColorStop(0.8, rgba(P.vig, P.vigA * 0.6));
        vg.addColorStop(1, rgba(P.vig, P.vigA));
        ctx.fillStyle = vg;
        ctx.fillRect(-VR * 2, -VR, VR * 4, VR * 2);
        ctx.restore();
        if (intensity < 1) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 1 - intensity;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
        }
      }}
    />
  );
};
