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

  it('price in Particles', () => {
    expect(byName('Hydrogen_-_Stamp_Decreaser').cost.currency).toBe('Particles');
  });

  // The real cap is 20 plus unlocks (atomCollider.ts), so the calculator must not stop at the base.
  it('leave the level uncapped and state the base max level on every atom', () => {
    const base = data.atomsInfo.map(() => ({ label: 'Base max level', value: expect.stringMatching(/^20 \(raised by .*Isotope Discovery.*Atomic Potential.*Higgs Boson/) }));
    expect(ofKind('atom').map((node) => node.effect.cap)).toEqual(data.atomsInfo.map(() => null));
    expect(ofKind('atom').map((node) => node.fields)).toEqual(base.map((field) => [field]));
    expect(costToMax(byName('Hydrogen_-_Stamp_Decreaser'))).toBeNull();
  });

  it('label the level the way the collider does', () => {
    expect(ofKind('atom').map((node) => node.effect.levelLabel)).toEqual(ofKind('atom').map(() => 'Atom level'));
  });

  it('drop the live readout tail from Carbon and Fluoride', () => {
    expect(ofKind('atom').filter((node) => /total.bonus/i.test(levelledText(node, 1)))).toEqual([]);
  });
});
