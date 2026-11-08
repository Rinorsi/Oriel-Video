import {useCallback, type CSSProperties, type FC, type ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block, item, tex} from '../mc/assets';
import {mulberry32} from '../mc/theme';
import {debris, glow, gradient, halftone, hexA, loadGfx, rays, speedLines, sprite, squareHalos, starburst, type GfxAssets} from '../mg/Graphic';
import {LH, LW, LowRes, tint, useAssets} from '../mg/LowRes';
import {ORE, OreChip, OrePanel, OreProgress, OreSlot, OreText, PlayerFace, TYPE, U, nine} from '../mg/Ore';
import {BLACK_FONT, PIXEL_FONT} from '../mc/fonts';
import {BlockText, GOLD_BLOCK, SKY_BLOCK, type BlockStyle} from '../mg/BlockText';
import {drawHills, makeHills} from '../mg/Scenery';

/**
 * Three still style frames for the intro (frame 0, 1, 2), to agree on the look before animating.
 * Clear daytime palette: Minecraft sky blue, white block clouds, Ore greens and gold, with Ore UI
 * pieces (slot, tags, progress bar, bevelled panels) built into the composition.
 *   0  cold open: the stick in a giant Ore slot
 *   1  the TNT drops onto the Minecraft logo
 *   2  the episode title after the blast
 */

const TITLE = '从木棍到下界合金剑';
const SPLASH = '从零走完整条装备线！';
const CHANNEL = '方块工坊';

const SKY = {
  deep: '#3f8fe6',
  mid: '#7cc0ff',
  light: '#c4e6ff',
  haze: '#eaf8ff',
  white: '#ffffff',
  cloudShade: '#cfe3f5',
  hillFar: '#a6dcc8',
  hillMid: ORE.greenLight,
  hillNear: ORE.green,
  shadow: '#1e1e1f',
} as const;

type Assets = GfxAssets & {cloud: HTMLCanvasElement; cloudShade: HTMLCanvasElement};

const useGfx = () =>
  useAssets<Assets>('gfx-day', async () => {
    const g = await loadGfx({
      stick: item('stick'),
      tnt: block('tnt_side'),
      glint: tex('particle/glint.png'),
      sun: tex('environment/celestial/sun.png'),
      clouds: tex('environment/clouds.png'),
      boom7: tex('particle/explosion_6.png'),
      boom10: tex('particle/explosion_9.png'),
      boom12: tex('particle/explosion_12.png'),
      stone: block('stone'),
      cobble: block('cobblestone'),
      dirt: block('dirt'),
      grass: block('grass_block_side'),
    });
    const c = g.sprites.clouds;
    return {...g, cloud: tint(c, SKY.white, 0, 96, 256, 7), cloudShade: tint(c, SKY.cloudShade, 0, 96, 256, 7)};
  });

const HILLS_FAR = makeHills(14, 232, 26, 3, 0);
const HILLS_MID = makeHills(5, 246, 22, 3, 7);
const HILLS_NEAR = makeHills(22, 260, 14, 4, 0);

/** Flat block clouds with a lighter-blue underside, tiled across the frame. */
const clouds = (ctx: CanvasRenderingContext2D, a: Assets, y: number, scale: number, offset: number, alpha = 1) => {
  const w = a.cloud.width * scale;
  const h = a.cloud.height * scale;
  ctx.globalAlpha = alpha;
  for (let x = -((offset % w) + w) % w; x < LW; x += w) {
    ctx.drawImage(a.cloudShade, Math.round(x), Math.round(y + scale), w, h);
    ctx.drawImage(a.cloud, Math.round(x), Math.round(y), w, h);
  }
  ctx.globalAlpha = 1;
};

const daySky = (ctx: CanvasRenderingContext2D, top: string = SKY.deep) =>
  gradient(ctx, 0, 0, 0, LH, [
    [0, top],
    [0.45, SKY.mid],
    [0.78, SKY.light],
    [1, SKY.haze],
  ]);

