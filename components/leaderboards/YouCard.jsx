import React from 'react';
import { Button, Card, IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { numberWithCommas } from '@utility/helpers';
import { countStanding, firstPlaces, topPercentLabel } from './standing';
import { HIGHLIGHT } from './RankRow';
import { formatMetricValue, rankText } from './format';

const LABEL_COLOR = { logged: '#4fc3c9', searched: '#cd861b' };

const Stat = ({ label, value, sub, info }) => (
  <Box data-stat sx={{ bgcolor: '#1C252E', borderRadius: 2, p: 1.25 }}>
    <Typography component="p" sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{value}</Typography>
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>{label}</Typography>
      {info ? (
        <Tooltip title={info}>
          <IconButton size="small" aria-label={`About ${label.toLowerCase()}`} sx={{ p: 0.25, color: 'text.secondary' }}>
            <InfoIcon sx={{ fontSize: 14 }}/>
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
    {/* One line per part: the tile is narrow, and a wrap mid-part splits "+3 at the / max". */}
    {(sub ?? []).map((line) => <Typography key={line} color="text.disabled" sx={{ fontSize: 11 }}>{line}</Typography>)}
  </Box>
);

const SHOWN = 6;
const boardList = (names) => names.length > SHOWN ? `${names.slice(0, SHOWN).join(', ')} and ${names.length - SHOWN} more` : names.join(', ');

const FirstPlacesInfo = ({ firsts, index }) => {
  const label = (key) => index.byKey[key]?.label ?? key;
  return (
    <Stack gap={0.75}>
      {firsts.sole.length ? <span>#1 alone: {boardList(firsts.sole.map(label))}</span> : null}
      {firsts.tied.length ? <span>Tied for #1: {boardList(firsts.tied.map(({ key, t }) => `${label(key)} (${numberWithCommas(t)} players)`))}</span> : null}
      {firsts.atMax.length ? (
        <span>At the max: {boardList(firsts.atMax.map(label))}. So many players hold the max on these boards that they are not counted as first places.</span>
      ) : null}
    </Stack>
  );
};

// onClear: leaves a searched player; it reads "Back to you" when the visitor has standing of their own.
const YouCard = ({ data, kind, index, onSeeAll, onClear, clearLabel = 'Clear' }) => {
  const { player, ranks } = data;
  const counts = countStanding(ranks, index);
  // A maxed board is shared by everyone who reached the max, so it is counted apart from the firsts.
  const firsts = firstPlaces(ranks, index);
  const atMax = firsts.atMax.length;
  const firstsSub = [firsts.tied.length ? `${firsts.tied.length} tied` : null, atMax ? `+${atMax} at the max` : null].filter(Boolean);
  const topPercent = topPercentLabel(Math.max(0.1, Math.round((player.rank / player.totalUsers) * 1000) / 10));
  const of = [`of ${numberWithCommas(player.totalUsers)}`, topPercent, formatMetricValue('points', player.compositeScore)].filter(Boolean).join(' · ');
  return (
    <Card variant="outlined" sx={{
      height: '100%', boxSizing: 'border-box', p: { xs: '14px', md: '18px 20px' }, borderRadius: 2, bgcolor: '#12141c', border: '2px solid', borderColor: HIGHLIGHT[kind], boxShadow: 'none'
    }}>
      <Stack gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography component="h2" sx={{ flexGrow: 1, minWidth: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: LABEL_COLOR[kind] }}>
            <span>{kind === 'logged' ? 'You' : 'Searched player'}</span>
            {' · '}
            {/* Names are case-sensitive, so the label's capitals stop at the name. */}
            <Box component="span" sx={{ textTransform: 'none' }}>{player.mainChar}</Box>
          </Typography>
          {kind === 'searched' && onClear ? (
            // The visible word leads the name, so "click Clear" works for voice control.
            <Button size="small" onClick={onClear} aria-label={`${clearLabel}, stop viewing ${player.mainChar}`}
                    sx={{ p: 0, minWidth: 0, fontSize: 12, fontWeight: 600, textTransform: 'none', flexShrink: 0 }}>
              {clearLabel}<Box component="span" aria-hidden sx={{ ml: 0.5 }}>×</Box>
            </Button>
          ) : null}
        </Stack>
        <Stack direction="row" alignItems="baseline" columnGap={1.25} flexWrap="wrap">
          <Typography component="p" sx={{ fontSize: { xs: 34, md: 44 }, fontWeight: 700, lineHeight: 1 }}>{rankText(player.rank)}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 } }}>{of}</Typography>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, mt: 0.5 }}>
          <Stat label="First places" value={counts.firsts} sub={firstsSub}
                info={counts.firsts || atMax ? <FirstPlacesInfo firsts={firsts} index={index}/> : null}/>
          <Stat label="Top 25" value={counts.top25}/>
          <Stat label="Top 100" value={counts.top100}/>
        </Box>
        {onSeeAll ? <Button onClick={onSeeAll}>See all ranks</Button> : null}
      </Stack>
    </Card>
  );
};

export default YouCard;
