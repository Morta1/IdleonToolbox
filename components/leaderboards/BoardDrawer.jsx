import React, { useId } from 'react';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useQuery } from '@tanstack/react-query';
import AppDrawer from '@components/common/Overlays/AppDrawer';
import Notice from '@components/common/Notice';
import { numberWithCommas } from '@utility/helpers';
import { fetchBoard } from '../../services/leaderboards';
import { GLOBAL_METRIC, formatDistinctValues, formatMetricValue, formatStep, metaOf, rankText, showsFailure, staleUntilNextRun } from './format';
import { focusWithinRing } from '../../styles/theme/darkTheme';
import MetricIcon from './MetricIcon';
import RankRow from './RankRow';

// At rank 15 or better the window would repeat the top of the Top 100 list.
const AROUND_SKIP_RANK = 15;

const SectionHeading = ({ children, note, action, id, sx }) => (
  <Stack direction="row" alignItems="baseline" columnGap={1} flexWrap="wrap" sx={{ px: 2.5, pb: 0.75, ...sx }}>
    {/* The Top 100 link focuses this heading; when it is already on screen the ring is the only
        sign the link did anything. */}
    <Typography component="h3" id={id} tabIndex={id ? -1 : undefined} color="text.secondary" sx={{
      fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 1, '&:focus': { outline: '2px solid var(--mui-palette-primary-main)', outlineOffset: '2px' }
    }}>{children}</Typography>
    {note ? <Typography color="text.muted" sx={{ fontSize: 12 }}>{note}</Typography> : null}
    {action ? <Box sx={{ ml: 'auto' }}>{action}</Box> : null}
  </Stack>
);

// A drawer opened from the board jump or a deep link has nothing to hand focus back to, so it goes
// to the board's own Top 100 link, scrolled into view.
// force: the drawer was opened from somewhere that is gone or meaningless to return to (the phone
// menu's More button, the board jump), so focus goes to the board even when MUI restored it elsewhere.
const focusBoardLink = (metricKey, force) => {
  if (!force && document.activeElement && document.activeElement !== document.body) return;
  const link = document.querySelector(`[data-board-link="${metricKey}"]`);
  if (!link) return;
  link.scrollIntoView?.({ block: 'center' });
  link.focus({ preventScroll: true });
};

