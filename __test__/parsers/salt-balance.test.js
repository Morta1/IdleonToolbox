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
      const { index, saltMaxSafeRank: maxSafeRank, outputMaxed } = balance;
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
    chained.forEach(({ index, rank, saltMaxSafeRank: maxSafeRank }) => {
      expect(balances[index - 1].isDeficit).toBe(rank > maxSafeRank);
    });
  });

  it('keeps a rank whose cost exactly matches the previous salt output', () => {
    // Explosive rank 5 makes floor(5^1.3) = 8 per cycle; Spontaneity rank 3 costs floor(3^1.3) * 2 = 8.
    // A 193s cycle turns the per-hour round trip into 7.999..., which used to drop the answer to 2.
    const salt = (rawName, rank, cost) => ({ rawName, rank, cost, unlocked: true, active: 1 });
    const minimalAccount = {
      refinery: {
        refinerySaltTaskLevel: 10,
        salts: [
          salt('Refinery1', 11, []),
          salt('Refinery2', 5, [{ rawName: 'Refinery1', quantity: 2 }]),
          salt('Refinery3', 3, [{ rawName: 'Refinery2', quantity: 2 }])
        ]
      }
    };
    const result = getSaltsBalance(minimalAccount, [], { combustionTime: 193, synthesisTime: 772, polymerizeTime: 1e5 });
    expect(result[1].maxSafeRank).toBe(6);
    expect(result[2].maxSafeRank).toBe(3);
    expect(result[1].isDeficit).toBe(false);
  });

  it('caps max safe rank at what the printer makes of a printed input', () => {
    // 3600s cycle, so 100/hr printed allows 100 per cycle: floor(rank^1.5) * 10 <= 100 -> rank 4.
    const minimalAccount = {
      printer: [[{ item: 'Copper', active: true, boostedValue: 100 }, { item: 'Copper', active: false, boostedValue: 1e9 }]],
      refinery: {
        refinerySaltTaskLevel: 10,
        salts: [
          { rawName: 'Refinery1', rank: 2, unlocked: true, active: 1, cost: [{ rawName: 'Copper', name: 'Copper_Ore', quantity: 10 }, { rawName: 'Grasslands1', name: 'Grass_Leaf', quantity: 5 }] }
        ]
      }
    };
    const [result] = getSaltsBalance(minimalAccount, [], { combustionTime: 3600, synthesisTime: 3600, polymerizeTime: 3600 });
    expect(result.printerLimits).toHaveLength(1);
    expect(result.printerLimits[0]).toMatchObject({ rawName: 'Copper', printedPerHour: 100, neededPerHour: 20, maxRank: 4 });
    expect(result.maxSafeRank).toBe(4);
    expect(result.limitedBy).toMatchObject({ rawName: 'Copper', isPrinter: true });
  });

  it('ignores materials the printer is not printing', () => {
    const minimalAccount = {
      printer: [],
      refinery: { refinerySaltTaskLevel: 10, salts: [{ rawName: 'Refinery1', rank: 2, unlocked: true, active: 1, cost: [{ rawName: 'Copper', quantity: 10 }] }] }
    };
    const [result] = getSaltsBalance(minimalAccount, [], { combustionTime: 3600, synthesisTime: 3600, polymerizeTime: 3600 });
    expect(result.printerLimits).toHaveLength(0);
    expect(result.maxSafeRank).toBe(result.saltMaxSafeRank);
    expect(result.limitedBy).toBeNull();
  });

  it('leaves the balance positive when nothing consumes the salt', () => {
    const lastUnlocked = balances.filter(({ unlocked }) => unlocked).at(-1);
    expect(lastUnlocked.consumedPerHour).toBe(0);
    expect(lastUnlocked.balancePerHour).toBe(lastUnlocked.outputPerHour);
  });
});
