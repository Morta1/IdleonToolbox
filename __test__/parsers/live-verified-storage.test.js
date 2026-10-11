import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // ChestSlotsOwned
  storageSlots: 601
};

const { account } = parseFixture(latest);

describe('storage verified against the live game', () => {
  it('storage slots', () => {
    expect(account.storage.slots.value).toBe(GAME.storageSlots);
  });
});
