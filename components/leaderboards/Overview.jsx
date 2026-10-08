import React from 'react';
import { Alert, Button, Card, Link, Skeleton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import useHydrated from '@hooks/useHydrated';
import useFormatDate from '@hooks/useFormatDate';
import { prefix } from '@utility/helpers';
import { fetchBoard } from '../../services/leaderboards';
import { AGGREGATION_INTERVAL, GLOBAL_METRIC, formatMetricValue, metaOf, staleUntilNextRun } from './format';
import { withinReach } from './standing';
import { nextRankText } from './tiers';
import MetricIcon from './MetricIcon';
import RankRow, { HIGHLIGHT, TROPHIES } from './RankRow';
import YouCard from './YouCard';

// Slots by position, left to right: second, first, third. The trophy follows the row's rank, not its slot.
const PODIUM = [
  { at: 1, height: 112 },
  { at: 0, height: 136 },
  { at: 2, height: 96 }
];

const Podium = ({ rows, highlight, onOpen }) => (
  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>Global ranking</Typography>
      <Button size="small" onClick={() => onOpen(GLOBAL_METRIC, 'overview')}>Full top 100 ›</Button>
    </Stack>
    <Stack direction="row" gap={1} alignItems="flex-end" justifyContent="center" sx={{ mb: 2 }}>
      {PODIUM.map(({ at, height }) => {
        const row = rows[at];
        if (!row) return null;
        const kind = highlight[row.mainChar] ?? null;
        return (
          <Stack key={row.mainChar} alignItems="center" justifyContent="flex-end" gap={0.5} sx={{
            flex: 1, minWidth: 0, height, p: 1, borderRadius: 2, bgcolor: '#141A21', border: 1, borderColor: kind ? HIGHLIGHT[kind] : 'divider'
          }}>
            {TROPHIES[row.rank]
              ? <img src={`${prefix}${TROPHIES[row.rank]}`} width={28} height={28} style={{ objectFit: 'contain' }} alt={`Rank ${row.rank}`}/>
              : <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ height: 28, lineHeight: '28px' }}>{`#${row.rank ?? '-'}`}</Typography>}
            <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: '100%' }}>{row.mainChar}</Typography>
            <Typography variant="caption" color="text.secondary">{formatMetricValue('points', row.value)}</Typography>
          </Stack>
        );
      })}
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
      {rows.slice(3).map((row) => (
        <RankRow key={row.mainChar} rank={row.rank} name={row.mainChar} value={row.value} notation="points" kind={highlight[row.mainChar] ?? null}/>
      ))}
    </Box>
  </Card>
);

const Notice = ({ title, children }) => (
  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="h6" component="h2">{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{children}</Typography>
  </Card>
);

const settingsLink = <Link component={NextLink} href="/settings">Settings</Link>;

const PlayerPanel = ({ player, self, index, onOpen, onSeeAll, nextRun }) => {
  const hydrated = useHydrated();
  const formatDate = useFormatDate();
  if (!player.context) {
    // A signed-in account that is still loading has no name yet; the sign-in prompt would flash at them.
    if (self.pending) return <Skeleton variant="rounded" height={180}/>;
    return <Notice title="See where you stand">
      Log in and upload your profile with leaderboards on in {settingsLink}, or find any player with the search above.
    </Notice>;
  }
  if (player.isError) {
    return <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => player.refetch()}>Retry</Button>}>
      Could not load your standing
    </Alert>;
  }
  if (player.isLoading || player.data === undefined) {
    return <Skeleton variant="rounded" height={180}/>;
  }
  if (!player.data) {
    // A searched 404 is sent back to plain Boards by the page; until that lands it must not read
    // as the visitor's own standing.
    if (player.context.kind === 'searched') return <Skeleton variant="rounded" height={180}/>;
    if (self.participation === 'off') {
      return <Notice title="You are not on the leaderboards">Turn leaderboards on in {settingsLink} and upload again.</Notice>;
    }
    const recent = hydrated && self.lastUpload && Date.now() - self.lastUpload < AGGREGATION_INTERVAL;
    if (recent && nextRun) {
      return <Notice title="Almost there">Boards refresh every 30 min, next at {formatDate(nextRun, { timeOnly: true, showSeconds: false })}.</Notice>;
    }
    return <Notice title="You are not on the leaderboards yet">Upload your profile with leaderboards on in {settingsLink}.</Notice>;
  }

  const { data, context } = player;
  const reach = withinReach(data.ranks, index);
  return (
    <Stack gap={2}>
      <YouCard data={data} kind={context.kind} index={index} onSeeAll={onSeeAll}/>
      {data.player.bestMetrics?.length ? (
        <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" component="h3" fontWeight={700}>{context.kind === 'logged' ? 'Your highlights' : 'Highlights'}</Typography>
          {data.player.bestMetrics.map((pick) => {
            const meta = metaOf(index, pick.metric);
            return (
              <Stack key={pick.metric} direction="row" alignItems="center" gap={1} sx={{ mt: 1 }}>
                <MetricIcon metric={pick.metric} label={meta.label}/>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>{meta.label}</Typography>
                <Typography variant="body2" color="text.secondary">{formatMetricValue(meta.notation, pick.value)}</Typography>
                <Typography variant="body2" fontWeight={600}>{`#${pick.rank} · top ${pick.topPercent}%`}</Typography>
              </Stack>
            );
          })}
        </Card>
      ) : null}
      {reach.length ? (
        <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" component="h3" fontWeight={700}>Within reach</Typography>
          {reach.map((entry) => {
            const meta = metaOf(index, entry.key);
            return (
              <Button key={entry.key} color="inherit" fullWidth onClick={() => onOpen(entry.key, 'within_reach')}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', gap: 1, mt: 0.5 }}>
                <MetricIcon metric={entry.key} label={meta.label}/>
                <Box component="span" sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" component="span" display="block">{`${meta.label} · #${entry.r}`}</Typography>
                  <Typography variant="caption" component="span" color="text.secondary" display="block">{nextRankText(entry, meta)}</Typography>
                </Box>
              </Button>
            );
          })}
        </Card>
      ) : null}
    </Stack>
  );
};

const Overview = ({ index, showAnonymous, player, self, highlight, onOpen, onSeeAll }) => {
  const podium = useQuery({
    queryKey: ['lb-board', GLOBAL_METRIC, 'top10', !showAnonymous],
    queryFn: () => fetchBoard(GLOBAL_METRIC, { limit: 10, publicOnly: !showAnonymous }),
    staleTime: staleUntilNextRun
  });
  const nextRun = index.createdAt ? index.createdAt + AGGREGATION_INTERVAL : null;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 2, alignItems: 'start' }}>
      {podium.isError
        ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => podium.refetch()}>Retry</Button>}>Could not load the global ranking</Alert>
        : podium.data
          ? <Podium rows={podium.data.top} highlight={highlight} onOpen={onOpen}/>
          : <Skeleton variant="rounded" height={420}/>}
      <PlayerPanel player={player} self={self} index={index} onOpen={onOpen} onSeeAll={onSeeAll} nextRun={nextRun}/>
    </Box>
  );
};

export default Overview;
