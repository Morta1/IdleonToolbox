// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { slugProps } from '@utility/wiki/static-pages.mjs';

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/wiki/[kind]/[slug]', query: {}, isReady: true, push: vi.fn(), replace: vi.fn() })
}));

const WikiEntityPage = (await import('@components/wiki/WikiEntityPage')).default;

const page = (props) => <ThemeProvider theme={darkTheme}><WikiEntityPage {...props}/></ThemeProvider>;

describe('WikiEntityPage', () => {
  // Next keeps the page component mounted between two pages of one route, so a level typed on one
  // upgrade opened the next one at that level.
  it('opens the next entity at its own first level, not the one typed on the last page', () => {
    const first = slugProps('sushiupgrade', 'sushi-slot').props;
    const next = slugProps('sushiupgrade', 'superior-sushi-skillz').props;
    const { rerender } = render(page(first));
    const start = screen.getByRole('spinbutton').value;
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '25' } });
    rerender(page(next));
    expect(screen.getByRole('spinbutton').value).toBe(start);
  });
});
