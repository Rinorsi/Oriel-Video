import {useCallback, useMemo, type CSSProperties, type FC} from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {block, sound, tex} from '../mc/assets';
import {BLACK_FONT} from '../mc/fonts';
import {EASE, clamp01, mulberry32} from '../mc/theme';
import {BlockChars, SKY_BLOCK, type BlockStyle} from '../mg/BlockText';
import {CycleBackdrop, DEFAULT_BLOCKS, type TimeOfDay} from '../mg/DayCycle';
import {loadGfx, sprite, type GfxAssets} from '../mg/Graphic';
import {LowRes, PX, snap, useAssets} from '../mg/LowRes';
import {OreText, PlayerFace, TYPE, U, nine} from '../mg/Ore';

/**
 * Episode intro, 5 s: two seconds of action, three of title.
 *   0-18   camera pulls back from the sky; the Minecraft logo slams down (14)
 *   24-46  the camera pushes in and tilts; a TNT drops onto the logo (42)
 *   46     it goes off on impact, on the music drop: the logo shatters into tiles, vanilla
 *          explosion sprites and flash, heavy shake; the camera punches out, blocks fly past the lens
 *   49-60  title letters slam in from in front of the camera, centre first
 *   62/66/72  EP plate, subtitle, channel; a light pass runs over the title; hold to 150
 *
 * Sounds are Minecraft's own. Music: "Cat Walk" (Arulo, Mixkit free licence), started so its
 * drop (29.55 s) lands on the explosion.
 */

export const INTRO_FRAMES = 150;

const TITLE = '优易库';
const SUBTITLE = '转场 · 特效 · 动画库';
const CHANNEL = '216 个 Minecraft 风格效果';

const E = 46; // explosion on the music drop
const T = {logoIn: 4, logoLand: 14, push: 24, tntIn: 30, tntLand: 42, title: 49, plate: 62, sub: 66, channel: 72, shine: 78};

const SUB_BLOCK: BlockStyle = {face: ['#ffffff', '#ffffff', '#eef2f8'], bevelLight: '#ffffff', bevelDark: '#d4dce8', extrusion: ['#2b63cc'], outline: '#0c1f4d'};

const LOGO = {w: 1240, cy: 452};
const LOGO_H = Math.round((LOGO.w * 176) / 1024);
const LOGO_IMG_H = Math.round((LOGO.w * 256) / 1024);
const LOGO_TOP = LOGO.cy - LOGO_H / 2;
const TNT = {size: 160, x: 1080};
const TNT_Y = LOGO_TOP - TNT.size / 2 + 12; // resting on the logo
const BLAST = {x: TNT.x, y: TNT_Y + 30};
const BURST: [number, number] = [240, 112];

const back = Easing.bezier(0.34, 1.56, 0.64, 1);
const prog = (f: number, a: number, d: number, e: (t: number) => number = EASE.out) => e(clamp01((f - a) / d));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const squash = (f: number, at: number, k = 1) => {
  if (f < at) return [1, 1];
  const sy = 1 + (interpolate(f, [at, at + 2, at + 5, at + 8], [0.84, 1.08, 0.98, 1], {extrapolateRight: 'clamp'}) - 1) * k;
  return [1 / Math.sqrt(sy), sy];
};

const jitter = (f: number, at: number, life: number, amp: number, seed = 300) => {
  const t = f - at;
  if (t < 0 || t > life) return [0, 0];
  const k = amp * Math.pow(1 - t / life, 1.5);
  const r = mulberry32(seed + f);
  return [(r() * 2 - 1) * k, (r() * 2 - 1) * k];
};

// ---------------------------------------------------------------- virtual camera

type Cam = {s: number; x: number; y: number; r: number; blur: number};

