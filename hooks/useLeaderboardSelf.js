import { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';

// Who "you" are on the leaderboards: the Anon# id this browser last uploaded under, else the first
// character. Mantine reads storage in an effect, so the export and the first client render agree.
const useLeaderboardSelf = () => {
  const { state } = useContext(AppContext);
  const uid = state?.uid;
  const [anonId] = useLocalStorage({ key: `${uid}/anonId` });
  const [participation] = useLocalStorage({ key: `${uid}/lastUploadParticipation` });
  const [lastUpload] = useLocalStorage({ key: `${uid}/lastUpload` });
  const mainChar = state?.characters?.[0]?.name ?? null;
  return {
    name: (uid && anonId) || mainChar,
    signedIn: Boolean(uid),
    participation: uid ? participation ?? null : null,
    lastUpload: uid ? lastUpload ?? null : null
  };
};

export default useLeaderboardSelf;
