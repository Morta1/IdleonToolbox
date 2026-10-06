// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import EditedTag, { EditedDot, OffTag } from '@components/dashboard/settings/EditedTag';

const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>);

describe('settings tags', () => {
  it('Edited and Off tags render their words', () => {
    const { container } = renderIn(<><EditedTag/><OffTag/><OffTag kept/></>);
    expect(container.textContent).toContain('Edited');
    expect(container.textContent).toContain('Off');
    expect(container.textContent).toContain('Off: settings kept');
  });

  it('the edited dot carries text for screen readers', () => {
    const { container } = renderIn(<EditedDot/>);
    expect(container.textContent).toBe('has edits');
  });
});
