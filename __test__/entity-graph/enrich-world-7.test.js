import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { enrichWorld7 } from '../../scripts/entity-graph/enrich-world-7.mjs';
import { itemNodes } from '../../scripts/entity-graph/nodes/items.mjs';
import { npcNodes } from '../../scripts/entity-graph/nodes/npcs.mjs';
import { stationNodes } from '../../scripts/entity-graph/nodes/stations.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

// The before/after snapshots name exactly which nodes the enrichment touched.
const blank = () => ({
  ...itemNodes(data.items),
  ...npcNodes(data.npcRoster),
  ...stationNodes()
});
const before = blank();
const snapshot = Object.fromEntries(Object.entries(before).map(([id, node]) => [id, JSON.stringify(node)]));
const nodes = blank();
enrichWorld7(nodes, data);
const changed = (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && JSON.stringify(nodes[id]) !== snapshot[id]).sort();
const fieldsOf = (id) => nodes[id].fields;

describe('which nodes are enriched', () => {
  it('enrich the Button and Coral Kid, and nobody else', () => {
    expect(changed('npc:')).toEqual(['npc:Coral_Kid', 'npc:The_Button']);
  });

  it('enrich the Dancing Coral items that are not placeholders', () => {
    const released = Object.keys(data.items)
      .filter((rawName) => /^Coral\d+$/.test(rawName))
      .filter((rawName) => !/who_knows/.test(data.generalSpelunky[23][Number(rawName.slice(5))]))
      .map((rawName) => `item:${rawName}`);
    expect(changed('item:')).toEqual(released.sort());
  });

  it('enrich the new Coral Reef station, whose node is the app tile', () => {
    expect(changed('station:')).toEqual(['station:coralreef']);
    expect(stationNodes()['station:coralreef']).toEqual({
      kind: 'station',
      rawName: 'coralreef',
      name: 'Coral Reef',
      icon: '/data/ReefA1.png',
      category: 'World 7'
    });
  });
});

// Oracle: Minehead.js:456-481 Button_Bonuses, FarmingStuffs.js:314, Spelunk.js:62, CookingR.js:151 (the slot a stat reads).
describe('The Button', () => {
  it('list each bonus under the label of the stat it feeds, and what boosts them', () => {
    expect(fieldsOf('npc:The_Button')).toEqual([
      {
        label: 'Bonuses',
        value: [
          '+0.02x Res. XP per press',
          '+0.03x Minehead per press',
          '+0.02x Sushi per press',
          '+0.02x Arti. Odds per press',
          '+0.04x Xtra per press',
          '+0.05x Crop Evo per press',
          '+0.04x Spelunk per press',
          '+0.25x Cooking SPD per press',
          '+5% Class XP per press'
        ]
      },
      { label: 'Cycle', value: 'Each 5 presses feed the next bonus in turn, so 45 presses fill all nine once' },
      { label: 'Boosted by', value: ['The Better Button research square', 'The Mantaray companion'] }
    ]);
  });
});

// Oracle: Thingies.js:185-203 CoralKidUpgCost / CoralKidUpgBonus at level 1, N.js:119234 (the parser reads the account: pinned).
describe('Coral Kid', () => {
  it('list the six upgrades at level 1 and what they cost', () => {
    expect(fieldsOf('npc:Coral_Kid')).toEqual([
      {
        label: 'Upgrades at level 1 (paid in Divinity Points)',
        value: [
          'Lets you click the volcano, linking the divinity of your choice to ALL players! Also, +10% Divinity EXP gain for all!',
          "The Max Level of the ''Blessing'' upgrade for each Divinity is +2 levels higher!",
          'God Rank now also gives 1.01x Class EXP to all players!',
          'Divinity Skill Lv boosts Minor Link Bonuses a bit more!',
          'Boosts Divinity PTS gain by +2% per Coral Reef upgrade!',
          'You now generate 2.4% more Daily Coral for the Coral Reef back in W7 town!'
        ]
      },
      {
        label: 'Upgrade cost',
        value: '10,000,000 Divinity Points for the first upgrade, 6x more for each one after it; every level costs 1.1x more (1.25x for the second)'
      }
    ]);
  });
});

// Oracle: N.js:119242, 119403 (the dance panel prints the ceiling; getDancingCoralCost is unrounded).
describe('Dancing Coral', () => {
  it('state the shrine, the bonus per level and the cost', () => {
    expect(fieldsOf('item:Coral2')).toEqual([
      {
        label: 'Dancing Coral',
        value: [
          '+100 Max LV for the Crystal Shrine',
          '+3% Spelunking Amber gain per Crystal Shrine LV above Lv.200',
          'The dance costs 248 Glowing Coral'
        ]
      }
    ]);
    expect(fieldsOf('item:Coral5')).toEqual([
      {
        label: 'Dancing Coral',
        value: [
          '+100 Max LV for the Summereading Shrine',
          '+5% Minehead DMG & Money per Summereading Shrine LV above Lv.200',
          'The dance costs 24,753 Aegean Coral'
        ]
      }
    ]);
  });
});

// Oracle: Thingies.js:328-331 ReefCost, N.js:119252 (the reef panel prints the ceiling; getReefCost is unrounded).
describe('Coral Reef', () => {
  it('list the real reef upgrades and the first dance, paid in Reef Coral', () => {
    expect(fieldsOf('station:coralreef')).toEqual([
      {
        label: 'Reef upgrades (paid in Reef Coral)',
        value: [
          'Every day you play, your Grind Time bubble gets +10 LVs (max level 15; first level 10, x1.25 per level)',
          "Adds a new bonus to your Tome's Epilogue in World 4, which goes up with your Tome Score! (max level 10; first level 15, x1.75 per level)",
          "Adds a new mini 'Ninja Knowledge' upgrade, level it up with your Jade! (max level 12; first level 10, x1.65 per level)",
          'The Gallery gives +3% higher bonuses, and has +1 more slots for Trophies (max level 10; first level 40, x1.6 per level)'
        ]
      },
      {
        label: 'Dancing Coral',
        value: [
          'Dances are bought in order, starting with this one',
          '+100 Max LV for the Woodular Shrine',
          '+2% Daily Reef Coral per Woodular Shrine LV above Lv.200',
          'The dance costs 20 Reef Coral'
        ]
      }
    ]);
  });
});
