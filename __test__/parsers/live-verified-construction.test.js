import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';
import { BOARD_SIZE, getConstruction, getTotalGildedSlots, getTrimmedBuildSpeed } from '@parsers/world-3/construction';
import {
  getConstructionExpMulti,
  getPlayerConstructionExpPerHour,
  getPlayerConstructionSpeed,
  getSkillExpMulti
} from '@parsers/character';
import { getBestActiveCharacter } from '@parsers/talents';
import { starSignByIndexMap } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // WorkbenchStuff("TotalGildedBoostio")
  gildedBoostio: 43.875,
  // WorkbenchStuff("PlayerBuildSpd", i, 0) for the characters whose construction level and gear match the save:
  // warriors and beginners included, Carpenter takes no Warriors Rule
  playerBuildSpeed: {
    MortaWiz: 1355658642364.3577,
    MortaStir: 88169144272144.48,
    MortaWiiz: 2837279562919.6025,
    MortaMan: 4053467912776.829,
    MortaCatch: 1333655422707.7297,
    Morojoze: 1449737668625.1162
  },
  // Call Me Bob had gained levels since the export; the EXP readings below are taken at this level
  callMeBobLevel: 1762083,
  // DNSM.ConstructDN2 after WorkbenchStuff("PlayerConExp", i, 0): the logged-out branch's multiplier, for every
  // character other than the logged-in one (Warriors Rule on Call Me Bob below the archers, raw Sharper Saws and
  // statue, no Tempestuous Emotions or star sign total)
  loggedOutConExpMulti: {
    morta11: 4952828.336163749,
    mortastr: 36887373.40349434,
    MortaWiz: 4952828.336163749,
    MortaStir: 36887690.23049434,
    MortaWiiz: 4952996.861163749,
    MortaMan: 36887429.57849435,
    MortaCatch: 4952828.336163749,
    MortasNinth: 36887887.96649434,
    Morojo: 4952996.861163749,
    Morojoze: 36887373.40349434
  },
  // The logged-in branch: WorkbenchStuff("PlayerConExp", 5, 0) over its own per-hour base
  loggedInConExpMulti: 4954475.191173363,
  // WorkbenchStuff("PlayerConExp", i, 0) for the logged-out characters whose build speed matches the save
  playerConExp: {
    MortaWiz: 769797619761634.6,
    MortaStir: 106555812342149330,
    MortaWiiz: 1290942902035976.8,
    MortaMan: 12341299006830512,
    MortaCatch: 761030589929347.4,
    Morojoze: 6008933106390419
  }
};
// Sawsaw Salala: the logged-out branch adds a flat 25 to the finished multiplier. The logged-in one reads the
// star sign total, which Infinite Stars already fills with it on this account
const SAWSAW_SALALA = starSignByIndexMap[45];
const SAWSAW_SALALA_FLAT_MULTI = 25;

const { account, characters } = parseFixture(latest);
const byName = (name) => characters.find((character) => character.name === name);
const withLiveCallMeBob = (bubbles) => bubbles?.map((bubble) => bubble?.bubbleName === 'CALL_ME_BOB'
  ? { ...bubble, level: GAME.callMeBobLevel }
  : bubble);
const liveAccount = { ...account, alchemy: { ...account.alchemy, bubblesFlat: withLiveCallMeBob(account.alchemy.bubblesFlat) } };
const liveCharacters = characters.map((character) => ({
  ...character,
  equippedBubbles: withLiveCallMeBob(character.equippedBubbles)
}));
const liveByName = (name) => liveCharacters.find((character) => character.name === name);
const loggedIn = getBestActiveCharacter(liveCharacters);

