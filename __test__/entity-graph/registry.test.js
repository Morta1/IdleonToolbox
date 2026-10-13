import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { ROWS } from '../../scripts/entity-graph/registry/index.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import { costAt, costToMax, levelledText } from '../../utility/wiki/effects.mjs';
import { KIND_LABELS, KIND_PLURALS } from '../../utility/wiki/kind-labels.mjs';
import { LISTED_KINDS } from '../../utility/wiki/kinds.mjs';
import { KIND_ART } from '../../components/wiki/CategoryTiles';

// Built from website-data directly, not the committed graph, so a kind is covered the moment its
// row exists, before anybody regenerates the graph.
const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = Object.values(registryNodes(data, ROWS));
const publicDir = path.join(process.cwd(), 'public');
const LEFTOVER = /[{}$#@]|NaN|Infinity/;

const rendered = (node, level) => (node.effect ? levelledText(node, level) : String(node.description || '').replace(/_/g, ' '));

describe('registry rows', () => {
  it('read sections that exist', () => {
    expect(ROWS.filter((row) => data[row.section] == null).map((row) => row.kind)).toEqual([]);
  });

  it('have a label, a plural, a nav group and tile art', () => {
    const missing = ROWS
      .filter((row) => !KIND_LABELS[row.kind] || !KIND_PLURALS[row.kind] || !LISTED_KINDS.includes(row.kind) || !KIND_ART[row.kind])
      .map((row) => row.kind);
    expect(missing).toEqual([]);
  });

  it('each yield at least one page', () => {
    const empty = ROWS.filter((row) => !nodes.some((node) => node.kind === row.kind)).map((row) => row.kind);
    expect(empty).toEqual([]);
  });

  // Nodes are keyed by kind and rawName, so two entries with the same key overwrite each other and
  // the uniqueness check below can no longer see them. The report counts entries before that collapse.
  it('lose no entry to a key collision', () => {
    const report = registryReport(data, ROWS);
    const mismatched = ROWS
      .filter((row) => report[row.kind].count !== nodes.filter((node) => node.kind === row.kind).length)
      .map((row) => row.kind);
    expect(mismatched).toEqual([]);
  });
});

describe('registry nodes', () => {
  it('have a name and a rawName unique within their kind', () => {
    const seen = new Set();
    const bad = nodes.filter((node) => {
      const id = `${node.kind}:${node.rawName}`;
      const duplicate = seen.has(id);
      seen.add(id);
      return !node.name || !node.rawName || duplicate;
    }).map((node) => `${node.kind}:${node.rawName}`);
    expect(bad).toEqual([]);
  });

  it('read as a finished sentence at level 1 and at the cap', () => {
    const bad = nodes.flatMap((node) => [1, node.effect?.cap].filter(Boolean)
      .map((level) => [`${node.kind}:${node.rawName}@${level}`, rendered(node, level)])
      .filter(([, text]) => LEFTOVER.test(text || '')));
    expect(bad).toEqual([]);
  });

  it('cost a finite, non-decreasing amount, with a finite total when capped', () => {
    const bad = nodes.filter((node) => node.cost).filter((node) => {
      const levels = [1, 2, 10, node.effect?.cap].filter(Boolean).sort((a, b) => a - b);
      const costs = levels.map((level) => costAt(node, level));
      const finite = costs.every((cost) => Number.isFinite(cost) && cost >= 0);
      const rising = costs.every((cost, i) => i === 0 || cost >= costs[i - 1]);
      const total = node.effect?.cap ? Number.isFinite(costToMax(node)) : true;
      return !(finite && rising && total);
    }).map((node) => `${node.kind}:${node.rawName}`);
    expect(bad).toEqual([]);
  });

  // The build nulls missing art; this catches a row whose art path is wrong for every entry.
  it('point at art that exists, or at a fallback that does', () => {
    const bad = nodes.filter((node) => {
      const paths = [node.icon, ...(node.iconFallbacks || [])].filter(Boolean);
      return paths.length > 0 && !paths.some((icon) => fs.existsSync(path.join(publicDir, icon)));
    }).map((node) => `${node.kind}:${node.rawName}`);
    expect(bad).toEqual([]);
  });
});
