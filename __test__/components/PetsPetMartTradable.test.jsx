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
// The toolbar (Show, Details, the sort) and the view are remembered in localStorage; each test starts from the defaults.
beforeEach(() => localStorage.clear());
const renderPets = (copies, { plusView = false, filter, petMart, details = false } = {}) => {
  const companions = getCompanions({ l: copies }, []);
  const { container } = render(
    <ThemeProvider theme={theme}>
      <AppContext.Provider value={{ state: { account: { companions, tournament: { petMart } }, lastUpdated: Date.now() }, reparseOwnAccount: vi.fn() }}>
        <Pets/>
      </AppContext.Provider>
    </ThemeProvider>
  );
  if (plusView) fireEvent.click(container.querySelector('button[value="plus"]'));
  const pick = (value) => fireEvent.click(container.querySelector(`[role="group"][aria-label="Show"] button[value="${value}"]`));
  if (filter) pick(filter);
  if (details) fireEvent.click(within(container).getByRole('button', { name: 'Details' }));
  // A pet's card is the one its title names: the pet, or its + version (the Pet Mart+ view, or once upgraded)
  const cardOf = (index) => {
    const name = nameOf(index);
    return [...container.querySelectorAll('article')].find((card) => [name, `${name}+`].includes(card.querySelector('h3')?.textContent)) ?? null;
  };
  // The title and the copies at its right
  const headOf = (index) => `${cardOf(index).querySelector('h3').textContent}${cardOf(index).querySelector('[data-aside]')?.textContent ?? ''}`;
  const textOf = (index) => cardOf(index).textContent;
  return { cardOf, headOf, textOf, pick, container };
};

const nameOf = (index) => catalog.list[index].name.replace(/_/g, ' ');
// The card's words no bonus text holds, in order: a state, the reason for a dim, and its fact rows (the label over a
// price is Pet Mart+)
const FACTS = /Owned|Upgraded|Needs the base pet|Pet Mart\+ tradable\d+ \/ \d+|Tradable\d+ \/ \d+|Pet Mart\+/g;
const factsOf = (text) => text.match(FACTS) ?? [];
const saleOf = (text) => text.match(/Last in the Pet Mart(Today|\w+ \d+)/)?.[1] ?? null;

describe('Pets page: Pet Mart+ tradability', () => {
  it('counts tradable + copies apart from base copies, and shows no + line on a pet never upgraded', () => {
    const { headOf, textOf } = renderPets([
      // An untradable + copy, with a base copy of the same pet tradable
      '1,1,0,0,0', '1,0,0,0,1',
      // Several copies upgraded, one of them tradable
      '2,1,0,0,1', '2,0,0,0,1',
      // Never upgraded: Details prices the upgrade under a Pet Mart+ label
      '3,1,0,0,0'
    ], { details: true });
    expect([1, 2, 3].map((index) => [headOf(index), factsOf(textOf(index))])).toEqual([
      [`${nameOf(1)}+x2`, ['Tradable1 / 2', 'Pet Mart+ tradable0 / 1']],
      [`${nameOf(2)}+x2`, ['Tradable1 / 2', 'Pet Mart+ tradable1 / 2']],
      [`${nameOf(3)}x1`, ['Tradable1 / 1', ...(catalog.list[3].upgradeCost > 0 ? ['Pet Mart+'] : [])]]
    ]);
  });

  // Details off: the name, the copies and the bonus; the Tradable filter brings back the row it filters by
  it('keeps the fact rows behind Details, except the tradable copies under the Tradable filter', () => {
    const { textOf, pick } = renderPets(['3,1,0,0,0']);
    const compact = factsOf(textOf(3));
    pick('tradable');
    expect({ compact, filtered: factsOf(textOf(3)) }).toEqual({ compact: [], filtered: ['Tradable1 / 1'] });
  });
});

