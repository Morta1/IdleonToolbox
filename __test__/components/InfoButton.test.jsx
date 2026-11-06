// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import InfoButton from '@components/common/InfoButton';

afterEach(() => {
  vi.useRealTimers();
});

describe('InfoButton', () => {
  it('pins its note on click, keeps it after the pointer leaves, and closes on Escape', () => {
    vi.useFakeTimers();
    render(
      <ThemeProvider theme={theme}>
        <InfoButton label="Overstim Rate">Every character feeds overstim.</InfoButton>
      </ThemeProvider>
    );
    const button = screen.getByRole('button', { name: 'About Overstim Rate' });

    fireEvent.click(button);
    const noteId = button.getAttribute('aria-describedby');
    expect(document.getElementById(noteId).textContent).toBe('Every character feeds overstim.');

    // MUI closes a hover on a timer: without running it this would pass even if pinning were broken
    fireEvent.mouseLeave(button);
    act(() => vi.runAllTimers());
    expect(button.getAttribute('aria-describedby')).toBe(noteId);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button.getAttribute('aria-describedby')).toBeNull();
  });
});
