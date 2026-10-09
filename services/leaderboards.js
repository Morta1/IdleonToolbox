const url = process.env.NEXT_PUBLIC_PROFILES_URL;

// 404 is an answer (no such player), every other failure is an error for React Query to surface.
const getJson = async (path) => {
  const response = await fetch(`${url}${path}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
  return response.json();
};

export const fetchMeta = () => getJson('/leaderboards/meta');

export const fetchPlayer = (name) => getJson(`/leaderboards/player?name=${encodeURIComponent(name)}`);

export const fetchBoard = (metric, { limit = 100, around, publicOnly } = {}) => {
  const params = new URLSearchParams({ metric, limit: String(limit) });
  if (around) params.set('around', around);
  if (publicOnly) params.set('public', '1');
  return getJson(`/leaderboards/board?${params}`);
};

export const searchNames = async (q) => (await getJson(`/leaderboards/names?q=${encodeURIComponent(q)}`))?.players ?? [];

// v=2: ranked lists from board_tops. Without it the API keeps serving the old site's lists.
export const fetchTab = (tab) => getJson(`/leaderboards?leaderboard=${encodeURIComponent(tab)}&v=2`);
