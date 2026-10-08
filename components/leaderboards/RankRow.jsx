import React from 'react';
import { Link, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { IconCheck } from '@tabler/icons-react';
import { prefix } from '@utility/helpers';
import { formatMetricValue, profileUrl } from './format';

export const HIGHLIGHT = { logged: '#007E85', searched: '#cd861b' };
const TROPHIES = { 1: 'data/Trophie.png', 2: 'data/G2icon40.png', 3: 'data/G2icon39.png' };

const RankBadge = ({ rank, plain }) => {
  if (!plain && TROPHIES[rank]) {
    return <img width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} src={`${prefix}${TROPHIES[rank]}`} alt={`Rank ${rank}`}/>;
  }
  return <Typography component="span" variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>
    {rank ?? '-'}
  </Typography>;
};

// plainRank: a maxed board's ten #1s are text, not ten trophies (D7).
const RankRow = ({ rank, name, value, notation, kind = null, plainRank = false, globalRank = null, maxCheck = false }) => (
  <Stack direction="row" alignItems="center" gap={1} data-testid="rank-row" sx={{
    px: 1.5, py: 0.75, borderBottom: 1, borderColor: 'divider',
    bgcolor: kind ? '#12141c' : 'transparent',
    boxShadow: kind ? `inset 3px 0 0 ${HIGHLIGHT[kind]}` : 'none'
  }}>
    <RankBadge rank={rank} plain={plainRank}/>
    <Link href={profileUrl(name)} target="_blank" underline="hover" color="inherit" noWrap
          sx={{ minWidth: 0, fontWeight: kind ? 600 : 400, opacity: name?.startsWith('Anon#') ? 0.85 : 1 }}>
      {name}
    </Link>
    {globalRank ? <Typography variant="caption" color="text.secondary" noWrap>global #{globalRank}</Typography> : null}
    <Box sx={{ flexGrow: 1 }}/>
    {maxCheck ? <IconCheck size={16} color="#81c784" aria-label="Has the max"/> : null}
    <Typography variant="body2" color="text.secondary" noWrap>{formatMetricValue(notation, value)}</Typography>
  </Stack>
);

export default RankRow;
