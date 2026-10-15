import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import account from '../../scripts/entity-graph/registry/account/index.mjs';
import { calculateGuildBonusCost, getGuildBonusBonus } from '../../parsers/guild';
import { getDungeonFlurboStatBonus, getDungeonStatBonus } from '../../parsers/dungeons';
import { costCurrency, costsAt, costsToMax, FORMULAS, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, account);
const report = registryReport(data, account);
const edges = registryEdges(data, account);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
// The whole field, links included, of the page with this id.
const fieldAt = (id, label) => nodes[id].fields.find((field) => field.label === label);
const RAW = 1e-9;

// Oracles: N.js:85354 (buy check), 85395 (panel), 80504 (FormatBonuses), parsers/guild.ts.
describe('guild bonuses', () => {
  const bonuses = ofKind('guildbonus');
  const byName = (name) => bonuses.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);

  it('skip only the rows that cannot be levelled', () => {
    expect(report.guildbonus.skipped).toEqual(data.guildBonuses
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.maxLevel < 1)
      .map(({ index }) => ({ index, reason: 'placeholder: Nothing Yet, max level 0' })));
  });

  it('price every bonus to its cap as the parser does', () => {
    expect(bonuses.filter((node) => {
      const entry = data.guildBonuses[node.order];
      return costsToMax(node)[0].value !== calculateGuildBonusCost(node.effect.cap, entry.gpBaseCost, entry.gpIncrease);
    }).map((node) => node.rawName)).toEqual([]);
  });

  // The wiki rounds like FormatBonuses; the parser keeps the raw value, so the inner formula is the comparison.
  it('evaluate each bonus to the parser raw value, and the small-guild decay to 100 minus it', () => {
    const raw = (node, level) => getGuildBonusBonus([{ ...data.guildBonuses[node.order], level }], 0);
    const inner = (term, level) => FORMULAS[term.args.formula](level, term.args.args);
    const mismatches = bonuses.flatMap((node) => [1, 10, node.effect.cap].flatMap((level) => {
      const [first, second] = node.effect.terms;
      return [
        Math.abs(inner(first, level) - raw(node, level)) > RAW ? `${node.rawName}@${level} {` : null,
        second && Math.abs(inner(second, level) - (100 - raw(node, level))) > RAW ? `${node.rawName}@${level} }` : null
      ];
    }).filter(Boolean));
    expect(mismatches).toEqual([]);
  });

  it('link to no item', () => {
    expect(edges.filter((edge) => edge.from.startsWith('guildbonus:'))).toEqual([]);
  });

  it.each([
    ['Guild Gifts', 50, '+233% chance for an extra Guild Gift to be added to your Storage Chest every week.'],
    ['Bonus GP for small guilds', 10, '+67% GP earned if your guild has 20 members or less.'],
    ['Star Dazzle', 10, '+20 Star Talent Points'],
    ['Skilley Skillet', 1, '+0.25% Skill EXP for all skills'],
    ['Coin Supercharger', 100, "+16.7% Cash for each world you've reached"]
  ])('fill %s at level %i as %s', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  it('price Skilley Skillet by level and to its cap', () => {
    expect([1, 2, 10].map((level) => costAt('Skilley Skillet', level))).toEqual(['40', '190', '1,390']);
    expect(formatAmount(costsToMax(byName('Skilley Skillet'))[0].value)).toBe('2,993,000');
  });

  it('pay every bonus in guild points with no discount', () => {
    expect([...new Set(bonuses.map((node) => `${costsAt(node, 1)[0].currency}: ${costsAt(node, 1)[0].note}`))]).toEqual(['GP: No discounts apply.']);
  });

  it('read the unlock and the hover note of three bonuses', () => {
    expect(byName('Guild Gifts').fields).toBeUndefined();
    expect(byName('Rucksack').fields).toEqual([{ label: 'Unlocked by', value: 'Stat Runes at level 4', links: ['guildbonus:Gbonus1'], linkAs: 'unlockedBy' }]);
    expect(fieldAt('guildbonus:Gbonus1', 'Unlocked by')).toEqual({ label: 'Unlocked by', value: 'Guild Gifts at level 2', links: ['guildbonus:Gbonus0'], linkAs: 'unlockedBy' });
    expect(byName('Bonus GP for small guilds').fields).toEqual([
      { label: 'Unlocked by', value: 'Guild Gifts at level 2', links: ['guildbonus:Gbonus0'], linkAs: 'unlockedBy' },
      { label: 'Note', value: 'Upgrading this DECREASES the bonus % GP, but raises the Cap.' }
    ]);
  });
});

