// Builds the static online gallery page into <dir> (needs <dir>/manifest.json and <dir>/previews/).
// usage: node scripts/build-site.mjs <dir>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGallery} from './gallery-html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAL = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !fs.existsSync(path.join(GAL, 'manifest.json'))) {
  console.error('usage: node scripts/build-site.mjs <dir>  (dir must contain manifest.json and previews/)');
  process.exit(1);
}
buildGallery({ROOT, GAL, manifest: JSON.parse(fs.readFileSync(path.join(GAL, 'manifest.json'), 'utf8'))});
fs.writeFileSync(path.join(GAL, '.nojekyll'), '');
console.log('built', path.join(GAL, 'index.html'));