describe('construction verified against the live game', () => {
  it('trimmed build speed multi', () => {
    const { value, breakdown } = getTrimmedBuildSpeed(account);
    within(evaluateBreakdownNode(breakdown.tree[1]), GAME.gildedBoostio);
    within(value, GAME.gildedBoostio * account.construction.totalBuildRate);
  });

  it.each(Object.entries(GAME.playerBuildSpeed))('%s build speed', (name, value) => {
    within(byName(name).constructionSpeed, value);
  });

  it.each(Object.entries(GAME.loggedOutConExpMulti))('%s construction EXP multi while logged out', (name, value) => {
    const character = liveByName(name);
    within(getConstructionExpMulti(character, liveAccount, false).value, value);
    within(getSkillExpMulti('construction', character, liveCharacters, liveAccount).value, value);
  });

  it('construction EXP multi of the logged-in character', () => {
    expect(loggedIn.name).toBe('IAmTheHunterrr');
    within(getSkillExpMulti('construction', loggedIn, liveCharacters, liveAccount).value, GAME.loggedInConExpMulti);
  });

  it.each(Object.entries(GAME.playerConExp))('%s construction EXP while logged out', (name, value) => {
    within(getPlayerConstructionExpPerHour(liveByName(name), liveAccount, liveCharacters), value);
  });

  it.each([
    ['logged out', 'MortaWiz', SAWSAW_SALALA_FLAT_MULTI],
    ['logged in', 'IAmTheHunterrr', 0]
  ])('Sawsaw Salala equipped while %s', (_, name, flatMulti) => {
    const character = liveByName(name);
    const withSign = { ...character, starSigns: [...character.starSigns.filter((sign) => sign !== SAWSAW_SALALA), SAWSAW_SALALA] };
    const signCharacters = liveCharacters.map((other) => other === character ? withSign : other);
    const without = getSkillExpMulti('construction', character, liveCharacters, liveAccount).value;
    const { value, breakdown } = getSkillExpMulti('construction', withSign, signCharacters, liveAccount);
    within(value, without + flatMulti);
    within(evaluateBreakdown(breakdown), value);
  });
});

// Read on 2026-10-13, logged in as MortasNinth (fixture parsed with a newer PTimeAway_8 stamp). The board is
// the ActorEvents_481 _GenINFO[8] / [12] the game built from its live CogMap; the fixture's board only drifted
// in the character cogs and the Excogia pieces, so their live CogMap inputs are put back first.
const GAME_COGS = {
  boardInputs: {
    58: { a: 1475462320250765.8, c: 113925699043171.92 },
    68: { a: 32093568515060590, c: 1561306275805266.8 },
    69: { a: 64104692979120770, c: 2811183196740242 },
    93: { a: 1499254464047025.5, c: 115485336847653.22 },
    94: { a: 1032769760902735.4, c: 84127073951218.56 }
  },
  // Every Excogia piece (two assembled squares, CogZA00 at 74 and 76)
  excogiaInputs: { a: 195846, c: 17121 },
  // _GenINFO[12]: build rate, construct EXP bonus (x small cogs), flaggy rate (x gem shop), as printed on the board
  totals: { totalBuildRate: 1894405319059028200, totalExpRate: 799932, totalFlaggyRate: 18744110330113908 },
  // _GenINFO[8][slot] after the neighbour boosts: one slot per boost shape, both Excogia corners, characters
  slots: {
    3: { a: 12752.300000000001 },
    5: { a: 87397.64000000001 },
    8: { a: 1018.24 },
    12: { a: 5795.76, c: 880 },
    16: { a: 592.92, c: 134.16 },
    17: { a: 1221.48 },
    28: { a: 292.59999999999997 },
    32: { a: 480, c: 64 },
    36: { a: 496.1 },
    42: { a: 160, c: 53 },
    44: { a: 181638.1 },
    58: { a: 14872660188127718, c: 113925699043171.92 },
    69: { a: 1257734076250349600, c: 2811183196740242 },
    74: { a: 212982.525, c: 17121 },
    77: { a: 422537.74499999994, c: 17121 },
    94: { a: 6940212793266381, c: 84127073951218.56 }
  },
  // WorkbenchStuff("ExtraBuildSPDmulti")
  extraBuildSpeedMulti: 364,
  // WorkbenchStuff("FlagReq", 96..119): the two small cog columns
  sideFlagReqs: [5000000, 200000000, 1600000000, 9600000000, 51200000000, 256000000000, 1228800000000, 5734400000000,
    26214400000000, 117964800000000, 524288000000000, 2306867200000000, 10066329600000000, 43620761600000000,
    187904819200000000, 805306368000000000, 3435973836800000000, 14602888806400000000, 61847529062400000000,
    261134011596800000000, 1.099511627776e+21, 4.6179488366592e+21, 1.93514046488576e+22, 8.09240558043136e+22],
  // WorkbenchStuff("TotalGildedSlots")
  gildedSlots: 7,
  // WorkbenchStuff("PlayerBuildSpd", i, 0): EtcBonuses("30") is MortasNinth's 40% obol build speed for everyone
  playerBuildSpeed: {
    morta11: 1524825756115.6643,
    mortastr: 4186436377962.8506,
    MortaWiz: 1377910074976.421,
    MortaStir: 89559286363008.88,
    MortaWiiz: 2882014280223.76,
    IAmTheHunterrr: 2251467136633.475,
    MortaMan: 4118662876802.8267,
    MortaCatch: 1355545700126.1936,
    MortasNinth: 178888506992784.97,
    Morojo: 2125081434161.9058,
    Morojoze: 1473533290200.117
  },
  // Lv0[8] for the two characters that levelled construction since the export
  constructionLevel: { IAmTheHunterrr: 3409, MortasNinth: 5184 }
};
const EXCOGIA_PIECE = /^CogZA0[0-3]$/;

