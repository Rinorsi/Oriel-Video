import type {FC} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {HpBar, Ribbon} from './bars';
import {Bold, Burst, C, DungeonBg, EASE, Face, Fancy, Flash, Frame, GOLD_GRAD, Glint, Item, Label, MobFigure, W, clamp01, jiggle, lerp, mulberry32, prog, snap} from './common';

/**
 * rpg-combo-hit: an 8-hit chain on a zombie. Every landed hit freezes the world for 2-6 frames (hitstop - the whole
 * scene runs on "game time", which stops advancing), shakes and punches the camera, throws a pixel slash arc and sparks,
 * bumps the combo counter and refills its timer. The 8th hit is a crit: long freeze, white impact frame, X-slash,
 * "CRIT" banner built from icons, and the enemy is launched.
 * Props: `bg` - dungeon, fighters and HUD (Demo). Without it (Layer): counter, banner, buff icons, slashes and sparks only.
 * Edit HITS (g = game-time frame of impact, kind = light|heavy|crit).
 */

type HitKind = 'light' | 'heavy' | 'crit';
const HITS: {g: number; kind: HitKind}[] = [
  {g: 16, kind: 'light'},
  {g: 26, kind: 'light'},
  {g: 36, kind: 'light'},
  {g: 46, kind: 'light'},
  {g: 56, kind: 'light'},
  {g: 66, kind: 'light'},
  {g: 78, kind: 'heavy'},
  {g: 96, kind: 'crit'},
];
const HOLD = {light: 2, heavy: 4, crit: 7} as const;
export const COMBO_FRAMES = 96 + 70 + (6 * 2 + 4 + 7);

/** frames of freeze accumulated by frame f (screen time) -> game time g = f - frozen(f). */
const frozenAt = (f: number) => {
  let total = 0;
  let acc = 0; // screen frames elapsed before this hit's freeze, in screen time
  for (const h of HITS) {
    const fHit = h.g + acc; // screen frame of the impact
    total += Math.max(0, Math.min(HOLD[h.kind], f - (fHit + 1)));
    acc += HOLD[h.kind];
  }
  return total;
};
/** screen frame at which the i-th hit lands */
const screenHit = (i: number) => HITS[i].g + HITS.slice(0, i).reduce((s, h) => s + HOLD[h.kind], 0);

const HERO_X = 520;
const FOE_X = 1230;
const FEET = 930;
const S = 15;

const Arc: FC<{at: number; cx: number; cy: number; r: number; a0: number; a1: number; color: string; n?: number; size?: number}> = ({at, cx, cy, r, a0, a1, color, n = 18, size = 36}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 10) return null;
  const grow = clamp01(f / 3);
  const fade = 1 - clamp01((f - 3) / 7);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const k = i / (n - 1);
        if (k > grow) return null;
        const a = lerp(a0, a1, k);
        const sz = snap(size * (0.25 + Math.sin(k * Math.PI) * 0.9), 4);
        const rr = r * (1 + 0.06 * Math.sin(k * Math.PI));
        return <div key={i} style={{position: 'absolute', left: snap(cx + Math.cos(a) * rr - sz / 2, 4), top: snap(cy + Math.sin(a) * rr - sz / 2, 4), width: sz, height: sz, background: i % 3 === 0 ? '#fff' : color, opacity: fade, boxShadow: `0 0 16px ${color}`}} />;
      })}
    </>
  );
};

