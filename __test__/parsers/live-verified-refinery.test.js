import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getRefineryCycles } from '@parsers/world-3/refinery';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Refinery("CycleInitialTime", 0 | 1 | 2), already ceiled by the game
  refineryCycleTimes: [4, 15, 656]
};

const { account, characters } = parseFixture(latest);

describe('refinery verified against the live game', () => {
  it('cycle times', () => {
    expect(getRefineryCycles(account, characters, Date.now()).cycles.map(({ time }) => time)).toEqual(GAME.refineryCycleTimes);
  });
});
