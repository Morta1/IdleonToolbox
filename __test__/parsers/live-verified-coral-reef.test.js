import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker,
// divinity 214). latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Thingies("ReefDayGains")
  reefDayGains: 113.3403009583432,
  // 1 + (1 + CoralKidUpgBonus(3) / 100) * Lv0[14] / (60 + Lv0[14])
  coralHat: 1.9528467153284672
};

const { account } = parseFixture(latest);

describe('coral reef verified against the live game', () => {
  it('reef day gains', () => {
    within(account.coralReef.reefDayGains.value, GAME.reefDayGains, 1e-6);
  });

  it('coral kid upgrade tooltips use the logged-in divinity level', () => {
    const descriptions = account.coralReef.coralKidUpgrades.map(({ description }) => description).join(' ');
    expect(descriptions).toContain('LV_of_214_');
    expect(descriptions).toContain(`${GAME.coralHat.toFixed(2)}x`);
  });
});
