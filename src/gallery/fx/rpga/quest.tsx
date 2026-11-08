import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {block, tex} from '../../../mc/assets';
import {ChestFront, Crop} from '../../mob';
import {Odometer} from './emerald';
import {Bold, Burst, C, DungeonBg, EASE, Embers, Fancy, Flash, Frame, GOLD_EDGE, GOLD_GRAD, Glint, Item, Label, RARITY, Shake, clamp01, jiggle, lerp, mix, prog, px, snap, DSlot, type RarityKey} from './common';
import {Barrel} from './widgets';

/**
 * Quest scroll pieces + two effects:
 *  - rpg-quest-accept: a parchment scroll drops in and unrolls from the top; title wipes in, three objectives are stamped one by one
 *    (stamp slams, dust, text wipe), the reward line fades in and a wax seal slams onto the lower right.
 *  - rpg-quest-complete: the filled-in scroll rolls up, a big red "完成" stamp slams on it, rewards pop out one by one into slots,
 *    then the experience bar fills and the emerald odometer rolls.
 * Props: `bg` - dungeon background (Demo). Layer = scroll/stamp/rewards on transparent.
 * Edit OBJECTIVES, REWARDS and the title strings in this file.
 */

export const QUEST_ACCEPT_FRAMES = 170;
export const QUEST_DONE_FRAMES = 210;

const INK = '#4a2f14';

export const Ink: FC<{size: number; color?: string; style?: CSSProperties; children: ReactNode}> = ({size, color = INK, style, children}) => (
  <span style={{fontFamily: 'OrielBlack', fontSize: size, lineHeight: `${Math.round(size * 1.2)}px`, color, whiteSpace: 'pre', textAlign: 'center', textShadow: '0 2px 0 rgba(255,240,200,.55)', ...style}}>{children}</span>
);

const OBJECTIVES = [
  {mob: 'zombie', text: '清剿僵尸', count: '12'},
  {mob: 'skeleton', text: '击溃骷髅弓手', count: '6'},
  {mob: 'creeper', text: '拆除苦力怕', count: '3'},
] as const;

const MobIcon: FC<{kind: 'zombie' | 'skeleton' | 'creeper'; s?: number}> = ({kind, s = 8}) => {
  const src = tex(kind === 'zombie' ? 'entity/zombie/zombie.png' : kind === 'skeleton' ? 'entity/skeleton/skeleton.png' : 'entity/creeper/creeper.png');
  return <Crop src={src} sheet={kind === 'zombie' ? [64, 64] : [64, 32]} rect={[8, 8, 8, 8]} scale={s} style={{boxShadow: `0 0 0 4px ${C.ink}`}} />;
};

/** Wooden rod with gold end caps. */
const Rod: FC<{w: number; top: number}> = ({w, top}) => (
  <div style={{position: 'absolute', left: -50, top, width: w + 100, height: 56}}>
    <div style={{position: 'absolute', left: 30, right: 30, top: 6, bottom: 6, backgroundImage: `url(${block('dark_oak_log')})`, backgroundSize: '56px 56px', ...px, filter: 'brightness(0.75) saturate(1.1)', boxShadow: `0 0 0 4px ${C.ink}, 0 8px 0 4px rgba(0,0,0,.45)`}} />
    <div style={{position: 'absolute', left: 30, right: 30, top: 6, height: 10, background: 'rgba(255,230,180,.22)'}} />
    {[0, 1].map((s) => (
      <div key={s} style={{position: 'absolute', [s ? 'right' : 'left']: 0, top: -8, width: 46, height: 72, background: GOLD_EDGE, boxShadow: `0 0 0 4px ${C.ink}, inset 0 -8px 0 rgba(0,0,0,.2)`}} />
    ))}
  </div>
);

/**
 * Scroll: paper area of height `openH` between two rods, top rod at y = top. `h` = full paper height.
 * Children are laid out for the full paper and clipped by the open part.
 */
