// pages/guilds/detail.jsx — uses ?id= query param (vs. dynamic route) so it
// builds with Next.js output: 'export'.
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { useGuildDetail } from '@hooks/useGuildHistory';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NextSeo } from 'next-seo';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { formatNum, numberWithCommas } from '@utility/helpers';
import { getGuildLevel } from '../../parsers/guild';
import WeeklyProgressChart from '@components/guilds/WeeklyProgressChart';
import TrendChart from '@components/guilds/TrendChart';
import RankHistoryChart from '@components/guilds/RankHistoryChart';
import ContributorLeaderboard from '@components/guilds/ContributorLeaderboard';
import RosterDiff from '@components/guilds/RosterDiff';
import SimpleLoader from '@components/common/SimpleLoader';
import { useReportPageLoading } from '@components/common/context/PageLoadingProvider';
import { navBarHeight } from '@components/constants';

const DAY_MS = 24 * 3600 * 1000;
const WEEK_MS = 7 * DAY_MS;

function MetricTile({ label, value, sublabel }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="groupLabel" component="div" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="heroValue" component="div" sx={{ mt: 0.25 }}>
        {value}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
          {sublabel}
        </Typography>
      )}
    </Box>
  );
}

// Same-hour-of-week comparison: find last week's progress at the matching point.
// Returns null if either side is missing or last week's value is 0.
function computeVsLastWeekPct(currentTs, lastTs, gpThisWeek) {
  if (!currentTs?.length || !lastTs?.length || gpThisWeek == null) return null;
  const latest = currentTs[currentTs.length - 1];
  if (!latest?.captured_at) return null;
  const targetMs = latest.captured_at - WEEK_MS;
  // Find the latest last-week point at-or-before the target.
  let match = null;
  for (const p of lastTs) {
    if (p.captured_at <= targetMs && p.total_gp != null) match = p;
    else if (p.captured_at > targetMs) break;
  }
  if (!match || match.total_gp <= 0) return null;
  return (gpThisWeek - match.total_gp) / match.total_gp;
}

export default function GuildDetail() {
  const router = useRouter();
  const formatDate = useFormatDate();
  const { id } = router.query;
  const { data, isLoading, error } = useGuildDetail(id);
  useReportPageLoading(isLoading || !id);

  // /guilds/detail?id=...#contributors (the Discord bot links here). The page renders a loader
  // first, so the browser's own hash scroll finds nothing: scroll once the guild is in.
  const scrolledToHash = useRef(false);
  useEffect(() => {
    if (!data || scrolledToHash.current || window.location.hash !== '#contributors') return;
    scrolledToHash.current = true;
    document.getElementById('contributors')?.scrollIntoView({ block: 'start' });
  }, [data]);

  if (isLoading || !id) return <SimpleLoader message="Loading guild history..."/>;
  if (error) return <Typography color={'text.error'}>Failed to load guild history</Typography>;
  if (!data) return null;

  const { guild_name, rank, total_gp, members_count, total_gp_history, current_week, last_week, roster_diff } = data;
  const guildLevel = getGuildLevel(total_gp);
  const maxMembers = 30 + 4 * guildLevel;
  const gpThisWeek = current_week?.gp_this_week ?? 0;

  const latestTick = current_week?.timeseries?.[current_week.timeseries.length - 1];
  const lastUpdatedMs = latestTick?.captured_at ?? null;

  const vsLastWkPct = computeVsLastWeekPct(
    current_week?.timeseries,
    last_week?.timeseries,
    gpThisWeek
  );

  return <Box sx={{ maxWidth: 980 }}>
    <NextSeo
      title={`${guild_name} | Guild History | Idleon Toolbox`}
      description={`Weekly GP progress and contributors for guild ${guild_name}`}
    />

    <Button
      size="small"
      startIcon={<ArrowBackIcon/>}
      component={NextLink}
      href={'/guilds'}
      sx={{ mb: 2, alignSelf: 'flex-start' }}
    >
      Back to guilds
    </Button>

    <Typography variant={'sectionTitle'} component={'h2'}>{guild_name}</Typography>
    {lastUpdatedMs && isValid(new Date(lastUpdatedMs)) && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Updated {formatDate(lastUpdatedMs)}
      </Typography>
    )}

    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 4 }}
        sx={{ flexWrap: 'wrap' }}
      >
        <MetricTile label="Rank" value={`#${rank}`} />
        <MetricTile label="Total GP" value={numberWithCommas(total_gp)} />
        <MetricTile label="Level" value={guildLevel} />
        <MetricTile label="Members" value={`${members_count} / ${maxMembers}`} />
      </Stack>
    </Paper>

    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack
        direction="row"
        alignItems="baseline"
        gap={1.5}
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        <Typography variant={'cardTitle'} component={'h3'}>This week's progress</Typography>
        <Typography variant="heroValue" component="div">
          {numberWithCommas(gpThisWeek)} GP
        </Typography>
        {vsLastWkPct != null && (
          <Typography
            variant="body2"
            fontWeight={Math.abs(vsLastWkPct) >= 0.2 ? 600 : 400}
            sx={{ color: vsLastWkPct >= 0 ? 'text.success' : 'text.error' }}
          >
            {formatNum(vsLastWkPct * 100, 'pct', { signed: true })} vs last week
          </Typography>
        )}
      </Stack>
      <WeeklyProgressChart detail={data} />
    </Paper>

    {total_gp_history?.length >= 2 && (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant={'cardTitle'} component={'h3'} sx={{ mb: 1 }}>GP gained per day (last 30 days)</Typography>
        <TrendChart values={total_gp_history} lastUpdatedMs={lastUpdatedMs} />
      </Paper>
    )}

    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant={'cardTitle'} component={'h3'} sx={{ mb: 1 }}>Rank history (last 30 days)</Typography>
      <RankHistoryChart rankHistory={data.rank_history} />
    </Paper>

    <Paper id="contributors" sx={{ p: 2, mb: 3, scrollMarginTop: `${navBarHeight + 16}px` }}>
      <Typography variant={'cardTitle'} component={'h3'} sx={{ mb: 2 }}>Top contributors this week</Typography>
      <ContributorLeaderboard members={current_week?.members} />
    </Paper>

    <Paper sx={{ p: 2 }}>
      <Typography variant={'cardTitle'} component={'h3'} sx={{ mb: 2 }}>Roster changes this week</Typography>
      <RosterDiff joined={roster_diff?.joined} left={roster_diff?.left} />
    </Paper>
  </Box>;
}
