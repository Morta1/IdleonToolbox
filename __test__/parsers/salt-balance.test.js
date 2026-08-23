import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import latest from '../fixtures/latest.json';
import { calcCost, getPowerPerCycle, getRefineryCycles, getSaltsBalance } from '@parsers/world-3/refinery';

// The game charges CostsMulti(rank) * quantity of the previous salt every cycle
// (_customBlock_Refinery), so a salt's max safe rank is where that cost still fits inside what the
// previous salt makes in the same span of time.
const parsed = parseData(latest.data, latest.charNames ?? [], null, null, latest.serverVars);
const { account, characters } = parsed;
const balances = getSaltsBalance(account, characters);
const cycleTimes = getRefineryCycles(account, characters, latest.lastUpdated).cycles.map(({ time }) => time);
const chained = balances.filter(({ index, unlocked }) => unlocked && index > 0);

describe('getSaltsBalance', () => {
  it('covers every salt in the catalog, save or no save', () => {
    expect(balances).toHaveLength(account?.refinery?.salts?.length);
    expect(getSaltsBalance({}, []).length).toBe(0);
  });

  it('puts max safe rank exactly on the boundary the game charges at', () => {
    expect(chained.length).toBeGreaterThan(0);
    chained.forEach((balance) => {
      const { index, maxSafeRank, outputMaxed } = balance;
      if (outputMaxed) return;
      const previous = balances[index - 1];
      const entry = account?.refinery?.salts?.[index]?.cost?.find(({ rawName }) => rawName === previous.rawName);
      const allowed = getPowerPerCycle(previous.rank, account)
        * cycleTimes[Math.floor(index / 3)] / cycleTimes[Math.floor(previous.index / 3)];
      const costAtMax = calcCost(account?.refinery, maxSafeRank, entry?.quantity, entry?.rawName, index);
      const costAbove = calcCost(account?.refinery, maxSafeRank + 1, entry?.quantity, entry?.rawName, index);
      expect(costAtMax).toBeLessThanOrEqual(allowed);
      expect(costAbove).toBeGreaterThan(allowed);
    });
  });

  it('flags a salt as in deficit exactly when its consumer is over its max safe rank', () => {
    chained.forEach(({ index, rank, maxSafeRank }) => {
      expect(balances[index - 1].isDeficit).toBe(rank > maxSafeRank);
    });
  });

  it('leaves the balance positive when nothing consumes the salt', () => {
    const lastUnlocked = balances.filter(({ unlocked }) => unlocked).at(-1);
    expect(lastUnlocked.consumedPerHour).toBe(0);
    expect(lastUnlocked.balancePerHour).toBe(lastUnlocked.outputPerHour);
  });
});
