import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { allFixtures, onEachFixture } from '../helpers/save-fixtures';
import { tryToParse } from '@utility/helpers';
import { getVialsBonusByEffect, getSigilBonus } from '@parsers/world-2/alchemy';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { findBreakdownNode } from '@parsers/breakdown';
import { getHoopsData, getDartsData } from '@parsers/highScores';
import { getDoubleStatueDrop, getKillRoyShopBonus } from '@parsers/misc';
import { getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import raw from '../../data/raw.json';

const FIXTURES = allFixtures();
const REAL_SAVES = [...FIXTURES, ['raw', raw]];
const SAVES = [['an empty parse', () => parseEmpty()], ...REAL_SAVES.map(([name, fixture]) => [name, () => parseFixture(fixture)])];

const KNOWN_NON_FINITE_EXCEPTIONS = {
  'sushiStation.upgrades.[].maxLevel': 'intentional uncapped-upgrade sentinel',
  'hole.villagers.[].timeLeft': 'no exp rate without opals invested; rendered via getRealDateInMs',
  'stamps.misc.[].goldCost': 'float overflow on a genuinely astronomical cost - pre-existing',
  'stamps.misc.[].futureCosts.[].goldCost': 'float overflow on a genuinely astronomical cost - pre-existing',
  'button.taskSequence.[].requirement': 'unreachable projection past MAX_VALUE, rendered as the glyph',
  'button.taskSequence.[].futureRequirements.[]': 'unreachable projection past MAX_VALUE, rendered as the glyph'
};

// Every number under the account, by path with list indexes collapsed.
const nonFinitePaths = (account) => {
  const nan = new Set();
  const infinity = new Set();
  const seen = new WeakSet();
  const walk = (value, at, depth) => {
    if (depth > 16 || value == null) return;
    if (typeof value === 'number') {
      if (Number.isNaN(value)) nan.add(at.replace(/\.\d+(\.|$)/g, '.[]$1'));
      else if (!Number.isFinite(value)) infinity.add(at.replace(/\.\d+(\.|$)/g, '.[]$1'));
      return;
    }
    if (typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    Object.entries(value).forEach(([key, child]) => walk(child, `${at}.${key}`, depth + 1));
  };
  Object.entries(account ?? {}).forEach(([key, value]) => walk(value, key, 0));
  return { nan: [...nan], infinity: [...infinity] };
};

describe('the gate: every account key, on every save available', () => {
  it.each(SAVES)('%s: no NaN and no unexplained Infinity', (_, parse) => {
    const { nan, infinity } = nonFinitePaths(parse().account);
    expect({ nan, infinity: infinity.filter((at) => !(at in KNOWN_NON_FINITE_EXCEPTIONS)) }).toEqual({ nan: [], infinity: [] });
  });

  it('discovered at least the five known fixture files', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(5);
  });

  it('the walk really does see Infinity: every allowlisted path is still reachable', () => {
    const reached = new Set(SAVES.flatMap(([, parse]) => nonFinitePaths(parse().account).infinity));
    expect(Object.keys(KNOWN_NON_FINITE_EXCEPTIONS).filter((at) => !reached.has(at))).toEqual([]);
  });
});

// Numbers no live-verified file pins yet: a formula bug in any of these fails nothing else. Each is compared with a copy of
// the game's expression on every save, which holds until someone reads them from the running game. Then the copy goes.
describe('values with no live reading yet', () => {
  const onEverySave = (check) => onEachFixture(REAL_SAVES, (fixture) => check(parseFixture(fixture)));

  // Computed on demand, so the gate never sees them
  it('hoops and darts upgrade costs', () => onEverySave(({ account }) => {
    const cost = (points, index) => (1 === index ? Math.floor(3 + points[index] / 0.25) : 3 === index ? Math.floor(5 + points[index] / 0.05) : Math.floor(2 + points[index] / 12));
    for (const [{ upgrades }, start] of [[getHoopsData(account), 419], [getDartsData(account), 435]]) {
      const points = account?.accountOptions?.slice(start, start + 4) ?? [0, 0, 0, 0];
      expect(upgrades).toHaveLength(4);
      upgrades.forEach((upgrade, index) => {
        if (Number.isFinite(cost(points, index))) expect(upgrade.cost).toBe(cost(points, index));
        expect(Number.isFinite(upgrade.cost)).toBe(true);
      });
    }
  }));

  // Computed on demand, so the gate never sees them
  it('Killroy shop bonuses', () => onEverySave(({ account }) => {
    const o = (i) => account?.accountOptions?.[i];
    const game = [
      1 + o(228) / (300 + o(228)),
      1 + (o(229) / (300 + o(229))) * 9,
      1 + (o(230) / (300 + o(230))) * 2,
      (o(467) / (200 + o(467))) * 10,
      1 + (o(468) / (200 + o(468))) * 1.3,
      1 + (o(469) / (150 + o(469))) * 0.8,
      (o(470) / (250 + o(470))) * 25,
      1 + (o(471) / (200 + o(471))) * 2,
      1
    ];
    game.forEach((expected, index) => {
      const bonus = getKillRoyShopBonus(account, index);
      if (Number.isFinite(expected)) expect(bonus).toBe(expected);
      expect(Number.isFinite(bonus)).toBe(true);
    });
  }));

  it('boat trip times, and none for an undeployed boat', () => {
    let boats = 0;
    onEverySave(({ account }) => {
      // a locked feature is null by design
      account.sailing?.boats?.forEach((boat) => {
        const trip = (distance) => (distance / boat.speed?.value) * 3600 * 1000;
        const maxTime = trip(boat.island?.distance);
        const timeLeft = trip(boat.island?.distance - boat.distanceTraveled);
        expect(boat.maxTime).toBe(Number.isFinite(maxTime) ? maxTime : undefined);
        expect(boat.timeLeft).toBe(Number.isFinite(timeLeft) ? timeLeft : undefined);
        boats += 1;
      });
    });
    expect(boats).toBeGreaterThan(0);
  });

  it('stamp material costs', () => onEverySave(({ account }) => {
    const reduction = account?.atoms?.stampReducer ?? 0;
    const reductionVial = getVialsBonusByEffect(account?.alchemy?.vials, 'material_cost_for_stamps');
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'ENVELOPE_PILE') ?? 0;
    const vialReduction = Math.max(0.1, 1 - (reductionVial / 100));
    ['combat', 'skills', 'misc'].flatMap((category) => account.stamps[category]).forEach((stamp) => {
      const cost = stamp?.baseMatCost * 0.05
        * (1 / (1 + getMeritocracyBonus(account, 14) / 100))
        * Math.max(0.1, 1 - reduction / 100)
        * (1 / (1 + sigilBonus / 100))
        * Math.pow(stamp?.powMatBase, Math.pow(Math.round(stamp.level / stamp?.reqItemMultiplicationLevel) - 1, 0.8));
      const expected = Math.floor(Math.max(1, cost > 2e9 ? cost * vialReduction : Math.floor(Math.floor(cost) * vialReduction)));
      // A stamp below its first material tier has no cost in this expression: the parser clamps it
      if (Number.isFinite(expected)) expect(stamp.materialCost).toBe(expected);
    });
  }));

  it('island costs follow the unlock count, the game freezing them at its last step', () => {
    const CATALOG = [
      { preUnlockCost: 4, baseCost: 10 },
      { preUnlockCost: 12, baseCost: 12 },
      { preUnlockCost: 20, baseCost: 15 },
      { preUnlockCost: 28, baseCost: 50 },
      { preUnlockCost: 40, baseCost: 25 },
      { preUnlockCost: 52, baseCost: 70 }
    ];
    const STEPS = { 0: 0, 1: 15, 2: 45, 3: 100, 4: 200, 5: 500, 6: 500 };
    onEverySave(({ account }) => {
      const unlocked = account?.accountOptions?.[169]?.length;
      expect(account.islands.list.slice(0, CATALOG.length).map(({ cost }) => cost))
        .toEqual(CATALOG.map(({ preUnlockCost, baseCost }) => (unlocked === 0 ? preUnlockCost : baseCost + STEPS[unlocked])));
    });
    expect(parseFixture(raw).account.accountOptions[169]).toHaveLength(CATALOG.length);
  });

  it('keys pile up for three days, and the two keys no NPC tracks have no total', () => onEverySave(({ account }) => {
    expect(account.currencies.KeysAll.map(({ totalAmount }) => totalAmount))
      .toEqual(account.currencies.KeysAll.map(({ daysSincePickup, amountPerDay }, index) => (index <= 2 ? Math.min(daysSincePickup, 3) * amountPerDay : 0)));
  }));

  it('farming plot rank requirements, from the rank the save holds for that plot', () => onEachFixture(REAL_SAVES, (fixture) => {
    const data = fixture.data ?? fixture;
    const [ranks] = tryToParse(data?.FarmRank) || [];
    (tryToParse(data?.FarmPlot) ?? []).forEach((_, index) => {
      const rank = ranks?.[index] ?? 0;
      expect(parseFixture(fixture).account.farming.plot[index].rankRequirement).toBe((7 * rank + 25 * Math.floor(rank / 5) + 10) * Math.pow(1.11, rank));
    });
  }));

  // game: Summoning("UpgCost")
  it('summoning upgrade costs', () => onEverySave(({ account, characters }) => {
    const flat = Object.values(account.summoning.upgrades).flat();
    const levelOf = (index) => flat.find((u) => u.originalIndex === index)?.value ?? 0;
    const totalLevels = flat.reduce((sum, u) => sum + (u?.level ?? 0), 0);
    const essentialEssence = getHighestTalentAcrossCharacters(characters, 'ESSENTIAL_ESSENCE', getBestActiveCharacter(characters));
    const tesseractBonus = getTesseractBonus(account, 54) * account?.accountOptions?.[319];
    flat.forEach((upgrade) => {
      const cost = (1 / (1 + (essentialEssence * Math.max(0, totalLevels / 100)) / 100))
        * (1 / (1 + levelOf(49) / 100))
        * (1 / (1 + getJellyBonus(account, 27) / 100))
        * Math.max(0.1, 1 - Math.max(getSushiBonus(account, 9), getSushiBonus(account, 34)) / 100)
        * (1 / (1 + tesseractBonus / 100))
        * (1 / (1 + levelOf(57) / 100))
        * (1 / (1 + levelOf(72) / 100))
        * (1 / (1 + (levelOf(75) * Math.max(0, Math.floor(totalLevels / 100))) / 100))
        * upgrade?.cost
        * Math.pow(upgrade?.costExponent, upgrade?.level);
      // The panel rounds a cost up below 1,000
      const expected = cost < 1000 ? Math.ceil(cost) : cost;
      if (Number.isFinite(expected)) expect(upgrade.totalCost).toBe(expected);
    });
  }));

  it('summoning army health and damage', () => onEverySave(({ account }) => {
    const { upgrades, totalUpgradesLevels } = account.summoning;
    const flat = Object.values(upgrades).flat();
    const valueOf = (index) => flat.find((u) => u.originalIndex === index)?.value || 0;
    const sum = (indexes) => indexes.reduce((total, index) => total + (flat.find((u) => u.originalIndex === index) || {})?.value, 0);
    const endless = account?.accountOptions?.[319];
    const perHundred = Math.max(0, Math.floor(totalUpgradesLevels / 100));
    const health = (1 + sum([1, 10, 35, 37]))
      * (1 + valueOf(20) / 100)
      * (1 + (valueOf(50) + (valueOf(59) + valueOf(63) * endless)) / 100)
      * (1 + (valueOf(61) * perHundred) / 100);
    const damage = (1 + sum([3, 12, 21, 31]))
      * (1 + (valueOf(43) + valueOf(74)) / 100)
      * (1 + (valueOf(51) + (valueOf(56) + valueOf(64) * endless)) / 100)
      * (1 + (valueOf(60) * perHundred) / 100);
    if (Number.isFinite(health)) expect(account.summoning.armyHealth).toBe(health);
    if (Number.isFinite(damage)) expect(account.summoning.armyDamage).toBe(damage);
  }));
});