/** Camera as scale/offset/roll about the frame centre; offsets are where the camera looks (px). */
const camera = (f: number): Cam => {
  let s: number;
  let x = 0;
  let y = 0;
  let r = 0;
  let blur = 0;
  if (f < 18) {
    // Pull back from the sky.
    const p = prog(f, 0, 18, Easing.bezier(0.16, 1, 0.3, 1));
    s = lerp(1.9, 1, p);
    y = lerp(-260, 0, p);
    r = lerp(-5, 0, p);
    blur = (1 - p) * 6;
  } else if (f < T.push) {
    s = 1 + 0.025 * prog(f, T.logoLand, 4) * (1 - prog(f, 18, 6));
  } else if (f < E) {
    // Push in toward the TNT, tilting as tension builds.
    const p = prog(f, T.push, E - T.push, Easing.bezier(0.45, 0, 0.55, 1));
    s = lerp(1, 1.25, p);
    x = lerp(0, TNT.x - 960, p) * 0.8;
    y = lerp(0, TNT_Y - 540, p) * 0.6;
    r = lerp(0, 2.5, p);
  } else {
    // Punch out past rest, overshoot back, then a slow push through the hold.
    const p = prog(f, E, 16, Easing.bezier(0.2, 1.4, 0.4, 1));
    s = lerp(1.25, 0.92, prog(f, E, 5, EASE.out));
    s = lerp(s, 1, p);
    x = lerp((TNT.x - 960) * 0.8, 0, prog(f, E, 10));
    y = lerp((TNT_Y - 540) * 0.6, 0, prog(f, E, 10));
    r = lerp(2.5, 0, p) - 3 * Math.exp(-(f - E) / 4) * Math.sin((f - E) * 0.9);
    blur = Math.max(0, 5 - (f - E)) * 1.2;
    s *= 1 + 0.035 * prog(f, 62, INTRO_FRAMES - 62, (t) => t);
  }
  const [jx, jy] = jitter(f, E, 16, 26);
  const [lx, ly] = jitter(f, T.logoLand, 8, 10, 500);
  const [tx, ty] = jitter(f, T.tntLand, 6, 8, 700);
  return {s, x: x - jx - lx - tx, y: y - jy - ly - ty, r, blur};
};

/** CSS for a layer at depth k (0 = infinitely far, 1 = the action plane, >1 in front). */
const layer = (c: Cam, k: number): CSSProperties => {
  const s = 1 + (c.s - 1) * k;
  return {transform: `scale(${s}) rotate(${c.r * k}deg) translate(${-c.x * k}px, ${-c.y * k}px)`, transformOrigin: '960px 540px'};
};

// ---------------------------------------------------------------- logo, tiles, TNT

const COLS = 14;
const ROWS = 3;
type Tile = {c: number; r: number; vx: number; vy: number; w: number; d: number};
const TILES: Tile[] = (() => {
  const rnd = mulberry32(17);
  const out: Tile[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const cx = 960 - LOGO.w / 2 + ((c + 0.5) / COLS) * LOGO.w;
      const cy = LOGO_TOP + ((r + 0.5) / ROWS) * LOGO_H;
      const dx = cx - BLAST.x;
      const dy = cy - BLAST.y;
      const dist = Math.hypot(dx, dy) || 1;
      const sp = 26 + rnd() * 34 - dist * 0.012;
      out.push({c, r, vx: (dx / dist) * sp + (rnd() - 0.5) * 8, vy: (dy / dist) * sp - 10 - rnd() * 14, w: (rnd() - 0.5) * 40, d: Math.floor(dist / 160)});
    }
  return out;
})();

const Logo: FC<{f: number}> = ({f}) => {
  if (f >= E + 30) return null;
  const src = tex('gui/title/minecraft.png');
  const tw = LOGO.w / COLS;
  const th = LOGO_H / ROWS;
  if (f >= E) {
    // Shattered: every tile flies out from the blast with drag, gravity and spin.
    const t = f - E;
    const k = (1 - Math.pow(0.88, t)) / 0.12;
    return (
      <>
        {TILES.map((p, i) => {
          const x = 960 - LOGO.w / 2 + p.c * tw + p.vx * k;
          const y = LOGO_TOP + p.r * th + p.vy * k + 0.5 * 2.2 * t * t;
          const a = 1 - clamp01((t - 12) / 16);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, width: tw + 1, height: th + 1, overflow: 'hidden', transform: `rotate(${p.w * k * 0.4}deg) scale(${1 - t * 0.012})`, opacity: a}}>
              <Img src={src} style={{position: 'absolute', left: -p.c * tw, top: -p.r * th, width: LOGO.w, height: LOGO_IMG_H}} />
            </div>
          );
        })}
      </>
    );
  }
  if (f < T.logoIn) return null;
  const y = f < T.logoLand ? -700 * (1 - prog(f, T.logoIn, T.logoLand - T.logoIn, EASE.in)) : f < T.tntLand ? Math.sin(((f - T.logoLand) / 40) * Math.PI * 2) * 5 : 0;
  const [sx, sy] = f >= T.tntLand ? squash(f, T.tntLand, 0.4) : squash(f, T.logoLand);
  return (
    <div style={{position: 'absolute', left: 960 - LOGO.w / 2, top: LOGO_TOP, width: LOGO.w, height: LOGO_H, overflow: 'hidden', transform: `translateY(${snap(y)}px) scale(${sx}, ${sy})`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 12px 0 rgba(12,40,100,0.3))'}}>
      <Img src={src} style={{width: LOGO.w, height: LOGO_IMG_H, display: 'block'}} />
    </div>
  );
};

