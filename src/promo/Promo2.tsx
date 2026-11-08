import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {McdEndCard, McdLEmbers} from '../lib';
import {PIXEL_FONT} from '../mc/fonts';
import {block, tex} from '../mc/assets';
import {MC, EASE, clamp01, textShadowColor} from '../mc/theme';
import {YouyikuIntro} from './YouyikuIntro';
import data from './promo2.data.json';

/**
 * 优易库宣传片（无配音版，约 4 分钟）。
 * 画面分三层，一眼能分清谁是谁：
 *   1. 外层：随时间走完一天的像素天空（日出 → 正午 → 日落 → 夜晚），是这支视频自己的风格；
 *   2. 中间：像素风的石砖框，框里**只放被演示的效果**（转场、效果墙、用法示意）；
 *   3. 框下：木牌字幕牌，写效果名、说明、当前是镜头 A / 转场 / 镜头 B、是否慢放。
 * 视频自己的换场一律是「屏幕开关机」（框内上下收拢 / 展开），不用库里的任何转场，避免混淆。
 * 框内的说明界面（统计、用法）全部用游戏自己的 GUI 做：库存面板、槽位、物品图标、聊天栏、提示框。
 */

/* ------------------------------ layout ------------------------------ */

const OUT = {x: 300, y: 30, w: 1320, h: 760};
const SCREEN = {w: 1280, h: 720};
const PLAQUE = {x: 300, y: 812, w: 1320, h: 238};

const shadow = (c: string, px = 3) => `${px}px ${px}px 0 ${textShadowColor(c)}`;
const GROUP_COLOR: Record<string, string> = {经典: MC.white, 末地系: '#C99BFF', 跳转: MC.aqua, 维度: '#FF8A3D', 可爱: '#FF8FC0', 地下城: MC.gold, 地下城风格: MC.gold, 物品动画: MC.green, 点赞关注: '#FF8FC0'};
const TAG_COLOR: Record<string, string> = {场景: MC.green, 地下城: MC.gold, 点赞关注: '#FF8FC0', 地图: MC.aqua, 物品: '#C99BFF', 信息: MC.white, 氛围: '#8FB8FF', 套件: '#FF8A3D', 片头: MC.yellow};

/* ------------------------------ timeline ------------------------------ */

const HERO_LEAD = 14;
const HERO_HOLD = 18;
const HERO_TAIL = 14;
const heroPlan = data.heroes.map((h) => {
  const n = h.frames;
  return {...h, n, len: HERO_LEAD + n + HERO_HOLD + 2 * n + HERO_TAIL};
});
const SHOW_TAIL = 30;
const showPlan = data.shows.map((h) => ({...h, n: h.frames, len: HERO_LEAD + h.frames + SHOW_TAIL}));

const HERO_BLURB: Record<string, string> = {
  'cute-creeper-rush': '一整屏苦力怕蹦出来，挨个鼓胀闪白，一声爆炸切到下一镜。',
  't2-end-portal': '末地传送门的 12 只眼睛逐个亮起，星点涌出吞没画面。',
  'cute-slime-splat': '绿色史莱姆从上方流下糊满屏幕，再被压扁、分裂散开。',
  't2-enderman-stare': '黑暗里亮起两只紫色的眼睛，末影人死死盯着你。',
  't2-villager-hmm': '一排排村民挤满屏幕，齐刷刷点头，再转身走开。',
  't2-lava-rise': '熔岩从底部翻涌而上淹没画面，退去后冷却成黑曜石。',
  't2-pickaxe-break': '铁镐连凿四下，裂纹爬满画面，最后碎成石块飞散。',
  'mcd-t-chest-beam': '宝箱掀盖，品红光柱冲出，扩满屏幕后切到下一镜。',
};
const SHOW_NAME: Record<string, string> = {
  'mcd-kit-title-text': '地下城风格标题字',
  'mcd-s-boss-intro': 'Boss 登场',
  'mcd-s-results': '关卡结算页',
  'mcd-s-level-up': '升级特效',
  'item-craft-table': '合成台',
  'item-furnace': '熔炉烧炼',
  'item-enchanting': '附魔台',
  'item-smithing': '锻造台升级',
  'soc-triple': '一键三连',
};
const SHOW_BLURB: Record<string, string> = {
  'mcd-kit-title-text': '压黑硬切、像素错位拼合、逐字下落……六种标题字出现方式。',
  'mcd-s-boss-intro': '紫色能量聚拢，十字闪光炸开，Boss 现身，血条从左拉满。',
  'mcd-s-results': '压黑后淡入结算页，击败数滚动，统计卡逐个翻出。',
  'mcd-s-level-up': '紫色螺旋光柱托起，金色「升级！」砸下，等级徽章亮起。',
  'item-craft-table': '材料飞进合成格，箭头走满，成品砸出来。',
  'item-furnace': '生铁和煤炭落入熔炉，火焰点燃，铁锭带着经验球弹出。',
  'item-enchanting': '符文飘向附魔台，选中后旋入钻石剑，紫光炸开。',
  'item-smithing': '铁锤三下砸在铁砧上，炸出一把下界合金剑。',
  'soc-triple': '点赞、投币、收藏依次亮起，聚成能量球后全屏爆发。',
};

