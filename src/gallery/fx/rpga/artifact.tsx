import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {HpBar, Plus} from './bars';
import {Face, Bold, Beam, Burst, C, DSlot, DungeonBg, EASE, Flash, Frame, Glint, Item, Label, MobFigure, Shake, clamp01, jiggle, lerp, mulberry32, prog, snap} from './common';

/**
 * rpg-artifact-cooldown: three artifacts on the HUD. Using one presses the slot and triggers its effect in the world
 * (fire rocket / healing totem / lightning); a pixel-block cooldown mask then sweeps away diagonally (no radial sweep) with a
 * seconds counter, and when the artifact is ready again the slot flashes, bounces and glints.
 * Props: `bg` - dungeon + fighters (Demo); Layer = HUD bar only.
 * Edit ARTS (id, name, key, use frames, cooldown frames).
 */

export const ARTIFACT_FRAMES = 190;

type Art = {id: string; name: string; key: string; color: string; uses: number[]; cd: number};
const ARTS: Art[] = [
  {id: 'firework_rocket', name: '烟火箭', key: 'Q', color: '#ff8a3a', uses: [24, 112], cd: 56},
  {id: 'totem_of_undying', name: '生命图腾', key: 'E', color: '#6bff8a', uses: [52], cd: 76},
  {id: 'blaze_rod', name: '闪电杖', key: 'R', color: '#8fd8ff', uses: [80], cd: 60},
];
const HUD_X = 960;
const SLOT = 168;
const SPACING = 270;
const slotC = (i: number): [number, number] => [HUD_X + (i - 1) * SPACING, 918];
const HERO_X = 480;
const FEET = 790;
const S = 13;
const FOES = [
  {kind: 'zombie' as const, x: 1090},
  {kind: 'zombie' as const, x: 1350},
  {kind: 'skeleton' as const, x: 1600},
];

/** state of artifact i at frame f: { cd: 0..1 progress of the cooldown (1 = ready), since: frames since ready, pressed } */
const stateOf = (a: Art, f: number) => {
  let last = -1;
  for (const u of a.uses) if (f >= u) last = u;
  if (last < 0) return {cd: 1, ready: -1, pressed: 0, used: -1};
  const p = (f - last) / a.cd;
  return {cd: clamp01(p), ready: p >= 1 ? last + a.cd : -1, pressed: f - last < 5 ? 1 - (f - last) / 5 : 0, used: last};
};

const Mask: FC<{p: number; size: number}> = ({p, size}) => {
  const N = 8;
  const c = size / N;
  const r = mulberry32(77);
  const jit = Array.from({length: N * N}, () => r());
  return (
    <>
      {Array.from({length: N * N}, (_, k) => {
        const row = Math.floor(k / N);
        const col = k % N;
        const order = ((row + col) / (2 * N - 2)) * 0.86 + jit[k] * 0.14;
        if (order <= p) return null;
        return <div key={k} style={{position: 'absolute', left: col * c, top: row * c, width: c + 0.5, height: c + 0.5, background: 'rgba(8,5,3,.76)', boxShadow: order < p + 0.1 ? 'inset 0 0 0 3px rgba(255,255,255,.22)' : undefined}} />;
      })}
    </>
  );
};