// Divinity("Bonus_Minor", -1, 8) sums only the characters linked to Kattlekruk, King Doot or not:
// checked against the live game on 10 Oct 2026, where it equalled the one linked character's bonus.
describe('getDoubleStatueDrop takes the Kattelkruk minor bonus from linked players only', () => {
  const divinityIn = ({ account, characters }) => findBreakdownNode(getDoubleStatueDrop(account, characters?.[0], characters).breakdown.tree, 'Divinity').value;

  it('a save with no Kattelkruk link has no divinity bonus', () => {
    onEachFixture(FIXTURES.filter(([name]) => ['second', 'third', 'fourth'].includes(name)), (fixture) => {
      const parsed = parseFixture(fixture);
      expect(parsed.characters.some(({ linkedDeity }) => linkedDeity === 8)).toBe(false);
      expect(divinityIn(parsed)).toBe(0);
    });
  });

  it('an empty account still gets 0, not NaN, with no guard in getDoubleStatueDrop', () => {
    const parsed = parseEmpty();
    expect(divinityIn(parsed)).toBe(0);
    expect(Number.isFinite(getDoubleStatueDrop(parsed.account, parsed.characters?.[0], parsed.characters).value)).toBe(true);
  });

  it('a save WITH a linked player is unaffected', () => {
    const parsed = parseFixture(raw);
    expect(parsed.characters.some(({ linkedDeity }) => linkedDeity === 8)).toBe(true);
    expect(divinityIn(parsed)).toBeGreaterThan(0);
  });
});

