import {
  Box,
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { numberWithCommas, prefix } from '@utility/helpers';
import Sparkline from './Sparkline';
import { getGuildLevel } from '@parsers/guild';

/**
 * A single guild row, used by both the main leaderboard and the Pinned section.
 *
 * tombstone — guild is pinned but not in the current cohort.
 * yourGuild  — this row represents the logged-in user's guild.
 * pinned     — whether this guild is in the manual pin list.
 */
export default function GuildRow({ guild, muiTheme, router, isPinned, onTogglePin, yourGuild, tombstone }) {
  const {
    guild_id, guild_name, guild_icon, total_gp, gp_this_week,
    vs_last_wk_pct, rank_delta_2w, members_count, rank, total_gp_history
  } = guild;

  const vsFlat = vs_last_wk_pct != null && Math.abs(vs_last_wk_pct) < 0.0005;
  const vsColor = vs_last_wk_pct == null
    ? null
    : vsFlat
      ? 'text.secondary'
      : vs_last_wk_pct > 0 ? '#81c784' : '#cf6679';
  const VsIcon = vs_last_wk_pct == null
    ? null
    : vsFlat
      ? RemoveIcon
      : vs_last_wk_pct > 0 ? ArrowDropUpIcon : ArrowDropDownIcon;

  if (tombstone) {
    // Pinned guild no longer in the tracked cohort.
    return (
      <TableRow sx={{ opacity: 0.5 }}>
        <TableCell sx={{ p: '4px' }}>
          <Tooltip title="Unpin">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onTogglePin(guild_id, guild_name); }}
            >
              <PushPinIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ p: 1, textAlign: 'center' }}>—</TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography color="text.secondary">{guild_name}</Typography>
            <Chip label="Not tracked" size="small" variant="outlined" />
          </Stack>
        </TableCell>
        <TableCell colSpan={5} />
      </TableRow>
    );
  }

  return (
    <TableRow
      sx={{
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' },
        ...(yourGuild && { outline: `2px solid ${muiTheme.palette.primary.main}`, outlineOffset: '-1px' })
      }}
      onClick={() => router.push(`/guilds/detail?id=${encodeURIComponent(guild_id)}`)}
    >
      <TableCell sx={{ p: '4px' }}>
        <Tooltip title={isPinned ? 'Unpin' : 'Pin guild'}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onTogglePin(guild_id, guild_name); }}
          >
            {isPinned
              ? <PushPinIcon fontSize="small" color="primary" />
              : <PushPinOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ p: 1, textAlign: 'center' }}>
        {rank}
      </TableCell>
      <TableCell>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img src={`${prefix}data/G2icon${guild_icon}.png`}
               style={{ width: 24 }}
               alt={'guild-icon'}/>
          <Typography fontWeight={500}>{guild_name}</Typography>
          {yourGuild && (
            <Chip label="Your guild" size="small" color="primary" />
          )}
          {rank_delta_2w != null && rank_delta_2w !== 0 && (
            <Stack
              direction="row"
              alignItems="center"
              sx={{ color: rank_delta_2w < 0 ? '#81c784' : '#cf6679' }}
            >
              {rank_delta_2w < 0
                ? <ArrowDropUpIcon fontSize="small" sx={{ mr: -0.25 }} />
                : <ArrowDropDownIcon fontSize="small" sx={{ mr: -0.25 }} />}
              <Typography variant="caption" component="span" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.abs(rank_delta_2w)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </TableCell>
      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{numberWithCommas(total_gp)}</TableCell>
      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{numberWithCommas(gp_this_week)}</TableCell>
      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {vs_last_wk_pct == null ? (
          <Typography variant="body2" color="text.secondary" component="span">—</Typography>
        ) : (
          <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ color: vsColor }}>
            <VsIcon fontSize="small" sx={{ mr: -0.25, ...(vsFlat && { fontSize: 16 }) }} />
            <Typography
              variant="body2"
              component="span"
              fontWeight={Math.abs(vs_last_wk_pct) >= 0.2 ? 600 : 400}
            >
              {Math.abs(vs_last_wk_pct * 100).toFixed(1)}%
            </Typography>
          </Stack>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'inline-block' }}>
          <Sparkline values={total_gp_history} color={muiTheme.palette.primary.main} />
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{members_count} / {30 + 4 * getGuildLevel(total_gp)}</TableCell>
    </TableRow>
  );
}
