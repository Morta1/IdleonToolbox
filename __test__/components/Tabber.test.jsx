// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';

const router = vi.hoisted(() => ({ push: vi.fn(), query: {}, pathname: '/test' }));
vi.mock('next/router', () => ({ useRouter: () => router }));
afterEach(() => {
  router.query = {};
  router.push.mockClear();
});

const Tabber = (await import('@components/common/Tabber')).default;
const ViewSwitch = (await import('@components/common/ViewSwitch')).default;

const renderTabber = (count, props = {}) => render(
  <ThemeProvider theme={theme}>
    <Tabber tabs={Array.from({ length: count }, (_, index) => `tab${index}`)} {...props}><div/></Tabber>
  </ThemeProvider>
);

describe('Tabber', () => {
  it('scrolls a row strip, pins it when asked, and ties tabs to one panel only when given an id prefix', () => {
    const plain = renderTabber(7, { align: 'start' });
    expect(plain.container.querySelector('[role="tabpanel"]')).toBeNull();
    plain.unmount();
    const { container } = renderTabber(7, { align: 'start', stickyTop: 120, idPrefix: 'lb' });
    expect(container.querySelector('.MuiTabs-scroller.MuiTabs-scrollableX')).toBeTruthy();
    const row = container.querySelector('.MuiTabs-root').parentElement;
    expect(getComputedStyle(row).position).toBe('sticky');
    expect(getComputedStyle(row).top).toBe('120px');
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel.id).toBe('lb-panel');
    expect(panel.getAttribute('aria-labelledby')).toBe('lb-tab-0');
    expect(container.querySelector('#lb-tab-3').getAttribute('aria-controls')).toBe('lb-panel');
  });

  it('draws level 2 as pills with no underline, and writes the pick to ?nt=', () => {
    const { container } = renderTabber(3, { level: 2 });
    expect(getComputedStyle(container.querySelector('.MuiTabs-indicator')).display).toBe('none');
    fireEvent.click(screen.getByRole('tab', { name: 'tab2' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/test', query: { nt: 'tab2' } }, undefined, { shallow: true });
  });

  // jsdom applies no @media rule MUI writes, so the desktop grid's tabs are in the DOM too: queries stay in the sheet.
  it('past 8 choices opens a picker that names every choice and writes the pick', () => {
    const labels = Array.from({ length: 18 }, (_, index) => `Cavern ${index}`);
    renderTabber(18, { level: 2, label: 'Caverns', labels, icons: labels.map((_, index) => `etc/Cavern_${index}`) });
    fireEvent.click(screen.getByRole('button', { name: 'Caverns: Cavern 0' }));
    const dialog = screen.getByRole('dialog', { name: 'Caverns' });
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.getAttribute('aria-label'))).toEqual(labels);
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Cavern 10' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/test', query: { nt: 'tab10' } }, undefined, { shallow: true });
  });
});

describe('ViewSwitch', () => {
  it('shows the view in the URL and writes a pick back, keeping the levels above', () => {
    router.query = { t: 'Explore', nt: 'The Jars', dnt: 'Collectibles' };
    render(<ThemeProvider theme={theme}>
      <ViewSwitch options={[['Jars', 'Jars'], ['Collectibles', 'Collectibles']]} queryKey="dnt"/>
    </ThemeProvider>);
    expect(screen.getByRole('button', { name: 'Collectibles' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Jars' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/test', query: { t: 'Explore', nt: 'The Jars', dnt: 'Jars' } }, undefined, { shallow: true });
  });
});
