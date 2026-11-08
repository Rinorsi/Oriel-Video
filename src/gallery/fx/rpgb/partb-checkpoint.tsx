import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {block, tex} from '../../../mc/assets';
import {PixelBurst, Shake} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {Sfx, mcSound} from '../../../reel/kit';
import {Crop} from '../../mob';
import type {FxEntry} from '../../types';
import {C, DungeonWall, Dust, Embers, Gloom, GoldFrame, Icon, Label, center, prog, snap} from './kit';
import {BannerCloth, Floor, Pillars} from './partb-kit';

/**
 * rpg-checkpoint  (135f) - a dark camp, the bonfire is lit (vanilla campfire textures), the wall torches catch,
 * two banners unfurl, then a "progress saved" toast slides in from the top-right corner while sparks rise.
 * Props: bg (full scene; false = toast, chip and sparks only), title / sub (toast text), place (top-left chip text).
 */

const FRAMES = 135;
const FIRE = tex('block/campfire_fire.png');
const LOG_LIT = tex('block/campfire_log_lit.png');
const LOG = tex('block/campfire_log.png');

const Barrels: FC<{side: 'l' | 'r'}> = ({side}) => {
  const b = (x: number, y: number, s: number, key: string) => (
    <div key={key} style={{position: 'absolute', [side === 'l' ? 'left' : 'right']: x, top: y, width: 16 * s, height: 16 * s, backgroundImage: `url(${block('barrel_side')})`, backgroundSize: '100% 100%', imageRendering: 'pixelated', boxShadow: `0 0 0 4px ${C.ink}, inset -${s * 2}px 0 0 rgba(0,0,0,0.35)`, filter: 'brightness(0.8)'}} />
  );
  return (
    <>
      {b(210, 880, 10, 'a')}
      {b(390, 920, 8, 'b')}
      {b(238, 724, 9, 'c')}
    </>
  );
};

const Campfire: FC<{x: number; y: number; ignite: number; lit: number}> = ({x, y, ignite, lit}) => {
  const f = useCurrentFrame();
  const fr = Math.floor(f / 2) % 8;
  const g = ignite <= 0 ? 0 : EASE.back(clamp01(ignite));
  const flick = 1 + 0.05 * Math.sin(f * 0.9);
  const stones = [-200, -120, -40, 40, 120, 200];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: 'scale(1.4)', transformOrigin: '0 0'}}>
      {/* stone ring */}
      {stones.map((dx, i) => (
        <div key={i} style={{position: 'absolute', left: dx - 36, top: 20 + Math.abs(dx) * 0.12 - (i % 2) * 6, width: 72, height: 60, backgroundImage: `url(${block('cobblestone')})`, backgroundSize: '72px 72px', imageRendering: 'pixelated', boxShadow: `0 0 0 4px ${C.ink}, inset 0 -10px 0 rgba(0,0,0,0.4)`, filter: `brightness(${0.45 + 0.4 * lit})`}} />
      ))}
      {/* logs */}
      {[-14, 14].map((a, i) => (
        <div key={i} style={{position: 'absolute', left: -150, top: -26 + i * 8, transform: `rotate(${a}deg)`, filter: `brightness(${0.55 + 0.45 * lit})`, boxShadow: `0 8px 0 rgba(0,0,0,0.4)`}}>
          <Crop src={lit > 0.05 ? LOG_LIT : LOG} sheet={lit > 0.05 ? [16, 64] : [16, 16]} rect={[0, 0, 16, 6]} scale={19} />
        </div>
      ))}
      {/* flames */}
      <div style={{position: 'absolute', left: -140, top: -220 - g * 40, transformOrigin: '50% 100%', transform: `scale(${g * flick}, ${g * (1.04 + 0.06 * Math.sin(f * 0.7))})`, opacity: g > 0 ? 1 : 0}}>
        <Crop src={FIRE} sheet={[16, 128]} rect={[0, fr * 16, 16, 16]} scale={18} style={{marginLeft: 0, filter: 'brightness(1.15)'}} />
      </div>
    </div>
  );
};

