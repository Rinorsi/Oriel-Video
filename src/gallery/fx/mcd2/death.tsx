// mcd-s-death: low-health pulse -> hit -> death screen. Target: death-screen.png + low-health-red-vignette.png.
// Crimson radial vignette (#A8424C) closes in from the edges, scene desaturates to blue-grey, a dark diamond frame with a white pixel skull slams in,
// "YOU DIED" in white block type with a hard shadow, "lives left x2" top right ticks down. Fades back at the end (respawn).
// Props: bg, text, lives, cause.
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {FxEntry} from '../../types';
import {McdText, PlayerBust, PxArt, PxText, WhiteFlash} from '../mcdkit/kit';
import {At, Backdrop, DarkDiamond, EASE, Row, Sfx, mcSound, reelSfx, stepped, win} from './common';

const TOTAL = 150;

const SKULL = [
  '..wwwwwwwww..',
  '.wwwwwwwwwww.',
  'wwwwwwwwwwwww',
  'wwwwwwwwwwwww',
  'wweeewwweeeww',
  'wweeewwweeeww',
  'wweeewwweeeww',
  'wwwwweeewwwww',
  '.wwwwwwwwwww.',
  '..wwwwwwwww..',
  '..wewewewew..',
  '..wewewewew..',
];

export const Death: FC<{bg?: boolean; text?: string; lives?: number; cause?: string; livesLabel?: string; audio?: boolean}> = ({bg, text = '你死了', lives = 3, cause = '被红石傀儡击败', livesLabel = '剩余生命', audio = bg}) => {
  const f = useCurrentFrame();
  const HIT = 18;
  // vignette intensity
  const pulse = f < HIT ? 0.3 + 0.3 * Math.abs(Math.sin((f / 15) * Math.PI)) : 0;
  const full = EASE.out(win(f, HIT, 10));
  const back = 1 - win(f, TOTAL - 26, 22);
  const vig = f < HIT ? pulse * win(f, 0, 6) : Math.max(0.0, (0.6 + 0.4 * full) * back + (1 - back) * 0);
  const sat = f < HIT ? 1 - pulse * 0.3 : 1 - 0.78 * full * back;
  const uiA = (a: number, d = 6) => stepped(Math.min(win(f, a, d), back), 4);
  const frameT = win(f, HIT + 8, 7);
  const frameScale = 1 + 0.5 * (1 - EASE.back(frameT));
  const textT = win(f, HIT + 15, 6);
  const tick = f >= 46 ? lives - 1 : lives;
  const tickFlash = f >= 46 && f < 56 ? 1 - (f - 46) / 10 : 0;
  const shake = f >= HIT && f < HIT + 9 ? Math.round(Math.sin((f - HIT) * 3.3) * 14 * (1 - (f - HIT) / 9)) : 0;

  return (
    <AbsoluteFill>
      {bg && <Backdrop biome="forest-night" loop={TOTAL} dim={0.2} dark={0.15 + 0.2 * full * back} sat={sat} bright={1 - 0.25 * full * back} camera="static" />}
      <AbsoluteFill style={{transform: `translate(${shake}px, ${-shake * 0.5}px)`}}>
        {/* crimson vignette from the edges */}
        <AbsoluteFill
          style={{
            opacity: Math.min(1, vig),
            background: 'radial-gradient(ellipse 72% 78% at 50% 50%, rgba(168,66,76,0) 34%, rgba(168,66,76,0.55) 66%, rgba(176,48,64,0.96) 100%)',
          }}
        />
        {f >= HIT && <AbsoluteFill style={{opacity: full * back * 0.4, background: 'radial-gradient(ellipse 60% 60% at 50% 45%, rgba(20,12,24,0.0) 0%, rgba(10,6,16,0.55) 100%)'}} />}
        {/* skull in a dark diamond */}
        <At cx={960} cy={350}>
          <div style={{opacity: uiA(HIT + 8, 4), transform: `scale(${frameScale})`}}>
            <DarkDiamond size={380} edge="#8A3A38" edgeHi="#E8A878" fill="#3A383B" glow="rgba(168,66,76,0.55)">
              <PxArt rows={SKULL} pal={{w: '#F4F4F6', e: '#2E2D30'}} px={14} style={{transform: 'translateY(4px)'}} />
            </DarkDiamond>
          </div>
        </At>
        <Row y={582} style={{opacity: uiA(HIT + 15, 4), transform: `scale(${1 + 0.35 * (1 - EASE.out(textT))})`}}>
          <PxText text={text} px={9} />
        </Row>
        <Row y={742} style={{opacity: uiA(HIT + 32, 8)}}>
          <McdText size={34} weight={600} color="#E4D4D6">{cause}</McdText>
        </Row>
      </AbsoluteFill>
      {/* lives left, top right */}
      <div style={{position: 'absolute', right: 84, top: 56, opacity: uiA(HIT + 20, 8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10}}>
        <McdText size={30} weight={600} color="#D8CCD0">{livesLabel}</McdText>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 72, height: 72, background: '#14101A', boxShadow: `0 0 0 4px ${tickFlash ? '#FF6A7A' : '#8A8A92'}`, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', transform: `translateX(${tickFlash ? Math.round(Math.sin(f * 3) * 6) : 0}px)`}}>
            <PlayerBust skin="efe" scale={5} />
          </div>
          <div style={{filter: tickFlash ? `brightness(${1 + tickFlash * 1.5})` : undefined, transform: `translateY(${-tickFlash * 8}px)`}}>
            <PxText text={`×${tick}`} px={7} color={tickFlash ? '#FFB0B8' : '#FFFFFF'} />
          </div>
        </div>
      </div>
      <WhiteFlash at={HIT} dur={5} peak={0.55} steps={3} />
      <At cx={0} cy={0}>{null}</At>
      {audio && (
        <>
          <Sfx at={HIT} src={reelSfx('impact-cine.mp3')} volume={0.45} />
          <Sfx at={HIT + 8} src={mcSound('random/anvil_land')} volume={0.3} rate={0.7} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-death',
      name: '死亡画面 · 猩红晕影',
      category: 'rpg',
      tags: ['地下城', '死亡', '失败', '红晕', '骷髅'],
      frames: TOTAL,
      blurb: '先是边缘红晕随心跳脉动，一击后猩红径向晕影合拢、场景褪成蓝灰，暗色菱形框的白色像素骷髅砸下，白字“你死了”，右上“剩余生命 ×3→×2”跳减，结尾复活淡回。',
      usage: '搞笑翻车/失败/Bug 的反转镜头，或“这个 Mod 崩了”“做死了”的梗；cause 一行可改成吐槽文案。',
      params: [
        {name: 'text', desc: '主文字，默认“你死了”'},
        {name: 'cause', desc: '下方小字（死因/吐槽）'},
        {name: 'lives', desc: '起始剩余生命，会在 1.5 秒时减 1'},
        {name: 'bg', desc: '是否绘制 3D 场景背景（Demo 开，Layer 关）'},
      ],
    },
    Demo: () => <Death bg />,
    Layer: () => <Death />,
  },
];
