import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {McdEndCard, McdLEmbers} from '../lib';
import {PIXEL_FONT} from '../mc/fonts';
import {block} from '../mc/assets';
import {FPS, MC, EASE, clamp01, textShadowColor} from '../mc/theme';
import {YouyikuIntro} from './YouyikuIntro';
import data from './promo2.data.json';

/**
 * 优易库宣传片（无配音版）。
 * 画面分三层，一眼能分清谁是谁：
 *   1. 外层：随时间走完一天的像素天空（日出 → 正午 → 日落 → 夜晚），是这支视频自己的风格；
 *   2. 中间：像素风的石砖框，框里**只放被演示的效果**（转场、效果墙、用法示意）；
 *   3. 框下：木牌字幕牌，写效果名、说明、当前是镜头 A / 转场 / 镜头 B、是否慢放。
 * 视频自己的换场一律是「屏幕开关机」（框内上下收拢 / 展开），不用库里的任何转场，避免混淆。
 */

/* ------------------------------ layout ------------------------------ */

const OUT = {x: 300, y: 30, w: 1320, h: 760};
const SCREEN = {w: 1280, h: 720};
const PLAQUE = {x: 300, y: 812, w: 1320, h: 238};

const shadow = (c: string, px = 3) => `${px}px ${px}px 0 ${textShadowColor(c)}`;
const GROUP_COLOR: Record<string, string> = {经典: MC.white, 末地系: '#C99BFF', 跳转: MC.aqua, 维度: '#FF8A3D', 可爱: '#FF8FC0', 地下城: MC.gold};
const TAG_COLOR: Record<string, string> = {场景: MC.green, 地下城: MC.gold, 点赞关注: '#FF8FC0', 地图: MC.aqua, 物品: '#C99BFF', 信息: MC.white, 氛围: '#8FB8FF', 套件: '#FF8A3D', 片头: MC.yellow};

/* ------------------------------ timeline ------------------------------ */

const HERO_LEAD = 14;
const HERO_HOLD = 18;
const HERO_TAIL = 14;
const heroPlan = data.heroes.map((h) => {
  const slow = h.id !== 'dim-overworld-to-nether';
  const n = h.frames;
  const len = HERO_LEAD + n + (slow ? HERO_HOLD + 2 * n : 0) + HERO_TAIL;
  return {...h, slow, n, len};
});

const HERO_BLURB: Record<string, string> = {
  portal: '紫色漩涡从中心扩散，吞没画面，再收缩露出 B 镜头。',
  't2-lava-rise': '熔岩从底部涌上淹没画面，冷却成黑曜石后退去。',
  'mcd-t-portal-whiteout': '传送门漩涡把画面吞成一片白，再淡出到下一个镜头。',
  'cute-creeper-rush': '一整屏苦力怕冲脸，搞笑又好认的节奏点转场。',
  'dim-overworld-to-nether': '从主世界走进传送门，来到下界，附带地点标题。',
};

const INTRO = 150;
const WHAT = 240;
const WALL = 225;
const HOW = 135;
const OUTRO = 150;

type Sec =
  | {kind: 'what'; from: number; dur: number}
  | {kind: 'hero'; from: number; dur: number; idx: number}
  | {kind: 'wall'; from: number; dur: number; idx: number}
  | {kind: 'others'; from: number; dur: number}
  | {kind: 'how'; from: number; dur: number; idx: number}
  | {kind: 'outro'; from: number; dur: number};

const SECS: Sec[] = [];
{
  let t = INTRO;
  const push = (s: {kind: Sec['kind']; dur: number; idx?: number}) => {
    SECS.push({...s, from: t} as Sec);
    t += s.dur;
  };
  push({kind: 'what', dur: WHAT});
  heroPlan.forEach((h, idx) => push({kind: 'hero', dur: h.len, idx}));
  data.pages.forEach((_, idx) => push({kind: 'wall', dur: WALL, idx}));
  push({kind: 'others', dur: WALL});
  for (let idx = 0; idx < 4; idx++) push({kind: 'how', dur: HOW, idx});
  push({kind: 'outro', dur: OUTRO});
}
export const PROMO2_FRAMES = SECS[SECS.length - 1].from + SECS[SECS.length - 1].dur;
const STAGE_END = SECS.find((s) => s.kind === 'outro')!.from;

