import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld3Alerts } from '../../utility/dashboard/account';

const fields = { atomCollider: { checked: true } };
const options = (checked = true, value = 90) => ({
  atomCollider: { stampReducer: { name: 'stampReducer', checked, props: { value } } }
});

const account = (stampReducer = 90) => ({ finishedWorlds: { World2: true }, atoms: { stampReducer } });

const alert = (acc, opts) => getWorld3Alerts(acc, fields, opts, [])?.atomCollider?.stampReducer;

describe('stamp reducer alert', () => {
  it('flags once the reducer reaches the threshold', () => {
    expect(alert(account(90), options(true, 90))).toBe(true);
  });

  it('stays quiet below the threshold', () => {
    expect(alert(account(80), options(true, 90))).toBeUndefined();
  });

  it('stays quiet when its own checkbox is off, even with atom collider on', () => {
    expect(alert(account(90), options(false, 90))).toBeUndefined();
  });

  it('stays quiet when atom collider is off', () => {
    expect(getWorld3Alerts(account(90), { atomCollider: { checked: false } }, options(true, 90), [])?.atomCollider)
      .toBeUndefined();
  });
});
