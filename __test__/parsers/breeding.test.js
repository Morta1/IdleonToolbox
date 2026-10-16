import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getBreeding, calcHighestPower, getCombatMixGeneMulti } from '@parsers/world-4/breeding';
import { petGenes, petStats } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const TOTAL_PETS = petStats.reduce((sum, world) => sum + world.length, 0);

describe('getBreeding', () => {
  it('returns every live pet species per world when the save is missing', () => {
    const { pets } = getBreeding(undefined, {}, {});
    expect(pets.reduce((sum, world) => sum + world.length, 0)).toBe(TOTAL_PETS);
    pets.forEach((world) => world.forEach((pet) => expect(pet.level).toBe(0)));
    expect(pets[0][0].monsterName).toBe('Green_Mushroom');
  });
});

describe('calcHighestPower', () => {
  it('returns 0 when breeding, or all of rawFencePets/territories/storedPets, is missing', () => {
    expect(calcHighestPower(undefined)).toBe(0);
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

// N.js TotalTrekkingHR: gene 14 (Flashy) multiplies by 1.5 per Flashy when no slot holds a combat pet (PetGenes[g][1] == 0,
// "none" slots skipped), gene 13 (Fastidious) by 1.5 per Fastidious when one does.
describe('getCombatMixGeneMulti', () => {
  const pet = (gene) => ({ name: 'mushG', gene: petGenes.find(({ name }) => name === gene) });
  const empty = { name: 'none', gene: petGenes[0] };
  it.each([
    ['Fastidious beside a combat pet', [pet('Fastidious'), pet('Fastidious'), pet('Fighter'), empty], 2.25],
    ['Fastidious with no combat pet', [pet('Fastidious'), pet('Forager'), empty, empty], 1],
    ['Flashy with no combat pet, empty slots aside', [pet('Flashy'), pet('Forager'), empty, empty], 1.5],
    ['Flashy beside a combat pet', [pet('Flashy'), pet('Fighter'), empty, empty], 1]
  ])('%s', (_label, team, multi) => {
    expect(getCombatMixGeneMulti(team)).toBe(multi);
  });
});
