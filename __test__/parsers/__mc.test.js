import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getSpeedrunRoute } from '@parsers/class-specific/speedrun';
import highend from '../fixtures/highend.json';
let account, characters, character;
beforeAll(() => {
  const { data, charNames, companion, guildData, serverVars } = highend;
  const p = parseData(data, charNames, companion, guildData, serverVars);
  account = p.account; characters = p.characters; character = p.characters[0];
});
describe('counts', () => { it('logs', () => {
  const r = getSpeedrunRoute(account, characters, character);
  const maps = new Set(r.map(p => p.mapIndex));
  const byWorld = {};
  const mapsByWorld = {};
  r.forEach(p => {
    const w = Math.floor(p.mapIndex / 50) + 1;
    byWorld[w] = (byWorld[w] || 0) + 1;
    (mapsByWorld[w] = mapsByWorld[w] || new Set()).add(p.mapIndex);
  });
  console.log('PORTALS', r.length, 'MAPS', maps.size);
  console.log('portals/world', JSON.stringify(byWorld));
  console.log('maps/world', JSON.stringify(Object.fromEntries(Object.entries(mapsByWorld).map(([k, v]) => [k, v.size]))));
  console.log('multi-portal maps', r.filter(p => p.portalCount > 1).length / 2);
  expect(r.length).toBeGreaterThan(0);
}); });
