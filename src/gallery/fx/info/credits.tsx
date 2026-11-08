import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, clamp01, mulberry32} from '../../../mc/theme';
import {ORE, StoneTitle} from '../../../mg/Ore';
import {ItemImg, mcSound} from '../../../reel/kit';
import {FLAT, PixelSprite} from '../../flat';
import {Bracket, H, Icon, PX, Stage, W, pr, Sfx} from './ui';

/**
 * Credits roll (transparent overlay): two-column role / name lines scroll up over a darkened, starry backdrop.
 * Pixel item lanes scroll at the sides at a different speed (parallax), three star layers drift, the line crossing the middle
 * is spotlighted, and the roll decelerates to rest on the closing "谢谢观看".
 * Props: sections = [{title, rows: [[role, name]] | names: string[] | tiers: [{label, icon, color, names}]}], closing (text),
 *   heading (title on the opening card, default 制作名单), headingSub (small line under it, default C R E D I T S), farewell (line under the closing word),
 *   laneItems (item ids scrolling in the two side lanes), dim (darkness of the dim backdrop, 0..1+, default 1), frames (total length; the roll ends at frames - 40).
 */

export const CREDITS_FRAMES = 480;

export type CreditSection = {title: string; rows?: [string, string][]; names?: string[]; tiers?: {label: string; icon: string; color: string; names: string[]}[]};
const SECTIONS: CreditSection[] = [
  {title: '出品', rows: [['导演', '红石阿明'], ['制片', '小蓝同学'], ['监制', '优易库工作室']]},
  {title: '制作', rows: [['策划', '诺尔'], ['美术', '祖里'], ['动画', '凯'], ['剪辑', '艾利克斯'], ['配乐', '史蒂夫'], ['音效', '末影龙']]},
  {title: '特别鸣谢', names: ['苦力怕', '僵尸村民', '小白猫', '铁傀儡', '末影人', '所有弹幕的你']},
  {
    title: '赞助名单',
    tiers: [
      {label: '钻石赞助', icon: 'diamond', color: '#55ffff', names: ['星野', 'BlockMaster', '夜航船']},
      {label: '黄金赞助', icon: 'gold_ingot', color: '#ffd35a', names: ['小南瓜', 'Pixel_Fox', '三七', '雨后']},
    ],
  },
];

type Item = {y: number; h: number; render: (spot: number) => ReactNode; sfx?: boolean};

const LANE_ITEMS = ['diamond', 'emerald', 'gold_ingot', 'redstone', 'lapis_lazuli', 'amethyst_shard', 'nether_star', 'quartz', 'iron_ingot', 'coal', 'echo_shard', 'totem_of_undying'];