// Oracles: N.js:84627 (buy check), 84663 (panel), 85614 (art). The cost, bonus and slot tables have no parser function.
describe('merit shops', () => {
  const shops = ofKind('meritshop');
  const entryOf = (key) => shops.flatMap((shop) => shop.entries).find((entry) => entry.key === key);
  const textAt = (key, level) => spaced(levelledText(entryOf(key), level));
  const placeholders = data.merits.flatMap((shop, w) => shop
    .map((merit, i) => ({ w, i, merit }))
    .filter(({ merit }) => merit.descLine1 === 'IDK_YET' || merit.meritCost === null));

  it('make one page per world and skip none', () => {
    expect(shops.map((shop) => shop.rawName)).toEqual(data.merits.map((shop, w) => `MeritShop${w}`));
    expect(report.meritshop.skipped).toEqual([]);
  });

  it('skip exactly the placeholder slots, each with the reason', () => {
    expect(report.meritshop.skippedEntries).toEqual(
      placeholders.map(({ w, i }) => ({ index: w, entry: i, reason: 'placeholder: IDK_YET or no cost' }))
    );
  });

  // The live game's GenINFO[19] (research section 2); a game reading, not a count of the data.
  it('list the merits the live game draws per world', () => {
    expect(shops.map((shop) => shop.entries.length)).toEqual([7, 8, 7, 7, 7, 6, 6]);
  });

  it('name the shops after their world', () => {
    expect([shops[0].name, shops[6].name].map(spaced)).toEqual(['Blunder Hills Merit Shop', 'Shimmerfin Deep Merit Shop']);
  });

  it.each([
    ['TaskShop0_3', 1, "Sets the Max Lv. to 5 For the 'Goblet of Hemoglobin' Talent. Helps survivability!"],
    ['TaskShop1_2', 3, '+2% AFK Gains for your first 3 characters in your family.'],
    ['TaskShop3_2', 2, '+2 egg capacity in the Nest. Those Mobs wont hatch themselves after all!'],
    ['TaskShop6_0', 15, "+225% Spelunking POW, but like, it's a multiplier!"],
    ['TaskShop2_4', 1, '+0.5% Printer Sample Size per purchase. Make the Federal Reserve jealous!'],
    ['TaskShop2_4', 10, '+0.5% Printer Sample Size per purchase. Make the Federal Reserve jealous!'],
    ['TaskShop5_3', 1, '+3% Jade Gain, permanently.'],
    // Its A|B|C|E|F|H options never apply: the title has no `}`.
    ['TaskShop3_0', 3, 'The first +3 kills each day are guaranteed to spawn a crystal monster']
  ])('fill %s at level %i as %s', (key, level, expected) => {
    expect(textAt(key, level)).toBe(expected);
  });

  it('price a merit per purchase and to its cap, in the world glyph', () => {
    const goblet = entryOf('TaskShop0_3');
    const respawn = entryOf('TaskShop0_1');
    expect([costsAt(goblet, 1)[0].value, costsToMax(goblet)[0].value]).toEqual([2, 20]);
    expect([costsAt(entryOf('TaskShop3_2'), 2)[0].value, costsToMax(entryOf('TaskShop3_2'))[0].value]).toEqual([6, 12]);
    expect(costCurrency(respawn.cost, costsAt(respawn, 1)[0].value)).toBe('Merit');
    expect(costCurrency(respawn.cost, costsToMax(respawn)[0].value)).toBe('Merits');
    expect(respawn.cost.currencyIcon).toBe('/etc/Merit_0.png');
    expect(respawn.cost.note).toBe('No discounts apply.');
  });

  it('list the bag letters, the recipe pieces and the task a recipe needs', () => {
    expect(spaced(entryOf('TaskShop0_0').description)).toBe('Inventory Bag B, C, E, F and H is applied to everyone, but only if your 1st character has it.');
    expect(entryOf('TaskShop0_0').fields).toEqual([{ label: 'Order', value: 'B, C, E, F, H, one bag per purchase' }]);
    expect(spaced(entryOf('TaskShop0_5').description)).toBe('Unlocks recipe to craft Amarok Shoes, Pants, Torso, Helmet and Pendant.');
    expect(entryOf('TaskShop0_5').fields).toEqual([
      { label: 'Requires', value: 'Such Rock Very Dog Wow task at level 2 for the first recipe, one level more for each after' }
    ]);
    expect(spaced(entryOf('TaskShop4_5').description)).toBe('Unlocks recipe to craft Kattle Shoes, Pants, Torso, Helmet, Spear, Bow, Wand, Gloves and Scarf.');
  });
});