export const Checkpoint: FC<{bg?: boolean; title?: string; sub?: string; place?: string}> = ({bg, title = '已保存进度', sub = '检查点 · 幽暗密林 第 3 层', place = '检查点 3 / 7'}) => {
  const f = useCurrentFrame();
  const IG = 22;
  const ignite = clamp01((f - IG) / 12);
  const glow = prog(f, IG, 28, EASE.out);
  const torchL = f >= 30 ? prog(f, 30, 8) : 0;
  const torchR = f >= 36 ? prog(f, 36, 8) : 0;
  const fl = 0.88 + 0.12 * Math.sin(f * 0.9) * Math.sin(f * 0.43);
  const unfurlLen = [prog(f, 38, 22, EASE.back), prog(f, 44, 22, EASE.back)];
  const toast = prog(f, 54, 14, EASE.back) * (1 - prog(f, 108, 12, EASE.in));
  const toastX = (1 - toast) * 620;
  const toastY = (1 - toast) * -240;
  const chip = prog(f, 60, 12, EASE.out) * (1 - prog(f, 108, 12, EASE.in));
  const bar = prog(f, 60, 16, (t) => t);
  const flashW = f >= IG && f < IG + 4 ? 0.55 * (1 - (f - IG) / 4) : 0;
  const lampLit = 0.2 + 0.8 * glow;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Shake at={IG} life={10} strength={9}>
        {bg && (
          <>
            <DungeonWall lights={[{x: 85, y: 330, r: 650}, {x: 1835, y: 330, r: 650}]} lit={0.15 + 0.85 * Math.max(torchL, torchR)} dim={0.74 - 0.12 * glow} />
            {/* the bonfire's own light on the wall */}
            <AbsoluteFill style={{mixBlendMode: 'screen', opacity: glow * fl, background: 'radial-gradient(ellipse 900px 700px at 960px 780px, rgba(255,150,50,0.55) 0%, rgba(200,90,25,0.25) 45%, rgba(0,0,0,0) 100%)'}} />
            <Floor y={760} />
            <Pillars lit={Math.max(torchL, torchR)} />
            <Barrels side="l" />
            <Barrels side="r" />
            {/* banners on poles */}
            {[0, 1].map((k) => {
              const bx = k === 0 ? 400 : 1320;
              const h = unfurlLen[k];
              return (
                <div key={k} style={{position: 'absolute', left: bx, top: 280, filter: `brightness(${0.4 + 0.6 * lampLit})`}}>
                  <div style={{position: 'absolute', left: 88, top: 0, width: 24, height: 620, backgroundImage: `url(${block('stripped_dark_oak_log')})`, backgroundSize: '24px 24px', imageRendering: 'pixelated', boxShadow: `0 0 0 4px ${C.ink}`}} />
                  <div style={{position: 'absolute', left: -20, top: 0, width: 240, height: 24, backgroundImage: `url(${block('stripped_dark_oak_log')})`, backgroundSize: '24px 24px', imageRendering: 'pixelated', boxShadow: `0 0 0 4px ${C.ink}`}} />
                  <div style={{position: 'absolute', left: 0, top: 24}}>
                    <BannerCloth s={10} color={k === 0 ? '#9a1f1f' : '#9a1f1f'} pattern="cross" patternColor={C.gold2} hang={Math.min(1, h)} />
                  </div>
                  <div style={{position: 'absolute', left: 60 + 0, top: 604, width: 80, height: 28, backgroundImage: `url(${block('cobblestone')})`, backgroundSize: '28px 28px', imageRendering: 'pixelated', boxShadow: `0 0 0 4px ${C.ink}`}} />
                </div>
              );
            })}
            <Campfire x={960} y={850} ignite={ignite} lit={glow} />
            <Dust box={[300, 150, 1320, 800]} count={34} seed={12} opacity={0.4 * glow} />
            <Gloom s={0.55 - 0.15 * glow} />
          </>
        )}
      </Shake>
      <Embers box={[840, 560, 240, 160]} count={46} seed={5} rise={420} size={12} amount={glow} life={64} />
      <Embers box={[300, 700, 1320, 200]} count={16} seed={9} rise={260} size={8} amount={glow * 0.7} life={80} colors={[C.torchHi, C.torch]} />
      <PixelBurst x={960} y={780} at={IG} count={44} colors={[C.torchHi, C.torch, C.ember, '#fff']} speed={22} life={34} size={16} gravity={0.5} seed={4} />
      {flashW > 0 && <AbsoluteFill style={{background: C.torchHi, opacity: flashW, mixBlendMode: 'screen'}} />}
      {/* top-left chip */}
      <div style={{position: 'absolute', left: 100, top: 90, opacity: chip, transform: `translateX(${(1 - chip) * -260}px)`}}>
        <GoldFrame w={380} h={92} rim={8} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
          <Icon id="clock_00" size={48} />
          <Label size={36} color={C.gold3}>{place}</Label>
        </GoldFrame>
      </div>
      {/* toast from the top-right corner */}
      <div style={{position: 'absolute', right: 100, top: 90, opacity: clamp01(toast * 3), transform: `translate(${toastX}px, ${toastY}px)`}}>
        <GoldFrame w={680} h={170} rim={10} glow="rgba(255,181,49,0.28)" style={{display: 'flex', alignItems: 'center', gap: 30, paddingLeft: 36, paddingRight: 36}}>
          <div style={{width: 96, height: 96, background: 'rgba(0,0,0,0.5)', boxShadow: `inset 0 0 0 4px ${C.gold0}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon id="writable_book" size={72} />
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <Label size={60} color={C.gold3}>{title}</Label>
            <Label size={32} small color="#d8cfc0">{sub}</Label>
            <div style={{width: 380, height: 12, background: '#120c07', boxShadow: `0 0 0 4px ${C.ink}`, marginTop: 4}}>
              <div style={{width: snap(380 * bar, 4), height: 12, background: `linear-gradient(180deg, ${C.gold3}, ${C.gold2} 50%, ${C.gold1})`}} />
            </div>
          </div>
        </GoldFrame>
      </div>
      {bg && <Sfx at={4} src={mcSound('block/furnace/fire_crackle1')} volume={0.12} />}
      <Sfx at={IG} src={mcSound('fire/ignite')} volume={0.5} />
      <Sfx at={IG + 2} src={mcSound('block/furnace/fire_crackle1')} volume={0.35} />
      <Sfx at={30} src={mcSound('fire/ignite')} volume={0.2} rate={1.2} />
      <Sfx at={36} src={mcSound('fire/ignite')} volume={0.2} rate={1.35} />
      <Sfx at={40} src={mcSound('item/armor/equip_netherite1')} volume={0.2} rate={0.8} />
      <Sfx at={54} src={mcSound('ui/toast/in')} volume={0.4} />
      <Sfx at={108} src={mcSound('ui/toast/out')} volume={0.3} />
    </AbsoluteFill>
  );
};

export const entryCheckpoint: FxEntry = {
  meta: {
    id: 'rpg-checkpoint',
    name: '存档点',
    category: 'rpg',
    tags: ['RPG', '地下城', '存档', '检查点', '篝火', '提示'],
    frames: FRAMES,
    blurb: '冷暗营地里篝火点燃、火光爬上石墙，火把依次亮起，两面旗帜垂落展开，“已保存进度”提示条从右上角滑入，火星持续飘起。',
    usage: '通关一段后的“进度保存”、章节/关卡间的喘息点、解说里提示“这里是存档点”。',
    params: [
      {name: 'bg', desc: 'true = 完整场景；false = 只有提示条、检查点标签与火星（可叠加到任意画面）'},
      {name: 'title / sub', desc: '提示条主文案与副文案'},
      {name: 'place', desc: '左上角标签，如“检查点 3 / 7”'},
    ],
  },
  Demo: () => <Checkpoint bg />,
  Layer: () => <Checkpoint />,
};
