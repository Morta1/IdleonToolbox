import { trackEvent } from '@utility/analytics';

export const PRODUCTION_HOST = 'idleontoolbox.com';

export const isProductionHost = (hostname) => hostname === PRODUCTION_HOST;

// The redesign is tested on Vercel previews and localhost before it ships; their clicks must not
// land in the reports used to judge it.
export const trackLeaderboardEvent = (name, params) => {
  if (typeof window === 'undefined' || !isProductionHost(window.location.hostname)) return;
  trackEvent(name, params);
};
