import { describe, it, expect, vi } from 'vitest';
import { fetchGuildIndex, fetchGuildDetail, fetchGlobalSnapshots, GUILD_HISTORY_BASE } from '../../services/guild-history.js';

describe('fetchGuildIndex', () => {
  it('hits /api/guilds and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ week: '2026-W20-THU', guilds: [{ guild_id: 'a' }] })
    });
    const result = await fetchGuildIndex({ fetch: fetchMock });
    expect(result.week).toBe('2026-W20-THU');
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/guilds`);
  });
});

describe('fetchGuildDetail', () => {
  it('hits /api/guilds/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ guild_id: 'a', current_week: { timeseries: [] } })
    });
    const result = await fetchGuildDetail('a', { fetch: fetchMock });
    expect(result.guild_id).toBe('a');
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/guilds/a`);
  });
});

describe('fetchGlobalSnapshots', () => {
  it('uses default limit of 1 when limit is undefined', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ snapshots: [] })
    });
    await fetchGlobalSnapshots(undefined, { fetch: fetchMock });
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/global-snapshots?limit=1`);
  });

  it('passes an explicit limit to the URL', async () => {
    const snapshots = Array.from({ length: 26 }, (_, i) => ({ total_guilds: 90000 + i, delta: null }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ snapshots })
    });
    const result = await fetchGlobalSnapshots(26, { fetch: fetchMock });
    expect(result.snapshots).toHaveLength(26);
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/global-snapshots?limit=26`);
  });
});

describe('non-2xx responses', () => {
  it.each([
    ['fetchGuildIndex', (options) => fetchGuildIndex(options), 500],
    ['fetchGuildDetail', (options) => fetchGuildDetail('missing', options), 404],
    ['fetchGlobalSnapshots', (options) => fetchGlobalSnapshots(1, options), 503]
  ])('%s throws with the status', async (_name, call, status) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status });
    await expect(call({ fetch: fetchMock })).rejects.toThrow(String(status));
  });
});
