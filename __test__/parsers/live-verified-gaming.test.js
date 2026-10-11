import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getBitsMulti } from '@parsers/world-5/gaming';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1)).
const GAME = {
  // GamingStatType("SproutValueNonPlantMulti") and ("PaletteLuck")
  bitsMulti: 5.71351823669754e53,
  paletteLuck: 252.07105202319835,
  // Lv0[0], the logged-in class level superbit 47 (Timmy Talented) reads
  classLevel: 1280
};

const { account, characters } = parseFixture(latest);
const superbit = (name) => account.gaming.superbitsUpgrades.find((upgrade) => upgrade.name === name);

describe('gaming verified against the live game', () => {
  it('bits multi and palette luck', () => {
    within(getBitsMulti(account, characters).value, GAME.bitsMulti, 1e-6);
    within(account.gaming.paletteLuck.value, GAME.paletteLuck, 1e-6);
  });

  it('Timmy Talented superbit reads the logged-in class level', () => {
    // floor((Lv0[0] - 500) / 100), as the game writes it
    expect(account.gaming.superbitsUpgrades[47].totalBonus).toBe(Math.floor((GAME.classLevel - 500) / 100));
  });

  it('superbit display: 42 Bigger_Palette is a flag with no value; 55 shows the logged-in farming multi', () => {
    const biggerPalette = superbit('Bigger_Palette');
    expect(biggerPalette.description).not.toContain('{');
    expect(biggerPalette.additionalInfo).toBeUndefined();
    // The fixture's logged-in farming level is 438: 1 + 0.02 * (438 - 300)
    const megacrop = superbit('Mo_Stickers_Mo_Bonusers');
    expect(megacrop.totalBonus).toBeCloseTo(3.76, 9);
    expect(megacrop.additionalInfo).toBe('438 farming level');
  });
});
