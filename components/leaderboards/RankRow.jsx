import React from 'react';
import { Link, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';
import { IconCheck } from '@tabler/icons-react';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import { formatMetricValue, profileUrl, rankText } from './format';

// Whose row it is and which medal: the theme's identities, as sx callbacks.
const leaderboardColor = (name) => (theme) => theme.palette.identity?.leaderboard?.[name];
export const HIGHLIGHT = { logged: leaderboardColor('you'), searched: leaderboardColor('searched') };
export const LABEL_COLOR = { logged: leaderboardColor('youText'), searched: leaderboardColor('searched') };
export const MEDAL = { 1: leaderboardColor('gold'), 2: leaderboardColor('silver'), 3: leaderboardColor('bronze') };
export const TROPHIES = { 1: 'data/Trophie.png', 2: 'data/G2icon40.png', 3: 'data/G2icon39.png' };
// The highlight is colour and outline only; a screen reader hears this instead.
const SPOKEN_KIND = { logged: '(you)', searched: '(searched player)' };

const RankBadge = ({ rank, plain, strong, dim }) => {
  // The trophy is the rank's only label.
  if (!plain && TROPHIES[rank]) return <GameIcon src={TROPHIES[rank]} size={24} alt={`Rank ${rank}`}/>;
  return <Typography component="span" variant="body2" color={strong ? 'text.primary' : dim ? 'text.muted' : 'text.secondary'} sx={{ fontWeight: strong ? 600 : 500, whiteSpace: 'nowrap' }}>
    {rankText(rank)}
  </Typography>;
};

// plainRank: a maxed board's ten #1s are text, not ten trophies (D7).
// variant: 'card' rows sit in a metric card (a centred rank column), 'list' and 'around' rows in the drawer (left-aligned);
// 'around' rows are boxed, so the player's row gets a full outline.
// dimRank: a quieter rank number, for the Overview's ranks 4 to 10.
// pinned: the player's own row under a card, which reads "(you)" for the logged-in player.
// scale: the board's top value, so every row of a board shares one notation.
// display: the value text when the caller formats a group of rows together (a card's or the drawer's rows, which need
// enough figures to tell neighbours apart). exact: the value's every digit, opened from the value.
const RankRow = ({ rank, name, value, notation, scale, display = null, exact = null, kind = null, plainRank = false, globalRank = null, maxCheck = false, pinned = false, variant = 'card', dimRank = false }) => {
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
  const text = display ?? formatMetricValue(notation, value, { scale });
  return (
    <Stack direction="row" alignItems="center" gap={1.25} data-testid="rank-row" aria-current={kind ? 'true' : undefined} sx={{
      // The pinned row keeps the list's rhythm: its tint and left bar already set it apart.
      px: drawer ? 1.25 : 1.75, py: drawer ? 0.875 : 0.75, typography: 'body2', ...shape,
      bgcolor: kind ? 'action.selected' : 'transparent',
      boxShadow: kind && !around ? (theme) => `inset 3px 0 0 ${accent(theme)}` : 'none'
    }}>
      {/* #1,220 fits: a wider rank pushes the name instead of wrapping inside itself */}
      <Box sx={{ minWidth: drawer ? 34 : 30, flexShrink: 0, display: 'flex', justifyContent: drawer ? 'flex-start' : 'center' }}>
        <RankBadge rank={rank} plain={plainRank} strong={emphasised} dim={dimRank}/>
      </Box>
      <Link href={profileUrl(name)} target="_blank" color="inherit" noWrap
            sx={{ minWidth: 0, fontSize: 'inherit', fontWeight: emphasised ? 600 : kind ? 500 : 400, opacity: name?.startsWith('Anon#') ? 0.85 : 1 }}>
        {pinned && kind === 'logged' ? `${name} (you)` : name}
      </Link>
      {kind && !(pinned && kind === 'logged') ? <Box component="span" sx={visuallyHidden}>{SPOKEN_KIND[kind]}</Box> : null}
      {globalRank ? <Typography variant="caption" color="text.muted" noWrap>global {rankText(globalRank)}</Typography> : null}
      <Box sx={{ flexGrow: 1 }}/>
      {maxCheck ? (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: 'text.success', typography: 'caption' }}>
          <IconCheck size={14} stroke={2.5} aria-label="Has the max"/>
          max
        </Stack>
      ) : (
        // The value never shrinks: on a narrow row the name truncates, not the number.
        <Typography component="div" color="text.secondary" noWrap sx={{ fontSize: 'inherit', flexShrink: 0, overflow: 'visible', fontVariantNumeric: 'tabular-nums' }}>
          {exact ? <NoteTrigger note={exact} label={`${text}, exact value`}>{text}</NoteTrigger> : text}
        </Typography>
      )}
    </Stack>
  );
};

export default RankRow;
