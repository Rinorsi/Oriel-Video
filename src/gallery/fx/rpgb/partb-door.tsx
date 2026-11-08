import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound, reelSfx} from '../../../reel/kit';
import type {FxEntry} from '../../types';
import {C, Chest3D, DungeonWall, Dust, Embers, Gloom, Mob, Rune, Shaft, lerp, prog, snap} from './kit';
import {BannerCloth, Grit, Pillars} from './partb-kit';

/**
 * rpg-door-open  (150f) - a heavy iron-banded stone double door grinds apart, grit rains from the lintel, light spills out
 * over the floor, then the camera pushes through the doorway into the glare.
 * Props: bg (wall, torches and floor; false = frame + door + light only), push (0..1, how far the camera moves in; 1 = full push),
 *        rune (glyph index shown on the lintel).
 */

const FRAMES = 150;
const OX = 560;
const OW = 800;
const OY = 200;
const OH = 700;
const LEAF = OW / 2;

const Leaf: FC<{flip?: boolean}> = ({flip}) => {
  const rivets = Array.from({length: 5}, (_, i) => 30 + i * 80);
  const band = (y: number, key: number) => (
    <div key={key} style={{position: 'absolute', left: 0, right: 0, top: y, height: 44, background: 'linear-gradient(180deg, #4b4e56 0 4px, #2b2d32 4px 36px, #15161a 36px)', boxShadow: '0 6px 0 rgba(0,0,0,0.45)'}}>
      {rivets.map((x) => (
        <div key={x} style={{position: 'absolute', left: x, top: 12, width: 16, height: 16, background: '#7a7d86', boxShadow: 'inset -4px -4px 0 #4b4e56, 0 0 0 4px #0c0c0e'}} />
      ))}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: LEAF, height: OH, transform: flip ? 'scaleX(-1)' : undefined, backgroundImage: `linear-gradient(rgba(10,8,6,0.3), rgba(10,8,6,0.5)), url(${block('deepslate_bricks')})`, backgroundSize: '100% 100%, 90px 90px', imageRendering: 'pixelated', boxShadow: 'inset 0 0 0 6px #0b0a09, inset -26px 0 0 #141517, inset -30px 0 0 #3a3c41'}}>
      {band(50, 0)}
      {band(328, 1)}
      {band(606, 2)}
      <div style={{position: 'absolute', left: 150, top: 0, width: 40, height: OH, background: 'linear-gradient(90deg, #4b4e56 0 4px, #25272b 4px 36px, #101113 36px)', opacity: 0.0}} />
      {/* square bronze knocker plate */}
      <div style={{position: 'absolute', left: LEAF - 120, top: 290, width: 76, height: 76, background: '#1a1208', boxShadow: `0 0 0 4px #0b0a09, inset 0 0 0 10px ${C.gold1}, inset 0 0 0 14px ${C.gold2}, inset 0 0 0 18px #1a1208`}} />
      <div style={{position: 'absolute', left: LEAF - 98, top: 264, width: 32, height: 28, background: C.gold1, boxShadow: `0 0 0 4px #0b0a09, inset 4px 4px 0 ${C.gold2}`}} />
    </div>
  );
};

