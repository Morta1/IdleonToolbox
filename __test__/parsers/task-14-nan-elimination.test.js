import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { getPrinterMulti } from '@parsers/world-3/printer';
import { getHoopsData, getDartsData } from '@parsers/highScores';
import { isCompanionBonusActive, getEventShopBonus, getDoubleStatueDrop } from '@parsers/misc';
import { getCompassBonus } from '@parsers/class-specific/compass';
import { mainStatMap } from '@parsers/talents';
import raw from '../../data/raw.json';

const parseRaw = () => parseFixture(raw);

/**
 * Task 14: batches A (Task 12) and B (Task 13) built a NaN gate that only ever walked the empty parse
 * and data/raw.json. That is exactly why 1549 NaN across printer/highscores/equinox/sailing/
 * accountLevel on four real player saves (first/second/third/fourth.json - 350/491/491/217 NaN
 * respectively) went undetected while the suite stayed green: nothing ever parsed those fixtures and
 * counted NaN outside the curated SECTIONS_TO_CHECK list in task-12-nan-elimination.test.js.
 *
 * This file closes that hole two ways:
 *  1. A single, fully UNSCOPED (every account key, not a curated list) NaN gate that walks all seven
 *     available saves - empty parse, data/raw.json, and every fixture file under __test__/fixtures/,
 *     discovered dynamically via fs.readdirSync so a fixture added later is covered automatically with
 *     no code change here.
 *  2. Root-cause replica proofs (task-12/13's byte-identical-unless-was-NaN technique) for each of the
 *     five sections named in the brief: printer, highscores, equinox, sailing, accountLevel.
 */

