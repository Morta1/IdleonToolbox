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
