import {createContext, useContext, type FC} from 'react';
import {Sfx as BaseSfx} from '../../../reel/kit';

/**
 * Audio switch for the map effects. Wrap an effect in <MapAudioCtx.Provider value={false}> to mute all of its sound effects
 * (the library wrappers in src/lib/classicOthers/map.tsx do this from their `audio` prop). Defaults to on.
 */
export const MapAudioCtx = createContext(true);

export const Sfx: FC<{at: number; src: string; volume?: number; rate?: number; cut?: number}> = (p) => {
  const on = useContext(MapAudioCtx);
  return on ? <BaseSfx {...p} /> : null;
};
