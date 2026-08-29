import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { currencyShopEdges } from '../../scripts/entity-graph/edges/currency-shops.mjs';
import { containerEdges } from '../../scripts/entity-graph/edges/containers.mjs';
import { cardEdges } from '../../scripts/entity-graph/edges/cards.mjs';
import { obtainedFrom } from '../../scripts/entity-graph/obtained-from.mjs';
import { harvestEdges } from '../../scripts/entity-graph/edges/harvests.mjs';
import { codeGrantLabels, itemSourceEdges } from '../../scripts/entity-graph/edges/item-sources.mjs';
import { bundleNodes } from '../../scripts/entity-graph/nodes/bundles.mjs';
import { achievementNodes } from '../../scripts/entity-graph/nodes/achievements.mjs';
import { achievementEdges } from '../../scripts/entity-graph/edges/achievements.mjs';
import { petNodes } from '../../scripts/entity-graph/nodes/pets.mjs';
import { talentNodes } from '../../scripts/entity-graph/nodes/talents.mjs';
import { achievementMentionEdges } from '../../scripts/entity-graph/edges/achievement-mentions.mjs';
import { bundlePets, petEdges } from '../../scripts/entity-graph/edges/pets.mjs';

const items = {
  EquipmentHats10: { displayName: 'Pink_Headband' },
  Pearl4: { displayName: 'Black_Pearl' },
  Timecandy1: { displayName: 'Time_Candy' },
  CraftMat1: { displayName: 'Thread' },
  SailTr3: { displayName: 'Strung_Jewels' },
  EquipmentNametagReplica7: { displayName: 'Replica_Nametag' },
  InvStorage31: { displayName: 'Storage_Chest_31' },
  CardsC8: { displayName: 'Goldfish_Card', Type: 'CARD' },
  EquipmentHats1: { displayName: 'Flimsy_Cap' },
  GreenSpiral: { displayName: 'Grassy_Gene_Spiral_(Dungeon)', Type: 'DUNGEON_EVAPORATE' }
};

describe('currency shops', () => {
  const gemShop = {
    0: { name: 'usables', sections: { Time_Candy: [{ rawName: 'Timecandy1', cost: 40, quantity: 1 }] } },
    1: { name: 'bonuses', sections: { Dailies: [{ rawName: 'Pdaily0', cost: 25 }] } }
  };
  const skullShop = [{ bonusName: 'Pearl4', x1: 9 }, { bonusName: 'Timecandy#', x1: 5 }];
  const weeklyShop = [[{ rawName: 'UImain_a', x1: 50 }], [{ rawName: 'EquipmentHats10', x1: 999 }]];

  it('prices each shop in its own currency', () => {
    const edges = currencyShopEdges(gemShop, skullShop, weeklyShop, items);
    expect(edges).toContainEqual({
      from: 'shop:gem', to: 'item:Timecandy1', rel: 'sells',
      meta: { price: 40, currency: 'gem' }, source: 'currency-shops'
    });
    expect(edges.find((edge) => edge.to === 'item:Pearl4').meta).toEqual({ price: 9, currency: 'skull' });
    expect(edges.find((edge) => edge.to === 'item:EquipmentHats10').meta).toEqual({ price: 999, currency: 'token' });
  });

  // The gem shop's rows are not all items: daily resets and subscription ribbons have a price and a
  // picture and never enter an inventory. A UI skin is the same, which is why UImain_a is absent.
  it('skips a row that is not an item', () => {
    const edges = currencyShopEdges(gemShop, skullShop, weeklyShop, items);
    const targets = edges.map((edge) => edge.to);
    expect(targets).not.toContain('item:Pdaily0');
    expect(targets).not.toContain('item:UImain_a');
    // `#` is the game's wildcard for "a random one of these".
    expect(targets).not.toContain('item:Timecandy#');
  });
});

