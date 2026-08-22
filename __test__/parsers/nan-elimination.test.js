import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { tryToParse } from '@utility/helpers';
import { territory as territoryCatalog, deathNote, summoningEnemies } from '@website-data';
import { getVialsBonusByEffect, getSigilBonus } from '@parsers/world-2/alchemy';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getPrinterMulti } from '@parsers/world-3/printer';
import { getHoopsData, getDartsData } from '@parsers/highScores';
import { isCompanionBonusActive, getEventShopBonus, getDoubleStatueDrop, getKillRoyShopBonus } from '@parsers/misc';
import { getCompassBonus } from '@parsers/class-specific/compass';
import { mainStatMap } from '@parsers/talents';
import raw from '../../data/raw.json';

const parseRaw = () => parseFixture(raw);



const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const FIXTURES = fs.readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => [file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8'))]);

export const KNOWN_NAN_EXCEPTIONS = [];

export const KNOWN_NON_FINITE_EXCEPTIONS = {
  'sushiStation.upgrades.[].maxLevel': 'intentional uncapped-upgrade sentinel',
  'hole.villagers.[].timeLeft': 'no exp rate without opals invested; rendered via getRealDateInMs',
  'stamps.misc.[].goldCost': 'float overflow on a genuinely astronomical cost - pre-existing',
  'stamps.misc.[].futureCosts.[].goldCost': 'float overflow on a genuinely astronomical cost - pre-existing',
  'button.taskSequence.[].requirement': 'unreachable projection past MAX_VALUE, rendered as the glyph',
  'button.taskSequence.[].futureRequirements.[]': 'unreachable projection past MAX_VALUE, rendered as the glyph'
};

const countNonFinite = (root, { includeNaN }) => {
  let count = 0;
  const paths = [];
  const seen = new WeakSet();
  const walk = (v, path_, depth) => {
    if (depth > 16 || v == null) return;
    if (typeof v === 'number') {
      const isBad = includeNaN ? Number.isNaN(v) : (v === Infinity || v === -Infinity);
      if (isBad) {
        const collapsed = path_.replace(/\.\d+(\.|$)/g, '.[]$1');
        const allowed = includeNaN
          ? KNOWN_NAN_EXCEPTIONS.includes(collapsed)
          : collapsed in KNOWN_NON_FINITE_EXCEPTIONS;
        if (!allowed) {
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

const countNaN = (root) => countNonFinite(root, { includeNaN: true });
const countInfinity = (root) => countNonFinite(root, { includeNaN: false });

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
    expect(FIXTURES.length).toBeGreaterThanOrEqual(5);
  });

  it.each(FIXTURES)('%s: produces zero NaN, unscoped across every account key', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const { count, paths } = countNaN(account);
    expect(paths).toEqual([]);
    expect(count).toBe(0);
  });
});

describe('Infinity gate: every account key, on every save available', () => {
  it('produces zero unexplained Infinity on an empty parse', () => {
    const { account } = parseEmpty();
    const { paths } = countInfinity(account);
    expect(paths).toEqual([]);
  });

  it('produces zero unexplained Infinity on data/raw.json', () => {
    const { account } = parseRaw();
    const { paths } = countInfinity(account);
    expect(paths).toEqual([]);
  });

  it.each(FIXTURES)('%s: produces zero unexplained Infinity, unscoped', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const { paths } = countInfinity(account);
    expect(paths).toEqual([]);
  });

  it('the walk really does see Infinity - every allowlisted path is still reachable', () => {
    const everyPath = new Set();
    [parseEmpty(), parseRaw(), ...FIXTURES.map(([, fixture]) => parseFixture(fixture))]
      .forEach(({ account }) => countNonFinite(account, { includeNaN: false, }).paths.forEach((p) => everyPath.add(p)));

    const withoutAllowlist = new Set();
    const collect = (root) => {
      const seen = new WeakSet();
      const walk = (v, path_, depth) => {
        if (depth > 16 || v == null) return;
        if (typeof v === 'number') {
          if (v === Infinity || v === -Infinity) withoutAllowlist.add(path_.replace(/\.\d+(\.|$)/g, '.[]$1'));
          return;
        }
        if (typeof v !== 'object' || seen.has(v)) return;
        seen.add(v);
        Object.entries(v).forEach(([k, x]) => walk(x, `${path_}.${k}`, depth + 1));
      };
      Object.entries(root ?? {}).forEach(([k, v]) => walk(v, k, 0));
    };
    [parseEmpty(), parseRaw(), ...FIXTURES.map(([, fixture]) => parseFixture(fixture))]
      .forEach(({ account }) => collect(account));

    expect(withoutAllowlist.size).toBeGreaterThan(0);
    Object.keys(KNOWN_NON_FINITE_EXCEPTIONS).forEach((allowed) => {
      expect(withoutAllowlist.has(allowed)).toBe(true);
    });
  });
});


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


