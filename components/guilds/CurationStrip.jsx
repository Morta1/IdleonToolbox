import { useEffect, useState } from 'react';
import { Box, Card, CardActionArea, Chip, Link, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import ScheduleIcon from '@mui/icons-material/Schedule';
import useFormatDate from '@hooks/useFormatDate';
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

// Idleon's reporting week boundary is Saturday 21:00 UTC. The canonical anchor
// lives in WeeklyProgressChart.jsx; redefined here so this file stays
// self-contained for testing.
const HOUR_MS = 3600 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;
const WEEK_ANCHOR_MS = (2 * 24 + 21) * HOUR_MS; // Sat 1970-01-03 21:00 UTC

/**
 * Milliseconds until the next Saturday-21:00-UTC reset. At the exact reset
 * instant, returns WEEK_MS (a full week away) rather than 0 — the countdown
 * never displays "zero," it rolls straight over to the next week.
 */
export function msUntilWeeklyReset(now) {
  const offset = ((now - WEEK_ANCHOR_MS) % WEEK_MS + WEEK_MS) % WEEK_MS;
  return offset === 0 ? WEEK_MS : WEEK_MS - offset;
}

/**
 * Structured countdown segments — leading zero-units are trimmed, the first
 * remaining unit is unpadded, and all units after it are 2-digit zero-padded
 * so the width stays stable as time ticks down. Returns null at zero (the
 * caller renders a "now" label instead).
 *   12s            → [{ value: 12, unit: 's', pad: 1 }]
 *   5m 30s         → [5m pad:1] [30s pad:2]
 *   1d 04h 37m 12s → [1d pad:1] [04h pad:2] [37m pad:2] [12s pad:2]
 */
export function countdownParts(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const segments = [
    { value: Math.floor(totalSeconds / 86_400), unit: 'd' },
    { value: Math.floor((totalSeconds % 86_400) / 3600), unit: 'h' },
    { value: Math.floor((totalSeconds % 3600) / 60), unit: 'm' },
    { value: totalSeconds % 60, unit: 's' }
  ];
  let firstIdx = segments.findIndex((p) => p.value > 0);
  // All zero (sub-second remainder rounded down) — keep the seconds slot so
  // we render "0s" rather than nothing.
  if (firstIdx === -1) firstIdx = 3;
  return segments.slice(firstIdx).map((p, i) => ({ ...p, pad: i === 0 ? 1 : 2 }));
}

/**
 * String form of the countdown, derived from countdownParts.
 *   "6d 23h 47m 12s" · "4h 03m 09s" · "5m 30s" · "12s" · "now"
 */
export function formatCountdown(ms) {
  const parts = countdownParts(ms);
  if (!parts) return 'now';
  return parts.map((p) => `${String(p.value).padStart(p.pad, '0')}${p.unit}`).join(' ');
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
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase"
                    letterSpacing={0.5}>
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

// Countdown headline — plain h5 bold digits (matches StatCard's number style)
// with unit letters as smaller muted inline spans so the eye groups digits
// without losing the supporting glyph. No boxes, no accent color on the
// numerals — the card identity comes from the warning-colored Chip below.
function CountdownDisplay({ ms }) {
  const parts = countdownParts(ms);
  if (!parts) {
    return (
      <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.1 }}>
        now
      </Typography>
    );
  }
  return (
    <Typography
      component="div"
      variant="h5"
      fontWeight={700}
      sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}
    >
      {parts.map((p, i) => (
        <Box key={p.unit} component="span" sx={{ ml: i === 0 ? 0 : 1 }}>
          {String(p.value).padStart(p.pad, '0')}
          <Box
            component="span"
            sx={{
              fontSize: '0.55em',
              fontWeight: 500,
              color: 'text.secondary',
              ml: 0.25,
              letterSpacing: '0.5px'
            }}
          >
            {p.unit}
          </Box>
        </Box>
      ))}
    </Typography>
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
  const formatDate = useFormatDate();
  // 1-second tick keeps the reset countdown ticking visibly.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!guilds || guilds.length === 0) return null;

  const climber = biggestClimber(guilds);
  const closest = closestGap(guilds);
  const msToReset = msUntilWeeklyReset(now);

  const navigate = (guildId) => {
    router.push(`/guilds/detail?id=${encodeURIComponent(guildId)}`);
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mb: 3 }}>
      {/* Card 1 — Weekly reset countdown */}
      <CurationCard
        icon={<ScheduleIcon fontSize="small" sx={{ color: 'warning.main' }}/>}
        label="Week ends in"
      >
        <CountdownDisplay ms={msToReset}/>
        <Chip
          label={`Resets ${formatDate(now + msToReset, { showSeconds: false })}`}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </CurationCard>

      {/* Card 2 — Biggest climber */}
      {climber && (
        <CurationCard
          icon={<TrendingUpIcon fontSize="small" color="success"/>}
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

      {/* Card 3 — Closest gap in top 25 */}
      {closest && (
        <CurationCard
          icon={<SportsScoreIcon fontSize="small" sx={{ color: 'info.main' }}/>}
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
