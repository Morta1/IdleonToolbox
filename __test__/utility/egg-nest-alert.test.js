import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getOptions, getWorld4Alerts } from '../../utility/dashboard/account';

const section = { breeding: { checked: true, options: [{ name: 'eggs', checked: true }] } };
const eggAlert = (eggs, eggCapacity) => getWorld4Alerts(
  { finishedWorlds: { World3: true }, breeding: { eggs, eggCapacity, pets: [] } },
  section, getOptions(section))?.breeding?.eggs;
const slots = (filled) => Array.from({ length: 20 }, (_, index) => (index < filled ? 1 : 0));

describe('egg nest full alert', () => {
  it('fires when every unlocked slot has an egg, not only at 15', () => {
    expect(eggAlert(slots(5), 5)).toBe(true);
    expect(eggAlert(slots(4), 5)).toBeUndefined();
    expect(eggAlert(slots(15), 15)).toBe(true);
  });

  it('stays quiet without a known capacity', () => {
    expect(eggAlert(slots(20), undefined)).toBeUndefined();
  });
});
