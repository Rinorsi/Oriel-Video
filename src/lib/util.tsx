import type {FC} from 'react';
import {ensureFonts} from '../mc/fonts';

/**
 * Wrap a root composition component so the pixel fonts load before rendering. EVERY composition you register must be wrapped:
 *   <Composition id="MyEp" component={withFonts(MyEpisode)} durationInFrames={seriesFrames(shots, transitions)} fps={30} width={1920} height={1080} />
 */
export const withFonts = (C: FC): FC => () => {
  ensureFonts();
  return <C />;
};

export {FPS, WIDTH, HEIGHT} from '../mc/theme';
