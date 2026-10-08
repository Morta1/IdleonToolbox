// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../../styles/theme/darkTheme';

const fetchBoard = vi.fn(async () => ({ metric: 'globalRanking', createdAt: 1, around: [],
  top: Array.from({ length: 10 }, (_, i) => ({ mainChar: `G${i + 1}`, value: 20000 - i, rank: i + 1, globalRank: i + 1 })) }));
vi.mock('../../../services/leaderboards', () => ({ fetchBoard }));
const Overview = (await import('@components/leaderboards/Overview')).default;
const { buildMetaIndex } = await import('@components/leaderboards/format');

const index = buildMetaIndex({ categories: [
  { category: 'general', metrics: [
    { key: 'logBook', label: 'Log Book', section: 'Log', notation: 'default', maxed: true, top: 100, topTies: 40 },
    { key: 'coins', label: 'Coins', section: 'Log', notation: 'default' }
  ] },
  { category: 'skills', metrics: [
    { key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' },
    { key: 'farming', label: 'Farming', section: 'Skills', notation: 'default' }
  ] }
] });
const data = {
  createdAt: 1,
  player: { mainChar: 'Baker333', rank: 75, compositeScore: 14901.02, totalUsers: 2608, bestMetrics: [] },
  ranks: { mining: { r: 3, v: 240, p: 0.2, t: 1, nr: 2, nv: 250 }, farming: { r: 1, v: 9, p: 0.1, t: 1 } }
};
const self = { name: null, pending: false, participation: null, lastUpload: null };
const logged = { name: 'Baker333', kind: 'logged' };
const renderOverview = (props) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <Overview index={index} showAnonymous highlight={{}} self={self} onOpen={() => {}} onTab={() => {}} {...props}/>
    </ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Overview podium', () => {
  const slotOf = (name) => screen.getByText(name).closest('[data-testid="podium-slot"]');

  it('sizes slots by content, not fixed heights', async () => {
    renderOverview({ player: { context: null } });
    await screen.findByText('G1');
    const slots = screen.getAllByTestId('podium-slot');
    expect(slots).toHaveLength(3);
    for (const slot of slots) expect(getComputedStyle(slot).height).toBe('');
  });

  it('colours the top border by rank, in slot order second, first, third', async () => {
    renderOverview({ player: { context: null } });
    await screen.findByText('G1');
    expect(screen.getAllByTestId('podium-slot').map((slot) => slot.textContent.slice(0, 2))).toEqual(['G2', 'G1', 'G3']);
    expect(getComputedStyle(slotOf('G1')).borderTopColor).toBe('rgb(240, 184, 73)');
    expect(getComputedStyle(slotOf('G2')).borderTopColor).toBe('rgb(154, 163, 173)');
    expect(getComputedStyle(slotOf('G3')).borderTopColor).toBe('rgb(184, 120, 58)');
  });

  it('gives a tied first place gold and a slot ranked past 3 no medal', async () => {
    fetchBoard.mockResolvedValueOnce({ metric: 'globalRanking', createdAt: 1, around: [],
      top: [1, 1, 5, 6, 7, 8, 9, 10, 11, 12].map((rank, i) => ({ mainChar: `M${i}`, value: 1000 - i, rank, globalRank: rank })) });
    renderOverview({ player: { context: null } });
    await screen.findByText('M0');
    expect(getComputedStyle(slotOf('M0')).borderTopColor).toBe('rgb(240, 184, 73)');
    expect(getComputedStyle(slotOf('M1')).borderTopColor).toBe('rgb(240, 184, 73)');
    expect(getComputedStyle(slotOf('M2')).borderTopWidth).toBe('1px');
  });

  it('outlines the viewed player slot in their colour', async () => {
    renderOverview({ player: { context: null }, highlight: { G2: 'logged' } });
    await screen.findByText('G1');
    expect(getComputedStyle(slotOf('G2')).borderRightColor).toBe('rgb(0, 126, 133)');
    expect(getComputedStyle(slotOf('G1')).borderRightColor).not.toBe('rgb(0, 126, 133)');
  });
});

describe('Overview You card', () => {
  const withMax = { ...data, ranks: {
    mining: { r: 1, v: 304, p: 0.1, t: 1 }, logBook: { r: 1, v: 100, p: 5.6, t: 40 }, coins: { r: 80, v: 5, p: 3, t: 1, nr: 79, nv: 6 }
  } };
  const rankedAs = (rank) => ({ ...data, player: { ...data.player, rank } });

  it('reads as a YOU label, the rank, the points line and the three counters', async () => {
    renderOverview({ player: { context: logged, data: withMax } });
    const label = await screen.findByText('You');
    expect(label.parentElement.textContent).toBe('You · Baker333');
    expect(screen.getByText('#75')).toBeTruthy();
    expect(screen.getByText('of 2,608 · top 2.9% · 14,901 pts')).toBeTruthy();
    const tile = (name) => screen.getByText(name).parentElement.textContent;
    expect(tile('First places')).toBe('1First places+1 tied at the max');
    expect(tile('Top 25')).toBe('2Top 25');
    expect(tile('Top 100')).toBe('3Top 100');
    expect(document.body.textContent).not.toMatch(/\bcap\b/i);
  });

  it('marks a searched player in their own colour, with no tie line when none is at the max', async () => {
    renderOverview({ player: { context: { name: 'Baker333', kind: 'searched' }, data } });
    const label = await screen.findByText('Searched player');
    expect(label.parentElement.textContent).toBe('Searched player · Baker333');
    expect(getComputedStyle(label.parentElement).color).toBe('rgb(205, 134, 27)');
    expect(screen.queryByText(/tied at the max/)).toBeNull();
  });

  it('drops top percent past 50 and keeps points', async () => {
    renderOverview({ player: { context: logged, data: rankedAs(2000) } });
    expect(await screen.findByText('of 2,608 · 14,901 pts')).toBeTruthy();
  });

  it('keeps top percent at exactly 50', async () => {
    renderOverview({ player: { context: logged, data: rankedAs(1304) } });
    expect(await screen.findByText('of 2,608 · top 50% · 14,901 pts')).toBeTruthy();
  });
});

