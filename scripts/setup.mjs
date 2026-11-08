#!/usr/bin/env node
// Prepares everything the video kit needs locally. Nothing produced here is committed.
//
//   npm run setup                      extract MC textures + sounds, copy fonts and BGM
//   npm run setup -- --mc 26.3         pick a Minecraft version (default: newest found)
//   npm run setup -- --jar <path>      use a specific client jar
//   npm run setup -- --with-refs       also clone the reference template repos into vendor/
//
// Minecraft assets are Mojang's: they are read from the local game / Gradle cache and stay
// out of git. Fail loudly when something is missing instead of producing a half-empty kit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {unzipSync} from 'fflate';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REPO = path.resolve(ROOT, '..', '..', '..', 'Oriel-UI'); // the mod repo (fonts and Ore textures are copied from it)
const PUBLIC = path.join(ROOT, 'public');
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const die = (msg) => {
  console.error(`setup: ${msg}`);
  process.exit(1);
};

// ---------------------------------------------------------------- 1. Minecraft client jar
const LOOM = path.join(os.homedir(), '.gradle', 'caches', 'fabric-loom');
const DOT_MC = path.join(process.env.APPDATA ?? path.join(os.homedir(), '.minecraft'), '.minecraft');

const versionKey = (v) => v.split(/[.-]/).map((n) => Number(n) || 0);
const newestFirst = (a, b) => {
  const x = versionKey(a);
  const y = versionKey(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0);
  }
  return 0;
};

function findJar() {
  const explicit = arg('--jar');
  if (explicit) {
    if (!fs.existsSync(explicit)) die(`--jar not found: ${explicit}`);
    return {jar: explicit, version: arg('--mc') ?? 'custom'};
  }
  const wanted = arg('--mc');
  const candidates = [];
  if (fs.existsSync(LOOM)) {
    for (const v of fs.readdirSync(LOOM)) {
      const jar = path.join(LOOM, v, 'minecraft-client.jar');
      if (fs.existsSync(jar)) candidates.push({jar, version: v});
    }
  }
  const versions = path.join(DOT_MC, 'versions');
  if (fs.existsSync(versions)) {
    for (const v of fs.readdirSync(versions)) {
      const jar = path.join(versions, v, `${v}.jar`);
      if (fs.existsSync(jar)) candidates.push({jar, version: v});
    }
  }
  if (candidates.length === 0) {
    die(`no Minecraft client jar found in ${LOOM} or ${versions}. Run a Gradle build once, or pass --jar.`);
  }
  if (wanted) {
    const hit = candidates.find((c) => c.version === wanted);
    if (!hit) die(`version ${wanted} not found; available: ${candidates.map((c) => c.version).join(', ')}`);
    return hit;
  }
  return candidates.sort((a, b) => newestFirst(a.version, b.version))[0];
}

// Texture folders worth having for videos. Keep this list explicit so the kit stays small.
const TEXTURE_PREFIXES = [
  'item/',
  'block/',
  'particle/',
  'misc/',
  'entity/',
  'gui/container/',
  'gui/title/',
  'gui/sprites/hud/',
  'gui/sprites/widget/',
  'gui/sprites/toast/',
  'gui/sprites/container/',
  'font/',
  'environment/',
];

function extractTextures({jar, version}) {
  console.log(`setup: reading ${jar} (Minecraft ${version})`);
  const base = 'assets/minecraft/textures/';
  const files = unzipSync(fs.readFileSync(jar), {
    filter: (f) => f.name.startsWith(base) && TEXTURE_PREFIXES.some((p) => f.name.startsWith(base + p)),
  });
  const out = path.join(PUBLIC, 'mc', 'textures');
  // Overwrite in place rather than deleting the folder first: on Windows a shell or the
  // Studio file watcher sitting in the folder makes rmSync fail with EPERM.
  let n = 0;
  for (const [name, data] of Object.entries(files)) {
    if (name.endsWith('/')) continue;
    const dest = path.join(out, name.slice(base.length));
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, data);
    n++;
  }
  if (n === 0) die('the jar contained no textures under assets/minecraft/textures');
  // Manifest of item sprites and block faces, so components can tell an item from a block
  // (block items like oak_planks have no item/ sprite) and fail loudly on unknown ids.
  // Built from the jar listing, not the folder, so stale files from another version don't leak in.
  const names = (dir) =>
    Object.keys(files)
      .filter((f) => f.startsWith(`${base}${dir}/`) && f.endsWith('.png') && !f.slice(base.length + dir.length + 1).includes('/'))
      .map((f) => f.slice(base.length + dir.length + 1, -4))
      .sort();
  fs.writeFileSync(path.join(PUBLIC, 'mc', 'manifest.json'), JSON.stringify({version, items: names('item'), blocks: names('block')}));
  console.log(`setup: ${n} texture files -> public/mc/textures`);
}

