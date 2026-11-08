import type {FxEntry} from '../../types';
import {entryCheckpoint} from './partb-checkpoint';
import {entryChest} from './partb-chest';
import {entryDoor} from './partb-door';
import {entryWave} from './partb-wave';
import {entryDied} from './partb-died';

/** rpgb part b: you-died, checkpoint, chest-loot, door-open, wave-start. */
export const entriesb: FxEntry[] = [entryDied, entryCheckpoint, entryChest, entryDoor, entryWave];
