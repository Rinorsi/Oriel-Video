// mcd2 boss pair: mcd-s-boss-intro (purple energy -> pixel-cross impact -> boss + thin red health bar + new objective)
// and mcd-s-boss-defeat (boss bursts, magenta beam rises, golden spark trail, hero walks in, ~0.7 s white-out).
// Boss = the real iron golem texture tinted redstone-red (the Redstone Monstrosity stand-in). No expanding rings: the impact is a pixel cross + fragments.
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {tex} from '../../../mc/assets';
import {Shockwave} from '../../../mc/Fx';
import {Crop} from '../../mob';
import type {FxEntry} from '../../types';
import {Embers, McdText, PlayerFigure, PxArt, PxText, SKULL_ROWS, WhiteFlash} from '../mcdkit/kit';
import {At, Backdrop, Beam, EASE, GroundShadow, IsoGlow, Particles, PxPlus, Row, Sfx, Sq, Twinkle, genParts, lerp, mcSound, reelSfx, snap, stepped, win} from './common';

// ------------------------------------------------------------------------------------------------ boss figure

/** Front view of the iron golem from its real texture (128x128). `scale` = px per texel. 26 x 43 texels. `eye` 0..1 red eye glow. */
export const GolemFigure: FC<{scale?: number; tint?: boolean; eye?: number; white?: number}> = ({scale = 12, tint = true, eye = 1, white = 0}) => {
  const src = tex('entity/iron_golem/iron_golem.png');
  const c = (rect: [number, number, number, number], x: number, y: number) => <Crop src={src} sheet={[128, 128]} rect={rect} scale={scale} style={{position: 'absolute', left: (x + 13) * scale, top: y * scale}} />;
  const filter = [
    tint ? 'url(#golemRed)' : '',
    tint ? 'drop-shadow(3px 0 0 #E0352C) drop-shadow(-3px 0 0 #E0352C) drop-shadow(0 3px 0 #E0352C) drop-shadow(0 -3px 0 #E0352C)' : '',
    white > 0 ? `brightness(${1 + white * 9}) saturate(${1 - white})` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div style={{position: 'relative', width: 26 * scale, height: 43 * scale, flex: 'none', filter: filter || undefined}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="golemRed" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.2300 0.7700 0.0780 0 -0.14  0.0213 0.0715 0.0072 0 0.01  0.0255 0.0858 0.0087 0 0.015  0 0 0 1 0" />
        </filter>
      </svg>
      {c([42, 5, 6, 16], -6, 27)}
      {c([65, 5, 6, 16], 0, 27)}
      {c([66, 27, 4, 30], -13, 10)}
      {c([66, 64, 4, 30], 9, 10)}
      {c([11, 51, 18, 12], -9, 10)}
      {c([6, 76, 9, 5], -4.5, 22)}
      {c([8, 8, 8, 10], -4, 0)}
      {c([26, 2, 2, 4], -1, 4)}
      {[-2.5, 1.5].map((x) => (
        <div key={x} style={{position: 'absolute', left: (x + 13) * scale, top: 3 * scale, width: scale * 1.2, height: scale * 1.1, background: '#FF3A2A', opacity: eye, boxShadow: `0 0 ${scale * 1.6}px #FF2A1A`}} />
      ))}
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ boss health bar

const BossBar: FC<{fill: number; tail: number; name: string; appear: number; w?: number}> = ({fill, tail, name, appear, w = 660}) => {
  const x0 = 960 - w / 2;
  const y = 74;
  const H = 16;
  return (
    <div style={{opacity: stepped(appear, 4), transform: `translateY(${(1 - appear) * -14}px)`}}>
      <div style={{position: 'absolute', left: x0, top: y - 50, width: w, display: 'flex', alignItems: 'center', gap: 14}}>
        <PxArt rows={SKULL_ROWS} pal={{k: '#FFFFFF'}} px={3} />
        <McdText size={30} weight={700} color="#FFFFFF">{name}</McdText>
      </div>
      <div style={{position: 'absolute', left: x0 - 4, top: y - 4, width: w + 8, height: H + 8, background: '#000'}} />
      <div style={{position: 'absolute', left: x0, top: y, width: w, height: H, background: '#2A0C14'}} />
      {/* white trailing block (damage taken) */}
      <div style={{position: 'absolute', left: x0, top: y, width: w * tail, height: H, background: '#FFFFFF'}} />
      <div style={{position: 'absolute', left: x0, top: y, width: w * fill, height: H, background: '#E33951'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 5, background: '#FF7A8A'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: '#A71E36'}} />
      </div>
      {[0.25, 0.5, 0.75].map((k) => (
        <div key={k} style={{position: 'absolute', left: x0 + w * k - 6, top: y + H / 2 - 6, width: 12, height: 12, background: '#FFFFFF', transform: 'rotate(45deg) scale(0.7)', boxShadow: '0 0 0 2px #000'}} />
      ))}
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ boss intro

const INTRO = 180;

export const BossIntro: FC<{bg?: boolean; audio?: boolean; name?: string; objective?: string; heading?: string}> = ({bg, audio = bg, name = '红石傀儡', objective = '击败红石傀儡', heading = '新目标'}) => {
  const f = useCurrentFrame();
  const CX = 960;
  const FEET = 900;
  const S = 13;
  const IMPACT = 32;
  // 1. energy gathers
  const gather = genParts({n: 1, seed: 1, x: 0, y: 0});
  void gather;
  const gSeeds = Array.from({length: 64}, (_, i) => {
    const a = (i / 64) * Math.PI * 2 + (i % 5) * 0.31;
    const r0 = 560 + (i % 7) * 70;
    const s = (i * 7) % 14;
    return {a, r0, s, sz: 8 + (i % 3) * 4};
  });
  const coreT = win(f, 4, IMPACT - 4);
  // 2. impact
  const dt = f - IMPACT;
  const shake = dt >= 0 && dt < 14 ? Math.round(Math.sin(dt * 2.7) * 16 * (1 - dt / 14)) : 0;
  const bossIn = EASE.out(win(f, IMPACT, 10));
  const white = f < IMPACT ? 1 : Math.max(0, 1 - win(f, IMPACT + 1, 5));
  const bossVis = f >= IMPACT;
  const gold = genParts({n: 70, seed: 11, x: CX, y: 620, sx: 20, sy: 20, a0: -Math.PI, a1: Math.PI, v0: 10, v1: 42, drag: 0.07, life0: 30, life1: 58, size0: 8, size1: 20, colors: ['#F7AE56', '#FFCA55', '#FFF2B0', '#EF714D'], kinds: ['plus', 'sq', 'plus']});
  const violet = genParts({n: 50, seed: 12, x: CX, y: 620, sx: 40, sy: 40, a0: -Math.PI, a1: Math.PI, v0: 4, v1: 22, g: 0.15, drag: 0.08, life0: 30, life1: 60, size0: 8, size1: 16, colors: ['#AB64FF', '#E2A7DF', '#7A2BC8', '#FFFFFF'], kinds: ['sq', 'sq', 'plus']});
  // 3. bar / objective
  const barAppear = win(f, 46, 6);
  const barFill = f < 46 ? 0 : Math.min(1, Math.round(win(f, 46, 14) * 14) / 14);
  const hit = 120;
  const hitT = win(f, hit, 3);
  const fillV = f < hit ? barFill : 1 - 0.14 * hitT;
  const tailV = f < hit ? Math.max(barFill, 0) + (f < 60 ? 0.0 : 0) : f < hit + 10 ? 1 : lerp(1, 0.86, EASE.out(win(f, hit + 10, 8)));
  const tailShown = f < 46 ? 0 : f < 60 ? Math.min(1, barFill + 0.04) : tailV;
  const objA = stepped(Math.min(win(f, 64, 8), 1 - win(f, 136, 10)), 4);
  const exit = 1 - win(f, INTRO - 16, 14);
  const hitShake = f >= hit && f < hit + 8 ? Math.round(Math.sin((f - hit) * 3) * 8 * (1 - (f - hit) / 8)) : 0;
  const hitFlash = f >= hit && f < hit + 3 ? 0.7 : 0;
  const bossBob = bossVis ? Math.round(Math.sin((f - IMPACT) * 0.11) * 4) : 0;

  return (
    <AbsoluteFill>
      {bg && (
        <Backdrop biome="nether" seed={9} loop={INTRO} dim={0.6} dark={0.52} sat={0.8} camera="static">
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 55% at 50% 60%, rgba(150,50,220,0.45), rgba(0,0,0,0) 70%)', opacity: Math.min(1, coreT * 1.2) * (1 - win(f, IMPACT + 6, 30) * 0.6)}} />
          <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(10,2,14,0.72) 0%, rgba(10,2,14,0.3) 30%, rgba(0,0,0,0) 55%)'}} />
        </Backdrop>
      )}
      <AbsoluteFill style={{transform: `translate(${shake + hitShake}px, ${Math.round(shake * -0.4)}px)`}}>
        {/* purple energy converging on the boss spot */}
        {f < IMPACT + 2 &&
          gSeeds.map((g, i) => {
            const t = EASE.in(win(f, g.s, IMPACT - g.s));
            if (f < g.s) return null;
            const r = g.r0 * (1 - t);
            const x = CX + Math.cos(g.a + t * 1.2) * r;
            const y = 640 + Math.sin(g.a + t * 1.2) * r * 0.62;
            return (
              <div key={i}>
                {[0, 1, 2].map((k) => {
                  const tt = Math.max(0, t - k * 0.05);
                  const rr = g.r0 * (1 - tt);
                  return <Sq key={k} x={snap(CX + Math.cos(g.a + tt * 1.2) * rr, 4)} y={snap(640 + Math.sin(g.a + tt * 1.2) * rr * 0.62, 4)} s={Math.max(4, g.sz - k * 3)} c={k ? '#7A2BC8' : '#E2A7DF'} o={0.85 - k * 0.25} />;
                })}
                <Sq x={snap(x, 4)} y={snap(y, 4)} s={g.sz} c={i % 3 ? '#AB64FF' : '#FFFFFF'} />
              </div>
            );
          })}
        {/* growing core */}
        {f < IMPACT + 1 && <PxPlus x={CX} y={640} u={Math.round(6 + coreT * 10)} arm={Math.round(1 + coreT * 6)} c="#AB64FF" core="#FFFFFF" o={0.5 + coreT * 0.5} />}
        {/* boss */}
        {bossVis && (
          <>
            <GroundShadow cx={CX} y={FEET - 6} w={360} o={0.5 * bossIn} u={10} />
            <div style={{position: 'absolute', left: CX - (26 * S) / 2, top: FEET - 43 * S + bossBob + (1 - bossIn) * 40, opacity: exit, transform: `scale(${1 + (1 - bossIn) * 0.12})`, transformOrigin: '50% 100%'}}>
              <GolemFigure scale={S} white={Math.max(white, hitFlash)} eye={0.7 + 0.3 * Math.sin(f * 0.3)} />
            </div>
          </>
        )}
        {/* impact: pixel cross + gold plus-fragments (no rings) */}
        {dt >= 0 && dt < 10 && <PxPlus x={CX} y={640} u={14} arm={Math.round(34 * (1 - dt / 10) + 2)} c="#FFCA55" core="#fff" o={1} />}
        {dt >= 0 && dt < 8 && <PxPlus x={CX} y={640} u={22} arm={Math.round(10 * (1 - dt / 8) + 1)} c="#FFFFFF" core="#fff" o={0.9} />}
        <Shockwave x={CX} y={640} at={IMPACT} color="#F7AE56" maxR={820} life={30} width={24} rays={20} seed={3} />
        <Particles parts={gold} at={IMPACT} />
        <Particles parts={violet} at={IMPACT} />
        <Embers count={22} color="#F7AE56" area={[100, 300, 1720, 700]} size={8} seed={5} speed={0.8} style={{opacity: win(f, IMPACT, 20) * exit * 0.8}} />
      </AbsoluteFill>
      {/* bar + objective */}
      <AbsoluteFill style={{opacity: exit}}>
        <BossBar fill={fillV} tail={tailShown} name={name} appear={barAppear} />
        <Row y={176} style={{opacity: objA, flexDirection: 'column', transform: `translateY(${(1 - EASE.out(win(f, 64, 10))) * 10}px)`}}>
          <McdText size={32} weight={700} color="#F4B55A" style={{letterSpacing: 3}}>{heading}</McdText>
          <div style={{marginTop: 8}}>
            <PxText text={objective} px={4} />
          </div>
        </Row>
      </AbsoluteFill>
      <WhiteFlash at={IMPACT} dur={7} peak={0.9} steps={4} />
      <WhiteFlash at={hit} dur={4} peak={0.18} steps={2} />
      {audio && (
        <>
          <Sfx at={IMPACT} src={mcSound('random/explode2')} volume={0.4} rate={0.9} />
          <Sfx at={IMPACT} src={reelSfx('impact-cine.mp3')} volume={0.4} />
          <Sfx at={46} src={mcSound('ui/toast/in')} volume={0.35} />
          <Sfx at={hit} src={mcSound('random/anvil_land')} volume={0.2} rate={1.3} />
        </>
      )}
      <At cx={0} cy={0}>{null}</At>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ boss defeat

const DEFEAT = 160;

export const BossDefeat: FC<{bg?: boolean; audio?: boolean; objective?: string; heading?: string}> = ({bg, audio = bg, objective = '跟随小路', heading = '新目标'}) => {
  const f = useCurrentFrame();
  const BX = 1230;
  const BY = 820; // beam ground point
  const P0 = {x: 330, y: 900};
  const ctrl = {x: 700, y: 640};
  const curve = (u: number) => ({
    x: (1 - u) * (1 - u) * P0.x + 2 * (1 - u) * u * ctrl.x + u * u * BX,
    y: (1 - u) * (1 - u) * P0.y + 2 * (1 - u) * u * ctrl.y + u * u * (BY + 10),
  });
  // boss death
  const death = 8;
  const bossAlive = f < death;
  const flick = f < death && f % 2 === 0 ? 0.9 : 0;
  const burst = genParts({n: 60, seed: 31, x: BX, y: BY - 200, sx: 90, sy: 150, a0: -Math.PI, a1: Math.PI, v0: 2, v1: 16, g: 0.7, drag: 0.07, life0: 24, life1: 46, size0: 10, size1: 22, colors: ['#E33951', '#FFFFFF', '#EF714D', '#FFCA55'], kinds: ['sq', 'sq', 'plus']});
  // beam
  const beamAt = 14;
  const grow = f < beamAt ? 0 : Math.min(1, (f - beamAt + 1) / 4);
  const walkT = win(f, 56, 56);
  const enter = f >= 112;
  const wScale = 1 + 0.9 * EASE.in(win(f, 104, 14));
  // white-out: 0 -> 70% (12f) -> 100% (4f) hold 5f -> fade 20f
  let whiteA = 0;
  if (f >= 108) whiteA = f < 120 ? 0.7 * win(f, 108, 12) : f < 124 ? 0.7 + 0.3 * win(f, 120, 4) : f < 130 ? 1 : 1 - win(f, 130, 24);
  const afterWhite = f >= 128;
  const sparkN = 64;
  const spark = Array.from({length: sparkN}, (_, i) => {
    const u = i / (sparkN - 1);
    const p = curve(u);
    const born = 22 + u * 36;
    const lateral = Math.sin(i * 12.9898) * 34;
    return {u, born, x: p.x + lateral * 0.5, y: p.y + lateral * 0.6, i};
  });
  const player = curve(EASE.inOut(walkT));
  const bob = f >= 56 && f < 112 ? Math.abs(Math.sin(f * 0.55)) * 10 : 0;
  const objA = stepped(Math.min(win(f, 20, 8), 1 - win(f, 80, 10)), 4);
  const doneSparks = f >= 126;

  return (
    <AbsoluteFill>
      {bg && (
        <Backdrop biome="nether" loop={DEFEAT} dim={0.5} dark={0.42} sat={0.85} frameOffset={60}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 45% 60% at 70% 75%, rgba(205,46,205,0.34), rgba(0,0,0,0) 70%)', opacity: grow}} />
          <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(10,2,14,0.72) 0%, rgba(10,2,14,0.35) 28%, rgba(0,0,0,0) 52%)'}} />
        </Backdrop>
      )}
      {!afterWhite && (
        <>
          <IsoGlow cx={BX} cy={BY + 6} w={560} color="#CD2ECD" o={grow * 0.9} />
          {/* runic diamond plate (dashed, not a ring) */}
          {grow > 0 &&
            Array.from({length: 28}, (_, i) => {
              const side = Math.floor(i / 7);
              const k = (i % 7) / 7;
              const R = 170;
              const pts = [
                [0, -0.5],
                [1, 0],
                [0, 0.5],
                [-1, 0],
                [0, -0.5],
              ];
              const a = pts[side];
              const b = pts[side + 1];
              const x = BX + (a[0] + (b[0] - a[0]) * k) * R;
              const y = BY + 6 + (a[1] + (b[1] - a[1]) * k) * R * 0.78;
              return <Sq key={i} x={snap(x, 4)} y={snap(y, 4)} s={10} c={i % 2 ? '#F7C8F7' : '#CD2ECD'} o={0.9 * grow * (0.6 + 0.4 * Math.sin(f * 0.3 + i))} />;
            })}
          <Beam x={BX} y={BY} kind="magenta" width={Math.round(220 * wScale)} grow={grow} alpha={f >= 116 ? 1 : 0.95} flick={0.94 + 0.06 * Math.sin(f * 2.1)} />
          <Particles parts={burst} at={death} />
          {bossAlive && (
            <>
              <GroundShadow cx={BX} y={BY - 6} w={340} o={0.5} u={10} />
              <div style={{position: 'absolute', left: BX - 169, top: BY - 43 * 13 + 0, transform: `translateX(${f % 2 ? 6 : -6}px)`}}>
                <GolemFigure scale={13} white={flick} eye={1} />
              </div>
            </>
          )}
          {/* golden spark trail */}
          {spark.map((s) => {
            if (f < s.born) return null;
            const age = f - s.born;
            const passed = walkT > s.u ? 0.45 : 1;
            const tw = 0.55 + 0.45 * Math.abs(Math.sin(f * 0.25 + s.i * 1.7));
            const dx = Math.sin(f * 0.08 + s.i) * 5;
            const dy = -((age * 0.5 + s.i * 3) % 26);
            const grown = Math.min(1, age / 4);
            const sz = s.i % 3 === 0 ? 16 : 10;
            const o = tw * passed * grown * (doneSparks ? 1 - win(f, 126, 4) : 1);
            return <Sq key={s.i} x={snap(s.x + dx, 4)} y={snap(s.y + dy * 0.5, 4)} s={sz} c={s.i % 4 === 0 ? '#FFF2B0' : '#F7AE56'} o={o} style={{boxShadow: sz === 16 ? '0 0 10px #F7AE56' : undefined}} />;
          })}
          {/* hero walking the trail into the beam */}
          {f >= 40 && (
            <>
              <GroundShadow cx={player.x} y={player.y - 4} w={90 * (1 - win(f, 108, 8) * 0.8)} o={0.45} u={6} />
              <div style={{position: 'absolute', left: player.x - 64, top: player.y - 256 - bob, opacity: 1 - win(f, 110, 8), filter: f >= 108 ? `brightness(${1 + win(f, 108, 8) * 6})` : undefined, transform: `scale(${1 - win(f, 108, 10) * 0.25})`, transformOrigin: '50% 100%'}}>
                <PlayerFigure skin="steve" scale={8} />
              </div>
            </>
          )}
          {f >= 92 && <div style={{position: 'absolute', left: BX - 380, top: 60, width: 760, height: 520, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(247,190,247,0.55) 40%, rgba(205,46,205,0) 100%)', opacity: EASE.out(win(f, 92, 24)), mixBlendMode: 'screen'}} />}
        </>
      )}
      <Row y={176} style={{opacity: objA, flexDirection: 'column', transform: `translateY(${(1 - EASE.out(win(f, 20, 10))) * 10}px)`}}>
        <McdText size={32} weight={700} color="#F4B55A" style={{letterSpacing: 3}}>{heading}</McdText>
        <div style={{marginTop: 8}}>
          <PxText text={objective} px={4} />
        </div>
      </Row>
      <AbsoluteFill style={{background: '#fff', opacity: whiteA, pointerEvents: 'none'}} />
      {audio && (
        <>
          <Sfx at={death} src={mcSound('random/explode1')} volume={0.4} />
          <Sfx at={beamAt} src={mcSound('random/levelup')} volume={0.4} rate={0.8} />
          {Array.from({length: 8}, (_, i) => <Sfx key={i} at={58 + i * 7} src={mcSound('dig/stone2')} volume={0.12} rate={1.2} />)}
        </>
      )}
      <div style={{display: 'none'}}>
        <Twinkle x={0} y={0} t={0} />
      </div>
    </AbsoluteFill>
  );
};

export const entries: FxEntry[] = [
  {
    meta: {
      id: 'mcd-s-boss-intro',
      name: 'Boss 登场 · 血条拉满',
      category: 'rpg',
      tags: ['地下城', 'Boss', '登场', '血条', '目标'],
      frames: INTRO,
      blurb: '紫色能量向中心聚拢，金色像素十字闪光 + 十字碎片炸开（无圆环），真实傀儡贴图的 Boss 现身；顶部居中细红条从左拉满、白尾缓冲，中上出现金色“新目标”与白字目标，随后一次受击白尾追赶。',
      usage: '介绍“最终 Boss/大魔王/核心难点”的登场；血条可当作进度条、下载条的出场动画；目标文字换成视频里的任务点。',
      params: [
        {name: 'name', desc: '血条上方的 Boss 名字'},
        {name: 'objective', desc: '“新目标”下面的目标文字'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <BossIntro bg />,
    Layer: () => <BossIntro />,
  },
  {
    meta: {
      id: 'mcd-s-boss-defeat',
      name: 'Boss 被击败 · 光柱白闪',
      category: 'rpg',
      tags: ['地下城', 'Boss', '击败', '光柱', '白闪', '转场'],
      frames: DEFEAT,
      blurb: 'Boss 闪白爆散，品红光柱在原地升起并带虚线菱形符文；金色火星沿弧线铺出“跟随小路”，主角沿小路走进光柱，约 0.7s 画面泛白至全白后淡出。',
      usage: '章节结束、通关、解锁下一部分的转场：白闪那一刻可以直接切到下一镜头。',
      params: [
        {name: 'objective', desc: '“新目标”文字，默认“跟随小路”'},
        {name: 'bg', desc: '是否绘制 3D 场景背景'},
      ],
    },
    Demo: () => <BossDefeat bg />,
    Layer: () => <BossDefeat />,
  },
];
