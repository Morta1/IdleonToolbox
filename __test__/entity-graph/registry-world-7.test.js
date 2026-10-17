import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData, missingTables, resetMissingTables } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world7 from '../../scripts/entity-graph/registry/world-7/index.mjs';
import { dropUnfilledSentences } from '../../scripts/entity-graph/registry/text.mjs';
import { costsAt, costsToMax, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';
import { PANEL_TEXT } from '../../utility/wiki/menagerie-jellies.mjs';
import { getMenagerieBoost, getMenagerieCost, getMenagerieUpgUnlocked, isSideJellyUnlocked } from '@parsers/world-7/menagerie';
import { getClamBonus, getClamCost } from '@parsers/world-7/clamWork';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world7);
const report = registryReport(data, world7);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
// The whole field, links included, of the page with this id.
const fieldAt = (id, label) => nodes[id].fields.find((field) => field.label === label);
// The pages of one kind built with one wiki table taken out, and the tables the build then reports missing.
const builtWithout = (table, kind) => {
  const wikiTables = { ...data.wikiTables };
  delete wikiTables[table];
  resetMissingTables();
  try {
    return { pages: Object.values(registryNodes({ ...data, wikiTables }, world7)).filter((node) => node.kind === kind), missing: missingTables() };
  } finally {
    resetMissingTables();
  }
};

