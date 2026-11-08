import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {block, item as itemUrl} from '../../../mc/assets';
import {Beam, Bold, Burst, C, Cursor, DungeonBg, EASE, Embers, Fancy, Flash, GOLD_EDGE, GOLD_GRAD, Glint, Item, Label, W, clamp01, jiggle, lerp, mix, mulberry32, prog, px, rgba, snap} from './common';

/**
 * rpg-enchant-choose: three face-down enchantment cards drop in and flip one by one; the cursor hovers each (card lifts and glows),
 * then picks the middle one. The other two cards shatter into pixel shards and fade; the chosen card shrinks, flies to the sword and pins
 * itself onto it: purple glow, enchant glint sweeping over the blade, power number rises.
 * Props: `bg` - dungeon backdrop + altar (Demo); Layer = cards, sword, effects.
 * Edit CARDS (name / tier / desc / icon / colour) and PICK (index of the chosen card).
 */

export const ENCHANT_FRAMES = 210;

const CARDS = [
  {name: '锋利', tier: 'III', desc: '近战伤害 +30%', icon: 'flint', color: '#4aa8ff', cost: 2},
  {name: '灼烧', tier: 'II', desc: '命中附带灼烧', icon: 'blaze_powder', color: '#ffb531', cost: 3},
  {name: '吸血', tier: 'I', desc: '击中回复生命', icon: 'ghast_tear', color: '#c88bff', cost: 2},
];
const PICK = 1;
const CW = 400;
const CH = 540;
const CY = 96;
const CXS = [500, 960, 1420];
const WEAPON: [number, number] = [960, 800];
const FLIP_AT = [30, 38, 46];
const HOVERS: {card: number; from: number; to: number}[] = [
  {card: 0, from: 70, to: 84},
  {card: 2, from: 86, to: 100},
  {card: 1, from: 102, to: 130},
];
const CLICK = 116;
const SHATTER = CLICK + 2;
const FLYAT = CLICK + 14;
const FLYDUR = 24;
const ATTACH = FLYAT + FLYDUR;

const Back: FC<{color: string}> = ({color}) => (
  <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `8px solid ${C.gold1}`, background: 'linear-gradient(180deg,#2a1442,#120822)', boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 4px ${C.ink}, inset 0 0 60px rgba(160,90,255,.35)`}}>
    <div style={{position: 'absolute', inset: 22, boxSizing: 'border-box', border: `4px solid ${rgba(C.gold2, 0.5)}`}} />
    <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${block('obsidian')})`, backgroundSize: '64px 64px', ...px, opacity: 0.18, mixBlendMode: 'overlay'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center'}}>
      <Item id="enchanted_book" size={164} style={{filter: 'drop-shadow(0 0 22px #b86bff) brightness(1.1)'}} />
    </div>
    {/* corner runes */}
    {[
      [28, 28],
      [CW - 28 - 16 - 16, 28],
      [28, CH - 28 - 16 - 16],
      [CW - 28 - 16 - 16, CH - 28 - 16 - 16],
    ].map(([x, y], i) => (
      <div key={i} style={{position: 'absolute', left: x, top: y, width: 32, height: 32, transform: 'rotate(45deg) scale(.7)', border: `5px solid ${C.gold2}`, boxSizing: 'border-box', background: rgba(color, 0.2)}} />
    ))}
  </div>
);

const Front: FC<{i: number; hot?: number}> = ({i, hot = 0}) => {
  const c = CARDS[i];
  return (
    <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `8px solid ${hot > 0 ? C.gold2 : mix(c.color, '#000', 0.2)}`, background: `linear-gradient(180deg, ${rgba(c.color, 0.35)} 0%, #1a1126 42%, #0d0816 100%)`, boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 0 4px ${C.ink}, inset 0 0 70px ${rgba(c.color, 0.35)}`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 34, display: 'flex', justifyContent: 'center'}}>
        <div style={{width: 186, height: 186, boxSizing: 'border-box', border: `6px solid ${c.color}`, background: 'linear-gradient(180deg,#2a1d3a,#110a1c)', boxShadow: `0 0 0 3px ${C.ink}, 0 0 30px ${rgba(c.color, 0.7)}, inset 0 0 30px ${rgba(c.color, 0.5)}`, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <Item id={c.icon} size={124} style={{filter: `drop-shadow(0 0 14px ${c.color})`}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 14}}>
        <Fancy size={76} fill={`linear-gradient(180deg, ${mix(c.color, '#fff', 0.7)}, ${c.color} 55%, ${mix(c.color, '#000', 0.5)})`}>
          {c.name}
        </Fancy>
        <Fancy size={44} fill={GOLD_GRAD}>
          {c.tier}
        </Fancy>
      </div>
      <div style={{position: 'absolute', left: 24, right: 24, top: 360, height: 4, background: `linear-gradient(90deg, ${rgba(c.color, 0)}, ${c.color} 30%, ${c.color} 70%, ${rgba(c.color, 0)})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 388, display: 'flex', justifyContent: 'center'}}>
        <Label size={36} color="#e6dcf2">
          {c.desc}
        </Label>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12}}>
        <Item id="lapis_lazuli" size={52} />
        <Bold size={44} color="#9fc2ff">{`×${c.cost}`}</Bold>
      </div>
    </div>
  );
};

