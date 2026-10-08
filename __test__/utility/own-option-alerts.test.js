import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld5Alerts } from '@utility/dashboard/account';
import { alchemyAlerts, cardsAlert } from '@utility/dashboard/characters';
import { baseTrackers } from '@utility/dashboard/baseTrackers';

const gamingAccount = {
  finishedWorlds: { World4: true },
  gaming: { unlocked: true, availableSprouts: 0, availableDrops: 10, sproutsCapacity: 5, imports: [] }
};
const gamingDrops = (options) => getWorld5Alerts(gamingAccount, { gaming: { checked: true } }, { gaming: options }, [])?.gaming?.drops;

const passiveCharacter = { cards: { equippedCards: [{ effect: '+5% Damage (Passive)' }] } };
const idleAccount = { alchemy: { activities: { 0: { activity: -1 } } } };

describe('alerts that get their own option', () => {
  it('declares the three options on by default', () => {
    expect(baseTrackers.account['World 5'].gaming.options.find(({ name }) => name === 'drops')?.checked).toBe(true);
    expect(baseTrackers.characters.cards.options.find(({ name }) => name === 'passiveCards')?.checked).toBe(true);
    expect(baseTrackers.characters.alchemy.options.find(({ name }) => name === 'noActivity')?.checked).toBe(true);
  });

  it('gaming drops follow the drops option, not sprouts', () => {
    expect(gamingDrops({ sprouts: { checked: false }, drops: { checked: true } })).toBe(10);
    expect(gamingDrops({ sprouts: { checked: true }, drops: { checked: false } })).toBeUndefined();
  });

  it('passive cards follow their own option, not card set', () => {
    expect(cardsAlert({}, [], passiveCharacter, null, { cards: { cardSet: { checked: false }, passiveCards: { checked: true } } })?.passiveCards).toBe(true);
    expect(cardsAlert({}, [], passiveCharacter, null, { cards: { cardSet: { checked: false }, passiveCards: { checked: false } } })?.passiveCards).toBeUndefined();
  });

  it('no alchemy activity can be turned off', () => {
    expect(alchemyAlerts(idleAccount, [], { playerId: 0 }, null, { alchemy: { noActivity: { checked: true } } })?.noActivity).toBe(true);
    expect(alchemyAlerts(idleAccount, [], { playerId: 0 }, null, { alchemy: { noActivity: { checked: false } } })?.noActivity).toBeUndefined();
  });
});
