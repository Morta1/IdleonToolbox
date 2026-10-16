// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { listingProps, slugProps } from '@utility/wiki/static-pages.mjs';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/wiki/[kind]', query: {}, isReady: true, push }) }));

const WikiListingPage = (await import('@components/wiki/WikiListingPage')).default;

const renderPage = (props) => render(<ThemeProvider theme={darkTheme}><WikiListingPage {...props}/></ThemeProvider>);
const npc = listingProps('npc').props;

describe('WikiListingPage', () => {
  // Both listing URLs, moved or not, take their trail from the kind: the system crumb only where the kind has one.
  it.each([
    ['a listing at /wiki/<kind>', npc, [['Wiki', '/wiki']], KIND_PLURALS.npc],
    ['a listing one level down', slugProps('equinox', 'upgrades').props, [['Wiki', '/wiki'], ['Equinox', '/wiki/equinox']], 'Upgrades']
  ])('crumbs %s up to itself', (unused, props, links, current) => {
    const { container } = renderPage(props);
    const trail = container.querySelector('nav[aria-label="breadcrumb"]');
    expect({
      links: [...trail.querySelectorAll('a')].map((link) => [link.textContent, link.getAttribute('href')]),
      current: trail.querySelector('[aria-current="page"]').textContent
    }).toEqual({ links, current });
  });

  it('leaves the old button trail out of the category card', () => {
    renderPage(npc);
    expect(screen.queryByRole('button', { name: 'Wiki' })).toBeNull();
  });

  it('routes a plain click on a crumb in-app and leaves a modified click to the browser', () => {
    const seen = [];
    // After React's own handler has run, so it records whether the default was already prevented,
    // and stops jsdom trying to navigate.
    const record = (event) => {
      seen.push(event.defaultPrevented);
      event.preventDefault();
    };
    document.body.addEventListener('click', record);
    push.mockClear();
    const { container } = renderPage(npc);
    const home = container.querySelector('nav[aria-label="breadcrumb"] a[href="/wiki"]');

    fireEvent.click(home);
    fireEvent.click(home, { ctrlKey: true });
    document.body.removeEventListener('click', record);
    expect({ calls: push.mock.calls.map(([to]) => to.pathname), seen }).toEqual({ calls: ['/wiki'], seen: [true, false] });
  });
});
