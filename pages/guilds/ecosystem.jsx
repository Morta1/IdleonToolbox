// pages/guilds/ecosystem.jsx: ecosystem-wide guild statistics.
// Static sub-page (no query param); not registered in constants.jsx.
import NextLink from 'next/link';
import { useGlobalSnapshots } from '@hooks/useGuildHistory';
import { Box, Button, Typography } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { NextSeo } from 'next-seo';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import StatCard from '@components/guilds/StatCard';
import { showsFailure } from '@components/leaderboards/format';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import Notice, { retryAction } from '@components/common/Notice';
import SimpleLoader from '@components/common/SimpleLoader';
import { formatNum } from '@utility/helpers';

const EcosystemSection = ({ title, children }) => <Panel title={title} sx={{ mb: 3 }}>
  <CardGrid size={'s'} sx={{ p: 2 }}>{children}</CardGrid>
</Panel>;

const BackToGuilds = () => <Button size={'small'} startIcon={<IconArrowLeft size={18}/>} component={NextLink} href={'/guilds'} prefetch={false} sx={{ mb: 2 }}>
  Back to guilds
</Button>;

export default function GuildEcosystem() {
  const formatDate = useFormatDate();
  // ~6 months of weekly snapshots (newest-first from API)
  const query = useGlobalSnapshots(26);
  const { data, isLoading } = query;
  // Above every branch, so the page keeps its title and description on the error and empty notes.
  const seo = <NextSeo
    title="Guild Ecosystem | Idleon Toolbox"
    description="Ecosystem-wide guild statistics: total guilds, active guilds, member health, and guild point output across all of Legends of Idleon."
  />;

  if (showsFailure(query)) {
    return <>
      {seo}
      <BackToGuilds/>
      <Notice key={query.errorUpdateCount} tone={'error'} action={retryAction(() => query.refetch(), query.isFetching)}>Couldn't load the ecosystem numbers.</Notice>
    </>;
  }
  if (isLoading) return <>{seo}<SimpleLoader message="Loading ecosystem data..."/></>;

  // A reply that isn't a list reads as an empty one.
  const snapshots = Array.isArray(data?.snapshots) ? data.snapshots : [];
  if (snapshots.length === 0) {
    return <>
      {seo}
      <BackToGuilds/>
      <Notice tone={'info'}>No ecosystem numbers yet. They arrive with the first weekly snapshot.</Notice>
    </>;
  }

  const latest = snapshots[0];
  const latestDelta = latest.delta ?? {};

  // API returns newest-first; reverse for chronological sparkline history.
  const chronological = snapshots.slice().reverse();

  const field = (key) => ({
    value: latest[key] ?? null,
    delta: latestDelta[key] ?? null,
    history: chronological.map((s) => s[key] ?? null)
  });

  const newGuilds = latest.new_guilds ?? null;
  const disbandedGuilds = latest.disbanded_guilds ?? null;
  const churnCaption =
    newGuilds != null && disbandedGuilds != null
      ? `+${formatNum(newGuilds, 'whole')} new, ${formatNum(disbandedGuilds, 'whole')} disbanded this week`
      : null;

  const totalGuilds = field('total_guilds');
  // Ecosystem-wide total GP is only accurate for the tracked top 1000, so the
  // absolute sum is misleading: show the weekly change, and how it compares
  // to the previous week's change.
  const thisWeekGp = latestDelta.total_points ?? null;
  const lastWeekGp = snapshots[1]?.delta?.total_points ?? null;
  const gpChange = {
    value: thisWeekGp,
    delta: thisWeekGp != null && lastWeekGp != null ? thisWeekGp - lastWeekGp : null,
    history: chronological.map((s) => s.delta?.total_points ?? null)
  };
  const activeGuilds = field('active_guilds');
  const abandonedGuilds = field('abandoned_guilds');
  const totalMembers = field('total_members');
  const activeMembers = field('active_members');
  const abandonedMembers = field('abandoned_members');

  return <Box>
    {seo}

    <BackToGuilds/>

    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      How the Idleon guilds changed from last week
      {latest.taken_at && isValid(new Date(latest.taken_at)) && (
        <>, as of {formatDate(latest.taken_at, { showSeconds: false })}</>
      )}
    </Typography>

    <EcosystemSection title="Scale and output">
      <StatCard label="Total guilds" {...totalGuilds} caption={churnCaption}/>
      <StatCard label="Weekly GP change" {...gpChange}/>
    </EcosystemSection>

    <EcosystemSection title="Guild health">
      <StatCard label="Active guilds" {...activeGuilds} hint="Guilds where the total GP increased in the last week."/>
      <StatCard label="Abandoned guilds" {...abandonedGuilds} hint="Guilds with no GP change for several weeks: likely inactive or empty."/>
    </EcosystemSection>

    <EcosystemSection title="Member health">
      <StatCard label="Total members" {...totalMembers}/>
      <StatCard label="Active members" {...activeMembers} hint="Members in active guilds: guilds that gained GP in the last week."/>
      <StatCard label="Abandoned members" {...abandonedMembers} hint="Members in abandoned guilds: guilds with no GP change for several weeks."/>
    </EcosystemSection>
  </Box>;
}
