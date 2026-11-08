import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {tex} from '../../../mc/assets';
import {Crop} from '../../mob';
import {Odometer} from './emerald';
import {Bold, Brackets, Burst, C, Cursor, DSlot, DungeonBg, EASE, Fancy, Flash, Frame, GOLD_GRAD, Glint, Item, Label, RARITY, clamp01, jiggle, lerp, mix, mulberry32, prog, rgba, type RarityKey} from './common';
import {Ink} from './quest';

/**
 * rpg-merchant-buy: a merchant screen. Villager portrait with a speech bubble, a 3x3 goods grid with emerald prices, the player's
 * bag and emerald balance on the right. The cursor hovers a good (card lifts, detail panel fills in), clicks (card presses down,
 * emeralds fly out of the balance, the odometer counts down, the item arcs into the bag with a bounce and glint). Three purchases
 * succeed; the fourth good is too expensive: the price flashes red and the card shakes.
 * Props: `bg` - dungeon backdrop (Demo); Layer = UI only.
 * Edit GOODS (price / rarity), START (balance) and BUYS (card index + click frame).
 */

export const MERCHANT_FRAMES = 210;

type Good = {id: string; name: string; rar: RarityKey; price: number; sub: string; qty?: number};
const GOODS: Good[] = [
  {id: 'iron_sword', name: '铁质长剑', rar: 'rare', price: 24, sub: '战力 78'},
  {id: 'bow', name: '猎魂之弓', rar: 'common', price: 18, sub: '战力 64'},
  {id: 'iron_chestplate', name: '守卫胸甲', rar: 'rare', price: 36, sub: '护甲 +14'},
  {id: 'golden_apple', name: '金苹果', rar: 'common', price: 8, sub: '恢复 40% 生命', qty: 3},
  {id: 'firework_rocket', name: '烟火箭筒', rar: 'rare', price: 45, sub: '神器 · 冷却 12s'},
  {id: 'diamond_sword', name: '曙光之刃', rar: 'unique', price: 120, sub: '战力 236'},
  {id: 'potion', name: '治疗药水', rar: 'common', price: 6, sub: '恢复 60 生命'},
  {id: 'arrow', name: '箭矢', rar: 'common', price: 5, sub: '数量 ×32', qty: 32},
  {id: 'enchanted_book', name: '附魔书', rar: 'rare', price: 60, sub: '锋利 III'},
];
const START = 150;
const BUYS: {card: number; at: number}[] = [
  {card: 2, at: 62},
  {card: 3, at: 100},
  {card: 4, at: 138},
  {card: 5, at: 176}, // too expensive
];
const FLY = 22;

// geometry
const CX0 = 600;
const CY0 = 210;
const CW = 196;
const CH = 236;
const CG = 24;
const cardPos = (i: number): [number, number] => [CX0 + (i % 3) * (CW + CG), CY0 + Math.floor(i / 3) * (CH + CG)];
const cardC = (i: number): [number, number] => [cardPos(i)[0] + CW / 2, cardPos(i)[1] + CH / 2 - 20];
const BAG_X = 1300;
const BAG_Y = 520;
const BS = 100;
const bagC = (k: number): [number, number] => [BAG_X + (k % 4) * (BS + 12) + BS / 2, BAG_Y + Math.floor(k / 4) * (BS + 12) + BS / 2];
const BAG_PRE: (string | null)[] = ['bread', null, 'coal', null, null, 'stone_sword', null, null, null, null, null, null, null, null, null, null];
const BAL_C: [number, number] = [1440, 250];

const priceNow = (f: number) => START - BUYS.slice(0, 3).reduce((s, b, i) => s + GOODS[b.card].price * prog(f, b.at + 2, 14, EASE.inOut), 0);