/* ------------------------------ sky ------------------------------ */

const SKIES = ['dawn', 'noon', 'dusk', 'night'] as const;
const SKY_AT = [0, 0.27, 0.55, 0.8].map((k) => Math.round(k * PROMO2_FRAMES));
const XFADE = 90;

const Sky: FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#0b1020'}}>
      {SKIES.map((k, i) => {
        const a = SKY_AT[i];
        const b = i + 1 < SKIES.length ? SKY_AT[i + 1] : PROMO2_FRAMES;
        const from = Math.max(0, a - XFADE / 2);
        const end = Math.min(PROMO2_FRAMES, b + XFADE / 2);
        const ramp = (x0: number, x1: number, y0: number, y1: number) => interpolate(f, [x0, x1], [y0, y1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const fi = i === 0 ? 1 : ramp(a - XFADE / 2, a + XFADE / 2, 0, 1);
        const fo = i + 1 < SKIES.length ? ramp(b - XFADE / 2, b + XFADE / 2, 1, 0) : 1;
        const o = fi * fo;
        return (
          <Sequence key={k} from={from} durationInFrames={end - from}>
            <AbsoluteFill style={{opacity: o}}>
              <OffthreadVideo src={staticFile(`promo2/sky/Loop-${k}.mp4`)} muted />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 100%)'}} />
    </AbsoluteFill>
  );
};

/* ------------------------------ pixel frame + plaque ------------------------------ */

const stair = (r: number, step = 4) => {
  const L: [number, number][] = [[0, r]];
  for (let i = 1; i <= r / step; i++) {
    L.push([i * step, r - (i - 1) * step]);
    L.push([i * step, r - i * step]);
  }
  const X = (x: number, right: boolean) => (right ? `calc(100% - ${x}px)` : `${x}px`);
  const Y = (y: number, bottom: boolean) => (bottom ? `calc(100% - ${y}px)` : `${y}px`);
  const rev = [...L].reverse();
  const pts = [
    ...L.map(([x, y]) => [X(x, false), Y(y, false)]),
    ...rev.map(([x, y]) => [X(x, true), Y(y, false)]),
    ...L.map(([x, y]) => [X(x, true), Y(y, true)]),
    ...rev.map(([x, y]) => [X(x, false), Y(y, true)]),
  ];
  return `polygon(${pts.map((p) => p.join(' ')).join(',')})`;
};

const tile = (name: string, size = 64): CSSProperties => ({backgroundImage: `url(${block(name)})`, backgroundSize: `${size}px ${size}px`, imageRendering: 'pixelated'});

const Stud: FC<{x: number; y: number}> = ({x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 16, height: 16, background: '#d4a62a', boxShadow: 'inset 4px 4px 0 #ffe27a, inset -4px -4px 0 #8a6516, 0 0 0 4px #1a1209'}} />
);

const StageFrame: FC<{tab: string; children: ReactNode}> = ({tab, children}) => (
  <div style={{position: 'absolute', left: OUT.x, top: OUT.y, width: OUT.w, height: OUT.h, filter: 'drop-shadow(0 10px 0 rgba(0,0,0,0.4))'}}>
    <div style={{position: 'absolute', inset: 0, clipPath: stair(12), ...tile('stone_bricks', 64), boxShadow: 'inset 0 0 0 4px #111, inset 0 0 0 8px rgba(255,255,255,0.2), inset 0 -10px 0 10px rgba(0,0,0,0.28)'}} />
    <div style={{position: 'absolute', left: 20, top: 20, width: SCREEN.w, height: SCREEN.h, background: '#0c0a09', boxShadow: '0 0 0 4px #111, 0 0 0 8px rgba(0,0,0,0.45)', overflow: 'hidden'}}>{children}</div>
    <Stud x={2} y={2} />
    <Stud x={OUT.w - 18} y={2} />
    <Stud x={2} y={OUT.h - 18} />
    <Stud x={OUT.w - 18} y={OUT.h - 18} />
    <div style={{position: 'absolute', left: 60, top: -18, padding: '4px 20px 6px', background: '#1b1020', boxShadow: '0 0 0 4px #2a1745, 0 0 0 8px #0b0614', fontFamily: PIXEL_FONT, fontSize: 24, color: '#d9b8ff', textShadow: shadow('#d9b8ff', 2)}}>{tab}</div>
  </div>
);

const Plaque: FC<{children: ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: PLAQUE.x, top: PLAQUE.y, width: PLAQUE.w, height: PLAQUE.h, filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.4))'}}>
    <div style={{position: 'absolute', inset: 0, clipPath: stair(12), ...tile('dark_oak_planks', 64), boxShadow: 'inset 0 0 0 4px #0d0805, inset 0 0 0 8px rgba(255,255,255,0.14)'}} />
    <div style={{position: 'absolute', left: 16, top: 16, right: 16, bottom: 16, background: 'rgba(16,11,8,0.9)', boxShadow: 'inset 0 0 0 4px #000, inset 0 0 0 8px rgba(255,200,120,0.12)'}} />
    <div style={{position: 'absolute', left: 44, top: 30, right: 44, bottom: 28}}>{children}</div>
  </div>
);

