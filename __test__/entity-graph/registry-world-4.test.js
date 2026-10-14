import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world4 from '../../scripts/entity-graph/registry/world-4/index.mjs';
import { calcUpgradeBonus } from '../../parsers/world-4/breeding';
import { costsAt, costsToMax, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world4);
const edges = registryEdges(data, world4);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

describe('lab bonuses', () => {
  const bonuses = ofKind('labbonus');
  const byName = (name) => bonuses.find((node) => node.name === name);
  const spaced = (text) => String(text).replace(/_/g, ' ');
  const fieldOf = (name, label) => byName(name).fields?.find((field) => field.label === label)?.value;

  it('build one page per lab bonus', () => {
    expect(bonuses).toHaveLength(data.labBonuses.length);
  });

  // Oracles: the game text of each bonus, `@` as a sentence break and the player's own "Total Bonus" readout dropped.
  it.each([
    ['Animal_Farm', '+1% Total Damage for every different species you have bred within Mob Breeding. You just need to breed the Mob type one time for it to count!'],
    ['Fungi_Finger_Pocketer', '+2% extra cash from monsters for every 1 million Green Mushroom kills your account has, which can be viewed at Death Note.'],
    ['Unadulterated_Banking_Fury', "+2% Total Damage for each 'green stack' of resources in your bank. A 'green stack' is a stack in your Storage Chest with 10 million or more items, since the number turns Green after 10M!"],
    ['No_Bubble_Left_Behind', "Every 24 hours, your 3 lowest level Alchemy Bubbles gets +1 Lv. This only applies to bubbles Lv 5 or higher, so it's more like 'your lowest level bubble that is at least level 5'. ALSO, it only works on the first 15 bubbles of each colour! Doesn't trigger on days that you don't login."]
  ])('read %s as the game does', (name, sentence) => {
    expect(spaced(byName(name).description)).toBe(sentence);
  });

  it('leave no dash or readout tail on any sentence', () => {
    expect(bonuses.filter((node) => /(^|[\s_])-($|[\s_])|total.bonus/i.test(node.description))).toEqual([]);
  });

  // Oracle: N.js pushes NinjaInfo[25 + i] onto LabMainBonus once Jade Emporium upgrade 8 + i is bought.
  it.each([
    ['Artifact_Attraction', 'The Artifact Matrix (Jade Emporium)'],
    ['Slab_Sovereignty', 'The Slab Matrix (Jade Emporium)'],
    ['Spiritual_Growth', 'The Spirit Matrix (Jade Emporium)'],
    ['Depot_Studies_PhD', 'The Crop Matrix (Jade Emporium)']
  ])('name the Jade Emporium upgrade that unlocks %s', (name, value) => {
    expect(fieldOf(name, 'Unlocked by')).toBe(value);
  });

  it('leave the unlock off the bonuses every lab has', () => {
    expect(bonuses.filter((node) => node.order < 14 && fieldOf(node.name, 'Unlocked by'))).toEqual([]);
  });

  // Oracle: MainframeBonus.js adds the jewel's bonus to these connected bonuses (lab.ts LAB_BONUS_JEWEL_BOOSTS).
  it.each([
    ['Animal_Farm', 'Purple Navette'],
    ['No_Bubble_Left_Behind', 'Pyrite Rhinestone'],
    ['Spelunker_Obol', 'Pure Opal Navette'],
    ['Fungi_Finger_Pocketer', 'Emerald Rhombol'],
    ['Unadulterated_Banking_Fury', 'Black Diamond Ulthurite'],
    ['Slab_Sovereignty', 'Pure Opal Rhinestone'],
    ['Depot_Studies_PhD', 'Pure Opal Rhombol']
  ])('name the jewel that boosts %s', (name, jewel) => {
    expect(fieldOf(name, 'Boosted by jewel')).toBe(jewel);
  });

  it('boost only those seven', () => {
    expect(bonuses.filter((node) => fieldOf(node.name, 'Boosted by jewel')).map((node) => node.name)).toEqual([
      'Animal_Farm', 'No_Bubble_Left_Behind', 'Spelunker_Obol', 'Fungi_Finger_Pocketer', 'Unadulterated_Banking_Fury', 'Slab_Sovereignty', 'Depot_Studies_PhD'
    ]);
  });

  it('art each page by its index', () => {
    expect(bonuses.map((node) => node.icon)).toEqual(data.labBonuses.map((entry) => `/data/LabBonus${entry.index}.png`));
  });
});