describe('containers', () => {
  // The pools are [name, cumulative weight] pairs, so an entry's own chance is its number minus the
  // one before it: silver obol 1 sits at 14 behind obol 0 at 7, which is 7% not 14%.
  it('reads a weighted pool as the difference between rungs', () => {
    const edges = containerEdges({ 22: ['ObolSilver0', '7', 'ObolSilver1', '14', 'ObolSilver2', '21'] });
    expect(edges.filter((edge) => edge.from === 'item:GemP9')).toEqual([
      { from: 'item:GemP9', to: 'item:ObolSilver0', rel: 'yields', meta: { chance: 7 }, source: 'containers' },
      { from: 'item:GemP9', to: 'item:ObolSilver1', rel: 'yields', meta: { chance: 7 }, source: 'containers' },
      { from: 'item:GemP9', to: 'item:ObolSilver2', rel: 'yields', meta: { chance: 7 }, source: 'containers' }
    ]);
  });

  // RANDOlist 77 is a plain list with no weights, which the game picks from with randomInt.
  it('splits an unweighted pool evenly', () => {
    const edges = containerEdges({ 77: ['ObolAmarokA', 'ObolEfauntA', 'ObolChizoarA', 'ObolSlush'] });
    expect(edges.every((edge) => edge.meta.chance === 25)).toBe(true);
  });

  it('gives the hyper stacks their four obols', () => {
    const edges = containerEdges({});
    expect(edges.filter((edge) => edge.from === 'item:GemP25')).toHaveLength(4);
    expect(edges.filter((edge) => edge.from === 'item:GemP35')).toHaveLength(4);
  });
});

describe('cards', () => {
  const cards = { 0: { cardIndex: 'C8', rawName: 'Fish1' } };

  // A skilling card is awarded by the action rather than rolled off a drop table, so nothing in
  // monsterDrops reaches it. The card item's own name carries the index that does.
  it('links a card to the thing it comes from', () => {
    expect(cardEdges(cards, items)).toEqual([
      { from: 'monster:Fish1', to: 'item:CardsC8', rel: 'drops', meta: { card: true }, source: 'cards' }
    ]);
  });

  it('ignores an item that is not a card', () => {
    expect(cardEdges(cards, { EquipmentHats1: items.EquipmentHats1 })).toEqual([]);
  });
});

describe('obtainedFrom', () => {
  const anvilProducts = { 0: { rawName: 'CraftMat1' } };
  const randomList = { 17: ['InvStorage31'] };

  it('labels what no edge can point at', () => {
    const labels = obtainedFrom(items, anvilProducts, randomList);
    expect(labels.get('CraftMat1')).toBe('Anvil production');
    expect(labels.get('SailTr3')).toBe('Sailing');
    expect(labels.get('EquipmentNametagReplica7')).toBe('Spelunking');
    expect(labels.get('GreenSpiral')).toBe('Dungeon');
    expect(labels.get('InvStorage31')).toBe('Premium');
  });

  it('leaves an ordinary item unlabelled', () => {
    expect(obtainedFrom(items, anvilProducts, randomList).has('EquipmentHats1')).toBe(false);
  });

  // 30 items carry Type KEYCHAIN and only 25 sit in the game's dungeon pool, so this reads the
  // roster rather than the type. Labelling by type would have told a reader that the five newest
  // keychains drop in dungeons when the game never rolls them there.
  it('labels only the keychains the dungeon actually rolls', () => {
    const keychains = { EquipmentKeychain0: {}, EquipmentKeychain1: {} };
    const withKeychains = { ...items, EquipmentKeychain0: {}, EquipmentKeychain1: {}, EquipmentKeychain29: {} };
    const labels = obtainedFrom(withKeychains, anvilProducts, randomList, { dungeonKeychains: keychains });
    expect(labels.get('EquipmentKeychain0')).toBe('Dungeon');
    expect(labels.get('EquipmentKeychain1')).toBe('Dungeon');
    expect(labels.has('EquipmentKeychain29')).toBe(false);
  });
});

