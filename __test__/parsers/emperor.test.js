import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { emperorBonuses } from '@website-data';
import { getEmperor } from '@parsers/world-6/emperor';
import { getWorld6Alerts } from '@utility/dashboard/account';

const emperorAt = (level) => getEmperor(null, { accountOptions: { 369: level } });

// purchases = OptionsListAccount[382], jade = Emperor_Season_Pass owned, attempts = what the panel prints
const emperorAccount = ({ purchases, jade, attempts = 0 }) => ({
  accountOptions: { 370: 1 - attempts, 382: purchases },
  sneaking: { jadeEmporium: [{ name: 'Emperor_Season_Pass', unlocked: jade }] }
});

// Oracle: the daily reset in N.js, with OptionsListAccount[370] counting attempts used
const gameRefill = (used, purchases, jade, roll) => {
  const daily = Math.round(1 + purchases);
  const maxStack = Math.round(5 * jade + 6 * purchases + 5);
  if (Math.round(used - daily) > -1 * maxStack) {
    used = Math.round(used - daily);
    if (roll && jade === 1 && Math.round(used - 1) > -1 * maxStack) used = Math.round(used - 1);
  }
  return used;
};
const gameRefillLoses = (attempts, purchases, jade) => {
  const used = 1 - attempts;
  const gained = used - gameRefill(used, purchases, jade, true);
  return gained < Math.round(1 + purchases) + jade;
};

const upgradeTiers = [0, 1, 2].flatMap((purchases) => [0, 1].map((jade) => [purchases, jade]));

describe('emperor attempt stacking', () => {
  it.each(upgradeTiers)('noWasteAttempts is the first count a refill loses (purchases %i, jade %i)', (purchases, jade) => {
    const { noWasteAttempts, maxAttempts } = getEmperor(null, emperorAccount({ purchases, jade: !!jade }));
    const firstLoss = Array.from({ length: maxAttempts + 1 }, (_, attempts) => attempts)
      .find((attempts) => gameRefillLoses(attempts, purchases, jade));
    expect(noWasteAttempts).toBe(firstLoss);
  });

  it.each([
    // purchases, jade, attempts, configured threshold, fires
    [0, false, 4, 19, false],
    [0, false, 5, 19, true],
    [0, true, 9, 19, true],
    [2, true, 18, 19, false],
    [2, true, 19, 19, true],
    [2, true, 15, 15, true]
  ])('alert with purchases %i, jade %s at %i attempts (threshold %i) fires: %s', (purchases, jade, attempts, value, fires) => {
    const account = { finishedWorlds: { World5: true }, emperor: getEmperor(null, emperorAccount({ purchases, jade, attempts })) };
    const options = { etc: { emperor: { name: 'emperor', checked: true, props: { value } } } };
    const alerts = getWorld6Alerts(account, { etc: { checked: true } }, options, []);
    expect(alerts?.etc?.emperorAttempts).toBe(fires ? attempts : undefined);
  });
});

describe('emperor upcoming bonuses', () => {
  // The bonus listed first must be the one whose total grows when that level is beaten.
  it.each([0, 5, 47, 48, emperorBonuses.length * 2 + 3])('lists the next unlock at showdown %i', (level) => {
    const before = emperorAt(level);
    const after = emperorAt(level + 1);
    const grown = after.bonuses.filter((bonus, index) => bonus.totalBonus > before.bonuses[index].totalBonus);
    const [next] = before.upcomingBonuses;

    expect(next.level).toBe(level + 1);
    expect(grown.map(({ rawIndex }) => rawIndex)).toEqual([next.rawIndex]);
    expect(before.upcomingBonuses.map(({ level }) => level))
      .toEqual(Array.from({ length: before.upcomingBonuses.length }, (_, offset) => level + offset + 1));
  });
});