const cursorPts: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [[0, 1100, 980]];
  BUYS.forEach((b) => {
    const [x, y] = cardC(b.card);
    pts.push([b.at - 26, x + 20, y + 30]);
    pts.push([b.at + 6, x + 20, y + 30]);
  });
  pts.push([210, 1000, 1000]);
  return pts;
})();
const cursorAt = (f: number): [number, number] => {
  for (let i = 0; i < cursorPts.length - 1; i++) {
    const [f0, x0, y0] = cursorPts[i];
    const [f1, x1, y1] = cursorPts[i + 1];
    if (f >= f0 && f <= f1) {
      const t = EASE.inOut(clamp01((f - f0) / Math.max(1, f1 - f0)));
      return [lerp(x0, x1, t), lerp(y0, y1, t)];
    }
  }
  const l = cursorPts[cursorPts.length - 1];
  return [l[1], l[2]];
};

const Merchant: FC<{talk: string; nod: number}> = ({talk, nod}) => {
  const src = tex('entity/villager/villager.png');
  return (
    <div style={{position: 'relative', width: 370, height: 440}}>
      <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: '6px solid #6a5538', boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 70px rgba(0,0,0,.8)`, background: 'radial-gradient(ellipse at 50% 38%, rgba(255,170,70,.35), rgba(30,18,10,.95) 72%)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 97, top: 56 + nod * 8}}>
          <Crop src={src} sheet={[64, 64]} rect={[8, 8, 8, 10]} scale={22} style={{position: 'relative'}}>
            <Crop src={src} sheet={[64, 64]} rect={[25, 1, 2, 4]} scale={22} style={{position: 'absolute', left: 3 * 22, top: 5 * 22}} />
          </Crop>
          <Crop src={src} sheet={[64, 64]} rect={[6, 44, 8, 20]} scale={22} style={{marginTop: 0}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, background: 'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0))'}} />
      </div>
      <div style={{position: 'absolute', left: 24, right: 24, bottom: 22, height: 76, boxSizing: 'border-box', border: `5px solid ${C.ink}`, background: 'linear-gradient(180deg,#f4e6b8,#d9bb7c)', boxShadow: '0 6px 0 rgba(0,0,0,.4)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <Ink size={36}>{talk}</Ink>
      </div>
    </div>
  );
};

const Card: FC<{i: number; f: number; sold: number; hover: boolean; deny: number; press: number}> = ({i, f, sold, hover, deny, press}) => {
  const g = GOODS[i];
  const col = RARITY[g.rar].color;
  const inn = prog(f, 8 + i * 3, 12, EASE.back);
  const [x, y] = cardPos(i);
  const r = mulberry32(f * 3 + i);
  const jx = deny > 0 ? (r() * 2 - 1) * 12 * deny : 0;
  const lift = hover ? -8 : 0;
  const canAfford = priceNow(f) >= g.price;
  return (
    <div style={{position: 'absolute', left: x + jx, top: y + lift + press * 10, width: CW, height: CH, transform: `scale(${inn * (hover ? 1.05 : 1) * (1 - press * 0.05)})`, opacity: clamp01(inn * 2)}}>
      <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `6px solid ${hover ? C.gold2 : col}`, background: `linear-gradient(180deg, ${rgba(col, 0.2)} 0%, #1a110b 45%, #0f0a07 100%)`, boxShadow: `0 0 0 4px ${C.ink}, 0 ${hover ? 14 : 8}px 0 4px rgba(0,0,0,.45), 0 0 ${hover ? 34 : g.rar === 'unique' ? 22 : 0}px ${hover ? C.gold2 : col}`}} />
      {hover && <Brackets w={CW} h={CH} color={C.gold3} len={26} th={6} m={-8} />}
      <div style={{position: 'absolute', left: 0, right: 0, top: 22, display: 'flex', justifyContent: 'center', filter: sold > 0 ? 'grayscale(1) brightness(0.6)' : g.rar === 'unique' ? 'drop-shadow(0 0 12px #ffb531)' : undefined}}>
        <Item id={g.id} size={108} />
        {g.qty && g.qty > 1 && (
          <div style={{position: 'absolute', right: 30, bottom: -6}}>
            <Bold size={36}>{`×${g.qty}`}</Bold>
          </div>
        )}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 144, display: 'flex', justifyContent: 'center'}}>
        <Label size={24} color={col}>
          {g.name}
        </Label>
      </div>
      <div style={{position: 'absolute', left: 14, right: 14, bottom: 14, height: 56, boxSizing: 'border-box', background: C.ink, border: `4px solid ${deny > 0 ? '#e0432f' : '#4a3b28'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10}}>
        <Item id="emerald" size={40} />
        <Bold size={40} color={deny > 0 || (!canAfford && f > 150 && i === 5) ? '#ff6a5a' : '#bfffd0'}>
          {String(g.price)}
        </Bold>
      </div>
      {sold > 0 && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,.4)'}}>
          <div style={{transform: `rotate(-12deg) scale(${1 + 0.2 * jiggle(sold, 2, 4)})`, padding: '0 16px', border: `5px solid ${C.gold2}`, background: 'rgba(20,12,6,.85)'}}>
            <Label size={36} color={C.gold3}>
              已购
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

const Scene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const [cx, cy] = cursorAt(f);
  const bal = priceNow(f);
  const frameIn = prog(f, 0, 14, EASE.out);
  // which card is hovered: nearest buy window
  let hoverCard = -1;
  BUYS.forEach((b) => {
    if (f >= b.at - 16 && f < b.at + 24) hoverCard = b.card;
  });
  const lastBuy = BUYS.filter((b, i) => i < 3 && f >= b.at).pop();
  const sinceBuy = lastBuy ? f - lastBuy.at : 99;
  const failAt = BUYS[3].at;
  const denying = f >= failAt && f < failAt + 12 ? 1 - (f - failAt) / 12 : 0;
  const talk = f >= failAt ? '钱不够啊…' : f >= BUYS[0].at ? '好眼光！' : '欢迎光临';
  const nod = sinceBuy < 12 ? jiggle(sinceBuy / 12, 2, 2) : 0;
  const detail = hoverCard >= 0 ? GOODS[hoverCard] : null;
  const press = (b: {at: number}) => (f >= b.at - 2 && f < b.at + 3 ? 1 : 0);
  const content = (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: frameIn, transform: `translateY(${(1 - frameIn) * 40}px)`}}>
        <div style={{position: 'absolute', left: 130, top: 80}}>
          <Frame w={1660} h={920} mat="wood" pad={0} />
        </div>
        <div style={{position: 'absolute', left: 130, top: 80, width: 1660, display: 'flex', justifyContent: 'center', transform: 'translateY(-34px)'}}>
          <div style={{padding: '4px 70px', background: 'linear-gradient(180deg,#3a2616,#150e09)', border: `6px solid ${C.gold1}`, boxShadow: `0 0 0 4px ${C.ink}, 0 8px 0 4px rgba(0,0,0,.5)`}}>
            <Fancy size={60} spacing={14}>
              流浪商人
            </Fancy>
          </div>
        </div>
        {/* merchant column */}
        <div style={{position: 'absolute', left: 190, top: 150}}>
          <Merchant talk={talk} nod={nod} />
        </div>
        <div style={{position: 'absolute', left: 190, top: 610, width: 370, height: 340, boxSizing: 'border-box', border: '6px solid #6a5538', background: 'linear-gradient(180deg,#241811,#110b07)', boxShadow: `0 0 0 4px ${C.ink}`, padding: 20}}>
          {detail ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <DSlot size={88} edge={RARITY[detail.rar].color}>
                  <Item id={detail.id} size={64} />
                </DSlot>
                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                  <Fancy size={40} fill={`linear-gradient(180deg, ${mix(RARITY[detail.rar].color, '#fff', 0.6)}, ${RARITY[detail.rar].color} 55%, ${mix(RARITY[detail.rar].color, '#000', 0.4)})`} style={{justifyContent: 'flex-start'}}>
                    {detail.name}
                  </Fancy>
                  <Label size={24} color={RARITY[detail.rar].color}>
                    {RARITY[detail.rar].name}
                  </Label>
                </div>
              </div>
              <div style={{height: 4, background: '#4a3b28'}} />
              <Label size={24} color="#d9c9a0" style={{textAlign: 'left'}}>
                {detail.sub}
              </Label>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <Label size={24} color="#a89878">
                  价格
                </Label>
                <Item id="emerald" size={40} />
                <Bold size={44} color={bal >= detail.price ? '#bfffd0' : '#ff6a5a'}>
                  {String(detail.price)}
                </Bold>
              </div>
              <div style={{padding: '4px 0', textAlign: 'center', background: bal >= detail.price ? 'linear-gradient(180deg,#58d36a,#2a7a3a)' : 'linear-gradient(180deg,#7a3a30,#4a1a14)', border: `4px solid ${C.ink}`, transform: `translateY(${f >= 0 && BUYS.some((b) => f >= b.at - 2 && f < b.at + 3) ? 6 : 0}px)`}}>
                <Label size={36} color={bal >= detail.price ? '#eaffef' : '#ffb0a0'}>
                  {bal >= detail.price ? '购买' : '余额不足'}
                </Label>
              </div>
            </div>
          ) : (
            <div style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <Label size={24} color="#6a5a44">
                选择商品
              </Label>
            </div>
          )}
        </div>
        {/* goods */}
        {GOODS.map((g, i) => {
          const bi = BUYS.findIndex((b, k) => k < 3 && b.card === i);
          const sold = bi >= 0 && f >= BUYS[bi].at + FLY ? (f - BUYS[bi].at - FLY) / 14 : 0;
          const deny = i === BUYS[3].card ? denying : 0;
          const prs = BUYS.some((b) => b.card === i && press(b));
          return <Card key={i} i={i} f={f} sold={sold} hover={hoverCard === i} deny={deny} press={prs ? 1 : 0} />;
        })}
        {/* balance */}
        <div style={{position: 'absolute', left: 1290, top: 160, width: 450, height: 190, boxSizing: 'border-box', border: '6px solid #6a5538', background: 'linear-gradient(180deg,#241811,#110b07)', boxShadow: `0 0 0 4px ${C.ink}`, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12}}>
          <Label size={24} color="#a89878">
            绿宝石
          </Label>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div style={{transform: `scale(${1 + 0.25 * (sinceBuy < 14 ? jiggle(sinceBuy / 14, 2, 3) : 0)})`, filter: 'drop-shadow(0 0 12px #17dd62)'}}>
              <Item id="emerald" size={96} />
            </div>
            <Odometer value={bal} digits={3} cw={84} ch={116} fs={92} />
          </div>
        </div>
        {/* bag */}
        <div style={{position: 'absolute', left: BAG_X, top: BAG_Y - 56, width: 4 * BS + 36, display: 'flex', alignItems: 'center', gap: 14}}>
          <Label size={24} color="#a89878">
            背包
          </Label>
          <div style={{flex: 1, height: 4, background: 'linear-gradient(90deg,#6a5538,rgba(106,85,56,0))'}} />
        </div>
        {BAG_PRE.map((id, k) => {
          const [x, y] = bagC(k);
          const bought = BUYS.slice(0, 3).findIndex((_, bi) => bi + 3 === k && true);
          const bi = k >= 3 && [3, 4, 6, 7, 8].length ? -1 : -1;
          void bought;
          void bi;
          return (
            <div key={k} style={{position: 'absolute', left: x - BS / 2, top: y - BS / 2}}>
              <DSlot size={BS} edge="#4a3b28">
                {id && <Item id={id} size={68} />}
              </DSlot>
            </div>
          );
        })}
        {/* purchased items land in free slots 1, 3, 4 */}
        {BUYS.slice(0, 3).map((b, bi) => {
          const slot = [1, 3, 4][bi];
          const [x, y] = bagC(slot);
          const landed = f >= b.at + FLY;
          const since = f - b.at - FLY;
          if (!landed) return null;
          return (
            <div key={bi} style={{position: 'absolute', left: x - BS / 2, top: y - BS / 2}}>
              <DSlot size={BS} edge={RARITY[GOODS[b.card].rar].color} glow={since < 14 ? 1 - since / 14 : 0} style={{transform: `scale(${1 + 0.18 * jiggle(since / 14, 2, 3)})`}}>
                <Item id={GOODS[b.card].id} size={68} />
              </DSlot>
              <Glint x={BS / 2} y={BS / 2} t={since / 14} size={50} />
            </div>
          );
        })}
      </div>
      {/* flying emeralds (pay) and item */}
      {BUYS.map((b, bi) => {
        const g = GOODS[b.card];
        const [sx, sy] = cardC(b.card);
        const ok = bi < 3;
        const slot = [1, 3, 4][bi] ?? 0;
        const [tx, ty] = bagC(slot);
        const t = (f - b.at) / FLY;
        return (
          <div key={bi}>
            {ok &&
              [0, 1, 2, 3].map((k) => {
                const tt = clamp01((f - b.at - k * 2) / 14);
                if (tt <= 0 || tt >= 1) return null;
                const e = EASE.in(tt);
                return <div key={k} style={{position: 'absolute', left: lerp(BAL_C[0] + k * 14, sx, e) - 22, top: lerp(BAL_C[1], sy, e) - Math.sin(tt * Math.PI) * 100 - 22, width: 44, height: 44, filter: 'drop-shadow(0 0 10px #17dd62)', opacity: 1 - e * 0.4}}><Item id="emerald" size={44} /></div>;
              })}
            {ok && t > 0.3 && t < 1 && (() => {
              const tt = clamp01((t - 0.3) / 0.7);
              const e = EASE.inOut(tt);
              return (
                <div style={{position: 'absolute', left: lerp(sx, tx, e) - 48, top: lerp(sy, ty, e) - Math.sin(tt * Math.PI) * 170 - 48, width: 96, height: 96, transform: `scale(${lerp(1.2, 0.72, e)}) rotate(${tt * 360}deg)`, filter: `drop-shadow(0 0 16px ${RARITY[g.rar].glow})`}}>
                  <Item id={g.id} size={96} />
                </div>
              );
            })()}
            {ok && <Burst x={sx} y={sy} at={b.at + 8} count={12} colors={['#17dd62', '#bfffd0', '#fff']} speed={10} life={20} size={9} seed={bi + 2} />}
            {!ok && <Burst x={sx} y={sy - 50} at={b.at} count={10} colors={['#ff6a5a', '#ffb0a0']} speed={9} life={18} size={9} seed={9} />}
            {ok && f >= b.at + 4 && f < b.at + 26 && (
              <div style={{position: 'absolute', left: BAL_C[0] - 80, top: BAL_C[1] + 90 - (f - b.at - 4) * 2, width: 160, display: 'flex', justifyContent: 'center', opacity: 1 - clamp01((f - b.at - 14) / 12)}}>
                <Fancy size={56} fill="linear-gradient(180deg,#fff,#ff8a7a 50%,#c9301c)" edge="#2a0804">{`−${g.price}`}</Fancy>
              </div>
            )}
          </div>
        );
      })}
      <Cursor x={cx} y={cy} press={BUYS.some((b) => f >= b.at - 2 && f < b.at + 3) ? 1 : 0} />
      {BUYS.map((b, i) => (
        <Sfx key={i} at={b.at} src={mcSound('random/click')} volume={0.45} rate={i === 3 ? 0.7 : 1} />
      ))}
      {BUYS.slice(0, 3).map((b, i) => (
        <Sfx key={'g' + i} at={b.at + 4} src={mcSound('random/orb')} volume={0.3} rate={1.3 + i * 0.1} />
      ))}
      {BUYS.slice(0, 3).map((b, i) => (
        <Sfx key={'l' + i} at={b.at + FLY} src={mcSound('random/pop')} volume={0.4} rate={0.9 + i * 0.1} />
      ))}
      <Sfx at={BUYS[3].at + 2} src={mcSound('dig/stone3')} volume={0.4} rate={0.6} />
      <Flash at={BUYS[3].at} life={4} peak={0.12} color="#ff6a5a" />
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <DungeonBg dim={0.4} warm={0.9} vignette={0.9}>
      {content}
    </DungeonBg>
  );
};

export const MerchantBuy = Scene;
void GOLD_GRAD;