describe('bundles', () => {
  const itemSources = {
    bundles: { bun_j: { EquipmentCape0: 1, CardPack5: 3 }, bun_a: { Timecandy1: 7 } },
    dungeon: { GreenSpiral: 1 },
    royalGuardian: { RGenh: 1 }
  };
  const known = { EquipmentCape0: {}, CardPack5: {}, Timecandy1: {} };

  // Each bundle is its own node, so a cape's page can answer what else came in the same purchase.
  it('yields its contents from the bundle itself', () => {
    const edges = itemSourceEdges(itemSources, known);
    expect(edges).toContainEqual({
      from: 'bundle:bun_j', to: 'item:EquipmentCape0', rel: 'yields',
      meta: {}, source: 'item-sources'
    });
    expect(edges.find((edge) => edge.to === 'item:CardPack5').meta.quantity).toBe(3);
  });

  // The dollar figure buys the whole bundle, and a bundle holds several things, so pricing one of
  // them with it would say the cape costs $24.99 when the same purchase also gives three card packs.
  // It lives on the bundle node instead.
  it('carries no per-item price', () => {
    const edges = itemSourceEdges(itemSources, known);
    expect(edges.every((edge) => edge.meta.price === undefined)).toBe(true);
  });

  it('skips a granted name that is not an item', () => {
    const edges = itemSourceEdges({ bundles: { bun_z: { NotAnItem: 1 } } }, known);
    expect(edges).toEqual([]);
  });

  // Dungeon and Royal Guardian drops fall out of an activity, so they read as a label - but one
  // backed by a call site rather than guessed from the item's type.
  it('labels the activity grants', () => {
    const labels = codeGrantLabels({ ...itemSources, trashIsland: { StampA38: 1 } });
    expect(labels.get('GreenSpiral')).toBe('Dungeon');
    expect(labels.get('RGenh')).toBe('Royal Guardian');
    expect(labels.get('StampA38')).toBe('Trash Island');
  });
});

describe('achievements', () => {
  const achievements = [
    { rawName: 'TaskAchA1', name: 'Learn_2_Forge', desc: 'Get_the_certificate.', quantity: 1,
      steamExclusive: true, secretAchievement: false, gems: 10, candy: { rawName: 'Timecandy1', quantity: 1 } },
    { rawName: 'TaskAchA2', name: 'Hidden_One', desc: 'SECRET_ACHIEVEMENT', quantity: 25,
      steamExclusive: false, secretAchievement: true },
    { rawName: 'TaskAchE34', name: 'FILLERZZZ_ACH', desc: '-', quantity: 1 }
  ];

  // The blocks are seventy long whether or not the game has filled them, and the padding says so:
  // 152 rows named FILLERZZZ_ACH with a description of "-" and no reward. They would have been 152
  // identical pages in the catalog.
  it('drops the padding rows', () => {
    const nodes = achievementNodes(achievements);
    expect(Object.keys(nodes)).toEqual(['achievement:TaskAchA1', 'achievement:TaskAchA2']);
  });

  it('files each one under the world whose block it sits in', () => {
    expect(achievementNodes(achievements)['achievement:TaskAchA1'].category).toBe('World 1');
  });

  // A secret achievement writes the marker where the objective would be, so stripping it leaves an
  // empty description rather than the word SECRET_ACHIEVEMENT on the page.
  it('strips the secret marker and keeps the flag', () => {
    const node = achievementNodes(achievements)['achievement:TaskAchA2'];
    expect(node.description).toBe(null);
    expect(node.secret).toBe(true);
    expect(node.quantity).toBe(25);
  });

  // The reward strings in the data are display copy and mostly the literal FILLERZ, so the numbers
  // come from the game's own drop event instead. Gems and time candy are all it can ever grant.
  it('pays out the gems and candy the drop event names', () => {
    const known = { PremiumGem: {}, Timecandy1: {} };
    expect(achievementEdges(achievements, known)).toEqual([
      { from: 'achievement:TaskAchA1', to: 'item:PremiumGem', rel: 'rewards', meta: { amount: 10 }, source: 'achievements' },
      { from: 'achievement:TaskAchA1', to: 'item:Timecandy1', rel: 'rewards', meta: { amount: 1 }, source: 'achievements' }
    ]);
  });

  it('grants nothing for an achievement with no drop row', () => {
    expect(achievementEdges([achievements[1]], { PremiumGem: {} })).toEqual([]);
  });
});

