import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {item} from '../mc/assets';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../mc/Fx';
import {PIXEL8_FONT} from '../mc/fonts';
import {EASE, clamp01, mulberry32} from '../mc/theme';
import {ORE, OreButton, OreChip, OrePanel, OreProgress, OreSection, OreText, PixelCursor, StoneTitle, TYPE, U, nine} from '../mg/Ore';
import {ItemImg, LabelSmall, Letterbox, OreBg, OreTooltip, OutlineText, Sfx, Sky, Slider, Slot, Tab, Toggle, hudTex, lerp, mcSound, prog} from './kit';

/** Shots 1-5 of the effects reel (see Reel.tsx). Coordinates are 1920x1080 screen pixels, UI sizes are multiples of U. */

const W = 1920;
const H = 1080;

/** Interpolates a cursor path through [frame, x, y] waypoints, easing between them. */
export const cursorAt = (f: number, pts: [number, number, number][]): [number, number] => {
  if (f <= pts[0][0]) return [pts[0][1], pts[0][2]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [fa, xa, ya] = pts[i];
    const [fb, xb, yb] = pts[i + 1];
    if (f < fb) {
      const t = EASE.inOut(clamp01((f - fa) / (fb - fa)));
      return [lerp(xa, xb, t), lerp(ya, yb, t)];
    }
  }
  const last = pts[pts.length - 1];
  return [last[1], last[2]];
};

/** Expanding ring where the cursor clicked. */
export const Ripple: FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 16) return null;
  const t = f / 16;
  const r = 12 + t * 70;
  return <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, border: `${Math.round(8 * (1 - t))}px solid rgba(255,255,255,${0.8 * (1 - t)})`, borderRadius: 0}} />;
};

/** Enchantment glint: a diagonal purple sheen masked to the item's own pixels. */
export const Glint: FC<{id: string; size: number; speed?: number}> = ({id, size, speed = 2.4}) => {
  const f = useCurrentFrame();
  const mask = `url(${item(id)})`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: size,
        height: size,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        imageRendering: 'pixelated',
        backgroundImage: 'linear-gradient(115deg, rgba(120,40,230,0) 30%, rgba(150,70,255,0.85) 44%, rgba(255,210,255,0.95) 50%, rgba(150,70,255,0.85) 56%, rgba(120,40,230,0) 70%)',
        backgroundSize: '320% 100%',
        backgroundPosition: `${200 - ((f * speed) % 200) * 1.4}% 0`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

const centre = (top: number, gap = 4 * U): CSSProperties => ({position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', alignItems: 'center', gap});

// ================================================================ 1. open

export const S1_FRAMES = 140;
const HOTBAR_ITEMS = ['diamond_sword', 'bow', 'iron_pickaxe', 'golden_apple', 'ender_pearl', 'bread', 'water_bucket', 'enchanted_book', 'totem_of_undying'];
const TITLE = '优易库';

export const ShotOpen: FC = () => {
  const f = useCurrentFrame();
  const bars = prog(f, 0, 18, EASE.inOut) * (1 - prog(f, 112, 18, EASE.inOut) * 0.0);
  const vig = prog(f, 26, 90, EASE.inOut) * 0.62;
  const zoom = lerp(1.0, 1.07, prog(f, 0, S1_FRAMES, (t) => t));
  return (
    <Sky time="noon" vignette={vig} zoom={zoom}>
      <Twinkles x={W / 2} y={400} radius={560} count={12} size={36} seed={11} />
      {/* title: each character drops in with a squash */}
      <div style={{...centre(250, 0), transform: 'scale(1.55)'}}>
        {[...TITLE].map((ch, i) => {
          const at = 20 + i * 6;
          const t = f - at;
          const drop = t < 0 ? -700 : -700 * Math.pow(1 - clamp01(t / 7), 2);
          const sq = t >= 7 ? Math.max(0, 1 - (t - 7) / 6) : 0;
          return (
            <div key={i} style={{transform: `translateY(${drop}px) scale(${1 + sq * 0.16}, ${1 - sq * 0.22})`, transformOrigin: '50% 100%', opacity: t < 0 ? 0 : 1}}>
              <StoneTitle size={TYPE.hero}>{ch}</StoneTitle>
            </div>
          );
        })}
      </div>
      {[0, 1, 2].map((i) => (
        <Shockwave key={i} x={W / 2 + (i - 1) * 230} y={560} at={20 + (i + 1) * 6 + 7} color="#ffffff" maxR={120} life={14} width={6} />
      ))}
      <div style={{...centre(640), opacity: prog(f, 54, 10), transform: `translateY(${(1 - prog(f, 54, 12)) * 24}px)`}}>
        <OreText size={TYPE.h1} shadow>
          Minecraft 动效合集
        </OreText>
      </div>
      <div style={{...centre(760)}}>
        {['ORE UI', 'FABRIC', 'NEOFORGE', '26.x'].map((t, i) => {
          const p = prog(f, 66 + i * 5, 10, EASE.back);
          return (
            <div key={t} style={{transform: `scale(${p})`, opacity: p > 0 ? 1 : 0}}>
              <OreChip dot={[ORE.greenLight, ORE.gold, ORE.purple, '#55ffff'][i]} color={ORE.text}>
                {t}
              </OreChip>
            </div>
          );
        })}
      </div>
      {/* hotbar rises */}
      <div style={{...centre(880, U)}}>
        {HOTBAR_ITEMS.map((id, i) => {
          const p = prog(f, 86 + i * 3, 10, EASE.back);
          return (
            <div key={id} style={{transform: `translateY(${(1 - p) * 90}px)`, opacity: p > 0 ? 1 : 0}}>
              <Slot id={id} itemScale={1} frame={i === 0 ? 'slot_hover' : 'slot'} />
            </div>
          );
        })}
      </div>
      <Letterbox k={bars} size={96} />
      {TITLE.split('').map((_, i) => (
        <Sfx key={i} at={20 + i * 6 + 7} src={mcSound(`dig/stone${i + 1}`)} volume={0.7} rate={0.85} />
      ))}
      <Sfx at={20 + 7} src={mcSound('random/anvil_land')} volume={0.35} rate={1.2} />
      <Sfx at={54} src={mcSound('random/pop')} volume={0.35} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={66 + i * 5} src={mcSound('random/click')} volume={0.25} rate={1 + i * 0.1} />
      ))}
    </Sky>
  );
};