// Oracles: Spelunk.js:228-372 (unlock chain, cost, per-index values), 410-419 (AmberDenominator) and the shop panel
// N.js:118773-118794. getSpelunkingUpgradeCost (spelunking.ts:874) returns nothing at level -1, so the unlock costs are pins.
describe('spelunking shop upgrades', () => {
  const upgrades = ofKind('spelunkupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);

  it('skip only the upgrade whose name is glyph art', () => {
    expect(report.spelunkupgrade.skipped).toEqual([{
      index: data.spelunkingUpgrades.findIndex((entry) => /[^\x20-\x7e]/.test(entry.name)),
      reason: 'placeholder: name is glyph art'
    }]);
  });

  // ShopUpgBuyable (N.js:107384) stops a purchase at x3, the 99999 rows included.
  it('cap every upgrade at its max level', () => {
    const skipped = report.spelunkupgrade.skipped.map(({ index }) => index);
    expect(upgrades.map((node) => [node.rawName, node.effect.cap])).toEqual(
      data.spelunkingUpgrades.map((entry, index) => [`SpelunkUpg${index}`, entry.x3]).filter((pair, index) => !skipped.includes(index))
    );
  });

  it('carry the one Spelunking cost note', () => {
    expect([...new Set(upgrades.map((node) => costsAt(node, 1)[0].note))]).toEqual([
      'Base cost in orange Amber, before discounts. Once you deal in Blue, Green, Red or Pink Amber, the shop shows the price divided by that colour\'s worth: 1,000, 1e9, 1e21 or 1e36 orange. The total to max leaves out the unlock cost.'
    ]);
  });

  it.each([
    ['Amber_on_the_Rocks', 1, '19% chance'],
    ['Amber_on_the_Rocks', 1, '+25% more'],
    ['Amber_on_the_Rocks', 10, '37.5%'],
    ['Amber_on_the_Rocks', 10, '+250%'],
    ['Less_Taxes', 1, 'Lose only 48%'],
    ['Less_Taxes', 20, '10%'],
    ['Deep_Pockets', 1, 'drop 1.07x more amber'],
    ['Duplicate_Elixirs', 4, 'equip 5 of the same'],
    ['A_Truly_Exalted_Find', 1, '1 in 59'],
    ['A_Truly_Exalted_Find', 10, '1 in 50'],
    ['Grand_Discoveries', 1, '1 in 24,752'],
    ['Overstim_Meter', 1, '+31% bonus Amber'],
    ['Uncanny_Ability_to_Find_Narrow_Passages', 10, '2.2x']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('read the Prisma Bubble odds as a whole sentence', () => {
    expect(textAt('A_Scintillatingly_Prismatic_Find', 1)).toBe('Objects have a 1 in 98 chance of dropping a Prisma Bubble!');
  });

  it.each([
    ['Big_Time_Stamina', 1, '8'],
    ['Big_Time_Stamina', 2, '28'],
    ['Big_Time_Stamina', 10, '143,332'],
    ['Less_Taxes', 1, '487,482'],
    ['Golden_Hardhat', 1, '1.16e23'],
    ['Amber_Supply_Swap', 1, '1.07e38']
  ])('price %s at level %i at %s', (name, level, expected) => {
    expect(costAt(name, level)).toBe(expected);
  });

  it.each([
    ['Big_Time_Stamina', '5.27e23'],
    ['Less_Taxes', '3.18e22'],
    ['Grand_Discoveries', '1.18e67']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('cut the account readouts and keep the sentence ends', () => {
    expect(byName('Learning_the_POW').description).toBe('+{_POW_per_total_Spelunking_LV_of_all_players._POW_is_needed_to_destroy_tougher_objects_in_Tunnels!');
    expect(byName('Stamina_Resurgence').description.endsWith('Max_Stamina.')).toBe(true);
    expect(byName('Manic_POW').description.endsWith('tunnels!')).toBe(true);
    expect(byName('Min-Maxed_Nova_Blasts').description.endsWith('you\'ve_unlocked.')).toBe(true);
    expect(upgrades.filter((node) => /Total_Bonus|You_have_\^|You've_found/.test(node.description)).map((node) => node.name)).toEqual([]);
  });

  it('read the unlock cost and the upgrade it is shown after', () => {
    expect(byName('Learning_the_POW').fields).toEqual([{ label: 'Unlock cost', value: '1 Amber' }]);
    expect(byName('Big_Time_Stamina').fields).toEqual([
      { label: 'Unlock cost', value: '26 Amber' },
      { label: 'Shown after unlocking', value: 'Learning the POW', links: ['spelunkupgrade:SpelunkUpg0'], linkAs: 'unlockedBy' }
    ]);
    // 9 x 428.69, rounded up as the shop rounds every cost below 1e5.
    expect(fieldOf(byName('The_Biggest_Haul'), 'Unlock cost')).toBe('3,859 Amber');
    // The 1e7 tier, then the 1e9 tier on top.
    expect(fieldOf(byName('Amber_Be_Here'), 'Unlock cost')).toBe('2.50e24 Amber');
    expect(fieldOf(byName('Amber_Supply_Swap'), 'Unlock cost')).toBe('3.86e38 Amber');
    expect(fieldOf(byName('A_Truly_Exalted_Find'), 'Odds')).toBe('Each fragment found makes the next 8x rarer');
    expect(fieldOf(byName('A_Scintillatingly_Prismatic_Find'), 'Odds')).toBe('Each bubble found makes the next 1.5x rarer');
  });

  // Owner decisions 4: without the panel table the shop's round-up is unknown, so no price shows rather than an unrounded one.
  it('show no price and no unlock cost without the shop panel table', () => {
    const { pages, missing } = builtWithout('spelunkShopPanel', 'spelunkupgrade');
    expect([[...new Set(pages.map((node) => node.cost))], pages.filter((node) => fieldOf(node, 'Unlock cost')), missing]).toEqual([[null], [], ['spelunkShopPanel']]);
  });
});

// Oracle: research section 2 table, cross-checked by spelunking.ts:211-235 (the Lore boss list).
describe('spelunking tunnels', () => {
  const tunnels = ofKind('spelunktunnel');
  const byName = (name) => tunnels.find((node) => node.name === name);

  it('skip the unreleased tunnel slots', () => {
    expect(report.spelunktunnel.skipped).toEqual(data.generalSpelunky[6]
      .map((name, index) => ({ name, index }))
      .filter(({ name }) => /^Name\d+$/.test(name))
      .map(({ index }) => ({ index, reason: 'placeholder: unreleased tunnel' })));
  });

  // The boss depth list and the boss's own rock row are two sources; the game agrees with both (N.js:118807).
  it('put each lore boss at its own rock depth', () => {
    expect(tunnels.map((node) => fieldOf(node, 'Lore boss depth'))).toEqual(
      tunnels.map((node) => data.spelunkingRocks[node.order].at(-1).x6)
    );
  });

  it('read the lore boss, its depth and the other objects', () => {
    expect(byName('Pebble_Cove').fields).toEqual([
      { label: 'Lore boss', value: 'Scoundrel Pommsie' },
      { label: 'Lore boss depth', value: 7 },
      { label: 'Objects', value: ['Smol Pebbles', 'Smooth Rocks', 'Big Stone', 'Gravel Pile', 'Granite Stack', 'Stonespire'] }
    ]);
    expect([fieldOf(byName('Blushpit'), 'Lore boss'), fieldOf(byName('Blushpit'), 'Lore boss depth')]).toEqual(['Greg', 30]);
    expect([fieldOf(byName('Exiled_Throne'), 'Lore boss'), fieldOf(byName('Exiled_Throne'), 'Lore boss depth')]).toEqual(['Esquire Morose', 130]);
    expect(fieldOf(byName('Lunarheim'), 'Objects')).toContain('Kingdom Flags');
  });

  it('describe the tunnel by its labelled lore boss reward', () => {
    expect(byName('Pebble_Cove').description).toBe('Lore_boss_reward:_World\'s_End_island_&_Omnipotent_Artifact_tier_unlocked_in_Sailing!');
  });

  // The game ships no CaveRockj art; the build nulls the missing primary and the fallback shows.
  it('point the Exiled Throne at its missing boss art with the Spelunking fallback', () => {
    expect([byName('Exiled_Throne').icon, byName('Exiled_Throne').iconFallbacks]).toEqual(['/data/CaveRockj15.png', ['/etc/Spelunking.png']]);
  });
});

// Oracle: ResearchStuff.js:278-315 (Grid_PTSspent, Grid_Bonus), tooltip N.js:107639 and 121444. research.ts reads the
// account's shape and multipliers, so the base values here are pins.
describe('research grid squares', () => {
  const squares = ofKind('researchsquare');
  const byName = (name) => squares.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const named = data.researchGridSquares.filter((entry) => entry.name !== 'Name');

  it('skip every empty square', () => {
    expect(report.researchsquare.skipped).toEqual(data.researchGridSquares
      .map((entry, index) => ({ name: entry.name, index }))
      .filter(({ name }) => name === 'Name')
      .map(({ index }) => ({ index, reason: 'placeholder: empty square' })));
  });

  // The page labels read researchGridLabels; researchGridColumns is the same column count from another locator, kept
  // unread (dropping it needs a regeneration), so the two must agree or one of the locators has drifted.
  it('read the same column count from both grid tables', () => {
    expect(data.wikiTables.researchGridColumns.columns).toBe(data.wikiTables.researchGridLabels.columns);
  });

  it('cap each square at its maximum level', () => {
    expect(Object.fromEntries(squares.map((node) => [spaced(node.name), node.effect.cap]))).toEqual(
      Object.fromEntries(named.map((entry) => [spaced(entry.name), entry.maxLv]))
    );
  });

  // One Research Point per level, so the total to max is the cap.
  it('cost one point per level', () => {
    expect(squares.map((node) => costsToMax(node)[0].value)).toEqual(squares.map((node) => node.effect.cap));
    expect([...new Set(squares.map((node) => costsAt(node, 1)[0].note))]).toEqual(['One point per level.']);
  });

  it.each([
    ['Smart_Eye', 1, 'up to +25'],
    ['Smart_Eye', 1, '+5% Research EXP Gain'],
    ['Smart_Eye', 3, 'up to +75'],
    ['Smart_Eye', 3, '+15%'],
    ["Takin'_Notes", 1, '1.12x'],
    ["Takin'_Notes", 4, '1.48x'],
    ['Pts_Every_Ten', 1, 'Get +1 extra Research PTS'],
    ['Equinox_Nightmares', 3, '1.6x'],
    ['Legendary_Yellow_Fever', 3, '+3'],
    ['Legendary_Yellow_Fever', 3, '1.15x'],
    ["Day_'N'_Nite", 4, '+200']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('swap the Arctis marker for the game\'s no-companion sentence', () => {
    expect(textAt('Divine_Design', 1)).toBe('You are now permanently linked to Arctis on all characters. Also, +25% Drop Rate.');
  });

  it('cut the account readouts and keep the sentence', () => {
    expect([byName('Masterclass_Research'), byName('Spelunking_Research')].map((node) => node.description.endsWith('FOREVER!'))).toEqual([true, true]);
    // 2.3.540 renamed square 67 Sticky_Crowns to Stickery_Crowns.
    expect(byName('Stickery_Crowns').description.endsWith('goes_up_by_{%.')).toBe(true);
  });

  // Number2Letter[27] is "A" (read live 2026-10-16), so the first column is A: Smart Eye sat one letter off as M11.
  it('label a square as the game\'s grid does, rows counted up from the bottom', () => {
    expect(byName('Smart_Eye').fields).toEqual([{ label: 'Grid position', value: 'L11' }]);
    expect(fieldOf(byName("Day_'N'_Nite"), 'Grid position')).toBe('L4');
  });
});

// Oracle: ResearchStuff.js:100-147 (ObservationInsightExpREQ and the magnifier base), N.js:107617. getResearchEXPrateObj
// reads the account, so the base values here are pins.
describe('research observations', () => {
  const observations = ofKind('observation');
  const byName = (name) => observations.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  it('skip every empty observation', () => {
    expect(report.observation.skipped).toEqual(data.researchOccurrences
      .map((entry, index) => ({ name: entry.name, index }))
      .filter(({ name }) => name === 'Name')
      .map(({ index }) => ({ index, reason: 'placeholder: no observation yet' })));
  });

  it.each([
    ['Bored_Tree', 1, 'Insight EXP for the next level: 4.5'],
    ['Bored_Tree', 10, 'Insight EXP for the next level: 548.78'],
    ['Barnacle_Brothers', 1, 'Insight EXP for the next level: 33.4'],
    ['Barnacle_Brothers', 10, 'Insight EXP for the next level: 6,436.84'],
    ['Happy_Tree', 10, 'Insight EXP for the next level: 489,716.95']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('show where it is found, what it needs and what a magnifier earns', () => {
    expect(byName('Bored_Tree').fields).toEqual([
      { label: 'Found in', value: 'Valley Of The Beans', links: ['map:14'], linkAs: 'locatedIn' },
      { label: 'Research level needed', value: 1 },
      { label: 'Research EXP per Magnifier', value: 4, format: 'amount' }
    ]);
    expect(byName('Barnacle_Brothers').fields).toEqual([
      { label: 'Found in', value: 'Barnacle Curb', links: [`map:${data.researchOccurrences[10].mapId}`], linkAs: 'locatedIn' },
      { label: 'Research level needed', value: 20 },
      { label: 'Research EXP per Magnifier', value: expect.closeTo(78, 0), format: 'amount' }
    ]);
    expect(formatAmount(fieldOf(byName('Happy_Tree'), 'Research EXP per Magnifier'))).toBe('10,039');
  });

  it('draw the art by table position', () => {
    expect(byName('Barnacle_Brothers').icon).toBe('/data/ResObj10.png');
  });
});

// Oracle: Thingies.js:262-308 (LegendPTS_spent, LegendTalent_MaxLV), panel N.js:119052 and 119192-119193, cross-checked by
// legendTalents.ts:48-78. Art is keyed by grid position (N.js:119052), as the app draws it (legend-talents.jsx:147).
describe('legend talents', () => {
  const talents = ofKind('legendtalent');
  const byName = (name) => talents.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const live = data.legendTalents.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.name !== 'filler');
  const squareOf = (index) => data.gameTables.legendTalentMaxLevelGroups.find((group) => group.talents.includes(index))?.gridSquare;

  it('skip every filler talent', () => {
    expect(report.legendtalent.skipped).toEqual(data.legendTalents
      .map((entry, index) => ({ name: entry.name, index }))
      .filter(({ name }) => name === 'filler')
      .map(({ index }) => ({ index, reason: 'placeholder: no talent yet' })));
  });

  it('raise the maximum by the research square exactly for the talents the game groups', () => {
    expect(talents.filter((node) => fieldOf(node, 'Base max level')).map((node) => spaced(node.name))).toEqual(
      live.filter(({ index }) => squareOf(index) !== undefined).map(({ entry }) => spaced(entry.name))
    );
    expect(talents.map((node) => [spaced(node.name), node.effect.cap])).toEqual(
      live.map(({ entry, index }) => [spaced(entry.name), entry.x1 + (squareOf(index) === undefined ? 0 : data.researchGridSquares[squareOf(index)].maxLv)])
    );
  });

  it.each([
    ['Coral_Restoration', 2, '+60% more Daily Coral'],
    ['Greatest_Drop_Party_Ever', 1, '+500% Drop Rate'],
    ['Double_Aint_Enough', 3, 'bundles of 5x'],
    ['The_Charms_got_Rizz', 1, '1.25x'],
    ['Inevitable_Builder', 1, '1.75x faster!']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('fill the Super Talent bonus with the neutral 50 and cut the account readouts', () => {
    expect(textAt('Super_Talent_Points', 1)).toBe(
      'You get +1 Super Talent Point at Class LV 500, LV 600, LV 700 and so on. Spend these on Talents to give them +50 LV!'
    );
    expect(textAt("6_O'Clock_Crystals", 1)).toBe('4x more Guaranteed Crystal Mobs every day.');
  });

  it('drop the Super Talent sentence that holds the fill without its base', () => {
    const { pages } = builtWithout('superTalentPoints', 'legendtalent');
    expect(spaced(pages.find((node) => node.name === 'Super_Talent_Points').description)).toBe(
      'You get +1 Super Talent Point at Class LV 500, LV 600, LV 700 and so on.'
    );
  });

  it('show the grid position and the raised maximum', () => {
    expect(byName('Coral_Restoration').fields).toEqual([{ label: 'Grid position', value: 'Red 10' }]);
    expect(byName('Greatest_Drop_Party_Ever').fields).toEqual([
      { label: 'Grid position', value: 'Red 6' },
      {
        label: 'Base max level',
        value: '4, up to 7 with the Legendary Red Fever research square',
        links: ['researchsquare:ResGrid131'],
        linkAs: 'maxRaisedBy'
      }
    ]);
    expect(fieldOf(byName('The_Charms_got_Rizz'), 'Grid position')).toBe('Green 1');
    expect(fieldOf(byName('Super_Talent_Points'), 'Grid position')).toBe('Yellow 1');
    // The White band (squares 40 to 49) holds only filler talents today, so no page carries it.
    expect(fieldOf(byName('Skillium_Fancyson'), 'Grid position')).toBe('Brown 1');
    expect(fieldOf(byName('Buy_One_Get_One_Free'), 'Grid position')).toBe('Brown 10');
  });

  // A group naming a research square the data does not have raises nothing: the field goes, the cap is the talent's own.
  it('leave the raised maximum out when its research square is not in the data', () => {
    const groups = data.gameTables.legendTalentMaxLevelGroups.map((group) => ({ ...group, gridSquare: data.researchGridSquares.length }));
    const pages = Object.values(registryNodes({ ...data, gameTables: { ...data.gameTables, legendTalentMaxLevelGroups: groups } }, world7))
      .filter((node) => node.kind === 'legendtalent');
    expect([pages.filter((node) => fieldOf(node, 'Base max level')), pages.map((node) => node.effect.cap)])
      .toEqual([[], live.map(({ entry }) => entry.x1)]);
  });

  it('draw the art by grid position and charge one point per level', () => {
    expect(byName('Coral_Restoration').icon).toBe('/data/LegendTalentIcon19.png');
    expect(byName('Super_Talent_Points').icon).toBe('/data/LegendTalentIcon0.png');
    expect(costsAt(byName('Coral_Restoration'), 2)[0]).toMatchObject({ currency: 'Legend Talent Points', note: 'One point per level.' });
  });
});

// Oracle: Thingies.js:70-80 (ZenithMarketCost, bonus), panel N.js:119261 (unlock chain), N.js:119168 (the Zenith Cluster item),
// cross-checked by statues.ts:69-90. Task 1 pins True Zen's costs.
describe('zenith market upgrades', () => {
  const upgrades = ofKind('zenithupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);

  it('build one page per upgrade, named in title case', () => {
    expect(upgrades.map((node) => spaced(node.name).toLowerCase())).toEqual(data.zenithMarket.map((entry) => spaced(entry.name).toLowerCase()));
    expect(byName('True_Zen')).toBeDefined();
    expect(byName('Kingdomercial')).toBeDefined();
  });

  it('fill the level text', () => {
    expect(spaced(levelledText(byName('True_Zen'), 10))).toContain('1.2x');
  });

  it.each([
    ['Double_Cluster', ['8', '10', '41'], '309,908,909'],
    ['Super_Dupers', ['50', '86', '5,938'], '41,218,985'],
    ['Kingdomercial', ['25,000', '35,251', '550,705'], '5.09e19']
  ])('price %s', (name, [first, second, tenth], max) => {
    expect([1, 2, 10].map((level) => costAt(name, level))).toEqual([first, second, tenth]);
    expect(costToMax(name)).toBe(max);
  });

  it('price Kruk Bubbles to its cap', () => {
    expect(costToMax('Kruk_Bubbles')).toBe('3,120');
  });

  // Past 1e6 the price is no longer floored.
  it('price Kingdomercial at level 20', () => {
    expect(costAt('Kingdomercial', 20)).toBe('17,104,234');
  });

  it('name the previous upgrade that unlocks each one', () => {
    expect(byName('True_Zen').fields ?? []).toEqual([]);
    expect(byName('Kruk_Bubbles').fields).toEqual([{ label: 'Unlocked by', value: 'True Zen at level 1', links: ['zenithupgrade:ZenithMarket0'], linkAs: 'unlockedBy' }]);
    expect(upgrades.slice(1).map((node) => fieldOf(node, 'Unlocked by'))).toEqual(
      upgrades.slice(0, -1).map((node) => `${spaced(node.name)} at level 1`)
    );
  });

  it('carry the no-discounts note and the cluster item edge', () => {
    expect(costsAt(byName('Kruk_Bubbles'), 1)[0].note).toBe('No discounts apply.');
    expect(registryEdges(data, world7).filter((edge) => edge.from.startsWith('zenithupgrade:')).map(({ to, rel }) => ({ to, rel }))).toEqual(
      upgrades.map(() => ({ to: 'item:Quest110', rel: 'upgradedWith' }))
    );
  });
});

// Oracle: Spelunk.js:673-700 (BigFishBonus, BigFishCost, BigFishUpgLVREQ), panel N.js:107447 and 218018-218019, cross-checked by
// AdviceFish/Upgrades.jsx:13-18. Task 1 pins Life and Death's level 3.
describe('advice fish upgrades', () => {
  const fish = ofKind('advicefish');
  const byName = (name) => fish.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);

  it('build one page per fish', () => {
    expect(fish.map((node) => spaced(node.name))).toEqual(data.generalSpelunky[18].map((packed) => spaced(packed.split(',')[0])));
  });

  it.each([
    ['Advice_on_Life_and_Death', 1, '+0.1% faster W7 mob respawn rate'],
    ['Advice_on_Life_and_Death', 10, '+0.91%'],
    ['Advice_on_Life_and_Death', 100, '+5%'],
    ['Advice_on_Being_Tired', 3, '+0.24%'],
    ['Advice_on_Being_Smart', 1, '1.01x'],
    ['Advice_on_Being_Smart', 100, '1.13x']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('price Life and Death in Coins with no discounts', () => {
    expect([1, 2].map((level) => costAt('Advice_on_Life_and_Death', level))).toEqual(['1.03e26', '1.18e26']);
    expect(costsAt(byName('Advice_on_Life_and_Death'), 1)[0]).toMatchObject({ currency: 'Coins', note: 'No discounts apply.' });
  });

  it('require account levels for every fish but the first', () => {
    expect(byName('Advice_on_Life_and_Death').fields ?? []).toEqual([]);
    expect(byName('Advice_on_Being_Tired').fields).toEqual([{ label: 'Account level needed', value: 4300, format: 'amount' }]);
    expect(fieldOf(byName('Advice_on_Settlement'), 'Account level needed')).toBe(7000);
  });
});

// Oracle: Minehead.js:6-15 (UpgCost), 193-204, the research level gate N.js:107677 and the panel N.js:121561 (texts) and
// 121566 (cost, cap). getMinehead keeps its cost and texts inside the account parse, so these are pins. A_MineCost is 1.31.
describe('minehead upgrades', () => {
  const upgrades = ofKind('mineheadupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);

  it('skip only the upgrade with no levels to buy', () => {
    expect(report.mineheadupgrade.skipped).toEqual([{
      index: data.mineheadUpgrades.findIndex((entry) => entry.baseCost === 0),
      reason: 'max level 0: not for sale'
    }]);
  });

  // The game adds the fill's levelOffset to a 0-based level, which is the wiki's 1-based L only while it is 1: another
  // offset fills nothing, and the build drops the sentence holding the `$`.
  it('fill Numbahs only while its level offset is the 1-based level', () => {
    const fills = data.wikiTables.mineheadPanelFills;
    const moved = { ...data, wikiTables: { ...data.wikiTables, mineheadPanelFills: { ...fills, 1: { ...fills[1], levelOffset: 2 } } } };
    const numbahs = Object.values(dropUnfilledSentences(registryNodes(moved, world7))).find((node) => node.name === 'Numbahs');
    expect([textAt('Numbahs', 2), spaced(levelledText(numbahs, 2))]).toEqual([
      'Increase the max possible Tile Number you can find to 3! These are a MULTI for damage!',
      'These are a MULTI for damage!'
    ]);
  });

  // The extractor's `baseCost` column is the max level; N.js:121566 prints "/max" only below 999.
  it('cap exactly the upgrades the panel prints a maximum for', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null).map((node) => spaced(node.name))).toEqual(
      data.mineheadUpgrades.filter((entry) => entry.baseCost > 0 && entry.baseCost < 999).map((entry) => spaced(entry.name))
    );
  });

  it.each([
    ['Numbahs', 2, 'find to 3!'],
    ['Numbahs', 10, 'find to 12!'],
    ['Multiplier_Madness', 2, 'up to 1.4x!'],
    ['Multiplier_Madness', 10, 'up to 8x!'],
    ['Triple_Crown_Hunter', 1, 'by 1.51x'],
    ['Triple_Crown_Hunter', 250, 'by 4x'],
    ['Awesome_Additives', 1, 'up to 10%!'],
    ['Awesome_Additives', 10, 'up to 10,000%!'],
    ['Jackpot_Time', 2, '1 in 99'],
    ['Jackpot_Time', 10, '1 in 91'],
    ['Record_Breaking_Jackpots', 1, 'reveal 4 tiles'],
    // Level 11 is where the rounded and the floored discount part (9.91% vs 9.9%).
    ["El'_Cheapo_Upgrado", 11, '9.91%'],
    ['Grid_Expansion', 16, '12x6'],
    ['Grid_Expansion', 16, '72 total']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('describe the grid and the damage synergy with the game\'s own sentences', () => {
    expect(textAt('Grid_Expansion', 1)).toBe('Expands your grid to 4x3 tiles, that\'s 12 total tiles!');
    expect(textAt('Miney_Damagey_Synergy', 1)).toBe('+2% Mine Currency per POW 10 of your best ever hit');
  });

  it.each([
    ['Base_Damage_I', [1, 2, 10], ['5', '5', '11']],
    ['Extra_Lives', [1, 2], ['68', '17,063']],
    // 1,915 without A_MineCost.
    ['Boom_Blocker', [1], ['2,509']],
    ['Triple_Crown_Hunter', [1, 2, 10], ['174,966', '202,961', '665,390']],
    ['Final_Round_Fury', [20], ['1,072,519']]
  ])('price %s', (name, levels, expected) => {
    expect(levels.map((level) => costAt(name, level))).toEqual(expected);
  });

  it.each([
    ['Numbahs', '2.03e13'],
    ['Extra_Lives', '1.67e16'],
    ['Boom_Blocker', '2.51e12'],
    ['Triple_Crown_Hunter', '1.42e22']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('price in Minehead Currency before discounts', () => {
    expect([...new Set(upgrades.map((node) => JSON.stringify([costsAt(node, 1)[0].currency, costsAt(node, 1)[0].note ?? null])))]).toEqual([
      JSON.stringify(['Minehead Currency', null])
    ]);
  });

  it('gate each upgrade on a Research level', () => {
    expect(byName('Base_Damage_I').fields).toEqual([{ label: 'Research level needed', value: 1 }]);
    expect(['Numbahs', 'Extra_Lives', 'Boom_Blocker', 'Triple_Crown_Hunter', 'Jackpot_Time', "El'_Cheapo_Upgrado"]
      .map((name) => fieldOf(byName(name), 'Research level needed'))).toEqual([4, 21, 34, 48, 79, 89]);
  });
});

// Oracle: the opponent panel N.js:121550 and 121569, _customEvent_MineheadStuff's `m` branch N.js:122849, Minehead.js:17-23
// (MaxHP_Opp) and 160, cross-checked by minehead.ts:56-60 (names) and 131-136 (HP). A_MineHP is 1.01.
describe('minehead opponents', () => {
  const opponents = ofKind('mineheadopponent');
  const byName = (name) => opponents.find((node) => node.name === name);

  it('skip the slots with no bonus yet', () => {
    expect(report.mineheadopponent.skipped).toEqual(data.research[19]
      .map((bonus, index) => ({ bonus, index }))
      .filter(({ bonus }) => /^Nothing/.test(bonus))
      .map(({ index }) => ({ index, reason: 'placeholder: no bonus yet' })));
  });

  it.each([
    ['Bronzehead', '1.1x Total Damage and 1.1x Drop Rate! (NOTE:All Bonuses earned from beating Opponents affect the rest of the game)'],
    ['Gemhead', '+2% AFK gains for Research! This affects offline Research, you get 100% gains if you\'re online!'],
    ['Bleckhead', '+1% Damage per Weapon POW.'],
    ['Blindhead', '+1 more Trimmed Construction Slot'],
    ['Basshead', 'Multiplies Minehead Currency gain by 1.5x']
  ])('describe %s', (name, expected) => {
    expect(spaced(byName(name).description)).toBe(expected);
  });

  it('present the first opponent and draw it by its sprite', () => {
    expect(byName('Bronzehead').fields).toEqual([
      { label: 'Presented as', value: 'Your first opponent, the honorable Bronzehead' },
      { label: 'HP', value: 5, format: 'amount' }
    ]);
    expect(byName('Bronzehead').icon).toBe('/data/MineH20.png');
  });

  it('read the HP', () => {
    // Clownhead is 152,749 without A_MineHP.
    expect(['Gemhead', 'Basshead', 'Clownhead', 'Leopahead'].map((name) => formatAmount(fieldOf(byName(name), 'HP')))).toEqual(['14', '1,803', '154,277', '1.61e11']);
  });

  it('keep both Brainheads apart by how they are presented', () => {
    const brains = opponents.filter((node) => node.name === 'Brainhead');
    const brainSlots = data.research[10].filter((sprite, t) => data.research[11][Number(sprite)] === 'Brainhead' && !/^Nothing/.test(data.research[19][t]));
    expect(brains.length).toBeGreaterThan(1);
    expect(new Set(brains.map((node) => fieldOf(node, 'Presented as'))).size).toBe(brainSlots.length);
  });

  it('grant a fixed bonus with no level or price', () => {
    expect(opponents.filter((node) => node.effect || node.cost).map((node) => node.rawName)).toEqual([]);
  });
});

// Oracles: SushiStuff.js:6-12 (UpgLvREQ), 14-39 (UpgCost), 40-48 (CanWeBuyUpg), 96, 175, 220-247 (SlotEffect, FireplaceEffect)
// and the shop panel N.js:122212-122220. The parser's cost sits inside getSushiStation (sushiStation.ts:148-158), so the prices are pins.
describe('sushi station upgrades', () => {
  const upgrades = ofKind('sushiupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const shop = data.research[32].map(Number).filter((id) => data.sushiUpgrades[id]);
  const notForSale = shop.findIndex((id) => Number(data.sushiUpgrades[id][1]) === 0);

  it('list the upgrades in shop order, skipping the one with no levels to buy', () => {
    expect(report.sushiupgrade.skipped).toEqual([{ index: notForSale, reason: 'max level 0: not for sale' }]);
    expect([...upgrades].sort((a, b) => a.order - b.order).map((node) => Number(node.rawName.replace('SushiUpg', ''))))
      .toEqual(shop.filter((id, position) => position !== notForSale));
  });

  it.each([
    ['Hourly_Wage_Meter', [1, 2, 10], ['5', '5', '9']],
    ['Fuel_Capacity_I', [1, 2, 10], ['12', '12', '23']],
    ['Sushi_Slot', [1, 2, 10], ['102', '358', '8,079,834']],
    ['Hot_Slot', [1, 2], ['143,135', '2,862,697']],
    ['Fuel_Capacity_V', [1, 2], ['2.50e26', '2.87e26']],
    ['Customer_Surcharge_II', [20], ['249,098']]
  ])('price %s', (name, levels, expected) => {
    expect(levels.map((level) => costAt(name, level))).toEqual(expected);
  });

  it.each([
    ['Sushi_Slot', '6.55e28'],
    ['Superior_Sushi_Skillz', '3.60e21'],
    ['Hot_Slot', '7.90e29']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  // The last levels dominate a steep curve, so one level short of the cap is still most of the total.
  it('total Sushi Slot from a level the player is at', () => {
    const slot = nodes['sushiupgrade:SushiUpg0'];
    expect([costsToMax(slot), costsToMax(slot, 49)].map((costs) => formatAmount(costs[0].value))).toEqual(['6.55e28', '4.68e28']);
  });

  it('price in Bucks before discounts', () => {
    expect([...new Set(upgrades.map((node) => JSON.stringify([costsAt(node, 1)[0].currency, costsAt(node, 1)[0].note ?? null])))]).toEqual([
      JSON.stringify(['Bucks', null])
    ]);
  });

  it('gate each upgrade on a Research level and the one before it', () => {
    expect(byName('Hourly_Wage_Meter').fields).toEqual([{ label: 'Research level needed', value: 1 }]);
    expect(byName('Fuel_Capacity_I').fields).toEqual([
      { label: 'Research level needed', value: 15 },
      { label: 'Unlocked by', value: 'Sushi Service Bonuses at level 1', links: ['sushiupgrade:SushiUpg44'], linkAs: 'unlockedBy' }
    ]);
    expect(byName('Sushi_Slot').fields).toEqual([
      { label: 'Research level needed', value: 24 },
      { label: 'Unlocked by', value: 'Fastburn Fuel II at level 1', links: ['sushiupgrade:SushiUpg9'], linkAs: 'unlockedBy' }
    ]);
    expect(fieldOf(byName('Fuel_Capacity_V'), 'Research level needed')).toBe(67);
  });

  it.each([
    ['Superior_Sushi_Skillz', 1, 'up to Tier 2'],
    ['Hot_Slot', 1, 'generate 1.5x more Bucks!'],
    ['Wholesale_Pricing', 11, '9.91%'],
    ['2nd_Degree_Searing', 1, '+1.1 exp'],
    ['Sasaphrax_Saffron', 1, '2 hour\'s worth']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it.each([
    ['Fuel_Capacity_II', '+200 max Fuel Capacity, and a unique 1.01x Fuel Cap bonus!'],
    ['Fastburn_Fuel_I', '+15% faster Fuel generation!'],
    ['Potassium_Firelighter', 'Fireplaces can be changed to purple, which each give +1/sec'],
    ['Overtuned_Fuel', 'When you generate fuel while at max capacity, you get +1'],
    ['Heat_of_the_East_Wind', 'When a sushi is combined, it tiers-up the sushi to its right, but only if that sushi is lower tiered.']
  ])('describe %s without the account readouts', (name, expected) => {
    expect(textAt(name, 1)).toBe(expected);
  });
});

// Oracles: the bonus panel N.js:122228-122229 and SushiStuff.js:189-196 (KnowledgeBonusSpecific), 287-291 (RoG_BonusQTY, whose
// value getSushiBonus already pins, sushiStation.ts:448).
describe('sushi', () => {
  const sushi = ofKind('sushi');
  const byName = (name) => sushi.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  it('give every sushi a page and a Knowledge calculator', () => {
    expect(report.sushi.skipped).toEqual([]);
    expect(sushi.map((node) => node.name)).toEqual(data.research[30]);
    expect(sushi.filter((node) => !node.effect)).toEqual([]);
  });

  // The game reads a type missing from research[33] as type 0 (SushiStuff.js:189-196, N.js:122229; sushiStation.ts:112 agrees):
  // 20 x (1 + 59 / 30) at Knowledge level 1.
  it('give the tiers past the Knowledge list the first Knowledge bonus', () => {
    expect(sushi[data.research[33].length].name).toBe('Wasomber_Nigiri');
    expect(textAt('Wasomber_Nigiri', 1))
      .toBe('+10% chance for an additional Orblet stack to drop on Royal Guardians! Knowledge Bonus: +59% more Bucks generated');
  });

  it('describe the Service bonus and the Knowledge bonus', () => {
    expect(textAt('Fish_Eggs', 1)).toBe('2x multiplier to Research EXP gain. Knowledge Bonus: +20% more Bucks generated');
    expect(textAt('Eggroll', 1)).toContain('All Minehead upgrades are 30% cheaper');
    expect(textAt('Eggroll', 1)).toContain('+2% bonus Knowledge XP');
    // 20.67, rounded as CommaNotation does.
    expect(textAt('Eggroll', 10)).toContain('+21%');
    expect(textAt('Egg_Maki', 1)).toContain('+0.11% chance for +1 Tier');
    // 1.07, printed as NotateNumber "Small" prints it: tenths from 1.
    expect(textAt('Egg_Maki', 10)).toContain('+1.1% chance for +1 Tier');
    expect(byName('Hamachi_Sashimi').description.startsWith('1.3x_Burger.')).toBe(true);
    // The game writes "+0.{x" with 10.
    expect(byName('Chromatic_Nigiri').description).toContain('+0.10x_more_than_before');
  });

  it('give the tier', () => {
    expect(byName('Fish_Eggs').fields).toEqual([{ label: 'Tier', value: 1 }]);
  });
});

// Oracles: JellyOperation.js:50-81, 228-229 (research level, cost, RoG_BonusQTY, Lower Cholesterol), the shop panel
// N.js:72886-72888 and 122499-122503, cross-checked by getJellyUpgrades (jellyOperator.ts:190-245).
describe('jelly operator upgrades', () => {
  const upgrades = ofKind('jellyupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const shop = data.research[44].map(Number).filter((id) => data.jellyUpgrades[id]);
  const notForSale = shop.findIndex((id) => Number(data.jellyUpgrades[id][1]) === 0);

  it('list the upgrades in shop order, skipping the one with no levels to buy', () => {
    expect(report.jellyupgrade.skipped).toEqual([{ index: notForSale, reason: 'max level 0: not for sale' }]);
    expect(data.jellyUpgrades[shop[notForSale]][0]).toBe('Rift_Guy\'s_Upgrade');
    expect([...upgrades].sort((a, b) => a.order - b.order).map((node) => Number(node.rawName.replace('JellyUpg', ''))))
      .toEqual(shop.filter((id, position) => position !== notForSale));
  });

  it.each([
    ['Bloodcell_Coagulation', [1, 2, 10], ['13', '15', '32']],
    ['Another_Unlock', [1, 2, 10], ['2,106', '24,219', '7.41e12']],
    ['Cell_Mutilation', [1, 2], ['123,616', '4,944,628']],
    ['Stronkroid', [1, 2], ['5.98e9', '7.78e9']],
    ['Daily_Transfusion', [1, 2, 10], ['2,508', '6,269', '9,566,178']],
    ['Bloodletting_I', [20], ['9,235']]
  ])('price %s', (name, levels, expected) => {
    expect(levels.map((level) => costAt(name, level))).toEqual(expected);
  });

  it.each([
    ['Amoeba_Cell_Cultivation', 1, '0'],
    ['Plasmid_Cell_Cultivation', 1, '85'],
    ['Another_Unlock', 25, '6.60e28'],
    ['Cell_Mutilation', 20, '3.49e35'],
    ['Stronkroid', 150, '2.46e27'],
    ['Daily_Transfusion', 20, '1.52e11']
  ])('cap %s at %i and total its cost at %s', (name, cap, expected) => {
    expect(byName(name).effect.cap).toBe(cap);
    expect(costToMax(name)).toBe(expected);
  });

  it('price in Bloodcells before discounts', () => {
    expect([...new Set(upgrades.map((node) => JSON.stringify([costsAt(node, 1)[0].currency, costsAt(node, 1)[0].note ?? null])))]).toEqual([
      JSON.stringify(['Bloodcells', null])
    ]);
  });

  it('gate each upgrade on a Research level and the one before it', () => {
    expect(byName('Amoeba_Cell_Cultivation').fields).toEqual([{ label: 'Research level needed', value: 15 }]);
    expect(byName('Bloodcell_Coagulation').fields).toEqual([
      { label: 'Research level needed', value: 17 },
      { label: 'Unlocked by', value: 'Amoeba Cell Cultivation at level 1', links: ['jellyupgrade:JellyUpg0'], linkAs: 'unlockedBy' }
    ]);
    expect(fieldOf(byName('Stronkroid'), 'Research level needed')).toBe(60);
  });

  it.each([
    ['Cell_Mutilation', 1, '+2% DMG multi'],
    ['Stronkroid', 1, '1.51x faster'],
    ['Daily_Transfusion', 1, 'equal to 10%'],
    // 2.3.540 reworded it: "Currently, you can only place $ Virus Cells."
    ['Viral_Injection', 1, 'only place 2 Virus Cells'],
    ['Lower_Cholesterol', 11, '9.91%']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('describe the upgrades whose numbers are account readouts without them', () => {
    expect(textAt('Bloodcell_Coagulation', 1).startsWith('You now get Bloodcells every 1 DMG dealt!')).toBe(true);
    expect(textAt('Slot_Unlocking', 1)).toBe('You can now unlock more slots to place Cells in!');
    expect(textAt('Cell_Biology', 1).startsWith('Cells now gain EXP every time they attack!')).toBe(true);
    expect(textAt('Cell_Metabolism', 1).endsWith('of all Cells!')).toBe(true);
  });
});

// Oracles: the bonus panel N.js:122505 and RoG_BonusQTY (JellyOperation.js:81).
describe('jelly obstructions', () => {
  const obstructions = ofKind('jellyobstruction');
  const byName = (name) => obstructions.find((node) => node.name === name);

  it('skip the operations with no bonus yet and give the rest a page', () => {
    const placeholders = data.research[46].map((text, t) => (/^Nothing/.test(text) ? t : null)).filter((t) => t !== null);
    expect(report.jellyobstruction.skipped).toEqual(placeholders.map((index) => ({ index, reason: 'placeholder: no bonus yet' })));
    expect(obstructions.length + placeholders.length).toBe(data.research[45].length);
  });

  it.each([
    ['Longbone', '1.5x multiplier to Research EXP gain. Also, +2 Jelly Operator slots!'],
    ['Gold_Bangle', '1.05x Drop Rate'],
    ['Mongo', 'All Summoning upgrades are 200% cheaper']
  ])('describe %s', (name, expected) => {
    expect(spaced(byName(name).description)).toBe(expected);
  });

  it('name the operation that earns each one, and carry no calculator', () => {
    expect(byName('Longbone').fields).toEqual([{ label: 'Operation', value: 1 }]);
    expect(obstructions.filter((node) => node.effect || node.cost).map((node) => node.rawName)).toEqual([]);
  });
});

// Oracles: Bubbastuff.js:47-90 (cost, bonus, happiness), 245-246, the panel N.js:119632, 119651, 120111, 120129, cross-checked by
// getBubbaUpgrades (bubba.ts:140-160).
describe('bubba upgrades', () => {
  const upgrades = ofKind('bubbaupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);

  it('give every upgrade a page and cap exactly the ones the panel prints a maximum for', () => {
    expect(report.bubbaupgrade.skipped).toEqual([]);
    expect(upgrades.length).toBe(data.bubbaUpgrades.length);
    expect(upgrades.filter((node) => node.effect.cap !== null).map((node) => spaced(node.name)))
      .toEqual(data.bubbaUpgrades.filter((entry) => entry.x4 !== 999).map((entry) => spaced(entry.name)));
  });

  // N.js:120129: buying Megaflesh zeroes every upgrade except these three.
  it('mark every upgrade that resets on Megaflesh', () => {
    expect(upgrades.filter((node) => !fieldOf(node, 'Megaflesh')).map((node) => spaced(node.name)))
      .toEqual(['Bubba Boon', 'Megaflesh', 'Fun Gifts']);
    expect(fieldAt('bubbaupgrade:BubbaUpg0', 'Megaflesh')).toEqual({
      label: 'Megaflesh',
      value: 'Resets to level 0 when you buy Megaflesh',
      links: ['bubbaupgrade:BubbaUpg8'],
      linkAs: 'resetBy'
    });
  });

  it.each([
    ['Bargain', [1, 2, 10], ['149', '192', '639']],
    ['Megaflesh', [2, 10], ['39,525,795', '2.36e24']],
    ['Great_Meat', [20], ['715,974,428']]
  ])('price %s', (name, levels, expected) => {
    expect(levels.map((level) => costAt(name, level))).toEqual(expected);
  });

  it.each([
    ['Fun_Gifts', 6, '1.49e23'],
    ['More_Sides', 9, '2.01e37']
  ])('cap %s at %i and total its cost at %s', (name, cap, expected) => {
    expect(byName(name).effect.cap).toBe(cap);
    expect(costToMax(name)).toBe(expected);
  });

  it('price in Meat Slices before discounts', () => {
    expect([...new Set(upgrades.map((node) => JSON.stringify([costsAt(node, 1)[0].currency, costsAt(node, 1)[0].note ?? null])))]).toEqual([
      JSON.stringify(['Meat Slices', null])
    ]);
  });

  it.each([
    // Bubba floors the discount (N.js:119651): 9.9% where the rounding rows read 9.91%.
    ['Bargain', 11, '9.9%'],
    ['Cost_Saver', 1, '1.96%'],
    ['Buyer_Grin', 1, '+1.01 Happiness'],
    ['Buyer_Grin', 100, '+1.67 Happiness']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it.each([
    ['More_Sides', 1, 'Increase the number of sides of each Dice by +1!'],
    ['Happi_Boi', 10, 'Unlocks the Happiness Meter, multiplying Meat Slice production! You can pat Bubba, giving +10 Happiness each time.']
  ])('describe %s at level %i without the account readouts', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  it('end the timer lines at the sentence before them', () => {
    expect(textAt('Dice_Roll', 1).endsWith('rerolls dice.')).toBe(true);
    expect(textAt('Smoker', 1).endsWith('how long you wait!')).toBe(true);
  });
});

// Oracles: MenagerieStuff Cost, UpgUnlocked, BoostQTY and SideJellyUnlocked (N.js:72950-72993) through the exported parser
// helpers of menagerie.ts, which read a save: a save holding only the claims, levels or rank under test stands in.
describe('luminous menagerie', () => {
  const lists = data.wikiTables.listIndexes;
  const saveWith = (row, index, value) => ({ menagerieSave: Object.assign([[], [], [], []], { [row]: Object.assign([], { [index]: value }) }) });
  const rankSave = (rank) => ({ menagerieSave: [[0, 0, rank]] });
  // The first rank at which entry t shows: the rank below it shows t entries or fewer.
  const firstRank = (type, t) => {
    let rank = 0;
    while (getMenagerieUpgUnlocked(rankSave(rank), type) <= t) rank++;
    return rank;
  };

  it('give every mission, unlock, boost and side jellyfish a page', () => {
    expect([
      report.menageriemission.count, report.menagerieunlock.count, report.menagerieboost.count, report.menageriejelly.count
    ]).toEqual([data.research[lists.menagerieMissions].length, data.research[56].length, data.research[lists.menagerieBoostValues].length,
      data.wikiTables.menagerieUnlockUses.jellyfish.length]);
  });

  it.each([[0, 0], [0, 3], [13, 2]])('ask mission %i for its requirement after %i claims', (index, claims) => {
    const requirement = getMenagerieCost(saveWith(1, index, claims), 0, index);
    expect(spaced(levelledText(nodes[`menageriemission:MenaMission${index}`], claims)))
      .toBe(spaced(data.research[lists.menagerieMissions][index].replace('{', formatAmount(requirement))));
  });

  // The two missions whose requirement is a power of ten: the panel prints 10^requirement.
  it.each([[20, 0], [24, 2]])('ask mission %i for ten to its requirement after %i claims', (index, claims) => {
    const requirement = getMenagerieCost(saveWith(1, index, claims), 0, index);
    expect(spaced(levelledText(nodes[`menageriemission:MenaMission${index}`], claims))).toContain(` 1.00e${requirement}`);
  });

  it('name each mission by its first requirement', () => {
    expect(nodes['menageriemission:MenaMission0'].name).toBe('Reach a Total Account LV of 4,000');
    expect(nodes['menageriemission:MenaMission0'].effect).toMatchObject({ levelLabel: 'Times claimed', from: 0, cap: null });
  });

  it('price every unlock and gate it on the rank that shows it', () => {
    expect(ofKind('menagerieunlock').map((node) => node.fields)).toEqual(ofKind('menagerieunlock').map((node, t) => [
      { label: 'Unlock cost', value: getMenagerieCost({}, 1, t), format: 'cost', currency: 'Lumi', currencyIcon: '/etc/Lumi.png' },
      { label: 'Menagerie Rank needed', value: firstRank(1, t) }
    ]));
  });

  it('cut the Omega Arcade Ball odds, an account readout, out of its unlock name', () => {
    expect(spaced(nodes['menagerieunlock:MenaUnlock6'].name)).toBe('Mobs drop Omega Arcade Balls');
  });

  it.each([[3, 1], [3, 5], [8, 3], [15, 2]])('price boost %i at level %i', (index, level) => {
    expect(costsAt(nodes[`menagerieboost:MenaBoost${index}`], level)[0].value)
      .toBeCloseTo(getMenagerieCost(saveWith(3, index, level - 1), 2, index), 6);
  });

  it('fill each boost at its level and gate it on the rank that shows it', () => {
    expect(spaced(levelledText(nodes['menagerieboost:MenaBoost1'], 4)))
      .toBe(`Each Menagerie Rank boosts Lumi/hr by +${getMenagerieBoost(saveWith(3, 1, 4), 1)}%`);
    expect(ofKind('menagerieboost').map((node) => fieldOf(node, 'Menagerie Rank needed')))
      .toEqual(ofKind('menagerieboost').map((node, t) => firstRank(2, t)));
  });

  it('link the doubler boosts to the shop upgrades their doublers fit on', () => {
    const linksOf = (index) => fieldAt(`menagerieboost:MenaBoost${index}`, 'Doublers fit on').links;
    expect([linksOf(8), linksOf(10), linksOf(12)]).toEqual([
      data.research[59].map((id) => `mineheadupgrade:MineheadUpg${id}`),
      data.research[60].map((id) => `sushiupgrade:SushiUpg${id}`),
      data.research[61].map((id) => `jellyupgrade:JellyUpg${id}`)
    ]);
    expect(ofKind('menagerieboost').filter((node) => fieldOf(node, 'Doublers fit on')).map((node) => node.rawName))
      .toEqual(['MenaBoost8', 'MenaBoost10', 'MenaBoost12']);
  });

  it('link each jellyfish to the unlock that brings it', () => {
    const unlocks = ofKind('menageriejelly').map((node) => fieldAt(`menageriejelly:${node.rawName}`, 'Unlocked by').links[0]);
    expect(unlocks.map((id, jelly) => isSideJellyUnlocked(saveWith(2, Number(id.replace('menagerieunlock:MenaUnlock', '')), 1), jelly)))
      .toEqual(unlocks.map(() => true));
    expect(spaced(nodes['menageriejelly:MenaJelly2'].name)).toBe('Blue Jellyfish');
    expect(nodes['menageriejelly:MenaJelly2'].description).toBe(PANEL_TEXT[1]);
  });
});

// Oracles: Thingies ClamBonuses, Clam_Cost, Clam_Mobs and Clam_BlackPearlValue (N.js:106819-106828) through clamWork.ts's
// exported getClamCost and getClamBonus at Worker Class 0.
describe('clam work upgrades', () => {
  const upgrades = ofKind('clamupgrade');
  const perPage = upgrades.length / 2;
  const textAt = (index, level) => spaced(levelledText(nodes[`clamupgrade:ClamWork${index}`], level));
  const levelsWith = (slot, level) => Object.assign(Array(perPage).fill(0), { [slot]: level });

  it('name both pages from the panel names', () => {
    expect(upgrades.map((node) => spaced(node.name).toUpperCase())).toEqual(data.gameTables.clamWorkBonusNames.map(spaced));
  });

  // Frugality (4) and Anti-Inflation (8) discount their own price, which the wiki's base cost leaves out.
  it.each([[0, 1], [0, 10], [1, 1], [1, 10], [7, 6]])('price page 1 slot %i at level %i before discounts', (slot, level) => {
    expect(costsAt(nodes[`clamupgrade:ClamWork${slot}`], level)[0].value).toBeCloseTo(getClamCost(levelsWith(slot, level - 1), slot, 0), 6);
  });

  it('price the Scurge page in points', () => {
    expect([...new Set(upgrades.slice(perPage).map((node) => JSON.stringify(costsAt(node, 1)[0])))]).toEqual([JSON.stringify({
      currency: 'Scurge Points', currencyOne: 'Scurge Point', value: 1, note: 'Each Scurge LV gives one point.'
    })]);
  });

  it.each([
    [1, 10, 'Increases the total number of clams on the map to 12'],
    [2, 10, `Pearls have a ${Math.floor(1e4 * (1 - 1 / (1 + getClamBonus(levelsWith(2, 10), 2) / 100))) / 100}% chance`],
    [5, 1, 'These are worth 100x more'],
    [6, 10, `by ${1 + getClamBonus(levelsWith(6, 10), 6) / 100}x`],
    [3, 1, 'Boosts pearl value based on your Multikill!'],
    [perPage, 10, 'Active clam kills give +11 Scurge EXP, with each'],
    [perPage + 2, 2, 'Reduce your DMG by 10,000x, and get 5x more'],
    [perPage + 6, 1, 'Start with 2.88% Scurge EXP'],
    [perPage + 7, 1, 'Get a 1.1x Scurge EXP multi for each real player in the map!']
  ])('fill upgrade %i at level %i', (index, level, expected) => {
    expect(textAt(index, level)).toContain(expected);
  });

  it('gate the Scurge page on its Scurge LV and the Menagerie unlock that adds it', () => {
    expect(fieldAt(`clamupgrade:ClamWork${perPage + 3}`, 'Scurge LV needed').value).toBe(data.gameTables.scurgeUpgradeLevelReq[3]);
    expect(fieldAt(`clamupgrade:ClamWork${perPage}`, 'Unlocked by')).toEqual({
      label: 'Unlocked by', value: 'New Musselini Upgrades at The Clamworks', links: ['menagerieunlock:MenaUnlock4'], linkAs: 'unlockedBy'
    });
  });
});

// The buy check skips a max above 998 (N.js:107741, 72889, 107683) or of exactly 999 (Bubba, 120111), so these sell past it.
// The four shops whose stored max is the game's "no max" sentinel. Within them noMax goes with a null cap and with
// nothing else, and no other world 7 kind carries it.
describe('upgrades with no max level', () => {
  const UNCAPPED_KINDS = ['sushiupgrade', 'jellyupgrade', 'mineheadupgrade', 'bubbaupgrade'];

  it('flag exactly the uncapped upgrades of the four shops', () => {
    const effects = Object.entries(nodes).filter(([, node]) => node.effect);
    expect({
      kinds: [...new Set(effects.filter(([, node]) => node.effect.noMax).map(([, node]) => node.kind))].sort(),
      strays: effects
        .filter(([, node]) => Boolean(node.effect.noMax) !== (node.effect.cap === null && UNCAPPED_KINDS.includes(node.kind)))
        .map(([id]) => id),
      pinned: ['sushiupgrade:SushiUpg1', 'jellyupgrade:JellyUpg23', 'mineheadupgrade:MineheadUpg0', 'bubbaupgrade:BubbaUpg0']
        .map((id) => [nodes[id].effect.cap, nodes[id].effect.noMax])
    }).toEqual({
      kinds: [...UNCAPPED_KINDS].sort(),
      strays: [],
      pinned: [[null, true], [null, true], [null, true], [null, true]]
    });
  });
});

// LevelledEffect names a currency in the singular when the amount reads 1 ("1 Research Point").
describe('singular currencies', () => {
  it('give the point, cluster and slice costs a singular', () => {
    expect(['researchsquare', 'legendtalent', 'zenithupgrade', 'bubbaupgrade'].map((kind) => {
      const { currency, currencyOne } = costsAt(ofKind(kind)[0], 1)[0];
      return [currency, currencyOne];
    })).toEqual([
      ['Research Points', 'Research Point'],
      ['Legend Talent Points', 'Legend Talent Point'],
      ['Zenith Clusters', 'Zenith Cluster'],
      ['Meat Slices', 'Meat Slice']
    ]);
  });
});