// rankEntry: the player's entry for this board from /player ({ r, v, t, nr, nv }), the fallback
// for the step when everyone in the around window shares the player's rank.
const BoardDrawer = ({ open, metricKey, index, player, kind, rankEntry = null, showAnonymous, focusBoardOnClose = false, onClose }) => {
  const titleId = useId();
  const meta = metaOf(index, metricKey ?? GLOBAL_METRIC);
  const boardQuery = useQuery({
    queryKey: ['lb-board', metricKey, player?.toLowerCase() ?? '', !showAnonymous],
    queryFn: () => fetchBoard(metricKey, { around: player ?? undefined, publicOnly: !showAnonymous }),
    enabled: open,
    // A deep link asks again once the player's name arrives: keep that board's first answer on
    // screen meanwhile, but never another board's rows under this title.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === metricKey ? previous : undefined),
    staleTime: staleUntilNextRun
  });
  const { data, isLoading, refetch, errorUpdateCount } = boardQuery;
  const isMe = (name) => Boolean(player) && name.toLowerCase() === player.toLowerCase();
  const around = (data?.around ?? []).filter((row) => showAnonymous || isMe(row.mainChar) || !row.mainChar.startsWith('Anon#'));
  const mine = around.find((row) => isMe(row.mainChar)) ?? null;
  const myRank = mine?.rank ?? null;
  const showAround = myRank != null && myRank > AROUND_SKIP_RANK;
  // The nearest rank above yours: the smallest step that moves you up.
  const above = showAround
    ? around.reduce((best, row) => (row.rank < myRank && (!best || row.rank > best.rank) ? row : best), null)
    : null;
  const nextStep = above
    ? `+${formatStep(meta.notation, above.value - mine.value, { scale: meta.top })} to reach ${above.mainChar} (${rankText(above.rank)})`
    : showAround && rankEntry?.nv != null
      ? `+${formatStep(meta.notation, rankEntry.nv - rankEntry.v, { scale: meta.top })} to reach ${rankText(rankEntry.nr)}`
      : null;
  const ties = showAround && rankEntry?.t > 1 ? `${numberWithCommas(rankEntry.t)} tied at ${rankText(myRank)}` : null;
  const step = [nextStep, ties].filter(Boolean).join(' · ') || null;
  const maxed = Boolean(meta.maxed);
  // With anonymous players hidden, an anonymous player in context is missing from the public top
  // 100; they still go in their place.
  const top = data?.top ?? [];
  const topRows = mine && top.length && mine.rank < top[top.length - 1].rank && !top.some((row) => isMe(row.mainChar))
    ? [...top, mine].sort((a, b) => a.rank - b.rank)
    : top;
  // The header names the same #1 as the list under it.
  const first = topRows[0] ?? null;
  const players = (metricKey ?? GLOBAL_METRIC) === GLOBAL_METRIC ? index.totalPlayers : meta.players;
  const aroundTexts = formatDistinctValues(meta.notation, around.map((row) => row.value), { scale: meta.top });
  // The drawer is the close look, and a phone has no hover for the exact figure: its list gets the
  // same treatment, so ranks 16 to 20 never all read 104M.
  const topTexts = formatDistinctValues(meta.notation, topRows.map((row) => row.value), { scale: meta.top });
  const topHeadingId = `${titleId}-top`;
  const rowProps = (row, variant) => ({
    rank: row.rank, name: row.mainChar, value: row.value, notation: meta.notation, scale: meta.top, variant,
    kind: isMe(row.mainChar) ? kind : null, plainRank: maxed, globalRank: maxed ? row.globalRank : null
  });

  // The header's caption line: the max when the board is maxed, else the leader and the player count.
  const summary = maxed && meta.top != null
    ? `${formatMetricValue(meta.notation, meta.top)} is the max · ${numberWithCommas(meta.topTies)} players have it`
    : first || players != null ? (
      <Stack direction="row" gap={2}>
        {first ? <span>{`${rankText(first.rank)} ${first.mainChar} · ${topTexts[0] ?? formatMetricValue(meta.notation, first.value, { scale: meta.top })}`}</span> : null}
        {players != null ? <span>{`${numberWithCommas(players)} players`}</span> : null}
      </Stack>
    ) : null;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={meta.label}
      icon={<MetricIcon metric={meta.key} label={meta.label} size={26} maxed={maxed}/>}
      subtitle={summary}
      // MUI hands focus back after onExited, so the check waits for that to land first.
      onExited={() => setTimeout(() => focusBoardLink(metricKey, focusBoardOnClose), 50)}>
      <Box sx={[{ pb: 2 }, focusWithinRing]}>
        {showsFailure(boardQuery) ? (
          <Notice key={errorUpdateCount} tone={'error'} sx={{ m: 2 }} action={{ label: 'Retry', onClick: () => refetch() }}>Could not load this board.</Notice>
        ) : isLoading ? (
          <Stack alignItems="center" sx={{ p: 4 }}><CircularProgress/></Stack>
        ) : (
          <>
            {showAround ? (
              <>
                <SectionHeading note={step} sx={{ pt: 1.75 }} action={
                  // The Around block comes first, so the Top 100 the link promised is one tap away.
                  // Focus follows the scroll, so the next Tab continues in the list rather than above it.
                  <Button size="small" onClick={() => {
                    const heading = document.getElementById(topHeadingId);
                    heading?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    heading?.focus({ preventScroll: true });
                  }}
                          sx={{ p: 0, minWidth: 0, fontWeight: 600 }}>
                    Top 100<Box component="span" aria-hidden sx={{ ml: 0.5 }}>↓</Box>
                  </Button>
                }>
                  {kind === 'logged' ? 'Around you' : <>Around <Box component="span" sx={{ textTransform: 'none' }}>{mine.mainChar}</Box></>}
                </SectionHeading>
                <Box sx={{ px: 1.5 }}>
                  {around.map((row, at) => <RankRow key={row.mainChar} {...rowProps(row, 'around')} display={aroundTexts[at]}/>)}
                </Box>
              </>
            ) : null}
            <SectionHeading id={topHeadingId} sx={showAround ? { mt: 1.75, pt: 2.25, borderTop: 1, borderColor: 'divider', scrollMarginTop: 8 } : { pt: 1.75 }}>Top 100</SectionHeading>
            <Box sx={{ px: 1.5 }}>
              {topRows.map((row, at) => <RankRow key={row.mainChar} {...rowProps(row, 'list')} display={topTexts[at]}/>)}
            </Box>
          </>
        )}
      </Box>
    </AppDrawer>
  );
};

export default BoardDrawer;
