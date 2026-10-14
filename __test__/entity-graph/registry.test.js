import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { ROWS } from '../../scripts/entity-graph/registry/index.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport, sectionOf } from '../../scripts/entity-graph/registry/build.mjs';
import { costsAt, costsToMax, levelledText, readLevel } from '../../utility/wiki/effects.mjs';
import { KIND_LABELS, KIND_PLURALS } from '../../utility/wiki/kind-labels.mjs';
import { KIND_GROUPS, LISTED_KINDS } from '../../utility/wiki/kinds.mjs';
import { KIND_ART } from '../../components/wiki/CategoryTiles';

// Built from website-data directly, not the committed graph, so a kind is covered the moment its
// row exists, before anybody regenerates the graph.
const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = Object.values(registryNodes(data, ROWS));
const publicDir = path.join(process.cwd(), 'public');
// An overflowed number prints as "∞" on purpose; the word Infinity would be String() leaking through.
// `^ ~ | <` are World 7 tokens; `&` stays legal because game text uses it literally (Lamp Wish 4 "Shiny Mob LV Up &
// Breedability", Overgrowth after the Plan 6 font fix, the Spelunking tunnel rewards).
const LEFTOVER = /[{}$#@^~|<]|NaN|Infinity|\bundefined\b|\bnull\b|\[object Object\]/;
// readLevel's ceiling for a node with no cap: the highest level a reader can type.
const HIGHEST_TYPED_LEVEL = readLevel(Number.MAX_SAFE_INTEGER);

const rendered = (node, level) => (node.effect ? levelledText(node, level) : String(node.description || '').replace(/_/g, ' '));

describe('registry rows', () => {
  it('read sections that exist', () => {
    expect(ROWS.filter((row) => sectionOf(data, row) == null).map((row) => row.kind)).toEqual([]);
  });

  it('have a label, a plural, a nav group and tile art', () => {
    const missing = ROWS
      .filter((row) => !KIND_LABELS[row.kind] || !KIND_PLURALS[row.kind] || !LISTED_KINDS.includes(row.kind) || !KIND_ART[row.kind])
      .map((row) => row.kind);
    expect(missing).toEqual([]);
  });

  it('each own a distinct kind', () => {
    const kinds = ROWS.map((row) => row.kind);
    expect(kinds.filter((kind, i) => kinds.indexOf(kind) !== i)).toEqual([]);
  });

  // The group is the category chip and the nav band; the two must not disagree.
  it('sit in the nav group that lists their kind', () => {
    const misfiled = ROWS
      .filter((row) => row.group !== KIND_GROUPS.find((group) => group.kinds.includes(row.kind))?.label)
      .map((row) => row.kind);
    expect(misfiled).toEqual([]);
  });

  it('each yield at least one page', () => {
    const empty = ROWS.filter((row) => !nodes.some((node) => node.kind === row.kind)).map((row) => row.kind);
    expect(empty).toEqual([]);
  });

  // Nodes are keyed by kind and rawName, so two entries with the same key overwrite each other.
  // The report counts entries before that collapse, so this is the uniqueness gate.
  it('lose no entry to a key collision', () => {
    const report = registryReport(data, ROWS);
    const mismatched = ROWS
      .filter((row) => report[row.kind].count !== nodes.filter((node) => node.kind === row.kind).length)
      .map((row) => row.kind);
    expect(mismatched).toEqual([]);
  });
});

describe('registry nodes', () => {
  it('have a name and a rawName', () => {
    const bad = nodes.filter((node) => !node.name || !node.rawName).map((node) => `${node.kind}:${node.rawName}`);
    expect(bad).toEqual([]);
  });

  it('read as a finished sentence at level 1 and at the cap, or the highest typed level when uncapped', () => {
    const bad = nodes.flatMap((node) => [1, node.effect ? (node.effect.cap ?? HIGHEST_TYPED_LEVEL) : null].filter(Boolean)
      .map((level) => [`${node.kind}:${node.rawName}@${level}`, rendered(node, level)])
      .filter(([, text]) => LEFTOVER.test(text || '')));
    expect(bad).toEqual([]);
  });

  // Every cost of a level is checked on its own: a breeding upgrade pays a meal and Dead Cells.
  it('cost a finite, non-decreasing amount in every currency, with a finite total when capped', () => {
    const bad = nodes.filter((node) => node.cost).filter((node) => {
      const levels = [1, 2, 10, node.effect?.cap].filter(Boolean).sort((a, b) => a - b);
      const perLevel = levels.map((level) => costsAt(node, level).map(({ value }) => value));
      return costsToMax(node).some(({ value: total }, i) => {
        const costs = perLevel.map((entries) => entries[i]);
        const finite = costs.every((cost) => Number.isFinite(cost) && cost >= 0);
        const rising = costs.every((cost, j) => j === 0 || cost >= costs[j - 1]);
        return !(finite && rising && (node.effect?.cap ? Number.isFinite(total) : true));
      });
    }).map((node) => `${node.kind}:${node.rawName}`);
    expect(bad).toEqual([]);
  });

  // Field labels and values render as written, so a game name must arrive spaced and a missing
  // lookup must not print as a word.
  it('carry fields with no leftover underscore, undefined, null or NaN', () => {
    const bad = nodes.flatMap((node) => (node.fields || [])
      .flatMap(({ label, value }) => [label, ...[].concat(value)])
      .filter((text) => /_|undefined|null|NaN/.test(String(text)))
      .map((text) => `${node.kind}:${node.rawName}: ${text}`));
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

  // A fallback hides a per-entry art pattern that is wrong, so a row with an icon hook must find its
  // own art for every entry. Add a rawName under its kind only after checking the game ships no
  // art for that entry (not just a misnamed file), so the fallback is the intended picture.
  // The Exiled Throne (tunnel j) has no boss art: the game's asset list ships CaveRocki0..14 and no CaveRockj.
  const KNOWN_ICON_GAPS = { spelunktunnel: ['SpelunkTunnel9'] };
  it('find their own art when the row draws per-entry art', () => {
    const perEntry = new Set(ROWS.filter((row) => row.icon).map((row) => row.kind));
    const bad = nodes
      .filter((node) => perEntry.has(node.kind) && !KNOWN_ICON_GAPS[node.kind]?.includes(node.rawName))
      .filter((node) => !node.icon || !fs.existsSync(path.join(publicDir, node.icon)))
      .map((node) => `${node.kind}:${node.rawName}`);
    expect(bad).toEqual([]);
  });
});
