// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, gtag, trackEvent, trackPageView } from '@utility/analytics';

const entries = () => window.dataLayer.map((args) => Array.from(args));

beforeEach(() => {
  delete window.dataLayer;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('gtag', () => {
  it('queues onto the dataLayer without needing window.gtag to exist yet', () => {
    expect(window.gtag).toBeUndefined();

    gtag('event', 'save_imported', { import_source: 'manual' });

    expect(entries()).toEqual([['event', 'save_imported', { import_source: 'manual' }]]);
  });

  it('keeps commands already queued by the inline snippet', () => {
    window.dataLayer = [['js', 'a-date']];

    trackEvent('import_failed', { import_source: 'profile' });

    expect(entries()).toHaveLength(2);
    expect(entries()[1]).toEqual(['event', 'import_failed', { import_source: 'profile' }]);
  });
});

describe('trackPageView', () => {
  it('reads the title a tick late, after next/head has swapped it', () => {
    document.title = 'Previous Page | Idleon Toolbox';

    trackPageView('/construction');
    // The title lands in a commit effect that can run after routeChangeComplete.
    document.title = 'Construction | Idleon Toolbox';
    vi.runAllTimers();

    const [command, name, params] = entries()[0];
    expect([command, name]).toEqual(['event', 'page_view']);
    expect(params.page_title).toBe('Construction | Idleon Toolbox');
    expect(params.page_path).toBe('/construction');
  });

  it('fires on a timer rather than a frame, so a background tab still reports', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');

    trackPageView('/dashboard');
    vi.runAllTimers();

    expect(raf).not.toHaveBeenCalled();
    expect(entries()).toHaveLength(1);
  });
});

describe('errorMessage', () => {
  it('caps at the 100 char GA param limit', () => {
    expect(errorMessage(new Error('x'.repeat(200)))).toHaveLength(100);
  });

  it('falls back to the value itself when there is no message', () => {
    expect(errorMessage('boom')).toBe('boom');
  });
});