// ================================================================ 2. hotbar + tooltip

export const S2_FRAMES = 150;
export const ShotHotbar: FC = () => {
  const f = useCurrentFrame();
  const vig = 0.35 + prog(f, 0, 90, EASE.inOut) * 0.4;
  const steps = 8; // selection runs 8 -> 0
  const stepAt = (i: number) => 14 + i * 5;
  const sel = f < stepAt(0) ? -1 : Math.max(0, steps - Math.floor((f - stepAt(0)) / 5));
  const settled = sel === 0 && f > stepAt(steps - 1);
  const S = 24 * U;
  const left = (W - (9 * S + 8 * U)) / 2;
  const top = 720;
  const tipP = prog(f, 66, 8, EASE.back);
  return (
    <Sky time="dusk" vignette={vig} dim={0.18} zoom={1.03}>
      <div style={{position: 'absolute', inset: 0, transform: 'scale(1.2)', transformOrigin: '50% 52%'}}>
      <div style={{position: 'absolute', left, top: 170, display: 'flex', flexDirection: 'column', gap: 3 * U, opacity: prog(f, 4, 12)}}>
        <OreSection label="快捷栏与提示框" grow={prog(f, 6, 20)} style={{width: 9 * S + 8 * U}} />
        <OreText size={TYPE.h1} shadow>
          选中、悬停、读出信息
        </OreText>
      </div>
      <OrePanel variant="panel_glass" style={{position: 'absolute', left: left - 4 * U, top: top - 4 * U, width: 9 * S + 8 * U + 8 * U, height: S + 8 * U, opacity: prog(f, 0, 10)}} />
      {HOTBAR_ITEMS.map((id, i) => {
        const isSel = i === sel;
        const lift = isSel ? 3 * U : 0;
        return (
          <div key={id} style={{position: 'absolute', left: left + i * (S + U), top: top - lift, transform: `scale(${isSel ? 1.1 : 1})`, zIndex: isSel ? 2 : 1}}>
            <Slot id={id} frame={isSel ? 'slot_hover' : 'slot'} itemScale={prog(f, 4 + i * 2, 8, EASE.back)} />
            {i === 0 && settled && <div style={{position: 'absolute', left: (S - 16 * U) / 2, top: (S - 16 * U) / 2, width: 16 * U, height: 16 * U}}><Glint id="diamond_sword" size={16 * U} /></div>}
          </div>
        );
      })}
      {settled && (
        <div style={{position: 'absolute', left: left + S / 2 - 2 * U, bottom: H - (top - 6 * U), transform: `translateY(${(1 - tipP) * 30}px) scale(${0.9 + tipP * 0.1})`, opacity: tipP, transformOrigin: '0% 100%'}}>
          <OreTooltip
            rare
            reveal={prog(f, 70, 36, (t) => t)}
            lines={[
              {text: '钻石剑', color: '#55ffff'},
              {text: '锋利 V', color: '#aaaaaa'},
              {text: '火焰附加 II', color: '#aaaaaa'},
              {text: '+ 7 攻击伤害', color: '#5555ff'},
            ]}
          />
        </div>
      )}
      <Twinkles x={left + S / 2} y={top + S / 2} radius={110} count={6} size={28} seed={5} />
      {Array.from({length: steps + 1}, (_, i) => (
        <Sfx key={i} at={stepAt(i)} src={mcSound('random/click')} volume={0.3} rate={0.8 + i * 0.07} />
      ))}
      </div>
      <Sfx at={66} src={mcSound('ui/toast/in')} volume={0.25} rate={1.5} />
    </Sky>
  );
};

