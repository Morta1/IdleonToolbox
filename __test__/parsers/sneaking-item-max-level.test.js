import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBestActiveCharacter } from '@parsers/talents';

// Read out of the live client on 2026-08-20: _customBlock_Ninja("NLbonuses", t, 0) for the five
// item rows, and _customBlock_Ninja("GemstoneBonus", i, 0) for the gemstones that feed them.
// Clear the cache with Ninja("NinjaBonus", -1, 0) before reading, or NJbonusPerms serves stale values.
//
// Every number here is per-active-character: the gemstones scale by GENERATIONAL_GEMSTONES, which
// getbonus2 reads off whoever is being played. This fixture's newest PTimeAway is 'Six'
// (IAmTheHunterrr), so these are that character's values — the client was on 'Nine' (MortasNinth)
// when the file was first written, which is why an earlier revision pinned Charm at 1978.
// Re-read in full on 2026-08-21 with the client sitting on IAmTheHunterrr: all five item rows, all
// eight gemstones and Gold_Star match to the last digit, against getbonus2(1, 432, -1) = 2.4070796460176993.
const GAME_ITEM_MAX = { Gemstone: 1729, Kunai: 1657, Gloves: 1568, Charm: 1976, Nunchaku: 1668 };
const GAME_GEMSTONES = [1852.042247187799, 5310.58051717298, 3477.3836538885316, 218.2230593672544,
  83.06389926102479, 9.457925636007827, 2886.9265195534044, 59.59193172731054];
// NinjaBonus(21, -1) — the Gold_Star inventory bonus, the term the Charm row is most sensitive to.
const GAME_GOLD_STAR = 151.5537320236549;

describe('sneaking item max levels', () => {
  const { account, characters } = parseFixture(latest);

  // Every pin below is read with IAmTheHunterrr playing. Regenerate the fixture from a save taken
  // on anyone else and all three rows shift together — correctly, since the game shifts too. This
  // guard fails first and says so, instead of leaving three numeric diffs to interpret.
  it('is still a fixture recorded on the character these numbers came from', () => {
    expect(getBestActiveCharacter(characters).name).toBe('Six');
  });

  it('every row matches the game', () => {
    const rows = Object.fromEntries(account.sneaking.itemsMaxLevel.map(({ name, value }) => [name, value]));
    expect(rows).toEqual(GAME_ITEM_MAX);
  });

  it('gemstone bonuses match the game', () => {
    account.sneaking.gemStones.forEach((gemstone, index) => {
      expect(gemstone.bonus).toBeCloseTo(GAME_GEMSTONES[index], 8);
    });
  });

  it('Gold_ item values multiply the three sources separately', () => {
    const goldStar = account.sneaking.inventory.find(({ name }) => name === 'Gold_Star');
    expect(goldStar.value).toBeCloseTo(GAME_GOLD_STAR, 8);
  });
});