const Chip: FC<{c: string; children: ReactNode; size?: number; solid?: boolean}> = ({c, children, size = 24, solid}) => (
  <span style={{display: 'inline-block', padding: '2px 14px 4px', fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1.2, color: solid ? '#140c06' : c, background: solid ? c : 'rgba(0,0,0,0.45)', boxShadow: `inset 0 0 0 3px ${c}`, textShadow: solid ? undefined : shadow(c, 2)}}>{children}</span>
);

/* ------------------------------ CRT on/off (the video's own scene change) ------------------------------ */

const CRT: FC<{dur: number; children: ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const on = EASE.out(clamp01(f / 10));
  const off = EASE.in(clamp01((f - (dur - 8)) / 8));
  const open = Math.min(on, 1 - off);
  const inset = (1 - open) * 50;
  const flash = interpolate(f, [0, 3, 10], [0.9, 0.5, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{clipPath: `inset(${inset}% 0 ${inset}% 0)`}}>
      {children}
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.5}} />
    </AbsoluteFill>
  );
};

const Cap: FC<{dur: number; children: ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const p = EASE.out(clamp01((f - 6) / 12));
  const o = Math.min(p, 1 - clamp01((f - (dur - 6)) / 6));
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - p) * 14}px)`}}>{children}</div>;
};

/* ------------------------------ plaque layouts ------------------------------ */

const Cap1: FC<{chips?: ReactNode; title: string; blurb: string; right?: ReactNode; titleColor?: string}> = ({chips, title, blurb, right, titleColor = MC.gold}) => (
  <div style={{display: 'flex', height: '100%', gap: 36}}>
    <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 48, lineHeight: 1.15, color: titleColor, textShadow: shadow(titleColor, 4), whiteSpace: 'nowrap'}}>{title}</div>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.4, color: '#efe9de', marginTop: 10, maxHeight: 104, overflow: 'hidden'}}>{blurb}</div>
    </div>
    <div style={{width: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16}}>
      {chips && <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>{chips}</div>}
      {right}
    </div>
  </div>
);

/* ------------------------------ screens ------------------------------ */

const Panel: FC<{edge?: string; style?: CSSProperties; children?: ReactNode}> = ({edge = MC.gray, style, children}) => (
  <div style={{position: 'absolute', background: 'rgba(14,10,18,0.92)', boxShadow: `inset 0 0 0 4px ${edge}, inset 0 0 0 8px rgba(255,255,255,0.06), 0 0 0 4px #000`, ...style}}>{children}</div>
);

const countTo = (f: number, to: number, a: number, d = 40) => Math.round(to * EASE.out(clamp01((f - a) / d)));

const WhatScreen: FC = () => {
  const f = useCurrentFrame();
  const cards = [
    {n: data.totals.all, label: '个效果', c: MC.gold, at: 14},
    {n: data.totals.transitions, label: '个转场', c: MC.aqua, at: 34},
    {n: data.totals.alpha, label: '个可导出透明层', c: '#FF8FC0', at: 54},
  ];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2a1745 0%, #120a1e 70%)'}}>
      <McdLEmbers />
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 48, color: MC.white, textShadow: shadow(MC.white, 3), opacity: EASE.out(clamp01((f - 4) / 12))}}>这个库里有</div>
      {cards.map((c, i) => {
        const p = EASE.back(clamp01((f - c.at) / 14));
        return (
          <Panel key={c.label} edge={c.c} style={{left: 60 + i * 400, top: 220, width: 360, height: 340, transform: `scale(${p})`, opacity: p, transformOrigin: '50% 60%'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 56, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 144, lineHeight: 1, color: c.c, textShadow: shadow(c.c, 8)}}>{countTo(f, c.n, c.at + 6)}</div>
            <div style={{position: 'absolute', left: 16, right: 16, top: 232, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.3, color: MC.white, textShadow: shadow(MC.white, 3)}}>{c.label}</div>
          </Panel>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 36, color: '#d9b8ff', textShadow: shadow('#d9b8ff', 3), opacity: EASE.out(clamp01((f - 90) / 16))}}>Minecraft 风格 · Minecraft 地下城风格</div>
    </AbsoluteFill>
  );
};

