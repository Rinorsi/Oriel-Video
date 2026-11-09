#!/usr/bin/env node
// Render a composition to ignored out/ or VIDEO_OUT.
//
//   npm run render                       -> complete library example
//   npm run render -- MyVideo --entry src/my-video-entry.tsx
//   npm run render -- T-Loading          -> one template
//   npm run render -- NetheriteSword --frames 0-120
//   npm run render -- NetheriteSword --stills 30,200,400   (quick contact sheet frames)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.VIDEO_OUT ?? path.join(ROOT, 'out');
fs.mkdirSync(outDir, {recursive: true});

const args = process.argv.slice(2);
const id = args[0] && !args[0].startsWith('--') ? args.shift() : 'lib-example-episode';
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const remotion = (cliArgs) => {
  const cli = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
  const r = spawnSync(process.execPath, [cli, ...cliArgs], {cwd: ROOT, stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (!fs.existsSync(path.join(ROOT, 'public', 'mc', 'textures'))) {
  console.error('render: public/mc is missing. Run `npm run setup` first.');
  process.exit(1);
}

const stills = opt('--stills');
const entry = opt('--entry') ?? (id.startsWith('lib-') ? 'src/lib-entry.tsx' : 'src/index.ts');
if (stills) {
  for (const f of stills.split(',')) {
    remotion(['still', entry, id, path.join(outDir, `${id}-f${f}.png`), `--frame=${f}`]);
  }
  process.exit(0);
}

const frames = opt('--frames');
const base = ['render', entry, id];
const extra = frames ? [`--frames=${frames}`] : [];
remotion([...base, path.join(outDir, `${id}.mp4`), ...extra]);
if (id === 'NetheriteSword' && !frames) {
  remotion([...base, path.join(outDir, `${id}-noBGM.mp4`), '--props={"withBgm":false}']);
}
console.log(`render: output in ${outDir}`);
