import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {item} from '../../../mc/assets';
import {PIXEL8_FONT, PIXEL_FONT} from '../../../mc/fonts';
import {HEIGHT, WIDTH, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import {PlateA, PlateB} from '../../plates';
import type {FxEntry} from '../../types';
import {hash2, mix, win} from './common';

/**
 * t2-book-flip : the shot is the top page of a thick book. A leather binding with a stitched spine and a stack of page
 * edges frames the screen. The page is cut into N = 40 vertical strips; each strip is placed along a bending curve
 * (tangent angle grows from the spine to the free edge, then curls at the tip) and rotated in real CSS 3D with perspective,
 * so the page rolls over like paper instead of swinging like a door. Every strip is shaded along its own bend (soft
 * curved-surface gradient), the free edge carries a bright paper edge, a moving soft shadow is cast on the page below,
 * and the back of the paper shows when it passes the vertical. The page underneath is a parchment page, which is
 * turned in the same way to reveal B. Flip speed eases in and out.
 * Dual-type: the entry uses its own Demo (it needs real copies of A / B), `BookFlip` is reusable with any A / B components.
 * Params: HX (spine x), N (strips), PERSP (camera distance), LARC (arc length of the roll), TEXT (parchment lines).
 */

export const T = 72;
const LEAD = 20;
const TAIL = 20;
const W = WIDTH;
const H = HEIGHT;
const HX = 128;
const N = 40;
const L = W - HX; // 1792
const DS = L / N; // 44.8
const PERSP = 3600;
const LARC = 640; // arc length of the roll (radius about 200 px)
const VPX = 0.12 * WIDTH; // vanishing point of the page camera
const VPY = HEIGHT / 2;
const TEXT = ['在很久很久以前，方块世界还只是一片荒原。', '一位旅人翻开了这本古老的书，', '每一页都写着一段没有讲完的旅程。', '风吹过书页，故事悄悄翻到下一幕……', '', '铁镐敲响了山，火把照亮了洞，', '而真正的冒险，才刚刚开始。'];
const INK = '#3a2614';
/** Ease in and out with a soft middle: slow lift, brisk turn, gentle landing. */
const FLIP_EASE = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)) * 0.8 + t * 0.2;

// ------------------------------------------------------------------ geometry

type Geo = {psi: number[]; x: number[]; z: number[]; phi: number[]};
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Page shape for flip amount e (0 = flat on the book, 1 = lying turned over). A roll of arc length LARC travels from the free edge to
 * the spine: ahead of it the page is flat and still the shot, inside it the tangent turns smoothly through 180 degrees, behind it the page lies
 * folded back (its reverse side up, resting on the roll's height).
 */
const geometry = (e: number): Geo => {
  const sf = L - e * (L + LARC);
  const psi: number[] = [];
  for (let j = 0; j <= N; j++) psi.push(180 * smooth(clamp01((j * DS - sf) / LARC)));
  const x = [HX];
  const z = [0];
  const phi: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = ((psi[i] + psi[i + 1]) / 2) * (Math.PI / 180);
    phi.push((psi[i] + psi[i + 1]) / 2);
    x.push(x[i] + DS * Math.cos(a));
    z.push(z[i] + DS * Math.sin(a));
  }
  return {psi, x, z, phi};
};

const LIGHT = [-0.4, 0.92]; // direction to the light in (x, z)
/** Darkness and gloss of a face at tangent angle psi (deg). front: normal (-sin, cos); back: the opposite. */
const shade = (psi: number, back: boolean) => {
  const a = (psi * Math.PI) / 180;
  const sgn = back ? -1 : 1;
  const nx = -Math.sin(a) * sgn;
  const nz = Math.cos(a) * sgn;
  const lambert = nx * LIGHT[0] + nz * LIGHT[1];
  const dark = clamp01(0.72 * (1 - Math.max(0, lambert) / 0.95));
  // gloss band where the surface tilts about 30 degrees toward the light (not on the flat page)
  const spec = 0.5 * Math.pow(Math.max(0, Math.cos(((back ? psi - 150 : psi - 30) * Math.PI) / 180)), 24);
  return {dark, spec};
};
const faceOverlay = (psi0: number, psi1: number, back: boolean): CSSProperties => {
  const a = shade(psi0, back);
  const b = shade(psi1, back);
  // on the back face the strip is mirrored, so its local left end is the geometric right end
  const [d0, d1, s0, s1] = back ? [b.dark, a.dark, b.spec, a.spec] : [a.dark, b.dark, a.spec, b.spec];
  return {background: `linear-gradient(90deg, rgba(34,14,2,${d0.toFixed(3)}), rgba(34,14,2,${d1.toFixed(3)})), linear-gradient(90deg, rgba(255,250,226,${s0.toFixed(3)}), rgba(255,250,226,${s1.toFixed(3)}))`};
};

