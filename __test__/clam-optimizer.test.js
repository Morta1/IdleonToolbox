import '../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../data/raw.json';
import { getOptimizedClamWorkUpgrades, parseClamWork } from '@parsers/world-7/clamWork';

describe('clam work upgrade optimizer', () => {
  const { data, charNames, companion, guildData, serverVars } = raw;
  const { account, characters } = parseData(data, charNames, companion, guildData, serverVars);
  const view = parseClamWork(account, null, 3585);
  const optimizerAccount = { ...account, clamWork: { ...account.clamWork, upgrades: view.upgrades, pearls: view.pearls } };
  const plan = (category, max) => getOptimizedClamWorkUpgrades(characters[0], optimizerAccount, category, max, {
    getResourceType: () => 0
  });

  it('fills the requested number of pearl gain upgrades', () => {
    const upgrades = plan('pearlGain', 15);
    expect(upgrades).toHaveLength(15);
    upgrades.forEach((upgrade) => {
      expect(upgrade.cost).toBeGreaterThan(0);
      expect(upgrade.statChanges[0].percentChange).toBeGreaterThan(0);
    });
  });

  // Clam upgrades have no max level. A null or zero x4 would read as "already maxed" for every
  // upgrade sitting at level 0, and the optimizer would return nothing at all.
  it('offers upgrades that are still at level 0', () => {
    const freshUpgrades = view.upgrades.map((upgrade) => ({ ...upgrade, level: 0 }));
    const freshAccount = {
      ...account,
      clamWork: { ...account.clamWork, upgrades: freshUpgrades, pearls: view.pearls }
    };
    const upgrades = getOptimizedClamWorkUpgrades(characters[0], freshAccount, 'pearlGain', 5, {
      getResourceType: () => 0
    });
    expect(upgrades).toHaveLength(5);
    expect(upgrades[0].level).toBe(1);
  });

  it('skips upgrades that are still locked in game', () => {
    const names = new Set(plan('pearlGain', 100).map(({ name }) => name));
    // upgradesUnlocked is 5 in this save, so ENCYSTATION_UP and SHINIER_PEARLS are out of reach.
    expect(names).not.toContain('ENCYSTATION_UP');
    expect(names).not.toContain('SHINIER_PEARLS');
  });

  it('only picks cost reducers in the cost reduction category', () => {
    const names = new Set(plan('costReduction', 5).map(({ name }) => name));
    names.forEach((name) => expect(['FRUGALITY', 'ANTI_INFLATION']).toContain(name));
  });

  it('spends more per step as levels climb', () => {
    const upgrades = plan('pearlGain', 20).filter(({ name }) => name === 'PEARL_VALUE');
    const costs = upgrades.map(({ cost }) => cost);
    costs.slice(1).forEach((cost, index) => expect(cost).toBeGreaterThan(costs[index]));
  });
});
