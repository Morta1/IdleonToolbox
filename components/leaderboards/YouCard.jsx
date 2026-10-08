import React from 'react';
import { Button, Card, Stack, Typography } from '@mui/material';
import { numberWithCommas } from '@utility/helpers';
import { countStanding } from './standing';
import { HIGHLIGHT } from './RankRow';

const Stat = ({ label, value, sub }) => (
  <Stack>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" component="p">{value}</Typography>
    {sub ? <Typography variant="caption" color="text.secondary">{sub}</Typography> : null}
  </Stack>
);

const YouCard = ({ data, kind, index, onSeeAll }) => {
  const { player, ranks } = data;
  const counts = countStanding(ranks, index);
  const topPercent = Math.max(0.1, Math.round((player.rank / player.totalUsers) * 1000) / 10);
  return (
    <Card variant="outlined" sx={{ p: 2, borderRadius: 2, boxShadow: `inset 3px 0 0 ${HIGHLIGHT[kind]}` }}>
      <Typography variant="overline" sx={{ color: HIGHLIGHT[kind], fontWeight: 700 }}>{kind === 'logged' ? 'You' : 'Searched player'}</Typography>
      <Typography variant="h5" component="h2">{player.mainChar}</Typography>
      <Stack direction="row" gap={3} flexWrap="wrap" sx={{ mt: 1.5 }}>
        <Stat label="Global rank" value={`#${numberWithCommas(player.rank)}`} sub={`of ${numberWithCommas(player.totalUsers)} · top ${topPercent}%`}/>
        <Stat label="Points" value={numberWithCommas(Math.round(player.compositeScore))}/>
        <Stat label="First places" value={counts.firsts}/>
        <Stat label="Top 25" value={counts.top25}/>
        <Stat label="Top 100" value={counts.top100}/>
      </Stack>
      {onSeeAll ? <Button onClick={onSeeAll} sx={{ mt: 2 }}>See all ranks</Button> : null}
    </Card>
  );
};

export default YouCard;
