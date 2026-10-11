import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGeneralAlerts, getOptions, getWorld4Alerts, getWorld5Alerts, getWorld6Alerts } from '@utility/dashboard/account';
import { alchemyAlerts, cardsAlert } from '@utility/dashboard/characters';

const run = (fn, account, section) => fn(account, section, getOptions(section), []);

const gamingAccount = {
  finishedWorlds: { World4: true },
  gaming: { unlocked: true, availableSprouts: 0, availableDrops: 10, sproutsCapacity: 5, imports: [] }
};
const gamingDrops = (options) => getWorld5Alerts(gamingAccount, { gaming: { checked: true } }, { gaming: options }, [])?.gaming?.drops;

const passiveCharacter = { cards: { equippedCards: [{ effect: '+5% Damage (Passive)' }] } };
const idleAccount = { alchemy: { activities: { 0: { activity: -1 } } } };

describe('alerts that get their own option', () => {
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

describe('option checkboxes', () => {
  // The settings window shows a checkbox on picker options; it must turn the alert off, not only the items.
  it('Daily tasks alert follows its picker option checkbox', () => {
    const account = { tasksDescriptions: [Array(9).fill({ level: 0 }), Array(9).fill({ level: 0 })] };
    const section = (checked) => ({
      tasks: { checked: true, options: [{ name: 'tasks', checked, type: 'array', props: { value: { 1: true, 2: true } } }] }
    });
    expect(run(getGeneralAlerts, account, section(true))?.tasks).toEqual([0, 1]);
    expect(run(getGeneralAlerts, account, section(false))?.tasks).toBeUndefined();
  });

  it('Sneaking last looted follows its checkbox', () => {
    const section = (checked) => ({ sneaking: { checked: true, options: [{ name: 'lastLooted', checked, props: { value: 10 } }] } });
    const account = { finishedWorlds: { World5: true }, sneaking: { lastLooted: 3600 } };
    expect(run(getWorld6Alerts, account, section(true))?.sneaking?.lastLooted).toBe(true);
    expect(run(getWorld6Alerts, account, section(false))?.sneaking?.lastLooted).toBeUndefined();
  });

  it('a full ribbon shelf (0 empty slots) alerts at the default threshold 0', () => {
    const section = { cooking: { checked: true, options: [{ name: 'ribbons', checked: true, props: { value: 0 } }] } };
    const full = { finishedWorlds: { World3: true }, grimoire: { ribbons: Array(28).fill(1) }, breeding: { pets: [] } };
    const oneEmpty = { ...full, grimoire: { ribbons: [0, ...Array(27).fill(1)] } };
    const noShelf = { ...full, grimoire: {} };
    expect(run(getWorld4Alerts, full, section)?.cooking?.ribbons).toBe(0);
    expect(run(getWorld4Alerts, oneEmpty, section)?.cooking?.ribbons).toBeUndefined();
    expect(run(getWorld4Alerts, noShelf, section)?.cooking?.ribbons).toBeUndefined();
  });
});
