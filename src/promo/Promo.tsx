import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {McdEndCard, McdLEmbers, McdVoxelLogo, ScenePlate} from '../lib';
import {PIXEL_FONT, TITLE_FONT} from '../mc/fonts';
import {FPS, MC, EASE, clamp01, textShadowColor} from '../mc/theme';
import timeline from './timeline.json';

/**
 * 优易库 宣传片（约 87 秒）。时间轴以配音为准：`timeline.json` 由 TTS 分句生成（见 promo/tts.py、promo/align.py），
 * 下面所有时间都是「配音时间（秒）」，加上 OFF 才是视频时间。画面全部来自本库：
 *  - 实时渲染：ScenePlate、McdVoxelLogo、McdEndCard、McdLEmbers 和自绘的步骤卡片
 *  - 已渲染片段：public/promo/clips/*.mp4（`npm run promo:clips` 用库里的效果渲染 1080p，不进 git）
 */

export const OFF = 1.0;
export const PROMO_SECONDS = 87;
export const PROMO_FRAMES = PROMO_SECONDS * FPS;

const F = (vo: number) => Math.round((vo + OFF) * FPS);

/** Place children from VO second a to b. */
const At: FC<{a: number; b: number; children: ReactNode}> = ({a, b, children}) => (
  <Sequence from={F(a)} durationInFrames={Math.max(1, F(b) - F(a))}>
    {children}
  </Sequence>
);

const shadow = (c: string, px = 4) => `${px}px ${px}px 0 ${textShadowColor(c)}`;

/** Pre-rendered library effect, trimmed. `ss` = start second inside the clip. Audio ducked under the voice. */
const Clip: FC<{id: string; ss?: number; vol?: number; scale?: number}> = ({id, ss = 0, vol = 0.3, scale = 1}) => (
  <AbsoluteFill style={{transform: scale === 1 ? undefined : `scale(${scale})`}}>
    <OffthreadVideo src={staticFile(`promo/clips/${id}.mp4`)} startFrom={Math.round(ss * FPS)} volume={vol} />
  </AbsoluteFill>
);

/** Fades its children in/out over `fade` frames at the edges of the surrounding Sequence. */
const Fade: FC<{dur: number; fade?: number; children: ReactNode}> = ({dur, fade = 5, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, fade, dur - fade, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

/** Gold section label on the top-left, like a dungeon location tag. */
const Tag: FC<{text: string; sub?: string}> = ({text, sub}) => {
  const f = useCurrentFrame();
  const p = EASE.out(clamp01(f / 10));
  return (
    <div style={{position: 'absolute', left: 72, top: 112, transform: `translateX(${(1 - p) * -60}px)`, opacity: p}}>
      {sub && <div style={{fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray, textShadow: shadow(MC.gray, 2), marginBottom: 6}}>{sub}</div>}
      <div style={{fontFamily: PIXEL_FONT, fontSize: 60, color: MC.gold, textShadow: shadow(MC.gold, 4), letterSpacing: 4}}>{text}</div>
      <div style={{height: 4, width: 120, marginTop: 8, background: MC.gold}} />
    </div>
  );
};

const Subtitles: FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS - OFF;
  const seg = timeline.segments.find((s) => t >= s.start - 0.05 && t <= s.end + 0.12);
  if (!seg) return null;
  const text = seg.text.replace(/[，。！？、]/g, (m) => (m === '，' || m === '、' ? ' ' : '')).trim();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 210, background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 48, color: MC.white, textShadow: shadow(MC.white, 3), paddingBottom: 64, letterSpacing: 2, whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};

const Px: FC<{style: CSSProperties; children: ReactNode}> = ({style, children}) => <div style={{position: 'absolute', ...style}}>{children}</div>;

/** Dark dungeon-style panel: no rounded corners, gold edge. */
const Panel: FC<{style: CSSProperties; edge?: string; children?: ReactNode}> = ({style, edge = MC.gold, children}) => (
  <div style={{position: 'absolute', background: 'rgba(14,12,22,0.92)', border: `4px solid ${edge}`, boxShadow: '8px 8px 0 rgba(0,0,0,0.55)', ...style}}>{children}</div>
);

/* ------------------------------ hook (0 - 9s) ------------------------------ */

const Hook1: FC = () => {
  const f = useCurrentFrame();
  const p = EASE.out(clamp01(f / 14));
  return (
    <AbsoluteFill>
      <ScenePlate biome="forest-day" camera="static" />
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.38)'}} />
      <Px style={{left: 0, right: 0, top: 380, textAlign: 'center', transform: `scale(${0.7 + 0.3 * p})`, opacity: p}}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 132, color: MC.white, textShadow: shadow(MC.white, 8), letterSpacing: 8}}>转场，卡住了？</div>
      </Px>
    </AbsoluteFill>
  );
};

