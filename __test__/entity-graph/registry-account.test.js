import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import account from '../../scripts/entity-graph/registry/account/index.mjs';
import { calculateGuildBonusCost, getGuildBonusBonus } from '../../parsers/guild';
import { costCurrency, costsAt, costsToMax, FORMULAS, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, account);
const report = registryReport(data, account);
const edges = registryEdges(data, account);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
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

  it('read the requirement and the hover note of three bonuses', () => {
    expect(byName('Guild Gifts').fields).toBeUndefined();
    expect(byName('Rucksack').fields).toEqual([{ label: 'Requires', value: 'Stat Runes level 4' }]);
    expect(byName('Bonus GP for small guilds').fields).toEqual([
      { label: 'Requires', value: 'Guild Gifts level 2' },
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
    expect(entryOf('TaskShop0_0').fields).toEqual([{ label: 'Order', value: 'One bag per purchase: B, C, E, F, H' }]);
    expect(spaced(entryOf('TaskShop0_5').description)).toBe('Unlocks recipe to craft Amarok Shoes, Pants, Torso, Helmet and Pendant.');
    expect(entryOf('TaskShop0_5').fields).toEqual([
      { label: 'Requires', value: 'Such Rock Very Dog Wow task at level 2 for the first recipe, one level more for each after' }
    ]);
    expect(spaced(entryOf('TaskShop4_5').description)).toBe('Unlocks recipe to craft Kattle Shoes, Pants, Torso, Helmet, Spear, Bow, Wand, Gloves and Scarf.');
  });
});
