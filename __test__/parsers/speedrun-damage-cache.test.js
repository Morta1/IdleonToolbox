import '../../polyfills';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getMaxDamage } from '@parsers/damage';
import { mapEnemiesArray } from '@website-data';
import latest from '../fixtures/latest.json';
import highend from '../fixtures/highend.json';

// The speedrun route hands getMaxDamage a shared cache so map-invariant stats are computed once
// per ~200-map sweep. This pins the contract: a cached parse must be identical to a bare one on
// every map, or a secretly map-dependent stat has been cached.
const COMPARED_FIELDS = ['maxDamage', 'minDamage', 'accuracy', 'critChance', 'hitChance',
  'killsPerHour', 'finalKillsPerHour', 'maxHp', 'maxMp', 'movementSpeed', 'critDamage', 'mastery'];

const fightingMaps = Object.entries(mapEnemiesArray ?? {})
  .filter(([, monster]) => monster)
  .map(([mapIndex]) => Number(mapIndex));
// A spread across every world rather than all ~200 maps, to keep the test fast.
const sampledMaps = fightingMaps.filter((_, index) => index % 12 === 0);

const runFixture = (name, fixture) => describe(`${name} fixture`, () => {
  let account;
  let characters;

  beforeAll(() => {
    const parsed = parseData(fixture.data, fixture.charNames ?? [], null, null, fixture.serverVars);
    account = parsed.account;
    characters = parsed.characters;
  });

  it('produces identical damage numbers with and without the shared cache', () => {
    const character = characters?.find(({ class: className }) => className === 'Voidwalker') ?? characters?.[0];
    expect(character).toBeTruthy();
    const shared = {};
    sampledMaps.forEach((mapIndex) => {
      const onMap = { ...character, mapIndex, targetMonster: mapEnemiesArray?.[mapIndex] };
      const bare = getMaxDamage(onMap, characters, account);
      const cached = getMaxDamage(onMap, characters, account, shared);
      COMPARED_FIELDS.forEach((field) => {
        expect(cached[field], `${field} @ map ${mapIndex}`).toEqual(bare[field]);
      });
      expect(cached.killPerkill?.value, `killPerkill @ map ${mapIndex}`).toEqual(bare.killPerkill?.value);
    });
  });
});

runFixture('latest', latest);
runFixture('highend', highend);
