import { Box, Card, CardActionArea, Chip, Link, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import { notateNumber } from '@utility/helpers';

// ─── Pure derivation helpers (exported for testing) ──────────────────────────

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
 * (what the card displays) and challenger is the lower-ranked guild. Returns
 * null when fewer than 2 guilds fall in the top-25 slice.
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
    if (relGap < minRelGap) {
      minRelGap = relGap;
      leader = top25[i];         // higher rank (smaller rank number)
      challenger = top25[i + 1]; // lower rank (larger rank number, trying to overtake)
    }
  }

  if (!leader || !challenger) return null;
  return { leader, challenger, gap: leader.total_gp - challenger.total_gp };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Renders a highlight card. With `onClick`, the whole card is one click target
// (CardActionArea); without it, the card is a passive container whose children
// supply their own click targets (e.g. the two guild links in the gap card).
function CurationCard({ icon, label, children, onClick }) {
  const body = (
    <>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
          {label}
        </Typography>
      </Stack>
      {children}
    </>
  );
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ p: 2, height: '100%' }}>
          {body}
        </CardActionArea>
      ) : (
        <Box sx={{ p: 2, height: '100%' }}>{body}</Box>
      )}
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * CurationStrip — two "hero" highlight cards rendered above the leaderboard.
 *
 * Props:
 *   guilds  — the full guild list from the API (sorted by rank asc), or null/undefined while loading.
 *   router  — Next.js router instance (passed down from the page so no hook call here).
 */
export default function CurationStrip({ guilds, router }) {
  if (!guilds || guilds.length === 0) return null;

  const climber = biggestClimber(guilds);
  const closest = closestGap(guilds);

  // At least one card must have data to render the strip.
  if (!climber && !closest) return null;

  const navigate = (guildId) => {
    router.push(`/guilds/detail?id=${encodeURIComponent(guildId)}`);
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mb: 3 }}>
      {/* Card 1 — Biggest climber */}
      {climber && (
        <CurationCard
          icon={<TrendingUpIcon fontSize="small" color="success" />}
          label="Biggest climber (2 weeks)"
          onClick={() => navigate(climber.guild_id)}
        >
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {climber.guild_name}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
            <Chip
              label={`+${Math.abs(climber.rank_delta_2w)} ranks`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              now #{climber.rank}
            </Typography>
          </Stack>
        </CurationCard>
      )}

      {/* Card 2 — Closest gap in top 25 */}
      {closest && (
        <CurationCard
          icon={<SportsScoreIcon fontSize="small" sx={{ color: 'info.main' }} />}
          label="Closest gap (top 25)"
        >
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
            <Link
              component="button"
              type="button"
              variant="subtitle2"
              color="inherit"
              underline="hover"
              fontWeight={700}
              noWrap
              onClick={() => navigate(closest.leader.guild_id)}
              sx={{ maxWidth: '45%', textAlign: 'left' }}
            >
              {closest.leader.guild_name}
            </Link>
            <Typography variant="caption" color="text.secondary">vs</Typography>
            <Link
              component="button"
              type="button"
              variant="subtitle2"
              color="inherit"
              underline="hover"
              fontWeight={700}
              noWrap
              onClick={() => navigate(closest.challenger.guild_id)}
              sx={{ maxWidth: '45%', textAlign: 'left' }}
            >
              {closest.challenger.guild_name}
            </Link>
          </Stack>
          <Chip
            label={`${notateNumber(closest.gap, 'Whole')} GP gap`}
            size="small"
            color="info"
            variant="outlined"
          />
        </CurationCard>
      )}
    </Stack>
  );
}
