// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

// The tabs each draw a whole sub-page; this test covers the stat cards above them.
vi.mock('@components/common/Tabber', () => ({ default: () => null }));
// The header's slots exist only inside the shell: the picker renders in place and the gear into the body.
vi.mock('@components/common/NavBar/PageHeader', () => ({
  usePageHeaderSlot: () => document.body,
  PageHeaderControl: ({ children }) => children
}));

const { AppContext } = await import('@components/common/context/AppProvider');
const ClamWork = (await import('../../pages/account/world-7/clam-work')).default;

const { characters, account } = parseFixture(raw);

const renderPage = () => render(
  <ThemeProvider theme={theme}>
    <AppContext.Provider value={{ state: { characters, account } }}>
      <ClamWork/>
    </AppContext.Provider>
  </ThemeProvider>
);

// The card wraps title and value in one element, so this reads the whole card's text.
const cardText = (title) => screen.getByText(title).closest('[data-stat-tile]').textContent;

describe('Clam Work page', () => {
  it('renders the clam stat cards', () => {
    renderPage();
    expect(cardText('Worker class')).toContain('Lv 5');
    expect(cardText('Clam mobs')).toContain('13');
    expect(cardText('Black pearl value')).toContain('450');
  });

  it('recalculates pearl value from the multikill input', () => {
    renderPage();
    expect(cardText('Pearl value multiplier')).toContain('41');
    fireEvent.click(screen.getByRole('button', { name: /Page settings/ }));
    // Well above the auto-suggested multikill, so the override has to visibly move the value.
    fireEvent.change(screen.getByLabelText('Multikill'), { target: { value: '3585' } });
    expect(cardText('Pearl value multiplier')).toContain('73');
  });
});
