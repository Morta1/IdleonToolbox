import React from 'react';
import { Button, Card, Chip, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { numberWithCommas } from '@utility/helpers';
import { formatMetricValue } from './format';
import MetricIcon from './MetricIcon';
import RankRow from './RankRow';

const MetricCard = ({ meta, entries, highlight, pinned, onOpen }) => {
  const rows = entries ?? [];
  const maxed = Boolean(meta.maxed);
  const showPinned = Boolean(pinned?.entry) && !rows.some((row) => row.mainChar === pinned.mainChar);
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, alignSelf: 'start' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <MetricIcon metric={meta.key} label={meta.label}/>
        <Typography variant="subtitle2" component="h3" noWrap sx={{ minWidth: 0 }}>{meta.label}</Typography>
        {maxed ? <Chip size="small" label="Maxed" sx={{ bgcolor: '#2a2440', color: '#b9a6f2', fontWeight: 700 }}/> : null}
        <Box sx={{ flexGrow: 1 }}/>
        <Button size="small" onClick={() => onOpen(meta.key)} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Top 100 ›</Button>
      </Stack>
      {maxed ? (
        <Typography variant="caption" component="p" color="text.secondary" sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box component="b" sx={{ color: 'text.primary' }}>{formatMetricValue(meta.notation, meta.top)}</Box>
          {` is the max · ${numberWithCommas(meta.topTies)} players have it, all tied at #1 · listed by global rank`}
        </Typography>
      ) : null}
      {rows.length === 0
        ? <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>Nothing here yet</Typography>
        : rows.map((row) => (
          <RankRow key={row.mainChar} rank={row.rank} name={row.mainChar} value={row[meta.key]} notation={meta.notation}
                   kind={highlight[row.mainChar] ?? null} plainRank={maxed} globalRank={maxed ? row.globalRank : null}/>
        ))}
      {showPinned ? (
        <RankRow rank={pinned.entry.r} name={pinned.mainChar} value={pinned.entry.v} notation={meta.notation} kind={pinned.kind}
                 plainRank={maxed} globalRank={maxed ? pinned.globalRank : null} maxCheck={maxed && pinned.entry.v >= meta.top}/>
      ) : null}
    </Card>
  );
};

export default MetricCard;
