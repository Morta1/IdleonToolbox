import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getExaltedStampBonus, getStampsPerDay } from '@parsers/world-1/stamps';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // 5 * bun_s + 3 * EventShopOwned(1) + WinBonus(20), and Windwalker("StampDoubler")
  stampsPerDay: 12,
  exaltedStampBonus: 262.8281818181818
};

const { account } = parseFixture(latest);

describe('stamps verified against the live game', () => {
  it('No Stamp Left Behind and the Exalted multi', () => {
    expect(getStampsPerDay(account).value).toBe(GAME.stampsPerDay);
    within(getExaltedStampBonus(account).value, GAME.exaltedStampBonus);
  });
});
