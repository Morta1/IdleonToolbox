import { describe, it, expect } from 'vitest';
import { itemNodes } from '../../scripts/entity-graph/nodes/items.mjs';
import { monsterNodes } from '../../scripts/entity-graph/nodes/monsters.mjs';
import { npcQuestNodes } from '../../scripts/entity-graph/nodes/npcs-quests.mjs';
import { npcNodes } from '../../scripts/entity-graph/nodes/npcs.mjs';
import { items, monsters, quests } from './fixture.mjs';

describe('node extractors', () => {
  it('builds item nodes keyed by item:rawName', () => {
    const nodes = itemNodes(items);
    expect(nodes['item:Copper']).toEqual({
      kind: 'item', rawName: 'Copper', name: 'Copper_Ore',
      icon: '/data/Copper.png', category: 'ORE', description: null, stats: null, card: null,
      sellPrice: null, stamp: null,
    });
    expect(Object.keys(nodes)).toHaveLength(10); // 9 fixture items + the synthesised Coin
  });

  it('builds monster nodes for all Types including skilling nodes', () => {
    const nodes = monsterNodes(monsters);
    expect(nodes['monster:mushG']).toEqual({
      kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom',
      icon: '/afk_targets/Green_Mushroom.png', category: 'Monster',
      stats: null, location: null,
    });
    expect(nodes['monster:Copper'].category).toBe('Ore');
  });

  // Seven monsters are literally named "Error" in the game data: tutorial spawners, cut content
  // and boss body parts. They are not entities and must not reach the browse list.
  // monster:Nothing is named "_", which reads as a blank row in the bestiary and would export a
  // page at /wiki/monster/nothing with an empty title. It has no edges either.
  it('leaves out the monster whose name is only underscores', () => {
    const nodes = monsterNodes({ Nothing: { Name: '_', Type: 'Monster' }, mushG: { Name: 'Green_Mushroom', Type: 'Monster' } }, {});
    expect(nodes['monster:Nothing']).toBeUndefined();
    expect(nodes['monster:mushG']).toBeDefined();
  });

  it('leaves out the monsters the game names Error', () => {
    const nodes = monsterNodes(monsters);
    expect(nodes['monster:behemoth']).toBeUndefined();
    expect(nodes['monster:mushG']).toBeDefined();
  });

  it('builds npc and quest nodes, skipping sprite metadata keys', () => {
    const nodes = npcQuestNodes(quests);
    expect(nodes['npc:TP_Pete']).toEqual({
      kind: 'npc', rawName: 'TP_Pete', name: 'TP_Pete', icon: null,
    });
    expect(nodes['quest:TP_Pete1']).toEqual({
      kind: 'quest', rawName: 'TP_Pete1', name: 'Retribution_Time', icon: null,
      description: 'Go defeat 10 rats in the sewers', difficulty: 2, consumed: null,
      objectives: [{ desc: 'Rats Defeated', value: 10 }],
    });
    expect(Object.keys(nodes)).toHaveLength(3); // 1 npc + 2 quests, no "sprite" node
  });

  // DialogueText is the NPC's line and the brief joined by @; 54 quests are pure chatter.
  it('gives a quest with no QUEST: brief no description rather than the npc chatter', () => {
    expect(npcQuestNodes(quests)['quest:TP_Pete2'].description).toBeNull();
  });

  // Scripticus writes MAIN_QUEST: and Sprout writes QUEST: with no @ before it, so the brief is
  // found by the marker rather than by the separator that usually precedes it.
  it.each([
    ['Here_is_your_first_quest!_@_MAIN_QUEST:Go_defeat_5_green_spores', 'Go defeat 5 green spores'],
    ["I'd_be_invincible!_QUEST:Collect_all_the_sticks", 'Collect all the sticks'],
    ['QUEST:_Defeat_them_with_no_clothes_on', 'Defeat them with no clothes on']
  ])('finds the brief in %s', (dialogueText, expected) => {
    const nodes = npcQuestNodes({ X: { 1: { QuestName: 'X1', Name: 'X', DialogueText: dialogueText } } });
    expect(nodes['quest:X1'].description).toBe(expected);
  });

  it("reads the number out of the one quest whose Difficulty is '4f'", () => {
    expect(npcQuestNodes(quests)['quest:TP_Pete2'].difficulty).toBe(4);
  });

  // The flag only means anything for a quest that asks for items in the first place.
  it('records consumed only for a quest that requires items', () => {
    const nodes = npcQuestNodes(quests);
    expect(nodes['quest:TP_Pete2'].consumed).toBe(true);
    expect(nodes['quest:TP_Pete1'].consumed).toBeNull();
  });

  it('builds an npc node per roster entry, quest-less ones included', () => {
    const nodes = npcNodes({
      TP_Pete: { sprite: 'sprite-84-7' },
      Grasslands_Gary: { sprite: 'sprite-84-13' },
    });
    expect(nodes['npc:Grasslands_Gary']).toEqual({
      kind: 'npc', rawName: 'Grasslands_Gary', name: 'Grasslands Gary',
      icon: '/npcs/Grasslands_Gary.gif',
    });
    expect(Object.keys(nodes)).toHaveLength(2);
  });
});

