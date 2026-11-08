import type {FxEntry} from '../../types';
import {entriesa} from './parta';
import {entriesb} from './partb';
import {entriesc} from './partc';

/** Entries for the rpgb area (dungeon-crawler RPG cinematics). Split over parta/partb/partc by author. */
export const entries: FxEntry[] = [...entriesa, ...entriesb, ...entriesc];