describe('Overview highlights', () => {
  const show = (bestMetrics) => renderOverview({ player: { context: logged, data: { ...data, player: { ...data.player, bestMetrics } } } });

  it('puts the tab and value under the label and the rank on the right', async () => {
    show([{ metric: 'mining', value: 240, rank: 3, topPercent: 0.2 }]);
    expect(await screen.findByText('Skills · 240')).toBeTruthy();
    expect(screen.getByText('Your highlights')).toBeTruthy();
    expect(screen.getByText('your strongest boards')).toBeTruthy();
    expect(screen.getByText('#3')).toBeTruthy();
    expect(screen.getByText('top 0.2%')).toBeTruthy();
  });

  it('leaves no stray separator or NaN when the value is missing', async () => {
    show([{ metric: 'mining', rank: 3, topPercent: 0.2 }]);
    const card = (await screen.findByText('Your highlights')).closest('.MuiCard-root');
    expect(within(card).getByText('Skills')).toBeTruthy();
    expect(within(card).queryByText(/·|NaN|undefined/)).toBeNull();
  });

  it('shows the value alone when the board has no tab', async () => {
    show([{ metric: 'unknownBoard', value: 12, rank: 9, topPercent: 1 }]);
    expect(await screen.findByText('12')).toBeTruthy();
  });

  it('hides top percent above 50', async () => {
    show([{ metric: 'mining', value: 240, rank: 900, topPercent: 51 }, { metric: 'farming', value: 9, rank: 5, topPercent: 12 }]);
    expect(await screen.findByText('top 12%')).toBeTruthy();
    expect(screen.queryByText('top 51%')).toBeNull();
  });
});

describe('Overview within reach', () => {
  it('lists label, rank and value, the step and an Around you link', async () => {
    renderOverview({ player: { context: logged, data } });
    const row = await screen.findByRole('button', { name: /Mining · #3 · 240/ });
    expect(row.textContent).toContain('+10 to reach #2');
    expect(row.textContent).toContain('Around you ›');
    expect(screen.getByText('smallest step to the next rank')).toBeTruthy();
  });

  it('never shows a small positive step as 0', async () => {
    const small = { ...data, ranks: { mining: { r: 3, v: 100.3, p: 0.2, t: 1, nr: 2, nv: 100.7 } } };
    renderOverview({ player: { context: logged, data: small } });
    const row = await screen.findByRole('button', { name: /Mining · #3/ });
    expect(row.textContent).toContain('+0.4 to reach #2');
    expect(row.textContent).not.toMatch(/\+0 to/);
  });
});

describe('Overview category tiles', () => {
  const tiles = () => screen.getAllByRole('link').filter((link) => /^\?t=/.test(link.getAttribute('href') ?? ''));
  const rankData = { ...data, ranks: {
    logBook: { r: 7, v: 50, p: 1, t: 1 }, coins: { r: 21, v: 5, p: 4, t: 1 },
    mining: { r: 3, v: 240, p: 0.2, t: 1, nr: 2, nv: 250 }, farming: { r: 100, v: 9, p: 8, t: 1 }
  } };

  it('is only a name and a board count without a player', async () => {
    renderOverview({ player: { context: null } });
    await screen.findByText('G1');
    const found = tiles();
    expect(found.map((link) => link.getAttribute('href'))).toEqual(['?t=General', '?t=Skills']);
    expect(found[0].textContent).toBe('General2');
    expect(screen.queryByText(/median/)).toBeNull();
  });

  it('shows the median rank and the best board of the player in each tab', async () => {
    renderOverview({ player: { context: logged, data: rankData } });
    await screen.findByText('G1');
    const [general, skills] = tiles();
    expect(general.textContent).toBe('General2median #14Log Book #7');
    expect(skills.textContent).toBe('Skills2median #52Mining #3');
  });

  it('switches tab in place on a plain click and leaves modified clicks to the browser', async () => {
    const onTab = vi.fn();
    renderOverview({ player: { context: null }, onTab });
    await screen.findByText('G1');
    const [, skills] = tiles();
    // jsdom would try to navigate on an unprevented click: record the verdict, then stop it.
    let prevented = null;
    const settle = (event) => { prevented = event.defaultPrevented; event.preventDefault(); };
    document.addEventListener('click', settle);
    fireEvent.click(skills, { ctrlKey: true });
    expect(prevented).toBe(false);
    expect(onTab).not.toHaveBeenCalled();
    fireEvent.click(skills);
    expect(prevented).toBe(true);
    document.removeEventListener('click', settle);
    expect(onTab).toHaveBeenCalledWith('Skills');
  });

  it('draws no tiles without meta', async () => {
    renderOverview({ index: buildMetaIndex(null), player: { context: null } });
    await screen.findByText('G1');
    expect(screen.queryAllByRole('link').filter((link) => /^\?t=/.test(link.getAttribute('href') ?? ''))).toHaveLength(0);
  });
});
