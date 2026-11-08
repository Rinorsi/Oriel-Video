import type {FxEntry} from '../../types';
import {crossEntries} from './cross';
import {jumpAEntries} from './jumpsA';
import {jumpBEntries} from './jumpsB';
import {jumpCEntries} from './jumpsC';
import {locEntries} from './loc';
import {pearlEntries} from './pearl';
import {portalEntries} from './portal';
import {respawnEntries} from './respawn';

/** Entries for the dim area. Add yours to this array. */
export const entries: FxEntry[] = [...crossEntries, ...pearlEntries, ...locEntries, ...jumpAEntries, ...jumpBEntries, ...jumpCEntries, ...portalEntries, ...respawnEntries];
