import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ItemImg, mcSound} from '../../../reel/kit';
import {Flash, LightRays, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE, clamp01} from '../../../mc/theme';
import {ORE, OreChip, U} from '../../../mg/Ore';
import {Bolt, Bracket, Halftone, Hazard, Icon, Motes, PX, Shine, Slab, Sparkles, W, H, back, lerp, pr, Stage, Sfx} from './ui';

/**
 * Chapter title cards (transparent overlays).
 *   ChapterOre   : Ore panel with chapter number, title, hint, icon and progress segments.
 * Props: no (chapter number), title (<= 7 chars), hint, icon + items (item ids), series (top-left label), total (chapters), next (bottom-right label),
 *   label (chapter word, default `第 NN 章`), kicker (small English word), itemsLabel (material column caption), footer (bottom-left line),
 *   accent (gold accent colour), dim (backdrop darkness multiplier), frames (total length; the exit starts ~26 frames before it).
 */

export const CHAPTER_ORE_FRAMES = 150;

export const ChapterOre: FC<{bg?: boolean; no?: number; total?: number; title?: string; hint?: string; icon?: string; items?: string[]; series?: string; next?: string; label?: string; kicker?: string; itemsLabel?: string; footer?: string; accent?: string; dim?: number; frames?: number}> = ({
  bg,
  no = 3,
  total = 8,
  title = '合成钻石装备',
  hint = '先备好 3 颗钻石和 2 根木棍',
  icon = 'diamond_sword',
  items = ['diamond', 'stick', 'iron_ingot'],
  series = 'EP.12 · 钻石装备篇',
  next = '下一章 · 附魔',
  label,
  kicker = 'CHAPTER',
  itemsLabel = '本章材料',
  footer = '本章约 6 分钟 · 含合成演示',
  accent = ORE.gold,
  dim: dimK = 1,
  frames = CHAPTER_ORE_FRAMES,
}) => {
  const f = useCurrentFrame();
  const N = frames;
  const outP = pr(f, N - 26, 22, EASE.in);
  const railIn = pr(f, 0, 14) * (1 - outP);
  const dim = pr(f, 0, 14) * (1 - outP);
  // panel unfolds vertically with overshoot, then collapses
  const open = back(pr(f, 6, 18, (t) => t));
  const sy = Math.max(0.02, open * (1 - outP * 0.97));
  const sx = lerp(0.86, 1, pr(f, 6, 18)) * (1 - outP * 0.1);
  const PW = 1440;
  const PH = 480;
  const px0 = (W - PW) / 2;
  const py0 = (H - PH) / 2;
  const chars = [...title];
  const rowOut = 1 - pr(f, N - 30, 12, EASE.in);
  const landed = f >= 22;
  return (
    <Stage bg={bg}>
      {/* dim + vignette */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(10,12,24,${0.35 * dim * dimK}) 0%, rgba(4,5,12,${0.78 * dim * dimK}) 100%)`}} />
      <LightRays x={W / 2} y={H / 2} size={1900} opacity={0.2 * dim} color="255,214,110" rays={16} />
      <Motes x={0} y={0} w={W} h={H} count={26} seed={4} colors={['#ffe27a', '#fff', '#6cc349']} size={12} opacity={dim} />

      {/* top / bottom rails */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 96, transform: `translateY(${-(1 - railIn) * 110}px)`, background: ORE.surface3, boxShadow: `0 ${U}px 0 #000, 0 ${3 * U}px 0 rgba(0,0,0,0.4), inset 0 -${U}px 0 #48494a`}}>
        <Halftone color="#fff" opacity={0.05} />
        <div style={{position: 'absolute', left: 48, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 20}}>
          <OreChip color="#fff" dot={accent}>
            {series}
          </OreChip>
        </div>
        <div style={{position: 'absolute', right: 48, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 20}}>
          <PX size={48} color={ORE.dim}>{`${String(no).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}</PX>
        </div>
        <Hazard w={W} h={U * 2} f={f * 2} style={{position: 'absolute', left: 0, bottom: 0}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 96, transform: `translateY(${(1 - railIn) * 110}px)`, background: ORE.surface3, boxShadow: `0 -${U}px 0 #000, inset 0 ${U}px 0 #48494a`}}>
        <Hazard w={W} h={U * 2} f={-f * 2} style={{position: 'absolute', left: 0, top: 0}} />
        <div style={{position: 'absolute', left: 48, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 16}}>
          <Icon name="right" px={U} />
          <PX size={32} color={ORE.dim}>{footer}</PX>
        </div>
        <div style={{position: 'absolute', right: 48, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.6 + 0.4 * Math.sin(f / 5)}}>
          <PX size={32} color={accent}>{next}</PX>
          <Icon name="right" px={U} color={accent} />
        </div>
      </div>

      {/* hazard tapes + wing rules framing the panel */}
      {[py0 - 56, py0 + PH + 40].map((y, i) => (
        <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: 16, transform: `scaleX(${pr(f, 10 + i * 3, 16)})`, transformOrigin: i ? '100% 50%' : '0% 50%', opacity: 1 - outP, boxShadow: '0 0 0 4px #000'}}>
          <Hazard w="100%" h={16} f={f * (i ? -3 : 3)} size={16} />
        </div>
      ))}
      {[0, 1].map((side) => {
        const grow = pr(f, 14, 20);
        const len = (px0 - 40) * grow;
        return (
          <div key={side} style={{position: 'absolute', top: H / 2 - 4, [side ? 'right' : 'left']: 0, width: len, height: 8, background: ORE.dim, opacity: (1 - outP) * 0.7, boxShadow: '0 0 0 4px #000'}}>
            {[0.2, 0.45, 0.7].map((t, k) => (
              <div key={k} style={{position: 'absolute', [side ? 'right' : 'left']: t * len, top: -20, width: 8, height: 48, background: k === 1 ? accent : ORE.dim, boxShadow: '0 0 0 4px #000'}} />
            ))}
          </div>
        );
      })}

      {/* panel */}
      <div style={{position: 'absolute', left: px0, top: py0, width: PW, height: PH, transform: `scale(${sx}, ${sy})`, transformOrigin: '50% 50%'}}>
        <Slab w={PW} h={PH} tone="panel_raised" shadow={16} style={{overflow: 'visible'}}>
          <Halftone color="#000" opacity={0.12} size={16} />
          <Bolt x={28} y={28} />
          <Bolt x={PW - 28} y={28} />
          <Bolt x={28} y={PH - 28} />
          <Bolt x={PW - 28} y={PH - 28} />
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <Shine p={pr(f, 52, 26, (t) => t)} />
            {/* big ghost numeral */}
            <div style={{position: 'absolute', right: 20, bottom: -60, opacity: 0.08}}>
              <PX size={480} color="#fff" shadow={false}>{String(no).padStart(2, '0')}</PX>
            </div>
          </div>
          {/* gold accent stripe at left edge */}
          <div style={{position: 'absolute', left: 0, top: 24, bottom: 24, width: 12, background: accent, boxShadow: '0 0 0 4px #000, inset -4px 0 0 #b07a14'}} />
        </Slab>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${1 / sx}, ${1 / Math.max(sy, 0.02)})`, opacity: rowOut}} />
      </div>

      {/* panel content is laid out in screen space, its own reveal, so text is never squashed */}
      <div style={{position: 'absolute', left: px0, top: py0, width: PW, height: PH, opacity: clamp01((sy - 0.5) * 4)}}>
        {/* icon block */}
        <div style={{position: 'absolute', left: 72, top: (PH - 240) / 2, width: 240, height: 240, transform: `scale(${back(pr(f, 20, 16, (t) => t))})`, opacity: rowOut}}>
          <div style={{position: 'absolute', inset: -40, background: `radial-gradient(circle, rgba(248,175,43,${0.5 + 0.2 * Math.sin(f / 6)}) 0%, rgba(248,175,43,0) 68%)`}} />
          <Slab w={240} h={240} tone="panel_glass" shadow={8}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(f / 9) * 6}px) rotate(${Math.sin(f / 14) * 4}deg)`}}>
              <ItemImg id={icon} size={160} />
            </div>
          </Slab>
          <Sparkles x={0} y={0} w={240} h={240} count={5} seed={8} px={4} at={24} />
        </div>
        {/* texts */}
        <div style={{position: 'absolute', left: 372, top: 68, display: 'flex', alignItems: 'center', gap: 24, opacity: rowOut * pr(f, 26, 8), transform: `translateX(${(1 - pr(f, 26, 12)) * -50}px)`}}>
          <PX size={72} color={accent}>{label ?? `第 ${String(no).padStart(2, '0')} 章`}</PX>
          <div style={{height: 8, width: 160 * pr(f, 30, 20), background: accent, boxShadow: '0 0 0 4px #000'}} />
          <PX size={32} color={ORE.dim}>{kicker}</PX>
        </div>
        <div style={{position: 'absolute', left: 372, top: 164, display: 'flex', opacity: rowOut}}>
          {chars.map((ch, i) => {
            const t = pr(f, 30 + i * 2.4, 10, (x) => x);
            const e = back(t);
            return (
              <div key={i} style={{transform: `translateY(${(1 - e) * -80}px) scale(${1 + (1 - t) * 0.5})`, opacity: t > 0 ? 1 : 0}}>
                <PX size={120} color="#fff" shadow="rgba(0,0,0,0.55)" style={{textShadow: `${U * 2}px ${U * 2}px 0 rgba(0,0,0,0.55)`}}>{ch}</PX>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 372, top: 318, opacity: rowOut * pr(f, 52, 10), transform: `translateY(${(1 - pr(f, 52, 14)) * 24}px)`}}>
          <PX size={48} color={ORE.dim}>{hint}</PX>
        </div>
        {/* material column */}
        <div style={{position: 'absolute', right: 56, top: 52, bottom: 52, width: 4, background: 'rgba(0,0,0,0.5)', boxShadow: '4px 0 0 rgba(255,255,255,0.12)', opacity: rowOut}} />
        <div style={{position: 'absolute', right: 120, top: 44, opacity: rowOut * pr(f, 40, 8)}}>
          <PX size={32} color={ORE.dim}>{itemsLabel}</PX>
        </div>
        <div style={{position: 'absolute', right: 112, top: 96, display: 'flex', flexDirection: 'column', gap: 12, opacity: rowOut}}>
          {items.map((id, i) => {
            const t = back(pr(f, 42 + i * 5, 12, (x) => x));
            return (
              <div key={id} style={{transform: `scale(${t})`, opacity: t > 0 ? 1 : 0}}>
                <Slab w={96} h={96} tone="panel_glass" shadow={4}>
                  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <ItemImg id={id} size={64} />
                  </div>
                </Slab>
              </div>
            );
          })}
        </div>
        {/* progress segments */}
        <div style={{position: 'absolute', left: 372, top: 396, display: 'flex', gap: 12, opacity: rowOut}}>
          {Array.from({length: total}, (_, i) => {
            const t = back(pr(f, 58 + i * 2, 8, (x) => x));
            const done = i < no - 1;
            const cur = i === no - 1;
            return (
              <div
                key={i}
                style={{
                  width: 96,
                  height: 24,
                  transform: `scaleY(${t})`,
                  background: done ? ORE.greenLight : cur ? accent : '#1e1e1f',
                  boxShadow: `0 0 0 4px #000, inset 0 -6px 0 ${done ? ORE.green : cur ? '#b07a14' : '#000'}, inset 0 6px 0 ${done ? '#a6e68a' : cur ? '#ffe08a' : '#313233'}`,
                  filter: cur ? `brightness(${1 + 0.25 * Math.sin(f / 4)})` : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
      <Bracket corner="tl" color={accent} inset={130} size={48} style={{opacity: pr(f, 14, 10) * (1 - outP)}} />
      <Bracket corner="tr" color={accent} inset={130} size={48} style={{opacity: pr(f, 14, 10) * (1 - outP)}} />
      <Bracket corner="bl" color={accent} inset={130} size={48} style={{opacity: pr(f, 14, 10) * (1 - outP)}} />
      <Bracket corner="br" color={accent} inset={130} size={48} style={{opacity: pr(f, 14, 10) * (1 - outP)}} />

      {landed && <Shockwave x={W / 2} y={H / 2} at={22} color="#f8af2b" maxR={760} life={16} width={14} />}
      <PixelBurst x={W / 2} y={py0 + PH} at={22} count={26} colors={['#f8af2b', '#ffe08a', '#fff']} speed={20} life={30} size={14} seed={3} />
      <Flash at={22} life={6} peak={0.25} />
      <Sfx at={4} src={mcSound('ui/toast/in')} volume={0.45} />
      <Sfx at={22} src={mcSound('dig/stone2')} volume={0.55} rate={0.8} />
      <Sfx at={34} src={mcSound('random/orb')} volume={0.3} rate={1.2} />
      <Sfx at={N - 24} src={mcSound('ui/toast/out')} volume={0.35} />
    </Stage>
  );
};
