/**
 * mcd-c-title-voxel-assemble - voxel logo assembly (trailer-ultimate-logo-voxel-assemble).
 * The title is built from real block textures (gold block family). Cubes fly in from all four sides, tumbling, and lock into the
 * glyph grid with a small squash; a light sweep runs across, the logo floats with a slight 3D sway (front + bottom + side faces
 * are lit separately), then the cubes fall away. Drawn as a 3D-projected canvas; face brightness comes from a single light.
 * Props: text, sub (small line), cube (max cube px), maxW, cjkRows, start (first launch frame), exit (frame the cubes fall away),
 *        bg (false = transparent Layer), seed, tint ('gold' | 'stone' | 'ember' chooses the block set).
 */
import {useEffect, useLayoutEffect, useMemo, useRef, useState, type FC} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {PxText} from '../mcdkit/kit';
import {useMask} from '../mcdkit/pxtext';
import {loadTextures, texCanvas, texesLoaded} from '../mcdscene/tex';
import {Dim, RiseSparks, TrailerBg, ramp, stepped} from './lib';

type M3 = number[];
const mmul = (a: M3, b: M3): M3 => [
  a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
  a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
  a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
];
const rotX = (a: number): M3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
const rotY = (b: number): M3 => [Math.cos(b), 0, Math.sin(b), 0, 1, 0, -Math.sin(b), 0, Math.cos(b)];
const rotZ = (c: number): M3 => [Math.cos(c), -Math.sin(c), 0, Math.sin(c), Math.cos(c), 0, 0, 0, 1];
const mv = (m: M3, v: number[]) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

type Face = {n: number[]; o: number[]; u: number[]; v: number[]; nb: [number, number] | null; k: number};
const DZ = 1.6;
const FACES: Face[] = [
  {n: [0, 0, -1], o: [-0.5, -0.5, -DZ / 2], u: [1, 0, 0], v: [0, 1, 0], nb: null, k: 0},
  {n: [0, 0, 1], o: [0.5, -0.5, DZ / 2], u: [-1, 0, 0], v: [0, 1, 0], nb: null, k: 1},
  {n: [0, -1, 0], o: [-0.5, -0.5, DZ / 2], u: [1, 0, 0], v: [0, 0, -DZ], nb: [0, -1], k: 2},
  {n: [0, 1, 0], o: [-0.5, 0.5, -DZ / 2], u: [1, 0, 0], v: [0, 0, DZ], nb: [0, 1], k: 3},
  {n: [-1, 0, 0], o: [-0.5, -0.5, DZ / 2], u: [0, 0, -DZ], v: [0, 1, 0], nb: [-1, 0], k: 4},
  {n: [1, 0, 0], o: [0.5, -0.5, -DZ / 2], u: [0, 0, DZ], v: [0, 1, 0], nb: [1, 0], k: 5},
];
const LIGHT = (() => {
  const l = [0.28, -0.5, -0.82];
  const n = Math.hypot(l[0], l[1], l[2]);
  return l.map((x) => x / n);
})();

const SETS = {
  gold: {main: ['block/gold_block', 'block/gold_block', 'block/gold_block', 'block/raw_gold_block', 'block/yellow_concrete'], glow: '255,166,0'},
  stone: {main: ['block/stone_bricks', 'block/stone', 'block/cobblestone', 'block/stone_bricks'], glow: '200,200,210'},
  ember: {main: ['block/orange_concrete', 'block/shroomlight', 'block/magma', 'block/orange_concrete', 'block/raw_copper_block'], glow: '255,110,30'},
} as const;
const DEBRIS = ['block/cobbled_deepslate', 'block/deepslate', 'block/stone', 'block/blackstone'];
const ALL_TEX = [...new Set([...Object.values(SETS).flatMap((s) => s.main), ...DEBRIS])];

