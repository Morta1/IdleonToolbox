import '../../polyfills';
import { types } from 'node:util';
import { parseData } from '@parsers/index';
import { attachZeroIndexArrays, detachZeroIndexArrays } from '@parsers/zeroIndexArray';
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

  // The parse worker posts its result back. Browsers refuse functions and Proxies there (Node's
  // structuredClone accepts Proxies, so it can't be the check), and zero-index arrays must come back
  // reading missing slots as 0.
  it('the result can be posted out of the worker and restored', () => {
    const result = parseData(latest.data, latest.charNames, latest.companion, latest.guildData, latest.serverVars);
    const paths = detachZeroIndexArrays(result);
    const offenders = [];
    const walk = (v, p) => {
      if (typeof v === 'function' || types.isProxy(v)) return void offenders.push(p);
      if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k], `${p}.${k}`));
    };
    walk(result, 'result');
    expect(offenders).toEqual([]);
    attachZeroIndexArrays(result, paths);
    expect(result.account.hole.holesObject.villagersLevels[999]).toBe(0);
  });
});
