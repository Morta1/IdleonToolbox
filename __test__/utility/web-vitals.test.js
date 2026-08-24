// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listeners = {};
vi.mock('web-vitals/attribution', () => ({
  onCLS: (cb) => (listeners.CLS = cb),
  onFCP: (cb) => (listeners.FCP = cb),
  onINP: (cb) => (listeners.INP = cb),
  onLCP: (cb) => (listeners.LCP = cb),
  onTTFB: (cb) => (listeners.TTFB = cb)
}));

const { metricParams, metricValue, reportWebVitals, resetWebVitalsForTests } =
  await import('../../utility/web-vitals');

const lcp = (attribution = {}) => ({
  name: 'LCP',
  value: 4612.4,
  rating: 'poor',
  id: 'v4-1',
  navigationType: 'navigate',
  attribution: { element: 'main>div.hero', timeToFirstByte: 210.6, elementRenderDelay: 3900.2, ...attribution }
});

beforeEach(() => {
  window.dataLayer = [];
  resetWebVitalsForTests();
});

describe('metricValue', () => {
  it('rounds a millisecond metric to an integer, which is all GA4 accepts', () => {
    expect(metricValue({ name: 'LCP', value: 4612.4 })).toBe(4612);
  });

  // CLS is a unitless fraction, so an unscaled 0.13 would round to 0 and every report would read zero.
  it('scales CLS by 1000 so the 0.1 threshold survives as an integer', () => {
    expect(metricValue({ name: 'CLS', value: 0.13 })).toBe(130);
    expect(metricValue({ name: 'CLS', value: 0.0004 })).toBe(0);
  });
});

describe('metricParams', () => {
  it('names the element that painted last - the thing Search Console never tells us', () => {
    expect(metricParams(lcp(), '/account/world-1/stamps')).toMatchObject({
      metric_name: 'LCP',
      metric_value: 4612,
      metric_rating: 'poor',
      metric_navigation_type: 'navigate',
      page_path: '/account/world-1/stamps',
      debug_target: 'main>div.hero',
      lcp_ttfb: 211,
      lcp_element_render_delay: 3900
    });
  });

  it('reports the shifting node for CLS under the same debug_target dimension', () => {
    const params = metricParams({
      name: 'CLS',
      value: 0.38,
      rating: 'poor',
      id: 'v4-2',
      attribution: { largestShiftTarget: '#tesseract-grid', largestShiftValue: 0.31, loadState: 'dom-interactive' }
    }, '/account/class-specific/tesseract');

    expect(params).toMatchObject({
      metric_value: 380,
      debug_target: '#tesseract-grid',
      cls_largest_shift_value: 310,
      cls_load_state: 'dom-interactive'
    });
  });

  it('reports the interaction target for INP', () => {
    const params = metricParams({
      name: 'INP',
      value: 240,
      id: 'v4-3',
      attribution: { interactionTarget: 'button.nav', interactionType: 'pointer', inputDelay: 12.7 }
    }, '/');

    expect(params).toMatchObject({ debug_target: 'button.nav', inp_interaction_type: 'pointer', inp_input_delay: 13 });
  });

  it('truncates a selector to the 100 chars GA4 keeps, instead of losing the param entirely', () => {
    const params = metricParams(lcp({ element: `div.${'a'.repeat(200)}` }), '/');

    expect(params.debug_target).toHaveLength(100);
  });

  // Observed live: when the largest paint is a background image, `element` comes back as ''.
  // Keeping it would spend a param slot on a blank row that reads as "measured, unknown".
  it('treats a blank element as absent, which is what a background-image LCP reports', () => {
    const params = metricParams(lcp({ element: '', url: 'https://idleontoolbox.com/etc/bg_4.png' }), '/');

    expect(params).not.toHaveProperty('debug_target');
    expect(params.lcp_url).toBe('https://idleontoolbox.com/etc/bg_4.png');
  });

  // An explicit undefined still counts against the 25-param ceiling and shows as an empty row.
  it('omits attribution the browser did not supply', () => {
    const params = metricParams({ name: 'LCP', value: 1000, id: 'v4-4', attribution: {} }, '/');

    expect(params).not.toHaveProperty('debug_target');
    expect(params).not.toHaveProperty('lcp_url');
  });

  it('survives a metric with no attribution object at all', () => {
    expect(() => metricParams({ name: 'LCP', value: 1000, id: 'v4-5' }, '/')).not.toThrow();
  });
});

describe('reportWebVitals', () => {
  it('subscribes to all five metrics and sends each as a web_vitals event', async () => {
    await reportWebVitals();

    expect(Object.keys(listeners).sort()).toEqual(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);

    listeners.LCP(lcp());
    const [command, name, params] = Array.from(window.dataLayer[0]);
    expect([command, name]).toEqual(['event', 'web_vitals']);
    expect(params).toMatchObject({ metric_name: 'LCP', debug_target: 'main>div.hero' });
  });

  it('attaches once, so a remount cannot double-count every metric', async () => {
    await reportWebVitals();
    const first = listeners.LCP;
    await reportWebVitals();

    expect(listeners.LCP).toBe(first);
  });
});
