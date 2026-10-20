import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { checkBound, getGeneralAlerts, getOptions } from '../../utility/dashboard/account';
import { findQuantityOwned, getAllItems } from '@parsers/items';
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { createGoal } from '@utility/goals/store';
import { items } from '@website-data';

const { account, characters } = parseFixture(latest);
const section = { materialTracker: { checked: true, options: [] } };
const owned = getAllItems(characters, account);
// Any item the fixture holds more than a few of, so every bound can sit on either side of it
const rawName = Object.keys(items).find((key) => (findQuantityOwned(owned, items[key].displayName).amount ?? 0) > 1000);
const name = cleanUnderscore(items[rawName].displayName);
const amount = findQuantityOwned(owned, items[rawName].displayName).amount;

const alertFor = (context) => getGeneralAlerts(account, section, getOptions(section), characters, undefined, context)?.materialTracker;
const itemGoal = (fields) => createGoal({ system: 'item', key: rawName, metric: 'quantity', ...fields });

const goalsFor = ({ lower, upper, nearly, note = '' }) => [
  ...(lower ? [itemGoal({ op: '>=', target: lower, nearAlert: nearly, note })] : []),
  ...(upper ? [itemGoal({ op: '<=', target: upper, nearAlert: nearly, note })] : [])
];

describe('material tracker alert from item goals', () => {
  it.each([
    ['lower bound, below', { lower: amount * 2 }],
    ['lower bound, above (no alert)', { lower: Math.floor(amount / 2) }],
    ['upper bound, above', { upper: Math.floor(amount / 2) }],
    ['upper bound, below (no alert)', { upper: amount * 2 }],
    ['range, outside', { lower: amount * 2, upper: amount * 3 }],
    ['range, inside (no alert)', { lower: Math.floor(amount / 2), upper: amount * 2 }],
    ['lower bound, nearly', { lower: amount, nearly: true }],
    ['upper bound, nearly', { upper: amount, nearly: true }],
    ['range, nearly', { lower: amount, upper: amount * 3, nearly: true }]
  ])('%s matches checkBound for the same tracker entry', (_, bounds) => {
    const expected = checkBound(name, amount, bounds.lower ?? '', bounds.upper ?? '', !!bounds.nearly, 5);
    const alert = alertFor({ itemGoals: goalsFor({ ...bounds, note: 'keep some' }) });
    expect(alert).toEqual(expected
      ? [{ key: rawName, iconPath: `data/${rawName}`, text: expected, note: 'keep some' }]
      : undefined);
  });

  it('a watch goal shows the owned count', () => {
    const alert = alertFor({ itemGoals: [itemGoal({ op: '>=', target: 0, watch: true })] });
    expect(alert).toEqual([{ key: rawName, iconPath: `data/${rawName}`, text: `You have ${notateNumber(amount)} ${name}`, note: '' }]);
  });

  it('a greenstack goal lists its 5 closest short items', () => {
    const short = ['Copper Ore', 'Iron Ore', 'Gold Ore', 'Plat Ore', 'Dementia Ore', 'Void Ore', 'Lustre Ore', 'Starfire Ore']
      .map((entryName, i) => ({ key: `K${i}`, name: entryName, icon: `data/K${i}`, value: 9.6e6 - i * 1e6, targetValue: 1e7 }));
    const greenstackView = { id: 'g', system: 'greenstack', status: 'ok', icon: 'data/Copper', short, shortCount: short.length };
    expect(alertFor({ itemGoals: [], greenstackView })).toEqual([{
      key: 'greenstack',
      iconPath: 'data/Copper',
      text: '8 greenstacks to go',
      lines: ['Copper Ore 9.6M / 10M', 'Iron Ore 8.6M / 10M', 'Gold Ore 7.6M / 10M', 'Plat Ore 6.6M / 10M',
        'Dementia Ore 5.6M / 10M', 'and 3 more']
    }]);
  });

  it('a reached greenstack goal raises nothing', () => {
    const greenstackView = { id: 'g', system: 'greenstack', status: 'reached', icon: 'data/Copper', short: [], shortCount: 0 };
    expect(alertFor({ itemGoals: [], greenstackView })).toBeUndefined();
  });

  it('never reads the old material-tracker key', () => {
    expect(alertFor({ itemGoals: [] })).toBeUndefined();
    expect(alertFor(undefined)).toBeUndefined();
  });
});
