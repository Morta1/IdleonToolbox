import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { findBreakdownNode } from '../helpers/breakdown-tree';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';
import { getClassExpMulti } from '@parsers/character';

// prayersReal(i, 0) / prayersReal(i, 1) read from the running game on 11 Oct 2026 through the debug server,
// logged in as IAmTheHunterrr (PrayersActive 13, 3, 1, 5, 16; superbits 9, 39 and 53 owned). latest.json is that
// save. Every prayer it has not equipped reads 0 / 0.
const GAME = {
  Skilled_Dimwit: [159, 106],
  Shiny_Snitch: [28, 21],
  Tachion_of_the_Titans: [11, 11],
  Fibers_of_Absence: [75, 38],
  Balance_of_Pain: [22, 42]
};

const { account, characters } = parseFixture(latest);
const hunter = characters.find((character) => character?.name === 'IAmTheHunterrr');

describe('prayers match the live game', () => {
  it.each(account.prayers.map(({ name }) => [name, GAME[name] ?? [0, 0]]))('%s', (name, [bonus, curse]) => {
    expect(getPrayerBonusAndCurse(hunter.activePrayers, name, account)).toEqual({ bonus, curse });
  });
});

// Oracle: the game's prayersReal, which the GAME table above confirms the parser reproduces
const SUPERBIT_SHARE = 0.2;
const prayersReal = (character, index, isCurse) => {
  const level = account.prayers[index].level;
  const levelMulti = Math.max(1, 1 + (level - 1) / 10);
  const info = account.prayers[index];
  if (character.activePrayers.length) {
    return character.activePrayers.some(({ prayerIndex }) => prayerIndex === index)
      ? Math.round((isCurse ? info.x2 : info.x1) * levelMulti)
      : 0;
  }
  return isCurse || index === 5 || level <= 0.5 ? 0 : Math.round(3 * SUPERBIT_SHARE * info.x1 * levelMulti);
};

// ExpMulti(0) adds prayersReal(0, 0) + prayersReal(2, 0) - prayersReal(9, 1). The parser read a character
// field that does not exist, so the Prayers line was always 0.
const BIG_BRAIN_TIME = 0;
const UNENDING_ENERGY = 2;
const THE_ROYAL_SAMPLER = 9;

describe('class EXP prayers', () => {
  it.each([
    ['mortastr', 'Royal Sampler equipped'],
    ['Morojoze', 'nothing equipped, superbit path']
  ])('%s: %s', (name) => {
    const character = characters.find((c) => c?.name === name);
    const expected = prayersReal(character, BIG_BRAIN_TIME, false)
      + prayersReal(character, UNENDING_ENERGY, false)
      - prayersReal(character, THE_ROYAL_SAMPLER, true);
    expect(expected).not.toBe(0);
    const { breakdown } = getClassExpMulti(character, account, characters);
    expect(findBreakdownNode(breakdown.tree, 'Prayers').value).toBe(expected);
  });
});
