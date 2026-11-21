import { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { errorMessage } from '@utility/analytics';

export const HOUR_MS = 60 * 60 * 1000;
// Until the worker has answered once, the gap between automatic uploads it starts with.
export const DEFAULT_AUTO_HOURS = 6;
export const isShown = (access) => access === 'public' || access === 'anonymous';
// The worker's gap in words: "every 6 hours", "every hour".
export const everyHours = (hours) => (hours === 1 ? 'every hour' : `every ${hours} hours`);

const track = (params) => {
  if (typeof window.gtag !== 'undefined') window.gtag('event', 'profile_uploaded', { event_category: 'engagement', ...params });
};

// What this browser remembers about the account's uploads, and the one way to send one: Settings, the join card and the
// automatic upload all go through upload(), so they keep the same notes.
const useProfileUpload = () => {
  const { state } = useContext(AppContext);
  const uid = state?.uid;
  const [lastUpload, setLastUpload] = useLocalStorage({ key: `${uid}/lastUpload` });
  const [lastUploadAccess, setLastUploadAccess] = useLocalStorage({ key: `${uid}/lastUploadAccess` });
  const [lastUploadParticipation, setLastUploadParticipation] = useLocalStorage({ key: `${uid}/lastUploadParticipation` });
  // 'auto' when the last upload was the site's own.
  const [lastUploadTrigger, setLastUploadTrigger] = useLocalStorage({ key: `${uid}/lastUploadTrigger` });
  const [anonId, setAnonId, removeAnonId] = useLocalStorage({ key: `${uid}/anonId` });
  // 'on' once the player turned automatic upload on in this browser.
  const [autoUpload, setAutoUpload] = useLocalStorage({ key: `${uid}/autoUpload` });
  // The worker's gap between automatic uploads, from its last answer. 0: it has switched them off.
  const [autoHours, setAutoHours] = useLocalStorage({ key: 'data:autoUploadHours' });
  // The last automatic upload that failed, { kind, at }: one try per gap, so a failure waits for the next one.
  const [autoFailed, setAutoFailed, removeAutoFailed] = useLocalStorage({ key: `${uid}/autoUploadFailed` });
  // Whether the server shows a profile for the account ('yes' or 'no'), asked once per browser (UploadPrompt).
  const [shown, setShown] = useLocalStorage({ key: `${uid}/profileShown` });

  const upload = async ({ profileAccess, leaderboardParticipation, removeGems = true, trigger = 'manual' }) => {
    try {
      const { sendProfile } = await import('@utility/profileUpload');
      const result = await sendProfile({
        account: state?.account, characters: state?.characters, accessToken: state?.accessToken,
        profileAccess, leaderboardParticipation, removeGems, trigger
      });
      if (Number.isFinite(result?.autoUploadHours)) setAutoHours(result.autoUploadHours);
      setLastUpload(Date.now());
      setLastUploadTrigger(trigger);
      removeAutoFailed();
      // An automatic upload keeps what the server stores, so the notes of the last upload by hand still hold.
      if (trigger !== 'auto') {
        if (result?.anonId) setAnonId(result.anonId);
        else removeAnonId();
        setLastUploadAccess(profileAccess);
        setLastUploadParticipation(leaderboardParticipation);
        setShown(isShown(profileAccess) ? 'yes' : 'no');
      }
      track({
        event_label: 'success', upload_status: 'success', upload_trigger: trigger, profile_access: profileAccess,
        leaderboard: leaderboardParticipation, value: 1
      });
      return result;
    } catch (err) {
      if (Number.isFinite(err?.hours)) setAutoHours(err.hours);
      if (trigger === 'auto') setAutoFailed({ kind: err?.kind ?? 'client', at: Date.now() });
      track({
        event_label: 'failure', upload_status: 'failure', upload_trigger: trigger, upload_error: err?.kind ?? 'client',
        value: 0, error_message: errorMessage(err)
      });
      throw err;
    }
  };

  return {
    upload, lastUpload, lastUploadAccess, lastUploadParticipation, lastUploadTrigger, anonId,
    autoUpload: autoUpload === 'on', setAutoUpload: (on) => setAutoUpload(on ? 'on' : 'off'),
    autoHours: Number.isFinite(autoHours) ? autoHours : DEFAULT_AUTO_HOURS, setAutoHours,
    autoFailed: autoFailed ?? null,
    shown, setShown
  };
};

export default useProfileUpload;
