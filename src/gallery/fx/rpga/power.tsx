import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx, mcSound} from '../../../reel/kit';
import {Beam, Bold, Burst, C, CornerCrests, DungeonBg, EASE, Embers, Fancy, Flash, Frame, GOLD_GRAD, Glint, Item, Label, Shake, clamp01, jiggle, lerp, prog, rgba} from './common';

/**
 * rpg-power-up: a central power panel. The old value is struck through with a red slash and slides aside, the new value counts up
 * (motion-blurred roll), then slams in at 1.7x with a shake, flash and sparks; a green "+25" chip and three stat deltas land, the corner crests
 * light up, and light keeps running around the gold border.
 * Props: `bg` - dungeon backdrop (Demo); Layer = panel only.
 * Edit OLD / NEW (values) and STATS.
 */

export const POWER_FRAMES = 180;
const OLD = 236;
const NEW = 261;
const STATS = [
  {name: '攻击', a: '24', b: '30', icon: 'iron_sword'},
  {name: '暴击', a: '11%', b: '16%', icon: 'flint'},
  {name: '生命', a: '120', b: '132', icon: 'golden_apple'},
];
const PW = 1520;
const PH = 700;
const PXL = (1920 - PW) / 2;
const PYT = 190;
const SLAM = 84;

/** Light that runs clockwise around a w x h rectangle. s = head position along the perimeter in px. */
const Perimeter: FC<{w: number; h: number; s: number; len?: number; th?: number; color?: string; opacity?: number}> = ({w, h, s, len = 420, th = 14, color = '#fff6d0', opacity = 1}) => {
  const P = 2 * (w + h);
  const edges = [
    {x: 0, y: 0, l: w, dir: 'h' as const, rev: false},
    {x: w - th, y: 0, l: h, dir: 'v' as const, rev: false},
    {x: 0, y: h - th, l: w, dir: 'h' as const, rev: true},
    {x: 0, y: 0, l: h, dir: 'v' as const, rev: true},
  ];
  const out: React.ReactNode[] = [];
  let acc = 0;
  edges.forEach((e, ei) => {
    for (const shift of [0, P]) {
      const head = s + shift;
      const a = Math.max(head - len, acc);
      const b = Math.min(head, acc + e.l);
      if (b > a) {
        const t0 = (a - acc) / e.l;
        const t1 = (b - acc) / e.l;
        // along-edge coordinates (reverse for bottom/left edges)
        const p0 = e.rev ? 1 - t1 : t0;
        const p1 = e.rev ? 1 - t0 : t1;
        // brightness grows towards the head
        const headAt = (Math.min(head, acc + e.l) - (head - len)) / len;
        void headAt;
        const g = e.dir === 'h' ? (e.rev ? '270deg' : '90deg') : e.rev ? '0deg' : '180deg';
        out.push(
          <div
            key={`${ei}-${shift}`}
            style={{
              position: 'absolute',
              left: e.dir === 'h' ? e.x + p0 * e.l : e.x,
              top: e.dir === 'h' ? e.y : e.y + p0 * e.l,
              width: e.dir === 'h' ? (p1 - p0) * e.l : th,
              height: e.dir === 'h' ? th : (p1 - p0) * e.l,
              background: `linear-gradient(${g}, ${rgba(color, 0)} 0%, ${rgba(color, 0.9)} ${Math.min(100, (1 - (head - b) / len) * 100)}%, ${rgba(color, 0)} 100%)`,
              boxShadow: `0 0 18px ${rgba(color, 0.8)}`,
              opacity,
            }}
          />,
        );
      }
    }
    acc += e.l;
  });
  return <div style={{position: 'absolute', left: -2, top: -2, width: w, height: h, pointerEvents: 'none'}}>{out}</div>;
};