const INTRO = 150;
const WHAT = 240;
const WALL = 225;
const HOW = 135;
const OUTRO = 150;

type Sec =
  | {kind: 'what'; from: number; dur: number}
  | {kind: 'hero'; from: number; dur: number; idx: number}
  | {kind: 'show'; from: number; dur: number; idx: number}
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
  data.pages.forEach((_, idx) => push({kind: 'wall', dur: WALL, idx}));
  heroPlan.forEach((h, idx) => push({kind: 'hero', dur: h.len, idx}));
  showPlan.forEach((h, idx) => push({kind: 'show', dur: h.len, idx}));
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
        return (
          <Sequence key={k} from={from} durationInFrames={end - from}>
            <AbsoluteFill style={{opacity: fi * fo}}>
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
    <div style={{position: 'absolute', left: 60, top: -18, padding: '4px 20px 6px', background: '#100010', boxShadow: 'inset 3px 3px 0 #5000ff, inset -3px -3px 0 #28007f, 0 0 0 3px #100010', fontFamily: PIXEL_FONT, fontSize: 24, color: '#fff', textShadow: shadow('#ffffff', 2)}}>{tab}</div>
  </div>
);

const Plaque: FC<{children: ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: PLAQUE.x, top: PLAQUE.y, width: PLAQUE.w, height: PLAQUE.h, filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.4))'}}>
    <div style={{position: 'absolute', inset: 0, clipPath: stair(12), ...tile('dark_oak_planks', 64), boxShadow: 'inset 0 0 0 4px #0d0805, inset 0 0 0 8px rgba(255,255,255,0.14)'}} />
    <div style={{position: 'absolute', left: 16, top: 16, right: 16, bottom: 16, background: 'rgba(16,11,8,0.92)', boxShadow: 'inset 0 0 0 4px #000, inset 0 0 0 8px rgba(255,200,120,0.1)'}} />
    <div style={{position: 'absolute', left: 44, top: 30, right: 44, bottom: 28}}>{children}</div>
  </div>
);

/* ------------------------------ Minecraft GUI parts ------------------------------ */

