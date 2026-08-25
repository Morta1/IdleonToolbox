import { describe, it, expect } from 'vitest';
import { dropEdges } from '../../scripts/entity-graph/edges/drops.mjs';
import { craftEdges } from '../../scripts/entity-graph/edges/crafts.mjs';
import { questItemEdges } from '../../scripts/entity-graph/edges/quest-items.mjs';
import { questNpcEdges } from '../../scripts/entity-graph/edges/quest-npc.mjs';
import { monsterDrops, crafts, quests, monsters } from './fixture.mjs';

describe('drop edges', () => {
  it('emits monster -> item drops with chance and quantity', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges).toContainEqual({
      from: 'monster:mushG', to: 'item:Grasslands1', rel: 'drops',
      meta: { chance: 0.35, quantity: 1, effectiveChance: 0.35, tableChance: 1, dropTablePath: [] },
      source: 'drops',
    });
    expect(edges).toHaveLength(6);
  });

  // Coin is the drop idleon.wiki lists first and the one players actually collect. It was ignored
  // because the game ships no item definition for a currency, so there was nothing to resolve to.
  it('emits the coin drop', () => {
    const edges = dropEdges(monsterDrops, monsters);
    const coin = edges.filter((edge) => edge.to === 'item:COIN');
    expect(coin).toHaveLength(1);
    expect(coin[0].meta.quantity).toBe(3);
  });

  // A chance of 0 never drops. Most are the placeholder row a nested drop table writes for its own
  // slot, which listed Coin two or three times on a monster that drops it once.
  it('leaves out a drop that cannot happen', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges.every((edge) => edge.meta.chance > 0)).toBe(true);
  });

  // idleon.wiki lists the item the recipe teaches, not the recipe, and so does the game's own
  // drop table. Pointing the edge at the recipe left Dootjat Eye's page claiming nothing drops it.
  it('points a recipe drop at the item it teaches', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges.find((edge) => edge.to === 'item:Quest36')).toBeDefined();
    expect(edges.find((edge) => edge.to === 'item:SmithingRecipes2')).toBeUndefined();
  });

  // The row links to the item, so it has to say the drop is the recipe for it rather than the
  // item itself, or Sand Giant reads as handing over a finished Dootjat Eye.
  it('marks a recipe drop as a recipe', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges.find((edge) => edge.to === 'item:Quest36').meta.recipe).toBe(true);
    expect(edges.find((edge) => edge.to === 'item:Grasslands1').meta.recipe).toBeUndefined();
  });

  // One rawName covers every book, so without the talent these two rows are byte-identical and the
  // build's duplicate pass merges them: Green Mushroom would list two books where the wiki has three.
  it('carries the talent a book teaches so two books stay distinct', () => {
    const edges = dropEdges(monsterDrops, monsters).filter((edge) => edge.to === 'item:TalentBook1');
    expect(edges.map((edge) => edge.meta.talentName)).toEqual(['ROLL_DA_DICE', 'ATTACKS_ON_SIMMER']);
    expect(edges[1].meta.talentLevel).toBe(50);
  });

  it('leaves a real quantity alone', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges.find((edge) => edge.to === 'item:COIN').meta.quantity).toBe(3);
  });

  // The seven monsters the game names "Error" are cut content and internal spawners, so their
  // drops must not become edges either, or the resolver reports them as unresolved.
  it('drops nothing from a monster the game names Error', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges.filter((edge) => edge.from === 'monster:behemoth')).toEqual([]);
  });

  it('carries the drop table path and the per-kill chance for tabled drops', () => {
    const edges = dropEdges(monsterDrops, monsters);
    expect(edges).toContainEqual({
      from: 'monster:mushG', to: 'item:StoneT2', rel: 'drops',
      meta: {
        chance: 0.85,
        quantity: 1,
        effectiveChance: 0.00002125,
        tableChance: 0.000025,
        dropTablePath: ['DropTable3', 'SuperDropTable1'],
      },
      source: 'drops',
    });
  });
});

describe('craft edges', () => {
  it('emits product -> material craftedFrom edges using rawName not the display key', () => {
    const edges = craftEdges(crafts);
    expect(edges).toEqual([{
      from: 'item:EquipmentShirts1', to: 'item:CraftMat1', rel: 'craftedFrom',
      meta: { quantity: 1 }, source: 'crafts',
    }]);
  });
});

describe('quest item edges', () => {
  it('emits rewards and requires edges', () => {
    const edges = questItemEdges(quests);
    expect(edges).toContainEqual({
      from: 'quest:TP_Pete1', to: 'item:StoneT2', rel: 'rewards',
      meta: { amount: 2 }, source: 'quest-items',
    });
    expect(edges).toContainEqual({
      from: 'quest:TP_Pete2', to: 'item:Quest14', rel: 'requires',
      meta: { amount: 50 }, source: 'quest-items',
    });
    expect(edges).toHaveLength(3); // 2 rewards + 1 requires
  });
});

describe('quest npc edges', () => {
  it('emits npc -> quest gives edges with order', () => {
    const edges = questNpcEdges(quests);
    expect(edges).toEqual([
      { from: 'npc:TP_Pete', to: 'quest:TP_Pete1', rel: 'gives', meta: { order: 1 }, source: 'quest-npc' },
      { from: 'npc:TP_Pete', to: 'quest:TP_Pete2', rel: 'gives', meta: { order: 2 }, source: 'quest-npc' },
    ]);
  });
});
