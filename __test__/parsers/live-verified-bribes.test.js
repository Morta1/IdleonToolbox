import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBribeBonus } from '@parsers/world-1/bribes';

// Read from the running game on 11 Oct 2026 through the debug server (latest.json is that save):
// GetBribeBonus(i) for every bribe, 0 for the one not bought yet.
const GAME = [8, 15, 7, 5, 10, 6, 20, 2.2, 20, 0.2, 20, 3, 13, 2, 10, 1, 4, 10, 4, 20, 2, 2, 2, 5, 2, 10, 27, 1, 1, 1, 2,
  10, 33, 34, 20, 30, 10, 20, 30, 20, 0];

const { account } = parseFixture(latest);

describe('bribes match the live game', () => {
  it.each(GAME.map((value, index) => [account.bribes[index]?.name, index, value]))('%s bonus', (name, index, value) => {
    expect(getBribeBonus(account.bribes, name)).toBe(value);
  });
});
