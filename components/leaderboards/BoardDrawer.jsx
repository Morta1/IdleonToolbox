import React from 'react';
import { Alert, Button, CircularProgress, Drawer, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { numberWithCommas } from '@utility/helpers';
import { fetchBoard } from '../../services/leaderboards';
import { GLOBAL_METRIC, formatMetricValue, metaOf, staleUntilNextRun } from './format';
import MetricIcon from './MetricIcon';
import RankRow from './RankRow';

// At rank 15 or better the window would repeat the top of the Top 100 list.
const AROUND_SKIP_RANK = 15;

const BoardDrawer = ({ metricKey, index, player, kind, showAnonymous, onClose }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const open = Boolean(metricKey);
  const meta = metaOf(index, metricKey ?? GLOBAL_METRIC);
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['lb-board', metricKey, player?.toLowerCase() ?? '', !showAnonymous],
    queryFn: () => fetchBoard(metricKey, { around: player ?? undefined, publicOnly: !showAnonymous }),
    enabled: open,
    staleTime: staleUntilNextRun
  });
  const isMe = (name) => Boolean(player) && name.toLowerCase() === player.toLowerCase();
  const around = (data?.around ?? []).filter((row) => showAnonymous || isMe(row.mainChar) || !row.mainChar.startsWith('Anon#'));
  const myRank = around.find((row) => isMe(row.mainChar))?.rank ?? null;
  const showAround = myRank != null && myRank > AROUND_SKIP_RANK;
  const maxed = Boolean(meta.maxed);
  const rowProps = (row) => ({
    rank: row.rank, name: row.mainChar, value: row.value, notation: meta.notation,
    kind: isMe(row.mainChar) ? kind : null, plainRank: maxed, globalRank: maxed ? row.globalRank : null
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: isPhone ? '100%' : 440 } } }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <MetricIcon metric={meta.key} label={meta.label} size={28}/>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="h6" component="h2" noWrap>{meta.label}</Typography>
          {meta.top != null ? (
            <Typography variant="caption" color="text.secondary">
              {maxed
                ? `${formatMetricValue(meta.notation, meta.top)} is the max · ${numberWithCommas(meta.topTies)} players have it`
                : `#1 ${formatMetricValue(meta.notation, meta.top)} · ${numberWithCommas(meta.players)} players on this board`}
            </Typography>
          ) : null}
        </Box>
        <IconButton aria-label="Close" onClick={onClose}><IconX size={20}/></IconButton>
      </Stack>
      <Box sx={{ overflowY: 'auto', pb: 2 }}>
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
                <Typography variant="overline" color="text.secondary" component="h3" sx={{ px: 2, pt: 2, display: 'block' }}>Around you</Typography>
                {around.map((row) => <RankRow key={row.mainChar} {...rowProps(row)}/>)}
              </>
            ) : null}
            <Typography variant="overline" color="text.secondary" component="h3" sx={{ px: 2, pt: 2, display: 'block' }}>Top 100</Typography>
            {(data?.top ?? []).map((row) => <RankRow key={row.mainChar} {...rowProps(row)}/>)}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default BoardDrawer;
