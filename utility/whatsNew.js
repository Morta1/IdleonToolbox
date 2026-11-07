import { readLocalStorageValue } from '@mantine/hooks';
import { getCookieConsentValue } from 'react-cookie-consent';
import { AUTH_HINT_KEY } from '@utility/auth-hint';
import { GOALS_STORAGE_KEY } from '@utility/goals/store';

// The redesign's one-time What's new story: the one written exception to "Nothing opens by itself". Returning visitors,
// once per browser, for two weeks. Everything here runs from effects: nothing reads storage on the first render.
export const WHATS_NEW_KEY = 'whatsNew';
export const WHATS_NEW_SHOWN = 'shown';
export const WHATS_NEW_SKIPPED = 'skipped';

// A hard end, two weeks after the release: after it nothing shows, with no deploy.
export const WHATS_NEW_UNTIL = '2026-11-21T00:00:00Z';

// A test or the kit (tools/page-check.mjs --whats-new) opens the window, and lets it open on the demo for shots.
const override = () => (typeof window === 'undefined' ? undefined : window.__whatsNewKit);
const isOver = (now) => !(now < Date.parse(override()?.until ?? WHATS_NEW_UNTIL));

const read = (key) => readLocalStorageValue({ key });

const save = (value) => {
  try {
    localStorage.setItem(WHATS_NEW_KEY, JSON.stringify(value));
  } catch {
    // A full or blocked storage: claimWhatsNew reads back and finds nothing, so nothing opens.
  }
};

const hasGoals = (blob) => Object.values(blob?.accounts ?? {}).some((list) => list?.length > 0);

export const isRegular = () => read(AUTH_HINT_KEY) === 'yes' || read('manualImport') === true
  || read('pinnedPages')?.length > 0 || hasGoals(read(GOALS_STORAGE_KEY));

// Once, at page start, ahead of sign-in: Settings' Clear wipes storage and leaves the session, and the session would write
// authHint back and make a regular of whoever just cleared. The gate's effect runs before AppProvider's, its parent's.
// True: a regular who hasn't had it, on a page where it may open. Past the end nothing is written, so a visit before the
// release leaves no mark on the visit after it.
export const startWhatsNew = (now = Date.now()) => {
  if (isOver(now) || read(WHATS_NEW_KEY)) return false;
  if (!isRegular()) {
    save(WHATS_NEW_SKIPPED);
    return false;
  }
  const query = new URLSearchParams(window.location.search);
  return Boolean(override()?.anyView) || !(query.has('demo') || query.has('profile'));
};

let triedThisLoad = false;

// The last step before the story. Never twice in a page load, whatever storage says, and only once the mark is really
// there, so a browser that can't keep it never sees the story twice. A second tab that got there first has left its mark.
export const claimWhatsNew = (now = Date.now()) => {
  if (triedThisLoad) return false;
  triedThisLoad = true;
  if (isOver(now) || read(WHATS_NEW_KEY)) return false;
  save(WHATS_NEW_SHOWN);
  return read(WHATS_NEW_KEY) === WHATS_NEW_SHOWN;
};

const replayListeners = new Set();
export const subscribeWhatsNewReplay = (listener) => {
  replayListeners.add(listener);
  return () => replayListeners.delete(listener);
};

// The patch note's link, for whoever closed it early or never got it. Only ever a click, so the end date doesn't stop it.
// Starting it by hand before it opened by itself counts as having had it, or it would follow them straight after.
export const replayWhatsNew = () => {
  if (!read(WHATS_NEW_KEY)) save(WHATS_NEW_SHOWN);
  replayListeners.forEach((listener) => listener());
};

// An ad blocker keeps Nitro away, and with it the only thing that knows the region: no banner ever comes. Nitro answers
// well inside this, so past it nothing is on its way.
export const NO_BANNER_AFTER_MS = 10000;
const CHECK_MS = 500;
const CMP_ANSWERED = ['tcloaded', 'useractioncomplete'];

// Whether the consent banner can still meet the story. Someone who hasn't answered it doesn't get the story yet: the
// site's own banner sets a cookie, and the EU's consent window (Nitro's, through __tcfapi) reports its own answer.
const consentChecker = () => {
  let cmpAnswered = false;
  let listening = false;
  return (elapsed) => {
    if (getCookieConsentValue('idleon-consent') !== undefined) return true;
    if (document.querySelector('.CookieConsent')) return false;
    if (!window.nitroAds?.loaded) return elapsed >= NO_BANNER_AFTER_MS;
    // Nitro is in and there is no consent window: this is the site's own banner's region, and it's on its way.
    if (!window.__tcfapi) return false;
    if (!listening) {
      listening = true;
      window.__tcfapi('addEventListener', 2, (data, success) => {
        if (success && CMP_ANSWERED.includes(data?.eventStatus)) cmpAnswered = true;
      });
    }
    return cmpAnswered;
  };
};

// Calls onFree once the tab is visible and the banner is out of the way, on its own timer. Returns the way to stop waiting.
export const whenPageIsFree = (onFree) => {
  const settled = consentChecker();
  let timer = null;
  const stop = () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', check);
  };
  const check = () => {
    if (document.visibilityState !== 'visible' || !settled(performance.now())) return;
    stop();
    onFree();
  };
  document.addEventListener('visibilitychange', check);
  timer = setInterval(check, CHECK_MS);
  check();
  return stop;
};

// Which menu the tour's theme stop holds open ('user', 'footer' or null): UserMenu and ThemeLink read it where they live.
let tourMenu = null;
const tourMenuListeners = new Set();
export const getTourMenu = () => tourMenu;
export const setTourMenu = (menu) => {
  tourMenu = menu;
  tourMenuListeners.forEach((listener) => listener());
};
export const subscribeTourMenu = (listener) => {
  tourMenuListeners.add(listener);
  return () => tourMenuListeners.delete(listener);
};
