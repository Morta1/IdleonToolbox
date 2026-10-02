// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../styles/theme/darkTheme';

const routerState = { isReady: true, query: { id: 'g1' }, push: vi.fn(), replace: vi.fn(), asPath: '/guilds/detail?id=g1', pathname: '/guilds/detail' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));
// Charts pull in nivo, which jsdom cannot lay out; they are irrelevant to the anchor.
vi.mock('@components/guilds/WeeklyProgressChart', () => ({ default: () => null }));
vi.mock('@components/guilds/TrendChart', () => ({ default: () => null }));
vi.mock('@components/guilds/RankHistoryChart', () => ({ default: () => null }));

const detail = {
  guild_id: 'g1', guild_name: 'Test_Guild', rank: 4, total_gp: 1000000, members_count: 10, total_gp_history: [],
  current_week: { week: '2026-09-26', gp_this_week: 500, timeseries: [{ captured_at: 1790924447704, total_gp: 500 }], members: [{ member_name: 'A', gp_earned: 300, gp_lifetime: 900, member_rank: 0 }] },
  last_week: { week: '2026-09-19', timeseries: [] }, rank_history: [], roster_diff: { joined: [], left: [] }
};
const fetchGuildDetail = vi.fn(async () => detail);
vi.mock('../../services/guild-history', () => ({ fetchGuildDetail, fetchGuildIndex: vi.fn(), fetchGlobalSnapshots: vi.fn(), GUILD_HISTORY_BASE: 'http://x' }));

const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

const { AppContext } = await import('@components/common/context/AppProvider');
const GuildDetail = (await import('../../pages/guilds/detail')).default;

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state: {} }}>
        <GuildDetail/>
      </AppContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);

beforeEach(() => window.history.replaceState(null, '', '/guilds/detail?id=g1'));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('guild detail #contributors', () => {
  it('scrolls to the contributors section once the guild has loaded', async () => {
    window.history.replaceState(null, '', '/guilds/detail?id=g1#contributors');
    const { container } = renderPage();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toBe(container.querySelector('#contributors'));
  });

  it('does not scroll without the hash', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('#contributors')).not.toBeNull());
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
