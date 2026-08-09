import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getUpgradeVault } from '@parsers/misc/upgradeVault';
import { liveCount } from '@parsers/catalog';
import { upgradeVault } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getUpgradeVault', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getUpgradeVault(undefined, {}, []);
    expect(result.upgrades).toHaveLength(liveCount(upgradeVault));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('never crashes with no idleonData/accountData/charactersData', () => {
    expect(() => getUpgradeVault(undefined, undefined, undefined)).not.toThrow();
  });

  it('carries catalog fields through', () => {
    const [first] = getUpgradeVault(undefined, {}, []).upgrades;
    expect(first.name).toBe('Bigger_Damage');
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    // Hand-built save: UpgVault is the upgrade-level array directly. Runs unconditionally because
    // most fixtures below have no UpgVault field at all.
    const idleonData = { UpgVault: [5, 3, 0, 0, 0] };
    const result = getUpgradeVault(idleonData, {}, []);
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(upgradeVault));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getUpgradeVault fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const upgradeVaultRaw = data?.UpgVault || tryToParse(data?.UpgVault);
    const result = getUpgradeVault(data, {}, []);

    upgradeVaultRaw?.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getUpgradeVault(data, {}, []);
    expect(result.upgrades).toHaveLength(liveCount(upgradeVault));
  });

  it.each(FIXTURES)('%s: never throws', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(() => getUpgradeVault(data, {}, [])).not.toThrow();
  });
});
