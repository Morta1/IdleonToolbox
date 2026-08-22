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

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Traps = (await import('../../pages/account/world-3/traps')).default;

const { characters, account } = parseFixture(raw);

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
    expect(screen.getByText(/Shiny:/).textContent).toMatch(/Shiny: [\d.,KMBTQ]+x, \d+ per drop/);
  });

  it('opens the breakdown from the info icon', () => {
    renderPage({ characters, account });
    fireEvent.click(screen.getByText(/Shiny:/).parentElement.querySelector('svg'));

    expect(screen.getByText('Shiny Critter Chance')).toBeDefined();
    expect(screen.getByText('On placement')).toBeDefined();
    expect(screen.getByText('On collection')).toBeDefined();
  });

  it('renders logged out, with no character to collect as', () => {
    expect(() => renderPage({})).not.toThrow();
    expect(screen.getByText(/Shiny:/).textContent).toContain('1.00x, 1 per drop');
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('Traps collector selection', () => {
  const collectRates = () => screen.getByText(/Collect Rates:/).textContent;
  const shinyMulti = () => screen.getByText(/Shiny:/).textContent;

  it('defaults to the character with the best critter rate', () => {
    const { perCharacter } = getTrapsBonuses(account, characters);
    const best = perCharacter.reduce((res, rate) => rate.critter > res.critter ? rate : res);
    renderPage({ characters, account });

    expect(screen.getByRole('combobox').textContent).toBe(best.name);
    expect(collectRates()).toContain(`${Math.round(best.critter * 100)}%`);
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

    expect(collectRates()).toContain(`${Math.round(other.critter * 100)}%`);
    expect(collectRates()).not.toBe(rateBefore);
    expect(shinyMulti()).not.toBe(multiBefore);
  });
});
