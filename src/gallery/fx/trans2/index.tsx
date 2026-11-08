import type {FxEntry} from '../../types';
import {bookFlip} from './bookFlip';
import {chestOpen} from './chestOpen';
import {creeperHiss} from './creeperHiss';
import {enchantVeil} from './enchantVeil';
import {endPortal} from './endPortal';
import {endermanStare} from './endermanStare';
import {lavaRise} from './lavaRise';
import {pickaxeBreak} from './pickaxeBreak';
import {textFlood} from './textFlood';
import {villagerHmm} from './villagerHmm';

/** Entries for the trans2 area. Add yours to this array. */
export const entries: FxEntry[] = [endPortal, enchantVeil, lavaRise, chestOpen, bookFlip, villagerHmm, endermanStare, creeperHiss, pickaxeBreak, textFlood];
