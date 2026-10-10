import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getCashMulti, getClassExpMulti } from '../../parsers/character';
import { getMaxDamage } from '../../parsers/damage';

// Totals read from the running game on 10 Oct 2026 for MortasNinth, the character active in the save
// that latest.json was exported from, through the debug server. The game recomputed what its caches
// held stale (EtcBonuses, the GRIND_TIME bubble) before reading.
const GAME_CASH_MULTI = 9.90294028827609e22; // ArbitraryCode("MonsterCash"), 51 overkill tiers
const GAME_CLASS_EXP = 1.3976006e9; // ExpMulti(0)

const within = (actual, expected, pct) => expect(Math.abs(actual / expected - 1)).toBeLessThan(pct / 100);

describe('formulas verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters.find(c => c?.name === 'MortasNinth');

  it('monster cash matches, Molti card and both Cash from Mobs arcade upgrades included', () => {
    within(getCashMulti(character, account, characters, { multiKillTiers: 51 }).cashMulti, GAME_CASH_MULTI, 0.01);
  });

  it('works out the overkill tiers itself when the caller passes no player info', () => {
    expect(getCashMulti(character, account, characters).cashMulti)
      .toBe(getCashMulti(character, account, characters, getMaxDamage(character, characters, account)).cashMulti);
    expect(getCashMulti(character, account, characters).cashMulti)
      .toBeGreaterThan(getCashMulti(character, account, characters, { multiKillTiers: 1 }).cashMulti);
  });

  it('class EXP matches, with the Omniphau minor bonus read from its god slot (5x vs 100x)', () => {
    const { value, breakdown } = getClassExpMulti(character, account, characters);
    within(value, GAME_CLASS_EXP, 0.01);
    const god = breakdown.categories.find(c => c.name === 'Additive').sources.find(s => s.name === 'God (Omniphau)');
    expect(god.value).toBeCloseTo(1.6031, 3);
  });
});
