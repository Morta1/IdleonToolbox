import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // 1 + (ArcaneUpgBonus(48) + ArcadeBonus(51) + JellyOperation(28)) / 100, the EmperorBon multiplier
  emperorMulti: 1.924,
  // Thingies("Boss6HP") on 2026-10-16 at OptionsListAccount[369] = 40 showdowns, as in latest.json
  bossHp: 2.535579817697124e+21
};

const { account } = parseFixture(latest);

describe('emperor verified against the live game', () => {
  it('bonus multi', () => {
    within(account.emperor.bonusMulti.totalValue, GAME.emperorMulti, 1e-6);
  });

  it('boss HP at the current showdown', () => {
    within(account.emperor.bossHp[0], GAME.bossHp);
  });
});