const BIOMES = ['forest-day', 'desert', 'nether', 'end', 'snow', 'camp'] as const;

const HardCuts: FC = () => {
  const f = useCurrentFrame();
  const idx = Math.floor(f / 11);
  const stamp = f > 36 ? '找素材  又麻烦' : '硬切  太生硬';
  const shake = f % 11 < 2 ? 6 : 0;
  return (
    <AbsoluteFill>
      <Sequence from={idx * 11} durationInFrames={11} key={idx}>
        <ScenePlate biome={BIOMES[idx % BIOMES.length]} camera="static" />
      </Sequence>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.45)'}} />
      <Px style={{left: 0, right: 0, top: 420, textAlign: 'center', transform: `translateX(${shake}px) rotate(${f % 22 < 11 ? -2 : 2}deg)`}}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 108, color: MC.red, textShadow: shadow(MC.red, 8), letterSpacing: 6}}>{stamp}</div>
      </Px>
    </AbsoluteFill>
  );
};

const RevealCaption: FC = () => {
  const f = useCurrentFrame();
  const p = EASE.back(clamp01(f / 12));
  return (
    <Px style={{left: 0, right: 0, top: 120, textAlign: 'center', transform: `scale(${p})`, opacity: p}}>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 96, color: MC.gold, textShadow: shadow(MC.gold, 6), letterSpacing: 6}}>一整套转场特效库</div>
    </Px>
  );
};

/* ------------------------------ title ------------------------------ */

const Counter: FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(216 * EASE.out(clamp01((f - 6) / 70)));
  const o = clamp01((f - 4) / 8);
  return (
    <Px style={{left: 0, right: 0, bottom: 200, textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: PIXEL_FONT, fontSize: 132, color: MC.gold, textShadow: shadow(MC.gold, 8)}}>{n}</span>
      <span style={{fontFamily: PIXEL_FONT, fontSize: 60, color: MC.white, textShadow: shadow(MC.white, 4), marginLeft: 20}}>个转场 · 特效 · 字卡</span>
    </Px>
  );
};

/* ------------------------------ steps (52.5 - 76) ------------------------------ */

const STEPS = ['交给 AI', '说想法', '渲染'];

