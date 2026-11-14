import { useEffect, useSyncExternalStore } from 'react';

// The signed-in player's ranks as this browser last saw them, so the leaderboards can show what moved since the last
// visit. Stored per uid as { name, prev, cur }; prev and cur are { createdAt, rank, ranks: { metric: [r, v] } }, the value
// kept so the You card's counters count a past run the way they count this one (maxed boards).
// cur follows every run the page sees; prev moves to the old cur only once per browser session, when a visit starts,
// so a page left open or a reload after the next 30-minute run keeps "since your last visit" meaning the last visit.
// The raw string is the snapshot (compared by value); parsing it again each render is cheap and never loops.
const storageKey = (uid) => `${uid}/lbSeen`;
const visitKey = (uid) => `${uid}/lbVisit`;

const subscribe = (changed) => {
  window.addEventListener('storage', changed);
  window.addEventListener('lb-seen', changed);
  return () => {
    window.removeEventListener('storage', changed);
    window.removeEventListener('lb-seen', changed);
  };
};

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const parse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const snapshotOf = (data) => ({
  createdAt: data.createdAt,
  rank: data.player.rank,
  ranks: Object.fromEntries(Object.entries(data.ranks ?? {}).map(([metric, { r, v }]) => [metric, [r, v]]))
});

// Next stored value for a new /player reply, or null when nothing changes.
export const nextHistory = (stored, data, newVisit) => {
  const name = data.player.mainChar;
  const cur = snapshotOf(data);
  if (!stored || stored.name !== name || !stored.cur) return { name, prev: null, cur };
  if (cur.createdAt <= stored.cur.createdAt) return null;
  return { name, prev: newVisit ? stored.cur : stored.prev, cur };
};

// What moved between prev and cur: the global rank, and each board both runs ranked. Positive is up.
export const rankChanges = (history) => {
  if (!history?.prev || !history?.cur) return null;
  const { prev, cur } = history;
  const boards = Object.entries(cur.ranks)
    .filter(([metric, [r]]) => prev.ranks[metric] != null && prev.ranks[metric][0] !== r)
    .map(([metric, [r]]) => ({ metric, from: prev.ranks[metric][0], to: r, delta: prev.ranks[metric][0] - r }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.to - b.to);
  // The previous run's ranks in /player's entry shape, for countStanding.
  const prevEntries = Object.fromEntries(Object.entries(prev.ranks).map(([metric, [r, v]]) => [metric, { r, v }]));
  return { since: prev.createdAt, rank: prev.rank - cur.rank, boards, prevEntries };
};

// data: the /player reply for the signed-in player only (never a searched one). Returns rankChanges or null.
const useRankHistory = (uid, data) => {
  const raw = useSyncExternalStore(subscribe, () => (uid ? read(storageKey(uid)) : null), () => null);
  useEffect(() => {
    if (!uid || !data?.player || !data.createdAt) return;
    let newVisit = false;
    try {
      newVisit = !window.sessionStorage.getItem(visitKey(uid));
      window.sessionStorage.setItem(visitKey(uid), '1');
    } catch {
      newVisit = false;
    }
    const next = nextHistory(parse(read(storageKey(uid))), data, newVisit);
    if (!next) return;
    try {
      window.localStorage.setItem(storageKey(uid), JSON.stringify(next));
      window.dispatchEvent(new Event('lb-seen'));
    } catch {
      // A full or blocked storage only costs the changes, never the page.
    }
  }, [uid, data?.createdAt, data?.player?.mainChar]);
  const history = parse(raw);
  return history?.name === data?.player?.mainChar ? rankChanges(history) : null;
};

export default useRankHistory;
