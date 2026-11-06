// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Menu, ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { ThemeLink, useThemeRows } from '@components/common/NavBar/ThemeRows';

const InMenu = ({ onPick }) => <Menu open anchorEl={document.body}>{useThemeRows(onPick)}</Menu>;

afterEach(() => {
  cleanup();
  document.documentElement.className = '';
});

describe('ThemeRows', () => {
  it('marks the stored choice, and a pick stores and applies the new one', () => {
    localStorage.setItem('mui-mode', 'system');
    const onPick = vi.fn();
    render(<ThemeProvider theme={theme} defaultMode="dark"><InMenu onPick={onPick}/></ThemeProvider>);
    const checked = () => screen.getAllByRole('menuitemradio').filter((row) => row.getAttribute('aria-checked') === 'true').map((row) => row.textContent);
    expect(checked()).toEqual(['System']);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Light' }));
    expect(checked()).toEqual(['Light']);
    expect(localStorage.getItem('mui-mode')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('opens the same rows from the footer link', () => {
    render(<ThemeProvider theme={theme} defaultMode="dark"><ThemeLink/></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));
    expect(screen.getAllByRole('menuitemradio').map((row) => row.textContent)).toEqual(['Dark (default)', 'Light', 'System']);
  });
});
