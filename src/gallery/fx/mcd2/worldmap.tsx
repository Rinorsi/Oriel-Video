// mcd-s-world-map-select: mission select on the parchment voxel sandbox. Targets: world-map-mission-select.png, mission-threat-panel.png, marker-mission.png.
// Hard cut onto the isometric floating-island map (ScenePlate world-map), gold hexagon skull nodes pop in one by one with a dotted trail growing between them,
// the chosen node swells (map pushes in) and the threat panel slides in with the I-VII difficulty ladder, power rows and gear drops.
// Props: bg, places (6 names), selected (0-based node), panelTitle.
import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {BevelSlot, CutPanel, DifficultyBar, ItemIcon3D, MCD, MainButton, McdText, PlayerFigure, PowerBadge, PxArt, PxText, SKULL_ROWS, SkullBadge, WhiteFlash, itemTex} from '../mcdkit/kit';
import {Backdrop, EASE, Particles, PxPlus, Sfx, Sq, genParts, lerp, mcSound, snap, stepped, win} from './common';

const TOTAL = 180;

const NODES: [number, number][] = [
  [380, 610],
  [560, 430],
  [860, 372],
  [1010, 700],
  [1330, 436],
  [1640, 650],
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const Check: FC = () => (
  <svg width={34} height={34} viewBox="0 0 10 10" shapeRendering="crispEdges">
    <rect x={0} y={0} width={10} height={10} fill="#000" />
    <rect x={1} y={1} width={8} height={8} fill="#3FA55A" />
    <path d="M2 5 L4 7 L8 3" stroke="#fff" strokeWidth={1.4} fill="none" />
  </svg>
);

export const WorldMap: FC<{bg?: boolean; audio?: boolean; places?: string[]; selected?: number; panelTitle?: string; button?: string; power?: number}> = ({bg, audio = bg, button = '开始任务', power = 143, places = ['苦力怕森林', '沼泽湿地', '沙漠神殿', '红石矿山', '冰封之巅', '黑曜尖塔'], selected = 3, panelTitle}) => {
  const f = useCurrentFrame();
  const SEL = selected;
  const selAt = 72;
  const zoom = 1 + 0.1 * EASE.out(win(f, selAt, 22)) - 0.1 * EASE.in(win(f, TOTAL - 20, 14));
  const [sx, sy] = NODES[SEL];
  const panelT = EASE.out(win(f, 86, 12));
  const panK = EASE.inOut(win(f, selAt, 24)) * (1 - EASE.in(win(f, TOTAL - 20, 14)));
  const exit = 1 - win(f, TOTAL - 18, 14);
  const level = f < 132 ? 4 : f < 146 ? 5 : 6;
  const lvFlash = (f >= 132 && f < 138) || (f >= 146 && f < 152);
  const trail: ReactNode[] = [];
  NODES.slice(0, -1).forEach((a, i) => {
    const b = NODES[i + 1];
    const t0 = 12 + i * 7;
    const g = EASE.out(win(f, t0, 10));
    const cx = (a[0] + b[0]) / 2 + (i % 2 ? 40 : -40);
    const cy = (a[1] + b[1]) / 2 - 70;
    const n = 14;
    for (let k = 1; k < n; k++) {
      const u = k / n;
      if (u > g) break;
      const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * b[0];
      const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cy + u * u * b[1] + 36;
      if (k % 2) continue;
      trail.push(<Sq key={`${i}-${k}`} x={snap(x - 11, 2)} y={snap(y - 11, 2)} s={22} c="#F3E4C8" o={0.9} />);
      trail.push(<Sq key={`${i}-${k}d`} x={snap(x - 7, 2)} y={snap(y - 7, 2)} s={14} c="#4A2E12" />);
    }
  });
  const selBurst = genParts({n: 22, seed: 83, x: sx, y: sy - 20, sx: 10, sy: 10, a0: -Math.PI, a1: Math.PI, v0: 4, v1: 16, drag: 0.1, life0: 16, life1: 30, size0: 8, size1: 14, colors: ['#FCD448', '#FFFFFF', '#F4B55A'], kinds: ['plus', 'sq']});
  const title = panelTitle ?? places[SEL];

  return (
    <AbsoluteFill>
      {bg && <AbsoluteFill style={{background: '#E4D3BA'}} />}
      <AbsoluteFill style={{transform: `translate(${-(sx - 600) * panK}px, ${-(sy - 600) * panK * 0.5}px) scale(${zoom})`, transformOrigin: `${sx}px ${sy}px`}}>
        {bg && <Backdrop biome="world-map" loop={TOTAL} dim={0} camera="static" />}
        {trail}
        {NODES.map(([x, y], i) => {
          const at = 8 + i * 7;
          const t = EASE.back(win(f, at, 9));
          if (f < at) return null;
          const isSel = i === SEL && f >= selAt;
          const done = i < SEL;
          const w = isSel ? 128 : 84;
          const pulse = isSel ? 1 + 0.04 * Math.sin((f - selAt) * 0.3) : 1;
          return (
            <div key={i}>
              {/* soft offset shadow */}
              <div style={{position: 'absolute', left: x - 36 + 14, top: y - 40 + 22, width: 72, height: 72, background: 'rgba(90,70,40,0.32)', clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)', opacity: t > 0 ? 1 : 0, transform: `scale(${isSel ? 1.4 : 1})`}} />
              <div style={{position: 'absolute', left: x - w / 2, top: y - (isSel ? w * 0.62 : w * 0.58), transform: `scale(${t * pulse})`, transformOrigin: '50% 80%'}}>
                {isSel ? <SkullBadge size={w} selected numeral={ROMAN[3]} /> : <SkullBadge size={w} />}
                {done && (
                  <div style={{position: 'absolute', right: -10, top: -6}}>
                    <Check />
                  </div>
                )}
              </div>
              <div style={{position: 'absolute', left: x - 120, top: y + (isSel ? 78 : 48), width: 240, display: 'flex', justifyContent: 'center', opacity: stepped(win(f, at + 4, 6), 3)}}>
                <div style={{background: 'rgba(24,18,14,0.82)', padding: '4px 16px 6px'}}>
                  <McdText size={28} weight={700} color="#FFFFFF">{places[i]}</McdText>
                </div>
              </div>
            </div>
          );
        })}
        <Particles parts={selBurst} at={selAt} />
        {f >= selAt && f < selAt + 8 && <PxPlus x={sx} y={sy - 24} u={10} arm={8 - (f - selAt)} c="#FCD448" core="#fff" />}
      </AbsoluteFill>

      {/* threat panel */}
      <AbsoluteFill style={{opacity: stepped(Math.min(win(f, 86, 6), exit), 4), transform: `translateX(${(1 - panelT) * 140 + (1 - exit) * 80}px)`}}>
        <div style={{position: 'absolute', left: 1150, top: 56}}>
          <CutPanel w={680} h={968} cuts={[0, 0, 0, 0]} fill="#16161A" edge="#2A2A30" glow="rgba(140,40,30,0.4)">
            <div style={{position: 'absolute', left: 0, top: 0, width: 680, height: 200, overflow: 'hidden', background: 'linear-gradient(180deg,#1C2636 0%,#0F131B 100%)'}}>
              {[
                ['zuri', 100, 56],
                ['kai', 230, 40],
                ['efe', 380, 60],
                ['makena', 510, 44],
              ].map(([s, x, y], i) => (
                <div key={s as string} style={{position: 'absolute', left: x as number, top: (y as number) + (1 - EASE.out(win(f, 90 + i * 3, 8))) * 60, filter: 'drop-shadow(3px 0 0 #D8302C) drop-shadow(-3px 0 0 #D8302C) drop-shadow(0 3px 0 #D8302C) drop-shadow(0 -3px 0 #D8302C)'}}>
                  <PlayerFigure skin={s as string} scale={5} />
                </div>
              ))}
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, background: 'linear-gradient(180deg, rgba(22,22,26,0), #16161A)'}} />
              <div style={{position: 'absolute', left: 22, top: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#2A2A2E', padding: '8px 16px 8px 12px', boxShadow: 'inset 0 0 0 3px #3A3A40'}}>
                <PxArt rows={SKULL_ROWS} pal={{k: '#fff'}} px={3} />
                <PxText text="冒险" px={2} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 44, top: 216, opacity: stepped(win(f, 92, 6), 3)}}>
              <PxText text={title} px={5} />
            </div>
            <div style={{position: 'absolute', left: 150, top: 308, opacity: stepped(win(f, 96, 6), 3)}}>
              <PxText text={`冒险 ${ROMAN[level - 1]}`} px={2} />
            </div>
            <div style={{position: 'absolute', left: 0, top: 330, filter: lvFlash ? 'brightness(1.35)' : undefined}}>
              <DifficultyBar level={level} w={680} nodeW={42} reveal={EASE.out(win(f, 100, 26))} />
            </div>
            <div style={{position: 'absolute', left: 44, top: 566, opacity: stepped(win(f, 120, 8), 3)}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <svg width={32} height={32} viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill="#8A8A92" /><polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill="#16161A" /></svg>
                <McdText size={30} weight={700}>{`推荐战力：${33 + (level - 4) * 24}`}</McdText>
              </div>
              <McdText size={26} color="#D8D8DC" style={{display: 'block', marginTop: 10, marginLeft: 48}}>{`${((level - 4) * 0.3).toFixed(1)} 倍难度`}</McdText>
              <McdText size={26} color="#D8D8DC" style={{display: 'block', marginTop: 6, marginLeft: 48}}>装备与神器战力：35-95</McdText>
            </div>
            <div style={{position: 'absolute', right: 44, top: 566, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, opacity: stepped(win(f, 124, 8), 3)}}>
              <McdText size={26} weight={700}>你的战力</McdText>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <PowerBadge power={power} w={50} label={false} />
                <PxText text={String(power)} px={5} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 44, top: 730}}>
              <McdText size={24} weight={700} style={{letterSpacing: 1, opacity: stepped(win(f, 128, 6), 3)}}>战利品</McdText>
              <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                {['iron_sword', 'bow', 'crossbow_standby', 'trident', 'iron_helmet', 'bone'].map((s, i) => (
                  <div key={s} style={{transform: `scale(${EASE.back(win(f, 130 + i * 3, 8))})`, opacity: f >= 130 + i * 3 ? 1 : 0}}>
                    <BevelSlot size={78} rarity="common">
                      <ItemIcon3D src={itemTex(s)} size={50} depth={3} />
                    </BevelSlot>
                  </div>
                ))}
              </div>
            </div>
            <div style={{position: 'absolute', left: 44, top: 868, opacity: stepped(win(f, 140, 8), 3)}}>
              <MainButton label={button} w={592} h={76} press={f >= 160 && f < 166 ? 1 : 0} />
            </div>
          </CutPanel>
        </div>
      </AbsoluteFill>
      <WhiteFlash at={0} dur={4} peak={0.35} steps={2} />
      <WhiteFlash at={selAt} dur={3} peak={0.15} steps={1} />
      {audio && (
        <>
          {NODES.map((_, i) => <Sfx key={i} at={8 + i * 7} src={mcSound('random/click')} volume={0.18} rate={1 + i * 0.07} />)}
          <Sfx at={selAt} src={mcSound('random/orb')} volume={0.35} />
          <Sfx at={86} src={mcSound('ui/toast/in')} volume={0.3} />
          <Sfx at={160} src={mcSound('random/click')} volume={0.3} rate={0.8} />
        </>
      )}
      <div style={{display: 'none'}}>{MCD.gold}{lerp(0, 1, 0)}</div>
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-world-map-select',
      name: '世界地图选关',
      category: 'rpg',
      tags: ['地下城', '世界地图', '选关', '节点', '难度', '羊皮纸'],
      frames: TOTAL,
      blurb: '硬切到米色羊皮纸上的等距悬浮岛沙盘，金色六边形骷髅节点逐个弹出、虚线小路在节点间生长，选中节点放大并推近镜头，右侧弹出任务威胁面板（I–VII 难度条逐级点亮、战力、战利品槽、开始按钮）。',
      usage: '路线图/章节目录/功能规划：用节点表示阶段，选中节点展开详情。Layer 版只含节点、小路和面板，可叠在你自己的地图图片上。',
      params: [
        {name: 'places', desc: '六个节点的名称'},
        {name: 'selected', desc: '被选中的节点序号（0 起）'},
        {name: 'panelTitle', desc: '面板标题，默认取选中节点名'},
        {name: 'bg', desc: '是否绘制 3D 沙盘背景'},
      ],
    },
    Demo: () => <WorldMap bg />,
    Layer: () => <WorldMap />,
  },
];
