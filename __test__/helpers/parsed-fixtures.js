import '../../polyfills';
import { parseData } from '@parsers/index';


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
