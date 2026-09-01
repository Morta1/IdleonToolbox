import { describe, expect, it } from 'vitest';
import { getNextCompanionClaim, getRealDateInMs, UNKNOWN_TIME } from '@utility/helpers';

// 2.3.525 made the free pet claim daily instead of weekly. The window is server-side
// (getFreeCompanionRemainingTimeDaily); probing it live gave max(0, lastFreeClaim + 82800000 - now),
// so the site mirrors that 23h constant (see FREE_COMPANION_CLAIM_INTERVAL_MS).
const COOLDOWN_MS = 82800000;

describe('getNextCompanionClaim', () => {
  it('is finite for an account with no save at all', () => {
    expect(Number.isNaN(getNextCompanionClaim(undefined))).toBe(false);
    expect(Number.isNaN(getNextCompanionClaim({}))).toBe(false);
    expect(Number.isNaN(getNextCompanionClaim({ companions: {} }))).toBe(false);
  });

  it('is claimable when nothing has ever been claimed', () => {
    expect(getNextCompanionClaim({})).toBeLessThanOrEqual(new Date().getTime());
  });

  it('counts down a full cooldown from a claim that just happened', () => {
    const now = new Date().getTime();
    const claim = getNextCompanionClaim({ companions: { lastFreeClaim: now } });
    expect(claim - now).toBe(COOLDOWN_MS);
  });

  it('counts down from the last claim for a real account', () => {
    const lastFreeClaim = new Date().getTime() - COOLDOWN_MS / 2;
    const claim = getNextCompanionClaim({ companions: { lastFreeClaim } });
    const remaining = claim - new Date().getTime();
    expect(remaining).toBeGreaterThan(COOLDOWN_MS / 2 - 50);
    expect(remaining).toBeLessThan(COOLDOWN_MS / 2 + 50);
  });

  it('is claimable again once a full cooldown has passed', () => {
    const lastFreeClaim = new Date().getTime() - COOLDOWN_MS - 1000;
    expect(getNextCompanionClaim({ companions: { lastFreeClaim } })).toBeLessThan(new Date().getTime());
  });

  it('ignores GlobalTime - the save clock drifts behind the browser clock', () => {
    const lastFreeClaim = new Date().getTime();
    const stale = { timeAway: { GlobalTime: 10_000_000 }, companions: { lastFreeClaim } };
    expect(getNextCompanionClaim(stale)).toBe(lastFreeClaim + COOLDOWN_MS);
  });

  it('treats a missing lastFreeClaim as 0 rather than NaN', () => {
    const account = { timeAway: { GlobalTime: 10_000_000 } };
    expect(Number.isNaN(getNextCompanionClaim(account))).toBe(false);
  });
});

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
    const result = getRealDateInMs(9e15);
    expect(result).toContain('days');
    expect(/NaN|Infinity/.test(result)).toBe(false);
  });

  it('passes the raw value through untouched when shouldFormat is false', () => {
    expect(getRealDateInMs(NaN, false)).toBeNaN();
  });
});
