// Render several stills of one composition from a single bundle.
//   node scripts/stills.mjs <compositionId> <outDir> <frame,frame,...> [scale]
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, outDir, frames, scale = '0.5', entry = 'src/index.ts'] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(ROOT, entry), publicDir: path.join(ROOT, 'public')});
const composition = await selectComposition({serveUrl, id});
for (const f of frames.split(',').map(Number)) {
  await renderStill({composition, serveUrl, frame: f, scale: Number(scale), output: path.join(outDir, `${id}-${String(f).padStart(4, '0')}.png`)});
  console.log('still', f);
}
process.exit(0);
