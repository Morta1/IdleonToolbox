import { describe, expect, it } from 'vitest';
import {
  additiveGroup,
  evaluateBreakdownNode,
  flat,
  formatBreakdownValue,
  multiplier,
  percent,
  productGroup,
  sumGroup
} from '@parsers/breakdown';
import { buildView, collectGroupKeys, flattenView, hasInactiveNodes, toBreakdownTree } from '@components/common/Breakdown/breakdownView';

const options = { valueNotation: 'MultiplierInfo', query: '', showInactive: false, pinned: new Set() };

const tree = [
  productGroup('Multipliers', [
    multiplier('Small', 1.5),
    additiveGroup('Group', [percent('Big', 90), percent('Zero', 0), sumGroup('Nested', [percent('Deep', 10)])]),
    multiplier('Inactive', 1)
  ]),
  flat('Flat', 12)
];

describe('breakdown tree', () => {
  it('evaluates sums, products and additive groups', () => {
    // additive: 1 + (90 + 0 + 10) / 100 = 2, product: 1.5 * 2 * 1 = 3
    expect(evaluateBreakdownNode(tree[0])).toBeCloseTo(3);
    expect(evaluateBreakdownNode(sumGroup('Power', [flat('a', 4), flat('b', 5)], { power: 0.5 }))).toBeCloseTo(3);
  });

  it('formats values by unit', () => {
    expect(formatBreakdownValue(25, 'percent')).toBe('+25%');
    expect(formatBreakdownValue(-1.06, 'percent')).toBe('-1.06%');
    expect(formatBreakdownValue(1.9, 'multiplier')).toBe('×1.9');
    expect(formatBreakdownValue(1330000, 'flat')).toBe('1.33M');
  });
});

describe('buildView', () => {
  it('hides inactive lines, sorts each group by size and shows group effects', () => {
    const [multipliers, flatLine] = buildView(tree, options);
    expect(multipliers.display).toBe('×3');
    expect(multipliers.children.map(({ name }) => name)).toEqual(['Group', 'Small']);
    expect(multipliers.children[0].children.map(({ name }) => name)).toEqual(['Big', 'Nested']);
    // An additive group shows only the multiplier it becomes
    expect(multipliers.children[0].display).toBe('×2');
    expect(flatLine.display).toBe('12');
    expect(hasInactiveNodes(tree)).toBe(true);
  });

  it('shows inactive lines on request', () => {
    const [multipliers] = buildView(tree, { ...options, showInactive: true });
    expect(multipliers.children.map(({ name }) => name)).toContain('Inactive');
  });

  it('keeps only matches when searching, and every line of a matching group', () => {
    expect(flattenView(buildView(tree, { ...options, query: 'deep' })).map(({ name }) => name))
      .toEqual(['Multipliers', 'Group', 'Nested', 'Deep']);
    expect(flattenView(buildView(tree, { ...options, query: 'group' })).map(({ name }) => name))
      .toEqual(['Multipliers', 'Group', 'Big', 'Nested', 'Deep']);
  });

  it('floats pinned lines to the top of their group', () => {
    const [plain] = buildView(tree, options);
    const smallKey = plain.children.find(({ name }) => name === 'Small').pinKey;
    const [pinnedView] = buildView(tree, { ...options, pinned: new Set([smallKey]) });
    expect(pinnedView.children[0].name).toBe('Small');
  });

  it('lists every group key for expand all', () => {
    expect(collectGroupKeys(buildView(tree, options))).toHaveLength(3);
  });
});

describe('older categories shape', () => {
  const legacy = {
    statName: 'Drop Rate',
    totalValue: '5.2',
    categories: [{
      name: 'Additive',
      sources: [{ name: 'Luck', value: 1.4 }, { name: 'Card', value: 0, formatted: '0%' }],
      subSections: [{ name: 'Gear', sources: [{ name: 'Equipment', value: 2 }] }]
    }]
  };

  it('keeps the order, the notation and the saved pin keys', () => {
    const [category] = buildView(toBreakdownTree(legacy, 'MultiplierInfo'), options);
    expect(category.display).toBe('3 sources');
    expect(category.children.map(({ name, display, pinKey }) => [name, display, pinKey])).toEqual([
      ['Luck', '1.40', '0-Luck'],
      ['Card', '0%', '0-Card'],
      ['Gear', '1 sources', expect.any(String)]
    ]);
    expect(category.children[2].children[0].pinKey).toBe('0-0-Equipment');
    expect(hasInactiveNodes(toBreakdownTree(legacy, 'MultiplierInfo'))).toBe(false);
  });
});
