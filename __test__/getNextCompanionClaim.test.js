import { describe, expect, it } from 'vitest';
import { getNextCompanionClaim, getRealDateInMs, UNKNOWN_TIME } from '@utility/helpers';

// 2.3.525 made the free pet claim daily instead of weekly, but the server kept the old deadline
// formula: getFreeCompanionRemainingTime answers max(0, anchor + 594000000 - now) and a claim writes
// anchor = claimTime - 511200000, so the deadline lands 23h out. The site mirrors the server formula
// (see FREE_COMPANION_CLAIM_ANCHOR_OFFSET_MS), which is why the offset here is 594000000 and the
// anchor a freshly claimed account stores is 5.9 days in the past.
const ANCHOR_OFFSET_MS = 594000000;
const CLAIM_BACKDATE_MS = 511200000;
const COOLDOWN_MS = ANCHOR_OFFSET_MS - CLAIM_BACKDATE_MS; // 82800000, the 23h the player actually waits
const anchorForClaimAt = (claimTime) => claimTime - CLAIM_BACKDATE_MS;

describe('getNextCompanionClaim', () => {
  it('is finite for an account with no save at all', () => {
    expect(Number.isNaN(getNextCompanionClaim(undefined))).toBe(false);
    expect(Number.isNaN(getNextCompanionClaim({}))).toBe(false);
    expect(Number.isNaN(getNextCompanionClaim({ companions: {} }))).toBe(false);
  });

  it('is claimable when nothing has ever been claimed', () => {
    expect(getNextCompanionClaim({})).toBeLessThanOrEqual(new Date().getTime());
  });

  it('counts down 23h from a claim that just happened, not from the stored anchor', () => {
    const now = new Date().getTime();
    const claim = getNextCompanionClaim({ companions: { freeClaimAnchor: anchorForClaimAt(now) } });
    expect(claim - now).toBe(COOLDOWN_MS);
  });

  it('counts down from the last claim for a real account', () => {
    const claimedAt = new Date().getTime() - COOLDOWN_MS / 2;
    const claim = getNextCompanionClaim({ companions: { freeClaimAnchor: anchorForClaimAt(claimedAt) } });
    const remaining = claim - new Date().getTime();
    expect(remaining).toBeGreaterThan(COOLDOWN_MS / 2 - 50);
    expect(remaining).toBeLessThan(COOLDOWN_MS / 2 + 50);
  });

  it('is claimable again once a full cooldown has passed', () => {
    const claimedAt = new Date().getTime() - COOLDOWN_MS - 1000;
    const account = { companions: { freeClaimAnchor: anchorForClaimAt(claimedAt) } };
    expect(getNextCompanionClaim(account)).toBeLessThan(new Date().getTime());
  });

  // The regression that pinned the timer on "Go claim!" twice: the anchor is stored 5.9 days stale
  // on purpose, so treating it as the claim time and adding 23h/24h always lands in the past.
  it('does not treat the anchor as the claim time', () => {
    const now = new Date().getTime();
    const account = { companions: { freeClaimAnchor: anchorForClaimAt(now) } };
    expect(getNextCompanionClaim(account)).toBeGreaterThan(now);
  });

  // Verified live: claiming the Pet Mart free pet moved the anchor to 1788343832258 and the game
  // server's own deadline to 1788937832258.
  it('matches the server deadline observed on a live account', () => {
    expect(getNextCompanionClaim({ companions: { freeClaimAnchor: 1788343832258 } })).toBe(1788937832258);
    expect(getNextCompanionClaim({ companions: { freeClaimAnchor: 1788156047455 } })).toBe(1788750047455);
  });

  it('ignores GlobalTime - the save clock drifts behind the browser clock', () => {
    const freeClaimAnchor = new Date().getTime();
    const stale = { timeAway: { GlobalTime: 10_000_000 }, companions: { freeClaimAnchor } };
    expect(getNextCompanionClaim(stale)).toBe(freeClaimAnchor + ANCHOR_OFFSET_MS);
  });

  it('treats a missing anchor as 0 rather than NaN', () => {
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
