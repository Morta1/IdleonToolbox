import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCompanions } from '@parsers/misc';
import { getPetMartGems, getTournament } from '@parsers/world-7/tournament';
import { getNextPetMartRestock } from '@utility/helpers';
import { companions } from '@website-data';

// Pet Mart+ prices live in CompanionDB col 8 (companions.upgradeCost); today's rotation lives in
// the _TOURNAMENT doc (I/B/A base counter, LI/LB/LA plus counter), priced in Pet Crystals.
describe('Pet Mart+ upgrade cost', () => {
  it('carries the price through getCompanions, null where the game has no + version', () => {
    const { list } = getCompanions({ l: ['49,1,0,0,0'], s: 1200 }, []);
    // Bubba the Seal: 4500 on the day the live shop was checked, matching the column.
    expect(list[49].upgradeCost).toBe(4500);
    // Glunko Supreme carries the 9999 placeholder in game data - not a price.
    expect(list[11].upgradeCost).toBeNull();
    expect(list.every((pet) => pet.upgradeCost === null || pet.upgradeCost > 0)).toBe(true);
  });

  it('prices unreleased pets that already have a real cost, so the list is complete', () => {
    const priced = companions
      .map((pet, index) => ({ ...pet, index }))
      .filter((pet) => pet.upgradeCost !== null);
    // Pipsqueak is priced (7200) before its bonus is even revealed.
    expect(priced.find((pet) => pet.rawName === 'r0d')?.upgradeCost).toBe(7200);
    expect(priced.length).toBeGreaterThan(90);
  });
});

describe('Tournament Pet Mart rotation', () => {
  const global = {
    S: 205,
    I: [39, 9, 40, 44, 42], B: [2750, 250, 1250, 550, 1150], A: [2750, 250, 1250, 550, 1150],
    LI: [49, 3, 6, 8, 50], LB: [4500, 1750, 1200, 800, 450], LA: [4500, 1750, 1200, 720, 450]
  };
  const account = { accountOptions: [], companions: { petCrystals: 900 } };

  it('reads both counters as [companionIndex, listPrice, price] with the pet name resolved', () => {
    const { petMart } = getTournament({}, account, { global, user: {}, match: null });
    expect(petMart.shopDay).toBe(205);
    expect(petMart.petCrystals).toBe(900);
    expect(petMart.plusOffers).toHaveLength(5);
    expect(petMart.plusOffers[0]).toEqual({ companionIndex: 49, name: 'Bubba_the_Seal', listPrice: 4500, price: 4500 });
    // A discounted day keeps the list price beside the real one.
    expect(petMart.plusOffers[3]).toEqual({ companionIndex: 8, name: 'Sandy_Pot', listPrice: 800, price: 720 });
    expect(petMart.offers.map((offer) => offer.companionIndex)).toEqual([39, 9, 40, 44, 42]);
  });

  it('is empty, not throwing, without a tournament doc', () => {
    const { petMart } = getTournament({}, { accountOptions: [] }, null);
    expect(petMart).toEqual({ shopDay: 0, gems: { offered: false, claimable: false, amount: 0 }, petCrystals: 0, offers: [], plusOffers: [] });
  });

  it('drops malformed rows instead of producing NaN prices', () => {
    const broken = { ...global, LI: [49, 'x', 6], LB: [4500, 1, 1200], LA: [4500, 2, 'nope'] };
    const { petMart } = getTournament({}, account, { global: broken, user: {}, match: null });
    expect(petMart.plusOffers).toEqual([{ companionIndex: 49, name: 'Bubba_the_Seal', listPrice: 4500, price: 4500 }]);
  });
});

// Live game, 2026-10-19: scripts.ActorEvents_579._customBlock_Stuff2("GemRewardfromPetMart", day, 0)
// with GemPM_x = 1. OptLacc[516] was 236 against shop day 243.
describe('Pet Mart daily free gems', () => {
  it.each([[243, 13], [248, 11], [287, 10], [300, 115], [326, 106], [391, 106]])(
    'shop day %i rolls %i gems, like the game', (shopDay, amount) => {
      expect(getPetMartGems(shopDay, 0, 1).amount).toBe(amount);
    });

  it.each([
    ['unclaimed today', 243, 236, 1, { offered: true, claimable: true, amount: 13 }],
    ['claimed today', 243, 243, 1, { offered: true, claimable: false, amount: 13 }],
    ['switched off by the server', 243, 236, 0.05, { offered: false, claimable: false, amount: 0 }],
    ['before the first shop day', 0, 0, 1, { offered: false, claimable: false, amount: 0 }]
  ])('%s', (_, shopDay, lastClaimed, multiplier, expected) => {
    expect(getPetMartGems(shopDay, lastClaimed, multiplier)).toEqual(expected);
  });

  it('reaches the tournament parser through OptLacc[516] and GemPM_x', () => {
    const { petMart } = getTournament({}, { accountOptions: { 516: 236 } }, { global: { S: 243 } }, { GemPM_x: 1 });
    expect(petMart.gems).toEqual({ offered: true, claimable: true, amount: 13 });
  });
});

describe('Pet Mart restock', () => {
  it.each([
    ['just before the 20:00 UTC restock', '2026-10-19T19:59:00Z', '2026-10-19T20:00:00Z'],
    ['right after it', '2026-10-19T20:00:00Z', '2026-10-20T20:00:00Z'],
    ['in the morning', '2026-10-19T03:00:00Z', '2026-10-19T20:00:00Z']
  ])('%s', (_, now, next) => {
    expect(getNextPetMartRestock(Date.parse(now))).toBe(Date.parse(next));
  });
});
