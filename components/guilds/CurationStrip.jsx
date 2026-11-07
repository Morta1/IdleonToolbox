// What the guild list's Summary reads off the list: pure, and exported for testing.

/**
 * Returns the guild with the largest rank improvement over 2 weeks.
 * rank_delta_2w = current_rank - rank_2w_ago, so a NEGATIVE value means
 * the guild climbed (smaller number = higher rank). We want the most-negative.
 * Returns null when there are no guilds or no valid delta.
 */
export function biggestClimber(guilds) {
  if (!guilds || guilds.length === 0) return null;
  let best = null;
  for (const g of guilds) {
    if (g.rank_delta_2w == null) continue;
    // A climber has rank_delta_2w < 0; we want the most-negative (largest improvement).
    if (best === null || g.rank_delta_2w < best.rank_delta_2w) {
      best = g;
    }
  }
  // Only return if there was actually improvement (delta < 0).
  if (!best || best.rank_delta_2w >= 0) return null;
  return best;
}

/**
 * Finds the adjacent rank-pair among the top 25 guilds (by rank) with the
 * smallest RELATIVE total_gp gap (gap / leader.total_gp). Relative rather
 * than absolute: absolute gaps shrink down the ranks, so an absolute metric
 * would bias the result toward the bottom of the slice.
 *
 * Returns { leader, challenger, gap } where gap is the ABSOLUTE GP difference
 * (what the Summary displays) and challenger is the lower-ranked guild. Returns
 * null when fewer than 2 guilds fall in the top-25 slice. A pair whose ranks and GP
 * disagree (ranks are stored per hourly tick, so a skipped guild can read out of order) is
 * skipped: it has no gap to show.
 *
 * The input list is assumed already sorted ascending by rank (as delivered
 * by the API). We slice to the top 25 by rank, not by array index, to be
 * defensive against any ordering surprises.
 */
export function closestGap(guilds) {
  if (!guilds || guilds.length < 2) return null;

  // Take guilds with rank 1-25, sorted by rank asc.
  const top25 = guilds
    .filter((g) => g.rank != null && g.rank >= 1 && g.rank <= 25)
    .sort((a, b) => a.rank - b.rank);

  if (top25.length < 2) return null;

  let minRelGap = Infinity;
  let leader = null;
  let challenger = null;

  for (let i = 0; i < top25.length - 1; i++) {
    const relGap = (top25[i].total_gp - top25[i + 1].total_gp) / top25[i].total_gp;
    if (relGap >= 0 && relGap < minRelGap) {
      minRelGap = relGap;
      leader = top25[i];         // higher rank (smaller rank number)
      challenger = top25[i + 1]; // lower rank (larger rank number, trying to overtake)
    }
  }

  if (!leader || !challenger) return null;
  return { leader, challenger, gap: leader.total_gp - challenger.total_gp };
}

// Idleon's reporting week boundary is Saturday 21:00 UTC. The canonical anchor
// lives in WeeklyProgressChart.jsx; redefined here so this file stays
// self-contained for testing.
const HOUR_MS = 3600 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;
const WEEK_ANCHOR_MS = (2 * 24 + 21) * HOUR_MS; // Sat 1970-01-03 21:00 UTC

/**
 * Milliseconds until the next Saturday-21:00-UTC reset. At the exact reset
 * instant, returns WEEK_MS (a full week away) rather than 0: the countdown
 * never displays "zero," it rolls straight over to the next week.
 */
export function msUntilWeeklyReset(now) {
  const offset = ((now - WEEK_ANCHOR_MS) % WEEK_MS + WEEK_MS) % WEEK_MS;
  return offset === 0 ? WEEK_MS : WEEK_MS - offset;
}

// When the current guild week ends, on the visitor's clock. A page calls it once its data has arrived.
export const nextWeeklyReset = () => {
  const now = Date.now();
  return now + msUntilWeeklyReset(now);
};