/** Item tooltip look: near-black with the purple frame. Colour only goes on the text. */
const Chip: FC<{c: string; children: ReactNode; size?: number; solid?: boolean}> = ({c, children, size = 24, solid}) =>
  solid ? (
    <span style={{display: 'inline-block', padding: '2px 14px 4px', fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1.2, color: '#1a1008', background: c, boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.55), inset -3px -3px 0 rgba(0,0,0,0.35), 0 0 0 3px #000'}}>{children}</span>
  ) : (
    <span style={{display: 'inline-block', padding: '2px 14px 4px', fontFamily: PIXEL_FONT, fontSize: size, lineHeight: 1.2, color: c, background: 'rgba(16,0,16,0.94)', boxShadow: 'inset 3px 3px 0 #5000ff, inset -3px -3px 0 #28007f, 0 0 0 3px #100010', textShadow: shadow(c, 2)}}>{children}</span>
  );

/** The grey inventory panel. Text on it is dark grey with no shadow, like container titles. */
const McPanel: FC<{style?: CSSProperties; children?: ReactNode}> = ({style, children}) => (
  <div style={{position: 'absolute', background: '#c6c6c6', boxShadow: 'inset 4px 4px 0 #fff, inset -4px -4px 0 #555, 0 0 0 4px #000', ...style}}>{children}</div>
);

/** An inventory slot (the game's own 18x18 sprite) holding an item icon. */
const McSlot: FC<{size: number; icon?: string; count?: string; style?: CSSProperties}> = ({size, icon, count, style}) => (
  <div style={{position: 'absolute', width: size, height: size, backgroundImage: `url(${tex('gui/sprites/container/slot.png')})`, backgroundSize: '100% 100%', imageRendering: 'pixelated', ...style}}>
    {icon && <img src={icon} style={{position: 'absolute', left: size / 18, top: size / 18, width: (size * 16) / 18, height: (size * 16) / 18, imageRendering: 'pixelated'}} />}
    {count && <div style={{position: 'absolute', right: 6, bottom: 0, fontFamily: PIXEL_FONT, fontSize: Math.round(size / 3 / 12) * 12 || 24, color: '#fff', textShadow: shadow('#ffffff', 4)}}>{count}</div>}
  </div>
);

/** A recessed text well, like the dark inset behind slot names. */
const Well: FC<{style?: CSSProperties; children?: ReactNode}> = ({style, children}) => (
  <div style={{position: 'absolute', background: '#373737', boxShadow: 'inset 4px 4px 0 #1c1c1c, inset -4px -4px 0 #fff', ...style}}>{children}</div>
);

const McButton: FC<{children: ReactNode; size?: number; hot?: boolean}> = ({children, size = 36, hot}) => (
  <span style={{display: 'inline-block', padding: '10px 30px 14px', fontFamily: PIXEL_FONT, fontSize: size, color: hot ? '#ffffa0' : '#fff', textShadow: shadow('#ffffff', 3), background: '#7c7c7c', boxShadow: 'inset 4px 4px 0 #bdbdbd, inset -4px -4px 0 #3b3b3b, 0 0 0 4px #000'}}>{children}</span>
);

const item = (n: string) => tex(`item/${n}.png`);

/** The game's options background: dirt, tiled and dimmed. */
const DirtBg: FC<{children?: ReactNode}> = ({children}) => (
  <AbsoluteFill style={{...tile('dirt', 64)}}>
    <AbsoluteFill style={{background: 'rgba(0,0,0,0.62)'}} />
    {children}
  </AbsoluteFill>
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

const Cap1: FC<{chips?: ReactNode; title: string; blurb: string; right?: ReactNode; titleColor?: string}> = ({chips, title, blurb, right, titleColor = MC.gold}) => (
  <div style={{display: 'flex', height: '100%', gap: 36}}>
    <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 48, lineHeight: 1.15, color: titleColor, textShadow: shadow(titleColor, 4), whiteSpace: 'nowrap'}}>{title}</div>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.4, color: '#efe9de', marginTop: 10, maxHeight: 104, overflow: 'hidden'}}>{blurb}</div>
    </div>
    <div style={{width: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16}}>
      {chips && <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>{chips}</div>}
      {right}
    </div>
  </div>
);

/* ------------------------------ screens ------------------------------ */

const countTo = (f: number, to: number, a: number, d = 40) => Math.round(to * EASE.out(clamp01((f - a) / d)));

