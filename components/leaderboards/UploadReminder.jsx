import React, { useContext, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';
import { notify } from '@components/common/Overlays/notify';
import { useOwnSave } from '@components/common/UploadPrompt';
import useNow from '@hooks/useNow';
import useProfileUpload, { isShown } from '@hooks/useProfileUpload';
import { errorMessage } from '@utility/analytics';

const DAY_MS = 24 * 60 * 60 * 1000;
// Shown once the last upload is this old, and put away this long by its x.
const OLD_AFTER_DAYS = 3;
const PUT_AWAY_DAYS = 14;

// One line above the ranking for a player on the boards whose upload is days old and who has automatic upload off:
// how old their places are, and the one action that fixes it (upload now, and turn automatic upload on).
const UploadReminder = () => {
  const { state } = useContext(AppContext);
  const own = useOwnSave();
  const now = useNow(60000);
  const { upload, lastUpload, lastUploadAccess, lastUploadParticipation, autoUpload, setAutoUpload, autoHours } = useProfileUpload();
  const [until, setUntil] = useLocalStorage({ key: `${state?.uid}/uploadReminder` });
  const [removeGems] = useLocalStorage({ key: 'data:removeGemsInfo', defaultValue: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const days = now && lastUpload ? Math.floor((now - lastUpload) / DAY_MS) : 0;
  // The access comes from this browser's note of the last upload by hand: without it there is nothing to upload as.
  if (!own || autoUpload || autoHours <= 0 || !isShown(lastUploadAccess) || days < OLD_AFTER_DAYS || (until && now < until)) return null;

  const keepUpdated = async () => {
    setBusy(true);
    setError(null);
    try {
      await upload({ profileAccess: lastUploadAccess, leaderboardParticipation: lastUploadParticipation ?? 'on', removeGems });
      setAutoUpload(true);
      notify('Profile uploaded. It now updates automatically.');
    } catch (err) {
      setError(err);
    }
    setBusy(false);
  };

  if (error) return <Notice tone={'error'} action={false} onDismiss={() => setError(null)}>{errorMessage(error)}</Notice>;
  return <Notice action={{ label: 'Keep it updated automatically', onClick: keepUpdated, busy, busyLabel: 'Uploading' }}
                 onDismiss={() => setUntil(now + PUT_AWAY_DAYS * DAY_MS)}>
    Last uploaded {days} days ago, so your leaderboard ranks are {days} days out of date.
  </Notice>;
};

export default UploadReminder;
