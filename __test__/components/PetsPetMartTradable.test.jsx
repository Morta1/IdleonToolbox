// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { getCompanions } from '@parsers/misc';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Pets = (await import('../../pages/account/prem-currency/pets')).default;

// companion index 1 = Rift_Slug
const renderPets = (copies) => {
  const companions = getCompanions({ l: copies }, []);
  const { container } = render(
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state: { account: { companions } }, reparseOwnAccount: vi.fn() }}>
        <Pets/>
      </AppContext.Provider>
    </ThemeProvider>
  );
  const cardOf = (index) => container.querySelector(`img[alt="${companions.list[index].name}"]`).closest('.MuiCard-root');
  return { cardOf };
};

describe('Pets page: Pet Mart+ tradability', () => {
  it('flags an untradable + copy even when a base copy of the same pet is tradable', () => {
    const { cardOf } = renderPets(['1,1,0,0,0', '1,0,0,0,1']);
    const card = cardOf(1);
    expect(card.textContent).toContain('Tradable: 1/2');
    expect(card.textContent).toContain('Pet Mart+ tradable: 0/1');
    expect(card.querySelector('.MuiChip-colorSuccess')?.textContent).toBe('Pet Mart+');
  });

  it('counts only the tradable + copies when several copies are upgraded', () => {
    const { cardOf } = renderPets(['1,1,0,0,1', '1,0,0,0,1']);
    const card = cardOf(1);
    expect(card.textContent).toContain('Pet Mart+ tradable: 1/2');
    expect(card.querySelector('.MuiChip-colorSuccess')?.textContent).toBe('Pet Mart+');
  });

  it('shows no + tradability line on a pet that was never upgraded', () => {
    const { cardOf } = renderPets(['1,1,0,0,0']);
    const card = cardOf(1);
    expect(card.textContent).toContain('Tradable: 1/1');
    expect(card.textContent).not.toContain('Pet Mart+ tradable');
  });
});
