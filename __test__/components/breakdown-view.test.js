import { describe, expect, it } from 'vitest';
import {
  additiveGroup,
  createBreakdown,
  divideGroup,
  evaluateBreakdown,
  findBreakdownNode,
  getBreakdownNodeUnit,
  info,
  isDisplayOnlyBreakdown,
  listGroup,
  minGroup,
  flatLines,
  evaluateBreakdownNode,
  flat,
  formatBreakdownValue,
  multiplier,
  NUMBERED_GROUP,
  percent,
  productGroup,
  sumGroup
} from '@parsers/breakdown';
import { buildView, collectGroupKeys, flattenView, hasInactiveNodes, toBreakdownTree } from '@components/common/Breakdown/breakdownView';
import { computeGains, computeShares, formatShare } from '@components/common/Breakdown/breakdownInsights';

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
    expect(multipliers.children[0].children.map(({ name }) => name)).toEqual(['Big', 'Deep']);
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
      .toEqual(['Multipliers', 'Group', 'Deep']);
    expect(flattenView(buildView(tree, { ...options, query: 'group' })).map(({ name }) => name))
      .toEqual(['Multipliers', 'Group', 'Big', 'Deep']);
  });

  it('floats pinned lines to the top of their group', () => {
    const [plain] = buildView(tree, options);
    const smallKey = plain.children.find(({ name }) => name === 'Small').pinKey;
    const [pinnedView] = buildView(tree, { ...options, pinned: new Set([smallKey]) });
    expect(pinnedView.children[0].name).toBe('Small');
  });

  it('shows a group with one visible entry as that entry, with the group value', () => {
    const nodes = [
      additiveGroup('Lonely', [percent('Only', 25), percent('Off', 0)]),
      sumGroup('Capped', [flat('Raw', 12)], { max: 10 }),
      productGroup('Outer', [productGroup('Inner', [multiplier('a', 2), multiplier('b', 3)])])
    ];
    const [lonely, capped, outer] = buildView(nodes, options);
    expect([lonely.name, lonely.display, lonely.children]).toEqual(['Only', '×1.25', undefined]);
    expect([capped.name, capped.display]).toEqual(['Raw', '10']);
    expect([outer.name, outer.children.map(({ name }) => name)]).toEqual(['Inner', ['b', 'a']]);
    // Shown inactive lines count, so the group stays
    expect(buildView(nodes, { ...options, showInactive: true })[0].name).toBe('Lonely');
  });

  it('sorts a one-unit top level by size, and keeps a mixed or unknown top level in order', () => {
    const lines = [percent('Small', 5), percent('Big', 50)];
    expect(buildView(lines, { ...options, rootCombine: 'additive' }).map(({ name }) => name)).toEqual(['Big', 'Small']);
    expect(buildView(lines, options).map(({ name }) => name)).toEqual(['Small', 'Big']);
    const mixed = [flat('Base', 3), multiplier('Speed', 9)];
    expect(buildView(mixed, { ...options, rootCombine: 'product' }).map(({ name }) => name)).toEqual(['Base', 'Speed']);
  });

  it('numbers unnamed groups top to bottom, nested ones under their numbered parent, and keeps the numbers while searching', () => {
    const nodes = [
      productGroup(NUMBERED_GROUP, [
        multiplier('Card', 1.5),
        additiveGroup(NUMBERED_GROUP, [percent('Mastery', 25), percent('Stamp', 5)]),
        productGroup('Scaled', [multiplier('Talent', 4), additiveGroup(NUMBERED_GROUP, [percent('Bubble', 10), percent('Vial', 20)])])
      ]),
      productGroup('Named', [multiplier('x', 2), additiveGroup(NUMBERED_GROUP, [percent('p', 10), percent('q', 5)])])
    ];
    const names = flattenView(buildView(nodes, options)).map(({ name }) => name);
    expect(names).toEqual(['Group 1', 'Scaled', 'Talent', 'Group 1.1', 'Vial', 'Bubble', 'Card', 'Group 1.2', 'Mastery',
      'Stamp', 'Named', 'x', 'Group 2', 'p', 'q']);
    expect(flattenView(buildView(nodes, { ...options, query: 'stamp' })).map(({ name }) => name))
      .toEqual(['Group 1', 'Group 1.2', 'Stamp']);
  });

  it('lists every group key for expand all', () => {
    expect(collectGroupKeys(buildView(tree, options))).toHaveLength(2);
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

describe('list helpers', () => {
  it('turns name/value entries into flat lines that keep their formatting', () => {
    expect(flatLines([{ name: 'Kunai', value: 1657, formatted: '1,657' }, { name: 'Gloves', value: 3 }])).toEqual([
      { name: 'Kunai', value: 1657, unit: 'flat', formatted: '1,657' },
      { name: 'Gloves', value: 3, unit: 'flat' }
    ]);
  });

  it('finds a node by name inside nested groups', () => {
    expect(findBreakdownNode(tree, 'Deep')).toEqual(percent('Deep', 10));
    expect(findBreakdownNode(tree, 'Group').combine).toBe('additive');
    expect(findBreakdownNode(tree, 'Missing')).toBeUndefined();
  });

  it('keeps small amounts readable instead of rounding them to 0', () => {
    expect(formatBreakdownValue(0.004, 'percent')).toBe('+0.004%');
    expect(formatBreakdownValue(0.000012345, 'flat')).toBe('0.0000123');
    expect(formatBreakdownValue(0, 'flat')).toBe('0');
    expect(formatBreakdownValue(0.25, 'flat')).toBe('0.25');
  });
});

describe('combine modes, bounds and the root', () => {
  it('divides the first child by the product of the rest', () => {
    const rate = divideGroup('Time', [flat('Base', 120), multiplier('Speed', 2), additiveGroup('More', [percent('a', 50)])]);
    expect(evaluateBreakdownNode(rate)).toBeCloseTo(40);
    expect(getBreakdownNodeUnit(rate)).toBe('flat');
  });

  it('takes the smallest child', () => {
    const capped = minGroup('Value', [flat('Uncapped', 12345), flat('Cap', 10000)]);
    expect(evaluateBreakdownNode(capped)).toBe(10000);
    expect(getBreakdownNodeUnit(capped)).toBe('flat');
  });

  it('counts a multiplier inside an additive group as its increase', () => {
    // 1 + (34 + 16) / 100
    expect(evaluateBreakdownNode(additiveGroup('Group', [multiplier('Term', 1.34), percent('Bonus', 16)]))).toBeCloseTo(1.5);
    // A nested additive group adds its percent, not 1 + percent
    expect(evaluateBreakdownNode(additiveGroup('Outer', [additiveGroup('Inner', [percent('a', 20)]), percent('b', 5)])))
      .toBeCloseTo(1.25);
  });

  it('rounds first, then clamps', () => {
    expect(evaluateBreakdownNode(sumGroup('Floor', [flat('a', 2.9)], { round: 'floor' }))).toBe(2);
    expect(evaluateBreakdownNode(sumGroup('Ceil', [flat('a', 2.1)], { round: 'ceil' }))).toBe(3);
    expect(evaluateBreakdownNode(sumGroup('Step', [flat('a', 2.234)], { round: 'round', step: 0.1 }))).toBe(2.2);
    expect(evaluateBreakdownNode(sumGroup('Capped', [flat('a', 12.6)], { round: 'round', max: 10 }))).toBe(10);
    expect(evaluateBreakdownNode(sumGroup('Floored', [flat('a', 0.2)], { min: 1 }))).toBe(1);
  });

  it('skips list children when combining', () => {
    const group = productGroup('Multipliers', [multiplier('a', 2), listGroup('Reference', [info('Kills', 500)])]);
    expect(evaluateBreakdownNode(group)).toBe(2);
    expect(hasInactiveNodes([group])).toBe(false);
  });

  it('combines the top level as the root says, product by default', () => {
    const tree = [flat('Base', 58), additiveGroup('Rate', [percent('a', 90)])];
    expect(evaluateBreakdown(createBreakdown('Product', 0, tree))).toBeCloseTo(58 * 1.9);
    expect(evaluateBreakdown(createBreakdown('Respawn', 0, tree, { combine: 'divide' }))).toBeCloseTo(58 / 1.9);
    expect(evaluateBreakdown(createBreakdown('Rounded', 0, tree, { combine: 'divide', round: 'ceil' }))).toBe(31);
    expect(evaluateBreakdown(createBreakdown('Sum', 0, [flat('a', 1), flat('b', 2), listGroup('c', [flat('d', 9)])],
      { combine: 'sum' }))).toBe(3);
  });

  it('keeps the label argument and only sets the options it is given', () => {
    expect(createBreakdown('Stat', 1, [], 'Tab')).toEqual({ statName: 'Stat', totalValue: 1, tree: [], label: 'Tab' });
    expect(createBreakdown('Stat', 1, [], { label: 'Tab', combine: 'sum', round: undefined }))
      .toEqual({ statName: 'Stat', totalValue: 1, tree: [], label: 'Tab', combine: 'sum' });
    expect(isDisplayOnlyBreakdown(createBreakdown('Stat', '', [], { combine: 'list' }))).toBe(true);
    expect(isDisplayOnlyBreakdown(createBreakdown('Stat', 1, []))).toBe(false);
  });

  it('shows a bounded group by its bounded value and keeps divide and min children in order', () => {
    const nodes = [
      divideGroup('Time', [flat('Base', 10), multiplier('Speed', 4)], { round: 'ceil' }),
      minGroup('Value', [flat('Uncapped', 3), flat('Cap', 50)])
    ];
    const [time, value] = buildView(nodes, options);
    expect(time.display).toBe('3');
    expect(time.children.map(({ name }) => name)).toEqual(['Base', 'Speed']);
    expect(value.display).toBe('3');
    expect(value.children.map(({ name }) => name)).toEqual(['Uncapped', 'Cap']);
  });
});

describe('share and gain', () => {
  const byName = (map) => Object.fromEntries([...map].map(([node, value]) => [node.name, Number(value.toFixed(4))]));

  it('splits a product by ln(factor) and an additive group by points, leaving a base amount out', () => {
    // ln 1.5 : ln 2 of the 100%, then Group's 63.09% split 90 : 0 : 10
    expect(byName(computeShares(tree, 'product'))).toEqual({
      Multipliers: 100, Small: 36.9070, Group: 63.0930, Inactive: 0, Big: 56.7837, Zero: 0, Nested: 6.3093, Deep: 6.3093
    });
  });

  it('gives a gain to the outermost group that takes percent, re-evaluated through caps', () => {
    // +10 points: Group 2 -> 2.1, total 1.5 * 2.1 vs 1.5 * 2
    expect(byName(computeGains(tree, 'product'))).toEqual({ Group: 5 });
    const capped = [additiveGroup('Capped', [percent('Full', 50)], { max: 1.5 })];
    expect(byName(computeGains(capped, 'product'))).toEqual({ Capped: 0 });
  });

  it('never rounds a share to 0% or 100% that is not', () => {
    expect([0, 0.0018, 4.567, 43.31, 99.998, 100].map(formatShare)).toEqual(['0%', '<0.1%', '4.57%', '43.3%', '>99.9%', '100%']);
  });

  it('puts both on the rows the drawer shows', () => {
    const [multipliers] = buildView(tree, { ...options, gains: computeGains(tree, 'product'), shares: computeShares(tree, 'product') });
    const group = multipliers.children.find(({ name }) => name === 'Group');
    expect([multipliers.share, group.share.toFixed(2), group.gain.toFixed(2)]).toEqual([100, '63.09', '5.00']);
  });
});
