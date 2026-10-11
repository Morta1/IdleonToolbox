import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Minehead("Button_uHave", t): skill-level tasks read the logged-in levels, task 38 the raw artifact chance
  buttonProgress: { 30: 284, 31: 318, 32: 48, 33: 18, 34: 25, 35: 214, 38: 6526377.458918365 }
};

const { account } = parseFixture(latest);

describe('the button verified against the live game', () => {
  it('skill-level tasks read the logged-in levels, the artifact task the raw chance', () => {
    Object.entries(GAME.buttonProgress).forEach(([taskIndex, expected]) => {
      const task = account.button.taskSequence.find(({ index }) => index === Number(taskIndex));
      within(task.progress, expected);
    });
  });
});
