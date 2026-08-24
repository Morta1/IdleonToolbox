// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';

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

const ToolsDrawer = (await import('@components/common/NavBar/AppDrawer/ToolsDrawer')).default;
const AccountDrawer = (await import('@components/common/NavBar/AppDrawer/AccountDrawer')).default;

const renderDrawer = (Drawer) => render(
  <ThemeProvider theme={darkTheme}>
    <Drawer/>
  </ThemeProvider>
);

// next/link renders the href object into a real URL, so the anchors are the ground truth for what
// a crawler would follow.
const linkParams = () => screen.getAllByRole('link')
  .map((node) => node.getAttribute('href'))
  .filter((href) => href?.startsWith('/'))
  .map((href) => [...new URL(href, 'https://idleontoolbox.com').searchParams.keys()]);

beforeEach(() => push.mockClear());

// AccountDrawer's world links sit inside accordions that mount only once opened.
const expandAll = () => screen.getAllByRole('button').forEach((node) => fireEvent.click(node));

describe.each([
  ['ToolsDrawer', () => ToolsDrawer, false],
  ['AccountDrawer', () => AccountDrawer, true]
])('%s nav links', (_name, get, needsExpanding) => {
  it('carries the session param and nothing else', () => {
    renderDrawer(get());
    if (needsExpanding) expandAll();
    const params = linkParams();

    expect(params.length).toBeGreaterThan(0);
    params.forEach((keys) => expect(keys.sort()).toEqual(['demo']));
  });
});
