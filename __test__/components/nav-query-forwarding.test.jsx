// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';

// A visitor who arrived on a build page in demo mode: `demo` names the save being viewed, the rest
// describes the page they are on. Every one of these params was observed riding the nav in Search
// Console, minting a duplicate of each destination.
const query = {
  demo: 'true',
  slug: 'divine-knight',
  c: 'barbarian',
  b: '11',
  q: 'platinum',
  reason: 'profile',
  name: 'Tay',
  pb: 'VHFQx3zU',
  t: 'Upgrades'
};

const push = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ push, query, pathname: '/tools/builds' }) }));
vi.mock('@components/common/context/AppProvider', () => ({
  AppContext: React.createContext({ state: {} }),
  default: ({ children }) => children
}));

const { NavMenuPanel } = await import('@components/common/NavBar/NavMenu');
const { GuildLink } = await import('@components/guilds/GuildTable');

const renderMenu = (menu) => render(
  <ThemeProvider theme={theme}>
    <NavMenuPanel menu={menu} onClose={() => {}}/>
  </ThemeProvider>
);

// next/link renders the href object into a real URL, so the anchors are the ground truth for what
// a crawler would follow.
const linkParams = () => screen.getAllByRole('link')
  .map((node) => node.getAttribute('href'))
  .filter((href) => href?.startsWith('/'))
  .map((href) => [...new URL(href, 'https://idleontoolbox.com').searchParams.keys()]);

beforeEach(() => push.mockClear());

describe.each([
  ['Worlds menu', 'worlds'],
  ['Account menu', 'account'],
  ['Tools menu', 'tools']
])('%s links', (_name, menu) => {
  it('carries the session param and nothing else', () => {
    renderMenu(menu);
    const params = linkParams();

    expect(params.length).toBeGreaterThan(0);
    params.forEach((keys) => expect(keys.sort()).toEqual(['demo']));
  });
});

it('a guild name keeps the session and nothing else, with no href for a crawler', () => {
  render(<ThemeProvider theme={theme}><GuildLink guild={{ guild_id: 'g 1', guild_name: 'Guild' }} router={{ push, query }}/></ThemeProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Guild' }));
  expect(push.mock.calls).toEqual([[{ pathname: '/guilds/detail', query: { id: 'g 1', demo: 'true' } }]]);
});
