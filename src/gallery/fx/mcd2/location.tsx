// mcd-s-location-card / mcd-s-location-card-big: destination cards.
// Label: bottom-left loading tag (loading-cinematic-destination-label.png, loading-label-block-icon-lava.png): bevelled block icon that swaps texture
// every ~0.6 s, small "HEADING TO" line and a gold-orange place name with a hard shadow, plus the gold skull difficulty badge top right.
// Big: full-width dark band with the name in large gold block type (glitch-in, then settle), flanked by gold rules, pixel brackets and rising embers.
// Props: bg, place, sub, blocks (texture ids), swap (frames per icon), difficulty.
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import type {FxEntry} from '../../types';
import {BevelSlot, Embers, GlitchTitle, McdText, PxText, SkullBadge, WhiteFlash} from '../mcdkit/kit';
import {Backdrop, EASE, Row, Sfx, mcSound, snap, stepped, win} from './common';

const BlockIcon: FC<{name: string; size: number}> = ({name, size}) => (
  <div style={{width: size, height: size, backgroundImage: `url(${block(name)})`, backgroundSize: '100% auto', backgroundPosition: '0 0', imageRendering: 'pixelated'}} />
);

const GOLD = {color: '#FDD467', hi: '#FFEFA8', shadowColor: '#4A2A08'} as const;

// ------------------------------------------------------------------ label (overlay)

const TOTAL = 150;

export const Label: FC<{bg?: boolean; audio?: boolean; place?: string; sub?: string; blocks?: string[]; swap?: number}> = ({bg, audio = bg, place = '苦力怕森林', sub = '正在前往', blocks = ['stone', 'cobblestone', 'magma', 'redstone_block', 'netherrack'], swap = 18}) => {
  const f = useCurrentFrame();
  const inT = win(f, 2, 8);
  const exit = 1 - win(f, TOTAL - 14, 10);
  const o = stepped(Math.min(inT, exit), 4);
  const idx = Math.floor(Math.max(0, f - 6) / swap) % blocks.length;
  const sw = Math.max(0, f - 6) % swap;
  const pop = sw < 4 ? 0.88 + 0.12 * (sw / 4) : 1;
  const flash = sw < 3 && f > 8 ? 1 - sw / 3 : 0;
  return (
    <AbsoluteFill>
      {bg && <Backdrop biome="desert" loop={TOTAL} dim={0.3} dof camera="push" />}
      {/* legibility gradient bottom-left / top-right */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 45% at 8% 100%, rgba(2,2,6,0.78), rgba(2,2,6,0) 70%)', opacity: o}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 40% 30% at 96% 0%, rgba(2,2,6,0.6), rgba(2,2,6,0) 70%)', opacity: o}} />
      <div style={{position: 'absolute', left: 72, bottom: 64, display: 'flex', alignItems: 'flex-end', gap: 30, opacity: o, transform: `translateY(${(1 - EASE.out(inT)) * 24}px) translateY(${(1 - exit) * 12}px)`}}>
        <div style={{transform: `scale(${pop})`, transformOrigin: '50% 100%', filter: flash ? `brightness(${1 + flash * 0.7})` : undefined}}>
          <BevelSlot size={150} rarity="plain" drop>
            <BlockIcon name={blocks[idx]} size={104} />
          </BevelSlot>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 6}}>
          <McdText size={34} weight={600} color="#FDF7EA">{sub}</McdText>
          <PxText text={place} px={5} {...GOLD} />
        </div>
      </div>
      <div style={{position: 'absolute', right: 80, top: 56, opacity: o, transform: `scale(${EASE.back(win(f, 8, 8))})`, transformOrigin: '100% 0%'}}>
        <SkullBadge size={96} />
      </div>
      {audio && <Sfx at={4} src={mcSound('ui/toast/in')} volume={0.3} />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ big card

const BIG = 150;

const Bracket: FC<{x: number; y: number; flipX?: boolean; flipY?: boolean; o: number}> = ({x, y, flipX, flipY, o}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 56, height: 56, opacity: o, transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 56, height: 10, background: '#FEC304', boxShadow: '4px 4px 0 #2A1600'}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: 10, height: 56, background: '#FEC304', boxShadow: '4px 4px 0 #2A1600'}} />
  </div>
);