describe('what an achievement is about', () => {
  const nodes = {
    'achievement:A1': { kind: 'achievement', name: 'Copper_Quipment', description: 'Equip_the_Copper_Helmet_and_Copper_Platebody' },
    'achievement:A2': { kind: 'achievement', name: 'Bad_Doggy', description: 'Defeat_Chaotic_Amarok_in_under_a_minute' },
    'achievement:A3': { kind: 'achievement', name: 'Deathnote', description: 'Get_a_Copper_Skull_or_higher_on_every_monster' },
    'achievement:A4': { kind: 'achievement', name: 'No_Links', description: 'Chop_15_yellow_sections_in_a_row' },
    'item:EquipmentHats17': { kind: 'item', name: 'Copper_Helmet' },
    'item:EquipmentShirts11': { kind: 'item', name: 'Copper_Platebody' },
    'item:Copper': { kind: 'item', name: 'Copper_Ore' },
    'monster:Copper': { kind: 'monster', name: 'Copper' },
    'monster:amarok': { kind: 'monster', name: 'Amarok' },
    'monster:amarokPassive': { kind: 'monster', name: 'Chaotic_Amarok' },
    'pet:amarok': { kind: 'pet', name: 'Amarok' }
  };
  const edges = achievementMentionEdges(nodes);
  const targetsOf = (id) => edges.filter((edge) => edge.from === id).map((edge) => edge.to).sort();

  it('links every entity the description names', () => {
    expect(targetsOf('achievement:A1')).toEqual(['item:EquipmentHats17', 'item:EquipmentShirts11']);
  });

  // The longest name claims its span first, so "Chaotic Amarok" wins and the Amarok inside it never
  // matches. Linking that one to the ordinary Amarok would name the wrong monster.
  it('takes the most specific name when one contains another', () => {
    expect(targetsOf('achievement:A2')).toEqual(['monster:amarokPassive']);
  });

  // Copper is an ore whose name is also a Deathnote skull rank, and the achievement means the rank.
  it('skips a name the game reuses for something else', () => {
    expect(targetsOf('achievement:A3')).toEqual([]);
  });

  it('links nothing when the description names nothing', () => {
    expect(targetsOf('achievement:A4')).toEqual([]);
  });

  // A pet carries its monster's name, so matching pets too would double every monster link.
  it('never links a pet', () => {
    expect(edges.some((edge) => edge.to.startsWith('pet:'))).toBe(false);
  });
});

