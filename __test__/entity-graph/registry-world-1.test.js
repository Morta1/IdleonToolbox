import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world1 from '../../scripts/entity-graph/registry/world-1/index.mjs';
import { levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world1);
const edges = registryEdges(data, world1);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

describe('statues', () => {
  it('build one page per statue in the game table', () => {
    expect(ofKind('statue')).toHaveLength(data.statues.filter((statue) => statue?.name).length);
  });

  // The page is named after the statue item a player levels it with, so the two always agree.
  it('take their name from the statue item they are levelled with', () => {
    const bad = ofKind('statue').filter((node) => {
      const edge = edges.find((e) => e.from === `statue:${node.rawName}`);
      return !edge || data.items[edge.to.replace('item:', '')]?.displayName !== node.name;
    }).map((node) => node.rawName);
    expect(bad).toEqual([]);
  });

  // Oracle: statues.ts, level times the base bonus, before save-dependent multipliers.
  it('read their bonus at a level', () => {
    const power = nodes['statue:Statue1'];
    expect(levelledText(power, 10)).toBe(`+${10 * data.statues[0].bonus} Base Damage`);
  });

  it('print a percentage statue with its percent sign', () => {
    const speed = nodes['statue:Statue2'];
    expect(levelledText(speed, 10)).toBe(`+${Math.round(10 * data.statues[1].bonus * 100) / 100}% Move Speed`);
  });
});
