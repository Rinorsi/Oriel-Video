import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {Bold, Beam, Burst, C, CornerCrests, DungeonBg, EASE, Embers, Fancy, Flash, Frame, GOLD_GRAD, Glint, Item, Label, MobFigure, Shake, W, clamp01, jiggle, lerp, mix, mulberry32, prog, snap} from './common';

/**
 * rpg-level-up: XP orbs fly into the experience bar, it fills and bursts; the level digit flips 17 -> 18,
 * a gold light pillar lifts off the hero, the four corner crests light up one after another, and three attribute points land.
 * Props: `bg` - dungeon background + hero (Demo). Layer: panel, orbs, pillar, crests and sparks on transparent.
 * Edit FROM/TO (levels) and ATTRS (attribute cards).
 */

export const LEVEL_FRAMES = 170;
const FROM = 17;
const TO = 18;
const HERO: [number, number] = [540, 930];
const PANEL_X = 980;
const PANEL_Y = 110;
const PANEL_W = 760;
const BAR: [number, number, number] = [PANEL_X + 80, PANEL_Y + 438, 600]; // x, y, width
const ATTRS = [
  {id: 'iron_sword', name: '力量', at: 112},
  {id: 'iron_chestplate', name: '防御', at: 122},
  {id: 'golden_apple', name: '生命', at: 132},
];

