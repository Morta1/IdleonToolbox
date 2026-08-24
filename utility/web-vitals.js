/**
 * Core Web Vitals reporting, with attribution.
 *
 * Search Console only says a URL group is slow. It never says which element painted last or which
 * node shifted, so every fix is a guess until this data exists. The `web-vitals/attribution` build
 * carries that detail; the plain build does not, which is also why Next's own `reportWebVitals`
 * hook is not enough here.
 *
 * Everything lands as one `web_vitals` event with a `metric_name` param rather than five differently
 * shaped events, so a single set of GA4 custom dimensions covers all of them.
 */
import { trackEvent } from './analytics';

/**
 * GA4 silently drops string params over 100 chars, and a CSS selector can run much longer.
 *
 * Blank counts as absent: when the largest paint is a background image the browser reports an
 * element of '', and an empty param is worse than no param - it spends one of the 25 slots and
 * shows up as an empty row rather than an obviously missing one.
 */
const truncate = (value) => {
  const text = value == null ? '' : String(value).trim();
  return text ? text.slice(0, 100) : undefined;
};

const round = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined);

/**
 * GA4 rejects a non-integer `value`. CLS is a unitless fraction, so it goes out multiplied by 1000
 * - the same convention Google's own web-vitals-to-GA4 recipe uses, so the 0.1 / 0.25 thresholds
 * read as 100 / 250 in reports.
 */
export const metricValue = ({ name, value }) => Math.round(name === 'CLS' ? value * 1000 : value);

// `debug_target` is deliberately one shared param name across LCP, CLS and INP: it answers "which
// element" for all three, so it needs registering as a single GA4 custom dimension rather than three.
const attributionParams = ({ name, attribution = {} }) => {
  if (name === 'LCP') {
    return {
      debug_target: truncate(attribution.element),
      lcp_url: truncate(attribution.url),
      lcp_ttfb: round(attribution.timeToFirstByte),
      lcp_resource_load_delay: round(attribution.resourceLoadDelay),
      lcp_resource_load_duration: round(attribution.resourceLoadDuration),
      lcp_element_render_delay: round(attribution.elementRenderDelay)
    };
  }
  if (name === 'CLS') {
    return {
      debug_target: truncate(attribution.largestShiftTarget),
      cls_largest_shift_value: round(attribution.largestShiftValue * 1000),
      cls_largest_shift_time: round(attribution.largestShiftTime),
      cls_load_state: truncate(attribution.loadState)
    };
  }
  if (name === 'INP') {
    return {
      debug_target: truncate(attribution.interactionTarget),
      inp_interaction_type: truncate(attribution.interactionType),
      inp_input_delay: round(attribution.inputDelay),
      inp_processing_duration: round(attribution.processingDuration),
      inp_presentation_delay: round(attribution.presentationDelay),
      inp_load_state: truncate(attribution.loadState)
    };
  }
  if (name === 'FCP') {
    return {
      fcp_ttfb: round(attribution.timeToFirstByte),
      fcp_first_byte_to_fcp: round(attribution.firstByteToFCP),
      fcp_load_state: truncate(attribution.loadState)
    };
  }
  if (name === 'TTFB') {
    return {
      ttfb_waiting: round(attribution.waitingDuration),
      ttfb_cache: round(attribution.cacheDuration),
      ttfb_dns: round(attribution.dnsDuration),
      ttfb_connection: round(attribution.connectionDuration),
      ttfb_request: round(attribution.requestDuration)
    };
  }
  return {};
};

/**
 * `pagePath` is the path captured when the listeners were attached, not the one live at send time.
 * These are page-load metrics that flush when the page is hidden, so on a client-routed app the
 * live path is whatever the visitor drifted to by then. CrUX attributes a metric to the URL of the
 * initial navigation, so matching that is what makes this data comparable to the Search Console
 * report it exists to explain.
 */
export const metricParams = (metric, pagePath) => {
  const params = {
    metric_name: metric.name,
    metric_value: metricValue(metric),
    metric_rating: metric.rating,
    // Unique per page load: lets a report count distinct loads instead of summing repeat deliveries.
    metric_id: metric.id,
    // A back-forward restore skews every timing, and prerender skews LCP. Without this the two are
    // indistinguishable from a genuinely fast load.
    metric_navigation_type: metric.navigationType,
    page_path: truncate(pagePath),
    ...attributionParams(metric)
  };

  // GA4 records an explicit undefined as a param; dropping them keeps the event within its 25-param
  // ceiling and keeps reports free of empty rows.
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
};

let attached = false;

/**
 * Loaded dynamically on purpose: the attribution build is the larger of the two, and pulling it
 * into the entry chunk would slow the very LCP it is here to measure.
 */
export const reportWebVitals = async () => {
  if (typeof window === 'undefined' || attached) return;
  attached = true;

  const pagePath = window.location.pathname;
  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals/attribution');
  const send = (metric) => trackEvent('web_vitals', metricParams(metric, pagePath));

  [onCLS, onFCP, onINP, onLCP, onTTFB].forEach((on) => on(send));
};

// Tests attach in a fresh module registry per file; this keeps a single suite from leaking state.
export const resetWebVitalsForTests = () => {
  attached = false;
};
