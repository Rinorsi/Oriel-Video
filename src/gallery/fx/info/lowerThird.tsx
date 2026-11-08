import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PixelBurst} from '../../../mc/Fx';
import {EASE} from '../../../mc/theme';
import {ORE, OreChip, PlayerFace, U} from '../../../mg/Ore';
import {ItemImg, mcSound} from '../../../reel/kit';
import {FLAT, PixelSprite, RAINBOW, type SpriteName, flatBox} from '../../flat';
import {Bolt, Chip, Halftone, Hazard, Motes, PX, Shine, Slab, Sparkles, Stage, StickerText, W, back, pr, spring, typed, Sfx} from './ui';
import {MascotHead, type MascotKind} from './mascot';

/**
 * Lower-third name bars (transparent overlays).
 *   LowerThirdOre  : avatar slot pops, the Ore plate unrolls from it, name types out, light sweep, handle chip drops in,
 *                    channel bug slides in top-right; at the end the plate rolls back into the avatar and leaves.
 *     props: name, role, handle, skin (player skin path), tag (channel bug text), icon (channel bug item), badge (item shown at the plate's right end),
 *            badges (the other two item slots), avatarTag (green label on the avatar), dim (bottom shade multiplier), frames (total length)
 *   LowerThirdCute : round mascot avatar with a rotating dotted ring, tilted sticker name card, role ribbon, hearts and stars,
 *                    cloud row along the bottom.
 *     props: name, role, mascot (slime|pig|creeper), tag, frames (total length)
 */

export const LOWER_ORE_FRAMES = 135;
export const LOWER_CUTE_FRAMES = 135;