// ================================================================ 3. crafting

export const S3_FRAMES = 160;
export const ShotCraft: FC = () => {
  const f = useCurrentFrame();
  const S = 24 * U;
  const gap = U;
  const gx = 520;
  const gy = 330;
  const slotXY = (c: number, r: number): [number, number] => [gx + c * (S + gap), gy + r * (S + gap)];
  const ingredients = [
    {id: 'diamond', c: 1, r: 0, at: 14},
    {id: 'diamond', c: 1, r: 1, at: 22},
    {id: 'stick', c: 1, r: 2, at: 30},
  ];
  const fill = prog(f, 62, 40, EASE.inOut);
  const done = f >= 104;
  const resX = 1190;
  const resY = gy + S + gap - 12;
  const pop = prog(f, 104, 14, EASE.back);
  return (
    <OreBg>
      <div style={{position: 'absolute', inset: 0, transform: 'scale(1.22)', transformOrigin: '50% 42%'}}>
      <div style={{position: 'absolute', left: 420, top: 120, width: 1080, opacity: prog(f, 0, 12)}}>
        <OreSection label="合成" grow={prog(f, 0, 24)} />
      </div>
      <OrePanel variant="panel_raised" style={{position: 'absolute', left: 420, top: 190, width: 1080, height: 560, transform: `scale(${0.96 + prog(f, 0, 14) * 0.04})`, opacity: prog(f, 0, 10)}} />
      {/* 3x3 grid */}
      {Array.from({length: 9}, (_, i) => {
        const [x, y] = slotXY(i % 3, Math.floor(i / 3));
        return <Slot key={i} frame={i % 3 === 1 ? 'slot_target' : 'slot'} style={{position: 'absolute', left: x, top: y, opacity: prog(f, 4 + (i % 3) * 3 + Math.floor(i / 3) * 3, 8)}} />;
      })}
      {ingredients.map((g, i) => {
        const [x, y] = slotXY(g.c, g.r);
        const p = prog(f, g.at, 16, EASE.out);
        // fly in along an arc from below the panel
        const sx = x + (i - 1) * 220;
        const sy = 960;
        const cx = lerp(sx, x, p);
        const cy = lerp(sy, y, p) - Math.sin(p * Math.PI) * 160;
        if (f < g.at) return null;
        return (
          <div key={i} style={{position: 'absolute', left: cx + (S - 16 * U) / 2, top: cy + (S - 16 * U) / 2, transform: `scale(${lerp(1.5, 1, p)}) rotate(${(1 - p) * 40}deg)`, opacity: clamp01(p * 4), filter: p < 1 ? 'drop-shadow(0 12px 0 rgba(0,0,0,0.3))' : undefined}}>
            <ItemImg id={g.id} />
          </div>
        );
      })}
      {/* arrow = progress bar */}
      <div style={{position: 'absolute', left: 880, top: gy + S + gap + 12, opacity: prog(f, 40, 10)}}>
        <OreProgress value={fill} width={200} color="gold" />
      </div>
      <div style={{position: 'absolute', left: 880, top: gy + S + gap - 40, opacity: prog(f, 40, 10)}}>
        <LabelSmall>{fill < 1 ? '正在合成…' : '完成'}</LabelSmall>
      </div>
      {/* result */}
      <div style={{position: 'absolute', left: resX, top: resY, transform: `scale(${done ? lerp(1.25, 1, pop) : 1})`}}>
        <Slot frame={done ? 'slot_hover' : 'slot'} size={32 * U} />
        {done && (
          <div style={{position: 'absolute', left: 8 * U, top: 8 * U, transform: `scale(${pop * 1.5})`}}>
            <ItemImg id="diamond_sword" />
            <Glint id="diamond_sword" size={16 * U} />
          </div>
        )}
      </div>
      <PixelBurst x={resX + 64} y={resY + 64} at={104} count={50} colors={['#ffffff', '#55ffff', '#aaf6ff', '#ffff55']} speed={24} life={36} size={14} seed={9} />
      <Shockwave x={resX + 64} y={resY + 64} at={104} color="#aaf6ff" maxR={220} life={18} width={8} />
      <Flash at={104} life={8} peak={0.35} />
      {done && (
        <div style={{position: 'absolute', left: resX + 150, top: resY - 10, opacity: prog(f, 112, 8), transform: `translateX(${(1 - prog(f, 112, 10)) * -20}px)`}}>
          <OreTooltip rare lines={[{text: '钻石剑', color: '#55ffff'}, {text: '+ 7 攻击伤害', color: '#5555ff'}]} />
        </div>
      )}
      <div style={{position: 'absolute', left: 420, top: 790, width: 1080, textAlign: 'center', opacity: prog(f, 20, 14)}}>
        <OreText size={TYPE.body} color={ORE.dim} shadow>
          两颗钻石加一根木棍
        </OreText>
      </div>
      </div>
      {ingredients.map((g) => (
        <Sfx key={g.at} at={g.at + 12} src={mcSound('dig/stone1')} volume={0.4} rate={1 + g.at / 100} />
      ))}
      <Sfx at={62} src={mcSound('block/smithing_table/smithing_table1')} volume={0.5} />
      <Sfx at={104} src={mcSound('random/anvil_use')} volume={0.45} rate={1.2} />
      <Sfx at={104} src={mcSound('random/levelup')} volume={0.4} rate={1.2} />
    </OreBg>
  );
};

