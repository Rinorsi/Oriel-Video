import {Config} from '@remotion/cli/config';

// The player model (skinview3d) needs WebGL in headless Chrome.
// "angle" uses the GPU on Windows; switch to "swangle" if a machine has no usable GPU.
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
