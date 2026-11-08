import {registerRoot} from 'remotion';
import {makeRoot} from './gallery/makeRoot';
import {entries} from './gallery/fx/mcdscene';

registerRoot(makeRoot(entries));
