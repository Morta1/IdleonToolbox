/**
 * GA4 helpers.
 *
 * Commands are pushed onto the dataLayer rather than called through window.gtag: the inline snippet
 * that defines window.gtag is injected afterInteractive, so anything firing during hydration would
 * hit an undefined gtag and be lost. Queued commands are replayed once gtag.js loads.
 */
export const gtag = function () {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
};

export const trackEvent = (name, params) => gtag('event', name, params);

const LEADERBOARDS_PATH = '/leaderboards';
// A searched player's name and an open board are page state, not pages: the name must never reach GA
// and the drawer opening or closing is not a visit.
const LEADERBOARDS_STATE_PARAMS = ['player', 'm'];
let lastSentUrl = null;

/**
 * The URL to report for a navigation, or null to report nothing. Every route is reported as is except
 * /leaderboards, which loses its player and m params and is skipped when that leaves it equal to the
 * last URL reported (a drawer or a player search on the same tab).
 */
export const pageViewUrl = (url, lastSent = null) => {
  const parsed = new URL(url, 'http://localhost');
  if (parsed.pathname.replace(/\/$/, '') !== LEADERBOARDS_PATH) return url;
  LEADERBOARDS_STATE_PARAMS.forEach((param) => parsed.searchParams.delete(param));
  const stripped = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  return stripped === lastSent ? null : stripped;
};

/**
 * send_page_view is off in the config, so every page_view - including the first - comes from here.
 * The title is read a tick late because next/head writes document.title in a commit effect that can
 * land after routeChangeComplete, which used to report the previous page's title. setTimeout rather
 * than requestAnimationFrame: a tab opened in the background never gets a frame, so a link opened
 * from Discord would not report a page_view until the user got around to focusing it.
 */
export const trackPageView = (url) => {
  if (typeof window === 'undefined') return;
  const sent = pageViewUrl(url, lastSentUrl);
  if (sent === null) return;
  lastSentUrl = sent;
  setTimeout(() => {
    trackEvent('page_view', {
      page_path: sent,
      page_title: document.title,
      page_location: sent === url ? window.location.href : new URL(sent, window.location.origin).href
    });
  });
};

// GA drops event params over 100 chars, and a stack-laden message is useless in a report anyway.
export const errorMessage = (error) => String(error?.message || error).slice(0, 100);
