import {type FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {Shockwave} from '../../../mc/Fx';
import {FLAT, type Sprite} from '../../flat';
import {At, Avatar, HEART_BIG, HEART_PINK, INK, Label, Mob, Odometer, Orn, Particles, STAR_BIG, Sp, Stage, bob, chunky, lerp, makeBurst, rangeP, spring, useList, wobble, type Face} from './common';
import {TITLE_FONT} from '../../../mc/fonts';

/**
 * soc-danmaku: a stream of cute comment bubbles (avatar + nickname + text) flies in from the right, overshoots,
 * squashes on landing and stacks upward, pushing older ones up until they fade at the top. Above them three lanes of
 * scrolling "danmaku" lines cross the screen; a comment counter rolls up on the right and hearts rise from the bubbles.
 * Props: bg, comments (override the list), gap (frames between bubbles), laneTexts (pool for the scrolling lines), hotIndex / hotText (which bubble gets the red tag, -1 for none, and its text), baseCount (counter start), header (counter caption),
 * badgeText (pink tag), audio (play the sound effects).
 */

export type Comment = {nick: string; text: string; face: Face; color: string; deep: string};

export const DEFAULT_COMMENTS: Comment[] = [
  {nick: '苦力怕不炸了', text: '前排！沙发！', face: 'creeper', color: FLAT.pink, deep: FLAT.pinkDeep},
  {nick: '红石大佬awsl', text: '这个红石机器也太绝了吧', face: 'steve', color: FLAT.sky, deep: FLAT.skyDeep},
  {nick: '小猪不怕冷', text: 'UP主辛苦啦～', face: 'pig', color: FLAT.yellow, deep: FLAT.yellowDeep},
  {nick: '史莱姆Q弹', text: '三连了三连了！！', face: 'slime', color: FLAT.mint, deep: FLAT.green},
  {nick: '挖矿的艾利克斯', text: '催更催更催更！', face: 'alex', color: FLAT.lilac, deep: FLAT.purple},
  {nick: '下界合金块', text: '这期质量也太高了', face: 'kai', color: '#ffc27a', deep: FLAT.orange},
  {nick: '村民哈哈哈', text: '已投币已收藏', face: 'zuri', color: FLAT.pink, deep: FLAT.pinkDeep},
  {nick: '末影人别看我', text: '我在建同款了！', face: 'sunny', color: FLAT.sky, deep: FLAT.skyDeep},
];

export const DEFAULT_LANE_TEXTS = ['哈哈哈哈哈', '666666', '前方高能！', 'awsl', '太可爱了吧', '爷青回', '名场面', '泪目了', '这也行？', '好耶！', '真·红石大佬', '高能预警', 'MC永远的神', '已三连', '笑死我了'];
const LANE_COLORS = ['#ffffff', FLAT.yellow, FLAT.mint, FLAT.pink, FLAT.sky, FLAT.lilac];

/** Rough text width in px: CJK / full-width glyphs are 1em, latin and digits about 0.56em. */
const textW = (s: string, size: number) => [...s].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e80 || ch === '～' ? size : size * 0.56), 0);
const bubbleW = (c: Comment) => Math.ceil(Math.max(textW(c.text, 54), textW(c.nick, 32)) + 100);

/** Pixel chat bubble icon (11 x 9). */
const CHATB: Sprite = {
  rows: ['.WWWWWWWWW.', 'WWWWWWWWWWW', 'WWDWWDWWDWW', 'WWWWWWWWWWW', 'WWWWWWWWWWW', '.WWWWWWWWW.', '..WWWW.....', '...WW......', '....W......'],
  palette: {W: '#ffffff', D: FLAT.skyDeep},
};

