import {type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT, RAINBOW, SPRITES, type Sprite} from '../../flat';
import {PLANE_TAIL, PlaneSp, Ribbon} from './pixelplane';
import {At, CHECK, Click, Hand, HEART_BIG, HEART_PINK, INK, ItemSp, Label, Mob, Odometer, Orn, Particles, STAR_BIG, Sp, Stage, Sunburst, bob, chunky, disc, lerp, makeBurst, rangeP, spring, track, useList, wobble} from './common';

/**
 * soc-share: a round "分享" button is pressed; a pixel paper plane pops out, flies a long arc across the sky and
 * dives into one of five share targets on a shelf. Its rainbow trail is a pixel-grid ribbon emitted from the plane's
 * tail every frame (see pixelplane.tsx), so the six bands stay parallel and glued to the flight path. The target hops
 * and shows a check; hearts and little papers fly, "分享成功" pops. Clouds and real-texture mobs fill the edges.
 * Props: bg, target (0-4, which icon is hit), launchAt (frame the plane leaves the button), flight (frames in the air), labels (5 icon captions),
 * buttonText, forwardLabel / forwardCount (counter under the button), successText, audio (play the sound effects).
 */

const CHAT: Sprite = {
  rows: ['.WWWWWWW.', 'WWWWWWWWW', 'WWgWWWgWW', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.', '..WWW....', '..W......'].map((r) => r),
  palette: {W: '#ffffff', g: FLAT.green},
};
const LENS = disc(11, '#fff4d6', FLAT.orange, '#ffffff', ['..eee..', '.e...e.', 'e.....e', 'e.....e', 'e.....e', '.e...e.', '..eee..']);

export type Target = {label: string; fill: string; deep: string; light: string};
export const DEFAULT_TARGETS: Target[] = [
  {label: '聊天', fill: FLAT.green, deep: FLAT.greenDeep, light: '#8ee79a'},
  {label: '动态', fill: FLAT.orange, deep: '#e0701c', light: '#ffc27a'},
  {label: '空间', fill: FLAT.sky, deep: FLAT.skyDeep, light: '#c4e9ff'},
  {label: '链接', fill: FLAT.pink, deep: FLAT.pinkDeep, light: '#ffa6c4'},
  {label: '更多', fill: FLAT.purple, deep: FLAT.purpleDeep, light: '#b49cff'},
];

const TargetGlyph: FC<{i: number}> = ({i}) => {
  if (i === 0) return <Sp s={CHAT} k="chat" px={9} drop={1} />;
  if (i === 1) return <Sp s={LENS} k="lens" px={8} drop={1} />;
  if (i === 2) return <Sp s={STAR_BIG} k="star" px={7} drop={1} />;
  if (i === 3)
    return (
      <svg width={110} height={80} viewBox="0 0 110 80">
        {[10, 54].map((x) => (
          <rect key={x} x={x} y={14} width={46} height={52} rx={22} fill="none" stroke={INK} strokeWidth={22} />
        ))}
        <rect x={34} y={32} width={42} height={16} fill={INK} />
        {[10, 54].map((x) => (
          <rect key={x} x={x} y={14} width={46} height={52} rx={22} fill="none" stroke="#fff" strokeWidth={10} />
        ))}
        <rect x={36} y={35} width={38} height={10} fill="#fff" />
      </svg>
    );
  return (
    <div style={{display: 'flex', gap: 12}}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{width: 24, height: 24, borderRadius: 12, background: '#fff', border: `6px solid ${INK}`, boxSizing: 'border-box'}} />
      ))}
    </div>
  );
};

const Cloud: FC<{y: number; speed: number; start: number; px: number; o?: number}> = ({y, speed, start, px, o = 1}) => {
  const f = useCurrentFrame();
  const x = ((start + f * speed) % 2800) - 450;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o}}>
      <Sp s={SPRITES.cloud} k="cloud" px={px} outline={null} />
    </div>
  );
};

