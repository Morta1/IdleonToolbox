import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { unrounded, within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Dreamstuff("BarFillRate")
  equinoxFillRate: 2709281.834190635
};

const { account } = parseFixture(latest);

describe('equinox verified against the live game', () => {
  it('fill rate, unrounded in the tree and rounded on the page', () => {
    within(unrounded(account.equinox.breakdown), GAME.equinoxFillRate);
    expect(account.equinox.chargeRate).toBe(Math.round(GAME.equinoxFillRate));
  });
});
