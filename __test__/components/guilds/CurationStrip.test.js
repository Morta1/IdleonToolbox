import { describe, it, expect } from 'vitest';
import {
  biggestClimber,
  closestGap,
  formatCountdown,
  msUntilWeeklyReset
} from '../../../components/guilds/CurationStrip';

const HOUR_MS = 3600 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;
// Saturday 1970-01-03 21:00 UTC — the canonical week-anchor moment.
const WEEK_ANCHOR_MS = (2 * 24 + 21) * HOUR_MS;

// ─── biggestClimber ───────────────────────────────────────────────────────────

describe('biggestClimber', () => {
  it('returns null for null input', () => {
    expect(biggestClimber(null)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(biggestClimber([])).toBeNull();
  });

  it('returns null when all deltas are null', () => {
    const guilds = [
      { guild_id: 'a', rank_delta_2w: null },
      { guild_id: 'b', rank_delta_2w: null }
    ];
    expect(biggestClimber(guilds)).toBeNull();
  });

  it('returns null when no guild improved (all deltas >= 0)', () => {
    const guilds = [
      { guild_id: 'a', rank_delta_2w: 0 },
      { guild_id: 'b', rank_delta_2w: 3 }
    ];
    expect(biggestClimber(guilds)).toBeNull();
  });

  it('returns the guild with the most-negative rank_delta_2w', () => {
    // rank_delta_2w = current_rank - rank_2w_ago; negative = improved rank.
    const guilds = [
      { guild_id: 'a', guild_name: 'Alpha', rank: 5, rank_delta_2w: -2 },
      { guild_id: 'b', guild_name: 'Beta', rank: 3, rank_delta_2w: -8 },
      { guild_id: 'c', guild_name: 'Gamma', rank: 10, rank_delta_2w: 1 }
    ];
    expect(biggestClimber(guilds)?.guild_id).toBe('b');
  });

  it('ignores guilds with null delta when choosing', () => {
    const guilds = [
      { guild_id: 'a', rank_delta_2w: null },
      { guild_id: 'b', rank_delta_2w: -5 }
    ];
    expect(biggestClimber(guilds)?.guild_id).toBe('b');
  });

  it('handles a single guild with improvement', () => {
    const guilds = [{ guild_id: 'solo', rank_delta_2w: -1 }];
    expect(biggestClimber(guilds)?.guild_id).toBe('solo');
  });
});

// ─── closestGap ──────────────────────────────────────────────────────────────

describe('closestGap', () => {
  it('returns null for null input', () => {
    expect(closestGap(null)).toBeNull();
  });

  it('returns null for fewer than 2 guilds', () => {
    expect(closestGap([{ guild_id: 'a', rank: 1, total_gp: 1000 }])).toBeNull();
  });

  it('returns null when fewer than 2 guilds are in the top 25', () => {
    const guilds = [
      { guild_id: 'a', rank: 1, total_gp: 10000 },
      { guild_id: 'b', rank: 50, total_gp: 5000 }
    ];
    expect(closestGap(guilds)).toBeNull();
  });

  it('finds the pair with the smallest relative GP gap in the top 25', () => {
    const guilds = [
      { guild_id: 'rank1', rank: 1, total_gp: 10000 },
      { guild_id: 'rank2', rank: 2, total_gp: 9500 },  // rel gap = 500/10000
      { guild_id: 'rank3', rank: 3, total_gp: 9490 },  // rel gap = 10/9500 ← smallest
      { guild_id: 'rank4', rank: 4, total_gp: 8000 }   // rel gap = 1490/9490
    ];
    const result = closestGap(guilds);
    expect(result).not.toBeNull();
    expect(result.leader.guild_id).toBe('rank2');
    expect(result.challenger.guild_id).toBe('rank3');
    expect(result.gap).toBe(10);
  });

  it('picks by relative gap, not absolute — a top pair beats a closer bottom pair', () => {
    // Absolute: ranks 3/4 are closer (5,000 vs 10,000). Relative: ranks 1/2
    // win (10000/1000000 = 1% vs 5000/100000 = 5%). Relative must prevail.
    const guilds = [
      { guild_id: 'rank1', rank: 1, total_gp: 1_000_000 },
      { guild_id: 'rank2', rank: 2, total_gp: 990_000 },  // abs 10,000 — rel 1%
      { guild_id: 'rank3', rank: 3, total_gp: 100_000 },
      { guild_id: 'rank4', rank: 4, total_gp: 95_000 }    // abs 5,000 — rel 5%
    ];
    const result = closestGap(guilds);
    expect(result.leader.guild_id).toBe('rank1');
    expect(result.challenger.guild_id).toBe('rank2');
    expect(result.gap).toBe(10_000); // displayed gap stays absolute
  });

  it('excludes guilds outside the top 25 from the gap search', () => {
    // Only ranks 1 and 2 are <= 25; rank 26 is excluded.
    const guilds = [
      { guild_id: 'rank1', rank: 1, total_gp: 10000 },
      { guild_id: 'rank2', rank: 2, total_gp: 9999 },  // gap = 1
      { guild_id: 'rank26', rank: 26, total_gp: 9998 } // excluded — not top 25
    ];
    const result = closestGap(guilds);
    expect(result).not.toBeNull();
    expect(result.leader.guild_id).toBe('rank1');
    expect(result.challenger.guild_id).toBe('rank2');
    expect(result.gap).toBe(1);
  });

  it('challenger is the lower-ranked guild (higher rank number)', () => {
    const guilds = [
      { guild_id: 'first', rank: 1, total_gp: 5000 },
      { guild_id: 'second', rank: 2, total_gp: 4990 }
    ];
    const result = closestGap(guilds);
    expect(result?.challenger.guild_id).toBe('second');
    expect(result?.leader.guild_id).toBe('first');
  });

  it('handles exactly 2 guilds in the top 25', () => {
    const guilds = [
      { guild_id: 'a', rank: 1, total_gp: 1000 },
      { guild_id: 'b', rank: 2, total_gp: 900 }
    ];
    const result = closestGap(guilds);
    expect(result).not.toBeNull();
    expect(result.gap).toBe(100);
  });

  it('limits the search to the top 25 even when given a longer list', () => {
    // 30 guilds; uniform 10,000 absolute gaps in the top 25. Ranks 26 & 27
    // are overridden to a 1-GP gap that must NOT be picked.
    const guilds = Array.from({ length: 30 }, (_, i) => ({
      guild_id: `g${i + 1}`,
      rank: i + 1,
      total_gp: 1_000_000 - i * 10_000
    }));
    guilds[25].total_gp = 749_999;
    guilds[26].total_gp = 749_998;
    const result = closestGap(guilds);
    expect(result).not.toBeNull();
    expect(result.gap).toBe(10_000);
    expect(result.leader.rank).toBeLessThanOrEqual(25);
    expect(result.challenger.rank).toBeLessThanOrEqual(25);
  });
});

// ─── msUntilWeeklyReset ──────────────────────────────────────────────────────

describe('msUntilWeeklyReset', () => {
  it('returns a full week at the exact reset instant — rolls over, never zero', () => {
    expect(msUntilWeeklyReset(WEEK_ANCHOR_MS)).toBe(WEEK_MS);
    // And the same N weeks later (proves periodicity).
    expect(msUntilWeeklyReset(WEEK_ANCHOR_MS + 100 * WEEK_MS)).toBe(WEEK_MS);
  });

  it('returns the remaining time mid-week', () => {
    expect(msUntilWeeklyReset(WEEK_ANCHOR_MS - 60_000)).toBe(60_000);
    expect(msUntilWeeklyReset(WEEK_ANCHOR_MS + 1000)).toBe(WEEK_MS - 1000);
  });
});

// ─── formatCountdown ─────────────────────────────────────────────────────────

describe('formatCountdown', () => {
  it('returns "now" for zero or negative durations', () => {
    expect(formatCountdown(0)).toBe('now');
    expect(formatCountdown(-1000)).toBe('now');
  });

  it('leading unit is unpadded; every smaller unit is zero-padded to 2 digits', () => {
    expect(formatCountdown(45_000)).toBe('45s');
    expect(formatCountdown(5 * 60_000 + 9_000)).toBe('5m 09s');
    expect(formatCountdown(2 * HOUR_MS + 15 * 60_000 + 7_000)).toBe('2h 15m 07s');
    expect(formatCountdown(6 * 24 * HOUR_MS + 5 * HOUR_MS + 3 * 60_000 + 4_000))
      .toBe('6d 05h 03m 04s');
  });

  it('drops zeroed leading units but keeps every unit smaller than the leading one', () => {
    // 5m 30s → no leading "0d 0h"; 1d 4h 37m 12s → full chain kept.
    expect(formatCountdown(5 * 60_000 + 30_000)).toBe('5m 30s');
    expect(formatCountdown(24 * HOUR_MS + 4 * HOUR_MS + 37 * 60_000 + 12_000))
      .toBe('1d 04h 37m 12s');
  });
});
