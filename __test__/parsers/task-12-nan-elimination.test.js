import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { tryToParse } from '@utility/helpers';
import { territory as territoryCatalog, deathNote, summoningEnemies } from '@website-data';
import { getVialsBonusByEffect, getSigilBonus } from '@parsers/world-2/alchemy';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';
import raw from '../../data/raw.json';

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

const parseEmpty = () => parseData(undefined, [], null, null, undefined, undefined, null);
const parseFixture = (fixture) => {
  const data = fixture.data ?? fixture;
  return parseData(data, fixture.charNames ?? [], fixture.companion ?? null, fixture.guildData ?? null, fixture.serverVars);
};
const parseRaw = () => {
  const { data, charNames, companion, guildData, serverVars } = raw;
  return parseData(data, charNames, companion, guildData, serverVars);
};

/**
 * Task 12 (batch A): stamps/islands/currencies/breeding/summoning were the sections producing NaN
 * for REAL signed-in users, not just an empty account (62 NaN across these 5 sections on
 * data/raw.json before this task; 0 after). This file is the permanent regression coverage.
 *
 * Two kinds of proof, mirroring task-10-empty-account-sections.test.js's technique:
 *  1. A blanket NaN gate (below) - zero NaN across these 5 sections on both an empty parse and every
 *     real fixture. `SECTIONS_TO_CHECK` is meant to grow as batch B converts more sections; any path
 *     that turns out genuinely intractable goes in `KNOWN_NAN_EXCEPTIONS` with a comment - that list
 *     must shrink (or stay empty) as sections get fixed, never grow to hide a new regression.
 *  2. Per-section "before vs after" replicas of the exact pre-fix formula (verbatim from git history),
 *     run against each fixture's own real parsed account, proving every value that was already finite
 *     is byte-identical after the fix, and every value that was NaN is now finite. Only the formulas
 *     that could realistically change a REAL fixture's non-NaN output get a full replica; guards that
 *     only ever fire on undefined/missing save data (never on defined real values) are instead proven
 *     as no-ops by asserting their guarded input is already defined/finite on every real fixture.
 *
 * Every `it.each(FIXTURES)` body counts its own assertions and checks the count is > 0 at the end -
 * this project has hit the "silent vacuous loop over absent fixture data" defect four times before.
 */

// ---------------------------------------------------------------------------------------------
// 1. Blanket NaN gate
// ---------------------------------------------------------------------------------------------

export const SECTIONS_TO_CHECK = ['stamps', 'islands', 'currencies', 'breeding', 'summoning'];
// Paths that are allowed to still be NaN, with a reason. Must shrink toward empty as sections are
// fixed - never add an entry here just to make this test pass.
export const KNOWN_NAN_EXCEPTIONS = [];

