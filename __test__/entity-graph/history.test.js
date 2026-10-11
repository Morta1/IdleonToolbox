import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { attachHistory } from '../../scripts/entity-graph/history.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

describe('attachHistory', () => {
  // The history is keyed by the website-data collection; the graph is keyed by node kind. They
  // agree on the raw id, and nothing else.
  it('maps a website-data collection onto its graph node kind', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, { 'monsters/mushG': [{ v: '2.3.50', t: 'added' }] });
    expect(nodes['monster:mushG'].history).toEqual([{ v: '2.3.50', t: 'added' }]);
  });

  // These collections are keyed by index in the history and by rawName in the graph, so the match
  // needs the node's own index rather than a name lookup. vials.json is itself keyed '0'..'85', and
  // achievements.json is a plain array in the snapshot.
  it.each([
    ['a pet through its companion index', { kind: 'pet', rawName: 'r0d', companionIndex: 173 }, 'companions/173'],
    ['a vial through its vial index', { kind: 'vial', rawName: 'COPPER_CORONA', vialIndex: 51 }, 'vials/51'],
    ['an achievement through its achievement index',
      { kind: 'achievement', rawName: 'TaskAchA1', achievementIndex: 0 }, 'achievements/0']
  ])('matches %s', (title, node, historyKey) => {
    const id = `${node.kind}:${node.rawName}`;
    const nodes = { [id]: node };
    const stamped = attachHistory(nodes, { [historyKey]: [{ v: '2.3.525', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes[id].history).toEqual([{ v: '2.3.525', t: 'added' }]);
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

  // One node merges two source collections and both can fire at the same version: every World 7
  // boss is added at 2.3.492 as a monster and as its card. They coalesce into one row, and an added
  // with nothing to report stays bare rather than growing an empty fields array.
  it('coalesces two added events at one version into one bare added', () => {
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

  // No stamped row keeps the owner it was joined by: the node is that talent already.
  it('leaves no owner on a stamped talent row', () => {
    const talents = Object.values(graph.nodes).filter((node) => node.kind === 'talent' && node.history?.length);
    expect(talents.length).toBeGreaterThan(0);
    const owners = talents.flatMap((node) => node.history)
      .flatMap((event) => event.fields || [])
      .filter((field) => 'owner' in field);
    expect(owners).toEqual([]);
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
