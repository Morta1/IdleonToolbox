import { useState } from 'react';
import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from '@mui/material';
import HeaderWithHint from './HeaderWithHint';
import { numberWithCommas, prefix } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import Tooltip from '../Tooltip';

const DEFAULT_LIMIT = 25;

// Guild role from the member's rank field (g). Mirrors the in-game guild member
// list (GuildMembers.jsx / N.js): ranks 0-4 each get their own GuildRank{g} icon,
// rank 5 (regular member) gets no icon. 0 = King, 1 = Leader; 2-4 are unlabeled
// officer tiers. Returns null when rank is missing or 5+ so no badge shows.
function guildRole(rank) {
  if (rank == null || rank >= 5) return null;
  const label = rank === 0 ? 'King' : rank === 1 ? 'Leader' : `Rank ${rank}`;
  return { label, icon: `etc/GuildRank${rank}.png` };
}

// Idleon's reporting week starts Saturday 21:00 UTC — same anchor used in
// WeeklyProgressChart and CurationStrip.
const HOUR_MS = 3600 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;
const WEEK_ANCHOR_MS = (2 * 24 + 21) * HOUR_MS;

function currentWeekStartMs(now = Date.now()) {
  return now - ((now - WEEK_ANCHOR_MS) % WEEK_MS);
}

// How many week boundaries separate `lastContributedAt` from now.
// 0 = contributed during the current week, 1 = last week, etc.
// Returns null when there's no recorded contribution.
function weeksAgoFromTimestamp(lastContributedAt, now = Date.now()) {
  if (lastContributedAt == null) return null;
  const currentStart = currentWeekStartMs(now);
  const contribStart = currentWeekStartMs(lastContributedAt);
  return Math.max(0, Math.round((currentStart - contribStart) / WEEK_MS));
}

function lastContributedLabel(weeksAgo) {
  if (weeksAgo == null) return '—';
  if (weeksAgo === 0) return 'This week';
  if (weeksAgo === 1) return 'Last week';
  return `${weeksAgo}w ago`;
}

export function sortedMembers(members) {
  if (!members) return [];
  return [...members].sort((a, b) => (b.gp_earned || 0) - (a.gp_earned || 0));
}

export default function ContributorLeaderboard({ members }) {
  const formatDate = useFormatDate();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState('gp_earned');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const sorted = sortedMembers(members);
  const ranked = sorted.map((m, i) => ({
    ...m,
    rank: i + 1,
    weeks_since_contribution: weeksAgoFromTimestamp(m.last_contributed_at)
  }));
  const totalGuildGp = sorted.reduce((sum, m) => sum + (m.gp_earned || 0), 0);

  // Null weeks_since_contribution means "no contributions in the visible
  // history window" — should sort as the most-stale value, not as 0.
  const sortValue = (m, field) => {
    if (field === 'weeks_since_contribution') {
      return m[field] ?? Number.MAX_SAFE_INTEGER;
    }
    return m[field] ?? 0;
  };

  const resorted = [...ranked].sort((a, b) => {
    const av = sortValue(a, sortBy);
    const bv = sortValue(b, sortBy);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? resorted.filter((m) => m.member_name?.toLowerCase().includes(normalizedQuery))
    : resorted;
  const visible = (normalizedQuery || showAll) ? filtered : filtered.slice(0, DEFAULT_LIMIT);
  const showToggle = !normalizedQuery && sorted.length > DEFAULT_LIMIT;

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        placeholder="Search member by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ width: 280 }}
      />

      {visible.length === 0 ? (
        <Typography color="text.secondary">
          {normalizedQuery ? `No members match "${query}"` : 'No member contributions this week'}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ background: 'transparent' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40, fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Member</TableCell>
                <TableCell
                  sx={{ fontWeight: 600 }}
                  align="right"
                  sortDirection={sortBy === 'gp_earned' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === 'gp_earned'}
                    direction={sortBy === 'gp_earned' ? sortDir : 'desc'}
                    onClick={() => handleSort('gp_earned')}
                  >
                    GP
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  <HeaderWithHint
                    label="% Guild"
                    align="right"
                    hint="Share of the guild's total weekly GP contributed by this member."
                  />
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600 }}
                  align="right"
                  sortDirection={sortBy === 'gp_lifetime' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === 'gp_lifetime'}
                    direction={sortBy === 'gp_lifetime' ? sortDir : 'desc'}
                    onClick={() => handleSort('gp_lifetime')}
                  >
                    <HeaderWithHint
                      label="Lifetime"
                      align="right"
                      hint="Total GP this member has contributed since they joined the guild (in-game lifetime, not just since tracking started)."
                    />
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600 }}
                  align="right"
                  sortDirection={sortBy === 'weeks_since_contribution' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === 'weeks_since_contribution'}
                    direction={sortBy === 'weeks_since_contribution' ? sortDir : 'desc'}
                    onClick={() => handleSort('weeks_since_contribution')}
                  >
                    <HeaderWithHint
                      label="Last contributed"
                      align="right"
                      hint="Most recent week this member earned any GP. Based on the last 6 weeks of tracked history."
                    />
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((m) => {
                const joinedWeeksAgo = m.joined_weeks_ago ?? null;
                const pctOfGuild = totalGuildGp > 0 ? (m.gp_earned / totalGuildGp) * 100 : 0;
                const weeksAgo = m.weeks_since_contribution;
                const lastContribTooltip = m.last_contributed_at != null
                  ? formatDate(m.last_contributed_at, { showSeconds: false })
                  : 'No contributions in the last 6 weeks';
                const role = guildRole(m.member_rank);
                return (
                  <TableRow
                    key={m.member_name}
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <TableCell>{m.rank}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        {role && (
                          <Tooltip title={role.label}>
                            <img
                              src={`${prefix}${role.icon}`}
                              alt={role.label}
                              style={{ width: 18, height: 18, objectFit: 'contain' }}
                            />
                          </Tooltip>
                        )}
                        <Typography variant="body2" component="span">{m.member_name}</Typography>
                        {joinedWeeksAgo != null && (
                          <Tooltip
                            title={joinedWeeksAgo === 0
                              ? 'Joined this week'
                              : `Joined ${joinedWeeksAgo} week${joinedWeeksAgo === 1 ? '' : 's'} ago`}
                          >
                            <Chip
                              label={joinedWeeksAgo === 0 ? 'New' : `${joinedWeeksAgo}w ago`}
                              size="small"
                              variant="outlined"
                              color="info"
                              sx={{ height: 20 }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{numberWithCommas(m.gp_earned)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {pctOfGuild.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {m.gp_lifetime != null ? numberWithCommas(m.gp_lifetime) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      <Tooltip title={lastContribTooltip}>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {lastContributedLabel(weeksAgo)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {showToggle && (
        <Button
          size="small"
          onClick={() => setShowAll(!showAll)}
          sx={{ alignSelf: 'flex-start' }}
        >
          {showAll ? `Show top ${DEFAULT_LIMIT}` : `Show all ${sorted.length}`}
        </Button>
      )}
    </Stack>
  );
}