const Scroll: FC<{x: number; top: number; w: number; h: number; open: number; children?: ReactNode; tilt?: number; fade?: number}> = ({x, top, w, h, open, children, tilt = 0, fade = 1}) => {
  const oh = Math.max(0, h * open);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top, width: w, height: oh + 112, opacity: fade, transform: `rotate(${tilt}deg)`, transformOrigin: '50% 0'}}>
      <Rod w={w} top={0} />
      <div style={{position: 'absolute', left: 0, top: 50, width: w, height: oh, overflow: 'hidden', boxShadow: `0 0 0 4px ${C.ink}, 0 16px 40px rgba(0,0,0,.5)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, background: `radial-gradient(ellipse at 50% 45%, ${C.parch2} 0%, ${C.parch1} 58%, ${C.parch0} 90%, #7a5a2a 100%)`}}>
          <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px rgba(80,40,10,.7), inset 0 0 0 8px rgba(70,40,10,.4)'}} />
          {Array.from({length: Math.floor(h / 44)}, (_, i) => (
            <div key={i} style={{position: 'absolute', left: 40 + (i % 3) * 36, top: 26 + i * 44, width: w - 120 - (i % 4) * 50, height: 2, background: 'rgba(110,70,20,.10)'}} />
          ))}
          {children}
        </div>
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: 28, background: 'linear-gradient(180deg, rgba(40,20,5,.45), rgba(40,20,5,0))'}} />
        <div style={{position: 'absolute', left: 0, bottom: 0, width: w, height: Math.min(oh, 36), background: 'linear-gradient(0deg, rgba(40,20,5,.5), rgba(40,20,5,0))'}} />
      </div>
      <Rod w={w} top={oh + 50 - 4} />
    </div>
  );
};

/** Wax seal with an embossed icon. `p` 0..1 is the slam progress. */
const Seal: FC<{size?: number; icon?: string; glow?: number}> = ({size = 190, icon = 'iron_sword', glow = 0}) => {
  const blob = 'polygon(12% 4%, 40% 0%, 70% 4%, 94% 18%, 100% 48%, 94% 80%, 70% 98%, 38% 100%, 10% 90%, 0% 58%, 2% 26%)';
  return (
    <div style={{position: 'relative', width: size, height: size, filter: `drop-shadow(0 10px 0 rgba(0,0,0,.4)) drop-shadow(0 0 ${20 * glow}px #ff5a3a)`}}>
      <div style={{position: 'absolute', inset: 0, clipPath: blob, background: C.ink}} />
      <div style={{position: 'absolute', inset: 6, clipPath: blob, background: 'linear-gradient(145deg,#ff7a5a 0%,#c9301c 35%,#7a1409 100%)'}} />
      <div style={{position: 'absolute', inset: size * 0.2, clipPath: blob, background: 'linear-gradient(145deg,#8f1c0e,#c9301c)', boxShadow: 'inset 0 0 0 4px rgba(255,160,120,.35)'}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <Item id={icon} size={size * 0.42} style={{filter: 'brightness(0.55) sepia(1) hue-rotate(-30deg) saturate(2) contrast(1.2)', opacity: 0.9}} />
      </div>
    </div>
  );
};

/** Square ink stamp with a pixel check mark. `landed` seconds after impact drive the squash. */
const CheckStamp: FC<{size?: number; color?: string}> = ({size = 72, color = '#8f1c0e'}) => {
  const u = size / 9;
  const cells = [
    [1, 4],
    [2, 5],
    [3, 6],
    [4, 5],
    [5, 4],
    [6, 3],
    [7, 2],
  ];
  return (
    <div style={{position: 'relative', width: size, height: size, boxSizing: 'border-box', border: `${u * 0.7}px solid ${color}`, background: 'rgba(143,28,14,.1)'}}>
      {cells.map(([cx, cy], i) => (
        <div key={i} style={{position: 'absolute', left: cx * u, top: cy * u - u, width: u * 1.2, height: u * 1.6, background: color}} />
      ))}
    </div>
  );
};

const RowContent: FC<{i: number; f: number; at: number}> = ({i, f, at}) => {
  const o = OBJECTIVES[i];
  const t = prog(f, at, 10, EASE.out);
  const stampT = (f - at) / 6;
  const sc = stampT < 0 ? 2.6 : stampT < 1 ? lerp(2.6, 1, EASE.in(clamp01(stampT))) : 1 + 0.12 * jiggle(stampT - 1, 1.5, 3) * -1;
  return (
    <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 30, height: 114, width: '100%'}}>
      <div style={{width: 92, height: 92, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `4px solid rgba(74,47,20,.6)`, boxSizing: 'border-box', background: 'rgba(255,240,200,.35)'}}>
        {f >= at && (
          <div style={{transform: `scale(${sc}) rotate(${(i - 1) * 5}deg)`, opacity: clamp01(stampT * 3 + 0.2), transformOrigin: '50% 50%'}}>
            <CheckStamp size={76} />
          </div>
        )}
      </div>
      <div style={{opacity: t > 0 ? 1 : 0}}>
        <MobIcon kind={o.mob} s={10} />
      </div>
      <div style={{flex: 1, overflow: 'hidden', height: 90, display: 'flex', alignItems: 'center'}}>
        <div style={{clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`}}>
          <Ink size={72}>{o.text}</Ink>
        </div>
      </div>
      <div style={{opacity: t, display: 'flex', alignItems: 'center', gap: 8}}>
        <Ink size={52} color="#7a4a1a">
          ×
        </Ink>
        <Ink size={80}>{o.count}</Ink>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(74,47,20,.28)', clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`}} />
    </div>
  );
};

