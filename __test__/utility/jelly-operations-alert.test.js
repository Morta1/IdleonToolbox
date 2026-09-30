import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld7Alerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';

const fields = { jellyOperator: { checked: true } };
const allOn = {
  jellyOperator: {
    operationsLeft: { name: 'operationsLeft', checked: true },
    slotsToBuy: { name: 'slotsToBuy', checked: true },
    emptySlots: { name: 'emptySlots', checked: true },
    virusesUnplaced: { name: 'virusesUnplaced', checked: true }
  }
};

const account = ({
                   unlocked = true,
                   operationsLeft = 0,
                   dailyOperations = 2,
                   slotPurchasesLeft = 0,
                   emptySlots = 0,
                   virusesAllowed = 1,
                   virusesPlaced = 1,
                   virusUnlocked = true
                 } = {}) => ({
  finishedWorlds: { World6: true },
  jellyOperator: {
    unlocked,
    operationsLeft,
    dailyOperations,
    slotPurchasesLeft,
    layout: { emptySlots, virusesAllowed, virusesPlaced },
    cells: Array.from({ length: 8 }, (_, index) => ({ unlocked: index !== 5 || virusUnlocked }))
  }
});

const jellyAlerts = (acc, opts = allOn) => getWorld7Alerts(acc, fields, opts, [])?.jellyOperator;

describe('jelly operator alerts', () => {
  it('flags unused daily operations', () => {
    expect(jellyAlerts(account({ operationsLeft: 1, dailyOperations: 3 }))?.operationsLeft).toEqual({ left: 1, max: 3 });
  });

  it('flags slots waiting to be unlocked', () => {
    expect(jellyAlerts(account({ slotPurchasesLeft: 2 }))?.slotsToBuy).toBe(2);
  });

  it('flags open slots with nothing on them', () => {
    expect(jellyAlerts(account({ emptySlots: 3 }))?.emptySlots).toBe(3);
  });

  it('flags Viruses left to place, only once the Virus is unlocked', () => {
    expect(jellyAlerts(account({ virusesAllowed: 4, virusesPlaced: 1 }))?.virusesUnplaced).toBe(3);
    expect(jellyAlerts(account({ virusesAllowed: 4, virusesPlaced: 1, virusUnlocked: false }))).toBeUndefined();
  });

  it('stays quiet on a full board with nothing to spend', () => {
    expect(jellyAlerts(account())).toBeUndefined();
  });

  it('stays quiet before Jelly Operator is unlocked', () => {
    expect(jellyAlerts(account({ unlocked: false, operationsLeft: 2, emptySlots: 4 }))).toBeUndefined();
  });

  it('respects each option being off', () => {
    const off = { jellyOperator: { ...allOn.jellyOperator, emptySlots: { name: 'emptySlots', checked: false } } };
    const alerts = jellyAlerts(account({ operationsLeft: 1, emptySlots: 3 }), off);
    expect(alerts?.emptySlots).toBeUndefined();
    expect(alerts?.operationsLeft).toBeDefined();
  });
});

describe('jelly operator migration', () => {
  const names = ['operationsLeft', 'slotsToBuy', 'emptySlots', 'virusesUnplaced'];

  it('adds the group right after the sushi station', () => {
    const stored = { version: 76, account: { 'World 7': { sushiStation: { checked: true, options: [] }, clamWork: { checked: true, options: [] } } } };
    const migrated = migrateConfig({ version: 77 }, stored);
    const world7 = migrated?.account?.['World 7'];
    expect(Object.keys(world7)).toEqual(['sushiStation', 'jellyOperator', 'clamWork']);
    expect(world7.jellyOperator.options.map(({ name }) => name)).toEqual(names);
    expect(migrated.version).toBe(77);
  });

  it('fills in the options a config saved with only operationsLeft is missing', () => {
    const stored = {
      version: 76,
      account: { 'World 7': { jellyOperator: { checked: true, options: [{ name: 'operationsLeft', checked: false }] } } }
    };
    const migrated = migrateConfig({ version: 77 }, stored);
    const options = migrated.account['World 7'].jellyOperator.options;
    expect(options.map(({ name }) => name)).toEqual(names);
    expect(options[0].checked).toBe(false);
  });
});
