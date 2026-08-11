import { describe, expect, it } from 'vitest';
import { getNextCompanionClaim, getRealDateInMs, UNKNOWN_TIME } from '@utility/helpers';

/**
 * The dashboard rendered "Next companion claim: NaNENaN days" for an account with no save.
 *
 * `1e3 * account?.timeAway?.GlobalTime` is NaN when GlobalTime is absent, and `Math.max(0, NaN)`
 * returns NaN rather than 0 - so the guard that looks like it clamps the value doesn't. The NaN
 * then flowed into getRealDateInMs and out as display text.
 *
 * The expression lived in three places (Etc.jsx, pets.jsx, utility/dashboard/account.js) and had
 * already drifted: one copy was missing the `?? 0` on lastFreeClaim. It is one helper now.
 */
const COOLDOWN_MS = 594e6;

describe('getNextCompanionClaim', () => {
  it('is finite for an account with no save at all', () => {
    expect(Number.isNaN(getNextCompanionClaim(undefined))).toBe(false);
    expect(Number.isNaN(getNextCompanionClaim({}))).toBe(false);
    expect(Number.isNaN(getNextCompanionClaim({ timeAway: {} }))).toBe(false);
  });

  it('returns a full cooldown from now when nothing has been claimed yet', () => {
    const before = new Date().getTime();
    const claim = getNextCompanionClaim({});
    expect(claim - before).toBeGreaterThanOrEqual(COOLDOWN_MS - 50);
    expect(claim - before).toBeLessThanOrEqual(COOLDOWN_MS + 50);
  });

  it('never returns a time in the past - the cooldown floor is 0, not a negative offset', () => {
    // A long-overdue claim: GlobalTime far beyond the cooldown.
    const account = { timeAway: { GlobalTime: 10_000_000 }, companions: { lastFreeClaim: 0 } };
    expect(getNextCompanionClaim(account)).toBeLessThanOrEqual(new Date().getTime() + 1);
  });

  it('counts down from the last claim for a real account', () => {
    // Half the cooldown elapsed since the last claim.
    const globalTime = 1_000_000;
    const lastFreeClaim = 1e3 * globalTime - COOLDOWN_MS / 2;
    const claim = getNextCompanionClaim({ timeAway: { GlobalTime: globalTime }, companions: { lastFreeClaim } });
    const remaining = claim - new Date().getTime();
    expect(remaining).toBeGreaterThan(COOLDOWN_MS / 2 - 50);
    expect(remaining).toBeLessThan(COOLDOWN_MS / 2 + 50);
  });

  it('treats a missing lastFreeClaim as 0 rather than NaN', () => {
    // utility/dashboard/account.js used to omit the `?? 0` here, so isPast(NaN) was false and the
    // "companion ready to claim" alert never fired for those accounts.
    const account = { timeAway: { GlobalTime: 10_000_000 } };
    expect(Number.isNaN(getNextCompanionClaim(account))).toBe(false);
  });
});

/**
 * The dashboard timer tooltips run every value through getRealDateInMs / useRealDate. Several of
 * the expressions feeding them (`now + (cost - owned) / rate * 1000` and friends in
 * components/dashboard/Etc.jsx) are NaN when the save has no data, and Infinity when a rate is 0.
 *
 * Both landed in the "too far out for a Date, show it as N days" branch, which is meant for
 * genuinely huge durations - producing "NaNENaN days" and "NaNEInfinity days" on screen. Guarding
 * every call site individually would leave the next one to be found by a user, so the guard is at
 * the formatting boundary.
 */
describe('getRealDateInMs non-finite input', () => {
  it('renders a placeholder rather than "NaNENaN days"', () => {
    for (const value of [NaN, Infinity, -Infinity, undefined, null]) {
      const result = getRealDateInMs(value);
      expect(result, `input ${String(value)}`).toBe(UNKNOWN_TIME);
      expect(/NaN|Infinity/.test(String(result)), `input ${String(value)} leaked`).toBe(false);
    }
  });

  it('still formats a normal timestamp', () => {
    expect(getRealDateInMs(new Date('2026-01-02T03:04:05').getTime())).toContain('02/01/2026');
  });

  it('still uses the "N days" form for a timestamp beyond the Date range', () => {
    // 8.64e15 is the max a Date can hold; past that the duration form is the intended output.
    const result = getRealDateInMs(9e15);
    expect(result).toContain('days');
    expect(/NaN|Infinity/.test(result)).toBe(false);
  });

  it('passes the raw value through untouched when shouldFormat is false', () => {
    expect(getRealDateInMs(NaN, false)).toBeNaN();
  });
});
