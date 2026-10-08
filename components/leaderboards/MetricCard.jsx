import React from 'react';
import { Card, Chip, Link, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { numberWithCommas } from '@utility/helpers';
import { TABS, formatMetricValue } from './format';
import MetricIcon from './MetricIcon';
import RankRow from './RankRow';

const boardHref = (meta) => {
  const tab = TABS.find((entry) => entry.toLowerCase() === meta.category);
  return `?${tab ? `t=${tab}&` : ''}m=${encodeURIComponent(meta.key)}`;
};

// A plain click opens the drawer (or tab) in place; a modified click keeps the browser's own behaviour.
export const openOnPlainClick = (onOpen, key) => (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onOpen(key);
};

const MetricCard = ({ meta, entries, highlight, pinned, onOpen }) => {
  const listed = entries ?? [];
  const maxed = Boolean(meta.maxed);
  const missing = Boolean(pinned?.entry) && !listed.some((row) => row.mainChar === pinned.mainChar);
  // A player missing from a list that runs past their rank (an anonymous player while anonymous
  // players are hidden) goes in their place; below the list they are pinned at the bottom.
  const inPlace = missing && listed.length > 0 && pinned.entry.r < listed[listed.length - 1].rank;
  const rows = inPlace
    ? [...listed, { mainChar: pinned.mainChar, rank: pinned.entry.r, [meta.key]: pinned.entry.v, globalRank: pinned.globalRank }].sort((a, b) => a.rank - b.rank)
    : listed;
  const showPinned = missing && !inPlace;
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ px: 1.75, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <MetricIcon metric={meta.key} label={meta.label} maxed={maxed}/>
        <Typography variant="subtitle2" component="h3" title={meta.label} sx={{
          minWidth: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}>{meta.label}</Typography>
        {maxed ? (
          <Chip size="small" label="Maxed" sx={{
            height: 19, bgcolor: '#2a2440', color: '#b9a6f2', fontSize: 11, fontWeight: 700, '& .MuiChip-label': { px: 1 }
          }}/>
        ) : null}
        <Box sx={{ flexGrow: 1 }}/>
        <Link href={boardHref(meta)} onClick={openOnPlainClick(onOpen, meta.key)} underline="hover" data-board-link={meta.key}
              sx={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Top 100 ›</Link>
      </Stack>
      {maxed ? (
        <Typography variant="caption" component="p" color="text.secondary" sx={{ px: 1.75, py: 1.25, lineHeight: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box component="b" sx={{ color: 'text.primary' }}>{formatMetricValue(meta.notation, meta.top, { scale: meta.top })}</Box>
          {` is the max · ${numberWithCommas(meta.topTies)} players have it, all tied at #1 · listed by global rank`}
        </Typography>
      ) : null}
      {rows.length === 0
        ? <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>Nothing here yet</Typography>
        : rows.map((row) => (
          <RankRow key={row.mainChar} rank={row.rank} name={row.mainChar} value={row[meta.key]} notation={meta.notation} scale={meta.top}
                   kind={highlight[row.mainChar] ?? (inPlace && row.mainChar === pinned.mainChar ? pinned.kind : null)}
                   plainRank={maxed} globalRank={maxed ? row.globalRank : null}/>
        ))}
      {showPinned ? (
        <RankRow pinned rank={pinned.entry.r} name={pinned.mainChar} value={pinned.entry.v} notation={meta.notation} scale={meta.top} kind={pinned.kind}
                 plainRank={maxed} globalRank={maxed ? pinned.globalRank : null} maxCheck={maxed && pinned.entry.v >= meta.top}/>
      ) : null}
    </Card>
  );
};

export default MetricCard;