const useTexReady = () => {
  const [ok, setOk] = useState(texesLoaded(ALL_TEX));
  useEffect(() => {
    if (ok) return;
    const h = delayRender('voxel textures');
    loadTextures(ALL_TEX)
      .then(() => {
        setOk(true);
        continueRender(h);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ok;
};

type Cube = {gx: number; gy: number; tex: string; dl: number; S: number[]; A0: number[]; fallDelay: number; fallSpin: number[]; fallVx: number; debris: boolean; size: number; end: number[]; rotV: number[]};

export const VoxelLogo: FC<{
  text?: string;
  sub?: string;
  cube?: number;
  maxW?: number;
  cjkRows?: number;
  start?: number;
  exit?: number;
  bg?: boolean;
  audio?: boolean;
  seed?: number;
  tint?: keyof typeof SETS;
  debris?: number;
}> = ({text = '地底迷城', sub = '方块拼合 · 第 1 季', cube = 26, maxW = 1560, cjkRows = 16, start = 6, exit = 150, bg = true, audio = true, seed = 7, tint = 'gold', debris = 14}) => {
  const f = useCurrentFrame();
  const ready = useTexReady();
  const m = useMask(text, {bold: 2, gap: 2, cjkRows, caps: true});
  const ref = useRef<HTMLCanvasElement>(null);
  const cs = m ? Math.max(6, Math.min(cube, Math.floor(maxW / m.w))) : cube;
  const set = SETS[tint];

  const cubes = useMemo<Cube[]>(() => {
    if (!m) return [];
    const rnd = mulberry32(seed);
    const list: Cube[] = [];
    for (let gy = 0; gy < m.h; gy++)
      for (let gx = 0; gx < m.w; gx++) {
        if (!m.on[gy * m.w + gx]) continue;
        const side = Math.floor(rnd() * 4);
        const dist = 1100 + rnd() * 900;
        const dir = [[-1, 0], [1, 0], [0, -1], [0, 1]][side];
        const tx = (gx + 0.5 - m.w / 2) * cs;
        const ty = (gy + 0.5 - m.capH / 2) * cs;
        const perp = [dir[1], dir[0]];
        const spread = (rnd() - 0.5) * 900;
        const S = [tx + dir[0] * dist + perp[0] * spread, ty + dir[1] * dist + perp[1] * spread, (rnd() - 0.3) * 700];
        const q = Math.PI / 2;
        const A0 = [Math.round((rnd() - 0.5) * 8) * q, Math.round((rnd() - 0.5) * 8) * q, Math.round((rnd() - 0.5) * 8) * q];
        list.push({
          gx, gy, tex: set.main[Math.floor(rnd() * set.main.length)], dl: rnd() * 24, S, A0,
          fallDelay: rnd() * 10 + (gx / m.w) * 6, fallSpin: [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.4], fallVx: (rnd() - 0.5) * 8,
          debris: false, size: 1, end: [0, 0, 0], rotV: [0, 0, 0],
        });
      }
    for (let i = 0; i < debris; i++) {
      const fromLeft = rnd() < 0.5;
      const y0 = (rnd() - 0.5) * 1100;
      list.push({
        gx: -1, gy: -1, tex: DEBRIS[Math.floor(rnd() * DEBRIS.length)], dl: rnd() * 40, S: [fromLeft ? -1300 : 1300, y0, (rnd() - 0.3) * 900], A0: [rnd() * 6, rnd() * 6, rnd() * 6],
        fallDelay: 0, fallSpin: [0, 0, 0], fallVx: 0, debris: true, size: 0.5 + rnd() * 1.0, end: [fromLeft ? 1300 : -1300, y0 + (rnd() - 0.5) * 500, 0], rotV: [(rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.1],
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, cs, seed, tint, debris]);

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || !m || !ready) return;
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1920, 1080);
    ctx.imageSmoothingEnabled = false;
    const FOC = 2600;
    const cx0 = 960;
    const cy0 = 520;
    const D = 30;
    const amp = ramp(f, start + 36, start + 76);
    const yaw = 0.19 * Math.sin(((f - start) / 150) * Math.PI * 2) * amp + 0.03;
    const pitch = -0.3 + 0.025 * Math.sin(((f - start) / 110) * Math.PI * 2) * amp;
    const Rg = mmul(rotY(yaw), rotX(pitch));
    const lockAll = start + 24 + D;
    const sweepT = ramp(f, lockAll + 6, lockAll + 40);
    const sweep2 = ramp(f, lockAll + 62, lockAll + 84);
    const key = (x: number, y: number) => y * 4096 + x;
    const state = new Map<number, boolean>();
    type Draw = {z: number; c: number[]; rot: M3; half: number; tex: string; cb: Cube; flash: number; sw: number; alpha: number; locked: boolean};
    const draws: Draw[] = [];
    cubes.forEach((cb) => {
      if (cb.debris) {
        const u = clamp01((f - start - cb.dl) / 130);
        if (u <= 0 || u >= 1) return;
        const t = u;
        const c = [cb.S[0] + (cb.end[0] - cb.S[0]) * t, cb.S[1] + (cb.end[1] - cb.S[1]) * t, cb.S[2]];
        const rt = f - start;
        const rot = mmul(mmul(rotZ(cb.A0[2] + cb.rotV[2] * rt), rotY(cb.A0[1] + cb.rotV[1] * rt)), rotX(cb.A0[0] + cb.rotV[0] * rt));
        const w = mv(Rg, c);
        draws.push({z: w[2], c: w, rot: mmul(Rg, rot), half: (cs * cb.size) / 2, tex: cb.tex, cb, flash: 0, sw: 0, alpha: Math.sin(t * Math.PI) * 0.95, locked: false});
        return;
      }
      const u = clamp01((f - start - cb.dl) / D);
      if (u <= 0) return;
      const e = EASE.out(u);
      const tx = (cb.gx + 0.5 - m.w / 2) * cs;
      const ty = (cb.gy + 0.5 - m.capH / 2) * cs;
      let c = [cb.S[0] + (tx - cb.S[0]) * e, cb.S[1] + (ty - cb.S[1]) * e, cb.S[2] * (1 - e)];
      const k = Math.pow(1 - e, 1.4);
      let rot = mmul(mmul(rotZ(cb.A0[2] * k), rotY(cb.A0[1] * k)), rotX(cb.A0[0] * k));
      const lockF = start + cb.dl + D;
      let pulse = 1;
      let flash = 0;
      let alpha = 1;
      if (f >= lockF) {
        const a = f - lockF;
        pulse = 1 + 0.16 * Math.max(0, 1 - a / 7) * Math.cos(a * 0.9);
        flash = Math.max(0, 1 - a / 5);
      }
      let locked = f >= lockF;
      if (f > exit + cb.fallDelay) {
        const t = f - exit - cb.fallDelay;
        locked = false;
        c = [c[0] + cb.fallVx * t, c[1] + 0.9 * t * t, c[2] - t * 6];
        rot = mmul(mmul(rotZ(cb.fallSpin[2] * t), rotY(cb.fallSpin[1] * t)), mmul(rotX(cb.fallSpin[0] * t), rot));
        alpha = clamp01(1 - t / 16);
        if (alpha <= 0) return;
      }
      state.set(key(cb.gx, cb.gy), locked);
      // light sweep
      const qn = (cb.gx / m.w) * 0.85 + (cb.gy / Math.max(1, m.h)) * 0.25;
      const s1 = Math.exp(-Math.pow((qn - (-0.15 + sweepT * 1.4)) / 0.075, 2)) * (sweepT > 0 && sweepT < 1 ? 1 : 0);
      const s2 = Math.exp(-Math.pow((qn - (-0.15 + sweep2 * 1.4)) / 0.06, 2)) * 0.55 * (sweep2 > 0 && sweep2 < 1 ? 1 : 0);
      const w = mv(Rg, c);
      draws.push({z: w[2], c: w, rot: mmul(Rg, rot), half: (cs * pulse) / 2, tex: cb.tex, cb, flash, sw: Math.max(s1, s2), alpha, locked});
    });
    draws.sort((a, b) => b.z - a.z);
    draws.forEach((d) => {
      const sp = FOC / (FOC + d.z);
      const sx = cx0 + d.c[0] * sp;
      const sy = cy0 + d.c[1] * sp;
      const h2 = d.half * 2 * sp;
      if (sx < -200 || sx > 2120 || sy < -200 || sy > 1280) return;
      ctx.globalAlpha = d.alpha;
      const texc = texCanvas(d.tex);
      FACES.forEach((fc) => {
        const n = mv(d.rot, fc.n);
        if (n[2] >= -0.02) return;
        if (fc.nb && !d.cb.debris && d.locked && state.get(key(d.cb.gx + fc.nb[0], d.cb.gy + fc.nb[1]))) return;
        const o = mv(d.rot, fc.o);
        const u = mv(d.rot, fc.u);
        const v = mv(d.rot, fc.v);
        const ox = sx + o[0] * h2;
        const oy = sy + o[1] * h2;
        const ux = u[0] * h2;
        const uy = u[1] * h2;
        const vx = v[0] * h2;
        const vy = v[1] * h2;
        ctx.setTransform(ux / texc.width, uy / texc.width, vx / texc.height, vy / texc.height, ox, oy);
        ctx.drawImage(texc, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        let b = 0.46 + 0.58 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        if (fc.k === 3) b *= 0.8;
        if (d.cb.debris) b *= 0.7;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + ux, oy + uy);
        ctx.lineTo(ox + ux + vx, oy + uy + vy);
        ctx.lineTo(ox + vx, oy + vy);
        ctx.closePath();
        if (b < 1) {
          ctx.fillStyle = `rgba(40,12,0,${(1 - b) * 0.9})`;
          ctx.fill();
        }
        if (d.sw > 0.02) {
          ctx.fillStyle = `rgba(255,246,200,${Math.min(0.85, d.sw * 0.8)})`;
          ctx.fill();
        }
        if (d.flash > 0) {
          ctx.fillStyle = `rgba(255,255,255,${d.flash * 0.45})`;
          ctx.fill();
        }
        ctx.lineWidth = Math.max(1, h2 / 12);
        ctx.strokeStyle = 'rgba(60,28,0,0.34)';
        ctx.beginPath();
        ctx.moveTo(ox + ux, oy + uy);
        ctx.lineTo(ox + ux + vx, oy + uy + vy);
        ctx.lineTo(ox + vx, oy + vy);
        ctx.stroke();
        if (fc.k === 0 || fc.k === 3 || fc.k === 4 || fc.k === 5) {
          ctx.strokeStyle = fc.k === 0 ? 'rgba(255,248,190,0.55)' : 'rgba(255,230,150,0.25)';
          ctx.beginPath();
          ctx.moveTo(ox + vx, oy + vy);
          ctx.lineTo(ox, oy);
          ctx.lineTo(ox + ux, oy + uy);
          ctx.stroke();
        }
      });
    });
    ctx.globalAlpha = 1;
  });

  const subA = stepped(ramp(f, start + 62, start + 74), 4) * (1 - stepped(ramp(f, exit - 4, exit + 8), 4));
  return (
    <AbsoluteFill>
      {audio && (
        <>
          {Array.from({length: 10}, (_, i) => (
            <Sfx key={i} at={start + 26 + i * 4} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.28} rate={0.8 + (i % 4) * 0.08} cut={20} />
          ))}
          <Sfx at={start + 24 + 30} src={reelSfx('impact-cine.mp3')} volume={0.5} />
          <Sfx at={start + 24 + 36} src={mcSound('random/orb')} volume={0.28} rate={1.25} />
          <Sfx at={exit} src={mcSound('dig/gravel1')} volume={0.4} />
        </>
      )}
      {bg && <TrailerBg />}
      {bg && <Dim kind="edges" a={0.5} size={0.45} />}
      <RiseSparks count={34} seed={12} area={[120, 120, 1680, 860]} alpha={0.55 * ramp(f, start + 20, start + 50) * (1 - ramp(f, exit, exit + 18))} />
      <canvas ref={ref} width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${26 + 18 * ramp(f, start + 40, start + 70)}px rgba(${set.glow},0.34))`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 770, display: 'flex', justifyContent: 'center', opacity: subA, transform: `translateY(${(1 - subA) * 10}px)`}}>
        <PxText text={sub} px={3} color="#E6D6A4" hi="#FFF2C8" shadowColor="#2A1600" />
      </div>
    </AbsoluteFill>
  );
};
