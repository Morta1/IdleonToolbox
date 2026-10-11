import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Spelunk[16]/[17] match). The trophy and nametag maps were rebuilt
// with Gallery("InitializeTrophyBonuses" / "InitializeNametagBonuses", -1, 0) first: the cached ones
// can predate the Codfrey bubble. GalleryBonusMulti carries the logged-in character's "troph" chip.
const GAME = {
  // Gallery("GalleryBonusMulti", 0, 0)
  bonusMulti: 1.5242414682537326,
  // Gallery("PodiumsOwned"), and _Lv2 / _Lv3 / _Lv4 (each count includes the higher grades)
  podiums: { owned: 16, lv2Plus: 18, lv3Plus: 3, lv4: 1 },
  // DNSM.GalleryTrophyBonTOT
  trophies: {
    '%_ALL_AFK_GAIN': 38.10603670634332, '%_SKILL_EXP': 346.76493402772417, Weapon_Power: 43.44088184523139,
    STR: 144.04081874997775, AGI: 144.04081874997775, WIS: 144.04081874997775, LUK: 233.97106537694796,
    Defence: 212.6316848213957, '%_MONEY': 152.42414682537327, '%_DROP_RATE': 1804.7018984124193,
    '%_SKILL_AFK_GAIN': 6.859086607141797, '%_XP_FROM_MONSTERS': 57.15905505951497, '%_LUK': 4.572724404761198
  },
  // DNSM.GalleryNametagBonTOT
  nametags: {
    '%_XP_FROM_MONSTERS': 636.3708129959334, Weapon_Power: 186.71957986108225, STR: 274.3634642856719,
    AGI: 193.57866646822404, WIS: 193.57866646822404, LUK: 467.18001001976904, Defence: 534.2466346229332,
    '%_DROP_RATE': 381.0603670634331, '%_MULTIKILL_PER_TIER': 15.242414682537326,
    '%_SKILL_EXP': 22.863622023805988, '%_FISHING_XP_GAIN': 304.84829365074654,
    '%_ALL_STATS': 15.242414682537326, '%_MINING_XP_GAIN': 87.64388442458963,
    '%_SKILL_AFK_GAIN': 37.191491825391076, '%_ALL_AFK_GAIN': 264.45589474202256,
    '%_DAMAGE_MULTI': 192.05442499997034, '%_DAMAGE_BONUS': 91.45448809522395, '%_MONEY': 552.5375322419782,
    '%_CLASS_EXP_MULTI': 463.3694063491347, '%_DROP_RATE_MULTI': 134.1332492063285,
    '%_FIGHT_AFK_GAIN': 26.67422569444032, '%_TOTAL_DAMAGE': 91.45448809522397,
    '%_MOB_RESPAWN': 15.242414682537326, '%_BONUS_CLASS_EXP': 38.10603670634332,
    '%_KILLS_IN_WORLD_7': 76.21207341268664
  },
  // Gallery("HatrackBonusMulti") and DNSM.PremHatBonTOT (InitializePremHatBonuses -1 first)
  hatMulti: 1.6800000000000002,
  hats: {
    Weapon_Power: 50.400000000000006, STR: 97.44000000000013, AGI: 110.88000000000017, WIS: 97.44000000000013,
    LUK: 52.08, Defence: 273.84000000000003, '%_SKILL_EXP': 50.400000000000006,
    '%_XP_FROM_MONSTERS': 157.92000000000004, '%_CLASS_EXP_MULTI': 33.6, '%_DAMAGE_MULTI': 28.560000000000002,
    '%_ALL_STATS': 8.4, '%_DIVINITY_EXP': 25.200000000000003, '%_ALL_AFK_GAIN': 16.8,
    '%_DUST_MULTI': 42.00000000000001, '%_EXTRA_BONES': 42.00000000000001, '%_EXTRA_TACHYONS': 42.00000000000001,
    '%_DROP_RATE': 57.12, '%_SKILL_EFFICIENCY': 21.840000000000003, '%_AFK_GAINS_MULTI': 3.3600000000000003,
    '%_DROP_RATE_MULTI': 5.040000000000001, '%_MASTERCLASS_DROPS': 1.6800000000000002, '%_BONUS_KILLS': 8.4,
    '%_BONUS_MONEY': 58.8, '%_MARBLE_DROP': 5.040000000000001
  }
};

const { account, characters } = parseFixture(latest);
const loggedIn = characters.find(({ name }) => name === 'IAmTheHunterrr');
// The game's map only holds keys some item adds to; the parser lists every gallery stat, zeros included
const nonZero = (bonuses) => Object.fromEntries(bonuses.filter(({ value }) => value).map(({ name, value }) => [name, value]));

describe('gallery verified against the live game', () => {
  it('bonus multi for the logged-in character', () => {
    within(loggedIn.gallery.bonusMulti, GAME.bonusMulti);
  });

  it('podiums and their grades', () => {
    const { podiumsOwned, lv2PodiumsOwned, lv3PodiumsOwned, lv4PodiumsOwned } = account.gallery;
    const { owned, lv2Plus, lv3Plus, lv4 } = GAME.podiums;
    expect([podiumsOwned, lv2PodiumsOwned, lv3PodiumsOwned, lv4PodiumsOwned])
      .toEqual([owned, lv2Plus - lv3Plus, lv3Plus - lv4, lv4]);
  });

  it.each([
    ['trophy', () => loggedIn.gallery.trophyBonuses, GAME.trophies],
    ['nametag', () => loggedIn.gallery.nametagBonuses, GAME.nametags],
    ['premium hat', () => account.hatRack.hatBonuses, GAME.hats]
  ])('%s bonuses', (_, read, expected) => {
    const actual = nonZero(read());
    expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort());
    Object.entries(expected).forEach(([name, value]) => within(actual[name], value));
  });

  it('hat rack multi', () => {
    within(account.hatRack.bonusMulti, GAME.hatMulti);
  });
});
