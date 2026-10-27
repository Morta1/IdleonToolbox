import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import '../../polyfills';
import { parseData } from '@parsers/index';
import { clonePlain, diffValues } from './snapshot.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FIXTURES = path.join(ROOT, '__test__/fixtures');
const OUT = path.join(ROOT, '.golden');
const MODE = process.env.GOLDEN_MODE ?? 'write';
const ONLY = process.env.GOLDEN_ONLY;
// Parsers read the clock (timers, daily resets), so every run parses at the same instant.
const FROZEN_NOW = new Date('2026-01-01T12:00:00Z');

const fixtures = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.json') && (!ONLY || f.includes(ONLY)));
const goldenPath = (f) => path.join(OUT, `${f}.gz`);

const parseFixture = (file) => {
  const fx = JSON.parse(fs.readFileSync(path.join(FIXTURES, file), 'utf8'));
  const { account, characters } = parseData(fx.data ?? fx, fx.charNames ?? [], fx.companion ?? null, fx.guildData ?? null, fx.serverVars);
  return clonePlain({ account, characters });
};

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FROZEN_NOW);
  fs.mkdirSync(OUT, { recursive: true });
});
afterAll(() => vi.useRealTimers());

describe(`parse golden (${MODE})`, () => {
  it.each(fixtures)('%s', (file) => {
    const current = parseFixture(file);
    if (MODE === 'write') {
      fs.writeFileSync(goldenPath(file), zlib.gzipSync(JSON.stringify(current)));
      return;
    }
    if (!fs.existsSync(goldenPath(file))) throw new Error(`No golden output for ${file}: run npm run parse:golden first`);
    const golden = JSON.parse(zlib.gunzipSync(fs.readFileSync(goldenPath(file))).toString());
    const diff = diffValues(golden, current);
    if (!diff.count) return;
    const groups = Object.entries(diff.groups).sort((a, b) => b[1] - a[1]).map(([g, n]) => `  ${g}: ${n}`).join('\n');
    const samples = diff.samples.map((s) => `  ${s.path}: ${s.before} -> ${s.after}`).join('\n');
    throw new Error(`${file}: ${diff.count} changed values\nBy section:\n${groups}\nFirst changes:\n${samples}`);
  });
});