const Scene: FC<{bg: boolean}> = ({bg}) => {
  const g = useCurrentFrame(); // game time (the wrapper Sequence rewinds the screen frame by the frozen amount)
  const hitsDone = HITS.filter((h) => g >= h.g);
  const n = hitsDone.length;
  const lastHit = hitsDone.length ? hitsDone[hitsDone.length - 1] : null;
  const since = lastHit ? g - lastHit.g : 99;
  const fx = FOE_X;
  // hero lunge: bump toward the enemy around each impact
  const lunge = HITS.reduce((m, h) => {
    const t = (g - (h.g - 6)) / 10;
    return t > 0 && t < 1 ? Math.max(m, Math.sin(t * Math.PI) * (h.kind === 'crit' ? 130 : 80)) : m;
  }, 0);
  // enemy knock: pushed per hit, then launched on the crit
  const crit = HITS[HITS.length - 1];
  const launch = prog(g, crit.g, 26, EASE.out);
  const knock = hitsDone.slice(0, 7).reduce((s, h) => s + 12 * Math.max(0, 1 - (g - h.g) / 10) + 6, 0) * 0.6;
  const foeX = fx + knock + launch * 340;
  const foeY = -Math.sin(launch * Math.PI) * 220 + launch * 20;
  const hurt = since < 4 ? 1 - since / 4 : 0;
  const foeRot = launch * 330;
  const comboT = lastHit ? clamp01((g - lastHit.g) / 22) : 1;
  const pop = lastHit ? 1 + 0.55 * Math.max(0, 1 - since / 8) : 1;
  const critBanner = g - crit.g;
  const heroBob = since > 6 ? Math.sin(g / 5) * 3 : 0;
  const content = (
    <>
      {bg && (
        <>
          <div style={{position: 'absolute', left: HERO_X - 140, top: FEET - 14, width: 280, height: 30, background: 'radial-gradient(ellipse, rgba(0,0,0,.65), rgba(0,0,0,0) 70%)'}} />
          <div style={{position: 'absolute', left: HERO_X - 8 * S + lunge, top: FEET - 32 * S + heroBob}}>
            <MobFigure kind="player" s={S} />
          </div>
          <div style={{position: 'absolute', left: fx - 140, top: FEET - 14, width: 280, height: 30, background: 'radial-gradient(ellipse, rgba(0,0,0,.65), rgba(0,0,0,0) 70%)', opacity: 1 - launch}} />
          <div style={{position: 'absolute', left: foeX - 8 * S, top: FEET - 32 * S + foeY, transform: `rotate(${foeRot}deg)`, transformOrigin: '50% 60%'}}>
            <MobFigure kind="zombie" s={S} hurt={hurt} />
          </div>
        </>
      )}
      {/* slashes + sparks */}
      {HITS.map((h, i) => {
        const cx = fx - 20;
        const cy = FEET - 20 * S;
        const flip = i % 2 === 0 ? 1 : -1;
        return (
          <div key={i}>
            {h.kind !== 'crit' && <Arc at={h.g} cx={cx} cy={cy} r={h.kind === 'heavy' ? 200 : 160} a0={flip > 0 ? -2.3 : -0.8} a1={flip > 0 ? -0.5 : -2.6} color={h.kind === 'heavy' ? C.gold2 : '#fff2c8'} size={h.kind === 'heavy' ? 48 : 36} />}
            {h.kind === 'crit' && (
              <>
                <Arc at={h.g} cx={cx} cy={cy} r={230} a0={-2.5} a1={-0.4} color={C.gold2} size={60} n={22} />
                <Arc at={h.g} cx={cx} cy={cy} r={230} a0={-0.7} a1={-2.8} color="#fff2c8" size={60} n={22} />
              </>
            )}
            <Glint x={cx} y={cy} t={(g - h.g) / (h.kind === 'crit' ? 16 : 8)} size={h.kind === 'crit' ? 240 : h.kind === 'heavy' ? 130 : 90} color={h.kind === 'crit' ? '#fff0b0' : '#fff6d8'} />
            <Burst x={cx} y={cy} at={h.g} count={h.kind === 'crit' ? 46 : h.kind === 'heavy' ? 22 : 12} colors={h.kind === 'light' ? ['#fff', '#ffe9a8', '#ffc85a'] : [C.gold3, C.gold2, '#fff', C.torch]} speed={h.kind === 'crit' ? 26 : 14} life={h.kind === 'crit' ? 34 : 18} size={h.kind === 'crit' ? 14 : 10} seed={h.g} />
          </div>
        );
      })}
      {/* HUD: hero card top-left */}
      {bg && (
        <div style={{position: 'absolute', left: 190, top: 96, opacity: prog(g, 2, 10)}}>
          <Frame w={520} h={150} mat="dark" pad={20} border={8} studs={false}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, height: '100%'}}>
              <Face skin="steve" size={88} style={{boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px #a87a2a`}} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
                  <Label size={24} color={C.gold3}>
                    勇者
                  </Label>
                  <Label size={24} color="#b9a58a">
                    Lv.18
                  </Label>
                </div>
                <HpBar w={320} h={28} value={0.82} ghost={0.9} />
              </div>
            </div>
          </Frame>
        </div>
      )}
      {/* buff icons */}
      {[
        {id: 'golden_sword', at: 36, c: C.gold2},
        {id: 'blaze_powder', at: 56, c: C.torch},
        {id: 'iron_chestplate', at: 78, c: '#9fd0ff'},
      ].map((b, i) => {
        if (g < b.at) return null;
        const t = prog(g, b.at, 12, EASE.back);
        const left = clamp01(1 - (g - b.at) / 90);
        return (
          <div key={i} style={{position: 'absolute', left: 200 + i * 112, top: 270, width: 96, transform: `scale(${t})`, transformOrigin: '50% 100%'}}>
            <div style={{width: 96, height: 96, boxSizing: 'border-box', background: 'linear-gradient(180deg,#2a1d14,#120b07)', border: `4px solid ${b.c}`, boxShadow: `0 0 0 3px ${C.ink}, 0 0 18px ${b.c}`, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <Item id={b.id} size={64} />
            </div>
            <div style={{marginTop: 10, height: 10, background: C.ink, border: '2px solid #6a5538'}}>
              <div style={{width: `${left * 100}%`, height: '100%', background: b.c}} />
            </div>
          </div>
        );
      })}
      {/* combo counter, right side */}
      {n > 0 && (
        <div style={{position: 'absolute', left: 1240, top: 120, width: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
          <div style={{transform: `scale(${pop})`, display: 'flex', alignItems: 'baseline', gap: 10}}>
            <Fancy size={64} fill="linear-gradient(180deg,#ffffff,#d7cdb8 60%,#8a7a5e)">
              ×
            </Fancy>
            <Fancy size={n >= 7 ? 170 : 140} fill={n >= 8 ? 'linear-gradient(180deg,#fff3c2 0%,#ff9a3c 50%,#d9321c 100%)' : n >= 5 ? GOLD_GRAD : 'linear-gradient(180deg,#ffffff,#e4e0d6 55%,#9d9686)'}>
              {String(n)}
            </Fancy>
          </div>
          <Label size={36} color={C.gold3} style={{marginTop: 10}}>
            连击
          </Label>
          <div style={{width: 360, height: 16, background: C.ink, border: `4px solid #6a5538`, boxSizing: 'border-box', marginTop: 8}}>
            <div style={{width: `${(1 - comboT) * 100}%`, height: '100%', background: `linear-gradient(180deg, ${C.gold3}, ${C.gold1})`}} />
          </div>
        </div>
      )}
      {/* crit banner built from icons */}
      {critBanner >= 0 && (() => {
        const t = prog(critBanner, 0, 10, EASE.back);
        const out = 1 - prog(critBanner, 46, 10, EASE.in);
        return (
          <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', transform: `scale(${t * (1 + 0.1 * jiggle(critBanner / 20, 2, 3))}) translateY(${(1 - out) * -30}px)`, opacity: out}}>
            <Ribbon w={600} h={120}>
              <Item id="diamond_sword" size={88} style={{transform: 'scaleX(-1)', filter: 'drop-shadow(0 0 14px #ffd36a)'}} />
              <Fancy size={92} spacing={18}>
                暴击
              </Fancy>
              <Item id="diamond_sword" size={88} style={{filter: 'drop-shadow(0 0 14px #ffd36a)'}} />
            </Ribbon>
          </div>
        );
      })()}
      {/* bottom combo bonus bar */}
      {bg && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 982, display: 'flex', justifyContent: 'center', opacity: prog(g, 8, 10)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <Label size={24} color={C.gold3}>
              连击加成
            </Label>
            <div style={{position: 'relative', width: 760, height: 28, background: C.ink, border: '4px solid #a87a2a', boxShadow: `0 0 0 3px ${C.ink}`, boxSizing: 'border-box'}}>
              <div style={{width: `${(n / 8) * 100}%`, height: '100%', background: `linear-gradient(180deg, ${C.gold3}, ${C.gold2} 50%, ${C.gold1})`, transition: 'none'}} />
              {[3, 6, 8].map((m) => (
                <div key={m} style={{position: 'absolute', left: `${(m / 8) * 100}%`, top: -6, width: 4, height: 28 + 8, background: n >= m ? '#fff' : '#6a5538', transform: 'translateX(-4px)'}} />
              ))}
            </div>
            <Bold size={40} color={C.gold3}>
              {`+${[0, 0, 0, 10, 10, 10, 25, 25, 50][n]}%`}
            </Bold>
          </div>
        </div>
      )}
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <DungeonBg warm={1 + 0.3 * Math.max(0, 1 - since / 6)} floor={760}>
      {content}
    </DungeonBg>
  );
};

export const ComboHit: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const fro = frozenAt(f);
  // camera: shake + punch on each impact (screen time)
  let dx = 0;
  let dy = 0;
  let zoom = 1;
  HITS.forEach((h, i) => {
    const k = f - screenHit(i);
    const life = h.kind === 'crit' ? 18 : h.kind === 'heavy' ? 12 : 8;
    if (k >= 0 && k <= life) {
      const m = (h.kind === 'crit' ? 30 : h.kind === 'heavy' ? 18 : 9) * (1 - k / life);
      const r = mulberry32(300 + k * 11 + i);
      dx += (r() * 2 - 1) * m;
      dy += (r() * 2 - 1) * m;
      zoom += (h.kind === 'crit' ? 0.07 : 0.02) * (1 - k / life);
    }
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${snap(dx, 2)}px, ${snap(dy, 2)}px) scale(${zoom})`, transformOrigin: '65% 60%'}}>
        <Sequence from={fro} layout="none">
          <Scene bg={!!bg} />
        </Sequence>
      </AbsoluteFill>
      {/* impact frames and sounds live in screen time */}
      {HITS.map((h, i) => (
        <div key={i}>
          <Flash at={screenHit(i) + 1} life={h.kind === 'crit' ? 5 : 2} peak={h.kind === 'crit' ? 0.85 : 0.25} color={h.kind === 'crit' ? '#ffffff' : '#fff0c8'} />
          <Sfx at={screenHit(i)} src={mcSound(`dig/stone${(i % 4) + 1}`)} volume={0.45} rate={h.kind === 'light' ? 1.5 : 1.1} />
          <Sfx at={screenHit(i)} src={mcSound('random/anvil_land')} volume={h.kind === 'crit' ? 0.5 : h.kind === 'heavy' ? 0.28 : 0.1} rate={h.kind === 'crit' ? 1.1 : 2} />
        </div>
      ))}
      <Sfx at={screenHit(7) + 8} src={mcSound('random/levelup')} volume={0.3} rate={1.4} />
    </AbsoluteFill>
  );
};
void Bold;
