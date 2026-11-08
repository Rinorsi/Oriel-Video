import type {FC} from 'react';
import {examples as mapEx} from '../classicOthers/map.examples';
import {examples as socialEx} from '../classicOthers/social.examples';
import {examples as itemEx} from '../classicOthers/item.examples';
import {examples as infoEx} from '../classicOthers/info.examples';
import {examples as atmoEx} from '../classicOthers/atmo.examples';

/** Runnable examples for the classicOthers group (map / social / item / info / atmo); each becomes composition `lib-<id>` (see src/lib-entry.tsx). */
export const examples: {id: string; Component: FC; frames: number}[] = [...mapEx, ...socialEx, ...itemEx, ...infoEx, ...atmoEx];
