// `npm run parse:golden:worker`: runs the built parse worker bundle (public/workers/, named in .worker-manifest.json) on the
// fixtures and compares it with the golden output. Catches what the source-level golden run can't:
// a bundle missing a global the app sets up (the polyfills), or an alias resolving to other code.
// Run `node utility/build-worker.mjs` and `npm run parse:golden` first.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { clonePlain, diffValues } from './snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FROZEN = new Date('2026-01-01T12:00:00Z').getTime(); // same instant as golden.test.mjs
const { parse } = JSON.parse(fs.readFileSync(path.join(ROOT, '.worker-manifest.json'), 'utf8'));
const code = fs.readFileSync(path.join(ROOT, 'public/workers', parse.file), 'utf8');
const fixtures = fs.readdirSync(path.join(ROOT, '__test__/fixtures')).filter((f) => f.endsWith('.json'));

const RealDate = globalThis.Date;
let failed = 0;
for (const file of fixtures) {
  let message;
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [FROZEN])); }
    static now() { return FROZEN; }
  };
  globalThis.self = { postMessage: (m) => { message = m; } };
  vm.runInThisContext(code);
  const fx = JSON.parse(fs.readFileSync(path.join(ROOT, '__test__/fixtures', file), 'utf8'));
  globalThis.self.onmessage({ data: { id: 1, args: [fx.data ?? fx, fx.charNames ?? [], fx.companion ?? null, fx.guildData ?? null, fx.serverVars] } });
  globalThis.Date = RealDate;
  if (message?.version !== parse.version) {
    failed++;
    console.log(`${file}: worker reports version ${message?.version}, manifest says ${parse.version}`);
    continue;
  }
  if (message?.error) {
    failed++;
    console.log(`${file}: worker threw: ${message.error}`);
    continue;
  }
  // postMessage structured-clones the result (Infinity and NaN survive, unlike JSON).
  const golden = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, '.golden', `${file}.gz`))));
  const diff = diffValues(golden, clonePlain(structuredClone(message.result)), 5);
  if (diff.count) failed++;
  console.log(`${file}: ${diff.count ? `${diff.count} changed values ${JSON.stringify(diff.samples)}` : 'identical'}`);
}
process.exit(failed ? 1 : 0);