export const DoorOpen: FC<{bg?: boolean; push?: number; rune?: number}> = ({bg, push = 1, rune = 7}) => {
  const f = useCurrentFrame();
  const rumble = prog(f, 16, 30, (t) => t);
  const open = EASE.inOut(clamp01((f - 40) / 52));
  const gap = open * LEAF;
  const seam = f < 40 ? 0.25 + 0.15 * Math.sin(f / 4) + rumble * 0.4 : 1;
  const cam = 1 + push * 2.6 * EASE.inOut(clamp01((f - 66) / 68));
  const camY = 580;
  const white = prog(f, 138, 12, EASE.in);
  const runeOn = prog(f, 40, 30);
  const fl = 0.9 + 0.1 * Math.sin(f * 0.8);
  const shakeK = f >= 16 && f < 96 ? 1 : 0;
  const lightOpacity = clamp01(open * 1.4 + (f < 40 ? 0 : 0.15));
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: `960px ${camY}px`}}>
          <AbsoluteFill style={{transform: shakeK ? `translate(${Math.sin(f * 9) * 5 * rumble}px, ${Math.cos(f * 13) * 4 * rumble}px)` : undefined}}>
            {bg && (
              <>
                <DungeonWall lights={[{x: 85, y: 330, r: 700}, {x: 1835, y: 330, r: 700}, {x: 960, y: 560, r: 900 * open}]} dim={0.74} tile={128} />
                {/* floor */}
                <div style={{position: 'absolute', left: 0, right: 0, top: OY + OH, bottom: 0, backgroundImage: `url(${block('polished_deepslate')})`, backgroundSize: '160px 160px', imageRendering: 'pixelated', filter: 'brightness(0.42)'}} />
              </>
            )}
            {bg &&
              [300, 1620].map((bx, i) => (
                <div key={i} style={{position: 'absolute', left: bx - 70, top: 90, filter: `brightness(${0.5 + 0.5 * open})`}}>
                  <div style={{position: 'absolute', left: -14, top: 0, width: 168, height: 20, backgroundImage: `url(${block('stripped_dark_oak_log')})`, backgroundSize: '20px 20px', imageRendering: 'pixelated', boxShadow: `0 0 0 4px ${C.ink}`}} />
                  <div style={{position: 'absolute', left: 0, top: 20}}>
                    <BannerCloth s={7} color="#7a1616" pattern="skull" patternColor="#14100d" />
                  </div>
                </div>
              ))}
            {/* the lit room behind the door */}
            <div style={{position: 'absolute', left: OX, top: OY, width: OW, height: OH, overflow: 'hidden', background: '#2a1608', opacity: lightOpacity}}>
              {/* the hall behind the door: lit back wall, receding pillars, perspective floor, a chest at the far end */}
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 480, backgroundImage: `url(${block('stone_bricks')})`, backgroundSize: '80px 80px', imageRendering: 'pixelated', filter: 'brightness(1.5) sepia(0.7) saturate(1.8)'}} />
              {[0, 1, 2].map((i) => (
                <div key={i} style={{position: 'absolute', top: 40 + i * 30, bottom: 230 - i * 22, left: 60 + i * 70, width: 56 - i * 12, background: `linear-gradient(90deg, #b88a45, #f0c577 40%, #7a5420)`, opacity: 0.95 - i * 0.12, boxShadow: '0 0 0 4px rgba(30,16,4,0.7)'}} />
              ))}
              {[0, 1, 2].map((i) => (
                <div key={i} style={{position: 'absolute', top: 40 + i * 30, bottom: 230 - i * 22, right: 60 + i * 70, width: 56 - i * 12, background: `linear-gradient(90deg, #7a5420, #f0c577 60%, #b88a45)`, opacity: 0.95 - i * 0.12, boxShadow: '0 0 0 4px rgba(30,16,4,0.7)'}} />
              ))}
              <div style={{position: 'absolute', left: -400, width: OW + 800, top: 470, height: 900, transformOrigin: '50% 0', transform: 'perspective(520px) rotateX(64deg)', backgroundImage: `url(${block('polished_andesite')})`, backgroundSize: '96px 96px', imageRendering: 'pixelated', filter: 'brightness(1.35) sepia(0.8) saturate(1.8)'}} />
              <div style={{position: 'absolute', left: LEAF - 70, top: 360, opacity: 1 - prog(f, 96, 24) * 0.0}}>
                <Chest3D s={9} open={prog(f, 100, 20)} glow={prog(f, 100, 20)} yaw={0} pitch={18} />
              </div>
              <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 55%, rgba(255,246,216,0.55) 0%, rgba(255,210,122,0.25) 35%, rgba(224,137,46,0) 70%)', mixBlendMode: 'screen'}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 470, bottom: 0, background: 'linear-gradient(180deg, rgba(255,240,190,0.85), rgba(120,60,15,0.7))'}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 466, height: 6, background: 'rgba(255,255,255,0.5)'}} />
              <div style={{position: 'absolute', left: LEAF - 40, top: 330, opacity: 1 - prog(f, 96, 24), filter: 'brightness(0) drop-shadow(0 0 10px rgba(255,200,100,0.9))'}}>
                <Mob mob="pillager" scale={5} />
              </div>
            </div>
            {/* doorway sides' inner shadow */}
            <div style={{position: 'absolute', left: OX, top: OY, width: OW, height: OH, boxShadow: 'inset 0 0 90px 30px rgba(0,0,0,0.7)', pointerEvents: 'none'}} />
            {/* leaves */}
            <div style={{position: 'absolute', left: OX, top: OY, width: OW, height: OH, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: -gap, top: 0, width: LEAF, height: OH}}>
                <Leaf />
              </div>
              <div style={{position: 'absolute', left: LEAF + gap, top: 0, width: LEAF, height: OH}}>
                <Leaf flip />
              </div>
              {/* seam light */}
              <div style={{position: 'absolute', left: OW / 2 - gap - 4 * seam, width: 8 * seam + gap * 2, top: 0, height: OH, background: '#ffe9b0', opacity: Math.min(1, seam) * (f < 40 ? 0.9 : 0), boxShadow: '0 0 30px #ffd27a'}} />
            </div>
            {/* frame: jambs, lintel, upper course, keystone */}
            {[
              {l: OX - 100, t: OY - 100, w: OW + 200, h: 100},
              {l: OX - 100, t: OY, w: 100, h: OH},
              {l: OX + OW, t: OY, w: 100, h: OH},
              {l: OX - 200, t: OY - 200, w: OW + 400, h: 100},
            ].map((b, i) => (
              <div key={i} style={{position: 'absolute', left: b.l, top: b.t, width: b.w, height: b.h, backgroundImage: `linear-gradient(rgba(12,9,6,0.18), rgba(12,9,6,0.3)), url(${block('chiseled_stone_bricks')})`, backgroundSize: '100% 100%, 90px 90px', imageRendering: 'pixelated', boxShadow: `inset 0 0 0 4px #0b0a09, inset 6px 6px 0 rgba(255,255,255,0.12), 0 10px 0 rgba(0,0,0,0.5)`}} />
            ))}
            <div style={{position: 'absolute', left: 960 - 64, top: OY - 200, width: 128, height: 200, background: '#17140f', boxShadow: `0 0 0 4px #0b0a09, inset 0 0 0 6px ${C.gold1}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Rune ch={rune} size={88} color={`rgba(255,${190 + 40 * runeOn},${80 + 80 * runeOn},${0.35 + 0.65 * runeOn})`} style={{filter: `drop-shadow(0 0 ${14 * runeOn}px #ffb531)`}} />
            </div>
            {/* light spilling over the floor */}
            <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: open * fl, mixBlendMode: 'screen', clipPath: 'polygon(560px 900px, 1360px 900px, 1800px 1080px, 120px 1080px)', background: 'linear-gradient(180deg, rgba(255,226,150,0.9) 0%, rgba(255,170,70,0.45) 60%, rgba(255,150,50,0.25) 100%)'}} />
            <Shaft x={960} w={800} lean={0} opacity={0.2 * open} color="255,222,150" top={OY} h={700} />
            <Grit k={rumble * (1 - prog(f, 80, 20))} x0={OX - 140} x1={OX + OW + 140} seed={6} count={54} />
            {bg && <Pillars lit={1} />}
            <Dust box={[300, 200, 1320, 800]} count={40} seed={14} opacity={0.5 * open} />
            <Embers box={[620, 700, 680, 160]} count={24} seed={3} rise={380} size={9} amount={open} life={64} colors={['#fff4c8', C.torchHi]} />
          </AbsoluteFill>
      </AbsoluteFill>
      {bg && <Gloom s={0.55 * (1 - open * 0.45)} />}
      <AbsoluteFill style={{background: '#fff3d0', opacity: white}} />
      <Sfx at={16} src={mcSound('dig/stone1')} volume={0.4} rate={0.6} />
      <Sfx at={26} src={mcSound('dig/gravel1')} volume={0.35} rate={0.8} />
      <Sfx at={38} src={mcSound('random/anvil_land')} volume={0.35} rate={0.5} />
      <Sfx at={42} src={mcSound('ui/stonecutter/cut1')} volume={0.45} rate={0.55} />
      <Sfx at={60} src={mcSound('dig/stone3')} volume={0.4} rate={0.7} />
      <Sfx at={74} src={reelSfx('whoosh-fast.mp3')} volume={0.4} />
      <Sfx at={128} src={reelSfx('impact-cine.mp3')} volume={0.35} />
      <Sfx at={90} src={mcSound('block/furnace/fire_crackle1')} volume={0.2} />
    </AbsoluteFill>
  );
};
void lerp;
void snap;

export const entryDoor: FxEntry = {
  meta: {
    id: 'rpg-door-open',
    name: '地牢大门',
    category: 'rpg',
    tags: ['RPG', '地下城', '大门', '推进', '入场', '转场'],
    frames: FRAMES,
    blurb: '铁箍石质双开大门在震动与落尘中向两侧推开，门缝先透出一线金光，随后光涌进地牢、门后立着剪影，镜头推进冲入光中。',
    usage: '进入新关卡/副本、打开隐藏区域的镜头；结尾的白光可直接接下一个场景当转场。',
    params: [
      {name: 'bg', desc: 'true = 完整地牢（石墙、地面、火把）；false = 只有门框、门扇和光（透明，可叠加）'},
      {name: 'push', desc: '镜头推进幅度 0–1，0 = 固定机位只开门'},
      {name: 'rune', desc: '门楣符文索引 0–25（附魔台文字）'},
    ],
  },
  Demo: () => <DoorOpen bg />,
  Layer: () => <DoorOpen />,
};