/** The TNT as a 2.5D block (front + top face), falling, landing, priming. */
const Tnt: FC<{f: number}> = ({f}) => {
  if (f < T.tntIn || f >= E) return null;
  const y = f < T.tntLand ? -900 * (1 - prog(f, T.tntIn, T.tntLand - T.tntIn, EASE.in)) : 0;
  const [sx, sy] = squash(f, T.tntLand);
  // It goes off on impact: one white flash and a quick swell in the frames before the blast.
  const lit = f >= T.tntLand + 1;
  const swell = 1 + 0.25 * prog(f, T.tntLand + 1, E - T.tntLand - 1, (t) => t * t);
  const S = TNT.size;
  const face = (src: string, style: CSSProperties) => <Img src={src} style={{position: 'absolute', imageRendering: 'pixelated', ...style}} />;
  return (
    <div style={{position: 'absolute', left: TNT.x - S / 2, top: TNT_Y - S / 2, width: S, height: S, transform: `translateY(${snap(y)}px) scale(${sx * swell}, ${sy * swell})`, transformOrigin: '50% 100%'}}>
      {/* Speed lines while falling. */}
      {f < T.tntLand &&
        [0.15, 0.4, 0.62, 0.85].map((k, i) => <div key={i} style={{position: 'absolute', left: k * S, bottom: S * 0.9, width: 2 * U, height: 220 + i * 40, background: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0))'}} />)}
      {face(block('tnt_top'), {left: S * 0.12, top: -S * 0.24, width: S, height: S * 0.3, transform: 'skewX(-24deg)', transformOrigin: '0 100%', filter: 'brightness(1.15)'})}
      {face(block('tnt_side'), {left: 0, top: 0, width: S, height: S, boxShadow: `0 0 0 ${U}px #2a0c08`})}
      {lit && <div style={{position: 'absolute', left: 0, top: 0, width: S, height: S, background: '#ffffff', opacity: 0.55}} />}
    </div>
  );
};

// ---------------------------------------------------------------- pixel FX (vanilla sprites)

const useFx = () =>
  useAssets<GfxAssets>('intro-fx', () =>
    loadGfx({
      ...Object.fromEntries(Array.from({length: 16}, (_, i) => [`ex${i}`, tex(`particle/explosion_${i}.png`)])),
      ...Object.fromEntries(Array.from({length: 8}, (_, i) => [`g${i}`, tex(`particle/generic_${i}.png`)])),
      flash: tex('particle/flash.png'),
    }),
  );

const drawFx = (ctx: CanvasRenderingContext2D, f: number, a: GfxAssets) => {
  const bx = BLAST.x / PX;
  const by = BLAST.y / PX;
  // Logo landing: dust poofs along its base and a ring.
  const u = f - T.logoLand;
  if (u >= 0 && u < 16) {
    const rnd = mulberry32(5);
    const base = (LOGO_TOP + LOGO_H) / PX;
    for (let i = 0; i < 16; i++) {
      const x0 = (960 - LOGO.w / 2) / PX + rnd() * (LOGO.w / PX);
      const fr = 7 - Math.min(7, Math.floor((u + rnd() * 3) / 2));
      sprite(ctx, a, `g${fr}`, x0 + (x0 < 240 ? -1 : 1) * u * 0.6, base - 2 - u * 0.3, 2, {color: '#ffffff', alpha: 0.9});
    }
  }
  // TNT landing puff.
  const v = f - T.tntLand;
  if (v >= 0 && v < 12) {
    const rnd = mulberry32(8);
    for (let i = 0; i < 8; i++) {
      const fr = 7 - Math.min(7, Math.floor((v + rnd() * 2) / 1.5));
      sprite(ctx, a, `g${fr}`, TNT.x / PX + (rnd() - 0.5) * 44 + (rnd() - 0.5) * v * 2, LOGO_TOP / PX - 2 - v * 0.4, 2, {color: '#ffffff', alpha: 0.85});
    }
  }
  // Explosion: staggered vanilla explosion sprites, flash, rings.
  const t = f - E;
  if (t >= 0 && t < 26) {
    const rnd = mulberry32(77);
    for (let i = 0; i < 22; i++) {
      const ang = rnd() * Math.PI * 2;
      const rr = rnd() * 70;
      const start = Math.floor(rnd() * 8);
      const fi = t - start;
      const size = rnd() < 0.4 ? 3 : 2;
      if (fi < 0 || fi > 15) continue;
      sprite(ctx, a, `ex${fi}`, bx + Math.cos(ang) * rr * 1.4, by + Math.sin(ang) * rr * 0.7, size, {alpha: 0.95});
    }
    if (t < 8) {
      ctx.globalCompositeOperation = 'lighter';
      sprite(ctx, a, 'flash', bx, by, 6, {alpha: 1 - t / 8});
      ctx.globalCompositeOperation = 'source-over';
    }
  }
};

// ---------------------------------------------------------------- text

const titleGlyph = (f: number) => (i: number): CSSProperties => {
  // Each letter flies in from in front of the lens (big, blurred) and slams onto the plane.
  const start = T.title + Math.abs(i - 4) * 1.4;
  const dur = 7;
  if (f < start) return {opacity: 0};
  const p = prog(f, start, dur, Easing.bezier(0.5, 0, 0.75, 0));
  const arrived = f >= start + dur;
  const sc = arrived ? 1 : lerp(3.2, 1, p);
  const [sx, sy] = arrived ? squash(f, start + dur) : [1, 1];
  const float = f > start + dur + 8 ? Math.sin(((f - start) / 50) * Math.PI * 2 + i * 0.6) * 4 : 0;
  const sweep = (f - T.shine) * 1.6 - i;
  const shine = sweep > 0 && sweep < 3 ? 1.45 : 1;
  const blur = arrived ? 0 : (1 - p) * 8;
  return {
    transform: `translateY(${snap(float)}px) scale(${sc * sx}, ${sc * sy})`,
    opacity: clamp01(p * 2.5),
    filter: [blur > 0.3 ? `blur(${blur}px)` : '', shine > 1 ? `brightness(${shine})` : ''].join(' ') || undefined,
  };
};

const riseGlyph = (f: number, at: number, step = 0.7) => (i: number): CSSProperties => {
  const p = prog(f, at + i * step, 6, back);
  if (p <= 0) return {opacity: 0};
  return {transform: `translateY(${snap((1 - p) * 8 * U)}px)`, opacity: clamp01(p * 3)};
};

const Lines: FC<{f: number}> = ({f}) => {
  const w = snap(20 * U * prog(f, T.sub, 7));
  const rule: CSSProperties = {width: w, height: U, background: '#ffffff', boxShadow: `0 ${U}px 0 #2b63cc`};
  return (
    <>
      <div style={{width: 20 * U, display: 'flex', justifyContent: 'flex-end'}}>
        <div style={rule} />
      </div>
      <BlockChars text={SUBTITLE} font={BLACK_FONT} rows={16} cell={3} depth={2} spacing={3} style={SUB_BLOCK} glyph={riseGlyph(f, T.sub + 2)} />
      <div style={{width: 20 * U}}>
        <div style={rule} />
      </div>
    </>
  );
};

const Plate: FC<{f: number}> = ({f}) => {
  const p = prog(f, T.plate, 7, back);
  if (p <= 0) return null;
  return (
    <div style={{...nine('button_destructive', [2, 2, 4, 2]), height: 16 * U, padding: `0 ${4 * U}px`, display: 'flex', alignItems: 'center', transform: `translateY(${snap((1 - p) * -8 * U)}px) scale(${p})`, opacity: clamp01(p * 2)}}>
      <OreText size={TYPE.small}>FX LIBRARY</OreText>
    </div>
  );
};

const Channel: FC<{f: number; text?: string}> = ({f, text = CHANNEL}) => {
  const p = prog(f, T.channel, 7, back);
  if (p <= 0) return null;
  return (
    <>
      <div style={{boxShadow: `0 0 0 ${U}px #0c1f4d, 0 0 0 ${2 * U}px #ffffff`, transform: `scale(${p}) rotate(${(1 - p) * -25}deg)`}}>
        <PlayerFace size={14 * U} />
      </div>
      <BlockChars text={text} font={BLACK_FONT} rows={16} cell={3} depth={2} spacing={3} style={SUB_BLOCK} glyph={riseGlyph(f, T.channel + 2, 1)} />
    </>
  );
};

/** Two big blocks thrown past the lens by the blast (foreground depth). */
const LensBlocks: FC<{f: number}> = ({f}) => {
  const t = f - E;
  if (t < 0 || t > 16) return null;
  const items: [string, number, number, number][] = [
    ['cobblestone', -1, -0.6, 1],
    ['dirt', 1, 0.5, -1],
  ];
  return (
    <>
      {items.map(([k, dx, dy, spin], i) => {
        const p = EASE.in(t / 16);
        const s = lerp(0.6, 7, p);
        const x = BLAST.x + dx * 1400 * p;
        const y = BLAST.y + dy * 900 * p;
        return <Img key={i} src={block(k)} style={{position: 'absolute', left: x - 32 * s, top: y - 32 * s, width: 64 * s, height: 64 * s, imageRendering: 'pixelated', transform: `rotate(${spin * t * 9}deg)`, filter: `blur(${p * 10}px) drop-shadow(0 0 0 #000)`}} />;
      })}
    </>
  );
};

// ---------------------------------------------------------------- composition

const centred = (top: number): CSSProperties => ({position: 'absolute', top, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 * U});

export const YouyikuIntro: FC<{time?: TimeOfDay; channel?: string}> = ({time = 'noon', channel}) => {
  const f = useCurrentFrame();
  const fx = useFx();
  const cam = camera(f);
  const blocks = useMemo(() => {
    if (f < E) return [];
    const p = prog(f, E, 14);
    return DEFAULT_BLOCKS.map(([k, x, y, r], i) => [k, BLAST.x / PX + (x - BLAST.x / PX) * p, BLAST.y / PX + (y - BLAST.y / PX) * p, r + (1 - p) * (i % 2 ? 7 : -7)] as [string, number, number, number]);
  }, [f]);
  const options = useMemo(() => ({burst: BURST, blocks}), [blocks]);
  const draw = useCallback((ctx: CanvasRenderingContext2D) => fx && drawFx(ctx, f, fx), [f, fx]);
  const white = f < 4 ? 1 - f / 4 : f >= E && f < E + 3 ? 0.65 * (1 - (f - E) / 3) : 0;
  return (
    <AbsoluteFill style={{background: '#eaf8ff', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: cam.blur > 0.3 ? `blur(${cam.blur}px)` : undefined}}>
        <AbsoluteFill style={layer(cam, 0.45)}>
          <AbsoluteFill style={{transform: 'scale(1.12)'}}>
            <CycleBackdrop time={time} options={options} />
          </AbsoluteFill>
        </AbsoluteFill>
        <AbsoluteFill style={layer(cam, 1)}>
          <Logo f={f} />
          <Tnt f={f} />
          <LowRes ready={!!fx} draw={draw} />
          <div style={centred(66 * U)}>
            <Plate f={f} />
          </div>
          <div style={centred(87 * U)}>
            <BlockChars text={TITLE} font={BLACK_FONT} rows={22} cell={8} depth={5} spacing={8} style={SKY_BLOCK} glyph={titleGlyph(f)} />
          </div>
          <div style={{...centred(151 * U), gap: 5 * U}}>
            <Lines f={f} />
          </div>
          <div style={centred(187 * U)}>
            <Channel f={f} text={channel} />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={layer(cam, 1.4)}>
          <LensBlocks f={f} />
        </AbsoluteFill>
      </AbsoluteFill>
      {white > 0 && <AbsoluteFill style={{background: '#ffffff', opacity: white}} />}

      <Audio src={staticFile('audio/bgm/cat-walk.mp3')} startFrom={Math.round((29.55 - E / 30) * 30)} volume={(fr) => 0.6 * Math.min(1, fr / 6) * (1 - clamp01((fr - (INTRO_FRAMES - 15)) / 15))} />
      <Sfx at={T.logoLand} src={sound('random/anvil_land')} volume={0.5} />
      <Sfx at={T.logoLand} src={sound('dig/stone3')} volume={0.5} rate={0.7} />
      <Sfx at={T.tntLand} src={sound('dig/stone2')} volume={0.9} rate={0.6} />
      <Sfx at={T.tntLand} src={sound('fire/ignite')} volume={0.6} />
      <Sfx at={E} src={sound('random/explode1')} volume={0.6} />
      <Sfx at={E + 1} src={sound('random/explode3')} volume={0.4} rate={0.85} />
      {[0, 2, 4, 6].map((d, i) => (
        <Sfx key={d} at={T.title + 7 + d} src={sound(`dig/stone${i + 1}`)} volume={0.35} rate={1.1 + i * 0.05} />
      ))}
      <Sfx at={T.plate} src={sound('random/pop')} volume={0.45} />
      <Sfx at={T.sub} src={sound('random/click')} volume={0.35} />
      <Sfx at={T.channel} src={sound('random/levelup')} volume={0.3} rate={1.1} />
    </AbsoluteFill>
  );
};

const Sfx: FC<{at: number; src: string; volume?: number; rate?: number; cut?: number}> = ({at, src, volume = 1, rate = 1, cut}) => (
  <Sequence from={at} durationInFrames={cut}>
    <Audio src={src} volume={volume} playbackRate={rate} />
  </Sequence>
);
