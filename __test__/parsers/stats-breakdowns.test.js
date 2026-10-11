import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { breakdownLines, productOfTop, sumOfTop, topValue } from '../helpers/breakdown-tree';
import { getCashMulti, getClassExpMulti, getDropRate, getRespawnRate } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { getGoldenFoodMulti, getTimeToNextBooks } from '@parsers/misc';

// The character page Stats section and the talents tab. Each breakdown tree must rebuild the value
// the page shows, for every character of every fixture. Where a formula has a step the tree's
// combine modes cannot express, the tree carries the step as its own line and the rebuild below
// spells out how the top-level nodes combine:
// - respawn: the base time over the respawn rate group (the game divides)
// - drop rate: (base drop rate + ninja mastery's flat 0.3) times the multipliers
// - defence: base defence times the multipliers, plus the flat defence
// - crystal chance: base chance times the multipliers, plus the event shop, plus the spawn cap line
//   (negative once the 10% cap cuts in)
// - library: base time times the book count factor over the checkout speed, plus the rounding line
// Softcaps, floors and the Reliquarium are lines holding the factor (or amount) they leave behind,
// so the product or sum stays exact. List groups (remaining crystal kills, super talent levels) are
// display only and never count.
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
    expectRebuilt(topValue(breakdown, 'Base respawn time') / topValue(breakdown, 'Respawn rate'), respawnRate);
    expectRenderable(breakdown);
  });

  it.each(cases)('class EXP multi for %s', (_charName, character) => {
    const { value, breakdown } = getClassExpMulti(character, account, characters);
    expectRebuilt(productOfTop(breakdown), value);
    expectRenderable(breakdown);
  });

  it.each(cases)('drop rate for %s', (_charName, character) => {
    const { dropRate, breakdown } = getDropRate(character, account, characters);
    const rebuilt = (topValue(breakdown, 'Base drop rate') + topValue(breakdown, 'Ninja Mastery'))
      * topValue(breakdown, 'Multipliers');
    expectRebuilt(rebuilt, dropRate);
    expectRenderable(breakdown);
  });

  it.each(cases)('damage, cash, defence and kill per kill for %s', (_charName, character) => {
    const playerInfo = getMaxDamage(character, characters, account);
    expectRebuilt(productOfTop(playerInfo.damageBreakdown), playerInfo.maxDamage);
    expectRenderable(playerInfo.damageBreakdown, playerInfo.maxDamage);

    const { defence, killPerkill } = playerInfo;
    const defenceRebuilt = topValue(defence.breakdown, 'Base defence') * topValue(defence.breakdown, 'Multipliers')
      + topValue(defence.breakdown, 'Flat defence');
    expectRebuilt(defenceRebuilt, defence.value);
    expectRenderable(defence.breakdown, defence.value);

    expectRebuilt(productOfTop(killPerkill.breakdown), killPerkill.value);
    expectRenderable(killPerkill.breakdown);

    const { cashMulti, breakdown } = getCashMulti(character, account, characters, playerInfo);
    expectRebuilt(productOfTop(breakdown), cashMulti);
    expectRenderable(breakdown);
  });

  it.each(cases)('golden food multi for %s', (_charName, character) => {
    const { value, breakdown } = getGoldenFoodMulti(character, account, characters);
    expectRebuilt(productOfTop(breakdown), value);
    expectRenderable(breakdown);
  });

  it.each(cases)('crystal chance for %s', (_charName, character) => {
    const { effectiveValue, breakdown } = character.crystalSpawnChance;
    const rebuilt = topValue(breakdown, 'Base chance') * topValue(breakdown, 'Multipliers')
      + topValue(breakdown, 'Event Shop') + topValue(breakdown, 'Spawn cap');
    expectRebuilt(rebuilt, effectiveValue * 100);
    expectRenderable(breakdown);
  });

  it.each(cases)('talent added levels for %s', (_charName, character) => {
    // Same empty slots: no talents, so no added levels at all
    if (!character.addedLevelsBreakdown) return expect(character.addedLevels).toBeUndefined();
    expectRebuilt(sumOfTop(character.addedLevelsBreakdown), character.addedLevels);
    expect(character.addedLevelsBreakdown.totalValue).toBe(character.addedLevels);
    expectRenderable(character.addedLevelsBreakdown);
    if (character.talentPreset?.addedLevelsBreakdown) {
      expectRebuilt(sumOfTop(character.talentPreset.addedLevelsBreakdown), character.talentPreset.addedLevels);
    }
  });

  it('library checkout time', () => {
    const rebuild = (breakdown) => topValue(breakdown, 'Base time') * topValue(breakdown, 'Books checked out')
      / topValue(breakdown, 'Checkout speed') + topValue(breakdown, 'Rounding');
    [0, 1, 10, 20, 100].forEach((bookCount) => {
      const { value, breakdown } = getTimeToNextBooks(bookCount, account, characters, fixture.data ?? fixture);
      expect(breakdown.totalValue).toBe(value);
      expectRebuilt(rebuild(breakdown), value);
      expectRenderable(breakdown);
    });
  });
});