const Scene: FC<{bg?: boolean}> = ({bg}) => {
  const f = useCurrentFrame();
  const inn = prog(f, 0, 16, EASE.out);
  const strike = prog(f, 40, 8, EASE.out);
  const oldMove = prog(f, 46, 14, EASE.inOut);
  const roll = prog(f, 48, SLAM - 48 - 2, EASE.inOut);
  const val = f < 48 ? OLD : f < SLAM ? Math.round(lerp(OLD, NEW, roll)) : NEW;
  const slamT = (f - SLAM) / 10;
  const sc = f < SLAM ? 1 + roll * 0.12 : slamT < 1 ? lerp(1.7, 1, EASE.out(clamp01(slamT))) : 1 + 0.06 * jiggle(slamT - 1, 2, 3);
  const rolling = f >= 48 && f < SLAM;
  const lit = [0, 1, 2, 3].map((i) => prog(f, SLAM + 6 + i * 6, 10, EASE.out));
  const glow = 0.4 + 0.6 * prog(f, 20, 40) ;
  const chip = prog(f, SLAM + 8, 12, EASE.back);
  const content = (
    <>
      <div style={{position: 'absolute', left: PXL, top: PYT, transform: `translateY(${(1 - inn) * -60}px) scale(${0.9 + 0.1 * inn})`, opacity: inn}}>
        <Frame w={PW} h={PH} mat="wood" pad={0} border={12}>
          {/* weapon column */}
          <div style={{position: 'absolute', left: 52, top: 64, width: 400, bottom: 64, boxSizing: 'border-box', border: '6px solid #6a5538', background: 'radial-gradient(ellipse at 50% 50%, rgba(255,181,49,.3), rgba(20,12,6,.95) 72%)', boxShadow: `0 0 0 4px ${C.ink}, inset 0 0 50px rgba(0,0,0,.7)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}>
            <div style={{filter: `drop-shadow(0 0 ${12 + 22 * glow}px #ffb531)`, transform: `rotate(${Math.sin(f / 18) * 3}deg)`}}>
              <Item id="diamond_sword" size={256} />
            </div>
            <Fancy size={48} fill="linear-gradient(180deg,#fff3c2,#ffb531 55%,#9a5a0a)">
              曙光之刃
            </Fancy>
            <div style={{padding: '2px 16px', background: 'rgba(255,181,49,.2)', border: '3px solid #ffb531'}}>
              <Label size={24} color="#ffb531">
                独特
              </Label>
            </div>
          </div>
          {/* numbers */}
          <div style={{position: 'absolute', left: 500, top: 52, right: 52}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
              <Label size={48} color="#d9c9a0">
                战力
              </Label>
              <div style={{position: 'relative', transform: `translate(${oldMove * 20}px, ${oldMove * -4}px) scale(${1 - oldMove * 0.35})`, transformOrigin: 'left center', opacity: 1 - oldMove * 0.5}}>
                <Bold size={104} color="#8a7c66">
                  {String(OLD)}
                </Bold>
                <div style={{position: 'absolute', left: -14, top: '52%', height: 12, width: `${strike * 112}%`, background: '#ff4a32', boxShadow: '0 0 16px #ff2a10, 0 0 0 4px #0d0a08', transform: 'rotate(-5deg)'}} />
              </div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 500, top: 170, right: 52, height: 290, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28}}>
            <div style={{position: 'relative', transform: `scale(${sc}) translateY(${rolling ? Math.sin(f * 2.5) * 3 : 0}px)`, filter: rolling ? 'blur(1.6px)' : undefined}}>
              <Fancy size={240} fill={GOLD_GRAD} style={{minWidth: 420}}>
                {f >= 40 ? String(val) : '  '}
              </Fancy>
            </div>
            <div style={{transform: `scale(${chip})`, opacity: clamp01(chip * 2)}}>
              <Fancy size={92} fill="linear-gradient(180deg,#e4ffe8,#6bff8a 50%,#1fa04a)" edge="#06180c">{`▲${NEW - OLD}`}</Fancy>
            </div>
          </div>
          {/* stat deltas */}
          <div style={{position: 'absolute', left: 500, right: 52, bottom: 52, display: 'flex', gap: 22}}>
            {STATS.map((st, i) => {
              const t = prog(f, SLAM + 16 + i * 6, 12, EASE.back);
              return (
                <div key={i} style={{flex: 1, height: 136, boxSizing: 'border-box', border: '5px solid #6a5538', background: 'linear-gradient(180deg,#2a1d14,#120b07)', boxShadow: `0 0 0 3px ${C.ink}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6, transform: `scale(${t})`, opacity: clamp01(t * 2)}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <Item id={st.icon} size={40} />
                    <Label size={24} color="#d9c9a0">
                      {st.name}
                    </Label>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <Bold size={36} color="#8a7c66">
                      {st.a}
                    </Bold>
                    <Bold size={30} color="#6a5a44">
                      →
                    </Bold>
                    <Bold size={44} color={C.heal}>
                      {st.b}
                    </Bold>
                  </div>
                </div>
              );
            })}
          </div>
          {/* flowing border light */}
          <Perimeter w={PW} h={PH} s={f * 26} len={520} th={16} color="#fff0b8" opacity={glow} />
          <Perimeter w={PW} h={PH} s={f * 26 + (PW + PH)} len={520} th={16} color="#ffd36a" opacity={glow} />
        </Frame>
      </div>
      {/* effects on slam */}
      <Beam x={960} y={PYT + PH + 20} h={420} w={220} color={C.gold2} p={prog(f, SLAM, 14)} fadeOut={prog(f, SLAM + 30, 30)} seed={4} />
      <Burst x={PXL + 500 + 300} y={PYT + 330} at={SLAM} count={50} colors={[C.gold3, C.gold2, '#fff', C.torch]} speed={26} life={34} size={14} seed={5} />
      <Glint x={PXL + 500 + 300} y={PYT + 330} t={(f - SLAM) / 16} size={260} color="#fff0b8" />
      <Flash at={SLAM} life={8} peak={0.55} color="#ffe9a8" />
      <CornerCrests lit={lit} size={104} margin={64} />
      {lit.map((l, i) => {
        const pos = [
          [116, 130],
          [1804, 130],
          [116, 960],
          [1804, 960],
        ][i];
        return <Burst key={i} x={pos[0]} y={pos[1]} at={SLAM + 6 + i * 6} count={14} colors={[C.gold3, C.gold2, '#fff']} speed={11} life={24} size={10} seed={i + 20} />;
      })}
      <Embers count={18} color={['#ffe08a', '#ffb531', '#fff']} area={[200, 200, 1520, 800]} seed={33} size={10} opacity={f >= SLAM ? 1 : 0.3} />
      {/* sfx */}
      <Sfx at={4} src={mcSound('block/chest/open')} volume={0.25} rate={1.3} />
      <Sfx at={40} src={mcSound('block/smithing_table/smithing_table2')} volume={0.45} rate={1.1} />
      {[50, 56, 62, 68, 74, 80].map((a, i) => (
        <Sfx key={a} at={a} src={mcSound('random/orb')} volume={0.18} rate={0.9 + i * 0.12} />
      ))}
      <Sfx at={SLAM} src={mcSound('random/anvil_land')} volume={0.6} rate={0.9} />
      <Sfx at={SLAM} src={mcSound('random/levelup')} volume={0.4} rate={1.2} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={SLAM + 6 + i * 6} src={mcSound('fire/ignite')} volume={0.1} rate={1.8} />
      ))}
    </>
  );
  if (!bg) return <AbsoluteFill>{content}</AbsoluteFill>;
  return (
    <Shake at={[SLAM]} life={14} strength={22}>
      <DungeonBg dim={0.3} warm={1} vignette={0.9}>
        {content}
      </DungeonBg>
    </Shake>
  );
};

export const PowerUp = Scene;