const WhatScreen: FC = () => {
  const f = useCurrentFrame();
  const cols = [
    {n: data.totals.all, label: '个效果', icon: item('nether_star'), at: 14},
    {n: data.totals.transitions, label: '个转场', icon: item('ender_pearl'), at: 34},
    {n: data.totals.alpha, label: '个可导出透明层', icon: tex('block/glass.png'), at: 54},
  ];
  const panelIn = EASE.back(clamp01(f / 14));
  return (
    <DirtBg>
      <McPanel style={{left: 140, top: 90, width: 1000, height: 540, transform: `scale(${panelIn})`, opacity: panelIn}}>
        <div style={{position: 'absolute', left: 36, top: 26, fontFamily: PIXEL_FONT, fontSize: 36, color: '#404040'}}>优易库</div>
        {cols.map((c, i) => {
          const p = EASE.back(clamp01((f - c.at) / 14));
          const x = 124 + i * 292;
          return (
            <div key={c.label} style={{position: 'absolute', left: x - 40, top: 90, width: 252, height: 410, opacity: p, transform: `scale(${p})`, transformOrigin: '50% 40%'}}>
              <McSlot size={168} icon={c.icon} style={{left: 42, top: 0}} />
              <Well style={{left: 0, top: 196, width: 252, height: 100}}>
                <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PIXEL_FONT, fontSize: 72, lineHeight: 1, color: '#fff', textShadow: shadow('#ffffff', 6)}}>{countTo(f, c.n, c.at + 6)}</div>
              </Well>
              <div style={{position: 'absolute', left: 0, right: 0, top: 316, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.3, color: '#404040'}}>{c.label}</div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 28, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 24, color: '#555', opacity: clamp01((f - 90) / 16)}}>Minecraft 风格 · Minecraft 地下城风格</div>
      </McPanel>
      <div style={{position: 'absolute', left: 1180, top: 130, width: 80, textAlign: 'center'}} />
    </DirtBg>
  );
};

const Vid: FC<{src: string}> = ({src}) => <OffthreadVideo src={staticFile(src)} muted style={{width: SCREEN.w, height: SCREEN.h}} />;

type HeroPlan = (typeof heroPlan)[number];

