export const GUILD_HISTORY_BASE =
  process.env.NEXT_PUBLIC_GUILD_HISTORY_BASE || 'https://guild-history.workers.dev';

export async function fetchGuildIndex(deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const res = await fetchFn(`${GUILD_HISTORY_BASE}/api/guilds`);
  if (!res.ok) throw new Error(`fetchGuildIndex failed: ${res.status}`);
  return res.json();
}

export async function fetchGuildDetail(guildId, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const res = await fetchFn(`${GUILD_HISTORY_BASE}/api/guilds/${encodeURIComponent(guildId)}`);
  if (!res.ok) throw new Error(`fetchGuildDetail ${guildId} failed: ${res.status}`);
  return res.json();
}

export async function fetchGlobalSnapshots(limit = 1, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const res = await fetchFn(`${GUILD_HISTORY_BASE}/api/global-snapshots?limit=${limit}`);
  if (!res.ok) throw new Error(`fetchGlobalSnapshots failed: ${res.status}`);
  return res.json();
}
