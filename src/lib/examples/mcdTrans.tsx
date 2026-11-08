import type {FC} from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {TransitionOverlay, TransitionSeries, seriesFrames} from '../transition';
import {
  mcdBlackCut, mcdLoadingLabel, mcdPortalWhiteout, mcdChestBeam, mcdTitleScramble, mcdGodRays, mcdHazePush, mcdIsoBlocks, mcdMapZoom, mcdSoulsSweep, mcdLightningFlash, mcdEmberCurtain, mcdTopGradient, makeMcdLoadingLabel, makeMcdTitleScramble, makeMcdHazePush, makeMcdMapZoom, makeMcdTopGradient,
  ScenePlate, SceneCanvas, SCENES, FxLayer, mcdFx, LootBeam, EmberField, FireflyField, SnowField, SoulStream, LightningBolts, EmeraldSpin, HitSparks,
} from '../mcdTrans';
void [TransitionOverlay, seriesFrames, Sequence, interpolate, useCurrentFrame, AbsoluteFill];

// Each block below is the catalog `example` of that entry made runnable (generated from the same table as catalog/mcdTrans.json).

/** Runnable examples for the mcdTrans group; each becomes composition `lib-<id>` (see src/lib-entry.tsx). */
export const examples: {id: string; Component: FC; frames: number}[] = [
  (() => {
    const ShotA = () => <ScenePlate biome="forest-day" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="camp" />;
    const shots = [
      {dur: 45 + mcdBlackCut.frames, C: ShotA},
      {dur: mcdBlackCut.frames - mcdBlackCut.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdBlackCut];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-black-cut', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const loadMap = makeMcdLoadingLabel({place: '末地城', caption: '正在前往', difficulty: 'III', biome: 'end'}); // 模块顶层调用一次，换文字/参数
    const ShotA = () => <ScenePlate biome="camp" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="forest-night" />;
    const shots = [
      {dur: 45 + loadMap.frames, C: ShotA},
      {dur: loadMap.frames - loadMap.bStart + 45, C: ShotB},
    ];
    const transitions = [loadMap];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-loading-label', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="camp" camera="static" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="forest-day" />;
    const shots = [
      {dur: 45 + mcdPortalWhiteout.frames, C: ShotA},
      {dur: mcdPortalWhiteout.frames - mcdPortalWhiteout.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdPortalWhiteout];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-portal-whiteout', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="snow" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="forest-day" />;
    const shots = [
      {dur: 45 + mcdChestBeam.frames, C: ShotA},
      {dur: mcdChestBeam.frames - mcdChestBeam.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdChestBeam];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-chest-beam', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const chapterTitle = makeMcdTitleScramble({title: '第二章', sub: '深入下界'}); // 模块顶层调用一次，换文字/参数
    const ShotA = () => <ScenePlate biome="forest-night" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="nether" />;
    const shots = [
      {dur: 45 + chapterTitle.frames, C: ShotA},
      {dur: chapterTitle.frames - chapterTitle.bStart + 45, C: ShotB},
    ];
    const transitions = [chapterTitle];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-title-scramble', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="snow" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="desert" />;
    const shots = [
      {dur: 45 + mcdGodRays.frames, C: ShotA},
      {dur: mcdGodRays.frames - mcdGodRays.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdGodRays];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-god-rays', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const warmHaze = makeMcdHazePush([220, 150, 140]); // 模块顶层调用一次，换文字/参数
    const ShotA = () => <ScenePlate biome="forest-night" frameOffset={70} />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="forest-day" />;
    const shots = [
      {dur: 45 + warmHaze.frames, C: ShotA},
      {dur: warmHaze.frames - warmHaze.bStart + 45, C: ShotB},
    ];
    const transitions = [warmHaze];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-haze-push', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="end" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="forest-day" />;
    const shots = [
      {dur: 45 + mcdIsoBlocks.frames, C: ShotA},
      {dur: mcdIsoBlocks.frames - mcdIsoBlocks.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdIsoBlocks];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-iso-blocks', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const journey = makeMcdMapZoom({from: '主城', to: '沙漠神殿'}); // 模块顶层调用一次，换文字/参数
    const ShotA = () => <ScenePlate biome="forest-day" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="desert" />;
    const shots = [
      {dur: 45 + journey.frames, C: ShotA},
      {dur: journey.frames - journey.bStart + 45, C: ShotB},
    ];
    const transitions = [journey];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-map-zoom', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="nether" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="snow" />;
    const shots = [
      {dur: 45 + mcdSoulsSweep.frames, C: ShotA},
      {dur: mcdSoulsSweep.frames - mcdSoulsSweep.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdSoulsSweep];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-souls-sweep', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="snow" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="forest-night" frameOffset={20} />;
    const shots = [
      {dur: 45 + mcdLightningFlash.frames, C: ShotA},
      {dur: mcdLightningFlash.frames - mcdLightningFlash.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdLightningFlash];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-lightning-flash', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="forest-day" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="nether" />;
    const shots = [
      {dur: 45 + mcdEmberCurtain.frames, C: ShotA},
      {dur: mcdEmberCurtain.frames - mcdEmberCurtain.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdEmberCurtain];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-ember-curtain', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const chapterDone = makeMcdTopGradient({title: '第一章 完成', sub: '前往沙漠神殿', count: '1'}); // 模块顶层调用一次，换文字/参数
    const ShotA = () => <ScenePlate biome="desert" />; // 换成你自己的镜头组件
    const ShotB = () => <ScenePlate biome="camp" />;
    const shots = [
      {dur: 45 + chapterDone.frames, C: ShotA},
      {dur: chapterDone.frames - chapterDone.bStart + 45, C: ShotB},
    ];
    const transitions = [chapterDone];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-t-top-gradient', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const ShotA = () => <ScenePlate biome="forest-day" camera="push" loop={150} />;
    const ShotB = () => <ScenePlate biome="nether" dim={0.15} />;
    const shots = [
      {dur: 45 + mcdGodRays.frames, C: ShotA},
      {dur: mcdGodRays.frames - mcdGodRays.bStart + 45, C: ShotB},
    ];
    const transitions = [mcdGodRays];
    const Demo = () => <TransitionSeries shots={shots} transitions={transitions} />;
    // 合成 durationInFrames = seriesFrames(shots, transitions)
    return {id: 'mcd-scene-plate', Component: Demo as FC, frames: seriesFrames(shots, transitions)};
  })(),
  (() => {
    const Demo = () => <SceneCanvas spec={SCENES.camp} seed={9} loop={90} camera={{mode: 'linear'}} post={{vignette: 0.6}} />;
    return {id: 'mcd-scene-canvas', Component: Demo as FC, frames: 90};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#1b1030, #4a2a1c)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <FxLayer
          loop={120}
          draw={(ctx, v) => {
            mcdFx.beam(ctx, v, {x: 960, y: 900, kind: 'orange', width: 110});
            mcdFx.hitSparks(ctx, v, {x: 960, y: 860, start: 0, seed: 3, n: 18, scale: 1.4});
          }}
        />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-layer', Component: Demo as FC, frames: 120};
  })(),
  (() => {
    const Demo = () => (
      <AbsoluteFill style={{background: '#0d0a1c'}}>
        <FxLayer loop={150} draw={(ctx, v) => mcdFx.snowfall(ctx, v, {n: 90, seed: 2, wind: 0.3})} />
        <FxLayer loop={150} draw={(ctx, v) => mcdFx.beam(ctx, v, {x: 480, y: 900, kind: 'green', width: 90})} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-primitives', Component: Demo as FC, frames: 150};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#150f2e, #3a2562)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => {
      const f = useCurrentFrame();
      return (
        <AbsoluteFill>
          <Bg />
          <LootBeam x={960} y={860} kind="magenta" width={120} grow={interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'})} />
        </AbsoluteFill>
      );
    };
    return {id: 'mcd-fx-loot-beam', Component: Demo as FC, frames: 120};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#240a0a, #6a2210)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <EmberField n={90} seed={3} ash={0.3} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-ember-field', Component: Demo as FC, frames: 120};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#071a24, #12384a)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <FireflyField n={36} seed={7} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-firefly-field', Component: Demo as FC, frames: 120};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#1a2c58, #6f90be)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <SnowField n={140} seed={3} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-snow-field', Component: Demo as FC, frames: 120};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#0a1424, #1d3a52)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <SoulStream from={[320, 820]} to={[1560, 240]} n={8} loop={90} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-soul-stream', Component: Demo as FC, frames: 90};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#070d1e, #1c2f58)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <LightningBolts x={1330} y={780} frames={[20, 32, 100]} loop={150} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-lightning-bolts', Component: Demo as FC, frames: 150};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#10281c, #2a5a3c)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <EmeraldSpin x={960} y={520} size={220} loop={60} />
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-emerald-spin', Component: Demo as FC, frames: 120};
  })(),
  (() => {
    const Bg = () => <AbsoluteFill style={{background: 'linear-gradient(#1c1c24, #3a3a48)'}} />; // 占位素材，换成你自己的镜头
    const Demo = () => (
      <AbsoluteFill>
        <Bg />
        <Sequence from={20} durationInFrames={14}>
          <HitSparks x={960} y={540} />
        </Sequence>
        <Sequence from={50} durationInFrames={14}>
          <HitSparks x={600} y={700} />
        </Sequence>
      </AbsoluteFill>
    );
    return {id: 'mcd-fx-hit-sparks', Component: Demo as FC, frames: 90};
  })(),
];