const phaseAt = (h: HeroPlan, f: number): {label: string; speed: string; pos: number} | null => {
  const n = h.n;
  const a = HERO_LEAD;
  const slowStart = a + n + HERO_HOLD;
  let local: number | null = null;
  let speed = '';
  if (f >= a && f < a + n) {
    local = f - a;
    speed = '正常速度';
  } else if (f >= slowStart && f < slowStart + 2 * n) {
    local = (f - slowStart) / 2;
    speed = '慢放 ×0.5';
  } else if (f >= a + n) {
    local = n - 1;
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
      <Sequence from={HERO_LEAD + n} durationInFrames={HERO_HOLD}>
        <Freeze frame={n - 1}>
          <Vid src={`promo2/hero/${h.id}_n.mp4`} />
        </Freeze>
      </Sequence>
      <Sequence from={slowStart} durationInFrames={2 * n}>
        <Vid src={`promo2/hero/${h.id}_s.mp4`} />
      </Sequence>
      <Sequence from={slowStart + 2 * n} durationInFrames={HERO_TAIL + 10}>
        <Freeze frame={2 * n - 1}>
          <Vid src={`promo2/hero/${h.id}_s.mp4`} />
        </Freeze>
      </Sequence>
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

type ShowPlan = (typeof showPlan)[number];

const ShowScreen: FC<{h: ShowPlan}> = ({h}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence from={HERO_LEAD} durationInFrames={h.n}>
      <Vid src={`promo2/hero/${h.id}_n.mp4`} />
    </Sequence>
    <Sequence from={HERO_LEAD + h.n} durationInFrames={SHOW_TAIL + 10}>
      <Freeze frame={h.n - 1}>
        <Vid src={`promo2/hero/${h.id}_n.mp4`} />
      </Freeze>
    </Sequence>
  </AbsoluteFill>
);

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

const STEPS = ['下载 Skill', '说想法', '渲染'];
const StepBar: FC<{current: number}> = ({current}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center', gap: 28}}>
    {STEPS.map((s, i) => {
      const on = i === current;
      const done = i < current;
      return (
        <div key={s} style={{opacity: on ? 1 : done ? 0.85 : 0.5}}>
          <McButton hot={on}>{done ? '✓ ' : `${i + 1} `}{s}</McButton>
        </div>
      );
    })}
  </div>
);

const HowScreen: FC<{idx: number}> = ({idx}) => {
  const f = useCurrentFrame();
  if (idx === 0) {
    const bob = Math.sin(f / 6) * 6;
    const p = EASE.back(clamp01((f - 6) / 14));
    const bits = [
      {t: '使用手册', icon: item('written_book'), at: 22},
      {t: '效果目录', icon: item('filled_map'), at: 32},
      {t: '全部源码', icon: item('diamond_pickaxe'), at: 42},
    ];
    return (
      <DirtBg>
        <StepBar current={0} />
        <McPanel style={{left: 90, top: 150, width: 780, height: 440, opacity: p, transform: `scale(${p})`}}>
          <McSlot size={150} icon={item('enchanted_book')} style={{left: 40, top: 40}} />
          <div style={{position: 'absolute', left: 224, top: 44, fontFamily: PIXEL_FONT, fontSize: 60, color: '#404040'}}>优易库 Skill</div>
          <div style={{position: 'absolute', left: 224, top: 124, fontFamily: PIXEL_FONT, fontSize: 24, color: '#555'}}>作者：云诺羲 Rinorsi</div>
          <div style={{position: 'absolute', left: 40, right: 40, top: 232, height: 2, background: '#8b8b8b'}} />
          <div style={{position: 'absolute', left: 40, top: 260, fontFamily: PIXEL_FONT, fontSize: 36, color: '#404040'}}>里面自带：</div>
          {bits.map((b, i) => {
            const q = EASE.back(clamp01((f - b.at) / 12));
            return (
              <div key={b.t} style={{position: 'absolute', left: 40 + i * 240, top: 320, width: 220, opacity: q, transform: `scale(${q})`, transformOrigin: '0 50%'}}>
                <McSlot size={72} icon={b.icon} style={{left: 0, top: 0}} />
                <div style={{position: 'absolute', left: 88, top: 18, fontFamily: PIXEL_FONT, fontSize: 24, color: '#404040'}}>{b.t}</div>
              </div>
            );
          })}
        </McPanel>
        <div style={{position: 'absolute', left: 892, top: 330, fontFamily: PIXEL_FONT, fontSize: 96, color: '#fff', textShadow: shadow('#ffffff', 6), opacity: clamp01((f - 52) / 10)}}>→</div>
        <McPanel style={{left: 1010, top: 220 + bob, width: 200, height: 280}}>
          <McSlot size={140} icon={item('nether_star')} style={{left: 30, top: 34}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 60, color: '#404040'}}>AI</div>
        </McPanel>
      </DirtBg>
    );
  }
  if (idx === 1) {
    const msg = '来一期下界探险：开场末地传送门，中间 Boss 登场，最后放结算页';
    const nChars = Math.min(msg.length, Math.floor(Math.max(0, f - 6) * 0.6));
    const reply = f > 58;
    const chips = [
      {t: '末地传送门', c: '#C99BFF', at: 66},
      {t: 'Boss 登场', c: MC.red, at: 80},
      {t: '结算页', c: MC.gold, at: 94},
    ];
    return (
      <DirtBg>
        <StepBar current={1} />
        <div style={{position: 'absolute', left: 60, right: 60, top: 190, background: 'rgba(0,0,0,0.55)', padding: '22px 28px 26px'}}>
          <div style={{fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.5, color: '#fff', textShadow: shadow('#ffffff', 3)}}>
            {'<你> '}
            {msg.slice(0, nChars)}
            <span style={{opacity: f % 12 < 6 ? 1 : 0}}>_</span>
          </div>
          {reply && (
            <div style={{fontFamily: PIXEL_FONT, fontSize: 36, lineHeight: 1.5, color: '#fff', textShadow: shadow('#ffffff', 3), marginTop: 10}}>{'<AI> 好的，我从效果目录里选了：'}</div>
          )}
        </div>
        <div style={{position: 'absolute', left: 60, top: 440, display: 'flex', gap: 28}}>
          {chips.map((c) => {
            const p = EASE.back(clamp01((f - c.at) / 12));
            return (
              <div key={c.t} style={{transform: `scale(${p})`, opacity: p, transformOrigin: '0 50%'}}>
                <Chip c={c.c} size={36}>{c.t}</Chip>
              </div>
            );
          })}
        </div>
      </DirtBg>
    );
  }
  if (idx === 2) {
    const prog = clamp01((f - 16) / 70);
    const done = prog >= 1;
    return (
      <DirtBg>
        <StepBar current={2} />
        <div style={{position: 'absolute', left: 90, top: 190, width: 1100, height: 320, background: 'rgba(16,0,16,0.94)', boxShadow: 'inset 4px 4px 0 #5000ff, inset -4px -4px 0 #28007f, 0 0 0 4px #100010'}}>
          <div style={{position: 'absolute', left: 44, top: 36, fontFamily: PIXEL_FONT, fontSize: 36, color: MC.green, textShadow: shadow(MC.green, 3)}}>/render 我的视频</div>
          {/* experience-bar style progress */}
          <div style={{position: 'absolute', left: 44, right: 44, top: 120, height: 36, background: '#1a1a1a', boxShadow: 'inset 4px 4px 0 #000, inset -4px -4px 0 #444, 0 0 0 4px #000'}}>
            <div style={{position: 'absolute', left: 4, top: 4, bottom: 4, width: `calc(${prog * 100}% - 8px)`, background: '#80ff20', boxShadow: 'inset 0 4px 0 #c8ff90, inset 0 -4px 0 #3c8a0c'}} />
          </div>
          <div style={{position: 'absolute', left: 44, top: 200, fontFamily: PIXEL_FONT, fontSize: 36, color: done ? MC.gold : '#aaa', textShadow: done ? shadow(MC.gold, 3) : undefined}}>{done ? '视频已生成！' : `渲染中 ${Math.round(prog * 100)}%`}</div>
        </div>
      </DirtBg>
    );
  }
  const p = EASE.out(clamp01(f / 16));
  return (
    <AbsoluteFill style={{backgroundColor: '#2b2b33', backgroundImage: 'linear-gradient(45deg,#3a3a45 25%,transparent 25%,transparent 75%,#3a3a45 75%),linear-gradient(45deg,#3a3a45 25%,transparent 25%,transparent 75%,#3a3a45 75%)', backgroundSize: '64px 64px', backgroundPosition: '0 0,32px 32px'}}>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.4)'}} />
      <McdLEmbers />
      <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 84, color: MC.aqua, textShadow: shadow(MC.aqua, 6)}}>导出透明层</div>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 36, color: '#ddd', textShadow: shadow('#dddddd', 3), marginTop: 12}}>ProRes 4444 · .mov</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', gap: 40}}>
        {['剪映', '其他剪辑软件'].map((a, i) => {
          const q = EASE.back(clamp01((f - 36 - i * 12) / 12));
          return (
            <div key={a} style={{transform: `scale(${q})`, opacity: q}}>
              <McButton size={48}>拖进 {a}</McButton>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const HOW_CAP = [
  {title: '第一步：下载优易库 Skill', blurb: '直接下载我们的 Skill 就能用，手册、目录和源码都在里面。'},
  {title: '第二步：用大白话说想法', blurb: '比如「开场末地传送门，最后放结算页」，AI 自己挑效果、排时间轴。'},
  {title: '第三步：一键渲染成视频', blurb: '一条命令渲染出视频，不会写代码也没关系，让 AI 来跑。'},
  {title: '也可以只拿效果', blurb: '任何效果都能导出透明层 .mov，拖进剪映，直接叠在你的素材上。'},
];

/* ------------------------------ plaque content per section ------------------------------ */

const SecPlaque: FC<{s: Sec}> = ({s}) => {
  const f = useCurrentFrame();
  if (s.kind === 'what') {
    return (
      <Cap1
        chips={<Chip c={MC.gold}>优易库</Chip>}
        title="Minecraft 转场与特效库"
        blurb="转场、地下城风格、标题卡、合成熔炼……都在这里。先看全部转场。"
        right={
          <>
            <Chip c={MC.aqua} size={24}>带 Minecraft 原版音效</Chip>
            <Chip c={MC.white} size={24}>作者：云诺羲 Rinorsi</Chip>
          </>
        }
      />
    );
  }
  if (s.kind === 'hero') {
    const h = heroPlan[s.idx];
    return (
      <Cap1
        chips={
          <>
            <Chip c={MC.gold}>{`${String(s.idx + 1).padStart(2, '0')} / ${String(heroPlan.length).padStart(2, '0')}`}</Chip>
            <Chip c={GROUP_COLOR[h.group] ?? MC.white}>{h.group}</Chip>
            {h.alpha && <Chip c={MC.green}>可导出透明层</Chip>}
          </>
        }
        title={h.name}
        blurb={HERO_BLURB[h.id] ?? h.blurb}
        right={<LegendBar h={h} f={f} />}
      />
    );
  }
  if (s.kind === 'show') {
    const h = showPlan[s.idx];
    return (
      <Cap1
        chips={
          <>
            <Chip c={MC.gold}>{`${String(s.idx + 1).padStart(2, '0')} / ${String(showPlan.length).padStart(2, '0')}`}</Chip>
            <Chip c={GROUP_COLOR[h.tag] ?? MC.white}>{h.tag}</Chip>
            {h.alpha && <Chip c={MC.green}>可导出透明层</Chip>}
          </>
        }
        title={SHOW_NAME[h.id] ?? h.name}
        blurb={SHOW_BLURB[h.id] ?? h.blurb}
      />
    );
  }
  if (s.kind === 'wall') {
    const start = data.pages.slice(0, s.idx).reduce((a, p) => a + p.length, 0);
    return (
      <Cap1
        chips={<Chip c={MC.gold}>{`第 ${s.idx + 1} / ${data.pages.length} 页`}</Chip>}
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
        chips={<Chip c={MC.aqua}>不止这些</Chip>}
        title={`还有 ${data.totals.others} 个其他效果`}
        blurb="地图旅程、章节卡、字幕条、雨雪雷暴、片头片尾……这里是其中一部分。"
        right={<Chip c={MC.green} size={24}>{`共 ${data.totals.all} 个 · ${data.totals.alpha} 个带透明层`}</Chip>}
      />
    );
  }
  if (s.kind === 'how') {
    const c = HOW_CAP[s.idx];
    return <Cap1 chips={<Chip c={MC.green}>怎么用</Chip>} title={c.title} blurb={c.blurb} titleColor={MC.aqua} />;
  }
  return null;
};

const TABS: Record<Sec['kind'], string> = {what: '优易库', hero: '转场精选', show: '不止转场', wall: '转场总览', others: '更多效果', how: '用法', outro: ''};

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
  if (s.kind === 'show') return <ShowScreen h={showPlan[s.idx]} />;
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
        <SecPlaque s={s} />
      </Cap>
    </Plaque>
  </AbsoluteFill>
);

/* ------------------------------ main ------------------------------ */

export const Promo2: FC = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 45, PROMO2_FRAMES - 150, PROMO2_FRAMES - 6], [0, 0.9, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
      <Sequence from={STAGE_END} durationInFrames={OUTRO}>
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};

const FadeOut: FC<{at: number; len: number; children: ReactNode}> = ({at, len, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: 1 - clamp01((f - at) / len)}}>{children}</AbsoluteFill>;
};

const OutroCard: FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: clamp01(f / 16)}}>
      <McdEndCard bg kicker="Minecraft 转场 · 特效 · 动画库" title="优易库" thanks="感谢观看" link="直接下载优易库 Skill，让 AI 帮你用" studios={['作者：云诺羲 Rinorsi']} note="用了优易库的转场和效果，欢迎在视频里留个署名（不强制）" />
    </AbsoluteFill>
  );
};
