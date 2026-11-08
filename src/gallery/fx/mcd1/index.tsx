import type {FxEntry} from '../../types';
import {blackCutEntry} from './blackCut';
import {chestBeamEntry} from './chestBeam';
import {emberCurtainEntry} from './emberCurtain';
import {godRaysEntry} from './godRays';
import {hazePushEntry} from './hazePush';
import {isoBlocksEntry} from './isoBlocks';
import {mapZoomEntry} from './mapZoom';
import {lightningFlashEntry} from './lightningFlash';
import {loadingLabelEntry} from './loadingLabel';
import {portalWhiteoutEntry} from './portalWhiteout';
import {soulsSweepEntry} from './soulsSweep';
import {topGradientEntry} from './topGradient';
import {titleScrambleEntry} from './titleScramble';

/** Entries for the mcd1 area: Dungeons-style video transitions (category 'rpg', ids mcd-t-*). */
export const entries: FxEntry[] = [blackCutEntry, loadingLabelEntry, portalWhiteoutEntry, chestBeamEntry, titleScrambleEntry, godRaysEntry, hazePushEntry, isoBlocksEntry, mapZoomEntry, soulsSweepEntry, lightningFlashEntry, emberCurtainEntry, topGradientEntry];