export const countNaN = (root, sectionKeys) => {
  let count = 0;
  const seen = new WeakSet();
  const walk = (v, path, depth) => {
    if (depth > 14 || v == null) return;
    if (typeof v === 'number') {
      if (Number.isNaN(v) && !KNOWN_NAN_EXCEPTIONS.includes(path.replace(/\.\d+\./g, '.[].'))) count++;
      return;
    }
    if (typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`, depth + 1));
  };
  sectionKeys.forEach((key) => walk(root?.[key], key, 0));
  return count;
};

describe('NaN gate: stamps/islands/currencies/breeding/summoning', () => {
  it('produces zero NaN on an empty parse', () => {
    const { account } = parseEmpty();
    expect(countNaN(account, SECTIONS_TO_CHECK)).toBe(0);
  });

  it('produces zero NaN on the real (raw.json) parse', () => {
    const { account } = parseRaw();
    expect(countNaN(account, SECTIONS_TO_CHECK)).toBe(0);
  });

  it.each(FIXTURES)('%s: produces zero NaN', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(countNaN(account, SECTIONS_TO_CHECK)).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2a. stamps.*.materialCost - the dominant fix (51 of 62 real NaN). Verbatim pre-fix getMaterialCost
// (the tier exponent was `round(level / reqItemMultiplicationLevel) - 1`, negative - and therefore
// NaN through `Math.pow(negative, 0.8)` - for any level below half of reqItemMultiplicationLevel).
// ---------------------------------------------------------------------------------------------

const getMaterialCostPreFix = (level, stamp, account, reduction = 0, gildedStamp) => {
  const reductionVial = getVialsBonusByEffect(account?.alchemy?.vials, 'material_cost_for_stamps');
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'ENVELOPE_PILE') ?? 0;
  const sigilReduction = (1 / (1 + sigilBonus / 100));
  const stampReducerVal = Math.max(0.1, 1 - reduction / 100);
  const meritocracyBonus = 1 / (1 + getMeritocracyBonus(account, 14) / 100);

  return Math.max(1, (stamp?.baseMatCost * (gildedStamp ? 0.05 : 1)
    * meritocracyBonus
    * stampReducerVal
    * sigilReduction
    * Math.pow(stamp?.powMatBase, Math.pow(Math.round(level / stamp?.reqItemMultiplicationLevel) - 1, 0.8)))
    * Math.max(0.1, 1 - (reductionVial / 100)));
};

describe('stamps materialCost (tier exponent clamp fix)', () => {
  it.each(FIXTURES)('%s: every stamp materialCost is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    // evaluateStamp defaults gildedStamp to true and updateStamps never overrides it - see
    // parsers/index.ts's `updateStamps(accountData, charactersData)` call with no third argument.
    // account.atoms.stampReducer's own NaN-guard is a documented separate fix (proven a no-op for
    // real saves in the "guard-only fixes" describe block below), so reading it directly here is
    // exactly the value evaluateStamp fed into the pre-fix formula too.
    const stampReducer = account?.atoms?.stampReducer;
    let assertions = 0;
    ['combat', 'skills', 'misc'].forEach((category) => {
      account.stamps[category].forEach((stamp) => {
        const before = Math.floor(getMaterialCostPreFix(stamp.level, stamp, account, stampReducer, true));
        const after = stamp.materialCost;
        if (Number.isFinite(before)) {
          expect(after).toBe(before);
        }
        expect(Number.isFinite(after)).toBe(true);
        assertions++;
      });
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json: every stamp materialCost is byte-identical unless it was previously NaN, and is always finite now', () => {
    const { account } = parseRaw();
    const stampReducer = account?.atoms?.stampReducer;
    let assertions = 0;
    let previouslyNaNCount = 0;
    ['combat', 'skills', 'misc'].forEach((category) => {
      account.stamps[category].forEach((stamp) => {
        const before = Math.floor(getMaterialCostPreFix(stamp.level, stamp, account, stampReducer, true));
        const after = stamp.materialCost;
        if (Number.isFinite(before)) {
          expect(after).toBe(before);
        } else {
          previouslyNaNCount++;
        }
        expect(Number.isFinite(after)).toBe(true);
        assertions++;
      });
    });
    // Documents why this fixture is the interesting one: it actually exercises the previously-broken
    // path (unleveled stamps), unlike an already-maxed test fixture might.
    expect(previouslyNaNCount).toBeGreaterThan(0);
    expect(assertions).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2b. islands - the multiplier table gap (index 6, all islands unlocked) is the one change that can
// alter a real fixture's non-NaN value; the rest are `?? 0` guards on always-defined real data.
// ---------------------------------------------------------------------------------------------

const ISLANDS_CATALOG = [
  { preUnlockCost: 4, baseCost: 10 },
  { preUnlockCost: 12, baseCost: 12 },
  { preUnlockCost: 20, baseCost: 15 },
  { preUnlockCost: 28, baseCost: 50 },
  { preUnlockCost: 40, baseCost: 25 },
  { preUnlockCost: 52, baseCost: 70 }
];
const OLD_PRE_UNLOCK_MULTIPLIERS = { 0: 0, 1: 8, 2: 32, 3: 80, 4: 200, 5: 500 };
const OLD_MULTIPLIERS = { 0: 0, 1: 15, 2: 45, 3: 100, 4: 200, 5: 500 }; // no `6` entry - the bug

describe('islands cost (multiplier table gap at index 6 fix)', () => {
  it.each(FIXTURES)('%s: every island cost is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const islandsUnlocked = account?.accountOptions?.[169]?.length;
    let assertions = 0;
    ISLANDS_CATALOG.forEach((island, index) => {
      const before = islandsUnlocked === 0
        ? island.preUnlockCost + OLD_PRE_UNLOCK_MULTIPLIERS[islandsUnlocked]
        : island.baseCost + OLD_MULTIPLIERS[islandsUnlocked];
      const after = account.islands.list[index].cost;
      if (Number.isFinite(before)) {
        expect(after).toBe(before);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBe(6);
  });

  it('raw.json: all 6 islands unlocked exercises the index-6 gap, and the fixed cost matches the frozen (freeze-at-500) game formula', () => {
    const { account } = parseRaw();
    const islandsUnlocked = account?.accountOptions?.[169]?.length;
    expect(islandsUnlocked).toBe(6);
    ISLANDS_CATALOG.forEach((island, index) => {
      const before = OLD_MULTIPLIERS[islandsUnlocked]; // undefined - the bug
      expect(before).toBeUndefined();
      expect(account.islands.list[index].cost).toBe(island.baseCost + 500);
    });
  });
});

// ---------------------------------------------------------------------------------------------
// 2c. currencies.KeysAll totalAmount - indices 3/4 (Troll's_Enclave_Key, Kruk's_Volcano_Key) have no
// NPC dialog day-tracking in the `npcs` map at all, so `daysSincePickup` is undefined by design on
// EVERY real account, not just an empty one - this is why raw.json itself had this NaN before the fix.
// ---------------------------------------------------------------------------------------------

describe('currencies.KeysAll totalAmount (undefined daysSincePickup for keys 3/4)', () => {
  it.each(FIXTURES)('%s: keys 0-2 (tracked NPCs) are byte-identical, keys 3-4 (untracked) are now finite instead of NaN', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    let assertions = 0;
    account.currencies.KeysAll.forEach((key, index) => {
      const before = Math.min(key.daysSincePickup, 3) * key.amountPerDay; // old formula, no `?? 0`
      if (index <= 2) {
        // Tracked keys always have a defined daysSincePickup on a real save, so the guard is a no-op.
        expect(Number.isFinite(before)).toBe(true);
        expect(key.totalAmount).toBe(before);
      } else {
        // Untracked keys: daysSincePickup is undefined by design, amountPerDay is 0, old formula was
        // always NaN (`NaN * 0` is NaN, not 0) - new formula is 0 regardless of fixture content.
        expect(Number.isNaN(before)).toBe(true);
        expect(key.totalAmount).toBe(0);
      }
      assertions++;
    });
    expect(assertions).toBe(5);
  });
});

// ---------------------------------------------------------------------------------------------
// 2d. breeding.territories[].reqProgress - a territory past the length of the save's own Territory
// array (locked/unreached) has no foraging-rounds entry; this is exactly what raw.json hit for real
// (indices 26/27), not just an empty account.
// ---------------------------------------------------------------------------------------------

const terri = territoryCatalog.filter((_, index) => index !== 14);

describe('breeding.territories reqProgress (missing foragingRounds entry fix)', () => {
  it.each(FIXTURES)('%s: every territory reqProgress is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const territoryRaw = tryToParse(data?.Territory) || data?.Territory;
    const foragingRounds = territoryRaw?.map(([, round]) => round);
    let assertions = 0;
    account.breeding.territories.forEach((t, index) => {
      const bonus = 1 + .02 / ((t.team?.filter((m) => m?.gene?.name === 'Monolithic')?.length ?? 0) / 5 + 1);
      const powerReq = index > 14 ? terri?.[index - 1]?.powerReq : terri?.[index]?.powerReq;
      const rawRounds = foragingRounds?.[index];
      const before = (powerReq + rawRounds) * Math.pow(bonus, rawRounds);
      const after = t.reqProgress;
      if (Number.isFinite(before)) {
        expect(after).toBe(before);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json: territories beyond the save length are exactly the previously-NaN case', () => {
    const { data } = raw;
    const { account } = parseRaw();
    const territoryRaw = tryToParse(data?.Territory) || data?.Territory;
    const foragingRounds = territoryRaw?.map(([, round]) => round);
    let previouslyNaNCount = 0;
    account.breeding.territories.forEach((t, index) => {
      const bonus = 1 + .02 / ((t.team?.filter((m) => m?.gene?.name === 'Monolithic')?.length ?? 0) / 5 + 1);
      const powerReq = index > 14 ? terri?.[index - 1]?.powerReq : terri?.[index]?.powerReq;
      const rawRounds = foragingRounds?.[index];
      const before = (powerReq + rawRounds) * Math.pow(bonus, rawRounds);
      if (!Number.isFinite(before)) {
        previouslyNaNCount++;
        expect(Number.isFinite(t.reqProgress)).toBe(true);
      }
    });
    expect(previouslyNaNCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2e. summoning careerWins[7] - deathNote goes up to world 6 (-> careerWins key 7), which the old
// object never declared. raw.json has real wins logged against world-6 deathNote monsters, which is
// exactly what made `.summoning.upgrades[0][0].totalBonus` NaN on a REAL account before the fix.
// ---------------------------------------------------------------------------------------------

const whiteBattleOrderReplica = ['Pet1', 'Pet2', 'Pet3', 'Pet0', 'Pet4', 'Pet6', 'Pet5', 'Pet10', 'Pet11'];

const computeAllWinsPreFix = (wonBattles) => {
  const careerWins = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // old object - no key 7
  wonBattles?.forEach((enemyId) => {
    const monsterData = summoningEnemies.find((enemy) => enemy.enemyId === enemyId);
    if (monsterData && monsterData?.bonusId < 20) {
      const whiteOrder = whiteBattleOrderReplica.findIndex((rawName) => monsterData.enemyId === rawName);
      if (whiteOrder !== -1) {
        careerWins[0] += 1;
      } else {
        const deathNoteOrder = deathNote.find(({ rawName }) => monsterData.enemyId === rawName);
        if (deathNoteOrder) {
          careerWins[deathNoteOrder.world + 1] += 1; // careerWins[7] starts undefined -> NaN, verbatim
        }
      }
    }
  });
  return Object.values(careerWins).reduce((sum, wins) => sum + wins, 0);
};

describe('summoning upgrade[originalIndex 0].totalBonus (careerWins[7] fix)', () => {
  it.each(FIXTURES)('%s: totalBonus is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const rawSummon = tryToParse(data?.Summon);
    const wonBattles = rawSummon?.[1];
    const allWinsBefore = computeAllWinsPreFix(wonBattles);
    const upgrade0 = Object.values(account.summoning.upgrades).flat().find((u) => u.originalIndex === 0);
    const before = upgrade0.value * allWinsBefore;
    const after = upgrade0.totalBonus;
    if (Number.isFinite(before)) {
      expect(after).toBe(before);
    }
    expect(Number.isFinite(after)).toBe(true);
  });

  it('raw.json: has a logged win against a world-6 deathNote monster, exactly the previously-NaN case', () => {
    const { data } = raw;
    const { account } = parseRaw();
    const rawSummon = tryToParse(data?.Summon);
    const wonBattles = rawSummon?.[1];
    const allWinsBefore = computeAllWinsPreFix(wonBattles);
    expect(Number.isNaN(allWinsBefore)).toBe(true);
    const upgrade0 = Object.values(account.summoning.upgrades).flat().find((u) => u.originalIndex === 0);
    expect(Number.isFinite(upgrade0.totalBonus)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// 2f. summoning upgrades[].totalCost / armyHealth / armyDamage all used to re-read
// `account?.accountOptions?.[319]` raw (no `?? 0`), unlike `highestEndlessLevel` a few lines above
// each of them which already had the guard. accountOptions[319] (Endless Summoning depth) turns out
// to be undefined on most of these fixtures too (most haven't touched that late-game feature) - this
// was NOT a guard-only, empty-account-only fix; it was already NaN for real, non-empty accounts.
// ---------------------------------------------------------------------------------------------

const getTotalCostPreFix = (upgrade, flatUpgrades, account) => {
  const costDeflation = flatUpgrades.find((u) => u.originalIndex === 49);
  const costCrashing = flatUpgrades.find((u) => u.originalIndex === 57);
  const tesseractBonus = getTesseractBonus(account, 54) * account?.accountOptions?.[319]; // raw, no `?? 0`
  return (1 / (1 + (costDeflation?.value ?? 0) / 100))
    * (1 / (1 + (costCrashing?.value ?? 0) / 100))
    * (1 / (1 + tesseractBonus / 100))
    * upgrade?.cost
    * Math.pow(upgrade?.costExponent, upgrade?.level)
    * Math.max(0.1, 1 - Math.max(getSushiBonus(account, 38), getSushiBonus(account, 47)) / 100)
    * Math.max(0.1, 1 - Math.max(getSushiBonus(account, 9), getSushiBonus(account, 34)) / 100);
};

const getArmyHealthPreFix = (flatUpgrades, totalUpgradesLevels, account) => {
  const additiveArmyHealth = [1, 10, 35, 37].reduce((sum, bonusIndex) => {
    const hpBonus = flatUpgrades.find((u) => u.originalIndex === bonusIndex) || {};
    return sum + hpBonus?.value;
  }, 0);
  const firstMulti = flatUpgrades.find((u) => u.originalIndex === 20)?.value || 0;
  const secondMulti = flatUpgrades.find((u) => u.originalIndex === 50)?.value || 0;
  const moreAdditive = flatUpgrades.find((u) => u.originalIndex === 59)?.value || 0;
  const thirdMulti = flatUpgrades.find((u) => u.originalIndex === 61)?.value || 0;
  const endlessMulti = flatUpgrades.find((u) => u.originalIndex === 63)?.value || 0;
  return 1 * (1 + additiveArmyHealth)
    * (1 + firstMulti / 100)
    * (1 + (secondMulti + (moreAdditive + endlessMulti * account?.accountOptions?.[319])) / 100) // raw, no `?? 0`
    * (1 + (thirdMulti * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100);
};

const getArmyDamagePreFix = (flatUpgrades, totalUpgradesLevels, account) => {
  const additiveArmyDamage = [3, 12, 21, 31].reduce((sum, bonusIndex) => {
    const hpBonus = flatUpgrades.find((u) => u.originalIndex === bonusIndex) || {};
    return sum + hpBonus?.value;
  }, 0);
  const firstMulti = flatUpgrades.find((u) => u.originalIndex === 43)?.value || 0;
  const secondMulti = flatUpgrades.find((u) => u.originalIndex === 51)?.value || 0;
  const moreAdditive = flatUpgrades.find((u) => u.originalIndex === 56)?.value || 0;
  const thirdMulti = flatUpgrades.find((u) => u.originalIndex === 47)?.value || 0;
  const fourthMulti = flatUpgrades.find((u) => u.originalIndex === 60)?.value || 0;
  const endlessMulti = flatUpgrades.find((u) => u.originalIndex === 64)?.value || 0;
  return 1 * (1 + additiveArmyDamage)
    * (1 + firstMulti / 100)
    * (1 + (secondMulti + (moreAdditive + endlessMulti * account?.accountOptions?.[319])) / 100) // raw, no `?? 0`
    * (1 + (thirdMulti * 0) / 100)
    * (1 + (fourthMulti * Math.max(0, Math.floor(totalUpgradesLevels / 100))) / 100);
};

describe('summoning upgrades[].totalCost / armyHealth / armyDamage (raw accountOptions[319] re-read fix)', () => {
  it.each(FIXTURES)('%s: totalCost for every upgrade is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const flat = Object.values(account.summoning.upgrades).flat();
    let assertions = 0;
    flat.forEach((upgrade) => {
      const before = getTotalCostPreFix(upgrade, flat, account);
      const after = upgrade.totalCost;
      if (Number.isFinite(before)) {
        expect(after).toBe(before);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it.each(FIXTURES)('%s: armyHealth and armyDamage are byte-identical unless they were previously NaN, and are always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const flat = Object.values(account.summoning.upgrades).flat();
    const { totalUpgradesLevels } = account.summoning;

    const beforeHealth = getArmyHealthPreFix(flat, totalUpgradesLevels, account);
    const afterHealth = account.summoning.armyHealth;
    if (Number.isFinite(beforeHealth)) {
      expect(afterHealth).toBe(beforeHealth);
    }
    expect(Number.isFinite(afterHealth)).toBe(true);

    const beforeDamage = getArmyDamagePreFix(flat, totalUpgradesLevels, account);
    const afterDamage = account.summoning.armyDamage;
    if (Number.isFinite(beforeDamage)) {
      expect(afterDamage).toBe(beforeDamage);
    }
    expect(Number.isFinite(afterDamage)).toBe(true);
  });

  it('raw.json: accountOptions[319] is defined here, so this is the no-op case for comparison', () => {
    const { account } = parseRaw();
    expect(Number.isFinite(account.accountOptions?.[319])).toBe(true);
    const flat = Object.values(account.summoning.upgrades).flat();
    const beforeHealth = getArmyHealthPreFix(flat, account.summoning.totalUpgradesLevels, account);
    expect(account.summoning.armyHealth).toBe(beforeHealth);
  });
});

// ---------------------------------------------------------------------------------------------
// 2g. Guard-only fixes: every other change in this task is `X ?? 0` (or `Number.isFinite(x) ? x : 0`)
// applied to a value that is only ever undefined/NaN when there's no save at all (or, for the atoms/
// rift cross-section reads, when a section outside this task's scope hasn't been converted yet). A
// nullish/NaN-coalescing guard is provably an identity function whenever its input is already
// defined/finite, so proving the guarded input is defined/finite on every real fixture is a complete
// proof that these guards cannot have changed any real fixture's output - no need to re-derive the
// full downstream formula (multiple layers of bonus multipliers) for each one.
// ---------------------------------------------------------------------------------------------

describe('guard-only fixes are no-ops on real save data (guarded input is already defined/finite)', () => {
  it.each(FIXTURES)('%s: every guarded input this task added `?? 0` / finite-checks to is already defined on a real save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    let assertions = 0;

    // stamps.ts: account?.atoms?.stampReducer (Number.isFinite guard)
    expect(Number.isFinite(account.atoms.stampReducer)).toBe(true);
    assertions++;

    // islands.ts: accountOptions[164/163/166/167], quests reduce, islandsUnlocked, shimmer bonus
    expect(Number.isFinite(account.accountOptions?.[164])).toBe(true);
    expect(Number.isFinite(account.accountOptions?.[163])).toBe(true);
    expect(Number.isFinite(account.accountOptions?.[166])).toBe(true);
    expect(Number.isFinite(account.accountOptions?.[167])).toBe(true);
    expect(account.accountOptions?.[169]).toBeDefined();
    assertions += 5;

    // index.ts: idleonData.MoneyBANK (bankMoney guard)
    expect(data?.MoneyBANK).toBeDefined();
    assertions++;

    // misc.ts: ColosseumTickets NPC day-tracking (unlike KeysAll 3/4, all 3 ticket NPCs are tracked)
    [15, 35, 56].forEach((idx) => {
      expect(Number.isFinite(account.accountOptions?.[idx])).toBe(true);
      assertions++;
    });

    // breeding.ts: accountOptions[87] (timeToNextEgg), rift.currentRift, characters exist for
    // eggsPowerRange's breedingLevel
    expect(Number.isFinite(account.accountOptions?.[87])).toBe(true);
    expect(Number.isFinite(account.rift?.currentRift)).toBe(true);
    assertions += 2;

    // summoning.ts: meritsDescriptions[5][4].level (raw accountOptions[319] re-reads are NOT a
    // no-op on several of these fixtures - see the dedicated totalCost/armyHealth/armyDamage
    // describe block above, which proves those with real before/after replicas instead).
    expect(Number.isFinite(account.meritsDescriptions?.[5]?.[4]?.level)).toBe(true);
    const rawSummon = tryToParse(data?.Summon);
    expect(rawSummon?.[0]).toBeDefined();
    assertions += 2;

    expect(assertions).toBeGreaterThan(0);
  });
});
