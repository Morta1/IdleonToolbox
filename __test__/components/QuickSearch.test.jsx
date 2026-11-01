// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';

const push = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ push, query: {}, pathname: '/' }) }));

const QuickSearch = (await import('@components/common/QuickSearch')).default;

const searchEvents = () => window.dataLayer
  .map((args) => Array.from(args))
  .filter(([, name]) => name === 'view_search_results');

const renderSearch = () => render(
  <ThemeProvider theme={darkTheme}>
    <QuickSearch/>
  </ThemeProvider>
);

const input = () => screen.getByRole('textbox', { name: 'Search' });

const openAndType = (term) => {
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  fireEvent.change(input(), { target: { value: term } });
};

// Escape is fired on the input rather than on document so it bubbles to the Modal root, which is
// where MUI listens for it.
const pressEscape = () => fireEvent.keyDown(input(), { key: 'Escape', code: 'Escape' });

beforeEach(() => {
  window.dataLayer = [];
  push.mockClear();
});

describe('QuickSearch search tracking', () => {
  it('reports the term and result count when the search is abandoned', () => {
    renderSearch();
    openAndType('Storage');
    pressEscape();

    expect(searchEvents()[0]?.[2]).toMatchObject({ search_term: 'storage' });
    expect(searchEvents()[0]?.[2]?.results_count).toBeGreaterThan(0);
  });

  it('reports a term that matched nothing - the reason this event exists', () => {
    renderSearch();
    openAndType('nonexistent tool zzz');
    pressEscape();

    expect(searchEvents()[0]?.[2]).toMatchObject({ search_term: 'nonexistent tool zzz', results_count: 0 });
  });

  it('reports once, not twice, when a result is opened', () => {
    renderSearch();
    openAndType('Storage');
    fireEvent.click(screen.getAllByRole('link').find((node) => /storage/i.test(node.textContent)));

    expect(push).toHaveBeenCalled();
    expect(searchEvents()).toHaveLength(1);
  });

  it('stays quiet when the dialog is opened and closed without a term', () => {
    renderSearch();
    fireEvent.click(screen.getByText('Ctrl + K'));
    pressEscape();

    expect(searchEvents()).toHaveLength(0);
  });
});