const BubbleCard: FC<{c: Comment; w: number; hot?: boolean; hotText?: string}> = ({c, w, hot, hotText = '热评'}) => (
  <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 22}}>
    <Avatar face={c.face} size={132} />
    <div style={{position: 'relative'}}>
      <div style={{position: 'absolute', left: -22, top: 58, width: 0, height: 0, borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderRight: `30px solid ${INK}`}} />
      <div style={{position: 'absolute', left: -12, top: 62, width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderRight: `24px solid ${c.color}`}} />
      <div style={{...chunky(c.color, c.deep, '#ffffff', {r: 44, b: 8, sh: 10, band: 8}), width: w, height: 132, padding: '6px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2}}>
        <span style={{fontFamily: TITLE_FONT, fontSize: 32, color: INK, opacity: 0.6, whiteSpace: 'pre'}}>{c.nick}</span>
        <span style={{fontFamily: TITLE_FONT, fontSize: 54, color: INK, whiteSpace: 'pre', lineHeight: '62px'}}>{c.text}</span>
      </div>
      {hot && (
        <div style={{position: 'absolute', right: -22, top: -26, transform: 'rotate(10deg)'}}>
          <div style={{...chunky(FLAT.red, FLAT.redDeep, '#ff8f9a', {r: 22, b: 6, sh: 6, band: 6}), padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', gap: 8}}>
            <Sp s={STAR_BIG} k="star" px={3} outline={null} />
            <Label size={30} color="#ffffff" style={{WebkitTextStroke: '0px', textShadow: 'none', lineHeight: '34px'}}>{hotText}</Label>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const DanmakuFx: FC<{bg?: boolean; comments?: Comment[]; gap?: number; laneTexts?: string[]; hotIndex?: number; hotText?: string; baseCount?: number; header?: string; badgeText?: string; audio?: boolean}> = ({
  bg,
  comments = DEFAULT_COMMENTS,
  gap = 17,
  laneTexts = DEFAULT_LANE_TEXTS,
  hotIndex = 2,
  hotText = '热评',
  baseCount = 1288,
  header = '评论',
  badgeText = '弹幕护体',
  audio = true,
}) => {
  const f = useCurrentFrame();
  const T0 = 10;
  const BASE = 925; // centre of the lowest slot
  const H_SLOT = 150;
  const LEFT = 120;
  const n = comments.length;
  const T = (i: number) => T0 + i * gap;

  const lanes = useList(() => {
    const r = mulberry32(111);
    const out: {text: string; y: number; x0: number; v: number; at: number; color: string; size: number}[] = [];
    [128, 206, 284].forEach((y, lane) => {
      let t = -50 + lane * 14;
      while (t < 170) {
        out.push({text: laneTexts[Math.floor(r() * laneTexts.length)], y, x0: 1960, v: 11 + lane * 2.5 + r() * 3, at: t, color: LANE_COLORS[Math.floor(r() * LANE_COLORS.length)], size: 56 + Math.floor(r() * 3) * 6});
        t += 24 + Math.floor(r() * 34);
      }
    });
    return out;
  });

  const hearts = useList(() => comments.flatMap((_, i) => makeBurst({seed: 120 + i, at: T(i) + 12, x: LEFT + 700, y: BASE, n: 7, kinds: ['heartP', 'heart', 'spark:#ffffff', 'star'], speed: [6, 16], angle: [-130, -50], life: [34, 56], g: 0.1, drag: 0.95, size: [30, 56]})));
  const rise = useList(() => makeBurst({seed: 130, at: T0 + 20, x: 960, y: 1150, n: 26, kinds: ['heartP', 'star', 'spark:#ffffff', 'heartP'], speed: [10, 22], angle: [-100, -80], life: [80, 130], g: 0.1, drag: 0.97, size: [40, 100], stagger: 120, spread: 1900}));

  const count = baseCount + comments.reduce((a, _, i) => a + clamp01((f - T(i) - 10) / 6), 0);
  const chipIn = spring(f, 6, 20);
  const lastLand = T(n - 1) + 12;

  // stack positions
  const slotY = (i: number) => {
    let up = 0;
    for (let j = i + 1; j < n; j++) up += EASE.out(clamp01((f - T(j) + 6) / 9)) * H_SLOT;
    return BASE - up;
  };

  return (
    <Stage bg={bg} time="noon">
      {/* rising decorations behind */}
      <Particles list={rise} />

      {/* danmaku lanes */}
      {lanes.map((l, i) => {
        const x = l.x0 - (f - l.at) * l.v;
        if (f < l.at || x < -700) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: l.y, transform: 'translateY(-50%)'}}>
            <Label size={l.size} color={l.color}>{l.text}</Label>
          </div>
        );
      })}

      {/* comment stack */}
      {comments.map((c, i) => {
        if (f < T(i)) return null;
        const w = bubbleW(c);
        const fly = EASE.out(clamp01((f - T(i)) / 16));
        const x = LEFT + (1 - fly) * 1900 - wobble(f, T(i) + 14, 18, 2.2) * 46;
        const y = slotY(i);
        const land = wobble(f, T(i) + 10, 16, 2.5);
        const fade = clamp01((y - 400) / 110);
        if (fade <= 0.01) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, opacity: fade, transform: `translateY(-50%) scale(${(0.9 + 0.1 * fade) * (1 + land * 0.05)}, ${(0.9 + 0.1 * fade) * (1 - land * 0.1)}) rotate(${(1 - fly) * 6}deg)`, transformOrigin: '0% 100%'}}>
            <BubbleCard c={c} w={w} hot={i === hotIndex} hotText={hotText} />
          </div>
        );
      })}
      {comments.map((_, i) => (
        <div key={i}>
          <Shockwave x={LEFT + 110} y={slotY(i)} at={T(i) + 10} color="#ffffff" maxR={150} life={12} width={10} rays={8} seed={i + 50} />
          {audio && <Sfx at={T(i) + 9} src={mcSound('random/pop')} volume={0.3} rate={1.0 + (i % 4) * 0.12} />}
          {audio && <Sfx at={T(i)} src={mcSound('random/click')} volume={0.15} rate={1.6} />}
        </div>
      ))}
      <Particles list={hearts} />

      {/* header chip with counter */}
      <At x={1560} y={472} s={chipIn} sx={1 + wobble(f, T(2) + 10, 12, 3) * 0.04}>
        <div style={{...chunky('#fff4d6', '#f1deae', '#ffffff', {r: 60, b: 10, sh: 14, band: 12}), width: 540, height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <Sp s={CHATB} k="chatb" px={8} drop={1} />
            <Label size={58} color={INK} style={{WebkitTextStroke: '0px', textShadow: 'none'}}>{header}</Label>
          </div>
          <Odometer value={count} digits={4} size={96} color={FLAT.sky} />
        </div>
      </At>
      <At x={1560} y={722 + bob(f, 40, 6)} s={spring(f, 22, 20)} rot={-4}>
        <div style={{...chunky(FLAT.pink, FLAT.pinkDeep, '#ffa6c4', {r: 50, b: 10, sh: 12, band: 12}), padding: '0 34px', height: 100, display: 'flex', alignItems: 'center', gap: 16}}>
          <Sp s={HEART_BIG} k="hb" px={5} drop={1} />
          <Label size={50} color="#ffffff">{badgeText}</Label>
        </div>
      </At>

      {/* decor */}
      <Orn x={1640} y={950} at={16} rot={14} bobAmp={12} period={56}><Sp s={STAR_BIG} k="star" px={9} drop={1} /></Orn>
      <Orn x={1220} y={600} at={20} rot={-12} bobAmp={12}><Sp s={HEART_PINK} k="hp" px={8} drop={1} /></Orn>
      <Orn x={1800} y={900} at={24} rot={-8} bobAmp={14} period={52}><Mob k="pig" scale={13} drop={8} /></Orn>
      <Orn x={1400} y={960} at={28} rot={6} bobAmp={10}><Mob k="slime" scale={10} drop={6} /></Orn>
      <Orn x={70} y={420} at={30} rot={-10} bobAmp={14}><Sp s={CHATB} k="chatb" px={9} drop={1} /></Orn>
      <Orn x={1850} y={640} at={34} rot={10} bobAmp={14} period={48}><Sp s={CHATB} k="chatb" px={7} drop={1} /></Orn>

      {audio && <Sfx at={T(n - 1) + 12} src={mcSound('random/orb')} volume={0.35} rate={1.6} />}
    </Stage>
  );
};

void lerp;
void rangeP;

export const danmakuEntry: FxEntry = {
  meta: {
    id: 'soc-danmaku',
    name: '弹幕评论 · 气泡堆叠',
    category: 'social',
    tags: ['弹幕', '评论', '气泡', '头像', '互动'],
    frames: 180,
    blurb: '一条条带头像和昵称的彩色评论气泡从右边飞来，过冲弹跳，落地果冻挤压，往上堆叠、挤走旧的；顶部三条弹幕车道横穿画面，右侧评论数滚动，气泡与爱心从底部飘起。',
    usage: '“看看大家怎么说”、评论区互动、反馈精选、热评展示；Layer 可直接叠在素材上。',
    params: [
      {name: 'bg', desc: '是否绘制演示背景'},
      {name: 'comments', desc: '评论数组 [{nick, text, face, color, deep}]，face: steve|alex|creeper|pig|slime|sunny|zuri|kai'},
      {name: 'gap', desc: '相邻气泡间隔帧数，默认 17'},
    ],
  },
  Demo: () => <DanmakuFx bg />,
  Layer: () => <DanmakuFx />,
};
