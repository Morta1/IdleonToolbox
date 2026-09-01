// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import GenericUpgradeOptimizer from '@components/account/Misc/class-specific/GenericUpgradeOptimizer';
import darkTheme from '../../styles/theme/darkTheme';

const resourceNames = { 0: 'Purple', 1: 'Brown' };

const buildRow = ({ hoardingPercentChange = 0, grossPercentChange = 1, cost = 1e6 }) => ({
  name: 'Arcanist_Damage_II',
  index: 6,
  level: 10,
  x3: 0,
  x4: 999999,
  cost,
  statChanges: [{
    stat: 'damage',
    change: 1234,
    percentChange: grossPercentChange - hoardingPercentChange,
    grossChange: 1500,
    grossPercentChange,
    hoardingChange: 266,
    hoardingPercentChange
  }]
});

const renderOptimizer = (rows) => render(
  <ThemeProvider theme={darkTheme}>
    <GenericUpgradeOptimizer
      character={{ name: 'Tester' }}
      account={{ tesseract: { tachyons: [{ name: 'Purple', value: 1e9 }, { name: 'Brown', value: 1e9 }] } }}
      getOptimizedUpgradesFn={() => rows}
      upgradeCategories={{ damage: { name: 'Damage', stats: ['damage'], upgradeIndices: [6] } }}
      resourceNames={resourceNames}
      resourceKey="tesseract.tachyons"
      resourceImagePrefix="Tach"
      upgradeImagePrefix="ArcaneUpg"
      getResourceType={(upgrade) => upgrade.x3}
      tooltipText="test tooltip"
    />
  </ThemeProvider>
);

const withReason = (rows, reason) => {
  const list = [...rows];
  list.stoppedReason = reason;
  return list;
};

describe('GenericUpgradeOptimizer empty state', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('tells the user to hoard when holding beats every affordable purchase', () => {
    const { container } = renderOptimizer(withReason([], 'hoarding'));
    expect(container.textContent).toContain('Build up your stash instead');
    expect(container.textContent).not.toContain('No viable upgrades found');
  });

  it('keeps the plain message when there is genuinely nothing to buy', () => {
    const { container } = renderOptimizer(withReason([], 'no-candidates'));
    expect(container.textContent).toContain('No viable upgrades found');
    expect(container.textContent).not.toContain('Build up your stash');
  });

  it('falls back to the plain message when the optimizer reports no reason', () => {
    const { container } = renderOptimizer([]);
    expect(container.textContent).toContain('No viable upgrades found');
  });

  it('notes the early stop when a partial list came back', () => {
    const { container } = renderOptimizer(withReason([buildRow({ grossPercentChange: 2.1 })], 'hoarding'));
    expect(container.textContent).toContain('Stopping here');
  });
});

describe('GenericUpgradeOptimizer hoarding breakdown', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows gross gain and hoarding loss when spending gives back a hoarding bonus', () => {
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 2.1, hoardingPercentChange: 1.4 })]);
    const text = container.textContent;
    // net stays the headline number
    expect(text).toContain('+0.70%');
    expect(text).toContain('gross +2.10%, hoarding -1.40%, net +0.70%');
    // cost 1e6 at the default 1/hour rebuilds over a century, which is a placeholder rate, not a real one
    expect(text).not.toMatch(/stash back in/);
  });

  it('shows the stash rebuild time when the farming rate makes it plausible', () => {
    // 5 resources at the default 1/hour rebuilds in 5 hours
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 2.1, hoardingPercentChange: 1.4, cost: 5 })]);
    expect(container.textContent).toMatch(/stash back in/);
  });

  it('stays quiet when hoarding costs nothing', () => {
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 2.1, hoardingPercentChange: 0 })]);
    expect(container.textContent).toContain('+2.10%');
    expect(container.textContent).not.toContain('hoarding');
  });

  it('shows a tiny absolute loss when it still eats a real share of the gain', () => {
    // absolute loss is minute, but it swallows 90% of the gain - the case the old fixed
    // 0.005pp threshold hid from exactly the accounts with the deepest stashes
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 0.001, hoardingPercentChange: 0.0009 })]);
    expect(container.textContent).toContain('gross +0.0010%, hoarding -0.0009%, net +0.0001%');
  });

  it('stays quiet when the loss is large in absolute terms but trivial next to the gain', () => {
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 100, hoardingPercentChange: 0.5 })]);
    expect(container.textContent).not.toContain('hoarding');
  });

  it('tolerates rows from an optimizer that reports no hoarding data', () => {
    const row = buildRow({ grossPercentChange: 2.1 });
    delete row.statChanges[0].grossPercentChange;
    delete row.statChanges[0].hoardingPercentChange;
    const { container } = renderOptimizer([row]);
    expect(container.textContent).toContain('+2.10%');
    expect(container.textContent).not.toContain('hoarding');
  });
});

const buildTypedRow = ({ resourceType, cost = 5 }) => ({
  ...buildRow({ cost }),
  x3: resourceType
});

