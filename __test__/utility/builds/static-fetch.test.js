import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchAllBuildsAtBuildTime,
  resetBuildsCacheForTests,
  BUILD_FETCH_USER_AGENT
} from '@utility/builds/static-fetch.mjs';

const build = (shortId, cls = 'Warrior', subclass = 'Barbarian') => ({
  shortId, title: `Build ${shortId}`, class: cls, subclass,
  ownerName: 'Anon', tags: ['afk'], likeCount: 0, viewCount: 1,
  createdAt: '2026-07-01T00:00:00.000Z'
});

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });

describe('fetchAllBuildsAtBuildTime', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_BUILDS_URL', 'https://example.test/api');
    resetBuildsCacheForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fetches once and shares the result across callers', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: null }));
    const [first, second] = await Promise.all([
      fetchAllBuildsAtBuildTime(),
      fetchAllBuildsAtBuildTime()
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('does not cache a failure — a retry can still succeed', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce(okResponse({ items: [build('a')], nextCursor: null }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/500/);
    const result = await fetchAllBuildsAtBuildTime();
    expect(result).toHaveLength(1);
  });

  it('returns builds from a single page', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: null }));
    const result = await fetchAllBuildsAtBuildTime();
    expect(result).toHaveLength(1);
    expect(result[0].shortId).toBe('a');
  });

  it('sends a browser User-Agent to get past Cloudflare', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: null }));
    await fetchAllBuildsAtBuildTime();
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['User-Agent']).toBe(BUILD_FETCH_USER_AGENT);
    expect(BUILD_FETCH_USER_AGENT).toMatch(/Mozilla/);
  });

  it('follows nextCursor until exhausted', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(okResponse({ items: [build('a')], nextCursor: 'c1' }))
      .mockResolvedValueOnce(okResponse({ items: [build('b')], nextCursor: null }));
    const result = await fetchAllBuildsAtBuildTime();
    expect(result.map((b) => b.shortId)).toEqual(['a', 'b']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('passes the cursor on the second request', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(okResponse({ items: [build('a')], nextCursor: 'c1' }))
      .mockResolvedValueOnce(okResponse({ items: [build('b')], nextCursor: null }));
    await fetchAllBuildsAtBuildTime();
    expect(global.fetch.mock.calls[1][0]).toContain('cursor=c1');
  });

  it('throws on a non-ok response rather than returning a partial list', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/403/);
  });

  it('throws when the API returns zero builds', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [], nextCursor: null }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/no builds/i);
  });

  it('skips malformed records but keeps valid ones', async () => {
    global.fetch = vi.fn(async () => okResponse({
      items: [build('a'), { title: 'no id' }, { shortId: 'c' }],
      nextCursor: null
    }));
    const result = await fetchAllBuildsAtBuildTime();
    expect(result.map((b) => b.shortId)).toEqual(['a']);
  });

  it('throws instead of returning a truncated list when the page cap is hit', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: 'more' }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/exceeded|truncated/i);
  });
});
