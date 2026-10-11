import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBestActiveCharacter } from '@parsers/talents';
import { getInfiniteStarsCount, getStarSignBonus } from '@parsers/starSigns';

// DNSM.StarSigns read from the running game on 11 Oct 2026 through the debug server, logged in as
// IAmTheHunterrr (signs 56, 19, 28 equipped, class level 1280, summoning 146, Silkrode chip, Seraph Cosmos,
// Infinite Stars covering 149 signs, Tesseract 40 at 10, no Meritocracy 22). latest.json is that save.
// riftOff: StarSigns(0) rebuilt with RiftStuff("enabledStarSigns") hooked to 0 and DNSM.ChipBbonusz.star set
// to 1 / 0, both restored in a finally (no saved attribute touched).
const GAME = {
  live: {
    Defence: 180.5923123200002, // DefPct
    Fight_AFK_Gain: 103.19560704000011,
    Skill_AFK_Gain: 60.197437440000066,
    Movement_Speed: 68.79707136000007,
    Carry_Cap: 386.9835264000004,
    Total_Damage: 378.38389248000044,
    Mob_Respawn_rate: 51.597803520000056,
    Skill_EXP_gain: 77.39670528000008,
    Class_EXP_Gain: 85.9963392000001, // MainXP
    Crit_Chance: 34.39853568000004,
    Accuracy: 120.39487488000013,
    Weapon_Power: 17.19926784000002,
    Total_Multikill: 128.99450880000015,
    Construct_Exp: 214.99084800000023,
    Worship_EXP: 128.99450880000015,
    Trap_Efficiency: 85.9963392000001,
    All_Food_Effect: 128.99450880000015,
    Speed_in_Town: 85.9963392000001,
    All_Skill_Prowess: 17.19926784000002,
    Mining_Efficency: 42.99816960000005,
    Drop_Rate: 42.99816960000005,
    Total_HP: 0, // The Forsaken is an Infinite Star here, so its -80% never applies
    Breedable_Spd: 300.98718720000033, // 57a
    Shiny_Mob_LV_spd: 128.99450880000015, // 57b
    Cooking_SPD: 128.99450880000015, // 58
    Lab_EXP_Gain: 171.9926784000002, // 60
    Artifact_Find: 128.99450880000015, // 61
    Divinity_EXP: 257.9890176000003, // 62
    Sailing_SPD: 0, // 63, sign not equipped
    Crop_Evo: 25.798901760000028, // 65
    Farming_EXP: 171.9926784000002, // 66
    OG_Chance: 0, // 67, sign not equipped
    Jade_Gain: 85.9963392000001 // 75
  },
  riftOff: {
    chip: { Fight_AFK_Gain: 103.19560704000011, Defence: -50, Total_HP: -80, Movement_Speed: 0 },
    noChip: { Fight_AFK_Gain: 51.597803520000056, Defence: -50, Total_HP: -80, Movement_Speed: 0 }
  }
};

const TOLERANCE = 1e-9;
const within = (actual, expected) => expected === 0
  ? expect(actual).toBe(0)
  : expect(Math.abs(actual / expected - 1)).toBeLessThan(TOLERANCE);

const { account, characters } = parseFixture(latest);
const loggedIn = getBestActiveCharacter(characters);
const sign = (name) => account.starSigns.find(({ starName }) => starName === name);

// account / character variants for the rules the live account cannot show
const variant = ({ rift = true, seraph = true, chip = true, signs, level, summoning } = {}) => {
  const playersChips = account.lab.playersChips.map((chips, playerId) => playerId === loggedIn.playerId
    ? (chips ?? []).filter(({ index }) => index !== 15).concat(chip ? [{ index: 15, baseVal: 1, name: 'Silkrode_Nanochip' }] : [])
    : chips);
  const acc = {
    ...account,
    rift: rift ? account.rift : { ...account.rift, currentRift: 0 },
    starSigns: account.starSigns.map((s) => s.starName === 'Seraph_Cosmos' ? { ...s, unlocked: seraph } : s),
    lab: { ...account.lab, playersChips }
  };
  const char = {
    ...loggedIn,
    ...(signs ? { starSigns: signs.map(sign) } : {}),
    ...(level != null ? { level } : {}),
    ...(summoning != null ? { skillsInfo: { ...loggedIn.skillsInfo, summoning: { ...loggedIn.skillsInfo.summoning, level: summoning } } } : {})
  };
  return [char, acc];
};
const seraphMulti = Math.pow(1.2, Math.ceil((146 + 1) / 20));

describe('star sign bonuses match DNSM.StarSigns of the live game', () => {
  it('the logged-in character and Infinite Stars match the live account', () => {
    expect(loggedIn.name).toBe('IAmTheHunterrr');
    expect(getInfiniteStarsCount(account)).toBe(149);
  });

  it.each(Object.entries(GAME.live))('%s', (effect, expected) => {
    within(getStarSignBonus(loggedIn, account, effect), expected);
  });

  // The riftOff rows double as proof the variant has no Infinite Stars: Defence and Total_HP keep their negatives
  it.each(Object.entries(GAME.riftOff.chip))('without Infinite Stars, chip on: %s', (effect, expected) => {
    const [char, acc] = variant({ rift: false });
    within(getStarSignBonus(char, acc, effect), expected);
  });

  it.each(Object.entries(GAME.riftOff.noChip))('without Infinite Stars, chip off: %s', (effect, expected) => {
    const [char, acc] = variant({ rift: false, chip: false });
    within(getStarSignBonus(char, acc, effect), expected);
  });
});