export const LowerThirdOre: FC<{bg?: boolean; name?: string; role?: string; handle?: string; skin?: string; tag?: string; icon?: string; badge?: string; badges?: string[]; avatarTag?: string; dim?: number; frames?: number}> = ({
  bg,
  name = '红石阿明',
  role = '建筑师 · 红石工程',
  handle = '@RedstoneAMing',
  skin = 'entity/player/wide/steve.png',
  tag = '优易库',
  icon = 'diamond',
  badge = 'redstone',
  badges = ['diamond_pickaxe', 'golden_apple'],
  avatarTag = 'UP主',
  dim = 1,
  frames = LOWER_ORE_FRAMES,
}) => {
  const f = useCurrentFrame();
  const N = frames;
  const X0 = 80;
  const Y0 = 640;
  const AV = 248;
  const PW = 1100;
  const PH = 200;
  const avIn = back(pr(f, 0, 12, (t) => t));
  const unroll = pr(f, 10, 18, EASE.out);
  const retract = pr(f, N - 34, 16, EASE.in);
  const avOut = pr(f, N - 20, 16, EASE.in);
  const plateW = PW * unroll * (1 - retract);
  const backW = PW * pr(f, 14, 18, EASE.out) * (1 - pr(f, N - 36, 16, EASE.in));
  const nameN = (f - 18) / 2.2;
  const bottomBand = pr(f, 0, 14) * (1 - avOut);
  const lineLen = (W - X0 - AV - PW - 40) * pr(f, 26, 22) * (1 - retract);
  return (
    <Stage bg={bg}>
      <AbsoluteFill style={{background: `linear-gradient(0deg, rgba(8,10,20,${0.82 * bottomBand * dim}) 0%, rgba(8,10,20,${0.55 * bottomBand * dim}) 28%, rgba(8,10,20,0) 52%)`}} />
      {/* corner channel bug */}
      <div style={{position: 'absolute', right: 72, top: 60, transform: `translateY(${(1 - back(pr(f, 20, 14, (t) => t))) * -200 - avOut * 200}px)`}}>
        <Slab w={300} h={96} tone="panel_raised" shadow={8}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 28}}>
            <ItemImg id={icon} size={56} />
            <PX size={48} color="#fff">{tag}</PX>
          </div>
          <Shine p={pr(f, 40, 20, (t) => t)} />
        </Slab>
      </div>
      {/* bottom hazard ticker line across the frame */}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W * pr(f, 6, 18) * (1 - avOut), height: 12, boxShadow: '0 0 0 4px #000'}}>
        <Hazard w="100%" h={12} f={f * 2} size={12} />
      </div>

      <div style={{position: 'absolute', left: X0 - avOut * 400, top: Y0}}>
        {/* accent line running off to the right with ticks */}
        <div style={{position: 'absolute', left: AV + PW - 8, top: PH - 36, width: lineLen, height: 8, background: ORE.gold, boxShadow: '0 0 0 4px #000'}}>
          {[0.25, 0.5, 0.75].map((t, k) => (
            <div key={k} style={{position: 'absolute', left: `${t * 100}%`, top: -16, width: 8, height: 40, background: k === 1 ? '#fff' : ORE.gold, boxShadow: '0 0 0 4px #000'}} />
          ))}
        </div>
        {/* back plate (gold, offset) */}
        <div style={{position: 'absolute', left: AV - 40, top: 40, width: backW, height: PH, background: ORE.gold, boxShadow: '0 0 0 4px #000, inset 0 8px 0 #ffe08a, inset 0 -8px 0 #b07a14', overflow: 'hidden'}}>
          <Hazard w="100%" h={20} a="#f8af2b" b="#1e1e1f" f={f * 2} size={20} style={{position: 'absolute', left: 0, bottom: 0}} />
        </div>
        {/* main plate */}
        <div style={{position: 'absolute', left: AV - 40, top: 16, width: PW, height: PH, clipPath: `inset(-40px ${PW - plateW}px -60px 0)`}}>
          <Slab w={PW} h={PH} tone="panel_raised" shadow={12}>
            <Halftone color="#000" opacity={0.12} />
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: ORE.greenLight, boxShadow: '0 0 0 4px #000'}} />
            <div style={{position: 'absolute', left: 88, top: 14}}>
              <PX size={96} color="#fff" shadow="rgba(0,0,0,0.55)" style={{textShadow: `${U}px ${U}px 0 rgba(0,0,0,0.55)`}}>{typed(name, nameN)}</PX>
              <span style={{display: 'inline-block', width: 20, height: 84, marginLeft: 8, background: ORE.gold, verticalAlign: 'top', opacity: nameN < name.length ? 1 : 0}} />
            </div>
            <div style={{position: 'absolute', left: 88, bottom: 20, display: 'flex', alignItems: 'center', gap: 20, opacity: pr(f, 28, 8), transform: `translateX(${(1 - pr(f, 28, 12)) * -40}px)`}}>
              <Chip dot={ORE.gold} color="#fff">
                {role}
              </Chip>
            </div>
            <div style={{position: 'absolute', right: 40, top: 26, display: 'flex', gap: 16}}>
              {[badge, ...badges].map((id, k) => (
                <div key={id} style={{transform: `scale(${back(pr(f, 30 + k * 4, 12, (t) => t))})`}}>
                  <Slab w={96} h={96} tone="panel_glass" shadow={4}>
                    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(f / 8 + k) * 3}px)`}}>
                      <ItemImg id={id} size={64} />
                    </div>
                  </Slab>
                </div>
              ))}
            </div>
            <Bolt x={PW - 12} y={14} s={12} />
            <Bolt x={PW - 12} y={PH - 14} s={12} />
            <Shine p={pr(f, 34, 24, (t) => t)} />
          </Slab>
        </div>
        {/* handle chip, pops up above the plate */}
        <div style={{position: 'absolute', left: AV + 560, top: -26 + (1 - back(pr(f, 36, 14, (t) => t))) * 60, opacity: pr(f, 36, 6) * (1 - retract), transform: `scale(${back(pr(f, 36, 12, (t) => t))})`, transformOrigin: '0% 100%'}}>
          <OreChip color={ORE.greenLight} dot={ORE.greenLight}>
            {handle}
          </OreChip>
        </div>
        {/* avatar */}
        <div style={{position: 'absolute', left: 0, top: 0, width: AV, height: AV, transform: `scale(${avIn * (1 - avOut * 0.6)}) rotate(${(1 - avIn) * -20}deg)`, opacity: 1 - avOut}}>
          <Slab w={AV} h={AV} tone="panel_glass" shadow={12}>
            <Halftone color="#6cc349" opacity={0.18} />
            <div style={{position: 'absolute', left: 36, top: 36}}>
              <PlayerFace size={176} skin={skin} />
            </div>
            <Shine p={pr(f, 14, 18, (t) => t)} />
          </Slab>
          <div style={{position: 'absolute', right: -20, bottom: -16, height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', background: ORE.greenLight, boxShadow: '0 0 0 4px #000, inset 0 6px 0 rgba(255,255,255,0.4), inset 0 -6px 0 rgba(0,0,0,0.25)', transform: `scale(${back(pr(f, 20, 12, (t) => t))})`}}>
            <PX size={36} color="#10300a" shadow={false}>{avatarTag}</PX>
          </div>
        </div>
        <Sparkles x={-10} y={-20} w={AV + 20} h={AV + 40} count={5} seed={12} px={4} at={10} />
      </div>
      <PixelBurst x={X0 + AV / 2} y={Y0 + AV / 2} at={4} count={14} colors={['#f8af2b', '#fff', '#6cc349']} speed={14} life={22} size={10} seed={5} />
      <Motes x={X0} y={Y0 - 120} w={PW + AV} h={AV + 160} count={12} seed={4} colors={['#ffe08a', '#6cc349', '#fff']} size={8} rise={0.8} opacity={bottomBand} />
      <Sfx at={1} src={mcSound('random/pop')} volume={0.45} />
      <Sfx at={10} src={mcSound('ui/toast/in')} volume={0.35} rate={1.3} />
      <Sfx at={20} src={mcSound('random/click')} volume={0.2} rate={1.4} />
      <Sfx at={N - 34} src={mcSound('ui/toast/out')} volume={0.3} />
    </Stage>
  );
};


// ====================================================================== cute

const CloudRow: FC<{f: number; k: number}> = ({f, k}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0 - (1 - k) * 240, height: 200, overflow: 'visible'}}>
    {Array.from({length: 11}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: -60 + i * 190 - (f * 0.4) % 190, bottom: (i % 2) * -30 - 20 + Math.sin(f / 20 + i) * 4}}>
        <PixelSprite sprite="cloud" px={12} outline={FLAT.ink} />
      </div>
    ))}
  </div>
);

export const LowerThirdCute: FC<{bg?: boolean; name?: string; role?: string; mascot?: MascotKind; tag?: string; frames?: number}> = ({bg, name = '小蓝同学', role = '今天的讲解员', mascot = 'slime', tag = '关注我', frames = LOWER_CUTE_FRAMES}) => {
  const f = useCurrentFrame();
  const N = frames;
  const out = pr(f, N - 22, 18, EASE.in);
  const k = pr(f, 0, 16) * (1 - out);
  const av = spring(pr(f, 2, 18, (t) => t), 8, 4.2);
  const card = spring(pr(f, 10, 20, (t) => t), 8, 4);
  const ribbon = back(pr(f, 24, 14, (t) => t));
  const wob = Math.sin(f / 8) * 1.2;
  const X0 = 100;
  const Y0 = 600;
  return (
    <Stage bg={bg}>
      <AbsoluteFill style={{background: `linear-gradient(0deg, rgba(255,244,214,${0.0}) 0%, rgba(0,0,0,0) 100%)`}} />
      <CloudRow f={f} k={k} />
      {/* ticker bug top-right */}
      <div style={{position: 'absolute', right: 80, top: 64, transform: `translateY(${(1 - back(pr(f, 30, 14, (t) => t))) * -220 - out * 220}px) rotate(${3 + Math.sin(f / 10) * 2}deg)`}}>
        <div style={{...flatBox(FLAT.pink, {radius: 48, border: 8, shadow: 10, edge: 'rgba(255,255,255,0.4)'}), height: 96, padding: '0 36px 0 24px', display: 'flex', alignItems: 'center', gap: 16}}>
          <PixelSprite sprite="heart" px={6} outline={FLAT.ink} style={{transform: `scale(${1 + Math.abs(Math.sin(f / 6)) * 0.2})`}} />
          <StickerText size={48} color="#fff" halo={false}>{tag}</StickerText>
        </div>
      </div>
      <div style={{position: 'absolute', left: X0, top: Y0, transform: `translateX(${-out * 900}px) scale(1.22)`, transformOrigin: '0 0', opacity: 1 - out * 0.4}}>
        {/* rainbow ribbon running off to the right */}
        <div style={{position: 'absolute', left: 940, top: 196, width: 640 * pr(f, 26, 22) * (1 - out), height: 48, boxShadow: `0 0 0 6px ${FLAT.ink}, 0 10px 0 6px ${FLAT.ink}`, transform: `rotate(-2deg)`, transformOrigin: '0 50%'}}>
          {RAINBOW.map((c) => (
            <div key={c} style={{height: 8, background: c}} />
          ))}
        </div>
        {/* name card */}
        <div style={{position: 'absolute', left: 150, top: 24, width: 820, height: 188, transform: `scaleX(${card}) rotate(${-2 + wob * 0.3}deg)`, transformOrigin: '0% 50%'}}>
          <div style={{position: 'absolute', inset: 0, transform: 'translate(14px, 16px) rotate(2deg)', ...flatBox(FLAT.sky, {radius: 28, border: 8, shadow: 0})}} />
          <div style={{position: 'absolute', inset: 0, ...flatBox(FLAT.yellow, {radius: 28, border: 8, shadow: 14, edge: 'rgba(255,255,255,0.5)'}), overflow: 'hidden'}}>
            <Halftone color={FLAT.orange} opacity={0.4} size={24} dot={5} />
            <Shine p={pr(f, 40, 22, (t) => t)} strength={0.9} />
          </div>
          <div style={{position: 'absolute', left: 100, right: 24, top: 14, display: 'flex', justifyContent: 'center', textAlign: 'center'}}>
            <StickerText size={96} color={FLAT.cream} halo={false}>
              {name}
            </StickerText>
          </div>
          {/* role ribbon */}
          <div style={{position: 'absolute', left: 120, bottom: -34, height: 72, padding: '0 28px', transform: `scale(${ribbon}) rotate(${1.5}deg)`, transformOrigin: '0% 50%', ...flatBox(FLAT.pink, {radius: 16, border: 6, shadow: 8, edge: 'rgba(255,255,255,0.35)'}), display: 'flex', alignItems: 'center', gap: 14}}>
            <PixelSprite sprite="star" px={4} outline={FLAT.ink} />
            <PX size={40} color="#fff" shadow={FLAT.pinkDeep}>{role}</PX>
          </div>
        </div>
        {/* avatar bubble */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 240, height: 240, transform: `scale(${av})`}}>
          <div style={{position: 'absolute', inset: -22, borderRadius: 16, border: `8px dashed ${FLAT.white}`, transform: `rotate(${f * 2}deg)`, opacity: 0.9}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: FLAT.mint, border: `8px solid ${FLAT.ink}`, boxShadow: `0 12px 0 ${FLAT.ink}, inset 0 12px 0 rgba(255,255,255,0.5)`, boxSizing: 'border-box', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: -40, height: 120, background: FLAT.green, borderTop: `8px solid ${FLAT.ink}`, borderRadius: '50% 50% 0 0'}} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 36 + Math.abs(Math.sin(f / 7)) * -16, display: 'flex', justifyContent: 'center'}}>
            <MascotHead kind={mascot} scale={16} />
          </div>
        </div>
        {/* floating hearts/stars */}
        {([
          ['heart', 250, -50, 5, 30],
          ['star', 860, -40, 6, 36],
          ['star', 960, 120, 4, 42],
          ['heart', 800, 250, 5, 46],
        ] as const).map(([s, x, y, px, at], i) => {
          const t = spring(pr(f, at, 14, (v) => v), 8, 4);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y + Math.sin(f / 10 + i * 1.7) * 10, transform: `scale(${t}) rotate(${Math.sin(f / 12 + i) * 14}deg)`}}>
              <PixelSprite sprite={s} px={px * 2} outline={FLAT.ink} />
            </div>
          );
        })}
      </div>
      <Sparkles x={80} y={620} w={1000} h={320} count={9} seed={44} px={5} at={14} />
      <Sfx at={2} src={mcSound('random/pop')} volume={0.5} rate={1.2} />
      <Sfx at={12} src={mcSound('ui/loom/take_result1')} volume={0.35} />
      <Sfx at={26} src={mcSound('random/pop')} volume={0.3} rate={1.5} />
      <Sfx at={N - 20} src={mcSound('ui/toast/out')} volume={0.3} rate={1.2} />
    </Stage>
  );
};
