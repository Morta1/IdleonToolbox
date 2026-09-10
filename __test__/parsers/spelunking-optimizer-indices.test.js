import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';
import {
  getOptimizedSpelunkingAmberGainUpgrades,
  getOptimizedSpelunkingPowerUpgrades
} from '@parsers/world-7/spelunking';

// Spelunk[5] is the shop upgrade level array; -1 means the upgrade is still locked, which the
// optimizer skips on its own. The demo account has 54/60/67 locked, so they have to be opened
// before the index lists can be exercised at all.
const RAW_UPGRADE_LEVELS = 5;
// Spelunk[4][8] is the Overstim stack. Amber-Track's bonus is a flat multiple of it, so the
// demo account's stack of 0 makes the upgrade genuinely worth nothing - the optimizer is right
// to pass on it there, and the list fix only shows up once the stack is non-zero.
const RAW_OVERSTIM = 4;
const RAW_OVERSTIM_STACK = 8;

const MANIC_POW = 54;
const AMBER_TRACK = 60;
const AMBER_SUPPLY_SWAP = 67;

const run = (unlock, { overstimStack = 0 } = {}) => {
  const clone = structuredClone(raw);
  const spelunk = JSON.parse(clone.data.Spelunk);
  unlock.forEach((index) => {
    spelunk[RAW_UPGRADE_LEVELS][index] = 0;
  });
  spelunk[RAW_OVERSTIM][RAW_OVERSTIM_STACK] = overstimStack;
  clone.data.Spelunk = JSON.stringify(spelunk);

  const { account, characters } = parseData(
    clone.data, clone.charNames, clone.companion, clone.guildData, clone.serverVars
  );
  const options = { characters };
  return {
    power: getOptimizedSpelunkingPowerUpgrades(characters[0], account, 60, options).map(({ index }) => index),
    amber: getOptimizedSpelunkingAmberGainUpgrades(characters[0], account, 60, options).map(({ index }) => index)
  };
};

describe('spelunking optimizer upgrade indices', () => {
  it('offers Manic_POW as a power upgrade once it is unlocked', () => {
    const { power } = run([MANIC_POW]);
    expect(power).toContain(MANIC_POW);
  });

  it('offers Amber-Track as an amber gain upgrade once it is unlocked', () => {
    const { amber } = run([AMBER_TRACK], { overstimStack: 20 });
    expect(amber).toContain(AMBER_TRACK);
  });

  it('leaves Amber-Track alone while the Overstim stack is still zero', () => {
    const { amber } = run([AMBER_TRACK]);
    expect(amber).not.toContain(AMBER_TRACK);
  });

  // 67 multiplies amber gain by 15 but divides the drop chance by 10. The optimizer scores amber
  // gain alone, so listing it would rank a ~1.5x net upgrade as a 15x one, ahead of everything.
  it('never offers Amber Supply Swap while the metric ignores drop chance', () => {
    const { amber } = run([AMBER_SUPPLY_SWAP], { overstimStack: 20 });
    expect(amber).not.toContain(AMBER_SUPPLY_SWAP);
  });
});