// ------------------------------------------------------------------ page content

const Parchment: FC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#e9d8a4', overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 56% 50%, rgba(255,246,206,0.55) 0%, rgba(255,246,206,0) 60%), radial-gradient(ellipse at 50% 50%, rgba(120,80,30,0) 55%, rgba(120,80,30,0.38) 100%)'}} />
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(110,70,25,0.16) 1.5px, transparent 2px)', backgroundSize: '12px 12px'}} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(60,30,8,0.5), rgba(60,30,8,0) 160px)', left: HX, width: 300}} />
    <div style={{position: 'absolute', left: 250, top: 120, fontFamily: PIXEL_FONT, fontSize: 84, lineHeight: '84px', color: '#8a2a1c', whiteSpace: 'pre', textShadow: '4px 4px 0 rgba(58,38,20,0.25)', WebkitFontSmoothing: 'none'}}>第 二 章</div>
    <div style={{position: 'absolute', left: 250, top: 216, width: 900, height: 8, background: INK, opacity: 0.8}} />
    <div style={{position: 'absolute', left: 250, top: 232, width: 560, height: 4, background: INK, opacity: 0.5}} />
    {TEXT.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: 250, top: 290 + i * 66, fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: '36px', color: INK, whiteSpace: 'pre', opacity: 0.88, WebkitFontSmoothing: 'none', letterSpacing: 2}}>
        {i === 0 ? <span style={{color: '#8a2a1c', fontSize: 60, lineHeight: '36px', marginRight: 6}}>{t[0]}</span> : null}
        {i === 0 ? t.slice(1) : t}
      </div>
    ))}
    {Array.from({length: 7}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: 250, top: 760 + i * 36, width: 780 - hash2(i, 3, 1) * 240, height: 10, background: INK, opacity: 0.35}} />
    ))}
    <div style={{position: 'absolute', left: 1180, top: 260, width: 440, height: 440, background: '#d9c48a', boxShadow: `inset 0 0 0 8px ${INK}, inset 0 0 0 16px #c2a766, 10px 10px 0 rgba(58,38,20,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <img src={item('enchanted_book')} style={{width: 256, height: 256, imageRendering: 'pixelated', filter: 'drop-shadow(8px 8px 0 rgba(58,38,20,0.4))'}} />
    </div>
    <div style={{position: 'absolute', left: 1180, top: 730, width: 440, textAlign: 'center', fontFamily: PIXEL8_FONT, fontSize: 32, lineHeight: '32px', color: INK, opacity: 0.8}}>图 2 · 古老的魔法书</div>
    {[0, 1, 2].map((i) => (
      <img key={i} src={item(['diamond', 'emerald', 'gold_ingot'][i])} style={{position: 'absolute', left: 1200 + i * 150, top: 810, width: 96, height: 96, imageRendering: 'pixelated', filter: 'drop-shadow(5px 5px 0 rgba(58,38,20,0.35))'}} />
    ))}
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 116, textAlign: 'center', fontFamily: PIXEL8_FONT, fontSize: 32, color: INK, opacity: 0.7, paddingLeft: HX}}>— 42 —</div>
    <div style={{position: 'absolute', left: 1720, top: 0, width: 56, height: 330, background: '#b3262e', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%)', boxShadow: 'inset -10px 0 0 rgba(0,0,0,0.25)'}} />
  </div>
);

/** The reverse side of a page: plain aged paper with a ghost of the type showing through. */
const PaperBack: FC<{x0: number}> = ({x0}) => (
  <div style={{position: 'absolute', left: -x0, top: 0, width: W, height: H, background: '#e4d29a', overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,244,200,0.45) 0%, rgba(255,244,200,0) 55%), radial-gradient(ellipse at 50% 50%, rgba(120,80,30,0) 55%, rgba(120,80,30,0.3) 100%)'}} />
    {Array.from({length: 14}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: 260 + hash2(i, 1, 6) * 80, top: 190 + i * 52, width: 1000 - hash2(i, 2, 6) * 500, height: 8, background: INK, opacity: 0.07}} />
    ))}
  </div>
);

/** Fine paper grain, strength follows how far the page has lifted. */
const grain = (k: number): CSSProperties => ({
  backgroundImage: 'repeating-linear-gradient(0deg, rgba(110,80,35,0.05) 0 1px, rgba(0,0,0,0) 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, rgba(0,0,0,0) 1px 5px)',
  opacity: k * 0.5,
});

// ------------------------------------------------------------------ the book frame

const leather = (extra?: CSSProperties): CSSProperties => ({position: 'absolute', background: 'linear-gradient(180deg, #5a3a22, #3b2415)', boxShadow: 'inset 0 4px 0 rgba(255,220,170,0.18), inset 0 -4px 0 rgba(0,0,0,0.4)', ...extra});
const STACK = (dir: 'v' | 'h'): CSSProperties => ({
  backgroundImage: dir === 'v' ? 'repeating-linear-gradient(90deg, #f2e6bd 0 5px, #cdb98a 5px 7px)' : 'repeating-linear-gradient(180deg, #f2e6bd 0 5px, #cdb98a 5px 7px)',
});

const gold = 'linear-gradient(135deg, #fff1a8 0%, #f8af2b 45%, #a8700f 100%)';
const Corner: FC<{x: number; y: number; flipX?: boolean; flipY?: boolean}> = ({x, y, flipX, flipY}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 150, height: 150, transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}}>
    <div style={{position: 'absolute', inset: 0, background: '#2a180d', clipPath: 'polygon(0 0, 100% 0, 100% 16%, 84% 16%, 84% 32%, 68% 32%, 68% 48%, 52% 48%, 52% 64%, 36% 64%, 36% 80%, 20% 80%, 20% 100%, 0 100%)'}} />
    <div style={{position: 'absolute', left: 8, top: 8, right: 8, bottom: 8, background: gold, clipPath: 'polygon(0 0, 100% 0, 100% 14%, 83% 14%, 83% 30%, 66% 30%, 66% 46%, 50% 46%, 50% 62%, 33% 62%, 33% 78%, 17% 78%, 17% 100%, 0 100%)'}} />
    <div style={{position: 'absolute', left: 30, top: 30, width: 22, height: 22, background: '#7a1a1a', boxShadow: '0 0 0 4px #2a180d, inset 4px 4px 0 #ff6a5a'}} />
  </div>
);

const Frame: FC<{k: number}> = ({k}) => {
  const e = Easing.bezier(0.16, 1, 0.3, 1)(k);
  const off = (1 - e) * 160;
  return (
    <AbsoluteFill style={{opacity: Math.min(1, k * 3)}}>
      <div style={{position: 'absolute', left: HX, top: 0, width: 150, height: H, background: 'linear-gradient(90deg, rgba(40,20,5,0.55), rgba(40,20,5,0))'}} />
      <div style={{...leather({left: -off, top: 0, width: HX, height: H}), background: 'linear-gradient(90deg, #1e120a 0%, #4a2e1a 35%, #6a4429 70%, #2a180d 100%)'}}>
        {Array.from({length: 22}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: HX - 52, top: 24 + i * 48, width: 30, height: 8, background: '#efe2b8', boxShadow: '3px 3px 0 rgba(0,0,0,0.5)'}} />
        ))}
        <div style={{position: 'absolute', left: HX - 62, top: 0, bottom: 0, width: 6, background: '#1a0f08'}} />
        <div style={{position: 'absolute', left: HX - 14, top: 0, bottom: 0, width: 10, background: gold}} />
        {[170, 540, 910].map((y) => (
          <div key={y} style={{position: 'absolute', left: 8, width: HX - 80, top: y - 40, height: 80, background: gold, boxShadow: '0 0 0 5px #2a180d, 6px 6px 0 rgba(0,0,0,0.4)'}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: HX, top: -off, width: W - HX, height: 66}}>
        <div style={{...leather({left: 0, top: 0, width: '100%', height: 20})}} />
        <div style={{position: 'absolute', left: 0, top: 20, width: '100%', height: 46, ...STACK('h'), boxShadow: 'inset 0 -10px 0 rgba(60,30,8,0.35)'}} />
      </div>
      <div style={{position: 'absolute', left: HX, top: H - 78 + off, width: W - HX, height: 78}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: 56, ...STACK('h'), boxShadow: 'inset 0 10px 0 rgba(60,30,8,0.35)'}} />
        <div style={{...leather({left: 0, top: 56, width: '100%', height: 22})}} />
      </div>
      <div style={{position: 'absolute', left: W - 74 + off, top: 0, width: 74, height: H}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 54, height: '100%', ...STACK('v'), boxShadow: 'inset 10px 0 0 rgba(60,30,8,0.35)'}} />
        <div style={{...leather({left: 54, top: 0, width: 20, height: '100%'}), background: 'linear-gradient(90deg, #5a3a22, #3b2415)'}} />
      </div>
      <Corner x={W - 150 + off} y={-off} flipX />
      <Corner x={W - 150 + off} y={H - 150 + off} flipX flipY />
      <Corner x={HX - 30 - off} y={-off} />
      <Corner x={HX - 30 - off} y={H - 150 + off} flipY />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the turning page

/** The page (any content `C`) cut into N strips, bent along `geometry(e)` in 3D, with shading, free edge and cast shadow. */
const TurningPage: FC<{C: FC; e: number}> = ({C, e}) => {
  const g = geometry(e);
  const lift = clamp01(e * 10);
  // painter's order, far to near: every strip is its own small 3D context, so the stacking is exact and cheap
  const order = Array.from({length: N}, (_, i) => i).sort((a, b) => g.z[a] + g.z[a + 1] - (g.z[b] + g.z[b + 1]) || a - b);
  return (
    <>
      {/* shadow of the lifted page on the page underneath: one soft band per strip, lighter the higher it is */}
      <div style={{position: 'absolute', inset: 0, filter: 'blur(22px)', opacity: Math.min(1, lift)}}>
        {Array.from({length: N}, (_, i) => {
          const zi = (g.z[i] + g.z[i + 1]) / 2;
          if (zi < 6) return null;
          const xa = g.x[i] + 0.38 * g.z[i];
          const xb = g.x[i + 1] + 0.38 * g.z[i + 1];
          const a = 0.5 * Math.pow(clamp01(1 - zi / 1500), 1.4);
          const left = Math.min(xa, xb) - 1;
          return <div key={i} style={{position: 'absolute', left, top: -40, width: Math.abs(xb - xa) + 2, height: H + 80, background: `rgba(24,10,0,${a.toFixed(3)})`}} />;
        })}
      </div>
      <div style={{position: 'absolute', inset: 0}}>
        <div style={{position: 'absolute', inset: 0}}>
          {order.map((i) => {
            const x0 = HX + i * DS;
            const mid = g.phi[i];
            const showFront = Math.cos((mid * Math.PI) / 180) > -0.12;
            const showBack = Math.cos((mid * Math.PI) / 180) < 0.12;
            const last = i === N - 1;
            return (
              <div key={i} style={{position: 'absolute', left: 0, top: 0, width: DS, height: H, transformStyle: 'preserve-3d', transformOrigin: '0 0', transform: `translate(${VPX}px, ${VPY}px) perspective(${PERSP}px) translate(${-VPX}px, ${-VPY}px) translate3d(${g.x[i]}px, 0, ${g.z[i]}px) rotateY(${-g.phi[i]}deg)`}}>
                <div style={{position: 'absolute', left: 0, top: 0, width: DS + 1.5, height: H, overflow: 'hidden', backfaceVisibility: 'hidden'}}>
                  {showFront && (
                    <div style={{position: 'absolute', left: -x0, top: 0, width: W, height: H}}>
                      <C />
                    </div>
                  )}
                  <div style={{position: 'absolute', inset: 0, ...grain(lift)}} />
                  <div style={{position: 'absolute', inset: 0, ...faceOverlay(g.psi[i], g.psi[i + 1], false)}} />
                  {last && <div style={{position: 'absolute', right: 0, top: 0, width: 5, height: H, background: '#fffbe8', boxShadow: '-3px 0 0 rgba(255,246,206,0.5)', opacity: lift}} />}
                </div>
                <div style={{position: 'absolute', left: 0, top: 0, width: DS + 1.5, height: H, overflow: 'hidden', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
                  {showBack && <PaperBack x0={W - x0 - DS} />}
                  <div style={{position: 'absolute', inset: 0, ...grain(lift)}} />
                  <div style={{position: 'absolute', inset: 0, ...faceOverlay(g.psi[i], g.psi[i + 1], true)}} />
                  {last && <div style={{position: 'absolute', left: 0, top: 0, width: 5, height: H, background: '#fffbe8', boxShadow: '3px 0 0 rgba(255,246,206,0.5)', opacity: lift}} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

/** A / B are the two shots (any components), p 0..1 the transition progress. */
export const BookFlip: FC<{A: FC; B: FC; p: number}> = ({A, B, p}) => {
  const frameK = win(p, 0, 0.1) * (1 - win(p, 0.88, 1));
  const e1 = FLIP_EASE(win(p, 0.06, 0.46));
  const e2 = FLIP_EASE(win(p, 0.54, 0.94));
  const phase2 = p >= 0.5;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* underlay: parchment page while A turns, B while the parchment turns */}
      <AbsoluteFill>{phase2 ? <B /> : p < 0.06 ? <A /> : <Parchment />}</AbsoluteFill>
      {!phase2 && p >= 0.06 && e1 < 0.999 && <TurningPage C={A} e={e1} />}
      {phase2 && e2 < 0.999 && <TurningPage C={Parchment} e={e2} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,12,0,0.55) 100%)', opacity: frameK}} />
      <Frame k={frameK} />
    </AbsoluteFill>
  );
};

const srcOf = (s: string) => (s.startsWith('mc:') ? mcSound(s.slice(3)) : reelSfx(s.slice(s.indexOf(':') + 1)));
export const CUES: {at: number; src: string; volume?: number; rate?: number}[] = [
  // real book sounds: one page turn per flip (the first lifts the cover page, the second the parchment), the book settles at the end
  {at: 5, src: 'mc:item/book/open_flip1', volume: 0.8},
  {at: 34, src: 'mc:item/book/open_flip2', volume: 0.8},
  {at: 54, src: 'mc:item/book/close_put1', volume: 0.35, rate: 1.1},
];

const Demo: FC = () => {
  const f = useCurrentFrame();
  const p = clamp01((f - LEAD) / T);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {f < LEAD ? <PlateA /> : f >= LEAD + T ? <PlateB /> : <BookFlip A={PlateA} B={PlateB} p={p} />}
      {CUES.map((c, i) => (
        <Sfx key={i} at={LEAD + c.at} src={srcOf(c.src)} volume={c.volume} rate={c.rate} />
      ))}
    </AbsoluteFill>
  );
};

export const bookFlip: FxEntry = {
  meta: {
    id: 't2-book-flip',
    name: '像素翻页',
    category: 'transition',
    tags: ['书', '翻页', '魔法书', '质感', '章节切换', '故事'],
    frames: LEAD + T + TAIL,
    blurb: '画面是一本厚书的书页：皮革书脊带缝线、右侧叠出页边厚度。书页被切成 40 条竖条，沿一条弯曲的曲线逐条做透视旋转，像纸一样卷起、翻过；每条带曲面明暗和高光，翻动边有亮纸边，下一页上有跟随移动的柔和投影，翻过垂直线后露出纸背；露出的羊皮纸页再翻一次，露出下一幕。翻页速度缓入缓出。',
    usage: '章节切换、讲故事 / 背景介绍、教程「下一页」的转场。',
    params: [
      {name: 'HX', desc: '书脊位置（像素），默认 128'},
      {name: 'N', desc: '竖条数量，默认 40（越多越顺滑）'},
      {name: 'PERSP / LARC', desc: '透视距离（越小越夸张，默认 3600）、卷起处的弧长（越大越松，默认 640px）'},
      {name: 'TEXT', desc: '羊皮纸页上的正文行（可改）'},
    ],
  },
  Demo,
};

void mix;
