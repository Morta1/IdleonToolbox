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

const bulk = (...ids) => ({ ok: true, json: async () => ({ items: ids.map(detail), total: ids.length }) });

describe('toStaticBuild', () => {
  // BuildDetail renders every kept field: dropping one shows a blank author or date on a seeded
  // page until the refresh lands.
  it('keeps the payload and every field the detail UI renders, and drops the counters', () => {
    const { likeCount, viewCount, ...kept } = detail('a');
    expect(toStaticBuild(detail('a'))).toEqual(kept);
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

  it('returns the static build for an id, from the one shared bulk request', async () => {
    const spy = vi.fn(async () => bulk('aaa', 'bbb'));
    vi.stubGlobal('fetch', spy);
    expect(await fetchBuildDetailAtBuildTime('aaa')).toEqual(toStaticBuild(detail('aaa')));
    expect((await fetchBuildDetailAtBuildTime('bbb')).shortId).toBe('bbb');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // One missing payload only costs that page its head start - it still fetches on mount.
  it('resolves null for a build the bulk response does not carry', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => bulk('aaa')));
    await expect(fetchBuildDetailAtBuildTime('zzz')).resolves.toBeNull();
  });
});
