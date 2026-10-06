// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import DefaultsNote from '@components/dashboard/settings/DefaultsNote';

describe('DefaultsNote', () => {
  it('states the count and offers Review and Dismiss', () => {
    const onReview = vi.fn();
    const onDismiss = vi.fn();
    const { container } = render(<ThemeProvider theme={darkTheme}><DefaultsNote count={3} onReview={onReview} onDismiss={onDismiss}/></ThemeProvider>);
    expect(container.textContent).toContain('3 of your alert settings differ from the defaults.');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Review'));
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Dismiss'));
    expect(onReview).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
