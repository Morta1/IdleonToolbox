// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, pathname: '/test' }) }));

const Tabber = (await import('@components/common/Tabber')).default;

const renderTabber = (count) => render(
  <ThemeProvider theme={darkTheme}>
    <Tabber tabs={Array.from({ length: count }, (_, index) => `tab${index}`)}><div/></Tabber>
  </ThemeProvider>
);

describe('Tabber', () => {
  it('centres a tab row that is short enough to render unscrolled', () => {
    const { container } = renderTabber(7);
    expect(container.querySelector('.MuiTabs-centered')).toBeTruthy();
  });

  // MUI ignores `centered` once the tabs go scrollable, which is what left-aligned an 8-tab page.
  // `safe center` centres them while they fit and drops back to flex-start on overflow, so the
  // leading tabs can't end up clipped past the left edge with no way to scroll them back.
  it('keeps a scrollable tab row centred without risking clipped leading tabs', () => {
    const { container } = renderTabber(8);
    expect(container.querySelector('.MuiTabs-centered')).toBeNull();
    const flexContainer = container.querySelector('.MuiTabs-flexContainer');
    expect(getComputedStyle(flexContainer).justifyContent).toBe('safe center');
  });

  it('leaves the non-scrollable row to MUI rather than overriding its layout', () => {
    const { container } = renderTabber(7);
    const flexContainer = container.querySelector('.MuiTabs-flexContainer');
    expect(getComputedStyle(flexContainer).justifyContent).not.toBe('safe center');
  });
});
