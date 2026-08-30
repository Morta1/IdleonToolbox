import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { attachHistory, HISTORY_NODE_KIND } from '../../scripts/entity-graph/history.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

describe('attachHistory', () => {
  // The history is keyed by the website-data collection; the graph is keyed by node kind. They
  // agree on the raw id, and nothing else.
  it('maps a website-data collection onto its graph node kind', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, { 'monsters/mushG': [{ v: '2.3.50', t: 'added' }] });
    expect(nodes['monster:mushG'].history).toEqual([{ v: '2.3.50', t: 'added' }]);
  });

  // A reader wants the most recent change first; the diff produces them oldest first.
  it('puts the newest event first', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, {
      'monsters/mushG': [
        { v: '2.3.50', t: 'added' },
        { v: '2.3.51', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 15, to: 20 }] }
      ]
    });
    expect(nodes['monster:mushG'].history.map((e) => e.v)).toEqual(['2.3.51', '2.3.50']);
  });

  // A companion is keyed by index in the history and by rawName in the graph, so it needs the
  // node's own index rather than a name lookup.
  it('matches a pet through its companion index', () => {
    const nodes = { 'pet:r0d': { kind: 'pet', rawName: 'r0d', companionIndex: 173 } };
    const stamped = attachHistory(nodes, { 'companions/173': [{ v: '2.3.525', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes['pet:r0d'].history).toHaveLength(1);
  });

  it('leaves a node with no history untouched', () => {
    const nodes = { 'monster:frogG': { kind: 'monster', rawName: 'frogG' } };
    attachHistory(nodes, {});
    expect(nodes['monster:frogG'].history).toBeUndefined();
  });

  it('ignores a history entry for an entity the graph does not carry', () => {
    const nodes = {};
    expect(attachHistory(nodes, { 'monsters/deleted': [{ v: '2.3.50', t: 'added' }] })).toBe(0);
  });

  // crafts.json keys its own collection by display name, but the item node it describes is keyed
  // by rawName. crafts.json carries the join itself: passing it in is how the display name gets
  // resolved before the lookup runs.
  it('resolves a craft history entry through crafts.json, from display name to rawName', () => {
    const nodes = { 'item:EquipmentHats21': { kind: 'item', rawName: 'EquipmentHats21' } };
    const crafts = { Birthday_Hat: { rawName: 'EquipmentHats21' } };
    const stamped = attachHistory(nodes, { 'crafts/Birthday_Hat': [{ v: '2.3.47', t: 'added' }] }, crafts);
    expect(stamped).toBe(1);
    expect(nodes['item:EquipmentHats21'].history).toHaveLength(1);
  });

  // A card's rawName is the rawName of the monster it depicts, and the graph has no separate card
  // kind, so a card change lands on the monster page.
  it('stamps a card history entry onto the monster node of the same rawName', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    const stamped = attachHistory(nodes, { 'cards/mushG': [{ v: '2.3.50', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes['monster:mushG'].history).toHaveLength(1);
  });

  // vials.json is itself keyed '0'..'85', so the history is index-keyed like companions, not
  // name-keyed like a vial node's rawName.
  it('matches a vial through its vial index', () => {
    const nodes = { 'vial:COPPER_CORONA': { kind: 'vial', rawName: 'COPPER_CORONA', vialIndex: 51 } };
    const stamped = attachHistory(nodes, { 'vials/51': [{ v: '2.3.50', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes['vial:COPPER_CORONA'].history).toHaveLength(1);
  });

  // achievements.json is a plain array in the snapshot, so its history is index-keyed too, unlike
  // the achievement node's own rawName.
  it('matches an achievement through its achievement index', () => {
    const nodes = { 'achievement:TaskAchA1': { kind: 'achievement', rawName: 'TaskAchA1', achievementIndex: 0 } };
    const stamped = attachHistory(nodes, { 'achievements/0': [{ v: '2.3.50', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes['achievement:TaskAchA1'].history).toHaveLength(1);
  });

  // A talents/<tab> entry is not one entity's history: every field row inside it names its own
  // talent through `owner`, and the graph has one node per talent. So talents is the one
  // collection that needs a per-field re-key rather than a place in HISTORY_NODE_KIND.
  //
  // The real 2.3.492 Pet to Mob rename on the Beast Master tab, which moved three talents at once
  // and two parts of one of them.
  it('fans a talent tab out onto one node per talent that changed', () => {
    const nodes = {
      'talent:365': { kind: 'talent', rawName: 'ANIMALISTIC_FEROCITY' },
      'talent:370': { kind: 'talent', rawName: 'ARENA_SPIRIT' },
      'talent:373': { kind: 'talent', rawName: 'CURVITURE_OF_THE_PAW' }
    };
    const stamped = attachHistory(nodes, {
      'talents/Beast_Master': [{
        v: '2.3.492',
        t: 'changed',
        fields: [
          { field: 'description', owner: 'ANIMALISTIC_FEROCITY', from: 'Pet_Power', to: 'Mob_Power' },
          { field: 'lvlUpText', owner: 'ANIMALISTIC_FEROCITY', from: 'Pet_Pow', to: 'Mob_Pow' },
          { field: 'description', owner: 'ARENA_SPIRIT', from: 'Pet_Arena', to: 'Mob_Arena' },
          { field: 'description', owner: 'CURVITURE_OF_THE_PAW', from: 'Pet_Power', to: 'Mob_Power' }
        ]
      }]
    });
    expect(stamped).toBe(3);
    // The owner has done its job at the join and does not ride onto the node: the node IS that
    // talent, so the stamped row is the same scalar shape every other kind produces.
    expect(nodes['talent:365'].history).toEqual([{
      v: '2.3.492',
      t: 'changed',
      fields: [{ field: 'description', from: 'Pet_Power', to: 'Mob_Power' },
        { field: 'lvlUpText', from: 'Pet_Pow', to: 'Mob_Pow' }]
    }]);
    expect(nodes['talent:370'].history[0].fields).toEqual([
      { field: 'description', from: 'Pet_Arena', to: 'Mob_Arena' }
    ]);
    expect(nodes['talent:373'].history[0].fields).toHaveLength(1);
  });

  // talents stays out of HISTORY_NODE_KIND deliberately: a tab is not an entity, so there is no
  // single node kind to map it to. Its two destinations are decided per event instead.
  it('keeps talents out of the plain collection-to-kind mapping', () => {
    expect(HISTORY_NODE_KIND.talents).toBeUndefined();
  });

  // A whole tab arriving has no field, and so no talent to attribute it to. The Royal Guardian
  // tab at 2.3.525 is the class getting its talent tree, so the class node is where it belongs.
  it('lands a bare tab-level added on the class node', () => {
    const nodes = { 'class:Royal_Guardian': { kind: 'class', rawName: 'Royal_Guardian' } };
    const stamped = attachHistory(nodes, { 'talents/Royal_Guardian': [{ v: '2.3.525', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes['class:Royal_Guardian'].history).toEqual([{ v: '2.3.525', t: 'added' }]);
  });

  // Not every tab is a class: "Special Talent 3" holds star talents and has no class node. The
  // class fallback has to tolerate that without taking the tab's real talent changes down with it.
  it('still stamps a tab whose name is not a class', () => {
    const nodes = { 'talent:651': { kind: 'talent', rawName: 'SPICE_SPILLAGE' } };
    const stamped = attachHistory(nodes, {
      'talents/Special Talent 3': [{
        v: '2.3.492',
        t: 'changed',
        fields: [{ field: 'description', owner: 'SPICE_SPILLAGE', from: 'pet_spices', to: 'Mob_spices' }]
      }]
    });
    expect(stamped).toBe(1);
    expect(nodes['talent:651'].history[0].fields).toEqual([
      { field: 'description', from: 'pet_spices', to: 'Mob_spices' }
    ]);
  });

  // A talent is deduped across the tabs that share it, so two tabs reporting the same talent at
  // one version are one row on its page rather than two identical ones.
  it('coalesces one talent reported by two tabs at the same version', () => {
    const nodes = { 'talent:199': { kind: 'talent', rawName: 'DETONATION' } };
    const row = { field: 'lvlUpText', owner: 'DETONATION', from: '%', to: '&' };
    attachHistory(nodes, {
      'talents/Death_Bringer': [{ v: '2.3.525', t: 'changed', fields: [row] }],
      'talents/Divine_Knight': [{ v: '2.3.525', t: 'changed', fields: [row] }]
    });
    expect(nodes['talent:199'].history).toEqual([{
      v: '2.3.525',
      t: 'changed',
      fields: [{ field: 'lvlUpText', from: '%', to: '&' }]
    }]);
  });

  // A node can receive events from two source collections (a monster's own entry plus its card
  // entry), each already oldest-first on its own but not against each other. Concatenating them
  // and reversing the whole block is two sorted runs stuck together, not a global sort, once the
  // two ranges interleave - mirrors the real monster:w7b8 shape, whose merged history read
  // [2.3.501, 2.3.492, 2.3.523, 2.3.492] before this was fixed.
  it('sorts a merge of two interleaving collections into one descending run', () => {
    const nodes = { 'monster:w7b8': { kind: 'monster', rawName: 'w7b8' } };
    attachHistory(nodes, {
      'monsters/w7b8': [
        { v: '2.3.492', t: 'changed', fields: [{ field: 'Damages', from: 1, to: 2 }] },
        { v: '2.3.523', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 100, to: 200 }] }
      ],
      'cards/w7b8': [
        { v: '2.3.492', t: 'changed', fields: [{ field: 'bonus', from: 1, to: 2 }] },
        { v: '2.3.501', t: 'changed', fields: [{ field: 'perTier', from: 1, to: 2 }] }
      ]
    });
    // The two 2.3.492 events coalesce into one row, so the merged run is three versions long.
    expect(nodes['monster:w7b8'].history.map((e) => e.v)).toEqual(['2.3.523', '2.3.501', '2.3.492']);
    expect(nodes['monster:w7b8'].history[2].fields.map(({ field }) => field)).toEqual(['Damages', 'bonus']);
  });

  // One node merges two source collections (items + crafts on an item, monsters + cards on a
  // monster) and both can fire at the same version. Two events sharing a version are one row to
  // the reader, and two identical React keys to the renderer, so they coalesce into one.
  //
  // The real shape: every one of the twelve World 7 bosses is added at 2.3.492 twice, once as a
  // monster and once as its card.
  it('coalesces two added events at the same version into one', () => {
    const nodes = { 'monster:w7b8': { kind: 'monster', rawName: 'w7b8' } };
    attachHistory(nodes, {
      'monsters/w7b8': [{ v: '2.3.492', t: 'added' }],
      'cards/w7b8': [{ v: '2.3.492', t: 'added' }]
    });
    expect(nodes['monster:w7b8'].history).toEqual([{ v: '2.3.492', t: 'added' }]);
  });

  // item:EquipmentHats21 (Birthday Hat) at 2.3.47: its own Type/Class change plus the craft
  // entry's subType change, which rendered as two separate changed blocks under one version.
  it('merges the fields of two changed events at the same version', () => {
    const nodes = { 'item:EquipmentHats21': { kind: 'item', rawName: 'EquipmentHats21' } };
    attachHistory(nodes, {
      'items/EquipmentHats21': [{
        v: '2.3.47',
        t: 'changed',
        fields: [{ field: 'Type', from: 'HELMET', to: 'PREMIUM_HELMET' },
          { field: 'Class', from: 'BEGINNER', to: 'ALL' }]
      }],
      'crafts/Birthday_Hat': [{
        v: '2.3.47',
        t: 'changed',
        fields: [{ field: 'subType', from: 'HELMET', to: 'PREMIUM_HELMET' }]
      }]
    }, { Birthday_Hat: { rawName: 'EquipmentHats21' } });
    expect(nodes['item:EquipmentHats21'].history).toEqual([{
      v: '2.3.47',
      t: 'changed',
      fields: [{ field: 'Type', from: 'HELMET', to: 'PREMIUM_HELMET' },
        { field: 'Class', from: 'BEGINNER', to: 'ALL' },
        { field: 'subType', from: 'HELMET', to: 'PREMIUM_HELMET' }]
    }]);
  });

  // The same field arriving from both collections is one change, not two.
  it('keeps one row per field name when both collections report it', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, {
      'monsters/mushG': [{ v: '2.3.50', t: 'changed', fields: [{ field: 'bonus', from: 1, to: 2 }] }],
      'cards/mushG': [{ v: '2.3.50', t: 'changed', fields: [{ field: 'bonus', from: 1, to: 2 }] }]
    });
    expect(nodes['monster:mushG'].history[0].fields).toEqual([{ field: 'bonus', from: 1, to: 2 }]);
  });

  // "Added at 2.3.492, and also changed at 2.3.492" is incoherent on its face: an entity that
  // first appeared at a version was not also altered at it. Added wins the label.
  //
  // The label only. Every real occurrence has the `added` coming from the SIBLING collection
  // rather than from the entity itself, so dropping the changed event's fields with it loses the
  // only real content on the row. The real case is monster:caveD at 2.3.511: the CARD was added,
  // while the monster itself was renamed, resped and given nineteen orders of magnitude more
  // health. The coalesced event keeps all of it and says "added" as well, which is strictly more
  // than either input event carried.
  it('keeps the changed fields when an added lands on the same version', () => {
    const nodes = { 'monster:caveD': { kind: 'monster', rawName: 'caveD' } };
    attachHistory(nodes, {
      'monsters/caveD': [{
        v: '2.3.511',
        t: 'changed',
        fields: [{ field: 'Name', from: 'Shimmer_Glunko', to: 'Crystal_Glunko' },
          { field: 'RespawnTime', from: 45, to: 30 },
          { field: 'MonsterHPTotal', from: 10000000, to: 10000000000000000000 }]
      }],
      'cards/caveD': [{ v: '2.3.511', t: 'added' }]
    });
    expect(nodes['monster:caveD'].history).toEqual([{
      v: '2.3.511',
      t: 'added',
      fields: [{ field: 'Name', from: 'Shimmer_Glunko', to: 'Crystal_Glunko' },
        { field: 'RespawnTime', from: 45, to: 30 },
        { field: 'MonsterHPTotal', from: 10000000, to: 10000000000000000000 }]
    }]);
  });

  // ...and an added with nothing to report stays a bare added, rather than growing an empty
  // fields array that the renderer would then have to guard against.
  it('leaves an added with no fields bare', () => {
    const nodes = { 'item:Copper': { kind: 'item', rawName: 'Copper' } };
    attachHistory(nodes, {
      'items/Copper': [{ v: '2.3.492', t: 'added' }],
      'crafts/Copper_Ore': [{ v: '2.3.492', t: 'added' }]
    }, { Copper_Ore: { rawName: 'Copper' } });
    expect(nodes['item:Copper'].history).toEqual([{ v: '2.3.492', t: 'added' }]);
  });

  // A string compare gets this pair backwards: "2.3.100" < "2.3.9" as strings, because '1' < '9'
  // at the first differing character. The fixture deliberately arrives with the lexicographically
  // "later" version first, so a sort that silently degrades to a string compare (or a stray
  // .reverse() masquerading as a sort) cannot pass by accident.
  it('compares versions numerically, not lexicographically', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, {
      'monsters/mushG': [
        { v: '2.3.9', t: 'added' },
        { v: '2.3.100', t: 'changed', fields: [{ field: 'Damages', from: 1, to: 2 }] }
      ]
    });
    expect(nodes['monster:mushG'].history.map((e) => e.v)).toEqual(['2.3.100', '2.3.9']);
  });
});

describe('the built graph', () => {
  it('stamps history onto real nodes', () => {
    const withHistory = Object.values(graph.nodes).filter((node) => node.history?.length);
    expect(withHistory.length).toBeGreaterThan(200);
  });

  // w7b8, w7b7 and w7b12 each merge a monster entry with a card entry whose version ranges
  // interleave, which is exactly the shape that exposed the concatenate-then-reverse bug.
  it('keeps every node history sorted newest to oldest, even where two collections merge', () => {
    for (const rawName of ['w7b8', 'w7b7', 'w7b12']) {
      const node = graph.nodes[`monster:${rawName}`];
      const versions = (node?.history || []).map((event) => event.v);
      const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
      const sorted = [...versions].sort((a, b) => {
        const [a1, a2, a3] = parts(a), [b1, b2, b3] = parts(b);
        return (b1 - a1) || (b2 - a2) || (b3 - a3);
      });
      expect(versions).toEqual(sorted);
    }
  });

  // One version is one row, and the row is keyed by version, so a node holding two events at one
  // version renders the version twice and hands React two identical keys.
  it('never carries two events at the same version on one node', () => {
    const duplicated = Object.entries(graph.nodes).filter(([, node]) => {
      const versions = (node.history || []).map((event) => event.v);
      return new Set(versions).size !== versions.length;
    });
    expect(duplicated.map(([key]) => key)).toEqual([]);
  });

  // The nine field-level talent changes in the archive cover nine distinct talents across eight
  // tabs, and every one of them resolves to a talent node by rawName. A miss means the join is
  // wrong, so the roster is pinned rather than left as "some".
  it('stamps every talent change onto its own talent node', () => {
    const talents = Object.entries(graph.nodes).filter(([, node]) => node.kind === 'talent' && node.history?.length);
    expect(talents.map(([key]) => key).sort()).toEqual([
      'talent:199', 'talent:279', 'talent:365', 'talent:370', 'talent:373',
      'talent:427', 'talent:475', 'talent:599', 'talent:651'
    ]);
    // No stamped row keeps the owner it was joined by: the node is that talent already.
    const owners = talents.flatMap(([, node]) => node.history)
      .flatMap((event) => event.fields || [])
      .filter((field) => 'owner' in field);
    expect(owners).toEqual([]);
  });

  // The Royal Guardian tab arriving at 2.3.525 has no field, so no talent owns it. It is the
  // class getting its talent tree.
  it('lands the tab-level talent add on the class node', () => {
    expect(graph.nodes['class:Royal_Guardian'].history).toEqual([{ v: '2.3.525', t: 'added' }]);
  });

  // The whole point of the field allowlist: a changelog nobody can read is not a changelog.
  it('never reports a field the allowlist was meant to drop', () => {
    const banned = new Set(['typeGen', 'DeathFrame', 'HeightOfMonster', 'sprite', 'visualIndex', 'filler',
      // The talent sub-keys the sub-level allowlist drops: a list position, and two names of a
      // curve type rather than of a value.
      'skillIndex', 'funcX', 'funcY']);
    const leaked = Object.values(graph.nodes)
      .flatMap((node) => node.history || [])
      .flatMap((event) => event.fields || [])
      .filter((change) => banned.has(change.field));
    expect(leaked).toEqual([]);
  });
});
