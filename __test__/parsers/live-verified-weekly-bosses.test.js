import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getTaskQuantity, getWeeklyBoss, getWeeklyBossCarryCap } from '@parsers/world-2/weeklyBosses';
import { weeklyBosses, weeklyBossesActions, weeklyBossesShop } from '@website-data';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth, raid turn 0
// (morta11). latest.json was exported in the same week (OptionsListAccount[191] = 2962 in both).
const GAME = {
  week: 2962, // OptionsListAccount[191], floor(GlobalTime / 604800)
  // ActorEvents_623 _GenINFO: 37 is the seed, 38 the task per turn, 41 the shop picks, 46 the action triplets
  bossId: 0, // WeeklyBoss("BossID", 0)
  tasks: [2, 2, 2, 3, 3, 18, 2, 18, 2, 3, 3, 3, 18, 2, 3],
  shop: [9, 10, 2, 4],
  choices: [
    [15, 5, 1], [17, 11, 19], [9, 3, 20], [2, 0, 4], [12, 13, 18], [1, 17, 11], [7, 9, 0], [6, 4, 21],
    [19, 2, 5], [11, 16, 9], [13, 17, 14], [7, 15, 12], [4, 6, 20], [21, 2, 13], [3, 17, 16]
  ],
  // WeeklyBoss("TaskQTY") inputs for MortasNinth, the logged-in character: PlayerDATABASE Lv0, kill logs
  // (ceil(getLOG(MapDetails[m][0][0] - KillsLeft2Advance[m][0]))), TotalStats("Defence"),
  // round(100 x PlayerSpeedBonus()), ArbitraryCode("TotalQuestsComplete"), ceil(getLOG(DamageDealed("Max"))).
  // HP, MP, accuracy and construction level drifted between the export and the live reading, so they are left out.
  loggedIn: 'MortasNinth',
  taskQuantities: {
    0: 154, 1: 134, 2: 115, 3: 114, 4: 153, 5: 118, 6: 82, 7: 116, 8: 141, 9: 463,
    13: 218803168.1935601, 14: 17394, 16: 282, 17: 8, 18: 1307, 19: 9, 20: 7, 21: 11, 22: 25, 23: 9
  },
  // MaxCapacity("bCraftOtherPlayer") with morta11 on turn and MortasNinth logged in
  turnCharacter: 'morta11',
  carryCap: 1691851851
};

const { account, characters } = parseFixture(latest);
const [thisWeek] = getWeeklyBoss(account, 1);
const loggedInIndex = characters.findIndex(({ name }) => name === GAME.loggedIn);

describe('weekly boss verified against the live game', () => {
  it('rotation week', () => {
    expect(thisWeek.date.getTime()).toBe(GAME.week * 604800 * 1000);
  });

  it('boss, tasks, shop and action triplets', () => {
    expect({
      bossId: weeklyBosses.findIndex(({ bossName }) => bossName === thisWeek.bossName),
      tasks: thisWeek.triplets.map(({ task }) => task.taskIndex),
      shop: thisWeek.shopItems.map((item, index) => weeklyBossesShop[index < 2 ? 0 : 1].indexOf(item)),
      choices: thisWeek.triplets.map(({ actions }) => actions.map((action) => weeklyBossesActions.indexOf(action)))
    }).toEqual({ bossId: GAME.bossId, tasks: GAME.tasks, shop: GAME.shop, choices: GAME.choices });
  });

  it.each(Object.entries(GAME.taskQuantities))('task %s quantity', (task, quantity) => {
    within(getTaskQuantity(loggedInIndex, Number(task), account, characters), quantity);
  });

  it('material bag task reads the turn character bag with the logged-in multipliers', () => {
    const turnCharacter = characters.find(({ name }) => name === GAME.turnCharacter);
    expect(getWeeklyBossCarryCap(turnCharacter, account, characters[loggedInIndex])).toBe(GAME.carryCap);
  });
});
