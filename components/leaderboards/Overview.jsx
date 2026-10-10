import React, { useState } from 'react';
import { Alert, Button, Card, Link, Skeleton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import useHydrated from '@hooks/useHydrated';
import useFormatDate from '@hooks/useFormatDate';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { prefix } from '@utility/helpers';
import { fetchBoard } from '../../services/leaderboards';
import { AGGREGATION_INTERVAL, GLOBAL_METRIC, TABS, formatExactValue, formatMetricValue, metaOf, profileUrl, rankText, staleUntilNextRun } from './format';
import { topPercentLabel, withinReach } from './standing';
import { nextRankText } from './tiers';
import CategoryTiles from './CategoryTiles';
import MetricIcon from './MetricIcon';
import RankRow, { HIGHLIGHT, MEDAL, TROPHIES } from './RankRow';
import YouCard from './YouCard';

const CARD_SX = { p: '18px 20px', borderRadius: 2 };
const linkButtonSx = { p: 0, minWidth: 0, fontSize: 13, fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0 };

// Slots by position, left to right: second, first, third. The medal follows the row's rank, not its slot.
const PODIUM_SLOTS = [1, 0, 2];

const PodiumSlot = ({ row, kind }) => {
  const first = row.rank === 1;
  const medal = MEDAL[row.rank];
  const trophy = TROPHIES[row.rank];
  const size = first ? { xs: 22, sm: 28 } : { xs: 18, sm: 22 };
  return (
    <Stack data-testid="podium-slot" gap={0.75} alignItems={{ xs: 'center', md: 'flex-start' }} sx={{
      flex: 1, minWidth: 0, boxSizing: 'border-box', px: { xs: 1, sm: 1.75 }, py: first ? { xs: 2, sm: 2.75 } : { xs: 1.25, sm: 1.75 },
      bgcolor: '#141A21', borderRadius: 2, border: '1px solid', borderColor: kind ? HIGHLIGHT[kind] : 'divider',
      ...(medal ? { borderTop: `3px solid ${medal}` } : {}), textAlign: { xs: 'center', md: 'left' }
    }}>
      {trophy
        ? <Box component="img" src={`${prefix}${trophy}`} alt={`Rank ${row.rank}`} sx={{ width: size, height: size, objectFit: 'contain' }}/>
        : <Typography color="text.secondary" fontWeight={600} sx={{ fontSize: 14 }}>{rankText(row.rank)}</Typography>}
      <Link href={profileUrl(row.mainChar)} target="_blank" underline="hover" color="inherit" noWrap title={row.mainChar}
            sx={{ maxWidth: '100%', fontSize: first ? { xs: 13, sm: 18 } : { xs: 12, sm: 15 }, fontWeight: first ? 700 : 600 }}>{row.mainChar}</Link>
      <Typography color="text.secondary" title={formatExactValue('points', row.value)} sx={{ fontSize: 12, display: { xs: 'none', sm: 'block' } }}>{formatMetricValue('points', row.value)}</Typography>
    </Stack>
  );
};

const Podium = ({ rows, highlight, onOpen }) => (
  // Its own container: the two-column list follows the card's width, which the You column beside
  // it takes 420px from, not the viewport's (ranks 5, 7, 9 lost their points at 1280px).
  <Card variant="outlined" sx={{ ...CARD_SX, display: 'flex', flexDirection: 'column', gap: 2, containerType: 'inline-size' }}>
    <Stack direction="row" alignItems="center">
      <Typography component="h2" sx={{ flexGrow: 1, fontSize: 16, fontWeight: 700 }}>Global ranking</Typography>
      <Button onClick={() => onOpen(GLOBAL_METRIC, 'overview')} sx={linkButtonSx} data-board-link={GLOBAL_METRIC}>Full top 100<Box component="span" aria-hidden sx={{ ml: 0.5 }}>›</Box></Button>
    </Stack>
    <Stack direction="row" gap={1.5} alignItems="flex-end">
      {PODIUM_SLOTS.map((at) => (rows[at] ? <PodiumSlot key={rows[at].mainChar} row={rows[at]} kind={highlight[rows[at].mainChar] ?? null}/> : null))}
    </Stack>
    {/* minmax(0, ...) lets a row shrink to its track, so a long name truncates instead of the row
        running past the card at 320px. Two columns read down, then across: 4 to 7, then 8 to 10.
        The rows stay at 13px on wide screens: every one carries "16,367.49 pts", and at 14px a
        14-letter name was cut at 1440px. */}
    <Box sx={{
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', columnGap: 3, '& > *': { minWidth: 0 }, '& [data-testid="rank-row"]': { fontSize: 13 },
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
  </Card>
);

const Notice = ({ title, children }) => (
  <Card variant="outlined" sx={{ ...CARD_SX, height: '100%', boxSizing: 'border-box' }}>
    <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{children}</Typography>
  </Card>
);

const settingsLink = <Link component={NextLink} href="/settings">Settings</Link>;

// Settings has nothing to show a guest, so the way in starts at logging in, right here.
const GuestNotice = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  return <Notice title="See where you stand">
    <Link component="button" onClick={() => setLoginOpen(true)} sx={{ font: 'inherit', verticalAlign: 'baseline' }}>Log in</Link>
    {' to get on the boards: upload your profile with leaderboards on from Settings, and you show up after the next refresh (every 30 min). Or find any player with the search above.'}
    <LoginDialog open={loginOpen} setOpen={setLoginOpen} onClose={() => setLoginOpen(false)}/>
  </Notice>;
};

// What the player's data allows: a standing to show, or null while the You slot shows a notice instead.
const standingOf = (player) => (player.context && !player.isError && player.data ? { data: player.data, kind: player.context.kind } : null);

// The slot beside the global ranking: the You card, or whatever stands in for it.
const YouSlot = ({ player, self, index, onSeeAll, onClearPlayer, nextRun }) => {
  const hydrated = useHydrated();
  const formatDate = useFormatDate();
  if (!player.context) {
    // A signed-in account that is still loading has no name yet; the sign-in prompt would flash at them.
    if (self.pending) return <Skeleton variant="rounded" height={180}/>;
    return <GuestNotice/>;
  }
  if (player.isError) {
    return <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => player.refetch()}>Retry</Button>}>
      {player.context.kind === 'searched' ? 'Could not load this player' : 'Could not load your standing'}
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
  return <YouCard data={player.data} kind={player.context.kind} index={index} onSeeAll={onSeeAll}
                  onClear={onClearPlayer} clearLabel={self.name ? 'Back to you' : 'Clear'}/>;
};

const SectionTitle = ({ title, sub }) => (
  <Stack direction="row" alignItems="baseline" gap={1} sx={{ mb: 1.25 }}>
    <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
    <Typography color="text.disabled" sx={{ fontSize: 12 }}>{sub}</Typography>
  </Stack>
);

const tabOfCategory = (category) => TABS.find((tab) => tab.toLowerCase() === category) ?? null;

const Highlights = ({ picks, kind, index }) => (
  <Card variant="outlined" sx={CARD_SX}>
    <SectionTitle title={kind === 'logged' ? 'Your highlights' : 'Highlights'} sub={kind === 'logged' ? 'your strongest boards' : 'their strongest boards'}/>
    {picks.map((pick) => {
      const meta = metaOf(index, pick.metric);
      // A missing tab (meta down) or value leaves no dangling separator.
      const tabName = tabOfCategory(meta.category);
      const valueText = Number.isFinite(pick.value) ? formatMetricValue(meta.notation, pick.value, { scale: meta.top }) : null;
      const top = topPercentLabel(pick.topPercent);
      return (
        <Stack key={pick.metric} direction="row" alignItems="center" gap={1.5} sx={{ py: 1.25, borderTop: 1, borderColor: 'divider' }}>
          <MetricIcon metric={pick.metric} label={meta.label} size={28}/>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 600 }}>{meta.label}</Typography>
            {tabName || valueText ? (
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                {tabName}{tabName && valueText ? ' · ' : ''}
                {valueText ? <span title={formatExactValue(meta.notation, pick.value)}>{valueText}</span> : null}
              </Typography>
            ) : null}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{rankText(pick.rank)}</Typography>
            {top ? <Typography color="text.disabled" sx={{ fontSize: 11 }}>{top}</Typography> : null}
          </Box>
        </Stack>
      );
    })}
  </Card>
);

