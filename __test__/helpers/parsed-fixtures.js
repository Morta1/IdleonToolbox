import '../../polyfills';
import { parseData } from '@parsers/index';

/**
 * `parseData` runs serializeData three times over every section - it is by far the most expensive
 * thing in the unit suite. Seven test files each declared their own `parseEmpty`/`parseFixture`
 * helper and called it once PER TEST, so a single file re-parsed the same five fixtures dozens of
 * times. That was ~160s of the run.
 *
 * These memoize on the fixture object's identity, so each fixture is parsed once per test file
 * (vitest isolates workers per file, so cross-file sharing isn't possible).
 *
 * The parsed result is therefore SHARED between tests in a file. Treat it as read-only: a test that
 * mutates it would leak into every later test. If you need to mutate, call `parseData` directly.
 */

const cache = new WeakMap();
let emptyResult;

export const parseEmpty = () => (emptyResult ??= parseData(undefined, [], null, null, undefined, undefined, null));

export const parseFixture = (fixture) => {
  if (cache.has(fixture)) return cache.get(fixture);
  const data = fixture.data ?? fixture;
  const result = parseData(
    data,
    fixture.charNames ?? [],
    fixture.companion ?? null,
    fixture.guildData ?? null,
    fixture.serverVars
  );
  cache.set(fixture, result);
  return result;
};
