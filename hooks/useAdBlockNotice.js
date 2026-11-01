import { useContext, useEffect, useRef } from 'react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { useAdBlockStatus } from '@hooks/useAdBlockDetection';
import { trackEvent } from '@utility/analytics';
import { AD_BLOCK_NOTICE_KEY, EMPTY_NOTICE, decideSession, isNewSession, readNotice, visit } from '@utility/adBlockNotice';

// The ad-block ask's bookkeeping (Overlays board, "Keeping track"). Mounted once, in ProfileBanner,
// which every page renders. It all runs in effects: the export knows nothing of storage or the blocker.
const useAdBlockNotice = ({ slotTaken }) => {
  const { state } = useContext(AppContext);
  const status = useAdBlockStatus();
  const [stored, setStored] = useLocalStorage({ key: AD_BLOCK_NOTICE_KEY, defaultValue: EMPTY_NOTICE });
  const record = readNotice(stored);
  const newSession = useRef(false);
  const answered = useRef(false);

  // A page load. Read straight from storage: the hook's own value is still the default here.
  useEffect(() => {
    const now = Date.now();
    const current = readNotice(readLocalStorageValue({ key: AD_BLOCK_NOTICE_KEY }));
    newSession.current = isNewSession(current, now);
    setStored(visit(current, now));
  }, []);

  // Once per page load, when the blocker has answered and the account (so the identity banner) is known.
  useEffect(() => {
    if (answered.current || status === 'unknown' || state?.isLoading) return;
    answered.current = true;
    const blocked = status === 'blocked';
    if (blocked && newSession.current) trackEvent('adblock_detected');
    if (!blocked && record.blocked) trackEvent('adblock_disabled');
    const now = Date.now();
    setStored((value) => {
      const next = { ...readNotice(value), blocked };
      return newSession.current ? decideSession(next, { slotTaken, now }) : next;
    });
  }, [status, state?.isLoading]);

  return record;
};

export default useAdBlockNotice;
