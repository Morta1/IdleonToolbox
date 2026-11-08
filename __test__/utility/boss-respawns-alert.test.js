import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts } from '../../utility/dashboard/account';
import { isMinibossReady } from '../../utility/dashboard/bossRespawns';

describe('isMinibossReady', () => {
  it.each([
    ['at the number', { current: 2, maxed: false }, 2, true],
    ['the number below the player\'s', { current: 4, maxed: false }, 5, false],
    ['maxed under a number it can never reach', { current: 6, maxed: true }, 10, true],
    ['the number left empty reads the lowest, 1', { current: 1, maxed: false }, '', true],
    ['nothing up with the number empty', { current: 0, maxed: false }, '', false],
    ['no number at all', { current: 9, maxed: false }, undefined, false]
  ])('%s', (_, miniboss, wanted, ready) => {
    expect(isMinibossReady(miniboss, wanted)).toBe(ready);
  });
});

const fields = { etc: { checked: true } };
const optionsFor = (value) => ({
  etc: { bossRespawns: { name: 'bossRespawns', type: 'array', checked: true, props: { value } } }
});
const allOn = optionsFor({ drDefecaus: true, babaYaga: true });

const upBosses = (bossesUp, opts = allOn) => getGeneralAlerts({}, fields, opts, [], null, { bossesUp })?.etc?.bossRespawns;

describe('boss respawns alert', () => {
  it('alerts on every boss that is up', () => {
    expect(upBosses({ drDefecaus: true, babaYaga: true })).toEqual(['drDefecaus', 'babaYaga']);
  });

  it('drops a boss once it is killed', () => {
    expect(upBosses({ drDefecaus: false, babaYaga: true })).toEqual(['babaYaga']);
  });

  it('skips a boss whose toggle is off', () => {
    expect(upBosses({ drDefecaus: true, babaYaga: true }, optionsFor({ drDefecaus: true, babaYaga: false }))).toEqual(['drDefecaus']);
  });

  it('stays quiet without tracker state', () => {
    expect(getGeneralAlerts({}, fields, allOn, [])?.etc?.bossRespawns).toBeUndefined();
  });

  it('stays quiet when the option is off', () => {
    const off = { etc: { bossRespawns: { name: 'bossRespawns', checked: false } } };
    expect(upBosses({ drDefecaus: true, babaYaga: true }, off)).toBeUndefined();
  });
});