export const CreditsRoll: FC<{bg?: boolean; sections?: CreditSection[]; closing?: string; heading?: string; headingSub?: string; farewell?: string; laneItems?: string[]; dim?: number; frames?: number}> = ({
  bg,
  sections = SECTIONS,
  closing = '谢谢观看',
  heading = '制作名单',
  headingSub = 'C R E D I T S',
  farewell = '下期再见 · 记得三连',
  laneItems = LANE_ITEMS,
  dim = 1,
  frames = CREDITS_FRAMES,
}) => {
  const f = useCurrentFrame();
  const N = frames;
  // ---- layout in content space
  const items: Item[] = [];
  let y = 0;
  items.push({
    y,
    h: 420,
    render: () => (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}}>
        <StoneTitle size={168}>{heading}</StoneTitle>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <PixelSprite sprite="star" px={5} outline={FLAT.ink} />
          <PX size={48} color={ORE.gold}>{headingSub}</PX>
          <PixelSprite sprite="star" px={5} outline={FLAT.ink} />
        </div>
      </div>
    ),
  });
  y += 420 + 80;
  sections.forEach((sec) => {
    const hdr = y;
    items.push({
      y: hdr,
      h: 120,
      sfx: true,
      render: () => (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32}}>
          <div style={{width: 200, height: 8, background: ORE.gold, boxShadow: '0 0 0 4px #000'}} />
          <PX size={72} color={ORE.gold} shadow="rgba(0,0,0,0.7)">{sec.title}</PX>
          <div style={{width: 200, height: 8, background: ORE.gold, boxShadow: '0 0 0 4px #000'}} />
        </div>
      ),
    });
    y += 120 + 30;
    (sec.rows ?? []).forEach(([role, name]) => {
      items.push({
        y,
        h: 96,
        render: (spot) => (
          <div style={{display: 'flex', alignItems: 'center', width: 1100}}>
            <div style={{width: 500, textAlign: 'right'}}>
              <PX size={48} color={spot > 0.4 ? '#ffe08a' : ORE.dim}>{role}</PX>
            </div>
            <div style={{width: 100, display: 'flex', justifyContent: 'center'}}>
              <div style={{width: 16, height: 16, background: ORE.gold, boxShadow: '0 0 0 4px #000', transform: 'rotate(45deg)'}} />
            </div>
            <div style={{width: 500}}>
              <PX size={60} color="#fff" shadow="rgba(0,0,0,0.7)">{name}</PX>
            </div>
          </div>
        ),
      });
      y += 96;
    });
    if (sec.names) {
      for (let i = 0; i < sec.names.length; i += 2) {
        const pair = sec.names.slice(i, i + 2);
        items.push({
          y,
          h: 96,
          render: () => (
            <div style={{display: 'flex', width: 1100}}>
              {pair.map((n, k) => (
                <div key={k} style={{width: 550, textAlign: 'center'}}>
                  <PX size={60} color="#fff" shadow="rgba(0,0,0,0.7)">{n}</PX>
                </div>
              ))}
            </div>
          ),
        });
        y += 96;
      }
    }
    (sec.tiers ?? []).forEach((tier) => {
      items.push({
        y,
        h: 100,
        render: () => (
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div style={{height: 76, padding: '0 36px', display: 'flex', alignItems: 'center', gap: 22, background: '#1e1e1f', boxShadow: `0 0 0 4px #000, inset 0 -6px 0 ${tier.color}`}}>
              <ItemImg id={tier.icon} size={56} />
              <PX size={48} color={tier.color}>{tier.label}</PX>
            </div>
          </div>
        ),
      });
      y += 100 + 6;
      for (let i = 0; i < tier.names.length; i += 2) {
        const pair = tier.names.slice(i, i + 2);
        items.push({
          y,
          h: 90,
          render: () => (
            <div style={{display: 'flex', width: 1100}}>
              {pair.map((n, k) => (
                <div key={k} style={{width: 550, textAlign: 'center'}}>
                  <PX size={60} color={tier.color} shadow="rgba(0,0,0,0.7)">{n}</PX>
                </div>
              ))}
            </div>
          ),
        });
        y += 90;
      }
      y += 24;
    });
    y += 90;
  });
  const endY = y + 120;
  items.push({
    y: endY,
    h: 372,
    render: (spot) => (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: `scale(${1 + spot * 0.08})`}}>
        <div style={{display: 'flex', gap: 28, alignItems: 'center'}}>
          <PixelSprite sprite="heart" px={8} outline={FLAT.ink} style={{transform: `translateY(${Math.sin(f / 6) * 6}px)`}} />
          <PixelSprite sprite="star" px={8} outline={FLAT.ink} style={{transform: `translateY(${Math.sin(f / 6 + 1) * 6}px)`}} />
          <PixelSprite sprite="heart" px={8} outline={FLAT.ink} style={{transform: `translateY(${Math.sin(f / 6 + 2) * 6}px)`}} />
        </div>
        <StoneTitle size={168}>{closing}</StoneTitle>
        <PX size={36} color={ORE.dim} style={{marginTop: 72}}>{farewell}</PX>
      </div>
    ),
  });
  const lastCenter = endY + 150 + 36;
  const S = 1080 + 40 + lastCenter - 540;
  // ---- scroll curve: constant speed, then decelerate to rest
  const a = 0.86;
  const v = S / (a + (1 - a) / 2);
  const total = N - 40;
  const posAt = (fr: number) => {
    const u = clamp01((fr - 6) / (total - 6));
    return u <= a ? v * u : v * a + v * (u - a) - (v * (u - a) * (u - a)) / (2 * (1 - a));
  };
  const pos = posAt(f);
  const screenY = (cy: number) => 1080 + 40 - pos + cy;
  const inP = pr(f, 0, 16);
  const outP = pr(f, N - 16, 14, EASE.in);
  const vis = inP * (1 - outP);
  const rnd = mulberry32(5);
  const stars = Array.from({length: 76}, (_, i) => ({x: rnd() * W, y: rnd() * H, layer: i % 3, ph: rnd() * 60, s: 1 + Math.floor(rnd() * 3)}));
  const sfxFrames = items.filter((it) => it.sfx).map((it) => {
    for (let fr = 0; fr < N; fr++) if (1080 + 40 - posAt(fr) + it.y + it.h / 2 <= 600) return fr;
    return -1;
  });
  return (
    <Stage bg={bg}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(10,12,34,${Math.min(1, 0.72 * dim) * vis}) 0%, rgba(3,4,14,${Math.min(1, 0.92 * dim) * vis}) 100%)`}} />
      {/* stars in three parallax layers */}
      {stars.map((s, i) => {
        const sp = [0.08, 0.18, 0.34][s.layer];
        const yy = (((s.y - pos * sp) % H) + H) % H;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin((f + s.ph) / (14 + s.layer * 6)));
        const size = (s.layer + 1) * 4;
        return s.layer === 2 && s.s > 1 ? (
          <div key={i} style={{position: 'absolute', left: s.x, top: yy, opacity: tw * vis, transform: 'translate(-50%,-50%)'}}>
            <PixelSprite sprite={{rows: ['..W..', '..W..', 'WWWWW', '..W..', '..W..'], palette: {W: i % 2 ? '#ffe08a' : '#fff'}}} px={4} />
          </div>
        ) : (
          <div key={i} style={{position: 'absolute', left: s.x, top: yy, width: size, height: size, background: i % 5 === 0 ? '#ffe08a' : '#cfd8ff', opacity: tw * vis * (0.4 + s.layer * 0.25)}} />
        );
      })}
      {/* shooting stars */}
      {[0, 1].map((k) => {
        const t = ((f + k * 140) % 220) / 40;
        if (t > 1) return null;
        return <div key={k} style={{position: 'absolute', left: 300 + k * 900 + t * 500, top: 120 + k * 80 + t * 300, width: 140 * (1 - t * 0.4), height: 6, background: 'linear-gradient(90deg, rgba(255,255,255,0), #fff)', transform: 'rotate(31deg)', opacity: vis * (1 - t)}} />;
      })}
      {/* side lanes */}
      {[0, 1].map((side) => {
        const laneX = side ? W - 300 : 140;
        const spd = side ? 0.75 : 1.2;
        const gap = 160;
        const total2 = laneItems.length * gap;
        return (
          <div key={side} style={{position: 'absolute', left: laneX, top: 0, width: 160, height: H, opacity: vis, WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%)'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: 'rgba(255,255,255,0.18)'}} />
            <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, background: 'rgba(255,255,255,0.18)'}} />
            {laneItems.map((id, i) => {
              const yy = ((((i * gap + (side ? 80 : 0)) - pos * spd) % total2) + total2) % total2 - 120;
              return (
                <div key={id + i} style={{position: 'absolute', left: 32, top: yy, width: 96, height: 96, opacity: 0.85}}>
                  <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', boxShadow: '0 0 0 4px #000, inset 0 4px 0 rgba(255,255,255,0.12)'}} />
                  <div style={{position: 'absolute', left: 16, top: 16}}>
                    <ItemImg id={id} size={64} style={{transform: `translateY(${Math.sin(f / 10 + i) * 4}px)`}} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {/* centre roll */}
      <div style={{position: 'absolute', inset: 0, opacity: vis, WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 16%, #000 84%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0, #000 16%, #000 84%, transparent 100%)'}}>
        {items.map((it, i) => {
          const sy = screenY(it.y);
          if (sy > H + 200 || sy + it.h < -200) return null;
          const d = Math.abs(sy + it.h / 2 - 540);
          const spot = clamp01(1 - d / 280);
          return (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: sy, height: it.h, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + spot * 0.06})`, filter: `brightness(${0.8 + spot * 0.3})`}}>
              {it.render(spot)}
            </div>
          );
        })}
      </div>
      {/* spotlight bar */}
      <div style={{position: 'absolute', left: 330, right: 330, top: 540 - 66, height: 132, opacity: 0.12 * vis, background: 'linear-gradient(90deg, transparent, #ffe08a, transparent)'}} />
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <Bracket key={c} corner={c} inset={28} size={72} thick={8} color={ORE.gold} style={{opacity: vis}} />
      ))}
      <div style={{position: 'absolute', left: 28, right: 28, top: 28, bottom: 28, border: '4px solid rgba(255,255,255,0.14)', opacity: vis}} />
      <div style={{position: 'absolute', left: W / 2 - 220, top: 44, opacity: vis * 0.9}}>
        <Icon name="dot" px={4} color={ORE.gold} />
      </div>
      <Sfx at={2} src={mcSound('ui/toast/in')} volume={0.3} rate={0.8} />
      <Sfx at={4} src={mcSound('random/levelup')} volume={0.2} rate={0.8} />
      {sfxFrames.map((fr, i) => (fr >= 0 ? <Sfx key={i} at={fr} src={mcSound('random/orb')} volume={0.18} rate={0.8 + i * 0.1} /> : null))}
      <Sfx at={total - 4} src={mcSound('random/levelup')} volume={0.32} rate={1.2} />
      <Sfx at={N - 16} src={mcSound('ui/toast/out')} volume={0.25} />
    </Stage>
  );
};