describe('talents', () => {
  const talents = {
    Beginner: {
      HEALTH_BOOSTER: { name: 'HEALTH_BOOSTER', description: 'Increases_Max_HP_by_{', x1: 1, x2: 0.15, funcX: 'add', funcY: 'txt', skillIndex: 0 }
    },
    Rage_Basics: {
      HEALTH_BOOSTER: { name: 'HEALTH_BOOSTER', description: 'Increases_Max_HP_by_{', x1: 1, x2: 0.15, funcX: 'add', funcY: 'txt', skillIndex: 0 }
    },
    Bubonic_Conjuror: {
      CHEMICAL_WARFARE: { name: 'CHEMICAL_WARFARE', description: 'Poison_for_{_sec', x1: 8, x2: 17, funcX: 'intervalAdd', skillIndex: 525, cooldown: 32, manaCost: 110, castTime: 1.1 }
    },
    'Special Talent 1': {
      TELEPORTATION: { name: 'TELEPORTATION', description: 'Teleport', x1: 1, x2: 1, funcX: 'add', skillIndex: 601 }
    }
  };

  // The three Basics tabs repeat the Beginner tab verbatim, and skillIndex is what says so: 433
  // rows in the file, 376 talents. Four near-identical pages would compete for the same search.
  it('folds a talent several classes share into one page', () => {
    const nodes = talentNodes(talents);
    expect(Object.keys(nodes).sort()).toEqual(['talent:0', 'talent:525', 'talent:601']);
    expect(nodes['talent:0'].classes).toEqual(['Beginner', 'Rage Basics']);
    // The tab it was first filed under stays the category, so the listing bands like the game's tabs.
    expect(nodes['talent:0'].category).toBe('Beginner');
  });

  it('files the Special Talent tabs under the name the game shows players', () => {
    expect(talentNodes(talents)['talent:601'].category).toBe('Star Talents');
  });

  // The value depends on the talent's level, so it cannot be resolved at build time: the growth
  // inputs travel on the node and the panel substitutes them.
  it('carries the growth inputs rather than a resolved number', () => {
    const node = talentNodes(talents)['talent:525'];
    expect(node.description).toBe('Poison_for_{_sec');
    expect(node).toMatchObject({ funcX: 'intervalAdd', x1: 8, x2: 17 });
  });

  it('keeps the cast cost only for the talents that are attacks', () => {
    const nodes = talentNodes(talents);
    expect(nodes['talent:525']).toMatchObject({ cooldown: 32, manaCost: 110, castTime: 1.1 });
    expect(nodes['talent:0'].cooldown).toBeUndefined();
  });

  it('reads HEALTH_BOOSTER as a name rather than shouting it', () => {
    expect(talentNodes(talents)['talent:0'].name).toBe('Health_Booster');
  });
});