const PW = 1120;
const PH = 830;
const PX = 960;
const PTOP = 56;

const Divider: FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'center'}}>
    <div style={{flex: 1, height: 4, background: 'linear-gradient(90deg, rgba(74,47,20,0), rgba(74,47,20,.7))'}} />
    <div style={{width: 20, height: 20, transform: 'rotate(45deg)', background: '#8f1c0e', boxShadow: `0 0 0 3px ${INK}`}} />
    <div style={{flex: 1, height: 4, background: 'linear-gradient(270deg, rgba(74,47,20,0), rgba(74,47,20,.7))'}} />
  </div>
);

const RewardLine: FC<{f: number; at: number; done?: boolean}> = ({f, at, done}) => {
  const t = prog(f, at, 14, EASE.out);
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, opacity: t, transform: `translateY(${(1 - t) * 16}px)`}}>
      <Ink size={48} color="#7a4a1a">
        奖励
      </Ink>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <Item id="emerald" size={72} />
        <Ink size={60}>×50</Ink>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <Item id="experience_bottle" size={72} />
        <Ink size={60}>×240</Ink>
      </div>
    </div>
  );
};

/** All text on the paper. */
const PaperBody: FC<{f: number; titleAt: number; rowAt: number[]; rewardAt: number; allDone?: boolean}> = ({f, titleAt, rowAt, rewardAt, allDone}) => {
  const tt = prog(f, titleAt, 14, EASE.out);
  return (
    <div style={{position: 'absolute', inset: 0, padding: '48px 80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
      <div style={{opacity: tt, display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{padding: '2px 22px', background: '#8f1c0e', boxShadow: `0 0 0 3px ${INK}`}}>
          <Label size={36} color="#ffe9c0">
            {allDone ? '任务达成' : '主线任务'}
          </Label>
        </div>
        <Ink size={36} color="#7a4a1a">
          第一章
        </Ink>
      </div>
      <div style={{clipPath: `inset(0 ${(1 - tt) * 100}% 0 0)`}}>
        <Ink size={132} style={{letterSpacing: 12}}>
          清剿地牢
        </Ink>
      </div>
      <Divider />
      <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6}}>
        {OBJECTIVES.map((_, i) => (
          <RowContent key={i} i={i} f={f} at={rowAt[i]} />
        ))}
      </div>
      <div style={{marginTop: 'auto'}}>
        <RewardLine f={f} at={rewardAt} done={allDone} />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- accept */

const AcceptScene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const drop = prog(f, 0, 14, EASE.back);
  const open = prog(f, 12, 30, EASE.out);
  const rowAt = [54, 72, 90];
  const sealT = (f - 118) / 8;
  const sealS = sealT < 0 ? 0 : sealT < 1 ? lerp(2.8, 1, EASE.in(sealT)) : 1 + 0.1 * jiggle(sealT - 1, 1.5, 3) * -1;
  const sway = Math.sin(f / 22) * 0.4;
  const content = (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: `translateY(${(1 - drop) * -260}px)`, opacity: clamp01(drop * 3)}}>
        <Scroll x={PX} top={PTOP} w={PW} h={PH} open={open} tilt={sway * (1 - open * 0.5)}>
          <PaperBody f={f} titleAt={44} rowAt={rowAt} rewardAt={106} />
        </Scroll>
      </div>
      {/* wax seal */}
      {f >= 118 && (
        <div style={{position: 'absolute', left: PX + PW / 2 - 160, top: PTOP + 50 + PH - 140, transform: `scale(${sealS}) rotate(-8deg)`, opacity: clamp01(sealT * 4)}}>
          <Seal size={190} glow={prog(f, 126, 20) * (1 - prog(f, 150, 18))} />
          {/* ribbon tails */}
          <div style={{position: 'absolute', left: 50, top: 150, width: 40, height: 90, background: 'linear-gradient(180deg,#c9301c,#7a1409)', boxShadow: `0 0 0 3px ${C.ink}`, zIndex: -1, transform: 'rotate(8deg)'}} />
          <div style={{position: 'absolute', left: 104, top: 150, width: 40, height: 100, background: 'linear-gradient(180deg,#c9301c,#7a1409)', boxShadow: `0 0 0 3px ${C.ink}`, zIndex: -1, transform: 'rotate(-10deg)'}} />
        </div>
      )}
      {rowAt.map((a, i) => (
        <div key={i}>
          <Burst x={PX - PW / 2 + 126} y={PTOP + 50 + 375 + i * 120} at={a + 6} count={14} colors={['#6b4a28', '#8f1c0e', '#d9b070']} speed={9} life={20} size={10} gravity={0.5} dir={-Math.PI / 2} spread={1.6} glow={false} seed={i + 3} />
          <Sfx at={a + 5} src={mcSound('dig/wood1')} volume={0.5} rate={0.8 + i * 0.08} />
        </div>
      ))}
      <Burst x={PX + PW / 2 - 65} y={PTOP + PH + 5} at={124} count={32} colors={['#ff7a5a', '#ffb531', '#fff', '#c9301c']} speed={20} life={28} size={12} seed={11} />
      <Glint x={PX + PW / 2 - 65} y={PTOP + PH + 5} t={(f - 124) / 12} size={170} color="#ffd9b0" />
      <Flash at={124} life={6} peak={0.35} color="#ffc8a0" />
      <Sfx at={2} src={mcSound('block/smithing_table/smithing_table2')} volume={0.3} rate={1.2} />
      <Sfx at={14} src={mcSound('ui/loom/take_result1')} volume={0.5} rate={0.8} />
      <Sfx at={44} src={mcSound('random/click')} volume={0.4} rate={1.4} />
      <Sfx at={106} src={mcSound('random/orb')} volume={0.25} rate={1.2} />
      <Sfx at={124} src={mcSound('random/anvil_land')} volume={0.55} rate={0.9} />
      <Sfx at={126} src={mcSound('dig/stone1')} volume={0.4} rate={0.7} />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={[60, 78, 96, 124]} life={9} strength={10}>
      <DungeonBg dim={0.25} warm={1.1}>
        <Barrel x={230} y={1030} s={9} />
        <div style={{position: 'absolute', left: 1680 - 7 * 9, top: 1030 - 15 * 9}}>
          <ChestFront scale={9} />
        </div>
        {content}
      </DungeonBg>
    </Shake>
  );
};

