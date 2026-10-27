// Inventory of account option (OptLacc) reads: which indices the toolbox reads, where, and which
// already have a name in parsers/accountOptions.ts.
//   node tools/opt-inventory.mjs            summary table
//   node tools/opt-inventory.mjs --json     full data
//   node tools/opt-inventory.mjs 232 89     every read site of those indices, with context
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['parsers', 'components', 'utility', 'hooks', 'pages', 'services'];
const SKIP = /generated-|accountOptions\.ts$/;
const READ = /(?:accountOptions|optionsListAccount)\??\.?\[\s*(\d+)\s*\]/g;

const files = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : files(p);
    return /\.(jsx?|tsx?)$/.test(e.name) && !SKIP.test(e.name) ? [p] : [];
  });

const named = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'parsers/accountOptions.ts'), 'utf8');
  return new Map([...src.matchAll(/^\s+(\w+):\s*(\d+),/gm)].map(([, name, idx]) => [Number(idx), name]));
})();

const sites = new Map();
for (const file of DIRS.flatMap((d) => files(path.join(ROOT, d)))) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((text, i) => {
    for (const m of text.matchAll(READ)) {
      const idx = Number(m[1]);
      if (!sites.has(idx)) sites.set(idx, []);
      sites.get(idx).push({ file: path.relative(ROOT, file).replaceAll('\\', '/'), line: i + 1, text: text.trim(), before: lines.slice(Math.max(0, i - 2), i).map((l) => l.trim()) });
    }
  });
}

const args = process.argv.slice(2);
const wanted = args.filter((a) => /^\d+$/.test(a)).map(Number);
if (args.includes('--json')) {
  console.log(JSON.stringify(Object.fromEntries([...sites].map(([k, v]) => [k, { name: named.get(k) ?? null, sites: v }])), null, 1));
} else if (wanted.length) {
  for (const idx of wanted) {
    console.log(`\n## ${idx}${named.has(idx) ? ` (${named.get(idx)})` : ''}`);
    for (const s of sites.get(idx) ?? []) console.log(`${s.file}:${s.line}\n    ${[...s.before, s.text].join('\n    ')}`);
  }
} else {
  const rows = [...sites].sort((a, b) => b[1].length - a[1].length);
  const unnamed = rows.filter(([k]) => !named.has(k));
  console.log(`${rows.length} indices, ${rows.reduce((s, [, v]) => s + v.length, 0)} numeric reads; ${named.size} named, ${unnamed.length} still numeric`);
  for (const [idx, v] of unnamed.slice(0, 40)) console.log(`${String(idx).padStart(4)}  ${v.length}x  ${[...new Set(v.map((s) => s.file))].join(', ')}`);
}
