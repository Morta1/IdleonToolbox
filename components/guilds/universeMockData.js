// Mock universe-snapshot data for previewing /guilds/universe?mock=true
// without a live guild-history API. Three weekly snapshots, newest-first,
// matching the /api/global-snapshots response shape (each row's `delta` is
// the week-over-week change vs the chronologically previous row).
//
// The figures are intentionally non-linear — a dip here, a surge there — so
// the sparklines show real shape rather than a straight ramp. The week-3
// `new_guilds − disbanded_guilds` equals its `delta.total_guilds`, and every
// `delta` equals the difference between consecutive snapshots.
export const MOCK_UNIVERSE_RESPONSE = {
  snapshots: [
    {
      taken_at: Date.UTC(2026, 4, 21),
      total_guilds: 98214,
      new_guilds: 1180,
      disbanded_guilds: 976,
      active_guilds: 32080,
      abandoned_guilds: 18990,
      total_members: 2840000,
      active_members: 415300,
      abandoned_members: 124100,
      total_points: 543724000000,
      delta: {
        total_guilds: 204,
        active_guilds: 930,
        abandoned_guilds: 450,
        total_members: 34000,
        active_members: 7100,
        abandoned_members: 2700,
        total_points: 2084000000
      }
    },
    {
      taken_at: Date.UTC(2026, 4, 14),
      total_guilds: 98010,
      new_guilds: 1690,
      disbanded_guilds: 630,
      active_guilds: 31150,
      abandoned_guilds: 18540,
      total_members: 2806000,
      active_members: 408200,
      abandoned_members: 121400,
      total_points: 541640000000,
      delta: {
        total_guilds: 1060,
        active_guilds: -650,
        abandoned_guilds: -260,
        total_members: 64000,
        active_members: 3200,
        abandoned_members: -1600,
        total_points: 1640000000
      }
    },
    {
      taken_at: Date.UTC(2026, 4, 7),
      total_guilds: 96950,
      new_guilds: 1210,
      disbanded_guilds: 700,
      active_guilds: 31800,
      abandoned_guilds: 18800,
      total_members: 2742000,
      active_members: 405000,
      abandoned_members: 123000,
      total_points: 540000000000,
      delta: null
    }
  ]
};
