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

// The signed-in player's past standing: `range` days back (7, 30 or 90), or the default comparison without one.
export const fetchHistory = (name, range) =>
  getJson(`/leaderboards/history?name=${encodeURIComponent(name)}${range ? `&range=${range}` : ''}`);

// One board over the player's recorded days: { metric, series: [[recorded at, rank, value]] }.
export const fetchBoardHistory = (name, metric) =>
  getJson(`/leaderboards/history?name=${encodeURIComponent(name)}&metric=${encodeURIComponent(metric)}`);

export const fetchBoard = (metric, { limit = 100, around, publicOnly } = {}) => {
  const params = new URLSearchParams({ metric, limit: String(limit) });
  if (around) params.set('around', around);
  if (publicOnly) params.set('public', '1');
  return getJson(`/leaderboards/board?${params}`);
};

export const searchNames = async (q) => (await getJson(`/leaderboards/names?q=${encodeURIComponent(q)}`))?.players ?? [];

// v=3: a display tab's ranked lists (Account, Worlds...), served from board_tops by the layout.
export const fetchTab = (tab) => getJson(`/leaderboards?leaderboard=${encodeURIComponent(tab)}&v=3`);