const ArtSlot: FC<{a: Art; i: number; f: number}> = ({a, i, f}) => {
  const st = stateOf(a, f);
  const since = st.ready >= 0 ? f - st.ready : 99;
  const cooling = st.used >= 0 && st.cd < 1;
  const secs = ((1 - st.cd) * a.cd) / 30;
  const pop = prog(f, 4 + i * 4, 12, EASE.back);
  const bounce = since < 14 ? 1 + 0.2 * jiggle(since / 14, 2, 3) : 1;
  const press = st.pressed > 0 ? 1 - 0.08 * st.pressed : 1;
  const readyFlash = since < 12 ? 1 - since / 12 : 0;
  const [x, y] = slotC(i);
  return (
    <div style={{position: 'absolute', left: x - SLOT / 2, top: y - SLOT / 2 - 18 + 8, width: SLOT, transform: `scale(${pop * bounce * press})`, opacity: clamp01(pop * 2)}}>
      <div style={{position: 'relative', width: SLOT, height: SLOT}}>
        <DSlot size={SLOT} edge={cooling ? '#6a5538' : a.color} glow={cooling ? 0 : 0.6 + readyFlash}>
          <div style={{filter: cooling ? 'grayscale(0.6) brightness(0.7)' : `drop-shadow(0 0 12px ${a.color})`}}>
            <Item id={a.id} size={112} />
          </div>
        </DSlot>
        {cooling && (
          <div style={{position: 'absolute', inset: 4, overflow: 'hidden'}}>
            <Mask p={st.cd} size={SLOT - 8} />
          </div>
        )}
        {cooling && (
          <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <Bold size={56} color="#fff">
              {secs.toFixed(1)}
            </Bold>
          </div>
        )}
        {readyFlash > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(255,248,220,${0.65 * readyFlash})`}} />}
        {since >= 0 && since < 16 && (
          <div style={{position: 'absolute', inset: 4, overflow: 'hidden'}}>
            <div style={{position: 'absolute', top: -20, left: -80 + since * 24, width: 44, height: SLOT + 40, background: 'rgba(255,255,255,.7)', transform: 'skewX(-20deg)'}} />
          </div>
        )}
        <div style={{position: 'absolute', left: -14, top: -14, width: 48, height: 48, background: '#1b120b', border: `4px solid ${C.gold1}`, boxShadow: `0 0 0 3px ${C.ink}`, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <Label size={24} color={C.gold3}>
            {a.key}
          </Label>
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
        <Label size={24} color={cooling ? '#8a7a62' : '#e6d8b8'}>
          {a.name}
        </Label>
      </div>
      {st.ready >= 0 && <Glint x={SLOT / 2} y={SLOT / 2} t={since / 16} size={110} color="#fff6d8" />}
    </div>
  );
};

const Bolt: FC<{at: number; x: number; yEnd: number}> = ({at, x, yEnd}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 9) return null;
  const r = mulberry32(900 + Math.floor(f / 2) + at);
  const segs = 14;
  let cx = x;
  const pts: [number, number][] = [[cx, -20]];
  for (let i = 1; i <= segs; i++) {
    cx = i === segs ? x : x + (r() - 0.5) * 120;
    pts.push([cx, lerp(-20, yEnd, i / segs)]);
  }
  const fade = 1 - clamp01((f - 4) / 5);
  return (
    <>
      {pts.slice(0, -1).map(([x0, y0], i) => {
        const [x1, y1] = pts[i + 1];
        const steps = 6;
        return Array.from({length: steps}, (_, k) => {
          const t = k / steps;
          const px = lerp(x0, x1, t);
          const py = lerp(y0, y1, t);
          return (
            <div key={`${i}-${k}`}>
              <div style={{position: 'absolute', left: snap(px - 20, 4), top: snap(py - 20, 4), width: 40, height: 40, background: 'rgba(143,216,255,.45)', opacity: fade, mixBlendMode: 'screen'}} />
              <div style={{position: 'absolute', left: snap(px - 8, 4), top: snap(py - 8, 4), width: 16, height: 16, background: '#fff', opacity: fade, boxShadow: '0 0 20px #8fd8ff'}} />
            </div>
          );
        });
      })}
    </>
  );
};

const Rocket: FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame() - at;
  const T = 14;
  if (f < 0 || f > T + 2) return null;
  const t = clamp01(f / T);
  const x0 = HERO_X + 120;
  const y0 = FEET - 20 * S;
  const x1 = FOES[0].x - 40;
  const y1 = FEET - 14 * S;
  const e = EASE.in(t);
  const x = lerp(x0, x1, e);
  const y = lerp(y0, y1, e) - Math.sin(t * Math.PI) * 60;
  return (
    <>
      {Array.from({length: 10}, (_, k) => {
        const tt = Math.max(0, t - k * 0.03);
        const ee = EASE.in(tt);
        const px = lerp(x0, x1, ee);
        const py = lerp(y0, y1, ee) - Math.sin(tt * Math.PI) * 60;
        return <div key={k} style={{position: 'absolute', left: snap(px - 8 + (k % 3) * 3, 2), top: snap(py - 8 + ((k * 7) % 5), 2), width: 16 - k, height: 16 - k, background: k < 3 ? '#fff6c8' : k < 6 ? '#ffb347' : '#ff6a1f', opacity: 1 - k / 11}} />;
      })}
      <div style={{position: 'absolute', left: x - 44, top: y - 44, width: 88, height: 88, transform: 'rotate(45deg)', filter: 'drop-shadow(0 0 12px #ff8a3a)'}}>
        <Item id="firework_rocket" size={88} />
      </div>
    </>
  );
};

const Scene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const shakeAt = [24 + 14, 80 + 3];
  const hudIn = prog(f, 0, 14, EASE.out);
  const hp = 0.62 + 0.3 * prog(f, 52, 24, EASE.inOut) - 0.0;
  const hurtOf = (i: number) => {
    const hits = i === 0 ? [38, 126] : i === 2 ? [83] : [];
    let h = 0;
    for (const a of hits) if (f >= a && f < a + 6) h = 1 - (f - a) / 6;
    return h;
  };
  const content = (
    <>
      {bg && (
        <>
          <div style={{position: 'absolute', left: HERO_X - 8 * S, top: FEET - 32 * S + Math.sin(f / 8) * 3, filter: f >= 52 && f < 90 ? 'drop-shadow(0 0 20px #6bff8a)' : undefined}}>
            <MobFigure kind="player" s={S} />
          </div>
          {FOES.map((fo, i) => (
            <div key={i}>
              <div style={{position: 'absolute', left: fo.x - 100, top: FEET - 12, width: 200, height: 26, background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)'}} />
              <div style={{position: 'absolute', left: fo.x - 8 * S + (hurtOf(i) > 0 ? 18 * hurtOf(i) : 0), top: FEET - 32 * S + Math.sin(f / 7 + i) * 3, filter: i === 2 && f >= 80 && f < 96 ? 'brightness(1.8)' : undefined}}>
                <MobFigure kind={fo.kind} s={S} hurt={hurtOf(i)} />
              </div>
            </div>
          ))}
        </>
      )}
      {/* artifact effects */}
      {ARTS[0].uses.map((u, k) => (
        <div key={k}>
          <Rocket at={u} />
          <Burst x={FOES[0].x - 30} y={FEET - 14 * S} at={u + 14} count={36} colors={['#fff6c8', '#ffb347', '#ff6a1f', '#8a4a1a']} speed={20} life={28} size={14} seed={u} />
          <Glint x={FOES[0].x - 30} y={FEET - 14 * S} t={(f - u - 14) / 14} size={200} color="#ffe9a8" />
          <Flash at={u + 14} life={5} peak={0.4} color="#ffd9a0" />
          <Sfx at={u} src={mcSound('random/fuse')} volume={0.3} rate={1.6} />
          <Sfx at={u + 14} src={mcSound('random/explode1')} volume={0.4} rate={1.3} />
        </div>
      ))}
      {/* healing totem */}
      {f >= 52 && f < 96 && (
        <>
          <Beam x={HERO_X} y={FEET + 4} h={560} w={150} color="#6bff8a" p={prog(f, 52, 14)} fadeOut={prog(f, 76, 20)} seed={3} />
          {[-110, -50, 20, 80, 130].map((o, i) => {
            const t = clamp01((f - 56 - i * 3) / 30);
            return t > 0 && t < 1 ? <Plus key={i} x={HERO_X + o} y={FEET - 100 - t * 360 - (i % 2) * 30} s={9} opacity={1 - t} /> : null;
          })}
        </>
      )}
      <Bolt at={80} x={FOES[2].x} yEnd={FEET - 20 * S} />
      <Burst x={FOES[2].x} y={FEET - 16 * S} at={83} count={24} colors={['#fff', '#8fd8ff', '#fff6a8']} speed={18} life={22} size={10} seed={5} />
      <Flash at={80} life={5} peak={0.6} color="#d8f0ff" />
      <Sfx at={52} src={mcSound('random/levelup')} volume={0.3} rate={1.4} />
      <Sfx at={80} src={mcSound('ambient/weather/thunder1')} volume={0.35} rate={1.5} />
      {/* HUD */}
      <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: `translateY(${(1 - hudIn) * 200}px)`, opacity: hudIn}}>
        <div style={{position: 'absolute', left: HUD_X - 600, top: 800, width: 1200}}>
          <Frame w={1200} h={244} mat="dark" pad={0} border={8} studs />
        </div>
        <div style={{position: 'absolute', left: HUD_X - 540, top: 858}}>
          <DSlot size={124} edge="#a83a2a">
            <Item id="potion" size={84} style={{filter: 'hue-rotate(-30deg) saturate(1.5)'}} />
          </DSlot>
        </div>
        <div style={{position: 'absolute', left: HUD_X + 416, top: 858}}>
          <DSlot size={124} edge="#6a5538">
            <Item id="arrow" size={84} />
            <div style={{position: 'absolute', right: 6, bottom: 0}}>
              <Bold size={32}>64</Bold>
            </div>
          </DSlot>
        </div>
        <div style={{position: 'absolute', left: 190, top: 96}}>
          <Frame w={560} h={150} mat="dark" pad={20} border={8} studs={false}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, height: '100%'}}>
              <Face skin="steve" size={88} style={{boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px #a87a2a`}} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <Label size={24} color={C.gold3}>
                  勇者 · Lv.18
                </Label>
                <HpBar w={340} h={30} value={hp} ghost={hp + 0.04} />
              </div>
            </div>
          </Frame>
        </div>
        {ARTS.map((a, i) => (
          <ArtSlot key={i} a={a} i={i} f={f} />
        ))}
      </div>
      {ARTS.flatMap((a) => a.uses.map((u) => <Sfx key={a.id + u} at={u} src={mcSound('random/click')} volume={0.4} rate={0.9} />))}
      {ARTS.flatMap((a) => a.uses.map((u) => <Sfx key={'r' + a.id + u} at={u + a.cd} src={mcSound('random/orb')} volume={0.35} rate={1.5} />))}
    </>
  );
  void shakeAt;
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={shakeAt} life={9} strength={14}>
      <DungeonBg dim={0.12} floor={720}>
        {content}
      </DungeonBg>
    </Shake>
  );
};

export const ArtifactCooldown = Scene;
