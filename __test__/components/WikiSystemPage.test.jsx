// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { hubProps } from '@utility/wiki/static-pages.mjs';
import { listingCounts } from '@utility/wiki/kinds.mjs';
import searchIndex from '../../data/wiki-search-index.json';

vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/wiki/[kind]', query: {}, isReady: true, push: vi.fn() }) }));

const WikiSystemPage = (await import('@components/wiki/WikiSystemPage')).default;

const counts = listingCounts(searchIndex);
const { props } = hubProps('equinox');

const renderPage = () => render(<ThemeProvider theme={darkTheme}><WikiSystemPage {...props}/></ThemeProvider>);

// The rail carries its own hundred-odd anchors; only the page's own links are under test.
const pageLinks = (container) => [...container.querySelectorAll('a')]
  .filter((link) => !link.closest('nav[aria-label="Wiki categories"]'));

describe('WikiSystemPage', () => {
  // The Equinox listing moved one level down, so its row links there while the page itself holds /wiki/equinox.
  it('links the trail home and each kind at its listing', () => {
    const { container } = renderPage();
    expect(pageLinks(container).map((link) => [link.getAttribute('href'), link.textContent])).toEqual([
      ['/wiki', 'Wiki'],
      ['/wiki/equinox/upgrades', `Upgrades${counts.equinox.toLocaleString('en-US')}`],
      ['/wiki/dream', `Dreams${counts.dream.toLocaleString('en-US')}`]
    ]);
  });

  it('names itself as the current crumb, as text', () => {
    const { container } = renderPage();
    const current = container.querySelector('nav[aria-label="breadcrumb"] [aria-current="page"]');
    expect([current.tagName, current.textContent]).toEqual(['P', 'Equinox']);
  });

  it('holds the heading and the rows and nothing else', () => {
    const { container } = renderPage();
    const card = container.querySelector('h2').closest('.MuiCard-root');
    expect(card.textContent).toBe(['Equinox', ...pageLinks(container).slice(1).map((link) => link.textContent)].join(''));
  });
});
