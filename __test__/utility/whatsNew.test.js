// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OPEN = { until: '2030-01-01T00:00:00Z' };
const NOW = Date.parse('2029-12-31T00:00:00Z');
const AFTER_END = Date.parse('2030-01-01T00:00:00Z');
const GOAL_BLOB = JSON.stringify({ schema: 1, accounts: { Tester: [{ id: 'a' }] } });
const EMPTY_GOALS = JSON.stringify({ schema: 1, accounts: { Tester: [] } });

const stored = () => localStorage.getItem('whatsNew');
const seed = (entries) => Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
// A new module is a new page load: the once-per-load guard lives in it.
const newPageLoad = async () => {
  vi.resetModules();
  return import('@utility/whatsNew');
};
const clearCookie = () => {
  document.cookie = 'idleon-consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
};

beforeEach(() => {
  localStorage.clear();
  window.__whatsNewKit = OPEN;
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  clearCookie();
  delete window.__whatsNewKit;
  delete window.nitroAds;
  delete window.__tcfapi;
  document.querySelectorAll('.CookieConsent').forEach((banner) => banner.remove());
});

describe('startWhatsNew: who is a regular, read at page start', () => {
  it.each([
    ['a session last visit', { authHint: 'yes' }],
    ['a pasted save', { manualImport: 'true' }],
    ['a pinned page', { pinnedPages: '[{"href":"/x"}]' }],
    ['a goal', { goals: GOAL_BLOB }]
  ])('%s makes a regular, and nothing is written until the dialog is claimed', async (_, signals) => {
    seed(signals);
    const { startWhatsNew } = await newPageLoad();
    expect(startWhatsNew(NOW)).toBe(true);
    expect(stored()).toBeNull();
  });

  it.each([
    ['nothing stored', {}],
    ['no session last visit', { authHint: 'no' }],
    ['no pasted save', { manualImport: 'false' }],
    ['an empty pin list', { pinnedPages: '[]' }],
    ['a goals blob with no goals', { goals: EMPTY_GOALS }]
  ])('%s is no regular, and is marked skipped for good', async (_, signals) => {
    seed(signals);
    const { startWhatsNew } = await newPageLoad();
    expect(startWhatsNew(NOW)).toBe(false);
    expect(stored()).toBe('"skipped"');
  });

  it('Settings\' Clear leaves the session, which writes authHint after the start: that never makes a regular', async () => {
    const first = await newPageLoad();
    expect(first.startWhatsNew(NOW)).toBe(false);
    seed({ authHint: 'yes' });
    const second = await newPageLoad();
    expect(second.startWhatsNew(NOW)).toBe(false);
  });

  it.each(['shown', 'skipped'])('a browser marked %s stays shut', async (mark) => {
    seed({ whatsNew: JSON.stringify(mark), authHint: 'yes' });
    const { startWhatsNew } = await newPageLoad();
    expect(startWhatsNew(NOW)).toBe(false);
  });

  it.each(['?demo=true', '?profile=Tester'])('%s keeps a regular waiting, unmarked, and marks a stranger', async (search) => {
    window.history.replaceState(null, '', `/dashboard${search}`);
    seed({ authHint: 'yes' });
    let page = await newPageLoad();
    expect(page.startWhatsNew(NOW)).toBe(false);
    expect(stored()).toBeNull();

    localStorage.clear();
    page = await newPageLoad();
    expect(page.startWhatsNew(NOW)).toBe(false);
    expect(stored()).toBe('"skipped"');
  });

  it('the kit may open it on the demo', async () => {
    window.history.replaceState(null, '', '/dashboard?demo=true');
    window.__whatsNewKit = { ...OPEN, anyView: true };
    seed({ authHint: 'yes' });
    const { startWhatsNew } = await newPageLoad();
    expect(startWhatsNew(NOW)).toBe(true);
  });
});

describe('the end date', () => {
  it('past the end nothing shows and nothing is written, so a visit before the release leaves no mark', async () => {
    seed({ authHint: 'yes' });
    const { startWhatsNew, claimWhatsNew } = await newPageLoad();
    expect(startWhatsNew(AFTER_END)).toBe(false);
    expect(claimWhatsNew(AFTER_END)).toBe(false);
    expect(stored()).toBeNull();
  });

  it('a tab left open across the end doesn\'t open it either', async () => {
    seed({ authHint: 'yes' });
    const { startWhatsNew, claimWhatsNew } = await newPageLoad();
    expect(startWhatsNew(NOW)).toBe(true);
    expect(claimWhatsNew(AFTER_END)).toBe(false);
  });

  it('the constant decides when nothing overrides it', async () => {
    delete window.__whatsNewKit;
    seed({ authHint: 'yes' });
    const { startWhatsNew, WHATS_NEW_UNTIL } = await newPageLoad();
    expect(startWhatsNew(Date.parse(WHATS_NEW_UNTIL))).toBe(false);
    expect(startWhatsNew(Date.parse(WHATS_NEW_UNTIL) - 1)).toBe(true);
  });
});

