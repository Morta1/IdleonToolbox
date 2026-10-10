import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMaxDamage } from '@parsers/damage';
import { getMiningEff, getMiningEffBreakdown } from '@parsers/efficiency';

describe('mining efficiency breakdown', () => {
  const { account, characters } = parseFixture(latest);
  const lines = ({ sources = [], subSections = [] }) => [...sources, ...subSections.flatMap((sub) => sub.sources)];
  const sum = (category) => lines(category).reduce((total, { value }) => total + value, 0);

  // 12 + base power * multipliers; "Mining power" is reference only
  it.each(characters.map(({ name }) => name))('%s reproduces the value', (name) => {
    const character = characters.find((entry) => entry.name === name);
    const playerInfo = getMaxDamage(character, characters, account);
    const { categories } = getMiningEffBreakdown(character, characters, account, playerInfo);
    let total = sum(categories.find(({ name }) => name === 'Base power'));
    for (const category of categories) {
      if (category.name === 'Multiplicative') total *= lines(category).reduce((product, { value }) => product * value, 1);
      if (category.name.startsWith('Additive')) total *= 1 + sum(category);
    }
    total += categories.find(({ name }) => name === 'Flat').sources[0].value;
    expect(total / getMiningEff(character, characters, account, playerInfo)).toBeCloseTo(1, 9);
  });
});
