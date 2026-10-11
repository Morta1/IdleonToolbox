import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getLoggedInSkillLevel } from '@parsers/misc';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Lv0[18], the logged-in summoning level
  summoningLevel: 146
};
// Summoning upgrades the game scales by Lv0[18]
const LEVEL_SCALED_UPGRADES = [30, 40, 46, 52, 58, 65, 66, 67];

const { account, characters } = parseFixture(latest);
const allUpgrades = Object.values(account.summoning.upgrades).flat();

describe('summoning verified against the live game', () => {
  it('upgrades scaled by Lv0[18] use the logged-in summoning level', () => {
    expect(getLoggedInSkillLevel(characters, 'summoning')).toBe(GAME.summoningLevel);
    LEVEL_SCALED_UPGRADES.forEach((originalIndex) => {
      const upgrade = allUpgrades.find((u) => u?.originalIndex === originalIndex);
      within(upgrade.totalBonus || 0, (upgrade.value || 0) * GAME.summoningLevel);
    });
  });
});
