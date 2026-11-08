import type {FC} from 'react';
import {useCurrentFrame} from 'remotion';
import {Flash, LightRays, PixelBurst, Shockwave} from '../../../mc/Fx';
import {EASE} from '../../../mc/theme';
import {ORE, OreProgress} from '../../../mg/Ore';
import {ItemImg, mcSound} from '../../../reel/kit';
import {Bolt, Confetti, H, Halftone, Icon, PX, Shine, Slab, Sparkles, Stage, back, bold, lerp, pr, spring, Sfx} from './ui';

/**
 * Ingredient checklist card (transparent overlay): a header with a collection counter, rows (icon + name + source + count)
 * pop in one by one, then get ticked off in turn; when the last tick lands the card stamps "材料齐全" and the target item on the
 * right lights up with a burst.
 * Props: title, rows = [{id (item id), name, count, src}], result = {id, name, line},
 *   counterLabel (header counter, `{done}` / `{total}` are substituted), stampText (stamp wording), resultLabel (small caption above the result),
 *   dim (backdrop darkness multiplier), frames (total length; default 250 for 5 rows, +16 per extra row, -16 per missing row).
 */

export const INGREDIENT_FRAMES = 250;

export type IngredientRow = {id: string; name: string; count: number; src: string};
const ROWS: IngredientRow[] = [
  {id: 'diamond', name: '钻石', count: 3, src: '深层矿洞 · Y -58'},
  {id: 'stick', name: '木棍', count: 2, src: '橡木 → 木板 → 木棍'},
  {id: 'iron_ingot', name: '铁锭', count: 4, src: '熔炼铁矿石'},
  {id: 'redstone', name: '红石粉', count: 8, src: '红石矿 · Y -59'},
  {id: 'book', name: '书', count: 1, src: '村庄图书馆'},
];

