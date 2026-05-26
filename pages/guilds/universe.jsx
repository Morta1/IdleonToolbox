// pages/guilds/universe.jsx — universe-wide guild-ecosystem statistics.
// Static sub-page (no query param); not registered in constants.jsx.
import { useRouter } from 'next/router';
import { useGlobalSnapshots } from '@hooks/useGuildHistory';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NextSeo } from 'next-seo';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import StatCard from '@components/guilds/StatCard';
import { MOCK_UNIVERSE_RESPONSE } from '@components/guilds/universeMockData';
import SimpleLoader from '@components/common/SimpleLoader';
import { numberWithCommas } from '@utility/helpers';

// A titled section with a responsive 2-up grid of StatCards.
function UniverseSection({ title, columns, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        fontWeight={700}
        sx={{
          display: 'block',
          letterSpacing: 1.2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 0.5,
          mb: 1.5
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, 1fr)` },
          gap: 2
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function GuildUniverse() {
  const router = useRouter();
  const formatDate = useFormatDate();
  // ?mock=true renders the page from fixed sample data — no live API needed.
  const isMock = router.query.mock != null;
  // ~6 months of weekly snapshots (newest-first from API)
  const { data: liveData, isLoading, error } = useGlobalSnapshots(26);
  const data = isMock ? MOCK_UNIVERSE_RESPONSE : liveData;

  if (!isMock && isLoading) return <SimpleLoader message="Loading universe data..." />;
  if (!isMock && error) return <Typography color="error">Failed to load universe data</Typography>;
  if (!data) return null;

  const snapshots = data.snapshots ?? [];
  if (snapshots.length === 0) {
    return <Typography color="text.secondary">No universe data available yet.</Typography>;
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
      ? `+${numberWithCommas(newGuilds)} new · −${numberWithCommas(disbandedGuilds)} disbanded this week`
      : null;

  const totalGuilds = field('total_guilds');
  // Universe-wide total GP is only accurate for the tracked top 1000, so the
  // absolute sum is misleading — show the weekly change, and how it compares
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

  return <Box sx={{ maxWidth: 980 }}>
    <NextSeo
      title="Guild Universe | Idleon Toolbox"
      description="Universe-wide guild ecosystem statistics: total guilds, active guilds, member health, and guild point output across all of Legends of Idleon."
    />

    <Button
      size="small"
      startIcon={<ArrowBackIcon />}
      onClick={() => router.push('/guilds')}
      sx={{ mb: 1, alignSelf: 'flex-start' }}
    >
      Back to guilds
    </Button>

    <Typography variant="h4">Guild Universe</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
      Week-over-week health of the IdleOn guild ecosystem.
      {latest.taken_at && isValid(new Date(latest.taken_at)) && (
        <> · As of {formatDate(latest.taken_at)}</>
      )}
    </Typography>

    <UniverseSection title="Scale & Output" columns={2}>
      <StatCard
        label="Total Guilds"
        value={totalGuilds.value}
        delta={totalGuilds.delta}
        history={totalGuilds.history}
        caption={churnCaption}
      />
      <StatCard
        label="Weekly GP Change"
        value={gpChange.value}
        delta={gpChange.delta}
        deltaBelow
        deltaLabel="vs last week"
        history={gpChange.history}
      />
    </UniverseSection>

    <UniverseSection title="Guild Health" columns={2}>
      <StatCard
        label="Active Guilds"
        value={activeGuilds.value}
        delta={activeGuilds.delta}
        history={activeGuilds.history}
        hint="Guilds where the total GP increased in the last week."
      />
      <StatCard
        label="Abandoned Guilds"
        value={abandonedGuilds.value}
        delta={abandonedGuilds.delta}
        history={abandonedGuilds.history}
        goodDirection="down"
        hint="Guilds with no GP change for several weeks — likely inactive or empty."
      />
    </UniverseSection>

    <UniverseSection title="Member Health" columns={3}>
      <StatCard
        label="Total Members"
        value={totalMembers.value}
        delta={totalMembers.delta}
        history={totalMembers.history}
      />
      <StatCard
        label="Active Members"
        value={activeMembers.value}
        delta={activeMembers.delta}
        history={activeMembers.history}
        hint="Members in active guilds — guilds that gained GP in the last week."
      />
      <StatCard
        label="Abandoned Members"
        value={abandonedMembers.value}
        delta={abandonedMembers.delta}
        history={abandonedMembers.history}
        goodDirection="down"
        hint="Members in abandoned guilds — guilds with no GP change for several weeks."
      />
    </UniverseSection>
  </Box>;
}
