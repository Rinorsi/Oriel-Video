import type {FC} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {bgm} from '../mc/assets';
import {ensureFonts} from '../mc/fonts';
import {AdvancementToast, CharacterLine, ChapterCard, GatherCard, ItemReveal} from '../scenes/Cards';
import {LoadingTransition} from '../scenes/LoadingTransition';
import {FURNACE_FUEL, FURNACE_INPUT, RecipeScene, SMITH_ADDITION, SMITH_BASE, SMITH_TEMPLATE, craftSlot, recipeDuration, type RecipeProps} from '../scenes/RecipeScene';
import {sec} from '../mc/theme';

/**
 * Sample episode: "从木棍到下界合金剑".
 * Structure the user asked for:
 *   1. Cold open: the best moment first (netherite sword reveal)
 *   2. Hook line: "如你所见……这一切要从一根木棍说起"
 *   3. Brand transition: channel + title + subtitle on a loading bar with the runner
 *   4. Story: gather -> craft -> smelt -> smith, each as a chapter
 *   5. Ending: back to the hero item + advancement toast
 *
 * Edit SCRIPT below to make another episode; durations are computed from it.
 */

export const CHANNEL = '方块工坊';
export const TITLE = '从木棍到下界合金剑';
export const SUBTITLE = '一期视频，从零走完整条装备线';

const sticks: RecipeProps = {
  gui: 'crafting',
  inputs: [
    {id: 'oak_planks', slot: craftSlot(1, 0)},
    {id: 'oak_planks', slot: craftSlot(1, 1)},
  ],
  result: {id: 'stick', count: 4, name: '木棍', lore: ['一切的起点']},
  backdrop: 'oak_planks',
  caption: '两块木板竖着放，得到 4 根木棍',
};

const diamondSword: RecipeProps = {
  gui: 'crafting',
  inputs: [
    {id: 'diamond', slot: craftSlot(1, 0)},
    {id: 'diamond', slot: craftSlot(1, 1)},
    {id: 'stick', slot: craftSlot(1, 2)},
  ],
  result: {id: 'diamond_sword', name: '钻石剑', rarity: 'common', lore: ['攻击伤害 7']},
  backdrop: 'deepslate_diamond_ore',
  caption: '两颗钻石加一根木棍',
};

const scrap: RecipeProps = {
  gui: 'furnace',
  inputs: [
    {id: 'ancient_debris', slot: FURNACE_INPUT},
    {id: 'coal', slot: FURNACE_FUEL},
  ],
  result: {id: 'netherite_scrap', name: '下界合金碎片', lore: ['远古残骸熔炼所得']},
  backdrop: 'netherrack',
  caption: '远古残骸丢进熔炉，烧出碎片',
};

const ingot: RecipeProps = {
  gui: 'crafting',
  inputs: [
    {id: 'netherite_scrap', slot: craftSlot(0, 0)},
    {id: 'netherite_scrap', slot: craftSlot(1, 0)},
    {id: 'netherite_scrap', slot: craftSlot(2, 0)},
    {id: 'netherite_scrap', slot: craftSlot(0, 1)},
    {id: 'gold_ingot', slot: craftSlot(1, 1)},
    {id: 'gold_ingot', slot: craftSlot(2, 1)},
    {id: 'gold_ingot', slot: craftSlot(0, 2)},
    {id: 'gold_ingot', slot: craftSlot(1, 2)},
  ],
  result: {id: 'netherite_ingot', name: '下界合金锭', rarity: 'uncommon', lore: ['4 碎片 + 4 金锭']},
  backdrop: 'blackstone',
  caption: '4 个碎片 + 4 个金锭，合成一块锭',
  stagger: 5,
};

const upgrade: RecipeProps = {
  gui: 'smithing',
  inputs: [
    {id: 'netherite_upgrade_smithing_template', slot: SMITH_TEMPLATE},
    {id: 'diamond_sword', slot: SMITH_BASE},
    {id: 'netherite_ingot', slot: SMITH_ADDITION},
  ],
  result: {id: 'netherite_sword', name: '下界合金剑', rarity: 'epic', lore: ['攻击伤害 8', '不会被岩浆烧毁'], glint: true},
  backdrop: 'polished_blackstone',
  caption: '锻造台：模板 + 钻石剑 + 下界合金锭',
  stagger: 9,
};

type Shot = {name: string; dur: number; el: FC};

