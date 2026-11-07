import '../../polyfills';
import { describe, expect, it } from 'vitest';
// Values below are pinned to the 22 Aug 2026 save (latest-2026-08.json), checked against the game then.
import latest from '../fixtures/latest-2026-08.json';
import { parseFixture } from '../helpers/parsed-fixtures';

// Read out of the live client on 2026-08-20: _customBlock_Ninja("NLbonuses", t, 0) for the five item rows. The gemstones
// that feed them and Gold_Star are pinned in live-verified-sneaking.test.js.
// Clear the cache with Ninja("NinjaBonus", -1, 0) before reading, or NJbonusPerms serves stale values.
//
// Every number here is per-active-character: the gemstones scale by GENERATIONAL_GEMSTONES, which
// getbonus2 reads off whoever is being played. This fixture's newest PTimeAway is 'Six'
// (IAmTheHunterrr), so these are that character's values - the client was on 'Nine' (MortasNinth)
// when the file was first written, which is why an earlier revision pinned Charm at 1978.
// Re-read in full on 2026-08-21 with the client sitting on IAmTheHunterrr: all five item rows match to the last digit,
// against getbonus2(1, 432, -1) = 2.4070796460176993.
const GAME_ITEM_MAX = { Gemstone: 1729, Kunai: 1657, Gloves: 1568, Charm: 1976, Nunchaku: 1668 };

describe('sneaking item max levels', () => {
  const { account } = parseFixture(latest);

  it('every row matches the game', () => {
    const rows = Object.fromEntries(account.sneaking.itemsMaxLevel.map(({ name, value }) => [name, value]));
    expect(rows).toEqual(GAME_ITEM_MAX);
  });

});
