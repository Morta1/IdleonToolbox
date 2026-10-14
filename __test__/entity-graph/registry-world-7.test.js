import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
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

  it('describe the tunnel by its lore boss reward', () => {
    expect(byName('Pebble_Cove').description).toBe('World\'s_End_island_&_Omnipotent_Artifact_tier_unlocked_in_Sailing!');
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

  it('place a square by its row and column in the 20-wide grid', () => {
    expect(byName('Smart_Eye').fields).toEqual([{ label: 'Grid position', value: 'Row 2, column 12' }]);
    expect(fieldOf(byName("Day_'N'_Nite"), 'Grid position')).toBe('Row 9, column 12');
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
