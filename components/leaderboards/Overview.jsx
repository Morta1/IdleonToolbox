import React from 'react';
import { Link, Skeleton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import useHydrated from '@hooks/useHydrated';
import useFormatDate from '@hooks/useFormatDate';
import GameIcon from '@components/common/GameIcon';
import Notice, { retryAction } from '@components/common/Notice';
import Panel from '@components/common/cards/Panel';
import { fetchBoard } from '../../services/leaderboards';
import { AGGREGATION_INTERVAL, GLOBAL_METRIC, TABS, formatExactValue, formatMetricValue, metaOf, profileUrl, rankText, showsFailure, staleUntilNextRun } from './format';
import { topPercentLabel, withinReach } from './standing';
import { nextRankText } from './tiers';
import CategoryTiles from './CategoryTiles';
import { boardHref, openOnPlainClick } from './MetricCard';
import MetricIcon from './MetricIcon';
import RankRow, { ExactValue, HIGHLIGHT, MEDAL, TROPHIES } from './RankRow';
import YouCard from './YouCard';

// Slots by position, left to right: second, first, third. The medal follows the row's rank, not its slot.
const PODIUM_SLOTS = [1, 0, 2];

const PodiumSlot = ({ row, kind }) => {
  const first = row.rank === 1;
  const medal = MEDAL[row.rank];
  const trophy = TROPHIES[row.rank];
  return (
    <Stack data-testid="podium-slot" gap={0.75} alignItems={{ xs: 'center', md: 'flex-start' }} sx={{
      flex: 1, minWidth: 0, boxSizing: 'border-box', px: { xs: 1, sm: 1.75 }, py: first ? { xs: 2, sm: 2.75 } : { xs: 1.25, sm: 1.75 },
      bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: kind ? HIGHLIGHT[kind] : 'divider',
      ...(medal ? { borderTop: '3px solid', borderTopColor: medal } : {}), textAlign: { xs: 'center', md: 'left' }
    }}>
      {trophy
        ? <GameIcon src={trophy} size={first ? 32 : 24} alt={`Rank ${row.rank}`}/>
        : <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{rankText(row.rank)}</Typography>}
      {/* A long name wraps: there is no hover to read a cut one from. */}
      <Link href={profileUrl(row.mainChar)} target="_blank" color="inherit"
            sx={{ maxWidth: '100%', overflowWrap: 'anywhere', typography: { xs: first ? 'body2' : 'caption', sm: first ? 'cardTitle' : 'body2' }, fontWeight: { xs: 500, sm: 500 } }}>{row.mainChar}</Link>
      <Typography variant="caption" component="div" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
        <ExactValue text={formatMetricValue('points', row.value)} exact={formatExactValue('points', row.value)}/>
      </Typography>
    </Stack>
  );
};

const Podium = ({ rows, highlight, onOpen, linkPlayer, index }) => (
  <Panel title="Global ranking" aside={
    <Link href={boardHref(metaOf(index, GLOBAL_METRIC), linkPlayer)} onClick={openOnPlainClick((key) => onOpen(key, 'overview'), GLOBAL_METRIC)}
          data-board-link={GLOBAL_METRIC} variant="body2" sx={{ whiteSpace: 'nowrap' }}>Full top 100</Link>
  }>
    {rows.length ? <>
      <Stack direction="row" gap={1.5} alignItems="flex-end" sx={{ p: 2 }}>
        {PODIUM_SLOTS.map((at) => (rows[at] ? <PodiumSlot key={rows[at].mainChar} row={rows[at]} kind={highlight[rows[at].mainChar] ?? null}/> : null))}
      </Stack>
      {rows.length > 3 ? (
        // Its own container: the two-column list follows the panel's width, which the You column beside it takes 420px
        // from, not the viewport's (ranks 5, 7, 9 lost their points at 1280px).
        <Box sx={{ containerType: 'inline-size', px: 1, py: 0.5 }}>
          {/* minmax(0, ...) lets a row shrink to its track, so a long name wraps instead of the row running past the panel
              at 320px. Two columns read down, then across: 4 to 7, then 8 to 10. */}
          <Box sx={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', columnGap: 3, '& > *': { minWidth: 0 },
            '@container (min-width: 520px)': {
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: `repeat(${Math.ceil(rows.slice(3).length / 2)}, auto)`, gridAutoFlow: 'column'
            }
          }}>
            {rows.slice(3).map((row, at) => (
              // A phone shows ranks 4 to 7, but never hides the highlighted player.
              <Box key={row.mainChar} sx={at >= 4 && !highlight[row.mainChar] ? { display: { xs: 'none', sm: 'block' } } : undefined}>
                <RankRow rank={row.rank} name={row.mainChar} value={row.value} notation="points" kind={highlight[row.mainChar] ?? null} dimRank/>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </> : <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.25 }}>No ranking yet.</Typography>}
  </Panel>
);

const settingsLink = <Link component={NextLink} href="/settings">Settings</Link>;

// What the player's data allows: a standing to show, or null while the You slot shows a notice instead.
const standingOf = (player) => (player.context && !player.isError && player.data ? { data: player.data, kind: player.context.kind } : null);

// The slot beside the global ranking: the You card, or whatever stands in for it.
const YouSlot = ({ player, self, index, onClearPlayer, nextRun }) => {
  const hydrated = useHydrated();
  const formatDate = useFormatDate();
  if (!player.context) {
    // A signed-in account that is still loading has no name yet; the sign-in prompt would flash at them.
    if (self.pending) return <Skeleton variant="rounded" height={180}/>;
    // A guest: the way onto the boards starts at signing in, right here (Settings has nothing to show them).
    return <Notice tone={'signin'}>
      Your standing shows here once you sign in and upload with leaderboards on, or search for any player above.
    </Notice>;
  }
  if (player.isError) {
    return <Notice key={player.errorUpdateCount} tone={'error'} action={retryAction(() => player.refetch(), player.isFetching)}>
      {player.context.kind === 'searched' ? 'Could not load this player.' : 'Could not load your standing.'}
    </Notice>;
  }
  if (player.isLoading || player.data === undefined) {
    return <Skeleton variant="rounded" height={180}/>;
  }
  if (!player.data) {
    // A searched 404 is sent back to plain Boards by the page; until that lands it must not read
    // as the visitor's own standing.
    if (player.context.kind === 'searched') return <Skeleton variant="rounded" height={180}/>;
    if (self.participation === 'off') {
      return <Notice>You are not on the leaderboards: turn them on in {settingsLink} and upload again.</Notice>;
    }
    const recent = hydrated && self.lastUpload && Date.now() - self.lastUpload < AGGREGATION_INTERVAL;
    if (recent && nextRun) {
      return <Notice>Almost there: boards refresh every 30 min, next at {formatDate(nextRun, { timeOnly: true, showSeconds: false })}.</Notice>;
    }
    return <Notice>You are not on the leaderboards yet: upload your profile with leaderboards on in {settingsLink}.</Notice>;
  }
  return <YouCard data={player.data} kind={player.context.kind} index={index}
                  onClear={onClearPlayer} clearLabel={self.name ? 'Back to you' : 'Clear'}/>;
};

const tabOfCategory = (category) => TABS.find((tab) => tab.toLowerCase() === category) ?? null;

const Highlights = ({ picks, kind, index }) => (
  <Panel title={kind === 'logged' ? 'Your highlights' : 'Highlights'} meta={kind === 'logged' ? 'Your strongest boards' : 'Their strongest boards'}>
    {picks.map((pick) => {
      const meta = metaOf(index, pick.metric);
      // A missing tab (meta down) or value leaves no dangling separator.
      const tabName = tabOfCategory(meta.category);
      const valueText = formatMetricValue(meta.notation, pick.value, { scale: meta.top });
      const shown = valueText === '-' ? null : <ExactValue text={valueText} exact={formatExactValue(meta.notation, pick.value)}/>;
      return <Panel.Row key={pick.metric} icon={<MetricIcon metric={pick.metric} label={meta.label}/>} name={meta.label}
                        sub={tabName || shown ? <>{tabName}{tabName && shown ? ' · ' : ''}{shown}</> : null}
                        value={rankText(pick.rank)} valueSub={topPercentLabel(pick.topPercent)}/>;
    })}
  </Panel>
);

// A row's link stretches over the row, so the whole row opens the board and a middle click opens a tab; the value's exact
// form sits above it.
const STRETCHED_LINK_SX = { whiteSpace: 'nowrap', '&::after': { content: '""', position: 'absolute', inset: 0 } };
const REACH_ROW_SX = { position: 'relative', '&:hover': { bgcolor: 'action.hover' } };

const WithinReach = ({ reach, kind, index, onOpen, linkPlayer }) => (
  <Panel title="Within reach" meta="Smallest step to the next rank">
    {reach.map((entry) => {
      const meta = metaOf(index, entry.key);
      const valueText = formatMetricValue(meta.notation, entry.v, { scale: meta.top });
      return <Panel.Row key={entry.key} sx={REACH_ROW_SX} icon={<MetricIcon metric={entry.key} label={meta.label}/>} name={meta.label}
                        sub={<>
                          {rankText(entry.r)} · <ExactValue text={valueText} exact={formatExactValue(meta.notation, entry.v)}/>
                          <Box sx={{ color: 'primary.main' }}>{nextRankText(entry, meta)}</Box>
                        </>}
                        value={<Link href={boardHref(meta, linkPlayer)} onClick={openOnPlainClick((key) => onOpen(key, 'within_reach'), entry.key)}
                                     sx={STRETCHED_LINK_SX}>{kind === 'logged' ? 'Around you' : 'Around them'}</Link>}/>;
    })}
  </Panel>
);

const Overview = ({ index, showAnonymous, player, self, highlight, onOpen, onTab, onClearPlayer, linkPlayer = null }) => {
  const podium = useQuery({
    queryKey: ['lb-podium', !showAnonymous],
    queryFn: () => fetchBoard(GLOBAL_METRIC, { limit: 10, publicOnly: !showAnonymous }),
    staleTime: staleUntilNextRun
  });
  const nextRun = index.createdAt ? index.createdAt + AGGREGATION_INTERVAL : null;
  const standing = standingOf(player);
  const picks = standing?.data.player.bestMetrics ?? [];
  const reach = standing ? withinReach(standing.data.ranks, index) : [];
  // An anonymous player in the top 10 is missing from the public list; they still go in their place.
  const viewed = standing?.data.player;
  const podiumRows = podium.data?.top ?? [];
  const rows = viewed && viewed.rank <= 10 && !podiumRows.some((row) => row.mainChar === viewed.mainChar)
    ? [...podiumRows, { mainChar: viewed.mainChar, rank: viewed.rank, value: viewed.compositeScore }].sort((a, b) => a.rank - b.rank)
    : podiumRows;
  return (
    // Columns follow the width this page actually gets, which the side rails shrink well below the
    // viewport's: a viewport breakpoint squeezed the podium to 160px on a 1024px screen.
    <Stack gap={2.5} sx={{ containerType: 'inline-size' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, alignItems: 'start', '@container (min-width: 860px)': { gridTemplateColumns: 'minmax(0, 1fr) 420px' } }}>
        {/* The player's own standing comes first in the markup, so narrow screens show it first and
            read it first; side by side it moves to the right column. */}
        <Box sx={{ '@container (min-width: 860px)': { order: 1 } }}>
          <YouSlot player={player} self={self} index={index} onClearPlayer={onClearPlayer} nextRun={nextRun}/>
        </Box>
        {showsFailure(podium)
          ? <Notice key={podium.errorUpdateCount} tone={'error'} action={retryAction(() => podium.refetch(), podium.isFetching)}>
            Could not load the global ranking.
          </Notice>
          : podium.data
            ? <Podium rows={rows} highlight={highlight} onOpen={onOpen} linkPlayer={linkPlayer} index={index}/>
            : <Skeleton variant="rounded" height={420}/>}
      </Box>
      {picks.length || reach.length ? (
        <Box sx={{
          display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, alignItems: 'start',
          '@container (min-width: 760px)': { gridTemplateColumns: picks.length && reach.length ? '1fr 1fr' : '1fr' }
        }}>
          {picks.length ? <Highlights picks={picks} kind={standing.kind} index={index}/> : null}
          {reach.length ? <WithinReach reach={reach} kind={standing.kind} index={index} onOpen={onOpen} linkPlayer={linkPlayer}/> : null}
        </Box>
      ) : null}
      <CategoryTiles index={index} ranks={standing?.data.ranks} onTab={onTab} linkPlayer={linkPlayer}/>
    </Stack>
  );
};

export default Overview;
