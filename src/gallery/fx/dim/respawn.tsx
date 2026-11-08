import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Flash, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, OreButton, OreChip, OreText, PixelCursor, TYPE} from '../../../mg/Ore';
import {Vignette, mcSound, prog, reelSfx} from '../../../reel/kit';
import {DimSfx as Sfx} from './kit';
import {PlateA, PlateB} from '../../plates';
import {PixelSprite, type Sprite} from '../../flat';
import type {FxEntry} from '../../types';
import {BandTitle, ClickSpark, lerp, smooth} from './kit';

/**
 * Death -> respawn (bonus). Red hit flash, the world tilts over and greys out, the "你死了！" board appears (score counts up,
 * respawn / title buttons), a cursor clicks respawn, a white burst opens onto the spawn shot, which pulls back from a push-in.
 * Tunables: RESPAWN_CLICK (frame of the click), text in the component.
 */

const gold = '#ffc93a';
export const T15 = 196;
export const RESPAWN_CLICK = 128;

const GRAVE: Sprite = {
  rows: ['....GGGG....', '..GGLLLLGG..', '.GLLLLLLLLG.', '.GLLLDDLLLG.', 'GLLLLDDLLLLG', 'GLLDDDDDDLLG', 'GLLLLDDLLLLG', 'GLLLLDDLLLLG', 'GLLLLLLLLLLG', 'GLLLLLLLLLLG', 'GLLLLLLLLLLG', 'GLLLLLLLLLLG', 'GDDDDDDDDDDG', 'GGGGGGGGGGGG'],
  palette: {G: '#241c22', L: '#9a9aa4', D: '#5e5e6a'},
};

/** Props of Respawn. */
export type RespawnProps = {
  /** Footage where the player dies (tilts, greys out). Default: PlateA placeholder. */
  A?: FC;
  /** Footage at the spawn point (white burst, pulls back from a push-in). Default: PlateB placeholder. */
  B?: FC;
  /** Big title on the death board. */
  title?: string;
  /** Label before the score. */
  scoreLabel?: string;
  /** Final score the counter runs up to. */
  score?: number;
  /** Respawn button label (the one the cursor clicks). */
  respawn?: string;
  /** Second button label. */
  toTitle?: string;
  /** Chip top left (cause of death). */
  cause?: string;
  /** Chip top right (stats). */
  stats?: string;
  /** Toast shown after respawning. */
  toast?: string;
};

