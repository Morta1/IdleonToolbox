import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getWorld6Alerts } from '@utility/dashboard/account';
import { ninjaExtraInfo } from '@website-data';
import latest from '../fixtures/latest.json';

const fields = { beanstalk: { checked: true } };
const options = { beanstalk: { readyToPlant: { name: 'readyToPlant', checked: true } } };

let account;
let characters;

beforeAll(() => {
  const { data, charNames, companion, guildData, serverVars } = latest;
  const parsed = parseData(data, charNames, companion, guildData, serverVars);
  account = parsed.account;
  characters = parsed.characters;
});

const withBeanstalkData = (beanstalkData) => ({
  ...account,
  sneaking: { ...account.sneaking, beanstalkData }
});

describe('beanstalk readyToPlant alert', () => {
  it('flags a food once you own its next rank breakpoint', () => {
    const foods = ninjaExtraInfo[29].filter((str) => isNaN(str));
    // Golden Meat Pie sits at rank 1 on this save with over 24m owned, so every breakpoint the
    // alert can ask for is already met.
    const index = foods.indexOf('FoodG3');
    const ranks = foods.map((_, i) => (i === index ? 0 : 3));
    const alerts = getWorld6Alerts(withBeanstalkData(ranks), fields, options, characters);
    expect(alerts?.beanstalk?.readyToPlant).toEqual([
      expect.objectContaining({ rawName: 'FoodG3', breakpoint: 10000, rank: 0 })
    ]);
  });

  it('never flags a maxed food', () => {
    const ranks = ninjaExtraInfo[29].filter((str) => isNaN(str)).map(() => 3);
    expect(getWorld6Alerts(withBeanstalkData(ranks), fields, options, characters).beanstalk).toBeUndefined();
  });

  it('stays silent when you own less than the breakpoint', () => {
    const foods = ninjaExtraInfo[29].filter((str) => isNaN(str));
    // Butter Bar is the one food this save holds under 10k of.
    const index = foods.indexOf('ButterBar');
    const ranks = foods.map((_, i) => (i === index ? 0 : 3));
    expect(getWorld6Alerts(withBeanstalkData(ranks), fields, options, characters).beanstalk).toBeUndefined();
  });

  it('stays silent when the tracker is off', () => {
    expect(getWorld6Alerts(account, { beanstalk: { checked: false } }, options, characters).beanstalk).toBeUndefined();
  });

  it('stays silent when the jade bonus is locked', () => {
    const locked = { ...account, sneaking: { ...account.sneaking, jadeEmporium: [] } };
    expect(getWorld6Alerts(locked, fields, options, characters).beanstalk).toBeUndefined();
  });
});
