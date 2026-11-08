// mcd3 light layers: god rays (+dust), dust motes, hurt vignette, tilt-shift.
//   <GodRays loop strength n angle />        screen   : slanted gold shafts (#e2ae4b), slow sway, dust motes riding inside them
//   <DustMotes loop strength />              screen   : three depth bands of floating squares + hexagon bokeh in the foreground
//   <HurtVignette loop hp hitAt />           normal   : crimson edge vignette that beats like a heart (low-health-red-vignette.png)
//   <TiltShift>{footage}</TiltShift>         wrapper  : real top/bottom blur (backdrop-filter) + haze; <TiltHaze/> is the exportable overlay half
import type {CSSProperties, FC, ReactNode} from 'react';
import {FxLayer} from '../mcdscene/engine';
import {h2, h3} from '../mcdscene/rng';
import {H, W, TAU, baked, glow, hex, ph, rgba, sstep} from './lib';

// ---------------------------------------------------------------------------------------------------------------------
// god rays

const SHAFT_W = 360;
const SHAFT_H = 1700;
/** One soft shaft sprite: bright at the top, fading along its length, soft sides. White-gold; tinted by the caller. */
const shaft = (core: string) =>
  baked(`shaft|${core}`, SHAFT_W, SHAFT_H, (g) => {
    const hz = g.createLinearGradient(0, 0, SHAFT_W, 0);
    const c = hex(core);
    hz.addColorStop(0, rgba(c, 0));
    hz.addColorStop(0.2, rgba(c, 0.35));
    hz.addColorStop(0.42, rgba(c, 0.95));
    hz.addColorStop(0.58, rgba(c, 0.95));
    hz.addColorStop(0.8, rgba(c, 0.35));
    hz.addColorStop(1, rgba(c, 0));
    g.fillStyle = hz;
    g.fillRect(0, 0, SHAFT_W, SHAFT_H);
    g.globalCompositeOperation = 'destination-in';
    const vz = g.createLinearGradient(0, 0, 0, SHAFT_H);
    vz.addColorStop(0, 'rgba(0,0,0,0.85)');
    vz.addColorStop(0.12, 'rgba(0,0,0,1)');
    vz.addColorStop(0.5, 'rgba(0,0,0,0.5)');
    vz.addColorStop(0.82, 'rgba(0,0,0,0.14)');
    vz.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = vz;
    g.fillRect(0, 0, SHAFT_W, SHAFT_H);
  });

export const GodRays: FC<{loop: number; strength?: number; n?: number; angle?: number; color?: string; dust?: boolean}> = ({loop, strength = 1, n = 6, angle = 15, color = '#e2ae4b', dust = true}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const t = ph(v.frame, loop);
      const spr = shaft(color);
      const hot = shaft('#ffe6a8');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const shafts: {x: number; w: number; a: number; len: number; ang: number}[] = [];
      for (let i = 0; i < n; i++) {
        const base = (i + 0.35 + h2(i, 1, 5) * 0.4) / n;
        const x = base * W * 1.3 - W * 0.12 + Math.sin((t + i * 0.19) * TAU) * 26;
        const w = W * (0.09 + h2(i, 2, 5) * 0.09);
        const ang = angle + Math.sin((t + h2(i, 3, 5)) * TAU) * 1.4 + (h2(i, 4, 5) - 0.5) * 3;
        const a = (0.42 + h2(i, 5, 5) * 0.4) * (0.8 + 0.2 * Math.sin((t * (1 + (i % 2)) + h2(i, 6, 5)) * TAU)) * strength;
        const len = H * (1.0 + h2(i, 7, 5) * 0.35);
        shafts.push({x, w, a, len, ang});
        ctx.save();
        ctx.translate(x, -H * 0.1);
        ctx.rotate((-ang * Math.PI) / 180);
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(spr, -w / 2, 0, w, len * 1.15);
        ctx.globalAlpha = Math.min(1, a * 0.5);
        ctx.drawImage(hot, -w * 0.22, 0, w * 0.44, len * 0.85);
        ctx.restore();
      }
      // light source bloom, top-left (the game's key-light direction)
      glow(ctx, W * 0.05, -H * 0.04, W * 0.34, hex('#ffd68a'), 0.42 * strength);
      glow(ctx, W * 0.05, -H * 0.04, W * 0.12, hex('#fff2c8'), 0.5 * strength);
      ctx.restore();
      if (dust) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const per = 12;
        shafts.forEach((s, i) => {
          for (let k = 0; k < per; k++) {
            const sd = h3(i, k, 1, 61);
            const so = h3(i, k, 2, 62);
            const cy = 1 + ((i + k) % 2);
            const u = (sd * 0.85 + Math.sin((t * cy + sd) * TAU) * 0.02 + 0.04) * s.len;
            const o = (so - 0.5) * s.w * 0.7 + Math.sin((t * cy + so * 3) * TAU) * 14;
            const rad = (s.ang * Math.PI) / 180;
            const px = s.x + Math.sin(rad) * u + Math.cos(rad) * o;
            const py = -H * 0.1 + Math.cos(rad) * u - Math.sin(rad) * o;
            const q = 4 + Math.floor(h3(i, k, 3, 63) * 3) * 2;
            ctx.globalAlpha = Math.min(1, (0.35 + 0.65 * Math.abs(Math.sin((t * 2 + so * 5) * TAU))) * 0.9 * Math.min(1, s.a * 3) * strength);
            ctx.fillStyle = k % 3 === 0 ? '#fff6d0' : '#f6d98a';
            ctx.fillRect(Math.round(px / 2) * 2, Math.round(py / 2) * 2, q, q);
          }
        });
        ctx.restore();
      }
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// dust motes

