import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { calcTotalTasks, getMeritDescription } from '@parsers/tasks';
import { merits } from '@website-data';
import { getClassExpMulti, getRespawnRate } from '@parsers/character';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth (index 8) on map 51.
// latest.json is that account's save (OptionsListAccount[340] and Tasks[0..4] match). Two inputs drifted since the
// export and are swapped in: Tasks[5] (the daily task rolls) and OptionsListAccount[500].
const LIVE_DAILY_TASK_ROLLS = [12, 0, 13, 0, 0, 0, 0, 0];
const LIVE_OPTION_500 = 2454.4000000000015;
const LOGGED_IN = 8;
const LIVE_MAP = 51;

const GAME = {
  // TaskStuff("UnlockPtsOwned"), TaskStuff("TaskPointREQ", 0), TaskStuff("RecipesUnlockedNUM")
  unlockPointsOwned: 391,
  unlockPointsReq: 11055,
  recipesUnlocked: 128,
  // Task board per world: [name, requirement, merits paid] as the board draws it: TaskDescriptions[w][i][5 + level]
  // (null once ranked out), slot 8 = TaskDescriptions[w][8 + Tasks[5][w]][5]; merits = TaskStuff("MeritsGiven", level),
  // none for slot 8
  board: [
    [['Faceless_Deathmachine', null, 3], ['Just_One_More_Before_Bed', null, 3], ['Super_Explosive_Gameplay', null, 3],
      ['Nakedknuckle_Boxing', null, 3], ['Pack_Mule_Crafter', 24, 1], ['Stamp_Coolection', null, 3],
      ['Such_Rock_Very_Dog_Wow', 1, 2], ['Achievement_Hunter', 60, 2], ['Escapin\'_the_\'laws', 1, 0]],
    [['Road_to_Max_Damage', null, 3], ['Investing_in..._bubbles?', null, 3], ['Avast,_Bankruptcy_Ho!', 2200, 2],
      ['Maximum_Efficiency', null, 3], ['No_Time_to_Brews!', null, 3], ['The_Unstoppable_USPS', null, 3],
      ['Twilight_Tombstone', 1, 2], ['Achievement_Cowboy', 50, 2], ['Fishin_for_Fishies_A', 150, 0]],
    [['Why_so_Salty?', null, 3], ['Poof,_Cogone!', 8000, 2], ['My_Shrines,_m\'lord.', null, 3],
      ['Printer_go_Brrrr', null, 3], ['The_True_TD_Wizard', 500, 2], ['Come_\'ere_Critters!', null, 3],
      ['Chill_Out_Big_Boy!', 4, 2], ['Achievement_Inuit', 50, 2], ['Dying_To_Refine', 1, 0]],
    [['Firing_Up_Le_Grill', null, 3], ['Dishin\'_Out_Some_Meals', null, 3], ['Cracking_Eggs', 5, 1],
      ['Mob_Bullet_Bursting', null, 3], ['Light_\'em_Up_Up_Up', 42, 2], ['Consolidating_Chips', null, 3],
      ['Begone_Troll!', 6, 2], ['Achievement_Astronaut', 25, 1], ['Cracked_Crystals', 1, 0]],
    [['Sailin\'_Round_Town', null, 3], ['Decked_out_Decks', null, 3], ['Divinilicious_Licks', null, 3],
      ['Truly_Riveting_Gaming', 75000, 2], ['Now_I_Aint_Sayin_You_A...', null, 3], ['Slab_of_Legend', null, 3],
      ['Cracking_The_Kruk!', 1, 2], ['Achievement_Promethean', 20, 1], ['Nope', 69420, 0]],
    [['Crop_Numbah', null, 3], ['OG,_Oh_Geez', 250000, 2], ['Peak_Sneak', null, 3], ['Gold\'s_Charm', null, 3],
      ['Essential_Digits', null, 3], ['I\'ll_Take_It', 7500, 2], ['Pillaging_The_Emperor!', 1, 2],
      ['Achievement_Theist', 25, 1], ['Nope', 69420, 0]],
    [['Marathon_Delver', 100, 1], ['Record_Depths', 2500, 1], ['Minehead_1HKO', 5000, 1], ['Smarti_Sushi', 750, 1],
      ['Undisclosed_Task', 4, 1], ['Undisclosed_Task', 10, 1], ['Sinking_the_Nautilus!', 1, 1],
      ['Achievement_Diver', 5, 1], ['Nope', 69420, 0]]
  ],
  // DNSM.TomeQTY[6]: every task level of slots 0-7
  tomeTaskLevels: 416,
  // MonsterDefinitionsGET[mob].RespawnTime after performETCaction: the merit term per world list, W5's level on W1's
  // per-level value for caveB, caveC overwritten by the caveD branch, fm_rat from RoyalG, unlisted mobs untouched
  respawn: {
    mushG: 2.1883676409122197, shovelR: 5.878528312886275, jarSand: 2.2044481173323534, sheep: 2.9392641564431377,
    mushP: 5.584601897241962, w4a2: 5.878528312886275, w5a1: 6.319417936352746, w6a1: 9.695090670953192,
    w7a1: 9.520392417906733, riftAll: 6.565102922736659, caveB: 7.294558803040733, caveC: 27.27272727272727,
    caveD: 30, fm_rat: 30, poopD: 745000, caveA: 45, reindeer: 45
  },
  // Spelunk("POW_base") and Spelunk("POW_multi") (15 * Tasks[2][6][0] is one of its factors)
  powBase: 1906199,
  powMulti: 965632132600588400000,
  // Spelunk("StaminaMax", i) (20 * Tasks[2][6][2])
  stamina: { 0: 556, 8: 13433 },
  // Sailing("MaxChests") (Tasks[2][4][2]), Breeding("TotalEggCapacity") (Tasks[2][3][2])
  maxChests: 30,
  eggCapacity: 15
};

