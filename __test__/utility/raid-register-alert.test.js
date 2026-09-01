import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';

const fields = { etc: { checked: true } };
const options = { etc: { raidRegister: { name: 'raidRegister', checked: true } } };

// 611 is the raid-day registered-through flag, registering sets it to the current raid day + 1.
// RD is the server's current raid day, RC its registration-closed flag.
const account = ({ registeredThrough = 0, raidDay = 22, raidClosed = false, hasCompanion = true } = {}) => ({
  accountOptions: { 611: registeredThrough },
  companions: { list: [{ acquired: hasCompanion }] },
  tournament: { global: { RD: raidDay, RC: raidClosed } }
});

const raidRegister = (acc, opts = options) => getGeneralAlerts(acc, fields, opts, [])?.etc?.raidRegister;

describe('raid registration alert', () => {
  it('flags an unregistered raid day', () => {
    expect(raidRegister(account({ registeredThrough: 22, raidDay: 22 }))).toBe(true);
  });

  it('flags a raid day never registered for', () => {
    expect(raidRegister(account({ registeredThrough: 0, raidDay: 22 }))).toBe(true);
  });

  it('stops flagging once registered for the current day', () => {
    expect(raidRegister(account({ registeredThrough: 23, raidDay: 22 }))).toBeUndefined();
  });

  it('flags again the day after registering', () => {
    expect(raidRegister(account({ registeredThrough: 23, raidDay: 23 }))).toBe(true);
  });

  it('stays quiet while raid registration is closed', () => {
    expect(raidRegister(account({ registeredThrough: 22, raidDay: 22, raidClosed: true }))).toBeUndefined();
  });

  it('stays quiet before the first raid day', () => {
    expect(raidRegister(account({ registeredThrough: 0, raidDay: 0 }))).toBeUndefined();
  });

  it('stays quiet without a companion', () => {
    expect(raidRegister(account({ hasCompanion: false }))).toBeUndefined();
  });

  it('respects the option being off', () => {
    const off = { etc: { raidRegister: { name: 'raidRegister', checked: false } } };
    expect(raidRegister(account(), off)).toBeUndefined();
  });
});

describe('raid registration migration', () => {
  it('backfills the option on a stored config', () => {
    const stored = { version: 71, account: { General: { etc: { checked: true, options: [{ name: 'tournamentRegister', checked: true }] } } } };
    const migrated = migrateConfig({ version: 72 }, stored);
    expect(migrated?.account?.General?.etc?.options?.some((o) => o?.name === 'raidRegister' && o?.checked)).toBe(true);
  });
});