export const QuestAccept = AcceptScene;

/* ---------------------------------------------------------------- complete */

type Reward = {id: string; name: string; rar: RarityKey; extra?: string; at: number; x: number};
const REWARDS: Reward[] = [
  {id: 'diamond_sword', name: '曙光之刃', rar: 'unique', extra: '战力 236', at: 84, x: 330},
  {id: 'enchanted_book', name: '附魔书', rar: 'rare', extra: '锋利 III', at: 98, x: 610},
  {id: 'golden_apple', name: '金苹果', rar: 'common', extra: '×3', at: 112, x: 890},
];

const CompleteScene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  // scroll: open at the start, rolls up between 22 and 46
  const open = 1 - prog(f, 22, 24, EASE.inOut);
  const SCX = 610;
  const SW = 780;
  const SH = 560;
  const rolled = f >= 42;
  const rollScale = f >= 42 ? 1 + 0.08 * jiggle((f - 42) / 12, 2, 3) : 1;
  const stampT = (f - 56) / 7;
  const stampS = stampT < 0 ? 0 : stampT < 1 ? lerp(3.4, 1, EASE.in(clamp01(stampT))) : 1 + 0.09 * jiggle(stampT - 1, 1.5, 3) * -1;
  const stampFade = clamp01(stampT * 3);
  const xpFill = prog(f, 126, 26, EASE.inOut);
  const gem = 120 + 50 * prog(f, 138, 30, EASE.inOut);
  const panelT = prog(f, 60, 16, EASE.out);
  const content = (
    <>
      {/* open scroll (rolling up) */}
      {!rolled && (
        <Scroll x={SCX} top={110 + (1 - open) * 120} w={SW} h={SH} open={Math.max(0.02, open)}>
          <div style={{position: 'absolute', inset: 0, padding: '28px 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: 'scale(1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{padding: '2px 16px', background: '#8f1c0e', boxShadow: `0 0 0 3px ${INK}`}}>
                <Label size={24} color="#ffe9c0">
                  任务达成
                </Label>
              </div>
            </div>
            <Ink size={88} style={{letterSpacing: 8}}>
              清剿地牢
            </Ink>
            {OBJECTIVES.map((o, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, width: '100%', height: 90}}>
                <CheckStamp size={56} />
                <MobIcon kind={o.mob} s={6} />
                <Ink size={44}>{o.text}</Ink>
                <div style={{flex: 1}} />
                <Ink size={48}>{`${o.count}/${o.count}`}</Ink>
              </div>
            ))}
          </div>
        </Scroll>
      )}
      {/* rolled scroll */}
      {rolled && (
        <div style={{position: 'absolute', left: SCX - SW / 2 - 40, top: 230, width: SW + 80, height: 190, transform: `scale(${rollScale}, ${1 / rollScale})`}}>
          <div style={{position: 'absolute', left: 40, top: 18, width: SW, height: 150, background: 'linear-gradient(180deg,#a47c3e 0%,#e6cf94 22%,#f4e6b8 45%,#d9bb7c 72%,#8f6a30 100%)', boxShadow: `0 0 0 4px ${C.ink}, 0 18px 0 4px rgba(0,0,0,.4)`}}>
            <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(120,80,30,.0) 0, rgba(120,80,30,.0) 40px, rgba(120,80,30,.08) 41px, rgba(120,80,30,.0) 44px)'}} />
          </div>
          {[0, 1].map((s) => (
            <div key={s} style={{position: 'absolute', [s ? 'right' : 'left']: 0, top: 4, width: 56, height: 178, background: GOLD_EDGE, boxShadow: `0 0 0 4px ${C.ink}`}} />
          ))}
          {/* ribbon */}
          <div style={{position: 'absolute', left: SW / 2 + 40 - 36, top: 10, width: 72, height: 166, background: 'linear-gradient(90deg,#7a1409,#c9301c 40%,#7a1409)', boxShadow: `0 0 0 4px ${C.ink}`}} />
        </div>
      )}
      {/* big stamp */}
      {f >= 56 && (
        <div style={{position: 'absolute', left: SCX - 120, top: 325 - 120, width: 240, height: 240, transform: `scale(${stampS}) rotate(-9deg)`, opacity: stampFade}}>
          <div style={{width: '100%', height: '100%', boxSizing: 'border-box', border: '12px solid #d9321c', background: 'rgba(120,12,6,.82)', boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 6px rgba(255,170,130,.35), 0 0 30px rgba(255,80,40,.6)`, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <Fancy size={104} fill="linear-gradient(180deg,#fff6e4,#ffd7b0 60%,#ff9a70)" edge="#3a0a04">
              完成
            </Fancy>
          </div>
        </div>
      )}
      <Burst x={SCX} y={325} at={62} count={40} colors={['#ff7a5a', '#ffb531', '#fff', '#d9321c']} speed={22} life={30} size={12} seed={21} />
      <Glint x={SCX} y={325} t={(f - 62) / 14} size={210} color="#ffd9b0" />
      <Flash at={62} life={7} peak={0.5} color="#ffd0a0" />
      {/* reward slots */}
      {REWARDS.map((r, i) => {
        const col = RARITY[r.rar].color;
        const t = (f - r.at) / 20;
        const slotIn = prog(f, 72 + i * 4, 10, EASE.back);
        const e = EASE.out(clamp01(t));
        const ix = lerp(SCX, r.x, e);
        const iy = lerp(325, 700, e) - Math.sin(clamp01(t) * Math.PI) * 180;
        const landed = t >= 1;
        return (
          <div key={i}>
            <div style={{position: 'absolute', left: r.x - 110, top: 590, transform: `scale(${slotIn})`, opacity: slotIn}}>
              <div style={{width: 220, height: 220, boxSizing: 'border-box', border: `6px solid ${col}`, background: 'linear-gradient(180deg,#2d1f15,#0f0a07)', boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 40px ${col}33, 0 0 ${landed ? 30 : 8}px ${col}${landed ? 'aa' : '55'}`}} />
            </div>
            {f >= r.at && (
              <div style={{position: 'absolute', left: ix - 64, top: iy - 64 + (landed ? 0 : 0), width: 128, height: 128, transform: `scale(${landed ? 1 + 0.25 * jiggle((f - r.at - 20) / 12, 2, 3) : lerp(0.5, 1.3, Math.sin(clamp01(t) * Math.PI))})`, filter: `drop-shadow(0 0 18px ${RARITY[r.rar].glow})`}}>
                <Item id={r.id} size={128} />
              </div>
            )}
            <div style={{position: 'absolute', left: r.x - 140, top: 830, width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: prog(f, r.at + 16, 10)}}>
              <Fancy size={52} fill={`linear-gradient(180deg, ${mix(col, '#fff', 0.6)}, ${col} 55%, ${mix(col, '#000', 0.4)})`}>
                {r.name}
              </Fancy>
              <Label size={36} color="#d9c9a0">
                {r.extra ?? ''}
              </Label>
            </div>
            {f >= r.at + 20 && f < r.at + 40 && <Burst x={r.x} y={700} at={r.at + 20} count={r.rar === 'unique' ? 22 : 12} colors={r.rar === 'unique' ? [C.gold3, C.gold2, '#fff'] : r.rar === 'rare' ? ['#bfe2ff', '#4aa8ff', '#fff'] : ['#fff', '#cfcfcf']} speed={11} life={22} size={10} seed={i + 30} />}
            <Sfx at={r.at} src={mcSound('random/pop')} volume={0.4} rate={1 + i * 0.15} />
          </div>
        );
      })}
      {/* settlement panel */}
      <div style={{position: 'absolute', left: 1130 + (1 - panelT) * 400, top: 150, opacity: panelT}}>
        <Frame w={650} h={700} mat="wood" pad={32}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, height: '100%'}}>
            <Fancy size={80} spacing={10}>
              任务奖励
            </Fancy>
            <div style={{width: '100%', height: 4, background: 'linear-gradient(90deg, rgba(255,181,49,0), #ffb531 30%, #ffb531 70%, rgba(255,181,49,0))'}} />
            <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 16, opacity: prog(f, 118, 10)}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <Item id="experience_bottle" size={80} />
                <Label size={36} color="#d9c9a0">
                  经验
                </Label>
                <div style={{flex: 1}} />
                <Fancy size={64} fill="linear-gradient(180deg,#eaffb0,#8be04a 50%,#3f8f1c)" edge="#0d1a06">{`+${Math.round(240 * xpFill)}`}</Fancy>
              </div>
              <div style={{position: 'relative', height: 44, background: C.ink, border: '6px solid #a87a2a', boxShadow: `0 0 0 4px ${C.ink}`, boxSizing: 'border-box'}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(0.32 + 0.5 * xpFill) * 100}%`, background: 'linear-gradient(180deg,#d6ff8a,#7ad03a 55%,#3f8f1c)'}} />
                <div style={{position: 'absolute', left: 0, top: 0, width: `${(0.32 + 0.5 * xpFill) * 100}%`, height: 6, background: 'rgba(255,255,255,.4)'}} />
              </div>
            </div>
            <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: 16, opacity: prog(f, 130, 10), marginTop: 6}}>
              <Item id="emerald" size={80} style={{transform: `scale(${1 + 0.3 * jiggle((f - 138) / 30, 4, 2.2) * (f >= 138 ? 1 : 0)})`, filter: 'drop-shadow(0 0 14px #17dd62)'}} />
              <Label size={36} color="#d9c9a0">
                绿宝石
              </Label>
              <div style={{flex: 1}} />
              <Odometer value={gem} digits={3} cw={76} ch={112} fs={86} />
            </div>
            <div style={{marginTop: 'auto', opacity: prog(f, 160, 10), display: 'flex', alignItems: 'center', gap: 16}}>
              <Label size={24} color={C.gold3}>
                战力
              </Label>
              <Fancy size={56}>{`${210 + Math.round(26 * prog(f, 160, 20))}`}</Fancy>
            </div>
          </div>
        </Frame>
      </div>
      {[22, 38].map((a) => (
        <Sfx key={a} at={a} src={mcSound('ui/loom/take_result1')} volume={0.4} rate={1.1} />
      ))}
      <Sfx at={60} src={mcSound('random/anvil_land')} volume={0.6} rate={0.85} />
      <Sfx at={62} src={mcSound('ui/toast/challenge_complete')} volume={0.3} />
      {[126, 134, 142, 150, 158].map((a) => (
        <Sfx key={a} at={a} src={mcSound('random/orb')} volume={0.2} rate={1 + (a - 126) / 80} />
      ))}
      <Sfx at={138} src={mcSound('random/levelup')} volume={0.3} rate={1.2} />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={[62]} life={12} strength={20}>
      <DungeonBg dim={0.25} warm={1.1}>
        <Barrel x={230} y={1030} s={9} />
        {content}
        <Embers count={14} area={[200, 160, 1500, 800]} seed={9} />
      </DungeonBg>
    </Shake>
  );
};

export const QuestComplete = CompleteScene;
void snap;
void GOLD_GRAD;
void Bold;
void lerp;