const hexPath = (g: CanvasRenderingContext2D, r: number) => {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.closePath();
};

/** Soft hexagon bokeh sprite (filled disc-ish hexagon with a brighter rim, no hard ring). */
const bokeh = (c: string) =>
  baked(`bokeh|${c}`, 96, 96, (g) => {
    g.translate(48, 48);
    const col = hex(c);
    hexPath(g, 38);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 40);
    rg.addColorStop(0, rgba(col, 0.6));
    rg.addColorStop(0.7, rgba(col, 0.68));
    rg.addColorStop(1, rgba(col, 0.8));
    g.fillStyle = rg;
    g.fill();
  });

export const DustMotes: FC<{loop: number; strength?: number; color?: string}> = ({loop, strength = 1, color = '#f6d98a'}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const t = ph(v.frame, loop);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = hex(color);
      // three depth bands of squares. Every mote lives exactly one loop (fade in -> drift -> fade out), so the loop is seamless.
      const bands = [
        {n: 110, q: 6, dx: -90, dy: -60, amp: 22, a: 0.75, seed: 1},
        {n: 60, q: 10, dx: -170, dy: -110, amp: 36, a: 0.95, seed: 2},
        {n: 24, q: 16, dx: -300, dy: -190, amp: 60, a: 0.9, seed: 3},
      ];
      for (const b of bands) {
        for (let i = 0; i < b.n; i++) {
          const a = (((t + h3(i, 1, b.seed, 71)) % 1) + 1) % 1;
          const bx = h3(i, 2, b.seed, 72) * (W + 200) - 100;
          const by = h3(i, 3, b.seed, 73) * (H + 200) - 100;
          const tw = h3(i, 4, b.seed, 74);
          const px = bx + (a - 0.5) * b.dx + Math.sin((t * (1 + (i % 2)) + tw) * TAU) * b.amp;
          const py = by + (a - 0.5) * b.dy + Math.cos((t * 2 + tw * 3) * TAU) * b.amp * 0.5;
          const env = Math.sin(Math.PI * a);
          const flick = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin((t * 3 + tw * 7) * Math.PI)), 1.4);
          const al = b.a * env * flick * strength;
          if (al < 0.02) continue;
          const x = Math.round(px / 2) * 2;
          const y = Math.round(py / 2) * 2;
          ctx.globalAlpha = Math.min(1, al);
          ctx.fillStyle = rgba(col.map((c) => Math.min(255, c + 26 * tw)));
          ctx.fillRect(x, y, b.q, b.q);
          if (b.q >= 10) glow(ctx, x + b.q / 2, y + b.q / 2, b.q * 4.5, col, 0.2 * al);
        }
      }
      // foreground hexagon bokeh: big, soft, slow
      const bk = bokeh(color);
      for (let i = 0; i < 9; i++) {
        const a = (((t + h3(i, 1, 9, 81)) % 1) + 1) % 1;
        const sz = 80 + h3(i, 3, 9, 83) * 150;
        const px = h3(i, 2, 9, 82) * (W + 200) - 100 + (a - 0.5) * -200;
        const py = h3(i, 5, 9, 85) * (H + 200) - 100 + (a - 0.5) * -120;
        ctx.globalAlpha = Math.sin(Math.PI * a) * 0.2 * strength;
        ctx.drawImage(bk, px - sz / 2, py - sz / 2, sz, sz);
      }
      ctx.restore();
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// hurt vignette

/** 0..1 heartbeat envelope, two thumps per beat (lub-dub). `p` is the phase inside one beat 0..1. */
export const heartbeat = (p: number) => {
  const thump = (c: number, w: number) => Math.exp(-Math.pow((p - c) / w, 2));
  return Math.min(1, thump(0.08, 0.055) + 0.7 * thump(0.3, 0.06));
};