const FlipDigit: FC<{from: number; to: number; t: number}> = ({from, to, t}) => {
  // first half: old digit folds away (scaleY 1 -> 0), second half: new digit unfolds
  const showNew = t >= 0.5;
  const k = showNew ? (t - 0.5) * 2 : 1 - t * 2;
  const v = showNew ? to : from;
  return (
    <div style={{position: 'relative', width: 150, height: 196, background: 'linear-gradient(180deg,#2d1f15,#120b07)', border: `6px solid #a87a2a`, boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 3px ${C.ink}, 0 10px 0 4px rgba(0,0,0,.5)`, boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
      <div style={{transform: `scaleY(${Math.max(0.02, EASE.out(clamp01(k)) * (showNew ? 1 : 1))})`, display: 'flex'}}>
        <Fancy size={168} fill={GOLD_GRAD}>
          {String(v)}
        </Fancy>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: 'rgba(0,0,0,.7)'}} />
    </div>
  );
};

const Orbs: FC = () => {
  const f = useCurrentFrame();
  const r = mulberry32(21);
  return (
    <>
      {Array.from({length: 18}, (_, i) => {
        const sx = 360 + r() * 360;
        const sy = 600 + r() * 260;
        const at = 12 + i * 2.2;
        const dur = 30 + r() * 10;
        const t = (f - at) / dur;
        if (t < 0 || t > 1) return null;
        const e = EASE.in(t);
        const tx = BAR[0] + 20 + (i / 17) * (BAR[2] - 40) * 0.15;
        const ty = BAR[1] + 24;
        const x = lerp(sx, tx, e) + Math.sin(t * 7 + i) * 24 * (1 - e);
        const y = lerp(sy, ty, e) - Math.sin(t * Math.PI) * 200;
        const sz = 20 + (i % 3) * 4;
        return <div key={i} style={{position: 'absolute', left: snap(x - sz / 2, 2), top: snap(y - sz / 2, 2), width: sz, height: sz, background: i % 2 ? '#c8ff5a' : '#7aff5a', boxShadow: '0 0 16px #9aff5a', opacity: 1 - clamp01((t - 0.9) / 0.1)}} />;
      })}
    </>
  );
};

const LevelScene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const slide = prog(f, 0, 18, EASE.out);
  const fill = 0.7 + 0.3 * prog(f, 22, 40, EASE.inOut);
  const full = f >= 62;
  const flipT = clamp01((f - 64) / 18);
  const beamP = prog(f, 62, 26, EASE.out);
  const beamOut = prog(f, 130, 30, EASE.inOut);
  const xp = Math.round(lerp(840, 1200, prog(f, 22, 40, EASE.inOut)));
  const lit = [0, 1, 2, 3].map((i) => prog(f, 68 + i * 8, 10, EASE.out));
  const titleT = prog(f, 62, 12, EASE.back);
  const heroGlow = prog(f, 62, 14) * (1 - beamOut * 0.7);
  const content = (
    <>
      {/* aura + pillar */}
      <div style={{position: 'absolute', left: HERO[0] - 360, top: HERO[1] - 600, width: 720, height: 720, background: `radial-gradient(ellipse, rgba(255,200,90,${0.5 * heroGlow}) 0%, rgba(255,160,40,0) 68%)`, mixBlendMode: 'screen'}} />
      <Beam x={HERO[0]} y={HERO[1] + 4} h={900} w={210} color={C.gold2} p={beamP} fadeOut={beamOut * 0.55} seed={9} />
      {f >= 62 && f < 110 && <Embers count={20} color={['#ffe08a', '#ffb531', '#fff']} area={[HERO[0] - 180, 160, 360, 780]} seed={44} size={10} speed={2.2} />}
      <Orbs />
      {/* panel */}
      <div style={{position: 'absolute', left: PANEL_X + (1 - slide) * 420, top: PANEL_Y, opacity: clamp01(slide * 2)}}>
        <Frame w={PANEL_W} h={860} mat="wood" pad={30}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, height: '100%'}}>
            <div style={{transform: `scale(${full ? 1 + 0.12 * jiggle((f - 62) / 18, 2, 3) : 1})`, height: 96, display: 'flex', alignItems: 'center'}}>
              <Fancy size={92} spacing={10} fill={full ? GOLD_GRAD : 'linear-gradient(180deg,#e8dcc0,#a89878)'}>
                {full ? '等级提升' : '经验获取'}
              </Fancy>
            </div>
            {/* level flip */}
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <Label size={48} color="#d9c9a0" style={{marginRight: 12}}>
                等级
              </Label>
              <FlipDigit from={Math.floor(FROM / 10)} to={Math.floor(TO / 10)} t={0} />
              <FlipDigit from={FROM % 10} to={TO % 10} t={flipT} />
            </div>
            {/* xp bar */}
            <div style={{width: BAR[2], marginTop: 8}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                <Label size={36} color="#d9c9a0">
                  经验值
                </Label>
                <Bold size={44} color={full ? C.gold3 : '#fff'}>{`${xp} / 1200`}</Bold>
              </div>
              <div style={{position: 'relative', width: BAR[2], height: 56, background: C.ink, border: '6px solid #a87a2a', boxShadow: `0 0 0 4px ${C.ink}`, boxSizing: 'border-box'}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: full ? `linear-gradient(180deg, #fff3c2, ${C.gold2} 50%, ${C.gold1})` : 'linear-gradient(180deg,#d6ff8a,#7ad03a 55%,#3f8f1c)'}} />
                <div style={{position: 'absolute', left: 0, top: 0, width: `${fill * 100}%`, height: 6, background: 'rgba(255,255,255,.4)'}} />
                {full && f < 80 && <div style={{position: 'absolute', left: `${((f - 62) / 18) * 120 - 20}%`, top: 0, bottom: 0, width: 40, background: 'rgba(255,255,255,.55)', transform: 'skewX(-20deg)'}} />}
              </div>
            </div>
            {/* attribute points */}
            <div style={{marginTop: 4, display: 'flex', alignItems: 'center', gap: 16, opacity: prog(f, 98, 10)}}>
              <Label size={48} color="#d9c9a0">
                获得属性点
              </Label>
              <Fancy size={84}>+3</Fancy>
            </div>
            <div style={{display: 'flex', gap: 22}}>
              {ATTRS.map((a, i) => {
                const t = prog(f, a.at, 12, EASE.back);
                return (
                  <div key={i} style={{width: 216, height: 156, boxSizing: 'border-box', border: `4px solid ${C.gold1}`, boxShadow: `0 0 0 3px ${C.ink}, 0 0 ${18 * t}px ${C.gold2}`, background: 'linear-gradient(180deg,#2d1f15,#120b07)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4, transform: `scale(${t})`, opacity: clamp01(t * 3)}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                      <Item id={a.id} size={72} />
                      <Fancy size={60}>+1</Fancy>
                    </div>
                    <Label size={36} color="#d9c9a0">
                      {a.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </Frame>
      </div>
      {/* crests */}
      <CornerCrests lit={lit} size={104} margin={64} />
      {lit.map((l, i) => {
        const pos = [
          [116, 130],
          [W - 116, 130],
          [116, 960],
          [W - 116, 960],
        ][i];
        return (
          <div key={i}>
            <Burst x={pos[0]} y={pos[1]} at={68 + i * 8} count={16} colors={[C.gold3, C.gold2, '#fff']} speed={11} life={26} size={10} seed={i + 2} />
            <Glint x={pos[0]} y={pos[1]} t={(f - 68 - i * 8) / 14} size={90} />
          </div>
        );
      })}
      {/* bar burst */}
      <Burst x={BAR[0] + BAR[2]} y={BAR[1] + 28} at={62} count={34} colors={[C.gold3, C.gold2, '#fff', '#c8ff5a']} speed={18} life={30} size={12} seed={6} />
      <Glint x={BAR[0] + BAR[2]} y={BAR[1] + 28} t={(f - 62) / 16} size={150} />
      <Flash at={62} life={8} peak={0.55} color="#ffe9a8" />
      {/* sfx */}
      {[14, 20, 26, 32, 38, 44, 50].map((a) => (
        <Sfx key={a} at={a} src={mcSound('random/orb')} volume={0.18} rate={1 + (a - 14) / 60} />
      ))}
      <Sfx at={62} src={mcSound('random/levelup')} volume={0.6} />
      <Sfx at={64} src={mcSound('block/smithing_table/smithing_table1')} volume={0.4} />
      {ATTRS.map((a, i) => (
        <Sfx key={i} at={a.at} src={mcSound('random/pop')} volume={0.35} rate={1.1 + i * 0.15} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={68 + i * 8} src={mcSound('fire/ignite')} volume={0.12} rate={1.8} />
      ))}
      <div style={{display: 'none'}}>{titleT}{mix('#000', '#fff', 0.5)}</div>
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={[62]} life={12} strength={16}>
      <DungeonBg dim={0.12 - 0.12 * heroGlow} warm={1}>
        <div style={{position: 'absolute', left: HERO[0] - 120, top: HERO[1] - 14, width: 240, height: 30, background: 'radial-gradient(ellipse, rgba(0,0,0,.65), rgba(0,0,0,0) 70%)'}} />
        <div style={{position: 'absolute', left: HERO[0] - 8 * 15, top: HERO[1] - 32 * 15 - (f >= 62 ? Math.sin(Math.max(0, f - 62) / 8) * 6 * (1 - clamp01((f - 62) / 60)) : 0), filter: `brightness(${1 + 0.15 * heroGlow})`}}>
          <MobFigure kind="player" s={15} />
        </div>
        {content}
      </DungeonBg>
    </Shake>
  );
};

export const LevelUp = LevelScene;
