import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBribeBonus } from '@parsers/world-1/bribes';

// Read from the running game on 11 Oct 2026 through the debug server (latest.json is that save): GetBribeBonus(i).
// A bought bribe pays its catalog value, so these are the first, the last bought and the one not bought yet.
const GAME = { 0: 8, 39: 20, 40: 0 };

const { account } = parseFixture(latest);

describe('bribes match the live game', () => {
  it.each(Object.entries(GAME).map(([index, value]) => [account.bribes[index].name, value]))('%s bonus', (name, value) => {
    expect(getBribeBonus(account.bribes, name)).toBe(value);
  });
});