/** Three hill layers; the nearest is cut like a grass block: grass on top, dirt below. */
const meadow = (ctx: CanvasRenderingContext2D) => {
  drawHills(ctx, HILLS_FAR, SKY.hillFar, 0);
  drawHills(ctx, HILLS_MID, '#8fd06a', 40);
  // Mid-layer grass highlight on each column top.
  const xm = -40 - 100;
  ctx.fillStyle = '#b5e88f';
  HILLS_MID.heights.forEach((h, c) => ctx.fillRect(xm + c * HILLS_MID.cell, HILLS_MID.base - h, HILLS_MID.cell, 1));
  const {cell, base, heights} = HILLS_NEAR;
  const x0 = -10 - 100;
  const rnd = mulberry32(8);
  heights.forEach((h, c) => {
    const x = x0 + c * cell;
    const top = base - h;
    ctx.fillStyle = '#7a5537';
    ctx.fillRect(x, top, cell, LH - top);
    for (let y = top + 4; y < LH; y += 2)
      for (let k = 0; k < cell; k += 2)
        if (rnd() < 0.22) {
          ctx.fillStyle = rnd() < 0.5 ? '#5f4029' : '#93694a';
          ctx.fillRect(x + k, y, 2, 2);
        }
    ctx.fillStyle = ORE.green;
    ctx.fillRect(x, top, cell, 4);
    ctx.fillStyle = ORE.greenLight;
    ctx.fillRect(x, top, cell, 1);
    if (rnd() < 0.5) ctx.fillRect(x + 1, top + 4, 1, 1 + Math.floor(rnd() * 2));
  });
};

/** A few whole blocks tumbling through the air (16px textures at 1x). */
const flyingBlocks = (ctx: CanvasRenderingContext2D, a: Assets, list: [string, number, number, number][]) =>
  list.forEach(([k, x, y, r]) => sprite(ctx, a, k, x, y, 1, {outline: 'rgba(30,30,31,0.55)', rot: r}));

/** White pixel sparkles (four-point), the vanilla glint recoloured. */
const sparkles = (ctx: CanvasRenderingContext2D, a: Assets, pts: [number, number, number][]) => pts.forEach(([x, y, s]) => sprite(ctx, a, 'glint', x, y, s, {color: SKY.white}));

// ---------------------------------------------------------------- shared DOM pieces

/** Minecraft-style text: white (or a colour) with a hard dark shadow one font pixel down-right. */
const McLine: FC<{size?: number; color?: string; style?: CSSProperties; children: ReactNode}> = ({size = TYPE.h1, color = SKY.white, style, children}) => {
  const p = size === TYPE.small ? 4 : size / 12;
  return (
    <OreText size={size} color={color} style={{textShadow: `${p}px ${p}px 0 rgba(30,30,31,0.55)`, ...style}}>
      {children}
    </OreText>
  );
};

// ---------------------------------------------------------------- 0: cold open

const HERO = {x: 1320, y: 500, slot: 120 * U};