export const Big: FC<{bg?: boolean; audio?: boolean; place?: string; sub?: string; tag?: string}> = ({bg, audio = bg, place = '苦力怕森林', sub = '正在前往', tag = '第三章 · 难度 III'}) => {
  const f = useCurrentFrame();
  const band = Math.min(Math.round(EASE.out(win(f, 0, 9)) * 6) / 6, 1 - Math.round(EASE.in(win(f, BIG - 16, 10)) * 6) / 6);
  const H = 360 * band;
  const lines = EASE.out(win(f, 10, 18)) * (1 - win(f, BIG - 18, 8));
  const nameOp = f >= 12 ? 1 : 0;
  const outA = 1 - win(f, BIG - 18, 10);
  return (
    <AbsoluteFill>
      {bg && <Backdrop biome="nether" loop={BIG} dim={0.4} dark={0.25} sat={0.9} camera="push" />}
      {/* black band */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 540 - H / 2, height: H, background: 'rgba(3,2,6,0.82)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 540 - H / 2 - 6, height: 6, background: '#FEC304', opacity: band > 0 ? 1 : 0}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 540 + H / 2, height: 6, background: '#FEC304', opacity: band > 0 ? 1 : 0}} />
      <Bracket x={96} y={540 - 180 + 24} o={band > 0.8 ? 1 : 0} />
      <Bracket x={1920 - 96 - 56} y={540 - 180 + 24} flipX o={band > 0.8 ? 1 : 0} />
      <Bracket x={96} y={540 + 180 - 24 - 56} flipY o={band > 0.8 ? 1 : 0} />
      <Bracket x={1920 - 96 - 56} y={540 + 180 - 24 - 56} flipX flipY o={band > 0.8 ? 1 : 0} />
      <Row y={540 - 150} style={{opacity: stepped(Math.min(win(f, 10, 6), outA), 4), gap: 28}}>
        <div style={{width: 260 * lines, height: 6, background: '#FDD467', boxShadow: '4px 4px 0 #2A1600'}} />
        <McdText size={40} weight={600} color="#FDF7EA" style={{letterSpacing: 6}}>{sub}</McdText>
        <div style={{width: 260 * lines, height: 6, background: '#FDD467', boxShadow: '4px 4px 0 #2A1600'}} />
      </Row>
      <Row y={540 - 78} style={{opacity: outA * nameOp, transform: `scale(${1 + 0.035 * win(f, 14, BIG - 30)})`}}>
        <GlitchTitle text={place} at={12} glitch={3} amp={10} px={10} bands={['#FFEFA8', '#FEC304', '#F9A907', '#EB9907']} shadowColor="#2A1600" shadow={1} />
      </Row>
      <Row y={540 + 100} style={{opacity: stepped(Math.min(win(f, 22, 8), outA), 4), gap: 24}}>
        <SkullBadge size={64} />
        <McdText size={38} weight={700} color="#E8E0CC" style={{letterSpacing: 3}}>{tag}</McdText>
      </Row>
      <Embers count={44} color="#FEC304" core="#FFF6C0" area={[0, 0, 1920, 1080]} size={8} seed={19} speed={0.7} style={{opacity: win(f, 8, 10) * outA}} />
      <WhiteFlash at={11} dur={4} peak={0.25} steps={2} />
      {audio && <Sfx at={10} src={mcSound('random/anvil_land')} volume={0.25} rate={0.8} />}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-location-card',
      name: '地名标签 · 正在前往',
      category: 'rpg',
      tags: ['地下城', '地名', '加载', '标签', '叠加层'],
      frames: TOTAL,
      blurb: '左下角方块图标框（石头→圆石→岩浆→红石块循环换贴图）+ “正在前往”小字 + 金橙色地名，右上角金色骷髅难度徽章；自下而上淡入，结尾淡出。',
      usage: '每个新场景/章节/地图开头的“我们现在在哪”小标签，叠在转场后的第一个镜头上。图标贴图可换成该地点的代表方块。',
      params: [
        {name: 'place / sub', desc: '地名与上方小字'},
        {name: 'blocks', desc: '循环的方块贴图 id 列表'},
        {name: 'swap', desc: '换图标的间隔帧数，默认 18'},
        {name: 'bg', desc: '是否绘制带景深的 3D 场景背景'},
      ],
    },
    Demo: () => <Label bg />,
    Layer: () => <Label />,
  },
  {
    meta: {
      id: 'mcd-s-location-card-big',
      name: '大字地名卡',
      category: 'rpg',
      tags: ['地下城', '地名', '标题卡', '章节', '金字'],
      frames: BIG,
      blurb: '黑色横带从中线展开，两侧金线，金字地名先像素错位 3 帧再拼成清晰金字（四角像素括号，金色火星上飘），下方骷髅徽章与章节难度，结尾横带收拢。',
      usage: '章节标题卡、地图/维度切换、“第 N 期”片头；比小标签更强调仪式感。',
      params: [
        {name: 'place / sub / tag', desc: '大字地名、上方小字、下方章节难度'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <Big bg />,
    Layer: () => <Big />,
  },
];
void snap;