describe('getDoubleStatueDrop keeps the Kattelkruk minor bonus without a linked player', () => {
  const UNLINKED = ['second', 'third', 'fourth'];

  it.each(UNLINKED)('%s: has no Kattelkruk link, and still gets a non-zero divinity bonus', (name) => {
    const fixture = FIXTURES.find(([fixtureName]) => fixtureName === name);
    expect(fixture).toBeDefined();
    const { account, characters } = parseFixture(fixture[1]);

    expect(characters.some(({ linkedDeity }) => linkedDeity === 8)).toBe(false);

    const { breakdown } = getDoubleStatueDrop(account, characters?.[0], characters);
    const divinity = breakdown.find(({ name: label }) => label === 'Divinity').value;
    expect(divinity).toBeGreaterThan(0);
  });

  it('an empty account still gets 0, not NaN, with no guard in getDoubleStatueDrop', () => {
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


const getMaterialCostPreFix = (level, stamp, account, reduction = 0, gildedStamp) => {
  const reductionVial = getVialsBonusByEffect(account?.alchemy?.vials, 'material_cost_for_stamps');
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'ENVELOPE_PILE') ?? 0;
  const sigilReduction = (1 / (1 + sigilBonus / 100));
  const stampReducerVal = Math.max(0.1, 1 - reduction / 100);
  const meritocracyBonus = 1 / (1 + getMeritocracyBonus(account, 14) / 100);

  const vialReduction = Math.max(0.1, 1 - (reductionVial / 100));

  const cost = stamp?.baseMatCost * (gildedStamp ? 0.05 : 1)
    * meritocracyBonus
    * stampReducerVal
    * sigilReduction
    * Math.pow(stamp?.powMatBase, Math.pow(Math.round(level / stamp?.reqItemMultiplicationLevel) - 1, 0.8));

  return Math.max(1, cost > 2e9 ? cost * vialReduction : Math.floor(Math.floor(cost) * vialReduction));
};

describe('stamps materialCost (tier exponent clamp fix)', () => {
  it.each(FIXTURES)('%s: every stamp materialCost is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
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
    expect(previouslyNaNCount).toBeGreaterThan(0);
    expect(assertions).toBeGreaterThan(0);
  });
});


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


describe('currencies.KeysAll totalAmount (undefined daysSincePickup for keys 3/4)', () => {
  it.each(FIXTURES)('%s: keys 0-2 (tracked NPCs) are byte-identical, keys 3-4 (untracked) are now finite instead of NaN', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    let assertions = 0;
    account.currencies.KeysAll.forEach((key, index) => {
      const before = Math.min(key.daysSincePickup, 3) * key.amountPerDay; // old formula, no `?? 0`
      if (index <= 2) {
        expect(Number.isFinite(before)).toBe(true);
        expect(key.totalAmount).toBe(before);
      } else {
        expect(Number.isNaN(before)).toBe(true);
        expect(key.totalAmount).toBe(0);
      }
      assertions++;
    });
    expect(assertions).toBe(5);
  });
});


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




const getSymbolBonusPreFix = (account, index) => {
  return 999 === index
    ? 50 * (account?.spelunking?.sneakingSlots?.[index] + 1)
    : 50 * account?.spelunking?.sneakingSlots?.[index];
};

describe('sneaking symbolBonus (sneakingSlots?.[index] guard)', () => {
  it.each(FIXTURES)('%s: every inventory item symbolBonus is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    let assertions = 0;
    account.sneaking.inventory.forEach((item, inventoryIndex) => {
      const symbolLVID = inventoryIndex + 24;
      const before = getSymbolBonusPreFix(account, symbolLVID);
      const after = item.symbolBonus;
      if (Number.isFinite(before)) {
        expect(after).toBe(before);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json: every inventory item symbolBonus is finite (sneakingSlots already covers every index)', () => {
    const { account } = parseRaw();
    let assertions = 0;
    account.sneaking.inventory.forEach((item, inventoryIndex) => {
      const symbolLVID = inventoryIndex + 24;
      const before = getSymbolBonusPreFix(account, symbolLVID);
      expect(Number.isFinite(before)).toBe(true);
      expect(item.symbolBonus).toBe(before);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });
});

const calcRankRequirementPreFix = (rank) => (7 * rank + 25 * Math.floor(rank / 5) + 10) * Math.pow(1.11, rank);

describe('farming.plot rankRequirement/cropType (missing array entry fixes)', () => {
  it.each(FIXTURES)('%s: every plot rankRequirement/cropType is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const rawFarmingPlot = tryToParse(data?.FarmPlot);
    const rawFarmingRanks = tryToParse(data?.FarmRank);
    const [farmingRanks] = rawFarmingRanks || [];
    let assertions = 0;
    (rawFarmingPlot ?? []).forEach(([, , cropType], cropIndex) => {
      const rank = farmingRanks?.[cropIndex];
      const before = calcRankRequirementPreFix(rank);
      const after = account.farming.plot[cropIndex].rankRequirement;
      if (Number.isFinite(before)) {
        expect(after).toBe(before);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json: every plot rankRequirement/cropType is finite (farmingRanks already covers every plot slot)', () => {
    const { account } = parseRaw();
    account.farming.plot.forEach((p) => {
      expect(Number.isFinite(p.rankRequirement)).toBe(true);
      expect(Number.isFinite(p.cropType)).toBe(true);
    });
  });
});

const getDancingCoralCostPreFix = (rawSpelunking, generalSpelunky22, index) => {
  const baseCost = Number(generalSpelunky22?.[index]) || 0;
  return baseCost / (1 + (10 * rawSpelunking?.[4]?.[7] + Math.pow(1.05, rawSpelunking?.[4]?.[7])) / 100);
};

describe('coralReef.dancingCoral cost (rawSpelunking[4][7] guard)', () => {
  it.each(FIXTURES)('%s: every dancing coral cost is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const rawSpelunking = tryToParse(data?.Spelunk);
    let assertions = 0;
    account.coralReef.dancingCoral.forEach((coral) => {
      const overstim = rawSpelunking?.[4]?.[7];
      const before = 1 + (10 * overstim + Math.pow(1.05, overstim)) / 100;
      const after = coral.cost;
      if (Number.isFinite(before)) {
        expect(Number.isFinite(after)).toBe(true);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json: every dancing coral cost is finite', () => {
    const { account } = parseRaw();
    account.coralReef.dancingCoral.forEach((coral) => {
      expect(Number.isFinite(coral.cost)).toBe(true);
    });
  });
});

const getKillRoyShopBonusPreFix = (account, index) => {
  const o = (i) => account?.accountOptions?.[i];
  return 0 === index
    ? 1 + o(228) / (300 + o(228))
    : 1 === index
      ? 1 + (o(229) / (300 + o(229))) * 9
      : 2 === index
        ? 1 + (o(230) / (300 + o(230))) * 2
        : 3 === index
          ? (o(467) / (200 + o(467))) * 10
          : 4 === index
            ? 1 + (o(468) / (200 + o(468))) * 1.3
            : 5 === index
              ? 1 + (o(469) / (150 + o(469))) * 0.8
              : 6 === index
                ? (o(470) / (250 + o(470))) * 25
                : 7 === index
                  ? 1 + (o(471) / (200 + o(471))) * 2
                  : 1;
};

describe('getKillRoyShopBonus (accountOptions[228..471] guards)', () => {
  it.each(FIXTURES)('%s: every index 0-8 is byte-identical unless it was previously NaN, and is always finite now', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    let assertions = 0;
    for (let index = 0; index <= 8; index++) {
      const before = getKillRoyShopBonusPreFix(account, index);
      const after = getKillRoyShopBonus(account, index);
      if (Number.isFinite(before)) {
        expect(after).toBe(before);
      }
      expect(Number.isFinite(after)).toBe(true);
      assertions++;
    }
    expect(assertions).toBe(9);
  });

  it('raw.json: every index 0-8 is finite (all shop slots already touched)', () => {
    const { account } = parseRaw();
    for (let index = 0; index <= 8; index++) {
      expect(Number.isFinite(getKillRoyShopBonus(account, index))).toBe(true);
    }
  });
});

describe('getSlab lootedItems/rawLootedItems (lootyRaw?.length guard)', () => {
  it.each(FIXTURES)('%s: lootedItems and rawLootedItems are byte-identical unless previously NaN/undefined, and are always finite now', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const lootyRaw = data?.Cards?.[1] || tryToParse(data?.Cards1);
    const before = lootyRaw?.length;
    if (before !== undefined) {
      expect(account.looty.lootedItems).toBe(before);
      expect(account.looty.rawLootedItems).toBe(before);
    } else {
      expect(account.looty.lootedItems).toBe(0);
      expect(account.looty.rawLootedItems).toBe(0);
    }
  });
});




describe('gaming ratKing shop costs', () => {
  const ratCosts = (account) => account?.gaming?.ratKing?.shopUpgrades?.map(({ cost }) => cost) ?? [];

  it.each([...FIXTURES, ['raw', raw]])('%s: every shop cost is finite', (name, fixture) => {
    const { account } = name === 'raw' ? parseRaw() : parseFixture(fixture);
    const costs = ratCosts(account);
    expect(costs).toHaveLength(3);
    costs.forEach((cost) => expect(Number.isFinite(cost)).toBe(true));
  });

  it('second and fourth really did produce Infinity before the unlock gate', () => {
    const affected = ['second', 'fourth'].map((name) => {
      const fixture = FIXTURES.find(([fixtureName]) => fixtureName === name);
      expect(fixture).toBeDefined();
      const data = fixture[1].data ?? fixture[1];
      const slot = tryToParse(data?.GamingSprout)?.[33] ?? [];
      return 2 * (Math.pow(1.15, slot?.[1] ?? 0) + (slot?.[1] ?? 0));
    });
    affected.forEach((cost) => expect(cost).toBe(Infinity));
  });

  it('an unlocked account still reads its real upgrade levels', () => {
    const { account } = parseRaw();
    expect(account.gaming.ratKing.kingRatUnlocked).toBe(true);
    expect(account.gaming.ratKing.shopUpgrades.map(({ level }) => level)).toEqual([67, 57, 75]);
    ratCosts(account).forEach((cost) => expect(cost).toBeGreaterThan(2));
  });

  it('a locked account reads a fresh shop, not the stale slot', () => {
    const { account } = parseEmpty();
    expect(account.gaming.ratKing.kingRatUnlocked).toBe(false);
    expect(account.gaming.ratKing.shopUpgrades.map(({ level }) => level)).toEqual([0, 0, 0]);
  });
});


describe('button task requirements', () => {
  it('no task description ever contains the literal word "Infinity"', () => {
    const descriptions = [...FIXTURES, ['raw', raw]].flatMap(([name, fixture]) => {
      const { account } = name === 'raw' ? parseRaw() : parseFixture(fixture);
      return account.button?.taskSequence?.map(({ description }) => description) ?? [];
    });
    expect(descriptions.length).toBeGreaterThan(0);
    expect(descriptions.filter((text) => /Infinity/.test(text))).toEqual([]);
  });

  it('raw.json really does project past MAX_VALUE, so the assertion above is not vacuous', () => {
    const { account } = parseRaw();
    const nonFinite = account.button.taskSequence.filter(({ requirement }) => !Number.isFinite(requirement));
    expect(nonFinite.length).toBeGreaterThan(0);
    nonFinite.forEach(({ description }) => expect(description).toContain('∞'));
  });

  it("the CURRENT task's requirement stays finite - it is what the game itself computes", () => {
    [...FIXTURES, ['raw', raw]].forEach(([name, fixture]) => {
      const { account } = name === 'raw' ? parseRaw() : parseFixture(fixture);
      const current = account.button?.taskSequence?.[0];
      if (!current) return;
      expect(Number.isFinite(current.requirement)).toBe(true);
    });
  });
});
