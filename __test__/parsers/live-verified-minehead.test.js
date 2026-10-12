import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Minehead("CurrencyGain")
  mineheadCurrency: 45114.4105707113,
  // Read 2026-10-12, logged in as MortasNinth; equinox clouds 0-35 and 37 completed, OptionsListAccount[193] = 0.
  // Minehead("Mines_Opp", t) for opponents 0-19 (superbit 66, equinox cloud 41, jade 45 each remove one)
  minesPerOpponent: [1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 5, 6, 8, 8, 9, 10, 10]
};

const { account } = parseFixture(latest);

describe('minehead verified against the live game', () => {
  it('currency per hour', () => {
    within(account.minehead.currencyGain, GAME.mineheadCurrency, 1e-6);
  });

  it('depth charges per opponent', () => {
    expect(account.minehead.opponents.slice(0, GAME.minesPerOpponent.length).map(({ minesCount }) => minesCount)).toEqual(GAME.minesPerOpponent);
  });
});
