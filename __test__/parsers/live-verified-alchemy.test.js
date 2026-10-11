import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { unrounded, within } from '../helpers/live-verified';
import { getKrukBubblesDaily, getPossibleZenithMarketBubbles, getUpgradeableBubbles, getVialMultiplier } from '@parsers/world-2/alchemy';
import { GOD_SLOT } from '@parsers/world-5/divinity';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1)).
const GAME = {
  // CauldronStats("VialBonus") / the raw vial value
  vialMulti: 3.3600000000000003,
  // Thingies("KrukBubblesDaily")
  krukDaily: 2142,
  // ArcaneType("NBLB_bubbleQTY", 0, 0)
  upgradeableBubbles: 10,
  // CauldronStats("LiquidCap", 0..3), the game does not round them
  liquidCaps: [489156.6973870904, 490324.50665103, 479350.8069009945, 474100.2993770121]
};

const { account, characters } = parseFixture(latest);

describe('alchemy verified against the live game', () => {
  it('vial multiplier, Kruk daily bubble levels and upgradeable bubbles', () => {
    within(getVialMultiplier(account).value, GAME.vialMulti);
    expect(getKrukBubblesDaily(account).value).toBe(GAME.krukDaily);
    expect(getUpgradeableBubbles(account, characters).upgradeableBubblesAmount).toBe(GAME.upgradeableBubbles);
  });

  it('liquid cauldron capacity', () => {
    account.alchemy.liquidCauldrons.forEach(({ maxLiquid, maxLiquidBreakdown }, index) => {
      within(unrounded(maxLiquidBreakdown), GAME.liquidCaps[index]);
      expect(maxLiquid).toBe(Math.ceil(GAME.liquidCaps[index]));
    });
  });
});

describe('Kattlekruk major for the Zenith Market bubbles: King Doot follows the logged-in character', () => {
  const krukAccount = (linkedDeities) => ({
    companions: { list: [{ acquired: true }] },
    divinity: { linkedDeities },
    alchemy: { bubblesFlat: [{ bubbleIndex: '_0' }] }
  });
  const high = { playerId: 0, afkTime: 2, skillsInfo: { divinity: { level: 50 } } };
  const low = { playerId: 1, afkTime: 1, skillsInfo: { divinity: { level: 1 } } };

  it('Bonus_MAJOR(0, 8) through King Doot only when the logged-in character qualifies, a direct link always', () => {
    expect(getPossibleZenithMarketBubbles(krukAccount([-1, -1]), [high, low])).toHaveLength(1);
    expect(getPossibleZenithMarketBubbles(krukAccount([-1, -1]), [{ ...high, afkTime: 0 }, { ...low, afkTime: 5 }])).toHaveLength(0);
    expect(getPossibleZenithMarketBubbles(krukAccount([-1, GOD_SLOT.Kattlekruk]), [{ ...high, afkTime: 0 }, { ...low, afkTime: 5 }])).toHaveLength(1);
  });
});
