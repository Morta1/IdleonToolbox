// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { hubProps } from '@utility/wiki/static-pages.mjs';
import { listingCounts } from '@utility/wiki/kinds.mjs';
import searchIndex from '../../data/wiki-search-index.json';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/wiki/[kind]', query: {}, isReady: true, push }) }));

const WikiSystemPage = (await import('@components/wiki/WikiSystemPage')).default;

const counts = listingCounts(searchIndex);
const { props } = hubProps('equinox');

const renderPage = () => render(<ThemeProvider theme={darkTheme}><WikiSystemPage {...props}/></ThemeProvider>);

// The rail carries its own hundred-odd anchors; only the page's own links are under test.
const pageLinks = (container) => [...container.querySelectorAll('a')]
  .filter((link) => !link.closest('nav[aria-label="Wiki categories"]'));

describe('WikiSystemPage', () => {
  // A system's kinds sit under it, so each row links one level down from the page.
  it('links the trail home and each kind at its listing', () => {
    const { container } = renderPage();
    expect(pageLinks(container).map((link) => [link.getAttribute('href'), link.textContent])).toEqual([
      ['/wiki', 'Wiki'],
      ['/wiki/equinox/upgrades', `Upgrades${counts.equinox.toLocaleString('en-US')}`],
      ['/wiki/equinox/dreams', `Dreams${counts.dream.toLocaleString('en-US')}`]
    ]);
  });

  it('names itself as the current crumb, as text', () => {
    const { container } = renderPage();
    const current = container.querySelector('nav[aria-label="breadcrumb"] [aria-current="page"]');
    expect([current.tagName, current.textContent]).toEqual(['P', 'Equinox']);
  });

  // The row is the one in-app route from the system page to a listing.
  it('routes a plain click on a kind row to its listing', () => {
    push.mockClear();
    const { container } = renderPage();
    fireEvent.click(pageLinks(container).find((link) => link.getAttribute('href') === '/wiki/equinox/upgrades'));
    expect(push.mock.calls.map(([to]) => to.pathname)).toEqual(['/wiki/equinox/upgrades']);
  });

  // A card per kind, like the home's Encyclopedia tiles, not the home's index card again.
  it('gives each kind its own card under the heading', () => {
    const { container } = renderPage();
    expect({
      heading: container.querySelector('h2').textContent,
      headingInCard: Boolean(container.querySelector('h2').closest('.MuiCard-root')),
      cards: [...container.querySelectorAll('.MuiCard-root')].filter((card) => !card.closest('nav[aria-label="Wiki categories"]')).map((card) => card.querySelector('a').getAttribute('href'))
    }).toEqual({ heading: 'Equinox', headingInCard: false, cards: ['/wiki/equinox/upgrades', '/wiki/equinox/dreams'] });
  });
});