// ---------------------------------------------------------------- 2. Sounds (asset index)
// Sounds are not in the jar; they live in the hashed asset store. Names are without ".ogg".
const SOUNDS = [
  'random/pop',
  'random/orb',
  'random/levelup',
  'random/click',
  'random/anvil_use',
  'block/smithing_table/smithing_table1',
  'block/smithing_table/smithing_table2',
  'block/furnace/fire_crackle1',
  'block/chest/open',
  'item/armor/equip_netherite1',
  'fire/ignite',
  'dig/wood1',
  'dig/stone1',
  'step/grass1',
  'step/grass2',
  'step/grass3',
  'step/grass4',
  'ui/toast/in',
  'ui/toast/out',
  'ui/toast/challenge_complete',
  'ui/loom/take_result1',
  'ui/stonecutter/cut1',
  'ambient/weather/thunder1',
  'random/fuse',
  'random/explode1',
  'random/explode2',
  'random/explode3',
  'random/anvil_land',
  'dig/stone2',
  'dig/stone3',
  'dig/stone4',
  'dig/gravel1',
  'item/armor/equip_leather1',
  'mob/villager/idle2','mob/villager/yes1','mob/villager/yes2','mob/villager/yes3','mob/villager/no1',
  'item/book/open_flip1','item/book/open_flip2','item/book/close_put1','portal/travel','block/chest/close1',
];

function findAssetStore(version) {
  const roots = [path.join(LOOM, 'assets'), path.join(DOT_MC, 'assets')];
  for (const root of roots) {
    const idx = path.join(root, 'indexes');
    if (!fs.existsSync(idx)) continue;
    const all = fs.readdirSync(idx).filter((f) => f.endsWith('.json'));
    const exact = all.filter((f) => f.startsWith(`${version}-`) || f === `${version}.json`);
    const pick = (exact.length ? exact : all).sort(newestFirst)[0];
    if (pick) return {index: path.join(idx, pick), objects: path.join(root, 'objects')};
  }
  return null;
}

function copySounds(version) {
  const store = findAssetStore(version);
  if (!store) die('no Minecraft asset index found (needed for sounds). Launch the game or a Gradle runClient once.');
  const index = JSON.parse(fs.readFileSync(store.index, 'utf8')).objects;
  const out = path.join(PUBLIC, 'mc', 'sounds');
  const missing = [];
  for (const s of SOUNDS) {
    const entry = index[`minecraft/sounds/${s}.ogg`];
    const src = entry && path.join(store.objects, entry.hash.slice(0, 2), entry.hash);
    if (!src || !fs.existsSync(src)) {
      missing.push(s);
      continue;
    }
    const dest = path.join(out, `${s}.ogg`);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.copyFileSync(src, dest);
  }
  if (missing.length) die(`sounds missing from ${store.index}: ${missing.join(', ')}`);
  console.log(`setup: ${SOUNDS.length} sounds -> public/mc/sounds (index ${path.basename(store.index)})`);
}

// ---------------------------------------------------------------- 3. Fonts (from kit/, OFL)
const FONTS = [
  ['fusion_pixel_12.ttf', 'fusion-pixel-OFL.txt'],
  ['fusion_pixel_8.ttf', 'fusion-pixel-OFL.txt'],
  ['smiley_sans_oblique.ttf', null],
];

function copyFonts() {
  const fontDir = path.join(REPO, 'kit', 'src', 'main', 'resources', 'assets', 'oriel', 'font');
  const licDir = path.join(REPO, 'kit', 'src', 'main', 'resources', 'META-INF', 'licenses', 'fonts');
  const out = path.join(PUBLIC, 'fonts');
  if (!fs.existsSync(fontDir)) {
    console.log('setup: fonts are bundled in public/fonts (OFL), nothing to copy');
    return;
  }
  fs.mkdirSync(out, {recursive: true});
  for (const [font, lic] of FONTS) {
    const src = path.join(fontDir, font);
    if (!fs.existsSync(src)) die(`font not found: ${src}`);
    fs.copyFileSync(src, path.join(out, font));
    if (lic && fs.existsSync(path.join(licDir, lic))) fs.copyFileSync(path.join(licDir, lic), path.join(out, lic));
  }
  console.log(`setup: ${FONTS.length} fonts -> public/fonts`);
}

