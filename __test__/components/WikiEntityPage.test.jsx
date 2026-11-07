// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { entityPageProps } from '@utility/wiki/static-pages.mjs';

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/wiki/[kind]/[slug]/[entity]', query: {}, isReady: true, push: vi.fn(), replace: vi.fn() })
}));

const WikiEntityPage = (await import('@components/wiki/WikiEntityPage')).default;

const page = (props) => <ThemeProvider theme={theme}><WikiEntityPage {...props}/></ThemeProvider>;

describe('WikiEntityPage', () => {
  // Next keeps the page component mounted between two pages of one route, so a level typed on one
  // upgrade opened the next one at that level.
  it('opens the next entity at its own first level, not the one typed on the last page', () => {
    const first = entityPageProps('sushi-station', 'upgrades', 'sushi-slot').props;
    const next = entityPageProps('sushi-station', 'upgrades', 'superior-sushi-skillz').props;
    const { container, rerender } = render(page(first));
    const field = () => container.querySelector('input[inputmode="decimal"]');
    const start = field().value;
    fireEvent.change(field(), { target: { value: '25' } });
    rerender(page(next));
    expect(field().value).toBe(start);
  });
});