const SCRIPT: Shot[] = [
  // 1. cold open
  {name: 'cold-open', dur: sec(3.6), el: () => <ItemReveal id="netherite_sword" name="下界合金剑" tagline="今天，我们把它做出来" />},
  // 2. hook line
  {name: 'hook', dur: sec(3.2), el: () => <CharacterLine pose="hold" heldItem="netherite_sword" line={'如你所见，这是一把下界合金剑。\n这一切，要从一根木棍说起。'} backdrop="dark_oak_planks" />},
  // 3. brand transition
  {name: 'brand', dur: sec(4.6), el: () => <LoadingTransition channel={CHANNEL} title={TITLE} subtitle={SUBTITLE} heldItem="netherite_sword" />},
  // 4. story
  {name: 'ch1', dur: sec(2.2), el: () => <ChapterCard index={1} title="先有木棍" hint="砍树，把原木做成木板" icon="stick" backdrop="oak_log" />},
  {name: 'sticks', dur: recipeDuration(sticks), el: () => <RecipeScene {...sticks} />},
  {name: 'ch2', dur: sec(2.2), el: () => <ChapterCard index={2} title="钻石剑" hint="Y=-58 附近最容易挖到钻石" icon="diamond" backdrop="deepslate" accent="#55FFFF" />},
  {name: 'diamond-sword', dur: recipeDuration(diamondSword), el: () => <RecipeScene {...diamondSword} />},
  {name: 'ch3', dur: sec(2.2), el: () => <ChapterCard index={3} title="下界寻宝" hint="远古残骸只在下界生成" icon="netherite_scrap" backdrop="netherrack" accent="#FF5555" />},
  {name: 'gather', dur: sec(3.6), el: () => <GatherCard items={[{id: 'netherite_scrap', count: 4, name: '下界合金碎片'}, {id: 'gold_ingot', count: 4, name: '金锭'}]} where="下界 Y=15 附近" whereBlock="netherrack" tip="用床炸开岩层更快，但要离远一点" />},
  {name: 'smelt', dur: recipeDuration(scrap), el: () => <RecipeScene {...scrap} />},
  {name: 'ingot', dur: recipeDuration(ingot), el: () => <RecipeScene {...ingot} />},
  {name: 'ch4', dur: sec(2.2), el: () => <ChapterCard index={4} title="锻造升级" hint="模板在堡垒遗迹的箱子里" icon="netherite_upgrade_smithing_template" backdrop="polished_blackstone" accent="#FF55FF" />},
  {name: 'upgrade', dur: recipeDuration(upgrade, 70), el: () => <RecipeScene {...upgrade} />},
  // 5. ending
  {name: 'ending', dur: sec(4.5), el: Ending},
];

function Ending() {
  return (
    <AbsoluteFill>
      <CharacterLine pose="cheer" heldItem="netherite_sword" line={'搞定！下期我们给它附魔。\n记得点个关注～'} backdrop="gilded_blackstone" />
      <AdvancementToast icon="netherite_sword" title="进度达成！" text="不为人知的秘密" at={20} hold={80} color="#FF55FF" />
    </AbsoluteFill>
  );
}

/** Short crossfade between shots, layered over the cut. */
const XFADE = 6;

export const timeline = () => {
  let t = 0;
  return SCRIPT.map((s) => {
    const from = t;
    t += s.dur;
    return {...s, from};
  });
};

export const TOTAL = timeline().reduce((a, s) => a + s.dur, 0);

export const NetheriteSword: FC<{withBgm?: boolean}> = ({withBgm = true}) => {
  ensureFonts();
  const frame = useCurrentFrame();
  const shots = timeline();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shots.map((s, i) => {
        const El = s.el;
        // Shots after a hard brand wipe do not need a crossfade.
        const fadeIn = i > 0 && SCRIPT[i - 1].name !== 'hook' && s.name !== 'brand' ? XFADE : 0;
        return (
          <Sequence key={s.name} name={s.name} from={s.from - fadeIn} durationInFrames={s.dur + fadeIn}>
            <AbsoluteFill style={{opacity: fadeIn ? interpolate(frame - (s.from - fadeIn), [0, fadeIn], [0, 1], {extrapolateRight: 'clamp'}) : 1}}>
              <El />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {withBgm && <Audio src={bgm('house-vibez.mp3')} volume={(f) => interpolate(f, [0, 20, TOTAL - 40, TOTAL], [0, 0.22, 0.22, 0], {extrapolateRight: 'clamp'})} />}
    </AbsoluteFill>
  );
};
