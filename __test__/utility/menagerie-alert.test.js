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

const account = ({ unlocked = true, missions = [], unlocks = [], boosts = [], doublers = {}, jellies, currencies, storage } = {}) => ({
  finishedWorlds: { World6: true },
  currencies,
  storage,
  menagerie: { unlocked, missions, unlocks, boosts, jellies, doublers: { ...noDoublers, ...doublers } }
});

const allJelliesUnlocked = [0, 1, 2, 3, 4, 5].map(() => ({ unlocked: true }));
const jellyOptions = {
  menagerie: {
    pinkJelly: { name: 'pinkJelly', checked: true, props: { value: 25 } },
    blueJelly: { name: 'blueJelly', checked: true },
    redJelly: { name: 'redJelly', checked: true, props: { value: 2 } },
    silverJelly: { name: 'silverJelly', checked: true },
    yellowJelly: { name: 'yellowJelly', checked: true }
  }
};

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

  it('alerts for the Lumi/hr and Mission boosts on their own options', () => {
    const boosts = [
      { index: 0, level: 3, cost: 50, affordable: true, visible: true },
      { index: 1, level: 7, cost: 80, affordable: true, visible: true }
    ];
    const opts = { menagerie: { lumiBoost: { checked: true }, missionBoost: { checked: true } } };
    expect(menagerieAlerts(account({ boosts }), opts)).toEqual({
      lumiBoost: { index: 1, level: 7, cost: 80 },
      missionBoost: { index: 0, level: 3, cost: 50 }
    });
  });

  it.each([
    ['pink upgrades within the coin spend share', {
      jellies: { pink: { costs: [20, 30] } }, currencies: { rawMoney: 100 }
    }, { pinkJelly: ['Shell'] }],
    ['ladles owned for Blue', {
      jellies: {}, storage: { list: [{ rawName: 'Ladle', amount: 12 }] }
    }, { blueJelly: 12 }],
    ['Red once the reading multi reaches the threshold', {
      jellies: { red: { level: 3, readingMulti: 2, chaptersTracked: 1 } }
    }, { redJelly: { daysRested: 3, readingMulti: 2 } }],
    ['Red stays quiet with no pages tracked', {
      jellies: { red: { level: 9, readingMulti: 5, chaptersTracked: 0 } }
    }, undefined],
    ['silver upgrades the fragments cover, skipping maxed ones', {
      jellies: { silver: { levels: [100, 3], maxLevels: [100, 190], costs: [1, 40] } }, currencies: { ObolFragments: 50 }
    }, { silverJelly: ['Fragments per auto trash'] }],
    ['Yellow once progress covers the requirement', {
      jellies: { yellow: { progress: 10, requirement: 10 } }
    }, { yellowJelly: true }]
  ])('alerts for %s', (_, { jellies, ...rest }, expected) => {
    const acc = account({ jellies: { sideUnlocked: allJelliesUnlocked, ...jellies }, ...rest });
    expect(menagerieAlerts(acc, jellyOptions)).toEqual(expected);
  });

  it('skips jellies that are not unlocked yet', () => {
    const jellies = { sideUnlocked: allJelliesUnlocked.map(() => ({ unlocked: false })), yellow: { progress: 10, requirement: 1 } };
    expect(menagerieAlerts(account({ jellies }), jellyOptions)).toBeUndefined();
  });

  it('skips doubler kinds turned off in the picker', () => {
    const opts = { menagerie: { unusedDoublers: { checked: true, props: { value: { minehead: false } } } } };
    const doublers = { minehead: { left: 2 }, sushi: { left: 1 } };
    expect(menagerieAlerts(account({ doublers }), opts)).toEqual({ unusedDoublers: [{ key: 'sushi', left: 1 }] });
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
