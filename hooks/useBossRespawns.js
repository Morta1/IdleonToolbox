import { useEffect, useState } from 'react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import {
  DAY_MS,
  getBabaRespawnAt,
  getDefecausStatus,
  getResetWindowStart,
  isBabaUp,
  syncBaba,
  syncDefecaus,
  undoDefecaus
} from '@utility/dashboard/bossRespawns';

const STORAGE_KEY = 'dashboard-boss-respawns';

// Shared by the Bosses card and the General alerts, so both read (and keep syncing) the same
// tracker state even when the card is hidden.
const useBossRespawns = ({ account, characters, lastUpdated }) => {
  const [clock, setClock] = useState(() => Date.now());
  const [allStored, setAllStored] = useLocalStorage({
    key: STORAGE_KEY,
    defaultValue: {},
    getInitialValueInEffect: false
  });
  // Keyed per account so switching profiles doesn't compare one account's kills to another's.
  const accountKey = characters?.[0]?.name ?? 'default';
  const stored = allStored?.[accountKey] ?? {};
  const tracked = !!isJadeBonusUnlocked(account, 'Revenge_of_the_Pickle');
  const bossKills = account?.deathNote?.miniBosses?.mobs;
  const defecausKills = bossKills?.find(({ rawName }) => rawName === 'poopBig')?.kills ?? 0;
  const babaKills = bossKills?.find(({ rawName }) => rawName === 'babayaga')?.kills ?? 0;
  const nextResetAt = (lastUpdated ?? clock) + account?.timeAway?.ShopRestock * 1000;
  const resetStart = getResetWindowStart(nextResetAt, clock);
  const nextReset = resetStart != null ? resetStart + DAY_MS : null;
  const babaRespawnAt = getBabaRespawnAt(stored.baba);

  // Wake only when a status can flip (daily reset, Baba respawn) instead of polling.
  useEffect(() => {
    const upcoming = [nextReset, babaRespawnAt].filter((at) => at > clock);
    if (upcoming.length === 0) return;
    const timeout = setTimeout(() => setClock(Date.now()), Math.min(...upcoming) - clock + 1000);
    return () => clearTimeout(timeout);
  }, [nextReset, babaRespawnAt, clock]);

  // Plain values, not updater functions: Mantine broadcasts an updater's result to the other
  // hook instances from inside setState, which React reports as a cross-component render update.
  // Reading storage first keeps two writes in one tick from overwriting each other.
  const write = (changes) => {
    const current = readLocalStorageValue({ key: STORAGE_KEY, defaultValue: {} }) ?? {};
    setAllStored({ ...current, [accountKey]: { ...current?.[accountKey], ...changes } });
  };
  const update = (boss, value) => write({ [boss]: value });

  useEffect(() => {
    const defecaus = syncDefecaus(stored.defecaus, { resetStart, kills: defecausKills });
    const baba = syncBaba(stored.baba, { kills: babaKills, tracked, clock: Date.now() });
    if (defecaus !== stored.defecaus || baba !== stored.baba) {
      write({ defecaus, baba });
    }
  }, [accountKey, resetStart, defecausKills, babaKills, tracked, allStored, setAllStored]);

  return {
    tracked,
    nextReset,
    defecausStatus: getDefecausStatus(stored.defecaus, { kills: defecausKills, tracked }),
    babaUp: isBabaUp(stored.baba, clock),
    babaRespawnAt,
    babaKilledAt: stored.baba?.killedAt,
    killDefecaus: () => update('defecaus', { ...stored.defecaus, dismissed: true }),
    undoDefecaus: () => update('defecaus', undoDefecaus(stored.defecaus, defecausKills)),
    killBaba: () => update('baba', { ...stored.baba, killedAt: Date.now() }),
    undoBaba: () => update('baba', { ...stored.baba, killedAt: null, baseline: babaKills })
  };
};

export default useBossRespawns;
