import '../../polyfills';
import { describe, expect, it } from 'vitest';
import {
  getArmoryCostReduction,
  getArmoryUpgradeBonus,
  getArmoryUpgradeCost,
  getOptimizedArmoryUpgrades,
  getOrbletMarketBonus,
  getOutpostRogBonus,
  getRoyalGuardian,
  getRoyalStatueBonus,
  getStatueFlairExpMulti
} from '@parsers/class-specific/royalGuardian';
import { lavaLog } from '@utility/helpers';

// Every number in GAME was read out of the running game (patch 2.3.525) over the debug server, on
// the save reproduced by buildRoyalG()/buildRoyalMaps() below. Handlers: ArmoryUpgCost (by display
// slot), ArmoryUpgBonus, OrbletMarketCost, OrbletMarketBonus, ResNodeQTYmax, OutpostROGbon,
// ArmoryUpgUNLOCKED, ArmoryUpgTotal, SF_unlocked, StatueBon, StatueUpgOdds, OutpostKillsReq,
// TotalStatz.
const GAME = {
  total: 26,
  unlocked: 7,
  sf: 0,
  costs: [0, 69.90718855989145, 88.03332793623501, 0, 761.01451776, 793.7099563008001,
    1200.6666975313924, 1773.2923532771329, 2572.456107154028, 3680.1254427050562,
    5206.409047363784, 7298.889635923326, 10154.976884762887, 3509.5600113740543,
    1929.9980388474796, 26407.697303954483, 35982.61722964636, 48849.12884509567,
    66099.84977439232, 89181.2027226396, 120005.88509959295, 161100.5833141853,
    215799.85113714123, 288500.42320912034, 384994.60731225595, 512907.10133355245,
    682267.0147934941, 226564.14076161315, 1202190.524361258, 1592796.9894695121,
    2107891.3379284665, 2786563.237550025, 3680032.720066065, 4855378.554967165,
    6400403.492159701, 8429980.715470634, 11094329.550050367, 14589803.24390185,
    19172946.76958622, 25178810.09533193, 33044797.856759682, 43341720.05311294,
    56814206.52745407, 74433294.5752622, 97464838.13809045, 127558475.80140196,
    166863307.24614164, 218178259.79710567, 285147502.488512, 372514345.5190128,
    486451056.4514947, 634987200.8174758, 828565823.2026092, 1080765477.5793273,
    1409237377.867923, 1836921528.8759127, 2393624594.023532, 3118066727.789946,
    4060536288.2941065, 5286332371.221867, 6880228215.586913, 8952257274.892591,
    11645212715.307436, 15144366232.003016, 19690061041.16802, 25594026630.87638,
    33260512165.19386, 4321365791.086841, 56132941120.369514],
  bonuses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  orbCost: [2, 3, 5, 10, 25, 20, 50, 100, 200, 500],
  orbBon: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  resMax: [5000000, 75000, 7500, 250000, 250000, 150000, 350000, 10000, 50000, 100000, 25000, 20000,
    200000, 60000, 1000000, 25000, 0, 0, 0, 0, 75000, 75000000, 1250000, 25000, 18750000, 6250,
    12500, 50000, 2000000, 125000, 625000, 250000, 3750000, 37500000, 7500000, 12500000, 25000000,
    0, 0, 0, 125000000, 62500000, 93750, 156250, 250000, 37500, 25000000, 625000, 1250000,
    100000000, 375000000, 3750000, 40000000, 625000000, 12500000, 9375000, 6250000, 62500000, 0, 0,
    2500000000, 1562500000, 93750000, 187500000, 31250000, 3750000000, 6250000, 625000000,
    62500000, 15625000, 3125000, 625000, 1875000, 312500000, 625000000, 937500000, 6250000000, 0,
    0, 0],
  rog: [1.2439024390243902, 1, 1, 1],
  statueBon: [0, 0, 0, 0, 0, 0, 0, 0],
  statueOdds: [0.04, 0.02, 0.01, 0.004, 0.002, 0.001, 0.0004, 0.0001],
  killReq: [156.39405897989235, 188.29877301257415, 500, 1000, 2000, 7500, 20000],
  // Index 3 (TotalStatz(3)) is deliberately not captured: the game caches it in DNSM, so a
  // captured value can disagree with the fixture's own resource array. The test recomputes it.
  statz: [0, 5, 0, null, 7]
};

// AllMasterclassCostRedux was 0.2 on that save: legend talent 23 active, no bon_p bundle, orblet
// BARGAIN still at level 0.
const account = {
  bundles: [],
  accountOptions: { 480: 0, 499: 0 },
  legendTalents: { talents: [{ originalIndex: 23, bonus: 5 }] }
};

