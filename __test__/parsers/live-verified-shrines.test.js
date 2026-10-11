import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getShrineBonus, getShrineExpBonus } from '@parsers/world-3/shrines';
import { getArtifactFormBonus } from '@parsers/world-5/sailing';
import { artifacts } from '@website-data';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that save: every shrine on map 300 at level 346-349, Chizoar card Lv 7, Moai Head transcendent
// (Sailing("ArtifactBonus", 0, 1) = 500), Shrine World Tour on, legend talent 38 owned.
const GAME = {
  // DNSM.ShrineStuffz723 after Shrine(-1)
  bonus: [1425.6000000000001, 1421.5500000000002, 1906.2, 953.1, 1425.6000000000001, 477.90000000000003,
    3591.0000000000005, 475.20000000000005, 47.925000000000004],
  // WorkbenchStuff("ShrineExpBonus", s, 0)
  expPerHour: [6384.695422093198, 4145.513141359091, 5628.21492184519, 7655.582662509854, 7776.619542549535,
    4508.623781478135, 4084.9947013392502, 3358.773421101161, 1482.7017804860982]
};

const TOLERANCE = 1e-9;
const within = (actual, expected) => expect(Math.abs(actual / expected - 1)).toBeLessThan(TOLERANCE);

const { account, characters } = parseFixture(latest);
const hunter = characters.find((character) => character?.name === 'IAmTheHunterrr');

describe('shrines match the live game', () => {
  it.each(GAME.bonus.map((value, index) => [account.shrines[index]?.name, index, value]))('%s bonus', (_name, index, value) => {
    within(getShrineBonus(account.shrines, index, hunter.mapIndex, account.cards, account.sailing.artifacts), value);
  });

  // The Moai Head form bonus was read as 1 (its base) instead of 500, leaving shrine EXP 5.3x low
  it.each(GAME.expPerHour.map((value, index) => [account.shrines[index]?.name, index, value]))('%s EXP per hour', (_name, index, value) => {
    const { breakdown } = getShrineExpBonus(characters, account);
    within(breakdown[index].find(({ name }) => name === hunter.name).value, value);
  });
});

describe('Shrine World Tour', () => {
  // Verified live by feeding Shrine(-1) a shrine on map 315 with Moai Head off: it applied on map 330 (same world,
  // not the shrine's map, not a town) and not on map 360.
  const SHRINE_MAP = 315;
  const shrineAt = (worldTour) => [{ mapId: SHRINE_MAP, shrineLevel: 5, bonus: 10, worldTour }];

  it.each([
    ['another map in the same world', 330, true, 10],
    ['the shrine map itself', SHRINE_MAP, false, 10],
    ['another world', 360, true, 0],
    ['the same world without World Tour', 330, false, 0]
  ])('%s', (_label, playerMap, worldTour, expected) => {
    expect(getShrineBonus(shrineAt(worldTour), 0, playerMap, [], [])).toBe(expected);
  });
});

describe('getArtifactFormBonus', () => {
  // Sailing("ArtifactBonus", t, 1): only the upgraded forms pay, a plain artifact gives 0
  const moai = artifacts.find(({ name }) => name === 'Moai_Head');
  it.each([
    [0, 0],
    [1, 0],
    [2, moai.ancientMultiplier],
    [3, moai.eldritchMultiplier],
    [4, moai.sovereignMultiplier],
    [5, moai.omnipotentMultiplier],
    [6, moai.transcendentMultiplier]
  ])('grade %i pays %s', (acquired, expected) => {
    expect(getArtifactFormBonus([{ ...moai, acquired }], 'Moai_Head')).toBe(expected);
  });

  it('reads the live transcendent Moai Head', () => {
    expect(getArtifactFormBonus(account.sailing.artifacts, 'Moai_Head')).toBe(500);
  });
});