// ---------------------------------------------------------------------------------------------
// 1. Fully unscoped NaN gate, data-driven over every fixture file on disk.
// ---------------------------------------------------------------------------------------------

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const FIXTURES = fs.readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => [file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8'))]);

// Paths allowed to still be NaN, with a reason. Must shrink toward empty as sections are fixed - never
// add an entry just to make this test pass. Empty as of Task 14: every path named in the brief
// (printer, highscores, equinox, sailing, accountLevel) was fixed at the root, and re-running the
// unscoped walk found nothing else left anywhere in any of the seven saves.
export const KNOWN_NAN_EXCEPTIONS = [];

const countNaN = (root) => {
  let count = 0;
  const paths = [];
  const seen = new WeakSet();
  const walk = (v, path_, depth) => {
    if (depth > 16 || v == null) return;
    if (typeof v === 'number') {
      if (Number.isNaN(v)) {
        const collapsed = path_.replace(/\.\d+(\.|$)/g, '.[]$1');
        if (!KNOWN_NAN_EXCEPTIONS.includes(collapsed)) {
          count++;
          paths.push(collapsed);
        }
      }
      return;
    }
    if (typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    Object.entries(v).forEach(([k, x]) => walk(x, `${path_}.${k}`, depth + 1));
  };
  Object.entries(root ?? {}).forEach(([k, v]) => walk(v, k, 0));
  return { count, paths };
};

describe('NaN gate: every account key, on every save available', () => {
  it('produces zero NaN on an empty parse', () => {
    const { account } = parseEmpty();
    const { count, paths } = countNaN(account);
    expect(paths).toEqual([]);
    expect(count).toBe(0);
  });

  it('produces zero NaN on data/raw.json', () => {
    const { account } = parseRaw();
    const { count, paths } = countNaN(account);
    expect(paths).toEqual([]);
    expect(count).toBe(0);
  });

  it('discovered at least the five known fixture files', () => {
    // Guards against the fs.readdirSync glob silently matching nothing (e.g. a path typo), which
    // would make every it.each below a vacuous zero-iteration loop.
    expect(FIXTURES.length).toBeGreaterThanOrEqual(5);
  });

  it.each(FIXTURES)('%s: produces zero NaN, unscoped across every account key', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const { count, paths } = countNaN(account);
    expect(paths).toEqual([]);
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2a. printer - companionBonus/compassBonus/Winter-event all read `Number(accountOptions?.[N])`
// unguarded; `Number(undefined)` is NaN and poisons the whole multiplicative chain even though the
// paired bonus function (isCompanionBonusActive/getCompassBonus/getEventShopBonus) is itself always
// finite. raw.json and latest.json both have these three indices defined, so they exercise the
// no-op (byte-identical) side; first/second/third/fourth exercise the previously-NaN side.
// ---------------------------------------------------------------------------------------------

const getCompanionBonusPreFix = (account) =>
  1 + Number(account?.accountOptions?.[354]) * isCompanionBonusActive(account, 17) / 100;
const getCompassBonusPreFix = (account) =>
  1 + (Number(account?.accountOptions?.[364]) * getCompassBonus(account, 43)) / 100;
const getWinterEventPreFix = (account) =>
  1 + (2 * Number(account?.accountOptions?.[323]) * getEventShopBonus(account, 4)) / 100;

describe('printer companionBonus/compassBonus/Winter-event (Number(accountOptions?.[N]) guard fix)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: printer multi params are byte-identical unless previously NaN, and are always finite now', (_name, fixture) => {
    const { account, characters } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    let assertions = 0;

    const beforeCompanion = getCompanionBonusPreFix(account);
    const { params } = getPrinterMulti(account, characters);
    if (Number.isFinite(beforeCompanion)) expect(params.companionBonus).toBe(beforeCompanion);
    expect(Number.isFinite(params.companionBonus)).toBe(true);
    assertions++;

    const beforeCompass = getCompassBonusPreFix(account);
    if (Number.isFinite(beforeCompass)) expect(params.compassBonus).toBe(beforeCompass);
    expect(Number.isFinite(params.compassBonus)).toBe(true);
    assertions++;

    const beforeWinter = getWinterEventPreFix(account);
    const winterAfter = account.printer?.[0]?.[0]?.breakdown?.find((b) => b.name === 'Winter event')?.value;
    if (account.printer?.[0]?.[0]) {
      if (Number.isFinite(beforeWinter)) expect(winterAfter).toBe(beforeWinter);
      expect(Number.isFinite(winterAfter)).toBe(true);
      assertions++;
    }

    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json and latest.json have accountOptions[354/364/323] defined - the no-op case', () => {
    const { account: rawAccount, characters: rawCharacters } = parseRaw();
    expect(Number.isFinite(rawAccount?.accountOptions?.[354])).toBe(true);
    expect(Number.isFinite(rawAccount?.accountOptions?.[364])).toBe(true);
    expect(Number.isFinite(rawAccount?.accountOptions?.[323])).toBe(true);
    const { params } = getPrinterMulti(rawAccount, rawCharacters);
    expect(params.companionBonus).toBe(getCompanionBonusPreFix(rawAccount));
    expect(params.compassBonus).toBe(getCompassBonusPreFix(rawAccount));
  });

  it('first/second/third/fourth have accountOptions[354/364/323] undefined - exactly the previously-NaN case', () => {
    let previouslyNaNCount = 0;
    FIXTURES.forEach(([, fixture]) => {
      const { account } = parseFixture(fixture);
      if (Number.isNaN(getCompanionBonusPreFix(account))) previouslyNaNCount++;
    });
    expect(previouslyNaNCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2b. highscores hoops/darts upgrade cost - `.slice(N, N+4)` on a real (but short) accountOptions
// array returns `[]`, not an array of zeros; the top-level `?? [0,0,0,0]` fallback only ever catches
// a fully-missing accountOptions, never a short one, so `points[index]` was `undefined` and
// `Math.floor(2 + undefined / 12)` was NaN. raw.json/latest.json's accountOptions arrays reach past
// index 438, so they exercise the no-op side.
// ---------------------------------------------------------------------------------------------

const getPointsPreFix = (account, start) => (account?.accountOptions)?.slice(start, start + 4) ?? [0, 0, 0, 0];
const getCostPreFix = (points, index) =>
  1 == index ? Math.floor(3 + points[index] / 0.25) : 3 == index ? Math.floor(5 + points[index] / 0.05) : Math.floor(2 + points[index] / 12);

describe('highscores hoops/darts upgrade cost (short-array `.slice` gap fix)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: hoops/darts costs are byte-identical unless previously NaN, and are always finite now', (_name, fixture) => {
    const { account } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    let assertions = 0;

    const hoopsPointsBefore = getPointsPreFix(account, 419);
    const hoopsAfter = getHoopsData(account);
    hoopsAfter.upgrades.forEach((upgrade, index) => {
      const before = getCostPreFix(hoopsPointsBefore, index);
      if (Number.isFinite(before)) expect(upgrade.cost).toBe(before);
      expect(Number.isFinite(upgrade.cost)).toBe(true);
      assertions++;
    });

    const dartsPointsBefore = getPointsPreFix(account, 435);
    const dartsAfter = getDartsData(account);
    dartsAfter.upgrades.forEach((upgrade, index) => {
      const before = getCostPreFix(dartsPointsBefore, index);
      if (Number.isFinite(before)) expect(upgrade.cost).toBe(before);
      expect(Number.isFinite(upgrade.cost)).toBe(true);
      assertions++;
    });

    expect(assertions).toBe(8);
  });

  it('first/second/third/fourth have a short accountOptions array - exactly the previously-NaN case', () => {
    let previouslyNaNCount = 0;
    FIXTURES.forEach(([, fixture]) => {
      const { account } = parseFixture(fixture);
      const points = getPointsPreFix(account, 419);
      if ([0, 1, 2, 3].some((i) => Number.isNaN(getCostPreFix(points, i)))) previouslyNaNCount++;
    });
    expect(previouslyNaNCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2c. equinox Penguins bonus - `1 + accountOptions?.[320] / 10` unguarded; raw.json/latest.json have
// index 320 defined (no-op side), first/second/third/fourth don't (previously-NaN side).
// ---------------------------------------------------------------------------------------------

const getPenguinsPreFix = (account) => 1 + account?.accountOptions?.[320] / 10;

describe('equinox Penguins bonus (accountOptions[320] guard fix)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: Penguins breakdown value is byte-identical unless previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    if (!account.equinox) return; // locked feature - null by design, out of scope (not touched)
    const before = getPenguinsPreFix(account);
    const after = account.equinox.breakdown.find((b) => b.name === 'Penguins')?.value;
    if (Number.isFinite(before)) expect(after).toBe(before);
    expect(Number.isFinite(after)).toBe(true);
  });

  it('first/second/third/fourth have accountOptions[320] undefined - exactly the previously-NaN case', () => {
    let previouslyNaNCount = 0;
    FIXTURES.forEach(([, fixture]) => {
      const { account } = parseFixture(fixture);
      if (account.equinox && Number.isNaN(getPenguinsPreFix(account))) previouslyNaNCount++;
    });
    expect(previouslyNaNCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2d. sailing boats maxTime/timeLeft - islandIndex -1 (boat never dispatched) means `island` is
// genuinely undefined, so `island?.distance` optional-chains to undefined and poisons the division.
// This is a real "not applicable" case (a boat with no destination has no roundtrip time), fixed by
// leaving maxTime/timeLeft `undefined` instead of computing a fabricated number - the replica formula
// below is identical for every boat (optional chaining already no-ops when island is defined), so it
// proves both the no-op (deployed boats) and previously-NaN (undeployed boats) cases in one pass.
// ---------------------------------------------------------------------------------------------

const getBoatMaxTimePreFix = (boat) => (boat.island?.distance / boat.speed?.value) * 3600 * 1000;
const getBoatTimeLeftPreFix = (boat) => ((boat.island?.distance - boat.distanceTraveled) / boat.speed?.value) * 3600 * 1000;

describe('sailing boats maxTime/timeLeft (undeployed-boat undefined-island fix)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: every boat maxTime/timeLeft is byte-identical unless previously NaN, and is never NaN now', (_name, fixture) => {
    const { account } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    if (!account.sailing) return; // locked feature - null by design, out of scope (not touched)
    let assertions = 0;
    account.sailing.boats.forEach((boat) => {
      const beforeMax = getBoatMaxTimePreFix(boat);
      if (Number.isFinite(beforeMax)) {
        expect(boat.maxTime).toBe(beforeMax);
      } else {
        // Previously NaN (undeployed boat, no island) - now "not applicable" (undefined), never NaN.
        expect(boat.maxTime).toBeUndefined();
      }
      expect(Number.isNaN(boat.maxTime)).toBe(false);
      assertions++;

      const beforeLeft = getBoatTimeLeftPreFix(boat);
      if (Number.isFinite(beforeLeft)) {
        expect(boat.timeLeft).toBe(beforeLeft);
      } else {
        expect(boat.timeLeft).toBeUndefined();
      }
      expect(Number.isNaN(boat.timeLeft)).toBe(false);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('first and fourth have at least one undeployed boat (islandIndex -1) - exactly the previously-NaN case', () => {
    const undeployedCounts = FIXTURES.map(([, fixture]) => {
      const { account } = parseFixture(fixture);
      return account.sailing?.boats?.filter((b) => Number.isNaN(getBoatMaxTimePreFix(b))).length ?? 0;
    });
    expect(undeployedCounts.some((n) => n > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// 2e. sailing.timeToFullChests - `Math.min(...roundtripTimes)` poisons to NaN the moment any single
// boat's maxTime is undefined (an undeployed boat, per 2d above) - Math.min/max poison on ANY
// NaN/undefined argument, unlike a plain comparison. Fixed by filtering to only deployed boats' times
// before the fleet-wide fastest-roundtrip estimate.
// ---------------------------------------------------------------------------------------------

const calculateMaxCapacityTimePreFix = (roundtripTimes, maxCapacity) => {
  const minTime = Math.min(...roundtripTimes);
  const acquisitionRate = maxCapacity / minTime;
  let accumulatedTime = 0;
  let chestCount = 0;
  for (const boatTime of roundtripTimes) {
    accumulatedTime += boatTime;
    chestCount += acquisitionRate * (accumulatedTime - boatTime);
    if (chestCount >= maxCapacity) break;
  }
  return accumulatedTime;
};

describe('sailing.timeToFullChests (Math.min NaN-poisoning-on-undeployed-boat fix)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: timeToFullChests is byte-identical unless previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    if (!account.sailing) return; // locked feature - null by design, out of scope (not touched)
    const roundtripsBefore = account.sailing.boats.map(getBoatMaxTimePreFix);
    const maxCapacity = account.sailing.maxChests - (account.sailing.chests?.length || 0);
    const before = calculateMaxCapacityTimePreFix(roundtripsBefore, maxCapacity);
    const after = account.sailing.timeToFullChests;
    if (Number.isFinite(before)) {
      expect(after).toBe(before);
    } else if (roundtripsBefore.filter((t) => Number.isFinite(t)).length === 0) {
      // Every boat undeployed (first.json's real shape: a single, never-dispatched boat) - there is
      // no fleet roundtrip to estimate from at all, so "not applicable" (undefined) is the honest
      // value, not a fabricated 0 or Infinity from Math.min() on an empty spread.
      expect(after).toBeUndefined();
    } else {
      expect(Number.isFinite(after)).toBe(true);
    }
    expect(Number.isNaN(after)).toBe(false);
  });

  it('first and fourth previously produced NaN here (at least one undeployed boat poisons Math.min)', () => {
    let previouslyNaNCount = 0;
    FIXTURES.forEach(([, fixture]) => {
      const { account } = parseFixture(fixture);
      if (!account.sailing) return;
      const roundtripsBefore = account.sailing.boats.map(getBoatMaxTimePreFix);
      const maxCapacity = account.sailing.maxChests - (account.sailing.chests?.length || 0);
      if (Number.isNaN(calculateMaxCapacityTimePreFix(roundtripsBefore, maxCapacity))) previouslyNaNCount++;
    });
    expect(previouslyNaNCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2f. sailing.artifacts Crystal_Steak additionalData[].bonus - a character slot with no parsed
// class/stats (an empty companion slot, found on fourth.json's "KyroChallenge3/4") has `stat`
// undefined, and `Math.floor(undefined / 100)` is NaN. `?? 0` on the read matches the same-shaped
// guard the Socrates branch two cases below already applies to every one of its own stat reads.
// ---------------------------------------------------------------------------------------------

describe('sailing.artifacts Crystal_Steak additionalData[].bonus (empty character-slot stat guard)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: every character bonus entry is byte-identical unless previously NaN, and is always finite now', (_name, fixture) => {
    const { account, characters } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    if (!account.sailing) return; // locked feature - null by design, out of scope (not touched)
    const artifact = account.sailing.artifacts.find((a) => a.name === 'Crystal_Steak');
    if (!artifact) return;
    const upgradedForm = [2, 3, 4, 5, 6].includes(artifact.acquired);
    let assertions = 0;
    characters.forEach(({ name, class: className, stats }, index) => {
      const mainStat = mainStatMap?.[className];
      const stat = stats?.[mainStat];
      const before = (upgradedForm ? artifact.baseBonus * artifact.acquired : artifact.baseBonus) * Math.floor(stat / 100);
      const after = artifact.additionalData?.[index]?.bonus;
      if (Number.isFinite(before)) expect(after).toBe(before);
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('fourth.json has empty character slots (KyroChallenge3/4, no class/stats) - exactly the previously-NaN case', () => {
    const fourthFixture = FIXTURES.find(([name]) => name === 'fourth');
    expect(fourthFixture).toBeDefined();
    const { account, characters } = parseFixture(fourthFixture[1]);
    const artifact = account.sailing.artifacts.find((a) => a.name === 'Crystal_Steak');
    const upgradedForm = [2, 3, 4, 5, 6].includes(artifact.acquired);
    let previouslyNaNCount = 0;
    characters.forEach(({ class: className, stats }) => {
      const mainStat = mainStatMap?.[className];
      const stat = stats?.[mainStat];
      const before = (upgradedForm ? artifact.baseBonus * artifact.acquired : artifact.baseBonus) * Math.floor(stat / 100);
      if (Number.isNaN(before)) previouslyNaNCount++;
    });
    expect(previouslyNaNCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------
// 2g. accountLevel - `charactersData.reduce((sum, { level }) => sum + level, 0)`; the same empty
// character slots from 2f have `level` undefined, and `sum + undefined` poisons the running total to
// NaN for every subsequent character too.
// ---------------------------------------------------------------------------------------------

const getAccountLevelPreFix = (characters) => characters?.reduce((sum, { level }) => sum + level, 0);

describe('accountLevel (empty character-slot level guard)', () => {
  it.each([...FIXTURES, ['raw', raw]])('%s: accountLevel is byte-identical unless previously NaN, and is always finite now', (_name, fixture) => {
    const { account, characters } = _name === 'raw' ? parseRaw() : parseFixture(fixture);
    const before = getAccountLevelPreFix(characters);
    const after = account.accountLevel;
    if (Number.isFinite(before)) expect(after).toBe(before);
    expect(Number.isFinite(after)).toBe(true);
  });

  it('fourth.json previously produced NaN here (empty character slots poison the level sum)', () => {
    const fourthFixture = FIXTURES.find(([name]) => name === 'fourth');
    const { characters } = parseFixture(fourthFixture[1]);
    expect(Number.isNaN(getAccountLevelPreFix(characters))).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// 3. Empty-account guards must not zero a real save.
//
// This is a defect class the NaN gate above is blind to by construction: a guard added to stop a
// signed-out NaN can replace a real save's bonus with 0, and 0 is a finite, well-formed number that
// every gate on this branch happily accepts.
//
// It happened. getDoubleStatueDrop gated its Kattelkruk minor bonus on `kattelkrukPlayer ? ... : 0`.
// The minor bonus is gated on owning the god, not on someone being linked to it - see the
// getMinorDivinityBonus calls in damage.ts, which gate on `hasDoot`. Three of the five fixtures have
// no Kattelkruk link, and all three silently lost the bonus (8.44 / 9.70 / 5.71 -> 0) for the whole
// life of the branch with the suite green.
//
// The guard was also unnecessary: the NaN it was written to stop is fixed at the root in
// getMinorDivinityBonus, whose `?? 0` on the divinity level makes an empty account return 0 anyway.
// ---------------------------------------------------------------------------------------------

describe('getDoubleStatueDrop keeps the Kattelkruk minor bonus without a linked player', () => {
  const UNLINKED = ['second', 'third', 'fourth'];

  it.each(UNLINKED)('%s: has no Kattelkruk link, and still gets a non-zero divinity bonus', (name) => {
    const fixture = FIXTURES.find(([fixtureName]) => fixtureName === name);
    // If a fixture is renamed the .find returns undefined and this test would throw rather than
    // pass vacuously, but assert the premise anyway so the failure names the real cause.
    expect(fixture).toBeDefined();
    const { account, characters } = parseFixture(fixture[1]);

    expect(characters.some(({ linkedDeity }) => linkedDeity === 8)).toBe(false);

    const { breakdown } = getDoubleStatueDrop(account, characters?.[0], characters);
    const divinity = breakdown.find(({ name: label }) => label === 'Divinity').value;
    expect(divinity).toBeGreaterThan(0);
  });

  it('an empty account still gets 0, not NaN, with no guard in getDoubleStatueDrop', () => {
    // The load-bearing half: without this, deleting the guard could reintroduce the NaN it was
    // added for. The root fix lives in getMinorDivinityBonus, not here.
    const { account, characters } = parseEmpty();
    const { value, breakdown } = getDoubleStatueDrop(account, characters?.[0], characters);
    const divinity = breakdown.find(({ name: label }) => label === 'Divinity').value;
    expect(Number.isNaN(divinity)).toBe(false);
    expect(divinity).toBe(0);
    expect(Number.isFinite(value)).toBe(true);
  });

  it('a save WITH a linked player is unaffected', () => {
    const { account, characters } = parseRaw();
    expect(characters.some(({ linkedDeity }) => linkedDeity === 8)).toBe(true);
    const { breakdown } = getDoubleStatueDrop(account, characters?.[0], characters);
    expect(breakdown.find(({ name: label }) => label === 'Divinity').value).toBeGreaterThan(0);
  });
});
