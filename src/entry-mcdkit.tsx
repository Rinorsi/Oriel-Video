import {registerRoot} from 'remotion';
import {makeRoot} from './gallery/makeRoot';
import {entries} from './gallery/fx/mcdkit';

registerRoot(makeRoot(entries));
