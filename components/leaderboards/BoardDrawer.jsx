import React, { useId } from 'react';
import { Alert, Button, CircularProgress, Drawer, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { numberWithCommas } from '@utility/helpers';
import { fetchBoard } from '../../services/leaderboards';
import { GLOBAL_METRIC, formatMetricValue, formatStep, metaOf, rankText, staleUntilNextRun } from './format';
import MetricIcon from './MetricIcon';
import RankRow from './RankRow';

// At rank 15 or better the window would repeat the top of the Top 100 list.
const AROUND_SKIP_RANK = 15;

const SectionHeading = ({ children, note, sx }) => (
  <Stack direction="row" alignItems="baseline" gap={1} sx={{ px: 2.5, pb: 0.75, ...sx }}>
    <Typography component="h3" color="text.secondary" sx={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{children}</Typography>
    {note ? <Typography color="text.disabled" sx={{ fontSize: 12 }}>{note}</Typography> : null}
  </Stack>
);

// A drawer opened from the board jump or a deep link has nothing to hand focus back to, so it goes
// to the board's own Top 100 link, scrolled into view.
const focusBoardLink = (metricKey) => {
  if (document.activeElement && document.activeElement !== document.body) return;
  const link = document.querySelector(`[data-board-link="${metricKey}"]`);
  if (!link) return;
  link.scrollIntoView?.({ block: 'center' });
  link.focus({ preventScroll: true });
};

// rankEntry: the player's entry for this board from /player ({ r, v, t, nr, nv }), the fallback
// for the step when everyone in the around window shares the player's rank.
const BoardDrawer = ({ open, metricKey, index, player, kind, rankEntry = null, showAnonymous, onClose }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const titleId = useId();
  const meta = metaOf(index, metricKey ?? GLOBAL_METRIC);
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['lb-board', metricKey, player?.toLowerCase() ?? '', !showAnonymous],
    queryFn: () => fetchBoard(metricKey, { around: player ?? undefined, publicOnly: !showAnonymous }),
    enabled: open,
    // A deep link asks again once the player's name arrives: keep that board's first answer on
    // screen meanwhile, but never another board's rows under this title.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === metricKey ? previous : undefined),
    staleTime: staleUntilNextRun
  });
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
  const first = data?.top?.[0] ?? null;
  // With anonymous players hidden, an anonymous player in context is missing from the public top
  // 100; they still go in their place.
  const top = data?.top ?? [];
  const topRows = mine && top.length && mine.rank < top[top.length - 1].rank && !top.some((row) => isMe(row.mainChar))
    ? [...top, mine].sort((a, b) => a.rank - b.rank)
    : top;
  const players = (metricKey ?? GLOBAL_METRIC) === GLOBAL_METRIC ? index.totalPlayers : meta.players;
  const rowProps = (row, variant) => ({
    rank: row.rank, name: row.mainChar, value: row.value, notation: meta.notation, scale: meta.top, variant,
    kind: isMe(row.mainChar) ? kind : null, plainRank: maxed, globalRank: maxed ? row.globalRank : null
  });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      SlideProps={{ onExited: () => focusBoardLink(metricKey) }}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      PaperProps={{
        role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId,
        sx: { width: isPhone ? '100%' : 480, bgcolor: 'background.default', backgroundImage: 'none', borderLeft: '1px solid #2f3641' }
      }}>
      <Stack gap={1.25} sx={{ flexShrink: 0, px: 2.5, pt: 2.25, pb: 1.75, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <MetricIcon metric={meta.key} label={meta.label} size={26} maxed={maxed}/>
          <Typography id={titleId} component="h2" title={meta.label} noWrap sx={{ flexGrow: 1, minWidth: 0, fontSize: 18, fontWeight: 700 }}>{meta.label}</Typography>
          <IconButton aria-label="Close" onClick={onClose} sx={{ width: 36, height: 36, borderRadius: 2, color: 'text.secondary' }}>
            <IconX size={18} stroke={2.2}/>
          </IconButton>
        </Stack>
        {maxed && meta.top != null ? (
          <Typography color="text.secondary" sx={{ fontSize: 12 }}>
            {`${formatMetricValue(meta.notation, meta.top)} is the max · ${numberWithCommas(meta.topTies)} players have it`}
          </Typography>
        ) : first || players != null ? (
          <Stack direction="row" gap={2} sx={{ fontSize: 12, color: 'text.secondary' }}>
            {first ? <span>{`#1 ${first.mainChar} · ${formatMetricValue(meta.notation, first.value, { scale: meta.top })}`}</span> : null}
            {players != null ? <span>{`${numberWithCommas(players)} players`}</span> : null}
          </Stack>
        ) : null}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pb: 2 }}>
        {isError ? (
          <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
            Could not load this board
          </Alert>
        ) : isLoading ? (
          <Stack alignItems="center" sx={{ p: 4 }}><CircularProgress/></Stack>
        ) : (
          <>
            {showAround ? (
              <>
                <SectionHeading note={step} sx={{ pt: 1.75 }}>
                  {kind === 'logged' ? 'Around you' : <>Around <Box component="span" sx={{ textTransform: 'none' }}>{mine.mainChar}</Box></>}
                </SectionHeading>
                <Box sx={{ px: 1.5 }}>
                  {around.map((row) => <RankRow key={row.mainChar} {...rowProps(row, 'around')}/>)}
                </Box>
              </>
            ) : null}
            <SectionHeading sx={showAround ? { mt: 1.75, pt: 2.25, borderTop: 1, borderColor: 'divider' } : { pt: 1.75 }}>Top 100</SectionHeading>
            <Box sx={{ px: 1.5 }}>
              {topRows.map((row) => <RankRow key={row.mainChar} {...rowProps(row, 'list')}/>)}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default BoardDrawer;
