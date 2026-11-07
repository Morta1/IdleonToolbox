// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import SnackbarHost from '@components/common/Overlays/SnackbarHost';
import { noticeSnapshot, notify } from '@components/common/Overlays/notify';

const renderHost = () => render(<ThemeProvider theme={theme}><SnackbarHost/></ThemeProvider>);

afterEach(() => {
  vi.useRealTimers();
});

describe('SnackbarHost', () => {
  it('shows one message at a time and reads it out in the status region', () => {
    renderHost();
    act(() => {
      notify('Goal saved');
      notify('Goal removed');
    });
    expect(screen.queryByText('Goal saved')).toBeNull();
    expect(within(screen.getByRole('status')).getByText('Goal removed')).toBeTruthy();
  });

  it.each([
    ['a message leaves after 4 s', {}, 4000],
    ['a message with Undo leaves after 6 s', { undo: () => {} }, 6000]
  ])('%s', (_, options, ms) => {
    vi.useFakeTimers();
    renderHost();
    act(() => {
      notify('Copied', options);
    });
    act(() => vi.advanceTimersByTime(ms - 1));
    expect(noticeSnapshot().open).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(noticeSnapshot().open).toBe(false);
  });

  it('runs Undo once and closes', () => {
    const undo = vi.fn();
    renderHost();
    act(() => {
      notify('Removed Copper', { undo });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(noticeSnapshot().open).toBe(false);
  });
});
