// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { getCompanions } from '@parsers/misc';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));
// The worker's Pet Mart history; each test sets what the API "returned".
const petMartHistory = vi.hoisted(() => ({ data: undefined, isSuccess: false }));
vi.mock('@hooks/usePetMartHistory', () => ({ usePetMartHistory: () => petMartHistory }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Pets = (await import('../../pages/account/prem-currency/pets')).default;

// companion index 1 = Rift_Slug
const renderPets = (copies, { plusView = false, filter, petMart } = {}) => {
  const companions = getCompanions({ l: copies }, []);
  const { container } = render(
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state: { account: { companions, tournament: { petMart } } }, reparseOwnAccount: vi.fn() }}>
        <Pets/>
      </AppContext.Provider>
    </ThemeProvider>
  );
  if (plusView) fireEvent.click(container.querySelector('button[value="plus"]'));
  if (filter) fireEvent.click(container.querySelector(`input[value="${filter}"]`));
  const cardOf = (index) => container.querySelector(`img[alt="${companions.list[index].name}"]`)?.closest('.MuiCard-root') ?? null;
  return { cardOf, companions, container };
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

describe('Pets page: Pet Mart+ view', () => {
  // The Base / Pet Mart+ choice is remembered in localStorage; each test starts from Base.
  beforeEach(() => localStorage.clear());
  const { companions: catalog } = renderPets([]);
  const pooled = catalog.list.map((comp, index) => ({ ...comp, index })).filter((comp) => comp.upgradeCost > 0);
  const [upgradedPet, ownedPet, unownedPet] = pooled;
  const noPlusIndex = catalog.list.findIndex((comp) => comp.name && comp.effect && !(comp.upgradeCost > 0));
  // upgradedPet: one tradable + copy; ownedPet: a base copy only; unownedPet: no copy at all.
  const copies = [`${upgradedPet.index},1,0,0,1`, `${ownedPet.index},1,0,0,0`];

  it('lists only the + pool, each as its + version with the + bonus', () => {
    const { cardOf, container } = renderPets(copies, { plusView: true });
    expect(container.textContent).toMatch(/Upgraded 1\/\d+/);
    expect(cardOf(noPlusIndex)).toBeNull();
    const card = cardOf(upgradedPet.index);
    expect(card.textContent).toContain(`${upgradedPet.name.replace(/_/g, ' ')}+`);
    expect(card.textContent).toContain('Tradable: 1/1');
  });

  it.each([
    ['upgraded', () => upgradedPet, false, false, '1'],
    ['owned, not upgraded', () => ownedPet, true, false, '1'],
    ['not owned', () => unownedPet, true, true, '0.4']
  ])('%s: price shown %s, needs base pet %s, opacity %s', (_, pet, price, needsBase, opacity) => {
    const { cardOf } = renderPets(copies, { plusView: true });
    const card = cardOf(pet().index);
    expect(card.querySelector('img[alt="Pet Crystals"]') !== null).toBe(price);
    expect(card.textContent.includes('Needs the base pet')).toBe(needsBase);
    expect(getComputedStyle(card).opacity).toBe(opacity);
  });

  it('Missing hides upgraded pets, Tradable keeps only tradable + copies', () => {
    const missing = renderPets(copies, { plusView: true, filter: 'missing' });
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => missing.cardOf(pet.index) !== null)).toEqual([false, true, true]);
    const tradable = renderPets(copies, { plusView: true, filter: 'tradable' });
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => tradable.cardOf(pet.index) !== null)).toEqual([true, false, false]);
  });
});

describe('Pets page: Pet Mart+ sales history', () => {
  beforeEach(() => {
    localStorage.clear();
    // 12:00 UTC on Oct 20 is inside the rotation that opened at the Oct 19 20:00 UTC restock.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.UTC(2026, 9, 20, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    Object.assign(petMartHistory, { data: undefined, isSuccess: false });
  });

  const { companions: catalog } = renderPets([]);
  const [loggedPet, wikiPet, todayPet, unseenPet] = catalog.list
    .map((comp, index) => ({ ...comp, index }))
    .filter((comp) => comp.upgradeCost > 0)
    .map((comp) => comp.index);
  const days = [
    { date: '2026-10-10', shopDay: 225, source: 'live', base: [], plus: [{ index: loggedPet, list: 900, price: 900 }] },
    { date: '2026-08-25', shopDay: null, source: 'wiki', base: [], plus: [{ index: loggedPet }, { index: wikiPet }] }
  ];
  const petMart = { shopDay: 235, offers: [], plusOffers: [{ companionIndex: todayPet, listPrice: 500, price: 500 }] };
  const footerOf = (cardOf, index) => cardOf(index).textContent;

  it.each([
    ['seen by a logged rotation', () => loggedPet, 'Last seen Oct 10'],
    ['seen only by the wiki', () => wikiPet, 'First seen Aug 25'],
    ["in today's rotation", () => todayPet, 'In the Pet Mart today'],
    ['never seen', () => unseenPet, null]
  ])('%s', (_, pet, line) => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { cardOf } = renderPets([], { plusView: true, petMart });
    const text = footerOf(cardOf, pet());
    if (line) expect(text).toContain(line);
    else expect(text).not.toMatch(/seen|Pet Mart today/);
  });

  it("shows only today's offers while the history is unavailable", () => {
    const { cardOf } = renderPets([], { plusView: true, petMart });
    expect(footerOf(cardOf, todayPet)).toContain('In the Pet Mart today');
    expect(footerOf(cardOf, loggedPet)).not.toMatch(/seen/);
  });

  it('sorts by longest since seen: never seen, then oldest sale, today last', () => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { cardOf, container } = renderPets([], { plusView: true, petMart });
    fireEvent.mouseDown(within(container).getByRole('combobox'));
    fireEvent.click(document.querySelector('li[data-value="longest"]'));
    const order = [unseenPet, wikiPet, loggedPet, todayPet].map((index) => cardOf(index));
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
