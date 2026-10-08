// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, pathname: '/test' }) }));

const Tabber = (await import('@components/common/Tabber')).default;

const renderTabber = (count, props = {}) => render(
  <ThemeProvider theme={darkTheme}>
    <Tabber tabs={Array.from({ length: count }, (_, index) => `tab${index}`)} {...props}><div/></Tabber>
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

  it('left-aligns the strip only when asked, for either row length', () => {
    for (const count of [7, 8]) {
      const { container, unmount } = renderTabber(count, { align: 'start' });
      expect(container.querySelector('.MuiTabs-centered')).toBeNull();
      expect(getComputedStyle(container.querySelector('.MuiTabs-flexContainer')).justifyContent).toBe('flex-start');
      unmount();
    }
  });

  it('renders an end slot after the tabs in the same row, and nothing extra by default', () => {
    const { container } = renderTabber(7, { align: 'start', endSlot: <span data-testid="end">status</span> });
    const end = container.querySelector('[data-testid="end"]');
    const row = end.parentElement.parentElement;
    expect(row.querySelector('.MuiTabs-root')).toBeTruthy();
    expect(getComputedStyle(row).display).toBe('flex');
    cleanup();
    const plain = renderTabber(7).container;
    expect(plain.querySelector('[data-testid="end"]')).toBeNull();
    expect(plain.querySelector('.MuiTabs-root').parentElement.parentElement).toBe(plain);
  });
});
