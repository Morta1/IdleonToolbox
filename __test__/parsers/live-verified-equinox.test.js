import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { unrounded, within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Dreamstuff("BarFillRate"), read on 2.3.531 as 2709281.834190635. 2.3.540 added * (1 + LegendPTS_bonus(35) / 100)
  // and this save's Obsolete No More gives 25 (BarFillRate parity re-checked live on a newer save 2026-10-17).
  equinoxFillRate: 2709281.834190635 * 1.25,
  // Read 2026-10-12, logged in as MortasNinth; equinox clouds 0-35 and 37 completed, OptionsListAccount[193] = 0.
  // Dreamstuff("UpgUnlocked") and Dreamstuff("UpgMaxLV", i) for every upgrade
  upgradesUnlocked: 12,
  upgradeMaxLevels: [5, 4, 3, 11, 52, 30, 10, 25, 40, 33, 28, 49, 24, 2]
};

const { account } = parseFixture(latest);

describe('equinox verified against the live game', () => {
  it('fill rate, unrounded in the tree and rounded on the page', () => {
    within(unrounded(account.equinox.breakdown), GAME.equinoxFillRate);
    expect(account.equinox.chargeRate).toBe(Math.round(GAME.equinoxFillRate));
  });

  it('upgrades unlocked and max levels from the cloud rewards', () => {
    expect(account.equinox.upgrades.filter(({ unlocked }) => unlocked).length).toBe(GAME.upgradesUnlocked);
    expect(account.equinox.upgrades.map(({ maxLvl }) => maxLvl)).toEqual(GAME.upgradeMaxLevels);
  });
});