describe('item descriptions', () => {
  it('merges the non-Filler lines and fills the value slots from the item', () => {
    // `*` is the success chance and `#` the slot cost, both verified against the game's own
    // upgrade stones: Stone I reads 100%, Stone II 80%.
    const nodes = itemNodes({
      StoneW1: {
        displayName: 'Weapon_Upgrade_Stone_I', Type: 'UPGRADE', Amount: 100, Cooldown: 0, Trigger: 1,
        desc_line1: 'Drag_onto_any_Weapon_to_apply.', desc_line2: 'Success_Chance;_*%',
        desc_line3: 'Uses_up_#_slots', desc_line4: 'Filler'
      }
    });
    expect(nodes['item:StoneW1'].description)
      .toBe('Drag onto any Weapon to apply. Success Chance; 100% Uses up 1 slots');
  });

  it('fills [ from Amount and ] from Cooldown, matching ItemDisplay', () => {
    const nodes = itemNodes({
      Copper: {
        displayName: 'Copper_Ore', Type: 'ORE', Amount: 2, Cooldown: 15,
        desc_line1: 'Smelt_down_[_Ores_into_1_Bar', desc_line2: 'Smelting_takes_]_per_Bar.'
      }
    });
    expect(nodes['item:Copper'].description).toBe('Smelt down 2 Ores into 1 Bar Smelting takes 15 per Bar.');
  });

  it("drops a slot the item has no value for rather than printing a bare marker", () => {
    const nodes = itemNodes({
      Mystery: { displayName: 'Mystery', Type: 'UPGRADE', desc_line1: 'Restores_[_HP.' }
    });
    expect(nodes['item:Mystery'].description).toBe('Restores HP.');
  });

  // The config row is never read as prose; the bonus comes from its parsed form in stamps.json.
  // No number, because it scales with the stamp's level and a page with no save cannot know it.
  // idleon.wiki prints its Bonus the same way: "+ WIS", not a figure.
  it('describes a stamp by the bonus it gives, not its config row', () => {
    const stamps = { combat: { 0: { rawName: 'StampA24', displayName: 'Arcane_Stamp', effect: '+{_WIS' } } };
    const nodes = itemNodes({
      StampA24: { displayName: 'Arcane_Stamp', Type: 'STAMP', desc_line1: 'WIS,add,1,0,5,GoldBar,3,5,10,1.2,0,{}_WIS,3' }
    }, {}, {}, stamps);
    expect(nodes['item:StampA24'].description).toBe('+ WIS');
  });

  // The rest of idleon.wiki's Stamp Info box. Number is the stamp's position in its own tab.
  it('carries the stamp info the wiki shows beside the bonus', () => {
    const stamps = { combat: { 23: { rawName: 'StampA24', effect: '+{_WIS', itemReq: [{ rawName: 'GoldBar' }] } } };
    const nodes = itemNodes({
      StampA24: { displayName: 'Arcane_Stamp', Type: 'STAMP', sellPrice: 6000 }
    }, {}, {}, stamps);
    expect(nodes['item:StampA24'].stamp).toEqual({ number: 24, category: 'Combat Stamp', material: 'GoldBar' });
    // The game's own unit: 6000 is the 60 silver idleon.wiki prints.
    expect(nodes['item:StampA24'].sellPrice).toBe(6000);
  });

  // 935 of 2431 items sit at 1, which is the game's "no value" rather than a price worth printing.
  it('treats a sell price of 1 as no price', () => {
    const nodes = itemNodes({ X: { displayName: 'X', Type: 'ORE', sellPrice: 1 } });
    expect(nodes['item:X'].sellPrice).toBeNull();
  });

  it('leaves a stamp with no catalogue entry undescribed rather than printing its config row', () => {
    const nodes = itemNodes({
      StampA1: { displayName: 'Mason_Jar', Type: 'STAMP', desc_line1: 'BaseDmg,add,1,0,5,Grasslands1,3,5,10,1.2,0,{}_Base_Damage,3' }
    }, {}, {}, {});
    expect(nodes['item:StampA1'].description).toBeNull();
  });

  it('is null when every line is Filler', () => {
    const nodes = itemNodes({ X: { displayName: 'X', Type: 'RING', desc_line1: 'Filler' } });
    expect(nodes['item:X'].description).toBeNull();
  });
});

