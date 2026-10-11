import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMaxDamage } from '@parsers/damage';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';

// Character page Stats read from the running game on 11 Oct 2026 for IAmTheHunterrr, the logged-in
// character, through the debug server (TotalStats, PlayerHPmax/MPmax, CritChance, CritDamage,
// PlayerAccTot, PlayerSpeedBonus, DamageDealed and DamageDealtLIST, ArbitraryCode KillPerKill and
// FoodNOTconsume), after rebuilding the calcEtcBonuses, TalentCalc(-2) and artifact caches.
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
  nonConsumeChance: 99
};

// Relative closeness: these values span 1e2 to 1e26
const expectRelative = (value, game, digits) => expect(value / game).toBeCloseTo(1, digits);

describe('Character stats verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
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
    expectRelative(evaluateBreakdown(playerInfo.defence.breakdown), GAME.defence, 12);
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
    expectRelative(evaluateBreakdown(playerInfo.damageBreakdown), GAME.maxDamage, 7);
    expect(playerInfo.minDamage / playerInfo.maxDamage).toBeCloseTo(0.8, 12);
  });

  it('non consume chance', () => {
    expect(hunter.nonConsumeChance).toBe(GAME.nonConsumeChance);
  });

  it('Fun Hippoete artifact', () => {
    const artifact = account.sailing.artifacts.find(({ name }) => name === 'Fun_Hippoete');
    expect(artifact.bonus / 511.00826857903667).toBeCloseTo(1, 3);
  });

  // The hourly formula needs the character's own map, so this rebuilds CalcAwayKills("Killing") from
  // live game values for the saved AFK target (w7b3 on map 317): respawn bound 23 / (9.409 + 0.1)
  it('kills per hour', () => {
    expect(playerInfo.killsPerHour).toBe(8707);
  });
});

describe('Kill per kill verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
  // Read while the character stood on map 200 with no AFK target, so the world band is empty and the
  // stat talents still count; the overkill ladder reaches its 51 tier cap against Nothing (42 HP)
  const onMap200 = { ...hunter, mapIndex: 200, targetMonster: 'Nothing', afkTarget: 'Nothing' };

  it('ArbitraryCode KillPerKill', () => {
    const { killPerkill } = getMaxDamage(onMap200, characters, account);
    expectRelative(killPerkill.value, 9540.29108183227, 12);
    expectRelative(evaluateBreakdown(killPerkill.breakdown), 9540.29108183227, 12);
  });
});
