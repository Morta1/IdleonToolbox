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

/**
 * send_page_view is off in the config, so every page_view - including the first - comes from here.
 * The title is read a tick late because next/head writes document.title in a commit effect that can
 * land after routeChangeComplete, which used to report the previous page's title. setTimeout rather
 * than requestAnimationFrame: a tab opened in the background never gets a frame, so a link opened
 * from Discord would not report a page_view until the user got around to focusing it.
 */
export const trackPageView = (url) => {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    trackEvent('page_view', {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href
    });
  });
};

// GA drops event params over 100 chars, and a stack-laden message is useless in a report anyway.
export const errorMessage = (error) => String(error?.message || error).slice(0, 100);