/** One card slot: back/front with a Y-flip, lift on hover. */
const CardView: FC<{i: number; f: number; hover: number; dim: number}> = ({i, f, hover, dim}) => {
  const drop = prog(f, i * 5, 14, EASE.back);
  const flip = prog(f, FLIP_AT[i], 14, EASE.inOut);
  const rot = flip * 180;
  const flare = f >= FLIP_AT[i] + 6 && f < FLIP_AT[i] + 16 ? 1 - (f - FLIP_AT[i] - 6) / 10 : 0;
  const lift = hover * -26;
  const sc = 1 + hover * 0.08;
  return (
    <div style={{position: 'absolute', left: CXS[i] - CW / 2, top: CY - (1 - drop) * 400 + lift, width: CW, height: CH, perspective: 1800, opacity: clamp01(drop * 3), transform: `scale(${sc})`, filter: `brightness(${1 - dim * 0.4})`}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)`}}>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>
          <Back color={CARDS[i].color} />
        </div>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
          <Front i={i} hot={hover} />
        </div>
      </div>
      {hover > 0.3 && <div style={{position: 'absolute', inset: -10, boxShadow: `0 0 50px ${rgba(CARDS[i].color, 0.8 * hover)}`, pointerEvents: 'none'}} />}
      {flare > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(255,240,200,${0.5 * flare})`, mixBlendMode: 'screen'}} />}
    </div>
  );
};

