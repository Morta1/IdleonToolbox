import React from 'react';
import { Link, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import { formatNum } from '@utility/helpers';
import { TABS, formatDistinctValues, formatMetricValue } from './format';
import MetricIcon from './MetricIcon';
import RankRow from './RankRow';

export const boardHref = (meta, player = null) => {
  const tab = TABS.find((entry) => entry.toLowerCase() === meta.category);
  return `?${tab ? `t=${tab}&` : ''}m=${encodeURIComponent(meta.key)}${player ? `&player=${encodeURIComponent(player)}` : ''}`;
};

// A plain click opens the drawer (or tab) in place; a modified click keeps the browser's own behaviour.
export const openOnPlainClick = (onOpen, key) => (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onOpen(key);
};

// A board's name takes two lines, then an ellipsis: its full name is its drawer's title.
const TITLE_CLAMP_SX = { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' };

const MetricCard = ({ meta, entries, highlight, pinned, onOpen, linkPlayer = null }) => {
  const listed = (entries ?? []).filter((row) => row?.mainChar);
  const maxed = Boolean(meta.maxed);
  const missing = Boolean(pinned?.entry) && !listed.some((row) => row.mainChar === pinned.mainChar);
  // A player missing from a list that runs past their rank (an anonymous player while anonymous
  // players are hidden) goes in their place; below the list they are pinned at the bottom.
  const inPlace = missing && listed.length > 0 && pinned.entry.r < listed[listed.length - 1].rank;
  const rows = inPlace
    ? [...listed, { mainChar: pinned.mainChar, rank: pinned.entry.r, [meta.key]: pinned.entry.v, globalRank: pinned.globalRank }].sort((a, b) => a.rank - b.rank)
    : listed;
  const showPinned = missing && !inPlace;
  // A card's ten rows (and the pinned one) never read the same for different values: 12.20M next
  // to 12.19M rather than 12.2M twice, which looks like a tie.
  const texts = formatDistinctValues(meta.notation, [...rows.map((row) => row[meta.key]), ...(showPinned ? [pinned.entry.v] : [])], { scale: meta.top });
  return (
    <ItemCard
      icon={<MetricIcon metric={meta.key} label={meta.label}/>}
      title={<Box component="span" sx={TITLE_CLAMP_SX}>{meta.label}</Box>}
      status={maxed ? 'maxed' : undefined}
      aside={<Link href={boardHref(meta, linkPlayer)} onClick={openOnPlainClick(onOpen, meta.key)} data-board-link={meta.key} aria-label={`Top 100: ${meta.label}`}
                   variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, whiteSpace: 'nowrap' }}>Top 100</Link>}>
      {maxed ? (
        <Typography variant="caption" component="p" color="text.secondary">
          <Box component="b" sx={{ color: 'text.primary', fontWeight: 500 }}>{formatMetricValue(meta.notation, meta.top, { scale: meta.top })}</Box>
          {` is the max · ${formatNum(meta.topTies, 'whole')} players have it, all tied at #1 · listed by global rank`}
        </Typography>
      ) : null}
      {rows.length === 0 && !showPinned ? <StatusText status="info" wrap>No one on this board yet.</StatusText> : null}
      {/* The card's own border closes the list, so its last row draws none. The rows reach the card's edges, less the room their highlight's bar needs. */}
      <Box sx={{ mx: -1.25, '& > [data-testid="rank-row"]': { px: 1.25 }, '& > [data-testid="rank-row"]:last-child': { borderBottom: 0 } }}>
        {rows.map((row, at) => (
          <RankRow key={row.mainChar} rank={row.rank} name={row.mainChar} value={row[meta.key]} notation={meta.notation} scale={meta.top} display={texts[at]}
                   kind={highlight[row.mainChar] ?? (inPlace && row.mainChar === pinned.mainChar ? pinned.kind : null)}
                   plainRank={maxed} globalRank={maxed ? row.globalRank : null}/>
        ))}
        {showPinned ? (
          <RankRow pinned rank={pinned.entry.r} name={pinned.mainChar} value={pinned.entry.v} notation={meta.notation} scale={meta.top} display={texts[rows.length]} kind={pinned.kind}
                   plainRank={maxed} globalRank={maxed ? pinned.globalRank : null} maxCheck={maxed && pinned.entry.v >= meta.top}/>
        ) : null}
      </Box>
    </ItemCard>
  );
};

export default MetricCard;
