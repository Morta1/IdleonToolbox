import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Research[7][12], the record DPS, matches).
const GAME = {
  // JellyOperation("DPSmulti", 0, 0): getLOG divides by the truncated 2.30259, not ln(10)
  dpsMulti: 3.0655713205532478
};

const { account } = parseFixture(latest);

describe('jelly operator verified against the live game', () => {
  it('record DPS multi', () => {
    within(account.jellyOperator.dpsMulti, GAME.dpsMulti);
  });
});