const Shards: FC<{i: number; f: number; at: number}> = ({i, f, at}) => {
  const t = f - at;
  if (t < 0 || t > 46) return null;
  const COLS = 5;
  const ROWS = 7;
  const tw = CW / COLS;
  const th = CH / ROWS;
  const r = mulberry32(100 + i * 13);
  const dir = i === 0 ? -1 : 1;
  return (
    <div style={{position: 'absolute', left: CXS[i] - CW / 2, top: CY, width: CW, height: CH, transform: 'translateY(-26px) scale(1.08)'}}>
      {Array.from({length: COLS * ROWS}, (_, k) => {
        const c = k % COLS;
        const rr = Math.floor(k / COLS);
        const vx = ((c - (COLS - 1) / 2) * 7 + dir * 10 + (r() - 0.5) * 14) * 1.0;
        const vy = (rr - ROWS / 2) * 4 - 16 - r() * 10;
        const spin = (r() - 0.5) * 40;
        const delay = (Math.abs(c - 2) + Math.abs(rr - 3)) * 0.22;
        const tt = Math.max(0, t - delay);
        const x = vx * tt;
        const y = vy * tt + 0.9 * tt * tt;
        const fade = 1 - clamp01((tt - 18) / 22);
        return (
          <div key={k} style={{position: 'absolute', left: c * tw, top: rr * th, width: tw, height: th, overflow: 'hidden', transform: `translate(${x}px, ${y}px) rotate(${spin * tt * 0.12}deg)`, opacity: fade, boxShadow: `0 0 0 2px ${C.ink}`}}>
            <div style={{position: 'absolute', left: -c * tw, top: -rr * th, width: CW, height: CH}}>
              <Front i={i} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** The sword with an enchant-glint sweep clipped to its pixels. */
const Sword: FC<{size: number; ench: number; f: number}> = ({size, ench, f}) => {
  const url = itemUrl('diamond_sword');
  const sweep = ((f * 3) % 120) / 120;
  const common: CSSProperties = {position: 'absolute', inset: 0, WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', imageRendering: 'pixelated'};
  return (
    <div style={{position: 'relative', width: size, height: size, filter: `drop-shadow(0 0 ${12 + ench * 30}px ${rgba('#b86bff', 0.4 + 0.5 * ench)})`}}>
      <Item id="diamond_sword" size={size} />
      {ench > 0 && (
        <>
          <div style={{...common, background: `linear-gradient(115deg, rgba(120,60,200,0) ${sweep * 160 - 40}%, rgba(210,160,255,${0.9 * ench}) ${sweep * 160 - 20}%, rgba(255,255,255,${ench}) ${sweep * 160 - 12}%, rgba(210,160,255,${0.9 * ench}) ${sweep * 160 - 4}%, rgba(120,60,200,0) ${sweep * 160 + 12}%)`, mixBlendMode: 'screen'}} />
          <div style={{...common, background: `rgba(150,80,230,${0.28 * ench})`, mixBlendMode: 'screen'}} />
        </>
      )}
    </div>
  );
};

const Scene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const hover = (i: number) => {
    let h = 0;
    for (const e of HOVERS) if (e.card === i) h = Math.max(h, prog(f, e.from, 6) * (1 - prog(f, e.to - 2, 6)));
    if (f >= CLICK && i === PICK) h = Math.max(h, 1 - prog(f, FLYAT - 4, 4));
    return h;
  };
  const anyHover = Math.max(hover(0), hover(1), hover(2));
  const picked = f >= CLICK;
  const flyT = clamp01((f - FLYAT) / FLYDUR);
  const e = EASE.inOut(flyT);
  const px0 = CXS[PICK];
  const py0 = CY + CH / 2 - 26;
  const flyX = lerp(px0, WEAPON[0], e);
  const flyY = lerp(py0, WEAPON[1] - 30, e) - Math.sin(flyT * Math.PI) * 120;
  const flyS = lerp(1.08, 0.2, e);
  const ench = f >= ATTACH ? prog(f, ATTACH, 16, EASE.out) : 0;
  const power = Math.round(lerp(236, 261, prog(f, ATTACH + 6, 24, EASE.inOut)));
  const [cx, cy] = (() => {
    const pts: [number, number, number][] = [[0, 1500, 900], [60, 960, 700], [HOVERS[0].from, CXS[0], 420], [HOVERS[1].from, CXS[2], 420], [HOVERS[2].from, CXS[1] + 20, 430], [CLICK + 8, CXS[1] + 20, 430], [CLICK + 30, 1400, 900], [210, 1400, 900]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [f0, x0, y0] = pts[i];
      const [f1, x1, y1] = pts[i + 1];
      if (f >= f0 && f <= f1) {
        const t = EASE.inOut(clamp01((f - f0) / Math.max(1, f1 - f0)));
        return [lerp(x0, x1, t), lerp(y0, y1, t)];
      }
    }
    return [1400, 900];
  })();
  const weaponIn = prog(f, 0, 24, EASE.out);
  const rise = prog(f, ATTACH + 22, 28, EASE.inOut);
  const content = (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 800, background: `radial-gradient(ellipse at 50% 40%, rgba(150,80,255,${0.12 + 0.12 * anyHover + 0.1 * ench}) 0%, rgba(0,0,0,0) 62%)`, mixBlendMode: 'screen'}} />
      {CARDS.map((_, i) => {
        if (picked && i !== PICK) return null;
        if (picked && i === PICK && f >= FLYAT) return null;
        return <CardView key={i} i={i} f={f} hover={hover(i)} dim={anyHover > 0 && hover(i) === 0 ? anyHover : 0} />;
      })}
      {CARDS.map((_, i) => (i !== PICK ? <Shards key={i} i={i} f={f} at={SHATTER} /> : null))}
      {picked && <Burst x={CXS[0]} y={CY + CH / 2} at={SHATTER} count={24} colors={['#4aa8ff', '#bfe2ff', '#fff']} speed={20} life={30} size={12} seed={31} />}
      {picked && <Burst x={CXS[2]} y={CY + CH / 2} at={SHATTER} count={24} colors={['#c88bff', '#e8d0ff', '#fff']} speed={20} life={30} size={12} seed={32} />}
      {/* the chosen card flies to the sword */}
      {f >= FLYAT && f < ATTACH + 1 && (
        <div style={{position: 'absolute', left: flyX - CW / 2, top: flyY - CH / 2, width: CW, height: CH, transform: `scale(${flyS}) rotate(${e * 340}deg)`, filter: `drop-shadow(0 0 30px ${C.gold2})`}}>
          <Front i={PICK} hot={1} />
        </div>
      )}
      {/* sword + altar */}
      <div style={{position: 'absolute', left: WEAPON[0] - 300, top: 905, width: 600, height: 84, backgroundImage: `url(${block('polished_blackstone_bricks')})`, backgroundSize: '84px 84px', ...px, filter: 'brightness(0.6)', boxShadow: `0 0 0 4px ${C.ink}, 0 10px 0 4px rgba(0,0,0,.5), inset 0 8px 0 rgba(255,255,255,.12)`, opacity: weaponIn}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 10, background: GOLD_EDGE}} />
      </div>
      <div style={{position: 'absolute', left: WEAPON[0] - 130, top: lerp(WEAPON[1], 420, rise) - 130 + (1 - weaponIn) * 90 + Math.sin(f / 14) * 8 * (0.4 + rise), width: 260, height: 260, opacity: weaponIn, transform: `scale(${lerp(1, 2.1, rise) * (1 + 0.15 * jiggle((f - ATTACH) / 18, 2, 3) * (f >= ATTACH ? 1 : 0))})`}}>
        <Sword size={260} ench={ench} f={f} />
      </div>
      {/* pinned rune badge */}
      {ench > 0 && (
        <div style={{position: 'absolute', left: lerp(WEAPON[0] + 60, WEAPON[0] + 120, rise), top: lerp(WEAPON[1] + 10, 420 + 60, rise), width: 76, height: 76, boxSizing: 'border-box', border: `5px solid ${C.gold2}`, background: 'linear-gradient(180deg,#3a1d5a,#160a26)', boxShadow: `0 0 0 3px ${C.ink}, 0 0 24px #b86bff`, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${ench * (1 + 0.2 * jiggle((f - ATTACH) / 14, 2, 3))})`}}>
          <Item id={CARDS[PICK].icon} size={48} style={{filter: 'drop-shadow(0 0 8px #ffb531)'}} />
        </div>
      )}
      {rise > 0 && <Beam x={WEAPON[0]} y={905} h={500} w={200} color="#b86bff" p={rise} seed={12} />}
      <Burst x={WEAPON[0]} y={WEAPON[1]} at={ATTACH} count={46} colors={['#e0c8ff', '#b86bff', '#ffe08a', '#fff']} speed={20} life={36} size={12} gravity={0.2} seed={41} />
      <Glint x={WEAPON[0] + 10} y={WEAPON[1] - 20} t={(f - ATTACH) / 18} size={200} color="#f0e0ff" />
      <Flash at={ATTACH} life={8} peak={0.5} color="#e0c8ff" />
      <Flash at={SHATTER} life={5} peak={0.3} color="#fff0c8" />
      {/* labels */}
      {f >= ATTACH + 10 && (
        <>
          <div style={{position: 'absolute', left: 190, top: 780, width: 520, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, opacity: prog(f, ATTACH + 10, 12), transform: `translateX(${(1 - prog(f, ATTACH + 10, 12)) * -60}px)`}}>
            <Label size={36} color="#d9c9a0">
              战力
            </Label>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <Bold size={52} color="#9a8c76">
                236
              </Bold>
              <Bold size={40} color="#6a5a44">
                →
              </Bold>
              <Fancy size={92}>{String(power)}</Fancy>
              <Fancy size={48} fill="linear-gradient(180deg,#e4ffe8,#6bff8a 50%,#1fa04a)" edge="#06180c">
                ▲
              </Fancy>
            </div>
          </div>
          <div style={{position: 'absolute', left: 1210, top: 780, width: 520, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, opacity: prog(f, ATTACH + 16, 12), transform: `translateX(${(1 - prog(f, ATTACH + 16, 12)) * 60}px)`}}>
            <Fancy size={64} fill="linear-gradient(180deg,#fff3c2,#ffb531 55%,#9a5a0a)">
              曙光之刃
            </Fancy>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{padding: '2px 16px', background: 'rgba(184,107,255,.22)', border: '3px solid #c88bff'}}>
                <Label size={24} color="#e0c8ff">
                  已附魔
                </Label>
              </div>
              <Label size={36} color={CARDS[PICK].color}>{`${CARDS[PICK].name} ${CARDS[PICK].tier}`}</Label>
            </div>
          </div>
        </>
      )}
      <Embers count={16} color={['#d8b4ff', '#b86bff', '#ffe08a']} area={[200, 100, 1500, 900]} seed={14} size={8} />
      {/* cursor */}
      {f < CLICK + 40 && <Cursor x={cx} y={cy} press={f >= CLICK - 2 && f < CLICK + 3 ? 1 : 0} />}
      {/* sfx */}
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={i * 5 + 4} src={mcSound('dig/stone2')} volume={0.25} rate={1.2 + i * 0.1} />
      ))}
      {FLIP_AT.map((a, i) => (
        <Sfx key={'f' + i} at={a + 6} src={mcSound('ui/loom/take_result1')} volume={0.4} rate={1.2 + i * 0.12} />
      ))}
      {HOVERS.map((h, i) => (
        <Sfx key={'h' + i} at={h.from} src={mcSound('random/click')} volume={0.2} rate={1.6} />
      ))}
      <Sfx at={CLICK} src={mcSound('random/click')} volume={0.5} />
      <Sfx at={SHATTER} src={mcSound('dig/stone4')} volume={0.45} rate={1.4} />
      <Sfx at={SHATTER + 2} src={mcSound('dig/gravel1')} volume={0.4} rate={1.2} />
      <Sfx at={ATTACH} src={mcSound('random/levelup')} volume={0.5} rate={1.1} />
      <Sfx at={ATTACH} src={mcSound('block/smithing_table/smithing_table1')} volume={0.4} />
    </>
  );
  void snap;
  void (null as unknown as ReactNode);
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <DungeonBg dim={0.45} warm={0.7} vignette={0.9} embers={false}>
      {content}
    </DungeonBg>
  );
};

export const EnchantChoose = Scene;
