import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getRoyalGuardian } from '@parsers/class-specific/royalGuardian';

// The outpost formulas here were verified against the running game (patch 2.3.525) on the account
// in data/raw.json, over the debug server: OutpostResourceRate on Froggy Fields returned
// 229677951336911.8 against the parser's 229677951336911.84, OutpostRange returned 256, and
// Spaceway Raceway returned 406px / 4.23e15 per hour, all matching the in-game panel.
//
// This fixture is a small hand-built kingdom instead, so every expectation below can be worked out
// on paper from the game handlers (OutpostResourceRate, OutpostRange, OutpostPTSleft, TotalUnitsz,
// PassiveUnitsz, TotalSupports, OutpostEXPformula) without re-running the parser's own arithmetic.

const ARMORY_LEVELS = () => {
  const levels = new Array(99).fill(0);
  levels[1] = 50;  // Perfect_Purification, +1%/lv -> purify bonus 200 + 50 = 250
  levels[9] = 40;  // Blunder_Outpost_PTS, +1/lv
  levels[19] = 2;  // Wonderful_Workers, +10%/lv -> UnitSpecEffect(0) = 50 + 20 = 70
  levels[21] = 4;  // Great_Guards, +5%/lv -> UnitSpecEffect(2) = 25 + 20 = 45
  levels[27] = 1;  // Trader_Profession
  levels[28] = 1;  // Guard_Profession
  levels[29] = 1;  // Surveyor_Profession
  levels[43] = 100; // Super_Support, +1%/lv -> SupportCollection = 200 * 2 = 400 per support
  levels[57] = 1;  // Greater_Education
  levels[71] = 5;  // Trading_Rank, +1/lv -> +1 PTS every 11 - 5 = 6 Trading ranks
  levels[73] = 2;  // Command_Rank, +25%/lv
  levels[74] = 3;  // Military_Rank, +2px/lv
  levels[75] = 1;  // Purity_Rank
  return levels;
};

const buildRoyalG = () => {
  const royalG = new Array(24).fill(null).map(() => []);
  royalG[0] = new Array(8).fill(0);
  royalG[1] = new Array(39).fill(0);
  royalG[2] = ARMORY_LEVELS();
  royalG[3] = new Array(20).fill(0);
  royalG[4] = new Array(160).fill(0);
  royalG[5] = new Array(160).fill(0);
  for (let i = 6; i <= 21; i++) royalG[i] = new Array(20).fill(-1);
  // Unit deployments: job 4 is clearing. Unit 0 works an unclaimed map, unit 1 works Froggy Fields
  // which already has an outpost, and unit 2 is assigned nowhere.
  royalG[6][0] = 4;
  royalG[7][0] = 7;
  royalG[6][1] = 4;
  royalG[7][1] = 2;
  royalG[6][2] = 4;
  royalG[7][2] = -1;
  royalG[22] = new Array(50).fill(0);
  royalG[23] = new Array(10).fill(0);
  return royalG;
};

const buildRoyalMaps = () => {
  const maps = new Array(400).fill(null).map(() => []);
  // Spore Meadows: a support camp feeding BOTH of its link slots into Froggy Fields (map 2).
  maps[1] = [1, 0, 0, 0, 0, 0, 0, 0, 1002, 1002, 1, 111111111, 0];
  // Froggy Fields: ranks 3 / 2 / 5 / 4 / 0 from the OutpostEXPformula thresholds, three units
  // packed as Worker, Trader, Trader with the remaining six slots empty.
  // Slots 8 and 9 hold node indices for a depot: Froggy Fields collects nodes 0 and 1.
  maps[2] = [2, 3, 1, 40, 25, 2000, 70, 0, 0, 1, 0, 233111111, 0];
  // YumYum Grotto: purified (purity EXP past the 1e5 rank-1 threshold) and glorified.
  maps[50] = [0, 0, 0, 0, 0, 0, 0, 150000, -1, -1, 0, 111111111, 1];
  // Blunder Hills: a Savage Stronghold, the third RoyalMaps[10] state.
  maps[0] = [0, 0, 0, 0, 0, 0, 0, 0, 2, -1, 2, 111111111, 0];
  return maps;
};

const parse = () => getRoyalGuardian(
  { RoyalG: JSON.stringify(buildRoyalG()), RoyalMaps: JSON.stringify(buildRoyalMaps()) },
  { bundles: [] },
  []
);

const outpostOn = (parsed, mapIndex) => parsed?.outposts?.find((outpost) => outpost.mapIndex === mapIndex);

const close = (actual, expected) =>
  expect(Math.abs(actual - expected) / Math.max(1, Math.abs(expected))).toBeLessThan(1e-9);