describe('claimWhatsNew: never repeat', () => {
  it.each([
    ['storage that keeps it', () => {}, true, '"shown"'],
    ['a full storage', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });
    }, false, null],
    ['storage that drops the write', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    }, false, null],
    ['a mark that reads back as something else', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => '"tampered"');
    }, false, null],
    ['storage blocked outright', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });
    }, false, null]
  ])('%s', async (_, arrange, opens, mark) => {
    const { claimWhatsNew } = await newPageLoad();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    arrange();
    expect(claimWhatsNew(NOW)).toBe(opens);
    vi.restoreAllMocks();
    expect(stored()).toBe(mark);
  });

  it('a page load claims once, whatever storage says after', async () => {
    const { claimWhatsNew } = await newPageLoad();
    expect(claimWhatsNew(NOW)).toBe(true);
    localStorage.clear();
    expect(claimWhatsNew(NOW)).toBe(false);
  });

  it('a failed claim isn\'t tried again in the same load', async () => {
    const { claimWhatsNew } = await newPageLoad();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    expect(claimWhatsNew(NOW)).toBe(false);
    setItem.mockRestore();
    expect(claimWhatsNew(NOW)).toBe(false);
  });

  it('a second tab that got there first has left its mark', async () => {
    const { startWhatsNew, claimWhatsNew } = await newPageLoad();
    seed({ authHint: 'yes' });
    expect(startWhatsNew(NOW)).toBe(true);
    seed({ whatsNew: '"shown"' });
    expect(claimWhatsNew(NOW)).toBe(false);
  });
});

describe('whenPageIsFree', () => {
  const banner = () => {
    const node = document.createElement('div');
    node.className = 'CookieConsent';
    document.body.append(node);
  };
  const answered = () => {
    document.cookie = 'idleon-consent=true; path=/';
  };
  const elapsed = (ms) => vi.spyOn(performance, 'now').mockReturnValue(ms);
  const cmp = (eventStatus, success = true) => {
    window.nitroAds = { loaded: true };
    window.__tcfapi = (command, version, callback) => callback({ eventStatus }, success);
  };

  it.each([
    ['an answered banner', answered, true],
    ['the banner on screen', banner, false],
    ['the banner on screen at any age', () => {
      banner();
      elapsed(60000);
    }, false],
    ['Nitro in and no consent window: the banner is on its way', () => {
      window.nitroAds = { loaded: true };
      elapsed(60000);
    }, false],
    ['Nitro still out, early', () => elapsed(1000), false],
    ['Nitro blocked: no banner ever comes', () => elapsed(10000), true],
    ['the consent window, answered before', () => cmp('tcloaded'), true],
    ['the consent window, answered now', () => cmp('useractioncomplete'), true],
    ['the consent window, on screen', () => cmp('cmpuishown'), false],
    ['the consent window, failed', () => cmp('tcloaded', false), false]
  ])('%s', async (_, arrange, free) => {
    const { whenPageIsFree } = await newPageLoad();
    arrange();
    const onFree = vi.fn();
    const stop = whenPageIsFree(onFree);
    stop();
    expect(onFree).toHaveBeenCalledTimes(free ? 1 : 0);
  });

  it('waits for a hidden tab, then the banner\'s answer, and calls once', async () => {
    vi.useFakeTimers();
    const { whenPageIsFree } = await newPageLoad();
    answered();
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const onFree = vi.fn();
    const stop = whenPageIsFree(onFree);
    expect(onFree).not.toHaveBeenCalled();
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(5000);
    expect(onFree).toHaveBeenCalledTimes(1);
    stop();
  });

  it('notices the answer on its own timer', async () => {
    vi.useFakeTimers();
    const { whenPageIsFree } = await newPageLoad();
    banner();
    const onFree = vi.fn();
    const stop = whenPageIsFree(onFree);
    expect(onFree).not.toHaveBeenCalled();
    document.querySelector('.CookieConsent').remove();
    answered();
    vi.advanceTimersByTime(1000);
    expect(onFree).toHaveBeenCalledTimes(1);
    stop();
  });
});
