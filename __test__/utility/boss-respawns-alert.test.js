import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts } from '../../utility/dashboard/account';

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
