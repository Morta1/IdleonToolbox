import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getOptions, getWorld5Alerts } from '../../utility/dashboard/account';

const imports = (...names) => names.map((name) => ({ name, acquired: true }));
const gamingAlerts = (gaming, options) => {
  const section = { gaming: { checked: true, options } };
  return getWorld5Alerts(
    { finishedWorlds: { World4: true }, gaming: { unlocked: true, ...gaming } },
    section, getOptions(section))?.gaming;
};

describe('bog log ready alert', () => {
  const bogLog = (bogLogReady, owned = true) => gamingAlerts(
    { bogLogReady, imports: owned ? imports('Bog_Log') : [] },
    [{ name: 'bogLog', checked: true }])?.bogLog;

  it.each([
    [true, true, true],
    [false, true, undefined],
    [true, false, undefined]
  ])('ready %s, import owned %s -> %s', (ready, owned, expected) => {
    expect(bogLog(ready, owned)).toBe(expected);
  });
});

describe('snail success chance alert', () => {
  const snail = (successChance, threshold, snailLevel = 10, maxLevel = 25) => gamingAlerts(
    { snailLevel, snail: { successChance, maxLevel }, imports: imports('Immortal_Snail') },
    [{ name: 'snail', checked: true, props: { value: threshold } }])?.snail;

  it.each([
    [0.95, 90, 10, 95],
    [0.9, '90', 10, 90],
    [0.85, 90, 10, undefined],
    [1, 90, 25, undefined]
  ])('chance %s, threshold %s, level %s -> %s', (chance, threshold, level, expected) => {
    expect(snail(chance, threshold, level)).toBe(expected);
  });
});
