import { useSyncExternalStore } from 'react';
import { NO_GUEST_NUMBERS, routeNeedsAccount } from './account-routes';
import { AUTH_HINT_KEY } from './auth-hint';

// The notice band arrives once the app knows who is visiting, which the export can't know. So a script holds the band's
// 40 px from before the first paint, on <html>, where no render can mismatch; ProfileBanner's empty slot opens on that.
export const BAND_SLOT_ATTR = 'data-band-slot';

// useProfileBannerState's rule, for the moment before the app runs: where the hook reads state, this reads the URL and
// the sign-in hint. The route's half is settled at the build, per exported page, from the lists the hook reads too.
// `route` is the page's pattern (__NEXT_DATA__.page), which is router.pathname. A hint of yes holds nothing, so a signed-in
// player never sees a gap; storage that throws reads as absent, a first visit.
export const bandSlotScript = (route) => {
  if (route === '/') return null;
  const account = routeNeedsAccount(route);
  const guest = account && !NO_GUEST_NUMBERS.has(route);
  return `(function(){var q=new URLSearchParams(location.search),h=null;try{h=localStorage.getItem(${JSON.stringify(AUTH_HINT_KEY)})}catch(e){}`
    + `if(q.get("profile")||(${account}&&q.get("demo"))||(${guest}&&h!=="yes"))document.documentElement.setAttribute(${JSON.stringify(BAND_SLOT_ATTR)},"")})()`;
};

const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const isHeld = () => document.documentElement.hasAttribute(BAND_SLOT_ATTR);

export const releaseBandSlot = () => {
  if (!isHeld()) return;
  document.documentElement.removeAttribute(BAND_SLOT_ATTR);
  listeners.forEach((listener) => listener());
};

// False on the first render, as the export knows nothing of it, then what <html> says.
export const useBandSlotHeld = () => useSyncExternalStore(subscribe, isHeld, () => false);