export const IngredientList: FC<{bg?: boolean; title?: string; rows?: IngredientRow[]; result?: {id: string; name: string; line: string}; counterLabel?: string; stampText?: string; resultLabel?: string; dim?: number; frames?: number}> = ({
  bg,
  title = '材料清单',
  rows = ROWS,
  result = {id: 'diamond_pickaxe', name: '钻石镐', line: '挖掘速度 8 · 耐久 1561'},
  counterLabel = '已备齐 {done} / {total}',
  stampText = '材料齐全！',
  resultLabel = '合成目标',
  dim = 1,
  frames,
}) => {
  const f = useCurrentFrame();
  const N = frames ?? INGREDIENT_FRAMES + (rows.length - 5) * 16;
  const outP = pr(f, N - 24, 20, EASE.in);
  const inP = back(pr(f, 0, 16, (t) => t));
  const PW = 1240;
  const RH = 132;
  const PH = 150 + rows.length * RH + 30;
  const PX0 = 120;
  const PY0 = Math.round((H - PH) / 2);
  const rowAt = (i: number) => 22 + i * 10;
  const tickAt = (i: number) => 104 + i * 16;
  const done = rows.filter((_, i) => f >= tickAt(i) + 4).length;
  const allAt = tickAt(rows.length - 1) + 14;
  const ready = f >= allAt;
  const stamp = pr(f, allAt, 10, (t) => t * t);
  const stampScale = f < allAt ? 0 : lerp(3, 1, stamp) + Math.max(0, 0.1 * Math.sin((f - allAt) / 2.5) * Math.exp(-(f - allAt) / 12));
  const resultIn = back(pr(f, 40, 18, (t) => t));
  const RX = 1450;
  const RW = 380;
  const RY = PY0 + 100;
  const RHh = PH - 200;
  const bright = ready ? 1 : lerp(0.12, 0.45, done / rows.length);
  const resCx = RX + RW / 2;
  const resCy = RY + 330;
  return (
    <Stage bg={bg}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(6,8,18,${0.55 * dim * pr(f, 0, 12) * (1 - outP)})`}} />
      {ready && <LightRays x={resCx} y={resCy} size={1100} opacity={0.3 * (1 - outP)} color="255,215,100" rays={12} />}
      {/* list panel */}
      <div style={{position: 'absolute', left: PX0, top: PY0, width: PW, height: PH, transform: `translateX(${(1 - Math.min(1, inP)) * -1400 - outP * 1400}px) scale(${0.96 + 0.04 * Math.min(1, inP)})`}}>
        <Slab w={PW} h={PH} tone="panel_raised" shadow={16}>
          <Halftone color="#000" opacity={0.12} />
          <Bolt x={28} y={28} />
          <Bolt x={PW - 28} y={28} />
          <Bolt x={28} y={PH - 28} />
          <Bolt x={PW - 28} y={PH - 28} />
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <Shine p={pr(f, 12, 26, (t) => t)} />
          </div>
          {/* header */}
          <div style={{position: 'absolute', left: 52, top: 30, display: 'flex', alignItems: 'center', gap: 24}}>
            <Icon name="check" px={8} color="#6cc349" outline="#000" />
            <PX size={72} color="#fff">{title}</PX>
          </div>
          <div style={{position: 'absolute', right: 52, top: 36, display: 'flex', alignItems: 'center', gap: 20}}>
            <PX size={48} color={ready ? '#6cff8a' : ORE.dim}>{counterLabel.replace('{done}', String(done)).replace('{total}', String(rows.length))}</PX>
          </div>
          <div style={{position: 'absolute', left: 52, right: 52, top: 112, height: 12, background: '#0c0c0e', boxShadow: '0 0 0 4px #000'}}>
            <div style={{width: `${(done / rows.length) * 100}%`, height: '100%', background: ready ? '#6cc349' : ORE.gold, transition: 'none', boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.4)'}} />
          </div>
        </Slab>
        {/* rows */}
        {rows.map((r, i) => {
          const t = pr(f, rowAt(i), 18, (v) => v);
          const slide = (1 - spring(t, 7, 4.8)) * -900;
          const pop = back(pr(f, rowAt(i) + 4, 12, (v) => v));
          const tk = pr(f, tickAt(i), 12, (v) => v);
          const checked = f >= tickAt(i) + 4;
          const flash = Math.max(0, 1 - (f - tickAt(i)) / 14) * (f >= tickAt(i) ? 1 : 0);
          return (
            <div key={r.id} style={{position: 'absolute', left: 40, top: 150 + i * RH, width: PW - 80, height: RH - 16, transform: `translateX(${slide}px)`, opacity: t > 0 ? 1 : 0}}>
              <div style={{position: 'absolute', inset: 0, background: checked ? '#1f3319' : '#1e1e1f', boxShadow: `0 0 0 4px #000, inset 0 6px 0 rgba(255,255,255,0.07), 0 8px 0 4px rgba(0,0,0,0.4)`}} />
              {flash > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(120,255,140,${flash * 0.45})`}} />}
              <div style={{position: 'absolute', left: 12, top: 10, width: 96, height: 96, transform: `scale(${pop})`}}>
                <Slab w={96} h={96} tone="panel_glass" shadow={0} style={{boxShadow: '0 0 0 4px #000'}}>
                  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <ItemImg id={r.id} size={64} />
                  </div>
                </Slab>
              </div>
              <div style={{position: 'absolute', left: 136, top: 8}}>
                <PX size={60} color={checked ? '#c8ffc0' : '#fff'} shadow="rgba(0,0,0,0.6)">{r.name}</PX>
              </div>
              <div style={{position: 'absolute', left: 136, top: 72}}>
                <PX size={36} color={ORE.dim}>{r.src}</PX>
              </div>
              <div style={{position: 'absolute', right: 160, top: 14, transform: `scale(${checked ? 1 + 0.2 * Math.max(0, 1 - (f - tickAt(i) - 4) / 8) : 1})`, transformOrigin: '100% 50%'}}>
                <PX size={72} color={ORE.gold} shadow="rgba(0,0,0,0.6)">{`×${r.count}`}</PX>
              </div>
              {/* checkbox */}
              <div style={{position: 'absolute', right: 20, top: 14, width: 88, height: 88, background: checked ? '#3c8527' : '#0c0c0e', boxShadow: `0 0 0 4px #000, inset 0 6px 0 ${checked ? '#6cc349' : 'rgba(255,255,255,0.08)'}`, transform: `scale(${checked ? 1 + 0.18 * Math.max(0, 1 - (f - tickAt(i) - 4) / 8) : 1})`}}>
                {tk > 0 && (
                  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${back(tk)}) rotate(${(1 - tk) * -30}deg)`}}>
                    <Icon name="checkWhite" px={10} outline="#000" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* arrow */}
      <div style={{position: 'absolute', left: PX0 + PW + 20, top: PY0 + PH / 2 - 50, opacity: pr(f, 48, 10) * (1 - outP), transform: `translateX(${Math.sin(f / 5) * 8}px) scale(${ready ? 1.3 : 1})`}}>
        <Icon name="right" px={14} color={ready ? '#6cff8a' : '#8c8d90'} outline="#000" />
      </div>
      {/* result card */}
      <div style={{position: 'absolute', left: RX, top: RY, width: RW, height: RHh, transform: `translateX(${(1 - Math.min(1, resultIn)) * 700 + outP * 700}px) scale(${1 + (ready ? 0.03 * Math.sin(f / 6) : 0)})`}}>
        <Slab w={RW} h={RHh} tone="panel_glass" shadow={14} style={{boxShadow: ready ? '0 0 0 4px #f8af2b, 0 0 60px 8px rgba(248,175,43,0.55), 0 14px 0 4px rgba(0,0,0,0.5)' : undefined}}>
          <Halftone color={ready ? '#f8af2b' : '#000'} opacity={0.12} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 24, display: 'flex', justifyContent: 'center'}}>
            <PX size={36} color={ORE.dim}>{resultLabel}</PX>
          </div>
          <div style={{position: 'absolute', left: (RW - 260) / 2, top: 90, width: 260, height: 260}}>
            <Slab w={260} h={260} tone="panel" shadow={0} style={{boxShadow: '0 0 0 4px #000'}}>
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${ready ? Math.sin(f / 8) * 8 : 0}px) scale(${ready ? 1 + 0.12 * Math.max(0, 1 - (f - allAt) / 14) : 1})`}}>
                <ItemImg id={result.id} size={192} style={{filter: `brightness(${bright})${ready ? '' : ' grayscale(0.7)'}`}} />
              </div>
              {!ready && (
                <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <PX size={96} color="rgba(255,255,255,0.35)" shadow={false}>?</PX>
                </div>
              )}
              <Shine p={ready ? pr(f, allAt + 2, 22, (t) => t) : 0} strength={1.4} />
            </Slab>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 372, display: 'flex', justifyContent: 'center'}}>
            <PX size={60} color={ready ? '#55ffff' : ORE.faint} shadow="rgba(0,0,0,0.6)">{ready ? result.name : '？？？'}</PX>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 450, display: 'flex', justifyContent: 'center', opacity: ready ? pr(f, allAt + 6, 10) : 0}}>
            <PX size={36} color={ORE.dim}>{result.line}</PX>
          </div>
          <div style={{position: 'absolute', left: 36, right: 36, bottom: 40}}>
            <OreProgress value={done / rows.length} width={RW - 72} color={ready ? 'green' : 'gold'} />
          </div>
        </Slab>
      </div>
      {/* ready stamp: slams onto the middle of the list, then slides up to rest above the result card (never over the list title) */}
      {f >= allAt &&
        (() => {
          const SW = 440;
          const SH = 96;
          const rest = {x: RX + RW / 2 - 24, y: RY - 64};
          const u = pr(f, allAt + 26, 14, EASE.inOut);
          const cx = lerp(PX0 + PW / 2, rest.x, u);
          const cy = lerp(H / 2, rest.y, u);
          const sc = lerp(stampScale * 1.8, 1, u);
          return (
            <div style={{position: 'absolute', left: cx - SW / 2, top: cy - SH / 2, width: SW, height: SH, transform: `scale(${sc}) rotate(-4deg)`, opacity: 1 - outP}}>
              <div style={{position: 'absolute', inset: 0, background: '#3c8527', boxShadow: '0 0 0 6px #000, inset 0 8px 0 #6cc349, inset 0 -8px 0 #25591a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
                <Icon name="checkWhite" px={6} outline="#000" />
                <PX size={48} color="#fff" shadow={false} style={{textShadow: bold(3, '#000', 3, '#000')}}>{stampText}</PX>
              </div>
              <Shine p={pr(f, allAt + 4, 20, (t) => t)} />
            </div>
          );
        })()}
      {rows.map((_, i) => (
        <div key={i}>
          <PixelBurst x={PX0 + 40 + PW - 80 - 64} y={PY0 + 150 + i * RH + 58} at={tickAt(i) + 3} count={14} colors={['#6cff8a', '#a6ff9a', '#fff']} speed={12} life={20} size={10} seed={i + 90} />
          <Sfx at={rowAt(i)} src={mcSound('random/pop')} volume={0.28} rate={0.9 + i * 0.07} />
          <Sfx at={tickAt(i)} src={mcSound('random/orb')} volume={0.3} rate={0.9 + i * 0.12} />
        </div>
      ))}
      <Sfx at={4} src={mcSound('ui/toast/in')} volume={0.35} />
      <Sfx at={allAt} src={mcSound('random/anvil_land')} volume={0.4} rate={1.3} />
      <Sfx at={allAt + 2} src={mcSound('random/levelup')} volume={0.45} />
      <Sfx at={N - 24} src={mcSound('ui/toast/out')} volume={0.25} />
      <PixelBurst x={resCx} y={resCy - 20} at={allAt} count={50} colors={['#f8af2b', '#ffe08a', '#fff', '#55ffff']} speed={26} life={34} size={14} seed={5} />
      <Shockwave x={resCx} y={resCy - 20} at={allAt} color="#f8af2b" maxR={600} life={20} width={16} />
      <Flash at={allAt} life={6} peak={0.28} />
      <Confetti at={allAt + 2} life={70} count={60} colors={['#f8af2b', '#ffe08a', '#6cc349', '#55ffff', '#fff']} seed={15} size={14} />
      <Sparkles x={RX} y={RY} w={RW} h={RHh} count={ready ? 8 : 0} seed={9} px={5} color="#ffe08a" at={allAt} />
    </Stage>
  );
};
