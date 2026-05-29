import { describe, it, expect } from 'vitest';
import { transformForChart } from '../../../components/guilds/WeeklyProgressChart';

describe('transformForChart', () => {
  it('returns two series (this week and last week)', () => {
    // Week starts Saturday 21:00 UTC — the first point sits exactly on it.
    const detail = {
      current_week: { week: '2026-05-16', timeseries: [
        { captured_at: Date.UTC(2026, 4, 16, 21, 0), total_gp: 0 },
        { captured_at: Date.UTC(2026, 4, 17, 21, 0), total_gp: 100 }
      ]},
      last_week: { week: '2026-05-09', timeseries: [
        { captured_at: Date.UTC(2026, 4, 9, 21, 0), total_gp: 0 },
        { captured_at: Date.UTC(2026, 4, 10, 21, 0), total_gp: 80 }
      ]}
    };

    const series = transformForChart(detail);
    expect(series).toHaveLength(2);
    expect(series[0].id).toBe('This week');
    expect(series[1].id).toBe('Last week');

    // x is hours into the Saturday-21:00-anchored week
    expect(series[0].data[0].x).toBe(0);
    expect(series[0].data[1].x).toBe(24);
    expect(series[0].data[1].y).toBe(100);
  });

  it('handles missing last week gracefully', () => {
    const detail = {
      current_week: { week: 'a', timeseries: [{ captured_at: Date.UTC(2026, 4, 16, 21, 0), total_gp: 0 }] },
      last_week: { week: 'b', timeseries: [] }
    };
    const series = transformForChart(detail);
    expect(series).toHaveLength(2);
    expect(series[1].data).toEqual([]);
  });
});