// ================================================================ 4. toasts + xp

export const S4_FRAMES = 140;
type Toast = {at: number; icon: string; title: string; text: string; color: string};
const TOASTS: Toast[] = [
  {at: 8, icon: 'diamond', title: '进度达成！', text: '钻石！', color: '#f8af2b'},
  {at: 38, icon: 'enchanted_book', title: '进度达成！', text: '附魔师', color: '#f8af2b'},
  {at: 68, icon: 'netherite_ingot', title: '挑战完成！', text: '用下界合金覆盖我', color: '#c06bff'},
];

const ToastCard: FC<{t: Toast; f: number; y: number}> = ({t, f, y}) => {
  const inP = prog(f, t.at, 14, EASE.out);
  const out = prog(f, t.at + 52, 12, EASE.in);
  const x = lerp(W, W - 620 - 40, inP) + out * 700;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 620}}>
      <OrePanel variant="panel_raised" style={{display: 'flex', alignItems: 'center', gap: 5 * U, padding: `${4 * U}px ${5 * U}px`}}>
        <Slot id={t.icon} frame="slot_target" />
        <div style={{display: 'flex', flexDirection: 'column', gap: 2 * U}}>
          <OreText size={TYPE.body} color={t.color} shadow>
            {t.title}
          </OreText>
          <OreText size={TYPE.body} shadow>
            {t.text}
          </OreText>
        </div>
      </OrePanel>
    </div>
  );
};