const WithinReach = ({ reach, kind, index, onOpen }) => (
  <Card variant="outlined" sx={CARD_SX}>
    <SectionTitle title="Within reach" sub="smallest step to the next rank"/>
    {reach.map((entry) => {
      const meta = metaOf(index, entry.key);
      return (
        <Button key={entry.key} color="inherit" fullWidth onClick={() => onOpen(entry.key, 'within_reach')} sx={{
          justifyContent: 'flex-start', textTransform: 'none', gap: 1.5, py: 1.25, px: 0, borderRadius: 0, borderTop: 1, borderColor: 'divider'
        }}>
          <MetricIcon metric={entry.key} label={meta.label} size={28}/>
          <Box component="span" sx={{ flexGrow: 1, minWidth: 0, textAlign: 'left' }}>
            <Typography component="span" display="block" sx={{ fontWeight: 600 }}>
              {meta.label}
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                {` · ${rankText(entry.r)} · `}
                <span title={formatExactValue(meta.notation, entry.v)}>{formatMetricValue(meta.notation, entry.v, { scale: meta.top })}</span>
              </Box>
            </Typography>
            <Typography component="span" display="block" color="primary" sx={{ fontSize: 13 }}>{nextRankText(entry, meta)}</Typography>
          </Box>
          <Typography component="span" color="primary" sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{kind === 'logged' ? 'Around you' : 'Around them'}<Box component="span" aria-hidden sx={{ ml: 0.5 }}>›</Box></Typography>
        </Button>
      );
    })}
  </Card>
);

const Overview = ({ index, showAnonymous, player, self, highlight, onOpen, onSeeAll, onTab, onClearPlayer, linkPlayer = null }) => {
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
          <YouSlot player={player} self={self} index={index} onSeeAll={onSeeAll} onClearPlayer={onClearPlayer} nextRun={nextRun}/>
        </Box>
        {podium.isError
          ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => podium.refetch()}>Retry</Button>}>Could not load the global ranking</Alert>
          : podium.data
            ? <Podium rows={rows} highlight={highlight} onOpen={onOpen}/>
            : <Skeleton variant="rounded" height={420}/>}
      </Box>
      {picks.length || reach.length ? (
        <Box sx={{
          display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, alignItems: 'start',
          '@container (min-width: 760px)': { gridTemplateColumns: picks.length && reach.length ? '1fr 1fr' : '1fr' }
        }}>
          {picks.length ? <Highlights picks={picks} kind={standing.kind} index={index}/> : null}
          {reach.length ? <WithinReach reach={reach} kind={standing.kind} index={index} onOpen={onOpen}/> : null}
        </Box>
      ) : null}
      <CategoryTiles index={index} ranks={standing?.data.ranks} onTab={onTab} linkPlayer={linkPlayer}/>
    </Stack>
  );
};

export default Overview;
