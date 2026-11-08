import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {tex} from '../mc/assets';
import {Flash, PixelBurst, Shockwave, Twinkles} from '../mc/Fx';
import {EASE, clamp01, mulberry32} from '../mc/theme';
import {CycleBackdrop} from '../mg/DayCycle';
import {ORE, OreButton, OreChip, OrePanel, OreProgress, OreSection, OreText, PixelCursor, Splash, StoneTitle, TYPE, U} from '../mg/Ore';
import {Glint, Ripple, cursorAt} from './shotsA';
import {ItemImg, LabelSmall, Letterbox, OreBg, OreTooltip, OutlineText, Sfx, Sky, Vignette, lerp, mcSound, prog} from './kit';

/** Shots 6-10 of the effects reel. */

const W = 1920;
const H = 1080;

// ================================================================ 6. main menu

export const S6_FRAMES = 150;
const MENU = ['单人游戏', '多人游戏', '模组', '设置'];

export const ShotMenu: FC = () => {
  const f = useCurrentFrame();
  const vig = 0.4 + prog(f, 0, 80, EASE.inOut) * 0.3;
  const bw = 140 * U;
  const bx = (W - bw) / 2;
  const by = (i: number) => 470 + i * 26 * U + (i === 3 ? 6 * U : 0);
  const hover = f < 56 ? -1 : f < 70 ? 1 : f < 84 ? 2 : f < 98 ? 3 : f < 112 ? 0 : 0;
  const press = f >= 112 && f < 122;
  const cur = cursorAt(f, [
    [0, 1300, 900],
    [56, bx + bw - 150, by(1) + 30],
    [70, bx + bw - 150, by(2) + 30],
    [84, bx + bw - 150, by(3) + 30],
    [98, bx + 220, by(0) + 30],
    [112, bx + 220, by(0) + 30],
    [150, bx + 240, by(0) + 40],
  ]);
  const titleY = lerp(-320, 110, prog(f, 4, 22, EASE.back));
  return (
    <Sky time="night" vignette={vig} zoom={lerp(1.02, 1.1, prog(f, 0, 150, (t) => t))}>
      <Twinkles x={W / 2} y={300} radius={700} count={14} size={30} seed={21} />
      <div style={{position: 'absolute', left: 0, right: 0, top: titleY, display: 'flex', justifyContent: 'center', transform: 'scale(1.4)'}}>
        {[...'优易库'].map((c, i) => (
          <StoneTitle key={i} size={TYPE.hero}>
            {c}
          </StoneTitle>
        ))}
      </div>
      <Splash f={f} x={W / 2 + 470} y={titleY + 330} pop={prog(f, 26, 12, EASE.back)} size={TYPE.body}>
        新特效上线！
      </Splash>
      {MENU.map((label, i) => {
        const from = i % 2 ? 1 : -1;
        const p = prog(f, 14 + i * 6, 16, EASE.back);
        const isHover = hover === i;
        const state = i === 0 && press ? 'pressed' : isHover ? 'hover' : 'normal';
        return (
          <div key={label} style={{position: 'absolute', left: bx + from * (1 - p) * 900, top: by(i), opacity: clamp01(p * 3)}}>
            <OreButton variant={i === 0 ? 'primary' : 'neutral'} state={state} width={bw}>
              {label}
            </OreButton>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 40, bottom: 30, opacity: prog(f, 40, 12)}}>
        <LabelSmall color="#cfd6e8">优易库 1.0 · Minecraft 26.1</LabelSmall>
      </div>
      <Ripple at={112} x={bx + 220} y={by(0) + 30} />
      <Flash at={112} life={8} peak={0.35} />
      <PixelCursor x={cur[0]} y={cur[1]} />
      {MENU.map((_, i) => (
        <Sfx key={i} at={14 + i * 6} src={mcSound('random/pop')} volume={0.3} rate={0.9 + i * 0.1} />
      ))}
      {[56, 70, 84, 98].map((a, i) => (
        <Sfx key={a} at={a} src={mcSound('random/click')} volume={0.2} rate={1.2 + i * 0.05} />
      ))}
      <Sfx at={112} src={mcSound('random/click')} volume={0.55} rate={0.8} />
      <Sfx at={4} src={mcSound('random/anvil_land')} volume={0.3} rate={1.1} />
    </Sky>
  );
};

// ================================================================ 7. day cycle

export const S7_FRAMES = 150;
const PHASES = [
  {name: '清晨', time: 'dawn' as const},
  {name: '正午', time: 'noon' as const},
  {name: '黄昏', time: 'dusk' as const},
  {name: '夜晚', time: 'night' as const},
];

export const ShotDayCycle: FC = () => {
  const f = useCurrentFrame();
  const t = clamp01(f / 140); // 0..1 across the whole day
  const o = (i: number) => {
    // crossfade centred at i/3 of the timeline
    const c = i / 3;
    return clamp01(1 - Math.abs(t - c) * 3);
  };
  const minutes = Math.round(6 * 60 + EASE.inOut(t) * 18 * 60);
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  const cur = Math.min(3, Math.round(t * 3));
  const night = o(3);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${lerp(1, 1.12, t)})`}}>
        {PHASES.map((p, i) => (
          <AbsoluteFill key={p.time} style={{opacity: o(i) > 0.002 ? (i === 0 ? Math.max(o(0), t < 0.05 ? 1 : 0) : o(i)) : 0}}>
            <CycleBackdrop time={p.time} options={{rays: false}} />
          </AbsoluteFill>
        ))}
      </AbsoluteFill>
      <Vignette s={0.25 + night * 0.45} color="4,6,24" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', opacity: prog(f, 4, 12), transform: `translateY(${(1 - prog(f, 4, 14)) * -40}px)`}}>
        <OrePanel variant="panel_glass" style={{display: 'flex', alignItems: 'center', gap: 8 * U, padding: `${4 * U}px ${10 * U}px`}}>
          <OreChip color={ORE.text} dot={ORE.gold}>
            第 1 天
          </OreChip>
          <OreText size={TYPE.hero} shadow>
            {`${hh}:${mm}`}
          </OreText>
          <OreText size={TYPE.body} color={ORE.dim} shadow>
            {PHASES[cur].name}
          </OreText>
        </OrePanel>
      </div>
      <div style={{position: 'absolute', left: 460, right: 460, bottom: 150, opacity: prog(f, 8, 12)}}>
        <OreProgress value={t} width={1000} color="gold" />
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 3 * U}}>
          {PHASES.map((p, i) => (
            <LabelSmall key={p.name} color={i === cur ? ORE.text : ORE.faint}>
              {p.name}
            </LabelSmall>
          ))}
        </div>
      </div>
      <Sfx at={60} src={mcSound('step/grass1')} volume={0.2} />
      <Sfx at={100} src={mcSound('ambient/weather/thunder1')} volume={0.08} rate={0.5} />
    </AbsoluteFill>
  );
};

// ================================================================ 8. enchant

export const S8_FRAMES = 150;
const runeBits = (seed: number) => {
  const r = mulberry32(seed);
  const rows: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const half = [r() > 0.45, r() > 0.45, r() > 0.4];
    rows.push([half[0], half[1], half[2], half[1], half[0]]);
  }
  return rows;
};
const RUNES = Array.from({length: 18}, (_, i) => runeBits(300 + i));

const Rune: FC<{bits: boolean[][]; size: number; color: string}> = ({bits, size, color}) => (
  <div style={{width: size * 5, height: size * 5, position: 'relative'}}>
    {bits.flatMap((row, y) => row.map((b, x) => (b ? <div key={`${x}-${y}`} style={{position: 'absolute', left: x * size, top: y * size, width: size, height: size, background: color, boxShadow: `0 0 ${size * 2}px ${color}`}} /> : null)))}
  </div>
);

export const ShotEnchant: FC = () => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 14) * 14;
  const rise = prog(f, 0, 22, EASE.back);
  const cx = 780;
  const cy = 520;
  const size = 320;
  const tipP = prog(f, 64, 10, EASE.back);
  return (
    <OreBg tone="purple">
      <Vignette s={0.65} color="10,0,24" />
      {/* orbiting runes, two rings turning opposite ways */}
      {RUNES.map((bits, i) => {
        const ring = i < 10 ? 0 : 1;
        const n = ring === 0 ? 10 : 8;
        const k = ring === 0 ? i : i - 10;
        const R = ring === 0 ? 400 : 290;
        const a = (k / n) * Math.PI * 2 + f * (ring === 0 ? 0.012 : -0.018);
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(f / 18 + i));
        return (
          <div key={i} style={{position: 'absolute', left: cx + Math.cos(a) * R * 1.15 - 20, top: cy + bob * 0.4 + Math.sin(a) * R * 0.62 - 20, opacity: tw * prog(f, 6 + i, 14), transform: `scale(${prog(f, 6 + i, 14, EASE.back)})`}}>
            <Rune bits={bits} size={8} color={ring === 0 ? '#c9a0ff' : '#7fdcff'} />
          </div>
        );
      })}
      <div style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2 + bob - (1 - rise) * 260, width: size, height: size, transform: `rotate(${Math.sin(f / 20) * 6}deg) scale(${rise})`, filter: 'drop-shadow(0 0 36px rgba(180,100,255,0.85))'}}>
        <ItemImg id="netherite_sword" size={size} />
        <Glint id="netherite_sword" size={size} speed={3} />
      </div>
      <Twinkles x={cx} y={cy} radius={300} count={14} size={36} seed={77} />
      <PixelBurst x={cx} y={cy} at={22} count={36} colors={['#c9a0ff', '#7fdcff', '#ffffff']} speed={20} life={34} size={12} gravity={0.1} seed={5} />
      <Shockwave x={cx} y={cy} at={22} color="#c9a0ff" maxR={420} life={26} width={8} />
      <div style={{position: 'absolute', left: 1130, top: 330, transform: `translateX(${(1 - tipP) * 80}px) scale(${0.92 + tipP * 0.08})`, opacity: tipP, transformOrigin: '0% 50%'}}>
        <OreTooltip
          rare
          reveal={prog(f, 70, 40, (t) => t)}
          lines={[
            {text: '下界合金剑', color: '#ff55ff'},
            {text: '锋利 V', color: '#aaaaaa'},
            {text: '火焰附加 II', color: '#aaaaaa'},
            {text: '抢夺 III', color: '#aaaaaa'},
            {text: ' '},
            {text: '+ 8 攻击伤害', color: '#5555ff'},
          ]}
        />
      </div>
      <div style={{position: 'absolute', left: 1130, top: 760, width: 520, opacity: prog(f, 100, 14)}}>
        <OreSection label="附魔等级" grow={prog(f, 100, 20)} />
        <div style={{height: 2 * U}} />
        <OreProgress value={prog(f, 104, 30, EASE.inOut)} width={520} color="blue" />
      </div>
      <div style={{position: 'absolute', left: 80, top: 80, opacity: prog(f, 0, 14)}}>
        <OreText size={TYPE.h1} shadow>
          附魔光效
        </OreText>
      </div>
      <Sfx at={22} src={mcSound('block/smithing_table/smithing_table2')} volume={0.4} rate={1.1} />
      <Sfx at={22} src={mcSound('random/levelup')} volume={0.45} rate={0.8} />
      <Sfx at={64} src={mcSound('ui/toast/in')} volume={0.25} rate={1.6} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={80 + i * 9} src={mcSound('random/orb')} volume={0.2} rate={0.9 + i * 0.2} />
      ))}
    </OreBg>
  );
};

// ================================================================ 9. HUD damage + totem

export const S9_FRAMES = 130;
const HURT = 18;
const TOTEM = 58;
export const ShotHud: FC = () => {
  const f = useCurrentFrame();
  const S = 6;
  const heartsX = 720;
  const heartsY = 880;
  const hurtK = f < HURT ? 0 : Math.pow(1 - clamp01((f - HURT) / 40), 1.5);
  const lowPulse = f > HURT + 10 && f < TOTEM ? 0.35 + 0.2 * Math.sin(f * 0.7) : 0;
  const heal = (i: number) => f >= TOTEM + 18 + i * 3;
  // hearts 9..0 left to right; after the hit only 3 remain
  const heartState = (i: number): 'full' | 'gone' | 'break' => {
    if (f < HURT) return 'full';
    if (i < 3) return 'full';
    if (heal(i)) return 'full';
    const brk = HURT + (9 - i) * 2;
    if (f >= brk && f < brk + 8) return 'break';
    return 'gone';
  };
  const bossValue = f < HURT ? 0.9 : lerp(0.9, 0.55, prog(f, HURT, 12));
  const dmg = prog(f, HURT, 28, EASE.out);
  const shake = f >= HURT && f < HURT + 14 ? (mulberry32(f)() - 0.5) * 26 * (1 - (f - HURT) / 14) : 0;
  const totemP = prog(f, TOTEM, 12, EASE.back);
  const totemOut = prog(f, TOTEM + 28, 12, EASE.in);
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
      <Sky time="dusk" vignette={0.3} dim={0.12} zoom={1.05}>
        <Vignette s={Math.min(1, hurtK * 1.2 + lowPulse)} color="140,0,0" />
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 * U, opacity: prog(f, 0, 12)}}>
          <OreText size={TYPE.body} shadow>
            末影龙
          </OreText>
          <OreProgress value={bossValue} width={460 * 2} color="red" />
        </div>
        <div style={{position: 'absolute', left: 120, top: 280, opacity: prog(f, 2, 14)}}>
          <OreSection label="受伤与复活" grow={prog(f, 2, 24)} style={{width: 640}} />
          <div style={{height: 3 * U}} />
          <OreText size={TYPE.h1} shadow>
            暗角跟着血量呼吸
          </OreText>
        </div>
        {/* hearts strip */}
        <OrePanel variant="panel_glass" style={{position: 'absolute', left: heartsX - 4 * U, top: heartsY - 4 * U, width: 10 * 8 * S + 4 * U + 8 * U, height: 9 * S + 8 * U, opacity: prog(f, 0, 12)}} />
        {Array.from({length: 10}, (_, i) => {
          const st = heartState(i);
          const brk = st === 'break';
          const healed = f >= TOTEM + 18 + i * 3 && f < TOTEM + 18 + i * 3 + 8;
          return (
            <div key={i} style={{position: 'absolute', left: heartsX + i * 8 * S + 4, top: heartsY + (brk ? -10 : 0) - (healed ? 12 : 0), transform: `scale(${brk ? 1.4 : healed ? 1.25 : 1})`, opacity: st === 'gone' ? 0.0 : 1}}>
              <Img src={tex('gui/sprites/hud/heart/container.png')} style={{width: 9 * S, height: 9 * S, imageRendering: 'pixelated', position: 'absolute', opacity: st === 'gone' ? 1 : 1}} />
              {st !== 'gone' && <Img src={tex(`gui/sprites/hud/heart/${brk ? 'full_blinking' : 'full'}.png`)} style={{width: 9 * S, height: 9 * S, imageRendering: 'pixelated', position: 'absolute'}} />}
            </div>
          );
        })}
        {Array.from({length: 7}, (_, k) => {
          const i = 3 + k;
          if (f < HURT + (9 - i) * 2 || f > HURT + (9 - i) * 2 + 8) return null;
          return <PixelBurst key={k} x={heartsX + i * 8 * S + 24} y={heartsY + 20} at={HURT + (9 - i) * 2} count={10} colors={['#ff3b3b', '#a80000', '#ffffff']} speed={10} life={20} size={8} seed={30 + k} />;
        })}
        {/* floating damage number */}
        {f >= HURT && (
          <div style={{position: 'absolute', left: 1040, top: 420 - dmg * 140, opacity: 1 - prog(f, HURT + 22, 14, (t) => t), transform: `scale(${1 + (1 - dmg) * 0.8})`}}>
            <OutlineText size={144} color="#ff5555">
              -14
            </OutlineText>
          </div>
        )}
        {/* totem */}
        {f >= TOTEM && f < TOTEM + 44 && (
          <div style={{position: 'absolute', left: 1300 - 200, top: H / 2 - 260 - totemOut * 120, width: 400, height: 400, transform: `scale(${totemP * (1 - totemOut * 0.5)})`, opacity: 1 - totemOut, filter: 'drop-shadow(0 0 40px rgba(255,220,80,0.9))'}}>
            <ItemImg id="totem_of_undying" size={400} />
          </div>
        )}
        <PixelBurst x={1300} y={H / 2 - 60} at={TOTEM} count={70} colors={['#ffe14d', '#b6ff5a', '#ffffff', '#6cc349']} speed={26} life={40} size={16} gravity={0.15} seed={44} />
        <Flash at={TOTEM} life={14} color="#fff3a0" peak={0.7} />
        <Flash at={HURT} life={8} color="#ff3030" peak={0.45} />
        <Shockwave x={1300} y={H / 2 - 60} at={TOTEM} color="#ffe14d" maxR={620} life={24} width={12} />
      </Sky>
      <Sfx at={HURT} src={mcSound('random/explode1')} volume={0.4} rate={0.5} />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <Sfx key={k} at={HURT + (6 - k) * 2} src={mcSound('random/pop')} volume={0.25} rate={0.6 + k * 0.05} />
      ))}
      <Sfx at={TOTEM} src={mcSound('ui/toast/challenge_complete')} volume={0.55} />
      <Sfx at={TOTEM} src={mcSound('random/levelup')} volume={0.4} rate={1.3} />
      {[0, 3, 6, 9, 12, 15, 18].map((d) => (
        <Sfx key={d} at={TOTEM + 18 + d} src={mcSound('random/orb')} volume={0.18} rate={1 + d / 40} />
      ))}
    </AbsoluteFill>
  );
};

// ================================================================ 10. end card

export const S10_FRAMES = 140;
export const ShotEnd: FC = () => {
  const f = useCurrentFrame();
  const bars = prog(f, 90, 24, EASE.inOut);
  const fade = prog(f, 114, 26, EASE.inOut);
  const panelP = prog(f, 4, 18, EASE.back);
  const [cx, cy] = cursorAt(f, [
    [0, 1500, 800],
    [34, 1060, 640],
    [52, 1060, 640],
    [62, 1250, 640],
    [80, 1250, 640],
  ]);
  const hoverIdx = f >= 34 && f < 62 ? 0 : f >= 62 ? 1 : -1;
  return (
    <Sky time="dawn" vignette={0.2 + prog(f, 30, 90, EASE.inOut) * 0.5} zoom={lerp(1.08, 1.0, prog(f, 0, 140, (t) => t))}>
      <Twinkles x={W / 2} y={420} radius={620} count={14} size={34} seed={63} />
      <div style={{position: 'absolute', left: W / 2 - 560, top: 230, width: 1120, transform: `scale(${panelP})`, opacity: clamp01(panelP * 2)}}>
        <OrePanel variant="panel_raised" style={{padding: `${10 * U}px ${12 * U}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * U}}>
          <OreText size={TYPE.hero} shadow>
            感谢观看
          </OreText>
          <OreText size={TYPE.body} color={ORE.dim} shadow>
            觉得有用？点个关注，下期继续做特效
          </OreText>
          <div style={{display: 'flex', gap: 6 * U, marginTop: 4 * U}}>
            <OreButton variant="primary" width={180 * 1.0} state={hoverIdx === 0 ? 'hover' : 'normal'}>
              关注
            </OreButton>
            <OreButton variant="neutral" width={180 * 1.0} state={hoverIdx === 1 ? (f > 78 ? 'pressed' : 'hover') : 'normal'}>
              收藏
            </OreButton>
          </div>
          <div style={{display: 'flex', gap: 3 * U}}>
            {['ORE UI', '方块工坊', 'EP.01'].map((t, i) => (
              <OreChip key={t} dot={[ORE.greenLight, ORE.gold, ORE.purple][i]} color={ORE.text}>
                {t}
              </OreChip>
            ))}
          </div>
        </OrePanel>
      </div>
      <Ripple at={52} x={1060} y={640} />
      <Ripple at={80} x={1250} y={640} />
      <PixelCursor x={cx} y={cy} />
      <Letterbox k={bars} size={120} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Sfx at={4} src={mcSound('random/levelup')} volume={0.35} rate={1.1} />
      <Sfx at={52} src={mcSound('random/click')} volume={0.5} />
      <Sfx at={80} src={mcSound('random/click')} volume={0.5} rate={0.9} />
      <Sfx at={90} src={mcSound('dig/stone2')} volume={0.4} rate={0.6} />
    </Sky>
  );
};

void Img;
