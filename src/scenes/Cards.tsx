import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {block, sound, tex} from '../mc/assets';
import {BlockBackdrop, Flash, LightRays, PixelBurst, Shake, Twinkles, Vignette, popIn, slideIn} from '../mc/Fx';
import {ItemSprite} from '../mc/Gui';
import {BlockTitle, McText} from '../mc/McText';
import {Player3D, type PoseName} from '../mc/Player3D';
import {EASE, MC, RARITY, clamp01, type Rarity} from '../mc/theme';

/** Template: the advancement toast that slides in top-right ("进度达成！"). */
export const AdvancementToast: FC<{icon: string; title: string; text: string; at?: number; hold?: number; color?: string}> = ({icon, title, text, at = 0, hold = 70, color = MC.yellow}) => {
  const frame = useCurrentFrame() - at;
  if (frame < 0 || frame > hold + 20) return null;
  const inP = EASE.out(clamp01(frame / 12));
  const outP = EASE.in(clamp01((frame - hold) / 12));
  const s = 4;
  return (
    <div style={{position: 'absolute', right: 40, top: 40, transform: `translateX(${(1 - inP + outP) * 720}px)`}}>
      <div style={{position: 'relative', width: 160 * s, height: 32 * s, backgroundImage: `url(${tex('gui/sprites/toast/advancement.png')})`, backgroundSize: '100% 100%', imageRendering: 'pixelated'}}>
        <ItemSprite id={icon} size={16 * s} style={{position: 'absolute', left: 8 * s, top: 8 * s}} />
        <div style={{position: 'absolute', left: 30 * s, top: 5 * s}}>
          <McText size={36} color={color}>{title}</McText>
        </div>
        <div style={{position: 'absolute', left: 30 * s, top: 17 * s}}>
          <McText size={36}>{text}</McText>
        </div>
      </div>
      <Sequence from={0} durationInFrames={40}>
        <Audio src={sound('ui/toast/challenge_complete')} volume={0.45} />
      </Sequence>
    </div>
  );
};

/** Template: chapter card. "第 N 步 / 标题" with a hero item spinning in. */
export const ChapterCard: FC<{index: number; title: string; hint?: string; icon: string; backdrop?: string; accent?: string}> = ({index, title, hint, icon, backdrop = 'stone', accent = MC.gold}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const out = clamp01((frame - (durationInFrames - 10)) / 10);
  const spin = interpolate(EASE.out(clamp01(frame / 18)), [0, 1], [-200, 0]);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <BlockBackdrop texture={backdrop} darken={0.6} drift={-0.6} />
      <LightRays x={560} y={540} size={1000} opacity={0.18} />
      <div style={{position: 'absolute', left: 400, top: 380, ...popIn(frame, 2, 14)}}>
        <div style={{transform: `rotate(${spin}deg)`}}>
          <ItemSprite id={icon} size={320} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 860, top: 360, ...slideIn(frame, 6, 16, {x: 120})}}>
        <McText size={60} color={accent}>{`第 ${index} 步`}</McText>
      </div>
      <div style={{position: 'absolute', left: 860, top: 440, ...slideIn(frame, 10, 16, {x: 160})}}>
        <BlockTitle size={130} edge="#2A1A08">{title}</BlockTitle>
      </div>
      {hint && (
        <div style={{position: 'absolute', left: 864, top: 620, ...slideIn(frame, 16, 16, {x: 160})}}>
          <McText size={48} color={MC.gray}>{hint}</McText>
        </div>
      )}
      <Twinkles x={560} y={540} radius={260} seed={index * 13} />
      <Sequence from={2} durationInFrames={30}>
        <Audio src={sound('ui/toast/in')} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Template: hero item reveal. Item rises out of darkness, slams, glows, name in rarity colour.
 * Good for the cold open (the "best part first" hook) and the ending.
 */
