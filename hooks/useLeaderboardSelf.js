import { useContext, useSyncExternalStore } from 'react';
import { readLocalStorageValue } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';

// Who "you" are on the leaderboards: the Anon# id this browser last uploaded under, else the first
// character, for a signed-in account or a player's own imported save. A demo or a viewed profile is someone else's save:
// its first character would look up a stranger who shares the name, and show them as "You".
// The stored values are read during render, not by useLocalStorage: its read lands an effect after the uid does, so the
// main character would show for one render and cost a wasted /player lookup. No uid on the export or the first client
// render, so they agree. All three hold a string or a number, which a snapshot compares by value.
const subscribe = (changed) => {
  window.addEventListener('storage', changed);
  window.addEventListener('mantine-local-storage', changed);
  return () => {
    window.removeEventListener('storage', changed);
    window.removeEventListener('mantine-local-storage', changed);
  };
};
const useStored = (key) => useSyncExternalStore(subscribe, () => readLocalStorageValue({ key }), () => undefined);

const useLeaderboardSelf = () => {
  const { state } = useContext(AppContext);
  const uid = state?.uid;
  const anonId = useStored(`${uid}/anonId`);
  const participation = useStored(`${uid}/lastUploadParticipation`);
  const lastUpload = useStored(`${uid}/lastUpload`);
  const mainChar = (uid || state?.manualImport) && !state?.demo && !state?.profile ? state?.characters?.[0]?.name ?? null : null;
  return {
    name: (uid && anonId) || mainChar,
    // True until the account has loaded (DEFAULT_STATE, so also on the build and first client render).
    pending: Boolean(state?.isLoading),
    participation: uid ? participation ?? null : null,
    lastUpload: uid ? lastUpload ?? null : null
  };
};

export default useLeaderboardSelf;
