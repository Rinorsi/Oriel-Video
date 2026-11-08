import type {FxEntry} from '../../types';
import {bellEntry} from './bell';
import {coinEntry} from './coin';
import {followCornerEntry} from './corner';
import {danmakuEntry} from './danmaku';
import {favoriteEntry} from './favorite';
import {followEntry} from './follow';
import {likeEntry} from './like';
import {milestoneEntry} from './milestone';
import {shareEntry} from './share';
import {tripleEntry} from './triple';

/** Entries for the social area. Add yours to this array. */
export const entries: FxEntry[] = [likeEntry, followEntry, coinEntry, favoriteEntry, tripleEntry, bellEntry, danmakuEntry, shareEntry, followCornerEntry, milestoneEntry];
