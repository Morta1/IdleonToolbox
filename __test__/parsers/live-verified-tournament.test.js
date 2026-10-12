import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getTournament } from '@parsers/world-7/tournament';
import { tournyStuff } from '@website-data';
import { getGeneralAlerts } from '../../utility/dashboard/account';

// Read from the running game on 2026-10-12 through the debug server. The OptionsListAccount entries below
// held the same values in latest.json; 496 (the save's copy of the tournament day) had moved on, so it is not pinned.
const GAME = {
  // CustomLists.TournyStuff rows 13 (division names) and 17 (division scales)
  divisionNames: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Master', '_', '_', '_'],
  divisionScales: [200, 200, 180, 170, 160, 200, 200, 200],
  // TournyStuff[27]: the "+N PTS" a bracket win is worth, by round index
  pointsPerRound: [2, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5],
  divisionIndex: 0, // OptionsListAccount[495]
  registrationCount: 12, // OptionsListAccount[498], +1 per registration
  registeredThrough: 226 // OptionsListAccount[511], set to getTournamentDay() + 1 on registering
};

// The bracket round titles are images (TournyBracketSubTitle{division}_{roundIndex + 1}.png), the same five
// sets for every division
const ROUND_TITLES = [
  'Open Qualification', 'Round of 1024', 'Round of 512', 'Round of 256', 'Round of 128', 'Round of 64',
  'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'The Final'
];

const { account } = parseFixture(latest);
const tournament = getTournament(latest.data, account, latest.tournament);

const fields = { etc: { checked: true } };
const options = { etc: { tournamentRegister: { checked: true }, petMartGems: { checked: true } } };

const matchString = (lives, steps) => JSON.stringify([['me', 0, lives, 1, 2, 3, 4, 5], ['them', 0, lives, 6, 7], steps]);

describe('tournament verified against the live game', () => {
  it('division data', () => {
    expect(tournyStuff.divisionNames).toEqual(GAME.divisionNames.filter((name) => name !== '_'));
    expect(tournyStuff.divisionScales).toEqual(GAME.divisionScales);
    expect(tournyStuff.divisionPointReqs).toEqual(GAME.pointsPerRound);
  });

  it('division and registration count', () => {
    expect([tournament.divisionIndex, tournament.divisionName, tournament.registrationCount])
      .toEqual([GAME.divisionIndex, GAME.divisionNames[GAME.divisionIndex], GAME.registrationCount]);
  });

  it('registration alert: registered through day 226 is behind the current tournament day', () => {
    expect(account.accountOptions[511]).toBe(GAME.registeredThrough);
    expect(getGeneralAlerts({ ...account, tournament }, fields, options, [])?.etc?.tournamentRegister).toBe(true);
  });

  it('Pet Mart gems alert follows the GemPM_x claim gate', () => {
    const gemsAlert = (GemPM_x) => getGeneralAlerts({ ...account, tournament, serverVars: { GemPM_x } }, fields, options, [])?.etc?.petMartGems;
    expect([gemsAlert(latest.serverVars.GemPM_x), gemsAlert(0)]).toEqual([true, undefined]);
  });

  it('tournament day is the newer of the save copy and the global doc', () => {
    const day = (saved, server) => getTournament({}, { accountOptions: { 496: saved } }, { global: { T: server } }).tournamentDay;
    expect([day(236, 234), day(234, 236), day(236, undefined)]).toEqual([236, 236, 236]);
  });

  it.each(ROUND_TITLES.map((title, index) => [index - 1, title]))('round index %i is titled %s', (roundIndex, title) => {
    const lives = roundIndex < 0 ? 3 : `${roundIndex}_0`;
    const [match] = getTournament({}, account, { match: { d: [matchString(lives, ['0x0+', '0x1+'])] } }).matches;
    expect(match.roundName).toBe(title);
  });

  // A qualifier lost costs a heart, so the next qualifier's lives are the oracle for every match but the last
  it('qualifier results follow the hearts lost', () => {
    const qualifiers = tournament.matches.filter(({ isQualifying }) => isQualifying);
    const fromHearts = qualifiers.slice(0, -1).map((match, index) => qualifiers[index + 1].playerLives < match.playerLives ? 'loss' : 'win');
    expect(qualifiers.slice(0, -1).map(({ result }) => result)).toEqual(fromHearts);
  });

  it('the last kill decides a match, however many pets each side lost', () => {
    // Three of mine fall, then the fourth wipes their two
    const [won] = getTournament({}, account, { match: { d: [matchString('0_5', ['0x0-', '1x0-', '2x0-', '3x0+', '3x1+'])] } }).matches;
    const [lost] = getTournament({}, account, { match: { d: [matchString('0_5', ['0x0+', '0x1-', '_', '1x1-', '2x1-', '3x1-', '4x1-'])] } }).matches;
    expect([won.result, lost.result]).toEqual(['win', 'loss']);
  });
});
