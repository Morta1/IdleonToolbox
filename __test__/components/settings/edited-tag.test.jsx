// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import EditedTag, { EditedDot } from '@components/dashboard/settings/EditedTag';

const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>);

describe('settings tags', () => {
  it('the Edited tag renders its word', () => {
    const { container } = renderIn(<EditedTag/>);
    expect(container.textContent).toContain('Edited');
  });

  it('the edited dot carries text for screen readers', () => {
    const { container } = renderIn(<EditedDot/>);
    expect(container.textContent).toBe('has edits');
  });
});
