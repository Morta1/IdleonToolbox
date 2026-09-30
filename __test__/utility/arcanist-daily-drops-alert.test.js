import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';

const fields = { etc: { checked: true } };
const optionsFor = (value) => ({
  etc: { arcanistDailyDrops: { name: 'arcanistDailyDrops', type: 'array', checked: true, props: { value } } }
});

// accountOptions[396] / [397] count today's weapon / ring drops; tesseract 5 / 23 unlock each type.
const account = ({ weaponsDropped = 0, ringsDropped = 0 } = {}) => ({
  accountOptions: { 396: weaponsDropped, 397: ringsDropped },
  tesseract: { upgrades: { 5: { bonus: 1 }, 23: { bonus: 1 } } }
});

const dropTypes = (acc, opts) => getGeneralAlerts(acc, fields, opts, [])?.etc?.arcanistDailyDrops?.map(({ type }) => type);

describe('arcanist daily drops alert', () => {
  it('alerts on both types when both are on', () => {
    expect(dropTypes(account(), optionsFor({ weapon: true, ring: true }))).toEqual(['weapon', 'ring']);
  });

  it('skips the ring when only the weapon is on', () => {
    expect(dropTypes(account(), optionsFor({ weapon: true, ring: false }))).toEqual(['weapon']);
  });

  it('skips the weapon when only the ring is on', () => {
    expect(dropTypes(account(), optionsFor({ weapon: false, ring: true }))).toEqual(['ring']);
  });

  it('stays quiet when both are off', () => {
    expect(dropTypes(account(), optionsFor({ weapon: false, ring: false }))).toBeUndefined();
  });

  it('treats a config without per-type flags as both on', () => {
    const legacy = { etc: { arcanistDailyDrops: { name: 'arcanistDailyDrops', checked: true } } };
    expect(dropTypes(account(), legacy)).toEqual(['weapon', 'ring']);
  });

  it('drops a type that hit its daily cap', () => {
    expect(dropTypes(account({ ringsDropped: 100 }), optionsFor({ weapon: true, ring: true }))).toEqual(['weapon']);
  });
});

describe('arcanist daily drops migration', () => {
  const stored = (checked) => ({
    version: 77,
    account: { General: { etc: { checked: true, options: [{ name: 'arcanistDailyDrops', checked, helperText: '' }] } } }
  });
  const migratedOption = (checked) => migrateConfig({ version: 78 }, stored(checked))
    ?.account?.General?.etc?.options?.find((o) => o?.name === 'arcanistDailyDrops');

  it('splits an enabled option into both types on', () => {
    const option = migratedOption(true);
    expect(option.type).toBe('array');
    expect(option.checked).toBe(true);
    expect(option.props.value).toEqual({ weapon: true, ring: true });
  });

  it('keeps a disabled option off for both types', () => {
    expect(migratedOption(false).props.value).toEqual({ weapon: false, ring: false });
  });
});
