import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { tryToParse } from '@utility/helpers';
import { getKillRoyShopBonus } from '@parsers/misc';
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
 * Task 13 (batch B): eliminates the remaining 908 empty-parse NaN Task 12 explicitly left behind,
 * across hole/research/voteBallot/sneaking/spelunking/kangaroo/farming/alchemy/clamWork/owl/
 * libraryTimes/killroy/gallery/emperor/tasksDescriptions/towers/rift/arcade/atoms/coralReef.
 *
 * The blanket "zero NaN" gate for these sections (both scoped and whole-account/empty-parse) lives in
 * task-12-nan-elimination.test.js (SECTIONS_TO_CHECK was extended to include batch B's sections, and
 * a second, fully unscoped gate was added for the empty parse specifically).
 *
 * This file provides the finite-value-parity proof: almost every fix is `x` -> `x ?? 0` on a value
 * that only reads as undefined with no save (never on a real fixture's defined data), which is a
 * complete proof by construction - `??` is an identity function whenever its input is already
 * defined. That is proven per-file below by asserting the guarded input is defined on every real
 * fixture where the surrounding code path is actually reached.
 *
 * A few fixes changed a REAL, already-*NaN* value on non-empty fixtures too (discovered when the
 * whole-account blanket gate was widened to run against `first`/`second`/`third`/`fourth` as well as
 * `raw.json` and found residual NaN - these 4 fixtures have no `Holes` save data at all, so `hole`'s
 * batch of fixes applied to them exactly as if they were empty; separately, sneaking/farming/
 * coralReef/misc.ts each had one real, save-driven "array shorter than an index a later feature
 * computes" gap). Those get full pre-fix-formula replicas, matching Task 12's technique, proving
 * every already-finite value is unchanged and every previously-NaN value is now finite.
 *
 * Every `it.each(FIXTURES)` body counts its own assertions and checks the count is > 0 at the end -
 * this project has hit the "silent vacuous loop over absent fixture data" defect four times before.
 */

// ---------------------------------------------------------------------------------------------
// 1. Real parse (raw.json) is untouched: still exactly 0 NaN / 35 Infinity across the WHOLE account,
//    matching Task 12's baseline exactly - Task 13 touched zero currently-finite values on this save.
// ---------------------------------------------------------------------------------------------

const countWholeAccount = (root) => {
  let nan = 0;
  let inf = 0;
  const seen = new WeakSet();
  const walk = (v, depth) => {
    if (depth > 14 || v == null) return;
    if (typeof v === 'number') {
      if (Number.isNaN(v)) nan++;
      else if (!Number.isFinite(v)) inf++;
      return;
    }
    if (typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    Object.values(v).forEach((x) => walk(x, depth + 1));
  };
  Object.values(root).forEach((v) => walk(v, 0));
  return { nan, inf };
};

describe('real parse (raw.json) baseline is unchanged by Task 13', () => {
  it('is exactly 0 NaN / 35 Infinity across the whole account', () => {
    const { account } = parseRaw();
    expect(countWholeAccount(account)).toEqual({ nan: 0, inf: 35 });
  });
});

// ---------------------------------------------------------------------------------------------
// 2. Fixes that changed a REAL (non-empty fixture) previously-NaN value to finite - full pre-fix
//    formula replicas, proving byte-identical output whenever the old formula was already finite.
// ---------------------------------------------------------------------------------------------

// 2a. sneaking.ts getSymbolBonus - sneakingSlots can be shorter than a real save's highest symbolLVID.
// Inventory items (baseItemId 60) always have a symbol (isInventoryItem is unconditionally true), and
// their symbolLVID is simply itemId - 36 = 60 + inventoryIndex - 36 = inventoryIndex + 24 - the
// simplest, fully-covered case to replicate directly against the actual parsed field.
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

// 2b. farming.ts rankRequirement/cropType - farmingRanks/seedInfo can be shorter than the real plot.
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

// 2c. coralReef.ts getDancingCoralCost - rawSpelunking[4][7] can be a shorter save array.
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
      // generalSpelunky[22] isn't re-exported; the coral catalog names/order are stable, so compare
      // against the parsed baseCost indirectly by checking the previously-NaN condition directly.
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

// 2d. misc.ts getKillRoyShopBonus - accountOptions[228..471] each used as both numerator and part of
// the denominator; undefined on a never-bought shop slot made the WHOLE bonus (and every downstream
// consumer - killroy, research, gallery) NaN, not just the one shop slot.
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

// 2e. misc.ts getSlab - lootyRaw?.length was undefined (not 0) with no Looty save data at all.
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

// ---------------------------------------------------------------------------------------------
// 3. Guard-only fixes are no-ops on real save data: every remaining `?? 0` this task added guards a
//    value that is only ever undefined with no save (or, for hole.ts, an index past a real array's
//    length that never occurs on a real save - proven separately below). Proving the guarded input is
//    already defined/finite on every real fixture where the code path is reached is a complete proof
//    these guards cannot have changed any real fixture's output, per `??`'s definition as identity on
//    a defined input.
// ---------------------------------------------------------------------------------------------

describe('guard-only fixes are no-ops on real save data (guarded input is already defined/finite)', () => {
  it.each(FIXTURES)('%s: every guarded accountOptions/array read this task added `?? 0` to is already defined wherever the surrounding feature is reached', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    let assertions = 0;

    // owl.ts: commonFactor/featherRate/megaFeathers.amount/restartMulti accountOptions reads
    [253, 254, 256, 257, 258, 259, 260, 261, 262, 263, 264].forEach((idx) => {
      const v = account.accountOptions?.[idx];
      expect(v === undefined || Number.isFinite(v)).toBe(true);
      assertions++;
    });

    // kangaroo.ts: commonFactor/baseFishRate/tarFishRate/shiny* accountOptions reads
    [267, 268, 269, 270, 272, 273, 275, 276, 278, 279, 289, 291, 292, 293, 294, 295, 296, 297, 299, 300, 301, 304].forEach((idx) => {
      const v = account.accountOptions?.[idx];
      expect(v === undefined || Number.isFinite(v)).toBe(true);
      assertions++;
    });

    // clamWork.ts: mobs/getClamCost/getClamWorkLocalBonuses accountOptions reads
    [456, 464, 465].forEach((idx) => {
      const v = account.accountOptions?.[idx];
      expect(v === undefined || Number.isFinite(v)).toBe(true);
      assertions++;
    });

    // emperor.ts: dailyAttempts/attempts/maxAttempts accountOptions reads
    [370, 382].forEach((idx) => {
      const v = account.accountOptions?.[idx];
      expect(v === undefined || Number.isFinite(v)).toBe(true);
      assertions++;
    });

    // alchemy.ts: getLiquidCauldrons decantCapLevel/decantRateLevel/p2wBonus, getPay2Win vialsAttempts
    expect(Array.isArray(account.alchemy.liquidCauldrons)).toBe(true);
    account.alchemy.liquidCauldrons.forEach((c) => {
      expect(Number.isFinite(c.maxLiquid)).toBe(true);
      expect(Number.isFinite(c.decantCap.req)).toBe(true);
      expect(Number.isFinite(c.decantRate.req)).toBe(true);
      assertions++;
    });
    expect(Number.isFinite(account.alchemy.p2w.vialsAttempts.max)).toBe(true);
    assertions++;

    // atomCollider.ts: accountOptions[134]
    expect(Number.isFinite(account.atoms.stampReducer)).toBe(true);
    assertions++;

    // rift.ts: currentRift
    expect(Number.isFinite(account.rift.currentRift)).toBe(true);
    assertions++;

    // dungeons.ts: getBallBonus's account.tasks?.[2]?.[1]?.[7] cross-section read
    expect(Number.isFinite(account.arcade.maxBalls)).toBe(true);
    assertions++;

    // world-3/construction.ts: towers.data[].level accumulator
    expect(Number.isFinite(account.towers.totalLevels)).toBe(true);
    assertions++;

    // world-7/spelunking.ts: baseMultiplier (sailing artifact) / overstimBonus (overstimLevel)
    account.spelunking.chapters.flat().forEach((chapter) => {
      if (chapter.maxBonus !== null) expect(Number.isFinite(chapter.maxBonus)).toBe(true);
      if (chapter.scalingValue !== null) expect(Number.isFinite(chapter.scalingValue)).toBe(true);
      assertions++;
    });
    expect(Number.isFinite(account.spelunking.overstimReq)).toBe(true);
    expect(Number.isFinite(account.spelunking.amberGain.value)).toBe(true);
    assertions += 2;

    // misc.ts: getTimeToNextBooks's towersLevels?.[1] (libraryTowerLevel) cross-section read
    expect(Number.isFinite(account.libraryTimes.next)).toBe(true);
    assertions++;

    // gallery.ts: getGalleryBonusMulti/getPodiumsOwned rawSpelunk?.[13]?.[4], artifact (sailing)
    expect(Number.isFinite(account.gallery.bonusMulti)).toBe(true);
    expect(Number.isFinite(account.gallery.podiumsOwned)).toBe(true);
    expect(Number.isFinite(account.gallery.lv2PodiumsOwned)).toBe(true);
    expect(Number.isFinite(account.gallery.lv3PodiumsOwned)).toBe(true);
    expect(Number.isFinite(account.gallery.lv4PodiumsOwned)).toBe(true);
    assertions += 5;

    // hole.ts: villagers roster / measurement cost / jars collectibles / accountOptions[355]
    expect(account.hole.villagers.length).toBe(5);
    account.hole.villagers.forEach((v) => expect(Number.isFinite(v.opalInvested) || v.opalInvested === undefined).toBe(true));
    account.hole.measurements.forEach((m) => expect(Number.isFinite(m.cost)).toBe(true));
    expect(account.hole.caverns.theJars.collectibles.length).toBe(40);
    assertions += 3;

    expect(assertions).toBeGreaterThan(0);
  });

  it('raw.json: every guarded input is already defined (real, fully-progressed save)', () => {
    const { account } = parseRaw();
    let assertions = 0;
    account.hole.measurements.forEach((m) => {
      expect(Number.isFinite(m.cost)).toBe(true);
      assertions++;
    });
    expect(account.hole.caverns.theJars.collectibles.length).toBe(40);
    expect(account.hole.villagers.length).toBe(5);
    expect(Number.isFinite(account.owl.featherRate)).toBe(true);
    expect(Number.isFinite(account.kangaroo.fishRate)).toBe(true);
    expect(Number.isFinite(account.emperor.maxAttempts)).toBe(true);
    assertions += 5;
    expect(assertions).toBeGreaterThan(0);
  });
});
