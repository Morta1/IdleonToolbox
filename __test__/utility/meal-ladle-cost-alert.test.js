import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getOptions, getWorld4Alerts } from '../../utility/dashboard/account';

const section = (value, overflow = false) => ({
  cooking: {
    checked: true,
    options: [
      { name: 'mealLadleCost', checked: true, props: { value } },
      { name: 'includeOverflowingLadle', checked: overflow }
    ]
  }
});
// Speed 100 with cookReq 10: one ladle cooks 10 meals.
const account = {
  finishedWorlds: { World3: true },
  breeding: { pets: [] },
  cooking: {
    mealMaxLevel: 30,
    kitchens: [{ status: 0, mealSpeed: 60 }, { status: 0, mealSpeed: 40 }, { status: 3, mealSpeed: 1000 }],
    meals: [
      { name: 'cheap', level: 5, amount: 0, levelCost: 5, cookReq: 10 }, // 0.5 ladles
      { name: 'pricey', level: 5, amount: 0, levelCost: 50, cookReq: 10 }, // 5 ladles
      { name: 'ready', level: 5, amount: 10, levelCost: 5, cookReq: 10 },
      { name: 'maxed', level: 30, amount: 0, levelCost: 1, cookReq: 10 },
      null
    ]
  }
};
const run = (sec, characters = []) => getWorld4Alerts(account, sec, getOptions(sec), characters)?.cooking?.mealLadleCost;

describe('meals below a ladle cost alert', () => {
  it('counts unaffordable, unmaxed meals under the threshold', () => {
    expect(run(section(1))).toEqual({ count: 1, threshold: 1 });
    expect(run(section(10))).toEqual({ count: 2, threshold: 10 });
    expect(run(section(0.4))).toBeUndefined();
  });

  it('stays quiet with no cooking speed', () => {
    const sec = section(10);
    expect(getWorld4Alerts({ ...account, cooking: { ...account.cooking, kitchens: [] } }, sec, getOptions(sec), [])?.cooking?.mealLadleCost).toBeUndefined();
  });

  it('divides by Overflowing Ladle only when toggled', () => {
    const characters = [{
      name: 'bb',
      class: 'Blood_Berserker',
      talents: { 3: { orderedTalents: [{ name: 'OVERFLOWING_LADLE', level: 1, maxLevel: 1, funcX: 'add', x1: 900, x2: 0 }] } }
    }];
    expect(run(section(1), characters)).toEqual({ count: 1, threshold: 1 });
    expect(run(section(1, true), characters)).toEqual({ count: 2, threshold: 1 });
  });
});
