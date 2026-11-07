// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { getCompanions } from '@parsers/misc';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));
// The worker's Pet Mart history; each test sets what the API "returned".
const petMartHistory = vi.hoisted(() => ({ data: undefined, isSuccess: false, isPending: false, isError: false, refetch: () => {} }));
vi.mock('@hooks/usePetMartHistory', () => ({ usePetMartHistory: () => petMartHistory }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Pets = (await import('../../pages/account/prem-currency/pets')).default;

// companion index 1 = Rift_Slug
const catalog = getCompanions({ l: [] }, []);
const renderPets = (copies, { plusView = false, filter, petMart } = {}) => {
  const companions = getCompanions({ l: copies }, []);
  const { container } = render(
    <ThemeProvider theme={theme}>
      <AppContext.Provider value={{ state: { account: { companions, tournament: { petMart } }, lastUpdated: Date.now() }, reparseOwnAccount: vi.fn() }}>
        <Pets/>
      </AppContext.Provider>
    </ThemeProvider>
  );
  if (plusView) fireEvent.click(container.querySelector('button[value="plus"]'));
  if (filter) {
    fireEvent.mouseDown(within(container).getByRole('combobox', { name: 'Show' }));
    fireEvent.click(document.querySelector(`li[data-value="${filter}"]`));
  }
  // A pet's card is the article titled by its name (its + version's in the Pet Mart+ view)
  const cardOf = (index) => {
    const name = companions.list[index].name.replace(/_/g, ' ');
    return [...container.querySelectorAll('article')]
      .find((card) => [name, `${name}+`].includes(card.querySelector('h3')?.textContent)) ?? null;
  };
  return { cardOf, companions, container };
};

// The card's meta line, under its title
const metaOf = (card) => card.querySelector('h3')?.nextElementSibling?.textContent ?? null;

describe('Pets page: Pet Mart+ tradability', () => {
  it('counts tradable + copies apart from base copies, and shows no + line on a pet never upgraded', () => {
    const { cardOf } = renderPets([
      // An untradable + copy, with a base copy of the same pet tradable
      '1,1,0,0,0', '1,0,0,0,1',
      // Several copies upgraded, one of them tradable
      '2,1,0,0,1', '2,0,0,0,1',
      // Never upgraded
      '3,1,0,0,0'
    ]);
    expect(cardOf(1).textContent).toContain('Tradable1 / 2');
    expect(cardOf(1).textContent).toContain('Pet Mart+ tradable0 / 1');
    expect(metaOf(cardOf(1))).toBe('Pet Mart+');
    expect(cardOf(2).textContent).toContain('Pet Mart+ tradable1 / 2');
    expect(metaOf(cardOf(2))).toBe('Pet Mart+');
    expect(cardOf(3).textContent).toContain('Tradable1 / 1');
    expect(cardOf(3).textContent).not.toContain('Pet Mart+ tradable');
  });
});

describe('Pets page: Pet Mart+ view', () => {
  // The Base / Pet Mart+ choice is remembered in localStorage; each test starts from Base.
  beforeEach(() => localStorage.clear());
  const pooled = catalog.list.map((comp, index) => ({ ...comp, index })).filter((comp) => comp.upgradeCost > 0);
  const [upgradedPet, ownedPet, unownedPet] = pooled;
  const noPlusIndex = catalog.list.findIndex((comp) => comp.name && comp.effect && !(comp.upgradeCost > 0));
  // upgradedPet: one tradable + copy; ownedPet: a base copy only; unownedPet: no copy at all.
  const copies = [`${upgradedPet.index},1,0,0,1`, `${ownedPet.index},1,0,0,0`];

  it('lists only the + pool, each as its + version with the + bonus, priced and greyed by what you own', () => {
    const { cardOf, container } = renderPets(copies, { plusView: true });
    expect(container.textContent).toMatch(/Upgraded\s*1 \/ \d+/);
    expect(cardOf(noPlusIndex)).toBeNull();
    const card = cardOf(upgradedPet.index);
    expect(card.textContent).toContain(`${upgradedPet.name.replace(/_/g, ' ')}+`);
    expect(card.textContent).toContain('Tradable1 / 1');
    // The sprite greys, never the card, so the Pet Mart line under it stays readable.
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => {
      const shown = cardOf(pet.index);
      return [shown.querySelector('img[alt="Pet Crystals"]') !== null, shown.textContent.includes('Needs the base pet'), shown.querySelector('[data-status="missing"]') !== null];
    })).toEqual([
      [false, false, false],
      [true, false, false],
      [true, true, true]
    ]);
  });

  it('Missing hides upgraded pets, Tradable keeps only tradable + copies', () => {
    const { cardOf, container } = renderPets(copies, { plusView: true, filter: 'missing' });
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => cardOf(pet.index) !== null)).toEqual([false, true, true]);
    fireEvent.mouseDown(within(container).getByRole('combobox', { name: 'Show' }));
    fireEvent.click(document.querySelector('li[data-value="tradable"]'));
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => cardOf(pet.index) !== null)).toEqual([true, false, false]);
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

  const [loggedPet, olderPet, todayPet, unseenPet] = catalog.list
    .map((comp, index) => ({ ...comp, index }))
    .filter((comp) => comp.upgradeCost > 0)
    .map((comp) => comp.index);
  const days = [
    { date: '2026-10-10', shopDay: 225, source: 'live', base: [{ index: olderPet, list: 50, price: 50 }], plus: [{ index: loggedPet, list: 900, price: 900 }] },
    { date: '2026-08-25', shopDay: 179, source: 'live', base: [], plus: [{ index: loggedPet, list: 900, price: 900 }, { index: olderPet, list: 400, price: 400 }] }
  ];
  // Today the base counter sells unseenPet and the + counter sells todayPet's upgrade.
  const petMart = {
    shopDay: 235,
    offers: [{ companionIndex: unseenPet, listPrice: 80, price: 80 }],
    plusOffers: [{ companionIndex: todayPet, listPrice: 500, price: 500 }]
  };
  const footerOf = (cardOf, index) => cardOf(index).textContent;

  // One render per view reads every pet in it. The + view: seen on two days shows the latest, seen once, in today's
  // rotation, never seen. The base view: seen by a logged rotation, in today's rotation, only its upgrade was seen.
  it.each([
    ['+', true, () => [[loggedPet, 'Last appeared Oct 10'], [olderPet, 'Last appeared Aug 25'], [todayPet, 'In the Pet Mart today'], [unseenPet, null]]],
    ['base', false, () => [[olderPet, 'Last appeared Oct 10'], [unseenPet, 'In the Pet Mart today'], [loggedPet, null]]]
  ])('%s view says when each pet was last in the Pet Mart', (_, plusView, rows) => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { cardOf } = renderPets([], { plusView, petMart });
    for (const [pet, line] of rows()) {
      const text = footerOf(cardOf, pet);
      if (line) expect(text).toContain(line);
      else expect(text).not.toMatch(/in the Pet Mart|appeared/i);
    }
  });

  it('keeps the Pet Mart line unfaded on a missing pet', () => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { cardOf } = renderPets([], { petMart });
    const card = cardOf(unseenPet);
    expect(card.querySelector('[data-status="missing"]')).not.toBeNull();
    const line = [...card.querySelectorAll('p')].find((p) => p.textContent === 'In the Pet Mart today');
    const faded = [];
    for (let node = line; node !== card; node = node.parentElement) faded.push(getComputedStyle(node).opacity);
    expect(faded.every((opacity) => Number(opacity || 1) === 1)).toBe(true);
  });

  it("shows only today's offers while the history is unavailable", () => {
    const { cardOf } = renderPets([], { plusView: true, petMart });
    expect(footerOf(cardOf, todayPet)).toContain('In the Pet Mart today');
    expect(footerOf(cardOf, loggedPet)).not.toMatch(/appeared/i);
  });

  it('sorts by last in the Pet Mart, newest first until its direction button flips it', () => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { cardOf, container } = renderPets([], { plusView: true, petMart });
    const expectOrder = (indexes) => {
      const order = indexes.map((index) => cardOf(index));
      for (let i = 1; i < order.length; i++) {
        expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    };
    fireEvent.mouseDown(within(container).getByRole('combobox', { name: 'Sort by' }));
    fireEvent.click(document.querySelector('li[data-value="lastSeen"]'));
    expectOrder([todayPet, loggedPet, olderPet, unseenPet]);
    fireEvent.click(within(container).getByRole('button', { name: 'Most recent first, click to flip' }));
    expectOrder([unseenPet, olderPet, loggedPet, todayPet]);
  });
});