const Vid: FC<{src: string}> = ({src}) => <OffthreadVideo src={staticFile(src)} muted style={{width: SCREEN.w, height: SCREEN.h}} />;

type HeroPlan = (typeof heroPlan)[number];

const phaseAt = (h: HeroPlan, f: number): {label: string; speed: string; pos: number} | null => {
  // pos = progress through the demo (0..1) for the legend bar; label = A / transition / B
  const n = h.n;
  const a = HERO_LEAD;
  const normal = f >= a && f < a + n;
  const slowStart = a + n + HERO_HOLD;
  const slow = h.slow && f >= slowStart && f < slowStart + 2 * n;
  let local: number | null = null;
  let speed = '';
  if (normal) {
    local = f - a;
    speed = '正常速度';
  } else if (slow) {
    local = (f - slowStart) / 2;
    speed = '慢放 ×0.5';
  } else if (f >= a + n && f < slowStart) {
    local = n - 1;
    speed = '';
  } else if (f >= slowStart + 2 * n) {
    local = n - 1;
    speed = '';
  }
  if (local === null) return null;
  const label = local < h.transStart ? '镜头 A' : local <= h.transEnd ? '转场' : '镜头 B';
  return {label, speed, pos: local / (n - 1)};
};

const HeroScreen: FC<{h: HeroPlan}> = ({h}) => {
  const f = useCurrentFrame();
  const n = h.n;
  const slowStart = HERO_LEAD + n + HERO_HOLD;
  const ph = phaseAt(h, f);
  const labelColor = ph?.label === '转场' ? MC.gold : ph?.label === '镜头 A' ? MC.aqua : MC.green;
  const pulse = ph?.label === '转场' ? 1 + Math.sin(f / 2) * 0.04 : 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={HERO_LEAD} durationInFrames={n}>
        <Vid src={`promo2/hero/${h.id}_n.mp4`} />
      </Sequence>
      <Sequence from={HERO_LEAD + n} durationInFrames={h.slow ? HERO_HOLD : HERO_TAIL + 10}>
        <Freeze frame={n - 1}>
          <Vid src={`promo2/hero/${h.id}_n.mp4`} />
        </Freeze>
      </Sequence>
      {h.slow && (
        <>
          <Sequence from={slowStart} durationInFrames={2 * n}>
            <Vid src={`promo2/hero/${h.id}_s.mp4`} />
          </Sequence>
          <Sequence from={slowStart + 2 * n} durationInFrames={HERO_TAIL + 10}>
            <Freeze frame={2 * n - 1}>
              <Vid src={`promo2/hero/${h.id}_s.mp4`} />
            </Freeze>
          </Sequence>
        </>
      )}
      {ph && (
        <>
          <div style={{position: 'absolute', left: 24, top: 24, transform: `scale(${pulse})`, transformOrigin: '0 0'}}>
            <Chip c={labelColor} size={36} solid>{ph.label}</Chip>
          </div>
          {ph.speed && (
            <div style={{position: 'absolute', right: 24, top: 24}}>
              <Chip c={ph.speed.startsWith('慢') ? '#FF8A3D' : MC.white} size={36} solid>{ph.speed}</Chip>
            </div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

const LegendBar: FC<{h: HeroPlan; f: number}> = ({h, f}) => {
  const ph = phaseAt(h, f);
  const w = 380;
  const a = (h.transStart / (h.n - 1)) * w;
  const b = (h.transEnd / (h.n - 1)) * w;
  const pos = (ph?.pos ?? 1) * w;
  return (
    <div>
      <div style={{position: 'relative', width: w, height: 26, background: '#000', boxShadow: '0 0 0 4px #000'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: a, height: 26, background: MC.aqua}} />
        <div style={{position: 'absolute', left: a, top: 0, width: Math.max(8, b - a), height: 26, background: MC.gold}} />
        <div style={{position: 'absolute', left: b, top: 0, width: Math.max(0, w - b), height: 26, background: MC.green}} />
        <div style={{position: 'absolute', left: Math.max(0, pos - 4), top: -8, width: 8, height: 42, background: '#fff', boxShadow: '0 0 0 3px #000'}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', width: w, marginTop: 10, fontFamily: PIXEL_FONT, fontSize: 24}}>
        <span style={{color: MC.aqua}}>镜头 A</span>
        <span style={{color: MC.gold}}>转场</span>
        <span style={{color: MC.green}}>镜头 B</span>
      </div>
    </div>
  );
};

const GridLabels: FC<{items: {name: string; tag: string; color: string; num?: string}[]}> = ({items}) => {
  const f = useCurrentFrame();
  return (
    <>
      {items.map((it, n) => {
        const x = (n % 5) * 256;
        const y = Math.floor(n / 5) * 240;
        const o = EASE.out(clamp01((f - 8 - n * 1.5) / 8));
        return (
          <div key={it.name + n} style={{position: 'absolute', left: x, top: y, width: 256, height: 240, opacity: o}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 256, height: 144, boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.85), inset 0 0 0 5px rgba(255,255,255,0.18)'}} />
            <div style={{position: 'absolute', left: 8, top: 152, right: 6}}>
              <div style={{display: 'flex', gap: 8, alignItems: 'center', height: 30}}>
                {it.num && <span style={{fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gold, textShadow: shadow(MC.gold, 2)}}>{it.num}</span>}
                <Chip c={it.color} size={24}>{it.tag}</Chip>
              </div>
              <div style={{fontFamily: PIXEL_FONT, fontSize: 24, lineHeight: 1.25, color: MC.white, textShadow: shadow(MC.white, 2), marginTop: 4, maxHeight: 62, overflow: 'hidden'}}>{it.name}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const WallScreen: FC<{idx: number}> = ({idx}) => {
  const items = data.pages[idx].map((t, n) => ({name: t.name, tag: t.group, color: GROUP_COLOR[t.group] ?? MC.white, num: String(data.pages.slice(0, idx).reduce((s, p) => s + p.length, 0) + n + 1).padStart(2, '0')}));
  return (
    <AbsoluteFill style={{background: '#14110f'}}>
      <OffthreadVideo src={staticFile(`promo2/wall/trans${idx + 1}.mp4`)} muted style={{width: SCREEN.w, height: SCREEN.h}} />
      <GridLabels items={items} />
    </AbsoluteFill>
  );
};

const OTHER_NAMES: Record<string, string> = {
  'mcd-scene-nether': '下界熔岩场景', 'mcd-scene-snow': '雪地村落场景', 'mcd-s-boss-intro': 'Boss 登场', 'mcd-s-chest-reveal': '开箱品红光柱', 'mcd-s-results': '结算页',
  'soc-triple': '一键三连', 'soc-follow': '关注彩带', 'map-route-minecart': '矿车地图旅程', 'item-enchanting': '附魔台', 'info-chapter-ore': '章节标题卡',
  'info-lower-third-cute': '可爱字幕条', 'atm-rain': '下雨', 'atm-thunder': '雷暴', 'mcd-kit-hud': '底部 HUD', 'scene-intro-title': '标题炸裂片头',
};

const OthersScreen: FC = () => {
  const items = data.others.map((o) => ({name: OTHER_NAMES[o.id] ?? o.name, tag: o.tag, color: TAG_COLOR[o.tag] ?? MC.white}));
  return (
    <AbsoluteFill style={{background: '#14110f'}}>
      <OffthreadVideo src={staticFile('promo2/wall/others.mp4')} muted style={{width: SCREEN.w, height: SCREEN.h}} />
      <GridLabels items={items} />
    </AbsoluteFill>
  );
};

/* ------------------------------ how to ------------------------------ */

const STEPS = ['交给 AI', '说想法', '渲染'];
const StepBar: FC<{current: number}> = ({current}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center', gap: 56}}>
    {STEPS.map((s, i) => {
      const on = i === current;
      const done = i < current;
      const c = on ? MC.gold : done ? MC.green : MC.gray;
      return (
        <div key={s} style={{display: 'flex', alignItems: 'center', gap: 14, opacity: on ? 1 : 0.55}}>
          <div style={{width: 56, height: 56, border: `4px solid ${c}`, background: 'rgba(0,0,0,0.5)', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{transform: 'rotate(-45deg)', fontFamily: PIXEL_FONT, fontSize: 36, color: c}}>{done ? '✓' : i + 1}</span>
          </div>
          <span style={{fontFamily: PIXEL_FONT, fontSize: 36, color: c, textShadow: shadow(c, 3)}}>{s}</span>
        </div>
      );
    })}
  </div>
);

const HowBg: FC<{children: ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #241438 0%, #0f0a18 75%)'}}>{children}</AbsoluteFill>
);

const HowScreen: FC<{idx: number}> = ({idx}) => {
  const f = useCurrentFrame();
  if (idx === 0) {
    const bob = Math.sin(f / 6) * 6;
    const files = [
      {name: 'AI使用手册.md', note: '怎么用库拼一集视频', y: 220, at: 6},
      {name: 'catalog.json', note: '全部效果的机器可读目录', y: 410, at: 18},
    ];
    return (
      <HowBg>
        <StepBar current={0} />
        {files.map((c) => {
          const p = EASE.back(clamp01((f - c.at) / 14));
          return (
            <Panel key={c.name} edge={MC.aqua} style={{left: 110, top: c.y, width: 560, height: 140, transform: `scale(${p})`, opacity: p}}>
              <div style={{position: 'absolute', left: 32, top: 26, fontFamily: PIXEL_FONT, fontSize: 36, color: MC.aqua, textShadow: shadow(MC.aqua, 3)}}>{c.name}</div>
              <div style={{position: 'absolute', left: 32, top: 82, fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray}}>{c.note}</div>
            </Panel>
          );
        })}
        <div style={{position: 'absolute', left: 700, top: 330, fontFamily: PIXEL_FONT, fontSize: 72, color: MC.gold, opacity: clamp01((f - 40) / 10)}}>→</div>
        <Panel edge={MC.purple} style={{left: 810, top: 240 + bob, width: 360, height: 240}}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PIXEL_FONT, fontSize: 132, color: MC.purple, textShadow: shadow(MC.purple, 8)}}>AI</div>
        </Panel>
      </HowBg>
    );
  }
  if (idx === 1) {
    const msg = '来一期下界探险：开场传送门白闪，中间 Boss 登场，最后放结算页';
    const nChars = Math.min(msg.length, Math.floor(Math.max(0, f - 6) * 0.6));
    const chips = [
      {t: '传送门白闪', c: MC.aqua, at: 62},
      {t: 'Boss 登场', c: MC.red, at: 76},
      {t: '结算页', c: MC.gold, at: 90},
    ];
    return (
      <HowBg>
        <StepBar current={1} />
        <Panel edge={MC.gray} style={{left: 100, top: 190, width: 1080, height: 230}}>
          <div style={{position: 'absolute', left: 36, top: 24, fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray}}>你</div>
          <div style={{position: 'absolute', left: 36, top: 64, right: 36, fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.5, color: MC.white, textShadow: shadow(MC.white, 3)}}>
            {msg.slice(0, nChars)}
            <span style={{opacity: f % 12 < 6 ? 1 : 0}}>▌</span>
          </div>
        </Panel>
        <div style={{position: 'absolute', left: 100, top: 470, fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray, opacity: clamp01((f - 56) / 8)}}>AI 从目录里挑出：</div>
        <div style={{position: 'absolute', left: 100, top: 520, display: 'flex', gap: 28}}>
          {chips.map((c) => {
            const p = EASE.back(clamp01((f - c.at) / 12));
            return (
              <div key={c.t} style={{transform: `scale(${p})`, opacity: p, transformOrigin: '0 50%'}}>
                <Chip c={c.c} size={36}>{c.t}</Chip>
              </div>
            );
          })}
        </div>
      </HowBg>
    );
  }
  if (idx === 2) {
    const prog = clamp01((f - 16) / 70);
    const done = prog >= 1;
    return (
      <HowBg>
        <StepBar current={2} />
        <Panel edge={MC.green} style={{left: 100, top: 230, width: 1080, height: 300}}>
          <div style={{position: 'absolute', left: 40, top: 34, fontFamily: PIXEL_FONT, fontSize: 36, color: MC.green, textShadow: shadow(MC.green, 3)}}>$ npx remotion render 我的视频</div>
          <div style={{position: 'absolute', left: 40, right: 40, top: 110, display: 'flex', gap: 4}}>
            {Array.from({length: 24}, (_, i) => (
              <div key={i} style={{flex: 1, height: 44, background: i < Math.round(prog * 24) ? MC.green : 'rgba(255,255,255,0.12)'}} />
            ))}
          </div>
          <div style={{position: 'absolute', left: 40, top: 190, fontFamily: PIXEL_FONT, fontSize: 36, color: done ? MC.gold : MC.gray, textShadow: done ? shadow(MC.gold, 3) : undefined}}>{done ? '✓ 视频已生成' : `渲染中 ${Math.round(prog * 100)}%`}</div>
        </Panel>
      </HowBg>
    );
  }
  const p = EASE.out(clamp01(f / 16));
  return (
    <AbsoluteFill style={{backgroundColor: '#2b2b33', backgroundImage: 'linear-gradient(45deg,#3a3a45 25%,transparent 25%,transparent 75%,#3a3a45 75%),linear-gradient(45deg,#3a3a45 25%,transparent 25%,transparent 75%,#3a3a45 75%)', backgroundSize: '64px 64px', backgroundPosition: '0 0,32px 32px'}}>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.4)'}} />
      <McdLEmbers />
      <div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 84, color: MC.aqua, textShadow: shadow(MC.aqua, 6)}}>导出透明层</div>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 36, color: MC.gray, marginTop: 12}}>ProRes 4444 · .mov</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 460, display: 'flex', justifyContent: 'center', gap: 36}}>
        {['剪映', '其他剪辑软件'].map((a, i) => {
          const q = EASE.back(clamp01((f - 36 - i * 12) / 12));
          return (
            <div key={a} style={{transform: `scale(${q})`, opacity: q}}>
              <Chip c={MC.gold} size={48}>拖进 {a}</Chip>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const HOW_CAP = [
  {title: '第一步：把手册交给 AI', blurb: '库里有《AI 使用手册》和效果目录，丢给 AI，它就知道怎么用。'},
  {title: '第二步：用大白话说想法', blurb: '比如「开场传送门白闪，最后放结算页」，AI 自己挑效果、排时间轴。'},
  {title: '第三步：一键渲染成视频', blurb: '一条命令渲染出视频，不会写代码也没关系，让 AI 来跑。'},
  {title: '也可以只拿效果', blurb: '任何效果都能导出透明层 .mov，拖进剪映，直接叠在你的素材上。'},
];

/* ------------------------------ plaque content per section ------------------------------ */

const SecPlaque: FC<{s: Sec}> = ({s}) => {
  const f = useCurrentFrame();
  const local = f;
  if (s.kind === 'what') {
    return (
      <Cap1
        chips={<Chip c={MC.gold}>优易库</Chip>}
        title="Minecraft 转场与特效库"
        blurb="转场、地下城风格、标题卡、地图旅程、点赞三连……做 Minecraft 视频要用的动效都在这里。"
        right={<Chip c={MC.aqua} size={24}>带 Minecraft 原版音效</Chip>}
      />
    );
  }
  if (s.kind === 'hero') {
    const h = heroPlan[s.idx];
    return (
      <Cap1
        chips={
          <>
            <Chip c={MC.gold} solid>{`${String(s.idx + 1).padStart(2, '0')} / ${String(heroPlan.length).padStart(2, '0')}`}</Chip>
            <Chip c={GROUP_COLOR[h.group] ?? MC.white}>{h.group}</Chip>
            {h.alpha && <Chip c={MC.green}>可导出透明层</Chip>}
          </>
        }
        title={h.name}
        blurb={HERO_BLURB[h.id] ?? h.blurb}
        right={<LegendBar h={h} f={local} />}
      />
    );
  }
  if (s.kind === 'wall') {
    const start = data.pages.slice(0, s.idx).reduce((a, p) => a + p.length, 0);
    return (
      <Cap1
        chips={<Chip c={MC.gold} solid>{`第 ${s.idx + 1} / ${data.pages.length} 页`}</Chip>}
        title="全部 59 个转场"
        blurb="按风格排列，每一格都是真实效果在循环播放。"
        right={
          <>
            <div style={{fontFamily: PIXEL_FONT, fontSize: 48, color: MC.white, textShadow: shadow(MC.white, 3)}}>{`${String(start + 1).padStart(2, '0')} – ${String(start + data.pages[s.idx].length).padStart(2, '0')}`}</div>
            <div style={{display: 'flex', gap: 10}}>
              {data.pages.map((_, i) => (
                <div key={i} style={{width: 64, height: 16, background: i === s.idx ? MC.gold : i < s.idx ? MC.green : 'rgba(255,255,255,0.2)'}} />
              ))}
            </div>
          </>
        }
      />
    );
  }
  if (s.kind === 'others') {
    return (
      <Cap1
        chips={<Chip c={MC.aqua} solid>不止转场</Chip>}
        title={`还有 ${data.totals.others} 个其他效果`}
        blurb="Boss 登场、结算页、地图旅程、点赞三连、章节卡、雨雪雷暴……这里是其中一部分。"
        right={<Chip c={MC.green} size={24}>{`共 ${data.totals.all} 个 · ${data.totals.alpha} 个带透明层`}</Chip>}
      />
    );
  }
  if (s.kind === 'how') {
    const c = HOW_CAP[s.idx];
    return <Cap1 chips={<Chip c={MC.green} solid>怎么用</Chip>} title={c.title} blurb={c.blurb} titleColor={MC.aqua} />;
  }
  return null;
};

const TABS: Record<Sec['kind'], string> = {what: '优易库', hero: '演示画面', wall: '转场总览', others: '更多效果', how: '用法', outro: ''};

const Stage: FC = () => {
  const f = useCurrentFrame();
  const drop = EASE.back(clamp01((f - (INTRO - 4)) / 26));
  const out = EASE.in(clamp01((f - (STAGE_END - 16)) / 16));
  const y = (1 - drop) * -900 + out * 1000;
  return (
    <AbsoluteFill style={{transform: `translateY(${y}px)`}}>
      {SECS.filter((s) => s.kind !== 'outro').map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} layout="none">
          <SecScene s={s} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Screen: FC<{s: Sec}> = ({s}) => {
  if (s.kind === 'what') return <WhatScreen />;
  if (s.kind === 'hero') return <HeroScreen h={heroPlan[s.idx]} />;
  if (s.kind === 'wall') return <WallScreen idx={s.idx} />;
  if (s.kind === 'others') return <OthersScreen />;
  if (s.kind === 'how') return <HowScreen idx={s.idx} />;
  return null;
};

const SecScene: FC<{s: Sec}> = ({s}) => (
  <AbsoluteFill>
    <StageFrame tab={TABS[s.kind]}>
      <CRT dur={s.dur}>
        <Screen s={s} />
      </CRT>
    </StageFrame>
    <Plaque>
      <Cap dur={s.dur}>
        <Sequence from={0}>
          <SecPlaque s={s} />
        </Sequence>
      </Cap>
    </Plaque>
  </AbsoluteFill>
);

/* ------------------------------ main ------------------------------ */

export const Promo2: FC = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 45, PROMO2_FRAMES - 150, PROMO2_FRAMES - 6], [0, 0.9, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outroFrom = STAGE_END;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('promo2/audio/bgm.mp3')} volume={vol} />
      <Sky />
      <Sequence from={0} durationInFrames={INTRO + 12}>
        <FadeOut at={INTRO} len={12}>
          <YouyikuIntro time="dawn" />
        </FadeOut>
      </Sequence>
      <Stage />
      <Sequence from={outroFrom} durationInFrames={OUTRO}>
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};

const FadeOut: FC<{at: number; len: number; children: ReactNode}> = ({at, len, children}) => {
  const f = useCurrentFrame();
  const o = 1 - clamp01((f - at) / len);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const OutroCard: FC = () => {
  const f = useCurrentFrame();
  const o = clamp01(f / 16);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <McdEndCard bg kicker="Minecraft 转场 · 特效 · 动画库" title="优易库" thanks="感谢观看" link={`${data.totals.all} 个效果 · ${data.totals.transitions} 个转场 · ${data.totals.alpha} 个透明层`} studios={[]} note="" />
    </AbsoluteFill>
  );
};
