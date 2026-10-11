import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { breakdownLines } from '../helpers/breakdown-tree';
import { evaluateBreakdown } from '@parsers/breakdown';
import { getCashMulti, getClassExpMulti, getDropRate, getRespawnRate } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { getGoldenFoodMulti, getTimeToNextBooks } from '@parsers/misc';

// The character page Stats section and the talents tab. Each breakdown tree, combined the way its
// root says (respawn and library divide, defence and crystal chance add, the rest multiply), must
// rebuild the value the page shows, for every character of every fixture. List groups (remaining
// crystal kills, super talent levels) are display only and never count.
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const FIXTURES = fs.readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => [file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8'))]);

const expectRebuilt = (rebuilt, value) => {
  // A character slot with no class or stats (fourth, fresh) has NaN damage and defence in the
  // formula itself; nan-elimination owns that, the tree can only mirror it
  if (Number.isNaN(value)) return;
  expect(Number.isFinite(rebuilt)).toBe(true);
  if (value === 0) expect(rebuilt).toBeCloseTo(0, 9);
  else expect(rebuilt / value).toBeCloseTo(1, 9);
};

const expectRenderable = (breakdown, value) => {
  if (Number.isNaN(value)) return;
  const bad = breakdownLines(breakdown.tree)
    .filter(({ value }) => typeof value !== 'number' || Number.isNaN(value))
    .map(({ name, value }) => `${name} = ${value}`);
  expect(bad).toEqual([]);
};

describe.each(FIXTURES)('stats breakdowns: %s', (_name, fixture) => {
  const { account, characters } = parseFixture(fixture);
  const cases = characters.map((character) => [character.name, character]);
  if (!cases.length) return;

  it.each(cases)('respawn rate for %s', (_charName, character) => {
    const { respawnRate, breakdown } = getRespawnRate(character, account);
    if (breakdown.tree[0].name === 'Not fighting') return expect(respawnRate).toBe(0);
    expect(breakdown.combine).toBe('divide');
    expectRebuilt(evaluateBreakdown(breakdown), respawnRate);
    expectRenderable(breakdown);
  });

  it.each(cases)('class EXP multi for %s', (_charName, character) => {
    const { value, breakdown } = getClassExpMulti(character, account, characters);
    expectRebuilt(evaluateBreakdown(breakdown), value);
    expectRenderable(breakdown);
  });

  it.each(cases)('drop rate for %s', (_charName, character) => {
    const { dropRate, breakdown } = getDropRate(character, account, characters);
    expectRebuilt(evaluateBreakdown(breakdown), dropRate);
    expectRenderable(breakdown);
  });

  it.each(cases)('damage, cash, defence and kill per kill for %s', (_charName, character) => {
    const playerInfo = getMaxDamage(character, characters, account);
    expectRebuilt(evaluateBreakdown(playerInfo.damageBreakdown), playerInfo.maxDamage);
    expectRenderable(playerInfo.damageBreakdown, playerInfo.maxDamage);

    const { defence, killPerkill } = playerInfo;
    expectRebuilt(evaluateBreakdown(defence.breakdown), defence.value);
    expectRenderable(defence.breakdown, defence.value);

    expectRebuilt(evaluateBreakdown(killPerkill.breakdown), killPerkill.value);
    expectRenderable(killPerkill.breakdown);

    const { cashMulti, breakdown } = getCashMulti(character, account, characters, playerInfo);
    expectRebuilt(evaluateBreakdown(breakdown), cashMulti);
    expectRenderable(breakdown);
  });

  it.each(cases)('golden food multi for %s', (_charName, character) => {
    const { value, breakdown } = getGoldenFoodMulti(character, account, characters);
    expectRebuilt(evaluateBreakdown(breakdown), value);
    expectRenderable(breakdown);
  });

  it.each(cases)('crystal chance for %s', (_charName, character) => {
    const { effectiveValue, breakdown } = character.crystalSpawnChance;
    expectRebuilt(evaluateBreakdown(breakdown), effectiveValue * 100);
    expectRenderable(breakdown);
  });

  it.each(cases)('talent added levels for %s', (_charName, character) => {
    // Same empty slots: no talents, so no added levels at all
    if (!character.addedLevelsBreakdown) return expect(character.addedLevels).toBeUndefined();
    expectRebuilt(evaluateBreakdown(character.addedLevelsBreakdown), character.addedLevels);
    expect(character.addedLevelsBreakdown.totalValue).toBe(character.addedLevels);
    expectRenderable(character.addedLevelsBreakdown);
    if (character.talentPreset?.addedLevelsBreakdown) {
      expectRebuilt(evaluateBreakdown(character.talentPreset.addedLevelsBreakdown), character.talentPreset.addedLevels);
    }
  });

  it('library checkout time', () => {
    [0, 1, 10, 20, 100].forEach((bookCount) => {
      const { value, breakdown } = getTimeToNextBooks(bookCount, account, characters, fixture.data ?? fixture);
      expect(breakdown.totalValue).toBe(value);
      expect(evaluateBreakdown(breakdown)).toBe(value);
      expectRenderable(breakdown);
    });
  });
});
