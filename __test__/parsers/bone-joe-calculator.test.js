import '../../polyfills';
import { describe, expect, it } from 'vitest';
import {
  getStrongestAttack,
  getEffectiveDamage,
  getHitsToKill,
  getSkillDamage,
  getKillCredit,
  getMinibossHp,
  getMinibosses,
  getOneShotPickleCap,
  getPickleCount,
  getPrayerHpMulti
} from '@parsers/misc/boneJoeCalculator';
import { prayers } from '@website-data';

// Big Brain Time and Midas Minded curse 250% at Lv 1, Jawbreaker 200%, all rising by a tenth of the
// base per level. The reference sheet runs Midas Minded alone at Lv 50, so 1475%.
const SHEET_HP_CURSE_MULTI = 15.75;
// All three maxed: 1475 + 1475 + 1180 = 4130%.
const MAXED_HP_CURSE_MULTI = 42.3;

const prayerAtLevel = (name, level) => ({ ...prayers.find((prayer) => prayer.name === name), level });

describe('bone joe calculator', () => {
  it('lists the nine minibosses the pickle multiplier applies to', () => {
    const minibosses = getMinibosses();
    expect(minibosses.map(({ rawName }) => rawName)).toEqual([
      'slimeB', 'poopBig', 'babayaga', 'babaHour', 'babaMummy', 'mini3a', 'mini4a', 'mini5a', 'mini6a'
    ]);
    expect(minibosses.every(({ baseHp }) => baseHp > 0)).toBe(true);
  });

  // Reference values from the community BJP sheet: Midas Minded at Lv 50 and 69 pickles.
  it.each([
    ['slimeB', 113077405.2],
    ['poopBig', 8480805388],
    ['babayaga', 1696161078],
    ['babaHour', 9046192414],
    ['babaMummy', 33923221553],
    ['mini3a', 141346756473],
    ['mini4a', 1356928862137],
    ['mini5a', 11307740517810],
    ['mini6a', 2.82693512945255e17]
  ])('matches the reference sheet for %s', (rawName, expected) => {
    const { baseHp } = getMinibosses().find((miniboss) => miniboss.rawName === rawName);
    // Relative, because the sheet's printed values are rounded and the magnitudes span 1e8 to 1e17.
    expect(getMinibossHp(baseHp, SHEET_HP_CURSE_MULTI, 69) / expected).toBeCloseTo(1, 8);
  });

  it('sums the three monster HP curses into the multiplier', () => {
    const character = {
      activePrayers: [
        prayerAtLevel('Big_Brain_Time', 50),
        prayerAtLevel('Midas_Minded', 50),
        prayerAtLevel('Jawbreaker', 50)
      ]
    };
    expect(getPrayerHpMulti(character, {})).toBeCloseTo(MAXED_HP_CURSE_MULTI, 10);
  });

  it('leaves HP untouched when no HP-curse prayer is equipped', () => {
    expect(getPrayerHpMulti({ activePrayers: [] }, {})).toBe(1);
  });

  it('floors pickles + 0.81, so a whole pickle count lands on itself', () => {
    expect(getMinibossHp(1000, 1, 0)).toBe(1000);
    expect(getMinibossHp(1000, 1, 1)).toBeCloseTo(1100, 10);
    expect(getMinibossHp(1000, 1, 3)).toBeCloseTo(1331, 10);
  });

  it('credits pickles + 1 Deathnote kills per miniboss kill', () => {
    expect(getKillCredit(0)).toBe(1);
    expect(getKillCredit(69)).toBe(70);
  });

  it('caps pickles at the last count still inside one max hit', () => {
    // 1000 base, no prayers: 1.1^7 = 1.949, 1.1^8 = 2.144
    expect(getOneShotPickleCap(2000, 1000, 1)).toBe(7);
    expect(getOneShotPickleCap(1000, 1000, 1)).toBe(0);
    expect(getOneShotPickleCap(999, 1000, 1)).toBe(-1);
    expect(getOneShotPickleCap(0, 1000, 1)).toBe(-1);
  });

  it('reports hits to kill, and infinity when the character deals no damage', () => {
    expect(getHitsToKill(1000, 400)).toBe(3);
    expect(getHitsToKill(1000, 1000)).toBe(1);
    expect(getHitsToKill(1000, 0)).toBe(Infinity);
  });

  it('takes the last pickle stack the way the game does, and tolerates an empty inventory', () => {
    expect(getPickleCount({ inventory: [{ rawName: 'BoneJoePickle', amount: 12 }, { rawName: 'Copper', amount: 5 }] }))
      .toBe(12);
    // The game assigns rather than adds while walking the inventory, so a split stack scores the last one.
    expect(getPickleCount({
      inventory: [{ rawName: 'BoneJoePickle', amount: 40 }, { rawName: 'BoneJoePickle', amount: 9 }]
    })).toBe(9);
    expect(getPickleCount({ inventory: [] })).toBe(0);
    expect(getPickleCount({})).toBe(0);
  });

  // Level 88 of the star talent scores 376, matching GetTalentNumber(2, 640) read off a live game.
  const megaCritChar = (level) => ({ flatStarTalents: [{ name: 'MEGA_CRIT', level, funcY: 'bigBase', y1: 200, y2: 2 }] });

  it('prices a swing at the min-max average lifted by the crit multiplier', () => {
    // 100 to 200 averages 150, and a 50% chance at 3x adds a full average hit back on top.
    expect(getEffectiveDamage({ minDamage: 100, maxDamage: 200, critChance: 50, critDamage: 3 })).toBe(300);
    // No crit damage over 1x leaves the plain average alone.
    expect(getEffectiveDamage({ minDamage: 100, maxDamage: 200, critChance: 80, critDamage: 1 })).toBe(150);
    // Without Mega Crit learned, crit chance past 100% buys nothing at all.
    expect(getEffectiveDamage({ minDamage: 100, maxDamage: 200, critChance: 12372, critDamage: 3 }))
      .toBe(getEffectiveDamage({ minDamage: 100, maxDamage: 200, critChance: 100, critDamage: 3 }));
    expect(getEffectiveDamage({ minDamage: 100, maxDamage: 200, critChance: 12372, critDamage: 3 }, megaCritChar(0)))
      .toBe(getEffectiveDamage({ minDamage: 100, maxDamage: 200, critChance: 100, critDamage: 3 }));
    expect(getEffectiveDamage({})).toBe(0);
  });

  // Real talent data: bigBase pays x1 + x2 * level, and the description is the only thing in the
  // data marking a talent as an attack at all.
  const attack = (name, x1, x2, level, cooldown, description) => ({ name, level, funcX: 'bigBase', x1, x2, cooldown, description });
  const powerStrike = (level) => attack('POWER_STRIKE', 130, 3, level, 3, 'Slash_forward_dealing_{%|damage_to_up_to|2_monsters');
  const whirl = (level) => attack('WHIRL', 60, 1.5, level, 5, 'Swing_your_weapon_around_you|dealing_{%_damage_to_up_to|}_monsters');

  it('takes the hardest equipped attack and ignores everything that is not an attack', () => {
    const character = {
      talentsLoadout: [
        powerStrike(100),
        whirl(100),
        // Blocking and buffs word the description differently and must not register as attacks.
        { name: 'BRICKY_SKIN', level: 100, funcX: 'decay', x1: 20, x2: 100, cooldown: 30,
          description: 'Block_{%_of_all_damage._Also,_passively_gives_+}_base_DEF' },
        { name: 'FIRMLY_GRASP_IT', level: 100, funcX: 'decay', x1: 15, x2: 100, cooldown: 60,
          description: 'Temporarily_boosts_base_STR_by_{_for_}_minutes' }
      ]
    };
    const strongest = getStrongestAttack(character);
    // Power Strike pays 130 + 3 * 100 = 430%, Whirl 60 + 1.5 * 100 = 210%.
    expect(strongest.name).toBe('POWER_STRIKE');
    expect(strongest.multi).toBeCloseTo(4.3, 6);
    // Blocking and buff talents are in the loadout but must not count as attacks.
    expect(strongest.count).toBe(2);
    expect(getStrongestAttack({ talentsLoadout: [] })).toBe(null);
    expect(getStrongestAttack({})).toBe(null);
  });

  it('bounds the skill estimate by that attack and never drops below the basic swing', () => {
    const playerInfo = { minDamage: 100, maxDamage: 200, critChance: 0, critDamage: 1 };
    const character = { talentsLoadout: [powerStrike(100)] };
    // 130 + 3 * 100 = 430% damage.
    const multi = getStrongestAttack(character).multi;
    expect(multi).toBeCloseTo(4.3, 6);
    expect(getSkillDamage(playerInfo, character)).toBeCloseTo(150 * multi, 6);
    // No attack equipped falls back to the basic swing rather than to zero damage.
    expect(getSkillDamage(playerInfo, {})).toBe(150);
  });

  it('adds Mega Crit once crit chance runs past 100%', () => {
    const playerInfo = { minDamage: 100, maxDamage: 200, critChance: 200, critDamage: 3 };
    // Always crits and always mega crits: 3x swaps for 3 + 3.76.
    expect(getEffectiveDamage(playerInfo, megaCritChar(88))).toBeCloseTo(150 * 6.76, 6);
    // Half the surplus means half the swings upgrade.
    expect(getEffectiveDamage({ ...playerInfo, critChance: 150 }, megaCritChar(88))).toBeCloseTo(150 * (3 + 3.76 / 2), 6);
    // The curve opens at 2x and only climbs, so the game's floor never actually bites.
    expect(getEffectiveDamage(playerInfo, megaCritChar(1))).toBeCloseTo(150 * 5.02, 6);
  });
});
