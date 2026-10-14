import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world7 from '../../scripts/entity-graph/registry/world-7/index.mjs';
import { costsAt, costsToMax, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world7);
const report = registryReport(data, world7);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;

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

  // N.js:118773 prints "Lv.x/max" only below 9999.
  it('cap exactly the upgrades the shop prints a maximum for', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null).map((node) => spaced(node.name))).toEqual(
      data.spelunkingUpgrades.filter((entry) => entry.x3 < 9999).map((entry) => spaced(entry.name))
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
      { label: 'Shown after unlocking', value: 'Learning the POW' }
    ]);
    // 9 x 428.69, rounded up as the shop rounds every cost below 1e5.
    expect(fieldOf(byName('The_Biggest_Haul'), 'Unlock cost')).toBe('3,859 Amber');
    // The 1e7 tier, then the 1e9 tier on top.
    expect(fieldOf(byName('Amber_Be_Here'), 'Unlock cost')).toBe('2.50e24 Amber');
    expect(fieldOf(byName('Amber_Supply_Swap'), 'Unlock cost')).toBe('3.86e38 Amber');
    expect(fieldOf(byName('A_Truly_Exalted_Find'), 'Odds')).toBe('Each fragment found makes the next 8x rarer');
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
    expect(byName('Sticky_Crowns').description.endsWith('goes_up_by_{%.')).toBe(true);
  });

  it('label a square as the game\'s grid does, rows counted up from the bottom', () => {
    expect(byName('Smart_Eye').fields).toEqual([{ label: 'Grid position', value: 'M11' }]);
    expect(fieldOf(byName("Day_'N'_Nite"), 'Grid position')).toBe('M4');
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
      { label: 'Found in', value: 'Valley Of The Beans' },
      { label: 'Research level needed', value: 1 },
      { label: 'Research EXP per Magnifier', value: '4' }
    ]);
    expect(byName('Barnacle_Brothers').fields).toEqual([
      { label: 'Found in', value: 'Barnacle Curb' },
      { label: 'Research level needed', value: 20 },
      { label: 'Research EXP per Magnifier', value: '78' }
    ]);
    expect(fieldOf(byName('Happy_Tree'), 'Research EXP per Magnifier')).toBe('10,039');
  });

  it('draw the art by table position', () => {
    expect(byName('Barnacle_Brothers').icon).toBe('/data/ResObj10.png');
  });
});

// Oracle: FarmingStuffs.js:53-59 (StickerBonus), ResearchStuff.js:409 (FarmingStickersUnlocked), art N.js:109964.
describe('farming stickers', () => {
  const stickers = ofKind('sticker');
  const byName = (name) => stickers.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  it('skip the joke stickers', () => {
    expect(report.sticker.skipped).toEqual(data.research[23]
      .map((name, index) => ({ name, index }))
      .filter(({ name }) => name === 'Nonexistent_Sticker')
      .map(({ index }) => ({ index, reason: 'placeholder: joke sticker' })));
  });

  it.each([
    ['Mega_Mongo_Sticker', 1, '1.1x'],
    ['Mega_Mongo_Sticker', 10, '2x'],
    ['UWU_Kawaii_Rice_Sticker', 1, '3.5x'],
    ['Laissez_Maize_Sticker', 10, '+50%']
  ])('fill %s at %i owned with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('draw the Sticker Depot art and name the square that unlocks them', () => {
    expect(byName('Mega_Mongo_Sticker').icon).toBe('/data/FarmStickerB0.png');
    expect([...new Set(stickers.map((node) => JSON.stringify(node.fields)))]).toEqual([
      JSON.stringify([{ label: 'Unlocked by', value: 'Sticker Depot research square' }])
    ]);
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

  it('show the grid position and the raised maximum', () => {
    expect(byName('Coral_Restoration').fields).toEqual([{ label: 'Grid position', value: 'Red 10' }]);
    expect(byName('Greatest_Drop_Party_Ever').fields).toEqual([
      { label: 'Grid position', value: 'Red 6' },
      { label: 'Base max level', value: '4, up to 7 with the Legendary Red Fever research square' }
    ]);
    expect(fieldOf(byName('The_Charms_got_Rizz'), 'Grid position')).toBe('Green 1');
    expect(fieldOf(byName('Super_Talent_Points'), 'Grid position')).toBe('Yellow 1');
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

  it('name the previous upgrade that unlocks each one', () => {
    expect(byName('True_Zen').fields ?? []).toEqual([]);
    expect(byName('Kruk_Bubbles').fields).toEqual([{ label: 'Unlocked by', value: 'True Zen at level 1' }]);
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
    expect(byName('Advice_on_Being_Tired').fields).toEqual([{ label: 'Account level needed', value: '4,300' }]);
    expect(fieldOf(byName('Advice_on_Settlement'), 'Account level needed')).toBe('7,000');
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
    ['Triple_Crown_Hunter', [1, 2, 10], ['174,966', '202,961', '665,390']]
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
      { label: 'HP', value: '5' }
    ]);
    expect(byName('Bronzehead').icon).toBe('/data/MineH20.png');
  });

  it('read the HP', () => {
    // Clownhead is 152,749 without A_MineHP.
    expect(['Gemhead', 'Basshead', 'Clownhead', 'Leopahead'].map((name) => fieldOf(byName(name), 'HP'))).toEqual(['14', '1,803', '154,277', '1.61e11']);
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
    ['Fuel_Capacity_V', [1, 2], ['2.50e26', '2.87e26']]
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

  it('price in Bucks before discounts', () => {
    expect([...new Set(upgrades.map((node) => JSON.stringify([costsAt(node, 1)[0].currency, costsAt(node, 1)[0].note ?? null])))]).toEqual([
      JSON.stringify(['Bucks', null])
    ]);
  });

  it('gate each upgrade on a Research level and the one before it', () => {
    expect(byName('Hourly_Wage_Meter').fields).toEqual([{ label: 'Research level needed', value: 1 }]);
    expect(byName('Fuel_Capacity_I').fields).toEqual([
      { label: 'Research level needed', value: 15 },
      { label: 'Unlocked by', value: 'Sushi Service Bonuses at level 1' }
    ]);
    expect(byName('Sushi_Slot').fields).toEqual([
      { label: 'Research level needed', value: 24 },
      { label: 'Unlocked by', value: 'Fastburn Fuel II at level 1' }
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
    ['Daily_Transfusion', [1, 2, 10], ['2,508', '6,269', '9,566,178']]
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
      { label: 'Unlocked by', value: 'Amoeba Cell Cultivation at level 1' }
    ]);
    expect(fieldOf(byName('Stronkroid'), 'Research level needed')).toBe(60);
  });

  it.each([
    ['Cell_Mutilation', 1, '+2% DMG multi'],
    ['Stronkroid', 1, '1.51x faster'],
    ['Daily_Transfusion', 1, 'equal to 10%'],
    ['Viral_Injection', 1, 'place up to 2'],
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
  });

  it.each([
    ['Bargain', [1, 2, 10], ['149', '192', '639']],
    ['Megaflesh', [2, 10], ['39,525,795', '2.36e24']]
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
