import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { rollupByVersion } from '../../utility/wiki/changelog';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

const nodes = {
  'monster:mushG': {
    kind: 'monster', name: 'Green_Mushroom', slug: 'green-mushroom',
    history: [
      { v: '2.3.51', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 15, to: 20 }] },
      { v: '2.3.50', t: 'added' }
    ]
  },
  'item:Copper': {
    kind: 'item', name: 'Copper_Ore', slug: 'copper-ore',
    history: [{ v: '2.3.51', t: 'added' }]
  }
};

describe('rollupByVersion', () => {
  it('groups every entity change under its version, newest first', () => {
    const rollup = rollupByVersion(nodes);
    expect(rollup.map((row) => row.version)).toEqual(['2.3.51', '2.3.50']);
    expect(rollup[0].added).toBe(1);
    expect(rollup[0].changed).toBe(1);
  });

  // A world release is 181 added plus 97 changed, which is a wall as a flat list. Grouping by
  // kind is what keeps the big versions readable.
  it('groups a version by entity kind', () => {
    const [latest] = rollupByVersion(nodes);
    expect(latest.kinds.map((group) => group.kind).sort()).toEqual(['item', 'monster']);
    expect(latest.kinds.find((group) => group.kind === 'monster').entries[0].name).toBe('Green_Mushroom');
  });

  it('carries the slug so every row can link to its entity', () => {
    const [latest] = rollupByVersion(nodes);
    expect(latest.kinds.every((group) => group.entries.every((entry) => entry.slug))).toBe(true);
  });

  it('returns nothing when no node has a history', () => {
    expect(rollupByVersion({ 'monster:frogG': { kind: 'monster', name: 'Frog' } })).toEqual([]);
  });
});

describe('the real graph', () => {
  it('rolls up into versions a page can render', () => {
    const rollup = rollupByVersion(graph.nodes);
    expect(rollup.length).toBeGreaterThan(10);
    // Newest first, compared numerically: "2.3.9" > "2.3.100" as a string, so a string comparison
    // here would pass whichever way round the list came out.
    const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
    const [first] = parts(rollup[0].version);
    // Non-increasing per segment, not mere distinctness: the real archive carries lettered hotfix
    // versions ("2.3.493" then "2.3.493a") that normalize to the same three numbers, so two
    // adjacent rows CAN legitimately share a normalized value. What must never happen is a later
    // row outranking an earlier one, which is exactly what a string sort would do to "2.3.100"
    // beside "2.3.9".
    const nonIncreasing = (prev, cur) => (prev[0] !== cur[0] ? prev[0] > cur[0]
      : prev[1] !== cur[1] ? prev[1] > cur[1]
        : prev[2] >= cur[2]);
    const ordered = rollup.every((row, index) => index === 0
      || nonIncreasing(parts(rollup[index - 1].version), parts(row.version)));
    expect(Number.isFinite(first)).toBe(true);
    expect(ordered).toBe(true);
    expect(parts(rollup[0].version)[2]).toBeGreaterThan(parts(rollup[rollup.length - 1].version)[2]);
  });
});
