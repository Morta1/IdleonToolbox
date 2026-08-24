import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { bagsAlerts } from '../../utility/dashboard/characters';
import { carryBags } from '@website-data';

const options = (checked = true) => ({ bags: { unmaxedBags: { name: 'unmaxedBags', checked } } });

const MAXED = Object.fromEntries(Object.keys(carryBags).map((bagType) => {
  const tiers = Object.keys(carryBags[bagType]).map(Number);
  return [bagType, Math.max(...tiers)];
}));

describe('unmaxed bags alert', () => {
  it('is empty when every carry bag is at max tier', () => {
    const char = { maxCarryCap: { ...MAXED, Quests: 10, fillerz: 10, Statues: 10 } };
    expect(bagsAlerts({}, [], char, 0, options()).unmaxedBags).toEqual([]);
  });

  it('flags bags below max tier with current and max capacity', () => {
    const char = { maxCarryCap: { ...MAXED, Mining: 250, Souls: 100 } };
    const alerts = bagsAlerts({}, [], char, 0, options()).unmaxedBags;
    expect(alerts).toHaveLength(2);
    const mining = alerts.find(({ bagType }) => bagType === 'Mining');
    expect(mining).toMatchObject({ capacity: 250, maxCapacity: 35000, rawName: carryBags.Mining['250'].rawName });
    const souls = alerts.find(({ bagType }) => bagType === 'Souls');
    expect(souls).toMatchObject({ capacity: 100, maxCapacity: 35000 });
  });

  it('ignores the non-upgradable pseudo-bags', () => {
    const char = { maxCarryCap: { ...MAXED, Quests: 10, fillerz: 10, Statues: 10 } };
    const alerts = bagsAlerts({}, [], char, 0, options()).unmaxedBags;
    expect(alerts.some(({ bagType }) => ['Quests', 'fillerz', 'Statues'].includes(bagType))).toBe(false);
  });

  it('falls back to the max-tier icon when the capacity is not a catalog tier', () => {
    const char = { maxCarryCap: { ...MAXED, Bugs: 123 } };
    const [alert] = bagsAlerts({}, [], char, 0, options()).unmaxedBags;
    expect(alert.rawName).toBe(carryBags.Bugs['35000'].rawName);
  });

  it('handles a character with no carry cap data', () => {
    expect(bagsAlerts({}, [], {}, 0, options()).unmaxedBags).toEqual([]);
  });

  it('returns nothing when the option is off', () => {
    const char = { maxCarryCap: { ...MAXED, Mining: 250 } };
    expect(bagsAlerts({}, [], char, 0, options(false)).unmaxedBags).toBeUndefined();
  });
});
