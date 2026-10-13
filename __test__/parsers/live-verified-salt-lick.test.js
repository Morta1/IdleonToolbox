import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getSaltLick, getSaltLickBonus } from '@parsers/world-3/saltLick';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth.
// latest.json is that account's save (SaltLick levels match). Refinery4/5/6 kept refining after the export,
// so only the salts whose owned count did not move are pinned.
const GAME = {
  // SaltLick(i) for every upgrade
  bonuses: [10, 8, 138, 4.2, 20, 87, 50, 10, 30, 12.100000000000001, 0],
  // TowerInfo[3]: the Salt Lick building level, one upgrade shown per level
  unlockedCount: 11,
  // ItemsAndStorageOWNED, the "have / cost" count: storage plus the salts parked in the refinery
  // (Refinery2 has 612 in a refinery slot). The logged-in character's inventory counts too; it held no salt
  // live (2026-10-13), so that branch is pinned by the code-derived test below
  owned: { Refinery1: 989365649, Refinery2: 1050000612, Refinery3: 1048995353 }
};

const { account } = parseFixture(latest);

describe('salt lick verified against the live game', () => {
  it('bonus of every upgrade', () => {
    expect(account.saltLick.map((_, index) => getSaltLickBonus(account.saltLick, index))).toEqual(GAME.bonuses);
  });

  it('upgrades shown by the building level', () => {
    expect(account.saltLick.filter(({ unlocked }) => unlocked)).toHaveLength(GAME.unlockedCount);
  });

  it.each(Object.entries(GAME.owned))('owned %s', (rawName, owned) => {
    account.saltLick.filter((bonus) => bonus.rawName === rawName)
      .forEach(({ totalAmount }) => expect(totalAmount).toBe(owned));
  });
});

// Code-derived (no live state with salt in the bag): ItemsAndStorageOWNED starts from the LOGGED-IN character's
// ItemsOwnedMap, so only the newest PTimeAway character's bag adds to storage
describe('salt lick owned count from the logged-in inventory', () => {
  it('adds the logged-in character bag, not the others', () => {
    const characters = [
      { afkTime: 100, inventory: [{ rawName: 'Refinery1', amount: 1000 }] },
      { afkTime: 200, inventory: [{ rawName: 'Refinery1', amount: 7 }] }
    ];
    const storage = [{ rawName: 'Refinery1', amount: 50 }];
    const refinery1 = getSaltLick({}, storage, characters).find(({ rawName }) => rawName === 'Refinery1');
    expect(refinery1.totalAmount).toBe(57);
  });
});
