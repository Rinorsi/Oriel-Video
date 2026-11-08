import {registerRoot} from 'remotion';
import {allEntries} from './gallery/all';
import {makeRoot} from './gallery/makeRoot';

registerRoot(makeRoot(allEntries));
