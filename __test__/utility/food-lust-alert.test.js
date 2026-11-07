import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld3Alerts } from '@utility/dashboard/account';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';

const fields = { equinox: { checked: true } };
const optionsWith = (value) => ({
  equinox: { foodLust: { name: 'foodLust', checked: true, type: 'input', props: { value } } }
});

const { account, characters } = parseFixture(latest);

const withFoodLust = (lvl, bonus) => ({
  ...account,
  equinox: {
    ...account.equinox,
    upgrades: account.equinox.upgrades.map((upgrade, index) => index === 9 ? { ...upgrade, lvl, bonus } : upgrade)
  }
});

describe('equinox foodLust alert', () => {
  it('alerts once the stacks reach the threshold', () => {
    const alerts = getWorld3Alerts(withFoodLust(6, 2), fields, optionsWith(2), characters);
    expect(alerts?.equinox).toEqual(expect.objectContaining({ foodLust: true, foodLustStacks: 2, foodLustMaxed: false }));
  });

  it('stays silent below the threshold', () => {
    expect(getWorld3Alerts(withFoodLust(6, 1), fields, optionsWith(2), characters).equinox?.foodLust).toBeUndefined();
  });

  it('clamps the threshold to the upgrade level so the max value means maxed', () => {
    expect(getWorld3Alerts(withFoodLust(6, 5), fields, optionsWith(14), characters).equinox?.foodLust).toBeUndefined();
    const alerts = getWorld3Alerts(withFoodLust(6, 6), fields, optionsWith(14), characters);
    expect(alerts?.equinox).toEqual(expect.objectContaining({ foodLust: true, foodLustStacks: 6, foodLustMaxed: true }));
  });

  it('never alerts when the upgrade is not levelled', () => {
    expect(getWorld3Alerts(withFoodLust(0, 0), fields, optionsWith(1), characters).equinox?.foodLust).toBeUndefined();
  });
});