const ninthFixture = { ...latest, data: { ...latest.data, PTimeAway_8: Number(latest.data.PTimeAway_5) + 1 } };
const ninth = parseFixture(ninthFixture);
const liveCogMap = JSON.parse(latest.data.CogM);
JSON.parse(latest.data.CogO).slice(0, BOARD_SIZE).forEach((name, slot) => {
  const live = EXCOGIA_PIECE.test(name) ? GAME_COGS.excogiaInputs : GAME_COGS.boardInputs[slot];
  if (live) liveCogMap[slot] = { ...liveCogMap[slot], ...live };
});
const cogBoard = getConstruction({ ...latest.data, CogM: JSON.stringify(liveCogMap) }, ninth.account, ninth.characters);

describe('construction cog board verified against the live game', () => {
  it.each(Object.entries(GAME_COGS.totals))('%s', (key, value) => {
    within(cogBoard[key], value);
  });

  it.each(Object.entries(GAME_COGS.slots))('slot %s after neighbour boosts', (slot, { a = 0, c = 0 }) => {
    const { stats } = cogBoard.board[slot].cog;
    within(stats.a?.value ?? 0, a);
    within(stats.c?.value ?? 0, c);
  });

  it('extra build speed multi', () => {
    within(cogBoard.extraBuildSpeedMulti, GAME_COGS.extraBuildSpeedMulti);
  });

  it('small cog column flag requirements', () => {
    expect([...cogBoard.leftColumn, ...cogBoard.rightColumn].map(({ requiredAmount }) => requiredAmount))
      .toEqual(GAME_COGS.sideFlagReqs);
  });

  it('gilded slots', () => {
    expect(getTotalGildedSlots(ninth.account)).toBe(GAME_COGS.gildedSlots);
  });

  it.each(Object.entries(GAME_COGS.playerBuildSpeed))('%s build speed with MortasNinth logged in', (name, value) => {
    const character = ninth.characters.find((other) => other.name === name);
    const level = GAME_COGS.constructionLevel[name] ?? character.skillsInfo.construction.level;
    const live = { ...character, skillsInfo: { ...character.skillsInfo, construction: { ...character.skillsInfo.construction, level } } };
    within(getPlayerConstructionSpeed(live, ninth.account, ninth.characters), value);
  });
});
