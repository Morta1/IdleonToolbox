import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getTalentBonus } from '@parsers/talents';
import { getDoubleGoldenFoodDrop, getDoubleStatueDrop } from '@parsers/misc';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), OverkillQTY(-1)).
const GAME = {
  // ArcaneType("DoubleItemDropz", 0 | 1)
  doubleStatueDrop: 86.07142857142857,
  doubleGoldenFoodDrop: 93.29573121246551
};

const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('tesseract verified against the live game', () => {
  it('double statue and golden food drop chance', () => {
    within(getDoubleStatueDrop(account, windWalker, characters).value, GAME.doubleStatueDrop);
    within(getDoubleGoldenFoodDrop(account).value, GAME.doubleGoldenFoodDrop);
  });

  it('crystal charge requirement uses BACKUP_ENERGY\'s y bonus (the charge half)', () => {
    const arcane = characters.find((c) => c.class === 'Arcane_Cultist');
    const y = getTalentBonus(arcane.flatTalents, 'BACKUP_ENERGY', true);
    expect(y).toBeGreaterThan(2);
    // the game's charge requirement expression
    expect(account.tesseract.crystalChargeReq).toBe(Math.ceil(Math.max(50, 200 - (100 + Math.min(10, y)))));
  });
});
