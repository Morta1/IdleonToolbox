import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getBreeding, calcHighestPower } from '@parsers/world-4/breeding';
import { petStats } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

// petStats is a catalog imported directly from website-data, not from the save, so the pet list
// was already catalog-driven before Task 6 - this test locks that in and covers the neutral-default
// fix (level/shinyProgress/breedingProgress now default to 0 instead of undefined when unsaved).
const TOTAL_PETS = petStats.reduce((sum, world) => sum + world.length, 0);

describe('getBreeding', () => {
  it('returns every live pet species per world when the save is missing', () => {
    const { pets } = getBreeding(undefined, {}, {});
    expect(pets.reduce((sum, world) => sum + world.length, 0)).toBe(TOTAL_PETS);
    pets.forEach((world) => world.forEach((pet) => expect(pet.level).toBe(0)));
  });

  it('carries catalog fields through', () => {
    const { pets } = getBreeding(undefined, {}, {});
    expect(pets[0][0].monsterName).toBe('Green_Mushroom');
  });
});

describe('calcHighestPower', () => {
  // Regression: `rawFencePets` is undefined when breeding never ran (no save), which used to make
  // `fence` undefined too and crash `Math.max(...mappedPets, ...fence)` - spreading `undefined` is
  // not iterable. Pre-existing bug, reproduces identically before and after Task 6; fixed here as a
  // folded-in Task 7 item since it's exactly the class of crash this plan removes.
  it('does not throw and returns 0 when breeding is undefined', () => {
    expect(() => calcHighestPower(undefined)).not.toThrow();
    expect(calcHighestPower(undefined)).toBe(0);
  });

  it('does not throw when rawFencePets/territories/storedPets are all missing', () => {
    expect(() => calcHighestPower({})).not.toThrow();
    expect(calcHighestPower({})).toBe(0);
  });

  it('still returns the real highest power across teams/storage/fence', () => {
    const breeding = {
      territories: [{ team: [{ power: 5 }, { power: 12 }] }],
      storedPets: [{ power: 20 }],
      rawFencePets: [['a', 0, 7], ['b', 0, 30]]
    };
    expect(calcHighestPower(breeding)).toBe(30);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getBreeding fixture regression', () => {
  it.each(FIXTURES)('%s: pet levels the save covers are unchanged at the same [world][pet] index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const breedingRaw = tryToParse(data?.Breeding) || data?.Breeding;
    const petsLevels = breedingRaw?.slice(4, 8);
    const { pets } = getBreeding(data, {}, {});

    petsLevels?.forEach((worldLevels, worldIndex) => {
      worldLevels?.forEach((level, petIndex) => {
        if (!pets[worldIndex]?.[petIndex]) return;
        expect(pets[worldIndex][petIndex].level).toBe(level);
      });
    });
  });

  it.each(FIXTURES)('%s: returns every live pet species regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { pets } = getBreeding(data, {}, {});
    expect(pets.reduce((sum, world) => sum + world.length, 0)).toBe(TOTAL_PETS);
  });
});
