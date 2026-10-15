// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { listingProps, slugProps } from '@utility/wiki/static-pages.mjs';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';

const push = vi.hoisted(() => vi.fn());
// Mutable, so a test can stand the router before or after it is ready, with or without a sort in the URL.
const router = vi.hoisted(() => ({ query: {}, isReady: true, replace: vi.fn() }));
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/wiki/[kind]', ...router, push }) }));

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

describe('WikiListingPage sort', () => {
  afterEach(() => {
    Object.assign(router, { query: {}, isReady: true });
    router.replace.mockClear();
  });

  const monster = listingProps('monster').props;
  const firstRow = (state) => {
    Object.assign(router, state);
    return renderPage(monster).container.querySelector('tbody a[href^="/wiki/monster/"]').getAttribute('href');
  };

  // The export has no query, so the markup a deep link hydrates against is the default order; the sort lands once
  // the router is ready.
  it('sorts a deep link only once the router is ready', () => {
    const sorted = { kind: 'monster', sort: 'health', order: 'desc' };
    const at = monster.columns.findIndex((column) => column.key === 'health');
    const strongest = monster.entries.reduce((best, entry) => ((entry.cells[at] ?? -Infinity) > (best.cells[at] ?? -Infinity) ? entry : best));
    expect({
      notReady: firstRow({ isReady: false, query: sorted }),
      ready: firstRow({ isReady: true, query: sorted })
    }).toEqual({
      notReady: firstRow({ isReady: true, query: { kind: 'monster' } }),
      ready: `/wiki/monster/${strongest.node.slug}`
    });
  });

  // A kind with no columns has no sort control, so a ?sort it could not undo leaves the cards in the default order.
  it('ignores a sort on a listing with no columns', () => {
    const world = listingProps('world').props;
    const cards = (query) => {
      Object.assign(router, { isReady: true, query });
      return [...renderPage(world).container.querySelectorAll('a[href^="/wiki/world/"]')].map((card) => card.getAttribute('href'));
    };
    expect({ columns: world.columns, sorted: cards({ kind: 'world', sort: 'name', order: 'desc' }) })
      .toEqual({ columns: [], sorted: cards({ kind: 'world' }) });
  });

  // The pathname is the listing's own URL, so a moved listing sorts under /wiki/equinox/upgrades, never ?kind=.
  it.each([
    ['/wiki/monster', monster, { kind: 'monster' }, 'Health', 'health'],
    ['/wiki/equinox/upgrades', slugProps('equinox', 'upgrades').props, { kind: 'equinox', slug: 'upgrades' }, 'Name', 'name']
  ])('writes a header click into %s', (pathname, props, query, header, key) => {
    Object.assign(router, { isReady: true, query });
    const { container } = renderPage(props);
    // Within the head: a role query over a 222-row page is seconds slower and finds the same button.
    fireEvent.click(within(container.querySelector('thead')).getByRole('button', { name: header }));
    expect(router.replace.mock.calls).toEqual([[{ pathname, query: { sort: key } }, undefined, { shallow: true, scroll: false }]]);
  });
});
