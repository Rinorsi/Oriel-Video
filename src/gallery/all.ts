import {entries as atmo} from './fx/atmo';
import {entries as core} from './fx/core';
import {entries as cute} from './fx/cute';
import {entries as dim} from './fx/dim';
import {entries as info} from './fx/info';
import {entries as item} from './fx/item';
import {entries as map} from './fx/map';
import {entries as mcdkit} from './fx/mcdkit';
import {entries as mcdscene} from './fx/mcdscene';
import {entries as mcd1} from './fx/mcd1';
import {entries as mcd2} from './fx/mcd2';
import {entries as mcd3} from './fx/mcd3';
import {entries as mcd4} from './fx/mcd4';
import {entries as mcd5} from './fx/mcd5';
import {entries as social} from './fx/social';
import {entries as trans2} from './fx/trans2';

/** Every gallery effect, in display order. */
export const allEntries = [...core, ...cute, ...trans2, ...map, ...dim, ...social, ...item, ...info, ...mcdkit, ...mcdscene, ...mcd1, ...mcd2, ...mcd3, ...mcd4, ...mcd5, ...atmo];
