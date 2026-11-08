import {registerRoot} from 'remotion';
import {makeRoot} from './gallery/makeRoot';
import {entries} from './gallery/fx/trans2';

registerRoot(makeRoot(entries));
