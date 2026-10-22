import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Research[7][12], the record DPS, matches).
const GAME = {
  // JellyOperation("DPSmulti", 0, 0): getLOG divides by the truncated 2.30259, not ln(10)
  dpsMulti: 3.0655713205532478,
  // JellyOperation("BossAtkCD", t, 0) by obstruction, read 2026-10-22 on 2.3.550 (the floor on t / 6 is gone)
  bossAttackCooldown: { 0: 120, 1: 116.66666666666667, 5: 103.33333333333333, 6: 100, 7: 96.66666666666666, 13: 76.66666666666667, 30: 20, 63: 10 }
};

const { account } = parseFixture(latest);

describe('jelly operator verified against the live game', () => {
  it('record DPS multi', () => {
    within(account.jellyOperator.dpsMulti, GAME.dpsMulti);
  });

  it.each(Object.entries(GAME.bossAttackCooldown))('obstruction %s boss attack cooldown', (index, cooldown) => {
    within(account.jellyOperator.obstructions[Number(index)].attackCooldown, cooldown);
  });
});