// Oracles: N.js:87603 (RngUpgCost), 87626 (BonusCalcs), 94651-94652 (panel). The cost table has no parser function.
describe('dungeon RNG items', () => {
  const items = ofKind('dungeonitem');
  const byName = (name) => items.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const toMax = (name) => formatAmount(costsToMax(byName(name))[0].value);

  it('make one page per item and skip none', () => {
    expect(items.map((node) => node.rawName)).toEqual(data.dungeonCreditShop.map((entry, index) => `DungItems${index}`));
    expect(report.dungeonitem.skipped).toEqual([]);
  });

  it('read the Next Lv line exactly on the items whose description has no number', () => {
    const readsLine = (node) => {
      const line = spaced(data.dungeonCreditShop[node.order].levelText.replace(/^Next_Lv:_/, ''));
      return spaced(node.description).endsWith(line);
    };
    expect(items.filter(readsLine).map((node) => node.rawName)).toEqual(data.dungeonCreditShop
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !entry.desc.includes('{'))
      .map(({ index }) => `DungItems${index}`));
  });

  it.each([
    ['Helping Heart', 5, 'Increases your max HP by +4'],
    ['Muscle Memory', 1, 'Each skilling action you perform increases damage by +0.52% up to +50%'],
    ['Muscle Memory', 10, 'Each skilling action you perform increases damage by +0.7% up to +50%'],
    ['Liars Craps', 1, '+16% drop rate, -16% Max HP.'],
    ['Golden Dice', 1, 'Gives you a chance to get an additional Loot Dice based on how much Cash you have at the end. +15% extra dice chance based on Cash.'],
    ['Recycler', 30, 'Drops a new RNG item to pick up. 20% chance to drop an additional RNG item.'],
    ['Dead Book', 1, '+0.65% Dmg and Crit chance for each monster type you defeat, even before getting this.'],
    ['Prepaid Debit Card', 4, 'Auto purchases 4 of each equipment, free of charge. Also multiplies current cash by 1.9x'],
    ['Horn of the Foal', 1, '+15% Crit Chance, +615% Crit Dmg, and -60% max HP. Oh, and Non Crits deal no damage.']
  ])('fill %s at level %i as %s', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  it.each([
    ['Helping Heart', [10], ['259'], '829'],
    ['Recycler', [30], ['72,139'], '303,029'],
    ['Vampire Fangs', [1], ['15'], '1,192'],
    ['Dead Book', [1, 5], ['40', '336'], '781'],
    ['Angelite', [1], ['95'], '1,851'],
    ['Horn of the Foal', [1, 10], ['213', '11,042'], '35,514']
  ])('price %s at levels %j as %j and %s to its cap', (name, levels, expected, total) => {
    expect(levels.map((level) => costAt(name, level))).toEqual(expected);
    expect(toMax(name)).toBe(total);
  });

  it('pay every item in Dungeon Credits with no discount', () => {
    expect([...new Set(items.map((node) => `${costsAt(node, 1)[0].currency}: ${costsAt(node, 1)[0].note}`))]).toEqual(['Dungeon Credits: No discounts apply.']);
  });

  it('show the rarity, the value before upgrades and the per-copy note', () => {
    expect(byName('Helping Heart').fields).toEqual([
      { label: 'Rarity', value: 'Grey' },
      { label: 'Before upgrades', value: 'Increases your max HP by +3' },
      { label: 'Note', value: 'Each copy held during a run adds this bonus.' }
    ]);
  });

  // The game's colour words (Grey Grumblo's "Grey Rarity", Coin Flip's "Orange RNG item", N.js:136074; the traits, N.js:133255).
  it('name each rarity by its colour', () => {
    const firstOfEach = [...new Set(data.dungeonCreditShop.map((entry) => entry.rarity))]
      .map((rarity) => items[data.dungeonCreditShop.findIndex((entry) => entry.rarity === rarity)]);
    expect(firstOfEach.map((node) => fieldOf(node, 'Rarity'))).toEqual(['Grey', 'Green', 'Blue', 'Purple', 'Orange']);
  });
});

