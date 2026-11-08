import type {FxEntry} from '../../types';
import {entries as victory} from './victory';
import {entries as results} from './results';
import {entries as chest} from './chest';
import {entries as loot} from './loot';
import {entries as boss} from './boss';
import {entries as death} from './death';
import {entries as levelup} from './levelup';
import {entries as souls} from './souls';
import {entries as objective} from './objective';
import {entries as location} from './location';
import {entries as showcase} from './itemshowcase';
import {entries as worldmap} from './worldmap';

/** Entries for the mcd2 area: Dungeons-style showcase effects. */
export const entries: FxEntry[] = [...victory, ...results, ...chest, ...loot, ...boss, ...death, ...levelup, ...souls, ...objective, ...location, ...showcase, ...worldmap];