export const ShotToast: FC = () => {
  const f = useCurrentFrame();
  const barW = 182 * 8;
  const barX = (W - barW) / 2;
  const barY = 900;
  const orbs = TOASTS.flatMap((t, ti) =>
    Array.from({length: 6}, (_, k) => {
      const r = mulberry32(400 + ti * 10 + k);
      const start = t.at + 14 + k * 3;
      const life = 22;
      return {start, life, sx: W - 340 + (r() - 0.5) * 200, sy: 190 + ti * 150 + (r() - 0.5) * 60, ex: barX + barW * (0.18 + 0.28 * ti) + r() * 60, ey: barY + 10, bend: (r() - 0.5) * 300, s: 3 + Math.floor(r() * 3)};
    }),
  );
  const arrived = orbs.filter((o) => f >= o.start + o.life).length;
  const xp = clamp01(arrived / orbs.length);
  const level = 27 + Math.min(3, Math.floor(xp * 3.99));
  const lvPop = [0.33, 0.66, 0.99].reduce((s, th) => s + (Math.abs(xp - th) < 0.03 ? 1 : 0), 0);
  return (
    <Sky time="noon" vignette={0.55} dim={0.28} zoom={1.04}>
      {TOASTS.map((t, i) => (
        <ToastCard key={i} t={t} f={f} y={80 + i * 190} />
      ))}
      <div style={{position: 'absolute', left: 120, top: 330, opacity: prog(f, 2, 14)}}>
        <OreSection label="成就与经验" grow={prog(f, 2, 24)} style={{width: 760}} />
        <div style={{height: 3 * U}} />
        <OreText size={TYPE.h1} shadow>
          每一步都有反馈
        </OreText>
      </div>
      {/* orbs */}
      {orbs.map((o, i) => {
        const t = (f - o.start) / o.life;
        if (t < 0 || t > 1) return null;
        const e = EASE.in(t) * 0.85 + t * 0.15;
        const x = lerp(o.sx, o.ex, e);
        const y = lerp(o.sy, o.ey, e) + Math.sin(t * Math.PI) * o.bend;
        const s = o.s * 8;
        return (
          <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, background: i % 2 ? '#a8ff3c' : '#6cc349', boxShadow: `0 0 ${s * 1.2}px #b6ff5a, inset ${s / 4}px ${s / 4}px 0 #e9ffb0`}} />
        );
      })}
      {/* xp bar (vanilla sprite scaled x8) */}
      <div style={{position: 'absolute', left: barX, top: barY, width: barW, height: 5 * 8, imageRendering: 'pixelated', opacity: prog(f, 20, 12)}}>
        <Img src={hudTex('experience_bar_background')} style={{width: barW, height: 40, imageRendering: 'pixelated', position: 'absolute'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: barW * xp, height: 40, overflow: 'hidden'}}>
          <Img src={hudTex('experience_bar_progress')} style={{width: barW, height: 40, imageRendering: 'pixelated'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: barY - 110, textAlign: 'center', transform: `scale(${1 + lvPop * 0.5 + (xp >= 0.99 ? 0.3 : 0)})`, transition: 'none'}}>
        <OutlineText size={96} color="#80ff20">
          {String(level)}
        </OutlineText>
      </div>
      <Shockwave x={W / 2} y={barY - 40} at={TOASTS[2].at + 14 + 5 * 3 + 22} color="#b6ff5a" maxR={340} life={22} width={10} />
      <Flash at={TOASTS[2].at + 14 + 5 * 3 + 22} life={10} color="#d6ff9a" peak={0.3} />
      {TOASTS.map((t) => (
        <Sfx key={t.at} at={t.at} src={mcSound(t.at === 68 ? 'ui/toast/challenge_complete' : 'ui/toast/in')} volume={0.5} />
      ))}
      {orbs.map((o, i) => (
        <Sfx key={i} at={o.start + o.life} src={mcSound('random/orb')} volume={0.18} rate={0.9 + (i % 6) * 0.08} />
      ))}
      <Sfx at={TOASTS[2].at + 14 + 5 * 3 + 22} src={mcSound('random/levelup')} volume={0.5} />
    </Sky>
  );
};

// ================================================================ 5. settings UI interaction

export const S5_FRAMES = 160;
const PANEL = {x: 460, y: 200, w: 1000, h: 640};
const TABS = ['画面', '音频', '控制', '模组'];
const ROW_W = PANEL.w - 2 * 12 * U;

const Row: FC<{label: string; children: ReactNode; show: number}> = ({label, children, show}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 22 * U, opacity: show, transform: `translateX(${(1 - show) * -40}px)`}}>
    <OreText size={TYPE.body} shadow>
      {label}
    </OreText>
    {children}
  </div>
);