describe('Pets page: Pet Mart+ view', () => {
  const pooled = catalog.list.map((comp, index) => ({ ...comp, index })).filter((comp) => comp.upgradeCost > 0);
  const [upgradedPet, ownedPet, unownedPet] = pooled;
  const noPlusIndex = catalog.list.findIndex((comp) => comp.name && comp.effect && !(comp.upgradeCost > 0));
  // upgradedPet: one tradable + copy; ownedPet: a base copy only; unownedPet: no copy at all.
  const copies = [`${upgradedPet.index},1,0,0,1`, `${ownedPet.index},1,0,0,0`];

  // A card reads the + copies once upgraded, else the upgrade's crystal price (the view's subject, so outside Details);
  // a pet with no copy to upgrade dims and says why
  it('lists only the + pool, each as its + version, priced by what you own', () => {
    const { cardOf, headOf, textOf, container } = renderPets(copies, { plusView: true, details: true });
    expect(container.textContent).toMatch(/Upgraded\s*1 \/ \d+/);
    expect(cardOf(noPlusIndex)).toBeNull();
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => [headOf(pet.index),
      cardOf(pet.index).querySelector('img[alt="Pet Crystals"]') !== null, factsOf(textOf(pet.index))])).toEqual([
      [`${nameOf(upgradedPet.index)}+x1`, false, ['Tradable1 / 1']],
      [`${nameOf(ownedPet.index)}+`, true, ['Pet Mart+']],
      [`${nameOf(unownedPet.index)}+`, true, ['Needs the base pet', 'Pet Mart+']]
    ]);
  });

  it('Missing hides upgraded pets, Tradable keeps only tradable + copies', () => {
    const { cardOf, pick } = renderPets(copies, { plusView: true, filter: 'missing' });
    const missing = [upgradedPet, ownedPet, unownedPet].map((pet) => cardOf(pet.index) !== null);
    pick('tradable');
    expect({ missing, tradable: [upgradedPet, ownedPet, unownedPet].map((pet) => cardOf(pet.index) !== null) })
      .toEqual({ missing: [false, true, true], tradable: [true, false, false] });
  });
});

describe('Pets page: Pet Mart+ sales history', () => {
  beforeEach(() => {
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
  // One render per row reads every pet in it, from its card's foot (Details on). The + view: seen on two days shows the
  // latest, seen once, in today's rotation, never seen. The base view: seen by a logged rotation, in today's rotation,
  // only its upgrade was seen. Without the history only today's rotation is known.
  it.each([
    ['+ view', true, true, [[loggedPet, 'Oct 10'], [olderPet, 'Aug 25'], [todayPet, 'Today'], [unseenPet, null]]],
    ['base view', false, true, [[olderPet, 'Oct 10'], [unseenPet, 'Today'], [loggedPet, null]]],
    ['+ view without the history', true, false, [[todayPet, 'Today'], [loggedPet, null]]]
  ])('%s says when each pet was last in the Pet Mart', (_, plusView, history, rows) => {
    if (history) Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { textOf } = renderPets([], { plusView, petMart, details: true });
    expect(rows.map(([pet]) => [pet, saleOf(textOf(pet))])).toEqual(rows);
  });

  // Sorted by it, every card shows its date without Details
  it('sorts by last in the Pet Mart, newest first until its direction button flips it, each card with its date', () => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { cardOf, textOf, container } = renderPets([], { plusView: true, petMart });
    const positions = (indexes) => indexes.map((index) => cardOf(index))
      .every((card, i, cards) => i === 0 || Boolean(cards[i - 1].compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING));
    const unsorted = saleOf(textOf(loggedPet));
    fireEvent.mouseDown(within(container).getByRole('combobox', { name: 'Sort by' }));
    fireEvent.click(document.querySelector('li[data-value="lastSeen"]'));
    const newestFirst = positions([todayPet, loggedPet, olderPet, unseenPet]);
    const sorted = saleOf(textOf(loggedPet));
    fireEvent.click(within(container).getByRole('button', { name: 'Most recent first, click to flip' }));
    expect({ unsorted, sorted, newestFirst, oldestFirst: positions([unseenPet, olderPet, loggedPet, todayPet]) })
      .toEqual({ unsorted: null, sorted: 'Oct 10', newestFirst: true, oldestFirst: true });
  });
});

describe('Pet Mart tab: Past rotations', () => {
  beforeEach(() => {
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
