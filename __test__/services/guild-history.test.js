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

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchGuildIndex({ fetch: fetchMock })).rejects.toThrow(/500/);
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

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchGuildDetail('missing', { fetch: fetchMock })).rejects.toThrow(/404/);
  });
});

describe('fetchGlobalSnapshots', () => {
  it('hits /api/global-snapshots?limit=1 and returns parsed JSON (default limit)', async () => {
    const mockSnapshot = { total_guilds: 95000, active_guilds: 1000, top1000_total_gp: 5e9, delta: null };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ snapshots: [mockSnapshot] })
    });
    const result = await fetchGlobalSnapshots(1, { fetch: fetchMock });
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].total_guilds).toBe(95000);
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/global-snapshots?limit=1`);
  });

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

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchGlobalSnapshots(1, { fetch: fetchMock })).rejects.toThrow(/503/);
  });
});
