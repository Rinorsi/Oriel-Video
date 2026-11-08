import type {FC, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Twinkles} from '../mc/Fx';
import {EASE} from '../mc/theme';
import {ORE, OreChip, OreText, StoneTitle, TYPE, U} from '../mg/Ore';
import {Slot, Sky, OreBg} from '../reel/kit';

/**
 * Stand-in "footage" for demos: two recognisable full-frame plates, A (day) and B (night / purple), so a
 * transition between them is easy to read. Real videos replace these with their own shots.
 */

const Letter: FC<{ch: string; label: string; children?: ReactNode}> = ({ch, label, children}) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 190, display: 'flex', justifyContent: 'center', transform: `scale(3.6) translateY(${Math.sin(f / 18) * 3}px)`}}>
        <StoneTitle size={TYPE.hero}>{ch}</StoneTitle>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center', gap: 4 * U}}>
        <OreChip color={ORE.text} dot={ORE.gold}>
          {label}
        </OreChip>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 44, display: 'flex', justifyContent: 'center', gap: U}}>
        {['diamond_sword', 'bow', 'iron_pickaxe', 'golden_apple', 'ender_pearl', 'bread', 'water_bucket'].map((id, i) => (
          <Slot key={id} id={id} frame={i === 0 ? 'slot_hover' : 'slot'} />
        ))}
      </div>
      {children}
    </>
  );
};

export const PlateA: FC = () => (
  <Sky time="noon" vignette={0.3}>
    <Twinkles x={960} y={420} radius={620} count={12} size={34} seed={3} />
    <Letter ch="A" label="场景 A · 白天" />
  </Sky>
);

export const PlateB: FC = () => (
  <Sky time="night" vignette={0.45}>
    <Twinkles x={960} y={420} radius={620} count={12} size={34} seed={9} />
    <Letter ch="B" label="场景 B · 夜晚" />
  </Sky>
);

/** Third plate for effects that need a visible change of mood (purple Ore screen). */
export const PlateC: FC = () => (
  <OreBg tone="purple">
    <Letter ch="C" label="场景 C" />
  </OreBg>
);

void EASE;
void AbsoluteFill;
void OreText;
