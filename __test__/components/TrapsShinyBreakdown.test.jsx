// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';
import { getTrapsBonuses } from '@parsers/world-3/traps';
import { formatNum } from '@utility/helpers';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));
// The header's slots exist only inside the shell: the picker renders in place.
vi.mock('@components/common/NavBar/PageHeader', () => ({
  usePageHeaderSlot: () => document.body,
  PageHeaderControl: ({ children }) => children
}));

const { AppContext } = await import('@components/common/context/AppProvider');
const Traps = (await import('../../pages/account/world-3/traps')).default;

const { characters, account } = parseFixture(raw);

// A Summary tile's whole text: its label, value and sub.
const tileText = (label) => screen.getByText(label).closest('[data-card-title-value]').textContent;

const renderPage = (state) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state }}>
      <Traps/>
    </AppContext.Provider>
  </ThemeProvider>
);

describe('Traps shiny chance', () => {
  it('shows the shiny multi under the collect rates', () => {
    renderPage({ characters, account });
    expect(tileText('Shiny chance')).toMatch(/^Shiny chance[\d.,KMBTQ]+x\d+ per drop$/);
  });

  it('opens the breakdown from its button', () => {
    renderPage({ characters, account });
    fireEvent.keyDown(screen.getByRole('button', { name: /^Shiny chance breakdown/ }), { key: 'Enter' });

    const drawer = within(screen.getByRole('dialog'));
    expect(drawer.getByText('Shiny chance')).toBeDefined();
    expect(drawer.getByText('On placement')).toBeDefined();
    expect(drawer.getByText('On collection')).toBeDefined();
  });

  it('opens each collect rate\'s own breakdown from its tile', () => {
    renderPage({ characters, account });
    fireEvent.click(screen.getByRole('button', { name: /^Critter collect rate breakdown/ }));

    const drawer = within(screen.getByRole('dialog'));
    expect(drawer.getByText(/^Critter collect rate$/)).toBeDefined();
    expect(drawer.queryByText(/^EXP collect rate$/)).toBeNull();
  });

  it('renders logged out, with no character to collect as', () => {
    expect(() => renderPage({})).not.toThrow();
    expect(tileText('Shiny chance')).toBe('Shiny chance1.00x1 per drop');
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('Traps collector selection', () => {
  const collectRates = () => tileText('Critter collect rate');
  const shinyMulti = () => tileText('Shiny chance');

  it('defaults to the character with the best critter rate', () => {
    const { perCharacter } = getTrapsBonuses(account, characters);
    const best = perCharacter.reduce((res, rate) => rate.critter > res.critter ? rate : res);
    renderPage({ characters, account });

    expect(screen.getByRole('combobox').textContent).toBe(`Collect as${best.name}`);
    expect(collectRates()).toContain(formatNum(best.critter * 100, 'pct'));
  });

  it('moves both the collect rate and the shiny multi onto the picked character', () => {
    const { perCharacter } = getTrapsBonuses(account, characters);
    const best = perCharacter.reduce((res, rate) => rate.critter > res.critter ? rate : res);
    const other = perCharacter.find(({ critter, name }) => critter !== best.critter && name !== best.name);
    expect(other).toBeDefined();

    renderPage({ characters, account });
    const rateBefore = collectRates();
    const multiBefore = shinyMulti();

    fireEvent.mouseDown(screen.getByRole('combobox'));
    // The character rows below the picker repeat every name, so stay inside the open menu.
    fireEvent.click(within(screen.getByRole('listbox')).getByText(other.name));

    expect(collectRates()).toContain(formatNum(other.critter * 100, 'pct'));
    expect(collectRates()).not.toBe(rateBefore);
    expect(shinyMulti()).not.toBe(multiBefore);
  });
});
