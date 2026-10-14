import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world3 from '../../scripts/entity-graph/registry/world-3/index.mjs';
import { costAt, costToMax, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world3);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

describe('atoms', () => {
  const byName = (name) => ofKind('atom').find((node) => node.name === name);

  it('build one page per atom', () => {
    expect(ofKind('atom')).toHaveLength(data.atomsInfo.length);
  });

  // Oracles: N.js AtomInfo desc fill, `{` = baseBonus * level and `<` = level.
  it.each([
    ['Nitrogen_-_Construction_Trimmer', 10, '+150%'],
    ['Oxygen_-_Library_Booker', 7, '+14%'],
    ['Oxygen_-_Library_Booker', 7, 'is increased by +7,']
  ])('%s at level %s reads %s', (name, level, expected) => {
    expect(levelledText(byName(name), level)).toContain(expected);
  });

  // Oracle: N.js AtomCost with no save (discount 1), floored below a million.
  it('price Hydrogen at 2 for level 1 and 163 for level 10', () => {
    expect([1, 10].map((level) => costAt(byName('Hydrogen_-_Stamp_Decreaser'), level))).toEqual([2, 163]);
  });

  it('price Particles up to the base cap of 20', () => {
    const hydrogen = byName('Hydrogen_-_Stamp_Decreaser');
    expect(hydrogen.cost.currency).toBe('Particles');
    expect(hydrogen.effect.cap).toBe(20);
    expect(costToMax(hydrogen)).toBe(20952);
  });

  it('label the level the way the collider does', () => {
    expect(ofKind('atom').map((node) => node.effect.levelLabel)).toEqual(ofKind('atom').map(() => 'Atom level'));
  });

  it('drop the live readout tail from Carbon and Fluoride', () => {
    expect(ofKind('atom').filter((node) => /total.bonus/i.test(levelledText(node, 1)))).toEqual([]);
  });
});
