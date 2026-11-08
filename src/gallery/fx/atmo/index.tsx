import type {FxEntry} from '../../types';
import {cameraEntries} from './camera';
import {lensEntries} from './lens';
import {particleEntries} from './particles';
import {vignetteEntries} from './vignettes';
import {weatherEntries} from './weather';

/** Entries for the atmo area. Add yours to this array. */
export const entries: FxEntry[] = [...vignetteEntries, ...cameraEntries, ...weatherEntries, ...particleEntries, ...lensEntries];
