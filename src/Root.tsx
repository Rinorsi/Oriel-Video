import {Composition, Folder} from 'remotion';
import {ensureFonts} from './mc/fonts';
import {FPS, HEIGHT, WIDTH, sec} from './mc/theme';
import {AdvancementToast, ChapterCard, GatherCard, ItemReveal} from './scenes/Cards';
import {LoadingTransition} from './scenes/LoadingTransition';
import {RecipeScene, craftSlot, recipeDuration, type RecipeProps} from './scenes/RecipeScene';
import {NetheriteSword, TOTAL, CHANNEL, TITLE, SUBTITLE} from './story/NetheriteSword';
import {Player3D} from './mc/Player3D';
import {AbsoluteFill} from 'remotion';
import {BlockBackdrop} from './mc/Fx';
import {StyleFrames} from './story/StyleFrames';
import {Intro, INTRO_FRAMES} from './story/Intro';
import {BackdropLoop, LOOP, type TimeOfDay} from './mg/DayCycle';
import {REEL_FRAMES, Reel} from './reel/Reel';
import {PROMO2_FRAMES, Promo2} from './promo/Promo2';
import {Cover} from './promo/Cover';
import {INTRO_FRAMES as Y_INTRO_FRAMES, YouyikuIntro} from './promo/YouyikuIntro';

const demoRecipe: RecipeProps = {
  gui: 'crafting',
  inputs: [
    {id: 'diamond', slot: craftSlot(1, 0)},
    {id: 'diamond', slot: craftSlot(1, 1)},
    {id: 'stick', slot: craftSlot(1, 2)},
  ],
  result: {id: 'diamond_sword', name: '钻石剑', lore: ['攻击伤害 7']},
  caption: '两颗钻石加一根木棍',
};

const withFonts = <P extends object>(C: React.FC<P>) => (props: P) => {
  ensureFonts();
  return <C {...props} />;
};

const PoseSheet = () => (
  <AbsoluteFill>
    <BlockBackdrop texture="stone" darken={0.4} />
    <div style={{position: 'absolute', inset: 0, display: 'flex', gap: 10, padding: 60, flexWrap: 'wrap'}}>
      {(['idle', 'walk', 'run', 'wave', 'swing', 'cheer', 'hold'] as const).map((p) => (
        <Player3D key={p} width={250} height={420} pose={p} yaw={40} heldItem="netherite_sword" />
      ))}
    </div>
  </AbsoluteFill>
);

export const Root = () => (
  <>
    <Composition id="NetheriteSword" component={NetheriteSword} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{withBgm: true}} />
    <Composition id="Cover" component={withFonts(Cover)} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Promo2" component={withFonts(Promo2)} durationInFrames={PROMO2_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Y-Intro" component={withFonts(YouyikuIntro)} durationInFrames={Y_INTRO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{time: 'dawn' as const}} />
    <Composition id="Reel" component={withFonts(Reel)} durationInFrames={REEL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Clips">
      <Composition id="Intro-Noon" component={withFonts(Intro)} durationInFrames={INTRO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{time: 'noon' as TimeOfDay}} />
      {(['dawn', 'noon', 'dusk', 'night'] as const).map((t) => (
        <Composition key={t} id={`Loop-${t}`} component={withFonts(BackdropLoop)} durationInFrames={LOOP} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{time: t as TimeOfDay}} />
      ))}
      <Composition id="StyleFrames" component={withFonts(StyleFrames)} durationInFrames={4} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
    <Folder name="Templates">
      <Composition id="T-Recipe" component={withFonts(RecipeScene)} durationInFrames={recipeDuration(demoRecipe)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={demoRecipe} />
      <Composition id="T-Loading" component={withFonts(LoadingTransition)} durationInFrames={sec(4.6)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{channel: CHANNEL, title: TITLE, subtitle: SUBTITLE, heldItem: 'netherite_sword'}} />
      <Composition id="T-Chapter" component={withFonts(ChapterCard)} durationInFrames={sec(2.2)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{index: 1, title: '先有木棍', hint: '砍树，把原木做成木板', icon: 'stick'}} />
      <Composition id="T-Reveal" component={withFonts(ItemReveal)} durationInFrames={sec(3.6)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{id: 'netherite_sword', name: '下界合金剑', tagline: '今天，我们把它做出来'}} />
      <Composition id="T-Gather" component={withFonts(GatherCard)} durationInFrames={sec(3.6)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{items: [{id: 'netherite_scrap', count: 4, name: '下界合金碎片'}, {id: 'gold_ingot', count: 4, name: '金锭'}], where: '下界 Y=15 附近', whereBlock: 'netherrack'}} />
      <Composition id="T-Toast" component={withFonts(() => <AbsoluteFill><BlockBackdrop texture="grass_block_side" darken={0.3} /><AdvancementToast icon="diamond" title="进度达成！" text="钻石！" /></AbsoluteFill>)} durationInFrames={sec(3.2)} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="T-Poses" component={PoseSheet} durationInFrames={sec(3)} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  </>
);