const StepBar: FC<{current: number}> = ({current}) => (
  <Px style={{left: 0, right: 0, top: 56, display: 'flex', justifyContent: 'center', gap: 36}}>
    {STEPS.map((s, i) => {
      const on = i === current;
      const done = i < current;
      const c = on ? MC.gold : done ? MC.green : MC.gray;
      return (
        <div key={s} style={{display: 'flex', alignItems: 'center', gap: 16, opacity: on ? 1 : 0.6}}>
          <div style={{width: 64, height: 64, background: on ? 'rgba(255,170,0,0.2)' : 'rgba(0,0,0,0.5)', border: `4px solid ${c}`, transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{transform: 'rotate(-45deg)', fontFamily: PIXEL_FONT, fontSize: 36, color: c, textShadow: shadow(c, 2)}}>{done ? '✓' : i + 1}</span>
          </div>
          <span style={{fontFamily: PIXEL_FONT, fontSize: 36, color: c, textShadow: shadow(c, 3)}}>{s}</span>
        </div>
      );
    })}
  </Px>
);

const FileCard: FC<{name: string; note: string; x: number; y: number; delay: number}> = ({name, note, x, y, delay}) => {
  const f = useCurrentFrame();
  const p = EASE.back(clamp01((f - delay) / 14));
  const fly = EASE.inOut(clamp01((f - 62) / 22));
  return (
    <Panel style={{left: x + fly * (960 - 160 - x), top: y + fly * (420 - y), width: 520, padding: '20px 28px', transform: `scale(${p * (1 - fly * 0.35)})`, opacity: p * (1 - fly)}}>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 36, color: MC.aqua, textShadow: shadow(MC.aqua, 3)}}>{name}</div>
      <div style={{fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray, marginTop: 8}}>{note}</div>
    </Panel>
  );
};

const AiBox: FC<{label?: string}> = ({label = 'AI'}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 6) * 6;
  return (
    <Panel edge={MC.purple} style={{left: 760, top: 340 + bob, width: 400, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <span style={{fontFamily: PIXEL_FONT, fontSize: 132, color: MC.purple, textShadow: shadow(MC.purple, 8)}}>{label}</span>
    </Panel>
  );
};

const Step1: FC = () => (
  <AbsoluteFill>
    <StepBar current={0} />
    <FileCard name="AI使用手册.md" note="怎么用库拼一集视频" x={140} y={300} delay={4} />
    <FileCard name="catalog.json" note="全部效果的机器可读目录" x={140} y={520} delay={16} />
    <AiBox />
  </AbsoluteFill>
);

const Step2: FC = () => {
  const f = useCurrentFrame();
  const msg = '来一期下界探险：开场传送门白闪，中间 Boss 登场，最后放结算页';
  const n = Math.min(msg.length, Math.floor(Math.max(0, f - 6) * 0.65));
  const chips = [
    {t: 'mcdPortalWhiteout', c: MC.aqua, at: 62},
    {t: 'McdBossIntro', c: MC.red, at: 76},
    {t: 'McdResults', c: MC.gold, at: 90},
  ];
  return (
    <AbsoluteFill>
      <StepBar current={1} />
      <Panel style={{left: 220, top: 250, width: 1480, padding: '36px 44px'}} edge={MC.gray}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray, marginBottom: 12}}>你</div>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 48, color: MC.white, textShadow: shadow(MC.white, 3), lineHeight: 1.4, minHeight: 140}}>
          {msg.slice(0, n)}
          <span style={{opacity: f % 12 < 6 ? 1 : 0}}>▌</span>
        </div>
      </Panel>
      <Px style={{left: 220, top: 560, display: 'flex', gap: 28}}>
        {chips.map((c) => {
          const p = EASE.back(clamp01((f - c.at) / 12));
          return (
            <Panel key={c.t} edge={c.c} style={{position: 'relative', padding: '18px 30px', transform: `scale(${p})`, opacity: p}}>
              <div style={{fontFamily: PIXEL_FONT, fontSize: 24, color: MC.gray}}>AI 选中</div>
              <div style={{fontFamily: PIXEL_FONT, fontSize: 40, color: c.c, textShadow: shadow(c.c, 3)}}>{c.t}</div>
            </Panel>
          );
        })}
      </Px>
    </AbsoluteFill>
  );
};

const Step3: FC = () => {
  const f = useCurrentFrame();
  const prog = clamp01((f - 18) / 62);
  const done = prog >= 1;
  const bar = 22;
  return (
    <AbsoluteFill>
      <StepBar current={2} />
      <Panel edge={MC.green} style={{left: 260, top: 290, width: 1400, padding: '36px 48px'}}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 40, color: MC.green, textShadow: shadow(MC.green, 3)}}>$ npx remotion render Promo out.mp4</div>
        <div style={{display: 'flex', gap: 4, marginTop: 40}}>
          {Array.from({length: bar}, (_, i) => (
            <div key={i} style={{flex: 1, height: 44, background: i < Math.round(prog * bar) ? MC.green : 'rgba(255,255,255,0.12)'}} />
          ))}
        </div>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 40, color: done ? MC.gold : MC.gray, textShadow: done ? shadow(MC.gold, 3) : undefined, marginTop: 28}}>
          {done ? '✓ out.mp4 已生成' : `渲染中 ${Math.round(prog * 100)}%`}
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

