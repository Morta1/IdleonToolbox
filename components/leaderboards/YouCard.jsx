import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import InfoButton from '@components/common/InfoButton';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import { formatNum } from '@utility/helpers';
import { countStanding, firstPlaces, topPercentLabel } from './standing';
import { HIGHLIGHT, LABEL_COLOR } from './RankRow';
import { formatMetricValue, rankText } from './format';

const TILE_SX = { flex: '1 1 96px', width: 'auto', alignItems: 'flex-start', bgcolor: 'background.default' };
// A short label never folds beside a long list of boards.
const LABEL_SX = { whiteSpace: 'nowrap' };

const SHOWN = 6;
const boardList = (names) => names.length > SHOWN ? `${names.slice(0, SHOWN).join(', ')} and ${names.length - SHOWN} more` : names.join(', ');

// onClear: leaves a searched player; it reads "Back to you" when the visitor has standing of their own.
// A move in words, never a chip: "up 2", "down 1".
export const MoveText = ({ delta, suffix = '' }) => (
  <Box component="span" sx={{ color: delta > 0 ? 'text.success' : 'text.error', fontWeight: 500 }}>
    {delta > 0 ? 'up' : 'down'} {formatNum(Math.abs(delta), 'whole')}{suffix}
  </Box>
);
const counterMove = (now, before) => (now === before ? 'no change' : `${now > before ? '+' : '-'}${formatNum(Math.abs(now - before), 'whole')} since last visit`);

// changes: what moved since the signed-in player's last visit (useRankHistory), or null.
const YouCard = ({ data, kind, index, onClear, clearLabel = 'Clear', changes = null }) => {
  const { player, ranks } = data;
  const counts = countStanding(ranks, index);
  const before = changes ? countStanding(changes.prevEntries, index) : null;
  // A maxed board is shared by everyone who reached the max, so it is counted apart from the firsts.
  const firsts = firstPlaces(ranks, index);
  const atMax = firsts.atMax.length;
  // One line per part, and the tile as wide as its longest: a wrap mid-part splits "+3 at the / max".
  const firstsSub = [firsts.tied.length ? `${formatNum(firsts.tied.length, 'whole')} tied` : null, atMax ? `+${formatNum(atMax, 'whole')} at the max` : null,
    before ? counterMove(counts.firsts, before.firsts) : null].filter(Boolean);
  const topPercent = topPercentLabel(Math.max(0.1, (player.rank / player.totalUsers) * 100));
  const of = [player.totalUsers != null ? `of ${formatNum(player.totalUsers, 'whole')}` : null, topPercent, formatMetricValue('points', player.compositeScore)].filter(Boolean).join(' · ');
  const label = (key) => index.byKey[key]?.label ?? key;
  return (
    <Panel
      title={
        <Box component="span" sx={{ typography: 'groupLabel', textTransform: 'none', color: LABEL_COLOR[kind] }}>
          <span>{kind === 'logged' ? 'You' : 'Searched player'}</span>
          {' · '}
          {player.mainChar}
        </Box>
      }
      aside={kind === 'searched' && onClear ? (
        // The visible word leads the name, so "click Clear" works for voice control.
        <Button size="small" onClick={onClear} aria-label={`${clearLabel}, stop viewing ${player.mainChar}`}>{clearLabel}</Button>
      ) : null}
      sx={{ height: '100%', boxSizing: 'border-box', border: '2px solid', borderColor: HIGHLIGHT[kind] }}>
      <Stack gap={1.5} sx={{ p: 2 }}>
        <Stack direction="row" alignItems="baseline" columnGap={1.25} flexWrap="wrap">
          <Typography component="p" variant="heroValue">{rankText(player.rank)}</Typography>
          {changes?.rank ? <Typography variant="body2" component="span"><MoveText delta={changes.rank} suffix=" since your last visit"/></Typography> : null}
          <Typography variant="body2" color="text.secondary">{of}</Typography>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <StatTile label="First places" value={counts.firsts} sx={{ ...TILE_SX, minWidth: 'min-content' }}
                    sub={firstsSub.length ? firstsSub.map((line) => <Box key={line} sx={LABEL_SX}>{line}</Box>) : null}/>
          <StatTile label="Top 25" value={counts.top25} sx={TILE_SX} sub={before ? counterMove(counts.top25, before.top25) : null}/>
          <StatTile label="Top 100" value={counts.top100} sx={TILE_SX} sub={before ? counterMove(counts.top100, before.top100) : null}/>
        </Stack>
      </Stack>
      {firsts.sole.length ? <Panel.KV label={<Box component="span" sx={LABEL_SX}>Alone at #1</Box>} value={boardList(firsts.sole.map(label))}/> : null}
      {firsts.tied.length ? <Panel.KV label={<Box component="span" sx={LABEL_SX}>Tied for #1</Box>} value={boardList(firsts.tied.map(({ key, t }) => `${label(key)} (${formatNum(t, 'whole')} players)`))}/> : null}
      {atMax ? <Panel.KV
        label={<Box component="span" sx={LABEL_SX}>At the max <InfoButton label="At the max">So many players hold the max on these boards that they are not counted as first places.</InfoButton></Box>}
        value={boardList(firsts.atMax.map(label))}/> : null}
    </Panel>
  );
};

export default YouCard;