describe('Pet Mart tab: Past rotations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.UTC(2026, 9, 20, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    Object.assign(petMartHistory, { data: undefined, isSuccess: false });
  });

  const petMart = { shopDay: 235, offers: [{ companionIndex: 9, listPrice: 250, price: 250 }], plusOffers: [] };
  const logged = (date, shopDay) => ({ date, shopDay, source: 'live', base: [{ index: 9, list: 250, price: 250 }], plus: [] });
  const sectionText = async (days) => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const PetMart = (await import('@components/account/Pets/PetMart')).default;
    const { container } = render(<ThemeProvider theme={theme}>
      <PetMart petMart={petMart} companions={getCompanions({ l: [] }, []).list} lastUpdated={Date.now()}/>
    </ThemeProvider>);
    const text = container.textContent;
    return text.slice(text.indexOf('Past rotations'));
  };

  it.each([
    ['nothing logged yet', [], null, true],
    ['only today logged', [logged('2026-10-19', 235)], 'Logged daily since Oct 19', true],
    ['a past day logged', [logged('2026-10-19', 235), logged('2026-10-18', 234)], 'Logged daily since Oct 18', false]
  ])('%s', async (_, days, since, empty) => {
    const text = await sectionText(days);
    expect(text.startsWith('Past rotations')).toBe(true);
    if (since) expect(text).toContain(since);
    else expect(text).not.toContain('Logged daily since');
    expect(text.includes('Past rotations show up here after the next restock.')).toBe(empty);
    expect(text.includes('Oct 18, 2026')).toBe(!empty);
  });
});
