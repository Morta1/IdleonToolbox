import { useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';

// Who "you" are on the leaderboards: the Anon# id this browser last uploaded under, else the first
// character. Mantine reads storage in an effect, so the export and the first client render agree.
// For a signed-in account the name stays null until that read has landed for the current uid,
// otherwise the main character would show for one render and cost a wasted /player lookup.
const useLeaderboardSelf = () => {
  const { state } = useContext(AppContext);
  const uid = state?.uid;
  const [anonId] = useLocalStorage({ key: `${uid}/anonId` });
  const [participation] = useLocalStorage({ key: `${uid}/lastUploadParticipation` });
  const [lastUpload] = useLocalStorage({ key: `${uid}/lastUpload` });
  // Declared after the storage hooks so this effect flushes with theirs and both land in one render.
  const [readUid, setReadUid] = useState(null);
  useEffect(() => {
    setReadUid(uid ?? null);
  }, [uid]);
  const mainChar = state?.characters?.[0]?.name ?? null;
  const settled = !uid || readUid === uid;
  return {
    name: settled ? (uid && anonId) || mainChar : null,
    // True until the account has loaded (DEFAULT_STATE, so also on the build and first client render).
    pending: Boolean(state?.isLoading),
    participation: uid && settled ? participation ?? null : null,
    lastUpload: uid && settled ? lastUpload ?? null : null
  };
};

export default useLeaderboardSelf;