describe('star sign rules the live account cannot exercise', () => {
  it('with Infinite Stars but no Seraph Cosmos the chip doubles nothing', () => {
    const [withChip, acc] = variant({ seraph: false });
    const [noChip, accNoChip] = variant({ seraph: false, chip: false });
    // 56 (+4), 19 (+2), 28 (+6) are all Infinite Stars; the negative halves never apply
    expect(getStarSignBonus(withChip, acc, 'Fight_AFK_Gain')).toBe(12);
    expect(getStarSignBonus(noChip, accNoChip, 'Fight_AFK_Gain')).toBe(12);
    expect(getStarSignBonus(withChip, acc, 'Defence')).toBeGreaterThan(0);
  });

  // The chip-on half is the live Fight_AFK_Gain row (12 * 2 * seraphMulti)
  it('with Infinite Stars and Seraph Cosmos the chip is a x2 inside the Seraph multiplier', () => {
    const [noChip, accNoChip] = variant({ chip: false });
    within(getStarSignBonus(noChip, accNoChip, 'Fight_AFK_Gain'), 12 * seraphMulti);
  });

  it('without Infinite Stars the chip doubles positive key totals, never negative ones', () => {
    const run = (signs, chip) => {
      const [char, acc] = variant({ rift: false, seraph: false, chip, signs });
      return getStarSignBonus(char, acc, 'Movement_Speed');
    };
    expect(run(['Flexo_Bendo', 'Robinhood'], false)).toBe(4);
    expect(run(['Flexo_Bendo', 'Robinhood'], true)).toBe(8);
    // a negative total is put back after the second pass
    expect(run(['Flexo_Bendo', 'Fatty_Doodoo'], true)).toBe(-1);
    // a positive total doubles with its negative part
    expect(run(['Flexo_Bendo', 'Robinhood', 'Fatty_Doodoo'], true)).toBe(2);
  });

  it('Seraph Cosmos scales positive totals only', () => {
    const [char, acc] = variant({ rift: false, chip: false, signs: ['Fatty_Doodoo'] });
    expect(getStarSignBonus(char, acc, 'Movement_Speed')).toBe(-3);
    within(getStarSignBonus(char, acc, 'Total_Damage'), 2 * seraphMulti);
  });

  it('Seraph Cosmos follows the summoning level and caps at x5', () => {
    const [low, acc] = variant({ rift: false, chip: false, signs: ['Silly_Snoozer'], summoning: 19 });
    within(getStarSignBonus(low, acc, 'Fight_AFK_Gain'), 2 * 1.2);
    const [high, accHigh] = variant({ rift: false, chip: false, signs: ['Silly_Snoozer'], summoning: 500 });
    within(getStarSignBonus(high, accHigh, 'Fight_AFK_Gain'), 2 * 5);
  });

  it('an Infinite Star drops its negative bonuses, an equipped sign outside the range keeps them', () => {
    const [infinite, acc] = variant({ seraph: false, signs: ['Mr_No_Sleep'] });
    const [equipped, accOff] = variant({ rift: false, seraph: false, chip: false, signs: ['Mr_No_Sleep'] });
    // Mr No Sleep's -6% AFK Gain hits both AFK keys
    expect(getStarSignBonus(equipped, accOff, 'Fight_AFK_Gain')).toBe(-6);
    expect(getStarSignBonus(equipped, accOff, 'Skill_AFK_Gain')).toBe(-6);
    expect(getStarSignBonus(infinite, acc, 'Fight_AFK_Gain')).toBe(12);
  });

  it('Major signs need the class level they show', () => {
    const run = (level) => {
      const [char, acc] = variant({ rift: false, seraph: false, chip: false, signs: ['S._Snoozer_Major'], level });
      return getStarSignBonus(char, acc, 'Fight_AFK_Gain');
    };
    expect(run(99)).toBe(0);
    expect(run(100)).toBe(4);
  });

  it('forceAllWithEffect counts every unlocked sign with the effect as equipped (what-if, not a game value)', () => {
    const [char, acc] = variant({ rift: false, seraph: false, chip: false, signs: [] });
    expect(getStarSignBonus(char, acc, 'Carry_Cap')).toBe(0);
    const unlockedCarry = acc.starSigns
      .filter(({ unlocked, bonuses }) => unlocked && bonuses?.some(({ effect }) => effect === 'Carry_Cap'))
      .reduce((sum, { bonuses }) => sum + bonuses.find(({ effect }) => effect === 'Carry_Cap').bonus, 0);
    expect(unlockedCarry).toBeGreaterThan(0);
    // the account holds a Silkrode chip, so the what-if doubles it (no Infinite Stars here)
    expect(getStarSignBonus(char, acc, 'Carry_Cap', false, true)).toBe(2 * unlockedCarry);
  });
});
