export const ACCOUNT_SNAPSHOT_KEY = 'activeDropAcc';
export const CHARACTER_SNAPSHOT_KEY = 'activeDropPlayer';

// The full parsed account is ~5MB of JSON, which fills the origin's localStorage quota and makes
// every later write on the site fail silently, so a snapshot keeps only what the sections read
export const toAccountSnapshot = (account) => ({
  snapshotTime: account?.snapshotTime,
  accountOptions: account?.accountOptions,
  cards: account?.cards,
  timeAway: account?.timeAway,
  alchemy: { liquidCauldrons: account?.alchemy?.liquidCauldrons },
  tesseract: { mapBonusRaw: account?.tesseract?.mapBonusRaw },
  royalGuardian: {
    orblets: account?.royalGuardian?.orblets,
    clearingMaps: account?.royalGuardian?.clearingMaps
  },
  obols: { inventory: account?.obols?.inventory },
  breeding: { fencePets: account?.breeding?.fencePets }
});

export const toCharacterSnapshot = (character) => ({
  snapshotTime: character?.snapshotTime,
  playerId: character?.playerId,
  name: character?.name,
  mapIndex: character?.mapIndex,
  money: character?.money,
  kills: character?.kills,
  inventory: character?.inventory,
  inventorySlots: character?.inventorySlots,
  skillsInfo: { character: character?.skillsInfo?.character }
});

const SNAPSHOTS = [[ACCOUNT_SNAPSHOT_KEY, toAccountSnapshot], [CHARACTER_SNAPSHOT_KEY, toCharacterSnapshot]];
const OVERSIZED_LENGTH = 200000;

// Snapshots saved before the trim still hold the whole account; rewrite them once to free the quota
export const shrinkStoredSnapshots = () => {
  SNAPSHOTS.forEach(([key, toSnapshot]) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw.length < OVERSIZED_LENGTH) return;
      const parsed = JSON.parse(raw);
      if (!parsed) return;
      localStorage.setItem(key, JSON.stringify(toSnapshot(parsed)));
    } catch (err) {
      console.warn(`Failed to shrink ${key} in localStorage:`, err);
    }
  });
};
