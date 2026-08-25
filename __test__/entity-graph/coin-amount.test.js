import { describe, it, expect } from 'vitest';
import { getCoinsArray } from '../../utility/helpers';

// The denominations behind CoinAmount. Coins are stored in the smallest unit, 100 to the next one
// up, so the raw number a quest or a drop carries is never the number to print.
const denominations = (amount) => getCoinsArray(amount)
  .filter(([, quantity]) => quantity > 0)
  .map(([index, quantity]) => `${quantity}@${index}`);

describe('coin denominations', () => {
  // idleon.wiki/wiki/Carpenter_Cardinal prints this reward as a single icon and the number 15.
  // We printed x1,500,000,000.
  it('reads Carpenter Cardinal\'s reward as 15 of one denomination', () => {
    expect(denominations(1500000000)).toEqual(['15@5']);
  });

  // Sand Giant's coin drop, which the panel printed as x610.
  it('splits a small drop across two denominations, largest first', () => {
    expect(denominations(610)).toEqual(['6@2', '10@1']);
  });

  it('drops the empty denominations rather than printing zeroes', () => {
    expect(denominations(100)).toEqual(['1@2']);
    expect(denominations(1)).toEqual(['1@1']);
  });

  it('has nothing to show for nothing', () => {
    expect(denominations(0)).toEqual([]);
  });
});
