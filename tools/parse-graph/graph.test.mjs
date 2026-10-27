import fs from 'node:fs';
import path from 'node:path';
import '../../polyfills';
import { parseData } from '@parsers/index';
import { clonePlain, diffValues } from '../parse-golden/snapshot.mjs';
import { createRecorder } from './recorder.mjs';
import { writeReport } from './report.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FIXTURES = path.join(ROOT, '__test__/fixtures');
const OUT = path.join(ROOT, '.parse-graph');
const DEP_FIXTURES = (process.env.PG_FIXTURES || 'latest.json,third.json').split(',');
const CONVERGE_FIXTURES = (process.env.PG_CONVERGE || 'latest.json,highend.json,third.json').split(',');
const EXTRA_PASSES = 2;

const load = (f) => JSON.parse(fs.readFileSync(path.join(FIXTURES, f), 'utf8'));
const parse = (fx, options) => parseData(fx.data ?? fx, fx.charNames ?? [], fx.companion ?? null, fx.guildData ?? null, fx.serverVars, undefined, null, options);
const PG = (globalThis.__PG = {});
const results = { convergence: {}, transparency: {} };

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  fs.mkdirSync(OUT, { recursive: true });
});
afterAll(() => {
  vi.useRealTimers();
  writeReport(OUT, fs.readFileSync(path.join(ROOT, 'parsers/index.ts'), 'utf8').split(/\r?\n/), results);
});

describe('convergence', () => {
  it.each(CONVERGE_FIXTURES)('%s', (file) => {
    const snaps = [];
    PG.passEnd = (pass, pd) => { snaps[pass] = clonePlain({ account: pd.accountData, characters: pd.charactersData }); };
    parse(load(file), { passes: 3 + EXTRA_PASSES });
    PG.passEnd = undefined;
    results.convergence[file] = snaps.slice(1).map((s, i) => {
      const d = diffValues(snaps[i], s, 0);
      return { from: i + 1, to: i + 2, changed: d.count, sections: d.groups };
    });
  });
});

describe('dependencies', () => {
  it.each(DEP_FIXTURES)('%s', (file) => {
    const fx = load(file);
    const plain = clonePlain(parse(fx));
    const recorder = createRecorder();
    Object.assign(PG, recorder.hooks);
    const result = parse(fx);
    try {
      structuredClone(result);
      (results.cloneable ??= {})[file] = 'ok';
    } catch (e) {
      (results.cloneable ??= {})[file] = e.message.slice(0, 200);
    }
    results.holders = [...new Set([...(results.holders ?? []), ...recorder.findHolders(result)])];
    const instrumented = clonePlain(result);
    for (const k of Object.keys(recorder.hooks)) delete PG[k];
    results.deps = recorder.merge(results.deps);
    // The proxies must not change a single value, or the graph describes a different parse.
    results.transparency[file] = diffValues(plain, instrumented).count;
  });
});
