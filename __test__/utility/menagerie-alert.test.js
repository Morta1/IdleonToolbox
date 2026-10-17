import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld7Alerts } from '../../utility/dashboard/account';

const fields = { menagerie: { checked: true } };
const allOn = {
  menagerie: {
    claimableMissions: { name: 'claimableMissions', checked: true },
    affordableUnlocks: { name: 'affordableUnlocks', checked: true },
    affordableBoosts: { name: 'affordableBoosts', checked: true },
    unusedDoublers: { name: 'unusedDoublers', checked: true }
  }
};

const noDoublers = {
  minehead: { left: 0 },
  sushi: { left: 0 },
  jellyOperator: { left: 0 },
  blackStars: { left: 0 },
  organicLabels: { left: 0 },
  omnijade: { left: 0 }
};

const account = ({ unlocked = true, missions = [], unlocks = [], boosts = [], doublers = {} } = {}) => ({
  finishedWorlds: { World6: true },
  menagerie: { unlocked, missions, unlocks, boosts, doublers: { ...noDoublers, ...doublers } }
});

const menagerieAlerts = (acc, opts = allOn) => getWorld7Alerts(acc, fields, opts, [])?.menagerie;

describe('menagerie alerts', () => {
  it('lists claimable missions among the visible ones only', () => {
    const missions = [
      { index: 0, name: 'Account LV', visible: true, canClaim: true },
      { index: 1, name: 'Tome', visible: true, canClaim: false },
      { index: 2, name: 'Hidden', visible: false, canClaim: true }
    ];
    expect(menagerieAlerts(account({ missions }))).toEqual({ claimableMissions: [{ index: 0, name: 'Account LV' }] });
  });

  it('lists visible unlocks that are affordable and not owned yet', () => {
    const unlocks = [
      { index: 0, name: 'Owned', cost: 10, owned: true, affordable: false, visible: true },
      { index: 1, name: 'Ready', cost: 20, owned: false, affordable: true, visible: true },
      { index: 2, name: 'Too pricey', cost: 1e9, owned: false, affordable: false, visible: true },
      { index: 3, name: 'Hidden', cost: 5, owned: false, affordable: true, visible: false }
    ];
    expect(menagerieAlerts(account({ unlocks }))).toEqual({ affordableUnlocks: [{ index: 1, name: 'Ready', cost: 20 }] });
  });

  it('lists visible affordable boosts', () => {
    const boosts = [
      { index: 0, level: 3, cost: 50, affordable: true, visible: true },
      { index: 1, level: 0, cost: 1e9, affordable: false, visible: true },
      { index: 2, level: 0, cost: 5, affordable: true, visible: false }
    ];
    expect(menagerieAlerts(account({ boosts }))).toEqual({ affordableBoosts: [{ index: 0, level: 3, cost: 50 }] });
  });

  it('lists every doubler kind with some left to place, in Boosts tab order', () => {
    const doublers = { omnijade: { left: 1 }, minehead: { left: 2 }, sushi: { left: -1 } };
    expect(menagerieAlerts(account({ doublers }))).toEqual({
      unusedDoublers: [{ key: 'minehead', left: 2 }, { key: 'omnijade', left: 1 }]
    });
  });

  it('stays quiet before the Menagerie is unlocked', () => {
    const missions = [{ index: 0, name: 'Account LV', visible: true, canClaim: true }];
    expect(menagerieAlerts(account({ unlocked: false, missions, doublers: { minehead: { left: 2 } } }))).toBeUndefined();
  });

  it('respects each option being off', () => {
    const off = { menagerie: { ...allOn.menagerie, unusedDoublers: { name: 'unusedDoublers', checked: false } } };
    const missions = [{ index: 0, name: 'Account LV', visible: true, canClaim: true }];
    const alerts = menagerieAlerts(account({ missions, doublers: { minehead: { left: 2 } } }), off);
    expect(alerts).toEqual({ claimableMissions: [{ index: 0, name: 'Account LV' }] });
  });
});