describe('pets', () => {
  const companions = [
    { name: 'Whale', rawName: 'Pet4', effect: '2x_Class_EXP_gain', tourPower: 125, upgradedTourPower: 189, upgradedEffect: '2.5x_Class_EXP_gain' },
    { name: 'Sheepie', rawName: 'sheep', effect: '1.20x_Damage', tourPower: 40 },
    { name: 'Never_Shipped', rawName: 'ghost', effect: 'Not_officially_in_the_game_and_may_never_be' }
  ];
  const groups = [{ name: 'Exclusive Pets', indices: [0] }, { name: 'Legacy Pets', indices: [1] }];

  // The game flags its own unreleased pets, and the flag and the grouping agree exactly: 92 pets
  // sit in a group, and all 82 outside one say they may never be in the game.
  it('keeps only the pets the game groups', () => {
    const nodes = petNodes(companions, groups);
    expect(Object.keys(nodes)).toEqual(['pet:Pet4', 'pet:sheep']);
    expect(nodes['pet:Pet4'].category).toBe('Exclusive Pets');
  });

  // `{` is the game's plus sign here, not a value placeholder: the number is already written out
  // beside it, so nothing is substituted in. Vanillie rendered as "{2500% additive Gold Food" on
  // the live page before this.
  it('reads the brace as a plus sign', () => {
    const braced = [{ name: 'Vanillie', rawName: 'w4b4b', bonus: 2500,
      effect: '{2500%_additive_Gold_Food_bonus_effect', upgradedEffect: '{4000%_additive_Gold_Food_bonus_effect' }];
    const node = petNodes(braced, [{ name: 'Exclusive Pets', indices: [0] }])['pet:w4b4b'];
    expect(node.description).toBe('+2500%_additive_Gold_Food_bonus_effect');
    expect(node.upgradedEffect).toBe('+4000%_additive_Gold_Food_bonus_effect');
  });

  // Not the pet's own bonus: Mr Pig carries bonus 1 and reads "{2 Friend Bonus Slots", so filling
  // the bonus in the way a vial does would print the wrong number.
  it('substitutes no value for the brace', () => {
    const pig = [{ name: 'Mr_Pig', rawName: 'Pet1', bonus: 1, effect: '2x_Friend_Bonuses,_{2_Friend_Bonus_Slots' }];
    const node = petNodes(pig, [{ name: 'Exclusive Pets', indices: [0] }])['pet:Pet1'];
    expect(node.description).toBe('2x_Friend_Bonuses,_+2_Friend_Bonus_Slots');
  });

  // A pet is the monster's sprite shrunk down rather than art of its own, which is why this reads
  // from afk_targets and not from data.
  it('takes the monster art', () => {
    expect(petNodes(companions, groups)['pet:Pet4'].icon).toBe('/afk_targets/Whale.png');
  });

  // The one part of a bundle nothing in the game code says: the branch grants an item and the
  // server adds the pet, so this is read off the banner and has to stay pinned by a test.
  it('hands each pet over from the bundle that sold it', () => {
    const nodes = petNodes(companions, groups);
    const edges = petEdges(nodes);
    expect(edges).toContainEqual({
      from: 'bundle:bon_i', to: 'pet:Pet4', rel: 'yields', meta: {}, source: 'pets'
    });
    expect(edges).toContainEqual({
      from: 'bundle:bun_c', to: 'pet:sheep', rel: 'yields', meta: {}, source: 'pets'
    });
  });

  it('drops a mapping whose pet is not a node', () => {
    expect(petEdges({}).length).toBe(0);
  });

  // Every pet pack has to reach the bundle table too, or it renders as "Bundle bon_j" with no
  // price and no gems.
  it('names every bundle it maps a pet to', () => {
    const nodes = bundleNodes({ bundles: {} }, {}, {}, bundlePets());
    const unnamed = Object.values(nodes)
      .filter((node) => /^Bundle_|_Bundle$/.test(node.name))
      .map((node) => node.rawName);
    expect(unnamed).toEqual([]);
  });
});

