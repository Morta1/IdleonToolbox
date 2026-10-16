import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world4 from '../../scripts/entity-graph/registry/world-4/index.mjs';
import { calcUpgradeBonus } from '../../parsers/world-4/breeding';
import { costsAt, costsToMax, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world4);
const edges = registryEdges(data, world4);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
// The whole field, links included, of the page with this id.
const fieldAt = (id, label) => nodes[id].fields.find((field) => field.label === label);

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

  it('link the Jade Emporium upgrade and the boosting jewel by index', () => {
    expect(fieldAt('labbonus:LabBonus14', 'Unlocked by')).toEqual({
      label: 'Unlocked by',
      value: 'The Artifact Matrix (Jade Emporium)',
      links: ['jade:NjJupg8'],
      linkAs: 'unlockedBy'
    });
    expect(fieldAt('labbonus:LabBonus0', 'Boosted by jewel')).toEqual({
      label: 'Boosted by jewel',
      value: 'Purple Navette',
      links: ['jewel:ConsoleJwl1'],
      linkAs: 'boostedBy'
    });
    expect(fieldAt('labbonus:LabBonus8', 'Boosted by jewel')).toEqual({
      label: 'Boosted by jewel',
      value: 'Pure Opal Navette',
      links: ['jewel:ConsoleJwl19'],
      linkAs: 'boostedBy'
    });
  });

  it('leave the unlock off the bonuses every lab has', () => {
    expect(bonuses.filter((node) => node.order < 14 && fieldOf(node.name, 'Unlocked by'))).toEqual([]);
  });

  // Oracle: MainframeBonus.js adds the jewel's bonus to these connected bonuses (lab.ts LAB_BONUS_JEWEL_BOOSTS).
  it('name the jewel that boosts each connected bonus, and no other bonus', () => {
    expect(bonuses.map((node) => [node.name, fieldOf(node.name, 'Boosted by jewel')]).filter(([, jewel]) => jewel)).toEqual([
      ['Animal_Farm', 'Purple Navette'],
      ['No_Bubble_Left_Behind', 'Pyrite Rhinestone'],
      ['Spelunker_Obol', 'Pure Opal Navette'],
      ['Fungi_Finger_Pocketer', 'Emerald Rhombol'],
      ['Unadulterated_Banking_Fury', 'Black Diamond Ulthurite'],
      ['Slab_Sovereignty', 'Pure Opal Rhinestone'],
      ['Depot_Studies_PhD', 'Pure Opal Rhombol']
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
  const carriersRaw = (index) => data.petStats.flat().filter((mob) => mob.gene.index === index).map((mob) => `monster:${mob.monsterRawName}`);

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
        {
          label: 'Mobs with this gene',
          value: ['Green Mushroom', 'Red Mushroom', 'Pincermin'],
          links: carriersRaw(0),
          linkAs: 'features'
        }
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
    expect(genes.map((node) => fieldOf(node.name, 'Mobs with this gene') ?? [])).toEqual(genes.map((node) => carriersOf(node.order)));
    expect(fieldOf('Breeder', 'Mobs with this gene')).toBeUndefined();
  });

  // Two mobs share the name Bunny across the pet and breeding tables, so the link is the raw name, never the text.
  it('link the carriers by raw name', () => {
    expect(fieldAt('gene:Gene14', 'Mobs with this gene').links).toEqual(['monster:Pet6', 'monster:w4a3', 'monster:w4b3']);
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
  it('give every upgrade the parser bonus at levels 1 and 7', () => {
    const rows = realRows.filter(([, index]) => index !== 5);
    const line = (entry, index, level) => spaced(entry.boostEffect).replace('}', String(Math.round(100 * calcUpgradeBonus({ level }, index, {})) / 100));
    const shown = (entry, index, level) => levelledText(byOrder(index), level).slice(-line(entry, index, level).length);
    expect(rows.map(([entry, index]) => [1, 7].map((level) => shown(entry, index, level))))
      .toEqual(rows.map(([entry, index]) => [1, 7].map((level) => line(entry, index, level))));
  });

  // The game multiplies Rarity of the Egg by min(2, 1 + 0.1 * status) for achievement 221, which is player data; the page
  // reads the base and names the achievement's 1.10x.
  it('read Rarity of the Egg without the achievement bonus, and name the achievement', () => {
    expect(effectLine('Rarity_of_the_Egg', 1, '1.25x Chance'.length)).toBe('1.25x Chance');
    expect(fieldOf('Rarity_of_the_Egg', `With the ${spaced(data.achievements[221].name)} achievement`)).toBe('x1.10');
    expect(data.achievements[221].rewards).toEqual(['Eggs_increase_in_rarity_1.10x_more_often']);
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

  // Equal notes are what lets the page print the line once, under the meal and Dead Cells together.
  it('give the meal and Dead Cells the same no-discount note on every upgrade', () => {
    expect(upgrades.map((node) => costsAt(node, 1).map(({ note }) => note))).toEqual(upgrades.map(() => ['No discounts apply.', 'No discounts apply.']));
  });

  it('total both costs to the cap', () => {
    const entry = data.petUpgrades[2];
    expect(costsToMax(byName('Egg_Capacity')).map(({ value }) => value)).toEqual([sumTo(entry, foodCost), sumTo(entry, cellCost)]);
  });

  it('list each upgrade under its meal', () => {
    expect(realRows.map(([, index]) => edges.find((edge) => edge.from === `petupgrade:PetUpgrade${index}`)?.to))
      .toEqual(realRows.map(([entry]) => `meal:CookingM${entry.foodIndex}`));
  });

  // Oracle: the levels the grid greys each upgrade below (5t + 5 * max(0, t - 6) for upgrade t + 1), read off the game; the first has none.
  it('require the Breeding level the grid shows, and none for the first upgrade', () => {
    expect(upgrades.map((node) => fieldOf(node.name, 'Breeding level needed'))).toEqual([undefined, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80]);
    expect(byName('Gene_Splicing').fields ?? []).toEqual([]);
  });

  it('art each page by the offset index', () => {
    expect(upgrades.map((node) => node.icon)).toEqual(realRows.map(([, index]) => `/data/PetUpg${index - 1}.png`));
  });
});

describe('rift levels', () => {
  const rifts = ofKind('rift');
  const byName = (name) => rifts.find((node) => node.name === name);
  const fieldOf = (name, label) => byName(name).fields?.find((field) => field.label === label)?.value;
  const isPlaceholder = (entry) => /^YOU_CANNOT_PROGRESS_FURTHER/.test(entry.task);
  const real = data.riftInfo.map((entry, index) => [entry, index]).filter(([entry]) => !isPlaceholder(entry));
  const spaced = (text) => String(text).replace(/_/g, ' ');

  it('build one page per real rift level, numbered as the game numbers them', () => {
    expect(rifts.map((node) => node.name)).toEqual(real.map(([, index]) => `Rift_${index + 1}`));
    expect(real.length).toBeLessThan(data.riftInfo.length);
  });

  it('report each placeholder row as skipped, with the reason', () => {
    const { skipped } = registryReport(data, world4).rift;
    expect(skipped).toEqual(data.riftInfo.map((entry, index) => [entry, index]).filter(([entry]) => isPlaceholder(entry))
      .map(([, index]) => ({ index, reason: 'placeholder: no rift here yet' })));
  });

  // Oracles: the game's task texts, with the live progress readout dropped and the capitals put back to a sentence.
  it.each([
    ['Rift_1', 'Defeat 500 monsters within 5 min.'],
    ['Rift_6', 'Get 1000 skull points. Better skulls are worth more.'],
    ['Rift_8', 'Get an orb score of 180 on your Divine Knight.'],
    ['Rift_10', 'Kill 200000 monsters while AFK.']
  ])('read %s as the game does', (name, text) => {
    expect(spaced(byName(name).description)).toBe(text);
  });

  // Oracle: RiftStuff("mobHP") (readable RiftStuff.js:7-16), r = Rift[0] = N - 1; Rift 1 is 5e6 and Rift 2 is 5e6 * 1.112.
  it.each([
    ['Rift_1', '5,000,000'],
    ['Rift_2', '5,560,000'],
    ['Rift_10', '14,782,637'],
    ['Rift_30', '5.93e9'],
    ['Rift_65', '7.11e15']
  ])('show %s monster HP as %s', (name, hp) => {
    expect({ value: typeof fieldOf(name, 'Monster HP'), text: formatAmount(fieldOf(name, 'Monster HP')) }).toEqual({ value: 'number', text: hp });
  });

  it('space the monster name and art each page by its icon', () => {
    expect(rifts.map((node) => [fieldOf(node.name, 'Monster'), node.icon])).toEqual(
      real.map(([entry]) => [spaced(entry.monsterName), `/data/${entry.icon}.png`])
    );
  });

  it('link the monster of a rift and the bonus it switches on', () => {
    expect(fieldAt('rift:Rift1', 'Monster')).toEqual({ label: 'Monster', value: 'Slime', links: ['monster:slimeG'], linkAs: 'features' });
    expect(fieldAt('rift:Rift6', 'Rift bonus active from here')).toEqual({
      label: 'Rift bonus active from here',
      value: 'Trap Box Vacuum',
      links: ['riftbonus:RiftBonus0'],
      linkAs: 'unlocks'
    });
  });

  it('name the rift bonus a level switches on, and leave the other levels without one', () => {
    expect(rifts.map((node) => fieldOf(node.name, 'Rift bonus active from here')))
      .toEqual(real.map(([entry]) => (entry.riftBonus ? spaced(entry.riftBonus) : undefined)));
    expect(real.filter(([entry]) => entry.riftBonus).length).toBeLessThan(real.length);
  });

  it('leave no underscore or placeholder in a sentence or field', () => {
    const text = rifts.flatMap((node) => [spaced(node.description), ...node.fields.map(({ value }) => String(value))]);
    expect(text.filter((line) => /[_@{}]|undefined|null|NaN/.test(line))).toEqual([]);
  });
});

describe('rift bonuses', () => {
  const bonuses = ofKind('riftbonus');
  const byName = (name) => bonuses.find((node) => node.name === name);
  const fieldOf = (name, label) => byName(name).fields?.find((field) => field.label === label)?.value;
  const spaced = (text) => String(text).replace(/_/g, ' ');
  const real = data.riftInfo.map((entry, index) => [entry, index]).filter(([entry]) => entry.riftBonus);

  it('build one page per bonus row, in table order', () => {
    expect(bonuses.map((node) => node.name)).toEqual(real.map(([entry]) => entry.riftBonus));
    expect(real.length).toBeLessThan(data.riftInfo.length);
  });

  // Oracle: RiftStuff("riftBonus", n) is on once Rift[0] >= 5 * (n + 1), which the game's locked statue labels "RIFT_" + (5 * (n + 1) + 1).
  it('unlock bonus n at the rift the locked statue names', () => {
    expect(bonuses.map((node) => fieldOf(node.name, 'Unlocked at'))).toEqual(bonuses.map((node, n) => `Rift ${5 * (n + 1) + 1}`));
  });

  it('link the rift that unlocks each bonus, through the rift key', () => {
    expect(fieldAt('riftbonus:RiftBonus0', 'Unlocked at')).toEqual({ label: 'Unlocked at', value: 'Rift 6', links: ['rift:Rift6'], linkAs: 'unlockedBy' });
    expect(bonuses.map((node) => fieldAt(`riftbonus:${node.rawName}`, 'Unlocked at').links)).toEqual(
      real.map(([, index]) => [`rift:Rift${index + 1}`])
    );
  });

  it.each([
    ['Trap_Box_Vacuum', 'Rift 6'],
    ['Infinite_Stars', 'Rift 11'],
    ['Ruby_Cards', 'Rift 46'],
    ['Killroy_Prime', 'Rift 51'],
    ['Cooking_Mastery', 'Rift 61']
  ])('unlock %s at %s', (name, rift) => {
    expect(fieldOf(name, 'Unlocked at')).toBe(rift);
  });

  // Oracles: the extractor's hand-kept texts. Trap Box Vacuum's is stale against the game and kept as the extractor has it.
  it.each([
    ['Trap_Box_Vacuum', 'The trapper drone in World 3 will automatically collect traps every 24 hours, and will deposit the critters into your Storage Chest if there is space. The EXP from the Traps goes to the one who placed the traps.'],
    ['Eclipse_Skulls', 'You can now get Eclipse Skulls in Deathnote, unlocked at 1,000,000,000 kills. Eclipse Skulls are worth 20 points, and you also get +5% Multiplicative Damage.'],
    ['Eldritch_Artifact', "You can now get Eldritch Artifacts from sailing, but only if you've found the Ancient form first."]
  ])('read %s as the extractor keeps it', (name, text) => {
    expect(spaced(byName(name).description)).toBe(text);
  });

  it('collapse the double line break in the Sneak Mastery text', () => {
    expect(spaced(byName('Sneak_Mastery').description)).toContain('a new Mastery Bonus tier! You can change which Mastery Difficulty');
  });

  // The three mastery bonuses have no sentence in the game's data: their panels are tables.
  it('leave exactly the mastery bonuses without a sentence', () => {
    expect(bonuses.filter((node) => !node.description).map((node) => node.name)).toEqual(['Skill_Mastery', 'Construct_Mastery', 'Cooking_Mastery']);
  });

  it('art each page by its own bonus icon', () => {
    expect(bonuses.map((node) => node.icon)).toEqual(real.map(([entry]) => `/etc/${entry.riftBonusIcon}.png`));
  });

  it('leave no underscore or placeholder in a sentence or field', () => {
    const text = bonuses.flatMap((node) => [spaced(node.description ?? ''), ...node.fields.map(({ value }) => String(value))]);
    expect(text.filter((line) => /[_@{}]|undefined|null|NaN/.test(line))).toEqual([]);
  });
});

describe('tome entries', () => {
  const entries = ofKind('tome');
  const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
  const byName = (name) => entries.find((node) => node.name === name);
  const position = (index) => data.ninjaExtraInfo[32].indexOf(String(index));

  // Oracle: TomePCT (readable Summoning.js:440-466), with getLOG as ln / 2.30259.
  const gamePct = ({ x1, x2 }, q) => {
    if (x2 === 0) return q < 0 ? 0 : ((1.7 * q) / (q + x1)) ** 0.7;
    if (x2 === 1) { const log = Math.log(q) / 2.30259; return (2.4 * log) / (2 * log + x1); }
    if (x2 === 2) return Math.min(1, q / x1);
    if (x2 === 3) return q > 5 * x1 ? 0 : ((1.2 * (6 * x1 - q)) / (7 * x1 - q)) ** 5;
    return ((2 * Math.min(x1, q)) / (Math.min(x1, q) + x1)) ** 0.7;
  };
  // Oracle: TomeLvReq (readable Summoning.js:414).
  const gameLevelReq = (t) => 40 * t + (5 * Math.max(0, t - 35) + (10 * Math.max(0, t - 60) + (10 * Math.max(0, t - 80) + 15 * Math.max(0, t - 100)))) + 350;
  // _event_Tome2 turns the bar silver at 40%, gold at 75% and blue at 99.9%.
  const BARS = [['Silver bar', 0.4], ['Gold bar', 0.75], ['Blue bar (full)', 0.999]];
  const barLines = (node) => fieldOf(node, 'Quantity for each bar colour');
  const quantityOf = (node, bar) => {
    const line = barLines(node).find((entry) => entry.startsWith(`${bar}: `));
    return line.slice(bar.length + 2);
  };
  // "1,889" and "40x" and "30 or less" are whole numbers; "1.34e62" is not.
  const numberOf = (text) => Number(text.replace(/,/g, '').replace(/x$| or less$/, ''));

  it('build one page per tome entry, named uniquely', () => {
    expect(entries).toHaveLength(data.tomeData.length);
    expect(entries.filter((node) => /_$|Tap_for/.test(node.name))).toEqual([]);
    expect(new Set(entries.map((node) => node.name)).size).toBe(entries.length);
  });

  it('trim the game padding from the names', () => {
    const padded = ['Total_Talent_Max_LV__(Tap_for_more_info)', 'Unique_Quests_Completed_', 'Fastest_Time_to_kill_Chaotic_Efaunt_(in_Seconds)'];
    const indexes = padded.map((name) => data.tomeData.findIndex((entry) => entry.name === name));
    expect(indexes.map((index) => entries[index].name)).toEqual(['Total_Talent_Max_LV', 'Unique_Quests_Completed', 'Fastest_Time_to_kill_Chaotic_Efaunt_(in_Seconds)']);
  });

  // Oracles: the research's curve inverses, checked against TomePCT.
  it.each([
    ['Stamp_Total_LV', { 'Account level needed': 550, 'Points at a full bar': 1000, 'Most points possible': 1450, 'Quantity for each bar colour': ['Silver bar: 1,889', 'Gold bar: 6,394', 'Blue bar (full): 14,237'] }],
    ['Total_Tasks_Completed', { 'Account level needed': 750, 'Points at a full bar': 470, 'Quantity for each bar colour': ['Silver bar: 188', 'Gold bar: 353', 'Blue bar (full): 470'] }],
    ['Average_kills_for_a_Crystal_Spawn', { 'Account level needed': 1470, 'Points at a full bar': 350, 'Most points possible': 403, 'Quantity for each bar colour': ['Silver bar: 112 or less', 'Gold bar: 69 or less', 'Blue bar (full): 30 or less'] }]
  ])('read %s as the game scores it', (name, fields) => {
    expect(Object.fromEntries(byName(name).fields.map(({ label, value }) => [label, value]))).toEqual(fields);
  });

  it('need the account level the game asks of the entry position', () => {
    expect(entries.map((node) => fieldOf(node, 'Account level needed'))).toEqual(data.tomeData.map((entry, index) => gameLevelReq(position(index))));
    expect(data.tomeData.every((entry, index) => position(index) >= 0)).toBe(true);
  });

  // The bar colour changes at the smallest quantity (or the largest, when lower is better) that scores the threshold under TomePCT.
  it('turn every bar at the quantity TomePCT crosses its threshold', () => {
    const violations = data.tomeData.flatMap((entry, index) => BARS.flatMap(([bar, target]) => {
      const text = quantityOf(entries[index], bar);
      const q = numberOf(text);
      const lowerIsBetter = entry.x2 === 3;
      // Past a billion the page prints three significant digits, so both sides of the check allow that rounding.
      const slack = q >= 1e9 ? q * 0.006 : 0;
      const direction = lowerIsBetter ? -1 : 1;
      const crosses = gamePct(entry, q + direction * slack) >= target && gamePct(entry, q - direction * Math.max(slack, 1)) < target;
      const suffixes = text.endsWith(' or less') === lowerIsBetter && text.endsWith('x') === (entry.x4 === 1);
      return crosses && suffixes ? [] : [`${entry.name} ${bar}`];
    }));
    expect(violations).toEqual([]);
  });

  // Oracle: the game's own text for row 106, with the font glyph in "LavaFlame2" gone.
  it('read row 106 without the font glyph', () => {
    expect(entries[106].description).toBe("To_get_+1_Stream_Watched,_you_need_to_tune_in_at_Twitch.tv/_LavaFlame2_and_keep_an_eye_out_for_when_I_enable_+1_TOME_mode!_It'll_happen_multiple_times_per_stream.");
  });

  it('show a sentence only where the game gives one, and finish it', () => {
    const wordless = data.tomeData.map((entry, index) => (index === 0 || entry.info === 'filler' ? null : entry.info));
    expect(entries.map((node) => node.description === null)).toEqual(wordless.map((info) => info === null));
    const sentences = entries.map((node) => node.description).filter(Boolean);
    expect(sentences.filter((text) => !/[.!?]$/.test(text))).toEqual([]);
  });

  it('leave no glyph, underscore or placeholder in a field, and no placeholder in a sentence', () => {
    const lines = entries.flatMap((node) => node.fields.flatMap(({ value }) => [].concat(value).map(String)));
    expect(lines.filter((line) => /[_@{}$#~`]|[^\x00-\x7F]|undefined|null|NaN|Infinity/.test(line))).toEqual([]);
    const sentences = entries.map((node) => node.description ?? '');
    expect(sentences.filter((text) => /[@{}$#~`]|[^\x00-\x7F]|undefined|null|NaN/.test(text))).toEqual([]);
  });

  it('art every page with the Tome menu icon', () => {
    expect(new Set(entries.map((node) => node.icon))).toEqual(new Set(['/etc/Tome_0.png']));
  });
});
