import {registerRoot} from 'remotion';
import {makeRoot} from './gallery/makeRoot';
import {entries} from './gallery/fx/mcd1';

registerRoot(makeRoot(entries));