const FrameStick: FC = () => {
  const g = useGfx();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!g) return;
      daySky(ctx);
      const hx = HERO.x / 4;
      const hy = HERO.y / 4;
      glow(ctx, hx, hy, 200, SKY.white, 0.55);
      ctx.globalCompositeOperation = 'lighter';
      sprite(ctx, g, 'sun', 92, 46, 3);
      ctx.globalCompositeOperation = 'source-over';
      rays(ctx, hx, hy, 16, 0.12, 0.3, hexA(SKY.white, 0.12));
      squareHalos(ctx, hx, hy, 4, HERO.slot / 4 + 16, 10, SKY.white, (i) => 0.85 - i * 0.18, 2);
      clouds(ctx, g, 18, 6, 140, 0.95);
      clouds(ctx, g, 150, 4, 60, 0.75);
      halftone(ctx, hexA(SKY.white, 0.5), 4, (x, y) => (y / LH) * 3.4 - 2.2 - Math.abs(x / LW - 0.5));
      meadow(ctx);
      sparkles(ctx, g, [
        [hx + 70, hy - 66, 2],
        [hx - 74, hy + 54, 1],
        [hx + 88, hy + 40, 1],
        [hx - 60, hy - 70, 1],
      ]);
    },
    [g],
  );
  return (
    <AbsoluteFill>
      <LowRes ready={!!g} draw={draw} />
      {/* The hero: the stick in a giant Ore slot. */}
      <div style={{position: 'absolute', left: HERO.x - HERO.slot / 2, top: HERO.y - HERO.slot / 2}}>
        <OreSlot size={HERO.slot} style={{boxShadow: `0 ${4 * U}px 0 rgba(30,30,31,0.35)`}}>
          <Img src={item('stick')} style={{width: 16 * 22, height: 16 * 22, imageRendering: 'pixelated'}} />
        </OreSlot>
        <div style={{position: 'absolute', right: 8 * U, bottom: 6 * U}}>
          <McLine size={TYPE.h1}>1</McLine>
        </div>
      </div>
      <div style={{position: 'absolute', left: HERO.x - HERO.slot / 2, top: HERO.y + HERO.slot / 2 + 8 * U, display: 'flex', gap: 2 * U}}>
        <OreChip dot={ORE.gold} color={ORE.text}>
          木棍
        </OreChip>
        <OreChip>一切装备的起点</OreChip>
      </div>
      <div style={{position: 'absolute', left: 32 * U, top: 64 * U, display: 'flex', flexDirection: 'column', gap: 4 * U}}>
        <div style={{display: 'flex', gap: 2 * U, marginBottom: 4 * U}}>
          <OreChip dot={ORE.greenLight} color={ORE.text}>
            EP.01
          </OreChip>
          <OreChip>如你所见</OreChip>
        </div>
        <McLine>这一切，</McLine>
        <div style={{display: 'flex'}}>
          <McLine>要从</McLine>
          <McLine color="#ffd36b">一根木棍</McLine>
        </div>
        <McLine>说起。</McLine>
      </div>
      <div style={{position: 'absolute', right: 24 * U, top: 20 * U}}>
        <OreChip color={ORE.text}>{CHANNEL}</OreChip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1: TNT hits the logo

const LOGO = {cx: 960, cy: 540, w: 1240};
const LOGO_TOP = LOGO.cy - (LOGO.w * 176) / 1024 / 2;
const TNT_AT = {x: 1090 / 4, y: LOGO_TOP / 4 - 34};

const FrameTnt: FC = () => {
  const g = useGfx();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!g) return;
      daySky(ctx, '#3584df');
      glow(ctx, TNT_AT.x, LOGO_TOP / 4, 220, SKY.white, 0.45);
      rays(ctx, TNT_AT.x, LOGO_TOP / 4, 18, 0.1, 0.32, hexA(SKY.white, 0.14));
      clouds(ctx, g, 6, 7, 40, 0.95);
      clouds(ctx, g, 168, 5, 210, 0.8);
      meadow(ctx);
      speedLines(ctx, TNT_AT.x - 36, TNT_AT.x + 36, 0, TNT_AT.y - 30, 24, 5, SKY.white);
    },
    [g],
  );
  const drawFx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!g) return;
      const hit = {x: TNT_AT.x, y: LOGO_TOP / 4 + 2};
      starburst(ctx, hit.x, hit.y, 22, 46, 11, 4, '#ffd36b', 0.55);
      starburst(ctx, hit.x, hit.y, 12, 26, 9, 7, SKY.white, 0.55);
      debris(ctx, hit.x, hit.y - 6, 70, 34, 30, 12);
      sprite(ctx, g, 'tnt', TNT_AT.x, TNT_AT.y, 5, {outline: SKY.shadow, shadow: 'rgba(30,30,31,0.3)', rot: 0.12});
      sparkles(ctx, g, [[TNT_AT.x - 6, TNT_AT.y - 46, 2]]);
    },
    [g],
  );
  return (
    <AbsoluteFill>
      <LowRes ready={!!g} draw={draw} />
      <Img src={tex('gui/title/minecraft.png')} style={{position: 'absolute', left: LOGO.cx - LOGO.w / 2, top: LOGO_TOP, width: LOGO.w, height: (LOGO.w * 256) / 1024, transform: 'scaleY(0.95)', transformOrigin: '50% 0', filter: `drop-shadow(0 ${4 * U}px 0 rgba(30,30,31,0.35))`}} />
      <LowRes ready={!!g} draw={drawFx} />
      {/* Ore fuse timer next to the falling TNT. */}
      <div style={{position: 'absolute', left: TNT_AT.x * 4 + 64 * U, top: TNT_AT.y * 4 - 30 * U}}>
        <OrePanel variant="panel" style={{padding: `${4 * U}px ${5 * U}px`, display: 'flex', flexDirection: 'column', gap: 3 * U}}>
          <div style={{display: 'flex', justifyContent: 'space-between', gap: 8 * U}}>
            <OreText size={TYPE.small}>引线</OreText>
            <OreText size={TYPE.small} color="#e25a5a">
              4.0 s
            </OreText>
          </div>
          <OreProgress value={0.62} width={84 * U} color="red" />
        </OrePanel>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2: title after the blast

const TITLE_Y = 448; // optical centre of the title; the light burst radiates from here

type TitleTheme = {face: string; edge: [string, string, string]; shade: string; block: BlockStyle};
const WARM_A: TitleTheme = {face: '#ffffff', edge: ['#f39a2b', '#d9761c', '#b85d12'], shade: 'rgba(150,70,10,0.28)', block: SKY_BLOCK};
const WARM_B: TitleTheme = {face: '#ffd34f', edge: ['#c4661a', '#9c4d12', '#7a3a0c'], shade: 'rgba(110,50,10,0.3)', block: GOLD_BLOCK};

/** Smaller lines: white blocks, dark outline, one step of orange extrusion. */
const SUB_BLOCK: BlockStyle = {face: ['#ffffff', '#ffffff', '#eef2f8'], bevelLight: '#ffffff', bevelDark: '#d4dce8', extrusion: ['#2b63cc'], outline: '#0c1f4d'};

const FrameTitle: FC<{theme: TitleTheme}> = ({theme}) => {
  const g = useGfx();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!g) return;
      const cx = LW / 2;
      const cy = TITLE_Y / 4;
      daySky(ctx);
      glow(ctx, cx, cy, 260, SKY.white, 0.75);
      rays(ctx, cx, cy, 20, 0.05, 0.36, hexA(SKY.white, 0.2));
      squareHalos(ctx, cx, cy, 6, 240, 22, SKY.white, (i) => 0.45 - i * 0.07, 2);
      clouds(ctx, g, 4, 7, 300, 0.9);
      meadow(ctx);
      // Blast smoke drifting off both ends of the title band.
      [
        ['boom7', 28, cy - 12],
        ['boom10', 58, cy + 22],
        ['boom12', LW - 32, cy + 2],
        ['boom7', LW - 62, cy - 28],
        ['boom10', LW - 22, cy + 36],
      ].forEach(([k, x, y]) => sprite(ctx, g, k as string, x as number, y as number, 2, {color: SKY.white, alpha: 0.85}));
      flyingBlocks(ctx, g, [
        ['stone', 96, 40, 0.3],
        ['cobble', 150, 196, -0.5],
        ['dirt', 330, 34, 0.7],
        ['grass', 392, 196, -0.2],
        ['cobble', 40, 196, 0.9],
        ['stone', 448, 44, -0.8],
      ]);
      sparkles(ctx, g, [
        [96, 70, 2],
        [380, 60, 1],
        [420, 200, 2],
        [70, 196, 1],
      ]);
    },
    [g],
  );
  return (
    <AbsoluteFill>
      <LowRes ready={!!g} draw={draw} />
      {/* The Minecraft logo has been pushed out by now; our title owns the frame. */}
      <div style={{position: 'absolute', top: 87 * U, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <BlockText text={TITLE} font={BLACK_FONT} rows={22} cell={6} depth={4} spacing={4} style={theme.block} />
      </div>
      <div style={{position: 'absolute', top: 151 * U, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 * U}}>
        <div style={{width: 20 * U, height: 2 * U, background: theme.block.outline, opacity: 0.8}} />
        <BlockText text="从零走完整条装备线" font={BLACK_FONT} rows={16} cell={3} depth={2} spacing={3} style={SUB_BLOCK} />
        <div style={{width: 20 * U, height: 2 * U, background: theme.block.outline, opacity: 0.8}} />
      </div>
      {/* Channel: avatar and name only. */}
      <div style={{position: 'absolute', top: 187 * U, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 * U}}>
        <div style={{boxShadow: `0 0 0 ${U}px ${theme.block.outline}, 0 0 0 ${2 * U}px #ffffff`}}>
          <PlayerFace size={14 * U} />
        </div>
        <BlockText text={CHANNEL} font={BLACK_FONT} rows={16} cell={3} depth={2} spacing={3} style={SUB_BLOCK} />
      </div>
      <div style={{position: 'absolute', top: 66 * U, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <Plate variant="destructive" small>
          <OreText size={TYPE.small}>EP.01</OreText>
        </Plate>
      </div>
    </AbsoluteFill>
  );
};

/** Ore button texture used as a label plate (bevel + thick bottom edge). */
const Plate: FC<{variant: 'hero' | 'secondary' | 'destructive' | 'neutral'; small?: boolean; children: ReactNode}> = ({variant, small, children}) => (
  <div style={{...nine(`button_${variant}`, [2, 2, 4, 2]), height: (small ? 16 : 24) * U, padding: `0 ${(small ? 4 : 8) * U}px`, display: 'flex', alignItems: 'center', gap: 4 * U}}>{children}</div>
);

/**
 * Official-campaign style title: chunky white pixel letters with a solid extrusion in the
 * background's own colour family (no black outline), like the brand's tagline cards.
 */
const BrandTitle: FC<{theme: TitleTheme; children: string}> = ({theme, children}) => {
  const size = TYPE.hero;
  const p = size / 12;
  // Faux bold (one font pixel to the right) closes the 1px gaps between strokes, then a deep-blue
  // outline and a two-step extrusion sit underneath.
  const ring = (dy: number, c: string) => [[-1, 0], [2, 0], [0, -1], [1, -1], [0, 1], [1, 1], [-1, -1], [2, -1], [-1, 1], [2, 1]].map(([x, y]) => `${x * p}px ${(y + dy) * p}px 0 ${c}`);
  const depth = [`${p}px 0 0 ${theme.face}`, ...ring(0, theme.edge[0]), ...ring(1, theme.edge[1]), ...ring(2, theme.edge[2]), `${p}px ${4 * p}px 0 ${theme.shade}`].join(',');
  return (
    <span style={{fontFamily: PIXEL_FONT, fontSize: size, lineHeight: `${size}px`, color: theme.face, letterSpacing: p, whiteSpace: 'pre', WebkitFontSmoothing: 'none', textShadow: depth}}>
      {children}
    </span>
  );
};

export const StyleFrames: FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: SKY.mid}}>
      {f === 0 && <FrameStick />}
      {f === 1 && <FrameTnt />}
      {f === 2 && <FrameTitle theme={WARM_A} />}
      {f === 3 && <FrameTitle theme={WARM_B} />}
    </AbsoluteFill>
  );
};
