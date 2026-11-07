// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { getCompanions } from '@parsers/misc';
import { formatNum } from '@utility/helpers';

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
  // A pet's tile is the button its sprite names: the pet, or its + version (the Pet Mart+ view, or once upgraded)
  const tileOf = (index) => {
    const name = nameOf(index);
    return [...container.querySelectorAll('[role="button"]')]
      .find((tile) => [name, `${name}+`].includes(tile.querySelector('img')?.getAttribute('alt'))) ?? null;
  };
  // A click pins the tile's note, which describes the tile
  const noteOf = (index) => {
    const tile = tileOf(index);
    fireEvent.click(tile);
    return document.getElementById(tile.getAttribute('aria-describedby'))?.textContent ?? null;
  };
  return { tileOf, noteOf, container };
};

const nameOf = (index) => catalog.list[index].name.replace(/_/g, ' ');
// The note's words no bonus text holds, in order: its state, its copies, and Pet Mart+ (the meta of an upgraded pet, or
// the label over a price)
const FACTS = /Owned|Upgraded|Needs the base pet|Pet Mart\+ tradable\d+ \/ \d+|Tradable\d+ \/ \d+|Pet Mart\+/g;
const factsOf = (note) => note.match(FACTS) ?? [];
const saleOf = (note) => note.match(/In the Pet Mart today|Last appeared \w+ \d+/)?.[0] ?? null;

describe('Pets page: Pet Mart+ tradability', () => {
  it('counts tradable + copies apart from base copies, and shows no + line on a pet never upgraded', () => {
    const { tileOf, noteOf } = renderPets([
      // An untradable + copy, with a base copy of the same pet tradable
      '1,1,0,0,0', '1,0,0,0,1',
      // Several copies upgraded, one of them tradable
      '2,1,0,0,1', '2,0,0,0,1',
      // Never upgraded: its note prices the upgrade under a Pet Mart+ label
      '3,1,0,0,0'
    ]);
    expect([1, 2, 3].map((index) => [tileOf(index).textContent, factsOf(noteOf(index))])).toEqual([
      [`${nameOf(1)}+x2`, ['Owned', 'Pet Mart+', 'Tradable1 / 2', 'Pet Mart+ tradable0 / 1']],
      [`${nameOf(2)}+x2`, ['Owned', 'Pet Mart+', 'Tradable1 / 2', 'Pet Mart+ tradable1 / 2']],
      [`${nameOf(3)}x1`, ['Owned', 'Tradable1 / 1', ...(catalog.list[3].upgradeCost > 0 ? ['Pet Mart+'] : [])]]
    ]);
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

  // A tile reads the + copies once upgraded, else the upgrade's crystal price; only a pet with no copy to upgrade greys
  it('lists only the + pool, each as its + version, priced and greyed by what you own', () => {
    const { tileOf, noteOf, container } = renderPets(copies, { plusView: true });
    expect(container.textContent).toMatch(/Upgraded\s*1 \/ \d+/);
    expect(tileOf(noPlusIndex)).toBeNull();
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => {
      const tile = tileOf(pet.index);
      return [tile.textContent, tile.querySelector('img[alt="Pet Crystals"]') !== null, tile.querySelector('[data-status="missing"]') !== null,
        factsOf(noteOf(pet.index))];
    })).toEqual([
      [`${nameOf(upgradedPet.index)}+x1`, false, false, ['Upgraded', 'Tradable1 / 1']],
      [`${nameOf(ownedPet.index)}+${formatNum(ownedPet.upgradeCost, 'whole')}`, true, false, []],
      [`${nameOf(unownedPet.index)}+${formatNum(unownedPet.upgradeCost, 'whole')}`, true, true, ['Needs the base pet']]
    ]);
  });

  it('Missing hides upgraded pets, Tradable keeps only tradable + copies', () => {
    const { tileOf, container } = renderPets(copies, { plusView: true, filter: 'missing' });
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => tileOf(pet.index) !== null)).toEqual([false, true, true]);
    fireEvent.mouseDown(within(container).getByRole('combobox', { name: 'Show' }));
    fireEvent.click(document.querySelector('li[data-value="tradable"]'));
    expect([upgradedPet, ownedPet, unownedPet].map((pet) => tileOf(pet.index) !== null)).toEqual([true, false, false]);
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
  // One render per row reads every pet in it, from its tile's note. The + view: seen on two days shows the latest, seen
  // once, in today's rotation, never seen. The base view: seen by a logged rotation, in today's rotation, only its upgrade
  // was seen. Without the history only today's rotation is known.
  it.each([
    ['+ view', true, true, [[loggedPet, 'Last appeared Oct 10'], [olderPet, 'Last appeared Aug 25'], [todayPet, 'In the Pet Mart today'], [unseenPet, null]]],
    ['base view', false, true, [[olderPet, 'Last appeared Oct 10'], [unseenPet, 'In the Pet Mart today'], [loggedPet, null]]],
    ['+ view without the history', true, false, [[todayPet, 'In the Pet Mart today'], [loggedPet, null]]]
  ])('%s says when each pet was last in the Pet Mart', (_, plusView, history, rows) => {
    if (history) Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { noteOf } = renderPets([], { plusView, petMart });
    expect(rows.map(([pet]) => [pet, saleOf(noteOf(pet))])).toEqual(rows);
  });

  it('sorts by last in the Pet Mart, newest first until its direction button flips it', () => {
    Object.assign(petMartHistory, { data: { days }, isSuccess: true });
    const { tileOf, container } = renderPets([], { plusView: true, petMart });
    const expectOrder = (indexes) => {
      const order = indexes.map((index) => tileOf(index));
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
