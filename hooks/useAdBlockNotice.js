import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { useAdBlockStatus } from '@hooks/useAdBlockDetection';
import { trackEvent } from '@utility/analytics';
import {
  AD_BLOCK_NOTICE_KEY,
  EMPTY_NOTICE,
  askOpen,
  cancelAsk,
  decideSession,
  dismissAsk,
  needsDecision,
  readNotice,
  visit
} from '@utility/adBlockNotice';

// The ad-block ask's bookkeeping (Overlays board, "Keeping track"). Mounted once, in ProfileBanner,
// which every page renders. It all runs in effects: the export knows nothing of storage or the blocker.
// mantine runs a functional update twice (once for its state, once for the sync event), so every
// updater here is pure and the GA calls stay outside them.
const useAdBlockNotice = ({ slotTaken }) => {
  const { state, dispatch } = useContext(AppContext);
  const router = useRouter();
  const status = useAdBlockStatus();
  const [stored, setStored] = useLocalStorage({ key: AD_BLOCK_NOTICE_KEY, defaultValue: EMPTY_NOTICE });
  const record = readNotice(stored);
  const answered = useRef(false);
  const [pageChanged, setPageChanged] = useState(false);
  const shownSent = useRef(false);
  const open = status === 'blocked' && askOpen(record);
  const show = pageChanged && open && !slotTaken;

  // A page load. Read straight from storage: the hook's own value is still the default here.
  useEffect(() => {
    const now = Date.now();
    const current = readNotice(readLocalStorageValue({ key: AD_BLOCK_NOTICE_KEY }));
    setStored(visit(current, now));
    // The old popup's key, which nothing reads any more.
    try {
      localStorage.removeItem('adBlockWarning');
    } catch {
      // storage blocked
    }
  }, []);

  // Once per page load, when the blocker has answered and the account (so the identity banner) is known. The
  // session is decided by the record, not by this page load: a first page that reloaded before the answer (a wiki
  // redirect) leaves it to the next one. adblock_detected stays once a session, sent by the page that decides it.
  useEffect(() => {
    if (answered.current || status === 'unknown' || state?.isLoading) return;
    answered.current = true;
    const blocked = status === 'blocked';
    const current = readNotice(readLocalStorageValue({ key: AD_BLOCK_NOTICE_KEY }));
    if (blocked && needsDecision(current)) trackEvent('adblock_detected');
    if (!blocked && record.blocked) trackEvent('adblock_disabled');
    const now = Date.now();
    setStored((value) => {
      const next = { ...readNotice(value), blocked };
      return needsDecision(next) ? decideSession(next, { slotTaken, now }) : next;
    });
  }, [status, state?.isLoading]);

  // An identity banner took the band: the ask waits for the next session, so it never swaps in
  // for one that just went away (Turn off on the simulation does not bring it).
  useEffect(() => {
    if (slotTaken && askOpen(record)) setStored((value) => cancelAsk(readNotice(value)));
  }, [slotTaken, record.ask, record.sessions]);

  // Only on a page change, never into a page already on screen (detection answers about 0.75 s
  // after load and the export cannot hold the band). Every change also keeps the session alive.
  useEffect(() => {
    let path = window.location.pathname;
    const onChange = (url) => {
      const next = new URL(url, window.location.origin).pathname;
      const now = Date.now();
      setStored((value) => ({ ...readNotice(value), lastSeen: now }));
      if (open && next !== path) setPageChanged(true);
      path = next;
    };
    router.events.on('routeChangeComplete', onChange);
    return () => router.events.off('routeChangeComplete', onChange);
  }, [router.events, open]);

  // Once per page load in which the line appears; the band shows no ask on the landing page.
  useEffect(() => {
    if (!show || router.pathname === '/' || shownSent.current) return;
    shownSent.current = true;
    trackEvent('adblock_notice_shown');
  }, [show, router.pathname]);

  // The band reads this flag through useProfileBannerState, as do the nav drawer spacer and the
  // leaderboards bar.
  useEffect(() => {
    if (Boolean(state?.adBlockAsk) !== show) dispatch({ type: 'data', data: { adBlockAsk: show } });
  }, [show, state?.adBlockAsk]);

  const dismiss = () => {
    trackEvent('adblock_notice_dismissed');
    const now = Date.now();
    setStored((value) => dismissAsk(readNotice(value), now));
  };

  return { dismiss };
};

export default useAdBlockNotice;
