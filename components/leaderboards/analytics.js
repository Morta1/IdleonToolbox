import { safePageLocation, trackEvent } from '@utility/analytics';

export const PRODUCTION_HOST = 'idleontoolbox.com';

export const isProductionHost = (hostname) => hostname === PRODUCTION_HOST;

// The redesign is tested on Vercel previews and localhost before it ships; their clicks must not
// land in the reports used to judge it.
// Child effects run before _app's, so a URL-entry event can beat the default page_location it sets:
// every event carries its own stripped location.
export const leaderboardEventParams = (params, href) => ({ ...params, page_location: safePageLocation(href) });

export const trackLeaderboardEvent = (name, params) => {
  if (typeof window === 'undefined' || !isProductionHost(window.location.hostname)) return;
  trackEvent(name, leaderboardEventParams(params, window.location.href));
};
