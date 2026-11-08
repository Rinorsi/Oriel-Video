import type {FC} from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import {ensureFonts} from '../mc/fonts';
import {FPS, HEIGHT, WIDTH} from '../mc/theme';
import type {FxEntry} from './types';

const withFonts = (C: FC): FC => () => {
  ensureFonts();
  return <C />;
};

/** A 3x2 time contact sheet of an effect: six frames spread over its length, in one still. For visual review. */
const sheetOf = (entry: FxEntry): FC => () => {
  ensureFonts();
  const n = entry.meta.frames;
  const picks = [0.1, 0.26, 0.42, 0.58, 0.76, 0.93].map((t) => Math.round(t * (n - 1)));
  const C = entry.Demo;
  return (
    <AbsoluteFill style={{background: '#101012'}}>
      {picks.map((fr, i) => (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 640, top: Math.floor(i / 3) * 360 + 0, width: 640, height: 360, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT, transform: 'scale(0.3333333)', transformOrigin: '0 0'}}>
            <Sequence from={-fr} layout="none">
              <C />
            </Sequence>
          </div>
          <div style={{position: 'absolute', right: 6, bottom: 4, fontFamily: 'monospace', fontSize: 16, color: '#fff', textShadow: '0 0 4px #000'}}>{`f${fr}`}</div>
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 359, height: 2, background: '#000'}} />
    </AbsoluteFill>
  );
};

/** Builds a Remotion root from gallery entries: demo, optional alpha layer, and a review sheet for each. */
export const makeRoot = (entries: FxEntry[]): FC => () => (
  <>
    {entries.flatMap((e) => {
      const base = {fps: FPS, width: WIDTH, height: HEIGHT} as const;
      const out = [<Composition key={e.meta.id} id={`fx-${e.meta.id}`} component={withFonts(e.Demo)} durationInFrames={e.meta.frames} {...base} defaultProps={{meta: e.meta}} />];
      if (e.Layer) out.push(<Composition key={`${e.meta.id}-alpha`} id={`fx-${e.meta.id}-alpha`} component={withFonts(e.Layer)} durationInFrames={e.meta.frames} {...base} defaultProps={{meta: e.meta}} />);
      out.push(<Composition key={`${e.meta.id}-sheet`} id={`sheet-${e.meta.id}`} component={sheetOf(e)} durationInFrames={1} fps={FPS} width={WIDTH} height={720} />);
      return out;
    })}
  </>
);
