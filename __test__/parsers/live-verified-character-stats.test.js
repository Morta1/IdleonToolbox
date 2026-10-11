import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { calcHitChance, getMaxDamage, NO_DEFENCE_OVERRIDE } from '@parsers/damage';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';

// Character page Stats read from the running game on 2026-10-11 for IAmTheHunterrr, the logged-in
// character, through the debug server (TotalStats, PlayerHPmax/MPmax, CritChance, CritDamage,
// PlayerAccTot, PlayerSpeedBonus, DamageDealed and DamageDealtLIST, ArbitraryCode KillPerKill,
// HitChancePCT and FoodNOTconsume), after rebuilding the calcEtcBonuses, TalentCalc(-2) and artifact caches.
// latest.json is the same account's save from that day (OptionsListAccount[340] matches).
const GAME = {
  strength: 1711268,
  agility: 2133782,
  wisdom: 1700458,
  luck: 428072,
  maxHp: 503500335.21104157,
  maxMp: 11124953.036670001,
  critChance: 15006.939479264642,
  critDamage: 20.550566756908903,
  accuracy: 6.593752681348616e+26,
  // The game shows Math.round(100 * PlayerSpeedBonus()) + '%', PlayerSpeedBonus() = 420.38
  movementSpeed: 42038,
  defence: 37208658.19134345,
  baseDamage: 1674248.84625158,
  perXDamage: 6040764.524547299,
  percentDamage: 377060223871.6039,
  maxDamage: 3.8134902132212144e+24,
  nonConsumeChance: 99,
  // CalcAwayKills("Killing") rebuilt from live game values for the saved AFK target (w7b3 on map 317):
  // respawn bound 23 / (9.409 + 0.1)
  killsPerHour: 8707,
  // ArbitraryCode("KillPerKill") read while the character stood on map 200 with no AFK target
  killPerKill: 9540.29108183227,
  // ArbitraryCode("HitChancePCT") with DNSM.arbAcc3 set to PlayerAccTot / ratio (target Type Monster)
  hitChanceByRatio: { 0.3: 0, 0.5: 4, 0.7: 23, 1.2: 71, 1.5: 99, 3: 100 }
};

// Relative closeness: these values span 1e2 to 1e26
const expectRelative = (value, game, digits) => expect(value / game).toBeCloseTo(1, digits);

const { account, characters } = parseFixture(latest);
const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('Character stats verified against the live game', () => {
  const playerInfo = getMaxDamage(hunter, characters, account);
  const [baseNode, perXNode, percentNode] = playerInfo.damageBreakdown.tree;

  it.each(['strength', 'agility', 'wisdom', 'luck'])('total %s', (stat) => {
    expect(hunter.stats[stat]).toBe(GAME[stat]);
  });

  it.each(['maxHp', 'maxMp', 'critChance', 'critDamage', 'accuracy', 'movementSpeed'])('%s', (stat) => {
    expectRelative(playerInfo[stat], GAME[stat], 12);
  });

  it('defence', () => {
    expectRelative(playerInfo.defence.value, GAME.defence, 12);
  });

  it('base and per-X damage components', () => {
    expectRelative(evaluateBreakdownNode(baseNode), GAME.baseDamage, 12);
    // Includes Looty McShooty counting 1591 items (Gem entries dropped) and 37 dream clouds
    expectRelative(evaluateBreakdownNode(perXNode), GAME.perXDamage, 12);
  });

  // The rest is Fun Hippoete reading the save's baked Player_ cog build rates, which run ~1.6% above
  // the live CogMap (511.25% vs 511.01%)
  it('damage percent and max damage', () => {
    expectRelative(evaluateBreakdownNode(percentNode), GAME.percentDamage, 7);
    expectRelative(playerInfo.maxDamage, GAME.maxDamage, 7);
    expect(playerInfo.minDamage / playerInfo.maxDamage).toBeCloseTo(0.8, 12);
  });

  it('non consume chance', () => {
    expect(hunter.nonConsumeChance).toBe(GAME.nonConsumeChance);
  });

  // The hourly formula needs the character's own map, so the live value is rebuilt for the saved AFK target
  it('kills per hour', () => {
    expect(playerInfo.killsPerHour).toBe(GAME.killsPerHour);
  });

  // On map 200 with no AFK target the world band is empty and the stat talents still count; the overkill
  // ladder reaches its 51 tier cap against Nothing (42 HP)
  it('kill per kill', () => {
    const onMap200 = { ...hunter, mapIndex: 200, targetMonster: 'Nothing', afkTarget: 'Nothing' };
    const { killPerkill } = getMaxDamage(onMap200, characters, account);
    expectRelative(killPerkill.value, GAME.killPerKill, 12);
    expectRelative(evaluateBreakdown(killPerkill.breakdown), GAME.killPerKill, 12);
  });
});

describe('ArbitraryCode("HitChancePCT")', () => {
  const monster = { Type: 'Monster', Defence: 1 };

  it('live: the arbAcc3 defence override replaces the target\'s Defence', () => {
    Object.entries(GAME.hitChanceByRatio).forEach(([ratio, expected]) => {
      expect(calcHitChance(GAME.accuracy, monster, GAME.accuracy / Number(ratio))).toBe(expected);
    });
  });

  it('the 0.444 sentinel means no override', () => {
    expect(calcHitChance(70, { Type: 'Monster', Defence: 100 }, NO_DEFENCE_OVERRIDE)).toBe(calcHitChance(70, { Type: 'Monster', Defence: 100 }));
  });

  // The curves themselves are covered in __test__/utility/hit-chance.test.js; this proves the target's Type
  // reaches them (the monster curve would give 24 here). The oracle is the game's resource curve expression.
  it('a resource target uses the quarter-defence curve', () => {
    expect(calcHitChance(70, { Type: 'Ore', Defence: 100 })).toBe(Math.floor(6 * (.7 - .174) / (.7 - .17 + 9.04) * 100));
  });
});
