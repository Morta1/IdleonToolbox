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
  });

  it('stays quiet without a known capacity', () => {
    expect(eggAlert(slots(20), undefined)).toBeUndefined();
  });
});

const raritySection = (value) => ({
  breeding: { checked: true, options: [{ name: 'eggsRarity', checked: true, props: { value } }] }
});
const rarityAlert = (eggs, threshold) => {
  const section = raritySection(threshold);
  return getWorld4Alerts(
    { finishedWorlds: { World3: true }, breeding: { eggs, eggCapacity: eggs.length, pets: [] } },
    section, getOptions(section))?.breeding?.eggsRarity;
};

describe('egg rarity alert', () => {
  it('reports the highest egg, tiers 10 and 11 included, not the threshold', () => {
    expect(rarityAlert([3, 10, 0], 10)).toBe(10);
    expect(rarityAlert([11, 9], 9)).toBe(11);
  });

  it('stays quiet when no egg reaches the threshold', () => {
    expect(rarityAlert([10, 9], 11)).toBeUndefined();
  });

  it('accepts the threshold as a string from saved settings', () => {
    expect(rarityAlert([10], '10')).toBe(10);
  });
});
