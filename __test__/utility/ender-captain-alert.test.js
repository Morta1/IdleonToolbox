import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld5Alerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';

const fields = { sailing: { checked: true } };
const sailingOptions = (alwaysEnder) => ({
  sailing: {
    captains: { name: 'captains', checked: true },
    alwaysAlertEnderCaptains: { name: 'alwaysAlertEnderCaptains', checked: alwaysEnder }
  }
});

const captain = ({ captainIndex, captainType = 6, first = 0, second = 1, firstValue = 50, secondValue = 50 }) => ({
  captainIndex,
  captainType,
  firstBonusIndex: first,
  secondBonusIndex: second,
  firstBonusValue: firstValue,
  secondBonusValue: secondValue,
  firstBonusDescription: '',
  secondBonusDescription: ''
});

// Shop Ender with weaker stats on the same bonus types as the crew.
const weakShopEnder = captain({ captainIndex: 10, firstValue: 10, secondValue: 10 });

const account = (crewType = 6) => ({
  finishedWorlds: { World4: true },
  sailing: {
    captains: [captain({ captainIndex: 0, captainType: crewType }), captain({ captainIndex: 1, captainType: crewType })],
    shopCaptains: [weakShopEnder]
  }
});

const captainAlerts = (acc, alwaysEnder) => getWorld5Alerts(acc, fields, sailingOptions(alwaysEnder), [])?.sailing?.captains;

describe('ender captain shop alert', () => {
  it('stays quiet on a weaker Ender when every slot is already Ender', () => {
    expect(captainAlerts(account(), false)).toBeUndefined();
  });

  it('flags a weaker Ender when always-alert is on', () => {
    expect(captainAlerts(account(), true)?.[0]?.enderCaptain).toBe(true);
  });

  it('still flags an Ender while some slots are not Ender', () => {
    expect(captainAlerts(account(0), false)?.length).toBe(1);
  });

  it('migration adds the option, off by default', () => {
    const migrated = migrateConfig({ version: 79 }, {
      version: 78,
      account: { 'World 5': { sailing: { checked: true, options: [{ name: 'captains', checked: true }] } } }
    });
    const option = migrated.account['World 5'].sailing.options.find(({ name }) => name === 'alwaysAlertEnderCaptains');
    expect(option?.checked).toBe(false);
  });
});