const seedSetting = (key, value) => window.localStorage.setItem(
  `tesseract.tachyons:genericUpgradeOptimizer:${key}`,
  JSON.stringify(value)
);

describe('GenericUpgradeOptimizer split by resource', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('leaves the sequence unsectioned by default', () => {
    const { container } = renderOptimizer([
      buildTypedRow({ resourceType: 0 }),
      buildTypedRow({ resourceType: 1 })
    ]);
    expect(container.textContent).not.toMatch(/upgrades? ·/);
  });

  it('sections the sequence by resource, ordered by first appearance', () => {
    seedSetting('splitByResource', true);
    const { container } = renderOptimizer([
      buildTypedRow({ resourceType: 1 }),
      buildTypedRow({ resourceType: 0 }),
      buildTypedRow({ resourceType: 1 })
    ]);
    const text = container.textContent;
    expect(text).toMatch(/Brown2 upgrades · 10/);
    expect(text).toMatch(/Purple1 upgrade · 5/);
    // Brown is farmed first because the optimizer wants it first
    expect(text.indexOf('Brown')).toBeLessThan(text.indexOf('Purple'));
  });

  it('keeps the real purchase order visible in the numbering', () => {
    seedSetting('splitByResource', true);
    seedSetting('viewMode', 'list');
    const { container } = renderOptimizer([
      buildTypedRow({ resourceType: 1 }),
      buildTypedRow({ resourceType: 0 }),
      buildTypedRow({ resourceType: 1 })
    ]);
    const firstCells = [...container.querySelectorAll('tbody tr')]
      .map(row => row.querySelector('td')?.textContent ?? '');
    expect(firstCells.filter(cell => /^\d+$/.test(cell))).toEqual(['1', '3', '2']);
  });
});

describe('GenericUpgradeOptimizer unlock marker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('marks a row that is still locked in game and says how far off it is', () => {
    const { container } = renderOptimizer([
      buildRow({}),
      { ...buildRow({}), lockedNow: true, unlocksAfterStep: 1 }
    ]);
    expect(container.textContent).toContain('Unlocks after 1 purchase');
  });

  it('pluralises the purchase count', () => {
    const { container } = renderOptimizer([
      { ...buildRow({}), lockedNow: true, unlocksAfterStep: 7 }
    ]);
    expect(container.textContent).toContain('Unlocks after 7 purchases');
  });

  it('leaves already unlocked rows unmarked', () => {
    const { container } = renderOptimizer([buildRow({})]);
    expect(container.textContent).not.toContain('Unlocks after');
    expect(container.textContent).not.toContain('Locked now');
  });
});

const buildReductionAccount = ({ bonus, spent }) => ({
  tesseract: { tachyons: [{ name: 'Purple', value: 1e9 }, { name: 'Brown', value: 1e9 }] },
  legendTalents: { talents: [{ originalIndex: 23, bonus }] },
  accountOptions: { 480: spent }
});

const renderWithReductions = ({ bonus, spent, showMasterclassReduction = true }) => {
  const calls = [];
  render(
    <ThemeProvider theme={darkTheme}>
      <GenericUpgradeOptimizer
        character={{ name: 'Tester' }}
        account={buildReductionAccount({ bonus, spent })}
        getOptimizedUpgradesFn={(character, account, category, max, options) => {
          calls.push(options);
          return [];
        }}
        upgradeCategories={{ damage: { name: 'Damage', stats: ['damage'], upgradeIndices: [6] } }}
        resourceNames={resourceNames}
        resourceKey="tesseract.tachyons"
        resourceImagePrefix="Tach"
        upgradeImagePrefix="ArcaneUpg"
        getResourceType={(upgrade) => upgrade.x3}
        showMasterclassReduction={showMasterclassReduction}
        tooltipText="test tooltip"
      />
    </ThemeProvider>
  );
  return calls;
};

describe('GenericUpgradeOptimizer masterclass reductions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('only offers the reductions the legend talent has left', () => {
    // the game discounts while accountOptions[480] < the talent bonus, so 8 granted and 12
    // already spent means nothing is left to discount
    const calls = renderWithReductions({ bonus: 8, spent: 12 });
    expect(calls.at(-1).masterClassReduction).toBe(0);
  });

  it('counts the unspent grant when purchases remain', () => {
    const calls = renderWithReductions({ bonus: 8, spent: 3 });
    expect(calls.at(-1).masterClassReduction).toBe(5);
  });

  it('ignores a stale stored seed when the field is hidden', () => {
    seedSetting('masterClassReduction', 8);
    const calls = renderWithReductions({ bonus: 8, spent: 12, showMasterclassReduction: false });
    expect(calls.at(-1).masterClassReduction).toBe(0);
  });

  it('still honours a manual override where the field is editable', () => {
    seedSetting('masterClassReduction', 4);
    const calls = renderWithReductions({ bonus: 8, spent: 12 });
    expect(calls.at(-1).masterClassReduction).toBe(4);
  });
});