const buildRoyalG = () => {
  const armory = new Array(99).fill(0);
  armory[9] = 1;
  armory[30] = 1;
  armory[31] = 1;
  armory[46] = 12;
  armory[58] = 11;
  return [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [394.300168856871, ...new Array(79).fill(0)],
    armory,
    [340, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    new Array(160).fill(0),
    new Array(160).fill(0),
    [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
    new Array(50).fill(0),
    new Array(15).fill(0)
  ];
};

const OUTPOST_MAPS = [1, 2, 14, 16, 19, 24, 26];

const buildRoyalMaps = () => {
  const maps = new Array(400).fill(null).map(() => []);
  OUTPOST_MAPS.forEach((mapIndex) => {
    maps[mapIndex] = [0, 0, 0, 0, 0, 0, 0, 0, -1, -1, 0, 211111111, 0];
  });
  maps[1][1] = 1;
  maps[1][8] = 7;
  maps[2][1] = 1;
  maps[2][8] = 8;
  maps[16][1] = 1;
  maps[19][1] = 1;
  maps[24][1] = 1;
  maps[27] = [3772.9037558687082]; // kill progress towards an outpost, not an outpost yet
  return maps;
};

const parse = (royalG) => getRoyalGuardian(
  { RoyalG: JSON.stringify(royalG), RoyalMaps: JSON.stringify(buildRoyalMaps()) },
  account,
  []
);

const close = (actual, expected) =>
  expect(Math.abs(actual - expected) / Math.max(1, Math.abs(expected))).toBeLessThan(1e-9);

describe('royal guardian parser matches the live game', () => {
  const parsed = parse(buildRoyalG());

  it('armory totals and unlocked shelf count', () => {
    expect(parsed.armory.totalLevels).toBe(GAME.total);
    expect(parsed.armory.unlockedSlots).toBe(GAME.unlocked);
  });

  it('every ArmoryUpgBonus', () => {
    GAME.bonuses.forEach((expected, index) => close(parsed.armory.upgrades[index].bonus, expected));
  });

  it('every ArmoryUpgCost, keyed by display slot', () => {
    GAME.costs.forEach((expected, slot) => {
      close(parsed.armory.upgrades.find((upgrade) => upgrade.slot === slot).cost, expected);
    });
  });

  it('orblet market costs and bonuses', () => {
    GAME.orbCost.forEach((expected, index) => close(parsed.orbletMarket[index].cost, expected));
    GAME.orbBon.forEach((expected, index) => close(parsed.orbletMarket[index].bonus, expected));
  });

  it('royal statue bonuses and upgrade odds', () => {
    GAME.statueBon.forEach((expected, index) => close(parsed.royalStatues[index].bonus, expected));
    GAME.statueOdds.forEach((expected, index) => close(parsed.royalStatues[index].upgradeOdds, expected));
  });

  it('statue flair stays locked without ArmoryUpgBonus(78)', () => {
    expect(parsed.statueFlair.unlocked).toBe(GAME.sf === 1);
  });

  it('every ResNodeQTYmax', () => {
    GAME.resMax.forEach((expected, index) => close(parsed.resources[index].maxQuantity, expected));
  });

  it('OutpostROGbon for all four stats', () => {
    GAME.rog.forEach((expected, index) => close(parsed.outpostStats.rogBonuses[index].value, expected));
  });

  it('TotalStatz aggregates', () => {
    expect(parsed.outpostStats.totalNodeLevels).toBe(GAME.statz[0]);
    expect(parsed.outpostStats.totalUpgradeLevels).toBe(GAME.statz[1]);
    expect(parsed.outpostStats.purifiedMaps).toBe(GAME.statz[2]);
    expect(parsed.outpostStats.built).toBe(GAME.statz[4]);
    // TotalStatz(3) is cached in DNSM and lags the live resource count, so recompute it here.
    close(parsed.outpostStats.resourceLogTotal, lavaLog(394.300168856871));
  });

  it('OutpostKillsReq, both the override table and the fallback', () => {
    OUTPOST_MAPS.forEach((mapIndex, i) => {
      close(parsed.outposts.find((outpost) => outpost.mapIndex === mapIndex).killsRequired, GAME.killReq[i]);
    });
  });

  it('only maps with a 13-slot entry count as outposts', () => {
    expect(parsed.outposts.map((outpost) => outpost.mapIndex)).toEqual(OUTPOST_MAPS);
    parsed.outposts.forEach((outpost) => expect(outpost.ranks).toEqual([0, 0, 0, 0, 0]));
  });
});

describe('royal guardian parser matches the live game, with levels seeded in', () => {
  // Read back out of the game with a synchronous set/read/restore, so the save never saw them.
  const royalG = buildRoyalG();
  royalG[0][0] = 3;   // royal statue 0
  royalG[2][45] = 5;  // Royal Reverence
  royalG[2][78] = 1;  // Statue Flair unlock
  royalG[22][3] = 2;  // statue flair on statue 3
  royalG[23][1] = 4;  // orblet HYDRATION
  const parsed = parse(royalG);

  it('StatueBon(0) is 241.5', () => close(parsed.royalStatues[0].bonus, 241.5));
  it('StatueUpgOdds(0) is 0.025', () => close(parsed.royalStatues[0].upgradeOdds, 0.025));
  it('ArmoryUpgBonus(45) is 5', () => close(parsed.armory.upgrades[45].bonus, 5));
  it('OrbletMarketCost(1) is 8', () => close(parsed.orbletMarket[1].cost, 8));
  it('OrbletMarketBonus(1) is 20', () => close(parsed.orbletMarket[1].bonus, 20));
  it('SF_costo(3) is 1000', () => close(parsed.statueFlair.statues[3].cost, 1000));
  it('SF_bonus(3) is 1400', () => close(parsed.statueFlair.statues[3].bonus, 1400));
  it('StatueEXPmulti(3) is 15', () => close(parsed.statueFlair.statues[3].expMulti, 15));
  it('SF_unlocked flips on ArmoryUpgBonus(78)', () => expect(parsed.statueFlair.unlocked).toBe(true));
});

describe('royal guardian with no save', () => {
  const parsed = getRoyalGuardian({}, { bundles: [] }, []);

  it('still renders the whole catalog', () => {
    expect(parsed.armory.upgrades.length).toBe(83);
    expect(parsed.armory.slotToId.length).toBe(69);
    expect(parsed.royalStatues.length).toBe(8);
    expect(parsed.statueFlair.statues.length).toBe(32);
    expect(parsed.orbletMarket.length).toBe(10);
    expect(parsed.resources.length).toBe(80);
    expect(parsed.outposts).toEqual([]);
    expect(parsed.unlocked).toBe(false);
  });

  it('leaves the fourteen upgrades with no shelf at slot -1', () => {
    expect(parsed.armory.upgrades.filter((upgrade) => upgrade.slot === -1).map((upgrade) => upgrade.index))
      .toEqual([5, 6, 7, 8, 13, 14, 15, 16, 34, 54, 64, 65, 66, 67]);
  });

  it('the exported helpers fall back to their neutral values', () => {
    const emptyAccount = { royalGuardian: parsed };
    expect(getArmoryUpgradeBonus(emptyAccount, 45)).toBe(0);
    expect(getRoyalStatueBonus(emptyAccount, 0)).toBe(0);
    expect(getOrbletMarketBonus(emptyAccount, 1)).toBe(0);
    expect(getOutpostRogBonus(emptyAccount, 0)).toBe(1);
    expect(getArmoryUpgradeBonus({}, 45)).toBe(0);
    expect(getRoyalStatueBonus({}, 0)).toBe(0);
    expect(getOrbletMarketBonus({}, 1)).toBe(0);
    expect(getOutpostRogBonus({}, 0)).toBe(1);
  });
});

describe('the contract helpers key off the entry index, not the array position', () => {
  // liveEntries() drops placeholder catalog rows, so a future patch adding one would shift every
  // array position. Simulate that by deleting the rows in front of the ones being looked up.
  //
  // Every assertion below has to discriminate, which means two things. The row being looked up must
  // carry a NON-neutral value, or a broken lookup returning undefined would pass anyway. And the row
  // sitting at the matching array POSITION must carry a different non-neutral value, or a lookup
  // that reads the wrong row would pass anyway. Both halves are seeded here on purpose.
  const royalG = buildRoyalG();
  royalG[2][49] = 3;   // Royal Talent Points IV, x1  -> 3.  Position 9 of the shifted armory list.
  royalG[23][1] = 4;   // orblet HYDRATION,       x5  -> 20. Dropped from the shifted orblet list.
  royalG[23][6] = 2;   // orblet STRONK_RANK,     x5  -> 10. Position 1 of the shifted orblet list.
  royalG[23][7] = 3;   // orblet BARGAIN,         x10 -> 30.
  royalG[23][9] = 7;   // orblet PARCHMORE,       x1  -> 7.
  royalG[22][10] = 2;  // flair on statue 10, lv 2 -> multi 15. Position 0 of the shifted flair list.
  royalG[22][12] = 3;  // flair on statue 12, lv 3 -> multi 25.

  const parsed = parse(royalG);
  const shifted = {
    royalGuardian: {
      ...parsed,
      armory: { ...parsed.armory, upgrades: parsed.armory.upgrades.filter((u) => u.index >= 40) },
      orbletMarket: parsed.orbletMarket.filter((o) => o.index >= 5),
      statueFlair: {
        ...parsed.statueFlair,
        statues: parsed.statueFlair.statues.filter((s) => s.index >= 10)
      }
    }
  };

  it('the fixture really is discriminating', () => {
    // Guard the guard: if a catalog change ever flattens these to the neutral value, the three
    // tests below would start passing vacuously, which is the exact failure mode this block exists
    // to prevent.
    expect(getArmoryUpgradeBonus({ royalGuardian: parsed }, 49)).toBe(3);
    expect(getOrbletMarketBonus({ royalGuardian: parsed }, 6)).toBe(10);
    expect(getStatueFlairExpMulti({ royalGuardian: parsed }, 10)).toBe(15);
  });

  it('still finds the right armory upgrade', () => {
    expect(getArmoryUpgradeBonus(shifted, 46)).toBe(12);        // positional would read index 86 -> 0
    expect(getArmoryUpgradeBonus(shifted, 58)).toBe(55);        // positional would read index 98 -> 0
    expect(getArmoryUpgradeBonus(shifted, 9)).toBe(0);          // dropped; positional would read 49 -> 3
  });

  it('still finds the right orblet upgrade', () => {
    expect(getOrbletMarketBonus(shifted, 7)).toBe(30);          // positional would run off the end -> 0
    expect(getOrbletMarketBonus(shifted, 9)).toBe(7);           // positional would run off the end -> 0
    expect(getOrbletMarketBonus(shifted, 1)).toBe(0);           // dropped; positional would read 6 -> 10
  });

  it('still finds the right statue flair row', () => {
    expect(getStatueFlairExpMulti(shifted, 12)).toBe(25);       // positional would read index 22 -> 1
    expect(getStatueFlairExpMulti(shifted, 0)).toBe(1);         // dropped; positional would read 10 -> 15
  });
});

describe('a brand new Royal Guardian with nothing bought yet', () => {
  // The character-class branch of `unlocked` is the only thing standing between 1x and 1.2439x on
  // the selected ROG bonus for an account with no armory levels and no outposts.
  const empty = getRoyalGuardian(
    { RoyalG: JSON.stringify(buildRoyalG().map((sub, i) => (i === 2 ? new Array(99).fill(0) : sub))), RoyalMaps: JSON.stringify(new Array(400).fill(null).map(() => [])) },
    account,
    [{ class: 'Royal_Guardian' }]
  );
  const withGuardian = { royalGuardian: empty };

  it('counts as unlocked through the character class alone', () => {
    expect(empty.hasRoyalGuardian).toBe(true);
    expect(empty.armory.totalLevels).toBe(0);
    expect(empty.outposts).toEqual([]);
    expect(empty.unlocked).toBe(true);
  });

  it('gives the selected ROG bonus the game floor of 1.2439024390243902', () => {
    close(getOutpostRogBonus(withGuardian, 0), 1.2439024390243902);
    expect(getOutpostRogBonus(withGuardian, 1)).toBe(1);
    expect(getOutpostRogBonus(withGuardian, 2)).toBe(1);
    expect(getOutpostRogBonus(withGuardian, 3)).toBe(1);
  });

  it('a non-Royal-Guardian account with the same save stays at the identity', () => {
    const noGuardian = getRoyalGuardian(
      { RoyalG: JSON.stringify(buildRoyalG().map((sub, i) => (i === 2 ? new Array(99).fill(0) : sub))), RoyalMaps: JSON.stringify(new Array(400).fill(null).map(() => [])) },
      account,
      [{ class: 'Divine_Knight' }]
    );
    expect(noGuardian.unlocked).toBe(false);
    expect(getOutpostRogBonus({ royalGuardian: noGuardian }, 0)).toBe(1);
  });
});

describe('the Armory Upgrade Optimizer unlocks by shelf position, not by a per-row threshold', () => {
  // Zero every armory level. ArmoryUpgUNLOCKED then clears exactly one catalog threshold - id 0
  // ("Resource_Grades", unlockTotalLevels 0) - so unlockedSlots is 1: only shelf POSITION 0 is
  // open. research[43] (slotToId) puts id 30 ("Collect_Resources_Tool", own unlockTotalLevels
  // 550) at that position, and puts id 0 itself at slot 22. The game reveals shelf positions in a
  // fixed order that has nothing to do with the occupant's own threshold, so id 30 is purchasable
  // immediately (550 levels away from its own gate) while id 0 stays locked (slot 22 >> 1) despite
  // clearing its own threshold on level zero. A "per-row" gate - checking each upgrade's own
  // unlockTotalLevels instead of counting shelf positions - would get this exactly backwards.
  const zeroedRoyalG = buildRoyalG().map((sub, i) => (i === 2 ? new Array(99).fill(0) : sub));
  const parsedRG = parse(zeroedRoyalG);
  const optAccount = { ...account, royalGuardian: parsedRG };

  it('the fixture really is discriminating: slot 0 and id 0 disagree with each other', () => {
    // Guard the guard: if this ever stops holding, the purchase test below would pass no matter
    // whether the shelf-position rule or a per-row rule is implemented.
    expect(parsedRG.armory.unlockedSlots).toBe(1);
    expect(parsedRG.armory.slotToId[0]).toBe(30);
    expect(parsedRG.armory.upgrades.find((u) => u.index === 30)?.unlockTotalLevels).toBe(550);
    expect(parsedRG.armory.upgrades.find((u) => u.index === 0)?.unlockTotalLevels).toBe(0);
    expect(parsedRG.armory.upgrades.find((u) => u.index === 0)?.slot).toBe(22);
  });

  it('buys the shelf-position-unlocked upgrade, not the one whose own threshold is already met', () => {
    const results = getOptimizedArmoryUpgrades({}, optAccount, 'all', 1);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe(30);
    expect(results[0].slot).toBe(0);
    close(results[0].cost, 0);
  });
});

describe('the Armory Upgrade Optimizer decays the Legend-Talent-23 discount across a buy sequence', () => {
  // account (module-level, above) has accountOptions[480]=0 < getLegendTalentBonus(account,23),
  // no bon_p bundle and orblet BARGAIN at level 0 - the same non-neutral state the "matches the
  // live game" describe block above confirms gives AllMasterclassCostRedux = 0.2.
  const parsedRG = parse(buildRoyalG());
  const optAccount = { ...account, royalGuardian: parsedRG };
  const slotToId = parsedRG.armory.slotToId;

  const reductionWith = getArmoryCostReduction(optAccount, true);
  const reductionWithout = getArmoryCostReduction(optAccount, false);

  it('the fixture really is discriminating: forceLegendTalent actually flips the reduction factor', () => {
    // Guard the guard: with reductionWith === reductionWithout, the decay assertion below would
    // pass whether or not forceLegendTalent ever reached getArmoryUpgradeCost.
    close(reductionWith, 0.2);
    close(reductionWithout, 1);
  });

  it('prices a later step without the discount once masterClassReduction runs out', () => {
    const masterClassReduction = 2; // discount covers exactly steps 0 and 1; step 2 must decay
    const results = getOptimizedArmoryUpgrades({}, optAccount, 'all', 3, { masterClassReduction });
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.hadReduction)).toEqual([true, true, false]);

    // Reconstruct the armory levels the walk had reached right before step 2's purchase: the
    // fixture's own baseline (buildRoyalG()[2]), with steps 0-1's reported post-purchase levels
    // laid on top.
    const armoryLevels = [...buildRoyalG()[2]];
    armoryLevels[results[0].index] = results[0].level;
    armoryLevels[results[1].index] = results[1].level;

    const expectedUndiscounted = getArmoryUpgradeCost(results[2].slot, slotToId, armoryLevels, reductionWithout);
    const expectedStillDiscounted = getArmoryUpgradeCost(results[2].slot, slotToId, armoryLevels, reductionWith);

    // Step 2's real cost must match the undiscounted recompute...
    close(results[2].cost, expectedUndiscounted);
    // ...and must NOT match what it would have been had forceLegendTalent stayed frozen at the
    // account's own (still-discounted) state - the exact defect the first half of this fix
    // addressed. reductionWith !== reductionWithout is pinned above, so these two expected values
    // are themselves far apart; this is not a tolerance-only check.
    expect(Math.abs(expectedStillDiscounted - expectedUndiscounted) / expectedUndiscounted)
      .toBeGreaterThan(0.5);
    expect(Math.abs(results[2].cost - expectedStillDiscounted) / expectedStillDiscounted)
      .toBeGreaterThan(0.5);
  });
});
