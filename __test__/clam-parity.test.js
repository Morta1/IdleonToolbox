import '../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../data/raw.json';
import { getClamBonus, getClamCost, getClamHp, getClamLevels, parseClamWork } from '@parsers/world-7/clamWork';

// Captured live from the game via the debug server, same account state as raw.json.
const GAME = {
  costs: [2367.0020094966344, 46064282.66105488, 4607.269540135561, 2653272.1583636967, 641781.0079233249,
    9444623.736566508, 9212853.773584904, 230321344.33962262, 5758033608.490565],
  bonuses: [38, 11, 39, 89.625, 324, 400, 0, 0, 0],
  pearlValue: 73.95375,
  black: 450,
  mobs: 13,
  hp: 2.43e+23,
  multiKill: 3585
};

describe('clam work matches the game', () => {
  const { data, charNames, companion, guildData, serverVars } = raw;
  const { account } = parseData(data, charNames, companion, guildData, serverVars);
  const levels = getClamLevels(account);
  const workerClass = account.clamWork.workerClass;
  const view = parseClamWork(account, null, GAME.multiKill);

  it('matches upgrade costs', () => {
    GAME.costs.forEach((expected, index) => {
      expect(getClamCost(levels, index, workerClass)).toBeCloseTo(expected, 6);
    });
  });

  it('matches upgrade bonuses', () => {
    GAME.bonuses.forEach((expected, index) => {
      expect(getClamBonus(levels, index, GAME.multiKill)).toBeCloseTo(expected, 6);
    });
  });

  it('matches pearl value, black pearl value, mobs and clam hp', () => {
    expect(view.pearlValue).toBeCloseTo(GAME.pearlValue, 6);
    expect(view.blackPearlValue).toBeCloseTo(GAME.black, 6);
    expect(view.mobs).toBe(GAME.mobs);
    expect(getClamHp(workerClass)).toBeCloseTo(GAME.hp, -10);
  });
});
