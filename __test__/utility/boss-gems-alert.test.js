import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts, getOptions } from '../../utility/dashboard/account';

const section = { etc: { checked: true, options: [{ name: 'gemsFromBosses', checked: true }] } };
const bossGems = (merit) => getGeneralAlerts(
  { accountOptions: { 195: 200 }, tasks: [[], [], [[], [0, 0, 0, 0, merit]]] },
  section, getOptions(section), [])?.gemsFromBosses;

describe('daily boss gem fights alert', () => {
  it('counts fights left once the World 2 boss gem merit is bought', () => {
    expect(bossGems(1)).toBe(100);
  });

  it('stays quiet without the merit, since bosses cannot drop gems then', () => {
    expect(bossGems(0)).toBeUndefined();
  });
});
