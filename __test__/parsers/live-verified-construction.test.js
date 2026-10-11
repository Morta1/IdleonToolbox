import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';
import { getTrimmedBuildSpeed } from '@parsers/world-3/construction';
import { getConstructionExpMulti, getPlayerConstructionExpPerHour, getSkillExpMulti } from '@parsers/character';
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
