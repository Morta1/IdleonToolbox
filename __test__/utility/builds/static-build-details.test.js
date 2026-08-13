import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toStaticBuild,
  fetchBuildDetailAtBuildTime,
  resetBuildsCacheForTests
} from '../../../utility/builds/static-fetch.mjs';

// The list endpoint has no `payload`, so without these details a build page's substance exists
// only after a client-side fetch to the Worker - the dependency that made these pages invisible
// to search. Counters must NOT come along: they tick, and a baked value renders visibly wrong.

const detail = (shortId) => ({
  shortId,
  title: 'Wizard / AFK',
  description: 'notes',
  class: 'Mage',
  subclass: 'Wizard',
  tags: ['afk'],
  payload: { talents: [1, 2, 3] },
  ownerName: 'Someone',
  isAnonymous: false,
  createdAt: 1,
  updatedAt: 2,
  likeCount: 41,
  viewCount: 999
});

const ok = (shortId) => ({ ok: true, json: async () => ({ build: detail(shortId) }) });

describe('toStaticBuild', () => {
  it('keeps the talent payload', () => {
    expect(toStaticBuild(detail('a')).payload).toEqual({ talents: [1, 2, 3] });
  });

  it('drops the counters', () => {
    const out = toStaticBuild(detail('a'));
    expect(out.likeCount).toBeUndefined();
    expect(out.viewCount).toBeUndefined();
  });

  // BuildDetail renders all of these. Dropping one shows a blank author or date on a seeded page
  // until the refresh lands.
  it('keeps every field the detail UI renders', () => {
    const out = toStaticBuild(detail('a'));
    for (const key of ['shortId', 'title', 'description', 'class', 'subclass', 'tags',
      'ownerName', 'isAnonymous', 'createdAt', 'updatedAt']) {
      expect(out[key], `${key} must survive`).toBeDefined();
    }
  });

  it('survives a null detail', () => {
    expect(toStaticBuild(null)).toBeNull();
  });
});

describe('fetchBuildDetailAtBuildTime', () => {
  beforeEach(() => {
    resetBuildsCacheForTests();
    process.env.NEXT_PUBLIC_BUILDS_URL = 'https://example.test/api';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetBuildsCacheForTests();
  });

  it('returns the static build for an id', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => ok(String(url).split('/').pop())));
    const out = await fetchBuildDetailAtBuildTime('aaa');
    expect(out.shortId).toBe('aaa');
    expect(out.payload).toEqual({ talents: [1, 2, 3] });
  });

  // The list drives the exported paths, so a failure there must stop the deploy. One missing
  // payload only costs that page its head start - it still fetches on mount.
  it('resolves null rather than throwing when one build fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(fetchBuildDetailAtBuildTime('bad')).resolves.toBeNull();
  });

  // Keyed per id, not per call: a batch keyed on the whole list made every forked worker fetch all
  // 121 details, including workers that only rendered class pages.
  it('caches per id, and a second id is not served the first one', async () => {
    const spy = vi.fn(async (url) => ok(String(url).split('/').pop()));
    vi.stubGlobal('fetch', spy);

    const first = await fetchBuildDetailAtBuildTime('aaa');
    const again = await fetchBuildDetailAtBuildTime('aaa');
    const other = await fetchBuildDetailAtBuildTime('bbb');

    expect(first.shortId).toBe('aaa');
    expect(again).toBe(first);
    expect(other.shortId, 'bbb must not be served aaa from the cache').toBe('bbb');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('retries a build that fails transiently', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      calls += 1;
      if (calls === 1) throw new Error('socket hang up');
      return ok(String(url).split('/').pop());
    }));
    await expect(fetchBuildDetailAtBuildTime('aaa')).resolves.not.toBeNull();
    expect(calls).toBe(2);
  });

  it('gives up after a fixed number of attempts', async () => {
    const spy = vi.fn(async () => ({ ok: false, status: 500 }));
    vi.stubGlobal('fetch', spy);
    await fetchBuildDetailAtBuildTime('aaa');
    expect(spy).toHaveBeenCalledTimes(3);
  });

  // undici's default header timeout is 300s; without an explicit signal a stalled Worker hangs the
  // build for hours per attempt instead of failing over to fetch-on-mount.
  it('bounds each request with a timeout signal', async () => {
    const spy = vi.fn(async (_url, init) => {
      expect(init.signal, 'no abort signal on the detail fetch').toBeDefined();
      return ok('aaa');
    });
    vi.stubGlobal('fetch', spy);
    await fetchBuildDetailAtBuildTime('aaa');
  });

  // One bad build is a warning. Half of them silently reverting to fetch-on-mount is the exact
  // regression this change exists to prevent, so it fails the deploy instead.
  it('throws once failures pass the floor, not before', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const id = String(url).split('/').pop();
      if (id.startsWith('bad')) return { ok: false, status: 500 };
      return ok(id);
    }));

    // 9 good, 1 bad: 10% — under the floor, and below the minimum sample for most of it.
    for (let i = 0; i < 9; i++) await fetchBuildDetailAtBuildTime(`good${i}`);
    await expect(fetchBuildDetailAtBuildTime('bad0')).resolves.toBeNull();

    // Push the ratio over 20%.
    await expect(
      (async () => {
        for (let i = 1; i < 6; i++) await fetchBuildDetailAtBuildTime(`bad${i}`);
      })()
    ).rejects.toThrow(/refusing to deploy/);
  });
});