export const ShareFx: FC<{bg?: boolean; target?: number; launchAt?: number; flight?: number; labels?: string[]; buttonText?: string; forwardLabel?: string; forwardCount?: number; successText?: string; audio?: boolean}> = ({
  bg,
  target = 2,
  launchAt = 32,
  flight = 54,
  labels = DEFAULT_TARGETS.map((t) => t.label),
  buttonText = '分享',
  forwardLabel = '转发',
  forwardCount = 256,
  successText = '分享成功',
  audio = true,
}) => {
  const f = useCurrentFrame();
  const land = launchAt + flight;
  const BX = 330;
  const BY = 640;
  const ROW_Y = 850;
  const XS = [800, 1000, 1200, 1400, 1600];
  const TX = XS[target];
  const TY = ROW_Y - 20;

  const P0 = [BX + 90, BY - 40];
  const P1 = [560, 40];
  const P2 = [TX - 460, 60];
  const P3 = [TX, TY - 40];
  const bez = (u: number) => {
    const k = 1 - u;
    const x = k * k * k * P0[0] + 3 * k * k * u * P1[0] + 3 * k * u * u * P2[0] + u * u * u * P3[0];
    const y = k * k * k * P0[1] + 3 * k * k * u * P1[1] + 3 * k * u * u * P2[1] + u * u * u * P3[1];
    return {x: x + Math.sin(u * Math.PI * 4) * 16 * (1 - u), y: y + Math.sin(u * Math.PI * 3) * 22 * (1 - u)};
  };
  const ease = (t: number) => t * 0.55 + EASE.inOut(t) * 0.45;
  const uAt = (fr: number) => ease(clamp01((fr - launchAt) / flight));
  const u = uAt(f);
  const head = bez(u);
  const ahead = bez(Math.min(1, u + 0.01));
  const ang = (Math.atan2(ahead.y - head.y, ahead.x - head.x) * 180) / Math.PI;
  const flying = f >= launchAt && f < land;
  const PX_PLANE = 14;
  // tail anchor of the plane at (fractional) frame tt, plus the heading of the path there
  const tailAt = (tt: number) => {
    const uu = uAt(tt);
    const h0 = bez(uu);
    const h1 = bez(Math.min(1, uu + 0.01));
    const hd = Math.atan2(h1.y - h0.y, h1.x - h0.x);
    return {x: h0.x - Math.cos(hd) * PLANE_TAIL * PX_PLANE, y: h0.y - Math.sin(hd) * PLANE_TAIL * PX_PLANE, hd};
  };

  const trailSparks = useList(() => {
    const out = [] as ReturnType<typeof makeBurst>;
    for (let t = launchAt; t < land; t += 1) {
      const p = tailAt(t);
      out.push(
        ...makeBurst({seed: 200 + t, at: t, x: p.x, y: p.y, n: 2, kinds: [`sq:${RAINBOW[t % 6]}`, 'spark:#ffffff', `sq:${RAINBOW[(t + 3) % 6]}`], speed: [1, 4], life: [18, 30], g: 0.12, size: [26, 46], spin: 10, spread: 30}),
      );
    }
    return out;
  });
  const launch = useList(() => makeBurst({seed: 210, at: launchAt, x: BX, y: BY, n: 30, kinds: ['item:paper', 'spark:#ffffff', 'heartP', 'sq:#8f6bff', 'star'], speed: [14, 38], life: [30, 56], g: 0.3, size: [40, 80], spin: 16}));
  const landBurst = useList(() => makeBurst({seed: 211, at: land, x: TX, y: TY, n: 54, kinds: ['heart', 'heartP', 'item:paper', 'star', 'spark:#ffffff', 'spark:#ffd23f', 'sq:#5ed16a', 'sq:#ffd23f'], speed: [18, 52], life: [46, 82], g: 0.45, size: [44, 100], spin: 18}));
  const confetti = useList(() => makeBurst({seed: 212, at: land + 2, x: TX, y: TY + 40, n: 40, kinds: ['conf'], colors: [...RAINBOW], speed: [26, 62], angle: [-160, -20], life: [60, 100], g: 0.7, drag: 0.94, size: [40, 70], spin: 18}));
  const rise = useList(() => makeBurst({seed: 213, at: land + 6, x: 960, y: 1150, n: 22, kinds: ['heartP', 'item:paper', 'star', 'spark:#ffffff'], speed: [12, 26], angle: [-100, -80], life: [66, 108], g: 0.2, drag: 0.96, size: [36, 84], stagger: 40, spread: 1900}));

  const btnPress = rangeP(f, launchAt - 6, 5, EASE.in) * (1 - rangeP(f, launchAt, 3));
  const btnJel = wobble(f, launchAt, 20, 3);
  const rowIn = spring(f, 6, 22);
  const hx = track(f, [[6, 760], [launchAt - 14, BX + 40], [launchAt, BX + 40], [launchAt + 14, BX + 240]], EASE.inOut);
  const hy = track(f, [[6, 1000], [launchAt - 14, BY + 90], [launchAt, BY + 90], [launchAt + 14, BY + 240]], EASE.inOut);
  const hO = rangeP(f, 6, 6) * (1 - rangeP(f, launchAt + 10, 8));
  const planeIn = spring(f, launchAt, 12);

  return (
    <Stage bg={bg} time="noon">
      {f >= land && <Sunburst x={TX} y={TY} alpha={0.28} color="255,255,255" rays={16} spin={0.5} scale={rangeP(f, land, 14)} />}

      {/* clouds: parallax at the edges */}
      <Cloud y={70} speed={1.2} start={200} px={22} o={0.9} />
      <Cloud y={170} speed={0.6} start={1500} px={12} o={0.7} />
      <Cloud y={960} speed={1.8} start={900} px={26} o={0.9} />
      <Cloud y={760} speed={0.8} start={2200} px={14} o={0.7} />

      {/* speed lines + little background planes while the hero plane is in the air */}
      {f >= launchAt - 4 && f < land + 12 &&
        Array.from({length: 18}, (_, i) => {
          const x = 2000 - ((f * (34 + (i % 4) * 8) + i * 211) % 2500);
          const y = 60 + ((i * 197) % 960);
          const fade = rangeP(f, launchAt - 4, 8) * (1 - rangeP(f, land, 12));
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 150 + (i % 5) * 50, height: 8, borderRadius: 4, background: '#ffffff', opacity: 0.55 * fade, border: `3px solid rgba(43,35,56,0.25)`, boxSizing: 'border-box'}} />;
        })}
      {f >= launchAt && f < land + 20 &&
        [0, 1, 2].map((k) => {
          const t = f - launchAt - k * 9;
          const x = -160 + t * (13 + k * 3);
          return t > 0 ? (
            <At key={k} x={x} y={[250, 520, 760][k] + Math.sin(t / 7 + k) * 26} rot={-6 + Math.sin(t / 9 + k) * 10} s={0.5} o={0.9}>
              <PlaneSp px={9} />
            </At>
          ) : null;
        })}

      {/* rainbow trail: pixel-grid ribbon emitted from the plane's tail */}
      <Ribbon f={f} launchAt={launchAt} land={land} tailAt={tailAt} />
      <Particles list={trailSparks} />

      {/* share shelf */}
      <At x={1200} y={ROW_Y + 20 + (1 - rowIn) * 340} s={1}>
        <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 70, b: 10, sh: 16, band: 14}), width: 1100, height: 290}} />
      </At>
      {DEFAULT_TARGETS.map((t, i) => {
        const p = spring(f, 14 + i * 4, 18);
        const hit = i === target;
        const hop = hit ? wobble(f, land, 22, 3) : wobble(f, land + 3 + Math.abs(i - target) * 3, 18, 2.5) * 0.35;
        const lift = hit && f >= land ? -Math.max(0, 1 - (f - land) / 12) * 60 : 0;
        return (
          <At key={i} x={XS[i]} y={ROW_Y - 20 + (1 - p) * 300 + lift - Math.abs(hop) * 14} s={p * (1 + (hit ? hop * 0.18 : 0))} sx={1 + (hit ? hop * 0.1 : 0)} sy={1 - (hit ? hop * 0.12 : 0)}>
            <div style={{...chunky(t.fill, t.deep, t.light, {r: 44, b: 8, sh: 10, band: 14}), width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <TargetGlyph i={i} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 160, display: 'flex', justifyContent: 'center'}}>
              <Label size={38} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{labels[i] ?? t.label}</Label>
            </div>
            {hit && f >= land + 6 && (
              <At x={150} y={6} s={spring(f, land + 6, 16)} rot={(1 - spring(f, land + 6, 16)) * 80}>
                <div style={{...chunky(FLAT.green, FLAT.greenDeep, '#8ee79a', {r: 9999, b: 6, sh: 6, band: 6}), width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Sp s={CHECK} k="check" px={4} outline={null} />
                </div>
              </At>
            )}
          </At>
        );
      })}

      {/* share button */}
      <At x={BX} y={BY} s={spring(f, 0, 18) * (1 - btnPress * 0.16)} sx={1 + btnPress * 0.08 - btnJel * 0.1} sy={1 - btnPress * 0.08 + btnJel * 0.16}>
        <div style={{...chunky(FLAT.purple, FLAT.purpleDeep, '#b49cff', {r: 9999, b: 10, sh: 16, band: 20}), width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={150} height={150} viewBox="0 0 150 150" style={{overflow: 'visible'}}>
            <g stroke={INK} strokeWidth={26} strokeLinecap="round">
              <line x1={105} y1={36} x2={42} y2={72} />
              <line x1={42} y1={78} x2={105} y2={114} />
            </g>
            <g stroke="#fff" strokeWidth={12} strokeLinecap="round">
              <line x1={105} y1={36} x2={42} y2={72} />
              <line x1={42} y1={78} x2={105} y2={114} />
            </g>
            {[[108, 36], [40, 75], [108, 114]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={22} fill="#fff" stroke={INK} strokeWidth={9} />
            ))}
          </svg>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 280, display: 'flex', justifyContent: 'center'}}>
          <Label size={54} color="#ffffff">{buttonText}</Label>
        </div>
      </At>
      <At x={BX} y={BY + 320} s={spring(f, 18, 20)}>
        <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 44, b: 8, sh: 10, band: 8}), height: 100, padding: '0 30px', display: 'flex', alignItems: 'center', gap: 14}}>
          <Label size={40} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{forwardLabel}</Label>
          <Odometer value={forwardCount + (f >= land ? clamp01((f - land - 4) / 6) : 0)} digits={3} size={60} color={FLAT.purple} />
        </div>
      </At>

      {/* plane */}
      {flying && (
        <At x={head.x} y={head.y} rot={ang} s={planeIn * (1 - Math.max(0, u - 0.94) * 8)} z={20}>
          <PlaneSp px={PX_PLANE} />
        </At>
      )}

      {/* launch + landing */}
      <Click x={BX + 40} y={BY + 40} at={launchAt - 3} color={FLAT.lilac} />
      <Shockwave x={BX} y={BY} at={launchAt} color={FLAT.lilac} maxR={440} life={22} width={20} rays={14} seed={61} />
      <Particles list={launch} />
      <Shockwave x={TX} y={TY} at={land} color={DEFAULT_TARGETS[target].fill} maxR={520} life={24} width={22} rays={16} seed={62} />
      <Shockwave x={TX} y={TY} at={land + 4} color={FLAT.yellow} maxR={760} life={28} width={18} rays={12} seed={63} />
      <Particles list={landBurst} />
      <Particles list={confetti} />
      <Particles list={rise} />
      {f >= land + 4 && (
        <At x={960} y={300 + (1 - spring(f, land + 4, 22)) * 40} s={spring(f, land + 4, 22)} rot={-3}>
          <div style={{...chunky(FLAT.purple, FLAT.purpleDeep, '#b49cff', {r: 70, b: 10, sh: 16, band: 14}), padding: '0 56px', height: 148, display: 'flex', alignItems: 'center', gap: 24}}>
            <Sp s={HEART_BIG} k="hb" px={7} drop={1} />
            <Label size={84} color="#ffffff">{successText}</Label>
            <Sp s={STAR_BIG} k="star" px={7} drop={1} />
          </div>
        </At>
      )}

      <Hand x={hx} y={hy} press={btnPress} o={hO} />

      {/* decor + mascots */}
      <Orn x={1810} y={120} at={20} rot={14} bobAmp={12} period={56}><Sp s={STAR_BIG} k="star" px={10} drop={1} /></Orn>
      <Orn x={130} y={150} at={24} rot={-12} bobAmp={12}><Sp s={HEART_PINK} k="hp" px={9} drop={1} /></Orn>
      <Orn x={110} y={880 + bob(f, 30, 0)} at={28} rot={-6} bobAmp={8}><Mob k="creeper" scale={13} drop={8} /></Orn>
      <Orn x={1810} y={560} at={32} rot={8} bobAmp={14} period={50}><Mob k="pig" scale={10} drop={6} /></Orn>
      <Orn x={1500} y={150} at={36} rot={8} bobAmp={8}><ItemSp id="paper" size={96} /></Orn>
      <Orn x={560} y={130} at={40} rot={-8} bobAmp={8}><ItemSp id="paper" size={80} /></Orn>
      <Orn x={90} y={430} at={44} rot={-8} bobAmp={14}><Mob k="slime" scale={9} drop={6} /></Orn>

      {audio && <Sfx at={launchAt - 4} src={mcSound('random/click')} volume={0.45} rate={1.4} />}
      {audio && <Sfx at={launchAt} src={mcSound('random/pop')} volume={0.5} rate={1.1} />}
      {audio && <Sfx at={land - 2} src={mcSound('random/pop')} volume={0.5} rate={1.5} />}
      {audio && <Sfx at={land} src={mcSound('random/orb')} volume={0.5} rate={1.4} />}
      {audio && <Sfx at={land + 3} src={mcSound('ui/toast/in')} volume={0.35} rate={1.1} />}
      {audio && <Sfx at={land + 6} src={mcSound('random/orb')} volume={0.3} rate={1.9} />}
    </Stage>
  );
};

void lerp;

export const shareEntry: FxEntry = {
  meta: {
    id: 'soc-share',
    name: '分享 · 纸飞机彩虹尾',
    category: 'social',
    tags: ['分享', '纸飞机', '彩虹拖尾', '转发', '互动'],
    frames: 135,
    blurb: '点下紫色分享按钮，像素纸飞机弹出并划过大弧线，彩虹拖尾从机尾连续发出、六色平行贴合飞行轨迹，并带着像素火花，俯冲落进底部一排社交图标；图标跳起打勾、爆出纸片与爱心，弹出“分享成功”，云朵与吉祥物围在画面边缘。',
    usage: '提醒观众转发/分享给朋友，或介绍“分享”入口；Layer 透明背景可叠在任意素材上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景'},
      {name: 'target', desc: '落在第几个图标（0 聊天 / 1 动态 / 2 空间 / 3 链接 / 4 更多），默认 2'},
      {name: 'launchAt', desc: '纸飞机出发的帧，默认 32'},
      {name: 'flight', desc: '飞行帧数，默认 54'},
    ],
  },
  Demo: () => <ShareFx bg />,
  Layer: () => <ShareFx />,
};
