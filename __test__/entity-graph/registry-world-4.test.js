import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world4 from '../../scripts/entity-graph/registry/world-4/index.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world4);
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
