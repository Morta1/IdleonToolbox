import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Holes[11][65..70] gambit times and Holes[28] doublers match).
// The live monument bonus (Holes("MonumentROGbonuses", 2, 7)) read 68.6 against the save's 68.5: Holes[15][27]
// had grown from 11407 to 11507, so the points multi and every points-scaled bonus sit 1e-4 / 8e-6 above the save's.
const GAME = {
  // Holes("GambitPts", 99, 0)
  basePoints: 1634160.00000002,
  // Holes("GambitPTSmulti", 0, 0)
  pointsMulti: 7.690268815920399,
  pointsMultiDriftTolerance: 2e-4,
  // The GambitPTSmulti terms that do not drift: MeasurementBonusTOTAL 13, StudyBolaiaBonuses 13, B_UPG 78,
  // JarCollectibleBonus 23 and 30, ArcaneUpgBonus 47
  pointsMultiTerms: {
    measurement: 37.426881592039805,
    study: 125,
    schematic: 10,
    jar23: 64,
    jar30: 64,
    tesseract: 300
  },
  // Holes("GambitBonuses", i, 0)
  bonuses: [
    22, 7.099220967818055, 20, 177.48052419545138, 20, 177.48052419545138, 35, 70.99220967818054,
    709.9220967818055, 1, 1, 177.48052419545138, 1, 1, 250, 3
  ],
  bonusDriftTolerance: 1e-5,
  // Holes("GambitPtsREQ", i, 0)
  pointsReq: [
    3000, 5024, 8667.92, 14802.406400000002, 24684.26384, 40109.5632512, 63623.16377719041, 98804.3881881682,
    150655.2386114558, 226126.35975265643, 334827.6442326948, 489985.8405622638, 709731.9643904582,
    1018828.2956256031, 1450980.3212664844, 2051925.843981216
  ],
  // Holes("Gambit_SummoningDoublersLeft", 0, 0): bonus 0 plus 10 from event shop 15, less the 30 appointed slots
  doublersLeft: 2,
  doublersTotal: 32
};

const { account } = parseFixture(latest);
const { gambit } = account.hole.caverns;
const holesObject = account.hole.holesObject;

describe('gambit verified against the live game', () => {
  it('base points and points multi', () => {
    within(gambit.basePoints, GAME.basePoints);
    within(gambit.pointsMulti, GAME.pointsMulti, GAME.pointsMultiDriftTolerance);
  });

  it('points multi terms', () => {
    expect({
      measurement: getMeasurementBonus({ holesObject, accountData: account, t: 13 }),
      study: getStudyBonus(holesObject, 13, 0),
      schematic: getSchematicBonus({ holesObject, t: 78, i: 10 }),
      jar23: getJarBonus({ holesObject, i: 23, account }),
      jar30: getJarBonus({ holesObject, i: 30, account }),
      tesseract: getTesseractBonus(account, 47)
    }).toEqual(GAME.pointsMultiTerms);
  });

  it.each(GAME.bonuses.map((bonus, index) => [index, bonus]))('bonus %i and its points requirement', (index, bonus) => {
    within(gambit.bonuses[index].bonus, bonus, GAME.bonusDriftTolerance);
    within(gambit.bonuses[index].pointsReq, GAME.pointsReq[index]);
  });

  it('summoning doublers', () => {
    const { appointed, total } = gambit.summoningDoublers;
    expect(total).toBe(GAME.doublersTotal);
    expect(total - appointed).toBe(GAME.doublersLeft);
  });
});
