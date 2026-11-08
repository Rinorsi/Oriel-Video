// Merge src/lib/catalog/*.json -> src/lib/catalog.json and verify that every entry's `export` really exists in src/lib/*.ts(x).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'src', 'lib', 'catalog');
const libDir = path.join(ROOT, 'src', 'lib');
const src = fs
  .readdirSync(libDir)
  .filter((f) => /\.tsx?$/.test(f))
  .map((f) => fs.readFileSync(path.join(libDir, f), 'utf8'))
  .join('\n');
const all = [];
let bad = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const list = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const e of list) {
    const re = new RegExp(`export\\s+(const|function|class)\\s+${e.export}\\b|export\\s*\\{[^}]*\\b${e.export}\\b`);
    if (!re.test(src)) {
      console.error(`MISSING export "${e.export}" for ${e.id} (${f})`);
      bad++;
    }
    if (!e.example || !e.usage || !e.blurb) {
      console.error(`INCOMPLETE entry ${e.id} (${f}): needs blurb, usage, example`);
      bad++;
    }
    all.push({...e, group: f.replace('.json', '')});
  }
}
fs.writeFileSync(path.join(libDir, 'catalog.json'), JSON.stringify(all, null, 2));
console.log(`catalog: ${all.length} entries, ${bad} problems`);
process.exit(bad ? 1 : 0);