export const ItemReveal: FC<{id: string; name: string; rarity?: Rarity; tagline?: string; glint?: boolean; backdrop?: string; at?: number}> = ({id, name, rarity = 'epic', tagline, glint = true, backdrop = 'blackstone', at = 18}) => {
  const frame = useCurrentFrame();
  const color = RARITY[rarity];
  const rise = clamp01(frame / at);
  const y = interpolate(EASE.in(rise), [0, 1], [260, 0]);
  const sc = frame < at ? interpolate(rise, [0, 1], [0.5, 1.25]) : interpolate(EASE.out(clamp01((frame - at) / 12)), [0, 1], [1.25, 1]);
  const float = frame > at + 12 ? Math.sin((frame - at) / 12) * 10 : 0;
  return (
    <AbsoluteFill>
      <BlockBackdrop texture={backdrop} darken={0.78} drift={0} />
      <Shake at={at} strength={22} life={16}>
        {frame >= at && <LightRays x={960} y={470} size={1500} opacity={0.32 * clamp01((frame - at) / 10)} color="200,120,255" />}
        <AbsoluteFill style={{background: `radial-gradient(circle at 50% 44%, ${color}33 0%, transparent 40%)`, opacity: clamp01((frame - at) / 8)}} />
        <div style={{position: 'absolute', left: 960 - 200, top: 470 - 200 + y + float, transform: `scale(${sc}) rotate(${frame >= at ? -8 : 0}deg)`, filter: `drop-shadow(0 0 ${frame >= at ? 18 : 0}px ${color}aa)`}}>
          <ItemSprite id={id} size={400} glint={glint ? frame / 30 : undefined} />
        </div>
        <PixelBurst x={960} y={470} at={at} count={70} speed={30} life={50} seed={21} colors={['#FFFFFF', color, MC.purple]} />
        {frame >= at + 6 && <Twinkles x={960} y={470} radius={300} count={12} seed={22} size={48} />}
        <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', ...popIn(frame, at + 8, 12)}}>
          <BlockTitle size={120} color={color} edge="#220A33">{name}</BlockTitle>
        </div>
        {tagline && (
          <div style={{position: 'absolute', top: 920, width: '100%', textAlign: 'center', ...slideIn(frame, at + 16, 14, {y: 30})}}>
            <McText size={48} color={MC.gray}>{tagline}</McText>
          </div>
        )}
      </Shake>
      <Flash at={at} peak={0.8} life={10} />
      <Vignette strength={0.85} />
      <Sequence from={Math.max(0, at - 14)} durationInFrames={30}>
        <Audio src={sound('fire/ignite')} volume={0.5} />
      </Sequence>
      <Sequence from={at} durationInFrames={90}>
        <Audio src={sound('random/anvil_use')} volume={0.55} />
      </Sequence>
      <Sequence from={at + 4} durationInFrames={90}>
        <Audio src={sound('item/armor/equip_netherite1')} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Template: "you need X, find it at Y" - an item card with a where-to-find strip. */
export const GatherCard: FC<{
  items: {id: string; count: number; name: string}[];
  where: string;
  whereBlock: string; // block texture for the location strip
  tip?: string;
}> = ({items, where, whereBlock, tip}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <BlockBackdrop texture={whereBlock} darken={0.55} drift={0.5} />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', ...slideIn(frame, 0, 14, {y: -40})}}>
        <McText size={72} color={MC.yellow}>需要准备</McText>
      </div>
      <div style={{position: 'absolute', top: 280, width: '100%', display: 'flex', justifyContent: 'center', gap: 90}}>
        {items.map((it, i) => (
          <div key={it.id} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, ...popIn(frame, 8 + i * 8, 12)}}>
            <div style={{position: 'relative', width: 240, height: 240, background: MC.slot, boxShadow: `inset 8px 8px 0 #373737, inset -8px -8px 0 #FFFFFF`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <ItemSprite id={it.id} size={176} style={{transform: `translateY(${Math.sin((frame + i * 9) / 10) * 6}px)`}} />
              <div style={{position: 'absolute', right: 14, bottom: 4}}>
                <McText size={60}>{`×${it.count}`}</McText>
              </div>
            </div>
            <McText size={48}>{it.name}</McText>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 260, right: 260, top: 760, display: 'flex', alignItems: 'center', gap: 28, background: 'rgba(0,0,0,0.6)', padding: '20px 32px', ...slideIn(frame, 10 + items.length * 8, 16, {x: -200})}}>
        <Img src={block(whereBlock)} style={{width: 72, height: 72, imageRendering: 'pixelated'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          <McText size={48} color={MC.aqua}>{`去哪找：${where}`}</McText>
          {tip && <McText size={36} color={MC.gray}>{tip}</McText>}
        </div>
      </div>
      {items.map((_, i) => (
        <Sequence key={i} from={8 + i * 8} durationInFrames={20}>
          <Audio src={sound('random/pop')} volume={0.4} playbackRate={1 + i * 0.1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Template: a talking-head style shot with the character posed live next to a speech bubble. */
export const CharacterLine: FC<{line: string; pose?: PoseName; heldItem?: string; backdrop?: string; skin?: string; children?: ReactNode}> = ({line, pose = 'wave', heldItem, backdrop = 'oak_planks', skin, children}) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(clamp01((frame - 10) / 30) * line.length);
  return (
    <AbsoluteFill>
      <BlockBackdrop texture={backdrop} darken={0.5} drift={0.3} />
      <div style={{position: 'absolute', left: 160, top: 160, ...slideIn(frame, 0, 16, {x: -300})}}>
        <Player3D width={620} height={820} pose={pose} yaw={28} pitch={6} heldItem={heldItem} skin={skin} />
      </div>
      <div style={{position: 'absolute', left: 820, top: 340, maxWidth: 1040, ...popIn(frame, 6, 12)}}>
        <div style={{background: '#FFFFFF', padding: '28px 40px 34px', boxShadow: '8px 8px 0 #000, inset 0 -8px 0 #C6C6C6', position: 'relative'}}>
          <McText size={60} color="#202020" shadow={false} style={{whiteSpace: 'pre-wrap'}}>
            {line.slice(0, chars)}
          </McText>
          <div style={{position: 'absolute', left: -40, top: 60, width: 0, height: 0, borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderRight: '40px solid #FFFFFF'}} />
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};
