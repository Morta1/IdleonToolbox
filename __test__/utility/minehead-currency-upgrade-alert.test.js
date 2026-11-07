import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld7Alerts } from '@utility/dashboard/account';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';

const fields = { minehead: { checked: true } };
const optionsWith = (value) => ({
  minehead: { currencyUpgrades: { name: 'currencyUpgrades', checked: true, type: 'array', props: { value } } }
});
const allSelected = { MineUpg5: true, MineUpg22: true, MineUpg28: true };

const { account, characters } = parseFixture(latest);

const withUpgrades = (overrides) => ({
  ...account,
  minehead: {
    ...account.minehead,
    upgrades: account.minehead.upgrades.map((upgrade, index) => overrides[index]
      ? { ...upgrade, ...overrides[index] }
      : { ...upgrade, canAfford: false })
  }
});

describe('minehead currency upgrade alert', () => {
  it('lists every affordable selected upgrade', () => {
    const alerts = getWorld7Alerts(withUpgrades({
      5: { canAfford: true },
      22: { canAfford: true },
      28: { canAfford: true }
    }), fields, optionsWith(allSelected), characters);
    expect(alerts?.minehead?.currencyUpgrades?.map(({ index }) => index)).toEqual([5, 22, 28]);
  });

  it('skips upgrades the user unchecked', () => {
    const alerts = getWorld7Alerts(withUpgrades({
      5: { canAfford: true },
      22: { canAfford: true }
    }), fields, optionsWith({ ...allSelected, MineUpg5: false }), characters);
    expect(alerts?.minehead?.currencyUpgrades?.map(({ index }) => index)).toEqual([22]);
  });

  it('stays silent when none are affordable', () => {
    const alerts = getWorld7Alerts(withUpgrades({}), fields, optionsWith(allSelected), characters);
    expect(alerts?.minehead?.currencyUpgrades).toBeUndefined();
  });
});
