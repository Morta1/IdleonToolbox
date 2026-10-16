import { describe, expect, it } from 'vitest';
import { getOptimizedGenericUpgrades } from '@parsers/genericUpgradeOptimizer';

// Two upgrades: index 0 is always available, index 1 is gated behind 3 total levels bought.
// The gated one is worth far more per unit cost, so a correct walk must pick it up the moment
// buying index 0 three times opens it.
const buildUpgrades = () => ([
  { index: 0, name: 'Cheap', level: 0, x4: 100, x3: 0, unlockLevel: 0, unlocked: true, gain: 1 },
  { index: 1, name: 'Gated', level: 0, x4: 100, x3: 0, unlockLevel: 3, unlocked: false, gain: 50 }
]);

const runWalk = ({ dynamicUnlocks, maxUpgrades = 6 }) => getOptimizedGenericUpgrades({
  character: {},
  account: { upgrades: buildUpgrades() },
  category: 'damage',
  maxUpgrades,
  categoryInfo: { name: 'Damage', stats: ['damage'], upgradeIndices: [0, 1] },
  getUpgrades: (acc) => acc.upgrades,
  getResources: () => [1e9],
  getCurrentStats: (upgrades) => ({
    damage: 100 + upgrades.reduce((sum, upgrade) => sum + upgrade.level * upgrade.gain, 0)
  }),
  getUpgradeCost: () => 10,
  ...(dynamicUnlocks
    ? {
      getUnlockedIndices: (upgrades) => {
        const totalLevels = upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0);
        return new Set(upgrades
          .filter((upgrade) => upgrade.unlockLevel <= totalLevels)
          .map((upgrade) => upgrade.index));
      }
    }
    : {})
});

// Resource 0 earns 100/h with nothing held; resource 1 earns 10/h with 90 held. Every level costs
// 300 of resource 0 or 100 of resource 1, so resource 0 steps land at 3h, 6h, 9h... and resource 1
// steps at 1h, 11h, 21h...
const runTimedWalk = (resourcePerHour, sharedFarmingTime = false) => getOptimizedGenericUpgrades({
  character: {},
  account: {
    upgrades: [
      { index: 0, name: 'Wheat', level: 0, x4: 100, x3: 0 },
      { index: 1, name: 'Raspberry', level: 0, x4: 100, x3: 1 }
    ]
  },
  category: 'all',
  maxUpgrades: 6,
  getUpgrades: (acc) => acc.upgrades,
  getResources: () => [0, 90],
  getCurrentStats: () => ({}),
  getUpgradeCost: (upgrade) => (upgrade.x3 === 0 ? 300 : 100),
  getUnlockedIndices: (upgrades) => new Set(upgrades.map((upgrade) => upgrade.index)),
  extraArgs: { resourcePerHour, sharedFarmingTime }
});

describe('getOptimizedGenericUpgrades ready-time ordering', () => {
  it('orders by when each resource covers the step, counting held stock and parallel income', () => {
    const results = runTimedWalk({ 0: 100, 1: 10 });
    expect(results.map(({ index, readyInHours }) => [index, readyInHours])).toEqual([
      [1, 1], [0, 3], [0, 6], [0, 9], [1, 11], [0, 12]
    ]);
  });

  // One pool of farming time: after the 10 raspberry the stock lacks (1h), each wheat is 3 more
  // hours and the next raspberry 10, so the clock adds up instead of running per resource.
  it('adds up the hours of every pick when resources share farming time', () => {
    const results = runTimedWalk({ 0: 100, 1: 10 }, true);
    expect(results.map(({ index, readyInHours }) => [index, readyInHours])).toEqual([
      [1, 1], [0, 4], [0, 7], [0, 10], [0, 13], [0, 16]
    ]);
  });

  // Stock covers three 300 wheat buys for free; after that a 50 raspberry at 100/h (0.5h) beats
  // farming 200 more wheat at 1/h.
  it('spends held stock first with shared farming time, then the fewest farming hours', () => {
    const results = getOptimizedGenericUpgrades({
      character: {},
      account: {
        upgrades: [
          { index: 0, name: 'Wheat', level: 0, x4: 100, x3: 0 },
          { index: 1, name: 'Raspberry', level: 0, x4: 100, x3: 1 }
        ]
      },
      category: 'all',
      maxUpgrades: 6,
      getUpgrades: (acc) => acc.upgrades,
      getResources: () => [1000, 0],
      getCurrentStats: () => ({}),
      getUpgradeCost: (upgrade) => (upgrade.x3 === 0 ? 300 : 50),
      getUnlockedIndices: (upgrades) => new Set(upgrades.map((upgrade) => upgrade.index)),
      extraArgs: { resourcePerHour: { 0: 1, 1: 100 }, sharedFarmingTime: true }
    });
    expect(results.map(({ index, readyInHours }) => [index, readyInHours])).toEqual([
      [0, 0], [0, 0], [0, 0], [1, 0.5], [1, 1], [1, 1.5]
    ]);
  });

  // Resource 1 is fully stocked, but its upgrade only opens after 2 levels of resource 0 (3h, 6h),
  // so it can't be ready before that second purchase lands.
  it('never makes a locked row ready before the purchase that unlocks it', () => {
    const results = getOptimizedGenericUpgrades({
      character: {},
      account: {
        upgrades: [
          { index: 0, name: 'Wheat', level: 0, x4: 100, x3: 0 },
          { index: 1, name: 'Gated', level: 0, x4: 100, x3: 1 }
        ]
      },
      category: 'all',
      maxUpgrades: 4,
      getUpgrades: (acc) => acc.upgrades,
      getResources: () => [0, 1e9],
      getCurrentStats: () => ({}),
      getUpgradeCost: (upgrade) => (upgrade.x3 === 0 ? 300 : 100),
      getUnlockedIndices: (upgrades) => {
        const totalLevels = upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0);
        return new Set(upgrades.filter((upgrade) => upgrade.index === 0 || totalLevels >= 2).map((upgrade) => upgrade.index));
      },
      extraArgs: { resourcePerHour: { 0: 100, 1: 10 } }
    });
    expect(results.map(({ index, readyInHours }) => [index, readyInHours])).toEqual([
      [0, 3], [0, 6], [1, 6], [1, 6]
    ]);
  });

  it('keeps plain cost order with no resource per hour', () => {
    const results = runTimedWalk(undefined);
    expect(results.map(({ index, readyInHours }) => [index, readyInHours])).toEqual(
      Array(6).fill([1, null])
    );
  });
});

describe('getOptimizedGenericUpgrades unlock gates', () => {
  it('never reaches a gated upgrade when unlocks are frozen at step 0', () => {
    const results = runWalk({ dynamicUnlocks: false });
    expect(results).toHaveLength(6);
    expect(results.every(({ index }) => index === 0)).toBe(true);
  });

  it('picks up a gated upgrade once the walk buys it into range', () => {
    const results = runWalk({ dynamicUnlocks: true });
    expect(results.slice(0, 3).map(({ index }) => index)).toEqual([0, 0, 0]);
    expect(results.slice(3).every(({ index }) => index === 1)).toBe(true);
  });

  it('reports the gated row as locked now and the purchases needed to open it', () => {
    const results = runWalk({ dynamicUnlocks: true });
    const gated = results.find(({ index }) => index === 1);
    expect(gated.lockedNow).toBe(true);
    expect(gated.unlocksAfterStep).toBe(3);
    expect(results[0].lockedNow).toBe(false);
    expect(results[0].unlocksAfterStep).toBe(null);
  });
});
