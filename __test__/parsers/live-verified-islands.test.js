import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getIsland } from '@parsers/world-2/islands';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount[340] matches; the shop levels 163..180 are unchanged).
const GAME = {
  // Dreamstuff("AllShimmerBonuses", 0), The Shim Lantern capped at x4
  allShimmerBonus: 4,
  // DNSM.FracIsBn, one flag per Fractal Island bonus (OptionsListAccount[184] = 374579 hours)
  fractalUnlocked: [1, 1, 1, 1, 1, 1, 1, 1],
  // Shimmer shop prices, 1 + floor(OptionsListAccount[174 + i] / divider)
  shimmerCosts: [2, 1, 1, 1, 6, 3, 1],
  // Count of Number2Letter[0..5] found in OptionsListAccount[169]
  islandsUnlocked: 6
};

const { account } = parseFixture(latest);

describe('islands verified against the live game', () => {
  it('shimmer bonus multiplier, fractal bonuses, shimmer prices and unlocked count', () => {
    expect({
      allShimmerBonus: account.islands.allShimmerBonus,
      fractalUnlocked: getIsland(account, 'Fractal').shop.map(({ unlocked }) => (unlocked ? 1 : 0)),
      shimmerCosts: getIsland(account, 'Shimmer').shop.map(({ cost }) => cost),
      islandsUnlocked: account.islands.islandsUnlocked
    }).toEqual(GAME);
  });
});
