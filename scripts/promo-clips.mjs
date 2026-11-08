#!/usr/bin/env node
// Render a list of gallery effects at full quality into one folder (reusing a single bundle).
//   node scripts/promo-clips.mjs <outDir> id,id,...
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [outDir, idList] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'entry-all.tsx'), publicDir: path.join(ROOT, 'public')});
const ids = idList.split(',');
let next = 0;
const worker = async () => {
  while (next < ids.length) {
    const id = ids[next++];
    const out = path.join(outDir, `${id}.mp4`);
    if (fs.existsSync(out)) continue;
    try {
      const composition = await selectComposition({serveUrl, id: `fx-${id}`});
      await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, crf: 16});
      console.log('ok', id);
    } catch (e) {
      console.log('FAIL', id, String(e).slice(0, 200));
    }
  }
};
await Promise.all([worker(), worker()]);
console.log('ALL DONE');
process.exit(0);
