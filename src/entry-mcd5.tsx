import {registerRoot} from 'remotion';
import {makeRoot} from './gallery/makeRoot';
import {entries} from './gallery/fx/mcd5';

registerRoot(makeRoot(entries));
