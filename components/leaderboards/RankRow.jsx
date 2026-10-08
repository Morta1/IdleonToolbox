import React from 'react';
import { Link, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';
import { IconCheck } from '@tabler/icons-react';
import { numberWithCommas, prefix } from '@utility/helpers';
import { formatExactValue, formatMetricValue, profileUrl } from './format';

export const HIGHLIGHT = { logged: '#007E85', searched: '#cd861b' };
export const MEDAL = { 1: '#f0b849', 2: '#9aa3ad', 3: '#b8783a' };
export const TROPHIES = { 1: 'data/Trophie.png', 2: 'data/G2icon40.png', 3: 'data/G2icon39.png' };
// The highlight is colour and outline only; a screen reader hears this instead.
const SPOKEN_KIND = { logged: '(you)', searched: '(searched player)' };

const RankBadge = ({ rank, plain, strong, dim }) => {
  if (!plain && TROPHIES[rank]) {
    return <img width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} src={`${prefix}${TROPHIES[rank]}`} alt={`Rank ${rank}`}/>;
  }
  return <Typography component="span" color={strong ? 'text.primary' : dim ? 'text.disabled' : 'text.secondary'} sx={{ fontSize: 12, fontWeight: strong ? 700 : 600 }}>
    {rank == null ? '-' : numberWithCommas(rank)}
  </Typography>;
};

// plainRank: a maxed board's ten #1s are text, not ten trophies (D7).
// variant: 'card' rows sit in a metric card (centred 30px rank column), 'list' and 'around' rows in the
// drawer (left-aligned 34px column); 'around' rows are boxed, so the player's row gets a full outline.
// dimRank: a quieter rank number (0.5 alpha), for the Overview's ranks 4 to 10.
// pinned: the player's own row under a card, which reads "(you)" for the logged-in player.
// scale: the board's top value, so every row of a board shares one notation.
// display: the value text when the caller formats a group of rows together (the drawer's Around
// rows, which need enough figures to tell neighbours apart).
const RankRow = ({ rank, name, value, notation, scale, display = null, kind = null, plainRank = false, globalRank = null, maxCheck = false, pinned = false, variant = 'card', dimRank = false }) => {
  const drawer = variant !== 'card';
  const around = variant === 'around';
  const accent = kind ? HIGHLIGHT[kind] : null;
  const emphasised = Boolean(kind) && (pinned || around);
  const shape = around
    ? { borderRadius: '6px', border: '2px solid', borderColor: accent ?? 'transparent' }
    : pinned
      // The row above draws the line between them.
      ? { borderTop: 0, borderBottom: 0 }
      : { borderBottom: 1, borderColor: 'divider' };
  return (
    <Stack direction="row" alignItems="center" gap={1.25} data-testid="rank-row" aria-current={kind ? 'true' : undefined} sx={{
      // The pinned row keeps the list's rhythm: its tint and left bar already set it apart.
      px: drawer ? 1.25 : 1.75, py: drawer ? 0.875 : 0.75, fontSize: 13, ...shape,
      bgcolor: kind ? '#12141c' : 'transparent',
      boxShadow: kind && !around ? `inset 3px 0 0 ${accent}` : 'none'
    }}>
      <Box sx={{ width: drawer ? 34 : 30, flexShrink: 0, display: 'flex', justifyContent: drawer ? 'flex-start' : 'center' }}>
        <RankBadge rank={rank} plain={plainRank} strong={emphasised} dim={dimRank}/>
      </Box>
      <Link href={profileUrl(name)} target="_blank" underline="hover" color="inherit" noWrap
            sx={{ minWidth: 0, fontSize: 'inherit', fontWeight: emphasised ? (around ? 700 : 600) : kind ? 600 : 400, opacity: name?.startsWith('Anon#') ? 0.85 : 1 }}>
        {pinned && kind === 'logged' ? `${name} (you)` : name}
      </Link>
      {kind && !(pinned && kind === 'logged') ? <Box component="span" sx={visuallyHidden}>{SPOKEN_KIND[kind]}</Box> : null}
      {globalRank ? <Typography color="text.disabled" noWrap sx={{ fontSize: 11 }}>global #{globalRank}</Typography> : null}
      <Box sx={{ flexGrow: 1 }}/>
      {maxCheck ? (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: '#81c784', fontSize: 12 }}>
          <IconCheck size={14} stroke={2.5} aria-label="Has the max"/>
          max
        </Stack>
      ) : (
        // The value never shrinks: on a narrow row the name truncates, not the number.
        <Typography color="text.secondary" noWrap title={formatExactValue(notation, value)} sx={{ fontSize: 'inherit', flexShrink: 0 }}>
          {display ?? formatMetricValue(notation, value, { scale })}
        </Typography>
      )}
    </Stack>
  );
};

export default RankRow;