// Oracles: N.js:87588-87590 (PassiveStatCost, PassiveStatCost2), 94677-94680 (panel), parsers/dungeons.ts:65-75.
describe('dungeon passives', () => {
  const passives = ofKind('dungeonpassive');
  const byName = (name) => passives.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const isFlurbo = (node) => node.rawName.startsWith('DungFlurbo');

  it('make one page per passive, credit shop first, then the Flurbo shop', () => {
    expect(passives.map((node) => node.rawName)).toEqual([
      ...data.dungeonStats.map((entry, slot) => `DungPassive${slot}`),
      ...data.dungeonFlurboStats.map((entry, slot) => `DungFlurbo${slot}`)
    ]);
  });

  it('say where each passive applies and charge its own shop currency', () => {
    expect(passives.map((node) => [fieldOf(node, 'Applies'), costsAt(node, 1)[0].currency, costsAt(node, 1)[0].note])).toEqual([
      ...data.dungeonStats.map(() => ['In dungeon runs', 'Dungeon Credits', 'No discounts apply.']),
      ...data.dungeonFlurboStats.map(() => ['Outside dungeons', 'Dungeon Flurbos', 'No discounts apply.'])
    ]);
  });

  // The wiki rounds to tenths like the panel; the parser keeps the raw value, so the inner formula is the comparison.
  it('evaluate each passive to the parser raw value', () => {
    const raw = (node, level) => (isFlurbo(node)
      ? getDungeonFlurboStatBonus(data.dungeonFlurboStats.map((entry) => ({ ...entry, level })), node.name)
      : getDungeonStatBonus(data.dungeonStats.map((entry) => ({ ...entry, level })), node.name));
    const mismatches = passives.flatMap((node) => [1, 10, node.effect.cap].filter((level) => {
      const [term] = node.effect.terms;
      return Math.abs(FORMULAS[term.args.formula](level, term.args.args) - raw(node, level)) > RAW;
    }).map((level) => `${node.rawName}@${level}`));
    expect(mismatches).toEqual([]);
  });

  it.each([
    ['Base Damage', 10, 'Base Damage: +9.1'],
    ['Total Dmg', 1, 'Total Dmg: +2.5%'],
    ['Weapon Power', 50, 'Weapon Power: +19.2'],
    ['AFK Gains', 10, 'AFK Gains: +1.7%']
  ])('fill %s at level %i as %s', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  it('price a credit passive and a Flurbo passive by level and to the cap', () => {
    expect([2, 10].map((level) => costAt('Base Damage', level))).toEqual(['3', '20']);
    expect([byName('Base Damage').effect.cap, formatAmount(costsToMax(byName('Base Damage'))[0].value)]).toEqual([100, '56,055']);
    expect([2, 10, 50].map((level) => costAt('Weapon Power', level))).toEqual(['2', '23', '430']);
    expect([byName('Weapon Power').effect.cap, formatAmount(costsToMax(byName('Weapon Power'))[0].value)]).toEqual([50, '6,785']);
    expect(byName('Weapon Power').icon).toBe('/data/DungCredits2.png');
  });
});

// Oracles: N.js:87595 (TraitLvReq), 94862 (one trait per tier). The tier table has no parser function.
describe('dungeon trait tiers', () => {
  const tiers = ofKind('dungeontrait');
  const byName = (name) => tiers.find((node) => node.name === name);
  const traitCount = data.dungeonTraits.reduce((sum, tier) => sum + tier.bonuses.length, 0);

  it('make one page per tier and skip none', () => {
    expect(tiers.map((node) => node.rawName)).toEqual(data.dungeonTraits.map((tier, index) => `DungTraitTier${index}`));
    expect(report.dungeontrait.skipped).toEqual([]);
  });

  it('list every trait once, numbered across the tiers', () => {
    expect(report.dungeontrait.entries).toBe(traitCount);
    expect(tiers.flatMap((node) => node.entries.map((entry) => entry.key))).toEqual(Array.from({ length: traitCount }, (_, k) => `DungTrait${k}`));
  });

  it('show each tier with its first trait art', () => {
    expect(tiers.filter((node) => node.icon !== node.entries[0].icon).map((node) => node.rawName)).toEqual([]);
  });

  it('read the rank and the traits of a tier', () => {
    const credits = byName('Da Cred Traits');
    expect(credits.fields).toEqual([{ label: 'Unlocks at', value: 'Dungeon Rank 20' }]);
    expect(credits.entries.map((entry) => spaced(entry.description))).toEqual([
      'Dungeon Credits drop +30% more often from mobs and bosses',
      'Dungeon Flurbos, the pink ones, drop +30% more often from mobs and bosses'
    ]);
    expect(spaced(byName('Drop Drip Traits').entries[2].description)).toBe('Weapons drop instead of armor / jewelry 25% more often');
    const endothelium = byName('Endothelium Traits');
    expect([endothelium.entries.length, fieldOf(endothelium, 'Unlocks at')]).toEqual([4, 'Dungeon Rank 50']);
  });
});
