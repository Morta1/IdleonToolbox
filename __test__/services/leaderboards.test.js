import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const base = process.env.NEXT_PUBLIC_PROFILES_URL;
const { fetchBoard, fetchMeta, fetchPlayer, fetchTab, searchNames } = await import('../../services/leaderboards');

const respond = (status, body) => vi.fn(async () => ({ status, ok: status < 400, json: async () => body }));

beforeEach(() => { globalThis.fetch = respond(200, { ok: true }); });
afterEach(() => { vi.restoreAllMocks(); });

describe('leaderboards service', () => {
  it('fetches meta', async () => {
    expect(await fetchMeta()).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(`${base}/leaderboards/meta`, expect.anything());
  });

  it('encodes the player name and maps 404 to null', async () => {
    globalThis.fetch = respond(404, { error: 'User doesn\'t exist' });
    expect(await fetchPlayer('Anon#ab12cd')).toBeNull();
    expect(fetch).toHaveBeenCalledWith(`${base}/leaderboards/player?name=Anon%23ab12cd`, expect.anything());
  });

  it('builds the board query', async () => {
    await fetchBoard('highestConstructExp/hr', { limit: 10, around: 'Baker333', publicOnly: true });
    expect(fetch).toHaveBeenCalledWith(`${base}/leaderboards/board?metric=highestConstructExp%2Fhr&limit=10&around=Baker333&public=1`, expect.anything());
    await fetchBoard('mining');
    expect(fetch).toHaveBeenLastCalledWith(`${base}/leaderboards/board?metric=mining&limit=100`, expect.anything());
  });

  it('returns the names list', async () => {
    globalThis.fetch = respond(200, { players: [{ mainChar: 'Baker333', rank: 75 }] });
    expect(await searchNames('bak')).toEqual([{ mainChar: 'Baker333', rank: 75 }]);
  });

  it('asks for the ranked tab lists with v=2', async () => {
    await fetchTab('skills');
    expect(fetch).toHaveBeenCalledWith(`${base}/leaderboards?leaderboard=skills&v=2`, expect.anything());
  });

  it('throws on other errors so React Query shows an error state', async () => {
    globalThis.fetch = respond(500, {});
    await expect(fetchMeta()).rejects.toThrow('500');
  });
});