export const HurtVignette: FC<{loop: number; hp?: number; beats?: number; hitAt?: number; color?: string}> = ({loop, hp = 0.85, beats = 3, hitAt, color = '#b02636'}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const c = hex(color);
      const beat = heartbeat(ph(v.frame, loop, beats));
      let hit = 0;
      if (hitAt !== undefined) {
        const age = v.frame - hitAt;
        hit = age < 0 ? 0 : Math.exp(-age / 6) * (age < 2 ? 0.6 + 0.2 * age : 1);
      }
      const k = Math.min(1, hp * (0.62 + 0.38 * beat) + hit);
      const inner = 0.3 - 0.12 * k; // clear core radius as a fraction of the vignette radius
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(W / H, 1);
      const R = H * 0.86;
      const g = ctx.createRadialGradient(0, 0, R * inner, 0, 0, R);
      g.addColorStop(0, rgba(c, 0));
      g.addColorStop(0.3, rgba(c, 0.2 * k));
      g.addColorStop(0.58, rgba(c, 0.62 * k));
      g.addColorStop(1, rgba(c, 1.0 * Math.min(1, k * 1.1)));
      ctx.fillStyle = g;
      ctx.fillRect(-R * 2, -R, R * 4, R * 2);
      ctx.restore();
      // flat band along all four edges so the frame itself reads red, not just the corners
      const band = 150 + 60 * k;
      for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [
        [0, 0, 0, band, 0, 0, W, band],
        [0, H, 0, H - band, 0, H - band, W, band],
        [0, 0, band, 0, 0, 0, band, H],
        [W, 0, W - band, 0, W - band, 0, band, H],
      ] as number[][]) {
        const bg = ctx.createLinearGradient(x0, y0, x1, y1);
        bg.addColorStop(0, rgba(c, 0.5 * k));
        bg.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = bg;
        ctx.fillRect(rx, ry, rw, rh);
      }
      // a darker blood core hugging the very edge
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(W / H, 1);
      const R2 = H * 0.98;
      const g2 = ctx.createRadialGradient(0, 0, R2 * 0.55, 0, 0, R2);
      g2.addColorStop(0, 'rgba(40,0,6,0)');
      g2.addColorStop(1, `rgba(40,0,6,${0.55 * k})`);
      ctx.fillStyle = g2;
      ctx.fillRect(-R2 * 2, -R2, R2 * 4, R2 * 2);
      ctx.restore();
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------------
// tilt-shift

/** Exportable half of the tilt-shift: cool atmospheric haze + soft vignette at the top and bottom edges (normal blend, alpha). */
export const TiltHaze: FC<{loop: number; strength?: number; color?: string}> = ({loop, strength = 1, color = '#9fb6c8'}) => (
  <FxLayer
    loop={loop}
    draw={(ctx, v) => {
      const t = ph(v.frame, loop);
      const c = hex(color);
      const br = 0.94 + 0.06 * Math.sin(t * TAU);
      const tg = ctx.createLinearGradient(0, 0, 0, H * 0.26);
      tg.addColorStop(0, rgba(c, 0.55 * strength * br));
      tg.addColorStop(0.5, rgba(c, 0.2 * strength * br));
      tg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, W, H * 0.26);
      const bg = ctx.createLinearGradient(0, H * 0.78, 0, H);
      bg.addColorStop(0, rgba(c, 0));
      bg.addColorStop(0.55, rgba(c, 0.22 * strength * br));
      bg.addColorStop(1, rgba(c, 0.6 * strength * br));
      ctx.fillStyle = bg;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);
      // soft vignette
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(W / H, 1);
      const R = H * 0.95;
      const vg = ctx.createRadialGradient(0, 0, R * 0.45, 0, 0, R);
      vg.addColorStop(0, 'rgba(6,10,20,0)');
      vg.addColorStop(1, `rgba(6,10,20,${0.5 * strength})`);
      ctx.fillStyle = vg;
      ctx.fillRect(-R * 2, -R, R * 4, R * 2);
      ctx.restore();
    }}
  />
);

/**
 * Real shallow depth of field for footage inside Remotion: blurred bands at the top and bottom (backdrop-filter masked by a gradient)
 * that grow in blur towards the frame edge, with the haze overlay on top. Keep the middle band sharp.
 */
export const TiltShift: FC<{children: ReactNode; loop: number; blur?: number; top?: number; bottom?: number; strength?: number}> = ({children, loop, blur = 7, top = 0.26, bottom = 0.24, strength = 1}) => {
  const band = (px: number, h: number, flip: boolean): CSSProperties => ({
    position: 'absolute',
    left: 0,
    right: 0,
    [flip ? 'bottom' : 'top']: 0,
    height: `${h * 100}%`,
    backdropFilter: `blur(${px}px)`,
    WebkitBackdropFilter: `blur(${px}px)`,
    WebkitMaskImage: `linear-gradient(${flip ? 'to top' : 'to bottom'}, #000 0%, rgba(0,0,0,0.8) 35%, transparent 100%)`,
    maskImage: `linear-gradient(${flip ? 'to top' : 'to bottom'}, #000 0%, rgba(0,0,0,0.8) 35%, transparent 100%)`,
  });
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {children}
      <div style={band(blur, top, false)} />
      <div style={band(blur * 0.5, top * 0.62, false)} />
      <div style={band(blur, bottom, true)} />
      <div style={band(blur * 0.5, bottom * 0.62, true)} />
      <div style={{position: 'absolute', inset: 0}}>
        <TiltHaze loop={loop} strength={strength} />
      </div>
    </div>
  );
};

void sstep;
