import '../../polyfills';
import { parseData } from '@parsers/index';
import { clonePlain } from '../../tools/parse-golden/snapshot.mjs';
import latest from '../fixtures/latest.json';
import highend from '../fixtures/highend.json';

const parse = (fx, passes) =>
  clonePlain(parseData(fx.data ?? fx, fx.charNames ?? [], fx.companion ?? null, fx.guildData ?? null, fx.serverVars, undefined, null, { passes }));

describe('parse passes', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });
  afterAll(() => vi.useRealTimers());

  it.each([['latest', latest], ['highend', highend]])('%s: a 4th pass changes nothing', (_, fx) => {
    expect(parse(fx, 4)).toEqual(parse(fx));
  });
});
