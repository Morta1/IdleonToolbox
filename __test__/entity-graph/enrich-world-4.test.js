import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { enrichWorld4 } from '../../scripts/entity-graph/enrich-world-4.mjs';
import { jewelNodes, mealNodes, spiceNodes } from '../../scripts/entity-graph/nodes/systems.mjs';
import { costAt, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';
import { getMealLevelCost } from '../../parsers/world-4/cooking';
import { enrichRun } from '../helpers/enrich-run.js';
import { websiteData } from '../helpers/wiki-data.js';

const data = websiteData();

// The enrichment only reads and extends these nodes, so a bare monster per raw name is enough.
const blank = () => {
  const nodes = {
    ...mealNodes(data.cookingMenu),
    ...spiceNodes(data.spiceNames),
    ...jewelNodes(data.jewels)
  };
  for (const rawName of Object.keys(data.monsters)) nodes[`monster:${rawName}`] = { kind: 'monster', rawName };
  return nodes;
};
const { before, nodes, changed, linkFailures } = enrichRun(blank, (fresh) => enrichWorld4(fresh, data));

describe('field links', () => {
  it('name a page that exists, is navigable and draws in its text', () => {
    expect(changed('').length).toBeGreaterThan(0);
    expect(linkFailures()).toEqual([]);
  });
});

describe('meals', () => {
  it('enrich exactly the meals on the menu', () => {
    const expected = data.cookingMenu.map((meal, index) => (meal?.name ? `meal:CookingM${index}` : null)).filter(Boolean);
    expect(changed('meal:')).toEqual(expected.sort());
  });

  it('turn a meal into a calculator page', () => {
    expect(nodes['meal:CookingM0']).toEqual({
      kind: 'meal',
      rawName: 'CookingM0',
      name: 'Turkey_of_Thank',
      icon: '/data/CookingM0.png',
      category: 'World 4',
      registry: true,
      description: '+{%_Total_Damage',
      effect: { levelLabel: 'Meal level', cap: null, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
      cost: { formula: 'mealCost', args: {}, currency: 'Turkey_of_Thank', label: 'Meals for this level', note: 'Before the Food Lust, achievement and companion discounts.' },
      fields: [
        {
          label: 'Base max level',
          value: '30 (raised by the Causticolumn artifact, two Jade Emporium upgrades, the Grimoire and a Spelunking lore boss)',
          links: ['artifact:Arti17'],
          linkAs: 'maxRaisedBy'
        },
        { label: 'Menu text', value: "Do I smell gratitude? Oh, no, that's colonialization..." }
      ]
    });
  });

  // Oracle: cooking.ts getMealLevelCost; the cost line reads the level before the purchase. The curve itself is pinned in formulas.test.js.
  it('print the cost of a meal level as the page shows it', () => {
    const node = nodes['meal:CookingM0'];
    expect(costAt(node, 10)).toBe(getMealLevelCost(9, undefined));
    expect(formatAmount(costAt(node, 10))).toBe('9,065');
  });

  it('read the bonus per level', () => {
    expect([10, 30].map((level) => levelledText(nodes['meal:CookingM0'], level))).toEqual(['+20% Total Damage', '+60% Total Damage']);
    expect(levelledText(nodes['meal:CookingM67'], 3)).toBe('+0.21% Spelunking EXP');
  });
});

describe('spices', () => {
  it('enrich exactly the spices that have a territory', () => {
    expect(changed('spice:')).toEqual(data.spiceNames.map((name, index) => `spice:CookingSpice${index}`).sort());
  });

  it('read a territory as its battle, enemies, attack and first-claim requirement', () => {
    expect(nodes['spice:CookingSpice0'].fields).toEqual([
      { label: 'Territory battle', value: 'The Grass Gang' },
      {
        label: 'Territory enemies',
        value: ['Green Mushroom (10 HP)', 'Frog (30 HP)', 'Bored Bean (50 HP)'],
        links: ['monster:mushG', 'monster:frogG', 'monster:beanG'],
        linkAs: 'features'
      },
      { label: 'Enemy attack', value: 1 },
      { label: 'Trekking progress for the first spice', value: 5 }
    ]);
  });

  // The battle skips the old Arena row, the requirement does not.
  it('show the battle of the row after the Arena but the requirement of its own row', () => {
    expect(nodes['spice:CookingSpice14'].fields).toEqual([
      { label: 'Territory battle', value: 'The Blue Jeans Group' },
      {
        label: 'Territory enemies',
        value: ['Demon Genie (5,000,000 HP)', 'Demon Genie (10,000,000 HP)', 'Demon Genie (15,000,000 HP)', 'Demon Genie (20,000,000 HP)'],
        links: ['monster:demonP'],
        linkAs: 'features'
      },
      { label: 'Enemy attack', value: 75000 },
      { label: 'Trekking progress for the first spice', value: 800000 }
    ]);
  });
});

describe('breeding mobs', () => {
  it('enrich exactly the mobs in the breeding table', () => {
    expect(changed('monster:')).toEqual(data.petStats.flat().map((mob) => `monster:${mob.monsterRawName}`).sort());
  });

  it('read a mob as its world, gene and shiny bonus', () => {
    expect(nodes['monster:mushG'].fields).toEqual([
      { label: 'Breeding', value: 'World 1 Mob' },
      { label: 'Gene', value: 'Fighter', links: ['gene:Gene0'], linkAs: 'featuredIn' },
      { label: 'Shiny bonus per shiny level (up to 20, 30 with the +10 Max Shiny LV in Breeding Menagerie unlock)', value: '+3% Faster Shiny Mob Lv Up Rate' }
    ]);
  });

  it('count the world from the table, not the mob', () => {
    expect(nodes['monster:Pet0'].fields[0]).toEqual({ label: 'Breeding', value: `World ${data.petStats.findIndex((world) => world.some((mob) => mob.monsterRawName === 'Pet0')) + 1} Mob` });
  });
});

// Each jewel waits on a Tesseract upgrade (N.js sets Lab[14][21..23] from ArcaneUpgBonus 28, 35 and 43).
describe('jewels', () => {
  it('enrich exactly the three the Tesseract unlocks', () => {
    expect(changed('jewel:')).toEqual(['jewel:ConsoleJwl21', 'jewel:ConsoleJwl22', 'jewel:ConsoleJwl23']);
  });

  it('name the Tesseract upgrade that unlocks jewel 21', () => {
    expect(nodes['jewel:ConsoleJwl21'].fields).toEqual([
      { label: 'Bonus', value: before['jewel:ConsoleJwl21'].fields[0].value },
      { label: 'Unlocked by', value: 'Jewel of Deadly Wrath (Tesseract)', links: ['tesseractupgrade:ArcaneUpg28'], linkAs: 'unlockedBy' }
    ]);
  });
});
