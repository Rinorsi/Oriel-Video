#!/usr/bin/env node
// Effect gallery tooling. Everything is written to the workspace (never into the repo).
//
//   node scripts/fx.mjs sheet <area|all> [id,id]      6-frame review sheets (one PNG per effect)
//   node scripts/fx.mjs previews <area|all> [id,id]   half-size mp4 + poster for the gallery, updates manifest.json
//   node scripts/fx.mjs html                          rebuild gallery/index.html from manifest.json
//   node scripts/fx.mjs export <id> [--alpha]         full-quality mp4, or ProRes 4444 .mov with transparency
//
//   node scripts/fx.mjs frame <area> <id> <n,n,..>   half-size stills of single frames (add --alpha for the transparent layer)
//
// <area> is one of: core cute trans2 map dim social item info mcdkit mcdscene mcd1 mcd2 mcd3 mcd4 mcd5 atmo all   (see src/entry-*.tsx)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const day = new Date().toISOString().slice(0, 10);
const BASE = process.env.FX_OUT ?? path.join(ROOT, 'out', 'fx');
const GAL = process.env.FX_GALLERY ?? path.join(ROOT, 'gallery');
const SHEETS = path.join(BASE, 'fx-sheets');
void day;

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n) => rest.includes(n);
const pos = rest.filter((a) => !a.startsWith('--'));

const bundleFor = async (area) => {
  const entry = path.join(ROOT, 'src', `entry-${area}.tsx`);
  if (!fs.existsSync(entry)) throw new Error(`unknown area "${area}" (no ${entry})`);
  return bundle({entryPoint: entry, publicDir: path.join(ROOT, 'public')});
};

const pick = async (serveUrl, ids) => {
  const comps = await getCompositions(serveUrl);
  const demos = comps.filter((c) => c.id.startsWith('fx-') && !c.id.endsWith('-alpha'));
  return ids ? demos.filter((c) => ids.includes(c.id.slice(3))) : demos;
};

const manifestPath = path.join(GAL, 'manifest.json');
const readManifest = () => (fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {});

if (cmd === 'sheet') {
  const area = pos[0] ?? 'all';
  const ids = pos[1]?.split(',');
  fs.mkdirSync(SHEETS, {recursive: true});
  const serveUrl = await bundleFor(area);
  for (const c of await pick(serveUrl, ids)) {
    const id = c.id.slice(3);
    const composition = await selectComposition({serveUrl, id: `sheet-${id}`});
    const output = path.join(SHEETS, `${id}.png`);
    await renderStill({composition, serveUrl, output, scale: 1});
    console.log('sheet', output);
  }
} else if (cmd === 'previews') {
  const area = pos[0] ?? 'all';
  const ids = pos[1]?.split(',');
  fs.mkdirSync(path.join(GAL, 'previews'), {recursive: true});
  const serveUrl = await bundleFor(area);
  const all = await getCompositions(serveUrl);
  const manifest = readManifest();
  for (const c of await pick(serveUrl, ids)) {
    const id = c.id.slice(3);
    const composition = await selectComposition({serveUrl, id: c.id});
    const mp4 = path.join(GAL, 'previews', `${id}.mp4`);
    await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: mp4, scale: 0.5, crf: 26, concurrency: 4});
    await renderStill({composition, serveUrl, frame: Math.round(composition.durationInFrames * 0.45), output: path.join(GAL, 'previews', `${id}.jpg`), imageFormat: 'jpeg', scale: 0.5});
    manifest[id] = {...c.defaultProps.meta, frames: composition.durationInFrames, alpha: all.some((x) => x.id === `${c.id}-alpha`)};
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('preview', id);
  }
} else if (cmd === 'frame') {
  // frame <area> <id> <n,n,...>  -> half-size PNG stills of the demo (or id-alpha with --alpha)
  const [area, id, list] = pos;
  fs.mkdirSync(SHEETS, {recursive: true});
  const serveUrl = await bundleFor(area);
  const composition = await selectComposition({serveUrl, id: `fx-${id}${flag('--alpha') ? '-alpha' : ''}`});
  for (const n of list.split(',').map(Number)) {
    const output = path.join(SHEETS, `${id}-f${String(n).padStart(4, '0')}.png`);
    await renderStill({composition, serveUrl, frame: n, output, scale: 0.5});
    console.log('frame', output);
  }
} else if (cmd === 'export') {
  const id = pos[0];
  const alpha = flag('--alpha');
  const serveUrl = await bundleFor('all');
  const composition = await selectComposition({serveUrl, id: `fx-${id}${alpha ? '-alpha' : ''}`});
  const dir = path.join(BASE, 'fx-export');
  fs.mkdirSync(dir, {recursive: true});
  if (alpha) {
    const out = path.join(dir, `${id}-alpha.mov`);
    await renderMedia({composition, serveUrl, codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png', outputLocation: out});
    console.log('exported', out);
  } else {
    const out = path.join(dir, `${id}.mp4`);
    await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out});
    console.log('exported', out);
  }
} else if (cmd === 'html') {
  const { buildGallery } = await import('./gallery-html.mjs');
  buildGallery({ROOT, GAL, manifest: readManifest()});
  console.log('gallery', path.join(GAL, 'index.html'));
} else {
  console.error('usage: node scripts/fx.mjs sheet|previews|html|export ...');
  process.exit(1);
}
process.exit(0);