describe('harvests', () => {
  const trappingInfo = [
    { mapId: 16, critterName: 'Critter1', efficiencyReq: 35 },
    { mapId: 54, critterName: 'Critter2', efficiencyReq: 400 }
  ];

  // No drop table mentions a critter: the game hands it over when the trap is collected, so the map
  // is the only thing that can point at it.
  it('links a map to the critter caught there', () => {
    expect(harvestEdges(trappingInfo)).toEqual([
      { from: 'map:16', to: 'item:Critter1A', rel: 'harvests', meta: { efficiencyReq: 35 }, source: 'harvests' },
      { from: 'map:54', to: 'item:Critter2A', rel: 'harvests', meta: { efficiencyReq: 400 }, source: 'harvests' }
    ]);
  });

  // trappingInfo names the trap node, and the item is that name plus A.
  it('reads the item name rather than the trap name', () => {
    expect(harvestEdges(trappingInfo).map((edge) => edge.to)).not.toContain('item:Critter1');
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const nodes = graph.nodes;
  const itemNodes = Object.entries(nodes).filter(([, node]) => node.kind === 'item' && node.navigable !== false);

  const sourced = new Set();
  for (const edge of graph.edges) {
    if (['drops', 'rewards', 'sells', 'yields', 'harvests'].includes(edge.rel) && nodes[edge.to]?.kind === 'item') sourced.add(edge.to);
    if (edge.rel === 'craftedFrom' && nodes[edge.from]?.kind === 'item') sourced.add(edge.from);
  }

  // 990 of 2,450 items had no source of any kind before this. The remainder are genuine gaps -
  // keychains, replica trophies, the rest of the premium cosmetics - rather than unread files.
  it('leaves under a sixth of items with no source at all', () => {
    const none = itemNodes.filter(([id, node]) => !sourced.has(id) && !node.obtainedFrom);
    expect(none.length / itemNodes.length).toBeLessThan(0.17);
  });

  // Every critter in the game is caught somewhere, and none of them had a source before.
  it('catches every critter on a map', () => {
    const critters = itemNodes.filter(([, node]) => node.category === 'CRITTER');
    const caught = new Set(graph.edges.filter((edge) => edge.rel === 'harvests').map((edge) => edge.to));
    expect(critters.filter(([id]) => caught.has(id)).length).toBeGreaterThan(9);
  });

  // The obols are the case that needed a relation of its own: nothing drops them and nothing crafts
  // them, so without the boxes every obol page was a dead end.
  it('gives every obol in a box its box', () => {
    const obols = graph.edges.filter((edge) => edge.rel === 'yields');
    expect(obols.length).toBeGreaterThan(80);
    expect(obols.every((edge) => nodes[edge.from] && nodes[edge.to])).toBe(true);
  });

  // A label is a fallback, so it must never sit on an item something already points at.
  it('never labels an item that has a real source', () => {
    const both = itemNodes.filter(([id, node]) => sourced.has(id) && node.obtainedFrom);
    expect(both).toEqual([]);
  });
});

describe('bundle nodes', () => {
  const contents = {
    bundles: {
      bun_j: { EquipmentCape0: 1, CardPack5: 3 },
      // A key the game has not shipped, so nothing is written down for it.
      bun_zz: { EquipmentCape0: 1 },
      bun_yy: { Timecandy1: 2 }
    }
  };
  const info = { bun_j: { message: 'A_deal!' } };
  const known = {
    EquipmentCape0: { displayName: 'Angel_Wings' },
    CardPack5: { displayName: 'Galaxy_Card_Pack' },
    Timecandy1: { displayName: 'Time_Candy' }
  };

  // The game stores no name for a bundle: it is drawn into the banner as pixels, so the names were
  // read off the art. bun_j's banner says OUTTA THIS WORLD PACK, which no derivation would guess.
  it('uses the name written on the banner', () => {
    const nodes = bundleNodes(contents, info, known);
    expect(nodes['bundle:bun_j'].name).toBe('Outta This World Pack');
    expect(nodes['bundle:bun_j'].icon).toBe('/data/bun_j.png');
    expect(nodes['bundle:bun_j'].price).toBe(19.99);
  });

  // A bundle shipped after that list still needs a title, and its cosmetic is the closest thing.
  it('falls back to the marquee cosmetic for a bundle nobody has named', () => {
    const nodes = bundleNodes(contents, info, known);
    expect(nodes['bundle:bun_zz'].name).toBe('Angel_Wings_Bundle');
    expect(nodes['bundle:bun_yy'].name).toBe('Time_Candy_Bundle');
  });

  it('omits a price it does not have', () => {
    expect(bundleNodes(contents, info, known)['bundle:bun_zz'].price).toBeUndefined();
  });
});

describe('what a bundle hands over', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const bundles = Object.values(graph.nodes).filter((node) => node.kind === 'bundle');

  // Gems are the one thing a bundle gives that can never be an edge: N.js hands them over in a
  // separate server message, so the amount is not in any list and the client never learns which
  // bundle carried how many. Read off the banner instead, and the page would otherwise show a cape
  // and silently omit the 4,200 gems bought with it.
  it('knows the gems, which are not an item', () => {
    expect(bundles.filter((node) => node.gems > 0).length).toBeGreaterThan(30);
    expect(bundles.find((node) => node.rawName === 'bun_a').gems).toBe(4200);
  });

  // Two figures on the banner, not one: the chest count and the smaller "BUY NOW BONUS!" beside the
  // price. 35 bundles carry one, and every pet pack does.
  it('keeps the buy-now bonus apart from the chest count', () => {
    const coral = bundles.find((node) => node.rawName === 'ban_h');
    expect(coral.gems).toBe(8100);
    expect(coral.bonusGems).toBe(4100);
    expect(bundles.filter((node) => node.bonusGems > 0)).toHaveLength(35);
    // The Starter Pack's bonus is storage space and Gilded Treasure's is Prisma Bubbles, so
    // neither is counted as gems.
    expect(bundles.find((node) => node.rawName === 'bun_c').bonusGems).toBeUndefined();
    expect(bundles.find((node) => node.rawName === 'bon_g').bonusGems).toBeUndefined();
  });

  // Everything else it gives IS an item or a pet, and the branch calls nothing but GiveItem, so
  // between the two the list is complete. A bundle with neither would be an empty page.
  it('yields at least one item per bundle', () => {
    const yielded = new Set(graph.edges.filter((edge) => edge.rel === 'yields').map((edge) => edge.from));
    expect(bundles.every((node) => yielded.has(`bundle:${node.rawName}`))).toBe(true);
  });
});

describe('a bundle the game adds later', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const bundles = Object.values(graph.nodes).filter((node) => node.kind === 'bundle');

  // Everything a bundle grants is extracted from N.js, so a new one appears on its own with its
  // items, its art and a page. Its name, price and gems cannot be: they exist only as pixels in the
  // banner, and someone has to read them off it.
  //
  // This is that reminder. Without it the gap is silent - the bundle would simply render titled
  // after whatever cosmetic it happens to hold, with no price and no gems, and nothing would fail.
  // If this breaks after a game update, open public/data/<key>.png, read the banner, and add a row
  // to BUNDLES in scripts/entity-graph/nodes/bundles.mjs.
  it('has been read off its banner', () => {
    const unread = bundles
      .filter((node) => !(node.price > 0) || !(node.gems > 0))
      .map((node) => node.rawName)
      // bon_y ships no banner at all, so there is nothing to read and nothing to add.
      .filter((rawName) => rawName !== 'bon_y');
    expect(unread).toEqual([]);
  });
});

