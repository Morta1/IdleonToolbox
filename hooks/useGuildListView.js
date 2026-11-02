import { useState } from 'react';

/**
 * Owns the search box of the guild leaderboard and the guilds it matches. The table sorts and pages itself.
 */
export function useGuildListView(guilds) {
  const [query, setQuery] = useState('');

  const onQueryChange = (e) => setQuery(e.target.value);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGuilds = normalizedQuery
    ? guilds?.filter((g) => g.guild_name?.toLowerCase().includes(normalizedQuery))
    : guilds;

  return { query, onQueryChange, filteredGuilds };
}