describe('pet genes', () => {
  const genes = ofKind('gene');
  const byName = (name) => genes.find((node) => node.name === name);
  const spaced = (text) => String(text).replace(/_/g, ' ');
  const fieldOf = (name, label) => byName(name).fields?.find((field) => field.label === label)?.value;
  const isFiller = (entry) => entry.name === 'GeneName';
  const carriersOf = (index) => data.petStats.flat().filter((mob) => mob.gene.index === index).map((mob) => spaced(mob.monsterName));

  it('build one page per real gene and skip the filler rows', () => {
    expect(genes.map((node) => node.name)).toEqual(data.petGenes.filter((entry) => !isFiller(entry)).map((entry) => entry.name));
    expect(data.petGenes.some(isFiller)).toBe(true);
  });

  // Oracle: N.js PetGenes[0] with the Mob list from petStats.json.
  it('read Fighter as the game does', () => {
    const fighter = byName('Fighter');
    expect({ ...fighter, description: spaced(fighter.description) }).toEqual({
      kind: 'gene',
      rawName: 'Gene0',
      name: 'Fighter',
      icon: '/data/GeneReady0.png',
      iconFallbacks: ['/data/GeneReady0.png'],
      category: 'World 4',
      order: 0,
      registry: true,
      description: 'Throws a Rusty Sword, which deals 200% Damage.',
      fields: [
        { label: 'Type', value: 'Combat' },
        { label: 'Bonus', value: 'When in combat, all Mobs on team deal 1.20x Damage' },
        { label: 'Bred Mobs with it', value: ['Green Mushroom', 'Red Mushroom', 'Pincermin'] }
      ]
    });
  });

  // Oracle: N.js PetStuff counts type 0 in Trek_FightPower and type 1 in Trekking; types 2 and 3 are the Fence Yard rolls.
  it.each([
    ['Fighter', 'Combat'],
    ['Forager', 'Foraging'],
    ['Breeder', 'Fence Yard'],
    ['Shiny', 'Fence Yard']
  ])('file %s under %s', (name, type) => {
    expect(fieldOf(name, 'Type')).toBe(type);
  });

  it('list every Mob that carries each gene, and none for a gene nobody carries', () => {
    expect(genes.map((node) => fieldOf(node.name, 'Bred Mobs with it') ?? [])).toEqual(genes.map((node) => carriersOf(node.order)));
    expect(fieldOf('Breeder', 'Bred Mobs with it')).toBeUndefined();
  });

  it('break the game line break into a sentence and space the bonus', () => {
    expect(fieldOf('Borger', 'Bonus')).toBe(
      'When in combat, this Mob has +2000% hp. Big borger, big health. When foraging, this Mob contributes 10x more foraging speed if the territory above has at least one Forager type (the Green Leaf type) Mob.'
    );
  });

  it('leave no underscore or placeholder in a field', () => {
    expect(genes.flatMap((node) => node.fields).filter(({ value }) => [].concat(value).some((line) => /[_@]|undefined|null|NaN/.test(line)))).toEqual([]);
  });

  it('art each page by its table position', () => {
    expect(genes.map((node) => node.icon)).toEqual(data.petGenes.map((entry, index) => [entry, index]).filter(([entry]) => !isFiller(entry)).map(([, index]) => `/data/GeneReady${index}.png`));
  });
});

