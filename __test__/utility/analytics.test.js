// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, gtag, pageViewUrl, trackEvent, trackPageView } from '@utility/analytics';

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

describe('pageViewUrl', () => {
  it('strips player and m from a leaderboards deep link, keeping the rest', () => {
    expect(pageViewUrl('/leaderboards?t=Skills&m=mining&player=X')).toBe('/leaderboards?t=Skills');
    expect(pageViewUrl('/leaderboards?player=Some%20Name')).toBe('/leaderboards');
    expect(pageViewUrl('/leaderboards?m=mining&t=Skills&v=2#top')).toBe('/leaderboards?t=Skills&v=2#top');
    expect(pageViewUrl('/leaderboards/?player=X')).toBe('/leaderboards/');
  });

  it('skips a change that only opens or closes a drawer, or searches a player', () => {
    expect(pageViewUrl('/leaderboards?t=Skills&m=mining', '/leaderboards?t=Skills')).toBeNull();
    expect(pageViewUrl('/leaderboards?t=Skills', '/leaderboards?t=Skills')).toBeNull();
    expect(pageViewUrl('/leaderboards?t=Skills&player=X', '/leaderboards?t=Skills')).toBeNull();
  });

  it('still reports a tab change', () => {
    expect(pageViewUrl('/leaderboards?t=Tasks&m=x', '/leaderboards?t=Skills')).toBe('/leaderboards?t=Tasks');
    expect(pageViewUrl('/leaderboards', '/leaderboards?t=Skills')).toBe('/leaderboards');
  });

  it('reports a first visit and a return from another page', () => {
    expect(pageViewUrl('/leaderboards?t=Skills', null)).toBe('/leaderboards?t=Skills');
    expect(pageViewUrl('/leaderboards?t=Skills', '/construction')).toBe('/leaderboards?t=Skills');
  });

  it('leaves every other route exactly as it was, params included', () => {
    expect(pageViewUrl('/account/misc/general?profile=Baker&player=X&m=1')).toBe('/account/misc/general?profile=Baker&player=X&m=1');
    expect(pageViewUrl('/construction?player=X', '/construction?player=X')).toBe('/construction?player=X');
    expect(pageViewUrl('/leaderboards-old?player=X')).toBe('/leaderboards-old?player=X');
  });
});

describe('trackPageView on leaderboards', () => {
  it('sends the stripped path and location, and nothing for drawer-only changes', () => {
    trackPageView('/construction');
    trackPageView('/leaderboards?t=Skills&m=mining&player=X');
    trackPageView('/leaderboards?t=Skills');
    trackPageView('/leaderboards?t=Skills&m=farming');
    trackPageView('/leaderboards?t=Tasks');
    vi.runAllTimers();

    const views = entries().filter(([, name]) => name === 'page_view').map(([, , params]) => params);
    expect(views.map((view) => view.page_path)).toEqual(['/construction', '/leaderboards?t=Skills', '/leaderboards?t=Tasks']);
    expect(views[1].page_location).toBe(`${window.location.origin}/leaderboards?t=Skills`);
    expect(JSON.stringify(window.dataLayer)).not.toContain('player=');
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