describe('item stats', () => {
  it('keeps only the stats an item actually has', () => {
    const nodes = itemNodes({
      EquipmentHats71: {
        displayName: 'Diabolical_Headcase', Type: 'HELMET', Class: 'ALL', lvReqToEquip: 135,
        Weapon_Power: 5, Speed: 0, Reach: 0, STR: 30, AGI: 30, WIS: 30, LUK: 30, Defence: 90,
        UQ1txt: '%_DEFENCE', UQ1val: 16, UQ2txt: 0, UQ2val: 0, Upgrade_Slots_Left: 8
      }
    });
    // Speed/Reach/UQ2 are zero and Class is 'ALL', which is the absence of a restriction.
    expect(nodes['item:EquipmentHats71'].stats).toEqual({
      lvReqToEquip: 135, Weapon_Power: 5, STR: 30, AGI: 30, WIS: 30, LUK: 30,
      Defence: 90, Upgrade_Slots_Left: 8, UQ1txt: '%_DEFENCE', UQ1val: 16
    });
  });

  it('keeps a real class restriction', () => {
    const nodes = itemNodes({ W: { displayName: 'W', Type: 'BOW', Class: 'Archer', Weapon_Power: 12 } });
    expect(nodes['item:W'].stats).toEqual({ Class: 'Archer', Weapon_Power: 12 });
  });

  it('is null for an item with no stats at all', () => {
    const nodes = itemNodes({ Copper: { displayName: 'Copper_Ore', Type: 'ORE' } });
    expect(nodes['item:Copper'].stats).toBeNull();
  });
});

describe('card items', () => {
  const monsters = { frogBIG: { Name: 'Gigafrog' } };

  it('names a monster card after the monster its desc_line1 points at', () => {
    const nodes = itemNodes({
      CardsA9: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'frogBIG' }
    }, monsters);
    expect(nodes['item:CardsA9'].name).toBe('Gigafrog_Card');
  });

  it('falls back to an item source for the crafting-bar cards', () => {
    const nodes = itemNodes({
      CardsC13: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'CopperBar' },
      CopperBar: { displayName: 'Copper_Bar', Type: 'BAR' }
    }, monsters);
    expect(nodes['item:CardsC13'].name).toBe('Copper_Bar_Card');
  });

  it('never renders the DONTFILL placeholder, even when the source resolves to nothing', () => {
    const nodes = itemNodes({
      CardsD12: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: '_' }
    }, monsters);
    expect(nodes['item:CardsD12'].name).toBe('CardsD12');
  });

  it("gives a card no description, since desc_line1 is its source id rather than prose", () => {
    const nodes = itemNodes({
      CardsA9: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'frogBIG' }
    }, monsters);
    expect(nodes['item:CardsA9'].description).toBeNull();
  });
});

describe('card bonuses', () => {
  // cards.json is keyed by the monster the card drops from, not by the card's own item rawName.
  const cards = {
    frogBIG: {
      cardIndex: 'A9', effect: '+{%_Card_Drop_Chance', bonus: 5, perTier: 10,
      category: 'Blunder_Hills', visualIndex: 9
    }
  };
  const monsters = { frogBIG: { Name: 'Gigafrog' } };

  it('joins the bonus onto the card by cardIndex', () => {
    const nodes = itemNodes({
      CardsA9: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'frogBIG' }
    }, monsters, cards);
    expect(nodes['item:CardsA9'].card).toEqual({
      effect: '+{%_Card_Drop_Chance', bonus: 5, perTier: 10,
      // The wiki numbers a card's slot from one; visualIndex counts from zero.
      category: 'Blunder_Hills', order: 10
    });
  });

  it('keeps the raw value slot so the panel substitutes it the way CardTooltip does', () => {
    const nodes = itemNodes({
      CardsA9: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'frogBIG' }
    }, monsters, cards);
    const { effect, bonus } = nodes['item:CardsA9'].card;
    expect(effect.replace('{', bonus)).toBe('+5%_Card_Drop_Chance');
  });

  it('is null for a card with no catalogue entry', () => {
    const nodes = itemNodes({
      CardsD12: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: '_' }
    }, monsters, cards);
    expect(nodes['item:CardsD12'].card).toBeNull();
  });

  it('is null for anything that is not a card', () => {
    const nodes = itemNodes({ Copper: { displayName: 'Copper_Ore', Type: 'ORE' } }, monsters, cards);
    expect(nodes['item:Copper'].card).toBeNull();
  });
});

describe('monster stats and location', () => {
  const glublin = {
    goblinG: {
      Name: 'Glublin', Type: 'Monster', Damages: [13, 1], MonsterHPTotal: 2500,
      Defence: 7, ExpGiven: 50, RespawnTime: 15, mapIndex: 26, worldIndex: 1
    }
  };

  it('pulls the Information box figures off the monster', () => {
    const nodes = monsterNodes(glublin, { 26: 'Forest_Outskirts' });
    expect(nodes['monster:goblinG'].stats).toEqual({
      attack: 13, health: 2500, defence: 7, experience: 50, respawn: 15
    });
  });

  // The index comes along so the infobox can link the area to its map page; the name alone cannot
  // be resolved back, because mapNames repeats its placeholder entries.
  it('resolves the area from the map index and keeps the index', () => {
    const nodes = monsterNodes(glublin, { 26: 'Forest_Outskirts' });
    expect(nodes['monster:goblinG'].location).toEqual({ world: 1, area: 'Forest_Outskirts', mapIndex: 26 });
  });

  it('leaves both null for a monster carrying none of it', () => {
    const nodes = monsterNodes({ x: { Name: 'X', Type: 'Monster' } }, {});
    expect(nodes['monster:x'].stats).toBeNull();
    expect(nodes['monster:x'].location).toBeNull();
  });
});