describe('breeding upgrades', () => {
  const upgrades = ofKind('petupgrade');
  const byName = (name) => upgrades.find((node) => node.name === name);
  const byOrder = (index) => upgrades.find((node) => node.order === index);
  const spaced = (text) => String(text).replace(/_/g, ' ');
  const fieldOf = (name, label) => byName(name).fields?.find((field) => field.label === label)?.value;
  const mealName = (entry) => spaced(data.cookingMenu[entry.foodIndex].name);
  // Oracle: BreedingUpgrades.jsx calcFoodCost / calcCellCost, which read the level the upgrade is at before the purchase.
  const foodCost = (entry, level) => entry.baseCost * (1 + level) * Math.pow(entry.costScale, level);
  const cellCost = (entry, level) => entry.baseMatCost * (1 + level) * Math.pow(entry.costMatScale, level);
  const realRows = data.petUpgrades.map((entry, index) => [entry, index]).filter(([, index]) => index > 0);
  // The page reads the prose, then the effect line the panel prints under it.
  const effectLine = (name, level, length) => levelledText(byName(name), level).slice(-length);
  const sumTo = (entry, price) => Array.from({ length: entry.maxLevel }, (_, level) => price(entry, level)).reduce((sum, value) => sum + value, 0);

  it('build one page per real upgrade and skip the empty selection panel', () => {
    expect(upgrades.map((node) => node.order)).toEqual(realRows.map(([, index]) => index));
    expect(data.petUpgrades[0].name).toBe('No_Upgrade_Selected');
  });

  // Oracles: the game text of each upgrade at a level (N.js fills the effect's token with floor(100 * PetUpgBONUS) / 100).
  it.each([
    ['Gene_Splicing', 5, '-20% Gene Boost Cost'],
    ['Rarity_of_the_Egg', 4, '2x Chance'],
    ['Pastpresent_Brood', 5, '1.75x Bigger Multi'],
    ['Overwhelmed_Golden_Egg', 20, '1.4x Multiplier every 100 Upg'],
    ['Shattershell_Iteration', 1, '12% Chance'],
    ['Shattershell_Iteration', 10, '60% Chance'],
    ['Paint_Bucket', 100, '+201% Base Shiny Chance']
  ])('read %s at level %i as the game does', (name, level, text) => {
    expect(effectLine(name, level, text.length)).toBe(text);
  });

  // Oracle: the exported parser calcUpgradeBonus, whose table the game hardcodes per index. Upgrade 5 is left out: the
  // parser also applies the achievement 221 multiplier, which is player data.
  it.each(realRows.filter(([, index]) => index !== 5).map(([entry, index]) => [spaced(entry.name.split(/_*\}/)[0]), entry, index]))('give %s the parser bonus at levels 1 and 7', (name, entry, index) => {
    const line = (level) => spaced(entry.boostEffect).replace('}', String(Math.round(100 * calcUpgradeBonus({ level }, index, {})) / 100));
    const shown = (level) => levelledText(byOrder(index), level).slice(-line(level).length);
    expect([1, 7].map(shown)).toEqual([1, 7].map(line));
  });

  it('read Rarity of the Egg without the achievement bonus', () => {
    expect(effectLine('Rarity_of_the_Egg', 1, '1.25x Chance'.length)).toBe('1.25x Chance');
  });

  it('leave Blooming Axe uncapped and name its base cap, which Mr. Minehead raises', () => {
    expect(byName('Blooming_Axe').effect.cap).toBeNull();
    expect(fieldOf('Blooming_Axe', 'Base max level')).toBe(`${data.petUpgrades[6].maxLevel} (raised by Mr. Minehead)`);
  });

  it('cap every other upgrade at its data max level', () => {
    expect(upgrades.filter((node) => node.order !== 6).map((node) => node.effect.cap)).toEqual(realRows.filter(([, index]) => index !== 6).map(([entry]) => entry.maxLevel));
  });

  it('charge a meal and Dead Cells at levels 1 and 10, from the cost expressions', () => {
    const costs = upgrades.map((node) => [1, 10].flatMap((level) => costsAt(node, level).map(({ currency, value }) => [currency, value])));
    expect(costs).toEqual(realRows.map(([entry]) => [
      [mealName(entry), foodCost(entry, 0)], ['Dead Cells', cellCost(entry, 0)],
      [mealName(entry), foodCost(entry, 9)], ['Dead Cells', cellCost(entry, 9)]
    ]));
  });

  // Oracle: PetUpgCostREAL at level 9 for Gene Splicing: 3 * 10 * 2.5^9 Turkey of Thank and 6 * 10 * 1.1^9 Dead Cells.
  it('price Gene Splicing level 10 at 114,441 Turkey of Thank and 141.48 Dead Cells', () => {
    const [meal, cells] = costsAt(byName('Gene_Splicing'), 10);
    expect([meal.currency, Math.round(meal.value), cells.currency, Math.round(cells.value * 100) / 100]).toEqual(['Turkey of Thank', 114441, 'Dead Cells', 141.48]);
  });

  it('print the no-discount note once, on the meal', () => {
    expect(costsAt(byName('Egg_Capacity'), 1).map(({ note }) => note)).toEqual(['No discounts apply.', undefined]);
  });

  it('total both costs to the cap', () => {
    const entry = data.petUpgrades[2];
    expect(costsToMax(byName('Egg_Capacity')).map(({ value }) => value)).toEqual([sumTo(entry, foodCost), sumTo(entry, cellCost)]);
  });

  it('list each upgrade under its meal', () => {
    expect(realRows.map(([, index]) => edges.find((edge) => edge.from === `petupgrade:PetUpgrade${index}`)?.to))
      .toEqual(realRows.map(([entry]) => `meal:CookingM${entry.foodIndex}`));
  });

  // Oracle: the grid greys upgrade t + 1 below Breeding level 5t + 5 * max(0, t - 6).
  it.each([
    ['Egg_Capacity', 5], ['Breedability_Mobs', 10], ['Fence_Extension', 15], ['Rarity_of_the_Egg', 20], ['Blooming_Axe', 25],
    ['Pastpresent_Brood', 30], ['Paint_Bucket', 40], ['Overwhelmed_Golden_Egg', 50], ['Failsafe_Restitution_Cloud', 60],
    ['Shattershell_Iteration', 70], ['Grand_Martial_of_Shinytown', 80]
  ])('require Breeding level for %s: %i', (name, level) => {
    expect(fieldOf(name, 'Breeding level needed')).toBe(level);
  });

  it('give the first upgrade no level requirement', () => {
    expect(byName('Gene_Splicing').fields ?? []).toEqual([]);
  });

  it('art each page by the offset index', () => {
    expect(upgrades.map((node) => node.icon)).toEqual(realRows.map(([, index]) => `/data/PetUpg${index - 1}.png`));
  });
});
