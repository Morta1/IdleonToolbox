import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getUpgradeVault } from '@parsers/misc/upgradeVault';
import { liveCount } from '@parsers/catalog';
import { upgradeVault } from '@website-data';
import latest from '../fixtures/latest.json';

describe('getUpgradeVault', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getUpgradeVault(undefined, {}, []);
    expect(result.upgrades).toHaveLength(liveCount(upgradeVault));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
    expect(result.upgrades[0].name).toBe('Bigger_Damage');
    expect(getUpgradeVault(undefined, undefined, undefined).upgrades).toHaveLength(liveCount(upgradeVault));
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    const idleonData = { UpgVault: [5, 3, 0, 0, 0] };
    const result = getUpgradeVault(idleonData, {}, []);
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(upgradeVault));
  });
});

// The older saves carry no key at all, which is the missing-save path above
describe('getUpgradeVault on a real save', () => {
  it('reads every level at its index, across the whole catalog', () => {
    const raw = latest.data.UpgVault;
    const { upgrades } = getUpgradeVault(latest.data, {}, []);
    expect(raw.length).toBeGreaterThan(0);
    expect(upgrades.map(({ level }) => level)).toEqual(Array.from({ length: liveCount(upgradeVault) }, (_, index) => raw[index] ?? 0));
  });
});
