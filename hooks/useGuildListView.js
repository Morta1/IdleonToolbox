import { useState } from 'react';

/**
 * Owns the filter / sort / paginate state for the guild leaderboard and derives
 * the rows to render. The page is reset to 0 whenever the query or sort changes.
 */
export function useGuildListView(guilds, rowsPerPage) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const onQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const onSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGuilds = normalizedQuery
    ? guilds?.filter((g) => g.guild_name?.toLowerCase().includes(normalizedQuery))
    : guilds;
  const sortedGuilds = sortBy && filteredGuilds
    ? [...filteredGuilds].sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    })
    : filteredGuilds;
  const pagedGuilds = sortedGuilds?.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return {
    query,
    onQueryChange,
    sortBy,
    sortDir,
    onSort,
    page,
    onPageChange: setPage,
    filteredGuilds,
    pagedGuilds
  };
}