export const ShotSettings: FC = () => {
  const f = useCurrentFrame();
  const page = f < 78 ? 0 : 1;
  const pageF = page === 0 ? f : f - 78;
  const tabCenter = (i: number) => PANEL.x + 20 + i * 208 + 100;
  const [cx, cy] = cursorAt(f, [
    [0, 1500, 700],
    [22, 1356, 372],
    [50, 1212, 466],
    [58, 1212, 466],
    [76, tabCenter(1), 168],
    [110, 1110, 700],
    [124, 1292, 790],
    [160, 1300, 800],
  ]);
  const vsync = f < 30 ? 0 : 1; // flips on at click
  const toggleAnim = (at: number) => prog(f, at, 6, EASE.out);
  const dist = lerp(0.3, 0.78, prog(f, 30, 24, EASE.inOut));
  const vol = lerp(0.8, 0.5, prog(f, 96, 20, EASE.inOut));
  const clickFrames = [30, 76, 124];
  const applyHover = f >= 118 && f < 124;
  const applyPress = f >= 124 && f < 132;
  const toast = prog(f, 130, 10, EASE.back);
  const rowShow = (i: number) => prog(pageF, 4 + i * 4, 10);
  return (
    <OreBg>
      <div style={{position: 'absolute', inset: 0, transform: 'scale(1.22)', transformOrigin: '50% 48%'}}>
      <div style={{position: 'absolute', left: PANEL.x, top: 70, opacity: prog(f, 0, 14)}}>
        <OreSection label="设置界面" grow={prog(f, 0, 24)} style={{width: PANEL.w}} />
      </div>
      <div style={{position: 'absolute', left: PANEL.x + 20, top: PANEL.y - 52, display: 'flex', gap: U, opacity: prog(f, 2, 10), zIndex: 2}}>
        {TABS.map((t, i) => (
          <Tab key={t} selected={i === page} width={200}>
            {t}
          </Tab>
        ))}
      </div>
      <OrePanel variant="panel" style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, padding: 12 * U, transform: `translateY(${(1 - prog(f, 0, 14)) * 40}px)`, opacity: prog(f, 0, 10)}}>
        <div style={{width: ROW_W, display: 'flex', flexDirection: 'column', gap: 2 * U}}>
          {page === 0 ? (
            <>
              <Row label="垂直同步" show={rowShow(0)}>
                <Toggle on={vsync ? toggleAnim(30) : 0} />
              </Row>
              <Row label="渲染距离" show={rowShow(1)}>
                <Slider value={dist} width={400} />
              </Row>
              <Row label="光影" show={rowShow(2)}>
                <Toggle on={1} />
              </Row>
              <Row label="云" show={rowShow(3)}>
                <Toggle on={0} />
              </Row>
            </>
          ) : (
            <>
              <Row label="主音量" show={rowShow(0)}>
                <Slider value={0.8} width={400} />
              </Row>
              <Row label="音乐" show={rowShow(1)}>
                <Slider value={vol} width={400} />
              </Row>
              <Row label="环境音" show={rowShow(2)}>
                <Toggle on={1} />
              </Row>
              <Row label="字幕" show={rowShow(3)}>
                <Toggle on={0} />
              </Row>
            </>
          )}
        </div>
        <div style={{position: 'absolute', right: 12 * U, bottom: 8 * U, display: 'flex', gap: 6 * U}}>
          <OreButton variant="neutral" width={200}>
            重置
          </OreButton>
          <OreButton variant="primary" width={240} state={applyPress ? 'pressed' : applyHover ? 'hover' : 'normal'}>
            应用
          </OreButton>
        </div>
      </OrePanel>
      <div style={{position: 'absolute', left: PANEL.x + PANEL.w - 560, top: PANEL.y + PANEL.h + 30, transform: `translateY(${(1 - toast) * 30}px) scale(${toast})`, opacity: toast, transformOrigin: '100% 0%'}}>
        <OreChip dot={ORE.greenLight} color={ORE.text}>
          设置已保存
        </OreChip>
      </div>
      {clickFrames.map((c) => {
        const [x, y] = cursorAt(c, [
          [0, 1500, 700],
          [22, 1356, 372],
          [50, 1212, 466],
          [58, 1212, 466],
          [76, tabCenter(1), 168],
          [110, 1110, 700],
          [124, 1292, 790],
          [160, 1300, 800],
        ]);
        return <Ripple key={c} at={c} x={x} y={y} />;
      })}
      <PixelCursor x={cx} y={cy} />
      </div>
      {clickFrames.map((c) => (
        <Sfx key={c} at={c} src={mcSound('random/click')} volume={0.5} rate={c === 124 ? 0.9 : 1.1} />
      ))}
      <Sfx at={130} src={mcSound('ui/toast/in')} volume={0.3} rate={1.4} />
    </OreBg>
  );
};

// keep a reference so the unused-import checker is satisfied when fonts change
void PIXEL8_FONT;
void nine;
