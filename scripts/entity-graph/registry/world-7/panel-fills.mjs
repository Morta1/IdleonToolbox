// The levelled `$` a World 7 shop panel fills per upgrade id, as the wiki formula of each fill form z-processing names
// (the Jelly, Sushi and Minehead panelFills tables). An unknown form fills nothing, so its `$` is left as written.
const FORMS = {
  // 1 + L style: base + L.
  plusLevel: ({ base }) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: 1 } }),
  // base + L / divisor.
  plusLevelOver: ({ base, divisor }) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: 1 / divisor } }),
  // base + (offset + L) / divisor.
  offsetOver: ({ base, offset, divisor }) => ({ formula: 'growth', args: { func: 'bigBase', x1: base + offset / divisor, x2: 1 / divisor } }),
  // base + L, one more from level `at`. The game adds its `levelOffset` to a 0-based level, which is the wiki's 1-based L.
  plusLevelStep: ({ base, at, step }) => ({ formula: 'affineStep', args: { base, perLevel: 1, at, step } }),
  // ceil(1 / (chance (1 + L / divisor))).
  inverseCeil: ({ chance, divisor }) => ({ formula: 'inverseLinearCeil', args: { base: 1 / chance, perLevel: 1 / divisor } }),
  // The rounded cheaper-upgrades percent, 1 - 1 / (1 + L / 100).
  discountRounded: () => ({ formula: 'diminishingPercentRounded', args: { perLevel: 1 } })
};

export const panelFill = (fill) => (fill && FORMS[fill.form] ? FORMS[fill.form](fill) : null);