describe('gaming ratKing shop', () => {
  it('an unlocked account reads its real upgrade levels', () => {
    const { account } = parseFixture(raw);
    expect(account.gaming.ratKing.kingRatUnlocked).toBe(true);
    expect(account.gaming.ratKing.shopUpgrades.map(({ level }) => level)).toEqual([67, 57, 75]);
    account.gaming.ratKing.shopUpgrades.forEach(({ cost }) => expect(cost).toBeGreaterThan(2));
  });

  it('a locked account reads a fresh shop, not the stale slot', () => {
    const { account } = parseEmpty();
    expect(account.gaming.ratKing.kingRatUnlocked).toBe(false);
    expect(account.gaming.ratKing.shopUpgrades.map(({ level }) => level)).toEqual([0, 0, 0]);
  });
});

describe('button task requirements', () => {
  const tasksOf = (fixture) => parseFixture(fixture).account.button?.taskSequence ?? [];

  it('no task description ever contains the literal word "Infinity"', () => {
    const descriptions = REAL_SAVES.flatMap(([, fixture]) => tasksOf(fixture).map(({ description }) => description));
    expect(descriptions.length).toBeGreaterThan(0);
    expect(descriptions.filter((text) => /Infinity/.test(text))).toEqual([]);
  });

  it('raw.json really does project past MAX_VALUE, so the assertion above is not vacuous', () => {
    const nonFinite = tasksOf(raw).filter(({ requirement }) => !Number.isFinite(requirement));
    expect(nonFinite.length).toBeGreaterThan(0);
    nonFinite.forEach(({ description }) => expect(description).toContain('∞'));
  });

  it("the CURRENT task's requirement stays finite: it is what the game itself computes", () => {
    onEachFixture(REAL_SAVES, (fixture) => {
      const [current] = tasksOf(fixture);
      if (current) expect(Number.isFinite(current.requirement)).toBe(true);
    });
  });
});