describe('royal guardian outposts', () => {
  it('times how long each outpost has before its resource runs out', () => {
    const parsed = parse();
    const froggy = outpostOn(parsed, 2);
    const savage = outpostOn(parsed, 0);

    // Fresh nodes in this fixture, so the headroom is the node's whole capacity.
    const froggyHours = froggy.connectedNodes
      .map(({ maxQuantity, collected }) => (maxQuantity - collected) / froggy.resourceRate);
    close(froggy.hoursToNodeCap, Math.min(...froggyHours));

    // A Savage Stronghold piles savageMulti times what it collects into its own node, so its node
    // fills that much sooner.
    const savageNode = savage.connectedNodes[0];
    close(savage.hoursToNodeCap,
      (savageNode.maxQuantity - savageNode.collected) / (savage.resourceRate * parsed.outpostStats.savageMulti));

    // A support camp collects nothing, so it has no deadline at all.
    expect(outpostOn(parsed, 1).hoursToNodeCap).toBe(null);
  });

  it('reads unit deployments and marks the ones doing nothing', () => {
    const parsed = parse();
    const deployments = parsed.deployments;

    expect(deployments.map(({ slot }) => slot)).toEqual([0, 1, 2]);
    expect(deployments.map(({ jobName }) => jobName)).toEqual(['Clearing', 'Clearing', 'Clearing']);
    // Map 7 has no outpost yet, so that unit is doing real work.
    expect(deployments[0]).toMatchObject({ mapIndex: 7, targetClaimed: false, idle: false, unassigned: false });
    // Froggy Fields is already claimed, so clearing it earns nothing without Peacetime Militia.
    expect(deployments[1]).toMatchObject({ mapIndex: 2, targetClaimed: true, idle: true });
    expect(deployments[2]).toMatchObject({ unassigned: true, idle: false });
    expect(parsed.outpostStats.peacetimeMilitia).toBe(false);
    expect(parsed.outpostStats.restockUnlocked).toBe(false);
  });

  it('reads node links off the outpost connection slots', () => {
    const parsed = parse();

    // RoyalMaps[map][8] and [9]: under 999 is a node index, 1000 + map is a support camp's link.
    expect(outpostOn(parsed, 2).connectedNodes.map(({ index }) => index)).toEqual([0, 1]);
    expect(outpostOn(parsed, 0).connectedNodes.map(({ index }) => index)).toEqual([2]);
    // Spore Meadows spends both slots on support links, so it collects nothing itself.
    expect(outpostOn(parsed, 1).connectedNodes).toEqual([]);
    expect(outpostOn(parsed, 1).supportLinks).toEqual([2, 2]);

    expect(parsed.resources[0].connected).toBe(true);
    expect(parsed.resources[0].connectedMap).toBe(2);
    expect(parsed.resources[0].connectedMapName).toBe('Froggy Fields');
    expect(parsed.resources[2].connectedMaps).toEqual([0]);
    expect(parsed.resources[3].connected).toBe(false);
  });

  it('ranks each bar off the game thresholds and reports the bar it is working towards', () => {
    const froggy = outpostOn(parse(), 2);

    expect(froggy.ranks).toEqual([3, 2, 5, 4, 0]);
    // (10 + 5r) * 1.3^r for Trade, so rank 3 sits between 20 * 1.69 and 25 * 2.197.
    close(froggy.rankBars[0].previous, 20 * Math.pow(1.3, 2));
    close(froggy.rankBars[0].required, 25 * Math.pow(1.3, 3));
    close(froggy.rankBars[0].progress, (40 - 20 * Math.pow(1.3, 2)) / (25 * Math.pow(1.3, 3) - 20 * Math.pow(1.3, 2)));
    // (50 + 50r) * 1.6^r for Command, and 1e5 * 10^r for Purity.
    close(froggy.rankBars[2].required, 300 * Math.pow(1.6, 5));
    close(froggy.rankBars[4].required, 1e5);
    expect(froggy.rankBars.map(({ unlocked }) => unlocked)).toEqual([true, true, true, true, true]);
  });

  it('counts assigned units past the visible slots and adds the stationary Command ones', () => {
    const froggy = outpostOn(parse(), 2);

    // Expanded Barracks 2 shows 1 + 2 = 3 slots, but TotalUnitsz reads all nine packed characters.
    expect(froggy.unitSlots).toEqual([0, 1, 1]);
    expect(froggy.unitSlots).toHaveLength(3);
    // Command rank 5 grants a stationary Worker and Trader (every 4 ranks, offset per unit type).
    expect(froggy.passiveUnits).toEqual([1, 1, 0, 0]);
    expect(froggy.unitCounts).toEqual([2, 3, 0, 0]);

    // Glorification is worth one extra stationary Worker on its own.
    expect(outpostOn(parse(), 50).passiveUnits).toEqual([1, 0, 0, 0]);
  });

  it('credits a support camp to its linked outpost through both link slots', () => {
    const parsed = parse();

    expect(outpostOn(parsed, 2).supports).toBe(2);
    expect(outpostOn(parsed, 1).supports).toBe(0);
    expect(outpostOn(parsed, 1).isSupport).toBe(true);
    expect(outpostOn(parsed, 1).supportLinks).toEqual([2, 2]);
  });

  it('computes the collection rate from every live game factor', () => {
    const parsed = parse();

    // 125 base, +5%/Advanced Logistics level, +25%/lv of Command Rank across 5 ranks,
    // UnitSpecEffect(0) = 70 per Worker unit (2 of them), 400% per support camp (2 of them).
    // Expanded Barracks 2 is below the level-5 floor, so its own multiplier is still 1x.
    close(outpostOn(parsed, 2).resourceRate, 125 * 1.15 * 3.5 * 2.4 * 9);
    // Purified: OutpostPurifyBonus = 200 + 50, and the glorified Worker is worth 70%.
    close(outpostOn(parsed, 50).resourceRate, 125 * 3.5 * 1.7);
    close(outpostOn(parsed, 1).resourceRate, 125);
  });

  it('computes the connection range off the soft Advanced Logistics curve', () => {
    const parsed = parse();

    // 80 base + 250 * L/(L+100) + 45px per Guard unit (none) + 6px per Military rank (4).
    expect(outpostOn(parsed, 2).range).toBe(Math.floor(80 + 250 * (3 / 103) + 4 * 6));
    expect(outpostOn(parsed, 2).range).toBe(111);
    expect(outpostOn(parsed, 1).range).toBe(80);
  });

  it('prices the three upgrades against the PTS the outpost has earned', () => {
    const parsed = parse();
    const froggy = outpostOn(parsed, 2);

    // 2 base + 40 from the World 1 armory upgrade + 3 Trading ranks, and floor(3 / 6) = 0 extra.
    expect(froggy.ptsTotal).toBe(45);
    expect(froggy.ptsSpent).toBe(2 * 12 + 3 * 2 + 1 * 1);
    expect(froggy.ptsLeft).toBe(14);
    expect(froggy.upgrades.map(({ cost }) => cost)).toEqual([12, 2, 1]);
    expect(froggy.upgrades.map(({ affordable }) => affordable)).toEqual([true, true, true]);
    // Effects come out split so the UI can weight the number apart from its label.
    expect(froggy.upgrades[1].effects).toEqual([
      { value: '+15%', label: 'Resource Collection Rate' },
      { value: '+7px', label: 'connection range' }
    ]);
    // Glorification is worth a flat +10 PTS.
    expect(outpostOn(parsed, 50).ptsTotal).toBe(12);
  });

  it('locks Greater Education until the armory unlocks it account wide', () => {
    const withGed = parse();
    expect(withGed.outpostStats.gedUnlocked).toBe(true);
    expect(outpostOn(withGed, 2).upgrades[2].unlocked).toBe(true);

    const noGed = getRoyalGuardian(
      {
        RoyalG: JSON.stringify(buildRoyalG().map((sub, i) => {
          if (i !== 2) return sub;
          const levels = [...sub];
          levels[57] = 0;
          return levels;
        })),
        RoyalMaps: JSON.stringify(buildRoyalMaps())
      },
      { bundles: [] },
      []
    );
    expect(noGed.outpostStats.gedUnlocked).toBe(false);
    expect(outpostOn(noGed, 2).upgrades[2].unlocked).toBe(false);
  });

  it('reads all three RoyalMaps[10] modes, not just the support flag', () => {
    const parsed = parse();

    expect(outpostOn(parsed, 2).mode).toBe(0);
    expect(outpostOn(parsed, 2).modeName).toBe('Resource Depot');
    expect(outpostOn(parsed, 1).mode).toBe(1);
    expect(outpostOn(parsed, 1).modeName).toBe('Support Camp');
    // A Savage Stronghold is mode 2: an `=== 1` check silently reports it as a plain Depot.
    expect(outpostOn(parsed, 0).mode).toBe(2);
    expect(outpostOn(parsed, 0).modeName).toBe('Savage Stronghold');
    expect(outpostOn(parsed, 0).isSupport).toBe(false);
    // Only a Support Camp credits TotalSupports, so the savage map feeds nobody.
    expect(outpostOn(parsed, 2).supports).toBe(2);
    // game: "SavageCollection" = 5 * (1 + ArmoryUpgBonus(69) / 100), unlevelled here.
    expect(parsed.outpostStats.savageMulti).toBe(5);
  });

  it('rates each rank bar per hour, replicating two game quirks verbatim', () => {
    const parsed = parse();
    const froggy = outpostOn(parsed, 2);

    // BarExpRate_Base = (1 + UnitSpecEffect([1,3,5,6,7][type]) / 100) * orblet STRONK_RANK.
    // Trade reads armory 20, unlevelled here, so the base is 1.
    // Then Intel rank 2 * ArmoryUpgBonus(72) (unlevelled) leaves 1, and 2 support camps at
    // SupportEXP = 200 * (1 + armory 43 / 100) = 400 give (1 + 400 * 2 / 100) = 9.
    close(froggy.rankBars[0].expPerHour, 9);
    // Time to next rank is the gap to the threshold over that rate.
    close(froggy.rankBars[0].hoursToNextRank, (25 * Math.pow(1.3, 3) - 40) / 9);

    // QUIRK: the game passes the RANK TYPE to isMapPurified, which expects a MAP, so the 200%
    // purity term reads maps 0-4. Map 0 is the Savage Stronghold in this fixture and is not
    // purified, but map 4 does not exist, so every bar here keeps a 1x purity term.
    // Proving it: purifying map 3 must move ONLY the Military bar (type 3), not the outpost's own.
    const maps = buildRoyalMaps();
    maps[3] = [0, 0, 0, 0, 0, 0, 0, 150000, -1, -1, 0, 111111111, 0];
    const quirk = getRoyalGuardian(
      { RoyalG: JSON.stringify(buildRoyalG()), RoyalMaps: JSON.stringify(maps) },
      { bundles: [] },
      []
    );
    const quirkFroggy = outpostOn(quirk, 2);
    close(quirkFroggy.rankBars[3].expPerHour, froggy.rankBars[3].expPerHour * 3);
    close(quirkFroggy.rankBars[0].expPerHour, froggy.rankBars[0].expPerHour);
    // And Froggy itself is not purified, so an outpost-keyed reading would have moved nothing.
    expect(quirkFroggy.purified).toBe(false);

    // QUIRK: the Glorified 2x doubles rBarXPdn before BarExpRate_Base reassigns it, so it is dead
    // code in the game. The glorified outpost must NOT get double EXP.
    close(outpostOn(parsed, 50).rankBars[0].expPerHour, 1);
  });

  it('caps outpost types per world, not per account', () => {
    const parsed = parse();

    // ArmoryUpgBonus(42) / (44) are unlevelled in this fixture, so nothing is allowed yet.
    expect(parsed.outpostStats.typesAllowed).toEqual([999, 0, 0]);
    expect(parsed.outpostStats.typesUnlocked).toBe(1);
    // Maps 0/1/2 are World 1 (savage, support, depot); map 50 is World 2.
    expect(parsed.outpostStats.typesUsedByWorld[1]).toEqual([1, 1, 1]);
    expect(parsed.outpostStats.typesUsedByWorld[2]).toEqual([1, 0, 0]);
  });

  it('reports an unclaimed node as unconnected', () => {
    const parsed = parse();
    // No outpost spends a slot on node 3, so it is unclaimed.
    const node = parsed.resources[3];

    expect(node.connected).toBe(false);
    expect(node.connectedMaps).toEqual([]);
    expect(node.connectedMapName).toBe('');
    expect(node.exhausted).toBe(false);
    expect(node.fillPercent).toBe(0);
  });

  it('names each outpost and reports the account wide unlocks', () => {
    const parsed = parse();

    expect(outpostOn(parsed, 2).name).toBe('Froggy Fields');
    expect(outpostOn(parsed, 50).name).toBe('YumYum Grotto');
    expect(outpostOn(parsed, 50).world).toBe(2);
    expect(parsed.outpostStats.unitsUnlocked).toBe(4);
    expect(parsed.outpostStats.barsUnlocked).toEqual([true, true, true, true, true]);
    expect(parsed.outpostStats.worldsUnlocked).toBe(1);
  });

  it('degrades to an empty kingdom rather than NaN', () => {
    const empty = getRoyalGuardian({}, { bundles: [] }, []);

    expect(empty.outposts).toEqual([]);
    expect(empty.outpostStats.unitsUnlocked).toBe(1);
    expect(empty.outpostStats.gedUnlocked).toBe(false);
    expect(empty.outpostStats.barsUnlocked).toEqual([false, false, false, false, false]);
  });
});
