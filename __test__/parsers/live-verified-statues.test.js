import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getStatueBonus } from '@parsers/world-1/statues';

// ArbitraryCode("StatueBonusGiven" + i) read from the running game on 11 Oct 2026 through the debug server,
// logged in as IAmTheHunterrr (Bowman line: STRAIGHTSHOT_STATUES 85.03, no other statue talent). latest.json is
// that save. Covers the class talent switch, onyx (Onyx Lantern 150), zenith (market 212), Upgrade Vault 25
// on 0/1/2/6, the Dragon multi on every other statue, event shop 19, Voodoo Statufication 99.24 and Meritocracy 26.
const GAME = [
  354675.33164247783, 31758.18887330354, 50318.9520098832, 65264.03800484087, 139743.30768154512,
  1743.5918549654527, 50221.245306951394, 57184.93078567294, 17193.35005079173, 17155.47923570188,
  4986.323986830202, 48583.49356197236, 25057.855984450507, 13002.313180848374, 91187.48022400968,
  1642.4635273774563, 2981.542071990924, 1548.3095672093223, 1133.3347057275441, 43172.729202428585,
  13368.397726716918, 19541.34058636241, 5352.408532698749, 25625.918210798252, 13885.965532944865,
  12371.13292935088, 9013.253991384212, 13860.718322884968, 1046.1551129792715, 284.66037783375316,
  4695.981071141355, 182.72842640037942
];

const TOLERANCE = 1e-9;

const { account, characters } = parseFixture(latest);
const hunter = characters.find((character) => character?.name === 'IAmTheHunterrr');

describe('statue bonus matches the live game', () => {
  it.each(GAME.map((value, index) => [account.statues[index]?.name, index, value]))('%s (%i)', (_name, index, value) => {
    const actual = getStatueBonus(account, index, hunter.flatTalents);
    expect(Math.abs(actual / value - 1)).toBeLessThan(TOLERANCE);
  });
});