// ---------------------------------------------------------------- 4. BGM (video-shotcraft skill)
function copyBgm() {
  const src = path.join(os.homedir(), '.claude', 'skills', 'video-shotcraft', 'assets', 'audio', 'bgm');
  const out = path.join(PUBLIC, 'audio', 'bgm');
  if (!fs.existsSync(src)) {
    console.warn(`setup: WARNING no BGM source at ${src}; put your own mp3 into public/audio/bgm/`);
    return;
  }
  fs.mkdirSync(out, {recursive: true});
  const files = fs.readdirSync(src).filter((f) => f.endsWith('.mp3'));
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(out, f));
  console.log(`setup: ${files.length} BGM tracks -> public/audio/bgm (Mixkit free licence, see video-shotcraft ATTRIBUTION.md)`);
}

// ---------------------------------------------------------------- 4b. Oriel's own Ore theme textures (drawn by us, not Mojang's)
function copyOre() {
  const src = path.join(REPO, 'kit', 'src', 'main', 'resources', 'assets', 'oriel', 'textures', 'ore');
  const out = path.join(PUBLIC, 'oriel', 'ore');
  if (!fs.existsSync(src)) {
    console.log('setup: Ore textures are bundled in public/oriel/ore, nothing to copy');
    return;
  }
  fs.mkdirSync(out, {recursive: true});
  const files = fs.readdirSync(src).filter((f) => f.endsWith('.png'));
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(out, f));
  console.log(`setup: ${files.length} Ore textures -> public/oriel/ore`);
}

// ---------------------------------------------------------------- 4c. Sound effects (video-shotcraft template, Mixkit)
// Only files whose Mixkit Free License record is traceable (see the skill's template/public/audio/ATTRIBUTION.md).
const SFX = ['impact-cine.mp3', 'whoosh-fast.mp3', 'transition-snap.mp3', 'transition-soft.mp3'];

function copySfx() {
  const src = path.join(os.homedir(), '.claude', 'skills', 'video-shotcraft', 'template', 'public', 'audio');
  const out = path.join(PUBLIC, 'audio', 'sfx');
  if (!fs.existsSync(src)) {
    console.warn(`setup: WARNING no SFX source at ${src}; clips that use sfx() will fail to load audio`);
    return;
  }
  fs.mkdirSync(out, {recursive: true});
  for (const f of SFX) fs.copyFileSync(path.join(src, f), path.join(out, f));
  console.log(`setup: ${SFX.length} sound effects -> public/audio/sfx (Mixkit Free License)`);
}

// ---------------------------------------------------------------- 5. Optional reference repos
const REFS = [
  // Official Remotion agent skills (best practices for writing Remotion code)
  ['https://github.com/remotion-dev/skills.git', 'remotion-skills'],
  // Single-file Remotion effects (transitions, text, carousels) - read, adapt, do not copy blindly
  ['https://github.com/reactvideoeditor/remotion-templates.git', 'reactvideoeditor-templates'],
  ['https://github.com/Thedurancode/locomotion-templates.git', 'locomotion-templates'],
  // Browser Minecraft crafting UI, reference for slot/drag behaviour
  ['https://github.com/EnhancedJax/minecraft-react-crafting.git', 'minecraft-react-crafting'],
];

function cloneRefs() {
  const vendor = path.join(ROOT, 'vendor');
  fs.mkdirSync(vendor, {recursive: true});
  for (const [url, dir] of REFS) {
    const dest = path.join(vendor, dir);
    if (fs.existsSync(dest)) {
      console.log(`setup: vendor/${dir} already present`);
      continue;
    }
    const r = spawnSync('git', ['clone', '--depth', '1', url, dest], {stdio: 'inherit'});
    if (r.status !== 0) console.warn(`setup: WARNING could not clone ${url} (network?). Retry later.`);
  }
}

const mc = findJar();
extractTextures(mc);
copySounds(mc.version);
copyFonts();
copyBgm();
copyOre();
copySfx();
if (args.includes('--with-refs')) cloneRefs();
console.log('setup: done. Next: npm run dev  (Remotion Studio)');
