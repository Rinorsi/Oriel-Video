import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

/** Pixel font with full CJK coverage (Fusion Pixel 12px, OFL). Use sizes that are multiples of 12. */
export const PIXEL_FONT = 'OrielPixel';
/** Fusion Pixel 8px, for small labels. Use sizes that are multiples of 8 (32 = 4 screen px per font pixel). */
export const PIXEL8_FONT = 'OrielPixel8';
/** Noto Sans SC Black (OFL). Rasterised on a coarse grid it gives chunky pixel CJK for titles. */
export const BLACK_FONT = 'OrielBlack';
/** Bold slanted display font for big titles (Smiley Sans / 得意黑, OFL). */
export const TITLE_FONT = 'OrielTitle';

const FACES: [string, string][] = [
  [PIXEL_FONT, 'fonts/fusion_pixel_12.ttf'],
  [PIXEL8_FONT, 'fonts/fusion_pixel_8.ttf'],
  [BLACK_FONT, 'fonts/noto_sans_sc_black.otf'],
  [TITLE_FONT, 'fonts/smiley_sans_oblique.ttf'],
];

let started = false;
let ready: Promise<void> | null = null;

/** Resolves once both faces are registered, for code that draws text into a canvas. */
export const fontsReady = (): Promise<void> => {
  ensureFonts();
  return ready ?? Promise.resolve();
};

/** Loads both fonts once and blocks rendering until they are ready. A missing font fails the render. */
export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading video fonts');
  ready = Promise.all(
    FACES.map(async ([family, file]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`);
      await face.load();
      document.fonts.add(face);
    }),
  ).then(() => undefined);
  ready
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(new Error(`Font load failed (did you run npm run setup?): ${err}`)));
};
