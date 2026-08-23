import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';

// The game returns a flat POW of 2 while OptLacc[478] (the spelunking
// tutorial step) is under 8 - see _customBlock_Spelunk("POW").
const TUTORIAL_STEP_INDEX = 478;

const parse = (mutate) => {
  const clone = structuredClone(raw);
  mutate?.(clone.data);
  return parseData(clone.data, clone.charNames, clone.companion, clone.guildData, clone.serverVars).account;
};

describe('spelunking power tutorial gate', () => {
  it('locks power to 2 while the tutorial is unfinished', () => {
    const account = parse((data) => {
      data.OptLacc[TUTORIAL_STEP_INDEX] = 7;
    });
    expect(account.spelunking.power.value).toBe(2);
    expect(account.spelunking.power.breakdown.categories[0].name).toBe('Tutorial');
  });

  it('uses the full calculation once the tutorial is done', () => {
    const account = parse((data) => {
      data.OptLacc[TUTORIAL_STEP_INDEX] = 8;
    });
    expect(account.spelunking.power.value).toBeGreaterThan(2);
    expect(account.spelunking.power.breakdown.categories[0].name).toBe('Additive');
  });
});
