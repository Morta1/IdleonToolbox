// pages/guilds/detail.jsx: uses ?id= query param (vs. dynamic route) so it
// builds with Next.js output: 'export'.
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { useGuildDetail } from '@hooks/useGuildHistory';
import { Box, Button, Stack, Typography } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { NextSeo } from 'next-seo';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import useHydrated from '@hooks/useHydrated';
import { formatNum } from '@utility/helpers';
import { getGuildLevel } from '../../parsers/guild';
import WeeklyProgressChart from '@components/guilds/WeeklyProgressChart';
import TrendChart from '@components/guilds/TrendChart';
import RankHistoryChart from '@components/guilds/RankHistoryChart';
import { heldRank } from '@components/guilds/rankHistory';
import ContributorLeaderboard from '@components/guilds/ContributorLeaderboard';
import RosterDiff from '@components/guilds/RosterDiff';
import { rankText, showsFailure } from '@components/leaderboards/format';
import GameIcon from '@components/common/GameIcon';
import Notice, { retryAction } from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import SimpleLoader from '@components/common/SimpleLoader';
import { SCROLL_TARGET_MARGIN } from '@hooks/usePageTop';

const DAY_MS = 24 * 3600 * 1000;
const WEEK_MS = 7 * DAY_MS;
const PANEL_SX = { mb: 3 };
const BODY_SX = { p: 2 };

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

// Under 0.05% either way is the same pace, as the guild list's column reads it.
const paceWords = (change) => {
  if (Math.abs(change) < 0.0005) return 'The same pace as last week at this hour';
  return `${formatNum(Math.abs(change) * 100, 'pct', { decimals: 2 })} ${change > 0 ? 'ahead of' : 'behind'} last week at this hour`;
};

const BackToGuilds = () => <Button size={'small'} startIcon={<IconArrowLeft size={18}/>} component={NextLink} href={'/guilds'} sx={{ mb: 2 }}>
  Back to guilds
</Button>;

export default function GuildDetail() {
  const router = useRouter();
  const formatDate = useFormatDate();
  const hydrated = useHydrated();
  const { id } = router.query;
  const query = useGuildDetail(id);
  const { data, isLoading } = query;

  // /guilds/detail?id=...#contributors (the Discord bot links here). The page renders a loader
  // first, so the browser's own hash scroll finds nothing: scroll once the guild is in.
  const scrolledToHash = useRef(false);
  useEffect(() => {
    if (!data || scrolledToHash.current || window.location.hash !== '#contributors') return;
    scrolledToHash.current = true;
    document.getElementById('contributors')?.scrollIntoView({ block: 'start' });
  }, [data]);

  // router.query is empty until the router is ready, so a real link never reads as having no id. An address with no query
  // is ready on the client's first render and not at the export: both draw the loader until hydration.
  if (!hydrated || !router.isReady) return <SimpleLoader message="Loading guild history..."/>;
  if (id && showsFailure(query)) {
    return <>
      <BackToGuilds/>
      <Notice key={query.errorUpdateCount} tone={'error'} action={retryAction(() => query.refetch(), query.isFetching)}>Couldn't load this guild's history.</Notice>
    </>;
  }
  if (id && isLoading) return <SimpleLoader message="Loading guild history..."/>;
  if (!id || !data) {
    return <>
      <BackToGuilds/>
      <Notice tone={'info'}>Pick a guild from the guild list.</Notice>
    </>;
  }

  const { guild_name, guild_icon, rank, total_gp, members_count, total_gp_history, current_week, last_week, roster_diff } = data;
  const held = heldRank(data.rank_history);
  const steady = held != null && held.rank === rank;
  // The history covers 30 days, so a rank held across all of it may have held longer: say what the data knows.
  const heldLabel = (days) => (days >= 30 ? 'Held for 30+ days' : `Held for ${days} ${days === 1 ? 'day' : 'days'}`);
  const guildLevel = total_gp == null ? null : getGuildLevel(total_gp);
  const maxMembers = guildLevel == null ? null : 30 + 4 * guildLevel;
  const gpThisWeek = current_week?.gp_this_week ?? 0;

  const latestTick = current_week?.timeseries?.[current_week.timeseries.length - 1];
  const lastUpdatedMs = latestTick?.captured_at ?? null;

  const vsLastWkPct = computeVsLastWeekPct(
    current_week?.timeseries,
    last_week?.timeseries,
    gpThisWeek
  );

  return <Box>
    <NextSeo
      title={`${guild_name} | Guild History | Idleon Toolbox`}
      description={`Weekly GP progress and contributors for guild ${guild_name}`}
    />

    <BackToGuilds/>

    <Stack direction={'row'} alignItems={'center'} gap={1.5}>
      {guild_icon != null ? <GameIcon src={`data/G2icon${guild_icon}.png`} size={32} alt={''}/> : null}
      <Typography variant={'sectionTitle'} component={'h2'}>{guild_name ?? 'Unnamed guild'}</Typography>
    </Stack>
    {lastUpdatedMs && isValid(new Date(lastUpdatedMs)) && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Updated {formatDate(lastUpdatedMs, { showSeconds: false })}
      </Typography>
    )}

    <PageSummary label={'This guild'}>
      <StatTile label={'Rank'} value={rankText(rank)} sub={steady ? heldLabel(held.days) : undefined}/>
      <StatTile label={'Total GP'} value={formatNum(total_gp, 'amount')}/>
      <StatTile label={'Level'} value={formatNum(guildLevel, 'whole')}/>
      <StatTile label={'Members'} value={maxMembers == null ? formatNum(members_count, 'whole') : `${formatNum(members_count, 'whole')} / ${formatNum(maxMembers, 'whole')}`}/>
    </PageSummary>

    <Panel title={'This week\'s progress'} sx={PANEL_SX}
           meta={<>{formatNum(gpThisWeek, 'amount')} GP{vsLastWkPct != null ? ` · ${paceWords(vsLastWkPct)}` : ''}</>}>
      <Box sx={BODY_SX}><WeeklyProgressChart detail={data}/></Box>
    </Panel>

    {total_gp_history?.length >= 2 && (
      <Panel title={'GP gained per day (last 30 days)'} sx={PANEL_SX}>
        <Box sx={BODY_SX}><TrendChart values={total_gp_history} lastUpdatedMs={lastUpdatedMs}/></Box>
      </Panel>
    )}

    {steady ? null : <Panel title={'Rank history (last 30 days)'} sx={PANEL_SX}>
      <Box sx={BODY_SX}><RankHistoryChart rankHistory={data.rank_history}/></Box>
    </Panel>}

    <Box id="contributors" sx={{ mb: 3, scrollMarginTop: `${SCROLL_TARGET_MARGIN}px` }}>
      <Panel title={'Top contributors this week'}>
        <ContributorLeaderboard members={current_week?.members}/>
      </Panel>
    </Box>

    <Panel title={'Roster changes this week'}>
      <RosterDiff joined={roster_diff?.joined} left={roster_diff?.left}/>
    </Panel>
  </Box>;
}