const withLiveInputs = (fixture) => ({
  ...fixture,
  data: {
    ...fixture.data,
    [`PTimeAway_${LOGGED_IN}`]: Number(fixture.data.PTimeAway_5) + 1,
    TaskZZ5: JSON.stringify(LIVE_DAILY_TASK_ROLLS),
    OptLacc: fixture.data.OptLacc.map((value, index) => index === 500 ? LIVE_OPTION_500 : value)
  }
});

const { account, characters } = parseFixture(withLiveInputs(latest));
const loggedIn = characters[LOGGED_IN];

describe('task board (live)', () => {
  it('task unlock points and recipes', () => {
    const { unlockPointsOwned, pointsReq, unlockedRecipes } = account.taskUnlocks;
    expect({ unlockPointsOwned, pointsReq, unlockedRecipes }).toEqual({
      unlockPointsOwned: GAME.unlockPointsOwned,
      pointsReq: GAME.unlockPointsReq,
      unlockedRecipes: GAME.recipesUnlocked
    });
  });

  it.each(GAME.board.map((row, world) => [world, row]))('world %i board', (world, row) => {
    expect(account.tasksDescriptions[world].map(({ name, requirement, meritReward }) => [name, requirement, meritReward]))
      .toEqual(row);
  });

  it('tome task levels', () => {
    expect(calcTotalTasks(account.tasks)).toBe(GAME.tomeTaskLevels);
  });
});

describe('merit bonuses (live)', () => {
  it.each(Object.entries(GAME.respawn))('%s respawn time', (mob, value) => {
    within(getRespawnRate({ ...loggedIn, mapIndex: LIVE_MAP, targetMonster: mob }, account).respawnRate, value);
  });

  it('spelunking POW multi', () => {
    const base = account.spelunking.upgrades[0].bonus + 1;
    expect(base).toBe(GAME.powBase);
    within(account.spelunking.power.value / base, GAME.powMulti);
  });

  it.each(Object.entries(GAME.stamina))('character %s max stamina', (index, value) => {
    expect(account.spelunking.charactersStamina[index].characterStamina).toBe(value);
  });

  it('sailing chests and egg capacity', () => {
    expect([account.sailing.maxChests, account.breeding.eggCapacity]).toEqual([GAME.maxChests, GAME.eggCapacity]);
  });
});

// game ExpMulti: the lowest-level merit (and the vault/superbit terms behind it) needs a class level strictly
// below every other character's
describe('lowest character class EXP merit', () => {
  const lowest = characters.reduce((low, character) => character.level < low.level ? character : low);
  const withoutMerit = { ...account, tasks: account.tasks.map((group, index) => index === 2
    ? group.map((world, worldIndex) => worldIndex === 0 ? world.map((level, i) => i === 2 ? 0 : level) : world)
    : group) };
  const tied = characters.map((character) => character === lowest ? character : { ...character, level: lowest.level });

  it.each([
    ['strictly lowest', characters, false],
    ['tied for lowest', tied, true]
  ])('%s', (_, roster, sameAsNoMerit) => {
    const withMerit = getClassExpMulti(lowest, account, roster).value;
    const noMerit = getClassExpMulti(lowest, withoutMerit, roster).value;
    expect(withMerit === noMerit).toBe(sameAsNoMerit);
  });
});

// The merit shop's first line as the game draws it (TaskShopDesc), read 2026-10-16 at these levels: W4 #0 has options
// but no `}`, so its `{` must still be filled; W1 #0 fills `}` with the option for the level.
describe('merit shop text', () => {
  it.each([
    [3, 0, 3, 'The_first_+3_kills_each_day_are'],
    [0, 0, 5, 'Inventory_Bag_BCEFH_is_applied_to_everyone,'],
    [0, 1, 10, 'All_Blunder_Hills_Monsters_respawn_+20%'],
    [5, 3, 7, '+21%_Jade_Gain,_permanently.']
  ])('world %s merit %s at level %s', (world, index, level, text) => {
    expect(getMeritDescription(merits[world][index], level)).toBe(text);
  });
});