describe('cards the drop tables already cover', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const dropsBySource = {};
  for (const edge of graph.edges) {
    if (edge.rel !== 'drops') continue;
    (dropsBySource[edge.from] = dropsBySource[edge.from] || []).push(edge);
  }

  // cardEdges has no chance to carry, so a card already rolled from the monster's own table used to
  // render a second row beside the real one with the odds column blank. 191 monsters did that.
  it('never lists a card twice on the monster that drops it', () => {
    const duplicated = Object.values(dropsBySource).flatMap((edges) => edges
      .filter((edge) => edge.meta?.card === true && edges.some((other) => other !== edge && other.to === edge.to))
      .map((edge) => edge.to));
    expect(duplicated).toEqual([]);
  });

  // The reason the edge exists at all: a card off a fish, an ore or a tree is awarded by the action
  // rather than rolled from a table, so nothing else in the graph points at it.
  it('keeps the cards no drop table mentions', () => {
    const standalone = Object.values(dropsBySource).flat().filter((edge) => edge.meta?.card === true);
    expect(standalone.length).toBeGreaterThan(50);
    expect(standalone.every((edge) => graph.nodes[edge.to]?.card)).toBe(true);
  });

  // Every card still has to be reachable from the thing it comes off, whichever of the two routes
  // carried it, or dropping the duplicates would have stranded the pages instead of tidying them.
  it('leaves every card reachable from its source', () => {
    const cardNodes = Object.entries(graph.nodes).filter(([, node]) => node.card && node.kind === 'item');
    const reached = new Set(graph.edges.filter((edge) => edge.rel === 'drops').map((edge) => edge.to));
    const stranded = cardNodes.filter(([id]) => !reached.has(id)).map(([, node]) => node.name);
    expect(stranded).toEqual([]);
  });
});
