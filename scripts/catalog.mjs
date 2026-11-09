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
fs.writeFileSync(path.join(ROOT, 'docs/catalog.json'), JSON.stringify(all, null, 2));
const clean = (value) => String(value ?? '').replaceAll('|', '&#124;').replaceAll(/\r?\n/g, ' ');
const groups = {transition: '转场', overlay: '叠加层', card: '卡片', title: '标题', scene: '场景', util: '工具'};
const lines = ['# 库目录（自动生成）', '', `> 共 ${all.length} 个库条目。参数、限制与完整示例见 src/lib/catalog.json；用法见 [AI 使用手册](AI使用手册.md)。`, ''];
for (const [kind, title] of Object.entries(groups)) {
  const entries = all.filter(e => e.kind === kind);
  if (!entries.length) continue;
  lines.push(`## ${title}（${entries.length}）`, '', '| 导出名 | 名称 | 时长(帧) | 可叠加 | 用在哪 | 主要参数 |', '|---|---|---|---|---|---|');
  for (const e of entries) lines.push(`| ${clean(e.export)} | ${clean(e.name)} | ${e.frames} | ${e.overlayReady ? '✓' : ''} | ${clean(e.usage)} | ${clean((e.props ?? []).map(p => p.name).join(', '))} |`);
  lines.push('');
}
fs.writeFileSync(path.join(ROOT, 'docs', '库目录.md'), lines.join('\n'));
process.exit(bad ? 1 : 0);
