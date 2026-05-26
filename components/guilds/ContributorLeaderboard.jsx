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
  Tooltip,
  Typography
} from '@mui/material';
import HeaderWithHint from './HeaderWithHint';
import { numberWithCommas } from '@utility/helpers';

const DEFAULT_LIMIT = 25;

export function sortedMembers(members) {
  if (!members) return [];
  return [...members].sort((a, b) => (b.gp_earned || 0) - (a.gp_earned || 0));
}

export default function ContributorLeaderboard({ members }) {
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
  const ranked = sorted.map((m, i) => ({ ...m, rank: i + 1 }));
  const totalGuildGp = sorted.reduce((sum, m) => sum + (m.gp_earned || 0), 0);

  const resorted = [...ranked].sort((a, b) => {
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
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
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((m) => {
                const joinedWeeksAgo = m.joined_weeks_ago ?? null;
                const pctOfGuild = totalGuildGp > 0 ? (m.gp_earned / totalGuildGp) * 100 : 0;
                return (
                  <TableRow
                    key={m.member_name}
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <TableCell>{m.rank}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={0.75}>
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
