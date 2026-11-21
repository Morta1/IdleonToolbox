import { useContext, useEffect, useRef } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { useOwnSave } from '@components/common/UploadPrompt';
import useProfileUpload, { HOUR_MS, isShown } from '@hooks/useProfileUpload';

// Re-uploads the player's own save by itself once the worker's gap has passed since the last upload, by hand or
// automatic. It looks again whenever a save arrives and whenever the tab is shown, so a save that landed in a hidden
// tab goes out on return. One try per gap: a failure waits for the next one. Renders nothing; mounted once.
const AutoUpload = () => {
  const { state } = useContext(AppContext);
  const own = useOwnSave();
  const { upload, autoUpload, autoHours, autoFailed, lastUpload, lastUploadAccess, lastUploadParticipation } = useProfileUpload();
  const busy = useRef(false);
  // The pets page "what if" changes the numbers the boards are built from.
  const simulating = (state?.simulatedCompanions?.length ?? 0) > 0;
  const since = Math.max(Number(lastUpload) || 0, autoFailed?.at ?? 0);
  // Only an upload by hand picks who sees the profile, so one has to exist first.
  const ready = own && autoUpload && autoHours > 0 && !simulating && isShown(lastUploadAccess);

  useEffect(() => {
    if (!ready) return;
    const attempt = () => {
      if (busy.current || document.visibilityState !== 'visible' || Date.now() - since < autoHours * HOUR_MS) return;
      busy.current = true;
      // The worker keeps the access it has stored; these are sent for its log only. Never with gem info.
      upload({ profileAccess: lastUploadAccess, leaderboardParticipation: lastUploadParticipation, removeGems: true, trigger: 'auto' })
        .catch(() => {})
        .finally(() => {
          busy.current = false;
        });
    };
    attempt();
    document.addEventListener('visibilitychange', attempt);
    return () => document.removeEventListener('visibilitychange', attempt);
  }, [ready, since, autoHours, state?.lastUpdated]);

  return null;
};

export default AutoUpload;
