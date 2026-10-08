// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, gtag, pageViewUrl, safePageLocation, stripLeaderboardsState, trackEvent, trackPageView } from '@utility/analytics';

const entries = () => window.dataLayer.map((args) => Array.from(args));
const pageViews = () => entries().filter(([command, name]) => command === 'event' && name === 'page_view');

beforeEach(() => {
  delete window.dataLayer;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
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

    const [command, name, params] = pageViews()[0];
    expect([command, name]).toEqual(['event', 'page_view']);
    expect(params.page_title).toBe('Construction | Idleon Toolbox');
    expect(params.page_path).toBe('/construction');
  });

  it('fires on a timer rather than a frame, so a background tab still reports', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');

    trackPageView('/dashboard');
    vi.runAllTimers();

    expect(raf).not.toHaveBeenCalled();
    expect(pageViews()).toHaveLength(1);
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

describe('stripLeaderboardsState', () => {
  it('returns the stripped path, search and hash on leaderboards, with or without a trailing slash', () => {
    expect(stripLeaderboardsState('/leaderboards?t=Skills&m=mining&player=X#top')).toBe('/leaderboards?t=Skills#top');
    expect(stripLeaderboardsState('/leaderboards/?player=X')).toBe('/leaderboards/');
    expect(stripLeaderboardsState('https://idleontoolbox.com/leaderboards?player=X&v=2')).toBe('/leaderboards?v=2');
  });

  it('returns null for every other route', () => {
    expect(stripLeaderboardsState('/construction?player=X')).toBeNull();
    expect(stripLeaderboardsState('/leaderboards-old?player=X')).toBeNull();
  });
});

describe('safePageLocation', () => {
  it('strips the params from an absolute leaderboards URL and keeps the origin and hash', () => {
    expect(safePageLocation('https://idleontoolbox.com/leaderboards?t=Skills&player=Some%20Name&m=a#x')).toBe('https://idleontoolbox.com/leaderboards?t=Skills#x');
  });

  it('returns any other URL untouched', () => {
    expect(safePageLocation('https://idleontoolbox.com/construction?player=X&m=1')).toBe('https://idleontoolbox.com/construction?player=X&m=1');
  });
});

describe('trackPageView default page_location', () => {
  const sets = () => entries().filter(([command]) => command === 'set').map(([, params]) => params);

  it('sets the stripped location on leaderboards, before the page_view timer fires', () => {
    window.history.replaceState(null, '', '/leaderboards?t=Skills&player=X&m=mining');

    trackPageView('/leaderboards?t=Skills&player=X&m=mining');

    expect(sets()).toEqual([{ page_location: `${window.location.origin}/leaderboards?t=Skills` }]);
    expect(JSON.stringify(window.dataLayer)).not.toContain('player=');
  });

  it('sets the real href on every other route, restoring normal behaviour after leaving leaderboards', () => {
    window.history.replaceState(null, '', '/leaderboards?player=X');
    trackPageView('/leaderboards?player=X');
    window.history.replaceState(null, '', '/account/misc/general?profile=Baker&player=X');

    trackPageView('/account/misc/general?profile=Baker&player=X');

    expect(sets().at(-1)).toEqual({ page_location: `${window.location.origin}/account/misc/general?profile=Baker&player=X` });
  });

  it('still sets it when the page_view is skipped for a drawer or a player search', () => {
    window.history.replaceState(null, '', '/leaderboards?t=Skills');
    trackPageView('/leaderboards?t=Skills');
    vi.runAllTimers();
    delete window.dataLayer;

    window.history.replaceState(null, '', '/leaderboards?t=Skills&player=Ghost');
    trackPageView('/leaderboards?t=Skills&player=Ghost');
    vi.runAllTimers();

    expect(entries().filter(([, name]) => name === 'page_view')).toEqual([]);
    expect(sets()).toEqual([{ page_location: `${window.location.origin}/leaderboards?t=Skills` }]);
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
