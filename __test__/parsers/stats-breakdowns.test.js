import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { breakdownLines } from '../helpers/breakdown-tree';
import { evaluateBreakdown } from '@parsers/breakdown';
import { getRespawnRate } from '@parsers/character';

// The checks breakdown-totals.test.js does not make: respawn's divide root and its "Not fighting"
// short-circuit, and talent added levels matching the breakdown's own totalValue.
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

  it.each(cases)('talent added levels for %s', (_charName, character) => {
    // Empty slots: no talents, so no added levels at all
    if (!character.addedLevelsBreakdown) return expect(character.addedLevels).toBeUndefined();
    expectRebuilt(evaluateBreakdown(character.addedLevelsBreakdown), character.addedLevels);
    expect(character.addedLevelsBreakdown.totalValue).toBe(character.addedLevels);
    expectRenderable(character.addedLevelsBreakdown);
    if (character.talentPreset?.addedLevelsBreakdown) {
      expectRebuilt(evaluateBreakdown(character.talentPreset.addedLevelsBreakdown), character.talentPreset.addedLevels);
    }
  });
});
