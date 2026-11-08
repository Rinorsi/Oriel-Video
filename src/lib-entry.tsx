import type {FC} from 'react';
import {Composition, registerRoot} from 'remotion';
import {ensureFonts} from './mc/fonts';
import {FPS, HEIGHT, WIDTH} from './mc/theme';
import {examples as mcdTransEx} from './lib/examples/mcdTrans';
import {examples as mcdShowEx} from './lib/examples/mcdShow';
import {examples as mcdLayersEx} from './lib/examples/mcdLayers';
import {examples as classicTransEx} from './lib/examples/classicTrans';
import {examples as classicOthersEx} from './lib/examples/classicOthers';
import {examples as episodeEx} from './lib/examples/episode';

const withFonts = (C: FC): FC => () => {
  ensureFonts();
  return <C />;
};

const all = [...mcdTransEx, ...mcdShowEx, ...mcdLayersEx, ...classicTransEx, ...classicOthersEx, ...episodeEx];

registerRoot(() => (
  <>
    {all.map((e) => (
      <Composition key={e.id} id={`lib-${e.id}`} component={withFonts(e.Component)} durationInFrames={e.frames} fps={FPS} width={WIDTH} height={HEIGHT} />
    ))}
  </>
));