const Checker: FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: '#2b2b33',
      backgroundImage: 'linear-gradient(45deg,#3a3a45 25%,transparent 25%,transparent 75%,#3a3a45 75%),linear-gradient(45deg,#3a3a45 25%,transparent 25%,transparent 75%,#3a3a45 75%)',
      backgroundSize: '64px 64px',
      backgroundPosition: '0 0,32px 32px',
    }}
  />
);

const Alpha: FC = () => {
  const f = useCurrentFrame();
  const p = EASE.out(clamp01(f / 16));
  const apps = ['剪映', '其他剪辑软件'];
  return (
    <AbsoluteFill>
      <Checker />
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.35)'}} />
      <McdLEmbers />
      <Px style={{left: 0, right: 0, top: 300, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 96, color: MC.aqua, textShadow: shadow(MC.aqua, 6), letterSpacing: 4}}>导出透明层</div>
        <div style={{fontFamily: PIXEL_FONT, fontSize: 40, color: MC.gray, marginTop: 14}}>ProRes 4444 · .mov</div>
      </Px>
      <Px style={{left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', gap: 40}}>
        {apps.map((a, i) => {
          const q = EASE.back(clamp01((f - 40 - i * 12) / 12));
          return (
            <Panel key={a} edge={MC.gold} style={{position: 'relative', padding: '20px 40px', transform: `scale(${q})`, opacity: q}}>
              <span style={{fontFamily: PIXEL_FONT, fontSize: 48, color: MC.gold, textShadow: shadow(MC.gold, 3)}}>拖进 {a}</span>
            </Panel>
          );
        })}
      </Px>
    </AbsoluteFill>
  );
};

/* ------------------------------ main ------------------------------ */

/** Clip cuts inside one narration line: [clipId, startSecInClip, lengthSec]. */
const cuts = (a: number, parts: [string, number, number][], vol = 0.3): ReactNode =>
  parts.map(([id, ss, len], i) => {
    const from = a + parts.slice(0, i).reduce((s, p) => s + p[2], 0);
    return (
      <At key={id + i} a={from} b={from + len}>
        <Clip id={id} ss={ss} vol={vol} />
      </At>
    );
  });

export const Promo: FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const bgmVol = interpolate(t, [0, 1.2, OFF + 76, OFF + 80, 83, PROMO_SECONDS], [0, 0.34, 0.34, 0.55, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('promo/audio/bgm.mp3')} volume={bgmVol} />
      <Sequence from={F(0)}>
        <Audio src={staticFile('promo/audio/vo.wav')} volume={1.15} />
      </Sequence>

      {/* 钩子 */}
      <At a={-1} b={3.7}>
        <Hook1 />
      </At>
      <At a={3.7} b={6.45}>
        <HardCuts />
      </At>
      <At a={6.45} b={8.0}>
        <Clip id="mcd-t-chest-beam" ss={0.2} vol={0.4} />
      </At>
      <At a={6.45} b={9.3}>
        <RevealCaption />
      </At>

      {/* 标题 */}
      <At a={7.9} b={14.0}>
        <AbsoluteFill>
          <McdVoxelLogo bg text="优易库" sub="" tint="gold" maxW={1300} cjkRows={20} cube={20} exit={150} />
        </AbsoluteFill>
      </At>
      <At a={10.6} b={14.0}>
        <Counter />
      </At>

      {/* 地下城风格 14.0 - 26.9 */}
      <At a={14.0} b={17.6}>
        <Clip id="mcd-t-loading-label" ss={0.5} />
        <Tag text="地下城风格" sub="转场 · 标题 · 结算" />
      </At>
      {cuts(17.6, [
        ['mcd-t-portal-whiteout', 0.9, 1.4],
        ['mcd-t-chest-beam', 0.4, 1.4],
        ['mcd-t-lightning-flash', 0.3, 1.4],
      ])}
      {cuts(21.8, [
        ['mcd-s-boss-intro', 1.0, 1.75],
        ['mcd-c-chapter-card', 1.0, 1.65],
        ['mcd-s-results', 2.2, 1.7],
      ])}
      <At a={17.6} b={26.9}>
        <Tag text="地下城风格" sub="Boss · 章节 · 结算" />
      </At>

      {/* 可爱风格 26.9 - 35.5 */}
      <At a={26.9} b={30.8}>
        <Clip id="cute-chest-pop" ss={0.2} />
      </At>
      {cuts(30.8, [
        ['cute-creeper-rush', 0.5, 1.55],
        ['cute-slime-splat', 0.5, 1.55],
        ['cute-heart-wave', 0.5, 1.6],
      ])}
      <At a={26.9} b={35.5}>
        <Tag text="可爱风格" sub="轻松 · 好玩" />
      </At>

      {/* 维度跳转 35.5 - 40.7 */}
      {cuts(35.5, [
        ['dim-overworld-to-nether', 1.6, 2.1],
        ['dim-nether-to-end', 1.6, 1.8],
        ['t2-end-portal', 0.7, 1.3],
      ])}
      <At a={35.5} b={40.7}>
        <Tag text="维度跳转" sub="主世界 → 下界 → 末地" />
      </At>

      {/* 叠加层 40.7 - 49.1 */}
      {cuts(40.7, [
        ['mcd-l-grade-nether', 3.0, 1.5],
        ['mcd-l-souls-drift', 2.8, 1.5],
        ['mcd-l-embers', 2.8, 1.7],
        ['mcd-l-god-rays', 2.8, 1.9],
        ['mcd-l-torch-glow', 2.5, 1.8],
      ])}
      <At a={40.7} b={49.1}>
        <Tag text="氛围叠加层" sub="调色 · 光柱 · 灵魂 · 火星" />
      </At>

      {/* 原版音效 49.1 - 52.4 */}
      <At a={49.1} b={52.4}>
        <Clip id="mcd-l-lightning-storm" ss={1.6} vol={0.9} />
        <Tag text="原版音效" sub="拿来就能用" />
      </At>

      {/* 三步 52.4 - 76 */}
      <At a={52.4} b={76.0}>
        <AbsoluteFill>
          <ScenePlate biome="camp" camera="static" />
          <AbsoluteFill style={{background: 'rgba(5,4,12,0.72)'}} />
        </AbsoluteFill>
      </At>
      <At a={52.4} b={56.7}>
        <Fade dur={F(56.7) - F(52.4)}>
          <Px style={{left: 0, right: 0, top: 300, textAlign: 'center'}}>
            <div style={{fontFamily: TITLE_FONT, fontSize: 200, color: MC.gold, textShadow: shadow(MC.gold, 10), letterSpacing: 10}}>只要三步</div>
          </Px>
          <StepBar current={-1} />
        </Fade>
      </At>
      <At a={56.7} b={60.75}>
        <Step1 />
      </At>
      <At a={60.75} b={65.65}>
        <Step2 />
      </At>
      <At a={65.65} b={69.65}>
        <Step3 />
      </At>
      <At a={69.65} b={76.0}>
        <Alpha />
      </At>

      {/* 收尾 */}
      <At a={76.0} b={86.0}>
        <McdEndCard bg kicker="Minecraft 转场 · 特效 · 动画库" title="优易库" thanks="感谢观看" link="" studios={[]} note="" />
      </At>

      <Subtitles />
    </AbsoluteFill>
  );
};