export const Respawn: FC<RespawnProps> = ({A = PlateA, B = PlateB, title = '你死了！', scoreLabel = '得分：', score: finalScore = 1337, respawn = '重生', toTitle = '回到标题画面', cause = '死因 · 掉进岩浆湖', stats = '第 4 天 · 存活 3 小时 12 分', toast: toastText = '已重生 · 出生点'}) => {
  const f = useCurrentFrame();
  const hit = 14;
  const fall = EASE.in(clamp01((f - hit) / 26));
  const shake = f >= hit && f < hit + 12 ? 24 * (1 - (f - hit) / 12) : 0;
  const rs = mulberry32(5100 + f);
  const sx = (rs() * 2 - 1) * shake;
  const sy = (rs() * 2 - 1) * shake;
  const dead = f >= 44 && f < RESPAWN_CLICK + 14;
  const board = EASE.out(clamp01((f - 44) / 12)) * (1 - smooth(RESPAWN_CLICK + 2, RESPAWN_CLICK + 12, f));
  const white = f < RESPAWN_CLICK + 4 ? smooth(RESPAWN_CLICK, RESPAWN_CLICK + 8, f) : 1 - smooth(RESPAWN_CLICK + 12, RESPAWN_CLICK + 34, f);
  const after = f >= RESPAWN_CLICK + 8;
  const hover = f >= RESPAWN_CLICK - 16;
  const pressed = f >= RESPAWN_CLICK && f < RESPAWN_CLICK + 5;
  const score = Math.round(finalScore * EASE.out(clamp01((f - 60) / 28)));
  const cx = lerp(1500, 1210, EASE.inOut(clamp01((f - 96) / 28)));
  const cy = lerp(900, 612, EASE.inOut(clamp01((f - 96) / 28)));
  const curA = smooth(94, 102, f) * (1 - smooth(RESPAWN_CLICK + 6, RESPAWN_CLICK + 12, f));
  const t2 = f - (RESPAWN_CLICK + 6);
  const toast = prog(f, RESPAWN_CLICK + 22, 12, EASE.out) * (1 - prog(f, T15 - 18, 14, EASE.in));
  const gray = dead ? 1 : 0;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {!after && (
          <AbsoluteFill style={{transform: `translateY(${fall * 140}px) rotate(${-fall * 14}deg) scale(${1 + fall * 0.18})`, filter: `grayscale(${Math.min(1, gray * 0.9 + fall * 0.2)}) brightness(${1 - 0.45 * fall}) sepia(${fall * 0.3})`}}>
            <A />
          </AbsoluteFill>
        )}
        {after && (
          <AbsoluteFill style={{transform: `scale(${lerp(1.25, 1, EASE.out(clamp01((f - RESPAWN_CLICK - 8) / 40)))})`}}>
            <B />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {/* red tint + vignette from the hit */}
      <AbsoluteFill style={{background: `rgba(120,0,0,${(0.2 * (f >= hit ? 1 : 0) + 0.42 * Math.min(1, fall * 1.2)) * (after ? 0 : 1)})`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(90,0,0,${0.9 * (after ? 0 : Math.min(1, fall * 1.4))}) 100%)`}} />
      <Flash at={hit} life={7} color="#ff2a2a" peak={0.7} />
      {/* death board */}
      {dead && (
        <AbsoluteFill style={{opacity: board}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(60,0,0,0.5)'}} />
          {[
            {x: 150, y: 600, px: 20, k: 0},
            {x: 1500, y: 560, px: 22, k: 1},
            {x: 90, y: 820, px: 12, k: 2},
            {x: 1730, y: 800, px: 12, k: 3},
          ].map((t, i) => {
            const rise = prog(f, 50 + i * 4, 14, EASE.back);
            return (
              <div key={i} style={{position: 'absolute', left: t.x, top: t.y + (1 - rise) * 200, opacity: rise, filter: 'drop-shadow(0 12px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 24px rgba(255,60,60,0.35))'}}>
                <PixelSprite sprite={GRAVE} px={t.px} />
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 0, right: 0, top: 156, display: 'flex', justifyContent: 'center', transform: `scale(${lerp(1.3, 1, board)})`}}>
            <BandTitle size={264} tone={{light: '#ffd0d0', mid: '#ff4d5e', dark: '#a01830', extrude: '#4a0a14', extrude2: '#200408', glow: '#ff3030'}}>
              {title}
            </BandTitle>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 512, display: 'flex', justifyContent: 'center', gap: 16, opacity: prog(f, 54, 10)}}>
            <OreText size={TYPE.body} color="#fff" shadow>
              {scoreLabel}
            </OreText>
            <div style={{position: 'relative'}}>
              {/* the final value reserves the width, so the row stays centred while the number counts up */}
              <OreText size={TYPE.body} color="#ffff55" shadow style={{visibility: 'hidden'}}>
                {String(finalScore)}
              </OreText>
              <div style={{position: 'absolute', left: 0, top: 0}}>
                <OreText size={TYPE.body} color="#ffff55" shadow>
                  {String(score)}
                </OreText>
              </div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 612, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}}>
            <div style={{opacity: prog(f, 66, 10), transform: `translateY(${(1 - prog(f, 66, 12, EASE.back)) * 40}px) scale(${pressed ? 0.95 : 1})`}}>
              <OreButton variant="hero" state={pressed ? 'pressed' : hover ? 'hover' : 'normal'} width={560}>
                {respawn}
              </OreButton>
            </div>
            <div style={{opacity: prog(f, 72, 10), transform: `translateY(${(1 - prog(f, 72, 12, EASE.back)) * 40}px)`}}>
              <OreButton variant="neutral" width={560}>
                {toTitle}
              </OreButton>
            </div>
          </div>
          <div style={{position: 'absolute', left: 80, top: 70, opacity: prog(f, 56, 10)}}>
            <OreChip color={ORE.text} dot="#ff4d5e">
              {cause}
            </OreChip>
          </div>
          <div style={{position: 'absolute', right: 80, top: 70, opacity: prog(f, 60, 10)}}>
            <OreChip color={ORE.text} dot={gold}>
              {stats}
            </OreChip>
          </div>
        </AbsoluteFill>
      )}
      <ClickSpark at={RESPAWN_CLICK} x={cx} y={cy} />
      <div style={{opacity: curA}}>
        <PixelCursor x={cx} y={cy} />
      </div>
      {/* respawn light */}
      <AbsoluteFill style={{background: '#fff4d8', opacity: Math.max(0, white)}} />
      {t2 >= 0 && t2 < 36 && <Shockwave x={960} y={640} at={RESPAWN_CLICK + 6} color="#fff1c0" maxR={1100} life={28} width={30} />}
      {t2 >= 0 && t2 < 46 && <PixelBurst x={960} y={640} at={RESPAWN_CLICK + 6} count={70} colors={['#ffffff', gold, '#8fd3ff', '#a8f0c6']} speed={34} life={44} size={14} gravity={-0.15} seed={31} />}
      {t2 >= 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', opacity: toast, transform: `translateY(${(1 - toast) * -60}px)`}}>
          <OreChip color={ORE.text} dot="#5ed16a">
            {toastText}
          </OreChip>
        </div>
      )}
      <Vignette s={0.2} color="30,0,0" />
      <Sfx at={hit} src={mcSound('random/explode3')} volume={0.35} rate={1.2} />
      <Sfx at={hit + 2} src={mcSound('random/anvil_land')} volume={0.3} rate={0.7} />
      <Sfx at={44} src={mcSound('ui/toast/in')} volume={0.35} rate={0.6} />
      <Sfx at={60} src={mcSound('random/orb')} volume={0.3} rate={0.7} />
      <Sfx at={RESPAWN_CLICK - 14} src={mcSound('random/click')} volume={0.2} rate={1.1} />
      <Sfx at={RESPAWN_CLICK} src={mcSound('random/click')} volume={0.5} rate={0.9} />
      <Sfx at={RESPAWN_CLICK + 8} src={mcSound('random/levelup')} volume={0.4} />
    </AbsoluteFill>
  );
};

export const respawnEntries: FxEntry[] = [
  {
    meta: {
      id: 'jump-respawn',
      name: '死亡 → 重生（加送）',
      category: 'transition',
      tags: ['死亡', '重生', '复活', '界面'],
      frames: T15,
      blurb: '受击红闪、镜头倾倒变灰泛红，弹出“你死了！”界面（得分滚动、重生/标题按钮）；光标点“重生”后整屏白光爆开，出生点画面由推近拉回，并弹出“已重生”提示。',
      usage: '失败/死亡后的重来，或把“死了又活了”作为剧情跳转。',
      params: [
        {name: 'RESPAWN_CLICK', desc: '点击重生的帧（源码常量）'},
        {name: '文字', desc: '死因、得分、按钮文字在组件内直接改'},
      ],
    },
    Demo: () => <Respawn />,
  },
];
