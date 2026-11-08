import type {FxEntry} from '../../types';
import {animalDashEntry} from './animalDash';
import {blockRainEntry} from './blockRain';
import {bubblePopEntry} from './bubblePop';
import {chestPopEntry} from './chestPop';
import {cloudPushEntry} from './cloudPush';
import {creeperRushEntry} from './creeperRush';
import {diceFlipEntry} from './diceFlip';
import {foodFrameEntry} from './foodFrame';
import {heartIrisEntry} from './heartIris';
import {heartWaveEntry} from './heartWave';
import {itemWheelEntry} from './itemWheel';
import {polaroidEntry} from './polaroid';
import {rainbowSweepEntry} from './rainbowSweep';
import {ribbonCurtainEntry} from './ribbonCurtain';
import {slimeSplatEntry} from './slimeSplat';
import {starFlipEntry} from './starFlip';

/** Entries for the cute area (flat, cute pixel-style transitions, ordered by priority). */
export const entries: FxEntry[] = [
  creeperRushEntry,
  blockRainEntry,
  cloudPushEntry,
  slimeSplatEntry,
  heartWaveEntry,
  polaroidEntry,
  starFlipEntry,
  chestPopEntry,
  itemWheelEntry,
  animalDashEntry,
  foodFrameEntry,
  rainbowSweepEntry,
  bubblePopEntry,
  ribbonCurtainEntry,
  diceFlipEntry,
  heartIrisEntry,
];
