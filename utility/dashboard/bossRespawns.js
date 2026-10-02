// Dr Defecaus and Baba Yaga respawn tracking for the dashboard Bosses card.
// The game keeps both respawn timers in MonsterRespawnTime, a per-device array that never
// reaches the cloud save, so Toolbox can only infer them:
// - Defecaus: the daily reset loop re-arms his slot (MonsterRespawnTime[149] = 2), so he is up
//   once per daily reset.
// - Baba Yaga: respawns 80400s after a kill (MonsterDefinitions babayaga RespawnTime). Offline
//   time is subtracted at login, so the timer follows wall-clock time.
// Kills come from Ninja[105] (Death Note boss page), which only counts once the
// Revenge_of_the_Pickle jade emporium bonus is unlocked. Without it, both rows are manual only.

export const DAY_MS = 864e5;
export const BABA_RESPAWN_MS = 80400 * 1000;

// Start of the daily-reset window `clock` falls in. `nextResetAt` comes from the save
// (lastUpdated + ShopRestock), so it can already be in the past when the data is stale.
export const getResetWindowStart = (nextResetAt, clock) => {
  const lastReset = nextResetAt - DAY_MS;
  if (!isFinite(lastReset)) return null;
  return lastReset + Math.floor((clock - lastReset) / DAY_MS) * DAY_MS;
};

// ShopRestock drifts by a few seconds between saves, so two window starts within an hour
// are the same reset.
const isSameReset = (a, b) => a != null && b != null && Math.abs(a - b) < 36e5;

export const syncDefecaus = (stored, { resetStart, kills }) => {
  if (resetStart == null) return stored;
  if (!stored || !isSameReset(stored.resetStart, resetStart)) {
    return { resetStart, baseline: kills, dismissed: false };
  }
  return stored;
};

// 'up' | 'killed' (kill count went up since the reset) | 'dismissed' (manual)
export const getDefecausStatus = (stored, { kills, tracked }) => {
  if (!stored) return 'up';
  if (tracked && kills > stored.baseline) return 'killed';
  return stored.dismissed ? 'dismissed' : 'up';
};

// Undo forgets an auto-detected kill too: the row stays up until the count moves again.
export const undoDefecaus = (stored, kills) => ({ ...stored, baseline: kills, dismissed: false });

export const syncBaba = (stored, { kills, tracked, clock }) => {
  if (!tracked) return stored;
  if (stored?.baseline == null) return { ...stored, baseline: kills };
  if (kills > stored.baseline) return { ...stored, baseline: kills, killedAt: clock };
  return stored;
};

export const getBabaRespawnAt = (stored) => stored?.killedAt ? stored.killedAt + BABA_RESPAWN_MS : null;

export const isBabaUp = (stored, clock) => {
  const respawnAt = getBabaRespawnAt(stored);
  return !respawnAt || respawnAt <= clock;
};
